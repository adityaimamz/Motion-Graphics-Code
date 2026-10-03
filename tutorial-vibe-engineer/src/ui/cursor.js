// cursor.js — a macOS-like arrow drawn here (no asset). Moves on eased paths, clicks with a ring (both references).
import { el, svgEl, st, tf, show } from '../dom.js';
import { clamp, ease, lerp } from '../core.js';

export class Cursor {
  constructor(parent) {
    this.root = el('div', 'abs', parent);
    this.ring = el('div', 'ring', this.root);
    this.glow = el('div', 'glow', this.root);
    this.c = el('div', 'cursor', this.root);
    const s = svgEl('svg', { viewBox: '0 0 23 29', width: 46, height: 58 }, this.c);
    svgEl('path', { d: 'M1.5 1.5v22.6l6-5.6 3.8 8.6 4-1.8-3.8-8.4h8.3z', fill: '#0E1116', stroke: '#fff', 'stroke-width': '1.6', 'stroke-linejoin': 'round' }, s);
    st(this.c, { filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.28))' });
  }
  // s: null | { x, y, a (alpha), click (time) , dark }
  render(t, s) {
    if (!show(this.root, !!s && (s.a ?? 1) > 0.001)) return;
    const dc = s.click != null ? t - s.click : -1;
    const press = dc >= 0 && dc < 0.25 ? 1 - 0.16 * Math.sin(Math.PI * clamp(dc / 0.2)) : 1;
    st(this.c, { transform: tf({ x: s.x - 3, y: s.y - 3, s: press }), opacity: s.a ?? 1, 'transform-origin': '3px 3px' });
    const p = clamp(dc / 0.55), on = dc >= 0 && p < 1, R = 14 + 52 * ease.outCubic(p);
    st(this.ring, { display: on ? '' : 'none', left: `${s.x - R}px`, top: `${s.y - R}px`, width: `${R * 2}px`, height: `${R * 2}px`, opacity: (1 - p) * 0.85, 'border-color': s.ringColor ?? '#2F6BFF' });
    const g = clamp(dc / 0.8), gon = dc >= 0 && g < 1, G = 70 + 40 * g;
    st(this.glow, { display: gon ? '' : 'none', left: `${s.x - G}px`, top: `${s.y - G}px`, width: `${G * 2}px`, height: `${G * 2}px`, opacity: Math.sin(Math.PI * g) * 0.9 });
  }
}
// eased path between points: path(t, [[t0, x, y], [t1, x, y, ease?], ...]) → { x, y }
export function path(t, k) {
  if (t <= k[0][0]) return { x: k[0][1], y: k[0][2] };
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const [t0, x0, y0] = k[i - 1], [t1, x1, y1, e = ease.move] = k[i], p = e(clamp((t - t0) / (t1 - t0)));
    // a slight arc, like a hand
    const bend = Math.sin(Math.PI * p) * Math.min(60, Math.hypot(x1 - x0, y1 - y0) * 0.12);
    return { x: lerp(x0, x1, p) + bend * 0.4, y: lerp(y0, y1, p) - bend };
  }
  const l = k[k.length - 1]; return { x: l[1], y: l[2] };
}
