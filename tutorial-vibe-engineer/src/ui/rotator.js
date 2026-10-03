// rotator.js — the slot roll of both references: the old word rolls up and out, the new one rolls in from below,
// with a strong vertical blur mid-roll (±0.3 s). As a pill: the width follows the new word on a spring (slight
// overshoot) and the colour crossfades (TypingMind "Chat with [GPT-5 → … → every model.]").
import { el, st, tf, dblur, show } from '../dom.js';
import { clamp, ease, spring, mix, css, lerp } from '../core.js';

export class Roller {
  // items: [{ text, bg?, fg? }]; o: { font, size, padX, height, pill, radius, fg }
  constructor(parent, items, o) {
    this.o = { padX: 0, pill: false, height: o.size * 1.3, fg: '#0E1116', dur: 0.3, ...o };
    this.items = items;
    this.root = el('div', 'abs', parent);
    this.bg = el('div', 'abs', this.root);
    this.clip = el('div', 'abs', this.root);
    st(this.clip, { overflow: 'hidden', height: `${this.o.height}px` });
    this.words = items.map((it) => {
      const w = el('div', 'abs', this.clip, it.text);
      st(w, { font: this.o.font, 'white-space': 'pre', color: it.fg ?? this.o.fg, 'line-height': `${this.o.height}px`, ...(this.o.letter ? { 'letter-spacing': this.o.letter } : {}) });
      return w;
    });
    this.widths = null;
  }
  measure() {
    if (!this.widths) this.widths = this.words.map((w) => w.offsetWidth + this.o.padX * 2);
    return this.widths;
  }
  // swaps: times at which item i → i+1. Returns the current (spring) width.
  state(t, swaps) {
    const W = this.measure();
    let i = 0; while (i < swaps.length && t >= swaps[i]) i++;
    const ts = i > 0 ? swaps[i - 1] : -Infinity, p = clamp((t - ts) / this.o.dur);
    const prev = Math.max(0, i - 1);
    const w = i === 0 ? W[0] : lerp(W[prev], W[i], spring(t - ts, 2.3, 0.58));
    return { i, prev, p, w, ts };
  }
  render(t, swaps, { x, y, a = 1, grow = 1 }) {
    if (!show(this.root, a > 0.001)) return 0;
    const { i, prev, p, w } = this.state(t, swaps), H = this.o.height;
    const e = ease.inOutCubic(p), rolling = i > 0 && p < 1;
    const ww = w * grow;
    st(this.root, { transform: tf({ x, y }), opacity: a });
    st(this.clip, { width: `${ww}px`, left: '0px', top: '0px', 'border-radius': this.o.pill ? `${H / 2}px` : '0px' });
    if (this.o.pill) {
      const c0 = this.items[prev].bg, c1 = this.items[i].bg, col = rolling ? mix(c0, c1, e) : c1;
      st(this.bg, { width: `${ww}px`, height: `${H}px`, 'border-radius': `${H / 2}px`, background: css(col), 'box-shadow': `0 18px 40px ${css(col, 0.28)}` });
    }
    this.words.forEach((wd, k) => {
      let y = H * 1.1, o = 0, b = 0;
      if (k === i) { y = rolling ? (1 - e) * H * 1.05 : 0; o = 1; b = rolling ? Math.sin(Math.PI * p) * 16 : 0; }
      else if (k === prev && rolling) { y = -e * H * 1.05; o = 1; b = Math.sin(Math.PI * p) * 16; }
      const cx = (ww - (this.widths[k] - this.o.padX * 2)) / 2;
      st(wd, { display: o ? '' : 'none', transform: tf({ x: this.o.pill ? cx : 0, y }), filter: dblur(0, b) });
    });
    return ww;
  }
}
