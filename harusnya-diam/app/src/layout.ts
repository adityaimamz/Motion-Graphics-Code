// Where everything sits on the board. World units ≈ millimetres; the board is the plane z = 0, +x right,
// +y up the board ("down" = −y is downhill: the board leans like a drafting table, so things roll to −y).
// The pullback (S7) frames the whole machine: banner at the top, blank page at the bottom.
export interface Rect { x0: number; y0: number; x1: number; y1: number }
export const rect = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
export const cx = (r: Rect) => (r.x0 + r.x1) / 2;
export const cy = (r: Rect) => (r.y0 + r.y1) / 2;
export const rw = (r: Rect) => r.x1 - r.x0;
export const rh = (r: Rect) => r.y1 - r.y0;

/** The drafting board (stretched paper): larger than anything the camera frames. */
export const BOARD = rect(-760, -1300, 760, 1300);
/** Whole-machine framing (9:16) for the pullback. */
export const MACHINE = { cx: 0, cy: 20, w: 1100 };

export const BANNER = rect(-480, 530, 480, 752);
export const POSTER = rect(-472, -130, -92, 440); // 380 × 570
export const FLIP = rect(40, -250, 250, -100);    // pages 210 × 150 (clip on the right edge)
export const PHONE = rect(-420, -568, -250, -228); // 170 × 340
/** a steel ruler lying from the phone's lower right corner down to the pop-up card */
export const RULER = { x0: -246, y0: -536, x1: 58, y1: -612, w: 30 };
export const POPUP = rect(70, -722, 330, -582);   // base 260 × 140, back panel hinged on the top edge
export const CARDS = { x0: -424, y: -772, pitch: 92, w: 68, h: 92 }; // five cards standing at x0 + i·pitch, falling to +x
export const PENCIL = { x0: 44, x1: 226, y: -786, r: 4.2 }; // lying along x: it rolls downhill (−y)
export const PAGE = rect(56, -962, 266, -814);    // A5 landscape 210 × 148

/** Poster-local layout (units from the poster's top-left, y down). */
export const PL = {
  margin: 22,
  base: [92, 168, 244] as const, // headline baselines
  px: 84,                        // headline font size
  aside: 293,                    // baseline of the dry aside ("Harusnya.")
  field: { x: 22, y: 312, w: 336, h: 238 },
};
/** Poster-local (units, y down) → world. */
export const posterW = (lx: number, ly: number): [number, number] => [POSTER.x0 + lx, POSTER.y1 - ly];
/** Where the paper plane punches through the board (right of the pop-up card). */
export const HOLE = { x: 440, y: -690 };
