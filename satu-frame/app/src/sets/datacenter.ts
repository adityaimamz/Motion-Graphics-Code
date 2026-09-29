// A Singapore data centre's cold aisle (S6), in metres: two rows of racks facing each other along −z,
// perforated floor tiles, a cable tray overhead carrying the fibre into one rack, cold white strip lights.
// Rack fronts are drawn once into a canvas (42U of server faces, grilles, status LEDs: white, one blue).
// Light, all from things in the room: the two strip luminaires shine down (area lights: no hot spots on the
// ceiling above them); the raised floor is dark high-pressure laminate, a little glossy, so it mirrors the
// strips and the LEDs down the aisle (a cube map of the aisle itself, captured once: nothing in it moves);
// at the far end the containment's glass doors, the next aisle's LEDs faint behind them. The fibre ends in
// a blue LC connector (blue = single-mode, UPC polish) at the server's port, its link LED lit by our packet.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { LightPoints } from './sprites';
import type { Cam } from '../r3';
import type { Ctx } from '../world';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const RACK = { w: 0.6, h: 2.0, d: 1.1, n: 16, aisle: 1.2 };
/** The rack and server the request goes into (right row, index 9, the unit at 1.21 m). */
export const TARGET = V(RACK.aisle, 1.21, -(9 + 0.5) * RACK.w);
export const TRAY_Y = 2.55;

function rackFaces() {
  const W = 256, H = 1024, U = H / 42;
  const a = document.createElement('canvas'); a.width = W; a.height = H;
  const e = document.createElement('canvas'); e.width = W; e.height = H;
  const c = a.getContext('2d')!, x = e.getContext('2d')!;
  c.fillStyle = '#0b0c0e'; c.fillRect(0, 0, W, H);
  x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  const rnd = mulberry32(5);
  let u = 0;
  while (u < 42) {
    const size = rnd() < 0.6 ? 1 : rnd() < 0.7 ? 2 : 4;
    if (u + size > 42) break;
    const y0 = H - (u + size) * U, h = size * U;
    if (rnd() < 0.08) { u += size; continue; }            // blanking panel gap
    c.fillStyle = rnd() < 0.5 ? '#16181b' : '#1c1e22'; c.fillRect(6, y0 + 1, W - 12, h - 2);
    // grille
    c.fillStyle = '#0a0b0c';
    for (let gx = 40; gx < W - 50; gx += 5) for (let gy = y0 + 4; gy < y0 + h - 4; gy += 5) c.fillRect(gx, gy, 3, 3);
    // drive bays on bigger units
    if (size >= 2) { c.fillStyle = '#23262a'; for (let i = 0; i < 6; i++) c.fillRect(44 + i * 26, y0 + 6, 22, h * 0.45); }
    // status LEDs (emissive map): white, rarely one blue
    const leds = 1 + Math.floor(rnd() * 3);
    for (let i = 0; i < leds; i++) {
      x.fillStyle = rnd() < 0.12 ? '#3b82f6' : rnd() < 0.5 ? '#f5f5f5' : '#8a8a8a';
      x.fillRect(W - 34 + i * 7, y0 + h / 2 - 1.5, 3, 3);
    }
    u += size;
  }
  const map = new THREE.CanvasTexture(a); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const em = new THREE.CanvasTexture(e); em.colorSpace = THREE.SRGBColorSpace;
  return { map, em };
}

class Datacenter {
  scene = new THREE.Scene();
  private fibreMat!: THREE.MeshBasicMaterial;
  private leds!: LightPoints;
  private linkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false });

  init(ctx: Ctx) {
    const s = this.scene;
    const pm = new THREE.PMREMGenerator(ctx.renderer);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.25;
    s.fog = new THREE.FogExp2(0x020304, 0.03);
    s.add(new THREE.HemisphereLight(0xcfd8ff, 0x0a0a0a, 0.35));
    const { map, em } = rackFaces();
    const front = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 2.2, roughness: 0.5, metalness: 0.4 });
    const side = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.45, metalness: 0.6 });
    const g = new THREE.BoxGeometry(RACK.d, RACK.h, RACK.w - 0.01);
    for (const sideSign of [-1, 1]) for (let i = 0; i < RACK.n; i++) {
      // box faces order: +x, -x, +y, -y, +z, -z; the face toward the aisle gets the rack front
      const mats = [side, side, side, side, side, side];
      mats[sideSign > 0 ? 1 : 0] = front;
      const m = new THREE.Mesh(g, mats);
      m.position.set(sideSign * (RACK.aisle + RACK.d / 2), RACK.h / 2, -(i + 0.5) * RACK.w);
      s.add(m);
    }
    // floor tiles (perforated), ceiling, strip lights
    const tc = document.createElement('canvas'); tc.width = tc.height = 256;
    const t2 = tc.getContext('2d')!;
    // (perforated tiles in front of the racks, where the cold air comes up; solid ones down the middle)
    t2.fillStyle = '#26292d'; t2.fillRect(0, 0, 256, 256);
    t2.fillStyle = '#0c0d0f'; for (let i = 8; i < 256; i += 12) for (let j = 8; j < 256; j += 12) { t2.beginPath(); t2.arc(i, j, 3.2, 0, Math.PI * 2); t2.fill(); }
    t2.strokeStyle = '#0f1012'; t2.lineWidth = 4; t2.strokeRect(0, 0, 256, 256);
    const tile = new THREE.CanvasTexture(tc); tile.colorSpace = THREE.SRGBColorSpace; tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(12, 40); tile.anisotropy = 8;
    const sc = document.createElement('canvas'); sc.width = sc.height = 64;
    const s2 = sc.getContext('2d')!;
    s2.fillStyle = '#2e3136'; s2.fillRect(0, 0, 64, 64); s2.strokeStyle = '#111214'; s2.lineWidth = 2; s2.strokeRect(0, 0, 64, 64);
    const solid = new THREE.CanvasTexture(sc); solid.colorSpace = THREE.SRGBColorSpace; solid.wrapS = solid.wrapT = THREE.RepeatWrapping; solid.repeat.set(2, 40); solid.anisotropy = 8;
    const floorMat = new THREE.MeshStandardMaterial({ map: tile, roughness: 0.28, metalness: 0.0 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 24).rotateX(-Math.PI / 2), floorMat);
    floor.position.set(0, 0, -8); s.add(floor);
    const midMat = new THREE.MeshStandardMaterial({ map: solid, roughness: 0.2, metalness: 0.0 });
    const mid = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 24).rotateX(-Math.PI / 2), midMat);
    mid.position.set(0, 0.001, -8); s.add(mid);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(8, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.9 }));
    ceil.position.set(0, 3.1, -8); s.add(ceil);
    const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(2.2, 2.3, 2.5) });
    RectAreaLightUniformsLib.init();
    for (const x of [-0.55, 0.55]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 11), strip); l.position.set(x, 3.06, -5.2); s.add(l);
      // the luminaire itself, facing down
      const a = new THREE.RectAreaLight(0xe8eeff, 26, 0.08, 11);
      a.position.set(x, 3.045, -5.2); a.up.set(0, 0, 1); a.lookAt(x, 0, -5.2); s.add(a);
    }
    // the far end: the containment's sliding glass doors in an aluminium frame; the next aisle's LEDs behind
    const alu = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.35, metalness: 1.0 });
    const zEnd = -RACK.n * RACK.w;
    for (const [w, h, x, y] of [[0.05, 2.0, -RACK.aisle + 0.025, 1.0], [0.05, 2.0, RACK.aisle - 0.025, 1.0], [0.04, 2.0, 0, 1.0], [2 * RACK.aisle, 0.06, 0, 2.0]] as const) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), alu); m.position.set(x, y, zEnd); s.add(m);
    }
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a0c10, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.55, depthWrite: false });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2 * RACK.aisle, 2.0), glass); door.position.set(0, 1.0, zEnd); s.add(door);
    // cable tray + the fibre dropping into the target rack
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.7 }));
    tray.position.set(RACK.aisle + 0.4, TRAY_Y, -5.5); s.add(tray);
    this.fibreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false });
    // (off the tray, over the rack's top front edge and down its face, as a patch cord runs, into the port)
    const path = new THREE.CatmullRomCurve3([V(RACK.aisle + 0.4, TRAY_Y + 0.05, 1), V(RACK.aisle + 0.4, TRAY_Y + 0.05, TARGET.z + 0.25), V(RACK.aisle + 0.05, RACK.h + 0.12, TARGET.z + 0.04), V(RACK.aisle - 0.05, RACK.h - 0.25, TARGET.z + 0.01), V(RACK.aisle - 0.06, TARGET.y + 0.25, TARGET.z), V(RACK.aisle - 0.041, TARGET.y + 0.05, TARGET.z)], false, 'centripetal');
    const fib = new THREE.Mesh(new THREE.TubeGeometry(path, 160, 0.0035, 8), this.fibreMat); s.add(fib);
    // at the server: the SFP cage, the fibre's blue LC connector in it, and the port's link LED beside it
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.018), new THREE.MeshStandardMaterial({ color: 0x8d9197, roughness: 0.3, metalness: 1.0 }));
    cage.position.set(RACK.aisle - 0.004, TARGET.y + 0.05, TARGET.z); s.add(cage);
    // LC: a slim body 4.5 × 6.5 mm (its latch lever angled up), then the tapered strain-relief boot
    const lcMat = new THREE.MeshStandardMaterial({ color: 0x1f4fb8, roughness: 0.45 });
    const y0 = TARGET.y + 0.05;
    const lc = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.0065, 0.0045), lcMat); lc.position.set(RACK.aisle - 0.012, y0, TARGET.z); s.add(lc);
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.0008, 0.0032), lcMat);
    latch.position.set(RACK.aisle - 0.013, y0 + 0.0045, TARGET.z); latch.rotation.z = -0.22; s.add(latch);
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0026, 0.022, 16).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.6 }));
    boot.position.set(RACK.aisle - 0.03, y0, TARGET.z); s.add(boot);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.0006, 0.0018, 0.0032), this.linkMat);
    led.position.set(RACK.aisle - 0.0005, TARGET.y + 0.066, TARGET.z + 0.014); s.add(led);
    // soft LED sprites so the status lights bloom a little and blur when out of focus
    const pts: number[] = [], col: number[] = [], rad: number[] = [];
    const rnd = mulberry32(8);
    for (const sideSign of [-1, 1]) for (let i = 0; i < RACK.n; i++) for (let k = 0; k < 10; k++) {
      pts.push(sideSign * (RACK.aisle - 0.004), 0.1 + rnd() * 1.85, -(i + 0.5) * RACK.w + 0.24);
      const b = rnd() < 0.1 ? LIN.blue : LIN.paper, a = 0.4 + rnd();
      col.push(b[0] * a, b[1] * a, b[2] * a); rad.push(0.0022);
    }
    // the next aisle, through the glass: its racks' LEDs, dim and far
    const rn = mulberry32(9);
    for (let i = 0; i < 140; i++) {
      pts.push((rn() - 0.5) * 4.4, 0.1 + rn() * 1.85, zEnd - 2.2 - rn() * 7);
      const b = rn() < 0.1 ? LIN.blue : LIN.paper, a = 0.15 + 0.3 * rn();
      col.push(b[0] * a, b[1] * a, b[2] * a); rad.push(0.0022);
    }
    this.leds = new LightPoints(new Float32Array(pts), new Float32Array(col), new Float32Array(rad));
    s.add(this.leds.mesh);
    // the aisle mirrored in the floor: one cube capture from the middle of the aisle, at floor height
    const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cc = new THREE.CubeCamera(0.05, 40, rt);
    cc.position.set(0, 0.05, -4.5);
    floor.visible = mid.visible = false;
    cc.update(ctx.renderer, s);
    floor.visible = mid.visible = true;
    const envF = pm.fromCubemap(rt.texture).texture;
    floorMat.envMap = midMat.envMap = envF; floorMat.envMapIntensity = midMat.envMapIntensity = 1.0;
  }

  /** fibreK: the fibre's glow; link: the port's activity LED (on from our packet's arrival: an LED pulse of ~50 ms lasts minutes at ×5.840) */
  render(ctx: Ctx, cam: Cam, fibreK: number, out: THREE.WebGLRenderTarget, link = 1) {
    this.fibreMat.color.setRGB(LIN.ice[0] * fibreK, LIN.ice[1] * fibreK, LIN.ice[2] * fibreK);
    this.linkMat.color.setRGB(LIN.ice[0] * 4 * link, LIN.ice[1] * 4 * link, LIN.ice[2] * 4 * link);
    this.leds.update(cam, 0.02);
    ctx.r3.scene(this.scene, { ...cam, near: 0.01, far: 60 }, out, [0.002, 0.0025, 0.003]);
  }
}

export const datacenter = new Datacenter();
