// Stop-motion time. The paper world moves at 12 fps: one pose held for 5 output frames. The step grid is
// re-anchored at every cue (cues.ts › ANCHORS), so a hit lands on its own frame and never waits for the
// next step. Everything is keyed to the output frame nearest t (round(t·60)), which is constant over one
// frame's whole motion-blur shutter: a stepped frame never blends two poses.
import { ANCHORS, PAPER_FPS, SMOOTH_FROM } from './cues';

const FPS = 60;
const PER = Math.round(FPS / PAPER_FPS); // output frames per paper step (5)
const AF = ANCHORS.map((a) => Math.round(a * FPS));

export const frameOf = (t: number) => Math.round(t * FPS);

/** First frame of the step that frame f belongs to. */
function stepFrame(f: number) {
  let a = 0;
  for (const x of AF) { if (x <= f) a = x; else break; }
  return a + PER * Math.floor((f - a) / PER);
}

/** Paper-world time: t held to the start of its 12 fps step. */
export const paperT = (t: number) => stepFrame(frameOf(t)) / FPS;
/** A unique integer per paper step (for per-step flicker and boil). */
export const stepId = (t: number) => stepFrame(frameOf(t));
/** Camera time: stepped like the paper until the plane takes off, then continuous. */
export const camT = (t: number) => (t >= SMOOTH_FROM ? t : paperT(t));
/** True when every sub-frame of this frame shows the same image (no motion blur needed). */
export const isStepped = (t: number) => t < SMOOTH_FROM - 0.5 / FPS;
