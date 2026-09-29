// The kampung up close (S3 out of the window, S4 down the cable street, S8 the dive home): what makes these
// roofs Jakarta and not anywhere. Concrete power poles at every street lamp (the lamps hang off them), their
// wires sagging pole to pole with the service drops to the houses and the odd coil of spare cable, frozen
// drops beaded along the wires where a lamp catches them; water tanks on steel stands over the ridges; dishes
// aimed where the satellites really are from here (Telkom-4 at 108° E: almost straight up; MEASAT-3 at
// 91.5° E: low in the west-northwest); outdoor AC units on the walls, a drip stain under each; front walls
// with steel gates; washing on the lines, frozen. Only where the camera comes close (elsewhere it would all be
// smaller than a pixel); drawn from its own random stream, so the city keeps its layout.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../engine/util';

export interface House { x: number; z: number; w: number; d: number; h: number; ry: number; gx: number; gz: number; color: THREE.Color }
/** a street lamp: where its light is, and whether its street runs north–south (x constant) */
export interface Lamp { x: number; z: number; ns: boolean; x0: number; z0: number }

export interface DetailKit {
  scene: THREE.Scene;
  /** an outdoor material lit the city's way (lamps' pools, the overcast) */
  mat: (color: number, rough: number, metal: number, lampE: number, envK: number, opts?: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  /** the wires: ribbons at least a pixel wide (see city.ts) */
  wires: (segs: number[], rad: number[]) => THREE.Object3D;
  /** a lamp's LED face */
  face: THREE.Material;
  /** lamp light (relative) at a point, from the lamps near it */
  lampAt: (x: number, y: number, z: number) => number;
  /** frozen drops (light points): positions, colours, radii */
  beads: (p: number[], c: number[], r: number[]) => void;
  warm: [number, number, number];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const POLE_H = 9.0, ARM_Y = 8.35, LAMP_Y = 6.2;

/** Is (x, z) somewhere the camera passes close by? */
export const nearCamera = (x: number, z: number, tower: THREE.Vector3) =>
  Math.hypot(x, z) < 280 || (x > -300 && x < -100 && z > -1880 && z < -1200) || Math.hypot(x - tower.x, z - tower.z) < 140;

/** Unit-less helpers: world matrix from position, yaw and scale. */
const M = (x: number, y: number, z: number, ry = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(...s));

function instanced(kit: DetailKit, g: THREE.BufferGeometry, m: THREE.Material, mats: THREE.Matrix4[], cols?: THREE.Color[]) {
  if (!mats.length) return;
  const im = new THREE.InstancedMesh(g, m, mats.length);
  mats.forEach((mm, i) => { im.setMatrixAt(i, mm); if (cols) im.setColorAt(i, cols[i]!); });
  kit.scene.add(im);
}

/** A satellite dish: a shallow paraboloid (unit diameter, facing +y), the LNB on its arm, on a short mast. */
function dishGeometry() {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) { const r = 0.5 * (i / 10); pts.push(new THREE.Vector2(r, (r * r) / (4 * 0.32))); }
  const bowl = new THREE.LatheGeometry(pts, 20);
  const arm = new THREE.BoxGeometry(0.025, 0.36, 0.025).translate(0, 0.2, -0.22).rotateX(-0.55);
  const lnb = new THREE.CylinderGeometry(0.035, 0.03, 0.12, 8).translate(0, 0.33, 0);
  return mergeGeometries([bowl, arm, lnb]);
}

/** A plastic water tank: a cylinder with a domed lid (1 m across, 1.25 m tall), base at y 0. */
function tankGeometry() {
  return mergeGeometries([
    new THREE.CylinderGeometry(0.5, 0.48, 1.05, 18).translate(0, 0.525, 0),
    new THREE.SphereGeometry(0.5, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.4, 1).translate(0, 1.05, 0),
    new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12).translate(0, 1.27, 0),
    // the moulded rings
    new THREE.TorusGeometry(0.5, 0.018, 5, 18).rotateX(Math.PI / 2).translate(0, 0.35, 0),
    new THREE.TorusGeometry(0.5, 0.018, 5, 18).rotateX(Math.PI / 2).translate(0, 0.7, 0),
  ]);
}

/** Its steel stand: four angle-iron legs with braces, 1.3 m tall, top at y 1.3. */
function standGeometry() {
  const g: THREE.BufferGeometry[] = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) g.push(new THREE.BoxGeometry(0.05, 1.3, 0.05).translate(sx * 0.42, 0.65, sz * 0.42));
  for (const y of [0.45, 1.28]) {
    g.push(new THREE.BoxGeometry(0.9, 0.04, 0.04).translate(0, y, -0.42), new THREE.BoxGeometry(0.9, 0.04, 0.04).translate(0, y, 0.42));
    g.push(new THREE.BoxGeometry(0.04, 0.04, 0.9).translate(-0.42, y, 0), new THREE.BoxGeometry(0.04, 0.04, 0.9).translate(0.42, y, 0));
  }
  return mergeGeometries(g);
}

/** An outdoor AC unit on its bracket (0.8 × 0.55 × 0.28 m), back against the wall at z 0, facing +z. */
function acGeometry() {
  return mergeGeometries([
    new THREE.BoxGeometry(0.8, 0.55, 0.28).translate(0, 0, 0.19),
    new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20).rotateX(Math.PI / 2).translate(-0.12, 0, 0.335),   // fan grille
    new THREE.BoxGeometry(0.04, 0.04, 0.36).translate(-0.3, -0.3, 0.18), new THREE.BoxGeometry(0.04, 0.04, 0.36).translate(0.3, -0.3, 0.18),
  ]);
}

/** A steel gate's bars (a texture: vertical bars, a rail top and bottom) for an alpha-tested panel. */
function gateBars() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const x = c.getContext('2d')!;
  x.clearRect(0, 0, 128, 64); x.fillStyle = '#fff';
  for (let i = 0; i < 128; i += 8) x.fillRect(i, 0, 2, 64);
  x.fillRect(0, 0, 128, 4); x.fillRect(0, 60, 128, 4); x.fillRect(0, 30, 128, 3);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}

/** A catenary (parabola) between a and b sagging by `sag`, as segments [ax, ay, az, bx, by, bz, ...]. */
function hang(out: number[], a: THREE.Vector3, b: THREE.Vector3, sag: number, n = 12) {
  let px = a.x, py = a.y, pz = a.z;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u - 4 * sag * u * (1 - u), z = a.z + (b.z - a.z) * u;
    out.push(px, py, pz, x, y, z);
    px = x; py = y; pz = z;
  }
}

export function buildKampungDetail(kit: DetailKit, houses: House[], lamps: Lamp[], near: (x: number, z: number) => boolean) {
  const rnd = mulberry32(41);
  const R = (a: number, b: number) => a + (b - a) * rnd();
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;

  // ── poles at the lamps, the lamps' heads, the wires
  const poleMats: THREE.Matrix4[] = [], armMats: THREE.Matrix4[] = [], headMats: THREE.Matrix4[] = [], faceMats: THREE.Matrix4[] = [], crossMats: THREE.Matrix4[] = [];
  type Pole = { x: number; z: number; ns: boolean; line: number; along: number };
  const poles: Pole[] = [];
  for (const l of lamps) {
    if (!near(l.x, l.z)) continue;
    // the pole stands at the kerb, the lamp's arm reaching out over the street to the head
    const px = l.ns ? l.x0 + 4.5 : l.x, pz = l.ns ? l.z : l.z0 + 4.5;
    poles.push({ x: px, z: pz, ns: l.ns, line: l.ns ? l.x0 : l.z0, along: l.ns ? pz : px });
    poleMats.push(M(px, 0, pz));
    const ry = l.ns ? 0 : Math.PI / 2;            // arm along −x (ns) or −z (ew)
    armMats.push(M((px + l.x) / 2, LAMP_Y + 0.28, (pz + l.z) / 2, ry, [Math.hypot(px - l.x, pz - l.z), 1, 1]));
    headMats.push(M(l.x, LAMP_Y + 0.13, l.z, ry)); faceMats.push(M(l.x, LAMP_Y + 0.08, l.z, ry));
    crossMats.push(M(px, ARM_Y, pz, ry + Math.PI / 2));
  }
  const concrete = kit.mat(0x8f8b84, 0.85, 0, 6.0, 0.4);
  const steelDark = kit.mat(0x3c3e42, 0.45, 0.7, 3.0, 1.2);
  instanced(kit, new THREE.CylinderGeometry(0.1, 0.16, POLE_H, 10).translate(0, POLE_H / 2, 0), concrete, poleMats);
  instanced(kit, new THREE.CylinderGeometry(0.03, 0.03, 1, 6).rotateZ(Math.PI / 2), steelDark, armMats);
  instanced(kit, new THREE.BoxGeometry(0.5, 0.1, 0.22), steelDark, headMats);
  instanced(kit, new THREE.PlaneGeometry(0.4, 0.15).rotateX(Math.PI / 2), kit.face, faceMats);
  instanced(kit, new THREE.BoxGeometry(1.3, 0.07, 0.07), steelDark, crossMats);

  const segs: number[] = [], rads: number[] = [];
  const wire = (a: THREE.Vector3, b: THREE.Vector3, sag: number, r: number, n = 12) => {
    const k = segs.length; hang(segs, a, b, sag, n);
    for (let i = k; i < segs.length; i += 6) rads.push(r);
  };
  // pole to pole along each street: three phase wires on the crossarm, the twisted service bundle below
  // it, a fat telecom bundle lower still (sagging most)
  const lines = new Map<string, Pole[]>();
  for (const p of poles) { const key = `${p.ns ? 'n' : 'e'}${p.line}`; (lines.get(key) ?? lines.set(key, []).get(key)!).push(p); }
  const coils: THREE.Matrix4[] = [];
  for (const ps of lines.values()) {
    ps.sort((a, b) => a.along - b.along);
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i]!, b = ps[i + 1]!, L = b.along - a.along;
      if (L > 48) continue;
      const across = (p: Pole, o: number) => (p.ns ? V(p.x + o, 0, p.z) : V(p.x, 0, p.z + o));
      for (const o of [-0.55, 0, 0.55]) wire(across(a, o).setY(ARM_Y + 0.05), across(b, o).setY(ARM_Y + 0.05), 0.012 * L + R(0, 0.1), 0.007);
      wire(across(a, -0.18).setY(7.6), across(b, -0.18).setY(7.6), 0.018 * L + R(0.05, 0.25), 0.018);
      const nTel = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < nTel; k++) wire(across(a, 0.15 + k * 0.07).setY(6.9 - k * 0.12), across(b, 0.15 + k * 0.07).setY(6.9 - k * 0.12), 0.03 * L + R(0.1, 0.5), R(0.008, 0.02));
    }
    // spare cable coiled on some poles: two or three loose loops hung together, tipped every which way
    for (const p of ps) {
      if (rnd() > 0.35) continue;
      const y = R(6.2, 7.2), n = 2 + Math.floor(rnd() * 2);
      for (let k = 0; k < n; k++) coils.push(new THREE.Matrix4().compose(V(p.x + (p.ns ? 0.2 : 0) + R(-0.04, 0.04), y - R(0, 0.15), p.z + (p.ns ? 0 : 0.2) + R(-0.04, 0.04)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(R(-0.9, 0.9), (p.ns ? 0 : Math.PI / 2) + R(-0.4, 0.4), R(-0.5, 0.5))), V(1, R(0.8, 1.3), 1).multiplyScalar(R(0.7, 1.1))));
    }
  }
  instanced(kit, new THREE.TorusGeometry(0.17, 0.018, 5, 16), kit.mat(0x141414, 0.35, 0, 2.0, 1.5), coils);

  // ── the houses
  const tankM: THREE.Matrix4[] = [], tankC: THREE.Color[] = [], standM: THREE.Matrix4[] = [];
  const dishM: THREE.Matrix4[] = [], mastM: THREE.Matrix4[] = [];
  const acM: THREE.Matrix4[] = [], stainM: THREE.Matrix4[] = [];
  const wallM: THREE.Matrix4[] = [], wallC: THREE.Color[] = [], gateM: THREE.Matrix4[] = [], gateC: THREE.Color[] = [];
  const clothP: number[] = [], clothN: number[] = [], clothCol: number[] = [];
  const TANKS = [0xc26f35, 0xb8672f, 0x3f6f9f, 0x9ea3a6, 0xcbbd98, 0xd0d2d0].map((c) => new THREE.Color(c));
  const GATES = [0x2f4a36, 0x1c1c1c, 0x3a3f4a, 0x5a2a22, 0x6e6a60].map((c) => new THREE.Color(c));
  const CLOTH = [0x8a3b3b, 0x3b5a8a, 0xd6d0bd, 0x6b7a3b, 0xc2a24e, 0x5a3f6b, 0x2f6b62, 0x7a5a3a, 0xb9b3a6, 0x9c4f6a].map((c) => new THREE.Color(c));
  // where the satellites are from Jakarta (6.2° S, 106.8° E): unit direction (x east, y up, −z north)
  const aim = (azDeg: number, elDeg: number) => { const a = (azDeg * Math.PI) / 180, e = (elDeg * Math.PI) / 180; return V(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };
  const TELKOM4 = aim(11, 82.6), MEASAT3 = aim(291.5, 70.6);

  const streetMod = (g: number, m: number) => ((g % m) + m) % m === 0;
  for (const hs of houses) {
    if (!near(hs.x, hs.z)) continue;
    const c = Math.cos(hs.ry), s = Math.sin(hs.ry);
    // local (u along w, v along d) -> world
    const W = (u: number, y: number, v: number) => V(hs.x + c * u + s * v, y, hs.z - s * u + c * v);
    const rise = 0.378 * hs.w, ridgeY = hs.h + rise;
    const roofAt = (u: number) => hs.h + rise * Math.max(0, 1 - Math.abs(u) / (0.56 * hs.w));

    // a water tank on its stand, straddling the ridge
    if (rnd() < 0.38) {
      const v = R(-0.3, 0.3) * hs.d, p = W(0, ridgeY - 0.25, v), yaw = hs.ry + R(-0.3, 0.3);
      standM.push(M(p.x, p.y, p.z, yaw));
      tankM.push(M(p.x, p.y + 1.3, p.z, yaw, [1, 1, 1].map(() => R(0.85, 1.15)) as [number, number, number]));
      tankC.push(pick(TANKS).clone().multiplyScalar(R(0.75, 1.0)));
    }
    // a dish on a mast off one slope
    if (rnd() < 0.17) {
      const u = R(0.15, 0.35) * hs.w * (rnd() < 0.5 ? -1 : 1), v = R(-0.35, 0.35) * hs.d, top = roofAt(u) + R(0.7, 1.2);
      const p = W(u, top, v), dir = (rnd() < 0.65 ? TELKOM4 : MEASAT3).clone();
      const size = rnd() < 0.3 ? R(1.6, 2.2) : R(0.75, 1.0);
      dishM.push(new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir), V(size, size, size)));
      mastM.push(M(p.x, (roofAt(u) + top) / 2 - 0.1, p.z, 0, [1, top - roofAt(u) + 0.2, 1]));
    }
    // which of its sides face a street (the fence, the AC, the washing go there)
    const sides: [number, number][] = [];              // local outward normal (nu, nv)
    const gxS = [streetMod(hs.gx - 1, 6), streetMod(hs.gx + 1, 6)], gzS = [streetMod(hs.gz - 1, 7), streetMod(hs.gz + 1, 7)];
    const toLocal = (wx: number, wz: number): [number, number] => [c * wx - s * wz, s * wx + c * wz];
    if (gxS[0]) sides.push(toLocal(-1, 0)); if (gxS[1]) sides.push(toLocal(1, 0));
    if (gzS[0]) sides.push(toLocal(0, -1)); if (gzS[1]) sides.push(toLocal(0, 1));
    const [nu, nv] = sides.length ? sides[0]! : rnd() < 0.5 ? [0, 1] : [1, 0];
    const half = Math.abs(nu) > 0.5 ? hs.w / 2 : hs.d / 2, span = Math.abs(nu) > 0.5 ? hs.d : hs.w;
    const faceYaw = Math.atan2(c * nu + s * nv, -s * nu + c * nv);   // world yaw that turns +z to the outward normal
    // an AC unit on that wall (or another), a drip stain running down under it
    if (rnd() < 0.42) {
      const along = R(-0.35, 0.35) * span, y = Math.min(hs.h - 0.6, R(2.1, 2.8) + (hs.h > 6 && rnd() < 0.5 ? 3 : 0));
      const onU = Math.abs(nu) > 0.5;
      const p = W(onU ? nu * half : along, y, onU ? along : nv * half);
      acM.push(M(p.x, p.y, p.z, faceYaw));
      const sp = W(onU ? nu * (half + 0.012) : along - 0.25, y / 2 - 0.1, onU ? along - 0.25 : nv * (half + 0.012));
      stainM.push(M(sp.x, sp.y, sp.z, faceYaw, [R(0.12, 0.3), y - 0.3, 1]));
    }
    // a front wall with a steel gate, where there is room between the house and the street
    if (sides.length) {
      const wx = c * nu + s * nv, wz = -s * nu + c * nv;              // outward, world
      const faceW = (Math.abs(wx) > 0.5 ? hs.x : hs.z) + (Math.abs(wx) > 0.5 ? wx : wz) * half;
      const streetEdge = Math.abs(wx) > 0.5 ? hs.gx * 10.5 + Math.sign(wx) * 5.25 : hs.gz * 10.5 + Math.sign(wz) * 5.25;
      const gap = (streetEdge - faceW) * Math.sign(Math.abs(wx) > 0.5 ? wx : wz);
      if (gap > 0.7) {
        const d = half + gap - 0.1, gw = R(1.8, 3.0), off = R(-0.25, 0.25) * span;
        const wallLen = (span - gw) / 2;
        const colW = hs.color.clone().multiplyScalar(R(0.8, 1.0));
        for (const sgn of [-1, 1]) {
          const mid = sgn * (gw / 2 + wallLen / 2) + off * 0;
          const p = W(Math.abs(nu) > 0.5 ? nu * d : mid, 0.55, Math.abs(nu) > 0.5 ? mid : nv * d);
          wallM.push(M(p.x, p.y, p.z, faceYaw, [wallLen, 1.1, 0.15])); wallC.push(colW);
        }
        const gp = W(Math.abs(nu) > 0.5 ? nu * d : 0, 0.8, Math.abs(nu) > 0.5 ? 0 : nv * d);
        gateM.push(M(gp.x, gp.y, gp.z, faceYaw, [gw, 1.6, 1])); gateC.push(pick(GATES));
        // washing on a line between the gate post and the house, in the front yard
        if (rnd() < 0.3 && gap > 1.4) {
          const dd = half + gap * 0.5, a = R(-0.45, -0.1) * span, b = a + R(2.2, 3.6);
          const pa = W(Math.abs(nu) > 0.5 ? nu * dd : a, 2.05, Math.abs(nu) > 0.5 ? a : nv * dd), pb = W(Math.abs(nu) > 0.5 ? nu * dd : b, 2.05, Math.abs(nu) > 0.5 ? b : nv * dd);
          kitWire(pa, pb);
          let u = 0.1;
          while (u < 0.9) {
            const cw = R(0.35, 0.8) / pa.distanceTo(pb), ch = R(0.45, 1.05);
            if (u + cw > 0.95) break;
            const q0 = pa.clone().lerp(pb, u), q1 = pa.clone().lerp(pb, u + cw);
            const sagY = (uu: number) => -4 * 0.08 * uu * (1 - uu);
            q0.y += sagY(u); q1.y += sagY(u + cw);
            const col = pick(CLOTH).clone().multiplyScalar(R(0.6, 0.95));
            // a garment hangs from two pegs, bellied a little (two quads, the lower edge swung out)
            const sw = V(wx, 0, wz).multiplyScalar(R(-0.06, 0.06));
            const b0 = q0.clone().add(V(0, -ch, 0)).add(sw), b1 = q1.clone().add(V(0, -ch * R(0.9, 1.05), 0)).add(sw);
            const m0 = q0.clone().lerp(b0, 0.5).add(V(wx, 0, wz).multiplyScalar(0.03)), m1 = q1.clone().lerp(b1, 0.5).add(V(wx, 0, wz).multiplyScalar(0.03));
            for (const [A, B, C, D] of [[q0, q1, m1, m0], [m0, m1, b1, b0]] as const) {
              clothP.push(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, A.x, A.y, A.z, C.x, C.y, C.z, D.x, D.y, D.z);
              for (let k = 0; k < 6; k++) { clothN.push(wx, 0, wz); clothCol.push(col.r, col.g, col.b); }
            }
            u += cw + R(0.03, 0.12);
          }
        }
      }
    }
    // a service drop from the nearest pole on its street (if one is close)
    if (sides.length && rnd() < 0.7) {
      let best: Pole | null = null, bd = 16;
      for (const p of poles) { const dd = Math.hypot(p.x - hs.x, p.z - hs.z); if (dd < bd) { bd = dd; best = p; } }
      if (best) {
        const wx = c * nu + s * nv, wz = -s * nu + c * nv;
        const at = V(hs.x + wx * half + R(-1, 1) * (1 - Math.abs(wx)), Math.min(hs.h - 0.25, 3.2), hs.z + wz * half + R(-1, 1) * (1 - Math.abs(wz)));
        wire(V(best.x, 7.4, best.z), at, R(0.25, 0.6), 0.005, 10);
      }
    }
  }
  function kitWire(a: THREE.Vector3, b: THREE.Vector3) { wire(a, b, 0.08, 0.003, 6); }

  const plastic = kit.mat(0xffffff, 0.5, 0, 4.0, 0.9);
  instanced(kit, tankGeometry(), plastic, tankM, tankC);
  instanced(kit, standGeometry(), steelDark, standM);
  instanced(kit, dishGeometry(), kit.mat(0xb9bbb8, 0.45, 0.4, 4.0, 1.2, { side: THREE.DoubleSide }), dishM);
  instanced(kit, new THREE.CylinderGeometry(0.03, 0.03, 1, 6), steelDark, mastM);
  instanced(kit, acGeometry(), kit.mat(0xc9c9c4, 0.55, 0.1, 6.0, 0.8), acM);
  instanced(kit, new THREE.PlaneGeometry(1, 1), kit.mat(0x000000, 0.9, 0, 0, 0, { transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), stainM);
  instanced(kit, new THREE.BoxGeometry(1, 1, 1), kit.mat(0xffffff, 0.85, 0, 9.0, 0.45), wallM, wallC);
  instanced(kit, new THREE.PlaneGeometry(1, 1), kit.mat(0xffffff, 0.5, 0.6, 5.0, 1.0, { alphaMap: gateBars(), alphaTest: 0.5, side: THREE.DoubleSide }), gateM, gateC);
  if (clothP.length) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(clothP, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(clothN, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(clothCol, 3));
    kit.scene.add(new THREE.Mesh(g, kit.mat(0xffffff, 0.95, 0, 6.0, 0.3, { vertexColors: true, side: THREE.DoubleSide })));
  }
  kit.scene.add(kit.wires(segs, rads));

  // frozen drops beaded under the wires, glinting where a lamp is close
  const bp: number[] = [], bc: number[] = [], br: number[] = [];
  const [wr, wg, wb] = kit.warm;
  for (let i = 0; i < segs.length; i += 6) {
    const ax = segs[i]!, ay = segs[i + 1]!, az = segs[i + 2]!, bx = segs[i + 3]!, by = segs[i + 4]!, bz = segs[i + 5]!;
    const L = Math.hypot(bx - ax, by - ay, bz - az), n = Math.floor(L / 0.3);
    const rad = rads[i / 6]!;
    for (let k = 0; k < n; k++) {
      if (rnd() > 0.35) continue;
      const u = (k + rnd()) / n, x = ax + (bx - ax) * u, y = ay + (by - ay) * u - rad - 0.002, z = az + (bz - az) * u;
      // a drop glints only toward a lamp close by (and only some catch it at the angle to the eye)
      const e = kit.lampAt(x, y, z);
      if (e < 0.25 || rnd() < 0.5) continue;
      const k2 = Math.min(0.9, e * 0.35) * R(0.2, 1.0);
      bp.push(x, y, z); bc.push(wr * k2, wg * k2, wb * k2); br.push(0.0016);
    }
  }
  kit.beads(bp, bc, br);
  return { poles: poles.length, wires: segs.length / 6, beads: bp.length / 3 };
}
