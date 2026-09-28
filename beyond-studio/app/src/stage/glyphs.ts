// Words as 3D glyphs: one textured quad per character (Inter Tight rendered into an atlas), laid out
// with the font's advances + brand tracking, so letters can rise from a mask line (clipping planes)
// or scatter into depth. Colour stays below the bloom threshold: type never glows.
import * as THREE from 'three';
import { LIN } from '../engine/palette';
import { setType, measure } from './type';
import { FX_LAYER } from './logo';

const PX = 220; // atlas px per em

export class GlyphWord {
  group = new THREE.Group();
  glyphs: { mesh: THREE.Mesh; x: number; w: number; ch: string }[] = [];
  /** Total width in em. */
  width = 0;
  mat: THREE.MeshBasicMaterial;
  private clip = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)];

  constructor(public text: string, weight = 780, trackEm = -0.045, color = LIN.paper) {
    const cv = document.createElement('canvas');
    const c = cv.getContext('2d')!;
    setType(c, PX, weight, trackEm);
    const ls = PX * trackEm;
    const cellW = Math.ceil(PX * 1.3), cellH = Math.ceil(PX * 1.5);
    cv.width = cellW * text.length;
    cv.height = cellH;
    setType(c, PX, weight, 0);
    c.fillStyle = '#fff';
    c.textBaseline = 'alphabetic';
    const base = cellH * 0.75;
    const xs: number[] = [];
    setType(c, PX, weight, trackEm);
    for (let i = 0; i < text.length; i++) xs.push(i === 0 ? 0 : measure(c, text.slice(0, i)) + ls);
    this.width = measure(c, text) / PX;
    setType(c, PX, weight, 0);
    for (let i = 0; i < text.length; i++) c.fillText(text[i]!, i * cellW + PX * 0.1, base);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, color: new THREE.Color().setRGB(...color), clippingPlanes: this.clip });
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      const gw = cellW / PX, gh = cellH / PX;
      const g = new THREE.PlaneGeometry(gw, gh);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / text.length);
      // plane origin = glyph pen position on the baseline
      g.translate(gw / 2 - 0.1, gh / 2 - (cellH - base) / PX, 0);
      const mesh = new THREE.Mesh(g, this.mat);
      mesh.visible = ch !== ' ';
      mesh.layers.set(FX_LAYER);
      this.group.add(mesh);
      const cw = i + 1 < text.length ? (xs[i + 1]! - xs[i]!) / PX : this.width - xs[i]! / PX;
      this.glyphs.push({ mesh, x: xs[i]! / PX, w: cw, ch });
    }
  }

  /** Clip to world y in [lo, hi] (the mask window). Pass Infinity to disable a side. */
  setClip(lo: number, hi: number) {
    this.clip[0]!.constant = -lo;
    this.clip[1]!.constant = hi;
  }

  /** Place glyphs on the baseline, centred: returns each glyph's resting local x (units of the group's scale). */
  rest(i: number) { return this.glyphs[i]!.x - this.width / 2; }
}
