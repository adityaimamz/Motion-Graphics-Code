// The film: one paper world rendered through the camera path; the closing (brand kit) in 2D over black.
// Everything is a pure function of t: the paper world reads paperT(t) (12 fps steps), the camera camT(t).
import type * as THREE from 'three';
import type { Film, PostOverrides } from './engine/engine';
import { clearRT, type Compositor } from './engine/gl';
import { hash, clamp } from './engine/util';
import { loadFonts } from './fonts';
import { R3 } from './r3';
import { DUR, CUE } from './cues';
import { paperT, camT, stepId, isStepped } from './step';
import { PaperWorld } from './world';
import { setLightPool } from './paper/material';
import { camAt, initCamera } from './camera';
import { Droste, diveZ, FW_H } from './stations/droste';
import { POSTER } from './layout';
import { Poster, rippleTau, rippleH, POSTER_Z } from './stations/poster';
import { Disc } from './stations/disc';
import { Hero, pencilTravel } from './hero';
import { Flipbook } from './stations/flipbook';
import { Phone } from './stations/phone';
import { Ruler, Pencil } from './stations/props';
import { Popup, loadBars } from './stations/popup';
import { Cards } from './stations/cards';
import { Banner, Notes, Storyboard } from './stations/banner';
import { PaperPlane, flightPose } from './stations/plane';
import { Closing } from './closing';
import { HOLE } from './layout';
import { T } from './copy';

// paper is ~0.85 linear at most: bloom stays off in the paper world (no halos on type)
const BASE_POST: PostOverrides = { bloomThreshold: 2.5, bloomKnee: 0.2, bloom: 0.0, halation: 0.0, grain: 0.042, vignette: 0.32, ca: 0.35 };
// the closing: only the HDR trail/shockwave (> 1.2) blooms; white type (0.91) never does
const CLOSING_POST: PostOverrides = { bloomThreshold: 1.25, bloomKnee: 0.2, bloom: 0.9, bloomRadius: 0.8, halation: 0.0, grain: 0.03, vignette: 0.3, ca: 0.3 };

/** The designer's pencil notes on the board (world positions). */
const N = T.notes;
const NOTES = [
  { x: -530, y: -928, s: N.plan, px: 14, deg: -1 },
  { x: 212, y: 500, s: N.beat, px: 13, deg: -1 },
  { x: 212, y: 470, s: N.hero, px: 14, deg: -2 },
  { x: -52, y: 405, s: N.tear[0]!, px: 13, deg: 2 },
  { x: -52, y: 382, s: N.tear[1]!, px: 13, deg: 2 },
  { x: -52, y: 359, s: N.tear[2]!, px: 13, deg: 2 },
  { x: -52, y: 190, s: N.ripple[0]!, px: 13, deg: -2 },
  { x: -52, y: 166, s: N.ripple[1]!, px: 13, deg: -2 },
  { x: -52, y: 142, s: N.ripple[2]!, px: 13, deg: -2 },
  { x: 205, y: -300, s: N.pages, px: 13, deg: 1.5 },
  { x: -228, y: -300, s: N.spring, px: 13, deg: -2 },
  { x: -228, y: -390, s: N.ease, px: 13, deg: 1 },
  { x: 345, y: -600, s: N.bars[0]!, px: 13, deg: -4 },
  { x: 345, y: -622, s: N.bars[1]!, px: 13, deg: -4 },
  { x: -300, y: -884, s: N.cards, px: 13, deg: 2 },
  { x: 292, y: -845, s: N.folds, px: 13, deg: -2 },
  { x: 330, y: -760, s: N.hole, px: 14, deg: 6 },
];
const ARROWS = [
  { x0: 400, y0: -745, x1: 437, y1: -700 },
  { x0: 288, y0: -852, x1: 250, y1: -880 },
];

const DIVE3D = typeof location !== 'undefined' && new URLSearchParams(location.search).has('dive3d');

class HarusnyaDiam implements Film {
  duration = DUR;
  r3!: R3;
  world!: PaperWorld;
  poster!: Poster;
  disc!: Disc;
  hero!: Hero;
  droste!: Droste;
  flip!: Flipbook;
  phone!: Phone;
  ruler!: Ruler;
  pencil!: Pencil;
  popup!: Popup;
  cards!: Cards;
  banner!: Banner;
  plane!: PaperPlane;
  notes!: Notes;
  closing!: Closing;
  renderer!: THREE.WebGLRenderer;
  async init(renderer: THREE.WebGLRenderer, comp: Compositor) {
    await loadFonts();
    this.renderer = renderer;
    this.r3 = new R3(renderer, comp);
    this.world = new PaperWorld(renderer);
    this.poster = new Poster();
    this.world.scene.add(this.poster.group);
    this.disc = new Disc();
    this.world.scene.add(this.disc.mesh);
    this.flip = new Flipbook();
    this.world.scene.add(this.flip.group);
    this.phone = new Phone();
    this.ruler = new Ruler();
    this.pencil = new Pencil();
    this.world.scene.add(this.phone.group, this.ruler.group, this.pencil.group);
    await loadBars();
    this.popup = new Popup();
    this.cards = new Cards();
    this.world.scene.add(this.popup.group, this.cards.group);
    this.hero = new Hero(this.disc, this.poster, this.flip, this.popup);
    this.banner = new Banner();
    this.plane = new PaperPlane();
    this.world.scene.add(this.banner.group, this.plane.group, this.plane.fixed, new Storyboard(262, 262).group);
    // the pencil planning: the disc's real path, sampled from the hero itself
    const path: [number, number][] = [];
    for (let ts = 0; ts < CUE.gerak.g + 0.01; ts += 1 / 30) {
      this.popup.update(ts); this.flip.update(ts);
      this.hero.update(ts);
      if (this.disc.mesh.visible) path.push([this.disc.mesh.position.x, this.disc.mesh.position.y]);
    }
    this.notes = new Notes(path, NOTES, ARROWS);
    this.world.scene.add(this.notes.mesh);
    this.closing = new Closing(comp);
    this.droste = new Droste(this.poster, this.world.sun, this.world.sky);
    const T = this.droste.target;
    const Hp = POSTER.y1 - POSTER.y0;
    const tz = POSTER_Z + rippleH(T.x, Hp - T.y, rippleTau(5.0));
    initCamera({ dive: { x: POSTER.x0 + T.x, y: POSTER.y0 + T.y, z: tz }, fwHandoff: FW_H });
  }
  stepped(t: number) { return isStepped(t); }
  frameKey(t: number) { return isStepped(t) ? `s${stepId(t)}` : null; }
  render(t: number, out: THREE.WebGLRenderTarget) {
    const ts = paperT(t);
    const post: PostOverrides = { ...BASE_POST };
    this.poster.update(ts);
    this.flip.update(ts);
    this.phone.update(ts);
    this.popup.update(ts);
    this.cards.update(ts);
    this.pencil.roll(pencilTravel(ts));
    this.hero.update(ts);
    this.plane.update(ts, flightPose(t));
    const K = CUE.kosong;
    // the tear opens as the nose meets the board
    this.world.hole(HOLE.x, HOLE.y, t < K.tembus ? 0 : 6 + 150 * (1 - Math.exp(-(t - K.tembus) * 5)));
    const tc = camT(t);
    // (?dive3d: debug, the 3D camera through the dive, to compare the hand-off)
    const z = DIVE3D ? null : diveZ(tc);
    clearRT(this.renderer, out, [0, 0, 0]);
    if (t >= CUE.closing.cincin) {
      // the end card (brand kit), on black, 60 fps
      const sh = this.closing.render(this.renderer, out, t);
      return { ...CLOSING_POST, shake: sh };
    } else if (t >= K.sunyi) {
      return { ...BASE_POST };
    } else if (z !== null) {
      this.droste.render(this.renderer, out, z, rippleTau(ts));
    } else {
      const dm = this.disc.mesh;
      const cam = camAt(tc, dm.visible ? { x: dm.position.x, y: dm.position.y, z: dm.position.z } : null);
      setLightPool(cam.look.x, cam.look.y, cam.pos.distanceTo(cam.look));
      // the bounce card stands in front of the pop-up while the camera looks at it from low
      const bk = clamp((tc - (CUE.pop.buka - 0.3)) / 0.6) * (1 - clamp((tc - (CUE.pop.lontar + 0.5)) / 0.6));
      this.world.fitLight(cam, 2.4 * bk);
      this.r3.scene(this.world.scene, cam, out, [0.02, 0.018, 0.016]);
    }
    // stop-motion: the exposure breathes a little per step, and the grain is held per step
    post.exposure = 1 + (hash(stepId(t), 77) * 2 - 1) * 0.006;
    post.grainT = ts;
    return post;
  }
}

export const film = new HarusnyaDiam();
