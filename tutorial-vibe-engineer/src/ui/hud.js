// hud.js — thin mono HUD in the corners (TypingMind): brand, chapter + rail of seven dots, running timecode, format.
// Decorative only: it may sit under TikTok's own UI.
import { el, st, tf, txt, html } from '../dom.js';
import { fidx, FPS, clamp, ease } from '../core.js';
import { CHAPTERS, BPM } from '../timeline.js';

export class Hud {
  constructor(parent) {
    this.root = parent;
    this.tl = el('div', 'hud', parent, 'BEYOND STUDIO · TUTORIAL');
    this.tr = el('div', 'hud', parent);
    this.rail = el('div', 'rail', parent);
    this.dots = CHAPTERS.map(() => el('i', '', this.rail));
    this.bl = el('div', 'hud', parent);
    this.br = el('div', 'hud', parent, '1080×1920 · 60FPS');
    st(this.tl, { left: '60px', top: '58px' });
    st(this.tr, { right: '60px', top: '58px' });
    st(this.rail, { right: '60px', top: '96px' });
    st(this.bl, { left: '60px', top: '1846px' });
    st(this.br, { right: '60px', top: '1846px' });
  }
  // ch: chapter index or null; a: alpha; dark: 0..1; chT: time the chapter began (for the rail's fill)
  render(t, { ch = null, a = 1, dark = 0, chT = 0 } = {}) {
    st(this.root, { opacity: a, display: a > 0.001 ? '' : 'none' });
    const col = dark > 0.5 ? '#6B7280' : '#9097A3';
    for (const n of [this.tl, this.tr, this.bl, this.br]) st(n, { color: col });
    html(this.tr, ch == null ? 'INTRO' : `<b>${CHAPTERS[ch].n}</b> — ${CHAPTERS[ch].name}`);
    // timecode HH:MM:SS:FF, frame-locked
    const f = fidx(t), s = Math.floor(f / FPS), ff = f % FPS;
    const p2 = (n) => String(n).padStart(2, '0');
    html(this.bl, `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}:${p2(ff)} <span style="color:#2F6BFF">●</span> ${BPM} BPM`);
    this.dots.forEach((d, i) => {
      const done = ch != null && i < ch, cur = ch === i, k = cur ? ease.enter(clamp((t - chT) / 0.5)) : 0;
      st(d, { background: done ? '#5B6270' : cur ? CHAPTERS[i].dot : dark > 0.5 ? '#2A2F3A' : '#C9CDD5', transform: tf({ s: 1 + 0.45 * k }) });
    });
  }
}
