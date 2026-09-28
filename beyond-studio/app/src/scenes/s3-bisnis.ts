// S3 · Bisnis · 7.5–13.125. The Angga Jaya store on a laptop (real screenshot) + its mobile page on a
// phone. The arrow lands in the laptop as the cursor: size M (8.906), qty + (9.844), add to cart
// (10.781, the phone is tapped in sync). 11.25: the revenue card pops toward the camera and counts to
// Rp 12,4 jt. 12.656: the cursor takes off upward and the camera cranes to the portfolio set.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Laptop, Phone, Panel, drawCursor, drawRipple, drawIcon } from '../stage/devices';
import { CUE, CH } from '../cues';
import { pick } from '../fmt';
import { TX } from '../text';
import { eOut, eIO, eBack, P, damp, within, pathAt, pressAt, drift } from '../stage/motion';
import { img, rr, setType } from '../stage/type';
import { clamp, lerp } from '../engine/util';
import { HOME, SET_Y, setOrigin, craneShot, craneArrow, landArrow, takeoffArrow, cursorPx, v3, LEAD } from './layout';

const [T0, T1] = CH.bisnis;
const LAND = CUE.land3, TK = CUE.takeoff3;
const [C1, C2, C3] = CUE.click3 as [number, number, number];
const O = setOrigin(SET_Y.bisnis);
const laptop = new Laptop(1240, 776);
const phone = new Phone(390, 842);
const card = new Panel(4.4, 3.0, 440, 300, 0.22, 2, 0.1);
let floor: THREE.ShaderMaterial;
let CUR_S = 0.37;

// cursor path in page px: [t, x, y]; clicks on the beat
const KEYS: [number, number, number][] = [
  [LAND, 560, 330], [C1 - 0.2, 726, 454], [C1 + 0.1, 726, 454], [C2 - 0.2, 750, 546], [C2 + 0.1, 750, 546],
  [C3 - 0.18, 842, 700], [C3 + 0.12, 842, 700], [C3 + 0.9, 610, 400],
];
// ---------------------------------------------------------------- screens
function drawLaptop(c: CanvasRenderingContext2D, t: number) {
  const zoom = lerp(1, 1.04, eIO(P(t, T0, T1 - T0)));
  c.save();
  c.translate(620, 0); c.scale(zoom, zoom); c.translate(-620, -6 * (zoom - 1) * 100);
  c.drawImage(img('assets/anggajaya.jpg'), 0, 0, 1240, 800);
  // live UI over the screenshot (page px)
  const sel = clamp(P(t, C1 + 0.025, 0.07));
  const box = (x: number, y: number, w: number, h: number, r: number, fill: string | null, stroke?: string, sw = 1.5) => {
    rr(c, x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.stroke(); }
  };
  const label = (s: string, x: number, y: number, px: number, weight: number, color: string) => { setType(c, px, weight, 0); c.fillStyle = color; c.textAlign = 'center'; c.fillText(s, x, y); c.textAlign = 'left'; };
  if (sel > 0) {
    c.globalAlpha = sel;
    box(646.75, 434.75, 46.5, 34.5, 8, '#fdf9f8', '#e7e1de'); label('S', 670, 458, 16, 700, '#1c1917');
    const pop = 1 + damp(t, C1 + 0.025, 0.12, 30, 12);
    c.save(); c.translate(726, 452); c.scale(pop, pop); c.translate(-726, -452);
    box(703, 435, 46, 34, 8, '#ffd8d1', '#a8442c', 2); label('M', 726, 458, 16, 700, '#1c1917');
    c.restore();
    c.globalAlpha = 1;
  }
  const hv = within(t, C1 - 0.2, C1 + 0.03) * (1 - sel);
  if (hv > 0) { c.globalAlpha = hv; box(703, 435, 46, 34, 8, null, '#c9b8b2', 2); c.globalAlpha = 1; }
  const ph = within(t, C2 - 0.2, C2 + 0.05);
  if (ph > 0) { c.globalAlpha = ph; box(733, 528, 30, 32, 8, 'rgba(0,0,0,0.08)'); c.globalAlpha = 1; }
  if (t >= C2 + 0.03) {
    const k = eOut(P(t, C2 + 0.03, 0.22));
    c.fillStyle = '#e6e2e1'; c.fillRect(694, 528, 30, 32);
    c.save(); c.beginPath(); c.rect(694, 528, 30, 32); c.clip();
    label('2', 709, 550 + (1 - k) * 10, 19, 650, '#1c1917');
    c.restore();
  }
  const bh = within(t, C3 - 0.18, C3 + 0.2) * (1 + 0.6 * clamp(P(t, C3 - 0.02, 0.04) - P(t, C3 + 0.06, 0.15)));
  if (bh > 0) { c.globalAlpha = Math.min(1, bh); box(645, 673, 453, 51, 8, `rgba(0,0,0,${0.16 * bh})`); c.globalAlpha = 1; }
  const bd = 1 + damp(t, C3 + 0.14, 0.55, 26, 9);
  c.save(); c.translate(1177.5, 28.5); c.scale(bd, bd);
  c.beginPath(); c.arc(0, 0, 7.5, 0, Math.PI * 2); c.fillStyle = '#a3321b'; c.fill();
  label(t < C3 + 0.14 ? '2' : '3', 0, 3.6, 10, 800, '#fff');
  c.restore();
  c.restore();
  // cursor + click ripples (page px, no zoom: it lives on the glass)
  if (t >= LAND && t < TK) {
    const [x, y] = pathAt(KEYS, t);
    [C1, C2, C3].forEach((tc) => drawRipple(c, x, y, P(t, tc, 0.5), 'rgba(255,255,255,0.55)'));
    const [dx, dy] = drift(t);
    drawCursor(c, x + dx, y + dy, CUR_S, pressAt(t, [C1, C2, C3]));
  }
}

function drawPhone(c: CanvasRenderingContext2D, t: number) {
  const W = 390;
  c.fillStyle = '#FDF9F8'; c.fillRect(0, 0, W, 842);
  const txt = (s: string, x: number, y: number, px: number, weight: number, color: string, align: CanvasTextAlign = 'left', track = 0) => { setType(c, px, weight, track); c.fillStyle = color; c.textAlign = align; c.fillText(s, x, y); c.textAlign = 'left'; };
  // status bar
  txt('9:41', 42, 36, 17, 600, '#1c1917');
  drawIcon(c, img('icons/signal.svg'), 302, 30, 17, '#1c1917');
  drawIcon(c, img('icons/wifi.svg'), 324, 30, 17, '#1c1917');
  rr(c, 336, 24, 26, 12, 4); c.lineWidth = 1.5; c.strokeStyle = 'rgba(28,25,23,0.9)'; c.stroke();
  rr(c, 338, 26, 17, 8, 1.5); c.fillStyle = '#1c1917'; c.fill();
  // header
  c.drawImage(img('assets/ag_logo.png'), 20, 68, 50, 36);
  txt('ANGGA JAYA', 80, 94, 21, 800, '#B22400', 'left', -0.01);
  drawIcon(c, img('icons/heart.svg'), 322, 86, 24, '#3f2a22');
  drawIcon(c, img('icons/shopping-cart.svg'), 360, 86, 24, '#3f2a22');
  const bd = 1 + damp(t, C3 + 0.14, 0.5, 26, 9);
  c.save(); c.translate(372, 76); c.scale(bd, bd);
  rr(c, -9, -9, 18, 18, 9); c.fillStyle = '#B22400'; c.fill();
  txt(t < C3 + 0.14 ? '2' : '3', 0, 4, 11, 700, '#fff', 'center');
  c.restore();
  c.fillStyle = '#eee4e0'; c.fillRect(0, 114, W, 1);
  // product
  c.save(); rr(c, 18, 128, 354, 330, 18); c.clip(); c.drawImage(img('assets/ag_product.jpg'), 18, 116, 354, 354); c.restore();
  txt('CPD KAFIA (PLS)', 20, 499, 25, 800, '#1c1917', 'left', -0.02);
  setType(c, 14, 400, 0); c.fillStyle = '#57534e'; c.fillText(TX.category + ' ', 20, 530);
  const cw = c.measureText(TX.category + ' ').width;
  txt(TX.categoryVal, 20 + cw, 530, 14, 600, '#B22400');
  rr(c, 18, 540, 354, 78, 14); c.fillStyle = '#F4EEEC'; c.fill();
  txt(TX.priceLabel, 34, 566, 12, 600, '#78716c', 'left', 0.02);
  txt('Rp 49.000', 34, 600, 27, 800, '#B22400', 'left', -0.02);
  // sizes (S selected on the phone)
  rr(c, 20.75, 636.75, 50.5, 40.5, 10); c.fillStyle = '#FDE8E3'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#B22400'; c.stroke();
  txt('S', 46, 663, 17, 700, '#1c1917', 'center');
  rr(c, 82.75, 636.75, 50.5, 40.5, 10); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#e7e0dc'; c.stroke();
  txt('M', 108, 663, 17, 700, '#1c1917', 'center');
  // add to cart: pressed on the beat with the laptop click, ripple from the finger
  const press = clamp(P(t, C3 - 0.08, 0.1) - P(t, C3 + 0.04, 0.18));
  c.save(); c.translate(195, 728); c.scale(1 - 0.045 * press, 1 - 0.045 * press); c.translate(-195, -728);
  rr(c, 18, 700, 354, 56, 14); c.fillStyle = '#B22400'; c.fill();
  c.save(); rr(c, 18, 700, 354, 56, 14); c.clip();
  const rp = P(t, C3, 0.55);
  if (rp > 0 && rp < 1) { c.globalAlpha = (1 - rp) * 0.6; c.beginPath(); c.arc(195, 728, 20 * lerp(0, 11, eOut(rp)), 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill(); c.globalAlpha = 1; }
  c.restore();
  setType(c, 17, 700, 0);
  const lw = c.measureText(TX.addCart).width + 28;
  drawIcon(c, img('icons/shopping-bag.svg'), 195 - lw / 2 + 10, 727, 20, '#fff');
  txt(TX.addCart, 195 - lw / 2 + 28, 734, 17, 700, '#fff');
  c.restore();
  rr(c, 18, 768, 354, 56, 14); c.fillStyle = '#016B11'; c.fill();
  setType(c, 17, 700, 0);
  const ww = c.measureText(TX.orderWa).width + 28;
  drawIcon(c, img('icons/message-circle.svg'), 195 - ww / 2 + 10, 795, 20, '#fff');
  txt(TX.orderWa, 195 - ww / 2 + 28, 802, 17, 700, '#fff');
  // toast
  const to = eOut(P(t, C3 + 0.16, 0.5));
  if (to > 0) {
    c.save(); c.globalAlpha = clamp(to * 2); c.translate(0, lerp(-90, 0, to));
    c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    rr(c, 45, 62, 300, 50, 25); c.fillStyle = '#1c1917'; c.fill(); c.shadowColor = 'transparent';
    setType(c, 15, 600, 0);
    const tw = c.measureText(TX.toast).width + 34;
    c.beginPath(); c.arc(195 - tw / 2 + 12, 87, 12, 0, Math.PI * 2); c.fillStyle = '#16A34A'; c.fill();
    drawIcon(c, img('icons/check.svg'), 195 - tw / 2 + 12, 87, 15, '#fff');
    txt(TX.toast, 195 - tw / 2 + 34, 92, 15, 600, '#fff');
    c.restore();
  }
  // dynamic island
  rr(c, 149, 10, 92, 27, 14); c.fillStyle = '#000'; c.fill();
}

const BARH = [0.46, 0.62, 0.38, 0.94, 0.58, 0.34];
function drawCard(c: CanvasRenderingContext2D, t: number) {
  rr(c, 0.5, 0.5, 439, 299, 22); c.fillStyle = '#131318'; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.09)'; c.stroke();
  const txt = (s: string, x: number, y: number, px: number, weight: number, color: string, track = 0) => { setType(c, px, weight, track); c.fillStyle = color; c.fillText(s, x, y); };
  txt(TX.revenue, 28, 43, 17, 500, '#9CA3AF');
  txt(TX.rev(12.4 * eOut(P(t, CUE.rev3 + 0.1, 1.2))), 28, 92, 40, 700, '#F5F5F5', -0.03);
  const cp = eBack(P(t, CUE.rev3 + 0.65, 0.4), 1.8);
  if (cp > 0) {
    c.save(); c.translate(372, 44); c.scale(cp, cp);
    rr(c, -40, -18, 80, 32, 16); c.fillStyle = 'rgba(34,197,94,0.12)'; c.fill();
    setType(c, 15, 600, 0); c.fillStyle = '#86EFAC'; c.textAlign = 'center'; c.fillText('+18%', 0, 3); c.textAlign = 'left';
    c.restore();
  }
  const bw = (440 - 56 - 5 * 14) / 6;
  BARH.forEach((h, i) => {
    const x = 28 + i * (bw + 14);
    const bh = h * 136 * eOut(P(t, CUE.rev3 + 0.1 + i * 0.07, 0.75));
    if (bh > 0.5) {
      rr(c, x, 252 - bh, bw, bh, Math.min(8, bh / 2));
      if (i === 3) { const g = c.createLinearGradient(0, 252 - bh, 0, 252); g.addColorStop(0, '#60A5FA'); g.addColorStop(1, '#2563EB'); c.fillStyle = g; } else c.fillStyle = '#2A2A33';
      c.fill();
    }
    setType(c, 13, 400, 0); c.fillStyle = '#6B7280'; c.textAlign = 'center'; c.fillText(TX.days[i]!, x + bw / 2, 276); c.textAlign = 'left';
  });
}

// ---------------------------------------------------------------- choreography
const shotAt = (t: number): Shot => {
  const k = eOut(P(t, T0, TK - T0));
  const h = HOME.bisnis;
  return { ...h, look: h.look.clone(), dist: h.dist - 1.8 * k, yaw: h.yaw + 3 * k, focus: h.dist - 1.8 * k, ap: 8 };
};
const LEAD_NEXT = () => HOME.portofolio.look.clone().add(v3(0, LEAD, 1.2));

function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  return t < TK ? shotAt(t) : craneShot(t, TK, T1, shotAt(TK), HOME.portofolio);
}

function arrow(t: number): ArrowPose | null {
  if (t < T0 || t >= T1) return null;
  if (t < LAND) return landArrow(t, T0, LAND, craneArrow(T0, T0 - 1, T0, HOME.bisnis, HOME.bisnis).pos, laptop.screen, 560, 330, CUR_S);
  if (t < TK) return null;
  const [x, y] = pathAt(KEYS, TK);
  return takeoffArrow(t, TK, T1, laptop.screen, x, y, CUR_S, LEAD_NEXT());
}

function update(t: number, w: World, f: FrameOut) {
  const on = t >= T0 - 1.2 && t < T1 + 0.6;
  laptop.group.visible = phone.group.visible = card.group.visible = on;
  floor.uniforms.light!.value = eOut(P(t, T0 - 0.1, 0.6)) * (1 - P(t, T1 + 0.2, 0.4));
  if (t >= T0 && t < T1) {
    const l = eOut(P(t, T0, 0.5));
    w.studio.key.intensity = 2.2 * l; w.studio.rim.intensity = 3 * l; w.scene.environmentIntensity = 0.55;
  }
  if (!on) return;
  // poses (a slow turn toward the camera through the chapter)
  const turn = eIO(P(t, T0, T1 - T0));
  laptop.group.position.copy(O).add(v3(pick(-0.2, 3.7), 0, pick(-0.8, -0.6)));
  laptop.group.rotation.y = pick(0.12, 0.2) - 0.08 * turn;
  phone.group.position.copy(O).add(v3(pick(3.3, 7.7), 0, pick(4.2, 2.2)));
  phone.group.rotation.y = pick(-0.34, -0.3) + 0.06 * turn;
  const cp = eOut(P(t, CUE.rev3, 0.7));
  card.group.visible = cp > 0;
  card.group.position.copy(O).add(v3(pick(-1.7, -2.9), pick(1.3, 1.8) + cp * 0.2, lerp(-3, pick(5.2, 3.6), cp)));
  card.group.rotation.set(-0.04, pick(0.3, 0.26) + (1 - cp) * 0.4, 0);
  // screens
  laptop.screen.draw((c) => drawLaptop(c, t));
  phone.screen.draw((c) => drawPhone(c, t));
  if (cp > 0) card.screen.draw((c) => drawCard(c, t));
  laptop.screen.sheen = lerp(-0.4, 1.4, P(t, T0 + 0.75, 1.0));
  phone.screen.sheen = lerp(-0.4, 1.4, P(t, T0 + 0.9, 1.0));
  void f;
}

const s3: Chapter = {
  init(w) {
    CUR_S = cursorPx(laptop.screen, 908);
    w.scene.add(laptop.group, phone.group, card.group);
    floor = w.studio.addFloor(O, pick([7, 6], [11, 6]));
    for (const g of [laptop.group, phone.group, card.group]) w.studio.addMirror(g, O.y);
  },
  update,
  shot,
  arrow,
};
export default s3;
