// Paper and risograph ink, computed per pixel (no raster images): every print is a set of ink densities
// (tone = halftoned, solid = flat ink) that the shader screens with its own angle per ink, misregisters,
// mottles like a riso drum, and overprints by multiplying (riso inks are transparent). The paper under it
// has tooth and fibres that catch the raking window light (a bump from a procedural height).
// Two materials share that GLSL: PaperMaterial (lit, a MeshStandardMaterial with injected chunks) and
// DecalMaterial (unlit multiply over what is already drawn: ink and graphite printed onto the board).
import * as THREE from 'three';
import { RISO_LIN } from '../palette';

const v3 = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

/** Uniforms of a print (both materials, and the Droste dive that replicates the poster). */
export const INK_UNIFORMS_GLSL = /* glsl */ `
uniform sampler2D uTone, uSolid, uK;
uniform vec2 uSize;
uniform float uCell, uSeed, uFiber, uInkOn, uHMod;
uniform vec2 uMis[4];
uniform vec3 uPaper;
`;

/** Pure GLSL shared by everything that prints: hashes, value noise, paper tooth, halftone, ink. */
export const INK_FUNCS_GLSL = /* glsl */ `
const vec3 INK_P = ${v3(RISO_LIN.pink)};
const vec3 INK_B = ${v3(RISO_LIN.blue)};
const vec3 INK_Y = ${v3(RISO_LIN.yellow)};
const vec3 INK_K = ${v3(RISO_LIN.black)};
float pH(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vN(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(pH(i), pH(i + vec2(1, 0)), u.x), mix(pH(i + vec2(0, 1)), pH(i + vec2(1, 1)), u.x), u.y);
}
mat2 pRot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
/** Paper tooth + fibres, height in arbitrary units (0..~1.4). p in world units (~mm). */
float toothH(vec2 p) {
  p += uSeed * 37.0;
  float h = vN(p * 3.1) * 0.5 + vN(p * 7.7 + 17.0) * 0.25 + vN(p * 0.7 + 5.0) * 0.25;
  float f1 = vN(pRot(0.62) * p * vec2(0.32, 4.6));
  float f2 = vN(pRot(2.31) * p * vec2(0.27, 4.1) + 31.0);
  float f3 = vN(pRot(4.05) * p * vec2(0.4, 5.3) + 71.0);
  h += 0.45 * (smoothstep(0.74, 0.97, f1) + smoothstep(0.76, 0.97, f2) + smoothstep(0.78, 0.98, f3));
  return h;
}
/** Paper albedo mottling (multiplier). */
float paperMottle(vec2 p) {
  p += uSeed * 91.0;
  return 1.0 + 0.045 * (vN(p * 0.045) - 0.5) + 0.03 * (vN(p * 0.21 + 3.0) - 0.5);
}
/** Halftone coverage of one ink screen (cos spot, area ~ tone), smoothing to flat tone when cells go sub-pixel. */
float halftone(vec2 q, float ang, float cell, float tone) {
  if (tone <= 0.003) return 0.0;
  vec2 g = pRot(ang) * q / cell;
  vec2 f = fract(g) - 0.5;
  float s = 0.5 - 0.25 * (cos(6.2831853 * f.x) + cos(6.2831853 * f.y));
  tone += (vN(q * 2.3) - 0.5) * 0.07;
  float w = fwidth(s) * 0.75 + 1e-4;
  float cov = smoothstep(-w, w, tone - s);
  float px = fwidth(g.x) + fwidth(g.y);
  return mix(cov, clamp(tone, 0.0, 1.0), smoothstep(0.3, 0.75, px));
}
/** Riso ink lay-down: drum mottling, and small voids where the paper tooth stands proud. */
float inkLay(vec2 q, float k, float h) {
  // black is the densest ink on the drum; the colours mottle more
  float amp = k > 2.5 ? 0.05 : 0.1;
  float m = 1.0 - amp + amp * vN(q * 0.07 + k * 13.1) + 0.035 * (vN(q * 0.9 + k * 5.0) - 0.5);
  float voids = 1.0 - (k > 2.5 ? 0.4 : 0.5) * smoothstep(1.12, 1.4, h + 0.22 * vN(q * 1.7 + k));
  return min(m, 1.0) * voids;
}
/** The printed colour multiplier at paper position p (units); hm shifts pink up / blue down (ripple crests). */
vec3 inkMul(vec2 p, float h, float hm) {
  vec3 col = vec3(1.0);
  if (uInkOn < 0.5) return col;
  // pink
  { vec2 q = p + uMis[0]; vec2 uv = q / uSize;
    float c = max(halftone(q, 1.309, uCell, texture(uTone, uv).r + hm), texture(uSolid, uv).r) * inkLay(q, 0.0, h);
    col *= mix(vec3(1.0), INK_P, c); }
  // blue
  { vec2 q = p + uMis[1]; vec2 uv = q / uSize;
    float c = max(halftone(q, 0.2618, uCell, texture(uTone, uv).g - hm * 0.8), texture(uSolid, uv).g) * inkLay(q, 1.0, h);
    col *= mix(vec3(1.0), INK_B, c); }
  // yellow
  { vec2 q = p + uMis[2]; vec2 uv = q / uSize;
    float c = max(halftone(q, 0.0, uCell, texture(uTone, uv).b), texture(uSolid, uv).b) * inkLay(q, 2.0, h);
    col *= mix(vec3(1.0), INK_Y, c); }
  // black
  { vec2 q = p + uMis[3]; vec2 uv = q / uSize; vec4 k = texture(uK, uv);
    float c = max(halftone(q, 0.7854, uCell, k.r), k.g) * inkLay(q, 3.0, h);
    col *= mix(vec3(1.0), INK_K, c); }
  return col;
}
`;

/** Varyings + uniforms + functions, for the three.js (GLSL1-style) materials. */
export const INK_GLSL = `varying vec2 vPaperUv;
varying float vH;
${INK_UNIFORMS_GLSL}
${INK_FUNCS_GLSL}`;

export interface InkTextures { tone: THREE.Texture; solid: THREE.Texture; k: THREE.Texture }

const BLANK = (() => {
  const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
})();

export interface PaperOpts {
  /** sheet size in world units (uv 0..1 spans it) */
  size: [number, number];
  /** paper colour (linear rgb) */
  paper: [number, number, number];
  inks?: InkTextures;
  /** halftone cell (units) */
  cell?: number;
  /** misregistration per ink (units): pink, blue, yellow, black */
  mis?: [number, number][];
  seed?: number;
  /** bump strength (height units per world unit of tooth) */
  fiber?: number;
  roughness?: number;
  side?: THREE.Side;
  /** vertex attribute aH (e.g. a ripple height) modulates pink/blue tone by this much per unit of height */
  hMod?: number;
  /** extra fragment GLSL run at the end of the albedo, may edit diffuseColor (e.g. a torn hole, discard) */
  fragExtra?: string;
  /** GLSL declarations for fragExtra (its uniforms) */
  fragDecl?: string;
  extraUniforms?: Record<string, THREE.IUniform>;
}

/** Uniform set shared by the lit and decal materials. */
export function inkUniforms(o: PaperOpts) {
  const mis = (o.mis ?? [[0, 0], [0, 0], [0, 0], [0, 0]]).map(([x, y]) => new THREE.Vector2(x, y));
  return {
    uTone: { value: o.inks?.tone ?? BLANK },
    uSolid: { value: o.inks?.solid ?? BLANK },
    uK: { value: o.inks?.k ?? BLANK },
    uSize: { value: new THREE.Vector2(o.size[0], o.size[1]) },
    uCell: { value: o.cell ?? 5 },
    uSeed: { value: o.seed ?? 0 },
    uFiber: { value: o.fiber ?? 1 },
    uInkOn: { value: o.inks ? 1 : 0 },
    uHMod: { value: o.hMod ?? 0 },
    uMis: { value: mis },
    uPaper: { value: new THREE.Vector3(...o.paper) },
    ...(o.extraUniforms ?? {}),
  };
}

/**
 * Light on the set: the window's falloff (brighter toward the top-left) times a soft pool around what the shot
 * is about (each setup is lit for its subject, as on a stop-motion stage). Shared by every lit paper surface.
 */
export const POOL = { value: new THREE.Vector3(0, 0, 1000) };
/** Centre the light pool on (x, y); `dist` = camera distance (the pool scales with the framing). */
export function setLightPool(x: number, y: number, dist: number) { POOL.value.set(x, y, Math.max(120, dist * 0.42)); }
const WINDOW_GLSL = /* glsl */ `
varying vec3 vPaperWorld;
uniform vec3 uPool;
float windowF(vec3 w) {
  float u = dot(w.xy, normalize(vec2(-0.55, 0.83))) / 1300.0; float k = clamp(0.5 + u, 0.0, 1.0);
  float win = 0.84 + 0.3 * k * k * (3.0 - 2.0 * k);
  vec2 d = (w.xy - uPool.xy - vec2(-0.12, 0.1) * uPool.z) / uPool.z;
  float pool = 0.78 + 0.3 * exp(-0.5 * dot(d, d));
  return win * pool;
}
`;

export type PaperMaterial = THREE.MeshStandardMaterial & { uniforms: ReturnType<typeof inkUniforms> };

/** A lit sheet of paper with riso ink. */
export function paperMaterial(o: PaperOpts): PaperMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: o.roughness ?? 0.92, metalness: 0, side: o.side ?? THREE.FrontSide }) as PaperMaterial;
  const u = inkUniforms(o);
  m.uniforms = u;
  const hasH = (o.hMod ?? 0) !== 0;
  m.defines = { ...(m.defines ?? {}), ...(hasH ? { PAPER_H: '' } : {}) };
  m.customProgramCacheKey = () => `paper:${hasH}:${o.fragDecl ?? ''}:${o.fragExtra ?? ''}`;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uPool: POOL });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec2 vPaperUv;\nvarying float vH;\nvarying vec3 vPaperWorld;\n#ifdef PAPER_H\nattribute float aH;\n#endif`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>\nvPaperUv = uv;\n#ifdef PAPER_H\nvH = aH;\n#else\nvH = 0.0;\n#endif`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\nvPaperWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${INK_GLSL}\n${WINDOW_GLSL}\n${o.fragDecl ?? ''}`)
      .replace('#include <map_fragment>', /* glsl */ `
        vec2 pp = vPaperUv * uSize;
        float th = toothH(pp);
        diffuseColor.rgb = uPaper * paperMottle(pp) * (1.0 + 0.06 * uFiber * (th - 0.6)) * inkMul(pp, th, vH * uHMod);
        ${o.fragExtra ?? ''}`)
      .replace('#include <normal_fragment_maps>', /* glsl */ `
        {
          // bump from the tooth height, faded out when a pixel spans more than the tooth (no shimmer)
          vec2 dpx = dFdx(pp), dpy = dFdy(pp);
          float foot = max(length(dpx), length(dpy));
          float amp = 0.05 * uFiber * (1.0 - smoothstep(0.35, 1.2, foot));
          float hx = (toothH(pp + dpx) - th) * amp, hy = (toothH(pp + dpy) - th) * amp;
          vec3 sp = -vViewPosition;
          vec3 sx = dFdx(sp), sy = dFdy(sp);
          vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
          float det = dot(sx, r1);
          vec3 grad = sign(det) * (hx * r1 + hy * r2);
          normal = normalize(abs(det) * normal - grad);
        }`)
      .replace('#include <opaque_fragment>', `outgoingLight *= windowF(vPaperWorld);\n#include <opaque_fragment>`);
  };
  return m;
}

/**
 * Ink or graphite printed onto whatever is below (the board): unlit, multiplied over the lit frame. Correct for
 * decals that lie flat on a lit surface (the light and shadows are already in the destination).
 */
export function decalMaterial(o: PaperOpts) {
  const u = inkUniforms(o);
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      varying vec2 vPaperUv; varying float vH;
      void main() { vPaperUv = uv; vH = 0.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      ${INK_GLSL}
      void main() {
        vec2 pp = vPaperUv * uSize;
        vec3 c = inkMul(pp, toothH(pp), 0.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor,
    blendDst: THREE.ZeroFactor,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  return m as THREE.ShaderMaterial & { uniforms: typeof u };
}
