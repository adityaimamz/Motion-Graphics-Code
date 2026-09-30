// The dot: the full stop of the opening headline, a disc of black-printed board (Ø30, 3.2 thick) that makes
// the whole journey. Pose = centre + tilt β (0 lying flat … 90° on its edge) + heading ψ (the way it rolls) +
// spin θ (about its own axis).
import * as THREE from 'three';
import { paperMaterial } from '../paper/material';
import { RISO_LIN } from '../palette';

export const DISC_R = 15;
export const DISC_T = 3.2;

const Z = new THREE.Vector3(0, 0, 1);

export class Disc {
  mesh: THREE.Mesh;
  constructor() {
    const geo = new THREE.CylinderGeometry(DISC_R, DISC_R, DISC_T, 96, 1);
    geo.rotateX(Math.PI / 2);
    const k = RISO_LIN.black.map((x) => x * 1.6) as [number, number, number];
    const cap = paperMaterial({ size: [DISC_R * 2, DISC_R * 2], paper: k, seed: 12.3, fiber: 1.6, roughness: 0.78 });
    // the cut edge of grey board: layered, lighter than the print
    const edge = paperMaterial({ size: [DISC_R * 2 * Math.PI, DISC_T], paper: [0.3, 0.28, 0.25], seed: 4.1, fiber: 2.2, roughness: 0.95 });
    this.mesh = new THREE.Mesh(geo, [edge, cap, cap]);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  /** Centre (x, y) over a surface at height z0; β, ψ, θ in radians; `lift` raises it off its contact point. */
  pose(x: number, y: number, z0: number, beta: number, psi: number, theta: number, lift = 0) {
    this.mesh.scale.set(1, 1, 1);
    const n = new THREE.Vector3(-Math.sin(psi) * Math.sin(beta), Math.cos(psi) * Math.sin(beta), Math.cos(beta));
    const qa = new THREE.Quaternion().setFromUnitVectors(Z, n.normalize());
    const qs = new THREE.Quaternion().setFromAxisAngle(Z, theta);
    this.mesh.quaternion.copy(qa.multiply(qs));
    const zc = z0 + DISC_R * Math.sin(beta) + (DISC_T / 2) * Math.cos(beta) + lift;
    this.mesh.position.set(x, y, zc);
    this.mesh.visible = true;
  }

  /** Free flight: centre anywhere, orientation from an arbitrary quaternion-free axis/angle pair. */
  place(p: THREE.Vector3, axis: THREE.Vector3, theta: number, thick = 1) {
    this.mesh.scale.set(1, 1, thick);
    const qa = new THREE.Quaternion().setFromUnitVectors(Z, axis.clone().normalize());
    const qs = new THREE.Quaternion().setFromAxisAngle(Z, theta);
    this.mesh.quaternion.copy(qa.multiply(qs));
    this.mesh.position.copy(p);
    this.mesh.visible = true;
  }

  hide() { this.mesh.visible = false; }
}
