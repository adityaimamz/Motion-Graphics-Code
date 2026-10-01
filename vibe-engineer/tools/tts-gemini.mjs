#!/usr/bin/env node
// tts-gemini.mjs — generate the 16 voice-over files with Gemini 3.8 Flash TTS (one file per line → vo/<id>.wav).
// Text = exact transcript from src/timeline.js (VO_LINES[].say); tone goes in speech_metadata.style, never in the text.
// Raw TTS is saved in vo/raw/, then tools/vo-rapat.mjs tightens it into vo/<id>.wav (what the film uses).
// The narrator is a designed voice (Voice Design, from VOICE_DESIGN in src/timeline.js), created once and reused.
//
//   npm run tts                                                    generate missing files (key from .env; creates the voice first time)
//   node tools/tts-gemini.mjs --only 05-malam,14-layar --force   regenerate some lines
//   node tools/tts-gemini.mjs --voice Charon                      use a prebuilt voice instead of the designed one
//   node tools/tts-gemini.mjs --voice voice_abc123               use an existing designed voice id
//
// API as documented on 2026-10-01: https://ai.google.dev/gemini-api/docs/speech-generation
// and https://ai.google.dev/gemini-api/docs/voice-design (POST /v1beta/interactions, POST /v1beta/voices).
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VO_DIR = path.join(ROOT, 'vo'), RAW_DIR = path.join(VO_DIR, 'raw');
const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-3.8-flash-tts';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const has = (k) => argv.includes(`--${k}`);
// GEMINI_API_KEY from the environment, or from vibe-engineer/.env (KEY=value lines; .env is git-ignored)
async function dotenv() {
  try {
    for (const line of (await readFile(path.join(ROOT, '.env'), 'utf8')).split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {}
}
await dotenv();
const KEY = process.env.GEMINI_API_KEY;
const exists = (p) => access(p).then(() => true, () => false);

const { VO_LINES, VOICE_DESIGN } = await import(pathToFileURL(path.join(ROOT, 'src/timeline.js')).href);

// rate limits (free tier: 3 requests/min): wait as long as the API asks, then retry
const sleep = (s) => new Promise((ok) => setTimeout(ok, s * 1000));
async function call(endpoint, body) {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`${API}/${endpoint}`, { method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const txt = await r.text();
    if (r.ok) return JSON.parse(txt);
    if (r.status === 429 && /per day/i.test(txt)) throw new Error('Kuota harian Gemini TTS habis (Free Tier: 10 request/hari). Jalankan lagi besok — file yang sudah ada dilewati — atau naikkan tier di https://ai.dev/rate-limit.');
    if (r.status === 429 && attempt < 8) {
      const wait = Math.ceil(+(txt.match(/retry in (\d+(?:\.\d+)?)s/i)?.[1] ?? 20)) + 2;
      process.stdout.write(`(batas kuota, tunggu ${wait} s) `);
      await sleep(wait); continue;
    }
    throw new Error(`${endpoint} → HTTP ${r.status}\n${txt.slice(0, 800)}`);
  }
}
// find the audio part anywhere in the response (SDK: output_audio; REST: steps[].content[] with type "audio")
function findAudio(o) {
  if (!o || typeof o !== 'object') return null;
  if (o.output_audio?.data) return o.output_audio;
  if (o.type === 'audio' && typeof o.data === 'string') return o;
  for (const v of Object.values(o)) { const a = findAudio(v); if (a) return a; }
  return null;
}
// headerless 16-bit PCM → WAV
function wav(pcm, sr = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function voiceId() {
  if (opt('voice')) return opt('voice');
  const store = path.join(VO_DIR, 'voice.json');
  if (await exists(store)) { const v = JSON.parse(await readFile(store, 'utf8')); if (v.id) return v.id; }
  console.log('membuat suara narator (Voice Design)…');
  const v = await call('voices', {
    store: true,
    voice: { model: MODEL, type: 'prompted', display_name: 'Beyond Studio · narator Vibe Engineer', gender: 'male', language_code: 'id-ID', prompted: { input: VOICE_DESIGN } },
  });
  if (!v.id) throw new Error('respons Voice Design tanpa id:\n' + JSON.stringify(v).slice(0, 600));
  await writeFile(store, JSON.stringify({ id: v.id, created: new Date().toISOString(), design: VOICE_DESIGN }, null, 2));
  if (v.sample_audio?.data) await writeFile(path.join(VO_DIR, 'voice-preview.wav'), Buffer.from(v.sample_audio.data, 'base64'));
  console.log(`suara tersimpan: ${v.id}  (contoh: vo/voice-preview.wav)`);
  return v.id;
}

async function main() {
  if (!KEY) { console.error('GEMINI_API_KEY belum ada: isi di vibe-engineer/.env (GEMINI_API_KEY=xxxx) lalu jalankan  npm run tts'); process.exit(1); }
  await mkdir(RAW_DIR, { recursive: true });
  const only = opt('only')?.split(',').map((s) => s.trim());
  const voice = await voiceId();
  const made = [];
  for (const line of VO_LINES) {
    if (only && !only.includes(line.id)) continue;
    const out = path.join(RAW_DIR, `${line.id}.wav`);
    if (!has('force') && (await exists(out) || await exists(path.join(VO_DIR, `${line.id}.wav`)))) { console.log(`lewati ${line.id} (sudah ada; --force untuk membuat ulang)`); continue; }
    process.stdout.write(`${line.id}  “${line.say}”  [${line.style}] … `);
    const res = await call('interactions', {
      model: opt('model', MODEL),
      input: [{ type: 'user_input', content: [{ type: 'text', text: line.say, annotations: [{ type: 'speech_metadata', style: line.style }] }] }],
      response_format: { type: 'audio', mime_type: 'audio/wav' },
      generation_config: { speech_config: [{ voice }] },
    });
    const a = findAudio(res);
    if (!a) throw new Error(`tidak ada audio di respons ${line.id}:\n` + JSON.stringify(res).slice(0, 600));
    let buf = Buffer.from(a.data, 'base64');
    if (buf.subarray(0, 4).toString() !== 'RIFF') buf = wav(buf, a.sample_rate ?? 24000); // raw L16 → WAV
    await writeFile(out, buf);
    console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`); made.push(line.id);
  }
  // tighten the new lines (pauses capped, tempo ×1.1) → vo/<id>.wav; the raw TTS stays in vo/raw/
  if (made.length) await new Promise((ok, bad) => spawn(process.execPath, [path.join(ROOT, 'tools/vo-rapat.mjs'), '--only', made.join(',')], { stdio: 'inherit' }).on('close', (c) => (c ? bad(new Error('vo-rapat gagal')) : ok())));
  console.log(`\n${made.length} file baru. Cek posisinya dengan:  npm run vo`);
}
main().catch((e) => { console.error('\n' + e.message); process.exit(1); });
