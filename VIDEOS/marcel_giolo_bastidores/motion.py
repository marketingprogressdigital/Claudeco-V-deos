"""Elementos de motion design na identidade do Dr. Marcel Giolo.

Tudo é desenhado quadro a quadro em numpy/PIL/OpenCV, a partir do logo
oficial (extraído do voucher da marca) e das fontes oficiais (Italiana para
títulos, Questrial para textos).
"""
import sys
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI.parent))
import nucleo as N  # noqa: E402
from nucleo import cabe, clamp01, compor, ease_in_out, ease_out, prog  # noqa: E402
MARCA = AQUI / "marca"

CREME = np.array([227, 216, 196], np.float32)
FUNDO = np.array([28, 16, 14], np.float32)
APOIO = np.array([185, 169, 146], np.float32)


# ---------------------------------------------------------------- texto
FONTES = {"titulo": MARCA / "fontes" / "Italiana-Regular.ttf", "texto": MARCA / "fontes" / "Questrial-Regular.ttf"}


def texto_rgba(txt, familia, tam, tracking=0.0, cor=CREME):
    return N.texto_rgba(txt, FONTES[familia], tam, tracking, cor)


def logo_parte(nome):
    img = Image.open(MARCA / f"{nome}.png").convert("RGBA")
    a = np.asarray(img, np.float32)
    out = np.zeros_like(a)
    out[..., :3] = CREME
    out[..., 3] = a[..., 3] / 255.0
    return out


@lru_cache(maxsize=None)
def logo_cache(nome, largura):
    p = logo_parte(nome)
    h = int(p.shape[0] * largura / p.shape[1])
    return cv2.resize(p, (int(largura), h), interpolation=cv2.INTER_AREA)


def letras_do_nome(largura):
    """Separa as letras do GIOLO pelas colunas vazias, para animar uma a uma."""
    p = logo_cache("nome", largura)
    col = p[..., 3].max(0) > 0.05
    letras, dentro = [], False
    for x, v in enumerate(col):
        if v and not dentro:
            ini, dentro = x, True
        elif not v and dentro:
            letras.append((ini, x))
            dentro = False
    if dentro:
        letras.append((ini, len(col)))
    return p, letras


# ---------------------------------------------------------------- composição
def linha(frame, x0, y0, x1, y1, opac=1.0, esp=2, cor=CREME):
    N.linha(frame, x0, y0, x1, y1, cor, opac, esp)


def gradiente_escuro(frame, y_centro, altura, forca=0.55):
    """Faixa escura suave atrás dos textos, na cor de fundo da marca."""
    N.faixa_escura(frame, y_centro, altura, FUNDO, forca)


# ---------------------------------------------------------------- acabamento
class Acabamento(N.Acabamento):
    """Vinheta, grão de filme e preto puxado para o café da marca."""

    def __init__(self, W, H, seed=3):
        super().__init__(W, H, FUNDO, seed=seed)


def fundo_marca(W, H):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((x - W / 2) / W) ** 2 + ((y - H * 0.45) / H) ** 2)
    claro = np.array([46, 30, 25], np.float32)
    a = np.clip(1 - r * 1.6, 0, 1)[..., None] ** 1.5
    return FUNDO * (1 - a) + claro * a


def luz_vazada(frame, t, forca):
    """Luz quente atravessando a tela, usada nas transições."""
    if forca <= 0.01:
        return
    H, W = frame.shape[:2]
    cx = W * (-0.3 + 1.6 * t)
    cy = H * (0.25 + 0.4 * t)
    pequeno = np.zeros((H // 8, W // 8), np.float32)
    y, x = np.mgrid[0:H // 8, 0:W // 8].astype(np.float32) * 8
    pequeno = np.exp(-(((x - cx) / (W * 0.55)) ** 2 + ((y - cy) / (H * 0.38)) ** 2))
    a = cv2.resize(pequeno, (W, H))[..., None] * forca
    cor = np.array([240, 206, 160], np.float32)
    frame[:] = 255 - (255 - frame) * (1 - a * cor / 255)


# ---------------------------------------------------------------- peças
def assinatura_topo(frame, opac):
    if opac <= 0.01:
        return
    W = frame.shape[1]
    txt = texto_rgba_cache("DR. MARCEL GIOLO  |  CRM PR 43.184", "texto", 25, 0.22)
    sombra = txt.copy()
    sombra[..., :3] = FUNDO
    compor(frame, sombra, W / 2, 132, opac * 0.55, blur=4)
    compor(frame, txt, W / 2, 130, opac * 0.92)


@lru_cache(maxsize=64)
def _texto_cache(txt, familia, tam, tracking):
    return texto_rgba(txt, familia, tam, tracking)


def texto_rgba_cache(txt, familia, tam, tracking=0.0):
    return _texto_cache(txt, familia, tam, round(tracking, 3))


def palavra_autoridade(frame, txt, t, dur=2.4, y=None):
    """Palavra de autoridade: entra com o espaçamento fechando e foco chegando,
    filetes laterais crescendo e o símbolo da marca por cima."""
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    y = y or H * 0.60
    e = ease_out(prog(t, 0, 0.9))
    sai = ease_in_out(prog(t, dur - 0.6, 0.6))
    opac = e * (1 - sai)
    gradiente_escuro(frame, y, 520, 0.5 * opac)
    tracking = 0.62 - 0.30 * e + 0.08 * sai
    tam = 118 if len(txt) <= 9 else 96
    img = texto_rgba(txt, "titulo", tam, tracking)
    if img.shape[1] > W - 120:
        img = cv2.resize(img, (W - 120, int(img.shape[0] * (W - 120) / img.shape[1])), interpolation=cv2.INTER_AREA)
    compor(frame, img, W / 2, y, opac, blur=(1 - e) * 9 + sai * 6)
    # filete abaixo, abrindo do centro
    comp = 120 * ease_out(prog(t, 0.25, 0.9))
    if comp > 1:
        linha(frame, W / 2 - comp, y + 92, W / 2 + comp, y + 92, 0.7 * opac, 2)
    simb = logo_cache("simbolo", 46)
    compor(frame, simb, W / 2, y - 120 + 14 * (1 - e), opac * 0.9)


def rotulo_capitulo(frame, numero, nome, t, dur=3.0):
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    x, y = 96, 330
    e = ease_out(prog(t, 0, 0.8))
    sai = ease_in_out(prog(t, dur - 0.6, 0.6))
    opac = (1 - sai)
    gradiente_escuro(frame, y, 420, 0.38 * opac * e)
    num = texto_rgba_cache(numero, "titulo", 104, 0.05)
    compor(frame, num, x - 20 * (1 - e), y, opac * e, ancora="esquerda", blur=(1 - e) * 6)
    # filete vertical
    xl = x + num.shape[1] + 18
    alt = 70 * ease_out(prog(t, 0.2, 0.7))
    linha(frame, xl, y - alt / 2, xl, y + alt / 2, opac * 0.85, 2)
    nome_img = texto_rgba_cache(nome, "texto", 34, 0.32)
    re = ease_out(prog(t, 0.35, 0.9))
    # revela o nome da esquerda para a direita
    corte = nome_img.copy()
    larg = int(corte.shape[1] * re)
    corte[:, larg:, 3] = 0
    if larg > 0:
        borda = min(40, larg)
        corte[:, larg - borda:larg, 3] *= np.linspace(1, 0, borda)[None, :]
    compor(frame, corte, xl + 28, y + 2, opac, ancora="esquerda")


def titulo_abertura(frame, t, linha1, linha2, dur=3.4):
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    y = H * 0.62
    e = ease_out(prog(t, 0, 1.0))
    sai = ease_in_out(prog(t, dur - 0.6, 0.6))
    opac = 1 - sai
    gradiente_escuro(frame, y + 30, 640, 0.62 * e * opac)
    grande = cabe(texto_rgba(linha1, "titulo", 104, 0.24 - 0.10 * e), W - 140)
    compor(frame, grande, W / 2, y - 24 * (1 - e), opac * e, blur=(1 - e) * 10)
    comp = 300 * ease_out(prog(t, 0.4, 0.9))
    linha(frame, W / 2 - comp, y + 78, W / 2 + comp, y + 78, 0.75 * opac, 2)
    pq = texto_rgba_cache(linha2.upper(), "texto", 34, 0.34)
    e2 = ease_out(prog(t, 0.7, 0.9))
    compor(frame, pq, W / 2, y + 140 + 16 * (1 - e2), opac * e2)


def revela_simbolo(simb, p):
    """Revela o símbolo com uma varredura circular, como se fosse desenhado."""
    if p >= 1:
        return simb
    h, w = simb.shape[:2]
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    ang = (np.arctan2(x - w / 2, -(y - h / 2)) / (2 * np.pi)) % 1.0
    suave = 0.06
    m = np.clip((p * (1 + suave) - ang) / suave, 0, 1)
    out = simb.copy()
    out[..., 3] *= m
    return out


def cena_logo(W, H, t, dur, fundo, compacto=False):
    """Abertura (e base do encerramento): símbolo desenhado, letras do GIOLO
    entrando uma a uma, assinatura MEDICINA CAPILAR abrindo e um brilho."""
    frame = fundo.copy()
    vel = 0.75 if compacto else 1.0
    yc = H * (0.40 if compacto else 0.46)
    simb = logo_cache("simbolo", 250)
    ps = ease_in_out(prog(t, 0.15 * vel, 1.5 * vel))
    s_img = revela_simbolo(simb, ps)
    compor(frame, s_img, W / 2, yc - 230, 1.0)
    # brilho difuso do símbolo
    compor(frame, simb, W / 2, yc - 230, 0.35 * np.sin(np.pi * prog(t, 1.2 * vel, 1.4 * vel)), blur=18)

    nome, letras = letras_do_nome(620)
    for k, (a, b) in enumerate(letras):
        pl = ease_out(prog(t, (1.05 + 0.11 * k) * vel, 0.8 * vel))
        if pl <= 0:
            continue
        letra = nome[:, a:b]
        cx = W / 2 - nome.shape[1] / 2 + (a + b) / 2
        compor(frame, letra, cx, yc + 40 + 26 * (1 - pl), pl, blur=(1 - pl) * 7)

    ass = logo_cache("assinatura", 560)
    pa = ease_out(prog(t, 1.75 * vel, 1.0 * vel))
    if pa > 0:
        larg = int(ass.shape[1] * (0.86 + 0.14 * pa))
        a2 = cv2.resize(ass, (larg, ass.shape[0]), interpolation=cv2.INTER_AREA)
        compor(frame, a2, W / 2, yc + 175, pa)

    # brilho atravessando o logo
    pb = prog(t, 2.6 * vel, 1.1 * vel)
    if 0 < pb < 1:
        faixa = np.zeros((H, W), np.float32)
        xs = -300 + (W + 600) * ease_in_out(pb)
        y0, y1 = int(yc - 420), int(yc + 220)
        yy, xx = np.mgrid[y0:y1, 0:W].astype(np.float32)
        faixa[y0:y1] = np.exp(-(((xx + (yy - yc) * 0.35) - xs) / 70) ** 2)
        base = fundo.copy()
        brilho = np.clip(frame - base, 0, 255).mean(2) / 200.0
        frame += (faixa * brilho * 90)[..., None]
    return frame


def cena_encerramento(W, H, t, dur, fundo):
    frame = cena_logo(W, H, t, dur, fundo, compacto=True)
    y = H * 0.40 + 330
    e1 = ease_out(prog(t, 1.9, 0.9))
    l1 = texto_rgba_cache("Tecnologia e cuidado para valorizar", "texto", 38, 0.04)
    compor(frame, l1, W / 2, y + 18 * (1 - e1), e1)
    e2 = ease_out(prog(t, 2.3, 1.0))
    l2 = cabe(texto_rgba("CADA FIO.", "titulo", 108, 0.30 - 0.1 * e2), W - 140)
    compor(frame, l2, W / 2, y + 100 + 14 * (1 - e2), e2, blur=(1 - e2) * 8)
    e3 = ease_out(prog(t, 3.0, 0.9))
    comp = 220 * e3
    linha(frame, W / 2 - comp, y + 205, W / 2 + comp, y + 205, 0.6 * e3, 2)
    for k, (txt, tam, tr, op) in enumerate([
        ("@drmarcelgiolo", 34, 0.12, 1.0),
        ("DR. MARCEL GIOLO  |  CRM PR 43.184", 27, 0.22, 0.9),
        ("Cada caso é avaliado individualmente.", 25, 0.05, 0.7),
    ]):
        ek = ease_out(prog(t, 3.2 + 0.2 * k, 0.8))
        img = texto_rgba_cache(txt, "texto", tam, tr)
        compor(frame, img, W / 2, y + 270 + 58 * k + 10 * (1 - ek), ek * op)
    return frame


def desenha_foliculo(alfa, x, y, n_fios, p, escala=1.0):
    """Unidade folicular: bulbo e fios crescendo em curva suave."""
    if p <= 0:
        return
    s = escala
    cv2.ellipse(alfa, (int(x * 4), int(y * 4)), (int(11 * s * 4 * min(1, p * 3)), int(16 * s * 4 * min(1, p * 3))),
                0, 0, 360, 255, -1, cv2.LINE_AA, shift=2)
    for k in range(n_fios):
        desvio = (k - (n_fios - 1) / 2) * 16 * s
        pts = []
        n = 40
        alcance = ease_out(clamp01(p * 1.25 - 0.1 * k))
        for i in range(int(n * alcance) + 1):
            u = i / n
            px = x + desvio * u * 1.6 + 38 * s * u ** 2
            py = y - 230 * s * u
            pts.append((int(px * 4), int(py * 4)))
        if len(pts) > 1:
            cv2.polylines(alfa, [np.array(pts, np.int32)], False, 255, int(3 * s) + 1, cv2.LINE_AA, shift=2)


def cena_foliculo(W, H, t, dur, base):
    """Motion: a unidade folicular, de 1 a 3 fios, como é extraída."""
    frame = base
    H2 = H * 0.55
    e0 = ease_out(prog(t, 0.0, 0.8))
    lbl = texto_rgba_cache("EXTRAÇÃO FOLICULAR", "texto", 32, 0.36)
    compor(frame, lbl, W / 2, H * 0.27, e0)
    tit = cabe(texto_rgba("UNIDADE POR UNIDADE", "titulo", 84, 0.12 - 0.05 * e0), W - 140)
    compor(frame, tit, W / 2, H * 0.27 + 80, e0, blur=(1 - e0) * 8)

    # linha da pele desenhando da esquerda para a direita
    pl = ease_in_out(prog(t, 0.3, 0.9))
    x0, x1 = 150, W - 150
    # pele: o bulbo fica abaixo e os fios atravessam a superfície
    linha(frame, x0, H2 - 20, x0 + (x1 - x0) * pl, H2 - 20, 0.55, 2)

    alfa = np.zeros((H, W), np.uint8)
    xs = [W * 0.24, W * 0.5, W * 0.76]
    for k, nf in enumerate([1, 2, 3]):
        pf = prog(t, 0.8 + 0.35 * k, 1.1)
        desenha_foliculo(alfa, xs[k] - 25, H2 + 120, nf, pf, escala=1.5)
    a = (alfa.astype(np.float32) / 255)[..., None]
    frame *= 1 - a
    frame += CREME * a

    for k, txt in enumerate(["1 FIO", "2 FIOS", "3 FIOS"]):
        ek = ease_out(prog(t, 1.3 + 0.35 * k, 0.6))
        img = texto_rgba_cache(txt, "texto", 34, 0.3)
        compor(frame, img, xs[k], H2 + 230 + 12 * (1 - ek), ek * 0.95)
    return frame
