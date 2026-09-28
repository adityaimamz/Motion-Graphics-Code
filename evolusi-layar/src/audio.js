// audio.js — the soundtrack, synthesised from the same timeline as the pictures.
// renderAudio() → { sr, L, R } (Float32, stereo). Pure function: no randomness except hash(), no clock.
// Runs in Node (render.mjs → WAV → muxed into the MP4) and in the browser (preview playback).
import { S, TR, DURATION, HOOK, YEAR_K, CAPTIONS, TERM_CPS, CUE, VO_PLACE } from './timeline.js';
import { keys, hash, clamp, lerp } from './core.js';
import { P91A, P91B } from './sites.js';

export const SR = 48000;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let N = 0;

// ================================================================ DSP primitives
class Bus { constructor() { this.L = new Float32Array(N); this.R = new Float32Array(N); } }
const wn = (k, seed) => hash(k, seed) * 2 - 1;

function panGains(p) { const a = (clamp(p, -1, 1) + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }
// schedule a mono generator gen(tt, k) on a bus; pan may be a number or fn(tt)
function play(bus, t0, dur, gen, gain = 1, pan = 0, send = null, sendAmt = 0) {
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let [gl, gr] = panGains(typeof pan === 'number' ? pan : 0);
  const dyn = typeof pan === 'function';
  for (let k = 0; k < n; k++) {
    const tt = k / SR, v = gen(tt, k), i = i0 + k;
    if (i < 0) continue; if (i >= N) break;
    if (dyn && (k & 63) === 0) [gl, gr] = panGains(pan(tt));
    const l = v * gl * gain, r = v * gr * gain;
    bus.L[i] += l; bus.R[i] += r;
    if (send) { send.L[i] += l * sendAmt; send.R[i] += r * sendAmt; }
  }
}
// TPT state-variable filter
class SVF {
  constructor(fc = 1000, q = 0.707) { this.s1 = 0; this.s2 = 0; this.set(fc, q); }
  set(fc, q = this.q) {
    this.q = q; const g = Math.tan(Math.PI * Math.min(Math.max(fc, 10), SR * 0.45) / SR), k = 1 / q;
    this.k = k; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2;
  }
  run(x) {
    const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3;
    this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2;
    return v2;
  }
}
const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
function saw() { let ph = hashPh(); return (f) => { const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1; return 2 * ph - 1 - blep(ph, dt); }; }
function sqr(naive = false) { let ph = 0; return (f, pw = 0.5) => { const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1; let v = ph < pw ? 1 : -1; if (!naive) { v += blep(ph, dt); v -= blep((ph - pw + 1) % 1, dt); } return v; }; }
function sine(p0 = 0) { let ph = p0; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return Math.sin(TAU * ph); }; }
function tri() { let ph = 0.25; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return 4 * Math.abs(ph - 0.5) - 1; }; }
let phSeed = 0; const hashPh = () => hash(phSeed++, 4242);
const ad = (tt, a, dur, r) => (tt < a ? tt / a : tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / r));
const ex = (tt, tau) => Math.exp(-tt / tau);

// ================================================================ instruments
function kick(b, t, g = 1, o = {}) {
  const { p0 = 150, p1 = 46, pd = 0.035, dec = 0.3, click = 0.25 } = o; const s = sine(); let seed = Math.round(t * 1000);
  play(b, t, dec * 3, (tt, k) => s(p1 + (p0 - p1) * ex(tt, pd)) * ex(tt, dec) + click * wn(k, seed) * ex(tt, 0.0015), g);
}
function snare(b, t, g = 1, pan = 0, send, sa) {
  const s = sine(), f = new SVF(1800, 0.8), seed = Math.round(t * 997);
  play(b, t, 0.4, (tt, k) => 0.5 * s(190) * ex(tt, 0.05) + (f.run(wn(k, seed)), f.hp) * ex(tt, 0.11), g, pan, send, sa);
}
function hat(b, t, g = 1, open = false, pan = 0) {
  const f = new SVF(8000, 0.9), seed = Math.round(t * 1013);
  play(b, t, open ? 0.35 : 0.08, (tt, k) => (f.run(wn(k, seed)), f.hp) * ex(tt, open ? 0.09 : 0.022), g, pan);
}
function clap(b, t, g = 1, pan = 0, send, sa) {
  const f = new SVF(1500, 1.4), seed = Math.round(t * 1019);
  play(b, t, 0.45, (tt, k) => {
    const e = ex(tt, 0.004) + (tt > 0.009 ? ex(tt - 0.009, 0.004) : 0) + (tt > 0.019 ? ex(tt - 0.019, 0.004) : 0) + (tt > 0.022 ? 0.6 * ex(tt - 0.022, 0.09) : 0);
    f.run(wn(k, seed)); return f.bp * e * 2.2;
  }, g, pan, send, sa);
}
function snap(b, t, g = 1, pan = 0, send, sa) {
  const f = new SVF(2600, 3), s = sine(), seed = Math.round(t * 1031);
  play(b, t, 0.12, (tt, k) => { f.run(wn(k, seed)); return f.bp * ex(tt, 0.012) * 3 + 0.3 * s(1900) * ex(tt, 0.004); }, g, pan, send, sa);
}
function shaker(b, t, g = 1, pan = 0) {
  const f = new SVF(6500, 1), seed = Math.round(t * 1049);
  play(b, t, 0.1, (tt, k) => { f.run(wn(k, seed)); return f.hp * (tt < 0.012 ? tt / 0.012 : ex(tt - 0.012, 0.03)); }, g, pan);
}
function rim(b, t, g = 1, pan = 0, send, sa) {
  const f = new SVF(3200, 4), s = sine(), seed = Math.round(t * 1061);
  play(b, t, 0.08, (tt, k) => { f.run(wn(k, seed)); return (f.bp * 2 + 0.6 * s(1700)) * ex(tt, 0.012); }, g, pan, send, sa);
}
function tick(b, t, g = 1, pan = 0, f0 = 3500) { // mechanical odometer / UI tick
  const f = new SVF(f0, 5), s = sine(), seed = Math.round(t * 1087);
  play(b, t, 0.05, (tt, k) => { f.run(wn(k, seed)); return (f.bp * 2.5 + 0.4 * s(f0 * 0.62)) * ex(tt, 0.005); }, g, pan);
}
function keyClick(b, t, g = 1, pan = 0, heavy = false) { // mechanical keyboard
  const seed = Math.round(t * 1597), f = new SVF(2200 + 1400 * hash(seed, 1), 2.5), s = sine();
  const body = heavy ? 120 : 170 + 60 * hash(seed, 2);
  play(b, t, 0.07, (tt, k) => { f.run(wn(k, seed)); return f.bp * ex(tt, 0.006) * 2.4 + 0.5 * s(body) * ex(tt, heavy ? 0.03 : 0.018); }, g * (0.8 + 0.3 * hash(seed, 3)), pan);
}
function teletype(b, t, g = 1, pan = 0) { // tiny print head click
  const seed = Math.round(t * 2203), f = new SVF(1400 + 1600 * hash(seed, 5), 3);
  play(b, t, 0.02, (tt, k) => { f.run(wn(k, seed)); return f.bp * ex(tt, 0.0025) * 3; }, g * (0.6 + 0.5 * hash(seed, 6)), pan);
}
function blip(b, t, freq, dur, g = 1, pan = 0, type = 'sine', send, sa) {
  const o = type === 'sqr' ? sqr(true) : type === 'tri' ? tri() : sine();
  play(b, t, dur + 0.02, (tt) => o(freq) * (tt < 0.003 ? tt / 0.003 : ex(tt, dur * 0.35)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.02)), g, pan, send, sa);
}
function fm(b, t, freq, dur, g, pan, o = {}, send, sa) {
  const { ratio = 1, index = 2, idec = 0.4, adec = 1.2, rel = 0.12, att = 0.002, ratio2 = 0, index2 = 0, idec2 = 0.05, trem = 0 } = o;
  const c = sine(), m = sine(), m2 = sine();
  let cp = 0, mp = 0, mp2 = 0;
  play(b, t, dur + rel, (tt) => {
    mp += freq * ratio / SR; mp2 += freq * ratio2 / SR;
    const mod = index * ex(tt, idec) * Math.sin(TAU * mp) + index2 * ex(tt, idec2) * Math.sin(TAU * mp2);
    cp += freq / SR;
    const amp = (tt < att ? tt / att : ex(tt - att, adec)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / rel)) * (1 + trem * Math.sin(TAU * 5 * tt));
    return Math.sin(TAU * cp + mod) * amp;
  }, g, pan, send, sa);
}
const epiano = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 1, index: 1.4, idec: 0.5, adec: 1.6, ratio2: 14, index2: 0.35, idec2: 0.03, trem: 0.08, rel: 0.25 }, send, sa);
const bell = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 3.5, index: 2.4, idec: 0.9, adec: dur * 0.5, rel: 0.2 }, send, sa);
const marimba = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 4, index: 1.8, idec: 0.04, adec: 0.32, rel: 0.05 }, send, sa);
function pluck(b, t, m, dur, g, pan, send, sa, damp = 0.994) { // Karplus-Strong
  const f = mtof(m), L = Math.max(2, Math.round(SR / f)), buf = new Float32Array(L), seed = Math.round(t * 3001 + m);
  let lp = 0; for (let i = 0; i < L; i++) { lp = lp * 0.55 + wn(i, seed) * 0.45; buf[i] = lp; }
  let idx = 0;
  play(b, t, dur + 0.1, (tt) => {
    const a = buf[idx], nb = buf[(idx + 1) % L];
    buf[idx] = damp * 0.5 * (a + nb); idx = (idx + 1) % L;
    return a * 1.6 * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.1));
  }, g, pan, send, sa);
}
function supersaw(b, t, notes, dur, g, pan, cutoff, send, sa) {
  const oscs = []; notes.forEach((m) => [-0.12, -0.05, 0, 0.05, 0.12].forEach((d) => oscs.push([saw(), mtof(m + d)])));
  const fl = new SVF(800, 0.9), fr = new SVF(800, 0.9);
  play(b, t, dur + 0.15, (tt, k) => {
    let v = 0; for (const [o, fq] of oscs) v += o(fq);
    if ((k & 31) === 0) { const c = cutoff(t + tt); fl.set(c); }
    return fl.run(v / oscs.length * 1.8) * ad(tt, 0.02, dur, 0.15);
  }, g, pan, send, sa);
}
function pad(b, t, notes, dur, g, pan = 0, fc = 1400, att = 0.5, rel = 0.8, send, sa) {
  const oscs = []; notes.forEach((m, j) => { oscs.push([saw(), mtof(m) * 1.003]); oscs.push([tri(), mtof(m) * 0.997]); });
  const f = new SVF(fc, 0.7);
  play(b, t, dur + rel, (tt) => { let v = 0; for (const [o, fq] of oscs) v += o(fq); return f.run(v / oscs.length) * ad(tt, att, dur, rel); }, g, pan, send, sa);
}
function sub(b, t, m, dur, g, pan = 0) { const s = sine(); play(b, t, dur + 0.08, (tt) => s(mtof(m)) * ad(tt, 0.008, dur, 0.08), g, pan); }
function chipLead(b, t, m, dur, g, pan, send, sa) {
  const o = sqr(true);
  play(b, t, dur + 0.01, (tt) => o(mtof(m) * (1 + (tt > 0.12 ? 0.006 * Math.sin(TAU * 6 * tt) : 0)), 0.5) * (tt < 0.004 ? tt / 0.004 : 0.55 + 0.45 * ex(tt, 0.08)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.01)), g, pan, send, sa);
}
function chipBass(b, t, m, dur, g) { const o = sqr(true); play(b, t, dur, (tt) => o(mtof(m), 0.25) * (tt < dur - 0.01 ? 1 : Math.max(0, (dur - tt) / 0.01)), g); }
// noise swept through a band-pass: whooshes, risers, zooms
function whoosh(b, t, dur, f0, f1, g, pan0 = 0, pan1 = 0, shape = 'bell', q = 1.2, send, sa) {
  const f = new SVF(f0, q), seed = Math.round(t * 4001 + f0);
  const env = shape === 'rise' ? (x) => x * x * x : shape === 'fall' ? (x) => (1 - x) * (1 - x) : shape === 'suck' ? (x) => Math.pow(x, 4) : (x) => Math.pow(Math.sin(Math.PI * x), 1.4);
  play(b, t, dur, (tt, k) => {
    const x = tt / dur;
    if ((k & 15) === 0) f.set(f0 * Math.pow(f1 / f0, x), q);
    f.run(wn(k, seed)); return f.bp * env(x) * 1.6;
  }, g, (tt) => lerp(pan0, pan1, tt / dur), send, sa);
}
function glide(b, t, dur, f0, f1, g, pan = 0, type = 'sine', send, sa) {
  const o = type === 'sqr' ? sqr() : type === 'saw' ? saw() : sine();
  play(b, t, dur, (tt) => o(f0 * Math.pow(f1 / f0, tt / dur)) * Math.sin(Math.PI * Math.min(1, tt / dur)) ** 0.7, g, pan, send, sa);
}
function crash(b, t, g, pan = 0, send, sa) {
  const f = new SVF(5000, 0.6), seed = Math.round(t * 5003);
  play(b, t, 1.6, (tt, k) => { f.run(wn(k, seed)); return (f.hp * 0.8 + f.bp * 0.4) * ex(tt, 0.45); }, g, pan, send, sa);
}
function impact(b, t, g, send, sa) {
  const s = sine(), f = new SVF(900, 0.7), seed = Math.round(t * 6007);
  play(b, t, 2.4, (tt, k) => s(34 + 30 * ex(tt, 0.25)) * ex(tt, 0.9) * 1.1 + (f.run(wn(k, seed)), f.lp) * ex(tt, 0.12) * 1.4 + wn(k, seed + 1) * ex(tt, 0.002) * 0.4, g, 0, send, sa);
}

// ================================================================ effects on whole buses
function reverb(send, out, wet = 1) { // Freeverb-style: 8 combs + 4 allpasses per side
  const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  for (const [src, dst, spread] of [[send.L, out.L, 0], [send.R, out.R, 23]]) {
    const cb = combs.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0, f: 0 }));
    const ab = aps.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0 }));
    const fb = 0.84, damp = 0.22;
    for (let n = 0; n < N; n++) {
      const x = src[n] * 0.015; let y = 0;
      for (const c of cb) { const o = c.b[c.i]; c.f = o * (1 - damp) + c.f * damp; c.b[c.i] = x + c.f * fb; if (++c.i >= c.b.length) c.i = 0; y += o; }
      for (const a of ab) { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; y = o - y; if (++a.i >= a.b.length) a.i = 0; }
      dst[n] += y * wet;
    }
  }
}
function addBus(dst, src, g = 1, from = 0, to = N) { for (let i = Math.max(0, from); i < Math.min(N, to); i++) { dst.L[i] += src.L[i] * g; dst.R[i] += src.R[i] * g; } }
const rd = (a, p) => { const i = Math.floor(p), f = p - i; return i < 0 || i + 1 >= a.length ? 0 : a[i] * (1 - f) + a[i + 1] * f; };
// tape stop: playback rate falls from 1 to 0 across [a, b]
function tapeStop(src, dst, a, b) {
  const ia = Math.round(a * SR), ib = Math.round(b * SR);
  addBus(dst, src, 1, 0, ia);
  let p = ia;
  for (let i = ia; i < ib; i++) {
    const x = (i - ia) / (ib - ia), r = Math.pow(1 - x, 1.6), g = 1 - x * x;
    p += r; dst.L[i] += rd(src.L, p) * g; dst.R[i] += rd(src.R, p) * g;
  }
}
// stuck loader: from `a` repeat the preceding slice of length L with a closing filter, until `b`
function stutter(src, dst, a, b, L) {
  const ia = Math.round(a * SR), ib = Math.round(b * SR), il = Math.round(L * SR), fade = Math.round(0.004 * SR);
  addBus(dst, src, 1, 0, ia);
  let zl = 0, zr = 0;
  for (let i = ia; i < ib; i++) {
    const x = (i - ia) / (ib - ia), ph = (i - ia) % il, j = ia - il + ph;
    const w = Math.min(1, ph / fade, (il - ph) / fade) * (1 - 0.45 * x) * (i > ib - fade ? (ib - i) / fade : 1);
    const c = 0.5 - 0.42 * x; // one-pole coefficient: brighter → duller
    zl += (src.L[j] - zl) * c; zr += (src.R[j] - zr) * c;
    dst.L[i] += zl * w; dst.R[i] += zr * w;
  }
}
function fadeBus(b, a0, a1, to = 0) { // linear fade of a region to 'to' and beyond
  const i0 = Math.round(a0 * SR), i1 = Math.round(a1 * SR);
  for (let i = Math.max(0, i0); i < N; i++) { const g = i < i1 ? lerp(1, to, (i - i0) / (i1 - i0)) : to; b.L[i] *= g; b.R[i] *= g; }
}

// ================================================================ the score
const bar = (bpm) => (60 / bpm) * 4;
function oddometerTicks(sfx) {
  for (let s = 1; s < YEAR_K.length; s++) {
    const [t0, y0] = YEAR_K[s - 1], [t1, y1] = YEAR_K[s];
    if (y1 === y0) continue;
    let last = Math.floor(keys(t0, YEAR_K));
    for (let t = t0; t <= t1 + 0.001; t += 0.001) {
      const y = Math.floor(keys(t, YEAR_K) + 1e-9);
      if (y !== last) { const carry = y % 10 === 0; tick(sfx, t, carry ? 0.2 : 0.13, 0, carry ? 2400 : 3400 + 300 * (y % 3)); last = y; }
    }
  }
}
const capsOf = (sc) => CAPTIONS.filter((c) => c.scene === sc); // a scene may have two caption pages
function captionFall(sfx, send, cap) {
  glide(sfx, cap.out, 0.45, 1300, 260, 0.035, 0, 'sine', send, 0.3);
  whoosh(sfx, cap.out, 0.5, 3000, 500, 0.05, 0, 0, 'fall', 1);
}

// ================================================================ voice-over: ducking + placement
// music ≈ −11 dB and sfx ≈ −5 dB under the voice; voice level is set against the full-mix reference so it sits
// ≈ 10 dB above the ducked bed (measured: STATS.voiceOverBedDb)
const VO_DUCK_MUSIC = 0.72, VO_DUCK_SFX = 0.45, VO_OVER_MIX_DB = -2;
function duckCurve(lines) {
  const d = new Float32Array(N);
  for (const p of lines) {
    const a = p.start - 0.12, b = p.start, c = p.start + p.dur, e = c + 0.35;
    for (let i = Math.max(0, Math.floor(a * SR)); i < Math.min(N, Math.ceil(e * SR)); i++) {
      const t = i / SR, v = t < b ? (t - a) / (b - a) : t < c ? 1 : 1 - (t - c) / (e - c);
      const sm = v * v * (3 - 2 * v); if (sm > d[i]) d[i] = sm;
    }
  }
  // bridge short gaps between lines so the music doesn't pump
  const gap = Math.round(0.45 * SR);
  for (let i = 0, last = -1; i < N; i++) if (d[i] >= 0.999) { if (last >= 0 && i - last > 1 && i - last < gap) for (let k = last + 1; k < i; k++) d[k] = 1; last = i; }
  return d;
}
function activeRMS(b) {
  let s = 0, n = 0; const win = SR / 10;
  for (let w = 0; w + win < N; w += win) { let e = 0; for (let i = w; i < w + win; i++) e += b.L[i] * b.L[i] + b.R[i] * b.R[i]; e /= 2 * win; if (e > 1e-7) { s += e; n++; } }
  return Math.sqrt(s / Math.max(1, n));
}
function addVoice(OUT, vo, lines, target) {
  for (const p of lines) {
    const { data, lead } = vo[p.id], hp = new SVF(75, 0.707);
    const x = new Float32Array(data.length); for (let i = 0; i < x.length; i++) { hp.run(data[i]); x[i] = hp.hp; }
    const a = Math.round(lead * SR), b = Math.min(x.length, Math.round((lead + p.dur) * SR));
    let e = 0; for (let i = a; i < b; i++) e += x[i] * x[i];
    const g = target / Math.max(Math.sqrt(e / Math.max(1, b - a)), 1e-6), off = Math.round((p.start - lead) * SR), f = Math.round(0.006 * SR);
    for (let k = 0; k < x.length; k++) {
      const i = off + k; if (i < 0) continue; if (i >= N) break;
      const w = Math.min(1, k / f, (x.length - 1 - k) / f);
      const v = x[k] * g * w * 0.85; OUT.L[i] += v; OUT.R[i] += v;
    }
  }
}

function score(vo = {}) {
  const M = new Bus(), X = new Bus(), V = new Bus(); // music, sfx, reverb send
  // ----------------------------------------------------------------- HOOK
  const tim = [
    (t, g, p) => blip(X, t, 1320, 0.03, g, p, 'sine'),
    (t, g, p) => blip(X, t, 1046 + 262 * hash(Math.round(t * 60), 1), 0.035, g * 0.7, p, 'sqr'),
    (t, g, p) => glide(X, t, 0.05, 2400, 600, g, p, 'saw'),
    (t, g, p) => bell(X, t, 91, 0.08, g * 0.9, p),
    (t, g, p) => pluck(X, t, 84, 0.06, g * 1.2, p),
  ];
  const wpan = [-0.35, 0.35, -0.35, 0.35, 0];
  for (let i = 0; i < HOOK.words; i++) {
    const a0 = HOOK.arrive(i), lk = HOOK.lock(i);
    kick(X, Math.max(0, a0), 0.32, { p0: 180, p1: 60, dec: 0.12, click: 0.4 });
    for (let s = 0; a0 + s / HOOK.styleHz < lk; s++) {
      const t = a0 + s / HOOK.styleHz; if (t < 0) continue;
      tim[(s + i * 2) % 5](t, 0.07, wpan[i]);
    }
    tick(X, lk, 0.22, wpan[i], 2600);
    bell(X, lk, [72, 76, 79, 84, 88][i], 0.5, 0.06, wpan[i], V, 0.4);
  }
  sub(X, HOOK.lock(4), 36, 0.5, 0.35);
  pad(M, HOOK.lock(4), [48, 55, 64, 71], HOOK.bs0 - HOOK.lock(4) + 0.1, 0.05, 0, 900, 0.25, 0.25, V, 0.6);
  const hookChars = 'Kenapadesainwebsiteterusberubah?'.length;
  for (let k = 0; k < hookChars; k += 2) keyClick(X, HOOK.bs0 + (k / hookChars) * (HOOK.bs1 - HOOK.bs0), 0.16, 0.1);
  glide(X, HOOK.bs1, 0.15, 1400, 520, 0.05, 0);
  // CRT power-on + degauss + whine
  {
    const t = S.e91, s = sine();
    play(X, t, 0.3, (tt, k) => s(95 - 50 * tt) * ex(tt, 0.09) + wn(k, 77) * ex(tt, 0.02) * 0.5, 0.35);
    const q = sqr(true), f = new SVF(260, 2);
    play(X, t + 0.05, 0.75, (tt) => f.run(q(50)) * ex(tt, 0.25) * (0.7 + 0.3 * Math.sin(TAU * 7 * tt)), 0.12);
    const w = sine(); play(X, t, 0.7, (tt) => w(15625) * ex(tt, 0.3), 0.012);
    whoosh(X, t, 0.35, 5000, 1500, 0.05, 0, 0, 'fall', 0.7);
  }
  // ----------------------------------------------------------------- 1991
  {
    const t0 = S.e91, t1 = TR.t1[1];
    // mains hum (50 Hz) + faint tube hiss, the room tone of the text era
    const h1 = sine(), h2 = sine(), h3 = sine(), hf = new SVF(3000, 0.6);
    play(X, t0 + 0.1, t1 - t0 - 0.1, (tt, k) => {
      const env = Math.min(1, tt / 0.4) * (t0 + 0.1 + tt > TR.t1[0] ? Math.max(0, 1 - (t0 + 0.1 + tt - TR.t1[0]) / 0.5) : 1);
      return (h1(50) * 0.5 + h2(100) * 0.35 + h3(150) * 0.15 + (hf.run(wn(k, 91)), hf.bp) * 0.25) * env;
    }, 0.03);
    // low drone gives the silence a floor
    pad(M, t0 + 0.9, [33, 40, 45], TR.t1[0] - t0 - 0.9, 0.05, 0, 500, 1.2, 0.5, V, 0.3);
    // print head: one click per printed glyph
    const printPage = (lines, start, cps) => {
      let n = 0;
      for (const l of lines) { for (const ch of l) { n++; if (ch !== ' ') teletype(X, start + n / cps, 0.07, -0.05); } n++; }
    };
    printPage(P91A, t0 + CUE.print1, CUE.print1Cps);
    printPage(P91B, t0 + CUE.print2, CUE.print2Cps);
    keyClick(X, t0 + CUE.key1, 0.28, 0.05, true);
    whoosh(X, t0 + CUE.scroll, 0.12, 2500, 400, 0.05, 0, 0, 'bell', 1.5);
  }
  // captions typed on a keyboard (1991)
  {
    const cap = CAPTIONS[0];
    for (const [text, at] of cap.beats) [...text].forEach((ch, k) => { const t = cap.t0 + at + (k + 1) / TERM_CPS; if (ch === ' ' || ch === '\n') keyClick(X, t, 0.18, -0.15, true); else keyClick(X, t, 0.13, -0.15); });
    captionFall(X, V, cap);
  }
  // T1 pixel dissolve: sample-and-hold crunch
  {
    let held = 0, acc = 0;
    play(X, TR.t1[0], TR.t1[1] - TR.t1[0], (tt, k) => {
      const x = tt / (TR.t1[1] - TR.t1[0]), rate = 300 * Math.pow(25, x);
      acc += rate / SR; if (acc >= 1) { acc -= 1; held = wn(k, 1998); }
      return held * Math.sin(Math.PI * x) ** 1.2;
    }, 0.07);
  }
  // ----------------------------------------------------------------- 1998 — General-MIDI-ish chiptune, 140 BPM
  {
    const bpm = 140, st = 60 / bpm / 4, t0 = S.e98, tEnd = TR.t2[0] + 0.35;
    const chords = [[48, 'M'], [45, 'm'], [41, 'M'], [43, 'M']];
    const mel = [[76, 79, 84, 79, 76, 79, 81, 79], [76, 72, 76, 81, 84, 83, 81, 76], [77, 81, 84, 81, 77, 81, 84, 86], [86, 84, 83, 79, 83, 86, 79, 83]];
    const B = new Bus();
    for (let s = 0; ; s++) {
      const t = t0 + s * st; if (t >= tEnd) break;
      const barI = Math.floor(s / 16) % 4, step = s % 16, [root, q] = chords[barI];
      if (step % 2 === 0) chipBass(B, t, root + (step % 4 === 2 ? 12 : 0) - 12, st * 1.8, 0.07);
      if (step % 2 === 0) chipLead(B, t, mel[barI][step / 2], st * 1.7, 0.035, 0.15, V, 0.25);
      const arp = q === 'M' ? [0, 4, 7, 12] : [0, 3, 7, 12];
      chipLead(B, t, root + 24 + arp[step % 4], st * 0.8, 0.012, -0.3);
      if (step === 0 || step === 8 || step === 10) kick(B, t, 0.42, { dec: 0.18 });
      if (step === 4 || step === 12) snare(B, t, 0.22, 0, V, 0.2);
      if (step % 2 === 0) hat(B, t, 0.07, false, 0.2);
    }
    fadeBus(B, TR.t2[0], TR.t2[0] + 0.4, 0);
    addBus(M, B);
    const pans = [0, 0, 0, -0.35, 0, 0.35, 0, 0, -0.2, 0, 0.2, 0];
    const pent = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98];
    CUE.pops98.forEach((p, i) => {
      glide(X, t0 + p, 0.16, mtof(pent[i] - 12), mtof(pent[i]), 0.07, pans[i], 'tri');
      bell(X, t0 + p + 0.03, pent[i] + 12, 0.15, 0.03, pans[i], V, 0.4);
    });
    for (let k = 1; t0 + CUE.counter98 + k / CUE.counterRate98 < TR.t2[0]; k++) tick(X, t0 + CUE.counter98 + k / CUE.counterRate98, 0.04, 0, 4200);
    // fire crackle
    for (let k = 0; k < 90; k++) { const t = t0 + 1.8 + k * 0.045 + hash(k, 55) * 0.03; if (t < TR.t2[0] && hash(k, 56) > 0.45) teletype(X, t, 0.05 * hash(k, 57), (hash(k, 58) - 0.5) * 0.8); }
    // rainbow caption: a sparkle per glyph, climbing
    const cap = CAPTIONS[1];
    for (const [text, at] of cap.beats) [...text.replace('\n', ' ')].forEach((ch, k) => { if (ch !== ' ') blip(X, cap.t0 + at + k * 0.02, mtof(pent[k % 12]), 0.05, 0.022, 0.1, 'sine', V, 0.3); });
    captionFall(X, V, cap);
    // iris: the classic swoop
    glide(X, TR.t2[0], TR.t2[1] - TR.t2[0], 1600, 180, 0.07, 0, 'sine', V, 0.3);
  }
  // ----------------------------------------------------------------- 2002 — trance intro that gets stuck at 99%
  {
    const bpm = 138, beat = 60 / bpm, t0 = S.e02, tLoad = t0 + CUE.load02[0], tStall = t0 + CUE.load02[1], tClick = t0 + CUE.click02;
    const B = new Bus();
    const loadP = (t) => { const lp = clamp((t - tLoad) / (tStall - tLoad)); return 1 - Math.pow(1 - lp, 2.6); };
    // intro: orbit drone + riser into the first kick
    pad(B, t0, [45, 52, 57], CUE.load02[0] + 0.1, 0.06, 0, 700, 0.3, 0.2, V, 0.4);
    whoosh(B, t0 + 0.05, CUE.load02[0], 300, 4000, 0.08, 0, 0, 'rise', 1.5);
    const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55, 60], [55, 59, 62]];
    const barLen = beat * 4;
    for (let bI = 0; tLoad + bI * barLen < tStall + barLen; bI++) {
      const tb = tLoad + bI * barLen, ch = prog[bI % 4];
      supersaw(B, tb, ch.map((m) => m + 12), barLen - 0.02, 0.05, 0, (tt) => 350 + 6500 * loadP(tt), V, 0.35);
      for (let q = 0; q < 4; q++) {
        const tq = tb + q * beat;
        kick(B, tq, 0.55, { dec: 0.22 });
        hat(B, tq + beat / 2, 0.09, true, 0.25);
        if (bI > 0 && (q === 1 || q === 3)) clap(B, tq, 0.18, 0, V, 0.2);
        for (let s = 1; s < 4; s++) { const o = saw(), f = new SVF(700, 1.5), tt0 = tq + s * beat / 4, fr = mtof(ch[0] - 24); play(B, tt0, beat / 4 * 0.9, (tt) => f.run(o(fr)) * ex(tt, 0.06), 0.1); }
      }
    }
    stutter(B, M, tStall, tClick, beat / 2);
    // stuck-loader beep
    for (let t = tStall + 0.2; t < tClick - 0.1; t += beat * 2) blip(X, t, 1760, 0.06, 0.025, 0.35, 'sqr');
    // flying letters + landing clanks
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      const tl = t0 + CUE.letters02(i);
      whoosh(X, tl, 0.3, 700, 3500, 0.05, (i - 4) / 6, (i - 4) / 10, 'bell', 1.4);
      fm(X, tl + 0.32, mtof(69 + (i % 3) * 7), 0.2, 0.035, (i - 4) / 8, { ratio: 1.41, index: 3.5, idec: 0.06, adec: 0.18 }, V, 0.3);
    }
    // lens flare shimmer
    whoosh(X, t0 + CUE.flare02[0], CUE.flare02[1] - CUE.flare02[0], 2500, 9000, 0.05, -0.5, 0.5, 'bell', 2);
    bell(X, t0 + CUE.flare02[0] + 0.35, 93, 0.6, 0.03, 0.2, V, 0.6);
    // tagline typed in pixels
    for (let k = 0; k < 28; k++) if ('ENTERING THE KOPI EXPERIENCE'[k] !== ' ') blip(X, t0 + CUE.tag02 + (k + 1) / 40, 2093, 0.012, 0.018, 0, 'sqr');
    // chrome caption: one whoosh per beat + glints
    const cap = CAPTIONS[2];
    for (const [text, at] of cap.beats) whoosh(X, cap.t0 + at, 0.014 * text.length + 0.5, 600, 5000, 0.06, -0.3, 0.3, 'bell', 1);
    for (let g = cap.t0 + 1.9; g < cap.out; g += 1.7) bell(X, g + 0.3, 100, 0.25, 0.018, 0, V, 0.5);
    captionFall(X, V, cap);
    // hover + click + flash
    blip(X, t0 + CUE.hover02, 1320, 0.02, 0.05, 0.3);
    tick(X, tClick, 0.3, 0.3, 4500); tick(X, tClick + 0.07, 0.18, 0.3, 3800);
    crash(X, tClick + 0.02, 0.2, 0, V, 0.6);
    whoosh(X, tClick, 0.5, 8000, 800, 0.1, 0, 0, 'fall', 0.8, V, 0.4);
    sub(X, tClick + 0.02, 31, 0.25, 0.3);
  }
  // ----------------------------------------------------------------- 2007 — glossy, plucky pop (tape-stops during the flattening)
  {
    const bpm = 118, beat = 60 / bpm, t0 = S.e07 + 0.05, tEnd = TR.t4[1];
    const B = new Bus(), lift = S.e07 + CUE.wander07; // second caption page: the groove opens up so the longer hold keeps moving
    const prog = [[53, [60, 65, 69, 72]], [48, [60, 64, 67, 72]], [50, [62, 65, 69, 74]], [46, [58, 62, 65, 70]]];
    for (let s = 0; ; s++) {
      const t = t0 + s * beat / 2; if (t >= tEnd) break;
      const barI = Math.floor(s / 8) % 4, e = s % 8, [root, tones] = prog[barI];
      marimba(B, t, tones[[0, 1, 2, 3, 2, 1, 3, 2][e]] + 12, beat * 0.45, 0.07, (e % 2 ? 0.3 : -0.3), V, 0.3);
      if (e % 2 === 0) { const o = sine(), o2 = tri(); play(B, t, beat * 0.4, (tt) => (o(mtof(root - 12)) * 0.7 + o2(mtof(root)) * 0.3) * ad(tt, 0.005, beat * 0.3, 0.08), 0.16); }
      if (e === 0 || e === 4) kick(B, t, 0.4, { dec: 0.2 });
      if (e === 2 || e === 6) clap(B, t, 0.16, 0, V, 0.25);
      shaker(B, t + beat / 4, 0.05, 0.4); shaker(B, t, 0.03, 0.4);
      if (e === 0) bell(B, t, tones[3] + 24, 0.8, 0.022, 0.2, V, 0.5);
      if (t >= lift - 0.01) {
        hat(B, t + beat / 4, 0.045, false, -0.25);
        if (e === 3 || e === 7) bell(B, t, tones[e === 3 ? 1 : 2] + 24, 0.35, 0.014, 0.35, V, 0.5);
      }
    }
    // gloss sheens: a "shing" each time the highlight sweeps the button
    for (let k = 1; S.e07 + k / 0.55 < TR.t4[0]; k++) { const t = S.e07 + k / 0.55 + 0.22; bell(B, t, 103, 0.3, 0.018, -0.2, V, 0.6); bell(B, t + 0.05, 108, 0.3, 0.012, -0.2, V, 0.6); }
    for (const cap of capsOf('e07')) for (const [, at] of cap.beats) [84, 88, 91, 96].forEach((m, j) => bell(B, cap.t0 + at + j * 0.05, m, 0.6, 0.02, 0.1 * j, V, 0.6));
    // the newcomer's cursor: a soft "tink" as it lands on the button, then a plastic click + glossy pop on "dipencet"
    const tp = S.e07 + CUE.press07;
    blip(X, tp - 0.3, 1568, 0.03, 0.03, -0.3, 'sine');
    tick(X, tp - 0.02, 0.26, -0.3, 2600); tick(X, tp + 0.22, 0.14, -0.3, 3400);
    glide(X, tp, 0.09, 500, 1400, 0.05, -0.3, 'tri', V, 0.3);
    // the labels pop in on glossy marimba notes, then get scratched out as the gloss deflates
    [84, 88, 91].forEach((m, i) => marimba(X, S.e07 + CUE.tags07 + i * 0.28 + 0.12, m + 12, 0.2, 0.05, 0.3, V, 0.4));
    for (let i = 0; i < 3; i++) whoosh(X, TR.t4[0] + i * 0.07, 0.2, 5000, 1500, 0.025, 0.3, 0.3, 'fall', 2);
    tapeStop(B, M, TR.t4[0] + 0.05, TR.t4[1] - 0.1);
    // deflate: the air goes out of the gloss
    glide(X, TR.t4[0], TR.t4[1] - TR.t4[0], 900, 140, 0.05, 0, 'tri', V, 0.2);
    whoosh(X, TR.t4[0] + 0.05, 0.8, 4000, 400, 0.05, 0, 0, 'fall', 0.7);
  }
  // ----------------------------------------------------------------- 2015 — minimal plucks and snaps
  {
    const bpm = 104, beat = 60 / bpm, t0 = TR.t4[1] - 0.2, tEnd = TR.t5[0] + 0.5;
    const B = new Bus(), cps = capsOf('e15'), lift = cps[1].t0 + cps[1].beats[0][1]; // second page adds a light pulse
    const prog = [[48, 52, 55, 60, 64], [53, 57, 60, 65, 69], [45, 52, 57, 60, 64], [43, 50, 55, 59, 62]];
    const strum = (t, ch, up, g) => (up ? [...ch].reverse() : ch).slice(1).forEach((m, j) => pluck(B, t + j * 0.014, m + 12, beat * 0.9, g, (j - 2) * 0.12, V, 0.2, 0.996));
    for (let s = 0; ; s++) {
      const t = t0 + s * beat / 2; if (t >= tEnd) break;
      const barI = Math.floor(s / 8) % 4, e = s % 8, ch = prog[barI];
      if (e === 0 || e === 4) strum(t, ch, false, 0.05);
      if (e === 3 || e === 7) strum(t, ch, true, 0.035);
      if (e === 0) { kick(B, t, 0.3, { dec: 0.18 }); sub(B, t, ch[0] - 12, beat * 1.6, 0.1); }
      if (e === 2 || e === 6) snap(B, t, 0.13, 0.25, V, 0.35);
      if (t >= lift - 0.01) { shaker(B, t + beat / 4, 0.03, -0.35); if (e === 4) kick(B, t, 0.22, { dec: 0.15 }); }
    }
    fadeBus(B, TR.t5[0], TR.t5[0] + 0.5, 0);
    addBus(M, B);
    for (const cap of cps) {
      cap.beats.forEach(([, at]) => whoosh(X, cap.t0 + at, 0.16, 1800, 6000, 0.05, -0.6, 0, 'bell', 1.2));
      whoosh(X, cap.out, 0.2, 6000, 1800, 0.035, 0, 0.6, 'bell', 1.2);
    }
    // a finger that knows what it is doing: tap "Lihat Menu" (+ the page scrolls), tap a flat "Pesan" (+ it just works)
    const flatTap = (t) => { const s = sine(); play(X, t, 0.06, (x) => s(260 - 900 * x) * ex(x, 0.012), 0.16); tick(X, t, 0.07, 0.1, 5200); };
    const ta = S.e15 + CUE.tap15, tb = S.e15 + CUE.tap15b;
    flatTap(ta); whoosh(X, ta + 0.2, 0.85, 2200, 700, 0.035, 0.2, -0.2, 'bell', 0.9);
    flatTap(tb); pluck(X, tb + 0.12, 79, 0.3, 0.05, 0.2, V, 0.3); pluck(X, tb + 0.22, 84, 0.4, 0.05, 0.2, V, 0.3);
    // T5: the screen grows into the phone
    whoosh(X, TR.t5[0], TR.t5[1] - TR.t5[0], 250, 6000, 0.12, 0, 0, 'rise', 1.1, V, 0.3);
    glide(X, TR.t5[0] + 0.2, TR.t5[1] - TR.t5[0] - 0.2, 220, 880, 0.03, 0, 'sine', V, 0.3);
  }
  // ----------------------------------------------------------------- 2023 → closing — warm e-piano, then the brand
  {
    const bpm = 84, beat = 60 / bpm, t0 = TR.t5[1], bL = beat * 4;
    const u = (x) => S.close + x;
    const drumsOff = u(CUE.closeBeat2), chordsOff = u(5.0 + CUE.closeE);
    const prog = [[41, [57, 60, 64, 69]], [40, [55, 59, 62, 67]], [38, [53, 57, 60, 65]], [36, [52, 55, 59, 64]]];
    const B = new Bus(), lift = S.e23 + CUE.know23; // "…udah kenal kamu": an answering e-piano line joins
    for (let bI = 0; t0 + bI * bL < chordsOff; bI++) {
      const tb = t0 + bI * bL, [root, ch] = prog[bI % 4];
      const len = Math.min(bL, chordsOff - tb) + 0.4;
      ch.forEach((m, j) => epiano(B, tb + j * 0.012, m, len, 0.05, (j - 1.5) * 0.18, V, 0.35));
      epiano(B, tb + beat * 2.5, ch[3] + 12, beat, 0.025, 0.3, V, 0.5);
      [[1.5, ch[2]], [3.5, ch[1]]].forEach(([q, m]) => { const t = tb + beat * q; if (t >= lift && t < drumsOff) epiano(B, t, m + 12, beat * 0.8, 0.018, -0.3, V, 0.5); });
      sub(B, tb, root - 12 + 12, beat * 1.8, 0.14); sub(B, tb + beat * 2.5, root + 12 - 12, beat * 1.2, 0.1);
      for (let q = 0; q < 4; q++) {
        const tq = tb + q * beat; if (tq >= drumsOff) break;
        if (q === 0) kick(B, tq, 0.42, { dec: 0.25, p0: 120 });
        if (q === 2 && tq + beat / 2 < drumsOff) kick(B, tq + beat / 2, 0.3, { dec: 0.2, p0: 120 });
        if (q === 1 || q === 3) rim(B, tq, 0.12, 0.15, V, 0.4);
        shaker(B, tq + beat / 2, 0.035, -0.35);
      }
    }
    fadeBus(B, chordsOff - 0.6, chordsOff + 0.4, 0.15);
    addBus(M, B);
    // UI moments
    [0.15, 0.35, 0.5].forEach((d, j) => whoosh(X, S.e23 + d, 0.35, 900, 3000, 0.022, 0, 0, 'bell', 1));
    // the live queue ticks over, then what the page knows about you lights up, a soft chime each
    tick(X, S.e23 + CUE.queue23, 0.06, -0.3, 4600); blip(X, S.e23 + CUE.queue23 + 0.05, 1760, 0.04, 0.015, -0.3);
    [0, 0.2, 0.45, 0.7].forEach((d, i) => bell(X, lift + d, [84, 88, 91, 95][i], 0.4, 0.02, [0.4, -0.2, -0.3, 0.3][i], V, 0.6));
    const tt = S.e23 + CUE.tap23;
    { const s = sine(); play(X, tt, 0.1, (x) => s(180 - 400 * x) * ex(x, 0.02), 0.25); tick(X, tt, 0.14, 0, 5000); }
    fm(X, tt + 0.2, mtof(88), 0.35, 0.05, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.4 }, V, 0.5);
    fm(X, tt + 0.29, mtof(95), 0.6, 0.05, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.6 }, V, 0.5);
    // closing
    whoosh(X, u(0.02), 1.0, 3500, 350, 0.07, 0, 0, 'bell', 0.9, V, 0.2);
    for (let i = 0; i < 5; i++) { const p = i % 2 ? 0.45 : -0.45; whoosh(X, u(CUE.card(i)), 0.45, 500, 2600, 0.035, p * 1.6, p, 'bell', 1.1); tick(X, u(CUE.card(i) + 0.42), 0.05, p, 2800); }
    for (let j = 0; j < CUE.hops; j++) fm(X, u(CUE.hop(j)), mtof([72, 74, 76, 79, 81, 84][j]), 0.2, 0.05, j % 2 ? 0.4 : -0.4, { ratio: 2, index: 1, idec: 0.05, adec: 0.2 }, V, 0.4);
    pad(M, u(CUE.closeBeat2), [36, 43, 52, 59, 62], CUE.arrow[0] + 0.95 - CUE.closeBeat2, 0.045, 0, 1000, 0.8, 0.2, V, 0.5);
    whoosh(X, u(CUE.closeBeat2 + 0.4), CUE.arrow[0] - CUE.closeBeat2 + 0.5, 200, 7000, 0.07, 0, 0, 'rise', 1.3, V, 0.2);
    // the arrow flies, the eras get pulled in
    whoosh(X, u(CUE.arrow[0]), CUE.arrow[1] - CUE.arrow[0], 350, 5500, 0.14, -0.9, 0, 'bell', 0.9, V, 0.3);
    glide(X, u(CUE.arrow[0]), CUE.arrow[1] - CUE.arrow[0], 180, 720, 0.05, -0.5, 'saw', V, 0.2);
    whoosh(X, u(CUE.absorb(0)), CUE.land - CUE.absorb(0) - 0.05, 300, 2500, 0.08, 0, 0, 'suck', 1);
    // land: impact + the Beyond Studio ident chord
    const L = u(CUE.land);
    impact(X, L, 0.55, V, 0.25);
    crash(X, L, 0.07, 0, V, 0.5);
    [36, 48, 55, 64, 71, 74].forEach((m, j) => bell(M, L + j * 0.018, m, 3.4, [0.05, 0.05, 0.045, 0.04, 0.03, 0.028][j], (j - 2.5) * 0.15, V, 0.7));
    pad(M, L, [36, 43, 52, 59, 62], DURATION - L - 0.8, 0.06, 0, 1600, 0.05, 0.9, V, 0.6);
    whoosh(X, L + 0.02, 0.9, 2500, 300, 0.05, 0, 0, 'fall', 0.8, V, 0.4);
    [79, 84].forEach((m, j) => bell(X, u(CUE.wordmark) + j * 0.1, m + 12, 1.2, 0.03, 0.15, V, 0.8));
    // follow call to action: a soft pop as the pill lands, then the tap and a bright two-note "done"
    blip(X, u(CUE.cta + 0.1), 1175, 0.05, 0.03, 0, 'sine', V, 0.4);
    const tf = u(CUE.ctaTap);
    { const s = sine(); play(X, tf, 0.1, (x) => s(180 - 400 * x) * ex(x, 0.02), 0.2); tick(X, tf, 0.12, 0, 5000); }
    fm(X, tf + 0.18, mtof(84), 0.3, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.4 }, V, 0.5);
    fm(X, tf + 0.27, mtof(91), 0.6, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.6 }, V, 0.5);
  }
  // ----------------------------------------------------------------- global
  oddometerTicks(X);
  // reverb + mix
  const R = new Bus(); reverb(V, R, 1);
  return { M, X, R };
}

// ================================================================ master: HPF, glue, loudness, limiter
// The glue compressor's gain is computed from the *un-ducked* bed and applied to the ducked one, so the
// compressor can't pump the music back up under the narration (sidechain ducking after bus compression).
function hpf(b) { for (const ch of [b.L, b.R]) { const f = new SVF(28, 0.707); for (let i = 0; i < N; i++) { f.run(ch[i]); ch[i] = f.hp; } } }
function scaleTo(b, db) { const g = Math.pow(10, db / 20) / Math.max(activeRMS(b), 1e-9); for (let i = 0; i < N; i++) { b.L[i] *= g; b.R[i] *= g; } return g; }
function compGain(b) {
  const out = new Float32Array(N); let env = 0;
  const at = Math.exp(-1 / (0.01 * SR)), rl = Math.exp(-1 / (0.2 * SR)), th = Math.pow(10, -21 / 20), ratio = 2.2;
  for (let i = 0; i < N; i++) {
    const x = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i])); env = x > env ? at * env + (1 - at) * x : rl * env + (1 - rl) * x;
    out[i] = env > th ? Math.pow(env / th, 1 / ratio - 1) : 1;
  }
  return out;
}
function limiter(b) {
  const ceil = Math.pow(10, -1 / 20), la = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR));
  const need = new Float32Array(N);
  for (let i = 0; i < N; i++) { const x = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i])); need[i] = x > ceil ? ceil / x : 1; }
  const minA = new Float32Array(N), dq = new Int32Array(N); let h = 0, t = 0; // sliding min over [i, i+la]
  for (let i = N - 1; i >= 0; i--) { while (t > h && need[dq[t - 1]] >= need[i]) t--; dq[t++] = i; while (dq[h] > i + la) h++; minA[i] = need[dq[h]]; }
  let g = 1;
  for (let i = 0; i < N; i++) { const target = minA[i]; g = target < g ? target : rel * g + (1 - rel) * target; if (g > target) g = target; b.L[i] *= g; b.R[i] *= g; }
}
function edges(b) {
  const fi = Math.round(0.004 * SR), fo = Math.round(0.5 * SR);
  for (let i = 0; i < fi; i++) { b.L[i] *= i / fi; b.R[i] *= i / fi; }
  for (let i = 0; i < fo; i++) { const j = N - 1 - i, g = i / fo; b.L[j] *= g; b.R[j] *= g; }
}
export const STATS = {};
function spanEnergy(b, lines) { let e = 0; for (const p of lines) for (let i = Math.round((p.start + 0.1) * SR); i < Math.min(N, Math.round((p.start + p.dur - 0.1) * SR)); i++) e += b.L[i] * b.L[i] + b.R[i] * b.R[i]; return e; }
function master({ M, X, R }, vo) {
  const lines = VO_PLACE.filter((p) => vo[p.id]);
  const bed = new Bus();
  addBus(bed, M, 0.9); addBus(bed, X, 1); addBus(bed, R, 1);
  hpf(bed);
  const pre = scaleTo(bed, -20);
  const gc = compGain(bed);
  if (lines.length) {
    // rebuild the bed ducked, at the same pre-gain, then apply the un-ducked compressor gain
    const d = duckCurve(lines), hb = new Bus();
    for (let i = 0; i < N; i++) {
      const gm = (1 - VO_DUCK_MUSIC * d[i]) * 0.9, gx = 1 - VO_DUCK_SFX * d[i];
      hb.L[i] = M.L[i] * gm + X.L[i] * gx + R.L[i] * gm; hb.R[i] = M.R[i] * gm + X.R[i] * gx + R.R[i] * gm;
    }
    hpf(hb);
    for (let i = 0; i < N; i++) { const g = pre * gc[i]; bed.L[i] = hb.L[i] * g; bed.R[i] = hb.R[i] * g; }
    const before = spanEnergy(bed, lines);
    addVoice(bed, vo, lines, Math.pow(10, -20 / 20) * Math.pow(10, VO_OVER_MIX_DB / 20));
    const after = spanEnergy(bed, lines);
    STATS.voiceOverBedDb = 10 * Math.log10(Math.max(after - before, 1e-12) / Math.max(before, 1e-12)); // voice and bed are uncorrelated
  } else for (let i = 0; i < N; i++) { bed.L[i] *= gc[i]; bed.R[i] *= gc[i]; }
  scaleTo(bed, -15.5);
  limiter(bed);
  edges(bed);
  return bed;
}

// vo: { '<id>': { data: Float32Array (mono, 48 kHz), lead: seconds of silence before speech, dur } }
export function renderAudio({ vo = {} } = {}) {
  N = Math.ceil(DURATION * SR); phSeed = 0;
  const b = master(score(vo), vo);
  return { sr: SR, L: b.L, R: b.R, duration: DURATION };
}

// 16-bit PCM WAV with deterministic TPDF dither
export function toWav({ sr, L, R }) {
  const n = L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    const d1 = hash(i, 11) - hash(i, 12), d2 = hash(i, 13) - hash(i, 14);
    v.setInt16(44 + i * 4, clamp(Math.round(L[i] * 32767 + d1), -32768, 32767), true);
    v.setInt16(46 + i * 4, clamp(Math.round(R[i] * 32767 + d2), -32768, 32767), true);
  }
  return new Uint8Array(buf);
}
