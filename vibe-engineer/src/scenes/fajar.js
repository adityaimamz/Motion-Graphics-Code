// S15–S16 · Fajar — the difference, side by side: the vibe coder accepts everything with his eyes closed, the vibe
// engineer reads first. Then the torn VIBE CODER sail comes down, VIBE ENGINEER fills with the dawn wind, and the
// captain's hat passes from Kursor to Bayu. Stay relaxed, but not careless. NEW GAME+ · ▶ LANJUT.
import { ease, keys } from '../core.js';
import { S, CUE } from '../timeline.js';
import { R } from '../pixel/draw.js';
import { sky, sunDisc, cloud, sea, seaFront, barrel, laptop } from '../art/dunia.js';
import { shipBack, shipFront, drawWheel, drawSail, deckY, stand, poopY, mastX, WHEEL } from '../art/kapal.js';
import { palette, UI, PROP } from '../pixel/palette.js';
import { drawBayu } from '../art/bayu.js';
import { drawKursor } from '../art/kursor.js';
import { bigButton, codeWin, magnifier } from '../art/props.js';
import { lanjut, tag, pxText } from '../ui.js';
import { step, between, hop, typeFrame, onBeat, deck, FLOOR, blink, breathe } from './common.js';

// ---------------------------------------------------------------- S15a · split screen (×16)
const F16 = FLOOR(16), HALF = 1080 / 16 / 2; // world px per half
const SP = { coder: [13, F16], eng: [HALF + 12, F16], btn: [104, 288], win: [146, 112, 84, 8] };
const splitOn = (t) => t < CUE.layar.cut;
// which side is speaking: 0 coder, 1 engineer, 2 both
const side = (t) => (t >= CUE.layar.both ? 2 : t >= CUE.layar.engineer ? 1 : 0);
function half(g, k, fn) { g.save(); g.beginPath(); g.rect(k ? HALF : -4, -4, HALF + 4, 200); g.clip(); fn(); g.restore(); }
function splitWorld(g, t, v) {
  const Pn = palette(1), Pd = palette(2), slap = Math.floor((t - S.layar.t0) / 0.333) % 2;
  half(g, 0, () => {
    deck(g, Pn, t, v, { night: true });
    drawBayu(g, Pn, SP.coder[0], SP.coder[1], { arm: slap ? 'slapDown' : 'slapUp', eyes: 'closed', rank: 0, mouth: 'grin', hy: onBeat(t) });
  });
  half(g, 1, () => {
    deck(g, Pd, t, v, {});
    drawBayu(g, Pd, SP.eng[0], SP.eng[1], { arm: 'point', eyes: blink(t, 'focus'), hy: breathe(t), rank: 1, glasses: true, mouth: 'flat' });
  });
  R(g, Math.round(HALF) - 1, -4, 2, 200, '#0B0F1E');
}
function splitProp(g, t) {
  const slap = Math.floor((t - S.layar.t0) / 0.333) % 2;
  g.save(); g.beginPath(); g.rect(0, 0, 135, 480); g.clip(); bigButton(g, SP.btn[0], SP.btn[1], 56, slap === 1, 'green'); g.restore();
  g.save(); g.beginPath(); g.rect(135, 0, 135, 480); g.clip();
  const [x, y, w, rows] = SP.win, row = Math.floor(((t - S.layar.t0) * 3) % rows), mark = {};
  for (let i = 0; i < row; i++) mark[i] = 'ok';
  const win = codeWin(g, x, y, w, 12 + rows * 7, { rows, seed: 21, mark });
  magnifier(g, x + 26, win.rowY(row) + 1, 9);
  g.restore();
}
function splitUI(u, t) {
  const s = side(t);
  pxText(u, 'TERIMA', SP.btn[0] * 2, SP.btn[1] * 2 + 34, 26, PROP.paper, { align: 'center' }); // on the pedestal, like S4
  tag(u, 'VIBE CODER', 135, 196, { align: 'center', size: 30, color: s === 1 ? UI.dim : '#FF9A9E' });
  tag(u, 'VIBE ENGINEER', 405, 196, { align: 'center', size: 30, color: s === 0 ? UI.dim : '#8CF0A4' });
  // the side not being talked about steps back
  u.fillStyle = 'rgba(8,10,20,0.6)';
  if (s === 0) u.fillRect(270, 240, 270, 410); else if (s === 1) u.fillRect(0, 240, 270, 410);
}

// ---------------------------------------------------------------- S15b · layar baru (×6)
const O15 = { x: 92, wl: 300 };
const hatFly = () => [CUE.layar.hat - 0.35, CUE.layar.hat];
function hatShape(g, P, x, y) { R(g, x - 5, y - 4, 10, 3, P.hat); R(g, x - 6, y - 1, 12, 1, P.hat1); R(g, x - 7, y, 14, 1, P.visor); R(g, x - 1, y - 3, 2, 2, P.gold); }
export const layar = {
  view(t) {
    if (splitOn(t)) return { P: 16, cx: 0, cy: 0, tod: 2 };
    const C = CUE.layar;
    return { P: 6, cx: 0, cy: keys(t, [[C.tiltUp[0], 84], [C.tiltUp[1], 62, ease.inOutCubic], [C.tiltDown[0], 62], [C.tiltDown[1], 80, ease.inOutCubic]]) };
  },
  world(g, t, P, v) {
    if (splitOn(t)) return splitWorld(g, t, v);
    const C = CUE.layar, o = { ...O15, sail: 'none', wheel: false, cannon: false, hatchFill: 1 };
    sky(g, P, -2, 0, 184, 302, 300);
    sunDisc(g, P, 150, 262, 16); cloud(g, P, 40, 118, 1); cloud(g, P, 150, 96, 0.8);
    sea(g, P, t, -2, 184, 300, 402);
    shipBack(g, P, t, o);
    // old sail falls, the new one is furled on the yard until it unfurls
    if (t < C.drop + 0.4) { g.save(); g.beginPath(); g.rect(-9, -9, 400, deckY(o) - 6 + 9); g.clip(); drawSail(g, P, o, 'coder', 1, 0, ease.inCubic(step(t, C.drop, 0.35))); g.restore(); }
    if (t >= C.drop) {
      if (t < C.unfurl) { const top = deckY(o) - 122 + 11; R(g, mastX(o) - 54, top, 108, 6, P.cloth); R(g, mastX(o) - 54, top + 4, 108, 2, P.cloth2); }
      else drawSail(g, P, o, 'engineer', step(t, C.unfurl, 0.4));
    }
    // the hat passes from Kursor to Bayu; then they swap places at the wheel
    const [h0, h1] = hatFly(), swapK = step(t, C.hat + 0.1, 0.35);
    const kPos = hop([WHEEL(o)[0] - 12, poopY(o)], [O15.x - 22, stand(o)], swapK, 8);
    const bPos = hop([O15.x - 30, stand(o)], [WHEEL(o)[0] - 4, poopY(o)], swapK, 10);
    drawKursor(g, P, kPos[0], kPos[1], { hat: t < h0, arms: t < h0 ? 'wheel' : t < h1 + 0.1 ? 'hat' : 'down', eyes: t < h0 ? 'open' : 'happy' });
    if (swapK < 1) drawWheel(g, P, o);
    drawBayu(g, P, bPos[0], bPos[1], { arm: swapK >= 1 ? 'wheel' : t >= C.drop - 0.1 && t < C.drop + 0.3 ? 'up' : 'down', armL: swapK >= 1 ? 'wheel' : 'down', eyes: 'open', mouth: 'smile', rank: t >= h1 ? 2 : 1, glasses: t < C.unfurl });
    if (swapK >= 1) drawWheel(g, P, o);
    if (between(t, h0, h1)) { const f = step(t, h0, h1 - h0), [x, y] = hop([kPos[0], kPos[1] - 26], [bPos[0], bPos[1] - 36], f, 14); hatShape(g, P, x, y); }
    shipFront(g, P, t, o);
    seaFront(g, P, t, -2, 184, 300, 402);
  },
  prop(g, t) { if (splitOn(t)) splitProp(g, t); },
  ui(u, t) { if (splitOn(t)) splitUI(u, t); },
  anchor() { return null; },
};

// ---------------------------------------------------------------- S16 · santai (×4)
const WL16 = 296;
const shipX16 = (t) => 74 + (t - S.santai.t0) * 6;
export const santai = {
  view: () => ({ P: 4, cx: 0, cy: 0 }),
  world(g, t, P) {
    const C = CUE.santai, o = { x: shipX16(t), wl: WL16, sail: 'engineer', wheel: false, hatchFill: 1 };
    sky(g, P, -2, -2, 276, WL16 - 92, WL16 - 96);
    sunDisc(g, P, 135, WL16 - 118, 22);
    cloud(g, P, 48, 130, 1); cloud(g, P, 222, 152, 0.9);
    sea(g, P, t, -2, 274, WL16 - 96, 482, { amp: 0.6 });
    shipBack(g, P, t, o);
    // the neck pillow hung on the mast, a souvenir
    const mx = mastX(o), py = deckY(o) - 40; R(g, mx + 2, py, 2, 6, P.pillow); R(g, mx + 8, py, 2, 6, P.pillow); R(g, mx + 2, py + 5, 8, 2, P.pillow1);
    barrel(g, P, o.x + 30, deckY(o) - 2);
    laptop(g, P, t, o.x + 21, deckY(o) - 16, 5);
    drawKursor(g, P, o.x + 14, stand(o), { hat: false, arms: typeFrame(t), eyes: 'happy' });
    const sip = between(t, C.sip, C.sip + 0.6);
    drawBayu(g, P, WHEEL(o)[0] - 4, poopY(o), { arm: sip ? 'sip' : 'wheel', armL: 'wheel', eyes: 'open', mouth: 'smile', rank: 2 });
    drawWheel(g, P, o);
    shipFront(g, P, t, o);
    seaFront(g, P, t, -2, 274, WL16, 482);
  },
  ui(u, t) {
    const C = CUE.santai;
    if (t >= C.lanjut) { const f = Math.floor((t - C.lanjut) * 6); lanjut(u, t, f % 2 === 0 || t >= C.select - 0.15, t >= C.select - 0.15); }
  },
  anchor() { return null; },
};
