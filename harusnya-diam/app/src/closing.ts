// S9 closing, brand kit (STYLE.md §1–2) on the legacy end-card layout (beyond-studio-legacy/site: #lock8, #pill,
// #wa8, #sub8): the ring draws from 9 o'clock, the arrow (the paper dart, flattening) flies in from the left with an
// ice-blue trail and locks into the gap on the beat (shockwave, small shake, pop), the lockup settles to the top as
// a horizontal lockup, then CTA, URL, WhatsApp, sub; the WhatsApp button is tapped on the beat; hold.
// 60 fps (not stop-motion). Crisp 2D on an sRGB layer; the trail and shockwave on an additive HDR layer (they are the
// only things that bloom — white type never does).
import { T } from './copy';
import * as THREE from 'three';
import { Layer2D, type Compositor } from './engine/gl';
import { CUE } from './cues';
import { clamp, lerp } from './engine/util';
import { itFont } from './fonts';
import KONTAK from '../../kontak.json' with { type: 'json' };

const C = CUE.closing;
// brand kit
const PAPER = '#F5F5F5', MUTE = 'rgba(245,245,245,0.58)', ICE = '#60A5FA', BLUE2 = '#2563EB', WA = '#25D366';
// motion tokens (MOTION-GUIDE §2)
function bez(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t, sy = (t: number) => ((ay * t + by) * t + cy) * t, dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-7) break; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } return sy(t); };
}
const eOut = bez(0.23, 1, 0.32, 1);
const eIO = bez(0.77, 0, 0.175, 1);
const eBack = (x: number, s = 1.5) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2));
const P = (t: number, t0: number, d: number) => clamp((t - t0) / d);

const ARROW = new Path2D('M200,172 L330,247 L200,327 L234,247 Z');
const WA_BUBBLE = new Path2D('M3.5 20.5l1.4-4.1A8.5 8.5 0 1 1 8 19.3z');
const WA_PHONE = new Path2D('M9.2 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.6 1.2 1.5 2.1 2.7 2.7l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-.6.3-1.6.4-3-.3-1.5-.7-3-2.2-3.7-3.7-.7-1.4-.6-2.4-.5-3.2z');
const TYPE = (() => { const out: number[] = []; let acc = 0; const j = [0, .06, .04, .07, .05, .05, .09, .04, .05, .06, .04, .05, .08, .05, .04, .06, .05]; for (let i = 0; i < 17; i++) { acc += j[i] ?? .05; out.push(acc); } return out; })();
const URL = 'beyondstudio.site';

// layout (1080 × 1920)
const BIG = { x: 540, y: 820, s: 1.32 };            // the logo while it assembles (logo units → px)
const LOCK_Y = 540, LOGO_PX = 96, GAP = 22, WM_PX = 58;
const CTA = { lines: T.cta, px: 88, y: [770, 872] };
const PILL = { y: 1000, h: 108 }, WAB = { y: 1140, h: 108 }, SUB_Y = 1322;

export class Closing {
  ui = new Layer2D();
  glow = new Layer2D(1080, 1920, 0.5);
  constructor(public comp: Compositor) {}

  /** Draw the end card at t (≥ C.cincin) over `out` (already black). Returns the shake offset. */
  render(renderer: THREE.WebGLRenderer, out: THREE.WebGLRenderTarget, t: number): [number, number] {
    const c = this.ui.ctx, g = this.glow.ctx;
    this.ui.clear();
    this.glow.clear();
    const lock = C.kunci;
    // ---------------- logo placement: big and centred, then settling into the horizontal lockup
    c.font = itFont(WM_PX, 700); c.letterSpacing = `${-0.045 * WM_PX}px`;
    const wmW = c.measureText('Beyond Studio').width;
    const lockW = LOGO_PX + GAP + wmW;
    const smallS = LOGO_PX / 304; // ring outer diameter 304 logo units = 96 px
    const settle = eIO(P(t, lock + 0.47, 0.62));
    const lx0 = 540 - lockW / 2 + LOGO_PX / 2;
    const S = lerp(BIG.s, smallS, settle);
    const cx = lerp(BIG.x, lx0, settle), cy = lerp(BIG.y, LOCK_Y, settle);
    // pop on the lock: kicked up 8 %, settles with one outBack overshoot (STYLE: once per element)
    const pop = t >= lock ? lerp(1.08, 1, eBack(P(t, lock, 0.34), 1.5)) : 1;
    const toPx = (ux: number, uy: number): [number, number] => [cx + (ux - 249) * S * pop, cy + (uy - 247) * S * pop];
    // soft spot behind the logo (the only light left on)
    const spot = c.createRadialGradient(cx, cy, 0, cx, cy, 520 * lerp(1, 0.55, settle));
    spot.addColorStop(0, 'rgba(40,52,78,0.35)'); spot.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = spot; c.fillRect(0, 0, 1080, 1920);

    // ---------------- the ring: two arcs from 9 o'clock, the gap on the right
    const d = eIO(P(t, C.cincin, 0.95));
    c.save();
    c.translate(...toPx(249, 247));
    c.scale(S * pop, S * pop);
    c.beginPath();
    c.rect(-1000, -1000, 2000, 2000);
    c.rect(300 - 249 + 200, 229 - 247, -200, 36); // the gap (reverse winding: evenodd hole)
    c.clip('evenodd');
    c.strokeStyle = PAPER; c.lineWidth = 34; c.lineCap = 'butt';
    if (d > 0.001) {
      c.beginPath(); c.arc(0, 0, 135, Math.PI, Math.PI + Math.PI * d, false); c.stroke();
      c.beginPath(); c.arc(0, 0, 135, Math.PI, Math.PI - Math.PI * d, true); c.stroke();
    }
    c.restore();

    // ---------------- the arrow: in from the left, a folded dart that flattens into the mark
    const fly = P(t, C.panah, lock - C.panah);
    if (t >= C.panah) {
      const k = eOut(fly);
      const ox = lerp(-1150, 0, k);            // logo units
      const crease = 1 - P(t, lock - 0.12, 0.3); // the fold line fades as it locks
      c.save();
      c.translate(...toPx(249 + ox, 247));
      c.scale(S * pop, S * pop);
      c.translate(-249, -247);
      c.fillStyle = PAPER;
      c.fill(ARROW);
      if (crease > 0) {
        // the folded dart: lower half a touch darker, and the crease
        c.save(); c.clip(ARROW);
        c.fillStyle = `rgba(0,0,0,${0.16 * crease})`; c.fillRect(190, 247, 150, 90);
        c.strokeStyle = `rgba(0,0,0,${0.3 * crease})`; c.lineWidth = 2.2;
        c.beginPath(); c.moveTo(234, 247); c.lineTo(330, 247); c.stroke();
        c.restore();
      }
      c.restore();
      // the trail (HDR, blooms): a tapered streak behind the arrow while it moves
      const speed = t < lock ? (1 - k) : 0;
      const trail = clamp(speed * 1.6) * (t < lock + 0.25 ? 1 : 0);
      if (trail > 0.01) {
        const [ax, ay] = toPx(249 + ox + 20, 247);
        const len = 900 * trail * S;
        const gr = g.createLinearGradient(ax - len, ay, ax, ay);
        gr.addColorStop(0, 'rgba(37,99,235,0)'); gr.addColorStop(0.7, 'rgba(59,130,246,0.45)'); gr.addColorStop(1, 'rgba(147,197,253,0.9)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(ax - len, ay - 3); g.lineTo(ax, ay - 40 * S); g.lineTo(ax, ay + 40 * S); g.lineTo(ax - len, ay + 3); g.closePath(); g.fill();
      }
    }
    // shockwave from the gap on the lock (HDR)
    if (t >= lock && t < lock + 0.7) {
      const u = P(t, lock, 0.7);
      const [gx, gy] = toPx(330, 247);
      g.strokeStyle = `rgba(96,165,250,${(1 - u) * 0.9})`;
      g.lineWidth = lerp(18, 2, u);
      g.beginPath(); g.arc(gx, gy, lerp(10, 360, eOut(u)), 0, Math.PI * 2); g.stroke();
    }
    // ---------------- wordmark: rises per letter beside the logo
    const wmT = lock + 0.62;
    if (t >= wmT) {
      const x0 = 540 - lockW / 2 + LOGO_PX + GAP;
      this.maskRise(c, 'Beyond Studio', x0, LOCK_Y + WM_PX * 0.36, WM_PX, t - wmT, 0.022, 0.72, 700, 700, PAPER, -0.045);
    }
    // ---------------- CTA: two lines rise, weight 260 → 790 (legacy)
    CTA.lines.forEach((ln, i) => {
      const a = t - (C.cta + i * 0.12);
      if (a < 0) return;
      const wt = lerp(260, 790, eOut(clamp(a / 1.0)));
      c.font = itFont(CTA.px, wt); c.letterSpacing = `${-0.045 * CTA.px}px`;
      const w = c.measureText(ln).width;
      this.maskRise(c, ln, 540 - w / 2, CTA.y[i]!, CTA.px, a, 0.024, 0.62, wt, wt, PAPER, -0.045);
    });
    // ---------------- URL pill (typed) with the go button
    if (t >= C.pill) this.pill(c, t);
    // ---------------- WhatsApp
    if (t >= C.wa) this.wa(c, t);
    // ---------------- sub
    if (t >= C.sub) {
      const s = T.sub;
      c.font = itFont(32, 450); c.letterSpacing = `${-0.01 * 32}px`;
      const w = c.measureText(s).width;
      this.maskRise(c, s, 540 - w / 2, SUB_Y, 32, t - C.sub, 0.012, 0.6, 450, 450, MUTE, -0.01);
    }
    this.comp.draw(renderer, this.ui.upload(), out, { mode: 'normal' });
    this.comp.draw(renderer, this.glow.upload(), out, { mode: 'add', tint: [2.6, 2.6, 2.6] });
    // a small shake on the lock
    if (t >= lock && t < lock + 0.35) {
      const u = t - lock, a = 7 * Math.exp(-u * 14);
      return [a * Math.sin(u * 83), a * 0.6 * Math.cos(u * 71)];
    }
    return [0, 0];
  }

  /** Text rising per letter from behind a mask line (outExpo), like the legacy .mask/.sp. */
  private maskRise(c: CanvasRenderingContext2D, s: string, x: number, y: number, px: number, age: number, stagger: number, dur: number, wt: number, _wt2: number, col: string, track: number) {
    c.save();
    c.font = itFont(px, wt); c.letterSpacing = `${track * px}px`;
    const w = c.measureText(s).width;
    c.beginPath(); c.rect(x - px * 0.3, y - px * 1.05, w + px * 0.6, px * 1.35); c.clip();
    c.fillStyle = col; c.textBaseline = 'alphabetic';
    for (let i = 0; i < s.length; i++) {
      const a = eOut(clamp((age - i * stagger) / dur));
      if (a <= 0) continue;
      const pre = i ? c.measureText(s.slice(0, i)).width : 0;
      c.fillText(s[i]!, x + pre, y + (1 - a) * px * 1.32);
    }
    c.restore();
  }

  private pill(c: CanvasRenderingContext2D, t: number) {
    c.font = itFont(50, 560); c.letterSpacing = `${-0.025 * 50}px`;
    const urlW = c.measureText(URL).width;
    const fullW = 44 + 30 + 18 + urlW + 4 + 14 + 94;
    const pk = eOut(P(t, C.pill + 0.05, 0.8));
    const pw = lerp(PILL.h, fullW, pk);
    const sc = lerp(0.7, 1, eBack(P(t, C.pill, 0.45), 1.4));
    const x = 540 - pw / 2, y = PILL.y;
    c.save();
    c.globalAlpha = clamp(P(t, C.pill, 0.14));
    c.translate(540, y + PILL.h / 2); c.scale(sc, sc); c.translate(-540, -(y + PILL.h / 2));
    c.beginPath(); c.roundRect(x, y, pw, PILL.h, PILL.h / 2);
    c.fillStyle = 'rgba(255,255,255,0.055)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.5; c.stroke();
    c.save(); c.clip();
    const inA = clamp(P(t, C.pill + 0.3, 0.2));
    c.globalAlpha *= inA;
    // globe
    const gx = x + 44 + 15, gy = y + PILL.h / 2;
    c.strokeStyle = 'rgba(245,245,245,0.45)'; c.lineWidth = 2.2;
    c.beginPath(); c.arc(gx, gy, 14, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(gx, gy, 6.5, 14, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(gx - 14, gy); c.lineTo(gx + 14, gy); c.stroke();
    // typed URL + caret
    const n = TYPE.filter((d) => t >= C.ketik + d).length;
    const typed = URL.slice(0, n);
    c.fillStyle = PAPER; c.font = itFont(50, 560); c.letterSpacing = `${-0.025 * 50}px`; c.textBaseline = 'middle';
    const tx = gx + 15 + 18;
    c.fillText(typed, tx, gy + 2);
    const done = C.ketik + TYPE[16]!;
    const blink = t < done + 0.1 ? 1 : Math.floor((t - done) / 0.5) % 2 === 0 ? 0 : 1;
    if (t > C.ketik - 0.05 && blink) { c.fillStyle = ICE; c.beginPath(); c.roundRect(tx + c.measureText(typed).width + 4, gy - 26, 4, 52, 2); c.fill(); }
    c.restore();
    // go button (pops at the right end)
    const gk = eBack(P(t, C.pill + 0.37, 0.5), 2.0);
    if (gk > 0) {
      const bx = x + pw - 14 - 40, by = y + PILL.h / 2;
      c.save(); c.translate(bx, by); c.scale(gk, gk);
      c.fillStyle = BLUE2; c.beginPath(); c.arc(0, 0, 40, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.scale(0.25, 0.25); c.translate(-265, -249); c.fill(ARROW);
      c.restore();
    }
    c.restore();
  }

  private wa(c: CanvasRenderingContext2D, t: number) {
    const num = (KONTAK as { tampil?: string }).tampil ?? '0819-2707-0239';
    c.font = itFont(44, 700); c.letterSpacing = `${-0.02 * 44}px`;
    const nw = c.measureText(num).width;
    const w = 14 + 80 + 20 + nw + 40;
    const x = 540 - w / 2, y = WAB.y;
    const k = eBack(P(t, C.wa, 0.5), 1.5);
    const dy = lerp(46, 0, eOut(P(t, C.wa, 0.55)));
    const press = 1 - 0.04 * (clamp(P(t, C.tap - 0.05, 0.06)) - clamp(P(t, C.tap + 0.03, 0.2)));
    c.save();
    c.globalAlpha = clamp(P(t, C.wa, 0.12));
    c.translate(540, y + WAB.h / 2 + dy); c.scale(lerp(0.82, 1, k) * press, lerp(0.82, 1, k) * press); c.translate(-540, -(y + WAB.h / 2));
    c.beginPath(); c.roundRect(x, y, w, WAB.h, WAB.h / 2);
    c.fillStyle = 'rgba(255,255,255,0.055)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.5; c.stroke();
    // icon
    const ix = x + 14 + 40, iy = y + WAB.h / 2;
    const ring = P(t, C.tap, 0.8);
    if (t >= C.tap) { c.strokeStyle = `rgba(37,211,102,${(1 - ring) * 0.45})`; c.lineWidth = lerp(0, 22, eOut(ring)); c.beginPath(); c.arc(ix, iy, 40 + c.lineWidth / 2, 0, Math.PI * 2); c.stroke(); }
    c.fillStyle = WA; c.beginPath(); c.arc(ix, iy, 40, 0, Math.PI * 2); c.fill();
    c.save(); c.translate(ix - 21, iy - 21); c.scale(42 / 24, 42 / 24);
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(WA_BUBBLE);
    c.fillStyle = '#fff'; c.fill(WA_PHONE);
    c.restore();
    // text
    c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(245,245,245,0.6)'; c.font = itFont(21, 550); c.letterSpacing = `${0.01 * 21}px`;
    c.fillText('WhatsApp', ix + 40 + 20, iy - 12);
    c.fillStyle = PAPER; c.font = itFont(44, 700); c.letterSpacing = `${-0.02 * 44}px`;
    c.fillText(num, ix + 40 + 20, iy + 30);
    c.restore();
  }
}
