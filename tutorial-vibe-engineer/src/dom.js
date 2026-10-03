// dom.js — tiny element builder + cached style writer. Every frame, render(t) writes every property it owns; the cache
// only skips writes whose value did not change, so the DOM state is always a pure function of t (no CSS transitions,
// no animations, nothing remembered between frames that is not rewritten).
import { r2 } from './core.js';

export function el(tag, cls, parent, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  n.__s = {};
  return n;
}
export function svgEl(tag, attrs, parent) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs ?? {})) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  n.__s = {};
  return n;
}
// set styles: { transform, opacity, ... }; numbers for opacity are rounded
export function st(n, o) {
  const c = n.__s ?? (n.__s = {});
  for (const k in o) {
    let v = o[k];
    if (typeof v === 'number') v = String(r2(v));
    if (c[k] !== v) { c[k] = v; n.style.setProperty(k, v); }
  }
}
export function attr(n, o) {
  const c = n.__a ?? (n.__a = {});
  for (const k in o) { const v = String(o[k]); if (c[k] !== v) { c[k] = v; n.setAttribute(k, v); } }
}
export function txt(n, s) { if (n.__t !== s) { n.__t = s; n.textContent = s; } }
export function html(n, s) { if (n.__h !== s) { n.__h = s; n.innerHTML = s; } }
export function show(n, on) { st(n, { display: on ? '' : 'none' }); return on; }

// transform string; px values rounded to 0.01
export function tf({ x = 0, y = 0, s = 1, sx = 1, sy = 1, r = 0, rx = 0, ry = 0, z = 0 } = {}) {
  let out = `translate3d(${r2(x)}px,${r2(y)}px,${r2(z)}px)`;
  if (rx) out += ` rotateX(${r2(rx)}deg)`;
  if (ry) out += ` rotateY(${r2(ry)}deg)`;
  if (r) out += ` rotate(${r2(r)}deg)`;
  if (s !== 1 || sx !== 1 || sy !== 1) out += ` scale(${r2(s * sx)},${r2(s * sy)})`;
  return out;
}

// directional blur through SVG filters (x / y standard deviation), quantised to 0.5 px so few filters exist
let defs = null;
const made = new Set();
export function initFilters(root) {
  const svg = svgEl('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0' }, root);
  defs = svgEl('defs', {}, svg);
}
export function dblur(bx, by = 0) {
  const qx = Math.round(Math.max(0, bx) * 2) / 2, qy = Math.round(Math.max(0, by) * 2) / 2;
  if (qx < 0.5 && qy < 0.5) return 'none';
  const id = `db_${qx}_${qy}`.replace(/\./g, 'p');
  if (!made.has(id)) {
    made.add(id);
    const f = svgEl('filter', { id, x: '-50%', y: '-50%', width: '200%', height: '200%', 'color-interpolation-filters': 'sRGB' }, defs);
    svgEl('feGaussianBlur', { stdDeviation: `${qx} ${qy}` }, f);
  }
  return `url(#${id})`;
}
// gaussian blur + optional extras as one filter string
export const gblur = (b) => (b < 0.25 ? 'none' : `blur(${r2(b)}px)`);

// image sources that change per frame (clip playback): the export waits until every changed image is decoded,
// so a screenshot never catches a half-loaded frame
const pending = [];
export function src(img, url) {
  if (img.__src === url) return;
  img.__src = url; img.src = url;
  pending.push(img.decode().catch(() => {}));
}
export async function settle() { while (pending.length) await Promise.all(pending.splice(0)); }
