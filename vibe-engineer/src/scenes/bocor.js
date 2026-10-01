// S5–S6 · Bocor — midnight: error reports pour in, 38 bugs, 38 leaks. Then what a bug *is* (one wrong line of
// code), and where they were hiding: in the functions Bayu never read (the crates of AI code he never opened).
import { fidx, hash } from '../core.js';
import { S, CUE } from '../timeline.js';
import { R, px, hl, vl, dither } from '../pixel/draw.js';
import { sky, stars, moon, sea, seaFront, crate, deckChair } from '../art/dunia.js';
import { shipBack, shipFront, drawWheel, deckY, keelY, poopY, stand, holdFloor, drawHoles, hullPts, HOLD } from '../art/kapal.js';
import { palette, UI, PROP } from '../pixel/palette.js';
import { drawBayu } from '../art/bayu.js';
import { drawKursor, blinkOff } from '../art/kursor.js';
import { bug } from '../art/makhluk.js';
import { codeWin } from '../art/props.js';
import { panel, pxText, toast, tag } from '../ui.js';
import { sailD, deckCrates, WL0, SHIP_X } from './dermaga.js';
import { step, toUI, FLOOR } from './common.js';

// ---------------------------------------------------------------- the cut-away ship (S5)
export const HO = { x: 92, wl: 194 };
const level2y = (o, L) => Math.round(holdFloor(o) - L * (holdFloor(o) - deckY(o) - 2));
const CRATES = [[-15, 0], [1, 0], [-7, 1]]; // hold crates: dx, stack level
export const holeCount = (t) => CUE.malam.holes.filter((h) => t >= h).length;
export const BAYU_HOLD = (o) => [o.x - 44, holdFloor(o)];

export function holdScene(g, t, P, st) {
  const o = { ...HO, cut: true, sail: 'coder', tear: st.tear ?? 0, wheel: false, hatch: false };
  const Pc = palette(Math.min(+P.key, 0.4)); // inside the hold: lantern light
  sky(g, P, -2, -2, 186, o.wl + 4, o.wl + 2);
  stars(g, P, t, 0, 0, 182, o.wl - 20, 34);
  moon(g, P, 20, 114, 7); // low on the left, under the error reports
  sea(g, P, t, -2, 184, o.wl, 322);
  shipBack(g, P, t, o);
  if (st.kursor) drawKursor(g, P, st.kursor.x, st.kursor.y, st.kursor);
  drawWheel(g, P, o);
  o.holdExtras = (h) => {
    drawHoles(h, Pc, t, o, st.opened, 1, 0);
    CRATES.forEach(([dx, lv]) => crate(h, Pc, o.x + dx, holdFloor(o) + 1 - lv * 13));
    drawBayu(h, Pc, BAYU_HOLD(o)[0], BAYU_HOLD(o)[1], st.bayu);
    const wy = level2y(o, st.level ?? 0), sf = Math.floor(fidx(t) / 5);
    if (st.level > 0) { // flat translucent water (a dither reads as a checkerboard)
      h.globalAlpha = 0.62; R(h, o.x - 80, wy + 1, 165, keelY(o) - wy, HOLD.water); h.globalAlpha = 1;
      for (let x = o.x - 76; x < o.x + 80; x++) px(h, x, wy + ((x + sf) % 7 < 3 ? 0 : 1), HOLD.waterL);
    }
  };
  shipFront(g, P, t, o);
  // the sea in front of the hull, but not over the cut-away: we look into the hold below the waterline
  g.save(); g.beginPath(); g.rect(-4, o.wl - 4, 192, 330); hullPts(o).forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.clip('evenodd');
  seaFront(g, P, t, -2, 184, o.wl, 322);
  g.restore();
  return o;
}

// ---------------------------------------------------------------- S5 · tengah malam, laporan error
const shotA = (t) => t < CUE.malam.spout0;
const TOASTS = [[0, 'ERROR 500'], [3, 'login gagal'], [7, 'bayar error'], [12, 'crash!'], [18, 'timeout'], [25, 'data hilang'], [33, 'ERROR 500']];
export const malam = {
  view(t) { return shotA(t) ? { P: 4, cx: Math.max(0, sailD(t) - 6), cy: 0 } : { P: 6, cx: 0, cy: 0 }; },
  world(g, t, P, v) {
    if (shotA(t)) { // the wide, sailing on through the night
      const cx = v.cx, o = { x: SHIP_X + sailD(t), wl: WL0 + 2, sail: 'coder', wheel: false, hatchFill: 1 };
      sky(g, P, cx, 0, 272, WL0 + 2, WL0); stars(g, P, t, cx, 0, 270, 260, 50); moon(g, P, cx + 46, 160, 10);
      sea(g, P, t, cx, cx + 272, WL0, 482);
      shipBack(g, P, t, o);
      drawKursor(g, P, o.x - 62, poopY(o), { hat: true, arms: 'wheel', off: blinkOff(t) });
      drawWheel(g, P, o);
      deckCrates(g, P, o);
      deckChair(g, P, o.x + 10, stand(o));
      drawBayu(g, P, o.x + 10, stand(o) + 1, { legs: 'chair', arm: 'cup', eyes: 'closed', rank: 0 });
      shipFront(g, P, t, o);
      seaFront(g, P, t, cx, cx + 272, WL0, 482);
      return;
    }
    const n = holeCount(t), opened = CUE.malam.holes.map((h) => (t >= h ? t - h : 0));
    holdScene(g, t, P, {
      level: 0.1 + 0.4 * (n / 38), opened,
      bayu: { arm: 'down', armL: 'down', eyes: 'closed', mouth: t > S.malam.dlg.s - 0.1 ? 'o' : 'smile', rank: 0 },
      kursor: { x: HO.x - 64, y: poopY(HO), hat: true, arms: 'wheel', off: blinkOff(t) },
    });
  },
  ui(u, t) {
    const C = CUE.malam;
    if (t < C.clockOut) { // in the empty sky, clear of the sail
      panel(u, 40, 196, 180, 84);
      pxText(u, t < C.flip ? '23.46' : '23.47', 130, 208, 64, UI.text, { align: 'center' });
    }
    // the error reports: newest on top, three at a time, down the left (clear of the VIBE CODER letters)
    const live = TOASTS.filter(([i]) => t >= C.holes[i]);
    live.slice(-3).reverse().forEach(([i, s], k) => toast(u, s, 34, 190 + k * 46, Math.min(1, (t - C.holes[i]) / 0.08)));
  },
  cardOpts(t) { return { label: `BUG: ${holeCount(t)}` }; },
  anchor(who, t) { if (shotA(t)) return null; const [x, y] = BAYU_HOLD(HO); return who === 'bayu' ? [x, y - 34, { dx: 90 }] : null; },
};

// ---------------------------------------------------------------- S6 · bug = a wrong line; they hid in the unread functions (×12)
const F6 = FLOOR(12);
export const B6 = { bayu: [23, F6], crates: [[37, F6], [53, F6], [69, F6]], ladder: 2, kursor: [5, 60] };
const FN = ['login()', 'bayar()', 'keranjang()'];
const RED_ROW = 3, WIN6 = { x: 58, y: 96, w: 172 }; // the login.js window, prop px (clear of Kursor on the ladder)
// bug i: leaves crate i%3 at its burst time, walks to a spot on the wall (fixed by hash)
function bugPath(i, t) {
  const C = CUE.peti, ci = i % 3, b0 = C.burst[ci] + hash(i, 51) * 0.5;
  if (t < b0) return null;
  const [cx, cy] = B6.crates[ci], sx = cx + 8, sy = cy - 13;
  const tx = 38 + hash(i, 52) * 42, ty = 22 + hash(i, 53) * 62, dur = 0.6 + hash(i, 54) * 0.7;
  const k = step(t, b0, dur);
  return [sx + (tx - sx) * k, sy + (ty - sy) * k - Math.sin(k * Math.PI) * 10, k, tx < sx];
}
// the hold in close-up (S6, and paused in S7). o: { bugT (time the swarm is drawn at), gone(i), bayu, spout, dim }
export const BUG_N = 24;
export function bugAt(i, t) { const p = bugPath(i, t); return p && [p[0], p[1]]; }
export function holdCU(g, t, P0, o = {}) {
  const C = CUE.peti, P = palette(Math.min(+P0.key, 0.4)), bt = o.bugT ?? t; // lantern light inside the hold
  R(g, -2, -2, 96, 168, HOLD.wall);
  for (let y = 4; y < F6; y += 6) hl(g, -2, 94, y, HOLD.seam);
  for (let x = 6; x < 94; x += 22) R(g, x, -2, 4, F6 + 2, HOLD.rib);
  R(g, -2, F6, 96, 60, HOLD.floor); for (let y = F6 + 4, gp = 4; y < 166; y += gp, gp++) hl(g, -2, 94, y, '#2E1F15');
  const lx = 60, ly = 22; vl(g, lx + 1, ly - 10, ly - 1, P.iron); R(g, lx - 2, ly - 1, 7, 9, P.ink); R(g, lx - 1, ly, 5, 7, '#F5B342'); R(g, lx, ly + 1, 3, 2, '#FFF3B0');
  // holes the bugs have bitten: each spouts (S7 shows them patched)
  for (let i = 0; i < BUG_N; i++) {
    const p = bugPath(i, bt); if (!p || p[2] < 1 || i % 2) continue;
    const hx = Math.round(38 + hash(i, 52) * 42), hy = Math.round(22 + hash(i, 53) * 62) + 4, st = Math.floor(t * 12);
    if (o.gone?.(i)) { R(g, hx - 2, hy - 1, 5, 3, P.wood2); px(g, hx - 2, hy - 1, P.ink); px(g, hx + 2, hy + 1, P.ink); continue; }
    R(g, hx - 1, hy - 1, 3, 3, P.ink);
    if (o.spout !== false) for (let d = 0; d < 5; d++) { const f = ((d + st) % 5) / 5; px(g, hx + (hash(i, 55) < 0.5 ? -1 : 1) * f * 8, hy + f * f * 10, d % 2 ? P.foam : HOLD.waterL); }
  }
  vl(g, B6.ladder, -2, F6, P.wood1); vl(g, B6.ladder + 6, -2, F6, P.wood1); for (let y = 2; y < F6; y += 6) hl(g, B6.ladder, B6.ladder + 6, y, P.wood2);
  B6.crates.forEach(([x, y], i) => crate(g, P, x, y, { open: bt < C.burst[i] ? 0 : Math.min(5, Math.round((bt - C.burst[i]) * 40)), shake: bt < C.burst[i] && bt >= C.crack - 0.4, t }));
  if (o.kursor !== false) drawKursor(g, P, B6.kursor[0] + 3, B6.kursor[1], { hat: true, arms: 'rope', eyes: 'open' });
  const wy = F6 - 5, sf = o.spout === false ? 0 : Math.floor(fidx(t) / 5);
  g.globalAlpha = 0.62; R(g, -2, wy, 96, 8, HOLD.water); g.globalAlpha = 1;
  for (let x = -2; x < 94; x++) px(g, x, wy + ((x + sf) % 7 < 3 ? 0 : 1), HOLD.waterL);
  if (o.dim) { g.fillStyle = `rgba(4,6,12,${o.dim})`; g.fillRect(-2, -2, 96, 168); }
  o.behindBayu?.(g);
  // Bayu stays lit when the game is paused
  drawBayu(g, P, B6.bayu[0], B6.bayu[1] - (o.hop ?? 0), o.bayu ?? { arm: 'down', armL: 'down', eyes: 'closed', mouth: t >= C.crack ? 'o' : 'smile', rank: 0 });
  for (let i = 0; i < BUG_N; i++) { if (o.gone?.(i)) continue; const p = bugPath(i, bt); if (p) bug(g, P, p[0], p[1], o.spout === false ? i % 2 : (Math.floor(fidx(t) / 5) + i) % 2, p[3]); }
}
export const peti = {
  view: () => ({ P: 12, cx: 0, cy: 0 }),
  world(g, t, P0) { holdCU(g, t, P0); },
  prop(g, t, P0, v) {
    const C = CUE.peti;
    if (t < C.panel || t >= C.crack + 0.35) return;
    // what a bug is: one wrong line in a function
    const k = Math.min(1, (t - C.panel) / 0.12), h = Math.round(84 * k);
    const red = t >= C.redLine;
    const win = codeWin(g, WIN6.x, WIN6.y, WIN6.w, h, { rows: 9, seed: 7, bar: 10, hl: red ? { [RED_ROW]: PROP.red1 } : null, mark: red ? { [RED_ROW]: 'bad' } : null });
    if (red && k >= 1) bug(g, palette(1), WIN6.x + 112, win.rowY(RED_ROW) + 4, Math.floor(fidx(t) / 6) % 2);
  },
  ui(u, t, v) {
    const C = CUE.peti;
    if (t >= C.panel && t < C.crack + 0.35 && t - C.panel > 0.12) {
      pxText(u, 'login.js', WIN6.x * 2 + 38, WIN6.y * 2 + 4, 22, '#98A2B6');
      if (t >= C.redLine) tag(u, 'bug', WIN6.x * 2 + 250, 186, { age: t - C.redLine, color: UI.danger, size: 26, to: [(WIN6.x + 112) * 2, (WIN6.y + 15 + RED_ROW * 7) * 2] });
    }
    // the functions that were never read
    if (t >= C.crack - 0.4) B6.crates.forEach(([x, y], i) => { const [ux, uy] = toUI(v, x + 8, y - 15); tag(u, FN[i], ux, uy - 44 - (i % 2) * 40, { age: t - C.crack + 0.4 - i * 0.1, align: 'center', size: 24, to: [ux, uy - 2] }); });
    if (t >= C.unread) { const [ux, uy] = toUI(v, B6.bayu[0], B6.bayu[1] - 33); tag(u, 'belum dibaca', ux - 40, uy - 74, { age: t - C.unread, color: UI.danger, size: 26, to: [ux + 4, uy] }); }
  },
  anchor(who) { return who === 'kursor' ? [B6.kursor[0] + 3, B6.kursor[1] - 22] : null; },
};
