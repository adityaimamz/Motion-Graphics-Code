// film.js — the edit. render(c, t) draws the whole frame at time t. Pure function of t.
// Per frame, three pixel layers, each with one fixed pixel size:
//   1. world  — the scene on a low-res canvas, 1 world px = P×P px (P = 4 wide … 16 close-up), scaled up without smoothing
//   2. props  — the explaining objects (code window, shield, crystal…), 1 prop px = 4×4 px, flat colours
//   3. UI     — HUD (rank + five rule slots), explainer card, bubbles, 1 UI px = 2×2 px
// then the scene's own full-res overlays (rewind scanlines, iris, closing).
// Close-ups drift sideways a few px over the scene (world + props together; the HUD and the card stay put).
// Cuts listed in timeline.TRANS are covered by a wipe: both scenes are drawn and the incoming one is revealed.
import { W, H, canvas, ease, clamp } from './core.js';
import { palette } from './pixel/palette.js';
import { S, CUE, SLOT_AT, TRANS, SCENE_IDS, sceneAt, todAt, DURATION, MARKERS } from './timeline.js';
import { UW, UH, rankBadge, ruleSlots, plusOne, card, activeCard, bubble, activeBubble } from './ui.js';
import { SCENES } from './scenes/index.js';
import { toUI } from './scenes/common.js';

export { DURATION, MARKERS };
const WORLD = {};
for (const P of [4, 6, 8, 10, 12, 16]) { const cv = canvas(Math.ceil(W / P) + 2, Math.ceil(H / P) + 2); WORLD[P] = { cv, g: cv.getContext('2d') }; }
const UIC = canvas(UW, UH), UG = UIC.getContext('2d');
const PC = canvas(UW, UH), PG = PC.getContext('2d');
const OFF = [canvas(W, H)].map((cv) => ({ cv, g: cv.getContext('2d') })); // the outgoing scene during a wipe

export function init() {}

// the slow sideways drift of a close-up: ±12 px across the scene, alternating direction scene by scene
function drift(id, t, v) {
  if (v.P < 10 || v.drift === false) return 0;
  const sc = S[id], i = SCENE_IDS.indexOf(id), k = ease.inOutCubic(clamp((t - sc.t0) / (sc.t1 - sc.t0)));
  return Math.round((i % 2 ? 1 : -1) * (k * 24 - 12));
}
// the HUD steps back (dimmer) unless it is changing: a rank swap, slots appearing, a slot filling
function hudAlpha(t) {
  const hot = [CUE.pangkat.costume, CUE.pangkat.slots, CUE.layar.hat, ...SLOT_AT].some((x) => t >= x - 0.1 && t < x + 1.6);
  return hot ? 1 : 0.72;
}

function renderScene(c, t, id) {
  const sc = SCENES[id], v = sc.view(t);
  const P = palette(v.tod ?? todAt(t)), dx = drift(id, t, v);
  c.save();
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // ---- 1. world
  if (sc.world) {
    const { cv, g } = WORLD[v.P];
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, cv.width, cv.height);
    const fx = Math.floor(v.cx), fy = Math.floor(v.cy);
    g.translate(1 - fx, 1 - fy);
    sc.world(g, t, P, v);
    const ox = Math.round((1 + v.cx - fx) * v.P), oy = Math.round((1 + v.cy - fy) * v.P);
    c.drawImage(cv, -ox + dx, -oy, cv.width * v.P, cv.height * v.P);
  }
  UG.setTransform(1, 0, 0, 1, 0, 0); UG.clearRect(0, 0, UW, UH); UG.imageSmoothingEnabled = false;
  if (id === 'closing') { sc.ui?.(UG, t, v, P); c.drawImage(UIC, 0, 0, W, H); }
  else {
    // ---- 2. props (prop px → ×2 onto their canvas → ×2 on screen), moving with the world
    if (sc.prop) {
      PG.setTransform(1, 0, 0, 1, 0, 0); PG.clearRect(0, 0, UW, UH); PG.imageSmoothingEnabled = false;
      PG.setTransform(2, 0, 0, 2, 0, 0); sc.prop(PG, t, P, v);
      c.drawImage(PC, dx, 0, W, H);
    }
    // ---- 3. UI
    if (v.hud !== false && t >= S.bayu.t0) {
      UG.globalAlpha = hudAlpha(t);
      rankBadge(UG, t);
      ruleSlots(UG, t, CUE.pangkat.slots);
      UG.globalAlpha = 1;
    }
    sc.ui?.(UG, t, v, P);
    if (v.hud !== false) for (let i = 0; i < 5; i++) plusOne(UG, t, i, sc.boss?.(t) ? 64 : 0);
    const k = activeCard(t);
    if (k && v.card !== false) card(UG, t, k, sc.cardOpts?.(t, k) ?? {});
    const d = activeBubble(t);
    if (d && sc.anchor) { const a = sc.anchor(d.who, t, v); if (a) { const [ux, uy] = toUI(v, a[0], a[1]); bubble(UG, t, d, ux + dx / 2, uy, a[2]); } }
    c.drawImage(UIC, 0, 0, W, H);
  }
  // ---- full-res overlays
  sc.post?.(c, t, v, P);
  c.restore();
}

// ---------------------------------------------------------------- transitions over a cut
// 'wipe'  : a pixel staircase sweeps left → right (forward, like the brand arrow), a paper edge at its front
// 'battle': strips of the next scene slide in from alternate sides (the old RPG "entering battle" break-up)
const STEP = 24;
function wipeMask(c, A, p) { // draws the outgoing frame A where the wipe has not passed yet
  const rows = Math.ceil(H / 96), span = W + rows * 40 + STEP * 2;
  for (let r = 0; r < rows; r++) {
    const front = Math.round((p * span - r * 40) / STEP) * STEP, x = Math.max(0, front), y = r * 96;
    if (x < W) c.drawImage(A, x, y, W - x, 96, x, y, W - x, 96);
    if (front > -12 && front < W) { c.fillStyle = '#F4EEDC'; c.fillRect(front - 12, y, 12, 96); c.fillStyle = '#11162A'; c.fillRect(front, y, 4, 96); }
  }
}
function battleMask(c, A, p) {
  const n = 12, h = H / n;
  for (let i = 0; i < n; i++) {
    const w = Math.round((ease.inOutCubic(clamp(p * 1.25 - (i % 3) * 0.08)) * W) / STEP) * STEP, y = Math.round(i * h), hh = Math.round((i + 1) * h) - y;
    if (i % 2) { if (w < W) c.drawImage(A, 0, y, W - w, hh, 0, y, W - w, hh); if (w > 0 && w < W) { c.fillStyle = '#A47BE0'; c.fillRect(W - w - 8, y, 8, hh); } }
    else { if (w < W) c.drawImage(A, w, y, W - w, hh, w, y, W - w, hh); if (w > 0 && w < W) { c.fillStyle = '#A47BE0'; c.fillRect(w, y, 8, hh); } }
  }
}
export function render(c, t) {
  const tr = TRANS.find((x) => t >= x.at - x.d && t < x.at + x.d);
  if (!tr) return renderScene(c, t, sceneAt(t));
  renderScene(OFF[0].g, t, tr.from);
  renderScene(c, t, tr.to);
  const p = (t - tr.at + tr.d) / (2 * tr.d);
  c.save(); c.imageSmoothingEnabled = false;
  (tr.kind === 'battle' ? battleMask : wipeMask)(c, OFF[0].cv, p);
  c.restore();
}
