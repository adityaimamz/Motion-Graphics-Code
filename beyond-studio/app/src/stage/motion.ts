// Beyond Studio motion tokens (MOTION-GUIDE.md §2), as pure functions of progress.
import { clamp } from '../engine/util';

function bez(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t, sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-7) return sy(t); const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 40; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}
export const eOut = bez(0.23, 1, 0.32, 1);       // --ease-out: things entering, text rising, cards
export const eIO = bez(0.77, 0, 0.175, 1);       // --ease-in-out: camera, chapter moves, cursor
export const eDrawer = bez(0.32, 0.72, 0, 1);    // --ease-drawer: panels, responsive layout
export const eIn = (x: number) => x * x * x;     // leaving / take-off only
export const eBack = (x: number, s = 1.5) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
/** Clamped progress of t through [t0, t0 + d]. */
export const P = (t: number, t0: number, d: number) => clamp((t - t0) / d);
/** Damped oscillation after an impact at t0 (shake, pops). */
export const damp = (t: number, t0: number, amp: number, freq: number, decay: number) => (t < t0 ? 0 : amp * Math.exp(-(t - t0) * decay) * Math.sin((t - t0) * freq));
/** 1 inside [a, b] with eased edges of length f. */
export const within = (t: number, a: number, b: number, f = 0.08) => clamp((t - a) / f) * (1 - clamp((t - b) / f));

/** Cursor path through keys [t, x, y] (eIO per leg with a slight arc, like a hand). */
export function pathAt(keys: [number, number, number][], t: number): [number, number] {
  if (t <= keys[0]![0]) return [keys[0]![1], keys[0]![2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!, b = keys[i + 1]!;
    if (t <= b[0]) {
      const u = eIO((t - a[0]) / (b[0] - a[0] || 1)), arc = Math.sin(Math.PI * u) * 0.12;
      const dx = b[1] - a[1], dy = b[2] - a[2];
      return [a[1] + dx * u - dy * arc, a[2] + dy * u + dx * arc];
    }
  }
  const z = keys[keys.length - 1]!;
  return [z[1], z[2]];
}
/** Cursor press depth (0..1) around each click time. */
export const pressAt = (t: number, clicks: number[]) => clicks.reduce((m, tc) => Math.max(m, clamp(P(t, tc - 0.06, 0.06) - P(t, tc + 0.02, 0.16))), 0);
/** Idle micro-drift so a resting hand never looks frozen (page px). */
export const drift = (t: number, k = 1.9): [number, number] => [k * Math.sin(t * 2.3), k * 0.8 * Math.sin(t * 1.9 + 1.3)];
