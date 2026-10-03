// S1 · komentar — on black, exactly like TikTok's "reply to comment" sticker. The cursor selects the comment, drags
// the words into the Claude Code dock, sends; a light iris opens from the send button into the bright world
// (Notion 5–6.4 s). VO 01: "Ada yang minta tutorialnya. Oke, aku bongkar semua."
import { el, st, tf, gblur, show, html } from '../dom.js';
import { clamp, ease, lerp } from '../core.js';
import { S, CUE } from '../timeline.js';
import { path } from '../ui/cursor.js';
import { DOCK, sendCenter } from '../ui/prompt.js';

const MSG = ['wihhh bagus bang.', 'buat tutorial nya bang'];
const FULL = MSG.join(' ');
const B = { x: 110, y: 600, w: 820 }; // bubble box (stage px), right edge inside the 150 px TikTok margin

let root, bub, msg, words = [], sel = [], marks = [], flyer, sent, geo = null;
const ASK = [2, 3, 4, 5]; // 'buat tutorial nya bang' — the request, marked when the VO says it

export default {
  id: 'komentar', layer: 'top', pre: 0, post: 0.9,
  init({ top }) {
    root = el('div', 'layer', top);
    bub = el('div', 'tk', root);
    el('div', 'av', bub, 'F');
    const col = el('div', '', bub);
    el('div', 'who', col, 'Balas komentar frenius_17');
    msg = el('div', 'msg', col);
    MSG.forEach((line, i) => {
      line.split(' ').forEach((w, j, arr) => { words.push(el('span', '', msg, w + (j < arr.length - 1 ? ' ' : ''))); });
      if (i === 0) el('br', '', msg);
    });
    el('div', 'tail', bub);
    st(bub, { left: `${B.x}px`, top: `${B.y}px`, width: `${B.w}px`, 'transform-origin': '12% 100%' });
    marks = ASK.map(() => el('div', 'abs', root));
    marks.forEach((m) => st(m, { background: '#FFE27A', 'border-radius': '6px', 'mix-blend-mode': 'multiply' }));
    sel = words.map(() => el('div', 'selbox', root));
    // the dragged words: a white chip with the selection tint, so it reads on black
    flyer = el('div', 'abs', root);
    st(flyer, { font: '750 54px/1.22 IN', color: '#111', 'letter-spacing': '-0.012em', 'white-space': 'pre', 'transform-origin': '0 0',
      background: 'linear-gradient(rgba(47,107,255,.16), rgba(47,107,255,.16)), #fff', padding: '14px 22px', 'border-radius': '20px', 'box-shadow': '0 26px 60px rgba(0,0,0,.5)' });
    html(flyer, MSG.join('\n'));
    sent = el('div', 'pill', root);
    st(sent, { background: '#2F6BFF', color: '#fff', font: '600 28px/1 IN', padding: '22px 30px', 'box-shadow': '0 14px 34px rgba(47,107,255,.35)' });
    sent.textContent = FULL;
  },
  // word rectangles relative to the stage, measured once (fonts are loaded before init)
  measure() {
    if (geo) return geo;
    // offsets are relative to the bubble (the positioned ancestor); transforms do not change them
    const mx = B.x + msg.offsetLeft, my = B.y + msg.offsetTop;
    geo = { msg: { x: mx, y: my }, words: words.map((w) => ({ x: B.x + w.offsetLeft, y: B.y + w.offsetTop, w: w.offsetWidth, h: w.offsetHeight })), bubbleH: bub.offsetHeight, sentW: sent.offsetWidth };
    return geo;
  },
  render(t) {
    const C = CUE.komentar, g = this.measure();
    if (!show(root, t < S.komentar.t1 + 0.9)) return;
    // the bubble: pop in, then deflate as its words leave
    const pin = clamp((t - C.bubble) / 0.5), pop = ease.outBack(pin, 1.7);
    const leave = ease.outCubic(clamp((t - C.fly[0]) / 0.32));
    st(bub, { transform: tf({ s: (0.6 + 0.4 * pop) * (1 - 0.3 * leave), y: (1 - pin) * 30 + leave * 40 }), opacity: clamp(pin * 2.5) * (1 - leave), filter: gblur(leave * 12) });
    st(msg, { opacity: t < C.fly[0] ? 1 : 0 });
    // the request gets a marker sweep while the VO says "minta tutorialnya", then gives way to the selection
    ASK.forEach((wi, j) => {
      const r = g.words[wi], k = ease.outCubic(clamp((t - (C.marker + j * 0.09)) / 0.18)), off = 1 - clamp((t - C.select[0]) / 0.2);
      st(marks[j], { display: k > 0 && off > 0 ? '' : 'none', left: `${r.x - 3}px`, top: `${r.y + r.h * 0.52}px`, width: `${(r.w + 4) * k}px`, height: `${r.h * 0.4}px`, opacity: off * clamp(pin * 2.5) });
    });
    // selection: word by word, following the cursor
    const n = words.length;
    g.words.forEach((r, i) => {
      const k = clamp((t - (C.select[0] + (i / n) * (C.select[1] - C.select[0]))) / 0.08);
      const on = t >= C.select[0] && t < C.fly[0];
      st(sel[i], { display: on && k > 0 ? '' : 'none', left: `${r.x - 3}px`, top: `${r.y + 2}px`, width: `${(r.w + 6) * k}px`, height: `${r.h - 2}px` });
    });
    // the flyer: the selected text, dragged along an arc into the dock
    const f = clamp((t - C.fly[0]) / (C.fly[1] - C.fly[0])), fe = ease.move(f);
    if (show(flyer, t >= C.fly[0] && t < C.fly[1] + 0.12)) {
      const x0 = g.msg.x - 22, y0 = g.msg.y - 14, x1 = DOCK.x + 24, y1 = DOCK.y + 18, sc = lerp(1, 0.56, fe);
      const arc = Math.sin(Math.PI * fe) * -150;
      const fadeOut = clamp((t - C.fly[1] + 0.12) / 0.2);
      st(flyer, { transform: tf({ x: lerp(x0, x1, fe), y: lerp(y0, y1, fe) + arc, s: sc, r: Math.sin(Math.PI * fe) * -5 }), opacity: 1 - fadeOut, filter: gblur(fadeOut * 6) });
    }
    // after sending: the message flies up into a blue "sent" pill on the right (TypingMind 4.5 s)
    if (show(sent, t >= C.sent[0] && t < S.kode.t0 + 0.7)) {
      const p = ease.ui(clamp((t - C.sent[0]) / 0.6)), out = ease.inCubic(clamp((t - (S.kode.t0 + 0.25)) / 0.42));
      const xEnd = 930 - g.sentW, yEnd = 300, xs = DOCK.x + 24, ys = DOCK.y + 16;
      st(sent, { left: '0px', top: '0px', transform: tf({ x: lerp(xs, xEnd, p), y: lerp(ys, yEnd, p) - out * 60, s: lerp(0.8, 1, p) }), opacity: clamp(p * 3) * (1 - out), filter: gblur(Math.sin(Math.PI * clamp(p * 1.2)) * 3 + out * 8) });
    }
  },
  dock(t) {
    const C = CUE.komentar;
    if (t < C.dockIn || t > S.kode.t0 + 0.5) return null;
    return { t0: C.dockIn, t1: S.kode.t0, text: FULL, typeAt: C.land - 0.04, cps: 260, send: C.send, placeholder: 'Tanya Claude Code…' };
  },
  cursor(t) {
    const C = CUE.komentar, g = this.measure();
    if (t < C.cursorIn || t > C.send + 0.7) return null;
    const w0 = g.words[0], wl = g.words[g.words.length - 1];
    const { x: sx, y: sy } = sendCenter();
    // in from the lower right → start of the comment → drag across it → carry the words down → the send button
    const p = path(t, [
      [C.cursorIn, 980, 1500], [C.select[0], w0.x - 4, w0.y + w0.h * 0.6, ease.ui],
      [C.select[1], wl.x + wl.w, wl.y + wl.h * 0.6, ease.inOutCubic],
      [C.fly[0] + 0.02, wl.x + wl.w - 30, wl.y + wl.h * 0.5],
      [C.fly[1], DOCK.x + 330, DOCK.y + 66, ease.move],
      [C.send - 0.06, sx, sy, ease.ui],
    ]);
    const a = clamp((t - C.cursorIn) / 0.25) * (1 - clamp((t - C.send - 0.35) / 0.3));
    return { x: p.x, y: p.y, a, click: t >= C.select[0] && t < C.select[0] + 0.3 ? C.select[0] : t >= C.send - 0.02 ? C.send : null };
  },
  // the light world, revealed by the iris from the send button
  iris(t) {
    const C = CUE.komentar;
    if (t >= C.iris[1]) return null;
    const p = ease.inOutCubic(clamp((t - C.iris[0]) / (C.iris[1] - C.iris[0])));
    return { ...sendCenter(), r: p * 2300 };
  },
};
