// Offline renderer (after pdoom-video's, MIT, via beyond-studio and satu-frame). Node 22.6+ runs this .ts file directly.
// Drives the app in headless Chrome (?export=1):
//   stills: node scripts/render.ts stills --t 1.9,8.5 [--out dir]
//   sheet:  node scripts/render.ts sheet --t 1,2,3 [--cols 8] [--out file.png]   (or --from 0 --to 75 --n 40)
//   video:  node scripts/render.ts video [--samples auto|N] [--from s --to s] [--out file.mp4] [--noaudio]
//           (--dry: encode to ffmpeg's null muxer, no file: tests the pipeline and the timing)
//           Never overwrites: the default name carries the date, time and kind (draft/final, the range), and
//           an --out that exists gets -2, -3 … (--overwrite to replace it). Progress per frame in the terminal.
// All modes: --scale 2 (render 2x, downscale), --lang en (English copy). 9:16 only.
// --samples N averages N sub-frames per frame (motion blur); auto steps 4, 12, 36, 108 … up to --max-samples (default 108).
// Starts its own Vite server (no live reload) unless --url points at a running one.
import { chromium, type Page } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const APP = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(APP, '..');
const SCALE = Math.max(1, Math.round(+opt('scale', '1')!));
/** copy language: id (default) or en */
const LANG = opt('lang', 'id') === 'en' ? 'en' : 'id';
const LW = 1080, LH = 1920;
const OW = LW * SCALE, OH = LH * SCALE;
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4')!, max: +opt('max-samples', '108')!, tol: +opt('tol', '3')! }
  : +opt('samples', '1')!;
const SHUTTER = +opt('shutter', '0.5')!;
const hist = (h: Record<string, number>) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');
const cues = JSON.parse(readFileSync(path.join(ROOT, 'cues.json'), 'utf8'));

// ---- terminal
const TTY = !!process.stdout.isTTY;
const t00 = performance.now();
/** A stage of the run, with the time since the start. */
const step = (msg: string) => console.log(`[${dur((performance.now() - t00) / 1000)}] ${msg}`);
/** 3j 05m / 4m 12s / 9s */
function dur(sec: number) {
  if (!isFinite(sec) || sec < 0) return '?';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return h ? `${h}j ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
const num = (x: number, d = 1) => x.toFixed(d).replace('.', ',');
const clock = (ms: number) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`; };
const CH_NAMES: Record<string, string> = { hook: 'S1 Hook', riak: 'S2 Riak', flip: 'S3 Flipbook', ui: 'S4 UI', pop: 'S5 Pop-up', gerak: 'S6 GERAK', mundur: 'S7 Mundur', kosong: 'S8 Kosong', closing: 'S9 Closing' };
const chapterAt = (t: number) => { for (const [k, [a, b]] of Object.entries(cues.ch as Record<string, [number, number]>)) if (t >= a && t < b) return k; return 'closing'; };

// ---- never overwrite a render
/** `file` if it is free (or --overwrite), else file-2, file-3 … */
function freeName(file: string) {
  if (flag('overwrite') || !existsSync(file)) return file;
  const ext = path.extname(file), base = file.slice(0, -ext.length);
  for (let i = 2; ; i++) { const f = `${base}-${i}${ext}`; if (!existsSync(f)) return f; }
}
/** harusnya-diam-60s_2026-09-30_1432_final.mp4 (draft when 1 sub-frame; the range when partial) */
function defaultVideoName(from: number, to: number) {
  const d = new Date(), p2 = (x: number) => String(x).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}`;
  const kind = SAMPLES === 1 ? 'draft' : 'final';
  const part = from > 0 || to < cues.dur ? `_${num(from, 0)}-${num(to, 0)}s`.replace(/,/g, '') : '';
  return `harusnya-diam-${cues.dur}s${LANG === 'en' ? '-en' : ''}_${stamp}_${kind}${part}.mp4`;
}

async function reachable(url: string) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function ensureServer(): Promise<{ url: string; stop: () => void }> {
  const url = opt('url', '')!;
  if (url && (await reachable(url))) { step(`server: ${url} (sudah jalan)`); return { url, stop: () => {} }; }
  step('menyalakan server Vite …');
  const port = 5300 + Math.floor(Math.random() * 500);
  const proc = spawn(process.execPath, [path.join(APP, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], { cwd: APP, stdio: 'ignore', env: { ...process.env, BS_NO_HMR: '1' } });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 150 && !(await reachable(u)); i++) await sleep(100);
  step(`server siap: ${u}`);
  return { url: u, stop: () => proc.kill() };
}

async function openPage(url: string) {
  step('membuka Chrome headless …');
  const browser = await chromium.launch({
    channel: opt('chrome') ? undefined : 'chrome',
    executablePath: opt('chrome'),
    headless: !flag('headed'),
    args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  const page = await browser.newPage({ viewport: { width: LW, height: LH }, deviceScaleFactor: 1 });
  const logs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(`${url}/?export=1${SCALE !== 1 ? `&scale=${SCALE}` : ''}${LANG === 'en' ? '&lang=en' : ''}${opt('q') ? `&${opt('q')}` : ''}`);
  step('memuat film (font, kertas, shader) …');
  await page.waitForFunction(() => (window as any).__bs?.ready || (window as any).__bs?.error, null, { timeout: 180000 });
  const err = await page.evaluate(() => (window as any).__bs.error);
  if (err) throw new Error(`app gagal dimuat:\n${err}\n${logs.join('\n')}`);
  step('film siap');
  return { browser, page, logs };
}

async function stills(page: Page, times: number[], outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];
  for (const t of times) {
    const k: number = await page.evaluate(([t, s, sh]) => (window as any).__bs.still(t, s, sh), [t, SAMPLES, SHUTTER] as const);
    const f = path.join(outDir, `t${t.toFixed(3).padStart(7, '0')}.png`);
    step(`still ${files.length + 1}/${times.length}  t ${num(t, 3)} s  ${CH_NAMES[chapterAt(t)]}${typeof SAMPLES !== 'number' ? `  ${k} sub-frame` : ''}`);
    writeFileSync(f, Buffer.from(await page.evaluate(() => (window as any).__bs.png()), 'base64'));
    files.push(f);
  }
  return files;
}

async function sheet(page: Page, times: number[], cols: number, out: string) {
  const dataUrl: string = await page.evaluate(async ({ times, cols, samples, shutter }) => {
    const B = (window as any).__bs;
    const src = document.getElementById('c') as HTMLCanvasElement;
    const sc = 360 / Math.max(src.width, src.height);
    const cw = Math.round(src.width * sc), ch = Math.round(src.height * sc), pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    times.forEach((t: number, i: number) => {
      B.still(t, samples, shutter);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 13);
    });
    return cv.toDataURL('image/png');
  }, { times, cols, samples: SAMPLES, shutter: SHUTTER });
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(dataUrl.split(',')[1]!, 'base64'));
}

async function video(page: Page, ranges: [number, number][], fps: number, out: string) {
  mkdirSync(path.dirname(out), { recursive: true });
  const frames = ranges.flatMap(([a, b]) => { const n0 = Math.round(a * fps), n1 = Math.round(b * fps); return Array.from({ length: n1 - n0 }, (_, i) => n0 + i); });
  const audio = path.join(APP, 'public/audio/score.wav');
  const withAudio = !flag('noaudio') && existsSync(audio);
  const args = [flag('overwrite') ? '-y' : '-n', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
  if (withAudio) args.push('-i', audio);
  const vf = ['vflip', ...(SCALE > 1 ? [`scale=${LW}:${LH}:flags=lanczos`] : []), 'format=yuv420p'].join(',');
  args.push('-vf', vf, '-c:v', 'libx264', '-preset', opt('preset', 'slow')!, '-crf', opt('crf', '16')!, '-tune', 'grain',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv');
  if (withAudio) {
    // the audio of each range, joined with tiny fades, then EBU R128 loudness (-14 LUFS, -1 dBTP)
    const parts = ranges.map(([a, b], i) => `[1:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0, b - a - 0.04)}:d=0.04[a${i}]`);
    const cat = ranges.length > 1 ? `;${ranges.map((_, i) => `[a${i}]`).join('')}concat=n=${ranges.length}:v=0:a=1[ac]` : '';
    const last = ranges.length > 1 ? '[ac]' : '[a0]';
    args.push('-filter_complex', `${parts.join(';')}${cat};${last}loudnorm=I=-14:TP=-1.0:LRA=11[ao]`, '-map', '0:v', '-map', '[ao]', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-shortest');
  }
  if (flag('dry')) args.push('-f', 'null', '-');
  else args.push('-movflags', '+faststart', out);
  step(`encode: ${flag('dry') ? '(dry run, tanpa file)' : out}`);
  step(`${frames.length} frame @ ${fps} fps, ${typeof SAMPLES === 'number' ? `${SAMPLES} sub-frame` : `sub-frame adaptif ${SAMPLES.min}–${SAMPLES.max}`}, ${withAudio ? 'dengan audio' : 'tanpa audio'}`);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  let got = 0;
  const total = frames.length;
  const t0 = performance.now();
  // progress: per frame on a TTY (one line redrawn), every ~10 s otherwise; a summary line per chapter
  let lastT = t0, lastLog = t0, recent: number[] = [];
  let chap = '', chapStart = t0, chapFrames = 0, chapSub = 0;
  const chapDone = (now: number) => {
    if (!chap) return;
    const line = `✓ ${CH_NAMES[chap]} selesai: ${chapFrames} frame, ${dur((now - chapStart) / 1000)}, rata ${num(chapSub / chapFrames, 0)} sub-frame`;
    if (TTY) process.stdout.write('\r\x1b[2K');
    console.log(line);
  };
  const progress = (sub: number) => {
    const now = performance.now();
    const n = frames[got - 1]!, t = n / fps, c = chapterAt(t);
    if (c !== chap) { chapDone(now); chap = c; chapStart = now; chapFrames = 0; chapSub = 0; }
    chapFrames++; chapSub += sub;
    recent.push(now - lastT); lastT = now; if (recent.length > 30) recent.shift();
    const el = (now - t0) / 1000, avg = got / el, inst = 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length);
    const left = (total - got) / avg;
    const pct = (100 * got) / total, W = 24, fill = Math.round((W * got) / total);
    const l1 = `[${'█'.repeat(fill)}${'░'.repeat(W - fill)}] ${num(pct)}%  ${got}/${total}  t ${num(t, 2)} s  ${CH_NAMES[c]}`;
    const l2 = `frame ini ${sub} sub  ·  ${num(inst, 2)} fps (rata ${num(avg, 2)})  ·  lewat ${dur(el)}  ·  sisa ~${dur(left)}  ·  selesai ±${clock(Date.now() + left * 1000)}`;
    if (TTY) process.stdout.write(`\r\x1b[2K${l1}\n\x1b[2K${l2}\x1b[1A\r`);
    else if (now - lastLog > 10000 || got === total) { console.log(`${l1}  |  ${l2}`); lastLog = now; }
    if (got === total) { if (TTY) process.stdout.write('\n\n'); chapDone(now); }
  };
  // the page POSTs each frame here, in order; the reply comes once ffmpeg has taken it (backpressure)
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method !== 'POST') { res.end(); return; }
    const sub = +(req.headers['x-sub'] ?? 1);
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const ok = ff.stdin.write(Buffer.concat(chunks));
      const reply = () => {
        got++;
        res.end(String(got));
        progress(sub);
      };
      if (ok) reply(); else ff.stdin.once('drain', reply);
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const port = (server.address() as { port: number }).port;
  const used: Record<string, number> = await page.evaluate((o) => (window as any).__bs.stream(o), { frames, fps, url: `http://127.0.0.1:${port}/`, samples: SAMPLES, shutter: SHUTTER });
  while (got < total) await sleep(20);
  step('menutup encode (ffmpeg: audio + loudness) …');
  ff.stdin.end();
  await done;
  server.close();
  const size = !flag('dry') && existsSync(out) ? `, ${num(statSync(out).size / 1e6, 0)} MB` : '';
  step(`selesai: ${flag('dry') ? '(dry run, tanpa file)' : out} (${got} frame, ${dur((performance.now() - t0) / 1000)}${size})`);
  console.log(`sub-frame per frame (jumlah:frame): ${hist(used)}`);
}

const { url, stop } = await ensureServer();
const { browser, page, logs } = await openPage(url);
try {
  if (mode === 'gpu') {
    console.log(await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')!;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }));
  } else if (mode === 'stills') {
    const times = (opt('t') ?? '0').split(',').map(Number);
    console.log((await stills(page, times, opt('out', path.join(ROOT, 'out/stills'))!)).join('\n'));
  } else if (mode === 'sheet') {
    let times: number[];
    if (opt('t')) times = opt('t')!.split(',').map(Number);
    else { const from = +opt('from', '0')!, to = +opt('to', String(cues.dur - 0.02))!, n = +opt('n', '24')!; times = Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1)); }
    const out = opt('out', path.join(ROOT, 'out/sheet.png'))!;
    await sheet(page, times, +opt('cols', '8')!, out);
    console.log(out);
  } else if (mode === 'video') {
    const ranges: [number, number][] = [[+opt('from', '0')!, +opt('to', String(cues.dur))!]];
    const want = path.resolve(opt('out', path.join(ROOT, 'out', defaultVideoName(ranges[0]![0], ranges[0]![1])))!);
    const out = freeName(want);
    if (out !== want) step(`${path.basename(want)} sudah ada: tidak ditimpa, ditulis ke ${path.basename(out)} (--overwrite untuk menimpa)`);
    await video(page, ranges, +opt('fps', '60')!, out);
  }
  const errs: string[] = await page.evaluate(() => (window as any).__bs.errors);
  if (errs.length) console.error('FILM ERRORS:\n' + errs.join('\n'));
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser.close();
  stop();
}
