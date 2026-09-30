// A caption slip: a strip of paper taped to the board next to a station; its caption prints itself at the
// caption's cue (a few letters per 12 fps step) and stays. Lines are fitted to the slip with the width axis.
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from './sheet';
import { printLine, printKey } from './type';
import { cap } from '../cues';

export class Slip {
  sheet: Sheet;
  group = new THREE.Group();
  constructor(public capId: string, public lines: string[], x: number, y: number, public w: number, public h: number, o: { px?: number; deg?: number; z?: number; wght?: number; wdth?: number } = {}) {
    this.sheet = makeSheet(w, h, { res: 4, toneRes: 1, seed: x * 0.013 + y * 0.007, lift: [0, 0, 0.8, 0.6], misAmp: 0.6 });
    const z = o.z ?? 0.3;
    this.sheet.mesh.position.set(x, y, z);
    this.sheet.mesh.rotation.z = THREE.MathUtils.degToRad(o.deg ?? 0);
    this.group.add(this.sheet.mesh);
    const a = THREE.MathUtils.degToRad(o.deg ?? 0), ca = Math.cos(a), sa = Math.sin(a);
    const at = (lx: number, ly: number): [number, number] => [x + lx * ca - ly * sa, y + lx * sa + ly * ca];
    const [t1x, t1y] = at(-w / 2 + 6, h / 2 - 2), [t2x, t2y] = at(w / 2 - 6, h / 2 - 2);
    this.group.add(placeTape(makeTape(34, 13, x * 0.1 + 1), t1x, t1y, z, (o.deg ?? 0) + 28));
    this.group.add(placeTape(makeTape(32, 13, y * 0.1 + 2), t2x, t2y, z, (o.deg ?? 0) - 24));
    this.px = o.px ?? 26;
    this.wght = o.wght ?? 830;
    this.wdth = o.wdth ?? 90;
  }
  px: number;
  wght: number;
  wdth: number;

  update(ts: number) {
    const c = cap(this.capId);
    const age = ts - c.t;
    const per = 0.2; // the second line starts a little after the first
    const key = this.lines.map((l, i) => printKey(l, age - i * per, 28)).join('|');
    this.sheet.ink.draw(key, (k) => {
      const lh = this.px * 1.08;
      const top = (this.h - lh * this.lines.length) / 2 + this.px * 0.86;
      this.lines.forEach((l, i) => printLine(k, l, 12, top + i * lh, age - i * per, { px: this.px, wght: this.wght, wdth: this.wdth, maxW: this.w - 24, cps: 28 }));
    });
  }
}
