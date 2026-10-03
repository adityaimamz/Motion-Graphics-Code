// S10 · 06 Cek & render — `npm run stills` fills a contact sheet of real stills (a soft shutter flash each), a round
// magnifier sweeps them one by one, stops on s05-bocor, a comment pin lands on the hatch; the specific complaint is typed,
// answered, and the fixed scene plays as the real clip "v3" (v1 → v2 → v3). Then the render in a terminal (6.090 frames
// counted up) and the commit with the real message, "titik aman". Exit: the lights go out from the top-right corner.
// VO 14, 15, 16. No fake "before": only complaint → command → result.
import { el, svgEl, st, tf, gblur, show, html, txt } from '../dom.js';
import { clamp, ease, lerp, typed, typedN, fq } from '../core.js';
import { S, CUE, CHAPTERS, LINE } from '../timeline.js';
import { Headline } from '../ui/headline.js';
import { VideoView } from '../ui/clip.js';
import { makeCard } from '../ui/card.js';
import { Term } from '../ui/term.js';
import { Check } from '../ui/fx.js';
import { A } from '../artefak.js';
import { CONTEXT_CHIPS } from './s05-aturan.js';

import { CMD_STILLS, COMPLAINT_TXT as COMPLAINT } from '../naskah.js';
const REPLY = 'Diperbaiki: laut depan dipotong di garis air.';
const SHEET = ['s01-karam', 's03-merem', 's05-bocor', 's06-peti', 's07-pangkat', 's08-baca', 's10-konteks', 's11-kecil', 's12-tes', 's13-commit', 's14-ulangi', 's15-engineer'];
const CW = 130, CHT = 231, CG = 14, GX = 80, GY = 600;
const cell = (i) => ({ x: GX + (i % 6) * (CW + CG), y: GY + Math.floor(i / 6) * (CHT + CG), w: CW, h: CHT });
const BIG = { x: 80, y: 600, w: 300, h: 533 };
const LENS = 176;
const MSG = A.commit; // = COMMIT_TXT in naskah.js (the real commit message of the first video)
const dots = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

let root, heads = [], cells = [], flash = [], lens, lensV, handle, pin, pinLab, bubble, reply, replyTxt, ok, vchips = [], vtag, term, prog, bar, fill, done, cmt, cmtCmd, cmtMsg, crystal, cryLab, dark;

export default {
  id: 'cek', layer: 'world', pre: 0.35, post: 0.2,
  init({ world, fx }) {
    root = el('div', 'layer', world);
    for (const [lines, seed] of [[[[['Lihat '], ['sendiri.', 'accent']]], 13], [[[['Bilang yang ']], [['spesifik.', 'accent']]], 14], [[[['Render, lalu ']], [['commit.', 'accent']]], 15]])
      heads.push(new Headline(root, { x: 80, y: 340, kicker: '06 · CEK & RENDER', kickerDot: CHAPTERS[6].dot, lines, seed }));
    SHEET.forEach((name, i) => {
      const c = el('div', 'abs', root); st(c, { 'border-radius': '12px', overflow: 'hidden', 'box-shadow': '0 8px 22px rgba(16,24,40,.14)', 'transform-origin': '0 0', background: '#111' });
      const v = new VideoView(c); v.render({ still: name });
      const f = el('div', 'abs', c); st(f, { width: '100%', height: '100%', background: '#fff' });
      cells.push({ c, v }); flash.push(f);
    });
    // the magnifier: a round glass showing the still under it, enlarged, with a handle
    lens = el('div', 'abs', root); st(lens, { width: `${LENS}px`, height: `${LENS}px`, 'border-radius': '50%', border: '7px solid #2F6BFF', overflow: 'hidden', background: '#111', 'box-shadow': '0 16px 40px rgba(47,107,255,.35)' });
    lensV = new VideoView(lens, { width: '540px', height: '960px', 'transform-origin': '0 0' }, false); // laid out at source size, zoomed by transform (see ui/clip.js)
    handle = el('div', 'abs', root); st(handle, { width: '16px', height: '78px', 'border-radius': '8px', background: '#2F6BFF', 'transform-origin': '50% 0' });
    // the comment pin on the hatch
    pin = el('div', 'abs', root); st(pin, { width: '46px', height: '46px', 'border-radius': '50% 50% 50% 4px', background: '#2F6BFF', color: '#fff', font: '700 22px/46px IT', 'text-align': 'center', 'box-shadow': '0 10px 24px rgba(47,107,255,.45)', 'transform-origin': '0 100%' });
    pin.textContent = '1';
    pinLab = el('div', 'chip abs', root, 'laut menutupi palka'); st(pinLab, { 'font-size': '20px', height: '40px' });
    // complaint → result (right column)
    bubble = el('div', 'abs', root, COMPLAINT); st(bubble, { width: '510px', font: '500 26px/1.3 IN', padding: '18px 24px', 'border-radius': '26px', background: '#2F6BFF', color: '#fff', 'box-shadow': '0 12px 30px rgba(47,107,255,.28)', 'transform-origin': '100% 0' });
    reply = el('div', 'card', root); st(reply, { left: '0px', top: '0px', width: '510px', height: '124px', 'border-radius': '24px' });
    replyTxt = el('div', 'abs', reply); st(replyTxt, { left: '24px', top: '20px', width: '400px', font: '500 26px/1.3 IN', color: '#0E1116' });
    ok = new Check(reply, 40);
    for (let i = 0; i < 3; i++) { const c = el('div', 'chip abs', root, `v${i + 1}`); st(c, { 'font-family': 'JB', height: '48px', padding: '0 24px', 'font-size': '24px' }); vchips.push(c); }
    vtag = el('div', 'abs', root, 'v3'); st(vtag, { font: '700 24px/1 JB', background: '#2F6BFF', color: '#fff', padding: '9px 14px', 'border-radius': '10px' });
    // terminal: render
    term = new Term(root, { w: 850, h: 330, title: 'PowerShell', lh: 64, pad: 30 });
    prog = el('div', 'abs', term.card.body); st(prog, { left: '34px', top: '104px', font: '500 27px/1 JB', color: '#3A404B', 'white-space': 'nowrap', 'font-variant-numeric': 'tabular-nums' });
    bar = el('div', 'abs', term.card.body); st(bar, { left: '34px', top: '158px', width: '782px', height: '16px', 'border-radius': '8px', background: '#EEF0F3' });
    fill = el('div', 'abs', bar); st(fill, { height: '16px', 'border-radius': '8px', background: '#2F6BFF' });
    done = el('div', 'abs', term.card.body, 'selesai · 1080×1920 · 60 fps'); st(done, { left: '34px', top: '208px', font: '500 24px/1 JB', color: '#1F9D63' });
    // commit card
    cmt = makeCard(root, { w: 850, h: 336, title: 'git commit' });
    cmtCmd = el('div', 'abs', cmt.body); st(cmtCmd, { left: '34px', top: '30px', font: '500 27px/1 JB', color: '#0E1116', 'white-space': 'pre' });
    cmtMsg = el('div', 'abs', cmt.body); st(cmtMsg, { left: '34px', top: '84px', width: '782px', font: '500 25px/1.5 JB', color: '#2B313B', 'white-space': 'pre-wrap' });
    crystal = svgEl('svg', { viewBox: '0 0 24 24', width: 52, height: 52, style: 'position:absolute;overflow:visible' }, root);
    svgEl('path', { d: 'M12 2 L21 9 L12 22 L3 9 Z', fill: '#EFE9FD', stroke: '#7C5CE0', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, crystal);
    svgEl('path', { d: 'M3 9 H21 M12 2 L8 9 L12 22 L16 9 Z', fill: 'none', stroke: '#7C5CE0', 'stroke-width': 1, 'stroke-linejoin': 'round' }, crystal);
    cryLab = el('div', 'chip abs', root, 'titik aman'); st(cryLab, { 'font-size': '22px', height: '44px', color: '#5B3FD0' });
    // lights out: a dark disc growing from the top-right corner, above everything (it hands over to S11's dark)
    dark = el('div', 'abs', fx); st(dark, { width: '1080px', height: '1920px', background: '#0B0D12', 'pointer-events': 'none' });
  },
  render(t) {
    const C = CUE.cek, s = S.cek;
    const lo = clamp((t - C.exit) / C.dark);
    if (t < s.t0 - 0.35 || t >= S.lima.t0) { show(root, false); show(dark, false); return; }
    show(root, true);
    // lights out: radial reveal from the top-right (feathered edge)
    if (show(dark, lo > 0)) { const r = ease.inOutCubic(lo) * 2500; const m = `radial-gradient(circle at 1020px 90px, #000 ${Math.max(0, r - 90).toFixed(0)}px, transparent ${r.toFixed(0)}px)`; st(dark, { '-webkit-mask-image': m, 'mask-image': m }); }
    heads.forEach((h, i) => h.render(t, C.H[i], C.Hout[i], { exit: 'up' }));
    // ---------------- A: contact sheet, shutter, magnifier
    const gone = ease.inCubic(clamp((t - C.partC) / 0.5));       // the whole sheet / still leaves for the render
    cells.forEach(({ c, v }, i) => {
      const r = cell(i), p = ease.outBack(clamp((t - C.shots[i]) / 0.38), 1.5), fl = 1 - clamp((t - C.shots[i]) / 0.28);
      let x = r.x, y = r.y, w = r.w, h = r.h, a = clamp(p * 3), blur = 0, sc = 0.82 + 0.18 * p;
      if (i === 2) {
        const g = ease.move(clamp((t - C.grow) / 0.75));
        x = lerp(r.x, BIG.x, g); y = lerp(r.y, BIG.y, g); w = lerp(r.w, BIG.w, g); h = lerp(r.h, BIG.h, g); sc = lerp(sc, 1, g);
        a *= 1 - gone; blur = gone * 8;
      } else {
        const out = clamp((t - C.grow - i * 0.015) / 0.35); a *= 1 - ease.inCubic(out); blur = out * 6; sc *= 1 - 0.1 * out;
      }
      if (!show(c, a > 0.003)) return;
      st(c, { transform: tf({ x, y, s: sc }), width: `${w}px`, height: `${h}px`, opacity: a, filter: gblur(blur), 'border-radius': `${lerp(12, 22, i === 2 ? ease.move(clamp((t - C.grow) / 0.75)) : 0)}px` });
      st(flash[i], { opacity: Math.max(0, fl) * 0.85, display: fl > 0 ? '' : 'none' });
      // after the fix the real clip plays in the big still
      v.render(i === 2 && t >= C.clip ? { clip: 's10-bocor', lt: t - C.clip, loop: true } : { still: SHEET[i] });
    });
    // the magnifier sweeps cell by cell, then comes back to s05-bocor
    const sweep = clamp((t - C.lens[0]) / (C.lens[1] - C.lens[0])), back = ease.move(clamp((t - C.lens[1]) / 0.45));
    const N = cells.length, k = Math.min(N - 1, Math.floor(sweep * N)), within = sweep * N - k;
    const cr = (i) => { const r = cell(i); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
    let lx, ly, ci;
    if (sweep < 1 && t < C.lens[1]) { const a = cr(k), b = cr(Math.min(N - 1, k + 1)); const e = ease.inOutCubic(clamp(within * 1.3 - 0.15)); lx = lerp(a.x, b.x, e); ly = lerp(a.y, b.y, e); ci = within > 0.65 ? Math.min(N - 1, k + 1) : k; }
    else { const a = cr(N - 1), b = cr(2); lx = lerp(a.x, b.x, back); ly = lerp(a.y, b.y, back); ci = back > 0.5 ? 2 : N - 1; }
    const la = ease.enter(clamp((t - C.lens[0] + 0.25) / 0.35)) * (1 - ease.inCubic(clamp((t - C.grow + 0.1) / 0.3)));
    if (show(lens, la > 0.003)) {
      const r = cell(ci), z = 1.9, iw = r.w * z, ih = r.h * z, relx = clamp((lx - r.x) / r.w), rely = clamp((ly - r.y) / r.h);
      lensV.render({ still: SHEET[ci] });
      st(lensV.img, { transform: `${tf({ x: LENS / 2 - 7 - relx * iw, y: LENS / 2 - 7 - rely * ih })} scale(${(iw / 540).toFixed(5)})` });
      st(lens, { transform: tf({ x: lx - LENS / 2, y: ly - LENS / 2, s: 0.8 + 0.2 * la }), opacity: la });
      st(handle, { transform: `translate3d(${(lx + LENS * 0.33).toFixed(1)}px,${(ly + LENS * 0.33).toFixed(1)}px,0) rotate(-45deg)`, opacity: la });
    } else { show(handle, false); }
    // ---------------- B: pin, complaint, answer, v1 → v2 → v3
    const bout = 1 - ease.inCubic(clamp((t - C.partC) / 0.45));
    const pp = ease.outBack(clamp((t - C.pin) / 0.45), 1.7);
    st(pin, { transform: tf({ x: BIG.x + BIG.w * 0.5 - 4, y: BIG.y + BIG.h * 0.8 - 46, s: pp }), opacity: clamp(pp * 2) * bout * (1 - clamp((t - C.replyDone) / 0.3)), display: pp > 0 && bout > 0 && t < C.replyDone + 0.35 ? '' : 'none' });
    const lp = ease.enter(clamp((t - C.pin - 0.25) / 0.45));
    st(pinLab, { transform: tf({ x: BIG.x + BIG.w * 0.5 + 50, y: BIG.y + BIG.h * 0.8 - 40 + (1 - lp) * 8 }), opacity: lp * bout * (1 - clamp((t - C.send) / 0.3)), display: lp > 0 && bout > 0 && t < C.send + 0.35 ? '' : 'none' });
    const bp = ease.outBack(clamp((t - C.send) / 0.45), 1.6);
    st(bubble, { transform: tf({ x: 420, y: 600 + (1 - bp) * 18, s: 0.88 + 0.12 * bp }), opacity: clamp(bp * 2) * bout, display: bp > 0 && bout > 0 ? '' : 'none' });
    const rp = ease.ui(clamp((t - C.reply) / 0.6)), rn = typedN(REPLY, t, C.reply + 0.15, 40);
    html(replyTxt, `${REPLY.slice(0, Math.max(0, rn - 3))}<span style="opacity:.55">${REPLY.slice(Math.max(0, rn - 3), rn)}</span>`);
    st(reply, { transform: `perspective(1700px) ${tf({ x: 420, y: 718 + (1 - rp) * 30, rx: (1 - rp) * 8 })}`, opacity: clamp(rp * 2.2) * bout, display: rp > 0 && bout > 0 ? '' : 'none' });
    ok.render(510 - 70, 42, clamp((t - C.replyDone) / 0.45));
    // version counter
    const vx = [420, 548, 676];
    vchips.forEach((c, i) => {
      const p = ease.outBack(clamp((t - C.versions[i]) / 0.4), 1.6), hot = i === 2 && p > 0;
      st(c, { transform: tf({ x: vx[i], y: 886 + (1 - p) * 14, s: 0.8 + 0.2 * p }), opacity: clamp(p * 2) * bout, display: p > 0 && bout > 0 ? '' : 'none', background: hot ? '#2F6BFF' : '#fff', color: hot ? '#fff' : '#3A404B', 'border-color': hot ? '#2F6BFF' : '#E3E6EC' });
    });
    const vt = ease.outBack(clamp((t - C.clip) / 0.4), 1.6);
    st(vtag, { transform: tf({ x: BIG.x + 16, y: BIG.y + 16, s: vt }), opacity: clamp(vt * 2) * bout, display: vt > 0 && bout > 0 ? '' : 'none' });
    // ---------------- C: render + commit
    const tin = ease.ui(clamp((t - C.term) / 0.7));
    const pr = clamp((t - C.progress[0]) / (C.progress[1] - C.progress[0])), fr = Math.round(6090 * ease.outCubic(pr));
    term.render(t, [{ at: C.cmd, text: 'npm run render', kind: 'cmd', cps: 22 }], { caret: t < C.progress[1] });
    txt(prog, t >= C.progress[0] ? `frame ${dots(fr)} / 6.090` : '');
    st(fill, { width: `${(pr * 782).toFixed(1)}px` });
    st(done, { opacity: clamp((t - C.progress[1]) / 0.3) });
    st(term.card.root, { transform: `perspective(1700px) ${tf({ x: 80, y: 590 + (1 - tin) * 40, rx: (1 - tin) * 8 })}`, opacity: clamp(tin * 2.2), display: tin > 0 ? '' : 'none' });
    const cin = ease.ui(clamp((t - C.commit) / 0.7));
    st(cmt.root, { transform: `perspective(1700px) ${tf({ x: 80, y: 960 + (1 - cin) * 40, rx: (1 - cin) * 8 })}`, opacity: clamp(cin * 2.2), display: cin > 0 ? '' : 'none' });
    txt(cmtCmd, typed('git commit -m', t, C.commit + 0.2, 30) + (t >= C.msg ? '' : ''));
    txt(cmtMsg, '"' + typed(MSG, t, C.msg, 50) + (typedN(MSG, t, C.msg, 50) >= MSG.length ? '"' : ''));
    const cp = ease.outBack(clamp((t - C.safe) / 0.5), 1.7);
    st(crystal, { transform: tf({ x: 80 + 850 - 76, y: 960 + 12, s: cp }), opacity: clamp(cp * 2), display: cp > 0 ? '' : 'none', 'transform-origin': '50% 50%' });
    st(cryLab, { transform: tf({ x: 80 + 850 - 76 - 158, y: 960 + 16 + (1 - clamp(cp)) * 6 }), opacity: clamp(cp * 2), display: cp > 0 ? '' : 'none' });
  },
  dock(t) {
    const C = CUE.cek;
    if (t < S.cek.t0 - 0.1 || t > S.cek.t1 + 0.1) return null;
    const out = ease.inCubic(clamp((t - C.partC) / 0.45));
    if (t < C.sendA + 0.7) return { t0: -99, text: CMD_STILLS, typeAt: C.typeA, cps: 20, send: C.sendA, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS() };
    // at the lights-out the dock sinks and fades: its work is done (TREATMENT motif 1)
    return { t0: -99, t1: C.exit + 0.1, text: COMPLAINT, typeAt: C.typeB, cps: 34, send: C.send, placeholder: 'Tanya Claude Code…', chips: CONTEXT_CHIPS(), alpha: 1 - out * 0.55 };
  },
};
