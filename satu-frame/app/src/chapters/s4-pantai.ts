// S4 · Pantai · 20.625–24.375. No caption: room to breathe. From the tower base the camera turns down the
// street where the cable runs (lit end to end: at ×7.500 light in glass still crosses 1.3 km in 0.05 s,
// what we follow is its afterglow), low over the port and the seawall, then
// along the line where the cable goes out to sea over the frozen black water, and down into it where the
// line runs under (S5 goes on down to the seabed).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { scanRow } from '../clock';
import { city, cityExposure, TOWER, SHORE_Z, CABLE_X } from '../sets/city';
import { v3 } from '../r3';
import { camPath, type Key } from '../path';
import { P, eIO } from '../motion';
import { clamp } from '../engine/util';
import { underwater } from '../fx';
import type { Chapter } from '../world';

const [T0, T1] = CH.pantai;
const DIVE = CUE.pantai.lip;
const BX = CABLE_X, SZ = SHORE_Z;

const KEYS: Key[] = [
  { t: T0, pos: v3(TOWER.x + 7, 4.5, TOWER.z + 11), look: v3(TOWER.x, 0.3, TOWER.z - 2), fov: 50, focus: 12, ap: 12 },
  { t: 21.05, pos: v3(TOWER.x + 4, 13, TOWER.z - 22), look: v3(-189, 0, -1560), fov: 52, focus: 40, ap: 8 },
  { t: 21.6, pos: v3(-190, 15, -1470), look: v3(-189, 1.5, -1900), fov: 54, focus: 60, ap: 6 },
  { t: 22.3, pos: v3(-190, 11, -2300), look: v3(-189, 0, -2720), fov: 54, focus: 80, ap: 6 },
  { t: 22.85, pos: v3(BX - 0.5, 5, SZ - 8), look: v3(BX, -0.6, SZ - 200), fov: 52, focus: 60, ap: 6 },
  { t: 23.5, pos: v3(BX - 0.8, 2.2, SZ - 70), look: v3(BX, -1.0, SZ - 230), fov: 54, focus: 40, ap: 8 },
  { t: DIVE, pos: v3(BX - 0.4, 0.9, SZ - 118), look: v3(BX, -1.6, SZ - 132), fov: 58, focus: 8, ap: 10 },
  { t: T1, pos: v3(BX, -1.9, SZ - 129), look: v3(BX, -6, SZ - 136), fov: 60, focus: 3, ap: 10 },
];

const s4: Chapter = {
  id: 'pantai',
  render(t, ctx, out) {
    const cam = camPath(KEYS, t);
    city.render(ctx, cam, {
      scan: scanRow(t), glow: 0.03, fogD: 0.0005,
      cable: [1, 0.35 + 1.1 * Math.exp(-(t - T0) / 0.9)],
    }, out);
    ctx.post.bloom = 0.7;
    ctx.post.bloomThreshold = 1.2;
    // (back to the film's exposure as the camera goes under: S5 starts there)
    ctx.post.exposure = cityExposure(1 - eIO(P(t, 24.06, T1 - 24.06)));
    // through the frozen surface into black water, the cable's line going on down through the murk (and
    // turning to where S5's seabed camera sees it)
    const k = clamp(P(t, 24.06, 0.12));
    const u = eIO(P(t, 24.1, T1 - 24.1));
    underwater(ctx.renderer, out, k * k * (3 - 2 * k), [0.52 - 0.19 * u, -0.05], [0.5 + 0.02 * u, 0.62 - 0.07 * u]);
  },
};
export default s4;
