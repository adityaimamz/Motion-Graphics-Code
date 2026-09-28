// The floor of the Java Sea at night (S5), in metres, a fullscreen ray shader. Local frame: the cable runs
// along −z (toward Singapore) at x = 0; z = 0 is where the camera is along the route (the world slides by:
// sCam = the camera's distance from Jakarta, mod 5 km for the noise). The only light is the request itself:
// an ~80 m packet of light in one fibre (500 B at 10 Gb/s = 400 ns of light), shown in false colour, glowing
// through the cable and scattering in murky water. Amplifier housings sit on the cable; each flashes as the
// packet passes. The cable can be peeled layer by layer (sheath, steel armour, copper, the steel tube with
// its fibres) for the push into the one lit fibre.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';
import type { Ctx } from '../world';

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform float sCam, headZ, pLen, pK, flash, repA, repB, peel, surf, rise, depthOut, murk;
const float R_SHEATH = 0.030, R_ARMOR = 0.024, R_CU = 0.0115, R_TUBE = 0.0036, R_FIB = 0.0000625;
const vec3 ICE = ${v3c(LIN.ice)}, BLUE = ${v3c(LIN.blue)}, COPPER = ${v3c(LIN.copper)};

// ---- the packet: a light segment in the lit fibre, from headZ (front) back to headZ + pLen
const vec3 fibreOff = vec3(0.0011, 0.0006, 0.0);    // the lit fibre inside the tube
float segDist(vec3 p, out float along) {
  float z = clamp(p.z, headZ, headZ + pLen);
  along = (z - headZ) / pLen;
  return length(p - vec3(fibreOff.x, R_SHEATH + fibreOff.y, z));
}
// light arriving at p from the packet (head brighter), murky-water absorption
float pulseLight(vec3 p) {
  float a;
  float d = segDist(p, a);
  float k = pK * (0.25 + 2.2 * exp(-a * 9.0));
  return k * exp(-murk * d) / (d * d + 0.02);
}
// ---- seabed height (world z = local z + sCam): long grooves along the route, soft ripples, a trench near the cable
float bed(vec2 xz) {
  float zw = xz.y + sCam;
  float h = 0.22 * snoise(vec2(xz.x * 0.07, zw * 0.0017)) + 0.05 * snoise(vec2(xz.x * 0.55, zw * 0.013))
          + 0.012 * sin(xz.x * 7.0 + snoise(vec2(xz.x * 0.3, zw * 0.05)) * 3.0);
  h -= 0.06 * exp(-xz.x * xz.x / 0.05);
  h += 0.006 * snoise(vec2(xz.x * 11.0, zw * 1.3)) + 0.004 * sin(zw * 0.9 + xz.x * 2.0);
  // the approach to Singapore: the floor rises ahead
  h += rise * max(0.0, -xz.y) * 0.08;
  return h;
}
// ray vs cylinder along z at (0, cy), radius r: nearest positive t or -1
float cyl(vec3 o, vec3 d, vec2 c, float r) {
  vec2 oc = o.xy - c; float a = dot(d.xy, d.xy);
  if (a < 1e-12) return -1.0;
  float b = dot(oc, d.xy), cc = dot(oc, oc) - r * r, h = b * b - a * cc;
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  float t0 = (-b - h) / a, t1 = (-b + h) / a;
  return t0 > 1e-6 ? t0 : -1.0;
}
// peel: each layer dissolves with its own noise threshold; returns 1 if the layer is still there at p
float present(vec3 p, float order) {
  float n = 0.5 + 0.5 * snoise(vec3(atan(p.y - R_SHEATH, p.x) * 3.0, (p.z + sCam) * 9.0, order * 7.0));
  return step(clamp(peel * 4.0 - order, 0.0, 1.0) * 1.08, n);
}

vec3 shadeCable(vec3 p, vec3 n, float layer) {
  float L = pulseLight(p);
  vec3 lp = vec3(0.0, R_SHEATH, clamp(p.z, headZ, headZ + pLen));
  float dif = 0.3 + 0.7 * max(0.0, dot(n, normalize(lp - p)));
  float ang = atan(p.y - R_SHEATH, p.x), zw = p.z + sCam;
  vec3 c;
  if (layer < 0.5) {                 // polyethylene sheath, with the armour's twist pressed through
    float ridge = 0.5 + 0.5 * sin(ang * 22.0 + zw * 90.0);
    c = vec3(0.012) * (0.8 + 0.4 * ridge);
    // the light inside shows through the sheath around the packet
    float a; float d = segDist(p, a);
    c += BLUE * pK * 0.02 * exp(-a * 3.0) * exp(-abs(p.z - clamp(p.z, headZ, headZ + pLen)) * 1.5) / (d * 40.0 + 0.2);
  } else if (layer < 1.5) {          // galvanised steel armour wires (helix)
    float w = fract(ang * 18.0 / 6.2832 + zw * 14.0);
    c = vec3(0.08, 0.085, 0.09) * (0.35 + 0.65 * smoothstep(0.0, 0.2, w) * smoothstep(1.0, 0.8, w));
  } else if (layer < 2.5) {          // copper power conductor
    c = COPPER * 0.12;
  } else {                           // stainless tube
    c = vec3(0.1, 0.105, 0.11);
  }
  return c * ICE * L * dif * 0.06 + c * surf * 0.05;
}

void main() {
  vec3 col = vec3(0.0); float depth = 0.0;
  for (int k = ssK0(); k < ssK1(); k++) {
    vec3 o = camPos, d = camRay(gl_FragCoord.xy / PX_SCALE + rgss(k));
    float tHit = 60.0; vec3 c = vec3(0.0); bool hit = false;
    // cable layers (outermost present one)
    float radii[4] = float[4](R_SHEATH, R_ARMOR, R_CU, R_TUBE);
    for (int l = 0; l < 4; l++) {
      float t = cyl(o, d, vec2(0.0, R_SHEATH), radii[l]);
      if (t > 0.0 && t < tHit) {
        vec3 p = o + d * t;
        // amplifier housing: a fat cylinder on the cable
        if (present(p, float(l)) > 0.5) {
          vec3 n = normalize(vec3(p.x, p.y - R_SHEATH, 0.0));
          tHit = t; c = shadeCable(p, n, float(l)); hit = true;
          break;
        }
      }
    }
    // the fibres loose in the tube's gel: glass threads 125 µm across; the lit one carries the packet
    for (int f = 0; f < 12; f++) {
      float a = float(f) * 0.5236 + 0.3, rr = f < 8 ? 0.0021 : 0.0009;
      vec2 fc = f == 0 ? fibreOff.xy + vec2(0.0, R_SHEATH) : vec2(cos(a), sin(a)) * rr + vec2(0.0, R_SHEATH);
      float t = cyl(o, d, fc, R_FIB);
      if (t > 0.0 && t < tHit) {
        vec3 p = o + d * t;
        vec3 n = normalize(vec3(p.xy - fc, 0.0));
        float spec = pow(max(0.0, dot(reflect(d, n), normalize(vec3(fibreOff.xy + vec2(0.0, R_SHEATH), clamp(p.z, headZ, headZ + pLen)) - p))), 40.0);
        float along; float dd = segDist(p, along);
        float lit = f == 0 ? pK * (0.35 + 0.65 * exp(-along * 5.0)) * step(headZ, p.z) * step(p.z, headZ + pLen) : 0.0;
        c = vec3(0.02, 0.022, 0.025) * spec * pulseLight(p) + ICE * lit * 1.4 * (0.4 + 0.6 * abs(n.x));
        tHit = t; hit = true;
      }
    }
    // amplifier housings (two nearest), 0.16 m radius, 1.4 m long
    for (int r = 0; r < 2; r++) {
      float rz = r == 0 ? repA : repB;
      float t = cyl(o, d, vec2(0.0, 0.16), 0.16);
      if (t > 0.0 && t < tHit) {
        vec3 p = o + d * t;
        if (abs(p.z - rz) < 0.7) {
          vec3 n = normalize(vec3(p.x, p.y - 0.16, 0.0));
          float L = pulseLight(p) + flash * 40.0 / (dot(p - vec3(0, 0.16, rz), p - vec3(0, 0.16, rz)) + 0.3);
          tHit = t; c = vec3(0.16, 0.17, 0.18) * L * (0.3 + 0.7 * max(0.0, n.y)) * 0.1 + ICE * flash * 0.4 * exp(-abs(p.z - rz) * 2.0);
          hit = true;
        }
      }
    }
    // seabed (march the height field)
    if (d.y < 0.0) {
      float t = max(0.0, (o.y - 0.4) / -d.y);
      for (int i = 0; i < 64; i++) {
        vec3 p = o + d * t;
        float h = p.y - bed(p.xz);
        if (h < 0.002 || t > tHit) break;
        t += max(h * 0.6, 0.004 + t * 0.002);
      }
      vec3 p = o + d * t;
      if (t < tHit && p.y - bed(p.xz) < 0.02) {
        float e = 0.02;
        vec3 n = normalize(vec3(bed(p.xz - vec2(e, 0)) - bed(p.xz + vec2(e, 0)), 2.0 * e, bed(p.xz - vec2(0, e)) - bed(p.xz + vec2(0, e))));
        vec3 lp = vec3(0.0, R_SHEATH, clamp(p.z, headZ, headZ + pLen));
        float L = pulseLight(p) * max(0.0, dot(n, normalize(lp - p)));
        // amplifier flash lights the floor around it
        for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.3, rz); L += flash * 60.0 * max(0.0, dot(n, normalize(-q))) / (dot(q, q) + 0.5) * exp(-murk * length(q)); }
        float zw = p.z + sCam;
        float grain = 0.55 + 0.25 * snoise(vec2(p.x * 3.0, zw * 0.3)) + 0.2 * snoise(vec2(p.x * 17.0, zw * 2.1));
        float pebble = smoothstep(0.62, 0.8, snoise(vec2(p.x * 9.0, zw * 9.0)));
        float silt = 0.05 * grain + 0.05 * pebble;
        c = silt * ICE * L * 0.12 + vec3(0.006, 0.012, 0.02) * surf * (0.4 + 0.6 * n.y) * (0.7 + 0.3 * grain);
        tHit = t; hit = true;
      }
    }
    // murky water: absorption toward the camera + light scattered from the packet (and the flash) along the ray
    float tEnd = min(tHit, 40.0);
    float att = exp(-murk * 0.6 * tEnd);
    vec3 sc = vec3(0.0);
    const int N = 20;
    for (int i = 0; i < N; i++) {
      float u = (float(i) + 0.5) / float(N), s = u * u * tEnd, ds = 2.0 * u * tEnd / float(N);
      vec3 p = o + d * s;
      float L = pulseLight(p);
      for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.25, rz); L += flash * 30.0 / (dot(q, q) + 0.4) * exp(-murk * length(q)); }
      sc += L * exp(-murk * 0.6 * s) * ds;
    }
    vec3 water = vec3(0.0004, 0.0008, 0.0018) + vec3(0.01, 0.02, 0.04) * surf * surf * (0.2 + 0.8 * smoothstep(-0.2, 0.6, d.y));
    col += (hit ? c * att : vec3(0.0)) + water * (1.0 - att) + BLUE * sc * 0.006;
    depth += hit ? tHit * dot(d, camFwd) : 1e5;
  }
  if (depthOut > 0.5) { fragColor = vec4(depth * ssWeight(), 0.0, 0.0, 1.0); return; }
  fragColor = vec4(col * ssWeight(), 1.0);
}`;

export interface SeabedState {
  sCam: number;
  /** packet head, local z (negative = ahead of the camera), its length and brightness */
  headZ: number; pLen: number; pK: number;
  /** amplifier housings (two nearest, local z) and the flash of the one just passed */
  repA: number; repB: number; flash: number;
  /** cable peel 0..1, light from above 0..1, floor rising ahead 0..1 */
  peel?: number; surf?: number; rise?: number;
}

class Seabed {
  pass = new FSPass(FRAG, {
    ...camUniforms(), ssTap: SS_TAP,
    sCam: { value: 0 }, headZ: { value: -10 }, pLen: { value: 80 }, pK: { value: 1 }, flash: { value: 0 }, repA: { value: 1e4 }, repB: { value: 1e4 },
    peel: { value: 0 }, surf: { value: 0 }, rise: { value: 0 }, depthOut: { value: 0 }, murk: { value: 0.32 },
  });
  render(ctx: Ctx, cam: Cam, s: SeabedState, out: THREE.WebGLRenderTarget) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.sCam!.value = s.sCam % 5000;
    u.headZ!.value = s.headZ; u.pLen!.value = s.pLen; u.pK!.value = s.pK;
    u.repA!.value = s.repA; u.repB!.value = s.repB; u.flash!.value = s.flash;
    u.peel!.value = s.peel ?? 0; u.surf!.value = s.surf ?? 0; u.rise!.value = s.rise ?? 0;
    const r3 = ctx.r3, ap = cam.ap ?? 0;
    if (ap < 0.3) { u.depthOut!.value = 0; this.pass.render(ctx.renderer, out); return; }
    u.depthOut!.value = 0; this.pass.render(ctx.renderer, r3.color);
    u.depthOut!.value = 1; this.pass.render(ctx.renderer, r3.depth);
    r3.dof(r3.color.texture, r3.depth.texture, out, cam.focus ?? cam.pos.distanceTo(cam.look), ap, 30);
  }
}

export const seabed = new Seabed();
