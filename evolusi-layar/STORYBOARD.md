# Evolusi Layar — Storyboard

Format 1080×1920, 60 fps, seluruhnya code-rendered (Canvas2D), setiap frame = `f(t)`.
Durasi total mengikuti pacing: **56.6 detik** (3396 frame) tanpa voice over. Dengan voice over, timeline
melebar mengikuti narasi (±58–63 detik, lihat `VOSCRIPT.md`); tabel di bawah adalah desain dasarnya (hasil penjumlahan kebutuhan baca tiap scene, bukan target).

## Ide besar

Satu toko kopi fiktif — **Kopi Pagi** — punya website yang *sama isinya* (nama, jam buka, menu, kontak), tapi
dirender ulang di setiap era. Penonton melihat informasi yang identik "berganti kulit", jadi insight tiap era
terbaca dari perbandingan, bukan cuma dari caption.

Tiga lapisan yang jalan terus sepanjang video:

| Lapisan | Peran | Perilaku |
|---|---|---|
| **Odometer tahun** (atas) | Narator — selalu gaya brand (IT/Inter Tight), netral | Digit berputar seperti odometer mekanis saat pindah era (1991 → 1998: digit satuan menggelinding 1…8; 2015 → 2023: satuan lewat 9→0 dan puluhan ikut naik) |
| **Layar** (tengah) | "Evolusi Layar" secara harfiah: bentuk perangkat ikut berevolusi | CRT hitam 4:3 → CRT krem 4:3 → LCD perak 4:3 → LCD hitam glossy 16:10 → bezel aluminium tipis 16:10 → bezel hilang, website *menjadi* layar TikTok itu sendiri |
| **Caption insight** (bawah) | Suara era — caption ditulis *dalam gaya era itu sendiri* | Terminal hijau → teks pelangi ala WordArt → metalik ala intro Flash → glossy + pantulan → flat dengan blok warna → brand |

Hal yang paling diingat (satu-satunya "kemewahan"): **caption yang ikut berevolusi**. Sisanya disiplin.

## Zona aman TikTok

- Atas y < 150 dan bawah y > 1560 dianggap tertutup UI → hanya elemen dekoratif.
- Tepi kanan x > 960 pada y 900–1560 (tombol like/comment) → caption dibatasi x 90–930.

## Shot list

### 0 · HOOK — 0.00 → 2.75 s (2.75 s)

| t | Visual | Catatan |
|---|---|---|
| 0.00 | Frame pertama sudah berisi: kata "Kenapa" muncul di tengah layar hitam, langsung berganti-ganti gaya era (terminal hijau → pelangi → metalik → glossy → flat → brand) ~12× per detik | Frame 0 = thumbnail, jadi tidak ada fade dari hitam |
| 0.00–0.55 | "Kenapa / desain / website / terus / berubah?" masuk kata demi kata (stagger 0.11 s), 3 baris, masing-masing "slot machine" gaya | Tiap ganti gaya disertai kilatan warna era samar di belakang |
| ~1.05 | Semua kata mengunci ke gaya brand putih | Baca 5 kata ≈ 1.5 s |
| 2.25–2.75 | Teks di-*backspace* cepat dari belakang (±1 karakter/frame) sampai tersisa kursor blok hijau | Jembatan ke era teks |

### 1 · 1991 — Web teks — 2.75 → 8.75 s (6.0 s)

| lokal | Visual |
|---|---|
| 0.00–0.40 | Kursor hijau menjadi garis horizontal → CRT menyala (garis melebar vertikal), bezel CRT hitam bulat muncul. Odometer "1991" naik dari bawah |
| 0.30–1.40 | Halaman Kopi Pagi tercetak seperti *line-mode browser*: judul di tengah, paragraf, link bernomor `Menu[1] Lokasi[2] Kontak[3]`, prompt `1-3, Back, Quit, or Help: _` |
| 1.00 / 1.90 | Caption baris 1 lalu baris 2 diketik ala terminal (VT323 hijau, glow fosfor) |
| 2.60 | Kursor mengetik "1" → layar di-scroll & halaman MENU tercetak (daftar harga pakai titik-titik) — informasi murni |
| 5.40–6.00 | Keluar: transisi 1 |

**Insight:** "Dulu, internet cuma teks. Orang cuma butuh informasi, bukan tampilan."

### T1 · 1991 → 1998 (0.6 s, overlap)
8.45 → 9.05 s. Pixel dissolve: blok 20 px halaman 1998 menyala dalam urutan acak (hash deterministik), seperti GIF yang ter-load.
Bezel CRT hitam memudar ke krem. Odometer menggelinding 1→8. Caption lama rontok per huruf.

### 2 · 1998 — Web "rame" — 8.75 → 14.50 s (5.75 s)

| lokal | Visual |
|---|---|
| 0.0 | Jendela browser abu-abu ber-bevel, title bar gradasi navy, address bar `members.kopipagi.net/~kopi` |
| 0.2–2.2 | Halaman *makin ramai* — elemen pop-in satu per satu dengan pantulan: latar bintang ber-tile berkedip, judul pelangi "SELAMAT DATANG di HOMEPAGE KOPI PAGI!!!", marquee kuning, garis pelangi, badge "BARU!" berkedip, banner "SEDANG DIBANGUN" bergaris kuning-hitam bergerak, amplop "Kirim email!" mengepak, penghitung pengunjung LED `000127` yang terus naik, tombol "Buku Tamu", barisan api di bawah |
| 0.8 / 1.6 | Caption pelangi (Comic Neue Bold, huruf bergoyang, bayangan keras hitam) |
| 5.2–5.8 | Keluar: transisi 2 |

**Insight:** "Lalu semua orang pengen ‘rame’. Makin heboh, makin keren."

### T2 · 1998 → 2002 (0.6 s)
Iris wipe (lingkaran menutup ke tengah) — transisi klise era itu. Di balik iris: hitam intro Flash. Bezel krem → perak.

### 3 · 2002 — Splash page & intro — 14.50 → 20.15 s (5.65 s)

| lokal | Visual |
|---|---|
| 0.0–1.2 | Intro: garis-garis "tech" menyapu, lingkaran orbit tipis, huruf "KOPI PAGI" (Orbitron) beterbangan masuk dengan overshoot, kilatan lensa menyapu wordmark metalik, teks kecil piksel "ENTERING THE KOPI EXPERIENCE" |
| 0.6–4.6 | Loading bar tebal `LOADING 0% … 99%` — melambat, lalu **mentok di 99%**. Pojok kanan atas: `WAKTU TUNGGU 00:00` yang terus naik cepat |
| 0.9 / 1.7 | Caption metalik (Exo 2 italic, gradasi krom, kilatan) — huruf "meledak masuk" dari posisi acak |
| 3.6 | Tombol "SKIP INTRO »" berkedip; kursor panah bergerak ke sana |
| 5.50 | Klik — tombol tertekan, langsung transisi 3 |

**Insight:** "Era pamer teknologi — bahkan kalau harus mengorbankan kecepatan dan kegunaan."

### T3 · 2002 → 2007 (0.55 s)
Kilatan putih dari tombol yang diklik. Layar berubah rasio 4:3 → 16:10, bezel perak → hitam piano glossy dengan pantulan diagonal. Odometer 2→7.

### 4 · 2007 — Web 2.0 "mahal" — 20.15 → 27.90 s (7.75 s)

| lokal | Visual |
|---|---|
| 0.0–0.8 | Browser chrome glossy, header gradasi aqua dengan highlight, logo "kopipagi" bulat + pantulan cermin, badge bintang "beta" berputar, tombol pil hijau glossy "Pesan Sekarang!" dengan kilap menyapu, kotak-kotak gradasi dengan ikon cangkir skeuomorfik, latar garis diagonal |
| 0.5 | Caption halaman 1 (Arimo Bold, gradasi putih→perak, pantulan terbalik di bawahnya) |
| 2.35 / 2.75 | Halaman 1 memudar; halaman 2 ("kenapa") masuk. Kursor panah "orang yang belum terbiasa" masuk dari kanan bawah, berkeliling ragu-ragu: berhenti di kotak "Lokasi Kami", di cangkir (bisa diklik?), goyang sedikit |
| 4.9 | Baris tombol: label narator **kilap**, **bayangan**, **pantulan** muncul bergantian (pin biru berdenyut + garis penunjuk) di sorot tombol, bayangannya, dan pantulan logo |
| ±6.6 | Kursor mendarat di tombol (hover terang) lalu menekannya tepat di "dipencet": tombol turun 4 px, bayangan menyusut, muka menggelap, lalu memantul balik |
| 7.3–8.2 | Keluar: transisi 4 (morph); ketiga label dicoret satu per satu lalu hilang, kursor memudar |

**Insight:** "Semua didesain biar kelihatan ‘mahal’. Soalnya orang masih asing sama layar — tombol harus kelihatan bisa dipencet."

### T4 · 2007 → 2015 — MORPH "Flattening" (0.9 s) — momen edukatif utama
Satu renderer dengan parameter `k` 0→1: gradasi runtuh jadi warna solid, kilap mengecil ke nol, drop shadow
ditarik masuk, pantulan hilang, garis latar memudar, badge "beta" mengempis, radius sudut berubah, palet bergeser ke
flat. Penonton *melihat* skeuomorfisme dilucuti. Bezel hitam glossy → aluminium tipis.

### 5 · 2015 — Flat design — 27.90 → 36.65 s (8.75 s)

| lokal | Visual |
|---|---|
| 0.0 | Hero biru flat, ikon cangkir dengan *long shadow* 45° yang **tumbuh** keluar (0–1.2 s), judul Montserrat "Kopi Pagi", sub "Kopi segar, setiap pagi.", tombol ghost "Lihat Menu", ikon hamburger, 3 ikon flat (Menu / Lokasi / Kontak), banyak ruang kosong |
| 0.45 / 0.95 | Caption halaman 1: blok warna flat meluncur horizontal, teks putih Montserrat muncul di atasnya |
| 3.2 / 3.6 | Halaman 1 menyusut; halaman 2 ("kenapa") masuk |
| ±4.2 | Titik sentuh (jari) langsung mengetuk "Lihat Menu" tanpa ragu → ripple ala Material → halaman scroll halus 300 px ke bagian **Menu**: tiga baris flat (ubin warna, nama, harga, tombol flat biru "Pesan") |
| ±6.6 | Jari mengetuk "Pesan" di baris Kopi susu → ripple → tombol jadi teal dengan centang |
| 8.05–9.0 | Keluar: transisi 5 |

**Insight:** "Sampai orang sadar: simpel itu lebih dipercaya. Orang udah terbiasa sama layar — tombol nggak perlu pura-pura timbul lagi."

### T5 · 2015 → 2023 (0.95 s)
Layar desktop *mengembang* sampai memenuhi seluruh frame 1080×1920 — bezel hilang, website menjadi layar ponsel
(kerangka "responsive"). Biru flat melebur ke gradasi fajar. Odometer 2015 → 2023 berputar lewat 2016…2022.

### 6 · 2023 — Terasa pas — 36.65 → 46.00 s (9.35 s)

| lokal | Visual |
|---|---|
| 0.0–0.8 | Website mobile full-bleed dengan identitas sendiri: langit fajar biru (Kopi *Pagi* → biru subuh, jembatan alami ke palet brand), matahari terbit pelan sepanjang scene, nav kecil |
| 0.3–1.0 | Kartu sapaan personal: "Selamat pagi, Rina." / "Kopi susu, kurang gula — seperti biasa?" + tombol besar "Pesan lagi"; chip "Antrean 3 orang" (titik berdenyut) dan "4 menit dari kamu" |
| 0.6 / 1.45 | Caption halaman 1 gaya brand (IT, reveal mask naik per baris) |
| 1.2–8.8 | Strip "Menu pagi ini" bergeser pelan seperti carousel, kartu ke-4 "Es kopi aren" masuk |
| ±2.7 | Data live: "Antrean 3 orang" → angka menggelinding jadi 2. Jam status bar 6:04 → 6:05 di 4.2 |
| 4.7 / 5.1 | Halaman 1 naik keluar; halaman 2 ("kenapa") masuk |
| 5.15–5.9 | "…udah ‘kenal’ kamu": yang dikenal menyala satu per satu: cincin biru di avatar "R", garis bawah di "Rina", garis bawah di "kurang gula", chip "4 menit dari kamu" berpendar |
| ±8.7 | Tepat di kata "tap": jari men-tap "Pesan lagi" → ripple → tombol berubah "Siap diambil 06.12 ✓" |
| 9.35 | Keluar: tarik mundur (awal closing) |

**Insight:** "Sekarang bukan soal ramai atau simpel — tapi soal terasa pas untuk penggunanya. Karena websitenya udah ‘kenal’ kamu: kopi langganan, cukup sekali tap."

### 7 · CLOSING — 46.00 → 56.60 s (10.6 s)

| lokal | Visual |
|---|---|
| 0.0–1.1 | Kamera mundur: layar 2023 mengecil jadi kartu; lima kartu era lain terbang masuk → grid 2×3 kontak (1991…2023), tiap kartu punya chip tahun. Latar menggelap ke hitam brand |
| 0.8 | Takeaway baris 1 (IT): "Kalau website kamu masih kelihatan seperti salah satu era di atas," |
| 1.6–3.8 | Cincin seleksi biru melompat dari kartu ke kartu ("yang mana punyamu?") |
| 3.3 | Baris 2: "itu tandanya sudah waktunya berubah." |
| 5.15–6.05 | Panah Beyond Studio melesat dari kiri dengan jejak biru; kartu-kartu tersedot berputar ke tengah |
| 5.95–6.9 | Dua arc logo tergambar mengelilingi panah yang mendarat; gelombang kejut biru |
| 6.65–7.4 | Wordmark **Beyond Studio** naik dari mask di bawah logo |
| 7.55 | Ajakan follow di bawah wordmark: "Follow, biar tahu ‘kenapa’ lainnya." (IT, mask naik) + pil biru **+ Follow** pop masuk dan berdenyut |
| ±9.2 | Jari men-tap pil di akhir kalimat → ripple → **✓ Following** |
| –10.6 | Tahan end card (mark + wordmark + ajakan + glow biru, grain) |

## Ringkasan durasi (estimasi)

| Scene | Durasi | Alasan |
|---|---|---|
| Hook | 2.75 s | 5 kata + gag backspace |
| 1991 | 6.0 s | 13 kata caption + aksi ketik "1" |
| 1998 | 5.75 s | 9 kata, tapi layar padat perlu waktu dilihat |
| 2002 | 5.65 s | 11 kata + gag loading 99% yang butuh "rasa menunggu" |
| 2007 | 7.75 s | 5 + 11 kata (fakta + kenapa); kursor ragu-ragu, label, tombol ditekan |
| 2015 | 8.75 s | 7 + 11 kata; tap, scroll ke menu, tombol flat ditekan |
| 2023 | 9.35 s | 13 + 10 kata; data live, yang "dikenal" menyala, tap di kata "tap" |
| Closing | 10.6 s | 16 kata takeaway + momen logo + ajakan follow + hold |
| **Total** | **56.6 s** | Transisi overlap, tidak ada jeda kosong |


## Audio per scene

Soundtrack disintesis dari cue timeline yang sama dengan visual (`src/timeline.js`), jadi musiknya ikut berevolusi dan
setiap efek suara jatuh di frame penyebabnya. Tidak ada sampel, tidak ada lagu pihak ketiga.

| Scene | Musik | Efek suara yang terkunci ke visual |
|---|---|---|
| Hook | Pad C maj7 tipis setelah kata terakhir terkunci | "Tick" slot-machine tiap ganti gaya (timbre per era), "clack" + bell saat tiap kata terkunci, sub hit, rentetan backspace, kursor turun |
| 1991 | Drone rendah, dengung listrik 50 Hz + desis tabung | CRT menyala (thunk + degauss + whine 15.6 kHz samar), klik print head per huruf, tombol "1", scroll, keyboard untuk caption |
| T1 | — | Crunch sample-and-hold yang makin rapat (pixel dissolve), tick odometer per tahun |
| 1998 | Chiptune ala General MIDI 140 BPM (C–Am–F–G, lead square, arpeggio) | "Boing" naik pentatonik per elemen yang pop, tick penghitung pengunjung, kretek api, kilau per huruf caption, swoop iris |
| 2002 | Intro trance 138 BPM, filter supersaw terbuka mengikuti progress loading | Whoosh + denting logam per huruf "KOPI PAGI", kilau lens flare, blip piksel tagline. **Di 99% musiknya ikut macet** (loop stutter makin redup) + beep loader. Hover, klik, crash kilatan |
| 2007 | Pop glossy 118 BPM (marimba FM, clap, shaker, glock); di halaman 2 groove terbuka: hi-hat 16-an + jawaban glock | "Shing" tiap kilap menyapu tombol, chime per baris caption, nada marimba naik per label, "tink" hover + klik plastik + pop glossy saat tombol ditekan. **Tape-stop** + desis kempes saat morph ke flat, gores kecil tiap label dicoret |
| 2015 | Petikan minimal Karplus-Strong 104 BPM + finger snap; di halaman 2 ditambah shaker + kick kedua | Swipe tiap blok caption, tap lembut + whoosh scroll, tap + dua petikan "berhasil" di tombol flat, riser saat layar mengembang jadi ponsel |
| 2023 | E-piano hangat 84 BPM (Fmaj7–Em7–Dm7–Cmaj7), sub, rim; di halaman 2 masuk garis e-piano penjawab | Swish halus UI, tick angka antrean, empat chime lembut saat yang "dikenal" menyala, tap + chime dua nada "Siap diambil" |
| Closing | Groove 2023 → drum berhenti di baris kedua takeaway → pad + riser | Zoom-out, whoosh tiap kartu, blip naik tiap lompatan cincin seleksi, whoosh panah, sedotan kartu, **impact + akor ident Beyond Studio** (bell C maj9), dua bell saat wordmark, pop lembut saat pil Follow muncul, tap + chime dua nada saat ditekan, ekor reverb |

Timeline final (sumber kebenaran) ada di `src/timeline.js`: `S` (awal tiap scene), `TR` (jendela transisi), `CAPTIONS`, dan `CUE` (momen di dalam scene yang dipakai visual dan audio).
