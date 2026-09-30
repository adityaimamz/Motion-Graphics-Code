// Type. Anybody (variable: wdth 50–150, wght 100–900) is loaded once per width: FontFace 'AnyW<w>' declares
// the single stretch w%, and the browser applies that wdth to the variable font (weight stays continuous in
// ctx.font). So any width/weight pair is a plain font string: anyFont(px, wght, wdth).
// Instrument Serif Italic (the dry aside), Space Mono (tape labels, axes), Architects Daughter (pencil notes)
// and Inter Tight (closing only, brand kit).
export const WDTH_MIN = 50, WDTH_MAX = 150;

export async function loadFonts() {
  const buf = await (await fetch('fonts/anybody.ttf')).arrayBuffer();
  const faces: FontFace[] = [];
  for (let w = WDTH_MIN; w <= WDTH_MAX; w++) faces.push(new FontFace(`AnyW${w}`, buf, { stretch: `${w}%`, weight: '100 900' }));
  faces.push(
    new FontFace('ISerif', 'url(fonts/instrument-serif-italic.ttf)', { style: 'normal' }),
    new FontFace('SMono', 'url(fonts/space-mono.ttf)', { weight: '400' }),
    new FontFace('SMono', 'url(fonts/space-mono-bold.ttf)', { weight: '700' }),
    new FontFace('ADaughter', 'url(fonts/architects-daughter.ttf)'),
    new FontFace('IT', 'url(fonts/it.woff2)', { weight: '100 900' }),
  );
  await Promise.all(faces.map((f) => f.load()));
  for (const f of faces) document.fonts.add(f);
  await document.fonts.ready;
}

const clampW = (w: number) => Math.max(WDTH_MIN, Math.min(WDTH_MAX, Math.round(w)));
/** Anybody at any width and weight. */
export const anyFont = (px: number, wght = 800, wdth = 100) => `${Math.round(wght)} ${px}px AnyW${clampW(wdth)}`;
export const serifFont = (px: number) => `${px}px ISerif`;
export const monoFont = (px: number, bold = false) => `${bold ? 700 : 400} ${px}px SMono`;
export const handFont = (px: number) => `${px}px ADaughter`;
export const itFont = (px: number, wght = 700) => `${Math.round(wght)} ${px}px IT`;

/** Width of `s` in the context's current font (with its letterSpacing, trailing spacing removed). */
export function textW(c: CanvasRenderingContext2D, s: string) {
  const ls = parseFloat(c.letterSpacing) || 0;
  return c.measureText(s).width - (s.length ? ls : 0);
}

/**
 * The Anybody width (wdth) that sets `s` exactly `targetW` wide at px/wght (bisection; clamped to the axis).
 * Used for justified lines and for type that stretches to fill a space.
 */
export function fitWdth(c: CanvasRenderingContext2D, s: string, px: number, wght: number, targetW: number, track = 0) {
  let lo = WDTH_MIN, hi = WDTH_MAX;
  for (let i = 0; i < 9; i++) {
    const m = (lo + hi) / 2;
    c.font = anyFont(px, wght, m);
    c.letterSpacing = `${track * px}px`;
    if (textW(c, s) > targetW) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
}
