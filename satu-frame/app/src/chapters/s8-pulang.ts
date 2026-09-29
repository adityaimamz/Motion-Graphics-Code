// S8 · Pulang · 54.375–63.75. The dive: from orbit into Jakarta's cloud deck, out under it into the frozen
// rain (at ×2.100 the answer's radio wave crosses the city inside one frame: one flash through the drops),
// through the same window, over the desk, down onto the phone and into its last rows. The refresh line
// comes up the screen toward the lens and lands on row 2.400 exactly on the beat (61.875). Breath.
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import { earthDive } from './s7-orbit';
import { city, cityExposure, PHONE, DESK_Y, TOWER, TOWER_H } from '../sets/city';
import { screen } from '../sets/screen';
import { macroCam } from './s1-layar';
import { v3, mixCam, type Cam } from '../r3';
import { mcamPath, mtrack, type Key } from '../path';
import { P, eIO } from '../motion';
import { clamp } from '../engine/util';
import type { Chapter } from '../world';

const [T0, T1] = CH.pulang;
const S8 = CUE.pulang;
const BOT = PHONE.center.z + PHONE.l / 2;       // the screen's bottom edge (row 2400), metres

// the dive onto the desk: monotone (a far key cannot swing the camera through the ground or past the phone)
const CITY: Key[] = [
  { t: 56.15, pos: v3(-40, 1500, -380), look: v3(0, 8, -1), fov: 48, focus: 1500, ap: 2 },
  { t: 56.9, pos: v3(-7, 140, -48), look: v3(0, 8.4, -1), fov: 48, focus: 60, ap: 8 },
  { t: 57.65, pos: v3(-1.2, 24, -15), look: v3(0, 8.6, -1.1), fov: 48, focus: 3, ap: 16 },
  { t: 58.3, pos: v3(0.08, 9.05, -4.6), look: v3(0, 8.5, 0), fov: 50, focus: 2.5, ap: 14 },
  { t: S8.window + 0.3, pos: v3(0.02, 8.1, -0.55), look: v3(0, DESK_Y, -0.3), fov: 50, focus: 0.5, ap: 12 },
  { t: 59.6, pos: v3(0.0, 7.84, BOT - 0.03), look: v3(0, DESK_Y, BOT - 0.012), fov: 50, focus: 0.08, ap: 10, up: v3(0, 0, -1) },
  { t: S8.glass + 0.12, pos: v3(0.0005, DESK_Y + 0.0095, BOT - 0.0006), look: v3(0.0005, DESK_Y, BOT - 0.0007), fov: 50, focus: 0.001, ap: 6, up: v3(0, 0, -1) },
];

const cityCam = (t: number) => mcamPath(CITY, t, DESK_Y);

/** In the display (units: pixel pitch): over the last rows, facing up the screen toward the oncoming line. */
function dispCam(t: number): Cam {
  const k = eIO(P(t, S8.glass, 0.9));
  const y = mtrack([[S8.glass, 2392], [61.0, 2412], [S8.land, 2418], [T1, 2426]], t);
  const z = mtrack([[S8.glass, 24], [61.0, 12], [S8.land, 11], [T1, 17]], t);
  const down = macroCam(540.3, y, z, 89.5, -1, 44, z, 8);
  const ahead = macroCam(540.3, y, z, 6, -1, 42, Math.max(Math.hypot(y - Math.min(scanRow(t), 2400), z), 6), 20);
  return mixCam(down, ahead, k);
}

const s8: Chapter = {
  id: 'pulang',
  render(t, ctx, out) {
    const r3 = ctx.r3;
    ctx.post.bloomThreshold = 1.3;
    if (t < S8.cloud) { earthDive(ctx, t, out); return; }
    // under the cloud deck the city's exposure comes in; through the window, over the desk, it goes again
    ctx.post.exposure = cityExposure(eIO(P(t, S8.cloud, 0.25)) * (1 - eIO(P(t, S8.window, 0.7))));
    const cityState = () => {
      const flash = t >= S8.radio ? Math.exp(-(t - S8.radio) / 0.05) : 0;
      return {
        scan: scanRow(t), glow: 0.03 + 0.35 * clamp(scanRow(t) / 2400),
        fogD: mtrack([[56.15, 0.00045], [57.0, 0.0005], [58.0, 0.0008]], t, true), lightsGain: mtrack([[56.15, 2.2], [57.2, 1]], t),
        // the answer's radio wave: gone across the city inside a frame; drawn as that frame's flash
        wave: flash > 0.01 ? { origin: v3(TOWER.x, TOWER_H, TOWER.z), R: 1300, width: 900, k: 5 * flash, sheet: false } : null,
      };
    };
    if (t < S8.cloud + 0.25) {                     // through the cloud deck
      earthDive(ctx, t, r3.a);
      city.render(ctx, cityCam(t), cityState(), r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, P(t, S8.cloud, 0.25));
      return;
    }
    if (t < S8.glass) { city.render(ctx, cityCam(t), cityState(), out); return; }
    if (t < S8.glass + 0.14) {                     // into the glass of the phone
      city.render(ctx, cityCam(t), cityState(), r3.a);
      screen.render(ctx, dispCam(t), { scan: scanRow(t), lineGlow: 0.6, touch: 0 }, r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, P(t, S8.glass, 0.14));
      return;
    }
    screen.render(ctx, dispCam(t), { scan: scanRow(t), lineGlow: 0.6, touch: 0 }, out);
    ctx.post.bloomThreshold = 1.5;
    void THREE;
  },
};
export default s8;
