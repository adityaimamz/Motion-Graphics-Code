// S2–S4 · Dermaga — Bayu, vibe coder: he chats, the AI codes; he never reads it (eyes closed); every crate of AI
// code is accepted with one button, stamped RILIS!, and the ship sails into the night.
import { keys, ease, fidx, hash, clamp } from '../core.js';
import { S, CUE } from '../timeline.js';
import { R, px, line } from '../pixel/draw.js';
import { sky, sunDisc, cloud, sea, seaFront, dock, crate, barrel, laptop, deckChair } from '../art/dunia.js';
import { shipBack, shipFront, drawWheel, deckY, poopY, stand } from '../art/kapal.js';
import { drawBayu } from '../art/bayu.js';
import { drawKursor, blinkOff } from '../art/kursor.js';
import { bigButton } from '../art/props.js';
import { PROP, UI } from '../pixel/palette.js';
import { tag, panel, pxText, stamp, tri, textWidth } from '../ui.js';
import { step, between, onBeat, typeFrame, hop, shake, toUI, toProp, deck, FLOOR, foam } from './common.js';

export const WL0 = 300, SHIP_X = 162, DOCK_X1 = 82;

// ---------------------------------------------------------------- harbour wide (S2 opening, S4 departure)
function sunY(t) { return keys(t, [[S.bayu.t0, 250], [CUE.muat.sunset[0], 292, ease.lin], [CUE.muat.sunset[1], 346, ease.inCubic]]); }
export function backdrop(g, t, P, cx) {
  sky(g, P, cx, 0, 272, WL0 + 2, WL0);
  sunDisc(g, P, cx + 228, sunY(t), 12);
  cloud(g, P, cx + 58, 170, 1); cloud(g, P, cx + 196, 150, 0.8);
}
// sailing distance after the bell (continues into S5)
export function sailD(t) {
  const u = t - CUE.muat.depart;
  return u <= 0 ? 0 : u < 1 ? 22 * u * u : 22 + 44 * (u - 1);
}
// the crates that came aboard, on deck (also seen in S5's wide)
export function deckCrates(g, P, o) {
  crate(g, P, o.x + 30, stand(o)); crate(g, P, o.x + 46, stand(o)); crate(g, P, o.x + 38, stand(o) - 13);
}
function harbourWide(g, t, P, v, o) {
  backdrop(g, t, P, v.cx);
  if (P.star !== P.sky0) for (let i = 0; i < 30; i++) { if (t > CUE.muat.sunset[0] + (i / 30) * (CUE.muat.sunset[1] - CUE.muat.sunset[0])) px(g, v.cx + Math.floor(hash(i, 11) * 270), Math.floor(hash(i, 12) * 240), P.star); }
  sea(g, P, t, v.cx, v.cx + 272, WL0, 482);
  shipBack(g, P, t, o);
  drawKursor(g, P, o.x - 62, poopY(o), { hat: true, arms: o.bellSwing ? 'rope' : 'wheel', eyes: 'happy', off: !o.bellSwing && blinkOff(t) });
  drawWheel(g, P, o);
  if (o.loaded) deckCrates(g, P, o);
  deckChair(g, P, o.x + 10, stand(o));
  drawBayu(g, P, o.x + 10, stand(o) + 1, { legs: 'chair', arm: 'cup', eyes: 'closed', rank: 0, hy: onBeat(t) });
  shipFront(g, P, t, o);
  seaFront(g, P, t, v.cx, v.cx + 272, WL0, 482);
  dock(g, P, 0, DOCK_X1, WL0 - 8);
  if (!o.free) line(g, DOCK_X1 - 8, WL0 - 15, o.x - 70, deckY(o) - 6, P.rope1);
}

// ---------------------------------------------------------------- S2 · Ini Bayu, vibe coder
const B2 = { bayu: [26, 109], kursor: [60, 108], barrel: [78, 108], laptop: [69, 94] };
const PROMPT = 'bikinin aplikasi toko online, dong';
export const bayu = {
  view(t) { return t < CUE.bayu.cut ? { P: 4, cx: 0, cy: 0 } : { P: 12, cx: 0, cy: 0 }; },
  world(g, t, P, v) {
    const C = CUE.bayu;
    if (t < C.cut) return harbourWide(g, t, P, v, { x: SHIP_X, wl: WL0, sail: 'coder', wheel: false });
    deck(g, P, t, v, { mast: 6 });
    deckChair(g, P, B2.bayu[0], FLOOR(12));
    const talking = between(t, C.ask, C.ask + 0.9);
    drawBayu(g, P, B2.bayu[0], B2.bayu[1], { legs: 'chair', arm: 'cup', eyes: 'closed', rank: 0, mouth: talking && Math.floor(fidx(t) / 5) % 2 ? 'o' : 'smile', hy: onBeat(t) });
    barrel(g, P, B2.barrel[0], B2.barrel[1]);
    const lines = t < C.glyphs[0] ? 0 : 1 + Math.floor((t - C.glyphs[0]) * 4);
    laptop(g, P, t, B2.laptop[0], B2.laptop[1], lines);
    const typing = t >= C.glyphs[0];
    drawKursor(g, P, B2.kursor[0], B2.kursor[1], { hat: true, arms: typing ? typeFrame(t) : 'down', eyes: typing ? 'happy' : 'open', off: !typing && blinkOff(t) });
    // code glyphs hop from Kursor's hands into the laptop
    if (typing) {
      const st = Math.floor(fidx(t) / 5), cols = [P.code1, P.code2, P.code3, P.code5];
      for (let i = 0; i < 3; i++) {
        const f = ((st + i * 2) % 6) / 6, x0 = B2.kursor[0] + 6, y0 = B2.kursor[1] - 14, x1 = B2.laptop[0] + 8, y1 = B2.laptop[1] - 10;
        R(g, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * 8, 2, 2, cols[(st + i) % 4]);
      }
    }
    foam(g, P, t, C.cut, 92, 162);
  },
  ui(u, t, v) {
    const C = CUE.bayu;
    if (t < C.cut) return;
    // the prompt box: this is all Bayu does
    if (t >= C.ask) {
      const n = Math.floor((t - C.ask) * 32);
      panel(u, 40, 192, 425, 96, { fill: '#F3EBD8', frame: UI.panel, inner: false, alpha: 1 });
      pxText(u, 'TANYA AI', 56, 198, 24, '#8A8478');
      pxText(u, PROMPT, 56, 228, 30, UI.panel, { reveal: n });
      if (n < PROMPT.length || Math.floor(t * 2) % 2) { const cw = Math.min(n, PROMPT.length); u.fillStyle = UI.panel; u.fillRect(58 + (cw ? Math.ceil(textWidthCached(PROMPT.slice(0, cw))) : 0), 228, 3, 26); }
      u.fillStyle = '#C8333A'; u.fillRect(412, 244, 38, 30); tri(u, 425, 249, 19, '#F3EBD8');
    }
    if (t >= C.tagBayu) { const [x, y] = toUI(v, B2.bayu[0], B2.bayu[1] - 34); tag(u, 'Bayu', x - 30, 320, { age: t - C.tagBayu, align: 'center', to: [x, y] }); }
    if (t >= C.tagAI) { const [x, y] = toUI(v, B2.kursor[0], B2.kursor[1] - 26); tag(u, 'Kursor · AI', x + 10, 330, { age: t - C.tagAI, align: 'center', to: [x, y] }); }
  },
  anchor() { return null; },
};
const twc = new Map();
function textWidthCached(s) { let w = twc.get(s); if (w == null) { w = textWidth(s, 30); twc.set(s, w); } return w; }

// ---------------------------------------------------------------- S3 · merem (close-up ×16)
const M = { bayu: [31, 70], crate: [23, 81], barrel: [57, 81], laptop: [48, 67], kursor: [10, 81] };
export const merem = {
  view: () => ({ P: 16, cx: 0, cy: 0 }),
  world(g, t, P, v) {
    const C = CUE.merem;
    deck(g, P, t, v, { mast: 64 });
    crate(g, P, M.crate[0], M.crate[1]);
    barrel(g, P, M.barrel[0], M.barrel[1]);
    const lines = 2 + Math.floor((t - S.merem.t0) * 6);
    laptop(g, P, t, M.laptop[0], M.laptop[1], lines);
    // Bayu: nods on the beat, sips without looking, thumbs up on "literally" — eyes closed all along
    const sip = between(t, C.sip, C.sip + 0.6), thumb = t >= C.thumb;
    drawBayu(g, P, M.bayu[0], M.bayu[1], { legs: 'sit', arm: thumb ? 'thumb' : sip ? 'sip' : 'cup', eyes: 'closed', rank: 0, hy: onBeat(t), mouth: thumb ? 'grin' : 'smile' });
    // Kursor types; on "ngoding sambil merem" it hops up and waves in front of his face
    const waving = between(t, C.wave[0], C.wave[1]);
    let [kx, ky] = M.kursor;
    if (waving) { const k = step(t, C.wave[0], 0.25); [kx, ky] = hop(M.kursor, [M.bayu[0] - 17, M.bayu[1] - 12], k, 8); } // beside his face, the waving hand in front of it
    drawKursor(g, P, kx, ky, { hat: true, arms: waving ? (Math.floor(fidx(t) / 4) % 2 ? 'wave0' : 'wave1') : typeFrame(t), eyes: waving ? 'open' : 'happy' });
    if (!waving && t < C.wave[0]) {
      const st = Math.floor(fidx(t) / 5), cols = [P.code1, P.code2, P.code3, P.code5];
      for (let i = 0; i < 3; i++) {
        const f = ((st + i * 2) % 6) / 6, x0 = kx + 6, y0 = ky - 12, x1 = M.laptop[0] + 8, y1 = M.laptop[1] - 8;
        R(g, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * 14, 1, 1, cols[(st + i) % 4]);
      }
    }
  },
  ui(u, t, v) {
    // the counter: AI writes lines, nobody reads them
    const n = Math.floor((t - S.merem.t0) * 37) * 3 + 12;
    panel(u, 250, 196, 215, 82);
    pxText(u, 'ditulis AI', 264, 200, 28, UI.dim); pxText(u, `${n} baris`, 452, 200, 28, UI.text, { align: 'right' });
    pxText(u, 'dibaca', 264, 236, 28, UI.dim); pxText(u, '0 baris', 452, 236, 28, UI.danger, { align: 'right' });
  },
  anchor(who) { return who === 'kursor' ? [M.kursor[0], M.kursor[1] - 22] : [M.bayu[0], M.bayu[1] - 34]; },
};

// ---------------------------------------------------------------- S4 · terima semua (×10), then the departure (×4)
// One slap of TERIMA SEMUA and the crates of AI code keep coming, one batch per beat: they stack into a tower that
// fills the sky (the counter climbs with it), Kursor riding on top. Nobody opens a single one. Then: RILIS!
const F4 = FLOOR(10);
const A4 = { bayu: [19, F4], btn: [102, 282], cols: [52, 68] }; // btn in prop px (top-centre)
const BATCH = [2, 4, 6, 8, 10, 12];                             // crates aboard after each drop
const COUNT = [12, 140, 388, 902, 1604, 2418];
const shotB = (t) => t >= CUE.muat.cutB;
export const loadAt = (t) => CUE.muat.crates.filter((c) => t >= c).length;
const fmtN = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const crateLand = (j) => { const b = BATCH.findIndex((n) => j < n), first = b ? BATCH[b - 1] : 0; return CUE.muat.crates[b] + (j - first) * 0.07; };
const slot = (j) => [A4.cols[j % 2], F4 - 13 * Math.floor(j / 2)];
const landed = (t) => { let n = 0; while (n < 12 && t >= crateLand(n)) n++; return n; };
// the tower sways once it is tall (untested code, stacked high), 1 px on the beat
const sway = (t, row) => (row >= 4 && t < CUE.muat.stamp + 0.4 && onBeat(t) ? (row % 2 ? 1 : -1) : 0);
export const muat = {
  view(t) { if (shotB(t)) return { P: 4, cx: Math.max(0, sailD(t) - 6), cy: 0 }; const [sx, sy] = shake(t, CUE.muat.slap, 0.15, 1); return { P: 10, cx: sx, cy: sy }; },
  world(g, t, P, v) {
    const C = CUE.muat;
    if (shotB(t)) {
      const o = { x: SHIP_X + sailD(t), wl: WL0 + 2, sail: 'coder', wheel: false, hatchFill: 1, loaded: true, free: t >= C.depart };
      o.bellSwing = between(t, C.bell, C.bell + 0.5) ? (Math.floor(fidx(t) / 4) % 2 ? 1 : -1) : 0;
      harbourWide(g, t, P, v, o);
      foam(g, P, t, C.cutB, 272, 482);
      return;
    }
    deck(g, P, t, v, { mast: 6 });
    // the tower: each crate falls from above the frame into its slot, lands with a 1-px bounce and a puff of dust
    for (let j = 0; j < 12; j++) {
      const L = crateLand(j); if (t < L - 0.35) continue;
      const [x, y] = slot(j), row = Math.floor(j / 2), k = ease.inCubic(clamp((t - L + 0.35) / 0.35));
      const cy = Math.round(-14 + (y + 14) * k) + (between(t, L, L + 0.08) ? -1 : 0);
      crate(g, P, x + sway(t, row), cy);
      if (between(t, L, L + 0.12)) { R(g, x - 3, y - 2, 2, 1, P.foam); R(g, x + 17, y - 2, 2, 1, P.foam); R(g, x - 5, y - 4, 1, 1, P.foam); R(g, x + 20, y - 4, 1, 1, P.foam); }
    }
    // Kursor rides the top of the tower, hopping up a row each time one is complete
    const n = landed(t), rows = Math.floor(n / 2), ky = (r) => F4 - 13 * r, rT = rows ? crateLand(rows * 2 - 1) : 0;
    let [kx, kyy] = [A4.cols[1], ky(rows)];
    if (rows && t - rT < 0.2) [kx, kyy] = hop([kx, ky(rows - 1)], [kx, ky(rows)], step(t, rT, 0.2), 6);
    drawKursor(g, P, kx + sway(t, rows), kyy, { hat: true, arms: t >= C.crates[0] && t < C.stamp ? (Math.floor(fidx(t) / 6) % 2 ? 'wave0' : 'wave1') : t >= C.stamp ? 'wave0' : 'down', eyes: 'happy' });
    const C2 = C.slap, up = between(t, C2 - 0.3, C2), down = between(t, C2, C2 + 0.35);
    const happy = t >= C.stamp;
    drawBayu(g, P, A4.bayu[0], A4.bayu[1], { arm: up ? 'slapUp' : down ? 'slapDown' : happy ? 'thumb' : 'cup', eyes: 'closed', rank: 0, mouth: happy ? 'grin' : 'smile', hy: onBeat(t) });
  },
  prop(g, t, P, v) {
    if (shotB(t)) return;
    const C = CUE.muat, pressed = between(t, C.slap, C.slap + 0.35);
    bigButton(g, A4.btn[0], A4.btn[1], 64, pressed, 'green');
    if (t < C.slap - 0.3 && Math.floor(fidx(t) / 9) % 2 === 0) { R(g, A4.btn[0] - 30, A4.btn[1] + 1, 60, 2, PROP.greenL); R(g, A4.btn[0] - 34, A4.btn[1] - 4, 2, 2, PROP.greenL); R(g, A4.btn[0] + 32, A4.btn[1] - 4, 2, 2, PROP.greenL); } // tempting
    // the slapping arm lands on top of the cap (the world sprite's arm is behind the button)
    if (pressed) {
      const [sx, sy] = toProp(v, A4.bayu[0] + 6, A4.bayu[1] - 15), hx = A4.btn[0] - 16, hy = A4.btn[1];
      line(g, sx, sy, hx - 3, hy, P.ink, 7); line(g, sx, sy, hx - 3, hy, P.hood0, 5);
      R(g, hx - 5, hy - 4, 11, 8, P.ink); R(g, hx - 4, hy - 3, 9, 6, P.skin0); R(g, hx - 4, hy + 1, 9, 2, P.skin1);
      if (t < C.slap + 0.1) for (const [dx, dy, w, h] of [[-14, -6, 4, 1], [-12, -11, 1, 3], [10, -6, 4, 1], [8, -11, 1, 3], [-1, -13, 1, 4]]) R(g, hx + dx, hy + dy, w, h, PROP.paper);
    }
  },
  ui(u, t, v) {
    const C = CUE.muat;
    if (shotB(t)) return;
    // the label on the button's pedestal
    const [bx, by] = [A4.btn[0] * 2, A4.btn[1] * 2];
    pxText(u, 'TERIMA', bx, by + 30, 26, PROP.paper, { align: 'center' });
    pxText(u, 'SEMUA', bx, by + 56, 26, PROP.paper, { align: 'center' });
    // the counter (top left, clear of the tower)
    const n = loadAt(t);
    if (t >= C.slap) {
      panel(u, 40, 196, 216, 82);
      pxText(u, 'kode diterima', 54, 200, 26, UI.dim); pxText(u, fmtN(n ? COUNT[n - 1] : 0), 242, 200, 26, UI.ok, { align: 'right' });
      pxText(u, 'dibaca · dites', 54, 236, 26, UI.dim); pxText(u, '0 · 0', 242, 236, 26, UI.danger, { align: 'right' });
    }
    if (t >= C.stamp) { const [x, y] = toUI(v, A4.cols[1], 88); stamp(u, t, C.stamp, 'RILIS!', x, y); } // slammed onto the tower
  },
  anchor() { return null; },
};
