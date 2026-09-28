// S1 · Layar · 0–7.5. Macro from the top edge of the display looking down the screen (toward the bottom,
// +y). Row 0 ignites just in front of the lens at ~0.17 s; the refresh line then recedes up the frame at
// ~6 rows/s (×25.000), focus riding on it. The captions sit above it, on the rows not yet painted. On
// 7.03–7.5 the camera tips down onto the painted rows and drops to the cover glass (S2 goes on down).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import { screen } from '../sets/screen';
import { v3, mixCam, type Cam } from '../r3';
import { eIO, P } from '../motion';
import type { Chapter } from '../world';

const [T0, T1] = CH.layar;
const [PL0, PL1] = CUE.layar.plunge;

/**
 * Camera over the display: at (x, y, z) display units, pitched down `pitchDeg`, looking toward the bottom
 * of the phone (dir 1) or toward its top (dir -1). Focus at `focus` (distance), aperture `ap`.
 */
export function macroCam(x: number, y: number, z: number, pitchDeg: number, dir: 1 | -1, fov: number, focus: number, ap: number): Cam {
  const p = THREE.MathUtils.degToRad(pitchDeg);
  const fwd = v3(0, dir * Math.cos(p), -Math.sin(p));
  const up = v3(0, dir * Math.sin(p), Math.cos(p));
  const pos = v3(x, y, z);
  return { pos, look: pos.clone().addScaledVector(fwd, 20), up, fov, focus, ap };
}

/** Distance from a camera position to the refresh line (straight ahead on the plane). */
const toLine = (pos: THREE.Vector3, row: number) => Math.hypot(row - pos.y, pos.z);

export function s1Cam(t: number): Cam {
  const u = Math.min(t, PL0);
  const pos = v3(470, -26 + 0.9 * u, 16 - 0.35 * u);
  const row = Math.max(scanRow(t), 2);
  const a = macroCam(pos.x, pos.y, pos.z, 20, 1, 40, toLine(pos, row), 22);
  if (t <= PL0) return a;
  const k = eIO(P(t, PL0, PL1 - PL0));
  const b = macroCam(500, 30, 8.7, 89.5, 1, 40, 8.9, 9);
  return mixCam(a, b, k);
}

const s1: Chapter = {
  id: 'layar',
  render(t, ctx, out) {
    screen.render(ctx, s1Cam(t), { scan: scanRow(t), lineGlow: 0.5, touch: 0 }, out);
    ctx.post.bloom = 0.55;
    ctx.post.bloomThreshold = 1.5;
  },
};
export default s1;
export { T0, T1 };
