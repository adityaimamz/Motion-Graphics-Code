// S2 · Chip · 7.5–13.125. Straight down through the display stack, one layer per beat (glass, touch mesh,
// emitters, the TFT row being scanned), out under the back plate onto the logic board; low FPV glide to
// the SoC; on 10.3125 the request is born and lights SoC → RF → coax → antenna gap at once; the camera
// whips along the afterglow and goes out through the plastic antenna gap (dark) into the room (S3).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import { screen } from '../sets/screen';
import { board, GAP_X } from '../sets/board';
import { v3, type Cam } from '../r3';
import { track, camPath } from '../path';
import { P } from '../motion';
import { clamp } from '../engine/util';
import type { Chapter } from '../world';

const [T0, T1] = CH.chip;
const L = CUE.chip.layers;           // glass, touch, OLED, TFT, board
const BIRTH = CUE.chip.birth;
const HAND = L[4]!;                  // 9.375: screen world -> board world

/** Top-down descent through the display stack (display units). */
function descentCam(t: number): Cam {
  const z = track([[T0, 8.7], [L[1]!, 3.0], [8.3, 0.6], [L[2]!, -0.05], [8.62, -1.6], [L[3]!, -2.4], [9.05, -8.6], [9.2, -12.5], [HAND, -15.5]], t);
  const y = track([[T0, 30], [L[2]!, 44], [L[3]!, scanRow(L[3]!) + 0.5], [HAND, scanRow(L[3]!) + 1.5]], t);
  const x = track([[T0, 500], [HAND, 502.5]], t);
  const roll = track([[T0, 0], [HAND, 34]], t);
  const pos = v3(x, y, z);
  // focus: the nearest layer below the camera
  const below = z > 3 ? z - 3 : z > 0 ? z : z > -9 ? z + 9 : z + 11;
  return { pos, look: pos.clone().add(v3(0, 0.0001, -10)), up: v3(0, 1, 0), fov: 44, roll, focus: Math.max(0.05, below), ap: 12 };
}

const BOARD_KEYS = [
  { t: 9.3, pos: v3(29, 13.5, 8), look: v3(36, 0, 21), fov: 46, ap: 10, up: v3(0, 0, 1) },
  { t: 10.25, pos: v3(38.5, 3.6, 14.2), look: v3(47, 0.2, 21.5), focus: 7.5, fov: 46, ap: 18, up: v3(0, 1, 0) },
  { t: 10.8, pos: v3(39.6, 3.3, 15.0), look: v3(48, 0.2, 21.8), focus: 7.2, fov: 46, ap: 18, up: v3(0, 1, 0) },
  { t: 11.35, pos: v3(47, 2.6, 17.5), look: v3(56, 0.5, 21), focus: 6, fov: 50, ap: 16, up: v3(0, 1, 0) },
  { t: 11.85, pos: v3(56.8, 3.4, 19.5), look: v3(56.5, 1.0, 8), focus: 7, fov: 50, ap: 14, up: v3(0, 1, 0) },
  { t: 12.3, pos: v3(55, 3.0, 9.5), look: v3(50.5, 1.2, 1), focus: 7, fov: 50, ap: 12, up: v3(0, 1, 0) },
  { t: 12.66, pos: v3(50.4, 1.6, 3.4), look: v3(GAP_X, 0.9, -1.5), fov: 50, ap: 8, up: v3(0, 1, 0) },
  { t: 12.95, pos: v3(GAP_X, 0.95, -0.2), look: v3(GAP_X, 0.9, -6), fov: 50, ap: 3, up: v3(0, 1, 0) },
  { t: T1, pos: v3(GAP_X, 0.9, -1.1), look: v3(GAP_X, 0.9, -8), fov: 50, ap: 3, up: v3(0, 1, 0) },
];

export const boardCam = (t: number) => camPath(BOARD_KEYS, t);

const s2: Chapter = {
  id: 'chip',
  render(t, ctx, out) {
    const r3 = ctx.r3;
    ctx.post.bloom = 0.6;
    ctx.post.bloomThreshold = 1.4;
    if (t < 9.3) { screen.render(ctx, descentCam(t), { scan: scanRow(t), lineGlow: 0.5, touch: 1, tft: 1 }, out); return; }
    if (t < HAND + 0.1) {
      // hand-off under the back plate: the dark stack gives way to the board below
      const k = clamp(P(t, 9.3, HAND + 0.1 - 9.3));
      screen.render(ctx, descentCam(Math.min(t, HAND)), { scan: scanRow(t), touch: 1, tft: 1 }, r3.a);
      board.render(ctx, boardCam(t), t, BIRTH, r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, k * k);
      return;
    }
    board.render(ctx, boardCam(t), t, BIRTH, out);
    // inside the plastic gap: the last frames go dark before the room opens (S3)
    const dark = P(t, 12.93, 0.12);
    if (dark > 0) ctx.post.fade = Math.max(ctx.post.fade ?? 0, dark * 0.96);
  },
};
export default s2;
