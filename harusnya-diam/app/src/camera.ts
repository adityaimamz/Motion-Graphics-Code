// The camera: a board framing per moment (centre x/y, frame width, tilt/turn), eased between keys.
// Evaluated at camera time (stepped like the paper until the plane takes off, then smooth).
import { frameCam } from './world';
import type { Cam } from './r3';
import { CUE } from './cues';
import { ease, clamp, lerp } from './engine/util';
import { posterW, PL, MACHINE, FLIP, PHONE, POPUP, CARDS, PAGE, HOLE, cx, cy } from './layout';
import { flightPose } from './stations/plane';
import { RS } from './stations/poster';

export interface Frame { x: number; y: number; fw: number; z?: number; tilt?: number; az?: number; roll?: number; ap?: number }
type Key = [t: number, f: Frame, e?: (u: number) => number];

const HK = CUE.hook, RK = CUE.riak, FK = CUE.flip, UK = CUE.ui, PK = CUE.pop, GK = CUE.gerak, MK = CUE.mundur, KK = CUE.kosong;
const P = (lx: number, ly: number) => posterW(lx, ly);

// framings (world units)
const [pcx, pcy] = P(190, 285);
const S1 = { x: pcx, y: pcy - 6, fw: 420 };
const [fcx, fcy] = P(PL.field.x + PL.field.w / 2, RS.y - 64);
const S2 = { x: fcx, y: fcy, fw: 340 };
const [ox, oy] = P(RS.x - 18, RS.y - 36);
const [ox2, oy2] = P(RS.x - 34, RS.y + 34); // below-left of the landing, toward the dive target (clear of the caption)

const S3 = { x: cx(FLIP) + 12, y: cy(FLIP) + 30, fw: 292 };
const PHN = { x: cx(PHONE) + 12, y: -356, fw: 330 };
const PG = { x: cx(PAGE), y: cy(PAGE) + 34, fw: 330 };

let KEYS: Key[] = [];

/** Build the camera path once the stations exist (the dive target is a real halftone dot of the poster). */
export function initCamera(o: { dive: { x: number; y: number; z: number }; fwHandoff: number }) {
  const D = { x: o.dive.x, y: o.dive.y, z: o.dive.z, fw: o.fwHandoff };
  const pullMid = RK.tarik + (RK.tarikEnd - RK.tarik) / 2;
  const S2w = { ...S2, fw: 330 };
  KEYS = [
  [0, S1],
  [HK.spin, S1],
  [HK.rebah, { x: lerp(S1.x, S2.x, 0.8), y: lerp(S1.y, S2.y, 0.8), fw: 360 }, ease.inOutCubic],
  [RK.lontar, S2, ease.outCubic],
  [RK.beku, { ...S2, fw: 320 }, ease.inOutQuad],
  // bullet time round the frozen disc
  [RK.beku + 0.47, { x: ox, y: oy, z: 14, fw: 300, tilt: 36, az: -38, ap: 4 }, ease.inOutQuad],
  [RK.orbitEnd, { x: ox2, y: oy2, z: 0, fw: 240, tilt: 0, az: 28, ap: 0 }, ease.inOutQuad],
  // the dive: into one pink dot (the 2D Droste pass takes over at lv1 and hands back at pullMid)
  [RK.lv1, D, ease.inCubic],
  [pullMid, D],
  // zoom out around the dot first (still below the caption), then drift back to the whole field
  [pullMid + 0.17, { ...D, fw: 130 }, ease.outCubic],
  [RK.tarikEnd, S2w, ease.inOutCubic],
  [RK.lepasWaktu, { ...S2w, fw: 320 }, ease.inOutQuad],
  [RK.normal, { ...S2w, fw: 330 }, ease.inOutQuad],
  // the disc surfs to the poster's right edge; the camera drifts with it, then follows its jump
  [RK.jatuhTepi, { x: S2w.x + 60, y: S2w.y - 40, fw: 360 }, ease.inOutQuad],
  [FK.masuk, S3, ease.inOutCubic],
  [FK.keluar, { ...S3, fw: 285, y: S3.y - 6 }, ease.inOutQuad],
  [UK.toggle, PHN, ease.inOutCubic],
  [UK.kirim, { ...PHN, fw: 318 }, ease.inOutQuad],
  [UK.gelinding, { ...PHN, fw: 322, y: PHN.y - 8 }, ease.inOutQuad],
  // down the ruler to the card
  [UK.gelinding + 1.2, { x: -120, y: -560, fw: 340 }, ease.inOutCubic],
  [PK.buka - 0.5, { x: 150, y: -640, fw: 340 }, ease.inOutCubic],
  // low angle: the card opens toward us, the bars dance
  [PK.tegak, { x: cx(POPUP), y: POPUP.y1 - 30, z: 46, fw: 300, tilt: 60, ap: 3 }, ease.inOutCubic],
  [PK.lontar, { x: cx(POPUP) - 6, y: POPUP.y1 - 30, z: 46, fw: 285, tilt: 62, az: -6, ap: 3 }, ease.inOutQuad],
  // the throw: follow it up and over to the cards
  [PK.lontar + 0.9, { x: -60, y: -700, z: 60, fw: 560, tilt: 22 }, ease.inOutCubic],
  [GK.g, { x: CARDS.x0 + 222, y: CARDS.y + 60, fw: 540, tilt: 16 }, ease.inOutCubic],
  [GK.caption + 0.8, { x: CARDS.x0 + 226, y: CARDS.y + 58, fw: 525, tilt: 14 }, ease.inOutQuad],
  [MK.drop - 0.2, { x: CARDS.x0 + 228, y: CARDS.y + 56, fw: 515, tilt: 12 }, ease.inOutQuad],
  // S7: pull back to the whole machine, read, then down to the blank page
  [MK.full, { x: MACHINE.cx, y: MACHINE.cy, fw: MACHINE.w }, ease.inOutCubic],
  [MK.turun, { x: MACHINE.cx, y: MACHINE.cy, fw: MACHINE.w * 0.985 }, ease.inOutQuad],
  [KK.pensil, PG, ease.inOutCubic],
  [KK.lipat1, { ...PG, fw: 322 }, ease.inOutQuad],
  [KK.terbang, { ...PG, fw: 300, y: PG.y - 6 }, ease.inOutQuad],
  ];
}

function mix(a: Frame, b: Frame, u: number): Frame {
  return {
    x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z ?? 0, b.z ?? 0, u),
    fw: Math.exp(lerp(Math.log(a.fw), Math.log(b.fw), u)),
    tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, u), az: lerp(a.az ?? 0, b.az ?? 0, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u),
    ap: lerp(a.ap ?? 0, b.ap ?? 0, u),
  };
}

export function frameAt(t: number): Frame {
  if (t <= KEYS[0]![0]) return KEYS[0]![1];
  for (let i = 1; i < KEYS.length; i++) {
    const [tb, fb, e] = KEYS[i]!;
    const [ta, fa] = KEYS[i - 1]!;
    if (t <= tb) return mix(fa, fb, (e ?? ease.inOutCubic)(clamp((t - ta) / (tb - ta))));
  }
  const last = KEYS[KEYS.length - 1]![1];
  return last;
}

/** S8 from take-off: the camera rides with the plane (60 fps), then follows it into the tear and through. */
function flightFrame(t: number): Frame {
  const base = frameAt(KK.terbang);
  const fp = flightPose(t)!;
  const nose = fp.nose;
  if (t < KK.tembus) {
    const u = clamp((t - KK.terbang) / (KK.tembus - KK.terbang));
    const k = ease.inOutCubic(u);
    return { x: lerp(base.x, nose.x, k * 0.8), y: lerp(base.y, nose.y, k * 0.8), fw: lerp(base.fw, 460, Math.sin(Math.PI * u) * 0.9 + k * 0.1), tilt: 10 * Math.sin(Math.PI * u), az: -20 };
  }
  // into the hole: the target sinks behind the board while the frame narrows (the camera passes through)
  const u = clamp((t - KK.tembus) / (KK.sunyi - KK.tembus));
  const e = ease.inCubic(u);
  const at = flightFrame(KK.tembus - 1e-4);
  return { x: lerp(at.x, HOLE.x, ease.outCubic(u)), y: lerp(at.y, HOLE.y, ease.outCubic(u)), z: -420 * e, fw: Math.exp(lerp(Math.log(at.fw), Math.log(4), e)), tilt: lerp(at.tilt ?? 0, 0, u), az: at.az };
}

/**
 * Chase shots: in these windows the camera rides with the disc (look at it, frame it tight), eased in from the
 * key before and out into the key after — the transits are shots, not waits.
 */
const CHASE: { t0: number; t1: number; fw: number; tilt: number; az: number; lead: [number, number] }[] = [
  { t0: FK.keluar, t1: UK.toggle, fw: 250, tilt: 14, az: 25, lead: [-40, -30] },
  { t0: UK.gelinding + 0.3, t1: PK.buka + 0.2, fw: 230, tilt: 34, az: 62, lead: [40, -18] },
  { t0: PK.lontar, t1: GK.g, fw: 330, tilt: 18, az: 20, lead: [-60, -30] },
];
function chase(f: Frame, t: number, disc: { x: number; y: number; z: number } | null): Frame {
  if (!disc) return f;
  for (const c of CHASE) {
    if (t <= c.t0 || t >= c.t1) continue;
    const w = ease.inOutCubic(clamp((t - c.t0) / 0.45)) * (1 - ease.inOutCubic(clamp((t - (c.t1 - 0.55)) / 0.55)));
    const g: Frame = { x: disc.x + c.lead[0], y: disc.y + c.lead[1], z: disc.z * 0.6, fw: c.fw, tilt: c.tilt, az: c.az, ap: 2.5 };
    return mix(f, g, w);
  }
  return f;
}

export function camAt(t: number, disc: { x: number; y: number; z: number } | null = null): Cam {
  const f = t >= KK.terbang ? flightFrame(t) : chase(frameAt(t), t, disc);
  return frameCam(f.x, f.y, f.fw, { z: f.z, tilt: f.tilt, az: f.az, roll: f.roll, ap: f.ap });
}
