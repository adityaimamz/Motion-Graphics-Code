// The display, from macro to arm's length (S1, S2 descent, S8 landing, S9, loop-out). A fullscreen ray
// shader in display units (1 = one pixel pitch, 63.5 µm; x = column 0..1080, y = row 0..2400 downward,
// z up out of the screen). Layers, top to bottom: cover glass top (z = 8.7) with fingerprint + dust, touch
// metal mesh (z = 3), emitters (z = 0, Samsung-style diamond: R/B diamonds on a checkerboard, G ovals on
// the corners), TFT backplane (z = -0.12, the gate line being scanned glows), polyimide (z = -0.5), back
// plate (z = -6). A row shows the new frame once the refresh line has passed it, with a short write flash.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';
import type { Ctx } from '../world';

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform float scan, newLevel, oldLevel, flashLen, lineGlow, gain, sheen, useOld, depthOut, touchK, tftK, envK;
uniform sampler2D oldTex; uniform vec4 oldRect; uniform float oldK;
// below the emitters the layers are spread out (true scale is microns) so the descent can see them
const float GLASS = 8.7, TOUCH = 3.0, TFT = -9.0, PI_Z = -11.0, BACK = -16.0;
const vec3 SR = ${v3c(LIN.subR)}, SG = ${v3c(LIN.subG)}, SB = ${v3c(LIN.subB)};
const vec3 METAL = ${v3c(LIN.copper)};

// the dark room, seen reflected in the glass: a faint cool window up-left and a floor-ish gradient
vec3 env(vec3 d) {
  float g = 0.0025 + 0.004 * sat(d.z);
  vec2 w = vec2(atan(d.y, d.x), d.z);
  float win = smoothstep(0.34, 0.2, abs(w.x + 2.1)) * smoothstep(0.1, 0.22, d.z) * smoothstep(0.7, 0.5, d.z);
  return vec3(g) + ${v3c(LIN.paper)} * win * 0.05 * envK;
}

float rowLit(float row) { return row < floor(scan) ? 1.0 : 0.0; }
vec3 contentAt(vec2 cell) {
  if (cell.x < 0.0 || cell.x >= 1080.0 || cell.y < 0.0 || cell.y >= 2400.0) return vec3(0.0);
  if (cell.y < floor(scan)) return vec3(newLevel);
  if (useOld > 0.5) {
    vec2 uv = (cell + 0.5 - oldRect.xy) / (oldRect.zw - oldRect.xy);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
    return texture(oldTex, vec2(1.0 - uv.x, 1.0 - uv.y)).rgb * oldK;   // display x runs right-to-left seen from the front
  }
  return vec3(oldLevel);
}
float flashOf(float row) { float a = floor(scan) - row - 1.0; return a < 0.0 ? 0.0 : exp(-a / flashLen); }

// light scattered by a fingerprint film and dust on the glass top, lit by the emission under it
float litBelow(float row) { return smoothstep(floor(scan) + 6.0, floor(scan) - 6.0, row); }
vec3 glassTop(vec2 p, float fp) {
  // fingerprint: ridge whorl masked by a soft blob
  vec2 c = vec2(505.0, 26.0);
  vec2 d = (p - c) * vec2(1.0, 1.35);
  float ridges = 0.5 + 0.5 * sin(length(d) * 3.4 + snoise(p * 0.05) * 3.0);
  float blob = smoothstep(46.0, 10.0, length(d) + snoise(p * 0.03) * 10.0);
  float smear = smoothstep(0.35, 0.8, ridges) * blob * 0.6 + blob * 0.08;
  smear *= 1.0 - smoothstep(0.4, 1.2, fp);
  // dust: one speck in some 7x7 cells
  vec2 dc = floor(p / 7.0);
  vec2 h = hash22(dc);
  float speck = 0.0;
  if (hash12(dc + 3.1) < 0.18) {
    vec2 sp = (dc + 0.15 + 0.7 * h) * 7.0;
    float rr = 0.06 + 0.2 * hash12(dc + 7.7);
    speck = 1.0 - smoothstep(rr - fp, rr + fp, length(p - sp));
  }
  float L = litBelow(p.y) * newLevel;
  return (vec3(0.9, 0.95, 1.0) * smear * 0.16 + vec3(1.0) * speck * 3.0) * L;
}

const vec2 HOLE = vec2(540.0, 58.0); const float HOLE_R = 24.0;
// outside the active area and inside the punch-hole: black glass, the lens, the metal frame lip
vec3 inactive(vec2 p, float fp, vec3 d, out float isIn) {
  isIn = 0.0;
  float r = length(p - HOLE);
  if (r < HOLE_R + 1.2) {
    isIn = 1.0;
    // lens: dark glass with concentric barrel rings and a small cool specular
    float rings = 0.5 + 0.5 * cos(r * 1.6);
    float edge = exp(-abs(r - HOLE_R) / 0.6);
    vec3 c = vec3(0.004) + vec3(0.02, 0.022, 0.026) * rings * smoothstep(HOLE_R, 4.0, r) + vec3(0.05) * edge;
    c += vec3(0.6, 0.7, 0.9) * exp(-length(p - HOLE - vec2(-6.0, -7.0)) / 1.4) * 0.5;
    // the lit rows reflected in the lens rim
    c += ${v3c(LIN.paper)} * edge * 0.25 * litBelow(HOLE.y + HOLE_R) * newLevel;
    return c;
  }
  if (p.x < 0.0 || p.x > 1080.0 || p.y < 0.0 || p.y > 2400.0) {
    isIn = 1.0;
    float dout = max(max(-p.x, p.x - 1080.0), max(-p.y, p.y - 2400.0));
    vec3 c = vec3(0.0035) * (0.8 + 0.2 * snoise(p * 0.7));
    // the frame's polished lip, ~50 px beyond the active area
    c += ${v3c(LIN.paper)} * exp(-abs(dout - 52.0) / 1.2) * 0.06;
    if (dout > 54.0) c = vec3(0.0);
    return c;
  }
  return vec3(0.0);
}

// emission of the emitter plane at p (display units), with the footprint fp for filtering
vec3 emitters(vec2 p, float fp, out float cover) {
  // R/B diamonds at (i+.5, j+.5), R when i+j even
  vec2 ci = floor(p);
  vec2 q = p - ci - 0.5;
  float isR = mod(ci.x + ci.y, 2.0) < 0.5 ? 1.0 : 0.0;
  float rd = mix(0.40, 0.355, isR);
  float dd = (abs(q.x) + abs(q.y) - rd) * 0.7071;
  // G ovals at (i, j), axis alternating +-45 deg
  vec2 gi = floor(p + 0.5);
  vec2 gq = p - gi;
  float sgn = mod(gi.x + gi.y, 2.0) < 0.5 ? 1.0 : -1.0;
  vec2 gr = vec2(gq.x + sgn * gq.y, gq.y - sgn * gq.x) * 0.7071;
  float dg = (length(gr / vec2(0.235, 0.135)) - 1.0) * 0.135;
  float aa = max(fp, 0.004) * 0.9;
  float mD = 1.0 - smoothstep(-aa, aa, dd), mG = 1.0 - smoothstep(-aa, aa, dg);
  // which pixel each subpixel belongs to: diamond -> (ci), G -> (gi - (0,1)) (its row is the one above the corner)
  vec3 cD = contentAt(ci), cG = contentAt(gi - vec2(0.0, 1.0));
  float fD = flashOf(ci.y), fG = flashOf(gi.y - 1.0);
  // bevelled pixel-define wall: a bright rim just inside each emitter, faint mottling of the organic film
  float rimD = exp(-abs(dd + 0.02) / 0.018) * 0.35, rimG = exp(-abs(dg + 0.015) / 0.014) * 0.35;
  float mott = 0.93 + 0.07 * snoise(p * 23.0);
  vec3 colD = mix(SB, SR, isR);
  float chD = mix(cD.b, cD.r, isR);
  vec3 e = colD * mD * (chD * (1.0 + 2.4 * fD) * gain * mix(0.9, 1.05, isR) * (mott + rimD))
         + SG * mG * (cG.g * (1.0 + 2.4 * fG) * gain * 1.25 * (mott + rimG));
  // off emitters: tinted dark glass with a sheen
  vec3 off = (colD * mD + SG * mG) * 0.012 + vec3(0.004) * (1.0 - max(mD, mG));
  cover = max(mD, mG);
  vec3 near = e + off * sheen;
  // far: the pattern's mean (areas: R .13, B .16, G .1 per pixel)
  vec3 avgC = contentAt(floor(p));
  float avgF = flashOf(floor(p.y));
  vec3 far = (SR * 0.128 * avgC.r * 0.95 + SB * 0.16 * avgC.b * 0.9 + SG * 0.1 * avgC.g * 1.25) * gain * (1.0 + 2.4 * avgF) + vec3(0.005) * sheen;
  return mix(near, far, smoothstep(0.22, 0.75, fp));
}

// TFT backplane: gate lines (rows), data lines (columns), transistors; the scanned gate line glows
vec3 tft(vec2 p, float fp) {
  vec2 f = fract(p), ci = floor(p);
  float aa = max(fp, 0.003);
  float gate = 1.0 - smoothstep(0.022 - aa, 0.022 + aa, abs(f.y - 0.08));
  float data = 1.0 - smoothstep(0.018 - aa, 0.018 + aa, abs(f.x - 0.08));
  float tr = 1.0 - smoothstep(-aa, aa, sdBox(f - vec2(0.2, 0.16), vec2(0.07, 0.045)));
  float cap = 1.0 - smoothstep(-aa, aa, sdBox(f - vec2(0.55, 0.55), vec2(0.2, 0.16)));
  float metal = max(max(gate, data), max(tr, cap * 0.6));
  float onRow = ci.y == floor(scan) ? 1.0 : 0.0;
  vec3 col = METAL * metal * 0.16 * tftK + vec3(0.03, 0.02, 0.009) * (1.0 - metal) * tftK;
  col += ${v3c(LIN.ice)} * (gate * 5.0 + tr * 2.5) * onRow * tftK;
  return col;
}

// on-cell touch sensor: fine metal mesh forming large diamonds (pitch ~ 5.5 px)
float touchMesh(vec2 p, float fp) {
  vec2 r = vec2(p.x + p.y, p.y - p.x) * 0.7071 / 5.5;
  vec2 f = abs(fract(r) - 0.5);
  float w = 0.012, aa = max(fp / 5.5, 0.002);
  return max(1.0 - smoothstep(w - aa, w + aa, 0.5 - f.x), 1.0 - smoothstep(w - aa, w + aa, 0.5 - f.y)) * 0.8;
}

void main() {
  vec3 col = vec3(0.0);
  float depth = 0.0;
  for (int k = ssK0(); k < ssK1(); k++) {
    vec2 px = gl_FragCoord.xy / PX_SCALE + rgss(k);
    vec3 d = camRay(px);
    vec3 o = camPos;
    vec3 acc = vec3(0.0);
    float T = 1.0;          // transmittance along the ray
    float dz = 0.0;         // view depth of the main (emitter) hit
    float fwd = dot(d, camFwd);
    // 1. glass top (only when the camera is above it)
    if (o.z > GLASS && d.z < 0.0) {
      float tg = (o.z - GLASS) / -d.z;
      vec3 hp = o + d * tg;
      float fp = tg * tanHalf * 2.0 / ${1920.0.toFixed(1)} / max(-d.z, 0.05);
      float cosi = -d.z;
      float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      acc += env(reflect(d, vec3(0.0, 0.0, 1.0))) * F;
      acc += glassTop(hp.xy, fp) * (1.0 - F);
      T *= 1.0 - F;
      o = hp;
    }
    // 2. touch mesh (thin metal, partly occluding)
    if (o.z > TOUCH && d.z < 0.0 && touchK > 0.0) {
      float tt = (o.z - TOUCH) / -d.z;
      vec3 hp = o + d * tt;
      float fp = length(hp - camPos) * tanHalf * 2.0 / 1920.0 / max(-d.z, 0.05);
      float m = touchMesh(hp.xy, fp) * touchK;
      acc += T * m * (METAL * 0.03 + ${v3c(LIN.paper)} * 0.25 * litBelow(hp.y) * newLevel);
      T *= 1.0 - m * 0.85;
    }
    // 3. emitters (opaque)
    if (o.z > 0.0 && d.z < 0.0) {
      float te = o.z / -d.z;
      vec3 hp = o + d * te;
      float dist = length(hp - camPos);
      float fp = dist * tanHalf * 2.0 / 1920.0 / max(-d.z, 0.03);
      float cov, isIn;
      vec3 ina = inactive(hp.xy, fp, d, isIn);
      if (isIn > 0.5) { acc += T * ina; cov = 1.0; }
      else acc += T * emitters(hp.xy, fp, cov);
      // the refresh line: faint ice glow along the row being written (seen through the stack)
      float ly = abs(hp.y - floor(scan) - 0.5);
      acc += T * ${v3c(LIN.ice)} * lineGlow * exp(-ly / max(0.35, fp)) * (1.0 - cov * 0.7) * step(0.0, hp.x) * step(hp.x, 1080.0);
      dz = dist * fwd;
      T = 0.0;
    }
    // 4. below the emitters: TFT, polyimide, back plate
    if (T > 0.0 && o.z > TFT && d.z < 0.0) {
      float tb = (o.z - TFT) / -d.z;
      vec3 hp = o + d * tb;
      float dist = length(hp - camPos);
      float fp = dist * tanHalf * 2.0 / 1920.0 / max(-d.z, 0.03);
      acc += T * tft(hp.xy, fp);
      dz = dist * fwd;
      T = 0.0;
    }
    if (T > 0.0 && o.z > PI_Z && d.z < 0.0) {
      float tb = (o.z - PI_Z) / -d.z;
      vec3 hp = o + d * tb;
      acc += T * vec3(0.012, 0.008, 0.004) * (0.8 + 0.2 * snoise(hp.xy * 3.0));
      dz = length(hp - camPos) * fwd;
      T = 0.0;
    }
    if (T > 0.0 && d.z < 0.0) {
      float tb = (o.z - BACK) / -d.z;
      vec3 hp = o + d * tb;
      acc += T * METAL * 0.004 * (0.7 + 0.3 * snoise(hp.xy * 0.8));
      dz = length(hp - camPos) * fwd;
    }
    if (dz <= 0.0) { acc += T * env(d); dz = 1e6; }
    col += acc;
    depth += dz;
  }
  if (depthOut > 0.5) { fragColor = vec4(depth * ssWeight(), 0.0, 0.0, 1.0); return; }
  fragColor = vec4(col * ssWeight(), 1.0);
}`;

export interface ScreenState {
  /** refresh line (rows written so far), 0..2400+ */
  scan: number;
  /** brightness of the new frame (rows above the line) and of the old one below it */
  newLevel?: number;
  oldLevel?: number;
  /** show a texture as the old frame, placed at oldRect (display px: x0, y0, x1, y1) */
  oldTex?: THREE.Texture | null;
  oldRect?: [number, number, number, number];
  oldK?: number;
  lineGlow?: number;
  gain?: number;
  touch?: number;
  tft?: number;
}

class Screen {
  pass = new FSPass(FRAG, {
    ...camUniforms(),
    ssTap: SS_TAP,
    scan: { value: 0 }, newLevel: { value: 1 }, oldLevel: { value: 0 }, flashLen: { value: 1.6 }, lineGlow: { value: 0.6 },
    gain: { value: 3.2 }, sheen: { value: 1 }, useOld: { value: 0 }, depthOut: { value: 0 }, touchK: { value: 1 }, tftK: { value: 1 }, envK: { value: 1 },
    oldTex: { value: null }, oldK: { value: 1 }, oldRect: { value: new THREE.Vector4(0, 240, 1080, 2160) },
  });

  render(ctx: Ctx, cam: Cam, s: ScreenState, out: THREE.WebGLRenderTarget) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.scan!.value = s.scan;
    u.newLevel!.value = s.newLevel ?? 1;
    u.oldLevel!.value = s.oldLevel ?? 0;
    u.useOld!.value = s.oldTex ? 1 : 0;
    u.oldTex!.value = s.oldTex ?? null;
    if (s.oldRect) (u.oldRect!.value as THREE.Vector4).set(...s.oldRect);
    u.oldK!.value = s.oldK ?? 1;
    u.lineGlow!.value = s.lineGlow ?? 0.6;
    u.gain!.value = s.gain ?? 3.2;
    u.touchK!.value = s.touch ?? 1;
    u.tftK!.value = s.tft ?? 1;
    const r3 = ctx.r3, ap = cam.ap ?? 0;
    if (ap < 0.3) { u.depthOut!.value = 0; this.pass.render(ctx.renderer, out); return; }
    u.depthOut!.value = 0; this.pass.render(ctx.renderer, r3.color);
    u.depthOut!.value = 1; this.pass.render(ctx.renderer, r3.depth);
    r3.dof(r3.color.texture, r3.depth.texture, out, cam.focus ?? cam.pos.distanceTo(cam.look), ap, 36);
  }
}

export const screen = new Screen();
