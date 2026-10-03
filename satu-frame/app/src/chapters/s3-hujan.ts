// S3 · Hujan · 13.125–20.625. Out of the antenna gap (still glowing blue on the desk), across the desk, through the rain-dotted window into
// the frozen rain. The camera backs away looking at the window; on 14.53 (×1.000.000) the radio shell leaves
// it and swells through the drops, passes the lens on 15.0, and the camera turns to chase it over the roofs
// to the tower (radius = c·Δt from the physical clock). The panels flash on 18.75; the signal runs down the
// tower into the ground and the camera follows it down (S4 takes it along the cable to the sea).
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import * as THREE from 'three';
import { city, cityExposure, ANT, TOWER, TOWER_H, EMIT, radioR, DROP, DROP_R } from '../sets/city';
import { gapHaze } from '../fx';
import { v3 } from '../r3';
import { mcamPath, type Key } from '../path';
import { P, eOut, eIO, damp, within } from '../motion';
import type { Chapter } from '../world';

const [T0, T1] = CH.hujan;
const HIT = CUE.hujan.tower;
const [D0, D1] = CUE.hujan.descend;
const dir = TOWER.clone().setY(0).sub(ANT.clone().setY(0)).normalize();
const along = (d: number, alt: number, side = 0) => v3(ANT.x + dir.x * d - dir.z * side, alt, ANT.z + dir.z * d + dir.x * side);

const BACK = v3(ANT.x, 8.6, ANT.z);
// Out through the window the camera brakes: one frozen raindrop hangs 12 cm beyond the pane. The lens closes
// in on it at a steady zoom (the city upside down inside it, "Hujan pun berhenti."), goes through it on the
// beat the tape-stop starts, and is flung out and round to watch the window (monotone path: it can never
// swing back into the room or dip into the desk).
const WIN_P = v3(0.06, 8.55, -1.12), OUT_L = along(160, 12, 14);
const [HOLD, THRU] = [CUE.hujan.hold, CUE.hujan.drop];
const UD = DROP.clone().sub(WIN_P).normalize();
// a little under the line of travel: the drop hangs above the frame's centre, clear of the caption
const lookOn = (p: THREE.Vector3) => p.clone().addScaledVector(UD, 1).add(v3(0, -0.055, 0));
const onDrop = (t: number, dist: number, ap = 44): Key => {
  const pos = DROP.clone().addScaledVector(UD, -dist);
  return { t, pos, look: lookOn(pos), fov: 50, focus: Math.max(dist - DROP_R, 0.0015), ap };
};
// a steady zoom from 12 cm to 17 mm (the drop grows from ~50 to ~360 px), then the plunge through it
const HOLD_END = THRU - 0.06;
const HOLD_KEYS = [0, 0.3, 0.55, 0.75, 0.9, 1].map((f) => onDrop(HOLD + f * (HOLD_END - HOLD), 0.12 * Math.pow(0.017 / 0.12, f)))
  .concat([onDrop(THRU - 0.03, 0.009), onDrop(THRU, 0)]);
export const KEYS: Key[] = [
  { t: T0, pos: v3(ANT.x, ANT.y + 0.0012, ANT.z - 0.012), look: v3(ANT.x, ANT.y + 0.004, ANT.z - 2), fov: 50, focus: 0.3, ap: 10 },
  { t: 13.32, pos: v3(ANT.x + 0.005, 7.8, -0.64), look: v3(0.03, 8.35, -3), fov: 50, focus: 0.5, ap: 12 },
  ...HOLD_KEYS,
  { ...onDrop(THRU + 0.02, -0.012), focus: 2.6, ap: 18 },
  { t: THRU + 0.13, pos: DROP.clone().addScaledVector(UD, 4), look: OUT_L, fov: 48, focus: 2.6, ap: 18 },
  { t: 14.4, pos: along(88, 19, 12), look: BACK, fov: 44, focus: 2.8, ap: 18 },
  { t: 15.0, pos: along(134, 23, 16), look: BACK, fov: 44, focus: 3, ap: 18 },
  { t: 15.45, pos: along(420, 70, 200), look: along(900, 15, 0), fov: 46, focus: 400, ap: 6 },
  { t: 16.1, pos: along(760, 120, 420), look: along(640, 0, 60), fov: 46, focus: 420, ap: 4 },
  { t: 17.4, pos: along(900, 115, 440), look: along(1000, 4, 20), fov: 44, focus: 450, ap: 4 },
  { t: 18.6, pos: along(1000, 110, 440), look: v3(TOWER.x, 18, TOWER.z), fov: 42, focus: 500, ap: 4 },
  { t: 19.25, pos: v3(TOWER.x + 16, TOWER_H + 6, TOWER.z + 26), look: v3(TOWER.x, TOWER_H - 6, TOWER.z), fov: 46, focus: 30, ap: 10 },
  { t: D1, pos: v3(TOWER.x + 7, 4.5, TOWER.z + 11), look: v3(TOWER.x, 0.3, TOWER.z - 2), fov: 50, focus: 12, ap: 12 },
];

const s3: Chapter = {
  id: 'hujan',
  render(t, ctx, out) {
    const cam = mcamPath(KEYS, t);
    const R = radioR(t);
    const hit = t >= HIT ? Math.exp(-(t - HIT) / 0.35) : 0;
    const down = eOut(P(t, D0, D1 - D0 - 0.2));
    city.render(ctx, cam, {
      scan: scanRow(t),
      wave: R > 0 && t < HIT + 0.4 ? { origin: ANT, R, width: 2.2 + R * 0.006, k: 9 * (1 - P(t, HIT, 0.4)) } : null,
      glow: 0.03,
      towerHit: hit,
      down: [down, t >= D0 ? 1 - P(t, T1 - 0.1, 0.2) * 0.5 : 0],
      cable: [P(t, 20.42, 0.08), 1.45],
      // the antenna goes on transmitting: the gap glows on the desk until the radio shell leaves it
      ant: t < EMIT ? 0.35 + 0.65 * Math.exp(-(t - T0) / 0.25) : 0.35 * (1 - P(t, EMIT, 0.3)),
      // on the drop the lens is a macro: the city behind it goes soft
      dof: 48 * within(t, HOLD - 0.05, THRU - 0.06, 0.1),
      drop: t > 13.2 && t < THRU + 0.3,
      lampSpot: true,
    }, out);
    ctx.post.bloom = 0.7;
    ctx.post.bloomThreshold = 1.2;
    // (the room is lit by the phone alone: the city's exposure comes in on the way to the window)
    ctx.post.exposure = cityExposure(eIO(P(t, T0, 13.6 - T0)));
    ctx.post.shake = [damp(t, HIT, 5, 55, 9), damp(t, HIT, 4, 43, 9)];
    // out of the glowing plastic of the antenna gap (S2) into the room
    gapHaze(ctx.renderer, out, 1 - eOut(P(t, T0, 0.22)));
  },
};
export default s3;
