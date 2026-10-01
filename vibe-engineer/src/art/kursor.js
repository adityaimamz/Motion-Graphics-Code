// kursor.js — Kursor, the AI: a mint text-cursor block with two pixel eyes and tiny arms.
// When idle its body blinks like a real cursor (1.06 Hz): "off" = hollow block, eyes stay.
// drawKursor(g, P, x, y, o): x = body centre, y = bottom of the body (world px).
import { figure, blit, text, F35 } from '../pixel/draw.js';

const FW = 22, FH = 26, OX = 4, OY = 4; // body box 13×20 at offset
// eyes: 'open' 'blink' 'happy' 'focus' 'q'   arms: 'down' 'type0' 'type1' 'wheel' 'lever' 'wave0' 'wave1' 'push' 'hat' 'rope'
function paint(g, P, o) {
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(OX + x, OY + y, w, h); };
  const off = o.off, hat = o.hat;
  // body: 9×14 block
  if (off) { r(2, 5, 9, 1, P.kur0); r(2, 18, 9, 1, P.kur0); r(2, 5, 1, 14, P.kur0); r(10, 5, 1, 14, P.kur0); }
  else { r(2, 5, 9, 14, P.kur0); r(3, 6, 1, 12, P.kur2); r(9, 6, 2, 13, P.kur1); }
  // arms
  const a = (x, y, w, h) => r(x, y, w, h, P.kur1);
  switch (o.arms ?? 'down') {
    case 'down': a(1, 11, 1, 4); a(11, 11, 1, 4); break;
    case 'type0': a(0, 12, 2, 1); a(-1, 13, 1, 1); a(11, 12, 2, 1); a(13, 11, 1, 1); break;
    case 'type1': a(0, 12, 2, 1); a(-1, 11, 1, 1); a(11, 12, 2, 1); a(13, 13, 1, 1); break;
    case 'wheel': a(-2, 11, 4, 1); a(11, 11, 4, 1); break;
    case 'lever': a(1, 11, 1, 4); a(11, 8, 1, 4); a(12, 7, 1, 1); break;
    case 'wave0': a(1, 11, 1, 4); a(11, 6, 1, 5); a(12, 4, 1, 2); break;
    case 'wave1': a(1, 11, 1, 4); a(11, 6, 1, 5); a(10, 4, 1, 2); break;
    case 'push': a(1, 11, 1, 3); a(11, 12, 4, 1); break;
    case 'hat': a(1, 2, 1, 9); a(11, 2, 1, 9); break;
    case 'rope': a(1, 11, 1, 4); a(11, 3, 1, 8); break;
  }
  // eyes
  switch (o.eyes ?? 'open') {
    case 'open': r(4, 9, 1, 2, P.eye); r(8, 9, 1, 2, P.eye); break;
    case 'blink': r(4, 10, 1, 1, P.eye); r(8, 10, 1, 1, P.eye); break;
    case 'happy': r(3, 10, 1, 1, P.eye); r(4, 9, 1, 1, P.eye); r(5, 10, 1, 1, P.eye); r(7, 10, 1, 1, P.eye); r(8, 9, 1, 1, P.eye); r(9, 10, 1, 1, P.eye); break;
    case 'focus': r(3, 9, 3, 1, P.eye); r(7, 9, 3, 1, P.eye); r(4, 10, 1, 1, P.eye); r(8, 10, 1, 1, P.eye); break;
    case 'q': r(4, 9, 1, 2, P.eye); r(8, 9, 1, 2, P.eye); r(4, 8, 1, 1, P.eye); break;
  }
  if (hat) { r(3, 1, 7, 1, P.hat); r(2, 2, 9, 2, P.hat); r(2, 3, 9, 1, P.hat1); r(1, 4, 11, 1, P.visor); r(6, 2, 1, 1, P.gold); }
}
export function drawKursor(g, P, x, y, o = {}) {
  const key = ['kur', o.off ? 1 : 0, o.hat ? 1 : 0, o.arms ?? 'down', o.eyes ?? 'open', P.key].join('|');
  const cv = figure(key, FW, FH, (fg) => paint(fg, P, o), P.ink);
  blit(g, cv, x - (OX + 6), y - (OY + 19));
  if (o.eyes === 'q') { // little question marks over the head
    text(g, '?', x - 5, y - 26, P.strap, F35); text(g, '?', x + 2, y - 28, P.strap, F35);
  }
}
// the cursor blink: on for 0.47 s, off for 0.47 s (1.06 Hz), locked to frames
export const blinkOff = (t) => Math.floor(Math.round(t * 60) / 28) % 2 === 1;
export const KURSOR_HEAD = [0, -24];
