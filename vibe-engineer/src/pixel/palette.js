// palette.js — every colour in the pixel world, per time of day (TREATMENT §3).
// tod: 0 sore, 1 malam, 2 fajar. timeline.todAt() only ever returns fifths, so there are 11 palettes, each
// built once and cached; switching between them is the "palette swap" of old games.
import { rgb, hex, mix, lerp, clamp } from '../core.js';

// world colours, explicit per time of day
const TOD = {
  sky0: ['#D9825E', '#0A1324', '#86B4CC'],
  sky1: ['#F6C58A', '#1C2E4A', '#F5C4A0'],
  sun: ['#FFE3A0', '#EDE6CC', '#FFD27A'],
  cloud: ['#F2A983', '#24375A', '#F8DCC6'],
  sea0: ['#1D5263', '#06182A', '#2B5E78'],
  sea1: ['#2C7A85', '#0E2C45', '#3E849E'],
  foam: ['#ECE3C6', '#86A9C0', '#F2EADB'],
  wood0: ['#5C3923', '#26201F', '#583A29'],
  wood1: ['#8D5832', '#3B2C2A', '#8A5C3B'],
  wood2: ['#C7884D', '#574236', '#C69262'],
  cloth: ['#F0E5CC', '#8C95A4', '#FAF0DC'],
  ink: ['#1B1A26', '#04060C', '#1B1A26'],
};
// characters and props: one base colour, lit by the time of day (night = dimmed and cooled, lantern-lit)
const BASE = {
  skin0: '#B87A4F', skin1: '#8A5236', hair: '#2A2230', hood0: '#E2A838', hood1: '#B07D20', hoodS: '#F2EADB',
  short: '#4E5565', sandal: '#2F66B3', strap: '#F2F2F2',
  pillow: '#86C2AE', pillow1: '#5E9C88', band: '#D7463A', band1: '#A33228', hat: '#F3EFE4', hat1: '#C9C3B4', visor: '#1B1A26', gold: '#E2B23B',
  kur0: '#A8EE8C', kur1: '#6CC36B', kur2: '#DBFFCB', eye: '#1B1A26',
  cup: '#DCE8EC', coffee: '#8A5A3C', milk: '#E8D7BD', straw: '#2F66B3',
  seal: '#D7463A', bug0: '#6E3FB0', bug1: '#A47BE0', bug2: '#4A2580', bugleg: '#2A1840', bugeye: '#E5484D',
  kr0: '#7A3FB8', kr1: '#4E2384', krspot: '#A97BE6', krsuck: '#E6D3FF', kreye: '#FFD447',
  blush: '#E58A7A', lens: '#CFE6F7', glint: '#FFFFFF', frame: '#1B1A26', mouth: '#6E2F24',
  lampoff: '#2A3932', green: '#5BD07D', amber: '#F1B23C', red: '#E5484D', buoyW: '#F3EFE4', lantern: '#F5B342',
  paper: '#EFE6CF', paper1: '#CDBF9F', code1: '#E2A838', code2: '#5BD07D', code3: '#6FA8DC', code4: '#E5484D', code5: '#B9A6E8',
  laptop: '#4A505C', laptop1: '#2E323B', screen: '#1E2A3A', screenL: '#8FD3FF', metal: '#8A929E', metal1: '#555C68', iron: '#3A3F4A',
  rope: '#C9A86B', rope1: '#8F7444', chair0: '#3E7CB1', chair1: '#E9E3C9', book: '#7A3B2E', book1: '#4F241B', smoke: '#D9D4CC', inkcloud: '#14121C',
};
// lighting per time of day: multiply, then mix toward a tint
const LIGHT = [
  { mul: [1.04, 0.97, 0.9], tint: '#F6C58A', k: 0.06 }, // sore: warm
  { mul: [0.62, 0.66, 0.78], tint: '#1C2E4A', k: 0.22 }, // malam: dim, cool
  { mul: [1.02, 0.99, 0.98], tint: '#F5C4A0', k: 0.05 }, // fajar: soft
];

function lit(c, tod) {
  const i = Math.min(1, Math.floor(tod)), f = tod - i, A = LIGHT[i], B = LIGHT[Math.min(2, i + 1)];
  const m = [0, 1, 2].map((j) => lerp(A.mul[j], B.mul[j], f));
  const C = rgb(c).map((v, j) => clamp(v * m[j], 0, 255));
  const tA = mix(C, A.tint, A.k), tB = mix(C, B.tint, B.k);
  return hex(mix(tA, tB, f));
}
function tw(arr, tod) {
  const i = Math.min(1, Math.floor(tod)), f = tod - i;
  return hex(mix(arr[i], arr[i + 1], f));
}

const cache = new Map();
export const todKey = (tod) => (Math.round(tod * 5) / 5).toFixed(1);
// palette for a time of day: { role: '#rrggbb', key }
export function palette(tod) {
  const key = todKey(tod);
  let P = cache.get(key);
  if (P) return P;
  const t = +key;
  P = { key };
  for (const [k, v] of Object.entries(TOD)) P[k] = tw(v, t);
  for (const [k, v] of Object.entries(BASE)) P[k] = lit(v, t);
  // derived world tones
  P.sea2 = hex(mix(P.sea1, P.foam, 0.32));
  P.skyM = hex(mix(P.sky0, P.sky1, 0.5));
  P.cloth1 = hex(mix(P.cloth, P.ink, 0.2));
  P.cloth2 = hex(mix(P.cloth, P.ink, 0.38));
  P.hold = hex(mix(P.wood0, P.ink, 0.45));
  P.holdL = hex(mix(P.wood0, P.ink, 0.2));
  P.water = hex(mix(P.sea1, P.sea0, 0.3));
  P.waterL = hex(mix(P.sea1, P.foam, 0.45));
  P.star = t >= 0.8 && t <= 1.2 ? '#E9EEF8' : P.sky0;
  cache.set(key, P);
  return P;
}

// illustration props (×4 layer: code windows, shield, crystal, button…) keep flat colours at any time of day,
// like a diagram drawn over the scene
export const PROP = {
  ink: '#1B1A26', paper: '#F3EBD8', paper1: '#D9CBA8', win: '#1E2638', win1: '#2B3550', bar: '#3A4766',
  c1: '#E2A838', c2: '#5BD07D', c3: '#6FA8DC', c4: '#E5484D', c5: '#B9A6E8', c6: '#F4EEDC',
  red: '#E5484D', red1: '#A8323A', redL: '#FF9A9E', green: '#4CC06C', green1: '#2C8A48', greenL: '#A6F0BC',
  blue: '#2F6FE0', blue1: '#1E4FB0', blueL: '#7FB0FF', cyan: '#5FE3F0', cyan1: '#2BA8C4', cyan2: '#1A6F8A', cyanL: '#E0FDFF',
  gold: '#FFD447', gold1: '#C99A1E', goldL: '#FFF3B0', metal: '#9AA3B2', metal1: '#5B6372', wood: '#8D5832', wood1: '#5C3923',
  purple: '#6E3FB0', smoke: '#E6E1D8', smoke1: '#B9B3A8',
};

// UI colours never change with the time of day
export const UI = {
  panel: '#11162A', frame: '#EFE6CF', inner: '#38446A', text: '#F4EEDC', sel: '#FFD447', danger: '#E5484D', ok: '#5BD07D', dim: '#98A2B6',
};
