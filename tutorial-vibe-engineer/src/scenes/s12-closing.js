// S12 · closing — STYLE.md §1–2, brand kit. The ring draws symmetrically from 9 o'clock, the notched arrow flies in
// from the left on a blue light trail and locks into the right gap ON the beat (#60A5FA shockwave, outBack pop),
// the wordmark rises from a mask, then the education CTA (Follow, clicked: Notion 43–46 s) and, at the user's request,
// the site + WhatsApp pills (beyond-studio/kontak.json). VO 19.
import { el, svgEl, st, tf, gblur, show, txt, attr, html } from '../dom.js';
import { clamp, ease, lerp, fq } from '../core.js';
import { S, CUE } from '../timeline.js';
import { Cursor, path } from '../ui/cursor.js';

// logo geometry, viewBox 500×500 (STYLE.md §1)
const RING = { cx: 249, cy: 247, r: 135, w: 34 };
const ARROW = 'M200,172 L330,247 L200,327 L234,247 Z';
const ARC = Math.PI * RING.r;
const L = { size: 560, cx: 540, cy: 640 }; // on stage: ring outer Ø = 304 × 1.12 ≈ 340 px
const K = L.size / 500, LX = L.cx - L.size / 2, LY = L.cy - L.size / 2;
const sx = (u) => LX + u * K, sy = (v) => LY + v * K;
const Y = { wm: 872, line: 1022, follow: 1104, ask: 1262, url: 1318, wa: 1428 };
const URL = 'beyondstudio.site', WA = '0819-2707-0239';

let root, glow, svg, arcT, arcB, arrowG, trail, wave, wm, wmIn, line, fol, folTxt, ask, url, urlTxt, wa, waRing, cur;

function pillBox(parent, bg, color, border) {
  const p = el('div', 'cta', parent);
  st(p, { background: bg, color, ...(border ? { border } : {}), left: '0px', top: '0px' });
  return p;
}

export default {
  id: 'closing', layer: 'closing', pre: 0, post: 0,
  init({ closing }) {
    root = el('div', 'layer', closing);
    glow = el('div', 'blob', root); st(glow, { left: `${L.cx - 520}px`, top: `${L.cy - 520}px`, width: '1040px', height: '1040px', background: '#14306E', filter: 'blur(140px)' });
    svg = svgEl('svg', { viewBox: '0 0 500 500', width: L.size, height: L.size, style: `position:absolute;left:${LX}px;top:${LY}px;overflow:visible` }, root);
    const defs = svgEl('defs', {}, svg);
    const m = svgEl('mask', { id: 'gap', maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 900, height: 900 }, defs);
    svgEl('rect', { x: -200, y: -200, width: 900, height: 900, fill: '#fff' }, m);
    svgEl('rect', { x: 300, y: 229, width: 200, height: 36, fill: '#000' }, m);
    const g = svgEl('g', { mask: 'url(#gap)' }, svg);
    const a0 = `M${RING.cx - RING.r},${RING.cy}`;
    arcT = svgEl('path', { d: `${a0} A${RING.r},${RING.r} 0 0 1 ${RING.cx + RING.r},${RING.cy}`, fill: 'none', stroke: '#F5F5F5', 'stroke-width': RING.w, 'stroke-linecap': 'butt', 'stroke-dasharray': ARC }, g);
    arcB = svgEl('path', { d: `${a0} A${RING.r},${RING.r} 0 0 0 ${RING.cx + RING.r},${RING.cy}`, fill: 'none', stroke: '#F5F5F5', 'stroke-width': RING.w, 'stroke-linecap': 'butt', 'stroke-dasharray': ARC }, g);
    trail = el('div', 'abs', root);
    st(trail, { height: '10px', 'border-radius': '10px', background: 'linear-gradient(90deg, rgba(59,130,246,0), rgba(96,165,250,.9))', filter: 'blur(3px)', 'transform-origin': '100% 50%' });
    arrowG = svgEl('g', {}, svg);
    svgEl('path', { d: ARROW, fill: '#F5F5F5' }, arrowG);
    wave = svgEl('circle', { cx: 384, cy: 247, r: 0, fill: 'none', stroke: '#60A5FA' }, svg);
    // wordmark from behind a mask
    const wmClip = el('div', 'abs', root); st(wmClip, { left: '0px', top: `${Y.wm}px`, width: '1080px', height: '120px', overflow: 'hidden' });
    wm = el('div', 'wm', wmClip, 'Beyond Studio'); st(wm, { left: '0px', top: '6px', width: '1080px', 'text-align': 'center' });
    line = el('div', 'cta-line', root, 'Follow, biar nggak cuma vibe coding.'); st(line, { left: '0px', top: `${Y.line}px`, width: '1080px', 'text-align': 'center' });
    fol = pillBox(root, '#3B82F6', '#fff');
    folTxt = el('span', '', fol, '+ Follow');
    ask = el('div', 'cta-ask', root, 'Mau dibikinin video kayak gini?'); st(ask, { left: '0px', top: `${Y.ask}px`, width: '1080px', 'text-align': 'center' });
    url = pillBox(root, '#12151C', '#F5F5F5', '1.5px solid #2A2F3A');
    st(url, { height: '86px', 'font-size': '34px' });
    const gs = svgEl('svg', { viewBox: '0 0 24 24', width: 34, height: 34 }, url);
    svgEl('path', { d: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18', fill: 'none', stroke: '#9CA3AF', 'stroke-width': 1.8 }, gs);
    urlTxt = el('span', '', url);
    el('span', 'tag', url, 'SITUS');
    wa = pillBox(root, '#25D366', '#052E16');
    st(wa, { height: '86px', 'font-size': '36px' });
    const ws = svgEl('svg', { viewBox: '0 0 24 24', width: 36, height: 36 }, wa);
    svgEl('path', { d: 'M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.8-1.3A9.4 9.4 0 1 0 12 2.5z', fill: 'none', stroke: '#052E16', 'stroke-width': 1.9, 'stroke-linejoin': 'round' }, ws);
    svgEl('path', { d: 'M8.6 7.6c.3-.6.6-.6.9-.6h.6c.2 0 .5.1.6.4l.9 2.1c.1.3 0 .5-.1.7l-.6.7c-.2.2-.2.4 0 .7.6 1 1.4 1.8 2.5 2.4.3.2.5.1.7-.1l.7-.8c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.6 0 .6-.2 1.4-.8 1.8-.7.5-1.6.7-2.6.4-2.5-.8-4.6-2.7-5.8-5-.6-1.2-.6-2.5.2-3.9z', fill: '#052E16' }, ws);
    el('span', '', wa, WA);
    el('span', 'tag', wa, 'WHATSAPP');
    waRing = el('div', 'abs', root); st(waRing, { border: '3px solid #25D366', 'border-radius': '999px' });
    cur = new Cursor(root);
  },
  render(t) {
    const C = CUE.closing, s = S.closing;
    if (!show(root, t >= s.t0)) return;
    // ring: two arcs from 9 o'clock, meeting at the gap
    const rp = ease.inOutCubic(clamp((t - C.ring[0]) / (C.ring[1] - C.ring[0])));
    attr(arcT, { 'stroke-dashoffset': (ARC * (1 - rp)).toFixed(2) });
    attr(arcB, { 'stroke-dashoffset': (ARC * (1 - rp)).toFixed(2) });
    st(glow, { opacity: 0.25 + 0.35 * clamp((t - C.lock) / 0.6) });
    // arrow: flies in from the left, decelerating hard into the gap on the beat; outBack pop on lock
    // nearly constant speed with only a hint of braking: it visibly ARRIVES on the beat and stops dead (the impact)
    const ap = clamp((t - C.arrow[0]) / (C.arrow[1] - C.arrow[0])), ae = 1 - Math.pow(1 - ap, 1.35);
    const ax = lerp(-760, 0, ae), vel = 1.35 * Math.pow(1 - ap, 0.35) * 760 / (C.arrow[1] - C.arrow[0]); // px(svg)/s
    const pop = t >= C.lock ? 1 + 0.07 * Math.sin(Math.PI * clamp((t - C.lock) / 0.34)) * (1 - clamp((t - C.lock) / 0.34)) : 1;
    attr(arrowG, { transform: `translate(${ax.toFixed(2)},0)`, opacity: t >= C.arrow[0] ? 1 : 0 });
    attr(svg, { style: `position:absolute;left:${LX}px;top:${LY}px;overflow:visible;transform:scale(${pop.toFixed(4)});transform-origin:${L.size / 2}px ${L.size / 2}px` });
    // light trail behind the arrow (length follows speed)
    const tl = Math.min(520, vel * 0.28), tipX = sx(330 + ax), tipY = sy(247);
    st(trail, { display: t >= C.arrow[0] && ap < 1 && tl > 4 ? '' : 'none', left: `${tipX - tl - 40}px`, top: `${tipY - 5}px`, width: `${tl}px`, opacity: clamp(ap * 3) });
    // shockwave from the gap
    const wp = clamp((t - C.wave[0]) / (C.wave[1] - C.wave[0]));
    attr(wave, { r: (ease.outCubic(wp) * 260).toFixed(2), 'stroke-width': (8 * (1 - wp) + 0.5).toFixed(2), opacity: t >= C.wave[0] && wp < 1 ? (1 - wp).toFixed(3) : 0 });
    // wordmark
    const wq = ease.outExpo(clamp((t - C.wordmark[0]) / (C.wordmark[1] - C.wordmark[0])));
    st(wm, { transform: tf({ y: (1 - wq) * 118 }) });
    // CTA line + Follow pill (pop, then tapped: + Follow → ✓ Following)
    const lq = ease.enter(clamp((t - C.line) / 0.6));
    st(line, { opacity: lq, transform: tf({ y: (1 - lq) * 26 }), filter: gblur((1 - lq) * 8) });
    const tapped = t >= C.tap + 0.05;
    txt(folTxt, tapped ? '✓ Following' : '+ Follow');
    const fp = ease.outBack(clamp((t - C.follow) / 0.45), 1.5), fw = tapped ? 360 : 300;
    const press = t >= C.tap && t < C.tap + 0.22 ? 1 - 0.07 * Math.sin(Math.PI * (t - C.tap) / 0.22) : 1;
    st(fol, { display: t >= C.follow ? '' : 'none', width: `${fw}px`, 'justify-content': 'center', background: tapped ? '#1F2430' : '#3B82F6', color: tapped ? '#E5E7EB' : '#fff', transform: tf({ x: 540 - fw / 2, y: Y.follow, s: fp * press }), 'transform-origin': '50% 50%', 'box-shadow': tapped ? 'none' : '0 18px 50px rgba(59,130,246,.45)' });
    // ask + site + WhatsApp
    const kq = ease.enter(clamp((t - C.ask) / 0.55));
    st(ask, { opacity: kq, transform: tf({ y: (1 - kq) * 20 }) });
    const n = clamp(Math.floor((fq(t) - C.url - 0.1) * 34), 0, URL.length);
    txt(urlTxt, URL.slice(0, n));
    const uw = 470, up = ease.outBack(clamp((t - C.url) / 0.45), 1.5);
    st(url, { display: t >= C.url ? '' : 'none', width: `${uw}px`, transform: tf({ x: 540 - uw / 2, y: Y.url, s: up }), 'transform-origin': '50% 50%' });
    const ww = 520, wpop = ease.outBack(clamp((t - C.wa) / 0.45), 1.5);
    st(wa, { display: t >= C.wa ? '' : 'none', width: `${ww}px`, transform: tf({ x: 540 - ww / 2, y: Y.wa, s: wpop }), 'transform-origin': '50% 50%', 'box-shadow': '0 16px 44px rgba(37,211,102,.32)' });
    const pq = clamp((t - C.pulse) / 0.8);
    st(waRing, { display: t >= C.pulse && pq < 1 ? '' : 'none', left: `${540 - ww / 2 - 14 * pq}px`, top: `${Y.wa - 14 * pq}px`, width: `${ww + 28 * pq}px`, height: `${86 + 28 * pq}px`, opacity: (1 - pq) * 0.9 });
    // the tap on Follow
    const cp = path(t, [[C.follow - 0.25, 760, 1330], [C.tap - 0.05, 560, Y.follow + 56, ease.ui], [C.tap + 0.9, 600, Y.follow + 110, ease.ui]]);
    cur.render(t, t >= C.follow - 0.25 && t < C.tap + 1.2 ? { x: cp.x, y: cp.y, a: clamp((t - C.follow + 0.25) / 0.2) * (1 - clamp((t - C.tap - 0.8) / 0.3)), click: t >= C.tap ? C.tap : null, ringColor: '#60A5FA' } : null);
  },
};
