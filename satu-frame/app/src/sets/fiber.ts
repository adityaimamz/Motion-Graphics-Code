// Inside one optical fibre (S5 macro), in micrometres: bare silica cladding 125 µm across (coating left out),
// core 9 µm, the guided light's mode ~10.4 µm across (it spills a little past the core: the evanescent
// field). The camera rides with the packet inside the cladding: the wall reflects grazing rays totally, so
// the lit core repeats around the tube like a kaleidoscope (a real consequence of total internal reflection).
// The light is infrared (1550 nm) in reality; drawn in false colour, with faint fringes at the wavelength in
// glass (1.056 µm) to suggest the wave.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';
import type { Ctx } from '../world';

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform float pK, phase, flash;
const float RC = 62.5, W0 = 5.2, NG = 1.444;
const vec3 ICE = ${v3c(LIN.ice)}, BLUE = ${v3c(LIN.blue)};

// light from the guided mode collected along a ray segment [0, tmax] inside the glass
float modeGlow(vec3 o, vec3 d, float tmax) {
  float a = dot(d.xy, d.xy);
  float tc = a > 1e-10 ? clamp(-dot(o.xy, d.xy) / a, 0.0, tmax) : tmax * 0.5;
  float span = a > 1e-10 ? min(tmax, 5.0 * W0 / sqrt(a)) : tmax;
  float sum = 0.0;
  const int N = 18;
  for (int i = 0; i < N; i++) {
    float s = tc + ((float(i) + 0.5) / float(N) - 0.5) * span;
    if (s < 0.0 || s > tmax) continue;
    vec3 p = o + d * s;
    float fr = 0.72 + 0.28 * cos(6.2832 * (p.z + phase) / 1.056);
    sum += exp(-2.0 * dot(p.xy, p.xy) / (W0 * W0)) * fr;
  }
  return sum * span / float(N);
}
// exit distance from inside a cylinder of radius R around z
float exitT(vec3 o, vec3 d, float R) {
  float a = dot(d.xy, d.xy);
  if (a < 1e-10) return 4000.0;
  float b = dot(o.xy, d.xy), c = dot(o.xy, o.xy) - R * R;
  return min(4000.0, (-b + sqrt(max(b * b - a * c, 0.0))) / a);
}

void main() {
  vec3 col = vec3(0.0);
  for (int k = ssK0(); k < ssK1(); k++) {
    vec3 o = camPos, d = camRay(gl_FragCoord.xy / PX_SCALE + rgss(k));
    vec3 acc = vec3(0.0);
    float thr = 1.0;
    // outside the glass: hit the cladding, refract in (a faint reflection of the dark tube)
    if (dot(o.xy, o.xy) > RC * RC) {
      float a = dot(d.xy, d.xy), b = dot(o.xy, d.xy), c = dot(o.xy, o.xy) - RC * RC, h = b * b - a * c;
      if (h < 0.0 || a < 1e-10) { col += vec3(0.0006, 0.0008, 0.0014); continue; }
      float t = (-b - sqrt(h)) / a;
      if (t < 0.0) { col += vec3(0.0006, 0.0008, 0.0014); continue; }
      o = o + d * t;
      vec3 n = normalize(vec3(o.xy, 0.0));
      float F = 0.04 + 0.96 * pow(1.0 - abs(dot(d, n)), 5.0);
      acc += vec3(0.02, 0.025, 0.035) * F;
      thr *= 1.0 - F;
      d = refract(d, n, 1.0 / NG);
    }
    // inside: collect the mode's light, bounce off the wall (total internal reflection past the critical angle)
    for (int b = 0; b < 7; b++) {
      float t = exitT(o, d, RC);
      acc += thr * ICE * modeGlow(o, d, t) * pK * 0.007;
      vec3 p = o + d * t;
      vec3 n = normalize(vec3(p.xy, 0.0));
      float cosi = abs(dot(d, n));
      float sini = sqrt(max(0.0, 1.0 - cosi * cosi));
      float R = sini > 1.0 / NG ? 0.96 : 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      // the wall itself: a faint glint of the light around it
      acc += thr * (1.0 - R) * vec3(0.001, 0.0015, 0.003);
      thr *= R;
      if (thr < 0.01) break;
      o = p - n * 0.01; d = reflect(d, n);
    }
    col += acc;
  }
  col *= ssWeight();
  col += ICE * flash * 0.15;
  fragColor = vec4(col, 1.0);
}`;

export interface FiberState { pK: number; phase: number; flash: number }

class Fiber {
  pass = new FSPass(FRAG, { ...camUniforms(), ssTap: SS_TAP, pK: { value: 1 }, phase: { value: 0 }, flash: { value: 0 } });
  render(ctx: Ctx, cam: Cam, s: FiberState, out: THREE.WebGLRenderTarget) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.pK!.value = s.pK; u.phase!.value = s.phase; u.flash!.value = s.flash;
    this.pass.render(ctx.renderer, out);
  }
}

export const fiber = new Fiber();
