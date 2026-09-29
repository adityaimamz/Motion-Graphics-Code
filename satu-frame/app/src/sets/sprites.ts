// Points of light as camera-facing sprites with their own depth of field: each sprite grows to its circle
// of confusion and dims so its energy is kept (in-shader bokeh, no depth pass needed). Two kinds:
//  - FrozenRain: an unbounded field of drops that never move (positions hashed from world cells around
//    the camera), lit faintly by the city and brightly where a radio wavefront shell passes through them;
//  - LightPoints: a fixed list (street lamps, windows far away, city carpet), same optics.
import * as THREE from 'three';
import { LIN } from '../engine/palette';
import { W, H } from '../engine/gl';
import { FX_LAYER } from '../fx';
import type { Cam } from '../r3';

const HASH = /* glsl */ `
vec3 hash33(vec3 p3) { p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }`;

// NaN/Inf test on the bits: the D3D compiler (ANGLE on Windows) assumes floats are never NaN and
// removes isnan()/isinf() (warning X3577), so those guards did nothing there
const BAD = /* glsl */ `
bool badF(vec3 v) { uvec3 e = floatBitsToUint(v) & 0x7f800000u; return any(equal(e, uvec3(0x7f800000u))); }`;

const OPTICS = /* glsl */ `
uniform float focus, ap, focalPx, fogD, maxPx;
varying vec2 vC; varying vec3 vCol; varying float vBig;
${BAD}
// place a sprite of physical radius r (world) at view position mv with colour col
void sprite(vec4 mv, float r, vec3 col, vec2 corner) {
  float dist = max(-mv.z, 1e-4);
  float rPx = r / dist * focalPx;
  float coc = ap * abs(1.0 - focus / dist);
  float size = max(max(rPx, coc), 1.1);
  // a disc wider than ~300 px carries almost no light per pixel: drop it (and its fill cost)
  if (size > maxPx) { vCol = vec3(0.0); vBig = 0.0; vC = corner; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float energy = (rPx + 0.7) * (rPx + 0.7) / (size * size);
  float fog = exp(-fogD * fogD * dist * dist);
  vCol = min(col * energy * fog, vec3(60.0));
  if (badF(vCol)) vCol = vec3(0.0);
  vBig = smoothstep(3.0, 10.0, size);
  vC = corner;
  // pull the sprite toward the lens a little (more when it is a big defocused disc) so the surface it sits on does not cut it
  mv.xyz *= 1.0 - min(0.03, 0.004 + size * 0.0004);
  vec4 cp = projectionMatrix * mv;
  cp.xy += corner * size * vec2(2.0 / ${W}.0, 2.0 / ${H}.0) * cp.w;
  gl_Position = mv.z < -1e-4 ? cp : vec4(2.0, 2.0, 2.0, 1.0);
}`;

const FRAG = /* glsl */ `
varying vec2 vC; varying vec3 vCol; varying float vBig;
${BAD}
void main() {
  float r = length(vC);
  if (r > 1.0) discard;
  // small: soft gaussian point; large (defocused): a lens bokeh disc, soft-edged, a little brighter at the
  // rim, faint onion rings from the aspheric elements, and a trace of colour fringe at the edge
  float small = exp(-r * r * 3.2);
  float disc = smoothstep(1.0, 0.92, r) * (0.8 + 0.22 * smoothstep(0.55, 0.96, r) + 0.035 * sin(r * 34.0));
  float k = mix(small * 1.9, disc, vBig);
  float fr = smoothstep(0.84, 1.0, r) * vBig;
  vec3 o = vCol * k * vec3(1.0 + 0.18 * fr, 1.0, 1.0 - 0.14 * fr);
  if (badF(o)) discard;
  gl_FragColor = vec4(o, 1.0);
}`;

// the halo a lamp makes in the rainy air around it: light scattered by the drops and mist, a soft
// falloff with a brighter core, never a lens disc (it is in the scene, not in the lens: no bloom)
const HALO_FRAG = /* glsl */ `
varying vec2 vC; varying vec3 vCol; varying float vBig;
${BAD}
void main() {
  float r = length(vC);
  if (r > 1.0) discard;
  float k = (exp(-r * r * 9.0) * 0.55 + exp(-r * 3.4) * 0.45) * smoothstep(1.0, 0.7, r);
  vec3 o = vCol * k;
  if (badF(o)) discard;
  gl_FragColor = vec4(o, 1.0);
}`;

function quad(n: number) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  g.setAttribute('corner', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = n;
  return g;
}

function opticsUniforms() {
  return { focus: { value: 10 }, ap: { value: 0 }, focalPx: { value: 1000 }, fogD: { value: 0 }, maxPx: { value: 300 } };
}
export function setOptics(u: Record<string, THREE.IUniform>, cam: Cam, fogD: number) {
  u.focus!.value = cam.focus ?? cam.pos.distanceTo(cam.look);
  u.ap!.value = cam.ap ?? 0;
  u.focalPx!.value = (H / 2) / Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
  u.fogD!.value = fogD;
}

export interface Wave { origin: THREE.Vector3; R: number; width: number; k: number; sheet?: boolean }

/** Frozen rain around the camera: n³ cells of `cell` m, one drop in a fraction `occ` of them. */
export class FrozenRain {
  mesh: THREE.Mesh;
  u: Record<string, THREE.IUniform>;
  constructor(public n: number, public cell: number, occ: number, dropR: number, base: number, seed: number) {
    const count = n * n * n;
    const g = quad(count);
    const iid = new Float32Array(count);
    for (let i = 0; i < count; i++) iid[i] = i;
    g.setAttribute('iid', new THREE.InstancedBufferAttribute(iid, 1));
    this.u = {
      ...opticsUniforms(), camCell: { value: new THREE.Vector3() }, cell: { value: cell }, nAxis: { value: n }, occ: { value: occ }, dropR: { value: dropR },
      base: { value: base }, seed: { value: seed },
      wOrigin: { value: new THREE.Vector3() }, wR: { value: -1 }, wW: { value: 6 }, wK: { value: 0 },
      keepOut: { value: new THREE.Vector4(0, 0, 0, 0) }, keepOutY: { value: 0 }, ground: { value: 0.3 },
      // the lamps' pools of light (city.ts): drops in a lamp's light glint warm
      poolN: { value: null }, poolF: { value: null }, boxN: { value: new THREE.Vector4(0, 0, 1, 1) }, boxF: { value: new THREE.Vector4(0, 0, 1, 1) },
      lampK: { value: 0 }, lampC: { value: new THREE.Vector3(1, 0.9, 0.76) },
      paper: { value: new THREE.Vector3(...LIN.paper) }, ice: { value: new THREE.Vector3(...LIN.ice) },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec2 corner; attribute float iid;
        uniform vec3 camCell; uniform float cell, nAxis, occ, dropR, base, seed;
        uniform vec3 wOrigin; uniform float wR, wW, wK;
        uniform vec4 keepOut; uniform float keepOutY, ground;
        uniform vec3 paper, ice;
        uniform sampler2D poolN, poolF; uniform vec4 boxN, boxF; uniform float lampK; uniform vec3 lampC;
        float poolAt(vec2 xz) {
          vec2 un = vec2((xz.x - boxN.x) / (boxN.z - boxN.x), 1.0 - (xz.y - boxN.y) / (boxN.w - boxN.y));
          vec2 uf = vec2((xz.x - boxF.x) / (boxF.z - boxF.x), 1.0 - (xz.y - boxF.y) / (boxF.w - boxF.y));
          float s = 0.0;
          if (all(greaterThan(un, vec2(0.0))) && all(lessThan(un, vec2(1.0)))) s += textureLod(poolN, un, 0.0).r;
          if (all(greaterThan(uf, vec2(0.0))) && all(lessThan(uf, vec2(1.0)))) s += textureLod(poolF, uf, 0.0).r;
          return s;
        }
        ${HASH}
        ${OPTICS}
        void main() {
          float n = nAxis;
          vec3 ijk = vec3(mod(iid, n), mod(floor(iid / n), n), floor(iid / (n * n)));
          vec3 c = camCell - floor(n / 2.0) + ijk;
          vec3 h = hash33(c + seed);
          vec3 wp = (c + hash33(c * 1.37 + seed + 17.0)) * cell;
          bool gone = h.x > occ || wp.y < ground
            || (wp.x > keepOut.x && wp.x < keepOut.y && wp.z > keepOut.z && wp.z < keepOut.w && wp.y < keepOutY);
          // fade at the edge of the box so drops never pop
          vec3 rel = abs((c + 0.5) - (camCell + 0.5)) / (n * 0.5);
          float edge = smoothstep(1.0, 0.72, max(rel.x, max(rel.y, rel.z)));
          float glint = base * (0.05 + 0.95 * pow(h.y, 6.0)) * (0.7 + 0.3 * h.z);
          float d = length(wp - wOrigin);
          float x = (d - wR) / wW;
          float wave = wR > 0.0 ? exp(-x * x) * wK : 0.0;
          // in a lamp's light (its pool below, ~6 m up): the drop catches it, a few of them as bright glints
          float lamp = lampK > 0.0 ? poolAt(wp.xz) * exp(-pow((wp.y - 5.2) / 4.5, 2.0)) : 0.0;
          vec3 col = (paper * glint + lampC * lamp * lampK * (0.08 + 2.2 * pow(h.y, 5.0)) + ice * wave * (0.6 + 0.8 * h.y)) * edge;
          vec4 mv = modelViewMatrix * vec4(wp, 1.0);
          if (gone || edge <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
          sprite(mv, dropR * (0.6 + 0.8 * h.z), col, corner);
        }`,
      fragmentShader: FRAG,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 30;
    this.mesh.layers.set(FX_LAYER);
  }
  update(cam: Cam, fogD: number, wave: Wave | null) {
    setOptics(this.u, cam, fogD);
    (this.u.camCell!.value as THREE.Vector3).set(Math.floor(cam.pos.x / this.cell), Math.floor(cam.pos.y / this.cell), Math.floor(cam.pos.z / this.cell));
    if (wave) { (this.u.wOrigin!.value as THREE.Vector3).copy(wave.origin); this.u.wR!.value = wave.R; this.u.wW!.value = wave.width; this.u.wK!.value = wave.k; }
    else this.u.wR!.value = -1;
  }
}

/** A fixed set of lights (world positions, linear colours, physical radii), same optics as the rain.
 *  `halo`: the glow each lamp makes in the rainy air around it (radius = the halo's, soft profile). */
export class LightPoints {
  mesh: THREE.Mesh;
  u: Record<string, THREE.IUniform>;
  constructor(pos: Float32Array, col: Float32Array, rad: Float32Array, halo = false) {
    const n = rad.length;
    const g = quad(n);
    g.setAttribute('ipos', new THREE.InstancedBufferAttribute(pos, 3));
    g.setAttribute('icol', new THREE.InstancedBufferAttribute(col, 3));
    g.setAttribute('irad', new THREE.InstancedBufferAttribute(rad, 1));
    this.u = { ...opticsUniforms(), gain: { value: 1 } };
    // a halo close to the lens is big on screen but still there (the lamp by the window)
    if (halo) this.u.maxPx!.value = 1600;
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec2 corner; attribute vec3 ipos, icol; attribute float irad;
        uniform float gain;
        ${OPTICS}
        void main() { sprite(modelViewMatrix * vec4(ipos, 1.0), irad, icol * gain, corner); }`,
      fragmentShader: halo ? HALO_FRAG : FRAG,
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = halo ? 28 : 29;
    this.mesh.layers.set(FX_LAYER);
  }
  update(cam: Cam, fogD: number, gain = 1) { setOptics(this.u, cam, fogD); this.u.gain!.value = gain; }
}
