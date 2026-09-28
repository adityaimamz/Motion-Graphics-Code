// The chapter contract and the per-frame context. Every chapter owns a window of film time; it renders its
// world(s) as HDR linear colour into `out` (hand-offs between worlds happen inside chapters), may draw
// extra 2D into the overlay and may override post. Everything is a pure function of t.
import type * as THREE from 'three';
import type { PostOverrides } from './engine/engine';
import type { Compositor } from './engine/gl';
import type { R3 } from './r3';

export interface Ctx {
  renderer: THREE.WebGLRenderer;
  comp: Compositor;
  r3: R3;
  /** the overlay (crisp 2D, drawn after the world, never blurred by DOF) */
  c: CanvasRenderingContext2D;
  post: PostOverrides;
}

export interface Chapter {
  id: string;
  init?(ctx: Ctx): void | Promise<void>;
  render(t: number, ctx: Ctx, out: THREE.WebGLRenderTarget): void;
}
