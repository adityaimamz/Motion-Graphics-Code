// Shared rendering for every world: cameras as plain data (Cam), a three.js scene renderer with depth of
// field, fullscreen "ray" shaders that get the same camera, and a pool of HDR targets for hand-offs
// between worlds. Worlds live in their own units; a Cam is always in the units of the world it looks at.
import * as THREE from 'three';
import { FSPass, W, H, makeRT, clearRT, SS_TAP, type Compositor } from './engine/gl';
import { FX_LAYER } from './fx';

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

export function mixCam(a: Cam, b: Cam, k: number): Cam {
  return {
    pos: a.pos.clone().lerp(b.pos, k),
    look: a.look.clone().lerp(b.look, k),
    fov: a.fov + (b.fov - a.fov) * k,
    roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k,
    up: a.up && b.up ? a.up.clone().lerp(b.up, k).normalize() : a.up ?? b.up,
    focus: (a.focus ?? a.pos.distanceTo(a.look)) + ((b.focus ?? b.pos.distanceTo(b.look)) - (a.focus ?? a.pos.distanceTo(a.look))) * k,
    ap: (a.ap ?? 0) + ((b.ap ?? 0) - (a.ap ?? 0)) * k,
    near: a.near, far: a.far,
  };
}

/** Pose a three.js camera from a Cam. */
export function applyCam(c: THREE.PerspectiveCamera, s: Cam) {
  c.fov = s.fov;
  c.aspect = W / H;
  c.near = s.near ?? 0.01;
  c.far = s.far ?? 1000;
  c.position.copy(s.pos);
  c.up.copy(s.up ?? v3(0, 1, 0));
  c.lookAt(s.look);
  if (s.roll) c.rotateZ(THREE.MathUtils.degToRad(s.roll));
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
}

/** Camera basis for fullscreen ray shaders: uniforms camPos, camRight, camUp, camFwd, tanHalf. */
export function camUniforms() {
  return { camPos: { value: v3() }, camRight: { value: v3(1, 0, 0) }, camUp: { value: v3(0, 1, 0) }, camFwd: { value: v3(0, 0, -1) }, tanHalf: { value: 0.35 } };
}
export function setCamUniforms(u: Record<string, THREE.IUniform>, s: Cam) {
  const tmp = new THREE.PerspectiveCamera();
  applyCam(tmp, s);
  const e = tmp.matrixWorld.elements;
  (u.camPos!.value as THREE.Vector3).copy(s.pos);
  (u.camRight!.value as THREE.Vector3).set(e[0]!, e[1]!, e[2]!);
  (u.camUp!.value as THREE.Vector3).set(e[4]!, e[5]!, e[6]!);
  (u.camFwd!.value as THREE.Vector3).set(-e[8]!, -e[9]!, -e[10]!);
  u.tanHalf!.value = Math.tan(THREE.MathUtils.degToRad(s.fov) / 2);
}
/** GLSL: the ray through logical pixel px (+ subpixel offset). */
export const RAY_GLSL = /* glsl */ `
uniform vec3 camPos, camRight, camUp, camFwd; uniform float tanHalf;
vec3 camRay(vec2 px) {
  vec2 ndc = (px / vec2(${W}.0, ${H}.0)) * 2.0 - 1.0;
  return normalize(camFwd + ndc.x * tanHalf * ${(W / H).toFixed(6)} * camRight + ndc.y * tanHalf * camUp);
}`;

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
    // under motion blur each sub-frame turns the sampling spiral a little: the average is smoother
    u.spin!.value = SS_TAP.value >= 0 ? SS_TAP.value * 0.61 : 0;
    this.pass.render(r, out);
  }
}

/**
 * The shared renderer. `scene()` draws a three.js scene through a Cam into `out` (HDR linear), with
 * DOF when cam.ap > 0.3. Fullscreen worlds draw themselves and may call `dof()` with their own depth.
 */
export class R3 {
  cam = new THREE.PerspectiveCamera(40, W / H, 0.01, 1000);
  color = makeRT(W, H, { samples: 4 });
  depth = makeRT(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  /** scratch HDR targets for hand-offs between worlds */
  a = makeRT(W, H, { depthBuffer: false });
  b = makeRT(W, H, { depthBuffer: false });
  c = makeRT(W, H, { depthBuffer: false });
  dofPass = new Dof();
  private depthMat = new THREE.ShaderMaterial({
    vertexShader: `varying float vz; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vz; void main(){ gl_FragColor = vec4(vz, 0.0, 0.0, 1.0); }`,
    side: THREE.DoubleSide,
  });
  constructor(public renderer: THREE.WebGLRenderer, public comp: Compositor) {
    this.cam.layers.enable(FX_LAYER);
  }

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
    this.cam.layers.disable(FX_LAYER);
    r.setRenderTarget(this.depth);
    r.render(scene, this.cam);
    this.cam.layers.enable(FX_LAYER);
    scene.overrideMaterial = null;
    // (a macro wider than the usual 28 px blur gets it: the gather widens with the aperture, up to 64 px)
    this.dofPass.run(r, this.color.texture, this.depth.texture, out, s.focus ?? s.pos.distanceTo(s.look), ap, Math.max(28, Math.min(ap, 64)));
  }

  /** DOF for fullscreen worlds that rendered colour into `color` and view depth into `depth`. */
  dof(color: THREE.Texture, depth: THREE.Texture, out: THREE.WebGLRenderTarget, focus: number, ap: number, maxR = 28) {
    this.dofPass.run(this.renderer, color, depth, out, focus, ap, maxR);
  }

  /** out = mix(a, b, k) (both HDR). */
  mix(a: THREE.Texture, b: THREE.Texture, out: THREE.WebGLRenderTarget, k: number) {
    this.comp.draw(this.renderer, a, out, { mode: 'replace', premult: false });
    if (k > 0) this.comp.draw(this.renderer, b, out, { mode: 'normal', opacity: k, premult: false });
  }
}
