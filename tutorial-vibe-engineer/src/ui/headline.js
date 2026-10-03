// headline.js — the headline + kicker of a beat. Enter: words rise from behind a mask with a blur-in, staggered
// (both references). Exit: letters fall and tumble one by one with blur (TypingMind 3.3 s), or the block lifts away.
import { el, st, tf, gblur, show } from '../dom.js';
import { clamp, ease, hash } from '../core.js';

export class Headline {
  // lines: [[ [text, cls?], ... ], ...]  cls: 'accent' | 'serif' | 'accent serif' | ''
  constructor(parent, { x = 80, y = 350, size = 96, weight = 640, kicker = null, kickerDot = '#2F6BFF', kickerY = -62, lines, color = null, seed = 1, align = 'left', width = 0 }) {
    this.size = size; this.seed = seed;
    this.root = el('div', 'abs', parent);
    st(this.root, { transform: tf({ x, y }), display: 'none' });
    if (kicker) {
      this.kick = el('div', 'kicker', this.root);
      st(this.kick, { top: `${kickerY}px`, left: '2px' });
      const d = el('i', 'dot', this.kick); st(d, { background: kickerDot });
      el('span', '', this.kick, kicker);
    }
    this.head = el('div', 'head', this.root);
    st(this.head, { 'font-size': `${size}px`, 'font-weight': String(weight), ...(color ? { color } : {}), ...(align === 'center' ? { 'text-align': 'center', width: `${width}px`, left: '0px' } : {}) });
    this.lines = []; this.words = []; this.chars = [];
    for (const segs of lines) {
      const ln = el('span', 'ln', this.head);
      this.lines.push(ln);
      for (const [text, cls = ''] of segs) {
        const parts = text.match(/\S+\s*/g) ?? [];
        for (const p of parts) {
          const w = el('span', `w ${cls}`, ln);
          this.words.push(w);
          for (const ch of p) { const c = el('span', 'c', w, ch); this.chars.push(c); }
        }
      }
    }
  }
  // tIn: first word starts; tOut: exit starts (Infinity = stays). exit: 'tumble' | 'up' | 'fade' | 'blur'
  render(t, tIn, tOut = Infinity, { exit = 'tumble', stagger = 0.055, dur = 0.62, dy = 0, dx = 0, scale = 1, alpha = 1, blur = 0 } = {}) {
    const exitDur = exit === 'tumble' ? 0.5 + this.chars.length * 0.012 : 0.42;
    if (!show(this.root, t >= tIn - 0.25 && t < tOut + exitDur)) return;
    const S = this.size;
    // the block itself (layout shifts, depth of field)
    let bo = alpha, by = dy, bb = blur;
    if (exit !== 'tumble' && t >= tOut) {
      const e = ease.inCubic(clamp((t - tOut) / exitDur));
      bo *= 1 - e; if (exit === 'up') by -= e * S * 0.6; if (exit === 'blur' || exit === 'up') bb += e * 14;
    }
    st(this.head, { transform: tf({ x: dx, y: by, s: scale }), opacity: bo, filter: gblur(bb), 'transform-origin': '0 0' });
    // kicker
    if (this.kick) {
      const k = ease.enter(clamp((t - (tIn - 0.15)) / 0.55));
      let ko = k * alpha, kx = (1 - k) * -14;
      if (t >= tOut) ko *= 1 - ease.inCubic(clamp((t - tOut) / 0.3));
      st(this.kick, { opacity: ko, transform: tf({ x: kx + dx, y: dy }), filter: gblur(bb) });
    }
    // masks only while words are rising (so tumbling letters can leave the line box)
    const entering = t < tIn + (this.words.length - 1) * stagger + dur;
    for (const ln of this.lines) st(ln, { overflow: entering ? 'hidden' : 'visible' });
    // words: rise + blur-in
    this.words.forEach((w, i) => {
      const p = clamp((t - (tIn + i * stagger)) / dur), e = ease.enter(p);
      st(w, { transform: tf({ y: (1 - e) * S * 0.92 }), opacity: clamp(p * 1.8), filter: gblur((1 - e) * 9) });
    });
    // letters: tumble out
    this.chars.forEach((c, k) => {
      if (exit !== 'tumble' || t < tOut) { st(c, { transform: 'none', opacity: 1, filter: 'none' }); return; }
      const p = clamp((t - (tOut + k * 0.012)) / 0.5), e = ease.inQuad(p);
      const sgn = hash(k, this.seed) - 0.5;
      st(c, { transform: tf({ x: sgn * 26 * e, y: e * S * 1.15 + e * e * S * 0.4, r: sgn * 80 * e }), opacity: 1 - ease.inCubic(p), filter: gblur(e * 7) });
    });
  }
}
