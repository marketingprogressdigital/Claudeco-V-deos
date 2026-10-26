"""Trilha original do vídeo institucional do Dr. Cristovão Carvalho.

Sintetizada aqui mesmo, sem amostras de terceiros. Clima pedido pela marca:
segura, acessível e objetiva. Por isso dó maior, 100 BPM, dedilhado limpo,
bumbo suave e piano, crescendo até a cena das cidades e resolvendo no final.

Uso: python3 trilha.py [saida.wav]
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI.parent))
import nucleo  # noqa: E402
from sintese import (SR, baixo, bumbo, chocalho, dedilhado, impacto, pad, piano,  # noqa: E402
                     reverb_ir, subida)

ACORDES = {
    "C": (36, [52, 55, 60, 64], [60, 64, 67, 72, 76]),
    "G": (43, [50, 55, 59, 62], [59, 62, 67, 71, 74]),
    "Am": (45, [52, 57, 60, 64], [57, 60, 64, 69, 72]),
    "F": (41, [53, 57, 60, 65], [57, 60, 65, 69, 72]),
    "Csus": (36, [53, 55, 60, 65], [60, 65, 67, 72, 77]),
}

PLANO = {
    "abertura": ["Am", "F"],
    "apresentacao": ["C", "G", "Am"],
    "valores": ["F", "C", "G"],
    "planejamento": ["Am", "F", "G"],
    "cidade": ["C", "G", "Am"],
    "final": ["F", "G"],
    "encerramento": ["Csus", "C", "C"],
    "corpo": ["C", "G", "Am", "F"],
}
GANHOS = {"abertura": 0.55, "apresentacao": 0.72, "valores": 0.9, "planejamento": 0.68,
          "cidade": 1.0, "final": 0.9, "encerramento": 0.78, "corpo": 0.85}
COM_BATIDA = {"apresentacao", "valores", "cidade", "final", "corpo"}
CICLICAS = {"corpo"}


def compor(roteiro):
    bpm = roteiro["bpm"]
    barra = 4 * 60 / bpm
    beat = 60 / bpm
    cenas, t = [], 0.0
    for c in roteiro["cenas"]:
        d = c["compassos"] * barra
        cenas.append((c, t, d))
        t += d
    total = t
    N = int((total + 0.3) * SR)
    seco = np.zeros((N, 2))
    pads = np.zeros((N, 2))
    graves = np.zeros(N)
    batida = np.zeros((N, 2))

    def poe(buf, sinal, em, pan=0.5):
        i = int(em * SR)
        if i < 0:
            sinal, i = sinal[-i:], 0
        n = min(len(sinal), N - i)
        if n <= 0:
            return
        if buf.ndim == 1:
            buf[i:i + n] += sinal[:n]
        elif sinal.ndim == 2:
            buf[i:i + n] += sinal[:n]
        else:
            buf[i:i + n, 0] += sinal[:n] * np.sqrt(1 - pan)
            buf[i:i + n, 1] += sinal[:n] * np.sqrt(pan)

    semente = 0
    for c, t0, dur in cenas:
        cid = c["id"]
        acordes = PLANO.get(cid, ["C"])
        n_bar = max(1, int(np.ceil(dur / barra - 1e-6)))
        for b in range(n_bar):
            ini = t0 + b * barra
            d = min(t0 + dur, ini + barra) - ini
            if d <= 0.05:
                continue
            i_ac = b % len(acordes) if cid in CICLICAS else min(b, len(acordes) - 1)
            raiz, voz, arp = ACORDES[acordes[i_ac]]
            poe(pads, pad(voz, d + 1.0, 1.25), ini - 0.25)
            if cid != "abertura":
                poe(graves, baixo(raiz, d + 0.4), ini)

            passos = int(round(d / (beat / 2)))
            if cid == "abertura":
                for k, m in enumerate([arp[2], arp[1], arp[0]]):
                    poe(seco, piano(m + 12, 0.9, 0.32), ini + k * beat * 1.25 + 0.15, 0.3 + 0.2 * k)
            elif cid in ("apresentacao", "valores", "cidade", "final", "planejamento", "corpo"):
                ordem = [0, 2, 1, 3, 2, 4, 3, 2]
                for k in range(passos):
                    if cid == "planejamento" and k % 2:
                        continue
                    semente += 1
                    m = arp[ordem[k % 8]]
                    v = 0.34 + 0.1 * (k % 4 == 0)
                    poe(seco, dedilhado(m, beat * 0.45, v, 0.55, semente), ini + k * beat / 2,
                        0.25 if k % 2 else 0.75)
                if cid in ("valores", "cidade", "final"):
                    for k in (0, 2):
                        if k * beat < d:
                            for m in voz[1:]:
                                poe(seco, piano(m + 12, beat * 0.8, 0.22), ini + k * beat, 0.5)
            elif cid == "encerramento":
                if b == 0:
                    for k, m in enumerate(voz):
                        poe(seco, piano(m + 12, barra * 2, 0.32), ini + k * 0.06, 0.3 + 0.13 * k)
                elif b == 1:
                    poe(seco, piano(raiz + 24, barra * 1.5, 0.45), ini, 0.5)
                    poe(seco, piano(arp[4] + 12, barra * 1.5, 0.22), ini + beat, 0.65)

            if cid in COM_BATIDA:
                for k in range(passos):
                    em = ini + k * beat / 2
                    if k % 4 == 0 and not (cid == "apresentacao" and b == 0):
                        poe(batida, bumbo(0.42), em, 0.5)
                    poe(batida, chocalho(0.05 if k % 2 == 0 else 0.08), em, 0.62)

    # pontuações: impacto suave em cada palavra e na entrada da cidade
    for c, t0, dur in cenas:
        for p in c.get("palavras", []):
            poe(graves, impacto(N, t0 + p["compasso"] * barra, 0.18), 0)
        if c["id"] == "cidade":
            poe(seco, subida(barra, N, t0) * 0.8, 0)
            poe(graves, impacto(N, t0, 0.45), 0)
        if c["id"] == "encerramento":
            poe(graves, impacto(N, t0, 0.3), 0)
    # acentos pedidos pela edição (ex.: entrada de cada cidade)
    for em in roteiro.get("acentos", []):
        if em > barra * 0.5:
            poe(seco, subida(barra * 0.5, N, em) * 0.6, 0)
        poe(graves, impacto(N, em, 0.35), 0)

    ir = reverb_ir(rt60=2.1, n_seg=3.0)
    molhado = np.stack([fftconvolve(seco[:, k] + pads[:, k] * 0.5, ir[:, k])[:N] for k in range(2)], 1)
    mix = seco * 0.8 + pads * 0.75 + molhado * 0.42 + graves[:, None] * 0.9 + batida * 0.9

    tt = np.arange(N) / SR
    g = np.ones(N)
    for c, t0, dur in cenas:
        g[int(t0 * SR):int((t0 + dur) * SR)] = GANHOS.get(c["id"], 0.8)
    k = int(0.6 * SR)
    g = np.convolve(np.pad(g, k, mode="edge"), np.ones(k) / k, "same")[k:-k]
    mix *= g[:, None]

    mix = sosfilt(butter(2, 32, "high", fs=SR, output="sos"), mix, axis=0)
    mix += sosfilt(butter(1, 4500, "high", fs=SR, output="sos"), mix, axis=0) * 0.3
    mix *= np.minimum(1, tt / 0.4)[:, None]
    mix *= np.clip((total + 0.3 - tt) / 2.0, 0, 1)[:, None] ** 1.5
    pico = np.abs(mix).max()
    mix = np.tanh(mix / pico * 1.1) / np.tanh(1.1) * 0.89
    return mix.astype(np.float32), total


def salvar_wav(caminho, audio):
    nucleo.salvar_wav(caminho, audio, SR)


if __name__ == "__main__":
    roteiro = json.loads((AQUI / "roteiro.json").read_text())
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "saida" / "trilha.wav"
    destino.parent.mkdir(parents=True, exist_ok=True)
    audio, total = compor(roteiro)
    salvar_wav(destino, audio)
    print(f"trilha: {destino} ({total:.2f} s)")
