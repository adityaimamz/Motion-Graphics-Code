// Jakarta at night, in metres (S3 rain, S8 dive home, S9 the room). y up. The viewer's phone lies on a desk
// by a window on the second floor of a small building at the origin, top edge toward −z. Out the window:
// frozen rain, a sea of kampung roofs, a few towers, the lattice cell tower ~1.3 km away (placed where the
// radio wavefront, radius c·Δt from the physical clock, is at the moment it is hit), a far carpet of lights,
// and the pools of light the lamps throw on the streets. In the room: a walnut desk, the phone (rounded
// slab, black glass, the display with its punch-hole), the lit windows of our own building outside.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { CUE } from '../cues';
import { ms } from '../clock';
import { FrozenRain, LightPoints, type Wave } from './sprites';
import { HeroDrop } from './drop';
import { buildKampungDetail, nearCamera, CELL, K_GX, K_GZ, filledCell, isStreet, doorDir, doorFace, ihash, PORCH, BULB_WARM, SHED_RISE, KCELL_GLSL, type House, type Lamp, type Roof } from './kampung';
import { glowSprite, FX_LAYER } from '../fx';
import { camUniforms, setCamUniforms, applyCam, RAY_GLSL, type Cam } from '../r3';
import { FSPass, makeRT, clearRT, W, H } from '../engine/gl';

/** The radio wavefront as a thin luminous sheet: where each view ray crosses the shell, brighter at grazing
 *  angles (more rain along the line of sight inside the sheet), cut by the ground, dimmed by fog. */
const SHEET = /* glsl */ `
${RAY_GLSL}
uniform vec3 center; uniform float R, wid, k, fogD;
float sheetAt(vec3 o, vec3 d, float s) {
  if (s <= 0.0) return 0.0;
  vec3 p = o + d * s;
  if (p.y < 0.0) return 0.0;
  vec3 n = normalize(p - center);
  float c = abs(dot(d, n));
  // a thin sheet: nearly invisible face-on, glowing where the line of sight runs along it (the edge)
  float ratio = min(1.0 / max(c, 0.02), 30.0);
  float grain = 0.65 + 0.35 * snoise(n * R * 0.08) * snoise(n * R * 0.31 + 7.0);
  return 0.004 * pow(ratio, 1.7) * grain * exp(-fogD * fogD * s * s);
}
void main() {
  vec3 o = camPos, d = camRay(gl_FragCoord.xy / PX_SCALE);
  vec3 oc = o - center;
  float b = dot(oc, d), c = dot(oc, oc) - R * R, h = b * b - c;
  float gnd = d.y < 0.0 ? -o.y / d.y : 1e9;              // the ground hides the sheet beyond it
  float I = 0.0;
  if (h > 0.0) {
    float sq = sqrt(h);
    float s0 = -b - sq, s1 = -b + sq;
    if (s0 < gnd) I += sheetAt(o, d, s0);
    if (s1 < gnd) I += sheetAt(o, d, s1);
  }
  float inside = smoothstep(R + 4.0, R - 4.0, length(oc));
  I *= mix(1.0, 0.25, inside);
  // where the shell meets the ground: a ring sweeping over the rooftops
  if (gnd < 1e8) {
    vec3 g = o + d * gnd;
    float dg = length(g.xz - center.xz) - sqrt(max(R * R - center.y * center.y, 0.0));
    float wr = 2.2 + gnd * 0.004;
    I += 0.9 * exp(-dg * dg / (wr * wr)) * exp(-fogD * fogD * gnd * gnd * 0.5);
  }
  fragColor = vec4(C_ICE * I * k, 1.0);
}`;
import type { Ctx } from '../world';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** A rectangle w × l centred on the origin with circular corners of radius r (x across, y along). */
function roundedRect(w: number, l: number, r: number) {
  const s = new THREE.Shape(), x = w / 2 - r, y = l / 2 - r;
  s.moveTo(-x, -l / 2); s.lineTo(x, -l / 2); s.absarc(x, -y, r, -Math.PI / 2, 0, false);
  s.lineTo(w / 2, y); s.absarc(x, y, r, 0, Math.PI / 2, false);
  s.lineTo(-x, l / 2); s.absarc(-x, y, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-w / 2, -y); s.absarc(-x, -y, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/** Is (x, z) still kampung? Its edge is not a ruled line: 15–85 m in from the old rectangle, in places, the
 *  city's blocks have taken over (a slow noise decides where). */
function kampungAt(x: number, z: number) {
  const sd = Math.max(Math.abs(x) - 425, -1845 - z, z - 325);
  const fx = x / 70, fz = z / 70, ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
  const sm = (t: number) => t * t * (3 - 2 * t), H = (a: number, b: number) => ihash(a, b, 9);
  const n = (H(ix, iz) * (1 - sm(u)) + H(ix + 1, iz) * sm(u)) * (1 - sm(v)) + (H(ix, iz + 1) * (1 - sm(u)) + H(ix + 1, iz + 1) * sm(u)) * sm(v);
  return sd < -(15 + 70 * n);
}
/** A hipped roof (limasan): unit footprint like the gable's (x ±0.56 across, z ±0.54 along, ridge 0.42 up),
 *  sloping at both ends too. */
function hipGeometry() {
  const P = [[-0.56, 0, -0.54], [0.56, 0, -0.54], [0.56, 0, 0.54], [-0.56, 0, 0.54], [0, 0.42, -0.2], [0, 0.42, 0.2]].map(([x, y, z]) => V(x!, y!, z!));
  const pos: number[] = [];
  // each face turned outward (away from the middle of the roof)
  const tri = (a: number, b: number, c: number) => {
    const A = P[a]!, B = P[b]!, C = P[c]!;
    const n = B.clone().sub(A).cross(C.clone().sub(A)), m = A.clone().add(B).add(C).multiplyScalar(1 / 3).sub(V(0, 0.1, 0));
    const [p, q2] = n.dot(m) >= 0 ? [B, C] : [C, B];
    pos.push(A.x, A.y, A.z, p.x, p.y, p.z, q2.x, q2.y, q2.z);
  };
  tri(0, 3, 4); tri(4, 3, 5); tri(1, 4, 2); tri(2, 4, 5);   // the two long slopes
  tri(0, 4, 1); tri(3, 2, 5);                               // the hipped ends
  tri(0, 1, 2); tri(0, 2, 3);                               // (the underside)
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
/** A flat concrete roof (dak): a slab 0.15 m thick (y in metres; x, z unit) with a parapet round its edge. */
function dakGeometry() {
  return mergeGeometries([
    new THREE.BoxGeometry(1.02, 0.15, 1.02).translate(0, 0.075, 0),
    new THREE.BoxGeometry(1.02, 0.55, 0.025).translate(0, 0.425, 0.4975), new THREE.BoxGeometry(1.02, 0.55, 0.025).translate(0, 0.425, -0.4975),
    new THREE.BoxGeometry(0.025, 0.55, 0.97).translate(0.4975, 0.425, 0), new THREE.BoxGeometry(0.025, 0.55, 0.97).translate(-0.4975, 0.425, 0),
  ]);
}
/** A single slope (seng, a lean-to): unit run along x, high (y 1) at −x, falling to +x, width along z. */
function sengGeometry() {
  return new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.53, 0), new THREE.Vector2(0.53, 0), new THREE.Vector2(-0.53, 1)]), { depth: 1.04, bevelEnabled: false }).translate(0, 0, -0.52);
}
/** an instance's own position in metres before it is turned (roof courses, corrugations) */
const LOCAL_VERT = /* glsl */ `
#ifdef USE_INSTANCING
vRl = transformed * vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
#else
vRl = transformed;
#endif`;
/** Clay tiles (genteng): courses along the ridge, a shadow under each course's lower edge, staggered joints,
 *  each tile a little different, moss and dirt; fading to its average once finer than a pixel. */
const TILE_SURF = /* glsl */ `
{
  // a course every 0.3 m down the slope (34°): 0.168 m of height; tiles 0.22 m wide
  float cy = vRl.y / 0.168, row = floor(cy), fy = fract(cy);
  float cz = vRl.z / 0.22 + 0.5 * mod(row, 2.0), col = floor(cz), fz = fract(cz);
  float fwT = max(fwidth(cy), fwidth(cz));
  float vis = 1.0 - smoothstep(0.25, 0.6, fwT);
  float shade = (0.62 + 0.38 * smoothstep(0.0, 0.3, fy)) * (1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.06, min(fz, 1.0 - fz))));
  float each = 0.85 + 0.3 * h21(vec2(row, col) + vLampW.xz * 0.013);
  float moss = smoothstep(0.55, 0.8, vnoise(vLampW.xz * 0.7 + vRl.y));
  diffuseColor.rgb *= mix(0.86, shade * each, vis) * (1.0 - 0.35 * moss);
  roughnessFactor = mix(roughnessFactor, roughnessFactor + 0.25, moss);
}`;
/** Corrugated zinc: the waves (7.6 cm) bend the normal across the sheet, so it catches the sky in stripes;
 *  too fine for a pixel, they go on as roughness. */
const SENG_NORM = /* glsl */ `
{
  float fwz = fwidth(vRl.z);
  float vis = 1.0 - smoothstep(0.015, 0.04, fwz);
  normal = normalize(normal + vSz * 0.45 * sin(vRl.z * ${(2 * Math.PI / 0.076).toFixed(3)}) * vis);
  roughnessFactor = min(1.0, roughnessFactor + 0.2 * (1.0 - vis));
}`;
/** The desk: a very dark walnut veneer in a satin finish, grain along x, tileable (integer frequencies), with
 *  a roughness map so the sheen breaks softly along the grain. Deterministic. */
function woodTexture(rnd: () => number) {
  const W = 1024, Hh = 256;
  const cc = document.createElement('canvas'), cr = document.createElement('canvas');
  cc.width = cr.width = W; cc.height = cr.height = Hh;
  const xc = cc.getContext('2d')!, xr = cr.getContext('2d')!;
  const ic = xc.createImageData(W, Hh), ir = xr.createImageData(W, Hh);
  const waves = Array.from({ length: 7 }, (_, i) => ({ k: 3 + i * 5 + Math.floor(rnd() * 4), a: 0.5 / (1 + i), ph: rnd() * 6.283 }));
  const warp = Array.from({ length: 3 }, () => ({ k: 1 + Math.floor(rnd() * 3), a: 0.012 + rnd() * 0.02, ph: rnd() * 6.283 }));
  const pores = Array.from({ length: 40 }, () => [Math.floor(rnd() * W), Math.floor(rnd() * Hh), 20 + rnd() * 90] as const);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / Hh;
    let vv = v; for (const w of warp) vv += w.a * Math.sin(6.283 * w.k * u + w.ph);
    let g = 0; for (const w of waves) g += w.a * Math.sin(6.283 * w.k * vv + w.ph);
    const line = Math.pow(0.5 + 0.5 * Math.sin(6.283 * 37 * vv + 3 * g), 3);
    let pore = 0; for (const [px, py, len] of pores) { const dx = Math.min(Math.abs(x - px), W - Math.abs(x - px)), dy = Math.min(Math.abs(y - py), Hh - Math.abs(y - py)); if (dx < len && dy < 1.2) pore = Math.max(pore, 1 - dx / len); }
    const l = 0.6 + 0.18 * g - 0.18 * line - 0.2 * pore;
    const i4 = (y * W + x) * 4;
    ic.data[i4] = Math.round(34 * l); ic.data[i4 + 1] = Math.round(26 * l); ic.data[i4 + 2] = Math.round(21 * l); ic.data[i4 + 3] = 255;
    const rg = Math.round(255 * (0.62 + 0.1 * line + 0.15 * pore)); ir.data[i4] = ir.data[i4 + 1] = ir.data[i4 + 2] = rg; ir.data[i4 + 3] = 255;
  }
  xc.putImageData(ic, 0, 0); xr.putImageData(ir, 0, 0);
  const mk = (c: HTMLCanvasElement, srgb: boolean) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 6.3); t.anisotropy = 8; return t; };
  return { map: mk(cc, true), rough: mk(cr, false) };
}
const col = (c: [number, number, number], k = 1) => new THREE.Color().setRGB(c[0] * k, c[1] * k, c[2] * k);

// the room and the phone
export const FLOOR_Y = 7.0, DESK_Y = 7.75;
export const PHONE = { w: 0.0686, h: 0.0079, l: 0.1524, center: V(0, DESK_Y + 0.0040, -0.35) };
/** The antenna gap on the phone's top edge (board x 49.5 mm of 68.6). */
export const ANT = V(-PHONE.w / 2 + 0.0495, DESK_Y + 0.0045, PHONE.center.z - PHONE.l / 2);
export const WIN = { z: -0.95, x0: -0.8, x1: 0.8, y0: 7.95, y1: 9.55 };
/** the frozen raindrop the camera meets just outside the window (S3): 12 cm beyond the pane, on the way out */
export const DROP = V(0.0587, 8.569, -1.238), DROP_R = 0.0015;
/** the phone's screen as a lamp (candela, straight up) and the pool it makes on the ceiling as one (nits,
 *  facing down; a little above what the pool really sends back, so the room reads) */
const PHONE_CD = 2.6, BOUNCE_NIT = 0.08;
/** the head of the street lamp in front of our building, 2 m out from the facade and below the window */
const FACADE_LAMP = { x: 1.7, y: 6.55, z: -3.15 };
/** metres per millisecond of light */
export const C_MMS = CUE.fisik.radioMS / 1000;
export const EMIT = CUE.hujan.wave;
/** Radius of the outgoing radio shell at film time t (metres), -1 before it is emitted. */
export const radioR = (t: number) => (t < EMIT ? -1 : C_MMS * (ms(t) - ms(EMIT)));
const TOWER_D = radioR(CUE.hujan.tower);
const TDIR = V(-0.16, 0, -1).normalize();
/** Cell tower base (ground) and its antenna height. */
export const TOWER = V(ANT.x + TDIR.x * TOWER_D, 0, ANT.z + TDIR.z * TOWER_D);
export const TOWER_H = 42;
/** the shore (seawall face) and the cable's route: under the street, then out along the seabed to the horizon */
export const SHORE_Z = -2650;
export const CABLE = [V(TOWER.x, 0.25, TOWER.z), V(TOWER.x, 0.25, -1323), V(-189, 0.25, -1323), V(-189, 0.25, SHORE_Z + 1), V(-189, -0.42, SHORE_Z - 5), V(-189, -0.42, SHORE_Z - 4000)];
export const CABLE_X = -189;

// ── The city's own light (S3, S4, S8). No fill: every surface takes its light from something you can point
// at. The overcast glows warm with the city under it (the same light the cloud deck shows from above in S8,
// earth.ts CLOUD_WARM); the rainy air is lit the same (the fog is that glow, so the far city melts into the
// sky with no seam); the lamps light the walls near them (their pools of light, painted once, read back as
// a light field); wet asphalt mirrors lamps and sky (a planar reflection), wet roofs catch the sky.
type RGB = [number, number, number];
/** a pool of lamp light on the ground: x, z, strength, radius (m), and its stretch across x / along z
 *  (street lamps throw their light along the street), and whether it is a warm bulb (a porch lamp) */
type Pool = [number, number, number, number, number?, number?, boolean?];
const SKY_HOR: RGB = [0.076, 0.066, 0.059], SKY_ZEN: RGB = [0.013, 0.0125, 0.0125];
/** light thrown back up by the lit, wet streets (what the undersides and the lower walls see) */
const STREET_BOUNCE: RGB = [0.02, 0.016, 0.012];
export const FOG = new THREE.Color().setRGB(...SKY_HOR);
/** On top of the light in the scene, the city chapters (S3, S4, S8) sit a little brighter than the rest
 *  (B, +CITY_EV stop), eased in and out where the camera enters and leaves the city: out of the antenna
 *  gap, into the sea, through the cloud deck, into the room. k 0..1 = how far in. */
export const CITY_EV = 0.3;
export const cityExposure = (k: number) => Math.pow(2, CITY_EV * Math.min(1, Math.max(0, k)));
const WARM_LAMP: RGB = [1.0, 0.9, 0.76];
/** a phone's white (D65) in a room lit by nothing else: cooler than any lamp outside */
const SCREEN_WHITE: RGB = [0.78, 0.88, 1.0];
const glsl3 = (c: RGB) => `vec3(${c.map((x) => x.toFixed(4)).join(',')})`;
/** the overcast (shared by the sky dome and the environment the outdoor materials see) */
const SKY_GLSL = /* glsl */ `
vec3 skyGlow(vec3 d) {
  float y = max(d.y, 0.0);
  vec3 c = mix(${glsl3(SKY_HOR)}, ${glsl3(SKY_ZEN)}, pow(y, 0.5));
  // below the horizon: the lit streets' bounce (only the environment ever looks there)
  return d.y < 0.0 ? mix(${glsl3(SKY_HOR)}, ${glsl3(STREET_BOUNCE)}, smoothstep(0.0, 0.25, -d.y)) : c;
}`;

/** Shared by the outdoor materials: the lamps' pools (as a light field) and the wet street's reflection. */
const LIGHT_U = {
  poolN: { value: null as THREE.Texture | null }, poolF: { value: null as THREE.Texture | null },
  boxN: { value: new THREE.Vector4(-430, -1850, 430, 330) }, boxF: { value: new THREE.Vector4(-7000, -2650, 7000, 7000) },
  reflTex: { value: null as THREE.Texture | null }, reflMat: { value: new THREE.Matrix4() }, reflK: { value: 0 },
  /** the phone's light on our ceiling (0..1, phoneSky): what our roster's holes show */
  roomGlow: { value: 0 },
};
const OUT_VERT = /* glsl */ `
vec4 lampW = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
lampW = instanceMatrix * lampW;
#endif
vLampW = (modelMatrix * lampW).xyz;`;
const OUT_HEAD = /* glsl */ `
varying vec3 vLampW;
uniform sampler2D poolN, poolF; uniform vec4 boxN, boxF; uniform float lampE;
uniform sampler2D reflTex; uniform mat4 reflMat; uniform float reflK;
// the pools of lamp light on the ground around xz (canvas row 0 = z0, flipped: v = 1 at z0), blurred by lod
float poolAt(vec2 xz, float lod) {
  vec2 un = vec2((xz.x - boxN.x) / (boxN.z - boxN.x), 1.0 - (xz.y - boxN.y) / (boxN.w - boxN.y));
  vec2 uf = vec2((xz.x - boxF.x) / (boxF.z - boxF.x), 1.0 - (xz.y - boxF.y) / (boxF.w - boxF.y));
  float s = 0.0;
  if (all(greaterThan(un, vec2(0.0))) && all(lessThan(un, vec2(1.0)))) s += textureLod(poolN, un, lod).r;
  if (all(greaterThan(uf, vec2(0.0))) && all(lessThan(uf, vec2(1.0)))) s += textureLod(poolF, uf, max(lod - 1.8, 0.0)).r;
  return s;
}
// the room behind our window is indoors: none of this light reaches it
float outdoorAt(vec3 p) { return (abs(p.x) < 4.05 && p.z > ${(WIN.z - 0.15).toFixed(3)} && p.z < 8.15 && p.y < 10.45) ? 0.0 : 1.0; }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`;
const OUT_LIGHT = /* glsl */ `
{
  float og = outdoorAt(vLampW);
  iblIrradiance *= og;
  radiance *= og;
  // the lamps: a wall takes the pool on the street in front of it (lamps ~6 m up, so it fades above that);
  // an up-facing roof takes a little of the pool under it
  vec3 nW = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  float side = poolAt(vLampW.xz + nW.xz * 3.5, 2.2) * smoothstep(12.0, 3.5, vLampW.y);
  float top = poolAt(vLampW.xz, 3.0) * 0.45 * smoothstep(13.0, 5.0, vLampW.y);
  float e = mix(side, top, clamp(nW.y, 0.0, 1.0)) * step(-0.3, nW.y);
  irradiance += ${glsl3(WARM_LAMP)} * e * lampE * og;
}`;
const WET_LIGHT = /* glsl */ `
#ifdef WET_GROUND
if (reflK > 0.0) {
  // the planar reflection (rendered from the mirrored camera), where this point of the street sees it
  vec4 rc = reflMat * vec4(vLampW.x, 0.0, vLampW.z, 1.0);
  vec2 ruv = rc.xy / rc.w * 0.5 + 0.5;
#ifdef GROUND_ZONES
  // (how wet: from what the ground is, groundAt)
  float n1 = vnoise(vLampW.xz * 0.9 + 3.1);
  float wet = gWet;
#else
  float n1 = vnoise(vLampW.xz * 0.21) * 0.65 + vnoise(vLampW.xz * 0.9 + 3.1) * 0.35;
  float wet = mix(0.35, 1.0, smoothstep(0.38, 0.62, n1));           // standing water in the dips
#endif
  vec3 V = normalize(cameraPosition - vLampW);
  float F = 0.02 + 0.98 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  // a film of water on rough asphalt stretches each light into a streak toward the eye; a puddle is
  // nearly a mirror
  // (a streak is foreshortened with distance: its length on screen shrinks as the street recedes)
  float sp = mix(0.011, 0.0035, smoothstep(0.5, 1.0, wet)) * clamp(45.0 / rc.w, 0.06, 1.0);
#ifdef GROUND_ZONES
  // (a film on rough concrete smears what it mirrors much more than standing water does)
  sp *= mix(3.0, 1.0, smoothstep(0.6, 0.95, wet));
#endif
  // the rain is frozen as it lands: in the standing water, the rings around each impact stand still
  vec2 rc2 = vLampW.xz / 0.9, ci = floor(rc2), cf = fract(rc2) - 0.5, co = vec2(h21(ci), h21(ci + 3.7)) - 0.5;
  vec2 dv = cf - co * 0.6; float dr = length(dv) * 0.9;
  float ring = sin(dr * 48.0 - h21(ci + 9.1) * 6.283) * exp(-dr * 7.0) * step(h21(ci + 5.1), 0.55) * smoothstep(0.6, 0.9, wet);
  ruv += dv / max(length(dv), 1e-3) * ring * 0.0035 / max(rc.w * 0.02, 1.0);
  vec3 r = vec3(0.0); float ws = 0.0;
  for (int i = -4; i <= 4; i++) { float w = exp(-float(i * i) / 7.0); r += texture2D(reflTex, ruv + vec2((n1 - 0.5) * 0.003, float(i) * sp)).rgb * w; ws += w; }
  reflectedLight.indirectSpecular += r / ws * F * wet * reflK * outdoorAt(vLampW);
}
#endif`;
// ── The ground is not one sheet of asphalt. In the kampung: asphalt down the middle of the streets with an
// open drain (got) each side and a concrete kerb; between the houses cast concrete (the gangs, the yards, the
// terraces) cracked into slabs, and some yards bare earth or grass. Out in the city: its streets asphalt,
// the lots concrete. The port: a concrete apron in 6 m slabs, the cable street and the quay road asphalt. All
// of it wet: puddles in the dips, a film on the concrete. Its light: the overcast (less in a gang between
// walls), the lamps' pools on it (diffuse; on wet asphalt they mostly show as the sheen, groundGlow).
const SKY_E: RGB = [0, 1, 2].map((i) => Math.PI * (0.2 * SKY_HOR[i]! + 0.8 * SKY_ZEN[i]!)) as RGB;
const NOISE_GLSL = /* glsl */ `
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }`;
const GROUND_GLSL = /* glsl */ `
float gN(vec2 p) { return vnoise(p) * 0.5 + vnoise(p * 2.03 + 5.3) * 0.3 + vnoise(p * 4.1 + 1.7) * 0.2; }
// distance to the nearest joint of slabs s metres across (0 on the joint)
float joint(vec2 p, float s) { vec2 q = (0.5 - abs(fract(p / s) - 0.5)) * s; return min(q.x, q.y); }
// what the ground is at xz (fw = metres per pixel there): albedo (linear), roughness, how wet (standing
// water 1), how much of the lamps' sheen it shows (wet asphalt 1), how open to the sky
void groundAt(vec2 p, float fw, out vec3 alb, out float rough, out float wet, out float sheen, out float open) {
  float n = gN(p * 0.35), n2 = vnoise(p * 1.3 + 7.0);
  vec3 asph = vec3(0.028, 0.028, 0.03) * (0.85 + 0.3 * n2);
  vec3 conc = vec3(0.14, 0.134, 0.124) * (0.72 + 0.5 * n) * (0.9 + 0.2 * n2);
  // puddles: soft-edged, all sizes (warped, three octaves: no grid of blobs)
  float puddle = smoothstep(0.55, 0.68, gN(p * 0.19 + 3.0 + 0.6 * vec2(n, n2)));
  // fine joints fade to their average once smaller than a pixel
  float jAA = 1.0 - smoothstep(0.03, 0.12, fw);
  // the city beyond: its streets on the warped grid of its blocks, the lots between them
  float rx = p.x - sin(p.y * 0.002) * 60.0, rz = p.y - sin(p.x * 0.003) * 50.0;
  float dRoad = min(abs(rx - floor(rx / 90.0 + 0.5) * 90.0), abs(rz - floor(rz / 110.0 + 0.5) * 110.0));
  float road = 1.0 - smoothstep(5.5, 6.5 + fw, dRoad);
  alb = mix(conc * 0.6, asph, road); rough = mix(0.6, 0.5, road); sheen = mix(0.4, 1.0, road); open = mix(0.55, 0.8, road);
  wet = mix(mix(0.4, 0.6, n2), 1.0, puddle);
  vec2 g = floor(p / ${CELL.toFixed(1)} + 0.5), f = p - g * ${CELL.toFixed(1)};
  bool inK = g.x >= ${K_GX[0].toFixed(1)} && g.x <= ${K_GX[1].toFixed(1)} && g.y >= ${K_GZ[0].toFixed(1)} && g.y <= ${K_GZ[1].toFixed(1)};
  if (inK && kStreet(g)) {
    // a street: asphalt down the middle, an open drain each side, a concrete kerb up to the houses (the
    // cross street that met under our building is gone: only the gang's end is left there)
    bool ns = mod(g.x, 6.0) == 0.0, ew = mod(g.y, 7.0) == 0.0 && !(g.y == 0.0 && abs(g.x) <= 1.0);
    float d = min(ns ? abs(f.x) : 99.0, ew ? abs(f.y) : 99.0);
    float aw = 1.0 - smoothstep(2.65, 2.75 + fw, d);
    float drain = smoothstep(2.75, 2.8 + fw, d) * (1.0 - smoothstep(3.1, 3.15 + fw, d));
    vec3 kerb = conc * (1.0 - 0.3 * (1.0 - smoothstep(0.01, 0.03 + fw, joint(p, 1.2))) * jAA);
    alb = mix(mix(kerb, asph, aw), vec3(0.012), drain);
    rough = mix(mix(0.42, 0.5, aw), 0.08, drain);
    wet = mix(mix(mix(0.5, 0.75, n2), 1.0, puddle), 1.0, drain);
    sheen = mix(mix(0.45, 1.0, aw), 1.0, drain);
    open = mix(0.55, 0.8, aw);
  } else if (inK) {
    // between the houses: cast concrete cracked into slabs; some yards bare earth or grass
    float j = 1.0 - smoothstep(0.012, 0.035 + fw, joint(p + 0.37 * g, 1.8));
    alb = conc * (1.0 - 0.35 * j * jAA);
    rough = 0.42; sheen = 0.45; open = 0.4;
    wet = mix(mix(0.45, 0.75, n2), 1.0, puddle);
    float yard = ihash(g, 7u) < 0.25 ? smoothstep(0.42, 0.56, gN(p * 0.3 + g * 1.7)) : 0.0;
    vec3 earth = mix(vec3(0.045, 0.035, 0.025), vec3(0.026, 0.036, 0.018), step(0.5, ihash(g, 8u))) * (0.8 + 0.4 * n2);
    alb = mix(alb, earth, yard); rough = mix(rough, 0.75, yard); sheen = mix(sheen, 0.3, yard);
    wet = mix(wet, mix(0.2, 1.0, puddle), yard);
  } else if (p.y < -1850.0 && p.x > -960.0 && p.x < 760.0) {
    // the port: a concrete apron in 6 m slabs, oil stains; the cable street and the quay road asphalt
    float j = 1.0 - smoothstep(0.015, 0.05 + fw, joint(p, 6.0));
    float stain = smoothstep(0.55, 0.75, gN(p * 0.08 + 11.0));
    vec3 apron = vec3(0.12, 0.118, 0.112) * (0.8 + 0.35 * n) * (1.0 - 0.45 * stain) * (1.0 - 0.4 * j * jAA);
    float st = max(1.0 - smoothstep(5.0, 5.5 + fw, abs(p.x + 189.0)), 1.0 - smoothstep(${(SHORE_Z + 11).toFixed(1)}, ${(SHORE_Z + 11.5).toFixed(1)}, p.y));
    // painted lines: the cable street's dashed centre line and its yellow edges, the quay road's edge
    float cx = abs(p.x + 189.0);
    float dash = (1.0 - smoothstep(0.07, 0.09 + fw, cx)) * step(fract(p.y / 9.0), 0.33) * step(p.y, -1880.0);
    float edgeL = (1.0 - smoothstep(0.06, 0.08 + fw, abs(cx - 4.6))) * step(p.y, -1880.0);
    float quayL = 1.0 - smoothstep(0.06, 0.08 + fw, abs(p.y - ${(SHORE_Z + 10.6).toFixed(1)}));
    alb = mix(apron, asph, st); rough = mix(0.45, 0.5, st); sheen = mix(0.45, 1.0, st); open = 1.0;
    alb = mix(alb, vec3(0.45, 0.45, 0.42), dash * 0.8); alb = mix(alb, vec3(0.5, 0.36, 0.06), max(edgeL, quayL) * 0.8);
    wet = mix(mix(0.3, 0.5, n2), 1.0, puddle);
  }
}`;
/** How much of the lamps' sheen the ground shows (groundAt's, without its noise: the two glow layers over
 *  the ground need nothing else, and every pixel of them pays for it) */
const SHEEN_GLSL = /* glsl */ `
float sheenAt(vec2 p, float fw) {
  float rx = p.x - sin(p.y * 0.002) * 60.0, rz = p.y - sin(p.x * 0.003) * 50.0;
  float dRoad = min(abs(rx - floor(rx / 90.0 + 0.5) * 90.0), abs(rz - floor(rz / 110.0 + 0.5) * 110.0));
  float sh = mix(0.4, 1.0, 1.0 - smoothstep(5.5, 6.5 + fw, dRoad));
  vec2 g = floor(p / ${CELL.toFixed(1)} + 0.5), f = p - g * ${CELL.toFixed(1)};
  bool inK = g.x >= ${K_GX[0].toFixed(1)} && g.x <= ${K_GX[1].toFixed(1)} && g.y >= ${K_GZ[0].toFixed(1)} && g.y <= ${K_GZ[1].toFixed(1)};
  if (inK && kStreet(g)) {
    bool ns = mod(g.x, 6.0) == 0.0, ew = mod(g.y, 7.0) == 0.0 && !(g.y == 0.0 && abs(g.x) <= 1.0);
    float d = min(ns ? abs(f.x) : 99.0, ew ? abs(f.y) : 99.0);
    sh = mix(0.45, 1.0, 1.0 - smoothstep(2.65, 2.75 + fw, d) + smoothstep(2.75, 2.8 + fw, d) * (1.0 - smoothstep(3.1, 3.15 + fw, d)));
  } else if (inK) {
    sh = 0.45;
  } else if (p.y < -1850.0 && p.x > -960.0 && p.x < 760.0) {
    float st = max(1.0 - smoothstep(5.0, 5.5 + fw, abs(p.x + 189.0)), 1.0 - smoothstep(${(SHORE_Z + 11).toFixed(1)}, ${(SHORE_Z + 11.5).toFixed(1)}, p.y));
    sh = mix(0.45, 1.0, st);
  }
  return sh;
}`;
/** the lamps' pools as light (rgb: a porch lamp's warm bulb is painted warmer) */
const POOL_RGB_GLSL = /* glsl */ `
vec3 poolRGB(vec2 xz, float lod) {
  vec2 un = vec2((xz.x - boxN.x) / (boxN.z - boxN.x), 1.0 - (xz.y - boxN.y) / (boxN.w - boxN.y));
  vec2 uf = vec2((xz.x - boxF.x) / (boxF.z - boxF.x), 1.0 - (xz.y - boxF.y) / (boxF.w - boxF.y));
  vec3 s = vec3(0.0);
  if (all(greaterThan(un, vec2(0.0))) && all(lessThan(un, vec2(1.0)))) s += textureLod(poolN, un, lod).rgb;
  if (all(greaterThan(uf, vec2(0.0))) && all(lessThan(uf, vec2(1.0)))) s += textureLod(poolF, uf, max(lod - 1.8, 0.0)).rgb;
  return s;
}`;
const GROUND_SURF = /* glsl */ `
float gWet = 1.0, gSheen = 1.0, gOpen = 1.0;
{
  vec3 alb; float rough;
  groundAt(vLampW.xz, length(fwidth(vLampW.xz)), alb, rough, gWet, gSheen, gOpen);
  diffuseColor.rgb = alb;
  roughnessFactor = rough;
}`;
const GROUND_LAMP = 11.0;
const GROUND_LIGHT = /* glsl */ `
{
  float ogG = outdoorAt(vLampW);
  // the overcast on open ground (π × its radiance over the dome), less in a gang between walls
  irradiance += ${glsl3(SKY_E)} * gOpen * ogG;
  // the lamps' pools, diffusely: what they light on concrete or earth (wet asphalt shows them as its sheen)
  irradiance += poolRGB(vLampW.xz, 1.0) * ${glsl3(WARM_LAMP)} * ${GROUND_LAMP.toFixed(1)} * ogG;
}`;
// Windows in the walls of an instanced building (a unit box, y 0..1, scaled per instance): floors and bays in
// metres from its own frame; each window a frame, a pane of dark glass that mirrors the sky, and in a share
// of them a room lit behind a curtain (warm fabric or cooler LED, a lamp somewhere inside). Too small to
// resolve (far off, high up) the pattern fades to its average, so it never shimmers.
const WIN_VERT = /* glsl */ `
vLoc = transformed; vLocN = objectNormal;
#ifdef USE_INSTANCING
vIsc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz)); vSeed = instanceMatrix[3].xz;
#else
vIsc = vec3(1.0); vSeed = vec2(0.0);
#endif
#ifdef KAMPUNG_DOOR
vAxU = normalize(instanceMatrix[0].xz);
#endif`;
const WIN_SURF = /* glsl */ `
vec3 winC = vec3(0.0);
#ifdef KAMPUNG_DOOR
vec3 porchE = vec3(0.0);
#endif
{
  vec3 lp = vLoc * vIsc;
  bool xFace = abs(vLocN.x) > 0.5;
  float wall = step(abs(vLocN.y), 0.5);
  float Wd = xFace ? vIsc.z : vIsc.x;
  float u = (xFace ? lp.z : lp.x) + Wd * 0.5;
  float faceId = xFace ? (vLocN.x > 0.0 ? 1.0 : 2.0) : (vLocN.z > 0.0 ? 3.0 : 4.0);
  float nb = max(1.0, floor(Wd / BAY_W)), bw = Wd / nb;
  float bay = floor(u / bw), ub = u - bay * bw - bw * 0.5;
  float fl = floor(lp.y / FLOOR_H), vy = lp.y - fl * FLOOR_H;
  float hw = min(WIN_W * 0.5, bw * 0.36);
  float inX = hw - abs(ub), inY = min(vy - SILL, SILL + WIN_H - vy);
  float top = step(lp.y, vIsc.y - 0.6);                       // (no window cut by the eaves)
  float inside = step(0.0, min(inX, inY)) * wall * top;
  float frame = inside * (1.0 - step(0.055, min(inX, inY)));
  float pane = inside - frame;
  float h = h21(vSeed * 0.37 + vec2(bay * 1.7 + faceId * 13.1, fl * 5.3));
  float g = h21(vSeed * 0.11 + vec2(bay * 3.1 + faceId * 7.7, fl * 2.9 + 11.0));
  float lit = step(h, LIT_P);
  vec2 wq = vec2(ub / hw, (vy - SILL) / WIN_H * 2.0 - 1.0), lpos = vec2(g * 1.4 - 0.7, 0.5);
  float hot = 0.5 + 0.5 * exp(-dot(wq - lpos, wq - lpos) / 0.4);
  float fold = 0.86 + 0.14 * sin(ub * 21.0 + g * 40.0);
  vec3 tint = mix(vec3(1.0, 0.78, 0.55), vec3(1.0, 0.92, 0.8), step(0.55, g));
  vec3 litC = tint * fold * hot * (0.3 + 0.7 * g) * WIN_K;
  // unlit rooms are not black holes: a little of the house's other lamps, a TV-less dim warm
  vec3 dimC = tint * (0.012 + 0.03 * g * g) * (0.7 + 0.3 * fold);
  // too fine to resolve: the average of the pattern
  float fw = max(fwidth(u), fwidth(lp.y));
  float aa = smoothstep(0.08, 0.35, fw / min(WIN_W, WIN_H)) * wall * top;
  float paneAvg = (2.0 * hw - 0.11) * (WIN_H - 0.11) / (bw * FLOOR_H);
  float frameAvg = ((2.0 * hw) * WIN_H) / (bw * FLOOR_H) - paneAvg;
  // one door on the ground floor, on a side chosen per building
#if defined(NO_DOOR)
  float door = 0.0;
#elif defined(KAMPUNG_DOOR)
  // a kampung house's door faces the street beside it (or the gang it shares with the row across: kampung.ts
  // doorDir), on the ground floor's middle bay
  vec2 gc = floor(vSeed / ${CELL.toFixed(1)} + 0.5);
  vec2 dW = doorDir(gc);
  float du = dot(dW, vAxU), dv = dot(dW, vec2(-vAxU.y, vAxU.x));
  float dFace = abs(du) > 0.5 ? (du > 0.0 ? 1.0 : 2.0) : (dv > 0.0 ? 3.0 : 4.0);
  float onDoorFace = step(abs(faceId - dFace), 0.1) * wall;
  float door = step(fl, 0.5) * onDoorFace * step(abs(bay - floor(nb * 0.5)), 0.1)
    * step(abs(ub), 0.46) * step(vy, 2.15) * (1.0 - aa);
  // the porch lamp beside it (a bulb PORCH_Y up, PORCH_O out from the wall, on ~70 % of the houses): its
  // light on this wall, falling off as from a point that close (cos / r²); its shade keeps most of it low
  {
    float pu = min((floor(nb * 0.5) + 0.5) * bw + PORCH_B, Wd - 0.25);
    vec3 pd = vec3(u - pu, lp.y - PORCH_Y, PORCH_O);
    float pr2 = dot(pd, pd);
    vec3 bulb = mix(${glsl3(WARM_LAMP)}, ${glsl3(BULB_WARM)}, step(ihash(gc, 2u), PORCH_W));
    porchE = bulb * step(ihash(gc, 1u), PORCH_P) * onDoorFace * PORCH_I * PORCH_O * inversesqrt(pr2) / pr2 * mix(0.35, 1.0, step(lp.y, PORCH_Y));
  }
#else
  float door = step(fl, 0.5) * step(abs(faceId - (h21(vSeed * 0.53) < 0.5 ? 3.0 : 4.0)), 0.1) * step(abs(bay - floor(nb * 0.5)), 0.1)
    * step(abs(ub), 0.46) * step(vy, 2.15) * wall * (1.0 - aa);
#endif
  pane = mix(pane, paneAvg, aa) * (1.0 - door); frame = mix(frame, frameAvg, aa) * (1.0 - door);
  vec3 lit3 = mix(litC * lit + dimC * (1.0 - lit), tint * 0.62 * WIN_K * LIT_P, aa);
  // the plaster: uneven, rain stains running down from the sills, a darker plinth splashed by the street
  float nz = vnoise(vec2(u * 0.9, lp.y * 0.3) + vSeed * 0.013);
  float stain = smoothstep(hw + 0.15, hw - 0.25, abs(ub)) * smoothstep(SILL - 1.7, SILL, vy) * step(vy, SILL) * (0.4 + 0.6 * nz);
  float plinth = smoothstep(0.55, 0.35, lp.y);
  diffuseColor.rgb *= mix((0.8 + 0.34 * nz) * (1.0 - 0.32 * stain * (1.0 - aa)) * (1.0 - 0.4 * plinth), 1.0, 1.0 - wall);
  roughnessFactor = mix(roughnessFactor, 0.1, pane);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.01), pane);
  // painted frames (white or dark), catching the lamps like the walls do
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.05, 0.047, 0.043), vec3(0.42, 0.41, 0.39), step(0.5, h21(vSeed * 0.71 + 2.0))), frame);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.035, 0.024, 0.017), door);
#ifdef FLAT_ROOF
  // the flat concrete roofs: dark, wet (they mirror the sky), a parapet line at the edge
  float roof = step(0.5, vLocN.y);
  float edgeR = step(min(min(0.5 * vIsc.x - abs(lp.x), 0.5 * vIsc.z - abs(lp.z)), 1.0), 0.35);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * mix(0.32, 0.6, edgeR), roof);
  roughnessFactor = mix(roughnessFactor, 0.3, roof);
#endif
  winC = lit3 * pane;
}`;
/** Our building's own windows on its front (x, half width, sill, top): ours (the phone's room) first, then
 *  the neighbours' lit ones (as drawn below). */
const OUR_WINS: [number, number, number, number][] = [[0, 0.84, WIN.y0 - 0.06, WIN.y1 + 0.06],
  ...([[-2.6, 4.2], [2.4, 4.3], [-2.5, 8.7], [2.7, 1.6], [-1.2, 1.5]] as const).map(([x, y]) => [x, 0.6, y - 0.72, y + 0.65] as [number, number, number, number])];
/** Our building's render, up close (S3 out of the window, S8 coming home): trowelled repairs a shade off,
 *  a cast lip at each floor slab, rain streaks running from the parapet and from every sill, a darker
 *  plinth splashed by the street, a panel of breeze blocks (roster) over each window (over ours, the holes
 *  open into the room: they show the phone's cold light on its ceiling), the steel front door. */
const FACADE_SURF = /* glsl */ `
{
  vec3 nF = normalize((vec4(vNormal, 0.0) * viewMatrix).xyz);
  float front = step(0.5, -nF.z);
  float a = abs(nF.x) > 0.5 ? vLampW.z : vLampW.x, y = vLampW.y;
  float fwF = length(fwidth(vec2(a, y)));
  float patchN = vnoise(vec2(a, y) * 0.55 + 4.0), mott = vnoise(vec2(a, y) * 7.0);
  float tone = (0.86 + 0.18 * smoothstep(0.35, 0.7, patchN)) * (0.95 + 0.1 * mott);
  float band = (step(3.34, y) * step(y, 3.5) + step(6.84, y) * step(y, 7.0)) * (1.0 - smoothstep(0.03, 0.08, fwF));
  float st = vnoise(vec2(a * 5.0, y * 0.12)) * 0.6 + vnoise(vec2(a * 13.0, y * 0.3 + 2.0)) * 0.4;
  float streak = smoothstep(0.45, 0.8, st) * smoothstep(2.5, 10.4, y);
  float rostHole = 0.0, ours = 0.0;
  ${OUR_WINS.map(([x, hw, yb, yt], i) => `{
    float dx = abs(a - ${x.toFixed(2)});
    streak = max(streak, front * smoothstep(${(hw + 0.1).toFixed(2)}, ${(hw - 0.25).toFixed(2)}, dx) * step(y, ${yb.toFixed(2)}) * smoothstep(${(yb - 2.4).toFixed(2)}, ${yb.toFixed(2)}, y) * (0.35 + 0.65 * st));
    // the roster: 0.2 × 0.15 m blocks, a diamond hole in each
    float ry0 = ${(yt + 0.12).toFixed(2)};
    if (dx < ${hw.toFixed(2)} && y > ry0 && y < ry0 + 0.3) {
      vec2 q = fract(vec2((a - ${x.toFixed(2)}) / 0.2, (y - ry0) / 0.15));
      float h = (1.0 - smoothstep(0.26, 0.3, abs(q.x - 0.5) + abs(q.y - 0.5))) * front;
      rostHole = max(rostHole, h);${i === 0 ? '\n      ours = h;' : ''}
    }
  }`).join('\n  ')}
  float plinth = smoothstep(0.6, 0.3, y) * (0.7 + 0.3 * vnoise(vec2(a * 3.0, y * 4.0)));
  diffuseColor.rgb *= tone * (1.0 - 0.3 * band) * (1.0 - 0.3 * streak) * (1.0 - 0.35 * plinth);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.008), rostHole);
  totalEmissiveRadiance += ${glsl3(SCREEN_WHITE)} * roomGlow * 0.012 * ours;
  // the front door: painted steel (dark green), two panels, a handle
  float door = front * step(0.1, a) * step(a, 1.1) * step(y, 2.1);
  if (door > 0.0) {
    vec2 dq = vec2(a - 0.1, y);
    float frameD = min(min(dq.x, 1.0 - dq.x), 2.1 - dq.y);
    float panel = step(0.12, frameD) * (1.0 - step(abs(dq.y - 1.05), 0.04));
    vec3 paint = vec3(0.03, 0.045, 0.036) * mix(0.75, 1.0, panel);
    float handle = step(length(vec2(dq.x - 0.86, dq.y - 1.0)), 0.035);
    diffuseColor.rgb = mix(paint, vec3(0.25), handle);
    roughnessFactor = mix(0.45, 0.3, handle);
  }
}`;
/** Extra GLSL for one kind of outdoor surface: `surf` after the roughness (may change diffuseColor,
 *  roughnessFactor), `light` after the lamps' pools (may add to irradiance). */
interface Hooks {
  key: string; surf?: string; light?: string;
  /** fragment globals (functions, varyings), after the lamps' helpers */
  head?: string;
  /** after the normal is set (view space; may bend it) */
  norm?: string;
  /** vertex globals, and code after the vertex is placed (`transformed`, instanceMatrix) */
  vhead?: string; vert?: string;
}
/** The quay lamps in front of the seawall (a row along x, dx apart): what lights the wall, its top, its
 *  railing and the poles. The pools texture stops at the shore, so these surfaces add the lamps up one by one. */
const QUAY = { x0: -900, dx: 38, n: 43, y: 6, z: SHORE_Z + 6, I: 120 };
const QUAY_LIGHT = /* glsl */ `
{
  vec3 nQ = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  float k0 = floor((vLampW.x - ${QUAY.x0.toFixed(1)}) / ${QUAY.dx.toFixed(1)} + 0.5);
  vec3 q = vec3(0.0);
  for (int i = -3; i <= 3; i++) {
    float k = clamp(k0 + float(i), -1.0, ${QUAY.n.toFixed(1)});
    vec3 L = vec3(${QUAY.x0.toFixed(1)} + k * ${QUAY.dx.toFixed(1)}, ${QUAY.y.toFixed(1)}, ${QUAY.z.toFixed(1)}) - vLampW;
    float d2 = max(dot(L, L), 0.25); L *= inversesqrt(d2);
    // a street lamp throws its light down and out; little of it goes up
    float on = step(0.0, k) * step(k, ${(QUAY.n - 1).toFixed(1)});
    q += ${glsl3(WARM_LAMP)} * on * smoothstep(-0.05, 0.5, L.y) * max(dot(nQ, L), 0.0) / d2;
  }
  irradiance += q * ${QUAY.I.toFixed(1)} * outdoorAt(vLampW);
}`;
/** The frozen sea's waves as a slope per pixel: a wind sea (22 trains from 20 m swell down to 30 cm chop,
 *  spread around the wind, steepness falling with length, fixed random phases), stopped. xy = dh/dx, dh/dz;
 *  z = the slope of the trains too fine to resolve here, handed on to the roughness. */
const SEA_TRAINS: [number, number, number, number][] = (() => {
  const r = mulberry32(77), out: [number, number, number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const L = 20 * Math.pow(0.3 / 20, i / 21) * (0.85 + 0.3 * r());
    const ang = -1.35 + (r() - 0.5) * (0.9 + 1.6 * (i / 21));      // (−z is out to sea; the short chop spreads wider)
    const k = (2 * Math.PI) / L, steep = 0.05 + 0.035 * r();        // a·k
    out.push([steep / k, L, ang, r() * 6.283]);
  }
  return out;
})();
const SEA_WAVES = /* glsl */ `
vec3 seaSlope(vec2 p, float fw) {
  vec3 g = vec3(0.0);
  ${SEA_TRAINS.map(([a, L, ang, ph0]) => {
    const k = (2 * Math.PI) / L, cx = Math.cos(ang), sz = Math.sin(ang);
    return `{ float ph = ${k.toFixed(5)} * dot(vec2(${cx.toFixed(5)}, ${sz.toFixed(5)}), p) + ${ph0.toFixed(4)};
    float vis = 1.0 - smoothstep(0.12, 0.45, fw / ${L.toFixed(3)});
    g.xy += vis * ${(a * k).toFixed(5)} * (cos(ph) + 0.18 * cos(2.0 * ph)) * vec2(${cx.toFixed(5)}, ${sz.toFixed(5)});
    g.z += (1.0 - vis) * ${(a * k * 0.5).toFixed(5)}; }`;
  }).join('\n  ')}
  return g;
}`;
/** Cast concrete: 12 m panels with dark joints, a lift line, rain streaks running down, a darker foot the
 *  sea splashes; the walkway on top wet (it mirrors the overcast). */
const SEAWALL_SURF = /* glsl */ `
{
  float px = vLampW.x, py = vLampW.y;
  float joint = 1.0 - smoothstep(0.015, 0.05, abs(fract(px / 12.0 + 0.5) - 0.5) * 12.0);
  float lift = (1.0 - smoothstep(0.012, 0.035, abs(py - 0.95))) * step(py, 2.1);
  float streak = vnoise(vec2(px * 1.7, py * 0.09)) * 0.6 + vnoise(vec2(px * 5.3, py * 0.35 + 7.0)) * 0.4;
  float foot = smoothstep(0.35, -0.7, py);
  float top = step(0.5, normalize((vec4(vNormal, 0.0) * viewMatrix).xyz).y);
  diffuseColor.rgb *= mix((0.72 + 0.42 * streak) * (1.0 - 0.3 * lift), 0.85 + 0.2 * streak, top) * (1.0 - 0.6 * joint) * (1.0 - 0.5 * foot);
  roughnessFactor = mix(roughnessFactor, 0.28, max(foot, top));
}`;
/** Light a MeshStandardMaterial the city's way (see above). `lampE` = how much the lamps' pools light it;
 *  `win`: windows in its walls (instanced unit boxes; FLOOR_H, BAY_W, WIN_W, WIN_H, SILL, LIT_P, WIN_K). */
function outdoor<M extends THREE.MeshStandardMaterial>(m: M, lampE: number, env: THREE.Texture | null, envK: number, wet = false, win?: Record<string, number>, hooks?: Hooks): M {
  m.envMap = env; m.envMapIntensity = envK;
  const defs: Record<string, string> = {};
  if (wet) defs.WET_GROUND = '';
  if (win) { defs.FACADE_WIN = ''; for (const [k, v] of Object.entries(win)) defs[k] = v.toFixed(4); }
  m.defines = { ...(m.defines ?? {}), ...defs };
  // (the injected code is not in the defines: tell three.js which program this is)
  if (hooks) m.customProgramCacheKey = () => `outdoor:${hooks.key}`;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, LIGHT_U, { lampE: { value: lampE } });
    const vary = '\nvarying vec3 vLampW;\n#ifdef FACADE_WIN\nvarying vec3 vLoc, vLocN, vIsc; varying vec2 vSeed;\n#endif'
      + (win?.KAMPUNG_DOOR ? '\nvarying vec2 vAxU;' : '');
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>${vary}${hooks?.vhead ? `\n${hooks.vhead}` : ''}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${OUT_VERT}\n#ifdef FACADE_WIN\n${WIN_VERT}\n#endif${hooks?.vert ? `\n${hooks.vert}` : ''}`);
    // outdoors, the room's old fill (the cool hemisphere and "moon" directional light, still lighting the
    // desk in S9) has no source: the overcast has no moon; a wet roof would mirror it as a blue sheen
    const begin = THREE.ShaderChunk.lights_fragment_begin
      .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
      .replace('#if ( NUM_HEMI_LIGHTS > 0 )', '#if 0');
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', begin)
      .replace('#include <common>', `#include <common>${vary.replace('varying vec3 vLampW;', '')}\n${OUT_HEAD}${hooks?.head ? `\n${hooks.head}` : ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n#ifdef FACADE_WIN\n${WIN_SURF}\n#endif\n${hooks?.surf ?? ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>${hooks?.norm ? `\n${hooks.norm}` : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n#ifdef FACADE_WIN\ntotalEmissiveRadiance += winC * outdoorAt(vLampW);\n#endif`)
      .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>\n${OUT_LIGHT}\n${hooks?.light ?? ''}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${WET_LIGHT}`);
  };
  return m;
}

/** The bedroom's own surfaces: lit by the phone alone (no hemisphere or "moon" fill: those stay for the
 *  desk the viewer looks down at in S9). */
function indoor<M extends THREE.MeshStandardMaterial>(m: M): M {
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin
      .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
      .replace('#if ( NUM_HEMI_LIGHTS > 0 )', '#if 0'));
  };
  return m;
}

export interface CityState {
  /** refresh row on the phone's screen */
  scan: number;
  wave?: Wave | null;
  fogD?: number;
  /** room light from the phone (0..1, how much of the screen is lit) */
  glow?: number;
  /** flash on the tower's panels (0..1) */
  towerHit?: number;
  /** blue streak down the tower (0..1 progress, intensity k) */
  down?: [number, number];
  /** the street cable: lit length fraction and intensity */
  cable?: [number, number];
  /** gain on the city's lights (seen from high above) */
  lightsGain?: number;
  /** brightness of the phone's lit screen (1 = normal) */
  screenK?: number;
  /** the photon (S9): position and intensity */
  photon?: { pos: THREE.Vector3; k: number } | null;
  /** the phone's antenna still transmitting (S3 start): a blue glow at the gap, lighting the desk (0..1) */
  ant?: number;
  /** the scene's own depth of field (aperture px; default none: the lights and drops carry their own) */
  dof?: number;
  /** draw the frozen raindrop outside the window (S3) */
  drop?: boolean;
  /** the lit screen as the room's one lamp (S8): it throws its light up onto the ceiling, which bounces a
   *  little of it back down onto the desk and the walls (0..1, how much of the screen is lit) */
  phoneSky?: number;
  /** the street lamp in front of our building as a downward spot (no light through our walls) */
  lampSpot?: boolean;
}

class City {
  scene = new THREE.Scene();
  rainNear = new FrozenRain(60, 0.3, 0.72, 0.0016, 1.3, 3);
  rainMid = new FrozenRain(48, 1.1, 0.85, 0.002, 0.8, 7);
  rainFar = new FrozenRain(40, 4.2, 0.95, 0.0024, 0.45, 11);
  private sheet = new FSPass(SHEET, { ...camUniforms(), center: { value: new THREE.Vector3() }, R: { value: 0 }, wid: { value: 1 }, k: { value: 0 }, fogD: { value: 0 } }, { blending: THREE.AdditiveBlending, transparent: true });

  lights!: LightPoints;
  /** frozen drops beaded on the wires (kampung detail) */
  private beads!: LightPoints;
  private screenMat!: THREE.ShaderMaterial;
  private roomLight = new THREE.PointLight(col(LIN.paper), 0, 6, 2);
  private drop = new HeroDrop(DROP, DROP_R);
  private towerFlash = new THREE.PointLight(col(LIN.ice), 0, 55, 2);
  private towerGlow = glowSprite(LIN.ice);
  private photonHalo = glowSprite(LIN.ice);
  private photonCore = glowSprite([0.9, 1.6, 4.0]);
  private antLight = new THREE.PointLight(col(LIN.ice), 0, 2.5, 2);
  // a screen emits like a flat diffuser (intensity ∝ cos θ): a wide soft cone straight up from its face,
  // and the pool it makes on the white ceiling lighting the room below it again
  private phoneUp = new THREE.SpotLight(col(SCREEN_WHITE), 0, 9, 1.45, 1, 2);
  private ceilBounce = new THREE.RectAreaLight(col(SCREEN_WHITE), 0, 2.6, 2.6);
  private antGlow = glowSprite(LIN.ice);
  private streak!: THREE.Mesh;
  private streakMat!: THREE.MeshBasicMaterial;
  /** the lamps' pools of light on the ground (x, z, strength, radius m): painted into the ground and read back as a light field */
  private pools: Pool[] = [];
  /** the fog density this frame (for the light added on the ground) */
  private fogU = { value: 0.0007 };
  /** the glow of the lamps in the rainy air */
  halos!: LightPoints;
  /** the environment the outdoor materials see: the glowing overcast above, the lit streets below */
  private env!: THREE.Texture;
  // the wet street's reflection: the scene from the camera mirrored in the ground (full resolution)
  private refl = makeRT(W, H);
  private reflCam = new THREE.PerspectiveCamera();
  private noRefl: THREE.Object3D[] = [];
  private static CLIP = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)];
  /** the street lamp in front of our building: it lights the facade under the window (S3 exit, S8 approach) */
  private facadeLamp = new THREE.PointLight(col(WARM_LAMP), 12, 32, 2);
  /** the same lamp as it really throws its light: down and out, nothing upward (a point light, with no
   *  shadows here, also lit our room through the wall above it). S3, S4, S8; S9 keeps the old one */
  private facadeSpot = new THREE.SpotLight(col(WARM_LAMP), 12, 32, 1.45, 0.45, 2);
  /** the sheer curtain at our window (S3, S4, S8; S9 looks down at the desk) */
  private vitrase = new THREE.Group();
  private vitraseU = { sky: { value: 0 } };
  private haloBuf = { p: [] as number[], c: [] as number[], r: [] as number[] };
  /** A street lamp's glow in the rain around it (a few metres of lit drops and mist), relative strength k. */
  private halo(x: number, y: number, z: number, k = 1, r = 2.6) {
    const b = this.haloBuf, a = 0.05 * k;
    b.p.push(x, y, z); b.c.push(WARM_LAMP[0] * a, WARM_LAMP[1] * a, WARM_LAMP[2] * a); b.r.push(r);
  }

  init(ctx: Ctx) {
    const s = this.scene;
    s.fog = new THREE.FogExp2(FOG, 0.0011);
    s.add(new THREE.HemisphereLight(0x1a2030, 0x040404, 0.9));
    const glow = new THREE.DirectionalLight(0x6f7f9f, 0.22); glow.position.set(0.3, 1, -0.4); s.add(glow);
    RectAreaLightUniformsLib.init();
    s.add(this.phoneUp, this.phoneUp.target, this.ceilBounce);
    s.add(this.roomLight, this.towerFlash, this.towerGlow, this.photonHalo, this.photonCore, this.antLight, this.antGlow, this.facadeLamp);
    this.reflCam.layers.enable(FX_LAYER);
    const rnd = mulberry32(21);
    const R = (a: number, b: number) => a + (b - a) * rnd();
    const rnd2 = mulberry32(22), rnd3 = mulberry32(25);

    // sky: the overcast lit from below by the city, its lumpy base catching more light where it hangs lower
    const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
      fragmentShader: /* glsl */ `varying vec3 vD;
        ${SKY_GLSL}
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float y = max(vD.y, 0.0);
          vec3 c = skyGlow(vec3(vD.x, y, vD.z));
          // the cloud base, seen from under it: lumps hanging lower catch more of the city's light, the
          // gaps between them stay dark; brighter over the city's centre (the towers, down −z)
          vec2 p = vD.xz / max(vD.y, 0.04) * 0.9;
          float cl = n(p) * 0.5 + n(p * 2.1 + 3.1) * 0.25 + n(p * 4.3 + 7.7) * 0.15 + n(p * 9.7 + 1.3) * 0.1;
          float lump = smoothstep(0.28, 0.78, cl);
          float up = smoothstep(0.03, 0.25, y);
          // (none at the horizon itself: there the sky meets the lit rain (fog) of the same colour)
          c *= mix(1.0, 0.34 + 1.32 * lump, up) * (1.0 + 0.3 * max(0.0, -vD.z) * smoothstep(0.02, 0.15, y) * (1.0 - y));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    sky.renderOrder = -100;
    s.add(sky);
    this.env = this.skyEnv(ctx);

    // ground: asphalt, concrete, earth, wet (groundAt); the pools of lamp light are painted on it below, the
    // reflection added in its shader
    const groundMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), 0.0, null, 0, true, undefined,
      { key: 'ground', head: `${KCELL_GLSL}\n${GROUND_GLSL}\n${POOL_RGB_GLSL}`, surf: GROUND_SURF, light: GROUND_LIGHT });
    groundMat.defines!.GROUND_ZONES = '';
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 20000).rotateX(-Math.PI / 2).translate(0, 0, SHORE_Z + 10000), groundMat);
    s.add(ground);
    this.noRefl.push(ground);
    this.buildShore(ctx);

    // kampung: gable-roofed houses in a jittered grid with streets; lit windows and street lamps as points
    const wallG = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const roofShape = new THREE.Shape([new THREE.Vector2(-0.56, 0), new THREE.Vector2(0.56, 0), new THREE.Vector2(0, 0.42)]);
    const roofG = new THREE.ExtrudeGeometry(roofShape, { depth: 1.08, bevelEnabled: false }).translate(0, 0, -0.54);
    const houses: THREE.Matrix4[] = [], roofs: THREE.Matrix4[] = [];
    const pts: number[] = [], pcol: number[] = [], prad: number[] = [];
    const light = (x: number, y: number, z: number, c: [number, number, number], k: number, r: number) => { pts.push(x, y, z); pcol.push(c[0] * k, c[1] * k, c[2] * k); prad.push(r); };
    // the light each lamp and window throws on the ground around it (painted once, below)
    const pools = this.pools;   // x, z, strength, radius (m), stretch across x / along z
    const lampList: Lamp[] = [], houseList: House[] = [];
    const lamp = (x: number, z: number, k: number, ns: boolean, x0: number, z0: number) => { light(x, 6.2, z, warm, k, 0.12); this.halo(x, 6.2, z, k / 3.2); lampList.push({ x, z, ns, x0, z0 }); };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p3 = new THREE.Vector3();
    const warm: [number, number, number] = [1.0, 0.93, 0.82];
    // kampung colours (sRGB): walls in pale limewash and faded paint; roofs of clay tile, rusted zinc, cement
    const WALLS = [0xb8b0a2, 0xa9ad9f, 0xb3a894, 0x9fa7ab, 0xc0b6a4, 0x9a948a].map((c) => new THREE.Color(c));
    const ROOFS = [0x8c4a33, 0x7a3f2c, 0x6f6962, 0x847f76, 0x5b534c, 0x94553a].map((c) => new THREE.Color(c));
    const wallC: THREE.Color[] = [], roofC: THREE.Color[] = [];
    const rndC = mulberry32(23);   // own stream: the city keeps its layout
    const fill: [number, number][] = [];
    for (let gx = -40; gx <= 40; gx++) for (let gz = -175; gz <= 30; gz++) {
      const x0 = gx * 10.5, z0 = gz * 10.5;
      if (gx % 6 === 0 || gz % 7 === 0) {   // streets: lamps every other block
        // (the streets that crossed under our building are houses now: no lamp there, nor inside our walls;
        // the draws stay, so the rest of the city keeps its layout)
        const off = filledCell(gx, gz) || (gx === 0 && gz === 0);
        if (gx % 6 === 0 && gz % 2 === 0 && rnd() < 0.7 && !off) { lamp(x0 + 2.5, z0, 3.2, true, x0, z0); pools.push([x0 + 2.5, z0, 1.2, 7, 0.6, 1.9]); }
        // the cross streets have lamps too (own draw, so the rest of the city keeps its layout)
        if (gz % 7 === 0 && gx % 6 !== 0 && gx % 2 === 0 && rnd2() < 0.6 && !off) { lamp(x0, z0 + 2.5, 3.0, false, x0, z0); pools.push([x0, z0 + 2.5, 1.1, 7, 1.9, 0.6]); }
        // and in between (own draw): a lamp at every block, so the streets read as lit lines from above
        if (gx % 6 === 0 && gz % 2 !== 0 && rnd3() < 0.6 && !off) { lamp(x0 + 2.5, z0, 2.9, true, x0, z0); pools.push([x0 + 2.5, z0, 1.0, 7, 0.6, 1.9]); }
        if (gz % 7 === 0 && gx % 6 !== 0 && gx % 2 !== 0 && rnd3() < 0.5 && !off) { lamp(x0, z0 + 2.5, 2.7, false, x0, z0); pools.push([x0, z0 + 2.5, 0.9, 7, 1.9, 0.6]); }
        if (filledCell(gx, gz)) fill.push([gx, gz]);
        continue;
      }
      if (Math.abs(x0) < 9 && z0 > -6 && z0 < 14) continue;          // our building
      if (p3.set(x0 - TOWER.x, 0, z0 - TOWER.z).length() < 14) continue; // tower plot
      if (rnd() < 0.12) continue;
      const w = R(5.5, 8.5), d = R(6.5, 9.5), h = R(3.2, 6.8) * (rnd() < 0.15 ? 1.8 : 1), ry = (rnd() < 0.5 ? 0 : Math.PI / 2) + R(-0.05, 0.05);
      const x = x0 + R(-1.2, 1.2), z = z0 + R(-1.2, 1.2);
      q.setFromAxisAngle(V(0, 1, 0), ry);
      // (at the kampung's ragged edge the city's blocks have taken some plots: the draws stay)
      const keep = kampungAt(x, z);
      const wc = WALLS[Math.floor(rndC() * WALLS.length)]!.clone().multiplyScalar(0.8 + 0.3 * rndC());
      const rc = ROOFS[Math.floor(rndC() * ROOFS.length)]!.clone().multiplyScalar(0.75 + 0.35 * rndC());
      if (keep) {
        houses.push(m4.clone().compose(p3.set(x, 0, z), q, sc.set(w, h, d)));
        roofs.push(m4.clone().compose(p3.set(x, h, z), q, sc.set(w, w * 0.9, d)));
        wallC.push(wc); roofC.push(rc);
        houseList.push({ x, z, w, d, h, ry, gx, gz, color: wc, roof: 'gable', door: doorDir(gx, gz) });
      }
      const nw = rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0;
      for (let k = 0; k < nw; k++) {
        const side = rnd() < 0.5 ? 1 : -1, along = R(-0.35, 0.35);
        const lx = x + Math.cos(ry) * along * w + Math.sin(ry) * side * (d * 0.5 + 0.3), lz = z - Math.sin(ry) * along * w + Math.cos(ry) * side * (d * 0.5 + 0.3);
        const wk = R(0.25, 1.1);
        R(1.4, h - 0.8);   // (the windows are in the walls' shader now; the draw keeps the city's layout)
        if (keep) pools.push([lx + Math.sin(ry) * side * 1.2, lz + Math.cos(ry) * side * 1.2, wk * 0.5, 4.0]);
      }
    }
    // the cells that closed the streets around our building: houses from their own stream (the one behind it
    // just clear of its back wall, the two beside it flanking the end of the gang)
    {
      const rf = mulberry32(46), F = (a: number, b: number) => a + (b - a) * rf();
      for (const [gx, gz] of fill) {
        const x0 = gx * CELL, z0 = gz * CELL;
        const ry = (rf() < 0.5 ? 0 : Math.PI / 2) + F(-0.04, 0.04), turned = ry > 0.8;
        let w = F(5.5, 8.5), d = F(6.5, 9.5);
        if (gz === 1) { if (turned) w = F(5.0, 6.4); else d = F(5.0, 6.4); }
        const h = F(3.2, 6.8);
        const ex = (turned ? d : w) / 2, ez = (turned ? w : d) / 2;
        let x = x0 + F(-0.3, 0.3), z = z0 + F(-1, 1);
        if (gz === 1) z = 8.8 + ez;                                                    // (our back wall: z 8.2)
        if (gz === 0) x = gx > 0 ? Math.max(x, 4.9 + ex) : Math.min(x, -4.9 - ex);    // (our side walls: |x| 4.2)
        q.setFromAxisAngle(V(0, 1, 0), ry);
        houses.push(m4.clone().compose(p3.set(x, 0, z), q, sc.set(w, h, d)));
        roofs.push(m4.clone().compose(p3.set(x, h, z), q, sc.set(w, w * 0.9, d)));
        wallC.push(WALLS[Math.floor(rf() * WALLS.length)]!.clone().multiplyScalar(0.8 + 0.3 * rf()));
        roofC.push(ROOFS[Math.floor(rf() * ROOFS.length)]!.clone().multiplyScalar(0.75 + 0.35 * rf()));
        houseList.push({ x, z, w, d, h, ry, gx, gz, color: wallC[wallC.length - 1]!, roof: 'gable', door: doorDir(gx, gz) });
        const nw = rf() < 0.55 ? 1 + Math.floor(rf() * 3) : 0;
        for (let k = 0; k < nw; k++) {
          const side = rf() < 0.5 ? 1 : -1, along = F(-0.35, 0.35);
          const lx = x + Math.cos(ry) * along * w + Math.sin(ry) * side * (d * 0.5 + 0.3), lz = z - Math.sin(ry) * along * w + Math.cos(ry) * side * (d * 0.5 + 0.3);
          pools.push([lx + Math.sin(ry) * side * 1.2, lz + Math.cos(ry) * side * 1.2, F(0.25, 1.1) * 0.5, 4.0]);
        }
      }
    }
    // What makes it a Jakarta kampung and not a suburb: the roofs (clay-tile gables, a few hipped; flat
    // concrete slabs (dak) with a parapet, the water tank and the washing up there; single slopes of
    // corrugated zinc) and the houses that grew (rumah tumbuh): a room built later on the slab, a kitchen or a
    // shop built out into the gap toward the neighbour, leaving a gang a metre wide. The footprints stay (the
    // poles, the wires, the camera paths know them); own streams, so the city keeps its layout.
    const rt = mulberry32(44), re = mulberry32(45), E = (a: number, b: number) => a + (b - a) * re();
    const gableM: THREE.Matrix4[] = [], gableC: THREE.Color[] = [], hipM: THREE.Matrix4[] = [], hipC: THREE.Color[] = [];
    const dakM: THREE.Matrix4[] = [], dakC: THREE.Color[] = [], sengM: THREE.Matrix4[] = [], sengC: THREE.Color[] = [];
    const annexM: THREE.Matrix4[] = [], annexC: THREE.Color[] = [];
    // zinc (bare, rusting, painted blue or green spandek), grey asbestos-cement; cast concrete; bare render, brick
    const SENG = [0x8b8f92, 0x7c8084, 0x7a4a32, 0x6b4a3a, 0x9a9890, 0x3f5a72, 0x45604c].map((c) => new THREE.Color(c));
    const DAK = [0x7d7a74, 0x6e6b66, 0x8a867e, 0x5f5c58].map((c) => new THREE.Color(c));
    const BARE = [0x8f8c86, 0x7f7b75, 0x8a5a48].map((c) => new THREE.Color(c));
    const pickC = (a: THREE.Color[], r: () => number) => a[Math.floor(r() * a.length)]!.clone().multiplyScalar(0.8 + 0.3 * r());
    const nearUs = (x: number, z: number, m: number) => Math.abs(x) < 4.2 + m && z > -1.15 - m && z < 8.2 + m;
    /** a single slope of zinc: centre (x, z) at height y, falling toward world axis (ax, az), run L, width wid */
    const seng = (x: number, z: number, y: number, ax: number, az: number, L: number, wid: number, rise: number, c: THREE.Color) => {
      q.setFromAxisAngle(V(0, 1, 0), Math.atan2(-az, ax));
      sengM.push(m4.clone().compose(p3.set(x, y, z), q, sc.set(L, rise, wid))); sengC.push(c);
    };
    houseList.forEach((hs, i) => {
      const c = Math.cos(hs.ry), s2 = Math.sin(hs.ry);
      const Wl = (u: number, v: number): [number, number] => [hs.x + c * u + s2 * v, hs.z - s2 * u + c * v];
      // the house's local axes in the world: u (along w) and v (along d)
      const AU: [number, number] = [c, -s2], AV: [number, number] = [s2, c];
      const u0 = rt();
      const roof: Roof = hs.h > 7 ? (u0 < 0.55 ? 'flat' : u0 < 0.9 ? 'gable' : 'hip') : u0 < 0.38 ? 'gable' : u0 < 0.66 ? 'flat' : u0 < 0.9 ? 'shed' : 'hip';
      hs.roof = roof;
      const df = doorFace(hs);
      if (roof === 'gable') { gableM.push(roofs[i]!); gableC.push(roofC[i]!); }
      else if (roof === 'hip') { hipM.push(roofs[i]!); hipC.push(roofC[i]!); }
      else if (roof === 'flat') {
        q.setFromAxisAngle(V(0, 1, 0), hs.ry);
        dakM.push(m4.clone().compose(p3.set(hs.x, hs.h, hs.z), q, sc.set(hs.w, 1, hs.d))); dakC.push(pickC(DAK, rt));
      } else {
        // the slope falls toward the door (the rain off the front, over the terrace)
        const A = df.onU ? AU : AV, sg = df.sign, L = df.onU ? hs.w : hs.d;
        seng(hs.x, hs.z, hs.h, A[0] * sg, A[1] * sg, L, df.onU ? hs.d : hs.w, SHED_RISE * L, pickC(SENG, rt));
        hs.shed = [A[0] * sg, A[1] * sg, L];
      }
      // a room built later on the slab (a lean-to of zinc over it)
      if (roof === 'flat' && hs.h < 7.5 && re() < 0.5) {
        const uw = hs.w * E(0.45, 0.7), ud = hs.d * E(0.45, 0.7);
        const ou = (re() < 0.5 ? -1 : 1) * (hs.w - uw) / 2, ov = (re() < 0.5 ? -1 : 1) * (hs.d - ud) / 2;
        const [ux, uz] = Wl(ou, ov);
        q.setFromAxisAngle(V(0, 1, 0), hs.ry);
        annexM.push(m4.clone().compose(p3.set(ux, hs.h + 0.15, uz), q, sc.set(uw, 2.7, ud)));
        annexC.push(re() < 0.5 ? hs.color.clone().multiplyScalar(E(0.85, 1.0)) : pickC(BARE, re));
        const sg = re() < 0.5 ? 1 : -1;
        seng(ux, uz, hs.h + 2.85, AU[0] * sg, AU[1] * sg, uw, ud, SHED_RISE * uw, pickC(SENG, re));
        hs.upper = { u: ou, v: ov, w: uw, d: ud };
      }
      // a kitchen or a shop built out into the gap toward the neighbour (not on the door's side, never into a
      // street, nor near our building or the tower's plot)
      if (re() < 0.75) {
        const k0 = Math.floor(re() * 4), L0 = E(0, 1), W0 = E(0.45, 0.85), O0 = E(-1, 1), H0 = E(2.5, 3.1), C0 = re();
        for (let k = 0; k < 4; k++) {
          const [dx, dz] = ([[1, 0], [0, 1], [-1, 0], [0, -1]] as const)[(k0 + k) % 4]!;
          if (dx === hs.door[0] && dz === hs.door[1]) continue;
          const nx = hs.gx + dx, nz = hs.gz + dz;
          if (nx < K_GX[0] || nx > K_GX[1] || nz < K_GZ[0] || nz > K_GZ[1] || isStreet(nx, nz)) continue;
          const du = dx * AU[0] + dz * AU[1], onU = Math.abs(du) > 0.5, sg = Math.sign(onU ? du : dx * AV[0] + dz * AV[1]);
          const A: [number, number] = onU ? [AU[0] * sg, AU[1] * sg] : [AV[0] * sg, AV[1] * sg];
          const half = onU ? hs.w / 2 : hs.d / 2, span = onU ? hs.d : hs.w;
          const gap = (hs.gx * dx + hs.gz * dz) * CELL + CELL / 2 - (hs.x * dx + hs.z * dz) - half - 0.6;
          if (gap < 1.2) continue;
          const L = Math.min(gap, 1.2 + L0 * 3.3), wid = span * W0, off = O0 * (span - wid) / 2;
          const cx = hs.x + A[0] * (half + L / 2) - A[1] * off, cz = hs.z + A[1] * (half + L / 2) + A[0] * off;
          if (nearUs(cx, cz, 2.5) || Math.hypot(cx - TOWER.x, cz - TOWER.z) < 30) break;
          const ha = Math.min(H0, hs.h - 0.35);
          q.setFromAxisAngle(V(0, 1, 0), Math.atan2(-A[1], A[0]));
          annexM.push(m4.clone().compose(p3.set(cx, 0, cz), q, sc.set(L, ha, wid)));
          annexC.push(C0 < 0.5 ? hs.color.clone().multiplyScalar(0.9) : pickC(BARE, re));
          // its zinc falls away from the house, under the house's eaves
          seng(cx, cz, ha, A[0], A[1], L, wid, Math.max(0.05, Math.min(SHED_RISE * L, hs.h - ha - 0.05)), pickC(SENG, re));
          break;
        }
      }
      // the porch lamp beside the door (kampung.ts PORCH; the walls' shader lights the wall around it)
      if (ihash(hs.gx, hs.gz, 1) < PORCH.p) {
        const along = Math.min(df.along + PORCH.beside, df.Wd / 2 - 0.25);
        const out = df.half + PORCH.out;
        const [lx, lz] = df.onU ? Wl(df.sign * out, along) : Wl(along, df.sign * out);
        const warmB = ihash(hs.gx, hs.gz, 2) < PORCH.warmP;
        light(lx, PORCH.y, lz, warmB ? BULB_WARM : WARM_LAMP, 0.5, 0.03);
        this.halo(lx, PORCH.y, lz, 0.07, 0.8);
        pools.push([lx + hs.door[0] * 1.1, lz + hs.door[1] * 1.1, 0.8, 5.0, 1, 1, warmB]);
      }
    });
    // walls: limewash (a door to the street, a porch lamp by it), lit by the sky and the lamps in their street;
    // roofs: wet, so they also mirror the glowing sky
    const WIN_K: Record<string, number> = { FLOOR_H: 3.0, BAY_W: 2.7, WIN_W: 1.0, WIN_H: 1.25, SILL: 0.95, LIT_P: 0.34, WIN_K: 1.0 };
    const wallMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), 11.0, this.env, 0.45, false,
      { ...WIN_K, KAMPUNG_DOOR: 1, PORCH_P: PORCH.p, PORCH_W: PORCH.warmP, PORCH_Y: PORCH.y, PORCH_O: PORCH.out, PORCH_B: PORCH.beside, PORCH_I: 7 },
      { key: 'kwall', head: KCELL_GLSL, light: 'irradiance += porchE;' });
    // (what grew later: lower rooms, smaller windows, no door of their own toward the street)
    const annexMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), 11.0, this.env, 0.45, false,
      { ...WIN_K, WIN_H: 0.8, SILL: 1.0, NO_DOOR: 1 });
    const tileMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x8c8c8c, roughness: 0.34, metalness: 0.0 }), 4.0, this.env, 2.0, false, undefined,
      { key: 'tile', vhead: 'varying vec3 vRl;', vert: LOCAL_VERT, head: 'varying vec3 vRl;', surf: TILE_SURF });
    const dakMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0 }), 4.0, this.env, 1.0);
    const sengMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.35 }), 4.0, this.env, 1.8, false, undefined,
      { key: 'seng', vhead: 'varying vec3 vRl; varying vec3 vSz;', vert: `${LOCAL_VERT}\nvSz = normalize(mat3(modelViewMatrix) * (mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0)));`, head: 'varying vec3 vRl; varying vec3 vSz;', norm: SENG_NORM });
    const inst = (g: THREE.BufferGeometry, m: THREE.Material, ms: THREE.Matrix4[], cs: THREE.Color[]) => {
      const im = new THREE.InstancedMesh(g, m, Math.max(1, ms.length)); im.count = ms.length;
      ms.forEach((mm, k) => { im.setMatrixAt(k, mm); im.setColorAt(k, cs[k]!); });
      s.add(im);
    };
    inst(wallG, wallMat, houses, wallC);
    inst(wallG, annexMat, annexM, annexC);
    inst(roofG, tileMat, gableM, gableC);
    inst(hipGeometry(), tileMat, hipM, hipC);
    inst(dakGeometry(), dakMat, dakM, dakC);
    inst(sengGeometry(), sengMat, sengM, sengC);

    // a few towers with lit window grids (points), more toward the skyline far down −z; dark glass that
    // mirrors the glowing sky
    const towerMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.5, metalness: 0.2 }), 2.5, this.env, 1.4, false,
      { FLOOR_H: 3.4, BAY_W: 3.0, WIN_W: 2.3, WIN_H: 2.1, SILL: 0.75, LIT_P: 0.3, WIN_K: 1.1 });
    const towers: THREE.Matrix4[] = [];
    for (let i = 0; i < 70; i++) {
      const far = i > 20;
      const x = R(-1800, 1800), z = far ? R(-2550, -1950) : R(-1700, 200);
      if (Math.abs(x) < 60 && z > -80) continue;
      const w = R(18, 38), d = R(18, 38), h = far ? R(60, 220) : R(24, 70);
      towers.push(m4.clone().compose(p3.set(x, 0, z), q.identity(), sc.set(w, h, d)));
      light(x, h + 1.5, z, [1, 1, 1], 5, 0.4);   // obstruction light
      // (the windows are in the towers' shader now; these draws, once lit windows, keep the city's layout)
      const floors = Math.floor(h / 3.4), cols = Math.floor(w / 3.2);
      for (let f = 1; f < floors; f++) for (let c2 = 0; c2 < cols; c2++) {
        if (rnd() > (far ? 0.16 : 0.26)) continue;
        R(0.6, 2.4); if (rnd() < 0.5) rnd();
      }
    }
    const towersI = new THREE.InstancedMesh(wallG, towerMat, towers.length); towers.forEach((m, i) => towersI.setMatrixAt(i, m));
    s.add(towersI);
    // the rest of the city around the kampung (seen from the tower chase and the dive home): flat-roofed
    // blocks with windows, between the streets the far lamps stand on (their warped grid, below), not in
    // the port, the tower's plot or the kampung
    {
      const rb = mulberry32(24), B = (a: number, b: number) => a + (b - a) * rb();
      const blocks: THREE.Matrix4[] = [], bc: THREE.Color[] = [];
      for (let x = -3200; x <= 3200; x += 21) for (let z = -2630; z <= 2400; z += 21) {
        const bx = x + B(-4, 4), bz = z + B(-4, 4);
        if (rb() < 0.3) continue;
        if (Math.abs(bx) < 438 && bz > -1858 && bz < 338) continue;          // the kampung
        if (bz < -1850 && bx > -960 && bx < 760) continue;                     // the port
        if (Math.abs(bx - TOWER.x) < 30 && Math.abs(bz - TOWER.z) < 30) continue;
        const rx = bx - Math.sin(bz * 0.002) * 60, roadX = Math.round(rx / 90) * 90 + Math.sin(bz * 0.002) * 60;
        const rz = bz - Math.sin(bx * 0.003) * 50, roadZ = Math.round(rz / 110) * 110 + Math.sin(bx * 0.003) * 50;
        if (Math.abs(bx - roadX) < 11 || Math.abs(bz - roadZ) < 10) continue;   // the streets
        const tall = rb() < 0.06;
        const w = B(9, 17), d = B(9, 17), h = tall ? B(18, 45) : B(4, 13);
        q.setFromAxisAngle(V(0, 1, 0), B(-0.04, 0.04));
        blocks.push(m4.clone().compose(p3.set(bx, 0, bz), q, sc.set(w, h, d)));
        bc.push(WALLS[Math.floor(rb() * WALLS.length)]!.clone().multiplyScalar(0.7 + 0.35 * rb()));
      }
      // the kampung's ragged edge: blocks on the plots its houses gave up (own stream; clear of the houses
      // left, the cable street and the tower's plot)
      {
        const rk = mulberry32(47), K = (a: number, b: number) => a + (b - a) * rk();
        for (let x = -480; x <= 480; x += 21) for (let z = -1900; z <= 380; z += 21) {
          const bx = x + K(-4, 4), bz = z + K(-4, 4), w = K(9, 15), d = K(9, 15), h = rk() < 0.06 ? K(14, 30) : K(4, 11), yaw = K(-0.04, 0.04), cc = rk(), ck = rk();
          if (rk() < 0.3 || !(Math.abs(bx) < 438 && bz > -1858 && bz < 338)) continue;
          const hw = Math.max(w, d) / 2 + 6;
          if (kampungAt(bx - hw, bz - hw) || kampungAt(bx + hw, bz - hw) || kampungAt(bx - hw, bz + hw) || kampungAt(bx + hw, bz + hw)) continue;
          if ((Math.abs(bx + 189) < 22 && bz < -1150) || Math.hypot(bx - TOWER.x, bz - TOWER.z) < 40) continue;
          q.setFromAxisAngle(V(0, 1, 0), yaw);
          blocks.push(m4.clone().compose(p3.set(bx, 0, bz), q, sc.set(w, h, d)));
          bc.push(WALLS[Math.floor(cc * WALLS.length)]!.clone().multiplyScalar(0.7 + 0.35 * ck));
        }
      }
      const blockMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), 7.0, this.env, 0.6, false,
        { FLOOR_H: 3.2, BAY_W: 3.0, WIN_W: 1.3, WIN_H: 1.4, SILL: 0.9, LIT_P: 0.3, WIN_K: 0.95, FLAT_ROOF: 1 });
      const blocksI = new THREE.InstancedMesh(wallG, blockMat, blocks.length);
      blocks.forEach((m, i) => { blocksI.setMatrixAt(i, m); blocksI.setColorAt(i, bc[i]!); });
      s.add(blocksI);
    }
    // the far carpet of the city (for the dive from above): lamps along a warped street grid out to ~7 km
    for (let i = 0; i < 90000; i++) {
      const a = R(-7000, 7000), b = R(-2640, 7000);
      const ga = Math.round(a / 90) * 90 + Math.sin(b * 0.002) * 60, gb = b;
      const onRoad = rnd() < 0.6;
      const x = onRoad ? ga : a, z = onRoad ? gb : Math.round(b / 110) * 110 + Math.sin(a * 0.003) * 50;
      if (Math.abs(x) < 450 && z > -1850 && z < 330) continue;
      const k = R(0.6, 3.5);
      light(x, 5, z, warm, k, 0.4);
      pools.push([x, z, k / 3.2, 9, onRoad ? 0.7 : 1.8, onRoad ? 1.8 : 0.7]);
    }
    // the street lamp in front of our building, on the street our window looks down (x ≈ 0)
    const FL = FACADE_LAMP;
    light(FL.x, FL.y - 0.08, FL.z, warm, 3.4, 0.13); this.halo(FL.x, FL.y - 0.08, FL.z, 1.3, 2.4); pools.push([FL.x, FL.z, 1.3, 10, 0.8, 1.5]);
    this.facadeLamp.position.set(FL.x, FL.y - 0.25, FL.z);
    this.facadeSpot.position.set(FL.x, FL.y - 0.05, FL.z); this.facadeSpot.target.position.set(FL.x, 0, FL.z);
    this.facadeSpot.visible = false;
    s.add(this.facadeSpot, this.facadeSpot.target);
    const poleMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.35, metalness: 0.8 }), 0, this.env, 1.5);
    const pole = new THREE.Mesh(mergeGeometries([
      new THREE.CylinderGeometry(0.06, 0.085, FL.y + 0.25, 12).translate(FL.x + 0.85, (FL.y + 0.25) / 2, FL.z),   // post
      new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8).rotateZ(Math.PI / 2 + 0.12).translate(FL.x + 0.42, FL.y + 0.2, FL.z), // arm
      new THREE.BoxGeometry(0.46, 0.09, 0.2).translate(FL.x, FL.y + 0.07, FL.z),                                          // head
    ]), poleMat);
    s.add(pole);
    // (the lamp's face: the LED panel under the head)
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14).rotateX(Math.PI / 2).translate(FL.x, FL.y + 0.02, FL.z), new THREE.MeshBasicMaterial({ color: col(WARM_LAMP, 1.15), toneMapped: false }));
    s.add(face);
    // the kampung up close: poles and wires, tanks, dishes, AC units, front walls and gates, washing
    this.buildDetail(lampList, houseList, warm);
    this.groundGlow(pools, warm);
    this.lights = new LightPoints(new Float32Array(pts), new Float32Array(pcol), new Float32Array(prad));
    s.add(this.lights.mesh, this.rainNear.mesh, this.rainMid.mesh, this.rainFar.mesh);
    this.noRefl.push(this.rainNear.mesh, this.rainMid.mesh, this.rainFar.mesh);
    for (const r of [this.rainNear, this.rainMid, this.rainFar]) {
      (r.u.keepOut!.value as THREE.Vector4).set(-4.3, 4.3, WIN.z - 0.25, 8.3); r.u.keepOutY!.value = 10.9;
      r.u.poolN = LIGHT_U.poolN; r.u.poolF = LIGHT_U.poolF; r.u.boxN = LIGHT_U.boxN; r.u.boxF = LIGHT_U.boxF;
      r.u.lampK!.value = 1.6; (r.u.lampC!.value as THREE.Vector3).set(...WARM_LAMP);
    }

    // the lattice cell tower
    const steel = outdoor(new THREE.MeshStandardMaterial({ color: 0x4a4e55, roughness: 0.45, metalness: 0.7 }), 1.5, this.env, 1.6);
    const bars: THREE.BufferGeometry[] = [];
    const bar = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
      const len = a.distanceTo(b);
      const g = new THREE.BoxGeometry(r, len, r);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const qq = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
      g.applyMatrix4(new THREE.Matrix4().compose(mid, qq, V(1, 1, 1)));
      bars.push(g);
    };
    const halfW = (y: number) => 3.6 - (3.6 - 0.9) * (y / TOWER_H);
    const corner = (y: number, i: number) => { const hw = halfW(y); return V(TOWER.x + (i & 1 ? hw : -hw), y, TOWER.z + (i & 2 ? hw : -hw)); };
    const order = [0, 1, 3, 2];
    for (let i = 0; i < 4; i++) bar(corner(0, i), corner(TOWER_H, i), 0.28);
    for (let y = 0; y < TOWER_H - 0.1; y += 3) {
      for (let f = 0; f < 4; f++) {
        const a = order[f]!, b = order[(f + 1) % 4]!;
        bar(corner(y + 3, a), corner(y + 3, b), 0.12);
        bar(corner(y, a), corner(y + 3, b), 0.08);
        bar(corner(y, b), corner(y + 3, a), 0.08);
      }
    }
    const tower = new THREE.Mesh(mergeGeometries(bars), steel);
    s.add(tower);
    // platform + three sectors of panel antennas + a microwave dish
    const panelMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.45 }), 0, this.env, 1.6);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.4;
      for (let j = -1; j <= 1; j += 2) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.5, 0.12), panelMat);
        const r = 1.6;
        p.position.set(TOWER.x + Math.cos(a) * r - Math.sin(a) * j * 0.35, TOWER_H - 1.2, TOWER.z + Math.sin(a) * r + Math.cos(a) * j * 0.35);
        p.rotation.y = -a + Math.PI / 2;
        s.add(p);
      }
    }
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 32).rotateX(Math.PI / 2), panelMat);
    dish.position.set(TOWER.x + 1.2, TOWER_H - 5, TOWER.z + 1.2); s.add(dish);
    const beacon = new LightPoints(new Float32Array([TOWER.x, TOWER_H + 0.6, TOWER.z]), new Float32Array([4, 4, 4]), new Float32Array([0.25]));
    s.add(beacon.mesh);
    this.beacon = beacon;
    // the streak down the tower (fibre from the radios to the ground)
    this.streakMat = new THREE.MeshBasicMaterial({ color: col(LIN.ice, 4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.streak = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1).translate(0, -0.5, 0), this.streakMat);
    this.streak.position.set(TOWER.x - halfW(TOWER_H) * 0.5, TOWER_H - 1, TOWER.z - halfW(TOWER_H) * 0.5);
    s.add(this.streak);

    // our building (walls around the room, the window hole), the room, the desk, the phone
    const bMat = new THREE.MeshStandardMaterial({ color: 0x1e1d1c, roughness: 0.9 });
    const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material = bMat) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
      b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); s.add(b); return b;
    };
    const Z0 = WIN.z - 0.2, Z1 = WIN.z;
    box(-4, WIN.x0, 0, 10.5, Z0, Z1); box(WIN.x1, 4, 0, 10.5, Z0, Z1);
    box(WIN.x0, WIN.x1, 0, WIN.y0, Z0, Z1); box(WIN.x0, WIN.x1, WIN.y1, 10.5, Z0, Z1);
    box(-4.2, -4, 0, 10.5, Z0, 8); box(4, 4.2, 0, 10.5, Z0, 8); box(-4, 4, 0, 10.5, 8, 8.2);
    // outside, the building wears its own skin (1 cm): pale plaster lit by the sky and the street lamp in
    // front of it; the walls' inner faces stay the room's (dark, lit by the phone alone)
    // (lit from below by the pool of the lamp in front: the lamp itself throws nothing upward)
    const facadeMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xa39c90, roughness: 0.8 }), 5.0, this.env, 0.25, false, undefined,
      { key: 'facade', head: 'uniform float roomGlow;', surf: FACADE_SURF });
    const SK = 0.011;
    box(-4.2, WIN.x0, 0, 10.5, Z0 - SK, Z0, facadeMat); box(WIN.x1, 4.2, 0, 10.5, Z0 - SK, Z0, facadeMat);
    box(WIN.x0, WIN.x1, 0, WIN.y0 - 0.04, Z0 - SK, Z0, facadeMat); box(WIN.x0, WIN.x1, WIN.y1 + 0.04, 10.5, Z0 - SK, Z0, facadeMat);
    box(-4.2 - SK, -4.2, 0, 10.5, Z0 - SK, 8.2 + SK, facadeMat); box(4.2, 4.2 + SK, 0, 10.5, Z0 - SK, 8.2 + SK, facadeMat);
    box(-4.2, 4.2, 0, 10.5, 8.2, 8.2 + SK, facadeMat);
    box(-4.2, 4.2, 10.5, 10.8, Z0 - 0.3, 8.2, outdoor(new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 0.45 }), 1.0, this.env, 1.2)); // roof slab (wet)
    // at the front door: a cast concrete canopy over it, the electricity meter (kWh) box beside it
    box(-0.15, 1.4, 2.3, 2.4, Z0 - SK - 0.7, Z0 - SK, outdoor(new THREE.MeshStandardMaterial({ color: 0x8e887e, roughness: 0.7 }), 1.5, this.env, 0.4));
    box(1.3, 1.55, 1.45, 1.8, Z0 - SK - 0.14, Z0 - SK, outdoor(new THREE.MeshStandardMaterial({ color: 0x9a9c98, roughness: 0.5 }), 1.5, this.env, 0.6));
    // a sheer white curtain (vitrase) gathered at the left of our window, on its rod: the phone's cold light
    // on the ceiling shines through it, so from the street our window is the one that glows white, not warm
    // (a lit sheer is what makes a window glow at night). From the room in S3 it is a pale silhouette against
    // the overcast.
    {
      const g = new THREE.PlaneGeometry(0.42, 1.62, 40, 1);
      const pa = g.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < pa.count; k++) { const x = pa.getX(k); pa.setZ(k, 0.028 * Math.sin(x * 70) + 0.012 * Math.sin(x * 23 + 1.3)); }
      g.computeVertexNormals();
      g.translate(-0.58, (WIN.y0 + 0.02 + WIN.y1 + 0.05) / 2, WIN.z + 0.07);
      const curtain = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: this.vitraseU, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
        vertexShader: `varying vec3 vW, vN; void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
        fragmentShader: /* glsl */ `uniform float sky; varying vec3 vW, vN;
          void main(){
            // lit from the room by the ceiling's pool (stronger near the ceiling), from the window by the overcast
            vec3 Er = ${glsl3(SCREEN_WHITE)} * sky * (0.35 + 0.65 * smoothstep(7.9, 9.6, vW.y));
            vec3 Ew = ${glsl3(SKY_HOR)} * 1.2;
            float roomSide = step(vW.z, cameraPosition.z);
            // a sheer reflects ~45 % and lets ~35 % through; the folds turn it toward and away from the light
            float fold = 0.4 + 0.6 * pow(abs(normalize(vN).z), 3.0);
            vec3 L = mix(0.45 * Ew + 0.35 * Er, 0.45 * Er + 0.35 * Ew, roomSide) * fold * vec3(0.92, 0.91, 0.88) * 0.5;
            gl_FragColor = vec4(L, 0.62 + 0.25 * (1.0 - abs(normalize(vN).z)));
          }`,
      }));
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.7, 8).rotateZ(Math.PI / 2).translate(0, WIN.y1 + 0.08, WIN.z + 0.07), indoor(new THREE.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.4, metalness: 0.6 })));
      this.vitrase.add(curtain, rod);
      s.add(this.vitrase);
    }
    box(-4, 4, FLOOR_Y - 0.2, FLOOR_Y, Z1, 8, indoor(new THREE.MeshStandardMaterial({ color: 0x77726b, roughness: 0.35 })));   // ceramic tile floor
    // the bedroom behind the window: a partition 3.6 m back (a door in it) and its side walls, painted
    // off-white; a wardrobe, a bed. Nothing lights them but the phone (its pool on the ceiling), and they
    // sit behind the camera wherever it looks out (S3 start) or down (S9)
    const paint = indoor(new THREE.MeshStandardMaterial({ color: 0xc8c9c9, roughness: 0.9 }));
    const RZ = 3.6;
    box(-4, 0.9, FLOOR_Y, 10.3, RZ, RZ + 0.12, paint); box(1.85, 4, FLOOR_Y, 10.3, RZ, RZ + 0.12, paint); box(0.9, 1.85, FLOOR_Y + 2.1, 10.3, RZ, RZ + 0.12, paint);
    box(0.9, 1.85, FLOOR_Y, FLOOR_Y + 2.1, RZ + 0.5, RZ + 0.62, indoor(new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 0.9 })));   // the dark hall beyond the door
    box(-4, -3.9, FLOOR_Y, 10.3, Z1, RZ, paint); box(3.9, 4, FLOOR_Y, 10.3, Z1, RZ, paint);
    const wood = indoor(new THREE.MeshStandardMaterial({ color: 0x3a2d22, roughness: 0.6 }));
    box(-3.3, -2.0, FLOOR_Y, FLOOR_Y + 2.05, RZ - 0.6, RZ, wood);                                 // wardrobe
    box(-2.66, -2.64, FLOOR_Y + 0.1, FLOOR_Y + 1.95, RZ - 0.61, RZ - 0.6, indoor(new THREE.MeshStandardMaterial({ color: 0x0c0a08 })));
    box(2.0, 3.9, FLOOR_Y, FLOOR_Y + 0.42, 1.4, RZ, wood);                                        // bed: frame,
    box(2.05, 3.85, FLOOR_Y + 0.42, FLOOR_Y + 0.62, 1.45, RZ - 0.05, indoor(new THREE.MeshStandardMaterial({ color: 0x9b978f, roughness: 0.95 })));   // sheet
    // the ceiling: white paint (what the phone's light lands on; the walls stay the room's dark)
    box(-4, 4, 10.3, 10.5, Z1, 8, indoor(new THREE.MeshStandardMaterial({ color: 0xdcd9d2, roughness: 0.95 })));
    const deskTex = woodTexture(mulberry32(31));
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: deskTex.map, roughnessMap: deskTex.rough, roughness: 1, metalness: 0 });
    box(-0.75, 0.75, DESK_Y - 0.04, DESK_Y, -0.9, 0.05, deskMat);
    // window frame + pane with drops frozen on it
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.4, metalness: 0.6 });
    box(WIN.x0, WIN.x1, WIN.y0 - 0.04, WIN.y0, WIN.z - 0.2, WIN.z, frameMat); box(WIN.x0, WIN.x1, WIN.y1, WIN.y1 + 0.04, WIN.z - 0.2, WIN.z, frameMat);
    box(-0.02, 0.02, WIN.y0, WIN.y1, WIN.z - 0.12, WIN.z - 0.06, frameMat);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: `varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec2 vU;
        vec2 h2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
        void main(){
          vec2 p = vU * 90.0;
          vec2 i = floor(p); vec2 f = fract(p);
          vec2 o = h2(i); float r = 0.08 + 0.3 * h2(i + 7.0).x;
          float d = length(f - o * 0.6 - 0.2);
          float drop = h2(i + 3.0).x < 0.55 ? 1.0 : 0.0;
          float rim = smoothstep(r, r * 0.8, d) * smoothstep(r * 0.45, r * 0.85, d) * drop;
          float spec = exp(-length(f - o * 0.6 - 0.2 - vec2(-0.3, 0.3) * r) / (r * 0.18)) * drop;
          // a drop on the pane refracts the glowing sky: a faint rim of it, a darker edge only where it is
          // thin, a small highlight (against the lit overcast a dark ring would read as a soap bubble)
          vec3 c = ${glsl3(SKY_HOR)} * 0.7 * rim + vec3(0.6) * spec * 0.4;
          gl_FragColor = vec4(c, 0.03 + rim * 0.22);
        }`,
    }));
    pane.position.set(0, (WIN.y0 + WIN.y1) / 2, WIN.z - 0.09);
    s.add(pane);
    // the phone: a slab with rounded corners and eased edges (aluminium frame), side buttons, a black glass
    // front; the display under it has rounded corners of its own, a thin border and the camera punch-hole
    const frameAlu = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.3, metalness: 0.9 });
    const EDGE = 0.0012;
    const bodyG = new THREE.ExtrudeGeometry(roundedRect(PHONE.w - 2 * EDGE, PHONE.l - 2 * EDGE, 0.0088), { depth: PHONE.h - 2 * EDGE, bevelEnabled: true, bevelThickness: EDGE, bevelSize: EDGE, bevelSegments: 4, curveSegments: 20 })
      .rotateX(-Math.PI / 2).translate(PHONE.center.x, PHONE.center.y - PHONE.h / 2 + EDGE, PHONE.center.z);
    s.add(new THREE.Mesh(bodyG, frameAlu));
    const glassTop = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(PHONE.w - 0.0009, PHONE.l - 0.0009, 0.0092), 20).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 0.06, metalness: 0.0 }));
    glassTop.position.set(PHONE.center.x, PHONE.center.y + PHONE.h / 2 + 0.0001, PHONE.center.z); s.add(glassTop);
    for (const [sx, z, len] of [[1, -0.02, 0.016], [-1, -0.047, 0.011], [-1, -0.032, 0.011]] as const) {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.0009, 0.0024, len), frameAlu);
      btn.position.set(PHONE.center.x + sx * (PHONE.w / 2 + 0.0002), PHONE.center.y + 0.0004, PHONE.center.z + z); s.add(btn);
    }
    this.screenMat = new THREE.ShaderMaterial({
      uniforms: { scan: { value: 0 }, k: { value: 1 } }, fog: false,
      vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec2 vU; uniform float scan, k;
        void main(){
          float row = (1.0 - vU.y) * 2400.0;
          float lit = row < scan ? 1.0 : 0.0;
          float line = exp(-abs(row - scan) / 6.0) * 0.8;
          vec3 c = vec3(0.95) * lit * k + vec3(0.37, 0.64, 0.98) * line * 0.5 + vec3(0.003);
          // the front camera's punch-hole (row 58, 24 px radius, as in the macro display): black, a faint rim
          float r = length((vU - vec2(0.5, 1.0 - 58.0 / 2400.0)) * vec2(1080.0, 2400.0));
          c = mix(c, vec3(0.004) + vec3(0.05) * exp(-abs(r - 22.0) / 1.2), smoothstep(25.0, 23.0, r));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    // the display's active area: 1.4 mm border, its own rounded corners; uv across that area
    const SW = PHONE.w - 0.0028, SL = PHONE.l - 0.0032;
    const scrG = new THREE.ShapeGeometry(roundedRect(SW, SL, 0.0078), 20);
    const sp = scrG.attributes.position as THREE.BufferAttribute, suv = scrG.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < sp.count; i++) suv.setXY(i, sp.getX(i) / SW + 0.5, sp.getY(i) / SL + 0.5);
    const scr = new THREE.Mesh(scrG.rotateX(-Math.PI / 2), this.screenMat);
    scr.position.set(PHONE.center.x, PHONE.center.y + PHONE.h / 2 + 0.0002, PHONE.center.z);
    s.add(scr);
    // lit windows on our own building (the room's window stays dark but for the phone). Each is an opening
    // with depth: a frame and sash at the face, a 14 cm plaster reveal lit from within, and at the back a
    // curtain glowing with the room lamp behind it (soft folds, parted a little); glass in front with the
    // frozen drops and the sky's sheen. Drawn on one quad per window by tracing the view ray into the recess.
    const panes: THREE.BufferGeometry[] = [];
    const sillMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x9d968a, roughness: 0.6 }), 3.5, this.env, 0.5);
    ([[-2.6, 4.2], [2.4, 4.3], [-2.5, 8.7], [2.7, 1.6], [-1.2, 1.5]] as const).forEach(([x, y], i) => {
      const g = new THREE.PlaneGeometry(1.1, 1.3).rotateY(Math.PI).translate(x, y, Z0 - SK - 0.002);
      g.setAttribute('wid', new THREE.Float32BufferAttribute(new Array(4).fill(i), 1));
      g.setAttribute('wc', new THREE.Float32BufferAttribute([x, y, x, y, x, y, x, y], 2));
      panes.push(g);
      box(x - 0.63, x + 0.63, y - 0.72, y - 0.66, Z0 - 0.09, Z0 - SK, sillMat);   // the sill
      this.halo(x, y, Z0 - 0.5, 0.3, 1.1);                                        // its glow in the rain
    });
    s.add(new THREE.Mesh(mergeGeometries(panes), new THREE.ShaderMaterial({
      fog: false,
      vertexShader: `attribute float wid; attribute vec2 wc; varying vec3 vW; varying vec2 vC; varying float vId;
        void main(){ vId = wid; vC = wc; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `varying vec3 vW; varying vec2 vC; varying float vId;
        ${SKY_GLSL}
        vec2 h2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
        const float HW = 0.55, HH = 0.65, OW = 0.49, OH = 0.59, DEP = 0.14;
        // the curtain at (u, v) across the opening: warm fabric lit from behind
        vec3 curtain(vec2 uv, float id) {
          float u = uv.x, v = uv.y;
          // folds: wide, soft, a little uneven (low contrast: light through fabric, not stripes)
          float ph = u * 6.2831 * 5.0 + 0.9 * sin(u * 6.2831 * 1.7 + id * 2.1);
          float fold = 0.86 + 0.14 * sin(ph) + 0.04 * sin(ph * 2.3 + 1.0);
          // the room lamp behind it: a broad hotspot, upper part of the window, per room
          vec2 lp = vec2(0.3 + 0.4 * fract(id * 0.618), 0.78);
          float hot = 0.42 + 0.58 * exp(-dot((uv - lp) * vec2(1.4, 1.0), (uv - lp) * vec2(1.4, 1.0)) / 0.18);
          // parted a little: the gap shows the lit room (brighter, warmer), the curtain's edges catch it
          float xg = 0.25 + 0.5 * fract(id * 0.37 + 0.2);
          float gap = smoothstep(0.03, 0.008, abs(u - xg)) * step(0.5, fract(id * 0.53 + 0.4));
          vec3 fab = mix(vec3(1.0, 0.68, 0.42), vec3(1.0, 0.8, 0.6), step(0.6, fract(id * 0.71)));
          vec3 c = fab * fold * hot * 0.42;
          c = mix(c, vec3(1.0, 0.86, 0.66) * 0.95 * hot, gap);
          // the hem and the rod shadow
          c *= smoothstep(0.0, 0.05, v) * (1.0 - 0.35 * smoothstep(0.93, 1.0, v));
          // one room is dim (a lamp further back)
          return c * (vId > 2.5 && vId < 3.5 ? 0.45 : 1.0);
        }
        void main(){
          vec3 d = normalize(vW - cameraPosition);        // looking at the facade: d.z > 0 (into the wall)
          vec2 p0 = vW.xy - vC;
          vec3 col;
          bool inOpen = abs(p0.x) < OW && abs(p0.y) < OH;
          if (!inOpen || abs(p0.x) < 0.016) {
            // the frame and the sash bar: dark painted metal, its inner lip lit by the curtain
            float lip = inOpen ? 1.0 : exp(-max(abs(p0.x) - OW, abs(p0.y) - OH) / 0.012);
            col = vec3(0.012, 0.012, 0.013) + vec3(0.09, 0.07, 0.05) * lip * 0.35;
          } else {
            // into the recess: the curtain plane at DEP, or a side of the reveal on the way
            float dz = max(d.z, 1e-3);
            vec2 q = p0 + d.xy * (DEP / dz);
            vec3 inner;
            if (abs(q.x) < OW && abs(q.y) < OH) {
              inner = curtain(vec2((q.x + OW) / (2.0 * OW), (q.y + OH) / (2.0 * OH)), vId);
            } else {
              // which side it met: its depth fraction s (0 at the face .. 1 at the curtain)
              float tx = abs(d.x) > 1e-4 ? ((d.x > 0.0 ? OW : -OW) - p0.x) / d.x : 1e9;
              float ty = abs(d.y) > 1e-4 ? ((d.y > 0.0 ? OH : -OH) - p0.y) / d.y : 1e9;
              float s = clamp(min(tx, ty) * dz / DEP, 0.0, 1.0);
              bool sill = ty < tx && d.y < 0.0;
              // plaster lit by the curtain: brighter toward it; the sill (facing up) catches more
              vec3 glow = curtain(vec2(0.5, 0.6), vId);
              inner = glow * vec3(0.95, 0.9, 0.84) * (0.12 + 0.55 * s * s) * (sill ? 1.3 : 0.85);
            }
            // the glass: frozen drops on it, and the glowing sky mirrored at a glance
            float F = 0.04 + 0.96 * pow(1.0 - clamp(dz, 0.0, 1.0), 5.0);
            vec3 sky = skyGlow(reflect(d, vec3(0.0, 0.0, -1.0)));
            vec2 pp = p0 * 55.0, ci = floor(pp), cf = fract(pp);
            vec2 o = h2(ci); float r = 0.1 + 0.3 * h2(ci + 7.0).x;
            float dd = length(cf - o * 0.6 - 0.2);
            float drop = h2(ci + 3.0).x < 0.5 ? 1.0 : 0.0;
            float rim = smoothstep(r, r * 0.8, dd) * smoothstep(r * 0.45, r * 0.85, dd) * drop;
            // a drop on lit glass is a tiny lens: bright where it refracts the curtain, dark at its rim
            col = inner * (1.0 - 0.45 * rim) + inner * 0.5 * smoothstep(r * 0.5, 0.0, dd) * drop + sky * F * 1.6;
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
    })));
    this.roomLight.position.set(PHONE.center.x, DESK_Y + 0.25, PHONE.center.z);
    this.phoneUp.position.set(PHONE.center.x, PHONE.center.y + PHONE.h / 2 + 0.003, PHONE.center.z); this.phoneUp.target.position.set(PHONE.center.x, 10.3, PHONE.center.z);
    this.ceilBounce.position.set(PHONE.center.x, 10.29, PHONE.center.z); this.ceilBounce.lookAt(PHONE.center.x, 0, PHONE.center.z);
    this.antLight.position.set(ANT.x, ANT.y + 0.006, ANT.z - 0.004);
    this.antGlow.position.set(ANT.x, ANT.y, ANT.z - 0.0008);
    this.towerFlash.position.set(TOWER.x, TOWER_H + 2, TOWER.z + 4);
    this.towerGlow.position.set(TOWER.x, TOWER_H - 1.2, TOWER.z);
    const hb = this.haloBuf;
    this.halos = new LightPoints(new Float32Array(hb.p), new Float32Array(hb.c), new Float32Array(hb.r), true);
    s.add(this.halos.mesh);
    this.captureWaterEnv(ctx);
    this.drop.env = this.captureAt(ctx, DROP, 1024);
  }
  /** The environment the outdoor materials see (diffuse sky light + what wet surfaces mirror): the glowing
   *  overcast above, the lit streets' bounce below. Prefiltered once. */
  private skyEnv(ctx: Ctx) {
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vD; ${SKY_GLSL} void main(){ gl_FragColor = vec4(skyGlow(normalize(vD)), 1.0); }`,
    })));
    const pm = new THREE.PMREMGenerator(ctx.renderer);
    const t = pm.fromScene(es, 0.0).texture;
    pm.dispose();
    return t;
  }
  /** The kampung's close-up detail (kampung.ts), with what it needs from here: the city's outdoor
   *  materials, the wires' shader, the lamps as light for the drops beaded on the wires. */
  private buildDetail(lamps: Lamp[], houses: House[], warm: [number, number, number]) {
    // lamps on a 16 m grid, for the light at a point
    const grid = new Map<string, Lamp[]>(), key = (x: number, z: number) => `${Math.floor(x / 16)},${Math.floor(z / 16)}`;
    for (const l of lamps) { const k = key(l.x, l.z); (grid.get(k) ?? grid.set(k, []).get(k)!).push(l); }
    const lampAt = (x: number, y: number, z: number) => {
      let e = 0;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const l of grid.get(key(x + i * 16, z + j * 16)) ?? []) {
        const d2 = (l.x - x) ** 2 + (6.2 - y) ** 2 + (l.z - z) ** 2;
        if (d2 < 144) e += 1 / (d2 + 0.6);
      }
      return e * 4;
    };
    const stats = buildKampungDetail({
      scene: this.scene,
      mat: (color, roughness, metalness, lampE, envK, opts) => outdoor(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...opts }), lampE, this.env, envK),
      wires: (segs, rad) => this.wires(segs, rad),
      face: new THREE.MeshBasicMaterial({ color: col(WARM_LAMP, 1.15), toneMapped: false, side: THREE.DoubleSide }),
      lampAt,
      beads: (p, c, r) => { this.beads = new LightPoints(new Float32Array(p), new Float32Array(c), new Float32Array(r)); this.scene.add(this.beads.mesh); },
      warm,
    }, houses, lamps, (x, z) => nearCamera(x, z, TOWER));
    void stats;
  }

  /** Power and telecom wires as ribbons facing the camera, never thinner than ~1.4 px (thinner, they fade
   *  instead: the energy of a wire too fine to resolve), so they never shimmer. Black PVC, wet: a dark line
   *  against the glowing overcast, a warm glint where a lamp is near. */
  private wires(segs: number[], rad: number[]) {
    const n = segs.length / 6;
    const pos = new Float32Array(n * 12), oth = new Float32Array(n * 12), side = new Float32Array(n * 4), endK = new Float32Array(n * 4), r = new Float32Array(n * 4);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = segs.slice(i * 6, i * 6 + 3), b = segs.slice(i * 6 + 3, i * 6 + 6);
      [[a, b, -1, 1], [a, b, 1, 1], [b, a, -1, -1], [b, a, 1, -1]].forEach(([p, o, sd, ek], k) => {
        pos.set(p as number[], (i * 4 + k) * 3); oth.set(o as number[], (i * 4 + k) * 3);
        side[i * 4 + k] = sd as number; endK[i * 4 + k] = ek as number; r[i * 4 + k] = rad[i]!;
      });
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aOther', new THREE.BufferAttribute(oth, 3));
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1)); g.setAttribute('aEnd', new THREE.BufferAttribute(endK, 1)); g.setAttribute('aRad', new THREE.BufferAttribute(r, 1));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: { ...LIGHT_U, lampE: { value: 1 }, fogD: this.fogU, fogC: { value: FOG } },
      vertexShader: /* glsl */ `
        attribute vec3 aOther; attribute float aSide; attribute float aEnd; attribute float aRad;
        varying vec3 vLampW; varying float vA, vD;
        void main() {
          vec4 a = modelViewMatrix * vec4(position, 1.0), b = modelViewMatrix * vec4(aOther, 1.0);
          vec4 pa = projectionMatrix * a, pb = projectionMatrix * b;
          vec2 S = vec2(${W}.0, ${H}.0);
          vec2 dir = pb.w > 0.0 && pa.w > 0.0 ? (pb.xy / pb.w - pa.xy / pa.w) * S : vec2(1.0, 0.0);
          dir = length(dir) > 1e-6 ? normalize(dir) : vec2(1.0, 0.0);
          float focal = projectionMatrix[1][1] * 0.5 * S.y;
          float rPx = aRad / max(-a.z, 1e-3) * focal;
          float wPx = max(rPx, 0.7);
          vA = rPx / wPx;
          pa.xy += vec2(-dir.y, dir.x) * aEnd * aSide * wPx * 2.0 / S * pa.w;
          vLampW = (modelMatrix * vec4(position, 1.0)).xyz; vD = -a.z;
          gl_Position = pa;
        }`,
      fragmentShader: /* glsl */ `
        ${OUT_HEAD}
        uniform float fogD; uniform vec3 fogC;
        varying float vA, vD;
        void main() {
          float e = poolAt(vLampW.xz, 2.2) * smoothstep(12.0, 4.0, vLampW.y);
          vec3 c = ${glsl3(SKY_HOR)} * 0.3 + ${glsl3(WARM_LAMP)} * e * 1.6;
          c = mix(fogC, c, exp(-fogD * fogD * vD * vD));
          gl_FragColor = vec4(c * vA, vA);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    return mesh;
  }

  /** The pools of light the lamps and windows throw on the ground: painted once into two textures (the
   *  kampung at 1 m a texel, the far city at ~3.4 m) laid on the ground, additive. Seen from above they are
   *  the lit streets between the points of the lamps; they also fade with the fog. */
  private groundGlow(pools: Pool[], warm: [number, number, number]) {
    const spot = document.createElement('canvas');
    spot.width = spot.height = 64;
    const sx = spot.getContext('2d')!;
    const g = sx.createRadialGradient(32, 32, 0, 32, 32, 32);
    // a lamp's pool: a bright core under it, falling off fast, a long faint skirt
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.62)'); g.addColorStop(0.45, 'rgba(255,255,255,0.2)'); g.addColorStop(0.75, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sx.fillStyle = g; sx.fillRect(0, 0, 64, 64);
    // a warm bulb's pool (a porch lamp, 2700 K) painted warmer than the street lamps' white (the tint is theirs)
    const spotW = document.createElement('canvas');
    spotW.width = spotW.height = 64;
    const sw = spotW.getContext('2d')!;
    sw.drawImage(spot, 0, 0); sw.globalCompositeOperation = 'multiply';
    sw.fillStyle = `rgb(255,${Math.round(255 * BULB_WARM[1] / WARM_LAMP[1])},${Math.round(255 * BULB_WARM[2] / WARM_LAMP[2])})`; sw.fillRect(0, 0, 64, 64);
    sw.globalCompositeOperation = 'destination-in'; sw.drawImage(spot, 0, 0);
    const layer = (x0: number, x1: number, z0: number, z1: number, mPerPx: number, inside: (x: number, z: number) => boolean, y: number, gain: number) => {
      const c = document.createElement('canvas');
      c.width = Math.round((x1 - x0) / mPerPx); c.height = Math.round((z1 - z0) / mPerPx);
      const x = c.getContext('2d')!;
      x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'lighter';
      for (const [px, pz, k, r, sx = 1, sz = 1, wb] of pools) {
        if (!inside(px, pz)) continue;
        const rp = Math.max(1.5, r / mPerPx);
        x.globalAlpha = Math.min(1, 0.22 * k);
        x.drawImage(wb ? spotW : spot, (px - x0) / mPerPx - rp * sx, (pz - z0) / mPerPx - rp * sz, rp * 2 * sx, rp * 2 * sz);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2),
        // (light added to the ground: the fog only dims it; a fogged additive material would add the fog colour again)
        new THREE.ShaderMaterial({
          uniforms: { map: { value: t }, tint: { value: new THREE.Vector3(...warm).multiplyScalar(gain) }, fogD: this.fogU },
          vertexShader: `varying vec2 vU; varying float vD; varying vec2 vW; void main(){ vU = uv; vW = (modelMatrix * vec4(position, 1.0)).xz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
          // (as a sheen: strongest on wet asphalt, a film on concrete, little on earth: groundAt)
          fragmentShader: `uniform sampler2D map; uniform vec3 tint; uniform float fogD; varying vec2 vU; varying float vD; varying vec2 vW;
            ${KCELL_GLSL}
            ${SHEEN_GLSL}
            void main(){
              float sheen = sheenAt(vW, length(fwidth(vW)));
              gl_FragColor = vec4(texture2D(map, vU).rgb * tint * sheen * exp(-fogD * fogD * vD * vD), 1.0);
            }`,
          blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false,
        }));
      // (canvas row 0 = z0: the plane's top edge, v = 1, lies toward −z)
      this.scene.add(m);
      this.noRefl.push(m);
      return t;
    };
    const inK = (x: number, z: number) => Math.abs(x) < 430 && z > -1850 && z < 330;
    // (the same textures light the walls near the lamps: LIGHT_U.poolN/poolF, boxes as painted here)
    LIGHT_U.poolN.value = layer(-430, 430, -1850, 330, 1, inK, 0.04, 0.8);
    LIGHT_U.poolF.value = layer(-7000, 7000, -2650, 7000, 3.4, (x, z) => !inK(x, z), 0.03, 0.7);
  }
  private beacon!: LightPoints;
  private cableMat!: THREE.ShaderMaterial;
  private seaMat!: THREE.MeshStandardMaterial;
  private yard!: LightPoints;
  private seaMesh!: THREE.Mesh;
  cableLen = 1;

  /** The city as seen from one point, all round (lamps included, no rain): one cube capture, once (it is frozen). */
  private captureAt(ctx: Ctx, pos: THREE.Vector3, size: number) {
    const rt = new THREE.WebGLCubeRenderTarget(size, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.001, 30000, rt);
    cc.position.copy(pos);
    this.scene.add(cc);
    const c90: Cam = { pos: pos.clone(), look: pos.clone().add(V(0, 0, 1)), fov: 90, ap: 0 };
    for (const l of [this.lights, this.yard, this.beacon, this.halos, this.beads]) l.update(c90, 0.0006);
    for (const c of cc.children) c.layers.enable(FX_LAYER);
    const rain = [this.rainNear.mesh, this.rainMid.mesh, this.rainFar.mesh];
    rain.forEach((m) => { m.visible = false; });
    cc.update(ctx.renderer, this.scene);
    rain.forEach((m) => { m.visible = true; });
    this.scene.remove(cc);
    return rt.texture;
  }

  /** Mirror the real night (lights, lamps, sky) into the water: one cube capture from the breaker. */
  private captureWaterEnv(ctx: Ctx) {
    const rt = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.5, 30000, rt);
    cc.position.set(-189, 0.5, SHORE_Z - 60);
    this.scene.add(cc);
    const c90: Cam = { pos: cc.position.clone(), look: cc.position.clone().add(V(0, 0, 1)), fov: 90, ap: 0 };
    for (const l of [this.lights, this.yard, this.beacon, this.halos, this.beads]) l.update(c90, 0.0006);
    // the lamps are sprites on the FX layer: the capture has to see that layer too, or the sea mirrors no lamp
    for (const c of cc.children) c.layers.enable(FX_LAYER);
    this.rainNear.mesh.visible = this.rainMid.mesh.visible = this.rainFar.mesh.visible = false;
    this.seaMesh.visible = false;
    cc.update(ctx.renderer, this.scene);
    this.seaMesh.visible = true;
    this.rainNear.mesh.visible = this.rainMid.mesh.visible = this.rainFar.mesh.visible = true;
    this.scene.remove(cc);
    this.seaMat.envMap = rt.texture; this.seaMat.envMapIntensity = 1.0; this.seaMat.needsUpdate = true;
  }

  /** The coast: port sheds + yard lights, seawall, frozen sea, the frozen breaker, the cable glow. */
  private buildShore(ctx: Ctx) {
    const s = this.scene;
    const rnd = mulberry32(99);
    const R = (a: number, b: number) => a + (b - a) * rnd();
    // an environment of the night sky for the water's sheen (a dim dome and a warm band of city glow)
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.008, 0.009, 0.012), side: THREE.BackSide })));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 0.5, 64, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.05, 0.052, 0.06), side: THREE.BackSide }));
    band.position.y = 0.15; envScene.add(band);
    const env = new THREE.PMREMGenerator(ctx.renderer).fromScene(envScene, 0.02).texture;
    // port sheds between the kampung and the sea
    // (corrugated sheds, wet: they mirror the sky; the yard lamps light their walls and the ground)
    const shed = outdoor(new THREE.MeshStandardMaterial({ color: 0x6f7378, roughness: 0.45, metalness: 0.3 }), 2.5, this.env, 1.8);
    const pts: number[] = [], pc: number[] = [], pr: number[] = [];
    for (let i = 0; i < 90; i++) {
      const x = R(-900, 700), z = R(SHORE_Z + 40, -1880);
      if (Math.abs(x + 189) < 40) continue;
      const w = R(20, 60), d = R(30, 90), h = R(7, 14);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shed); m.position.set(x, h / 2, z); s.add(m);
      if (rnd() < 0.6) {
        const lx = x + R(-w, w) / 2, lz = z + d / 2 + 3;
        pts.push(lx, h + 4, lz); pc.push(3, 2.9, 2.7); pr.push(0.3); this.halo(lx, h + 4, lz, 1.2, 4); this.pools.push([lx, lz, 1.4, 16]);
      }
    }
    // lamps on the cable street, and along the seawall (their pools light the street and the quay)
    for (let z = -1900; z > SHORE_Z; z -= 45) { pts.push(-181, 7, z); pc.push(3.2, 3, 2.8); pr.push(0.2); this.halo(-181, 7, z, 1, 2.8); this.pools.push([-183, z, 1.1, 12, 0.7, 1.9]); }
    for (let x = -900; x < 700; x += 38) { pts.push(x, 6, SHORE_Z + 6); pc.push(2.6, 2.5, 2.3); pr.push(0.2); this.halo(x, 6, SHORE_Z + 6, 0.8, 2.4); this.pools.push([x, SHORE_Z + 5, 1.0, 10, 1.8, 0.7]); }
    this.yard = new LightPoints(new Float32Array(pts), new Float32Array(pc), new Float32Array(pr));
    s.add(this.yard.mesh);
    // the seawall (Jakarta's giant sea dike): a cast-concrete wall 2.2 m over the quay road, a walkway on
    // top behind a steel railing; lit by the quay lamps in front of it (one by one: see QUAY_LIGHT)
    const quayLit: Hooks = { key: 'quay', light: QUAY_LIGHT };
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2400, 3.2, 4), outdoor(new THREE.MeshStandardMaterial({ color: 0x8a857c, roughness: 0.75 }), 0.0, this.env, 1.0, false, undefined,
      { key: 'seawall', surf: SEAWALL_SURF, light: QUAY_LIGHT }));
    wall.position.set(0, 0.6, SHORE_Z - 2); s.add(wall);
    const steel = outdoor(new THREE.MeshStandardMaterial({ color: 0x8e9194, roughness: 0.45, metalness: 0.55 }), 0.0, this.env, 1.2, false, undefined, quayLit);
    const railZ = SHORE_Z - 3.85, nPost = Math.floor(2400 / 2.4);
    const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 1.05, 0.06).translate(0, 2.2 + 0.525, 0), steel, nPost);
    for (let i = 0; i < nPost; i++) posts.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-1200 + 1.2 + i * 2.4, 0, railZ));
    s.add(posts);
    for (const h of [0.55, 1.05]) { const r = new THREE.Mesh(new THREE.BoxGeometry(2400, 0.05, 0.05), steel); r.position.set(0, 2.2 + h, railZ); s.add(r); }
    // the quay lamps' poles (the heads hang 1.4 m out over the road from the kerb)
    const pole = new THREE.InstancedMesh(mergeGeometries([
      new THREE.CylinderGeometry(0.07, 0.1, 6.3, 8).translate(0, 3.15, 1.4),
      new THREE.BoxGeometry(0.07, 0.07, 1.5).translate(0, 6.2, 0.7),
      new THREE.BoxGeometry(0.28, 0.1, 0.55).translate(0, 6.12, 0),
    ]), steel, QUAY.n);
    for (let k = 0; k < QUAY.n; k++) pole.setMatrixAt(k, new THREE.Matrix4().makeTranslation(QUAY.x0 + k * QUAY.dx, 0, QUAY.z));
    s.add(pole);
    // the frozen sea: a sheet of black glass with the sky's sheen; its waves (the trains the swell froze in,
    // stopped) are in its shader, per pixel: a mesh this size could never carry 13 m waves, let alone chop
    const sea = new THREE.PlaneGeometry(9000, 9000, 8, 8).rotateX(-Math.PI / 2).translate(0, -1.0, SHORE_Z - 4504);
    this.seaMat = new THREE.MeshStandardMaterial({ color: 0x010203, roughness: 0.06, metalness: 0.0, envMap: env, envMapIntensity: 1.4 });
    this.seaMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvSeaW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vSeaW;\n${SEA_WAVES}`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          // the frozen waves: slope of every train at this point, faded out (into roughness) once finer than a pixel
          float fw = length(fwidth(vSeaW.xz));
          vec3 g = seaSlope(vSeaW.xz, fw);
          vec3 nW = normalize(vec3(-g.x, 1.0, -g.y));
          normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
          roughnessFactor = clamp(roughnessFactor + g.z, 0.0, 1.0);
        }`);
    };
    this.seaMesh = new THREE.Mesh(sea, this.seaMat);
    s.add(this.seaMesh);
    // the cable under the street: an x-ray glow line (additive, just above the asphalt)
    this.cableMat = new THREE.ShaderMaterial({
      uniforms: { k: { value: 0 }, head: { value: 0 }, ice: { value: new THREE.Vector3(...LIN.ice) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: `attribute float along; varying float vA; varying vec2 vC; varying float vD; void main(){ vA = along; vC = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      // seen from right above it (the plunge) the glow stays a line instead of washing the whole frame blue
      fragmentShader: `uniform float k, head; uniform vec3 ice; varying float vA; varying vec2 vC; varying float vD;
        void main(){ float x = abs(vC.y - 0.5) * 2.0; float core = (exp(-x * x * 60.0) * 3.0 + exp(-x * x * 5.0) * 0.35) * mix(0.22, 1.0, smoothstep(0.6, 6.0, vD)); float lit = step(vA, head);
          gl_FragColor = vec4(ice * core * k * lit, 1.0); }`,
    });
    const cp: number[] = [], cuv: number[] = [], ca: number[] = [], ci: number[] = [];
    let acc = 0;
    for (let i = 0; i < CABLE.length - 1; i++) {
      const a = CABLE[i]!, b = CABLE[i + 1]!, dxz = b.clone().sub(a), L = dxz.length(), n = V(-dxz.z, 0, dxz.x).normalize().multiplyScalar(1.4);
      const base = cp.length / 3;
      cp.push(a.x + n.x, a.y, a.z + n.z, a.x - n.x, a.y, a.z - n.z, b.x + n.x, b.y, b.z + n.z, b.x - n.x, b.y, b.z - n.z);
      cuv.push(0, 0, 0, 1, 1, 0, 1, 1);
      ca.push(acc, acc, acc + L, acc + L);
      ci.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      acc += L;
    }
    this.cableLen = acc;
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    cg.setAttribute('uv', new THREE.Float32BufferAttribute(cuv, 2));
    cg.setAttribute('along', new THREE.Float32BufferAttribute(ca, 1));
    cg.setIndex(ci);
    const cm = new THREE.Mesh(cg, this.cableMat); cm.renderOrder = 25; cm.layers.set(1); s.add(cm);
    this.noRefl.push(this.seaMesh, cm);
  }

  /** The wet street's mirror image: the scene seen from the camera reflected in the ground plane (above
   *  the ground only), without the rain, the ground itself and what lies on it. The ground shader looks
   *  each of its points up in it (LIGHT_U.reflMat). */
  private reflect(ctx: Ctx, cam: Cam) {
    const m = (v: THREE.Vector3) => V(v.x, -v.y, v.z);
    // a little wider than the camera: the streaks sample around each point
    applyCam(this.reflCam, { pos: m(cam.pos), look: m(cam.look), up: m(cam.up ?? V(0, 1, 0)), fov: Math.min(cam.fov * 1.12, 120), near: 0.2, far: 30000 });
    const r = ctx.renderer;
    const vis = this.noRefl.map((o) => o.visible);
    for (const o of this.noRefl) o.visible = false;
    const clip = r.clippingPlanes;
    r.clippingPlanes = City.CLIP;
    clearRT(r, this.refl, [FOG.r, FOG.g, FOG.b]);
    r.setRenderTarget(this.refl);
    r.render(this.scene, this.reflCam);
    r.clippingPlanes = clip;
    this.noRefl.forEach((o, i) => { o.visible = vis[i]!; });
    LIGHT_U.reflTex.value = this.refl.texture;
    LIGHT_U.reflMat.value.multiplyMatrices(this.reflCam.projectionMatrix, this.reflCam.matrixWorldInverse);
  }

  render(ctx: Ctx, cam: Cam, st: CityState, out: THREE.WebGLRenderTarget) {
    const fogD = st.fogD ?? 0.0006;
    (this.scene.fog as THREE.FogExp2).density = fogD;
    this.fogU.value = fogD;
    this.screenMat.uniforms.scan!.value = st.scan;
    this.screenMat.uniforms.k!.value = st.screenK ?? 1;
    this.roomLight.intensity = 0.05 + 1.2 * (st.glow ?? 0);
    const sky = st.phoneSky ?? 0;
    this.phoneUp.intensity = PHONE_CD * sky; this.phoneUp.visible = sky > 0;
    this.ceilBounce.intensity = BOUNCE_NIT * sky; this.ceilBounce.visible = sky > 0;
    this.facadeLamp.visible = !st.lampSpot; this.facadeSpot.visible = !!st.lampSpot;
    LIGHT_U.roomGlow.value = st.phoneSky ?? 0;
    this.vitrase.visible = !!st.lampSpot; this.vitraseU.sky.value = st.phoneSky ?? 0;
    const hit = st.towerHit ?? 0;
    this.towerFlash.intensity = 500 * hit;
    this.towerGlow.visible = hit > 0.001; this.towerGlow.scale.setScalar(26 * hit + 4);
    (this.towerGlow.material as THREE.SpriteMaterial).opacity = Math.min(1, hit * 1.5);
    const ph = st.photon;
    this.photonHalo.visible = this.photonCore.visible = !!ph;
    if (ph) {
      this.photonHalo.position.copy(ph.pos); this.photonCore.position.copy(ph.pos);
      this.photonHalo.scale.setScalar(0.009); this.photonCore.scale.setScalar(0.0022);
      (this.photonHalo.material as THREE.SpriteMaterial).color.setRGB(LIN.ice[0] * ph.k * 0.6, LIN.ice[1] * ph.k * 0.6, LIN.ice[2] * ph.k * 0.6);
      (this.photonCore.material as THREE.SpriteMaterial).color.setRGB(0.9 * ph.k, 1.6 * ph.k, 4.0 * ph.k);
    }
    const ant = st.ant ?? 0;
    this.antLight.intensity = 0.45 * ant;
    this.antGlow.visible = ant > 0.001; this.antGlow.scale.setScalar(0.006);
    (this.antGlow.material as THREE.SpriteMaterial).opacity = Math.min(1, ant);
    const [dp, dk] = st.down ?? [0, 0];
    this.streak.visible = dk > 0.001;
    this.streak.scale.set(1, Math.max(0.01, dp * (TOWER_H - 1)), 1);
    this.streakMat.color.copy(col(LIN.ice, 4 * dk));
    this.rainNear.update(cam, fogD, st.wave ?? null);
    this.rainMid.update(cam, fogD, st.wave ?? null);
    this.rainFar.update(cam, fogD, st.wave ?? null);

    this.lights.update(cam, fogD * 0.55, st.lightsGain ?? 1);
    this.beads.update(cam, fogD * 0.55);
    this.halos.update(cam, fogD * 0.55, st.lightsGain ?? 1);
    this.beacon.update(cam, fogD * 0.5);
    this.yard.update(cam, fogD * 0.6);
    const [ch, ck] = st.cable ?? [0, 0];
    this.cableMat.uniforms.head!.value = ch * this.cableLen; this.cableMat.uniforms.k!.value = ck;
    // the scene itself renders sharp; the lights and drops carry their own depth of field
    // from high above, drops this small are invisible (and all of them defocused at once overflow the frame)
    const rainOn = cam.pos.y < 400;
    this.rainNear.mesh.visible = this.rainMid.mesh.visible = this.rainFar.mesh.visible = rainOn;
    // the wet street's reflection (not from under the sea, nor over the desk where no street is in view)
    const wet = cam.pos.y > 0.3 && cam.pos.distanceTo(PHONE.center) > 0.6;
    LIGHT_U.reflK.value = wet ? 1 : 0;
    if (wet) this.reflect(ctx, cam);
    const near = cam.near ?? (cam.pos.distanceTo(PHONE.center) < 1.5 ? 0.0015 : cam.pos.y < 30 ? 0.08 : 0.5);
    ctx.r3.scene(this.scene, { ...cam, near, far: 30000, ap: st.dof ?? 0 }, out, [FOG.r, FOG.g, FOG.b]);
    if (st.drop) this.drop.render(ctx.renderer, cam, out);
    const w = st.wave;
    if (w && w.R > 0.3 && w.sheet !== false) {
      const u2 = this.sheet.u;
      setCamUniforms(u2, cam);
      (u2.center!.value as THREE.Vector3).copy(w.origin);
      u2.R!.value = w.R; u2.wid!.value = w.width * 0.5; u2.k!.value = w.k * 0.3; u2.fogD!.value = fogD * 0.55;
      this.sheet.render(ctx.renderer, out);
    }
  }
}

export const city = new City();
