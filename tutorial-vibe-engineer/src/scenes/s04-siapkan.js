// S4 · 00 Siapkan — "Install tiga hal." A PowerShell card types the install lines (real commands from the official
// docs), three checks tick on "Udah?", then a new folder and `claude`; the terminal turns into the Claude Code welcome
// screen and shrinks into the prompt dock (terminal and dock are the same object). VO 04.
import { el, st, tf, show, html, svgEl } from '../dom.js';
import { clamp, ease, lerp, caretOpacity } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { Term } from '../ui/term.js';
import { place } from '../ui/card.js';
import { Check } from '../ui/fx.js';
import { DOCK } from '../ui/prompt.js';

const TERM = { x: 80, y: 590, w: 850, h: 610 };
const WEL_Y = 38 + 6 * 66 + 12, SCROLL = 150; // the welcome box sits under the six lines; the terminal scrolls up to show it
import { TERM_INSTALL, TERM_FOLDER } from '../naskah.js';
const LINES1 = TERM_INSTALL.map((text, i) => ({ text, kind: i % 2 ? 'cmd' : 'cmt', cps: i % 2 ? 80 : 70 }));
const LINES2 = [{ text: TERM_FOLDER[0], kind: 'cmd', cps: 40 }, { text: TERM_FOLDER[1], kind: 'cmd', cps: 12 }];

let root, head, term, note, checks = [], welcome, wTitle, wCwd, wTip, wPrompt;

export default {
  id: 'siapkan', layer: 'world', pre: 0.4, post: 0.1,
  init({ world }) {
    root = el('div', 'layer', world);
    head = new Headline(root, { x: 80, y: 340, kicker: '00 · SIAPKAN', kickerDot: CHAPTERS[0].dot, lines: [[['Install '], ['tiga ', 'accent'], ['hal.']]], seed: 5 });
    term = new Term(root, { w: TERM.w, h: TERM.h, title: 'PowerShell', lh: 66, pad: 38 });
    st(term.card.body, { overflow: 'hidden' });
    for (let i = 0; i < 3; i++) checks.push(new Check(term.box, 38));
    // the welcome screen of Claude Code, redrawn generic (no logo): a title box, the folder, a hint, the prompt
    welcome = el('div', 'abs', term.box);
    st(welcome, { left: '28px', top: `${WEL_Y}px`, width: `${TERM.w - 56}px`, height: '216px', border: '2px solid #D9DDE5', 'border-radius': '18px', background: '#FAFBFC' });
    wTitle = el('div', 'abs', welcome); st(wTitle, { left: '28px', top: '24px', font: '700 31px/1 IT', 'letter-spacing': '-0.02em', color: '#0E1116', display: 'flex', 'align-items': 'center', gap: '14px' });
    const dot = el('i', '', wTitle); st(dot, { width: '14px', height: '14px', 'border-radius': '50%', background: '#E58A1F', display: 'block' });
    el('span', '', wTitle, 'Claude Code');
    wCwd = el('div', 'abs', welcome, 'cwd: ~\\video-saya'); st(wCwd, { left: '28px', top: '78px', font: '500 24px/1 JB', color: '#6B7280' });
    wTip = el('div', 'abs', welcome, 'Tulis tugasmu di bawah  ·  /help untuk bantuan'); st(wTip, { left: '28px', top: '122px', font: '450 24px/1 IN', color: '#8A909C' });
    wPrompt = el('div', 'abs', welcome, '>'); st(wPrompt, { left: '28px', top: '164px', font: '500 26px/1 JB', color: '#2F6BFF' });
    note = el('div', 'abs', root); st(note, { left: '88px', top: '1232px', width: '850px', font: '450 25px/1.5 IN', color: '#7A808C' });
    html(note, 'Mac / Linux: <span style="font:500 22px JB;color:#3A404B">curl -fsSL https://claude.ai/install.sh | bash</span><br>Butuh paket Claude Pro ke atas.');
  },
  render(t) {
    const C = CUE.siapkan, s = S.siapkan;
    if (!show(root, t >= s.t0 - 0.4 && t < s.t1 + 0.1)) return;
    head.render(t, C.head, C.exit, { exit: 'blur' });
    // card: rises, then (at the end) shrinks into the prompt dock; its contents leave first
    const cin = ease.ui(clamp((t - C.card) / 0.8)), m = ease.move(clamp((t - C.morph) / 0.62)), fade = ease.inCubic(clamp((t - C.morph) / 0.3));
    const y = lerp(TERM.y, DOCK.y, m), h = lerp(TERM.h, DOCK.h, m);
    place(term.card, { x: TERM.x, y, p: cin, radius: lerp(28, 30, m), h, a: 1 });
    st(term.card.hdr, { opacity: 1 - fade });
    // terminal body: the install lines, then the folder + claude lines under them; on enter it scrolls up like a terminal
    const lines = [...LINES1.map((l, i) => ({ ...l, at: C.l1[i] })), ...LINES2.map((l, i) => ({ ...l, at: C.l2[i] }))];
    const dy = -SCROLL * ease.ui(clamp((t - C.enter) / 0.5));
    term.render(t, lines, { alpha: 1 - fade, dy, caret: t < C.enter });
    // checks beside the two comment lines: Claude Code, then Node.js + ffmpeg
    const ck = [[0, 780], [2, 780], [2, 730]]; // [line, x] inside the card body
    checks.forEach((c, i) => {
      const p = clamp((t - C.checks[i]) / 0.5), a = 1;
      c.render(ck[i][1], term.pad + ck[i][0] * term.lh + (term.lh - 38) / 2, p, a * (1 - fade));
    });
    // the welcome screen appears under the claude line
    const wp = ease.outBack(clamp((t - C.welcome) / 0.5), 1.2);
    st(welcome, { opacity: clamp(wp * 1.5) * (1 - fade), transform: tf({ y: (1 - wp) * 24, s: 0.97 + 0.03 * wp }), display: wp > 0 ? '' : 'none', 'transform-origin': '50% 0' });
    st(wPrompt, { opacity: caretOpacity(t - C.welcome) });
    // the install note under the card; it goes when the folder starts
    const np = ease.enter(clamp((t - C.note) / 0.6)), nout = ease.inCubic(clamp((t - C.morph + 0.2) / 0.3));
    st(note, { opacity: np * (1 - nout), transform: tf({ y: (1 - np) * 18 }) });
  },
  dock(t) {
    const C = CUE.siapkan;
    if (t < C.morph + 0.3 || t > S.siapkan.t1 + 0.2) return null;
    // the dock is the terminal's last form: it fades in on the spot where the card has shrunk to
    return { t0: -99, alpha: clamp((t - C.morph - 0.34) / 0.28), placeholder: 'Tanya Claude Code…', caret: false };
  },
};
