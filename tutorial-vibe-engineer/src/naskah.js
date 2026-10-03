// naskah.js — the 19 voice-over lines (one file each in vo/). Shared by timeline.js, vo.js, render.mjs and tools/.
// say = exact transcript, original spelling (what is on screen and what cues search in)
// el  = what was pasted into ElevenLabs v4 (tags in [brackets], "Claude" spelled "Klod"); only vo-bagi uses its length
export const VO_LINES = [
  { id: '01-komentar', say: 'Ada yang minta tutorialnya. Oke, aku bongkar semua.',
    el: '[casual, amused] Ada yang minta tutorialnya. [warm, confident] Oke, aku bongkar semua.' },
  { id: '02-kode', say: 'Video kemarin itu nggak ada keyframe-nya sama sekali. Nggak pakai After Effects. Semuanya kode... dan yang nulis, Claude Code.',
    el: '[casual, a little proud] Video kemarin itu nggak ada keyframe-nya sama sekali. Nggak pakai After Effects. [slower, savoring it] Semuanya kode... [playful] dan yang nulis, Klod Code.' },
  { id: '03-urutan', say: 'Tapi jangan bayangin sekali prompt langsung jadi, ya. Nggak gitu. Ada urutannya.',
    el: '[friendly, lightly teasing] Tapi jangan bayangin sekali prompt langsung jadi, ya. [laughs softly] Nggak gitu. [clear] Ada urutannya.' },
  { id: '04-siapkan', say: 'Yang perlu di-install ada di layar, ya. Udah? Bikin folder kosong, terus ketik claude.',
    el: '[relaxed, conversational] Yang perlu di-install ada di layar, ya. [quick] Udah? Bikin folder kosong, terus ketik klod.' },
  { id: '05-claudemd', say: 'Nah, sebelum nyuruh apa-apa, aku bikin satu file, namanya CLAUDE.md. Isinya aturan kerja... dan Claude bakal baca ini tiap kali mulai.',
    el: '[conversational, explaining to a friend] Nah, sebelum nyuruh apa-apa, aku bikin satu file, namanya Klod em-de. Isinya aturan kerja... dan Klod bakal baca ini tiap kali mulai.' },
  { id: '06-aturan', say: 'Isinya simpel. Jangan langsung ngerjain, kasih rencana dulu. Jangan render sendiri. Dan jangan pernah commit tanpa nanya aku.',
    el: '[casual, counting off on fingers] Isinya simpel. Jangan langsung ngerjain, kasih rencana dulu. Jangan render sendiri. [firm, half-joking] Dan jangan pernah commit tanpa nanya aku.' },
  { id: '07-skill', say: 'Terus aku bikinin dia skill, semacam buku panduan gaya. Ukuran video, logo di akhir, sampai daftar hal yang nggak boleh... biar hasilnya nggak kelihatan generik.',
    el: '[conversational] Terus aku bikinin dia skill, semacam buku panduan gaya. Ukuran video, logo di akhir, sampai daftar hal yang nggak boleh... [knowing] biar hasilnya nggak kelihatan generik.' },
  { id: '08-naskah', say: 'Baru deh mulai. Tapi jangan minta videonya dulu... minta naskahnya.',
    el: '[upbeat] Baru deh mulai. [leaning in, like sharing a tip] Tapi jangan minta videonya dulu... minta naskahnya.' },
  { id: '09-setuju', say: 'Baca, coret yang nggak pas, bolak-balik sampai cocok. Baru bilang setuju.',
    el: '[easy-going] Baca, coret yang nggak pas, bolak-balik sampai cocok. [satisfied] Baru bilang setuju.' },
  { id: '10-storyboard', say: 'Habis itu minta storyboard. Detail banget... sampai posisi teks sama bunyi tiap gerakan ditulis.',
    el: '[conversational] Habis itu minta storyboard. [impressed] Detail banget... sampai posisi teks sama bunyi tiap gerakan ditulis.' },
  { id: '11-kunci', say: 'Nah, baru masuk kode. Ada satu kalimat yang wajib kamu taruh di prompt: tiap frame itu fungsi dari waktu.',
    el: '[upbeat] Nah, baru masuk kode. [leaning in, important] Ada satu kalimat yang wajib kamu taruh di prompt: [slow, clear] tiap frame itu fungsi dari waktu.' },
  { id: '12-identik', say: 'Artinya, mau lompat ke detik berapa pun, gambarnya selalu sama persis. Yang kamu lihat di preview, itu juga yang keluar pas render.',
    el: '[explaining, friendly] Artinya, mau lompat ke detik berapa pun, gambarnya selalu sama persis. Yang kamu lihat di preview, itu juga yang keluar pas render.' },
  { id: '13-suara', say: 'Buat suara, rekam aja suaramu sendiri. Sekali jalan, dari awal sampai akhir. Nanti Claude yang motong per kalimat, terus dicocokin ke gambarnya.',
    el: '[warm, encouraging] Buat suara, rekam aja suaramu sendiri. Sekali jalan, dari awal sampai akhir. [casual] Nanti Klod yang motong per kalimat, terus dicocokin ke gambarnya.' },
  { id: '14-cek', say: 'Terus minta dia ekspor gambar tiap scene. Dan ini penting... lihat sendiri, satu-satu.',
    el: '[conversational] Terus minta dia ekspor gambar tiap scene. [serious, slower] Dan ini penting... lihat sendiri, satu-satu.' },
  { id: '15-revisi', say: 'Ada yang aneh? Bilang aja, yang spesifik. Video kemarin aja sampai tiga versi.',
    el: '[casual] Ada yang aneh? Bilang aja, yang spesifik. [wry, honest] Video kemarin aja sampai tiga versi.' },
  { id: '16-render', say: 'Kalau udah oke, render di laptopmu sendiri. Terus commit, biar ada titik aman buat balik.',
    el: '[relaxed] Kalau udah oke, render di laptopmu sendiri. [warm] Terus commit, biar ada titik aman buat balik.' },
  { id: '17-lima', say: 'Eh, sadar nggak? Ini lima aturan yang sama kayak di video kemarin. Baca dulu, kasih konteks, perintah kecil, tes, commit.',
    el: '[playful, slowing down] Eh, sadar nggak? [curious, building] Ini lima aturan yang sama kayak di video kemarin. [clear, rhythmic] Baca dulu, kasih konteks, perintah kecil, tes, commit.' },
  { id: '18-cara', say: 'Jadi video soal vibe engineer... ya dibikin pakai cara vibe engineer juga.',
    el: '[warm, a little smug] Jadi video soal vibe engineer... [satisfied, smiling] ya dibikin pakai cara vibe engineer juga.' },
  { id: '19-follow', say: 'Follow, ya. Biar nggak cuma vibe coding. Terus kalau mau dibikinin video kayak gini... kontaknya ada di layar.',
    el: '[warm, friendly] Follow, ya. Biar nggak cuma vibe coding. [casual, inviting] Terus kalau mau dibikinin video kayak gini... kontaknya ada di layar.' },
];
export const VO_EXTS = ['wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'webm'];
export const SOURCE_TAKE = 'ElevenLabs_2026-10-03T08_55_57_Zephlyn - Calm, Neutral and Measured_pvc_sp100_s50_sb75_v4.mp3';

// prompts typed into the dock on screen (their lengths set the typing cues in timeline.js)
export const PROMPT_NASKAH = 'Bikin video edukasi 9:16 tentang vibe coder vs vibe engineer, gaya pixel art. Tulis naskahnya dulu, jangan coding.';
export const PROMPT_STORYBOARD = 'Tulis storyboard: teks, posisi, dan bunyi.';
export const PROMPT_KUNCI = 'Setiap frame adalah fungsi dari waktu t.';
export const PROMPT_SUARA = 'Potong per kalimat, cocokkan ke gambar.';
export const CMD_STILLS = 'npm run stills';
export const COMPLAINT_TXT = 'S5: laut depan jangan menutupi palka';
export const COMMIT_TXT = 'feat(vibe-engineer): video edukasi Vibe Engineer + longgarkan larangan';
export const PROMPT_URUTAN = 'bikinin video kayak kemarin';
export const TERM_INSTALL = ['# Claude Code', 'irm https://claude.ai/install.ps1 | iex', '# Node.js 18+ dan ffmpeg (untuk render)', 'winget install OpenJS.NodeJS.LTS Gyan.FFmpeg'];
export const TERM_FOLDER = ['mkdir video-saya; cd video-saya', 'claude'];
export const HOOK_REWRITE = 'Bedanya: tahu kenapa.';
