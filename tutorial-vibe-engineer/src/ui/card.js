// card.js — the white UI card of both references: 28 px radius, 1 px line, two-layer soft shadow, optional header
// (lights + title + sub), rising from below with a small rotateX (TREATMENT "Kartu"). place() writes the whole look
// from numbers, so a card is a pure function of t like everything else.
import { el, st, tf, gblur } from '../dom.js';

export function makeCard(parent, { w, h, title = null, sub = null, lights = true, head = 76, cls = '' } = {}) {
  const root = el('div', `card ${cls}`.trim(), parent);
  st(root, { left: '0px', top: '0px', width: `${w}px`, height: `${h}px` });
  let hdr = null, ttl = null, sb = null, lg = null;
  if (title != null) {
    hdr = el('div', 'hdr', root); st(hdr, { height: `${head}px` });
    if (lights) { lg = el('div', 'lights', hdr); for (let i = 0; i < 3; i++) el('i', '', lg); }
    ttl = el('span', '', hdr, title);
    if (sub != null) sb = el('span', 'sub', hdr, sub);
  }
  const body = el('div', 'abs', root); st(body, { left: '0px', top: `${hdr ? head : 0}px`, right: '0px', bottom: '0px' });
  return { root, hdr, ttl, sb, lg, body, w, h, head };
}

// p: 0..1 entrance progress (already eased). x, y: top-left on the stage.
export function place(card, { x = 0, y = 0, s = 1, p = 1, dy = 40, rx = 8, r = 0, a = 1, blur = 0, ox = '50% 50%', w = null, h = null, radius = null } = {}) {
  const e = p;
  const o = {
    transform: `perspective(1700px) ${tf({ x, y: y + (1 - e) * dy, rx: (1 - e) * rx, r, s: s * (0.96 + 0.04 * e) })}`, 'transform-origin': ox,
    opacity: Math.min(1, e * 2.2) * a, filter: gblur(blur + (1 - e) * 6),
    'box-shadow': `0 ${(24 * e).toFixed(1)}px ${(60 * e).toFixed(1)}px rgba(16,24,40,${(0.1 * e).toFixed(3)}), 0 ${(2 * e).toFixed(1)}px ${(6 * e).toFixed(1)}px rgba(16,24,40,${(0.06 * e).toFixed(3)})`,
  };
  if (w != null) o.width = `${w}px`;
  if (h != null) o.height = `${h}px`;
  if (radius != null) o['border-radius'] = `${radius}px`;
  st(card.root, o);
}
