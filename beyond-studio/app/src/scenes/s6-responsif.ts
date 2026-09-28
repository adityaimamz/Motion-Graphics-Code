// S6 · Responsif · 24.375–30. The Nexora demo site on one screen that physically changes shape:
// desktop → tablet (25.31) → phone (26.25); the bezel rounds, the layout reflows, the camera pushes in
// with it. The cursor keeps hold of "Mulai sekarang" through the reflow; 29.531 click → a blue burst
// from the button floods the frame exactly on 30.0 (the proof wall).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Screen, drawCursor, drawIcon, wrap } from '../stage/devices';
import { CUE, CH } from '../cues';
import { V, pick, W as FW, H as FH } from '../fmt';
import { TX } from '../text';
import { eOut, eIO, P, pressAt, drift, within } from '../stage/motion';
import { img, rr, setType, maskText, measure } from '../stage/type';
import { clamp, lerp } from '../engine/util';
import { HOME, SET_Y, setOrigin, craneArrow, landArrow, cursorPx, v3 } from './layout';

const [T0, T1] = CH.responsif;
const LAND = CUE.land6, CLICK = CUE.click6, FLOOD = CUE.flood;
const [M1, M2] = CUE.resize6 as [number, number, number];
const O = setOrigin(SET_Y.responsif);
const CW = 1440, CHH = 900;           // canvas holds the largest state; the screen shows its top-left part
const U = pick(0.0074, 0.0092);       // world units per site px at the desktop state
const screen = new Screen(1, 1, CW, CHH, 0.16, 1.25);
const slab = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, metalness: 0.8, roughness: 0.35 }));
const group = new THREE.Group();
let floor: THREE.ShaderMaterial;
let CUR_S = 0.27;

/** Layout morph: 0 desktop, 1 tablet, 2 phone (per-element delays allowed). */
const morph = (t: number, d = 0) => eIO(P(t, M1 + d, 0.9)) + eIO(P(t, M2 + d, 0.9));
const V3 = (a: number, b: number, c: number, m: number) => (m <= 1 ? lerp(a, b, m) : lerp(b, c, m - 1));
const dims = (m: number) => {
  const cw = V3(1440, 800, 390, m), chh = V3(766, 856, 800, m);
  const bar = V3(42, 42, 0, m), bz = V3(0, 0, 12, m), rad = V3(16, 22, 56, m);
  return { cw, chh, bar, bz, rad, ow: cw + 2 * bz, oh: chh + bar + 2 * bz };
};
const FEAT = [
  [[56, 528, 426.7, 206], [40, 780, 350, 190], [22, 712, 346, 162]],
  [[506.7, 528, 426.7, 206], [410, 780, 350, 190], [22, 888, 346, 162]],
  [[957.3, 528, 426.7, 206], [40, 990, 350, 190], [22, 1064, 346, 162]],
];
const ICONS = ['shield-check', 'trending-up', 'users'];

/** Draw the site; returns the button centre (canvas px) for the cursor and the burst. */
function drawSite(c: CanvasRenderingContext2D, t: number) {
  const m = morph(t);
  const d = dims(m);
  const x0 = d.bz, y0 = d.bar + d.bz;
  // device: window chrome at desktop/tablet, bezel at phone
  c.fillStyle = '#0a0a0c'; c.fillRect(0, 0, d.ow, d.oh);
  if (d.bar > 1) {
    c.globalAlpha = clamp(d.bar / 30);
    c.fillStyle = '#1A1A21'; c.fillRect(0, 0, d.ow, d.bar);
    c.fillStyle = '#26262E'; c.fillRect(0, d.bar - 1, d.ow, 1);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.beginPath(); c.arc(24 + i * 20, d.bar / 2, 6, 0, Math.PI * 2); c.fillStyle = col; c.fill(); });
    rr(c, d.ow * 0.33, 9, d.ow * 0.34, 24, 7); c.fillStyle = 'rgba(255,255,255,0.06)'; c.fill();
    drawIcon(c, img('icons/lock.svg'), d.ow / 2, 21, 14, 'rgba(245,245,245,0.4)');
    c.globalAlpha = 1;
  }
  c.save();
  rr(c, x0, y0, d.cw, d.chh, V3(0, 0, 44, m)); c.clip();
  c.translate(x0, y0);
  c.fillStyle = '#fff'; c.fillRect(0, 0, d.cw, d.chh);
  const txt = (s: string, x: number, y: number, px: number, weight: number, color: string, track = 0) => { setType(c, px, weight, track); c.fillStyle = color; c.fillText(s, x, y); };
  const px = V3(56, 40, 22, m);
  // nav
  const ny = V3(22, 22, 58, m);
  rr(c, px, ny + 7, 30, 30, 9); c.fillStyle = '#0A0A0A'; c.fill();
  c.beginPath(); c.arc(px + 15, ny + 22, 6.25, 0, Math.PI * 2); c.lineWidth = 3.5; c.strokeStyle = '#fff'; c.stroke();
  c.beginPath(); c.arc(px + 20.5, ny + 16.5, 5.5, 0, Math.PI * 2); c.fillStyle = '#3B82F6'; c.fill();
  txt('Nexora', px + 40, ny + 30, 22, 700, '#0A0A0A', -0.03);
  const lo = clamp((d.cw - 900) / 140);
  let navLink: [number, number] = [d.cw - px - 200, ny + 22];
  if (lo > 0.01) {
    c.globalAlpha = lo;
    setType(c, 15, 600, 0);
    const ctaW = c.measureText(TX.nexContact).width + 36;
    let x = d.cw - px - ctaW;
    rr(c, x, ny + 2, ctaW, 40, 10); c.fillStyle = '#0A0A0A'; c.fill();
    txt(TX.nexContact, x + 18, ny + 27, 15, 600, '#fff');
    x -= 30;
    const links = [...TX.nexLinks].reverse();
    links.forEach((l, i) => {
      setType(c, 16, 500, 0);
      const lw = c.measureText(l).width;
      x -= lw;
      txt(l, x, ny + 28, 16, 500, '#4B5563');
      if (i === 1) navLink = [x + lw / 2, ny + 22];
      x -= 34;
    });
    c.globalAlpha = 1;
  }
  if (lo < 0.99) { c.globalAlpha = 1 - lo; drawIcon(c, img('icons/menu.svg'), d.cw - px - 13, ny + 22, 26, '#0A0A0A'); c.globalAlpha = 1; }
  // hero
  const hx = px, hy = V3(116, 108, 126, m), hw = V3(620, 720, 346, m);
  const h1 = V3(86, 76, 48, m);
  TX.nexH1.forEach((l, i) => txt(l, hx, hy + h1 * 0.8 + i * h1 * 0.98, h1, 750, '#0A0A0A', -0.05));
  const pp = V3(20, 19, 16, m);
  setType(c, pp, 450, 0);
  const lines = wrap(c, TX.nexP, Math.min(hw, V3(480, 600, 346, m)));
  const py0 = hy + h1 * 1.96 + 20;
  lines.forEach((l, i) => txt(l, hx, py0 + pp * 1.1 + i * pp * 1.45, pp, 450, '#6B7280'));
  const by = py0 + lines.length * pp * 1.45 + 28;
  setType(c, 16, 600, 0);
  const b1w = c.measureText(TX.nexB1).width + 48, b2w = c.measureText(TX.nexB2).width + 44;
  const hov = within(t, 25.0, CLICK + 0.15, 0.3);
  const press = clamp(P(t, CLICK - 0.06, 0.09) - P(t, CLICK + 0.04, 0.14));
  c.save(); c.translate(hx + b1w / 2, by + 25); c.scale(1 - 0.06 * press, 1 - 0.06 * press); c.translate(-(hx + b1w / 2), -(by + 25));
  rr(c, hx, by, b1w, 50, 12); c.fillStyle = hov > 0 ? `rgb(${lerp(37, 31, hov)},${lerp(99, 83, hov)},${lerp(235, 197, hov)})` : '#2563EB'; c.fill();
  txt(TX.nexB1, hx + 24, by + 31, 16, 600, '#fff');
  c.restore();
  const b2x = hx + b1w + 12;
  const wrapB = b2x + b2w > d.cw - px;
  const b2X = wrapB ? hx : b2x, b2Y = wrapB ? by + 62 : by;
  rr(c, b2X + 0.75, b2Y + 0.75, b2w - 1.5, 48.5, 12); c.lineWidth = 1.5; c.strokeStyle = '#E5E5E5'; c.stroke();
  txt(TX.nexB2, b2X + 22, b2Y + 31, 16, 600, '#0A0A0A');
  // visual
  const m2 = morph(t, 0.04);
  const vx = V3(724, 40, 22, m2), vy = V3(104, 452, 470, m2), vw = V3(660, 720, 346, m2), vh = V3(392, 300, 214, m2);
  c.save(); rr(c, vx, vy, vw, vh, 18); c.fillStyle = '#F5F5F7'; c.fill(); c.clip();
  const im = img('assets/e-commerce.jpg'), s = Math.max(vw / im.width, vh / im.height);
  c.drawImage(im, vx, vy - (im.height * s - vh) * 0.2, im.width * s, im.height * s);
  c.restore();
  rr(c, vx + 0.5, vy + 0.5, vw - 1, vh - 1, 18); c.lineWidth = 1; c.strokeStyle = '#E5E5E5'; c.stroke();
  // features
  FEAT.forEach((f, i) => {
    const mi = morph(t, (i + 1) * 0.07);
    const [fx, fy, fw, fh] = [0, 1, 2, 3].map((k) => V3(f[0]![k]!, f[1]![k]!, f[2]![k]!, mi)) as [number, number, number, number];
    c.save(); rr(c, fx, fy, fw, fh, 16); c.fillStyle = '#F5F5F7'; c.fill(); c.clip();
    drawIcon(c, img(`icons/${ICONS[i]}.svg`), fx + 37, fy + 37, 26, '#2563EB');
    txt(TX.nexF[i]![0]!, fx + 24, fy + 84, 19, 650, '#0A0A0A', -0.02);
    setType(c, 15, 400, 0);
    wrap(c, TX.nexF[i]![1]!, fw - 48).forEach((l, k) => txt(l, fx + 24, fy + 110 + k * 21.75, 15, 400, '#6B7280'));
    c.restore();
  });
  // phone status bar + island
  const ph = clamp((m - 1.5) / 0.4);
  if (ph > 0) {
    c.globalAlpha = ph;
    txt('9:41', 40, 36, 17, 600, '#0A0A0A');
    drawIcon(c, img('icons/signal.svg'), d.cw - 88, 30, 17, '#0A0A0A'); drawIcon(c, img('icons/wifi.svg'), d.cw - 66, 30, 17, '#0A0A0A');
    rr(c, d.cw - 54, 24, 26, 12, 4); c.lineWidth = 1.5; c.strokeStyle = '#0A0A0A'; c.stroke(); rr(c, d.cw - 52, 26, 17, 8, 1.5); c.fillStyle = '#0A0A0A'; c.fill();
    rr(c, d.cw / 2 - 54, 11, 108, 31, 16); c.fillStyle = '#000'; c.fill();
    c.globalAlpha = 1;
  }
  c.restore();
  const btn: [number, number] = [x0 + hx + b1w / 2 + 14, y0 + by + 25 + 8];
  const nav: [number, number] = [x0 + navLink[0] - 4, y0 + navLink[1] + 4];
  // cursor: from the nav link to the button, then it holds on to the button through the reflow
  if (t >= LAND && t < FLOOD) {
    const u = eIO(P(t, LAND + 0.25, 0.6)), arc = Math.sin(Math.PI * u) * 0.12;
    const dx = btn[0] - nav[0], dy = btn[1] - nav[1];
    const [jx, jy] = drift(t, 1.6);
    const cx = nav[0] + dx * u - dy * arc + jx, cy = nav[1] + dy * u + dx * arc + jy;
    drawCursor(c, cx, cy, CUR_S, pressAt(t, [CLICK]));
  }
  return { d, btn, nav };
}

// ---------------------------------------------------------------- choreography
function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  const h = HOME.responsif;
  const m = morph(t);
  const push = eOut(P(t, M2 + 0.9, CLICK - M2 - 0.9));
  const s: Shot = { ...h, look: h.look.clone().add(v3(pick(0, 1.6) * (m / 2), pick(0.1, 1.1) * (m / 2), 0)), dist: lerp(h.dist, pick(26, 21), m / 2) - push * pick(1.2, 1.0), yaw: Math.sin((m / 2) * Math.PI) * -9, pitch: lerp(h.pitch, 3, m / 2) };
  s.focus = s.dist; s.ap = 6;
  return s;
}
function arrow(t: number): ArrowPose | null {
  if (t < T0 || t >= LAND) return null;
  const { nav } = cache;
  return landArrow(t, T0, LAND, craneArrow(T0, T0 - 1, T0, HOME.responsif, HOME.responsif).pos, screen, nav[0], nav[1], CUR_S);
}
const cache: { btn: [number, number]; nav: [number, number] } = { btn: [0, 0], nav: [1100, 45] };

function update(t: number, w: World, f: FrameOut) {
  const on = t >= T0 - 1.2 && t < T1 + 0.05;
  group.visible = on;
  floor.uniforms.light!.value = eOut(P(t, T0 - 0.1, 0.6)) * (1 - P(t, T1, 0.1));
  if (t >= T0 && t < T1) { const l = eOut(P(t, T0, 0.5)); w.studio.key.intensity = 2.2 * l; w.studio.rim.intensity = 3 * l; }
  if (!on) return;
  let res = { d: dims(0), btn: cache.btn, nav: cache.nav };
  screen.draw((c) => { res = drawSite(c, t); });
  cache.btn = res.btn; cache.nav = res.nav;
  const d = res.d;
  const sw = d.ow * U, sh = d.oh * U;
  // the screen stands on the floor, centred; a thin slab behind it gives it a body
  group.position.copy(O).add(v3(0, 0.9 + sh / 2, 0));
  group.rotation.y = 0;
  screen.mesh.scale.set(sw, sh, 1);
  screen.w = sw; screen.h = sh;
  screen.mat.uniforms.size!.value.set(sw, sh);
  screen.mat.uniforms.radius!.value = d.rad * U;
  screen.mat.uniforms.uvScale!.value.set(d.ow / CW, d.oh / CHH);
  screen.cw = d.ow; screen.ch = d.oh;
  slab.scale.set(sw - 0.02, sh - 0.02, 0.1);
  slab.position.z = -0.055;
  screen.sheen = lerp(-0.4, 1.4, P(t, M2 + 0.95, 1.0));

  // caption + width readout
  const c = f.c;
  group.updateMatrixWorld(true);
  const bot = w.project(screen.point(d.ow / 2, d.oh));
  const capIn = P(t, 27.4, 0.7), capOut = P(t, CLICK, 0.25);
  const readA = clamp((1200 - d.cw) / 160) * (1 - P(t, CLICK, 0.15));
  if (V) {
    maskText(c, TX.cap6[0]!, FW / 2, 330, 82, capIn, capOut, { align: 'center', weight: 720, trackEm: -0.045 });
    maskText(c, TX.cap6[1]!, FW / 2, 420, 82, P(t, 27.49, 0.7), capOut, { align: 'center', weight: 720, trackEm: -0.045 });
    if (readA > 0) drawReadout(c, Math.round(d.cw), FW / 2, Math.min(FH - 400, bot.y + 150), readA, 'center');
  } else {
    maskText(c, TX.cap6[0]!, FW - 110, 470, 86, capIn, capOut, { align: 'right', weight: 720, trackEm: -0.045 });
    maskText(c, TX.cap6[1]!, FW - 110, 558, 86, P(t, 27.49, 0.7), capOut, { align: 'right', weight: 720, trackEm: -0.045 });
    if (readA > 0) drawReadout(c, Math.round(d.cw), FW - 110, 740, readA, 'right');
  }
  // burst: from the button, floods the frame by 30.0
  if (t >= CLICK + 0.01) {
    const b = w.project(screen.point(res.btn[0], res.btn[1]));
    const r = lerp(8, Math.hypot(FW, FH) * 1.15, Math.pow(P(t, CLICK + 0.01, FLOOD - CLICK - 0.01), 2.4));
    c.beginPath(); c.arc(b.x, b.y, r, 0, Math.PI * 2); c.fillStyle = '#2563EB'; c.fill();
  }
}

function drawReadout(c: CanvasRenderingContext2D, n: number, x: number, y: number, a: number, align: 'center' | 'right') {
  c.save(); c.globalAlpha = a;
  setType(c, 128, 200, -0.04);
  const s = String(n), w1 = measure(c, s);
  setType(c, 40, 400, 0);
  const w2 = measure(c, 'px') + 10;
  const x0 = align === 'center' ? x - (w1 + w2) / 2 : x - (w1 + w2);
  setType(c, 128, 200, -0.04); c.fillStyle = '#F5F5F5'; c.fillText(s, x0, y);
  setType(c, 40, 400, 0); c.fillStyle = 'rgba(245,245,245,0.55)'; c.fillText('px', x0 + w1 + 10, y);
  c.restore();
}

const s6: Chapter = {
  init(w) {
    CUR_S = cursorPx(screen, 1440) * 1.1;
    group.add(slab, screen.mesh);
    w.scene.add(group);
    floor = w.studio.addFloor(O, pick([7, 6], [11, 6]));
    w.studio.addMirror(group, O.y);
  },
  update,
  shot,
  arrow,
};
export default s6;
