// audio.js — the soundtrack, synthesised from the same timeline as the pictures (DSP pattern copied from
// evolusi-layar/src/audio.js). renderAudio() → { sr, L, R }. Pure function: randomness only from hash(), no clock.
// Music: one theme for Bayu (4 bars, written for this film) that changes with the story — lazy & swung at sunset,
// minor at midnight, a fanfare at the rank-up, battle tempo against the kraken, full major at dawn. Warm chiptune:
// pulse + triangle + noise, softened (low-pass, slight wow). SFX follow the CUEs. VO ducks music −11 dB, SFX −5 dB.
import { S, CUE, ACTS, DURATION, VO_PLACE, BPM, SLOT_AT, TRANS } from './timeline.js';
import { hash, clamp, lerp } from './core.js';

export const SR = 48000;
const TAU = Math.PI * 2;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let N = 0;

// ================================================================ DSP primitives
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
function sqr() { let ph = 0; return (f, pw = 0.5) => { const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1; let v = ph < pw ? 1 : -1; v += blep(ph, dt); v -= blep((ph - pw + 1) % 1, dt); return v; }; }
function saw() { let ph = 0; return (f) => { const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1; return 2 * ph - 1 - blep(ph, dt); }; }
function sine(p0 = 0) { let ph = p0; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return Math.sin(TAU * ph); }; }
function tri() { let ph = 0.25; return (f) => { ph += f / SR; if (ph >= 1) ph -= 1; return 4 * Math.abs(ph - 0.5) - 1; }; }
const ad = (tt, a, dur, r) => (tt < a ? tt / a : tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / r));
const ex = (tt, tau) => Math.exp(-tt / tau);
// slow tape wow shared by all music voices (absolute time → pitch factor)
const wow = (tabs) => 1 + 0.0025 * Math.sin(TAU * 0.6 * tabs) + 0.0012 * Math.sin(TAU * 3.1 * tabs);

// ================================================================ instruments
function pulse(b, t, m, dur, g, pan = 0, o = {}, send, sa) { // chip lead / chords
  const { duty = 0.25, vib = 0.004, att = 0.006, dec = 0.18, sus = 0.6, rel = 0.05 } = o, osc = sqr(), f0 = mtof(m);
  play(b, t, dur + rel, (tt) => osc(f0 * wow(t + tt) * (1 + (tt > 0.15 ? vib * Math.sin(TAU * 5.5 * tt) : 0)), duty) * (tt < att ? tt / att : tt < dur ? sus + (1 - sus) * ex(tt - att, dec) : (sus + (1 - sus) * ex(dur - att, dec)) * Math.max(0, 1 - (tt - dur) / rel)), g, pan, send, sa);
}
function triBass(b, t, m, dur, g, pan = 0) { const o = tri(), f0 = mtof(m); play(b, t, dur + 0.02, (tt) => o(f0 * wow(t + tt)) * ad(tt, 0.004, dur, 0.02), g, pan); }
function kick(b, t, g = 1, o = {}) { const { p0 = 140, p1 = 48, pd = 0.03, dec = 0.22 } = o, s = sine(); play(b, t, dec * 3, (tt, k) => s(p1 + (p0 - p1) * ex(tt, pd)) * ex(tt, dec) + 0.15 * wn(k, 3) * ex(tt, 0.002), g); }
function snare(b, t, g = 1, pan = 0, send, sa) { const s = sine(), f = new SVF(2400, 0.8), seed = Math.round(t * 997); play(b, t, 0.3, (tt, k) => 0.4 * s(200) * ex(tt, 0.04) + (f.run(wn(k, seed)), f.bp) * ex(tt, 0.08) * 1.6, g, pan, send, sa); }
function hat(b, t, g = 1, pan = 0, open = false) { const f = new SVF(8500, 0.9), seed = Math.round(t * 1013); play(b, t, open ? 0.3 : 0.06, (tt, k) => (f.run(wn(k, seed)), f.hp) * ex(tt, open ? 0.08 : 0.018), g, pan); }
function blip(b, t, freq, dur, g = 1, pan = 0, type = 'sqr', send, sa) {
  const o = type === 'sqr' ? sqr() : type === 'tri' ? tri() : sine();
  play(b, t, dur + 0.02, (tt) => (type === 'sqr' ? o(freq, 0.25) : o(freq)) * (tt < 0.003 ? tt / 0.003 : ex(tt, dur * 0.4)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / 0.02)), g, pan, send, sa);
}
function fm(b, t, freq, dur, g, pan, o = {}, send, sa) {
  const { ratio = 1, index = 2, idec = 0.4, adec = 1.2, rel = 0.12, att = 0.002 } = o;
  let cp = 0, mp = 0;
  play(b, t, dur + rel, (tt) => { mp += freq * ratio / SR; cp += freq / SR; const mod = index * ex(tt, idec) * Math.sin(TAU * mp); return Math.sin(TAU * cp + mod) * (tt < att ? tt / att : ex(tt - att, adec)) * (tt < dur ? 1 : Math.max(0, 1 - (tt - dur) / rel)); }, g, pan, send, sa);
}
const bell = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 3.5, index: 2.4, idec: 0.9, adec: dur * 0.5, rel: 0.2 }, send, sa);
const chime = (b, t, m, dur, g, pan, send, sa) => fm(b, t, mtof(m), dur, g, pan, { ratio: 2, index: 0.8, idec: 0.1, adec: dur * 0.6 }, send, sa);
function pad(b, t, notes, dur, g, pan = 0, fc = 1200, att = 0.4, rel = 0.6, send, sa) {
  const oscs = notes.map((m, j) => [j % 2 ? tri() : saw(), mtof(m) * (j % 2 ? 0.998 : 1.002)]), f = new SVF(fc, 0.7);
  play(b, t, dur + rel, (tt) => { let v = 0; for (const [o, fq] of oscs) v += o(fq * wow(t + tt)); return f.run(v / oscs.length) * ad(tt, att, dur, rel); }, g, pan, send, sa);
}
function noise(b, t, dur, fc, q, g, pan = 0, env = (x) => Math.sin(Math.PI * x), send, sa) {
  const f = new SVF(fc, q), seed = Math.round(t * 4001 + fc);
  play(b, t, dur, (tt, k) => (f.run(wn(k, seed)), f.bp) * env(tt / dur) * 1.4, g, pan, send, sa);
}
function whoosh(b, t, dur, f0, f1, g, pan0 = 0, pan1 = 0, shape = 'bell', send, sa) {
  const f = new SVF(f0, 1.1), seed = Math.round(t * 4001 + f0);
  const env = shape === 'rise' ? (x) => x * x * x : shape === 'fall' ? (x) => (1 - x) * (1 - x) : (x) => Math.pow(Math.sin(Math.PI * x), 1.4);
  play(b, t, dur, (tt, k) => { const x = tt / dur; if ((k & 15) === 0) f.set(f0 * Math.pow(f1 / f0, x), 1.1); f.run(wn(k, seed)); return f.bp * env(x) * 1.6; }, g, (tt) => lerp(pan0, pan1, tt / dur), send, sa);
}
function glide(b, t, dur, f0, f1, g, pan = 0, type = 'sine', send, sa) {
  const o = type === 'sqr' ? sqr() : type === 'tri' ? tri() : sine();
  play(b, t, dur, (tt) => (type === 'sqr' ? o(f0 * Math.pow(f1 / f0, tt / dur), 0.25) : o(f0 * Math.pow(f1 / f0, tt / dur))) * Math.sin(Math.PI * Math.min(1, tt / dur)) ** 0.7, g, pan, send, sa);
}
function thud(b, t, g, f = 110, dec = 0.09, pan = 0) { const s = sine(), seed = Math.round(t * 701); play(b, t, dec * 4, (tt, k) => s(f * (1 + ex(tt, 0.01))) * ex(tt, dec) + 0.3 * wn(k, seed) * ex(tt, 0.006), g, pan); } // wood
function impact(b, t, g, send, sa) { const s = sine(), f = new SVF(900, 0.7), seed = Math.round(t * 6007); play(b, t, 2.2, (tt, k) => s(34 + 30 * ex(tt, 0.25)) * ex(tt, 0.9) * 1.1 + (f.run(wn(k, seed)), f.lp) * ex(tt, 0.12) * 1.4, g, 0, send, sa); }
function splashS(b, t, g, pan = 0, send, sa) { noise(b, t, 0.5, 1800, 0.6, g, pan, (x) => (x < 0.05 ? x / 0.05 : Math.pow(1 - x, 2)), send, sa); thud(b, t, g * 0.5, 70, 0.08, pan); }
function creak(b, t, dur, g, pan = 0) { const s = saw(), f = new SVF(700, 4); play(b, t, dur, (tt) => f.run(s(90 + 40 * Math.sin(TAU * 3 * tt) + 30 * tt / dur)) * Math.sin(Math.PI * tt / dur), g, pan); }
function chain(b, t, dur, g, pan = 0) { for (let x = 0; x < dur; x += 0.045) { const seed = Math.round((t + x) * 991); blip(b, t + x, 1800 + hash(seed, 1) * 1400, 0.03, g * (0.6 + 0.4 * hash(seed, 2)), pan, 'sine'); noise(b, t + x, 0.03, 3500, 3, g * 0.6, pan); } }
function gull(b, t, g, pan) { const s = sqr(); play(b, t, 0.32, (tt) => s(1300 + 700 * Math.sin(Math.PI * tt / 0.32) - 500 * (tt / 0.32), 0.125) * Math.sin(Math.PI * tt / 0.32), g, pan); }

// ================================================================ effects
function reverb(send, out, wet = 1) {
  const sc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  for (const [src, dst, spread] of [[send.L, out.L, 0], [send.R, out.R, 23]]) {
    const cb = combs.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0, f: 0 })), ab = aps.map((l) => ({ b: new Float32Array(Math.round((l + spread) * sc)), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = src[n] * 0.015; let y = 0;
      for (const c of cb) { const o = c.b[c.i]; c.f = o * 0.78 + c.f * 0.22; c.b[c.i] = x + c.f * 0.84; if (++c.i >= c.b.length) c.i = 0; y += o; }
      for (const a of ab) { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; y = o - y; if (++a.i >= a.b.length) a.i = 0; }
      dst[n] += y * wet;
    }
  }
}
function addBus(dst, src, g = 1) { for (let i = 0; i < N; i++) { dst.L[i] += src.L[i] * g; dst.R[i] += src.R[i] * g; } }
function lowpassBus(b, fc) { for (const ch of [b.L, b.R]) { const f = new SVF(fc, 0.6); for (let i = 0; i < N; i++) ch[i] = f.run(ch[i]); } }
// gain envelope on a region: k(t) multiplies the bus
function gainRegion(b, a0, a1, k) { for (let i = Math.max(0, Math.round(a0 * SR)); i < Math.min(N, Math.round(a1 * SR)); i++) { const g = k(i / SR); b.L[i] *= g; b.R[i] *= g; } }

// ================================================================ the theme (written for this film)
// [eighth, midi, length in eighths] per bar; chords per bar
const THEME_MAJ = [
  [[0, 69, 2], [2, 72, 1], [3, 77, 2], [5, 76, 1], [6, 72, 2]],
  [[0, 76, 3], [3, 72, 1], [4, 69, 2], [6, 67, 2]],
  [[0, 65, 2], [2, 69, 1], [3, 74, 2], [5, 72, 1], [6, 70, 2]],
  [[0, 69, 2], [2, 67, 4]],
];
const CH_MAJ = [[53, 57, 60, 64], [57, 60, 64, 67], [58, 62, 65, 69], [60, 64, 67, 70]]; // F, Am7, Bb, C7
const THEME_MIN = [
  [[0, 65, 2], [2, 69, 1], [3, 74, 2], [5, 72, 1], [6, 69, 2]],
  [[0, 72, 3], [3, 69, 1], [4, 65, 2], [6, 64, 2]],
  [[0, 62, 2], [2, 65, 1], [3, 70, 2], [5, 69, 1], [6, 67, 2]],
  [[0, 64, 2], [2, 69, 4]],
];
const CH_MIN = [[50, 53, 57, 60], [53, 57, 60, 64], [55, 58, 62, 65], [57, 61, 64, 67]]; // Dm7, F, Gm, A7
const eighth = (t0, beat, i, sw) => t0 + Math.floor(i / 2) * beat + (i % 2 ? sw * beat : 0);

// a looping groove from t0 to t1. o: { minor, beat, swing, lead, drums, bass, chords, leadGain, lp }
function groove(M, V, t0, t1, o) {
  const beat = o.beat, bar = beat * 4, sw = o.swing ?? 0.5, TH = o.minor ? THEME_MIN : THEME_MAJ, CH = o.minor ? CH_MIN : CH_MAJ;
  for (let b = 0; t0 + b * bar < t1 - 0.01; b++) {
    const tb = t0 + b * bar, bi = b % 4, ch = CH[bi];
    const e = (i) => eighth(tb, beat, i, sw);
    if (o.bass) for (let i = 0; i < 8; i++) {
      const pat = o.bass === 'drive' ? [0, 0, 12, 0, 0, 12, 7, 0] : [0, null, null, 12, 7, null, 0, null];
      const off = pat[i]; if (off === null) continue;
      const t = e(i); if (t >= t1) break;
      triBass(M, t, ch[0] - 12 + off, beat * (o.bass === 'drive' ? 0.42 : 0.8), o.bassGain ?? 0.22);
    }
    if (o.chords) for (const i of [1, 3, 5, 7]) { const t = e(i); if (t >= t1) break; ch.slice(1).forEach((m, j) => pulse(M, t, m, beat * 0.32, 0.028, (j - 1) * 0.3, { duty: 0.125, dec: 0.08, sus: 0.3 }, V, 0.25)); }
    if (o.arp) for (let i = 0; i < 16; i++) { const t = tb + i * beat / 4; if (t >= t1) break; pulse(M, t, ch[i % 4] + 12, beat * 0.2, 0.02, (i % 2 ? 0.35 : -0.35), { duty: 0.125, dec: 0.05, sus: 0.2 }, V, 0.2); }
    if (o.lead && tb >= (o.leadFrom ?? 0)) for (const [i, m, len] of TH[bi]) { const t = e(i); if (t >= t1) break; pulse(M, t, m + (o.leadShift ?? 0), Math.min(len * beat / 2 * 0.92, t1 - t), o.leadGain ?? 0.06, 0.05, { duty: o.duty ?? 0.25 }, V, 0.3); if (o.bells) bell(M, t, m + 12, len * beat / 2, 0.018, 0.2, V, 0.6); }
    if (o.drums) for (let q = 0; q < 4; q++) {
      const t = tb + q * beat; if (t >= t1) break;
      if (o.drums === 'full' || q % 2 === 0) kick(M, t, o.drums === 'full' ? 0.42 : 0.3);
      if (q % 2 === 1) snare(M, t, o.drums === 'full' ? 0.16 : 0.09, 0, V, 0.15);
      hat(M, t + sw * beat, 0.035, 0.2); if (o.drums === 'full') hat(M, t, 0.025, -0.2);
    }
    if (o.pad) pad(M, tb, ch, Math.min(bar, t1 - tb), o.pad, 0, 1000, 0.3, 0.4, V, 0.5);
  }
}

// ================================================================ score
function score() {
  const M = new Bus(), X = new Bus(), V = new Bus();
  const act = (id) => ACTS.find((a) => a.id === id);
  const C = CUE, B90 = 60 / BPM.slow, B135 = 60 / BPM.battle;
  const typing = (t0, t1, g = 0.022, pan = 0.25) => { for (let t = t0; t < t1; t += 1 / 12) blip(X, t, 2400 + hash(Math.round(t * 60), 9) * 1600, 0.012, g, pan, 'sqr'); };
  const buzz = (t, dur, g, pan, f = 110) => { const s = sqr(); play(X, t, dur, (tt) => s(f, 0.5) * ex(tt, dur * 0.8), g, pan); };
  // ----------------------------------------------------------------- S1 karam: drone, bubbles, creak; rewind
  {
    const [r0, r1] = C.karam.rw;
    pad(M, 0, [38, 45, 50, 53], r0, 0.06, 0, 500, 0.02, 0.15, V, 0.4);
    creak(X, 0.1, 0.9, 0.05, -0.2); creak(X, 1.0, 0.7, 0.04, 0.2);
    for (let i = 0; i < 10; i++) { const t = 0.05 + hash(i, 5) * (r0 - 0.1); blip(X, t, 300 + hash(i, 6) * 500, 0.06, 0.035, (hash(i, 7) - 0.5), 'sine'); }
    [55, 50, 47, 43].forEach((m, i) => pulse(X, 0.02 + i * 0.16, m + 12, 0.14, 0.05, 0, { duty: 0.5, dec: 0.2 })); // game-over jingle, falling
    splashS(X, C.karam.pop, 0.12, 0.6, V, 0.2);
    for (let k = 0; k < 14; k++) { const f = k / 14, t = r0 + (r1 - r0) * Math.pow(f, 0.8); pulse(X, t, [86, 81, 77, 74, 72, 69, 65][k % 7], 0.05, 0.035, (k % 2 ? 0.4 : -0.4), { duty: 0.125 }); }
    glide(X, r0, r1 - r0, 900, 160, 0.05, 0, 'sqr');
    noise(X, r0, r1 - r0, 3000, 0.7, 0.05, 0, (x) => 0.3 + 0.7 * x);
    blip(X, r1 - 0.02, 2600, 0.02, 0.08, 0, 'sine'); thud(X, r1 - 0.02, 0.12, 180, 0.03);
  }
  // ----------------------------------------------------------------- S2–S4 sore: lazy swung theme
  {
    const a = act('sore'), sun = C.muat.sunset[0];
    groove(M, V, a.t0, sun + 0.4, { beat: B90, swing: 0.6, bass: 'lazy', chords: true, lead: true, drums: 'soft', leadFrom: S.bayu.t0 + B90 * 4 - 0.01 });
    gainRegion(M, sun - 0.3, sun + 0.4, (t) => 1 - clamp((t - sun + 0.3) / 0.7));
    gull(X, a.t0 + 0.3, 0.02, -0.5); gull(X, a.t0 + 0.65, 0.016, -0.4); gull(X, C.muat.depart + 0.5, 0.015, 0.5);
    noise(X, a.t0, a.t1 - a.t0, 600, 0.4, 0.02, 0, () => 1); // harbour water bed
    // S2: cut, labels, the prompt being typed and sent, the AI typing
    whoosh(X, C.bayu.cut - 0.12, 0.25, 2500, 600, 0.04, 0, 0, 'fall');
    blip(X, C.bayu.tagBayu, 1046, 0.06, 0.05, -0.2); blip(X, C.bayu.tagAI, 1318, 0.06, 0.05, 0.3);
    for (let k = 0; k < 18; k++) blip(X, C.bayu.ask + k / 32 * 1.9, 3000 + hash(k, 19) * 900, 0.01, 0.02, -0.2, 'sine');
    blip(X, C.bayu.ask + 1.15, 1760, 0.04, 0.05, 0.1, 'sqr'); // send
    typing(C.bayu.glyphs[0], S.bayu.t1, 0.02, 0.35);
    // S3: typing, the sip, the wave, thumbs up
    typing(S.merem.t0, C.merem.wave[0]); typing(S.merem.dlg.e, S.merem.t1);
    noise(X, C.merem.sip, 0.4, 2400, 4, 0.03, 0);
    for (let k = 0; k < 3; k++) blip(X, C.merem.wave[0] + k * 0.12, 1568 + k * 200, 0.05, 0.03, -0.3, 'tri');
    blip(X, C.merem.thumb, 1760, 0.08, 0.05, 0, 'sqr'); blip(X, C.merem.thumb + 0.07, 2349, 0.1, 0.04, 0, 'sqr');
    blip(X, S.merem.dlg.s, 1200, 0.05, 0.04, -0.3);
    // S4: the slap on the big button, crates on the beat, the counter, the stamp, the bell, departure
    thud(X, C.muat.slap, 0.28, 120, 0.05, -0.2); blip(X, C.muat.slap + 0.01, 1900, 0.03, 0.06, -0.2, 'sqr');
    C.muat.crates.forEach((c, i) => { chain(X, c - 0.4, 0.32, 0.014, 0.4); thud(X, c, 0.2, 80 + i * 6, 0.1, 0.35); blip(X, c + 0.03, mtof(76 + i * 2), 0.04, 0.03, 0, 'sqr'); });
    impact(X, C.muat.stamp, 0.16, V, 0.15); thud(X, C.muat.stamp, 0.3, 160, 0.04, 0.2);
    [0, 0.28].forEach((d) => bell(X, C.muat.bell + d, 84, 1.2, 0.07, -0.4, V, 0.6));
    whoosh(X, C.muat.depart, 1.2, 250, 900, 0.05, -0.2, 0.4, 'rise'); thud(X, C.muat.depart + 0.1, 0.1, 80, 0.15);
  }
  // ----------------------------------------------------------------- S5–S6 malam: minor, pulsing
  {
    const a = act('malam');
    groove(M, V, a.t0, a.t1, { beat: B90, minor: true, swing: 0.5, bass: 'drive', bassGain: 0.17, arp: true, drums: 'soft', lead: true, leadFrom: S.peti.t0 - 0.01, leadGain: 0.04 });
    noise(X, a.t0, a.t1 - a.t0, 500, 0.4, 0.02, 0, () => 1);
    creak(X, a.t0 + 0.2, 1.1, 0.05, -0.2);
    blip(X, C.malam.flip, 1500, 0.03, 0.05, 0, 'sine'); // the clock ticks over
    C.malam.holes.forEach((h, i) => noise(X, h, 0.5, 2600 + i * 60, 3, 0.025, (hash(i, 71) - 0.5) * 1.4, (x) => (x < 0.05 ? x / 0.05 : 1 - x)));
    [0, 3, 7, 12, 18, 25, 33].forEach((i) => { const t = C.malam.holes[i]; blip(X, t, 880, 0.06, 0.05, 0.4, 'sqr'); blip(X, t + 0.08, 660, 0.08, 0.045, 0.4, 'sqr'); }); // error notifications
    noise(X, C.malam.spout0, a.t1 - C.malam.spout0, 400, 0.8, 0.035, 0, (x) => 0.3 + 0.7 * x); // water rising
    blip(X, S.malam.dlg.s, 900, 0.05, 0.04, -0.4);
    // S6: the code window, the red line, the crates rattle and burst, the swarm
    blip(X, C.peti.panel, 1318, 0.04, 0.04, 0.2, 'sqr');
    buzz(C.peti.redLine, 0.3, 0.05, 0.2);
    for (let t = C.peti.crack - 0.4; t < C.peti.crack; t += 1 / 12) thud(X, t, 0.04, 220 + hash(Math.round(t * 60), 4) * 80, 0.02, 0.2);
    C.peti.burst.forEach((b, i) => thud(X, b, 0.16, 150, 0.05, -0.1 + i * 0.2));
    for (let t = C.peti.crack; t < S.peti.t1; t += 1 / 16) { const k = Math.round(t * 16); blip(X, t, 3000 + hash(k, 3) * 3000, 0.008, 0.014 * hash(k, 4), (hash(k, 5) - 0.5) * 1.6, 'sine'); } // the swarm: thinner, under the VO
    blip(X, C.peti.unread, 520, 0.12, 0.04, -0.4, 'tri');
    blip(X, S.peti.dlg.s, 1200, 0.05, 0.04, 0.4);
  }
  // ----------------------------------------------------------------- S7–S8 pangkat
  {
    const P = C.pangkat, B = C.baca;
    blip(X, P.pause, 1046, 0.05, 0.07, 0, 'sqr'); blip(X, P.pause + 0.07, 784, 0.07, 0.06, 0, 'sqr');
    pad(M, P.pause + 0.1, [41, 48, 53, 57], P.resume - P.pause, 0.03, 0, 700, 0.3, 0.3, V, 0.5);
    const scale = [65, 67, 69, 72, 74, 77, 79, 81, 84];
    P.xp.forEach((f, i) => { blip(X, f, 2400, 0.02, 0.025, 0, 'sine'); blip(X, f + 0.45, mtof(scale[Math.floor((i / P.xp.length) * scale.length)] + 12), 0.04, 0.035, (i % 2 ? 0.3 : -0.3), 'sqr'); });
    [[0, 72], [0.11, 76], [0.22, 79], [0.33, 84]].forEach(([d, m], i) => pulse(M, P.costume + d, m, i === 3 ? 0.6 : 0.1, 0.08, 0, { duty: 0.5, dec: 0.3, sus: 0.7 }, V, 0.4));
    triBass(M, P.costume, 41, 0.9, 0.2);
    for (let k = 0; k < 5; k++) blip(X, P.slots + k * 0.06, 1318, 0.03, 0.035, -0.4 + k * 0.2, 'sqr');
    // S8 focus: slow pad + soft bass, the "ting", reading ticks, the flagged line, the flick
    pad(M, S.baca.t0, [50, 57, 60, 64], S.baca.len, 0.05, 0, 900, 0.4, 0.4, V, 0.5);
    for (let t = S.baca.t0; t < S.baca.t1; t += B90 * 2) triBass(M, t, 38, B90 * 1.6, 0.16);
    chime(X, B.eyes, 96, 0.9, 0.08, -0.3, V, 0.6); chime(X, B.eyes + 0.04, 103, 0.7, 0.04, -0.3, V, 0.6);
    for (let k = 0; k < 14; k++) blip(X, B.read[0] + k * (B.accept - B.read[0]) / 14, 3200, 0.01, 0.03, 0.3, 'sine');
    buzz(B.flag, 0.25, 0.045, 0.3, 120);
    blip(X, B.flick, 2600, 0.02, 0.07, 0.3, 'sqr'); splashS(X, B.flick + 0.5, 0.05, -0.6);
    [76, 81, 88].forEach((m, i) => chime(X, B.accept + i * 0.06, m, 0.6, 0.035, 0.3, V, 0.5));
  }
  // ----------------------------------------------------------------- wipes: a soft paper swish left → right; into battle: a deeper rush
  TRANS.forEach((tr) => {
    if (tr.kind === 'battle') { whoosh(X, tr.at - tr.d, tr.d * 2 + 0.1, 300, 1800, 0.05, -0.6, 0.6, 'rise'); noise(X, tr.at - tr.d, tr.d * 2, 1200, 0.8, 0.03, 0, (x) => Math.sin(Math.PI * x)); }
    else whoosh(X, tr.at - tr.d, tr.d * 2 + 0.05, 1800, 4200, 0.022, -0.5, 0.5);
  });
  // ----------------------------------------------------------------- "+1": a short jingle each time a rule slot fills
  SLOT_AT.forEach((t) => [79, 84, 88, 91].forEach((m, i) => pulse(X, t + i * 0.055, m, i === 3 ? 0.25 : 0.05, 0.04, -0.3, { duty: 0.25, dec: 0.12 }, V, 0.3)));
  // ----------------------------------------------------------------- S9–S14 tempur
  {
    const a = act('tempur'), K = C.kraken, roar = K.roar;
    noise(X, a.t0, roar - a.t0 + 0.3, 90, 0.7, 0.16, 0, (x) => x);
    splashS(X, K.rise[0] + 0.2, 0.08, 0.5, V, 0.2);
    { const s = saw(), f = new SVF(400, 2); play(X, roar, 1.1, (tt, k) => f.run(s(70 + 25 * Math.sin(TAU * 7 * tt)) + 0.4 * wn(k, 31)) * Math.sin(Math.PI * Math.min(1, tt / 1.1)) ** 0.6, 0.22, 0.4, V, 0.3); }
    CH_MIN[0].forEach((m) => pulse(M, roar, m, 0.5, 0.05, 0, { duty: 0.5, dec: 0.2 }));
    groove(M, V, roar, C.ulangi.flee[0], { beat: B135, minor: true, bass: 'drive', bassGain: 0.2, arp: true, drums: 'full', lead: true, leadFrom: S.konteks.t0 + B135 * 4, leadGain: 0.045 });
    whoosh(X, K.ui[0], 0.35, 600, 3000, 0.05, 0, 0, 'rise');
    // S10 konteks: the vague prompt, the guess fails, three ticks, the lantern, the right block
    blip(X, C.konteks.bad, 1200, 0.05, 0.04, -0.3);
    buzz(C.konteks.guess, 0.25, 0.045, 0);
    blip(X, C.konteks.panel, 1046, 0.04, 0.04, 0, 'sqr');
    C.konteks.ticks.forEach((t, i) => blip(X, t, mtof(79 + i * 4), 0.07, 0.05, -0.2, 'sqr'));
    whoosh(X, C.konteks.lamp - 0.1, 0.4, 400, 2200, 0.04, 0.4, 0.4, 'rise'); chime(X, C.konteks.lamp + 0.2, 91, 0.6, 0.03, 0.4, V, 0.5);
    [0, 0.07, 0.14].forEach((d, i) => thud(X, C.konteks.good + d, 0.1, 200 + i * 40, 0.03, 0));
    [72, 76, 79, 84].forEach((m, i) => pulse(X, C.konteks.good + 0.2 + i * 0.07, m, 0.06, 0.035, 0.2, { duty: 0.125 }));
    blip(X, S.konteks.dlg.s, 1200, 0.05, 0.04, 0.4);
    // S11 kecil: the oversized shot rolls and blows up; three small shots hit
    { const s = sine(); play(X, C.kecil.roll[0], C.kecil.roll[1] - C.kecil.roll[0], (tt) => s(45 + 8 * Math.sin(TAU * 4 * tt)) * 0.8, 0.12, 0); }
    kick(X, C.kecil.bigFire, 0.5, { p0: 100, p1: 34, dec: 0.35 }); glide(X, C.kecil.bigFire, C.kecil.boom - C.kecil.bigFire, 600, 900, 0.03, 0.3);
    impact(X, C.kecil.boom, 0.35, V, 0.3); noise(X, C.kecil.boom, 0.9, 700, 0.6, 0.14, 0.3, (x) => Math.pow(1 - x, 1.5), V, 0.3);
    C.kecil.fires.forEach((f, i) => {
      const h = C.kecil.hits[i];
      kick(X, f, 0.4, { p0: 110, p1: 38, dec: 0.3 }); noise(X, f, 0.4, 900, 0.6, 0.1, 0.3, (x) => Math.pow(1 - x, 2), V, 0.3);
      glide(X, f + 0.02, h - f, 1800, 700, 0.025, 0.5);
      impact(X, h, 0.16, V, 0.2); glide(X, h + 0.05, 0.35, 300, 120, 0.05, 0.6, 'sqr'); splashS(X, h + 0.2, 0.05, 0.6, V, 0.2);
      blip(X, h + 0.12, mtof(84 + i * 3), 0.06, 0.04, 0.6, 'sqr');
    });
    // S12 tes: the shield, each test ticks, one fails (buzzer), the fix, the chord
    thud(X, C.tes.shield, 0.2, 260, 0.05, 0.2); chime(X, C.tes.shield, 86, 0.5, 0.03, 0.2, V, 0.5);
    C.tes.rows.forEach((r, i) => blip(X, r, mtof([81, 84, 88][i]), 0.06, 0.045, 0.2, 'sqr'));
    for (let t = C.tes.rows[1]; t < C.tes.bad; t += 0.12) blip(X, t, 2200, 0.01, 0.015, 0.2, 'sine');
    { const s = sqr(); play(X, C.tes.bad, 0.5, (tt) => s(98 + (Math.floor(tt * 8) % 2) * 20, 0.5) * ex(tt, 0.4), 0.06, 0.2); }
    blip(X, C.tes.fix - 0.4, 1600, 0.03, 0.03, 0.4, 'tri'); blip(X, C.tes.fix, 2800, 0.03, 0.05, 0.4, 'sqr');
    [74, 78, 81].forEach((m) => chime(X, C.tes.done, m + 12, 0.8, 0.035, 0, V, 0.5));
    // S13 commit: the crystal forms, the wave makes a mess, the rewind back
    [88, 91, 95, 100].forEach((m, i) => fm(X, C.commit.crystal + i * 0.05, mtof(m), 0.6, 0.025, 0.4, { ratio: 2, index: 1.2, idec: 0.2, adec: 0.5 }, V, 0.7));
    blip(X, C.commit.label, 1568, 0.05, 0.04, 0.4, 'sqr');
    whoosh(X, C.commit.wave - 0.25, 0.5, 200, 1400, 0.09, 0.6, -0.2); splashS(X, C.commit.wave, 0.12, 0.2, V, 0.2);
    [0, 0.08, 0.17].forEach((d, i) => thud(X, C.commit.wave + d, 0.14, 120 + i * 30, 0.06, -0.3 + i * 0.3));
    glide(X, C.commit.back[0], C.commit.back[1] - C.commit.back[0], 200, 1400, 0.05, 0, 'sqr');
    for (let k = 0; k < 8; k++) pulse(X, C.commit.back[0] + k * (C.commit.back[1] - C.commit.back[0]) / 8, [65, 69, 72, 77, 81, 84, 88, 91][k], 0.04, 0.03, (k % 2 ? 0.3 : -0.3), { duty: 0.125 });
    chime(X, C.commit.back[1], 96, 0.8, 0.05, 0.4, V, 0.6);
    // S14 ulangi: every step blips a little higher; shots; a crystal per lap
    const U = C.ulangi;
    U.steps.forEach((s, j) => blip(X, s, mtof(76 + Math.floor(j / 5) * 2 + (j % 5)), 0.03, 0.04, 0, 'sqr'));
    U.hits.forEach((h) => { kick(X, h - U.h * 0.5, 0.35, { p0: 110, p1: 38, dec: 0.3 }); impact(X, h, 0.14, V, 0.2); splashS(X, h + 0.2, 0.05, 0.6); });
    U.crystals.forEach((c, n) => bell(X, c + 0.02, 88 + n * 3, 0.6, 0.035, -0.5, V, 0.5));
    const [f0] = U.flee;
    noise(X, f0, 0.9, 200, 0.8, 0.12, 0.5, (x) => Math.sin(Math.PI * x)); glide(X, f0, 0.6, 220, 60, 0.08, 0.5, 'sqr');
    [72, 77, 81, 84, 89].forEach((m, i) => pulse(M, f0 + 0.1 + i * 0.07, m, i === 4 ? 0.7 : 0.08, 0.07, 0, { duty: 0.5, dec: 0.3, sus: 0.6 }, V, 0.5));
  }
  // ----------------------------------------------------------------- S15–S16 fajar: the theme, major, full
  {
    const a = act('fajar'), L = C.layar;
    groove(M, V, a.t0, a.t1, { beat: B90, swing: 0.56, bass: 'lazy', chords: true, lead: true, bells: true, drums: 'soft', pad: 0.03, leadGain: 0.06, leadFrom: L.cut });
    // the split: the coder's button clicks on the left, the engineer's reading ticks on the right
    for (let t = S.layar.t0 + 0.333; t < L.cut; t += 0.666) { thud(X, t, 0.05, 140, 0.03, -0.6); blip(X, t, 1900, 0.02, 0.02, -0.6, 'sqr'); }
    for (let t = S.layar.t0; t < L.cut; t += 1 / 3) blip(X, t, 3200, 0.01, 0.018, 0.6, 'sine');
    blip(X, L.coder, 520, 0.1, 0.03, -0.6, 'tri'); chime(X, L.engineer, 88, 0.5, 0.03, 0.6, V, 0.5);
    whoosh(X, L.cut - 0.1, 0.4, 2400, 400, 0.05, 0, 0, 'fall');
    gull(X, L.cut + 0.4, 0.016, -0.6);
    noise(X, L.drop - 0.05, 0.3, 2000, 1, 0.04, 0); whoosh(X, L.drop, 0.4, 1200, 200, 0.06, 0, 0, 'fall'); thud(X, L.drop + 0.35, 0.1, 90, 0.1);
    whoosh(X, L.unfurl - 0.1, 0.5, 300, 2400, 0.08, -0.2, 0.2); thud(X, L.unfurl + 0.38, 0.18, 85, 0.14); // the sail fills: fwump on the beat
    [[0, 72], [0.11, 77], [0.22, 81], [0.33, 84], [0.44, 89]].forEach(([d, m], i) => pulse(M, L.hat + d, m, i === 4 ? 0.8 : 0.1, 0.07, 0, { duty: 0.5, dec: 0.3, sus: 0.7 }, V, 0.4));
    blip(X, L.hat - 0.35, 1568, 0.05, 0.04, -0.3, 'sqr');
    noise(X, C.santai.sip, 0.4, 2400, 4, 0.03, -0.3);
    blip(X, C.santai.lanjut, 1318, 0.05, 0.05, -0.3, 'sqr');
    blip(X, C.santai.select, 1760, 0.05, 0.06, -0.3, 'sqr'); blip(X, C.santai.select + 0.06, 2637, 0.08, 0.05, -0.3, 'sqr');
  }
  // ----------------------------------------------------------------- S17 closing (brand)
  {
    const Cl = C.closing, lock = Cl.lock;
    whoosh(X, Cl.iris[0], 0.5, 3000, 300, 0.06, 0, 0, 'fall');
    pad(M, Cl.iris[1], [41, 48, 57, 64], lock - Cl.iris[1] + 0.1, 0.04, 0, 900, 0.4, 0.2, V, 0.5);
    whoosh(X, Cl.arrow[0], lock - Cl.arrow[0], 350, 5500, 0.12, -0.9, 0, 'bell', V, 0.3);
    glide(X, Cl.arrow[0], lock - Cl.arrow[0], 180, 720, 0.04, -0.5, 'sqr');
    impact(X, lock, 0.5, V, 0.25);
    [41, 53, 60, 69, 76, 79].forEach((m, j) => bell(M, lock + j * 0.018, m, 3.4, [0.05, 0.05, 0.045, 0.04, 0.03, 0.028][j], (j - 2.5) * 0.15, V, 0.7));
    pad(M, lock, [41, 48, 57, 64, 67], DURATION - lock - 0.6, 0.05, 0, 1500, 0.05, 0.8, V, 0.6);
    [84, 89].forEach((m, j) => bell(X, Cl.wordmark + j * 0.1, m + 12, 1.2, 0.03, 0.15, V, 0.8));
    blip(X, Cl.cta + 0.2, 1175, 0.05, 0.03, 0, 'sine', V, 0.4);
    const tf = Cl.tap;
    { const s = sine(); play(X, tf, 0.1, (x) => s(180 - 400 * x) * ex(x, 0.02), 0.2); }
    fm(X, tf + 0.18, mtof(84), 0.3, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.4 }, V, 0.5);
    fm(X, tf + 0.27, mtof(91), 0.6, 0.045, 0.1, { ratio: 2, index: 0.8, idec: 0.1, adec: 0.6 }, V, 0.5);
  }
  lowpassBus(M, 5200); // warm, never piercing under the narrator
  const R = new Bus(); reverb(V, R, 1);
  return { M, X, R };
}

// ================================================================ voice-over: ducking + placement
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

// ================================================================ master: HPF, glue, loudness, limiter
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
export const STATS = {};
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
export function renderAudio({ vo = {} } = {}) {
  N = Math.ceil(DURATION * SR);
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
