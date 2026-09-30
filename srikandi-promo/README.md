# Srikandi Tailor — Video Promosi (9:16)

Video motion-graphics 38,4 detik untuk Reels / TikTok / Shorts, dibuat dengan
[Remotion](https://www.remotion.dev) (video yang ditulis sebagai kode React).
Resolusi **1080 × 1920**, **30 fps**, teks Bahasa Indonesia, musik & efek suara sudah sinkron.

---

## Cara render (± 5 menit pertama kali)

**Yang dibutuhkan:** [Node.js](https://nodejs.org) versi 18 atau lebih baru (pilih "LTS").

1. Ekstrak zip ini, lalu buka Terminal / Command Prompt **di dalam folder ini**.
2. Pasang dependensi (sekali saja):
   ```bash
   npm install
   ```
3. Render video:
   ```bash
   npm run render
   ```
   Hasilnya ada di **`out/srikandi-tailor-promo.mp4`**.
   Saat render pertama, Remotion otomatis mengunduh Chrome Headless (±100 MB).

### Pilihan render lain

| Perintah | Hasil |
|---|---|
| `npm run render` | MP4 H.264, kualitas tinggi (CRF 16) — pas untuk upload |
| `npm run render:hq` | Kualitas maksimum (CRF 12, audio 320 kbps), file lebih besar |
| `npm run render:tanpa-musik` | Hanya efek suara — pakai ini kalau mau menambah lagu trending langsung di TikTok/IG |
| `npm run still` | Gambar PNG dari frame akhir (untuk cover/thumbnail) |
| `npm run dev` | Buka **Remotion Studio** di browser untuk menonton & mengedit sebelum render |

> Kalau komputer terasa berat saat render, buka `remotion.config.ts` dan aktifkan
> `Config.setConcurrency(2);`

---

## Alur video (100 BPM — setiap potongan jatuh di ketukan)

| Waktu | Adegan | Isi |
|---|---|---|
| 00:00 | Hook | *"Baju yang pas — bukan kebetulan."* Benang emas + jarum menjahit garis bawah, pita meteran melintas |
| 00:02.4 | Ritme kata | **Diukur.** (garis dimensi) → **Dipotong.** (huruf terbelah) → **Dijahit.** (jahitan putus-putus) → *Khusus untukmu.* |
| 00:04.8 | Montase detail | 6 kartu foto "dibagikan" tiap ketukan: Renda, Batik, Manik, Kerah, Potongan, Peplum |
| 00:09.6 | Logo | Kartu terakhir menjadi lingkaran → gong → logo Srikandi muncul, "Dijahit pas, tampil anggun." |
| 00:13.2 | Koleksi | Logo "digunting" di tengah. *Satu model, banyak cerita* — slider mint → sage berpayet, stiker Pilih warna / renda / payet. Lalu gaun batik: *Dari kebaya hingga gaun pesta.* |
| 00:20.4 | Kenapa Srikandi | 01 Pas di badan · 02 Jahitan rapi · 03 Bahan berkualitas |
| 00:26.4 | Layanan | Kebaya custom · Gaun pesta · Seragam · Permak pakaian + pita berjalan (wisuda, lamaran, pernikahan…) |
| 00:30.8 | Ajakan | Logo, *"Wujudkan busana impianmu."*, tombol WhatsApp **+62 823-1310-1314**, alamat — ditahan ±7 detik |

**Arah visual:** indigo malam + biru Srikandi (diambil langsung dari logo) + gading + benang emas.
Tipografi Cormorant Garamond (serif elegan) dan Plus Jakarta Sans (sans karya studio Indonesia).
Motif batik **kawung** sangat samar sebagai tekstur, grain film halus, dan motif
alat jahit (jarum, benang, pita meteran, garis jahitan) sebagai "benang merah" transisi.

**Audio:** musik bernuansa gamelan (bonang/saron dengan *ombak*, gong ageng, kendang)
di atas groove modern, plus whoosh, riser, dan "pop" yang pas dengan animasi.
Semua disintesis dari nol — tidak ada lagu/sampel berhak cipta.

---

## Mengubah isi

Semua teks ada di file adegan dalam `src/scenes/` — cari kalimatnya lalu ganti.

| Mau mengubah… | File |
|---|---|
| Nomor WhatsApp, alamat | `src/theme.ts` → `BRAND` |
| Warna | `src/theme.ts` → `C` |
| Kalimat pembuka | `src/scenes/Hook.tsx` |
| Label kartu detail & area crop foto | `src/scenes/Details.tsx` → `CARDS` |
| Tiga keunggulan | `src/scenes/Why.tsx` → `POINTS` |
| Daftar layanan & pita acara | `src/scenes/Services.tsx` |
| Ganti foto | timpa file di `public/img/` dengan nama yang sama (rasio 3:4) |
| Ganti musik | timpa `public/audio/musik.wav` — pakai lagu ±100 BPM agar potongan tetap di ketukan |
| Atur ulang musik/SFX buatan | `python3 tools/generate_audio.py` (butuh numpy + scipy) |

**Catatan aset:**
- Logo sudah dibersihkan dari watermark percetakan pada file aslinya dan diubah jadi vektor
  (`src/logoPaths.ts`, juga tersedia sebagai `public/img/logo-face.svg` & `logo-wordmark.svg`)
  — tetap tajam di ukuran berapa pun, bisa dipakai ulang untuk kebutuhan lain.
- Foto produk di `public/img/` diperbesar 2× dengan penajaman ringan agar tetap tajam di layar 1080p.

**Area aman:** teks penting berada di antara y≈250 dan y≈1500 sehingga tidak tertutup
tombol/caption TikTok & Reels.

**Lisensi:** Remotion umumnya gratis untuk perorangan dan usaha kecil —
cek syaratnya di [remotion.dev/license](https://www.remotion.dev/license). Font berlisensi SIL OFL (lihat `public/fonts/`).
