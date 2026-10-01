// kapal.js — the ship "APP", side view facing right (forward = right, like the brand arrow).
// Coordinates: o.x = hull centre, o.wl = waterline. Deck band yd-6..yd, hull side yd..keel, mast at x+5.
// Drawn in two passes so people stand *on* the deck: shipBack() (mast, sail, deck, wheel …) then the
// characters, then shipFront() (railing + hull side, or the cut-away hold).
import { R, px, hl, vl, line, disc, ring, poly, dither, text, textW, F57, F35 } from '../pixel/draw.js';
import { hash } from '../core.js';

export const HOLD = { wall: '#5A3E2B', seam: '#4C3324', rib: '#7A5538', floor: '#3E2A1D', water: '#2F7488', waterL: '#9AD3E0' };
export const SHIP = { half: 75, deck: 22, keel: 18, mastDx: 5, mastH: 122, sailW: 112, sailH: 82 };
export const deckY = (o) => o.wl - SHIP.deck;
export const keelY = (o) => o.wl + SHIP.keel;
export const mastX = (o) => o.x + SHIP.mastDx;
export const sailTop = (o) => deckY(o) - SHIP.mastH + 10;
export const stand = (o) => deckY(o) - 2;          // where feet go on deck
export const holdFloor = (o) => keelY(o) - 4;      // where feet go in the hold
export const WHEEL = (o) => [o.x - 52, deckY(o) - 26];
export const LAMP = (o, i) => [mastX(o) + 3, deckY(o) - 22 - i * 8];
export const CANNON = (o) => [o.x + 46, deckY(o) - 4];
export const HATCH = (o) => [o.x - 16, o.x + 14];

// hull silhouette (side view)
export function hullPts(o) {
  const x = o.x, yd = deckY(o), yk = keelY(o), wl = o.wl;
  return [[x - 75, yd - 10], [x - 40, yd - 10], [x - 40, yd], [x + 62, yd], [x + 79, yd - 5], [x + 74, wl + 2], [x + 62, yk - 4], [x + 48, yk],
    [x - 58, yk], [x - 70, yk - 6], [x - 74, wl]];
}

// ---------------------------------------------------------------- sail
// o.sail: 'coder' | 'engineer' | 'furled' | 'none'; o.sailK: unfurl 0..1; o.tear: 0..1 (S6 bite); o.drop: 0..1 (S15 falls)
export function drawSail(g, P, o, word, k = 1, tear = 0, drop = 0) {
  const mx = mastX(o), top = sailTop(o) + 2, W2 = SHIP.sailW / 2, Hs = Math.round(SHIP.sailH * k);
  if (Hs <= 0) return;
  const piece = (clipFn, dx, dy) => {
    g.save();
    g.beginPath(); clipFn(); g.clip();
    g.translate(dx, dy);
    // cloth with seams, billowing bottom edge
    for (let c = -W2; c < W2; c++) {
      const u = (c + W2) / SHIP.sailW, bel = Math.round(3 * Math.sin(Math.PI * u));
      const h = Hs + (k >= 1 ? bel : 0);
      const col = (c + W2) % 14 === 0 ? P.cloth1 : c > W2 - 9 ? P.cloth1 : P.cloth;
      R(g, mx + c, top, 1, h, col);
      if (k >= 1) R(g, mx + c, top + h - 3, 1, 3, P.cloth1);
    }
    // letters (bitmap, part of the cloth)
    const L1 = 'VIBE', L2 = word === 'engineer' ? 'ENGINEER' : 'CODER';
    g.save(); g.beginPath(); g.rect(mx - W2, top, SHIP.sailW, Hs); g.clip();
    text(g, L1, mx - Math.round(textW(L1, F57, 2, 1) / 2), top + 16, P.ink, F57, 2, 1);
    text(g, L2, mx - Math.round(textW(L2, F57, 2, 1) / 2), top + 40, P.ink, F57, 2, 1);
    g.restore();
    if (k < 1) { R(g, mx - W2, top + Hs - 3, SHIP.sailW, 4, P.cloth2); R(g, mx - W2, top + Hs - 1, SHIP.sailW, 1, P.cloth1); } // the roll
    g.restore();
  };
  const dy = Math.round(drop * drop * 120);
  if (tear <= 0) piece(() => g.rect(0, 0, 9999, 9999), 0, dy);
  else {
    // a diagonal bite: the lower-right flap sags away from the upper-left piece
    const x0 = mx - W2 + 34, x1 = mx + W2 - 8, y0 = top - 2, y1 = top + SHIP.sailH + 6;
    const zig = (fn) => { const n = 9; for (let i = 0; i <= n; i++) { const f = i / n; fn(x0 + (x1 - x0) * f + (i % 2 ? 3 : -3), y0 + (y1 - y0) * f); } };
    piece(() => { g.moveTo(-9999, -9999); g.lineTo(x0, -9999); zig((x, y) => g.lineTo(x, y)); g.lineTo(-9999, 9999); g.closePath(); }, 0, dy);
    const s = Math.round(tear * 3);
    piece(() => { g.moveTo(9999, -9999); g.lineTo(x0, -9999); zig((x, y) => g.lineTo(x, y)); g.lineTo(9999, 9999); g.closePath(); }, s, s + 1 + dy);
  }
}
function furled(g, P, o) {
  const mx = mastX(o), top = sailTop(o) + 1, W2 = SHIP.sailW / 2;
  R(g, mx - W2 + 2, top, SHIP.sailW - 4, 6, P.cloth); R(g, mx - W2 + 2, top + 4, SHIP.sailW - 4, 2, P.cloth2);
  for (let c = -W2 + 8; c < W2 - 4; c += 16) R(g, mx + c, top - 1, 2, 8, P.rope1);
}

// ---------------------------------------------------------------- back pass
export function shipBack(g, P, t, o) {
  const x = o.x, yd = deckY(o), mx = mastX(o), top = sailTop(o);
  // mast + yard
  R(g, mx - 1, top - 8, 3, yd - top + 8, P.wood1); R(g, mx + 1, top - 8, 1, yd - top + 8, P.wood0);
  R(g, mx - 2, top - 12, 5, 4, P.wood0);
  R(g, mx - SHIP.sailW / 2 - 2, top, SHIP.sailW + 4, 2, P.wood0);
  // rigging lines
  line(g, mx, top - 10, x + 92, yd - 14, P.rope1); line(g, mx, top - 10, x - 72, yd - 12, P.rope1);
  // bowsprit
  line(g, x + 76, yd - 6, x + 96, yd - 14, P.wood0, 2);
  // sail
  if (o.sail === 'furled') furled(g, P, o);
  else if (o.sail && o.sail !== 'none') drawSail(g, P, o, o.sail, o.sailK ?? 1, o.tear ?? 0, 0);
  if (o.sail2) drawSail(g, P, o, o.sail2.word, o.sail2.k, 0, 0);
  if (o.oldSail) drawSail(g, P, o, 'coder', 1, 1, o.oldSail.drop); // torn sail falling (S15)
  // lantern on the mast
  if (o.lantern !== false) {
    const lx = mx - 6, ly = yd - 52;
    line(g, mx - 1, ly - 3, lx + 1, ly - 3, P.iron);
    if (P.key >= '0.6' && P.key <= '1.4') dither(g, lx - 6, ly - 6, 15, 15, P.lantern, 0.12);
    R(g, lx - 1, ly - 1, 5, 6, P.ink); R(g, lx, ly, 3, 4, P.lantern); px(g, lx + 1, ly - 2, P.ink);
  }
  // signal lamps (S12): lamps[i] = 0 off, 1 green, 2 amber
  if (o.lamps) for (let i = 0; i < 6; i++) {
    const [lx, ly] = LAMP(o, i);
    R(g, lx - 1, ly - 1, 5, 5, P.ink); R(g, lx, ly, 3, 3, o.lamps[i] === 1 ? P.green : o.lamps[i] === 2 ? P.amber : P.lampoff);
    if (o.lamps[i] === 1) px(g, lx, ly, '#D8FFE2');
  }
  // deck band (seen slightly from above) + poop deck
  R(g, x - 40, yd - 6, 104, 6, P.wood2); for (let c = x - 40; c < x + 64; c += 7) vl(g, c, yd - 6, yd - 1, P.wood1);
  R(g, x - 75, yd - 16, 35, 6, P.wood2);
  // cargo hatch
  if (o.hatch !== false) { const [h0, h1] = HATCH(o); R(g, h0, yd - 5, h1 - h0, 4, P.ink); if (o.hatchFill) R(g, h0 + 1, yd - 5, Math.round((h1 - h0 - 2) * o.hatchFill), 2, P.wood1); }
  // ship's bell on the stern post
  if (o.bell !== false) {
    const bx = x - 70, by = yd - 30, sw = o.bellSwing ?? 0;
    vl(g, x - 74, by - 4, yd - 16, P.wood0); hl(g, x - 74, bx + 1, by - 4, P.wood0);
    R(g, bx - 2 + sw, by - 2, 5, 4, P.gold); hl(g, bx - 3 + sw, bx + 3 + sw, by + 2, P.gold); px(g, bx + sw * 2, by + 3, P.ink);
  }
  if (o.wheel !== false) drawWheel(g, P, o);
  // cannon at the bow (battle)
  if (o.cannon) {
    const [cx, cy] = CANNON(o), rec = o.recoil ?? 0;
    for (let i = 0; i < 12; i++) R(g, cx - 4 + i - rec, cy - 4 - Math.round(i * 0.45), 3, 4, i > 9 ? P.ink : P.iron);
    disc(g, cx - 2 - rec, cy, 2, P.wood0); disc(g, cx + 3 - rec, cy, 2, P.wood0);
  }
}

// wheel on the poop deck (separate so a character can stand behind it)
export function drawWheel(g, P, o) {
  const [wx, wy] = WHEEL(o), a = o.wheelA ?? 0, yd = deckY(o);
  R(g, wx - 1, wy, 2, yd - 16 - wy, P.wood0);
  ring(g, wx, wy, 6, P.wood0);
  for (let s = 0; s < 8; s++) { const an = a + (s * Math.PI) / 4; line(g, wx, wy, wx + Math.round(Math.cos(an) * 8), wy + Math.round(Math.sin(an) * 8), P.wood1); }
  ring(g, wx, wy, 5, P.wood2); disc(g, wx, wy, 1, P.gold);
}
export const poopY = (o) => deckY(o) - 12; // feet on the poop deck

// ---------------------------------------------------------------- front pass
export function shipFront(g, P, t, o) {
  const x = o.x, yd = deckY(o), yk = keelY(o), wl = o.wl;
  if (o.cut) return holdFront(g, P, t, o);
  // railing in front of the people
  hl(g, x - 40, x + 66, yd - 8, P.wood0);
  for (let c = x - 38; c < x + 66; c += 6) vl(g, c, yd - 8, yd - 1, P.wood1);
  hl(g, x - 75, x - 40, yd - 18, P.wood0); for (let c = x - 73; c < x - 40; c += 6) vl(g, c, yd - 18, yd - 11, P.wood1);
  // hull side
  const pts = hullPts(o);
  poly(g, pts, P.wood1);
  for (let y = yd + 3; y < yk; y += 5) hl(g, x - 74, x + 76, y, P.wood0);
  R(g, x - 75, yd - 10, 35, 2, P.wood2); R(g, x - 40, yd, 103, 2, P.wood2);
  // stern windows + name
  R(g, x - 70, yd - 7, 4, 3, P.ink); R(g, x - 63, yd - 7, 4, 3, P.ink);
  if (P.key >= '0.6' && P.key <= '1.4') { R(g, x - 69, yd - 6, 2, 1, P.lantern); R(g, x - 62, yd - 6, 2, 1, P.lantern); }
  text(g, 'APP', x - 66, wl - 12, P.gold, F35, 1, 1);
  // load line (plimsoll) — goes under when the ship is overloaded
  if (o.plimsoll !== false) {
    const py = wl - 4, pxx = x + 38, col = o.plimRed ? P.red : P.strap;
    ring(g, pxx, py, 3, col); hl(g, pxx - 5, pxx + 5, py, col);
  }
  // anchor hanging at the bow
  if (o.anchor !== false && !o.anchorDown) { const ax = x + 66, ay = yd + 4; vl(g, ax, ay, ay + 6, P.iron); hl(g, ax - 3, ax + 3, ay + 7, P.iron); px(g, ax - 3, ay + 6, P.iron); px(g, ax + 3, ay + 6, P.iron); hl(g, ax - 1, ax + 1, ay, P.iron); }
  // outline
  for (let i = 0; i < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % pts.length]; line(g, a, b, c, d, P.ink); }
}

// cut-away hold (S5–S7): interior wall, ribs, floor, water, holes with spouts
function holdFront(g, P, t, o) {
  const x = o.x, yd = deckY(o), yk = keelY(o), pts = hullPts(o);
  g.save(); g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.clip();
  // the hold is lit by its own lantern, so it keeps warm, readable colours at night
  R(g, x - 80, yd - 12, 165, yk - yd + 14, HOLD.wall);
  for (let y = yd + 6; y < yk - 4; y += 5) hl(g, x - 80, x + 85, y, HOLD.seam);
  for (let c = x - 66; c < x + 70; c += 12) R(g, c, yd, 2, yk - yd, HOLD.rib);
  R(g, x - 80, yd, 165, 3, HOLD.floor);            // deck planks seen in section
  R(g, x - 80, yk - 4, 165, 5, HOLD.floor);        // floor
  const lx = x + 24, ly = yd + 3; vl(g, lx, ly, ly + 3, P.iron); R(g, lx - 2, ly + 4, 5, 6, P.ink); R(g, lx - 1, ly + 5, 3, 4, '#F5B342');
  g.restore();
  o.holdExtras?.(g);
  // hull wall in section (thick)
  for (let i = 0; i < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % pts.length]; line(g, a, b, c, d, P.wood0, 3); line(g, a, b, c, d, P.ink); }
  // hatch opening + ladder
  const [h0, h1] = HATCH(o);
  R(g, h0, yd, h1 - h0, 3, P.hold);
  for (let y = yd + 2; y < yk - 4; y += 4) hl(g, h1 - 7, h1 - 3, y, P.wood2);
  vl(g, h1 - 8, yd, yk - 5, P.wood1); vl(g, h1 - 2, yd, yk - 5, P.wood1);
  // railing on top
  hl(g, x - 40, x + 66, yd - 8, P.wood0); for (let c = x - 38; c < x + 66; c += 6) vl(g, c, yd - 8, yd - 1, P.wood1);
}

// holes in the cut-away wall: positions are fixed (hash), each opens at its own time
export function holePos(o, i) {
  const x = o.x, yd = deckY(o), yk = keelY(o);
  return [Math.round(x - 60 + hash(i, 71) * 128), Math.round(o.wl - 4 + hash(i, 72) * (yk - 8 - o.wl))];
}
export function drawHoles(g, P, t, o, opened, spoutK = 1, patched = 0) {
  for (let i = 0; i < opened.length; i++) {
    if (!opened[i]) continue;
    const [hx, hy] = holePos(o, i), age = opened[i];
    if (i < patched) { R(g, hx - 2, hy - 1, 5, 3, P.wood2); px(g, hx - 2, hy - 1, P.ink); px(g, hx + 2, hy + 1, P.ink); continue; }
    R(g, hx - 1, hy - 1, 3, 3, P.ink);
    if (spoutK <= 0) continue;
    // spout: a 2-px jet of droplets along a short arc, stepping at 12 fps
    const st = Math.floor(t * 12), dir = hash(i, 73) < 0.5 ? -1 : 1, len = Math.min(1, age * 3) * spoutK;
    for (let d = 0; d < 8; d++) {
      const f = ((d + st) % 8) / 8, dx = dir * f * 14 * len, dy = -3 * f + 12 * f * f * len;
      R(g, Math.round(hx + dx), Math.round(hy + dy), 2, d % 3 ? 1 : 2, d % 2 ? P.foam : HOLD.waterL);
    }
  }
}
