// ui.js — the game UI, drawn on a 540×960 canvas that is scaled ×2 (1 UI px = 2×2 px).
// Text is rendered with the pixel font and thresholded to whole pixels (no grey anti-aliasing), always on a
// solid panel or as part of an object — never outlined, never haloed. The one sentence on screen is the
// explainer card (bottom); the HUD (top) holds the rank, the five rule slots and the boss.
import { canvas, setFont, F, clamp, fq } from './core.js';
import { UI } from './pixel/palette.js';
import { CARDS, DLG, CUE, rankAt, slotsAt, SLOT_AT } from './timeline.js';

export const UW = 540, UH = 960;
const ri = Math.round;

// ---------------------------------------------------------------- pixel text
const scratch = canvas(8, 8).getContext('2d');
const txtCache = new Map();
function bitmap(str, fam, size, wt, color) {
  const key = [str, fam, size, wt, color].join('|');
  let b = txtCache.get(key);
  if (b) return b;
  setFont(scratch, fam, size, wt);
  const m = scratch.measureText(str), w = Math.ceil(m.width) + 4, h = Math.ceil(size * 1.5);
  const cv = canvas(Math.max(1, w), h), c = cv.getContext('2d');
  setFont(c, fam, size, wt); c.fillStyle = color; c.textBaseline = 'alphabetic';
  const base = Math.round(size * 1.08);
  c.fillText(str, 1, base);
  const im = c.getImageData(0, 0, cv.width, h), d = im.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 120 ? 255 : 0;
  c.putImageData(im, 0, 0);
  const xs = [0];
  for (let i = 1; i <= str.length; i++) xs.push(Math.ceil(scratch.measureText(str.slice(0, i)).width));
  b = { cv, w: Math.ceil(m.width), h, base, xs };
  txtCache.set(key, b);
  return b;
}
// every UI text is Jersey 10: it stays unambiguous when thresholded
export function textWidth(str, size, o = {}) { return bitmap(str, o.fam ?? F.jersey, size, o.wt ?? 400, '#fff').w; }
// y = top of the cap box (≈ baseline - size*0.8)
export function pxText(u, str, x, y, size, color, o = {}) {
  if (!str) return 0;
  const b = bitmap(str, o.fam ?? F.jersey, size, o.wt ?? 400, color);
  let dx = ri(x);
  if (o.align === 'center') dx = ri(x - b.w / 2); else if (o.align === 'right') dx = ri(x - b.w);
  const n = o.reveal ?? str.length, sw = b.xs[Math.max(0, Math.min(str.length, n))] + (n >= str.length ? 4 : 0);
  if (sw <= 0) return b.w;
  u.drawImage(b.cv, 0, 0, sw, b.h, dx - 1, ri(y - b.base + size * 0.8), sw, b.h);
  return b.w;
}
export function wrapPx(str, size, maxW, o = {}) {
  const words = str.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textWidth(t, size, o) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
// largest size ≤ max that fits the width
const fit = (str, max, min, w) => { let s = max; while (s > min && textWidth(str, s) > w) s -= 2; return s; };

// ---------------------------------------------------------------- panels and glyphs
export function panel(u, x, y, w, h, o = {}) {
  x = ri(x); y = ri(y); w = ri(w); h = ri(h);
  if (w < 6 || h < 6) return;
  const a0 = u.globalAlpha; // panels respect a dimmed layer (the HUD steps back)
  u.globalAlpha = a0 * (o.alpha ?? 0.94); u.fillStyle = o.fill ?? UI.panel; u.fillRect(x + 1, y + 1, w - 2, h - 2); u.globalAlpha = a0;
  u.fillStyle = o.frame ?? UI.frame;
  u.fillRect(x + 2, y, w - 4, 2); u.fillRect(x + 2, y + h - 2, w - 4, 2); u.fillRect(x, y + 2, 2, h - 4); u.fillRect(x + w - 2, y + 2, 2, h - 4);
  u.fillRect(x + 1, y + 1, 1, 1); u.fillRect(x + w - 2, y + 1, 1, 1); u.fillRect(x + 1, y + h - 2, 1, 1); u.fillRect(x + w - 2, y + h - 2, 1, 1);
  if (o.inner !== false) { u.fillStyle = o.innerC ?? UI.inner; u.fillRect(x + 4, y + 4, w - 8, 1); u.fillRect(x + 4, y + h - 5, w - 8, 1); u.fillRect(x + 4, y + 4, 1, h - 8); u.fillRect(x + w - 5, y + 4, 1, h - 8); }
}
// ▶ as stacked rows (h odd)
export function tri(u, x, y, h, color) {
  u.fillStyle = color; const half = (h - 1) / 2;
  for (let r = 0; r < h; r++) { const w = half - Math.abs(r - half) + 1; u.fillRect(ri(x), ri(y) + r, Math.round(w * 0.9), 1); }
}
export function triL(u, x, y, h, color) {
  u.fillStyle = color; const half = (h - 1) / 2;
  for (let r = 0; r < h; r++) { const w = Math.round((half - Math.abs(r - half) + 1) * 0.9); u.fillRect(ri(x) - w, ri(y) + r, w, 1); }
}
export function arrowGlyph(u, x, y, color) { // "→" drawn in pixels (the font has none)
  u.fillStyle = color; u.fillRect(ri(x), ri(y) + 5, 14, 3); tri(u, x + 12, y, 13, color);
}
// ✓ and ✗ drawn in pixels, s = stroke (UI px), size ≈ 6s
export function check(u, x, y, s, color) {
  u.fillStyle = color;
  for (let i = 0; i < 3; i++) u.fillRect(ri(x + i * s), ri(y + (2 + i) * s), s * 1.5, s * 1.5);
  for (let i = 0; i < 5; i++) u.fillRect(ri(x + (3 + i) * s), ri(y + (4 - i) * s), s * 1.5, s * 1.5);
}
export function cross(u, x, y, s, color) {
  u.fillStyle = color;
  for (let i = 0; i < 6; i++) { u.fillRect(ri(x + i * s), ri(y + i * s), s * 1.5, s * 1.5); u.fillRect(ri(x + (5 - i) * s), ri(y + i * s), s * 1.5, s * 1.5); }
}
// a filled pixel circle (number badges)
export function dot(u, cx, cy, r, color) {
  u.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3); u.fillRect(ri(cx - hw), ri(cy + dy), hw * 2 + 1, 1); }
}

// ---------------------------------------------------------------- slot icons (the five rules), 10×10 at s UI px
const ICON = [
  // 1 baca: magnifier
  { g: ['..####....', '.#....#...', '#..##..#..', '#.#....#..', '#......#..', '.#....#...', '..####.#..', '.......##.', '........##', '.........#'], c: { '#': '#F4EEDC' } },
  // 2 konteks: spec sheet
  { g: ['.#######..', '.#.....##.', '.#.###..#.', '.#......#.', '.#.####.#.', '.#......#.', '.#.###..#.', '.#......#.', '.########.', '..........'], c: { '#': '#F4EEDC' } },
  // 3 kecil: a small shot
  { g: ['......#...', '.....#.#..', '......#...', '..####....', '.######...', '########..', '########..', '.######...', '..####....', '..........'], c: { '#': '#F4EEDC' } },
  // 4 tes: shield + check
  { g: ['.########.', '.#......#.', '.#.....##.', '.#....#.#.', '.##..#..#.', '.#.##...#.', '..#....#..', '...#..#...', '....##....', '..........'], c: { '#': '#F4EEDC' } },
  // 5 commit: crystal
  { g: ['....##....', '...#..#...', '..#....#..', '.#..##..#.', '#..#..#..#', '.#..##..#.', '..#....#..', '...#..#...', '....##....', '..........'], c: { '#': '#F4EEDC' } },
];
export const SLOT_COL = ['#7FD3FF', '#F5B342', '#E5484D', '#5BD07D', '#5FE3F0'];
export function slotIcon(u, i, x, y, s, color) {
  const ic = ICON[i]; u.fillStyle = color ?? SLOT_COL[i];
  ic.g.forEach((row, r) => { for (let k = 0; k < row.length; k++) if (row[k] === '#') u.fillRect(ri(x + k * s), ri(y + r * s), s, s); });
}
export const SLOT_NAME = ['BACA', 'KONTEKS', 'KECIL', 'TES', 'COMMIT'];

// ---------------------------------------------------------------- HUD (top, y 132–172 UI = 264–344 px)
const RANKS = ['PENUMPANG', 'AWAK', 'KAPTEN'];
const HS = 30, HY = 132, HH = 40;
function rankIcon(u, x, y, r) {
  const R = (a, b, w, h, c) => { u.fillStyle = c; u.fillRect(x + a, y + b, w, h); };
  if (r === 0) { R(0, 2, 16, 10, '#E9D9A8'); R(0, 2, 16, 2, '#C9B57A'); R(11, 2, 1, 10, '#8A7A50'); R(2, 6, 7, 1, '#8A7A50'); R(2, 8, 5, 1, '#8A7A50'); } // ticket
  else if (r === 1) { R(1, 4, 14, 5, '#D7463A'); R(1, 7, 14, 2, '#A33228'); R(13, 8, 3, 4, '#D7463A'); } // bandana
  else { R(2, 2, 12, 6, '#F3EFE4'); R(0, 8, 16, 2, '#1B1A26'); R(7, 3, 2, 3, '#E2B23B'); } // captain hat
}
export function rankBadge(u, t) {
  const r = rankAt(t), changes = [CUE.pangkat.costume, CUE.layar.hat];
  const ch = changes.findIndex((c) => t >= c && t < c + 1.5);
  if (ch >= 0) { // "PENUMPANG → AWAK"
    const a = RANKS[ch], b = RANKS[ch + 1], wa = textWidth(a, HS), wb = textWidth(b, HS);
    panel(u, 30, HY, 30 + wa + 30 + wb + 16, HH);
    rankIcon(u, 40, HY + 12, ch + 1);
    pxText(u, a, 64, HY + 6, HS, UI.dim);
    arrowGlyph(u, 64 + wa + 6, HY + 13, UI.sel);
    if (Math.floor((t - changes[ch]) * 12) % 2 === 0 || t - changes[ch] > 0.5) pxText(u, b, 64 + wa + 30, HY + 6, HS, UI.sel);
    return;
  }
  panel(u, 30, HY, 30 + textWidth(RANKS[r], HS) + 18, HH);
  rankIcon(u, 40, HY + 12, r);
  pxText(u, RANKS[r], 64, HY + 6, HS, UI.text);
}
// the five rule slots (right of the rank); the newest one flashes as it fills
export const SLOT_BOX = (i) => [300 + i * 33, HY + 4];
export function ruleSlots(u, t, from) {
  if (t < from) return;
  const k = Math.min(1, (t - from) / 0.3), n = slotsAt(t);
  panel(u, 294, HY, 171, HH);
  for (let i = 0; i < 5; i++) {
    if (i / 5 > k) continue;
    const [x, y] = SLOT_BOX(i);
    u.fillStyle = '#0B0F1E'; u.fillRect(x, y, 30, 32); u.fillStyle = UI.inner; u.fillRect(x, y, 30, 1); u.fillRect(x, y + 31, 30, 1); u.fillRect(x, y, 1, 32); u.fillRect(x + 29, y, 1, 32);
    if (i < n) {
      const age = t - SLOT_AT[i], flash = age < 0.35 && Math.floor(age * 12) % 2 === 0;
      if (flash) { u.fillStyle = UI.sel; u.fillRect(x + 1, y + 1, 28, 30); }
      slotIcon(u, i, x + 5, y + 6, 2, flash ? UI.panel : SLOT_COL[i]);
    } else { u.fillStyle = '#26304C'; u.fillRect(x + 13, y + 14, 4, 4); }
  }
}
// "+1 BACA": rises out of its slot for 1 s
// dy pushes it below a second HUD row (the boss plate)
export function plusOne(u, t, i, dy = 0) {
  const t0 = SLOT_AT[i], age = t - t0;
  if (age < 0 || age > 1.1) return;
  const [sx] = SLOT_BOX(i), str = `+1 ${SLOT_NAME[i]}`, w = textWidth(str, 36) + 24;
  const y = HY + HH + 10 + dy + Math.min(3, Math.floor(age * 12)) * 2;
  const x = clamp(sx + 15 - w / 2, 30, 465 - w);
  panel(u, x, y, w, 44, { fill: '#1A2440' });
  pxText(u, str, x + 12, y + 7, 36, UI.sel);
}
// boss plate (S9–S14): second HUD row; opens like the card (half height, then full), never slides over the HUD
export function bossPlate(u, t, hp, max, k = 1) {
  if (k <= 0) return;
  const y = 180;
  if (k < 1) { const hh = ri(56 * (k < 0.5 ? 0.3 : 0.65)); panel(u, 30, y + (56 - hh) / 2, 435, hh); return; }
  panel(u, 30, y, 435, 56);
  pxText(u, 'BOSS: KRAKEN BUG', 44, y + 4, HS, UI.text);
  const sw = Math.floor((435 - 28 - (max - 1) * 4) / max);
  for (let i = 0; i < max; i++) {
    const x = 44 + i * (sw + 4);
    u.fillStyle = '#2A1820'; u.fillRect(x, y + 38, sw, 9);
    if (i < hp) { u.fillStyle = UI.danger; u.fillRect(x, y + 38, sw, 9); u.fillStyle = '#FF8A8E'; u.fillRect(x, y + 38, sw, 2); }
  }
}
// XP bar (S7)
export function xpBar(u, t, k, full) {
  panel(u, 30, 180, 435, 44);
  pxText(u, 'XP', 44, 186, HS, UI.sel);
  u.fillStyle = '#1F2740'; u.fillRect(84, 192, 368, 18);
  u.fillStyle = full && Math.floor(fq(t) * 10) % 2 ? '#FFF3B0' : UI.sel; u.fillRect(84, 192, ri(368 * clamp(k)), 18);
  u.fillStyle = '#FFF3B0'; u.fillRect(84, 192, ri(368 * clamp(k)), 3);
}

// ---------------------------------------------------------------- explainer card (bottom, y 650–780 UI = 1300–1560 px)
export const CARD = { x: 30, y: 652, w: 435, h: 126 };
const CARD_CPS = 55;
export const activeCard = (t) => CARDS.find((c) => t >= c.s && t < c.e);
// o.label overrides the label (live counters); o.dim greys it
export function card(u, t, c, o = {}) {
  if (!c) return;
  const age = fq(t) - c.s, left = c.e - fq(t);
  const k = age < 1 / 30 || left < 1 / 30 ? 0.5 : 1;
  const hh = ri(CARD.h * k);
  panel(u, CARD.x, CARD.y + (CARD.h - hh) / 2, CARD.w, hh);
  if (k < 1) return;
  let x = CARD.x + 20;
  if (c.num) { // number badge, like a level marker
    dot(u, x + 22, CARD.y + 40, 22, '#3B82F6'); dot(u, x + 22, CARD.y + 40, 18, '#2563EB');
    pxText(u, String(c.num), x + 22, CARD.y + 21, 40, '#F5F5F5', { align: 'center' });
    x += 58;
  }
  const label = o.label ?? c.label, avail = CARD.x + CARD.w - 20 - x;
  const ls = fit(label, 54, 34, avail);
  const n = Math.max(0, Math.floor(age * CARD_CPS * 1.4));
  pxText(u, label, x, CARD.y + 16, ls, o.dim ? UI.dim : c.num ? UI.sel : UI.text, { reveal: o.label ? undefined : n });
  const lsz = fit(c.line, 32, 24, CARD.w - 40), m = Math.max(0, Math.floor((age - label.length / (CARD_CPS * 1.4)) * CARD_CPS));
  pxText(u, c.line, CARD.x + 20, CARD.y + 82, lsz, '#B8C0D0', { reveal: m });
}

// ---------------------------------------------------------------- the single "▶ LANJUT" prompt (S16)
export const LANJUT = { x: 30, y: 700, w: 230, h: 64 };
export function lanjut(u, t, blinkOn, chosen) {
  panel(u, LANJUT.x, LANJUT.y, LANJUT.w, LANJUT.h);
  pxText(u, 'LANJUT', LANJUT.x + 70, LANJUT.y + 18, 40, chosen ? UI.sel : UI.text);
  if (blinkOn) tri(u, LANJUT.x + 30, LANJUT.y + 24, 19, UI.sel);
}
export const LANJUT_PTR = [LANJUT.x + 30, LANJUT.y + 24]; // top-left of the ▶ (UI px)

// ---------------------------------------------------------------- speech bubbles
// (ax, ay) = UI point the tail points at (top of the speaker's head). o: { size, maxW, fill, ink, s (start for pop) }
export function bubble(u, t, d, ax, ay, o = {}) {
  if (t < d.s || t >= d.e) return;
  const size = o.size ?? 34, maxW = o.maxW ?? 300, lines = wrapPx(d.text, size, maxW);
  const w = Math.max(...lines.map((l) => textWidth(l, size))) + 30, lh = Math.round(size * 0.95), h = 16 + lines.length * lh;
  const pop = t - d.s < 1 / 30 ? 0.7 : 1;
  let x = clamp(ax - w / 2 + (o.dx ?? 0), 30, 465 - w), y = clamp(ay - h - 14, 186, 640 - h);
  const W = ri(w * pop), Hh = ri(h * pop);
  x += (w - W) / 2; y += (h - Hh) / 2;
  const fill = o.fill ?? '#FBF6E8', ink = o.ink ?? UI.panel;
  u.fillStyle = ink;
  const tx = clamp(ax, x + 12, x + W - 12), down = ay > y;
  for (let r = 0; r < 10; r++) u.fillRect(ri(tx - 5 + r * 0.5), down ? ri(y + Hh - 2 + r) : ri(y + 2 - r), Math.max(1, ri(10 - r)), 1);
  panel(u, x, y, W, Hh, { fill, frame: ink, inner: false, alpha: 1 });
  if (pop === 1) lines.forEach((l, i) => pxText(u, l, x + 15, y + 8 + i * lh, size, ink));
  return [x, y, W, Hh];
}
export const activeBubble = (t) => DLG.find((d) => t >= d.s && t < d.e);

// ---------------------------------------------------------------- small tag with a pointer line to (px, py)
// o.age (s since it appeared): it opens in two steps like the card; < 0 = not yet
export function tag(u, str, x, y, o = {}) {
  const size = o.size ?? 30, w = textWidth(str, size) + 22, h = Math.round(size * 0.62) + 18;
  // labels stay inside the safe area (x 60–930 px = 30–465 UI px; TikTok buttons on the right)
  const bx = clamp(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, 30, 465 - w);
  if (o.age != null && o.age < 0) return 0;
  if (o.age != null && o.age < 2 / 60) { panel(u, bx, y + Math.round(h / 4), w, Math.round(h / 2), { inner: false, fill: o.fill, frame: o.frame }); return w; }
  if (o.to) { u.fillStyle = o.color ?? UI.frame; const [tx, ty] = o.to, sx = clamp(tx, bx + 6, bx + w - 6), sy = ty > y ? y + h : y; const n = Math.max(1, Math.abs(ty - sy)); for (let i = 0; i < n; i += 3) u.fillRect(ri(sx + ((tx - sx) * i) / n), ri(sy + ((ty - sy) * i) / n), 2, 2); }
  panel(u, bx, y, w, h, { inner: false, fill: o.fill, frame: o.frame });
  pxText(u, str, bx + 11, y + 9 - Math.round(size * 0.18), size, o.color ?? UI.text);
  return w;
}
// big banner (Jersey 10)
export function banner(u, str, cx, y, size, color, o = {}) {
  const w = textWidth(str, size) + 40, h = Math.round(size * 1.05) + 20;
  panel(u, cx - w / 2, y, w, h, { fill: o.fill });
  pxText(u, str, cx - w / 2 + 20, y + 14, size, color);
  return [w, h];
}
// rubber stamp: red ink on a paper slip; slams in over two frames
export function stamp(u, t, t0, str, cx, cy) {
  const age = t - t0; if (age < 0) return;
  const size = age < 1 / 30 ? 96 : age < 2 / 30 ? 84 : 76, w = textWidth(str, size) + 48, h = ri(size * 1.05) + 26;
  const x = ri(cx - w / 2), y = ri(cy - h / 2);
  panel(u, x, y, w, h, { fill: '#F3E9D2', frame: '#C8333A', inner: false, alpha: 1 });
  u.fillStyle = '#C8333A'; u.fillRect(x + 6, y + 6, w - 12, 2); u.fillRect(x + 6, y + h - 8, w - 12, 2); u.fillRect(x + 6, y + 6, 2, h - 12); u.fillRect(x + w - 8, y + 6, 2, h - 12);
  pxText(u, str, cx, y + 16, size, '#C8333A', { align: 'center' });
}
// error toast (S5): red notification card
export function toast(u, str, x, y, k = 1) {
  const w = textWidth(str, 28) + 52, h = 38, X = ri(x + (1 - k) * 60);
  panel(u, X, y, w, h, { fill: '#3A1218', frame: UI.danger, inner: false });
  u.fillStyle = UI.danger; u.fillRect(X + 10, y + 11, 16, 16); u.fillStyle = '#FFE1E1'; u.fillRect(X + 17, y + 14, 2, 7); u.fillRect(X + 17, y + 23, 2, 2);
  pxText(u, str, X + 34, y + 6, 28, '#FFD9DB');
}
