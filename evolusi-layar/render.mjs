#!/usr/bin/env node
// Evolusi Layar — offline renderer.
//   node render.mjs serve  [--port 5173]                    live preview in your browser
//   node render.mjs video  [--out out/evolusi-layar.mp4] [--from 0] [--to <dur>] [--samples auto|N] [--shutter 0.5]
//                          [--crf 16] [--preset slow] [--scale 1] [--jobs N]
//   node render.mjs audio  [--out out/evolusi-layar.wav]           soundtrack only (48 kHz / 16-bit WAV)
//   node render.mjs vo                                             check voice-over files in vo/ and the resulting timeline
//   any mode: --novo ignores vo/
//   video options: --noaudio (silent)  --audio my-mix.wav (use your own mix instead of the generated one)
//   node render.mjs stills --t 1.2,10,33.5 [--out out/stills] [--samples 1]
//   node render.mjs sheet  [--from 0] [--to <dur>] [--n 24] [--cols 6] [--out out/sheet.png]
// Every frame is rendered in headless Chromium at t = i/60 (deterministic, seekable), read back as raw RGBA,
// POSTed to this process and piped straight into ffmpeg. Env CHROME_PATH=/path/to/chrome to use a specific browser.
import http from 'node:http';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const mode = argv[0] ?? 'video';
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const W = 1080, H = 1920, FPS = 60;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

// ---------------------------------------------------------------- tiny static server + frame sink
function startServer(port, onFrame) {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST' && url.pathname === '/frame') {
      const chunks = []; for await (const ch of req) chunks.push(ch);
      try { await onFrame(Buffer.concat(chunks), +req.headers['x-frame']); res.writeHead(204).end(); }
      catch (e) { res.writeHead(500).end(String(e)); }
      return;
    }
    if (url.pathname === '/vo/' && url.searchParams.has('list')) {
      let files = []; try { files = (await readdir(path.join(ROOT, 'vo'))).filter((f) => !f.startsWith('.')); } catch {}
      return res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(JSON.stringify({ files }));
    }
    let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(ROOT, path.normalize(p));
    if (!fp.startsWith(ROOT)) return res.writeHead(403).end();
    try {
      const data = await readFile(fp);
      res.writeHead(200, { 'content-type': MIME[path.extname(fp)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(data);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok(srv)));
}

async function openPage(base, voDur = {}) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const vq = Object.keys(voDur).length ? `&vo=${encodeURIComponent(JSON.stringify(voDur))}` : '';
  await page.goto(`${base}/index.html?export=1${vq}`);
  await page.waitForFunction(() => window.__evo?.ready || window.__evo?.error, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__evo.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  return { browser, page, logs };
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
  if (hasFlag('novo')) return VO;
  const { matchFiles, analyse } = await import('./src/vo.js');
  let names = []; try { names = await readdir(path.join(ROOT, 'vo')); } catch { return VO; }
  for (const [id, f] of Object.entries(matchFiles(names))) {
    const data = await decode(path.join(ROOT, 'vo', f)), a = analyse(data, 48000);
    if (a) VO[id] = { data, file: f, ...a };
  }
  const { applyVO } = await import('./src/timeline.js');
  applyVO(voDurations());
  return VO;
}
const voDurations = () => Object.fromEntries(Object.entries(VO ?? {}).map(([id, v]) => [id, v.dur]));

async function makeAudio(out) {
  await loadVO();
  const { renderAudio, toWav } = await import('./src/audio.js');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, toWav(renderAudio({ vo: VO })));
  return out;
}
const hasFlag = (k) => argv.includes(`--${k}`);
async function audioFor(outVideo) {
  if (hasFlag('noaudio')) return null;
  if (opt('audio')) return path.resolve(opt('audio'));
  return makeAudio(path.join(path.dirname(outVideo), '.soundtrack.wav'));
}
const audioArgs = (wav, from, to) => (wav ? ['-ss', String(from), '-t', String(to - from), '-i', wav] : []);
const audioEnc = (wav) => (wav ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000'] : []);

const fmt = (s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, '0')}s`;

// --jobs N: split the frame range into N segments rendered by N browsers in parallel, then concat losslessly
async function parallel(jobs) {
  await loadVO();
  const probe = await startServer(0, async () => {});
  const { browser, page } = await openPage(`http://127.0.0.1:${probe.address().port}`, voDurations());
  const duration = await page.evaluate(() => window.__evo.duration);
  await browser.close(); probe.close();
  const f0 = Math.round(+opt('from', '0') * FPS), f1 = Math.round(+opt('to', String(duration)) * FPS);
  const out = path.resolve(opt('out', 'out/evolusi-layar.mp4')), tmp = path.join(path.dirname(out), '.segments');
  await mkdir(tmp, { recursive: true });
  const pass = ['--noaudio']; if (hasFlag('novo')) pass.push('--novo');
  for (const k of ['samples', 'shutter', 'crf', 'preset', 'scale']) if (opt(k)) pass.push(`--${k}`, opt(k));
  const segs = [];
  for (let j = 0; j < jobs; j++) {
    const a = f0 + Math.round(((f1 - f0) * j) / jobs), b = f0 + Math.round(((f1 - f0) * (j + 1)) / jobs);
    segs.push({ a, b, file: path.join(tmp, `seg_${String(j).padStart(2, '0')}.mp4`) });
  }
  const t0 = Date.now();
  await Promise.all(segs.map((sg, j) => new Promise((ok, bad) => {
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), 'video', '--from', String(sg.a / FPS), '--to', String(sg.b / FPS), '--out', sg.file, ...pass], { stdio: ['ignore', 'pipe', 'inherit'] });
    p.stdout.on('data', (d) => { const m = String(d).match(/(\d+)\/(\d+) frames/g); if (m) process.stdout.write(`\r[job ${j}] ${m[m.length - 1]}        `); });
    p.on('close', (code) => (code === 0 ? ok() : bad(new Error(`job ${j} failed`))));
  })));
  const list = path.join(tmp, 'list.txt');
  await writeFile(list, segs.map((s) => `file '${s.file}'`).join('\n'));
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
    const base = { ...T.S }; T.applyVO({}); const base0 = { ...T.S }, d0 = T.DURATION; T.applyVO(voDurations());
    const f2 = (x) => x.toFixed(2).padStart(6);
    console.log(`\nfile di vo/: ${Object.keys(VO).length} dari ${T.VO_LINES.length} baris\n`);
    console.log('id              mulai    durasi  file');
    for (const l of T.VO_LINES) {
      const p = T.VO_PLACE.find((q) => q.id === l.id), v = VO[l.id];
      console.log(`${l.id.padEnd(15)} ${p ? f2(p.start) : '     -'}  ${v ? f2(v.dur) : '     -'}  ${v ? v.file : (l.optional ? '(opsional)' : '(belum ada)')}`);
    }
    console.log('\nscene      awal default → awal baru   (+diperpanjang)');
    for (const k of Object.keys(base0)) console.log(`${k.padEnd(9)} ${f2(base0[k])} → ${f2(T.S[k])}   ${T.EXT[k] ? '+' + T.EXT[k].toFixed(2) + ' s' : ''}`);
    console.log(`\ndurasi total: ${d0.toFixed(2)} s → ${T.DURATION.toFixed(2)} s`);
    return;
  }
  if (mode === 'audio') {
    const out = path.resolve(opt('out', 'out/evolusi-layar.wav'));
    const t0 = Date.now(); await makeAudio(out);
    console.log(`wrote ${out}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`); return;
  }
  if (mode === 'serve') {
    const port = +opt('port', '5173');
    await startServer(port, async () => {});
    console.log(`preview: http://localhost:${port}/   (?t=12.5 untuk mulai di detik tertentu)`);
    return;
  }

  await loadVO();
  let sink = async () => {};
  const srv = await startServer(0, (buf, i) => sink(buf, i));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const { browser, page, logs } = await openPage(base, voDurations());
  const duration = await page.evaluate(() => window.__evo.duration);
  const samples = opt('samples', mode === 'video' ? 'auto' : '1');
  const shutter = +opt('shutter', '0.5');
  try {
    if (mode === 'stills') {
      const out = path.resolve(opt('out', 'out/stills')); await mkdir(out, { recursive: true });
      for (const t of opt('t', '0').split(',').map(Number)) {
        await page.evaluate(([t, s, sh]) => window.__evo.still(t, s, sh), [t, samples, shutter]);
        const png = await page.evaluate(() => window.__evo.png());
        const f = path.join(out, `t_${t.toFixed(2).padStart(6, '0')}.png`);
        await writeFile(f, Buffer.from(png.split(',')[1], 'base64')); console.log(f);
      }
    } else if (mode === 'sheet') {
      const from = +opt('from', '0'), to = +opt('to', String(duration)), n = +opt('n', '24'), cols = +opt('cols', '6');
      const times = opt('times') ? opt('times').split(',').map(Number) : Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
      const url = await page.evaluate(({ times, cols }) => {
        const cw = 270, ch = 480, pad = 6, lab = 22, rows = Math.ceil(times.length / cols);
        const cv = document.createElement('canvas'); cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
        const c = cv.getContext('2d'); c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
        const src = document.getElementById('c');
        times.forEach((t, i) => {
          window.__evo.still(t, 1);
          const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
          c.drawImage(src, x, y + lab, cw, ch); c.fillStyle = '#ddd'; c.font = '14px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 16);
        });
        return cv.toDataURL('image/png');
      }, { times, cols });
      const out = path.resolve(opt('out', 'out/sheet.png')); await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, Buffer.from(url.split(',')[1], 'base64')); console.log(out);
    } else if (mode === 'video') {
      const from = +opt('from', '0'), to = +opt('to', String(duration));
      const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS), total = f1 - f0;
      const out = path.resolve(opt('out', 'out/evolusi-layar.mp4')); await mkdir(path.dirname(out), { recursive: true });
      const scale = +opt('scale', '1');
      const vf = scale !== 1 ? ['-vf', `scale=${Math.round(W * scale / 2) * 2}:${Math.round(H * scale / 2) * 2}:flags=lanczos`] : [];
      const wav = await audioFor(out);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
        ...audioArgs(wav, from, to), ...audioEnc(wav), ...vf, '-c:v', 'libx264', '-preset', opt('preset', 'slow'), '-crf', opt('crf', '16'), '-tune', 'grain', '-pix_fmt', 'yuv420p',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
      const ffDone = new Promise((ok, bad) => ff.on('close', (code) => (code === 0 ? ok() : bad(new Error('ffmpeg exited ' + code)))));
      let next = f0;
      sink = (buf, i) => new Promise((ok, bad) => {
        if (i !== next) return bad(new Error(`frame order ${i} != ${next}`));
        if (buf.length !== W * H * 4) return bad(new Error(`bad frame size ${buf.length}`));
        next++;
        ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok);
      });
      const t0 = Date.now(), hist = {};
      for (let i = f0; i < f1; i++) {
        const n = await page.evaluate(([i, u, s, sh]) => window.__evo.push(i, u, s, sh), [i, `${base}/frame`, samples, shutter]);
        hist[n] = (hist[n] ?? 0) + 1;
        const done = i - f0 + 1;
        if (done % 30 === 0 || done === total) {
          const el = (Date.now() - t0) / 1000;
          process.stdout.write(`\r${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${fmt((total - done) / (done / el))}   `);
        }
      }
      ff.stdin.end(); await ffDone;
      console.log(`\nwrote ${out}  (${total} frames, ${(total / FPS).toFixed(2)} s, rendered in ${fmt((Date.now() - t0) / 1000)})`);
      console.log('sub-frames per frame:', Object.entries(hist).map(([k, v]) => `${k}×${v}`).join('  '));
    }
    if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 30).join('\n'));
  } finally { await browser.close(); srv.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
