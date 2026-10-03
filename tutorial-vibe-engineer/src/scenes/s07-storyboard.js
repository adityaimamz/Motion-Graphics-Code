// S7 · 03 Storyboard — card A of S6 becomes the TREATMENT.md page. A short prompt is sent and the page's real scene
// headings scroll past in a blur (TypingMind's fast roll), stopping on the real S8 block of the first video; its lines
// light up in turn (waktu → teks → posisi teks → bunyi) while that scene's real clip plays beside it as the finished
// result. VO 10. Exit: the clip shrinks into the first thumbnail of S8's timeline.
import { el, svgEl, st, tf, gblur, show, html, txt } from '../dom.js';
import { clamp, ease, lerp, typed } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { makeCard } from '../ui/card.js';
import { ClipView } from '../ui/clip.js';
import { DOC, CLIP7, thumbRect } from '../ui/geo.js';
import { DOCK } from '../ui/prompt.js';
import { A } from '../artefak.js';
import { CONTEXT_CHIPS } from './s05-aturan.js';

import { PROMPT_STORYBOARD } from '../naskah.js';
const PROMPT7 = PROMPT_STORYBOARD;
const RH = 58, N = A.treatmentHeads.length, TARGET = N + 7;       // list is doubled so the roll is long; it lands on S8
const VIEW_H = DOC.h - 76, LAND = 130;                             // viewport height; where the S8 row rests
const OFF1 = TARGET * RH - LAND;
const BLK = [
  ['WAKTU', '44,2 – 50,2 · close-up ×16'],
  ['TEKS', '① BACA DULU'],
  ['POSISI', 'jendela “kode dari AI”'],
  ['BUNYI', '“ting”: mata terbuka'],
];
const BR = 64, BLK_H = BR * 4 + 22;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

let root, head, ghosts = [], doc, view, rows = [], blk, brows = [], miniBox, wave, clipCard, clipV, clipLab, kids = [];

export default {
  id: 'storyboard', layer: 'world', pre: 0.3, post: 0.3,
  init({ world }) {
    root = el('div', 'layer', world);
    head = new Headline(root, { x: 80, y: 340, kicker: '03 · STORYBOARD', kickerDot: CHAPTERS[3].dot, lines: [[['Tulis '], ['tiap ', 'accent serif'], ['detiknya.']]], seed: 9 });
    for (let i = 0; i < 2; i++) { const g = el('div', 'card', root); st(g, { left: '0px', top: '0px', width: `${DOC.w}px`, height: `${DOC.h}px`, 'border-radius': '28px', background: '#FBFBFD' }); ghosts.push(g); }
    doc = makeCard(root, { w: DOC.w, h: DOC.h, title: 'TREATMENT.md', sub: 'vibe-engineer' });
    st(doc.root, { left: '0px', top: '0px' });
    view = el('div', 'abs', doc.body); st(view, { left: '0px', top: '0px', right: '0px', bottom: '0px', overflow: 'hidden' });
    const heads = [...A.treatmentHeads, ...A.treatmentHeads];
    heads.forEach((h, i) => {
      const [id, name, ...rest] = h.split(' · ');
      const n = el('div', 'abs', view);
      html(n, `<b style="color:#0E1116;font-weight:700">${esc(id)} · ${esc(name)}</b><span style="color:#9AA0AB"> · ${esc(rest.join(' · '))}</span>`);
      st(n, { left: '26px', top: '0px', width: `${DOC.w - 52}px`, font: '500 19px/58px JB', 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis' });
      rows.push(n);
    });
    // the expanded S8 block (under the S8 heading, which is row TARGET)
    blk = el('div', 'abs', view); st(blk, { left: '16px', top: '0px', width: `${DOC.w - 32}px`, overflow: 'hidden', background: '#F6F2FE', 'border-radius': '18px' });
    BLK.forEach(([lab, val], j) => {
      const r = el('div', 'abs', blk); st(r, { left: '0px', top: `${11 + j * BR}px`, width: '100%', height: `${BR}px` });
      const l = el('div', 'abs', r, lab); st(l, { left: '22px', top: '0px', font: '600 16px/64px JB', 'letter-spacing': '.12em', color: '#9AA0AB' });
      const v = el('div', 'abs', r, val); st(v, { left: '116px', top: '0px', font: '500 19px/64px JB', color: '#2B313B', 'white-space': 'nowrap' });
      brows.push({ r, l, v });
      if (j === 2) { miniBox = el('div', 'abs', r); st(miniBox, { left: 'auto', right: '22px', top: '8px', width: '30px', height: '48px', border: '2px solid #7C5CE0', 'border-radius': '5px' }); const k = el('i', '', miniBox); st(k, { position: 'absolute', right: '3px', top: '8px', width: '13px', height: '19px', background: '#7C5CE0', 'border-radius': '3px', display: 'block' }); }
      if (j === 3) { wave = svgEl('svg', { viewBox: '0 0 40 24', width: 40, height: 24, style: 'position:absolute;right:24px;top:20px' }, r); [4, 10, 16, 8, 14, 6, 11].forEach((h, k) => svgEl('rect', { x: 2 + k * 5.4, y: 12 - h / 2, width: 3, height: h, rx: 1.5, fill: '#7C5CE0' }, wave)); }
    });
    // result clip
    clipCard = el('div', 'card', root); st(clipCard, { left: '0px', top: '0px', width: `${CLIP7.w}px`, height: `${CLIP7.h}px`, 'border-radius': '26px', 'transform-origin': '0 0' });
    clipV = new ClipView(clipCard);
    clipLab = el('div', 'chip abs', root, 'hasil jadi · video kemarin'); st(clipLab, { left: '0px', top: '0px' });
  },
  render(t) {
    const C = CUE.storyboard, s = S.storyboard;
    if (!show(root, t >= s.t0 - 0.35 && t < S.kunci.t0 + 0.3)) return;
    head.render(t, C.head, C.exit, { exit: 'up' });
    // the page: arrives from S6's card A (same rectangle), then everything on it is driven below
    const din = clamp((t - (s.t0 - 0.3)) / 0.28), out = ease.inCubic(clamp((t - C.exit) / 0.45));
    ghosts.forEach((g, i) => st(g, { transform: tf({ x: DOC.x + (i + 1) * 14 * ease.outCubic(clamp((t - s.t0) / 0.5)), y: DOC.y + (i + 1) * 12 * ease.outCubic(clamp((t - s.t0) / 0.5)), r: (i ? -1.6 : 1.4) * ease.outCubic(clamp((t - s.t0) / 0.5)) }), opacity: din * (1 - out) * 0.9, 'transform-origin': '0 0' }));
    st(doc.root, { transform: tf({ x: DOC.x, y: DOC.y }), opacity: din * (1 - out), filter: gblur(out * 10) });
    // scroll: a fast roll that eases to a stop on S8, then the S8 block opens
    const sc = ease.inOutCubic(clamp((t - C.scroll[0]) / (C.scroll[1] - C.scroll[0])));
    const off = OFF1 * sc, speed = t > C.scroll[0] && t < C.scroll[1] ? Math.sin(Math.PI * clamp((t - C.scroll[0]) / (C.scroll[1] - C.scroll[0]))) : 0;
    const ex = ease.outExpo(clamp((t - C.expand) / 0.6)), EXP = (BLK_H + 8) * ex;
    rows.forEach((n, i) => {
      const y = i * RH - off + (i > TARGET ? EXP : 0);
      const vis = y > -RH && y < VIEW_H;
      if (!show(n, vis)) return;
      const hot = i === TARGET;
      st(n, { transform: tf({ y }), filter: gblur(speed * 5), opacity: hot ? 1 : 1 - 0.35 * ex, color: '#0E1116', background: hot ? '#F6F2FE' : 'transparent' });
    });
    st(blk, { transform: tf({ y: TARGET * RH - off + RH }), height: `${BLK_H * ex}px`, opacity: clamp(ex * 2), display: ex > 0 ? '' : 'none' });
    brows.forEach(({ r, l, v }, j) => {
      const p = ease.enter(clamp((t - C.rowsOn[j]) / 0.4)), a = 0.38 + 0.62 * p;
      st(r, { opacity: a, transform: tf({ x: (1 - p) * -8 }), background: p > 0 ? `rgba(124,92,224,${(0.1 * Math.sin(Math.PI * clamp((t - C.rowsOn[j]) / 1.3))).toFixed(3)})` : 'transparent' });
      st(l, { color: p > 0.5 ? '#7C5CE0' : '#9AA0AB' });
    });
    // the finished clip, looping, beside the page; at the exit it shrinks into S8's first thumbnail
    const cin = ease.ui(clamp((t - C.clip) / 0.7)), m = ease.move(clamp((t - C.exit) / 0.65)), th = thumbRect(3);
    if (show(clipCard, cin > 0.001)) {
      const w = lerp(CLIP7.w, th.w, m), h = lerp(CLIP7.h, th.h, m);
      st(clipCard, { width: `${w}px`, height: `${h}px`, transform: `perspective(1700px) ${tf({ x: lerp(CLIP7.x, th.x, m), y: lerp(CLIP7.y, th.y, m) + (1 - cin) * 60, rx: (1 - cin) * 12, s: 0.94 + 0.06 * cin })}`,
        opacity: clamp(cin * 2.2) * (1 - clamp((t - S.kunci.t0 - 0.2) / 0.3)), 'border-radius': `${lerp(26, 8, m)}px`, filter: gblur((1 - cin) * 6) });
      clipV.render('s7-baca', t - C.clip, true);
    }
    const ln = ease.enter(clamp((t - C.clip - 0.25) / 0.5));
    st(clipLab, { transform: tf({ x: CLIP7.x + 8, y: CLIP7.y + CLIP7.h + 24 + (1 - ln) * 10 }), opacity: ln * (1 - out), display: ln > 0 && out < 1 ? '' : 'none' });
  },
  dock(t) {
    const C = CUE.storyboard;
    if (t < S.storyboard.t0 - 0.35 || t > S.kunci.t0 + 0.2) return null;
    return { t0: -99, text: PROMPT7, typeAt: C.typeAt, cps: 34, send: C.send, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS(), caret: true };
  },
};
