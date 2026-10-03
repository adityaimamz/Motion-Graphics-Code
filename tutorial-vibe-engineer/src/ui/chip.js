// chip.js — a chapter chip: tinted rounded row with the chapter number in its dot colour, the name, and an optional
// right-hand description. Used by S3 (the list of seven steps) and S11 (the left column of the diagram).
import { el, st } from '../dom.js';
import { CHAPTERS } from '../timeline.js';

export function chapterChip(parent, i, { w = 800, h = 84, desc = null, fs = 34, dark = false } = {}) {
  const ch = CHAPTERS[i];
  const root = el('div', 'abs', parent);
  st(root, {
    left: '0px', top: '0px', width: `${w}px`, height: `${h}px`, 'border-radius': `${Math.round(h * 0.31)}px`, background: dark ? 'rgba(255,255,255,.06)' : ch.tint,
    border: dark ? '1px solid rgba(255,255,255,.12)' : '1px solid rgba(14,17,22,.06)', 'box-shadow': dark ? 'none' : '0 6px 18px rgba(16,24,40,.06)',
  });
  const d = Math.round(h * 0.62), pad = Math.round(h * 0.22);
  const num = el('div', 'abs', root, ch.n);
  st(num, { left: `${pad}px`, top: `${(h - d) / 2}px`, width: `${d}px`, height: `${d}px`, 'border-radius': '50%', background: dark ? 'rgba(255,255,255,.1)' : '#fff', color: dark ? '#9DB9FF' : ch.dot, font: `600 ${Math.round(d * 0.46)}px/${d}px JB`, 'text-align': 'center' });
  const name = el('div', 'abs', root, ch.name);
  st(name, { left: `${pad + d + 18}px`, top: '0px', height: `${h}px`, font: `640 ${fs}px/${h}px IT`, 'letter-spacing': '-0.02em', color: dark ? '#F3F4F7' : '#0E1116', 'white-space': 'nowrap' });
  let ds = null;
  if (desc) { ds = el('div', 'abs', root, desc); st(ds, { left: 'auto', right: '26px', top: '0px', height: `${h}px`, font: `500 24px/${h}px IN`, color: dark ? '#8A909C' : '#6B7280', 'white-space': 'nowrap' }); }
  return { root, num, name, desc: ds, w, h, ch };
}
