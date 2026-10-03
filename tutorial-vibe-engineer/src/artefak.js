// artefak.js — DIBUAT OLEH tools/ambil-aset.mjs (jangan diedit). Salinan beku dari file asli repo.
export const A = {
 "claude": "# Motion-Graphics-Code — aturan kerja\n\nRepo konten TikTok **Beyond Studio** (edukasi tech sampai promosi), dibuat sebagai motion graphics berbasis kode.\n\n## Aturan tetap\n- **Review dulu, kerjakan kemudian.** Setiap permintaan, sekecil apa pun, jangan langsung dikerjakan. Ajukan rencananya untuk direview: untuk video berupa storyboard, gaya, dan kebutuhan aset/audio; untuk revisi berupa apa yang diubah, di scene mana, dan dampaknya. Kerjakan hanya setelah user bilang setuju.\n- Kerja langsung di branch `master`. Jangan membuat branch atau worktree baru.\n- Hasil kerja = **file siap render** (kode, aset, naskah, dokumen). Jangan render MP4 (final maupun draft); user yang me-render sendiri. Still/contact sheet PNG boleh untuk pengecekan visual, simpan di `out/`.\n- **Jangan pernah `git commit` / `git push`** tanpa persetujuan eksplisit user. Di akhir pekerjaan, tulis commit message siap copy dalam blok ```text```.\n- Jangan menyentuh folder proyek lain selain yang sedang dikerjakan.\n\n## Video baru\nSetiap video baru maupun revisi (sekecil apa pun) wajib memakai skill `beyond-video` (`.claude/skills/beyond-video/`). Skill itu yang menjaga tone khas Beyond Studio.\n\n## Peta repo\n- `beyond-studio/`: promo 45 s 3D (three.js + Vite, render Node + Chrome headless; `cues.json` = sumber waktu).\n- `evolusi-layar/`: edukasi vertikal (Node + Canvas2D, VO elastis, audio sintetis).\n- `celestial-scrolls/`: promo sinematik satu file HTML (CDP).\n- `satu-frame/`: edukasi vertikal 75 s, satu refresh layar diperlambat tanpa cut (three.js + Vite, `cues.json` = sumber waktu, jam fisik, audio sintetis; render tidak menimpa file lama).\n- `harusnya-diam/`: showreel vertikal 60 s, reaksi berantai kertas risograf 12 fps (three.js + Vite, `cues.json` = sumber waktu, audio sintetis + `bars.json`; closing mengikuti end card legacy).\n- `vibe-engineer/`: edukasi vertikal ±101 s, pixel art Canvas2D, durasi mengikuti file VO.\n- `srikandi-promo/`: promo 38,4 s Srikandi Tailor (Remotion/React, 30 fps).\n- `beyond-studio-legacy/`: promo 16:9 30 s versi lama (Python + HTML); rujukan end card/closing di `site/template.html`.\n- `pdoom-video-main/`: benchmark eksternal (gitignored, hanya ada lokal). Rujukan kualitas, bukan untuk diedit.\n",
 "larangan": "## 4. LARANGAN (anti-slop, seluruh video)\n- Gambar AI, stok \"AI/tech\" generik, otak bercahaya, hujan kode Matrix, neon ungu-cyan cyberpunk, nebula partikel generik, lens flare berlebihan.\n- Gerak mengambang ala screensaver; elemen bergerak tanpa sebab (setiap perubahan dipicu klik, ketukan, atau narasi).\n- Wajah/mata realistis.\n- Teks bergaris tepi (outline) atau ber-halo; lebih dari satu kalimat utama sekaligus.\n- Karya \"ilustrasi\" palsu untuk promo: tampilkan website klien asli (`beyond-studio/app/public/assets/`).",
 "skillHead": "---\nname: beyond-video\ndescription: Use when creating or revising (any size, even one scene or one color) a Beyond Studio TikTok / Reels video in this repo (edukasi tech, promosi, motion graphics, konten vertikal 9:16), including when the user gives only a topic or idea (\"bikin video tentang ...\", \"konten baru\", \"video promo\", \"ganti scene ...\", \"percepat hook\").\n---\n\n# Beyond Video\n\n## Overview\nIsi konten setiap video Beyond Studio **bebas sebebas-bebasnya**: engine, palet, font, gaya, dan ritme boleh berbeda total dan tidak terikat brand. Yang selalu sama hanya **closing logo + CTA** (memakai brand kit), ditambah aturan teknis dan larangan anti-slop. Brand bible ada di `STYLE.md` (satu folder dengan file ini); baca dulu sebelum menulis apa pun.\n\nAturan repo (dari `CLAUDE.md`) tetap berlaku: kerja di `master`, jangan render MP4, jangan pernah commit.\n",
 "s8": "",
 "treatmentHeads": [
  "S1 · Karam · 0,0 – 4,0 · wide ×4, malam",
  "S2 · Vibe coder · 4,0 – 10,8 · wide ×4 → close-up ×12, sore",
  "S3 · Merem · 10,8 – 18,3 · close-up ×16",
  "S4 · Terima semua · 18,3 – 25,0 · close-up ×10 → wide ×4",
  "S5 · Tengah malam · 25,0 – 32,0 · wide ×4 → potongan kapal ×6",
  "S6 · Bug = kesalahan di kode · 32,0 – 38,5 · close-up palka ×12",
  "S7 · Naik pangkat · 38,5 – 44,2 · palka ×12, game di-pause",
  "S8 · ① Baca dulu · 44,2 – 50,2 · close-up ×16, malam",
  "S9 · Bos · 50,2 – 52,1 · wide ×4 (tanpa VO)",
  "S10 · ② Kasih konteks · 52,1 – 60,1 · close-up ×12",
  "S11 · ③ Perintah kecil · 60,1 – 67,3 · dek ×10, tentakel di belakang pagar",
  "S12 · ④ Cek pakai tes · 67,3 – 75,9 · close-up ×16",
  "S13 · ⑤ Commit · 75,9 – 83,7 · dek ×10",
  "S14 · Ulangi · 83,7 – 88,4 · wide ×4, malam → fajar",
  "S15 · Bedanya · 88,4 – 96,7 · layar terbelah ×16 → tiang ×6, fajar",
  "S16 · Santai · 96,7 – 100,2 · wide ×4, fajar",
  "S17 · Closing · 100,2 – ±106"
 ],
 "film": "// film.js — the edit. render(c, t) draws the whole frame at time t. Pure function of t.\n// Per frame, three pixel layers, each with one fixed pixel size:\n//   1. world  — the scene on a low-res canvas, 1 world px = P×P px (P = 4 wide … 16 close-up), scaled up without smoothing\n//   2. props  — the explaining objects (code window, shield, crystal…), 1 prop px = 4×4 px, flat colours\n//   3. UI     — HUD (rank + five rule slots), explainer card, bubbles, 1 UI px = 2×2 px\n// then the scene's own full-res overlays (rewind scanlines, iris, closing).\n// Close-ups drift sideways a few px over the scene (world + props together; the HUD and the card stay put).\n// Cuts listed in timeline.TRANS are covered by a wipe: both scenes are drawn and the incoming one is revealed.\nimport { W, H, canvas, ease, clamp } from './core.js';\nimport { palette } from './pixel/palette.js';\nimport { S, CUE, SLOT_AT, TRANS, SCENE_IDS, sceneAt, todAt, DURATION, MARKERS } from './timeline.js';\nimport { UW, UH, rankBadge, ruleSlots, plusOne, card, activeCard, bubble, activeBubble } from './ui.js';\nimport { SCENES } from './scenes/index.js';\nimport { toUI } from './scenes/common.js';\n\nexport { DURATION, MARKERS };\nconst WORLD = {};\nfor (const P of [4, 6, 8, 10, 12, 16]) { const cv = canvas(Math.ceil(W / P) + 2, Math.ceil(H / P) + 2); WORLD[P] = { cv, g: cv.getContext('2d') }; }\nconst UIC = canvas(UW, UH), UG = UIC.getContext('2d');\nconst PC = canvas(UW, UH), PG = PC.getContext('2d');\nconst OFF = [canvas(W, H)].map((cv) => ({ cv, g: cv.getContext('2d') })); // the outgoing scene during a wipe\n\nexport function init() {}\n\n// the slow sideways drift of a close-up: ±12 px across the scene, alternating direction scene by scene\nfunction drift(id, t, v) {\n  if (v.P < 10 || v.drift === false) return 0;\n  const sc = S[id], i = SCENE_IDS.indexOf(id), k = ease.inOutCubic(clamp((t - sc.t0) / (sc.t1 - sc.t0)));\n  return Math.round((i % 2 ? 1 : -1) * (k * 24 - 12));\n}\n// the HUD steps back (dimmer) unless it is changing: a rank swap, slots appearing, a slot filling\nfunction hudAlpha(t) {\n  const hot = [CUE.pangkat.costume, CUE.pangkat.slots, CUE.layar.hat, ...SLOT_AT].some((x) => t >= x - 0.1 && t < x + 1.6);\n  return hot ? 1 : 0.72;\n}\n\nfunction renderScene(c, t, id) {\n  const sc = SCENES[id], v = sc.view(t);\n  const P = palette(v.tod ?? todAt(t)), dx = drift(id, t, v);\n  c.save();",
 "commit": "feat(vibe-engineer): video edukasi Vibe Engineer + longgarkan larangan",
 "stills": [
  "s01-karam",
  "s01-rewind",
  "s02-bayu",
  "s02-dermaga",
  "s03-dialog",
  "s03-merem",
  "s04-berangkat",
  "s04-rilis",
  "s04-tombol",
  "s05-bocor",
  "s05-dialog",
  "s05-malam",
  "s06-bug",
  "s06-dialog",
  "s06-peti",
  "s07-pangkat",
  "s07-xp",
  "s08-baca",
  "s08-periksa",
  "s08-sentil",
  "s09-kraken",
  "s10-dialog",
  "s10-konteks",
  "s10-tebak",
  "s11-besar",
  "s11-kecil",
  "s12-lolos",
  "s12-merah",
  "s12-tes",
  "s13-balik",
  "s13-berantakan",
  "s13-commit",
  "s14-kabur",
  "s14-ulangi",
  "s15-coder",
  "s15-engineer",
  "s15-layar",
  "s15-topi",
  "s16-lanjut",
  "s16-santai",
  "s17-akhir",
  "s17-cincin",
  "s17-follow",
  "s17-kunci"
 ],
 "video": {
  "src": "vibe-engineer_2026-10-01_1800_final.mp4",
  "fps": 30,
  "clips": {
   "r1-karam": {
    "from": 0.5,
    "to": 1.7,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r2-terima": {
    "from": 19.05,
    "to": 20.25,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r3-bocor": {
    "from": 25.7,
    "to": 26.9,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r4-peti": {
    "from": 33,
    "to": 34.2,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r5-pangkat": {
    "from": 39.15,
    "to": 40.35,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r6-kraken": {
    "from": 48,
    "to": 49.2,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "r7-kecil": {
    "from": 59.45,
    "to": 60.65,
    "d": 1.2,
    "fps": 30,
    "n": 36,
    "audio": true
   },
   "s7-baca": {
    "from": 42.4,
    "to": 45.6,
    "d": 3.2,
    "fps": 30,
    "n": 96,
    "audio": false
   },
   "s8-sama": {
    "from": 44,
    "to": 47,
    "d": 3,
    "fps": 30,
    "n": 90,
    "audio": false
   },
   "s10-bocor": {
    "from": 25,
    "to": 28,
    "d": 3,
    "fps": 30,
    "n": 90,
    "audio": false
   },
   "hp": {
    "from": 89,
    "to": 96.4,
    "d": 7.4,
    "fps": 30,
    "n": 222,
    "audio": true
   }
  }
 },
 "stats": {
  "lines": 4246,
  "files": 24,
  "frames": 6090,
  "duration": 101.4
 }
};
