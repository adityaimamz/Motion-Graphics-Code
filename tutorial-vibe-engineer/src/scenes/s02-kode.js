// S2 · kode — "Nol [keyframe.]" → "Nol [After Effects.]" → "100% [kode.]" as a slot roll in a pill with a live
// Figma selection (TypingMind 1–3.3 s); the real video as a card that flips to its own code; three stat tiles count
// up (Notion 39–43 s). VO 02.
import { el, st, tf, gblur, show, txt, html, svgEl } from '../dom.js';
import { clamp, ease, lerp, fq, spring } from '../core.js';
import { S, CUE, BEAT } from '../timeline.js';
import { Roller } from '../ui/rotator.js';
import { Select } from '../ui/select.js';
import { ClipView } from '../ui/clip.js';
import { A } from '../artefak.js';

const SIZE = 112, H = 148, X = 80, Y1 = 330, Y2 = Y1 + H + 18;
const CARD = { x: 334, y: 700, w: 412, h: 690 };
const WIDE = { w: 880, h: 560, y: 716 }; // after the flip the code card widens into an editor window
const TILES = [
  { to: 4246, fmt: 'n', lab: 'baris kode' },
  { to: 0, fmt: 'n', lab: 'gambar dari luar' },
  { to: 100, fmt: '%', lab: 'musik & suara dari kode' },
];
const TY = 1404, TW = 270, TH = 162, TG = 20;
const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const hi = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/(\/\/.*)$/g, '<span class="c">$1</span>')
  .replace(/\b(import|export|from|const|let|function|return|if|for|of|new)\b/g, '<span class="k">$1</span>')
  .replace(/('[^']*')/g, '<span class="s">$1</span>');

// the card is the first video, playing: a reel of real clips cut on the beat (timeline CUE.kode.reel)
let root, kick, left, pill, select, card, flip, front, back, code, gutter, path, chips, player, bar, tiles = [];

export default {
  id: 'kode', layer: 'world', pre: 0.2, post: 0.2,
  init({ world }) {
    root = el('div', 'layer', world);
    kick = el('div', 'kicker', root); st(kick, { left: `${X + 2}px`, top: `${Y1 - 56}px` });
    const d = el('i', 'dot', kick); el('span', '', kick, 'VIDEO KEMARIN · 42RB VIEWS');
    left = new Roller(root, [{ text: 'Nol' }, { text: '100%' }], { font: `680 ${SIZE}px/1 IT`, size: SIZE, height: H, letter: '-0.04em' });
    pill = new Roller(root, [
      { text: 'keyframe.', bg: '#E5674F', fg: '#fff' },
      { text: 'After Effects.', bg: '#5B3FD0', fg: '#fff' },
      { text: 'kode.', bg: '#2F6BFF', fg: '#fff' },
    ], { font: `640 ${SIZE - 8}px/1 IT`, size: SIZE, height: H, padX: 40, pill: true, letter: '-0.035em' });
    select = new Select(root);
    // the card: front = the real video, back = its real code
    card = el('div', 'abs', root); st(card, { left: `${CARD.x}px`, top: `${CARD.y}px`, width: `${CARD.w}px`, height: `${CARD.h}px`, perspective: '1600px' });
    flip = el('div', 'abs', card); st(flip, { width: '100%', height: '100%', 'transform-style': 'preserve-3d' });
    front = el('div', 'card', flip); st(front, { inset: '0', 'backface-visibility': 'hidden' });
    player = new ClipView(front);
    const track = el('div', 'abs', front); st(track, { left: '0px', top: `${CARD.h - 6}px`, width: '100%', height: '6px', background: 'rgba(255,255,255,.25)' });
    bar = el('div', 'abs', track); st(bar, { left: '0px', top: '0px', height: '6px', background: '#fff' });
    chips = el('div', 'abs', front); st(chips, { left: '18px', top: `${CARD.h - 66}px`, display: 'flex', gap: '10px' });
    for (const [icon, label] of [['M8 5v14l11-7z', '42rb'], ['M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.3 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21z', '4.900']]) {
      const c = el('div', '', chips); st(c, { display: 'flex', 'align-items': 'center', gap: '7px', background: 'rgba(0,0,0,.58)', color: '#fff', font: '600 22px/1 IN', padding: '9px 14px 9px 10px', 'border-radius': '999px' });
      const s = svgEl('svg', { viewBox: '0 0 24 24', width: 18, height: 18 }, c); svgEl('path', { d: icon, fill: '#fff' }, s);
      el('span', '', c, label);
    }
    back = el('div', 'card', flip); st(back, { inset: '0', 'backface-visibility': 'hidden', transform: 'rotateY(180deg)' });
    const hd = el('div', 'hdr', back); st(hd, { height: '62px', 'font-size': '22px', padding: '0 20px', gap: '12px' });
    const lights = el('div', 'lights', hd); for (let i = 0; i < 3; i++) el('i', '', lights);
    const tab = el('span', 'mono', hd, 'film.js'); st(tab, { background: '#F1F3F7', padding: '7px 12px', 'border-radius': '8px' });
    path = el('span', 'mono', hd, 'vibe-engineer/src'); st(path, { color: '#9AA0AB', 'font-size': '19px', 'white-space': 'nowrap' });
    const view = el('div', 'abs', back); st(view, { left: '0px', top: '62px', right: '0px', bottom: '0px', overflow: 'hidden' });
    const lines = A.film.split('\n');
    gutter = el('div', 'code', view); st(gutter, { position: 'absolute', left: '0px', top: '16px', 'text-align': 'right', color: '#C3C8D1', width: '0px', overflow: 'hidden', 'line-height': '1.62' });
    html(gutter, lines.map((_, i) => String(i + 1)).join('\n'));
    code = el('div', 'code', view); st(code, { position: 'absolute', left: '20px', top: '16px', 'font-size': '17px', 'line-height': '1.62' });
    html(code, lines.map(hi).join('\n'));
    tiles = TILES.map((d) => {
      const n = el('div', 'tile', root); st(n, { left: '0px', top: '0px', width: `${TW}px`, height: `${TH}px` });
      const num = el('div', 'num', n); const lab = el('div', 'lab', n, d.lab);
      return { n, num, lab, d };
    });
  },
  render(t) {
    const C = CUE.kode, s = S.kode;
    if (!show(root, t >= s.t0 - 0.2 && t < s.t1 + 0.2)) return;
    // a slow camera push through the beat (both references never hold a frame dead still)
    const push = ease.inOutCubic(clamp((t - s.t0) / s.len));
    st(root, { transform: tf({ s: 1 + 0.025 * push }), 'transform-origin': '540px 900px' });
    const out = ease.inCubic(clamp((t - C.exit) / 0.5));
    // kicker + headline rows (rise from behind a mask, then roll)
    const k = ease.enter(clamp((t - (S.kode.t0 + 0.72)) / 0.55)); // after the sent pill has left
    st(kick, { opacity: k * (1 - out), transform: tf({ x: (1 - k) * -14, y: -out * 30 }), filter: gblur(out * 10) });
    const r1 = ease.enter(clamp((t - C.head) / 0.62)), r2 = ease.enter(clamp((t - C.pill) / 0.62));
    const lw = left.render(t, [C.swap2], { x: X, y: Y1 + (1 - r1) * 70 - out * 40, a: clamp(r1 * 1.8) * (1 - out) });
    st(left.root, { filter: gblur((1 - r1) * 9 + out * 12) });
    const grow = 0.2 + 0.8 * ease.outBack(clamp((t - C.pill) / 0.5), 1.4);
    const pw = pill.render(t, [C.swap1, C.swap2], { x: X, y: Y2 + (1 - r2) * 40 - out * 40, a: clamp(r2 * 2) * (1 - out), grow });
    st(pill.root, { filter: gblur((1 - r2) * 8 + out * 12) });
    // the selection follows the pill (its label is the pill's live size)
    const selA = clamp((t - C.pill - 0.25) / 0.2) * (1 - clamp((t - C.count[0]) / 0.4));
    select.render({ x: X, y: Y2 + (1 - r2) * 40, w: pw, h: H }, selA);
    // the video card: rises, flips to its code on "kode", leans back while the numbers count
    const cin = ease.ui(clamp((t - C.card) / 0.8));
    const fl = ease.inOutCubic(clamp((t - C.flip) / 0.7));
    const fall = ease.inCubic(clamp((t - C.exit) / 0.55));
    // after the flip: the card widens into an editor window (width on a spring with a little overshoot, like the pill)
    const ws = spring(t - C.widen, 1.8, 0.64), wh = ease.move(clamp((t - C.widen) / 0.7));
    const cw = lerp(CARD.w, WIDE.w, ws), ch = lerp(CARD.h, WIDE.h, wh), cy = lerp(CARD.y, WIDE.y, wh);
    st(card, { left: `${(540 - cw / 2).toFixed(2)}px`, top: `${cy.toFixed(2)}px`, width: `${cw.toFixed(2)}px`, height: `${ch.toFixed(2)}px`,
      transform: tf({ y: (1 - cin) * 120 + fall * 80, rx: (1 - cin) * 14, s: 0.94 + 0.06 * cin - 0.08 * fall }), opacity: clamp(cin * 1.6) * (1 - fall), filter: gblur(fall * 12) });
    st(flip, { transform: `rotateY(${(fl * 180).toFixed(2)}deg) rotateZ(${(-2.5 * cin + 2.5 * fl).toFixed(2)}deg)` });
    // the editor's details arrive with the width: line numbers, the path, a larger font
    const fs = lerp(17, 22, wh), gw = lerp(0, 46, wh), scroll = -Math.max(0, fq(t) - C.flip - 0.5) * 22;
    st(gutter, { width: `${gw.toFixed(2)}px`, 'font-size': `${fs.toFixed(2)}px`, opacity: wh, transform: tf({ y: scroll }) });
    st(code, { left: `${(20 + gw + 12 * wh).toFixed(2)}px`, 'font-size': `${fs.toFixed(2)}px`, transform: tf({ y: scroll }) });
    st(path, { opacity: clamp((t - C.widen - 0.25) / 0.4), display: wh > 0.05 ? '' : 'none' });
    // playback: the reel, hard cuts on the beat like the video itself; the progress bar runs along the bottom
    let r = C.reel[0];
    for (const x of C.reel) if (t >= x[1]) r = x;
    player.render(r[0], t - r[1]);
    const last = C.reel[C.reel.length - 1];
    st(bar, { width: `${(clamp((t - C.card) / (last[2] - C.card)) * 100).toFixed(2)}%` });
    // stat tiles: stagger in, count up, then collapse into the HUD rail
    tiles.forEach(({ n, num, d }, i) => {
      const ti = C.tiles[i], p = ease.enter(clamp((t - ti) / 0.6));
      const c = ease.outCubic(clamp((fq(t) - C.count[0] - i * 0.12) / 1.45));
      const v = Math.round(d.to * c);
      txt(num, d.fmt === '%' ? `${v}%` : dots(v));
      const x0 = X + i * (TW + TG), y0 = TY, gx = 958 - x0 - TW / 2, gy = 100 - y0 - TH / 2;
      const q = ease.inCubic(clamp((t - (C.exit + i * 0.05)) / 0.5));
      st(n, { transform: tf({ x: x0 + gx * q, y: y0 + (1 - p) * 50 + gy * q, s: (0.92 + 0.08 * p) * (1 - 0.95 * q) }), opacity: clamp(p * 2) * (1 - clamp(q * 1.3 - 0.3)), filter: gblur((1 - p) * 8 + q * 6) });
    });
  },
};
