// S8: the last page. Its caption prints on it ("Tinggal satu yang belum bergerak: / brand-mu."), then it folds
// itself into a dart, one crease per beat (12 fps), and takes off at the full 60 fps — the only smooth thing in the
// paper world — to punch through the board into the dark.
// Folding: every vertex of the flat sheet is carried through the creases in order. Folds 1–2 are flat (180°)
// reflections animated as rotations about the crease lines; fold 3 raises both halves into a V about the centre
// line; fold 4 turns the wings back out to level. Layers keep a small gap so nothing z-fights.
import { T } from '../copy';
import * as THREE from 'three';
import { InkCanvas } from '../paper/ink';
import { paperMaterial } from '../paper/material';
import { printLine, printKey } from '../paper/type';
import { makeTape, placeTape } from '../paper/sheet';
import { monoFont } from '../fonts';
import { PAGE, HOLE, rw, rh } from '../layout';
import { CUE, cap } from '../cues';
import { clamp, ease } from '../engine/util';

const K = CUE.kosong;
export const LEN = rw(PAGE), WID = rh(PAGE); // 210 (nose along +x) × 148
const HALF = WID / 2;
const B = 19;               // wing crease: distance from the keel
const PHI = THREE.MathUtils.degToRad(80); // how far each half rises (the V)
const FOLD_DUR = 0.25;      // three steps per crease
const Z0 = 0.35;

type V2 = [number, number];
const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
const cross2 = (a: V2, b: V2) => a[0] * b[1] - a[1] * b[0];
function reflect(p: V2, a: V2, d: V2): V2 {
  const v = sub(p, a), t = v[0] * d[0] + v[1] * d[1];
  const pr: V2 = [a[0] + d[0] * t, a[1] + d[1] * t];
  return [2 * pr[0] - p[0], 2 * pr[1] - p[1]];
}
const norm = (v: V2): V2 => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };

// creases (page-local: x 0..LEN from tail to nose, y −HALF..HALF), per side s = ±1
const NOSE: V2 = [LEN, 0];
const c1 = (s: number) => ({ a: NOSE, d: norm([-HALF, s * HALF]) });
const c2 = (s: number) => ({ a: NOSE, d: norm([-1 - Math.SQRT1_2, s * Math.SQRT1_2]) });

/** Fold progress 0..1 of crease k at paper time ts (stop-motion: 3 steps). */
const foldK = (t0: number, ts: number) => ease.inOutQuad(clamp((ts - t0) / FOLD_DUR));

// ---------------------------------------------------------------- flight (60 fps, continuous t)
// the path is the plane's CENTRE: it starts level (slides off the page, lifts), climbs toward the camera, and turns
// down so that the nose meets the board at HOLE exactly at `tembus`
const P0 = new THREE.Vector3(PAGE.x0 + LEN / 2, PAGE.y0 + WID / 2, Z0);
const P1 = new THREE.Vector3(P0.x + 190, P0.y + 36, Z0 + 4);
const P2 = new THREE.Vector3(HOLE.x - 40, HOLE.y + 30, 360);
const P3 = new THREE.Vector3(HOLE.x, HOLE.y, LEN / 2);
function bez3(u: number) {
  const a = 1 - u;
  const p = P0.clone().multiplyScalar(a * a * a).addScaledVector(P1, 3 * a * a * u).addScaledVector(P2, 3 * a * u * u).addScaledVector(P3, u * u * u);
  const d = P1.clone().sub(P0).multiplyScalar(3 * a * a).addScaledVector(P2.clone().sub(P1), 6 * a * u).addScaledVector(P3.clone().sub(P2), 3 * u * u);
  return { p, d };
}
/** The plane's pose at film time t (null before take-off). Eases out of rest, accelerates into the board. */
export function flightPose(t: number) {
  if (t < K.terbang) return null;
  const T = K.tembus - K.terbang;
  const s = (t - K.terbang) / T;
  let p: THREE.Vector3, f: THREE.Vector3;
  if (s <= 1) {
    const u = s * s * (1.35 - 0.35 * s); // leaves gently, arrives fast
    const b = bez3(u);
    p = b.p; f = b.d.normalize();
  } else {
    const b = bez3(1);
    f = b.d.normalize();
    p = b.p.addScaledVector(f, (s - 1) * T * 460);
  }
  const up0 = Math.abs(f.z) > 0.92 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
  const y = up0.clone().cross(f).normalize(), z = f.clone().cross(y).normalize();
  // a little bank into the turn
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(f, y, z));
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35 * Math.sin(Math.PI * Math.min(1, s))));
  return { p, q, nose: p.clone().addScaledVector(f, LEN / 2) };
}

export class PaperPlane {
  group = new THREE.Group();
  fixed = new THREE.Group();
  geo: THREE.PlaneGeometry;
  ink = new InkCanvas(LEN, WID, 4, 1);
  front: THREE.Mesh;
  back: THREE.Mesh;
  /** per vertex: flat position, flap flags and the flat-folded (after folds 1–2) position + layer height */
  flat: Float32Array;
  f1: Int8Array;
  f2: Int8Array;
  q2: Float32Array;
  constructor() {
    this.geo = new THREE.PlaneGeometry(LEN, WID, 96, 68);
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    const n = pos.count;
    this.flat = new Float32Array(n * 2);
    this.f1 = new Int8Array(n);
    this.f2 = new Int8Array(n);
    this.q2 = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p: V2 = [pos.getX(i) + LEN / 2, pos.getY(i)];
      this.flat[2 * i] = p[0]; this.flat[2 * i + 1] = p[1];
      const s = p[1] >= 0 ? 1 : -1;
      let q: V2 = p, z = 0;
      // fold 1: the corner beyond crease 1 (away from the keel)
      const k1 = c1(s);
      if (s * cross2(k1.d, sub(p, k1.a)) < 0) { q = reflect(p, k1.a, k1.d); z = 0.3; this.f1[i] = s; }
      // fold 2: everything beyond crease 2, after fold 1
      const k2 = c2(s);
      if (s * cross2(k2.d, sub(q, k2.a)) < 0) { q = reflect(q, k2.a, k2.d); z = 0.9 - z; this.f2[i] = s; }
      this.q2[3 * i] = q[0]; this.q2[3 * i + 1] = q[1]; this.q2[3 * i + 2] = z;
    }
    const mat = paperMaterial({ size: [LEN, WID], paper: [0.95, 0.94, 0.9], inks: this.ink, cell: 3.5, seed: 131, fiber: 0.9, side: THREE.FrontSide, mis: [[0.5, -0.3], [-0.4, 0.4], [0, 0], [0.3, -0.2]] });
    const back = paperMaterial({ size: [LEN, WID], paper: [0.93, 0.92, 0.88], seed: 132, fiber: 0.9, side: THREE.BackSide });
    this.front = new THREE.Mesh(this.geo, mat);
    this.back = new THREE.Mesh(this.geo, back);
    for (const m of [this.front, this.back]) { m.castShadow = true; m.receiveShadow = true; this.group.add(m); }
    this.fixed.add(placeTape(makeTape(120, 20, 14.1, { s: T.tape7, font: monoFont(7.2, true), px: 7.2 }), PAGE.x0 + 58, PAGE.y0 - 22, 0.2, -2));
  }

  /** The page print: the caption, two lines, the second one at its own cue. */
  private drawPrint(ts: number) {
    const a1 = ts - cap('tinggal').t, a2 = ts - cap('brand').t;
    this.ink.draw(printKey(T.page[0]!, a1, 30) + '|' + printKey(T.page[1]!, a1 - 0.25, 30) + '|' + printKey(T.brand, a2, 14), (k) => {
      printLine(k, T.page[0]!, 14, 34, a1, { px: 21, wght: 820, wdth: 90, maxW: LEN - 28, cps: 30 });
      printLine(k, T.page[1]!, 14, 58, a1 - 0.25, { px: 21, wght: 820, wdth: 90, maxW: LEN - 28, cps: 30 });
      printLine(k, T.brand, 14, 118, a2, { px: 52, wght: 900, wdth: 108, maxW: LEN - 28, ink: 'pink', cps: 14 });
      k.paint('solid', 'black', 0.8, (c) => {
        c.lineWidth = 0.5; c.setLineDash([2, 2]);
        c.beginPath(); c.moveTo(6, WID / 2); c.lineTo(LEN - 6, WID / 2); c.stroke();
      });
    });
  }

  /** Fold the sheet at paper time ts; returns the plane's local frame (nose +x, keel on z = 0). */
  fold(ts: number) {
    const t1 = foldK(K.lipat1, ts), t2 = foldK(K.lipat2, ts), t3 = foldK(K.lipat3, ts), t4 = foldK(K.lipat4, ts);
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3(), ax = new THREE.Vector3(), q = new THREE.Quaternion();
    const rotAbout = (p: THREE.Vector3, a: V2, d: V2, h: number, ang: number) => {
      ax.set(d[0], d[1], 0);
      q.setFromAxisAngle(ax, ang);
      p.x -= a[0]; p.y -= a[1]; p.z -= h;
      p.applyQuaternion(q);
      p.x += a[0]; p.y += a[1]; p.z += h;
    };
    for (let i = 0; i < pos.count; i++) {
      if (t3 <= 0 && t4 <= 0) {
        v.set(this.flat[2 * i]!, this.flat[2 * i + 1]!, 0);
        const s1 = this.f1[i]!, s2 = this.f2[i]!;
        // flaps go up and over: the sign makes the flap pass through +z
        if (s1) { const k = c1(s1); rotAbout(v, k.a, k.d, 0.15, -s1 * Math.PI * t1); }
        if (s2) { const k = c2(s2); rotAbout(v, k.a, k.d, 0.45, -s2 * Math.PI * t2); }
      } else {
        const x = this.q2[3 * i]!, y = this.q2[3 * i + 1]!, z = this.q2[3 * i + 2]!;
        const s = y >= 0 ? 1 : -1, ay = Math.abs(y);
        // in the half's own frame: (across = distance from the keel, up = layer height)
        let across = ay, up = z;
        if (ay > B && t4 > 0) {
          const w = ay - B, ang = PHI * t4;
          across = B + w * Math.cos(ang) + z * Math.sin(ang);
          up = -w * Math.sin(ang) + z * Math.cos(ang);
        }
        const ph = PHI * t3;
        // raise the half about the keel: across → (y, z)
        v.set(x, s * (across * Math.cos(ph) - up * Math.sin(ph)), across * Math.sin(ph) + up * Math.cos(ph));
      }
      pos.setXYZ(i, v.x - LEN / 2, v.y, v.z);
    }
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
  }

  update(ts: number, flight: { p: THREE.Vector3; q: THREE.Quaternion } | null) {
    this.drawPrint(ts);
    this.fold(ts);
    if (!flight) {
      this.group.position.set(PAGE.x0 + LEN / 2, PAGE.y0 + WID / 2, Z0);
      this.group.quaternion.identity();
    } else {
      // the folded plane's own origin is the page centre: put its keel centre on the flight point
      this.group.position.copy(flight.p);
      this.group.quaternion.copy(flight.q);
    }
    this.front.visible = this.back.visible = true;
  }
}
