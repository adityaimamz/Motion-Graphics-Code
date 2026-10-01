// S7–S8 · Pangkat — every bug is a lesson: the game pauses, each bug becomes XP, Bayu ranks up and five empty
// rule slots appear. Rule 1: read first — eyes open, glasses on, every line checked; the bad one is flicked out.
import { ease, fidx, step12 } from '../core.js';
import { S, CUE } from '../timeline.js';
import { palette, UI, PROP } from '../pixel/palette.js';
import { drawBayu } from '../art/bayu.js';
import { bug } from '../art/makhluk.js';
import { codeWin, magnifier, spark, checkP } from '../art/props.js';
import { xpBar, pxText, tag } from '../ui.js';
import { holdCU, bugAt, BUG_N } from './bocor.js';
import { step, between, toProp, deck, FLOOR, lampLit, blink, breathe } from './common.js';
import { R, poly, line } from '../pixel/draw.js';
import { B6 } from './bocor.js';

// ---------------------------------------------------------------- S7 · naik pangkat (×12, game paused)
// bug i turns to XP at xp[i]; the spark lands on the bar 0.45 s later
const landed = (t) => CUE.pangkat.xp.filter((x) => t >= x + 0.45).length;
const frozenT = () => S.peti.t1 - 0.02;
const BAR = { x0: 42, x1: 226, y: 100 }; // the XP bar's fill, prop px (UI 84–452, y 200)
export const pangkat = {
  view: () => ({ P: 12, cx: 0, cy: 0 }),
  world(g, t, P0) {
    const C = CUE.pangkat, paused = t < C.resume;
    const lv = t - C.costume, up = lv >= 0 && lv < 1.3;
    holdCU(g, t, P0, {
      bugT: frozenT(), spout: !paused, dim: paused ? 0.5 : 0, kursor: true,
      // LEVEL UP: gold rays turn behind Bayu, he hops on the word "pangkat"
      behindBayu: up ? (h) => {
        const [cx, cy] = [B6.bayu[0], B6.bayu[1] - 16], a0 = step12(t) * 0.06, r = 34 * Math.min(1, lv / 0.15);
        h.save(); h.beginPath(); h.rect(-2, -2, 96, B6.bayu[1] + 2); h.clip(); // above the floor only
        h.globalAlpha = 0.42 * (lv < 1 ? 1 : 1 - (lv - 1) / 0.3);
        for (let i = 0; i < 8; i++) { const a = a0 + (i / 8) * Math.PI * 2, b = a + 0.16; poly(h, [[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx + Math.cos(b) * r, cy + Math.sin(b) * r]], '#FFD447'); }
        h.restore(); h.globalAlpha = 1;
      } : null,
      hop: lv >= 0 && lv < 0.25 ? Math.round(Math.sin((lv / 0.25) * Math.PI) * 3) : 0,
      gone: (i) => t >= C.xp[i],
      bayu: { arm: t >= C.costume && t < C.costume + 0.6 ? 'up' : 'down', armL: t >= C.costume && t < C.costume + 0.6 ? 'up' : 'down', eyes: 'closed', mouth: t >= C.costume ? 'grin' : 'smile', rank: t >= C.costume ? 1 : 0 },
    });
  },
  prop(g, t, P0, v) {
    const C = CUE.pangkat;
    // each bug pops into a gold spark that arcs up to the XP bar
    for (let i = 0; i < BUG_N; i++) {
      const x0 = C.xp[i]; if (t < x0 || t >= x0 + 0.45) continue;
      const [bx, by] = bugAt(i, frozenT()), [sx, sy] = toProp(v, bx, by - 3);
      const k = ease.inOutCubic(step(t, x0, 0.45)), tx = BAR.x0 + (BAR.x1 - BAR.x0) * ((landed(t) + 1) / BUG_N), ty = BAR.y;
      spark(g, sx + (tx - sx) * k, sy + (ty - sy) * k - Math.sin(k * Math.PI) * 30, k < 0.15);
    }
  },
  ui(u, t) {
    const C = CUE.pangkat;
    if (t < C.resume + 0.3) xpBar(u, t, landed(t) / BUG_N, t >= C.full);
    if (between(t, C.costume, C.costume + 1 / 30)) { u.fillStyle = 'rgba(255,243,176,0.55)'; u.fillRect(0, 0, 540, 960); } // one-frame flash
  },
  anchor() { return null; },
};

// ---------------------------------------------------------------- S8 · 1 · baca dulu (×16, night deck, lantern)
const F8 = FLOOR(16);
const B8 = { bayu: [17, F8] };
const WIN = { x: 124, y: 118, w: 106, rows: 14 }, BAD = 6;
// which row the magnifier is on: rows 0..BAD until the flag, holds on BAD until the flick, then the rest
function readRow(t) {
  const C = CUE.baca;
  if (t < C.read[0]) return -1;
  if (t < C.flag) return Math.floor(step(t, C.read[0], C.flag - C.read[0]) * BAD);
  if (t < C.flick + 0.2) return BAD;
  return Math.min(WIN.rows - 1, BAD + Math.floor(step(t, C.flick + 0.2, Math.max(0.3, C.accept - C.flick - 0.3)) * (WIN.rows - BAD)));
}
export const baca = {
  view: () => ({ P: 16, cx: 0, cy: 0 }),
  world(g, t, P, v) {
    const C = CUE.baca;
    deck(g, P, t, v, { night: true, moon: [50, 20, 4], mast: 2, lantern: [7, 36] });
    const open = t >= C.eyes, reading = t >= C.read[0], L = lampLit(P);
    const flicking = between(t, C.flick - 0.1, C.flick + 0.25);
    if (between(t, C.eyes, C.eyes + 0.25)) { const r = 15 + Math.floor((t - C.eyes) * 40); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; line(g, B8.bayu[0] + Math.cos(a) * (r - 4), B8.bayu[1] - 22 + Math.sin(a) * (r - 4) * 0.8, B8.bayu[0] + Math.cos(a) * r, B8.bayu[1] - 22 + Math.sin(a) * r * 0.8, '#FFF3B0'); } }
    drawBayu(g, L, B8.bayu[0], B8.bayu[1], {
      arm: flicking ? 'flick' : reading ? 'point' : 'down', armL: 'down', rank: 1,
      eyes: blink(t, !open ? 'closed' : t < C.eyes + 0.2 ? 'wide' : 'focus'), mouth: open ? 'flat' : 'smile', hy: open ? breathe(t) : 0,
      glasses: t >= C.glasses && !(t < C.glasses + 0.1 && Math.floor(fidx(t) / 3) % 2),
    });
  },
  prop(g, t, P, v) {
    const C = CUE.baca, row = readRow(t);
    if (t < C.eyes - 0.1) return;
    const k = Math.min(1, (t - C.eyes + 0.1) / 0.15), h = Math.round((15 + WIN.rows * 7) * k);
    const mark = {}, hl = {};
    for (let i = 0; i < Math.min(row, WIN.rows); i++) if (i !== BAD || t >= C.flick) mark[i] = 'ok';
    if (t >= C.flag && t < C.flick) { hl[BAD] = PROP.red1; mark[BAD] = 'bad'; }
    else if (t >= C.flick) { hl[BAD] = PROP.green1; mark[BAD] = 'ok'; }
    if (t >= C.accept) for (let i = 0; i < WIN.rows; i++) mark[i] = 'ok';
    const win = codeWin(g, WIN.x, WIN.y, WIN.w, h, { rows: WIN.rows, seed: 11, bar: 10, hl, mark });
    if (k < 1) return;
    // the bug hiding on the bad line, flicked out over the rail
    const by = win.rowY(BAD) + 4;
    const Pb = palette(0); // the bug in plain light, so it reads on the red line
    if (t >= C.flag - 0.05 && t < C.flick) bug(g, Pb, WIN.x + 60, by, Math.floor(fidx(t) / 6) % 2);
    else if (t >= C.flick && t < C.flick + 0.6) { // flicked: up and out of the frame, tumbling, with a "tink"
      const f = (t - C.flick) / 0.6; bug(g, Pb, Math.round(WIN.x + 60 + f * 110), Math.round(by - Math.sin(f * Math.PI * 0.8) * 90 - f * 40), Math.floor(fidx(t) / 3) % 2, Math.floor(fidx(t) / 4) % 2 === 1);
      if (f < 0.15) for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; R(g, Math.round(WIN.x + 60 + Math.cos(a) * 9), Math.round(by - 3 + Math.sin(a) * 7), 2, 2, PROP.goldL); }
    }
    // the magnifier walks the lines
    if (row >= 0 && t < C.accept) magnifier(g, WIN.x + 34, win.rowY(row) + 1, 11);
    if (t >= C.accept) { const k = ease.outBack(Math.min(1, (t - C.accept) / 0.2), 2.2), s = Math.max(1, Math.round(5 * k)); checkP(g, WIN.x + WIN.w / 2 - s * 4, WIN.y + h + 4, s, PROP.green); }
  },
  ui(u, t) {
    const C = CUE.baca;
    if (t >= C.eyes + 0.05) pxText(u, 'kode dari AI', WIN.x * 2 + 38, WIN.y * 2 + 4, 22, '#98A2B6');
    if (t >= C.flag && t < C.flick) tag(u, 'janggal?', 300, 186, { age: t - C.flag, color: UI.danger, size: 26, to: [WIN.x * 2 + 120, (WIN.y + 15 + BAD * 7) * 2] });
  },
  anchor() { return null; },
};
