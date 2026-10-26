"""Edição do vídeo institucional do Dr. Cristovão Carvalho.

A fala dele (vídeo bruto) é a base do começo ao fim, com a voz original.
Por cima entram: nome na tela no início, efeito de cidade quando ele cita
uma cidade, imagens de apoio só de cirurgia e o motion de planejamento.
O monograma da marca aparece apenas no encerramento.

Uso:
  python3 editar.py            exporta saida/institucional_cristovao.mp4
  python3 editar.py --previa   quadros de conferência em saida/previa/
"""
import argparse
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np

import motion as M
import trilha
from motion import N

AQUI = Path(__file__).parent
GRADE = "eq=contrast=1.05:saturation=1.02,colorbalance=bs=0.02:bm=0.01:rh=0.01"
TRANS = 0.45  # entrada e saída dos inserts


def duracao(caminho):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          str(caminho)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


class Fala:
    """Base do vídeo: os trechos escolhidos da fala, lidos em sequência."""

    def __init__(self, roteiro, ctx):
        caminho = AQUI / roteiro["bruto"]
        self.trechos = roteiro.get("trechos") or [[0, duracao(caminho)]]
        self.caminho, self.ctx = caminho, ctx
        self.inicios = np.cumsum([0] + [b - a for a, b in self.trechos])
        self.total = float(self.inicios[-1])
        self.k = -1
        self.leitor = None

    def quadro(self, t):
        k = int(np.searchsorted(self.inicios, t, side="right") - 1)
        k = min(max(k, 0), len(self.trechos) - 1)
        if k != self.k:
            if self.leitor:
                self.leitor.fechar()
            a, b = self.trechos[k]
            self.leitor = N.Bruto(self.caminho, a, b - a, self.ctx["W"], self.ctx["H"], self.ctx["fps"], GRADE,
                                  M.MARINHO_FUNDO)
            self.k = k
        idx = int(round((t - self.inicios[k]) * self.ctx["fps"]))
        return self.leitor.quadro(idx)

    def fechar(self):
        if self.leitor:
            self.leitor.fechar()


class Insert:
    def __init__(self, cfg, ctx):
        self.cfg, self.ctx = cfg, ctx
        self.em, self.dur = cfg["em"], cfg["dur"]
        self.leitor = None
        self.foto = None
        if cfg["tipo"] == "cidade" and cfg.get("foto"):
            self.foto = N.foto_9x16(AQUI / cfg["foto"], ctx["W"], ctx["H"])

    def render(self, tl):
        W, H, fundo = self.ctx["W"], self.ctx["H"], self.ctx["fundo"]
        tipo = self.cfg["tipo"]
        if tipo == "cidade":
            return M.cena_cidade(W, H, tl, self.dur, fundo, self.cfg, self.foto)
        if tipo == "planejamento":
            return M.cena_planejamento(W, H, tl, self.dur, fundo)
        if tipo == "apoio":
            if self.leitor is None:
                self.leitor = N.Bruto(AQUI / self.cfg["video"], self.cfg.get("inicio", 0), self.dur + 0.5, W, H,
                                      self.ctx["fps"], GRADE, M.MARINHO_FUNDO)
            f = self.leitor.quadro(int(round(max(0, tl) * self.ctx["fps"])))
            return N.zoom_lento(f, 1.0 + 0.05 * N.clamp01(tl / self.dur))
        raise ValueError(f"insert desconhecido: {tipo}")

    def fechar(self):
        if self.leitor:
            self.leitor.fechar()


def entra_insert(base, ins, x, ctx):
    """Entrada e saída dos inserts: mergulho curto com desfoque."""
    x = float(N.ease_in_out(x))
    s = np.sin(np.pi * x) * 10
    za = N.zoom_lento(base, 1 + 0.2 * x)
    zb = N.zoom_lento(ins, 1.15 - 0.15 * x)
    if s > 0.5:
        za = cv2.GaussianBlur(za, (0, 0), s)
        zb = cv2.GaussianBlur(zb, (0, 0), s)
    return za * (1 - x) + zb * x


def montar(roteiro):
    W, H, fps = roteiro["formato"]["largura"], roteiro["formato"]["altura"], roteiro["formato"]["fps"]
    ctx = {"W": W, "H": H, "fps": fps, "fundo": M.fundo_marca(W, H), "medico": roteiro["medico"],
           "barra": 4 * 60 / roteiro["bpm"]}
    fala = Fala(roteiro, ctx)
    inserts = [Insert(c, ctx) for c in roteiro.get("inserts", [])]
    enc = roteiro["encerramento"]["dur"]
    return fala, inserts, fala.total, fala.total + enc, ctx


def quadro(fala, inserts, t, t_fala, ctx, roteiro, acab, i):
    W, H = ctx["W"], ctx["H"]
    enc_ini = t_fala - 0.6  # o encerramento cruza com o fim da fala
    if t >= enc_ini + 1.2:
        f = M.cena_monograma(W, H, t - enc_ini, roteiro["encerramento"]["dur"], ctx["fundo"], ctx["medico"],
                             final=True)
        acab.aplicar(f, i)
        return f
    f = fala.quadro(min(t, t_fala - 1 / ctx["fps"]))
    for ins in inserts:
        if ins.em - TRANS / 2 <= t < ins.em + ins.dur + TRANS / 2:
            tl = t - ins.em
            img = ins.render(tl)
            if tl < TRANS / 2:
                f = entra_insert(f, img, (tl + TRANS / 2) / TRANS, ctx)
            elif tl > ins.dur - TRANS / 2:
                f = entra_insert(img, f, (tl - (ins.dur - TRANS / 2)) / TRANS, ctx)
            else:
                f = img
            break
    nt = roteiro.get("nome_na_tela")
    if nt:
        M.nome_na_tela(f, t - nt["em"], nt["dur"], ctx["medico"])
    if t >= enc_ini:
        x = N.clamp01((t - enc_ini) / 1.2)
        fim = M.cena_monograma(W, H, t - enc_ini, roteiro["encerramento"]["dur"], ctx["fundo"], ctx["medico"],
                               final=True)
        f = f * (1 - x) + fim * x
    acab.aplicar(f, i)
    return f


def audio(roteiro, t_fala, total, wav_saida):
    """Voz original + trilha por baixo, abaixando sozinha quando ele fala."""
    pasta = AQUI / "saida"
    barra = 4 * 60 / roteiro["bpm"]
    plano = {"bpm": roteiro["bpm"],
             "cenas": [{"id": "corpo", "compassos": (t_fala - 0.6) / barra},
                       {"id": "encerramento", "compassos": (total - t_fala + 0.6) / barra}],
             "acentos": [c["em"] for c in roteiro.get("inserts", []) if c["tipo"] == "cidade"]}
    musica, _ = trilha.compor(plano)
    trilha.salvar_wav(pasta / "trilha.wav", musica)
    trechos = roteiro.get("trechos") or [[0, t_fala]]
    filtros = "".join(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[v{k}];" for k, (a, b) in enumerate(trechos))
    filtros += "".join(f"[v{k}]" for k in range(len(trechos))) + f"concat=n={len(trechos)}:v=0:a=1[voz0];"
    m = roteiro["musica"]
    filtros += (
        "[voz0]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,"
        f"apad=whole_dur={total:.3f},asplit[voz][chave];"
        f"[1:a]volume={m['volume_sem_fala']}[mus];"
        f"[mus][chave]sidechaincompress=threshold=0.008:ratio=20:attack=60:release=700:makeup=1[musd];"
        "[voz][musd]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(AQUI / roteiro["bruto"]), "-i", str(pasta / "trilha.wav"),
                    "-filter_complex", filtros, "-map", "[out]", "-ar", "48000", "-ac", "2", str(wav_saida)],
                   check=True)


def exportar(roteiro, destino):
    fala, inserts, t_fala, total, ctx = montar(roteiro)
    W, H, fps = ctx["W"], ctx["H"], ctx["fps"]
    wav = AQUI / "saida" / "mix.wav"
    audio(roteiro, t_fala, total, wav)
    enc = N.codificador(destino, W, H, fps, wav)
    acab = M.Acabamento(W, H)
    n = int(round(total * fps))
    for i in range(n):
        enc.stdin.write(quadro(fala, inserts, i / fps, t_fala, ctx, roteiro, acab, i).astype(np.uint8).tobytes())
        if i % (fps * 5) == 0:
            print(f"  {i / fps:5.1f}s / {total:.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    fala.fechar()
    for ins in inserts:
        ins.fechar()
    print(f"vídeo: {destino} ({total:.2f} s)")


def previa(roteiro, pasta, passo=1.5):
    fala, inserts, t_fala, total, ctx = montar(roteiro)
    acab = M.Acabamento(ctx["W"], ctx["H"])
    pasta.mkdir(parents=True, exist_ok=True)
    saidas = []
    fps = ctx["fps"]
    alvos = {int(round(t * fps)) for t in np.arange(0.5, total, passo)}
    for i in range(int(round(total * fps))):
        t = i / fps
        if i not in alvos:
            if t < t_fala:
                fala.quadro(t)  # mantém o leitor andando
            continue
        f = quadro(fala, inserts, t, t_fala, ctx, roteiro, acab, i)
        arq = pasta / f"q_{t:06.2f}.jpg"
        cv2.imwrite(str(arq), cv2.cvtColor(f.astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
        saidas.append(arq)
    fala.fechar()
    return saidas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--previa", action="store_true")
    ap.add_argument("--roteiro", default="roteiro.json")
    a = ap.parse_args()
    roteiro = json.loads((AQUI / a.roteiro).read_text())
    (AQUI / "saida").mkdir(exist_ok=True)
    if a.previa:
        print("\n".join(map(str, previa(roteiro, AQUI / "saida" / "previa"))))
    else:
        exportar(roteiro, AQUI / "saida" / "institucional_cristovao.mp4")
