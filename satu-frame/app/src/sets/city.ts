// Jakarta at night, in metres (S3 rain, S8 dive home, S9 the room). y up. The viewer's phone lies on a desk
// by a window on the second floor of a small building at the origin, top edge toward −z. Out the window:
// frozen rain, a sea of kampung roofs, a few towers, the lattice cell tower ~1.3 km away (placed where the
// radio wavefront, radius c·Δt from the physical clock, is at the moment it is hit), a far carpet of lights.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { CUE } from '../cues';
import { ms } from '../clock';
import { FrozenRain, LightPoints, type Wave } from './sprites';
import { glowSprite } from '../fx';
import { camUniforms, setCamUniforms, RAY_GLSL, type Cam } from '../r3';
import { FSPass } from '../engine/gl';

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
const col = (c: [number, number, number], k = 1) => new THREE.Color().setRGB(c[0] * k, c[1] * k, c[2] * k);

// the room and the phone
export const FLOOR_Y = 7.0, DESK_Y = 7.75;
export const PHONE = { w: 0.0686, h: 0.0079, l: 0.1524, center: V(0, DESK_Y + 0.0040, -0.35) };
/** The antenna gap on the phone's top edge (board x 49.5 mm of 68.6). */
export const ANT = V(-PHONE.w / 2 + 0.0495, DESK_Y + 0.0045, PHONE.center.z - PHONE.l / 2);
export const WIN = { z: -0.95, x0: -0.8, x1: 0.8, y0: 7.95, y1: 9.55 };
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
export const FOG = new THREE.Color().setRGB(0.0055, 0.0065, 0.0095);

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
  private streak!: THREE.Mesh;
  private streakMat!: THREE.MeshBasicMaterial;

  init(ctx: Ctx) {
    const s = this.scene;
    s.fog = new THREE.FogExp2(FOG, 0.0011);
    s.add(new THREE.HemisphereLight(0x1a2030, 0x040404, 0.9));
    const glow = new THREE.DirectionalLight(0x6f7f9f, 0.22); glow.position.set(0.3, 1, -0.4); s.add(glow);
    s.add(this.roomLight, this.towerFlash, this.towerGlow, this.photonHalo, this.photonCore);
    const rnd = mulberry32(21);
    const R = (a: number, b: number) => a + (b - a) * rnd();

    // sky: overcast lit from below by the city
    const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
      fragmentShader: /* glsl */ `varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float y = max(vD.y, 0.0);
          vec3 hor = vec3(0.026, 0.027, 0.034), zen = vec3(0.0035, 0.004, 0.006);
          vec3 c = mix(hor, zen, pow(y, 0.45));
          vec2 p = vD.xz / max(vD.y, 0.05) * 1.3;
          float cl = n(p) * 0.6 + n(p * 2.3) * 0.3 + n(p * 5.1) * 0.1;
          c *= 0.75 + 0.5 * cl;
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    sky.renderOrder = -100;
    s.add(sky);

    // ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40000, 20000).rotateX(-Math.PI / 2).translate(0, 0, SHORE_Z + 10000), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.55 }));
    s.add(ground);
    this.buildShore(ctx);

    // kampung: gable-roofed houses in a jittered grid with streets; lit windows and street lamps as points
    const wallG = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const roofShape = new THREE.Shape([new THREE.Vector2(-0.56, 0), new THREE.Vector2(0.56, 0), new THREE.Vector2(0, 0.42)]);
    const roofG = new THREE.ExtrudeGeometry(roofShape, { depth: 1.08, bevelEnabled: false }).translate(0, 0, -0.54);
    const houses: THREE.Matrix4[] = [], roofs: THREE.Matrix4[] = [];
    const pts: number[] = [], pcol: number[] = [], prad: number[] = [];
    const light = (x: number, y: number, z: number, c: [number, number, number], k: number, r: number) => { pts.push(x, y, z); pcol.push(c[0] * k, c[1] * k, c[2] * k); prad.push(r); };
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p3 = new THREE.Vector3();
    const warm: [number, number, number] = [1.0, 0.93, 0.82];
    for (let gx = -40; gx <= 40; gx++) for (let gz = -175; gz <= 30; gz++) {
      const x0 = gx * 10.5, z0 = gz * 10.5;
      if (gx % 6 === 0 || gz % 7 === 0) {   // streets: lamps every other block
        if (gx % 6 === 0 && gz % 2 === 0 && rnd() < 0.7) light(x0 + 2.5, 6.2, z0, warm, 3.2, 0.12);
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
      const nw = rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0;
      for (let k = 0; k < nw; k++) {
        const side = rnd() < 0.5 ? 1 : -1, along = R(-0.35, 0.35);
        const lx = x + Math.cos(ry) * along * w + Math.sin(ry) * side * (d * 0.5 + 0.3), lz = z - Math.sin(ry) * along * w + Math.cos(ry) * side * (d * 0.5 + 0.3);
        light(lx, R(1.4, h - 0.8), lz, warm, R(0.25, 1.1), 0.35);
      }
    }
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2927, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a312d, roughness: 0.7, metalness: 0.05 });
    const wallI = new THREE.InstancedMesh(wallG, wallMat, houses.length); houses.forEach((m, i) => wallI.setMatrixAt(i, m));
    const roofI = new THREE.InstancedMesh(roofG, roofMat, roofs.length); roofs.forEach((m, i) => roofI.setMatrixAt(i, m));
    s.add(wallI, roofI);

    // a few towers with lit window grids (points), more toward the skyline far down −z
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.6, metalness: 0.2 });
    const towers: THREE.Matrix4[] = [];
    for (let i = 0; i < 70; i++) {
      const far = i > 20;
      const x = R(-1800, 1800), z = far ? R(-2550, -1950) : R(-1700, 200);
      if (Math.abs(x) < 60 && z > -80) continue;
      const w = R(18, 38), d = R(18, 38), h = far ? R(60, 220) : R(24, 70);
      towers.push(m4.clone().compose(p3.set(x, 0, z), q.identity(), sc.set(w, h, d)));
      light(x, h + 1.5, z, [1, 1, 1], 5, 0.4);   // obstruction light
      // window grid on the two faces most visible from the camera path (+z and ±x)
      const floors = Math.floor(h / 3.4), cols = Math.floor(w / 3.2);
      for (let f = 1; f < floors; f++) for (let c2 = 0; c2 < cols; c2++) {
        if (rnd() > (far ? 0.16 : 0.26)) continue;
        const u = (c2 + 0.5) / cols - 0.5, k = R(0.6, 2.4);
        light(x + u * w, f * 3.4, z + d / 2 + 0.3, warm, k, 0.6);
        if (rnd() < 0.5) light(x + (rnd() < 0.5 ? -1 : 1) * (w / 2 + 0.3), f * 3.4, z + u * d, warm, k * 0.8, 0.6);
      }
    }
    const towersI = new THREE.InstancedMesh(wallG, towerMat, towers.length); towers.forEach((m, i) => towersI.setMatrixAt(i, m));
    s.add(towersI);
    // the far carpet of the city (for the dive from above): lamps along a warped street grid out to ~7 km
    for (let i = 0; i < 90000; i++) {
      const a = R(-7000, 7000), b = R(-2640, 7000);
      const ga = Math.round(a / 90) * 90 + Math.sin(b * 0.002) * 60, gb = b;
      const onRoad = rnd() < 0.6;
      const x = onRoad ? ga : a, z = onRoad ? gb : Math.round(b / 110) * 110 + Math.sin(a * 0.003) * 50;
      if (Math.abs(x) < 450 && z > -1850 && z < 330) continue;
      light(x, 5, z, warm, R(0.6, 3.5), 0.4);
    }
    this.lights = new LightPoints(new Float32Array(pts), new Float32Array(pcol), new Float32Array(prad));
    s.add(this.lights.mesh, this.rainNear.mesh, this.rainMid.mesh, this.rainFar.mesh);
    for (const r of [this.rainNear, this.rainMid, this.rainFar]) { (r.u.keepOut!.value as THREE.Vector4).set(-4.3, 4.3, WIN.z - 0.25, 8.3); r.u.keepOutY!.value = 10.9; }

    // the lattice cell tower
    const steel = new THREE.MeshStandardMaterial({ color: 0x33363b, roughness: 0.5, metalness: 0.7 });
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
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.45 });
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
    box(-4.2, 4.2, 10.5, 10.8, Z0 - 0.3, 8.2, roofMat);            // roof slab
    box(-4, 4, FLOOR_Y - 0.2, FLOOR_Y, Z1, 8);                      // floor of the room
    box(-4, 4, 10.3, 10.5, Z1, 8);                                  // ceiling
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x151312, roughness: 0.55 });
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
          vec3 c = vec3(0.05, 0.055, 0.065) * rim + vec3(0.6) * spec * 0.4;
          gl_FragColor = vec4(c, 0.035 + rim * 0.5);
        }`,
    }));
    pane.position.set(0, (WIN.y0 + WIN.y1) / 2, WIN.z - 0.09);
    s.add(pane);
    // the phone: aluminium body, glass top showing the frame being painted
    const body = new THREE.Mesh(new THREE.BoxGeometry(PHONE.w, PHONE.h, PHONE.l), new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.3, metalness: 0.9 }));
    body.position.copy(PHONE.center); s.add(body);
    this.screenMat = new THREE.ShaderMaterial({
      uniforms: { scan: { value: 0 }, k: { value: 1 } }, fog: false,
      vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec2 vU; uniform float scan, k;
        void main(){
          float row = (1.0 - vU.y) * 2400.0;
          float lit = row < scan ? 1.0 : 0.0;
          float line = exp(-abs(row - scan) / 6.0) * 0.8;
          vec3 c = vec3(0.95) * lit * k + vec3(0.37, 0.64, 0.98) * line * 0.5 + vec3(0.003);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(PHONE.w * 0.985, PHONE.l * 0.99).rotateX(-Math.PI / 2), this.screenMat);
    scr.position.set(PHONE.center.x, PHONE.center.y + PHONE.h / 2 + 0.0002, PHONE.center.z);
    s.add(scr);
    // lit windows on our own building (the room's window stays dark but for the phone)
    const own: number[] = [], ownC: number[] = [], ownR: number[] = [];
    for (const [x, y] of [[-2.6, 4.2], [2.4, 4.3], [-2.5, 8.7], [2.7, 1.6], [-1.2, 1.5]] as const) { own.push(x, y, WIN.z - 0.5); ownC.push(1.1, 1.0, 0.88); ownR.push(0.5); }
    const ownL = new LightPoints(new Float32Array(own), new Float32Array(ownC), new Float32Array(ownR)); s.add(ownL.mesh); this.own = ownL;
    this.roomLight.position.set(PHONE.center.x, DESK_Y + 0.25, PHONE.center.z);
    this.towerFlash.position.set(TOWER.x, TOWER_H + 2, TOWER.z + 4);
    this.towerGlow.position.set(TOWER.x, TOWER_H - 1.2, TOWER.z);
    this.captureWaterEnv(ctx);
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
    for (const l of [this.lights, this.yard, this.beacon, this.own]) l.update(c90, 0.0006);
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
    const shed = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.7, metalness: 0.3 });
    const pts: number[] = [], pc: number[] = [], pr: number[] = [];
    for (let i = 0; i < 90; i++) {
      const x = R(-900, 700), z = R(SHORE_Z + 40, -1880);
      if (Math.abs(x + 189) < 40) continue;
      const w = R(20, 60), d = R(30, 90), h = R(7, 14);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shed); m.position.set(x, h / 2, z); s.add(m);
      if (rnd() < 0.6) { pts.push(x + R(-w, w) / 2, h + 4, z + d / 2 + 3); pc.push(3, 2.9, 2.7); pr.push(0.3); }
    }
    for (let z = -1900; z > SHORE_Z; z -= 45) { pts.push(-181, 7, z); pc.push(3.2, 3, 2.8); pr.push(0.2); }   // lamps on the cable street
    for (let x = -900; x < 700; x += 38) { pts.push(x, 6, SHORE_Z + 6); pc.push(2.6, 2.5, 2.3); pr.push(0.2); } // along the seawall
    this.yard = new LightPoints(new Float32Array(pts), new Float32Array(pc), new Float32Array(pr));
    s.add(this.yard.mesh);
    // seawall
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2400, 3.2, 4), new THREE.MeshStandardMaterial({ color: 0x232322, roughness: 0.9 }));
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
      vertexShader: `attribute float along; varying float vA; varying vec2 vC; void main(){ vA = along; vC = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float k, head; uniform vec3 ice; varying float vA; varying vec2 vC;
        void main(){ float x = abs(vC.y - 0.5) * 2.0; float core = exp(-x * x * 60.0) * 3.0 + exp(-x * x * 5.0) * 0.35; float lit = step(vA, head);
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
  }
  private own!: LightPoints;

  render(ctx: Ctx, cam: Cam, st: CityState, out: THREE.WebGLRenderTarget) {
    const fogD = st.fogD ?? 0.0011;
    (this.scene.fog as THREE.FogExp2).density = fogD;
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
    const [dp, dk] = st.down ?? [0, 0];
    this.streak.visible = dk > 0.001;
    this.streak.scale.set(1, Math.max(0.01, dp * (TOWER_H - 1)), 1);
    this.streakMat.color.copy(col(LIN.ice, 4 * dk));
    this.rainNear.update(cam, fogD, st.wave ?? null);
    this.rainMid.update(cam, fogD, st.wave ?? null);
    this.rainFar.update(cam, fogD, st.wave ?? null);

    this.lights.update(cam, fogD * 0.55, st.lightsGain ?? 1);
    this.beacon.update(cam, fogD * 0.5);
    this.own.update(cam, fogD * 0.6);
    this.yard.update(cam, fogD * 0.6);
    const [ch, ck] = st.cable ?? [0, 0];
    this.cableMat.uniforms.head!.value = ch * this.cableLen; this.cableMat.uniforms.k!.value = ck;
    // the scene itself renders sharp; the lights and drops carry their own depth of field
    // from high above, drops this small are invisible (and all of them defocused at once overflow the frame)
    const rainOn = cam.pos.y < 400;
    this.rainNear.mesh.visible = this.rainMid.mesh.visible = this.rainFar.mesh.visible = rainOn;
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
