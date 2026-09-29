// The floor of the Java Sea at night (S5), in metres, a fullscreen ray shader. Local frame: the cable runs
// along −z (toward Singapore) at x = 0; z = 0 is where the camera is along the route (the world slides by:
// sCam = the camera's distance from Jakarta, mod 5 km for the noise). The only light is the request itself:
// an ~80 m packet of light in one fibre (500 B at 10 Gb/s = 400 ns of light), shown in false colour, glowing
// through the cable and scattering in murky water. Amplifier housings sit on the cable; each flashes as the
// packet passes. The cable can be peeled layer by layer (sheath, steel armour, copper, the steel tube with
// its fibres) for the push into the one lit fibre; the cut edges catch the light escaping from inside.
// Toward Singapore the floor rises into the city's light from above: the water shallows, the night sky's
// glow gets down to the floor (fading with depth, filtered by the strait's turbid water), the floor turns to
// pale sand ribbons on shell gravel, and overhead the surface shows Snell's window.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, type Cam } from '../r3';
import type { Ctx } from '../world';

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;

/** The shader; `up` = the approach to Singapore (the light from above). The plain variant is exactly the
 *  shader as it was, so the rest of the chapter renders bit-identically. */
const frag = (up: boolean) => /* glsl */ `
#define UP ${up ? 1 : 0}
${RAY_GLSL}
${SS_TAP_GLSL}
uniform float sCam, headZ, pLen, pK, flash, repA, repB, peel, surf, rise, depthOut, murk;
#if UP
uniform float surfD, sKm;
#endif
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
// light falling on a surface at p: the packet is a line of light 80 m long (its first ~9 m brighter), so
// what reaches p goes as the angle the line subtends over the distance to it (1/r, not 1/r²), dimmed by
// the murk over that distance
float lineA(float r, float z1, float z2) { return atan(z2 / r) - atan(z1 / r); }
float pulseOn(vec3 p) {
  vec3 q = p - vec3(fibreOff.x, R_SHEATH + fibreOff.y, 0.0);
  float r = length(q.xy) + 0.004;
  float body = lineA(r, headZ - q.z, headZ + pLen - q.z), head = lineA(r, headZ - q.z, headZ + 9.0 - q.z);
  return pK * (0.25 * body + 2.2 * head) / r * exp(-murk * r);
}
#if UP
// ---- toward Singapore (surf > 0): the light from above. The night sky over the strait glows with the city
// (the same warm-neutral glow as over Jakarta, S3), nearly black overhead. Water: turbid coastal, red
// absorbed first. Beam attenuation per metre (what dims a line of sight) and diffuse attenuation (what dims
// the light getting down), per channel.
const vec3 SKYH = vec3(0.074, 0.066, 0.060), SKYZ = vec3(0.005, 0.005, 0.006);
const vec3 KC = vec3(0.17, 0.12, 0.10), KD = vec3(0.14, 0.10, 0.085);
const float NW = 1.333;
// the lens's exposure opens up as the light from above arrives (the packet stays the brightest thing)
float upK() { return (1.0 + 27.0 * surf) * smoothstep(0.0, 0.15, surf); }
// light from above reaching height y (the surface is at surfD)
vec3 downLight(float y) { return SKYH * exp(-KD * max(surfD - y, 0.0)) * upK(); }
// sand ribbons of the Singapore Strait: strips of pale sand lying along the tidal current (the cable is laid
// along the strait too), kilometres long, on darker shell gravel. Their pattern changes over kilometres
// (sKm, not wrapped), so at 1.27 km a frame it drifts from frame to frame instead of flickering.
float ribbon(float x) {
  float n = snoise(vec2(x * 0.3, sKm * 0.12)) + 0.45 * snoise(vec2(x * 0.9, sKm * 0.3 + 5.0));
  return smoothstep(0.05, 0.3, n);
}
#endif
// ---- seabed height (world z = local z + sCam): long grooves along the route, soft ripples, a trench near the cable
float bed(vec2 xz) {
  float zw = xz.y + sCam;
  float h = 0.22 * snoise(vec2(xz.x * 0.07, zw * 0.0017)) + 0.05 * snoise(vec2(xz.x * 0.55, zw * 0.013))
          + 0.012 * sin(xz.x * 7.0 + snoise(vec2(xz.x * 0.3, zw * 0.05)) * 3.0);
  h -= 0.06 * exp(-xz.x * xz.x / 0.05);
  h += 0.006 * snoise(vec2(xz.x * 11.0, zw * 1.3)) + 0.004 * sin(zw * 0.9 + xz.x * 2.0);
  // the approach to Singapore: the floor rises ahead
  h += rise * max(0.0, -xz.y) * 0.08;
#if UP
  if (rise > 0.0) h += rise * 0.06 * ribbon(xz.x);    // the ribbons stand a little proud of the gravel
#endif
  // the cable always lies on the floor, never under it: within a metre of it the floor is scoured down
  h = min(h, mix(-0.004, h + 0.3, smoothstep(0.06, 1.0, abs(xz.x))));
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
// peel: each layer dissolves with its own noise threshold. Returns how far p is inside what is left of the
// layer (< 0: peeled away here); 'peeling' = this layer is being cut away right now
float peelMargin(vec3 p, float order, out float peeling) {
  float n = 0.5 + 0.5 * snoise(vec3(atan(p.y - R_SHEATH, p.x) * 3.0, (p.z + sCam) * 9.0, order * 7.0));
  float th = clamp(peel * 4.0 - order, 0.0, 1.0);
  peeling = step(0.001, th);
  return n - th * 1.08;
}

vec3 shadeCable(vec3 p, vec3 n, float layer, vec3 rd, float edge) {
  float L = pulseLight(p);
  vec3 lp = vec3(fibreOff.x, R_SHEATH + fibreOff.y, clamp(p.z, headZ, headZ + pLen));
  vec3 toL = normalize(lp - p);
  float dif = 0.3 + 0.7 * max(0.0, dot(n, toL));
  float spec = pow(max(0.0, dot(reflect(rd, n), toL)), 28.0);
  float ang = atan(p.y - R_SHEATH, p.x), zw = p.z + sCam;
  vec3 c, glow = vec3(0.0); float gloss;
  if (layer < 0.5) {                 // polyethylene sheath, with the armour's twist pressed through
    float ridge = 0.5 + 0.5 * sin(ang * 22.0 + zw * 90.0);
    c = vec3(0.012) * (0.8 + 0.4 * ridge);
    gloss = 0.12 * (0.6 + 0.4 * ridge);
    // the light inside shows through the sheath around the packet (false colour, like the packet itself)
    float a; float d = segDist(p, a);
    glow = BLUE * pK * 0.05 * exp(-a * 3.0) * exp(-abs(p.z - clamp(p.z, headZ, headZ + pLen)) * 1.5) / (d * 40.0 + 0.2);
  } else if (layer < 1.5) {          // galvanised steel armour wires (helix): each wire's crown catches light
    float w = fract(ang * 18.0 / 6.2832 + zw * 14.0), crown = smoothstep(0.0, 0.2, w) * smoothstep(1.0, 0.8, w);
    c = vec3(0.08, 0.085, 0.09) * (0.35 + 0.65 * crown);
    gloss = 0.9 * crown;
  } else if (layer < 2.5) {          // copper power conductor
    c = COPPER * 0.12;
    gloss = 0.6;
  } else {                           // stainless tube
    c = vec3(0.1, 0.105, 0.11);
    gloss = 1.0;
  }
  // where a layer is being cut away, its fresh edge catches the light escaping from inside
  return c * ICE * L * dif * 0.06 + ICE * L * spec * gloss * 0.01 + c * surf * 0.05 + glow + ICE * pK * 0.6 * edge;
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
        float peeling, m = peelMargin(p, float(l), peeling);
        if (m > 0.0) {
          vec3 n = normalize(vec3(p.x, p.y - R_SHEATH, 0.0));
          tHit = t; c = shadeCable(p, n, float(l), d, peeling * exp(-m / 0.03)); hit = true;
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
        // the dark fibres are still glass: the packet's light, scattered in the gel, glints in them and runs
        // along their edges (Fresnel), so they read as clear strands, not black bars
        float fres = pow(1.0 - abs(dot(d, n)), 3.0);
        float Lp = pulseLight(p);
        c = vec3(0.02, 0.022, 0.025) * spec * Lp + ICE * Lp * (0.0025 + 0.012 * fres) + ICE * lit * 1.4 * (0.4 + 0.6 * abs(n.x));
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
        vec3 lq = vec3(0.0, R_SHEATH, p.z) - p;
        float L = pulseOn(p) * (0.25 + 0.75 * max(0.0, dot(n, normalize(lq))));
        // amplifier flash lights the floor around it
        for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.3, rz); L += flash * 60.0 * max(0.0, dot(n, normalize(-q))) / (dot(q, q) + 0.5) * exp(-murk * length(q)); }
        float zw = p.z + sCam;
        float grain = 0.55 + 0.25 * snoise(vec2(p.x * 3.0, zw * 0.3)) + 0.2 * snoise(vec2(p.x * 17.0, zw * 2.1));
        float pebble = smoothstep(0.62, 0.8, snoise(vec2(p.x * 9.0, zw * 9.0)));
        // Java Sea mud: dark olive-grey silt, shell grit here and there
        float silt = 0.13 * grain + 0.08 * pebble;
#if UP
        if (rise > 0.0) {
          // toward Singapore: pale sand ribbons (a fine lineation along the flow) on dark shell gravel, lit by
          // what gets down from above. Everything runs along the route: at this speed only that stays readable.
          float rb = ribbon(p.x) * clamp(rise / 0.8, 0.0, 1.0);
          float lin = 0.8 + 0.2 * sin(p.x * 23.0 + 3.0 * snoise(vec2(p.x * 1.7, sKm * 0.5)));
          float alb = mix(0.03 + 0.05 * pebble + 0.02 * grain, 0.42 * lin * (0.85 + 0.15 * grain), rb);
          c = silt * ICE * L * 0.14 + alb * downLight(p.y) * 1.6 * (0.3 + 0.7 * max(n.y, 0.0));
        } else {
          c = silt * ICE * L * 0.14;
        }
#else
        // near Singapore the floor rises into the city's light from above: the sand ripples read, lit from above
        float ripple = 0.75 + 0.25 * sin(zw * 2.2 + p.x * 0.8 + 2.0 * snoise(vec2(p.x * 0.4, zw * 0.15)));
        c = silt * ICE * L * 0.14 + vec3(0.03, 0.05, 0.075) * surf * (0.2 + 0.8 * max(n.y, 0.0)) * (0.6 + 0.4 * grain) * ripple;
#endif
        tHit = t; hit = true;
      }
    }
#if UP
    if (surf > 0.0) {
      // the surface overhead, frozen (a low swell, its crests along the strait). Inside Snell's window (48.6°
      // from straight up) the whole night sky is squeezed into a 97° cone, brightest toward its rim where the
      // horizon lands (and ahead, over Singapore); past the critical angle the underside is a mirror of the
      // dim water below (total internal reflection)
      if (d.y > 0.0) {
        float tS = (surfD - o.y) / d.y;
        if (tS < tHit) {
          vec3 pS = o + d * tS;
          vec3 nS = normalize(vec3(0.008 * sin(pS.x * 0.55 + 1.3) + 0.004 * sin(pS.x * 1.7 + 0.4) + 0.002 * sin(pS.x * 4.3 + 2.0), 1.0, 0.0));
          vec3 dt = refract(d, -nS, NW);
          if (dot(dt, dt) > 0.0) {
            float ci = dot(d, nS), co = dot(dt, nS);
            float rs = (NW * ci - co) / (NW * ci + co), rp = (ci - NW * co) / (ci + NW * co);
            float T = 1.0 - 0.5 * (rs * rs + rp * rp);
            float el = clamp(dt.y, 0.0, 1.0);
            vec3 sky = (SKYZ + (SKYH - SKYZ) * exp(-el / 0.25)) * (1.0 + 1.2 * max(0.0, -dt.z) * pow(1.0 - el, 3.0));
            c = sky * T * NW * NW * upK();   // radiance gains n² going into the water
          } else {
            c = downLight(surfD) * 0.05;
          }
          tHit = tS; hit = true;
        }
      }
      // the water: the packet's light and the light from above, scattered toward the lens along the ray
      float sk = smoothstep(0.0, 1.0, surf);
      float tEnd = min(tHit, 40.0);
      vec3 K = mix(vec3(murk * 0.6), KC, sk);
      vec3 attC = exp(-K * tEnd);
      float att = exp(-murk * 0.6 * tEnd);
      vec3 sd = vec3(0.0); float sc = 0.0;
      const int N = 20;
      for (int i = 0; i < N; i++) {
        float u = (float(i) + 0.5) / float(N), s = u * u * tEnd, ds = 2.0 * u * tEnd / float(N);
        vec3 p = o + d * s;
        float L = pulseLight(p);
        for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.25, rz); L += flash * 30.0 / (dot(q, q) + 0.4) * exp(-murk * length(q)); }
        sc += L * exp(-murk * 0.6 * s) * ds;
        sd += downLight(p.y) * exp(-K * s) * ds;
      }
      vec3 water = vec3(0.0004, 0.0008, 0.0018);
      col += (hit ? c * attC : vec3(0.0)) + water * (1.0 - att) + BLUE * sc * 0.006 + sd * 0.007;
    } else {
      // murky water: absorption toward the camera + light scattered from the packet (and the flash) along the ray
      float tEnd = min(tHit, 40.0);
      float att = exp(-murk * 0.6 * tEnd);
      vec3 sc = vec3(0.0); float sh = 0.0;
      const int N = 20;
      for (int i = 0; i < N; i++) {
        float u = (float(i) + 0.5) / float(N), s = u * u * tEnd, ds = 2.0 * u * tEnd / float(N);
        vec3 p = o + d * s;
        float L = pulseLight(p);
        for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.25, rz); L += flash * 30.0 / (dot(q, q) + 0.4) * exp(-murk * length(q)); }
        sc += L * exp(-murk * 0.6 * s) * ds;
        // the light from above comes down in faint slanted shafts (frozen, like everything but the signal)
        float shaft = pow(0.5 + 0.5 * snoise(vec2(p.x * 0.3 - p.y * 0.12, (p.z + sCam) * 0.06 + p.y * 0.05)), 5.0);
        sh += shaft * smoothstep(-1.0, 6.0, p.y) * exp(-murk * 0.6 * s) * ds;
      }
      vec3 water = vec3(0.0004, 0.0008, 0.0018) + vec3(0.025, 0.045, 0.08) * surf * surf * (0.3 + 0.7 * smoothstep(-0.3, 0.5, d.y));
      col += (hit ? c * att : vec3(0.0)) + water * (1.0 - att) + BLUE * sc * 0.006 + vec3(0.02, 0.032, 0.05) * surf * sh * 0.14;
    }
#else
    // murky water: absorption toward the camera + light scattered from the packet (and the flash) along the ray
    float tEnd = min(tHit, 40.0);
    float att = exp(-murk * 0.6 * tEnd);
    vec3 sc = vec3(0.0); float sh = 0.0;
    const int N = 20;
    for (int i = 0; i < N; i++) {
      float u = (float(i) + 0.5) / float(N), s = u * u * tEnd, ds = 2.0 * u * tEnd / float(N);
      vec3 p = o + d * s;
      float L = pulseLight(p);
      for (int r = 0; r < 2; r++) { float rz = r == 0 ? repA : repB; vec3 q = p - vec3(0, 0.25, rz); L += flash * 30.0 / (dot(q, q) + 0.4) * exp(-murk * length(q)); }
      sc += L * exp(-murk * 0.6 * s) * ds;
      // the light from above comes down in faint slanted shafts (frozen, like everything but the signal)
      float shaft = pow(0.5 + 0.5 * snoise(vec2(p.x * 0.3 - p.y * 0.12, (p.z + sCam) * 0.06 + p.y * 0.05)), 5.0);
      sh += shaft * smoothstep(-1.0, 6.0, p.y) * exp(-murk * 0.6 * s) * ds;
    }
    vec3 water = vec3(0.0004, 0.0008, 0.0018) + vec3(0.025, 0.045, 0.08) * surf * surf * (0.3 + 0.7 * smoothstep(-0.3, 0.5, d.y));
    col += (hit ? c * att : vec3(0.0)) + water * (1.0 - att) + BLUE * sc * 0.006 + vec3(0.02, 0.032, 0.05) * surf * sh * 0.14;
#endif
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
  /** depth of the surface above the floor at the camera (m), with surf */
  surfD?: number;
}

class Seabed {
  // one set of uniforms, two programs: the approach to Singapore, and the plain one
  private uni = {
    ...camUniforms(), ssTap: SS_TAP,
    sCam: { value: 0 }, headZ: { value: -10 }, pLen: { value: 80 }, pK: { value: 1 }, flash: { value: 0 }, repA: { value: 1e4 }, repB: { value: 1e4 },
    peel: { value: 0 }, surf: { value: 0 }, rise: { value: 0 }, depthOut: { value: 0 }, murk: { value: 0.32 }, surfD: { value: 40 }, sKm: { value: 0 },
  };
  private plain = new FSPass(frag(false), this.uni);
  private up = new FSPass(frag(true), this.uni);
  render(ctx: Ctx, cam: Cam, s: SeabedState, out: THREE.WebGLRenderTarget) {
    const pass = (s.rise ?? 0) > 0 || (s.surf ?? 0) > 0 ? this.up : this.plain;
    const u = pass.u;
    setCamUniforms(u, cam);
    u.sCam!.value = s.sCam % 5000;
    u.headZ!.value = s.headZ; u.pLen!.value = s.pLen; u.pK!.value = s.pK;
    u.repA!.value = s.repA; u.repB!.value = s.repB; u.flash!.value = s.flash;
    u.peel!.value = s.peel ?? 0; u.surf!.value = s.surf ?? 0; u.rise!.value = s.rise ?? 0;
    u.surfD!.value = s.surfD ?? 40; u.sKm!.value = s.sCam / 1000;
    const r3 = ctx.r3, ap = cam.ap ?? 0;
    if (ap < 0.3) { u.depthOut!.value = 0; pass.render(ctx.renderer, out); return; }
    u.depthOut!.value = 0; pass.render(ctx.renderer, r3.color);
    u.depthOut!.value = 1; pass.render(ctx.renderer, r3.depth);
    r3.dof(r3.color.texture, r3.depth.texture, out, cam.focus ?? cam.pos.distanceTo(cam.look), ap, 30);
  }
}

export const seabed = new Seabed();
