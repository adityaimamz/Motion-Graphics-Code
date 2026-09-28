// The Earth at night (S6 pull-out, S7 orbit, S8 dive), in kilometres, a fullscreen ray shader. Real data,
// baked once (tools/bake_earth.py): NASA Black Marble 2016 night lights + Natural Earth coastline distance,
// a 500 m core tile around the route and a wide tile to the horizon. A low cloud deck over Jakarta (it is
// raining there, S3), lit from below by the city. A thin deep-blue limb. The cable route as a thread, the
// packet head running along it. Close to the ground the lights break into procedural street lamps.
import * as THREE from 'three';
import { FSPass, SS_TAP, SS_TAP_GLSL } from '../engine/gl';
import { LIN } from '../engine/palette';
import { RAY_GLSL, camUniforms, setCamUniforms, v3, type Cam } from '../r3';
import type { Ctx } from '../world';
import E from '../../public/data/earth.json' with { type: 'json' };

export const R_EARTH = 6371.0;
export const EARTH = E as unknown as { core: number[]; wide: number[]; route: [number, number][]; phone: [number, number]; server: [number, number] };
const D2R = Math.PI / 180;

/** Earth-fixed position (km) of lat/lon at altitude h. y = north pole. */
export function ecef(lat: number, lon: number, h = 0) {
  const r = R_EARTH + h, la = lat * D2R, lo = lon * D2R;
  return v3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}
/** Local east/north/up at lat/lon. */
export function enu(lat: number, lon: number) {
  const la = lat * D2R, lo = lon * D2R;
  const up = v3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
  const east = v3(-Math.sin(lo), 0, -Math.cos(lo));
  const north = up.clone().cross(east).normalize();
  return { up, east, north };
}

// the full thread: server → landing, sea route (Singapore → Jakarta), landing → tower → phone
export const THREAD: [number, number][] = [EARTH.server, ...[...EARTH.route].reverse(), [-6.13, 106.826], EARTH.phone];
const segKm = (a: [number, number], b: [number, number]) => {
  const la = ((a[0] + b[0]) / 2) * D2R;
  return Math.hypot(b[0] - a[0], (b[1] - a[1]) * Math.cos(la)) * 111.195;
};
export const THREAD_CUM = THREAD.reduce<number[]>((acc, p, i) => { acc.push(i ? acc[i - 1]! + segKm(THREAD[i - 1]!, p) : 0); return acc; }, []);
/** km from the server to the start of the sea route (Singapore landing). */
export const SEA_START = THREAD_CUM[1]!;
export const SEA_END = THREAD_CUM[THREAD.length - 3]!;
/** lat/lon at arc length s (km) along the thread. */
export function threadAt(s: number): [number, number] {
  for (let i = 1; i < THREAD.length; i++) if (s <= THREAD_CUM[i]! || i === THREAD.length - 1) {
    const a = THREAD[i - 1]!, b = THREAD[i]!, u = Math.min(1, Math.max(0, (s - THREAD_CUM[i - 1]!) / (THREAD_CUM[i]! - THREAD_CUM[i - 1]!)));
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  }
  return THREAD[THREAD.length - 1]!;
}

const v3c = (c: [number, number, number]) => `vec3(${c.map((x) => x.toFixed(5)).join(',')})`;
const NT = THREAD.length;

const FRAG = /* glsl */ `
${RAY_GLSL}
${SS_TAP_GLSL}
uniform sampler2D coreTex, wideTex;
uniform vec4 coreBox, wideBox;          // lon0, lat0, lon1, lat1
uniform float hCam, headS, threadK, cloudK, lightsK, depthOut, rimK;
uniform vec3 tO, tE, tN;               // tangent frame at the camera's nadir (street-lamp grid)
uniform vec2 thread[${NT}];
uniform float cum[${NT}];
const float R = ${R_EARTH.toFixed(1)};
const vec3 ICE = ${v3c(LIN.ice)}, BLUE = ${v3c(LIN.blue)}, DEEP = ${v3c(LIN.deep)};
const vec3 WARM = vec3(1.0, 0.94, 0.85);
const float D2R = 0.017453292519943295;
const vec2 JKT = vec2(-6.2, 106.82);

vec2 latlon(vec3 n) { return vec2(asin(clamp(n.y, -1.0, 1.0)) / D2R, atan(-n.z, n.x) / D2R); }
vec3 sampleMap(vec2 ll, float lod) {
  vec2 uc = vec2((ll.y - coreBox.x) / (coreBox.z - coreBox.x), (ll.x - coreBox.y) / (coreBox.w - coreBox.y));
  vec2 uw = vec2((ll.y - wideBox.x) / (wideBox.z - wideBox.x), (ll.x - wideBox.y) / (wideBox.w - wideBox.y));
  vec3 w = (uw.x > 0.0 && uw.x < 1.0 && uw.y > 0.0 && uw.y < 1.0) ? textureLod(wideTex, uw, max(lod - 3.3, 0.0)).rgb : vec3(0.0, 0.3, 0.0);
  if (uc.x > 0.01 && uc.x < 0.99 && uc.y > 0.01 && uc.y < 0.99) {
    vec3 c = textureLod(coreTex, uc, lod).rgb;
    float edge = smoothstep(0.01, 0.05, min(min(uc.x, 1.0 - uc.x), min(uc.y, 1.0 - uc.y)));
    return mix(w, c, edge);
  }
  return w;
}
// distance (km) from lat/lon to the thread, and the arc length at the nearest point
vec2 threadDist(vec2 ll) {
  float best = 1e9, s = 0.0, cl = cos(ll.x * D2R);
  for (int i = 1; i < ${NT}; i++) {
    vec2 a = thread[i - 1], b = thread[i];
    vec2 pa = vec2((ll.y - a.y) * cl, ll.x - a.x), ba = vec2((b.y - a.y) * cl, b.x - a.x);
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-12), 0.0, 1.0);
    float d = length(pa - ba * h) * 111.195;
    if (d < best) { best = d; s = mix(cum[i - 1], cum[i], h); }
  }
  return vec2(best, s);
}
// clouds over Jakarta (and a few elsewhere): coverage 0..1 at a point on the deck
float cloudCov(vec3 n) {
  vec2 ll = latlon(n);
  float dj = length((ll - JKT) * vec2(1.0, 1.0)) ;
  float mass = smoothstep(0.9, 0.15, dj + 0.25 * snoise(ll * 3.0));
  float fb = 0.5 + 0.5 * fbm(vec3(n * 900.0), 6) + 0.12 * snoise(n * 9000.0);
  float scat = smoothstep(0.72, 0.9, 0.5 + 0.5 * fbm(vec3(n * 260.0 + 3.0), 4)) * 0.6;
  return clamp(mass * smoothstep(0.15, 0.55, fb) + scat * (1.0 - mass), 0.0, 1.0) * cloudK;
}

void main() {
  vec3 col = vec3(0.0); float depth = 0.0;
  for (int k = ssK0(); k < ssK1(); k++) {
    vec3 o = camPos, d = camRay(gl_FragCoord.xy / PX_SCALE + rgss(k));
    float b = dot(o, d);
    float c = hCam * (2.0 * R + hCam);               // |o|² − R², without cancellation
    float disc = b * b - c;
    vec3 acc = vec3(0.0);
    float dz = 1e7;
    // the limb: closest approach altitude of the ray
    float tca = max(-b, 0.0);
    float hmin = length(o + d * tca) - R;
    if (disc > 0.0 && b < 0.0) {
      float q = -b + sqrt(disc);
      float t = c / q;                                 // stable near root
      vec3 p = o + d * t;
      vec3 n = normalize(p);
      vec2 ll = latlon(n);
      float fp = t * tanHalf * 2.0 / 1920.0;           // km per pixel
      float lod = log2(max(fp / 0.463, 1e-3)) + 0.5;
      vec3 m = sampleMap(ll, max(lod, 0.0));
      float land = smoothstep(0.47, 0.53, m.g);
      float lit = m.r * m.r * 1.6;
      // close to the ground: the glow breaks into lamps (street grid, jittered), density from the map
      float det = smoothstep(0.012, 0.004, fp);
      if (det > 0.0) {
        vec3 rel = p - tO;
        vec2 g = vec2(dot(rel, tE), dot(rel, tN)) / 0.075;
        vec2 gi = floor(g), gf = fract(g) - 0.5;
        vec2 jit = hash22(gi) - 0.5;
        float on = step(hash12(gi + 7.1), clamp(m.r * 1.8, 0.0, 0.95));
        float r = length(gf - jit * 0.6);
        float lamp = on * exp(-r * r / max(0.0025, (fp / 0.075) * (fp / 0.075) * 0.5)) * 2.2;
        lit = mix(lit, lamp * (0.5 + 0.8 * hash12(gi + 3.3)) + lit * 0.02, det);
      }
      vec3 ground = mix(vec3(0.0012, 0.0016, 0.0024), vec3(0.0035, 0.0036, 0.004), land);
      // coastline hairline
      float cd = abs(m.g - 0.5);
      ground += vec3(0.009, 0.011, 0.014) * (1.0 - smoothstep(0.0, 0.006 + fp * 0.004, cd)) * smoothstep(3.0, 0.3, fp);
      vec3 surf = ground + WARM * lit * lightsK;
      // the thread and the packet head
      vec2 td = threadDist(ll);
      float w = max(fp * 1.1, 0.06);
      float line = exp(-td.x * td.x / (w * w));
      float ahead = step(td.y, headS);                  // the part already travelled is brighter
      float headD = abs(td.y - headS);
      float head = exp(-headD / max(fp * 5.0, 1.2)) * exp(-td.x * td.x / (w * w * 9.0));
      float halo = exp(-(headD * headD + td.x * td.x) / pow(max(fp * 14.0, 4.0), 2.0));
      surf += ICE * threadK * (line * (0.35 + 1.2 * ahead * exp(-(headS - td.y) / 220.0)) + head * 14.0 + halo * 0.9) * step(0.001, headS + 0.0);
      // clouds (deck at 2 km): occlude the lights and glow with them from below
      float tcl = -1.0;
      { float rc = R + 2.0, cc = dot(o, o) - rc * rc, dc = b * b - cc; if (dc > 0.0) { float t0 = -b - sqrt(dc); tcl = t0 > 0.0 ? t0 : (-b + sqrt(dc)); } }
      if (cloudK > 0.0 && tcl > 0.0 && tcl < t) {
        vec3 pc = o + d * tcl;
        float cv = cloudCov(normalize(pc));
        vec3 below = sampleMap(latlon(normalize(pc)), 4.0);
        // lit from below by the city: brighter where the deck is thin, the tops catching a little of it
        float thick = 0.5 + 0.5 * fbm(normalize(pc) * 4200.0, 4);
        vec3 cloud = WARM * below.r * below.r * (0.1 + 0.16 * thick) * lightsK + vec3(0.003, 0.0034, 0.0045) * (0.6 + 0.8 * thick);
        surf = mix(surf, cloud, cv * 0.96);
      }
      // haze toward the horizon (thin air seen edge-on)
      float mu = max(dot(-d, n), 0.0);
      surf = mix(surf, DEEP * 0.012, (1.0 - mu) * (1.0 - mu) * 0.55 * rimK);
      acc = surf;
      dz = t * dot(d, camFwd);
    } else {
      // space: the limb glows deep blue just above the horizon
      acc = DEEP * 0.05 * exp(-max(hmin, 0.0) / 14.0) * rimK + BLUE * 0.012 * exp(-max(hmin, 0.0) / 60.0) * rimK + vec3(0.012, 0.013, 0.017) * (1.0 - rimK);
    }
    col += max(acc, vec3(0.0)); depth += dz;
  }
  if (depthOut > 0.5) { fragColor = vec4(depth * ssWeight(), 0.0, 0.0, 1.0); return; }
  fragColor = vec4(col * ssWeight(), 1.0);
}`;

export interface EarthState { headS: number; threadK?: number; cloudK?: number; lightsK?: number }

class Earth {
  pass!: FSPass;
  async init() {
    const load = (f: string) => new Promise<THREE.Texture>((res) => new THREE.TextureLoader().load(f, (t) => {
      t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.flipY = true;
      res(t);
    }));
    const [core, wide] = await Promise.all([load('data/earth_core.png'), load('data/earth_wide.png')]);
    this.pass = new FSPass(FRAG, {
      ...camUniforms(), ssTap: SS_TAP,
      coreTex: { value: core }, wideTex: { value: wide },
      coreBox: { value: new THREE.Vector4(EARTH.core[0], EARTH.core[1], EARTH.core[2], EARTH.core[3]) },
      wideBox: { value: new THREE.Vector4(EARTH.wide[0], EARTH.wide[1], EARTH.wide[2], EARTH.wide[3]) },
      tO: { value: new THREE.Vector3() }, tE: { value: new THREE.Vector3(1, 0, 0) }, tN: { value: new THREE.Vector3(0, 0, 1) },
      hCam: { value: 1000 }, headS: { value: 0 }, threadK: { value: 1 }, cloudK: { value: 1 }, lightsK: { value: 1 }, depthOut: { value: 0 }, rimK: { value: 1 },
      thread: { value: THREAD.map(([la, lo]) => new THREE.Vector2(la, lo)) },
      cum: { value: THREAD_CUM },
    });
  }
  render(ctx: Ctx, cam: Cam, s: EarthState, out: THREE.WebGLRenderTarget) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.hCam!.value = cam.pos.length() - R_EARTH;
    // near the ground the sky is the overcast night, not the limb seen from space
    u.rimK!.value = Math.min(1, Math.max(0, (u.hCam!.value - 12) / 110));
    const nad = cam.pos.clone().normalize();
    const lat = Math.asin(nad.y) / D2R, lon = Math.atan2(-nad.z, nad.x) / D2R;
    const f = enu(lat, lon);
    (u.tO!.value as THREE.Vector3).copy(nad.multiplyScalar(R_EARTH)); (u.tE!.value as THREE.Vector3).copy(f.east); (u.tN!.value as THREE.Vector3).copy(f.north);
    u.headS!.value = s.headS; u.threadK!.value = s.threadK ?? 1; u.cloudK!.value = s.cloudK ?? 1; u.lightsK!.value = s.lightsK ?? 1;
    this.pass.render(ctx.renderer, out);
  }
}

export const earth = new Earth();
