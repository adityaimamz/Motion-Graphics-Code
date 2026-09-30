"""
Soundtrack Harusnya Diam 60 s (128 BPM, 32 bar), 100% disintesis dari kode (NumPy/SciPy, 48 kHz).
Semua waktu dibaca dari cues.json (sumber waktu yang sama dengan gambar di app/).

Dua ruang (TREATMENT §6):
  - dunia kertas: foley dekat, kering, hampir mono (robek, lipat, ketukan papan, tik pensil, klak kartu);
    groove 2-step 128 BPM yang kit-nya dibangun dari foley itu (kick = hentakan papan, snare = tamparan kertas,
    hat = tik pensil), kunci D♭ mayor. Tape-stop saat waktu dibekukan, tape-start saat dilepas.
  - pesawat + closing: lebar, bersih, ber-reverb.
Sunyi sebagai tanda baca: 0–0,94 (hampir), 4,69–5,63 (beku), 45,0–46,9 (hampir), 51,56–52,5 (total).

Hasil:
  app/public/audio/score.wav        (mix)
  app/public/audio/score_music.wav  (stem musik)   app/public/audio/sfx.wav (stem SFX, gain sama)
  app/public/data/bars.json         (energi 8 pita per frame 60 fps dari stem musik: tinggi batang pop-up S5)
Pemakaian: python audio.py   (jalankan ulang setiap kali cues.json diubah)
"""
import json, pathlib
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parent
C = json.loads((ROOT / 'cues.json').read_text(encoding='utf-8'))
SR = 48000; DUR = float(C['dur']); N = int(SR * DUR)
BPM = C['bpm']; BEAT = 60 / BPM; BAR = 4 * BEAT; S16 = BEAT / 4
CU = C['cue']; CH = C['ch']
HK, RK, FK, UK, PK, GK, MK, KK, CK = (CU[k] for k in ['hook', 'riak', 'flip', 'ui', 'pop', 'gerak', 'mundur', 'kosong', 'closing'])
rng = np.random.default_rng(29)

def T(n): return np.arange(n) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def pan(sig, p=0.0):
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    return np.stack([sig * l, sig * r], 1)
def sos(kind, f, order=2): return signal.butter(order, f, btype=kind, fs=SR, output='sos')
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order), x, axis=0)
def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.05, sus_len=None):
    t = T(n); e = np.zeros(n)
    ai = max(1, int(a * SR)); e[:ai] = np.linspace(0, 1, ai)
    rest = t[ai:] - a
    e[ai:] = s + (1 - s) * np.exp(-rest / max(d, 1e-4))
    if sus_len is not None:
        k = int(sus_len * SR)
        if k < n: e[k:] *= np.exp(-(t[k:] - t[k]) / max(r, 1e-4))
    return e

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

def reverb(x, secs=2.2, damp=5000, seed=3):
    r = np.random.default_rng(seed)
    n = int(secs * SR); t = T(n)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], 1) * np.exp(-t * 6.9 / secs)[:, None]
    ir = filt(ir, 'lowpass', damp)
    ir[:int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2) / 2) + 1e-9
    out = np.stack([signal.fftconvolve(x[:, 0], ir[:, 0])[:len(x)], signal.fftconvolve(x[:, 1], ir[:, 1])[:len(x)]], 1)
    return out * 0.35

# ================================================================ paper foley (dry, close)
def crackle(n, rate, lo=1500, hi=7000, seed=0):
    """sparse micro-impulses (paper fibres giving way)"""
    r = np.random.default_rng(seed)
    x = (r.random(n) < rate / SR).astype(float) * r.uniform(0.3, 1.0, n) * np.sign(r.standard_normal(n))
    return filt(x, 'bandpass', [lo, hi]) * 6
def tear(dur=0.35, g=1.0, seed=1, body=1.0):
    n = int(dur * SR); t = T(n); u = t / dur
    ev = np.sin(np.pi * np.clip(u, 0, 1)) ** 0.6
    x = crackle(n, 2200, 900, 8000, seed) + filt(np.random.default_rng(seed + 9).standard_normal(n), 'bandpass', [600, 3500]) * 0.35 * body
    return x * ev * g
def crease(g=1.0, seed=2):
    n = int(0.16 * SR); t = T(n)
    snap = filt(np.random.default_rng(seed).standard_normal(n), 'highpass', 2200) * np.exp(-t * 180)
    tail = crackle(n, 900, 1500, 9000, seed + 1) * np.exp(-t * 28) * 0.5
    thump = np.sin(2 * np.pi * 160 * t) * np.exp(-t * 60) * 0.25
    return (snap + tail + thump) * g
def board(g=1.0, f0=120, f1=48):
    """kick: a palm on the drafting board — a low thump and the paper's slap"""
    n = int(0.42 * SR); t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 26)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    box = filt(rng.standard_normal(n), 'bandpass', [180, 420]) * np.exp(-t * 45) * 0.5
    slap = filt(rng.standard_normal(n), 'bandpass', [1200, 5000]) * np.exp(-t * 160) * 0.35
    return np.tanh(1.5 * (s + box + slap)) * g
def slap(g=1.0, seed=4):
    """snare: a sheet slapped flat on the board"""
    n = int(0.25 * SR); t = T(n)
    r = np.random.default_rng(seed)
    body = filt(r.standard_normal(n), 'bandpass', [700, 4200]) * np.exp(-t * 26)
    crk = crackle(n, 1600, 2000, 9000, seed) * np.exp(-t * 20) * 0.6
    low = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 40) * 0.35
    return (body + crk + low) * g
def tick(g=1.0, f=2600, seed=5):
    """hat: a pencil tip on a hard edge"""
    n = int(0.06 * SR); t = T(n)
    c = filt(np.random.default_rng(seed).standard_normal(n), 'highpass', 5000) * np.exp(-t * 700)
    wood = np.sin(2 * np.pi * f * t) * np.exp(-t * 140) * 0.35
    return (c + wood) * g
def roll_noise(dur, speed_fn, seed=6, lo=180, hi=1600):
    """a disc rolling on paper: grainy rumble whose level and bumps follow the speed"""
    n = int(dur * SR); t = T(n)
    sp = speed_fn(t)
    x = filt(np.random.default_rng(seed).standard_normal(n), 'bandpass', [lo, hi])
    bumps = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(sp * 3.0) / SR)
    return x * sp * bumps
def euler(dur=0.94, g=1.0):
    """Euler's disk: a rattle whose rate climbs until it stops dead"""
    n = int(dur * SR); t = T(n); u = t / dur
    rate = 9 + 70 * u ** 2.2
    ph = np.cumsum(rate) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    ring = np.zeros(n)
    k = np.flatnonzero(pulses)
    tone = np.sin(2 * np.pi * (700 + 1400 * u) * t)
    for i in k:
        m = min(n - i, int(0.02 * SR)); tt = T(m)
        ring[i:i + m] += np.exp(-tt * 260) * (0.5 + 0.5 * u[i])
    hum = tone * (0.15 + 0.5 * u ** 2) * 0.25
    return (filt(ring, 'bandpass', [900, 6000]) * 3 + hum) * g * np.minimum(1, (1 - u) * 400)
def wood(freq, g=1.0, dec=18):
    """a tuned card clack: wood-block partials"""
    n = int(0.5 * SR); t = T(n)
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * dec * d) for r, a, d in [(1, 1, 1), (2.76, .45, 1.8), (5.4, .2, 3), (8.93, .08, 4)])
    click = filt(rng.standard_normal(n), 'highpass', 3000) * np.exp(-t * 500) * 0.5
    return (s + click) * np.minimum(1, t / 0.0008) * g
def flutter(dur, rate=12, g=1.0, seed=8):
    """flipbook: one page flick per frame (12 Hz), each a small crisp burst"""
    n = int(dur * SR); out = np.zeros(n)
    r = np.random.default_rng(seed)
    for k in range(int(dur * rate)):
        i = int(k / rate * SR); m = min(n - i, int(0.05 * SR)); tt = T(m)
        out[i:i + m] += filt(r.standard_normal(m), 'bandpass', [1500, 7000]) * np.exp(-tt * 90) * r.uniform(0.7, 1.0)
    return out * g
def whoosh(dur, f0, f1, g=1.0, seed=10, peak=0.6):
    n = int(dur * SR); x = np.random.default_rng(seed).standard_normal(n + 2048)
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024)
    pr = np.clip(tt / dur, 0, 1)
    fc = np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * pr)
    lf = np.log(np.maximum(f, 20))[:, None]
    mask = np.exp(-((lf - np.log(fc)[None, :]) ** 2) / (2 * 0.45 ** 2))
    envl = np.where(pr < peak, (pr / peak) ** 2, np.exp(-(pr - peak) / (1 - peak + 1e-6) * 3.5))
    _, y = signal.istft(Z * mask * envl[None, :], fs=SR, nperseg=1024)
    y = y[:n]; return y / (np.max(np.abs(y)) + 1e-9) * g
def bloop(f0=600, f1=920, dur=0.14, g=1.0):
    n = int(dur * SR); t = T(n); f = f0 + (f1 - f0) * (1 - np.exp(-t * 45))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * np.minimum(1, t / 0.002) * g
def blip(freq, dur=0.09, g=1.0):
    n = int(dur * SR); t = T(n)
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 40) * np.minimum(1, t / 0.001) * g
def bitcrush(g=1.0):
    n = int(0.16 * SR); t = T(n)
    s = np.sign(np.sin(2 * np.pi * 220 * t)) * np.exp(-t * 30)
    s = np.round(s * 4) / 4
    return filt(s, 'lowpass', 6000) * g
def boom(g=1.0, dur=1.6, f0=70, f1=31, dec=2.6):
    n = int(dur * SR); t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 5)
    return np.tanh(1.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec)) * g
def bell(freq, dur=2.6, g=1.0):
    n = int(dur * SR); t = T(n)
    parts = [(1, 1.0, 2.0), (2.0, .35, 3.5), (3.01, .18, 5.5), (4.17, .12, 8), (5.43, .06, 11)]
    s = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in parts)
    return s * np.minimum(1, t / 0.002) * g
def glide(f0, f1, dur, g=1.0):
    n = int(dur * SR); t = T(n); u = t / dur
    f = f0 * (f1 / f0) ** (u ** 1.4)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return s * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.5 * g

# ================================================================ music (groove built from the foley)
music = Bus(); sfx = Bus()
# D♭ major; I–vi–IV–V (D♭maj9 · B♭m9 · G♭maj7 · A♭add9), one bar each
ROOTS = [49, 46, 42, 44]  # D♭3, B♭2, G♭2, A♭2
CHORDS = [[61, 65, 68, 72, 75], [58, 61, 65, 68, 72], [54, 58, 61, 65, 68], [56, 60, 63, 68, 70]]
PENTA = [61, 63, 65, 68, 70]  # D♭ E♭ F A♭ B♭ (the cards, and the logo's bell)

def swing(step):  # 16th-note swing ~58%
    return step * S16 + (0.16 * S16 if step % 2 else 0)

def stab(notes, dur=0.16, g=1.0, bright=1800):
    n = int(dur * SR); t = T(n)
    s = sum(np.sign(np.sin(2 * np.pi * mtof(m) * t)) * 0.5 + (2 * ((mtof(m) * 1.003 * t) % 1) - 1) * 0.5 for m in notes) / len(notes)
    s = filt(s, 'lowpass', bright)
    return s * env_adsr(n, 0.003, 0.07, 0.0) * g
def pad(notes, dur, g=1.0, cut=900):
    n = int(dur * SR); t = T(n)
    s = sum(sum((2 * ((mtof(m) * d * t) % 1) - 1) for d in (0.996, 1.004)) for m in notes) / (2 * len(notes))
    s = filt(s, 'lowpass', cut)
    e = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.4)
    return s * np.clip(e, 0, 1) * g
def sub(m, dur, g=1.0):
    n = int(dur * SR); t = T(n); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    return s * env_adsr(n, 0.004, dur * 0.7, 0.0) * np.minimum(1, (dur - t) / 0.02).clip(0, 1) * g
def pluck(freq, dur=0.6, g=1.0, seed=0):
    n = int(dur * SR); p = max(2, int(SR / freq))
    buf = np.random.default_rng(seed).uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    return filt(out, 'lowpass', 5000) * g

def groove_bar(t0, bar_i, layers):
    """one bar of the 2-step at t0; `layers` = set of 'k','s','h','b','c','p','bb' (busy bass)"""
    ci = bar_i % 4
    if 'k' in layers:
        for st in (0, 10):
            music.add(board(0.95), t0 + swing(st), 1.0, 0.0)
    if 's' in layers:
        for st in (4, 12):
            music.add(slap(0.55, seed=bar_i * 3 + st), t0 + swing(st), 1.0, 0.05)
    if 'h' in layers:
        for st in range(2, 16, 2):
            music.add(tick(0.2 if st % 4 == 2 else 0.12, seed=bar_i * 16 + st), t0 + swing(st), 1.0, 0.3)
    if 'b' in layers:
        pat = [(0, 3, 0), (7, 2, 0), (10, 3, 0)] if 'bb' not in layers else [(0, 2, 0), (3, 1, 12), (6, 2, 0), (10, 2, 0), (13, 2, 7)]
        for st, ln, off in pat:
            music.add(sub(ROOTS[ci] - 12 + off, ln * S16 * 1.6, 0.55), t0 + swing(st), 1.0, 0.0)
    if 'c' in layers:
        for st in (3, 6, 11):
            music.add(stab(CHORDS[ci], 0.15, 0.22), t0 + swing(st), 1.0, -0.15 if st == 6 else 0.15)
    if 'p' in layers:
        mel = [PENTA[(bar_i + j * 2) % 5] + 12 for j in range(4)]
        for j, st in enumerate((0, 5, 8, 14)):
            music.add(pluck(mtof(mel[j]), 0.5, 0.2, seed=bar_i * 4 + j), t0 + swing(st), 1.0, 0.4 if j % 2 else -0.4)

def bar_of(t): return int(round(t / BAR))
# arrangement: bars start at 0, 1.875 … (32 bars). Which layers play in each bar:
ARR = {}
def lay(t0, t1, layers):
    for b in range(bar_of(t0), bar_of(t1)):
        ARR[b] = layers
lay(RK['jatuh'], RK['beku'] + BAR, {'k', 'b', 'c'})                 # S2: the hit, one bar (tape-stopped at beku)
lay(RK['lepasWaktu'], FK['masuk'], {'k', 's', 'h', 'b', 'c'})        # back after the freeze
lay(FK['masuk'], UK['toggle'], {'k', 's', 'h', 'b', 'c', 'p'})       # S3 adds the pluck
lay(UK['toggle'], PK['buka'], {'k', 's', 'h', 'b', 'c'})             # S4
lay(PK['buka'], GK['g'], {'k', 's', 'h', 'b', 'bb', 'c'})            # S5: busy bass (the bars dance to it)
lay(GK['g'], MK['drop'], {'s', 'h', 'b'})                           # S6: space for the clacks
lay(MK['drop'], MK['turun'], {'k', 's', 'h', 'b', 'bb', 'c', 'p'})   # S7: the drop
lay(MK['turun'], KK['pensil'], {'k', 'h', 'b'})                     # filtered down
for b, layers in ARR.items():
    groove_bar(b * BAR, b, layers)
# the big chord on the music's entrance and at the drop
music.add(pad(CHORDS[0], BAR * 1.0, 0.55, 1400), RK['jatuh'], 1.0, 0.0)
music.add(boom(0.7, 1.4), RK['jatuh'], 1.0)
music.add(pad(CHORDS[0], BAR * 1.5, 0.7, 2200), MK['drop'], 1.0)
music.add(pad(CHORDS[3], BAR * 0.5, 0.5, 1800), MK['drop'] + BAR * 1.5, 1.0)
music.add(boom(0.9, 1.8), MK['drop'], 1.0)
music.add(tear(0.6, 0.5, seed=77), MK['drop'], 1.0, 0.0)
# the launch in S5 (bass bar throws the disc): a sub hit
music.add(sub(ROOTS[0] - 12, 0.6, 0.9), PK['lontar'], 1.0)
music.add(boom(0.5, 0.9, 90, 40), PK['lontar'], 1.0)

# ---- low-pass the S7 tail (43.125 → 45)
def region_filter(bus_arr, t0, t1, f_from, f_to):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    seg = bus_arr[i0:i1].copy(); n = len(seg)
    blocks = 24; out = np.zeros_like(seg)
    for bi in range(blocks):
        a, b = bi * n // blocks, (bi + 1) * n // blocks
        f = f_from * (f_to / f_from) ** (bi / (blocks - 1))
        out[a:b] = filt(seg[max(0, a - 2048):b], 'lowpass', f)[-(b - a):]
    bus_arr[i0:i1] = out
region_filter(music.dry, MK['turun'], KK['pensil'], 8000, 450)

# ---- tape: stop at beku (speed 1 → 0 in 0.42 s), start at lepasWaktu (0 → 1 by normal)
def tape(bus_arr):
    sp = np.ones(N)
    b0 = int(RK['beku'] * SR); b1 = b0 + int(0.42 * SR)
    sp[b0:b1] = np.linspace(1, 0, b1 - b0) ** 1.3
    r0 = int(RK['lepasWaktu'] * SR); r1 = int(RK['normal'] * SR)
    sp[b1:r0] = 0
    sp[r0:r1] = np.linspace(0, 1, r1 - r0) ** 2
    # tape position: follows t outside; inside, integrates the speed, then rejoins t at `normal`
    pos = np.arange(N, dtype=float)
    pos[b0:b1] = b0 + np.cumsum(sp[b0:b1])
    pos[b1:r0] = pos[b1 - 1]
    ramp = np.cumsum(sp[r0:r1][::-1])[::-1]  # samples left to travel until r1
    pos[r0:r1] = r1 - ramp
    out = np.stack([np.interp(pos, np.arange(N), bus_arr[:, c]) for c in (0, 1)], 1)
    gate = np.ones(N); gate[b1:r0] = 0
    return out * gate[:, None]
music.dry = tape(music.dry)

# ================================================================ SFX (the paper world, dry)
x_of = lambda wx: float(np.clip(wx / 560, -0.8, 0.8))
# S1: room tone near-silence, the paper creaks as the stop strains, the tear, the roll, Euler
room = filt(rng.standard_normal(N), 'lowpass', 900) * 0.012
sfx.add(room, 0, 1.0)
sfx.add(crackle(int(0.9 * SR), 60, 800, 5000, 11) * np.linspace(0.1, 1, int(0.9 * SR)) * 0.12, 0.02, 1.0, 0.25)
sfx.add(tear(0.14, 1.1, seed=12, body=0.6), HK['lepas'] - 0.02, 1.0, 0.25)          # HIT: the stop tears loose
sfx.move(roll_noise(HK['spin'] - HK['lepas'], lambda t: np.clip(t / 0.6, 0, 1) * 0.18, 13), HK['lepas'] + 0.08, 1.0, 0.3, -0.25)
sfx.add(euler(HK['rebah'] - HK['spin'], 0.5), HK['spin'], 1.0, -0.1)
# S2: the landing and the rebound, the freeze, the dive, the thaw, the surf, the jump
sfx.add(crease(0.9, 14), RK['jatuh'], 1.0, 0.0)
sfx.add(bloop(500, 780, 0.12, 0.3), RK['lontar'], 1.0, 0.1)
frozen = sum(np.sin(2 * np.pi * f * T(int((RK['lepasWaktu'] - RK['beku']) * SR))) for f in (1661, 2217, 2489)) / 3
fz_n = len(frozen); fz_e = np.minimum(1, T(fz_n) / 0.3) * np.minimum(1, (fz_n / SR - T(fz_n)) / 0.3)
sfx.add(frozen * fz_e * (0.5 + 0.5 * np.sin(2 * np.pi * 0.7 * T(fz_n))) * 0.02, RK['beku'], 1.0, 0.0, rv=0.3)
sfx.move(whoosh(RK['lv1'] - RK['orbitEnd'] + 0.2, 300, 2400, 0.5, 15), RK['orbitEnd'], 1.0, -0.5, 0.5)
for i, (tk, f) in enumerate([(RK['lv1'], 1661), (RK['lv2'], 2217), (RK['lv3'], 2960)]):
    sfx.add(blip(f, 0.12, 0.5), tk, 1.0, (-0.3, 0.0, 0.3)[i], rv=0.2)
    sfx.move(whoosh(0.4, 600 * (i + 1), 3000 * (i + 1) ** 0.5, 0.3, 150 + i, peak=0.8), tk - 0.3, 1.0, 0.3, -0.3)
sfx.add(bitcrush(0.55), RK['bayer'], 1.0, 0.0)
sfx.move(whoosh(RK['tarikEnd'] - RK['tarik'], 3000, 180, 0.6, 16, peak=0.3), RK['tarik'], 1.0, 0.4, -0.3)
sfx.move(roll_noise(RK['jatuhTepi'] - RK['normal'], lambda t: 0.1 + 0.08 * np.sin(t * 3) ** 2, 17), RK['normal'], 1.0, 0.0, 0.4)
sfx.move(whoosh(FK['masuk'] - RK['jatuhTepi'], 500, 1600, 0.2, 18), RK['jatuhTepi'], 1.0, -0.4, 0.4)
# S3: into the page, the flutter, four bounces, the pop out (HIT)
sfx.add(crease(0.6, 19), FK['masuk'], 1.0, 0.3)
sfx.add(flutter(FK['keluar'] - FK['masuk'] - 0.08, 12, 0.22, 20), FK['masuk'] + 0.08, 1.0, 0.35)
for i, k in enumerate(['pantul1', 'pantul2', 'pantul3', 'pantul4']):
    sfx.add(wood(mtof(PENTA[0] - 12 - i * 2), 0.35, 22), FK[k], 1.0, 0.2 - i * 0.12)
sfx.add(bloop(380, 1100, 0.18, 0.6), FK['keluar'], 1.0, -0.2)
sfx.add(crease(0.5, 21), FK['keluar'], 1.0, -0.2)
sfx.move(whoosh(UK['toggle'] - FK['keluar'], 400, 1800, 0.22, 22), FK['keluar'], 1.0, 0.2, -0.6)
# S4: toggle, slider + counter, thock (HIT), toast, perforation (HIT), knock, the roll down the ruler
sfx.add(tick(0.6, 1800, 23) + np.pad(tick(0.35, 2400, 24), (int(0.03 * SR), 0))[:int(0.06 * SR)], UK['toggle'], 1.0, -0.6)
sfx.add(bloop(900, 600, 0.1, 0.15), UK['toggle'] + 0.05, 1.0, -0.6)
sl = UK['sliderEnd'] - UK['slider']
sfx.move(whoosh(sl, 700, 1400, 0.1, 25, peak=0.5), UK['slider'], 1.0, -0.6, -0.3)
for j in range(0, 101, 5):
    u = j / 100
    tt = UK['slider'] + sl * u
    sfx.add(tick(0.12, 3200, 30 + j), tt, 1.0, -0.5)
sfx.add(board(0.5, 150, 70) * 0.8 + np.pad(bloop(620, 940, 0.14, 0.35), (0, int(0.28 * SR)))[:int(0.42 * SR)], UK['kirim'], 1.0, -0.4)
sfx.move(whoosh(0.3, 900, 2600, 0.18, 26), UK['notif'], 1.0, -0.5, -0.5)
sfx.add(tear(0.3, 1.0, seed=27, body=0.8), UK['sobek'] - 0.05, 1.0, -0.5)                 # HIT: perforation
sfx.add(crease(0.45, 28), UK['gelinding'], 1.0, -0.4)
sfx.add(slap(0.12, 29) * 0.8, UK['gelinding'] + 0.6, 1.0, -0.7)   # the torn toast settles on the board (soft, not a hit)
sfx.move(roll_noise(PK['buka'] - UK['gelinding'] - 0.4, lambda t: np.clip(t / 1.5, 0.05, 1) * 0.2, 29, 150, 1300), UK['gelinding'] + 0.42, 1.0, -0.5, 0.2)
# S5: the card flap, the launch whoosh
sfx.add(crease(0.55, 31) + np.pad(whoosh(0.5, 300, 900, 0.3, 32), (int(0.05 * SR), 0))[:int(0.16 * SR)], PK['buka'], 1.0, 0.2)
sfx.move(whoosh(GK['g'] - PK['lontar'], 300, 2600, 0.3, 33, peak=0.4), PK['lontar'], 1.0, 0.3, -0.6)
# S6: five tuned clacks, then the pencil (hexagon ticks, slowing)
for i, k in enumerate(['g', 'e', 'r', 'a', 'k']):
    sfx.add(wood(mtof(PENTA[i] + 12), 0.55, 16), GK[k] + 0.2, 1.0, -0.6 + i * 0.22)
pen_len = KK['pensil'] - GK['pensil']
for j in range(40):
    tt = GK['pensil'] + pen_len * (1 - (1 - j / 40) ** 0.62)
    if tt < KK['pensil']: sfx.add(tick(0.07 * (1 - j / 48), 1400, 60 + j), tt, 1.0, 0.1)
# S8: near silence, the pencil stops, four folds (on the beat), the swell, the launch, the tear, then nothing
sfx.add(tick(0.35, 1300, 90), KK['pensil'], 1.0, 0.0)
for i, k in enumerate(['lipat1', 'lipat2', 'lipat3', 'lipat4']):
    sfx.add(crease(0.9, 91 + i), CU['kosong'][k] + 0.02, 1.0, (-0.25, 0.25, -0.1, 0.1)[i])
swell = sub(ROOTS[0] - 12, KK['terbang'] - KK['brand'], 0.5) * np.linspace(0, 1, int((KK['terbang'] - KK['brand']) * SR)) ** 2
sfx.add(swell, KK['brand'], 1.0)
sfx.move(glide(260, 1180, KK['tembus'] - KK['terbang'] + 0.1, 0.35), KK['terbang'], 1.0, -0.4, 0.6, rv=0.5)   # HIT: launch
sfx.move(whoosh(KK['tembus'] - KK['terbang'], 200, 3000, 0.4, 94, peak=0.85), KK['terbang'], 1.0, -0.3, 0.5, rv=0.3)
sfx.add(tear(0.7, 1.4, seed=95, body=1.4), KK['tembus'] - 0.03, 1.0, 0.4)                      # HIT: through the board
sfx.add(boom(0.6, 0.9, 80, 35), KK['tembus'], 1.0)
sfx.move(whoosh(KK['sunyi'] - KK['tembus'], 1800, 120, 0.3, 96, peak=0.2), KK['tembus'], 1.0, 0.4, 0.0, rv=0.4)

# ================================================================ closing (wide, clean)
shim = sum(np.sin(2 * np.pi * mtof(m + 24) * T(int(0.95 * SR))) for m in (61, 68, 72)) / 3
sfx.add(shim * np.sin(np.pi * np.linspace(0, 1, len(shim))) ** 1.5 * 0.14, CK['cincin'], 1.0, 0.0, rv=0.8)
sfx.move(whoosh(CK['kunci'] - CK['panah'], 250, 2800, 0.8, 97, peak=0.9), CK['panah'], 1.0, -0.9, 0.05, rv=0.3)
sfx.add(boom(0.75, 1.6), CK['kunci'], 1.0)                                                      # HIT: lock
sfx.add(slap(0.5, 98), CK['kunci'], 1.0, 0.1)
for i, m in enumerate(PENTA):
    sfx.add(bell(mtof(m + 12), 3.2, 0.1), CK['kunci'] + i * 0.012, 1.0, -0.4 + i * 0.2, rv=0.7)
sfx.add(whoosh(0.6, 600, 1800, 0.12, 99), CK['kunci'] + 0.47, 1.0, 0.0, rv=0.3)
sfx.add(pad(CHORDS[0], DUR - CK['kunci'], 0.3, 1200), CK['kunci'], 1.0, 0.0, rv=0.6)
sfx.add(bloop(700, 1000, 0.12, 0.15), CK['cta'], 1.0, 0.0, rv=0.3)
sfx.add(bloop(520, 900, 0.12, 0.2), CK['pill'], 1.0, 0.0, rv=0.3)
TYPE = np.cumsum([0, .06, .04, .07, .05, .05, .09, .04, .05, .06, .04, .05, .08, .05, .04, .06, .05])
for j, d in enumerate(TYPE):
    sfx.add(tick(0.16, 3800, 120 + j), CK['ketik'] + d, 1.0, -0.15 + 0.02 * j)
sfx.add(bloop(560, 980, 0.13, 0.25), CK['wa'], 1.0, 0.0, rv=0.3)
sfx.add(tick(0.4, 2200, 140) + np.pad(bloop(800, 1200, 0.1, 0.25), (0, 0))[:int(0.06 * SR)], CK['tap'], 1.0, 0.0, rv=0.2)

# ================================================================ mix
def wet(bus): return bus.dry + reverb(bus.send, 2.4, 6500)
mus = wet(music); fx = wet(sfx)
# silences: total silence before the logo, a clean fade at the very end
s0, s1 = int(KK['sunyi'] * SR), int(CK['cincin'] * SR)
for a in (mus, fx):
    fade = int(0.03 * SR)
    a[s0 - fade:s0] *= np.linspace(1, 0, fade)[:, None]
    a[s0:s1] = 0
    a[-int(0.7 * SR):] *= np.linspace(1, 0, int(0.7 * SR))[:, None] ** 1.5
mix = mus * 0.9 + fx

# ---- master: BS.1770 loudness to −14 LUFS, a look-ahead peak limiter at −1.9 dBFS (true peak ≤ −1 dBTP)
def k_weight(x):
    # BS.1770 pre-filter (high shelf +4 dB ~1.5 kHz) and RLB high-pass (~38 Hz), bilinear at 48 kHz
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    y = k_weight(x); blk = int(0.4 * SR); hop = int(0.1 * SR)
    ms = np.array([np.mean(np.sum(y[i:i + blk] ** 2, axis=1)) for i in range(0, len(y) - blk, hop)])
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    g1 = ms[L > -70]
    if not len(g1): return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(g1)) - 10
    g2 = ms[(L > -70) & (L > rel)]
    return -0.691 + 10 * np.log10(np.mean(g2))
def limiter(x, ceil_db=-1.9, look=0.004, rel=0.12):
    ceil = 10 ** (ceil_db / 20)
    a = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, ceil / np.maximum(a, 1e-9))
    la = int(look * SR)
    # look-ahead: the gain reaches its target before the peak, releases smoothly after it
    mn = np.copy(need)
    for k in range(1, la + 1): mn[:-k] = np.minimum(mn[:-k], need[k:])
    g = np.empty_like(mn); cur = 1.0; rc = np.exp(-1 / (rel * SR))
    for i in range(len(mn)):
        cur = mn[i] if mn[i] < cur else rc * cur + (1 - rc) * mn[i]
        g[i] = cur
    return x * g[:, None]
for _ in range(3):
    L = lufs(mix)
    gain = 10 ** ((-14 - L) / 20)
    mix = limiter(mix * gain); mus = mus * gain; fx = fx * gain
print('loudness', round(lufs(mix), 2), 'LUFS, peak', round(20 * np.log10(np.max(np.abs(mix))), 2), 'dBFS')
# the stems keep the mix's gain (not limited): music + sfx ≈ mix for a re-mix with a licensed track
mus = mus * 0.9

outdir = ROOT / 'app' / 'public' / 'audio'; outdir.mkdir(parents=True, exist_ok=True)
def w(path, x): wavfile.write(str(path), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
w(outdir / 'score.wav', mix); w(outdir / 'score_music.wav', mus); w(outdir / 'sfx.wav', fx)

# ================================================================ bars.json: 8 bands of the music stem per 60 fps frame
mono = mus.mean(1)
hop = SR // 60; win = 4096
bands = [(30, 70), (70, 160), (160, 400), (400, 1000), (1000, 2500), (2500, 5000), (5000, 10000), (10000, 16000)]
freqs = np.fft.rfftfreq(win, 1 / SR)
masks = [(freqs >= lo) & (freqs < hi) for lo, hi in bands]
nfr = int(DUR * 60)
padded = np.pad(mono, (win // 2, win))
hann = np.hanning(win)
E = np.zeros((nfr, 8))
for f in range(nfr):
    seg = padded[f * hop:f * hop + win] * hann
    sp = np.abs(np.fft.rfft(seg)) ** 2
    E[f] = [10 * np.log10(sp[m].sum() + 1e-12) for m in masks]
# normalise each band over the pop-up window, attack fast / release slower (bars that jump and settle)
w0, w1 = int(PK['tegak'] * 60), int(GK['g'] * 60)
out = np.zeros_like(E)
for b in range(8):
    lo, hi = np.percentile(E[w0:w1, b], 10), np.percentile(E[w0:w1, b], 97)
    v = np.clip((E[:, b] - lo) / max(hi - lo, 1e-6), 0, 1) ** 1.3
    s = np.zeros(nfr); acc = 0.0
    for f in range(nfr):
        acc = v[f] if v[f] > acc else acc * 0.86 + v[f] * 0.14
        s[f] = acc
    out[:, b] = s
dd = ROOT / 'app' / 'public' / 'data'; dd.mkdir(parents=True, exist_ok=True)
(dd / 'bars.json').write_text(json.dumps({'fps': 60, 'bands': [f'{a}-{b} Hz' for a, b in bands], 'frames': np.round(out, 3).tolist()}), encoding='utf-8')
print('ok', outdir / 'score.wav', 'peak', round(20 * np.log10(np.max(np.abs(mix)) + 1e-9), 2), 'dBFS', 'bars', out.shape)
