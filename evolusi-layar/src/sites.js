// sites.js — the same coffee shop, "Kopi Pagi", rendered in six eras.
// Every function draws in content-local px (0,0)-(w,h) and depends only on its arguments.
import {
  clamp, lerp, inv, prog, keys, ease, hash, noise1, TAU, fq,
  rgb, mix, css, mixc, rr, star, sparkle, FONTS as F, setFont, canvas,
} from './core.js';
import { CUE } from './timeline.js';

// ======================================================================================
// 1991 — line-mode browser on a phosphor terminal
// ======================================================================================
export const P91A = [
  '                       Kopi Pagi',
  '',
  '           KOPI PAGI',
  '           =========',
  '  Toko kopi kecil di Bandung.',
  '',
  'Buka setiap hari, 06.00-14.00.',
  'Kopi diseduh saat dipesan.',
  '',
  'Menu[1]  Lokasi[2]  Kontak[3]',
  '',
  '1-3, Back, Quit, or Help: ',
];
export const P91B = [
  '                       Kopi Pagi',
  '',
  '             MENU',
  '             ====',
  'Kopi tubruk ........... 1.500',
  'Kopi susu ............. 2.000',
  'Kopi jahe ............. 2.000',
  'Roti bakar ............ 1.000',
  '',
  'Kembali[4]  Kontak[3]',
  '',
  '1-4, Back, Quit, or Help: ',
];
let scan91 = null;
function scanPattern(c) {
  if (!scan91) {
    const cv = canvas(4, 4), x = cv.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,0.34)'; x.fillRect(0, 0, 4, 2);
    scan91 = c.createPattern(cv, 'repeat');
  }
  return scan91;
}
export const PHOS = '#8CFFB4', PHOS_GLOW = 'rgba(40,255,130,0.75)';

// returns printed text lines for a page given how many chars are visible
function printed(lines, n) {
  const out = []; let left = n;
  for (const l of lines) {
    if (left <= 0) break;
    out.push(l.slice(0, left)); left -= l.length + 1;
  }
  return out;
}
const total = (lines) => lines.reduce((a, l) => a + l.length + 1, 0);

export function site91(c, w, h, lt, opt = {}) {
  const tq = fq(lt);
  c.fillStyle = '#03110A'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, 'rgba(30,120,60,0.20)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);

  const size = 50, lh = 50, x0 = 52, y0 = 30;
  setFont(c, F.vt, size, 400);
  c.textBaseline = 'alphabetic';
  // page state
  let lines, n, cursor = true;
  const typed1 = tq >= CUE.key1, flip = CUE.print2;
  if (opt.snapshot) { lines = P91A; n = 1e9; }
  else if (tq < flip) {
    lines = P91A.slice(); n = Math.floor(Math.max(0, tq - CUE.print1) * CUE.print1Cps);
    if (typed1) lines[lines.length - 1] += '1';
  } else { lines = P91B; n = Math.floor(Math.max(0, tq - flip) * CUE.print2Cps); }
  let scrollY = 0;
  if (tq >= CUE.scroll && tq < flip) scrollY = -prog(tq, CUE.scroll, flip, ease.inQuad) * h;
  const vis = printed(lines, n);
  const done = n >= total(lines) - 1;

  c.save();
  c.globalAlpha = 0.965 + 0.035 * hash(Math.round(lt * 60), 91);
  c.shadowColor = PHOS_GLOW; c.shadowBlur = 14;
  c.fillStyle = PHOS;
  vis.forEach((l, i) => c.fillText(l, x0, y0 + scrollY + (i + 1) * lh));
  // cursor
  const li = Math.max(0, vis.length - 1), last = vis[li] ?? '';
  const blinkOn = !done || Math.floor(tq * 2.4) % 2 === 0;
  if (cursor && blinkOn && !(tq >= 2.62 && tq < flip + 0.02)) {
    const cx = x0 + c.measureText(last).width + 3;
    c.fillRect(cx, y0 + scrollY + (li + 1) * lh - size * 0.72, size * 0.46, size * 0.8);
  }
  c.restore();

  // scanlines + tube vignette
  c.fillStyle = scanPattern(c); c.fillRect(0, 0, w, h);
  const v = c.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)');
  c.fillStyle = v; c.fillRect(0, 0, w, h);
}

// ======================================================================================
// 1998 — the loud personal homepage
// ======================================================================================
function bevel(c, x, y, w, h, inset = false, face = '#C0C0C0') {
  c.fillStyle = face; c.fillRect(x, y, w, h);
  const hi = inset ? '#808080' : '#FFFFFF', lo = inset ? '#FFFFFF' : '#404040', lo2 = inset ? '#DFDFDF' : '#808080';
  c.fillStyle = hi; c.fillRect(x, y, w, 2); c.fillRect(x, y, 2, h);
  c.fillStyle = lo; c.fillRect(x, y + h - 2, w, 2); c.fillRect(x + w - 2, y, 2, h);
  c.fillStyle = lo2; c.fillRect(x + 2, y + h - 3, w - 4, 1); c.fillRect(x + w - 3, y + 2, 1, h - 4);
}
const gif = (lt, fps = 10) => Math.floor(fq(lt) * fps + 1e-6); // GIF-like stepped time

function rainbowText(c, text, cx, y, size, lt, seed = 0, align = 'center') {
  setFont(c, F.comic, size, 700);
  const wTot = c.measureText(text).width;
  let x = align === 'center' ? cx - wTot / 2 : cx;
  const step = gif(lt, 12);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], cw = c.measureText(text.slice(0, i + 1)).width - c.measureText(text.slice(0, i)).width;
    const hue = (i * 26 + step * 30 + seed) % 360;
    const dy = Math.sin(step * 0.9 + i * 0.7) * size * 0.06;
    c.fillStyle = '#000'; c.fillText(ch, x + size * 0.07, y + dy + size * 0.07);
    c.fillStyle = `hsl(${hue},100%,60%)`; c.fillText(ch, x, y + dy);
    x += cw;
  }
}

function pop(c, lt, t0, cx, cy, fn, dur = 0.34) {
  const p = inv(t0, t0 + dur, lt);
  if (p <= 0) return;
  const s = ease.outBackBig(p);
  c.save(); c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy); fn(); c.restore();
  const sp = inv(t0, t0 + 0.45, lt);
  if (sp > 0 && sp < 1) {
    for (let k = 0; k < 5; k++) {
      const a = hash(k, t0 * 100) * TAU, d = 30 + sp * 90 * (0.6 + hash(k, 7) * 0.6);
      sparkle(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, 12 * (1 - sp), `hsla(${hash(k, 3) * 360},100%,80%,${1 - sp})`);
    }
  }
}

export function site98(c, w, h, lt, opt = {}) {
  if (opt.snapshot) lt = 4.0;
  // window chrome
  bevel(c, 0, 0, w, h);
  const tg = c.createLinearGradient(0, 0, w, 0);
  tg.addColorStop(0, '#000080'); tg.addColorStop(1, '#1084D0');
  c.fillStyle = tg; c.fillRect(4, 4, w - 8, 30);
  setFont(c, F.arimo, 17, 700); c.fillStyle = '#FFF'; c.textBaseline = 'middle';
  c.fillText('Kopi Pagi Homepage!!! - Web Browser', 12, 20);
  for (let i = 0; i < 3; i++) {
    const bx = w - 80 + i * 24; bevel(c, bx, 8, 22, 20);
    c.fillStyle = '#000';
    if (i === 0) c.fillRect(bx + 6, 21, 9, 2);
    if (i === 1) { c.strokeStyle = '#000'; c.lineWidth = 2; c.strokeRect(bx + 6, 12, 10, 9); }
    if (i === 2) { c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + 6, 12); c.lineTo(bx + 15, 22); c.moveTo(bx + 15, 12); c.lineTo(bx + 6, 22); c.stroke(); }
  }
  setFont(c, F.arimo, 15, 400); c.fillStyle = '#000';
  ['File', 'Edit', 'View', 'Go', 'Bookmarks', 'Help'].reduce((x, s) => (c.fillText(s, x, 48), x + c.measureText(s).width + 20), 12);
  const tb = ['Back', 'Forward', 'Stop', 'Refresh', 'Home'];
  tb.forEach((s, i) => {
    bevel(c, 8 + i * 76, 62, 72, 42);
    setFont(c, F.arimo, 13, 400); c.fillStyle = '#000'; c.textAlign = 'center';
    c.fillText(s, 8 + i * 76 + 36, 94);
    c.beginPath();
    const ix = 8 + i * 76 + 36, iy = 76;
    if (i === 0) { c.moveTo(ix + 7, iy - 7); c.lineTo(ix - 7, iy); c.lineTo(ix + 7, iy + 7); }
    else if (i === 1) { c.moveTo(ix - 7, iy - 7); c.lineTo(ix + 7, iy); c.lineTo(ix - 7, iy + 7); }
    else if (i === 2) { c.arc(ix, iy, 7, 0, TAU); }
    else if (i === 3) { c.arc(ix, iy, 7, 0.4, TAU - 0.4); }
    else { c.moveTo(ix - 8, iy + 1); c.lineTo(ix, iy - 7); c.lineTo(ix + 8, iy + 1); c.lineTo(ix + 8, iy + 1); c.rect(ix - 5, iy, 10, 7); }
    c.fillStyle = i === 2 ? '#C00000' : i === 0 || i === 1 ? '#006400' : '#00408F'; c.fill();
    c.textAlign = 'left';
  });
  setFont(c, F.arimo, 14, 400); c.fillStyle = '#000'; c.fillText('Address', 10, 124);
  bevel(c, 72, 111, w - 84, 26, true, '#FFFFFF');
  setFont(c, F.times, 17, 400); c.fillStyle = '#000'; c.fillText('http://members.kopipagi.net/~kopi/index.html', 80, 125);
  bevel(c, 4, h - 24, w - 8, 20, true);
  setFont(c, F.arimo, 13, 400); c.fillStyle = '#000';
  c.fillText(lt < 2.1 ? `Membuka halaman… (${Math.min(11, gif(lt, 6) + 1)} dari 12 gambar)` : 'Selesai', 10, h - 13);

  // viewport
  const px = 4, py = 142, pw = w - 8 - 18, ph = h - 24 - 142 - 2;
  bevel(c, px + pw, py, 18, ph, false);
  c.fillStyle = '#9C9C9C'; c.fillRect(px + pw + 3, py + 20, 12, ph - 40);
  bevel(c, px + pw + 1, py + 22, 16, 90);
  c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip(); c.translate(px, py);
  const step = gif(lt, 8);
  c.fillStyle = '#07072B'; c.fillRect(0, 0, pw, ph);
  const T = 96;
  for (let ty = 0; ty < ph; ty += T) for (let tx = 0; tx < pw; tx += T) {
    for (let k = 0; k < 7; k++) {
      const sx = tx + hash(k, 1) * T, sy = ty + hash(k, 2) * T, on = hash(k + step * 13, 9) > 0.3;
      if (!on) continue;
      c.fillStyle = k % 3 ? '#FFFFFF' : '#FFF36B';
      const s = k % 2 ? 2 : 3; c.fillRect(sx | 0, sy | 0, s, s);
      if (k === 0) { c.fillRect((sx | 0) - 4, (sy | 0) + 1, 11, 1); c.fillRect((sx | 0) + 1, (sy | 0) - 4, 1, 11); }
    }
  }
  c.textBaseline = 'alphabetic';
  const cx = pw / 2;
  // heading
  pop(c, lt, 0.1, cx, 60, () => {
    rainbowText(c, 'SELAMAT DATANG di HOMEPAGE', cx, 48, 34, lt, 0);
    rainbowText(c, 'KOPI PAGI!!!', cx, 100, 54, lt, 120);
  });
  // rainbow rule
  pop(c, lt, 0.4, cx, 122, () => {
    const g = c.createLinearGradient(cx - 380, 0, cx + 380, 0);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsl(${(i * 60 + step * 40) % 360},100%,55%)`);
    c.fillStyle = g; c.fillRect(cx - 380, 118, 760, 7);
  });
  // marquee
  pop(c, lt, 0.55, cx, 150, () => {
    c.fillStyle = '#7A0019'; c.fillRect(20, 134, pw - 40, 32);
    c.save(); c.beginPath(); c.rect(20, 134, pw - 40, 32); c.clip();
    setFont(c, F.times, 23, 700); c.fillStyle = '#FFFF00';
    const msg = '*** Kopi paling mantap se-Bandung!!! *** Jangan lupa isi Buku Tamu ya!!! *** ';
    const mw = c.measureText(msg).width, off = (Math.floor(fq(lt) * 30) * 8) % mw;
    for (let x = 20 + pw - 40 - off - mw; x < pw; x += mw) c.fillText(msg, x, 158);
    c.restore();
  });
  // under construction
  pop(c, lt, 0.75, 190, 222, () => {
    const bx = 40, by = 186, bw = 300, bh = 72;
    c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
    c.fillStyle = '#FFD400'; c.fillRect(bx, by, bw, bh);
    c.fillStyle = '#111'; const o = (step * 6) % 36;
    for (let x = bx - 80 - o; x < bx + bw + 80; x += 36) { c.beginPath(); c.moveTo(x, by + bh); c.lineTo(x + 18, by + bh); c.lineTo(x + 18 + bh, by); c.lineTo(x + bh, by); c.fill(); }
    c.fillStyle = '#FFD400'; c.fillRect(bx + 12, by + 14, bw - 24, bh - 28);
    setFont(c, F.arimo, 22, 700); c.fillStyle = '#111'; c.textAlign = 'center';
    c.fillText('SEDANG DIBANGUN!', bx + bw / 2, by + bh / 2 + 8); c.textAlign = 'left';
    c.restore();
  });
  // BARU! starburst
  pop(c, lt, 0.9, 432, 222, () => {
    star(c, 432, 222, 14, 50, 36, step * 0.2); c.fillStyle = '#E00000'; c.fill();
    if (step % 2 === 0) { setFont(c, F.comic, 26, 700); c.fillStyle = '#FFFF00'; c.textAlign = 'center'; c.fillText('BARU!', 432, 231); c.textAlign = 'left'; }
  });
  // envelope
  pop(c, lt, 1.05, 620, 220, () => {
    const ex = 560, ey = 186, ew = 120, eh = 76, flap = Math.sin(step * 1.3);
    c.fillStyle = '#FFFFFF'; c.fillRect(ex, ey, ew, eh);
    c.strokeStyle = '#000080'; c.lineWidth = 3; c.strokeRect(ex, ey, ew, eh);
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + ew / 2, ey + eh * (0.5 * flap + 0.1)); c.lineTo(ex + ew, ey); c.stroke();
    setFont(c, F.times, 21, 400); c.fillStyle = '#6CF'; c.fillText('Kirim email!', ex + 128, ey + 46);
    c.fillRect(ex + 128, ey + 50, c.measureText('Kirim email!').width, 2);
  });
  // links
  pop(c, lt, 1.2, cx, 300, () => {
    setFont(c, F.times, 25, 400);
    const parts = ['Menu', ' | ', 'Lokasi', ' | ', 'Buku Tamu', ' | ', 'Link Teman'];
    const tw = parts.reduce((a, s) => a + c.measureText(s).width, 0);
    let x = cx - tw / 2;
    parts.forEach((s, i) => {
      const lw = c.measureText(s).width;
      c.fillStyle = i % 2 ? '#FFFFFF' : i === 2 ? '#C58CFF' : '#66A3FF';
      c.fillText(s, x, 308);
      if (!(i % 2)) c.fillRect(x, 311, lw, 2);
      x += lw;
    });
  });
  // visitor counter
  pop(c, lt, 1.35, cx, 356, () => {
    setFont(c, F.times, 22, 400); c.fillStyle = '#FFF';
    const label = 'Kamu pengunjung ke-'; const lw = c.measureText(label).width;
    const bx = cx - (lw + 6 * 28) / 2;
    c.fillText(label, bx, 364);
    const n = String(127 + Math.floor(Math.max(0, fq(lt) - 1.35) * 7)).padStart(6, '0');
    setFont(c, F.vt, 36, 400);
    for (let i = 0; i < 6; i++) {
      const dx = bx + lw + 6 + i * 28;
      c.fillStyle = '#000'; c.fillRect(dx, 336, 26, 36); c.strokeStyle = '#666'; c.lineWidth = 1; c.strokeRect(dx + 0.5, 336.5, 25, 35);
      c.fillStyle = '#39FF14'; c.textAlign = 'center'; c.fillText(n[i], dx + 13, 366); c.textAlign = 'left';
    }
  });
  // 88x31 buttons
  [['BUKU TAMU', '#FFE600', '#000'], ['800x600 OK', '#C0C0C0', '#000080'], ['<< WEBRING >>', '#008080', '#FFF']].forEach(([s, bg, fg], i) => {
    const bx = cx - 150 + i * 102 - 44 + 0;
    pop(c, lt, 1.5 + i * 0.08, bx + 44, 406, () => {
      bevel(c, bx, 390, 92, 32, false, bg);
      setFont(c, F.silk, 10, 700); c.fillStyle = fg; c.textAlign = 'center'; c.fillText(s, bx + 46, 410); c.textAlign = 'left';
    });
  });
  // fire
  const fp = inv(1.75, 2.1, lt);
  if (fp > 0) {
    const base = ph, fs = gif(lt, 12);
    for (let x = 0; x < pw; x += 10) {
      const hh = (26 + 34 * noise1(x * 0.045 + fs * 0.9, 5) + 10 * hash(x, fs)) * ease.outBack(fp);
      const g = c.createLinearGradient(0, base - hh, 0, base);
      g.addColorStop(0, 'rgba(255,255,120,0)'); g.addColorStop(0.25, '#FFE04A'); g.addColorStop(0.6, '#FF7A00'); g.addColorStop(1, '#C80000');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 4, base); c.quadraticCurveTo(x + 2, base - hh * 0.6, x + 6, base - hh); c.quadraticCurveTo(x + 10, base - hh * 0.5, x + 16, base); c.fill();
    }
  }
  c.restore();
}

// ======================================================================================
// 2002 — the splash intro that makes you wait
// ======================================================================================
export const SKIP02 = { x: 676, y: 600, w: 178, h: 40 }; // content-local
export function cursor02(lt) {
  const [a, b] = CUE.cursor02;
  const x = keys(lt, [[a, 430], [b, SKIP02.x + 110, ease.inOutCubic]]);
  const y = keys(lt, [[a, 700], [b, SKIP02.y + 26, ease.inOutCubic]]);
  return [x, y];
}
function chromeGrad(c, y0, y1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.42, '#D6DDE5'); g.addColorStop(0.5, '#59626E');
  g.addColorStop(0.62, '#9AA3AE'); g.addColorStop(1, '#F2F5F8');
  return g;
}
export function arrowCursor(c, x, y, s = 1, pressed = false) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.lineTo(7, 23); c.lineTo(12, 34); c.lineTo(17, 32); c.lineTo(12, 21); c.lineTo(21, 21); c.closePath();
  c.fillStyle = pressed ? '#DDD' : '#FFF'; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
  c.restore();
}

export function site02(c, w, h, lt, opt = {}) {
  if (opt.snapshot) lt = 3.2;
  const tq = fq(lt);
  c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
  // title bar (popup window)
  c.fillStyle = '#23272E'; c.fillRect(0, 0, w, 30);
  setFont(c, F.arimo, 14, 700); c.fillStyle = '#AEB6C1'; c.textBaseline = 'middle';
  c.fillText('KOPI PAGI :: ENTER', 12, 16); c.textBaseline = 'alphabetic';
  c.save(); c.beginPath(); c.rect(0, 30, w, h - 30); c.clip();
  const cx = w / 2, cy = 250;
  const rg = c.createRadialGradient(cx, cy, 0, cx, cy, 460);
  rg.addColorStop(0, '#1E2430'); rg.addColorStop(1, '#000');
  c.fillStyle = rg; c.fillRect(0, 30, w, h);
  // perspective floor grid
  c.strokeStyle = 'rgba(255,138,31,0.28)'; c.lineWidth = 1.2;
  const hz = 380;
  for (let i = -12; i <= 12; i++) { c.beginPath(); c.moveTo(cx + i * 14, hz); c.lineTo(cx + i * 150, h); c.stroke(); }
  const sc = (lt * 0.9) % 1;
  for (let j = 0; j < 9; j++) { const z = (j + sc) / 9, y = hz + (h - hz) * z * z; c.globalAlpha = z; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.globalAlpha = 1;
  // orbit rings
  c.save(); c.translate(cx, cy);
  for (let k = 0; k < 3; k++) {
    const a = prog(lt, 0.1 + k * 0.12, 0.9 + k * 0.12, ease.outExpo);
    if (a <= 0) continue;
    c.save(); c.rotate(lt * (0.4 + k * 0.25) * (k % 2 ? -1 : 1));
    c.scale(1, 0.32 + k * 0.1);
    c.strokeStyle = `rgba(200,210,225,${0.35 * a})`; c.lineWidth = 1.5;
    c.setLineDash([60 + k * 30, 18, 6, 18]);
    c.beginPath(); c.arc(0, 0, (260 + k * 70) * (0.4 + 0.6 * a), 0, TAU); c.stroke();
    c.restore();
  }
  c.setLineDash([]);
  c.restore();
  // sweeping tech lines
  for (let k = 0; k < 4; k++) {
    const p = prog(lt, 0.05 + k * 0.1, 0.65 + k * 0.1, ease.outExpo);
    if (p <= 0 || p >= 1) continue;
    const y = 90 + k * 60;
    c.fillStyle = `rgba(255,138,31,${0.9 * (1 - p)})`;
    c.fillRect(-200 + p * (w + 400) - 180, y, 180, 2);
  }
  // wordmark letters fly in
  const word = 'KOPI PAGI';
  setFont(c, F.orb, 92, 900, 'normal', 4);
  c.textBaseline = 'alphabetic';
  const tw = c.measureText(word).width, x0 = cx - tw / 2, by = 282;
  const grad = chromeGrad(c, -70, 6);
  for (let i = 0; i < word.length; i++) {
    const p = prog(lt, 0.15 + i * 0.07, 0.75 + i * 0.07, ease.outExpo);
    if (p <= 0) continue;
    const lx = x0 + c.measureText(word.slice(0, i)).width;
    const ox = (hash(i, 21) - 0.5) * 900, oy = (hash(i, 22) - 0.5) * 500, r = (hash(i, 23) - 0.5) * 3;
    c.save();
    c.translate(lx + ox * (1 - p), by + oy * (1 - p)); c.rotate(r * (1 - p)); c.scale(1 + 2 * (1 - p), 1 + 2 * (1 - p));
    c.globalAlpha = p; c.fillStyle = grad; c.fillText(word[i], 0, 0);
    c.restore();
  }
  // lens flare sweep
  const fl = prog(lt, 1.2, 2.0, ease.inOutCubic);
  if (fl > 0 && fl < 1) {
    const fx = x0 - 60 + fl * (tw + 120);
    c.save(); c.globalCompositeOperation = 'lighter';
    const f = c.createRadialGradient(fx, by - 34, 0, fx, by - 34, 90);
    f.addColorStop(0, 'rgba(255,255,255,0.95)'); f.addColorStop(0.2, 'rgba(255,200,140,0.45)'); f.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = f; c.fillRect(fx - 90, by - 124, 180, 180);
    c.fillStyle = 'rgba(255,230,200,0.5)'; c.fillRect(fx - 260, by - 35, 520, 2);
    c.restore();
  }
  // tagline typed
  setFont(c, F.silk, 18, 400, 'normal', 5);
  const tag = 'ENTERING THE KOPI EXPERIENCE';
  const nTag = Math.floor(Math.max(0, tq - 0.9) * 40);
  c.fillStyle = '#FF8A1F'; c.textAlign = 'center';
  c.fillText(tag.slice(0, nTag), cx, 328); c.textAlign = 'left';

  // loading bar — crawls, then sits at 99%
  const lp = inv(0.6, 3.7, tq);
  const pct = Math.min(99, Math.floor(99 * (1 - Math.pow(1 - lp, 2.6))));
  if (tq > 0.5) {
    const bw = 560, bx = cx - bw / 2, bY = 430;
    setFont(c, F.silk, 20, 700, 'normal', 3); c.fillStyle = '#DDE3EA';
    c.fillText('LOADING', bx, bY - 14);
    c.textAlign = 'right'; c.fillText(`${pct}%`, bx + bw, bY - 14); c.textAlign = 'left';
    c.strokeStyle = '#8F98A3'; c.lineWidth = 2; c.strokeRect(bx, bY, bw, 30);
    const fw = (bw - 8) * pct / 100;
    const fg = c.createLinearGradient(0, bY, 0, bY + 30);
    fg.addColorStop(0, '#FFC27A'); fg.addColorStop(0.5, '#FF8A1F'); fg.addColorStop(1, '#B84E00');
    c.fillStyle = fg; c.fillRect(bx + 4, bY + 4, fw, 22);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = bx + 4 + ((tq * 60) % 20) - 20; x < bx + 4 + fw; x += 20) {
      c.save(); c.beginPath(); c.rect(bx + 4, bY + 4, fw, 22); c.clip();
      c.beginPath(); c.moveTo(x, bY + 26); c.lineTo(x + 8, bY + 26); c.lineTo(x + 18, bY + 4); c.lineTo(x + 10, bY + 4); c.fill(); c.restore();
    }
    setFont(c, F.silk, 12, 400, 'normal', 2); c.fillStyle = '#6F7885';
    const kb = Math.floor(1433 * pct / 100);
    c.fillText(`${kb} KB / 1433 KB`, bx, bY + 56);
  }
  // wait timer
  const secs = Math.floor(Math.max(0, tq) * 8.5);
  setFont(c, F.silk, 15, 700, 'normal', 2);
  c.textAlign = 'right';
  c.fillStyle = secs > 30 && Math.floor(tq * 3) % 2 ? '#FF4A3D' : '#AEB6C1';
  c.fillText(`WAKTU TUNGGU 00:${String(secs).padStart(2, '0')}`, w - 22, 62);
  c.textAlign = 'left';
  // fine print nobody can read
  setFont(c, F.arimo, 9, 400); c.fillStyle = '#4A515C';
  c.fillText('© 2002 KOPI PAGI INTERACTIVE. ALL RIGHTS RESERVED. BEST VIEWED AT 1024x768 WITH PLUGIN v6.', 22, h - 18);
  // SKIP INTRO button
  if (tq > 3.3) {
    const pressed = tq >= CUE.click02;
    const hover = tq >= CUE.hover02;
    const on = hover || Math.floor(tq * 2.5) % 2 === 0;
    const { x, y, w: bw, h: bh } = SKIP02;
    c.save(); if (pressed) c.translate(1, 2);
    c.strokeStyle = on ? '#FFFFFF' : '#707985'; c.lineWidth = 2; c.strokeRect(x, y, bw, bh);
    if (hover) { c.fillStyle = pressed ? '#FF8A1F' : 'rgba(255,138,31,0.25)'; c.fillRect(x + 2, y + 2, bw - 4, bh - 4); }
    setFont(c, F.silk, 17, 700, 'normal', 2); c.fillStyle = on ? '#FFFFFF' : '#707985'; c.textAlign = 'center';
    c.fillText('SKIP INTRO »', x + bw / 2, y + 27); c.textAlign = 'left';
    c.restore();
  }
  c.restore();
  if (!opt.snapshot && tq > CUE.cursor02[0]) { const [mx, my] = cursor02(lt); arrowCursor(c, mx, my, 1.4, tq >= CUE.click02 && tq < CUE.click02 + 0.12); }
}

// ======================================================================================
// 2007 ↔ 2015 — one renderer, k = 0 (Web 2.0) … 1 (flat). The morph IS the lesson.
// ======================================================================================
const FLAT = { blue: '#2E86DE', navy: '#1F3A5F', teal: '#16A085', deep: '#1B5E9E' };
const BOX07 = [['#35C2F2', '#0E8FC9', 'Menu Favorit'], ['#FFB54D', '#F07A00', 'Lokasi Kami'], ['#A6E04A', '#5FA616', 'Hubungi Kami']];
const ICON15 = [[FLAT.blue, 'Menu'], [FLAT.teal, 'Lokasi'], [FLAT.navy, 'Kontak']];

function glossyBall(c, x, y, r, col, gloss) {
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, mixc(col, '#FFFFFF', 0.6 * gloss)); g.addColorStop(1, col);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function cupSkeuo(c, x, y, s, lt, a) {
  if (a <= 0) return;
  c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s);
  // saucer
  let g = c.createLinearGradient(0, 40, 0, 72);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#AAB6BF');
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 58, 118, 26, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(0, 54, 80, 14, 0, 0, TAU); c.fill();
  // handle
  c.strokeStyle = '#D5DDE3'; c.lineWidth = 16; c.beginPath(); c.ellipse(78, 0, 30, 28, 0, -1.3, 1.3); c.stroke();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 5; c.beginPath(); c.ellipse(78, -3, 30, 26, 0, -1.1, 0.6); c.stroke();
  // body
  g = c.createLinearGradient(-80, 0, 80, 0);
  g.addColorStop(0, '#C2CCD3'); g.addColorStop(0.35, '#FFFFFF'); g.addColorStop(1, '#9AA7B0');
  c.fillStyle = g; c.beginPath(); c.moveTo(-82, -52); c.bezierCurveTo(-82, 20, -60, 52, 0, 52); c.bezierCurveTo(60, 52, 82, 20, 82, -52); c.closePath(); c.fill();
  // rim + coffee
  c.fillStyle = '#EEF2F5'; c.beginPath(); c.ellipse(0, -52, 82, 18, 0, 0, TAU); c.fill();
  g = c.createRadialGradient(-10, -56, 4, 0, -52, 74);
  g.addColorStop(0, '#9A5B2E'); g.addColorStop(1, '#3B1E0B');
  c.fillStyle = g; c.beginPath(); c.ellipse(0, -51, 72, 13, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-50, -10, 8, 30, 0.1, 0, TAU); c.fill();
  // steam
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 6; c.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    for (let j = 0; j <= 6; j++) {
      const yy = -76 - j * 7, xx = -30 + k * 30 + Math.sin(j * 0.6 + lt * 3 + k) * 8;
      j ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.globalAlpha = a * 0.6; c.stroke();
  }
  c.restore();
}
function cupFlat(c, x, y, r, a, L = 1) { // L: how far the 45° long shadow has grown (0…1)
  if (a <= 0) return;
  c.save(); c.globalAlpha = a;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#1F6FB8'; c.fill();
  c.save(); c.clip();
  const ls = 200 * L;
  c.fillStyle = FLAT.deep; c.beginPath();
  c.moveTo(x - 34, y + 20); c.lineTo(x + 34, y + 20); c.lineTo(x + 50, y - 8); c.lineTo(x + 50 + ls, y - 8 + ls); c.lineTo(x - 34 + ls, y + 20 + ls); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = '#FFFFFF';
  c.fillRect(x - 34, y - 26, 68, 46);
  c.lineWidth = 9; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(x + 36, y - 4, 13, -1.4, 1.4); c.stroke();
  c.fillRect(x - 46, y + 26, 92, 7);
  c.restore();
}

// 2007: the cursor of someone new to screens: drifts in, lingers on things that might be clickable, then finds the
// one that obviously is. Keyframes are fractions of [wander07, press07 - 0.3] (site-local px, chrome included).
const WANDER07 = [[0, 960, 650], [0.2, 640, 478], [0.33, 668, 490], [0.47, 772, 300], [0.6, 750, 318], [0.74, 520, 238], [1, 196, 390]];
function cursor07(lt) {
  const a = CUE.wander07, b = CUE.press07 - 0.3;
  const at = (j) => keys(lt, WANDER07.map((p) => [a + p[0] * (b - a), p[j]]));
  const hes = 1 - prog(lt, b - 0.5, b); // a small unsure wobble until it settles on the button
  return [at(1) + (noise1(lt * 3.2, 11) - 0.5) * 12 * hes, at(2) + (noise1(lt * 2.7, 12) - 0.5) * 10 * hes];
}
// 2015: a finger that knows where to go (the flat menu below the fold, reached by tapping "Lihat Menu")
const MENU15 = [['Kopi tubruk', 'Rp12.000', FLAT.navy], ['Kopi susu', 'Rp18.000', FLAT.blue], ['Roti bakar', 'Rp15.000', FLAT.teal]];
const SCROLL15 = 300;
function touchDot(c, x, y, lt, tap, col) {
  const tp = inv(tap - 0.3, tap + 0.45, lt);
  if (tp <= 0 || tp >= 1) return;
  const a = Math.sin(tp * Math.PI), press = prog(lt, tap - 0.06, tap, ease.outQuad) * (1 - prog(lt, tap + 0.05, tap + 0.2));
  const d = (1 - prog(lt, tap - 0.3, tap, ease.outCubic)) * 46; // finger arrives from below-right
  c.beginPath(); c.arc(x + d, y + d, 30 - 8 * press, 0, TAU); c.fillStyle = css(col, 0.3 * a); c.fill();
  c.strokeStyle = css(col, 0.65 * a); c.lineWidth = 3; c.stroke();
}
function ripple(c, x, y, lt, tap, clip, col, r1 = 260) { // Material-style ink, clipped to its button
  const rp = inv(tap, tap + 0.55, lt);
  if (rp <= 0 || rp >= 1) return;
  c.save(); clip(); c.clip();
  c.beginPath(); c.arc(x, y, 12 + rp * r1, 0, TAU); c.fillStyle = css(col, 0.4 * (1 - rp)); c.fill();
  c.restore();
}

export function site0715(c, w, h, lt, k, opt = {}) {
  const e = ease.inOutCubic(clamp(k));
  const A = 1 - inv(0, 0.5, k), B = inv(0.5, 1, k), gloss = 1 - e;
  const live = !opt.snapshot, l15 = lt - CUE.off15; // l15: 2015-local time
  // 2007 cursor state: hovers the glossy button, then presses it
  const arrive07 = CUE.press07 - 0.3;
  const hover07 = live ? prog(lt, arrive07 - 0.05, arrive07 + 0.12) : 0;
  const press07 = live ? prog(lt, CUE.press07 - 0.07, CUE.press07, ease.outQuad) * (1 - prog(lt, CUE.press07 + 0.1, CUE.press07 + 0.32, ease.outCubic)) : 0;
  // 2015: tap "Lihat Menu" → the page scrolls to the menu → tap a flat "Pesan" button
  const scroll = live ? SCROLL15 * prog(l15, CUE.tap15 + 0.22, CUE.tap15 + 1.02, ease.inOutCubic) : 0;
  // ---- browser chrome
  const ch = lerp(64, 44, e);
  if (gloss > 0.001) {
    const g = c.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, mixc('#FAFAFA', '#ECEFF3', e)); g.addColorStop(1, mixc('#C4C8CD', '#ECEFF3', e));
    c.fillStyle = g;
  } else c.fillStyle = '#ECEFF3';
  c.fillRect(0, 0, w, ch);
  c.fillStyle = mixc('#8C9096', '#D6DBE1', e); c.fillRect(0, ch - 1, w, 1);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => {
    const x = 26 + i * 24, y = ch / 2, r = lerp(8, 6.5, e);
    glossyBall(c, x, y, r, col, gloss);
  });
  const ax = 110, aw = w - 220, ah = lerp(32, 26, e), ay = (ch - ah) / 2;
  rr(c, ax, ay, aw, ah, ah / 2);
  c.fillStyle = '#FFFFFF'; c.fill();
  c.strokeStyle = mixc('#8F959C', '#E1E5EA', e); c.lineWidth = 1; c.stroke();
  setFont(c, F.arimo, 15, 400); c.fillStyle = mixc('#333333', '#8A93A0', e); c.textBaseline = 'middle'; c.textAlign = 'center';
  c.fillText('www.kopipagi.com', w / 2, ch / 2 + 1); c.textAlign = 'left'; c.textBaseline = 'alphabetic';

  // ---- page
  c.save(); c.beginPath(); c.rect(0, ch, w, h - ch); c.clip(); c.translate(0, ch);
  const ph = h - ch;
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, ph);
  if (gloss > 0.01) {
    c.globalAlpha = gloss; c.fillStyle = '#E4F1F9'; c.fillRect(0, 0, w, ph);
    c.fillStyle = '#D5E8F4';
    for (let x = -ph; x < w; x += 16) { c.beginPath(); c.moveTo(x, ph); c.lineTo(x + 7, ph); c.lineTo(x + 7 + ph, 0); c.lineTo(x + ph, 0); c.fill(); }
    c.globalAlpha = 1;
  }
  c.translate(0, -scroll);
  // header → hero band
  const hh = lerp(116, 330, e);
  if (gloss > 0.001) {
    const g = c.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, mixc('#7FDBFA', FLAT.blue, e)); g.addColorStop(1, mixc('#0F95D2', FLAT.blue, e));
    c.fillStyle = g;
  } else c.fillStyle = FLAT.blue;
  c.fillRect(0, 0, w, hh);
  if (gloss > 0.01) {
    c.fillStyle = `rgba(255,255,255,${0.32 * gloss})`; c.fillRect(0, 0, w, hh * 0.46);
    c.fillStyle = `rgba(0,60,100,${0.5 * gloss})`; c.fillRect(0, hh - 3, w, 3);
  }
  // logo: glossy rounded wordmark (A) → small flat nav logo (B)
  if (A > 0) {
    c.save(); c.globalAlpha = A;
    const s = lerp(1, 0.46, e), lx = lerp(36, 36, e), ly = lerp(78, 44, e);
    c.translate(lx, ly); c.scale(s, s);
    setFont(c, F.nunito, 56, 900, 'normal', -1);
    c.fillStyle = 'rgba(0,50,90,0.35)'; c.fillText('kopipagi', 0, 3);
    const g = c.createLinearGradient(0, -44, 0, 4); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#CFEFFF');
    c.fillStyle = g; c.fillText('kopipagi', 0, 0);
    // mirror reflection
    c.save(); c.scale(1, -0.55); c.globalAlpha = A * 0.28 * gloss; c.fillStyle = '#FFFFFF'; c.fillText('kopipagi', 0, -14); c.restore();
    c.restore();
  }
  if (B > 0) {
    c.save(); c.globalAlpha = B;
    setFont(c, F.mont, 22, 700, 'normal', 0.5); c.fillStyle = '#FFFFFF'; c.fillText('kopi pagi', 36, 44);
    c.fillRect(w - 76, 26, 34, 4); c.fillRect(w - 76, 36, 34, 4); c.fillRect(w - 76, 46, 34, 4);
    c.restore();
  }
  // beta badge
  const bs = 1 - ease.inBack(clamp(k * 1.6));
  if (bs > 0) {
    c.save(); c.translate(300, 40); c.rotate(-0.25 + lt * 0.5); c.scale(bs, bs);
    star(c, 0, 0, 16, 34, 27, 0);
    const g = c.createLinearGradient(0, -34, 0, 34); g.addColorStop(0, '#FFC56B'); g.addColorStop(1, '#F07A00');
    c.fillStyle = g; c.fill();
    c.rotate(0.25 - lt * 0.5 + 0.25);
    setFont(c, F.arimo, 17, 700, 'italic'); c.fillStyle = '#FFF'; c.textAlign = 'center'; c.fillText('beta', 0, 6); c.textAlign = 'left';
    c.restore();
  }
  // glossy tabs (A)
  if (A > 0) {
    c.save(); c.globalAlpha = A;
    ['Menu', 'Lokasi', 'Blog'].forEach((s, i) => {
      const tx = w - 360 + i * 116, ty = 76;
      rr(c, tx, ty, 108, 50, 12);
      const g = c.createLinearGradient(0, ty, 0, ty + 40); g.addColorStop(0, i === 0 ? '#FFFFFF' : '#BFEAFB'); g.addColorStop(1, i === 0 ? '#E4F1F9' : '#5DC5EE');
      c.fillStyle = g; c.fill();
      setFont(c, F.arimo, 17, 700); c.fillStyle = i === 0 ? '#0E7FB5' : '#FFFFFF'; c.textAlign = 'center'; c.fillText(s, tx + 54, ty + 28); c.textAlign = 'left';
    });
    c.restore();
  }
  // headline
  if (A > 0) {
    c.save(); c.globalAlpha = A;
    setFont(c, F.arimo, 40, 700, 'normal', -0.5);
    c.fillStyle = '#FFFFFF'; c.fillText('Kopi terbaik', 40, 191); c.fillText('untuk pagimu!', 40, 239);
    c.fillStyle = '#23343D'; c.fillText('Kopi terbaik', 40, 189); c.fillText('untuk pagimu!', 40, 237);
    setFont(c, F.arimo, 17, 400); c.fillStyle = '#50626C'; c.fillText('Diseduh segar setiap hari. Kini online!', 40, 272);
    c.restore();
  }
  if (B > 0) {
    c.save(); c.globalAlpha = B; c.translate(0, (1 - B) * 16);
    setFont(c, F.mont, 64, 700, 'normal', -1.5); c.fillStyle = '#FFFFFF'; c.fillText('Kopi Pagi', 48, 170);
    setFont(c, F.mont, 23, 500); c.fillStyle = 'rgba(255,255,255,0.86)'; c.fillText('Kopi segar, setiap pagi.', 50, 214);
    c.restore();
  }
  // button: glossy pill → ghost button
  {
    // a pressed glossy button sinks: shadow tucks in, face darkens (press07); hovering brightens it
    const bx = lerp(40, 50, e), by = lerp(292, 244, e) + 4 * press07, bw = lerp(252, 196, e), bh = lerp(60, 54, e), r = lerp(30, 4, e);
    if (gloss > 0.01) { c.save(); c.shadowColor = `rgba(0,40,0,${0.4 * gloss})`; c.shadowBlur = 14 * gloss * (1 - 0.6 * press07); c.shadowOffsetY = 6 * gloss * (1 - 0.8 * press07); }
    rr(c, bx, by, bw, bh, r);
    const g = c.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, css('#A9E54A', gloss)); g.addColorStop(1, css('#4E9A10', gloss));
    c.fillStyle = g; c.fill();
    if (gloss > 0.01) c.restore();
    if (gloss > 0.01 && (hover07 > 0 || press07 > 0)) { rr(c, bx, by, bw, bh, r); c.fillStyle = `rgba(${press07 > 0 ? '20,60,0' : '255,255,255'},${gloss * (press07 > 0 ? 0.22 * press07 : 0.16 * hover07)})`; c.fill(); }
    c.lineWidth = lerp(1.5, 2, e); c.strokeStyle = mixc('#3F7D0C', '#FFFFFF', e); rr(c, bx, by, bw, bh, r); c.stroke();
    if (B > 0 && live) ripple(c, 148, 271, l15, CUE.tap15, () => rr(c, bx, by, bw, bh, r), '#FFFFFF', 220);
    if (gloss > 0.01) {
      rr(c, bx + 4, by + 3, bw - 8, bh * 0.46, r * 0.8); c.fillStyle = `rgba(255,255,255,${0.42 * gloss * (1 - 0.5 * press07)})`; c.fill();
      const sw = ((lt * 0.55) % 1) * (bw + 200) - 100;
      c.save(); rr(c, bx, by, bw, bh, r); c.clip();
      const sg = c.createLinearGradient(bx + sw - 40, 0, bx + sw + 40, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${0.55 * gloss})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sg; c.fillRect(bx, by, bw, bh); c.restore();
    }
    c.textAlign = 'center';
    if (A > 0) { c.globalAlpha = A; setFont(c, F.arimo, 23, 700); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillText('Pesan Sekarang!', bx + bw / 2, by + bh / 2 + 9); c.fillStyle = '#FFF'; c.fillText('Pesan Sekarang!', bx + bw / 2, by + bh / 2 + 7); }
    if (B > 0) { c.globalAlpha = B; setFont(c, F.mont, 19, 600, 'normal', 0.5); c.fillStyle = '#FFF'; c.fillText('Lihat Menu', bx + bw / 2, by + bh / 2 + 7); }
    c.globalAlpha = 1; c.textAlign = 'left';
  }
  // cup: skeuomorphic → flat long-shadow icon
  const cyc = lerp(232, 170, e);
  cupSkeuo(c, 730, cyc, lerp(1, 0.7, e), lt, 1 - inv(0.15, 0.6, k));
  cupFlat(c, 730, cyc, lerp(70, 100, e), inv(0.35, 0.85, k), live ? prog(l15, -0.1, 1.2, ease.outCubic) : 1);
  // boxes → flat icon circles
  for (let i = 0; i < 3; i++) {
    const [c1, c2, t7] = BOX07[i], [fc, t15] = ICON15[i];
    const icx = 170 + i * 290, icy = 400, ir = 34;
    const x = lerp(40 + i * 284, icx - ir, e), y = lerp(362, icy - ir, e), bw = lerp(268, ir * 2, e), bh = lerp(128, ir * 2, e), r = lerp(14, ir, e);
    if (gloss > 0.01) { c.save(); c.shadowColor = `rgba(0,30,60,${0.3 * gloss})`; c.shadowBlur = 16 * gloss; c.shadowOffsetY = 5 * gloss; }
    rr(c, x, y, bw, bh, r); c.fillStyle = mixc('#FFFFFF', fc, e); c.fill();
    if (gloss > 0.01) c.restore();
    if (gloss > 0.01) {
      c.save(); rr(c, x, y, bw, bh, r); c.clip();
      c.globalAlpha = 1 - inv(0, 0.6, k);
      const g = c.createLinearGradient(0, y, 0, y + 38); g.addColorStop(0, c1); g.addColorStop(1, c2);
      c.fillStyle = g; c.fillRect(x, y, bw, 38);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, bw, 17);
      setFont(c, F.arimo, 17, 700); c.fillStyle = '#FFF'; c.fillText(t7, x + 60, y + 26);
      glossyBall(c, x + 32, y + 19, 13, '#FFFFFF', 1);
      c.globalAlpha = (1 - inv(0, 0.4, k));
      setFont(c, F.arimo, 14, 400); c.fillStyle = '#5A6770';
      c.fillText(['Kopi susu, tubruk, jahe', 'Jl. Braga No. 7, Bandung', '(022) 555-0142'][i], x + 16, y + 70);
      c.fillText(['dan roti bakar.', 'Buka 06.00-14.00', 'halo@kopipagi.com'][i], x + 16, y + 92);
      c.restore();
    }
    if (B > 0) {
      c.save(); c.globalAlpha = B;
      c.fillStyle = '#FFF';
      if (i === 0) { c.fillRect(icx - 12, icy - 12, 24, 4); c.fillRect(icx - 12, icy - 2, 24, 4); c.fillRect(icx - 12, icy + 8, 16, 4); }
      if (i === 1) { c.beginPath(); c.arc(icx, icy - 5, 11, Math.PI, 0); c.lineTo(icx, icy + 15); c.closePath(); c.fill(); c.fillStyle = fc; c.beginPath(); c.arc(icx, icy - 5, 4.5, 0, TAU); c.fill(); }
      if (i === 2) { rr(c, icx - 9, icy - 15, 18, 30, 4); c.fill(); c.fillStyle = fc; c.fillRect(icx - 6, icy - 10, 12, 18); }
      setFont(c, F.mont, 18, 600); c.fillStyle = FLAT.navy; c.textAlign = 'center'; c.fillText(t15, icx, icy + 64); c.textAlign = 'left';
      c.restore();
    }
  }
  // 2015 menu below the fold: flat rows, flat buttons, nothing pretending to be 3-D
  if (B > 0 && scroll > 0) {
    c.save(); c.globalAlpha = B;
    setFont(c, F.mont, 30, 700, 'normal', -0.5); c.fillStyle = FLAT.navy; c.fillText('Menu', 48, 572);
    c.fillStyle = '#E3E8EE'; c.fillRect(48, 590, w - 96, 2);
    const done = prog(l15, CUE.tap15b + 0.1, CUE.tap15b + 0.35, ease.outCubic);
    MENU15.forEach(([name, price, col], i) => {
      const y = 612 + i * 76, bw = 124, bh = 46, bx = w - 48 - bw, by = y + 9, hit = i === 1;
      c.fillStyle = col; c.fillRect(48, y + 8, 48, 48);
      setFont(c, F.mont, 24, 600); c.fillStyle = FLAT.navy; c.fillText(name, 116, y + 31);
      setFont(c, F.mont, 18, 500); c.fillStyle = '#7B8794'; c.fillText(price, 116, y + 55);
      c.fillStyle = hit ? mixc(FLAT.blue, FLAT.teal, done) : FLAT.blue; c.fillRect(bx, by, bw, bh);
      if (hit) ripple(c, bx + bw / 2, by + bh / 2, l15, CUE.tap15b, () => { c.beginPath(); c.rect(bx, by, bw, bh); }, '#FFFFFF', 120);
      c.textAlign = 'center';
      if (!hit || done < 1) { c.globalAlpha = B * (hit ? 1 - done : 1); setFont(c, F.mont, 18, 600, 'normal', 0.5); c.fillStyle = '#FFF'; c.fillText('Pesan', bx + bw / 2, by + 30); }
      if (hit && done > 0) {
        c.globalAlpha = B * done; c.strokeStyle = '#FFF'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
        const kx = bx + bw / 2, ky = by + bh / 2;
        c.beginPath(); c.moveTo(kx - 12, ky); c.lineTo(kx - 3, ky + 9); c.lineTo(kx + 13, ky - 9); c.stroke();
      }
      c.globalAlpha = B; c.textAlign = 'left';
    });
    c.restore();
  }
  c.restore();
  // pointers live above the page, in site coordinates
  if (live && A > 0 && lt > CUE.wander07) {
    const [mx, my] = cursor07(lt);
    c.save(); c.globalAlpha = A * prog(lt, CUE.wander07, CUE.wander07 + 0.25);
    arrowCursor(c, mx, my + 4 * press07, 1.3, press07 > 0.5);
    c.restore();
  }
  if (live && B > 0) {
    touchDot(c, 148, ch + 271, l15, CUE.tap15, '#FFFFFF');
    touchDot(c, w - 110, ch + 720 - SCROLL15, l15, CUE.tap15b, FLAT.navy); // "Pesan" of row 2, after the scroll
  }
}

// ======================================================================================
// 2023 — full-bleed mobile, its own identity (dawn blue), built around one person
// ======================================================================================
export function site23(c, w, h, lt, opt = {}) {
  if (opt.snapshot) lt = 5.2;
  const tq = fq(lt), TAP23 = CUE.tap23, K = CUE.know23; // K: "…udah kenal kamu" — what it knows lights up
  const mark = (t0) => prog(lt, t0, t0 + 0.35, ease.outCubic);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#040B1E'); g.addColorStop(0.36, '#0A1C48'); g.addColorStop(0.68, '#1D3F9E'); g.addColorStop(0.88, '#3B82F6'); g.addColorStop(1, '#93C5FD');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const sunY = h + 120 - prog(lt, -0.4, 7.5, ease.outCubic) * 200;
  const sg = c.createRadialGradient(w * 0.62, sunY, 0, w * 0.62, sunY, 720);
  sg.addColorStop(0, 'rgba(219,234,254,0.85)'); sg.addColorStop(0.25, 'rgba(147,197,253,0.35)'); sg.addColorStop(1, 'rgba(59,130,246,0)');
  c.fillStyle = sg; c.fillRect(0, h - 900, w, 900);
  const fade = (t0, dy = 60) => { const p = prog(lt, t0, t0 + 0.7, ease.outExpo); return [p, (1 - p) * dy]; };

  // status bar + nav
  setFont(c, F.it, 30, 600); c.fillStyle = '#F5F5F5'; c.textBaseline = 'middle';
  c.fillText(tq < 4.2 ? '6:04' : '6:05', 64, 70);
  c.fillRect(w - 150, 62, 44, 18); c.fillRect(w - 104, 66, 4, 10);
  for (let i = 0; i < 4; i++) c.fillRect(w - 230 + i * 12, 78 - i * 6, 8, 6 + i * 6);
  {
    const [p, dy] = fade(-0.2, 30);
    c.save(); c.globalAlpha = p; c.translate(0, dy);
    // mark: sun rising over a line
    c.fillStyle = '#93C5FD'; c.beginPath(); c.arc(84, 158, 20, Math.PI, 0); c.fill();
    c.fillRect(56, 162, 56, 5);
    setFont(c, F.it, 36, 700, 'normal', -1.2); c.fillStyle = '#F5F5F5'; c.fillText('Kopi Pagi', 128, 156);
    c.beginPath(); c.arc(w - 88, 156, 34, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fill();
    setFont(c, F.it, 28, 700); c.fillStyle = '#F5F5F5'; c.textAlign = 'center'; c.fillText('R', w - 88, 158); c.textAlign = 'left';
    const m0 = mark(K);
    if (m0 > 0) { // it knows it is you
      c.strokeStyle = '#60A5FA'; c.lineWidth = 4; c.beginPath(); c.arc(w - 88, 156, 42, -Math.PI / 2, -Math.PI / 2 + TAU * m0); c.stroke();
      const pr = inv(K, K + 0.8, lt);
      if (pr < 1) { c.strokeStyle = css('#60A5FA', 0.6 * (1 - pr)); c.lineWidth = 3; c.beginPath(); c.arc(w - 88, 156, 42 + pr * 40, 0, TAU); c.stroke(); }
    }
    c.restore();
  }
  c.textBaseline = 'alphabetic';

  // greeting card
  const cx0 = 60, cw = w - 120;
  {
    const [p, dy] = fade(0.15);
    c.save(); c.globalAlpha = p; c.translate(0, dy);
    rr(c, cx0, 440, cw, 430, 44); c.fillStyle = 'rgba(255,255,255,0.075)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
    // underline marker under a word of a line already set in the current font
    const under = (pre, wd, x, y, m, lw) => {
      if (m <= 0) return;
      const x0 = x + c.measureText(pre).width, ww = c.measureText(wd).width;
      c.save(); c.strokeStyle = '#60A5FA'; c.lineWidth = lw; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + ww * m, y); c.stroke(); c.restore();
    };
    setFont(c, F.it, 58, 700, 'normal', -2); c.fillStyle = '#F5F5F5'; c.fillText('Selamat pagi, Rina.', cx0 + 48, 540);
    under('Selamat pagi, ', 'Rina', cx0 + 48, 556, mark(K + 0.2), 7);
    setFont(c, F.it, 36, 450, 'normal', -0.5); c.fillStyle = 'rgba(245,245,245,0.66)';
    c.fillText('Kopi susu, kurang gula', cx0 + 48, 600); c.fillText('seperti biasa?', cx0 + 48, 646);
    under('Kopi susu, ', 'kurang gula', cx0 + 48, 611, mark(K + 0.45), 5);
    // order line
    c.fillStyle = 'rgba(255,255,255,0.10)'; rr(c, cx0 + 48, 676, cw - 96, 2, 1); c.fill();
    setFont(c, F.it, 30, 500); c.fillStyle = 'rgba(245,245,245,0.8)'; c.fillText('1× Kopi susu (L)', cx0 + 48, 724);
    c.textAlign = 'right'; c.fillText('Rp18.000', cx0 + cw - 48, 724); c.textAlign = 'left';
    // button
    const bx = cx0 + 36, by = 752, bw = cw - 72, bh = 96;
    const press = prog(tq, TAP23 - 0.08, TAP23, ease.outQuad) * (1 - prog(tq, TAP23 + 0.05, TAP23 + 0.25, ease.outCubic));
    const done = prog(tq, TAP23 + 0.18, TAP23 + 0.5, ease.outExpo);
    c.save(); c.translate(bx + bw / 2, by + bh / 2); c.scale(1 - 0.035 * press, 1 - 0.035 * press); c.translate(-(bx + bw / 2), -(by + bh / 2));
    rr(c, bx, by, bw, bh, bh / 2); c.fillStyle = mixc('#F5F5F5', '#3B82F6', done); c.fill();
    const rp = inv(TAP23, TAP23 + 0.6, tq);
    if (rp > 0 && rp < 1) {
      c.save(); rr(c, bx, by, bw, bh, bh / 2); c.clip();
      c.beginPath(); c.arc(bx + bw * 0.62, by + bh / 2, 40 + rp * 620, 0, TAU); c.fillStyle = `rgba(96,165,250,${0.5 * (1 - rp)})`; c.fill();
      c.restore();
    }
    c.textAlign = 'center';
    setFont(c, F.it, 38, 700, 'normal', -0.8);
    if (done < 1) { c.globalAlpha = p * (1 - done); c.fillStyle = '#0A1633'; c.fillText('Pesan lagi', bx + bw / 2, by + bh / 2 + 13 - done * 20); }
    if (done > 0) {
      c.globalAlpha = p * done; c.fillStyle = '#FFFFFF';
      const s = 'Siap diambil 06.12', tw = c.measureText(s).width;
      c.fillText(s, bx + bw / 2 + 24, by + bh / 2 + 13 + (1 - done) * 20);
      const kx = bx + bw / 2 - tw / 2 - 20, ky = by + bh / 2;
      c.strokeStyle = '#FFFFFF'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(kx - 14, ky); c.lineTo(kx - 4, ky + 11); c.lineTo(kx + 16, ky - 12); c.stroke();
    }
    c.textAlign = 'left'; c.restore();
    c.restore();
    // touch
    const tp = inv(TAP23 - 0.35, TAP23 + 0.5, tq);
    if (!opt.snapshot && tp > 0 && tp < 1) {
      const a = Math.sin(tp * Math.PI);
      const tx = bx + bw * 0.62, ty = by + bh / 2 + dy;
      c.beginPath(); c.arc(tx, ty, 38 - 8 * press, 0, TAU); c.fillStyle = `rgba(255,255,255,${0.35 * a})`; c.fill();
      c.strokeStyle = `rgba(255,255,255,${0.6 * a})`; c.lineWidth = 3; c.stroke();
    }
  }
  // chips
  {
    const [p, dy] = fade(0.35);
    c.save(); c.globalAlpha = p; c.translate(0, dy);
    const chip = (x, wch, label, dot, hi = 0) => {
      rr(c, x, 902, wch, 76, 38); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
      if (hi > 0) { c.save(); c.shadowColor = 'rgba(96,165,250,0.9)'; c.shadowBlur = 22 * hi; c.strokeStyle = css('#60A5FA', hi); c.lineWidth = 3; rr(c, x, 902, wch, 76, 38); c.stroke(); c.restore(); }
      setFont(c, F.it, 30, 550, 'normal', -0.3); c.fillStyle = '#F5F5F5';
      if (!Array.isArray(label)) c.fillText(label, x + (dot ? 64 : 36), 951);
      else { // [before, from, to, after, t]: a number that rolls when the live count changes
        const [pre, n0, n1, post, t0] = label, x1 = x + (dot ? 64 : 36), dx = c.measureText(pre).width, r = prog(lt, t0, t0 + 0.3, ease.inOutCubic);
        c.fillText(pre, x1, 951); c.fillText(post, x1 + dx + c.measureText(n1).width, 951);
        c.save(); c.beginPath(); c.rect(x1 + dx - 4, 912, 40, 56); c.clip();
        c.fillText(n0, x1 + dx, 951 - r * 44); c.fillText(n1, x1 + dx, 951 + (1 - r) * 44); c.restore();
      }
      if (dot) {
        const pulse = (lt * 1.1) % 1;
        c.beginPath(); c.arc(x + 38, 940, 9 + pulse * 16, 0, TAU); c.fillStyle = `rgba(74,222,128,${0.4 * (1 - pulse)})`; c.fill();
        c.beginPath(); c.arc(x + 38, 940, 9, 0, TAU); c.fillStyle = '#4ADE80'; c.fill();
      }
    };
    chip(cx0, 380, ['Antrean ', '3', '2', ' orang', CUE.queue23], true);
    chip(cx0 + 400, 360, '4 menit dari kamu', false, mark(K + 0.7));
    c.restore();
  }
  // today's menu strip
  {
    const [p, dy] = fade(0.5);
    c.save(); c.globalAlpha = p; c.translate(0, dy);
    setFont(c, F.it, 32, 650, 'normal', -0.6); c.fillStyle = 'rgba(245,245,245,0.72)'; c.fillText('Menu pagi ini', cx0 + 4, 1046);
    const drift = prog(lt, 1.2, 8.8, ease.inOutCubic) * 250; // the strip glides like a carousel
    [['Kopi susu', 'Rp18.000'], ['Tubruk', 'Rp12.000'], ['Roti srikaya', 'Rp15.000'], ['Es kopi aren', 'Rp20.000']].forEach(([n, pr], i) => {
      const x = cx0 + i * 330 - drift;
      rr(c, x, 1072, 310, 120, 30); c.fillStyle = 'rgba(255,255,255,0.07)'; c.fill();
      setFont(c, F.it, 31, 650, 'normal', -0.6); c.fillStyle = '#F5F5F5'; c.fillText(n, x + 28, 1122);
      setFont(c, F.it, 26, 450); c.fillStyle = 'rgba(245,245,245,0.6)'; c.fillText(pr, x + 28, 1162);
    });
    c.restore();
  }
}

// ======================================================================================
// Device bezels — the screen itself evolves
// ======================================================================================
export const BEZEL = {
  crt91: { t: 50, r: 54, ir: 30, a: '#1C1C1E', b: '#070708', gloss: 0.10, led: '#1BFF7A' },
  crt98: { t: 50, r: 30, ir: 14, a: '#E3DCC7', b: '#B4AB93', gloss: 0.18, led: '#39FF14' },
  lcd02: { t: 32, r: 16, ir: 4, a: '#D4D9DF', b: '#858C94', gloss: 0.25, led: '#FF8A1F' },
  gl07: { t: 26, r: 18, ir: 3, a: '#26272B', b: '#050506', gloss: 0.9, led: '#22C3EE' },
  al15: { t: 12, r: 16, ir: 4, a: '#3A3D43', b: '#2B2E33', gloss: 0.0, led: null },
  none: { t: 0, r: 0, ir: 0, a: '#000000', b: '#000000', gloss: 0.0, led: null },
};
export function mixBezel(A, B, k) {
  return { t: lerp(A.t, B.t, k), r: lerp(A.r, B.r, k), ir: lerp(A.ir, B.ir, k), a: mix(A.a, B.a, k), b: mix(A.b, B.b, k), gloss: lerp(A.gloss, B.gloss, k), led: k < 0.5 ? A.led : B.led, ledA: k < 0.5 ? 1 - k * 2 : k * 2 - 1 };
}
// draws the bezel around content rect R = {x,y,w,h}; returns inner-screen clip radius
export function drawBezel(c, R, bz, alpha = 1) {
  if (bz.t < 0.5) return;
  const x = R.x - bz.t, y = R.y - bz.t, w = R.w + bz.t * 2, h = R.h + bz.t * 2;
  c.save(); c.globalAlpha = alpha;
  c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 60; c.shadowOffsetY = 30;
  rr(c, x, y, w, h, bz.r);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, css(bz.a)); g.addColorStop(1, css(bz.b));
  c.fillStyle = g; c.fill();
  c.restore();
  c.save(); c.globalAlpha = alpha;
  rr(c, x + 1, y + 1, w - 2, h - 2, bz.r); c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
  if (bz.gloss > 0.01) {
    c.save(); rr(c, x, y, w, h, bz.r); c.clip();
    const gg = c.createLinearGradient(x, y, x + w * 0.7, y + h * 0.7);
    gg.addColorStop(0, `rgba(255,255,255,${0.22 * bz.gloss})`); gg.addColorStop(0.5, `rgba(255,255,255,${0.05 * bz.gloss})`); gg.addColorStop(0.5001, 'rgba(255,255,255,0)');
    c.fillStyle = gg; c.fillRect(x, y, w, h); c.restore();
  }
  if (bz.led && bz.t > 20) {
    c.globalAlpha = alpha * (bz.ledA ?? 1);
    c.beginPath(); c.arc(R.x + R.w - 24, R.y + R.h + bz.t / 2, 4, 0, TAU); c.fillStyle = bz.led; c.fill();
  }
  // inner lip
  c.globalAlpha = alpha;
  rr(c, R.x - 3, R.y - 3, R.w + 6, R.h + 6, bz.ir + 3); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fill();
  c.restore();
}
