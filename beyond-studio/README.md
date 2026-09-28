# Beyond Studio — Motion Promo 30 detik (1920×1080, 60fps)

Satu film dalam dua bahasa dan dua format, plus dua potongan pendek. Semua flag bisa digabung.

| Output | Perintah | File hasil |
|---|---|---|
| 16:9 Inggris | `python render.py` | `beyond-studio-30s.mp4` |
| 16:9 Indonesia | `python render.py --id` | `beyond-studio-30s-id.mp4` |
| 9:16 vertikal (Reels/TikTok/Shorts) | `python render.py --v` | `beyond-studio-30s-vertical.mp4` |
| 9:16 Indonesia | `python render.py --id --v` | `beyond-studio-30s-id-vertical.mp4` |
| Logo sting 3 s | `python render.py --cut sting` | `beyond-studio-sting.mp4` |
| Bumper 6,5 s | `python render.py --cut bumper` | `beyond-studio-bumper.mp4` |

Contoh gabungan: `python render.py --cut bumper --id --v` → `beyond-studio-bumper-id-vertical.mp4`.

**Preview dengan suara:** buka `site/index.html` (atau `index-id.html`, `index-v.html`, `index-id-v.html`) di Chrome. Ada player review: tombol play, timeline yang bisa digeser, Spasi untuk play/pause, ←/→ maju-mundur 1 frame, Shift+←/→ 1 detik. Musik ikut diputar sinkron.

## Kebutuhan
Python 3.10+, ffmpeg di PATH, lalu:
```
pip install playwright numpy scipy pillow
pip install segno        # opsional, hanya untuk membuat ulang QR WhatsApp
python -m playwright install chromium
```

## Render
```
python render.py          # Inggris
python render.py --id     # Indonesia
```
Default-nya memakai **motion blur sub-frame**: setiap frame dirender 6 kali di titik waktu yang sedikit berbeda lalu dirata-ratakan dalam linear light, persis seperti shutter kamera 180°. Hasilnya jauh lebih sinematik, tapi render sekitar 6× lebih lama (perkiraan 15–30 menit di laptop biasa, tergantung CPU).

| Kebutuhan | Perintah (PowerShell: `$env:MB=1; python render.py`) |
|---|---|
| Draft cepat, tanpa blur | `MB=1 python render.py` (3–6 menit) |
| Final (default) | `python render.py` |
| Paling halus | `MB=12 python render.py` |
| Blur lebih panjang/dramatis | `SHUTTER=270 python render.py` |
| Tepi teks paling halus | `SCALE=2 python render.py` (render 4K lalu diperkecil, ~3× lebih lama lagi) |

Render sebagian (untuk cek satu scene): `python render.py test.mp4 480 660` (angka = nomor frame, detik × 60; tambah `--id` untuk versi Indonesia). Mode ini tanpa audio.

Kalau render terhenti di tengah jalan, file mp4 setengah jadi pasti rusak: jalankan ulang saja. Hasil render selalu identik, jadi bisa juga dipecah per bagian lalu digabung:
```
ffmpeg -f concat -safe 0 -i list.txt -c copy video_noaudio.mp4      # list.txt: satu baris "file 'a.mp4'" per bagian
ffmpeg -i video_noaudio.mp4 -i score.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.0:LRA=11 -c:a aac -b:a 256k -shortest beyond-studio-30s.mp4
```

## Audio
`audio.py` menghasilkan tiga file sekaligus (sudah disertakan, jalankan ulang hanya kalau mengubah suara):
- `score.wav` — mix final yang dipakai `render.py`
- `score_music.wav` — stem musik saja
- `sfx.wav` — stem efek suara saja

Efek suara dikunci ke frame: setiap klik kursor, pendaratan dan lepas landas panah, perubahan UI, sapuan teks, dan wipe punya suaranya sendiri. Posisi stereo whoosh ikut bergerak mengikuti posisi panah di layar. Musik otomatis turun sekitar 3,5 dB saat efek besar berbunyi (ducking). Karena stemnya terpisah, musik bisa diganti dengan lagu berlisensi tanpa kehilangan sound design: mix lagu baru dengan `sfx.wav`, simpan sebagai `score.wav`, lalu render.

## CTA WhatsApp
End card menampilkan tombol WhatsApp **0819-2707-0239** di samping alamat website, plus QR code di pojok kanan bawah (versi 16:9) yang langsung membuka chat `wa.me/6281927070239` dengan pesan pembuka sesuai bahasa. Di versi vertikal, QR disembunyikan (penonton sudah di HP) dan tombol WhatsApp ditumpuk di bawah URL. Nomor, cara penulisan, dan pesan pembuka diatur di `kontak.json`, lalu `python build.py`.

## Kamera & komposisi
Ketiga bab perangkat kini punya bahasa kamera berbeda: bab bisnis memakai dolly-in pelan; bab portofolio dibuka close-up di tombol "See projects" (HP di belakang blur) lalu mundur memperlihatkan semuanya; bab akademik mendorong ke kartu skripsi dan diagnosis sementara browser di belakangnya blur (rack focus). Di gauge diagnosis, panah logo ikut berputar di ujung cincin, jadi cincin + panah = logo. Kamera diatur di array `CAM` di `engine.js`.

## Panah sebagai benang merah
Panah dari logo menjadi "karakter" yang memandu seluruh film:

| Waktu (detik) | Yang dilakukan panah |
|---|---|
| 0–3,75 | Terbang masuk, mengunci ke cincin logo, lalu meluncur menembus wordmark |
| 5,8–6,5 | Naik dari bawah dan menembus "Launched." / "Diluncurkan."; huruf terlontar dari tengah ke luar |
| 7,5–8,55 | Naik bersama perangkat, lalu mendarat di layar laptop dan berubah menjadi kursor |
| 8,55–10,7 | Kursor memilih ukuran M, menambah jumlah jadi 2, klik "Tambah ke keranjang" bersamaan dengan tap di HP |
| 10,7–12,05 | Lepas landas ke atas menarik bab berikutnya, lalu mendarat di browser portofolio |
| 12,05–14,5 | Klik "See projects", halaman meluncur ke studi kasus Celestial Scrolls (HP ikut scroll) |
| 14,5–15,55 | Pindah ke SIMALA |
| 15,55–18 | Klik "Jelajahi"; progres skripsi dan gauge diagnosis bereaksi |
| 18–19,2 | Pindah ke situs demo Nexora |
| 19,2–22 | Kursor mengikuti tombol "Get started" / "Mulai sekarang" selama layout berubah desktop → HP, lalu klik → ledakan biru |
| 25,95 | Wipe berbentuk mata panah raksasa dengan tepi bercahaya |
| 26,7 | Panah terbang masuk dan mengunci lagi ke logo di layar penutup |

Serah-terima antara panah pemandu dan kursor dihitung per frame dari posisi kursor yang sebenarnya, jadi tidak ada lompatan.

## Isi folder
- `site/template.html` — markup + CSS (teks Inggris); `site/engine.js` — seluruh animasi
- `site/index.html`, `site/index-id.html` — hasil build (jangan diedit langsung)
- `teks-id.json` — terjemahan Indonesia (kiri: teks asli di template, kanan: teks Indonesia) + penyesuaian CSS di `_css`
- `build.py` — jalankan setelah mengedit `template.html` atau `teks-id.json`
- `render.py`, `preview.py` (ambil still: `python preview.py 8.9,12.66 [prefix] [--id] [--v]`), `audio.py`
- `kontak.json` — nomor & pesan WhatsApp untuk end card dan QR
- `MOTION-GUIDE.md` — panduan motion brand (easing, durasi, aturan logo & panah, suara, format, area aman 9:16)
- `site/assets/`, `site/fonts/`, `icons/` — screenshot asli, font Inter Tight, ikon Lucide

## Mengedit
- **Jalur kursor dan klik:** objek `CUR` di `engine.js`. Koordinat memakai piksel screenshot asli (1240 px lebar); klik diletakkan di ketukan musik (grid 128 BPM, kelipatan 0,46875 detik dari 7,5).
- **Jalur terbang panah:** array `GS` di `engine.js`.
- **Efek suara:** bagian "new SFX" di `audio.py`. Kalau mengubah waktu klik di `engine.js`, ubah juga di sini.
- **Teks:** `site/template.html` untuk versi Inggris, `teks-id.json` untuk versi Indonesia, lalu `python build.py`.

Catatan: angka omzet, hasil diagnosis, dan situs Nexora adalah ilustrasi tampilan, bukan data klien. Ganti dengan data yang disetujui klien sebelum dipublikasikan.
