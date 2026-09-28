// main.js — preview player + export API (window.__evo). The clock only ever *chooses* t;
// what is drawn at t never depends on how we got there.
import { W, H, FPS, clamp } from './core.js';
import { init, render, post, DURATION, MARKERS, motion } from './film.js';
import { renderAudio } from './audio.js';
import { applyVO, VO_PLACE } from './timeline.js';
import { loadVOBrowser, durationsOf } from './vo.js';

const Q = new URLSearchParams(location.search);
const EXPORT = Q.has('export');
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { willReadFrequently: EXPORT, alpha: false });
cv.width = W; cv.height = H;

const FAMILIES = [
  ['IT', [400, 450, 500, 550, 600, 650, 700, 800]], ['VT323', [400]], ['Comic Neue', [700]], ['Tinos', [400, 700]],
  ['Silkscreen', [400, 700]], ['Exo 2', [800]], ['Orbitron', [900]], ['Arimo', [400, 700]], ['Montserrat', [500, 600, 700]], ['Nunito', [900]],
];
async function loadFonts() {
  const jobs = [];
  for (const [f, ws] of FAMILIES) for (const w of ws) jobs.push(document.fonts.load(`${w} 40px "${f}"`, 'AaBb09'));
  jobs.push(document.fonts.load('italic 800 40px "Exo 2"'), document.fonts.load('italic 700 40px "Arimo"'));
  await Promise.all(jobs);
  const missing = FAMILIES.filter(([f, ws]) => !document.fonts.check(`${ws[0]} 40px "${f}"`)).map(([f]) => f);
  if (missing.length) console.warn('fonts missing:', missing.join(', '));
}

// ---- sub-frame accumulation (motion blur): average n renders spread over `shutter` of a frame
let acc = null, img = null;
function frame(t, samples = 1, shutter = 0.5) {
  const n = Math.max(1, samples | 0);
  if (n === 1) { render(ctx, t); post(ctx, t); return 1; }
  if (!acc) { acc = new Uint32Array(W * H * 4); img = ctx.createImageData(W, H); }
  acc.fill(0);
  for (let s = 0; s < n; s++) {
    const ts = t + ((s + 0.5) / n - 0.5) * (shutter / FPS);
    render(ctx, ts);
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let i = 0; i < d.length; i++) acc[i] += d[i];
  }
  const o = img.data;
  for (let i = 0; i < o.length; i++) o[i] = (acc[i] + (n >> 1)) / n;
  ctx.putImageData(img, 0, 0);
  post(ctx, t);
  return n;
}
const pick = (t, samples) => (samples === 'auto' ? motion(t) : +samples || 1);

window.__evo = {
  ready: false, error: null, width: W, height: H, fps: FPS, get duration() { return DURATION; }, markers: MARKERS, voPlace: VO_PLACE,
  still(t, samples = 1, shutter = 0.5) { return frame(t, pick(t, samples), shutter); },
  // renders frame i and returns raw RGBA bytes (used by render.mjs via POST)
  async push(i, url, samples = 1, shutter = 0.5) {
    const t = i / FPS, n = frame(t, pick(t, samples), shutter);
    const d = ctx.getImageData(0, 0, W, H).data;
    const r = await fetch(url, { method: 'POST', body: d, headers: { 'content-type': 'application/octet-stream', 'x-frame': String(i) } });
    if (!r.ok) throw new Error('frame sink rejected frame ' + i);
    return n;
  },
  png() { return cv.toDataURL('image/png'); },
};

// ---------------------------------------------------------------- voice-over
let VOICE = {};
const voNote = () => { const n = Object.keys(VOICE).length; return n ? `  ·  voice over: ${n} baris` : '  ·  voice over: belum ada file di vo/'; };

// ---------------------------------------------------------------- preview UI
function setupPreview() {
  document.body.classList.add('preview');
  const ui = document.getElementById('ui'), bar = document.getElementById('bar'), time = document.getElementById('time'), marks = document.getElementById('marks');
  let t = clamp(+(Q.get('t') ?? 0), 0, DURATION), playing = false, last = 0, loop = null;
  // ---- audio: synthesised once (same function the renderer muxes), played against the audio clock
  let ac = null, abuf = null, src = null, t0Audio = 0, tAt = 0, muted = Q.has('mute');
  const audioStatus = document.getElementById('audio');
  audioStatus.textContent = 'audio: tekan play' + voNote();
  const ensureAudio = () => {
    if (abuf) return;
    audioStatus.textContent = 'menyiapkan audio…';
    const a = renderAudio({ vo: VOICE });
    ac = new AudioContext({ sampleRate: a.sr });
    abuf = ac.createBuffer(2, a.L.length, a.sr); abuf.copyToChannel(a.L, 0); abuf.copyToChannel(a.R, 1);
    audioStatus.textContent = (muted ? 'audio: mute (m)' : 'audio: on (m untuk mute)') + voNote();
  };
  const stopAudio = () => { if (src) { try { src.stop(); } catch {} src.disconnect(); src = null; } };
  const startAudio = () => {
    stopAudio(); if (muted || !abuf) return;
    if (ac.state === 'suspended') ac.resume();
    src = ac.createBufferSource(); src.buffer = abuf; src.connect(ac.destination);
    t0Audio = ac.currentTime + 0.03; tAt = t; src.start(t0Audio, t);
  };
  const setPlaying = (p) => {
    playing = p;
    if (p) { ensureAudio(); if (t >= DURATION) t = 0; startAudio(); } else stopAudio();
  };
  const seek = (nt) => { t = clamp(nt, 0, DURATION); if (playing) startAudio(); };
  MARKERS.forEach(([name, at]) => {
    const m = document.createElement('button'); m.textContent = name; m.style.left = `${(at / DURATION) * 100}%`;
    m.onclick = () => { seek(at); draw(); }; marks.appendChild(m);
  });
  bar.max = DURATION; bar.step = 1 / FPS;
  bar.oninput = () => { seek(+bar.value); draw(); };
  const draw = () => {
    frame(t, 1);
    bar.value = t;
    time.textContent = `${t.toFixed(2)} / ${DURATION.toFixed(2)} s   frame ${Math.round(t * FPS)}`;
  };
  const tick = (now) => {
    if (playing) {
      if (src) t = tAt + Math.max(0, ac.currentTime - t0Audio); // audio clock drives the picture
      else t += Math.min(0.1, (now - last) / 1000);
      if (loop && t >= loop[1]) seek(loop[0]);
      if (t >= DURATION) { t = DURATION; setPlaying(false); }
      draw();
    }
    last = now; requestAnimationFrame(tick);
  };
  const cur = () => { let i = 0; while (i < MARKERS.length - 1 && t >= MARKERS[i + 1][1] - 1e-6) i++; return i; };
  addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === ' ') { setPlaying(!playing); e.preventDefault(); }
    else if (k === 'ArrowRight') seek(t + (e.shiftKey ? 5 : 1));
    else if (k === 'ArrowLeft') seek(t - (e.shiftKey ? 5 : 1));
    else if (k === '.') { setPlaying(false); seek(t + 1 / FPS); }
    else if (k === ',') { setPlaying(false); seek(t - 1 / FPS); }
    else if (k === ']') seek(MARKERS[Math.min(MARKERS.length - 1, cur() + 1)][1]);
    else if (k === '[') seek(MARKERS[Math.max(0, cur() - (t - MARKERS[cur()][1] < 0.3 ? 1 : 0))][1]);
    else if (k === 'l') { const i = cur(); loop = loop ? null : [MARKERS[i][1], MARKERS[i + 1]?.[1] ?? DURATION]; }
    else if (k === 'm') { muted = !muted; if (abuf) audioStatus.textContent = (muted ? 'audio: mute (m)' : 'audio: on (m untuk mute)') + voNote(); if (playing) (muted ? stopAudio() : startAudio()); }
    else if (k === 'h') ui.classList.toggle('hidden');
    else return;
    draw();
  });
  document.getElementById('play').onclick = () => setPlaying(!playing);
  draw(); requestAnimationFrame(tick);
}

(async () => {
  try {
    await loadFonts();
    if (EXPORT) { const d = Q.get('vo'); if (d) applyVO(JSON.parse(d)); } // durations measured by render.mjs
    else { VOICE = await loadVOBrowser(); applyVO(durationsOf(VOICE)); }
    init();
    window.__evo.ready = true;
    if (!EXPORT) setupPreview(); else frame(0, 1);
  } catch (e) { window.__evo.error = String(e && e.stack || e); console.error(e); }
})();
