# HTML Motion Graphics 🎬

Koleksi proyek **programmatic motion graphics** berbasis web (HTML5, Vanilla CSS, Canvas, deterministik JavaScript, dan audio DSP sintetis) yang di-render secara *headless* menjadi video broadcast-grade 60 FPS menggunakan Chromium dan FFmpeg.

---

## 📂 Struktur Proyek

```text
HTML-motion-graphics/
├── beyond-studio/                       # Suite Promosi Komersial Beyond Studio (v4)
│   ├── site/                            # Animasi web (16:9, 9:16 Vertikal, player review)
│   ├── audio.py                         # Synthesizer audio DSP 48kHz (SciPy/NumPy)
│   ├── render.py                        # Headless render engine dengan sub-frame motion blur 180°
│   ├── kontak.json                      # Konfigurasi nomor WhatsApp & QR code otomatis
│   └── MOTION-GUIDE.md                  # Panduan standar motion brand resmi
│
├── celestial-scrolls/                   # Motion Promo Film Celestial Scrolls
│   ├── celestial-scrolls-film.html      # Self-contained canvas & DOM motion film
│   └── render_to_video.js               # CDP headless Chrome video renderer
│
├── legacy/                              # Arsip Sejarah & Evolusi Proyek
│   ├── beyond-studio-film/              # Versi Awal Web Standalone (Node.js)
│   ├── beyond-studio-motion-v1/         # Versi Fondasi Pipeline Python
│   ├── beyond-studio-motion-id/         # Versi v1 Bahasa Indonesia
│   └── beyond-studio-motion-v3/         # Versi Karakter Panah & Subframe Blur
│
├── KOMPARASI_EMPAT_VERSI_BEYOND_STUDIO.md  # Analisis mendalam 10 dimensi rekayasa 4 versi
└── .gitignore                           # Proteksi dari file biner video besar (>100MB)
```

---

## 🚀 Fitur Unggulan

### 1. Beyond Studio (`beyond-studio/`)
Suite video promosi agensi siap tayang untuk kampanye pemasaran multi-kanal:
* **Multi-Format**: 16:9 Horizontal (YouTube/Web) dan 9:16 Vertikal (Instagram Reels, TikTok, Shorts).
* **Multi-Durasi**: Full 30 detik, Bumper Ad 6,5 detik, dan Logo Sting 3 detik.
* **Bilingual Penuh**: Pilihan bahasa Inggris dan bahasa Indonesia (`--id`).
* **Sub-Frame Motion Blur Optik**: Setiap frame di-render 6× pada pecahan waktu mikro berbeda lalu digabung dalam *linear light space*, menyimulasikan shutter kamera film 180°.
* **Audio Engineering Broadcast-Grade**: 3 stem terpisah (`score.wav`, `score_music.wav`, `sfx.wav`) dengan standar loudness EBU R128 ($-14\text{ LUFS}$) dan *dynamic spatial stereo panning* mengikuti posisi panah di layar.
* **Integrasi Konversi Langsung**: Tombol WhatsApp resmi + QR code dinamis yang langsung membuka chat WhatsApp pre-filled.
* **In-Browser Review Player**: Player internal dengan playback audio sinkron, scrub timeline per frame, dan shortcut keyboard (`Space`, `←/→`).

### 2. Celestial Scrolls (`celestial-scrolls/`)
Animasi sinematik interaktif untuk showcase aplikasi web Celestial Scrolls dengan rendering frame deterministik.

---

## 🛠️ Persyaratan Lingkungan

* Python 3.10+
* Node.js 18+
* FFmpeg terpasang di PATH sistem

Instalasi dependensi Python untuk Beyond Studio:
```bash
pip install playwright numpy scipy pillow segno
python -m playwright install chromium
```

---

## 🎥 Perintah Render Praktis (Beyond Studio)

Masuk ke folder `beyond-studio/`:
```bash
cd beyond-studio
```

| Output Video | Perintah | File Hasil |
|---|---|---|
| **16:9 Indonesia (Final)** | `python render.py --id` | `beyond-studio-30s-id.mp4` |
| **16:9 Indonesia (Draft Cepat)** | `MB=1 python render.py --id` | `beyond-studio-30s-id.mp4` |
| **9:16 Vertikal Reels/TikTok (ID)** | `python render.py --id --v` | `beyond-studio-30s-id-vertical.mp4` |
| **Bumper Ad 6,5 Detik (YouTube)** | `python render.py --cut bumper --id` | `beyond-studio-bumper-id.mp4` |
| **Logo Sting 3 Detik (Intro Video)** | `python render.py --cut sting` | `beyond-studio-sting.mp4` |

---

## 📖 Dokumentasi Teknis

* **[KOMPARASI_EMPAT_VERSI_BEYOND_STUDIO.md](KOMPARASI_EMPAT_VERSI_BEYOND_STUDIO.md)**: Analisis komparatif lengkap evolusi arsitektur dan rekayasa motion graphics dari versi 1 hingga versi 4.
* **[beyond-studio/MOTION-GUIDE.md](beyond-studio/MOTION-GUIDE.md)**: Panduan resmi motion brand Beyond Studio (aturan easing, tempo 128 BPM, safe zones 9:16, hierarki tipografi).
