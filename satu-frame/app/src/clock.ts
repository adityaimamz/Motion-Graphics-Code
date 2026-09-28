// The physical clock (cues.json › jam): film seconds -> real milliseconds inside the one frame, and the
// slowdown factor at every instant. Segments hold a constant slowdown; the gaps between them are smooth
// ramps in log space. Segments marked fixed carry a physics claim and are used exactly (radio at 300 m/s,
// the 3 GHz clock at 128 BPM, the photon's 1 ns); the other segments of each anchor interval share one
// scale, solved once at startup so every anchor [t, ms] is hit. Pure function of t afterwards.
// audio.py implements the same algorithm (same numbers, same ramps) for its tape-stops.
import { CUE } from './cues';
import { clamp } from './engine/util';

type Seg = { t0: number; t1: number; slow: number; fixed: boolean; iv: number };
const J = CUE.jam;
const A = J.anchors as [number, number][];
const DT = 1 / 1200;
const N = Math.ceil(CUE.dur / DT) + 2;

const segs: Seg[] = (J.segs as (number | boolean)[][]).map((s) => {
  const t0 = s[0] as number, t1 = s[1] as number, mid = (t0 + t1) / 2;
  let iv = -1;
  for (let k = 0; k < A.length - 1; k++) if (mid >= A[k]![0] && mid < A[k + 1]![0]) iv = k;
  return { t0, t1, slow: s[2] as number, fixed: !!s[3], iv };
});
const scale = new Float64Array(A.length).fill(1);

const segVal = (s: Seg) => (s.fixed || s.iv < 0 ? s.slow : s.slow * scale[s.iv]!);
const sstep = (u: number) => u * u * (3 - 2 * u);

/** Slowdown factor (film seconds per real second) at film time t. */
function slowRaw(t: number) {
  let prev: Seg | null = null;
  for (const s of segs) {
    if (t >= s.t0 && t <= s.t1) return segVal(s);
    if (s.t1 < t) prev = s;
    else { // first segment after t: ramp from prev to s
      if (!prev) return segVal(s);
      const u = sstep(clamp((t - prev.t1) / (s.t0 - prev.t1)));
      return Math.exp(Math.log(segVal(prev)) * (1 - u) + Math.log(segVal(s)) * u);
    }
  }
  return segVal(segs[segs.length - 1]!);
}

/** ms of real time elapsed over film [a, b] (midpoint rule, coarse: the exact correction below absorbs the residual). */
function integrate(a: number, b: number) {
  const n = Math.max(1, Math.round((b - a) * 300)), h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += 1000 / slowRaw(a + (i + 0.5) * h);
  return s * h;
}

// solve each interval's scale (bisection on log scale), a few Gauss-Seidel passes for the shared ramps
for (let pass = 0; pass < 3; pass++) {
  for (let k = 0; k < A.length - 1; k++) {
    if (!segs.some((s) => s.iv === k && !s.fixed)) continue;
    const [ta, ma] = A[k]!, [tb, mb] = A[k + 1]!;
    let lo = Math.log(1e-4), hi = Math.log(1e4);
    for (let it = 0; it < 40; it++) {
      const m = (lo + hi) / 2;
      scale[k] = Math.exp(m);
      if (integrate(ta, tb) > mb - ma) lo = m; else hi = m;   // more slowdown -> fewer ms
    }
    scale[k] = Math.exp((lo + hi) / 2);
  }
}

// the table, then an exact per-interval correction so the anchors are hit to the last digit
const table = new Float64Array(N);
for (let i = 1; i < N; i++) table[i] = table[i - 1]! + (1000 / slowRaw((i - 0.5) * DT)) * DT;
const at = (t: number) => { const x = clamp(t / DT, 0, N - 1.000001), i = Math.floor(x), f = x - i; return table[i]! * (1 - f) + table[i + 1]! * f; };
const raw = A.map(([t]) => at(t));
function correct(t: number, v: number) {
  for (let k = 0; k < A.length - 1; k++) {
    const [ta, ma] = A[k]!, [tb, mb] = A[k + 1]!;
    if (t <= tb || k === A.length - 2) {
      if (t > tb) return mb + (v - raw[k + 1]!);         // after the last anchor: raw increments
      const u = (v - raw[k]!) / (raw[k + 1]! - raw[k]!);
      return ma + u * (mb - ma);
    }
  }
  return v;
}

/** Real milliseconds elapsed in the frame at film time t (0 at the vsync that starts the film). */
export const ms = (t: number) => correct(t, at(t));
/** Current slowdown (×N) at film time t. */
export const slow = (t: number) => slowRaw(t);
export const FRAME_MS = J.frameMs, SCAN_MS = J.scanMs, ROWS = J.rows;
/** Row (0..2400) the display is writing at film time t; beyond the last row during blanking. */
export const scanRowAtMs = (m: number) => (m / SCAN_MS) * ROWS;
export const scanRow = (t: number) => scanRowAtMs(ms(t));
/** Diagnostics for the treatment table / audio cross-check. */
export const clockInfo = () => ({ scale: Array.from(scale), anchors: A.map(([t]) => [t, ms(t)]) });
/** The slowdown as the HUD shows it: exact inside a fixed (physics) segment, else 3 significant digits. */
export function slowShown(t: number) {
  const v = slowRaw(t);
  for (const s of segs) if (s.fixed && t >= s.t0 && t <= s.t1) return s.slow;
  const p = 10 ** (Math.floor(Math.log10(v)) - 2);
  return Math.round(v / p) * p;
}
