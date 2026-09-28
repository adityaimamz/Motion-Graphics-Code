// Where things live in the world. Sets are stacked vertically: the camera cranes up between them.
import * as THREE from 'three';
import { pick } from '../fmt';

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/** World units per SVG px of the logo (ring outer diameter 304 px → 3.04 units). */
export const LOGO_S = 0.01;
/** Vertical fov (degrees) of the default lens. */
export const FOV = pick(38, 28);
/** Intro stage (logo + process words): its floor height, the logo centre, the words' centre. */
export const INTRO_FLOOR = -3.4;
export const LOGO_C = v3(pick(0, -3.6), pick(0.9, 0), 0);
export const WORDS_C = v3(16, 0, 0);
/** Device sets (bisnis → responsif), the proof wall and the closing, stacked above the intro. */
export const SET_X = 16;
export const SET_Y = { bisnis: 40, portofolio: 80, skripsi: 120, responsif: 160, bukti: 200, closing: 240 } as const;

// ---------------------------------------------------------------- shots shared across chapters
import type { Shot, ArrowPose } from '../stage/world';
import type { Screen } from '../stage/devices';
import { eIO, eOut, eIn, P } from '../stage/motion';
import { lerp, clamp } from '../engine/util';

/** Home framing of each set (the camera settles here; chapters add their own moves). */
export const setOrigin = (y: number) => v3(SET_X, y, 0);
export const HOME: Record<'bisnis' | 'portofolio' | 'skripsi' | 'responsif', Shot> = {
  bisnis: { look: v3(SET_X + pick(0.9, 0.2), SET_Y.bisnis + pick(2.9, 3.0), 0.8), dist: pick(33, 25), yaw: pick(-6, -8), pitch: pick(11, 9), fov: FOV },
  portofolio: { look: v3(SET_X + pick(-0.95, -3.2), SET_Y.portofolio + pick(5.3, 4.0), pick(0.1, -0.35)), dist: pick(19, 16), yaw: pick(6, 7), pitch: 4, fov: FOV, focus: pick(19, 16), ap: 40 },
  skripsi: { look: v3(SET_X + pick(0.6, -0.6), SET_Y.skripsi + pick(3.1, 3.1), 0.6), dist: pick(33, 25), yaw: pick(-5, -6), pitch: pick(9, 8), fov: FOV },
  responsif: { look: v3(SET_X, SET_Y.responsif + pick(4.0, 3.6), 0), dist: pick(30, 25), yaw: 0, pitch: pick(6, 5), fov: FOV },
};
/** How far above the camera's look point the arrow leads while the camera cranes. */
export const LEAD = pick(4.4, 3.4);

/** The crane between two framings: rises with a tilt-up, settles looking down on the next set. */
export function craneShot(t: number, t0: number, t1: number, a: Shot, b: Shot): Shot {
  const k = eIO(P(t, t0, t1 - t0));
  return {
    look: a.look.clone().lerp(b.look, k),
    dist: lerp(a.dist, b.dist, k) + Math.sin(k * Math.PI) * 3,
    yaw: lerp(a.yaw, b.yaw, k),
    pitch: lerp(a.pitch, b.pitch, k) - Math.sin(k * Math.PI) * 16,
    fov: lerp(a.fov, b.fov, k),
    ap: 0,
  };
}
/** The arrow leading the crane (continuous with the next chapter's landing, which starts at t1). */
export function craneArrow(t: number, t0: number, t1: number, a: Shot, b: Shot, from?: THREE.Vector3): ArrowPose {
  const k = eIO(P(t, t0, t1 - t0));
  const lead = a.look.clone().lerp(b.look, k).add(v3(0, LEAD, 1.2));
  const pos = from ? from.clone().lerp(lead, eOut(P(t, t0, (t1 - t0) * 0.7))) : lead;
  return { pos, dir: v3(0, 1, 0), face: v3(0, 0, 1), scale: 0.0105, trail: 1, glow: 1 };
}

/** Cursor size on a screen, in canvas px per SVG unit of the arrow (the old film's pointer: 0.27 stage px). */
export const cursorPx = (screen: Screen, pagePx: number) => 0.27 * (screen.cw / pagePx);

/** The arrow diving from `from` onto a screen, becoming the cursor at canvas point (px, py) at t1. */
export function landArrow(t: number, t0: number, t1: number, from: THREE.Vector3, screen: Screen, px: number, py: number, curS: number): ArrowPose {
  const u = eOut(P(t, t0, t1 - t0));
  const end = screen.point(px, py);
  const ax = screen.axes();
  const mid = from.clone().lerp(end, 0.5).addScaledVector(ax.normal, 2.2).add(v3(0, 0.6, 0));
  const m = 1 - u;
  const pos = from.clone().multiplyScalar(m * m).addScaledVector(mid, 2 * m * u).addScaledVector(end, u * u);
  const ahead = from.clone().multiplyScalar((1 - u - 0.02) ** 2).addScaledVector(mid, 2 * (1 - u - 0.02) * (u + 0.02)).addScaledVector(end, (u + 0.02) ** 2);
  const curDir = ax.right.clone().multiplyScalar(-0.5).addScaledVector(ax.up, 0.866);
  const settle = eOut(P(t, t1 - (t1 - t0) * 0.45, (t1 - t0) * 0.45));
  const dir = u < 0.98 ? ahead.sub(pos).normalize().lerp(curDir, settle).normalize() : curDir;
  const face = v3(0, 0, 1).lerp(ax.normal, settle);
  const scale = lerp(0.0105, curS * screen.unit, eOut(P(t, t0 + (t1 - t0) * 0.3, (t1 - t0) * 0.7)));
  return { pos, dir, face, scale, trail: 1 - settle * 0.85, glow: 1 - settle * 0.8 };
}

/** The cursor turning back into the arrow and zipping up out of the screen (eIn), toward `to`. */
export function takeoffArrow(t: number, t0: number, t1: number, screen: Screen, px: number, py: number, curS: number, to: THREE.Vector3): ArrowPose {
  const k = eIn(P(t, t0, t1 - t0));
  const start = screen.point(px, py);
  const ax = screen.axes();
  const curDir = ax.right.clone().multiplyScalar(-0.5).addScaledVector(ax.up, 0.866);
  const pos = start.clone().lerp(to, k).addScaledVector(ax.normal, Math.sin(k * Math.PI) * 1.2);
  const turn = eOut(P(t, t0, (t1 - t0) * 0.5));
  return { pos, dir: curDir.lerp(v3(0, 1, 0), turn).normalize(), face: ax.normal.clone().lerp(v3(0, 0, 1), turn), scale: lerp(curS * screen.unit, 0.0105, eOut(P(t, t0, (t1 - t0) * 0.6))), trail: clamp(k * 3), glow: clamp(0.2 + k * 2) };
}
