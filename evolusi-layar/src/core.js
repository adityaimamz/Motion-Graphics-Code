// core.js — pure helpers. Nothing in here reads the clock or Math.random().
export const W = 1080, H = 1920, FPS = 60;

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const TAU = Math.PI * 2;

// frame-quantised time: constant across a frame's motion-blur shutter (see P(doom) ENGINE.md)
export const fidx = (t) => Math.round(t * FPS);
export const fq = (t) => fidx(t) / FPS;

export const ease = {
  lin: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: (x) => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  outBackBig: (x) => ease.outBack(x, 2.6),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
  outElastic: (x) => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1,
  smooth: (x) => x * x * (3 - 2 * x),
};

// progress of t through [a,b], eased
export const prog = (t, a, b, e = ease.lin) => e(inv(a, b, t));

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
export const hash2 = (a, b, s = 0) => hash(a * 7919 + b * 104729, s);
// smooth 1-D value noise
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u);
}

// ---------- colour ----------
const cache = new Map();
export function rgb(hex) {
  let c = cache.get(hex);
  if (!c) {
    const h = hex.replace('#', '');
    c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    cache.set(hex, c);
  }
  return c;
}
export function mix(a, b, k) {
  const A = typeof a === 'string' ? rgb(a) : a, B = typeof b === 'string' ? rgb(b) : b;
  return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
}
export function css(c, a = 1) {
  const C = typeof c === 'string' ? rgb(c) : c;
  return `rgba(${C[0] | 0},${C[1] | 0},${C[2] | 0},${a})`;
}
export const mixc = (a, b, k, al = 1) => css(mix(a, b, k), al);

// ---------- shapes ----------
export function rr(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
export function star(c, cx, cy, n, r1, r2, rot = 0) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * TAU - Math.PI / 2, r = i % 2 ? r2 : r1;
    i ? c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  c.closePath();
}
export function sparkle(c, x, y, r, col) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

// ---------- type ----------
export const FONTS = {
  it: 'IT', vt: 'VT323', comic: 'Comic Neue', times: 'Tinos', silk: 'Silkscreen',
  exo: 'Exo 2', orb: 'Orbitron', arimo: 'Arimo', mont: 'Montserrat', nunito: 'Nunito',
};
export const font = (fam, px, wt = 400, style = 'normal') => `${style} ${wt} ${px}px "${fam}"`;

export function setFont(c, fam, px, wt = 400, style = 'normal', track = 0) {
  c.font = font(fam, px, wt, style);
  c.letterSpacing = `${track}px`;
}

// greedy word wrap with the context's current font
export function wrap(c, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// per-character layout of a line (x offsets respect kerning of the prefix)
export function charXs(c, line) {
  const xs = [];
  for (let i = 0; i < line.length; i++) xs.push(c.measureText(line.slice(0, i)).width);
  return xs;
}

export function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv;
}
