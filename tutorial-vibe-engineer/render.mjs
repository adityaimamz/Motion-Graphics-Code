#!/usr/bin/env node
// Tutorial Vibe Engineer — preview server + offline renderer (pattern copied from vibe-engineer/render.mjs, adapted
// to a DOM film): every frame t is set with window.__tv.seek(t) in headless Chromium and captured with
// Page.captureScreenshot. Frames inside a timeline.BLUR window are the average of n sub-frames (real motion blur);
// --ss 2 renders at 2160×3840 and scales down with lanczos (the final default).
//   node render.mjs serve  [--port 5173]
//   node render.mjs video  [--draft] [--out f.mp4] [--from 0] [--to <dur>] [--crf 16] [--preset slow] [--jobs N] [--ss 1|2] [--nomb]
//   node render.mjs audio  [--out f.wav]
//   node render.mjs cues   <scene id>   prints the scene's window and every cue time (to see what lands on which word)
//   node render.mjs vo
//   node render.mjs stills --scenes | --t 1.2,10 [--out out/stills]
//   node render.mjs sheet  [--from 0] [--to <dur>] [--n 40] [--cols 8] [--out out/sheet.png]
//   node render.mjs strip  --from 3.5 --to 6 [--fps 10] [--cols 8] [--out out/strip.png]   (compare with the references)
//   node render.mjs check  [--dump]   determinism: the same t gives the same pixels (--dump writes both versions of a mismatch to out/check/)
//   any mode: --novo ignores vo/      video: --noaudio  --audio my-mix.wav
import http from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ensureFrames } from './tools/frames.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const MODES = ['serve', 'video', 'audio', 'vo', 'cues', 'stills', 'sheet', 'strip', 'check'];
const mode = argv[0];
// no default mode: rendering a video must always be asked for by name
if (!MODES.includes(mode)) { console.error(`Pemakaian: node render.mjs <${MODES.join('|')}> [opsi]  (lihat komentar di atas file)`); process.exit(1); }
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const hasFlag = (k) => argv.includes(`--${k}`);
const W = 1080, H = 1920, FPS = 60, SHUTTER = 0.6; // sub-frames spread over 0.6 of a frame
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.flac': 'audio/flac' };
const stamp = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };

// ---------------------------------------------------------------- tiny static server
function startServer(port) {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/vo/' && url.searchParams.has('list')) {
      let files = []; try { files = (await readdir(path.join(ROOT, 'vo'))).filter((f) => !f.startsWith('.')); } catch {}
      return res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify({ files }));
    }
    let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, path.normalize(p));
    if (!fp.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const data = await readFile(fp);
      res.writeHead(200, { 'content-type': MIME[path.extname(fp).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(data);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok(srv)));
}

async function openPage(base, voDur = {}, ss = 1) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb', '--font-render-hinting=none', '--hide-scrollbars'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: ss });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const vq = Object.keys(voDur).length ? `&vo=${encodeURIComponent(JSON.stringify(voDur))}` : '';
  await page.goto(`${base}/index.html?export=1${vq}`);
  await page.waitForFunction(() => window.__tv?.ready || window.__tv?.error, null, { timeout: 120000 }).catch((e) => { throw new Error(`app did not boot:\n${logs.join('\n')}\n${e.message}`); });
  const err = await page.evaluate(() => window.__tv.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const cdp = await page.context().newCDPSession(page);
  // one frame = seek, then a screenshot (the screenshot forces style/layout/paint of exactly that state)
  const shot = async (t) => {
    await page.evaluate(async (t) => { await window.__tv.seek(t); }, t);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, fromSurface: true, captureBeyondViewport: false });
    return Buffer.from(r.data, 'base64');
  };
  return { browser, page, logs, shot };
}

// ---------------------------------------------------------------- voice-over (vo/<id>.<ext>)
let VO = null;
function decode(file) {
  return new Promise((ok, bad) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '48000', '-f', 'f32le', 'pipe:1'], { stdio: ['ignore', 'pipe', 'inherit'] });
    const chunks = []; p.stdout.on('data', (d) => chunks.push(d));
    p.on('close', (code) => { if (code) return bad(new Error('cannot decode ' + file)); const b = Buffer.concat(chunks); ok(new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)))); });
  });
}
async function loadVO() {
  if (VO) return VO;
  VO = {};
  if (!hasFlag('novo')) {
    const { matchFiles, analyse } = await import('./src/vo.js');
    let names = []; try { names = await readdir(path.join(ROOT, 'vo')); } catch {}
    for (const [id, f] of Object.entries(matchFiles(names))) {
      const data = await decode(path.join(ROOT, 'vo', f)), a = analyse(data, 48000);
      if (a) VO[id] = { data, file: f, ...a };
    }
  }
  const { applyVO } = await import('./src/timeline.js');
  applyVO(voDurations());
  return VO;
}
const voDurations = () => Object.fromEntries(Object.entries(VO ?? {}).map(([id, v]) => [id, { dur: v.dur, gaps: v.gaps ?? [] }]));

async function clipAudio() {
  const dir = path.join(ROOT, 'assets/ve/klip'), out = {};
  let names = []; try { names = (await readdir(dir)).filter((f) => f.endsWith('.wav')); } catch {}
  for (const f of names) out[f.replace('.wav', '')] = await decode(path.join(dir, f));
  return out;
}
async function makeAudio(out) {
  await loadVO();
  const { renderAudio, toWav } = await import('./src/audio.js');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, toWav(renderAudio({ vo: VO, clips: await clipAudio() })));
  return out;
}
async function audioFor(outVideo) {
  if (hasFlag('noaudio')) return null;
  if (opt('audio')) return path.resolve(opt('audio'));
  return makeAudio(path.join(path.dirname(outVideo), '.soundtrack.wav'));
}
const audioArgs = (wav, from, to) => (wav ? ['-ss', String(from), '-t', String(to - from), '-i', wav] : []);
const audioEnc = (wav) => (wav ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []);
const fmt = (s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;
const defaultOut = () => path.resolve(opt('out', `out/tutorial-vibe-engineer_${stamp()}_${hasFlag('draft') ? 'draft' : 'final'}.mp4`));
const encOpts = () => (hasFlag('draft') ? { preset: opt('preset', 'veryfast'), crf: opt('crf', '20') } : { preset: opt('preset', 'slow'), crf: opt('crf', '16') });
const ssOf = () => +opt('ss', hasFlag('draft') ? '1' : '2');
const mbOn = () => !hasFlag('nomb') && !hasFlag('draft');

// ---------------------------------------------------------------- one finished frame (RGB, 1080×1920)
async function frameRGB(shot, t, ss, mb) {
  const { blurAt } = await import('./src/timeline.js');
  const n = mb ? blurAt(t) : 1;
  let acc = null, w = 0, h = 0;
  for (let k = 0; k < n; k++) {
    const tk = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * (SHUTTER / FPS);
    const { data, info } = await sharp(await shot(tk)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (n === 1) { acc = data; w = info.width; h = info.height; break; }
    if (!acc) { acc = new Uint16Array(data.length); w = info.width; h = info.height; }
    for (let i = 0; i < data.length; i++) acc[i] += data[i];
  }
  let rgb = acc;
  if (n > 1) { rgb = Buffer.alloc(acc.length); for (let i = 0; i < acc.length; i++) rgb[i] = Math.round(acc[i] / n); }
  if (w !== W || h !== H) rgb = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).resize(W, H, { kernel: 'lanczos3' }).raw().toBuffer();
  return rgb;
}
const png = (rgb, w = W, h = H) => sharp(rgb, { raw: { width: w, height: h, channels: 3 } }).png();

// --jobs N: split the frame range into N segments rendered by N browsers in parallel, then concat losslessly
async function parallel(jobs) {
  await ensureFrames(); // once, before the jobs start (they would race)
  await loadVO();
  const { DURATION } = await import('./src/timeline.js');
  const f0 = Math.round(+opt('from', '0') * FPS), f1 = Math.round(+opt('to', String(DURATION)) * FPS);
  const out = defaultOut(), tmp = path.join(path.dirname(out), '.segments');
  await mkdir(tmp, { recursive: true });
  const { preset, crf } = encOpts();
  const pass = ['--noaudio', '--preset', preset, '--crf', crf, '--ss', String(ssOf())]; if (hasFlag('novo')) pass.push('--novo'); if (!mbOn()) pass.push('--nomb');
  const segs = [];
  for (let j = 0; j < jobs; j++) {
    const a = f0 + Math.round(((f1 - f0) * j) / jobs), b = f0 + Math.round(((f1 - f0) * (j + 1)) / jobs);
    segs.push({ a, b, file: path.join(tmp, `seg_${String(j).padStart(2, '0')}.mp4`) });
  }
  const t0 = Date.now(), prog = segs.map(() => '');
  await Promise.all(segs.map((sg, j) => new Promise((ok, bad) => {
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), 'video', '--from', String(sg.a / FPS), '--to', String(sg.b / FPS), '--out', sg.file, ...pass], { stdio: ['ignore', 'pipe', 'inherit'] });
    p.stdout.on('data', (d) => { const m = String(d).match(/(\d+)\/(\d+) frames/g); if (m) { prog[j] = m[m.length - 1]; process.stdout.write(`\r${prog.map((x, i) => `[${i}] ${x}`).join('  ')}   `); } });
    p.on('close', (code) => (code === 0 ? ok() : bad(new Error(`job ${j} failed`))));
  })));
  const list = path.join(tmp, 'list.txt');
  await writeFile(list, segs.map((s) => `file '${s.file.replace(/\\/g, '/')}'`).join('\n'));
  const wav = await audioFor(out), from = f0 / FPS, to = f1 / FPS;
  await new Promise((ok, bad) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audioArgs(wav, from, to), '-c:v', 'copy', ...audioEnc(wav), '-movflags', '+faststart', out], { stdio: 'inherit' })
    .on('close', (c) => (c === 0 ? ok() : bad(new Error('concat failed')))));
  console.log(`\nwrote ${out}  (${f1 - f0} frames in ${jobs} jobs, ${fmt((Date.now() - t0) / 1000)})`);
}

async function main() {
  const jobs = +opt('jobs', '1');
  if (mode === 'video' && jobs > 1) return parallel(jobs);
  if (mode === 'vo') {
    await loadVO();
    const T = await import('./src/timeline.js');
    const f2 = (x) => x.toFixed(2).padStart(7);
    console.log(`\nfile di vo/: ${Object.keys(VO).length} dari ${T.VO_LINES.length} baris\n`);
    console.log('id             mulai   durasi  scene');
    for (const l of T.VO_LINES) { const v = T.LINE[l.id]; console.log(`${l.id.padEnd(14)} ${f2(v.s)} ${f2(v.d)}  ${v.scene}${VO[l.id] ? '' : '  (belum ada, diperkirakan)'}`); }
    console.log('\nscene           awal    akhir');
    for (const k of T.SCENE_IDS) console.log(`${k.padEnd(14)} ${f2(T.S[k].t0)} ${f2(T.S[k].t1)}`);
    console.log(`\ndurasi total: ${T.DURATION.toFixed(2)} s`);
    return;
  }
  if (mode === 'cues') {
    await loadVO();
    const T = await import('./src/timeline.js'), id = argv[1];
    const rd = (v) => (typeof v === 'number' ? +v.toFixed(2) : Array.isArray(v) ? v.map(rd) : v);
    console.log(id, 'scene', rd([T.S[id].t0, T.S[id].t1]), 'len', rd(T.S[id].len));
    for (const [k, v] of Object.entries(T.CUE[id] ?? {})) console.log(' ', k.padEnd(12), JSON.stringify(rd(v)));
    return;
  }
  if (mode === 'audio') {
    const out = path.resolve(opt('out', `out/tutorial-vibe-engineer_${stamp()}.wav`));
    const t0 = Date.now(); await makeAudio(out);
    console.log(`wrote ${out}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`); return;
  }
  await ensureFrames();
  if (mode === 'serve') {
    const port = +opt('port', '5173');
    await startServer(port);
    console.log(`preview: http://localhost:${port}/   (?t=12.5 untuk mulai di detik tertentu)`);
    return;
  }

  await loadVO();
  const srv = await startServer(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const ss = mode === 'video' ? ssOf() : +opt('ss', '1');
  const { browser, logs, shot } = await openPage(base, voDurations(), ss);
  const T = await import('./src/timeline.js');
  const duration = T.DURATION;
  try {
    if (mode === 'stills') {
      const out = path.resolve(opt('out', 'out/stills')); await mkdir(out, { recursive: true });
      const list = hasFlag('scenes') ? T.STILLS : opt('t', '0').split(',').map((x) => [`t_${(+x).toFixed(2).padStart(6, '0')}`, +x]);
      for (const [name, t] of list) {
        const f = path.join(out, `${name}.png`);
        await png(await frameRGB(shot, t, ss, !hasFlag('nomb'))).toFile(f); console.log(`${f}  (t=${t.toFixed(2)})`);
      }
    } else if (mode === 'sheet' || mode === 'strip') {
      const from = +opt('from', '0'), to = +opt('to', String(duration));
      let times;
      if (mode === 'strip') { const fps = +opt('fps', '10'); times = []; for (let t = from; t < to - 1e-6; t += 1 / fps) times.push(t); }
      else { const n = +opt('n', '40'); times = opt('times') ? opt('times').split(',').map(Number) : Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1)); }
      const cols = +opt('cols', '8'), cw = 270, ch = 480, pad = 6, rows = Math.ceil(times.length / cols);
      const tiles = [];
      for (const [i, t] of times.entries()) {
        const small = await sharp(await frameRGB(shot, t, 1, !hasFlag('nomb')), { raw: { width: W, height: H, channels: 3 } }).resize(cw, ch).png().toBuffer();
        const label = Buffer.from(`<svg width="${cw}" height="22"><rect width="100%" height="100%" fill="#111"/><text x="4" y="16" font-family="monospace" font-size="14" fill="#ddd">${t.toFixed(2)}s</text></svg>`);
        tiles.push({ input: small, left: pad + (i % cols) * (cw + pad), top: pad + Math.floor(i / cols) * (ch + 22 + pad) + 22 });
        tiles.push({ input: label, left: pad + (i % cols) * (cw + pad), top: pad + Math.floor(i / cols) * (ch + 22 + pad) });
      }
      const out = path.resolve(opt('out', `out/${mode}.png`)); await mkdir(path.dirname(out), { recursive: true });
      await sharp({ create: { width: cols * (cw + pad) + pad, height: rows * (ch + 22 + pad) + pad, channels: 3, background: '#222' } }).composite(tiles).png().toFile(out);
      console.log(out);
    } else if (mode === 'check') {
      const times = T.STILLS.filter((_, i) => i % 2 === 0).map(([, t]) => t);
      const grab = async (t) => (await frameRGB(shot, t, 1, false)).toString('base64');
      const nd = (x, y) => { const A = Buffer.from(x, 'base64'), B = Buffer.from(y, 'base64'); let n = 0, m = 0, x0 = W, y0 = H, x1 = -1, y1 = -1; for (let i = 0; i < A.length; i++) { const e = Math.abs(A[i] - B[i]); if (e) { n++; m = Math.max(m, e); const p = (i / 3) | 0, px = p % W, py = (p / W) | 0; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); } } return [n, m, `${x0},${y0} → ${x1},${y1}`]; };
      const a = []; for (const t of times) a.push(await grab(t));
      for (const t of [...times].reverse()) await grab(t);
      let same = 0; const bad = [];
      for (const [i, t] of times.entries()) { const g = await grab(t); if (g === a[i]) same++; else { bad.push(t); const [n, m, box] = nd(g, a[i]); console.log('  beda di t=' + t.toFixed(2) + ': ' + n + ' nilai kanal, selisih maks ' + m + '/255, area ' + box);
          if (hasFlag('dump')) { await mkdir('out/check', { recursive: true }); await png(Buffer.from(a[i], 'base64')).toFile(`out/check/${t.toFixed(2)}-a.png`); await png(Buffer.from(g, 'base64')).toFile(`out/check/${t.toFixed(2)}-b.png`); } } }
      console.log(`determinisme: ${same}/${times.length} frame identik` + (bad.length ? `  ✗ beda di t = ${bad.map((b) => b.toFixed(2)).join(', ')}` : '  ✓'));
    } else if (mode === 'video') {
      const from = +opt('from', '0'), to = +opt('to', String(duration));
      const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS), total = f1 - f0;
      const out = defaultOut(); await mkdir(path.dirname(out), { recursive: true });
      const { preset, crf } = encOpts();
      const wav = await audioFor(out);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
        ...audioArgs(wav, from, to), ...audioEnc(wav), '-c:v', 'libx264', '-preset', preset, '-crf', crf, '-pix_fmt', 'yuv420p',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      const ffDone = new Promise((ok, bad) => ff.on('close', (code) => (code === 0 ? ok() : bad(new Error('ffmpeg exited ' + code)))));
      const t0 = Date.now(), mb = mbOn();
      for (let i = f0; i < f1; i++) {
        const rgb = await frameRGB(shot, i / FPS, ss, mb);
        if (!ff.stdin.write(rgb)) await new Promise((ok) => ff.stdin.once('drain', ok));
        const done = i - f0 + 1;
        if (done % 30 === 0 || done === total) {
          const el = (Date.now() - t0) / 1000;
          process.stdout.write(`\r${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${fmt((total - done) / (done / el))}   `);
        }
      }
      ff.stdin.end(); await ffDone;
      console.log(`\nwrote ${out}  (${total} frames, ${(total / FPS).toFixed(2)} s, rendered in ${fmt((Date.now() - t0) / 1000)})`);
    }
    if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 30).join('\n'));
  } finally { await browser.close(); srv.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
