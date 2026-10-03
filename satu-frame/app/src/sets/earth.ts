// The Earth at night (S6 pull-out, S7 orbit, S8 dive), in kilometres, a fullscreen ray shader. Real data,
// baked once (tools/bake_earth.py): NASA Black Marble 2016 night lights + Natural Earth coastline distance,
// a 500 m core tile around the route and a wide tile to the horizon. Seen from low (S6 pull-out, S8 dive)
// the magnified tile is sampled bicubic (no 500 m squares), with a light procedural fabric where the data
// runs out; lower still the glow breaks into single lamps along a street network, fixed to the ground. A
// low cloud deck over Jakarta (it is raining there, S3): dark from above, glowing warm where it is thin,
// lit from below by the city. A thin deep-blue limb. The cable route as a thread, the packet head on it.
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
uniform float hCam, headS, threadK, cloudK, lightsK, depthOut, rimK, expoLow;
#ifdef PULL
uniform float pullK;
#endif
uniform vec3 fO, fE, fN;               // Earth-fixed tangent frame at the core tile's centre (city fabric, lamps)
uniform vec2 coreSize;                 // core tile texels
uniform vec2 thread[${NT}];
uniform float cum[${NT}];
const float R = ${R_EARTH.toFixed(1)};
const vec3 ICE = ${v3c(LIN.ice)}, BLUE = ${v3c(LIN.blue)}, DEEP = ${v3c(LIN.deep)};
const vec3 WARM = vec3(1.0, 0.94, 0.85);
// the city's light after many scatterings in wet cloud: the same warm white, a little deeper
const vec3 CLOUD_WARM = vec3(1.0, 0.8, 0.6);
const float D2R = 0.017453292519943295;
const vec2 JKT = vec2(-6.2, 106.82);

vec2 latlon(vec3 n) { return vec2(asin(clamp(n.y, -1.0, 1.0)) / D2R, atan(-n.z, n.x) / D2R); }
// cubic B-spline from 4 bilinear taps: a magnified 500 m texel becomes a smooth hump, not a square
vec4 bsW(float v) { vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v; vec4 s = n * n * n; float x = s.x, y = s.y - 4.0 * s.x, z = s.z - 4.0 * s.y + 6.0 * s.x; return vec4(x, y, z, 6.0 - x - y - z) / 6.0; }
vec3 bicubic(sampler2D tex, vec2 uv, vec2 size, float lvl) {
  vec2 st = uv * size - 0.5, f = fract(st);
  st -= f;
  vec4 xc = bsW(f.x), yc = bsW(f.y);
  vec4 c = st.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 o = (c + vec4(xc.yw, yc.yw) / s) / size.xxyy;
  vec3 a = textureLod(tex, o.xz, lvl).rgb, b = textureLod(tex, o.yz, lvl).rgb, d = textureLod(tex, o.xw, lvl).rgb, e = textureLod(tex, o.yw, lvl).rgb;
  float sx = s.x / (s.x + s.y), sy = s.z / (s.z + s.w);
  return mix(mix(e, d, sx), mix(b, a, sx), sy);
}
// (one exit: the D3D compiler warns (X4000) about early returns here)
vec3 sampleMap(vec2 ll, float lod) {
  vec2 uc = vec2((ll.y - coreBox.x) / (coreBox.z - coreBox.x), (ll.x - coreBox.y) / (coreBox.w - coreBox.y));
  vec2 uw = vec2((ll.y - wideBox.x) / (wideBox.z - wideBox.x), (ll.x - wideBox.y) / (wideBox.w - wideBox.y));
  vec3 w = (uw.x > 0.0 && uw.x < 1.0 && uw.y > 0.0 && uw.y < 1.0) ? textureLod(wideTex, uw, max(lod - 3.3, 0.0)).rgb : vec3(0.0, 0.3, 0.0);
  vec3 res = w;
  if (uc.x > 0.01 && uc.x < 0.99 && uc.y > 0.01 && uc.y < 0.99) {
    vec3 c = textureLod(coreTex, uc, lod).rgb;
    if (lod < 1.0) {
      // magnified: B-spline, and the single dropped-out texels inside bright cores (a data artefact)
      // filled from the next mip, so the city reads as a smooth glow, not a mosaic with holes
      vec3 b = bicubic(coreTex, uc, coreSize, 0.0);
      float m1 = bicubic(coreTex, uc, coreSize * 0.5, 1.0).r;
      b.r = max(b.r, min(1.0, m1 * 1.2) * smoothstep(0.45, 0.75, m1));
      c = mix(b, c, lod);
    }
    float edge = smoothstep(0.01, 0.05, min(min(uc.x, 1.0 - uc.x), min(uc.y, 1.0 - uc.y)));
    res = mix(w, c, edge);
  }
  return res;
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
// Seen from low, the data runs out of detail (500 m texels, city cores saturated flat). In the saturated
// cores a slow swell of brighter and dimmer quarters (~3 km, mean 1: the total light stays NASA's), only
// once it spans pixels. Lower down the glow breaks into single lamps along a street network (main).
// Coverage of grid lines of half-width hw (cells); 'gaps' = the share of block-long segments missing
// (T-junctions, uneven blocks: a street network, not ruled paper).
float roadCover(vec2 u, float hw, float aa, float gaps) {
  vec2 id = floor(u + 0.5), cell = floor(u);
  vec2 dl = abs(u - id);                                      // distance to the nearest line, per axis
  vec2 keep = step(vec2(gaps), vec2(hash12(vec2(id.x, cell.y) + 0.37), hash12(vec2(cell.x, id.y) + 5.71)));
  vec2 c = (1.0 - smoothstep(hw - aa, hw + aa, dl)) * keep;
  return max(c.x, c.y);
}
vec2 groundKm(vec3 p) { vec3 rel = p - fO; return vec2(dot(rel, fE), dot(rel, fN)); }   // km, fixed to the ground
// the street network: 150 m blocks, turned, bent a little over kilometres
vec2 streetKm(vec2 q) { return rot2(0.35) * q + 0.08 * vec2(snoise(q / 2.5 + 1.3), snoise(q / 2.5 + 8.9)); }
float fabric(vec2 q, float fp, float plateau) {
  float w = smoothstep(3.0, 7.0, 3.0 / fp) * plateau;
  return w > 0.0 ? mix(1.0, 1.0 + 0.1 * snoise(q / 3.0 + 7.7), w) : 1.0;
}
// From 150–500 km a lit city is its streets (what photos from orbit show; 500 m data cannot): districts
// ~4 km across, each with its own street grid (turned its own way, its own block size, brighter or dimmer),
// expressways curving through, a dark park or reservoir here and there. Only where the map is lit, only once
// the streets span a few pixels, and with the mean kept near 1 (the light stays NASA's).
float cityGrain(vec2 gs, float fp, float litMap) {
  // (below ~60 km the glow is the map's again, then single lamps: see main)
#ifdef DIVE
  // (in the dive the streets carry on down to where the single lamps take over: no structureless glow between)
  float w = smoothstep(0.2, 0.6, litMap) * smoothstep(0.5, 0.2, fp) * smoothstep(0.008, 0.016, fp);
#else
  float w = smoothstep(0.2, 0.6, litMap) * smoothstep(0.5, 0.2, fp) * smoothstep(0.03, 0.06, fp);
#endif
  float g = 1.0;
  if (w > 0.0) {
    vec2 q = gs / 4.0, qi = floor(q), id = qi;
    float best = 9.0;
#ifdef PULL
    vec2 id2 = qi; float best2 = 9.0;
#endif
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = qi + vec2(float(i), float(j));
      float dd = length(q - c - hash22(c));
#ifdef PULL
      if (dd < best) { best2 = best; id2 = id; best = dd; id = c; } else if (dd < best2) { best2 = dd; id2 = c; }
#else
      if (dd < best) { best = dd; id = c; }
#endif
    }
    float blk = mix(0.14, 0.38, hash12(id + 4.2)), bri = mix(0.65, 1.3, hash12(id + 9.1));
    vec2 u = rot2(hash12(id + 1.7) * 3.1416) * gs / blk;
    float lane = roadCover(u, 0.1, fp / blk, 0.3);
#ifdef PULL
    // districts do not end on a line: their grids and their brightness run into each other over ~600 m
    {
      float blk2 = mix(0.14, 0.38, hash12(id2 + 4.2)), bri2 = mix(0.65, 1.3, hash12(id2 + 9.1));
      float lane2 = roadCover(rot2(hash12(id2 + 1.7) * 3.1416) * gs / blk2, 0.1, fp / blk2, 0.3);
      float m = 0.5 * (1.0 - smoothstep(0.0, 0.5, best2 - best)) * pullK;
      bri = mix(mix(bri, bri2, m), 1.0, 0.5 * pullK); lane = mix(lane, max(lane, lane2), 2.0 * m);
    }
#endif
    // expressways: the zero lines of a slow field (|n| / |grad n| ~ distance), a few per 10 km
    float hwy = 1.0 - smoothstep(0.02, 0.02 + fp, abs(snoise(gs / 11.0 + 2.1)) * 5.5);
    float park = smoothstep(0.55, 0.75, snoise(gs / 1.3 + 3.3)) * step(bri, 0.95);
    g = (bri * (0.3 + 1.2 * lane) * (1.0 - 0.85 * park) + 1.6 * hwy) / 0.63;
  }
  return mix(1.0, g, w);
}

// clouds over Jakarta (and a few elsewhere): coverage 0..1 at a point on the deck
float cloudCov(vec3 n) {
  vec2 ll = latlon(n);
  float dj = length((ll - JKT) * vec2(1.0, 1.0)) ;
  float mass = smoothstep(0.9, 0.15, dj + 0.25 * snoise(ll * 3.0));
  float fb = 0.5 + 0.5 * fbm(vec3(n * 900.0), 6) + 0.12 * snoise(n * 9000.0);
  float scat = smoothstep(0.72, 0.9, 0.5 + 0.5 * fbm(vec3(n * 260.0 + 3.0), 4)) * 0.6;
  return clamp(mass * smoothstep(0.08, 0.45, fb) + scat * (1.0 - mass), 0.0, 1.0) * cloudK;
}

#ifdef DIVE
// the deck as it looks from above it, low: broken into cells with soft edges (no grain finer than a cloud
// has at this scale: the old one read as cauliflower)
float cloudCovSoft(vec3 n) {
  vec2 ll = latlon(n);
  float dj = length(ll - JKT);
  float mass = smoothstep(0.9, 0.15, dj + 0.25 * snoise(ll * 3.0));
  float fb = 0.5 + 0.5 * fbm(vec3(n * 900.0), 4);
  float scat = smoothstep(0.72, 0.9, 0.5 + 0.5 * fbm(vec3(n * 260.0 + 3.0), 4)) * 0.6;
  return clamp(mass * smoothstep(0.14, 0.5, fb) + scat * (1.0 - mass), 0.0, 1.0) * cloudK;
}
#endif
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
      // low over a city the exposure comes down, so its core keeps its structure instead of going flat white
      vec2 gq = groundKm(p), gs = streetKm(gq);
      float lit = m.r * m.r * 1.6 * expoLow * fabric(gq, fp, smoothstep(0.55, 0.9, m.r)) * cityGrain(gs, fp, m.r);
#ifdef PULL
      // (straight up out of the roof the lens is still set for the aisle: it stops down as the city fills it)
      lit *= 1.0 - 0.4 * pullK;
#endif
      // close to the ground: the glow breaks into lamps ~35 m apart, fixed to the ground, along the streets
      // (a few in the blocks), density from the map
      float det = smoothstep(0.012, 0.004, fp);
      if (det > 0.0) {
        vec2 g = gs / 0.035;
        vec2 gi = floor(g), gf = fract(g) - 0.5;
        vec2 jit = hash22(gi) - 0.5;
        float street = roadCover(gs / 0.15, 0.12, fp / 0.15, 0.3);
        float on = step(hash12(gi + 7.1), clamp(m.r * 1.8, 0.0, 0.95) * mix(0.15, 1.0, street));
        float r = length(gf - jit * 0.5);
        float lamp = on * exp(-r * r / max(0.0025, (fp / 0.035) * (fp / 0.035) * 0.5)) * 2.2;
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
        vec3 below = sampleMap(latlon(normalize(pc)), 3.0);
        // seen from above at night the deck has no light of its own: only what the city under it pushes
        // through. Thin cloud glows warm, thick cloud stays dark (optical depth grows with thickness).
        float thick = 0.5 + 0.5 * fbm(normalize(pc) * 4200.0, 4);
        float trans = exp(-(1.2 + 3.6 * thick * cv));
        vec3 cloud = CLOUD_WARM * below.r * below.r * (0.16 * trans + 0.012) * lightsK + vec3(0.0011, 0.0011, 0.0013) * (0.5 + thick);
        // from orbit the rain deck over Jakarta is several km thick: light does not get through it in straight
        // lines but diffuses (diffuse transmission of a thick cloud ≈ 1 / (1 + 0.75 τ (1 − g)), 15–40 %, not
        // e^−τ), spread sideways by about the deck's thickness. The city under it becomes one soft warm glow,
        // mottled by the cloud's thickness, with sharp lights only in the gaps: it reads as cloud, not as a
        // dimmer city. (Low down, in the dive, the deck above keeps its close-up look.)
        float wo = smoothstep(0.08, 0.3, fp);
        if (wo > 0.0) {
          vec3 wide = sampleMap(latlon(normalize(pc)), 4.6);
          // its convective cells (~15–20 km) vary the optical depth: thin between them, thick in their cores
          float cell = 0.5 + 0.5 * fbm(normalize(pc) * 350.0, 3);
          float tau = 6.0 + 70.0 * cell * cell * cv;
          float Td = 1.0 / (1.0 + 0.75 * tau * 0.15);
          vec3 glow = CLOUD_WARM * wide.r * wide.r * 1.6 * expoLow * Td * lightsK;
          cloud = mix(cloud, glow + vec3(0.0011, 0.0011, 0.0013) * (0.5 + thick), wo);
        }
#ifdef DIVE
        // low over the deck (the dive): the same physics as from orbit. Under thin or thick cloud the city is
        // a diffuse glow (spread ~3 km sideways, dimmed by the cloud's optical depth), sharp only in the
        // gaps, whose edges are soft. (0 at S7's scale, where it is as there.)
        float lowK = 1.0 - smoothstep(0.06, 0.1, fp);
        if (lowK > 0.0) {
          cv = mix(cv, cloudCovSoft(normalize(pc)), lowK);
          vec3 spread = sampleMap(latlon(normalize(pc)), 2.7);
          float cellS = 0.5 + 0.5 * fbm(normalize(pc) * 350.0, 3);
          // (a raining deck several km thick: optical depth ~20 at its thin edges, a few hundred in the cores)
          float tauS = 20.0 + 400.0 * cellS * thick * cv;
          vec3 glowS = CLOUD_WARM * spread.r * spread.r * 1.6 * expoLow * lightsK / (1.0 + 0.1125 * tauS) + vec3(0.0011, 0.0011, 0.0013) * (0.5 + thick);
          cloud = mix(cloud, glowS, lowK);
        }
#endif
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

export interface EarthState { headS: number; threadK?: number; cloudK?: number; lightsK?: number; pullK?: number }

class Earth {
  pass!: FSPass;
  /** the same shader for the S8 dive (DIVE) and the S6 pull-out (PULL): own programs, so S7 stays as it was */
  private dive!: FSPass;
  private pull!: FSPass;
  async init() {
    const load = (f: string) => new Promise<THREE.Texture>((res) => new THREE.TextureLoader().load(f, (t) => {
      t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.flipY = true;
      res(t);
    }));
    const [core, wide] = await Promise.all([load('data/earth_core.png'), load('data/earth_wide.png')]);
    const cImg = core.image as { width: number; height: number };
    const cLat = (EARTH.core[1]! + EARTH.core[3]!) / 2, cLon = (EARTH.core[0]! + EARTH.core[2]!) / 2, cf = enu(cLat, cLon);
    this.pass = new FSPass(FRAG, {
      ...camUniforms(), ssTap: SS_TAP,
      coreTex: { value: core }, wideTex: { value: wide }, coreSize: { value: new THREE.Vector2(cImg.width, cImg.height) },
      fO: { value: ecef(cLat, cLon) }, fE: { value: cf.east }, fN: { value: cf.north }, expoLow: { value: 1 },
      coreBox: { value: new THREE.Vector4(EARTH.core[0], EARTH.core[1], EARTH.core[2], EARTH.core[3]) },
      wideBox: { value: new THREE.Vector4(EARTH.wide[0], EARTH.wide[1], EARTH.wide[2], EARTH.wide[3]) },
      hCam: { value: 1000 }, headS: { value: 0 }, threadK: { value: 1 }, cloudK: { value: 1 }, lightsK: { value: 1 }, depthOut: { value: 0 }, rimK: { value: 1 },
      thread: { value: THREAD.map(([la, lo]) => new THREE.Vector2(la, lo)) },
      cum: { value: THREAD_CUM },
      pullK: { value: 0 },
    });
    this.dive = new FSPass(`#define DIVE
${FRAG}`, this.pass.u);
    this.pull = new FSPass(`#define PULL
${FRAG}`, this.pass.u);
  }
  render(ctx: Ctx, cam: Cam, s: EarthState, out: THREE.WebGLRenderTarget, variant: 'dive' | 'pull' | null = null) {
    const u = this.pass.u;
    setCamUniforms(u, cam);
    u.hCam!.value = cam.pos.length() - R_EARTH;
    // near the ground the sky is the overcast night, not the limb seen from space
    u.rimK!.value = Math.min(1, Math.max(0, (u.hCam!.value - 12) / 110));
    // city cores go flat white when seen from low: bring the lights down under ~500 km (0.35 at 150 km and below)
    const lo = Math.min(1, Math.max(0, (u.hCam!.value - 150) / 350));
    u.expoLow!.value = 0.35 + 0.65 * lo * lo * (3 - 2 * lo);
    u.headS!.value = s.headS; u.threadK!.value = s.threadK ?? 1; u.cloudK!.value = s.cloudK ?? 1; u.lightsK!.value = s.lightsK ?? 1;
    u.pullK!.value = s.pullK ?? 0;
    (variant === 'dive' ? this.dive : variant === 'pull' ? this.pull : this.pass).render(ctx.renderer, out);
  }
}

export const earth = new Earth();
