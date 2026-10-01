// makhluk.js — the bugs (purple beetles, red eyes) and the kraken (one giant bug; purple like them).
// Purple = bug, everywhere in the film.
import { R, px, hl, disc, ell, dither, figure, blit } from '../pixel/draw.js';
import { hash, step12 } from '../core.js';

// ---------------------------------------------------------------- bug: 10×7 beetle seen from the side, 2 walk frames
// x = centre, y = feet (world px)
export function bug(g, P, x, y, frame = 0, flip = false) {
  const cv = figure(['bug', frame, P.key].join('|'), 16, 12, (f) => {
    const r = (a, b, w, h, c) => { f.fillStyle = c; f.fillRect(a + 2, b + 2, w, h); };
    r(2, 1, 5, 1, P.bug0); r(1, 2, 7, 3, P.bug0); r(2, 5, 5, 1, P.bug0);
    r(2, 2, 2, 1, P.bug1); r(2, 3, 1, 1, P.bug1); r(4, 1, 1, 5, P.bug2);
    r(8, 2, 2, 3, P.bugleg); r(9, 2, 1, 1, '#FFFFFF'); r(9, 3, 1, 1, P.bugeye);
    r(10, 1, 1, 1, P.bugleg); r(11, 0, 1, 1, P.bugleg);
    for (const k of frame ? [1, 4, 7] : [2, 5, 8]) r(k, 6, 1, 1, P.bugleg);
  }, P.ink);
  blit(g, cv, x - 7, y - 9, flip);
}

// ---------------------------------------------------------------- kraken
// o: { x, wl (waterline), y (head centre), rise 0..1, blink, hurt, s (scale), bases (tentacle i → base x) }
export const KR = { rx: 34, ry: 40 };
// six tentacles = six bugs: base offset from the head, height, lean
const TENT = [[-64, 96, -16], [-46, 116, -24], [-28, 84, -8], [22, 108, -4], [40, 92, 12], [58, 74, 20]];
export const TENTACLES = TENT.length;
export function tentaclePts(o, i, t) {
  const sc = o.s ?? 1, [dx, h, lean] = TENT[i], bx = o.bases?.[i] ?? o.x + dx * sc, by = o.wl;
  const st = step12(t), sway = Math.sin(st * 0.5 + i * 1.7) * 3 * sc, H = h * o.rise * sc;
  const pts = [];
  for (let s = 0; s <= 14; s++) {
    const f = s / 14, curl = f * f * f;
    pts.push([bx + (lean * f + curl * (i < 3 ? -14 : 14)) * sc + sway * f, by - H * f + curl * 18 * sc]);
  }
  return pts;
}
export function drawTentacle(g, P, o, i, t, k = 1) {
  if (k <= 0) return;
  const pts = tentaclePts(o, i, t), n = Math.max(2, Math.round(pts.length * k));
  for (let s = 0; s < n; s++) { const [x, y] = pts[s], r = Math.max(1.5, 6 - s * 0.32); disc(g, x, y, r + 1, P.ink); }
  for (let s = 0; s < n; s++) {
    const [x, y] = pts[s], r = Math.max(1.5, 6 - s * 0.32);
    disc(g, x, y, r, P.kr0); px(g, x + Math.round(r * 0.5), y, P.kr1);
    if (s % 2 === 0 && s < n - 2) px(g, x - Math.round(r * 0.6), y, P.krsuck);
  }
}
export function drawKrakenHead(g, P, o, t) {
  const { x, y } = o, rx = KR.rx, ry = KR.ry;
  ell(g, x - 4, y - ry + 4, rx * 0.55 + 1, ry * 0.55 + 1, P.ink); ell(g, x, y, rx + 1, ry + 1, P.ink);
  ell(g, x - 4, y - ry + 4, rx * 0.55, ry * 0.55, P.kr0); ell(g, x, y, rx, ry, P.kr0);
  ell(g, x + 8, y + 4, rx - 10, ry - 8, P.kr1); ell(g, x - 2, y - 2, rx - 6, ry - 8, P.kr0);
  for (let i = 0; i < 9; i++) { const a = hash(i, 81) * 6.28, d = hash(i, 82) * 0.7; ell(g, x + Math.cos(a) * rx * d, y - ry * 0.3 + Math.sin(a) * ry * d * 0.6, 2, 1, P.krspot); }
  // eyes: yellow, horizontal pupils
  const ey = y + 12;
  for (const ex of [x - 13, x + 11]) {
    ell(g, ex, ey, 7, 5, P.ink); ell(g, ex, ey, 6, 4, P.kreye);
    if (o.blink) hl(g, ex - 6, ex + 6, ey, P.ink);
    else { R(g, ex - 4, ey - 1, 9, 2, P.ink); if (o.hurt) { px(g, ex - 4, ey - 3, P.ink); px(g, ex + 4, ey - 3, P.ink); } }
  }
  hl(g, x - 20, x - 6, ey - 7, P.kr1); hl(g, x + 4, x + 18, ey - 7, P.kr1);
  // teeth (a grin of little bugs' teeth)
  for (let i = 0; i < 6; i++) R(g, x - 10 + i * 4, ey + 12, 3, 2, i % 2 ? P.krsuck : '#FFFFFF');
  hl(g, x - 11, x + 13, ey + 11, P.ink);
}
// ink cloud when it flees: spreads in the water under (x, wl) and thins out puff by puff (no fill rectangle)
export function inkCloud(g, P, x, wl, k) {
  if (k <= 0 || k >= 1) return;
  const r = 8 + k * 46, gone = Math.max(0, (k - 0.55) / 0.45);
  g.save(); g.beginPath(); g.rect(x - 200, wl + 1, 400, 300); g.clip(); // only below the surface
  for (let i = 0; i < 11; i++) {
    if (hash(i, 93) < gone) continue;
    const a = hash(i, 91) * 3.14, d = hash(i, 92) * r * 0.7;
    ell(g, x + Math.cos(a) * d * 1.3, wl + 4 + Math.sin(a) * d * 0.5, r * 0.42, r * 0.22, P.inkcloud);
  }
  g.restore();
}
