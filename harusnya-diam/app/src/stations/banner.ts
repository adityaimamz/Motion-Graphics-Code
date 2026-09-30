// S7: the banner at the top of the board ("SETIAP GERAK / PUNYA SEBAB.") and the pencil planning on the board:
// the disc's real path as a dashed line through every station, with the designer's notes. Both are there from
// frame 0 (outside the early framings) and read only when the camera pulls back.
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { decalMaterial } from '../paper/material';
import { InkCanvas } from '../paper/ink';
import { anyFont, fitWdth, handFont, monoFont } from '../fonts';
import { BANNER, MACHINE, rw, rh, cx, cy } from '../layout';

export class Banner {
  group = new THREE.Group();
  sheet: Sheet;
  constructor() {
    const W = rw(BANNER), H = rh(BANNER);
    this.sheet = makeSheet(W, H, { res: 2.2, toneRes: 1, seed: 101, seg: [6, 2], lift: [0, 0, 1.5, 1.5], misAmp: 1.8 });
    this.sheet.ink.draw('b', (k) => {
      const m = k.ctxs.solid;
      const px = 104, wght = 900, L = 30, bw = W - 60;
      const lines = T.banner;
      const wd = lines.map((ln) => fitWdth(m, ln, px, wght, bw, -0.01));
      const base = [H / 2 - 8, H / 2 + 86];
      for (const [ink, dx, dy] of [['pink', 4, -2.5], ['black', 0, 0]] as const) {
        k.paint('solid', ink, ink === 'pink' ? 0.95 : 1, (c) => {
          lines.forEach((ln, i) => { c.font = anyFont(px, wght, wd[i]!); c.letterSpacing = `${-0.01 * px}px`; c.fillText(ln, L + dx, base[i]! + dy); });
        });
      }
      k.paint('solid', 'black', 0.85, (c) => {
        c.font = monoFont(7.5);
        c.fillText(T.bannerFoot, L, 22);
      });
      k.paint('tone', 'yellow', 0.35, (c) => c.fillRect(0, 0, W, H));
    });
    this.sheet.mesh.position.set(cx(BANNER), cy(BANNER), 0.5);
    this.group.add(this.sheet.mesh);
    this.group.add(placeTape(makeTape(70, 22, 13.1), BANNER.x0 + 8, BANNER.y1 - 6, 0.5, 35));
    this.group.add(placeTape(makeTape(70, 22, 13.7), BANNER.x1 - 8, BANNER.y1 - 6, 0.5, -35));
  }
}

/** Graphite on the board: the planned path (dashed, the disc's true path) and notes. */
export class Notes {
  mesh: THREE.Mesh;
  ink: InkCanvas;
  static readonly W = MACHINE.w + 60;
  static readonly H = (MACHINE.w * 16) / 9 + 60;
  constructor(path: [number, number][], notes: { x: number; y: number; s: string; deg?: number; px?: number }[], arrows: { x0: number; y0: number; x1: number; y1: number }[]) {
    const W = Notes.W, H = Notes.H;
    const ox = MACHINE.cx - W / 2, oy = MACHINE.cy + H / 2; // canvas (0,0) = world top-left
    const cxw = (x: number) => x - ox, cyw = (y: number) => oy - y;
    this.ink = new InkCanvas(W, H, 1.6, 1);
    this.ink.draw('n', (k) => {
      k.paint('solid', 'black', 0.72, (c) => {
        c.lineWidth = 2.1;
        c.setLineDash([9, 7]);
        c.lineCap = 'round';
        c.beginPath();
        path.forEach(([x, y], i) => (i ? c.lineTo(cxw(x), cyw(y)) : c.moveTo(cxw(x), cyw(y))));
        c.stroke();
        c.setLineDash([]);
        c.lineWidth = 1.6;
        for (const a of arrows) {
          const x0 = cxw(a.x0), y0 = cyw(a.y0), x1 = cxw(a.x1), y1 = cyw(a.y1);
          c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.15, (y0 + y1) / 2 - (x1 - x0) * 0.15, x1, y1); c.stroke();
          const ang = Math.atan2(y1 - ((y0 + y1) / 2 - (x1 - x0) * 0.15), x1 - ((x0 + x1) / 2 + (y1 - y0) * 0.15));
          c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - 8 * Math.cos(ang - 0.45), y1 - 8 * Math.sin(ang - 0.45)); c.moveTo(x1, y1); c.lineTo(x1 - 8 * Math.cos(ang + 0.45), y1 - 8 * Math.sin(ang + 0.45)); c.stroke();
        }
      });
      k.paint('solid', 'black', 0.78, (c) => {
        for (const n of notes) {
          c.save();
          c.translate(cxw(n.x), cyw(n.y));
          c.rotate(((n.deg ?? 0) * Math.PI) / 180);
          c.font = handFont((n.px ?? 13) * 1.45);
          c.fillText(n.s, 0, 0);
          c.restore();
        }
      });
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), decalMaterial({ size: [W, H], paper: [1, 1, 1], inks: this.ink, cell: 3, seed: 7 }));
    this.mesh.position.set(MACHINE.cx, MACHINE.cy, 0.08);
    this.mesh.renderOrder = 1;
  }
}

/** This film's own storyboard, pinned to the board: eight pencil thumbnails with timecodes (and ink swatches). */
export class Storyboard {
  group = new THREE.Group();
  constructor(x: number, y: number) {
    const W = 404, H = 372;
    const sh = makeSheet(W, H, { res: 3, toneRes: 1, seed: 141, seg: [4, 4], lift: [0, 0, 1.4, 1], misAmp: 0.8, paper: [0.95, 0.94, 0.9] });
    const pw = 84, ph = 138, gx = 14, gy = 52, dx = 96, dy = 164;
    const tc = ['00:00', '00:04', '00:13', '00:19', '00:26', '00:34', '00:45', '00:52'];
    const lab = T.sbLab;
    sh.ink.draw('sb', (k) => {
      k.paint('solid', 'black', 0.92, (c) => {
        c.font = anyFont(20, 880, 90); c.fillText('STORYBOARD', 14, 30);
        c.font = monoFont(6.4); c.fillText(T.sbFoot, 170, 29);
        c.lineWidth = 0.7;
        for (let i = 0; i < 8; i++) {
          const px = gx + (i % 4) * dx, py = gy + Math.floor(i / 4) * dy;
          c.strokeRect(px, py, pw, ph);
          c.font = monoFont(5.6); c.fillText(`${String(i + 1).padStart(2, '0')}  ${tc[i]}`, px, py + ph + 10);
          c.font = handFont(8.5); c.fillText(lab[i]!, px, py + ph + 21);
        }
      });
      // the thumbnails, in graphite (a quick hand), one idea each
      k.paint('solid', 'black', 0.62, (c) => {
        c.lineWidth = 1.1; c.lineCap = 'round';
        const P = (i: number) => [gx + (i % 4) * dx, gy + Math.floor(i / 4) * dy] as const;
        let [x0, y0] = P(0); // poster: three lines of type and the dot
        for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x0 + 12, y0 + 30 + j * 16); c.lineTo(x0 + (j === 2 ? 44 : 70), y0 + 30 + j * 16); c.stroke(); }
        c.beginPath(); c.arc(x0 + 52, y0 + 62, 4, 0, 7); c.fill();
        c.setLineDash([2, 3]); c.beginPath(); c.moveTo(x0 + 52, y0 + 66); c.quadraticCurveTo(x0 + 72, y0 + 96, x0 + 42, y0 + 112); c.stroke(); c.setLineDash([]);
        [x0, y0] = P(1); // ripple
        for (let r = 8; r < 40; r += 8) { c.beginPath(); c.arc(x0 + 42, y0 + 80, r, 0, 7); c.stroke(); }
        c.beginPath(); c.arc(x0 + 44, y0 + 62, 4, 0, 7); c.fill();
        [x0, y0] = P(2); // flipbook: pages and the bounce
        c.strokeRect(x0 + 10, y0 + 48, 64, 46); c.beginPath(); c.moveTo(x0 + 74, y0 + 48); c.lineTo(x0 + 80, y0 + 42); c.lineTo(x0 + 80, y0 + 88); c.stroke();
        c.beginPath(); c.moveTo(x0 + 64, y0 + 60); c.quadraticCurveTo(x0 + 56, y0 + 50, x0 + 50, y0 + 86); c.quadraticCurveTo(x0 + 40, y0 + 52, x0 + 30, y0 + 86); c.quadraticCurveTo(x0 + 22, y0 + 44, x0 + 8, y0 + 70); c.stroke();
        [x0, y0] = P(3); // phone
        c.beginPath(); c.roundRect(x0 + 22, y0 + 22, 40, 92, 8); c.stroke();
        c.beginPath(); c.roundRect(x0 + 28, y0 + 42, 14, 7, 3.5); c.stroke();
        c.beginPath(); c.moveTo(x0 + 28, y0 + 64); c.lineTo(x0 + 56, y0 + 64); c.stroke(); c.beginPath(); c.arc(x0 + 44, y0 + 64, 3.5, 0, 7); c.fill();
        c.strokeRect(x0 + 28, y0 + 86, 28, 10);
        [x0, y0] = P(4); // pop-up bars
        c.strokeRect(x0 + 10, y0 + 40, 64, 40);
        [22, 34, 18, 40, 28, 30].forEach((h, j) => c.strokeRect(x0 + 14 + j * 10, y0 + 100 - h, 6, h));
        [x0, y0] = P(5); // cards
        c.font = anyFont(14, 700, 90);
        [...T.word].forEach((ch, j) => { c.strokeRect(x0 + 4 + j * 16, y0 + 62, 14, 18); c.fillText(ch, x0 + 6 + j * 16, y0 + 76); });
        [x0, y0] = P(6); // the fold and the plane
        c.beginPath(); c.moveTo(x0 + 12, y0 + 92); c.lineTo(x0 + 74, y0 + 60); c.lineTo(x0 + 12, y0 + 44); c.lineTo(x0 + 26, y0 + 60); c.closePath(); c.stroke();
        c.setLineDash([2, 3]); c.beginPath(); c.moveTo(x0 + 74, y0 + 60); c.quadraticCurveTo(x0 + 80, y0 + 20, x0 + 60, y0 + 18); c.stroke(); c.setLineDash([]);
        [x0, y0] = P(7); // the logo
        c.beginPath(); c.arc(x0 + 42, y0 + 70, 18, Math.PI * 0.08, Math.PI * 1.92); c.lineWidth = 4; c.stroke();
        c.lineWidth = 1.1; c.beginPath(); c.moveTo(x0 + 34, y0 + 60); c.lineTo(x0 + 52, y0 + 70); c.lineTo(x0 + 34, y0 + 80); c.lineTo(x0 + 39, y0 + 70); c.closePath(); c.fill();
      });
      k.paint('tone', 'pink', 0.5, (c) => { const x0 = gx + dx, y0 = gy; c.beginPath(); c.arc(x0 + 42, y0 + 80, 30, 0, 7); c.fill(); });
      k.paint('tone', 'yellow', 0.55, (c) => { const x0 = gx + 3 * dx, y0 = gy; c.fillRect(x0 + 28, y0 + 86, 28, 10); });
      k.paint('tone', 'blue', 0.45, (c) => { const x0 = gx + 3 * dx, y0 = gy + dy; c.fillRect(x0 + 22, y0 + 52, 40, 36); });
    });
    sh.mesh.position.set(x, y, 0.4);
    sh.mesh.rotation.z = THREE.MathUtils.degToRad(1.2);
    this.group.add(sh.mesh);
    this.group.add(placeTape(makeTape(64, 20, 15.3), x - W / 2 + 10, y + H / 2 - 4, 0.4, 38));
    this.group.add(placeTape(makeTape(64, 20, 15.9), x + W / 2 - 10, y + H / 2 - 4, 0.4, -34));
    // riso ink swatches: four chips on a strip
    const sw = makeSheet(300, 44, { res: 3, seed: 151, seg: [2, 1], misAmp: 0.3 });
    sw.ink.draw('sw', (k) => {
      const inks = [['pink', 'FLUO PINK'], ['blue', 'BLUE'], ['yellow', 'YELLOW'], ['black', 'BLACK']] as const;
      inks.forEach(([ink, name], i) => {
        k.paint('solid', ink, 0.97, (c) => c.fillRect(8 + i * 73, 6, 64, 22));
        k.paint('solid', 'black', 0.9, (c) => { c.font = monoFont(5.4, true); c.fillText(`RISO ${name}`, 8 + i * 73, 38); });
      });
    });
    sw.mesh.position.set(x + 30, y - H / 2 - 44, 0.35);
    sw.mesh.rotation.z = THREE.MathUtils.degToRad(-2);
    this.group.add(sw.mesh);
    this.group.add(placeTape(makeTape(40, 16, 16.4), x + 30 - 150, y - H / 2 - 30, 0.35, 70));
  }
}
