// S5 · 01 Aturan — "Kasih aturan main." The real CLAUDE.md as a card (excerpts of its own lines), an arrow from the dock
// ("dibaca otomatis tiap sesi"), a Figma selection that walks onto the three rules the VO names; then the skill: a folder
// tree and STYLE.md with the real prohibitions struck out; at the end both cards fold into two chips on the dock (the
// context that rides along with every later prompt). VO 05, 06, 07.
import { el, svgEl, st, tf, gblur, show, html, attr } from '../dom.js';
import { clamp, ease, lerp } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { makeCard, place } from '../ui/card.js';
import { Select } from '../ui/select.js';
import { Strike, Stamp } from '../ui/fx.js';
import { DOCK } from '../ui/prompt.js';

const C1 = { x: 80, y: 560, w: 850, h: 620 }, SK = { x: 80, y: 690, w: 850, h: 630 };
const RH = 62, R0 = 22;
// excerpts of the real CLAUDE.md (… marks a cut); b = bold run, m = the words the VO says
const ROWS = [
  { k: 'h1', h: '# Motion-Graphics-Code — aturan kerja' },
  { k: 'h2', h: '## Aturan tetap' },
  { k: 'li', h: '<b>Review dulu, kerjakan kemudian.</b> Setiap permin…' },
  { k: 'li', h: 'Kerja langsung di branch <i>master</i>. Jangan mem…' },
  { k: 'li', h: 'Hasil kerja = file siap render … <b>Jangan render MP4</b>…' },
  { k: 'li', h: '<b>Jangan pernah <i>git commit</i></b> / <i>git push</i> tanpa…' },
  { k: 'h2', h: '## Video baru' },
  { k: 'p', h: 'Setiap video baru … wajib memakai skill <i>beyond-video</i>' },
];
const STYLE_ROWS = [
  { k: 'h2', h: '## 1. WAJIB' },
  { k: 'li', h: '1080×1920, 60 fps', tag: ['ukuran video', '#2F6BFF'] },
  { k: 'li', h: 'Closing logo + CTA', tag: ['logo di akhir', '#2F6BFF'] },
  { k: 'h2', h: '## 4. LARANGAN', tag: ['nggak boleh', '#E5484D'] },
  { k: 'li', h: 'otak bercahaya', ban: true },
  { k: 'li', h: 'hujan kode Matrix', ban: true },
  { k: 'li', h: 'gerak mengambang ala screensaver', ban: true },
];
const TREE = [[0, '.claude/'], [1, 'skills/'], [2, 'beyond-video/'], [3, 'SKILL.md'], [3, 'STYLE.md']];
const SR = 66, SR0 = 24, TREE_W = 270; // style rows: height / first row / tree column width
const CHIP1 = { x: DOCK.x + 6, y: DOCK.y - 62, w: 176, h: 46 }, CHIP2 = { x: DOCK.x + 6 + 176 + 12, y: DOCK.y - 62, w: 104, h: 46 };
export const CONTEXT_CHIPS = () => [['CLAUDE.md', '#1F9D63', CUE.aturan.fold + 0.4], ['skill', '#7C5CE0', CUE.aturan.fold + 0.45]];

let root, h1, h2, c1, rows = [], sel, arrow, arrowHead, label, tip, sk, tree = [], pane = [], tags = [], strikes = [], stamp, paneBox, treeSel;

const rowRect = (i) => ({ x: C1.x + 20, y: C1.y + 76 + R0 + i * RH + 3, w: C1.w - 40, h: RH - 8 });

export default {
  id: 'aturan', layer: 'world', pre: 0.3, post: 0.3,
  init({ world }) {
    root = el('div', 'layer', world);
    h1 = new Headline(root, { x: 80, y: 340, kicker: '01 · ATURAN', kickerDot: CHAPTERS[1].dot, lines: [[['Kasih '], ['aturan ', 'accent'], ['main.']]], seed: 6 });
    h2 = new Headline(root, { x: 80, y: 340, size: 92, lines: [[['Lalu buku ']], [['panduan '], ['gaya.', 'accent']]], seed: 7 });
    // --- CLAUDE.md
    c1 = makeCard(root, { w: C1.w, h: C1.h, title: 'CLAUDE.md', sub: 'aturan kerja · root repo' });
    ROWS.forEach((r, i) => {
      const n = el('div', 'abs', c1.body); html(n, r.h);
      const f = r.k === 'h1' ? '700 27px/60px JB' : r.k === 'h2' ? '700 24px/60px JB' : '450 23px/60px JB';
      st(n, { left: '34px', top: `${R0 + i * RH}px`, font: f, color: r.k === 'h2' ? '#6B7280' : '#2B313B', 'white-space': 'nowrap', overflow: 'hidden', width: `${C1.w - 68}px` });
      if (r.k === 'li') { n.insertAdjacentHTML('afterbegin', '<span style="color:#2F6BFF;margin-right:14px">•</span>'); }
      rows.push(n);
    });
    root.insertAdjacentHTML('beforeend', '<style>.rowb b{font-weight:800;color:#0E1116}.rowb i{font-style:normal;background:#EEF1F6;border-radius:6px;padding:1px 6px}</style>');
    rows.forEach((n) => n.classList.add('rowb'));
    sel = new Select(root);
    // --- arrow from the dock up to the card + its label + the /init tip
    const sv = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;left:0;top:0;overflow:visible' }, root);
    arrow = svgEl('path', { d: 'M540 1384 L540 1236', fill: 'none', stroke: '#2F6BFF', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': 152, 'stroke-dashoffset': 152 }, sv);
    arrowHead = svgEl('path', { d: 'M521 1256 L540 1233 L559 1256', fill: 'none', stroke: '#2F6BFF', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sv);
    label = el('div', 'chip abs', root, 'dibaca otomatis tiap sesi'); st(label, { left: '0px', top: '0px', 'box-shadow': '0 8px 24px rgba(47,107,255,.18)' });
    tip = el('div', 'abs', root); st(tip, { left: '88px', top: '1216px', font: '450 24px/1.4 IN', color: '#7A808C' });
    html(tip, '<span style="font:500 22px JB;color:#3A404B">/init</span> bisa bikinin draf awalnya');
    // --- the skill: tree + STYLE.md
    sk = makeCard(root, { w: SK.w, h: SK.h, title: '.claude/skills/beyond-video', sub: 'STYLE.md' });
    st(sk.ttl, { font: '600 24px/1 JB', color: '#4A5160' });
    const dv = el('div', 'abs', sk.body); st(dv, { left: `${TREE_W}px`, top: '0px', width: '1px', height: '100%', background: '#EEF0F3' });
    treeSel = el('div', 'abs', sk.body); st(treeSel, { left: '14px', top: `${SR0 + 4 * 54}px`, width: `${TREE_W - 28}px`, height: '48px', 'border-radius': '12px', background: '#EAF0FF' });
    TREE.forEach(([d, name], i) => {
      const n = el('div', 'abs', sk.body, (name.endsWith('/') ? '▾ ' : '') + name);
      st(n, { left: `${28 + d * 16}px`, top: `${SR0 + i * 54}px`, font: `${i === 4 ? 700 : 500} 22px/56px JB`, color: i === 4 ? '#1F55E0' : '#3A404B', 'white-space': 'nowrap' });
      tree.push(n);
    });
    paneBox = el('div', 'abs', sk.body); st(paneBox, { left: `${TREE_W}px`, top: '0px', right: '0px', bottom: '0px' });
    STYLE_ROWS.forEach((r, i) => {
      const n = el('div', 'abs', paneBox); html(n, r.h);
      st(n, { left: '30px', top: `${SR0 + i * SR}px`, font: r.k === 'h2' ? '700 24px/56px JB' : '450 23px/56px JB', color: r.k === 'h2' ? '#6B7280' : '#2B313B', 'white-space': 'nowrap' });
      if (r.k === 'li') n.insertAdjacentHTML('afterbegin', '<span style="color:#2F6BFF;margin-right:14px">•</span>');
      pane.push(n);
      let tg = null;
      if (r.tag) { tg = el('div', 'chip abs', paneBox, r.tag[0]); st(tg, { left: 'auto', right: '22px', top: `${SR0 + i * SR + 5}px`, height: '44px', 'font-size': '21px', color: r.tag[1], background: r.tag[1] === '#E5484D' ? '#FDEBEC' : '#EAF0FF', 'border-color': 'transparent', 'box-shadow': 'none' }); }
      tags.push(tg);
      if (r.ban) { const s = new Strike(paneBox, '#E5484D', 5); strikes.push({ s, i, w: r.h.length * 13.9 + 6 }); }
    });
    stamp = new Stamp(root, 'anti-generik ✓', '#1F9D63');
  },
  render(t) {
    const C = CUE.aturan, s = S.aturan;
    if (!show(root, t >= s.t0 - 0.3 && t < s.t1 + 0.3)) return;
    h1.render(t, C.head1, C.head2 - 0.3, { exit: 'up' });
    h2.render(t, C.head2, C.exit, { exit: 'up' });
    // ---------- CLAUDE.md card
    const cin = ease.ui(clamp((t - C.card1) / 0.8)), col = ease.move(clamp((t - C.collapse) / 0.6));
    const fold = ease.inCubic(clamp((t - C.fold) / 0.55));
    const h = lerp(C1.h, 80, col);
    if (!show(c1.root, cin > 0.001 && fold < 1)) { sel.render(null, 0); } else {
      const x = lerp(C1.x, CHIP1.x, fold), y = lerp(C1.y, CHIP1.y, fold), sx = lerp(1, CHIP1.w / C1.w, fold), sy = lerp(1, CHIP1.h / h, fold);
      st(c1.root, { height: `${h}px`, transform: `perspective(1700px) ${tf({ x, y: y + (1 - cin) * 40, rx: (1 - cin) * 8, sx: sx * (0.96 + 0.04 * cin), sy: sy * (0.96 + 0.04 * cin) })}`, 'transform-origin': '0 0',
        opacity: Math.min(1, cin * 2.2) * (1 - clamp((fold - 0.6) / 0.4)), filter: gblur((1 - cin) * 6 + fold * 6),
        'box-shadow': `0 ${(24 * cin).toFixed(1)}px ${(60 * cin).toFixed(1)}px rgba(16,24,40,${(0.1 * cin).toFixed(3)}), 0 2px 6px rgba(16,24,40,${(0.06 * cin).toFixed(3)})` });
      // rows: pop in one by one, dim while a rule is selected, fade as the card collapses
      const selK = C.sel.reduce((k, x0, j) => (t >= x0 ? j : k), -1), dim = ease.outCubic(clamp((t - C.sel[0]) / 0.3)) * (1 - clamp((t - C.selOut) / 0.3));
      const SELROW = [2, 4, 5];
      rows.forEach((n, i) => {
        const p = ease.enter(clamp((t - (C.rows + i * 0.09)) / 0.5));
        const isSel = selK >= 0 && SELROW[selK] === i;
        st(n, { opacity: p * (1 - clamp(col * 2.2)) * (isSel ? 1 : lerp(1, 0.3, dim)), transform: tf({ y: (1 - p) * 14 }) });
      });
      // the Figma selection walks between the three rules
      const sr = C.sel.length;
      let r = null, a = 0;
      if (selK >= 0) {
        const cur = rowRect(SELROW[selK]), prev = selK > 0 ? rowRect(SELROW[selK - 1]) : cur, p = selK > 0 ? ease.move(clamp((t - C.sel[selK]) / 0.38)) : 1;
        r = { x: cur.x, y: lerp(prev.y, cur.y, p), w: cur.w, h: cur.h };
        a = ease.enter(clamp((t - C.sel[0]) / 0.3)) * (1 - clamp((t - C.selOut) / 0.25));
      }
      sel.render(r, a, null, 6);
    }
    // ---------- arrow dock → card: "dibaca otomatis tiap sesi"
    const ap = clamp((t - C.arrow[0]) / (C.arrow[1] - C.arrow[0])), aout = clamp((t - (C.collapse - 0.25)) / 0.3);
    attr(arrow, { 'stroke-dashoffset': (152 * (1 - ease.outCubic(ap))).toFixed(1), opacity: (1 - aout).toFixed(3) });
    attr(arrowHead, { opacity: (clamp((ap - 0.8) / 0.2) * (1 - aout)).toFixed(3) });
    const lp = ease.enter(clamp((t - C.arrow[0] - 0.2) / 0.5));
    st(label, { transform: tf({ x: 574, y: 1306 + (1 - lp) * 14 }), opacity: lp * (1 - aout), display: lp > 0 && aout < 1 ? '' : 'none' });
    const tp = ease.enter(clamp((t - C.tip) / 0.6));
    st(tip, { opacity: tp * (1 - aout), transform: tf({ y: (1 - tp) * 12 }), display: tp > 0 && aout < 1 ? '' : 'none' });
    // ---------- the skill card
    const kin = ease.ui(clamp((t - C.card2) / 0.8)), kfold = ease.inCubic(clamp((t - C.fold - 0.05) / 0.55));
    if (show(sk.root, kin > 0.001 && kfold < 1)) {
      const x = lerp(SK.x, CHIP2.x, kfold), y = lerp(SK.y, CHIP2.y, kfold), sx = lerp(1, CHIP2.w / SK.w, kfold), sy = lerp(1, CHIP2.h / SK.h, kfold);
      st(sk.root, { transform: `perspective(1700px) ${tf({ x, y: y + (1 - kin) * 40, rx: (1 - kin) * 8, sx: sx * (0.96 + 0.04 * kin), sy: sy * (0.96 + 0.04 * kin) })}`, 'transform-origin': '0 0',
        opacity: Math.min(1, kin * 2.2) * (1 - clamp((kfold - 0.6) / 0.4)), filter: gblur((1 - kin) * 6 + kfold * 6),
        'box-shadow': `0 ${(24 * kin).toFixed(1)}px ${(60 * kin).toFixed(1)}px rgba(16,24,40,${(0.1 * kin).toFixed(3)}), 0 2px 6px rgba(16,24,40,${(0.06 * kin).toFixed(3)})` });
      tree.forEach((n, i) => { const p = ease.enter(clamp((t - (C.tree + i * 0.12)) / 0.4)); st(n, { opacity: p, transform: tf({ x: (1 - p) * -10 }) }); });
      st(treeSel, { opacity: ease.enter(clamp((t - C.pane + 0.1) / 0.3)) });
      STYLE_ROWS.forEach((r, i) => {
        const at0 = r.ban ? C.items[i - 4] : r.tag && i === 3 ? C.tags[2] - 0.05 : C.pane + i * 0.09;
        const p = ease.enter(clamp((t - at0) / 0.45));
        st(pane[i], { opacity: p, transform: tf({ y: (1 - p) * 12 }) });
        const tg = tags[i];
        if (tg) { const tt = C.tags[i === 1 ? 0 : i === 2 ? 1 : 2], q = ease.outBack(clamp((t - tt) / 0.4), 1.6); st(tg, { opacity: clamp(q * 2), transform: tf({ s: 0.8 + 0.2 * q }), 'transform-origin': '100% 50%', display: q > 0 ? '' : 'none' }); }
      });
      strikes.forEach(({ s: sk2, i, w }, j) => sk2.render(56, SR0 + i * SR + 28 - 2, w, clamp((t - C.strikes[j]) / 0.3)));
    }
    stamp.render(570, 1246, clamp((t - C.stamp) / 0.5), -6, 1 - clamp(kfold * 3.5));
  },
  dock(t) {
    const C = CUE.aturan;
    if (t < S.aturan.t0 - 0.1 || t > S.aturan.t1 + 0.2) return null;
    return { t0: -99, placeholder: 'Tanya Claude Code…', caret: false, chips: CONTEXT_CHIPS() };
  },
};
