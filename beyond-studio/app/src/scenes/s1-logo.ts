// S1 · Logo · 0–3.75. The studio light clicks on; the ring draws symmetrically from 9 o'clock; the
// arrow flies in from the left and locks into the gap on the downbeat (1.875); the wordmark rises;
// then the ring pulls back and the arrow shoots right through the wordmark, the camera following it
// to the process words.
import * as THREE from 'three';
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { Ring, shockRing, ARROW_LOCK } from '../stage/logo';
import { CUE, CH } from '../cues';
import { V, pick } from '../fmt';
import { eOut, eIO, eIn, eBack, P, damp } from '../stage/motion';
import { maskText } from '../stage/type';
import { lerp, clamp } from '../engine/util';
import { FOV, INTRO_FLOOR, LOGO_C, LOGO_S, WORDS_C, v3 } from './layout';

const [T0, T1] = CH.logo;
const LOCK = CUE.lock1;
const OUT = 2.8;           // the ring pulls back, the arrow leaves
const WM = 'Beyond Studio';
const WM_SIZE = pick(0.72, 1.24);                               // wordmark em size, world units
const WM_AT = V ? v3(LOGO_C.x, LOGO_C.y - 2.45, 0) : v3(LOGO_C.x + 1.52 + 0.5, LOGO_C.y - 0.45, 0);
const TIP = v3(LOGO_C.x + ARROW_LOCK.x * LOGO_S, LOGO_C.y, 0.02);
const LOOK0 = V ? v3(LOGO_C.x, LOGO_C.y - 0.7, 0) : v3(0.24, 0, 0);

const ring = new Ring();
const ringM = new Ring();   // its reflection (own clipping planes, so the gap mirrors too)
const shock = shockRing();
let floor: THREE.ShaderMaterial;

const bez3 = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, u: number) => {
  const m = 1 - u;
  return a.clone().multiplyScalar(m * m * m).addScaledVector(b, 3 * m * m * u).addScaledVector(c, 3 * m * u * u).addScaledVector(d, u * u * u);
};
const IN = [v3(LOGO_C.x - 9, LOGO_C.y - 2.2, 3.2), v3(LOGO_C.x - 5.5, LOGO_C.y - 2.8, 2.4), v3(LOGO_C.x - 1.9, LOGO_C.y - 0.1, 0.5), TIP];
const FLY0 = 0.9;

function arrow(t: number): ArrowPose | null {
  if (t < FLY0 || t >= 3.75) return null;
  if (t < LOCK) {
    const u = eOut(P(t, FLY0, LOCK - FLY0) ** 0.85);
    const pos = bez3(IN[0]!, IN[1]!, IN[2]!, IN[3]!, u);
    const ahead = bez3(IN[0]!, IN[1]!, IN[2]!, IN[3]!, Math.min(1, u + 0.02));
    const dir = ahead.sub(pos);
    const settle = P(t, LOCK - 0.3, 0.3);
    if (dir.lengthSq() < 1e-8 || settle >= 1) dir.set(1, 0, 0);
    dir.normalize().lerp(v3(1, 0, 0), eOut(settle)).normalize();
    return { pos, dir, face: v3(0, 0, 1), scale: LOGO_S, trail: 1, glow: 0.9, bank: 0.9 * (1 - u) ** 2 };
  }
  const pop = 1 + 0.16 * (1 - eBack(P(t, LOCK, 0.32), 2.2));
  if (t < OUT) return { pos: TIP.clone(), dir: v3(1, 0, 0), face: v3(0, 0, 1), scale: LOGO_S * pop, trail: 1 - P(t, LOCK, 0.35), glow: 0.9 - 0.75 * eOut(P(t, LOCK, 0.9)) };
  // take-off to the right: accelerating (eIn), through the wordmark, out past the process words
  const k = eIn(P(t, OUT, 0.95));
  const pos = TIP.clone().lerp(v3(WORDS_C.x + 14, WORDS_C.y + (V ? -1.6 : 0), 0.3), k);
  if (V) pos.y += Math.sin(k * Math.PI) * -1.2;
  return { pos, dir: v3(1, 0, 0), face: v3(0, 0, 1), scale: LOGO_S, trail: clamp(k * 6), glow: 0.15 + 0.75 * clamp(k * 4) };
}

function shot(t: number): Shot | null {
  if (t >= T1) return null;
  const push = eOut(P(t, 0, OUT)) * 0.8;
  const base: Shot = { look: LOOK0.clone(), dist: pick(20.2, 21.8) - push, yaw: -16 * (1 - eOut(P(t, 0, LOCK))), pitch: pick(4.5, 3.5), fov: FOV, ap: 0 };
  // follow the arrow to the words (eIO: the camera starts slower than the arrow, then catches up)
  const k = eIO(P(t, OUT + 0.12, T1 - OUT - 0.12));
  if (k > 0) {
    base.look.lerp(WORDS_C.clone().add(v3(0, pick(-0.7, -0.25), 0)), k);
    base.dist = lerp(base.dist, pick(20, 21), k);
    base.yaw += Math.sin(k * Math.PI) * -4;
  }
  base.focus = base.dist;
  base.ap = 5 * eIn(P(t, OUT, 0.7)) * (1 - k);
  return base;
}

function update(t: number, w: World, f: FrameOut) {
  const on = t < T1 + 0.2;
  ring.mesh.visible = on;
  ringM.mesh.visible = on;
  shock.visible = false;
  // studio light: clicks on at 0, stays for the intro stage (the process words share this floor)
  const light = eOut(P(t, T0, 0.45));
  floor.uniforms.light!.value = t < CH.proses[1] ? light : 0;
  (floor.uniforms.origin!.value as THREE.Vector3).set(lerp(LOGO_C.x, WORDS_C.x, eIO(P(t, OUT, 1.0))), INTRO_FLOOR, 0);
  if (t < CH.proses[1]) { w.studio.key.intensity = 2.2 * light; w.studio.rim.intensity = 3 * light; w.scene.environmentIntensity = 0.55 * light; }
  if (!on) return;

  // ring: draws 0.2 → 1.4, then pulls back into the dark
  ring.set(eOut(P(t, 0.2, 1.2)));
  const back = eIn(P(t, OUT, 0.75));
  ring.mesh.position.set(LOGO_C.x - back * 1.5, LOGO_C.y, -back * 9);
  ring.mesh.scale.setScalar(LOGO_S);
  ring.update();
  ringM.set(eOut(P(t, 0.2, 1.2)));
  ringM.mesh.position.set(ring.mesh.position.x, 2 * INTRO_FLOOR - ring.mesh.position.y, ring.mesh.position.z);
  ringM.mesh.scale.set(LOGO_S, -LOGO_S, LOGO_S);
  ringM.mesh.visible = ring.mesh.visible;
  ringM.update();

  // shockwave in the logo plane on the lock
  const sw = P(t, LOCK, 0.95);
  if (sw > 0 && sw < 1) {
    shock.visible = true;
    shock.position.set(LOGO_C.x, LOGO_C.y, 0.1);
    shock.scale.setScalar(1.6 + eOut(sw) * 6.5);
    (shock.material as THREE.MeshBasicMaterial).opacity = 1.8 * (1 - sw) ** 2.4;
  }

  // camera impact + a small flash on the lock
  f.post.shake = [damp(t, LOCK, 7, 62, 10), damp(t, LOCK, 4.5, 47, 10)];
  f.post.flash = 0.006 * Math.exp(-(t - LOCK) * 9) * (t >= LOCK ? 1 : 0);

  // wordmark: rises per letter 2.1 → 2.8, leaves upward left→right as the arrow passes
  const a = w.project(WM_AT);
  const px = WM_SIZE * a.k;
  const pin = P(t, 2.1, 0.7);
  const pout = P(t, OUT + 0.08, 0.5);
  maskText(f.c, WM, a.x, a.y, px, pin, pout, { align: V ? 'center' : 'left', weight: 700, trackEm: -0.045, stagger: 0.3 });
}

const s1: Chapter = {
  init(w) {
    w.scene.add(ring.mesh, ringM.mesh, shock);
    floor = w.studio.addFloor(v3(LOGO_C.x, INTRO_FLOOR, 0), pick([6, 5], [9, 5]));
    w.studio.addMirror(w.arrowGroup, INTRO_FLOOR, w.arrowMesh);
  },
  update,
  shot,
  arrow,
};
export default s1;
