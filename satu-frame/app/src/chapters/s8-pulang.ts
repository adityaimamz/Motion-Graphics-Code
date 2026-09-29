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
import { v3, type Cam } from '../r3';
import { mcamPath, mtrack, type Key } from '../path';
import { P, eIO } from '../motion';
import { clamp } from '../engine/util';
import type { Chapter } from '../world';

const [T0, T1] = CH.pulang;
const S8 = CUE.pulang;

// Over the desk the camera settles above the phone on the beat, then dives for the last rows while it
// tips up to face the screen: the written rows ahead, the refresh line coming, the rows not yet written
// under the lens, so the dive never looks into black. That stretch is one camera in display units (column,
// row, height; 1 = a pixel pitch), seen in the room's metres while the desk is still in the frame. Once
// only the display fills it (~2 cm up) the display's own shader takes over and the white resolves into its
// R/G/B emitters; the lens goes through the cover glass on S8.glass (the glass tink) and stays inside it
// down to the landing (S9 backs out of it).
const HOVER = 59.53125;                           // the beat the dive leaves on
const HAND = 59.62, HAND_D = 0.2;                 // room -> display shader
const ZG = 8.7, PG = 11;                          // the cover glass's top; the pitch as the lens goes through it
function dispCam(t: number): Cam {
  const G = S8.glass;
  const y = mtrack([[HOVER, 2010], [59.8, 2330], [G, 2392], [61.0, 2412], [S8.land, 2418], [T1, 2426]], t, false, true);
  const z = mtrack([[HOVER, 1150], [59.8, 300], [G, ZG], [61.0, 7], [S8.land, 6.5], [T1, 17]], t, true, true);
  const fov = mtrack([[HOVER, 50], [G, 44], [61.0, 42], [T1, 42]], t, false, true);
  const ap = mtrack([[HOVER, 6], [G, 16], [61.0, 20], [T1, 20]], t, false, true);
  // on the dive the lens aims at a row just past the line (the written rows above it in the frame, the
  // dark ones below), then levels out toward the oncoming line
  const aimG = 2392 - ZG / Math.tan((PG * Math.PI) / 180);
  const aim = mtrack([[HOVER, 2010], [59.8, 2200], [G, aimG]], t, false, true);
  const dive = (Math.atan2(z, Math.max(y - aim, 1e-3)) * 180) / Math.PI;
  const pitch = t < G ? dive : mtrack([[G, PG], [61.0, 6], [T1, 6]], t, false, true);
  const line = Math.min(scanRow(t), 2400);
  const focus = Math.max(4, Math.min(z / Math.sin((pitch * Math.PI) / 180), Math.hypot(y - line, z)));
  return macroCam(540.3, y, z, pitch, -1, fov, focus, ap);
}
// the display's active area in the room (as city.ts draws it): rows along +z from its top edge, height
// above the display quad; display (x, y, z) -> room (-x, z, y) keeps the handedness
const Y_G = PHONE.center.y + PHONE.h / 2 + 0.0002, SW = PHONE.w - 0.0028, SL = PHONE.l - 0.0032, U = SL / 2400;
const toRoomP = (p: THREE.Vector3) => v3(PHONE.center.x - (p.x / 1080 - 0.5) * SW, Y_G + p.z * U, PHONE.center.z - SL / 2 + p.y * U);
function toRoom(c: Cam): Cam {
  return { pos: toRoomP(c.pos), look: toRoomP(c.look), up: c.up ? v3(-c.up.x, c.up.z, c.up.y) : undefined, fov: c.fov, focus: (c.focus ?? 1) * U, ap: c.ap, near: 0.0003 };
}

// the dive onto the desk: monotone (a far key cannot swing the camera through the ground or past the phone)
const CITY: Key[] = [
  { t: 56.15, pos: v3(-40, 1500, -380), look: v3(0, 8, -1), fov: 48, focus: 1500, ap: 2 },
  { t: 56.9, pos: v3(-7, 140, -48), look: v3(0, 8.4, -1), fov: 48, focus: 60, ap: 8 },
  { t: 57.65, pos: v3(-1.2, 24, -15), look: v3(0, 8.6, -1.1), fov: 48, focus: 3, ap: 16 },
  { t: 58.3, pos: v3(0.08, 9.05, -4.6), look: v3(0, 8.5, 0), fov: 50, focus: 2.5, ap: 14 },
  { t: S8.window + 0.3, pos: v3(0.02, 8.1, -0.55), look: v3(0, DESK_Y, -0.3), fov: 50, focus: 0.5, ap: 12 },
  { t: HOVER, ...toRoom(dispCam(HOVER)) } as Key,
];

const dispState = (t: number) => ({ scan: scanRow(t), lineGlow: 0.6, touch: 0, leak: 1 });

const cityCam = (t: number) => (t < HOVER ? mcamPath(CITY, t, DESK_Y) : toRoom(dispCam(t)));

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
        scan: scanRow(t), glow: 0.03 + 0.35 * clamp(scanRow(t) / 2400), screenK: 0.5, phoneSky: clamp(scanRow(t) / 2400),
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
    if (t < HAND) { city.render(ctx, cityCam(t), cityState(), out); return; }
    if (t < HAND + HAND_D) {                         // only the display left in the frame: its own shader
      city.render(ctx, cityCam(t), cityState(), r3.a);
      screen.render(ctx, dispCam(t), dispState(t), r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, eIO(P(t, HAND, HAND_D)));
      return;
    }
    screen.render(ctx, dispCam(t), dispState(t), out);
    ctx.post.bloomThreshold = 1.5;
    void THREE;
  },
};
export default s8;
