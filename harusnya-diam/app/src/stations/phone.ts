// S4: a paper prototype of an app screen. Its UI is paper mechanics: a sliding toggle tab, a slider whose knob is
// the disc, a paper odometer, a raised button that presses, a toast that drops from a slot and tears off at its
// perforation. Every move has the micro-interaction curve a UI would use (spring, ease in-out, press).
import { T } from '../copy';
import * as THREE from 'three';
import { makeSheet, makeTape, placeTape, type Sheet } from '../paper/sheet';
import { paperMaterial } from '../paper/material';
import { Slip } from '../paper/slip';
import { anyFont, monoFont, handFont, textW } from '../fonts';
import { PHONE, rw, rh } from '../layout';
import { CUE } from '../cues';
import { clamp, lerp, ease, springStep } from '../engine/util';

const U = CUE.ui;
export const PW_ = rw(PHONE), PH_ = rh(PHONE); // 170 × 340
/** phone-local (x right, y down from the top-left) → world */
export const phoneW = (lx: number, ly: number): [number, number] => [PHONE.x0 + lx, PHONE.y1 - ly];
export const PHONE_Z = 1.6;

// the controls (phone-local)
export const TOG = { x0: 16, x1: 64, y: 82, h: 24 };
export const SLD = { x0: 32, x1: 138, y: 156 };
export const BTN = { x0: 18, x1: 152, y0: 248, y1: 300 };
export const TOAST = { w: 146, h: 46, y0: 22 };
/** where the torn toast comes to rest (world, flat on the board left of the phone's foot) and how long it takes */
export const TOAST_REST = { x: -498, y: -642, z: 0.35, rz: 1.12 };
export const TOAST_LAND = 0.6;

/** 0 → 1: the toggle switching off (spring), from the landing */
export const toggleK = (ts: number) => (ts < U.toggle ? 0 : clamp(springStep(ts - U.toggle, 3.2, 0.42), 0, 1.15));
/** 0 → 1: the slider travel, ease in-out (the disc is the knob) */
export const sliderK = (ts: number) => ease.inOutCubic(clamp((ts - U.slider) / (U.sliderEnd - U.slider)));
/** button press depth 0..1 */
export const pressK = (ts: number) => {
  if (ts < U.kirim) return 0;
  const a = ts - U.kirim;
  return a < 0.1 ? a / 0.1 : Math.max(0, 1 - springStep(a - 0.1, 3, 0.5));
};

function drawScreen(ink: Sheet['ink'], key: string, dim: number) {
  ink.draw(key, (k) => {
    const W = PW_, H = PH_;
    // the device: a black bezel line, the camera, a screen inset
    k.paint('solid', 'black', 0.92, (c) => {
      c.lineWidth = 3;
      const r = 22;
      c.beginPath(); c.roundRect(3, 3, W - 6, H - 6, r); c.stroke();
      c.beginPath(); c.roundRect(W / 2 - 18, 9, 36, 8, 4); c.fill();
      // the toast's slot, under the status bar
      c.lineWidth = 1.1; c.beginPath(); c.moveTo(W / 2 - TOAST.w / 2 - 2, TOAST.y0); c.lineTo(W / 2 + TOAST.w / 2 + 2, TOAST.y0); c.stroke();
      c.font = monoFont(7, true); c.textBaseline = 'alphabetic';
      c.fillText('09.41', 16, 18);
      c.lineWidth = 0.9; c.strokeRect(W - 34, 11, 16, 7); c.fillRect(W - 32, 13, 9, 3);
      c.font = anyFont(22, 880, 84);
      c.fillText(T.ui.title, 16, 60);
      // rows
      c.font = anyFont(11.5, 640, 92);
      c.fillText(T.ui.silent, TOG.x1 + 10, TOG.y + 4);
      c.fillText(T.ui.motion, 16, 128);
      c.lineWidth = 0.6;
      for (const y of [110, 214]) { c.beginPath(); c.moveTo(16, y); c.lineTo(W - 16, y); c.stroke(); }
      // toggle track outline
      c.lineWidth = 1.3;
      c.beginPath(); c.roundRect(TOG.x0, TOG.y - TOG.h / 2, TOG.x1 - TOG.x0, TOG.h, TOG.h / 2); c.stroke();
      // slider track + ticks
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(SLD.x0, SLD.y); c.lineTo(SLD.x1, SLD.y); c.stroke();
      c.lineWidth = 0.6;
      for (let i = 0; i <= 10; i++) { const x = lerp(SLD.x0, SLD.x1, i / 10); c.beginPath(); c.moveTo(x, SLD.y + 17); c.lineTo(x, SLD.y + (i % 5 ? 20 : 23)); c.stroke(); }
      c.font = monoFont(6.2); c.fillText('0', SLD.x0 - 2, SLD.y + 32); c.fillText('100', SLD.x1 - 7, SLD.y + 32);
      // counter window frame
      c.lineWidth = 1; c.strokeRect(W - 58, 114, 40, 24);
      // a list under the button area (context)
      c.font = anyFont(9.5, 560, 92);
      c.fillText(T.ui.last, 16, 232);
      c.font = monoFont(6.4); c.globalAlpha = 0.8;
      c.fillText(T.ui.foot, 16, 322);
    });
    k.paint('tone', 'blue', 0.16 * dim, (c) => { c.fillRect(9, 36, W - 18, 36); });
    // designer's pencil notes in the margins
    k.paint('solid', 'black', 0.5, (c) => {
      c.font = handFont(7.2);
      c.fillText('spring!', TOG.x1 + 44, TOG.y + 18);
      c.fillText('ease in-out', SLD.x0 + 28, SLD.y - 10);
      c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(SLD.x0 + 26, SLD.y - 13); c.quadraticCurveTo(SLD.x0 + 10, SLD.y - 16, SLD.x0 + 6, SLD.y - 6); c.stroke();
    });
  });
}

/** The counter: digits on a paper wheel behind the window; fast digits print wider. */
function drawCounter(ink: Sheet['ink'], v: number, speed: number) {
  const key = `${Math.round(v * 12) / 12}|${Math.round(speed)}`;
  ink.draw(key, (k) => {
    const w = 40, h = 24;
    const n = Math.floor(v), f = v - n;
    k.paint('solid', 'black', 0.95, (c) => {
      c.beginPath(); c.rect(0, 0, w, h); c.clip();
      const wd = 70 + clamp(speed / 90) * 70;
      c.font = anyFont(17, 820, wd);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(Math.min(100, n)), w / 2, h / 2 - f * h);
      if (n < 100) c.fillText(String(n + 1), w / 2, h / 2 + (1 - f) * h);
    });
  });
}

export class Phone {
  group = new THREE.Group();
  screen: Sheet;
  counter: Sheet;
  tab: THREE.Mesh;
  knob: THREE.Mesh;
  fill: THREE.Mesh;
  button: THREE.Group;
  riser!: THREE.Mesh;
  buttonTop: Sheet;
  toast: Sheet;
  toastStub: Sheet;
  slip: Slip;
  constructor() {
    // the card body: the prototype is cut from thick card
    this.screen = makeSheet(PW_, PH_, { res: 4, toneRes: 2, seed: 41, paper: [0.93, 0.915, 0.88], lift: [0, 0, 0, 0], seg: [4, 8] });
    const [cx, cy] = phoneW(PW_ / 2, PH_ / 2);
    this.screen.mesh.position.set(cx, cy, PHONE_Z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(PW_ - 1, PH_ - 1, PHONE_Z - 0.2), paperMaterial({ size: [PW_, 4], paper: [0.8, 0.78, 0.74], seed: 4.4, fiber: 1.5 }));
    body.position.set(cx, cy, (PHONE_Z - 0.2) / 2);
    body.castShadow = body.receiveShadow = true;
    this.group.add(body, this.screen.mesh);
    // counter window insert
    this.counter = makeSheet(40, 24, { res: 8, seed: 42, paper: [0.95, 0.94, 0.9], seg: [1, 1], castShadow: false });
    const [kx, ky] = phoneW(PW_ - 38, 126);
    this.counter.mesh.position.set(kx, ky, PHONE_Z + 0.05);
    this.group.add(this.counter.mesh);
    // toggle: pink tab (the "on" fill) + white knob; slider fill strip
    const pink = (w: number, h: number, seed: number) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMaterial({ size: [w, h], paper: [1.0, 0.13, 0.42], seed, fiber: 0.9 }));
    this.tab = pink(TOG.x1 - TOG.x0 - 4, TOG.h - 4, 43);
    this.fill = pink(1, 5, 44);
    const kn = new THREE.CylinderGeometry(9.5, 9.5, 1.4, 48); kn.rotateX(Math.PI / 2);
    this.knob = new THREE.Mesh(kn, paperMaterial({ size: [19, 19], paper: [0.95, 0.94, 0.91], seed: 45 }));
    for (const m of [this.tab, this.fill, this.knob]) { m.castShadow = true; m.receiveShadow = true; this.group.add(m); }
    // the raised button: a pink card on a 3 mm riser
    this.buttonTop = makeSheet(BTN.x1 - BTN.x0, BTN.y1 - BTN.y0, { res: 5, seed: 46, paper: [1.0, 0.22, 0.52], seg: [1, 1], misAmp: 0.4 });
    this.buttonTop.ink.draw('b', (k) => k.paint('solid', 'black', 0.95, (c) => {
      c.font = anyFont(22, 860, 96); c.textBaseline = 'middle';
      const s = T.ui.send; const w = textW(c, s);
      c.fillText(s, (BTN.x1 - BTN.x0) / 2 - w / 2 - 8, 27);
      c.lineWidth = 2.6; c.lineCap = 'round';
      const ax = (BTN.x1 - BTN.x0) / 2 + w / 2 + 2;
      c.beginPath(); c.moveTo(ax, 27); c.lineTo(ax + 14, 27); c.moveTo(ax + 8, 21); c.lineTo(ax + 14, 27); c.lineTo(ax + 8, 33); c.stroke();
    }));
    const riser = new THREE.Mesh(new THREE.BoxGeometry(BTN.x1 - BTN.x0 - 2, BTN.y1 - BTN.y0 - 2, 3), paperMaterial({ size: [134, 3], paper: [0.75, 0.2, 0.4], seed: 47 }));
    riser.castShadow = riser.receiveShadow = true;
    this.button = new THREE.Group();
    this.button.add(riser, this.buttonTop.mesh);
    riser.position.z = 1.5;
    this.riser = riser;
    this.buttonTop.mesh.position.z = 3.05;
    const [bx, by] = phoneW((BTN.x0 + BTN.x1) / 2, (BTN.y0 + BTN.y1) / 2);
    this.button.position.set(bx, by, PHONE_Z);
    this.group.add(this.button);
    // the toast and the stub of its perforated tab that stays in the slot
    this.toast = makeSheet(TOAST.w, TOAST.h, { res: 5, seed: 48, paper: [0.96, 0.95, 0.92], seg: [8, 4], misAmp: 0.4 });
    this.toast.ink.draw('t', (k) => {
      k.paint('solid', 'black', 0.94, (c) => {
        c.lineWidth = 1.2; c.beginPath(); c.roundRect(1.5, 6, TOAST.w - 3, TOAST.h - 7.5, 9); c.stroke();
        c.font = anyFont(11.5, 820, 90); c.textBaseline = 'alphabetic';
        c.fillText(T.ui.sent, 34, 24);
        c.font = anyFont(8.5, 520, 92);
        c.fillText(T.ui.sentSub, 34, 37);
        c.setLineDash([1.4, 1.6]); c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(TOAST.w / 2 - 14, 5); c.lineTo(TOAST.w / 2 + 14, 5); c.stroke();
      });
      k.paint('solid', 'pink', 0.95, (c) => { c.beginPath(); c.arc(20, 25, 8, 0, Math.PI * 2); c.fill(); });
      k.paint('solid', 'black', 0.95, (c) => { c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(16, 25.5); c.lineTo(19, 28.5); c.lineTo(24.5, 21.5); c.stroke(); });
    });
    // the toast lives under the top of the screen: only what has come out of the slot is visible
    const [, slotY] = phoneW(0, TOAST.y0);
    this.toast.mat.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), slotY)];
    this.toastStub = makeSheet(28, 6, { res: 6, seed: 49, paper: [0.96, 0.95, 0.92], seg: [1, 1], castShadow: false });
    this.group.add(this.toast.mesh, this.toastStub.mesh);
    this.group.add(placeTape(makeTape(160, 20, 9.1, { s: T.tape4, font: monoFont(7, true), px: 7 }), PHONE.x0 + 70, PHONE.y0 - 22, 0.2, 2));
    this.slip = new Slip('tombol', T.tombol, PHONE.x0 + 95, PHONE.y1 + 48, 300, 76, { px: 27, deg: 1.2 });
    this.group.add(this.slip.group);
  }

  /** World position of the toast's centre and its tilt, at paper time ts (null while hidden). */
  toastPose(ts: number) {
    if (ts < U.notif) return null;
    const a = ts - U.notif;
    // drops out of the slot with a spring, tears at `sobek`, then slides/flutters down the screen
    if (ts < U.sobek) {
      const k = springStep(a, 3.4, 0.38);
      const [x, y] = phoneW(PW_ / 2, lerp(TOAST.y0 - TOAST.h, TOAST.y0 + 18, k) + TOAST.h / 2);
      return { x, y, z: PHONE_Z + 2.9, rx: 0, rz: 0 };
    }
    const b = ts - U.sobek;
    const hit = U.gelinding - U.sobek;
    const fall = (bb: number) => {
      const u = bb / hit; // 1 at the hit
      const ly = TOAST.y0 + 18 + TOAST.h / 2 + (BTN.y0 - 14 - (TOAST.y0 + 18 + TOAST.h / 2)) * ease.inQuad(clamp(u));
      const [x, y] = phoneW(PW_ / 2 + Math.sin(u * 3.1) * 8, ly);
      return { x, y, z: PHONE_Z + 6 + 16 * Math.sin(clamp(u) * Math.PI), rx: 0.5 * Math.sin(u * 5.2), rz: 0.22 * Math.sin(u * 2.4) };
    };
    if (b <= hit) return fall(b);
    // after the hit: it flutters off to the left and settles flat on the board below the phone, then stays
    const h0 = fall(hit);
    const e = ease.inOutQuad(clamp((b - hit) / TOAST_LAND));
    const z = lerp(h0.z, TOAST_REST.z, e) + 14 * Math.sin(Math.PI * e);
    const rx = h0.rx * (1 - e) + 0.35 * Math.sin(Math.PI * e);
    // never below the surface: its lowest edge stays above the board
    const zSafe = Math.max(z, TOAST_REST.z + (TOAST.h / 2) * Math.abs(Math.sin(rx)));
    return { x: lerp(h0.x, TOAST_REST.x, e), y: lerp(h0.y, TOAST_REST.y, e), z: zSafe, rx, rz: lerp(h0.rz, TOAST_REST.rz, e) };
  }

  update(ts: number) {
    this.slip.update(ts);
    drawScreen(this.screen.ink, 's', 1);
    // toggle: on (tab full, knob right) → off
    const tk = toggleK(ts);
    const tw = TOG.x1 - TOG.x0 - 4;
    const on = 1 - clamp(tk);
    this.tab.visible = on > 0.02;
    this.tab.scale.x = Math.max(0.02, on);
    const [tx, ty] = phoneW(TOG.x0 + 2 + (tw * on) / 2, TOG.y);
    this.tab.position.set(tx, ty, PHONE_Z + 0.25);
    const kxl = lerp(TOG.x1 - 12, TOG.x0 + 12, tk);
    const [kx, ky] = phoneW(kxl, TOG.y);
    this.knob.position.set(kx, ky, PHONE_Z + 1.1);
    // slider fill follows the disc
    const sk = sliderK(ts);
    const fw = Math.max(0.01, (SLD.x1 - SLD.x0) * sk);
    this.fill.scale.x = fw;
    this.fill.visible = sk > 0.001;
    const [fx, fy] = phoneW(SLD.x0 + fw / 2, SLD.y);
    this.fill.position.set(fx, fy, PHONE_Z + 0.3);
    // counter: value and speed (units/s) from the slider
    const v = 100 * sk, v2 = 100 * sliderK(ts + 1 / 12);
    drawCounter(this.counter.ink, v, Math.abs(v2 - v) * 12);
    // button press
    const pk = pressK(ts);
    this.buttonTop.mesh.position.z = 3.05 - 2.3 * pk;
    this.riser.scale.z = (3 - 2.3 * pk) / 3;
    this.riser.position.z = (3 - 2.3 * pk) / 2;
    // toast
    const tp = this.toastPose(ts);
    this.toast.mesh.visible = !!tp;
    // (the part still inside the slot is clipped; it must not cast a shadow either)
    this.toast.mesh.castShadow = ts >= U.sobek;
    this.toastStub.mesh.visible = ts >= U.sobek;
    if (tp) {
      this.toast.mesh.position.set(tp.x, tp.y, tp.z);
      this.toast.mesh.rotation.set(tp.rx, 0, tp.rz);
    }
    const [sx, sy] = phoneW(PW_ / 2, TOAST.y0 + 16);
    this.toastStub.mesh.position.set(sx, sy, PHONE_Z + 0.4);
  }
}
