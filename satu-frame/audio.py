"""
Soundtrack Satu Frame 75 s (128 BPM, 40 bar), 100% disintesis dari kode (NumPy/SciPy, 48 kHz).
Semua waktu dibaca dari cues.json (sumber waktu yang sama dengan gambar di app/).

Tiga bus:
  - jam   : kick "jam" di setiap ketukan sejak detik 0 (di S6 terungkap: jam prosesor 3 GHz diperlambat
            1,40625 miliar kali = 128 BPM). Tidak pernah di-tape-stop.
  - musik : pad, bass, arpeggio. Kena tape-stop / tape-start di ramp jam fisik (sama dengan HUD).
  - sfx   : setiap gerak penting punya bunyi, di-pan mengikuti layar.
Hasil: app/public/audio/score.wav (mix), score_music.wav (jam + musik) + sfx.wav (stem, gain sama).
Loop: detik terakhir meluruh ke hening, detik 0 mulai dari hening (TikTok mengulang tanpa klik).
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
rng = np.random.default_rng(17)

def T(n): return np.arange(n) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def pan(sig, p=0.0):
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([sig * l, sig * r], 1)
def sos(kind, f, order=2): return signal.butter(order, f, btype=kind, fs=SR, output='sos')
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x)

class Bus:
    def __init__(self): self.dry = np.zeros((N, 2)); self.send = np.zeros((N, 2))
    def add(self, sig, t, g=1.0, p=0.0, rv=0.0):
        st = sig if sig.ndim == 2 else pan(sig, p)
        i = int(round(t * SR))
        if i < 0: st = st[-i:]; i = 0
        j = min(N, i + len(st))
        if j <= i: return
        self.dry[i:j] += st[:j - i] * g
        if rv: self.send[i:j] += st[:j - i] * g * rv
    def move(self, sig, t, g, p0, p1, rv=0.0):
        pp = np.linspace(p0, p1, len(sig)); l = np.cos((pp + 1) * np.pi / 4); r = np.sin((pp + 1) * np.pi / 4)
        self.add(np.stack([sig * l, sig * r], 1), t, g, rv=rv)

# ---------------- instruments (after beyond-studio/audio.py) ----------------
def kick(g=1.0, f0=118, f1=44, dec=6.5, click=0.25):
    n = int(0.55 * SR); t = T(n)
    f = f1 + f0 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)
    c = filt(rng.standard_normal(n), 'highpass', 2500) * np.exp(-t * 400) * click
    return np.tanh(1.6 * (s + c)) * g
def hat(dec=70, g=1.0):
    n = int(0.12 * SR); t = T(n)
    return filt(rng.standard_normal(n), 'highpass', 8000, 4) * np.exp(-t * dec) * g
def pluck(freq, dur=0.35, dec=10.0, bright=0.25):
    n = int(dur * SR); t = T(n)
    s = np.sin(2 * np.pi * freq * t) + bright * np.sin(4 * np.pi * freq * t) * np.exp(-t * 20)
    return s * np.exp(-t * dec) * np.minimum(1, t / 0.003)
def bell(freq, dur=2.2, g=1.0):
    n = int(dur * SR); t = T(n)
    parts = [(1, 1.0, 2.2), (2.0, .35, 4), (3.01, .18, 6), (4.17, .12, 9), (5.43, .06, 12)]
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in parts)
    return s * np.minimum(1, t / 0.002) * g
def blip(freq=2400, dur=0.05, g=1.0):
    n = int(dur * SR); t = T(n)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 90) * g
def tick(g=1.0, lo=2500, hi=7000, dec=500):
    n = int(0.02 * SR); t = T(n)
    return filt(rng.standard_normal(n), 'bandpass', [lo, hi]) * np.exp(-t * dec) * g
def sweep(dur, f0, f1, peak=0.8, width=0.5, g=1.0):
    n = int(dur * SR); x = rng.standard_normal(n + 2048)
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024)
    pr = np.clip(tt / dur, 0, 1)
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * pr)
    lf = np.log(np.maximum(f, 20))[:, None]
    mask = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * width ** 2))
    env = np.where(pr < peak, (pr / peak) ** 2.2, np.exp(-(pr - peak) / (1 - peak + 1e-6) * 4))
    _, y = signal.istft(Z * mask * env[None, :], fs=SR, nperseg=1024)
    y = y[:n]; return y / (np.max(np.abs(y)) + 1e-9) * g
def boom(g=1.0, dur=1.8, f0=72, f1=32, dec=2.4):
    n = int(dur * SR); t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    return np.tanh(1.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)) * g
def noise_hit(dur=1.2, lp=6000, dec=4.0, g=1.0):
    n = int(dur * SR); t = T(n)
    return filt(rng.standard_normal(n), 'lowpass', lp) * np.exp(-t * dec) * g
def click(g=1.0, body=190):
    n = int(0.12 * SR); y = np.zeros(n)
    for d, a in [(0, 1.0), (0.065, 0.55)]:
        i = int(d * SR); m = n - i; tm = T(m)
        y[i:] += (filt(rng.standard_normal(m), 'bandpass', [1800, 9000]) * np.exp(-tm * 900) + np.sin(2 * np.pi * body * tm) * np.exp(-tm * 160) * 0.35) * a
    return y / (np.max(np.abs(y)) + 1e-9) * g
def pop(f0=900, f1=260, dur=0.09, g=1.0):
    n = int(dur * SR); t = T(n); f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * g
def glass(freq=3100, dur=0.9, g=1.0):
    """a glassy tink: inharmonic partials, fast attack"""
    n = int(dur * SR); t = T(n)
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in [(1, 1, 7), (2.76, .5, 11), (5.4, .25, 16), (8.93, .12, 22)])
    return s * np.minimum(1, t / 0.001) * g
def droplet(f0=750, f1=2500, dur=0.3, g=1.0):
    """a water drop: the bubble's ring sliding up fast, a soft splash under it (own noise stream: the other
    sounds keep theirs)"""
    n = int(dur * SR); t = T(n)
    f = f0 + (f1 - f0) * (1 - np.exp(-t * 55))
    ring = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 24)
    splash = filt(np.random.default_rng(1403).standard_normal(n), 'bandpass', [1200, 6500]) * np.exp(-t * 70) * 0.35
    return (ring + splash) * np.minimum(1, t / 0.0015) * g
def zap(dur=0.35, g=1.0):
    """electric birth: a crackle burst over a falling tone"""
    n = int(dur * SR); t = T(n)
    cr = filt(rng.standard_normal(n) * (rng.random(n) < 0.08), 'bandpass', [1500, 9000]) * np.exp(-t * 14)
    tone = np.sin(2 * np.pi * np.cumsum(2200 * np.exp(-t * 9) + 300) / SR) * np.exp(-t * 10) * 0.5
    return (cr * 1.5 + tone) * g
def tone(freq0, freq1, dur, g=1.0, shape=1.0):
    n = int(dur * SR); t = T(n); u = t / dur
    f = freq0 * (freq1 / freq0) ** (u ** shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * g

# ---------------- the physical clock's ramps (cues.jam.segs): where time slams, the music tape-stops ----------------
segs = C['jam']['segs']
def ramp_after(i):   # the gap between segment i and i+1
    return segs[i][1], segs[i + 1][0], segs[i][2], segs[i + 1][2]
STOPS = []   # (t0, t1) slowing hard into a fixed segment; STARTS = (t0, t1) coming back
STARTS = []
for i in range(len(segs) - 1):
    a, b, s0, s1 = ramp_after(i)
    if s1 > s0 * 20: STOPS.append((a, b))
    if s0 > s1 * 20: STARTS.append((a, b))

def tape(x, t0, t1, mode):
    """time-warp a stereo bus: 'stop' plays [t0,t1] with the rate falling 1 → 0 (pitch drops to nothing) and
    silences until the matching start; 'start' plays [t0,t1] with the rate rising 0 → 1, landing in sync at t1."""
    i0, i1 = int(t0 * SR), int(t1 * SR)
    n = i1 - i0; u = np.arange(n) / n
    if mode == 'stop':
        r = (1 - u) ** 1.6
        tau = i0 + np.cumsum(r)
    else:
        r = u ** 1.6
        tau = i1 - np.cumsum(r[::-1])[::-1]
    for c in range(2):
        x[i0:i1, c] = np.interp(tau, np.arange(len(x)), x[:, c]) * (np.minimum(1, (1 - u) * 6) if mode == 'stop' else np.minimum(1, u * 6))
    return x

# ======================= harmony =======================
Dm9 = (38, [53, 57, 60, 64]); Bb = (34, [53, 57, 62, 65]); Fmaj = (41, [57, 60, 64, 67]); Csus = (36, [55, 60, 62, 67])
Gm9 = (43, [58, 62, 65, 69]); A7s = (45, [55, 59, 62, 64]); D9 = (38, [54, 57, 61, 64])   # D major lift for "home"
HARM = [(0, Dm9), (7.5, Bb), (11.25, Csus), (13.125, Gm9), (18.75, A7s), (20.625, Dm9),
        (24.375, Dm9), (26.25, Bb), (28.125, Fmaj), (30.0, Csus), (31.875, Dm9), (33.75, Bb), (35.625, Csus),
        (37.5, Dm9), (46.875, Fmaj), (48.75, Csus), (50.625, Bb), (52.5, Gm9), (54.375, Bb), (58.125, Csus),
        (61.875, D9), (63.75, D9), (67.5, Dm9)]
def chord_at(t):
    c = HARM[0][1]
    for s, ch in HARM:
        if t >= s: c = ch
    return c

jam = Bus(); mus = Bus(); fx = Bus()

# ---------------- the clock: one kick per beat, weight by chapter ----------------
def clock_gain(t):
    if t < CH['laut'][0]: return 0.32 if t >= 0.46 else 0.22
    if t < CH['server'][0]: return 0.62
    if t < CH['orbit'][0]: return 0.0      # S6 handled below (the dry clock)
    if t < CH['foton'][0]: return 0.45
    return 0.0
nb = int(DUR / BEAT)
for b in range(nb):
    t = b * BEAT
    g = clock_gain(t)
    if g > 0: jam.add(kick(1.0, 110, 42, 6.0, 0.18), t, g)
# S6: the processor's clock alone, dry: kick + metal click, 8 ticks
C0 = C['server']['clock0']
for k in range(C['server']['ticks']):
    t = C0 + k * BEAT
    jam.add(kick(1.0, 130, 40, 7.5, 0.35), t, 0.7)
    jam.add(tick(1.0, 4000, 12000, 900), t, 0.35)
    jam.add(click(0.9, 2400), t + 0.004, 0.08, p=0.2)
# the closing's low note under the lock
jam.add(pluck(mtof(26 + 12), 4.5, 1.0, 0.1), C['closing']['lock'], 0.3)

# ---------------- pad (always), filter opening with the chapters ----------------
def cut(t):
    return 700 if t < 7.5 else 1300 if t < 13.125 else 900 if t < 24.375 else 2400 if t < 37.5 else 1100 if t < 46.875 else 2000 if t < 61.875 else 2800 if t < 63.75 else 1500
for idx, (s, (bm, notes)) in enumerate(HARM):
    e = HARM[idx + 1][0] if idx + 1 < len(HARM) else DUR
    dur = e - s + 0.8; n = int(dur * SR); t = T(n)
    seg = np.zeros((n, 2))
    for m in notes:
        for dc, p in [(-8, -.65), (0, 0), (8, .65)]:
            f = mtof(m) * 2 ** (dc / 1200); ph = rng.uniform(0, 1)
            v = signal.sawtooth(2 * np.pi * (f * t + ph)) * 0.45 + np.sin(2 * np.pi * (f * t + ph)) * 0.55
            seg += pan(v, p) * 0.16
    atk = 2.5 if s == 0 else 0.12
    seg *= (np.minimum(1, t / atk) * np.clip((dur - t) / 0.8, 0, 1))[:, None]
    c = cut(s + 0.01)
    seg = np.stack([filt(seg[:, 0], 'lowpass', c), filt(seg[:, 1], 'lowpass', c)], 1)
    mus.add(seg, s, 0.28, rv=0.7)

# ---------------- bass 8ths + arp 16ths in the drive (S5) and the dive (S8) ----------------
def drive(t): return CH['laut'][0] + BAR <= t < CH['server'][0] - 0.1 or 56.25 <= t < 61.875
for i in range(int(DUR / (BEAT / 2))):
    t0 = i * BEAT / 2
    if not drive(t0): continue
    bm, notes = chord_at(t0 + 0.001)
    mus.add(pluck(mtof(bm + 12), 0.22, 9, 0.5), t0, 0.22 if i % 2 == 0 else 0.15)
for i in range(int(DUR / (BEAT / 4))):
    t0 = i * BEAT / 4
    if not drive(t0): continue
    bm, notes = chord_at(t0 + 0.001)
    seq = [notes[0] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 24, notes[3] + 12, notes[1] + 12, notes[2] + 12]
    mus.add(pluck(mtof(seq[i % 8]), 0.3, 15, 0.3), t0, 0.045 if i % 4 else 0.065, p=0.35 * np.sin(i * 0.7), rv=0.5)
    if i % 2: jam.add(hat(60), t0, 0.05, p=0.25)

# ======================= SFX =======================
L = C['layar']; CP = C['chip']; H = C['hujan']; PA = C['pantai']; LA = C['laut']; SV = C['server']
PU = C['pulang']; FO = C['foton']; CL = C['closing']
# S1: ignition, one glassy tick per row written (~6/s), the refresh hum rising, the plunge
fx.add(glass(3300, 1.4), L['ignite'], 0.10, rv=0.6)
for r in range(1, 45):
    t = r / 6.0
    if t < L['plunge'][0]: fx.add(tick(0.8, 3500, 11000, 1200), t, 0.035 + 0.02 * (r / 45), p=0.0)
n = int(7.5 * SR); tt = T(n)
hum = (np.sin(2 * np.pi * 120 * tt) + 0.5 * np.sin(2 * np.pi * 240 * tt) + 0.2 * np.sin(2 * np.pi * 360 * tt)) * (tt / 7.5) ** 2 * 0.5
fx.add(filt(hum, 'lowpass', 900), 0, 0.10)
fx.add(sweep(0.5, 3000, 300, 0.3, 0.5), L['plunge'][0], 0.14)
fx.add(glass(2400, 0.6), L['plunge'][1], 0.08, rv=0.4)
# S2: four layers on the beats, the board, the birth, the whip, the gap
for k, t in enumerate(CP['layers'][:4]):
    fx.add(boom(0.6, 0.35, 220 - k * 40, 90 - k * 12, 9), t, 0.18); fx.add(tick(0.7, 1500, 6000, 700), t, 0.05)
fx.add(filt(rng.standard_normal(int(3.8 * SR)), 'bandpass', [80, 400]) * 0.3, CP['layers'][4], 0.10)
fx.add(zap(0.45), CP['birth'], 0.30, rv=0.3); fx.add(tick(1.0, 3000, 10000, 600), CP['birth'], 0.2)
fx.move(sweep(0.6, 300, 7000, 0.6, 0.5), CP['whip'] - 0.25, 0.18, -0.7, 0.8, rv=0.2)
fx.add(click(0.9, 300), CP['gap'], 0.12)
# S3: frozen rain (a frozen grain of rain noise), the wavefront, the tower, the fall
n = int(7.8 * SR); tt = T(n)
grain = filt(rng.standard_normal(n), 'bandpass', [3000, 12000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * tt)) * np.minimum(1, tt / 0.4)
fx.add(np.stack([grain, np.roll(grain, 2311)], 1), H['window'], 0.035, rv=0.6)
# the frozen drop outside the window: a thin tone rising as the lens closes in on it, then through it (a drop's
# plink) on the beat the world slows
hold = H['drop'] - H['hold']
fx.add(tone(1760, 2350, hold, 1.0, 1.6) * np.sin(np.pi * np.clip(T(int(hold * SR)) / hold, 0, 1)) ** 2, H['hold'], 0.012, rv=0.6)
fx.add(droplet(), H['drop'], 0.11, rv=0.55)
fx.add(sweep(0.45, 5000, 200, 0.2, 0.6), H['ramp'][0], 0.08)     # the world slows
fx.move(tone(180, 2400, 0.5, 1.0, 1.5) * np.hanning(int(0.5 * SR)), H['wave'] - 0.05, 0.10, 0.0, 0.0, rv=0.5)
fx.move(sweep(0.8, 300, 9000, 0.6, 0.45), H['passCam'] - 0.6, 0.22, -0.9, 0.9, rv=0.4)   # it passes through us
for k in range(18): fx.add(glass(2800 + 900 * rng.random(), 0.5), H['passCam'] + k * 0.021 * (1 + rng.random()), 0.02, p=rng.uniform(-.8, .8), rv=0.5)
fx.add(boom(1.0, 1.5, 80, 36), H['tower'], 0.5); fx.add(noise_hit(1.6, 4500, 3.0), H['tower'], 0.12, rv=0.7); fx.add(bell(mtof(81), 2.0), H['tower'], 0.05, rv=0.8)
fx.add(sweep(0.5, 200, 5000, 0.9, 0.5), H['descend'][0] - 0.4, 0.07)    # the world starts again
fx.add(sweep(1.5, 4000, 150, 0.2, 0.5), H['descend'][0], 0.12)          # the signal down the tower
# S4: wind, the line, an in-breath, the dive
fx.add(filt(rng.standard_normal(int(3.8 * SR)), 'bandpass', [200, 1200]) * np.hanning(int(3.8 * SR)), CH['pantai'][0], 0.06, rv=0.5)
fx.add(sweep(0.5, 600, 2500, 0.9, 0.4), PA['lip'] - 0.4, 0.06)
fx.add(boom(1.0, 2.2, 60, 28, 1.6), PA['plunge'], 0.55); fx.add(filt(noise_hit(1.5, 800, 2.5), 'lowpass', 600), PA['plunge'], 0.3)
# S5: under water: a pressure bed, the packet's rush, the amplifiers (ping rising each time), peel, fibre tone
n = int(13.2 * SR); tt = T(n)
bed = filt(rng.standard_normal(n), 'lowpass', 180) * 0.8 + np.sin(2 * np.pi * 41 * tt) * 0.25
fx.add(bed * np.minimum(1, tt / 0.8) * np.clip((13.2 - tt) / 0.5, 0, 1), CH['laut'][0], 0.18)
rush = sweep(12.5, 900, 1400, 0.5, 0.35)
fx.add(rush, CH['laut'][0] + 0.5, 0.05, rv=0.3)
for k in range(13):
    t = CH['laut'][0] + (k + 1) * LA['repEvery']
    if t >= CH['server'][0]: break
    fx.add(glass(1400 * 2 ** (k / 24), 1.2), t, 0.08, p=0.0, rv=0.6); fx.add(tick(1.0, 2000, 9000, 700), t, 0.07)
for k in range(4): fx.add(sweep(0.4, 5000, 900, 0.3, 0.3), LA['peel'][0] + k * 0.33, 0.06, p=(k - 1.5) * 0.3)
n = int((LA['fiber'][1] - LA['fiber'][0]) * SR); tt = T(n)
ft = sum(np.sin(2 * np.pi * f * tt) * a for f, a in [(1976, 0.5), (2637, 0.35), (3951, 0.2)]) * np.minimum(1, tt / 0.4) * np.clip((n / SR - tt) / 0.5, 0, 1)
fx.add(pan(ft, -0.3) + pan(np.roll(ft, 900), 0.3), LA['fiber'][0], 0.03, rv=0.8)
fx.move(sweep(1.4, 2000, 300, 0.3, 0.5), LA['exit'][0], 0.10, 0.3, -0.3)
fx.add(sweep(1.9, 200, 6000, 0.95, 0.5), LA['rise'][0], 0.10, rv=0.3)
# S6: the aisle (fans), into the die, the slam (tape-stop sweep), the tree's flash chords, back, the climb
n = int(1.5 * SR)
fx.add(filt(rng.standard_normal(n), 'bandpass', [300, 3000]) * np.hanning(n), CH['server'][0], 0.07)
fx.move(sweep(0.6, 300, 4000, 0.7, 0.5), SV['aisle'], 0.1, -0.3, 0.3)
fx.add(sweep(0.5, 6000, 80, 0.15, 0.7), SV['die'], 0.12)
for k in range(SV['ticks']):
    t = C0 + k * BEAT
    _, notes = Dm9 if k < 4 else Bb
    for m in notes: fx.add(pluck(mtof(m + 12), 0.9, 4, 0.4), t + 0.018, 0.018, p=rng.uniform(-.4, .4), rv=0.8)
fx.add(sweep(0.9, 12000, 500, 0.9, 0.5)[::-1], 43.125 - 0.3, 0.1, rv=0.4)      # reverse swell
fx.add(sweep(SV['pullout'][1] - SV['pullout'][0], 150, 9000, 0.97, 0.55), SV['pullout'][0], 0.14, rv=0.4)
fx.add(noise_hit(2.5, 9000, 1.3), SV['pullout'][1], 0.06, rv=0.9)
# S7: the packet's head: a thin high tone, and the chord change on "Tiap klik"
n = int((C['orbit']['dive'] - C['orbit']['depart']) * SR); tt = T(n)
fx.move(np.sin(2 * np.pi * np.cumsum(2900 + 300 * tt / tt[-1]) / SR) * np.minimum(1, tt / 0.5) * np.clip((n / SR - tt) / 0.5, 0, 1), C['orbit']['depart'], 0.012, -0.4, 0.3, rv=0.6)
fx.add(bell(mtof(77), 2.4), 50.625, 0.05, rv=0.9)
# S8: the dive, the cloud, the rain again, the radio flash, the window, the glass, the line coming, the landing
fx.add(sweep(3.7, 150, 3000, 0.95, 0.6), C['orbit']['dive'], 0.12, rv=0.4)
fx.add(sweep(0.6, 2500, 400, 0.4, 0.6), PU['cloud'], 0.1, rv=0.5)
fx.add(np.stack([grain[: int(2.2 * SR)], np.roll(grain, 1777)[: int(2.2 * SR)]], 1), PU['rain'][0], 0.03, rv=0.6)
for k in range(24): fx.add(glass(2600 + 1400 * rng.random(), 0.4), PU['radio'] + k * 0.004, 0.03, p=rng.uniform(-.9, .9), rv=0.6)
fx.add(glass(1900, 0.8), PU['window'], 0.07, rv=0.4)
fx.add(glass(3200, 0.8), PU['glass'], 0.06, rv=0.4)
n = int((PU['land'] - 61.0) * SR); tt = T(n)
zipper = filt(rng.standard_normal(n), 'bandpass', [2000, 9000]) * (np.sin(2 * np.pi * np.cumsum(20 + 55 * tt / tt[-1]) / SR) > 0.6) * (tt / tt[-1]) ** 1.5
fx.add(zipper, 61.0, 0.06)
fx.add(boom(1.0, 2.5, 70, 30, 1.5), PU['land'], 0.6); fx.add(noise_hit(2.5, 6000, 1.8), PU['land'], 0.1, rv=0.9)
for k, m in enumerate([74, 78, 81, 85]): fx.add(bell(mtof(m), 3.0), PU['land'] + k * 0.015, 0.06, p=(k - 1.5) * 0.35, rv=0.9)
# S9: back out, the world stops, one pure tone rising as the photon comes, a beat of silence, the white
fx.move(sweep(0.6, 3000, 400, 0.3, 0.5), FO['back'][0], 0.08, 0.2, -0.2)
fx.add(sweep(0.7, 5000, 60, 0.15, 0.7), 63.9, 0.10)
ph_d = CL['ring'][0] - 0.4 - FO['emit']
n = int(ph_d * SR); tt = T(n)
photon = np.sin(2 * np.pi * np.cumsum(660 * (4.0 ** (tt / tt[-1]) ** 2.2)) / SR) * (tt / tt[-1]) ** 1.2 * np.clip((ph_d - 0.47 - tt) / 0.05, 0, 1)
fx.add(photon, FO['emit'], 0.07, rv=0.5)
fx.add(noise_hit(1.6, 14000, 2.2), FO['hit'], 0.18, rv=0.8); fx.add(boom(1.0, 2.2, 55, 26, 1.6), FO['hit'], 0.55)
# S10: the brand: arrow in, lock (impact + bell stack), wordmark, the line, the pill, the tap
fx.move(sweep(CL['lock'] - CL['fly'], 180, 2600, 0.88, 0.45), CL['fly'], 0.16, -0.8, 0.1)
fx.add(boom(1.0, 1.8, 72, 32), CL['lock'], 0.55); fx.add(noise_hit(1.6, 5000, 3.2), CL['lock'], 0.10, rv=0.6); fx.add(blip(3200, 0.06), CL['lock'], 0.25)
for k, m in enumerate([74, 77, 81, 84]):   # D minor 9 bell stack: the logo sound (the film's key)
    fx.add(bell(mtof(m), 2.6), CL['lock'] + k * 0.012, 0.075, p=(k - 1.5) * 0.35, rv=0.8)
fx.add(sweep(0.8, 600, 2600, 0.5, 0.45), CL['wm'], 0.05)
fx.add(tick(0.8), C['teks'][-1]['in'], 0.05)
fx.add(pop(820, 260, 0.11), CL['follow'], 0.10); fx.add(pluck(mtof(81), 0.3, 16, 0.25), CL['follow'] + 0.02, 0.04, rv=0.4)
fx.add(click(), CL['tap'] - 0.02, 0.18); fx.add(blip(1600, 0.05), CL['tap'], 0.14); fx.add(bell(mtof(86), 1.4), CL['tap'] + 0.1, 0.04, rv=0.7)

# ======================= tape-stops on the music bus, reverb, master =======================
def silence(x, t0, t1, fade=0.05):
    i0, i1 = int(t0 * SR), int(t1 * SR); f = int(fade * SR)
    x[i0:i1] = 0
    if f and i1 + f < len(x): x[i1:i1 + f] *= np.linspace(0, 1, f)[:, None]
for (a, b), (c, d) in zip(STOPS, STARTS):
    for bus in (mus.dry, mus.send):
        tape(bus, a, b, 'stop')
        silence(bus, b, c)
        tape(bus, c, d, 'start')
print('tape-stops:', [(round(a, 3), round(b, 3)) for a, b in STOPS], 'starts:', [(round(a, 3), round(b, 3)) for a, b in STARTS])

ir_n = int(2.8 * SR); it = T(ir_n)
ir = np.stack([rng.standard_normal(ir_n), rng.standard_normal(ir_n)], 1) * np.exp(-it * 2.4)[:, None]
ir = np.stack([filt(ir[:, 0], 'lowpass', 6000), filt(ir[:, 1], 'lowpass', 6000)], 1)
ir[: int(0.015 * SR)] = 0
def bus_out(b):
    wet = np.stack([signal.fftconvolve(b.send[:, c], ir[:, c])[:N] for c in range(2)], 1)
    wet /= (np.max(np.abs(wet)) + 1e-9); wet *= np.max(np.abs(b.send)) * 0.9
    out = b.dry + wet * 0.6
    return np.stack([filt(out[:, c], 'highpass', 28) for c in range(2)], 1)
music = bus_out(jam) + bus_out(mus); sfx = bus_out(fx)
# the loop: the last 0.6 s decay to silence; frame 0 starts from silence
fade = np.ones(N); fs = int((DUR - 0.6) * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 1.4
fi = int(0.01 * SR); fade[:fi] *= np.linspace(0, 1, fi)
music *= fade[:, None]; sfx *= fade[:, None]
mix = np.tanh((music + sfx) * 1.15) / np.tanh(1.15)
mix /= np.max(np.abs(mix)) * 1.12
OUT = ROOT / 'app' / 'public' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
wavfile.write(str(OUT / 'score.wav'), SR, (mix * 32767).astype(np.int16))
g = 0.89 / (np.max(np.abs(music + sfx)) + 1e-9)
wavfile.write(str(OUT / 'score_music.wav'), SR, (np.clip(music * g, -1, 1) * 32767).astype(np.int16))
wavfile.write(str(OUT / 'sfx.wav'), SR, (np.clip(sfx * g, -1, 1) * 32767).astype(np.int16))
print('ok: app/public/audio/score.wav (mix), score_music.wav + sfx.wav (stem);', f'{DUR:.1f} s, peak', round(float(np.max(np.abs(mix))), 3),
      'rms dB', round(float(20 * np.log10(np.sqrt(np.mean(mix ** 2)))), 2))
