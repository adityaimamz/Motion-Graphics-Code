// timeline.js — the single source of timing for pictures (scenes/*, ui/*), sound (audio.js) and the renderer.
// Pattern from vibe-engineer/src/timeline.js: a scene is as long as its narration needs, so the real VO files
// stretch the film; words are found in the transcript (at()) and pinned to the measured pauses; big moments snap to
// the 128 BPM grid. Objects are mutated in place by build(); importers see the new values. All times in seconds.
import { clamp } from './core.js';
import { VO_LINES } from './naskah.js';
export { VO_LINES };

export const BPM = 128, BEAT = 60 / BPM;

// ---------------------------------------------------------------- chapters (HUD rail + chips)
export const CHAPTERS = [
  { n: '00', name: 'SIAPKAN', tint: '#E7EEFF', dot: '#2F6BFF' },
  { n: '01', name: 'ATURAN', tint: '#EAF7EF', dot: '#1F9D63' },
  { n: '02', name: 'NASKAH', tint: '#FFF3E2', dot: '#E58A1F' },
  { n: '03', name: 'STORYBOARD', tint: '#F1EAFE', dot: '#7C5CE0' },
  { n: '04', name: 'KODE', tint: '#E6F6F8', dot: '#1597A8' },
  { n: '05', name: 'SUARA', tint: '#FDEBEC', dot: '#E5484D' },
  { n: '06', name: 'CEK & RENDER', tint: '#E7EEFF', dot: '#2F6BFF' },
];

// ---------------------------------------------------------------- scenes, in order
// vo    [[line id, gap before it (s) — from the scene start for the first line, from the previous line's end after]]
// after minimum time between the end of the last line and the end of the scene (room for the scene's own action)
// len   minimum length; ch = chapter index (null = none)
const SCENES = [
  { id: 'komentar', ch: null, vo: [['01-komentar', 0.62]], after: 1.12, len: 4 },
  { id: 'kode', ch: null, vo: [['02-kode', 0.25]], after: 1.9 },
  { id: 'urutan', ch: null, vo: [['03-urutan', 0.1]], after: 1.5 },
  { id: 'siapkan', ch: 0, vo: [['04-siapkan', 0.35]], after: 1.6 },
  { id: 'aturan', ch: 1, vo: [['05-claudemd', 0.35], ['06-aturan', 0.4], ['07-skill', 0.45]], after: 1.2 },
  { id: 'naskah', ch: 2, vo: [['08-naskah', 0.25], ['09-setuju', 0.55]], after: 1.0 },
  { id: 'storyboard', ch: 3, vo: [['10-storyboard', 0.35]], after: 1.1 },
  { id: 'kunci', ch: 4, vo: [['11-kunci', 0.25], ['12-identik', 0.45]], after: 1.0 },
  { id: 'suara', ch: 5, vo: [['13-suara', 0.25]], after: 1.2 },
  { id: 'cek', ch: 6, vo: [['14-cek', 0.25], ['15-revisi', 0.45], ['16-render', 0.45]], after: 1.2 },
  { id: 'lima', ch: null, vo: [['17-lima', 0.4], ['18-cara', 0.55]], after: 2.2, dark: true },
  { id: 'closing', ch: null, vo: [], len: 6 }, // VO 19 is placed at the call to action
];
export const SCENE_IDS = SCENES.map((s) => s.id);
export const SCENE_DEF = Object.fromEntries(SCENES.map((s) => [s.id, s]));

const EST_CPS = 14, PAUSE_DOTS = 0.35, CTA_HOLD = 1.45;
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const upQ = (x) => Math.ceil(x / (BEAT / 4) - 1e-6) * (BEAT / 4);
export const estimate = (line) => line.say.length / EST_CPS + (line.say.split('...').length - 1) * PAUSE_DOTS;
const voDur = (x) => (typeof x === 'number' ? x : x?.dur ?? 0);

// Word timing pinned to the real pauses (copied from vibe-engineer/src/timeline.js warpOf/warp)
function warpOf(say, d, gaps = []) {
  const L = say.length, marks = [], pick = new Map();
  for (const m of say.matchAll(/(\.\.\.|[.,:?!])\s*/g)) if (m.index + m[0].length < L) marks.push([m.index / L, (m.index + m[0].length) / L]);
  for (const g of [...gaps].sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))) {
    const mid = (g[0] + g[1]) / 2 / d;
    let best = -1, bd = 0.8 / d;
    for (let k = 0; k < marks.length; k++) {
      if (pick.has(k)) continue;
      const ok = [...pick].every(([k2, g2]) => (k2 < k) === (g2[0] < g[0]));
      const dd = Math.abs(marks[k][0] - mid); if (ok && dd < bd) { bd = dd; best = k; }
    }
    if (best >= 0) pick.set(best, g);
  }
  return [...pick].sort((x, y) => x[0] - y[0]).flatMap(([k, [a, b]]) => [[marks[k][0], a / d], [marks[k][1], b / d]]);
}
function warp(anchors, cf) {
  const A = [[0, 0], ...(anchors ?? []), [1, 1]];
  for (let i = 1; i < A.length; i++) if (cf <= A[i][0]) { const [c0, t0] = A[i - 1], [c1, t1] = A[i]; return c1 > c0 ? t0 + ((cf - c0) / (c1 - c0)) * (t1 - t0) : t1; }
  return 1;
}

// ---------------------------------------------------------------- exported (mutated in place by build)
export const S = {};        // S[id] = { id, ch, t0, t1, len, dark }
export const LINE = {};     // LINE[id] = { id, scene, s, d, e, real, warp }
export const CUE = {};      // CUE[scene] = { ...absolute times }
export const VO_PLACE = []; // [{ id, start, dur }] — only lines that have a file
export const MARKERS = [];  // [name, t] for the preview
export const STILLS = [];   // [name, t] key frames for `npm run stills`
export const BLUR = [];     // [a, b, n] windows that get sub-frame motion blur (n sub-frames)
export const SFX = [];      // [t, kind, opts] one-shot sounds scheduled by the pictures (audio.js plays them)
export let DURATION = 0;

// position on the global beat grid
export const snap = (x, div = 2) => Math.round(x / (BEAT / div)) * (BEAT / div);
export const snapUp = (x, div = 2) => Math.ceil(x / (BEAT / div) - 1e-6) * (BEAT / div);

// time a word is spoken (its share of the characters, pinned to the measured pauses)
export function at(lineId, str, f = 0) {
  const L = LINE[lineId], line = VO_LINES.find((l) => l.id === lineId), i = line.say.indexOf(str);
  if (i < 0) throw new Error(`cue word "${str}" not in ${lineId}`);
  return L.s + warp(L.warp, (i + f * str.length) / line.say.length) * L.d;
}

function build(vo = {}) {
  for (const o of [S, LINE, CUE]) for (const k of Object.keys(o)) delete o[k];
  VO_PLACE.length = 0; MARKERS.length = 0; STILLS.length = 0; BLUR.length = 0; SFX.length = 0;

  // --- scene lengths from the narration
  let t = 0;
  for (const sc of SCENES) {
    let c = t;
    sc.vo.forEach(([id, gap]) => {
      const line = VO_LINES.find((l) => l.id === id), real = voDur(vo[id]) > 0, d = real ? voDur(vo[id]) : estimate(line);
      const s = c + gap;
      LINE[id] = { id, scene: sc.id, s: r6(s), d, e: r6(s + d), real, warp: real ? warpOf(line.say, d, vo[id].gaps) : null };
      c = s + d;
    });
    const need = Math.max(sc.len ?? 0, c - t + (sc.vo.length ? sc.after : 0));
    const len = upQ(need);
    S[sc.id] = { id: sc.id, ch: sc.ch, t0: r6(t), t1: r6(t + len), len: r6(len), dark: !!sc.dark };
    t += len;
  }

  // ------------------------------------------------------------ S1 · komentar (dark, TikTok reply bubble → prompt → iris)
  {
    const id = '01-komentar', s = S.komentar;
    const oke = at(id, 'Oke'), aku = at(id, 'aku'), bong = at(id, 'bongkar'), end = LINE[id].e;
    const fly0 = bong - 0.08, fly1 = fly0 + 0.78;
    const send = snapUp(Math.max(end + 0.12, fly1 + 0.42), 2);
    CUE.komentar = {
      bubble: s.t0 + 0.1, marker: at(id, 'minta') - 0.05, cursorIn: oke - 0.55, select: [oke - 0.05, aku + 0.05], dockIn: aku - 0.35,
      fly: [fly0, fly1], land: fly1, cursorToSend: [fly1 - 0.05, send - 0.12], send,
      iris: [send + 0.04, send + 0.86], sent: [send + 0.02, send + 0.62], end: s.t1,
    };
    BLUR.push([fly0, fly1, 8], [send, send + 0.9, 6]);
    SFX.push([s.t0 + 0.1, 'bubble'], [at(id, 'minta') - 0.05, 'marker'], [oke - 0.05, 'select'], [aku - 0.35, 'dock'], [fly0, 'flyText'], [fly1, 'land'], [send, 'send'], [send + 0.04, 'iris']);
  }
  // ------------------------------------------------------------ S2 · kode (Nol [keyframe.] → [After Effects.] → 100% [kode.]; counters)
  {
    const id = '02-kode', s = S.kode;
    const head = at(id, 'nggak ada'), ae = snap(at(id, 'After Effects', 0.1), 4), kode = snap(at(id, 'kode...', 0.0), 4);
    const cc = at(id, 'Claude Code');
    const tiles = [0, 1, 2].map((i) => snap(cc - 0.05, 4) + i * BEAT / 2);
    // the card plays a reel of real clips from the first video, one per two beats, until it flips to its code
    const card = s.t0 + 0.05, flip = kode + 0.06, R = ['r1-karam', 'r2-terima', 'r3-bocor', 'r4-peti', 'r5-pangkat', 'r6-kraken', 'r7-kecil'];
    const reel = [];
    for (let k = 0; k < R.length; k++) { const a = card + k * BEAT * 2; if (a >= flip) break; reel.push([R[k], a, Math.min(a + BEAT * 2, flip + 0.35)]); }
    CUE.kode = {
      card, head, pill: head + 0.32, swap1: ae, swap2: kode, flip, widen: flip + 0.78, focus: [kode, kode + 1.35], reel,
      tiles, count: [tiles[0] + 0.1, tiles[0] + 1.6], exit: s.t1 - 0.55, end: s.t1,
    };
    BLUR.push([ae - 0.05, ae + 0.36, 8], [kode - 0.05, kode + 0.36, 8], [kode, kode + 0.7, 6], [flip + 0.73, flip + 1.5, 8], [s.t1 - 0.55, s.t1 + 0.1, 6]);
    SFX.push([s.t0 + 0.05, 'card'], [head, 'wordIn'], [head + 0.32, 'pill'], [ae, 'swap'], [kode, 'swap'], [kode + 0.06, 'flip'], [flip + 0.78, 'widen'],
      ...tiles.map((x, i) => [x, 'tile', { i }]), [s.t1 - 0.55, 'collapse']);
  }
  // ------------------------------------------------------------ S3–S11: lengths are real; their cues come after the test cut
  for (const id of ['urutan', 'siapkan', 'aturan', 'naskah', 'storyboard', 'kunci', 'suara', 'cek', 'lima']) CUE[id] = { end: S[id].t1 };

  // ------------------------------------------------------------ closing (C = start: black, the ring draws, the arrow locks on the beat)
  {
    const s = S.closing, C = s.t0, lock = snapUp(C + 1.62, 1);
    const line = VO_LINES.find((l) => l.id === '19-follow'), real = voDur(vo[line.id]) > 0, d = real ? voDur(vo[line.id]) : estimate(line);
    const cta = lock + 0.95, vs = cta + 0.05;
    LINE[line.id] = { id: line.id, scene: 'closing', s: r6(vs), d, e: r6(vs + d), real, warp: real ? warpOf(line.say, d, vo[line.id].gaps) : null };
    const end = Math.max(s.t1, LINE[line.id].e + CTA_HOLD);
    s.t1 = r6(end); s.len = r6(end - C);
    const fol = at(line.id, 'Follow'), biar = at(line.id, 'Biar'), terus = at(line.id, 'Terus'), bikin = at(line.id, 'dibikinin'), kontak = at(line.id, 'kontaknya');
    CUE.closing = {
      ring: [C + 0.2, C + 1.15], arrow: [lock - 0.78, lock], lock, wave: [lock, lock + 0.75], wordmark: [lock + 0.28, lock + 1.03],
      line: fol - 0.02, follow: fol + 0.1, tap: snap(Math.max(biar + 0.4, terus - 0.32), 2), ask: bikin - 0.15,
      url: snap(bikin + 0.12, 4), wa: snap(bikin + 0.12, 4) + BEAT, pulse: kontak, end,
    };
    BLUR.push([C + 0.2, C + 1.15, 4], [lock - 0.78, lock + 0.05, 10]);
    SFX.push([C + 0.2, 'ring'], [lock - 0.78, 'arrow'], [lock, 'lock'], [lock + 0.28, 'wordmark'], [CUE.closing.follow, 'pop'],
      [CUE.closing.tap, 'tap'], [CUE.closing.url, 'pop2'], [CUE.closing.wa, 'pop2'], [kontak, 'pulse']);
  }
  DURATION = S.closing.t1;

  // --- VO placement (only lines that have a file)
  for (const l of VO_LINES) { const L = LINE[l.id]; if (L?.real) VO_PLACE.push({ id: l.id, start: L.s, dur: L.d }); }
  // --- markers + key frames
  for (const id of SCENE_IDS) MARKERS.push([id, S[id].t0]);
  const K = CUE.komentar, D = CUE.kode, Cl = CUE.closing;
  STILLS.push(
    ['s01-gelembung', K.bubble + 0.5], ['s01-blok', K.select[1] + 0.1], ['s01-terbang', (K.fly[0] + K.fly[1]) / 2], ['s01-dok', K.send - 0.15],
    ['s01-iris', (K.iris[0] + K.iris[1]) / 2],
    ['s02-keyframe', D.pill + 0.5], ['s02-ae', D.swap1 + 0.15], ['s02-ae-tetap', D.swap1 + 0.6], ['s02-kode', D.swap2 + 0.5], ['s02-hitung', D.count[0] + 0.6], ['s02-angka', D.count[1] + 0.2],
    ['s12-cincin', (Cl.ring[0] + Cl.ring[1]) / 2], ['s12-panah', Cl.lock - 0.12], ['s12-kunci', Cl.lock + 0.08], ['s12-wordmark', Cl.wordmark[1]],
    ['s12-follow', Cl.tap - 0.1], ['s12-following', Cl.tap + 0.5], ['s12-kontak', Cl.wa + 0.6], ['s12-akhir', DURATION - 0.02],
  );
}

// ---------------------------------------------------------------- queries
export function sceneAt(t) {
  for (let i = SCENE_IDS.length - 1; i >= 0; i--) if (t >= S[SCENE_IDS[i]].t0) return SCENE_IDS[i];
  return SCENE_IDS[0];
}
// number of sub-frames for motion blur at t (1 = none)
export function blurAt(t) { let n = 1; for (const [a, b, k] of BLUR) if (t >= a && t <= b) n = Math.max(n, k); return n; }
export const sceneProgress = (id, t) => clamp((t - S[id].t0) / S[id].len);

// durations: { '<id>': seconds | { dur, gaps } } — missing ids are estimated and not voiced
export function applyVO(durations = {}) { build(durations); }
build();
