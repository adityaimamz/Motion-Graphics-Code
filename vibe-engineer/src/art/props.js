// props.js — the explaining objects, drawn on the ×4 illustration layer (270×480 "prop px", 1 prop px = 4×4 px)
// with flat colours (PROP), so they read the same at sunset, midnight and dawn. Big, chunky, one idea each:
// a code window, a magnifier, the test shield, the save crystal, a big button, building blocks.
// Text on them is drawn by the scene in the UI layer (prop px × 2 = UI px).
import { R, px, hl, vl, line, disc, ell, poly, dither, ring } from '../pixel/draw.js';
import { PROP as C } from '../pixel/palette.js';
import { hash, step12 } from '../core.js';

// ---------------------------------------------------------------- ✓ / ✗ in prop px (s = stroke)
export function checkP(g, x, y, s, c) {
  for (let i = 0; i < 3; i++) R(g, x + i * s, y + (2 + i) * s, s + 1, s + 1, c);
  for (let i = 0; i < 5; i++) R(g, x + (3 + i) * s, y + (4 - i) * s, s + 1, s + 1, c);
}
export function crossP(g, x, y, s, c) {
  for (let i = 0; i < 6; i++) { R(g, x + i * s, y + i * s, s + 1, s + 1, c); R(g, x + (5 - i) * s, y + i * s, s + 1, s + 1, c); }
}

// ---------------------------------------------------------------- code window
// o: { rows, shown (rows typed so far, may be fractional), hl: row → colour, mark: row → 'ok'|'bad', seed, dim, bar (title bar height) }
// returns { rowY(i), x0, x1 } for anchoring
export const ROW_H = 7;
export function codeWin(g, x, y, w, h, o = {}) {
  const rows = o.rows ?? 8, shown = o.shown ?? rows, seed = o.seed ?? 3;
  R(g, x + 2, y + 2, w, h, C.ink); // drop shadow
  R(g, x, y, w, h, C.ink); R(g, x + 1, y + 1, w - 2, h - 2, C.win);
  const bar = o.bar ?? 7;
  R(g, x + 1, y + 1, w - 2, bar, C.win1);
  [C.red, C.gold, C.green].forEach((c, i) => R(g, x + 4 + i * 5, y + 2 + Math.floor((bar - 3) / 2), 3, 3, c));
  const rowY = (i) => y + bar + 5 + i * ROW_H;
  const cols = [C.c3, C.c1, C.c2, C.c5, C.c6, C.c4];
  for (let i = 0; i < rows; i++) {
    const ry = rowY(i); if (ry + 4 > y + h - 2) break;
    if (o.hl?.[i]) R(g, x + 2, ry - 2, w - 4, ROW_H, o.hl[i]);
    R(g, x + 4, ry, 3, 3, C.bar); // line number block
    const fr = Math.min(1, Math.max(0, shown - i));
    if (fr <= 0) continue;
    let cx = x + 11 + Math.floor(hash(i, seed) * 3) * 4;
    const end = x + 11 + (w - 26) * fr;
    for (let s = 0; s < 4; s++) {
      const len = 5 + Math.floor(hash(i * 5 + s, seed + 1) * 12);
      if (cx >= end || cx + 2 > x + w - 14) break;
      R(g, cx, ry, Math.min(len, end - cx, x + w - 14 - cx), 3, o.dim ? C.bar : cols[(i + s + seed) % 6]);
      cx += len + 3;
    }
    const m = o.mark?.[i];
    if (m === 'ok') checkP(g, x + w - 12, ry - 2, 1, C.green);
    else if (m === 'bad') crossP(g, x + w - 11, ry - 1, 1, C.red);
  }
  // title: UI px (prop px × 2), top of the cap box for a size-22 label in the bar
  return { rowY, x0: x, x1: x + w, title: [x * 2 + 38, y * 2 + bar - 6] };
}

// ---------------------------------------------------------------- magnifier: lens centre (x, y), radius r
export function magnifier(g, x, y, r) {
  line(g, x + r * 0.7, y + r * 0.7, x + r * 1.6, y + r * 1.6, C.ink, 5);
  line(g, x + r * 0.75, y + r * 0.75, x + r * 1.55, y + r * 1.55, C.wood, 3);
  disc(g, x, y, r + 2, C.ink); disc(g, x, y, r + 1, C.metal); disc(g, x, y, r - 1, C.ink);
  // clear glass: a flat light tint and a glint (a dither here reads as a mesh)
  g.globalAlpha = 0.16; disc(g, x, y, r - 1, C.cyanL); g.globalAlpha = 1;
  px(g, x - r * 0.45, y - r * 0.5, C.cyanL); px(g, x - r * 0.35, y - r * 0.6, C.cyanL); px(g, x - r * 0.55, y - r * 0.35, C.cyanL);
  px(g, x - r * 0.55, y - r * 0.2, C.cyanL); px(g, x - r * 0.2, y - r * 0.62, C.cyanL);
}
// the lens is see-through: the scene draws the window first, then clips a 2× view of it into the lens
export function lensMask(g, x, y, r) { g.beginPath(); g.arc(x, y, r - 1, 0, Math.PI * 2); }

// ---------------------------------------------------------------- the test shield: top-centre (cx, y), w × h
export function shieldPts(cx, y, w, h) {
  const hw = w / 2;
  return [[cx - hw, y], [cx + hw, y], [cx + hw, y + h * 0.55], [cx + hw * 0.5, y + h * 0.85], [cx, y + h], [cx - hw * 0.5, y + h * 0.85], [cx - hw, y + h * 0.55]];
}
export function shield(g, cx, y, w, h, flash = 0) {
  const o = (p, d) => p.map(([a, b]) => [a + (a < cx ? -d : a > cx ? d : 0), b + (b < y + h / 2 ? -d : d)]);
  const pts = shieldPts(cx, y, w, h);
  poly(g, o(pts, 2), C.ink);
  poly(g, pts, flash ? C.redL : C.blue);
  poly(g, shieldPts(cx, y + 4, w - 8, h - 9), flash ? C.red : C.blue1);
  hl(g, cx - w / 2 + 2, cx + w / 2 - 2, y + 1, C.blueL);
}

// ---------------------------------------------------------------- save crystal: centre (cx, cy), half-height s
export function crystal(g, cx, cy, s, t, glow = 1) {
  const st = step12(t);
  if (glow > 0) for (let k = 0; k < 3; k++) { const rr = s + 4 + ((st + k * 4) % 12) * 1.5; if (rr < s + 20) ring(g, cx, cy, rr, k % 2 ? C.cyan : C.cyanL); }
  const top = [cx, cy - s], right = [cx + s * 0.62, cy], bot = [cx, cy + s], left = [cx - s * 0.62, cy];
  poly(g, [[cx, cy - s - 2], [cx + s * 0.62 + 2, cy], [cx, cy + s + 2], [cx - s * 0.62 - 2, cy]], C.ink);
  poly(g, [top, right, bot, left], C.cyan);
  poly(g, [top, [cx, cy], left], C.cyanL);
  poly(g, [[cx, cy], right, bot], C.cyan1);
  poly(g, [[cx, cy], bot, left], C.cyan2);
  vl(g, cx, cy - s + 2, cy + s - 2, C.cyanL);
  if (st % 8 < 2) { px(g, cx - s * 0.3, cy - s * 0.5, '#FFFFFF'); px(g, cx - s * 0.3 - 1, cy - s * 0.5, '#FFFFFF'); px(g, cx - s * 0.3, cy - s * 0.5 - 1, '#FFFFFF'); }
}
// pedestal under the crystal
export function plinth(g, cx, y, w) {
  R(g, cx - w / 2 - 1, y - 1, w + 2, 8, C.ink); R(g, cx - w / 2, y, w, 6, C.metal); R(g, cx - w / 2, y + 4, w, 2, C.metal1);
}

// ---------------------------------------------------------------- big push button on a pedestal: top-centre (cx, y)
export function bigButton(g, cx, y, w, pressed, col = 'green') {
  const c0 = C[col], c1 = C[col + '1'], cL = C[col + 'L'], d = pressed ? 3 : 0, hw = Math.round(w / 2);
  // pedestal
  R(g, cx - hw - 4, y + 12, w + 8, 30, C.ink); R(g, cx - hw - 3, y + 13, w + 6, 28, C.metal1); R(g, cx - hw - 3, y + 13, w + 6, 3, C.metal);
  // cap
  R(g, cx - hw - 1, y + d - 1, w + 2, 15, C.ink);
  R(g, cx - hw, y + d, w, 13, c0); R(g, cx - hw, y + d + 9, w, 4, c1); R(g, cx - hw + 2, y + d + 1, w - 4, 2, cL);
}

// ---------------------------------------------------------------- building block (S10): x, y = top-left, s = size
export function block(g, x, y, s, col, ok = true) {
  R(g, x - 1, y - 1, s + 2, s + 2, C.ink); R(g, x, y, s, s, ok ? C[col] : C.red);
  R(g, x, y, s, 2, ok ? C[col + 'L'] ?? C.goldL : C.redL); R(g, x + s - 2, y, 2, s, ok ? C[col + '1'] ?? C.gold1 : C.red1);
  // a "</>" mark on each block
  const m = ok ? C.ink : C.ink, cx = x + s / 2, cy = y + s / 2;
  px(g, cx - 4, cy, m); px(g, cx - 3, cy - 1, m); px(g, cx - 3, cy + 1, m);
  px(g, cx + 4, cy, m); px(g, cx + 3, cy - 1, m); px(g, cx + 3, cy + 1, m);
  px(g, cx + 1, cy - 2, m); px(g, cx, cy, m); px(g, cx - 1, cy + 2, m);
}

// ---------------------------------------------------------------- XP spark (gold diamond, 5×5)
export function spark(g, x, y, big = false) {
  px(g, x, y - 2, C.gold); hl(g, x - 1, x + 1, y - 1, C.gold); hl(g, x - 2, x + 2, y, C.goldL); hl(g, x - 1, x + 1, y + 1, C.gold); px(g, x, y + 2, C.gold);
  if (big) { px(g, x, y - 3, C.goldL); px(g, x, y + 3, C.goldL); px(g, x - 3, y, C.goldL); px(g, x + 3, y, C.goldL); }
}
// smoke puff (k 0..1), prop px
export function smoke(g, x, y, k, r0 = 4, grow = 12) {
  if (k <= 0 || k >= 1) return;
  const r = r0 + k * grow;
  for (let i = 0; i < 6; i++) { const a = hash(i, 17) * 6.28, d = r * 0.55; ell(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, r * 0.6, r * 0.5, i % 2 ? C.smoke : C.smoke1); }
  ell(g, x, y, r * 0.7, r * 0.6, C.smoke);
}
