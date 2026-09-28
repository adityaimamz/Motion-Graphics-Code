const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORK_DIR = __dirname;
const HTML_FILE = path.join(WORK_DIR, 'celestial-scrolls-film.html');
const AUDIO_FILE = path.join(WORK_DIR, 'celestial-scrolls-audio.mp3');
const OUTPUT_FILE = path.join(WORK_DIR, 'celestial-scrolls-film.mp4');

const FPS = 60;
const DURATION = 30.0;
const TOTAL_FRAMES = Math.round(DURATION * FPS); // 1800 frames
const WIDTH = 1920;
const HEIGHT = 1080;
const PORT = 9222;

// 1. Ekstraksi Audio jika belum ada
function ensureAudio() {
  if (fs.existsSync(AUDIO_FILE)) {
    console.log('[1/4] File audio sudah siap:', AUDIO_FILE);
    return;
  }
  console.log('[1/4] Mengekstrak audio dari HTML...');
  const htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
  const marker = 'const AUDIO_B64 = "';
  const startIdx = htmlContent.indexOf(marker);
  if (startIdx === -1) throw new Error('AUDIO_B64 tidak ditemukan di file HTML');
  const dataStart = startIdx + marker.length;
  const dataEnd = htmlContent.indexOf('"', dataStart);
  const b64 = htmlContent.substring(dataStart, dataEnd);
  fs.writeFileSync(AUDIO_FILE, Buffer.from(b64, 'base64'));
  console.log('[1/4] Audio berhasil disimpan ke:', AUDIO_FILE);
}

// 2. Main Render Process
async function main() {
  console.log('=== MEMULAI RENDER CELESTIAL SCROLLS KE VIDEO MP4 ===');
  console.log(`Resolusi: ${WIDTH}x${HEIGHT} | FPS: ${FPS} | Total Frame: ${TOTAL_FRAMES}`);

  ensureAudio();

  const tempProfile = path.join(WORK_DIR, '.chrome_render_profile');
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}
  const htmlUrl = 'file:///' + HTML_FILE.replace(/\\/g, '/') + '?render';

  console.log('[2/4] Menjalankan Headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfile}`,
    htmlUrl
  ]);

  chrome.on('error', (err) => {
    console.error('Error saat menjalankan Chrome:', err);
    process.exit(1);
  });

  // Tunggu Chrome remote debugging siap
  let targets = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      targets = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${PORT}/json/list`, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    chrome.kill();
    throw new Error('Gagal terhubung ke port remote debugging Chrome');
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Menghubungkan WebSocket ke halaman...');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const { resolve, reject } = callbacks.get(data.id);
      callbacks.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Tunggu window.READY
  console.log('Menunggu seluruh aset & font di HTML siap...');
  let ready = false;
  for (let i = 0; i < 60; i++) {
    const res = await send('Runtime.evaluate', {
      expression: 'Boolean(window.READY && typeof window.renderFrame === "function")'
    });
    if (res.result && res.result.value === true) {
      ready = true;
      break;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (!ready) {
    ws.close();
    chrome.kill();
    throw new Error('Timeout: window.READY tidak bernilai true.');
  }

  console.log('[3/4] Menyiapkan FFmpeg encoder...');
  const ffmpeg = spawn('ffmpeg', [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(FPS),
    '-i', '-',
    '-i', AUDIO_FILE,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-movflags', '+faststart',
    OUTPUT_FILE
  ]);

  ffmpeg.stderr.on('data', (d) => {
    const str = d.toString();
    if (str.includes('Error') || str.includes('fatal')) {
      console.error('[FFmpeg]', str.trim());
    }
  });

  ffmpeg.on('error', (err) => {
    console.error('Error FFmpeg:', err);
  });

  ffmpeg.stdin.on('error', (err) => {
    if (err.code !== 'EPIPE' && err.code !== 'EOF') {
      console.error('[FFmpeg stdin error]', err);
    }
  });

  const ffmpegClosePromise = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exit with code ${code}`));
    });
  });

  console.log(`[4/4] Merender ${TOTAL_FRAMES} frame ke FFmpeg...`);
  const startTime = Date.now();

  function writeToFfmpeg(buffer) {
    return new Promise((resolve) => {
      if (ffmpeg.stdin.destroyed) return resolve();
      const ok = ffmpeg.stdin.write(buffer);
      if (ok) resolve();
      else ffmpeg.stdin.once('drain', resolve);
    });
  }

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const t = f / FPS;
    
    // Render frame spesifik pada waktu t
    await send('Runtime.evaluate', {
      expression: `window.renderFrame(${t.toFixed(5)});`
    });

    // Tangkap screenshot JPEG kualitas tinggi
    const shot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 95
    });

    const buf = Buffer.from(shot.data, 'base64');
    await writeToFfmpeg(buf);

    if ((f + 1) % 60 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const percent = (((f + 1) / TOTAL_FRAMES) * 100).toFixed(1);
      const fpsReal = ((f + 1) / ((Date.now() - startTime) / 1000)).toFixed(1);
      const remainingSec = (((TOTAL_FRAMES - (f + 1)) / fpsReal)).toFixed(0);
      console.log(`Progress: ${f + 1}/${TOTAL_FRAMES} (${percent}%) | Waktu Film: ${t.toFixed(1)}s/30.0s | Kecepatan: ${fpsReal} fps | Estimasi Sisa: ${remainingSec}s`);
    }
  }

  console.log('Menutup stream FFmpeg dan menyelesaikan encoding video...');
  try {
    ffmpeg.stdin.end();
  } catch (e) {}

  await ffmpegClosePromise;

  ws.close();
  chrome.kill();

  // Bersihkan temporary profile
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const stat = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

  console.log('=== SELESAI ===');
  console.log(`Video berhasil dibuat: ${OUTPUT_FILE}`);
  console.log(`Ukuran File: ${sizeMB} MB | Durasi Render: ${totalTime} detik`);
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
