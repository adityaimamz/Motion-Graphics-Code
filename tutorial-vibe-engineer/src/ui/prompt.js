// prompt.js — the Claude Code prompt dock, the spine of the film (TREATMENT.md motif 1). One dock for the whole
// film; each scene says what it shows at t (film.js asks the active scene). Typing is frame-locked with a human rhythm
// (core.typeTimes): the newest keys fade in with a blue ink tint and the caret pulses softly. The send button presses,
// rings and glows (TypingMind 4–6 s, Notion 20–26 s).
import { el, svgEl, st, tf, html, gblur, show } from '../dom.js';
import { clamp, ease, fq, typedN, typeHtml, typeIdle, caretOpacity, caretHtml } from '../core.js';

export const DOCK = { x: 80, y: 1398, w: 850, h: 156 }; // rest geometry (bottom edge 1554, inside the safe area)
// the send button: 56 px, 24 px from the right edge, 20 px from the bottom; the tool row shares its centre line
export const SEND = { r: 28, right: 24, bottom: 20 };
export const sendCenter = (h = DOCK.h) => ({ x: DOCK.x + DOCK.w - SEND.right - SEND.r, y: DOCK.y + DOCK.h - SEND.bottom - SEND.r, h });
const ICONS = [
  'M12 5v14M5 12h14', // plus
  'M16.5 7.5l-7.8 7.8a2.5 2.5 0 0 1-3.5-3.5L13 4a4 4 0 0 1 5.7 5.7l-8 8a5.5 5.5 0 0 1-7.8-7.8L10 3', // clip
  'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3', // mic
  'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18', // globe
  'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z', // bulb
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class Dock {
  constructor(parent) {
    this.root = el('div', 'abs', parent);
    this.chips = el('div', 'abs', this.root);
    st(this.chips, { display: 'flex', gap: '12px' });
    this.chipEls = [];
    this.box = el('div', 'dock', this.root);
    this.txt = el('div', 'txt', this.box);
    const tools = el('div', 'tools', this.box);
    ICONS.forEach((d, i) => { const b = el('div', i === 0 ? 'tool plus' : 'tool', tools); const s = svgEl('svg', { viewBox: '0 0 24 24' }, b); svgEl('path', { d }, s); });
    this.tools = tools;
    this.glow = el('div', 'glow', this.box);
    this.send = el('div', 'send', this.box);
    this.arrow = svgEl('svg', { viewBox: '0 0 24 24' }, this.send); svgEl('path', { d: 'M12 19V5M5.5 11.5L12 5l6.5 6.5' }, this.arrow);
    this.ring = el('div', 'ring', this.box);
    this.ring2 = el('div', 'ring', this.box);
  }
  // s: null → hidden. { t0 (in), t1 (out), text, typeAt, cps, placeholder, hl: [from, to, at], send, h, chips: [[label, color, at]], caret, err, alpha, dy, dx, scale, textAlpha, keep }
  render(t, s) {
    if (!show(this.root, !!s)) return;
    const tin = ease.ui(clamp((t - s.t0) / 0.6)), tout = s.t1 != null ? ease.inCubic(clamp((t - s.t1) / 0.42)) : 0;
    const h = s.h ?? DOCK.h, y = DOCK.y + DOCK.h - h + (1 - tin) * 220 + tout * 240 + (s.dy ?? 0);
    const sc = s.scale ?? 1;
    st(this.root, { opacity: Math.min(clamp(tin * 1.5), 1 - tout) * (s.alpha ?? 1), transform: tf({ x: s.dx ?? 0 }) });
    st(this.box, { left: `${DOCK.x}px`, top: `${y}px`, width: `${DOCK.w}px`, height: `${h}px`, transform: tf({ s: sc }), 'transform-origin': '50% 100%' });
    // ---- text: typed characters (human rhythm), optional highlight range, caret
    const full = s.text ?? '', cps = s.cps ?? 30, ph = `<span class="ph">${esc(s.placeholder ?? 'Tanya Claude Code…')}</span>`;
    const n = s.typeAt == null ? full.length : typedN(full, t, s.typeAt, cps);
    const sent = s.send != null && t >= s.send + 0.04;           // after sending, the field empties (the scene flies the text away)
    const idle = s.typeAt == null ? 1e9 : typeIdle(full, t, s.typeAt, cps), typing = s.typeAt != null && n > 0 && n < full.length;
    const caretOn = (s.caret ?? true) && !sent && n > 0 && t < (s.send ?? Infinity);
    let body;
    if (sent || (n === 0 && !(s.keep && full))) body = ph;
    else if (s.hl && t >= s.hl[2]) { const [a, b] = s.hl, shown = full.slice(0, n); body = esc(shown.slice(0, a)) + `<span class="hl">${esc(shown.slice(a, b))}</span>` + esc(shown.slice(b)); }
    else body = s.typeAt == null ? esc(full) : typeHtml(full, t, s.typeAt, cps, esc);
    html(this.txt, body + (caretOn ? caretHtml(typing ? 1 : caretOpacity(idle)) : ''));
    st(this.txt, { opacity: s.textAlpha ?? 1 });
    // ---- send button: idle = soft blue with a blue arrow (still reads as a button), armed = solid blue, then press + ring + glow
    const ds = s.send != null ? t - s.send : -1;
    const press = ds >= 0 && ds < 0.3 ? 1 - 0.14 * Math.sin(Math.PI * clamp(ds / 0.22)) : 1;
    const armed = n >= full.length && full.length > 0;
    const hot = armed || ds >= 0, bad = s.err && ds >= 0 && ds < 0.9;
    st(this.send, { transform: tf({ s: press }), background: bad ? '#E5484D' : hot ? '#2F6BFF' : '#E4ECFF' });
    st(this.arrow, { stroke: hot || bad ? '#fff' : '#2F6BFF' });
    const cx = DOCK.w - SEND.right - SEND.r, cy = h - SEND.bottom - SEND.r;
    for (const [r, off] of [[this.ring, 0], [this.ring2, 0.12]]) {
      const p = clamp((ds - off) / 0.62), on = ds >= off && p < 1;
      const R = SEND.r + 70 * ease.outCubic(p);
      st(r, { display: on ? '' : 'none', left: `${cx - R}px`, top: `${cy - R}px`, width: `${R * 2}px`, height: `${R * 2}px`, opacity: (1 - p) * 0.8, 'border-color': s.err ? '#E5484D' : '#2F6BFF' });
    }
    { const p = clamp(ds / 0.9), on = ds >= 0 && p < 1, R = 90 + 60 * p;
      st(this.glow, { display: on ? '' : 'none', left: `${cx - R}px`, top: `${cy - R}px`, width: `${R * 2}px`, height: `${R * 2}px`, opacity: Math.sin(Math.PI * p) }); }
    // ---- context chips above the dock (TypingMind's model chips)
    const chips = s.chips ?? [];
    while (this.chipEls.length < chips.length) this.chipEls.push(el('div', 'chip', this.chips));
    this.chipEls.forEach((c, i) => {
      const ch = chips[i]; if (!show(c, !!ch)) return;
      html(c, `<i style="background:${ch[1]}"></i>${esc(ch[0])}`);
      const p = ease.enter(clamp((t - ch[2]) / 0.5));
      st(c, { opacity: p, transform: tf({ y: (1 - p) * 16, s: 0.9 + 0.1 * p }) });
    });
    st(this.chips, { left: `${DOCK.x + 6}px`, top: `${y - 62}px`, opacity: 1 });
  }
  // where things fly to / from
  textOrigin(s) { const h = s?.h ?? DOCK.h; return { x: DOCK.x + 36, y: DOCK.y + DOCK.h - h + 28 }; }
}
