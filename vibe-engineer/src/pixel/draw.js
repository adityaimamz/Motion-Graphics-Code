// draw.js — pixel primitives for the low-res world canvas. Everything lands on whole world pixels.
import { canvas, rgb } from '../core.js';

const ri = Math.round;
export function R(g, x, y, w, h, c) { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(ri(x), ri(y), ri(w), ri(h)); }
export function px(g, x, y, c) { g.fillStyle = c; g.fillRect(ri(x), ri(y), 1, 1); }
export function hl(g, x0, x1, y, c) { if (x1 < x0) [x0, x1] = [x1, x0]; R(g, x0, y, ri(x1) - ri(x0) + 1, 1, c); }
export function vl(g, x, y0, y1, c) { if (y1 < y0) [y0, y1] = [y1, y0]; R(g, x, y0, 1, ri(y1) - ri(y0) + 1, c); }

// Bresenham line, w×w pen
export function line(g, x0, y0, x1, y1, c, w = 1) {
  x0 = ri(x0); y0 = ri(y0); x1 = ri(x1); y1 = ri(y1);
  g.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, o = (w - 1) >> 1;
  for (let n = 0; n < 4000; n++) {
    g.fillRect(x0 - o, y0 - o, w, w);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
// filled ellipse by rows (crisp, symmetric)
export function ell(g, cx, cy, rx, ry, c) {
  if (rx <= 0 || ry <= 0) return;
  g.fillStyle = c;
  const x0 = ri(cx), y0 = ri(cy), RY = Math.ceil(ry);
  for (let dy = -RY; dy <= RY; dy++) {
    const k = 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5));
    if (k < 0) continue;
    const hw = Math.floor(rx * Math.sqrt(k) + 0.5);
    g.fillRect(x0 - hw, y0 + dy, hw * 2 + 1, 1);
  }
}
export const disc = (g, cx, cy, r, c) => ell(g, cx, cy, r, r, c);
// circle outline
export function ring(g, cx, cy, r, c, w = 1) {
  g.fillStyle = c;
  const x0 = ri(cx), y0 = ri(cy);
  for (let a = 0; a < 360; a += 1.5) {
    const t = (a * Math.PI) / 180;
    g.fillRect(x0 + ri(Math.cos(t) * r) - ((w - 1) >> 1), y0 + ri(Math.sin(t) * r) - ((w - 1) >> 1), w, w);
  }
}
// scanline polygon fill
export function poly(g, pts, c) {
  g.fillStyle = c;
  let y0 = Infinity, y1 = -Infinity;
  for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = ri(xs[i]), b = ri(xs[i + 1]); if (b > a) g.fillRect(a, y, b - a, 1); }
  }
}

// ordered dither: fill the pixels of a rect whose Bayer threshold is below k (0..1) with colour c
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const patCache = new Map();
function pattern(g, c, lvl) {
  const key = c + '|' + lvl;
  let p = patCache.get(key);
  if (!p) {
    const cv = canvas(4, 4), x = cv.getContext('2d');
    x.fillStyle = c;
    for (let i = 0; i < 16; i++) if (BAYER[i] < lvl) x.fillRect(i & 3, i >> 2, 1, 1);
    p = cv; patCache.set(key, p);
  }
  return g.createPattern(p, 'repeat');
}
export function dither(g, x, y, w, h, c, k) {
  const lvl = Math.round(Math.max(0, Math.min(1, k)) * 16);
  if (lvl <= 0) return;
  if (lvl >= 16) return R(g, x, y, w, h, c);
  g.fillStyle = pattern(g, c, lvl);
  g.fillRect(ri(x), ri(y), ri(w), ri(h));
}
// vertical gradient between two colours made of dithered bands (sky)
export function ditherGrad(g, x, y, w, h, c0, c1, bands = 8) {
  R(g, x, y, w, h, c0);
  const bh = h / bands;
  for (let b = 0; b < bands; b++) dither(g, x, y + b * bh, w, Math.ceil(bh) + 1, c1, (b + 0.5) / bands);
}

// ---------------------------------------------------------------- outlined figures
// draw(g) paints the fills of a figure into a w×h canvas; every transparent pixel touching a filled one becomes
// the outline colour. Cached per key (include the palette key in it).
const figCache = new Map();
export function figure(key, w, h, draw, outline) {
  let cv = figCache.get(key);
  if (cv) return cv;
  cv = canvas(w, h);
  const g = cv.getContext('2d');
  draw(g);
  if (outline) {
    const im = g.getImageData(0, 0, w, h), d = im.data, src = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) src[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    const [r, gg, b] = rgb(outline);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (src[i]) continue;
      if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) {
        d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0);
  }
  figCache.set(key, cv);
  return cv;
}
export function blit(g, cv, x, y, flip = false) {
  if (!flip) return g.drawImage(cv, ri(x), ri(y));
  g.save(); g.translate(ri(x) + cv.width, ri(y)); g.scale(-1, 1); g.drawImage(cv, 0, 0); g.restore();
}

// ---------------------------------------------------------------- bitmap fonts (part of the art: sail, crates)
const G57 = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['###..', '#..#.', '#...#', '#...#', '#...#', '#..#.', '###..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
const G35 = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'], O: ['###', '#.#', '#.#', '#.#', '###'], P: ['##.', '#.#', '##.', '#..', '#..'],
  '?': ['##.', '..#', '.#.', '...', '.#.'], ' ': ['...', '...', '...', '...', '...'],
  '<': ['..#', '.#.', '#..', '.#.', '..#'], '>': ['#..', '.#.', '..#', '.#.', '#..'], '/': ['..#', '..#', '.#.', '#..', '#..'],
};
export const F57 = { g: G57, w: 5, h: 7 }, F35 = { g: G35, w: 3, h: 5 };
export function textW(str, f = F57, s = 1, sp = 1) { return str.length * (f.w + sp) * s - sp * s; }
export function text(g, str, x, y, c, f = F57, s = 1, sp = 1) {
  g.fillStyle = c;
  let cx = ri(x);
  for (const ch of str) {
    const gl = f.g[ch] ?? f.g[' '];
    for (let r = 0; r < f.h; r++) for (let k = 0; k < f.w; k++) if (gl[r][k] === '#') g.fillRect(cx + k * s, ri(y) + r * s, s, s);
    cx += (f.w + sp) * s;
  }
  return cx - ri(x) - sp * s;
}
