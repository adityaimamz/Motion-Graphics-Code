// audio.js — the soundtrack, synthesised from the same timeline as the pictures. DSP primitives, reverb, ducking and
// master copied from vibe-engineer/src/audio.js (no cross-folder import). renderAudio() → { sr, L, R }.
// Pure function: randomness only from hash(), no clock.
// Music: a soft 128 BPM groove in F major written for this film (felt EP stabs, warm pad, round sub, soft kit). It
// follows the scenes: dark hum on the comment, light plucks after the iris, groove through the chapters, a breakdown
// for "frame = f(t)", dark pad for the five rules, the brand chord for the closing. SFX come from timeline.SFX.
import { S, SFX, DURATION, VO_PLACE, BEAT, CUE } from './timeline.js';
import { hash, clamp, lerp, typeTimes } from './core.js';

export const SR = 48000;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let N = 0;

// ================================================================ DSP primitives (from vibe-engineer)
class Bus { constructor() { this.L = new Float32Array(N); this.R = new Float32Array(N); } }
const wn = (k, seed) => hash(k, seed) * 2 - 1;
function panGains(p) { const a = (clamp(p, -1, 1) + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }
function play(bus, t0, dur, gen, gain = 1, pan = 0, send = null, sendAmt = 0) {
  const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
  let [gl, gr] = panGains(typeof pan === 'number' ? pan : 0);
  const dyn = typeof pan === 'function';
  for (let k = 0; k < n; k++) {
    const i = i0 + k; if (i >= N) break;
    const tt = k / SR, v = gen(tt, k);
    if (i < 0) continue;
    if (dyn && (k & 63) === 0) [gl, gr] = panGains(pan(tt));
    const l = v * gl * gain, r = v * gr * gain;
    bus.L[i] += l; bus.R[i] += r;
    if (send) { send.L[i] += l * sendAmt; send.R[i] += r * sendAmt; }
  }
}
class SVF {
  constructor(fc = 1000, q = 0.707) { this.s1 = 0; this.s2 = 0; this.set(fc, q); }
  set(fc, q = this.q) { this.q = q; const g = Math.tan(Math.PI * Math.min(Math.max(fc, 10), SR * 0.45) / SR), k = 1 / q; this.k = k; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; }
  run(x) { const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3; this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2; return v2; }
}
const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
function saw() { let ph = 0; return (f) => { const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1; return 2 * ph - 1 - blep(ph, dt); }; }
function sine(p0 = 0) { let ph = p0; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return Math.sin(TAU * ph); }; }
function tri() { let ph = 0.25; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return 4 * Math.abs(ph - 0.5) - 1; }; }
const ad = (tt, a, dur, r) => (tt < a ? tt / a : tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / r));
const ex = (tt, tau) => Math.exp(-tt / tau);

function fm(b, t, freq, dur, g, pan, o = {}, send, sa) {
  const { ratio = 1, index = 2, idec = 0.4, adec = 1.2, rel = 0.12, att = 0.002 } = o;
  let cp = 0, mp = 0;
  play(b, t, dur + rel, (tt) => { mp += freq * ratio / SR; cp += freq / SR; const mod = index * ex(tt, idec) * Math.sin(TAU * mp); return Math.sin(TAU * cp + mod) * (tt < att ? tt / att : ex(tt - att, adec)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / rel)); }, g, pan, send, sa);
}
const bell = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 3.5, index: 2.4, idec: 0.9, adec: dur * 0.5, rel: 0.2 }, send, sa);
const chime = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 2, index: 0.8, idec: 0.1, adec: dur * 0.6 }, send, sa);
// felt electric piano: two FM operators (body + soft tine)
function ep(b, t, m, dur, g, pan, send, sa) {
  const f = mtof(m);
  fm(b, t, f, dur, g, pan, { ratio: 1, index: 1.1, idec: 0.25, adec: 0.9, rel: 0.18, att: 0.004 }, send, sa);
  fm(b, t, f, dur * 0.6, g * 0.18, pan, { ratio: 14, index: 0.6, idec: 0.05, adec: 0.12, rel: 0.05 }, send, sa);
}
function pad(b, t, notes, dur, g, pan = 0, fc = 1200, att = 0.4, rel = 0.6, send, sa) {
  const oscs = notes.map((m, j) => [j % 2 ? tri() : saw(), mtof(m) * (j % 2 ? 0.997 : 1.003)]), f = new SVF(fc, 0.6);
  play(b, t, dur + rel, (tt) => { let v = 0; for (const [o, fq] of oscs) v += o(fq); return f.run(v / oscs.length) * ad(tt, att, dur, rel); }, g, pan, send, sa);
}
function sub(b, t, m, dur, g) { const s = sine(), f0 = mtof(m); play(b, t, dur + 0.03, (tt) => Math.tanh(1.6 * s(f0)) * ad(tt, 0.008, dur, 0.03) * 0.8, g, 0); }
function pluck(b, t, m, g, pan = 0, send, sa) { const o = tri(), s = sine(), f = mtof(m); play(b, t, 0.5, (tt) => (0.6 * o(f) + 0.4 * s(f * 2)) * ex(tt, 0.12) * (tt < 0.003 ? tt / 0.003 : 1), g, pan, send, sa); }
function kick(b, t, g = 1) { const s = sine(); play(b, t, 0.5, (tt, k) => s(46 + 90 * ex(tt, 0.035)) * ex(tt, 0.2) + 0.08 * wn(k, 3) * ex(tt, 0.002), g); }
function clap(b, t, g = 1, send, sa) { const f = new SVF(1500, 0.9), seed = Math.round(t * 997); play(b, t, 0.3, (tt, k) => { const e = tt < 0.03 ? (Math.floor(tt / 0.01) % 2 ? 0.6 : 1) * ex(tt % 0.01, 0.004) : ex(tt - 0.03, 0.07); return (f.run(wn(k, seed)), f.bp) * e * 1.8; }, g, 0.05, send, sa); }
function hat(b, t, g = 1, pan = 0, open = false) { const f = new SVF(9000, 0.9), seed = Math.round(t * 1013); play(b, t, open ? 0.25 : 0.05, (tt, k) => (f.run(wn(k, seed)), f.hp) * ex(tt, open ? 0.07 : 0.014), g, pan); }
function shaker(b, t, g = 1, pan = 0) { const f = new SVF(6500, 1.2), seed = Math.round(t * 1777); play(b, t, 0.07, (tt, k) => (f.run(wn(k, seed)), f.bp) * Math.sin(Math.PI * Math.min(1, tt / 0.07)), g, pan); }
function blip(b, t, freq, dur, g = 1, pan = 0, send, sa) { const o = sine(); play(b, t, dur + 0.02, (tt) => o(freq) * (tt < 0.002 ? tt / 0.002 : ex(tt, dur * 0.4)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.02)), g, pan, send, sa); }
function noise(b, t, dur, fc, q, g, pan = 0, env = (x) => Math.sin(Math.PI * x), send, sa) {
  const f = new SVF(fc, q), seed = Math.round(t * 4001 + fc);
  play(b, t, dur, (tt, k) => (f.run(wn(k, seed)), f.bp) * env(tt / dur) * 1.4, g, pan, send, sa);
}
function whoosh(b, t, dur, f0, f1, g, pan0 = 0, pan1 = 0, shape = 'bell', send, sa) {
  const f = new SVF(f0, 1.1), seed = Math.round(t * 4001 + f0);
  const env = shape === 'rise' ? (x) => x * x * x : shape === 'fall' ? (x) => (1 - x) * (1 - x) : (x) => Math.pow(Math.sin(Math.PI * x), 1.4);
  play(b, t, dur, (tt, k) => { const x = tt / dur; if ((k & 15) === 0) f.set(f0 * Math.pow(f1 / f0, x), 1.1); f.run(wn(k, seed)); return f.bp * env(x) * 1.6; }, g, (tt) => lerp(pan0, pan1, tt / dur), send, sa);
}
function glide(b, t, dur, f0, f1, g, pan = 0, send, sa) { const o = sine(); play(b, t, dur, (tt) => o(f0 * Math.pow(f1 / f0, tt / dur)) * Math.sin(Math.PI * Math.min(1, tt / dur)) ** 0.7, g, pan, send, sa); }
function impact(b, t, g, send, sa) { const s = sine(), f = new SVF(900, 0.7), seed = Math.round(t * 6007); play(b, t, 2.2, (tt, k) => s(34 + 30 * ex(tt, 0.25)) * ex(tt, 0.9) * 1.1 + (f.run(wn(k, seed)), f.lp) * ex(tt, 0.12) * 1.4, g, 0, send, sa); }
// UI sounds
function click(b, t, g = 1, pan = 0, f = 3200) { blip(b, t, f, 0.012, g, pan); noise(b, t, 0.018, 5000, 2, g * 0.5, pan, (x) => 1 - x); }
function pop(b, t, g = 1, pan = 0, f = 620, send, sa) { const s = sine(); play(b, t, 0.16, (tt) => s(f * (1 + 1.4 * ex(tt, 0.018))) * ex(tt, 0.05), g, pan, send, sa); }
function softThud(b, t, g = 1, f = 120) { const s = sine(); play(b, t, 0.3, (tt) => s(f * (1 + 0.6 * ex(tt, 0.015))) * ex(tt, 0.07), g, 0); }

// ================================================================ effects
function reverb(send, out, wet = 1) {
  const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  for (const [src, dst, spread] of [[send.L, out.L, 0], [send.R, out.R, 23]]) {
    const cb = combs.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0, f: 0 })), ab = aps.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = src[n] * 0.015; let y = 0;
      for (const c of cb) { const o = c.b[c.i]; c.f = o * 0.7 + c.f * 0.3; c.b[c.i] = x + c.f * 0.86; if (++c.i >= c.b.length) c.i = 0; y += o; }
      for (const a of ab) { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; y = o - y; if (++a.i >= a.b.length) a.i = 0; }
      dst[n] += y * wet;
    }
  }
}
function addBus(dst, src, g = 1) { for (let i = 0; i < N; i++) { dst.L[i] += src.L[i] * g; dst.R[i] += src.R[i] * g; } }
function lowpassBus(b, fc) { for (const ch of [b.L, b.R]) { const f = new SVF(fc, 0.6); for (let i = 0; i < N; i++) ch[i] = f.run(ch[i]); } }
// side-chain style pump on the music bus, from the kick times
function pump(b, kicks, depth = 0.35) {
  const env = new Float32Array(N).fill(1);
  for (const k of kicks) { const i0 = Math.round(k * SR), n = Math.round(0.28 * SR); for (let j = 0; j < n && i0 + j < N; j++) if (i0 + j >= 0) { const x = j / n, g = 1 - depth * Math.pow(1 - x, 2); if (g < env[i0 + j]) env[i0 + j] = g; } }
  for (let i = 0; i < N; i++) { b.L[i] *= env[i]; b.R[i] *= env[i]; }
}

// ================================================================ the score
const CH = [[53, 57, 60, 64, 67], [57, 60, 64, 67, 71], [50, 53, 57, 60, 64], [46, 50, 53, 57, 64]]; // Fmaj9, Am7(9), Dm9, Bbmaj7(#11-ish)
const BAR = BEAT * 4;
const barAt = (t) => Math.floor(t / BAR + 1e-6);
// EP comp pattern in eighths (bar of 8): hits on 0, 3, 6 — syncopated, soft
const COMP = [0, 3, 6];
const MOTIF = [[0, 72], [3, 76], [6, 79], [8, 77], [11, 76], [14, 72]]; // 16ths over one bar, a little hook

function groove(M, V, K, t0, t1, o = {}) {
  for (let b = Math.ceil(t0 / BAR - 1e-6); b * BAR < t1 - 0.01; b++) {
    const tb = b * BAR, ch = CH[((b % 4) + 4) % 4];
    if (o.pad) pad(M, tb, ch.slice(0, 4), Math.min(BAR, t1 - tb), o.pad, 0, o.padFc ?? 1400, 0.25, 0.5, V, 0.5);
    if (o.ep) for (const e of COMP) { const t = tb + e * BEAT / 2; if (t >= t1) break; ch.slice(1, 5).forEach((m, j) => ep(M, t, m, BEAT * 0.9, o.ep, (j - 1.5) * 0.25, V, 0.3)); }
    if (o.bass) for (const [e, len] of [[0, 1.6], [3, 0.8], [6, 1.6]]) { const t = tb + e * BEAT / 2; if (t >= t1) break; sub(M, t, ch[0] - 12, len * BEAT / 2 * 0.9, o.bass); }
    if (o.motif) for (const [s16, m] of MOTIF) { const t = tb + s16 * BEAT / 4; if (t >= t1) break; pluck(M, t, m + (b % 2 ? 0 : -2), o.motif, (s16 % 2 ? 0.3 : -0.3), V, 0.35); }
    for (let q = 0; q < 4; q++) {
      const t = tb + q * BEAT; if (t >= t1) break;
      if (o.kick) { kick(M, t, o.kick); K.push(t); }
      if (o.clap && q % 2 === 1) clap(M, t, o.clap, V, 0.2);
      if (o.hat) hat(M, t + BEAT / 2, o.hat, 0.2);
      if (o.shaker) for (const s of [0.25, 0.75]) shaker(M, t + s * BEAT, o.shaker, -0.3);
    }
  }
}

// a real clip's own sound (the first video's chiptune + SFX), placed at t0, with short fades; it rides the music bus
// so the narrator ducks it like the music
// o.speaker: band-limit to a phone speaker (≈ 380 Hz – 5.2 kHz); o.fade = [from, length] in seconds after t0: fade out.
// (The clip files are the first video's music + effects WITHOUT its narrator, see tools/ambil-klip-audio.mjs.)
function clipSound(b, x, t0, dur, g, from = 0, o = {}) {
  if (!x) return;
  const a = Math.round(from * SR), n = Math.min(Math.round(dur * SR), x.length - a), f = Math.round(0.02 * SR), i0 = Math.round(t0 * SR);
  const hp = o.speaker ? new SVF(380, 0.7) : null, lp = o.speaker ? new SVF(5200, 0.7) : null;
  for (let k = 0; k < n; k++) {
    let v = x[a + k];
    if (hp) { hp.run(v); lp.run(hp.hp); v = lp.lp; }
    const i = i0 + k; if (i < 0 || i >= N) continue;
    const fo = o.fade ? 1 - clamp((k / SR - o.fade[0]) / o.fade[1]) : 1, w = Math.min(1, k / f, (n - 1 - k) / f) * fo * fo;
    v *= g * w; b.L[i] += v; b.R[i] += v;
  }
}
let CLIPS = {};

function score() {
  const M = new Bus(), X = new Bus(), V = new Bus(), K = [];
  // ---- the S2 reel plays quietly under everything
  for (const [name, a, b] of CUE.kode.reel) clipSound(M, CLIPS[name], a, b - a, 0.24);
  const sc = (id) => S[id];
  // ---- S1 komentar: a dark hum, tension into the iris, then light
  {
    const s = sc('komentar'), iris = S.kode.t0 - 1.1;
    pad(M, 0, [41, 48, 53], s.t1, 0.05, 0, 500, 0.4, 0.4, V, 0.4);
    // light: plucks + pad after the iris, no drums yet (S2)
  }
  const kode = sc('kode');
  groove(M, V, K, kode.t0 - BEAT, kode.t1, { pad: 0.03, ep: 0.022, motif: 0.016 });
  // ---- S3 → S7: the groove
  groove(M, V, K, S.urutan.t0, S.storyboard.t1, { pad: 0.022, ep: 0.024, bass: 0.16, kick: 0.32, clap: 0.06, hat: 0.03 });
  // ---- S8 kunci: breakdown (room for the formula)
  groove(M, V, K, S.kunci.t0, S.kunci.t1, { pad: 0.034, ep: 0.02, padFc: 900 });
  // ---- S9 → S10: groove back, a little denser
  groove(M, V, K, S.suara.t0, S.cek.t1, { pad: 0.022, ep: 0.024, bass: 0.17, kick: 0.34, clap: 0.06, hat: 0.03, shaker: 0.018, motif: 0.012 });
  // ---- the real chiptune of the first video's ending plays quietly from the phone (S11)
  clipSound(M, CLIPS.hp, CUE.lima.clip, 7.4, 0.2, 0, { speaker: true, fade: [CUE.lima.push - CUE.lima.clip - 0.15, 0.8] });
  // ---- S11 lima: dark pad, a low pulse on every beat
  { const s = sc('lima'); pad(M, s.t0, [38, 45, 50, 53, 57], s.len, 0.05, 0, 700, 0.05, 0.6, V, 0.6);
    for (let t = s.t0; t < s.t1; t += BEAT) sub(M, t, 38, BEAT * 0.5, 0.09); }

  // ---- one-shots scheduled by the pictures
  for (const [t, kind, o = {}] of SFX) {
    switch (kind) {
      case 'bubble': pop(X, t, 0.22, 0, 520); blip(X, t + 0.05, 1320, 0.05, 0.05, 0); break;
      case 'marker': noise(X, t, 0.4, 2600, 1.4, 0.05, -0.2, (x) => Math.sin(Math.PI * x)); break;
      case 'select': for (let k = 0; k < 6; k++) click(X, t + k * 0.09, 0.05, -0.1 + k * 0.05, 2600 + k * 120); break;
      case 'dock': whoosh(X, t, 0.5, 300, 1600, 0.05, 0, 0, 'rise'); break;
      case 'flyText': whoosh(X, t, 0.75, 1800, 500, 0.08, 0.1, -0.2, 'bell', V, 0.2); break;
      case 'land': softThud(X, t, 0.12, 170); click(X, t, 0.06); break;
      case 'send': click(X, t, 0.18, 0.4, 2400); pop(X, t + 0.02, 0.12, 0.4, 900); break;
      case 'iris':
        whoosh(X, t - 0.25, 1.0, 200, 5000, 0.11, 0.4, 0, 'bell', V, 0.3);
        [65, 69, 72, 76, 79].forEach((m, i) => chime(X, t + 0.55 + i * 0.03, m, 1.6, 0.03, (i - 2) * 0.25, V, 0.6));
        softThud(X, t + 0.6, 0.16, 70); break;
      case 'card': whoosh(X, t, 0.5, 400, 1400, 0.045, 0, 0); break;
      case 'wordIn': whoosh(X, t, 0.35, 2000, 4000, 0.03, -0.2, 0.2); break;
      case 'pill': pop(X, t, 0.14, 0.2, 700); break;
      case 'swap': whoosh(X, t - 0.03, 0.26, 5000, 1500, 0.07, 0, 0); click(X, t + 0.12, 0.05, 0); break;
      case 'flip': whoosh(X, t, 0.6, 600, 2400, 0.06, -0.3, 0.3); noise(X, t + 0.3, 0.12, 3000, 1.5, 0.03, 0.2); break;
      case 'widen': whoosh(X, t, 0.62, 450, 3200, 0.06, -0.45, 0.45); softThud(X, t + 0.5, 0.08, 140); break;
      case 'tile': pop(X, t, 0.12, -0.5 + o.i * 0.5, mtof(72 + o.i * 4)); break;
      case 'collapse': whoosh(X, t, 0.5, 800, 4000, 0.05, -0.2, 0.7, 'rise'); break;
      case 'ring': noise(X, t, 1.0, 6500, 2, 0.02, 0, (x) => Math.sin(Math.PI * x), V, 0.5); break;
      case 'arrow': whoosh(X, t, 0.78, 350, 5500, 0.12, -0.9, 0, 'bell', V, 0.3); glide(X, t, 0.78, 180, 720, 0.035, -0.5); break;
      case 'lock':
        impact(X, t, 0.5, V, 0.25);
        [41, 53, 60, 69, 76, 79].forEach((m, j) => bell(M, t + j * 0.018, m, 3.4, [0.05, 0.05, 0.045, 0.04, 0.03, 0.028][j], (j - 2.5) * 0.15, V, 0.7));
        pad(M, t, [41, 48, 57, 64, 67], DURATION - t - 0.6, 0.05, 0, 1500, 0.05, 0.8, V, 0.6); break;
      case 'wordmark': [84, 89].forEach((m, j) => bell(X, t + j * 0.1, m + 12, 1.2, 0.03, 0.15, V, 0.8)); break;
      case 'pop': pop(X, t, 0.14, 0, 760, V, 0.2); break;
      case 'pop2': pop(X, t, 0.1, 0.15, 880, V, 0.2); break;
      case 'tap': click(X, t, 0.16, 0, 2200); fm(X, t + 0.12, mtof(84), 0.3, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.4 }, V, 0.5); fm(X, t + 0.21, mtof(91), 0.6, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.6 }, V, 0.5); break;
      case 'pulse': chime(X, t, 88, 0.8, 0.03, 0.2, V, 0.6); break;
      case 'railTurn': whoosh(X, t, 0.9, 400, 2400, 0.07, 0.8, -0.5, 'bell', V, 0.3); break;
      case 'rule': { const m = [72, 76, 79, 83, 88][o.i ?? 0]; ep(X, t, m, 0.5, 0.045, (o.i - 2) * 0.2, V, 0.4); chime(X, t, m + 12, 0.8, 0.02, (o.i - 2) * 0.2, V, 0.5); break; }
      case 'link': whoosh(X, t, 0.4, 900, 3000, 0.03, -0.3, 0.3, 'bell'); break;
      case 'dive': whoosh(X, t, 0.8, 200, 3000, 0.1, 0, 0, 'rise', V, 0.2); glide(X, t, 0.8, 73.4, 146.8, 0.05, 0, V, 0.2); break; // D2 → D3, the key of S11's pad
      case 'shutter': click(X, t, 0.07, -0.5 + ((o.i ?? 0) % 6) * 0.2, 3600); noise(X, t, 0.04, 5200, 1.5, 0.04, -0.5 + ((o.i ?? 0) % 6) * 0.2, (x) => 1 - x); break;
      case 'sweep': whoosh(X, t, 2.0, 700, 2400, 0.03, -0.5, 0.5, 'bell'); break;
      case 'pin': softThud(X, t, 0.14, 150); click(X, t + 0.01, 0.1, 0.2, 2600); break;
      case 'bell': [76, 83, 88].forEach((m, j) => bell(X, t + j * 0.08, m, 1.6, 0.03, (j - 1) * 0.2, V, 0.7)); break;
      case 'lights': whoosh(X, t, 0.9, 3500, 150, 0.08, 0.7, 0, 'fall', V, 0.3); softThud(X, t + 0.7, 0.14, 62); break;
      case 'lift': whoosh(X, t, 0.8, 300, 2600, 0.07, 0, 0, 'rise', V, 0.25); pop(X, t + 0.78, 0.1, 0, 520, V, 0.3); break;
      case 'jump': click(X, t, 0.12, 0.1, 3000); blip(X, t + 0.005, 2200, 0.05, 0.04, 0.1); break;
      case 'slide': whoosh(X, t, 0.5, 500, 2200, 0.05, -0.4, 0.4, 'bell'); break;
      case 'pass': [72, 76, 79, 84].forEach((m, j) => chime(X, t + j * 0.06, m, 1.2, 0.03, (j - 1.5) * 0.2, V, 0.6)); break;
      case 'snip': click(X, t, 0.14, 0, 4200); noise(X, t + 0.01, 0.05, 6500, 2, 0.06, 0, (x) => 1 - x); break;
      case 'snap': click(X, t, 0.12, -0.3 + (o.i ?? 0) * 0.15, 2000); pop(X, t + 0.005, 0.07, -0.3 + (o.i ?? 0) * 0.15, mtof(64 + (o.i ?? 0) * 3)); break;
      case 'paper': noise(X, t, 0.3, 3400, 0.9, 0.05, 0.15, (x) => Math.sin(Math.PI * x) ** 2); softThud(X, t + 0.22, 0.05, 150); break;
      case 'sel': click(X, t, 0.09, 0, 2800); blip(X, t + 0.01, 1900, 0.03, 0.03, 0); break;
      case 'tick': click(X, t, 0.07, (o.i % 2 ? 0.2 : -0.2), 2200 + (o.i ?? 0) * 140); break;
      case 'stamp': softThud(X, t, 0.22, 95); noise(X, t, 0.07, 1800, 1.2, 0.07, 0, (x) => 1 - x); break;
      case 'scroll': noise(X, t, 1.0, 2600, 0.8, 0.06, 0, (x) => Math.sin(Math.PI * x) ** 1.3); whoosh(X, t, 1.0, 600, 3000, 0.035, -0.2, 0.2, 'bell'); break;
      case 'chime': [79, 83, 88].forEach((m, j) => chime(X, t + j * 0.07, m, 0.9, 0.03, 0.15 * (j - 1), V, 0.5)); break;
      case 'buzz': { const s = sine(), f = new SVF(1400, 0.8); play(X, t, 0.22, (tt, k) => (f.run(s(150) > 0 ? 1 : -1), f.lp) * (tt < 0.01 ? tt / 0.01 : ex(tt, 0.1)) * 0.6, 0.07, 0); break; }
      case 'strike': whoosh(X, t, 0.34, 700, 3200, 0.06, -0.5, 0.5, 'rise'); click(X, t + 0.33, 0.07, 0.4, 2000); break;
      case 'chipIn': click(X, t, 0.07, -0.3 + o.i * 0.1, 1800 + o.i * 150); pop(X, t + 0.01, 0.06, -0.3 + o.i * 0.1, mtof(60 + [0, 2, 4, 7, 9, 12, 14][o.i ?? 0]), V, 0.15); break;
      case 'check': pop(X, t, 0.08, 0.2, mtof(79 + (o.i ?? 0) * 2)); chime(X, t + 0.02, 84 + (o.i ?? 0) * 2, 0.5, 0.025, 0.2, V, 0.4); break;
      case 'enter': click(X, t, 0.14, 0.2, 1500); softThud(X, t + 0.01, 0.1, 110); break;
      case 'type': {
        // one soft key per character, on the same uneven rhythm as the picture (core.typeTimes); the space bar is lower
        const at = o.text ? typeTimes(o.text, o.cps) : Array.from({ length: o.n }, (_, k) => k / o.cps), g = 0.04 * (o.g ?? 1);
        at.forEach((dt, k) => {
          const sp = o.text && o.text[k] === ' ', pan = (hash(k, 42) - 0.5) * 0.3;
          noise(X, t + dt, sp ? 0.03 : 0.02, sp ? 1400 + hash(k, 41) * 400 : 3500 + hash(k, 41) * 2500, 2.5, g * (sp ? 0.8 : 0.85 + 0.3 * hash(k, 43)), pan, (x) => 1 - x);
        });
        break;
      }
      default: break;
    }
  }
  pump(M, K, 0.3);
  lowpassBus(M, 9000);
  const R = new Bus(); reverb(V, R, 1);
  return { M, X, R };
}

// ================================================================ voice-over: ducking + placement (from vibe-engineer)
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
      const w = Math.min(1, k / f, (x.length - 1 - k) / f), v = x[k] * g * w * 0.85; OUT.L[i] += v; OUT.R[i] += v;
    }
  }
}
// ================================================================ master: HPF, glue, loudness, limiter (from vibe-engineer)
function hpf(b) { for (const ch of [b.L, b.R]) { const f = new SVF(28, 0.707); for (let i = 0; i < N; i++) { f.run(ch[i]); ch[i] = f.hp; } } }
function scaleTo(b, db) { const g = Math.pow(10, db / 20) / Math.max(activeRMS(b), 1e-9); for (let i = 0; i < N; i++) { b.L[i] *= g; b.R[i] *= g; } return g; }
function compGain(b) {
  const out = new Float32Array(N); let env = 0;
  const at = Math.exp(-1 / (0.01 * SR)), rl = Math.exp(-1 / (0.2 * SR)), th = Math.pow(10, -21 / 20), ratio = 2.2;
  for (let i = 0; i < N; i++) { const x = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i])); env = x > env ? at * env + (1 - at) * x : rl * env + (1 - rl) * x; out[i] = env > th ? Math.pow(env / th, 1 / ratio - 1) : 1; }
  return out;
}
function limiter(b) {
  const ceil = Math.pow(10, -1.6 / 20), la = Math.round(0.005 * SR), rel = Math.exp(-1 / (0.08 * SR)), need = new Float32Array(N);
  for (let i = 0; i < N; i++) { const x = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i])); need[i] = x > ceil ? ceil / x : 1; }
  const minA = new Float32Array(N), dq = new Int32Array(N); let h = 0, t = 0;
  for (let i = N - 1; i >= 0; i--) { while (t > h && need[dq[t - 1]] >= need[i]) t--; dq[t++] = i; while (dq[h] > i + la) h++; minA[i] = need[dq[h]]; }
  let g = 1;
  for (let i = 0; i < N; i++) { const target = minA[i]; g = target < g ? target : rel * g + (1 - rel) * target; if (g > target) g = target; b.L[i] *= g; b.R[i] *= g; }
}
function edges(b) {
  const fi = Math.round(0.004 * SR), fo = Math.round(0.4 * SR);
  for (let i = 0; i < fi; i++) { b.L[i] *= i / fi; b.R[i] *= i / fi; }
  for (let i = 0; i < fo; i++) { const j = N - 1 - i, g = i / fo; b.L[j] *= g; b.R[j] *= g; }
}
function master({ M, X, R }, vo) {
  const lines = VO_PLACE.filter((p) => vo[p.id]);
  const bed = new Bus();
  addBus(bed, M, 0.9); addBus(bed, X, 1); addBus(bed, R, 1);
  hpf(bed);
  const pre = scaleTo(bed, -20), gc = compGain(bed);
  if (lines.length) {
    const d = duckCurve(lines), hb = new Bus();
    for (let i = 0; i < N; i++) {
      const gm = (1 - VO_DUCK_MUSIC * d[i]) * 0.9, gx = 1 - VO_DUCK_SFX * d[i];
      hb.L[i] = M.L[i] * gm + X.L[i] * gx + R.L[i] * gm; hb.R[i] = M.R[i] * gm + X.R[i] * gx + R.R[i] * gm;
    }
    hpf(hb);
    for (let i = 0; i < N; i++) { const g = pre * gc[i]; bed.L[i] = hb.L[i] * g; bed.R[i] = hb.R[i] * g; }
    addVoice(bed, vo, lines, Math.pow(10, -20 / 20) * Math.pow(10, VO_OVER_MIX_DB / 20));
  } else for (let i = 0; i < N; i++) { bed.L[i] *= gc[i]; bed.R[i] *= gc[i]; }
  scaleTo(bed, -15.5);
  limiter(bed);
  edges(bed);
  return bed;
}

// vo: { '<id>': { data: Float32Array (mono, 48 kHz), lead, dur } }
// clips: { '<clip name>': Float32Array mono 48 kHz } (assets/ve/klip/*.wav)
export function renderAudio({ vo = {}, clips = {} } = {}) {
  N = Math.ceil(DURATION * SR); CLIPS = clips;
  const b = master(score(), vo);
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
