// S17 · Closing — brand kit (STYLE.md §1–2). The game irises out onto the rising sun; the iris edge becomes the
// ring, drawn symmetrically from 9 o'clock; the menu pointer ▶ flies in from the lower left, its pixels getting
// finer on the way (the last rank-up), and locks into the gap on the beat. Wordmark, line, Follow pill.
import { W, H, TAU, clamp, lerp, inv, prog, ease, mix, css, mixc, canvas, setFont, rr, F } from '../core.js';
import { S, CUE } from '../timeline.js';
import { LANJUT_PTR, lanjut } from '../ui.js';
import { santai } from './fajar.js';

const LOGO_C = [540, 800], LOGO_S = 1.28;
const ARROW = new Path2D('M200,172 L330,247 L200,327 L234,247 Z');
const R_RING = 135 * LOGO_S;
const PTR = [LANJUT_PTR[0] * 2 + 9, LANJUT_PTR[1] * 2 + 19]; // centre of the ▶ in px
const PTR_H = 38;
const END = [LOGO_C[0] + 16 * LOGO_S, LOGO_C[1]];

function flight(u) { // bezier from the ▶ to the lock position
  const p0 = PTR, p1 = [PTR[0] + 160, PTR[1] - 40], p2 = [END[0] - 260, END[1] + 210], p3 = END, m = 1 - u;
  return [0, 1].map((k) => m * m * m * p0[k] + 3 * m * m * u * p1[k] + 3 * m * u * u * p2[k] + u * u * u * p3[k]);
}
// the pointer → arrow, drawn on a coarse grid of `ps` px and scaled up without smoothing
const pix = canvas(64, 64), pg = pix.getContext('2d');
function pointer(c, x, y, scale, notch, ps, color, ang = 0) {
  const path = new Path2D(`M200,172 L330,247 L200,327 L${lerp(200, 234, notch)},247 Z`);
  if (ps <= 1) { c.save(); c.translate(x, y); c.rotate(ang); c.scale(scale, scale); c.translate(-265, -247); c.fillStyle = color; c.fill(path); c.restore(); return; }
  const w = Math.ceil((140 * scale) / ps) + 4, h = Math.ceil((165 * scale) / ps) + 4;
  pix.width = w; pix.height = h;
  pg.clearRect(0, 0, w, h); pg.save(); pg.translate(w / 2, h / 2); pg.rotate(ang); pg.scale(scale / ps, scale / ps); pg.translate(-265, -247); pg.fillStyle = color; pg.fill(path); pg.restore();
  const im = pg.getImageData(0, 0, w, h), d = im.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0; pg.putImageData(im, 0, 0);
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(pix, Math.round(x - (w * ps) / 2), Math.round(y - (h * ps) / 2), w * ps, h * ps); c.restore();
}

function drawFollow(c, t) {
  const C = CUE.closing, fp = prog(t, C.cta + 0.2, C.cta + 0.6, ease.outBack);
  if (fp <= 0) return;
  const cx = 540, cy = 1392, pw = 330, ph = 88, tap = C.tap;
  const press = prog(t, tap - 0.06, tap, ease.outQuad) * (1 - prog(t, tap + 0.05, tap + 0.22, ease.outCubic));
  const done = prog(t, tap + 0.12, tap + 0.4, ease.outExpo);
  if (done < 1) { const r = ((t - C.cta) * 0.9) % 1; rr(c, cx - pw / 2 - r * 26, cy - ph / 2 - r * 26, pw + r * 52, ph + r * 52, ph / 2 + r * 26); c.strokeStyle = css('#60A5FA', 0.55 * (1 - r) * (1 - done) * Math.min(1, fp)); c.lineWidth = 3; c.stroke(); }
  c.save(); c.translate(cx, cy); const s = fp * (1 - 0.05 * press); c.scale(s, s);
  rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.fillStyle = mixc('#3B82F6', '#111827', done); c.fill();
  if (done > 0) { c.strokeStyle = css('#F5F5F5', 0.3 * done); c.lineWidth = 2; c.stroke(); }
  const rp = inv(tap, tap + 0.55, t);
  if (rp > 0 && rp < 1) { c.save(); rr(c, -pw / 2, -ph / 2, pw, ph, ph / 2); c.clip(); c.beginPath(); c.arc(60, 0, 20 + rp * 300, 0, TAU); c.fillStyle = css('#93C5FD', 0.45 * (1 - rp)); c.fill(); c.restore(); }
  setFont(c, F.it, 38, 700, -0.6); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#F5F5F5';
  if (done < 1) { c.globalAlpha = 1 - done; c.fillText('+  Follow', 0, 2 - done * 16); }
  if (done > 0) {
    c.globalAlpha = done; c.fillText('Following', 22, 2 + (1 - done) * 16);
    c.strokeStyle = '#F5F5F5'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-104, 2); c.lineTo(-94, 12); c.lineTo(-76, -8); c.stroke();
  }
  c.restore(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const tp = inv(tap - 0.35, tap + 0.5, t);
  if (tp > 0 && tp < 1) {
    const a = Math.sin(tp * Math.PI), d = (1 - prog(t, tap - 0.35, tap, ease.outCubic)) * 60;
    c.beginPath(); c.arc(cx + 60 + d, cy + d, 36 - 8 * press, 0, TAU); c.fillStyle = css('#FFFFFF', 0.3 * a); c.fill();
    c.strokeStyle = css('#FFFFFF', 0.6 * a); c.lineWidth = 3; c.stroke();
  }
}

export const closing = {
  view: (t) => santai.view(t),
  world(g, t, P, v) { if (t < CUE.closing.iris[1] + 0.25) santai.world(g, t, P, v); },
  // the chosen LANJUT panel stays until the iris swallows it (the ▶ itself is drawn in post)
  ui(u, t) { if (t < CUE.closing.iris[1]) lanjut(u, t, false, true); },
  post(c, t) {
    const C = CUE.closing, [i0, i1] = C.iris;
    // iris: black closes in onto the ring radius, then the inside falls to void in steps
    const r = lerp(1400, R_RING, ease.inCubic(prog(t, i0, i1)));
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.arc(LOGO_C[0], LOGO_C[1], r, 0, TAU, true); c.fillStyle = '#000'; c.fill('evenodd'); c.restore();
    const fade = Math.floor(prog(t, i1 - 0.15, i1 + 0.25) * 4) / 4;
    if (fade > 0) { c.fillStyle = css('#000', fade); c.fillRect(0, 0, W, H); }
    // brand glow after the lock
    const lock = C.lock, gk = prog(t, lock, lock + 1.2, ease.outCubic);
    if (gk > 0) { const g = c.createRadialGradient(LOGO_C[0], LOGO_C[1], 0, LOGO_C[0], LOGO_C[1], 900); g.addColorStop(0, css('#3B82F6', 0.26 * gk)); g.addColorStop(0.45, css('#2563EB', 0.1 * gk)); g.addColorStop(1, css('#2563EB', 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    // ring: drawn symmetrically from 9 o'clock, gap on the right
    const ap = prog(t, C.ring[0], C.ring[1], ease.outExpo);
    if (ap > 0) {
      c.save(); c.translate(LOGO_C[0], LOGO_C[1]); c.scale(LOGO_S, LOGO_S); c.translate(-249, -247);
      c.beginPath(); c.rect(-400, -400, 1300, 1300); c.rect(300, 229, 200, 36); c.clip('evenodd');
      c.strokeStyle = '#F5F5F5'; c.lineWidth = 34; c.lineCap = 'butt';
      c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI + Math.PI * ap, false); c.stroke();
      c.beginPath(); c.arc(249, 247, 135, Math.PI, Math.PI - Math.PI * ap, true); c.stroke();
      c.restore();
    }
    // the pointer waits, then flies and becomes the arrow
    const [a0] = C.arrow;
    if (t < a0) pointer(c, PTR[0], PTR[1], PTR_H / 155, 0, 2, '#FFD447');
    else {
      const fl = prog(t, a0, lock, ease.outCubic), landed = t >= lock;
      if (!landed || t < lock + 0.35) {
        const ta = landed ? 1 - prog(t, lock, lock + 0.35) : 1;
        for (let s = 0; s < 18; s++) {
          const ua = clamp(fl - (s + 1) * 0.014), ub = clamp(fl - s * 0.014); if (ub <= 0) break;
          const [x1, y1] = flight(ua), [x2, y2] = flight(ub);
          c.strokeStyle = css(mix('#93C5FD', '#2563EB', s / 18), (1 - s / 18) * 0.7 * ta); c.lineWidth = (1 - s / 18) * 70 * LOGO_S * Math.max(0.25, fl); c.lineCap = 'round';
          c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        }
      }
      const [ax, ay] = flight(fl), [bx, by] = flight(clamp(fl + 0.01));
      const ang = landed ? 0 : Math.atan2(by - ay, bx - ax) * (1 - prog(t, lock - 0.25, lock));
      const pop = landed ? 1 + 0.18 * (1 - ease.outBack(prog(t, lock, lock + 0.3))) : 1;
      const scale = lerp(PTR_H / 155, LOGO_S, ease.inOutCubic(fl)) * pop;
      const ps = fl < 0.3 ? 8 : fl < 0.55 ? 4 : fl < 0.8 ? 2 : 1;
      if (landed) { c.save(); c.shadowColor = 'rgba(96,165,250,0.9)'; c.shadowBlur = 40 * (1 - prog(t, lock + 0.05, lock + 0.9) * 0.6); }
      pointer(c, ax, ay, scale, ease.outCubic(fl), landed ? 1 : ps, mixc('#FFD447', '#F5F5F5', prog(fl, 0.2, 0.7)), ang);
      if (landed) c.restore();
    }
    // shockwave
    const sw = prog(t, lock, lock + 0.95, ease.outCubic);
    if (sw > 0 && sw < 1) { c.beginPath(); c.arc(LOGO_C[0], LOGO_C[1], R_RING + sw * 620, 0, TAU); c.strokeStyle = css('#60A5FA', 0.85 * (1 - sw)); c.lineWidth = 3 + 6 * (1 - sw); c.stroke(); }
    // wordmark from behind a mask
    const wp = prog(t, C.wordmark, C.wordmark + 0.75, ease.outExpo);
    if (wp > 0) {
      setFont(c, F.it, 112, 700, -112 * 0.045); c.textAlign = 'center';
      const base = 1135, boxT = base - 112, boxH = 112 * 1.35;
      c.save(); c.beginPath(); c.rect(0, boxT, W, boxH); c.clip();
      c.fillStyle = '#F5F5F5'; c.fillText('Beyond Studio', W / 2, base + (1 - wp) * boxH); c.restore();
    }
    // the line
    const lp = prog(t, C.cta, C.cta + 0.65, ease.outExpo);
    if (lp > 0) {
      setFont(c, F.it, 54, 600, -1); c.textAlign = 'center';
      const base = 1282, boxT = base - 56, boxH = 76;
      c.save(); c.beginPath(); c.rect(0, boxT, W, boxH); c.clip();
      c.fillStyle = '#C9CDD4'; c.fillText('Follow, biar naik pangkat bareng.', W / 2, base + (1 - lp) * boxH); c.restore();
    }
    c.textAlign = 'left'; c.letterSpacing = '0px';
    drawFollow(c, t);
  },
};
