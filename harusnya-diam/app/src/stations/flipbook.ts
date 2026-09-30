// S3: the flipbook. The disc lands on the top page and becomes the ball drawn on it; 45 pages flip at 12 fps
// (one per step, three in the air at once), the ball squashes and stretches through four beat-timed bounces,
// each higher, and leaves the last page as the disc again.
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { Slip } from '../paper/slip';
import { InkCanvas } from '../paper/ink';
import { handFont, monoFont } from '../fonts';
import { FLIP, rw, rh } from '../layout';
import { CUE } from '../cues';
import { clamp, lerp } from '../engine/util';
import { RISO_LIN } from '../palette';
import { DISC_R } from './disc';

const F = CUE.flip;
const PW = rw(FLIP), PH = rh(FLIP); // page 210 × 150
export const PAGES = Math.round((F.keluar - F.masuk) * 12) + 1; // 46: the last one is empty (the ball has left)
const LEAF = 0.11;                  // page thickness
const HINGE_X = FLIP.x1;             // pages hinge on the right edge (they flip away from the window light)

/** Page-space ball (x right, y up from the page's bottom edge) at animation time a (s since the landing). */
export function ballAt(a: number) {
  const c = [F.pantul1, F.pantul2, F.pantul3, F.pantul4].map((x) => x - F.masuk);
  const end = F.keluar - F.masuk;
  const x = lerp(PW - 50, -DISC_R - 6, clamp(a / end));
  const yg = 22 + DISC_R;
  let y: number, vy: number;
  if (a < c[0]!) { const g = (2 * (110 - yg)) / (c[0]! * c[0]!); y = 110 - 0.5 * g * a * a; vy = -g * a; }
  else if (a < c[3]!) {
    const k = a < c[1]! ? 0 : a < c[2]! ? 1 : 2;
    const H = [44, 64, 86][k]!, T = c[k + 1]! - c[k]!, u = (a - c[k]!) / T;
    y = yg + 4 * H * u * (1 - u); vy = (4 * H * (1 - 2 * u)) / T;
  } else {
    const T = 2 * (end - c[3]!), u = (a - c[3]!) / T;
    y = yg + 4 * 80 * u * (1 - u); vy = (4 * 80 * (1 - 2 * u)) / T;
  }
  const vx = -(PW - 50 + DISC_R + 6) / end;
  const contact = c.some((ci) => Math.abs(a - ci) < 0.045);
  return { x, y, vx, vy, contact };
}

/** Draw page i (its frame of the animation) into an ink canvas. */
function drawPage(ink: InkCanvas, iIn: number) {
  ink.draw(`p${iIn}`, (k) => {
    const i = Math.max(0, iIn);
    const a = iIn < 0 ? Infinity : i / 12;
    const yb = (y: number) => PH - y; // page y-up → canvas y-down
    // non-photo blue: the planned arc and the ground, drawn once, loosely
    k.paint('solid', 'blue', 0.28, (c) => {
      c.lineWidth = 0.55;
      c.setLineDash([2.2, 2.6]);
      c.beginPath();
      for (let s = 0; s <= 90; s++) { const b = ballAt((s / 90) * (F.keluar - F.masuk)); if (s) c.lineTo(b.x, yb(b.y)); else c.moveTo(b.x, yb(b.y)); }
      c.stroke();
      c.setLineDash([]);
      c.beginPath(); c.moveTo(6, yb(21.2)); c.lineTo(PW - 6, yb(22.4)); c.stroke();
    });
    // graphite: ground line, hatching, frame number, timing chart
    k.paint('solid', 'black', 0.72, (c) => {
      c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(10, yb(22)); c.bezierCurveTo(70, yb(22.6), 140, yb(21.5), PW - 10, yb(22.2)); c.stroke();
      c.lineWidth = 0.4;
      for (let x = 14; x < PW - 14; x += 7) { c.beginPath(); c.moveTo(x, yb(21)); c.lineTo(x - 4, yb(15.5)); c.stroke(); }
      c.font = handFont(11);
      c.textBaseline = 'alphabetic';
      c.fillText(String(i + 1).padStart(2, '0'), 9, 16);
      c.font = handFont(6.5);
      c.fillText(`/ ${PAGES}`, 26, 16);
      // timing chart (spacing ticks), top right
      c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(PW - 16, 12); c.lineTo(PW - 16, 52); c.stroke();
      for (let t = 0; t < 9; t++) { const yy = 12 + 40 * Math.pow(t / 8, 1.8); c.beginPath(); c.moveTo(PW - 20, yy); c.lineTo(PW - 12, yy); c.stroke(); }
    });
    if (a > F.keluar - F.masuk + 1e-6) return;
    // onion skins: the two previous frames, faint
    for (const [d, dens] of [[2, 0.2], [1, 0.36]] as const) {
      if (i - d < 0) continue;
      const b = ballAt((i - d) / 12);
      k.paint('solid', 'black', dens, (c) => { c.lineWidth = 0.6; c.beginPath(); c.arc(b.x, yb(b.y), DISC_R, 0, Math.PI * 2); c.stroke(); });
    }
    // the ball: squash on contact, stretch along the motion
    const b = ballAt(a);
    const sp = Math.hypot(b.vx, b.vy);
    const st = b.contact ? 0 : clamp(sp / 900) * 0.32;
    const ang = Math.atan2(-b.vy, b.vx);
    const sx = b.contact ? 1.38 : 1 + st, sy = b.contact ? 0.66 : 1 / (1 + st);
    const shape = (c: CanvasRenderingContext2D) => {
      c.save();
      c.translate(b.x, yb(b.y) + (b.contact ? DISC_R * 0.34 : 0));
      if (!b.contact) c.rotate(ang);
      c.scale(sx, sy);
      c.beginPath(); c.arc(0, 0, DISC_R, 0, Math.PI * 2);
      c.restore();
    };
    k.paint('tone', 'pink', 0.88, (c) => { shape(c); c.fill(); });
    k.paint('solid', 'black', 0.78, (c) => { c.lineWidth = 1.15; shape(c); c.stroke(); });
    // speed lines when it is fast, a squash note on the contact frames
    k.paint('solid', 'black', 0.5, (c) => {
      c.lineWidth = 0.6;
      if (!b.contact && sp > 250) {
        for (let j = -1; j <= 1; j++) {
          const ox = -Math.cos(ang) * (DISC_R + 6), oy = Math.sin(ang) * (DISC_R + 6);
          const px = -Math.sin(ang) * j * 7, py = -Math.cos(ang) * j * 7;
          c.beginPath(); c.moveTo(b.x + ox + px, yb(b.y) + oy + py); c.lineTo(b.x + ox * 2.1 + px, yb(b.y) + oy * 2.1 + py); c.stroke();
        }
      }
      if (b.contact) { c.font = handFont(8); c.fillText(T.squash, b.x + 18, yb(b.y) + 12); }
    });
  });
}

class Page {
  front: THREE.Mesh;
  back: THREE.Mesh;
  ink = new InkCanvas(PW, PH, 3, 2);
  geo = new THREE.PlaneGeometry(PW, PH, 30, 1);
  /** per vertex: column from the hinge (0..30) and side (−1 bottom, +1 top), read once from the flat plane */
  rows: Int32Array;
  sides: Int8Array;
  constructor(seed: number) {
    const pos0 = this.geo.attributes.position as THREE.BufferAttribute;
    this.rows = new Int32Array(pos0.count);
    this.sides = new Int8Array(pos0.count);
    for (let v = 0; v < pos0.count; v++) { this.rows[v] = Math.round((PW / 2 - pos0.getX(v)) / (PW / 30)); this.sides[v] = pos0.getY(v) >= 0 ? 1 : -1; }
    const mat = paperMaterial({ size: [PW, PH], paper: [0.92, 0.9, 0.86], inks: this.ink, cell: 3.2, seed, fiber: 0.8, side: THREE.FrontSide, mis: [[0.6, -0.4], [-0.5, 0.3], [0, 0], [0.2, 0.1]] });
    const back = paperMaterial({ size: [PW, PH], paper: [0.9, 0.88, 0.84], seed: seed + 1, fiber: 0.8, side: THREE.BackSide });
    this.front = new THREE.Mesh(this.geo, mat);
    this.back = new THREE.Mesh(this.geo, back);
    for (const m of [this.front, this.back]) { m.castShadow = true; m.receiveShadow = true; }
  }
  /** Bend the page: φ 0 = lying on the stack (left of the hinge), π = flipped over to the right; z0 = hinge height. */
  pose(phi: number, z0: number) {
    const pos = this.geo.attributes.position as THREE.BufferAttribute;
    const n = 30, ds = PW / n;
    const X: number[] = [0], Z: number[] = [0];
    for (let j = 1; j <= n; j++) {
      const s = (j - 0.5) / n;
      const th = phi - 0.55 * Math.sin(phi) * Math.pow(s, 1.4);
      X.push(X[j - 1]! - Math.cos(th) * ds);
      Z.push(Z[j - 1]! + Math.sin(th) * ds);
    }
    for (let v = 0; v < pos.count; v++) {
      const col = this.rows[v]!; // 0 at the hinge
      const y = this.sides[v]! * PH / 2;
      pos.setXYZ(v, HINGE_X + X[col]!, FLIP.y0 + PH / 2 + y, z0 + Z[col]!);
    }
    pos.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
    this.front.visible = this.back.visible = true;
  }
  hide() { this.front.visible = this.back.visible = false; }
}

export class Flipbook {
  group = new THREE.Group();
  top: Page;
  air: Page[];
  stack: THREE.Mesh;
  pile: THREE.Mesh;
  header: Sheet;
  slip: Slip;
  constructor() {
    this.top = new Page(21);
    this.air = [new Page(22), new Page(23), new Page(24)];
    for (const p of [this.top, ...this.air]) this.group.add(p.front, p.back);
    const edge = paperMaterial({ size: [PW, 6], paper: [0.84, 0.82, 0.78], seed: 5, fiber: 2.5 });
    this.stack = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 1), edge);
    this.pile = new THREE.Mesh(new THREE.BoxGeometry(PW, PH, 1), edge);
    for (const m of [this.stack, this.pile]) { m.castShadow = true; m.receiveShadow = true; this.group.add(m); }
    // the binding: a strip of heavier card with two staples, the label tape beside the book
    this.header = makeSheet(PH + 6, 24, { res: 4, seed: 31, paper: RISO_LIN.sheetShade, lift: [0, 0, 0, 0] });
    this.header.ink.draw('h', (k) => k.paint('solid', 'black', 0.9, (c) => {
      c.lineWidth = 1.4;
      for (const x of [PH * 0.22, PH * 0.78]) { c.beginPath(); c.moveTo(x - 9, 4); c.lineTo(x + 9, 4); c.stroke(); }
      c.font = monoFont(6.0, true);
      c.fillText(T.flipHead, 10, 16);
    }));
    // along the right edge, reading bottom-to-top
    this.header.mesh.rotation.z = Math.PI / 2;
    this.header.mesh.position.set(HINGE_X + 9, FLIP.y0 + PH / 2, PAGES * LEAF + 0.4);
    this.group.add(this.header.mesh);
    this.group.add(placeTape(makeTape(150, 20, 7.7, { s: T.tape3, font: monoFont(7.4, true), px: 7.4 }), FLIP.x0 + 78, FLIP.y0 - 24, 0.2, -3));
    this.slip = new Slip('lama', T.lama, FLIP.x0 + PW / 2 - 4, FLIP.y1 + 64, 236, 84, { px: 31, deg: -1.5 });
    this.group.add(this.slip.group);
  }

  /** Height of the top of the unflipped stack at paper time ts. */
  stackTop(ts: number) {
    const k = this.flipped(ts);
    return (PAGES - k) * LEAF + 0.2;
  }
  /** Pages that have left the stack (fractional steps are held: stop-motion). */
  flipped(ts: number) { return clamp(Math.floor((ts - F.masuk) * 12 + 1e-6), 0, PAGES - 1); }

  update(ts: number) {
    this.slip.update(ts);
    const k = this.flipped(ts);
    const nStack = PAGES - k;
    this.stack.scale.z = nStack * LEAF;
    this.stack.position.set(FLIP.x0 + PW / 2, FLIP.y0 + PH / 2, (nStack * LEAF) / 2);
    // the top page shows frame k (before the landing: frame 0 without the ball)
    drawPage(this.top.ink, ts < F.masuk + 1 / 24 ? -1 : k);
    this.top.pose(0, nStack * LEAF + 0.25);
    // pages in the air: j = k-1, k-2, k-3 at 1/6, 1/2, 5/6 of their flight
    let landed = 0;
    // after the last page has gone, the ones still in the air land too (one per step)
    const settled = Math.max(0, Math.floor((ts - F.keluar) * 12 + 1e-6));
    for (let n = 0; n < 3; n++) {
      const j = k - 1 - n;
      const p = this.air[n]!;
      if (j < 0 || ts < F.masuk || n >= 3 - settled) { p.hide(); continue; }
      // a page snaps up past vertical in its first step (stop-motion), so the stack below stays in the light
      const phi = [0.47, 0.71, 0.93][n]! * Math.PI;
      drawPage(p.ink, j);
      p.pose(phi, (PAGES - j) * LEAF + 0.3);
    }
    landed = Math.max(0, k - 3 + Math.min(3, settled));
    this.pile.visible = landed > 0;
    this.pile.scale.z = Math.max(1e-3, landed * LEAF);
    this.pile.position.set(HINGE_X + PW / 2, FLIP.y0 + PH / 2, (landed * LEAF) / 2 + PAGES * LEAF * 0 + 0.1);
  }
}

/** World position of a page-space point on the top of the stack. */
export function pageW(px: number, py: number): [number, number] { return [FLIP.x0 + px, FLIP.y0 + py]; }
