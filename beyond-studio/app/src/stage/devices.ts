// Devices on the studio floor: laptop, phone, floating browser windows and UI cards. Every screen is a
// Canvas2D texture redrawn per frame (real client screenshots + live UI + the cursor), shown through a
// shader with rounded corners and a glass sheen. Sizes in world units (1 unit ≈ 100 px of the old film).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SCREEN_FRAG = /* glsl */ `
uniform sampler2D map; uniform vec2 size; uniform float radius; uniform float bright; uniform float sheen; uniform float dim; uniform vec2 uvScale;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 p = (vUv - 0.5) * size;
  float d = sdRound(p, size * 0.5, radius);
  float fw = fwidth(d);
  float a = 1.0 - smoothstep(-fw, fw, d);
  if (a < 0.01) discard;
  // uvScale < 1: show only the canvas's top-left part (a screen whose size morphs)
  vec4 tx = texture2D(map, vec2(vUv.x * uvScale.x, 1.0 - (1.0 - vUv.y) * uvScale.y));
  vec3 c = tx.rgb * bright * (1.0 - dim);
  // glass sheen: a soft diagonal band sweeping across (sheen = band centre, -0.5 → 1.5)
  float s = (vUv.x * 0.8 + (1.0 - vUv.y) * 0.45) - sheen;
  c += vec3(0.16) * exp(-s * s * 90.0) * step(-0.4, sheen) * step(sheen, 1.4);
  gl_FragColor = vec4(c, a * tx.a);
}`;

/** A rectangular screen: `w`×`h` world units, drawn from a `cw`×`ch` px canvas. */
export class Screen {
  canvas = document.createElement('canvas');
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  mat: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
  constructor(public w: number, public h: number, public cw: number, public ch: number, radius = 0.1, public pxScale = 1) {
    this.canvas.width = Math.round(cw * pxScale);
    this.canvas.height = Math.round(ch * pxScale);
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERT, fragmentShader: SCREEN_FRAG, transparent: true, depthWrite: true,
      uniforms: { map: { value: this.tex }, size: { value: new THREE.Vector2(w, h) }, radius: { value: radius }, bright: { value: 0.92 }, sheen: { value: -1 }, dim: { value: 0 }, uvScale: { value: new THREE.Vector2(1, 1) } },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
  }
  /** Draw in canvas px (origin top-left); the texture is re-uploaded. */
  draw(fn: (c: CanvasRenderingContext2D) => void) {
    const c = this.ctx;
    c.setTransform(this.pxScale, 0, 0, this.pxScale, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, this.canvas.width / this.pxScale, this.canvas.height / this.pxScale);
    fn(c);
    this.tex.needsUpdate = true;
  }
  set sheen(v: number) { this.mat.uniforms.sheen!.value = v; }
  set dim(v: number) { this.mat.uniforms.dim!.value = v; }
  /** World position of canvas point (px, py). */
  point(px: number, py: number, out = new THREE.Vector3()) {
    this.mesh.updateWorldMatrix(true, false);
    return out.set((px / this.cw - 0.5) * this.w, (0.5 - py / this.ch) * this.h, 0.004).applyMatrix4(this.mesh.matrixWorld);
  }
  /** World-space screen axes: right, up, normal. */
  axes() {
    this.mesh.updateWorldMatrix(true, false);
    const e = this.mesh.matrixWorld.elements;
    return { right: new THREE.Vector3(e[0], e[1], e[2]).normalize(), up: new THREE.Vector3(e[4], e[5], e[6]).normalize(), normal: new THREE.Vector3(e[8], e[9], e[10]).normalize() };
  }
  /** World units per canvas px. */
  get unit() { return this.w / this.cw; }
}

const metal = (hex: number, rough = 0.32, metalness = 0.85) => new THREE.MeshStandardMaterial({ color: hex, metalness, roughness: rough, envMapIntensity: 1.1 });

/** A laptop: lid (tilted back) with the screen, keyboard deck on the floor. Origin = centre of the deck's front edge on the floor. */
export class Laptop {
  group = new THREE.Group();
  lid = new THREE.Group();
  screen: Screen;
  constructor(cw = 1240, ch = 776) {
    const LW = 9.4, LH = 6.04, T = 0.12;
    const lidBody = new THREE.Mesh(new RoundedBoxGeometry(LW, LH, T, 4, 0.16), metal(0x0e0e11, 0.4, 0.6));
    lidBody.position.set(0, LH / 2, -T / 2);
    this.screen = new Screen(9.08, 5.68, cw, ch, 0.07, 1);
    this.screen.mesh.position.set(0, LH / 2 + 0.03, 0.002);
    this.lid.add(lidBody, this.screen.mesh);
    const deck = new THREE.Mesh(new RoundedBoxGeometry(10.8, 0.24, 6.6, 4, 0.1), metal(0x2c2c33, 0.3, 0.9));
    deck.position.set(0, 0.12, -3.3);
    const keys = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.02, 3.0), new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.7 }));
    keys.position.set(0, 0.245, -4.3);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.01, 1.9), metal(0x34343c, 0.25, 0.9));
    pad.position.set(0, 0.245, -1.35);
    this.lid.position.set(0, 0.24, -6.55);
    this.lid.rotation.x = -0.2;
    this.group.add(deck, keys, pad, this.lid);
  }
}

/** A phone standing on its bottom edge. Origin = bottom centre on the floor. */
export class Phone {
  group = new THREE.Group();
  body: THREE.Mesh;
  screen: Screen;
  constructor(cw = 390, ch = 842) {
    const PW = 3.0, PH = 6.22, T = 0.32;
    this.body = new THREE.Mesh(new RoundedBoxGeometry(PW, PH, T, 6, 0.5), metal(0x121216, 0.28, 0.9));
    this.body.position.set(0, PH / 2, 0);
    this.screen = new Screen(2.78, 6.0, cw, ch, 0.43, 2);
    this.screen.mesh.position.set(0, PH / 2, T / 2 + 0.003);
    this.group.add(this.body, this.screen.mesh);
  }
}

/** A floating panel (browser window, UI card): a thin dark slab with a screen on its front. Origin = centre. */
export class Panel {
  group = new THREE.Group();
  screen: Screen;
  body: THREE.Mesh;
  constructor(public w: number, public h: number, cw: number, ch: number, radius = 0.16, pxScale = 2, depth = 0.08) {
    this.body = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth, 4, Math.min(radius, depth / 2)), metal(0x131318, 0.45, 0.4));
    this.body.position.z = -depth / 2;
    this.screen = new Screen(w, h, cw, ch, radius, pxScale);
    this.screen.mesh.position.z = 0.002;
    this.group.add(this.body, this.screen.mesh);
  }
}

// ---------------------------------------------------------------- canvas UI helpers shared by the sets

/** The brand arrow as the cursor (the old ARROW_D rotated −120°), tip at (x, y). `s` = px per SVG unit. */
export function drawCursor(c: CanvasRenderingContext2D, x: number, y: number, s: number, press = 0) {
  c.save();
  c.translate(x, y);
  c.rotate((-120 * Math.PI) / 180);
  c.scale(s * (1 - 0.16 * press), s * (1 - 0.16 * press));
  c.beginPath();
  c.moveTo(-130, -75); c.lineTo(0, 0); c.lineTo(-130, 80); c.lineTo(-96, 0); c.closePath();
  c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 4 / s * s * 4; c.shadowOffsetY = 3.5;
  c.fillStyle = '#F8FAFC'; c.fill();
  c.shadowColor = 'transparent';
  c.lineWidth = 2.4 / 0.27; c.strokeStyle = '#0B0B10'; c.lineJoin = 'round'; c.stroke();
  c.restore();
}

/** A click ripple at (x, y): p = 0..1 over ~0.5 s. */
export function drawRipple(c: CanvasRenderingContext2D, x: number, y: number, p: number, color = 'rgba(255,255,255,0.6)', r0 = 20) {
  if (p <= 0 || p >= 1) return;
  const e = 1 - Math.pow(1 - p, 3);
  c.save();
  c.globalAlpha = (1 - p) * 0.85;
  c.beginPath(); c.arc(x, y, r0 * (0.2 + 2.2 * e), 0, Math.PI * 2);
  c.fillStyle = color; c.fill();
  c.restore();
}

/** A Lucide icon (preloaded image) tinted to `color`, centred at (x, y), `size` px. */
const tinted = new Map<string, HTMLCanvasElement>();
export function drawIcon(c: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, size: number, color: string) {
  const key = `${im.src}|${color}|${Math.round(size * 2)}`;
  let cv = tinted.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = Math.round(size * 2);
    const x2 = cv.getContext('2d')!;
    x2.drawImage(im, 0, 0, cv.width, cv.height);
    x2.globalCompositeOperation = 'source-in';
    x2.fillStyle = color;
    x2.fillRect(0, 0, cv.width, cv.height);
    tinted.set(key, cv);
  }
  c.drawImage(cv, x - size / 2, y - size / 2, size, size);
}

/** Greedy word wrap: the lines of `text` at most `maxW` wide with the current font. */
export function wrap(c: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const tryL = line ? `${line} ${w}` : w;
    if (c.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL;
  }
  if (line) out.push(line);
  return out;
}
