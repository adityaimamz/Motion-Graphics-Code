import { hexToLinear } from './util';

// Beyond Studio brand palette (STYLE.md): void, paper, one blue family. Satu Frame adds the display's own
// red/green emitters (screen close-ups only, TREATMENT §3) and two heavily desaturated metals.
export const HEX = {
  void: '#000000',
  floor: '#050608',
  paper: '#F5F5F5',
  mute: '#9CA3AF',
  g1: '#131318',
  g2: '#1A1A21',
  line: '#26262E',
  blue: '#3B82F6',
  blue2: '#2563EB',
  ice: '#60A5FA',
  deep: '#1D4ED8',
  wa: '#25D366',
  // physical subpixels (only as emitters, never as UI/type colour)
  subR: '#FF3B2F',
  subG: '#3DFF7A',
  subB: '#2F5BFF',
  // metals, desaturated
  gold: '#B8A987',
  copper: '#A08A7A',
} as const;

export type PaletteKey = keyof typeof HEX;

/** Linear RGB triplets for GL uniforms. */
export const LIN: Record<PaletteKey, [number, number, number]> = Object.fromEntries(
  Object.entries(HEX).map(([k, v]) => [k, hexToLinear(v)]),
) as Record<PaletteKey, [number, number, number]>;

/** CSS rgba() for Canvas2D. */
export function rgba(key: PaletteKey | string, a = 1): string {
  const hex = (HEX as Record<string, string>)[key] ?? key;
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
