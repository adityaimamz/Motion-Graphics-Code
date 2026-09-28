// S8 · Closing · 37.5–45 (STYLE.md §1). All lights off but one spot. The ring draws from 9 o'clock,
// the arrow flies in from the left and locks on the downbeat (39.375): shockwave, pop, bell. The
// wordmark rises; the lockup lifts to the top; then the CTA: question → URL typed → WhatsApp button
// (number from kontak.json) → QR (16:9 only) → sub-line; the button is tapped; the end card holds.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Ring, shockRing, ARROW_LOCK } from '../stage/logo';
import { drawIcon } from '../stage/devices';
import { CUE, CH } from '../cues';
import { V, pick, W as FW, H as FH } from '../fmt';
import { TX, WA, URL_TEXT } from '../text';
import { eOut, eIO, eBack, P, damp } from '../stage/motion';
import { maskText, setType, measure, fitPx, rr, img } from '../stage/type';
import { clamp, lerp, frameIdx } from '../engine/util';
import { FOV, SET_Y, SET_X, LOGO_S, v3 } from './layout';

const [T0, T1] = CH.closing;
const LOCK = CUE.lock8, CTA = CUE.cta8;
const O = v3(SET_X, SET_Y.closing, 0);
const FLOOR_Y = O.y - 3.4;
const DIST = pick(20.2, 21.8), PITCH = pick(4.5, 3.5);
const LOOK = O.clone().add(v3(pick(0, 0.24), pick(-0.7, 0), 0));
const ring = new Ring(), ringM = new Ring();
const shock = shockRing();
let floor: THREE.ShaderMaterial;
const WM = 'Beyond Studio';

/** Screen y (px) → world y on the z = 0 plane (small-pitch approximation). */
const worldY = (sy: number, dist: number) => LOOK.y + (0.5 - sy / FH) * 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
const LIFT0 = LOCK + 0.93, LIFT1 = CTA;
/** The lockup: centre + scale, lifting to the top of the frame before the CTA. */
function lockup(t: number) {
  const e = eIO(P(t, LIFT0, LIFT1 - LIFT0));
  const c0 = V ? v3(O.x, O.y + 0.9, 0) : v3(O.x - 3.6, O.y, 0);
  const s1 = pick(0.52, 0.36);
  const c1 = V ? v3(O.x, worldY(470, DIST), 0) : v3(O.x - 3.6 * s1 + 0.12, worldY(255, DIST), 0);
  return { c: c0.lerp(c1, e), s: lerp(1, s1, e) };
}

function shot(t: number): Shot | null {
  if (t < T0 || t > T1) return null;
  const push = eOut(P(t, T0, T1 - T0)) * 0.9;
  return { look: LOOK.clone(), dist: DIST - push, yaw: -12 * (1 - eOut(P(t, T0, LOCK - T0))), pitch: PITCH, fov: FOV, ap: 0 };
}

const FLY0 = LOCK - 0.975;
function arrow(t: number): ArrowPose | null {
  if (t < FLY0 || t > T1) return null;
  const L = lockup(t);
  const tip = L.c.clone().add(v3(ARROW_LOCK.x * LOGO_S * L.s, 0, 0.02));
  if (t < LOCK) {
    const c = L.c;
    const p = [v3(c.x - 9, c.y - 2.2, 3.2), v3(c.x - 5.5, c.y - 2.8, 2.4), v3(c.x - 1.9, c.y - 0.1, 0.5), tip];
    const b3 = (u: number) => { const m = 1 - u; return p[0]!.clone().multiplyScalar(m * m * m).addScaledVector(p[1]!, 3 * m * m * u).addScaledVector(p[2]!, 3 * m * u * u).addScaledVector(p[3]!, u * u * u); };
    const u = eOut(P(t, FLY0, LOCK - FLY0) ** 0.85);
    const pos = b3(u), dir = b3(Math.min(1, u + 0.02)).sub(pos);
    const settle = P(t, LOCK - 0.3, 0.3);
    if (dir.lengthSq() < 1e-8 || settle >= 1) dir.set(1, 0, 0);
    dir.normalize().lerp(v3(1, 0, 0), eOut(settle)).normalize();
    return { pos, dir, face: v3(0, 0, 1), scale: LOGO_S, trail: 1, glow: 0.9, bank: 0.9 * (1 - u) ** 2 };
  }
  const pop = 1 + 0.16 * (1 - eBack(P(t, LOCK, 0.32), 2.2));
  return { pos: tip, dir: v3(1, 0, 0), face: v3(0, 0, 1), scale: LOGO_S * L.s * pop, trail: 1 - P(t, LOCK, 0.35), glow: 0.9 - 0.75 * eOut(P(t, LOCK, 0.9)) };
}

// ---------------------------------------------------------------- CTA (overlay, crisp)
const TYPE = (() => { const j = [0, 0.06, 0.04, 0.07, 0.05, 0.05, 0.09, 0.04, 0.05, 0.06, 0.04, 0.05, 0.08, 0.05, 0.04, 0.06, 0.05]; let a = 0; return j.map((x) => (a += x)); })();
const WA_GLYPH = new Path2D('M3.5 20.5l1.4-4.1A8.5 8.5 0 1 1 8 19.3z');
const WA_HAND = new Path2D('M9.2 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.2 1.5 2.1 2.7 2.7l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.4-3-.3-1.5-.7-3-2.2-3.7-3.7-.7-1.4-.6-2.4-.5-3.2z');

function drawPill(c: CanvasRenderingContext2D, t: number, x: number, y: number, h: number, fullW: number) {
  const n = TYPE.filter((d) => t >= CUE.url8 + d).length;
  const ap = eOut(P(t, CUE.url8 - 0.2, 0.45));
  if (ap <= 0) return;
  c.save(); c.globalAlpha = ap; c.translate(0, (1 - ap) * 24);
  rr(c, x, y, fullW, h, h / 2); c.fillStyle = 'rgba(255,255,255,0.055)'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();
  const fs = h * 0.46;
  drawIcon(c, img('icons/globe.svg'), x + h * 0.52, y + h / 2, h * 0.28, 'rgba(245,245,245,0.45)');
  setType(c, fs, 560, -0.025); c.fillStyle = '#F5F5F5';
  const s = URL_TEXT.slice(0, n);
  const tx = x + h * 0.84;
  c.fillText(s, tx, y + h / 2 + fs * 0.36);
  const cw = s ? measure(c, s) : 0;
  if (frameIdx(t) % 60 < 34 || t < CUE.url8 + TYPE[TYPE.length - 1]! + 0.1) { rr(c, tx + cw + 5, y + h / 2 - fs * 0.52, 4, fs * 1.04, 2); c.fillStyle = '#60A5FA'; c.fill(); }
  // go button: the brand arrow on blue
  const gr = h * 0.37, gx = x + fullW - h * 0.13 - gr, gy = y + h / 2;
  c.save(); c.shadowColor = 'rgba(37,99,235,0.55)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
  c.beginPath(); c.arc(gx, gy, gr, 0, Math.PI * 2); c.fillStyle = '#2563EB'; c.fill(); c.restore();
  c.save(); c.translate(gx + gr * 0.18, gy); c.scale(gr / 240, gr / 240); c.translate(-265, -247);
  c.beginPath(); c.moveTo(200, 172); c.lineTo(330, 247); c.lineTo(200, 327); c.lineTo(234, 247); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore();
  c.restore();
}

function drawWA(c: CanvasRenderingContext2D, t: number, cx: number, y: number, h: number, align: 'center' | 'left' = 'center') {
  const pop = eBack(P(t, CUE.wa8, 0.45), 1.5);
  if (pop <= 0) return;
  const numPx = h * 0.41, smPx = h * 0.195;
  setType(c, numPx, 700, -0.02);
  const nw = measure(c, WA.tampil);
  const iconD = h * 0.74, pad = h * 0.13;
  const w = pad + iconD + h * 0.19 + nw + h * 0.37;
  const x = align === 'center' ? cx - w / 2 : cx;
  const press = clamp(P(t, CUE.tap8 - 0.06, 0.08) - P(t, CUE.tap8 + 0.05, 0.2));
  c.save();
  c.translate(x + w / 2, y + h / 2); c.scale(pop * (1 - 0.04 * press), pop * (1 - 0.04 * press)); c.translate(-(x + w / 2), -(y + h / 2));
  c.shadowColor = 'rgba(37,211,102,0.12)'; c.shadowBlur = 40; c.shadowOffsetY = 10;
  rr(c, x, y, w, h, h / 2); c.fillStyle = 'rgba(37,211,102,0.10)'; c.fill();
  c.shadowColor = 'transparent'; c.lineWidth = 1.5; c.strokeStyle = 'rgba(37,211,102,0.5)'; c.stroke();
  const icx = x + pad + iconD / 2, icy = y + h / 2;
  c.save(); c.shadowColor = 'rgba(37,211,102,0.4)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
  c.beginPath(); c.arc(icx, icy, iconD / 2, 0, Math.PI * 2); c.fillStyle = '#25D366'; c.fill(); c.restore();
  c.save(); c.translate(icx - iconD * 0.26, icy - iconD * 0.26); c.scale(iconD * 0.52 / 24, iconD * 0.52 / 24);
  c.lineWidth = 2; c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(WA_GLYPH); c.fillStyle = '#fff'; c.fill(WA_HAND);
  c.restore();
  const tx = icx + iconD / 2 + h * 0.19;
  setType(c, smPx, 550, 0.01); c.fillStyle = 'rgba(245,245,245,0.6)'; c.fillText('WhatsApp', tx, y + h * 0.43);
  setType(c, numPx, 700, -0.02); c.fillStyle = '#F5F5F5'; c.fillText(WA.tampil, tx, y + h * 0.43 + numPx * 1.02);
  // tap ripple
  const rp = P(t, CUE.tap8, 0.6);
  if (rp > 0 && rp < 1) { c.globalAlpha = 1 - rp; rr(c, x - rp * 26, y - rp * 26, w + rp * 52, h + rp * 52, h / 2 + rp * 26); c.lineWidth = 3; c.strokeStyle = '#25D366'; c.stroke(); c.globalAlpha = 1; }
  c.restore();
  return w;
}

function drawCTA(c: CanvasRenderingContext2D, t: number) {
  if (t < CTA - 0.02) return;
  if (V) {
    const px = fitPx(c, TX.cta, 100, 960, 780, -0.05);
    maskText(c, TX.cta, FW / 2, 860, px, P(t, CTA, 0.7), 0, { align: 'center', weight: 780, trackEm: -0.05 });
    setType(c, 44, 560, -0.025);
    const pw = 92 * 0.84 + measure(c, URL_TEXT) + 26 + 92 * 0.87;
    drawPill(c, t, FW / 2 - pw / 2, 1000, 92, pw);
    drawWA(c, t, FW / 2, 1130, 100);
    maskText(c, TX.sub, FW / 2, 1330, fitPx(c, TX.sub, 32, 940, 450, -0.01), P(t, CUE.sub8, 0.7), 0, { align: 'center', weight: 450, trackEm: -0.01, color: 'rgba(245,245,245,0.58)' });
  } else {
    maskText(c, TX.cta, FW / 2, 560, fitPx(c, TX.cta, 150, 1700, 780, -0.05), P(t, CTA, 0.7), 0, { align: 'center', weight: 780, trackEm: -0.05 });
    setType(c, 50, 560, -0.025);
    const pw = 108 * 0.84 + measure(c, URL_TEXT) + 30 + 108 * 0.87;
    // measure the WA button first to centre the pair
    setType(c, 108 * 0.41, 700, -0.02);
    const ww = 108 * 0.13 + 108 * 0.74 + 108 * 0.19 + measure(c, WA.tampil) + 108 * 0.37;
    const gx = FW / 2 - (pw + 24 + ww) / 2;
    drawPill(c, t, gx, 660, 108, pw);
    drawWA(c, t, gx + pw + 24, 660, 108, 'left');
    maskText(c, TX.sub, FW / 2, 870, 32, P(t, CUE.sub8, 0.7), 0, { align: 'center', weight: 450, trackEm: -0.01, color: 'rgba(245,245,245,0.58)' });
    const qp = eBack(P(t, CUE.qr8, 0.5), 1.4);
    if (qp > 0) {
      const S = 196, x = FW - 64 - S, y = FH - 64 - S - 56;
      c.save(); c.translate(x + S / 2, y + S / 2); c.scale(qp, qp); c.translate(-(x + S / 2), -(y + S / 2));
      c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 50; c.shadowOffsetY = 20;
      rr(c, x, y, S, S, 22); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
      c.imageSmoothingEnabled = false; c.drawImage(img(TX.qrFile), x + 12, y + 12, S - 24, S - 24); c.imageSmoothingEnabled = true;
      setType(c, 19, 550, 0); c.fillStyle = 'rgba(245,245,245,0.62)'; c.textAlign = 'center';
      c.fillText(TX.qr[0]!, x + S / 2, y + S + 30); c.fillText(TX.qr[1]!, x + S / 2, y + S + 54); c.textAlign = 'left';
      c.restore();
    }
  }
}

function update(t: number, w: World, f: FrameOut) {
  const on = t >= T0 - 0.05;
  ring.mesh.visible = ringM.mesh.visible = on;
  shock.visible = false;
  // one spot: the key comes up small, the floor pool narrows
  const light = eOut(P(t, T0 + 0.05, 0.5));
  floor.uniforms.light!.value = on ? light * 0.8 : 0;
  if (on) { w.studio.key.intensity = 1.8 * light; w.studio.rim.intensity = 2.2 * light; }
  if (!on) return;
  const L = lockup(t);
  const rp = eOut(P(t, T0, 0.9));
  ring.set(rp); ringM.set(rp);
  ring.mesh.position.copy(L.c); ring.mesh.scale.setScalar(LOGO_S * L.s); ring.update();
  ringM.mesh.position.set(L.c.x, 2 * FLOOR_Y - L.c.y, L.c.z); ringM.mesh.scale.set(LOGO_S * L.s, -LOGO_S * L.s, LOGO_S * L.s); ringM.update();
  const sw = P(t, LOCK, 0.95);
  if (sw > 0 && sw < 1) {
    shock.visible = true;
    shock.position.copy(L.c).add(v3(0, 0, 0.1));
    shock.scale.setScalar((1.6 + eOut(sw) * 6.5) * L.s);
    (shock.material as THREE.MeshBasicMaterial).opacity = 1.8 * (1 - sw) ** 2.4;
  }
  f.post.shake = [damp(t, LOCK, 6, 62, 10), damp(t, LOCK, 4, 47, 10)];
  f.post.flash = t >= LOCK ? 0.006 * Math.exp(-(t - LOCK) * 9) : 0;
  // wordmark (below the mark in 9:16, beside it in 16:9), scaled with the lockup
  const at = V ? L.c.clone().add(v3(0, -2.45 * L.s, 0)) : L.c.clone().add(v3((1.52 + 0.5) * L.s, -0.45 * L.s, 0));
  const a = w.project(at);
  maskText(f.c, WM, a.x, a.y, pick(0.72, 1.24) * L.s * a.k, P(t, LOCK + 0.23, 0.7), 0, { align: V ? 'center' : 'left', weight: 700, trackEm: -0.045, stagger: 0.3 });
  drawCTA(f.c, t);
}

const s8: Chapter = {
  init(w) {
    w.scene.add(ring.mesh, ringM.mesh, shock);
    floor = w.studio.addFloor(v3(O.x, FLOOR_Y, 0), pick([5, 4], [7, 4]));
    w.studio.addMirror(w.arrowGroup, FLOOR_Y, w.arrowMesh);
  },
  update,
  shot,
  arrow,
};
export default s8;
