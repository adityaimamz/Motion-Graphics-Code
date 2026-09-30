// Content palette: a risograph print shop (TREATMENT §3). The brand kit lives in engine/palette.ts and is
// used by the closing only.
import { hexToLinear } from './engine/util';

export const RISO = {
  board: '#CFC6B4',
  sheet: '#F4F0E8',
  sheetShade: '#D9D2C4',
  black: '#1D1B1A',
  pink: '#FF48B0',
  blue: '#0078BF',
  yellow: '#FFE800',
  tape: '#E6DABB',
  graphite: '#55555A',
} as const;

export const RISO_LIN = Object.fromEntries(Object.entries(RISO).map(([k, v]) => [k, hexToLinear(v)])) as Record<keyof typeof RISO, [number, number, number]>;

/** Ink channels used by every print: tone/solid textures pack pink, blue, yellow in RGB; black lives in the K texture. */
export const INK = { pink: 0, blue: 1, yellow: 2, black: 3 } as const;
export type Ink = keyof typeof INK;
