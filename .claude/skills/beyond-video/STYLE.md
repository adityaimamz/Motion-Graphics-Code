# Beyond Studio — brand bible video

Sumber: `beyond-studio/MOTION-GUIDE.md`, `evolusi-layar/ANIMATION_GUIDE.md`, dan pelajaran dari `pdoom-video-main/docs/TREATMENT.md`. Kalau bertentangan, file ini yang menang.

Tingkat aturan:
- **WAJIB**: tidak boleh dilanggar.
- **BRAND KIT**: palet, font, dan gerak brand. Wajib di **closing saja**.
- **ISI KONTEN: BEBAS**: palet, font, gaya, gerak, dan ritme dipilih sebebas-bebasnya per video, tanpa terikat brand kit dan tanpa perlu alasan. Batasnya hanya §1 Teknis dan §4 LARANGAN.
- **LARANGAN**: anti-slop, berlaku di seluruh video.

## 1. WAJIB

### Closing logo + CTA (setiap video)
Geometri logo (viewBox 500×500, warna `#F5F5F5` di atas gelap):
- Cincin: lingkaran pusat (249,247), r 135, stroke 34, butt. Celah di kanan: potong rect (300,229, 200×36).
- Panah bertakik: `M200,172 L330,247 L200,327 L234,247 Z`, mengunci di celah kanan.
- Wordmark "Beyond Studio": Inter Tight 700, tracking −0,045 em, di bawah logo.

Urutan:
1. Cincin tergambar simetris dari arah jam 9 dan panah terbang masuk dari kiri, dengan jejak cahaya biru. Boleh cincin dulu atau panah dulu.
2. Panah mengunci di celah **tepat di ketukan**: gelombang kejut `#60A5FA`, pop kecil (outBack), bunyi impact + bell.
3. Wordmark naik dari balik mask (outExpo, ±0,75 s).
4. CTA:
   - edukasi: pil **Follow** + kalimat ajakan;
   - promosi: tombol **WhatsApp** `#25D366` dengan nomor dari `beyond-studio/kontak.json` (tampil `0819-2707-0239`).
5. CTA pop (outBack) lalu di-tap. End card **ditahan ≥ 1,2 s** setelah kalimat terakhir selesai.

Aturan logo: jangan diputar, dicerminkan, atau diubah proporsinya. Celah selalu di kanan.

Rujukan implementasi:
- Canvas2D: `evolusi-layar/src/film.js` (`drawClosing`, `drawFollow`).
- SVG/DOM: `beyond-studio-legacy/site/template.html` (`#logo1`, `#wm1`).

### Teknis
- 1080×1920, 60 fps. Durasi dan audio sesuai naskah yang disetujui.
- **Setiap frame = f(t)**:
  - acak memakai `hash(i, seed)`;
  - tanpa state yang terakumulasi;
  - seek ke detik mana pun menghasilkan frame identik;
  - preview identik dengan hasil export.
- Satu **timeline** menjadi sumber waktu untuk gambar, suara, dan VO. Scene tidak menulis angka waktu sendiri.
- Hal yang "melompat" (kedip kursor, counter) dikunci ke frame: `round(t*60)/60`.
- Area aman 9:16: teks penting tidak boleh di 250 px teratas, 350 px terbawah, dan 150 px kanan (tombol TikTok).

## 2. BRAND KIT (khusus closing)

Dipakai di closing logo + CTA. Tidak mengikat isi konten.

| Aspek | Brand kit |
|---|---|
| Palet | void `#000`, paper `#F5F5F5`, mute `#9CA3AF`, blue `#3B82F6`, blue2 `#2563EB`, ice `#60A5FA`, deep `#1D4ED8`. WhatsApp `#25D366` hanya untuk tombol CTA promosi. |
| Font | Inter Tight (`fonts/it.woff2` sudah ada di beberapa proyek) untuk wordmark dan CTA. |
| Karakter | Panah logo selalu bergerak maju (kanan) atau naik, tidak pernah mundur. |
| Easing | Masuk `cubic-bezier(.23,1,.32,1)` / outExpo; pindah `cubic-bezier(.77,0,.175,1)`; keluar t³ / inExpo; pop outBack ~1,5, maksimal sekali per elemen. |

## 3. ISI KONTEN: BEBAS

Palet, font, gaya visual, karakter/motif, easing, ritme, transisi, finishing, suara, dan bahasa di isi konten **bebas sebebas-bebasnya** per video. Isi konten tidak perlu memakai brand kit dan tidak perlu menulis alasan kalau berbeda darinya. Pilihannya cukup dicatat di `TREATMENT.md`.

Yang tetap berlaku di isi konten hanya §1 Teknis dan §4 LARANGAN.

### Rujukan opsional
Pola yang pernah berhasil di video sebelumnya. Boleh dipakai, diubah, atau diabaikan.

| Aspek | Rujukan |
|---|---|
| Ritme | Momen besar jatuh di ketukan (musik sintetis: 128 BPM). Teks masuk 0,55–0,75 s, keluar 0,2–0,3 s. Kamera/bab 0,6–0,65 s. Ruang tenang sebelum dan sesudah hentakan. |
| Transisi | Overlap 0,55–0,95 s, tanpa frame hitam kosong. Transisi punya makna, bukan hanya efek. |
| Teks | Masuk dari balik mask (naik). Caption menjadi bagian dari gambar. Satu kalimat utama di layar. |
| Finishing | Grain halus (11–14 %), vignette, motion blur sub-frame (adaptif: sedikit sample saat diam, banyak saat whip). |
| Suara | Gerak penting punya bunyi (whoosh mengikuti posisi stereo, klik, pop, impact). VO: musik di-duck −11 dB, SFX −5 dB. Master kira-kira −14 LUFS, true peak −1 dBTP. Stem musik dan SFX disimpan terpisah. |
| Bahasa | Indonesia santai-cerdas ("kamu", kalimat pendek, satu ide per baris ≤ ±26 karakter). Lucunya kering dan cerdas. Tanpa emoji. |
| Kerangka edukasi (30–60 s) | Hook pertanyaan/kontras ≤ 2,5 s → 3–5 beat penjelasan dengan visual yang berubah → insight "kenapa" → kaitkan ke website/produk digital → closing + Follow. |
| Kerangka promosi (15–30 s) | Hook masalah → bukti nyata (karya klien asli, angka) → manfaat → closing + WhatsApp. |

## 4. LARANGAN (anti-slop, seluruh video)
- Gambar AI, stok "AI/tech" generik, otak bercahaya, hujan kode Matrix, neon ungu-cyan cyberpunk, nebula partikel generik, lens flare berlebihan.
- Gerak mengambang ala screensaver; elemen bergerak tanpa sebab (setiap perubahan dipicu klik, ketukan, atau narasi).
- Wajah/mata realistis.
- Teks bergaris tepi (outline) atau ber-halo; lebih dari satu kalimat utama sekaligus.
- Karya "ilustrasi" palsu untuk promo: tampilkan website klien asli (`beyond-studio/app/public/assets/`).

## 5. Checklist "Siap render"
- [ ] Naskah dan treatment sudah disetujui; `TREATMENT.md` sesuai dengan hasil akhir.
- [ ] Preview jalan tanpa error di console.
- [ ] Still per scene + closing sudah dilihat: teks terbaca, di dalam area aman, tidak bertabrakan.
- [ ] Frame deterministik: dua kali ambil still di t yang sama hasilnya identik.
- [ ] Closing sesuai §1 dan §2 (geometri, urutan, brand kit, CTA yang benar, hold ≥ 1,2 s).
- [ ] Momen yang dirancang di treatment jatuh di ketukan / kata VO yang dimaksud.
- [ ] Tidak ada item dari LARANGAN.
- [ ] `<slug>/README.md` memuat perintah preview, draft, final, dan file yang harus disiapkan user.
- [ ] Tidak ada MP4 yang dibuat; tidak ada commit.
