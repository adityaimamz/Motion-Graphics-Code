// S10 · Closing · 67.5–75 (STYLE.md §1, edukasi). The white-out fades to void; the ring draws symmetrically
// from 9 o'clock while the arrow (the same blue pulse) flies in from the left and locks into the right-hand
// gap on the downbeat 69.375: shockwave, pop, small shake. The wordmark rises from its mask, the line
// comes, the Follow pill pops and is tapped; the card holds ≥ 1.2 s. Loop-out (74.4–75): the card is on a
// screen; the camera pushes into the black bar above it and arrives exactly at frame 0.
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { Layer2D, W } from '../engine/gl';
import { screen } from '../sets/screen';
import { s1Cam } from './s1-layar';
import { v3, type Cam } from '../r3';
import { camPath } from '../path';
import { setType, maskText, measure, rr } from '../type';
import { eOut, eBack, eIO, P, damp } from '../motion';
import { clamp, lerp } from '../engine/util';
import type { Chapter } from '../world';

const [T0] = CH.closing;
const C = CUE.closing;
const LOGO_C: [number, number] = [540, 790];
const LOGO_S = 1.28;
const ARROW = new Path2D('M200,172 L330,247 L200,327 L234,247 Z');
const LINE = CUE.teks[CUE.teks.length - 1]!;

const card = new Layer2D();

/** Where the arrow is (SVG offset from its locked place, px) and its tilt, 0..1 of the flight. */
function arrowFlight(u: number): { x: number; y: number; a: number } {
  // a curve from off the left edge, below, rising into the gap
  const m = 1 - u;
  const p0 = [-1150, 260], p1 = [-620, 330], p2 = [-180, 60], p3 = [0, 0];
  const b = (i: number) => m * m * m * p0[i]! + 3 * m * m * u * p1[i]! + 3 * m * u * u * p2[i]! + u * u * u * p3[i]!;
  const x = b(0), y = b(1);
  const u2 = Math.min(1, u + 0.01), m2 = 1 - u2;
  const x2 = m2 * m2 * m2 * p0[0]! + 3 * m2 * m2 * u2 * p1[0]! + 3 * m2 * u2 * u2 * p2[0]! + u2 * u2 * u2 * p3[0]!;
  const y2 = m2 * m2 * m2 * p0[1]! + 3 * m2 * m2 * u2 * p1[1]! + 3 * m2 * u2 * u2 * p2[1]! + u2 * u2 * u2 * p3[1]!;
  return { x, y, a: Math.atan2(y2 - y, x2 - x) };
}

function drawCard(c: CanvasRenderingContext2D, t: number) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 1920);
  const [cx, cy] = LOGO_C;
  // soft blue floor glow once the mark is locked
  const gk = eOut(P(t, C.lock, 1.2));
  if (gk > 0) {
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, 760);
    g.addColorStop(0, `rgba(59,130,246,${0.16 * gk})`); g.addColorStop(0.5, `rgba(37,99,235,${0.05 * gk})`); g.addColorStop(1, 'rgba(37,99,235,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, 1920);
  }
  c.save();
  c.translate(cx, cy); c.scale(LOGO_S, LOGO_S); c.translate(-249, -247);
  // ring: two arcs from 9 o'clock, the gap on the right kept clear
  const ap = eOut(P(t, C.ring[0], C.ring[1] - C.ring[0]));
  if (ap > 0) {
    c.save();
    c.beginPath(); c.rect(-2000, -2000, 5000, 5000); c.rect(300, 229, 200, 36); c.clip('evenodd');
    c.strokeStyle = '#F5F5F5'; c.lineWidth = 34; c.lineCap = 'butt';
    c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI + Math.PI * ap, false); c.stroke();
    c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI - Math.PI * ap, true); c.stroke();
    c.restore();
  }
  // the arrow: flies in with its light trail, locks on the beat, one pop
  const fl = P(t, C.fly, C.lock - C.fly);
  if (t >= C.fly) {
    const u = t < C.lock ? eOut(fl ** 0.9) : 1;
    const locked = t >= C.lock;
    if (!locked || t < C.lock + 0.4) {
      const ta = locked ? 1 - P(t, C.lock, 0.4) : 1;
      for (let s = 0; s < 22; s++) {
        const ua = clamp(u - (s + 1) * 0.022), ub = clamp(u - s * 0.022);
        if (ub <= 0) break;
        const A = arrowFlight(ua), B = arrowFlight(ub);
        const f = s / 22;
        c.strokeStyle = `rgba(${Math.round(lerp(147, 37, f))},${Math.round(lerp(197, 99, f))},${Math.round(lerp(253, 235, f))},${(1 - f) * 0.75 * ta})`;
        c.lineWidth = (1 - f) * 64; c.lineCap = 'round';
        c.beginPath(); c.moveTo(265 + A.x, 247 + A.y); c.lineTo(265 + B.x, 247 + B.y); c.stroke();
      }
    }
    const P0 = arrowFlight(u);
    const tilt = locked ? 0 : P0.a * (1 - P(t, C.lock - 0.25, 0.25));
    const pop = locked ? 1 + 0.18 * (1 - eBack(P(t, C.lock, 0.32), 1.5)) : 1;
    c.save();
    c.translate(265 + P0.x, 247 + P0.y); c.rotate(tilt); c.scale(pop, pop); c.translate(-265, -247);
    c.shadowColor = 'rgba(96,165,250,0.9)'; c.shadowBlur = 40 * (locked ? 1 - 0.7 * P(t, C.lock, 0.9) : 1);
    c.fillStyle = '#F5F5F5'; c.fill(ARROW);
    c.restore();
  }
  c.restore();
  // shockwave on the lock
  const sw = P(t, C.lock, 0.95);
  if (sw > 0 && sw < 1) {
    c.beginPath(); c.arc(cx, cy, 150 + eOut(sw) * 700, 0, Math.PI * 2);
    c.strokeStyle = `rgba(96,165,250,${0.85 * (1 - sw)})`; c.lineWidth = 3 + 7 * (1 - sw); c.stroke();
  }
  // wordmark rising from its mask
  const wp = P(t, C.wm, 0.75);
  if (wp > 0) maskText(c, 'Beyond Studio', cx, 1135, 112, wp, 0, { align: 'center', weight: 700, trackEm: -0.045, stagger: 0.3 });
  // the line
  if (t >= LINE.in) maskText(c, LINE.s, cx, 1262, 50, P(t, LINE.in, 0.65), 0, { align: 'center', weight: 600, trackEm: -0.02, color: 'rgba(245,245,245,0.82)', stagger: 0.3 });
  drawFollow(c, t);
}

function drawFollow(c: CanvasRenderingContext2D, t: number) {
  const fp = eBack(P(t, C.follow, 0.4), 1.5);
  if (fp <= 0) return;
  const cx = 540, cy = 1392, pw = 330, ph = 88, tap = C.tap;
  const press = P(t, tap - 0.06, 0.06) * (1 - P(t, tap + 0.05, 0.17));
  const done = eOut(P(t, tap + 0.12, 0.28));
  if (done < 1) {
    const r = ((t - C.follow) * 0.9) % 1;
    rr(c, cx - pw / 2 - r * 26, cy - ph / 2 - r * 26, pw + r * 52, ph + r * 52, ph / 2 + r * 26);
    c.strokeStyle = `rgba(96,165,250,${0.55 * (1 - r) * (1 - done) * Math.min(1, fp)})`; c.lineWidth = 3; c.stroke();
  }
  c.save(); c.translate(cx, cy); const s = fp * (1 - 0.05 * press); c.scale(s, s);
  const blue = [59, 130, 246], dark = [17, 24, 39];
  const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i]! - v) * k)).join(',')})`;
  rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.fillStyle = mix(blue, dark, done); c.fill();
  if (done > 0) { c.strokeStyle = `rgba(245,245,245,${0.3 * done})`; c.lineWidth = 2; c.stroke(); }
  const rp = P(t, tap, 0.55);
  if (rp > 0 && rp < 1) { c.save(); rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.clip(); c.beginPath(); c.arc(60, 0, 20 + rp * 300, 0, Math.PI * 2); c.fillStyle = `rgba(147,197,253,${0.45 * (1 - rp)})`; c.fill(); c.restore(); }
  setType(c, 38, 700, -0.016); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F5F5F5';
  if (done < 1) { c.globalAlpha = 1 - done; c.fillText('+  Follow', 0, 2 - done * 16); }
  if (done > 0) {
    c.globalAlpha = done; c.fillText('Following', 22, 2 + (1 - done) * 16);
    c.strokeStyle = '#F5F5F5'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-104, 2); c.lineTo(-94, 12); c.lineTo(-76, -8); c.stroke();
  }
  c.restore(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  // the finger
  const tp = P(t, tap - 0.35, 0.85);
  if (tp > 0 && tp < 1) {
    const a = Math.sin(tp * Math.PI), d = (1 - eOut(P(t, tap - 0.35, 0.35))) * 60;
    c.beginPath(); c.arc(cx + 60 + d, cy + d, 36 - 8 * press, 0, Math.PI * 2); c.fillStyle = `rgba(255,255,255,${0.3 * a})`; c.fill();
    c.strokeStyle = `rgba(255,255,255,${0.6 * a})`; c.lineWidth = 3; c.stroke();
  }
  void measure;
}

// the loop-out camera: straight-on onto the card (rows 240–2160 fill the frame) → frame 0's macro pose
const ON: Cam = { pos: v3(540, 1200, 960 / Math.tan(THREE.MathUtils.degToRad(20))), look: v3(540, 1200, 0), up: v3(0, -1, 0), fov: 40, ap: 0 };
function loopCam(t: number): Cam {
  const f0 = s1Cam(0);
  const k = eIO(P(t, C.loopout, 75 - C.loopout));
  const keys = [
    { t: 0, pos: ON.pos, look: ON.look, up: v3(0, -1, 0), fov: 40, ap: 0, focus: ON.pos.z },
    { t: 0.55, pos: v3(505, 150, 420), look: v3(495, 60, 0), up: v3(-1, 0, 0.15), fov: 40, ap: 8, focus: 430 },
    { t: 1, pos: f0.pos, look: f0.look, up: f0.up!, fov: f0.fov, ap: f0.ap, focus: f0.focus },
  ];
  return camPath(keys, k);
}

const s10: Chapter = {
  id: 'closing',
  render(t, ctx, out) {
    drawCard(card.ctx, t);
    card.upload();
    // the white-out from S9 decays into the void
    ctx.post.flash = t < 68.2 ? 2.2 * Math.exp(-(t - T0) / 0.16) : 0;
    ctx.post.shake = [damp(t, C.lock, 6, 62, 10), damp(t, C.lock, 4, 47, 10)];
    ctx.post.vignette = 0.3;
    if (t < C.loopout) { ctx.comp.draw(ctx.renderer, card.texture, out, { mode: 'normal' }); return; }
    // loop-out: the card is on a phone screen; into the black bar above it, arriving at frame 0
    screen.render(ctx, loopCam(t), { scan: 0, oldTex: card.texture, oldRect: [0, 240, 1080, 2160], gain: 6.9, oldK: 1 - P(t, 74.72, 0.26), lineGlow: 0.5 * P(t, 74.7, 0.3), touch: 0 }, out);
  },
};
export default s10;
