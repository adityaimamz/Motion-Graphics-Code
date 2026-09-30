// The disc's whole journey as a pure function of paper time: tremble, tear, roll, Euler spin-down, ripple
// launch, frozen float, surf, flight … Each chapter's part hands the next one an exact pose.
import * as THREE from 'three';
import { CUE } from './cues';
import { clamp, lerp, hash, ease } from './engine/util';
import { stepId } from './step';
import type { Disc } from './stations/disc';
import { DISC_R } from './stations/disc';
import { type Poster, RS, rippleTau, rippleH } from './stations/poster';
import { type Flipbook, ballAt, pageW } from './stations/flipbook';
import { phoneW, PHONE_Z, TOG, SLD, BTN, PW_, toggleK, sliderK, pressK } from './stations/phone';
import { rulerAt, RULER_LEN, RULER_ANG } from './stations/props';
import { CARDS } from './layout';
import { type Popup, coverAngle, HINGE, barX } from './stations/popup';
import { cardX } from './stations/cards';

const HK = CUE.hook, RK = CUE.riak, FK = CUE.flip, UK = CUE.ui, PK = CUE.pop, GK = CUE.gerak;

/** A thrown disc: from a to b with an arc of height h (z), tumbling a little. */
function arc(a: THREE.Vector3, b: THREE.Vector3, h: number, u: number) {
  const p = a.clone().lerp(b, u);
  p.z += 4 * h * u * (1 - u);
  return p;
}

/** Cubic Bézier point + tangent. */
function bez(p0: number[], p1: number[], p2: number[], p3: number[], u: number) {
  const a = 1 - u;
  const p = [0, 1].map((i) => a * a * a * p0[i]! + 3 * a * a * u * p1[i]! + 3 * a * u * u * p2[i]! + u * u * u * p3[i]!);
  const d = [0, 1].map((i) => 3 * a * a * (p1[i]! - p0[i]!) + 6 * a * u * (p2[i]! - p1[i]!) + 3 * u * u * (p3[i]! - p2[i]!));
  return { p, d };
}
function bezLen(ps: number[][], n = 64) {
  let L = 0, prev = bez(ps[0]!, ps[1]!, ps[2]!, ps[3]!, 0).p;
  for (let i = 1; i <= n; i++) { const q = bez(ps[0]!, ps[1]!, ps[2]!, ps[3]!, i / n).p; L += Math.hypot(q[0]! - prev[0]!, q[1]! - prev[1]!); prev = q; }
  return L;
}

export class Hero {
  private rollPath: number[][];
  private rollLen: number;
  constructor(public disc: Disc, public poster: Poster, public flip: Flipbook, public popup: Popup) {
    const P0 = [poster.period.x, poster.period.y];
    // down the headline's right side, a lean to the left, into the middle of the field (poster-local, y down)
    this.rollPath = [P0, [P0[0]! + 60, P0[1]! + 70], [RS.x + 70, RS.y - 120], [RS.x + 6, RS.y - 14]];
    this.rollLen = bezLen(this.rollPath);
  }

  update(ts: number) {
    const d = this.disc, P = this.poster;
    const id = stepId(ts);
    // ---------------- S1: tremble on the full stop, tear loose, roll, spin down
    if (ts < HK.lepas) {
      const k = clamp(ts / HK.lepas);
      const j = 0.35 + 0.9 * k;
      const w = P.toWorld(P.period.x + (hash(id, 1) * 2 - 1) * j, P.period.y + (hash(id, 2) * 2 - 1) * j);
      d.pose(w.x, w.y, w.z, THREE.MathUtils.degToRad(hash(id, 3) * 5 * k), hash(id, 4) * 6.28, 0, 0.15 * k);
      return;
    }
    const tRoll0 = HK.lepas + 1 / 12, tSpin = HK.spin, tFlat = HK.rebah;
    if (ts < tRoll0) { // tipping onto its edge
      const w = P.toWorld(P.period.x + 1.5, P.period.y + 0.5);
      d.pose(w.x, w.y, w.z, THREE.MathUtils.degToRad(62), -Math.PI / 2 + 0.3, 0, 2.2);
      return;
    }
    if (ts < tSpin) { // rolling on its edge, gathering speed, leaning into the curve
      const u = ease.inOutQuad(clamp((ts - tRoll0) / (tSpin - tRoll0)));
      const b = bez(this.rollPath[0]!, this.rollPath[1]!, this.rollPath[2]!, this.rollPath[3]!, u);
      const w = P.toWorld(b.p[0]!, b.p[1]!);
      const psi = Math.atan2(-b.d[1]!, b.d[0]!); // local y is down
      const lean = 84 - 10 * Math.sin(u * Math.PI);
      d.pose(w.x, w.y, w.z, THREE.MathUtils.degToRad(lean), psi, (u * this.rollLen) / DISC_R);
      return;
    }
    if (ts < tFlat) { // Euler's disk: the lean falls, the wobble speeds up, flat on the beat
      const u = clamp((ts - tSpin) / (tFlat - tSpin));
      const lean = 70 * Math.pow(1 - u, 1.6);
      const phase = 14 * u + 26 * u * u * u; // precession, accelerating
      const end = this.rollPath[3]!;
      const cxl = lerp(end[0]!, RS.x, ease.outQuad(u)) + 2.4 * (1 - u) * Math.cos(phase);
      const cyl = lerp(end[1]!, RS.y, ease.outQuad(u)) + 2.4 * (1 - u) * Math.sin(phase);
      const w = P.toWorld(cxl, cyl);
      d.pose(w.x, w.y, w.z, THREE.MathUtils.degToRad(lean), phase + Math.PI / 2, u * 3.0);
      return;
    }
    // ---------------- S2: ride the ripple, get launched by the rebound, freeze, fall back, surf off the edge
    const tau = rippleTau(ts);
    const tl = RK.lontar - RK.jatuh;
    const g = 291, v0 = g * (RK.beku - RK.lontar);
    if (tau < tl) {
      const w = P.toWorld(RS.x, RS.y, rippleH(RS.x, RS.y, tau));
      d.pose(w.x, w.y, w.z, 0, 0, 0);
      return;
    }
    const tLand = tl + 2 * (RK.beku - RK.lontar);
    if (tau < tLand) {
      const s = tau - tl;
      const z = v0 * s - 0.5 * g * s * s;
      const drift = s * 9;
      const w = P.toWorld(RS.x + drift, RS.y - drift * 0.4, Math.max(0, z));
      const axis = new THREE.Vector3(Math.sin(s * 2.2) * 0.35, 0.22, 1).normalize();
      d.place(w.add(new THREE.Vector3(0, 0, DISC_R * 0.35 * Math.sin(Math.min(1, s * 3)))), axis, s * 2.6);
      return;
    }
    // surf: slides out on a crest toward the poster's right edge
    const tOff = rippleTau(RK.jatuhTepi);
    if (tau < tOff) {
      const u = clamp((tau - tLand) / (tOff - tLand));
      const e = ease.inQuad(u);
      const lx = lerp(RS.x + 2 * 0.47 * 9, 372, e), ly = lerp(RS.y - 3.4, RS.y + 36, e);
      const hz = rippleH(lx, ly, tau);
      const w = P.toWorld(lx, ly, Math.max(0, hz));
      const tilt = 0.18 * Math.sin(u * 12);
      d.place(w.add(new THREE.Vector3(0, 0, 1.6)), new THREE.Vector3(tilt, -0.1, 1), u * 4);
      return;
    }
    // ---------------- S3: off the poster's edge onto the flipbook's top page, into the drawing, out again
    const [lx, ly] = pageW(ballAt(0).x, ballAt(0).y);
    const land = new THREE.Vector3(lx, ly, this.flip.stackTop(FK.masuk) + 0.3 + 1.6);
    if (ts < FK.masuk) {
      const off = P.toWorld(372, RS.y + 36, 1.6 + Math.max(0, rippleH(372, RS.y + 36, tau)));
      const u = clamp((ts - RK.jatuhTepi) / (FK.masuk - RK.jatuhTepi));
      const p = arc(off, land, 46, u);
      d.place(p, new THREE.Vector3(Math.sin(u * 5) * 0.5, Math.cos(u * 4) * 0.4, 1), u * 7);
      return;
    }
    if (ts < FK.masuk + 1 / 24) { d.place(land, new THREE.Vector3(0, 0, 1), 0); return; }
    if (ts < FK.keluar) { d.hide(); return; }
    // out of the last page's left edge (the ball's own velocity), towards the phone
    const b = ballAt(FK.keluar - FK.masuk);
    const [ex, ey] = pageW(b.x, b.y);
    const start = new THREE.Vector3(ex, ey, this.flip.stackTop(FK.keluar) + 1.6);
    const onKnob = (x: number) => { const [wx, wy] = phoneW(x, TOG.y); return new THREE.Vector3(wx, wy, PHONE_Z + 1.8 + 1.6); };
    if (ts < UK.toggle) {
      const u = clamp((ts - FK.keluar) / (UK.toggle - FK.keluar));
      const p = arc(start, onKnob(TOG.x1 - 12), 150, u);
      d.place(p, new THREE.Vector3(Math.sin(u * 9) * 0.6, 0.3 + Math.cos(u * 7) * 0.5, 1), u * 11);
      return;
    }
    // ---------------- S4: rides the toggle knob off, hops into the slider (it is the knob), drops on Kirim
    if (ts < UK.slider) { d.place(onKnob(lerp(TOG.x1 - 12, TOG.x0 + 12, toggleK(ts))), new THREE.Vector3(0, 0, 1), 0); return; }
    const onSlider = (x: number) => { const [wx, wy] = phoneW(x, SLD.y); return new THREE.Vector3(wx, wy, PHONE_Z + 0.4 + 1.6); };
    if (ts < UK.slider + 1 / 12) { d.place(arc(onKnob(TOG.x0 + 12), onSlider(SLD.x0), 10, 0.6), new THREE.Vector3(0.2, 0, 1), 0.3); return; }
    if (ts < UK.sliderEnd) { d.place(onSlider(lerp(SLD.x0, SLD.x1, sliderK(ts))), new THREE.Vector3(0, 0, 1), sliderK(ts) * 4); return; }
    const bx = BTN.x1 - 30, by = (BTN.y0 + BTN.y1) / 2;
    const onBtn = (tsx: number) => { const [wx, wy] = phoneW(bx, by); return new THREE.Vector3(wx, wy, PHONE_Z + 3.1 - 2.3 * pressK(tsx) + 1.6); };
    if (ts < UK.kirim) { const u = clamp((ts - UK.sliderEnd) / (UK.kirim - UK.sliderEnd)); d.place(arc(onSlider(SLD.x1), onBtn(UK.kirim), 38, ease.inQuad(u)), new THREE.Vector3(0.3 * u, -0.2, 1), u * 3); return; }
    if (ts < UK.gelinding) { d.place(onBtn(ts), new THREE.Vector3(0, 0, 1), 0); return; }
    // the torn toast knocks it right: off the phone's edge, onto the ruler, rolling on its rim down to the card
    const tDrop = UK.gelinding + 0.42;
    const top = rulerAt(8).add(new THREE.Vector3(0, 0, 0));
    if (ts < tDrop) {
      const u = clamp((ts - UK.gelinding) / (tDrop - UK.gelinding));
      const [ex, ey] = phoneW(PW_ + 6, by + 8);
      const edge = new THREE.Vector3(ex, ey, PHONE_Z + 3);
      const p = u < 0.5 ? onBtn(ts).lerp(edge, u * 2) : arc(edge, top.clone().add(new THREE.Vector3(0, 0, DISC_R)), 14, (u - 0.5) * 2);
      const beta = u < 0.5 ? 0 : lerp(0, 84, (u - 0.5) * 2);
      if (u < 0.5) d.place(p, new THREE.Vector3(0.25 * u, 0, 1), u * 2);
      else d.pose(p.x, p.y, top.z, THREE.MathUtils.degToRad(beta), RULER_ANG, u * 3, Math.max(0, p.z - top.z - DISC_R));
      return;
    }
    if (ts < PK.buka) {
      const u = clamp((ts - tDrop) / (PK.buka - tDrop));
      const s = 8 + (RULER_LEN - 8) * ease.inQuad(u);
      const p = rulerAt(s);
      d.pose(p.x, p.y, p.z, THREE.MathUtils.degToRad(84 - 3 * Math.sin(u * 9)), RULER_ANG, s / DISC_R);
      return;
    }
    // ---------------- S5: lands on the closed card; the cover springs up and tips it onto the bass bar
    const onCover = (ang: number) => {
      // a point on the cover 96 units out from the hinge, above bar 0
      const r = 96, x = barX(0);
      return new THREE.Vector3(x, HINGE + r * Math.cos(ang), 0.8 + r * Math.sin(ang) + 1.8);
    };
    const tSlide = PK.buka + 0.25;
    if (ts < tSlide) {
      const ang = coverAngle(ts);
      const p = onCover(ang);
      const tilt = Math.PI - ang; // the disc lies on the rising cover
      d.place(p, new THREE.Vector3(0, -Math.sin(tilt), Math.cos(tilt)), 0);
      return;
    }
    const barTop = (tsx: number) => this.popup.barTop(0, tsx).add(new THREE.Vector3(0, 0, 1.7));
    if (ts < PK.tegak) {
      const u = clamp((ts - tSlide) / (PK.tegak - tSlide));
      const p = arc(onCover(coverAngle(tSlide)), barTop(PK.tegak), 10, ease.inQuad(u));
      d.place(p, new THREE.Vector3(0, -0.6 * (1 - u), 1), u * 4);
      return;
    }
    if (ts < PK.lontar) { d.place(barTop(ts), new THREE.Vector3(0, 0, 1), 0); return; }
    // the big bass hit throws it left, over the row of cards, to land left of G and knock it over
    const gx = cardX(0);
    if (ts < GK.g) {
      const u = clamp((ts - PK.lontar) / (GK.g - PK.lontar));
      const goal = new THREE.Vector3(gx - DISC_R - 3, CARDS.y, DISC_R + 2);
      d.place(arc(barTop(PK.lontar), goal, 260, u), new THREE.Vector3(Math.sin(u * 13) * 0.7, Math.cos(u * 11) * 0.5, 0.6), u * 16);
      return;
    }
    // ---------------- S6: it rests where it fell, on its side against the first card's foot
    d.pose(gx - DISC_R - 6, CARDS.y - 4, 0, 0, 0, 0);
  }
}

/** The pencil: nudged by the last card, it creeps downhill to the blank page's top edge. */
export function pencilTravel(ts: number) {
  const a = CUE.gerak.pensil, b = CUE.kosong.pensil;
  if (ts < a) return 0;
  const u = clamp((ts - a) / (b - a));
  return 26 * (1 - Math.pow(1 - u, 1.6));
}
