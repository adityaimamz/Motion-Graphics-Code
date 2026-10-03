// S7 · Orbit · 46.875–54.375 (and the last leg of S6's pull-out). From the Singapore server's roof straight
// up to ~900 km, tilting to face south-east: Java at night near the horizon, Singapore at the bottom, the
// thread of the cable between them. The answer's head runs up the thread at its physical speed
// (996 km in ~4.9 ms); both legs of the trip show as one thin line. From 52.5 the camera falls toward
// Jakarta (S8 goes on down through the clouds).
import * as THREE from 'three';
import { CH, CUE } from '../cues';
import { ms } from '../clock';
import { earth, ecef, enu, EARTH, R_EARTH } from '../sets/earth';
import { mtrack } from '../path';
import type { Cam } from '../r3';
import type { Ctx, Chapter } from '../world';

const [T0] = CH.orbit;
const MS_DEP = ms(T0);
const V_KMMS = CUE.fisik.seratKmS / 1000;      // km per ms
/** The answer's head: km along the thread from the server. */
export const headS = (t: number) => (t < T0 ? 0 : V_KMMS * (ms(t) - MS_DEP));
const SRV = EARTH.server, JKT = EARTH.phone;

/** Camera over the Earth: position from lat/lon/alt keys, looking along a heading (toward a lat/lon) at a
 *  scheduled pitch below the horizon (89° = straight down on the roof, ~40° in orbit, steep again in the dive). */
function orbitCam(t: number): Cam {
  const lat = mtrack([[44.95, SRV[0]], [46.875, 3.4], [52.5, 2.2], [54.375, -3.2], [55.4, JKT[0] + 0.12], [56.3, JKT[0] + 0.012]], t);
  const lon = mtrack([[44.95, SRV[1]], [46.875, 102.9], [52.5, 103.5], [54.375, 105.6], [55.4, JKT[1] - 0.05], [56.3, JKT[1] - 0.004]], t);
  const alt = mtrack([[44.95, 150], [46.875, 900], [52.5, 820], [54.375, 260], [55.4, 25], [56.3, 2.6]], t, true);
  const pitch = mtrack([[44.95, 72], [46.875, 41], [52.5, 38], [53.5, 46], [54.375, 62], [55.5, 80], [56.3, 86]], t) * Math.PI / 180;
  const tgt = t < 53 ? [-5.6, 106.6] : [JKT[0], JKT[1]];
  const pos = ecef(lat, lon, alt);
  const f = enu(lat, lon);
  const toT = ecef(tgt[0]!, tgt[1]!, 0).sub(pos);
  const hd = toT.sub(f.up.clone().multiplyScalar(toT.dot(f.up))).normalize();
  const fwdP = hd.clone().multiplyScalar(Math.cos(pitch)).add(f.up.clone().multiplyScalar(-Math.sin(pitch)));
  // in the dive the camera looks at Jakarta itself
  const w = Math.min(1, Math.max(0, (t - 52.8) / 1.4));
  const fwd = fwdP.multiplyScalar(1 - w).add(ecef(JKT[0], JKT[1], 0).sub(pos).normalize().multiplyScalar(w)).normalize();
  const k = Math.min(1, Math.max(0, (80 - pitch * 180 / Math.PI) / 20));
  const up = hd.clone().multiplyScalar(1 - k).add(f.up.clone().multiplyScalar(k)).normalize();
  return { pos, look: pos.clone().add(fwd.multiplyScalar(50)), up, fov: 44, ap: 0 };
}

export function earthPull(ctx: Ctx, t: number, out: THREE.WebGLRenderTarget) {
  // (its own program: the districts run into each other, the lights a little lower; back to S7's at 46.875)
  const pullK = 1 - Math.min(1, Math.max(0, (t - 45.8) / 1.0));
  earth.render(ctx, orbitCam(t), { headS: 0, threadK: Math.min(1, (t - 44.95) / 1.2), cloudK: 1, pullK: pullK * pullK * (3 - 2 * pullK) }, out, 'pull');
}
export function earthDive(ctx: Ctx, t: number, out: THREE.WebGLRenderTarget) {
  earth.render(ctx, orbitCam(t), { headS: headS(t), threadK: 1, cloudK: 1 }, out, 'dive');
}
export { orbitCam, R_EARTH };

const s7: Chapter = {
  id: 'orbit',
  render(t, ctx, out) {
    earth.render(ctx, orbitCam(t), { headS: headS(t), threadK: 1, cloudK: 1 }, out);
    ctx.post.bloomThreshold = 1.3;
    ctx.post.vignette = 0.5;
  },
};
export default s7;
