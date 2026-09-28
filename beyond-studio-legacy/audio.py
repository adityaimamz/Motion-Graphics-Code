import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000; DUR = 30.0; N = int(SR * DUR)
BPM = 128; BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(11)

dry = np.zeros((N, 2)); send = np.zeros((N, 2))

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def T(n): return np.arange(n) / SR
def pan(sig, p=0.0):
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([sig * l, sig * r], 1)
def add(sig, t, g=1.0, p=0.0, rv=0.0):
    st = sig if sig.ndim == 2 else pan(sig, p)
    i = int(round(t * SR))
    if i < 0: st = st[-i:]; i = 0
    j = min(N, i + len(st))
    if j <= i: return
    dry[i:j] += st[:j - i] * g
    if rv: send[i:j] += st[:j - i] * g * rv
def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x)

# brand ease (same curve the visuals use) for sync-accurate ticks
def bez(x1, y1, x2, y2):
    def f(x):
        if x <= 0: return 0.0
        if x >= 1: return 1.0
        lo, hi = 0.0, 1.0
        for _ in range(50):
            m = (lo + hi) / 2
            sx = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m * m * x2 + m ** 3
            if sx < x: lo = m
            else: hi = m
        m = (lo + hi) / 2
        return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m * m * y2 + m ** 3
    return f
eOut = bez(.23, 1, .32, 1)

# ---------------- instruments ----------------
def kick(g=1.0):
    n = int(0.55 * SR); t = T(n)
    f = 44 + 118 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)
    click = filt(rng.standard_normal(n), 'highpass', 2500) * np.exp(-t * 400) * 0.25
    return np.tanh(1.6 * (s + click)) * g

def hat(dec=70, g=1.0):
    n = int(0.12 * SR); t = T(n)
    return filt(rng.standard_normal(n), 'highpass', 8000, 4) * np.exp(-t * dec) * g

def clap(g=1.0):
    n = int(0.4 * SR); t = T(n); nz = filt(rng.standard_normal(n), 'bandpass', [900, 3200])
    env = np.zeros(n)
    for k, d in enumerate([0, .011, .023]):
        i = int(d * SR); env[i:] += np.exp(-(t[:n - i]) * 180) * (0.8 if k < 2 else 1.0)
    env += np.exp(-np.maximum(t - .023, 0) * 16) * (t > .023) * 0.55
    return nz * env * g

def pluck(freq, dur=0.35, dec=10.0, bright=0.25):
    n = int(dur * SR); t = T(n)
    s = np.sin(2 * np.pi * freq * t) + bright * np.sin(4 * np.pi * freq * t) * np.exp(-t * 20)
    a = np.minimum(1, t / 0.003)
    return s * np.exp(-t * dec) * a

def bell(freq, dur=2.2, g=1.0):
    n = int(dur * SR); t = T(n)
    parts = [(1, 1.0, 2.2), (2.0, .35, 4), (3.01, .18, 6), (4.17, .12, 9), (5.43, .06, 12)]
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in parts)
    return s * np.minimum(1, t / 0.002) * g

def blip(freq=2400, dur=0.05, g=1.0):
    n = int(dur * SR); t = T(n)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 90) * g

def tick(g=1.0):
    n = int(0.02 * SR); t = T(n)
    return filt(rng.standard_normal(n), 'bandpass', [2500, 7000]) * np.exp(-t * 500) * g

def sweep_noise(dur, f0, f1, shape_peak=0.8, width=0.5, g=1.0):
    """Noise whoosh with a band centre moving log-linearly from f0 to f1 (STFT mask)."""
    n = int(dur * SR); x = rng.standard_normal(n + 2048)
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024)
    prog = np.clip(tt / dur, 0, 1)
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * prog)
    lf = np.log(np.maximum(f, 20))[:, None]
    mask = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * width ** 2))
    env = np.where(prog < shape_peak, (prog / shape_peak) ** 2.2, np.exp(-(prog - shape_peak) / (1 - shape_peak + 1e-6) * 4))
    _, y = signal.istft(Z * mask * env[None, :], fs=SR, nperseg=1024)
    y = y[:n]; return y / (np.max(np.abs(y)) + 1e-9) * g

def sub_boom(g=1.0, dur=1.8, f0=72, f1=32):
    n = int(dur * SR); t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    return np.tanh(1.3 * s) * g

def noise_hit(dur=1.2, lp=6000, dec=4.0, g=1.0):
    n = int(dur * SR); t = T(n)
    return filt(rng.standard_normal(n), 'lowpass', lp) * np.exp(-t * dec) * g

# ---------------- harmony ----------------
# (start, bass midi, pad voicing)
F9 = (41, [57, 60, 64, 67]); Dm9 = (38, [53, 57, 60, 64]); Bb = (34, [53, 57, 62, 64]); C69 = (36, [55, 57, 62, 64])
CH = [(0, F9), (3.75, Dm9), (7.5, Bb), (11.25, C69), (15.0, F9), (18.75, Dm9), (22.5, Bb), (24.375, C69), (26.25, F9)]
def chord_at(t):
    c = CH[0][1]
    for s, ch in CH:
        if t >= s: c = ch
    return c

# kick grid + sidechain
kicks = [3.75 + i * BEAT for i in range(64) if 3.75 + i * BEAT < 25.9]
kicks = [k for k in kicks if not (18.75 <= k < 20.62)]
sc = np.ones(N); tt = T(N)
for k in kicks:
    i = int(k * SR); m = min(N, i + int(0.45 * SR))
    sc[i:m] = np.minimum(sc[i:m], 1 - 0.62 * np.exp(-(tt[i:m] - k) / 0.11))

# ---- pad
pad = np.zeros((N, 2))
cut = lambda t: 500 if t < 1.8 else (1400 if t < 7.5 else (2200 if t < 18.75 else (1300 if t < 22.5 else (2800 if t < 26.25 else 1600))))
for idx, (s, (bm, notes)) in enumerate(CH):
    e = CH[idx + 1][0] if idx + 1 < len(CH) else DUR
    dur = e - s + 0.6; n = int(dur * SR); t = T(n)
    seg = np.zeros((n, 2))
    for m in notes:
        for dcent, p in [(-7, -.6), (0, 0), (7, .6)]:
            f = mtof(m) * 2 ** (dcent / 1200)
            ph = rng.uniform(0, 1)
            v = signal.sawtooth(2 * np.pi * (f * t + ph)) * 0.5 + np.sin(2 * np.pi * (f * t + ph)) * 0.5
            seg += pan(v, p) * 0.18
    atk = 0.9 if s == 0 else 0.08
    env = np.minimum(1, t / atk) * np.clip((dur - t) / 0.6, 0, 1)
    seg *= env[:, None]
    c = cut(s + 0.01)
    seg = np.stack([filt(seg[:, 0], 'lowpass', c), filt(seg[:, 1], 'lowpass', c)], 1)
    i = int(s * SR); j = min(N, i + n); pad[i:j] += seg[:j - i]
pad *= sc[:, None]
# intro swell
sw = np.clip(tt / 1.8, 0, 1) ** 1.5; sw[int(1.8 * SR):] = 1
pad[:, 0] *= sw; pad[:, 1] *= sw
dry += pad * 0.30; send += pad * 0.20

# ---- bass (from 3.75 to 25.9, then final note)
bass = np.zeros(N)
for s_i in range(int(3.75 * SR), int(25.9 * SR), int(BEAT / 2 * SR)):
    pass
b_t = np.arange(int(3.75 * SR), int(25.95 * SR))
for idx, (s, (bm, _)) in enumerate(CH):
    e = CH[idx + 1][0] if idx + 1 < len(CH) else DUR
    a, b = max(s, 3.75), min(e, 25.95)
    if b <= a: continue
    i, j = int(a * SR), int(b * SR); t = T(j - i); f = mtof(bm + 12)
    v = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    v *= np.minimum(1, t / 0.02) * np.clip((b - a - t) / 0.03, 0, 1)
    bass[i:j] += v
bass = filt(bass, 'lowpass', 380) * sc
bass[int(18.75 * SR):int(22.5 * SR)] *= 0.75
dry += pan(bass, 0) * 0.26
# final low note
add(pluck(mtof(29 + 12), 3.5, 1.2, 0.1), 26.25, 0.3)

# ---- drums
for k in kicks: add(kick(), k, 0.62)
for i in range(64):
    t0 = 3.75 + i * BEAT
    if t0 >= 25.9: break
    # offbeat open-ish hats
    add(hat(38, 1.0), t0 + BEAT / 2, 0.10 if t0 < 7.5 else 0.13, p=0.25)
    # 16th hats in main sections
    if 7.5 <= t0 < 18.75 or 22.5 <= t0 < 25.9:
        for q in [1, 3]:
            add(hat(90), t0 + q * BEAT / 4, 0.045, p=-0.3)
    # claps on 2 & 4
    beat_in_bar = i % 4
    if (7.5 <= t0 < 18.75 or 22.5 <= t0 < 25.9) and beat_in_bar in (1, 3):
        add(clap(), t0, 0.16, rv=0.35)
# pre-drop snare roll 21.56 → 22.5
roll_t = 20.625; step = BEAT / 2
while roll_t < 22.48:
    g = 0.04 + 0.1 * (roll_t - 20.625) / 1.9
    add(clap(), roll_t, g, p=rng.uniform(-.2, .2), rv=0.25)
    if roll_t > 21.56: step = BEAT / 4
    if roll_t > 22.03: step = BEAT / 8
    roll_t += step
# build into 7.5
for q in range(8):
    add(hat(60), 6.5625 + q * BEAT / 4 + BEAT / 8, 0.03 + q * 0.008, p=0.2)

# ---- arp (16ths)
for i in range(int((DUR) / (BEAT / 4))):
    t0 = i * BEAT / 4
    if not (7.5 <= t0 < 18.75 or 22.5 <= t0 < 25.9): continue
    bm, notes = chord_at(t0 + 0.001)
    seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 24, notes[3] + 12, notes[1] + 12, notes[2] + 12]
    m = seq[i % 8]
    g = 0.05 if i % 4 else 0.07
    add(pluck(mtof(m), 0.3, 14, 0.3) * sc[min(N - 1, int(t0 * SR))], t0, g, p=0.35 * np.sin(i * 0.7), rv=0.45)

# ======================= SFX bus (its own stem from here on) =======================
music_dry, music_send = dry, send
dry = np.zeros((N, 2)); send = np.zeros((N, 2))

# ---------------- sound design, locked to picture ----------------
# S1: riser into lock, arrow flight, logo lock
add(sweep_noise(1.65, 400, 7000, 0.95, 0.6), 0.22, 0.10, rv=0.3)
add(sweep_noise(0.9, 180, 2600, 0.88, 0.45), 1.0, 0.16, p=-0.3)
add(sub_boom(1.0), 1.875, 0.55)
add(noise_hit(1.6, 5000, 3.2), 1.875, 0.10, rv=0.6)
add(blip(3200, 0.06), 1.875, 0.25)
for k, m in enumerate([77, 81, 84, 88]):  # F-maj9 bell stack = the logo "sound"
    add(bell(mtof(m), 2.6), 1.875 + k * 0.012, 0.075, p=(k - 1.5) * 0.35, rv=0.8)
for j in range(13):  # wordmark letters
    add(tick(0.6), 2.2 + j * 0.03, 0.05, p=-0.4 + j * 0.06)
add(sweep_noise(0.5, 300, 9000, 0.85, 0.5), 3.26, 0.2, p=0.4)  # launch
# S2 word hits
add(sub_boom(0.7, 0.8, 90, 40), 3.75, 0.3)
add(noise_hit(0.5, 9000, 12), 4.69, 0.14, rv=0.4); add(sub_boom(0.9, 1.0, 80, 36), 4.69, 0.42); add(clap(), 4.69, 0.14, rv=0.4)
add(sweep_noise(0.55, 500, 8000, 0.7, 0.35), 5.55, 0.12)
add(sweep_noise(0.9, 200, 5000, 0.9, 0.5), 6.6, 0.1)
add(noise_hit(1.4, 7000, 3.5), 7.5, 0.08, rv=0.5)
# chapter pans
for pk in [11.25, 15.02, 18.6]:
    add(sweep_noise(0.7, 250, 6000, 0.6, 0.5), pk - 0.42, 0.14, p=0.2)
# store tap + cart
add(blip(1800, 0.04), 9.84, 0.22); add(tick(), 9.84, 0.2)
add(bell(mtof(88), 0.9), 10.0, 0.06, p=0.4, rv=0.4); add(bell(mtof(93), 0.9), 10.08, 0.05, p=0.4, rv=0.4)
# chart bars
for i in range(6): add(pluck(mtof(72 + [0, 2, 4, 7, 9, 12][i]), 0.25, 20, 0.2), 8.35 + i * 0.07, 0.035, p=-0.4, rv=0.3)
# thesis checks: ascending pentatonic
for i, m in enumerate([77, 79, 81, 84, 86]):
    add(bell(mtof(m + 12), 0.8), 15.94 + i * 0.46875, 0.06, p=-0.3, rv=0.5); add(tick(), 15.94 + i * 0.46875, 0.12)
# gauge fill shimmer
add(sweep_noise(1.6, 1500, 9000, 0.3, 0.25), 16.1, 0.03, p=0.4, rv=0.5)
# responsive morphs
add(sweep_noise(0.95, 400, 2400, 0.5, 0.4), 19.38, 0.07, p=0.3)
add(sweep_noise(0.95, 700, 4000, 0.5, 0.4), 20.58, 0.07, p=-0.3)
add(sweep_noise(1.9, 300, 10000, 0.98, 0.6), 20.6, 0.11, rv=0.3)  # riser to drop
add(blip(2000, 0.04), 21.93, 0.25); add(tick(), 21.93, 0.2)
add(sweep_noise(0.5, 200, 7000, 0.95, 0.5), 22.0, 0.2)
# drop
add(sub_boom(1.0, 2.0, 80, 30), 22.5, 0.55); add(noise_hit(2.0, 8000, 2.2), 22.5, 0.13, rv=0.7)
# odometer ratchets (tick every digit crossing, using the same easing as the picture)
def odo_ticks(t0, steps, dur=1.05):
    last = 0; out = []
    for s in range(int(dur * SR / 48)):
        tt_ = s * 48 / SR; v = steps * eOut(tt_ / dur)
        if int(v) > last: out.append(t0 + tt_); last = int(v)
    return out
for t0, steps, p in [(22.52, 20, -0.45), (22.92, 28, 0.45)]:
    for x in odo_ticks(t0, steps): add(tick(0.8), x, 0.07, p=p)
add(bell(mtof(84), 1.2), 23.1, 0.05, p=-0.4, rv=0.5); add(bell(mtof(88), 1.2), 23.5, 0.05, p=0.4, rv=0.5)
# word swaps
add(clap(), 24.375, 0.1, rv=0.4); add(sub_boom(0.6, 0.7, 90, 45), 24.375, 0.25)
add(clap(), 25.31, 0.1, rv=0.4); add(sub_boom(0.6, 0.7, 90, 45), 25.31, 0.25)
# wipe + CTA
add(sweep_noise(0.45, 300, 8000, 0.75, 0.5), 25.9, 0.22, p=0.3)
add(sub_boom(0.6, 1.6, 60, 30), 26.3, 0.35); add(noise_hit(1.8, 4000, 2.5), 26.3, 0.06, rv=0.7)
for k, m in enumerate([77, 81, 84, 88]):
    add(bell(mtof(m), 3.0), 26.75 + k * 0.014, 0.06, p=(k - 1.5) * 0.35, rv=0.9)
TYPE = np.cumsum([0, .06, .04, .07, .05, .05, .09, .04, .05, .06, .04, .05, .08, .05, .04, .06, .05])
for x in TYPE: add(tick(0.9), 27.85 + x, 0.10, p=rng.uniform(-.15, .15)); add(blip(3400, 0.02), 27.85 + x, 0.03)
add(bell(mtof(89), 1.8), 28.62, 0.08, p=0.2, rv=0.7); add(bell(mtof(96), 1.8), 28.7, 0.06, p=0.25, rv=0.7)
add(blip(1600, 0.05), 29.05, 0.2); add(tick(), 29.05, 0.18)

# ---------------- new SFX: guide arrow through-line + live UI ----------------
def click(g=1.0, body=190):
    """mouse click: press + release transients with a small plastic body"""
    n = int(0.12 * SR); y = np.zeros(n)
    for d, a in [(0, 1.0), (0.065, 0.55)]:
        i = int(d * SR); m = n - i; tm = T(m)
        y[i:] += (filt(rng.standard_normal(m), 'bandpass', [1800, 9000]) * np.exp(-tm * 900)
                  + np.sin(2 * np.pi * body * tm) * np.exp(-tm * 160) * 0.35) * a
    return y / (np.max(np.abs(y)) + 1e-9) * g
def pop(f0=900, f1=260, dur=0.09, g=1.0):
    n = int(dur * SR); t = T(n); f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * g
def zip_up(dur=0.38, g=1.0):
    """fast ascending air + tonal zip (arrow leaving upward)"""
    base = sweep_noise(dur, 600, 12000, 0.8, 0.35); n = len(base); t = T(n)
    f = 500 + 3500 * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / (dur * 0.8)) ** 2 * np.exp(-np.maximum(0, t - dur * 0.8) * 40) * 0.25
    return (base + tone) * g
def land(g=1.0):
    """arrow tucks into a screen and becomes the cursor: soft thump + glassy tick"""
    n = int(0.25 * SR); t = T(n)
    return (np.sin(2 * np.pi * (140 + 80 * np.exp(-t * 40)) * t) * np.exp(-t * 28)
            + filt(rng.standard_normal(n), 'bandpass', [3000, 9000]) * np.exp(-t * 400) * 0.6
            + np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 30) * 0.18) * g
def swish(dur=0.3, f0=1500, f1=5000, g=1.0): return sweep_noise(dur, f0, f1, 0.5, 0.45) * g
def add_move(sig, t, g, p0, p1, rv=0.0):
    """mono sound whose stereo position travels from p0 to p1 (follows the arrow on screen)"""
    pp = np.linspace(p0, p1, len(sig)); l = np.cos((pp + 1) * np.pi / 4); r = np.sin((pp + 1) * np.pi / 4)
    add(np.stack([sig * l, sig * r], 1), t, g, rv=rv)
X = lambda x: float(np.clip((x - 960) / 960 * 0.8, -0.9, 0.9))   # screen x -> stereo pan

# "Launched.": arrow rises under the word, then punches up through it (letters scatter centre-out)
add(sweep_noise(0.32, 180, 1400, 0.9, 0.45), 5.82, 0.10)
add(zip_up(0.34), 6.16, 0.20, rv=0.25); add(sub_boom(0.5, 0.5, 110, 55), 6.2, 0.18)
for j in range(9): add(tick(0.5), 6.3 + abs(j - 4) * 0.03, 0.035, p=(j - 4) * 0.1)
# every chapter: the arrow rises with the devices and lands in the screen as the cursor
for t0, t1, xa, xb in [(7.46, 8.55, 1330, 1326), (11.3, 12.05, 1330, 1541), (14.98, 15.55, 1330, 1572), (18.58, 19.2, 1240, 1359)]:
    add_move(sweep_noise(t1 - t0, 250, 3200, 0.55, 0.5), t0, 0.12, X(xa), X(xb), rv=0.2)
    add(land(), t1 - 0.01, 0.16, p=X(xb), rv=0.35)
# ...then turns back into the arrow and zips up out of frame, pulling the next chapter in
for t0, xa in [(10.72, 1362), (14.52, 1512), (18.02, 1561)]:
    add_move(zip_up(0.4), t0, 0.16, X(xa), X(1480), rv=0.25)
# live UI: Angga Jaya laptop (size M, qty +1, add to cart in sync with the phone)
for tc, x in [(8.906, 1447), (9.375, 1465), (9.844, 1532)]: add(click(), tc - 0.02, 0.2, p=X(x))
add(pluck(mtof(84), 0.25, 18, 0.3), 8.93, 0.05, p=X(1447)); add(pop(1200, 500, 0.06), 9.40, 0.07, p=X(1465))
# izaditya: click "See projects", page glides into the case study
add(click(), 12.636, 0.2, p=X(1400)); add(swish(0.66, 400, 1800), 12.74, 0.08, p=0.35)
# SIMALA: click "Jelajahi" -> diagnosis + thesis respond
add(click(), 15.92, 0.2, p=X(1450))
# Nexora: layout snaps into tablet / phone, then the click
add(click(0.9, 220), 20.33, 0.06, p=0.1); add(click(0.9, 220), 21.53, 0.06, p=-0.05); add(click(), 21.88, 0.2)
# typography swishes
add(swish(0.3, 2500, 7000), 4.47, 0.05); add(swish(0.4, 1200, 5000), 5.63, 0.05); add(swish(0.5, 900, 4000), 6.56, 0.05, p=-0.3)
for tw in [11.0, 14.76]: add(swish(0.3, 3000, 8000), tw, 0.04, p=-0.6)
for tw in [11.2, 14.94]: add(swish(0.4, 1000, 4500), tw, 0.05, p=-0.6)
add(swish(0.5, 900, 4000), 21.12, 0.05, p=-0.4)
add(swish(0.4, 1200, 5000), 24.37, 0.05); add(swish(0.4, 1200, 5000), 25.3, 0.05); add(swish(0.6, 800, 4000), 26.95, 0.05)
# glass sheens on the screens
for ts, x in [(8.25, 1370), (11.95, 1390), (15.7, 1410)]: add(sweep_noise(0.9, 4000, 12000, 0.5, 0.3), ts, 0.025, p=X(x), rv=0.4)
# arrowhead wipe travels left -> right; CTA arrow flies into the ring; pill + button pops
add_move(sweep_noise(0.42, 250, 6000, 0.7, 0.5), 25.93, 0.14, -0.8, 0.8, rv=0.2)
add_move(sweep_noise(0.3, 400, 4000, 0.85, 0.45), 26.62, 0.12, -0.6, -0.1)
add(pop(700, 220, 0.12), 27.47, 0.10); add(pop(1000, 300, 0.1), 28.64, 0.08, p=0.25)

# WhatsApp end card: pill pops in beside the URL, QR arrives, icon pulses
add(pop(820, 260, 0.11), 28.44, 0.10, p=0.2); add(pluck(mtof(81), 0.3, 16, 0.25), 28.46, 0.04, p=0.2, rv=0.4)
add(bell(mtof(93), 1.0), 28.85, 0.03, p=0.6, rv=0.6)
add(blip(1400, 0.05), 29.4, 0.08, p=0.2)
# virtual camera: pull-out reveal (portfolio) and push-in on the cards (academic)
add(sweep_noise(0.8, 2200, 500, 0.3, 0.5), 12.85, 0.05, p=0.3, rv=0.3)
add(sweep_noise(1.2, 300, 1800, 0.85, 0.5), 16.1, 0.045, p=0.3, rv=0.3)

# ---------------- reverb + master ----------------
ir_n = int(2.4 * SR); it = T(ir_n)
ir = np.stack([rng.standard_normal(ir_n), rng.standard_normal(ir_n)], 1) * np.exp(-it * 2.9)[:, None]
ir = np.stack([filt(ir[:, 0], 'lowpass', 6500), filt(ir[:, 1], 'lowpass', 6500)], 1)
ir[: int(0.012 * SR)] = 0
def bus_out(d, sd):
    wet = np.stack([signal.fftconvolve(sd[:, c], ir[:, c])[:N] for c in range(2)], 1)
    wet /= (np.max(np.abs(wet)) + 1e-9); wet *= np.max(np.abs(sd)) * 0.9
    out = d + wet * 0.55
    return np.stack([filt(out[:, c], 'highpass', 28) for c in range(2)], 1)
music = bus_out(music_dry, music_send); fx = bus_out(dry, send)
# music ducks up to ~3.5 dB under loud sound design so the picture hits read clearly
env = np.clip(filt(np.max(np.abs(fx), 1), 'lowpass', 7), 0, None)
music *= (1 - 0.33 * np.clip(env / (np.percentile(env, 99.7) + 1e-9), 0, 1))[:, None]
fade = np.ones(N); fs = int(29.0 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.6
fi = int(0.02 * SR); fade[:fi] *= np.linspace(0, 1, fi)
music *= fade[:, None]; fx *= fade[:, None]
mix = np.tanh((music + fx) * 1.2) / np.tanh(1.2)
mix /= np.max(np.abs(mix)) * 1.12
root = __import__('pathlib').Path(__file__).resolve().parent
wavfile.write(str(root / 'score.wav'), SR, (mix * 32767).astype(np.int16))
# stems (linear, same gain): swap the music for a licensed track and keep the SFX
g = 0.89 / (np.max(np.abs(music + fx)) + 1e-9)
wavfile.write(str(root / 'score_music.wav'), SR, (np.clip(music * g, -1, 1) * 32767).astype(np.int16))
wavfile.write(str(root / 'sfx.wav'), SR, (np.clip(fx * g, -1, 1) * 32767).astype(np.int16))
print('ok: score.wav (mix), score_music.wav + sfx.wav (stems); peak', round(float(np.max(np.abs(mix))), 3),
      'rms dB', round(float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))), 2))
