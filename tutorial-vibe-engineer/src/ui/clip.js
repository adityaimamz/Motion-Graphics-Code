// clip.js — plays a real clip of the first video as an image sequence (assets/ve/.frames/<name>/NNNN.jpg, 30 fps).
// The frame shown is a pure function of the clip's local time.
import { el, st, src } from '../dom.js';
import { A } from '../artefak.js';

export const CLIP = A.video.clips;
export const frameUrl = (name, k) => `assets/ve/.frames/${name}/${String(k + 1).padStart(4, '0')}.jpg`;
// frame index for local time lt (s); loop or hold the last frame
export function frameAt(name, lt, loop = false) {
  const c = CLIP[name], f = Math.floor(Math.max(0, lt) * c.fps + 1e-6);
  return loop ? f % c.n : Math.min(c.n - 1, f);
}
export class ClipView {
  constructor(parent, style = {}) {
    this.img = el('img', 'abs', parent);
    st(this.img, { width: '100%', height: '100%', 'object-fit': 'cover', 'image-rendering': 'pixelated', display: 'block', ...style });
  }
  render(name, lt, loop = false) { src(this.img, frameUrl(name, frameAt(name, lt, loop))); }
}
