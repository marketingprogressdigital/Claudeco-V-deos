"""Instrumentos sintetizados para as trilhas originais dos vídeos.

Tudo é gerado aqui (sem amostras de terceiros): piano por síntese aditiva,
pad quente, baixo, batida de coração, subida de ruído, impacto, dedilhado
(Karplus Strong), percussão suave e reverb por convolução.
"""
import numpy as np
from scipy.signal import butter, sosfilt, stft, istft

SR = 48000
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


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


def dedilhado(midi, dur, vel=0.5, brilho=0.5, seed=None):
    """Corda dedilhada por Karplus Strong, timbre limpo e moderno."""
    r = np.random.default_rng(seed)
    f0 = hz(midi)
    n = int((dur + 1.5) * SR)
    p = max(2, int(round(SR / f0)))
    buf = r.uniform(-1, 1, p)
    # suaviza o ataque conforme o brilho
    for _ in range(int(3 * (1 - brilho)) + 1):
        buf = 0.5 * (buf + np.roll(buf, 1))
    out = np.empty(n)
    decai = 0.996 + 0.003 * brilho
    rep = n // p + 1
    linha = buf.copy()
    for k in range(rep):
        a = k * p
        b = min(n, a + p)
        out[a:b] = linha[:b - a]
        linha = decai * 0.5 * (linha + np.roll(linha, -1))
    t = np.arange(n) / SR
    solta = np.where(t > dur, np.exp(-(t - dur) * 6.0), 1.0)
    return out * solta * vel


def bumbo(ganho=0.5):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    freq = 46 + 90 * np.exp(-t * 35)
    s = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7.5)
    clique = sosfilt(butter(2, 3000, "high", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-t * 180) * 0.15
    return (s + clique) * ganho


def chocalho(ganho=0.12, dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sosfilt(butter(4, [5000, 12000], "band", fs=SR, output="sos"), rng.standard_normal(n))
    env = np.minimum(1, t / 0.008) * np.exp(-t * 40)
    return s * env * ganho
