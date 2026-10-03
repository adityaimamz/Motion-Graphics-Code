// S6 · 02 Naskah — the full prompt is typed in the (grown) dock, "jangan coding." is lit, send: three hook cards grow
// out from behind the dock like TypingMind's answers. One line of card B is struck and rewritten, two chat bubbles
// bounce, the cursor clicks "Setuju" on card A, the others fade, and card A turns into the TREATMENT.md page of S7.
// VO 08, 09.
import { el, st, tf, gblur, show, html } from '../dom.js';
import { clamp, ease, lerp, typed, typedN } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { Strike, Check } from '../ui/fx.js';
import { path } from '../ui/cursor.js';
import { DOCK, sendCenter } from '../ui/prompt.js';
import { DOC } from '../ui/geo.js';
import { CONTEXT_CHIPS } from './s05-aturan.js';

import { PROMPT_NASKAH, HOOK_REWRITE } from '../naskah.js';
const PROMPT6 = PROMPT_NASKAH;
const HL = [PROMPT6.indexOf('jangan coding.'), PROMPT6.length];
const DOCK_H = 252;
const CW = 262, CG = 32, CY = 590, CH = 440, OLDY = 200;
const HOOKS = [
  { k: 'A', tag: 'PERTANYAAN', text: 'Kamu coding… tapi tahu nggak apa yang kamu bangun?', tint: '#E7EEFF', dot: '#2F6BFF' },
  { k: 'B', tag: 'KONTRAS', text: '“Jalan kok.” Terus?', old: 'Bedanya tipis.', neu: HOOK_REWRITE, tint: '#FFF3E2', dot: '#E58A1F' },
  { k: 'C', tag: 'KEJADIAN', text: 'GAME OVER. Gara-gara satu tombol: terima semua.', tint: '#FDEBEC', dot: '#E5484D' },
];
const cardX = (i) => 80 + i * (CW + CG);
const SETUJU = { dx: 22, dy: CH - 74, w: CW - 44, h: 52 }; // the button inside each card

let root, head, cards = [], btns = [], strike, newTxt, oldTxt, bubbles = [], ok;

export default {
  id: 'naskah', layer: 'world', pre: 0.35, post: 0.5,
  init({ world }) {
    root = el('div', 'layer', world);
    head = new Headline(root, { x: 80, y: 340, kicker: '02 · NASKAH', kickerDot: CHAPTERS[2].dot, lines: [[['Naskah ', 'accent'], ['dulu.']]], seed: 8 });
    HOOKS.forEach((h, i) => {
      const c = el('div', 'card', root);
      st(c, { left: '0px', top: '0px', width: `${CW}px`, height: `${CH}px`, 'border-radius': '26px', 'transform-origin': '50% 100%' });
      const bd = el('div', 'abs', c, h.k); st(bd, { left: '22px', top: '20px', width: '44px', height: '44px', 'border-radius': '50%', background: h.tint, color: h.dot, font: '700 24px/44px IT', 'text-align': 'center' });
      const tg = el('div', 'abs', c, h.tag); st(tg, { left: '78px', top: '20px', font: '500 17px/44px JB', 'letter-spacing': '.12em', color: '#8A909C' });
      const tx = el('div', 'abs', c, h.text); st(tx, { left: '22px', top: '84px', width: `${CW - 44}px`, font: '600 29px/1.2 IT', 'letter-spacing': '-0.015em', color: '#0E1116' });
      if (h.old) {
        oldTxt = el('div', 'abs', c, h.old); st(oldTxt, { left: '22px', top: `${OLDY}px`, width: `${CW - 44}px`, font: '500 24px/1.25 IN', color: '#6B7280' });
        newTxt = el('div', 'abs', c); st(newTxt, { left: '22px', top: `${OLDY}px`, width: `${CW - 44}px`, font: '500 24px/1.25 IN', color: '#2F6BFF' });
        strike = new Strike(c, '#E5484D', 4);
      }
      const ft = el('div', 'abs', c, '±3 s · hook'); st(ft, { left: '22px', top: `${CH - 126}px`, font: '500 18px/1 JB', color: '#8A909C' });
      const b = el('div', 'abs', c, 'Setuju'); st(b, { left: `${SETUJU.dx}px`, top: `${SETUJU.dy}px`, width: `${SETUJU.w}px`, height: `${SETUJU.h}px`, 'border-radius': '14px', background: '#F1F3F7', color: '#4A5160', font: '600 24px/52px IN', 'text-align': 'center' });
      btns.push(b);
      cards.push(c);
    });
    ok = new Check(root, 46, '#1F9D63');
    // two short chat bubbles bouncing above the dock ("bolak-balik")
    [['ganti hook B, bikin lebih singkat', true], ['oke, udah kuganti', false]].forEach(([tx, me]) => {
      const b = el('div', 'abs', root, tx);
      st(b, { font: '500 25px/1 IN', padding: '17px 24px', 'border-radius': '26px', background: me ? '#2F6BFF' : '#fff', color: me ? '#fff' : '#2B313B', border: me ? 'none' : '1px solid #E3E6EC', 'box-shadow': '0 10px 28px rgba(16,24,40,.10)', 'white-space': 'nowrap' });
      bubbles.push({ b, me });
    });
  },
  render(t) {
    const C = CUE.naskah, s = S.naskah;
    if (!show(root, t >= s.t0 - 0.35 && t < S.storyboard.t0 + 0.5)) return;
    head.render(t, C.head, C.exit, { exit: 'up' });
    const sel = ease.inOutCubic(clamp((t - C.pick) / 0.5)), mor = ease.move(clamp((t - C.exit) / 0.55));
    HOOKS.forEach((h, i) => {
      const c = cards[i], p = ease.ui(clamp((t - C.cards[i]) / 0.8)), x0 = cardX(i);
      if (!show(c, p > 0.001 && (i === 0 || mor < 1))) return;
      // grow from behind the dock: starts low and small, ends leaning slightly (±2°)
      const lean = (i - 1) * 2.2, y0 = CY + (i === 1 ? 0 : 16);
      const fade = i === 0 ? 0 : sel;
      if (i === 0) {
        // card A becomes the TREATMENT.md page: it takes the page's rectangle
        const w = lerp(CW, DOC.w, mor), hh = lerp(CH, DOC.h, mor);
        st(c, { width: `${w}px`, height: `${hh}px`, transform: `perspective(1700px) ${tf({ x: lerp(x0, DOC.x, mor), y: lerp(y0, DOC.y, mor) + (1 - p) * 480, rx: (1 - p) * 20, r: lerp(lean, 0, mor) * p, s: 0.7 + 0.3 * p })}`,
          opacity: clamp(p * 2.4) * (1 - clamp((t - S.storyboard.t0 - 0.05) / 0.3)), 'border-color': sel > 0.5 ? '#1F9D63' : '#E3E6EC', 'box-shadow': `0 ${24 * p}px ${60 * p}px rgba(16,24,40,.10)` });
        for (const n of c.children) st(n, { opacity: 1 - clamp(mor * 2.4) });
      } else {
        st(c, { transform: `perspective(1700px) ${tf({ x: x0, y: y0 + (1 - p) * 480 + fade * 20, rx: (1 - p) * 20, r: lean * p, s: (0.7 + 0.3 * p) * (1 - 0.04 * fade) })}`, opacity: clamp(p * 2.4) * (1 - fade * 0.82) * (1 - clamp(mor * 3)), filter: gblur(fade * 3 + (1 - p) * 6), 'box-shadow': `0 ${24 * p}px ${60 * p}px rgba(16,24,40,.10)` });
      }
    });
    // card B: a line struck and rewritten
    const sp = clamp((t - C.strike) / 0.35), np = typed(HOOKS[1].neu, t, C.rewrite, 26);
    strike.render(22, OLDY + 15, 150, sp, 1 - clamp((t - C.rewrite + 0.1) / 0.2));
    st(oldTxt, { opacity: 1 - clamp((t - C.rewrite + 0.1) / 0.25) });
    html(newTxt, np + (np.length && np.length < HOOKS[1].neu.length ? '<span style="display:inline-block;width:2px;height:1em;background:#2F6BFF;vertical-align:-2px;margin-left:2px"></span>' : ''));
    // the chosen card: Setuju turns green with a check
    const pk = clamp((t - C.click) / 0.3);
    st(btns[0], { background: pk > 0 ? '#1F9D63' : '#F1F3F7', color: pk > 0 ? '#fff' : '#4A5160', transform: tf({ s: t >= C.click && t < C.click + 0.2 ? 1 - 0.06 * Math.sin(Math.PI * (t - C.click) / 0.2) : 1 }) });
    html(btns[0], pk > 0 ? '✓ Setuju' : 'Setuju');
    ok.render(cardX(0) + CW - 26, CY - 22, ease.enter(clamp((t - C.click - 0.05) / 0.4)), 1 - mor);
    // bubbles
    bubbles.forEach(({ b, me }, i) => {
      const p = ease.outBack(clamp((t - C.bub[i]) / 0.4), 1.6), out = clamp((t - C.pick + 0.2) / 0.3);
      const w = b.offsetWidth || 340;
      st(b, { transform: tf({ x: me ? 930 - w : 80, y: 1110 + i * 78 + (1 - p) * 24, s: 0.8 + 0.2 * p }), 'transform-origin': me ? '100% 100%' : '0 100%', opacity: clamp(p * 2) * (1 - out), display: p > 0 && out < 1 ? '' : 'none' });
    });
  },
  dock(t) {
    const C = CUE.naskah;
    if (t < S.naskah.t0 - 0.1 || t > S.storyboard.t0 + 0.4) return null;
    const grow = ease.ui(clamp((t - (C.typeAt - 0.1)) / 0.45)) * (1 - ease.ui(clamp((t - C.send - 0.5) / 0.6)));
    return { t0: -99, h: lerp(DOCK.h, DOCK_H, grow), text: PROMPT6, typeAt: C.typeAt, cps: C.cps, hl: HL.concat([C.hl]), send: C.send, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS(), alpha: 1 };
  },
  cursor(t) {
    const C = CUE.naskah;
    if (t < C.cur[0] || t > C.click + 0.9) return null;
    const sc = sendCenter();
    const A = { x: cardX(0) + SETUJU.dx + SETUJU.w / 2, y: CY + 16 + SETUJU.dy + SETUJU.h / 2 };
    const p = path(t, [[C.cur[0], 990, 1620], [C.send - 0.06, sc.x, sc.y, ease.ui], [C.send + 0.45, 960, 1500, ease.ui], [C.cur[1], 700, 1250, ease.inOutCubic], [C.click - 0.04, A.x, A.y, ease.ui]]);
    const a = clamp((t - C.cur[0]) / 0.25) * (1 - clamp((t - C.click - 0.55) / 0.3));
    return { x: p.x, y: p.y, a, click: t >= C.click ? C.click : t >= C.send - 0.02 && t < C.send + 0.3 ? C.send : null };
  },
};
