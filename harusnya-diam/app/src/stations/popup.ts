// S5: a pop-up card. The disc lands on its cover and the cover springs up into a standing chart; eight folded
// paper bars rise with it and then dance to this film's own music: bar height = energy of the score in eight
// bands (app/public/data/bars.json, written by audio.py from the music stem). Stop-motion like everything else.
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { printLine, printKey } from '../paper/type';
import { monoFont, anyFont } from '../fonts';
import { POPUP, rw, rh } from '../layout';
import { CUE, cap } from '../cues';
import { clamp, springStep, lerp } from '../engine/util';
import { RISO_LIN } from '../palette';

const PK = CUE.pop;
export const CW = rw(POPUP), CH_ = rh(POPUP); // 260 × 140
export const HINGE = POPUP.y1;                   // the cover/back panel hinges on the base's top edge
export const NBARS = 8;
export const BAR = { w: 19, d: 11, y: POPUP.y1 - 26, max: 104 };
export const barX = (i: number) => POPUP.x0 + 34 + i * ((CW - 68) / (NBARS - 1));

/** Energy per band per 60 fps frame (0..1), loaded once; a gentle placeholder until audio.py has run. */
let BARS: number[][] | null = null;
export async function loadBars() {
  try {
    const r = await fetch('data/bars.json');
    if (r.ok) BARS = (await r.json()).frames as number[][];
  } catch { BARS = null; }
}
export function barLevels(ts: number): number[] {
  const f = Math.round(ts * 60);
  if (BARS && BARS.length) return BARS[Math.max(0, Math.min(BARS.length - 1, f))]!;
  return Array.from({ length: NBARS }, (_, i) => 0.35 + 0.3 * Math.sin(ts * (3 + i) + i) * Math.sin(ts * 1.7 + i * 0.5));
}

/** Cover angle: π lying closed on the base, π/2 standing. Springs open from the landing. */
export const coverAngle = (ts: number) => (ts < PK.buka ? Math.PI : Math.PI - (Math.PI / 2) * clamp(springStep(ts - PK.buka, 1.6, 0.45), 0, 1.08));
/** How far the bars have risen with the card (0..1). */
export const riseK = (ts: number) => clamp((Math.PI - coverAngle(ts)) / (Math.PI / 2));

const INKS = ['yellow', 'pink', 'blue'] as const;
const INK_COL: Record<string, [number, number, number]> = {
  yellow: [1.0 * 0.95, 0.8 * 0.95, 0.02],
  pink: [1.0, 0.16, 0.46],
  blue: [0.02, 0.2, 0.55],
};

export class Popup {
  group = new THREE.Group();
  base: Sheet;
  cover: THREE.Group;
  inside: Sheet;
  outside: Sheet;
  bars: THREE.Mesh[] = [];
  constructor() {
    this.base = makeSheet(CW, CH_, { res: 3, seed: 71, paper: RISO_LIN.sheet, seg: [2, 2] });
    this.base.ink.draw('b', (k) => {
      k.paint('solid', 'black', 0.85, (c) => {
        c.lineWidth = 0.8;
        c.beginPath(); c.moveTo(18, 26); c.lineTo(CW - 18, 26); c.stroke(); // the axis the bars stand on
        c.font = monoFont(5.6);
        const bands = T.bands;
        bands.forEach((b, i) => { c.textAlign = 'center'; c.fillText(b, barX(i) - POPUP.x0, 38); });
      });
    });
    this.base.mesh.position.set(POPUP.x0 + CW / 2, POPUP.y0 + CH_ / 2, 0.5);
    this.group.add(this.base.mesh);
    // the cover: its outside (the card's front) and its inside (the chart's back panel)
    this.cover = new THREE.Group();
    this.outside = makeSheet(CW, CH_, { res: 3, seed: 72, paper: [0.94, 0.9, 0.84], seg: [1, 1], side: THREE.BackSide });
    this.outside.ink.draw('o', (k) => {
      k.paint('tone', 'pink', 0.55, (c) => { c.fillRect(0, 0, CW, CH_); });
      k.paint('solid', 'yellow', 0.9, (c) => { c.translate(0, CH_); c.scale(1, -1); for (let i = 0; i < 8; i++) c.fillRect(20 + i * 12, 16, 7, 7); });
      k.paint('solid', 'black', 0.95, (c) => {
        // seen from above when closed, the cover's back face reads flipped top-to-bottom
        c.translate(0, CH_); c.scale(1, -1);
        c.font = anyFont(46, 900, 118); c.textBaseline = 'alphabetic';
        c.fillText('DATA', 18, 72);
        c.font = monoFont(6.4, true); c.fillText(T.cover, 20, CH_ - 16);
      });
    });
    this.inside = makeSheet(CW, CH_, { res: 4, toneRes: 2, seed: 73, paper: RISO_LIN.sheet, seg: [1, 1], side: THREE.FrontSide });
    // both faces live in the cover group's frame: y from the hinge out to the free edge
    for (const s of [this.outside, this.inside]) { s.mesh.position.set(0, CH_ / 2, 0); this.cover.add(s.mesh); }
    this.cover.position.set(POPUP.x0 + CW / 2, HINGE, 0.8);
    this.group.add(this.cover);
    // bars: folded paper boxes, each printed in one ink
    for (let i = 0; i < NBARS; i++) {
      const ink = INKS[i % 3]!;
      const m = new THREE.Mesh(new THREE.BoxGeometry(BAR.w, BAR.d, 1), paperMaterial({ size: [BAR.w, 60], paper: INK_COL[ink]!, seed: 80 + i, fiber: 1.2 }));
      m.castShadow = m.receiveShadow = true;
      this.bars.push(m);
      this.group.add(m);
    }
    this.group.add(placeTape(makeTape(168, 20, 11.3, { s: T.tape5, font: monoFont(7, true), px: 7 }), POPUP.x0 + 92, POPUP.y0 - 22, 0.2, -2));
  }

  /** The panel print: grid, axis, and the caption (printed at its cue). */
  private drawInside(ts: number) {
    const age = ts - cap('data').t;
    this.inside.ink.draw(printKey(T.data, age), (k) => {
      k.paint('solid', 'black', 0.55, (c) => {
        c.lineWidth = 0.4;
        for (let i = 0; i <= 4; i++) { const y = 26 + i * 22; c.beginPath(); c.moveTo(22, CH_ - y); c.lineTo(CW - 14, CH_ - y); c.stroke(); }
        c.font = monoFont(5.2);
        for (let i = 0; i <= 4; i++) c.fillText(String(i * 25), 8, CH_ - (26 + i * 22) + 2);
      });
      k.paint('tone', 'yellow', 0.28, (c) => c.fillRect(0, 0, CW, 44));
      printLine(k, T.data, 16, 30, age, { px: 24, wght: 860, wdth: 96, maxW: CW - 30 });
      k.paint('solid', 'black', 0.7, (c) => { c.font = monoFont(5.4); c.fillText(T.dataSub, 17, 40); });
    });
  }

  /** World position of the top of bar i at ts (its centre). */
  barTop(i: number, ts: number) {
    const h = this.barH(i, ts);
    return new THREE.Vector3(barX(i), BAR.y, 0.8 + h);
  }
  barH(i: number, ts: number) {
    const r = riseK(ts);
    const lv = ts < PK.tegak ? 0.55 : barLevels(ts)[i] ?? 0.3;
    return Math.max(2, r * lerp(0.2, 1, clamp(lv)) * BAR.max);
  }

  update(ts: number) {
    this.drawInside(ts);
    this.cover.rotation.x = coverAngle(ts);
    for (let i = 0; i < NBARS; i++) {
      const h = this.barH(i, ts), m = this.bars[i]!;
      m.scale.z = h;
      m.position.set(barX(i), BAR.y, 0.8 + h / 2);
    }
  }
}
