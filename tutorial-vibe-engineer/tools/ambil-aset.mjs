#!/usr/bin/env node
// ambil-aset.mjs — copies what this video shows of the FIRST video (vibe-engineer/) into assets/, once.
// Only READS ../vibe-engineer and the repo files; writes nothing outside tutorial-vibe-engineer/.
//   - assets/ve/<name>.jpg          the 44 key stills (npm run stills over there), 540×960 JPG
//   - assets/ve/klip/<name>.mp4     real clips cut from its final MP4 (540×960, 30 fps), small enough to commit
//   - assets/ve/klip/<name>.wav     their sound, for the clips that play audibly (the S2 reel, the phone in S11)
//   - src/artefak.js                frozen text of the real files shown on screen + the clip list
// Frames are extracted from the MP4s into assets/ve/.frames/ (git-ignored) by tools/frames.mjs on first use.
// The video must never change because the repo changed later; that is why these are snapshots.
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ensureFrames } from './frames.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..');
const VE = path.join(REPO, 'vibe-engineer');
const OUT = path.join(ROOT, 'assets/ve');
const FPS = 30;
// [name, from, to, audible] — times in the final Vibe Engineer MP4 (101.4 s), read from its timeline
export const CLIPS = [
  ['r1-karam', 0.5, 1.7, true],      // GAME OVER, the ship sinks
  ['r2-terima', 19.05, 20.25, true], // TERIMA SEMUA slapped, crates fall
  ['r3-bocor', 25.7, 26.9, true],    // midnight: 38 leaks
  ['r4-peti', 33.0, 34.2, true],     // beetles burst out of the unread functions
  ['r5-pangkat', 39.15, 40.35, true],// rank up
  ['r6-kraken', 48.0, 49.2, true],   // the kraken rises
  ['r7-kecil', 59.45, 60.65, true],  // a small prompt hits
  ['s7-baca', 42.4, 45.6, false],    // rule 1 "baca dulu" (storyboard result, S7)
  ['s8-sama', 44.0, 47.0, false],    // preview vs render, identical (S8)
  ['s10-bocor', 25.0, 28.0, false],  // the revised scene (S10)
  ['hp', 89.0, 96.4, true],          // sail swap → hat → NEW GAME+ → ▶ LANJUT → iris (S11 phone)
];
const run = (args) => new Promise((ok, bad) => spawn('ffmpeg', args, { stdio: 'inherit' }).on('close', (c) => (c ? bad(new Error('ffmpeg ' + c)) : ok())));

async function stills() {
  const dir = path.join(VE, 'out/stills'), names = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort();
  for (const f of names) await sharp(path.join(dir, f)).resize(540, 960, { kernel: 'nearest' }).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, f.replace('.png', '.jpg')));
  console.log(`${names.length} still → assets/ve/`);
  return names.map((f) => f.replace('.png', ''));
}
async function clips() {
  const mp4 = (await readdir(path.join(VE, 'out'))).filter((f) => /_final\.mp4$/.test(f)).sort().pop();
  if (!mp4) throw new Error('MP4 final vibe-engineer tidak ditemukan di vibe-engineer/out/');
  const src = path.join(VE, 'out', mp4), dir = path.join(OUT, 'klip');
  await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
  // the earlier JPG sequence is replaced by the MP4s
  await rm(path.join(OUT, 'clip'), { recursive: true, force: true }); await rm(path.join(OUT, 'clip.wav'), { force: true });
  const meta = {};
  for (const [name, from, to, audible] of CLIPS) {
    const d = +(to - from).toFixed(3);
    // pixel art: nearest-neighbour downscale, then H.264 at a quality that keeps the pixels square
    await run(['-v', 'error', '-y', '-ss', String(from), '-t', String(d), '-i', src, '-vf', `fps=${FPS},scale=540:960:flags=neighbor`, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv444p', path.join(dir, `${name}.mp4`)]);
    if (audible) await run(['-v', 'error', '-y', '-ss', String(from), '-t', String(d), '-i', src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', path.join(dir, `${name}.wav`)]);
    meta[name] = { from, to, d, fps: FPS, n: Math.round(d * FPS), audio: audible };
  }
  console.log(`${CLIPS.length} klip dari ${mp4} → assets/ve/klip/`);
  return { src: mp4, fps: FPS, clips: meta };
}
async function artefak(stillNames, clipInfo) {
  const rd = (p) => readFile(path.join(REPO, p), 'utf8').then((s) => s.replace(/\r\n/g, '\n'));
  const claude = await rd('CLAUDE.md'), style = await rd('.claude/skills/beyond-video/STYLE.md'), skill = await rd('.claude/skills/beyond-video/SKILL.md');
  const tr = await rd('vibe-engineer/TREATMENT.md'), film = await rd('vibe-engineer/src/film.js');
  const s8 = tr.slice(tr.indexOf('### S8 · Baca dulu'), tr.indexOf('### S9 ·')).trim();
  const heads = [...tr.matchAll(/^### (S\d+ · [^\n]+)/gm)].map((m) => m[1]);
  const larangan = style.slice(style.indexOf('## 4. LARANGAN'), style.indexOf('## 5.')).trim();
  const filmHead = film.split('\n').slice(0, 40).join('\n');
  const data = { claude, larangan, skillHead: skill.split('\n').slice(0, 12).join('\n'), s8, treatmentHeads: heads, film: filmHead,
    commit: 'feat(vibe-engineer): video edukasi Vibe Engineer + longgarkan larangan', stills: stillNames, video: clipInfo,
    stats: { lines: 4246, files: 24, frames: 6090, duration: 101.4 } };
  await writeFile(path.join(ROOT, 'src/artefak.js'), `// artefak.js — DIBUAT OLEH tools/ambil-aset.mjs (jangan diedit). Salinan beku dari file asli repo.\nexport const A = ${JSON.stringify(data, null, 1)};\n`);
  console.log('src/artefak.js ditulis');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await mkdir(OUT, { recursive: true });
  const names = await stills();
  const c = await clips();
  await artefak(names, c);
  await ensureFrames(true);
}
