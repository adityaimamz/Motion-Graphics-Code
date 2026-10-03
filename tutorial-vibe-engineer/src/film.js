// film.js — composes one frame from t: background, scenes, the shared prompt dock and cursor, HUD, iris, closing,
// grain. Everything is written from t; nothing depends on the previous frame.
import { el, st, initFilters, show } from './dom.js';
import { hash, clamp, ease, fidx } from './core.js';
import { S, SCENE_IDS, DURATION, MARKERS, CHAPTERS } from './timeline.js';
import { Background } from './ui/background.js';
import { Hud } from './ui/hud.js';
import { Dock } from './ui/prompt.js';
import { Cursor } from './ui/cursor.js';
import { placeholder } from './scenes/placeholder.js';
import s01 from './scenes/s01-komentar.js';
import s02 from './scenes/s02-kode.js';
import s12 from './scenes/s12-closing.js';

export { DURATION, MARKERS };
const SCENES = [s01, s02, ...['urutan', 'siapkan', 'aturan', 'naskah', 'storyboard', 'kunci', 'suara', 'cek', 'lima'].map(placeholder), s12];

let L, bg, hud, dock, cursor;

export function init() {
  const $ = (id) => document.getElementById(id);
  L = { stage: $('stage'), light: $('light'), bgEl: $('bg'), world: $('world'), hudEl: $('hud'), top: $('top'), closing: $('closing'), grain: $('grain') };
  initFilters(L.stage);
  bg = new Background(L.bgEl);
  hud = new Hud(L.hudEl);
  const ctx = { world: L.world, top: L.top, closing: L.closing };
  for (const sc of SCENES) sc.init(ctx);
  dock = new Dock(L.top);
  cursor = new Cursor(L.top);
  // grain: one deterministic noise tile, shifted per frame
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d'), im = c.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = Math.round(hash(i, 77) * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  c.putImageData(im, 0, 0);
  st(L.grain, { 'background-image': `url(${cv.toDataURL('image/png')})` });
}

const activeAt = (sc, t) => t >= S[sc.id].t0 - (sc.pre ?? 0) && t < S[sc.id].t1 + (sc.post ?? 0);

export function render(t) {
  t = clamp(t, 0, DURATION);
  const cur = SCENE_IDS.find((id) => t >= S[id].t0 && t < S[id].t1) ?? SCENE_IDS[SCENE_IDS.length - 1];
  // light world: hidden behind the iris in S1, dark in S11, covered by the closing
  const ir = s01.iris(t);
  // feathered iris edge (a hard clip bands under motion blur)
  const mask = ir ? (ir.r < 1 ? 'linear-gradient(transparent, transparent)' : `radial-gradient(circle at ${ir.x}px ${ir.y}px, #000 ${Math.max(0, ir.r - 70).toFixed(1)}px, transparent ${ir.r.toFixed(1)}px)`) : 'none';
  st(L.light, { '-webkit-mask-image': mask, 'mask-image': mask });
  const darkK = S.lima ? clamp((t - S.lima.t0) / 0.001) * (1 - clamp((t - S.closing.t0) / 0.001)) : 0;
  // chapter tint crossfades over 0.6 s at chapter changes
  const ch = S[cur].ch;
  const tintK = ch != null ? ease.inOutCubic(clamp((t - S[cur].t0) / 0.6)) : 0;
  bg.render(t, { tint: ch != null ? CHAPTERS[ch].tint : null, k: tintK, dark: darkK });
  hud.render(t, { ch, a: t < S.closing.t0 ? 1 : 0, dark: darkK, chT: S[cur].t0 });
  // scenes
  for (const sc of SCENES) sc.render(activeAt(sc, t) ? t : -1e9);
  // the shared dock + cursor: the latest active scene that wants them
  let ds = null, cs = null;
  for (const sc of SCENES) {
    if (!activeAt(sc, t)) continue;
    const d = sc.dock?.(t); if (d) ds = d;
    const c = sc.cursor?.(t); if (c) cs = c;
  }
  dock.render(t, ds);
  cursor.render(t, cs);
  // closing layer
  show(L.closing, t >= S.closing.t0);
  // grain (shifted per frame, deterministic)
  const f = fidx(t);
  st(L.grain, { 'background-position': `${Math.floor(hash(f, 3) * 256)}px ${Math.floor(hash(f, 4) * 256)}px`, opacity: t >= S.closing.t0 ? 0.07 : 0.05 });
}
