// Smooth camera paths through timed keys: non-uniform Catmull-Rom (Hermite with finite-difference tangents,
// time as the parameter), so velocity is continuous through every key. Pure functions of t.
import * as THREE from 'three';
import type { Cam } from './r3';

export interface Key { t: number; pos: THREE.Vector3; look: THREE.Vector3; fov?: number; focus?: number; ap?: number; roll?: number; up?: THREE.Vector3 }

function seg(keys: { t: number }[], t: number) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1]!.t) i++;
  return i;
}
function herm(p0: number, p1: number, m0: number, m1: number, u: number) {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
}
/** Scalar track through [t, value] keys (clamped at the ends). */
export function track(keys: [number, number][], t: number) {
  if (t <= keys[0]![0]) return keys[0]![1];
  const L = keys.length - 1;
  if (t >= keys[L]![0]) return keys[L]![1];
  const i = seg(keys.map((k) => ({ t: k[0] })), t);
  const a = keys[i]!, b = keys[i + 1]!, h = b[0] - a[0], u = (t - a[0]) / h;
  const pa = keys[Math.max(0, i - 1)]!, pb = keys[Math.min(L, i + 2)]!;
  const m0 = i === 0 ? 0 : ((b[1] - pa[1]) / (b[0] - pa[0])) * h;
  const m1 = i + 1 === L ? 0 : ((pb[1] - a[1]) / (pb[0] - a[0])) * h;
  return herm(a[1], b[1], m0, m1, u);
}
/** Vector track (ends ease in/out: zero velocity at the first and last key). */
export function vtrack(keys: [number, THREE.Vector3][], t: number) {
  const out = new THREE.Vector3();
  for (const c of ['x', 'y', 'z'] as const) out[c] = track(keys.map(([kt, v]) => [kt, v[c]]), t);
  return out;
}
/** A camera along timed keys. */
export function camPath(keys: Key[], t: number): Cam {
  const pos = vtrack(keys.map((k) => [k.t, k.pos]), t);
  const look = vtrack(keys.map((k) => [k.t, k.look]), t);
  const sc = (f: (k: Key) => number | undefined, d: number) => track(keys.map((k) => [k.t, f(k) ?? d]), t);
  const up = keys.some((k) => k.up) ? vtrack(keys.map((k) => [k.t, k.up ?? new THREE.Vector3(0, 1, 0)]), t).normalize() : undefined;
  return { pos, look, up, fov: sc((k) => k.fov, 40), focus: sc((k) => k.focus ?? k.pos.distanceTo(k.look), 1), ap: sc((k) => k.ap, 0), roll: sc((k) => k.roll, 0) };
}

/** Monotone cubic track (Fritsch–Carlson): never overshoots between keys. `log` interpolates in log space (zooms). */
export function mtrack(keys: [number, number][], t: number, log = false) {
  const n = keys.length;
  const xs = keys.map((k) => k[0]), ys = keys.map((k) => (log ? Math.log(k[1]) : k[1]));
  if (t <= xs[0]!) return keys[0]![1];
  if (t >= xs[n - 1]!) return keys[n - 1]![1];
  const dx: number[] = [], dy: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(xs[i + 1]! - xs[i]!); dy.push((ys[i + 1]! - ys[i]!) / dx[i]!); }
  m.push(dy[0]!);
  for (let i = 1; i < n - 1; i++) m.push(dy[i - 1]! * dy[i]! <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / dy[i - 1]! + (dx[i]! + 2 * dx[i - 1]!) / dy[i]!));
  m.push(dy[n - 2]!);
  let i = 0;
  while (i < n - 2 && t > xs[i + 1]!) i++;
  const h = dx[i]!, u = (t - xs[i]!) / h;
  const v = herm(ys[i]!, ys[i + 1]!, m[i]! * h, m[i + 1]! * h, u);
  return log ? Math.exp(v) : v;
}
