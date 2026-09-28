// The world: one continuous three.js world. Each chapter module positions its own objects, may own the
// camera and the brand arrow for its time window, and draws 2D type into the overlay (crisp, never
// blurred by depth of field). Everything is a pure function of t.
import * as THREE from 'three';
import type { Film, PostOverrides } from '../engine/engine';
import { Layer2D, W, H, type Compositor } from '../engine/gl';
import { Studio } from './studio';
import { arrowGeometry, glowSprite, paperMaterial, Trail } from './logo';

/** A camera: looking at `look` from `dist` away, yaw/pitch in degrees, vertical fov in degrees. */
export interface Shot { look: THREE.Vector3; dist: number; yaw: number; pitch: number; fov: number; roll?: number; focus?: number; ap?: number }

/** The brand arrow: tip at `pos`, pointing along `dir`, flat side facing `face`; `scale` = world units per SVG px. */
export interface ArrowPose { pos: THREE.Vector3; dir: THREE.Vector3; face?: THREE.Vector3; scale: number; trail: number; glow: number; bank?: number }

export interface FrameOut { post: PostOverrides; c: CanvasRenderingContext2D }

export interface Chapter {
  init(w: World): void | Promise<void>;
  /** Pose objects (hide them when out of window), draw 2D, add post overrides. Called every frame. */
  update(t: number, w: World, f: FrameOut): void;
  /** The camera, when this chapter owns time t. */
  shot?(t: number): Shot | null;
  /** The brand arrow, when this chapter owns it at time t. */
  arrow?(t: number): ArrowPose | null;
}

export const mixShot = (a: Shot, b: Shot, k: number): Shot => ({
  look: a.look.clone().lerp(b.look, k),
  dist: a.dist + (b.dist - a.dist) * k,
  yaw: a.yaw + (b.yaw - a.yaw) * k,
  pitch: a.pitch + (b.pitch - a.pitch) * k,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * k,
  focus: (a.focus ?? a.dist) + ((b.focus ?? b.dist) - (a.focus ?? a.dist)) * k,
  ap: (a.ap ?? 0) + ((b.ap ?? 0) - (a.ap ?? 0)) * k,
});

const BASE_POST: PostOverrides = { bloomThreshold: 1.25, bloomKnee: 0.4, bloom: 0.7, bloomRadius: 0.8, halation: 0.12, grain: 0.05, vignette: 0.42, ca: 0.7 };

export class World {
  studio = new Studio();
  renderer!: THREE.WebGLRenderer;
  comp!: Compositor;
  overlay = new Layer2D();
  arrowGroup = new THREE.Group();
  arrowMesh = new THREE.Mesh(arrowGeometry(), paperMaterial());
  private glow = glowSprite();
  private trail = new Trail(30);
  chapters: Chapter[] = [];
  get scene() { return this.studio.scene; }
  get cam() { return this.studio.cam; }

  /** Screen position (logical px) of a world point, and px per world unit at its depth. */
  project(p: THREE.Vector3) {
    const v = p.clone().project(this.cam);
    const d = this.cam.position.distanceTo(p);
    const k = H / (2 * d * Math.tan(THREE.MathUtils.degToRad(this.cam.fov) / 2));
    return { x: (v.x * 0.5 + 0.5) * W, y: (0.5 - v.y * 0.5) * H, k, behind: v.z > 1 };
  }

  applyShot(s: Shot) {
    const y = THREE.MathUtils.degToRad(s.yaw), p = THREE.MathUtils.degToRad(s.pitch);
    const c = this.cam;
    c.fov = s.fov;
    c.position.set(s.look.x + s.dist * Math.sin(y) * Math.cos(p), s.look.y + s.dist * Math.sin(p), s.look.z + s.dist * Math.cos(y) * Math.cos(p));
    c.up.set(0, 1, 0);
    c.lookAt(s.look);
    if (s.roll) c.rotateZ(THREE.MathUtils.degToRad(s.roll));
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
  }

  arrowAt(t: number): ArrowPose | null {
    for (const ch of this.chapters) { const a = ch.arrow?.(t); if (a) return a; }
    return null;
  }

  private poseArrow(t: number) {
    const a = this.arrowAt(t);
    this.arrowGroup.visible = !!a;
    if (!a) { this.trail.set([new THREE.Vector3()], 0, 0, this.cam); this.glow.visible = false; return; }
    const dir = a.dir.clone().normalize();
    const face = (a.face ?? this.cam.position.clone().sub(a.pos)).clone();
    const up = face.clone().cross(dir).normalize();          // arrow's local +y
    const z = dir.clone().cross(up).normalize();
    const m = new THREE.Matrix4().makeBasis(dir, up, z);
    this.arrowMesh.quaternion.setFromRotationMatrix(m);
    if (a.bank) this.arrowMesh.rotateX(a.bank);
    this.arrowMesh.position.copy(a.pos);
    this.arrowMesh.scale.setScalar(a.scale);
    // trail: the arrow's own recent path (a pure function of t, so sampling it is deterministic)
    if (a.trail > 0.001) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 30; i++) {
        const b = this.arrowAt(t - i * 0.011);
        pts.push(b ? b.pos.clone().addScaledVector(b.dir.clone().normalize(), -60 * b.scale) : pts[pts.length - 1] ?? a.pos.clone());
      }
      this.trail.set(pts, 24 * a.scale, a.trail, this.cam);
    } else this.trail.set([a.pos], 0, 0, this.cam);
    this.glow.visible = a.glow > 0.001;
    this.glow.position.copy(a.pos).addScaledVector(dir, -55 * a.scale);
    this.glow.scale.setScalar(210 * a.scale);
    (this.glow.material as THREE.SpriteMaterial).opacity = 0.7 * a.glow;
  }

  async init(renderer: THREE.WebGLRenderer, comp: Compositor, chapters: Chapter[]) {
    this.renderer = renderer;
    this.comp = comp;
    this.chapters = chapters;
    this.studio.init(renderer);
    this.arrowGroup.add(this.arrowMesh);
    this.scene.add(this.arrowGroup, this.glow, this.trail.mesh);
    for (const ch of chapters) await ch.init(this);
  }

  render(t: number, out: THREE.WebGLRenderTarget): PostOverrides {
    const f: FrameOut = { post: { ...BASE_POST }, c: this.overlay.ctx };
    this.overlay.clear();
    let shot: Shot | null = null;
    for (const ch of this.chapters) { shot = ch.shot?.(t) ?? null; if (shot) break; }
    if (shot) this.applyShot(shot);
    for (const ch of this.chapters) ch.update(t, this, f);
    this.poseArrow(t);
    this.studio.render(this.renderer, this.comp, out, shot?.focus ?? shot?.dist ?? 10, shot?.ap ?? 0);
    this.comp.draw(this.renderer, this.overlay.upload(), out, { mode: 'normal' });
    return f.post;
  }
}
