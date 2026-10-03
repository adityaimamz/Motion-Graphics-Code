// core.js — pure helpers (pattern from vibe-engineer/src/core.js). Nothing in here reads the clock or Math.random().
export const W = 1080, H = 1920, FPS = 60;

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));
export const TAU = Math.PI * 2;

// frame-quantised time (for things that jump: caret blink, typing, counters, timecode)
export const fidx = (t) => Math.round(t * FPS);
export const fq = (t) => fidx(t) / FPS;

// cubic-bezier(x1,y1,x2,y2) as a function of x (Newton + bisection), cached
const bzCache = new Map();
export function bezier(x1, y1, x2, y2) {
  const key = `${x1},${y1},${x2},${y2}`;
  if (bzCache.has(key)) return bzCache.get(key);
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u, sy = (u) => ((ay * u + by) * u + cy) * u, dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  const f = (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 6; i++) { const e = sx(u) - x, d = dx(u); if (Math.abs(e) < 1e-6) return sy(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
    let a = 0, b = 1; u = x;
    for (let i = 0; i < 30; i++) { const v = sx(u); if (Math.abs(v - x) < 1e-6) break; if (v < x) a = u; else b = u; u = (a + b) / 2; }
    return sy(u);
  };
  bzCache.set(key, f); return f;
}

export const ease = {
  lin: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  // brand eases (STYLE.md §2): enter / move
  enter: bezier(0.23, 1, 0.32, 1),
  move: bezier(0.77, 0, 0.175, 1),
  // the soft UI ease the references use for cards and layout shifts
  ui: bezier(0.2, 0.8, 0.2, 1),
  outBack: (x, s = 1.5) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
  smooth: (x) => x * x * (3 - 2 * x),
};

// damped spring, normalised: 0 → 1 over time x (seconds), frequency f (Hz), damping ratio z (< 1 overshoots)
export function spring(x, f = 2.2, z = 0.62) {
  if (x <= 0) return 0;
  const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
}

// progress of t through [a,b], eased
export const prog = (t, a, b, e = ease.lin) => e(inv(a, b, t));
// 1 inside [a,b] with eased ramps of length r at both ends
export const window01 = (t, a, b, r = 0.2, r2 = r) => Math.min(prog(t, a, a + r, ease.outCubic), 1 - prog(t, b - r2, b, ease.inCubic));

// keys(t, [[t0,v0],[t1,v1,ease],...]) — ease on a key applies to the segment arriving at it
export function keys(t, k) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, v0] = k[i - 1], [t1, v1, e = ease.inOutCubic] = k[i];
      return lerp(v0, v1, e(inv(t0, t1, t)));
    }
  }
  return k[k.length - 1][1];
}

// integer hash → [0,1)
export function hash(i, seed = 0) {
  let h = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u);
}

// ---------- colour ----------
const cache = new Map();
export function rgb(hex) {
  let c = cache.get(hex);
  if (!c) { const h = hex.replace('#', ''); c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; cache.set(hex, c); }
  return c;
}
export function mix(a, b, k) {
  const A = typeof a === 'string' ? rgb(a) : a, B = typeof b === 'string' ? rgb(b) : b;
  return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
}
export function css(c, a = 1) {
  const C = typeof c === 'string' ? rgb(c) : c;
  return `rgba(${Math.round(C[0])},${Math.round(C[1])},${Math.round(C[2])},${+a.toFixed(4)})`;
}
export const mixc = (a, b, k, al = 1) => css(mix(a, b, k), al);

// ---------- typing (frame-locked, human rhythm) ----------
// When each character of `text` appears, in seconds from the start of typing. The rhythm is uneven like a hand on a
// keyboard (±38 % per key from hash(), a short beat after a space, longer after , ; : and longest after . ? !), and the
// whole line is normalised to (length − 1) / cps, so every cue computed as length / cps still holds. Fast lines (≥ 90 cps:
// pasted text) stay perfectly even.
const schedCache = new Map();
export function typeTimes(text, cps, seed = 7) {
  const key = `${cps}|${seed}|${text}`;
  let a = schedCache.get(key);
  if (a) return a;
  const n = text.length; a = new Array(n);
  if (cps >= 90 || n < 2) { for (let i = 0; i < n; i++) a[i] = i / cps; }
  else {
    const w = []; let sum = 0;
    for (let i = 0; i < n; i++) {
      let x = 0.62 + 0.76 * hash(i + seed * 131, seed);
      if (i > 0) { const c = text[i - 1]; if (c === ' ') x += 0.4; else if (',;:'.includes(c)) x += 2.4; else if ('.?!'.includes(c)) x += 3.4; }
      w.push(x); if (i > 0) sum += x;
    }
    const k = ((n - 1) / cps) / sum; a[0] = 0;
    for (let i = 1; i < n; i++) a[i] = a[i - 1] + w[i] * k;
  }
  schedCache.set(key, a);
  return a;
}
// characters typed so far: pass the text (human rhythm) or a plain length (even rhythm)
export function typedN(x, t, at, cps = 30) {
  const e = fq(t) - at + 1e-6;
  if (typeof x === 'number') return clamp(Math.floor(e * cps), 0, x);
  if (e < 0) return 0;
  const a = typeTimes(x, cps); let n = 0;
  while (n < a.length && a[n] <= e) n++;
  return n;
}
export const typed = (s, t, at, cps = 30) => s.slice(0, typedN(s, t, at, cps));
// seconds since the newest character appeared (a big number before typing starts)
export function typeIdle(s, t, at, cps = 30) {
  const n = typedN(s, t, at, cps);
  return n === 0 ? 1e9 : fq(t) - at - typeTimes(s, cps)[n - 1];
}
// the caret: solid while typing and a moment after, then a soft pulse (never a hard blink)
export function caretOpacity(idle) {
  if (idle < 0.35) return 1;
  return Math.round(Math.max(0.12, 0.5 + 0.5 * Math.cos(TAU * 1.06 * (idle - 0.35))) * 20) / 20;
}
export const caretHtml = (op, h = '1.05em') => `<span style="display:inline-block;width:3px;height:${h};margin-left:2px;vertical-align:-0.16em;background:#2F6BFF;border-radius:2px;opacity:${op};box-shadow:0 0 ${(8 * op).toFixed(0)}px rgba(47,107,255,${(0.45 * op).toFixed(2)})"></span>`;
// the typed text as html: the newest characters fade in with a blue ink tint that settles to `base`
export function typeHtml(s, t, at, cps, esc, base = '#0E1116', k = 3) {
  const n = typedN(s, t, at, cps), a = typeTimes(s, cps), e = fq(t) - at;
  let out = esc(s.slice(0, Math.max(0, n - k)));
  for (let j = Math.max(0, n - k); j < n; j++) {
    const age = e - a[j], p = clamp(age / 0.2), op = clamp(age / 0.06);
    out += p >= 1 ? esc(s[j]) : `<span style="color:${mixc('#2F6BFF', base, p)};opacity:${(Math.round(op * 20) / 20)}">${esc(s[j])}</span>`;
  }
  return out;
}

// rounding for style strings (keeps the DOM writes stable)
export const r2 = (x) => Math.round(x * 100) / 100;
export const r3 = (x) => Math.round(x * 1000) / 1000;
