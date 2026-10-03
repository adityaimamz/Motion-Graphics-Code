#!/usr/bin/env node
// vo-bagi.mjs (disalin dari vibe-engineer/tools, disesuaikan) — split ONE long narration (all 19 lines read in a single take) into vo/raw/<id>.wav.
// Local only, no API. The voice stays identical from the first to the last line because it is one performance.
//
//   node tools/vo-bagi.mjs vo/satu-tarikan.mp3              find the 18 line breaks, write vo/raw/01…19, tighten → vo/<id>.wav
//   node tools/vo-bagi.mjs vo/satu-tarikan.mp3 --dry        only show where it would cut (writes nothing)
//   node tools/vo-bagi.mjs vo/satu-tarikan.mp3 --potong 3.1,7.9,…   18 cut times in seconds, if the automatic ones are off
//   options: --pad 0.25 (seconds kept around each line)  --tempo 1  --gap 0.45  --tanpa-rapat (skip the tightening step)
//
// How the breaks are found: every silence is a candidate; 18 of them are chosen by dynamic programming so that each
// line is spoken at about the average pace for its number of characters, preferring longer silences.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VO = path.join(ROOT, 'vo'), RAW = path.join(VO, 'raw');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(`--${k}`);
const VALUE_OPTS = new Set(['--pad', '--potong', '--tempo', '--gap']);
const file = argv.find((a, i) => !a.startsWith('--') && !VALUE_OPTS.has(argv[i - 1]));
const SR = 48000;
const { VO_LINES } = await import(pathToFileURL(path.join(ROOT, 'src/naskah.js')).href);
const stripTags = (s) => s.replace(/\[[^\]]*\]\s*/g, '').replace(/\s+/g, ' ').trim();

function decode(f) {
  return new Promise((ok, bad) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const out = []; p.stdout.on('data', (d) => out.push(d));
    p.on('error', () => bad(new Error('ffmpeg tidak ditemukan di PATH')));
    p.on('close', (c) => { if (c) return bad(new Error('ffmpeg gagal membaca ' + f)); const b = Buffer.concat(out); ok(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)))); });
  });
}
function wavBuffer(x) {
  const n = x.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  return buf;
}

// ---------------------------------------------------------------- silences and the choice of breaks
// returns { voiced: total seconds of speech, gaps: [{ a, b, len, v }] } (v = seconds of speech before the gap)
export function silences(x, sr = SR, minGap = 0.18) {
  const win = Math.round(sr * 0.01), n = Math.floor(x.length / win), rms = new Float32Array(n);
  let peak = 0;
  for (let w = 0; w < n; w++) { let e = 0; for (let i = w * win; i < (w + 1) * win; i++) e += x[i] * x[i]; rms[w] = Math.sqrt(e / win); peak = Math.max(peak, rms[w]); }
  const th = Math.max(peak * 0.03, 1e-4), loud = Array.from(rms, (r) => r > th);
  let first = loud.indexOf(true), last = loud.lastIndexOf(true);
  if (first < 0) throw new Error('audio kosong / senyap');
  const gaps = []; let voicedW = 0, s = -1;
  for (let w = first; w <= last + 1; w++) {
    const q = w <= last && !loud[w];
    if (q && s < 0) s = w;
    if (!q && s >= 0) { const len = (w - s) * win / sr; if (len >= minGap) gaps.push({ a: s * win / sr, b: w * win / sr, len, v: voicedW * win / sr }); s = -1; }
    if (w <= last && loud[w]) voicedW++;
  }
  return { voiced: voicedW * win / sr, gaps, start: first * win / sr, end: (last + 1) * win / sr };
}
// dynamic programming: pick n-1 increasing gaps so that every line is spoken at about the average pace
// (seconds of speech per character); longer silences are preferred. Judging each line on its own pace, instead of
// the running total, keeps one fast or slow line from dragging every later break off.
export function pickBreaks(gaps, voiced, chars) {
  const n = chars.length, k = n - 1, m = gaps.length, mean = voiced / chars.reduce((s, c) => s + c, 0);
  if (m < k) throw new Error(`hanya ${m} jeda yang cukup panjang, butuh ${k}. Pakai --potong untuk menentukan sendiri.`);
  const seg = (v0, v1, i) => { const d = (v1 - v0) / chars[i] / mean - 1; return 6 * d * d; };
  const bonus = (g) => -1.5 * Math.min(g.len / 0.5, 1);
  const dp = Array.from({ length: k }, () => new Float64Array(m).fill(Infinity)), from = Array.from({ length: k }, () => new Int32Array(m).fill(-1));
  for (let j = 0; j < m; j++) dp[0][j] = seg(0, gaps[j].v, 0) + bonus(gaps[j]);
  for (let i = 1; i < k; i++) for (let j = i; j < m; j++) for (let p = i - 1; p < j; p++) {
    const c = dp[i - 1][p] + seg(gaps[p].v, gaps[j].v, i) + bonus(gaps[j]);
    if (c < dp[i][j]) { dp[i][j] = c; from[i][j] = p; }
  }
  let best = -1, bc = Infinity;
  for (let j = k - 1; j < m; j++) { const c = dp[k - 1][j] + seg(gaps[j].v, voiced, k); if (c < bc) { bc = c; best = j; } }
  const pick = []; for (let i = k - 1, j = best; i >= 0; i--) { pick[i] = j; j = from[i][j]; }
  return pick.map((q) => gaps[q]);
}

async function main() {
  if (!file) { console.error('Pemakaian: node tools/vo-bagi.mjs <audio satu tarikan> [--dry] [--potong t1,t2,…]\nContoh:    node tools/vo-bagi.mjs vo/satu-tarikan.mp3'); process.exit(1); }
  const src = path.resolve(file), x = await decode(src), total = x.length / SR;
  const lines = VO_LINES, n = lines.length, pad = +opt('pad', '0.25');
  const chars = lines.map((l) => stripTags(l.el).replace(/\.\.\./g, '…').length);
  const sil = silences(x), manual = opt('potong')?.split(',').map(Number);
  let cuts; // n-1 cut times, each in the middle of the silence it falls in
  if (manual) {
    if (manual.length !== n - 1 || manual.some((v) => !(v > 0 && v < total))) throw new Error(`--potong butuh ${n - 1} angka detik (0–${total.toFixed(1)}), dipisah koma`);
    cuts = manual.map((t) => ({ t }));
  } else {
    cuts = pickBreaks(sil.gaps, sil.voiced, chars).map((g) => ({ t: (g.a + g.b) / 2, len: g.len }));
  }
  const edges = [sil.start, ...cuts.map((c) => c.t), sil.end];
  console.log(`\n${path.basename(src)}: ${total.toFixed(1)} s, ${sil.gaps.length} jeda ditemukan, ${n} baris\n`);
  console.log('id            mulai   akhir  durasi  detik/huruf');
  const warn = [];
  lines.forEach((l, i) => {
    const d = edges[i + 1] - edges[i], per = d / chars[i], flag = per < 0.04 || per > 0.2 ? '  ← cek' : '';
    if (flag) warn.push(l.id);
    console.log(`${l.id.padEnd(12)} ${edges[i].toFixed(2).padStart(6)} ${edges[i + 1].toFixed(2).padStart(7)} ${d.toFixed(2).padStart(6)}  ${per.toFixed(3)}${flag}`);
  });
  const typical = [...lines.map((l, i) => (edges[i + 1] - edges[i]) / chars[i])].sort((p, q) => p - q)[Math.floor(n / 2)];
  console.log(`\nrata-rata ${typical.toFixed(3)} s/huruf. Jeda terpendek yang dipakai sebagai batas: ${Math.min(...cuts.map((c) => c.len ?? 9)).toFixed(2)} s`);
  if (warn.length) console.log(`Perhatian: ${warn.join(', ')} tampak terlalu pendek/panjang untuk isinya, batasnya mungkin salah. Dengarkan, atau beri --potong.`);
  if (has('dry')) { console.log('\n(--dry: tidak ada file ditulis)'); return; }

  await mkdir(RAW, { recursive: true });
  await copyFile(src, path.join(RAW, '_satu-tarikan' + path.extname(src)));
  for (const [i, l] of lines.entries()) {
    const from = i ? Math.max(cuts[i - 1].t, edges[i] - pad) : Math.max(0, edges[0] - pad);
    const to = i < n - 1 ? Math.min(cuts[i].t, edges[i + 1] + pad) : Math.min(total, edges[n] + pad);
    const a = Math.round(from * SR);
    await writeFile(path.join(RAW, `${l.id}.wav`), wavBuffer(x.subarray(a, Math.max(a + 1, Math.round(to * SR)))));
  }
  console.log(`\n${n} file → ${path.relative(ROOT, RAW)}/01-komentar.wav … 19-follow.wav`);
  if (has('tanpa-rapat')) return;
  await new Promise((ok, bad) => spawn(process.execPath, [path.join(ROOT, 'tools/vo-rapat.mjs'), '--tempo', opt('tempo', '1'), '--gap', opt('gap', '0.45')], { stdio: 'inherit' }).on('close', (c) => (c ? bad(new Error('vo-rapat gagal')) : ok())));
  console.log('\nSelesai. Dengarkan di preview (npm run preview) dan cek posisinya:  npm run vo');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error('\n' + e.message); process.exitCode = 1; });
