// Jakarta at night, in metres (S3 rain, S8 dive home, S9 the room). y up. The viewer's phone lies on a desk
// by a window on the second floor of a small building at the origin, top edge toward −z. Out the window:
// frozen rain, a sea of kampung roofs, a few towers, the lattice cell tower ~1.3 km away (placed where the
// radio wavefront, radius c·Δt from the physical clock, is at the moment it is hit), a far carpet of lights,
// and the pools of light the lamps throw on the streets. In the room: a walnut desk, the phone (rounded
// slab, black glass, the display with its punch-hole), the lit windows of our own building outside.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { CUE } from '../cues';
import { ms } from '../clock';
import { FrozenRain, LightPoints, type Wave } from './sprites';
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
 *  (street lamps throw their light along the street) */
type Pool = [number, number, number, number, number?, number?];
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
  float n1 = vnoise(vLampW.xz * 0.21) * 0.65 + vnoise(vLampW.xz * 0.9 + 3.1) * 0.35;
  float wet = mix(0.35, 1.0, smoothstep(0.38, 0.62, n1));           // standing water in the dips
  vec3 V = normalize(cameraPosition - vLampW);
  float F = 0.02 + 0.98 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  // a film of water on rough asphalt stretches each light into a streak toward the eye; a puddle is
  // nearly a mirror
  // (a streak is foreshortened with distance: its length on screen shrinks as the street recedes)
  float sp = mix(0.011, 0.0035, smoothstep(0.5, 1.0, wet)) * clamp(45.0 / rc.w, 0.06, 1.0);
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
#endif`;
const WIN_SURF = /* glsl */ `
vec3 winC = vec3(0.0);
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
  float door = step(fl, 0.5) * step(abs(faceId - (h21(vSeed * 0.53) < 0.5 ? 3.0 : 4.0)), 0.1) * step(abs(bay - floor(nb * 0.5)), 0.1)
    * step(abs(ub), 0.46) * step(vy, 2.15) * wall * (1.0 - aa);
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
/** Light a MeshStandardMaterial the city's way (see above). `lampE` = how much the lamps' pools light it;
 *  `win`: windows in its walls (instanced unit boxes; FLOOR_H, BAY_W, WIN_W, WIN_H, SILL, LIT_P, WIN_K). */
function outdoor<M extends THREE.MeshStandardMaterial>(m: M, lampE: number, env: THREE.Texture | null, envK: number, wet = false, win?: Record<string, number>): M {
  m.envMap = env; m.envMapIntensity = envK;
  const defs: Record<string, string> = {};
  if (wet) defs.WET_GROUND = '';
  if (win) { defs.FACADE_WIN = ''; for (const [k, v] of Object.entries(win)) defs[k] = v.toFixed(4); }
  m.defines = { ...(m.defines ?? {}), ...defs };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, LIGHT_U, { lampE: { value: lampE } });
    const vary = '\nvarying vec3 vLampW;\n#ifdef FACADE_WIN\nvarying vec3 vLoc, vLocN, vIsc; varying vec2 vSeed;\n#endif';
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>${vary}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${OUT_VERT}\n#ifdef FACADE_WIN\n${WIN_VERT}\n#endif`);
    // outdoors, the room's old fill (the cool hemisphere and "moon" directional light, still lighting the
    // desk in S9) has no source: the overcast has no moon; a wet roof would mirror it as a blue sheen
    const begin = THREE.ShaderChunk.lights_fragment_begin
      .replace('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
      .replace('#if ( NUM_HEMI_LIGHTS > 0 )', '#if 0');
    sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', begin)
      .replace('#include <common>', `#include <common>${vary.replace('varying vec3 vLampW;', '')}\n${OUT_HEAD}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n#ifdef FACADE_WIN\n${WIN_SURF}\n#endif`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n#ifdef FACADE_WIN\ntotalEmissiveRadiance += winC * outdoorAt(vLampW);\n#endif`)
      .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>\n${OUT_LIGHT}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${WET_LIGHT}`);
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
}

class City {
  scene = new THREE.Scene();
  rainNear = new FrozenRain(60, 0.3, 0.72, 0.0016, 1.3, 3);
  rainMid = new FrozenRain(48, 1.1, 0.85, 0.002, 0.8, 7);
  rainFar = new FrozenRain(40, 4.2, 0.95, 0.0024, 0.45, 11);
  private sheet = new FSPass(SHEET, { ...camUniforms(), center: { value: new THREE.Vector3() }, R: { value: 0 }, wid: { value: 1 }, k: { value: 0 }, fogD: { value: 0 } }, { blending: THREE.AdditiveBlending, transparent: true });

  lights!: LightPoints;
  private screenMat!: THREE.ShaderMaterial;
  private roomLight = new THREE.PointLight(col(LIN.paper), 0, 6, 2);
  private towerFlash = new THREE.PointLight(col(LIN.ice), 0, 55, 2);
  private towerGlow = glowSprite(LIN.ice);
  private photonHalo = glowSprite(LIN.ice);
  private photonCore = glowSprite([0.9, 1.6, 4.0]);
  private antLight = new THREE.PointLight(col(LIN.ice), 0, 2.5, 2);
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

    // ground: wet asphalt (the pools of lamp light are painted on it below, the reflection added in its shader)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 20000).rotateX(-Math.PI / 2).translate(0, 0, SHORE_Z + 10000),
      outdoor(new THREE.MeshStandardMaterial({ color: 0x19191a, roughness: 0.5 }), 0.0, null, 0, true));
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
    const lamp = (x: number, z: number, k: number) => { light(x, 6.2, z, warm, k, 0.12); this.halo(x, 6.2, z, k / 3.2); };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p3 = new THREE.Vector3();
    const warm: [number, number, number] = [1.0, 0.93, 0.82];
    // kampung colours (sRGB): walls in pale limewash and faded paint; roofs of clay tile, rusted zinc, cement
    const WALLS = [0xb8b0a2, 0xa9ad9f, 0xb3a894, 0x9fa7ab, 0xc0b6a4, 0x9a948a].map((c) => new THREE.Color(c));
    const ROOFS = [0x8c4a33, 0x7a3f2c, 0x6f6962, 0x847f76, 0x5b534c, 0x94553a].map((c) => new THREE.Color(c));
    const wallC: THREE.Color[] = [], roofC: THREE.Color[] = [];
    const rndC = mulberry32(23);   // own stream: the city keeps its layout
    for (let gx = -40; gx <= 40; gx++) for (let gz = -175; gz <= 30; gz++) {
      const x0 = gx * 10.5, z0 = gz * 10.5;
      if (gx % 6 === 0 || gz % 7 === 0) {   // streets: lamps every other block
        if (gx % 6 === 0 && gz % 2 === 0 && rnd() < 0.7) { lamp(x0 + 2.5, z0, 3.2); pools.push([x0 + 2.5, z0, 1.2, 7, 0.6, 1.9]); }
        // the cross streets have lamps too (own draw, so the rest of the city keeps its layout)
        if (gz % 7 === 0 && gx % 6 !== 0 && gx % 2 === 0 && rnd2() < 0.6) { lamp(x0, z0 + 2.5, 3.0); pools.push([x0, z0 + 2.5, 1.1, 7, 1.9, 0.6]); }
        // and in between (own draw): a lamp at every block, so the streets read as lit lines from above
        if (gx % 6 === 0 && gz % 2 !== 0 && rnd3() < 0.6) { lamp(x0 + 2.5, z0, 2.9); pools.push([x0 + 2.5, z0, 1.0, 7, 0.6, 1.9]); }
        if (gz % 7 === 0 && gx % 6 !== 0 && gx % 2 !== 0 && rnd3() < 0.5) { lamp(x0, z0 + 2.5, 2.7); pools.push([x0, z0 + 2.5, 0.9, 7, 1.9, 0.6]); }
        continue;
      }
      if (Math.abs(x0) < 9 && z0 > -6 && z0 < 14) continue;          // our building
      if (p3.set(x0 - TOWER.x, 0, z0 - TOWER.z).length() < 14) continue; // tower plot
      if (rnd() < 0.12) continue;
      const w = R(5.5, 8.5), d = R(6.5, 9.5), h = R(3.2, 6.8) * (rnd() < 0.15 ? 1.8 : 1), ry = (rnd() < 0.5 ? 0 : Math.PI / 2) + R(-0.05, 0.05);
      const x = x0 + R(-1.2, 1.2), z = z0 + R(-1.2, 1.2);
      q.setFromAxisAngle(V(0, 1, 0), ry);
      houses.push(m4.clone().compose(p3.set(x, 0, z), q, sc.set(w, h, d)));
      roofs.push(m4.clone().compose(p3.set(x, h, z), q, sc.set(w, w * 0.9, d)));
      wallC.push(WALLS[Math.floor(rndC() * WALLS.length)]!.clone().multiplyScalar(0.8 + 0.3 * rndC()));
      roofC.push(ROOFS[Math.floor(rndC() * ROOFS.length)]!.clone().multiplyScalar(0.75 + 0.35 * rndC()));
      const nw = rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0;
      for (let k = 0; k < nw; k++) {
        const side = rnd() < 0.5 ? 1 : -1, along = R(-0.35, 0.35);
        const lx = x + Math.cos(ry) * along * w + Math.sin(ry) * side * (d * 0.5 + 0.3), lz = z - Math.sin(ry) * along * w + Math.cos(ry) * side * (d * 0.5 + 0.3);
        const wk = R(0.25, 1.1);
        R(1.4, h - 0.8);   // (the windows are in the walls' shader now; the draw keeps the city's layout)
        pools.push([lx + Math.sin(ry) * side * 1.2, lz + Math.cos(ry) * side * 1.2, wk * 0.35, 3.5]);
      }
    }
    // walls: limewash, lit by the sky and the lamps in their street; roofs: wet, so they also mirror the glowing sky
    const wallMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), 11.0, this.env, 0.45, false,
      { FLOOR_H: 3.0, BAY_W: 2.7, WIN_W: 1.0, WIN_H: 1.25, SILL: 0.95, LIT_P: 0.34, WIN_K: 1.0 });
    const roofMat = outdoor(new THREE.MeshStandardMaterial({ color: 0x8c8c8c, roughness: 0.34, metalness: 0.0 }), 4.0, this.env, 2.0);
    const wallI = new THREE.InstancedMesh(wallG, wallMat, houses.length); houses.forEach((m, i) => { wallI.setMatrixAt(i, m); wallI.setColorAt(i, wallC[i]!); });
    const roofI = new THREE.InstancedMesh(roofG, roofMat, roofs.length); roofs.forEach((m, i) => { roofI.setMatrixAt(i, m); roofI.setColorAt(i, roofC[i]!); });
    s.add(wallI, roofI);

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
    const facadeMat = outdoor(new THREE.MeshStandardMaterial({ color: 0xa39c90, roughness: 0.8 }), 1.5, this.env, 0.25);
    const SK = 0.011;
    box(-4.2, WIN.x0, 0, 10.5, Z0 - SK, Z0, facadeMat); box(WIN.x1, 4.2, 0, 10.5, Z0 - SK, Z0, facadeMat);
    box(WIN.x0, WIN.x1, 0, WIN.y0 - 0.04, Z0 - SK, Z0, facadeMat); box(WIN.x0, WIN.x1, WIN.y1 + 0.04, 10.5, Z0 - SK, Z0, facadeMat);
    box(-4.2 - SK, -4.2, 0, 10.5, Z0 - SK, 8.2 + SK, facadeMat); box(4.2, 4.2 + SK, 0, 10.5, Z0 - SK, 8.2 + SK, facadeMat);
    box(-4.2, 4.2, 0, 10.5, 8.2, 8.2 + SK, facadeMat);
    box(-4.2, 4.2, 10.5, 10.8, Z0 - 0.3, 8.2, outdoor(new THREE.MeshStandardMaterial({ color: 0x6e6a64, roughness: 0.45 }), 1.0, this.env, 1.2)); // roof slab (wet)
    box(-4, 4, FLOOR_Y - 0.2, FLOOR_Y, Z1, 8);                      // floor of the room
    box(-4, 4, 10.3, 10.5, Z1, 8);                                  // ceiling
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
    this.antLight.position.set(ANT.x, ANT.y + 0.006, ANT.z - 0.004);
    this.antGlow.position.set(ANT.x, ANT.y, ANT.z - 0.0008);
    this.towerFlash.position.set(TOWER.x, TOWER_H + 2, TOWER.z + 4);
    this.towerGlow.position.set(TOWER.x, TOWER_H - 1.2, TOWER.z);
    const hb = this.haloBuf;
    this.halos = new LightPoints(new Float32Array(hb.p), new Float32Array(hb.c), new Float32Array(hb.r), true);
    s.add(this.halos.mesh);
    this.captureWaterEnv(ctx);
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
    const layer = (x0: number, x1: number, z0: number, z1: number, mPerPx: number, inside: (x: number, z: number) => boolean, y: number, gain: number) => {
      const c = document.createElement('canvas');
      c.width = Math.round((x1 - x0) / mPerPx); c.height = Math.round((z1 - z0) / mPerPx);
      const x = c.getContext('2d')!;
      x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
      x.globalCompositeOperation = 'lighter';
      for (const [px, pz, k, r, sx = 1, sz = 1] of pools) {
        if (!inside(px, pz)) continue;
        const rp = Math.max(1.5, r / mPerPx);
        x.globalAlpha = Math.min(1, 0.22 * k);
        x.drawImage(spot, (px - x0) / mPerPx - rp * sx, (pz - z0) / mPerPx - rp * sz, rp * 2 * sx, rp * 2 * sz);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2),
        // (light added to the ground: the fog only dims it; a fogged additive material would add the fog colour again)
        new THREE.ShaderMaterial({
          uniforms: { map: { value: t }, tint: { value: new THREE.Vector3(...warm).multiplyScalar(gain) }, fogD: this.fogU },
          vertexShader: `varying vec2 vU; varying float vD; void main(){ vU = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
          fragmentShader: `uniform sampler2D map; uniform vec3 tint; uniform float fogD; varying vec2 vU; varying float vD;
            void main(){ gl_FragColor = vec4(texture2D(map, vU).rgb * tint * exp(-fogD * fogD * vD * vD), 1.0); }`,
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

  /** Mirror the real night (lights, lamps, sky) into the water: one cube capture from the breaker. */
  private captureWaterEnv(ctx: Ctx) {
    const rt = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const cc = new THREE.CubeCamera(0.5, 30000, rt);
    cc.position.set(-189, 0.5, SHORE_Z - 60);
    this.scene.add(cc);
    const c90: Cam = { pos: cc.position.clone(), look: cc.position.clone().add(V(0, 0, 1)), fov: 90, ap: 0 };
    for (const l of [this.lights, this.yard, this.beacon, this.halos]) l.update(c90, 0.0006);
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
    // seawall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2400, 3.2, 4), outdoor(new THREE.MeshStandardMaterial({ color: 0x77736c, roughness: 0.7 }), 8.0, this.env, 1.2));
    wall.position.set(0, 0.6, SHORE_Z - 2); s.add(wall);
    // the frozen sea: a displaced sheet (a few wave trains, stopped), black glass with the sky's sheen
    const sea = new THREE.PlaneGeometry(9000, 9000, 360, 360).rotateX(-Math.PI / 2).translate(0, 0, SHORE_Z - 4504);
    const p = sea.attributes.position as THREE.BufferAttribute;
    const trains: [number, number, number, number][] = [[0.3, 13, 0.2, 0.9], [0.16, 7, 1.1, 0.5], [0.09, 3.7, -0.7, 0.3]];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      let y = 0;
      for (const [a, L, ang, st] of trains) { const k = (2 * Math.PI) / L; const ph = k * (Math.cos(ang) * x + Math.sin(ang) * z); y += a * Math.sin(ph) * (1 + st * 0.3 * Math.cos(ph)); }
      p.setY(i, -1.0 + y);
    }
    sea.computeVertexNormals();
    this.seaMat = new THREE.MeshStandardMaterial({ color: 0x010203, roughness: 0.06, metalness: 0.0, envMap: env, envMapIntensity: 1.4 });
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
    ctx.r3.scene(this.scene, { ...cam, near, far: 30000, ap: 0 }, out, [FOG.r, FOG.g, FOG.b]);
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
