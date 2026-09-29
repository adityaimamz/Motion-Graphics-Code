// Inside the phone (S2), in millimetres: the logic board under the display. x = across the phone, z = down
// the phone from its top edge, y = height above the board. Real parts, all geometry (crisp at any zoom):
// black solder mask, copper traces under it (45° routing), ENIG gold pads and vias, 0201/0402 passives,
// the SoC (package-on-package), PMIC, RF transceiver, open shield-can frames, the coax to the antenna,
// and the aluminium frame rail with its plastic-filled antenna gap. The request is a flash that runs
// SoC → RF → coax → gap: at ×18.750 electricity is still instant, so it lights the path at once and fades.
// The antenna goes on transmitting for the rest of the chapter: the feed and the gap keep a steady glow.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LIN } from '../engine/palette';
import { mulberry32 } from '../engine/util';
import { Trail, glowSprite } from '../fx';
import type { Cam } from '../r3';
import type { Ctx } from '../world';

const col = (c: [number, number, number]) => new THREE.Color().setRGB(...c);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** The request's path, SoC to the antenna feed at the gap (board mm): trace to the RF chip, trace to J2,
 *  through the plug into the coax, along it to J4 by the rail, down into the board and along the short
 *  50 Ω line to the spring's pad, up the spring to the rail. */
export const PULSE_PATH = [
  V(36, 1.16, 20), V(41.7, 0.04, 20), V(45.5, 0.04, 20), V(48.5, 0.04, 23), V(52.3, 0.04, 23), V(55, 0.64, 26),
  V(56.4, 0.04, 23.3), V(57.4, 0.04, 22.3), V(58.5, 0.04, 21.2), V(58.5, 0.06, 19.15), V(58.5, 0.62, 18), V(58.5, 0.62, 15.7),
  V(58.2, 1.05, 12.5), V(57.4, 1.25, 9.4), V(56.4, 1.12, 6.4), V(55.46, 0.62, 3.45), V(55, 0.62, 1.2), V(53.85, 0.06, 1.2),
  V(53.25, 0.04, 1.2), V(52.8, 0.04, 0.75), V(51.2, 0.06, 0.75), V(50.9, 0.12, 0.62), V(50.9, 0.84, -0.36),
];
export const GAP_X = 49.5;
/** Where the feed spring touches the rail, right of the gap (board mm). */
const FEED = V(50.9, 0.85, -0.38);

/** Fine machining lines (one per row, varied), for the rail's roughness and bump. Deterministic. */
function brushedTexture(rnd: () => number) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 1024;
  const x = c.getContext('2d')!;
  let v = 0.5;
  for (let y = 0; y < c.height; y++) {
    v = 0.6 * v + 0.4 * rnd();                       // neighbouring lines are alike, as from one pass
    const g = Math.round(90 + 90 * v + (rnd() < 0.04 ? 60 : 0));
    x.fillStyle = `rgb(${g},${g},${g})`; x.fillRect(0, y, c.width, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}

/** The plastic in the antenna gap: dark polymer with a fine moulded grain, glowing from inside near the
 *  feed while the antenna transmits (false colour, like every signal in the film). */
const PLASTIC_VERT = /* glsl */ `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PLASTIC_FRAG = /* glsl */ `
uniform float k; uniform vec3 ice, feed; varying vec3 vW;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 d = vW - feed;
  // a band level with the feed, fading up and down the slot and deeper in: dim, the slot stays dark
  float g = exp(-abs(d.y) / 0.9) * exp(-max(0.0, -d.z - 0.6) / 0.5);
  float grain = 0.9 + 0.1 * vn(vW.xy * 30.0) + 0.05 * vn(vW.xy * 120.0);
  // where the plastic meets the rail on the feed's side the light leaks brightest: a small hot corner
  float leak = exp(-length((vW.xy - vec2(${(GAP_X + 0.75).toFixed(2)}, feed.y)) * vec2(1.0, 0.5)) / 0.28);
  vec3 c = vec3(0.004, 0.0045, 0.006) * grain + ice * k * ((0.012 + 0.13 * g) * grain + 0.9 * leak);
  gl_FragColor = vec4(c, 1.0);
}`;

class Board {
  scene = new THREE.Scene();
  private trail = new Trail(190);
  private glowA = glowSprite(LIN.ice);
  private glowB = glowSprite(LIN.ice);
  private flash = new THREE.PointLight(col(LIN.ice), 0, 30, 1.6);
  private tail = new THREE.PointLight(col(LIN.blue), 0, 18, 1.6);
  private pathPts: THREE.Vector3[] = [];
  private beads = [0.18, 0.4, 0.62, 0.84].map(() => new THREE.PointLight(col(LIN.ice), 0, 9, 1.8));
  private plasticMat = new THREE.ShaderMaterial({
    uniforms: { k: { value: 0 }, ice: { value: new THREE.Vector3(...LIN.ice) }, feed: { value: FEED.clone() } },
    vertexShader: PLASTIC_VERT, fragmentShader: PLASTIC_FRAG,
  });
  private feedDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: col(LIN.ice), toneMapped: false }));
  private feedGlow = glowSprite(LIN.ice);
  /** inside the slot, level with the feed: lights the slot's walls */
  private feedLight = new THREE.PointLight(col(LIN.ice), 0, 10, 2);

  init(ctx: Ctx) {
    const s = this.scene;
    const pm = new THREE.PMREMGenerator(ctx.renderer);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.1;
    // product-macro light: one low raking key with real shadows, a blue rim from behind, almost no fill
    ctx.renderer.shadowMap.enabled = true;
    // (three r18x removed PCFSoftShadowMap and fell back to this with a warning: same look)
    ctx.renderer.shadowMap.type = THREE.PCFShadowMap;
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

    // board: black solder mask (glossy), FR4 edge; it runs right up to the frame rail (the spring's pad sits
    // on its edge, in the antenna's keep-out: bare mask, no parts)
    const mask = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.3, metalness: 0.0 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(64, 0.8, 48.4), mask);
    pcb.position.set(34, -0.4, 23.8);
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
    // RF -> J2 (under the can's wall), and J4 -> the spring's pad: a short 50 Ω microstrip, wider
    ribbon([[56.4, 23.3], [57.4, 22.3], [58.5, 21.2], [58.5, 19.4]], 0.16);
    ribbon([[53.7, 1.2], [53.25, 1.2], [52.8, 0.75], [51.35, 0.75]], 0.3);
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
    // what each part is (own draw, so the layout above keeps its randomness): MLCC capacitors in their
    // brown-beige ceramic, thick-film resistors with a black top, a few dark inductors
    const rk = mulberry32(71), tint = new THREE.Color();
    const CAPS = [0x7d6450, 0x8a6f55, 0x6f5a48, 0x94795c, 0x7a6a58];
    const kinds = keep.map(() => { const u = rk(); return u < 0.62 ? 0 : u < 0.9 ? 1 : 2; });
    keep.forEach((_, i) => bodies.setColorAt(i, tint.setHex(kinds[i] === 0 ? CAPS[Math.floor(rk() * CAPS.length)]! : kinds[i] === 1 ? 0x141416 : 0x2b2c30)));
    body.color.setHex(0xffffff); body.roughness = 0.55;
    this.silkscreen(s, keep, kinds, chips, mulberry32(72));

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

    // coax (0.81 mm micro-coax) between two U.FL connectors: J2 by the RF chip, J4 by the rail. Each is a
    // receptacle soldered to the board (LCP body, tinned ground tabs either side, the signal tab toward its
    // trace) with the plug pressed on, 1.25 mm mated: a tinned shell, and the crimp ferrule the cable leaves
    // by, sideways (the plug turns freely on the receptacle, so the cable leaves wherever it is routed).
    const lcp = new THREE.MeshStandardMaterial({ color: 0x8c8475, roughness: 0.55 });
    const tin = new THREE.MeshStandardMaterial({ color: 0x9a9da2, roughness: 0.3, metalness: 1.0 });
    const part = (g: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m;
    };
    /** a mated U.FL at (x, z): the receptacle's signal tab toward angle `tab`, the cable leaving toward
     *  `cable` (angles about y, 0 = +x); returns where the cable leaves the ferrule */
    const ufl = (x: number, z: number, tab: number, cable: number) => {
      const rec = new THREE.Group(); rec.position.set(x, 0, z); rec.rotation.y = tab + Math.PI;
      part(rec, new THREE.BoxGeometry(2.0, 0.3, 2.0), lcp, 0, 0.15, 0);
      for (const sz of [-1, 1]) part(rec, new THREE.BoxGeometry(1.6, 0.07, 0.4), tin, 0, 0.035, sz * 1.15);
      part(rec, new THREE.BoxGeometry(0.45, 0.07, 0.5), tin, -1.15, 0.035, 0);
      const plug = new THREE.Group(); plug.position.set(x, 0, z); plug.rotation.y = cable;
      part(plug, new THREE.CylinderGeometry(0.93, 1.0, 0.72, 40), tin, 0, 0.66, 0);
      part(plug, new THREE.TorusGeometry(0.6, 0.045, 8, 40).rotateX(-Math.PI / 2), tin, 0, 1.02, 0);
      part(plug, new THREE.BoxGeometry(1.3, 0.72, 0.86), tin, 1.25, 0.62, 0);
      part(plug, new THREE.CylinderGeometry(0.47, 0.47, 0.55, 24).rotateZ(Math.PI / 2), tin, 2.15, 0.62, 0);
      s.add(rec, plug);
      return V(x + 2.3 * Math.cos(cable), 0.62, z - 2.3 * Math.sin(cable));
    };
    const j2 = ufl(58.5, 18, -Math.PI / 2, Math.PI / 2);            // J2: tab toward the RF trace, cable toward the rail
    const j4 = ufl(55, 1.2, Math.PI, Math.atan2(-0.98, 0.2));       // J4: tab toward the spring, cable back up the board
    const coaxCurve = new THREE.CatmullRomCurve3([j2, V(58.46, 0.68, 14.9), V(58.2, 1.05, 12.5), V(57.4, 1.25, 9.4), V(56.4, 1.12, 6.4), V(55.62, 0.7, 4.4), j4]);
    const coax = new THREE.Mesh(new THREE.TubeGeometry(coaxCurve, 120, 0.4, 18), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.5 }));
    coax.castShadow = coax.receiveShadow = true;
    s.add(coax);
    // flex cable (polyimide, desaturated amber) to the display connector
    const flex = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x3a3126, roughness: 0.45, metalness: 0.1 }));
    flex.position.set(14, 0.9, 14); flex.rotation.x = 0.06; s.add(flex);

    // the aluminium frame rail along the top edge (bead-blasted, then brushed: fine machining lines that
    // stretch its highlights), split by the antenna gap. The gap is a real slot: the plastic that fills it
    // sits 0.6 mm back from the rail's inner face, and the slot's edges are chamfered.
    const brushed = brushedTexture(rnd);
    const alu = new THREE.MeshPhysicalMaterial({ color: 0x3a3d42, metalness: 1.0, roughness: 0.34, roughnessMap: brushed, bumpMap: brushed, bumpScale: 0.004, anisotropy: 0.7 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(GAP_X - 0.75 + 4, 7.5, 1.6), alu); railL.position.set((GAP_X - 0.75 - 4) / 2, 0.2, -1.2);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(72 - GAP_X - 0.75, 7.5, 1.6), alu); railR.position.set(GAP_X + 0.75 + (72 - GAP_X - 0.75) / 2, 0.2, -1.2);
    const gap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 7.5, 1.0), this.plasticMat); gap.position.set(GAP_X, 0.2, -1.5);
    for (const m of [railL, railR, gap]) { m.castShadow = m.receiveShadow = true; }
    s.add(railL, railR, gap);
    // 45° chamfers down both edges of the slot: thin bright lines that frame it when light rakes across
    for (const sx of [-1, 1]) {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.17, 7.5, 0.17), alu);
      ch.position.set(GAP_X + sx * 0.75, 0.2, -0.4); ch.rotation.y = Math.PI / 4; s.add(ch);
    }
    // antenna feed: a gold spring leaf from its pad on the board up to the rail, just right of the gap
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.1), gold); pad.position.set(50.9, 0.05, 0.75); s.add(pad);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 1.45), gold);
    leaf.position.set(50.9, 0.47, 0.1); leaf.rotation.x = 0.62; leaf.castShadow = true; s.add(leaf);
    // where the leaf touches the rail: the feed point, lit while the radio transmits
    this.feedDot.position.copy(FEED); s.add(this.feedDot, this.feedGlow, this.feedLight);

    // the pulse: trail + glows (FX layer, no depth)
    const curve = new THREE.CatmullRomCurve3(PULSE_PATH, false, 'centripetal', 0.2);
    this.pathPts = curve.getSpacedPoints(189);
    s.add(this.trail.mesh, this.glowA, this.glowB, ...this.beads);
  }

  /** The silkscreen, printed in white ink on the mask: chip outlines with their pin-1 marks, outlines and
   *  reference designators for some of the passives, a few labels (U1 on the SoC, ANT1 at the feed). */
  private silkscreen(s: THREE.Scene, parts: { x: number; z: number; l: number; w: number; rot: boolean }[], kinds: number[], chips: [number, number, number, number][], rnd: () => number) {
    const PX = 40, X0 = 2, Z0 = -0.4, Wmm = 64, Hmm = 48.4;
    const c = document.createElement('canvas');
    c.width = Wmm * PX; c.height = Hmm * PX;
    const x = c.getContext('2d')!;
    x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 0.12 * PX; x.lineJoin = 'miter';
    const P = (mx: number, mz: number): [number, number] => [(mx - X0) * PX, (mz - Z0) * PX];
    chips.forEach(([cx, cz, hx, hz], i) => {
      const [a, b] = P(cx - hx - 0.35, cz - hz - 0.35);
      x.strokeRect(a, b, (hx * 2 + 0.7) * PX, (hz * 2 + 0.7) * PX);
      const [d, e] = P(cx - hx - 0.8, cz - hz - 0.8);
      x.beginPath(); x.arc(d, e, 0.18 * PX, 0, Math.PI * 2); x.fill();
      x.font = `600 ${0.9 * PX}px IT`;
      const [tx, tz] = P(cx - hx, cz + hz + 1.35);
      x.fillText(i === 0 ? 'U1' : `U${i + 3}`, tx, tz);
    });
    const names = ['C', 'R', 'L'], count = [100, 1, 1];
    parts.forEach((p, i) => {
      if (rnd() > 0.22) return;
      const k = kinds[i]!;
      const len = p.l * 1.25, wid = p.w * 1.9;
      const [a, b] = P(p.x - (p.rot ? wid : len) / 2, p.z - (p.rot ? len : wid) / 2);
      x.lineWidth = 0.07 * PX;
      x.strokeRect(a, b, (p.rot ? wid : len) * PX, (p.rot ? len : wid) * PX);
      if (rnd() < 0.7) {
        x.font = `600 ${0.42 * PX}px IT`;
        const n = count[k]!++;
        const [tx, tz] = P(p.x + (p.rot ? wid : len) / 2 + 0.12, p.z + 0.18);
        x.fillText(`${names[k]}${n}`, tx, tz);
      }
    });
    x.font = `600 ${0.8 * PX}px IT`;
    { const [tx, tz] = P(51.3, 2.4); x.fillText('ANT1', tx, tz); }
    { const [tx, tz] = P(56.35, 1.55); x.fillText('J4', tx, tz); }
    { const [tx, tz] = P(59.8, 18.6); x.fillText('J2', tx, tz); }
    { const [tx, tz] = P(9.8, 20.4); x.fillText('J3', tx, tz); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Wmm, Hmm).rotateX(-Math.PI / 2).translate(X0 + Wmm / 2, 0.006, Z0 + Hmm / 2),
      new THREE.MeshStandardMaterial({ color: 0xd4d2c8, alphaMap: t, transparent: true, depthWrite: false, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1 }));
    m.receiveShadow = true;
    s.add(m);
    // three fiducials: bare gold dots in a clear ring of mask
    const gold = new THREE.MeshStandardMaterial({ color: col(LIN.gold), roughness: 0.25, metalness: 1.0 });
    for (const [fx, fz] of [[4.5, 4.5], [61.5, 44], [4.5, 44]] as const) {
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32).rotateX(-Math.PI / 2), gold); f.position.set(fx, 0.008, fz); s.add(f);
    }
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
    // the feed keeps glowing after the flash: one transmit slot lasts ~0.5–1 ms, 9–18 s of film at ×18.750
    const feed = on && reveal >= 1 ? 1 : 0;
    this.feedDot.visible = this.feedGlow.visible = feed > 0;
    (this.feedDot.material as THREE.MeshBasicMaterial).color.copy(col(LIN.ice).multiplyScalar(2.5 + 5 * Math.exp(-age / 0.3)));
    this.feedGlow.position.copy(FEED); this.feedGlow.scale.setScalar(1.3);
    (this.feedGlow.material as THREE.SpriteMaterial).opacity = 0.7 * feed;
    this.feedLight.position.set(GAP_X + 0.3, FEED.y, -0.75);
    this.feedLight.intensity = 2.5 * feed;
    this.plasticMat.uniforms.k!.value = feed;
  }

  render(ctx: Ctx, cam: Cam, t: number, birth: number, out: THREE.WebGLRenderTarget) {
    this.pose(t, birth, cam.pos);
    ctx.r3.scene(this.scene, { ...cam, near: 0.02, far: 400 }, out);
  }
}

export const board = new Board();
