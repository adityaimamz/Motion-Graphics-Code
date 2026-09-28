// The dark studio: one three.js world (sets stacked vertically, the camera cranes up between them),
// a reflective black floor per set, a blue key + rim light, a neutral studio environment for the
// metal, mirrored clones for floor reflections, and a depth-of-field pass (rack focus).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FSPass, W, H, makeRT, clearRT, type Compositor } from '../engine/gl';
import { LIN } from '../engine/palette';
import { FX_LAYER } from './logo';

const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
// Reflections show through where alpha < 1; the pool of light is a soft blue ellipse under the set.
const FLOOR_FRAG = /* glsl */ `
uniform vec3 origin; uniform float light; uniform vec2 pool; uniform vec3 poolCol;
varying vec3 vW;
void main() {
  vec2 d = (vW.xz - origin.xz) / pool;
  float r = length(d);
  float p = exp(-r * r * 1.6);
  vec3 col = poolCol * p * 0.03 * light;
  float a = mix(1.0, 0.88, p * light);
  gl_FragColor = vec4(col, a);
}`;

export class Studio {
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 600);
  key = new THREE.DirectionalLight(0xdfe8ff, 2.2);
  rim = new THREE.DirectionalLight(new THREE.Color().setRGB(...LIN.blue), 3.0);
  fill = new THREE.DirectionalLight(0xffffff, 0.4);
  private colorRT = makeRT(W, H, { samples: 4 });
  private depthRT = makeRT(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  private depthMat = new THREE.ShaderMaterial({
    vertexShader: `varying float vz; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vz; void main(){ gl_FragColor = vec4(vz, 0.0, 0.0, 1.0); }`,
    side: THREE.DoubleSide,
  });
  private dof = new FSPass(/* glsl */ `
    uniform sampler2D colorTex, depthTex; uniform float focus, aperture, maxR; uniform vec2 px;
    float coc(float z) { return clamp(aperture * abs(1.0 - focus / max(z, 0.01)), 0.0, maxR); }
    void main() {
      float zc = texture(depthTex, vUv).r;
      float cc = coc(zc);
      vec3 acc = texture(colorTex, vUv).rgb;
      float ws = 1.0;
      for (int i = 0; i < 64; i++) {
        float r = sqrt((float(i) + 0.5) / 64.0) * maxR;
        float a = float(i) * 2.39996;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * r * px;
        float z = texture(depthTex, uv).r;
        float c = coc(z);
        c = z > zc ? min(c, cc) : c;       // a sharp thing in front is not smeared by the blur behind it
        float w = smoothstep(r - 1.0, r + 0.5, c);
        acc += texture(colorTex, uv).rgb * w;
        ws += w;
      }
      fragColor = vec4(acc / ws, 1.0);
    }`, { colorTex: { value: null }, depthTex: { value: null }, focus: { value: 10 }, aperture: { value: 0 }, maxR: { value: 1 }, px: { value: new THREE.Vector2(1 / W, 1 / H) } });
  private mirrors: { src: THREE.Object3D; dst: THREE.Object3D; floorY: number; probe?: THREE.Object3D }[] = [];
  floors: THREE.ShaderMaterial[] = [];

  init(renderer: THREE.WebGLRenderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    this.scene.background = null;
    this.key.position.set(-6, 10, 12);
    this.rim.position.set(8, 6, -10);
    this.fill.position.set(0, 2, 14);
    this.scene.add(this.key, this.rim, this.fill);
    this.cam.layers.enable(FX_LAYER);
  }

  /** A floor disc for a set at `origin`; `pool` = half-size of the light pool (x, z). */
  addFloor(origin: THREE.Vector3, pool: [number, number]) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, transparent: true, depthWrite: true,
      uniforms: { origin: { value: origin.clone() }, light: { value: 1 }, pool: { value: new THREE.Vector2(...pool) }, poolCol: { value: new THREE.Vector3(...LIN.blue) } },
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.copy(origin);
    m.renderOrder = -10;   // first among the transparent: reflections (opaque) under it, glows and type over it
    this.scene.add(m);
    this.floors.push(mat);
    return mat;
  }

  /** Mirror `src` (already in the scene) under the floor at height floorY. Call sync() every frame. */
  addMirror(src: THREE.Object3D, floorY: number, probe?: THREE.Object3D) {
    const dst = src.clone(true);
    const wrap = new THREE.Group();
    wrap.add(dst);
    wrap.position.y = 2 * floorY;
    wrap.scale.y = -1;
    this.scene.add(wrap);
    this.mirrors.push({ src, dst: wrap, floorY, probe });
  }

  private sync() {
    const copy = (a: THREE.Object3D, b: THREE.Object3D) => {
      b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); b.visible = a.visible;
      for (let i = 0; i < a.children.length; i++) if (b.children[i]) copy(a.children[i]!, b.children[i]!);
    };
    for (const m of this.mirrors) {
      copy(m.src, m.dst.children[0]!);
      // below a set's floor (craning up through it) the reflection would float upside down: hide it
      // (and an object below the floor has no reflection above it)
      const py = m.probe ? m.probe.getWorldPosition(new THREE.Vector3()).y : Infinity;
      m.dst.visible = m.src.visible && this.cam.position.y > m.floorY + 0.05 && py > m.floorY;
    }
  }

  /** Render the world into `out` (HDR linear), with depth of field when aperture > 0 (blur px at infinity, capped at 14 px). */
  render(renderer: THREE.WebGLRenderer, comp: Compositor, out: THREE.WebGLRenderTarget, focus: number, aperture: number) {
    this.sync();
    this.cam.updateMatrixWorld();
    clearRT(renderer, this.colorRT, [0, 0, 0]);
    renderer.setRenderTarget(this.colorRT);
    renderer.render(this.scene, this.cam);
    if (aperture < 0.3) {
      comp.draw(renderer, this.colorRT.texture, out, { mode: 'replace', premult: false });
      return;
    }
    clearRT(renderer, this.depthRT, [1000, 0, 0]);
    this.scene.overrideMaterial = this.depthMat;
    this.cam.layers.disable(FX_LAYER);
    renderer.setRenderTarget(this.depthRT);
    renderer.render(this.scene, this.cam);
    this.cam.layers.enable(FX_LAYER);
    this.scene.overrideMaterial = null;
    const u = this.dof.u;
    u.colorTex!.value = this.colorRT.texture;
    u.depthTex!.value = this.depthRT.texture;
    u.focus!.value = focus;
    u.aperture!.value = aperture;
    u.maxR!.value = Math.min(14, Math.max(1, aperture));
    this.dof.render(renderer, out);
  }
}
