"""Edição do vídeo institucional Bastidores, Dr. Marcel Giolo.

Lê o roteiro.json, monta a linha do tempo no tempo da trilha, aplica a
correção de cor, os motions da marca, as palavras de autoridade e as
transições, e exporta em MP4 vertical pronto para o Instagram.

Uso:
  python3 editar.py                 vídeo final em saida/
  python3 editar.py --previa        quadros de conferência (sem exportar vídeo)
  python3 editar.py --motions       só as peças de motion (sem os brutos)
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

import motion as M
import trilha

AQUI = Path(__file__).parent

# transição na entrada de cada cena: tipo e duração total (centrada no corte)
TRANSICOES = {
    "marcacao": ("desfoque", 1.0),
    "foliculo": ("luz", 0.9),
    "cirurgia": ("desfoque", 0.8),
    "pos": ("clarao", 0.7),
    "encerramento": ("escuro", 1.2),
}

GRADE = (
    "eq=contrast=1.05:saturation=0.86:gamma=0.98,"
    "colorbalance=rs=0.035:bs=-0.04:rm=0.025:bm=-0.03:rh=0.015:bh=-0.025"
)


class Bruto:
    """Leitor sequencial de um vídeo bruto, já no 9:16 e com cor tratada."""

    def __init__(self, caminho, inicio, dur, W, H, fps, velocidade=1.0, modo="preencher"):
        self.W, self.H = W, H
        self.ultimo = None
        self.lidos = 0
        if modo == "preencher":
            vf = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"
        else:
            # vídeo deitado: centraliza sobre o próprio vídeo desfocado
            vf = (f"split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
                  f"gblur=sigma=40,eq=brightness=-0.12[f];[b]scale={W}:-2[v];[f][v]overlay=(W-w)/2:(H-h)/2")
        if velocidade != 1.0:
            vf = f"setpts=PTS/{velocidade}," + vf
        vf += f",fps={fps},{GRADE}"
        dur_fonte = dur * velocidade + 0.5
        cmd = ["ffmpeg", "-v", "error", "-ss", f"{max(0, inicio):.3f}", "-t", f"{dur_fonte:.3f}",
               "-i", str(caminho), "-an", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        self.tam = W * H * 3

    def quadro(self, idx):
        while self.lidos <= idx:
            buf = self.proc.stdout.read(self.tam)
            if len(buf) < self.tam:
                break
            self.ultimo = np.frombuffer(buf, np.uint8).reshape(self.H, self.W, 3)
            self.lidos += 1
        if self.ultimo is None:
            return np.zeros((self.H, self.W, 3), np.float32) + M.FUNDO
        return self.ultimo.astype(np.float32)

    def fechar(self):
        self.proc.stdout.close()
        self.proc.kill()


def zoom_lento(frame, s, foco=(0.5, 0.5)):
    """Aproximação suave (Ken Burns) com precisão de subpixel."""
    if abs(s - 1) < 1e-4:
        return frame
    H, W = frame.shape[:2]
    fx, fy = foco[0] * W, foco[1] * H
    m = np.array([[s, 0, fx * (1 - s)], [0, s, fy * (1 - s)]], np.float32)
    return cv2.warpAffine(frame, m, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


class Cena:
    def __init__(self, cfg, inicio, dur, ctx):
        self.cfg, self.ini, self.dur, self.ctx = cfg, inicio, dur, ctx
        self.id = cfg["id"]
        self.tipo = cfg["tipo"]
        self.bruto = None
        self.margem = 0.8  # segundos lidos antes e depois do corte, para as transições
        caminho = cfg.get("bruto") or cfg.get("fundo_bruto")
        if caminho and not ctx["sem_brutos"]:
            p = AQUI / caminho
            if not p.exists():
                sys.exit(f"Bruto não encontrado: {p}")
            ini_src = cfg.get("inicio", cfg.get("fundo_inicio", 0)) - self.margem * cfg.get("velocidade", 1.0)
            self.desloc = min(0, ini_src)  # se o trecho começa no zero, congela o 1º quadro
            self.bruto = Bruto(p, ini_src, dur + 2 * self.margem, ctx["W"], ctx["H"], ctx["fps"],
                               cfg.get("velocidade", 1.0), cfg.get("enquadramento", "preencher"))

    def base(self, tl):
        if self.bruto is None:
            return self.ctx["fundo"].copy()
        idx = int(round((tl + self.margem) * self.ctx["fps"] + self.desloc * self.ctx["fps"]))
        f = self.bruto.quadro(max(0, idx))
        z = self.cfg.get("zoom", [1.0, 1.06])
        p = M.clamp01((tl + self.margem) / (self.dur + 2 * self.margem))
        return zoom_lento(f, z[0] + (z[1] - z[0]) * p, self.cfg.get("foco", (0.5, 0.45)))

    def render(self, tl):
        W, H, barra = self.ctx["W"], self.ctx["H"], self.ctx["barra"]
        if self.tipo == "logo":
            f = M.cena_logo(W, H, tl, self.dur, self.ctx["fundo"])
            ass = M.texto_rgba_cache("DR. MARCEL GIOLO  |  CRM PR 43.184", "texto", 25, 0.22)
            M.compor(f, ass, W / 2, H - 300, M.ease_out(M.prog(tl, 2.0, 0.8)) * 0.85)
            return f
        if self.tipo == "assinatura":
            return M.cena_encerramento(W, H, tl, self.dur, self.ctx["fundo"])
        if self.tipo == "motion_foliculo":
            b = self.base(tl)
            b = cv2.GaussianBlur(b, (0, 0), 22)
            b = b * 0.28 + M.FUNDO * 0.72
            return M.cena_foliculo(W, H, tl, self.dur, b)

        f = self.base(tl)
        titulo = self.cfg.get("titulo")
        atraso = 0.2
        if titulo:
            M.titulo_abertura(f, tl - 0.5, titulo[0], titulo[1], dur=3.6)
            atraso = 4.3
        cap = self.cfg.get("capitulo")
        if cap:
            M.rotulo_capitulo(f, cap[0], cap[1], tl - atraso, dur=3.0)
        for p in self.cfg.get("palavras", []):
            M.palavra_autoridade(f, p["texto"], tl - p["compasso"] * barra, dur=2.4)
        return f

    def fechar(self):
        if self.bruto:
            self.bruto.fechar()


def mistura(a, b, x, tipo, ctx):
    """Transição entre o fim de uma cena (a) e o começo da outra (b)."""
    x = float(M.ease_in_out(x))
    if tipo == "desfoque":
        s = np.sin(np.pi * x) * 14
        if s > 0.5:
            a = cv2.GaussianBlur(a, (0, 0), s)
            b = cv2.GaussianBlur(b, (0, 0), s)
        return a * (1 - x) + b * x
    if tipo == "luz":
        f = a * (1 - x) + b * x
        M.luz_vazada(f, x, 0.55 * np.sin(np.pi * x))
        return f
    if tipo == "clarao":
        f = a * (1 - x) + b * x
        k = np.sin(np.pi * x) ** 2 * 0.45
        return f * (1 - k) + np.array([238, 226, 206], np.float32) * k
    # escuro: passa pelo café da marca
    fundo = ctx["fundo"]
    if x < 0.5:
        k = x * 2
        return a * (1 - k) + fundo * k
    k = (x - 0.5) * 2
    return fundo * (1 - k) + b * k


def montar(roteiro, sem_brutos=False):
    W, H, fps = roteiro["formato"]["largura"], roteiro["formato"]["altura"], roteiro["formato"]["fps"]
    barra = 4 * 60 / roteiro["bpm"]
    ctx = {"W": W, "H": H, "fps": fps, "barra": barra, "fundo": M.fundo_marca(W, H), "sem_brutos": sem_brutos}
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
    # transição de entrada desta cena
    tipo, td = TRANSICOES.get(atual.id, (None, 0))
    if tipo and k > 0 and t < atual.ini + td / 2:
        ant = cenas[k - 1]
        x = (t - (atual.ini - td / 2)) / td
        f = mistura(ant.render(t - ant.ini), atual.render(t - atual.ini), x, tipo, ctx)
    # transição de saída para a próxima
    if f is None and k + 1 < len(cenas):
        prox = cenas[k + 1]
        tipo, td = TRANSICOES.get(prox.id, (None, 0))
        if tipo and t >= prox.ini - td / 2:
            x = (t - (prox.ini - td / 2)) / td
            f = mistura(atual.render(t - atual.ini), prox.render(t - prox.ini), x, tipo, ctx)
    if f is None:
        f = atual.render(t - atual.ini)

    # assinatura com CRM em todas as telas de vídeo
    ini_v = cenas[1].ini - 0.3
    fim_v = cenas[-1].ini - 0.2
    op = M.ease_in_out(M.prog(t, ini_v, 0.6)) * (1 - M.ease_in_out(M.prog(t, fim_v, 0.5)))
    M.assinatura_topo(f, op)
    acab.aplicar(f, i)
    return f


def exportar(roteiro, destino, sem_brutos=False):
    cenas, total, ctx = montar(roteiro, sem_brutos)
    W, H, fps = ctx["W"], ctx["H"], ctx["fps"]
    wav = AQUI / "saida" / "trilha.wav"
    audio, _ = trilha.compor(roteiro)
    trilha.salvar_wav(wav, audio)
    n = int(round(total * fps))
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
           "-i", str(wav),
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart",
           str(destino)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    acab = M.Acabamento(W, H)
    for i in range(n):
        f = quadro(cenas, i / fps, ctx, acab, i)
        enc.stdin.write(f.astype(np.uint8).tobytes())
        if i % (fps * 5) == 0:
            print(f"  {i / fps:5.1f}s / {total:.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    for c in cenas:
        c.fechar()
    print(f"vídeo: {destino} ({total:.2f} s)")


def previa(roteiro, pasta, tempos, sem_brutos=False):
    cenas, total, ctx = montar(roteiro, sem_brutos)
    acab = M.Acabamento(ctx["W"], ctx["H"])
    pasta.mkdir(parents=True, exist_ok=True)
    fps = ctx["fps"]
    saidas = []
    # renderiza em sequência (os brutos são lidos para frente)
    alvo = {int(round(t * fps)): t for t in tempos}
    ultimo = max(alvo)
    for i in range(ultimo + 1):
        if i not in alvo:
            # avança os leitores sem compor
            t = i / fps
            for c in cenas:
                if c.bruto and c.ini - 1 <= t <= c.ini + c.dur + 1:
                    c.bruto.quadro(int(round((t - c.ini + c.margem + c.desloc) * fps)))
            continue
        f = quadro(cenas, i / fps, ctx, acab, i)
        arq = pasta / f"q_{alvo[i]:05.2f}.jpg"
        cv2.imwrite(str(arq), cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
        saidas.append(arq)
    for c in cenas:
        c.fechar()
    return saidas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--previa", action="store_true")
    ap.add_argument("--motions", action="store_true", help="renderiza sem os brutos (fundo da marca)")
    ap.add_argument("--saida", default=None)
    a = ap.parse_args()
    roteiro = json.loads((AQUI / "roteiro.json").read_text())
    (AQUI / "saida").mkdir(exist_ok=True)
    if a.previa:
        tempos = [float(x) for x in np.arange(0.5, 51.5, 1.5)]
        arqs = previa(roteiro, AQUI / "saida" / "previa", tempos, a.motions)
        print("\n".join(map(str, arqs)))
    else:
        nome = a.saida or ("bastidores_motions.mp4" if a.motions else "bastidores_marcel_giolo.mp4")
        exportar(roteiro, AQUI / "saida" / nome, a.motions)
