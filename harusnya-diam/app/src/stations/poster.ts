// S1–S2: the poster. "HALAMAN INI / HARUSNYA / DIAM." — the full stop is the disc. Its field of halftone
// (pink sun over a blue ground) ripples like water when the disc lands, freezes, and restarts (time remap).
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { anyFont, fitWdth, monoFont, textW } from '../fonts';
import { printLine, printKey } from '../paper/type';
import { POSTER, PL, posterW, rw, rh, cx, cy } from '../layout';
import { cap, CUE } from '../cues';
import { clamp, lerp, springStep, hash } from '../engine/util';

const W = rw(POSTER), H = rh(POSTER);
/** The poster is dry-mounted on 3 mm foam board: its surface height (ripple troughs stay above the board). */
export const POSTER_Z = 4.4;
/** Ripple source (poster-local, y down): the middle of the field, where the disc lands. */
export const RS = { x: PL.field.x + PL.field.w / 2, y: PL.field.y + PL.field.h / 2 };

// ---------------------------------------------------------------- ripple (shared with the Droste dive)
export const RIP = { A: 2.3, v: 95, lambda: 24, sigma: 34 };
const C = CUE.riak;

/** Ripple time τ for paper time ts: runs, freezes at `beku`, ramps back up from `lepasWaktu` to `normal`. */
export function rippleTau(ts: number) {
  const t0 = C.jatuh, f = C.beku, r0 = C.lepasWaktu, r1 = C.normal;
  if (ts < t0) return -1;
  if (ts < f) return ts - t0;
  const frozen = f - t0;
  if (ts < r0) return frozen;
  if (ts < r1) { const u = ts - r0, d = r1 - r0; return frozen + (u * u) / (2 * d); }
  return frozen + (r1 - r0) / 2 + (ts - r1);
}

/** Water-like height (units) at poster-local (x, y) for ripple time τ. */
export function rippleH(x: number, y: number, tau: number) {
  if (tau < 0) return 0;
  const r = Math.hypot(x - RS.x, y - RS.y);
  const { A, v, lambda, sigma } = RIP;
  const att = 1 / Math.sqrt(1 + r / 22);
  const pkt = (t0: number, a: number) => {
    const t = tau - t0;
    if (t < 0) return 0;
    const d = r - v * t;
    return a * Math.exp(-(d * d) / (2 * sigma * sigma)) * Math.cos((2 * Math.PI * d) / lambda) * Math.exp(-t * 0.35);
  };
  // the impact crater, the outgoing rings, the rebound at the centre (it launches the disc) and its rings
  const crater = -2.2 * Math.exp(-(r * r) / (2 * 14 * 14)) * Math.exp(-tau * 9);
  const tl = C.lontar - C.jatuh;
  const rebound = 3.4 * Math.exp(-(r * r) / (2 * 11 * 11)) * Math.exp(-((tau - tl) ** 2) / (2 * 0.11 * 0.11));
  let h = crater + rebound + pkt(0, A * 1.25) + pkt(tl + 0.08, A * 0.8) * 1.0;
  h *= att;
  // the field is the pool: ripples fade out toward its edges (the headline above stays flat)
  const fx = PL.field.x, fy = PL.field.y, fw = PL.field.w, fh = PL.field.h;
  const inside = Math.min(x - fx, fx + fw - x, y - fy, fy + fh - y);
  return h * clamp((inside + 6) / 26);
}

// ---------------------------------------------------------------- the print
interface PosterState { diamW: number; har: string; tahan: string; crater: number }

function drawPoster(sheet: Sheet, s: PosterState, harAge: number, tahanAge: number) {
  const ink = sheet.ink;
  const L = PL.margin, R = W - PL.margin, bw = R - L;
  ink.draw(JSON.stringify(s), (k) => {
    const m = k.ctxs.solid;
    // --- the field: a pink sun over a blue ground, a little yellow in the sky
    const f = PL.field;
    const g = (ch: 'pink' | 'blue' | 'yellow', paintFn: (c: CanvasRenderingContext2D) => void) => {
      const { c, sx } = k.toneCtx(ch);
      c.save();
      c.setTransform(sx, 0, 0, sx, 0, 0);
      c.globalCompositeOperation = 'lighter';
      c.beginPath(); c.rect(f.x, f.y, f.w, f.h); c.clip();
      paintFn(c);
      c.restore();
    };
    const col = (ch: number, a: number) => `rgba(${ch === 0 ? 255 : 0},${ch === 1 ? 255 : 0},${ch === 2 ? 255 : 0},${a})`;
    g('pink', (c) => {
      const gr = c.createRadialGradient(RS.x, RS.y - 8, 4, RS.x, RS.y - 8, 150);
      gr.addColorStop(0, col(0, 0.9)); gr.addColorStop(0.45, col(0, 0.62)); gr.addColorStop(1, col(0, 0.06));
      c.fillStyle = gr; c.fillRect(f.x, f.y, f.w, f.h);
    });
    g('blue', (c) => {
      const gr = c.createLinearGradient(0, f.y + f.h, 0, f.y);
      gr.addColorStop(0, col(1, 0.85)); gr.addColorStop(0.42, col(1, 0.35)); gr.addColorStop(0.75, col(1, 0.04)); gr.addColorStop(1, col(1, 0.0));
      c.fillStyle = gr; c.fillRect(f.x, f.y, f.w, f.h);
    });
    g('yellow', (c) => {
      const gr = c.createLinearGradient(0, f.y, 0, f.y + f.h);
      gr.addColorStop(0, col(2, 0.3)); gr.addColorStop(0.5, col(2, 0.08)); gr.addColorStop(1, col(2, 0));
      c.fillStyle = gr; c.fillRect(f.x, f.y, f.w, f.h);
    });
    // a hairline frame round the field (black, solid)
    k.paint('solid', 'black', 0.85, (c) => { c.lineWidth = 0.5; c.strokeRect(f.x, f.y, f.w, f.h); });

    // --- headline: two justified lines, then DIAM (its width is alive) and the dry aside
    const px = PL.px, wght = 900;
    const lines = T.head;
    const wd = lines.map((ln) => fitWdth(m, ln, px, wght, bw, -0.01));
    const drawHead = (ink: 'black' | 'pink', dx: number, dy: number, dens: number) => {
      k.paint('solid', ink, dens, (c) => {
        c.textBaseline = 'alphabetic';
        lines.forEach((ln, i) => { c.font = anyFont(px, wght, wd[i]!); c.letterSpacing = `${-0.01 * px}px`; c.fillText(ln, L + dx, PL.base[i]! + dy); });
        c.font = anyFont(px, wght, s.diamW); c.letterSpacing = `${-0.01 * px}px`;
        c.fillText(T.last, L + dx, PL.base[2] + dy);
      });
    };
    drawHead('pink', 2.6, -1.6, 0.95); // the pink shadow, off register
    drawHead('black', 0, 0, 1);

    // "Harusnya." prints under the torn-out stop (serif italic, pink): the dry aside
    if (harAge >= 0) printLine(k, T.aside, R, PL.aside, harAge, { px: 46, face: 'serif', ink: 'pink', align: 'right', cps: 14 });

    // S2 caption overprinted in black on the top of the field (riso: type over image)
    if (tahanAge >= 0) {
      printLine(k, T.tahan[0]!, L + 14, f.y + 40, tahanAge, { px: 33, wght: 840, wdth: 88, maxW: 300, cps: 36 });
      printLine(k, T.tahan[1]!, L + 14, f.y + 75, tahanAge - 0.17, { px: 33, wght: 840, wdth: 88, maxW: 300, cps: 36 });
    }

    // --- print furniture: crop marks, registration target, footer
    k.paint('solid', 'black', 0.9, (c) => {
      c.lineWidth = 0.45;
      const cm = (x: number, y: number, sx: number, sy: number) => { c.beginPath(); c.moveTo(x, y + sy * 4); c.lineTo(x, y + sy * 12); c.moveTo(x + sx * 4, y); c.lineTo(x + sx * 12, y); c.stroke(); };
      cm(8, 8, 1, 1); cm(W - 8, 8, -1, 1); cm(8, H - 8, 1, -1); cm(W - 8, H - 8, -1, -1);
      const rx = W - 30, ry = H - 11;
      c.beginPath(); c.arc(rx, ry, 3.2, 0, Math.PI * 2); c.moveTo(rx - 5.5, ry); c.lineTo(rx + 5.5, ry); c.moveTo(rx, ry - 5.5); c.lineTo(rx, ry + 5.5); c.stroke();
      c.font = monoFont(5.2);
      c.textBaseline = 'middle';
      c.fillText(T.posterFoot, L, 12);
      c.textAlign = 'right';
      c.fillText('01/06', R, 12);
    });
    k.paint('solid', 'pink', 0.9, (c) => { c.lineWidth = 0.45; const rx = W - 44, ry = H - 11; c.beginPath(); c.arc(rx, ry, 2.2, 0, Math.PI * 2); c.stroke(); });
    k.paint('solid', 'blue', 0.9, (c) => { c.lineWidth = 0.45; const rx = W - 52, ry = H - 11; c.beginPath(); c.arc(rx, ry, 2.2, 0, Math.PI * 2); c.stroke(); });
  });
}

// ---------------------------------------------------------------- the station
export class Poster {
  sheet: Sheet;
  group = new THREE.Group();
  aH: THREE.BufferAttribute;
  /** poster-local position of the full stop (the disc's first home) */
  period = { x: 0, y: 0 };
  private lastTau = NaN;
  flecks: THREE.Mesh[] = [];
  constructor() {
    this.sheet = makeSheet(W, H, {
      res: 3.2, toneRes: 2, seg: [190, 285], cell: 4.4, misAmp: 1.2, seed: 1.3, hMod: 0.3, lift: [0, 0, 2.2, 0],
      extraUniforms: { uCrater: { value: new THREE.Vector3(0, 0, 0) } },
      fragDecl: 'uniform vec3 uCrater;',
      fragExtra: /* glsl */ `
        // where the full stop tore out: a shallow crater of lighter, fibrous core
        {
          vec2 d = pp - uCrater.xy;
          float r = length(d), a = atan(d.y, d.x);
          float edge = 15.4 + 1.3 * vN(vec2(a * 5.0, uCrater.z * 3.0)) + 0.8 * pH(vec2(floor(a * 30.0), 3.0));
          float inC = (1.0 - smoothstep(edge - 0.6, edge + 0.4, r)) * uCrater.z;
          float fib = smoothstep(0.55, 0.95, vN(vec2(a * 40.0, r * 0.6)));
          diffuseColor.rgb = mix(diffuseColor.rgb, uPaper * (1.04 + 0.05 * fib) * (0.93 + 0.07 * smoothstep(edge - 5.0, edge, r)), inC);
        }`,
    });
    const m = this.sheet.mesh;
    m.position.set(cx(POSTER), cy(POSTER), POSTER_Z);
    // the foam board under it: only a border shows (white core on the edges in the tilted shots); the middle is
    // open so the ripple's troughs never meet it
    const foamMat = paperMaterial({ size: [W, POSTER_Z], paper: [0.86, 0.85, 0.82], seed: 8.8, fiber: 0.4, roughness: 0.9 });
    const fz = POSTER_Z - 0.25, bw = 16;
    for (const [w, h, x, y] of [[W, bw, 0, (H - bw) / 2], [W, bw, 0, -(H - bw) / 2], [bw, H - 2 * bw, -(W - bw) / 2, 0], [bw, H - 2 * bw, (W - bw) / 2, 0]] as const) {
      const foam = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, h - 0.4, fz), foamMat);
      foam.position.set(cx(POSTER) + x, cy(POSTER) + y, fz / 2);
      foam.castShadow = true;
      foam.receiveShadow = true;
      this.group.add(foam);
    }
    const count = this.sheet.geo.attributes.position!.count;
    this.aH = new THREE.BufferAttribute(new Float32Array(count), 1);
    this.sheet.geo.setAttribute('aH', this.aH);
    this.group.add(m);
    // tape: two top corners, the label tape holds the bottom-left corner
    const [tlx, tly] = posterW(4, 8), [trx, try_] = posterW(W - 4, 6), [blx, bly] = posterW(92, H - 6);
    this.group.add(placeTape(makeTape(62, 19, 1.1), tlx, tly, POSTER_Z, 38));
    this.group.add(placeTape(makeTape(58, 18, 2.7), trx, try_, POSTER_Z, -33));
    this.group.add(placeTape(makeTape(150, 20, 3.9, { s: T.tape1, font: monoFont(7.6, true), px: 7.6 }), blx, bly, POSTER_Z, 2.5));
    const [brx, bry] = posterW(W - 84, H - 7);
    this.group.add(placeTape(makeTape(158, 20, 4.7, { s: T.tape2, font: monoFont(7.4, true), px: 7.4 }), brx, bry, POSTER_Z, -2));
    // paper flecks thrown up by the landing (frozen with everything else)
    for (let i = 0; i < 16; i++) {
      const w = 1.2 + hash(i, 1) * 2.6, h = 0.5 + hash(i, 2) * 1.1;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMaterial({ size: [w, h], paper: i % 3 ? [0.93, 0.9, 0.85] : [1.0, 0.3, 0.6], seed: 200 + i, fiber: 0.4, side: THREE.DoubleSide }));
      m.castShadow = true;
      m.visible = false;
      this.flecks.push(m);
      this.group.add(m);
    }
    // the full stop sits a hair after DIAM (set at its starting width)
    const c = this.sheet.ink.ctxs.solid;
    c.font = anyFont(PL.px, 900, 72); c.letterSpacing = `${-0.01 * PL.px}px`;
    this.period = { x: PL.margin + textW(c, T.last) + 0.16 * PL.px + 15, y: PL.base[2] - 15 };
  }

  /** Poster-local → world (the sheet's surface height included). */
  toWorld(lx: number, ly: number, z = 0) { const [x, y] = posterW(lx, ly); return new THREE.Vector3(x, y, POSTER_Z + z); }

  update(ts: number) {
    const H1 = CUE.hook;
    // DIAM holds its breath while the stop trembles, then springs wide when it tears loose
    let diamW = 72;
    if (ts < H1.lepas) diamW = lerp(72, 62, clamp(ts / H1.lepas) ** 1.5);
    else diamW = 62 + (74 - 62) * springStep(ts - H1.lepas, 2.4, 0.3);
    const harAge = ts - cap('harusnya').t, tahanAge = ts - cap('tahan').t;
    const crater = ts < H1.lepas ? clamp(ts / H1.lepas) * 0.25 : 1;
    const st: PosterState = { diamW: Math.round(diamW), har: printKey(T.aside, harAge, 14), tahan: printKey(T.tahan[0]!, tahanAge, 36) + '|' + printKey(T.tahan[1]!, tahanAge - 0.17, 36), crater };
    drawPoster(this.sheet, st, harAge, tahanAge);
    (this.sheet.mat.uniforms as any).uCrater.value.set(this.period.x, H - this.period.y, crater);

    // flecks: ballistic from the landing in ripple time (so they hang still while time is held)
    for (let i = 0; i < this.flecks.length; i++) {
      const f = this.flecks[i]!, tauF = rippleTau(ts);
      const life = 1.9;
      if (tauF < 0 || tauF > life) { f.visible = false; continue; }
      const a = hash(i, 3) * Math.PI * 2, sp = 22 + hash(i, 4) * 50, vz = 45 + hash(i, 5) * 70, g = 90;
      const z = Math.max(0.3, vz * tauF - 0.5 * g * tauF * tauF);
      const w = this.toWorld(RS.x + Math.cos(a) * sp * tauF, RS.y + Math.sin(a) * sp * tauF, z);
      f.position.copy(w);
      f.rotation.set(tauF * (4 + hash(i, 6) * 9), tauF * (3 + hash(i, 7) * 7), a);
      f.visible = z > 0.31 || tauF < 0.9;
    }
    // ripple: move the vertices (and the tone modulation) only when τ changed
    const tau = rippleTau(ts);
    if (tau !== this.lastTau) {
      this.lastTau = tau;
      const pos = this.sheet.geo.attributes.position as THREE.BufferAttribute;
      const base = this.sheet.base, ah = this.aH.array as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i) + W / 2, ly = H / 2 - pos.getY(i);
        const hh = tau < 0 ? 0 : rippleH(lx, ly, tau);
        pos.setZ(i, base[i]! + hh);
        ah[i] = hh / RIP.A;
      }
      pos.needsUpdate = true;
      this.aH.needsUpdate = true;
      this.sheet.geo.computeVertexNormals();
    }
  }
}
