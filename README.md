# HTML Motion Graphics 🎬

Koleksi proyek **programmatic motion graphics** berbasis web (HTML5 Canvas, CSS 3D Transforms, deterministik JavaScript, dan sintesis audio DSP) yang di-render secara *headless* menjadi video broadcast-grade 60 FPS menggunakan Chromium (Playwright & Chrome DevTools Protocol) serta FFmpeg.

---

## 📂 Struktur Proyek

```text
Motion-Grapich-Code/
├── beyond-studio/                       # Suite Promosi Komersial Beyond Studio (Python/Playwright)
│   ├── site/                            # Animasi web (16:9, 9:16 Vertikal, player review)
│   ├── audio.py                         # Synthesizer audio DSP 48kHz (SciPy/NumPy)
│   ├── render.py                        # Headless render engine dengan sub-frame motion blur 180°
│   ├── build.py                         # Builder konfigurasi QR & kontak
│   ├── kontak.json                      # Konfigurasi nomor WhatsApp & QR code otomatis
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
├── .gitignore                           # Proteksi dari file biner video/audio besar & cache
└── README.md                            # Dokumentasi induk repositori
```

---

## 🚀 Fitur Unggulan Proyek

### 1. Beyond Studio (`beyond-studio/`)
Suite video promosi agensi siap tayang untuk kampanye pemasaran multi-kanal:
* **Multi-Format & Rasio**: 16:9 Horizontal (YouTube/Web) dan 9:16 Vertikal (Instagram Reels, TikTok, YouTube Shorts).
* **Multi-Durasi**: Full Cut 30 detik, Bumper Ad 6,5 detik, dan Logo Sting 3 detik.
* **Bilingual Penuh**: Pilihan bahasa Inggris dan bahasa Indonesia (`--id`).
* **Sub-Frame Motion Blur Optik**: Setiap frame di-render 6× pada pecahan waktu mikro berbeda lalu digabung dalam *linear light space*, menyimulasikan shutter kamera film 180°.
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

---

## 🛠️ Prasyarat Lingkungan

Pastikan perangkat Anda telah terpasang:
* **Python 3.10+**
* **Node.js 18+**
* **FFmpeg** (dengan pustaka `libx264`) sudah terdaftar di `PATH` sistem

### Instalasi Dependensi

#### Untuk Beyond Studio (Python)
```bash
cd beyond-studio
pip install playwright numpy scipy pillow segno
python -m playwright install chromium
cd ..
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
| **Preview Browser** | Buka `site/index.html` di Google Chrome | Review player interaktif dengan timeline & audio |
| **16:9 ID (Final)** | `python render.py --id` | Output: `beyond-studio-30s-id.mp4` |
| **16:9 ID (Draft Cepat)** | `MB=1 python render.py --id` *(PowerShell: `$env:MB=1; python render.py --id`)* | Tanpa motion blur (3–6 menit) |
| **9:16 Vertikal (Reels/TikTok)** | `python render.py --id --v` | Output: `beyond-studio-30s-id-vertical.mp4` |
| **Bumper Ad 6,5 Detik** | `python render.py --cut bumper --id` | Output: `beyond-studio-bumper-id.mp4` |
| **Logo Sting 3 Detik** | `python render.py --cut sting` | Output: `beyond-studio-sting.mp4` |

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

---

## 📖 Indeks Dokumentasi Teknis

Pelajari panduan teknis mendalam pada masing-masing sub-proyek:

* **Beyond Studio**:
  * [beyond-studio/README.md](beyond-studio/README.md): Dokumentasi lengkap opsi parameter render, audio DSP, dan end card CTA WhatsApp.
  * [beyond-studio/MOTION-GUIDE.md](beyond-studio/MOTION-GUIDE.md): Pedoman motion brand Beyond Studio (aturan kurva easing, tempo 128 BPM, safe zones 9:16, hierarki tipografi).

* **Evolusi Layar**:
  * [evolusi-layar/README.md](evolusi-layar/README.md): Panduan lengkap arsitektur Canvas2D, sintesis polyBLEP/FM, dan sistem otomatisasi VO.
  * [evolusi-layar/STORYBOARD.md](evolusi-layar/STORYBOARD.md): Breakdown konsep visual, shot list, dan rincian durasi per era (1991–2023).
  * [evolusi-layar/ANIMATION_GUIDE.md](evolusi-layar/ANIMATION_GUIDE.md): Spesifikasi panduan animasi, kurva easing, transisi, dan motion design.
  * [evolusi-layar/VOSCRIPT.md](evolusi-layar/VOSCRIPT.md): Naskah narasumber voice over beserta tanda baca & arahan intonasi per adegan.

* **Celestial Scrolls**:
  * [celestial-scrolls/ANALISIS_CELESTIAL_SCROLLS_FILM.md](celestial-scrolls/ANALISIS_CELESTIAL_SCROLLS_FILM.md): Bedah komprehensif arsitektur rendering 5-layer, matematika animasi kinetik, dan pipeline CDP video rendering.
