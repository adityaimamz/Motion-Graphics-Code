// timeline.js — the single source of timing for pictures (scenes/*, ui.js), sound (audio.js) and the renderer.
// Built from a base design plus voice-over durations: a scene is as long as its narration needs (plus its own
// action), so a longer TTS line stretches its scene and everything after it moves. Big moments are snapped to the
// beat grid of their act (8th notes), so they stay on the beat however long the VO is.
// Objects are mutated in place by build(); modules that imported them see the new values. All times in seconds.
import { clamp } from './core.js';

// ---------------------------------------------------------------- acts (one tempo each)
export const BPM = { slow: 90, battle: 135 };
const BEAT = { slow: 60 / BPM.slow, battle: 60 / BPM.battle };

// ---------------------------------------------------------------- scenes, in order
// len   minimum length (s)
// vo    voice-over line id; at = local time the speech starts
// after minimum time between end of speech (or of the dialog bubble) and the end of the scene
// dlg   a speech bubble shown after the narration, in the gap before the next line
const SCENES = [
  { id: 'karam', act: 'karam', grid: 'slow', len: 2.6, vo: '01-karam', at: 0.03, after: 0.6 },
  { id: 'bayu', act: 'sore', grid: 'slow', len: 4.4, vo: '02-bayu', at: 0.15, after: 0.35 },
  { id: 'merem', act: 'sore', grid: 'slow', len: 3.6, vo: '03-merem', at: 0.1, after: 0.25, dlg: { who: 'kursor', text: 'siap, bos!' } },
  { id: 'muat', act: 'sore', grid: 'slow', len: 5.0, vo: '04-muat', at: 0.1, after: 1.55 },
  { id: 'malam', act: 'malam', grid: 'slow', len: 4.0, vo: '05-malam', at: 0.35, after: 0.1, dlg: { who: 'bayu', text: 'kok basah?' } },
  { id: 'peti', act: 'malam', grid: 'slow', len: 4.0, vo: '06-peti', at: 0.15, after: 0.2, dlg: { who: 'kursor', text: 'itu fitur, bos.' } },
  { id: 'pangkat', act: 'pangkat', grid: 'slow', len: 4.0, vo: '07-pangkat', at: 0.25, after: 0.6 },
  { id: 'baca', act: 'pangkat', grid: 'slow', len: 4.5, vo: '08-melek', at: 0.1, after: 0.75 },
  { id: 'kraken', act: 'tempur', grid: 'battle', len: 1.8 },
  { id: 'konteks', act: 'tempur', grid: 'battle', len: 4.0, vo: '09-item', at: 0.3, after: 0.2, dlg: { who: 'kursor', text: 'oh, gitu maksudnya.' } },
  { id: 'kecil', act: 'tempur', grid: 'battle', len: 4.0, vo: '10-serang', at: 0.3, after: 0.75 },
  { id: 'tes', act: 'tempur', grid: 'battle', len: 4.0, vo: '11-cek', at: 0.25, after: 1.0 },
  { id: 'commit', act: 'tempur', grid: 'battle', len: 4.0, vo: '12-simpan', at: 0.25, after: 0.7 },
  { id: 'ulangi', act: 'tempur', grid: 'battle', len: 4.4, vo: '13-ulangi', at: 0.1, after: 0.55 },
  { id: 'layar', act: 'fajar', grid: 'slow', len: 6.0, vo: '14-layar', at: 0.2, after: 3.5 }, // room for the sail swap + the hat
  { id: 'santai', act: 'fajar', grid: 'slow', len: 2.8, vo: '15-santai', at: 0.1, after: 0.75 },
  { id: 'closing', act: 'closing', grid: 'slow', len: 5.6 }, // VO 16 is placed at the call to action
];
export const SCENE_IDS = SCENES.map((s) => s.id);

// ---------------------------------------------------------------- voice-over lines (one file per line)
// say  = exact transcript (numbers as words); the pictures are timed against it
// el   = the same words with ElevenLabs v4 audio tags in [brackets] (tags are performed, not spoken)
// card = the explainer card: [label, one short line, rule number or 0]. The card is the only sentence on screen.
export const VO_LINES = [
  { id: '01-karam', scene: 'karam', say: 'Aplikasinya rusak... Di hari pertama rilis.',
    el: '[dry, deadpan] Aplikasinya rusak... Di hari pertama rilis.', style: 'dry, dramatic, deadpan', card: null },
  { id: '02-bayu', scene: 'bayu', say: 'Ini Bayu. Dia vibe coder: bikin aplikasi dengan ngobrol sama AI, tanpa nulis kodenya sendiri.',
    el: '[playful, upbeat] Ini Bayu. Dia vibe coder: bikin aplikasi dengan ngobrol sama AI, tanpa nulis kodenya sendiri.',
    style: 'playful, upbeat, a little cocky', card: ['VIBE CODER', 'ngobrol sama AI, AI yang ngoding', 0] },
  { id: '03-merem', scene: 'merem', say: 'Saking percayanya sama AI, kodenya nggak pernah Bayu baca. Ngoding sambil merem. Literally.',
    el: '[teasing] Saking percayanya sama AI, kodenya nggak pernah Bayu baca. [deadpan] Ngoding sambil merem. Literally.',
    style: 'playful, dry, a little cocky', card: ['NGODING SAMBIL MEREM', 'kode AI nggak pernah dibaca', 0] },
  { id: '04-muat', scene: 'muat', say: 'Kode dari AI? Diterima semua. Nggak dibaca, nggak dites. Langsung dirilis.',
    el: '[casual, picking up speed] Kode dari AI? Diterima semua. Nggak dibaca, nggak dites. Langsung dirilis.',
    style: 'playful, upbeat, getting faster', card: ['TERIMA SEMUA', 'nggak dibaca · nggak dites', 0] },
  { id: '05-malam', scene: 'malam', say: 'Tengah malam... laporan error berdatangan. Tiga puluh delapan bug sekaligus.',
    el: '[quiet, suspenseful] Tengah malam... [flustered] laporan error berdatangan. Tiga puluh delapan bug sekaligus.',
    style: 'suspenseful pause, then flustered', card: ['BUG: 38', 'tengah malam, error di mana-mana', 0] },
  { id: '06-peti', scene: 'peti', say: 'Bug itu kesalahan di kode. Semuanya sembunyi di fungsi yang nggak Bayu baca.',
    el: '[dry, matter-of-fact] Bug itu kesalahan di kode. [wry] Semuanya sembunyi di fungsi yang nggak Bayu baca.',
    style: 'dry, wry, clear', card: ['BUG', '= kesalahan di dalam kode', 0] },
  { id: '07-pangkat', scene: 'pangkat', say: 'Tapi tiap bug itu pelajaran. Bayu naik pangkat, dan belajar lima aturan.',
    el: '[hopeful, rising energy] Tapi tiap bug itu pelajaran. Bayu naik pangkat, dan belajar lima aturan.',
    style: 'hopeful, rising energy', card: ['NAIK PANGKAT', 'tiap bug = pelajaran', 0] },
  { id: '08-melek', scene: 'baca', say: 'Satu: baca dulu. Periksa setiap baris yang ditulis AI, sebelum kamu terima.',
    el: '[clear, confident] Satu: baca dulu. Periksa setiap baris yang ditulis AI, sebelum kamu terima.',
    style: 'clear, confident, instructional, short pauses', card: ['BACA DULU', 'periksa sebelum diterima', 1] },
  { id: '09-item', scene: 'konteks', say: 'Dua: kasih AI konteks. Tujuan aplikasinya, aturannya, dan contoh kode. Jangan suruh dia menebak.',
    el: '[clear, confident] Dua: kasih AI konteks. Tujuan aplikasinya, aturannya, dan contoh kode. [lightly teasing] Jangan suruh dia menebak.',
    style: 'clear, confident, instructional, short pauses', card: ['KASIH KONTEKS', 'tujuan · aturan · contoh kode', 2] },
  { id: '10-serang', scene: 'kecil', say: 'Tiga: kasih satu perintah kecil setiap kali. Kalau ada yang salah, gampang ketahuan di mana.',
    el: '[clear, confident] Tiga: kasih satu perintah kecil setiap kali. Kalau ada yang salah, gampang ketahuan di mana.',
    style: 'clear, confident, instructional, short pauses', card: ['PERINTAH KECIL', 'satu tugas, satu prompt', 3] },
  { id: '11-cek', scene: 'tes', say: 'Empat: cek pakai tes, yaitu kode yang memeriksa aplikasimu secara otomatis. Ada yang rusak, langsung ketahuan.',
    el: '[clear, confident] Empat: cek pakai tes, yaitu kode yang memeriksa aplikasimu secara otomatis. Ada yang rusak, langsung ketahuan.',
    style: 'clear, confident, instructional, short pauses', card: ['CEK PAKAI TES', 'tes = pemeriksa otomatis', 4] },
  { id: '12-simpan', scene: 'commit', say: 'Lima: lolos tes? Simpan versinya, namanya commit. Kalau nanti berantakan, tinggal balik ke versi ini.',
    el: '[clear, confident] Lima: lolos tes? Simpan versinya, namanya commit. Kalau nanti berantakan, tinggal balik ke versi ini.',
    style: 'clear, confident, instructional, short pauses', card: ['COMMIT', 'titik aman untuk balik', 5] },
  { id: '13-ulangi', scene: 'ulangi', say: 'Ulangi langkah ini untuk setiap tugas, sampai bug-nya habis.',
    el: '[energetic, building momentum] Ulangi langkah ini untuk setiap tugas, sampai bug-nya habis.',
    style: 'energetic, building momentum', card: ['ULANGI', 'tiap tugas, sampai bug habis', 0] },
  { id: '14-layar', scene: 'layar', say: 'Vibe coder menerima semua kode AI. Vibe engineer memeriksanya dulu. Itu bedanya.',
    el: '[calm, clear contrast] Vibe coder menerima semua kode AI. Vibe engineer memeriksanya dulu. [warm] Itu bedanya.',
    style: 'triumphant, calm, clear contrast between the two sentences', card: null }, // two-phase card, built below
  { id: '15-santai', scene: 'santai', say: 'Tetap santai pakai AI. Tapi nggak asal.',
    el: '[relaxed, warm] Tetap santai pakai AI. [slower] Tapi nggak asal.',
    style: 'triumphant, calm, slow down on the last line', card: ['NEW GAME+', 'santai, tapi nggak asal', 0] },
  { id: '16-follow', scene: 'closing', say: 'Follow, biar naik pangkat bareng.',
    el: '[warm, friendly] Follow, biar naik pangkat bareng.', style: 'warm, friendly invitation', card: null },
];
export const VOICE_DESIGN = 'Young Indonesian male narrator in his late 20s, warm mid-range voice, light playful tone, '
  + 'casual Jakarta Indonesian accent, steady medium pace like a friendly tech content creator.';
export const VO_EXTS = ['wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'webm'];
const EST_CPS = 15;             // chars per second, only used while a line has no VO file yet
const PAUSE_DOTS = 0.35;        // "..." costs this much extra in the estimate
const DLG_GAP = 0.15, DLG_DUR = 0.85; // speech bubble: starts after the narration, stays this long
const CTA_HOLD = 1.4;           // end card holds ≥ 1.2 s after the last line (STYLE.md §1)
const up16 = (x, beat) => Math.ceil(x / (beat / 4) - 1e-6) * (beat / 4);
const r6 = (x) => Math.round(x * 1e6) / 1e6;
export const estimate = (line) => line.say.length / EST_CPS + (line.say.split('...').length - 1) * PAUSE_DOTS;
// a VO entry is seconds, or { dur, gaps } as measured by vo.js
const voDur = (x) => (typeof x === 'number' ? x : x?.dur ?? 0);
// Word timing from the real pauses: a steady narrator still stops longer after "Satu:" or "lolos tes?" than the
// character count says. The longest pauses are matched first, each to the nearest free punctuation that keeps the
// order; the text before the mark ends where the pause starts, the next word starts where it ends.
// Returns [charFrac, timeFrac] pairs, sorted.
function warpOf(say, d, gaps = []) {
  const L = say.length, marks = [], pick = new Map(); // mark index → gap
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
export const S = {};        // S[id] = { id, act, t0, t1, len, vo: { id, s, d, e, real } | null, dlg }
export const CUE = {};      // CUE[id] = { ...absolute times of the moments inside that scene }
export const ACTS = [];     // [{ id, t0, t1, bpm, beat }]
export const CARDS = [];    // explainer cards: [{ scene, label, line, num, s, e }]
export const DLG = [];      // speech bubbles: [{ scene, who, text, s, e }]
export const VO_PLACE = []; // [{ id, start, dur }] — only lines that have a file
export const MARKERS = [];  // [name, t] for the preview
export const STILLS = [];   // [name, t] key frames for `npm run stills`
export const SLOT_AT = [];  // time each of the five rule slots fills
export const TRANS = [];    // wipes over cuts: [{ from, to, at, kind, d }] (film.js draws them, audio.js voices them)
export let DURATION = 0;

const actOf = (id) => ACTS.find((a) => a.id === S[id].act);

function build(vo = {}) {
  for (const k of Object.keys(S)) delete S[k];
  for (const k of Object.keys(CUE)) delete CUE[k];
  ACTS.length = 0; CARDS.length = 0; DLG.length = 0; VO_PLACE.length = 0; MARKERS.length = 0; STILLS.length = 0; SLOT_AT.length = 0; TRANS.length = 0;

  // --- scene lengths from the narration
  let t = 0;
  for (const sc of SCENES) {
    const line = VO_LINES.find((l) => l.id === sc.vo);
    const beat = BEAT[sc.grid];
    let act = ACTS.find((a) => a.id === sc.act);
    if (!act) { act = { id: sc.act, t0: t, t1: t, bpm: BPM[sc.grid], beat }; ACTS.push(act); }
    let need = sc.len, v = null, dlg = null;
    if (line && sc.id !== 'closing') {
      const real = voDur(vo[line.id]) > 0, d = real ? voDur(vo[line.id]) : estimate(line);
      v = { id: line.id, s: t + sc.at, d, e: t + sc.at + d, real, warp: real ? warpOf(line.say, d, vo[line.id].gaps) : null, gaps: vo[line.id]?.gaps?.length ?? 0 };
      let tail = sc.at + d;
      if (sc.dlg) { dlg = { scene: sc.id, ...sc.dlg, s: v.e + DLG_GAP, e: v.e + DLG_GAP + DLG_DUR }; tail += DLG_GAP + DLG_DUR; }
      need = Math.max(need, tail + sc.after);
    }
    const len = up16(need, beat);
    S[sc.id] = { id: sc.id, act: sc.act, t0: r6(t), t1: r6(t + len), len: r6(len), vo: v, dlg };
    if (dlg) DLG.push(dlg);
    t += len; act.t1 = r6(t);
  }
  // --- helpers for cues
  const L = (id, x) => S[id].t0 + x;
  const E = (id, x) => S[id].t1 - x;
  const w = (id, f) => S[id].vo.s + f * S[id].vo.d;
  // time a word is spoken: its share of the characters, pinned to the measured pauses (warpOf)
  const at = (id, str, f = 0) => {
    const line = VO_LINES.find((l) => l.id === S[id].vo.id), i = line.say.indexOf(str);
    if (i < 0) throw new Error(`cue word "${str}" not in ${line.id}`);
    return w(id, warp(S[id].vo.warp, (i + f * str.length) / line.say.length));
  };
  const snap = (id, x, div = 2) => { const a = actOf(id), q = a.beat / div; return clamp(a.t0 + Math.round((x - a.t0) / q) * q, S[id].t0, S[id].t1); };
  const hb = (id) => actOf(id).beat / 2;
  const bt = (id) => actOf(id).beat;

  // S1 · karam: the app sinks, then everything rewinds to the afternoon before
  { const id = 'karam', l2 = at(id, 'Di hari');
    CUE[id] = { line2: l2, pop: snap(id, l2), rw: [E(id, 0.62), E(id, 0)] }; }
  // S2 · bayu: wide on the harbour, cut to the close-up on "Bayu"
  { const id = 'bayu', cut = at(id, 'Bayu', 0.2);
    CUE[id] = { cut, tagBayu: cut + 0.08, ask: at(id, 'bikin'), tagAI: at(id, 'AI'), type: at(id, 'tanpa'), glyphs: [at(id, 'ngobrol'), E(id, 0.1)] }; }
  // S3 · merem
  { const id = 'merem';
    CUE[id] = { sip: at(id, 'Saking', 0.6), wave: [at(id, 'Ngoding'), at(id, 'Literally', 0.9)], thumb: snap(id, at(id, 'Literally')), cut: E(id, 0) }; }
  // S4 · muat: slap the button, crates land on the beat, the stamp, then the wide departure into the night
  { const id = 'muat', b = bt(id);
    const slap = snap(id, at(id, 'Diterima')), stamp = snap(id, at(id, 'Langsung'));
    const sp = Math.max(b / 4, Math.min(b / 2, Math.floor((stamp - slap - b / 2) / 6 / (b / 4)) * (b / 4)));
    const crates = Array.from({ length: 6 }, (_, i) => slap + b / 2 + i * sp);
    const cutB = stamp + 0.55;
    CUE[id] = { slap, crates, stamp, cutB, bell: cutB + 0.08, depart: cutB + 0.3, sunset: [E(id, 0.9), E(id, 0)] }; }
  // S5 · malam: the wide sails on, then the cut-away hold; one leak per bug report
  { const id = 'malam', s0 = snap(id, at(id, 'laporan')), s1 = at(id, 'sekaligus', 1);
    CUE[id] = { flip: at(id, 'malam'), clockOut: at(id, 'laporan') - 0.05, spout0: s0, holes: Array.from({ length: 38 }, (_, i) => s0 + (s1 - s0) * Math.pow(i / 37, 0.55)) }; }
  // S6 · peti: what a bug is (one red line), then the unread functions crack open
  { const id = 'peti', b = bt(id), crack = snap(id, at(id, 'sembunyi'));
    CUE[id] = { panel: at(id, 'kesalahan'), redLine: snap(id, at(id, 'di kode')), crack, burst: [crack, crack + b / 2, crack + b], swarm: [crack, E(id, 0)], unread: at(id, 'nggak Bayu') }; }
  // S7 · pangkat: the game pauses, every bug becomes XP, rank up, five empty rule slots
  { const id = 'pangkat', x0 = w(id, 0.08), x1 = at(id, 'Bayu naik');
    CUE[id] = { pause: L(id, 0), xp: Array.from({ length: 24 }, (_, i) => x0 + (x1 - x0) * (i / 23)), full: x1, costume: snap(id, at(id, 'pangkat')), slots: snap(id, at(id, 'lima aturan')), resume: E(id, 0.45) }; }
  // S8 · baca: eyes open + glasses on "baca dulu"; the magnifier walks the lines; the bad line is flicked out
  { const id = 'baca', eyes = snap(id, at(id, 'baca dulu'));
    CUE[id] = { eyes, glasses: eyes + 0.18, read: [at(id, 'Periksa'), at(id, 'sebelum')], flag: at(id, 'ditulis'), flick: snap(id, at(id, 'sebelum', 0.5)), accept: snap(id, Math.max(snap(id, at(id, 'sebelum', 0.5)) + 0.9, S[id].vo.e - 0.1)) }; }
  SLOT_AT.push(CUE.baca.glasses);
  // S9 · kraken
  { const id = 'kraken';
    CUE[id] = { rumble: L(id, 0), rise: [L(id, 0.25), L(id, 0.95)], roar: snap(id, L(id, 0.95)), ui: [L(id, 1.0), L(id, 1.4)] }; } // a rumble first, then it rises
  // S10 · konteks: the vague prompt fails, three context items tick in, the guess is replaced by the right block
  { const id = 'konteks', tick = [at(id, 'Tujuan'), at(id, 'aturannya'), at(id, 'contoh kode')];
    CUE[id] = { bad: L(id, 0.05), plus: snap(id, at(id, 'konteks')), panel: tick[0] - 0.12, ticks: tick.map((x) => snap(id, x)), lamp: snap(id, at(id, 'contoh kode', 1)), guess: at(id, 'Jangan'), good: snap(id, at(id, 'menebak', 0.6)) }; }
  SLOT_AT.push(CUE.konteks.plus);
  // S11 · kecil: one giant prompt explodes, then three small ones hit one tentacle each
  { const id = 'kecil', h = hb(id), boom = snap(id, at(id, 'perintah kecil'));
    const f0 = snap(id, at(id, 'setiap kali')), f2 = snap(id, at(id, 'di mana')), gap = Math.max(h * 2, (f2 - f0) / 2);
    const fires = [f0, f0 + gap, f0 + gap * 2];
    CUE[id] = { roll: [L(id, 0.05), boom - 0.45], bigFire: boom - 0.45, boom, plus: boom + h, fires, hits: fires.map((f) => f + h * 1.5) }; }
  SLOT_AT.push(CUE.kecil.plus);
  // S12 · tes: the shield, rows check themselves, one goes red, Kursor fixes it, 3/3
  { const id = 'tes', b = bt(id), sh = snap(id, at(id, 'tes'));
    const r0 = snap(id, at(id, 'yaitu')), bad = snap(id, at(id, 'rusak'));
    CUE[id] = { shield: sh, rows: [r0, r0 + b / 2, r0 + b], bad, fix: Math.max(bad + b, S[id].vo.e), done: Math.max(bad + b, S[id].vo.e) + b / 2 }; }
  SLOT_AT.push(CUE.tes.shield);
  // S13 · commit: the save crystal, a wave makes a mess, the rewind back to the crystal
  { const id = 'commit', h = hb(id), crystal = snap(id, at(id, 'Simpan'));
    const wave = snap(id, at(id, 'berantakan')), back = snap(id, at(id, 'tinggal balik'));
    CUE[id] = { crystal, label: at(id, 'commit'), wave, mess: [wave, wave + h * 2], back: [Math.max(back, wave + h * 3), Math.max(back, wave + h * 3) + 0.55] }; }
  SLOT_AT.push(CUE.commit.crystal);
  // S14 · ulangi: three laps of the five rules, one tentacle per lap... the rest flee; night → dawn
  { const id = 'ulangi', h = hb(id), m0 = snap(id, L(id, 0.12));
    const steps = Array.from({ length: 15 }, (_, j) => m0 + j * h);
    CUE[id] = { m0, h, steps, hits: [steps[2] + h * 0.5, steps[7] + h * 0.5, steps[12] + h * 0.5], crystals: [steps[4], steps[9], steps[14]], flee: [steps[14] + h, steps[14] + h + 0.5], dawn: [m0, E(id, 0)] }; }
  // S15 · layar: split screen during the line, then the sail is swapped and the captain's hat passes
  { const id = 'layar', b = bt(id), ve = S[id].vo.e, cut = ve + 0.15;
    const drop = snap(id, cut + 0.3), unfurl = snap(id, drop + b);
    CUE[id] = { coder: S[id].vo.s, engineer: at(id, 'Vibe engineer'), both: at(id, 'Itu bedanya'), cut, tiltUp: [cut, cut + 0.3], drop, unfurl, tiltDown: [unfurl + 0.45, unfurl + 0.85], hat: snap(id, unfurl + 0.9) }; }
  // S16 · santai
  { const id = 'santai', ve = S[id].vo.e;
    CUE[id] = { sip: at(id, 'santai'), lanjut: ve + 0.12, select: S[id].t1 }; }
  // S17 · closing (C = start, the iris is already closing)
  { const id = 'closing', C = S[id].t0, lock = snap(id, C + 1.6);
    const line = VO_LINES.find((l) => l.id === '16-follow'), real = voDur(vo[line.id]) > 0, d = real ? voDur(vo[line.id]) : estimate(line);
    const cta = lock + 0.9;
    S[id].vo = { id: line.id, s: cta + 0.05, d, e: cta + 0.05 + d, real };
    const end = Math.max(S[id].t1, S[id].vo.e + CTA_HOLD);
    S[id].t1 = r6(end); S[id].len = r6(end - C); ACTS[ACTS.length - 1].t1 = S[id].t1;
    CUE[id] = { iris: [C, C + 0.5], ring: [C + 0.3, C + 1.3], arrow: [C + 0.9, lock], lock, wordmark: lock + 0.3, cta, tap: S[id].vo.e - 0.05 }; }
  DURATION = S.closing.t1;
  // --- wipes over the cuts between places and between the rules (forward, left → right); into battle: the strips
  const tr = (from, to, kind = 'wipe', d = 0.13) => TRANS.push({ from, to, at: S[to].t0, kind, d });
  tr('merem', 'muat'); tr('malam', 'peti'); tr('pangkat', 'baca'); tr('baca', 'kraken', 'battle', 0.2);
  tr('kraken', 'konteks'); tr('konteks', 'kecil'); tr('kecil', 'tes'); tr('tes', 'commit'); tr('commit', 'ulangi'); tr('ulangi', 'layar'); tr('layar', 'santai');

  // --- explainer cards: appear as the line starts, stay until the scene ends
  for (const line of VO_LINES) {
    if (!line.card) continue;
    const sc = S[line.scene], [label, text, num] = line.card;
    const e = line.scene === 'muat' ? CUE.muat.cutB + 0.6 : line.scene === 'santai' ? CUE.santai.lanjut - 0.02 : sc.t1 - 0.08;
    CARDS.push({ scene: line.scene, label, line: text, num, s: sc.vo.s - 0.1, e });
  }
  { const C = CUE.layar; // the difference, in two halves
    CARDS.push({ scene: 'layar', label: 'VIBE CODER', line: 'terima semua kode AI', num: 0, s: C.coder - 0.1, e: C.engineer - 0.04, side: 0 });
    CARDS.push({ scene: 'layar', label: 'VIBE ENGINEER', line: 'periksa dulu, baru terima', num: 0, s: C.engineer - 0.04, e: C.cut, side: 1 }); }
  CARDS.sort((a, b) => a.s - b.s);
  // --- VO placement (only lines that have a file)
  for (const line of VO_LINES) { const v = S[line.scene].vo; if (v?.real) VO_PLACE.push({ id: line.id, start: v.s, dur: v.d }); }
  // --- markers + key frames
  for (const id of SCENE_IDS) MARKERS.push([id, S[id].t0]);
  const C = CUE;
  STILLS.push(
    ['s01-karam', 0.6], ['s01-rewind', (C.karam.rw[0] + C.karam.rw[1]) / 2],
    ['s02-dermaga', S.bayu.t0 + 0.3], ['s02-bayu', C.bayu.type + 0.3], ['s03-merem', C.merem.thumb + 0.15], ['s03-dialog', S.merem.dlg.s + 0.4],
    ['s04-tombol', C.muat.crates[3] + 0.1], ['s04-rilis', C.muat.stamp + 0.25], ['s04-berangkat', C.muat.depart + 0.5],
    ['s05-malam', C.malam.flip + 0.2], ['s05-bocor', C.malam.holes[30]], ['s05-dialog', S.malam.dlg.s + 0.4],
    ['s06-bug', C.peti.redLine + 0.3], ['s06-peti', C.peti.burst[2] + 0.5], ['s06-dialog', S.peti.dlg.s + 0.4],
    ['s07-xp', (C.pangkat.xp[8] + C.pangkat.xp[16]) / 2], ['s07-pangkat', C.pangkat.slots + 0.4],
    ['s08-baca', C.baca.glasses + 0.3], ['s08-periksa', C.baca.flag + 0.3], ['s08-sentil', C.baca.flick + 0.15],
    ['s09-kraken', S.kraken.t1 - 0.1], ['s10-tebak', C.konteks.bad + 0.5], ['s10-konteks', C.konteks.ticks[2] + 0.3], ['s10-dialog', S.konteks.dlg.s + 0.4],
    ['s11-besar', C.kecil.boom + 0.12], ['s11-kecil', C.kecil.hits[1] + 0.05],
    ['s12-tes', C.tes.rows[2] + 0.2], ['s12-merah', C.tes.bad + 0.2], ['s12-lolos', C.tes.done + 0.3],
    ['s13-commit', C.commit.label + 0.3], ['s13-berantakan', C.commit.mess[1] - 0.1], ['s13-balik', C.commit.back[1] + 0.1],
    ['s14-ulangi', C.ulangi.steps[8]], ['s14-kabur', C.ulangi.flee[0] + 0.3],
    ['s15-coder', (C.layar.coder + C.layar.engineer) / 2], ['s15-engineer', (C.layar.engineer + C.layar.both) / 2], ['s15-layar', C.layar.unfurl + 0.35], ['s15-topi', C.layar.hat + 0.3],
    ['s16-santai', C.santai.sip + 0.2], ['s16-lanjut', C.santai.lanjut + 0.4],
    ['s17-cincin', C.closing.ring[0] + 0.6], ['s17-kunci', C.closing.lock + 0.05], ['s17-follow', C.closing.tap - 0.1], ['s17-akhir', DURATION - 0.02],
  );
}

// ---------------------------------------------------------------- queries used by scenes and audio
export function sceneAt(t) {
  for (let i = SCENE_IDS.length - 1; i >= 0; i--) if (t >= S[SCENE_IDS[i]].t0) return SCENE_IDS[i];
  return SCENE_IDS[0];
}
// position on the act's beat grid
export function beatAt(t) {
  const a = ACTS.find((x) => t >= x.t0 && t < x.t1) ?? ACTS[ACTS.length - 1];
  const b = (t - a.t0) / a.beat;
  return { act: a.id, beat: a.beat, n: Math.floor(b), ph: b - Math.floor(b) };
}
// rank: 0 penumpang, 1 awak, 2 kapten
export const rankAt = (t) => (t >= CUE.layar.hat ? 2 : t >= CUE.pangkat.costume ? 1 : 0);
// rule slots filled so far (0..5); slots are shown from the rank-up on
export const slotsAt = (t) => SLOT_AT.filter((x) => t >= x).length;
// time of day: 0 sore, 1 malam, 2 fajar — steps in fifths (palette swap), never smooth
export function todAt(t) {
  const q = (x) => Math.floor(clamp(x) * 5) / 5;
  const [r0, r1] = CUE.karam.rw, [s0, s1] = CUE.muat.sunset, [d0, d1] = CUE.ulangi.dawn;
  if (t < S.bayu.t0) return 1 - q((t - r0) / (r1 - r0));
  if (t < s0) return 0;
  if (t < d0) return q((t - s0) / (s1 - s0));
  if (t < S.layar.t0) return 1 + q((t - d0) / (d1 - d0));
  return 2;
}

// durations: { '<id>': seconds of speech } — missing ids are estimated and not voiced
export function applyVO(durations = {}) { build(durations); }
build();
