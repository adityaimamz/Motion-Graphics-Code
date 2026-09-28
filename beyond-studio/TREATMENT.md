# Beyond Studio — Promo 45 s (3D) · Treatment

Status: **disetujui & dibangun** (app/). Menggantikan film DOM 30 s. Teks sama, ruang napas baru, dibangun ulang di three.js.
Waktu persis ada di `cues.json`; angka di bawah adalah rancangannya.

## 1. Ide

Beyond Studio adalah *studio*, jadi filmnya adalah **pemotretan produk di sebuah studio gelap**. Satu panggung hitam dengan lantai yang memantul redup dan satu lampu kunci biru. Di atasnya berdiri "set" untuk setiap jenis karya: toko online, portofolio, skripsi, dan situs responsif. Panah dari logo adalah satu-satunya karakter. Ia membuka film, lalu menjadi kursor yang benar-benar memakai website klien di layar perangkat 3D. Setelah itu ia lepas landas ke atas, dan kamera *crane* mengikutinya ke set berikutnya. Kamera tidak pernah berhenti total, tapi selalu tenang di antara hentakan. Di bab bukti, dinding studio menyala biru penuh. Di akhir, semua lampu padam kecuali satu sorot pada logo.

## 2. Tone
- Gerak tegas yang jatuh di ketukan 128 BPM, lalu mengendap. Tidak ada gerak mengambang.
- Rasa "product shot" premium: pantulan halus, kedalaman ruang (DOF), dan bloom **hanya** pada biru dan jejak panah. Teks putih tidak pernah ber-bloom.
- Tenang dan percaya diri. Satu kalimat utama di layar, dan setiap kalimat sekarang ditahan cukup lama untuk dibaca (alasan utama perpanjangan).
- Karya nyata: screenshot website klien asli dari `site/assets/`.

## 3. Palet & tipografi
Default brand, tanpa penyimpangan:
- Warna: void `#000`, lantai `#050608`, paper `#F5F5F5`, mute `#9CA3AF`, blue `#3B82F6` / `#2563EB`, ice `#60A5FA` (jejak, gelombang kejut), deep `#1D4ED8`. WhatsApp `#25D366` hanya di CTA.
- Font: Inter Tight (`site/fonts/it.woff2`). Kata kunci 700–880, tracking −0,045 em.
- Teks masuk dari balik mask (naik). Di 3D, teks berupa quad per huruf, jadi huruf bisa terlontar ke kedalaman.

## 4. Motif
1. **Panah** (bentuk logo, bertakik, diekstrusi tipis 3D dengan bevel) bergerak maju atau naik, tidak pernah mundur. Saat terbang: glow biru + jejak cahaya. Saat mendarat di layar menjadi kursor (diputar −120°, garis tepi gelap), dan satu klik jatuh di satu ketukan (maks. 3 per bab).
2. **Lampu studio**: setiap bab dibuka dengan lampu kunci yang "menyala" ke set-nya, dan closing ditutup dengan semua lampu padam kecuali sorot logo.
3. **Cincin + panah = logo**: bergema di gauge diagnosis (bab 5) dan kembali utuh di closing.

## 5. Storyboard

Waktu dalam detik. 1 ketukan = 0,469 s, 1 bar = 1,875 s, dan 45 s = 24 bar. Koordinat 9:16 = 1080×1920 (area aman: y 250–1570, x ≤ 930); 16:9 = 1920×1080.

### S1 · Logo · 0–3,75 (2 bar)
- **Teks:** Beyond Studio
- **Frame kunci:**
  - 9:16: logo 3D di tengah (y ±820, diameter ±420), wordmark di bawahnya (y ±1120, 96 px).
  - 16:9: logo kiri-tengah, wordmark di kanan logo (lockup horizontal seperti versi lama).
- **Gerak:**
  - 0: sorot menyala dari atas.
  - 0,2–1,4: cincin tergambar simetris dari arah jam 9.
  - 0,9–1,875: panah terbang dari kiri (sedikit miring/banking, jejak cahaya) dan **mengunci di celah kanan pada 1,875** dengan gelombang kejut, guncangan kecil, dan pop, menghadap lurus ke kamera.
  - 2,1–2,8: wordmark naik per huruf.
  - 2,8–3,75: cincin mundur ke kedalaman, panah melesat ke kanan menembus wordmark, dan kamera mengikutinya.
- **Transisi keluar:** whip mengikuti panah ke S2.
- **SFX:** klik lampu, riser tipis, whoosh (pan kiri → tengah), impact + bell di 1,875, sapuan halus wordmark, whoosh (tengah → kanan).
- Sumber **sting 3 s** (0–3, fade 2,55).

### S2 · Proses · 3,75–7,5 (2 bar)
- **Teks:** Dirancang. / Dibangun. / Diluncurkan. (EN: Designed. / Built. / Launched.)
- **Frame kunci:** satu kata di tengah layar.
  - 9:16: 150–190 px, di-fit selebar 900 px.
  - 16:9: 236 px.
- **Gerak:**
  - 3,75: *Dirancang.* naik dari mask dengan bobot 100 → 800.
  - 4,69: *Dibangun.* dibanting dengan bobot tebal + guncangan.
  - 5,625: *Diluncurkan.* naik dari mask.
  - 6,56: panah naik dari bawah menembus kata, dan huruf-hurufnya terlontar dari tengah ke luar **ke arah kamera dan kedalaman**.
  - 6,56–7,5: kamera tilt/crane naik mengikuti panah.
- **Transisi keluar:** crane naik lalu turun ke set bisnis (turunnya disembunyikan dalam gerak cepat).
- **SFX:** 3 hit kata di ketukan, whoosh naik, pecahan huruf.
- Bagian pertama **bumper**.

### S3 · Bisnis · 7,5–13,125 (3 bar)
- **Teks:** Website custom untuk / **bisnis.**
- **Frame kunci:**
  - 9:16: judul di atas (x 90, y 300–470; baris 1 mute 44 px, baris 2 paper 120 px). Laptop 3D Anggajaya di tengah (y 700–1250), HP di depan-kanan (y 900–1450), kartu omzet mengambang di depan-kiri.
  - 16:9: judul kiri atas, laptop tengah-kanan, HP kanan depan.
- **Gerak:**
  - 7,5: panah naik bersama perangkat (crane), lalu mendarat di layar laptop dan menjadi kursor (7,97).
  - Klik di ketukan: pilih ukuran **M** 8,906 → jumlah **+** (jadi 2) 9,844 → **Tambah ke keranjang** 10,781. HP ikut di-tap bersamaan.
  - 11,25: kartu omzet maju ke arah kamera (z-pop), angka menghitung naik ke **Rp 12,4 jt** (sampai 12,4).
  - Kamera dolly-in pelan sepanjang bab. Tahan baca 11,6–12,6.
- **Transisi keluar:** 12,656 panah lepas landas ke atas, crane ke set berikutnya (12,656–13,125).
- **SFX:** mendarat, 3 klik + pop UI, tik angka, whoosh naik.

### S4 · Portofolio · 13,125–18,75 (3 bar)
- **Teks:** Website custom untuk / **portofolio.** Baris 1 tetap di tempatnya; hanya kata kedua yang berganti lewat mask.
- **Frame kunci:**
  - 9:16: dibuka **close-up** pada tombol *See projects* di browser (mengisi ±70 % lebar, HP di belakang blur DOF), lalu mundur memperlihatkan browser (y 650–1150) + HP (kanan, y 850–1400).
  - 16:9: sama, versi melebar.
- **Gerak:**
  - 13,125–14,4: panah mendarat sebagai kursor.
  - **14,531: klik** *See projects*. Halaman scroll ke studi kasus Celestial Scrolls (14,53–15,9), dan HP ikut scroll.
  - 15,0–16,9: kamera mundur (pull-out) lalu orbit pelan ±15°.
  - Tahan baca 16,9–18,2.
- **Transisi keluar:** 18,28 panah naik, crane.
- **SFX:** klik, scroll halus, whoosh.

### S5 · Skripsi · 18,75–24,375 (3 bar)
- **Teks:** Website custom untuk / **skripsi.**
- **Frame kunci:**
  - 9:16: browser SIMALA di belakang (y 650–1100); kartu *Progres skripsi* (kiri depan) dan gauge *Tingkat keyakinan* (kanan depan) mengambang lebih dekat ke kamera.
  - 16:9: browser tengah, dua kartu di depan kiri/kanan.
- **Gerak:**
  - 18,75–20,2: bingkai lebar, kursor mendarat, **20,156: klik** *Jelajahi*.
  - 20,26–21,46: kamera push-in ke kartu, browser di belakang jatuh ke DOF (rack focus). (Klik dulu, baru push-in: kursor yang mengklik tidak blur.)
  - 20,625 → 22,5: 5 bab skripsi tercentang, satu per ketukan.
  - 21,09–22,5: gauge naik ke **92 %** (nilai film lama), dengan panah berputar di ujung cincin (cincin + panah = logo).
  - Tahan baca 22,5–23,9.
- **Transisi keluar:** 23,9 panah naik, crane.
- **SFX:** klik, 5 tik centang (nada naik), dengung gauge, whoosh.

### S6 · Responsif · 24,375–30 (3 bar)
- **Teks:** Sempurna di / **setiap layar.**
- **Frame kunci:** layar 3D Nexora (*Tampil rapi. Tumbuh cepat.*).
  - 9:16: layar di tengah (y 600–1300), angka lebar di bawahnya (y 1380, "1440 px → 390 px").
  - 16:9: layar kiri-tengah, judul kanan.
- **Gerak:**
  - 25,31: layar **berubah bentuk secara fisik**: desktop 16:10 → tablet 26,25 → HP 27,19. Bezel ikut membulat, layout situs menyusun ulang, dan kamera memutar sedikit mengikutinya.
  - Kursor mengikuti tombol *Mulai sekarang* selama layout berubah.
  - **29,531: klik** → ledakan biru dari tombol yang **membanjiri layar tepat di 30,0**.
- **Transisi keluar:** banjir biru menjadi dinding biru S7.
- **SFX:** tiga "snap" perubahan ukuran, klik, riser → boom.

### S7 · Bukti · 30–37,5 (4 bar)
- **Teks:**
  - 80+ / proyek selesai
  - 98% / klien puas
  - Konsultasi gratis. / Harga transparan. (EN: Free consultation. / Transparent pricing.)
- **Frame kunci:** dinding studio biru penuh `#2563EB → #3B82F6`, teks paper.
  - 9:16: angka 260 px rata kiri x 90 (80+ di y 600, 98% di y 1050), label 44 px.
  - 16:9: dua angka berdampingan.
- **Gerak:**
  - 30,0–31,4: 80+ berputar seperti odometer.
  - 31,875–33,3: 98% berputar seperti odometer.
  - Kamera parallax pelan: angka di depan, label sedikit di belakang. Tahan baca sampai 33,75.
  - 33,75: *Konsultasi gratis.* naik dari mask (bobot 300 → 780).
  - 35,625: *Harga transparan.* naik dari mask.
  - 37,03: **wipe berbentuk mata panah raksasa** dengan tepi bercahaya, menyapu ke kanan, hitam penuh di 37,5.
- **Transisi keluar:** wipe panah.
- **SFX:** tik odometer, 2 hit teks, whoosh besar + sub.

### S8 · Closing · 37,5–45 (4 bar)
- **Teks:**
  - Siap bangun website Anda? (EN: Let's build yours.)
  - beyondstudio.site
  - WhatsApp 0819-2707-0239
  - Konsultasi gratis sebelum Anda memutuskan.
- **Frame kunci:**
  - 9:16: logo + wordmark di atas (y 520), pertanyaan (y 800, 82 px), pil URL (y 1000), tombol WhatsApp (y 1140), sub (y 1300). Tanpa QR.
  - 16:9: pertanyaan di tengah, URL + WA berdampingan, QR WhatsApp di pojok kanan bawah.
- **Gerak:** semua lampu padam kecuali sorot.
  - 37,5–38,4: cincin tergambar dari arah jam 9.
  - 38,4–39,375: panah terbang masuk dari kiri dan **mengunci di 39,375** dengan gelombang kejut, pop, dan bell.
  - 39,6–40,3: wordmark naik.
  - 40,3–41,25: lockup naik dan mengecil ke posisi atas.
  - 41,25: pertanyaan naik dari mask.
  - 41,72–42,4: URL diketik.
  - 42,19: tombol WhatsApp pop (outBack). QR pop di 42,4 (hanya 16:9).
  - 42,66: sub.
  - 43,59: tombol WA di-tap (di ketukan).
  - **Tahan sampai 45,0 (1,4 s).** Dolly-in sangat pelan.
- **SFX:** lampu padam, whoosh, impact + bell C maj9, 2 bell G→C (wordmark), ketik, pop, tap.
- 2 bar terakhir (41,25–45) = bagian kedua **bumper** (total 7,5 s).

## 6. Audio
- **Mode:** 100 % sintetis dari `audio.py` (tanpa file dari user), 128 BPM, 24 bar, kunci C.
- **Sumber waktu:** satu tabel cue (waktu klik, pendaratan, lock, wipe) yang dibaca visual *dan* `audio.py`, jadi tidak ada lagi angka yang disalin manual di dua tempat.
- **Aransemen:**
  - bar 1–4 intro (logo, proses);
  - bar 5–16 groove utama, dengan variasi ringan per bab;
  - bar 17–20 bukti, lebih terbuka dan lebar;
  - bar 21–24 outro dengan sonic logo.
- **SFX:** semua yang tercantum per scene, dengan whoosh yang di-pan mengikuti posisi panah di layar.
- **Mix & stem:** ducking musik −3,5 dB saat efek besar. Stem `score.wav`, `score_music.wav`, `sfx.wav`. Loudness akhir −14 LUFS, true peak −1 dBTP, diatur di render.

## 7. Engine
- **three.js**, hasil port minimal dari `pdoom-video-main/app/src/engine` (lisensi MIT, atribusi dicantumkan). Yang diambil:
  - render target HDR linear;
  - post-processing: bloom, grain, vignette, CA tipis;
  - sampler motion blur adaptif;
  - player preview (play, scrub, frame-step);
  - renderer headless (Chrome → ffmpeg).
- Yang dibuang: lirik, HUD, font plotter.
- **Alasan:** yang diminta adalah 3D "seperti pdoom", yaitu kamera sungguhan, kedalaman, pantulan, dan DOF. Semua itu tidak bisa dicapai dengan DOM/CSS lama.
- **Kecocokan:**
  - Setiap frame = f(t), jadi seek dan sampling acak aman.
  - UI website di layar digambar ke tekstur Canvas2D per frame (screenshot asli + kursor + perubahan UI).
  - Teks berupa quad per huruf di 3D.
- **Varian:** `?fmt=v|h` (9:16 / 16:9) × `?lang=id|en`. Satu timeline; kamera dan layout punya dua set nilai per scene.

## 8. Closing + CTA
Jenis promosi → CTA **WhatsApp** (nomor dari `kontak.json`), lengkap dengan URL, sesuai STYLE.md §1. Geometri logo persis:
- cincin r 135, stroke 34, celah kanan 36 px;
- panah `M200,172 L330,247 L200,327 L234,247 Z`, diekstrusi tipis;
- saat terkunci selalu menghadap lurus ke kamera, tanpa rotasi sisa.

End card ditahan 1,4 s setelah tap.

## Catatan data
80+, 98 %, Rp 12,4 jt, hasil diagnosis, dan situs Nexora masih **ilustrasi**. Ganti dengan data yang disetujui klien sebelum dipublikasikan.
