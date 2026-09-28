// The single time source (../../cues.json), shared with audio.py. Seconds.
import C from '../../cues.json';

export const CUE = C;
export const CH = C.ch as Record<keyof typeof C.ch, [number, number]>;
export const DUR = C.dur;
export const BEAT = 60 / C.bpm;
export const BAR = 4 * BEAT;
