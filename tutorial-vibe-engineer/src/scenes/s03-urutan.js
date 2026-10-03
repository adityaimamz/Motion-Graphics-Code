// S3 · urutan — "one prompt, done" fails (the dock types it, the send button flashes red), then "Bukan satu prompt." with
// the words struck by a blue line, and the seven steps stack as chapter chips on the beat. VO 03.
// Exit: chip 00 shrinks up into the next beat's kicker, the rest dissolve.
import { el, st, tf, gblur, show } from '../dom.js';
import { clamp, ease, lerp } from '../core.js';
import { S, CUE } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { Strike } from '../ui/fx.js';
import { chapterChip } from '../ui/chip.js';

import { PROMPT_URUTAN as PROMPT } from '../naskah.js';
const DESC = ['install · folder', 'CLAUDE.md · skill', 'tulis dulu', 'detail per detik', 'frame = f(t)', 'rekam sekali jalan', 'lihat · render · commit'];
const CX = 100, CY = 560, CW = 800, CH = 84, GAP = 22;
const KICK = { x: 80, y: 262, s: 0.42 }; // where chip 00 lands: S4's kicker takes over

let root, hA, hB, strike, chips = [], links = [], measured = null;

export default {
  id: 'urutan', layer: 'world', pre: 0.4, post: 0.7,
  init({ world }) {
    root = el('div', 'layer', world);
    hA = new Headline(root, { x: 80, y: 340, lines: [[['Bukan '], ['satu prompt.']]], seed: 3 });
    hB = new Headline(root, { x: 80, y: 340, lines: [[['Ada '], ['urutannya.', 'accent']]], seed: 4 });
    strike = new Strike(root);
    CHAPTERS_ITER.forEach((i) => {
      const c = chapterChip(root, i, { w: CW, h: CH, desc: DESC[i] });
      chips.push(c);
      if (i < 6) { const l = el('div', 'abs', root); st(l, { width: '4px', height: `${GAP + 6}px`, background: '#2F6BFF', 'border-radius': '2px', opacity: 0.0 }); links.push(l); }
    });
  },
  render(t) {
    const C = CUE.urutan, s = S.urutan;
    if (!show(root, t >= s.t0 - 0.4 && t < S.siapkan.t0 + 0.7)) return;
    hA.render(t, C.headA, C.headAOut, { exit: 'up' });
    hB.render(t, C.headB, C.exit, { exit: 'up' });
    // "satu prompt" struck by a blue line, drawn left → right
    if (t >= C.strike[0] - 0.05 && t < C.headAOut + 0.4) {
      measured = measured ?? hA.wordRect(1, 2);
      const r = measured, p = clamp((t - C.strike[0]) / (C.strike[1] - C.strike[0]));
      strike.render(80 + r.x - 6, 340 + r.y + r.h * 0.56, r.w - 14, p, 1 - clamp((t - C.headAOut) / 0.25));
    } else strike.render(0, 0, 0, 0);
    // the seven steps
    const ex = ease.inCubic(clamp((t - C.exit) / 0.5)), mv = ease.move(clamp((t - C.exit) / 0.62));
    chips.forEach((c, i) => {
      const y = CY + i * (CH + GAP), p = ease.enter(clamp((t - C.chips[i]) / 0.55));
      if (!show(c.root, p > 0.001)) return;
      if (i === 0) {
        // chip 00 travels up into the kicker position and shrinks; S4's kicker takes over under it
        const hand = clamp((t - C.exit - 0.45) / 0.3);
        st(c.root, { transform: tf({ x: lerp(CX, KICK.x, mv), y: lerp(y, KICK.y, mv) + (1 - p) * 40, s: lerp(1, KICK.s, mv) }), 'transform-origin': '0 0', opacity: clamp(p * 2) * (1 - hand), filter: gblur((1 - p) * 8) });
      } else {
        const o = 1 - ex;
        st(c.root, { transform: tf({ x: CX + (1 - p) * 70 + ex * -40, y: y + (1 - p) * 26 + ex * 24, s: 1 - ex * 0.06 }), 'transform-origin': '0 0', opacity: clamp(p * 2) * o, filter: gblur((1 - p) * 9 + ex * 8) });
      }
    });
    links.forEach((l, i) => {
      const p = ease.outCubic(clamp((t - C.chips[i + 1]) / 0.3)), y = CY + (i + 1) * (CH + GAP) - GAP - 3;
      st(l, { transform: tf({ x: CX + 42, y, sy: p }), 'transform-origin': '50% 0', opacity: 0.55 * p * (1 - ex0(t, C)) });
    });
  },
  dock(t) {
    const C = CUE.urutan;
    if (t < C.dockIn || t > C.exit + 0.5) return null;
    return { t0: C.dockIn, t1: C.exit - 0.1, text: PROMPT, typeAt: C.typeAt, cps: 32, send: C.send, err: true, placeholder: 'Tanya Claude Code…', chips: [['satu prompt ✗', '#E5484D', C.errChip]] };
  },
};
const CHAPTERS_ITER = [0, 1, 2, 3, 4, 5, 6];
const ex0 = (t, C) => ease.inCubic(clamp((t - C.exit) / 0.5));
