// main.js — preview player + export API (window.__tv). Pattern from vibe-engineer/src/main.js. The clock only ever
// *chooses* t; what is drawn at t never depends on how we got there.
import { FPS, clamp } from './core.js';
import { init, render, DURATION, MARKERS } from './film.js';
import { renderAudio } from './audio.js';
import { applyVO, blurAt, S } from './timeline.js';
import { loadVOBrowser, durationsOf } from './vo.js';
import { A } from './artefak.js';
import { settle } from './dom.js';

const Q = new URLSearchParams(location.search);
const EXPORT = Q.has('export');

const FONTS = [['IT', [500, 600, 640, 680, 700]], ['IN', [400, 450, 500, 600, 700, 750]], ['JB', [400, 500]], ['IS', [400], 'italic']];
async function loadFonts() {
  const jobs = [];
  for (const [f, ws, style = 'normal'] of FONTS) for (const w of ws) jobs.push(document.fonts.load(`${style} ${w} 40px "${f}"`, 'AaBb09·…%'));
  await Promise.all(jobs);
  await document.fonts.ready;
  const missing = FONTS.filter(([f, ws, style = 'normal']) => !document.fonts.check(`${style} ${ws[0]} 40px "${f}"`)).map(([f]) => f);
  if (missing.length) throw new Error('fonts missing: ' + missing.join(', '));
}
// every image the film uses, decoded before the first frame
async function loadImages() {
  // stills are small: decode them all up front; clip frames are decoded as they are shown (see dom.src/settle)
  const urls = [...A.stills.map((n) => `assets/ve/${n}.jpg`)];
  await Promise.all(urls.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => console.warn('image failed', u)); }));
  // and the ones already in the DOM
  await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
}

window.__tv = {
  ready: false, error: null, fps: FPS, get duration() { return DURATION; }, markers: MARKERS,
  async seek(t) { render(t); await settle(); return 1; },
  blurAt: (t) => blurAt(t),
};

let VOICE = {}, CLIPA = {};
async function loadClipAudio(sr = 48000) {
  const out = {};
  for (const [name, c] of Object.entries(A.video.clips)) {
    if (!c.audio) continue;
    try { const ab = await new OfflineAudioContext(1, 1, sr).decodeAudioData(await (await fetch(`assets/ve/klip/${name}.wav`)).arrayBuffer()); out[name] = ab.getChannelData(0).slice(); } catch (e) { console.warn('clip audio', name, e); }
  }
  return out;
}
const voNote = () => { const n = Object.keys(VOICE).length; return n ? `  ·  voice over: ${n} baris` : '  ·  voice over: belum ada file di vo/'; };

function fit() {
  const k = Math.min((innerHeight - 110) / 1920, (innerWidth - 20) / 1080);
  document.getElementById('frame').style.transform = `scale(${k}) translateX(-50%)`;
}

function setupPreview() {
  document.body.classList.add('preview');
  fit(); addEventListener('resize', fit);
  const ui = document.getElementById('ui'), bar = document.getElementById('bar'), time = document.getElementById('time'), marks = document.getElementById('marks');
  let t = clamp(+(Q.get('t') ?? 0), 0, DURATION), playing = false, last = 0, loop = null;
  let ac = null, abuf = null, src = null, t0Audio = 0, tAt = 0, muted = Q.has('mute');
  const audioStatus = document.getElementById('audio');
  audioStatus.textContent = 'audio: tekan play' + voNote();
  const ensureAudio = () => {
    if (abuf) return;
    audioStatus.textContent = 'menyiapkan audio…';
    const a = renderAudio({ vo: VOICE, clips: CLIPA });
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
  const draw = () => { render(t); bar.value = t; time.textContent = `${t.toFixed(2)} / ${DURATION.toFixed(2)} s   frame ${Math.round(t * FPS)}`; };
  const tick = (now) => {
    if (playing) {
      if (src) t = tAt + Math.max(0, ac.currentTime - t0Audio);
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
    if (EXPORT) { const d = Q.get('vo'); if (d) applyVO(JSON.parse(d)); }
    else { VOICE = await loadVOBrowser(); applyVO(durationsOf(VOICE)); CLIPA = await loadClipAudio(); }
    init();
    await loadImages();
    render(0);
    window.__tv.ready = true;
    if (!EXPORT) setupPreview();
  } catch (e) { window.__tv.error = String(e && e.stack || e); console.error(e); }
})();
