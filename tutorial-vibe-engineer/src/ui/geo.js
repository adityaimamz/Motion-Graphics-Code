// geo.js — stage rectangles that two scenes agree on, so one object can hand over to the next (morphs between scenes).
export const DOC = { x: 80, y: 560, w: 520, h: 740 };       // S6 card A → S7 TREATMENT.md card
export const CLIP7 = { x: 620, y: 600, w: 310, h: 551 };    // S7 result clip (9:16) → S8 first thumbnail
export const TL = { x: 80, y: 1166, w: 850, h: 150 };       // S8 timeline card
export const thumbRect = (i, n = 8) => {
  const g = 10, pad = 14, w = (TL.w - pad * 2 - g * (n - 1)) / n;
  return { x: TL.x + pad + i * (w + g), y: TL.y + 20, w, h: TL.h - 40 };
};
