// The server's processor (S6), in millimetres, a fullscreen ray shader: the package substrate with its
// capacitors, the bare die (blocks of cores and cache arrays, rows of standard cells), and over it the
// clock-distribution H-tree (a real fractal structure in chips, simplified), drawn as a folded distance
// field. On every tick the clock edge leaves the root and runs out branch by branch (~13 ps per level at
// ×1.406.250.000 ≈ 18 ms of film), lighting the flip-flops at the leaves.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL, H } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';
import type { Ctx } from '../world';

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;
export const DIE = { w: 24, h: 18 };
export const LEVELS = 12;
export const LEVEL_DT = 0.018;

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform float since, answer, depthOut, keyK;
uniform vec2 band;                     // caption band: centre y (logical px from the top), presence 0..1
uniform float hudK;                    // the HUD corner (top left)
const vec3 ICE = ${v3c(LIN.ice)}, BLUE = ${v3c(LIN.blue)}, COPPER = ${v3c(LIN.copper)};
const float DW = ${(DIE.w / 2).toFixed(2)}, DH = ${(DIE.h / 2).toFixed(2)};
const int NL = ${LEVELS};
const float LDT = ${LEVEL_DT.toFixed(4)};

// the H-tree: coverage of every level at once (a finer branch never cuts into its trunk), and how lit
// it is by the clock edge that left the root 'since' ago (it reaches level i, fraction u, at (i+u)·LDT)
float htree(vec2 p, float fp, out float lit, out vec2 leafQ) {
  float L = 5.6, cover = 0.0;
  lit = 0.0;
  vec2 q = p;
  for (int i = 0; i < NL; i++) {
    float di = sdSegment(q, vec2(-L, 0.0), vec2(L, 0.0));
    // lines thinner than a pixel keep their ink instead of widening to the footprint
    float w = 0.09 * pow(0.78, float(i)), ww = max(w, fp);
    float c = (1.0 - smoothstep(ww - fp, ww + fp, di)) * min(1.0, w / fp);
    float dtE = since - (float(i) + clamp(abs(q.x) / L, 0.0, 1.0)) * LDT;
    cover = max(cover, c);
    lit = max(lit, c * (dtE >= 0.0 ? exp(-dtE / 0.09) : 0.0));
    q.x = abs(q.x) - L;
    q = q.yx;
    L *= 0.70710678;
  }
  leafQ = q;
  return cover;
}

// the flashes are kept dimmer behind the type (caption band, HUD corner): a soft falloff of the light
// only, the die itself stays as it is, nothing follows the letters
float typeDim() {
  vec2 px = vec2(gl_FragCoord.x, ${H}.0 * PX_SCALE - gl_FragCoord.y) / PX_SCALE;
  float b = band.y * (1.0 - smoothstep(60.0, 240.0, abs(px.y - band.x)));
  vec2 h = (px - vec2(260.0, 345.0)) / vec2(380.0, 140.0);
  float hc = hudK * (1.0 - smoothstep(0.75, 1.9, length(h)));
  return 1.0 - 0.85 * max(b, hc);
}

vec3 dieSurface(vec2 p, float fp, out float emis) {
  emis = 0.0;
  // package substrate + capacitors around the die
  if (abs(p.x) > DW || abs(p.y) > DH) {
    vec3 c = vec3(0.012, 0.014, 0.012);
    vec2 cp = vec2(mod(p.x + 0.5, 1.4) - 0.7, mod(p.y, 1.1) - 0.55);
    float ring = step(DW + 0.8, abs(p.x)) * step(abs(p.x), DW + 4.0) + step(DH + 0.8, abs(p.y)) * step(abs(p.y), DH + 4.0);
    float cap = (1.0 - smoothstep(-fp, fp, sdBox(cp, vec2(0.3, 0.16)))) * clamp(ring, 0.0, 1.0);
    c = mix(c, vec3(0.2, 0.2, 0.21), cap);
    if (abs(p.x) > 26.0 || abs(p.y) > 26.0) c = vec3(0.004);
    return c;
  }
  // die: dark silicon; cores (2 x 4) with cache arrays, standard-cell rows everywhere
  vec3 c = vec3(0.022, 0.024, 0.03);
  vec2 cell = vec2(floor((p.x + DW) / 6.0), floor((p.y + DH) / 9.0));
  vec2 lc = vec2(mod(p.x + DW, 6.0), mod(p.y + DH, 9.0));
  float cacheA = step(0.4, lc.x) * step(lc.x, 2.4) * step(0.4, lc.y) * step(lc.y, 8.6);
  float fine = 0.5 + 0.5 * sin(p.y * 180.0) * sin(p.x * 23.0);
  float rows = 0.5 + 0.5 * sin(p.y * 260.0);
  float aa = smoothstep(0.02, 0.08, fp);
  c += vec3(0.012, 0.013, 0.018) * mix(cacheA * fine + (1.0 - cacheA) * rows * 0.5, 0.35, aa);
  // block outlines and a hint of the metal grid
  float edge = min(min(lc.x, 6.0 - lc.x), min(lc.y, 9.0 - lc.y));
  c += vec3(0.03) * (1.0 - smoothstep(0.0, max(fp * 1.5, 0.04), edge));
  c *= 0.9 + 0.2 * hash12(cell);
  // the clock tree: copper when idle, ice as the edge runs through it
  vec2 lq;
  float lit;
  float line = htree(p, fp, lit, lq);
  c = mix(c, COPPER * 0.09, line);
  emis += lit * 5.0 + line * answer * 3.0;
  // flip-flops at the leaves light up when the edge arrives
  float leaf = 1.0 - smoothstep(0.035 - fp, 0.035 + fp, max(abs(lq.x), abs(lq.y)));
  float dL = since - float(NL) * LDT;
  emis += leaf * (dL >= 0.0 ? exp(-dL / 0.14) * 4.0 : 0.0);
  c = mix(c, vec3(0.05), leaf);
  return c;
}

void main() {
  vec3 col = vec3(0.0); float depth = 0.0;
  float dim = typeDim();
  for (int k = ssK0(); k < ssK1(); k++) {
    vec3 o = camPos, d = camRay(gl_FragCoord.xy / PX_SCALE + rgss(k));
    if (d.z >= -1e-4) { depth += 1e5; continue; }
    float t = o.z / -d.z;
    vec3 p = o + d * t;
    float fp = t * tanHalf * 2.0 / 1920.0 / max(-d.z, 0.1);
    float em;
    vec3 base = dieSurface(p.xy, fp, em);
    // a soft key from the upper left: the die's sheen
    vec3 L = normalize(vec3(-0.5, 0.6, 0.62));
    float spec = pow(max(0.0, dot(reflect(d, vec3(0.0, 0.0, 1.0)), L)), 18.0);
    col += base * (0.4 + 0.6 * keyK) + vec3(0.05, 0.055, 0.07) * spec * keyK * step(abs(p.x), DW) * step(abs(p.y), DH) + ICE * em * dim;
    depth += t * dot(d, camFwd);
  }
  if (depthOut > 0.5) { fragColor = vec4(depth * ssWeight(), 0.0, 0.0, 1.0); return; }
  fragColor = vec4(col * ssWeight(), 1.0);
}`;

class Die {
  pass = new FSPass(FRAG, { ...camUniforms(), ssTap: SS_TAP, since: { value: 99 }, answer: { value: 0 }, depthOut: { value: 0 }, keyK: { value: 1 }, band: { value: new THREE.Vector2(0, 0) }, hudK: { value: 0 } });
  /** `since` = film seconds since the last clock tick; `answer` = the response leaving (whole tree lit);
   *  `type` = where the caption sits and how present it and the HUD are (the flashes stay dim behind them). */
  render(ctx: Ctx, cam: Cam, since: number, answer: number, out: THREE.WebGLRenderTarget, type: { band?: { y: number; k: number } | null; hud?: number } = {}) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.since!.value = since; u.answer!.value = answer;
    (u.band!.value as THREE.Vector2).set(type.band?.y ?? 0, type.band?.k ?? 0);
    u.hudK!.value = type.hud ?? 0;
    const r3 = ctx.r3, ap = cam.ap ?? 0;
    if (ap < 0.3) { u.depthOut!.value = 0; this.pass.render(ctx.renderer, out); return; }
    u.depthOut!.value = 0; this.pass.render(ctx.renderer, r3.color);
    u.depthOut!.value = 1; this.pass.render(ctx.renderer, r3.depth);
    r3.dof(r3.color.texture, r3.depth.texture, out, cam.focus ?? cam.pos.distanceTo(cam.look), ap, 24);
  }
}

export const die = new Die();
