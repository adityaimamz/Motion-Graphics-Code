// Type that is printed, not overlaid: a caption appears a few letters per 12 fps step, each letter starting
// narrow and faint and swelling to its full width and ink in its own slot (Anybody wdth 60 → set width,
// density 0.45 → 1). Slots come from the whole line at its final style, so kerning is the font's own.
import { anyFont, fitWdth, serifFont } from '../fonts';
import { clamp } from '../engine/util';
import type { InkCanvas } from './ink';
import type { Ink } from '../palette';

export interface PrintOpts {
  px: number;
  wght?: number;
  /** final width axis */
  wdth?: number;
  /** fit the line to at most this width by narrowing the width axis (never wider than `wdth`) */
  maxW?: number;
  /** tracking (em) */
  track?: number;
  ink?: Ink;
  align?: 'left' | 'center' | 'right';
  /** letters per second (default: the whole line in ~0.9 s, 12..36 cps) */
  cps?: number;
  /** 'any' = Anybody (variable), 'serif' = Instrument Serif Italic (only density swells) */
  face?: 'any' | 'serif';
}

/** Each letter's own age, `age` s after the print started. */
export function printAges(s: string, age: number, cps?: number) {
  const rate = cps ?? clamp(s.length / 0.9, 12, 36);
  return [...s].map((_, i) => age - i / rate);
}

const fitCache = new Map<string, number>();

/** Draw one printed line (baseline y) into `ink`. Returns its width. `age` < 0 draws nothing. */
export function printLine(ink: InkCanvas, s: string, x: number, y: number, age: number, o: PrintOpts) {
  if (age < 0) return 0;
  const ages = printAges(s, age, o.cps);
  const wght = o.wght ?? 800, track = o.track ?? -0.01;
  const m = ink.ctxs.solid;
  let wdth = o.wdth ?? 92;
  if (o.maxW && o.face !== 'serif') {
    const key = `${s}|${o.px}|${wght}|${wdth}|${o.maxW}|${track}`;
    if (!fitCache.has(key)) fitCache.set(key, Math.min(wdth, fitWdth(m, s, o.px, wght, o.maxW, track)));
    wdth = fitCache.get(key)!;
  }
  const finalFont = o.face === 'serif' ? serifFont(o.px) : anyFont(o.px, wght, wdth);
  m.font = finalFont;
  m.letterSpacing = `${track * o.px}px`;
  // slot i starts at the kerned width of the prefix; its width is prefix(i+1) − prefix(i)
  const pre = [0];
  for (let i = 1; i <= s.length; i++) pre.push(m.measureText(s.slice(0, i)).width);
  const total = pre[s.length]! - track * o.px;
  const x0 = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  for (let i = 0; i < s.length; i++) {
    const a = ages[i]!;
    if (a < 0) break;
    const ch = s[i]!;
    if (ch === ' ') continue;
    const k = clamp(a / 0.25); // ~3 steps to swell
    const e = 1 - (1 - k) * (1 - k);
    const dens = 0.45 + 0.55 * e;
    const font = o.face === 'serif' ? finalFont : anyFont(o.px, wght * (0.8 + 0.2 * e), 60 + (wdth - 60) * e);
    const slot = pre[i + 1]! - pre[i]!;
    ink.paint('solid', o.ink ?? 'black', dens, (c) => {
      c.font = font;
      c.letterSpacing = '0px';
      c.textBaseline = 'alphabetic';
      c.textAlign = 'center';
      c.fillText(ch, x0 + pre[i]! + slot / 2 - (track * o.px) / 2, y);
    });
  }
  return total;
}

/** Key fragment for a printed line at `age`: changes only when something visible changes. */
export function printKey(s: string, age: number, cps?: number) {
  if (age < 0) return '-';
  const ages = printAges(s, age, cps);
  return ages.map((a) => (a < 0 ? '' : Math.min(4, Math.floor(a / 0.0833 + 1e-6)))).join(',');
}
