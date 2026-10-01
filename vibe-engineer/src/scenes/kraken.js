// S9–S14 · Kraken — the giant bug rises (6 tentacles = 6 bugs). Rules 2–5 are fought in close-up, each with its
// own literal picture: context (a vague prompt vs. a checklist), one small task per prompt (a giant shot blows up,
// three small ones hit), tests (a shield that checks itself), commit (a save crystal you can go back to).
// Then the loop, three laps, until the kraken flees at dawn. Every state is derived from t and the CUEs.
import { ease, fidx, hash, keys, step12, mix, hex, W } from '../core.js';
import { S, CUE } from '../timeline.js';
import { R, px, hl, line, disc, ring, dither, poly } from '../pixel/draw.js';
import { sky, stars, moon, sunDisc, sea, seaFront, ball, splash, crate, barrel, laptop } from '../art/dunia.js';
import { shipBack, shipFront, drawWheel, deckY, stand, poopY, CANNON } from '../art/kapal.js';
import { palette, UI, PROP } from '../pixel/palette.js';
import { drawBayu } from '../art/bayu.js';
import { drawKursor, blinkOff } from '../art/kursor.js';
import { drawKrakenHead, drawTentacle, tentaclePts, inkCloud, TENTACLES } from '../art/makhluk.js';
import { shield, crystal, plinth, block, smoke, checkP, crossP } from '../art/props.js';
import { bossPlate, tag, panel, pxText, check, slotIcon, SLOT_COL, dot, bubble } from '../ui.js';
import { step, between, typeFrame, shake, hop, toUI, toProp, deck, FLOOR, lampLit, blink, breathe } from './common.js';

// ---------------------------------------------------------------- battle state from time
const ORDER = [3, 4, 5, 0, 1, 2];               // tentacles in the order they go down
const hitTimes = () => [...CUE.kecil.hits, ...CUE.ulangi.hits];
export const hpAt = (t) => TENTACLES - hitTimes().filter((h) => t >= h).length;
function tentK(i, t) { const n = ORDER.indexOf(i), h = hitTimes()[n]; return t < h ? 1 : 1 - step(t, h, 0.4); }
const bossK = (t) => (t < S.konteks.t0 ? step(t, CUE.kraken.ui[0], CUE.kraken.ui[1] - CUE.kraken.ui[0]) : 1 - step(t, CUE.ulangi.flee[1], 0.3));
const TLABEL = { 3: 'login', 4: 'bayar', 5: 'keranjang' };

// ---------------------------------------------------------------- the wide (S9 rise, S14 loop)
const O = { x: 84, wl: 300 }, K = { x: 190, wl: 300 }; // the head stays clear of the TikTok buttons (x < 232)
function headY(t) { const C = CUE.kraken, U = CUE.ulangi; const y = keys(t, [[C.rise[0], 352], [C.rise[1], 258, ease.outCubic]]); return y + 90 * ease.inCubic(step(t, U.flee[0], U.flee[1] - U.flee[0])) + (Math.floor(fidx(t) / 10) % 2); }
function wide(g, t, P, v) {
  const C = CUE, o = { ...O, sail: 'coder', wheel: false, cannon: true, hatchFill: 1 };
  const rise = step(t, C.kraken.rise[0], C.kraken.rise[1] - C.kraken.rise[0]);
  sky(g, P, -2, -2, 276, 302, 300);
  stars(g, P, t, 0, 0, 270, 240, 50);
  if (P.key < '1.3') moon(g, P, 40, 160, 9); else sunDisc(g, P, 135, 300 - (+P.key - 1) * 60, 16);
  sea(g, P, t, -2, 274, 300, 482, { amp: 1.4 });
  const kr = { ...K, y: headY(t), rise, blink: Math.floor(fidx(t) / 6) % 23 === 0, hurt: hitTimes().some((h) => between(t, h, h + 0.3)) };
  drawKrakenHead(g, P, kr, t);
  for (let i = 3; i < TENTACLES; i++) drawTentacle(g, P, kr, i, t, tentK(i, t) * rise);
  // commit crystals left behind, one per lap
  if (t >= S.ulangi.t0) C.ulangi.crystals.forEach((c, n) => { if (t >= c) { const x = 20 + n * 16, y = 286 + (Math.floor(fidx(t) / 12 + n) % 2); disc(g, x, y + 10, 3, P.foam); poly(g, [[x, y - 6], [x + 4, y], [x, y + 6], [x - 4, y]], '#5FE3F0'); px(g, x - 1, y - 2, '#E0FDFF'); } });
  // cannon shots in the loop
  const U = C.ulangi;
  o.recoil = U.hits.some((h) => between(t, h - U.h * 0.5, h - U.h * 0.5 + 0.1)) ? 2 : 0;
  shipBack(g, P, t, o);
  drawWheel(g, P, o);
  const sid = t >= S.ulangi.t0 ? 'ulangi' : 'kraken';
  drawBayu(g, P, O.x - 18, stand(o), { arm: sid === 'ulangi' ? 'point' : 'down', eyes: sid === 'kraken' ? 'wide' : 'focus', mouth: between(t, C.kraken.roar, C.kraken.roar + 0.5) ? 'o' : 'flat', rank: 1, glasses: true });
  drawKursor(g, P, O.x + 24, stand(o), { hat: true, arms: sid === 'ulangi' ? typeFrame(t) : 'down', eyes: t >= C.kraken.roar && sid === 'kraken' ? 'q' : 'focus' });
  U.hits.forEach((h, n) => {
    const f = h - U.h * 0.5, [mx, my] = [CANNON(o)[0] + 9, CANNON(o)[1] - 9], tip = tentaclePts({ ...K, rise: 1 }, ORDER[3 + n], t)[9];
    if (between(t, f, h)) { const k = step(t, f, h - f); ball(g, P, mx + (tip[0] - mx) * k, my + (tip[1] - my) * k - Math.sin(k * Math.PI) * 20, 2); }
    if (between(t, h, h + 0.12)) for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; px(g, tip[0] + Math.cos(a) * 6, tip[1] + Math.sin(a) * 6, '#FFF3B0'); }
    splash(g, P, h + 0.2, t, tip[0], 300, 12, 12);
  });
  shipFront(g, P, t, o);
  for (let i = 0; i < 3; i++) drawTentacle(g, P, kr, i, t, tentK(i, t) * rise);
  seaFront(g, P, t, -2, 274, 300, 482);
  // the rest of it, under the surface: long dark arms reaching toward the ship (sink away when it flees)
  const sink = 140 * ease.inCubic(step(t, C.ulangi.flee[0], 0.8)), deep = hex(mix(P.sea0, P.ink, 0.5)), st = step12(t);
  if (rise > 0) for (let i = 0; i < 5; i++) {
    const bx = 120 + i * 34, tx = 40 + i * 30 + Math.sin(st * 0.3 + i) * 4, ty = 330 + i % 2 * 26 + (1 - rise) * 80 + sink;
    for (let s = 0; s <= 48; s++) { const f = s / 48, x = bx + (tx - bx) * f + Math.sin(f * 4 + i + st * 0.2) * 6, y = 486 + sink + (ty - 486 - sink) * f; if (y > 306) disc(g, x, y, Math.max(1.5, 7 - f * 5), deep); }
  }
  // a rumble before it rises: the sea boils where the head will come up
  if (between(t, C.kraken.rumble, C.kraken.rise[1])) for (let i = 0; i < 12; i++) { const ph = (hash(i, 41) + (t - C.kraken.rumble) * 1.6) % 1; ring(g, K.x - 30 + hash(i, 42) * 60, 330 - ph * 30, 1 + (i % 2), P.foam); }
  if (t >= C.ulangi.flee[0]) { inkCloud(g, P, K.x, 300, step(t, C.ulangi.flee[0], C.ulangi.flee[1] - C.ulangi.flee[0] + 0.6)); splash(g, P, C.ulangi.flee[0] + 0.1, t, K.x, 300, 26, 22); }
}
const wideView = (t) => { const [sx, sy] = between(t, CUE.kraken.rumble, CUE.kraken.rise[0]) ? shake(t, CUE.kraken.rumble, 0.25, 1) : shake(t, CUE.kraken.roar, 0.25, 3); return { P: 4, cx: sx, cy: sy }; };

// ---------------------------------------------------------------- S9 · the boss appears (no VO)
export const kraken = {
  view: wideView, world: wide, boss: (t) => t >= CUE.kraken.ui[0],
  ui(u, t) { bossPlate(u, t, hpAt(t), TENTACLES, bossK(t)); },
  anchor() { return null; },
};

// ---------------------------------------------------------------- S10 · 2 · kasih konteks (×12)
const F12 = FLOOR(12);
const B10 = { bayu: [22, F12], kursor: [68, F12], lamp: [68, 80] }; // the lamp: an idea over Kursor's head
const CTX = [['tujuan', 'toko online'], ['aturan', 'login pakai email'], ['contoh', 'kode yang sudah ada']];
// the AI's guess: a crooked tower (gold = maybe, red = wrong) that wobbles, then collapses on "menebak"
const GUESS = [[122, 0, 1], [128, 1, 0], [119, 2, 1], [131, 3, 0], [124, 4, 1]]; // x (prop px), row, ok
const RUBBLE = [100, 156, 112, 170, 142];
const Y10 = 302; // a 22-px block resting on the deck (prop px)
export const konteks = {
  view: () => ({ P: 12, cx: 0, cy: 0 }),
  world(g, t, P, v) {
    const C = CUE.konteks, lit = t >= C.lamp, L = lampLit(P);
    deck(g, P, t, v, { night: true, moon: [80, 36, 4], mast: 2, lantern: lit ? B10.lamp : null });
    if (lit && t < C.lamp + 0.3) ring(g, B10.lamp[0] + 1, B10.lamp[1] + 2, 4 + Math.floor((t - C.lamp) * 20), '#FFF3B0');
    drawBayu(g, L, B10.bayu[0], B10.bayu[1], { arm: t < C.panel ? 'give' : t >= C.good ? 'thumb' : 'point', eyes: blink(t, 'focus'), mouth: t < C.panel ? 'o' : 'smile', hy: breathe(t), rank: 1, glasses: true });
    const k = { hat: true, arms: t >= C.good ? 'wave0' : t >= C.lamp ? typeFrame(t) : 'down', eyes: t < C.lamp ? 'q' : t >= C.good ? 'happy' : 'focus' };
    drawKursor(g, L, B10.kursor[0], B10.kursor[1], k);
  },
  prop(g, t) {
    const C = CUE.konteks, fall = C.guess + 0.25;
    // the guess, built block by block after the vague prompt; it sways; on "menebak" it falls apart
    if (t < C.good) GUESS.forEach(([x, row, ok], i) => {
      const appear = C.bad + 0.25 + i * 0.22; if (t < appear) return;
      let bx = x + (row >= 2 && t < fall ? Math.round(Math.sin(step12(t) * 0.9 + row) * (row - 1)) : 0);
      let by = Y10 - row * 23 - (1 - ease.inCubic(Math.min(1, (t - appear) / 0.15))) * 40;
      if (t >= fall) { const k = ease.inCubic(Math.min(1, Math.max(0, (t - fall - (4 - row) * 0.05) / 0.35))); bx += (RUBBLE[i] - bx) * k; by += (Y10 - by) * k; }
      block(g, Math.round(bx), Math.round(by), 22, 'gold', ok === 1);
    });
    if (between(t, C.guess, fall + 0.4)) crossP(g, 116, 236, 8, PROP.red);
    if (between(t, C.good - 0.05, C.good + 0.3)) RUBBLE.forEach((x) => smoke(g, x + 11, Y10 + 12, (t - C.good + 0.05) / 0.35, 4));
    // the right block, built from the context: three green blocks land square, with a little overshoot
    if (t >= C.good) {
      [[110, 0], [136, 0], [123, 1]].forEach(([x, row], i) => {
        const k = Math.min(1, Math.max(0, (t - C.good - i * 0.1) / 0.25)); if (k <= 0) return;
        block(g, x, Math.round(Y10 - 2 - row * 26 - (1 - ease.outBack(k, 2)) * 50), 24, 'green');
      });
      if (t >= C.good + 0.4) checkP(g, 121, Y10 - 66, 5, PROP.green);
    }
  },
  ui(u, t, v) {
    const C = CUE.konteks;
    if (t < C.panel) { const [x, y] = toUI(v, B10.bayu[0], B10.bayu[1] - 35); const r = bubble(u, t, { s: C.bad, e: C.panel, text: 'buatin login' }, x + 20, y, { size: 34 }); if (r) cross(u, r[0] + r[2] + 8, r[1] + 6, 5, UI.danger); }
    if (t >= C.panel) { // the context, item by item
      const k = Math.min(1, (t - C.panel) / 0.1);
      panel(u, 40, 190, 425, Math.round(166 * k));
      if (k >= 1) {
        pxText(u, 'KONTEKS UNTUK AI', 60, 196, 26, UI.dim);
        CTX.forEach(([a, b], i) => {
          const y = 236 + i * 40, on = t >= C.ticks[i];
          u.fillStyle = '#0B0F1E'; u.fillRect(60, y + 2, 26, 26);
          if (on) check(u, 63, y + 4, 3, UI.ok);
          pxText(u, `${a}:`, 100, y, 30, on ? UI.sel : UI.dim); pxText(u, b, 100 + 92, y, 30, on ? UI.text : '#56607A');
        });
      }
    }
    if (t >= C.guess && t < C.good) tag(u, 'AI menebak', 270, 392, { age: t - C.guess, align: 'center', color: UI.danger, size: 30 });
  },
  anchor(who) { return who === 'kursor' ? [B10.kursor[0], B10.kursor[1] - 22] : [B10.bayu[0], B10.bayu[1] - 35]; },
};
function cross(u, x, y, s, c) { u.fillStyle = c; for (let i = 0; i < 6; i++) { u.fillRect(x + i * s, y + i * s, s, s); u.fillRect(x + (5 - i) * s, y + i * s, s, s); } }

// ---------------------------------------------------------------- S11 · 3 · satu perintah kecil (×10)
// One giant prompt ("everything at once") is stuffed into the cannon, flies up and bursts into smoke and paper:
// nobody can tell what went wrong. Then three small prompts, one task each, each hits its own tentacle.
const F10 = FLOOR(10);
const B11 = { bayu: [12, F10], kursor: [27, F10], cannon: [60, F10], kraken: { x: 80, wl: 100, rise: 1, s: 0.55, bases: { 3: 58, 4: 72, 5: 86 } } };
const AIM = -0.6, PIVOT = [B11.cannon[0] - 3, F10 - 13]; // barrel angle (up-right) and trunnion
const BURST = [34, 66];                                   // where the giant prompt bursts (world px, left of the +1 and the tentacles)
const bp = (u, v, rec = 0) => { const c = Math.cos(AIM), s = Math.sin(AIM); u -= rec; return [PIVOT[0] + u * c - v * s, PIVOT[1] + u * s + v * c]; };
const MOUTH11 = bp(26, 0);
const TASK_COL = { 3: '#6FA8DC', 4: '#E2A838', 5: '#5BD07D' };
// a naval cannon, side view: stepped wooden carriage, two iron-rimmed wheels, tapered barrel with bands and a lip
function cannon(g, L, rec, flash) {
  const x = B11.cannon[0], y = F10;
  const out = (pts, c) => { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) poly(g, pts.map(([a, b]) => [a + dx, b + dy]), L.ink); poly(g, pts, c); };
  // carriage: steps rise toward the back (left)
  out([[x - 14, y - 3], [x + 9, y - 3], [x + 9, y - 8], [x + 1, y - 8], [x + 1, y - 12], [x - 7, y - 12], [x - 7, y - 16], [x - 14, y - 16]], L.wood1);
  R(g, x - 14, y - 5, 23, 2, L.wood0); R(g, x - 13, y - 16, 6, 1, L.wood2); R(g, x - 6, y - 12, 7, 1, L.wood2); R(g, x + 2, y - 8, 7, 1, L.wood2);
  // barrel (drawn in its own frame, recoils along its axis)
  const seg = (u0, u1, r0, r1, c) => poly(g, [bp(u0, -r0, rec), bp(u1, -r1, rec), bp(u1, r1, rec), bp(u0, r0, rec)], c);
  disc(g, ...bp(-10, 0, rec), 3, L.ink); disc(g, ...bp(-10, 0, rec), 2, L.metal1);           // cascabel knob
  seg(-8, 22, 7, 5, L.ink); seg(22, 27, 6, 6, L.ink);                                          // outline
  seg(-7, 22, 6, 4, L.metal1); seg(22, 26, 5, 5, L.metal1);                                    // body + muzzle lip
  poly(g, [bp(-7, -6, rec), bp(22, -4, rec), bp(22, -2, rec), bp(-7, -3, rec)], L.metal);      // top light
  for (const u of [-2, 7, 16]) seg(u, u + 2, 6.5 - u * 0.07, 6.3 - u * 0.07, L.iron);          // bands
  seg(25, 26, 3, 3, L.ink);                                                                    // the bore
  // wheels in front of the carriage
  for (const wx of [x - 9, x + 5]) { disc(g, wx, y - 3, 5, L.ink); disc(g, wx, y - 3, 4, L.iron); disc(g, wx, y - 3, 3, L.wood1); disc(g, wx, y - 3, 1, L.ink); px(g, wx - 2, y - 5, L.wood2); }
  if (flash) { const [mx, my] = bp(29, 0, rec); for (let i = 0; i < 8; i++) { const a = AIM + (i / 8) * Math.PI * 2, r = i % 2 ? 4 : 8; line(g, mx, my, mx + Math.cos(a) * r, my + Math.sin(a) * r, i % 2 ? '#FFD447' : '#FFF3B0', 2); } disc(g, mx, my, 3, '#FFF3B0'); }
}
// a prompt: a bundle of code pages tied with string (paper reads on the night sky). r = radius, spin = 0..1
function prompt(g, L, x, y, r, spin = 0, col = null) {
  disc(g, x, y, r + 1, L.ink); disc(g, x, y, r, L.paper); disc(g, x + Math.round(r * 0.3), y + Math.round(r * 0.3), Math.round(r * 0.6), L.paper1);
  if (r >= 5) { for (let i = 0; i < 3; i++) hl(g, x - r + 3 + i, x - r + 3 + i + Math.round(r * 0.9), y - 3 + i * 3, [L.code3, L.code1, L.code2][i]); }
  else R(g, x - 1, y - 1, 3, 3, col ?? L.code2);
  const a = spin * Math.PI; line(g, x - Math.cos(a) * r, y - Math.sin(a) * r, x + Math.cos(a) * r, y + Math.sin(a) * r, L.rope1);
}
const tipK = (i, t) => tentaclePts(B11.kraken, i, t)[10];
export const kecil = {
  boss: () => true,
  view(t) { const C = CUE.kecil, h = C.hits.find((x) => between(t, x, x + 0.2)); const [sx, sy] = h ? shake(t, h, 0.2, 1) : between(t, C.boom, C.boom + 0.3) ? shake(t, C.boom, 0.3, 2) : [0, 0]; return { P: 10, cx: sx, cy: sy }; },
  world(g, t, P, v) {
    const C = CUE.kecil, L = lampLit(P);
    deck(g, P, t, v, { night: true, moon: [16, 20, 5], behind: () => { for (const i of [3, 4, 5]) drawTentacle(g, P, B11.kraken, i, t, tentK(i, t)); } });
    const rolling = between(t, C.roll[0], C.bigFire), shocked = between(t, C.boom, C.boom + 0.7);
    drawBayu(g, L, B11.bayu[0], B11.bayu[1], { arm: t >= C.fires[0] - 0.2 ? 'point' : 'down', eyes: blink(t, shocked ? 'wide' : 'focus'), mouth: shocked ? 'o' : 'flat', hy: breathe(t), rank: 1, glasses: true });
    const firing = C.fires.find((f) => between(t, f - 0.25, f + 0.1));
    drawKursor(g, L, B11.kursor[0] + (rolling ? Math.round(step(t, C.roll[0], C.bigFire - C.roll[0]) * 3) : 0), B11.kursor[1], { hat: true, arms: rolling ? 'push' : firing ? typeFrame(t) : 'down', eyes: shocked ? 'q' : 'focus' });
    const rec = C.fires.some((f) => between(t, f, f + 0.1)) || between(t, C.bigFire, C.bigFire + 0.12) ? 2 : 0;
    cannon(g, L, rec, C.fires.some((f) => between(t, f, f + 0.07)) || between(t, C.bigFire, C.bigFire + 0.07));
    // the giant prompt: pushed along the deck, lifted into the muzzle (too big: it sticks out), fired, bursts
    if (t >= C.roll[0] && t < C.boom) {
      const R0 = 9, D = C.bigFire - C.roll[0], k = (t - C.roll[0]) / D;
      let x, y, spin = 0;
      if (t < C.bigFire) {
        if (k < 0.65) { x = B11.kursor[0] + 13 + Math.round(step(t, C.roll[0], D * 0.65) * 4); y = F10 - R0; spin = k * 2; }
        else [x, y] = hop([B11.kursor[0] + 17, F10 - R0], [MOUTH11[0] + 3, MOUTH11[1] - 5], step(t, C.roll[0] + D * 0.65, D * 0.3), 14);
      } else { const f = ease.outCubic((t - C.bigFire) / (C.boom - C.bigFire)); x = MOUTH11[0] + 3 + (BURST[0] - MOUTH11[0] - 3) * f; y = MOUTH11[1] - 5 + (BURST[1] - MOUTH11[1] + 5) * f - Math.sin(f * Math.PI) * 6; spin = f * 3; }
      prompt(g, L, Math.round(x), Math.round(y), R0, spin);
    }
    // the small prompts: one task each, a bright trail, a hit on its own tentacle
    C.fires.forEach((f, n) => {
      const h = C.hits[n], i = ORDER[n], [tx, ty] = tipK(i, t);
      if (between(t, f, h)) {
        const at = (k) => [MOUTH11[0] + (tx - MOUTH11[0]) * k, MOUTH11[1] + (ty - MOUTH11[1]) * k - Math.sin(k * Math.PI) * 12], k = (t - f) / (h - f);
        for (let d = 1; d <= 4; d++) { const [qx, qy] = at(Math.max(0, k - d * 0.07)); px(g, qx, qy, d < 3 ? TASK_COL[i] : L.paper1); }
        const [x, y] = at(k); prompt(g, L, Math.round(x), Math.round(y), 3, k * 2, TASK_COL[i]);
      }
      if (between(t, h, h + 0.15)) { const r = 4 + (t - h) * 40; for (let a = 0; a < 8; a++) { const an = (a / 8) * 6.28; line(g, tx + Math.cos(an) * r * 0.5, ty + Math.sin(an) * r * 0.5, tx + Math.cos(an) * r, ty + Math.sin(an) * r, a % 2 ? '#FFD447' : '#FFF3B0'); } }
    });
  },
  prop(g, t, P, v) {
    const C = CUE.kecil;
    // the giant prompt bursts: smoke over the sky and its pages raining down
    if (between(t, C.boom, C.boom + 1.2)) {
      const [x, y] = toProp(v, BURST[0], BURST[1]), u = t - C.boom, k = u / 1.2;
      if (u < 1 / 30) ring(g, x, y, 30, PROP.goldL, 3);
      smoke(g, x, y, Math.min(0.99, k * 1.15), 18, 40);
      for (let i = 0; i < 22; i++) {
        const a = hash(i, 301) * 6.28, sp = 30 + hash(i, 302) * 50;
        const sx = x + Math.cos(a) * sp * Math.min(u, 0.5) * 2, sy = y + Math.sin(a) * sp * Math.min(u, 0.5) * 1.4 + 60 * u * u;
        if (u > 0.08) R(g, Math.round(sx), Math.round(sy), 3 + (i % 2), 2 + (i % 3 === 0 ? 1 : 0), i % 4 ? PROP.paper : [PROP.c3, PROP.c1, PROP.c2][i % 3]);
      }
    }
    C.fires.forEach((f) => { if (between(t, f, f + 0.4)) { const [x, y] = toProp(v, MOUTH11[0] + 2, MOUTH11[1] - 2); smoke(g, x, y, (t - f) / 0.4, 3); } });
  },
  ui(u, t, v) {
    const C = CUE.kecil;
    bossPlate(u, t, hpAt(t), TENTACLES, 1);
    if (between(t, C.roll[0], C.boom)) { const [x, y] = toUI(v, t < C.bigFire ? B11.kursor[0] + 16 : BURST[0], t < C.bigFire ? F10 - 20 : BURST[1] - 12); tag(u, 'SEMUA SEKALIGUS', x, t < C.bigFire ? y - 60 : y + 70, { age: t - C.roll[0], align: 'center', color: UI.danger }); } // below it in flight, clear of the HUD
    if (between(t, C.boom + 0.12, C.boom + 1.1)) { const [x, y] = toUI(v, BURST[0], BURST[1]); tag(u, 'salah di mana?', x, y - 22, { age: t - C.boom - 0.12, align: 'center', color: UI.danger, size: 34 }); }
    // each tentacle wears the name of the task that defeats it (staggered so they never overlap)
    if (t >= C.boom + 0.6) [3, 4, 5].forEach((i, n) => {
      const h = C.hits[n]; if (t > h + 0.9) return;
      const [mx] = toUI(v, tentaclePts(B11.kraken, i, t)[6][0], 0), y = [412, 362, 412][n];
      tag(u, TLABEL[i], mx, y, { age: t - C.boom - 0.6 - n * 0.08, align: 'center', size: 28, color: t >= h ? UI.ok : UI.text });
    });
  },
  anchor() { return null; },
};

// ---------------------------------------------------------------- S12 · 4 · cek pakai tes (×16)
const F16 = FLOOR(16);
const B12 = { bayu: [17, F16], kursor: [57, F16], shield: [150, 168, 96, 120] }; // shield: cx, top, w, h (prop px); held in Bayu's hand (hold pose ≈ prop 108, 268)
const TESTS = ['login', 'bayar', 'keranjang'];
function testState(i, t) { // 0 not run, 1 pass, 2 fail, 3 running
  const C = CUE.tes;
  if (t < C.rows[i]) return 0;
  if (i !== 1) return 1;
  if (t < C.bad) return 3;
  return t < C.fix ? 2 : 1;
}
export const tes = {
  view: (t) => { const [sx, sy] = shake(t, CUE.tes.bad, 0.25, 1); return { P: 16, cx: sx, cy: sy }; },
  world(g, t, P, v) {
    const C = CUE.tes;
    deck(g, P, t, v, { night: true, moon: [50, 18, 4], mast: 2, lantern: [7, 36] });
    const fixing = between(t, C.fix - 0.45, C.fix + 0.15), L = lampLit(P);
    drawBayu(g, L, B12.bayu[0], B12.bayu[1], { arm: t >= C.shield ? 'hold' : 'down', eyes: blink(t, between(t, C.bad, C.fix) ? 'wide' : t >= C.done ? 'happy' : 'focus'), mouth: t >= C.done ? 'grin' : 'flat', hy: breathe(t), rank: 1, glasses: true });
    if (t >= C.fix - 0.6) { const k = step(t, C.fix - 0.6, 0.25), [x, y] = hop([72, F16], B12.kursor, k, 10); drawKursor(g, L, x, y, { hat: true, arms: fixing ? 'lever' : 'down', eyes: t >= C.done ? 'happy' : 'focus' }); }
  },
  prop(g, t) {
    const C = CUE.tes;
    if (t < C.shield) return;
    const [cx, top, w, h] = B12.shield, k = Math.min(1, (t - C.shield) / 0.12);
    const flash = between(t, C.bad, C.fix) && Math.floor(fidx(t) / 6) % 2 === 0;
    shield(g, cx, top + (1 - k) * 20, w * (0.6 + 0.4 * k), h * (0.6 + 0.4 * k), flash);
    if (k < 1) return;
    TESTS.forEach((_, i) => {
      const y = top + 18 + i * 26, st = testState(i, t);
      R(g, cx - 38, y - 1, 74, 18, '#16337A'); R(g, cx - 36, y + 1, 14, 14, '#0B1A40');
      if (st === 1) checkP(g, cx - 35, y + 2, 1.6, PROP.greenL);
      else if (st === 2) crossP(g, cx - 34, y + 3, 1.6, PROP.redL);
      else if (st === 3) R(g, cx - 32 + (Math.floor(fidx(t) / 4) % 3) * 3, y + 7, 2, 2, PROP.goldL);
    });
  },
  ui(u, t) {
    const C = CUE.tes, [cx, top] = B12.shield;
    if (t >= C.shield + 0.12) TESTS.forEach((s, i) => { const st = testState(i, t); pxText(u, s, cx * 2 - 34, (top + 18 + i * 26) * 2 + 2, 28, st === 2 ? '#FFB3B6' : st === 1 ? '#E8F7EC' : '#9FB4E6'); });
    if (t >= C.shield + 0.12) pxText(u, 'TES OTOMATIS', cx * 2, (top + 3) * 2, 26, '#CFE0FF', { align: 'center' });
    if (between(t, C.bad, C.fix)) tag(u, 'rusak: bayar', 250, 212, { age: t - C.bad, color: UI.danger, size: 28 });
    if (t >= C.done) tag(u, 'TES 3/3 LOLOS', 200, 212, { age: t - C.done, color: UI.ok, size: 34 });
  },
  anchor() { return null; },
};

// ---------------------------------------------------------------- S13 · 5 · commit = titik aman (×10)
// The tests pass: the version is saved as a crystal floating over the deck (a save point). A tentacle slams the
// deck, everything flies; "tinggal balik" plays that same mess backwards until the deck is exactly v1 again.
const F8 = F10;
const B13 = { bayu: [14, F8], kursor: [30, F8], crystal: [135, 142] }; // crystal in prop px (centre), mid-sky
// tidy → messy: [x0, y0, x1, y1, arc]; crates, then the laptop
const ITEMS = [[46, F8, 22, F8, 18], [62, F8, 88, F8, 26], [54, F8 - 13, 58, F8, 40]];
const LAPTOP = [56, F8 - 26, 36, F8, 30];
const SLAM = [64, F8 - 2];
function messK(t) { const C = CUE.commit; if (t < C.mess[0]) return 0; if (t < C.back[0]) return ease.outCubic(Math.min(1, (t - C.mess[0]) / 0.45)); return 1 - ease.inOutCubic(Math.min(1, (t - C.back[0]) / (C.back[1] - C.back[0]))); }
const along = ([x0, y0, x1, y1, h], m) => [Math.round(x0 + (x1 - x0) * m), Math.round(y0 + (y1 - y0) * m - Math.sin(Math.PI * m) * h)];
// the slamming tentacle, in front of the bulwark: up over the rail, down on the deck, back into the sea
function slamTentacle(g, P, t) {
  const C = CUE.commit, a = C.wave - 0.35, z = C.wave + 0.6;
  if (t < a || t > z) return;
  // rise over the rail (anticipation), slam down, rest on the deck, slide back into the sea
  const base = [112, 96], seg = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
  const up = [92, 30], out = [114, 112];
  const [tx, ty] = t < C.wave - 0.15 ? seg([112, 92], up, ease.outCubic((t - a) / 0.2 > 1 ? 1 : (t - a) / 0.2))
    : t < C.wave ? seg(up, SLAM, ease.inCubic((t - C.wave + 0.15) / 0.15))
    : t < C.wave + 0.2 ? SLAM : seg(SLAM, out, ease.inCubic((t - C.wave - 0.2) / 0.4));
  const ctrl = [(base[0] + tx) / 2 + 6, Math.min(base[1], ty) - 26], pts = [];
  for (let s = 0; s <= 16; s++) { const f = s / 16, u = 1 - f; pts.push([u * u * base[0] + 2 * u * f * ctrl[0] + f * f * tx, u * u * base[1] + 2 * u * f * ctrl[1] + f * f * ty]); }
  for (const [i, [x, y]] of pts.entries()) disc(g, x, y, Math.max(2, 8 - i * 0.38) + 1, P.ink);
  for (const [i, [x, y]] of pts.entries()) { const r = Math.max(2, 8 - i * 0.38); disc(g, x, y, r, P.kr0); px(g, x + Math.round(r * 0.5), y - 1, P.kr1); if (i % 2 === 0 && i < 15) px(g, x - Math.round(r * 0.5), y + 1, P.krsuck); }
}
export const commit = {
  view(t) { const [sx, sy] = shake(t, CUE.commit.wave, 0.35, 2); return { P: 10, cx: sx, cy: sy }; },
  world(g, t, P, v) {
    const C = CUE.commit, m = messK(t), L = lampLit(P);
    deck(g, P, t, v, { night: true, moon: [16, 20, 5] });
    // water left on the deck by the slam (drains back on the rewind)
    if (m > 0.05) { g.globalAlpha = 0.55 * m; R(g, 4, F8 - 1, 100, 3, P.sea1); g.globalAlpha = 1; for (let x = 6; x < 102; x += 7) px(g, x + (Math.floor(fidx(t) / 5) % 3), F8 - 1, P.foam); }
    // the crates and the laptop: tidy (v1), thrown about, then back exactly where they were
    ITEMS.forEach((it, i) => { const [x, y] = along(it, m); crate(g, L, x, y, { shake: m > 0 && m < 1, t }); });
    { const [x, y] = along(LAPTOP, m); laptop(g, L, t, x, y, m > 0.5 ? 0 : 5); if (m > 0.5) { R(g, x + 3, y - 14, 12, 10, '#7A1E24'); px(g, x + 6, y - 11, L.paper); px(g, x + 11, y - 11, L.paper); hl(g, x + 6, x + 11, y - 7, L.paper); } }
    const scared = m > 0.15, saving = between(t, C.crystal, C.crystal + 0.6);
    drawBayu(g, L, B13.bayu[0] - Math.round(m * 6), B13.bayu[1], { arm: saving ? 'up' : t >= C.crystal && !scared ? 'point' : 'down', armL: scared ? 'up' : 'down', eyes: blink(t, scared ? 'wide' : t >= C.back[1] ? 'happy' : 'focus'), mouth: scared ? 'o' : 'smile', hy: breathe(t), rank: 1, glasses: true });
    const [kx, ky] = along([B13.kursor[0], F8, B13.kursor[0] - 6, F8, 14], m);
    drawKursor(g, L, kx, ky, { hat: true, arms: scared ? 'wave0' : 'down', eyes: scared ? 'q' : 'happy' });
    slamTentacle(g, P, t);
    if (between(t, C.wave, C.wave + 0.7)) { splash(g, P, C.wave, t, SLAM[0] - 6, SLAM[1], 22, 26); splash(g, P, C.wave + 0.05, t, SLAM[0] + 8, SLAM[1], 16, 20); }
  },
  prop(g, t, P, v) {
    const C = CUE.commit;
    if (t < C.crystal) return;
    const [cx, cy] = B13.crystal, age = t - C.crystal;
    // the save point pops in (overshoot, settle) and bobs a pixel on its own
    const s = age < 0.25 ? Math.round(26 * ease.outBack(Math.min(1, age / 0.25), 2.2)) : 26, bob = Math.floor(fidx(t) / 20) % 2;
    const rewinding = t >= C.back[0] && t < C.back[1] + 0.4;
    crystal(g, cx, cy + bob, s, t, rewinding ? 1 : 0.6);
    // "simpan versinya": a scan sweeps down over the deck as the version is saved
    if (between(t, C.crystal + 0.1, C.crystal + 0.5)) { const y = Math.round(250 + ((t - C.crystal - 0.1) / 0.4) * 80); R(g, 4, y, 262, 2, PROP.cyanL); R(g, 4, y - 3, 262, 1, PROP.cyan); }
    // the way back: a beam of dots from the crystal down to the deck while the mess rewinds
    if (between(t, C.back[0], C.back[1] + 0.2)) { const f = Math.min(1, (t - C.back[0]) / (C.back[1] - C.back[0])); for (let i = 0; i < 18; i++) { if (i / 18 > f) break; const u = i / 18, x = cx + (130 - cx) * u, y = cy + s + 6 + (300 - cy - s - 6) * u; R(g, x - 1, y - 1, 3, 3, i % 2 ? PROP.cyan : PROP.cyanL); } }
  },
  ui(u, t) {
    const C = CUE.commit, [cx, cy] = B13.crystal;
    if (between(t, S.commit.vo.s, C.crystal)) tag(u, 'TES 3/3 LOLOS', 60, 200, { age: t - S.commit.vo.s, color: UI.ok, size: 30 });
    if (t >= C.label) tag(u, 'commit · v1', cx * 2, cy * 2 + 70, { age: t - C.label, align: 'center', color: '#5FE3F0', size: 32 });
    if (between(t, C.mess[0] + 0.15, C.back[0])) tag(u, 'berantakan!', 60, 200, { age: t - C.mess[0] - 0.15, color: UI.danger, size: 34 });
    if (t >= C.back[1]) tag(u, 'balik ke v1', 60, 200, { age: t - C.back[1], color: UI.ok, size: 34 });
  },
  post(c, t) { // the rewind back to the commit: scan bands slip, like S1
    const C = CUE.commit;
    if (!between(t, C.back[0], C.back[1])) return;
    const f = fidx(t);
    for (let b = 0; b < 10; b++) { const y = Math.floor(hash(b, f) * 1880), h = 8 + Math.floor(hash(b, f + 7) * 40), dx = Math.round((hash(b, f + 3) - 0.5) * 40 / 4) * 4; c.drawImage(c.canvas, 0, y, W, h, dx, y, W, h); }
  },
  anchor() { return null; },
};

const RAIL8 = Math.round(1000 / 10);

// ---------------------------------------------------------------- S14 · ulangi: the five rules, lap after lap (×4)
export const ulangi = {
  view: wideView, world: wide, boss: (t) => t < CUE.ulangi.flee[1] + 0.3,
  ui(u, t) {
    const U = CUE.ulangi;
    bossPlate(u, t, hpAt(t), TENTACLES, bossK(t));
    // the loop: five rule icons on a ring, the pointer goes round once per lap
    if (t >= U.flee[1] + 0.2) return;
    // in the sky over the kraken's head, so the ship and every hit stay in view
    const j = Math.max(0, U.steps.findLastIndex((s) => t >= s)), cur = t < U.m0 ? -1 : j % 5, cx = 382, cy = 334, r = 54;
    panel(u, cx - 82, cy - 90, 164, 180, { alpha: 0.86 });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r), on = i === cur;
      dot(u, x, y, on ? 17 : 15, on ? SLOT_COL[i] : '#26304C');
      slotIcon(u, i, x - 10, y - 10, 2, on ? '#11162A' : SLOT_COL[i]);
    }
    pxText(u, `x${Math.min(3, Math.floor(Math.max(0, j) / 5) + 1)}`, cx, cy - 14, 34, UI.sel, { align: 'center' });
  },
  anchor() { return null; },
};
