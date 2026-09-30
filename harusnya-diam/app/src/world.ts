// The paper world: one scene for the whole film (every station stays on the board for the pullback), the
// window light with its soft shadow fitted to what the camera sees, and the stretched-paper board.
import * as THREE from 'three';
import { paperMaterial, type PaperMaterial } from './paper/material';
import { RISO_LIN } from './palette';
import { BOARD, cx, cy, rw, rh } from './layout';
import type { Cam } from './r3';

/** Direction toward the window (raking light from the upper left, ~34° above the board). */
export const LIGHT_DIR = new THREE.Vector3(-0.55, 0.62, 0.56).normalize();

export class PaperWorld {
  scene = new THREE.Scene();
  sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.92, 0.82), 5.4);
  sky = new THREE.HemisphereLight(new THREE.Color(0.8, 0.87, 1.0), new THREE.Color(0.5, 0.45, 0.4), 0.5);
  /** a white bounce card in front of the set (only placed for the pop-up setup): soft fill from below */
  bounce = new THREE.DirectionalLight(new THREE.Color(1.0, 0.97, 0.93), 0);
  board: THREE.Mesh;
  boardMat: PaperMaterial;

  constructor(renderer: THREE.WebGLRenderer) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = true;
    const s = this.sun;
    s.castShadow = true;
    s.shadow.mapSize.set(4096, 4096);
    s.shadow.bias = -0.0004;
    s.shadow.normalBias = 0.4;
    s.shadow.radius = 5;
    this.sky.position.set(0, 0.3, 1); // the sky is on the camera's side of the board, not +y
    this.scene.add(s, s.target, this.sky, this.bounce, this.bounce.target);

    this.boardMat = paperMaterial({
      size: [rw(BOARD), rh(BOARD)], paper: RISO_LIN.board, seed: 3.7, fiber: 1.1, roughness: 0.95,
      extraUniforms: { uHole: { value: new THREE.Vector4(0, 0, 0, 0) }, uOrigin: { value: new THREE.Vector2(BOARD.x0, BOARD.y0) } },
      fragDecl: 'uniform vec4 uHole; uniform vec2 uOrigin;',
      fragExtra: /* glsl */ `
        // the plane's hole: a ragged tear with a ring of pale, fibrous core
        if (uHole.z > 0.0) {
          vec2 d = uOrigin + pp - uHole.xy;
          float r = length(d), a = atan(d.y, d.x);
          float edge = uHole.z * (1.0 + 0.22 * (vN(vec2(a * 3.0, 1.7)) - 0.5) + 0.12 * (vN(vec2(a * 11.0, 4.1)) - 0.5)) + 1.4 * (pH(vec2(floor(a * 60.0), 2.0)) - 0.5);
          if (r < edge) discard;
          float rim = 1.0 - smoothstep(edge, edge + 3.5, r);
          float fib = smoothstep(0.45, 0.9, vN(vec2(a * 70.0, r * 0.8)));
          diffuseColor.rgb = mix(diffuseColor.rgb, uPaper * (1.12 + 0.08 * fib), rim);
        }`,
    });
    this.board = new THREE.Mesh(new THREE.PlaneGeometry(rw(BOARD), rh(BOARD), 1, 1), this.boardMat);
    this.board.position.set(cx(BOARD), cy(BOARD), 0);
    this.board.receiveShadow = true;
    this.scene.add(this.board);
  }

  /** Open the tear in the board (radius 0 = intact). */
  hole(x: number, y: number, r: number) { (this.boardMat.uniforms as any).uHole.value.set(x, y, r, 0); }

  /** Fit the window light's shadow to the region the camera sees (sharp shadows at every framing). */
  fitLight(cam: Cam, bounce = 0) {
    this.bounce.intensity = bounce;
    this.bounce.target.position.set(cam.look.x, cam.look.y, 0);
    this.bounce.position.set(cam.look.x + 300, cam.look.y - 1100, 700);
    this.bounce.target.updateMatrixWorld();
    this.bounce.updateMatrixWorld();
    const look = cam.look;
    const dist = cam.pos.distanceTo(look);
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist;
    // the tilted views see further up the board: widen by the tilt
    const tilt = Math.acos(Math.min(1, Math.abs(cam.pos.z - look.z) / Math.max(dist, 1e-6)));
    const half = halfH * (1.25 + 1.6 * Math.sin(tilt));
    const s = this.sun;
    s.target.position.set(look.x, look.y, 0);
    s.position.copy(s.target.position).addScaledVector(LIGHT_DIR, 2400);
    const c = s.shadow.camera as THREE.OrthographicCamera;
    c.left = -half; c.right = half; c.top = half; c.bottom = -half;
    c.near = 100; c.far = 5000;
    c.updateProjectionMatrix();
    s.target.updateMatrixWorld();
    s.updateMatrixWorld();
    // keep the penumbra about the same size in world units (~2.2 mm) at every framing
    s.shadow.radius = Math.max(1.5, Math.min(12, (2.2 / (2 * half)) * s.shadow.mapSize.x));
  }
}

/** A board framing: look at (x, y) with frame width fw (units), optionally tilted/turned (degrees). */
export function frameCam(x: number, y: number, fw: number, o: { tilt?: number; az?: number; roll?: number; z?: number; fov?: number; ap?: number } = {}): Cam {
  const fov = o.fov ?? 30;
  const fh = (fw * 16) / 9;
  const d = fh / 2 / Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  const tilt = THREE.MathUtils.degToRad(o.tilt ?? 0), az = THREE.MathUtils.degToRad(o.az ?? 0);
  // az 0 = the camera leans back toward −y (looking up the board); tilt = angle away from the board normal
  const dir = new THREE.Vector3(Math.sin(tilt) * Math.sin(az), -Math.sin(tilt) * Math.cos(az), Math.cos(tilt));
  const look = new THREE.Vector3(x, y, o.z ?? 0);
  return { pos: look.clone().addScaledVector(dir, d), look, fov, roll: o.roll ?? 0, up: new THREE.Vector3(0, 1, 0), ap: o.ap ?? 0, near: Math.max(0.5, d * 0.02), far: d * 8 };
}
