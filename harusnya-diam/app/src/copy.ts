// Every word the film prints, in both languages. `?lang=en` (render: --lang en) picks English; Indonesian is the
// default. Timing never changes with the language (cues.json is shared): only the words do.
export type Lang = 'id' | 'en';
export const LANG: Lang = typeof location !== 'undefined' && new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'id';

const ID = {
  // S1–S2 poster
  head: ['HALAMAN INI', 'HARUSNYA'], last: 'DIAM', aside: 'Harusnya sih.',
  tahan: ['Bentar,', 'waktunya kita pause.'],
  posterFoot: 'HARUSNYA DIAM — cetak riso · pink / biru / kuning / hitam',
  tape1: '01 · tipografi kinetik', tape2: '02 · generatif · time remap',
  // S3
  lama: ['Jadul?', 'Masih jalan kok.'], flipHead: 'FLIPBOOK · BOLA MEMANTUL', squash: 'squash!',
  tape3: '03 · frame-by-frame · 12 fps',
  // S4
  tombol: ['Tombol yang bikin', 'gatel pengin dipencet.'],
  ui: { title: 'Pengaturan', silent: 'Mode diam', motion: 'Gerak', last: 'Terakhir dikirim', foot: '12 fps · riso · 4 tinta', send: 'Kirim', sent: 'Terkirim', sentSub: 'Gerak: 100 · barusan' },
  tape4: '04 · UI motion · micro-interaction',
  ruler: '30 cm · KAYU',
  // S5
  data: 'Angka pun ikut bergoyang.', dataSub: 'tinggi batang = musik video ini, per pita frekuensi',
  bands: ['sub', 'bass', 'bawah', 'tengah', 'atas', 'hadir', 'kilau', 'udara'],
  cover: 'KARTU POP-UP · BUKA DI SINI →', tape5: '05 · infografis · audio-reactive',
  // S6
  bunyi: ['Sampai suaranya', 'kami atur.'], word: 'GERAK', tape6: '06 · ritme · sound design',
  // S7
  banner: ['SEMUA GERAK', 'ADA SEBABNYA.'],
  bannerFoot: 'HARUSNYA DIAM — mesin reaksi berantai · 6 stasiun · 60 detik · 128 BPM · 12 fps',
  sbFoot: 'HARUSNYA DIAM · 9:16 · 60 s · 12 fps',
  sbLab: ['titik lepas', 'riak · beku', 'flipbook', 'UI kertas', 'pop-up data', 'G·E·R·A·K', 'lipat · terbang', 'logo'],
  notes: {
    plan: 'rencana: satu titik, satu jalan', beat: 'jatuh di ketukan · 128 BPM', hero: 'titik = tokoh utama',
    tear: ['robek →', 'gelinding →', 'Euler'], ripple: ['riak 95 mm/s', 'tahan', '4,69 → 9,38 s'],
    pages: '46 halaman · 12 fps', spring: 'spring 3,2 Hz', ease: 'ease in-out', bars: ['tinggi = energi', 'lagu ini'],
    cards: '⅛ ketukan per kartu', folds: 'lipat ×4 di ketukan', hole: '× tembus di sini',
  },
  // S8
  page: ['Tinggal satu yang', 'belum bergerak:'], brand: 'brand-mu.', tape7: '07 · brand-mu',
  // closing
  cta: ['Yuk, animasikan', 'brand-mu'], sub: 'Konsultasi dulu, gratis. Baru putuskan.',
};

const EN: typeof ID = {
  head: ['THIS PAGE', 'SHOULD STAY'], last: 'STILL', aside: 'Supposedly.',
  tahan: ['Hold on,', "we're pausing time."],
  posterFoot: 'SHOULD STAY STILL — riso print · pink / blue / yellow / black',
  tape1: '01 · kinetic type', tape2: '02 · generative · time remap',
  lama: ['Old school.', 'Still works.'], flipHead: 'FLIPBOOK · BOUNCING BALL', squash: 'squash!',
  tape3: '03 · frame-by-frame · 12 fps',
  tombol: ['Buttons you', 'want to press.'],
  ui: { title: 'Settings', silent: 'Silent mode', motion: 'Motion', last: 'Last sent', foot: '12 fps · riso · 4 inks', send: 'Send', sent: 'Sent', sentSub: 'Motion: 100 · just now' },
  tape4: '04 · UI motion · micro-interaction',
  ruler: '30 cm · WOOD',
  data: 'Even data can dance.', dataSub: "bar height = this video's music, per frequency band",
  bands: ['sub', 'bass', 'low', 'mid', 'high', 'presence', 'sparkle', 'air'],
  cover: 'POP-UP CARD · OPEN HERE →', tape5: '05 · infographic · audio-reactive',
  bunyi: ['Down to how', 'it sounds.'], word: 'MOVES', tape6: '06 · rhythm · sound design',
  banner: ['EVERY MOVE', 'HAS A CAUSE.'],
  bannerFoot: 'SHOULD STAY STILL — a chain-reaction machine · 6 stations · 60 seconds · 128 BPM · 12 fps',
  sbFoot: 'SHOULD STAY STILL · 9:16 · 60 s · 12 fps',
  sbLab: ['the dot lets go', 'ripple · freeze', 'flipbook', 'paper UI', 'pop-up data', 'M·O·V·E·S', 'fold · fly', 'logo'],
  notes: {
    plan: 'plan: one dot, one path', beat: 'lands on the beat · 128 BPM', hero: 'the dot = the hero',
    tear: ['tear →', 'roll →', 'Euler'], ripple: ['ripple 95 mm/s', 'hold', '4.69 → 9.38 s'],
    pages: '46 pages · 12 fps', spring: 'spring 3.2 Hz', ease: 'ease in-out', bars: ['height = energy', 'of this song'],
    cards: '⅛ beat per card', folds: '×4 folds on the beat', hole: '× through here',
  },
  page: ["One thing hasn't", 'moved yet:'], brand: 'your brand.', tape7: '07 · your brand',
  cta: ["Let's get your", 'brand moving.'], sub: 'Free consultation before you commit.',
};

export const T = LANG === 'en' ? EN : ID;
