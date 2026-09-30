// S6: five letter cards stand in a row like dominoes and fall to the right one per ⅛ beat, each landing face up:
// G · E · R · A · K. Their type sweeps Anybody's axes: G hairline-narrow (wght 100, wdth 50) → K black-wide
// (wght 900, wdth 150). The last card nudges the pencil.
import { T as COPY } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { Slip } from '../paper/slip';
import { anyFont, monoFont } from '../fonts';
import { CARDS } from '../layout';
import { CUE } from '../cues';
import { clamp, lerp } from '../engine/util';

const GK = CUE.gerak;
export const LETTERS = [...COPY.word];
export const cardT = [GK.g, GK.e, GK.r, GK.a, GK.k];
export const cardX = (i: number) => CARDS.x0 + i * CARDS.pitch;
const FALL = 0.26;
const T = 1.4; // thickness

/** Fall angle (0 standing … π/2 face up), with a small bounce as it lands. */
export function cardAngle(i: number, ts: number) {
  const a = ts - cardT[i]!;
  if (a <= 0) return 0;
  const u = clamp(a / FALL);
  const fall = u * u; // gravity
  const bounce = a > FALL ? Math.exp(-(a - FALL) * 22) * Math.sin((a - FALL) * 40) * 0.06 : 0;
  return (Math.PI / 2) * fall - Math.abs(bounce);
}

export class Cards {
  group = new THREE.Group();
  cards: THREE.Group[] = [];
  faces: Sheet[] = [];
  slip: Slip;
  constructor() {
    const bgs: [number, number, number][] = [[0.96, 0.93, 0.86], [1.0, 0.86, 0.3], [0.97, 0.62, 0.8], [0.6, 0.78, 0.92], [0.96, 0.93, 0.86]];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(T, CARDS.w, CARDS.h), paperMaterial({ size: [CARDS.w, CARDS.h], paper: [0.82, 0.8, 0.76], seed: 90 + i, fiber: 1.4 }));
      body.position.set(-T / 2, 0, CARDS.h / 2);
      body.castShadow = body.receiveShadow = true;
      const face = makeSheet(CARDS.h, CARDS.w, { res: 5, seed: 95 + i, paper: bgs[i]!, seg: [1, 1], misAmp: 0.6 });
      const k = i / 4;
      face.ink.draw(LETTERS[i]!, (ink) => ink.paint('solid', 'black', 0.96, (c) => {
        c.font = anyFont(70, lerp(320, 900, k), lerp(74, 150, k));
        c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillText(LETTERS[i]!, CARDS.h / 2, CARDS.w / 2 + 25);
        c.font = monoFont(4.6);
        c.textAlign = 'left';
        c.fillText(`wght ${Math.round(lerp(320, 900, k))} · wdth ${Math.round(lerp(74, 150, k))}`, 5, CARDS.w - 5);
      }));
      // the face looks along −x while standing (u up the card, v along +y): face up and upright once fallen
      face.mesh.rotation.y = -Math.PI / 2;
      face.mesh.position.set(-T - 0.05, 0, CARDS.h / 2);
      g.add(body, face.mesh);
      g.position.set(cardX(i), CARDS.y, 0);
      this.cards.push(g);
      this.faces.push(face);
      this.group.add(g);
    }
    this.group.add(placeTape(makeTape(142, 20, 12.9, { s: COPY.tape6, font: monoFont(7, true), px: 7 }), CARDS.x0 + 40, CARDS.y - 70, 0.2, 1.5));
    this.slip = new Slip('bunyi', COPY.bunyi, CARDS.x0 + 190, CARDS.y + 118, 300, 84, { px: 32, deg: -1 });
    this.group.add(this.slip.group);
  }
  update(ts: number) {
    this.slip.update(ts);
    for (let i = 0; i < 5; i++) this.cards[i]!.rotation.y = cardAngle(i, ts);
  }
}
