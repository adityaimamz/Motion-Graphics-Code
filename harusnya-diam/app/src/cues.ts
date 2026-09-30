// The single time source (../../cues.json), shared with audio.py. Seconds of film.
import C from '../../cues.json' with { type: 'json' };

export const CUE = C.cue;
export const CH = C.ch as Record<keyof typeof C.ch, [number, number]>;
export const DUR = C.dur;
export const BEAT = 60 / C.bpm;
export const BAR = 4 * BEAT;
export const PAPER_FPS = C.paperFps;
/** From here the camera and the paper plane move at the full 60 fps (the board stays stop-motion). */
export const SMOOTH_FROM = C.smoothFrom;
export const CAPTIONS = C.caption as { id: string; t: number; text: string }[];
export const cap = (id: string) => CAPTIONS.find((c) => c.id === id)!;
/** Beat index -> film seconds. */
export const beat = (n: number) => n * BEAT;

/** Every cue time (s), sorted: each one re-anchors the 12 fps step grid (see step.ts). */
export const ANCHORS: number[] = (() => {
  const s = new Set<number>([0]);
  for (const [a, b] of Object.values(CH)) { s.add(a); s.add(b); }
  for (const g of Object.values(C.cue)) for (const v of Object.values(g)) s.add(v as number);
  for (const c of CAPTIONS) s.add(c.t);
  return [...s].sort((a, b) => a - b);
})();
