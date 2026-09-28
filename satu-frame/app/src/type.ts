// Type & asset loading, and Canvas2D text helpers in the brand voice (Inter Tight, family 'IT').
// Text enters from behind a mask (rises), per character, never a plain fade (STYLE.md).
import { clamp, ease, lerp } from './engine/util';

export async function loadFonts() {
  const faces = [new FontFace('IT', 'url(fonts/it.woff2)', { weight: '100 900', style: 'normal' }), new FontFace('IT', 'url(fonts/it-i.woff2)', { weight: '100 900', style: 'italic' })];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
  await document.fonts.ready;
}

const images = new Map<string, HTMLImageElement>();
export async function loadImages(srcs: string[]) {
  await Promise.all(srcs.map(async (s) => {
    const im = new Image();
    im.src = s;
    await im.decode();
    images.set(s, im);
  }));
}
export const img = (s: string) => {
  const im = images.get(s);
  if (!im) throw new Error(`image not preloaded: ${s}`);
  return im;
};

export const font = (px: number, weight = 700, italic = false) => `${italic ? 'italic ' : ''}${weight} ${px}px IT`;

/** Set font + tracking (em) on a context. */
export function setType(c: CanvasRenderingContext2D, px: number, weight = 700, trackEm = -0.045, italic = false) {
  c.font = font(px, weight, italic);
  c.letterSpacing = `${(px * trackEm).toFixed(2)}px`;
  c.textBaseline = 'alphabetic';
}

/** Width of a string with the current font/tracking (the trailing tracking removed). */
export function measure(c: CanvasRenderingContext2D, s: string) {
  const ls = parseFloat(c.letterSpacing) || 0;
  return c.measureText(s).width - ls;
}

/** Fit a font size so `s` is at most `maxW` wide. */
export function fitPx(c: CanvasRenderingContext2D, s: string, px: number, maxW: number, weight = 700, trackEm = -0.045) {
  setType(c, px, weight, trackEm);
  const w = measure(c, s);
  return w > maxW ? px * (maxW / w) : px;
}

export interface MaskOpts {
  /** 'left' | 'center' | 'right' anchor at x. */
  align?: CanvasTextAlign;
  weight?: number;
  trackEm?: number;
  color?: string;
  /** Per-character stagger (s of progress spread); total stagger is capped like the old film. */
  stagger?: number;
  italic?: boolean;
}

/**
 * Draw `s` with its baseline at y, each character rising from behind a mask line into place:
 * `pin` 0→1 = entering, `pout` 0→1 = leaving upward (exit is faster, STYLE.md). Progresses are
 * already-eased values for the whole line; per-char offsets are applied here.
 */
export function maskText(c: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, pin: number, pout = 0, o: MaskOpts = {}) {
  if (pin <= 0 || pout >= 1) return 0;
  setType(c, px, o.weight ?? 760, o.trackEm ?? -0.045, o.italic);
  const w = measure(c, s);
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const n = s.length;
  const st = Math.min(o.stagger ?? 0.35, 0.6);
  c.save();
  c.beginPath();
  c.rect(x0 - px * 0.2, y - px * 1.02, w + px * 0.4, px * 1.3);
  c.clip();
  c.fillStyle = o.color ?? '#F5F5F5';
  c.textAlign = 'left';
  let prefix = 0;
  for (let i = 0; i < n; i++) {
    const ch = s[i]!;
    const d = n > 1 ? (i / (n - 1)) * st : 0;
    const a = ease.outExpo(clamp((pin - d) / (1 - st)));
    const b = ease.inCubic(clamp((pout - d * 0.5) / (1 - st * 0.5)));
    const dy = (1 - a) * px * 1.3 - b * px * 1.3;
    if (ch !== ' ') c.fillText(ch, x0 + prefix, y + dy);
    prefix = measure(c, s.slice(0, i + 1)) + (parseFloat(c.letterSpacing) || 0);
  }
  c.restore();
  return w;
}

/** Typewriter: the first `n` characters. */
export const typed = (s: string, p: number) => s.slice(0, Math.round(clamp(p) * s.length));

/** Rounded rect path. */
export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.arcTo(x + w, y, x + w, y + h, k);
  c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k);
  c.arcTo(x, y, x + w, y, k);
  c.closePath();
}

export { lerp };
