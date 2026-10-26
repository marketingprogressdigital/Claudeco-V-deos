"""Núcleo comum dos vídeos: curvas de animação, texto, composição, leitura
dos brutos, acabamento e exportação. Cada marca tem a sua pasta com os
motions próprios e importa daqui o que é genérico.
"""
import subprocess
import wave
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


# ---------------------------------------------------------------- curvas
def clamp01(x):
    return float(min(1.0, max(0.0, x)))


def prog(t, ini, dur):
    return clamp01((t - ini) / dur) if dur > 0 else float(t >= ini)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    return 0.5 - 0.5 * np.cos(np.pi * x)


def ease_out_back(x, s=1.4):
    x = x - 1
    return 1 + x * x * ((s + 1) * x + s)


def entra_sai(t, ini, fim, e=0.5, s=0.5):
    """Opacidade que entra em `e` segundos e sai em `s` segundos."""
    return ease_in_out(prog(t, ini, e)) * (1 - ease_in_out(prog(t, fim - s, s)))


# ---------------------------------------------------------------- texto
@lru_cache(maxsize=None)
def fonte_arquivo(caminho, tam):
    return ImageFont.truetype(str(caminho), int(tam))


def texto_rgba(txt, caminho_fonte, tam, tracking=0.0, cor=(255, 255, 255)):
    """Renderiza texto com espaçamento entre letras (em fração do corpo)."""
    f = fonte_arquivo(str(caminho_fonte), tam)
    esp = tracking * tam
    larguras = [f.getlength(c) for c in txt]
    w = int(sum(larguras) + esp * max(0, len(txt) - 1)) + 8
    asc, desc = f.getmetrics()
    h = asc + desc + 8
    img = Image.new("L", (max(w, 1), h), 0)
    d = ImageDraw.Draw(img)
    x = 4.0
    for c, lw in zip(txt, larguras):
        d.text((x, 4), c, font=f, fill=255)
        x += lw + esp
    a = np.asarray(img, np.float32) / 255.0
    rgba = np.zeros((h, w, 4), np.float32)
    rgba[..., :3] = cor
    rgba[..., 3] = a
    return rgba


def cabe(img, largura_max):
    """Reduz a camada se ela passar da largura útil da tela."""
    if img.shape[1] <= largura_max:
        return img
    h = int(img.shape[0] * largura_max / img.shape[1])
    return cv2.resize(img, (int(largura_max), h), interpolation=cv2.INTER_AREA)


def gradiente_vertical(rgba, cor_topo, cor_base):
    """Pinta a camada com degradê vertical (ex.: dourado da marca)."""
    h = rgba.shape[0]
    k = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    out = rgba.copy()
    out[..., :3] = np.asarray(cor_topo, np.float32) * (1 - k) + np.asarray(cor_base, np.float32) * k
    return out


# ---------------------------------------------------------------- composição
def compor(frame, rgba, cx, cy, opac=1.0, ancora="centro", blur=0.0, escala=1.0):
    """Cola uma camada RGBA (float, alfa 0..1) sobre o quadro RGB float."""
    if opac <= 0.002 or rgba is None:
        return
    if escala != 1.0:
        rgba = cv2.resize(rgba, None, fx=escala, fy=escala, interpolation=cv2.INTER_LINEAR)
    if blur > 0.3:
        pad = int(blur * 3) + 2
        rgba = cv2.copyMakeBorder(rgba, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
        rgba = cv2.GaussianBlur(rgba, (0, 0), blur)
    h, w = rgba.shape[:2]
    if ancora == "centro":
        x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    elif ancora == "esquerda":
        x0, y0 = int(round(cx)), int(round(cy - h / 2))
    else:
        x0, y0 = int(round(cx - w)), int(round(cy - h / 2))
    H, W = frame.shape[:2]
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if xa >= xb or ya >= yb:
        return
    sub = rgba[ya - y0:yb - y0, xa - x0:xb - x0]
    a = sub[..., 3:4] * opac
    reg = frame[ya:yb, xa:xb]
    reg *= 1 - a
    reg += sub[..., :3] * a


def pinta_mascara(frame, mascara_u8, cor, opac=1.0):
    a = (mascara_u8.astype(np.float32) / 255 * opac)[..., None]
    frame *= 1 - a
    frame += np.asarray(cor, np.float32) * a


def linha(frame, x0, y0, x1, y1, cor, opac=1.0, esp=2):
    H, W = frame.shape[:2]
    m = np.zeros((H, W), np.uint8)
    cv2.line(m, (int(x0 * 4), int(y0 * 4)), (int(x1 * 4), int(y1 * 4)), 255, esp, cv2.LINE_AA, shift=2)
    pinta_mascara(frame, m, cor, opac)


def faixa_escura(frame, y_centro, altura, cor, forca=0.55):
    """Faixa suave atrás dos textos, na cor de fundo da marca."""
    H = frame.shape[0]
    y = np.arange(H, dtype=np.float32)
    a = (np.exp(-((y - y_centro) / (altura / 2)) ** 2) * forca)[:, None, None]
    frame *= 1 - a
    frame += np.asarray(cor, np.float32) * a


def zoom_lento(frame, s, foco=(0.5, 0.5), dx=0.0, dy=0.0):
    """Aproximação suave (Ken Burns) com precisão de subpixel."""
    if abs(s - 1) < 1e-4 and dx == 0 and dy == 0:
        return frame
    H, W = frame.shape[:2]
    fx, fy = foco[0] * W, foco[1] * H
    m = np.array([[s, 0, fx * (1 - s) + dx], [0, s, fy * (1 - s) + dy]], np.float32)
    return cv2.warpAffine(frame, m, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def foto_9x16(caminho, W, H, margem=1.12):
    """Carrega uma foto já cortada para 9:16, com sobra para movimento."""
    from PIL import ImageOps
    im = ImageOps.exif_transpose(Image.open(caminho)).convert("RGB")
    a = np.asarray(im, np.float32)
    h, w = a.shape[:2]
    alvo = W / H
    if w / h > alvo:
        nw = int(h * alvo)
        a = a[:, (w - nw) // 2:(w - nw) // 2 + nw]
    else:
        nh = int(w / alvo)
        a = a[(h - nh) // 2:(h - nh) // 2 + nh]
    return cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC)


# ---------------------------------------------------------------- brutos
class Bruto:
    """Leitor sequencial de um vídeo bruto, já no formato e com cor tratada."""

    def __init__(self, caminho, inicio, dur, W, H, fps, grade="", fundo=(0, 0, 0),
                 velocidade=1.0, modo="preencher"):
        self.W, self.H = W, H
        self.fundo = np.asarray(fundo, np.float32)
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
        vf += f",fps={fps}"
        if grade:
            vf += f",{grade}"
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
            return np.zeros((self.H, self.W, 3), np.float32) + self.fundo
        return self.ultimo.astype(np.float32)

    def fechar(self):
        self.proc.stdout.close()
        self.proc.kill()


# ---------------------------------------------------------------- acabamento
class Acabamento:
    """Vinheta, grão de filme e preto puxado para a cor de fundo da marca."""

    def __init__(self, W, H, cor_preto, forca_vinheta=0.38, forca_grao=5.0, seed=3):
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((x - W / 2) / (W * 0.62)) ** 2 + ((y - H * 0.48) / (H * 0.6)) ** 2)
        self.vinheta = (1 - forca_vinheta * np.clip(r - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)
        self.cor = np.asarray(cor_preto, np.float32)
        rng = np.random.default_rng(seed)
        self.graos = []
        for _ in range(6):
            g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
            g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
            self.graos.append(g[..., None] * forca_grao)

    def aplicar(self, frame, i):
        frame *= self.vinheta
        frame += self.graos[i % len(self.graos)]
        frame[:] = frame * (1 - 0.06) + self.cor * 0.06 * 1.6
        np.clip(frame, 0, 255, out=frame)


# ---------------------------------------------------------------- saída
def salvar_wav(caminho, audio, sr=48000):
    a = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    with wave.open(str(caminho), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(a.tobytes())


def codificador(destino, W, H, fps, wav):
    """Processo do ffmpeg que recebe quadros RGB e grava o MP4 final."""
    cmd = ["ffmpeg", "-v", "error", "-y",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
           "-i", str(wav),
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart",
           str(destino)]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)
