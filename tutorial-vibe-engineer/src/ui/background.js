// background.js — light: #F3F4F7 + dot grid + three soft gradient blobs whose tint crossfades per chapter
// (TypingMind 10–12.5 s); dark (S11): #0B0D12 with one blue glow in the lower left (Notion 36–39 s).
import { el, st, tf } from '../dom.js';
import { mix, css, lerp } from '../core.js';

const BASE = [['#DCE5FF', 0.75], ['#ECE3FA', 0.7], ['#FBEADF', 0.6]];
const POS = [[-260, 1180, 980], [560, -220, 900], [420, 1500, 820]]; // x, y, size

export class Background {
  constructor(parent) {
    this.root = parent;
    this.blobs = POS.map(() => el('div', 'blob', parent));
    this.dots = el('div', 'dots', parent);
    this.dark = el('div', 'layer', parent);
    this.glow = el('div', 'blob', this.dark);
  }
  // tint: chapter colour or null; k: 0..1 how much of it; dark: 0..1; drift: camera parallax offset {x, y}
  render(t, { tint = null, k = 0, dark = 0, drift = { x: 0, y: 0 } } = {}) {
    st(this.root, { background: css(mix('#F3F4F7', '#0B0D12', dark)) });
    this.blobs.forEach((b, i) => {
      const [x, y, s] = POS[i], [c, a] = BASE[i];
      const col = tint && i !== 2 ? mix(c, tint, k * 0.85) : mix(c, '#FFFFFF', 0);
      st(b, { left: `${x}px`, top: `${y}px`, width: `${s}px`, height: `${s}px`, background: css(col), opacity: a * (1 - dark), transform: tf({ x: drift.x * (0.3 + i * 0.15), y: drift.y * (0.3 + i * 0.15) }) });
    });
    st(this.dots, { opacity: 1 - dark, transform: tf({ x: (drift.x * 0.6) % 28, y: (drift.y * 0.6) % 28 }) });
    st(this.dark, { opacity: dark, display: dark > 0.001 ? '' : 'none' });
    st(this.glow, { left: '-380px', top: '1180px', width: '1100px', height: '1100px', background: '#1B3A8A', opacity: 0.55 });
  }
}
