# Vibe Engineer — Beyond Studio

Video edukasi vertikal 1080×1920 @ 60 fps, ±101 detik (panjangnya mengikuti file VO). Pixel art 100 % dari kode
(Canvas2D): tidak ada gambar, footage, atau lagu dari luar. Setiap frame adalah fungsi murni dari waktu `t`, jadi
preview dan hasil render identik dan bisa di-seek ke frame mana pun.

Cerita, storyboard, palet, dan audio: [`TREATMENT.md`](TREATMENT.md). Naskah VO: [`vo/naskah-tts.txt`](vo/naskah-tts.txt).
Isinya: bagaimana vibe coder naik pangkat jadi vibe engineer, dengan 5 aturan. Narasi memakai bahasa lugas;
kapal, kraken, dan pangkat hanya ilustrasi.

## Kebutuhan

Node.js 18+, ffmpeg (dengan libx264) di PATH, dan Chrome/Chromium.

```sh
npm install
npx playwright install chromium     # sekali saja; atau pakai Chrome yang sudah ada:
                                    #   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

## Preview

```sh
npm run preview        # lalu buka http://localhost:5173/
```

Saat pertama kali play, soundtrack disintesis di browser (±3 detik), lalu diputar sinkron dengan gambar.
Kontrol: `space` play/pause, `←/→` ±1 s (shift ±5 s), `,` / `.` satu frame, `[` / `]` pindah scene, `l` loop scene,
`m` mute, `h` sembunyikan UI. `?t=23.2` membuka langsung di detik tertentu.

## Render

```sh
npm run render:draft                         # cepat, untuk cek timing  → out/vibe-engineer_<tanggal>_<jam>_draft.mp4
npm run render                               # final (x264 CRF 16, slow) → out/vibe-engineer_<tanggal>_<jam>_final.mp4
node render.mjs video --jobs 4               # final, dibagi 4 browser paralel lalu digabung lossless
node render.mjs video --from 30 --to 36 --out out/potongan.mp4
```

Nama file diberi cap waktu, jadi render baru tidak pernah menimpa yang lama. Audio (AAC 256 kbps, 48 kHz) ikut
otomatis. Opsi lain: `--noaudio`, `--audio mix-saya.wav`, `--novo` (abaikan `vo/`).

```sh
npm run audio          # soundtrack saja → out/vibe-engineer_<tanggal>_<jam>.wav (−14 LUFS, true peak ≤ −1 dBTP)
npm run stills         # still per momen kunci → out/stills/
npm run sheet          # contact sheet → out/sheet.png
npm run check          # determinisme: frame di t yang sama harus identik
```

## Voice over (ElevenLabs Eleven v4, satu tarikan)

16 baris, satu file per baris, di `vo/` dengan nama persis `01-karam` … `16-follow`. Teks: [`vo/naskah-tts.txt`](vo/naskah-tts.txt).
Naskahnya lugas (prompt, kode AI, bug, tes, commit); kapal dan kraken hanya ilustrasi.

Semua baris dibacakan dalam **satu generate** supaya suara dan nada konsisten, lalu dipotong otomatis (lokal, tanpa API):

1. Buka [`vo/naskah-elevenlabs.txt`](vo/naskah-elevenlabs.txt), copy blok `>>> … <<<` ke ElevenLabs (model Eleven v4, satu suara, bukan mode dialog), generate 2–3 kali dan pilih **satu rekaman utuh**.
2. Simpan sebagai `vo/satu-tarikan.mp3`, lalu:

```sh
npm run vo:bagi -- vo/satu-tarikan.mp3 --dry   # tampilkan titik potong tiap baris (tidak menulis apa-apa)
npm run vo:bagi -- vo/satu-tarikan.mp3         # potong → vo/raw/<id>.wav, rapatkan → vo/<id>.wav
npm run vo:bagi -- vo/satu-tarikan.mp3 --potong 3.9,12.1,…   # 15 waktu potong manual (detik), kalau ada yang meleset
npm run vo                                     # laporan: file terbaca, durasi, posisi tiap scene, durasi total
```

- **Cara memotong:** semua jeda adalah calon batas baris. Dari 15 batas yang dibutuhkan, dipilih yang paling cocok dengan proporsi panjang teks (dynamic programming) dan lebih suka jeda panjang, sehingga jeda di dalam baris ("...", titik dua, koma) tidak salah dikira batas. Tabel hasilnya menandai baris yang janggal dengan `← cek`. Diuji pada audio sintetis 16 baris: 15 dari 15 batas tepat.
- **Diproses ringan:** `vo-rapat` memotong hening dan jeda yang terlalu panjang (maks 0,45 s), **tempo tidak diubah**, dan menulis `vo/<id>.wav` (48 kHz) yang dipakai film.
- **VO elastis:** hening di awal/akhir file dipotong otomatis. Kalimat yang lebih panjang dari perkiraan membuat scene-nya melebar; semua yang sesudahnya (gambar, musik, efek, closing) ikut bergeser, dan momen besar tetap jatuh di ketukan. Musik di-duck ±11 dB dan efek ±5 dB saat narator bicara. Selama file belum ada, durasinya diperkirakan (±15 karakter/detik) dan barisnya tidak bersuara.
- **Gemini (cadangan, per baris):** `npm run tts` (tools/tts-gemini.mjs, butuh `GEMINI_API_KEY` di `.env`). VO Gemini dari naskah lama ada di `vo/lama/` dan tidak dipakai lagi.
- **Rekaman sendiri:** taruh `vo/<id>.wav` (atau .mp3/.m4a/…), tidak ada yang perlu diubah di kode.

`.env` di-ignore git lewat `vibe-engineer/.gitignore`.

## Struktur

```
render.mjs              server preview + renderer (Chrome headless → ffmpeg), mode: serve video audio vo stills sheet check
index.html              kanvas + player preview
src/timeline.js         SATU sumber waktu: scene, VO elastis, kartu penjelas, balon dialog, slot aturan, cue di ketukan
src/film.js             komposit per frame: dunia ×4…×16 + lapisan ilustrasi ×4 + UI ×2 + overlay
src/pixel/              palet waktu (sore/malam/fajar) + palet ilustrasi, primitif pixel, font bitmap layar kapal
src/art/                Bayu (chibi), Kursor, kapal, dunia, kumbang bug + kraken, props (jendela kode, perisai, kristal…)
src/ui.js               HUD (pangkat + 5 slot aturan + bos), kartu penjelas, balon, label (Jersey 10, di-threshold)
src/scenes/             karam, dermaga (S2–S4), bocor (S5–S6), pangkat (S7–S8), kraken (S9–S14), fajar (S15–S16), closing
src/audio.js            musik chiptune + SFX dari cue, ducking VO, master
tools/vo-bagi.mjs       potong satu rekaman panjang jadi 16 file VO (npm run vo:bagi)
tools/vo-rapat.mjs      potong hening + rapatkan jeda VO
tools/tts-gemini.mjs    VO per baris dari Gemini 3.8 Flash TTS (cadangan, npm run tts)
fonts/                  Jersey 10 (OFL) untuk semua teks game, Inter Tight untuk closing
```
