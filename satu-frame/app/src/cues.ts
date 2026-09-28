// The single time source (../../cues.json), shared with audio.py. Seconds of film.
import C from '../../cues.json' with { type: 'json' };

export const CUE = C;
export const CH = C.ch as Record<keyof typeof C.ch, [number, number]>;
export const DUR = C.dur;
export const BEAT = 60 / C.bpm;
export const BAR = 4 * BEAT;
/** Beat index -> film seconds. */
export const beat = (n: number) => n * BEAT;
