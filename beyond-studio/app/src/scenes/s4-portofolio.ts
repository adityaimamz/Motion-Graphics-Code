// S4 · Portofolio · 13.125–18.75. Opens in close on "See projects" in the Aditya Imam Zuhdi site (the
// phone in front is out of focus). 14.531: click, the page glides into the Celestial Scrolls case study,
// the phone scrolls with it; the camera pulls out and orbits slowly; 18.28 take-off, crane to skripsi.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Phone, Panel, drawCursor, drawRipple, drawIcon } from '../stage/devices';
import { CUE, CH } from '../cues';
import { pick } from '../fmt';
import { eOut, eIO, P, within, pathAt, pressAt, drift } from '../stage/motion';
import { img, rr, setType } from '../stage/type';
import { lerp } from '../engine/util';
import { HOME, SET_Y, FOV, setOrigin, craneShot, craneArrow, landArrow, takeoffArrow, cursorPx, v3, LEAD } from './layout';

const [T0, T1] = CH.portofolio;
const LAND = CUE.land4, TK = CUE.takeoff4;
const CLICK = (CUE.click4 as number[])[0]!;
const O = setOrigin(SET_Y.portofolio);
const PAGE_S = 960 / 1240;                     // page px → window canvas px
const win = new Panel(9.6, 6.11, 960, 611, 0.16, 1.5, 0.1);
const phone = new Phone(390, 842);
let floor: THREE.ShaderMaterial;
let CUR_S = 0.35;
// window placed so the "See projects" button sits on HOME.portofolio's look point
const WIN_POS = O.clone().add(v3(pick(-0.35, 0.8), 4.25, pick(0.03, -0.42)));
const WIN_YAW = pick(0.12, 0.1);

const KEYS: [number, number, number][] = [[LAND, 690, 400], [CLICK - 0.14, 552, 472], [CLICK + 0.12, 552, 472], [CLICK + 1.0, 700, 390], [TK - 0.5, 770, 340]];
const WIDE: Shot = { look: O.clone().add(v3(pick(0.8, -0.6), pick(3.3, 3.2), 0.6)), dist: pick(33, 25), yaw: 6, pitch: pick(8, 7), fov: FOV, ap: 8 };

function drawWindow(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = '#131318'; c.fillRect(0, 0, 960, 611);
  c.fillStyle = '#1A1A21'; c.fillRect(0, 0, 960, 42);
  c.fillStyle = '#26262E'; c.fillRect(0, 41, 960, 1);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.beginPath(); c.arc(24 + i * 20, 21, 6, 0, Math.PI * 2); c.fillStyle = col; c.fill(); });
  rr(c, 317, 9, 326, 24, 7); c.fillStyle = 'rgba(255,255,255,0.06)'; c.fill();
  drawIcon(c, img('icons/lock.svg'), 480, 21, 14, 'rgba(245,245,245,0.4)');
  c.save();
  c.beginPath(); c.rect(0, 42, 960, 569); c.clip();
  c.translate(0, 42);
  c.scale(PAGE_S, PAGE_S);
  const zoom = lerp(1, 1.05, eIO(P(t, T0, T1 - T0)));
  c.translate(620, 250); c.scale(zoom, zoom); c.translate(-620, -250);
  const sc = -735 * eIO(P(t, CLICK + 0.08, 0.66));
  c.drawImage(img('assets/izaditya.jpg'), 0, sc, 1240, 735);
  c.drawImage(img('assets/celestialscrolls.jpg'), 0, sc + 735, 1240, 776);
  const hv = within(t, CLICK - 0.3, CLICK + 0.12, 0.1);
  if (hv > 0) {
    c.save(); c.globalAlpha = hv;
    c.shadowColor = 'rgba(167,139,250,0.55)'; c.shadowBlur = 30;
    rr(c, 469, 449 + sc, 148, 41, 21); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill();
    c.shadowColor = 'transparent'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    c.restore();
  }
  c.restore();
  if (t >= LAND && t < TK) {
    const [x, y] = pathAt(KEYS, t), [dx, dy] = drift(t);
    const cx = x * PAGE_S + dx, cy = 42 + y * PAGE_S + dy;
    drawRipple(c, cx, cy, P(t, CLICK, 0.5), 'rgba(255,255,255,0.6)', 16);
    drawCursor(c, cx, cy, CUR_S, pressAt(t, [CLICK]));
  }
}

function drawPhone(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = '#0a0a0e'; c.fillRect(0, 0, 390, 842);
  const txt = (s: string, x: number, y: number, px: number, weight: number, color: string, align: CanvasTextAlign = 'left', italic = false, track = 0) => { setType(c, px, weight, track, italic); c.fillStyle = color; c.textAlign = align; c.fillText(s, x, y); c.textAlign = 'left'; };
  c.save();
  c.translate(0, -452 * eIO(P(t, CLICK + 0.1, 1.55)));
  // hero: galaxy + fade
  const g = img('assets/iz_galaxy2.jpg');
  const s = Math.max(390 / g.width, 560 / g.height);
  c.save(); c.beginPath(); c.rect(0, 0, 390, 560); c.clip(); c.drawImage(g, (390 - g.width * s) / 2, (560 - g.height * s) / 2, g.width * s, g.height * s); c.restore();
  const fd = c.createLinearGradient(0, 300, 0, 562); fd.addColorStop(0, 'rgba(10,10,14,0)'); fd.addColorStop(1, '#0a0a0e');
  c.fillStyle = fd; c.fillRect(0, 300, 390, 262);
  rr(c, 18, 62, 354, 52, 26); c.fillStyle = 'rgba(20,20,26,0.78)'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.1)'; c.stroke();
  c.beginPath(); c.arc(45, 88, 19, 0, Math.PI * 2); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
  txt('AIZ', 45, 93, 13, 800, '#f5f5f5', 'center', true);
  drawIcon(c, img('icons/menu.svg'), 343, 88, 22, '#f5f5f5');
  txt('Aditya', 195, 221, 52, 800, '#f5f5f5', 'center', true, -0.03);
  txt('Imam Zuhdi', 195, 272, 52, 800, '#f5f5f5', 'center', true, -0.03);
  setType(c, 16, 400, 0);
  const a = 'A ', b = 'Full-Stack', d = ' based in Indonesia.';
  const wa = c.measureText(a).width, wd = c.measureText(d).width;
  setType(c, 16, 700, 0, true); const wb = c.measureText(b).width;
  const pw = wa + wb + wd + 36, px0 = 195 - pw / 2;
  rr(c, px0, 306, pw, 36, 18); c.fillStyle = 'rgba(30,30,40,0.6)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1; c.stroke();
  txt(a, px0 + 18, 330, 16, 400, '#c9c9d1'); txt(b, px0 + 18 + wa, 330, 16, 700, '#fff', 'left', true); txt(d, px0 + 18 + wa + wb, 330, 16, 400, '#c9c9d1');
  ['Experienced in building modern web', 'applications, scalable backends, and', 'AI integrations.'].forEach((l, i) => txt(l, 195, 378 + i * 22.5, 15, 400, '#b7b7c2', 'center'));
  setType(c, 14, 700, 0.02);
  const b1 = c.measureText('SEE PROJECTS').width + 48, b2 = c.measureText('REACH OUT').width + 48;
  const bx = 195 - (b1 + b2 + 12) / 2;
  rr(c, bx, 446, b1, 48, 24); c.fillStyle = '#f1f0f4'; c.fill(); txt('SEE PROJECTS', bx + b1 / 2, 475, 14, 700, '#111', 'center', false, 0.02);
  rr(c, bx + b1 + 12, 446, b2, 48, 24); c.fillStyle = '#15151b'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.stroke(); txt('REACH OUT', bx + b1 + 12 + b2 / 2, 475, 14, 700, '#f5f5f5', 'center', false, 0.02);
  txt('Selected work', 22, 586, 26, 700, '#f5f5f5', 'left', false, -0.02);
  ([['thumb_cs', 'Celestial Scrolls', 'Web platform', 606], ['thumb_ag', 'Angga Jaya', 'E-commerce', 858], ['thumb_sp', 'SIMALA', 'Expert system', 1110]] as const).forEach(([im, n, k, top]) => {
    c.save(); rr(c, 22, top, 346, 236, 18); c.fillStyle = '#15151b'; c.fill(); c.clip();
    const I = img(`assets/${im}.jpg`), s2 = 346 / I.width;
    c.drawImage(I, 22, top, 346, Math.max(170, I.height * s2));
    c.fillStyle = '#15151b'; c.fillRect(22, top + 170, 346, 66);
    c.restore();
    rr(c, 22, top, 346, 236, 18); c.strokeStyle = 'rgba(255,255,255,0.08)'; c.stroke();
    txt(n, 38, top + 208, 16, 650, '#f5f5f5'); txt(k, 352, top + 208, 14, 500, '#8b8b96', 'right');
  });
  c.restore();
  txt('9:41', 42, 36, 17, 600, '#fff');
  drawIcon(c, img('icons/signal.svg'), 302, 30, 17, '#fff'); drawIcon(c, img('icons/wifi.svg'), 324, 30, 17, '#fff');
  rr(c, 336, 24, 26, 12, 4); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke(); rr(c, 338, 26, 17, 8, 1.5); c.fillStyle = '#fff'; c.fill();
  rr(c, 149, 10, 92, 27, 14); c.fillStyle = '#000'; c.fill();
}

// ---------------------------------------------------------------- choreography
function shotAt(t: number): Shot {
  const close = HOME.portofolio;
  const k = eIO(P(t, 15.0, 1.9));
  const s: Shot = { look: close.look.clone().lerp(WIDE.look, k), dist: lerp(close.dist - 0.5 * eOut(P(t, T0, 1.9)), WIDE.dist, k), yaw: close.yaw, pitch: lerp(close.pitch, WIDE.pitch, k), fov: FOV };
  s.yaw = lerp(close.yaw, 6, k) - 15 * eIO(P(t, 15.9, 1.9));   // slow orbit after the reveal
  s.focus = s.dist;
  s.ap = lerp(close.ap ?? 40, 8, k);
  return s;
}
function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  return t < TK ? shotAt(t) : craneShot(t, TK, T1, shotAt(TK), HOME.skripsi);
}
function arrow(t: number): ArrowPose | null {
  if (t < T0 || t >= T1) return null;
  if (t < LAND) return landArrow(t, T0, LAND, craneArrow(T0, T0 - 1, T0, HOME.portofolio, HOME.portofolio).pos, win.screen, 690 * PAGE_S, 42 + 400 * PAGE_S, CUR_S);
  if (t < TK) return null;
  const [x, y] = pathAt(KEYS, TK);
  return takeoffArrow(t, TK, T1, win.screen, x * PAGE_S, 42 + y * PAGE_S, CUR_S, HOME.skripsi.look.clone().add(v3(0, LEAD, 1.2)));
}

function update(t: number, w: World, _f: FrameOut) {
  const on = t >= T0 - 1.2 && t < T1 + 0.6;
  win.group.visible = phone.group.visible = on;
  floor.uniforms.light!.value = eOut(P(t, T0 - 0.1, 0.6)) * (1 - P(t, T1 + 0.2, 0.4));
  if (t >= T0 && t < T1) { const l = eOut(P(t, T0, 0.5)); w.studio.key.intensity = 2.2 * l; w.studio.rim.intensity = 3 * l; }
  if (!on) return;
  win.group.position.copy(WIN_POS);
  win.group.rotation.y = WIN_YAW;
  phone.group.position.copy(O).add(v3(pick(2.9, 6.4), 0, pick(3.8, 2.4)));
  phone.group.rotation.y = pick(-0.32, -0.3);
  win.screen.draw((c) => drawWindow(c, t));
  phone.screen.draw((c) => drawPhone(c, t));
  win.screen.sheen = lerp(-0.4, 1.4, P(t, 15.2, 1.0));
  phone.screen.sheen = lerp(-0.4, 1.4, P(t, 15.4, 1.0));
}

const s4: Chapter = {
  init(w) {
    CUR_S = cursorPx(win.screen, 960);
    w.scene.add(win.group, phone.group);
    floor = w.studio.addFloor(O, pick([7, 6], [11, 6]));
    for (const g of [win.group, phone.group]) w.studio.addMirror(g, O.y);
  },
  update,
  shot,
  arrow,
};
export default s4;
