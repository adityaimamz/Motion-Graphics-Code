// Inside the phone (S2), in millimetres: the logic board under the display. x = across the phone, z = down
// the phone from its top edge, y = height above the board. Real parts, all geometry (crisp at any zoom):
// black solder mask, copper traces under it (45° routing), ENIG gold pads and vias, 0201/0402 passives,
// the SoC (package-on-package), PMIC, RF transceiver, open shield-can frames, the coax to the antenna,
// and the aluminium frame rail with its plastic-filled antenna gap. The request is a flash that runs
// SoC → RF → coax → gap: at ×18.750 electricity is still instant, so it lights the path at once and fades.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { Trail, glowSprite } from '../fx';
import type { Cam } from '../r3';
import type { Ctx } from '../world';

const col = (c: [number, number, number]) => new THREE.Color().setRGB(...c);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The request's path, SoC to the antenna feed at the gap (board mm). */
export const PULSE_PATH = [
  V(36, 1.16, 20), V(41.7, 0.04, 20), V(45.5, 0.04, 20), V(48.5, 0.04, 23), V(52.3, 0.04, 23), V(55, 0.64, 26),
  V(57.2, 0.2, 22.2), V(58.5, 0.62, 18), V(58.2, 1.15, 12), V(55.2, 1.35, 5.2), V(51.6, 1.2, 1.3), V(50.9, 0.8, 0.6),
];
export const GAP_X = 49.5;

class Board {
  scene = new THREE.Scene();
  private trail = new Trail(96);
  private glowA = glowSprite(LIN.ice);
  private glowB = glowSprite(LIN.ice);
  private flash = new THREE.PointLight(col(LIN.ice), 0, 30, 1.6);
  private tail = new THREE.PointLight(col(LIN.blue), 0, 18, 1.6);
  private pathPts: THREE.Vector3[] = [];
  private beads = [0.18, 0.4, 0.62, 0.84].map(() => new THREE.PointLight(col(LIN.ice), 0, 9, 1.8));

  init(ctx: Ctx) {
    const s = this.scene;
    const pm = new THREE.PMREMGenerator(ctx.renderer);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.1;
    // product-macro light: one low raking key with real shadows, a blue rim from behind, almost no fill
    ctx.renderer.shadowMap.enabled = true;
    ctx.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const key = new THREE.DirectionalLight(0xe4ecff, 3.2);
    key.position.set(-6, 14, 58); key.target.position.set(36, 0, 22);
    key.castShadow = true;
    const sc2 = key.shadow.camera as THREE.OrthographicCamera;
    sc2.left = -48; sc2.right = 48; sc2.top = 40; sc2.bottom = -40; sc2.near = 1; sc2.far = 140;
    sc2.updateProjectionMatrix();
    key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
    const rim = new THREE.DirectionalLight(0x9db8ff, 1.1); rim.position.set(70, 8, -20); rim.target.position.set(36, 0, 22);
    const fill = new THREE.HemisphereLight(0x1a2233, 0x000000, 0.25);
    s.add(key, key.target, rim, rim.target, fill, this.flash, this.tail);

    const rnd = mulberry32(7);
    const R = (a: number, b: number) => a + (b - a) * rnd();

    // board: black solder mask (glossy), FR4 edge
    const mask = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.3, metalness: 0.0 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(64, 0.8, 46), mask);
    pcb.position.set(34, -0.4, 25);
    pcb.receiveShadow = true;
    s.add(pcb);

    // copper traces under the mask: slightly raised, a little lighter, catching the light along their edges
    const traceMat = new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: 0.18, metalness: 0.6, side: THREE.DoubleSide });
    const tpos: number[] = [];
    const ribbon = (pts: [number, number][], w: number) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i]!, [x1, z1] = pts[i + 1]!;
        const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz) || 1, nx = (-dz / L) * w / 2, nz = (dx / L) * w / 2;
        const y = 0.02;
        tpos.push(x0 + nx, y, z0 + nz, x0 - nx, y, z0 - nz, x1 + nx, y, z1 + nz, x0 - nx, y, z0 - nz, x1 - nx, y, z1 - nz, x1 + nx, y, z1 + nz);
      }
    };
    const vias: [number, number][] = [];
    const pads: [number, number, number, number][] = [];
    // buses: groups of parallel traces leaving chips, with one 45° bend, ending in vias
    const chips: [number, number, number, number][] = [[36, 20, 5.8, 5.8], [16, 34, 3.2, 3.2], [55, 26, 2.6, 2.6], [30, 38, 3.5, 2.5], [10, 12, 3, 3], [22, 9, 2.4, 2.4]];
    for (let b = 0; b < 70; b++) {
      const [cx, cz, hx, hz] = chips[Math.floor(rnd() * chips.length)]!;
      const side = Math.floor(rnd() * 4), n = 2 + Math.floor(rnd() * 7), pitch = R(0.14, 0.22), w = R(0.05, 0.09);
      const along = R(-0.7, 0.7), L1 = R(0.8, 4), L2 = R(1, 7), turn = rnd() < 0.5 ? 1 : -1;
      for (let k = 0; k < n; k++) {
        const o = along * (side % 2 ? hz : hx) + (k - n / 2) * pitch;
        let x0: number, z0: number, dx: number, dz: number;
        if (side === 0) { x0 = cx + o; z0 = cz - hz; dx = 0; dz = -1; }
        else if (side === 1) { x0 = cx + hx; z0 = cz + o; dx = 1; dz = 0; }
        else if (side === 2) { x0 = cx + o; z0 = cz + hz; dx = 0; dz = 1; }
        else { x0 = cx - hx; z0 = cz + o; dx = -1; dz = 0; }
        const x1 = x0 + dx * (L1 + k * pitch * 0.4), z1 = z0 + dz * (L1 + k * pitch * 0.4);
        const bx = (dx - dz * turn) * 0.7071, bz = (dz + dx * turn) * 0.7071;
        const x2 = x1 + bx * L2, z2 = z1 + bz * L2;
        if (x2 < 3 || x2 > 65 || z2 < 3 || z2 > 47) continue;
        ribbon([[x0, z0], [x1, z1], [x2, z2]], w);
        vias.push([x2, z2]);
      }
    }
    // the request's own route (surface trace SoC -> RF)
    ribbon([[41.7, 20], [45.5, 20], [48.5, 23], [52.3, 23], [53.4, 24.2]], 0.16);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(tpos, 3));
    tg.computeVertexNormals();
    const traces = new THREE.Mesh(tg, traceMat); traces.receiveShadow = true; s.add(traces);

    // gold: pads + via rings
    const gold = new THREE.MeshStandardMaterial({ color: col(LIN.gold), roughness: 0.28, metalness: 1.0 });
    const viaG = new THREE.RingGeometry(0.06, 0.13, 20).rotateX(-Math.PI / 2);
    const viaM = new THREE.InstancedMesh(viaG, gold, vias.length);
    const m4 = new THREE.Matrix4();
    vias.forEach(([x, z], i) => viaM.setMatrixAt(i, m4.makeTranslation(x, 0.02, z)));
    s.add(viaM);

    // passives around every chip and scattered: ceramic bodies + metal terminations
    const body = new THREE.MeshStandardMaterial({ color: 0x6b6152, roughness: 0.5 });
    const term = new THREE.MeshStandardMaterial({ color: 0xb9b6b0, roughness: 0.3, metalness: 1.0 });
    const parts: { x: number; z: number; l: number; w: number; h: number; rot: boolean }[] = [];
    const size = () => { const u = rnd(); return u < 0.45 ? [0.4, 0.2, 0.2] : u < 0.85 ? [0.6, 0.3, 0.3] : [1.0, 0.5, 0.5]; };
    for (const [cx, cz, hx, hz] of chips) for (let i = 0; i < 110; i++) {
      const a = rnd() * Math.PI * 2, r = R(0.7, 3.6), [l, w, h] = size();
      parts.push({ x: cx + Math.cos(a) * (hx + r), z: cz + Math.sin(a) * (hz + r), l: l!, w: w!, h: h!, rot: rnd() < 0.5 });
    }
    for (let i = 0; i < 700; i++) { const [l, w, h] = size(); parts.push({ x: R(4, 64), z: R(4, 46), l: l!, w: w!, h: h!, rot: rnd() < 0.5 }); }
    const keep = parts.filter((p) => !chips.some(([cx, cz, hx, hz]) => Math.abs(p.x - cx) < hx + 0.6 && Math.abs(p.z - cz) < hz + 0.6));
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const bodies = new THREE.InstancedMesh(unit, body, keep.length);
    const terms = new THREE.InstancedMesh(unit, term, keep.length * 2);
    const padM = new THREE.InstancedMesh(unit, gold, keep.length * 2);
    const q = new THREE.Quaternion(), sc = new THREE.Vector3(), p3 = new THREE.Vector3();
    keep.forEach((p, i) => {
      q.setFromAxisAngle(V(0, 1, 0), p.rot ? Math.PI / 2 : 0);
      bodies.setMatrixAt(i, m4.compose(p3.set(p.x, p.h / 2 + 0.02, p.z), q, sc.set(p.l * 0.62, p.h * 0.96, p.w)));
      for (let e = 0; e < 2; e++) {
        const off = (e ? 1 : -1) * p.l * 0.4;
        const ox = p.rot ? 0 : off, oz = p.rot ? off : 0;
        terms.setMatrixAt(i * 2 + e, m4.compose(p3.set(p.x + ox, p.h / 2 + 0.02, p.z + oz), q, sc.set(p.l * 0.2, p.h, p.w * 1.02)));
        padM.setMatrixAt(i * 2 + e, m4.compose(p3.set(p.x + ox * 1.12, 0.012, p.z + oz * 1.12), q, sc.set(p.l * 0.3, 0.02, p.w * 1.3)));
      }
    });
    for (const m of [bodies, terms, padM]) { m.castShadow = true; m.receiveShadow = true; }
    s.add(bodies, terms, padM);

    // chips: epoxy packages (the SoC as package-on-package), laser-marked pin-1 dot
    const epoxy = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.62 });
    const epoxyTop = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.4, metalness: 0.1 });
    const addChip = (x: number, z: number, w: number, d: number, h: number, mat = epoxy) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, h / 2 + 0.03, z); m.castShadow = m.receiveShadow = true; s.add(m);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, d) * 0.05, 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.9 }));
      dot.position.set(x - w / 2 + Math.min(w, d) * 0.12, h + 0.031, z - d / 2 + Math.min(w, d) * 0.12); s.add(dot);
      return m;
    };
    addChip(36, 20, 11.6, 11.6, 0.55);
    addChip(36, 20, 11.0, 11.0, 0.55, epoxyTop).position.y = 0.55 + 0.03 + 0.28;   // memory on top
    for (const [cx, cz, hx, hz] of chips.slice(1)) addChip(cx, cz, hx * 2, hz * 2, 0.6);

    // open shield-can frames (nickel silver)
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x75787d, roughness: 0.22, metalness: 1.0 });
    const frame = (x0: number, z0: number, x1: number, z1: number, h = 0.8, t = 0.07) => {
      const g = new THREE.Group();
      const wall = (cx: number, cz: number, w: number, d: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), shieldMat); m.position.set(cx, h / 2, cz); m.castShadow = m.receiveShadow = true; g.add(m); };
      wall((x0 + x1) / 2, z0, x1 - x0, t); wall((x0 + x1) / 2, z1, x1 - x0, t); wall(x0, (z0 + z1) / 2, t, z1 - z0); wall(x1, (z0 + z1) / 2, t, z1 - z0);
      // the folded lip at the top
      const lip = (cx: number, cz: number, w: number, d: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), shieldMat); m.position.set(cx, h, cz); g.add(m); };
      lip((x0 + x1) / 2, z0 + 0.12, x1 - x0, 0.24); lip((x0 + x1) / 2, z1 - 0.12, x1 - x0, 0.24); lip(x0 + 0.12, (z0 + z1) / 2, 0.24, z1 - z0); lip(x1 - 0.12, (z0 + z1) / 2, 0.24, z1 - z0);
      s.add(g);
    };
    frame(26, 11, 47, 30);
    frame(8, 27, 25, 43);
    frame(50, 20, 62, 33, 0.75);

    // coax: connector on the board, cable up and along to the rail
    const coaxCurve = new THREE.CatmullRomCurve3([V(58.5, 0.62, 18), V(58.4, 1.0, 14), V(57.5, 1.25, 9.5), V(55.2, 1.35, 5.2), V(52.6, 1.25, 2.2), V(51.3, 1.12, 0.9)]);
    const coax = new THREE.Mesh(new THREE.TubeGeometry(coaxCurve, 80, 0.4, 18), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.5 }));
    coax.castShadow = coax.receiveShadow = true;
    s.add(coax);
    const conn = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.6, 28), shieldMat);
    conn.position.set(58.5, 0.33, 18); s.add(conn);
    // flex cable (polyimide, desaturated amber) to the display connector
    const flex = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x3a3126, roughness: 0.45, metalness: 0.1 }));
    flex.position.set(14, 0.9, 14); flex.rotation.x = 0.06; s.add(flex);

    // the aluminium frame rail along the top edge, split by the plastic antenna gap
    const alu = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.28, metalness: 1.0 });
    const plastic = new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 0.7 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(GAP_X - 0.75 + 4, 7.5, 1.6), alu); railL.position.set((GAP_X - 0.75 - 4) / 2, 0.2, -1.2);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(72 - GAP_X - 0.75, 7.5, 1.6), alu); railR.position.set(GAP_X + 0.75 + (72 - GAP_X - 0.75) / 2, 0.2, -1.2);
    const gap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 7.5, 1.6), plastic); gap.position.set(GAP_X, 0.2, -1.2);
    for (const m of [railL, railR, gap]) { m.castShadow = m.receiveShadow = true; }
    s.add(railL, railR, gap);
    // antenna feed spring
    const spring = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.2), gold); spring.position.set(50.9, 0.27, 0.9); s.add(spring);

    // the pulse: trail + glows (FX layer, no depth)
    const curve = new THREE.CatmullRomCurve3(PULSE_PATH, false, 'centripetal', 0.2);
    this.pathPts = curve.getSpacedPoints(95);
    s.add(this.trail.mesh, this.glowA, this.glowB, ...this.beads);
  }

  /** Pulse state at film time t: birth time b (the flash), decay over ~1.2 s. */
  pose(t: number, birth: number, camPos: THREE.Vector3) {
    const age = t - birth;
    const on = age >= 0;
    const reveal = Math.min(1, Math.max(0, age / 0.05));   // lights end to end in ~3 frames: instant, but seen
    const k = on ? 9 * Math.exp(-age / 0.55) + 1.2 * Math.exp(-age / 2.2) : 0;
    const n = Math.max(2, Math.round(this.pathPts.length * reveal));
    const pts = this.pathPts.slice(0, n).reverse();          // head = the far end reached so far
    this.trail.set(on ? pts : [camPos], 0.075, k * 2.2, camPos, 0.0);
    this.glowA.visible = on; this.glowB.visible = on && reveal >= 1;
    this.glowA.position.copy(this.pathPts[0]!); this.glowA.scale.setScalar(6 * Math.exp(-age / 0.35) + 1.2);
    (this.glowA.material as THREE.SpriteMaterial).opacity = Math.min(1, k / 4);
    this.glowB.position.copy(this.pathPts[this.pathPts.length - 1]!); this.glowB.scale.setScalar(3.2);
    (this.glowB.material as THREE.SpriteMaterial).opacity = Math.min(1, k / 5);
    this.flash.position.copy(this.pathPts[0]!).add(V(0, 1.5, 0));
    this.flash.intensity = on ? 40 * Math.exp(-age / 0.3) : 0;
    this.tail.position.copy(this.pathPts[this.pathPts.length - 1]!).add(V(0, 1, 1));
    this.tail.intensity = on ? 6 * Math.exp(-age / 0.8) * reveal : 0;
    [0.18, 0.4, 0.62, 0.84].forEach((f, i) => {
      const b = this.beads[i]!;
      b.position.copy(this.pathPts[Math.round(f * (this.pathPts.length - 1))]!).add(V(0, 0.6, 0));
      b.intensity = on && reveal >= f ? 5 * Math.exp(-age / 0.7) + 0.6 * Math.exp(-age / 2.5) : 0;
    });
  }

  render(ctx: Ctx, cam: Cam, t: number, birth: number, out: THREE.WebGLRenderTarget) {
    this.pose(t, birth, cam.pos);
    ctx.r3.scene(this.scene, { ...cam, near: 0.02, far: 400 }, out);
  }
}

export const board = new Board();
