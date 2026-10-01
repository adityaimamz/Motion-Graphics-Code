// dunia.js — sky, sea and the props of the harbour and the deck.
import { R, px, hl, vl, line, disc, ell, ring, dither, ditherGrad, text, textW, F35, figure, blit } from '../pixel/draw.js';
import { hash, canvas, step12, mix, hex } from '../core.js';

// ---------------------------------------------------------------- sky (cached per palette + size)
const skyCache = new Map();
export function sky(g, P, x, y, w, h, horizon) {
  const key = [P.key, w, h, horizon].join('|');
  let cv = skyCache.get(key);
  if (!cv) {
    cv = canvas(w, h); const s = cv.getContext('2d');
    const n = 10; // solid bands, like an old game's sky
    for (let b = 0; b < n; b++) R(s, 0, Math.round((b * horizon) / n), w, Math.ceil(horizon / n) + 1, hex(mix(P.sky0, P.sky1, b / (n - 1))));
    R(s, 0, horizon, w, h - horizon, P.sky1);
    skyCache.set(key, cv);
  }
  g.drawImage(cv, Math.round(x), Math.round(y));
}
export function stars(g, P, t, x0, y0, w, h, n = 40) {
  if (P.star === P.sky0) return;
  const st = step12(t);
  for (let i = 0; i < n; i++) {
    const sx = x0 + Math.floor(hash(i, 11) * w), sy = y0 + Math.floor(hash(i, 12) * h);
    if (hash(i * 31 + Math.floor(st / 6), 13) < 0.12) continue; // twinkle
    px(g, sx, sy, P.star);
    if (i % 9 === 0) { px(g, sx - 1, sy, P.sky1); px(g, sx + 1, sy, P.sky1); }
  }
}
export function sunDisc(g, P, cx, cy, r) { disc(g, cx, cy, r + 2, P.sky1); disc(g, cx, cy, r, P.sun); dither(g, cx - r, cy - r, r * 2 + 1, r * 2 + 1, P.sky1, 0); }
export function moon(g, P, cx, cy, r) {
  disc(g, cx, cy, r, P.sun);
  disc(g, cx - 3, cy - 2, 2, P.cloud); disc(g, cx + 4, cy + 3, 1, P.cloud); px(g, cx + 1, cy - 5, P.cloud);
}
export function cloud(g, P, x, y, s = 1) {
  ell(g, x, y, 12 * s, 4 * s, P.cloud); ell(g, x - 8 * s, y + 1, 8 * s, 3 * s, P.cloud); ell(g, x + 9 * s, y + 1, 7 * s, 3 * s, P.cloud);
  hl(g, x - 14 * s, x + 14 * s, y + 4 * s, P.sky1);
}

// ---------------------------------------------------------------- sea
// surface at y; waves step at 12 fps (pixel-game feel). front=true draws only the band that hides hulls.
export function sea(g, P, t, x0, x1, y, y1, o = {}) {
  const st = step12(t) * (o.speed ?? 1), amp = o.amp ?? 1;
  R(g, x0, y + 2, x1 - x0, y1 - y - 2, P.sea0);
  for (let x = x0; x < x1; x++) {
    const h = Math.round(Math.sin(x * 0.11 + st * 0.35) * amp + Math.sin(x * 0.037 - st * 0.21) * amp);
    R(g, x, y + h, 1, 6, P.sea1);
    if (((x + st) % 23) < 6) px(g, x, y + h, P.foam);
    else if (((x * 7 + st) % 13) === 0) px(g, x, y + h + 1, P.sea2);
  }
  // deeper glints
  for (let i = 0; i < 26; i++) {
    const gx = x0 + Math.floor(hash(i, 21) * (x1 - x0)), gy = y + 10 + Math.floor(hash(i, 22) * Math.max(1, y1 - y - 14));
    const len = 2 + Math.floor(hash(i, 23) * 4), sh = (st + i * 3) % 18;
    if (sh < 12) hl(g, gx + (sh >> 2), gx + (sh >> 2) + len, gy, P.sea1);
  }
}
// a strip of waves in front of a hull (hides what is under water)
export function seaFront(g, P, t, x0, x1, y, y1) { sea(g, P, t + 0.37, x0, x1, y + 1, y1, { amp: 0.8 }); }

// ---------------------------------------------------------------- harbour
export function dock(g, P, x0, x1, y) {
  for (let px0 = x0 + 4; px0 < x1; px0 += 14) { R(g, px0, y, 4, 60, P.wood0); R(g, px0 + 3, y, 1, 60, P.ink); }
  R(g, x0, y - 4, x1 - x0, 5, P.wood2); for (let c = x0; c < x1; c += 9) vl(g, c, y - 4, y, P.wood1);
  hl(g, x0, x1, y + 1, P.ink);
  // bollard + mooring rope
  R(g, x1 - 10, y - 9, 5, 5, P.iron); R(g, x1 - 11, y - 10, 7, 2, P.iron);
}
// crane: A-frame on the dock, boom out to tipX; the hook hangs at (hookX, hookY) from a trolley on the boom
export function crane(g, P, x, y, tipX, hookX, hookY, H = 70) {
  const by = (xx) => y - H - ((xx - x) / (tipX - x)) * 4;
  line(g, x - 10, y, x, y - H, P.wood0, 2); line(g, x + 10, y, x, y - H, P.wood0, 2); hl(g, x - 6, x + 6, y - 30, P.wood1);
  line(g, x, y - H, tipX, by(tipX), P.wood1, 2); line(g, x, y - H + 1, tipX, by(tipX) + 1, P.wood0);
  line(g, x - 2, y - H + 8, tipX, by(tipX), P.rope1);
  R(g, x - 4, y - H - 4, 8, 6, P.iron);
  const ty = Math.round(by(hookX));
  R(g, hookX - 2, ty - 1, 5, 3, P.iron);
  vl(g, hookX, ty + 2, hookY - 3, P.rope1);
  R(g, hookX - 1, hookY - 3, 3, 2, P.iron); px(g, hookX - 2, hookY - 1, P.iron); px(g, hookX + 2, hookY - 1, P.iron);
}

// ---------------------------------------------------------------- props
// o.open: lid lifted by this many px (0 = closed); o.shake: rattles at 12 fps (o.t)
export function crate(g, P, x, y, o = {}) { // x,y = bottom-left; 16×13
  const open = o.open ?? 0;
  const cv = figure(['crate', open ? 1 : 0, P.key].join('|'), 20, 17, (f) => {
    const r = (a, b, w, h, c) => { f.fillStyle = c; f.fillRect(a + 2, b + 2, w, h); };
    r(0, 0, 16, 13, P.wood1); r(0, 11, 16, 2, P.wood0); r(0, 0, 2, 13, P.wood0); r(14, 0, 2, 13, P.wood0);
    for (let k = 3; k < 11; k += 4) r(2, k, 12, 1, P.wood0);
    text(f, '</>', 4, 6, P.ink, F35); // a crate of AI code
    if (!open) { r(0, 0, 16, 2, P.wood2); r(12, 0, 3, 2, P.seal); }
    else r(2, 0, 12, 2, P.ink);
  }, P.ink);
  const sh = o.shake ? (step12(o.t ?? 0) % 2 ? 1 : -1) : 0;
  blit(g, cv, x - 2 + sh, y - 15);
  if (open) { R(g, x - 1 + sh, y - 15 - open, 18, 3, P.ink); R(g, x + sh, y - 14 - open, 16, 1, P.wood2); px(g, x + 12, y - 14 - open, P.seal); }
}
export function barrel(g, P, x, y) { // bottom-centre
  R(g, x - 6, y - 14, 12, 14, P.wood1); R(g, x - 7, y - 11, 14, 8, P.wood1); hl(g, x - 7, x + 6, y - 11, P.iron); hl(g, x - 7, x + 6, y - 4, P.iron);
  R(g, x + 3, y - 14, 2, 14, P.wood0); hl(g, x - 5, x + 4, y - 15, P.wood2);
}
export function laptop(g, P, t, x, y, lines = 6, glow = 1) { // x,y = bottom-left of the base; 18 wide
  R(g, x, y - 2, 18, 2, P.laptop1); R(g, x + 1, y - 3, 16, 1, P.laptop);
  R(g, x + 2, y - 15, 14, 12, P.laptop1); R(g, x + 3, y - 14, 12, 10, P.screen);
  const cols = [P.code1, P.code2, P.code3, P.code5];
  for (let i = 0; i < Math.min(lines, 5); i++) hl(g, x + 4 + (i % 2) * 2, x + 4 + (i % 2) * 2 + 3 + Math.floor(hash(i, 5) * 5), y - 13 + i * 2, cols[i % 4]);
}
export function cup(g, P, x, y) { R(g, x, y - 6, 4, 6, P.cup); R(g, x, y - 4, 4, 3, P.coffee); R(g, x, y - 5, 4, 1, P.milk); vl(g, x + 2, y - 9, y - 7, P.straw); }
export function deckChair(g, P, x, y) { // under a seated figure, x = centre, y = deck
  line(g, x - 15, y, x - 13, y - 24, P.wood0, 2); line(g, x + 15, y, x + 13, y - 24, P.wood0, 2);
  for (let r = 0; r < 14; r++) hl(g, x - 13, x + 13, y - 24 + r, r % 6 < 3 ? P.chair0 : P.chair1);
  R(g, x - 14, y - 25, 28, 2, P.wood1); R(g, x - 15, y - 10, 30, 2, P.wood1); R(g, x - 15, y - 9, 30, 1, P.wood0);
}
export function book(g, P, x, y, open = 0) {
  if (!open) { R(g, x, y - 7, 9, 7, P.book); R(g, x + 1, y - 6, 7, 5, P.book1); R(g, x + 8, y - 7, 1, 7, P.paper); return; }
  R(g, x - 4, y - 7, 17, 7, P.book); R(g, x - 3, y - 6, 7, 5, P.paper); R(g, x + 5, y - 6, 7, 5, P.paper);
  for (let i = 0; i < 3; i++) { hl(g, x - 2, x + 2, y - 5 + i * 2, P.paper1); hl(g, x + 6, x + 10, y - 5 + i * 2, P.paper1); }
}
// scroll of code: rows of syntax bars; k = unrolled 0..1; returns the screen y of row i
export function scroll(g, P, x, y, w, h, k, rows = 14) {
  const hh = Math.round(h * k);
  R(g, x - 2, y - 3, w + 4, 4, P.paper1); R(g, x - 3, y - 2, 1, 2, P.wood0); R(g, x + w + 2, y - 2, 1, 2, P.wood0);
  if (hh <= 0) return;
  R(g, x, y, w, hh, P.paper); R(g, x + w - 2, y, 2, hh, P.paper1);
  const cols = [P.code3, P.code1, P.code2, P.code5, P.code4];
  for (let i = 0; i < rows; i++) {
    const ry = y + 3 + i * 4; if (ry > y + hh - 3) break;
    let cx = x + 3 + Math.floor(hash(i, 41) * 3) * 2;
    for (let s = 0; s < 3; s++) { const len = 3 + Math.floor(hash(i * 3 + s, 42) * 7); if (cx + len > x + w - 4) break; hl(g, cx, cx + len, ry, cols[(i + s) % 5]); hl(g, cx, cx + len, ry + 1, cols[(i + s) % 5]); cx += len + 3; }
  }
  R(g, x - 2, y + hh - 1, w + 4, 4, P.paper1);
}
export function buoy(g, P, t, x, y, flag = true) { // x,y = waterline centre
  const b = step12(t) % 6 < 3 ? 0 : 1;
  ell(g, x, y - 3 + b, 4, 4, P.red); R(g, x - 4, y - 4 + b, 9, 2, P.buoyW);
  if (flag) { vl(g, x, y - 16 + b, y - 6 + b, P.iron); R(g, x + 1, y - 16 + b, 6, 4, P.red); }
}
export function anchorShape(g, P, x, y) {
  vl(g, x, y - 9, y, P.iron); hl(g, x - 4, x + 4, y, P.iron); px(g, x - 4, y - 1, P.iron); px(g, x + 4, y - 1, P.iron);
  hl(g, x - 2, x + 2, y - 7, P.iron); ring(g, x, y - 10, 1, P.iron);
}
export function ball(g, P, x, y, r) { disc(g, x, y, r, P.iron); disc(g, x - Math.max(1, r * 0.35), y - Math.max(1, r * 0.35), Math.max(1, r * 0.3), P.metal); }
export function puff(g, P, x, y, k) { // smoke, k 0..1
  if (k <= 0 || k >= 1) return;
  const r = 2 + k * 7;
  ell(g, x, y, r, r * 0.8, P.smoke); ell(g, x + r * 0.7, y - r * 0.4, r * 0.6, r * 0.5, P.smoke);
  dither(g, x - r - 2, y - r - 2, r * 2 + 6, r * 2 + 4, P.sky1, k);
}
export function splash(g, P, t0, t, x, y, n = 10, h = 14) {
  const u = t - t0; if (u < 0 || u > 0.7) return;
  for (let i = 0; i < n; i++) {
    const a = (hash(i, 61) - 0.5) * 2.2, v = 0.6 + hash(i, 62) * 0.6, k = Math.floor(u * 12) / 12;
    px(g, x + Math.sin(a) * v * k * 30, y - (Math.cos(a) * v * h * k * 3 - 36 * k * k), i % 3 ? P.foam : P.sea2);
  }
}
