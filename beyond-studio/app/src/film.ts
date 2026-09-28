// The film: the world (stage/world.ts) with the chapters (scenes/), after fonts and images are loaded.
import type * as THREE from 'three';
import type { Film } from './engine/engine';
import type { Compositor } from './engine/gl';
import { World } from './stage/world';
import { loadFonts, loadImages } from './stage/type';
import { chapters } from './scenes';
import { assetList } from './scenes/assets';
import { DUR } from './cues';

class BeyondFilm implements Film {
  duration = DUR;
  world = new World();
  async init(renderer: THREE.WebGLRenderer, comp: Compositor) {
    await Promise.all([loadFonts(), loadImages(assetList)]);
    await this.world.init(renderer, comp, chapters);
  }
  render(t: number, out: THREE.WebGLRenderTarget) { return this.world.render(t, out); }
}

export const film = new BeyondFilm();
