// Building blocks: a printed sheet (mesh + ink canvases + paper material), masking tape, cardboard.
import * as THREE from 'three';
import { InkCanvas } from './ink';
import { paperMaterial, type PaperMaterial, type PaperOpts } from './material';
import { RISO_LIN } from '../palette';
import { hash } from '../engine/util';

export interface Sheet {
  mesh: THREE.Mesh;
  ink: InkCanvas;
  mat: PaperMaterial;
  geo: THREE.PlaneGeometry;
  w: number;
  h: number;
  /** flat z of each vertex (before any per-frame deformation), for sheets that deform */
  base: Float32Array;
}

export interface SheetOpts extends Partial<Omit<PaperOpts, 'size' | 'inks'>> {
  res?: number;
  toneRes?: number;
  seg?: [number, number];
  /** misregistration amplitude (units) when `mis` is not given: per-sheet hash */
  misAmp?: number;
  /** curl the untaped corners up (units): [top-left, top-right, bottom-right, bottom-left] */
  lift?: [number, number, number, number];
  castShadow?: boolean;
}

/** A printed sheet lying on the board, local origin at its centre, uv (0,0) bottom-left. */
export function makeSheet(w: number, h: number, o: SheetOpts = {}): Sheet {
  const ink = new InkCanvas(w, h, o.res ?? 3, o.toneRes ?? Math.min(o.res ?? 3, 2));
  const seed = o.seed ?? hash(w, h) * 10;
  const a = o.misAmp ?? 1.1;
  const mis: [number, number][] = o.mis ?? [0, 1, 2, 3].map((i) => [(hash(seed, i, 1) * 2 - 1) * a, (hash(seed, i, 2) * 2 - 1) * a]);
  const mat = paperMaterial({ size: [w, h], paper: o.paper ?? RISO_LIN.sheet, inks: ink, cell: o.cell ?? 4.2, mis, seed, fiber: o.fiber ?? 1, roughness: o.roughness, side: o.side ?? THREE.DoubleSide, hMod: o.hMod, fragExtra: o.fragExtra, fragDecl: o.fragDecl, extraUniforms: o.extraUniforms });
  const [sx, sy] = o.seg ?? [Math.max(2, Math.round(w / 12)), Math.max(2, Math.round(h / 12))];
  const geo = new THREE.PlaneGeometry(w, h, sx, sy);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  if (o.lift) {
    const [tl, tr, br, bl] = o.lift;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / w + 0.5, v = pos.getY(i) / h + 0.5;
      const k = (c: number, du: number, dv: number) => c * Math.pow(Math.max(0, 1 - Math.hypot(du, dv) / 0.55), 2.2);
      pos.setZ(i, k(tl, u, 1 - v) + k(tr, 1 - u, 1 - v) + k(br, 1 - u, v) + k(bl, u, v));
    }
    geo.computeVertexNormals();
  }
  const base = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) base[i] = pos.getZ(i);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = o.castShadow ?? true;
  mesh.receiveShadow = true;
  return { mesh, ink, mat, geo, w, h, base };
}

/**
 * Masking tape: translucent crepe paper with torn ends. `text` (optional) is printed on it in black
 * (a hand-labelled station tag). Local origin at its centre, lying in the xy plane.
 */
export function makeTape(w: number, h: number, seed: number, text?: { s: string; font: string; px: number }) {
  const ink = new InkCanvas(w, h, text ? 6 : 1, 1);
  if (text) ink.draw(text.s, (k) => k.paint('solid', 'black', 0.92, (c) => {
    c.font = text.font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text.s, w / 2, h / 2 + text.px * 0.05);
  }));
  const mat = paperMaterial({
    size: [w, h], paper: RISO_LIN.tape, inks: ink, cell: 3, seed, fiber: 0.7, roughness: 0.8, side: THREE.DoubleSide,
    extraUniforms: { uTear: { value: seed } },
    fragDecl: 'uniform float uTear;',
    fragExtra: /* glsl */ `
      // crepe: fine creases across the tape; torn ends as ragged zigzags
      diffuseColor.rgb *= 1.0 + 0.05 * (vN(vec2(pp.x * 2.2, pp.y * 0.12) + uTear) - 0.5);
      float e = 1.6 + 1.1 * vN(vec2(pp.y * 1.3, uTear * 7.0)) + 0.8 * pH(vec2(floor(pp.y * 2.4), uTear));
      float e2 = 1.6 + 1.1 * vN(vec2(pp.y * 1.3 + 40.0, uTear * 3.0)) + 0.8 * pH(vec2(floor(pp.y * 2.4) + 9.0, uTear));
      if (pp.x < e || pp.x > uSize.x - e2) discard;
      diffuseColor.a = 0.86;`,
  });
  mat.transparent = true;
  mat.depthWrite = false;
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  return mesh;
}

/** Put a tape piece at world (x, y) over a surface at height z, turned by `deg`. */
export function placeTape(m: THREE.Mesh, x: number, y: number, z: number, deg: number) {
  m.position.set(x, y, z + 0.35);
  m.rotation.set(0, 0, THREE.MathUtils.degToRad(deg));
  return m;
}
