import {Easing, interpolate} from 'remotion';

// ─── Kanvas ─────────────────────────────────────────────────────────────────
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Musik dibuat di 100 BPM → 1 ketukan = 0,6 dtk = 18 frame. Semua potongan
// gambar jatuh tepat di ketukan, jadi kalau Anda mengganti musik, pakai lagu
// ~100 BPM (atau 200 BPM) supaya cut tetap sinkron.
export const BEAT = 18;
export const BAR = BEAT * 4;
export const DURATION = 1152; // 64 ketukan = 38,4 detik

// ─── Palet warna ────────────────────────────────────────────────────────────
// Biru Srikandi diambil langsung dari label logo (#01458C).
export const C = {
  night: '#0A1B3F', // indigo malam (latar gelap)
  nightSoft: '#132A5C',
  blue: '#01458C', // biru Srikandi
  blueLight: '#1B62B0',
  blueDeep: '#00306A',
  ivory: '#F6F0E6', // gading
  cream: '#EDE2D0',
  paper: '#FBF8F2',
  gold: '#C9A45C', // benang emas
  goldLight: '#E9D1A0',
  goldDeep: '#9C7A3C',
  sage: '#6E9E9B', // dari kebaya
  mauve: '#C79BB7',
  ink: '#0E1A33',
};

// ─── Tipografi ──────────────────────────────────────────────────────────────
export const SERIF = '"Cormorant Garamond", "Times New Roman", serif';
export const SANS = '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';

// ─── Easing ─────────────────────────────────────────────────────────────────
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-out, cepat lalu halus
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_SOFT = Easing.bezier(0.33, 1, 0.68, 1);

/** Interpolasi terkunci (clamp) dengan easing. */
export const tween = (
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
  easing: (t: number) => number = EASE_OUT,
) =>
  interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

// ─── Jadwal adegan (frame) ──────────────────────────────────────────────────
// Adegan saling tumpang-tindih beberapa frame supaya transisinya menyatu.
export const SCENES = {
  hook: {from: 0, dur: 84}, // "Baju yang pas bukan kebetulan."
  verbs: {from: 72, dur: 84}, // Diukur. Dipotong. Dijahit. Untukmu.
  details: {from: 144, dur: 164}, // montase detail (6 kartu)
  logo: {from: 288, dur: 132}, // reveal logo
  collection: {from: 396, dur: 234}, // koleksi: satu model, banyak cerita
  why: {from: 612, dur: 198}, // kenapa Srikandi
  services: {from: 792, dur: 156}, // layanan
  cta: {from: 924, dur: 228}, // WhatsApp + alamat
} as const;

// ─── Data merek ─────────────────────────────────────────────────────────────
export const BRAND = {
  name: 'Srikandi Tailor',
  whatsapp: '+62 823-1310-1314',
  addressLine1: 'Jl. Teuku Umar No.78, Debong Tengah',
  addressLine2: 'Tegal Selatan, Kota Tegal',
};
