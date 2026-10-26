"""Edição do vídeo institucional do Dr. Cristovão Carvalho.

Uso:
  python3 editar.py            exporta saida/institucional_cristovao.mp4
  python3 editar.py --previa   quadros de conferência em saida/previa/
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np

import motion as M
import trilha
from motion import N

AQUI = Path(__file__).parent

# transição na entrada de cada cena: tipo e duração total (centrada no corte)
TRANSICOES = {
    "apresentacao": ("zoom", 0.7),
    "valores": ("deslize", 0.6),
    "planejamento": ("brilho", 0.8),
    "cidade": ("zoom", 0.6),
    "final": ("deslize", 0.6),
    "encerramento": ("escuro", 1.0),
}


def tratar_foto(f):
    """Cor das fotos: contraste firme, preto puxado para o marinho da marca."""
    f = (f - 128) * 1.06 + 128
    lum = f.mean(2, keepdims=True) / 255
    sombra = np.clip(1 - lum * 2.2, 0, 1)
    f = f * (1 - 0.25 * sombra) + M.MARINHO_FUNDO * 0.25 * sombra
    return np.clip(f, 0, 255)


class Cena:
    def __init__(self, cfg, inicio, dur, ctx):
        self.cfg, self.ini, self.dur, self.ctx = cfg, inicio, dur, ctx
        self.id, self.tipo = cfg["id"], cfg["tipo"]
        self.foto = None
        arq = cfg.get("foto") or cfg.get("foto_fundo")
        if arq:
            self.foto = tratar_foto(N.foto_9x16(AQUI / arq, ctx["W"], ctx["H"]))

    def render(self, tl):
        W, H, barra, medico = self.ctx["W"], self.ctx["H"], self.ctx["barra"], self.ctx["medico"]
        if self.tipo == "monograma":
            return M.cena_monograma(W, H, tl, self.dur, self.ctx["fundo"], medico)
        if self.tipo == "assinatura":
            return M.cena_monograma(W, H, tl, self.dur, self.ctx["fundo"], medico, final=True)
        if self.tipo == "motion_planejamento":
            return M.cena_planejamento(W, H, tl, self.dur, self.ctx["fundo"])
        if self.tipo == "motion_cidade":
            return M.cena_cidade(W, H, tl, self.dur, self.ctx["fundo"], self.cfg, self.foto)

        # foto com movimento de câmera
        z = self.cfg.get("zoom", [1.0, 1.06])
        p = N.clamp01((tl + 0.5) / (self.dur + 1.0))
        f = N.zoom_lento(self.foto, z[0] + (z[1] - z[0]) * N.ease_in_out(p), self.cfg.get("foco", (0.5, 0.4)))
        if self.cfg.get("nome_na_tela"):
            M.nome_na_tela(f, tl - 0.4, self.dur - 0.4, medico)
        for pal in self.cfg.get("palavras", []):
            M.palavra_valor(f, pal["texto"], tl - pal["compasso"] * barra, dur=barra * 0.92)
        if self.cfg.get("frase"):
            M.frase_final(f, tl, self.dur, *self.cfg["frase"])
        return f


def mistura(a, b, x, tipo, ctx):
    W, H = ctx["W"], ctx["H"]
    x = float(N.ease_in_out(x))
    if tipo == "zoom":
        # mergulho: a de saída cresce e desfoca, a de entrada assenta do grande para o normal
        s = np.sin(np.pi * x) * 12
        za = N.zoom_lento(a, 1 + 0.35 * x)
        zb = N.zoom_lento(b, 1.25 - 0.25 * x)
        if s > 0.5:
            za = cv2.GaussianBlur(za, (0, 0), s)
            zb = cv2.GaussianBlur(zb, (0, 0), s)
        return za * (1 - x) + zb * x
    if tipo == "deslize":
        d = int(H * x)
        out = np.empty_like(a)
        out[:H - d] = a[d:]
        out[H - d:] = b[:d]
        borrao = int(np.sin(np.pi * x) * 40) * 2 + 1
        if borrao > 3:
            out = cv2.blur(out, (1, borrao))
        return out
    if tipo == "brilho":
        f = a * (1 - x) + b * x
        yy, xx = np.mgrid[0:H // 8, 0:W // 8].astype(np.float32) * 8
        pos = -W * 0.6 + (W * 2.2) * x
        faixa = np.exp(-(((xx + yy * 0.5) - pos) / (W * 0.18)) ** 2)
        faixa = cv2.resize(faixa, (W, H))[..., None] * np.sin(np.pi * x) * 0.7
        return f * (1 - faixa) + M.OURO_CLARO * faixa
    fundo = ctx["fundo"]
    if x < 0.5:
        k = x * 2
        return a * (1 - k) + fundo * k
    k = (x - 0.5) * 2
    return fundo * (1 - k) + b * k


def montar(roteiro):
    W, H, fps = roteiro["formato"]["largura"], roteiro["formato"]["altura"], roteiro["formato"]["fps"]
    barra = 4 * 60 / roteiro["bpm"]
    ctx = {"W": W, "H": H, "fps": fps, "barra": barra, "fundo": M.fundo_marca(W, H), "medico": roteiro["medico"]}
    cenas, t = [], 0.0
    for c in roteiro["cenas"]:
        d = c["compassos"] * barra
        cenas.append(Cena(c, t, d, ctx))
        t += d
    return cenas, t, ctx


def quadro(cenas, t, ctx, acab, i):
    atual = next((c for c in cenas if c.ini <= t < c.ini + c.dur), cenas[-1])
    k = cenas.index(atual)
    f = None
    tipo, td = TRANSICOES.get(atual.id, (None, 0))
    if tipo and k > 0 and t < atual.ini + td / 2:
        ant = cenas[k - 1]
        f = mistura(ant.render(t - ant.ini), atual.render(t - atual.ini), (t - (atual.ini - td / 2)) / td, tipo, ctx)
    if f is None and k + 1 < len(cenas):
        prox = cenas[k + 1]
        tipo, td = TRANSICOES.get(prox.id, (None, 0))
        if tipo and t >= prox.ini - td / 2:
            f = mistura(atual.render(t - atual.ini), prox.render(t - prox.ini),
                        (t - (prox.ini - td / 2)) / td, tipo, ctx)
    if f is None:
        f = atual.render(t - atual.ini)
    # nome (e CRM, quando informado) em todas as telas entre abertura e encerramento
    op = N.ease_in_out(N.prog(t, cenas[1].ini + 2.5, 0.6)) * (1 - N.ease_in_out(N.prog(t, cenas[-1].ini - 0.3, 0.4)))
    M.assinatura_topo(f, op, ctx["medico"])
    acab.aplicar(f, i)
    return f


def exportar(roteiro, destino):
    cenas, total, ctx = montar(roteiro)
    W, H, fps = ctx["W"], ctx["H"], ctx["fps"]
    wav = AQUI / "saida" / "trilha.wav"
    audio, _ = trilha.compor(roteiro)
    trilha.salvar_wav(wav, audio)
    enc = N.codificador(destino, W, H, fps, wav)
    acab = M.Acabamento(W, H)
    n = int(round(total * fps))
    for i in range(n):
        enc.stdin.write(quadro(cenas, i / fps, ctx, acab, i).astype(np.uint8).tobytes())
        if i % (fps * 5) == 0:
            print(f"  {i / fps:5.1f}s / {total:.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    print(f"vídeo: {destino} ({total:.2f} s)")


def previa(roteiro, pasta, tempos):
    cenas, total, ctx = montar(roteiro)
    acab = M.Acabamento(ctx["W"], ctx["H"])
    pasta.mkdir(parents=True, exist_ok=True)
    saidas = []
    for t in tempos:
        i = int(round(t * ctx["fps"]))
        f = quadro(cenas, i / ctx["fps"], ctx, acab, i)
        arq = pasta / f"q_{t:05.2f}.jpg"
        cv2.imwrite(str(arq), cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
        saidas.append(arq)
    return saidas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--previa", action="store_true")
    a = ap.parse_args()
    roteiro = json.loads((AQUI / "roteiro.json").read_text())
    (AQUI / "saida").mkdir(exist_ok=True)
    if a.previa:
        print("\n".join(map(str, previa(roteiro, AQUI / "saida" / "previa", list(np.arange(0.5, 42, 1.5))))))
    else:
        exportar(roteiro, AQUI / "saida" / "institucional_cristovao.mp4")
    sys.exit(0)
