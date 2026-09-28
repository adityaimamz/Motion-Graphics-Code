// The chapter headline over the three device sets: "Website custom untuk / bisnis. → portofolio. →
// skripsi." Line 1 stays put through the cranes; only the second word swaps through the mask.
import type { Chapter, World, FrameOut } from '../stage/world';
import { CUE, CH } from '../cues';
import { pick } from '../fmt';
import { TX } from '../text';
import { P } from '../stage/motion';
import { maskText, fitPx } from '../stage/type';

const X = pick(90, 120);
const Y1 = pick(330, 200), Y2 = pick(470, 330);
const S1 = pick(44, 44), S2 = pick(120, 110);
const MAXW = pick(900, 1100);
const IN = [CH.bisnis[0] + 0.35, CH.portofolio[0] + 0.25, CH.skripsi[0] + 0.25];
const OUT = [CUE.takeoff3, CUE.takeoff4, CUE.takeoff5];

function update(t: number, _w: World, f: FrameOut) {
  if (t < CH.bisnis[0] || t >= CH.skripsi[1]) return;
  const c = f.c;
  maskText(c, TX.chLead, X, Y1, S1, P(t, CH.bisnis[0] + 0.23, 0.7), P(t, CUE.takeoff5, 0.3), { weight: 500, trackEm: -0.02, color: 'rgba(245,245,245,0.62)', stagger: 0.25 });
  TX.chWords.forEach((wd, i) => {
    const px = fitPx(c, wd, S2, MAXW, 760, -0.048);
    maskText(c, wd, X, Y2, px, P(t, IN[i]!, 0.7), P(t, OUT[i]!, 0.28), { weight: 760, trackEm: -0.048, stagger: 0.3 });
  });
}

const headline: Chapter = { init() {}, update };
export default headline;
