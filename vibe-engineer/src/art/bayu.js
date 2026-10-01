// bayu.js — Bayu, front view, chibi proportions (head ≈ 45 % of the body, like a game sprite), built from parts and
// outlined automatically. Body box 24×32 world px. Rank costume: 0 neck pillow (penumpang), 1 bandana (awak),
// 2 captain hat (kapten). o.glasses puts on reading glasses (the "baca dulu" rule).
// drawBayu(g, P, x, y, o): x = body centre, y = soles (world px).
import { figure, blit } from '../pixel/draw.js';

const FW = 38, FH = 42, OX = 6, OY = 6; // figure canvas; body drawn at offset (OX, OY)
// legs: 'stand' | 'sit' (cross-legged) | 'chair' (sitting, legs down)
// arm  (viewer's right): 'down' 'thumb' 'cup' 'sip' 'point' 'give' 'slapUp' 'slapDown' 'type' 'hold' 'up' 'wheel' 'flick'
// armL (viewer's left):  'down' 'hip' 'type' 'cup' 'up' 'wheel'
// eyes: 'closed' (‿, content) 'open' 'wide' 'happy' (^) 'focus'   mouth: 'smile' 'o' 'flat' 'grin'
export function bayuKey(o) {
  return ['bayu', o.legs ?? 'stand', o.arm ?? 'down', o.armL ?? 'down', o.eyes ?? 'closed', o.mouth ?? 'smile', o.rank ?? 0,
    o.glasses ? 1 : 0, o.hx ?? 0, o.hy ?? 0].join('|');
}
function paint(g, P, o) {
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(OX + x, OY + y, w, h); };
  const legs = o.legs ?? 'stand', hx = o.hx ?? 0, hy = o.hy ?? 0, rank = o.rank ?? 0;
  // ---- lower body
  if (legs === 'stand') {
    r(7, 25, 10, 3, P.short); g.clearRect(OX + 11, OY + 27, 2, 1);
    r(8, 28, 3, 3, P.skin0); r(13, 28, 3, 3, P.skin0); r(10, 28, 1, 3, P.skin1); r(15, 28, 1, 3, P.skin1);
    r(7, 31, 4, 1, P.sandal); r(13, 31, 4, 1, P.sandal); r(9, 30, 1, 1, P.strap); r(14, 30, 1, 1, P.strap);
  } else if (legs === 'sit') {
    r(5, 25, 14, 3, P.short);
    r(2, 28, 20, 2, P.skin0); r(2, 29, 20, 1, P.skin1); r(1, 28, 2, 2, P.sandal); r(21, 28, 2, 2, P.sandal);
  } else if (legs === 'chair') {
    r(6, 25, 12, 3, P.short); r(7, 28, 3, 2, P.skin0); r(14, 28, 3, 2, P.skin0); r(6, 30, 4, 1, P.sandal); r(14, 30, 4, 1, P.sandal);
  }
  // ---- hoodie
  r(6, 15, 12, 10, P.hood0); r(16, 16, 2, 9, P.hood1); r(6, 24, 12, 1, P.hood1);
  r(5, 15, 2, 2, P.hood1); r(17, 15, 2, 2, P.hood1); r(10, 15, 4, 1, P.skin1);
  r(10, 16, 1, 3, P.hoodS); r(13, 16, 1, 3, P.hoodS); r(8, 21, 8, 1, P.hood1);
  // ---- arms (viewer's left = armL, viewer's right = arm)
  const sl = (x, y, w, h) => r(x, y, w, h, P.hood0), hand = (x, y, w = 2, h = 2) => r(x, y, w, h, P.skin0);
  const cupAt = (x, y) => { r(x, y, 4, 6, P.cup); r(x, y + 3, 4, 2, P.coffee); r(x, y + 2, 4, 1, P.milk); r(x + 1, y - 2, 1, 2, P.straw); };
  switch (o.armL ?? 'down') {
    case 'down': sl(4, 16, 2, 7); hand(4, 23); break;
    case 'hip': sl(4, 16, 2, 5); hand(5, 21); break;
    case 'type': case 'wheel': sl(4, 16, 2, 3); sl(5, 18, 3, 2); hand(7, 19); break;
    case 'cup': sl(4, 16, 2, 4); sl(5, 19, 3, 2); hand(7, 19); cupAt(6, 14); break;
    case 'up': sl(4, 9, 2, 7); hand(4, 7); break;
  }
  switch (o.arm ?? 'down') {
    case 'down': sl(18, 16, 2, 7); hand(18, 23); break;
    case 'thumb': sl(18, 15, 3, 2); sl(20, 10, 2, 6); hand(20, 8, 3, 2); r(21, 5, 1, 3, P.skin0); break; // out to the side, clear of the face
    case 'cup': sl(18, 16, 2, 4); sl(16, 19, 3, 2); hand(15, 19); cupAt(14, 14); break;
    case 'sip': sl(18, 16, 2, 2); hand(17, 15); cupAt(13, 12); r(12, 12, 1, 1, P.straw); break;
    case 'point': sl(18, 16, 6, 2); hand(24, 16); r(26, 16, 1, 1, P.skin0); break;
    case 'give': sl(18, 16, 5, 2); hand(23, 15, 3, 3); break;
    case 'slapUp': sl(18, 8, 2, 8); hand(18, 5, 3, 3); break;
    case 'slapDown': sl(18, 16, 2, 3); sl(19, 19, 4, 2); hand(23, 19, 3, 3); break;
    case 'type': case 'wheel': sl(18, 16, 2, 3); sl(16, 18, 3, 2); hand(15, 19); break;
    case 'hold': sl(18, 16, 2, 3); sl(19, 18, 3, 2); hand(22, 17, 2, 3); break;
    case 'up': sl(18, 9, 2, 7); hand(18, 7); break;
    case 'flick': sl(18, 15, 5, 2); hand(23, 13, 2, 3); r(25, 13, 1, 1, P.skin0); break;
  }
  // ---- rank 0: neck pillow, sitting on the shoulders
  if (rank === 0) { r(4, 14, 4, 3, P.pillow); r(16, 14, 4, 3, P.pillow); r(4, 16, 4, 1, P.pillow1); r(16, 16, 4, 1, P.pillow1); }
  // ---- head
  const H = (x, y, w, h, c) => r(x + hx, y + hy, w, h, c);
  H(5, 5, 14, 10, P.skin0); g.clearRect(OX + 5 + hx, OY + 14 + hy, 1, 1); g.clearRect(OX + 18 + hx, OY + 14 + hy, 1, 1);
  H(18, 6, 1, 8, P.skin1); H(3, 9, 2, 3, P.skin0); H(19, 9, 2, 3, P.skin1); // shade + ears
  // hair: cap, fringe, sideburns, the tuft (jambul)
  H(4, 1, 16, 4, P.hair); H(5, 0, 14, 1, P.hair);
  H(5, 5, 4, 1, P.hair); H(13, 5, 6, 1, P.hair); H(5, 6, 2, 1, P.hair); H(16, 6, 3, 1, P.hair); H(4, 5, 1, 5, P.hair); H(19, 5, 1, 5, P.hair);
  if (rank < 2) { H(9, -1, 5, 1, P.hair); H(11, -2, 4, 1, P.hair); H(14, -3, 2, 1, P.hair); }
  // eyes (glasses: lens tint first, eyes on top, frame last)
  const eyes = o.eyes ?? 'closed';
  if (o.glasses) { H(7, 9, 2, 2, P.lens); H(15, 9, 2, 2, P.lens); }
  if (o.glasses && eyes !== 'closed' && eyes !== 'happy' && eyes !== 'shut') { // behind glasses: a 1-px pupil, so the lens reads as clear glass
    H(8, 9, 1, 2, P.eye); H(16, 9, 1, 2, P.eye); H(7, 9, 1, 1, P.glint); H(15, 9, 1, 1, P.glint);
    if (eyes === 'wide') { H(8, 8, 1, 1, P.eye); H(16, 8, 1, 1, P.eye); }
    if (eyes === 'focus') { H(6, 7, 4, 1, P.hair); H(14, 7, 4, 1, P.hair); }
  } else if (eyes === 'shut') { // a blink: the lids are down
    H(7, 10, 2, 1, P.eye); H(15, 10, 2, 1, P.eye);
  } else if (eyes === 'closed') { H(7, 11, 3, 1, P.eye); H(6, 10, 1, 1, P.eye); H(10, 10, 1, 1, P.eye); H(14, 11, 3, 1, P.eye); H(13, 10, 1, 1, P.eye); H(17, 10, 1, 1, P.eye); }
  else if (eyes === 'happy') { H(7, 9, 2, 1, P.eye); H(6, 10, 1, 1, P.eye); H(9, 10, 1, 1, P.eye); H(15, 9, 2, 1, P.eye); H(14, 10, 1, 1, P.eye); H(17, 10, 1, 1, P.eye); }
  else if (eyes === 'wide') { H(7, 8, 2, 3, P.eye); H(15, 8, 2, 3, P.eye); H(7, 8, 1, 1, P.strap); H(15, 8, 1, 1, P.strap); }
  else { H(7, 9, 2, 2, P.eye); H(15, 9, 2, 2, P.eye); H(7, 9, 1, 1, P.strap); H(15, 9, 1, 1, P.strap);
    if (eyes === 'focus') { H(6, 7, 4, 1, P.hair); H(14, 7, 4, 1, P.hair); } }
  if (o.glasses) { for (const ex of [6, 14]) { H(ex, 8, 4, 1, P.frame); H(ex, 11, 4, 1, P.frame); H(ex, 8, 1, 4, P.frame); H(ex + 3, 8, 1, 4, P.frame); } H(10, 9, 4, 1, P.frame); }
  H(6, 12, 2, 1, P.blush); H(16, 12, 2, 1, P.blush);
  const mouth = o.mouth ?? 'smile';
  if (mouth === 'smile') { H(10, 13, 4, 1, P.mouth); H(9, 12, 1, 1, P.mouth); H(14, 12, 1, 1, P.mouth); }
  else if (mouth === 'o') H(11, 12, 2, 2, P.mouth);
  else if (mouth === 'grin') { H(10, 12, 4, 2, P.mouth); H(10, 12, 4, 1, P.strap); }
  else H(10, 13, 4, 1, P.mouth);
  // ---- rank 1: bandana; rank 2: captain hat
  if (rank === 1) { H(4, 2, 16, 3, P.band); H(4, 4, 16, 1, P.band1); H(20, 3, 2, 2, P.band); H(21, 5, 2, 1, P.band1); H(22, 6, 1, 1, P.band); }
  else if (rank === 2) { H(5, -3, 14, 1, P.hat); H(4, -2, 16, 4, P.hat); H(4, 1, 16, 1, P.hat1); H(3, 2, 18, 2, P.visor); H(11, -1, 2, 2, P.gold); }
  // the sip covers the mouth: draw the cup again on top
  if ((o.arm ?? 'down') === 'sip') { cupAt(13, 12); r(12, 12, 1, 1, P.straw); }
}
export function drawBayu(g, P, x, y, o = {}) {
  const key = bayuKey(o) + '|' + P.key;
  const cv = figure(key, FW, FH, (fg) => paint(fg, P, o), P.ink);
  blit(g, cv, x - (OX + 12), y - (OY + 31), o.flip);
}
// anchors relative to (x, soles): top of the head (speech bubbles), the hand in the 'hold' pose, the slap hand
export const BAYU_HEAD = [0, -35];
export const BAYU_HOLD = [11, -12];
export const BAYU_SLAP = [12, -10];
