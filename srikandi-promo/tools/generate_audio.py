"""
Generator soundtrack Srikandi Tailor — 100 BPM, 38,4 detik, 48 kHz stereo.

Menghasilkan dua stem yang sinkron dengan animasi (1 ketukan = 0,6 dtk = 18 frame):
  public/audio/musik.wav  → musik latar bernuansa gamelan (bonang/saron, gong, kendang) + groove
  public/audio/sfx.wav    → whoosh transisi, riser, impact, "pop" stiker, klik teks

Semua bunyi disintesis dari nol (tanpa sampel/lagu berhak cipta), jadi aman dipakai.
Jalankan ulang:  python3 tools/generate_audio.py   (butuh numpy + scipy)
"""
import numpy as np
from scipy import signal
from scipy.io import wavfile
import os

SR = 48000
BPM = 100
BEAT = 60 / BPM  # 0.6 s
DUR = 64 * BEAT  # 38.4 s
N = int(DUR * SR)
rng = np.random.default_rng(1945)

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")


def t_of_beat(b):
    return b * BEAT


def frame_t(frame):
    return frame / 30.0


def buf():
    return np.zeros((N, 2), dtype=np.float64)


def place(dst, x, t, gain=1.0, pan=0.0):
    """Tambahkan sinyal mono/stereo x ke dst pada waktu t (detik)."""
    i0 = int(round(t * SR))
    if i0 >= N:
        return
    if x.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.4142, x * r * 1.4142], axis=1)
    if i0 < 0:
        x = x[-i0:]
        i0 = 0
    n = min(len(x), N - i0)
    dst[i0 : i0 + n] += x[:n] * gain


def env_exp(n, tau, attack=0.002):
    tt = np.arange(n) / SR
    a = np.clip(tt / max(attack, 1e-6), 0, 1)
    return a * np.exp(-tt / tau)


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def highpass(x, f, order=2):
    sos = signal.butter(order, f, btype="highpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lowpass(x, f, order=2):
    sos = signal.butter(order, f, btype="lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


# ─── Tangga nada slendro (≈ 5 nada, ~240 sen) ────────────────────────────────
SLENDRO = [0, 240, 480, 720, 960]
BASE = 146.83  # D3


def sl(n, base=BASE):
    o, k = divmod(n, 5)
    return base * 2 ** ((SLENDRO[k] + 1200 * o) / 1200)


# ─── Instrumen ──────────────────────────────────────────────────────────────
def bell(freq, dur=2.2, bright=1.0, ombak=3.2):
    """Metalofon ala saron/bonang: parsial inharmonis + 'ombak' (denyut) khas gamelan."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for ratio, amp, tau in [(1.0, 1.0, 1.1), (2.76, 0.32 * bright, 0.42), (5.40, 0.11 * bright, 0.18), (8.93, 0.04 * bright, 0.08)]:
        f = freq * ratio
        if f > SR / 2.2:
            continue
        out += amp * np.sin(2 * np.pi * f * tt) * np.exp(-tt / tau)
        out += amp * 0.55 * np.sin(2 * np.pi * (f + ombak) * tt + 0.7) * np.exp(-tt / tau)
    click = bandpass(rng.standard_normal(n) * np.exp(-tt / 0.004), 2500, 7000) * 0.25
    out = out + click
    out *= np.clip(tt / 0.0015, 0, 1)
    return out / 1.8


def gong(freq=55.0, dur=6.5):
    """Gong ageng: nada rendah panjang dengan denyut pelan."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    att = np.clip(tt / 0.025, 0, 1)
    body = (
        np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 4.2)
        + 0.8 * np.sin(2 * np.pi * (freq + 0.85) * tt) * np.exp(-tt / 4.0)
        + 0.45 * np.sin(2 * np.pi * freq * 2.01 * tt) * np.exp(-tt / 2.4)
        + 0.22 * np.sin(2 * np.pi * freq * 2.99 * tt) * np.exp(-tt / 1.4)
        + 0.12 * np.sin(2 * np.pi * freq * 4.13 * tt) * np.exp(-tt / 0.8)
    )
    # "hum" yang naik sesaat setelah pukulan
    swell = 1 + 0.25 * np.sin(np.clip(tt / 0.9, 0, 1) * np.pi)
    hit = lowpass(rng.standard_normal(n) * np.exp(-tt / 0.03), 900) * 0.35
    return (body * swell * att + hit) / 2.2


def kick(dur=0.45):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 48 + 90 * np.exp(-tt / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / 0.2)
    x += 0.3 * bandpass(rng.standard_normal(n) * np.exp(-tt / 0.003), 1500, 6000)
    return np.tanh(x * 1.6) * 0.9


def hat(open_=False):
    dur = 0.25 if open_ else 0.06
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = highpass(rng.standard_normal(n), 7500, 3) * np.exp(-tt / (0.09 if open_ else 0.018))
    return x * 0.5


def snap():
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    e = np.zeros(n)
    for d in (0.0, 0.009, 0.019):
        e += np.exp(-np.clip(tt - d, 0, None) / 0.006) * (tt >= d)
    e += 0.6 * np.exp(-tt / 0.07)
    x = bandpass(rng.standard_normal(n), 1100, 3200) * e
    return x * 0.55


def kendang(kind="dung"):
    """Kendang: 'dung' (bas) dan 'tak' (tajam)."""
    if kind == "dung":
        n = int(0.5 * SR)
        tt = np.arange(n) / SR
        f = 95 + 70 * np.exp(-tt / 0.03)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
        x += 0.2 * bandpass(rng.standard_normal(n) * np.exp(-tt / 0.01), 300, 1200)
        return x * 0.9
    n = int(0.2 * SR)
    tt = np.arange(n) / SR
    x = bandpass(rng.standard_normal(n), 700, 2200) * np.exp(-tt / 0.035)
    x += 0.5 * np.sin(2 * np.pi * 420 * tt) * np.exp(-tt / 0.03)
    return x * 0.6


def bass_note(freq, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.clip(tt / 0.008, 0, 1) * np.exp(-tt / (dur * 0.9))
    x = np.sin(2 * np.pi * freq * tt) + 0.25 * np.sin(2 * np.pi * 2 * freq * tt) + 0.08 * np.sin(2 * np.pi * 3 * freq * tt)
    return np.tanh(x * env * 1.3) * 0.7


def pad_chord(freqs, dur, attack=1.2, release=1.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros((n, 2))
    for i, f in enumerate(freqs):
        for det, pan in ((-0.12, -0.6), (0.12, 0.6)):
            ff = f * 2 ** (det * (1 + i * 0.3) / 12)
            v = np.zeros(n)
            for h in range(1, 7):
                v += np.sin(2 * np.pi * ff * h * tt + h * 0.3 + i) / h ** 1.6
            l = np.cos((pan + 1) * np.pi / 4)
            r = np.sin((pan + 1) * np.pi / 4)
            out[:, 0] += v * l
            out[:, 1] += v * r
    out[:, 0] = lowpass(out[:, 0], 1800)
    out[:, 1] = lowpass(out[:, 1], 1800)
    env = np.clip(tt / attack, 0, 1) * np.clip((dur - tt) / release, 0, 1)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.21 * tt)
    return out * (env * lfo)[:, None] / (len(freqs) * 2.5)


# ─── SFX ────────────────────────────────────────────────────────────────────
def whoosh(dur=0.55, peak=0.55, bright=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    noise = rng.standard_normal(n)
    lo = bandpass(noise, 250, 900)
    mid = bandpass(noise, 900, 3200)
    hi = bandpass(noise, 3200, 9000) * bright
    p = tt / dur

    def bump(c, w):
        return np.exp(-((p - c) ** 2) / (2 * w**2))

    x = lo * bump(peak - 0.12, 0.2) + mid * bump(peak, 0.14) * 1.2 + hi * bump(peak + 0.08, 0.1) * 0.8
    x *= np.clip(p / 0.05, 0, 1) * np.clip((1 - p) / 0.1, 0, 1)
    pan = np.interp(p, [0, 1], [-0.7, 0.7])
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l, x * r], axis=1) * 1.1


def riser(dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    p = tt / dur
    noise = rng.standard_normal(n)
    bands = [bandpass(noise, 300, 1000), bandpass(noise, 1000, 3000), bandpass(noise, 3000, 9000)]
    x = bands[0] * (1 - p) + bands[1] * np.sin(np.pi * p) + bands[2] * p**2 * 1.4
    f = 220 * 2 ** (p * 2)
    x += 0.18 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    x *= p**2.2
    return x * 0.8


def impact(dur=1.4):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 38 + 50 * np.exp(-tt / 0.09)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.45)
    x += 0.4 * lowpass(rng.standard_normal(n), 400) * np.exp(-tt / 0.08)
    return np.tanh(x * 1.5) * 0.85


def shimmer(dur=2.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros((n, 2))
    for k in range(14):
        f = rng.uniform(3000, 9000)
        d = rng.uniform(0, 0.5)
        tau = rng.uniform(0.2, 0.7)
        pan = rng.uniform(-0.9, 0.9)
        e = np.exp(-np.clip(tt - d, 0, None) / tau) * (tt >= d)
        v = np.sin(2 * np.pi * f * tt) * e * 0.12
        out[:, 0] += v * np.cos((pan + 1) * np.pi / 4)
        out[:, 1] += v * np.sin((pan + 1) * np.pi / 4)
    return out


def tick(freq=2400):
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * freq * tt) * np.exp(-tt / 0.008) * 0.5


def pop():
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    f = 700 * np.exp(-tt / 0.02) + 380
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.05)
    x += 0.2 * bandpass(rng.standard_normal(n) * np.exp(-tt / 0.004), 2000, 6000)
    return x * 0.6


def rip(dur=0.7):
    """Kain digunting/dirobek: noise berbutir dengan amplitudo acak cepat."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    grains = (rng.random(n) < 0.06).astype(float)
    grains = np.convolve(grains, np.exp(-np.arange(200) / 30), mode="same")
    x = bandpass(rng.standard_normal(n), 1200, 7000) * (0.35 + grains)
    x *= np.clip(tt / 0.02, 0, 1) * np.exp(-tt / 0.3)
    return x * 0.5


# ─── Reverb sederhana (konvolusi IR sintetis) ──────────────────────────────
def make_ir(rt=2.3):
    n = int(rt * SR)
    tt = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        v = rng.standard_normal(n) * np.exp(-6.9 * tt / rt)
        v = lowpass(v, 5500)
        v[: int(0.018 * SR)] = 0
        ir[:, c] = v
    return ir / np.sqrt(np.sum(ir**2) / 2)


IR = make_ir()


def reverb(x, wet=0.3):
    y = np.zeros_like(x)
    for c in range(2):
        y[:, c] = signal.fftconvolve(x[:, c], IR[:, c])[: len(x)]
    return x + y * wet * 0.35


# ════════════════════════════════════════════════════════════════════════════
#  MUSIK
# ════════════════════════════════════════════════════════════════════════════
drums = buf()
bass = buf()
bells = buf()
pads = buf()
gongs = buf()

# Progresi akar (per 4 ketukan / 1 bar), dalam indeks slendro
ROOTS = [0, 0, 3, 2]  # D, D, A-ish, G-ish


def root_for_beat(b):
    return ROOTS[(int(b) // 4) % len(ROOTS)]


# --- Pad sepanjang lagu (dua lapis) ---
for bar in range(16):
    r = root_for_beat(bar * 4)
    chord = [sl(r), sl(r + 2), sl(r + 4), sl(r + 5)]
    level = 0.55
    if 4 <= bar < 6:  # adegan logo: pad lebih lebar
        level = 0.8
    place(pads, pad_chord(chord, BEAT * 4 + 1.5, attack=0.6, release=1.2), t_of_beat(bar * 4), gain=level)

# --- Intro (ketukan 0–7): lonceng jarang + kendang di tiap kata ---
intro_notes = [7, 9, 8, 10]
for i, nte in enumerate(intro_notes):
    place(bells, bell(sl(nte)), t_of_beat(i), gain=0.35, pan=-0.3 + 0.2 * i)
for i, b in enumerate([4, 5, 6, 7]):  # Diukur / Dipotong / Dijahit / untukmu
    place(drums, kendang("dung"), t_of_beat(b), gain=0.8)
    place(drums, kendang("tak"), t_of_beat(b) + BEAT / 2, gain=0.35, pan=0.3)
    place(bells, bell(sl([10, 11, 12, 15][i]), bright=1.2), t_of_beat(b), gain=0.45, pan=[-0.4, 0.4, -0.2, 0.0][i])


def groove(b0, b1, style="full"):
    """Pola ritme dari ketukan b0 (inklusif) sampai b1 (eksklusif)."""
    bonang_pat = [5, 7, 6, 8, 7, 9, 8, 7]
    for b in range(b0, b1):
        t = t_of_beat(b)
        r = root_for_beat(b)
        if style == "full" or (style == "half" and b % 2 == 0):
            place(drums, kick(), t, gain=0.95)
        if style == "full" and b % 2 == 1:
            place(drums, snap(), t, gain=0.5, pan=0.1)
        if style == "half" and b % 4 == 3:
            place(drums, snap(), t, gain=0.45)
        place(drums, hat(), t + BEAT / 2, gain=0.55, pan=0.35)
        if style == "full":
            place(drums, hat(), t + BEAT / 4, gain=0.18, pan=-0.35)
            place(drums, hat(), t + 3 * BEAT / 4, gain=0.22, pan=-0.35)
        # bass: pulsa 8-an di groove penuh, 4-an di half
        if style == "full":
            place(bass, bass_note(sl(r - 5), BEAT / 2 * 0.95), t, gain=0.8)
            place(bass, bass_note(sl(r - 5), BEAT / 2 * 0.9), t + BEAT / 2, gain=0.55)
        else:
            place(bass, bass_note(sl(r - 5), BEAT * 0.95), t, gain=0.75)
        # bonang: pola 8-an
        for k in range(2):
            idx = (b * 2 + k) % len(bonang_pat)
            nte = bonang_pat[idx] + (r if r < 3 else r - 5)
            place(bells, bell(sl(nte), dur=1.2, bright=0.8), t + k * BEAT / 2, gain=0.2 if style == "full" else 0.16, pan=0.45 if k else -0.45)


# Groove A: detail montase (ketukan 8–13), lalu turun untuk transisi
groove(8, 14, "full")
place(drums, kendang("dung"), t_of_beat(14), gain=0.8)
place(drums, kendang("dung"), t_of_beat(14.5), gain=0.6)
place(drums, kendang("tak"), t_of_beat(15), gain=0.5)
place(drums, kendang("tak"), t_of_beat(15.25), gain=0.45)
place(drums, kendang("tak"), t_of_beat(15.5), gain=0.55)
place(drums, kendang("tak"), t_of_beat(15.75), gain=0.6)

# GONG — reveal logo (ketukan 16)
place(gongs, gong(55.0), t_of_beat(16), gain=1.0)
# melodi lonceng pelan di adegan logo (16–21)
logo_melody = [(16.0, 10), (17.0, 12), (18.0, 11), (18.5, 13), (19.0, 12), (20.0, 15), (21.0, 14), (21.5, 13)]
for b, nte in logo_melody:
    place(bells, bell(sl(nte), dur=2.8), t_of_beat(b), gain=0.4, pan=np.sin(b) * 0.4)
place(drums, kendang("dung"), t_of_beat(21), gain=0.6)
place(drums, kendang("tak"), t_of_beat(21.5), gain=0.5)

# Groove B (half-time) — koleksi (22–33)
groove(22, 34, "half")
for b, nte in [(26, 12), (27, 13), (28, 15), (30, 12), (31, 11)]:
    place(bells, bell(sl(nte), dur=2.2, bright=1.1), t_of_beat(b), gain=0.32, pan=0.2)

# Groove A kembali — kenapa Srikandi + layanan (34–51)
groove(34, 51, "full")
for b, nte in [(35, 12), (37, 13), (39, 15)]:  # tiga poin
    place(bells, bell(sl(nte), dur=2.4, bright=1.2), t_of_beat(b), gain=0.42, pan=-0.2)
for i, b in enumerate([45, 46, 47, 48]):  # empat layanan
    place(bells, bell(sl([10, 12, 13, 15][i]), dur=1.8, bright=1.1), t_of_beat(b), gain=0.36, pan=[-0.4, 0.4, -0.4, 0.4][i])
# fill kendang menuju gong akhir
for k, g in enumerate([0.5, 0.45, 0.55, 0.6, 0.7, 0.8]):
    place(drums, kendang("tak" if k % 2 else "dung"), t_of_beat(51) + k * BEAT / 6, gain=g)

# GONG akhir — CTA (ketukan 52) + outro lembut
place(gongs, gong(55.0, dur=7.0), t_of_beat(52), gain=1.0)
groove(54, 62, "half")
outro = [(52, 10), (53, 12), (54, 13), (55, 15), (56, 14), (57, 12), (58, 13), (59, 10), (60, 12), (62, 15)]
for b, nte in outro:
    place(bells, bell(sl(nte), dur=2.6), t_of_beat(b), gain=0.34, pan=np.cos(b) * 0.35)
place(bells, bell(sl(10), dur=4.0), t_of_beat(63), gain=0.4)

# sidechain ringan dari kick ke pad agar groove "bernapas"
duck = np.ones(N)
for b in list(range(8, 14)) + list(range(22, 34, 2)) + list(range(34, 51)) + list(range(54, 62, 2)):
    i0 = int(t_of_beat(b) * SR)
    n = int(0.3 * SR)
    seg = 1 - 0.35 * np.exp(-np.arange(n) / SR / 0.09)
    duck[i0 : i0 + n] = np.minimum(duck[i0 : i0 + n], seg[: max(0, min(n, N - i0))])
music = drums * 0.9 + bass * 0.8 * duck[:, None] + reverb(bells, wet=0.55) + reverb(pads, wet=0.35) * 0.9 * duck[:, None] + reverb(gongs, wet=0.25) * 0.95

# ════════════════════════════════════════════════════════════════════════════
#  SFX (frame → detik; 30 fps)
# ════════════════════════════════════════════════════════════════════════════
sfx = buf()
# Hook: jarum menjahit garis bawah (frame 26–54)
place(sfx, whoosh(0.9, peak=0.45, bright=0.6), frame_t(22), gain=0.35)
# Diukur: klik meteran; Dipotong: potongan; Dijahit: tusukan
for k in range(4):
    place(sfx, tick(2600 + k * 150), frame_t(75 + k * 2), gain=0.35)
place(sfx, rip(0.35), frame_t(94), gain=0.7)
place(sfx, whoosh(0.3, peak=0.5, bright=1.3), frame_t(92), gain=0.4)
for k in range(5):
    place(sfx, tick(1800), frame_t(110 + k * 3), gain=0.3)
# Riser ke montase
place(sfx, riser(1.1), frame_t(144) - 1.1, gain=0.55)
# Kartu detail dibagikan tiap ketukan
for i in range(6):
    place(sfx, whoosh(0.42, peak=0.35, bright=0.9), frame_t(144 + i * 18) - 0.08, gain=0.5 - i * 0.02)
# Kartu → lingkaran, riser ke logo
place(sfx, whoosh(0.8, peak=0.6, bright=0.7), frame_t(252), gain=0.45)
place(sfx, riser(1.0), frame_t(288) - 1.0, gain=0.6)
place(sfx, impact(), frame_t(288), gain=0.9)
place(sfx, shimmer(2.4), frame_t(290), gain=0.7)
place(sfx, shimmer(1.6), frame_t(306), gain=0.4)  # tulisan "Srikandi" muncul
# Logo terbelah (gunting) membuka koleksi
place(sfx, rip(0.8), frame_t(390), gain=0.8)
place(sfx, whoosh(0.7, peak=0.5, bright=1.1), frame_t(394), gain=0.6)
# Slider mint → sage
place(sfx, whoosh(1.0, peak=0.5, bright=0.6), frame_t(432), gain=0.4)
# Stiker muncul
for fr in (468, 486, 504, 558):
    place(sfx, pop(), frame_t(fr), gain=0.55)
# Ganti ke gaun batik
place(sfx, whoosh(0.7, peak=0.45, bright=1.0), frame_t(538), gain=0.6)
# Wipe ke "Kenapa Srikandi"
place(sfx, whoosh(0.6, peak=0.55, bright=1.0), frame_t(610), gain=0.6)
for fr in (630, 666, 702):
    place(sfx, tick(2200), frame_t(fr), gain=0.3)
# Wipe ke layanan
place(sfx, whoosh(0.6, peak=0.55, bright=1.0), frame_t(790), gain=0.6)
place(sfx, whoosh(1.8, peak=0.5, bright=0.5), frame_t(804), gain=0.25)  # benang menjalar
# Pita/ribbon masuk
place(sfx, whoosh(0.5, peak=0.4, bright=1.2), frame_t(882), gain=0.5)
place(sfx, whoosh(0.5, peak=0.4, bright=1.2), frame_t(888), gain=0.4)
# Ke CTA: riser + impact tepat di gong
place(sfx, riser(1.2), frame_t(936) - 1.2, gain=0.6)
place(sfx, impact(), frame_t(936), gain=0.9)
place(sfx, shimmer(2.6), frame_t(938), gain=0.7)
place(sfx, pop(), frame_t(972), gain=0.7)  # tombol WhatsApp
place(sfx, tick(2000), frame_t(990), gain=0.3)  # alamat
# kilau tombol berulang
for k in range(4):
    place(sfx, shimmer(0.8), frame_t(972 + 20 + k * 66), gain=0.18)

sfx = reverb(sfx, wet=0.15)


# ─── Master ─────────────────────────────────────────────────────────────────
def fade(x, fin=0.02, fout=1.2):
    n = len(x)
    e = np.ones(n)
    a = int(fin * SR)
    b = int(fout * SR)
    e[:a] = np.linspace(0, 1, a)
    e[-b:] = np.linspace(1, 0, b) ** 1.5
    return x * e[:, None]


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x**2)) + 1e-12)


# EQ: buang sub-bass berlebih (speaker HP tidak mereproduksinya) + low-shelf halus
for c in range(2):
    music[:, c] = highpass(music[:, c], 32, 2)
    music[:, c] = music[:, c] - 0.3 * lowpass(music[:, c], 120, 2)
music = fade(music)
sfx = fade(sfx)

# Target: gabungan musik+sfx ≈ -15 dBFS RMS, puncak ≤ -1 dBFS (soft-clip halus)
mix = music + sfx
g = 10 ** ((-15 - rms_db(mix)) / 20)
music *= g
sfx *= g


def soft(x):
    return np.tanh(x * 1.15) / np.tanh(1.15)


music = soft(music)
sfx = soft(sfx)
peak = max(np.max(np.abs(music + sfx)), 1e-9)
if peak > 0.89:
    music *= 0.89 / peak
    sfx *= 0.89 / peak

os.makedirs(OUT, exist_ok=True)
wavfile.write(os.path.join(OUT, "musik.wav"), SR, (music * 32767).astype(np.int16))
wavfile.write(os.path.join(OUT, "sfx.wav"), SR, (sfx * 32767).astype(np.int16))
print("musik RMS %.1f dB, sfx RMS %.1f dB, mix peak %.2f" % (rms_db(music), rms_db(sfx), np.max(np.abs(music + sfx))))
