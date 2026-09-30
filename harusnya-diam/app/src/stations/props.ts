// Props on the board: the wooden ruler (a ramp from the phone to the pop-up card) and the pencil.
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { monoFont } from '../fonts';
import { RULER, PENCIL } from '../layout';

export const RULER_T = 2.2;
const RL = Math.hypot(RULER.x1 - RULER.x0, RULER.y1 - RULER.y0);
export const RULER_ANG = Math.atan2(RULER.y1 - RULER.y0, RULER.x1 - RULER.x0);

/** Point along the ruler's top face centre line at distance s from its upper end (world). */
export function rulerAt(s: number): THREE.Vector3 {
  const u = s / RL;
  return new THREE.Vector3(RULER.x0 + (RULER.x1 - RULER.x0) * u, RULER.y0 + (RULER.y1 - RULER.y0) * u, RULER_T);
}
export const RULER_LEN = RL;

export class Ruler {
  group = new THREE.Group();
  constructor() {
    const top = makeSheet(RL, RULER.w, { res: 5, seed: 51, paper: [0.6, 0.44, 0.27], fiber: 1.8, seg: [2, 1], misAmp: 0.2 });
    top.ink.draw('r', (k) => k.paint('solid', 'black', 0.9, (c) => {
      c.lineWidth = 0.45;
      for (let mm = 0; mm <= RL - 8; mm += 2) {
        const x = 4 + mm, L = mm % 20 === 0 ? 9 : mm % 10 === 0 ? 6.5 : 4;
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, L); c.stroke();
        if (mm % 20 === 0) { c.font = monoFont(4.2); c.fillText(String(mm / 10), x + 0.8, 14.5); }
      }
      c.font = monoFont(4.4, true);
      c.fillText(T.ruler, RL - 58, RULER.w - 4);
    }));
    const body = new THREE.Mesh(new THREE.BoxGeometry(RL, RULER.w, RULER_T - 0.1), paperMaterial({ size: [RL, 3], paper: [0.5, 0.35, 0.2], seed: 52, fiber: 2.2 }));
    body.position.z = (RULER_T - 0.1) / 2;
    top.mesh.position.z = RULER_T;
    body.castShadow = body.receiveShadow = true;
    this.group.add(body, top.mesh);
    this.group.position.set((RULER.x0 + RULER.x1) / 2, (RULER.y0 + RULER.y1) / 2, 0);
    this.group.rotation.z = RULER_ANG;
  }
}

/** A hexagonal graphite pencil lying along x. Rolls downhill (−y) when nudged; `roll(s)` sets its travel. */
export class Pencil {
  group = new THREE.Group();
  body: THREE.Group;
  constructor() {
    const L = PENCIL.x1 - PENCIL.x0, r = PENCIL.r;
    this.body = new THREE.Group();
    const wood = new THREE.CylinderGeometry(r, r, L * 0.86, 6, 1);
    wood.rotateZ(Math.PI / 2);
    const paint = paperMaterial({ size: [L, 20], paper: [0.95, 0.72, 0.05], seed: 61, fiber: 0.5, roughness: 0.55 });
    const w = new THREE.Mesh(wood, paint);
    w.position.x = -L * 0.07;
    const cone = new THREE.ConeGeometry(r, L * 0.12, 6, 1);
    cone.rotateZ(-Math.PI / 2);
    const tip = new THREE.Mesh(cone, paperMaterial({ size: [10, 10], paper: [0.78, 0.62, 0.45], seed: 62, fiber: 2 }));
    tip.position.x = L * 0.43 - 0.5;
    const lead = new THREE.Mesh(new THREE.ConeGeometry(r * 0.28, L * 0.03, 12, 1).rotateZ(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.35, metalness: 0.3 }));
    lead.position.x = L * 0.5 - 0.6;
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, L * 0.05, 18).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.3, metalness: 0.9 }));
    fer.position.x = -L * 0.5 + L * 0.075;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, L * 0.05, 18).rotateZ(Math.PI / 2), paperMaterial({ size: [10, 10], paper: [0.9, 0.35, 0.4], seed: 63, roughness: 0.9 }));
    eraser.position.x = -L * 0.5 + L * 0.025;
    for (const m of [w, tip, lead, fer, eraser]) { m.castShadow = m.receiveShadow = true; this.body.add(m); }
    this.group.add(this.body);
    this.roll(0);
  }
  /** travel s (units) downhill from its start */
  roll(s: number) {
    const r = PENCIL.r;
    this.group.position.set((PENCIL.x0 + PENCIL.x1) / 2, PENCIL.y - s, r * 0.92);
    this.body.rotation.x = -s / r;
  }
}
