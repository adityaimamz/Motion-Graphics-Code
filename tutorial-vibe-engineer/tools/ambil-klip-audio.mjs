#!/usr/bin/env node
// ambil-klip-audio.mjs — rewrites assets/ve/klip/*.wav WITHOUT the first video's narrator.
// The clips were first cut from the final MP4, so they carried the old voice too ("…tapi nggak asal" was audible over the
// new narration). Here the first video's soundtrack is rendered again with its own code (read-only: nothing in
// ../vibe-engineer is touched) using the real voice-over timing and the real ducking, but with the voice itself silent.
// The level is matched to the original mix: the final loudness stage normalises the whole bed *including* the voice, so a
// voice-free render comes out louder; the gain between the two renders is measured where no voice is near and applied.
// The clips are then cut from that stem exactly like before. Run once after `npm run aset` (or when the clip list changes).
//   node tools/ambil-klip-audio.mjs
import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { A } from '../src/artefak.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VE = path.resolve(ROOT, '..', 'vibe-engineer');
const KLIP = path.join(ROOT, 'assets/ve/klip'), OUT = path.join(ROOT, 'out');
const SR = 48000;
const imp = (rel) => import(pathToFileURL(path.join(VE, rel)).href);
const run = (args) => new Promise((ok, bad) => spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] }).on('close', (c) => (c ? bad(new Error('ffmpeg ' + c)) : ok())));
const decode = (file) => new Promise((ok, bad) => {
  const p = spawn('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const chunks = []; p.stdout.on('data', (d) => chunks.push(d));
  p.on('close', (c) => { if (c) return bad(new Error('cannot decode ' + file)); const b = Buffer.concat(chunks); ok(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)))); });
});

if (!existsSync(VE)) throw new Error('folder vibe-engineer/ tidak ada');
const { matchFiles, analyse } = await imp('src/vo.js');
const T = await imp('src/timeline.js'), AU = await imp('src/audio.js');
const names = await readdir(path.join(VE, 'vo')), voice = {};
for (const [id, f] of Object.entries(matchFiles(names))) {
  const data = await decode(path.join(VE, 'vo', f)), a = analyse(data, SR);
  if (a) voice[id] = { data, file: f, ...a };
}
T.applyVO(Object.fromEntries(Object.entries(voice).map(([id, v]) => [id, { dur: v.dur, gaps: v.gaps ?? [] }])));
const silent = Object.fromEntries(Object.entries(voice).map(([id, v]) => [id, { ...v, data: new Float32Array(v.data.length) }]));
console.log(`vibe-engineer: ${Object.keys(voice).length} baris VO, ${T.DURATION.toFixed(1)} s`);
const full = AU.renderAudio({ vo: voice }), sil = AU.renderAudio({ vo: silent });

// gain between the two renders, measured where no voice is near
const far = (t) => T.VO_PLACE.every((p) => t < p.start - 0.9 || t > p.start + p.dur + 1.0);
let xy = 0, yy = 0, xx = 0, n = 0;
for (let i = 0; i < full.L.length; i += 3) { if (!far(i / SR)) continue; xy += full.L[i] * sil.L[i]; yy += sil.L[i] * sil.L[i]; xx += full.L[i] * full.L[i]; n++; }
if (n * 3 < SR * 2) throw new Error('terlalu sedikit bagian bebas suara untuk mencocokkan level');
const k = xy / yy, corr = xy / Math.sqrt(xx * yy);
console.log(`level: gain ${k.toFixed(3)} (${(20 * Math.log10(k)).toFixed(1)} dB), korelasi di bagian bebas suara ${corr.toFixed(4)} (${(n * 3 / SR).toFixed(1)} s)`);
if (corr < 0.98) throw new Error('render ulang tidak cocok dengan mix asli (korelasi rendah): kode audio vibe-engineer berubah sejak MP4 final?');
for (const ch of [sil.L, sil.R]) for (let i = 0; i < ch.length; i++) ch[i] *= k;

await mkdir(OUT, { recursive: true });
const stem = path.join(OUT, '.stem-ve-tanpa-suara.wav');
await writeFile(stem, AU.toWav(sil));
// keep the old (voiced) clips once, for comparison
const old = path.join(OUT, 'klip-lama-bersuara'); await mkdir(old, { recursive: true });
for (const [name, c] of Object.entries(A.video.clips)) {
  if (!c.audio) continue;
  const f = path.join(KLIP, `${name}.wav`), o = path.join(old, `${name}.wav`);
  if (existsSync(f) && !existsSync(o)) await copyFile(f, o);
  await run(['-v', 'error', '-y', '-ss', String(c.from), '-t', String(c.d), '-i', stem, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', f]);
}
console.log('klip bersuara-lama disimpan di out/klip-lama-bersuara/; klip baru (tanpa narator) di assets/ve/klip/');
