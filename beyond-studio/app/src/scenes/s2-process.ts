// S2 · Proses · 3.75–7.5. One word per half bar: Dirancang. (rises from the mask) / Dibangun. (slams)
// / Diluncurkan. (rises). At 6.5625 the arrow punches up through the last word and its letters scatter
// outward and toward the camera; the camera cranes up after the arrow to the first device set.
import type { Chapter, Shot, World, FrameOut, ArrowPose } from '../stage/world';
import { GlyphWord } from '../stage/glyphs';
import { CUE, CH } from '../cues';
import { V, pick, W as FW } from '../fmt';
import { TX } from '../text';
import { eOut, eIn, P, damp } from '../stage/motion';
import { clamp, hash, lerp } from '../engine/util';
import { FOV, WORDS_C, HOME, craneShot, craneArrow, v3 } from './layout';

const [T0, T1] = CH.proses;
const [W1, W2, W3] = CUE.words as [number, number, number];
const LAUNCH = CUE.launch;
// built in init(), once the brand font is loaded
let words: GlyphWord[] = [];
/** Word em size in world units: fit the longest word into the frame (9:16: 900 px of 1080). */
let EM = 1, BASE_Y = 0;

/** The framing on the words (the crane to the business set starts from here). */
const wordsShot = (t: number): Shot => ({ look: WORDS_C.clone().add(v3(0, pick(-0.7, -0.25), 0)), dist: pick(20, 21) - eOut(P(t, T0, LAUNCH - T0)) * 0.9, yaw: 0, pitch: pick(4.5, 3.5), fov: FOV, ap: 0 });

function arrow(t: number): ArrowPose | null {
  if (t < LAUNCH - 0.45 || t >= T1) return null;
  if (t < LAUNCH) {
    // rising out of the stage floor to the word's centre, accelerating (take-off)
    const k = eIn(P(t, LAUNCH - 0.45, 0.45));
    const pos = v3(WORDS_C.x, lerp(WORDS_C.y - pick(9, 7), WORDS_C.y, k), 1.2);
    return { pos, dir: v3(0, 1, 0), face: v3(0, 0, 1), scale: 0.0105, trail: 1, glow: 1 };
  }
  return craneArrow(t, LAUNCH, T1, wordsShot(LAUNCH), HOME.bisnis, v3(WORDS_C.x, WORDS_C.y, 1.2));
}

function shot(t: number): Shot | null {
  if (t < T0 || t >= T1) return null;
  return t < LAUNCH ? wordsShot(t) : craneShot(t, LAUNCH, T1, wordsShot(LAUNCH), HOME.bisnis);
}

function update(t: number, w: World, f: FrameOut) {
  const on = t >= T0 - 0.05 && t < T1 + 0.05;
  words.forEach((wd) => (wd.group.visible = false));
  if (!on) return;
  const maskLo = BASE_Y - EM * 0.26, maskHi = BASE_Y + EM * 0.84;
  const times = [W1, W2, W3];
  words.forEach((wd, i) => {
    const tin = times[i]!, tout = i < 2 ? times[i + 1]! - 0.24 : Infinity;
    if (t < tin - 0.02 || t > tout + 0.3) return;
    wd.group.visible = true;
    wd.group.position.set(WORDS_C.x, BASE_Y, 0);
    wd.group.scale.setScalar(EM);
    const n = wd.glyphs.length;
    const slam = i === 1;
    if (slam) {
      // Dibangun.: slams in whole (scale settles hard, no mask while it is oversize), leaves up through the mask
      const k = eOut(P(t, tin, 0.34));
      wd.group.scale.setScalar(EM * lerp(1.22, 1, k));
      wd.mat.opacity = clamp(P(t, tin, 0.04));
      wd.setClip(t < tin + 0.34 ? -1e4 : maskLo, t < tin + 0.34 ? 1e4 : maskHi);
      wd.glyphs.forEach((g, j) => {
        const b = eIn(clamp((t - tout - (n > 1 ? (j / (n - 1)) * 0.08 : 0)) / 0.22));
        g.mesh.position.set(wd.rest(j), b * 1.3, 0); g.mesh.rotation.set(0, 0, 0);
      });
      return;
    }
    wd.mat.opacity = 1;
    const exploding = i === 2 && t >= LAUNCH - 0.02;
    wd.setClip(exploding ? -1e4 : maskLo, exploding ? 1e4 : maskHi);
    wd.glyphs.forEach((g, j) => {
      const d = n > 1 ? (j / (n - 1)) * 0.2 : 0;
      const a = eOut(clamp((t - tin - d) / 0.62));
      const b = eIn(clamp((t - tout - d * 0.4) / 0.22));
      let x = wd.rest(j), y = (1 - a) * -1.3 + b * 1.3, z = 0;
      g.mesh.rotation.set(0, 0, 0);
      if (exploding) {
        // centre-out: the letters nearest the arrow go first; thrown sideways, up and at the camera
        const e = P(t, LAUNCH - 0.02 + Math.abs(j - (n - 1) / 2) * 0.018, 0.95);
        const k = eOut(e);
        const side = Math.sign(j - (n - 1) / 2 + 0.01);
        x += side * k * (1.4 + hash(j, 7) * 2.2);
        y += k * (0.8 + hash(j, 8) * 2.4);
        z += k * (3 + hash(j, 9) * 7) / EM * 1.6;
        g.mesh.rotation.set(k * (hash(j, 10) - 0.5) * 4, k * side * (1 + hash(j, 11) * 2), k * side * -(0.6 + hash(j, 12) * 1.8));
      }
      g.mesh.position.set(x, y, z);
    });
    if (exploding) wd.mat.opacity = 1 - eIn(P(t, LAUNCH + 0.25, 0.65));
  });

  // impacts: Dibangun. lands hard, the launch kicks
  f.post.shake = [damp(t, W2, 6, 60, 11) + damp(t, LAUNCH, 5, 55, 9), damp(t, W2, 4, 45, 11) + damp(t, LAUNCH, 6, 50, 9)];
}

const s2: Chapter = {
  init(w: World) {
    words = TX.words.map((s, i) => new GlyphWord(s, i === 1 ? 860 : 780));
    const maxW = Math.max(...words.map((wd) => wd.width));
    EM = V ? Math.min(1.55, ((900 / FW) * 7.6) / maxW) : Math.min(2.36, 15.5 / maxW);
    BASE_Y = WORDS_C.y - EM * 0.36;   // cap height centred on the frame
    words.forEach((wd) => w.scene.add(wd.group));
  },
  update,
  shot,
  arrow,
};
export default s2;
