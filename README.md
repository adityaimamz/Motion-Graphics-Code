# HTML Motion Graphics 🎬

Koleksi proyek **programmatic motion graphics** berbasis web (HTML5 Canvas, CSS 3D Transforms, deterministik JavaScript, dan sintesis audio DSP) yang di-render secara *headless* menjadi video broadcast-grade 60 FPS menggunakan Chromium (Playwright & Chrome DevTools Protocol) serta FFmpeg.

---

## 📂 Struktur Proyek

```text
Motion-Grapich-Code/
├── beyond-studio/                       # Promo 3D Beyond Studio 45 detik (three.js/Node)
│   ├── app/                             # Film three.js: engine, studio 3D, scene per bab, player & renderer
│   ├── cues.json                        # Sumber waktu tunggal untuk gambar & suara
│   ├── audio.py                         # Synthesizer audio DSP 48kHz (SciPy/NumPy)
│   ├── build.py                         # Generator QR WhatsApp dari kontak.json
│   ├── kontak.json                      # Konfigurasi nomor WhatsApp end card
│   ├── TREATMENT.md                     # Konsep & storyboard per scene
│   ├── MOTION-GUIDE.md                  # Panduan standar motion brand resmi
│   └── README.md                        # Dokumentasi teknis & panduan render Beyond Studio
│
├── evolusi-layar/                       # Video Edukasi Vertikal "Evolusi Layar" (Node.js/Playwright)
│   ├── src/                             # Canvas 2D engine procedural, synth audio, & timeline
│   ├── fonts/                           # Web fonts OFL lokal (Inter Tight, VT323, Orbitron, dll.)
│   ├── vo/                              # Folder slot audio voice over & naskah
│   ├── vo-uji/                          # Audio uji robotik (espeak-ng)
│   ├── render.mjs                       # Parallel headless renderer & adaptive motion blur
│   ├── STORYBOARD.md                    # Konsep adegan, shot list, dan timing per era
│   ├── ANIMATION_GUIDE.md               # Panduan gaya visual, easing, caption, & transisi
│   ├── VOSCRIPT.md                      # Naskah resmi & arahan intonasi voice over
│   └── README.md                        # Dokumentasi lengkap pipeline Evolusi Layar
│
├── celestial-scrolls/                   # Motion Promo Sinematik Celestial Scrolls (Node.js/CDP)
│   ├── celestial-scrolls-film.html      # Self-contained single-file (~1.2 MB) multi-layer canvas & DOM
│   ├── render_to_video.js               # CDP headless Chrome video renderer 60 FPS
│   ├── celestial-scrolls-audio.mp3      # Audio soundtrack film
│   └── ANALISIS_CELESTIAL_SCROLLS_FILM.md # Bedah teknis arsitektur 5 layer rendering
│
├── satu-frame/                          # Edukasi vertikal 75 detik "Satu Frame" (three.js/Node)
│   ├── app/                             # Film three.js: dunia per skala (piksel → km), bab S1–S10, player & renderer
│   ├── cues.json                        # Sumber waktu tunggal: bab, cue, jam fisik, teks
│   ├── audio.py                         # Musik + SFX sintetis (tape-stop mengikuti jam fisik)
│   ├── tools/bake_earth.py              # NASA Black Marble + Natural Earth → tekstur Bumi
│   ├── TREATMENT.md                     # Konsep, storyboard, jam fisik, catatan fakta
│   └── README.md                        # Dokumentasi teknis & panduan render Satu Frame
│
├── harusnya-diam/                       # Showreel vertikal 60 detik "Harusnya Diam" (three.js/Node)
│   ├── app/                             # Dunia kertas: material riso (halftone per piksel), stasiun, kamera, closing
│   ├── cues.json                        # Sumber waktu tunggal: bab, cue, caption
│   ├── audio.py                         # Musik 2-step + foley kertas sintetis, master −14 LUFS, bars.json
│   ├── TREATMENT.md                     # Konsep, trend yang ditegakkan, storyboard S1–S9
│   └── README.md                        # Dokumentasi teknis & panduan render Harusnya Diam
│
├── .gitignore                           # Proteksi dari file biner video/audio besar & cache
└── README.md                            # Dokumentasi induk repositori
```

---

## 🚀 Fitur Unggulan Proyek

### 1. Beyond Studio (`beyond-studio/`)
Video promosi agensi 3D (three.js) — "pemotretan produk di studio gelap": perangkat 3D menampilkan website klien asli, panah logo menjadi kursor, kamera crane antar-set:
* **Multi-Format & Rasio**: 16:9 Horizontal (YouTube/Web) dan 9:16 Vertikal (Instagram Reels, TikTok, YouTube Shorts) dari satu film (`--fmt h|v`).
* **Multi-Durasi**: Full Cut 45 detik (24 bar @ 128 BPM), Bumper Ad 7,5 detik, dan Logo Sting 3 detik.
* **Bilingual Penuh**: Bahasa Indonesia dan Inggris (`--lang id|en`).
* **3D Sinematik**: Depth of field (rack focus), pantulan lantai, bloom hanya untuk biru, grain & vignette; engine diadaptasi dari pdoom-video (MIT).
* **Motion Blur Adaptif**: 4–36 sub-frame per frame dirata-rata dalam *linear light*, sebanyak yang dibutuhkan geraknya (shutter 180°).
* **Audio Engineering Broadcast-Grade**: 3 stem terpisah (`score.wav`, `score_music.wav`, `sfx.wav`) dengan standar loudness EBU R128 ($-14\text{ LUFS}$) dan *dynamic spatial stereo panning* mengikuti posisi panah di layar.
* **Integrasi Konversi Langsung**: Tombol WhatsApp resmi + QR code dinamis yang langsung membuka chat WhatsApp pre-filled.
* **In-Browser Review Player**: Player internal dengan playback audio sinkron, scrub timeline per frame, dan shortcut keyboard (`Space`, `←/→`).

### 2. Evolusi Layar (`evolusi-layar/`)
Video edukasi vertikal 1080×1920 @ 60 FPS, 56,6 detik bertempo dinamis untuk TikTok & Instagram Reels:
* **100% Procedural Canvas2D**: Seluruh elemen grafis di-generate murni dari kode tanpa menggunakan rekaman video (footage) atau gambar raster eksternal.
* **Representasi 6 Era Web**: Menampilkan evolusi website "Kopi Pagi" dari era 1991 (Terminal teks hijau / VT323), 1998 (HTML tabel klasik / Comic Neue), 2002 (Flash era & Orbitron), 2007 (Web 2.0 glossy / Nunito), 2015 (Flat design / Montserrat), hingga 2023 (Modern dark mode & Inter Tight).
* **Adaptive Sub-Frame Motion Blur**: Menggunakan algoritma cerdas (3 sample pada kondisi tenang dan 8–10 sample pada transisi cepat / whip cut) untuk efisiensi render maksimal.
* **Otomasi Voice-Over & Audio Ducking**: Sistem timeline otomatis memotong hening awal/akhir VO, melebarkan durasi scene jika kalimat narator lebih panjang, serta melakukan *audio ducking* pada musik latar ($-11\text{ dB}$) dan efek suara ($-5\text{ dB}$) saat narator berbicara.
* **Sintesis Audio Prosedural**: Soundtrack 100% disintesis oleh kode (polyBLEP, SVF, FM synth, Karplus-Strong) tanpa ketergantungan musik eksternal.
* **Parallel Headless Rendering**: Dukungan rendering multi-browser secara paralel (`--jobs N`) yang digabung *lossless* oleh FFmpeg.

### 3. Celestial Scrolls (`celestial-scrolls/`)
Animasi kinetik sinematik 30,0 detik (1920×1080 @ 60 FPS) bertema Xianxia & Fantasi:
* **100% Self-Contained**: Semua aset (4 web font base64, audio MP3, efek partikel, stiker, dan script) tertanam langsung dalam 1 file HTML tunggal (~1,2 MB).
* **Arsitektur Rendering 5-Layer**: Memadukan efisiensi Canvas 2D untuk simulasi partikel kosmik/nebula dan CSS 3D Hardware-Accelerated DOM untuk ketajaman teks sub-piksel:
  1. *Background Canvas*: 1.100 bintang 3D berkedip + 4 lapisan nebula harmonik.
  2. *Camera World*: 3D screen shake responsif terhadap dentuman musik.
  3. *DOM Scenes Layer*: Animasi teks kinetik 3D, kartu UI, dan elemen SVG.
  4. *Foreground FX Canvas*: Anamorphic flares, glow bloom, dan efek konfeti.
  5. *Post-Processing*: Screen flash overlay & procedural 24 FPS film grain.
* **Chrome DevTools Protocol (CDP) Rendering**: Deterministic frame capture langsung melalui antarmuka CDP Chrome Headless untuk memastikan setiap frame sinkron sempurna dengan audio.

### 4. Satu Frame (`satu-frame/`)
Video edukasi vertikal 1080×1920 @ 60 FPS, 75 detik (40 bar @ 128 BPM). Seluruh video adalah **satu kali layar HP menyegarkan gambar** (16,667 ms) yang diperlambat ribuan sampai miliaran kali. Selama satu frame itu, permintaan dari HP pulang-pergi ke server di Singapura: layar → chip → hujan beku → menara → kabel di bawah jalan → dasar Laut Jawa → serat kaca → prosesor → orbit → pulang → satu foton ke mata.
* **Satu Kamera, Tanpa Cut**: Melintasi sepuluh orde besaran dengan serah terima di dalam gerak (menembus kaca, celah antena, air, awan, atap), lalu kembali ke frame 0 sebagai loop mulus.
* **Jam Fisik yang Jujur**: HUD menampilkan milidetik nyata dan laju perlambatan. Angka fisikanya tepat: radio 300 m/s, jam prosesor 3 GHz ÷ 1.406.250.000 = 128 BPM (ketukan musik = jam prosesor), foton 30 cm = 1 ns.
* **Dunia per Skala**: Layar (piksel), papan sirkuit (mm), kota (m), dasar laut (m), serat (µm), prosesor (mm), Bumi (km), masing-masing dalam satuannya sendiri.
* **Data Asli**: Lampu malam NASA Black Marble dan garis pantai Natural Earth; rute kabel 996 km dicek tidak melewati daratan.
* **Kota Malam Hujan Termotivasi**: Setiap cahaya punya sumber (langit mendung berpendar, lampu jalan, pantulan jalan basah planar), kampung Jakarta dengan kabel listrik antartiang, toren, dan parabola yang diarahkan ke satelit sungguhan, serta satu tetes hujan beku yang menjadi lensa (kota terbalik di dalamnya).
* **Motion Blur Adaptif**: 4–108 sub-frame per frame; setiap frame = f(t), deterministik piksel per piksel.
* **Audio 100% Sintetis**: Bus jam, musik, dan SFX; musik ter-*tape-stop* persis mengikuti ramp jam fisik; EBU R128 ($-14\text{ LUFS}$).
* **Renderer Aman**: Hasil render tidak pernah menimpa file lama (nama bertanggal) dan progress per frame tampil di terminal (bab, sub-frame, sisa waktu, jam selesai).

### 5. Harusnya Diam (`harusnya-diam/`)
Showreel skill motion design Beyond Studio, 1080×1920 @ 60 FPS, 60 detik (32 bar @ 128 BPM). Titik di ujung "HALAMAN INI HARUSNYA DIAM." robek lepas dan memicu reaksi berantai di papan gambar penuh cetakan risograf; setiap stasiun memamerkan satu skill:
* **Stop-motion 12 fps yang presisi**: setiap cue menjadi jangkar langkah, jadi hentakan tetap jatuh di ketukan. Hanya pesawat kertas (brand-mu) dan closing yang 60 fps.
* **Riso dihitung, bukan gambar**: setiap cetakan di-halftone per piksel (sudut layar per tinta, misregistrasi, drum mottling, serat kertas + relief cahaya menyapu).
* **Droste dive**: menyelam ke satu dot halftone; di dalamnya seluruh gambar dicetak ulang dengan tinta berikutnya sampai dither Bayer 1-bit.
* **Kinetic type font variabel**: Anybody wdth 50–150 × wght 100–900 (kerning asli, huruf "tercetak" per langkah).
* **Infografis audio-reaktif jujur**: batang pop-up = energi 8 pita dari musik film ini sendiri.
* **Lipatan origami 3D** per verteks dan sobekan papan; closing mengikuti end card legacy (WhatsApp CTA).

---

## 🛠️ Prasyarat Lingkungan

Pastikan perangkat Anda telah terpasang:
* **Python 3.10+**
* **Node.js 22.6+** (disarankan 24; renderer Beyond Studio menjalankan `.ts` langsung)
* **Google Chrome** (render headless Beyond Studio)
* **FFmpeg** (dengan pustaka `libx264`) sudah terdaftar di `PATH` sistem

### Instalasi Dependensi

#### Untuk Beyond Studio (Node.js + Google Chrome)
```bash
cd beyond-studio/app
npm install
cd ../..
pip install numpy scipy segno   # hanya untuk membuat ulang audio / QR
```

#### Untuk Satu Frame (Node.js + Google Chrome)
```bash
cd satu-frame/app
npm install
cd ../..
pip install numpy scipy pillow   # hanya untuk membuat ulang audio / data Bumi
```

#### Untuk Evolusi Layar (Node.js)
```bash
cd evolusi-layar
npm install
npx playwright install chromium
cd ..
```

---

## 🎥 Panduan Cepat Menjalankan & Render

### 1. Beyond Studio (`beyond-studio/`)
| Kebutuhan | Perintah | Keterangan |
|---|---|---|
| **Preview Browser** | `cd beyond-studio/app && npx vite` → `http://localhost:5173/?fmt=v&lang=id` | Player interaktif dengan timeline bab & audio |
| **9:16 ID (Final, TikTok)** | `node scripts/render.ts video --fmt v --lang id --samples auto` | Output: `beyond-studio/out/beyond-studio-45s-id-vertical.mp4` |
| **16:9 ID (Final)** | `node scripts/render.ts video --fmt h --lang id --samples auto` | Output: `beyond-studio/out/beyond-studio-45s-id.mp4` |
| **Draft Cepat** | tambahkan `--samples 1 --preset veryfast` | Tanpa motion blur (±5 menit) |
| **Bumper 7,5 Detik / Sting 3 Detik** | tambahkan `--cut bumper` / `--cut sting` | Output: `beyond-studio-bumper-…` / `beyond-studio-sting-…` |

### 2. Evolusi Layar (`evolusi-layar/`)
| Kebutuhan | Perintah | Keterangan |
|---|---|---|
| **Preview Browser** | `npm run preview` | Buka `http://localhost:5173/` dengan live synth audio |
| **Render Final (Parallel)** | `node render.mjs video --jobs 4` | Render 4 browser paralel + adaptive motion blur |
| **Render Draft Cepat** | `npm run render:draft` | Tanpa motion blur untuk evaluasi timing |
| **Sintesis Audio Saja** | `npm run audio` | Output: `out/evolusi-layar.wav` |
| **Validasi Voice Over** | `npm run vo` | Analisis durasi & alignment naskah VO |
| **Contact Sheet Visual** | `npm run stills` | Ekspor still frame resolusi penuh ke `out/stills/` |

### 3. Celestial Scrolls (`celestial-scrolls/`)
| Kebutuhan | Perintah | Keterangan |
|---|---|---|
| **Preview Langsung** | Buka `celestial-scrolls-film.html` di browser | Pemutaran interaktif 60 FPS di layar monitor |
| **Render MP4 60 FPS** | `node render_to_video.js` | Headless Chrome CDP frame capture + FFmpeg muxing |

### 4. Satu Frame (`satu-frame/`)
Jalankan dari `satu-frame/app`:

| Kebutuhan | Perintah | Keterangan |
|---|---|---|
| **Preview Browser** | `npx vite` → `http://localhost:5173/?t=40` | Player dengan audio sinkron; `[`/`]` pindah bab, `L` loop bab |
| **Render Final** | `node scripts/render.ts video --samples auto` | Output: `satu-frame/out/satu-frame-75s_<tanggal>_<jam>_final.mp4` (tidak menimpa) |
| **Draft Cepat** | `node scripts/render.ts video --samples 1 --preset veryfast` | Tanpa motion blur; `--from 24 --to 38` untuk sebagian |
| **Still / Contact Sheet** | `node scripts/render.ts stills --t 15,30.5` / `sheet --n 48` | Ke `satu-frame/out/stills/` / `out/sheet.png` |
| **Cek Loop** | `node scripts/render.ts loop` | Frame terakhir + frame 0 berdampingan |
| **Sintesis Audio** | `cd .. && python audio.py` | Jalankan ulang setiap `cues.json` berubah |

### 5. Harusnya Diam (`harusnya-diam/`)
Jalankan dari `harusnya-diam/app` (sekali: `npm install`):

| Kebutuhan | Perintah | Keterangan |
|---|---|---|
| **Preview Browser** | `npx vite` → `http://localhost:5173/?t=27.5` | Player dengan audio; `[`/`]` pindah bab, `L` loop bab |
| **Render Final** | `node scripts/render.ts video --samples auto` | `harusnya-diam/out/harusnya-diam-60s_<tanggal>_<jam>_final.mp4` (tidak menimpa) |
| **Draft Cepat** | `node scripts/render.ts video --samples 1 --preset veryfast` | Tanpa motion blur |
| **Still / Contact Sheet** | `node scripts/render.ts stills --t 0,6.1` / `sheet --n 60` | Ke `harusnya-diam/out/` |
| **Sintesis Audio** | `cd .. && python audio.py` | Jalankan ulang setiap `cues.json` berubah |

---

## 📖 Indeks Dokumentasi Teknis

Pelajari panduan teknis mendalam pada masing-masing sub-proyek:

* **Beyond Studio**:
  * [beyond-studio/README.md](beyond-studio/README.md): Dokumentasi lengkap preview, opsi render, audio DSP, dan end card CTA WhatsApp.
  * [beyond-studio/TREATMENT.md](beyond-studio/TREATMENT.md): Konsep "studio gelap", tone, dan storyboard per scene (9:16 & 16:9).
  * [beyond-studio/MOTION-GUIDE.md](beyond-studio/MOTION-GUIDE.md): Pedoman motion brand Beyond Studio (aturan kurva easing, tempo 128 BPM, safe zones 9:16, hierarki tipografi).

* **Evolusi Layar**:
  * [evolusi-layar/README.md](evolusi-layar/README.md): Panduan lengkap arsitektur Canvas2D, sintesis polyBLEP/FM, dan sistem otomatisasi VO.
  * [evolusi-layar/STORYBOARD.md](evolusi-layar/STORYBOARD.md): Breakdown konsep visual, shot list, dan rincian durasi per era (1991–2023).
  * [evolusi-layar/ANIMATION_GUIDE.md](evolusi-layar/ANIMATION_GUIDE.md): Spesifikasi panduan animasi, kurva easing, transisi, dan motion design.
  * [evolusi-layar/VOSCRIPT.md](evolusi-layar/VOSCRIPT.md): Naskah narasumber voice over beserta tanda baca & arahan intonasi per adegan.

* **Celestial Scrolls**:
  * [celestial-scrolls/ANALISIS_CELESTIAL_SCROLLS_FILM.md](celestial-scrolls/ANALISIS_CELESTIAL_SCROLLS_FILM.md): Bedah komprehensif arsitektur rendering 5-layer, matematika animasi kinetik, dan pipeline CDP video rendering.

* **Satu Frame**:
  * [satu-frame/README.md](satu-frame/README.md): Preview, opsi render (tidak menimpa, progress), audio, data Bumi, dan struktur kode.
* **Harusnya Diam**:
  * [harusnya-diam/README.md](harusnya-diam/README.md): Preview, render, audio, struktur kode.
  * [harusnya-diam/TREATMENT.md](harusnya-diam/TREATMENT.md): Konsep, trend yang ditegakkan, storyboard S1–S9, audio, closing.
  * [satu-frame/TREATMENT.md](satu-frame/TREATMENT.md): Konsep satu frame, jam fisik per bab, storyboard S1–S10, dan catatan fakta beserta penyederhanaan yang disadari.
