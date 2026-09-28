// S3 · Hujan · 13.125–20.625. Out of the antenna gap, across the desk, through the rain-dotted window into
// the frozen rain. The camera backs away looking at the window; on 14.53 (×1.000.000) the radio shell leaves
// it and swells through the drops, passes the lens on 15.0, and the camera turns to chase it over the roofs
// to the tower (radius = c·Δt from the physical clock). The panels flash on 18.75; the signal runs down the
// tower into the ground and the camera follows it down (S4 takes it along the cable to the sea).
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import { city, ANT, TOWER, TOWER_H, radioR } from '../sets/city';
import { v3 } from '../r3';
import { camPath, type Key } from '../path';
import { P, eOut, damp } from '../motion';
import type { Chapter } from '../world';

const [T0, T1] = CH.hujan;
const HIT = CUE.hujan.tower;
const [D0, D1] = CUE.hujan.descend;
const dir = TOWER.clone().setY(0).sub(ANT.clone().setY(0)).normalize();
const along = (d: number, alt: number, side = 0) => v3(ANT.x + dir.x * d - dir.z * side, alt, ANT.z + dir.z * d + dir.x * side);

const BACK = v3(ANT.x, 8.6, ANT.z);
export const KEYS: Key[] = [
  { t: T0, pos: v3(ANT.x, ANT.y + 0.0012, ANT.z - 0.012), look: v3(ANT.x, ANT.y + 0.004, ANT.z - 2), fov: 50, focus: 0.3, ap: 10 },
  { t: 13.32, pos: v3(ANT.x + 0.005, 7.8, -0.64), look: v3(0.03, 8.35, -3), fov: 50, focus: 0.5, ap: 12 },
  { t: 13.56, pos: v3(0.06, 8.55, -1.12), look: v3(0.2, 9.4, -6), fov: 50, focus: 1.2, ap: 14 },
  { t: 13.95, pos: along(40, 15, 6), look: along(160, 12, 14), fov: 48, focus: 2.6, ap: 18 },
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
    const cam = camPath(KEYS, t);
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
    }, out);
    ctx.post.bloom = 0.7;
    ctx.post.bloomThreshold = 1.2;
    ctx.post.shake = [damp(t, HIT, 5, 55, 9), damp(t, HIT, 4, 43, 9)];
    // out of the dark antenna gap
    ctx.post.fade = 1 - eOut(P(t, T0, 0.16));
  },
};
export default s3;
