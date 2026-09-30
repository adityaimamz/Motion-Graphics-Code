// S2 dive: into one pink halftone dot of the frozen poster, and down. Inside every dot is the whole field again
// (sun + frozen rings), printed in the next ink: pink → blue → yellow → 1-bit Bayer black. Each level is the
// same picture scaled by S = 2^Z about its target, so the dive is seamless. Level 0 replicates the poster's
// print exactly (same textures, screens, misregistration, tooth) so the hand-off from the 3D camera is a cut
// the eye cannot see. Coordinates are computed relative to the screen centre at every level (float-safe).
import * as THREE from 'three';
import { FSPass } from '../engine/gl';
import { INK_UNIFORMS_GLSL, INK_FUNCS_GLSL, inkUniforms, POOL } from '../paper/material';
import { RISO_LIN } from '../palette';
import { CUE } from '../cues';
import { clamp, ease } from '../engine/util';
import { LIGHT_DIR } from '../world';
import { POSTER, PL, rh } from '../layout';
import { RIP, RS, rippleH, rippleTau, type Poster } from './poster';

const RK = CUE.riak;
/** octaves of zoom per level (the whole field fits inside one dot of the level above) */
export const ZL = 6.25;
/** frame width (poster units) at the 3D → 2D hand-off: four cells across */
export const FW_H = 17.6;
const H = rh(POSTER);

/** Zoom (octaves past the hand-off) at camera time t, or null when the 2D dive is not on screen. */
export function diveZ(t: number): number | null {
  const b = [RK.lv1, RK.lv2, RK.lv3, RK.bayer];
  const zs = [0, 2.2, ZL + 2.2, 2 * ZL + 2.2];
  if (t < b[0]! || t >= RK.tarik + (RK.tarikEnd - RK.tarik) / 2) return null;
  for (let i = 0; i < 3; i++) if (t < b[i + 1]!) return zs[i]! + (zs[i + 1]! - zs[i]!) * ease.inOutCubic(clamp((t - b[i]!) / (b[i + 1]! - b[i]!)));
  if (t < RK.tarik) return zs[3]! + 0.35 * clamp((t - RK.bayer) / (RK.tarik - RK.bayer));
  // pull back out: all the way to the hand-off in half of the pull (the 3D camera takes the rest)
  const u = clamp((t - RK.tarik) / ((RK.tarikEnd - RK.tarik) / 2));
  return (zs[3]! + 0.35) * (1 - ease.inOutQuad(u));
}

/** Pink tone of the poster's sun at poster-local (x, y down): the radial gradient drawn in poster.ts. */
function sunTone(lx: number, ly: number) {
  const t = Math.max(0, Math.min(1, (Math.hypot(lx - RS.x, ly - (RS.y - 8)) - 4) / 146));
  return t < 0.45 ? 0.9 + (0.62 - 0.9) * (t / 0.45) : 0.62 + (0.06 - 0.62) * ((t - 0.45) / 0.55);
}

/**
 * The dot the camera dives into: a pink screen cell centre, left of the landing (away from the disc's shadow),
 * where the frozen print leaves an isolated, mid-size dot (tone ≈ 0.5). Poster p-coordinates (y up).
 */
export function diveTarget(poster: Poster, tau: number) {
  const u = poster.sheet.mat.uniforms;
  const mis = (u.uMis.value as THREE.Vector2[])[0]!;
  const cell = u.uCell.value as number, hMod = u.uHMod.value as number;
  const a = 1.309, c = Math.cos(a), s = Math.sin(a);
  let best = { x: 0, y: 0, e: Infinity };
  for (let gy = -60; gy <= 60; gy++) for (let gx = -60; gx <= 60; gx++) {
    const nx = gx + 0.5, ny = gy + 0.5;
    const Qx = cell * (c * nx - s * ny), Qy = cell * (s * nx + c * ny);
    const px = Qx - mis.x, py = Qy - mis.y;
    const lx = px, ly = H - py;
    const r = Math.hypot(lx - RS.x, ly - RS.y);
    // below-left of the landing: away from the caption (top-left) and the disc's shadow (lower right)
    if (lx > RS.x - 20 || ly < RS.y + 18 || r < 55 || r > 105) continue;
    const tone = sunTone(lx, ly) + (rippleH(lx, ly, tau) / RIP.A) * hMod;
    const e = Math.abs(tone - 0.52) + 0.002 * Math.abs(r - 80);
    if (e < best.e) best = { x: px, y: py, e };
  }
  return { x: best.x, y: best.y };
}

export class Droste {
  pass: FSPass;
  target: { x: number; y: number };
  constructor(public poster: Poster, sun: THREE.DirectionalLight, sky: THREE.HemisphereLight) {
    this.target = diveTarget(poster, rippleTau(RK.beku + 1));
    const pu = poster.sheet.mat.uniforms;
    const u = {
      ...inkUniforms({ size: [pu.uSize.value.x, pu.uSize.value.y], paper: RISO_LIN.sheet }),
      uZ: { value: 0 }, uTau: { value: 0 },
      uT: { value: new THREE.Vector2(this.target.x, this.target.y) },
      uRS: { value: new THREE.Vector2(RS.x, H - RS.y) },
      uField: { value: new THREE.Vector4(PL.field.x, H - PL.field.y - PL.field.h, PL.field.x + PL.field.w, H - PL.field.y) },
      uOrigin: { value: new THREE.Vector2(POSTER.x0, POSTER.y0) },
      uSun: { value: new THREE.Vector3(sun.color.r, sun.color.g, sun.color.b).multiplyScalar(sun.intensity) },
      uSkyC: { value: new THREE.Vector3(sky.color.r, sky.color.g, sky.color.b).multiplyScalar(sky.intensity) },
      uL: { value: LIGHT_DIR.clone() },
      uRip: { value: new THREE.Vector4(RIP.A, RIP.v, RIP.lambda, RIP.sigma) },
      uTl: { value: RK.lontar - RK.jatuh },
      uPool: POOL,
    };
    // share the poster's print (same textures and screens)
    for (const k of ['uTone', 'uSolid', 'uK', 'uCell', 'uSeed', 'uFiber', 'uInkOn', 'uHMod', 'uMis', 'uPaper'] as const) (u as any)[k] = pu[k];
    this.pass = new FSPass(/* glsl */ `
      ${INK_UNIFORMS_GLSL}
      ${INK_FUNCS_GLSL}
      uniform float uZ, uTau, uTl;
      uniform vec2 uT, uRS, uOrigin;
      uniform vec4 uField, uRip;
      uniform vec3 uSun, uSkyC, uL, uPool;
      const float ZL = ${ZL.toFixed(4)};
      const float FW = ${FW_H.toFixed(4)};
      const float POSTER_H = ${H.toFixed(3)};

      // rippleH (stations/poster.ts), in p-coordinates
      float ripH(vec2 p) {
        if (uTau < 0.0) return 0.0;
        float r = length(p - uRS);
        float A = uRip.x, v = uRip.y, lam = uRip.z, sg = uRip.w;
        float att = 1.0 / sqrt(1.0 + r / 22.0);
        float h = -2.2 * exp(-(r * r) / (2.0 * 196.0)) * exp(-uTau * 9.0);
        h += 3.4 * exp(-(r * r) / (2.0 * 121.0)) * exp(-pow(uTau - uTl, 2.0) / (2.0 * 0.0121));
        for (int i = 0; i < 2; i++) {
          float t0 = i == 0 ? 0.0 : uTl + 0.08, a = i == 0 ? A * 1.25 : A * 0.8;
          float t = uTau - t0;
          if (t >= 0.0) { float d = r - v * t; h += a * exp(-(d * d) / (2.0 * sg * sg)) * cos(6.2831853 * d / lam) * exp(-t * 0.35); }
        }
        h *= att;
        float inside = min(min(p.x - uField.x, uField.z - p.x), min(p.y - uField.y, uField.w - p.y));
        return h * clamp((inside + 6.0) / 26.0, 0.0, 1.0);
      }
      vec3 ripN(vec2 p) {
        float e = 0.35;
        float hx = ripH(p + vec2(e, 0.0)) - ripH(p - vec2(e, 0.0));
        float hy = ripH(p + vec2(0.0, e)) - ripH(p - vec2(0.0, e));
        return normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
      }
      vec3 lit(vec3 n, vec2 world) {
        float u = dot(world, normalize(vec2(-0.55, 0.83))) / 1300.0; float k = clamp(0.5 + u, 0.0, 1.0);
        float wf = 0.84 + 0.3 * k * k * (3.0 - 2.0 * k);
        vec2 dp = (world - uPool.xy - vec2(-0.12, 0.1) * uPool.z) / uPool.z;
        wf *= 0.78 + 0.3 * exp(-0.5 * dot(dp, dp));
        return (uSun * max(dot(n, uL), 0.0) + uSkyC) / 3.14159265 * wf;
      }
      /** the paper tooth's relief under the raking light, as in the lit material (k = picture units per px) */
      vec3 bump(vec3 n, vec2 p, float k) {
        float amp = 0.05 * uFiber * (1.0 - smoothstep(0.35, 1.2, k));
        if (amp <= 0.0) return n;
        float t0 = toothH(p);
        vec2 g = vec2(toothH(p + vec2(k, 0.0)) - t0, toothH(p + vec2(0.0, k)) - t0) / k;
        return normalize(n - vec3(amp * g, 0.0));
      }
      vec3 paperAt(vec2 p) { float th = toothH(p); return uPaper * paperMottle(p) * (1.0 + 0.06 * uFiber * (th - 0.6)); }
      float toneAt(vec2 p) { return texture(uTone, p / uSize).r + ripH(p) / uRip.x * uHMod; }
      /** coverage of level ink at picture point p, screen anchored so that c is a cell centre */
      float levelCov(int lv, vec2 p, vec2 c) {
        float tone = toneAt(p);
        float cov = 0.0;
        if (lv == 3) {
          // 1-bit ordered dither (Bayer 8x8), square printer pixels
          float pix = uCell * 0.55;
          ivec2 g = ivec2(floor((p - c) / pix)) & 7;
          int x = g.x, y = g.y;
          int b = 0;
          for (int i = 0; i < 3; i++) { int s = 2 - i; int xb = (x >> i) & 1, yb = (y >> i) & 1; b |= ((xb ^ yb) << (2 * s + 1)) | (yb << (2 * s)); }
          float thr = (float(b) + 0.5) / 64.0;
          cov = step(thr, tone * 0.92);
        } else {
          float ang = lv == 1 ? 0.2618 : 0.0;
          vec2 g = pRot(ang) * (p - c) / uCell + 0.5;
          vec2 f = fract(g) - 0.5;
          float s = 0.5 - 0.25 * (cos(6.2831853 * f.x) + cos(6.2831853 * f.y));
          float t2 = tone + (vN(p * 2.3) - 0.5) * 0.07;
          float w = fwidth(s) * 0.75 + 1e-4;
          cov = smoothstep(-w, w, t2 - s) * inkLay(p, float(lv), 0.8);
        }
        return cov;
      }
      vec3 levelInk(int lv) { return lv == 1 ? INK_B : lv == 2 ? INK_Y : INK_K; }

      void main() {
        vec2 px = (vUv - 0.5) * vec2(1080.0, 1920.0);
        int L = int(floor(uZ / ZL + 1e-5));
        float within = uZ - float(L) * ZL;          // octaves into this level
        float k0 = FW / 1080.0 * exp2(-within);      // picture units per px at this level
        vec3 col, n;
        vec2 pL;
        float covT;                                  // coverage of the dot we dive into
        if (L == 0) {
          pL = uT + px * k0;
          float th = toothH(pL);
          float hm = ripH(pL) / uRip.x * uHMod;
          col = paperAt(pL) * inkMul(pL, th, hm);
          n = bump(ripN(pL), pL, k0);
          // the pink screen's coverage alone (the dot)
          vec2 q = pL + uMis[0];
          covT = halftone(q, 1.309, uCell, texture(uTone, q / uSize).r + hm) * inkLay(q, 0.0, th);
        } else {
          pL = uRS + px * k0;
          float cv = levelCov(L, pL, uRS);
          col = paperAt(pL) * mix(vec3(1.0), levelInk(L), cv);
          n = bump(ripN(pL), pL, k0);
          covT = cv;
        }
        vec2 world = uOrigin + (L == 0 ? pL : uT);
        vec3 c = col * lit(n, world);
        // the next level, revealed inside this level's dots as they fill the frame
        if (L < 3) {
          float r = smoothstep(0.7, 2.0, within);
          if (r > 0.0) {
            vec2 pN = uRS + px * k0 * exp2(ZL);
            float cn = levelCov(L + 1, pN, uRS);
            // the dot's own ink stays under the new picture at first, then gives way to paper
            vec3 bgInk = L == 0 ? INK_P : levelInk(L);
            float fb = smoothstep(2.2, 5.2, within);
            vec3 inner = paperAt(pN) * mix(bgInk, vec3(1.0), fb) * mix(vec3(1.0), levelInk(L + 1), cn) * lit(bump(ripN(pN), pN, k0 * exp2(ZL)), world);
            c = mix(c, inner, clamp(covT * 1.15, 0.0, 1.0) * r);
          }
        }
        fragColor = vec4(c, 1.0);
      }`, u);
  }

  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, z: number, tau: number) {
    this.pass.u.uZ!.value = z;
    this.pass.u.uTau!.value = tau;
    this.pass.render(renderer, out);
  }
}
