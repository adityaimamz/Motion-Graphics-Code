// The overlay type: the physical-clock HUD (top left), the science labels under it, and the captions.
// Numbers are locked to the output frame (round(t·60)/60), captions rise from behind a mask (STYLE.md).
import { CUE, DUR } from './cues';
import { ms, slowShown, scanRow, ROWS, FRAME_MS } from './clock';
import { maskText, setType, fitPx, measure } from './type';
import { clamp } from './engine/util';
import { eOut, P } from './motion';

const X = 72, Y = 272;
const PAPER = '#F5F5F5', ICE = '#60A5FA';

/** Indonesian number: thousands '.', decimals ',' grouped by 3 with thin spaces. */
export function fmtNum(v: number, dec: number) {
  const s = v.toFixed(dec);
  const [a, b] = s.split('.');
  const ai = a!.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (!b) return ai;
  return `${ai},${b.replace(/(\d{3})(?=\d)/g, '$1 ')}`;
}

/** Draw a string with every digit in a fixed-width cell (tabular figures on a proportional face). */
function tab(c: CanvasRenderingContext2D, s: string, x: number, y: number) {
  const dw = measure(c, '0');
  let cx = x;
  for (const ch of s) {
    if (/\d/.test(ch)) { const w = measure(c, ch); c.fillText(ch, cx + (dw - w) / 2, y); cx += dw; }
    else if (ch === ' ') cx += dw * 0.34;
    else { c.fillText(ch, cx, y); cx += measure(c, ch) + (parseFloat(c.letterSpacing) || 0); }
  }
  return cx - x;
}

/** HUD visibility: on through the film, out on the whiteout, back for the loop-out (showing the next frame's 0). */
function hudAlpha(t: number) {
  const L = CUE.closing.loopout;
  if (t >= L) return eOut(P(t, L + 0.15, 0.4));
  return 1 - P(t, CUE.foton.hit - 0.08, 0.12);
}

export function drawHud(c: CanvasRenderingContext2D, tt: number) {
  const a = hudAlpha(tt);
  if (a <= 0.001) return;
  const next = tt >= CUE.closing.loopout;           // the loop-out shows the frame that starts at t = 0
  const t = next ? 0 : Math.round(tt * 60) / 60;
  const m = next ? 0 : ms(t), k = next ? slowShown(0) : slowShown(t);
  const row = next ? 0 : scanRow(t);
  c.save();
  c.globalAlpha = a;
  // a soft corner vignette under the readout (a photographic falloff, not a halo on the type)
  const g = c.createRadialGradient(X + 60, Y + 40, 0, X + 60, Y + 40, 520);
  g.addColorStop(0, 'rgba(0,0,0,0.42)'); g.addColorStop(0.45, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 700, 900);
  // the phone icon: 22x39 hairline, painted part above the refresh line
  const iw = 22, ih = 39, ix = X, iy = Y + 2;
  const f = clamp(row / ROWS);
  c.fillStyle = 'rgba(245,245,245,0.30)';
  c.fillRect(ix + 2, iy + 2, iw - 4, (ih - 4) * f);
  c.strokeStyle = 'rgba(245,245,245,0.62)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(ix + 0.75, iy + 0.75, iw - 1.5, ih - 1.5, 4); c.stroke();
  if (f < 1) { c.fillStyle = ICE; c.fillRect(ix + 2, iy + 2 + (ih - 4) * f - 1, iw - 4, 2); }
  // t = ms, with more decimals the slower time runs
  const dec = k > 1e8 ? 12 : k > 3e5 ? 9 : 6;
  setType(c, 29, 560, 0.0);
  c.fillStyle = 'rgba(245,245,245,0.86)';
  c.fillText('t', X + 40, Y + 28);
  tab(c, `${fmtNum(Math.min(m, FRAME_MS), dec)} ms`, X + 62, Y + 28);
  c.fillStyle = ICE;
  c.fillText('×', X + 40, Y + 66);
  tab(c, fmtNum(k, 0), X + 62, Y + 66);
  c.restore();
}

/** Science labels, stacked under the HUD; `{row}` = the row being written. */
export function drawLabels(c: CanvasRenderingContext2D, t: number) {
  const on = CUE.label.filter((l) => t >= l.in - 0.05 && t < l.out + 0.3);
  on.forEach((l, i) => {
    const pin = P(t, l.in, 0.55), pout = P(t, l.out, 0.28);
    const s = l.s.replace('{row}', String(Math.floor(scanRow(Math.round(t * 60) / 60))));
    const y = Y + 128 + i * 40;
    c.save();
    c.globalAlpha = 1 - pout;
    c.fillStyle = 'rgba(96,165,250,0.75)';
    c.fillRect(X, y - 13, 16 * eOut(pin), 1.5);
    c.restore();
    maskText(c, s, X + 26, y, 24, pin, pout, { weight: 500, trackEm: 0, color: 'rgba(156,163,175,0.95)', stagger: 0.2 });
  });
}

/** The captions (cues.teks): one line at a time, centred in the safe area (x 150–930). */
export function drawCaptions(c: CanvasRenderingContext2D, t: number) {
  for (const l of CUE.teks) {
    if (t < l.in - 0.02 || t > l.out + 0.35 || l.in >= CUE.ch.closing[0]) continue;
    const px = fitPx(c, l.s, 84, 780, 740, -0.04);
    maskText(c, l.s, 540, l.y, px, P(t, l.in, 0.65), P(t, l.out, 0.28), { align: 'center', weight: 740, trackEm: -0.04, stagger: 0.32 });
  }
}

export { DUR, setType };
