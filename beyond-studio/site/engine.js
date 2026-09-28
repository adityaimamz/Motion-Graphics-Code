(() => {
'use strict';
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, s, d) => clamp((t - s) / d);

// cubic-bezier solver — lets us use Beyond Studio's own motion tokens
function bez(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-7) return sy(t); const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 40; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return sy(t);
  };
}
const eOut = bez(.23, 1, .32, 1);      // --ease-out (brand)
const eIO = bez(.77, 0, .175, 1);      // --ease-in-out (brand)
const eDrawer = bez(.32, .72, 0, 1);   // --ease-drawer (brand)
const eSnap = bez(.6, 0, .15, 1);
const eIn = x => x * x * x;
const eIn4 = x => x * x * x * x;
const eBack = (x, s = 1.9) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
const damp = (t, t0, amp, freq, decay) => (t < t0 ? 0 : amp * Math.exp(-(t - t0) * decay) * Math.sin((t - t0) * freq));

const IDN = (document.documentElement.lang || '').startsWith('id');
const MBON = /mb=/.test(location.hash), FB = MBON ? 0.3 : 1;
// ---- format: 16:9 (default) or vertical 9:16 (<html class="v">)
const V = document.documentElement.classList.contains('v');
const SW = V ? 1080 : 1920, SH = V ? 1920 : 1080, CX = SW / 2, CY = SH / 2;
const VDX = V ? -420 : 0, VDY = V ? 420 : 0;          // shift that re-centres 16:9-designed layers
const PAN = V ? 2150 : 1360;                          // chapter spacing on the device track
// stagger that keeps a word's total reveal time no longer than the English original
const stg = (base, n, refSpan) => base * Math.min(1, refSpan / Math.max(1, n - 1));
const show = (el, on) => { const v = on ? 'block' : 'none'; if (el._d !== v) { el.style.display = v; el._d = v; } };
const tf = (el, s) => { el.style.transform = s; };

// ---------- split text into animatable characters ----------
document.querySelectorAll('.sp').forEach(sp => {
  const txt = sp.textContent; sp.textContent = ''; sp._ch = [];
  for (const c of txt) {
    const s = document.createElement('span'); s.className = 'ch';
    s.textContent = c === ' ' ? '\u00A0' : c; sp.appendChild(s); sp._ch.push(s);
  }
});
(() => { // wordmark S1 chars
  const el = $('wm1'), txt = el.textContent; el.textContent = ''; el._ch = [];
  for (const c of txt) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c === ' ' ? '\u00A0' : c; el.appendChild(s); el._ch.push(s); }
})();
const chars = el => el.querySelector('.sp')._ch;
const allChars = el => [...el.querySelectorAll('.sp')].flatMap(s => s._ch);

// odometers
function buildNum(el, digits, suffix) {
  el._d = [];
  digits.forEach(v => {
    const d = document.createElement('span'); d.className = 'dig';
    const st = document.createElement('span'); st.className = 'strip';
    for (let i = 0; i < 30; i++) { const s = document.createElement('span'); s.textContent = i % 10; st.appendChild(s); }
    d.appendChild(st); el.appendChild(d); el._d.push({ st, v });
  });
  const s = document.createElement('span'); s.className = 'suf'; s.textContent = suffix; el.appendChild(s); el._suf = s;
}
buildNum($('num1'), [8, 0], '+');
buildNum($('num2'), [9, 8], '%');

// ---------- elements ----------
const L = {
  s1: $('s1'), s2: $('s2'), chap: $('chap'), track: $('track'), s6: $('s6'), s7: $('s7'), wipe: $('wipe'), s8: $('s8')
};
const g1 = $('bgglow1'), g2 = $('bgglow2'), cam = $('cam'), grain = $('grain');
const grainImgs = [0, 1, 2, 3].map(i => `url(assets/grain${i}.png)`);

let M = {}; // measurements
function measure() {
  // S1 lockup
  const wm = $('wm1');
  const W = wm.offsetWidth;
  const markW = 296 * 0.6, gap = 46;
  const total = markW + gap + W;
  const start = 960 - total / 2;
  M.lockDx = start + markW / 2 - 960;
  M.wmLeft = start + markW + gap;
  wm.style.left = M.wmLeft + 'px'; wm.style.top = (540 - 62) + 'px';
  M.wmCx = wm._ch.map(c => M.wmLeft + c.offsetLeft + c.offsetWidth / 2);
  // chapter head
  M.l1w = $('chl1').offsetWidth;
  M.ww = [0, 1, 2].map(i => $('wd' + i).offsetWidth);
  M.w2two = $('wd2').querySelectorAll('.ln').length > 1;
  M.cap6w = $('cap6').offsetWidth;
  // pill
  const u = $('url8'); u.textContent = 'beyondstudio.site'; M.urlW = u.offsetWidth; u.textContent = '';
  M.pillW = 44 + 30 + 18 + M.urlW + 8 + 24 + 108;
  M.lock8w = $('lock8').offsetWidth;
  M.kv = [$('kv1').offsetWidth, $('kv2').offsetWidth];
  M.waW = $('wa8').offsetWidth;
}

// ---------- background glow keyframes: [t, x, y, scale, opacity] ----------
const G1 = [
  [0, 960, 540, .35, 0], [1.7, 960, 540, .4, 0], [2.05, 960, 540, .85, .95], [3.2, 900, 540, .8, .7], [3.75, 1500, 540, .6, 0],
  [3.9, 960, 560, .6, .0], [4.3, 960, 560, .7, .45], [6.5, 960, 560, .75, .45], [7.6, 1300, 520, .85, .75],
  [18.3, 1400, 520, .85, .8], [18.9, 960, 560, .8, .55], [22.3, 960, 560, .8, .6], [22.5, 960, 560, .8, 0],
  [26.3, 960, 1020, 1.1, 0], [27.0, 960, 1020, 1.15, .95], [30, 960, 1000, 1.2, .9]
];
const G2 = [
  [0, 1500, 900, .7, 0], [7.2, 1600, 920, .7, 0], [8.2, 1600, 900, .8, .7], [18.2, 1650, 880, .8, .7], [18.9, 960, 900, .7, 0],
  [26.8, 960, 760, .55, 0], [27.8, 960, 760, .6, .55], [30, 960, 760, .62, .6]
];
function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) { const k = eIO((t - a[0]) / (b[0] - a[0] || 1)); return a.map((v, j) => lerp(v, b[j], k)); }
  }
  return keys[keys.length - 1];
}

// ======================= S1: ignition =======================
function arrowX(t) {
  const fly = eSnap(P(t, 1.02, 0.855));
  const pre = eIO(P(t, 3.02, 0.28));
  const la = eIn(P(t, 3.3, 0.43));
  return lerp(-1350, 0, fly) + damp(t, 1.875, 16, 34, 11) - 34 * pre + 2500 * la;
}
function S1(t) {
  const lk = eOut(P(t, 2.08, 0.85));
  const kick = 1 + damp(t, 1.875, 0.045, 30, 9);
  const s = lerp(0.74, 0.6, lk) * kick;
  const dx = M.lockDx * lk;
  const logo = $('logo1');
  logo.style.left = (960 - 249) + 'px'; logo.style.top = (540 - 247) + 'px';
  logo.style.transformOrigin = '249px 247px';
  tf(logo, `translate(${dx}px,0) scale(${s})`);

  // ring: symmetric draw from 9 o'clock to the gap, retract on exit
  const d = eIO(P(t, 0.22, 1.42)) * (1 - eIO(P(t, 3.1, 0.4)));
  const sw = lerp(3, 34, eOut(P(t, 0.3, 1.5)));
  ['arcU1', 'arcL1'].forEach(id => { const a = $(id); a.setAttribute('stroke-dasharray', `${d} 1`); a.setAttribute('stroke-width', sw); a.style.visibility = d > 0.001 ? 'visible' : 'hidden'; });

  // arrow flight + motion blur
  const ax = arrowX(t), v = ax - arrowX(t - 1 / 60);
  const ar = $('arrow1');
  ar.setAttribute('transform', `translate(${ax / s},0)`);
  const blur = FB * Math.min(170, Math.abs(v) * 0.5) / s;
  $('mb1b').setAttribute('stdDeviation', `${blur.toFixed(2)} 0`);
  ar.style.visibility = (t > 1.0 && ax < 2400) ? 'visible' : 'hidden';

  // shockwave on lock
  const sk = P(t, 1.875, 0.8), sh = $('shock');
  const r = lerp(150, 620, eOut(sk));
  sh.style.width = sh.style.height = 2 * r + 'px';
  sh.style.left = (960 + dx - r) + 'px'; sh.style.top = (540 - r) + 'px';
  sh.style.opacity = t < 1.875 ? 0 : (1 - sk) * 0.7;
  sh.style.borderWidth = lerp(3, 0.5, sk) + 'px';

  // wordmark
  const tipX = 960 + dx + ax + (330 - 249) * s;
  const wm = $('wm1');
  wm._ch.forEach((c, j) => {
    const k = eOut(P(t, 2.2 + j * 0.03, 0.7));
    let y = (1 - k) * 1.05, rot = 0, op = k, sc = 1;
    const hp = clamp((tipX - M.wmCx[j] + 30) / 240);
    if (hp > 0 && t > 3.3) { const e = eOut(hp); const sg = j % 2 ? -1 : 1; y += sg * 0.9 * e; rot = sg * 14 * e; op *= 1 - hp; sc = 1 - .25 * e; }
    c.style.transform = `translateY(${y}em) rotate(${rot}deg) scale(${sc})`;
    c.style.opacity = op;
  });
  wm.style.clipPath = t < 3.3 ? `inset(-20% -5% -20% 0)` : 'none';
}

// ======================= S2: process words =======================
function S2(t) {
  // Designed. — weight + tracking morph
  const k1 = eOut(P(t, 3.75, 0.78));
  const w1 = $('kw1'); show(w1, t < 4.72);
  w1.style.fontWeight = lerp(100, 800, k1);
  w1.style.letterSpacing = lerp(0.22, -0.045, k1) + 'em';
  w1.style.opacity = P(t, 3.75, 0.1);
  tf(w1, `scale(${lerp(1.08, 1, k1)})`);
  { const n1 = chars(w1).length; chars(w1).forEach((c, j) => { c.style.transform = `translateY(${-132 * eIn(P(t, 4.47 + j * stg(0.013, n1, 8), 0.2))}%)`; }); }

  // Built. — slam
  const w2 = $('kw2'); show(w2, t >= 4.69 && t < 5.66);
  const k2 = eOut(P(t, 4.69, 0.42));
  const out2 = eIn(P(t, 5.44, 0.2));
  const bl = lerp(26, 0, eOut(P(t, 4.69, 0.24))) + 14 * out2;
  w2.style.filter = bl > 0.3 ? `blur(${bl}px)` : 'none';
  w2.style.opacity = P(t, 4.69, 0.05) * (1 - out2);
  tf(w2, `scale(${lerp(2.1, 1, k2) * lerp(1, 1.035, P(t, 4.9, 0.6)) * lerp(1, .84, out2)})`);

  // Launched. — rise in, launch out upward
  const w3 = $('kw3'); show(w3, t >= 5.6 && t < 6.6);
  chars(w3).forEach((c, j) => {
    const n3 = chars(w3).length;
    const i = eOut(P(t, 5.63 + j * stg(0.03, n3, 8), 0.55));
    const mid = (n3 - 1) / 2; const o = eIn4(P(t, 6.3 + Math.abs(j - mid) * 0.03 * Math.min(1, 4 / mid), 0.22));
    c.style.transform = `translateY(${(1 - i) * 132 - o * 150}%)`;
  });
}

// ======================= chapter headline =======================
const WT = [[7.0, 11.0], [11.2, 14.76], [14.94, 18.2]];
function CHAP(t) {
  const k1 = eIO(P(t, 7.36, 0.74)), k2 = eIO(P(t, 7.42, 0.74));
  const ys = (M.w2two && !V ? -58 : 0) * eIO(P(t, 14.9, 0.6));
  const l1 = $('chl1');
  l1.style.left = lerp(CX - M.l1w / 2, V ? 80 : 150, k1) + 'px';
  l1.style.top = ((V ? lerp(850, 318, k1) : lerp(418, 432, k1)) + ys) + 'px';
  const l1s = l1.querySelector('.sp');
  l1s.style.display = 'inline-block';
  l1s.style.transform = `translateY(${(1 - eOut(P(t, 6.56, 0.7))) * 132 - eIn(P(t, 18.24, 0.26)) * 132}%)`;
  const chw = $('chw');
  chw.style.left = lerp(CX - M.ww[0] / 2, V ? 80 : 150, k2) + 'px';
  chw.style.top = ((V ? lerp(918, 386, k2) : lerp(486, 498, k2)) + ys) + 'px';
  WT.forEach(([ti, to], i) => {
    const wd = $('wd' + i); show(wd, t > ti - 0.05 && t < to + 0.7);
    allChars(wd).forEach((c, j) => {
      const a = eOut(P(t, ti + j * 0.022, 0.62)), b = eIn(P(t, to + j * (i === 2 ? 0.008 : 0.013), i === 2 ? 0.24 : 0.3));
      c.style.transform = `translateY(${(1 - a) * 136 - b * 136}%)`;
    });
  });
}

// ======================= devices track =======================
function trackK(t) {
  return -1 + eOut(P(t, 7.64, 1.1)) + eIO(P(t, 10.93, 0.64)) + eIO(P(t, 14.7, 0.64)) + eIO(P(t, 18.26, 0.62));
}
function place(el, c, k, x, y, f, ry, rx, t, extra = '') {
  const yo = (c - k) * PAN * f - (t - 7.5) * 8 * f;
  const vis = Math.abs(c - k) < 1.25;
  el.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return null;
  tf(el, `translate3d(${x}px,${y + yo}px,0) perspective(2400px) rotateY(${ry}deg) rotateX(${rx}deg) ${extra}`);
  return yo;
}
function shadow(el, c, k, x, y, w, t) {
  const yo = (c - k) * PAN - (t - 7.5) * 8;
  const vis = Math.abs(c - k) < 1.25; el.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return;
  el.style.left = x + 'px'; el.style.top = (y + yo) + 'px'; el.style.opacity = clamp(1 - Math.abs(c - k) * 1.6) * .9;
}
function sheen(el, t0, t) { const p = P(t, t0, 1.0); el.style.backgroundPosition = `${lerp(130, -30, eIO(p))}% 0`; el.style.opacity = p > 0 && p < 1 ? 1 : 0; }

const BARH = [.46, .62, .38, .94, .58, .34];
// virtual camera on the device track: [t, scale, originX, originY]
//  ch0 slow dolly-in · ch1 opens in close on "See projects" then pulls out to reveal · ch2 pushes in on the cards
const CAM = [
  [7.4, 1.0, 1380, 560], [11.0, 1.05, 1380, 560],
  [11.4, 1.36, 1330, 500], [12.78, 1.3, 1330, 500], [13.6, 1.0, 1380, 540], [14.6, 1.02, 1380, 540],
  [14.75, 1.0, 1420, 700], [15.95, 1.02, 1420, 700], [17.35, 1.14, 1420, 700], [18.4, 1.15, 1420, 700]
];
function TRACK(t) {
  const k = trackK(t), vk = (k - trackK(t - 1 / 60)) * 60;
  const tb = FB * Math.min(7, Math.abs(vk) * 2.4);
  const tr = L.track;
  tr.style.filter = tb > 0.4 ? `blur(${tb.toFixed(2)}px)` : 'none';
  const cm = kf(CAM, t); tr.style.transformOrigin = '0 0';
  tf(tr, `${V ? 'translate(-642px,551px) scale(0.86) ' : ''}translate(${cm[2]}px,${cm[3]}px) scale(${cm[1].toFixed(4)}) translate(${-cm[2]}px,${-cm[3]}px)`);
  const drift = P(t, 7.5, 11);

  // --- chapter 0: businesses
  const ry0 = lerp(17, 9, P(t, 7.5, 3.8));
  shadow($('sh3a'), 0, k, 830, 845, 1100, t);
  place($('lap3'), 0, k, 900, 246, 1, ry0, 5, t);
  tf($('lap3img'), `scale(${lerp(1, 1.06, P(t, 7.6, 3.6))}) translateY(${lerp(0, -8, P(t, 7.6, 3.6))}px)`);
  $('lap3img').style.transformOrigin = '50% 0';
  sheen($('sheen3'), 8.25, t);
  place($('ph3'), 0, k, 1604, 372, 1.16, ry0 + 3, 4, t);
  place($('chart3'), 0, k, 846, 650, 1.32, ry0 - 2, 4, t);
  [...$('bars3').children].forEach((b, i) => { b.firstChild.style.height = (BARH[i] * 136 * eOut(P(t, 8.35 + i * 0.07, 0.75))) + 'px'; });
  { const v = (12.4 * eOut(P(t, 8.35, 1.2))).toFixed(1); $('rev3').textContent = IDN ? 'Rp ' + v.replace('.', ',') + ' jt' : 'Rp ' + v + 'M'; }
  const cp = eBack(P(t, 9.0, 0.4)); tf($('chip3'), `scale(${cp})`); $('chip3').style.opacity = clamp(cp);
  // tap on store CTA (beat)
  const press = P(t, 9.76, 0.1) - P(t, 9.88, 0.18);
  tf($('cta3'), `scale(${1 - 0.045 * clamp(press)})`);
  const rp = P(t, 9.84, 0.55), rip = $('rip3');
  rip.style.left = '177px'; rip.style.top = '28px';
  tf(rip, `scale(${lerp(0, 11, eOut(rp))})`); rip.style.opacity = t < 9.84 ? 0 : (1 - rp) * .6;
  const bg = $('badge3'); bg.textContent = t < 9.98 ? '2' : '3';
  tf(bg, `scale(${1 + damp(t, 9.98, .5, 26, 9)})`);
  const to = eOut(P(t, 10.0, 0.5)); tf($('toast3'), `translateY(${lerp(-90, 0, to)}px)`); $('toast3').style.opacity = clamp(to * 2);

  // --- chapter 1: portfolios
  const ry1 = lerp(16, 9, P(t, 11.0, 3.9));
  shadow($('sh4a'), 1, k, 830, 830, 1100, t);
  place($('win4'), 1, k, 910, 214, 1, ry1, 4, t);
  tf($('win4img'), `scale(${lerp(1.0, 1.07, P(t, 11.1, 3.8))})`); $('win4img').style.transformOrigin = '50% 30%';
  sheen($('sheen4'), 11.95, t);
  place($('ph4'), 1, k, 1592, 404, 1.18, ry1 + 3, 4, t);
  { const bl = t < 13.6 ? 3.2 * (1 - eIO(P(t, 12.85, 0.7))) : 0; $('ph4').style.filter = bl > 0.2 ? `blur(${bl.toFixed(2)}px)` : 'none'; }
  tf($('folioScroll'), `translateY(${-452 * eIO(P(t, 12.3, 1.55))}px)`);

  // --- chapter 2: academic systems
  const ry2 = lerp(16, 9, P(t, 14.8, 3.9));
  shadow($('sh5a'), 2, k, 900, 815, 1000, t);
  place($('win5'), 2, k, 968, 196, 1, ry2, 4, t);
  { const bl = 3.6 * eIO(P(t, 16.1, 1.1)); $('win5').style.filter = bl > 0.2 ? `blur(${bl.toFixed(2)}px)` : 'none'; }
  tf($('win5img'), `scale(${lerp(1.0, 1.06, P(t, 14.9, 3.8))})`); $('win5img').style.transformOrigin = '50% 40%';
  sheen($('sheen5'), 15.7, t);
  place($('diag'), 2, k, 1520, 736, 1.2, ry2 + 2, 4, t);
  place($('thesis'), 2, k, 872, 548, 1.34, ry2 - 2, 4, t);
  let done = 0;
  document.querySelectorAll('#thesis .th-row').forEach((row, i) => {
    const t0 = 15.94 + i * 0.46875;
    const f = eBack(P(t, t0, 0.3), 2.2), c = eOut(P(t, t0 + 0.06, 0.28));
    tf(row.querySelector('.f'), `scale(${f})`);
    row.querySelector('path').setAttribute('stroke-dashoffset', 1 - c);
    done += eOut(P(t, t0, 0.35));
  });
  $('thbar').style.width = (done / 5 * 100) + '%';
  $('thp').textContent = Math.round(done / 5 * 100) + (IDN ? '% selesai' : '% complete');
  const gv = 0.92 * eOut(P(t, 16.1, 1.7));
  $('gfill').setAttribute('stroke-dasharray', `${(gv * 0.9).toFixed(4)} 1`);
  $('gfill').style.visibility = gv > 0.003 ? 'visible' : 'hidden';
  $('gval').textContent = Math.round(gv * 100) + '%';
  { const th = (18 + 324 * gv + 7) * Math.PI / 180, nd = $('gneedle');
    nd.setAttribute('transform', `translate(${(59 + 50 * Math.cos(th)).toFixed(2)},${(59 + 50 * Math.sin(th)).toFixed(2)}) rotate(${(th * 180 / Math.PI + 90).toFixed(2)}) scale(0.115)`);
    nd.style.visibility = gv > 0.01 ? 'visible' : 'hidden'; }
}

// ======================= S6: responsive =======================
const V3 = (a, b, c, m) => (m <= 1 ? lerp(a, b, m) : lerp(b, c, m - 1));
function S6(t) {
  const m = eIO(P(t, 19.38, 0.95)) + eIO(P(t, 20.58, 0.95));
  const en = eOut(P(t, 18.5, 1.0));
  const cw = V3(1440, 800, 390, m), chh = V3(766, 856, 800, m);
  const bar = V3(42, 42, 0, m), bz = V3(0, 0, 12, m), rad = V3(16, 22, 56, m);
  const ow = cw + 2 * bz, oh = chh + bar + 2 * bz;
  const left = CX - ow / 2, top = CY - oh / 2 + (1 - en) * (V ? 1400 : 900);
  const fitS = V ? Math.min(1, 1000 / ow) : 1;
  const w = $('win6');
  w.style.left = left + 'px'; w.style.top = top + 'px'; w.style.width = ow + 'px'; w.style.height = oh + 'px';
  w.style.borderRadius = rad + 'px';
  const ringA = clamp(m - 1);
  w.style.boxShadow = `0 0 0 1px rgba(255,255,255,${lerp(.1, 0, ringA)}), inset 0 0 0 ${lerp(0, 2, ringA)}px #45454e, 0 60px 120px -20px rgba(0,0,0,.85)`;
  tf(w, `scale(${lerp(.9, 1, en) * fitS})`);
  const sh = $('sh6'); sh.style.left = (CX - 700) + 'px'; sh.style.top = (top + oh / 2 + oh * fitS / 2 - 50) + 'px'; sh.style.opacity = .8 * en;
  sh.style.width = '1400px'; tf(sh, `scaleX(${ow * fitS / 1440})`);

  const wb = $('w6bar'); wb.style.height = bar + 'px'; wb.style.opacity = clamp(bar / 30);
  const sc = $('w6scr');
  sc.style.left = bz + 'px'; sc.style.top = (bar + bz) + 'px'; sc.style.width = cw + 'px'; sc.style.height = chh + 'px';
  sc.style.borderRadius = V3(0, 0, 44, m) + 'px';
  const ph = clamp((m - 1.5) / 0.4);
  $('w6island').style.top = '11px'; $('w6island').style.opacity = ph; $('w6status').style.opacity = ph;

  const px = V3(56, 40, 22, m);
  const nav = $('nnav'); nav.style.left = px + 'px'; nav.style.right = px + 'px'; nav.style.top = V3(22, 22, 58, m) + 'px';
  const lo = clamp((cw - 900) / 140); $('nlinks').style.opacity = lo; $('nlinks').style.visibility = lo > 0.01 ? 'visible' : 'hidden';
  $('nburg').style.opacity = 1 - lo;
  const hero = $('nhero'); hero.style.left = px + 'px'; hero.style.top = V3(116, 108, 126, m) + 'px'; hero.style.width = V3(620, 720, 346, m) + 'px';
  $('nh1').style.fontSize = V3(86, 76, 48, m) + 'px';
  const np = $('np'); np.style.fontSize = V3(20, 19, 16, m) + 'px'; np.style.maxWidth = V3(480, 600, 346, m) + 'px';
  const vis = $('nvis'); { const m2 = eIO(P(t, 19.42, 0.95)) + eIO(P(t, 20.62, 0.95));
  vis.style.left = V3(724, 40, 22, m2) + 'px'; vis.style.top = V3(104, 452, 470, m2) + 'px';
  vis.style.width = V3(660, 720, 346, m2) + 'px'; vis.style.height = V3(392, 300, 214, m2) + 'px'; }
  const F = [
    [[56, 528, 426.7, 206], [40, 780, 350, 190], [22, 712, 346, 162]],
    [[506.7, 528, 426.7, 206], [410, 780, 350, 190], [22, 888, 346, 162]],
    [[957.3, 528, 426.7, 206], [40, 990, 350, 190], [22, 1064, 346, 162]]
  ];
  F.forEach((f, i) => {
    const m = eIO(P(t, 19.38 + (i + 1) * 0.07, 0.95)) + eIO(P(t, 20.58 + (i + 1) * 0.07, 0.95));
    const e = $('nf' + (i + 1));
    e.style.left = V3(f[0][0], f[1][0], f[2][0], m) + 'px'; e.style.top = V3(f[0][1], f[1][1], f[2][1], m) + 'px';
    e.style.width = V3(f[0][2], f[1][2], f[2][2], m) + 'px'; e.style.height = V3(f[0][3], f[1][3], f[2][3], m) + 'px';
  });

  // viewport readout, rides the right edge
  const ro = $('readout');
  ro.firstChild.nodeValue = Math.round(cw);
  if (V) { ro.style.left = (CX - ro.offsetWidth / 2) + 'px'; ro.style.top = (CY + oh * fitS / 2 + 56) + 'px'; }
  else { ro.style.left = (left + ow + 70) + 'px'; ro.style.top = (540 - 64) + 'px'; }
  ro.style.opacity = clamp((1200 - cw) / 160) * (1 - P(t, 22.0, 0.15));
  // caption
  const cap = $('cap6');
  if (V) { cap.style.left = (CX - M.cap6w / 2) + 'px'; cap.style.top = (CY - oh * fitS / 2 - 250) + 'px'; }
  else { cap.style.left = (left - 72 - M.cap6w) + 'px'; cap.style.top = (540 - 88) + 'px'; }
  cap.querySelectorAll('.sp').forEach((s, i) => { s.style.display = 'inline-block'; tf(s, `translateY(${(1 - eOut(P(t, 21.12 + i * 0.09, 0.7))) * 132}%)`); });
  cap.style.opacity = 1 - P(t, 22.0, 0.15);

  // tap → burst into blue
  const nb = $('nb1');
  const pr = P(t, 21.9, 0.09) - P(t, 22.0, 0.14);
  tf(nb, `scale(${1 - 0.06 * clamp(pr)})`);
  const bu = $('burst');
  if (t > 21.98) {
    const r0 = nb.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    const r = lerp(8, 2500, Math.pow(P(t, 21.99, 0.49), 2.4));
    bu.style.display = 'block';
    bu.style.left = (cx - r) + 'px'; bu.style.top = (cy - r) + 'px'; bu.style.width = bu.style.height = 2 * r + 'px';
  } else bu.style.display = 'none';
}

// ======================= S7: proof =======================
function odo(el, t0, t) {
  const k = eOut(P(t, t0, 1.05));
  el._d.forEach((d, i) => {
    const target = (i === 0 ? 10 : 20) + d.v;
    tf(d.st, `translateY(${-target * k}em)`);
  });
  el.style.fontWeight = lerp(140, 820, eOut(P(t, t0, 1.15)));
  const s = eBack(P(t, t0 + 0.55, 0.4)); tf(el._suf, `scale(${s})`); el._suf.style.opacity = clamp(s);
}
function S7(t) {
  const st1 = $('st1'), st2 = $('st2');
  const ex1 = eIn(P(t, 24.12, 0.3)), ex2 = eIn(P(t, 24.17, 0.3));
  st1.style.left = (V ? 90 : 240) + 'px'; st1.style.top = ((V ? 470 : 320) - ex1 * 160) + 'px'; st1.style.opacity = 1 - ex1;
  st2.style.left = (V ? 90 : 1040) + 'px'; st2.style.top = ((V ? 1010 : 320) - ex2 * 160) + 'px'; st2.style.opacity = 1 - ex2;
  show(st1, t < 24.5); show(st2, t < 24.5);
  odo($('num1'), 22.52, t); odo($('num2'), 22.92, t);
  [st1, st2].forEach((st, i) => {
    const s = st.querySelector('.lab .sp'); s.style.display = 'inline-block';
    tf(s, `translateY(${(1 - eOut(P(t, 22.9 + i * 0.4, 0.7))) * 132}%)`);
  });
  const kv1 = $('kv1'), kv2 = $('kv2');
  show(kv1, t > 24.3 && t < 25.7); show(kv2, t > 25.25);
  chars(kv1).forEach((c, j) => { const a = eOut(P(t, 24.37 + j * 0.018, 0.55)), b = eIn(P(t, 25.22 + j * 0.01, 0.24)); c.style.transform = `translateY(${(1 - a) * 132 - b * 132}%)`; });
  chars(kv2).forEach((c, j) => { const a = eOut(P(t, 25.3 + j * 0.018, 0.55)); c.style.transform = `translateY(${(1 - a) * 132}%)`; });
  kv1.style.fontWeight = lerp(300, 780, eOut(P(t, 24.37, 0.8)));
  kv2.style.fontWeight = lerp(300, 780, eOut(P(t, 25.3, 0.8)));
}

// ======================= wipe =======================
function WIPE(t) {
  const B = V ? 1510 : 1150, X = lerp(-120, SW + B + 200, eIO(P(t, 25.95, 0.38))), T0 = -800, T1 = SH + 800;
  $('wipeP').setAttribute('points', `-6000,${T0} ${X - B},${T0} ${X},${CY} ${X - B},${T1} -6000,${T1}`);
  $('wipeE').setAttribute('points', `${X - B},${T0} ${X},${CY} ${X - B},${T1}`);
}

// ======================= S8: CTA =======================
const TYPE = (() => { const out = []; let acc = 0; const j = [0, .06, .04, .07, .05, .05, .09, .04, .05, .06, .04, .05, .08, .05, .04, .06, .05]; for (let i = 0; i < 17; i++) { acc += j[i] || .05; out.push(acc); } return out; })();
function S8(t) {
  const lock = $('lock8');
  lock.style.left = (CX - M.lock8w / 2) + 'px'; lock.style.top = ((V ? 600 : 300) - 49) + 'px';
  const d = eIO(P(t, 26.38, 0.95));
  ['arcU8', 'arcL8'].forEach(id => { const a = $(id); a.setAttribute('stroke-dasharray', `${d} 1`); a.style.visibility = d > 0.001 ? 'visible' : 'hidden'; });
  const ak = eBack(P(t, 26.72, 0.5), 1.6), ar = $('arrow8');
  ar.style.transform = `translateX(${lerp(-140, 0, eOut(P(t, 26.72, 0.5)))}px) scale(${ak})`;
  ar.style.opacity = clamp(P(t, 26.72, 0.12));
  const wm = $('wm8').querySelector('.sp'); wm.style.display = 'inline-block';
  wm._ch.forEach((c, j) => { c.style.transform = `translateY(${(1 - eOut(P(t, 26.8 + j * 0.022, 0.65))) * 132}%)`; });

  const cta = $('cta8');
  cta.style.fontWeight = lerp(260, 790, eOut(P(t, 26.95, 1.0)));
  { const nc = chars(cta).length; chars(cta).forEach((c, j) => { c.style.transform = `translateY(${(1 - eOut(P(t, 26.95 + j * stg(0.024, nc, 17), 0.62))) * 132}%)`; }); }

  const pk = eOut(P(t, 27.5, 0.8)), pill = $('pill');
  const pw = lerp(108, M.pillW, pk);
  pill.style.width = pw + 'px'; pill.style.top = (V ? 1000 : 690) + 'px';
  const GAP = 28, grpW = M.pillW + GAP + M.waW, gx = 960 - grpW / 2;
  pill.style.left = (V ? CX - pw / 2 : lerp(960 - pw / 2, gx, eIO(P(t, 28.3, 0.55)))) + 'px';
  const wa = $('wa8'), wk = eBack(P(t, 28.42, 0.5), 1.5);
  wa.style.left = (V ? CX - M.waW / 2 : gx + M.pillW + GAP) + 'px'; wa.style.top = (V ? 1140 : 690) + 'px';
  wa.style.opacity = clamp(P(t, 28.42, 0.12));
  tf(wa, `translate${V ? 'Y' : 'X'}(${lerp(46, 0, eOut(P(t, 28.42, 0.55)))}px) scale(${lerp(0.82, 1, wk)})`);
  const wr = P(t, 29.4, 0.8), wic = wa.querySelector('.waic');
  wic.style.boxShadow = `0 10px 30px rgba(37,211,102,.4), 0 0 0 ${lerp(0, 22, eOut(wr))}px rgba(37,211,102,${t > 29.4 ? (1 - wr) * .45 : 0})`;
  const qr = $('qr8'), qk = eOut(P(t, 28.8, 0.7));
  qr.style.left = '1640px'; qr.style.top = (748 + (1 - qk) * 34) + 'px'; qr.style.opacity = qk;
  pill.style.opacity = clamp(P(t, 27.45, 0.14));
  tf(pill, `scale(${lerp(.7, 1, eBack(P(t, 27.45, 0.45), 1.4))})`);
  pill.querySelector('.in').style.opacity = clamp(P(t, 27.75, 0.2));
  const n = TYPE.filter(x => t >= 27.85 + x).length;
  $('url8').textContent = 'beyondstudio.site'.slice(0, n);
  const typingDone = 27.85 + TYPE[16];
  const blink = t < typingDone + 0.1 ? 1 : (Math.floor((t - typingDone) / 0.5) % 2 === 0 ? 0 : 1);
  $('caret').style.opacity = (t > 27.8 ? 1 : 0) * blink;
  const go = $('go'), gk = eBack(P(t, 28.62, 0.5), 2.0);
  const press = 1 - 0.08 * clamp(P(t, 29.05, 0.08) - P(t, 29.13, 0.22));
  tf(go, `scale(${gk * press})`);
  const ring = P(t, 29.12, 0.7);
  go.style.boxShadow = `0 10px 40px rgba(37,99,235,.55), 0 0 0 ${lerp(0, 26, eOut(ring))}px rgba(96,165,250,${t > 29.12 ? (1 - ring) * .45 : 0})`;
  const sb = $('sub8'), sk = eOut(P(t, 28.78, 0.8));
  sb.style.opacity = sk; tf(sb, `translateY(${(1 - sk) * 24}px)`);
}

// ======================= live UI + guide arrow =======================
// The logo's arrowhead is the film's through-line: it launches the words, rises with every
// chapter, lands inside each screen as the cursor that drives the UI, then leaves upward.
const ARROW_D = 'M-130,-75 L0,0 L-130,80 L-96,0 Z';   // tip at (0,0) = cursor hotspot
const CUR_ROT = -120, CUR_PX = 0.27;                 // pointer angle, on-screen path scale
let curN = 0;
function makeCursor(parent, pgS) {
  const c = document.createElement('div'); c.className = 'cur';
  const s = CUR_PX / pgS, id = 'csh' + (curN++);
  c.innerHTML = `<svg width="1" height="1"><defs><filter id="${id}" x="-1" y="-1" width="3" height="3">` +
    `<feDropShadow dx="0" dy="${(3.5 / CUR_PX).toFixed(1)}" stdDeviation="${(4 / CUR_PX).toFixed(1)}" flood-color="#000" flood-opacity=".5"/></filter></defs>` +
    `<g class="cg" transform="rotate(${CUR_ROT}) scale(${s.toFixed(4)})"><path d="${ARROW_D}" fill="#F8FAFC" stroke="#0B0B10" stroke-width="${(2.4 / CUR_PX).toFixed(2)}" stroke-linejoin="round" filter="url(#${id})"/></g></svg>`;
  parent.appendChild(c); c._g = c.querySelector('.cg'); c._s = s; return c;
}
// cursor paths in screenshot pixels: [time, x, y]; clicks on the beat (128 BPM grid from 7.5 s)
const CUR = {
  3: { pg: 'pg3', pgS: 0.73226, on: [8.55, 10.72], clk: 'clk3', clicks: [8.906, 9.375, 9.844],
       keys: [[8.55, 560, 330], [8.84, 726, 454], [8.98, 726, 454], [9.3, 750, 546], [9.42, 750, 546], [9.74, 842, 700], [9.96, 842, 700], [10.62, 610, 400]] },
  4: { pg: 'pg4', pgS: 0.77419, on: [12.05, 14.52], clk: 'clk4', clicks: [12.656],
       keys: [[12.05, 820, 330], [12.5, 552, 472], [12.76, 552, 472], [13.5, 700, 390], [14.45, 770, 340]] },
  5: { pg: 'pg5', pgS: 0.70968, on: [15.55, 18.02], clk: 'clk5', clicks: [15.94],
       keys: [[15.55, 860, 470], [15.86, 628, 686], [16.06, 628, 686], [16.85, 790, 560], [17.95, 830, 540]] },
  6: { pg: 'w6scr', pgS: 1, on: [19.2, 22.06], clicks: [21.9], keys: null }
};
Object.values(CUR).forEach(c => { if (c.pgS !== 1) { $(c.pg).style.transform = `scale(${c.pgS})`; } c.el = makeCursor($(c.pg), c.pgS); });

function pathAt(keys, t) {
  if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) {
      const u = eIO((t - a[0]) / (b[0] - a[0] || 1)), arc = Math.sin(Math.PI * u) * 0.12;
      const dx = b[1] - a[1], dy = b[2] - a[2];
      return [a[1] + dx * u - dy * arc, a[2] + dy * u + dx * arc];
    }
  }
  const z = keys[keys.length - 1]; return [z[1], z[2]];
}
const hoverA = (t, a, b, f = 0.08) => clamp(P(t, a, f)) * (1 - clamp(P(t, b, f)));
function placeCursor(c, t, x, y) {
  const on = t >= c.on[0] && t < c.on[1];
  c.el.style.visibility = on ? 'visible' : 'hidden';
  // idle micro-drift so a resting hand never looks frozen
  x += 1.4 * Math.sin(t * 2.3) / c.pgS; y += 1.1 * Math.sin(t * 1.9 + 1.3) / c.pgS;
  c.el.style.left = x + 'px'; c.el.style.top = y + 'px';
  let press = 0;
  c.clicks.forEach(tc => { press = Math.max(press, clamp(P(t, tc - 0.06, 0.06) - P(t, tc + 0.02, 0.16))); });
  c.el._g.setAttribute('transform', `rotate(${CUR_ROT}) scale(${(c.el._s * (1 - 0.16 * press)).toFixed(4)})`);
  if (c.clk) {
    const r = $(c.clk); let rp = -1, tc0 = 0;
    c.clicks.forEach(tc => { if (t >= tc && t < tc + 0.5) { rp = P(t, tc, 0.5); tc0 = tc; } });
    if (rp >= 0) { r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.opacity = (1 - rp) * 0.85; tf(r, `scale(${lerp(0.2, 2.4, eOut(rp))})`); }
    else r.style.opacity = 0;
  }
}
function LIVE(t) {
  // --- Angga Jaya: pick size M, qty +1, add to cart (in sync with the phone tap)
  const c3 = CUR[3]; placeCursor(c3, t, ...pathAt(c3.keys, t));
  const sel = clamp(P(t, 8.93, 0.07));
  $('agSoff').style.opacity = sel; $('agMon').style.opacity = sel;
  tf($('agMon'), `scale(${1 + damp(t, 8.93, 0.12, 30, 12)})`);
  $('agMhov').style.opacity = hoverA(t, 8.78, 8.95);
  $('agPlushov').style.opacity = hoverA(t, 9.24, 9.48);
  const q = $('agQty'); q.style.opacity = t >= 9.4 ? 1 : 0; tf(q, `translateY(${lerp(10, 0, eOut(P(t, 9.4, 0.22)))}px)`);
  $('agBtnhov').style.opacity = hoverA(t, 9.68, 10.05) * (1 + 0.6 * clamp(P(t, 9.82, 0.04) - P(t, 9.9, 0.15)));
  const bd = $('agBadge'); bd.textContent = t < 9.98 ? '2' : '3'; tf(bd, `scale(${1 + damp(t, 9.98, 0.55, 26, 9)})`);
  // --- izaditya: hover + click "See projects", page scrolls into a case study (phone scrolls with it)
  const c4 = CUR[4]; placeCursor(c4, t, ...pathAt(c4.keys, t));
  $('izBtnhov').style.opacity = hoverA(t, 12.42, 12.86);
  tf($('stack4'), `translateY(${-735 * eIO(P(t, 12.74, 0.66))}px)`);
  // --- SIMALA: click "Jelajahi" → diagnosis + thesis progress respond
  const c5 = CUR[5]; placeCursor(c5, t, ...pathAt(c5.keys, t));
  $('smBtnhov').style.opacity = hoverA(t, 15.8, 16.25);
}
// local point of element `el` (its centre + offset) inside the S6 screen, undoing the window scale
function localIn(scr, el, ox, oy) {
  const a = scr.getBoundingClientRect(), b = el.getBoundingClientRect(), k = a.width / scr.offsetWidth || 1;
  return [(b.left + b.width / 2 - a.left) / k + ox, (b.top + b.height / 2 - a.top) / k + oy];
}
function LIVE6(t) {
  const c6 = CUR[6], scr = $('w6scr');
  const nav = localIn(scr, $('nlinks').children[1], -4, 4), btn = localIn(scr, $('nb1'), 14, 8);
  const u = eIO(P(t, 19.36, 0.6)), arc = Math.sin(Math.PI * u) * 0.12;
  const dx = btn[0] - nav[0], dy = btn[1] - nav[1];
  placeCursor(c6, t, nav[0] + dx * u - dy * arc, nav[1] + dy * u + dx * arc);
  $('nb1').style.filter = `brightness(${lerp(1, 0.84, hoverA(t, 19.9, 30))})`;
}

// ---- guide arrow flights (stage px). 'cN' = land on / take off from cursor N
const cub = u => 1 - Math.pow(1 - u, 3), cubIn = u => u * u * u;
const GS = [
  { t0: 5.84, t1: 6.12, A: [960, 1270], B: [960, 760], C: [960, 980], ease: cub, s: [.64, .64] },
  { t0: 6.12, t1: 6.18, A: [960, 760], B: [960, 786], C: [960, 773], ease: eIO, s: [.64, .64] },
  { t0: 6.18, t1: 6.46, A: [960, 786], B: [960, -460], C: [960, 150], ease: cubIn, s: [.64, .74] },
  { t0: 7.46, t1: 8.55, A: [1330, 1310], B: 'c3', C: [1230, 760], ease: cub, s: [.8, 0] },
  { t0: 10.72, t1: 11.1, A: 'c3', B: [1480, -420], C: [1560, 300], ease: cubIn, s: [0, .76] },
  { t0: 11.3, t1: 12.05, A: [1330, 1310], B: 'c4', C: [1240, 700], ease: cub, s: [.8, 0] },
  { t0: 14.52, t1: 14.9, A: 'c4', B: [1480, -420], C: [1560, 260], ease: cubIn, s: [0, .76] },
  { t0: 14.98, t1: 15.55, A: [1330, 1310], B: 'c5', C: [1260, 760], ease: cub, s: [.8, 0] },
  { t0: 18.02, t1: 18.4, A: 'c5', B: [1480, -420], C: [1560, 260], ease: cubIn, s: [0, .76] },
  { t0: 18.58, t1: 19.2, A: [1240, 1310], B: 'c6', C: [1080, 700], ease: cub, s: [.8, 0] }
];
if (V) {   // same flights, re-plotted for the tall frame
  const VG = [[[540, 2090], [540, 1140], [540, 1500]], [[540, 1140], [540, 1162], [540, 1151]], [[540, 1162], [540, -330], [540, 500]],
              [[720, 2090], 'c3', [640, 1500]], ['c3', [780, -330], [840, 520]], [[720, 2090], 'c4', [640, 1500]], ['c4', [780, -330], [840, 520]],
              [[720, 2090], 'c5', [640, 1500]], ['c5', [780, -330], [840, 520]], [[640, 2090], 'c6', [560, 1500]]];
  GS.forEach((g, i) => { g.A = VG[i][0]; g.B = VG[i][1]; g.C = VG[i][2]; });
}
function anchorOf(key) { const r = CUR[+key.slice(1)].el.getBoundingClientRect(); return [r.left, r.top]; }
function curScale(key) { const c = CUR[+key.slice(1)], e = $(c.pg); return CUR_PX * e.getBoundingClientRect().width / (e.offsetWidth * c.pgS); }
const qb = (a, c, b, e) => { const v = 1 - e; return [v * v * a[0] + 2 * v * e * c[0] + e * e * b[0], v * v * a[1] + 2 * v * e * c[1] + e * e * b[1]]; };
function GUIDE(t) {
  const G = $('gG'), seg = GS.find(g => t >= g.t0 && t < g.t1);
  if (!seg) { G.style.visibility = 'hidden'; return; }
  G.style.visibility = 'visible';
  const into = typeof seg.B === 'string', outof = typeof seg.A === 'string';
  const A = outof ? anchorOf(seg.A) : seg.A, B = into ? anchorOf(seg.B) : seg.B, C = seg.C;
  const u = (t - seg.t0) / (seg.t1 - seg.t0), e = seg.ease(u);
  const p = qb(A, C, B, e);
  // tangent (independent of speed) and speed (px/s) for trail + blur
  const dx = 2 * (1 - e) * (C[0] - A[0]) + 2 * e * (B[0] - C[0]), dy = 2 * (1 - e) * (C[1] - A[1]) + 2 * e * (B[1] - C[1]);
  const de = (seg.ease(Math.min(1, u + 0.01)) - seg.ease(Math.max(0, u - 0.01))) / (Math.min(1, u + 0.01) - Math.max(0, u - 0.01));
  const speed = Math.hypot(dx, dy) * de / (seg.t1 - seg.t0);
  const tan = Math.atan2(dy, dx) * 180 / Math.PI;
  let rot = tan, s0 = seg.s[0] || curScale(seg.A), s1 = seg.s[1] || curScale(seg.B), land = 0;
  if (into) { const k = eIO(clamp((u - 0.55) / 0.45)); rot = lerp(tan, CUR_ROT, k); land = k; }
  if (outof) { const k = eIO(clamp(u / 0.35)); rot = lerp(CUR_ROT, tan, k); land = 1 - k; }
  const sc = lerp(s0, s1, eIO(u));
  G.setAttribute('transform', `translate(${p[0].toFixed(2)},${p[1].toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sc.toFixed(4)})`);
  const L = Math.min(1100, speed * 0.055) * (1 - land) / sc;
  $('gTrail').setAttribute('points', `-104,-30 ${(-104 - L).toFixed(1)},0 -104,30`);
  $('gTrail').style.opacity = L > 4 ? 1 : 0;
  $('gblurS').setAttribute('stdDeviation', `${(FB * Math.min(70, speed * 0.006) / sc).toFixed(2)} 0`);
  // as it lands it takes on the cursor's look (dark outline, glow fades)
  const ga = $('gArrow'); ga.setAttribute('stroke', '#0B0B10'); ga.setAttribute('stroke-width', (2.4 / sc).toFixed(2));
  ga.setAttribute('stroke-opacity', land.toFixed(3));
  $('guide').style.filter = `drop-shadow(0 0 22px rgba(96,165,250,${(0.75 * (1 - land)).toFixed(3)})) drop-shadow(0 0 3px rgba(96,165,250,${(0.9 * (1 - land)).toFixed(3)}))`;
}

// ======================= master =======================
function seek(t) {
  const f = Math.round(t * 60);
  // camera: impacts + slow push
  const shx = damp(t, 1.875, 7, 62, 10) + damp(t, 4.7, 6, 58, 12) + damp(t, 22.48, 4, 50, 10);
  const shy = damp(t, 1.875, 4, 47, 10) + damp(t, 4.7, 4, 51, 12) + damp(t, 22.48, 3, 44, 10);
  const push = t < 3.75 ? lerp(1, 1.035, t / 3.75) : t < 6.56 ? lerp(1, 1.02, (t - 3.75) / 2.81) : t >= 26.3 ? lerp(1.0, 1.025, (t - 26.3) / 3.7) : 1;
  tf(cam, `translate(${shx}px,${shy}px) scale(${push})`);

  const a = kf(G1, t), b = kf(G2, t);
  g1.style.left = (a[1] + VDX) + 'px'; g1.style.top = (a[2] + VDY) + 'px'; tf(g1, `scale(${a[3]})`); g1.style.opacity = a[4];
  g2.style.left = (b[1] + VDX) + 'px'; g2.style.top = (b[2] + VDY) + 'px'; tf(g2, `scale(${b[3]})`); g2.style.opacity = b[4];
  if (t < 3.8) { // glow rides with the lockup, then the arrow
    const lk = eOut(P(t, 2.08, 0.85));
    g1.style.left = (960 + VDX + (M.lockDx * lk * .4 + Math.max(0, arrowX(t)) * .5) * (V ? 0.92 : 1)) + 'px';
  }
  grain.style.backgroundImage = grainImgs[f % 4];
  grain.style.backgroundPosition = `${(f * 97) % 256}px ${(f * 61) % 256}px`;

  show(L.s1, t < 3.78); if (t < 3.78) S1(t);
  show(L.s2, t >= 3.7 && t < 6.62); if (t >= 3.7 && t < 6.62) S2(t);
  show(L.track, t >= 7.38 && t < 19.0); if (t >= 7.38 && t < 19.0) { TRACK(t); LIVE(t); }
  show(L.chap, t >= 6.5 && t < 18.85); if (t >= 6.5 && t < 18.85) CHAP(t);
  show(L.s6, t >= 18.38 && t < 22.52); if (t >= 18.38 && t < 22.52) { S6(t); LIVE6(t); }
  show(L.s7, t >= 22.49 && t < 26.36); if (t >= 22.49 && t < 26.36) S7(t);
  show(L.wipe, t >= 25.9 && t < 26.36); if (t >= 25.9 && t < 26.36) WIPE(t);
  show(L.s8, t >= 26.3); if (t >= 26.3) S8(t);
  GUIDE(t);
}

window.__ready = (async () => {
  await document.fonts.load('700 100px IT'); await document.fonts.load('italic 800 50px IT'); await document.fonts.ready;
  await Promise.all([...document.images].map(im => im.decode().catch(() => {})));
  // make all layers measurable
  Object.values(L).forEach(l => show(l, true));
  document.querySelectorAll('.wd').forEach(w => show(w, true));
  if (V) {
    const fit = (id, s, oy) => { const e = $(id); e.style.transformOrigin = `960px ${oy}px`; e.style.transform = `translate(${VDX}px,${VDY}px) scale(${s})`; };
    fit('s1', 0.92, 540); fit('s2', 0.76, 528);
    $('guide').setAttribute('viewBox', `0 0 ${SW} ${SH}`);
    const wp = $('wipe'); wp.setAttribute('viewBox', `0 0 ${SW} ${SH}`); wp.setAttribute('width', SW); wp.setAttribute('height', SH);
    $('kv1').parentNode.style.top = '870px'; $('kv2').parentNode.style.top = '870px';
    $('cta8').parentNode.style.top = '800px'; $('sub8').parentNode.style.top = '1300px';
  }
  measure();
  seek(0);
  return true;
})();
window.seek = seek;

// ---- review player (only when opened in a browser, never during capture) ----
// fits the frame to the window, plays with the soundtrack, scrubs and steps frame by frame
if (!/capture/.test(location.hash)) {
  window.__ready.then(() => {
    const de = document.documentElement, bd = document.body, st = $('stage');
    [de, bd].forEach(e => { e.style.width = '100%'; e.style.height = '100%'; });
    bd.style.background = '#0b0b0e';
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:52px;display:flex;align-items:center;gap:14px;padding:0 16px;background:#141418;border-top:1px solid #26262e;font:13px system-ui,sans-serif;color:#c9c9d1;z-index:99';
    bar.innerHTML = '<button id="rvP" style="width:46px;height:32px;border:0;border-radius:8px;background:#2563EB;color:#fff;font-size:14px;cursor:pointer">&#9654;</button>' +
      '<input id="rvS" type="range" min="0" max="1799" step="1" value="0" style="flex:1;accent-color:#3B82F6">' +
      '<span id="rvT" style="font-variant-numeric:tabular-nums;min-width:150px"></span>' +
      '<span style="opacity:.55">Spasi play/pause · ←/→ 1 frame · Shift 1 detik</span>';
    bd.appendChild(bar);
    const Pb = $('rvP'), Sl = $('rvS'), Tt = $('rvT');
    const au = new Audio('../score.wav'); au.preload = 'auto';
    const fit = () => { const k = Math.min(innerWidth / SW, (innerHeight - 52) / SH); st.style.transformOrigin = '0 0'; st.style.transform = `translate(${(innerWidth - SW * k) / 2}px,0) scale(${k})`; };
    fit(); addEventListener('resize', fit);
    let playing = false, cur = 0, last = performance.now();
    const go = f => { cur = ((f % 1800) + 1800) % 1800; seek(cur / 60); Sl.value = Math.floor(cur); Tt.textContent = `${(cur / 60).toFixed(2)} s · frame ${Math.floor(cur)}`; };
    const setPlay = on => { playing = on; Pb.innerHTML = on ? '&#10074;&#10074;' : '&#9654;';
      if (on) { au.currentTime = cur / 60; au.play().catch(() => {}); } else au.pause(); };
    const loop = now => {
      if (playing) { const a = !au.paused && au.readyState > 2 ? au.currentTime * 60 : cur + (now - last) * 0.06;
        if (a >= 1799.5) { go(0); au.currentTime = 0; au.play().catch(() => {}); } else go(a); }
      last = now; requestAnimationFrame(loop);
    };
    go(0); requestAnimationFrame(loop);
    Pb.onclick = () => setPlay(!playing);
    Sl.oninput = () => { setPlay(false); go(+Sl.value); };
    addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setPlay(false); go(Math.round(cur) + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 60 : 1)); }
      else if (e.key === 'Home') go(0);
    });
  });
}
})();
