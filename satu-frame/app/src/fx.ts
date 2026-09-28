// Additive light effects shared by the 3D worlds: a glowing ribbon trail and a soft glow sprite. They
// render in colour but are left out of the depth pass (they are light, not surfaces).
import * as THREE from 'three';
import { LIN } from './engine/palette';

export const FX_LAYER = 1;

/** A glowing ribbon: points from head to tail (world space), camera-facing. Additive, HDR. */
export class Trail {
  mesh: THREE.Mesh;
  private pos: Float32Array;
  private col: Float32Array;
  constructor(public n = 32, public head: [number, number, number] = LIN.ice, public tail: [number, number, number] = LIN.blue2) {
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
  /** `pts` head→tail, `width` at the head, `k` intensity (HDR, >1 blooms). */
  set(pts: THREE.Vector3[], width: number, k: number, camPos: THREE.Vector3, taper = 1.1) {
    const view = new THREE.Vector3(), dir = new THREE.Vector3(), side = new THREE.Vector3();
    const L = pts.length - 1;
    for (let i = 0; i < this.n; i++) {
      const f = i / (this.n - 1);
      const fi = f * L, i0 = Math.floor(fi), i1 = Math.min(L, i0 + 1), u = fi - i0;
      const p = pts[i0]!.clone().lerp(pts[i1]!, u);
      dir.subVectors(pts[Math.max(0, i0)]!, pts[Math.min(L, i0 + 1)]!);
      if (dir.lengthSq() < 1e-20) dir.set(1, 0, 0);
      view.subVectors(camPos, p);
      side.crossVectors(dir, view).normalize();
      const w = width * (1 - f) ** taper;
      for (let s = 0; s < 2; s++) {
        const j = (i * 2 + s) * 3, sg = s ? -1 : 1;
        this.pos[j] = p.x + side.x * w * sg; this.pos[j + 1] = p.y + side.y * w * sg; this.pos[j + 2] = p.z + side.z * w * sg;
        const a = k * (1 - f) ** 2.2;
        for (let c = 0; c < 3; c++) this.col[j + c] = (this.head[c]! * (1 - f) + this.tail[c]! * f) * a;
      }
    }
    this.mesh.geometry.attributes.position!.needsUpdate = true;
    this.mesh.geometry.attributes.color!.needsUpdate = true;
    this.mesh.geometry.computeBoundingSphere();
    this.mesh.visible = k > 0.001;
  }
}

let glowTex: THREE.Texture | null = null;
/** Soft radial falloff texture (white). */
export function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
/** An additive glow sprite in a linear colour. */
export function glowSprite(col: [number, number, number] = LIN.ice) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color().setRGB(...col), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
  const s = new THREE.Sprite(m);
  s.renderOrder = 21;
  s.layers.set(FX_LAYER);
  return s;
}
