// S6 · Server · 37.5–46.875. Through Singapore's landing, down a cold aisle (the fibre lit along the tray)
// into one server, onto its processor. Tape-stop: time slows to ×1.406.250.000, where a 3 GHz clock ticks
// at 128 BPM: 8 ticks, one per beat, the edge running out through the H-tree each time. Time snaps back,
// the answer leaves, and a powers-of-ten pull-out climbs from the die to orbit (S7).
import * as THREE from 'three';
import { CH, CUE, BEAT } from '../cues';
import { datacenter, TARGET, RACK } from '../sets/datacenter';
import { die } from '../sets/die';
import { earthPull } from './s7-orbit';
import { captionBand } from '../hud';
import { v3, type Cam } from '../r3';
import { camPath, mtrack, type Key } from '../path';
import { P, eIO } from '../motion';
import { underwater } from '../fx';
import { clamp } from '../engine/util';
import type { Chapter } from '../world';

const [T0] = CH.server;
/** The hand-off from the seabed (S5): the lit fibre on screen (uv from the bottom left, near end A, far end
 *  B) where it runs along the aisle's cable tray at T0, and how long the murk takes on either side. */
export const FIBRE_A: [number, number] = [1.04, 0.69], FIBRE_B: [number, number] = [0.76, 0.75];
export const LANDING = 0.35;
const S = CUE.server;
const C0 = S.clock0, TICKS = S.ticks;
const TZ = TARGET.z;

const AISLE: Key[] = [
  { t: T0, pos: v3(0.1, 1.55, 2.4), look: v3(0.2, 1.35, -8), fov: 58, focus: 5, ap: 5 },
  { t: 38.25, pos: v3(0.35, 1.35, TZ + 1.4), look: TARGET.clone().add(v3(0, 0.02, 0)), fov: 54, focus: 1.3, ap: 7 },
  { t: 38.8, pos: TARGET.clone().add(v3(-0.03, 0.0, 0)), look: TARGET.clone().add(v3(1, -0.1, 0)), fov: 54, focus: 0.1, ap: 4 },
];
// out of the server and up through the ceiling (pull-out, second leg)
const UP: Key[] = [
  { t: 44.3, pos: TARGET.clone().add(v3(-0.06, 0.02, 0)), look: TARGET.clone().add(v3(1, -0.3, 0)), fov: 56, focus: 0.3, ap: 3, up: v3(0, 1, 0) },
  { t: 44.65, pos: v3(0.2, 2.0, TZ + 0.3), look: v3(RACK.aisle, 0, TZ), fov: 60, focus: 2, ap: 2, up: v3(0, 0, -1) },
  { t: 44.95, pos: v3(0.1, 3.08, TZ), look: v3(0.1, 0, TZ - 0.01), fov: 60, focus: 3, ap: 0, up: v3(0, 0, -1) },
];

/** Camera over the die (mm): in from high above the package, a slow push and turn through the ticks, then up. */
function dieCam(t: number): Cam {
  const h = mtrack([[38.8, 95], [C0, 10.5], [43.125, 3.2], [43.6, 3.4], [44.35, 160]], t, true);
  const ang = mtrack([[38.8, -0.4], [C0, 0], [43.6, 0.32], [44.35, 0.5]], t);
  const tilt = mtrack([[38.8, 0.1], [C0, 0.28], [43.6, 0.34], [44.35, 0.05]], t);
  const pos = v3(Math.sin(ang) * h * tilt, -Math.cos(ang) * h * tilt, h);
  return { pos, look: v3(0, 0, 0), up: v3(-Math.sin(ang), Math.cos(ang), 0), fov: 42, focus: pos.length(), ap: t < C0 ? 6 : 14 };
}

const s6: Chapter = {
  id: 'server',
  render(t, ctx, out) {
    const r3 = ctx.r3;
    ctx.post.bloomThreshold = 1.3;
    const tick = Math.floor((t - C0) / BEAT);
    const since = t < C0 ? 99 : tick < TICKS ? t - (C0 + tick * BEAT) : 99;
    const answer = Math.exp(-Math.max(0, t - 43.3) / 0.25) * (t >= 43.3 ? 1 : 0);
    const fibK = 3 * Math.exp(-(t - T0) / 0.8) + 0.4;
    if (t < 38.75) {
      datacenter.render(ctx, camPath(AISLE, t), fibK, out);
      // out of the landing's dark along the fibre (S5 hands it over here)
      underwater(ctx.renderer, out, 1 - eIO(P(t, T0, LANDING + 0.15)), FIBRE_A, FIBRE_B);
      return;
    }
    if (t < 38.95) {           // into the server's bezel: the aisle gives way to the processor
      datacenter.render(ctx, camPath(AISLE, Math.min(t, 38.8)), fibK, r3.a);
      die.render(ctx, dieCam(t), since, 0, r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, P(t, 38.75, 0.2));
      return;
    }
    // the flashes stay dim behind the caption and the HUD while the clock ticks (the type is untouched)
    const type = { band: captionBand(t), hud: P(t, C0 - 0.2, 0.2) * (1 - P(t, 43.6, 0.4)) };
    if (t < 44.2) { die.render(ctx, dieCam(t), since, answer, out, type); return; }
    if (t < 44.4) {
      die.render(ctx, dieCam(t), 99, answer, r3.a);
      datacenter.render(ctx, camPath(UP, t), 0.6, r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, P(t, 44.2, 0.2));
      return;
    }
    if (t < 44.95) { datacenter.render(ctx, camPath(UP, t), 0.6, out); ctx.post.fade = Math.max(0, (t - 44.8) / 0.15); return; }
    earthPull(ctx, t, out);
    // punched up through the roof: a beat of dark between the aisle and the sky
    ctx.post.fade = Math.max(0, 1 - (t - 44.95) / 0.16);
    void clamp; void THREE;
  },
};
export default s6;
