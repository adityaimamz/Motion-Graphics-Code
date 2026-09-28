# Evolusi Layar — Animation Guide

## 1. Prinsip

1. **Setiap frame = f(t).** Tidak ada `Math.random()`, `Date.now()`, `requestAnimationFrame` sebagai sumber waktu,
   atau state yang terakumulasi. Acak = `hash(i, seed)`. Seek ke detik mana pun menghasilkan frame yang identik.
2. **Kedipan dikunci ke frame.** Hal yang "melompat" (kursor berkedip, penghitung, pergantian gaya di hook) memakai
   `fq(t) = round(t·60)/60`, sehingga konstan selama shutter motion blur dan tidak menghasilkan dobel-eksposur.
3. **Brand = narator, era = suara.** Odometer tahun dan closing selalu memakai bahasa visual Beyond Studio (IT,
   `#F5F5F5`, biru). Semua yang ada di dalam layar + caption boleh "jelek" sesuai era, tapi tetap terbaca.
4. **Satu kemewahan.** Caption yang berevolusi adalah hal yang diingat; latar dibuat tenang dan gelap.

## 2. Palet

Brand (dari project promo): void `#000000`, paper `#F5F5F5`, mute `#9CA3AF`, blue `#3B82F6`, blue2 `#2563EB`,
ice `#60A5FA`, deep `#1D4ED8`.

Glow latar per era — bergerak dari hijau ke biru, jadi palet "mendarat" di biru secara natural:

| Era | Glow latar | Tinta utama di layar |
|---|---|---|
| 1991 | `#1BFF7A` (fosfor P1) sangat samar | `#7DFFA8` di `#03110A` |
| 1998 | `#FF3DCB` + `#FFE14D` | pelangi di atas bintang navy `#08082A` |
| 2002 | `#FF8A1F` + perak | krom `#E9EEF5 → #6B7482` di hitam |
| 2007 | `#22C3EE` aqua | aqua `#1FA7E0`, lime `#7BC62D`, oranye `#F7931E` |
| 2015 | `#2E86DE` | flat `#2E86DE`, navy `#1F3A5F`, putih |
| 2023 | `#3B82F6` | fajar `#071330 → #1E3A8A → #3B82F6 → #BFDBFE` |
| Closing | `#2563EB` di `#000` | brand |

## 3. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Narator / brand | **IT** (Inter Tight variable, family diberi nama `IT`) | Ganti `fonts/it.woff2` dengan file asli Beyond Studio bila ada |
| 1991 | VT323 | Grid monospace, glow fosfor |
| 1998 | Comic Neue Bold, Tinos (Times) | Huruf pelangi bergoyang + bayangan keras |
| 2002 | Orbitron (wordmark), Exo 2 Italic (caption), Silkscreen (UI piksel) | |
| 2007 | Nunito Black (logo bulat), Arimo (UI/caption) | |
| 2015 | Montserrat | |
| 2023 | IT | |

Ukuran caption 60–66 px, baris maks ±26 karakter, rata kiri di x = 90 (di luar zona tombol kanan TikTok).

## 4. Layout vertikal (1080×1920)

```
 y   0 ┌──────────────────────────┐  (UI TikTok — dekoratif saja)
   190 │        1 9 9 1           │  odometer, IT 800, 170 px
   370 │        web teks          │  label era, IT 500, 38 px, mute
   440 │ ┌──────────────────────┐ │
       │ │                      │ │  LAYAR — pusat y = 800
       │ │   4:3  (880×660)     │ │  16:10 (920×575) untuk 2007/2015
       │ │                      │ │  2023: full-bleed 1080×1920
  1170 │ └──────────────────────┘ │
  1235 │ Caption baris 1          │  caption era (x 90 → 930)
       │ Caption baris 2          │
  1560 ├──────────────────────────┤  (UI TikTok: caption & username)
  1920 └──────────────────────────┘
```

## 5. Easing & timing

- Kurva utama: `outExpo` untuk masuk (cepat, lalu mengendap), `inOutCubic` untuk morph, `outBack(1.6)` untuk
  pop-in era 1998/2002 (sengaja norak), `inExpo` untuk keluar.
- Semua keyframe ditulis sebagai `keys(t, [[t0, v0, ease], [t1, v1], …])` — satu fungsi, bisa di-seek.
- Transisi **overlap** 0.55–0.95 s; tidak ada frame hitam kosong di antara era.
- Hold baca: ±0.28 s per kata setelah baris terakhir caption muncul penuh.

## 6. Caption per era

| Era | Masuk | Diam | Keluar |
|---|---|---|---|
| 1991 | Ketik 45 kar/detik + kursor blok | glow fosfor berdenyut halus | rontok per huruf |
| 1998 | Huruf pop satu-satu (`outBack`) | hue berputar, huruf naik-turun sinus | rontok |
| 2002 | Huruf terbang dari posisi acak + rotasi | kilatan krom menyapu tiap 1.6 s | rontok |
| 2007 | Fade + naik 30 px per baris | kilap putih menyapu, pantulan di bawah | kilap memudar bersama morph |
| 2015 | Blok warna meluncur dari kiri, teks muncul di atasnya | diam total (flat) | blok menyusut |
| 2023 / closing | Mask reveal: baris naik dari balik garis potong (pola `.mask .sp` promo) | diam | naik keluar |

## 7. Transisi

| Dari → Ke | Teknik | Yang dimaknai |
|---|---|---|
| Hook → 1991 | Backspace → kursor → CRT power-on | kembali ke nol |
| 1991 → 1998 | Pixel dissolve blok 20 px | internet "dicat" |
| 1998 → 2002 | Iris wipe | transisi klise era itu |
| 2002 → 2007 | Klik "SKIP INTRO" → kilatan putih, rasio layar 4:3 → 16:10 | orang lelah menunggu |
| 2007 → 2015 | **Morph parametrik** (satu renderer, `k` 0→1) | dekorasi dilucuti |
| 2015 → 2023 | Layar mengembang menjadi frame penuh | ponsel menjadi layar utama |
| 2023 → closing | Tarik mundur ke grid kontak | rekap |
| Closing | Panah brand menyapu → arc logo menggambar | identitas |

Bezel layar diinterpolasi antar era (warna, tebal, radius, kilap), jadi perangkat ikut "berevolusi" di setiap transisi.

## 8. Finishing

- Grain: tile noise 256 px, di-offset per frame (`frameIdx`), blend `overlay`, 11–14 %.
- Vignette radial, lebih kuat di closing.
- CRT (1991): scanline 3 px, lengkung vignette dalam layar, glow teks via layer blur.
- Motion blur: rata-rata sub-frame di shutter 0.5 frame. Jumlah sub-frame per frame diambil dari `motion(t)`
  (3 saat diam, 6–10 saat transisi/whip). Render cepat: `--samples 1`.

## 9. Suara

- **Satu sumber waktu.** `src/timeline.js` dibaca oleh visual dan audio. Contoh: jumlah klik print head dihitung dari
  teks halaman 1991 dan kecepatan cetaknya, tick odometer dihitung dari kurva tahun `YEAR_K`, chime "Siap diambil"
  dari `CUE.tap23`.
- **Musik ikut berevolusi**: dengung terminal → chiptune MIDI → trance intro → pop glossy → petikan minimal →
  e-piano modern → sonic logo. Tempo tiap era dihitung dari awal scene-nya sendiri.
- **Transisi punya bunyi** yang menjelaskan maknanya: crunch digital untuk dissolve, swoop untuk iris, crash untuk
  kilatan, tape-stop untuk "dekorasi dikempeskan", riser untuk layar yang mengembang, impact untuk logo.
- **Sonic logo Beyond Studio**: impact sub + akor bell C maj9 saat panah mendarat, lalu dua bell (G→C) saat
  wordmark naik. Kunci C menyambung dari musik 2023.
- **Mix**: bus musik, bus efek, satu reverb bersama (Freeverb). Master: high-pass 28 Hz, kompresor ringan,
  normalisasi ≈ −15.5 dBFS RMS, limiter look-ahead −1 dBFS, fade out 0.5 s. Kira-kira sesuai target loudness
  platform sosial; TikTok tetap akan menormalisasi ulang.
- Deterministik seperti visual: noise berasal dari `hash()`, dither TPDF juga di-hash. Render audio ±3 detik.

## 10. Voice over

- Narasi = teks caption. Satu file per kalimat caption (`VO_LINES` di `timeline.js`), plus "Beyond Studio" opsional
  di wordmark.
- **Timeline elastis**: `applyVO(durasi)` membangun ulang `S`, `TR`, `CAPTIONS`, dan `CUE`. Aturannya: kalimat mulai
  0.05 s setelah caption-nya; kalimat berikutnya dalam scene yang sama menunggu 0.15 s setelah kalimat sebelumnya;
  scene harus selesai bicara 0.45 s sebelum transisinya (2002: 0.3 s sebelum klik "SKIP INTRO"). Kalau tidak cukup,
  scene melebar (dibulatkan ke frame) dan semua sesudahnya bergeser. Visual hanya "menahan" lebih lama: loop tetap
  bergerak, caption tetap terbaca.
- Di closing, cincin seleksi melompat lebih lambat selama baris pertama diucapkan, dan urutan brand (panah, logo,
  wordmark) menunggu baris kedua selesai.
- **Halaman caption** (`page: true` di `CAP_BASE`): 2007, 2015, dan 2023 punya halaman kedua berisi "kenapa". Halaman
  pertama keluar 0.4 s sebelum halaman kedua masuk; kalimat pertama halaman kedua menunggu 0.45 s setelah kalimat
  sebelumnya, dan waktu dasarnya absolut (tidak ikut terdorong kalimat sebelumnya).
- **Aksi yang menempel ke kata**: `CUE.press07` (tombol glossy ditekan di "dipencet"), `CUE.tap15`/`tap15b`
  (tap + scroll + tombol flat), `CUE.know23` (yang "dikenal" menyala), `CUE.tap23` (tap di "tap") dihitung dari posisi
  dan durasi kalimatnya (`word(scene, i, f)`). Ajakan follow (`cta: true`, file `22-follow`) diletakkan sesudah wordmark
  (dan sesudah "Beyond Studio." kalau diisi); end card ditahan 1.2 s setelah kalimat itu selesai (`CUE.cta`, `CUE.ctaTap`). Tanpa file VO, durasinya diperkirakan dari panjang teks (19.5 karakter/detik).
- **Ducking gaya sidechain**: kompresor bus dihitung dari bed yang belum di-duck, lalu musik −11 dB dan efek −5 dB
  diterapkan di bawah narasi dengan ramp 0.12 s masuk / 0.35 s keluar; jeda antar-kalimat < 0.45 s dijembatani supaya
  musik tidak "memompa". Suara: high-pass 75 Hz, dinormalisasi per kalimat, duduk ±10 dB di atas bed.
- Preview dan renderer menghitung durasi dengan fungsi yang sama (`vo.js/analyse`); saat render, durasi dari Node
  dikirim ke halaman, jadi gambar dan suara memakai timeline yang identik.

## 11. Struktur kode

```
index.html        harness: preview (play/scrub/keyboard) + mode ?export=1
src/timeline.js   S, TR, CAPTIONS, CUE, VO_LINES, applyVO() — sumber waktu untuk gambar, suara, dan narasi
src/vo.js         deteksi ucapan, pencocokan file, loader VO browser
src/core.js       math, easing, keys(), hash, font, teks, bentuk
src/audio.js      synth + skor + mixing/mastering → Float32 stereo / WAV
src/sites.js      renderer website tiap era (Kopi Pagi ×6) + bezel
src/film.js       timeline, odometer, caption, transisi, hook, closing, post
src/main.js       loop preview, API window.__evo (ready, duration, still, frame)
render.mjs        Playwright headless → sub-frame → ffmpeg (rawvideo pipe) + mux soundtrack AAC
```
