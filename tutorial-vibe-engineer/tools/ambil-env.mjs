#!/usr/bin/env node
// ambil-env.mjs — writes src/vo-env.js: the loudness envelope (200 values, 0..1, over the spoken part) of the VO lines whose
// real waveform is drawn on screen (S9 draws vo/13-suara.wav as "one take"). The export loads only durations, so the
// envelope is frozen into the source, like src/artefak.js.  Run again if vo/13-suara.* is replaced.
//   node tools/ambil-env.mjs
import { spawn } from 'node:child_process';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyse, matchFiles } from '../src/vo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = ['13-suara'], N = 200, SR = 48000;
const decode = (file) => new Promise((ok, bad) => {
  const p = spawn('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const chunks = []; p.stdout.on('data', (d) => chunks.push(d));
  p.on('close', (c) => { if (c) return bad(new Error('cannot decode ' + file)); const b = Buffer.concat(chunks); ok(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)))); });
});
const files = matchFiles(await readdir(path.join(ROOT, 'vo'))), out = {};
for (const id of IDS) {
  const x = await decode(path.join(ROOT, 'vo', files[id])), a = analyse(x, SR);
  const s0 = Math.round(a.lead * SR), len = Math.round(a.dur * SR), env = [];
  for (let i = 0; i < N; i++) {
    const i0 = s0 + Math.floor((i / N) * len), i1 = s0 + Math.floor(((i + 1) / N) * len); let e = 0;
    for (let k = i0; k < i1; k++) e += x[k] * x[k];
    env.push(Math.sqrt(e / Math.max(1, i1 - i0)));
  }
  const peak = Math.max(...env);
  out[id] = env.map((v) => Math.round(Math.pow(v / peak, 0.7) * 100) / 100);
}
await writeFile(path.join(ROOT, 'src/vo-env.js'), `// vo-env.js — DIBUAT OLEH tools/ambil-env.mjs (jangan diedit). Selubung amplitudo asli dari vo/*.wav, ${N} nilai 0..1.\nexport const ENV = ${JSON.stringify(out)};\n`);
console.log('ok', Object.keys(out).map((k) => `${k}: ${out[k].length}`).join(', '));
