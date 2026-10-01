// S1 · Karam — the app sinks on day one; then everything rewinds to "tadi sore".
import { canvas, prog, ease, hash, step12, fidx, F, clamp, W, H } from '../core.js';
import { S, CUE } from '../timeline.js';
import { R, px, ring, dither } from '../pixel/draw.js';
import { sky, stars, moon, sea, crate } from '../art/dunia.js';
import { shipBack, shipFront, deckY } from '../art/kapal.js';
import { panel, pxText, triL } from '../ui.js';
import { UI } from '../pixel/palette.js';

const SEA_Y = 270;
// the whole ship is drawn into its own canvas once per palette, then rotated (nearest neighbour)
const shipCache = new Map();
function shipCanvas(P) {
  let cv = shipCache.get(P.key);
  if (cv) return cv;
  cv = canvas(260, 200);
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const o = { x: 120, wl: 150, sail: 'coder', tear: 1, hatch: true, plimsoll: false, bell: false };
  shipBack(g, P, 0, o); shipFront(g, P, 0, o);
  shipCache.set(P.key, cv);
  return cv;
}
// sink progress: mostly sunk from frame 0, rewinds to 0 (upright, afloat)
function sink(t) {
  const [r0, r1] = CUE.karam.rw;
  const p0 = 0.78 + 0.22 * clamp(t / r0);
  return t < r0 ? p0 : p0 * (1 - ease.inOutCubic(clamp((t - r0) / (r1 - r0))));
}
const FLOAT = [[38, 0.0], [76, 0.4], [226, 0.8]]; // floating crates: x, phase

export const karam = {
  view: () => ({ P: 4, cx: 0, cy: 0, hud: false }),
  world(g, t, P) {
    const [r0, r1] = CUE.karam.rw, rw = t >= r0;
    // rewind plays the sinking backwards at 4×
    const tt = rw ? r0 - (t - r0) * 4 : t;
    sky(g, P, 0, 0, 272, SEA_Y + 2, SEA_Y);
    stars(g, P, tt, 0, 0, 270, SEA_Y - 30, 46);
    moon(g, P, 46, 34, 10);
    sea(g, P, tt, 0, 272, SEA_Y, 482);
    // ship: pivot near the bow, under water; stern up
    const p = sink(t), ang = (34 * Math.PI / 180) * p;
    const cv = shipCanvas(P);
    g.save();
    g.translate(176, 262 + 74 * p); g.rotate(ang); g.drawImage(cv, -186, -168); g.restore();
    // bubbles from the hull (rise; fall back while rewinding)
    for (let i = 0; i < 14; i++) {
      const ph = (hash(i, 31) + tt * 0.55) % 1, bx = 120 + hash(i, 32) * 90 + Math.sin(ph * 9 + i) * 2, by = 400 - ph * 135;
      if (by > SEA_Y + 2) { ring(g, bx, by, 1 + (i % 2), P.foam); }
    }
    // under water: dithered sea over the hull
    g.globalAlpha = 0.6; R(g, 0, SEA_Y + 3, 272, 220, P.sea0); g.globalAlpha = 0.3; R(g, 0, SEA_Y + 60, 272, 200, P.sea0); g.globalAlpha = 1;
    sea(g, P, tt, 0, 272, SEA_Y, SEA_Y + 7);
    // floating crates bob; one jumps up on the beat
    FLOAT.forEach(([x, ph], i) => {
      let y = SEA_Y + 4 + (Math.floor((step12(tt) / 3 + ph * 4)) % 2);
      if (i === 2) { const u = tt - CUE.karam.pop; if (u > 0 && u < 0.45) y -= Math.round(Math.sin((u / 0.45) * Math.PI) * 14); }
      if (rw) { const k = ease.inCubic(prog(t, r0, r1)); y -= k * 60; } // rewinding: back up to the deck
      crate(g, P, x, y);
    });
  },
  ui(u, t) {
    const [r0, r1] = CUE.karam.rw, rw = t >= r0;
    // hook: GAME OVER from frame 0, "HARI 1 · RILIS" on its words; typed backwards while rewinding
    const l1 = 'GAME OVER', l2 = 'HARI 1 · RILIS';
    let n1 = l1.length, n2 = t >= CUE.karam.line2 ? l2.length : 0;
    if (rw) { const back = Math.floor((t - r0) * 50); n2 = Math.max(0, n2 - back); n1 = Math.max(0, n1 - Math.max(0, back - l2.length)); }
    if (n1 > 0) {
      panel(u, 30, 150, 435, 150);
      pxText(u, l1, 248, 162, 88, UI.danger, { align: 'center', reveal: n1 });
      pxText(u, l2, 248, 248, 40, UI.text, { align: 'center', reveal: n2 });
    }
    if (rw && Math.floor((t - r0) * 8) % 2 === 0) {
      panel(u, 120, 316, 300, 70);
      triL(u, 166, 336, 29, UI.text); triL(u, 186, 336, 29, UI.text);
      pxText(u, 'TADI SORE', 202, 332, 40, UI.text, { fam: F.jersey, wt: 400 });
    }
  },
  // rewind: horizontal scan bands slip, like an emulator rewinding
  post(c, t) {
    const [r0] = CUE.karam.rw;
    if (t < r0) return;
    const f = fidx(t);
    for (let b = 0; b < 12; b++) {
      const y = Math.floor(hash(b, f) * 1880), h = 8 + Math.floor(hash(b, f + 7) * 40), dx = Math.round((hash(b, f + 3) - 0.5) * 48 / 4) * 4;
      c.drawImage(c.canvas, 0, y, W, h, dx, y, W, h);
    }
  },
};
