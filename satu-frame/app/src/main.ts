// Entry: preview player (default) or export mode (?export=1, driven by scripts/render.ts).
import { Engine, type AdaptiveSampling } from './engine/engine';
import { PW, PH, SCALE, W, H } from './engine/gl';
import { film } from './film';
import { CH } from './cues';

const params = new URLSearchParams(location.search);
const EXPORT = params.has('export');
const FROM = params.get('t') ? parseFloat(params.get('t')!) : null;

const canvas = document.getElementById('c') as HTMLCanvasElement;
canvas.width = PW;
canvas.height = PH;
canvas.style.aspectRatio = `${W}/${H}`;
document.body.style.setProperty('--w', `${W}px`);
document.body.style.setProperty('--h', `${H}px`);

const engine = new Engine(canvas, film);

declare global {
  interface Window { __bs: any }
}

async function boot() {
  await engine.init();
  if (EXPORT) setupExport();
  else setupPlayer();
}

// ------------------------------------------------------------------ export API
function setupExport() {
  document.body.classList.add('export');
  window.__bs = {
    engine,
    duration: engine.duration,
    errors: engine.errors,
    scale: SCALE,
    width: PW,
    height: PH,
    chapters: CH,
    /** Render a single frame at t. */
    still(t: number, samples: number | AdaptiveSampling = 1, shutter = 0.5) { return engine.render(t, 1 / 60, true, samples, shutter); },
    /** The last rendered frame as a full-resolution PNG, base64. */
    async png() {
      const px = await engine.readPixelsAsync(), row = PW * 4;
      const img = new ImageData(PW, PH);
      for (let y = 0; y < PH; y++) img.data.set(px.subarray((PH - 1 - y) * row, (PH - y) * row), y * row);
      const oc = new OffscreenCanvas(PW, PH);
      oc.getContext('2d')!.putImageData(img, 0, 0);
      const b = new Uint8Array(await (await oc.convertToBlob({ type: 'image/png' })).arrayBuffer());
      let s = '';
      for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
      return btoa(s);
    },
    /**
     * Render the given frame numbers at fps and POST each raw RGBA frame (bottom-up) to `url`, in order,
     * with at most `inflight` frames not yet taken by the encoder (backpressure).
     */
    async stream(opts: { frames: number[]; fps: number; url: string; samples?: number | AdaptiveSampling; shutter?: number; inflight?: number }) {
      const dt = 1 / opts.fps;
      const S = opts.samples ?? 1, SH = opts.shutter ?? 0.5;
      const used: Record<number, number> = {};
      const pending: Promise<unknown>[] = [];
      let chain: Promise<unknown> = Promise.resolve();
      for (const n of opts.frames) {
        const k = engine.render(n * dt, dt, false, S, SH);
        used[k] = (used[k] ?? 0) + 1;
        const buf = await engine.readPixelsAsync();
        // sequential POSTs keep the frames in order; up to `inflight` are queued behind the encoder
        chain = chain.then(() => fetch(opts.url, { method: 'POST', body: new Blob([buf as Uint8Array<ArrayBuffer>]) }));
        pending.push(chain);
        if (pending.length >= (opts.inflight ?? 4)) await pending.shift();
      }
      await chain;
      return used;
    },
  };
  window.__bs.ready = true;
}

// ------------------------------------------------------------------ preview player
function setupPlayer() {
  const audio = new Audio('audio/score.wav');
  audio.preload = 'auto';
  const ui = document.getElementById('ui')!;
  const scrub = document.getElementById('scrub') as HTMLInputElement;
  const info = document.getElementById('info')!;
  const marks = document.getElementById('marks')!;
  const errs = document.getElementById('errs')!;
  const dur = engine.duration;
  scrub.max = String(dur);
  scrub.step = '0.001';
  const chapters = Object.entries(CH).map(([id, [start, end]]) => ({ id, start, end }));
  for (const e of chapters) {
    const m = document.createElement('div');
    m.className = 'mark';
    m.style.left = `${(e.start / dur) * 100}%`;
    m.style.width = `${((e.end - e.start) / dur) * 100}%`;
    m.textContent = e.id;
    m.onclick = () => seek(e.start);
    marks.appendChild(m);
  }

  let t = FROM ?? 0;
  let playing = false;
  let loop: [number, number] | null = null;
  let lastAudioT = 0, lastPerf = 0;
  const seek = (x: number) => { t = Math.max(0, Math.min(dur - 0.001, x)); audio.currentTime = t; };
  seek(t);

  const toggle = () => { playing = !playing; if (playing) { audio.currentTime = t; audio.play(); } else audio.pause(); };
  canvas.onclick = toggle;
  scrub.oninput = () => seek(parseFloat(scrub.value));
  window.addEventListener('keydown', (ev) => {
    if (ev.key === ' ') { ev.preventDefault(); toggle(); }
    if (ev.key === 'ArrowRight') seek(t + (ev.shiftKey ? 1 : 1 / 60));
    if (ev.key === 'ArrowLeft') seek(t - (ev.shiftKey ? 1 : 1 / 60));
    if (ev.key === 'l') {
      const e = chapters.find((x) => t >= x.start && t < x.end);
      loop = loop ? null : e ? [e.start, e.end] : null;
    }
    if (ev.key === 'h') ui.classList.toggle('hidden');
    if (ev.key === ']') { const e = chapters.find((x) => x.start > t + 0.01); if (e) seek(e.start); }
    if (ev.key === '[') { const es = chapters.filter((x) => x.start < t - 0.3); const e = es[es.length - 1]; if (e) seek(e.start); }
  });

  let frames = 0, fpsT = performance.now(), fps = 0;
  const tick = () => {
    if (playing) {
      const now = performance.now();
      if (audio.currentTime !== lastAudioT) { lastAudioT = audio.currentTime; lastPerf = now; }
      t = lastAudioT + (audio.paused ? 0 : (now - lastPerf) / 1000);
      if (loop && t >= loop[1]) seek(loop[0]);
      if (audio.ended || t >= dur) { playing = false; t = Math.min(t, dur - 0.001); }
    }
    engine.render(t, 1 / 60);
    scrub.value = String(t);
    frames++;
    const now = performance.now();
    if (now - fpsT > 500) { fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; }
    const e = chapters.find((x) => t >= x.start && t < x.end);
    info.textContent = `${t.toFixed(3)}s  ketukan ${(t / (60 / 128)).toFixed(2)}  [${e?.id ?? '—'}]  ${fps.toFixed(0)}fps  ${loop ? 'LOOP  ' : ''}· Spasi play · ←/→ 1 frame · Shift 1 s · [ ] bab · L loop · H sembunyikan`;
    if (engine.errors.length) { errs.textContent = engine.errors.join('\n\n'); errs.style.display = 'block'; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#f55;position:fixed;top:0;left:0">${String(e?.stack ?? e)}</pre>`);
  window.__bs = { error: String(e?.stack ?? e) };
});
