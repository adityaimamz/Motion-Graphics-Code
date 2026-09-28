---
name: beyond-video
description: Use when creating or revising (any size, even one scene or one color) a Beyond Studio TikTok / Reels video in this repo (edukasi tech, promosi, motion graphics, konten vertikal 9:16), including when the user gives only a topic or idea ("bikin video tentang ...", "konten baru", "video promo", "ganti scene ...", "percepat hook").
---

# Beyond Video

## Overview
Setiap video Beyond Studio boleh memakai engine dan gaya visual yang berbeda, tapi **tone-nya harus sama**: gerak tegas yang jatuh di ketukan, tenang di antara hentakan, cerdas dan tidak norak, lalu selalu ditutup closing logo + CTA. Brand bible ada di `STYLE.md` (satu folder dengan file ini); baca dulu sebelum menulis apa pun.

Aturan repo (dari `CLAUDE.md`) tetap berlaku: kerja di `master`, jangan render MP4, jangan pernah commit.

## Alur (3 gerbang persetujuan)

1. **Brief.** Tanyakan hanya yang belum diketahui, satu per satu:
   - jenis: edukasi atau promosi;
   - audio: VO rekaman user + musik/SFX sintetis, atau lagu dari luar (user menyediakan file);
   - target durasi.

   Lalu tawarkan 2–3 sudut hook dan tulis naskah lengkapnya (caption/VO per baris, perkiraan detik).
   → **GERBANG 1: naskah disetujui.**
2. **Treatment.** Buat folder `<slug>/` (kebab-case) berisi `TREATMENT.md` dengan bagian wajib berikut, berurutan:
   1. Ide dalam satu paragraf
   2. Tone (turunan dari STYLE.md)
   3. Palet & tipografi (default brand, atau alasan kenapa menyimpang)
   4. Motif/benang merah visual
   5. **Storyboard**, satu blok per scene:
      - id + jendela waktu;
      - teks/VO;
      - frame kunci: komposisi dan posisi elemen di layar 9:16 (atas/tengah/bawah, ukuran, warna);
      - gerak/kamera;
      - transisi keluar;
      - SFX.
   6. Audio: mode, sumber waktu, daftar SFX
   7. Engine & alasannya
   8. Closing + CTA

   → **GERBANG 2: treatment disetujui.**
3. **Engine.** Pilih yang paling cocok dengan treatment, lalu *salin* pola dari proyek yang paling dekat:
   - `evolusi-layar/`: Canvas2D, VO elastis, audio sintetis, render paralel;
   - `beyond-studio/`: three.js 3D (studio, perangkat dengan layar Canvas2D, DOF, motion blur adaptif), Node + Chrome headless, `cues.json` dibaca gambar & `audio.py`;
   - `celestial-scrolls/`: satu file HTML;
   - `pdoom-video-main/`: three.js, timeline dari analisis lagu, motion blur adaptif.

   Jangan mengimpor lintas folder: setiap video berdiri sendiri. Presentasikan struktur file singkat di chat.
   → **GERBANG 3: struktur disetujui**, baru mulai coding.
4. **Bangun.** Urutannya:
   1. timeline (satu sumber waktu untuk gambar dan suara);
   2. scene satu per modul;
   3. closing;
   4. audio;
   5. `<slug>/README.md` berisi perintah preview, render draft, render final, dan file audio/VO yang harus user siapkan.
5. **Cek sendiri.** Jalankan preview, ekspor still per scene + closing ke `<slug>/out/`, lalu *lihat gambarnya*. Cocokkan dengan checklist "Siap render" di STYLE.md. Perbaiki sampai lolos.
6. **Serah terima**, dengan format persis seperti di bawah.

## Jalur revisi (video yang sudah ada)
Revisi apa pun, termasuk yang kecil, tidak langsung diedit.
1. Baca `TREATMENT.md` dan kode scene yang terdampak.
2. Ajukan di chat:
   - apa yang diubah;
   - scene/detik yang terdampak;
   - efek berantai ke timeline, audio/VO, dan closing;
   - bagian `TREATMENT.md` yang ikut berubah.

   → **GERBANG: revisi disetujui.**
3. Edit, perbarui `TREATMENT.md`, lalu jalankan langkah 5–6 (cek sendiri + serah terima).

## Format serah terima

````markdown
## Siap render: <judul>
- Preview: `<perintah>`
- Render draft / final: `<perintah>` / `<perintah>` → `<file output>`
- Perlu kamu siapkan: <file VO/lagu + lokasinya, atau "tidak ada">
- Sudah dicek: <still yang dilihat + hasil checklist>
- Belum/diketahui kurang: <daftar, atau "tidak ada">

### Commit message
```text
feat(<slug>): <ringkasan ≤ 60 karakter>

- <perubahan utama>
- <perubahan utama>

Co-Authored-By: Claude <noreply@anthropic.com>
```
````

Untuk revisi, gunakan `fix(<slug>)` atau `refactor(<slug>)`; untuk perubahan skill/aturan, gunakan `docs(workflow)`.

## Kesalahan umum
| Salah | Benar |
|---|---|
| Langsung coding dari topik | Naskah dulu, lalu treatment + storyboard (gerbang 1–2) |
| "Cuma revisi kecil, langsung edit saja" | Ajukan revisi dulu (jalur revisi), edit setelah disetujui |
| Waktu scene ditulis di dalam scene | Semua waktu dibaca dari timeline |
| `Math.random()` / `Date.now()` / rAF sebagai jam | `hash(i, seed)`, frame = f(t) |
| Closing dibuat ulang "kreatif" | Geometri & urutan closing mengikuti STYLE.md |
| Render MP4 untuk "memastikan" | Still PNG saja; MP4 urusan user |
| `git commit` di akhir | Tulis commit message, lalu berhenti |
