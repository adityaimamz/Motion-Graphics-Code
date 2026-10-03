// term.js — a terminal card: typed lines (frame-locked), a blinking caret on the newest line, kinds cmd / cmt / out.
// Lines come from the scene as [{ at, text, cps, kind }]; nothing is stored between frames.
import { el, st, tf, show, html } from '../dom.js';
import { typedN, typeHtml, typeIdle, caretOpacity, caretHtml } from '../core.js';
import { makeCard } from './card.js';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const COL = { cmd: '#0E1116', cmt: '#8A909C', out: '#3A404B' };

export class Term {
  constructor(parent, { w = 850, h = 520, title = 'PowerShell', font = 27, lh = 56, pad = 28 } = {}) {
    this.card = makeCard(parent, { w, h, title });
    this.font = font; this.lh = lh; this.pad = pad; this.rows = [];
    st(this.card.ttl, { font: '600 25px/1 IN', color: '#6B7280' });
    this.box = el('div', 'abs', this.card.body); st(this.box, { left: '0px', top: '0px', width: '100%', height: '100%' });
  }
  // y of line i inside the card (for marks placed beside a line)
  lineY(i) { return this.card.head + this.pad + i * this.lh; }
  row(i) {
    while (this.rows.length <= i) {
      const r = el('div', 'abs', this.box);
      st(r, { left: `${this.pad + 4}px`, top: `${this.pad + this.rows.length * this.lh}px`, font: `500 ${this.font}px/${this.lh}px JB`, 'white-space': 'pre', color: '#0E1116' });
      this.rows.push(r);
    }
    return this.rows[i];
  }
  // lines: [{ at, text, cps, kind }]; alpha / dy: the whole body; caret: show it on the newest line
  render(t, lines, { alpha = 1, dy = 0, caret = true } = {}) {
    st(this.box, { opacity: alpha, transform: tf({ y: dy }) });
    let last = -1;
    lines.forEach((l, i) => { if (t >= l.at) last = i; });
    lines.forEach((l, i) => {
      const r = this.row(i);
      if (!show(r, t >= l.at)) return;
      const cps = l.cps ?? 40, n = typedN(l.text, t, l.at, cps), kind = l.kind ?? 'cmd';
      const prefix = kind === 'cmd' ? '<span style="color:#2F6BFF">❯</span> ' : '';
      // caret: on the newest started line; solid while typing, then a soft pulse
      const car = caret && i === last ? caretHtml(n < l.text.length ? 1 : caretOpacity(typeIdle(l.text, t, l.at, cps)), '1.05em') : '';
      html(r, prefix + `<span style="color:${COL[kind]}">${typeHtml(l.text, t, l.at, cps, esc, COL[kind])}</span>` + car);
    });
    for (let i = lines.length; i < this.rows.length; i++) show(this.rows[i], false);
  }
}
