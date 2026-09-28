// The film: the chapters in order, each owning its window of time (cues.json › ch), the shared renderer,
// and the overlay (HUD, labels, captions) drawn last, crisp.
import type * as THREE from 'three';
import type { Film, PostOverrides } from './engine/engine';
import { Layer2D, clearRT, type Compositor } from './engine/gl';
import { loadFonts } from './type';
import { R3 } from './r3';
import { CH, DUR } from './cues';
import { drawHud, drawLabels, drawCaptions } from './hud';
import type { Chapter, Ctx } from './world';
import s1 from './chapters/s1-layar';
import s2 from './chapters/s2-chip';
import { board } from './sets/board';
import s3 from './chapters/s3-hujan';
import { city } from './sets/city';
import s4 from './chapters/s4-pantai';
import s5 from './chapters/s5-laut';
import s6 from './chapters/s6-server';
import { datacenter } from './sets/datacenter';
import s7 from './chapters/s7-orbit';
import { earth } from './sets/earth';
import s8 from './chapters/s8-pulang';
import s9 from './chapters/s9-foton';
import s10 from './chapters/s10-closing';

// type is paper (0.91 linear): threshold − knee stays above it so captions never bloom (no halos, STYLE.md)
const BASE_POST: PostOverrides = { bloomThreshold: 1.3, bloomKnee: 0.3, bloom: 0.7, bloomRadius: 0.8, halation: 0.1, grain: 0.05, vignette: 0.38, ca: 0.8 };

const ORDER: [keyof typeof CH, Chapter | null][] = [
  ['layar', s1], ['chip', s2], ['hujan', s3], ['pantai', s4], ['laut', s5],
  ['server', s6], ['orbit', s7], ['pulang', s8], ['foton', s9], ['closing', s10],
];

class SatuFrame implements Film {
  duration = DUR;
  overlay = new Layer2D();
  ctx!: Ctx;
  async init(renderer: THREE.WebGLRenderer, comp: Compositor) {
    await loadFonts();
    this.ctx = { renderer, comp, r3: new R3(renderer, comp), c: this.overlay.ctx, post: {} };
    board.init(this.ctx);
    city.init(this.ctx);
    datacenter.init(this.ctx);
    await earth.init();
    for (const [, ch] of ORDER) if (ch?.init) await ch.init(this.ctx);
  }
  render(t: number, out: THREE.WebGLRenderTarget) {
    const ctx = this.ctx;
    ctx.post = { ...BASE_POST };
    this.overlay.clear();
    clearRT(ctx.renderer, out, [0, 0, 0]);
    let owner: Chapter | null = null;
    for (const [id, ch] of ORDER) { const [a, b] = CH[id]; if (t >= a && (t < b || id === 'closing')) owner = ch; }
    if (owner) owner.render(t, ctx, out);
    ctx.post.bloomThreshold = Math.max(ctx.post.bloomThreshold ?? 1.3, 1.25);
    ctx.post.bloomKnee = Math.min(ctx.post.bloomKnee ?? 0.3, (ctx.post.bloomThreshold ?? 1.3) - 0.95);
    drawHud(ctx.c, t);
    drawLabels(ctx.c, t);
    drawCaptions(ctx.c, t);
    ctx.comp.draw(ctx.renderer, this.overlay.upload(), out, { mode: 'normal' });
    return ctx.post;
  }
}

export const film = new SatuFrame();
