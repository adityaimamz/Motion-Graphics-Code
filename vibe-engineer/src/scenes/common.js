// common.js — small helpers shared by the scenes. Timing values always come from timeline.js (CUE / S).
import { clamp, inv, ease, fidx, hash, mix, hex } from '../core.js';
import { beatAt } from '../timeline.js';
import { R, px, hl, vl, dither } from '../pixel/draw.js';
import { sky, stars, moon, sea } from '../art/dunia.js';
import { palette } from '../pixel/palette.js';

// progress stepped at 12 fps (pixel-game motion): 0..1 over [a, a+dur]
export function step(t, a, dur) {
  const f = Math.floor((fidx(t) - fidx(a)) / 5) * 5 / 60;
  return clamp(f / dur);
}
export const sm = (t, a, dur, e = ease.outCubic) => e(inv(a, a + dur, t));
export const between = (t, a, b) => t >= a && t < b;
// nod on the beat: 1 for the first quarter of every beat
export const onBeat = (t) => { const b = beatAt(t); return b.ph < 0.25 ? 1 : 0; };
// typing arms alternate at 12 fps
export const typeFrame = (t) => (Math.floor(fidx(t) / 5) % 2 ? 'type1' : 'type0');
// idle life: open eyes blink for 5 frames every ~2.8 s; the head sinks 1 px for half of a 1.4 s breath
export const blink = (t, e) => ((e === 'focus' || e === 'open') && fidx(t) % 168 < 5 ? 'shut' : e);
export const breathe = (t) => (Math.floor(fidx(t) / 42) % 2);
// parabolic hop from a to b (world px), k 0..1
export function hop(a, b, k, h = 10) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * h]; }
// pixel shake offset, stepped
export function shake(t, a, dur, amp) { if (t < a || t > a + dur) return [0, 0]; const s = Math.floor(fidx(t) / 3); return [((s * 7) % 3) - 1, ((s * 5) % 3) - 1].map((v) => v * amp); }
// world → UI coordinates (UI is 540×960, ×2) for a view { P, cx, cy }
export const toUI = (v, wx, wy) => [((wx - v.cx) * v.P) / 2, ((wy - v.cy) * v.P) / 2];
// world → prop coordinates (props are 270×480, ×4)
export const toProp = (v, wx, wy) => [((wx - v.cx) * v.P) / 4, ((wy - v.cy) * v.P) / 4];

// ---------------------------------------------------------------- the stage of every close-up
// Same frame at every scale: feet on the deck at y 1296 px (just above the explainer card), the bulwark's rail at
// 1000 px, the horizon at 900 px. Plain and calm, so the character and the explaining object carry the frame.
export const FLOOR = (P) => Math.round(1296 / P);
export const RAIL = (P) => Math.round(1000 / P);
export const HORIZON = (P) => Math.round(900 / P);
// o: { mast: x | null, lantern: [x, y] | null, night: bool, moon: [x, y, r], behind: fn }
export function deck(g, P, t, v, o = {}) {
  const w = Math.ceil(1080 / v.P) + 4, x0 = Math.floor(v.cx) - 2, fl = FLOOR(v.P), rl = RAIL(v.P), hz = HORIZON(v.P), bot = Math.ceil(1920 / v.P) + 4;
  if (v.P >= 10) { // close up, a dither would read as a checkerboard: solid bands instead
    const n = 6; for (let b = 0; b < n; b++) R(g, x0, Math.round(-2 + (b * (hz + 4)) / n), w, Math.ceil((hz + 4) / n) + 1, hex(mix(P.sky0, P.sky1, b / (n - 1))));
  } else sky(g, P, x0, -2, w, hz + 4, hz + 2);
  if (o.night) { stars(g, P, t, x0, 0, w, hz - 6, Math.round(w * 0.6)); if (o.moon) moon(g, P, o.moon[0], o.moon[1], o.moon[2] ?? 4); }
  sea(g, P, t, x0, x0 + w, hz, rl + 2, { amp: 0.5 });
  o.behind?.(); // things rising out of the sea behind the rail
  // bulwark (planks, posts, cap rail)
  R(g, x0, rl, w, fl - rl, P.wood1);
  for (let y = rl + 4; y < fl; y += 4) hl(g, x0, x0 + w, y, P.wood0);
  for (let x = x0 + 4 - (x0 % 12); x < x0 + w; x += 12) R(g, x, rl, 2, fl - rl, P.wood0);
  R(g, x0, rl - 1, w, 3, P.wood2); hl(g, x0, x0 + w, rl + 2, P.wood0);
  // deck planks, seen from above, receding
  R(g, x0, fl, w, bot - fl, P.wood2);
  for (let y = fl + 3, gap = 3; y < bot; y += gap, gap += 1) hl(g, x0, x0 + w, y, P.wood1);
  hl(g, x0, x0 + w, fl, P.wood0);
  if (o.mast != null) { R(g, o.mast, -4, 4, fl + 4, P.wood1); R(g, o.mast + 3, -4, 1, fl + 4, P.wood0); }
  if (o.lantern) {
    const [lx, ly] = o.lantern;
    vl(g, lx + 1, ly - 4, ly - 1, P.iron); R(g, lx - 1, ly - 1, 5, 6, P.ink); R(g, lx, ly, 3, 4, P.lantern); px(g, lx + 1, ly + 1, '#FFF3B0');
  }
}
// a few pixel "speed" ticks (cuts are hidden under foam / a smear, never a blur)
export function foam(g, P, t, t0, w, h) {
  if (t - t0 >= 2 / 60 || t < t0) return;
  for (let i = 0; i < 160; i++) R(g, Math.floor(hash(i, 3) * w), Math.floor(hash(i, 4) * h), 3 + (i % 4), 2, P.foam);
}
// characters and props in a night close-up are lit by the deck lantern: warm and readable against the night
// (the same light the hold uses); the sky, sea and bulwark keep the night palette
export const lampLit = (P) => (+P.key >= 0.8 && +P.key <= 1.2 ? palette(0.4) : P);
