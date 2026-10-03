// S8 · 04 Kode — the one sentence that matters: it is typed in the dock, lifts out of it and becomes `frame = f(t)` (a
// Figma selection around it), then shrinks up and proves itself: "preview" and "render.mp4" play the same real clip,
// the playhead jumps around the video, and at "sama persis" one player slides over the other with a difference blend: a
// black frame, `diff 0 px · identik ✓`. VO 11, 12. Exit: the playhead runs off to the right and pulls the canvas along.
import { el, st, tf, gblur, show, html, txt } from '../dom.js';
import { clamp, ease, lerp, fq } from '../core.js';
import { S, CUE, CHAPTERS } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { Select } from '../ui/select.js';
import { makeCard } from '../ui/card.js';
import { VideoView } from '../ui/clip.js';
import { Check } from '../ui/fx.js';
import { TL, thumbRect } from '../ui/geo.js';
import { DOCK } from '../ui/prompt.js';
import { PROMPT_KUNCI } from '../naskah.js';
import { CONTEXT_CHIPS } from './s05-aturan.js';

const TOTAL = 101.4;
const FORMULA = { x: 100, y: 690, s0: 1, s1: 0.56, y1: 498 };
const PL = { y: 650, w: 230, h: 410, x1: 110, x2: 410 };
// the first video's scenes by time → the still shown while the playhead is elsewhere
const STILL_AT = [[0, 's01-karam'], [4, 's02-dermaga'], [10.8, 's03-merem'], [18.3, 's04-rilis'], [25, 's05-malam'], [32, 's06-peti'], [38.5, 's07-pangkat'], [44.2, 's08-baca'],
  [50.2, 's09-kraken'], [52.1, 's10-konteks'], [60.1, 's11-kecil'], [67.3, 's12-tes'], [75.9, 's13-commit'], [83.7, 's14-ulangi'], [88.4, 's15-engineer'], [96.7, 's16-santai']];
export const stillAt = (T) => STILL_AT.reduce((n, [a, name]) => (T >= a ? name : n), STILL_AT[0][1]);
const THUMB_T = Array.from({ length: 8 }, (_, i) => ((i + 0.5) / 8) * TOTAL);
const fmtT = (T) => `${T.toFixed(1).replace('.', ',')} s`;
const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// where the video's own time is at t (the clip plays, then the playhead jumps, then it settles on 44.8 s)
export function videoTime(t, C) {
  if (t < C.j1) return 44 + ((((t - C.players) % 3) + 3) % 3);
  if (t < C.j2) return 12.3;
  if (t < C.j3) return 87.0;
  return 44 + ((0.8 + Math.max(0, t - C.resume)) % 3);
}
const frameOf = (T) => (T >= 44 && T < 47 ? { clip: 's8-sama', lt: T - 44, loop: true } : { still: stillAt(T) });

let root, box, head, fly, fm, sel, tl, thumbs = [], playhead, phChip, p1, p2, v1, v2, l1, l2, eq, readout, rT, rF, badge, ok, fmW = 749, fmH = 126;

export default {
  id: 'kunci', layer: 'world', pre: 0.3, post: 0.3,
  init({ world }) {
    root = el('div', 'layer', world);
    box = el('div', 'layer', root);
    head = new Headline(box, { x: 80, y: 340, kicker: '04 · KODE', kickerDot: CHAPTERS[4].dot, lines: [[['Satu '], ['kalimat '], ['kunci.', 'accent']]], seed: 11 });
    // the sentence that lifts out of the dock, and the formula it becomes
    fly = el('div', 'abs', box, PROMPT_KUNCI); st(fly, { font: '450 33px/1.2 IN', color: '#0E1116', 'white-space': 'nowrap', 'transform-origin': '0 0' });
    fm = el('div', 'abs', box); st(fm, { font: '700 104px/126px JB', 'letter-spacing': '-0.03em', 'white-space': 'nowrap', 'transform-origin': '0 0' });
    html(fm, '<span style="color:#0E1116">frame</span><span style="color:#9AA0AB"> = </span><span style="color:#2F6BFF">f(t)</span>');
    sel = new Select(box);
    // timeline: eight stills of the first video, playhead on top
    tl = makeCard(box, { w: TL.w, h: TL.h }); st(tl.root, { left: '0px', top: '0px', 'border-radius': '24px' });
    for (let i = 0; i < 8; i++) {
      const im = el('img', 'abs', box); const r = thumbRect(i);
      st(im, { width: `${r.w}px`, height: `${r.h}px`, 'object-fit': 'cover', 'border-radius': '8px', 'image-rendering': 'pixelated', left: '0px', top: '0px' });
      im.src = `assets/ve/${stillAt(THUMB_T[i])}.jpg`; thumbs.push(im);
    }
    playhead = el('div', 'abs', box); st(playhead, { width: '4px', height: `${TL.h + 30}px`, background: '#2F6BFF', 'border-radius': '2px', 'box-shadow': '0 0 0 4px rgba(47,107,255,.18)' });
    phChip = el('div', 'abs', box); st(phChip, { background: '#2F6BFF', color: '#fff', font: '500 18px/1 JB', padding: '7px 11px', 'border-radius': '8px', 'white-space': 'nowrap' });
    // the two players
    [[1, 'preview'], [2, 'render.mp4']].forEach(([k, name]) => {
      const p = el('div', 'card', box); st(p, { left: '0px', top: '0px', width: `${PL.w}px`, height: `${PL.h}px`, 'border-radius': '22px', 'transform-origin': '50% 100%' });
      const v = new VideoView(p);
      const lb = el('div', 'chip abs', box, name); st(lb, { left: '0px', top: '0px', 'font-family': 'JB', 'font-size': '20px', height: '42px' });
      if (k === 1) { p1 = p; v1 = v; l1 = lb; } else { p2 = p; v2 = v; l2 = lb; }
    });
    eq = el('div', 'abs', box, '='); st(eq, { font: '600 70px/70px IT', color: '#9AA0AB', 'text-align': 'center', width: '80px' });
    readout = el('div', 'abs', box); st(readout, { left: '0px', top: '0px', width: '240px' });
    el('div', 'abs', readout, 'WAKTU VIDEO'); rT = el('div', 'abs', readout); rF = el('div', 'abs', readout);
    st(readout.children[0], { font: '500 18px/1 JB', 'letter-spacing': '.14em', color: '#8A909C', top: '0px' });
    st(rT, { font: '700 64px/1 IT', 'letter-spacing': '-0.03em', 'font-variant-numeric': 'tabular-nums', top: '34px', color: '#0E1116', 'white-space': 'nowrap' });
    st(rF, { font: '500 22px/1 JB', color: '#6B7280', top: '112px', 'white-space': 'nowrap' });
    badge = el('div', 'abs', box, 'diff 0 px · identik ✓'); st(badge, { font: '700 28px/1 IT', color: '#fff', background: '#1F9D63', padding: '16px 24px', 'border-radius': '999px', 'white-space': 'nowrap', 'box-shadow': '0 14px 34px rgba(31,157,99,.35)' });
    ok = new Check(box, 40, '#1F9D63');
  },
  render(t) {
    const C = CUE.kunci, s = S.kunci;
    if (!show(root, t >= s.t0 - 0.3 && t < S.suara.t0 + 0.4)) return;
    // the whole canvas is pulled to the left when the playhead leaves; S9 arrives from the right
    const out = ease.inCubic(clamp((t - C.exit) / 0.6));
    st(box, { transform: tf({ x: -out * 340 }), opacity: 1 - clamp(out * 1.15), filter: gblur(out * 10) });
    head.render(t, C.head, C.exit, { exit: 'up' });
    // ---- the sentence lifts out of the dock and becomes the formula
    const lp = ease.move(clamp((t - C.lift) / 0.8));
    if (show(fly, t >= C.lift && t < C.lift + 1.0)) {
      const arc = Math.sin(Math.PI * lp) * -60, k = lerp(1, 1.22, lp);
      st(fly, { transform: tf({ x: lerp(DOCK.x + 36, FORMULA.x + 4, lp), y: lerp(DOCK.y + 28, FORMULA.y + 38, lp) + arc, s: k }), opacity: 1 - clamp((t - C.lift - 0.45) / 0.35), filter: gblur(Math.sin(Math.PI * lp) * 4) });
    }
    const fp = ease.outExpo(clamp((t - C.lift - 0.4) / 0.7)), shr = ease.move(clamp((t - C.shrink) / 0.65));
    fmW = fm.offsetWidth || fmW;
    const fs = lerp(1, FORMULA.s1, shr), fy = lerp(FORMULA.y, FORMULA.y1, shr);
    if (show(fm, t >= C.lift + 0.4)) st(fm, { transform: tf({ x: FORMULA.x, y: fy + (1 - fp) * 30, s: fs * (0.92 + 0.08 * fp) }), opacity: clamp(fp * 1.6), filter: gblur((1 - fp) * 12) });
    sel.render({ x: FORMULA.x, y: fy + 0.0, w: fmW * fs, h: fmH * fs }, clamp((t - C.sel) / 0.3) * (1 - clamp((t - (C.players + 0.5)) / 0.3)), null, 12);
    // ---- the timeline (always there, stronger when the players come in)
    const tin = ease.ui(clamp((t - C.tl) / 0.7)), tg = clamp((t - C.players + 0.2) / 0.5);
    st(tl.root, { transform: tf({ x: TL.x, y: TL.y + (1 - tin) * 30 }), opacity: tin * (0.6 + 0.4 * tg) });
    thumbs.forEach((im, i) => {
      const r = thumbRect(i), p = ease.enter(clamp((t - C.tl - 0.15 - Math.abs(i - 3) * 0.07) / 0.45)), a = i === 3 ? 1 : p;
      st(im, { transform: tf({ x: r.x, y: r.y + (1 - a) * 14 }), opacity: a * (0.6 + 0.4 * tg) });
    });
    // ---- the playhead and the players
    const T = videoTime(t, C);
    const jump = (a, b, k) => lerp(a, b, ease.outCubic(clamp((t - k) / 0.2)));
    let Tx = T; // the playhead eases between jumps (the video frame itself cuts)
    if (t >= C.j1 && t < C.j2) Tx = jump(44 + (((C.j1 - C.players) % 3) + 3) % 3, 12.3, C.j1);
    else if (t >= C.j2 && t < C.j3) Tx = jump(12.3, 87.0, C.j2);
    else if (t >= C.j3) Tx = jump(87.0, 44.8, C.j3) + (t >= C.resume ? Math.max(0, t - C.resume) : 0);
    const phA = ease.enter(clamp((t - C.players) / 0.3)), x0 = TL.x + 14, W = TL.w - 28;
    const px = lerp(x0 + (Tx / TOTAL) * W, 1180, out);
    st(playhead, { transform: tf({ x: px - 2, y: TL.y - 15 }), opacity: phA * (1 - clamp((t - C.exit - 0.6) / 0.2)), display: phA > 0 ? '' : 'none' });
    st(phChip, { transform: tf({ x: clamp(px - 40, TL.x, TL.x + TL.w - 100), y: TL.y - 52 }), opacity: phA, display: phA > 0 ? '' : 'none' });
    txt(phChip, fmtT(Tx));
    // diff: the render player slides onto the preview player, a difference blend shows black
    const slide = ease.move(clamp((t - C.diff) / 0.5)), back = ease.move(clamp((t - C.apart) / 0.5));
    const gap = slide * (1 - back), x2 = lerp(PL.x2, PL.x1, gap), ov = gap > 0.985;
    const f1 = frameOf(T), pin1 = ease.ui(clamp((t - C.players) / 0.7)), pin2 = ease.ui(clamp((t - C.players - 0.1) / 0.7));
    if (show(p1, pin1 > 0.001)) { v1.render(f1); st(p1, { transform: `perspective(1700px) ${tf({ x: PL.x1, y: PL.y + (1 - pin1) * 60, rx: (1 - pin1) * 10, s: 0.94 + 0.06 * pin1 })}`, opacity: clamp(pin1 * 2.2) * (1 - 0 * out) }); }
    if (show(p2, pin2 > 0.001)) { v2.render(f1); st(p2, { transform: `perspective(1700px) ${tf({ x: x2, y: PL.y + (1 - pin2) * 60, rx: (1 - pin2) * 10, s: 0.94 + 0.06 * pin2 })}`, opacity: clamp(pin2 * 2.2), 'mix-blend-mode': ov ? 'difference' : 'normal' }); }
    const lbA = ease.enter(clamp((t - C.players - 0.3) / 0.4)), hot = (k) => Math.sin(Math.PI * clamp((t - k) / 0.7));
    st(l1, { transform: tf({ x: PL.x1, y: PL.y - 58 + (1 - lbA) * 10 }), opacity: lbA, color: hot(C.lblPreview) > 0.01 ? '#2F6BFF' : '#3A404B', 'border-color': hot(C.lblPreview) > 0.01 ? '#2F6BFF' : '#E3E6EC', display: lbA > 0 ? '' : 'none' });
    st(l2, { transform: tf({ x: x2, y: PL.y - 58 + (1 - lbA) * 10 }), opacity: lbA * (1 - gap), color: hot(C.lblRender) > 0.01 ? '#2F6BFF' : '#3A404B', 'border-color': hot(C.lblRender) > 0.01 ? '#2F6BFF' : '#E3E6EC', display: lbA > 0 && gap < 0.98 ? '' : 'none' });
    // "=": after they split again, the two identical frames carry an equals sign and a check
    const eqA = ease.outBack(clamp((t - C.apart - 0.45) / 0.4), 1.6);
    st(eq, { transform: tf({ x: PL.x1 + PL.w + (PL.x2 - PL.x1 - PL.w) / 2 - 40, y: PL.y + PL.h / 2 - 36, s: eqA }), opacity: clamp(eqA * 2), display: eqA > 0 ? '' : 'none' });
    const bp = ease.outBack(clamp((t - C.diff - 0.5) / 0.4), 1.5) * (1 - clamp((t - C.apart) / 0.25));
    st(badge, { transform: tf({ x: PL.x1 + PL.w / 2 - 170, y: PL.y + PL.h / 2 - 26, s: bp }), opacity: clamp(bp * 2), display: bp > 0.01 ? '' : 'none' });
    ok.render(PL.x1 + PL.w + (PL.x2 - PL.x1 - PL.w) / 2 - 20, PL.y + PL.h / 2 + 50, clamp((t - C.apart - 0.7) / 0.4));
    // readout of the video's own time (frame-locked)
    const ra = ease.enter(clamp((t - C.players - 0.2) / 0.5));
    st(readout, { transform: tf({ x: 700, y: 740 + (1 - ra) * 14 }), opacity: ra, display: ra > 0 ? '' : 'none' });
    txt(rT, fmtT(Math.round(T * 10) / 10)); txt(rF, `frame ${dots(Math.round(T * 60))}`);
  },
  dock(t) {
    const C = CUE.kunci;
    if (t < S.kunci.t0 - 0.3 || t > S.suara.t0 + 0.2) return null;
    return { t0: -99, text: t >= C.lift ? '' : PROMPT_KUNCI, typeAt: C.typeAt, cps: 34, caret: t < C.lift, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS() };
  },
};
