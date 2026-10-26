"""Trilha original do vídeo Bastidores (Dr. Marcel Giolo).

Composição sintetizada aqui mesmo, sem amostras de terceiros, então não há
direito autoral de outra pessoa envolvido. Estrutura segue o roteiro.json:
cada cena começa um novo trecho da progressão, para a música respirar junto
com os cortes.

Clima: piano cinematográfico em ré menor, pad quente, batida de coração
discreta na cirurgia, clímax no primeiro olhar e resolução em fá maior.

Uso: python3 trilha.py [saida.wav]
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt, stft, istft

SR = 48000
AQUI = Path(__file__).parent
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# Acordes: baixo + voicing do pad + notas do arpejo
ACORDES = {
    "Dm": (38, [50, 53, 57, 64], [62, 65, 69, 72, 74]),
    "Bb": (34, [50, 53, 57, 58], [58, 62, 65, 69, 70]),
    "F": (41, [53, 57, 60, 64], [60, 64, 65, 69, 72]),
    "C": (36, [52, 55, 60, 62], [60, 62, 67, 72, 74]),
    "Gm": (43, [50, 55, 58, 62], [62, 65, 67, 70, 74]),
    "Fsus": (41, [53, 58, 60, 65], [60, 65, 70, 72, 77]),
}


def env_adsr(n, a, r, sus=1.0):
    e = np.full(n, sus)
    na, nr = int(a * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, sus, na) ** 1.5
    if nr > 0 and nr < n:
        e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def piano(midi, dur, vel=0.6):
    """Nota de piano por síntese aditiva com leve inarmonicidade."""
    f0 = hz(midi)
    n = int((dur + 2.5) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    B = 0.00035
    for k in range(1, 11):
        fk = k * f0 * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        amp = (1 / k ** 1.25) * (0.55 + 0.45 * vel) ** (k * 0.35)
        t60 = max(0.35, 3.6 * (f0 / 260) ** -0.35 / (1 + 0.45 * (k - 1)))
        out += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-6.9 * t / t60)
    ataque = np.minimum(1, t / 0.004)
    # abafa a nota ao soltar a tecla
    solta = np.where(t > dur, np.exp(-(t - dur) * 5.0), 1.0)
    return out * ataque * solta * vel


def pad(notas, dur, brilho=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notas:
        for det, pan in ((-6, 0.25), (0, 0.5), (6, 0.75)):
            f = hz(m) * 2 ** (det / 1200)
            fase = rng.uniform(0, 6.28, 24)
            onda = np.zeros(n)
            for k in range(1, 24):
                if k * f > 5000 * brilho:
                    break
                onda += np.sin(2 * np.pi * k * f * t + fase[k]) / k * np.exp(-k / (5.5 * brilho))
            lfo = 1 + 0.12 * np.sin(2 * np.pi * rng.uniform(0.1, 0.25) * t + rng.uniform(0, 6))
            L += onda * lfo * (1 - pan)
            R += onda * lfo * pan
    e = env_adsr(n, min(1.4, dur * 0.4), min(1.6, dur * 0.45))
    return np.stack([L * e, R * e], 1) * 0.05


def baixo(midi, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * env_adsr(n, 0.25, 0.8) * 0.06


def batimento(n_total, inicio, fim, bpm, ganho=0.5):
    """Batida de coração (tum tum) no tempo da música."""
    out = np.zeros(n_total)
    beat = 60 / bpm
    t0 = inicio
    while t0 < fim - 0.05:
        for atraso, g in ((0.0, 1.0), (0.24, 0.6)):
            i = int((t0 + atraso) * SR)
            n = int(0.45 * SR)
            if i + n > n_total:
                continue
            t = np.arange(n) / SR
            freq = 38 + 34 * np.exp(-t * 28)
            fase = 2 * np.pi * np.cumsum(freq) / SR
            out[i:i + n] += np.sin(fase) * np.exp(-t * 9) * g * ganho
        t0 += beat
    return out


def subida(dur, n_total, fim):
    """Ruído filtrado que sobe até o clímax."""
    n = int(dur * SR)
    ruido = rng.standard_normal(n)
    f, tt, Z = stft(ruido, SR, nperseg=2048)
    prog = np.linspace(0, 1, Z.shape[1])
    centro = 250 * (6500 / 250) ** prog
    mascara = np.exp(-((np.log(f[:, None] + 1) - np.log(centro[None, :])) ** 2) / 0.35)
    _, y = istft(Z * mascara * prog[None, :] ** 2, SR, nperseg=2048)
    y = y[:n] / (np.abs(y).max() + 1e-9)
    out = np.zeros(n_total)
    i = int(fim * SR) - n
    out[i:i + n] += y * 0.16
    return out


def impacto(n_total, em, ganho=0.6):
    out = np.zeros(n_total)
    n = int(3.0 * SR)
    i = int(em * SR)
    n = min(n, n_total - i)
    t = np.arange(n) / SR
    freq = 32 + 30 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 1.6)
    sos = butter(2, 900, "low", fs=SR, output="sos")
    s += sosfilt(sos, rng.standard_normal(n)) * np.exp(-t * 7) * 0.5
    out[i:i + n] += s * ganho
    return out


def reverb_ir(rt60=3.2, n_seg=4.0):
    n = int(n_seg * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    bandas = [(80, 600, rt60), (600, 2500, rt60 * 0.8), (2500, 9000, rt60 * 0.5)]
    for c in range(2):
        for lo, hi, rt in bandas:
            sos = butter(2, [lo, hi], "band", fs=SR, output="sos")
            ir[:, c] += sosfilt(sos, rng.standard_normal(n)) * np.exp(-6.9 * t / rt)
    pre = int(0.018 * SR)
    ir = np.concatenate([np.zeros((pre, 2)), ir])
    return ir / np.sqrt((ir ** 2).sum(0))


def compor(roteiro):
    bpm = roteiro["bpm"]
    barra = 4 * 60 / bpm
    beat = 60 / bpm
    cenas = []
    t = 0.0
    for c in roteiro["cenas"]:
        d = c["compassos"] * barra
        cenas.append((c["id"], t, d))
        t += d
    total = t
    N = int((total + 0.2) * SR)

    seco = np.zeros((N, 2))     # piano e elementos que vão para o reverb
    pads = np.zeros((N, 2))
    graves = np.zeros(N)

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

    plano = {
        "abertura": ["Dm", "Dm"],
        "marcacao": ["Dm", "Bb", "F", "C"],
        "foliculo": ["Gm"],
        "cirurgia": ["Dm", "Bb", "F", "C"],
        "pos": ["Bb", "F", "C"],
        "encerramento": ["Fsus", "F"],
    }

    for cid, t0, dur in cenas:
        acordes = plano.get(cid, ["Dm"])
        n_bar = max(1, int(np.ceil(dur / barra - 1e-6)))
        for b in range(n_bar):
            ini = t0 + b * barra
            fim_b = min(t0 + dur, ini + barra)
            d = fim_b - ini
            if d <= 0.05:
                continue
            nome = acordes[min(b, len(acordes) - 1)]
            raiz, voz, arp = ACORDES[nome]
            brilho = {"pos": 1.5, "encerramento": 1.3}.get(cid, 1.0)
            poe(pads, pad(voz, d + 1.2, brilho), ini - 0.3)

            if cid in ("marcacao", "cirurgia", "pos", "foliculo", "encerramento"):
                poe(graves, baixo(raiz, d + 0.6), ini)

            if cid == "abertura":
                for k, m in enumerate([74, 69, 65]):
                    poe(seco, piano(m, 1.2, 0.45), ini + k * beat * 1.5 + 0.2, 0.4 + 0.1 * k)
            elif cid == "marcacao":
                # semínimas, piano contemplativo
                for k in range(4):
                    m = arp[[0, 2, 1, 3][k]]
                    poe(seco, piano(m, beat * 0.9, 0.42 + 0.06 * (k == 0)), ini + k * beat, 0.35 + 0.1 * k)
            elif cid == "foliculo":
                for k in range(8):
                    m = arp[[0, 1, 2, 3, 4, 3, 2, 1][k]] + 12
                    poe(seco, piano(m, beat * 0.4, 0.28), ini + k * beat / 2, 0.3 + 0.05 * k)
            elif cid == "cirurgia":
                # colcheias, ganha movimento
                ordem = [0, 2, 1, 3, 2, 4, 3, 1]
                for k in range(8):
                    m = arp[ordem[k]]
                    v = 0.36 + 0.08 * (k % 4 == 0) + 0.04 * b
                    poe(seco, piano(m, beat * 0.45, v), ini + k * beat / 2, 0.3 + 0.05 * (k % 5))
            elif cid == "pos":
                ordem = [0, 2, 4, 3, 1, 2, 3, 4]
                for k in range(8):
                    poe(seco, piano(arp[ordem[k]], beat * 0.45, 0.42), ini + k * beat / 2, 0.3 + 0.06 * (k % 5))
                # sinos agudos no primeiro olhar
                for k in (0, 3):
                    poe(seco, piano(arp[4] + 12, 1.5, 0.25), ini + k * beat + beat / 4, 0.7)
                poe(seco, piano(raiz + 24, beat * 3, 0.5), ini, 0.5)
            elif cid == "encerramento":
                if b == 0:
                    for k, m in enumerate([65, 69, 72, 76]):
                        poe(seco, piano(m, barra * 1.8, 0.4), ini + k * beat * 0.5, 0.35 + 0.1 * k)
                else:
                    poe(seco, piano(53, barra, 0.5), ini, 0.5)
                    poe(seco, piano(77, barra, 0.3), ini + beat, 0.6)

    # batida de coração durante a cirurgia
    for cid, t0, dur in cenas:
        if cid == "cirurgia":
            hb = batimento(N, t0, t0 + dur, bpm, 0.42)
            poe(graves, hb, 0)
        if cid == "pos":
            poe(seco, subida(barra, N, t0), 0)
            poe(graves, impacto(N, t0, 0.55), 0)
        if cid == "marcacao":
            poe(graves, impacto(N, t0, 0.3), 0)

    ir = reverb_ir()
    molhado = np.stack([fftconvolve(seco[:, c] + pads[:, c] * 0.6, ir[:, c])[:N] for c in range(2)], 1)
    mix = seco * 0.75 + pads * 0.8 + molhado * 0.55 + graves[:, None] * 0.9

    # dinâmica por cena: começa contida e cresce até o primeiro olhar
    t = np.arange(N) / SR
    ganhos = {"abertura": 0.5, "marcacao": 0.62, "foliculo": 0.6, "cirurgia": 0.8, "pos": 1.0, "encerramento": 0.78}
    g = np.ones(N)
    for cid, t0, dur in cenas:
        g[int(t0 * SR):int((t0 + dur) * SR)] = ganhos.get(cid, 0.8)
    k = int(0.9 * SR)
    g = np.convolve(np.pad(g, k, mode="edge"), np.ones(k) / k, "same")[k:-k]
    mix *= g[:, None]

    # limpa o sub que só come headroom e dá um pouco de ar nos agudos
    mix = sosfilt(butter(2, 32, "high", fs=SR, output="sos"), mix, axis=0)
    mix += sosfilt(butter(1, 4000, "high", fs=SR, output="sos"), mix, axis=0) * 0.35

    # fades e master
    mix *= np.minimum(1, t / 0.6)[:, None]
    fim = total
    mix *= np.clip((fim + 0.2 - t) / 2.5, 0, 1)[:, None] ** 1.5
    pico = np.abs(mix).max()
    mix = np.tanh(mix / pico * 1.1) / np.tanh(1.1) * 0.89
    return mix.astype(np.float32), total


def salvar_wav(caminho, audio):
    import wave
    a = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    with wave.open(str(caminho), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(a.tobytes())


if __name__ == "__main__":
    roteiro = json.loads((AQUI / "roteiro.json").read_text())
    destino = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "saida" / "trilha.wav"
    destino.parent.mkdir(parents=True, exist_ok=True)
    audio, total = compor(roteiro)
    salvar_wav(destino, audio)
    print(f"trilha: {destino} ({total:.2f} s)")
