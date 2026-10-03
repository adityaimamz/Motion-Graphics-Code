// S9 · 05 Suara — "Rekam sekali jalan." A REC pill with a live level meter (the real loudness of this narration line),
// then the whole take as one waveform drawn left → right from the real amplitudes (src/vo-env.js). A prompt is sent and
// cut lines drop at the real pauses, the waveform splits into five numbered clips, and the clips land on five scene
// thumbnails of the first video. VO 13. Enters from the right (S8's canvas leaves to the left).
import { el, svgEl, st, tf, gblur, show, html, attr, txt } from '../dom.js';
import { clamp, ease, lerp, fq } from '../core.js';
import { S, CUE, CHAPTERS, LINE } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { ENV } from '../vo-env.js';
import { PROMPT_SUARA } from '../naskah.js';
import { CONTEXT_CHIPS } from './s05-aturan.js';

const N = 170, WX = 80, WW = 850, WY = 800, AMP = 78;
const COL = ['#2F6BFF', '#1F9D63', '#E58A1F', '#7C5CE0', '#1597A8'];
const TINT = ['#E7EEFF', '#EAF7EF', '#FFF3E2', '#F1EAFE', '#E6F6F8'];
const THUMBS = ['s01-karam', 's05-bocor', 's08-baca', 's12-tes', 's17-akhir'], TLAB = ['scene 01', 'scene 05', 'scene 08', 'scene 12', 'scene 17'];
const TW = 130, TH = 231, TY = 1062, tx = (i) => 80 + i * (TW + 50);
const CHIP_Y = 948, CHIP_H = 98;
const MIC = 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3';
const env = ENV['13-suara'], bar = Array.from({ length: N }, (_, i) => Math.max(env[Math.floor((i / N) * env.length)], env[Math.min(env.length - 1, Math.floor((i / N) * env.length) + 1)]));
const p2 = (n) => String(Math.floor(n)).padStart(2, '0');

let root, box, head, pill, dot, recTxt, timer, meter = [], btn, btnRing, svg, rects = [], base, cutEls = [], tags = [], chipBg = [], thumbs = [], capt, grp;

export default {
  id: 'suara', layer: 'world', pre: 0.55, post: 0.4,
  init({ world }) {
    root = el('div', 'layer', world);
    box = el('div', 'layer', root);
    head = new Headline(box, { x: 80, y: 340, kicker: '05 · SUARA', kickerDot: CHAPTERS[5].dot, lines: [[['Rekam '], ['sekali ', 'accent'], ['jalan.']]], seed: 12 });
    // REC pill
    pill = el('div', 'card', box); st(pill, { left: '0px', top: '0px', width: '850px', height: '96px', 'border-radius': '48px' });
    btn = el('div', 'abs', pill); st(btn, { left: '14px', top: '14px', width: '68px', height: '68px', 'border-radius': '50%', background: '#E5484D', 'box-shadow': '0 8px 20px rgba(229,72,77,.35)' });
    const ms = svgEl('svg', { viewBox: '0 0 24 24', width: 34, height: 34, style: 'position:absolute;left:17px;top:17px' }, btn);
    svgEl('path', { d: MIC, fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ms);
    btnRing = el('div', 'ring', pill); st(btnRing, { 'border-color': '#E5484D' });
    dot = el('i', '', pill); st(dot, { position: 'absolute', left: '108px', top: '38px', width: '20px', height: '20px', 'border-radius': '50%', background: '#E5484D', display: 'block' });
    recTxt = el('div', 'abs', pill, 'REC'); st(recTxt, { left: '142px', top: '0px', font: '600 26px/96px JB', 'letter-spacing': '.12em', color: '#0E1116' });
    timer = el('div', 'abs', pill, '00:00.0'); st(timer, { left: '268px', top: '0px', font: '500 30px/96px JB', color: '#3A404B', 'font-variant-numeric': 'tabular-nums' });
    for (let j = 0; j < 22; j++) { const m = el('i', '', pill); st(m, { position: 'absolute', width: '7px', 'border-radius': '4px', background: '#E5484D', display: 'block', left: `${478 + j * 15}px` }); meter.push(m); }
    // clip backgrounds (chips the clips land in), then the waveform, then tags
    for (let k = 0; k < 5; k++) { const c = el('div', 'abs', box); st(c, { width: `${TW}px`, height: `${CHIP_H}px`, 'border-radius': '20px', background: TINT[k], border: '1px solid rgba(14,17,22,.06)' }); chipBg.push(c); }
    svg = svgEl('svg', { width: 1080, height: 1920, style: 'position:absolute;left:0;top:0;overflow:visible', 'shape-rendering': 'crispEdges' }, box);
    base = svgEl('rect', { x: WX, y: WY - 1, width: WW, height: 2, fill: '#C9CDD5', rx: 1 }, svg);
    for (let i = 0; i < N; i++) rects.push(svgEl('rect', { x: 0, y: 0, width: 3, height: 3, rx: 1.5, fill: COL[0] }, svg));
    for (let b = 0; b < 4; b++) {
      const g = svgEl('g', {}, svg);
      svgEl('rect', { x: -1.5, y: 0, width: 3, height: 200, rx: 1.5, fill: '#0E1116' }, g);
      svgEl('circle', { cx: 0, cy: 0, r: 9, fill: '#0E1116' }, g);
      svgEl('path', { d: 'M-4 -4 L4 4 M4 -4 L-4 4', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
      cutEls.push(g);
    }
    for (let k = 0; k < 5; k++) { const g = el('div', 'abs', box, p2(k + 1)); st(g, { font: '600 20px/1 JB', color: '#fff', background: COL[k], padding: '7px 11px', 'border-radius': '9px' }); tags.push(g); }
    capt = el('div', 'abs', box); st(capt, { left: `${WX}px`, top: `${WY + AMP + 28}px`, font: '500 22px/1 JB', color: '#6B7280', 'letter-spacing': '.04em' });
    TLAB.forEach((lab, i) => {
      const w = el('div', 'abs', box); st(w, { width: `${TW}px`, height: `${TH}px`, 'border-radius': '16px', overflow: 'hidden', border: '1px solid #E3E6EC', 'box-shadow': '0 10px 28px rgba(16,24,40,.12)' });
      const im = el('img', 'abs', w); im.src = `assets/ve/${THUMBS[i]}.jpg`; st(im, { width: '100%', height: '100%', 'object-fit': 'cover', 'image-rendering': 'pixelated' });
      const lb = el('div', 'abs', box, lab); st(lb, { font: '500 17px/1 JB', color: '#8A909C', 'letter-spacing': '.06em' });
      thumbs.push({ w, lb });
    });
  },
  render(t) {
    const C = CUE.suara, s = S.suara, L = LINE['13-suara'];
    if (!show(root, t >= s.t0 - 0.55 && t < S.cek.t0 + 0.4)) return;
    // the canvas arrives from the right; at the end the whole lower block shrinks into S10's contact sheet
    const inx = 1 - ease.outCubic(clamp((t - (s.t0 - 0.45)) / 0.8)), out = ease.inCubic(clamp((t - C.exit) / 0.6));
    st(box, { transform: tf({ x: inx * 340, s: 1 - 0.38 * out }), opacity: clamp(1 - inx * 1.1) * (1 - clamp((out - 0.55) / 0.45)), 'transform-origin': '540px 1150px' });
    head.render(t, C.head, C.exit, { exit: 'up' });
    // ---- the REC pill
    const pin = ease.ui(clamp((t - C.pill) / 0.7)), el0 = Math.max(0, Math.min(t - C.rec, L.d)), live = t >= C.rec && t < L.e + 0.2;
    st(pill, { transform: `perspective(1700px) ${tf({ x: 80, y: 570 + (1 - pin) * 40, rx: (1 - pin) * 8, s: 0.96 + 0.04 * pin })}`, opacity: clamp(pin * 2.2) * (1 - clamp((t - C.cutT[0] + 0.1) / 0.4)), display: pin > 0 ? '' : 'none' });
    txt(timer, `${p2(el0 / 60)}:${p2(el0 % 60)}.${Math.floor((el0 * 10) % 10)}`);
    st(dot, { opacity: live ? (Math.floor((fq(t) - C.rec) * 2.4) % 2 === 0 ? 1 : 0.25) : 0.25 });
    txt(recTxt, t >= L.e + 0.2 ? '1 TAKE' : 'REC');
    const rp = clamp((t - C.rec) / 0.6), rr = 34 + 60 * ease.outCubic(rp);
    st(btnRing, { display: rp > 0 && rp < 1 ? '' : 'none', left: `${48 - rr}px`, top: `${48 - rr}px`, width: `${rr * 2}px`, height: `${rr * 2}px`, opacity: (1 - rp) * 0.8 });
    st(btn, { transform: tf({ s: t >= C.rec && t < C.rec + 0.2 ? 1 - 0.1 * Math.sin(Math.PI * (t - C.rec) / 0.2) : 1 }) });
    const idx = Math.floor(clamp((t - L.s) / L.d) * (env.length - 1));
    meter.forEach((m, j) => { const v = live ? env[clamp(idx - (21 - j), 0, env.length - 1)] : 0.03; const h = 8 + v * 60; st(m, { height: `${h}px`, top: `${48 - h / 2}px` }); });
    // ---- the waveform: swept in left → right from the real amplitudes, then cut, then landed
    const sw = clamp((t - C.sweep[0]) / (C.sweep[1] - C.sweep[0])), cuts = C.cutsF, cutT = C.cutT;
    const segOf = (u) => cuts.reduce((k, f) => (u > f ? k + 1 : k), 0), bounds = [0, ...cuts, 1];
    const segN = [0, 0, 0, 0, 0]; for (let i = 0; i < N; i++) segN[segOf(i / (N - 1))]++;
    const segStart = [0, 0, 0, 0, 0]; { let a = 0; for (let k = 0; k < 5; k++) { segStart[k] = a; a += segN[k]; } }
    const m = (k) => ease.move(clamp((t - (C.match + k * 0.12)) / 0.6));
    const sep = (k) => ease.outBack(clamp((t - cutT[Math.max(0, k - 1)] - 0.05) / 0.35), 1.4);
    attr(base, { opacity: (clamp((t - C.sweep[0] + 0.15) / 0.2) * (1 - clamp((t - cutT[0]) / 0.4))).toFixed(3) });
    rects.forEach((r, i) => {
      const u = i / (N - 1), k = segOf(u), mk = m(k), vis = u <= sw;
      if (!vis) { attr(r, { opacity: 0 }); return; }
      const lu = (i - segStart[k]) / Math.max(1, segN[k] - 1), sp = (k - 2) * 15 * sep(k);
      const pitch = TW / segN[k], bw = lerp(3.4, Math.max(1.2, pitch * 0.7), mk);
      const x = lerp(WX + u * WW + sp, tx(k) + 4 + lu * (TW - 8), mk) - bw / 2;
      const h0 = Math.max(4, bar[i] * 2 * AMP), h = h0 * lerp(1, 0.46, mk), cy = lerp(WY, CHIP_Y + CHIP_H / 2, mk);
      const edge = clamp((sw - u) / 0.03);
      attr(r, { x: x.toFixed(2), y: (cy - h / 2).toFixed(2), width: bw.toFixed(2), height: h.toFixed(2), fill: t >= cutT[0] ? COL[k] : COL[0], opacity: (edge * (1 - 0.0)).toFixed(3) });
    });
    // cut lines drop at the pauses
    cutEls.forEach((g, b) => {
      const p = clamp((t - cutT[b]) / 0.2), fade = 1 - clamp((t - cutT[b] - 0.45) / 0.3);
      attr(g, { transform: `translate(${(WX + cuts[b] * WW).toFixed(2)},${(690 + (p - 1) * 40).toFixed(2)})`, opacity: (clamp(p * 2) * fade).toFixed(3), display: p > 0 && fade > 0 ? 'inline' : 'none' });
    });
    // tags (01 … 05) above each clip, following it down to its chip
    tags.forEach((g, k) => {
      const mk = m(k), a = ease.outBack(clamp((t - cutT[Math.min(3, Math.max(0, k - 1))] - 0.15) / 0.35), 1.7);
      const cx = lerp(WX + ((bounds[k] + bounds[k + 1]) / 2) * WW + (k - 2) * 15 * sep(k), tx(k) + 4, mk);
      st(g, { transform: tf({ x: cx, y: lerp(WY - AMP - 48, CHIP_Y - 40, mk), s: a }), 'transform-origin': '0 50%', opacity: clamp(a * 2), display: a > 0 ? '' : 'none' });
    });
    chipBg.forEach((c, k) => { const mk = m(k); st(c, { transform: tf({ x: tx(k), y: CHIP_Y + (1 - mk) * 22 }), opacity: mk, display: mk > 0 ? '' : 'none' }); });
    // caption under the take
    txt(capt, `1 take · ${L.d.toFixed(1).replace('.', ',')} s · dari awal sampai akhir`);
    st(capt, { opacity: clamp((t - C.sweep[1]) / 0.3) * (1 - clamp((t - cutT[0]) / 0.25)), display: t >= C.sweep[1] && t < cutT[0] + 0.3 ? '' : 'none' });
    // thumbnails of the first video's scenes
    thumbs.forEach(({ w, lb }, i) => {
      const p = ease.ui(clamp((t - C.thumbs - i * 0.1) / 0.6));
      st(w, { transform: tf({ x: tx(i), y: TY + (1 - p) * 40, s: (0.94 + 0.06 * p) }), opacity: clamp(p * 2), display: p > 0 ? '' : 'none' });
      st(lb, { transform: tf({ x: tx(i) + 4, y: TY + TH + 14 }), opacity: p, display: p > 0 ? '' : 'none' });
    });
  },
  dock(t) {
    const C = CUE.suara;
    if (t < S.suara.t0 - 0.55 || t > S.cek.t0 + 0.2) return null;
    return { t0: -99, text: PROMPT_SUARA, typeAt: C.typeAt, cps: 34, send: C.send, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS() };
  },
};

