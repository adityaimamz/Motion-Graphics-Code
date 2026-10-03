// timeline.js — the single source of timing for pictures (scenes/*, ui/*), sound (audio.js) and the renderer.
// Pattern from vibe-engineer/src/timeline.js: a scene is as long as its narration needs, so the real VO files
// stretch the film; words are found in the transcript (at()) and pinned to the measured pauses; big moments snap to
// the 128 BPM grid. Objects are mutated in place by build(); importers see the new values. All times in seconds.
import { clamp } from './core.js';
import { VO_LINES, PROMPT_NASKAH, PROMPT_STORYBOARD, PROMPT_KUNCI, PROMPT_SUARA } from './naskah.js';
import { CMD_STILLS, COMPLAINT_TXT, COMMIT_TXT, PROMPT_URUTAN, TERM_INSTALL, TERM_FOLDER, HOOK_REWRITE } from './naskah.js';
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
  { id: 'urutan', ch: null, vo: [['03-urutan', 0.1]], after: 2.1 },
  { id: 'siapkan', ch: 0, vo: [['04-siapkan', 0.35]], after: 1.6 },
  { id: 'aturan', ch: 1, vo: [['05-claudemd', 0.35], ['06-aturan', 0.4], ['07-skill', 0.45]], after: 1.2 },
  { id: 'naskah', ch: 2, vo: [['08-naskah', 0.25], ['09-setuju', 0.55]], after: 1.0 },
  { id: 'storyboard', ch: 3, vo: [['10-storyboard', 0.35]], after: 1.1 },
  { id: 'kunci', ch: 4, vo: [['11-kunci', 0.25], ['12-identik', 0.45]], after: 1.0 },
  { id: 'suara', ch: 5, vo: [['13-suara', 0.25]], after: 1.7 },
  { id: 'cek', ch: 6, vo: [['14-cek', 0.25], ['15-revisi', 0.45], ['16-render', 0.45]], after: 2.3 },
  { id: 'lima', ch: null, vo: [['17-lima', 0.4], ['18-cara', 1.2]], after: 2.2, dark: true },
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
  // ------------------------------------------------------------ S3 · urutan (one prompt fails → "Bukan satu prompt." → seven chips on the beat)
  {
    const id = '03-urutan', s = S.urutan;
    const jangan = at(id, 'jangan bayangin'), sekali = at(id, 'sekali prompt'), jadi = at(id, 'langsung jadi'), nggak = at(id, 'Nggak gitu'), ada = at(id, 'Ada urutannya');
    const typeAt = sekali - 0.1, send = snapUp(Math.max(typeAt + PROMPT_URUTAN.length / 32 + 0.3, jadi + 0.2), 2);
    const c0 = snap(ada + 0.02, 4), exit = s.t1 - 0.72, strike = [Math.max(nggak - 0.06, send + 0.1), Math.max(nggak - 0.06, send + 0.1) + 0.4];
    CUE.urutan = {
      dockIn: s.t0 - 0.3, typeAt, send, errChip: send + 0.12,
      headA: Math.min(jangan - 0.05, s.t0 - 0.12), strike, headAOut: Math.max(ada - 0.02, strike[1] + 0.25), headB: Math.max(ada + 0.12, strike[1] + 0.25) + 0.18,
      chips: Array.from({ length: 7 }, (_, i) => c0 + (i * BEAT) / 2), exit, end: s.t1,
    };
    BLUR.push([exit, exit + 0.75, 6]);
    SFX.push([typeAt, 'type', { text: PROMPT_URUTAN, cps: 32 }], [send, 'send'], [send + 0.04, 'buzz'], [strike[0], 'strike'], [CUE.urutan.headB, 'wordIn'],
      ...CUE.urutan.chips.map((x, i) => [x, 'chipIn', { i }]), [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S4 · siapkan (install lines → ticks → folder → claude → welcome → dock)
  {
    const id = '04-siapkan', s = S.siapkan;
    const udah = at(id, 'Udah?'), folder = at(id, 'folder kosong'), ketik = at(id, 'ketik claude');
    const a = s.t0 + 0.5, l1 = [a, a + 0.3, a + 0.95, a + 1.2];
    const mk = folder - 0.06, cl = ketik, enter = cl + 0.55, morph = s.t1 - 0.82;
    CUE.siapkan = {
      head: s.t0 - 0.3, card: s.t0 - 0.12, note: s.t0 + 0.9, l1, checks: [0, 1, 2].map((i) => Math.max(udah + 0.02, l1[3] + 0.5) + i * 0.17),
      l2: [mk, cl], enter, welcome: enter + 0.12, morph, exit: morph, end: s.t1,
    };
    BLUR.push([morph, morph + 0.7, 8]);
    SFX.push([s.t0 - 0.12, 'card'], ...l1.map((x, i) => [x, 'type', { text: TERM_INSTALL[i], cps: i % 2 ? 80 : 70, g: i % 2 ? 1 : 0.7 }]),
      ...CUE.siapkan.checks.map((x, i) => [x, 'check', { i }]), [mk, 'type', { text: TERM_FOLDER[0], cps: 40 }], [cl, 'type', { text: TERM_FOLDER[1], cps: 12 }], [enter, 'enter'], [CUE.siapkan.welcome, 'pop'], [morph, 'collapse']);
  }
  // ------------------------------------------------------------ S5 · aturan (CLAUDE.md card → three rules → the skill → both fold into chips on the dock)
  {
    const a = '05-claudemd', b = '06-aturan', c = '07-skill', s = S.aturan;
    const sebelum = at(a, 'sebelum nyuruh'), tiap = at(a, 'tiap kali mulai'), r1 = at(b, 'rencana'), r2 = at(b, 'render sendiri'), r3 = at(b, 'commit tanpa');
    const terus = at(c, 'Terus aku'), buku = at(c, 'buku panduan'), ukuran = at(c, 'Ukuran video'), logo = at(c, 'logo di akhir'), larang = at(c, 'nggak boleh'), gen = at(c, 'generik');
    const exit = s.t1 - 0.78, card1 = Math.max(s.t0 + 0.4, sebelum - 0.2);
    const items = [0, 1, 2].map((i) => larang + 0.12 + i * 0.16), strikes = [0, 1, 2].map((i) => larang + 0.6 + i * 0.42);
    CUE.aturan = {
      head1: s.t0 - 0.05, card1, rows: card1 + 0.3, arrow: [tiap - 0.2, tiap + 0.4], tip: tiap + 0.5,
      sel: [r1 - 0.14, r2 - 0.14, r3 - 0.14], selOut: terus - 0.3, collapse: terus - 0.1, head2: terus + 0.12,
      card2: terus + 0.3, tree: terus + 0.6, pane: buku - 0.1, tags: [ukuran - 0.05, logo - 0.05, larang - 0.12], items, strikes,
      stamp: Math.max(gen - 0.2, strikes[2] + 0.45), fold: exit, exit, end: s.t1,
    };
    BLUR.push([exit, exit + 0.7, 8], [terus - 0.1, terus + 0.55, 4]);
    SFX.push([CUE.aturan.card1, 'paper'], [CUE.aturan.arrow[0], 'strike'], ...CUE.aturan.sel.map((x) => [x, 'sel']), [terus + 0.12, 'wordIn'], [CUE.aturan.card2, 'paper'],
      ...[0, 1, 2, 3, 4].map((i) => [CUE.aturan.tree + i * 0.12, 'tick', { i }]), ...CUE.aturan.tags.map((x) => [x, 'pop']), ...strikes.map((x) => [x, 'strike']), [CUE.aturan.stamp, 'stamp'], [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S6 · naskah (prompt typed → send → three hooks → strike → bubbles → Setuju → card A becomes the page)
  {
    const a = '08-naskah', b = '09-setuju', s = S.naskah;
    const typeAt = s.t0 + 0.3, cps = 34, typeEnd = typeAt + PROMPT_NASKAH.length / cps, nask = at(a, 'naskahnya');
    const send = snapUp(Math.max(typeEnd + 0.5, nask + 0.05), 2);
    const cards = [0, 1, 2].map((i) => send + 0.12 + i * 0.12);
    const coret = at(b, 'coret'), bolak = at(b, 'bolak-balik'), setuju = at(b, 'setuju');
    const strike = Math.max(coret - 0.05, cards[2] + 0.9), rewrite = strike + 0.5;
    const bub = [Math.max(bolak - 0.05, rewrite + 1.0)]; bub.push(bub[0] + 0.55);
    const click = Math.max(setuju + 0.1, bub[1] + 0.9), exit = Math.max(s.t1 - 0.85, click + 0.8);
    CUE.naskah = {
      head: s.t0 - 0.1, typeAt, cps, hl: typeEnd + 0.05, send, cards, strike, rewrite, bub, click, pick: click + 0.05,
      cur: [send - 0.7, exit], exit, end: s.t1,
    };
    BLUR.push([send + 0.1, send + 1.0, 6], [exit, exit + 0.75, 6]);
    SFX.push([typeAt, 'type', { text: PROMPT_NASKAH, cps }], [send, 'send'], ...cards.map((x) => [x, 'card']), [strike, 'strike'], [rewrite, 'type', { text: HOOK_REWRITE, cps: 26 }],
      ...bub.map((x) => [x, 'pop']), [click, 'sel'], [click + 0.1, 'chime'], [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S7 · storyboard (page → prompt → roll → the real S8 block lights up → the real clip → thumbnail)
  {
    const id = '10-storyboard', s = S.storyboard;
    const typeAt = s.t0 + 0.3, cps = 34, send = typeAt + PROMPT_STORYBOARD.length / cps + 0.3;
    const detail = at(id, 'Detail banget'), posisi = at(id, 'posisi teks'), bunyi = at(id, 'bunyi tiap');
    const scroll = [send + 0.12, send + 1.12], expand = scroll[1] + 0.05;
    const r0 = Math.max(expand + 0.15, detail + 0.1), r1 = r0 + 0.5, r2 = Math.max(r1 + 0.4, posisi - 0.1), r3 = Math.max(r2 + 0.4, bunyi - 0.1);
    const exit = s.t1 - 0.7;
    CUE.storyboard = { head: s.t0 + 0.05, typeAt, send, scroll, expand, rowsOn: [r0, r1, r2, r3], clip: expand + 0.2, exit, end: s.t1 };
    BLUR.push([scroll[0], scroll[1], 8], [exit, exit + 0.7, 6]);
    SFX.push([typeAt, 'type', { text: PROMPT_STORYBOARD, cps }], [send, 'send'], [scroll[0], 'scroll'], [scroll[1], 'sel'], ...[r0, r1, r2, r3].map((x, i) => [x, 'tick', { i }]),
      [CUE.storyboard.clip, 'card'], [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S8 · kunci (typed sentence → frame = f(t) → players, jumps, diff 0 px → playhead leaves)
  {
    const a = '11-kunci', b = '12-identik', s = S.kunci;
    const typeAt = Math.max(s.t0 + 0.4, at(a, 'Ada satu kalimat')), typeEnd = typeAt + PROMPT_KUNCI.length / 34;
    const lift = Math.max(typeEnd + 0.3, at(a, 'fungsi dari waktu') - 0.2);
    const art = at(b, 'Artinya'), j1 = at(b, 'lompat'), j2 = at(b, 'detik berapa'), j3 = at(b, 'gambarnya');
    const diff = Math.max(at(b, 'sama persis') - 0.1, j3 + 0.5), apart = Math.max(at(b, 'Yang kamu lihat') - 0.05, diff + 1.3);
    const lblPreview = at(b, 'di preview'), lblRender = at(b, 'pas render'), exit = s.t1 - 0.7;
    CUE.kunci = {
      head: s.t0 - 0.1, typeAt, lift, sel: lift + 0.9, shrink: art - 0.15, tl: s.t0 - 0.2, players: art + 0.3, j1, j2, j3, diff, apart, resume: apart + 0.6, lblPreview, lblRender, exit, end: s.t1,
    };
    BLUR.push([lift, lift + 0.8, 8], [CUE.kunci.shrink, CUE.kunci.shrink + 0.65, 6], [diff, diff + 0.5, 6], [apart, apart + 0.5, 6], [exit, exit + 0.7, 8]);
    SFX.push([typeAt, 'type', { text: PROMPT_KUNCI, cps: 34 }], [lift, 'lift'], [CUE.kunci.sel, 'sel'], [CUE.kunci.shrink, 'collapse'], [CUE.kunci.players, 'card'], [CUE.kunci.players + 0.1, 'card'],
      [j1, 'jump'], [j2, 'jump'], [j3, 'jump'], [diff, 'slide'], [diff + 0.55, 'pass'], [apart, 'slide'], [lblPreview, 'sel'], [lblRender, 'sel'], [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S9 · suara (REC pill → the take swept in → prompt → cuts at the real pauses → clips land on scene thumbnails)
  {
    const id = '13-suara', s = S.suara, L = LINE[id];
    const rekam = at(id, 'rekam aja'), sekali = at(id, 'Sekali jalan'), akhir = at(id, 'sampai akhir'), nanti = at(id, 'Nanti'), terus = at(id, 'terus'), coc = at(id, 'dicocokin');
    const sweep = [sekali - 0.1, akhir + 0.35], typeAt = nanti - 0.05, send = typeAt + PROMPT_SUARA.length / 34 + 0.2;
    const cutsF = ['rekam aja', 'Sekali jalan', 'Nanti', 'terus'].map((w) => Math.min(0.97, Math.max(0.03, (at(id, w) - 0.1 - L.s) / L.d))).sort((a, b) => a - b);
    const cutT = [0, 1, 2, 3].map((i) => send + 0.08 + i * 0.2), thumbs = Math.max(terus - 0.1, cutT[3] + 0.3), match = Math.max(coc - 0.05, thumbs + 0.55), exit = s.t1 - 0.7;
    const pill = s.t0 - 0.3, rec = Math.max(rekam - 0.1, pill + 0.5);
    CUE.suara = { head: s.t0 - 0.42, pill, rec, sweep, typeAt, send, cutsF, cutT, thumbs, match, exit, end: s.t1 };
    BLUR.push([exit, exit + 0.7, 6], [match, match + 1.2, 4]);
    SFX.push([rec, 'sel'], [rec + 0.02, 'pop'], [typeAt, 'type', { text: PROMPT_SUARA, cps: 34 }], [send, 'send'], ...cutT.map((x) => [x, 'snip']), ...[0, 1, 2, 3, 4].map((i) => [thumbs + i * 0.1, 'tick', { i }]),
      ...[0, 1, 2, 3, 4].map((i) => [match + i * 0.12 + 0.45, 'snap', { i }]), [exit, 'collapse']);
  }
  // ------------------------------------------------------------ S10 · cek (stills + magnifier → pin → complaint → v3 clip → render → commit → lights out)
  {
    const a = '14-cek', b = '15-revisi', c = '16-render', s = S.cek;
    const eks = at(a, 'ekspor gambar'), lihat = at(a, 'lihat sendiri'), aneh = at(b, 'Ada yang aneh'), bil = at(b, 'Bilang aja'), spes = at(b, 'spesifik'), vk = at(b, 'Video kemarin'), sam = at(b, 'sampai tiga'), tiga = at(b, 'tiga versi');
    const rend = at(c, 'render di'), com = at(c, 'commit'), titik = at(c, 'titik aman');
    const typeA = Math.max(s.t0 + 0.1, eks - 0.6), sendA = typeA + CMD_STILLS.length / 20 + 0.2, pop0 = sendA + 0.1;
    const shots = Array.from({ length: 12 }, (_, i) => pop0 + i * 0.085);
    const lens0 = Math.max(lihat - 0.2, shots[11] + 0.3), lens1 = Math.max(LINE[a].e + 0.1, lens0 + 1.8);
    const grow = Math.max(lens1 + 0.45, aneh + 0.1), pin = grow + 0.8;
    const typeB = Math.max(bil - 0.15, pin + 0.3), send = typeB + COMPLAINT_TXT.length / 34 + 0.2, reply = send + 0.55, replyDone = reply + 0.15 + 46 / 40 + 0.1, clip = replyDone + 0.2;
    const v1 = Math.max(vk + 0.1, send + 0.2), v2 = Math.max(sam, v1 + 0.5), v3 = Math.max(tiga, v2 + 0.5);
    const partC = Math.max(rend - 0.75, v3 + 1.4), term = partC + 0.2, cmd = Math.max(rend - 0.1, term + 0.35), prog0 = cmd + 0.75;
    const commit = Math.max(com - 0.6, prog0 + 1.0), msg = commit + 0.6, safe = Math.max(titik - 0.1, msg + COMMIT_TXT.length / 50 + 0.1);
    const exit = Math.max(s.t1 - 1.05, safe + 1.4), dark = Math.max(0.4, Math.min(0.9, s.t1 - exit));
    CUE.cek = {
      H: [s.t0 - 0.05, aneh - 0.05, partC + 0.1], Hout: [aneh - 0.2, partC - 0.1, exit + 0.1], typeA, sendA, shots, lens: [lens0, lens1], grow, pin, typeB, send, reply, replyDone, clip, versions: [v1, v2, v3],
      partC, term, cmd, progress: [prog0, prog0 + 1.5], commit, msg, safe, exit, dark, end: s.t1,
    };
    BLUR.push([lens0, lens1, 3], [grow, grow + 0.8, 5], [partC, partC + 0.6, 5], [exit, exit + dark, 5]);
    SFX.push([typeA, 'type', { text: CMD_STILLS, cps: 20 }], [sendA, 'send'], ...shots.map((x, i) => [x, 'shutter', { i }]), [lens0, 'sweep'], [grow, 'slide'], [pin, 'pin'], [typeB, 'type', { text: COMPLAINT_TXT, cps: 34 }], [send, 'send'],
      [reply, 'card'], [replyDone, 'check', { i: 0 }], [clip, 'pop'], ...[v1, v2, v3].map((x, i) => [x, 'tick', { i }]), [cmd, 'type', { text: 'npm run render', cps: 22 }], ...Array.from({ length: 5 }, (_, i) => [prog0 + i * BEAT * 1.0, 'tick', { i: i % 3 }]),
      [prog0 + 1.5, 'enter'], [msg, 'type', { text: COMMIT_TXT, cps: 50 }], [safe, 'bell'], [exit, 'lights']);
  }
  // ------------------------------------------------------------ S11 · lima (dark: rail → chips, rule chips + curves → recede → phone → push into its screen)
  {
    const a = '17-lima', b = '18-cara', s = S.lima;
    const rules = [at(a, 'Baca dulu'), at(a, 'kasih konteks'), at(a, 'perintah kecil'), at(a, 'tes,'), at(a, 'commit')];
    const links = rules.map((x) => x + 0.05), lead = Math.min(s.t0 + 0.9, at(a, 'lima aturan') - 0.1);
    const recede = at(b, 'Jadi video') - 0.15, phone = recede + 0.15, clip = s.t1 - 7.4, push = s.t1 - 0.78;
    CUE.lima = { rail: s.t0 + 0.12, chips: s.t0 + 0.12, lead, slots: Math.max(lead + 0.6, at(a, 'video kemarin') - 0.1), rules, links, recede, head2: recede + 0.3, cara: at(b, 'cara vibe'), phone, clip, push, end: s.t1 };
    BLUR.push([s.t0 + 0.12, s.t0 + 1.2, 5], [recede, recede + 0.6, 5], [push, s.t1, 12]);
    SFX.push([s.t0 + 0.12, 'railTurn'], ...[0, 1, 2, 3, 4].map((k) => [Math.max(lead + 0.6, at(a, 'video kemarin') - 0.1) + k * 0.09, 'tick', { i: k }]), ...rules.map((x, i) => [x, 'rule', { i }]), ...rules.map((x, i) => [x + 0.2, 'link', { i }]), [recede, 'collapse'], [phone, 'slide'], [push, 'dive']);
  }
  // ------------------------------------------------------------ (S11 above) closing are real; their cues come with the scenes

  // ------------------------------------------------------------ closing (C = start: black, the ring draws, the arrow locks on the beat)
  {
    const s = S.closing, C = s.t0, lock = snapUp(C + 1.15, 1); // the ring is already there (S11's push lands it), so the arrow comes sooner
    const line = VO_LINES.find((l) => l.id === '19-follow'), real = voDur(vo[line.id]) > 0, d = real ? voDur(vo[line.id]) : estimate(line);
    const cta = lock + 0.95, vs = cta + 0.05;
    LINE[line.id] = { id: line.id, scene: 'closing', s: r6(vs), d, e: r6(vs + d), real, warp: real ? warpOf(line.say, d, vo[line.id].gaps) : null };
    const end = Math.max(s.t1, LINE[line.id].e + CTA_HOLD);
    s.t1 = r6(end); s.len = r6(end - C);
    const fol = at(line.id, 'Follow'), biar = at(line.id, 'Biar'), terus = at(line.id, 'Terus'), bikin = at(line.id, 'dibikinin'), kontak = at(line.id, 'kontaknya');
    CUE.closing = {
      ring: [C - 0.14, C + 0.36], arrow: [lock - 0.78, lock], lock, wave: [lock, lock + 0.75], wordmark: [lock + 0.28, lock + 1.03],
      line: fol - 0.02, follow: fol + 0.1, tap: snap(Math.max(biar + 0.4, terus - 0.32), 2), ask: bikin - 0.15,
      url: snap(bikin + 0.12, 4), wa: snap(bikin + 0.12, 4) + BEAT, pulse: kontak, end,
    };
    BLUR.push([lock - 0.78, lock + 0.05, 10]);
    SFX.push([C - 0.12, 'ring'], [lock - 0.78, 'arrow'], [lock, 'lock'], [lock + 0.28, 'wordmark'], [CUE.closing.follow, 'pop'],
      [CUE.closing.tap, 'tap'], [CUE.closing.url, 'pop2'], [CUE.closing.wa, 'pop2'], [kontak, 'pulse']);
  }
  DURATION = S.closing.t1;

  // --- VO placement (only lines that have a file)
  for (const l of VO_LINES) { const L = LINE[l.id]; if (L?.real) VO_PLACE.push({ id: l.id, start: L.s, dur: L.d }); }
  // --- markers + key frames
  for (const id of SCENE_IDS) MARKERS.push([id, S[id].t0]);
  const K = CUE.komentar, D = CUE.kode, Cl = CUE.closing, U = CUE.urutan, P = CUE.siapkan, A5 = CUE.aturan, N6 = CUE.naskah, B7 = CUE.storyboard, K8 = CUE.kunci, V9 = CUE.suara, C10 = CUE.cek, L11 = CUE.lima;
  STILLS.push(
    ['s11-rel', L11.chips + 0.4], ['s11-chip', L11.chips + 1.3], ['s11-gulung', L11.rules[1] + 0.5], ['s11-garis', L11.rules[4] + 0.8], ['s11-mundur', L11.recede + 0.3], ['s11-cara', L11.cara + 0.5], ['s11-hp', L11.clip + 3.2], ['s11-dorong', L11.push + 0.55],
    ['s10-sheet', C10.shots[11] + 0.5], ['s10-lensa', (C10.lens[0] + C10.lens[1]) / 2], ['s10-bocor', C10.pin + 0.8], ['s10-keluhan', C10.send + 0.7], ['s10-versi', C10.versions[2] + 0.7], ['s10-render', C10.progress[0] + 1.2], ['s10-commit', C10.safe + 0.7], ['s10-gelap', C10.exit + C10.dark * 0.6],
    ['s08-ketik', K8.lift - 0.15], ['s08-rumus', K8.lift + 1.3], ['s08-geser', K8.shrink + 0.6], ['s08-main', K8.j1 - 0.3], ['s08-lompat1', K8.j1 + 0.4], ['s08-lompat2', K8.j2 + 0.4], ['s08-diff', K8.diff + 0.95], ['s08-sama', K8.apart + 1.5], ['s08-keluar', K8.exit + 0.35],
    ['s09-rec', V9.rec + 0.9], ['s09-gelombang', (V9.sweep[0] + V9.sweep[1]) / 2], ['s09-potong', V9.cutT[1] + 0.4], ['s09-klip', V9.cutT[3] + 0.9], ['s09-thumb', V9.thumbs + 0.8], ['s09-tempel', V9.match + 1.1], ['s09-keluar', V9.exit + 0.4],
    ['s06-ketik', N6.hl - 0.2], ['s06-sorot', N6.hl + 0.4], ['s06-kartu', N6.cards[2] + 0.9], ['s06-coret', N6.rewrite + 0.4], ['s06-bolak', N6.bub[1] + 0.5], ['s06-setuju', N6.click + 0.4], ['s06-halaman', N6.exit + 0.4],
    ['s07-prompt', B7.send - 0.2], ['s07-gulir', (B7.scroll[0] + B7.scroll[1]) / 2], ['s07-blok', B7.expand + 0.8], ['s07-baris', B7.rowsOn[2] + 0.5], ['s07-bunyi', B7.rowsOn[3] + 0.6], ['s07-keluar', B7.exit + 0.35],
    ['s05-kartu', A5.rows + 1.4], ['s05-panah', A5.arrow[1] + 0.3], ['s05-rencana', A5.sel[0] + 0.5], ['s05-render', A5.sel[1] + 0.5], ['s05-commit', A5.sel[2] + 0.5],
    ['s05-skill', A5.pane + 1.2], ['s05-coret', A5.strikes[2] + 0.4], ['s05-cap', A5.stamp + 0.5], ['s05-lipat', A5.fold + 0.3], ['s05-chip', A5.fold + 0.6],
    ['s03-gagal', U.errChip + 0.5], ['s03-coret', U.strike[1] + 0.3], ['s03-daftar', U.chips[6] + 0.7], ['s03-keluar', U.exit + 0.4],
    ['s04-install', P.l1[3] + 0.9], ['s04-centang', P.checks[2] + 0.5], ['s04-claude', P.welcome + 0.6], ['s04-dok', P.morph + 0.45],
    ['s01-gelembung', K.bubble + 0.5], ['s01-blok', K.select[1] + 0.1], ['s01-terbang', (K.fly[0] + K.fly[1]) / 2], ['s01-dok', K.send - 0.15],
    ['s01-iris', (K.iris[0] + K.iris[1]) / 2],
    ['s02-keyframe', D.pill + 0.5], ['s02-ae', D.swap1 + 0.15], ['s02-ae-tetap', D.swap1 + 0.6], ['s02-kode', D.swap2 + 0.5], ['s02-hitung', D.count[0] + 0.6], ['s02-angka', D.count[1] + 0.2],
    ['s12-sambung', Cl.ring[0] - 0.04], ['s12-cincin', Cl.ring[1] + 0.1], ['s12-panah', Cl.lock - 0.12], ['s12-kunci', Cl.lock + 0.08], ['s12-wordmark', Cl.wordmark[1]],
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
