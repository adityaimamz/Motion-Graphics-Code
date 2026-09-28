// Offline renderer (after pdoom-video's, MIT). Node 22.6+ runs this .ts file directly. Drives the app
// in headless Chrome (?export=1):
//   stills: node scripts/render.ts stills --t 1.9,8.5 [--out dir]
//   sheet:  node scripts/render.ts sheet --t 1,2,3 [--cols 8] [--out file.png]   (or --from 0 --to 45 --n 24)
//   video:  node scripts/render.ts video [--samples auto|N] [--cut sting|bumper] [--from s --to s] [--out file.mp4] [--noaudio]
//           (--dry: encode to ffmpeg's null muxer, no file: tests the pipeline and the timing)
// All modes: --fmt v|h (9:16 default / 16:9), --lang id|en (default id), --scale 2 (render 2x, downscale).
// --samples N averages N sub-frames per frame (motion blur); auto picks 4, 12 or 36 (--max-samples).
// Starts its own Vite server (no live reload) unless --url points at a running one.
import { chromium, type Page } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const APP = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(APP, '..');
const FMT = opt('fmt', 'v') === 'h' ? 'h' : 'v';
const LANG = opt('lang', 'id') === 'en' ? 'en' : 'id';
const SCALE = Math.max(1, Math.round(+opt('scale', '1')!));
const LW = FMT === 'v' ? 1080 : 1920, LH = FMT === 'v' ? 1920 : 1080;
const OW = LW * SCALE, OH = LH * SCALE;
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4')!, max: +opt('max-samples', '36')!, tol: +opt('tol', '3')! }
  : +opt('samples', '1')!;
const SHUTTER = +opt('shutter', '0.5')!;
const hist = (h: Record<string, number>) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');
const cues = JSON.parse(readFileSync(path.join(ROOT, 'cues.json'), 'utf8'));

async function reachable(url: string) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function ensureServer(): Promise<{ url: string; stop: () => void }> {
  const url = opt('url', '')!;
  if (url && (await reachable(url))) return { url, stop: () => {} };
  const port = 5300 + Math.floor(Math.random() * 500);
  const proc = spawn(process.execPath, [path.join(APP, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort'], { cwd: APP, stdio: 'ignore', env: { ...process.env, BS_NO_HMR: '1' } });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 150 && !(await reachable(u)); i++) await sleep(100);
  return { url: u, stop: () => proc.kill() };
}

async function openPage(url: string) {
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
  await page.goto(`${url}/?export=1&fmt=${FMT}&lang=${LANG}${SCALE !== 1 ? `&scale=${SCALE}` : ''}`);
  await page.waitForFunction(() => (window as any).__bs?.ready || (window as any).__bs?.error, null, { timeout: 180000 });
  const err = await page.evaluate(() => (window as any).__bs.error);
  if (err) throw new Error(`app gagal dimuat:\n${err}\n${logs.join('\n')}`);
  return { browser, page, logs };
}

async function stills(page: Page, times: number[], outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];
  for (const t of times) {
    const k: number = await page.evaluate(([t, s, sh]) => (window as any).__bs.still(t, s, sh), [t, SAMPLES, SHUTTER] as const);
    const f = path.join(outDir, `${FMT}-${LANG}_${t.toFixed(2).padStart(6, '0')}.png`);
    if (typeof SAMPLES !== 'number') console.log(`t=${t}: ${k} sub-frame`);
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
  const args = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
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
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((r) => ff.on('close', r));
  let got = 0;
  const total = frames.length;
  const t0 = performance.now();
  // the page POSTs each frame here, in order; the reply comes once ffmpeg has taken it (backpressure)
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method !== 'POST') { res.end(); return; }
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const ok = ff.stdin.write(Buffer.concat(chunks));
      const reply = () => {
        got++;
        res.end(String(got));
        if (got % 60 === 0 || got === total) {
          const el = (performance.now() - t0) / 1000;
          process.stdout.write(`\r${got}/${total} frame  ${(got / el).toFixed(2)} fps  sisa ~${((total - got) / (got / el) / 60).toFixed(1)} menit   `);
        }
      };
      if (ok) reply(); else ff.stdin.once('drain', reply);
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const port = (server.address() as { port: number }).port;
  const used: Record<string, number> = await page.evaluate((o) => (window as any).__bs.stream(o), { frames, fps, url: `http://127.0.0.1:${port}/`, samples: SAMPLES, shutter: SHUTTER });
  while (got < total) await sleep(20);
  ff.stdin.end();
  await done;
  server.close();
  console.log(`\nselesai: ${flag('dry') ? '(dry run, tanpa file)' : out} (${got} frame, ${((performance.now() - t0) / 60000).toFixed(1)} menit)`);
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
    const out = opt('out', path.join(ROOT, `out/sheet-${FMT}-${LANG}.png`))!;
    await sheet(page, times, +opt('cols', FMT === 'v' ? '8' : '5')!, out);
    console.log(out);
  } else if (mode === 'video') {
    const cut = opt('cut');
    const ranges: [number, number][] = cut ? cues.cuts[cut] : [[+opt('from', '0')!, +opt('to', String(cues.dur))!]];
    if (!ranges) throw new Error(`--cut ${cut}: pilih sting atau bumper`);
    const name = `beyond-studio-${cut ?? '45s'}-${LANG}${FMT === 'v' ? '-vertical' : ''}.mp4`;
    await video(page, ranges, +opt('fps', '60')!, path.resolve(opt('out', path.join(ROOT, 'out', name))!));
  }
  const errs: string[] = await page.evaluate(() => (window as any).__bs.errors);
  if (errs.length) console.error('FILM ERRORS:\n' + errs.join('\n'));
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser.close();
  stop();
}
