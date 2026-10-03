// placeholder.js — stands in for S3–S11 until the test cut (S1 + S2 + closing) is approved. Shows only the scene
// name and its VO window so the timeline can be checked in the preview.
import { el, st, show, txt } from '../dom.js';
import { S, LINE, CHAPTERS } from '../timeline.js';
import { VO_LINES } from '../naskah.js';

export function placeholder(id) {
  let root, title, body;
  return {
    id, layer: 'world', pre: 0, post: 0,
    init({ world }) {
      root = el('div', 'layer', world);
      title = el('div', 'kicker', root); st(title, { left: '82px', top: '300px' });
      body = el('div', 'card', root); st(body, { left: '80px', top: '700px', width: '850px', padding: '40px', font: '500 32px/1.4 IN', color: '#3A404B' });
    },
    render(t) {
      if (!show(root, t >= S[id].t0 && t < S[id].t1)) return;
      const ch = S[id].ch;
      txt(title, `● ${ch != null ? `${CHAPTERS[ch].n} · ${CHAPTERS[ch].name}` : id.toUpperCase()} · BELUM DIBANGUN`);
      const lines = VO_LINES.filter((l) => LINE[l.id]?.scene === id).map((l) => l.say);
      txt(body, `${id} (${S[id].t0.toFixed(1)}–${S[id].t1.toFixed(1)} s)\n\n${lines.join('\n\n')}`);
      st(body, { 'white-space': 'pre-wrap' });
    },
  };
}
