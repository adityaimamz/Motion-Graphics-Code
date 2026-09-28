// S9 · Foton · 63.75–67.5. Back out of the glass to where the viewer's eye is: 30 cm above the phone, the
// whole screen white now. Time slows to ±×2.800.000.000; one photon leaves a blue subpixel at the centre
// and crosses the 30 cm to the lens in 1 ns (its position comes from the clock). It arrives on the downbeat:
// white-out. That is the frame, delivered (the closing is born from it).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { ms, scanRow } from '../clock';
import { city, PHONE, DESK_Y } from '../sets/city';
import { screen } from '../sets/screen';
import { macroCam } from './s1-layar';
import { v3, mixCam, type Cam } from '../r3';
import { mtrack } from '../path';
import { P, eIO, eIn } from '../motion';
import type { Chapter } from '../world';

const [T0] = CH.foton;
const F = CUE.foton;
const EYE = v3(PHONE.center.x, DESK_Y + 0.282, PHONE.center.z + 0.103);
const SRC = v3(PHONE.center.x, PHONE.center.y + PHONE.h / 2 + 0.0003, PHONE.center.z);
const C_MMS = CUE.fisik.radioMS / 1000;               // metres per ms
const MS_EMIT = ms(F.emit);
const FLIGHT = EYE.distanceTo(SRC);                    // 0.30 m

/** Photon progress 0..1 along the 30 cm, from the physical clock. */
export const photonU = (t: number) => (t < F.emit ? 0 : Math.min(1, (C_MMS * (ms(t) - MS_EMIT)) / FLIGHT));

function eyeCam(t: number): Cam {
  const k = eIO(P(t, 64.05, F.back[1] - 64.05));
  const start: Cam = { pos: v3(PHONE.center.x, PHONE.center.y + 0.03, PHONE.center.z + 0.06), look: v3(PHONE.center.x, DESK_Y, PHONE.center.z + 0.055), up: v3(0, 0, -1), fov: 48, focus: 0.03, ap: 8 };
  const end: Cam = { pos: EYE.clone(), look: SRC.clone().add(v3(0, 0, -0.07)), up: v3(0, 1, 0), fov: 56, focus: FLIGHT, ap: 10 };
  const c = mixCam(start, end, k);
  // the eye follows the photon's plane of focus as it comes
  const u = photonU(t);
  c.focus = Math.max(0.02, FLIGHT * (1 - u));
  return c;
}
/** Pulling up off the glass (display units) before the room takes over. */
function riseCam(t: number): Cam {
  const z = mtrack([[T0, 17], [64.1, 520]], t, true);
  const a = macroCam(540.3, 2426, 17, 6, -1, 42, 30, 20);
  const b = macroCam(540.3, 2300, z, 89.5, -1, 44, z, 4);
  return mixCam(a, b, eIO(P(t, T0, 0.35)));
}

const s9: Chapter = {
  id: 'foton',
  render(t, ctx, out) {
    const r3 = ctx.r3;
    ctx.post.bloomThreshold = 1.4;
    const st = (tt: number) => {
      const u = photonU(tt);
      return {
        scan: scanRow(tt), glow: 0.45, screenK: 0.5,
        photon: tt >= F.emit ? { pos: SRC.clone().lerp(EYE, Math.min(u, 0.985)), k: 1.5 + 5 * u } : null,
      };
    };
    if (t < 64.05) { screen.render(ctx, riseCam(t), { scan: scanRow(t), lineGlow: 0 }, out); return; }
    if (t < 64.2) {
      screen.render(ctx, riseCam(t), { scan: scanRow(t), lineGlow: 0 }, r3.a);
      city.render(ctx, eyeCam(t), st(t), r3.b);
      r3.mix(r3.a.texture, r3.b.texture, out, P(t, 64.05, 0.15));
      return;
    }
    city.render(ctx, eyeCam(t), st(t), out);
    // the photon arrives: the lens whites out on the downbeat
    const w = eIn(P(t, F.hit - 0.28, 0.28));
    ctx.post.flash = w * 2.2;
    void THREE;
  },
};
export default s9;
