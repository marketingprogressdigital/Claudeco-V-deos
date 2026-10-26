"""Motions na identidade do Dr. Cristovão Carvalho.

Manual da marca: marinho #000B3D, grafite #343434, dourado #D1A456,
Montserrat. Monograma CC em anel dourado (refeito em Cormorant a partir das
peças publicadas, até chegar o PNG oficial). Personalidade segura,
acessível e objetiva: movimentos limpos, firmes, sem exagero.
"""
import sys
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

AQUI = Path(__file__).parent
sys.path.insert(0, str(AQUI.parent))
import nucleo as N  # noqa: E402
from nucleo import cabe, compor, ease_in_out, ease_out, ease_out_back, prog  # noqa: E402

MARCA = AQUI / "marca"
MARINHO = np.array([0, 11, 61], np.float32)
MARINHO_FUNDO = np.array([2, 8, 34], np.float32)
GRAFITE = np.array([52, 52, 52], np.float32)
DOURADO = np.array([209, 164, 86], np.float32)
OURO_CLARO = np.array([243, 214, 152], np.float32)
OURO_ESCURO = np.array([178, 131, 58], np.float32)
BRANCO = np.array([246, 244, 240], np.float32)

FONTES = {
    "regular": MARCA / "fontes" / "Montserrat-Regular.ttf",
    "medio": MARCA / "fontes" / "Montserrat-Medium.ttf",
    "semi": MARCA / "fontes" / "Montserrat-SemiBold.ttf",
    "negrito": MARCA / "fontes" / "Montserrat-Bold.ttf",
    "mono": MARCA / "fontes" / "CormorantGaramond-Medium.ttf",
}


def texto(txt, peso, tam, tracking=0.0, cor=BRANCO, ouro=False):
    img = N.texto_rgba(txt, FONTES[peso], tam, tracking, cor)
    return N.gradiente_vertical(img, OURO_CLARO, OURO_ESCURO) if ouro else img


@lru_cache(maxsize=64)
def texto_fixo(txt, peso, tam, tracking=0.0, ouro=False, cor=(246, 244, 240)):
    return texto(txt, peso, tam, tracking, np.array(cor, np.float32), ouro)


def linha(frame, x0, y0, x1, y1, opac=1.0, esp=2, cor=DOURADO):
    N.linha(frame, x0, y0, x1, y1, cor, opac, esp)


def fundo_marca(W, H):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((x - W * 0.5) / W) ** 2 + ((y - H * 0.42) / H) ** 2)
    a = np.clip(1 - r * 1.5, 0, 1)[..., None] ** 1.4
    return MARINHO_FUNDO * (1 - a) + np.array([12, 30, 92], np.float32) * a


class Acabamento(N.Acabamento):
    def __init__(self, W, H):
        super().__init__(W, H, MARINHO_FUNDO, forca_vinheta=0.3, forca_grao=3.5)


# ---------------------------------------------------------------- monograma
@lru_cache(maxsize=8)
def _letra_c(tam):
    return texto("C", "mono", tam, 0, ouro=True)


def monograma(diam, p_anel=1.0, p_c1=1.0, p_c2=1.0):
    """Anel dourado desenhado + dois C entrelaçados, como na marca."""
    s = int(diam * 1.15)
    camada = np.zeros((s, s, 4), np.float32)
    c = s / 2
    if p_anel > 0:
        m = np.zeros((s, s), np.uint8)
        ang = 360 * ease_in_out(p_anel)
        cv2.ellipse(m, (int(c * 4), int(c * 4)), (int(diam / 2 * 4), int(diam / 2 * 4)), 0, -90, -90 + ang, 255,
                    max(2, int(diam / 110)), cv2.LINE_AA, shift=2)
        a = m.astype(np.float32) / 255
        camada[..., :3] = DOURADO
        camada[..., 3] = a
    letra = _letra_c(int(diam * 0.62))
    lh, lw = letra.shape[:2]
    for k, (p, dx, dy) in enumerate(((p_c1, -0.13, -0.10), (p_c2, 0.11, 0.12))):
        if p <= 0:
            continue
        e = ease_out(p)
        cx = c + dx * diam + (1 - e) * (-1 if k == 0 else 1) * diam * 0.06
        cy = c + dy * diam
        compor_rgba(camada, letra, cx, cy, e)
    return camada


def compor_rgba(dest, src, cx, cy, opac):
    """Compõe RGBA sobre RGBA, cores sem pré multiplicação."""
    h, w = src.shape[:2]
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    H, W = dest.shape[:2]
    xa, ya, xb, yb = max(0, x0), max(0, y0), min(W, x0 + w), min(H, y0 + h)
    if xa >= xb or ya >= yb:
        return
    sub = src[ya - y0:yb - y0, xa - x0:xb - x0]
    a = sub[..., 3:4] * opac
    reg = dest[ya:yb, xa:xb]
    ad = reg[..., 3:4]
    ao = a + ad * (1 - a)
    reg[..., :3] = (sub[..., :3] * a + reg[..., :3] * ad * (1 - a)) / np.maximum(ao, 1e-6)
    reg[..., 3:4] = ao


def brilho_passando(frame, base, p, y0, y1, largura=80, forca=110):
    """Faixa de luz atravessando só o que é dourado/claro na tela."""
    if not 0 < p < 1:
        return
    H, W = frame.shape[:2]
    y0, y1 = max(0, int(y0)), min(H, int(y1))
    yy, xx = np.mgrid[y0:y1, 0:W].astype(np.float32)
    xs = -300 + (W + 600) * ease_in_out(p)
    faixa = np.exp(-(((xx + (yy - (y0 + y1) / 2) * 0.4) - xs) / largura) ** 2)
    claro = np.clip(frame[y0:y1] - base[y0:y1], 0, 255).mean(2) / 160.0
    frame[y0:y1] += (faixa * np.clip(claro, 0, 1) * forca)[..., None]


def cena_monograma(W, H, t, dur, fundo, medico, final=False):
    frame = fundo.copy()
    vel = 0.8 if final else 1.0
    yc = H * (0.40 if final else 0.43)
    diam = 380
    mono = monograma(diam, prog(t, 0.1 * vel, 1.1 * vel), prog(t, 0.55 * vel, 0.8 * vel),
                     prog(t, 0.75 * vel, 0.8 * vel))
    compor(frame, mono, W / 2, yc)
    # halo
    compor(frame, mono, W / 2, yc, 0.3 * np.sin(np.pi * prog(t, 1.1 * vel, 1.4 * vel)), blur=22)

    e1 = ease_out(prog(t, 1.3 * vel, 0.8))
    nome = cabe(texto_fixo(medico["nome"], "semi", 50, 0.12), W - 120)
    compor(frame, nome, W / 2, yc + 290 + 24 * (1 - e1), e1)
    e2 = ease_out(prog(t, 1.7 * vel, 0.8))
    comp = 170 * e2
    linha(frame, W / 2 - comp, yc + 347, W / 2 + comp, yc + 347, 0.9 * e2, 2)
    area = texto_fixo(medico["area"], "medio", 28, 0.42, ouro=True)
    compor(frame, area, W / 2, yc + 395 + 14 * (1 - e2), e2)
    brilho_passando(frame, fundo, prog(t, 2.2 * vel, 1.0), yc - 200, yc + 400)

    if final:
        linhas = [(medico["aviso"], "regular", 26, 0.02, 0.75)]
        if medico.get("crm"):
            linhas.insert(0, (medico["crm"], "medio", 27, 0.2, 0.9))
        for k, (txt, peso, tam, tr, op) in enumerate(linhas):
            ek = ease_out(prog(t, 2.4 + 0.2 * k, 0.8))
            compor(frame, texto_fixo(txt, peso, tam, tr), W / 2, yc + 505 + 50 * k + 10 * (1 - ek), ek * op)
    return frame


# ---------------------------------------------------------------- peças sobre foto
def nome_na_tela(frame, t, dur, medico):
    """Lower third: barra dourada cresce, painel de vidro marinho abre, nome entra."""
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    y = H * 0.73
    e = ease_out(prog(t, 0.0, 0.7))
    sai = ease_in_out(prog(t, dur - 0.5, 0.5))
    op = 1 - sai
    x0 = 84
    largura = int((W - 2 * x0) * ease_out(prog(t, 0.25, 0.8)))
    alt = 190
    if largura > 4 and op > 0:
        ya, yb = int(y - alt / 2), int(y + alt / 2)
        reg = frame[ya:yb, x0:x0 + largura]
        vidro = cv2.GaussianBlur(reg, (0, 0), 18)
        vidro = vidro * 0.35 + MARINHO * 0.65
        frame[ya:yb, x0:x0 + largura] = reg * (1 - op) + vidro * op
    barra = 150 * e
    linha(frame, x0, y + alt / 2 - barra, x0, y + alt / 2, op, 8)
    e2 = ease_out(prog(t, 0.55, 0.7))
    nome = cabe(texto_fixo(medico["nome"], "negrito", 50, 0.04), W - 2 * x0 - 80)
    compor(frame, nome, x0 + 40 + 30 * (1 - e2), y - 30, op * e2, ancora="esquerda")
    e3 = ease_out(prog(t, 0.8, 0.7))
    area = texto_fixo(medico["area"], "medio", 27, 0.38, ouro=True)
    compor(frame, area, x0 + 42 + 30 * (1 - e3), y + 38, op * e3, ancora="esquerda")


def assinatura_topo(frame, opac, medico):
    if opac <= 0.01:
        return
    W = frame.shape[1]
    txt = medico["nome"] + (f"  |  {medico['crm']}" if medico.get("crm") else "")
    img = texto_fixo(txt, "medio", 24, 0.2)
    sombra = img.copy()
    sombra[..., :3] = MARINHO_FUNDO
    compor(frame, sombra, W / 2, 132, opac * 0.6, blur=4)
    compor(frame, img, W / 2, 130, opac * 0.92)


def palavra_valor(frame, txt, t, dur=2.2):
    """Palavra subindo de dentro de uma máscara, em dourado, com sublinhado."""
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    y = H * 0.70
    e = ease_out(prog(t, 0, 0.55))
    sai = ease_in_out(prog(t, dur - 0.45, 0.45))
    N.faixa_escura(frame, y, 560, MARINHO_FUNDO, 0.55 * (e * (1 - sai)))
    img = cabe(texto_fixo(txt, "negrito", 118, 0.04, ouro=True), W - 120)
    h = img.shape[0]
    desloc = (1 - e) * h * 0.9 - sai * h * 0.9
    corte = img.copy()
    # máscara: só aparece dentro da janela da linha
    yy = np.arange(h, dtype=np.float32)[:, None] + desloc
    dentro = ((yy >= 0) & (yy <= h)).astype(np.float32)
    corte[..., 3] *= dentro
    compor(frame, corte, W / 2, y + desloc)
    comp = (img.shape[1] / 2) * ease_out(prog(t, 0.3, 0.6)) * (1 - sai)
    if comp > 1:
        linha(frame, W / 2 - comp, y + h / 2 + 18, W / 2 + comp, y + h / 2 + 18, 0.95, 3)


def frase_final(frame, t, dur, linha1, linha2):
    if t < 0 or t > dur:
        return
    H, W = frame.shape[:2]
    y = H * 0.70
    e1 = ease_out(prog(t, 0.2, 0.7))
    e2 = ease_out(prog(t, 0.5, 0.7))
    sai = ease_in_out(prog(t, dur - 0.4, 0.4))
    N.faixa_escura(frame, y + 30, 520, MARINHO_FUNDO, 0.6 * e1 * (1 - sai))
    a = cabe(texto_fixo(linha1, "negrito", 62, 0.03), W - 120)
    compor(frame, a, W / 2, y + 24 * (1 - e1), e1 * (1 - sai))
    b = texto_fixo(linha2, "medio", 42, 0.06, ouro=True)
    compor(frame, b, W / 2, y + 80 + 18 * (1 - e2), e2 * (1 - sai))


# ---------------------------------------------------------------- planejamento
def cena_planejamento(W, H, t, dur, fundo):
    """Vista de cima da cabeça: contorno, linha frontal desenhada e as
    unidades foliculares sendo distribuídas, como num planejamento."""
    frame = fundo.copy()
    # grade técnica
    eg = ease_out(prog(t, 0, 0.8))
    m = np.zeros((H, W), np.uint8)
    for x in range(0, W, 60):
        cv2.line(m, (x, 0), (x, H), 255, 1)
    for y in range(0, H, 60):
        cv2.line(m, (0, y), (W, y), 255, 1)
    N.pinta_mascara(frame, m, np.array([60, 90, 170], np.float32), 0.10 * eg)

    cx, cy = W / 2, H * 0.53
    rx, ry = 250, 330
    # contorno da cabeça
    pc = ease_in_out(prog(t, 0.2, 1.0))
    m = np.zeros((H, W), np.uint8)
    cv2.ellipse(m, (int(cx * 4), int(cy * 4)), (rx * 4, ry * 4), 0, -90, -90 + 360 * pc, 255, 3, cv2.LINE_AA, shift=2)
    N.pinta_mascara(frame, m, BRANCO, 0.55)
    # orelhas
    if pc > 0.9:
        m = np.zeros((H, W), np.uint8)
        for sx in (-1, 1):
            cv2.ellipse(m, (int((cx + sx * (rx + 14)) * 4), int((cy + 20) * 4)), (22 * 4, 50 * 4), 0,
                        90 - 90 * sx, 270 - 90 * sx, 255, 3, cv2.LINE_AA, shift=2)
        N.pinta_mascara(frame, m, BRANCO, 0.55 * prog(t, 1.1, 0.3))

    # linha frontal (curva dourada) desenhada da esquerda para a direita
    pl = ease_in_out(prog(t, 0.9, 0.9))
    pts = []
    for i in range(61):
        u = i / 60
        x = cx + rx * 0.82 * np.cos(np.pi * (0.8 - 0.6 * u))
        # arco suave com as entradas laterais (têmporas) um pouco recuadas
        y = cy - ry * 0.62 - 46 * np.sin(np.pi * u) + 60 * (abs(u - 0.5) * 2) ** 2
        pts.append((x, y))
    n = int(len(pts) * pl)
    if n > 1:
        m = np.zeros((H, W), np.uint8)
        cv2.polylines(m, [np.array([(int(px * 4), int(py * 4)) for px, py in pts[:n]], np.int32)], False, 255, 5,
                      cv2.LINE_AA, shift=2)
        N.pinta_mascara(frame, m, DOURADO, 1.0)
        hx, hy = pts[n - 1]
        m = np.zeros((H, W), np.uint8)
        cv2.circle(m, (int(hx * 4), int(hy * 4)), 9 * 4, 255, -1, cv2.LINE_AA, shift=2)
        N.pinta_mascara(frame, m, OURO_CLARO, pl * (1 - prog(t, 1.9, 0.3)))

    # unidades foliculares distribuídas na área receptora
    rng = np.random.default_rng(11)
    total = 140
    xs = rng.uniform(-1, 1, total * 3)
    ys = rng.uniform(0, 1, total * 3)
    # área receptora em meia lua logo atrás da linha frontal
    ok = (xs ** 2 + (ys * 1.15) ** 2) < 0.92
    xs, ys = xs[ok][:total], ys[ok][:total]
    ordem = np.argsort(ys + rng.uniform(0, 0.25, len(ys)))
    pd = prog(t, 1.6, 1.6)
    k_vis = int(len(ordem) * ease_out(pd))
    if k_vis:
        m = np.zeros((H, W), np.uint8)
        for j in ordem[:k_vis]:
            u = (xs[j] + 1) / 2
            ybase = cy - ry * 0.62 + 60 * (abs(u - 0.5) * 2) ** 2 + 8
            px = cx + rx * 0.78 * xs[j]
            py = ybase + ys[j] * ry * 0.75
            cv2.circle(m, (int(px * 4), int(py * 4)), 4 * 4, 255, -1, cv2.LINE_AA, shift=2)
        N.pinta_mascara(frame, m, DOURADO, 0.85)

    # anotação técnica com linha de chamada
    pa = ease_out(prog(t, 1.9, 0.6))
    if pa > 0:
        ax, ay = cx + rx * 0.55, cy - ry * 0.7
        bx, by = W - 120, cy - ry - 90
        linha(frame, ax, ay, ax + (bx - ax) * pa, ay + (by - ay) * pa, 0.8, 2, BRANCO)
        rot = texto_fixo("LINHA FRONTAL", "semi", 24, 0.3)
        compor(frame, rot, bx, by - 26, pa, ancora="direita")

    # títulos
    e0 = ease_out(prog(t, 0.0, 0.7))
    t1 = texto_fixo("PLANEJAMENTO", "negrito", 76, 0.06)
    compor(frame, t1, W / 2, H * 0.17 + 20 * (1 - e0), e0)
    e1 = ease_out(prog(t, 0.25, 0.7))
    t2 = texto_fixo("INDIVIDUALIZADO", "medio", 34, 0.5, ouro=True)
    compor(frame, t2, W / 2, H * 0.17 + 72 + 14 * (1 - e1), e1)
    e2 = ease_out(prog(t, 2.2, 0.8))
    rodape = texto_fixo("O transplante começa antes da cirurgia.", "regular", 36, 0.01)
    compor(frame, cabe(rodape, W - 120), W / 2, H * 0.84 + 14 * (1 - e2), e2)
    return frame


# ---------------------------------------------------------------- cidade
@lru_cache(maxsize=2)
def mapa(W, H, escala=2):
    """Malha urbana estilizada (gerada, não é mapa real), com avenidas."""
    w, h = W * escala, H * escala
    rng = np.random.default_rng(5)
    ruas = np.zeros((h, w), np.uint8)
    avenidas = np.zeros((h, w), np.uint8)
    # quarteirões em blocos rotacionados
    for _ in range(9):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        ang = rng.uniform(0, np.pi)
        passo = rng.uniform(70, 120)
        alcance = rng.uniform(500, 1100)
        d = np.array([np.cos(ang), np.sin(ang)])
        nrm = np.array([-d[1], d[0]])
        for k in np.arange(-alcance, alcance, passo):
            for base, dirv in ((nrm, d), (d, nrm)):
                p0 = np.array([cx, cy]) + base * k - dirv * alcance
                p1 = np.array([cx, cy]) + base * k + dirv * alcance
                cv2.line(ruas, tuple(int(v) for v in p0), tuple(int(v) for v in p1), 255, 2, cv2.LINE_AA)
    # avenidas curvas
    for _ in range(5):
        pts = []
        x, y = rng.uniform(0, w), 0.0
        ang = rng.uniform(np.pi * 0.3, np.pi * 0.7)
        while 0 <= y <= h and -200 <= x <= w + 200:
            pts.append((int(x), int(y)))
            ang += rng.normal(0, 0.06)
            x += np.cos(ang) * 30
            y += np.sin(ang) * 30
        if len(pts) > 2:
            cv2.polylines(avenidas, [np.array(pts, np.int32)], False, 255, 6, cv2.LINE_AA)
    # rio
    rio = np.zeros((h, w), np.uint8)
    pts = [(int(x), int(h * 0.75 + 140 * np.sin(x / 260.0))) for x in range(0, w, 20)]
    cv2.polylines(rio, [np.array(pts, np.int32)], False, 255, 26, cv2.LINE_AA)
    return ruas, avenidas, rio


def pino(diam):
    s = int(diam * 1.6)
    m = np.zeros((s, s), np.uint8)
    c = s // 2
    r = diam // 2
    cv2.circle(m, (c * 4, int(c * 0.7) * 4), r * 4, 255, -1, cv2.LINE_AA, shift=2)
    tri = np.array([[(c - r * 0.82) * 4, (c * 0.7 + r * 0.55) * 4], [(c + r * 0.82) * 4, (c * 0.7 + r * 0.55) * 4],
                    [c * 4, (c * 0.7 + r * 1.75) * 4]], np.int32)
    cv2.fillPoly(m, [tri], 255, cv2.LINE_AA, shift=2)
    furo = np.zeros_like(m)
    cv2.circle(furo, (c * 4, int(c * 0.7) * 4), int(r * 0.38) * 4, 255, -1, cv2.LINE_AA, shift=2)
    a = (m.astype(np.float32) - furo.astype(np.float32)).clip(0, 255) / 255
    out = np.zeros((s, s, 4), np.float32)
    out[..., 3] = a
    return N.gradiente_vertical(out, OURO_CLARO, OURO_ESCURO), (c, int(c * 0.7 + r * 1.75))


def cena_cidade(W, H, t, dur, fundo, cfg, foto=None):
    """Efeito de cidade: câmera mergulha num mapa estilizado, o pino cai com
    ondas, e o nome da cidade entra letra a letra. Com foto da cidade, o mapa
    se abre num círculo a partir do pino e revela a cidade."""
    frame = fundo.copy()

    ruas, avenidas, rio = mapa(W, H)
    hM, wM = ruas.shape
    # câmera: aproxima do centro do mapa ao longo da cena
    z = 1.0 + 0.9 * ease_in_out(prog(t, 0, dur))
    alvo = (wM * 0.52, hM * 0.5)
    lw, lh = wM / (2 * z), hM / (2 * z)
    x0, y0 = alvo[0] - lw / 2, alvo[1] - lh / 2
    mtx = np.array([[W / lw, 0, -x0 * W / lw], [0, H / lh, -y0 * H / lh]], np.float32)
    aparece = ease_out(prog(t, 0, 0.6))
    for camada, cor, op in ((rio, np.array([20, 50, 120], np.float32), 0.8),
                            (ruas, np.array([70, 100, 175], np.float32), 0.35),
                            (avenidas, DOURADO, 0.45)):
        m = cv2.warpAffine(camada, mtx, (W, H), flags=cv2.INTER_LINEAR)
        N.pinta_mascara(frame, m, cor, op * aparece)
    N.faixa_escura(frame, H * 0.68, 700, MARINHO_FUNDO, 0.55)

    # pino caindo com quique e ondas
    px, py = W / 2, H * 0.44
    pq = prog(t, 0.55, 0.7)
    if pq > 0:
        for k in range(2):
            po = prog(t, 1.05 + 0.35 * k, 1.3)
            if 0 < po < 1:
                m = np.zeros((H, W), np.uint8)
                raio = 40 + 220 * ease_out(po)
                cv2.ellipse(m, (int(px * 4), int(py * 4)), (int(raio * 4), int(raio * 0.42 * 4)), 0, 0, 360, 255,
                            3, cv2.LINE_AA, shift=2)
                N.pinta_mascara(frame, m, DOURADO, 0.9 * (1 - po))
        img, (bx, by) = pino(150)
        queda = (1 - ease_out_back(pq, 1.8)) * 360
        # sombra
        m = np.zeros((H, W), np.uint8)
        cv2.ellipse(m, (int(px * 4), int(py * 4)), (int(34 * 4 * pq), int(11 * 4 * pq)), 0, 0, 360, 255, -1,
                    cv2.LINE_AA, shift=2)
        N.pinta_mascara(frame, cv2.GaussianBlur(m, (0, 0), 6), MARINHO_FUNDO, 0.7)
        compor(frame, img, px - bx + img.shape[1] / 2, py - by + img.shape[0] / 2 - queda, min(1, pq * 3))

    if foto is not None:
        pi_ = ease_in_out(prog(t, 1.5, 0.9))
        if pi_ > 0:
            z = 1.12 - 0.08 * prog(t, 1.5, dur - 1.5)
            f = N.zoom_lento(foto, z, (0.5, 0.45))
            raio = 20 + np.hypot(W, H) * pi_
            m = np.zeros((H, W), np.uint8)
            cv2.circle(m, (int(px * 4), int(py * 4)), int(raio * 4), 255, -1, cv2.LINE_AA, shift=2)
            a = (m.astype(np.float32) / 255)[..., None]
            frame = frame * (1 - a) + f * a
            if pi_ < 1:
                m = np.zeros((H, W), np.uint8)
                cv2.circle(m, (int(px * 4), int(py * 4)), int(raio * 4), 255, 6, cv2.LINE_AA, shift=2)
                N.pinta_mascara(frame, m, DOURADO, 1 - pi_)
            N.faixa_escura(frame, H * 0.70, 640, MARINHO_FUNDO, 0.6 * pi_)

    # textos
    yt = H * 0.62
    e0 = ease_out(prog(t, 0.9, 0.6))
    cham = texto_fixo(cfg.get("chamada", ""), "medio", 30, 0.42, ouro=True)
    compor(frame, cham, W / 2, yt + 12 * (1 - e0), e0)
    nome = cfg.get("cidade", "")
    tam = 112 if len(nome) <= 10 else 92
    letras = [texto_fixo(c, "negrito", tam, 0) for c in nome]
    larg = [L.shape[1] - 8 for L in letras]
    total = sum(larg)
    escala = min(1.0, (W - 110) / total)
    x = W / 2 - total * escala / 2
    for k, (L, lw_) in enumerate(zip(letras, larg)):
        pk = ease_out(prog(t, 1.1 + 0.045 * k, 0.5))
        if pk > 0 and L.shape[1] > 8:
            Ls = cv2.resize(L, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA) if escala < 1 else L
            compor(frame, Ls, x + lw_ * escala / 2, yt + 105 + 40 * (1 - pk), pk, blur=(1 - pk) * 5)
        x += lw_ * escala
    eu = ease_out(prog(t, 1.1 + 0.045 * len(nome) + 0.2, 0.5))
    if cfg.get("uf") and eu > 0:
        uf = texto_fixo(cfg["uf"], "negrito", 34, 0.2, cor=(2, 8, 34))
        bw, bh = uf.shape[1] + 34, uf.shape[0] + 10
        caixa = np.zeros((bh, bw, 4), np.float32)
        m = np.zeros((bh, bw), np.uint8)
        cv2.rectangle(m, (0, 0), (bw - 1, bh - 1), 255, -1)
        caixa[..., 3] = m / 255
        caixa = N.gradiente_vertical(caixa, OURO_CLARO, OURO_ESCURO)
        compor(frame, caixa, W / 2, yt + 212 + 12 * (1 - eu), eu)
        compor(frame, uf, W / 2, yt + 212 + 12 * (1 - eu), eu)
    return frame
