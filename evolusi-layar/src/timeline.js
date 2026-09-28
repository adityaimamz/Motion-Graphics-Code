// timeline.js — single source of truth for timing, shared by the pictures (film.js / sites.js),
// the sound (audio.js) and the renderer. The timeline is *built* from a base design plus optional
// voice-over durations: when a narrated line is longer than its slot, the scene stretches and everything
// after it moves. Objects are mutated in place, so modules that imported them see the new values.
// Call applyVO() before film.init() / renderAudio(). All times in seconds.
import { ease } from './core.js';

// ---------------------------------------------------------------- base design
const ORDER = ['hook', 'e91', 'e98', 'e02', 'e07', 'e15', 'e23', 'close'];
const LEN = { hook: 2.75, e91: 6.0, e98: 5.75, e02: 5.65, e07: 7.75, e15: 8.75, e23: 9.35, close: 10.6 };
// local time at which the scene must be "done talking" (its outgoing transition / the 2002 click)
const OUT_L = { hook: 2.22, e91: 5.7, e98: 5.45, e02: 5.5, e07: 7.3, e15: 8.05, e23: 9.35 };
// page: true = a second caption "page" in the same scene (the "why" behind the first one). The previous page
// leaves as its narration ends, then this one comes in.
const CAP_BASE = [
  { scene: 'e91', style: 'term', beats: [['Dulu, internet cuma teks.', 1.0], ['Orang cuma butuh informasi, bukan tampilan.', 1.75]] },
  { scene: 'e98', style: 'rainbow', beats: [['Lalu semua orang\npengen ‘rame’.', 0.65], ['Makin heboh, makin keren.', 1.45]] },
  { scene: 'e02', style: 'chrome', beats: [['Era pamer teknologi —', 0.9], ['bahkan kalau harus mengorbankan kecepatan dan kegunaan.', 1.7]] },
  { scene: 'e07', style: 'glossy', beats: [['Semua didesain biar kelihatan ‘mahal’.', 0.5]] },
  { scene: 'e07', style: 'glossy', page: true, beats: [['Soalnya orang masih asing sama layar —', 2.75], ['tombol harus kelihatan bisa dipencet.', 4.9]] },
  { scene: 'e15', style: 'flat', beats: [['Sampai orang sadar:', 0.45], ['simpel itu lebih dipercaya.', 0.95]] },
  { scene: 'e15', style: 'flat', page: true, size: 56, beats: [['Orang udah terbiasa\nsama layar —', 3.6], ['tombol nggak perlu\npura-pura timbul lagi.', 5.45]] },
  { scene: 'e23', style: 'brand', beats: [['Sekarang bukan soal ramai atau simpel —', 0.6], ['tapi soal terasa pas untuk penggunanya.', 1.45]] },
  { scene: 'e23', style: 'brand', page: true, beats: [['Karena websitenya udah\n‘kenal’ kamu:', 5.1], ['kopi langganan,\ncukup sekali tap.', 7.15]] },
  { scene: 'close', style: 'brand', beats: [['Kalau website kamu masih kelihatan\nseperti salah satu era di atas,', 0.85], ['itu tandanya sudah\nwaktunya berubah.', 3.2]], top: 1170, size: 62, fit: 940, center: true },
  // end card call to action, after the wordmark (and after "Beyond Studio." if that line is voiced); stays to the end
  { scene: 'close', style: 'brand', cta: true, beats: [['Follow, biar tahu ‘kenapa’ lainnya.', 7.55]], top: 1190, size: 54, fit: 940, center: true },
];
const CTA_I = CAP_BASE.findIndex((c) => c.cta);

// ---------------------------------------------------------------- voice-over lines (one file per line)
// file name in vo/: <id>.<wav|mp3|m4a|ogg|flac|aac|webm>
export const VO_LINES = [
  { id: '01-hook', scene: 'hook', at: 0.05, say: 'Kenapa desain website terus berubah?' },
  ...CAP_BASE.flatMap((c, ci) => (c.cta ? [] : c.beats.map(([text], bi) => ({
    id: null, scene: c.scene, cap: ci, beat: bi, say: text.replace(/\n/g, ' '),
  })))),
  { id: null, scene: 'close', brand: true, optional: true, say: 'Beyond Studio.' },
  { id: null, scene: 'close', cta: true, cap: CTA_I, beat: 0, say: CAP_BASE[CTA_I].beats[0][0] },
];
{ // ids: running number + era, plus a/b/c/d when the era has more than one line (02-1991a … 21-brand, 22-follow)
  const names = { e91: '1991', e98: '1998', e02: '2002', e07: '2007', e15: '2015', e23: '2023', close: 'closing' };
  let n = 2;
  for (const sc of Object.keys(names)) {
    const ls = VO_LINES.filter((l) => !l.brand && !l.cta && l.scene === sc);
    ls.forEach((l, i) => { l.id = `${String(n++).padStart(2, '0')}-${names[sc]}${ls.length > 1 ? (sc === 'close' ? '-' : '') + 'abcd'[i] : ''}`; });
  }
  VO_LINES.find((l) => l.brand).id = `${n}-brand`;
  VO_LINES.find((l) => l.cta).id = `${n + 1}-follow`;
}
export const VO_EXTS = ['wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'webm'];
export const VO_LEAD = 0.05; // speech starts this long after its caption beat
const GAP = 0.15, CTA_HOLD = 1.2, PAGE_GAP = 0.45, PAGE_OUT = 0.4, TAIL = 0.45, HOOK_TAIL = 0.1;
const EST_CPS = 19.5; // chars per second of a brisk read; only times visual cues for lines that have no VO file yet
const up60 = (x) => Math.ceil(x * 60 - 1e-6) / 60;

// ---------------------------------------------------------------- exported (mutated in place by build)
export const S = {};
export const TR = {};
export const MARKERS = [];
export const HOOK = { arrive: (i) => -0.1 + i * 0.11, lock: (i) => 0.62 + i * 0.1, words: 5, bs0: 0, bs1: 0, styleHz: 12 };
export const YEAR_K = [];
export const LABELS = [];
export const CAPTIONS = [];
export const TERM_CPS = 46;
export const CUE = {
  print1: 0.3, print1Cps: 175, key1: 2.55, scroll: 2.62, print2: 2.72, print2Cps: 230,
  pops98: [0.1, 0.4, 0.55, 0.75, 0.9, 1.05, 1.2, 1.35, 1.5, 1.58, 1.66, 1.75], counter98: 1.35, counterRate98: 7,
  letters02: (i) => 0.15 + i * 0.07, flare02: [1.2, 2.0], tag02: 0.9, load02: [0.6, 3.7], skipShow02: 3.3,
  pull: [0, 1.05], card: (i) => 0.2 + i * 0.08, hops: 6,
  hop(j) { return 1.7 + j * this.hopStep; }, get hopEnd() { return 1.7 + 6 * this.hopStep; },
};
export const VO_PLACE = []; // [{ id, start (abs speech start), dur }]
export const EXT = {};       // per-scene stretch applied (s)
export let DURATION = 0;

function build(vo = {}) {
  // --- per scene: place lines, move later beats behind earlier speech, compute stretch
  const beatAt = CAP_BASE.map((c) => c.beats.map(([, at]) => at));
  const place = [], said = {}; // said[scene][i] = { s: local speech start, d: speech length (measured or estimated) }
  const ext = {}; let closeE1 = 0, closeE = 0;
  for (const sc of ORDER) {
    const lines = VO_LINES.filter((l) => l.scene === sc && !l.brand && !l.cta);
    let prevEnd = null, shift = 0;
    said[sc] = [];
    for (const l of lines) {
      const base = l.cap === undefined ? l.at : CAP_BASE[l.cap].beats[l.beat][1];
      const page = l.beat === 0 && CAP_BASE[l.cap]?.page;
      let start = page ? base : base + shift; // a page's base time is absolute ("not before"), not pushed by earlier lines
      if (prevEnd !== null) start = Math.max(start, prevEnd + (page ? PAGE_GAP : GAP));
      start = up60(start); shift = start - base;
      if (l.cap !== undefined) beatAt[l.cap][l.beat] = start;
      if (sc === 'close' && l.beat === 1) closeE1 = shift;
      const s0 = start + VO_LEAD;
      said[sc].push({ s: s0, d: vo[l.id] > 0 ? vo[l.id] : l.say.length / EST_CPS });
      if (vo[l.id] > 0) { place.push({ id: l.id, scene: sc, local: s0, dur: vo[l.id] }); prevEnd = s0 + vo[l.id]; }
    }
    if (sc === 'close') {
      const arrow = 5.15 + closeE1;
      closeE = up60(closeE1 + Math.max(0, (prevEnd ?? 0) + 0.35 - arrow));
      ext.close = closeE;
    } else {
      ext[sc] = prevEnd === null ? 0 : up60(Math.max(0, prevEnd + (sc === 'hook' ? HOOK_TAIL : TAIL) - OUT_L[sc]));
    }
  }
  // brand line (optional) rides on the wordmark; then the follow call to action; together they set the end card length
  const brand = VO_LINES.find((l) => l.brand), cta = VO_LINES.find((l) => l.cta);
  let ctaAt = CAP_BASE[CTA_I].beats[0][1] + closeE;
  if (vo[brand.id] > 0) {
    const s0 = 6.65 + closeE + 0.1;
    place.push({ id: brand.id, scene: 'close', local: s0, dur: vo[brand.id] });
    ctaAt = Math.max(ctaAt, s0 + vo[brand.id] + 0.25);
  }
  ctaAt = up60(ctaAt); beatAt[CTA_I][0] = ctaAt;
  const ctaDur = vo[cta.id] > 0 ? vo[cta.id] : cta.say.length / EST_CPS;
  if (vo[cta.id] > 0) place.push({ id: cta.id, scene: 'close', local: ctaAt + VO_LEAD, dur: ctaDur });
  const tailExtra = up60(Math.max(0, ctaAt + VO_LEAD + ctaDur + CTA_HOLD - (LEN.close + closeE)));
  // --- scene starts
  let t = 0;
  for (const sc of ORDER) { S[sc] = Math.round(t * 1e6) / 1e6; t += LEN[sc] + (ext[sc] || 0); }
  DURATION = Math.round((t + tailExtra) * 1e6) / 1e6;
  Object.assign(EXT, ext, { closeBeat2: closeE1, tail: tailExtra });
  // --- transitions (anchored to the next scene's start)
  Object.assign(TR, {
    t0: [S.e91 - 0.55, S.e91 + 0.45], t1: [S.e98 - 0.3, S.e98 + 0.3], t2: [S.e02 - 0.3, S.e02 + 0.3],
    t3: [S.e07 - 0.15, S.e07 + 0.4], t4: [S.e15 - 0.45, S.e15 + 0.45], t5: [S.e23 - 0.7, S.e23 + 0.25], t6: [S.close, S.close + 1.1],
  });
  HOOK.bs0 = S.e91 - 0.53; HOOK.bs1 = S.e91 - 0.15;
  MARKERS.length = 0;
  MARKERS.push(['hook', S.hook], ['1991', S.e91], ['1998', S.e98], ['2002', S.e02], ['2007', S.e07], ['2015', S.e15], ['2023', S.e23], ['closing', S.close]);
  YEAR_K.length = 0;
  YEAR_K.push([0, 1991], [TR.t1[0], 1991], [TR.t1[1], 1998, ease.inOutCubic], [TR.t2[0], 1998], [TR.t2[1], 2002, ease.inOutCubic],
    [TR.t3[0] + 0.02, 2002], [TR.t3[1], 2007, ease.outCubic], [TR.t4[0], 2007], [TR.t4[1], 2015, ease.inOutCubic],
    [TR.t5[0], 2015], [TR.t5[1], 2023, ease.inOutCubic]);
  LABELS.length = 0;
  LABELS.push([S.e91, 'Web teks'], [S.e98, 'Web yang ramai'], [S.e02, 'Splash page'], [S.e07, 'Web 2.0'], [S.e15, 'Flat design'], [S.e23, 'Terasa pas']);
  // --- in-scene cues that follow a stretch
  const x02 = ext.e02 || 0, E = closeE;
  const word = (sc, i, f) => said[sc][i].s + f * said[sc][i].d; // a point inside a spoken line (f = 0 … 1)
  Object.assign(CUE, {
    cursor02: [3.9 + x02, 5.0 + x02], hover02: 5.0 + x02, click02: 5.5 + x02,
    // 2007: a newcomer's cursor wanders while "masih asing sama layar" is said, labels pop on the button line,
    // and the glossy button is pressed on "dipencet"
    wander07: word('e07', 1, 0), tags07: word('e07', 2, 0), press07: word('e07', 2, 0.86),
    // 2015 (e15-local; site0715 runs on e07-local time, hence off15): a confident tap, a scroll, a flat button that works
    off15: S.e15 - S.e07, tap15: word('e15', 2, 0.35), tap15b: word('e15', 3, 0.5),
    // 2023: live data ticks over during "terasa pas", the page shows what it knows about you, the one tap lands on "tap"
    queue23: word('e23', 1, 0.6), know23: word('e23', 2, 0), tap23: word('e23', 3, 0.9),
    closeE: E, closeBeat2: 3.2 + closeE1,
    // the selection ring keeps hopping for as long as the first closing line is spoken
    hopStep: 0.36 * Math.max(1, (3.2 + closeE1 + 0.66 - 1.7) / 2.16),
    // end card: the Follow pill pops with the line and gets tapped as it finishes
    cta: ctaAt, ctaTap: ctaAt + VO_LEAD + 0.9 * ctaDur,
    arrow: [5.15 + E, 6.05 + E], absorb: (i) => 5.22 + E + i * 0.04, arcs: 5.95 + E, land: 6.05 + E, wordmark: 6.65 + E,
  });
  // --- captions
  const outs = { e91: TR.t1[0], e98: TR.t2[0], e02: TR.t3[0] - 0.05, e07: TR.t4[0], e15: TR.t5[0], e23: S.close + 0.05, close: S.close + 5.15 + E };
  CAPTIONS.length = 0;
  CAP_BASE.forEach((c, ci) => {
    const { beats, ...rest } = c, next = CAP_BASE[ci + 1];
    const out = c.cta ? DURATION + 1 : next?.page && next.scene === c.scene ? S[c.scene] + beatAt[ci + 1][0] - PAGE_OUT : outs[c.scene];
    CAPTIONS.push({ ...rest, t0: S[c.scene], beats: beats.map(([tx], bi) => [tx, beatAt[ci][bi]]), out });
  });
  // --- absolute VO placement
  VO_PLACE.length = 0;
  for (const p of place) VO_PLACE.push({ id: p.id, start: S[p.scene] + p.local, dur: p.dur });
}

// durations: { '<id>': seconds of speech } — missing ids are simply not voiced
export function applyVO(durations = {}) { build(durations); }
build();
