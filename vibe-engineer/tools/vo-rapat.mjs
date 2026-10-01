#!/usr/bin/env node
// vo-rapat.mjs — tighten TTS lines like an editor would: pauses inside a line are capped (a "..." gets a little
// more), then the line is sped up slightly with ffmpeg's atempo (pitch stays). The untouched TTS files are kept in
// vo/raw/; the processed ones go to vo/<id>.wav, which is what preview and render read.
//
//   node tools/vo-rapat.mjs                      process every vo/raw/<id>.wav (raw copies are made on first run)
//   node tools/vo-rapat.mjs --tempo 1.05 --gap 0.35 --only 01-karam
//   node tools/vo-rapat.mjs --tempo 1 --gap 9    = original timing (undo)
//   (npm run tts runs this with --tempo 1 --gap 0.45 for ElevenLabs: silence trimmed, natural pace kept)
import { readdir, mkdir, copyFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VO = path.join(ROOT, 'vo'), RAW = path.join(VO, 'raw');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
export const TEMPO = 1.1, GAP = 0.3, GAP_DOTS = 0.45;
const SR = 48000; // ElevenLabs delivers 48 kHz; Gemini's 24 kHz is simply upsampled
const exists = (p) => access(p).then(() => true, () => false);
const { VO_LINES } = await import(pathToFileURL(path.join(ROOT, 'src/timeline.js')).href);

function run(args, input) {
  return new Promise((ok, bad) => {
    const p = spawn('ffmpeg', args, { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'inherit'] });
    const out = []; p.stdout.on('data', (d) => out.push(d));
    p.on('close', (c) => (c ? bad(new Error('ffmpeg ' + c)) : ok(Buffer.concat(out))));
    if (input) { p.stdin.end(input); }
  });
}
const decode = async (f) => { const b = await run(['-v', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1']); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4))); };

// speech spans: 20 ms RMS above 6 % of the loudest window, gaps under 120 ms merged
function spans(x) {
  const win = SR / 50, n = Math.floor(x.length / win), rms = new Float32Array(n);
  let peak = 0;
  for (let w = 0; w < n; w++) { let e = 0; for (let i = w * win; i < (w + 1) * win; i++) e += x[i] * x[i]; rms[w] = Math.sqrt(e / win); peak = Math.max(peak, rms[w]); }
  const th = peak * 0.06, out = [];
  let s = -1;
  for (let w = 0; w <= n; w++) { const on = w < n && rms[w] > th; if (on && s < 0) s = w; if (!on && s >= 0) { if (out.length && s - out[out.length - 1][1] < 6) out[out.length - 1][1] = w; else out.push([s, w]); s = -1; } }
  return out.map(([a, b]) => [a * win, b * win]);
}
function tighten(x, cap, capFirst) {
  const sp = spans(x); if (!sp.length) return x;
  const pad = Math.round(0.06 * SR), fade = Math.round(0.012 * SR), parts = [];
  sp.forEach(([a, b], i) => {
    const a0 = Math.max(0, a - pad), b0 = Math.min(x.length, b + pad);
    const seg = x.slice(a0, b0);
    for (let k = 0; k < fade && k < seg.length; k++) { seg[k] *= k / fade; seg[seg.length - 1 - k] *= k / fade; }
    parts.push(seg);
    if (i < sp.length - 1) { const gap = (sp[i + 1][0] - b) / SR, c = i === 0 ? capFirst : cap; parts.push(new Float32Array(Math.round(Math.max(0, Math.min(gap, c) - 0.12) * SR))); }
  });
  const len = parts.reduce((s, p) => s + p.length, 0), out = new Float32Array(len + Math.round(0.1 * SR));
  let o = Math.round(0.05 * SR); for (const p of parts) { out.set(p, o); o += p.length; }
  return out.subarray(0, Math.min(out.length, o + Math.round(0.05 * SR)));
}

async function main() {
  const tempo = +opt('tempo', TEMPO), gap = +opt('gap', GAP), only = opt('only')?.split(',');
  await mkdir(RAW, { recursive: true });
  // first run: keep the untouched TTS files
  for (const f of await readdir(VO)) { const id = f.replace(/\.[^.]+$/, ''); if (VO_LINES.some((l) => l.id === id) && !(await exists(path.join(RAW, f)))) await copyFile(path.join(VO, f), path.join(RAW, f)); }
  for (const f of (await readdir(RAW)).sort()) {
    const id = f.replace(/\.[^.]+$/, ''), line = VO_LINES.find((l) => l.id === id);
    if (!line || (only && !only.includes(id))) continue;
    const x = await decode(path.join(RAW, f)), y = tighten(x, gap, line.say.includes('...') ? Math.max(gap, GAP_DOTS) : gap);
    const pcm = Buffer.from(y.buffer, y.byteOffset, y.byteLength);
    await run(['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', 'pipe:0', '-af', `atempo=${tempo}`, '-c:a', 'pcm_s16le', path.join(VO, `${id}.wav`)], pcm);
    // a raw file with another extension must not shadow the processed .wav
    for (const g of await readdir(VO)) if (g !== `${id}.wav` && g.replace(/\.[^.]+$/, '') === id) console.warn(`  perhatian: vo/${g} ikut terbaca; hapus kalau sudah ada ${id}.wav`);
    console.log(`${id}: ${(x.length / SR).toFixed(2)} s → ${(y.length / SR / tempo).toFixed(2)} s`);
  }
  console.log(`\njeda maks ${gap} s ("..." ${Math.max(gap, GAP_DOTS)} s), tempo ×${tempo}. Asli tetap di vo/raw/.  Cek: npm run vo`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
