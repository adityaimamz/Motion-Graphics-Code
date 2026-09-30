// Cameras as plain data (Cam) and the shared three.js renderer with depth of field (after satu-frame/r3.ts).
import * as THREE from 'three';
import { FSPass, W, H, makeRT, clearRT, SS_TAP, type Compositor } from './engine/gl';

export interface Cam {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  /** degrees, vertical */
  fov: number;
  roll?: number;
  up?: THREE.Vector3;
  /** focus distance (world units) and aperture (blur px at infinity); ap 0 = no DOF */
  focus?: number;
  ap?: number;
  near?: number;
  far?: number;
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Pose a three.js camera from a Cam. */
export function applyCam(c: THREE.PerspectiveCamera, s: Cam) {
  c.fov = s.fov;
  c.aspect = W / H;
  c.near = s.near ?? 1;
  c.far = s.far ?? 20000;
  c.position.copy(s.pos);
  c.up.copy(s.up ?? v3(0, 1, 0));
  c.lookAt(s.look);
  if (s.roll) c.rotateZ(THREE.MathUtils.degToRad(s.roll));
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
}

/** Depth of field: a gather blur driven by a view-depth texture (after beyond-studio's studio pass). */
export class Dof {
  pass = new FSPass(/* glsl */ `
    uniform sampler2D colorTex, depthTex; uniform float focus, aperture, maxR, spin; uniform vec2 px;
    float coc(float z) { return clamp(aperture * abs(1.0 - focus / max(z, 1e-6)), 0.0, maxR); }
    void main() {
      float zc = texture(depthTex, vUv).r;
      float cc = coc(zc);
      vec3 acc = texture(colorTex, vUv).rgb;
      float ws = 1.0;
      for (int i = 0; i < 96; i++) {
        float r = sqrt((float(i) + 0.5) / 96.0) * maxR;
        float a = float(i) * 2.39996 + spin;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * r * px;
        float z = texture(depthTex, uv).r;
        float c = coc(z);
        c = z > zc ? min(c, cc) : c;
        float w = smoothstep(r - 1.0, r + 0.5, c);
        acc += texture(colorTex, uv).rgb * w;
        ws += w;
      }
      fragColor = vec4(acc / ws, 1.0);
    }`, { colorTex: { value: null }, depthTex: { value: null }, focus: { value: 10 }, aperture: { value: 0 }, maxR: { value: 1 }, spin: { value: 0 }, px: { value: new THREE.Vector2(1 / W, 1 / H) } });
  run(r: THREE.WebGLRenderer, color: THREE.Texture, depth: THREE.Texture, out: THREE.WebGLRenderTarget, focus: number, ap: number, maxR = 28) {
    const u = this.pass.u;
    u.colorTex!.value = color; u.depthTex!.value = depth;
    u.focus!.value = focus; u.aperture!.value = ap;
    u.maxR!.value = Math.min(maxR, Math.max(1, ap));
    u.spin!.value = SS_TAP.value >= 0 ? SS_TAP.value * 0.61 : 0;
    this.pass.render(r, out);
  }
}

/** The shared renderer: draws a scene through a Cam into `out` (HDR linear), with DOF when cam.ap > 0.3. */
export class R3 {
  cam = new THREE.PerspectiveCamera(30, W / H, 1, 20000);
  color = makeRT(W, H, { samples: 4 });
  depth = makeRT(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  a = makeRT(W, H, { depthBuffer: false });
  b = makeRT(W, H, { depthBuffer: false });
  dofPass = new Dof();
  private depthMat = new THREE.ShaderMaterial({
    vertexShader: `varying float vz; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vz; void main(){ gl_FragColor = vec4(vz, 0.0, 0.0, 1.0); }`,
    side: THREE.DoubleSide,
  });
  constructor(public renderer: THREE.WebGLRenderer, public comp: Compositor) {}

  scene(scene: THREE.Scene, s: Cam, out: THREE.WebGLRenderTarget, clear: [number, number, number] = [0, 0, 0]) {
    const r = this.renderer;
    applyCam(this.cam, s);
    clearRT(r, this.color, clear);
    r.setRenderTarget(this.color);
    r.render(scene, this.cam);
    const ap = s.ap ?? 0;
    if (ap < 0.3) { this.comp.draw(r, this.color.texture, out, { mode: 'replace', premult: false }); return; }
    clearRT(r, this.depth, [1e9, 0, 0]);
    scene.overrideMaterial = this.depthMat;
    r.setRenderTarget(this.depth);
    r.render(scene, this.cam);
    scene.overrideMaterial = null;
    this.dofPass.run(r, this.color.texture, this.depth.texture, out, s.focus ?? s.pos.distanceTo(s.look), ap, Math.max(28, Math.min(ap, 64)));
  }
}
