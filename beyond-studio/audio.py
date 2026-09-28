"""
Soundtrack Beyond Studio 45 s (128 BPM, 24 bar), 100% disintesis dari kode (NumPy/SciPy, 48 kHz).
Semua waktu dibaca dari cues.json (sumber waktu yang sama dengan gambar di app/).
Hasil: app/public/audio/score.wav (mix), score_music.wav + sfx.wav (stem, gain sama).
Pemakaian: python audio.py   (jalankan ulang setiap kali cues.json diubah)
"""
import json, pathlib
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parent
C = json.loads((ROOT / 'cues.json').read_text(encoding='utf-8'))
SR = 48000; DUR = float(C['dur']); N = int(SR * DUR)
BPM = C['bpm']; BEAT = 60 / BPM; BAR = 4 * BEAT
CH = C['ch']
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

# ======================= music =======================
# harmony: (start, (bass midi, pad voicing)) — intro, groove through the device sets, lift on the proof, home on the closing
F9 = (41, [57, 60, 64, 67]); Dm9 = (38, [53, 57, 60, 64]); Bb = (34, [53, 57, 62, 64]); C69 = (36, [55, 57, 62, 64])
HARM = [(0, F9), (3.75, Dm9), (7.5, Bb), (11.25, C69), (15.0, F9), (18.75, Dm9), (22.5, Bb), (26.25, C69), (30.0, Bb), (33.75, C69), (37.5, F9)]
def chord_at(t):
    c = HARM[0][1]
    for s, ch in HARM:
        if t >= s: c = ch
    return c

GROOVE = (CH['bisnis'][0], C['resize6'][2] + BEAT * 2)       # 7.5 → the breakdown before the drop
BREAK = (GROOVE[1], C['flood'])                              # held breath, snare roll into the flood
PROOF = (C['flood'], C['wipe'])
END = C['wipe']
def in_main(t): return GROOVE[0] <= t < GROOVE[1] or PROOF[0] <= t < PROOF[1]

kicks = [3.75 + i * BEAT for i in range(200) if 3.75 + i * BEAT < END]
kicks = [k for k in kicks if not (BREAK[0] <= k < BREAK[1])]
sc = np.ones(N); tt = T(N)
for k in kicks:
    i = int(k * SR); m = min(N, i + int(0.45 * SR))
    sc[i:m] = np.minimum(sc[i:m], 1 - 0.62 * np.exp(-(tt[i:m] - k) / 0.11))

# ---- pad
pad = np.zeros((N, 2))
def cut(t):
    if t < 1.8: return 500
    if t < GROOVE[0]: return 1400
    if t < BREAK[0]: return 2200
    if t < PROOF[0]: return 1300
    if t < PROOF[1]: return 2800
    return 1600
for idx, (s, (bm, notes)) in enumerate(HARM):
    e = HARM[idx + 1][0] if idx + 1 < len(HARM) else DUR
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
sw = np.clip(tt / 1.8, 0, 1) ** 1.5; sw[int(1.8 * SR):] = 1
pad[:, 0] *= sw; pad[:, 1] *= sw
dry += pad * 0.30; send += pad * 0.20

# ---- bass (3.75 → the wipe), then the closing's low note
bass = np.zeros(N)
for idx, (s, (bm, _)) in enumerate(HARM):
    e = HARM[idx + 1][0] if idx + 1 < len(HARM) else DUR
    a, b = max(s, 3.75), min(e, END + 0.05)
    if b <= a: continue
    i, j = int(a * SR), int(b * SR); t = T(j - i); f = mtof(bm + 12)
    v = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    v *= np.minimum(1, t / 0.02) * np.clip((b - a - t) / 0.03, 0, 1)
    bass[i:j] += v
bass = filt(bass, 'lowpass', 380) * sc
bass[int(BREAK[0] * SR):int(BREAK[1] * SR)] *= 0.7
dry += pan(bass, 0) * 0.26
add(pluck(mtof(29 + 12), 4.5, 1.0, 0.1), CH['closing'][0], 0.3)

# ---- drums
i = 0
for k in kicks: add(kick(), k, 0.62)
while True:
    t0 = 3.75 + i * BEAT
    if t0 >= END: break
    if not (BREAK[0] <= t0 < BREAK[1]):
        add(hat(38, 1.0), t0 + BEAT / 2, 0.10 if t0 < GROOVE[0] else 0.13, p=0.25)
    if in_main(t0):
        for q in [1, 3]: add(hat(90), t0 + q * BEAT / 4, 0.045, p=-0.3)
        if i % 4 in (1, 3): add(clap(), t0, 0.16, rv=0.35)
    i += 1
# snare roll through the breakdown into the flood
roll_t = BREAK[0]; span = BREAK[1] - BREAK[0]
while roll_t < BREAK[1] - 0.02:
    k = (roll_t - BREAK[0]) / span
    add(clap(), roll_t, 0.04 + 0.1 * k, p=rng.uniform(-.2, .2), rv=0.25)
    roll_t += BEAT / 2 if k < 0.5 else (BEAT / 4 if k < 0.75 else BEAT / 8)
# build into the first set
for q in range(8): add(hat(60), C['launch'] + q * BEAT / 4 + BEAT / 8, 0.03 + q * 0.008, p=0.2)

# ---- arp (16ths) in the main sections
for i in range(int(DUR / (BEAT / 4))):
    t0 = i * BEAT / 4
    if not in_main(t0): continue
    bm, notes = chord_at(t0 + 0.001)
    seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 24, notes[3] + 12, notes[1] + 12, notes[2] + 12]
    g = 0.05 if i % 4 else 0.07
    add(pluck(mtof(seq[i % 8]), 0.3, 14, 0.3) * sc[min(N - 1, int(t0 * SR))], t0, g, p=0.35 * np.sin(i * 0.7), rv=0.45)

# ======================= SFX bus (its own stem) =======================
music_dry, music_send = dry, send
dry = np.zeros((N, 2)); send = np.zeros((N, 2))

def logo_lock(t):
    add(sub_boom(1.0), t, 0.55); add(noise_hit(1.6, 5000, 3.2), t, 0.10, rv=0.6); add(blip(3200, 0.06), t, 0.25)
    for k, m in enumerate([77, 81, 84, 88]):   # F maj9 bell stack = the logo sound
        add(bell(mtof(m), 2.6), t + k * 0.012, 0.075, p=(k - 1.5) * 0.35, rv=0.8)
def arrow_in(t_lock):
    add_move(sweep_noise(0.95, 180, 2600, 0.88, 0.45), t_lock - 0.9, 0.16, -0.8, 0.1)
def takeoff(t):
    add(zip_up(0.4), t, 0.16, rv=0.25); add_move(sweep_noise(0.5, 250, 6000, 0.6, 0.5), t + 0.05, 0.1, 0.0, 0.2, rv=0.2)
def landing(t0, t1):
    add_move(sweep_noise(t1 - t0, 250, 3200, 0.55, 0.5), t0, 0.12, 0.1, 0.0, rv=0.2); add(land(), t1 - 0.01, 0.16, rv=0.35)
def odo_ticks(t0, steps, dur=1.25):
    last = 0; out = []
    for s in range(int(dur * SR / 48)):
        tt_ = s * 48 / SR; v = steps * eOut(tt_ / dur)
        if int(v) > last: out.append(t0 + tt_); last = int(v)
    return out

# S1 logo: studio light, ring riser, the arrow, the lock, the wordmark, take-off right
add(click(0.8, 90), 0.0, 0.10); add(noise_hit(0.6, 900, 6), 0.0, 0.04)
add(sweep_noise(1.65, 400, 7000, 0.95, 0.6), 0.22, 0.10, rv=0.3)
arrow_in(C['lock1']); logo_lock(C['lock1'])
for j in range(13): add(tick(0.6), 2.1 + j * 0.03, 0.05, p=-0.4 + j * 0.06)
add_move(sweep_noise(0.9, 300, 9000, 0.85, 0.5), 2.85, 0.2, 0.0, 0.9)
# S2 words
w1, w2, w3 = C['words']
add(sub_boom(0.7, 0.8, 90, 40), w1, 0.3); add(swish(0.4, 1200, 5000), w1, 0.05)
add(noise_hit(0.5, 9000, 12), w2, 0.14, rv=0.4); add(sub_boom(0.9, 1.0, 80, 36), w2, 0.42); add(clap(), w2, 0.14, rv=0.4)
add(sweep_noise(0.55, 500, 8000, 0.7, 0.35), w3 - 0.08, 0.12); add(swish(0.5, 900, 4000), w3, 0.05)
L = C['launch']
add(sweep_noise(0.45, 180, 1400, 0.9, 0.45), L - 0.45, 0.10)
add(zip_up(0.34), L - 0.3, 0.20, rv=0.25); add(sub_boom(0.5, 0.5, 110, 55), L, 0.22)
for j in range(12): add(tick(0.5), L + 0.03 + abs(j - 5.5) * 0.018, 0.035, p=(j - 5.5) * 0.08)
add(sweep_noise(CH['proses'][1] - L, 200, 5000, 0.9, 0.5), L, 0.1)
# S3 bisnis
landing(CH['bisnis'][0], C['land3'])
c1, c2, c3 = C['click3']
for tc in (c1, c2, c3): add(click(), tc - 0.02, 0.2, p=0.15)
add(pluck(mtof(84), 0.25, 18, 0.3), c1 + 0.03, 0.05, p=0.15); add(pop(1200, 500, 0.06), c2 + 0.03, 0.07, p=0.15)
add(blip(1800, 0.04), c3, 0.18, p=0.35); add(bell(mtof(88), 0.9), c3 + 0.16, 0.06, p=0.4, rv=0.4); add(bell(mtof(93), 0.9), c3 + 0.24, 0.05, p=0.4, rv=0.4)
r3 = C['rev3']
add(swish(0.6, 400, 2400), r3, 0.06, p=-0.3)
for i in range(6): add(pluck(mtof(72 + [0, 2, 4, 7, 9, 12][i]), 0.25, 20, 0.2), r3 + 0.1 + i * 0.07, 0.035, p=-0.4, rv=0.3)
add(pop(1000, 300, 0.1), r3 + 0.65, 0.07, p=-0.4)
for pk, tk in [(CH['bisnis'][0], C['takeoff3']), (CH['portofolio'][0], C['takeoff4']), (CH['skripsi'][0], C['takeoff5'])]:
    add(sweep_noise(0.9, 4000, 12000, 0.5, 0.3), pk + 0.75, 0.025, p=0.3, rv=0.4)   # glass sheen
    takeoff(tk)
# S4 portofolio
landing(CH['portofolio'][0], C['land4'])
k4 = C['click4'][0]
add(click(), k4 - 0.02, 0.2, p=-0.1); add(swish(0.66, 400, 1800), k4 + 0.08, 0.08, p=0.35)
add(sweep_noise(1.9, 2200, 500, 0.3, 0.5), 15.0, 0.05, p=0.3, rv=0.3)
# S5 skripsi
landing(CH['skripsi'][0], C['land5'])
k5 = C['click5'][0]
add(click(), k5 - 0.02, 0.2, p=0.1)
add(sweep_noise(1.2, 300, 1800, 0.85, 0.5), k5 + 0.1, 0.045, p=0.3, rv=0.3)
for m, tc in zip([77, 79, 81, 84, 86], C['ticks5']):
    add(bell(mtof(m + 12), 0.8), tc, 0.06, p=-0.3, rv=0.5); add(tick(), tc, 0.12)
add(sweep_noise(1.6, 1500, 9000, 0.3, 0.25), C['gauge5'], 0.03, p=0.4, rv=0.5)
# S6 responsif
landing(CH['responsif'][0], C['land6'])
for tr in C['resize6'][:2]:
    add(click(0.9, 220), tr, 0.06); add(sweep_noise(0.9, 500, 3200, 0.5, 0.4), tr, 0.07, p=0.2)
add(swish(0.5, 900, 4000), 27.4, 0.05, p=-0.4)
add(sweep_noise(BREAK[1] - BREAK[0], 300, 10000, 0.98, 0.6), BREAK[0], 0.11, rv=0.3)   # riser to the drop
k6 = C['click6']
add(click(), k6 - 0.02, 0.2); add(sweep_noise(0.5, 200, 7000, 0.95, 0.5), k6 + 0.02, 0.2)
# S7 bukti: the drop, odometers, key values, arrowhead wipe
FL = C['flood']
add(sub_boom(1.0, 2.0, 80, 30), FL, 0.55); add(noise_hit(2.0, 8000, 2.2), FL, 0.13, rv=0.7)
for t0, steps in [(C['num7'][0], 28), (C['num7'][1], 27)]:
    for x in odo_ticks(t0, steps): add(tick(0.8), x, 0.07, p=-0.45)
add(bell(mtof(84), 1.2), C['num7'][0] + 1.0, 0.05, p=-0.4, rv=0.5); add(bell(mtof(88), 1.2), C['num7'][1] + 1.0, 0.05, p=-0.4, rv=0.5)
for tk in C['kv7']:
    add(clap(), tk, 0.1, rv=0.4); add(sub_boom(0.6, 0.7, 90, 45), tk, 0.25); add(swish(0.4, 1200, 5000), tk, 0.05)
add_move(sweep_noise(0.47, 250, 6000, 0.7, 0.5), C['wipe'], 0.16, -0.8, 0.8, rv=0.2)
# S8 closing
T8 = CH['closing'][0]
add(sub_boom(0.6, 1.6, 60, 30), T8, 0.3); add(noise_hit(1.8, 4000, 2.5), T8, 0.05, rv=0.7)
add(sweep_noise(0.9, 400, 7000, 0.95, 0.6), T8 + 0.05, 0.08, rv=0.3)
arrow_in(C['lock8']); logo_lock(C['lock8'])
for j in range(13): add(tick(0.6), C['lock8'] + 0.25 + j * 0.03, 0.045, p=-0.4 + j * 0.06)
add(swish(0.9, 600, 2600), C['lock8'] + 0.93, 0.05)
add(pop(700, 220, 0.12), C['cta8'], 0.10); add(swish(0.6, 800, 4000), C['cta8'], 0.05)
TYPE = np.cumsum([0, .06, .04, .07, .05, .05, .09, .04, .05, .06, .04, .05, .08, .05, .04, .06, .05])
for x in TYPE: add(tick(0.9), C['url8'] + x, 0.10, p=rng.uniform(-.15, .15)); add(blip(3400, 0.02), C['url8'] + x, 0.03)
add(pop(820, 260, 0.11), C['wa8'], 0.10, p=0.2); add(pluck(mtof(81), 0.3, 16, 0.25), C['wa8'] + 0.02, 0.04, p=0.2, rv=0.4)
add(bell(mtof(89), 1.8), C['wa8'] + 0.1, 0.07, p=0.2, rv=0.7); add(bell(mtof(96), 1.8), C['wa8'] + 0.18, 0.05, p=0.25, rv=0.7)
add(bell(mtof(93), 1.0), C['qr8'], 0.03, p=0.6, rv=0.6)
add(click(), C['tap8'] - 0.02, 0.18); add(blip(1600, 0.05), C['tap8'], 0.14)

# ======================= reverb + master =======================
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
fade = np.ones(N); fs = int((DUR - 1.0) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.6
fi = int(0.02 * SR); fade[:fi] *= np.linspace(0, 1, fi)
music *= fade[:, None]; fx *= fade[:, None]
mix = np.tanh((music + fx) * 1.2) / np.tanh(1.2)
mix /= np.max(np.abs(mix)) * 1.12
OUT = ROOT / 'app' / 'public' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
wavfile.write(str(OUT / 'score.wav'), SR, (mix * 32767).astype(np.int16))
g = 0.89 / (np.max(np.abs(music + fx)) + 1e-9)
wavfile.write(str(OUT / 'score_music.wav'), SR, (np.clip(music * g, -1, 1) * 32767).astype(np.int16))
wavfile.write(str(OUT / 'sfx.wav'), SR, (np.clip(fx * g, -1, 1) * 32767).astype(np.int16))
print('ok: app/public/audio/score.wav (mix), score_music.wav + sfx.wav (stem);', f'{DUR:.1f} s, peak', round(float(np.max(np.abs(mix))), 3),
      'rms dB', round(float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))), 2))
