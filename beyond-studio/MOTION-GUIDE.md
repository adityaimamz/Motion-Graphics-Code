# Beyond Studio — Panduan Motion

Aturan ini dipakai di video promo 30 detik dan sebaiknya diikuti di semua konten Beyond Studio berikutnya (reels, intro YouTube, presentasi), supaya gerak brand terasa konsisten.

## 1. Prinsip
- **Satu karakter, satu arah.** Panah dari logo adalah "karakter" brand. Ia selalu bergerak ke depan (kanan) atau ke atas, tidak pernah mundur. Panah membuka, memimpin, dan menutup; elemen lain mengikutinya.
- **Karya nyata, bukan ilustrasi generik.** Tampilkan website klien yang benar-benar dibuat. Tanpa gambar AI, tanpa kode/terminal.
- **Gerak punya sebab.** Setiap perubahan UI dipicu sesuatu (klik kursor, tap, ketukan musik). Tidak ada elemen yang bergerak sendiri tanpa alasan.
- **Tenang di antara hentakan.** Momen besar (logo mengunci, klik, ledakan biru) diberi ruang: sebelum dan sesudahnya gerak melambat.

## 2. Easing (sama dengan CSS situs, `app/globals.css`)
| Token | Kurva | Dipakai untuk |
|---|---|---|
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | Elemen masuk, teks naik, kartu muncul |
| `--ease-in-out` | `cubic-bezier(.77,0,.175,1)` | Perpindahan kamera, pergeseran antar-bab, kursor bergerak |
| `--ease-drawer` | `cubic-bezier(.32,.72,0,1)` | Panel/drawer, layout responsif berubah |
| ease-in (kubik) | `t³` | Hanya untuk keluar/lepas landas (panah terbang pergi, huruf terlontar) |
| back / overshoot | overshoot ~1.5 | Tombol & badge "pop", maksimal satu kali per elemen |

Jangan memakai linear untuk gerak elemen (hanya untuk ticker/odometer yang memang mekanis).

## 3. Durasi & ritme
- Tempo musik **128 BPM**: 1 ketukan = 0,469 s, 1 bar = 1,875 s. Klik, tap, dan pergantian kata jatuh di ketukan.
- Teks masuk: 0,55–0,75 s, stagger per huruf 0,02–0,03 s (total stagger satu kata ≤ 0,25 s).
- Teks keluar: 0,2–0,3 s (keluar selalu lebih cepat dari masuk).
- Pop tombol/badge: 0,4–0,5 s. Ripple klik: 0,45–0,5 s.
- Perpindahan kamera/bab: 0,6–0,65 s. Kursor pindah antar-tombol: 0,3–0,35 s.
- Tahan end card minimal 1,2 s sebelum video berakhir.

## 4. Logo
- Urutan tetap: cincin tergambar simetris dari arah jam 9 → panah terbang masuk dari kiri → mengunci di celah kanan tepat di ketukan (gelombang kejut + guncangan kecil) → wordmark naik per huruf.
- Keluar: cincin menarik diri, panah meluncur ke kanan.
- Jangan memutar, memantulkan, atau mengubah proporsi logo. Celah cincin selalu di kanan.

## 5. Panah sebagai karakter
- Bentuk panah selalu bentuk logo (bertakik), dipakai juga sebagai kursor (diputar -120°, isi putih, garis tepi gelap tipis).
- Saat terbang: glow biru + jejak cahaya sepanjang arah gerak. Saat mendarat menjadi kursor: glow memudar, garis tepi muncul.
- Masuk ke layar dari bawah (naik bersama konten), keluar ke atas (menarik bab berikutnya).
- Satu klik per ketukan, maksimal 3 klik per bab.

## 6. Tipografi
- Font: Inter Tight. Kata kunci 120–236 px (16:9), bobot 760–880, tracking −0,045 em.
- Teks masuk dari balik mask (naik), bukan fade biasa. Transisi bobot (100 → 800) boleh untuk kata pembuka.
- Maksimal satu kalimat utama di layar pada satu waktu.

## 7. Warna & cahaya
- Dasar hitam `#000`, teks `#F5F5F5`, aksen biru `#3B82F6` / `#2563EB`, sorot `#60A5FA`.
- Biru penuh layar hanya untuk momen "bukti" (angka, manfaat). WhatsApp hijau `#25D366` hanya di CTA.
- Grain halus + vignette selalu aktif untuk rasa sinematik.

## 8. Kamera & kedalaman
- Setiap bab punya gerak kamera berbeda: dolly-in pelan, close-up lalu mundur, atau dorong ke detail.
- Saat kamera fokus ke satu elemen, elemen lain diberi blur 3–4 px (rack focus).
- Zoom kamera yang besar disembunyikan di dalam gerak cepat (whip pan) agar tidak terasa melompat.
- Motion blur sub-frame (shutter 180°) selalu aktif di render final.

## 9. Suara
- Setiap gerak penting punya suara: whoosh untuk panah (posisi stereo mengikuti layar), klik untuk kursor, pop untuk tombol, bel untuk logo mengunci.
- Musik turun ~3,5 dB saat efek besar berbunyi.
- Target loudness −14 LUFS, true peak −1 dBTP.
- Simpan stem musik dan SFX terpisah supaya musik bisa diganti lagu berlisensi.

## 10. Format
| Format | Ukuran | Catatan |
|---|---|---|
| 16:9 | 1920×1080 | Website, YouTube, presentasi. QR WhatsApp di pojok kanan bawah. |
| 9:16 | 1080×1920 | Reels, TikTok, Shorts. Judul di atas, perangkat di bawah, tanpa QR (penonton sudah di HP). |
| Sting | 3 s | Intro/outro konten lain (logo saja). |
| Bumper | 6,5 s | Iklan pendek: tiga kata + end card WhatsApp. |
Area aman teks 9:16: hindari 250 px teratas dan 350 px terbawah (tertutup UI aplikasi).
