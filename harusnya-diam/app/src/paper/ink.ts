// Ink canvases: what a print *says*, as densities per ink. Three Canvas2D surfaces per print, each opaque
// black, drawn additively ('lighter') in pure channel colours so one canvas carries three inks:
//   tone  RGB = pink, blue, yellow densities to be halftoned
//   solid RGB = pink, blue, yellow flat ink (type, rules)
//   k     R = black tone, G = black solid
// Drawing happens in sheet units (origin top-left, y down); `res` texels per unit. A print redraws only when
// its content key changes (a pure function of the key), so a stepped frame costs nothing.
import * as THREE from 'three';
import type { Ink } from '../palette';
import type { InkTextures } from './material';

export type Role = 'tone' | 'solid';

const CH_RGB = ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)'];

export class InkCanvas implements InkTextures {
  canvases: Record<'tone' | 'solid' | 'k', HTMLCanvasElement>;
  ctxs: Record<'tone' | 'solid' | 'k', CanvasRenderingContext2D>;
  tone: THREE.CanvasTexture;
  solid: THREE.CanvasTexture;
  k: THREE.CanvasTexture;
  key = '\u0000';
  constructor(public w: number, public h: number, public res = 3, toneRes = res) {
    const mk = (r: number) => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * r));
      c.height = Math.max(1, Math.round(h * r));
      return c;
    };
    this.canvases = { tone: mk(toneRes), solid: mk(res), k: mk(res) };
    this.ctxs = {
      tone: this.canvases.tone.getContext('2d')!,
      solid: this.canvases.solid.getContext('2d')!,
      k: this.canvases.k.getContext('2d')!,
    };
    const tex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.NoColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 8;
      t.flipY = true;
      return t;
    };
    this.tone = tex(this.canvases.tone);
    this.solid = tex(this.canvases.solid);
    this.k = tex(this.canvases.k);
    this.clear();
  }

  private clear() {
    for (const k of ['tone', 'solid', 'k'] as const) {
      const c = this.ctxs[k], cv = this.canvases[k];
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.filter = 'none';
      c.fillStyle = '#000';
      c.fillRect(0, 0, cv.width, cv.height);
    }
  }

  /**
   * Draw with one ink: `fn` gets a context in sheet units whose fillStyle/strokeStyle are the ink's channel at
   * `density` (0..1); it should not change the colours (it may change globalAlpha, lineWidth, font …).
   */
  paint(role: Role, ink: Ink, density: number, fn: (c: CanvasRenderingContext2D) => void) {
    let c: CanvasRenderingContext2D, col: string, sx: number;
    if (ink === 'black') {
      c = this.ctxs.k;
      sx = this.canvases.k.width / this.w;
      const v = Math.round(255 * Math.max(0, Math.min(1, density)));
      col = role === 'tone' ? `rgb(${v},0,0)` : `rgb(0,${v},0)`;
    } else {
      const key = role === 'tone' ? 'tone' : 'solid';
      c = this.ctxs[key];
      sx = this.canvases[key].width / this.w;
      const i = ink === 'pink' ? 0 : ink === 'blue' ? 1 : 2;
      const v = Math.round(255 * Math.max(0, Math.min(1, density)));
      col = CH_RGB[i]!.replace(/255/, String(v));
    }
    c.save();
    c.setTransform(sx, 0, 0, sx, 0, 0);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = col;
    c.strokeStyle = col;
    fn(c);
    c.restore();
  }

  /** Raw access for per-pixel tone images (e.g. gradients): draws into the tone canvas of one ink channel. */
  toneCtx(ink: Exclude<Ink, 'black'>) {
    const c = this.ctxs.tone;
    return { c, sx: this.canvases.tone.width / this.w, channel: ink === 'pink' ? 0 : ink === 'blue' ? 1 : 2 };
  }

  /** Redraw when `key` changed; returns true if it drew. */
  draw(key: string, fn: (ink: this) => void) {
    if (key === this.key) return false;
    this.key = key;
    this.clear();
    fn(this);
    this.tone.needsUpdate = true;
    this.solid.needsUpdate = true;
    this.k.needsUpdate = true;
    return true;
  }
}
