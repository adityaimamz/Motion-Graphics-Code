// The Beyond Studio mark in 3D (STYLE.md §1): ring r 135 / stroke 34 with the right-hand gap
// (rect y 229–265, x > 300 in the 500x500 SVG), and the notched arrow
// M200,172 L330,247 L200,327 L234,247 Z. Geometry is in SVG px (y up, ring centre = origin).
import * as THREE from 'three';
import { LIN } from '../engine/palette';

export const RING_R = 135, RING_W = 34, GAP_HALF = 18, GAP_X = 300 - 249;
/** Arrow tip relative to the ring centre when locked. */
export const ARROW_LOCK = new THREE.Vector2(330 - 249, 0);
const DEPTH = 14, BEVEL = 3.2;
/** Additive light effects: rendered in colour, left out of the depth pass (they are not surfaces). */
export const FX_LAYER = 1;

const extrude = (shape: THREE.Shape, curveSegments = 12) =>
  new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL * 0.7, bevelSegments: 3, curveSegments }).translate(0, 0, -DEPTH / 2);

/** Paper-white brand material: bright flat face, bevels catch the studio light. */
export function paperMaterial() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color().setRGB(...LIN.paper), emissive: new THREE.Color().setRGB(...LIN.paper), emissiveIntensity: 0.16,
    roughness: 0.42, metalness: 0.0, envMapIntensity: 0.45,
  });
}

/** Arrow geometry with its tip at the origin, pointing +x (the old ARROW_D, y flipped). */
export function arrowGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-130, 75); s.lineTo(0, 0); s.lineTo(-130, -80); s.lineTo(-96, 0); s.closePath();
  return extrude(s, 1);
}

/** The ring, drawn symmetrically from 9 o'clock: p = 0..1 of each half. Cached by quantised p. */
const ringCache = new Map<number, THREE.BufferGeometry>();
export function ringGeometry(p: number) {
  const q = Math.round(Math.min(1, Math.max(0, p)) * 240);
  let g = ringCache.get(q);
  if (!g) {
    const span = (q / 240) * Math.PI;
    const a0 = Math.PI - span, a1 = Math.PI + span;
    const ro = RING_R + RING_W / 2, ri = RING_R - RING_W / 2;
    const s = new THREE.Shape();
    const n = Math.max(2, Math.ceil(q / 2));
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; if (i === 0) s.moveTo(Math.cos(a) * ro, Math.sin(a) * ro); else s.lineTo(Math.cos(a) * ro, Math.sin(a) * ro); }
    for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; s.lineTo(Math.cos(a) * ri, Math.sin(a) * ri); }
    s.closePath();
    g = q === 0 ? new THREE.BufferGeometry() : extrude(s, 1);
    ringCache.set(q, g);
  }
  return g;
}

/**
 * The ring mesh with its gap: three local clipping planes (clipIntersection) that together clip only the
 * rect x > GAP_X, |y| < GAP_HALF. Planes are in world space, so call update() after moving the group.
 */
export class Ring {
  mesh: THREE.Mesh;
  private local = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), GAP_X),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -GAP_HALF),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), -GAP_HALF),
  ];
  private planes = this.local.map((p) => p.clone());
  constructor(mat = paperMaterial()) {
    const m = mat.clone();
    m.clippingPlanes = this.planes;
    m.clipIntersection = true;
    this.mesh = new THREE.Mesh(ringGeometry(1), m);
  }
  set(p: number) { this.mesh.geometry = ringGeometry(p); this.mesh.visible = p > 0.002; }
  update() {
    this.mesh.updateWorldMatrix(true, false);
    this.local.forEach((p, i) => this.planes[i]!.copy(p).applyMatrix4(this.mesh.matrixWorld));
  }
}

/** A glowing ribbon behind the flying arrow: points from newest (head) to oldest. Additive, HDR. */
export class Trail {
  mesh: THREE.Mesh;
  private pos: Float32Array;
  private col: Float32Array;
  constructor(public n = 28) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 2 * 3);
    this.col = new Float32Array(n * 2 * 3);
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 20;
    this.mesh.layers.set(FX_LAYER);
  }
  /** `pts` head→tail in world space, `width` at the head, `k` overall intensity. */
  set(pts: THREE.Vector3[], width: number, k: number, cam: THREE.Camera) {
    const view = new THREE.Vector3(), dir = new THREE.Vector3(), side = new THREE.Vector3();
    const ice = LIN.ice, blue = LIN.blue2;
    for (let i = 0; i < this.n; i++) {
      const p = pts[Math.min(i, pts.length - 1)]!;
      const L = pts.length - 1, q = pts[Math.min(i + 1, L)]!, o = pts[Math.min(Math.max(i - 1, 0), L)]!;
      dir.subVectors(o, q);
      if (dir.lengthSq() < 1e-10) dir.set(1, 0, 0);
      view.subVectors(cam.position, p);
      side.crossVectors(dir, view).normalize();
      const f = i / (this.n - 1), w = width * (1 - f) ** 1.1;
      for (let s = 0; s < 2; s++) {
        const j = (i * 2 + s) * 3, sg = s ? -1 : 1;
        this.pos[j] = p.x + side.x * w * sg; this.pos[j + 1] = p.y + side.y * w * sg; this.pos[j + 2] = p.z + side.z * w * sg;
        const a = k * (1 - f) ** 2.2 * 1.9;
        for (let c = 0; c < 3; c++) this.col[j + c] = (ice[c]! * (1 - f) + blue[c]! * f) * a;
      }
    }
    this.mesh.geometry.attributes.position!.needsUpdate = true;
    this.mesh.geometry.attributes.color!.needsUpdate = true;
    this.mesh.visible = k > 0.001;
  }
}

/** A soft additive glow sprite (radial falloff), for the arrow and the lock flash. */
export function glowSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.SpriteMaterial({ map: tex, color: new THREE.Color().setRGB(...LIN.ice), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
  const s = new THREE.Sprite(m);
  s.renderOrder = 21;
  s.layers.set(FX_LAYER);
  return s;
}

/** A thin expanding ring (shockwave) in the logo plane. */
export function shockRing() {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...LIN.ice), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 160), m);
  mesh.renderOrder = 19;
  mesh.layers.set(FX_LAYER);
  return mesh;
}
