// vo.js — voice-over helpers shared by render.mjs (Node) and the preview (browser).
import { VO_LINES, VO_EXTS } from './timeline.js';

// Where does the speech actually start and end? (trims TTS silence; 10 ms windows, adaptive threshold)
// Also lists the pauses inside the line (≥ 0.1 s, relative to the trimmed start): timeline.js pins the words to them.
export function analyse(x, sr) {
  const win = Math.round(sr * 0.01), n = Math.floor(x.length / win), rms = new Float32Array(n);
  let peak = 0;
  for (let w = 0; w < n; w++) { let e = 0; for (let i = w * win; i < (w + 1) * win; i++) e += x[i] * x[i]; rms[w] = Math.sqrt(e / win); peak = Math.max(peak, rms[w]); }
  const th = Math.max(peak * Math.pow(10, -36 / 20), Math.pow(10, -50 / 20));
  let a = 0, b = n - 1;
  while (a < n && rms[a] < th) a++;
  while (b > a && rms[b] < th) b--;
  if (a >= n) return null; // silent file
  const lead = Math.max(0, a - 2) * win / sr, end = Math.min(n, b + 3) * win / sr;
  const quiet = peak * Math.pow(10, -24 / 20), gaps = [], r3 = (v) => Math.round(v * 1000) / 1000;
  for (let w = a; w <= b;) {
    if (rms[w] >= quiet) { w++; continue; }
    let e = w; while (e <= b && rms[e] < quiet) e++;
    if (e - w >= 10) gaps.push([r3(w * win / sr - lead), r3(e * win / sr - lead)]);
    w = e;
  }
  return { lead, dur: r3(end - lead), gaps };
}

// match a directory listing to line ids: "05-malam.wav" → { '05-malam': '05-malam.wav' }
export function matchFiles(names) {
  const out = {};
  for (const l of VO_LINES) {
    const f = names.find((nm) => { const m = nm.match(/^(.*)\.([a-z0-9]+)$/i); return m && m[1].toLowerCase() === l.id && VO_EXTS.includes(m[2].toLowerCase()); });
    if (f) out[l.id] = f;
  }
  return out;
}
// what the timeline needs from each file: its length and its pauses
export const durationsOf = (vo) => Object.fromEntries(Object.entries(vo).map(([id, v]) => [id, { dur: v.dur, gaps: v.gaps ?? [] }]));

// browser: fetch the listing from the preview server, decode, resample to 48 kHz mono
export async function loadVOBrowser(sr = 48000) {
  let names = [];
  try { const r = await fetch('vo/?list'); if (!r.ok) return {}; names = (await r.json()).files ?? []; } catch { return {}; }
  const files = matchFiles(names), out = {};
  for (const [id, f] of Object.entries(files)) {
    try {
      const buf = await (await fetch('vo/' + encodeURIComponent(f))).arrayBuffer();
      const ab = await new OfflineAudioContext(1, 1, sr).decodeAudioData(buf);
      const x = new Float32Array(ab.length);
      for (let c = 0; c < ab.numberOfChannels; c++) { const d = ab.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] += d[i] / ab.numberOfChannels; }
      const a = analyse(x, sr); if (a) out[id] = { data: x, ...a };
    } catch (e) { console.warn('VO decode failed', f, e); }
  }
  return out;
}
