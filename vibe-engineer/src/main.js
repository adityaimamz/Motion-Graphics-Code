// main.js — preview player + export API (window.__ve). The clock only ever *chooses* t;
// what is drawn at t never depends on how we got there.
import { W, H, FPS, clamp } from './core.js';
import { init, render, DURATION, MARKERS } from './film.js';
import { renderAudio } from './audio.js';
import { applyVO, VO_PLACE } from './timeline.js';
import { loadVOBrowser, durationsOf } from './vo.js';

const Q = new URLSearchParams(location.search);
const EXPORT = Q.has('export');
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { willReadFrequently: EXPORT, alpha: false });
cv.width = W; cv.height = H;

const FAMILIES = [['Jersey 10', [400]], ['IT', [600, 700]]];
async function loadFonts() {
  const jobs = [];
  for (const [f, ws] of FAMILIES) for (const w of ws) jobs.push(document.fonts.load(`${w} 40px "${f}"`, 'AaBb09·…'));
  await Promise.all(jobs);
  const missing = FAMILIES.filter(([f, ws]) => !document.fonts.check(`${ws[0]} 40px "${f}"`)).map(([f]) => f);
  if (missing.length) console.warn('fonts missing:', missing.join(', '));
}
const frame = (t) => render(ctx, t);

window.__ve = {
  ready: false, error: null, width: W, height: H, fps: FPS, get duration() { return DURATION; }, markers: MARKERS, voPlace: VO_PLACE,
  still(t) { frame(t); return 1; },
  // renders frame i and returns raw RGBA bytes (used by render.mjs via POST)
  async push(i, url) {
    frame(i / FPS);
    const d = ctx.getImageData(0, 0, W, H).data;
    const r = await fetch(url, { method: 'POST', body: d, headers: { 'content-type': 'application/octet-stream', 'x-frame': String(i) } });
    if (!r.ok) throw new Error('frame sink rejected frame ' + i);
    return 1;
  },
  // determinism check: render t, then other times, then t again; compare
  check(times) {
    const grab = (t) => { frame(t); const d = ctx.getImageData(0, 0, W, H).data; let h = 2166136261; for (let i = 0; i < d.length; i += 7) h = Math.imul(h ^ d[i], 16777619) >>> 0; return h; };
    const a = times.map(grab); [...times].reverse().forEach(grab); const b = times.map(grab);
    return times.map((t, i) => ({ t, same: a[i] === b[i] }));
  },
  png() { return cv.toDataURL('image/png'); },
};

// ---------------------------------------------------------------- voice-over
let VOICE = {};
const voNote = () => { const n = Object.keys(VOICE).length; return n ? `  ·  voice over: ${n} baris` : '  ·  voice over: belum ada file di vo/ (durasi diperkirakan)'; };

// ---------------------------------------------------------------- preview UI
function setupPreview() {
  document.body.classList.add('preview');
  const ui = document.getElementById('ui'), bar = document.getElementById('bar'), time = document.getElementById('time'), marks = document.getElementById('marks');
  let t = clamp(+(Q.get('t') ?? 0), 0, DURATION), playing = false, last = 0, loop = null;
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
  const setPlaying = (p) => { playing = p; if (p) { ensureAudio(); if (t >= DURATION) t = 0; startAudio(); } else stopAudio(); };
  const seek = (nt) => { t = clamp(nt, 0, DURATION); if (playing) startAudio(); };
  MARKERS.forEach(([name, at]) => {
    const m = document.createElement('button'); m.textContent = name; m.style.left = `${(at / DURATION) * 100}%`;
    m.onclick = () => { seek(at); draw(); }; marks.appendChild(m);
  });
  bar.max = DURATION; bar.step = 1 / FPS;
  bar.oninput = () => { seek(+bar.value); draw(); };
  const draw = () => { frame(t); bar.value = t; time.textContent = `${t.toFixed(2)} / ${DURATION.toFixed(2)} s   frame ${Math.round(t * FPS)}`; };
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
    window.__ve.ready = true;
    if (!EXPORT) setupPreview(); else frame(0);
  } catch (e) { window.__ve.error = String(e && e.stack || e); console.error(e); }
})();
