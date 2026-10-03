// fx.js — small marks that prove something happened: a check that draws itself, a strike line drawn left → right,
// a rubber stamp. Each is written from a 0..1 progress, nothing is remembered.
import { el, svgEl, st, attr, tf, show } from '../dom.js';
import { clamp, ease } from '../core.js';

export class Check {
  constructor(parent, size = 34, color = '#1F9D63', circle = true) {
    this.root = el('div', 'abs', parent); st(this.root, { width: `${size}px`, height: `${size}px`, 'transform-origin': '50% 50%' });
    const s = svgEl('svg', { viewBox: '0 0 24 24', width: size, height: size }, this.root);
    if (circle) svgEl('circle', { cx: 12, cy: 12, r: 11.5, fill: color }, s);
    this.p = svgEl('path', { d: 'M6.6 12.6l3.7 3.7L17.5 8.5', fill: 'none', stroke: circle ? '#fff' : color, 'stroke-width': 2.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': 18, 'stroke-dashoffset': 18 }, s);
  }
  render(x, y, p, a = 1) {
    if (!show(this.root, p > 0 && a > 0.001)) return;
    st(this.root, { transform: tf({ x, y, s: ease.outBack(clamp(p * 1.6), 2) }), opacity: a });
    attr(this.p, { 'stroke-dashoffset': (18 * (1 - ease.outCubic(clamp((p - 0.2) / 0.6)))).toFixed(2) });
  }
}

export class Strike {
  constructor(parent, color = '#2F6BFF', h = 8) {
    this.n = el('div', 'abs', parent);
    st(this.n, { height: `${h}px`, background: color, 'border-radius': `${h / 2}px`, 'transform-origin': '0 50%' });
  }
  render(x, y, w, p, a = 1) {
    if (!show(this.n, p > 0 && a > 0.001)) return;
    st(this.n, { transform: tf({ x, y, sx: ease.outCubic(clamp(p)) }), width: `${w}px`, opacity: a });
  }
}

// a rubber stamp: slams in from a larger size with a little rotation
export class Stamp {
  constructor(parent, text, color = '#1F9D63') {
    this.n = el('div', 'abs', parent, text);
    st(this.n, { font: '700 30px/1 IT', 'letter-spacing': '-0.01em', color, border: `4px solid ${color}`, 'border-radius': '14px', padding: '12px 22px', 'white-space': 'nowrap', background: 'rgba(255,255,255,.78)' });
  }
  render(x, y, p, rot = -7, a = 1) {
    if (!show(this.n, p > 0 && a > 0.001)) return;
    const e = ease.outCubic(clamp(p / 0.35));
    st(this.n, { transform: tf({ x, y, s: 1.7 - 0.7 * e, r: rot }), opacity: clamp(p * 5) * a });
  }
}
