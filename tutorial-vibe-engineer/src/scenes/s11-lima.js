// S11 · Lima aturan (dark) — hard cut to the dark after the lights-out. The HUD rail's seven dots lift off and become the
// left column of seven step chips; "Lima aturan yang sama:" with the blue line rolling Baca dulu → Kasih konteks →
// Perintah kecil → Tes → Commit (Notion 36–39 s) and a ticked progress line `0N / 05`; each rule becomes a chip on the
// right that blue curves tie to the steps where it was used. Then the diagram steps back, "Vibe engineer, dibikin dengan
// *cara* vibe engineer.", and a phone frame plays the real end of the first video; at its pixel iris-out the camera pushes
// into the phone's black screen — and we are inside the closing. VO 17, 18.
import { el, svgEl, st, tf, gblur, show, html, attr, txt } from '../dom.js';
import { clamp, ease, lerp } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { Roller } from '../ui/rotator.js';
import { chapterChip } from '../ui/chip.js';
import { ClipView } from '../ui/clip.js';

const RULES = ['Baca dulu', 'Kasih konteks', 'Perintah kecil', 'Tes', 'Commit'];
const SLOT = ['#7FD3FF', '#F5B342', '#E5484D', '#5BD07D', '#5FE3F0'];
const LINKS = [[2, 6], [1], [3, 6], [4], [6]];            // rule → the steps where it was used
const LX = 80, LW = 360, LH = 76, LY = (i) => 780 + i * 92;
const RX = 600, RW = 330, RH = 92, RY = (k) => 806 + k * 124;
const RAIL = (i) => ({ x: 897 + 4.5 + 19 * i, y: 100.5 });
const PHONE = { x: 340, y: 700, w: 400, h: 711, bez: 14 };
// The first video ends on its own iris: a white ring with a notch on the right, drawn with the logo's proportions (measured on
// the last frame, 540×960: Ø 194 px, centre (270, 399.5), stroke 21.5 px). The push-in carries that ring to the exact spot and
// size of the closing's ring (centre 538.9, 636.6; Ø 340.5), so the closing continues it instead of drawing a second one.
const K_SCREEN = PHONE.w / 540, RING_CLIP = { cx: PHONE.x + 270 * K_SCREEN, cy: PHONE.y + 399.5 * K_SCREEN, d: 194 * K_SCREEN };
const RING_TARGET = { cx: 538.9, cy: 636.6, d: 340.5 };
const PUSH_S = RING_TARGET.d / RING_CLIP.d, ORIGIN = { x: PHONE.x + PHONE.w / 2, y: PHONE.y + PHONE.h / 2 };
const PUSH_T = { x: RING_TARGET.cx - ORIGIN.x - PUSH_S * (RING_CLIP.cx - ORIGIN.x), y: RING_TARGET.cy - ORIGIN.y - PUSH_S * (RING_CLIP.cy - ORIGIN.y) };

let root, head1, roll, ticks = [], count, dia, chips = [], rchips = [], slots = [], sv, lines = [], head2, phone, screen, clip;

export default {
  id: 'lima', layer: 'world', pre: 0, post: 0.1,
  init({ world }) {
    root = el('div', 'layer dark', world);
    head1 = new Headline(root, { x: 80, y: 316, size: 72, weight: 640, color: '#F3F4F7', lines: [[['Lima aturan yang sama:']]], seed: 16 });
    roll = new Roller(root, RULES.map((text) => ({ text, fg: '#5B8CFF' })), { font: '680 100px/1 IT', size: 100, height: 124, letter: '-0.04em', fg: '#5B8CFF' });
    for (let i = 0; i < 5; i++) { const k = el('i', '', root); st(k, { position: 'absolute', left: '0px', top: '0px', width: '48px', height: '6px', 'border-radius': '3px', background: 'rgba(255,255,255,.18)', display: 'block' }); ticks.push(k); }
    count = el('div', 'abs', root); st(count, { font: '500 22px/1 JB', color: '#8A909C', 'letter-spacing': '.1em' });
    dia = el('div', 'layer', root);
    // connection curves under the chips
    sv = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;left:0;top:0;overflow:visible' }, dia);
    LINKS.forEach((steps, k) => steps.forEach((i) => {
      const y0 = LY(i) + LH / 2, y1 = RY(k) + RH / 2, x0 = LX + LW, x1 = RX;
      const p = svgEl('path', { d: `M${x0} ${y0} C ${x0 + 90} ${y0}, ${x1 - 90} ${y1}, ${x1} ${y1}`, fill: 'none', stroke: '#5B8CFF', 'stroke-width': 3.5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, sv);
      lines.push({ p, k, i });
    }));
    CHAPTERS.forEach((_, i) => chips.push(chapterChip(dia, i, { w: LW, h: LH, fs: 28, dark: true })));
    // five empty slots (the first video's HUD had five) wait on the right before the rules are named
    RULES.forEach((_, k) => {
      const g = el('div', 'abs', dia); st(g, { width: `${RW}px`, height: `${RH}px`, 'border-radius': '28px', border: '2px dashed rgba(255,255,255,.16)' });
      const q = el('i', '', g); st(q, { position: 'absolute', left: '24px', top: '30px', width: '28px', height: '28px', 'border-radius': '8px', border: `2px solid ${SLOT[k]}`, opacity: 0.55, display: 'block' });
      slots.push(g);
    });
    RULES.forEach((name, k) => {
      const c = el('div', 'abs', dia); st(c, { width: `${RW}px`, height: `${RH}px`, 'border-radius': '28px', background: 'rgba(91,140,255,.14)', border: '1.5px solid rgba(91,140,255,.55)', 'box-shadow': '0 12px 34px rgba(47,107,255,.16)', 'transform-origin': '0 50%' });
      const sq = el('i', '', c); st(sq, { position: 'absolute', left: '26px', top: '32px', width: '28px', height: '28px', 'border-radius': '8px', background: SLOT[k], display: 'block' });
      const n = el('span', '', c, `${k + 1}`); st(n, { position: 'absolute', left: '26px', top: '32px', width: '28px', 'text-align': 'center', font: '700 17px/28px JB', color: '#0B0D12' });
      const t = el('div', 'abs', c, name); st(t, { left: '74px', top: '0px', font: '640 31px/92px IT', 'letter-spacing': '-0.02em', color: '#F3F4F7', 'white-space': 'nowrap' });
      rchips.push(c);
    });
    // closing statement + the phone
    head2 = new Headline(root, { x: 80, y: 316, size: 82, weight: 640, color: '#F3F4F7', lines: [[['Vibe engineer,']], [['dibikin dengan']], [['cara ', 'accent serif'], ['vibe engineer.']]], seed: 17 });
    phone = el('div', 'abs', root); st(phone, { width: `${PHONE.w + PHONE.bez * 2}px`, height: `${PHONE.h + PHONE.bez * 2}px`, 'border-radius': '66px', border: '2.5px solid rgba(255,255,255,.28)', background: '#05070B', 'transform-origin': '50% 50%', 'box-shadow': '0 30px 80px rgba(0,0,0,.5)' });
    screen = el('div', 'abs', phone); st(screen, { left: `${PHONE.bez - 2.5}px`, top: `${PHONE.bez - 2.5}px`, width: `${PHONE.w}px`, height: `${PHONE.h}px`, 'border-radius': '52px', overflow: 'hidden', background: '#000' });
    clip = new ClipView(screen, {}, true);
  },
  render(t) {
    const C = CUE.lima, s = S.lima;
    if (!show(root, t >= s.t0 - 0.05 && t < s.t1 + 0.1)) return;
    const pushK = ease.inOutExpo(clamp((t - C.push) / (s.t1 - C.push)));
    // the camera push at the end: scale about the phone's centre plus a shift, landing the iris ring on the logo's ring
    st(root, { transform: `translate3d(${(PUSH_T.x * pushK).toFixed(2)}px,${(PUSH_T.y * pushK).toFixed(2)}px,0) scale(${(1 + (PUSH_S - 1) * pushK).toFixed(5)})`, 'transform-origin': `${ORIGIN.x}px ${ORIGIN.y}px`, filter: gblur(Math.sin(Math.PI * pushK) * 6) });
    // ---------- the rail's dots become the left chips
    chips.forEach((c, i) => {
      const p = ease.move(clamp((t - C.chips - i * 0.06) / 0.75)), a = RAIL(i), x = lerp(a.x - 4.5, LX, p), y = lerp(a.y - 4.5, LY(i), p);
      const sx = lerp(9 / LW, 1, p), sy = lerp(9 / LH, 1, p);
      let glow = 0; lines.forEach((l) => { if (l.i === i) glow = Math.max(glow, ease.enter(clamp((t - C.links[l.k] - 0.1) / 0.35))); });
      const dim = ease.inOutCubic(clamp((t - C.recede) / 0.5));
      if (!show(c.root, t >= C.chips - 0.02)) return;
      st(c.root, { transform: tf({ x, y, sx, sy }), 'transform-origin': '0 0', opacity: (0.42 + 0.58 * glow) * (1 - dim) });
      st(c.num, { opacity: clamp((p - 0.6) / 0.35) }); st(c.name, { opacity: clamp((p - 0.6) / 0.35) });
    });
    // ---------- headline + the rolling rule (progress ticks and counter)
    const h1a = clamp((t - C.recede) / 0.4);
    head1.render(t, C.lead, C.recede, { exit: 'up' });
    const ra = clamp((t - C.rules[0] + 0.15) / 0.2) * (1 - clamp((t - C.recede) / 0.35)), rin = ease.enter(clamp((t - C.rules[0] + 0.2) / 0.5));
    roll.render(t, C.rules.slice(1), { x: 80, y: 392 + (1 - rin) * 40, a: ra });
    const reached = C.rules.filter((x) => t >= x - 0.05).length;
    ticks.forEach((k, i) => st(k, { transform: tf({ x: 82 + i * 58, y: 538 }), background: i < reached ? '#5B8CFF' : 'rgba(255,255,255,.18)', opacity: ra, display: ra > 0 ? '' : 'none' }));
    txt(count, `${String(Math.max(1, reached)).padStart(2, '0')} / 05`);
    st(count, { transform: tf({ x: 82 + 5 * 58 + 18, y: 530 }), opacity: ra, display: ra > 0 ? '' : 'none' });
    // ---------- rule chips on the right and the curves to their steps
    rchips.forEach((c, k) => {
      const p = ease.outBack(clamp((t - C.rules[k]) / 0.45), 1.6);
      st(c, { transform: tf({ x: RX, y: RY(k), s: 0.84 + 0.16 * p }), opacity: clamp(p * 2), display: p > 0 ? '' : 'none' });
    });
    slots.forEach((g, k) => {
      const p = ease.enter(clamp((t - C.slots - k * 0.09) / 0.45)), fill = clamp((t - C.rules[k]) / 0.25);
      st(g, { transform: tf({ x: RX + (1 - p) * 24, y: RY(k) }), opacity: p * (1 - fill), display: p > 0 && fill < 1 ? '' : 'none' });
    });
    lines.forEach((l, j) => {
      const q = ease.outCubic(clamp((t - C.links[l.k] - 0.1 - (LINKS[l.k].indexOf(l.i)) * 0.12) / 0.5));
      attr(l.p, { 'stroke-dashoffset': (1 - q).toFixed(4), opacity: q > 0 ? 1 : 0 });
    });
    // the whole diagram steps back when the last line is said
    const rec = ease.inOutCubic(clamp((t - C.recede) / 0.55));
    st(dia, { transform: tf({ s: 1 - 0.08 * rec }), 'transform-origin': '540px 1010px', opacity: 1 - rec, filter: gblur(rec * 9), display: rec >= 1 ? 'none' : '' });
    // ---------- the statement + the phone playing the real end of the first video
    head2.render(t, C.head2, C.push - 0.1, { exit: 'blur', stagger: 0.07 });
    const pin = ease.outBack(clamp((t - C.phone) / 0.7), 1.2), po = clamp((t - C.phone) / 0.35);
    if (show(phone, po > 0)) {
      st(phone, { transform: tf({ x: PHONE.x - PHONE.bez, y: PHONE.y - PHONE.bez + (1 - pin) * 420 }), opacity: po });
      clip.render('hp', Math.max(0, t - C.clip));
    }
  },
};
