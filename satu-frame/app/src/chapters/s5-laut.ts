// S5 · Laut · 24.375–37.5. Down to the floor of the Java Sea riding with the packet (it moves ~76 km per
// second of film: the floor streaks, anything on the cable passes inside one frame). Every 2 beats the
// packet crosses an amplifier: a flash, its light restored (sawtooth). The cable peels open layer by layer
// into the one lit fibre; inside the glass the core glows, repeated around the wall by total internal
// reflection. Out again, and the floor rises toward Singapore's lights (S6).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { ms } from '../clock';
import { seabed } from '../sets/seabed';
import { fiber } from '../sets/fiber';
import { v3, type Cam } from '../r3';
import { track, vtrack } from '../path';
import { P, eOut, eIO } from '../motion';
import { underwater } from '../fx';
import { FIBRE_A, FIBRE_B, LANDING } from './s6-server';
import { clamp } from '../engine/util';
import type { Chapter } from '../world';

const [T0, T1] = CH.laut;
const L = CUE.laut;
const V_MMS = CUE.fisik.seratKmS;                 // km/s = m/ms
const MS0 = ms(T0);
/** Packet head's distance from the Jakarta shore (m). */
export const sPulse = (t: number) => V_MMS * (ms(t) - MS0);
const REP_T = Array.from({ length: 14 }, (_, k) => T0 + (k + 1) * L.repEvery);
const REP_S = REP_T.map(sPulse);
const lastRep = (t: number) => { let k = -1; for (let i = 0; i < REP_T.length; i++) if (REP_T[i]! <= t) k = i; return k; };
/** The packet's brightness: restored at every amplifier, fading between (sawtooth), and the flash. */
export function packet(t: number) {
  const k = lastRep(t);
  const since = k >= 0 ? t - REP_T[k]! : t - T0 + 0.3;
  return { pK: 0.3 + 0.7 * Math.exp(-since / 0.55), flash: k >= 0 ? Math.exp(-since / 0.1) : 0, k };
}

type K = [number, number];
const X: K[] = [[T0, 0.6], [25.3, 0.9], [26.25, -0.7], [27.2, 0.3], [28.1, 0.25], [28.6, 0.02], [29.3, 0.004], [29.95, 0.0015]];
const Y: K[] = [[T0, 7.0], [25.3, 1.2], [26.25, 0.5], [27.2, 2.4], [28.1, 0.35], [28.6, 0.07], [29.3, 0.036], [29.95, 0.0309]];
const BEHIND: K[] = [[T0, 16], [25.3, 12], [26.25, 8], [27.2, 10], [28.1, 5], [28.6, 3], [29.95, 2.5]];
const LOOK: [number, THREE.Vector3][] = [[T0, v3(0, 0, -14)], [25.3, v3(0, 0.1, -12)], [26.25, v3(0, 0.05, -10)], [27.2, v3(0, 0, -9)], [28.1, v3(0, 0.03, -5)], [28.6, v3(0, 0.03, -3)], [29.3, v3(0.001, 0.031, -0.3)], [29.95, v3(0.0011, 0.0306, -0.02)]];
// the way out (33.75 on): ride higher as the floor rises toward Singapore
const X2: K[] = [[34.7, 0.0015], [35.2, 0.4], [36.4, 0.9], [37.5, 0.5]];
const Y2: K[] = [[34.7, 0.0309], [35.2, 0.8], [36.4, 2.2], [37.5, 3.4]];
const B2: K[] = [[34.7, 2.5], [35.2, 9], [37.5, 14]];
const LOOK2: [number, THREE.Vector3][] = [[34.7, v3(0.0011, 0.0306, -0.02)], [35.2, v3(0, 0.1, -10)], [37.5, v3(0, 2.5, -20)]];

function seabedAt(t: number): { cam: Cam; behind: number } {
  const out = t >= 34.7;
  const x = track(out ? X2 : X, t), y = track(out ? Y2 : Y, t), behind = track(out ? B2 : BEHIND, t);
  const look = vtrack(out ? LOOK2 : LOOK, t);
  const pos = v3(x, y, 0);
  const near = y < 0.1;
  return { cam: { pos, look, fov: near ? 60 : 54, focus: near ? Math.max(0.004, pos.distanceTo(look) * 0.35) : Math.min(behind, 12), ap: near ? 6 : 10 }, behind };
}

// inside the fibre (µm): in through the cladding, a slow orbit around the core, then back out
const FK: [number, THREE.Vector3][] = [[L.fiber[0], v3(380, 190, 0)], [30.7, v3(40, 22, 0)], [32.0, v3(-24, 32, 0)], [33.2, v3(-36, -14, 0)], [L.fiber[1], v3(-20, -34, 0)], [34.3, v3(-300, -260, 0)], [34.7, v3(-400, -200, 0)]];
function fiberCam(t: number): Cam {
  const pos = vtrack(FK, t);
  return { pos, look: v3(pos.x * 0.35, pos.y * 0.35, -700), fov: 58, ap: 0 };
}

const s5: Chapter = {
  id: 'laut',
  render(t, ctx, out) {
    const r3 = ctx.r3;
    const pk = packet(t);
    ctx.post.bloom = 0.8;
    ctx.post.bloomThreshold = 1.0;
    ctx.post.exposure = 1 + pk.flash * 0.25;
    const drawSeabed = (target: THREE.WebGLRenderTarget) => {
      const { cam, behind } = seabedAt(t);
      const sp = sPulse(t), sCam = sp - behind;
      const kk = pk.k;
      const repA = kk >= 0 ? -(REP_S[kk]! - sCam) : 1e4, repB = kk + 1 < REP_S.length ? -(REP_S[kk + 1]! - sCam) : 1e4;
      const peel = t < 33 ? clamp(P(t, L.peel[0], L.peel[1] - L.peel[0])) : 1 - clamp(P(t, 34.5, 0.7));
      seabed.render(ctx, cam, {
        sCam, headZ: -behind, pLen: 80, pK: pk.pK * 1.4, repA, repB, flash: pk.flash,
        peel, surf: clamp(P(t, 35.6, 1.9)), rise: clamp(P(t, 35.2, 2.3)) * 0.8,
      }, target);
    };
    const drawFiber = (target: THREE.WebGLRenderTarget) => fiber.render(ctx, fiberCam(t), { pK: pk.pK, phase: t * 0.9, flash: pk.flash }, target);
    // hand-offs at the lit fibre: in (29.85–30.05) and out (34.55–34.75)
    if (t < 29.85 || t >= 34.75) {
      drawSeabed(out);
      // the first moments: the line from the surface (S4) still carries the frame until the seabed's own
      // cable and packet come out of the murk
      underwater(ctx.renderer, out, 1 - eOut(P(t, T0, 0.55)), [0.33, -0.05], [0.52, 0.55]);
      // the landing: the camera follows the lit fibre up out of the water and into the building; the murk
      // closes in and the line swings to where it runs along the aisle's cable tray (S6 opens around it)
      const k = eIO(P(t, T1 - LANDING, LANDING)), s = eIO(P(t, T1 - LANDING * 0.8, LANDING * 0.8));
      underwater(ctx.renderer, out, k, [0.46 + (FIBRE_A[0] - 0.46) * s, -0.05 + (FIBRE_A[1] + 0.05) * s], [0.5 + (FIBRE_B[0] - 0.5) * s, 0.33 + (FIBRE_B[1] - 0.33) * s]);
      return;
    }
    if (t >= 30.05 && t < 34.55) { drawFiber(out); return; }
    const k = t < 32 ? P(t, 29.85, 0.2) : 1 - P(t, 34.55, 0.2);
    drawSeabed(r3.a); drawFiber(r3.b);
    r3.mix(r3.a.texture, r3.b.texture, out, k);
  },
};
export default s5;
