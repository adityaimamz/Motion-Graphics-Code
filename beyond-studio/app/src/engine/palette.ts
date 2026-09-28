import { hexToLinear } from './util';

// Beyond Studio brand palette (STYLE.md): void, paper, one blue family. WhatsApp green only in the CTA.
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
