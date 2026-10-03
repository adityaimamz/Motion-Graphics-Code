// select.js — Figma-style selection: blue frame, four handles, a live "W × H" label, faint guides (TypingMind 1–3 s).
import { el, st, txt, show } from '../dom.js';
import { clamp, ease } from '../core.js';

export class Select {
  constructor(parent) {
    this.root = el('div', 'abs', parent);
    this.gx = el('div', 'guide', this.root); this.gy = el('div', 'guide', this.root);
    this.box = el('div', 'sel', this.root);
    this.h = [0, 1, 2, 3].map(() => el('i', '', this.box));
    this.lab = el('div', 'lab', this.box);
  }
  // r = { x, y, w, h } (stage px); a = 0..1 visibility; label = text or null (defaults to "W × H")
  render(r, a, label = null, pad = 10) {
    if (!show(this.root, a > 0.001 && !!r)) return;
    const x = r.x - pad, y = r.y - pad, w = r.w + pad * 2, h = r.h + pad * 2;
    const p = ease.enter(clamp(a));
    st(this.root, { opacity: clamp(a * 1.4) });
    st(this.box, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, transform: `scale(${(0.97 + 0.03 * p).toFixed(3)})` });
    const o = -8.5;
    [[o, o], [w + o - 2, o], [o, h + o - 2], [w + o - 2, h + o - 2]].forEach(([lx, ly], i) => st(this.h[i], { left: `${lx - 2}px`, top: `${ly - 2}px` }));
    txt(this.lab, label ?? `${Math.round(r.w)} × ${Math.round(r.h)}`);
    st(this.gx, { left: '0px', top: `${y + h / 2}px`, width: '1080px', height: '1px', opacity: 0.55 * p });
    st(this.gy, { left: `${x + w / 2}px`, top: '0px', width: '1px', height: '1920px', opacity: 0.35 * p });
  }
}
