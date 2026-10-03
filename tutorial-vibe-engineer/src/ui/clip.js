// clip.js — plays a real clip of the first video as an image sequence (assets/ve/.frames/<name>/NNNN.jpg, 30 fps).
// The frame shown is a pure function of the clip's local time.
// The <img> is always laid out at the source size (540×960) and scaled with a transform to cover its box. Laying it out
// smaller lets Chromium decode the JPEG at the smaller size, and which decode it reuses depends on what was drawn before:
// that broke `npm run check` by a few levels on a few hundred pixels. A fixed layout size keeps every frame identical.
import { el, st, src } from '../dom.js';
import { A } from '../artefak.js';

export const CLIP = A.video.clips;
export const SRC_W = 540, SRC_H = 960;
export const frameUrl = (name, k) => `assets/ve/.frames/${name}/${String(k + 1).padStart(4, '0')}.jpg`;
// frame index for local time lt (s); loop or hold the last frame
export function frameAt(name, lt, loop = false) {
  const c = CLIP[name], f = Math.floor(Math.max(0, lt) * c.fps + 1e-6);
  return loop ? f % c.n : Math.min(c.n - 1, f);
}
// cover the parent box (its current size, measured each frame: some boxes morph)
function cover(img, box) {
  const w = box.clientWidth, h = box.clientHeight;
  if (!w || !h) return;
  const k = Math.max(w / SRC_W, h / SRC_H);
  st(img, { transform: `translate(${((w - SRC_W * k) / 2).toFixed(2)}px,${((h - SRC_H * k) / 2).toFixed(2)}px) scale(${k.toFixed(5)})` });
}
function makeImg(parent, style, fit, layer = false) {
  // layer: give the box its own compositing layer, so a large rounded-corner clip (the S11 phone screen) is always
  // rasterised the same way; elsewhere it is left off (it shifts other boxes by a level or two instead)
  if (layer) st(parent, { 'will-change': 'transform' });
  const img = el('img', 'abs', parent);
  st(img, { width: `${SRC_W}px`, height: `${SRC_H}px`, 'image-rendering': 'pixelated', display: 'block', 'transform-origin': '0 0', ...(fit ? {} : { width: '100%', height: '100%', 'object-fit': 'cover' }), ...style });
  return img;
}
export class ClipView {
  constructor(parent, style = {}, layer = false) { this.box = parent; this.img = makeImg(parent, style, true, layer); }
  render(name, lt, loop = false) { src(this.img, frameUrl(name, frameAt(name, lt, loop))); cover(this.img, this.box); }
}

// a player that shows either a frame of a real clip or a still of the first video (S8: jumping around its timeline).
// fit: false leaves size and position to the caller (S10's magnifier places an enlarged copy itself).
export class VideoView {
  constructor(parent, style = {}, fit = true) { this.box = parent; this.fit = fit; this.img = makeImg(parent, style, fit); }
  // f: { clip, lt, loop } | { still }
  render(f) {
    src(this.img, f.still ? `assets/ve/${f.still}.jpg` : frameUrl(f.clip, frameAt(f.clip, f.lt, f.loop)));
    if (this.fit) cover(this.img, this.box);
  }
}
