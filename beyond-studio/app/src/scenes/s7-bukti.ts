// S7 · Bukti · 30–37.5. The studio wall lit blue (the burst from S6 lands here). 80+ / 98% roll like
// odometers, in front of their labels (slow camera parallax); then "Konsultasi gratis." / "Harga
// transparan." rise from the mask. 37.03: a giant arrowhead wipe with a glowing edge sweeps to black.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut } from '../stage/world';
import { CUE, CH } from '../cues';
import { V, pick, W as FW, H as FH } from '../fmt';
import { TX } from '../text';
import { eOut, eIn, P } from '../stage/motion';
import { maskText, setType, measure, fitPx } from '../stage/type';
import { lerp } from '../engine/util';
import { FOV, SET_Y, SET_X, v3 } from './layout';
import { LIN } from '../engine/palette';

const [T0, T1] = CH.bukti;
const [N1, N2] = CUE.num7 as [number, number];
const [K1, K2] = CUE.kv7 as [number, number];
const WIPE = CUE.wipe;
const O = v3(SET_X, SET_Y.bukti, 0);
const DIST = 20;

// the wall: a radial blue gradient (ellipse at 30 % / 20 %), unlit, below the bloom threshold
const wall = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShaderMaterial({
  uniforms: { c0: { value: new THREE.Vector3(...LIN.blue) }, c1: { value: new THREE.Vector3(...LIN.blue2) }, c2: { value: new THREE.Vector3(...LIN.deep) }, aspect: { value: FW / FH } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 c0, c1, c2; varying vec2 vUv;
    void main(){ vec2 d = (vUv - vec2(0.42, 0.62)) / vec2(0.34, 0.3); float r = length(d);
      vec3 c = mix(c0, c1, smoothstep(0.0, 0.45, r)); c = mix(c, c2, smoothstep(0.45, 1.0, r)); gl_FragColor = vec4(c * 0.95, 1.0); }`,
}));

function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  const k = P(t, T0, T1 - T0);
  return { look: O.clone(), dist: DIST - 1.4 * eOut(k), yaw: lerp(-3.5, 3.5, k), pitch: lerp(1.5, -1.5, k), fov: FOV, ap: 0 };
}

/** Odometer: digits roll up to `target` (each column adds whole turns, the leftmost the fewest). */
function odometer(c: CanvasRenderingContext2D, target: string, suffix: string, x: number, y: number, px: number, t0: number, t: number, sufColor = '#F5F5F5') {
  setType(c, px, 780, -0.05);
  const dw = measure(c, '0') * 1.02;
  const digits = target.split('').map(Number);
  c.save();
  c.beginPath(); c.rect(x - px * 0.1, y - px * 0.82, dw * digits.length + px, px * 1.02); c.clip();
  digits.forEach((d, i) => {
    const turns = (digits.length - i) * 1;
    const v = (d + 10 * turns) * eOut(P(t, t0 + i * 0.06, 1.25));
    const lo = Math.floor(v), f = v - lo;
    c.fillStyle = '#F5F5F5';
    c.fillText(String(lo % 10), x + i * dw, y - f * px * 0.98);
    c.fillText(String((lo + 1) % 10), x + i * dw, y + (1 - f) * px * 0.98);
  });
  c.restore();
  const sp = eOut(P(t, t0 + 0.9, 0.5));
  if (sp > 0) { c.save(); c.globalAlpha = sp; setType(c, px, 780, -0.05); c.fillStyle = sufColor; c.fillText(suffix, x + digits.length * dw + (1 - sp) * 30, y); c.restore(); }
}

function update(t: number, w: World, f: FrameOut) {
  const on = t >= T0 - 0.05 && t < T1 + 0.05;
  wall.visible = on;
  if (!on) return;
  const c = f.c;
  // stats: numbers at z = +1.2 in front of their labels (z = 0), anchored in the world → parallax
  const statOut = P(t, K1 - 0.35, 0.25);
  const stats: [string, string, number, string][] = [['80', '+', N1, TX.stats[0]!], ['98', '%', N2, TX.stats[1]!]];
  stats.forEach(([n, suf, t0, lab], i) => {
    const nx = V ? -3.2 : (i === 0 ? -7.4 : 0.4), ny = V ? (i === 0 ? 1.95 : -1.45) : -0.2;
    const a = w.project(O.clone().add(v3(nx, ny, 1.2)));
    const b = w.project(O.clone().add(v3(nx + 0.08, ny - pick(0.95, 1.3), 0)));
    const px = pick(1.87, 2.8) * a.k;
    if (statOut < 1 && t >= t0 - 0.02) {
      c.save();
      // the number rises from the mask on its beat, and leaves upward before the key values
      c.beginPath(); c.rect(0, a.y - px * 0.85 - 4, FW, px * 1.3); c.clip();
      c.translate(0, (1 - eOut(P(t, t0 - 0.02, 0.5))) * px * 1.2 - eIn(statOut) * px * 1.3);
      odometer(c, n, suf, a.x, a.y, px, t0, t);
      c.restore();
      maskText(c, lab, b.x, b.y, pick(0.32, 0.41) * b.k, P(t, t0 + 0.35, 0.7), statOut, { weight: 550, trackEm: -0.02, color: 'rgba(255,255,255,0.82)' });
    }
  });
  // key values, one at a time; weight rises with the reveal like the old film
  const kv: [string, number, number][] = [[TX.kv[0]!, K1, K2 - 0.25], [TX.kv[1]!, K2, Infinity]];
  kv.forEach(([s, a0, a1]) => {
    const p = w.project(O.clone().add(v3(0, -0.4, 0.6)));
    const px = fitPx(c, s, pick(0.8, 1.55) * p.k, FW * 0.88, 780, -0.05);
    const wt = lerp(300, 780, eOut(P(t, a0, 0.8)));
    maskText(c, s, FW / 2, p.y, px, P(t, a0, 0.7), P(t, a1, 0.24), { align: 'center', weight: Math.round(wt), trackEm: -0.05 });
  });
  // arrowhead wipe to black, glowing edge
  const wp = P(t, WIPE, T1 - WIPE);
  if (wp > 0) {
    const A = FH * 0.55;
    const X = lerp(-0.1 * FW, FW + A + 40, eIn(wp) * 0.6 + wp * 0.4);
    c.save();
    c.beginPath(); c.moveTo(-20, -20); c.lineTo(X - A, -20); c.lineTo(X, FH / 2); c.lineTo(X - A, FH + 20); c.lineTo(-20, FH + 20); c.closePath();
    c.fillStyle = '#000'; c.fill();
    c.beginPath(); c.moveTo(X - A, -20); c.lineTo(X, FH / 2); c.lineTo(X - A, FH + 20);
    c.shadowColor = 'rgba(59,130,246,0.95)'; c.shadowBlur = 22; c.lineWidth = 7; c.lineJoin = 'miter'; c.strokeStyle = '#DBEAFE'; c.stroke();
    c.restore();
  }
  f.post.vignette = 0.3;
}

const s7: Chapter = {
  init(w) {
    wall.position.copy(O).add(v3(0, 0, -6));
    w.scene.add(wall);
  },
  update,
  shot,
};
export default s7;
