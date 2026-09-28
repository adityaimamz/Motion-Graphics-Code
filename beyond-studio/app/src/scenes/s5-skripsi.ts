// S5 · Skripsi · 18.75–24.375. SIMALA (expert system) in a browser window, with the thesis-progress and
// diagnosis cards floating in front. 20.156: click "Jelajahi"; the camera pushes in on the cards while
// the window drops out of focus (rack focus); five chapters tick one per beat, the gauge fills with the
// logo arrow riding its end (ring + arrow = the mark). 23.906 take-off, crane to the responsive set.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Panel, drawCursor, drawRipple, drawIcon } from '../stage/devices';
import { CUE, CH } from '../cues';
import { pick } from '../fmt';
import { TX } from '../text';
import { eOut, eIO, eBack, P, within, pathAt, pressAt, drift } from '../stage/motion';
import { img, rr, setType } from '../stage/type';
import { lerp } from '../engine/util';
import { HOME, SET_Y, FOV, setOrigin, craneShot, craneArrow, landArrow, takeoffArrow, cursorPx, v3, LEAD } from './layout';

const [T0, T1] = CH.skripsi;
const LAND = CUE.land5, TK = CUE.takeoff5;
const CLICK = (CUE.click5 as number[])[0]!;
const TICKS = CUE.ticks5 as number[];
const G0 = CUE.gauge5, GV = 0.92;
const O = setOrigin(SET_Y.skripsi);
const PAGE_S = 880 / 1240;
const win = new Panel(8.8, 6.15, 880, 615, 0.16, 1.5, 0.1);
const thesis = new Panel(4.3, 3.62, 430, 362, 0.22, 2, 0.1);
const diag = new Panel(3.3, 1.76, 330, 176, 0.22, 2, 0.1);
let floor: THREE.ShaderMaterial;
let CUR_S = 0.27;

const KEYS: [number, number, number][] = [[LAND, 860, 470], [CLICK - 0.16, 628, 686], [CLICK + 0.14, 628, 686], [CLICK + 1.0, 790, 560], [TK - 0.6, 830, 540]];
const PUSH0 = CLICK + 0.1, PUSH1 = PUSH0 + 1.2;
const CARDS: Shot = { look: O.clone().add(v3(pick(0.4, 1.4), pick(3.1, 2.6), pick(3.4, 2.9))), dist: pick(21, 18), yaw: pick(-2, -3), pitch: 6, fov: FOV };

function drawWindow(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = '#131318'; c.fillRect(0, 0, 880, 615);
  c.fillStyle = '#1A1A21'; c.fillRect(0, 0, 880, 42);
  c.fillStyle = '#26262E'; c.fillRect(0, 41, 880, 1);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => { c.beginPath(); c.arc(24 + i * 20, 21, 6, 0, Math.PI * 2); c.fillStyle = col; c.fill(); });
  rr(c, 290, 9, 300, 24, 7); c.fillStyle = 'rgba(255,255,255,0.06)'; c.fill();
  drawIcon(c, img('icons/lock.svg'), 440, 21, 14, 'rgba(245,245,245,0.4)');
  c.save();
  c.beginPath(); c.rect(0, 42, 880, 573); c.clip();
  c.translate(0, 42); c.scale(PAGE_S, PAGE_S);
  const zoom = lerp(1, 1.06, eIO(P(t, T0, T1 - T0)));
  c.translate(620, 320); c.scale(zoom, zoom); c.translate(-620, -320);
  c.drawImage(img('assets/sistempakar.jpg'), 0, 0, 1240, 808);
  const hv = within(t, CLICK - 0.3, CLICK + 0.12, 0.1);
  if (hv > 0) {
    c.save(); c.globalAlpha = hv;
    c.shadowColor = 'rgba(120,40,70,0.45)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
    rr(c, 543, 656, 151, 49, 25); c.fillStyle = 'rgba(255,255,255,0.2)'; c.fill();
    c.shadowColor = 'transparent'; c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.stroke();
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

const card = (c: CanvasRenderingContext2D, w: number, h: number) => { rr(c, 0.5, 0.5, w - 1, h - 1, 22); c.fillStyle = '#131318'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.09)'; c.stroke(); };
const txt = (c: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, weight: number, color: string, align: CanvasTextAlign = 'left', track = 0) => { setType(c, px, weight, track); c.fillStyle = color; c.textAlign = align; c.fillText(s, x, y); c.textAlign = 'left'; };

function drawThesis(c: CanvasRenderingContext2D, t: number) {
  card(c, 430, 362);
  let done = 0;
  TICKS.forEach((t0) => (done += eOut(P(t, t0, 0.35))));
  txt(c, TX.thesis, 26, 50, 20, 650, '#F5F5F5', 'left', -0.01);
  txt(c, TX.complete(Math.round((done / 5) * 100)), 404, 50, 17, 400, '#9CA3AF', 'right');
  rr(c, 26, 66, 378, 6, 3); c.fillStyle = '#26262E'; c.fill();
  if (done > 0.01) { const g = c.createLinearGradient(26, 0, 404, 0); g.addColorStop(0, '#2563EB'); g.addColorStop(1, '#60A5FA'); rr(c, 26, 66, 378 * (done / 5), 6, 3); c.fillStyle = g; c.fill(); }
  ['I', 'II', 'III', 'IV', 'V'].forEach((n, i) => {
    const y = 86 + i * 52;
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(26, y, 378, 1);
    txt(c, n, 26, y + 31, 14, 600, '#6B7280');
    txt(c, TX.chapters[i]!, 70, y + 32, 17, 550, '#F5F5F5');
    const t0 = TICKS[i]!;
    const f = eBack(P(t, t0, 0.3), 2.2), k = eOut(P(t, t0 + 0.06, 0.28));
    const bx = 378, by = y + 13;
    rr(c, bx, by, 26, 26, 8); c.lineWidth = 1.5; c.strokeStyle = '#3a3a44'; c.stroke();
    if (f > 0) { c.save(); c.translate(bx + 13, by + 13); c.scale(f, f); rr(c, -13, -13, 26, 26, 8); c.fillStyle = '#3B82F6'; c.fill(); c.restore(); }
    if (k > 0) {
      c.save(); c.translate(bx + 5, by + 5); c.scale(16 / 24, 16 / 24);
      const pts: [number, number][] = [[5, 12.5], [9.5, 17], [19, 7.5]];
      const L1 = Math.hypot(4.5, 4.5), L2 = Math.hypot(9.5, 9.5), L = (L1 + L2) * k;
      c.beginPath(); c.moveTo(...pts[0]!);
      if (L <= L1) c.lineTo(5 + 4.5 * (L / L1), 12.5 + 4.5 * (L / L1));
      else { c.lineTo(...pts[1]!); const u = (L - L1) / L2; c.lineTo(9.5 + 9.5 * u, 17 - 9.5 * u); }
      c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#fff'; c.stroke();
      c.restore();
    }
  });
}

function drawDiag(c: CanvasRenderingContext2D, t: number) {
  card(c, 330, 176);
  const gv = GV * eOut(P(t, G0, 1.41));
  const cx = 24 + 59, cy = 29 + 59, r = 50;
  const a0 = (18 * Math.PI) / 180, full = Math.PI * 2;
  c.lineWidth = 10; c.lineCap = 'butt';
  c.beginPath(); c.arc(cx, cy, r, a0, a0 + full * 0.9); c.strokeStyle = '#26262E'; c.stroke();
  if (gv > 0.003) { c.beginPath(); c.arc(cx, cy, r, a0, a0 + full * 0.9 * gv); c.lineCap = 'round'; c.strokeStyle = '#3B82F6'; c.stroke(); }
  if (gv > 0.01) {
    // the logo arrow rides the ring's end: ring + arrow = the mark
    const th = a0 + full * 0.9 * gv + (7 * Math.PI) / 180;
    c.save(); c.translate(cx + r * Math.cos(th), cy + r * Math.sin(th)); c.rotate(th + Math.PI / 2); c.scale(0.115, 0.115);
    c.beginPath(); c.moveTo(-130, -75); c.lineTo(0, 0); c.lineTo(-130, 80); c.lineTo(-96, 0); c.closePath(); c.fillStyle = '#F5F5F5'; c.fill();
    c.restore();
  }
  txt(c, `${Math.round(gv * 100)}%`, cx, cy + 10, 30, 700, '#F5F5F5', 'center', -0.03);
  txt(c, TX.diagT, 166, 70, 15, 400, '#9CA3AF');
  txt(c, TX.diagN[0]!, 166, 102, 22, 650, '#F5F5F5', 'left', -0.01);
  txt(c, TX.diagN[1]!, 166, 127, 22, 650, '#F5F5F5', 'left', -0.01);
}

// ---------------------------------------------------------------- choreography
function shotAt(t: number): Shot {
  const h = HOME.skripsi;
  const drift0 = eOut(P(t, T0, PUSH0 - T0)) * 1.2;
  const k = eIO(P(t, PUSH0, PUSH1 - PUSH0));
  const push = 0.8 * eOut(P(t, PUSH1, TK - PUSH1));
  const s: Shot = { look: h.look.clone().lerp(CARDS.look, k), dist: lerp(h.dist - drift0, CARDS.dist, k) - push, yaw: lerp(h.yaw, CARDS.yaw, k), pitch: lerp(h.pitch, CARDS.pitch, k), fov: FOV };
  // rack focus: from the window to the cards, the window falls out of focus behind them
  const cardDist = s.dist;
  s.focus = cardDist;
  s.ap = lerp(8, 48, k);
  return s;
}
function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  return t < TK ? shotAt(t) : craneShot(t, TK, T1, shotAt(TK), HOME.responsif);
}
function arrow(t: number): ArrowPose | null {
  if (t < T0 || t >= T1) return null;
  if (t < LAND) return landArrow(t, T0, LAND, craneArrow(T0, T0 - 1, T0, HOME.skripsi, HOME.skripsi).pos, win.screen, 860 * PAGE_S, 42 + 470 * PAGE_S, CUR_S);
  if (t < TK) return null;
  const [x, y] = pathAt(KEYS, TK);
  return takeoffArrow(t, TK, T1, win.screen, x * PAGE_S, 42 + y * PAGE_S, CUR_S, HOME.responsif.look.clone().add(v3(0, LEAD, 1.2)));
}

function update(t: number, w: World, _f: FrameOut) {
  const on = t >= T0 - 1.2 && t < T1 + 0.6;
  win.group.visible = thesis.group.visible = diag.group.visible = on;
  floor.uniforms.light!.value = eOut(P(t, T0 - 0.1, 0.6)) * (1 - P(t, T1 + 0.2, 0.4));
  if (t >= T0 && t < T1) { const l = eOut(P(t, T0, 0.5)); w.studio.key.intensity = 2.2 * l; w.studio.rim.intensity = 3 * l; }
  if (!on) return;
  const turn = eIO(P(t, T0, T1 - T0));
  win.group.position.copy(O).add(v3(pick(-0.3, 3.5), pick(3.7, 4.0), pick(-2.6, -2.4)));
  win.group.rotation.y = pick(-0.1, -0.12);
  thesis.group.position.copy(O).add(v3(pick(-1.3, -0.4), pick(2.35, 2.3), pick(3.3, 2.8)));
  thesis.group.rotation.set(-0.03, pick(0.24, 0.22) - 0.06 * turn, 0);
  diag.group.position.copy(O).add(v3(pick(2.2, 5.3), pick(1.5, 1.6), pick(4.2, 3.4)));
  diag.group.rotation.set(-0.03, pick(-0.26, -0.24) + 0.06 * turn, 0);
  win.screen.draw((c) => drawWindow(c, t));
  thesis.screen.draw((c) => drawThesis(c, t));
  diag.screen.draw((c) => drawDiag(c, t));
  win.screen.sheen = lerp(-0.4, 1.4, P(t, T0 + 0.8, 1.0));
  thesis.screen.sheen = lerp(-0.4, 1.4, P(t, PUSH0 + 0.4, 1.0));
}

const s5: Chapter = {
  init(w) {
    CUR_S = cursorPx(win.screen, 880);
    w.scene.add(win.group, thesis.group, diag.group);
    floor = w.studio.addFloor(O, pick([7, 6], [11, 6]));
    for (const g of [win.group, thesis.group, diag.group]) w.studio.addMirror(g, O.y);
  },
  update,
  shot,
  arrow,
};
export default s5;
