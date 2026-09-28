// film.js — the edit. render(c, t) draws the whole frame at time t (seconds). Pure function of t.
import {
  W, H, FPS, clamp, lerp, inv, prog, keys, ease, hash, TAU, fq, fidx,
  rgb, mix, css, mixc, rr, FONTS as F, setFont, wrap, charXs, canvas,
} from './core.js';
import {
  site91, site98, site02, site0715, site23, BEZEL, mixBezel, drawBezel, PHOS, PHOS_GLOW, SKIP02,
} from './sites.js';

// ---------------------------------------------------------------- timeline lives in timeline.js
import { S, TR, DURATION, MARKERS, HOOK, YEAR_K, LABELS, CAPTIONS, TERM_CPS, CUE } from './timeline.js';
export { S, TR, DURATION, MARKERS };
// sub-frames per frame for motion blur (the renderer multiplies by --samples auto)
export function motion(t) {
  for (const [a, b] of Object.values(TR)) if (t >= a - 0.05 && t <= b + 0.05) return 8;
  if (t > S.close + CUE.arrow[0] - 0.05 && t < S.close + CUE.land + 1.45) return 10; // brand sweep
  if (t < 1.2) return 3;
  return 3;
}

const R43 = { x: 100, y: 475, w: 880, h: 660 };
const R1610 = { x: 80, y: 517, w: 920, h: 575 };
const RFULL = { x: 0, y: 0, w: W, h: H };
const lerpR = (A, B, k) => ({ x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), w: lerp(A.w, B.w, k), h: lerp(A.h, B.h, k) });

// ---------------------------------------------------------------- init (fonts must be loaded)
let SNAP = null, GRAIN = null, VIG = null, CAPS = null;
const measureCtx = () => canvas(8, 8).getContext('2d');
export function init() {
  const m = measureCtx();
  CAPS = CAPTIONS.map((cp) => layoutCaption(m, cp));
  HOOK_L = layoutHook(m);
  SNAP = {};
  const snap = (key, w, h, fn) => { const cv = canvas(w, h), x = cv.getContext('2d'); fn(x, w, h); SNAP[key] = cv; };
  snap('1991', R43.w, R43.h, (x, w, h) => site91(x, w, h, 0, { snapshot: true }));
  snap('1998', R43.w, R43.h, (x, w, h) => site98(x, w, h, 0, { snapshot: true }));
  snap('2002', R43.w, R43.h, (x, w, h) => site02(x, w, h, 0, { snapshot: true }));
  snap('2007', R1610.w, R1610.h, (x, w, h) => site0715(x, w, h, 2.0, 0, { snapshot: true }));
  snap('2015', R1610.w, R1610.h, (x, w, h) => site0715(x, w, h, 2.0, 1, { snapshot: true }));
  // grain tile + vignette
  GRAIN = canvas(256, 256);
  const g = GRAIN.getContext('2d'), id = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = (hash(i, 777) * 255) | 0; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0);
  VIG = canvas(W, H);
  const v = VIG.getContext('2d'), vg = v.createRadialGradient(W / 2, H * 0.46, H * 0.28, W / 2, H * 0.46, H * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  v.fillStyle = vg; v.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- background glow per era
const GLOWS = () => [
  [S.hook, '#0B1020', 0.0], [S.e91, '#1BFF7A', 0.16], [S.e98, '#FF3DCB', 0.22], [S.e02, '#FF8A1F', 0.18],
  [S.e07, '#22C3EE', 0.2], [S.e15, '#2E86DE', 0.22], [S.e23, '#3B82F6', 0.25], [S.close, '#2563EB', 0.2],
];
function glowAt(t) {
  const GL = GLOWS();
  let i = 0; while (i < GL.length - 1 && t >= GL[i + 1][0]) i++;
  const cur = GL[i], prev = GL[Math.max(0, i - 1)];
  const k = prog(t, cur[0] - 0.3, cur[0] + 0.3, ease.inOutCubic);
  return [mix(prev[1], cur[1], k), lerp(prev[2], cur[2], k)];
}
function drawBG(c, t) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const [col, a] = glowAt(t);
  if (a <= 0.001) return;
  let g = c.createRadialGradient(540, 805, 0, 540, 805, 860);
  g.addColorStop(0, css(col, a)); g.addColorStop(0.55, css(col, a * 0.35)); g.addColorStop(1, css(col, 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createRadialGradient(540, 1750, 0, 540, 1750, 800);
  g.addColorStop(0, css(col, a * 0.5)); g.addColorStop(1, css(col, 0));
  c.fillStyle = g; c.fillRect(0, 900, W, H - 900);
}

// ---------------------------------------------------------------- odometer (narrator)
function drawOdometer(c, t) {
  const inP = prog(t, S.e91, S.e91 + 0.55, ease.outExpo), outP = prog(t, S.close + 0.05, S.close + 0.5, ease.inExpo);
  if (inP <= 0 || outP >= 1) return;
  const Y = keys(t, YEAR_K), size = 176, slot = size * 0.6, top = 186, lh = size * 1.02;
  const x0 = W / 2 - slot * 2;
  const rise = (1 - inP) * lh - outP * lh;
  setFont(c, F.it, size, 800, 'normal', 0);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.save(); c.beginPath(); c.rect(0, top - 6, W, lh + 12); c.clip();
  for (let i = 0; i < 4; i++) {
    const p = 3 - i, base = Math.pow(10, p);
    let pos = p === 0 ? Y : Math.floor(Y / base) + clamp((Y % base) - (base - 1), 0, 1);
    const d = Math.floor(pos) % 10, f = pos - Math.floor(pos);
    const cx = x0 + slot * (i + 0.5);
    c.fillStyle = '#F5F5F5';
    const by = top + size * 0.86 + rise;
    c.fillText(String(d), cx, by - f * lh);
    if (f > 0.001) c.fillText(String((d + 1) % 10), cx, by + (1 - f) * lh);
  }
  c.restore();
  // era label
  setFont(c, F.it, 40, 500, 'normal', -0.4);
  let li = 0; while (li < LABELS.length - 1 && t >= LABELS[li + 1][0] - 0.25) li++;
  const lt0 = LABELS[li][0] - 0.25, k = prog(t, lt0, lt0 + 0.45, ease.outExpo);
  c.save(); c.beginPath(); c.rect(0, top + lh + 4, W, 64); c.clip();
  const ly = top + lh + 50 + rise * 0.4;
  c.fillStyle = css('#9CA3AF', inP * (1 - outP));
  c.fillText(LABELS[li][1], W / 2, ly + (1 - k) * 60);
  if (li > 0 && k < 1) c.fillText(LABELS[li - 1][1], W / 2, ly - k * 60);
  c.restore();
  c.textAlign = 'left';
}

// ---------------------------------------------------------------- captions
const STYLE = {
  term: { fam: F.vt, size: 74, wt: 400, lh: 0.98, track: 0 },
  rainbow: { fam: F.comic, size: 60, wt: 700, lh: 1.14, track: 0 },
  chrome: { fam: F.exo, size: 62, wt: 800, lh: 1.12, track: -0.5, style: 'italic' },
  glossy: { fam: F.arimo, size: 66, wt: 700, lh: 1.14, track: -1 },
  flat: { fam: F.mont, size: 60, wt: 700, lh: 1.42, track: -0.5 },
  brand: { fam: F.it, size: 64, wt: 700, lh: 1.1, track: -1.9 },
};
const CAP_X = 90, CAP_W = 840, CAP_TOP = 1236;

function layoutCaption(m, cp) {
  const st = { ...STYLE[cp.style] }; if (cp.size) st.size = cp.size;
  setFont(m, st.fam, st.size, st.wt, st.style ?? 'normal', st.track);
  if (cp.fit) { // shrink until every forced line fits
    const widest = Math.max(...cp.beats.flatMap(([tx]) => tx.split('\n').map((l) => m.measureText(l).width)));
    if (widest > cp.fit) { st.size = Math.floor(st.size * cp.fit / widest); st.track = st.track * st.size / (cp.size ?? st.size); setFont(m, st.fam, st.size, st.wt, st.style ?? 'normal', st.track); }
  }
  const lines = []; let gi = 0;
  cp.beats.forEach(([text, at], bi) => {
    text.split('\n').flatMap((part) => wrap(m, part, cp.fit ?? CAP_W)).forEach((ln, j) => {
      const xs = charXs(m, ln), wdt = m.measureText(ln).width;
      lines.push({ text: ln, xs, w: wdt, beat: bi, j, at: cp.t0 + at, g0: gi });
      gi += ln.length;
    });
  });
  const lh = st.size * st.lh, top = cp.top ?? CAP_TOP;
  lines.forEach((l, i) => { l.y = top + st.size * 0.82 + i * lh; l.x = cp.center ? W / 2 - l.w / 2 : CAP_X; l.i = i; });
  // chars of a beat are counted from the beat's first line
  cp.beats.forEach((_, bi) => { let n = 0; lines.filter((l) => l.beat === bi).forEach((l) => { l.b0 = n; n += l.text.length + 1; }); });
  return { ...cp, st, lines, lh };
}

function capFall(cap, gi, t) {
  const o = cap.out + hash(gi, 5) * 0.16;
  const u = inv(o, o + 0.34, t);
  return u;
}
function drawCaption(c, cap, t) {
  if (t < cap.t0 + cap.beats[0][1] - 0.01 || t > cap.out + 0.6) return;
  const { st, lines } = cap;
  setFont(c, st.fam, st.size, st.wt, st.style ?? 'normal', st.track);
  c.textBaseline = 'alphabetic';
  const tq = fq(t);
  switch (cap.style) {
    case 'term': {
      const cps = TERM_CPS;
      c.save(); c.shadowColor = PHOS_GLOW; c.shadowBlur = 18; c.fillStyle = PHOS;
      let curX = null, curY = null, allDone = true;
      for (const l of lines) {
        const n = Math.floor((tq - l.at) * cps) - l.b0;
        const vis = clamp(n, 0, l.text.length);
        if (n < l.text.length) allDone = false;
        for (let i = 0; i < vis; i++) {
          const gi = l.g0 + i, u = capFall(cap, gi, t);
          if (u >= 1) continue;
          c.globalAlpha = 1 - u;
          c.fillText(l.text[i], l.x + l.xs[i] + (hash(gi, 9) - 0.5) * 60 * u, l.y + u * u * 520);
        }
        if (vis > 0 && (n < l.text.length + 2 || l === lines[lines.length - 1])) { curX = l.x + (vis < l.text.length ? l.xs[vis] : l.w) + 4; curY = l.y; }
      }
      c.globalAlpha = 1;
      if (curX !== null && t < cap.out && (!allDone || Math.floor(tq * 2.4) % 2 === 0)) c.fillRect(curX, curY - st.size * 0.66, st.size * 0.42, st.size * 0.74);
      c.restore();
      break;
    }
    case 'rainbow': {
      const step = Math.floor(tq * 12 + 1e-6);
      for (const l of lines) for (let i = 0; i < l.text.length; i++) {
        const gi = l.g0 + i, ta = l.at + (l.b0 + i) * 0.02, p = inv(ta, ta + 0.24, t);
        if (p <= 0 || l.text[i] === ' ') continue;
        const u = capFall(cap, gi, t); if (u >= 1) continue;
        const s = ease.outBackBig(p), x = l.x + l.xs[i], y = l.y + Math.sin(step * 0.8 + gi * 0.55) * 5 + u * u * 520;
        c.save(); c.translate(x + 16, y - 20); c.scale(s, s); c.rotate(u * (hash(gi, 3) - 0.5) * 4); c.translate(-16, 20);
        c.globalAlpha = 1 - u;
        c.fillStyle = '#000'; c.fillText(l.text[i], 5, 5);
        c.fillStyle = `hsl(${(gi * 23 + step * 28) % 360},100%,62%)`; c.fillText(l.text[i], 0, 0);
        c.restore();
      }
      break;
    }
    case 'chrome': {
      for (const l of lines) {
        const g = c.createLinearGradient(0, l.y - st.size * 0.78, 0, l.y + 4);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.46, '#D9E0E8'); g.addColorStop(0.52, '#66707D'); g.addColorStop(0.7, '#AAB3BE'); g.addColorStop(1, '#F4F6F9');
        for (let i = 0; i < l.text.length; i++) {
          if (l.text[i] === ' ') continue;
          const gi = l.g0 + i, ta = l.at + (l.b0 + i) * 0.014, p = prog(t, ta, ta + 0.5, ease.outExpo);
          if (p <= 0) continue;
          const u = capFall(cap, gi, t); if (u >= 1) continue;
          const ox = (hash(gi, 31) - 0.5) * 700, oy = (hash(gi, 32) - 0.5) * 600, r = (hash(gi, 33) - 0.5) * 3;
          c.save();
          c.translate(l.x + l.xs[i] + ox * (1 - p), l.y + oy * (1 - p) + u * u * 520);
          c.rotate(r * (1 - p) + u * r); const s = 1 + 1.6 * (1 - p); c.scale(s, s);
          c.globalAlpha = p * (1 - u);
          c.fillStyle = '#1B1F26'; c.fillText(l.text[i], 2, 3);
          c.translate(0, -l.y); c.fillStyle = g; c.fillText(l.text[i], 0, l.y);
          c.restore();
        }
      }
      // glint sweep
      const gp = ((t - cap.t0 - 1.9) % 1.7) / 0.7;
      if (t > cap.t0 + 1.9 && gp > 0 && gp < 1 && t < cap.out) {
        c.save();
        const bx = -200 + gp * (W + 400);
        c.beginPath(); c.moveTo(bx, 1150); c.lineTo(bx + 70, 1150); c.lineTo(bx - 130, 1560); c.lineTo(bx - 200, 1560); c.closePath(); c.clip();
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (const l of lines) c.fillText(l.text, l.x, l.y);
        c.restore();
      }
      break;
    }
    case 'glossy': {
      const fo = 1 - prog(t, cap.out, cap.out + 0.45, ease.inOutCubic);
      for (const l of lines) {
        const p = prog(t, l.at + l.i * 0.09, l.at + l.i * 0.09 + 0.6, ease.outExpo);
        if (p <= 0) continue;
        const y = l.y + (1 - p) * 34;
        c.save(); c.globalAlpha = p * fo;
        c.fillStyle = 'rgba(0,20,40,0.55)'; c.fillText(l.text, l.x, y + 4);
        const g = c.createLinearGradient(0, y - st.size * 0.78, 0, y + 6);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#EAF6FD'); g.addColorStop(0.5, '#BFE6F8'); g.addColorStop(1, '#8FD3F2');
        c.fillStyle = g; c.fillText(l.text, l.x, y);
        c.restore();
        if (l === lines[lines.length - 1]) {
          c.save(); c.globalAlpha = p * fo * (1 - prog(t, cap.out - 0.1, cap.out + 0.2));
          c.translate(0, y + 14); c.scale(1, -0.7);
          const rg = c.createLinearGradient(0, 0, 0, -st.size * 0.8);
          rg.addColorStop(0, 'rgba(143,211,242,0.32)'); rg.addColorStop(1, 'rgba(143,211,242,0)');
          c.fillStyle = rg; c.fillText(l.text, l.x, 0);
          c.restore();
        }
      }
      break;
    }
    case 'flat': {
      const fo = prog(t, cap.out, cap.out + 0.35, ease.inExpo);
      for (const l of lines) {
        const a0 = l.at + l.j * 0.1, p = prog(t, a0, a0 + 0.34, ease.outExpo);
        if (p <= 0) continue;
        const padX = 20, bh = st.size * 1.3, by = l.y - st.size * 0.98;
        const bw = (l.w + padX * 2) * p, x0 = l.x - padX + (l.w + padX * 2) * fo;
        const vw = Math.max(0, bw - (l.w + padX * 2) * fo);
        if (vw <= 0.5) continue;
        c.fillStyle = l.beat === 0 ? '#1F3A5F' : '#2E86DE';
        c.fillRect(x0, by, vw, bh);
        c.save(); c.beginPath(); c.rect(x0, by, vw, bh); c.clip();
        c.fillStyle = '#FFFFFF'; c.fillText(l.text, l.x, l.y);
        c.restore();
      }
      break;
    }
    case 'brand': {
      const op = prog(t, cap.out, cap.out + 0.5, ease.inExpo);
      for (const l of lines) {
        const a0 = l.at + l.j * 0.09, p = prog(t, a0, a0 + 0.7, ease.outExpo);
        if (p <= 0) continue;
        const boxT = l.y - st.size * 0.98, boxH = st.size * 1.3;
        c.save(); c.beginPath(); c.rect(0, boxT, W, boxH); c.clip();
        c.fillStyle = '#F5F5F5';
        c.fillText(l.text, l.x, l.y + (1 - p) * boxH - op * boxH);
        c.restore();
      }
      break;
    }
  }
}

// ---------------------------------------------------------------- styled word (hook)
const HOOK_LINES = [['Kenapa', 'desain'], ['website', 'terus'], ['berubah?']];
const HOOK_SIZE = 146;
let HOOK_L = null;
function layoutHook(m) {
  setFont(m, F.it, HOOK_SIZE, 800, 'normal', -5);
  const words = [], lh = HOOK_SIZE * 1.0, top = 700;
  const sp = m.measureText(' ').width;
  HOOK_LINES.forEach((ln, li) => {
    const ws = ln.map((w) => m.measureText(w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
    let x = W / 2 - tot / 2;
    ln.forEach((w, j) => { words.push({ w, x, cx: x + ws[j] / 2, y: top + li * lh, width: ws[j] }); x += ws[j] + sp; });
  });
  return words;
}
const HSTY = ['term', 'rainbow', 'chrome', 'glossy', 'flat'];
const HCOL = { term: '#1BFF7A', rainbow: '#FF3DCB', chrome: '#FF8A1F', glossy: '#22C3EE', flat: '#2E86DE', brand: '#3B82F6' };
function drawStyledWord(c, wd, sty, t, alpha = 1, chars = null) {
  const text = chars === null ? wd.w : wd.w.slice(0, chars);
  c.save(); c.globalAlpha = alpha; c.textBaseline = 'alphabetic'; c.textAlign = 'center';
  const cx = wd.cx, y = wd.y;
  const step = Math.floor(fq(t) * 12);
  if (sty !== 'brand') {
    const f = { term: [F.vt, 1.2, 400], rainbow: [F.comic, 0.98, 700], chrome: [F.exo, 1, 800, 'italic'], glossy: [F.nunito, 1, 900], flat: [F.mont, 0.82, 700] }[sty];
    setFont(c, f[0], HOOK_SIZE * f[1], f[2], f[3] ?? 'normal');
    const sw = c.measureText(wd.w).width + (sty === 'flat' ? 36 : 0), k = Math.min(1, (wd.width * 1.04) / sw);
    c.translate(cx, y); c.scale(k, k); c.translate(-cx, -y);
  }
  switch (sty) {
    case 'term':
      setFont(c, F.vt, HOOK_SIZE * 1.2, 400); c.shadowColor = PHOS_GLOW; c.shadowBlur = 20; c.fillStyle = PHOS; c.fillText(text, cx, y); break;
    case 'rainbow': {
      setFont(c, F.comic, HOOK_SIZE * 0.98, 700); c.textAlign = 'left';
      let x = cx - c.measureText(text).width / 2;
      for (let i = 0; i < text.length; i++) {
        const cw = c.measureText(text.slice(0, i + 1)).width - c.measureText(text.slice(0, i)).width;
        c.fillStyle = '#000'; c.fillText(text[i], x + 7, y + 7);
        c.fillStyle = `hsl(${(i * 40 + step * 30) % 360},100%,62%)`; c.fillText(text[i], x, y + Math.sin(i + step) * 6);
        x += cw;
      }
      break;
    }
    case 'chrome': {
      setFont(c, F.exo, HOOK_SIZE, 800, 'italic');
      const g = c.createLinearGradient(0, y - HOOK_SIZE * 0.75, 0, y + 6);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.46, '#D9E0E8'); g.addColorStop(0.52, '#5C6673'); g.addColorStop(1, '#EEF1F5');
      c.fillStyle = '#FF8A1F'; c.fillText(text, cx + 3, y + 4); c.fillStyle = g; c.fillText(text, cx, y); break;
    }
    case 'glossy': {
      setFont(c, F.nunito, HOOK_SIZE, 900, 'normal', -3);
      const g = c.createLinearGradient(0, y - HOOK_SIZE * 0.75, 0, y + 6);
      g.addColorStop(0, '#E9FAFF'); g.addColorStop(0.5, '#7FDBFA'); g.addColorStop(0.5, '#1FA7E0'); g.addColorStop(1, '#0E7FB5');
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(text, cx, y + 6); c.fillStyle = g; c.fillText(text, cx, y); break;
    }
    case 'flat': {
      setFont(c, F.mont, HOOK_SIZE * 0.82, 700, 'normal', -2);
      const tw = c.measureText(text).width;
      c.fillStyle = '#2E86DE'; c.fillRect(cx - tw / 2 - 18, y - HOOK_SIZE * 0.8, tw + 36, HOOK_SIZE * 1.0);
      c.fillStyle = '#FFF'; c.fillText(text, cx, y - 6); break;
    }
    default:
      setFont(c, F.it, HOOK_SIZE, 800, 'normal', -5); c.fillStyle = '#F5F5F5'; c.textAlign = 'left'; c.fillText(text, wd.x, y);
  }
  c.restore();
}
function drawHook(c, t) {
  if (t > S.e91 + 0.02) return;
  const words = HOOK_L;
  const tq = fq(t);
  // style flash behind
  let flash = null;
  words.forEach((wd, i) => {
    const a0 = HOOK.arrive(i), lock = HOOK.lock(i);
    if (tq >= a0 && tq < lock) flash = HSTY[(Math.floor((tq - a0) * 12) + i * 2) % 5];
  });
  if (flash) {
    const g = c.createRadialGradient(540, 820, 0, 540, 820, 900);
    g.addColorStop(0, css(HCOL[flash], 0.16)); g.addColorStop(1, css(HCOL[flash], 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  // backspace phase
  const { bs0, bs1 } = HOOK;
  const totalChars = words.reduce((a, w) => a + w.w.length, 0);
  let keep = totalChars;
  if (t >= bs0) keep = Math.max(0, totalChars - Math.floor(((tq - bs0) / (bs1 - bs0)) * totalChars));
  let left = keep, cur = null;
  words.forEach((wd, i) => {
    const a0 = HOOK.arrive(i), lock = HOOK.lock(i);
    const p = prog(t, a0, a0 + 0.16, ease.outCubic);
    if (p <= 0) return;
    const n = clamp(left, 0, wd.w.length); left -= wd.w.length;
    if (n <= 0) return;
    const sty = tq < lock ? HSTY[(Math.floor((tq - a0) * 12) + i * 2) % 5] : 'brand';
    const s = lerp(1.22, 1, p);
    c.save(); c.translate(wd.cx, wd.y - 40); c.scale(s, s); c.translate(-wd.cx, -(wd.y - 40));
    drawStyledWord(c, wd, sty, t, p, n < wd.w.length ? n : null);
    c.restore();
    if (t >= bs0) {
      setFont(c, F.it, HOOK_SIZE, 800, 'normal', -5);
      cur = [wd.x + c.measureText(wd.w.slice(0, n)).width + 8, wd.y];
    }
  });
  // cursor → CRT line
  if (t >= bs0) {
    const first = words[0];
    if (!cur) cur = [first.x, first.y];
    const k = prog(t, bs1, S.e91, ease.inOutCubic);
    const cw = 50, ch = HOOK_SIZE * 0.78;
    const x = lerp(cur[0], W / 2 - cw / 2, k), y = lerp(cur[1] - ch, 805 - 4, k), hh = lerp(ch, 8, k), ww = lerp(cw, 70, k);
    const on = t >= bs1 || Math.floor(tq * 8) % 2 === 0;
    if (on) { c.save(); c.shadowColor = PHOS_GLOW; c.shadowBlur = 24; c.fillStyle = PHOS; c.fillRect(x, y, ww, hh); c.restore(); }
  }
}

// ---------------------------------------------------------------- screen (device + site)
function withClip(c, R, r, fn) {
  c.save(); rr(c, R.x, R.y, R.w, R.h, r); c.clip(); c.translate(R.x, R.y); fn(); c.restore();
}
function drawScreen(c, t) {
  if (t < S.e91 || t >= S.close + 1.15) return;
  // ---- 1991 power-on
  if (t < TR.t1[0]) {
    const lt = t - S.e91;
    const px = prog(lt, 0, 0.16, ease.outExpo), py = prog(lt, 0.12, 0.42, ease.outExpo);
    const ba = prog(lt, 0.05, 0.5, ease.outCubic);
    const bz = BEZEL.crt91;
    c.save(); c.translate(540, 805); const s = lerp(0.94, 1, ba); c.scale(s, s); c.translate(-540, -805);
    drawBezel(c, R43, bz, ba);
    const w = lerp(70, R43.w, px), h = lerp(8, R43.h, py);
    const R = { x: 540 - w / 2, y: 805 - h / 2, w, h };
    withClip(c, R, bz.ir * py, () => {
      c.translate(-(R.x - R43.x), -(R.y - R43.y));
      site91(c, R43.w, R43.h, lt);
    });
    const fl = (1 - py) * (px > 0 ? 1 : 0);
    if (fl > 0.01) { c.fillStyle = css('#DFFFE9', fl); c.fillRect(R.x, R.y, R.w, R.h); }
    c.restore();
    return;
  }
  // ---- T1 dissolve 1991 → 1998
  if (t < TR.t1[1]) {
    const k = prog(t, TR.t1[0], TR.t1[1], ease.inOutCubic);
    const bz = mixBezel(BEZEL.crt91, BEZEL.crt98, k);
    drawBezel(c, R43, bz);
    withClip(c, R43, bz.ir, () => {
      site91(c, R43.w, R43.h, t - S.e91);
      const B = 20, cols = Math.ceil(R43.w / B), rows = Math.ceil(R43.h / B), p = fq(inv(TR.t1[0], TR.t1[1], t));
      c.beginPath();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const d = hash2i(i, j) * 0.8 + (j / rows) * 0.2;
        if (d < p) c.rect(i * B, j * B, B, B);
      }
      c.save(); c.clip(); site98(c, R43.w, R43.h, t - S.e98); c.restore();
    });
    return;
  }
  // ---- 1998
  if (t < TR.t2[0]) {
    drawBezel(c, R43, BEZEL.crt98);
    withClip(c, R43, BEZEL.crt98.ir, () => site98(c, R43.w, R43.h, t - S.e98));
    return;
  }
  // ---- T2 iris 1998 → 2002
  if (t < TR.t2[1]) {
    const k = prog(t, TR.t2[0], TR.t2[1], ease.inOutCubic);
    const bz = mixBezel(BEZEL.crt98, BEZEL.lcd02, k);
    drawBezel(c, R43, bz);
    withClip(c, R43, bz.ir, () => {
      site02(c, R43.w, R43.h, t - S.e02);
      const r = lerp(600, 0, prog(t, TR.t2[0], TR.t2[1] - 0.05, ease.inCubic));
      if (r > 0.5) {
        c.save(); c.beginPath(); c.arc(R43.w / 2, R43.h / 2, r, 0, TAU); c.clip();
        site98(c, R43.w, R43.h, t - S.e98); c.restore();
        c.beginPath(); c.arc(R43.w / 2, R43.h / 2, r, 0, TAU); c.strokeStyle = '#FFFF00'; c.lineWidth = 6; c.stroke();
      }
    });
    return;
  }
  // ---- 2002
  if (t < TR.t3[0]) {
    drawBezel(c, R43, BEZEL.lcd02);
    withClip(c, R43, BEZEL.lcd02.ir, () => site02(c, R43.w, R43.h, t - S.e02));
    return;
  }
  // ---- T3 click → flash → 16:10 glossy
  if (t < TR.t3[1]) {
    const k = prog(t, TR.t3[0] + 0.03, TR.t3[1], ease.outExpo);
    const R = lerpR(R43, R1610, k), bz = mixBezel(BEZEL.lcd02, BEZEL.gl07, k);
    drawBezel(c, R, bz);
    withClip(c, R, bz.ir, () => {
      if (t < TR.t3[0] + 0.09) { c.scale(R.w / R43.w, R.h / R43.h); site02(c, R43.w, R43.h, t - S.e02); }
      else { c.scale(R.w / R1610.w, R.h / R1610.h); site0715(c, R1610.w, R1610.h, t - S.e07, 0); }
    });
    const fl = keys(t, [[TR.t3[0], 0], [TR.t3[0] + 0.06, 1, ease.outCubic], [TR.t3[0] + 0.3, 0, ease.inOutCubic]]);
    if (fl > 0.001) {
      const bx = R43.x + SKIP02.x + SKIP02.w / 2, by = R43.y + SKIP02.y + SKIP02.h / 2;
      const g = c.createRadialGradient(bx, by, 0, bx, by, 1400);
      g.addColorStop(0, css('#FFFFFF', fl)); g.addColorStop(0.5, css('#FFF6E8', fl * 0.9)); g.addColorStop(1, css('#FFFFFF', fl * 0.2));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    return;
  }
  // ---- 2007 · morph · 2015
  if (t < TR.t5[0]) {
    const k = prog(t, TR.t4[0], TR.t4[1], ease.lin);
    const bz = mixBezel(BEZEL.gl07, BEZEL.al15, ease.inOutCubic(k));
    drawBezel(c, R1610, bz);
    withClip(c, R1610, bz.ir, () => site0715(c, R1610.w, R1610.h, t - S.e07, k));
    return;
  }
  // ---- T5 expand to full-bleed 2023
  if (t < TR.t5[1]) {
    const k = prog(t, TR.t5[0], TR.t5[1], ease.inOutExpo);
    const R = lerpR(R1610, RFULL, k), bz = mixBezel(BEZEL.al15, BEZEL.none, k);
    drawBezel(c, R, bz);
    const rad = lerp(bz.ir, 0, k);
    withClip(c, R, rad, () => {
      c.fillStyle = '#2E86DE'; c.fillRect(0, 0, R.w, R.h);
      const a23 = prog(t, TR.t5[0] + 0.4, TR.t5[1], ease.inOutCubic);
      const a15 = 1 - prog(t, TR.t5[0], TR.t5[0] + 0.22, ease.inOutCubic);
      if (a15 > 0) {
        c.save(); c.globalAlpha = a15; c.scale(R.w / R1610.w, R.w / R1610.w);
        site0715(c, R1610.w, R1610.h, t - S.e07, 1);
        c.restore();
      }
      if (a23 > 0) { c.save(); c.globalAlpha = a23; c.translate(-R.x, -R.y); site23(c, W, H, t - S.e23); c.restore(); }
    });
    return;
  }
  // ---- 2023 full-bleed (closing pull-back handled in drawClosing)
  if (t < S.close) { site23(c, W, H, t - S.e23); }
}
const hash2i = (i, j) => hash(i * 131 + j * 7919, 42);

// ---------------------------------------------------------------- 2007 annotation (narrator layer)
// "tombol harus kelihatan bisa dipencet": labels pin what makes the button look pressable. The flattening morph
// then strikes them out one by one — the decoration is what gets removed.
const TAGS07 = [['kilap', [338, 884], [452, 866]], ['bayangan', [348, 942], [452, 918]], ['pantulan', [236, 680], [410, 720]]]; // label, pin, pill (screen px)
function drawTags07(c, t) {
  const t0 = S.e07 + CUE.tags07;
  if (t < t0 || t > TR.t4[0] + 0.7) return;
  setFont(c, F.it, 27, 700, 'normal', -0.3);
  c.textBaseline = 'middle';
  TAGS07.forEach(([label, [px, py], [bx, by]], i) => {
    const a = t0 + i * 0.28, line = prog(t, a, a + 0.22, ease.outCubic), pop = prog(t, a + 0.12, a + 0.42, ease.outBack);
    if (line <= 0) return;
    const strike = prog(t, TR.t4[0] + i * 0.07, TR.t4[0] + 0.22 + i * 0.07, ease.inOutCubic);
    const pw = c.measureText(label).width + 36, ph = 44, pulse = ((t - a) * 1.2) % 1;
    c.save(); c.globalAlpha = 1 - prog(t, TR.t4[0] + 0.32, TR.t4[0] + 0.62);
    c.strokeStyle = 'rgba(245,245,245,0.9)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(px, py); c.lineTo(lerp(px, bx, line), lerp(py, by, line)); c.stroke();
    c.fillStyle = '#60A5FA'; c.beginPath(); c.arc(px, py, 7, 0, TAU); c.fill();
    c.strokeStyle = css('#60A5FA', 0.8 * (1 - pulse)); c.lineWidth = 2; c.beginPath(); c.arc(px, py, 7 + pulse * 16, 0, TAU); c.stroke();
    if (pop > 0) {
      c.translate(bx, by); c.scale(pop, pop);
      rr(c, 0, -ph / 2, pw, ph, ph / 2); c.fillStyle = 'rgba(8,12,24,0.86)'; c.fill(); c.strokeStyle = '#60A5FA'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#F5F5F5'; c.fillText(label, 18, 1);
      if (strike > 0) { c.strokeStyle = '#F5F5F5'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(12, 1); c.lineTo(12 + (pw - 24) * strike, 1); c.stroke(); }
    }
    c.restore();
  });
  c.textBaseline = 'alphabetic';
}

// ---------------------------------------------------------------- closing
const SLOT = (i) => ({ x: i % 2 ? 560 : 120, y: 190 + Math.floor(i / 2) * 316, w: 400, h: 280 });
const CARD_KEYS = ['1991', '1998', '2002', '2007', '2015', '2023'];
const CROP23 = { x: 40, y: 380, w: 1000, h: 700 };
const LOGO_C = [540, 770], LOGO_S = 0.8;
const ARROW = new Path2D('M200,172 L330,247 L200,327 L234,247 Z');

function drawCard(c, key, R, alpha = 1, dim = 0) {
  const img = SNAP[key];
  c.save(); c.globalAlpha = alpha;
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
  rr(c, R.x, R.y, R.w, R.h, 22); c.fillStyle = '#111'; c.fill();
  c.restore();
  c.save(); c.globalAlpha = alpha;
  rr(c, R.x, R.y, R.w, R.h, 22); c.clip();
  const s = Math.max(R.w / img.width, R.h / img.height);
  c.drawImage(img, R.x + (R.w - img.width * s) / 2, R.y + (R.h - img.height * s) / 2, img.width * s, img.height * s);
  if (dim > 0) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(R.x, R.y, R.w, R.h); }
  c.restore();
  cardChrome(c, key, R, alpha);
}
function cardChrome(c, key, R, alpha) {
  c.save(); c.globalAlpha = alpha;
  rr(c, R.x + 0.75, R.y + 0.75, R.w - 1.5, R.h - 1.5, 22); c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1.5; c.stroke();
  setFont(c, F.it, 28, 700, 'normal', -0.6);
  const tw = c.measureText(key).width;
  rr(c, R.x + 16, R.y + R.h - 60, tw + 32, 44, 22); c.fillStyle = 'rgba(0,0,0,0.62)'; c.fill();
  c.fillStyle = '#F5F5F5'; c.textBaseline = 'middle'; c.fillText(key, R.x + 32, R.y + R.h - 37); c.textBaseline = 'alphabetic';
  c.restore();
}
function arrowPath(u) { // position of the brand arrow along its flight, u in [0,1]
  const p0 = [-240, 1160], p1 = [260, 1180], p2 = [LOGO_C[0] - 140, LOGO_C[1] + 40], p3 = [LOGO_C[0] + 16 * LOGO_S, LOGO_C[1]];
  const m = 1 - u;
  return [m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1]];
}
function drawClosing(c, t) {
  const u = t - S.close;
  if (u < 0) return;
  const v = u - (CUE.closeE || 0); // brand sequence clock: waits for the narration to finish
  // background: black void + brand glows
  const glowK = prog(v, 5.9, 7.2, ease.outCubic);
  let g = c.createRadialGradient(LOGO_C[0], LOGO_C[1], 0, LOGO_C[0], LOGO_C[1], 900);
  g.addColorStop(0, css('#3B82F6', 0.06 + 0.3 * glowK)); g.addColorStop(0.45, css('#2563EB', 0.03 + 0.12 * glowK)); g.addColorStop(1, css('#2563EB', 0));
  c.fillStyle = g; c.fillRect(0, 0, W, H);

  const push = 1 + 0.035 * prog(v, 6.4, 9.6, ease.outCubic);
  c.save(); c.translate(540, 900); c.scale(push, push); c.translate(-540, -900);

  // ---- cards
  const absorb = (i) => prog(v, 5.22 + i * 0.04, 5.85 + i * 0.03, ease.inCubic);
  const ringP = (uu) => clamp((uu - 1.7) / CUE.hopStep, 0, 5.999);
  const hop = u >= 1.7 && u < CUE.hopEnd + 0.34 ? ringP(u) : -1;
  const ringA = prog(u, 1.55, 1.8) * (1 - prog(u, CUE.hopEnd + 0.04, CUE.hopEnd + 0.39));
  for (let i = 0; i < 6; i++) {
    const slot = SLOT(i), ab = absorb(i);
    if (ab >= 1) continue;
    const dim = ringA * (Math.floor(hop) === i ? 0 : 0.45);
    if (i === 5) {
      // live 2023 pull-back
      const k = prog(u, 0, 1.05, ease.inOutExpo);
      let D = lerpR(RFULL, slot, k);
      const Sx = lerpR(RFULL, CROP23, k);
      c.save();
      if (ab > 0) absorbT(c, D, ab, i);
      rr(c, D.x, D.y, D.w, D.h, lerp(0, 22, k)); c.clip();
      const sc = Math.max(D.w / Sx.w, D.h / Sx.h);
      c.translate(D.x + D.w / 2, D.y + D.h / 2); c.scale(sc, sc); c.translate(-(Sx.x + Sx.w / 2), -(Sx.y + Sx.h / 2));
      site23(c, W, H, t - S.e23);
      c.restore();
      c.save(); if (ab > 0) absorbT(c, D, ab, i);
      if (dim > 0) { rr(c, D.x, D.y, D.w, D.h, 22); c.fillStyle = `rgba(0,0,0,${dim})`; c.fill(); }
      cardChrome(c, '2023', D, prog(u, 0.7, 1.1));
      c.restore();
      continue;
    }
    const a0 = 0.2 + i * 0.08, p = prog(u, a0, a0 + 0.8, ease.outExpo);
    if (p <= 0) continue;
    const fromY = 1200 + hash(i, 3) * 400, fromX = (hash(i, 4) - 0.5) * 600, rot = (hash(i, 5) - 0.5) * 0.6;
    const R = { x: slot.x + fromX * (1 - p), y: slot.y + fromY * (1 - p), w: slot.w, h: slot.h };
    c.save();
    c.translate(R.x + R.w / 2, R.y + R.h / 2); c.rotate(rot * (1 - p)); c.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
    if (ab > 0) absorbT(c, R, ab, i);
    drawCard(c, CARD_KEYS[i], R, 1, dim);
    c.restore();
  }
  // selection ring hopping
  if (ringA > 0 && hop >= 0) {
    const j = Math.floor(hop), f = ease.outExpo(clamp((hop - j) * 2.2));
    const A = SLOT(Math.max(0, j - 1)), B = SLOT(j), R = j === 0 ? B : lerpR(A, B, f);
    c.save(); c.globalAlpha = ringA;
    c.shadowColor = 'rgba(59,130,246,0.9)'; c.shadowBlur = 30;
    rr(c, R.x - 10, R.y - 10, R.w + 20, R.h + 20, 30); c.strokeStyle = '#3B82F6'; c.lineWidth = 5; c.stroke();
    c.restore();
  }
  c.restore();

  // ---- brand arrow flight
  const fl = prog(v, 5.15, 6.05, ease.outCubic);
  const landed = v >= 6.05;
  if (v > 5.15) {
    // trail
    if (!landed || v < 6.4) {
      const ta = landed ? 1 - prog(v, 6.05, 6.4) : 1;
      for (let s = 0; s < 18; s++) {
        const ua = clamp(fl - (s + 1) * 0.014), ub = clamp(fl - s * 0.014);
        if (ub <= 0) break;
        const [x1, y1] = arrowPath(ease.outCubic(ua)), [x2, y2] = arrowPath(ease.outCubic(ub));
        c.strokeStyle = css(mix('#93C5FD', '#2563EB', s / 18), (1 - s / 18) * 0.7 * ta);
        c.lineWidth = (1 - s / 18) * 70 * LOGO_S; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
    }
    const [ax, ay] = arrowPath(ease.outCubic(fl));
    const [bx, by] = arrowPath(ease.outCubic(clamp(fl + 0.01)));
    const ang = landed ? 0 : Math.atan2(by - ay, bx - ax) * (1 - prog(v, 5.8, 6.05));
    const pop = landed ? 1 + 0.18 * (1 - ease.outBack(prog(v, 6.05, 6.35))) : 1;
    c.save(); c.translate(ax, ay); c.rotate(ang); c.scale(LOGO_S * pop, LOGO_S * pop); c.translate(-265, -247);
    c.shadowColor = 'rgba(96,165,250,0.9)'; c.shadowBlur = 40 * (landed ? 1 - prog(v, 6.1, 7) * 0.6 : 1);
    c.fillStyle = '#F5F5F5'; c.fill(ARROW);
    c.restore();
  }
  // ---- logo ring arcs
  const ap = prog(v, 5.95, 6.9, ease.outExpo);
  if (ap > 0) {
    c.save(); c.translate(LOGO_C[0], LOGO_C[1]); c.scale(LOGO_S, LOGO_S); c.translate(-249, -247);
    c.beginPath(); c.rect(-400, -400, 1300, 1300); c.rect(300, 229, 200, 36); c.clip('evenodd');
    c.strokeStyle = '#F5F5F5'; c.lineWidth = 34; c.lineCap = 'butt';
    c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI + Math.PI * ap, false); c.stroke();
    c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI - Math.PI * ap, true); c.stroke();
    c.restore();
  }
  // shockwave
  const sw = prog(v, 6.05, 7.0, ease.outCubic);
  if (sw > 0 && sw < 1) {
    c.beginPath(); c.arc(LOGO_C[0], LOGO_C[1], 120 + sw * 620, 0, TAU);
    c.strokeStyle = css('#60A5FA', 0.85 * (1 - sw)); c.lineWidth = 3 + 6 * (1 - sw); c.stroke();
  }
  // ---- wordmark
  const wp = prog(v, 6.65, 7.4, ease.outExpo);
  if (wp > 0) {
    setFont(c, F.it, 118, 700, 'normal', -118 * 0.045);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const base = 1090, boxT = base - 118, boxH = 118 * 1.35;
    c.save(); c.beginPath(); c.rect(0, boxT, W, boxH); c.clip();
    c.fillStyle = '#F5F5F5'; c.fillText('Beyond Studio', W / 2, base + (1 - wp) * boxH);
    c.restore(); c.textAlign = 'left';
  }
  drawFollow(c, u);
}
// end card call to action: a Follow pill pops in with the line, breathes, then gets tapped as the line ends
function drawFollow(c, u) {
  const fp = prog(u, CUE.cta + 0.1, CUE.cta + 0.5, ease.outBack);
  if (fp <= 0) return;
  const cx = 540, cy = 1345, pw = 330, ph = 88, tap = CUE.ctaTap;
  const press = prog(u, tap - 0.06, tap, ease.outQuad) * (1 - prog(u, tap + 0.05, tap + 0.22, ease.outCubic));
  const done = prog(u, tap + 0.12, tap + 0.4, ease.outExpo);
  if (done < 1) { // "look here" ring
    const r = ((u - CUE.cta) * 0.9) % 1;
    rr(c, cx - pw / 2 - r * 26, cy - ph / 2 - r * 26, pw + r * 52, ph + r * 52, ph / 2 + r * 26);
    c.strokeStyle = css('#60A5FA', 0.55 * (1 - r) * (1 - done) * Math.min(1, fp)); c.lineWidth = 3; c.stroke();
  }
  c.save(); c.translate(cx, cy); const s = fp * (1 - 0.05 * press); c.scale(s, s);
  rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.fillStyle = mixc('#3B82F6', '#111827', done); c.fill();
  if (done > 0) { c.strokeStyle = css('#F5F5F5', 0.3 * done); c.lineWidth = 2; c.stroke(); }
  const rp = inv(tap, tap + 0.55, u);
  if (rp > 0 && rp < 1) {
    c.save(); rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.clip();
    c.beginPath(); c.arc(60, 0, 20 + rp * 300, 0, TAU); c.fillStyle = css('#93C5FD', 0.45 * (1 - rp)); c.fill(); c.restore();
  }
  setFont(c, F.it, 38, 700, 'normal', -0.6); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F5F5F5';
  if (done < 1) { c.globalAlpha = 1 - done; c.fillText('+  Follow', 0, 2 - done * 16); }
  if (done > 0) {
    c.globalAlpha = done; c.fillText('Following', 22, 2 + (1 - done) * 16);
    c.strokeStyle = '#F5F5F5'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-104, 2); c.lineTo(-94, 12); c.lineTo(-76, -8); c.stroke();
  }
  c.restore(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const tp = inv(tap - 0.35, tap + 0.5, u); // finger
  if (tp > 0 && tp < 1) {
    const a = Math.sin(tp * Math.PI), d = (1 - prog(u, tap - 0.35, tap, ease.outCubic)) * 60;
    c.beginPath(); c.arc(cx + 60 + d, cy + d, 36 - 8 * press, 0, TAU); c.fillStyle = css('#FFFFFF', 0.3 * a); c.fill();
    c.strokeStyle = css('#FFFFFF', 0.6 * a); c.lineWidth = 3; c.stroke();
  }
}
function absorbT(c, R, ab, i) {
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  const tx = lerp(cx, LOGO_C[0], ab), ty = lerp(cy, LOGO_C[1], ab);
  c.translate(tx, ty); c.rotate((i - 2.5) * 0.9 * ab); const s = lerp(1, 0.04, ab); c.scale(s, s); c.translate(-cx, -cy);
  c.globalAlpha = 1 - ab * ab;
}

// ---------------------------------------------------------------- frame
export function render(c, t) {
  c.save();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  drawBG(c, t);
  drawHook(c, t);
  drawScreen(c, t);
  drawTags07(c, t);
  drawClosing(c, t);
  drawOdometer(c, t);
  for (const cap of CAPS) drawCaption(c, cap, t);
  c.restore();
}
export function post(c, t) {
  c.save();
  c.drawImage(VIG, 0, 0);
  const pat = c.createPattern(GRAIN, 'repeat');
  const f = fidx(t);
  pat.setTransform(new DOMMatrix([1, 0, 0, 1, Math.floor(hash(f, 1) * 256), Math.floor(hash(f, 2) * 256)]));
  c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.12;
  c.fillStyle = pat; c.fillRect(0, 0, W, H);
  c.restore();
}
