// Output format and language, read once from the page URL: ?fmt=v|h (9:16 / 16:9) & ?lang=id|en.
const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
export const FMT: 'v' | 'h' = q.get('fmt') === 'h' ? 'h' : 'v';
export const LANG: 'id' | 'en' = q.get('lang') === 'en' ? 'en' : 'id';
export const V = FMT === 'v';
/** Logical frame size (px). */
export const W = V ? 1080 : 1920;
export const H = V ? 1920 : 1080;
/** Pick the 9:16 or the 16:9 value. */
export const pick = <T,>(v: T, h: T): T => (V ? v : h);
