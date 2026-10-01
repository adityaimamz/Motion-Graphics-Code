# Vibe Engineer · Treatment

Status: **revisi 3 (audit + polish) disetujui dan dibangun (2026-10-01).** Dokumen ini sesuai dengan hasil akhir.
Jenis: edukasi. ±101,4 s, elastis (panjang tiap scene mengikuti file VO). 1080×1920, 60 fps.
Audio: VO ElevenLabs **Eleven v4** (satu tarikan, dipotong jadi 16 file) + musik dan SFX sintetis.
Semua waktu di bawah adalah rancangan dari perkiraan durasi VO. Waktu persisnya dihitung `timeline.js` dari file VO.

## Revisi 3 · audit + polish (2026-10-01)

Tiga paket, tanpa mengubah naskah VO maupun closing.
- **Rusak diperbaiki:**
  - laut depan tidak lagi menutupi palka S5;
  - awan tinta S14 tidak lagi menggambar kotak laut di langit;
  - topi kapten S15 sempat mendarat (S15 +0,8 s);
  - tangan Bayu terlihat menepuk tombol S4;
  - Kursor tidak menutupi wajah Bayu di S3;
  - perisai S12 dipegang;
  - kepala kraken keluar dari zona tombol TikTok;
  - tabrakan `+1`/papan BOSS/notifikasi/balon/label dirapikan;
  - air dan lensa tanpa papan catur;
  - kacamata ×16 berlensa bening (pupil 1 px + kilau);
  - judul jendela kode 44 px.
- **Waktu kata dari jeda VO asli.** `vo.js` mengukur jeda di tiap file, dan `timeline.js` mencocokkan jeda terpanjang lebih dulu ke tanda baca naskah. Kata sesudah "Satu:", "Lima:", "lolos tes?" kini jatuh di tempatnya (sebelumnya meleset sampai ±0,5 s).
- **Kejelasan:**
  - S4 jadi ×10 dengan menara peti yang tumbuh sesuai angka;
  - S11: meriam digambar ulang, prompt raksasa berupa buntelan kertas yang meledak, prompt kecil berupa kapsul berjejak;
  - S13: kristal simpan di tengah langit, tentakel menghantam dek, "balik" memutar kekacauan mundur;
  - S10: menara tebakan runtuh vs menara hijau;
  - S7: sinar LEVEL UP;
  - S8: sentilan kumbang dan centang akhir;
  - S9/S14: guncangan, siluet tentakel di bawah air, lingkaran ulangi di langit kanan atas;
  - karakter di close-up malam diterangi lentera.
- **Polish global:**
  - wipe tangga pixel ke kanan di setiap pergantian tempat atau aturan, tirai pertempuran S8→S9;
  - close-up bergeser pelan ±12 px;
  - HUD meredup kecuali saat berubah;
  - label membuka dua langkah;
  - Bayu berkedip dan bernapas;
  - langit wide berpita padat tanpa dither;
  - SFX untuk wipe; derik kumbang ditipiskan.

## Revisi 2 (dari versi ±65 s)

- **Naskah lugas, gambar ilustrasi.** VO dan teks layar memakai istilah sebenarnya: vibe coder, prompt, kode AI, bug, fungsi, tes, commit. Kapal, peti, kraken, dan pangkat tetap ada, tapi hanya sebagai ilustrasi. Premis "vibe coder naik pangkat jadi vibe engineer" sudah jelas dari S2, dan perbedaan keduanya dirumuskan di S15.
- **Lima aturan bernomor**, mengikuti pola referensi: (1) baca dulu, (2) kasih konteks, (3) perintah kecil, (4) tes, (5) commit. Nomor di suara dan di kartu muncul bersamaan, dan setiap aturan mengisi satu slot di HUD (`+1 BACA`, `+1 KONTEKS`, …).
- **Kamera dekat.** Shot default sekarang close-up (Bayu ×12–×16, ±25–30 % tinggi layar) dengan satu benda penjelas yang besar. Wide (×4) hanya untuk karam, berangkat, malam, bos muncul, ulangi, dan fajar.
- **Bayu digambar ulang** jadi chibi berkepala besar (24×32), dengan pipi merah, kacamata baca (dari aturan 1), dan kostum pangkat yang sama.
- **Lapisan ilustrasi ×4** (baru): jendela kode, kaca pembesar, perisai tes, kristal commit, tombol besar, dan balok. Warnanya datar, tidak ikut palet waktu, seperti diagram yang ditempel di atas adegan.
- **Kotak narasi diganti kartu penjelas**: label besar + satu baris. Transkrip VO tidak ditampilkan. Kartu adalah satu-satunya kalimat utama di layar.
- **Rekreasi referensi.** Unsur-unsur referensi sengaja dipakai ulang di dunia kapal: kumbang bug ungu bermata merah, bar XP, slot perlengkapan, kacamata + kaca pembesar, perisai ber-centang, tombol `TERIMA SEMUA` (ACCEPT ALL), stempel `RILIS!` (SHIPPED), `GAME OVER`, papan `BOSS`, layar terbelah, `NEW GAME+`. Larangan "meniru karya pihak lain" dihapus dari STYLE.md §4 atas permintaan user.
- **Kraken dan bug berwarna ungu**: ungu = bug, di seluruh film. Kraken punya 6 tentakel = 6 bug (HP 6 segmen).
- **Menu RPG 2×2 dihapus.** Perannya diganti nomor aturan di kartu dan 5 slot di HUD. Penunjuk ▶ tetap ada di `▶ LANJUT` → logo.
- **TTS pindah ke ElevenLabs v4, satu tarikan** (dibuat user di ElevenLabs, dipotong lokal oleh `tools/vo-bagi.mjs`). Voice Design API ternyata hanya untuk paket berbayar, dan rekaman per baris membuat nada melompat. VO Gemini lama ada di `vo/lama/` dan tidak dipakai lagi, karena naskahnya sudah berubah.

## 1. Ide

Aplikasi digambarkan sebagai kapal pixel. Bayu adalah **vibe coder**: dia bikin aplikasi dengan ngobrol sama AI (Kursor, kursor teks hijau), dan tidak pernah membaca kodenya. Dia merem, menekan `TERIMA SEMUA`, lalu kode dirilis. Tengah malam laporan error berdatangan: 38 bug. Bug adalah satu baris salah di kode, dan semuanya sembunyi di fungsi-fungsi (peti `</>`) yang tidak pernah dia baca. Setiap bug jadi XP, Bayu naik pangkat, dan mendapat lima aturan, masing-masing ditunjukkan secara harfiah:
- **baca dulu**: kacamata + kaca pembesar per baris;
- **kasih konteks**: prompt samar vs. daftar tujuan/aturan/contoh;
- **perintah kecil**: satu tembakan raksasa meledak, tiga tembakan kecil kena;
- **tes**: perisai yang memeriksa dirinya sendiri;
- **commit**: kristal titik aman untuk kembali.

Ulangi sampai kraken bug kabur. Di akhir, layar terbelah merumuskan bedanya: vibe coder menerima semua, vibe engineer memeriksa dulu. Layar kapal ditukar jadi VIBE ENGINEER, dan topi kapten pindah dari AI ke Bayu.

## 2. Tone & gaya

- **Gamblang dulu, lucu kemudian.** Suara selalu menjelaskan dengan istilah sebenarnya. Leluconnya ada di gambar:
  - ngoding sambil merem;
  - Kursor melambai di depan wajah Bayu, dan Bayu mengacungkan jempol;
  - "kok basah?";
  - "itu fitur, bos.";
  - "oh, gitu maksudnya."
- **Satu tokoh besar + satu benda penjelas per frame** (pola referensi). Latar tenang: langit, laut, pagar dek, papan dek.
- **Sebab-akibat yang bisa ditunjuk:**
  - lubang muncul karena digigit kumbang;
  - centang muncul karena kaca pembesar lewat;
  - tentakel tumbang karena kena tembakan;
  - semua kembali rapi karena balik ke commit.
- **Pelajaran terbaca tanpa suara:** kartu penjelas (label + satu baris), nomor aturan, slot HUD, dan label di benda.
- **Teks tanpa garis tepi dan tanpa halo**, selalu di panel padat atau menjadi bagian benda.

### Disiplin pixel
- Tiga lapisan, masing-masing dengan ukuran pixel tetap:
  - **dunia**: ×4 (wide), ×6, ×10, ×12, ×16 (close-up);
  - **ilustrasi**: ×4;
  - **UI**: ×2.
- Skala dunia hanya berubah di cut, tidak pernah lewat zoom halus.
- Close-up (≥ ×10) memakai langit berpita padat, bukan dither, karena dither di skala besar terbaca sebagai papan catur. Gelap saat "pause" memakai lapisan gelap rata, bukan dither.
- Sprite melangkah 12 fps. Kamera, UI, transisi, dan proyektil (prompt, peti jatuh) bergerak 60 fps di pixel utuh. Teks di-threshold ke pixel penuh. Tanpa motion blur.
- Langit wide memakai pita warna padat; dither hanya untuk efek kecil (cahaya lentera), tidak pernah untuk bidang luas.
- Close-up malam: langit, laut, dan pagar memakai palet malam, sedangkan karakter dan benda diterangi lentera (palet 0,4), sama seperti palka.
- Close-up bergeser pelan ±12 px sepanjang scene (dunia + ilustrasi bersama), sementara HUD dan kartu diam.
- Cut antar tempat/aturan ditutup wipe tangga pixel ke kanan (0,26 s, tepi kertas). Masuk pertempuran (S8→S9) memakai tirai bergaris ungu. Daftar wipe ada di `timeline.TRANS`.

## 3. Palet & tipografi

### Palet waktu (palette swap): tidak berubah dari versi 1
| Peran | Sore (S2–S4) | Malam (S1, S5–S14) | Fajar (S14–S16) |
|---|---|---|---|
| Langit atas / cakrawala | `#D9825E` / `#F6C58A` | `#0A1324` / `#1C2E4A` | `#86B4CC` / `#F5C4A0` |
| Laut dalam / laut | `#1D5263` / `#2C7A85` | `#06182A` / `#0E2C45` | `#2B5E78` / `#3E849E` |
| Kayu gelap / kayu / terang | `#5C3923` `#8D5832` `#C7884D` | `#26201F` `#3B2C2A` `#574236` | `#583A29` `#8A5C3B` `#C69262` |
| Kain layar | `#F0E5CC` | `#8C95A4` | `#FAF0DC` |

Palka diterangi lenteranya sendiri, dengan warna kayu hangat yang tetap.

### Karakter & benda
| Unsur | Warna |
|---|---|
| Bayu (chibi 24×32) | kulit `#B87A4F`/`#8A5236`, rambut berjambul, pipi `#E58A7A`, mulut `#6E2F24`, hoodie mustard `#E2A838`, celana `#4E5565`, sandal `#2F66B3`. Kacamata: bingkai `#1B1A26`, lensa `#CFE6F7`. |
| Pangkat | bantal leher mint `#86C2AE` (penumpang) → bandana `#D7463A` (awak) → topi kapten `#F3EFE4` (kapten) |
| Kursor (AI) | balok kursor hijau `#A8EE8C`, berkedip 1,06 Hz saat diam |
| Bug (kumbang) | ungu `#6E3FB0`/`#A47BE0`, garis punggung `#4A2580`, kepala `#2A1840`, mata putih + merah `#E5484D` |
| Kraken bug | ungu `#7A3FB8`/`#4E2384`, bintik `#A97BE6`, mata kuning `#FFD447` berpupil horizontal, 6 tentakel |
| Ilustrasi (datar) | jendela kode `#1E2638`; perisai `#2F6FE0`; kristal `#5FE3F0`; tombol `#4CC06C`; merah `#E5484D`; emas XP `#FFD447` |

### UI
| Peran | Warna |
|---|---|
| Panel | `#11162A` 94 %, bingkai `#EFE6CF` |
| Teks / label aturan | `#F4EEDC` / `#FFD447` |
| Baris penjelas kartu | `#B8C0D0` |
| Badge nomor aturan | lingkaran `#3B82F6` |
| Bahaya / lolos | `#E5484D` / `#5BD07D` |
| Ikon slot 1–5 | `#7FD3FF` `#F5B342` `#E5484D` `#5BD07D` `#5FE3F0` |

### Tipografi
- **Jersey 10** untuk semua teks game, dalam px nyata:
  - label kartu 68–108 (menyusut sampai muat);
  - baris kartu 48–64;
  - hook 176;
  - HUD 60;
  - tag 48–68;
  - balon 68.
- Huruf di layar kapal dan peti: bitmap 5×7 / 3×5 buatan sendiri (`</>` di peti).
- **Inter Tight**: khusus closing.

### Tata letak 9:16
```
y    0 ┌──────────────────────────────┐
       │ langit (tanpa teks)          │
  264  ├──────────────────────────────┤
       │ HUD: pangkat │ 5 slot aturan │  x 60–930
  360  │ papan BOSS / bar XP / +1     │
       │                              │
       │ panggung: tokoh besar +      │
       │ satu benda penjelas          │
 1296  │ ── kaki di dek ──            │
 1304  ├──────────────────────────────┤
       │ KARTU PENJELAS               │  x 60–930
       │ ① LABEL BESAR                │
       │ satu baris penjelas          │
 1556  ├──────────────────────────────┤
       │ dek / laut (tanpa teks)      │
 1920  └──────────────────────────────┘
```
Semua close-up memakai bingkai yang sama: kaki di y 1296, pagar dek di 1000, cakrawala di 900. Area aman STYLE.md (250 atas, 350 bawah, 150 kanan) terpenuhi.

**Kartu penjelas:** panel terbuka dalam 2 langkah pixel, label diketik cepat, lalu baris penjelas. Kartu muncul saat VO mulai dan bertahan sampai scene selesai. Label `BUG: 0 → 38` di S5 berhitung hidup.

## 4. Motif / benang merah

1. **Mata Bayu.** Merem (S2–S7) → terbuka + kacamata di "baca dulu" (S8) → tetap memakai kacamata di setiap aturan.
2. **Peti `</>` = fungsi kode AI.** Diterima tanpa dibuka (S4) → retak dan kumbang keluar (S6, label `login()` `bayar()` `keranjang()`) → bug yang sama jadi tentakel kraken (S11).
3. **Lima slot aturan di HUD.** Muncul kosong saat naik pangkat (S7), terisi satu per aturan (S8–S13), lalu berputar sebagai lingkaran ulangi (S14).
4. **Tombol `TERIMA SEMUA`.** Dipukul tanpa melihat (S4) → muncul lagi di sisi kiri layar terbelah (S15).
5. **Layar kapal = papan nama.** VIBE CODER (S2) → VIBE ENGINEER (S15).
6. **Topi kapten.** Dipakai AI (S2–S15) → pindah ke Bayu (S15): AI tetap mengetik, Bayu yang mengarahkan.
7. **Palet waktu.** Sore → malam → fajar.
8. **Penunjuk ▶.** `▶ LANJUT` (S16) → panah logo (S17).

## 5. Storyboard

Waktu dari perkiraan (±15 karakter/detik); file ElevenLabs akan menggesernya.

### S1 · Karam · 0,0 – 4,0 · wide ×4, malam
- **VO 01:** "Aplikasinya rusak... Di hari pertama rilis."
- **Teks:** panel hook di y 300–600: `GAME OVER` (merah, 176 px) sejak frame 0, `HARI 1 · RILIS` di kata "Di hari". Tanpa HUD dan kartu.
- **Frame:** kapal APP tenggelam miring dengan layar VIBE CODER, peti `</>` terapung, gelembung naik.
- **Keluar:** putar mundur (garis scan, `◀◀ TADI SORE`) ke sore.
- **SFX:** dengung, jingle game-over turun, gelembung, arpeggio terbalik, klik.

### S2 · Vibe coder · 4,0 – 10,8 · wide ×4 → close-up ×12, sore
- **VO 02:** "Ini Bayu. Dia vibe coder: bikin aplikasi dengan ngobrol sama AI, tanpa nulis kodenya sendiri."
- **Kartu:** `VIBE CODER` / "ngobrol sama AI, AI yang ngoding". HUD: `PENUMPANG`.
- **Frame:**
  - wide kapal di dermaga dengan layar VIBE CODER;
  - cut di kata "Bayu" ke close-up: Bayu rebahan di kursi pantai (bantal leher, merem, es kopi), Kursor di laptop di atas tong;
  - kotak prompt `TANYA AI` mengetik "bikinin aplikasi toko online, dong" dengan tombol kirim merah;
  - label `Bayu` dan `Kursor · AI`.
- **Gerak:** di kata "tanpa nulis kodenya", glyph kode melompat dari tangan Kursor ke laptop.
- **SFX:** camar, ketik prompt, kirim, ketikan Kursor.

### S3 · Merem · 10,8 – 18,3 · close-up ×16
- **VO 03:** "Saking percayanya sama AI, kodenya nggak pernah Bayu baca. Ngoding sambil merem. Literally."
- **Kartu:** `NGODING SAMBIL MEREM` / "kode AI nggak pernah dibaca".
- **Panel penghitung:** `ditulis AI · N baris` (naik terus), `dibaca · 0 baris` (merah).
- **Frame:** Bayu bersila di atas peti `</>`, kepala mengangguk di ketukan, menyeruput tanpa melihat.
- **Gerak:** di kata "merem", Kursor melompat dan melambai di depan wajahnya; Bayu mengacungkan jempol. Balon: Kursor "siap, bos!".

### S4 · Terima semua · 18,3 – 25,0 · close-up ×10 → wide ×4
- **VO 04:** "Kode dari AI? Diterima semua. Nggak dibaca, nggak dites. Langsung dirilis."
- **Kartu:** `TERIMA SEMUA` / "nggak dibaca · nggak dites".
- **Frame:**
  - tombol berkedip menggoda; di kata "Diterima", Bayu (merem) menepuk tombol hijau besar `TERIMA SEMUA` (lengannya digambar di atas tombol);
  - peti `</>` jatuh berombongan di setiap ketukan (12 peti, 6 tingkat) dan menara menjulang ke langit, Kursor ikut naik di puncaknya dan menara bergoyang 1 px;
  - penghitung `kode diterima 12 → 2.418`, `dibaca · dites 0 · 0`;
  - di kata "Langsung dirilis", stempel merah `RILIS!` dihantamkan ke menara.
- **Keluar:** wide, lonceng, kapal berangkat, matahari tenggelam, palet sore → malam.

### S5 · Tengah malam · 25,0 – 32,0 · wide ×4 → potongan kapal ×6
- **VO 05:** "Tengah malam... laporan error berdatangan. Tiga puluh delapan bug sekaligus."
- **Kartu:** `BUG: 0 → 38` (hidup) / "tengah malam, error di mana-mana". Jam `23.46 → 23.47`.
- **Frame:**
  - notifikasi merah bertumpuk (maks. 3): `ERROR 500`, `login gagal`, `bayar error`, `crash!`, `timeout`, `data hilang`;
  - palka terpotong (laut depan tidak menutupi bagian bawah garis air), 38 lubang menyembur 2 px, air naik;
  - notifikasi dan jam di langit kiri, tidak menutupi tulisan layar;
  - Bayu masih merem di palka. Balon: Bayu "kok basah?".

### S6 · Bug = kesalahan di kode · 32,0 – 38,5 · close-up palka ×12
- **VO 06:** "Bug itu kesalahan di kode. Semuanya sembunyi di fungsi yang nggak Bayu baca."
- **Kartu:** `BUG` / "= kesalahan di dalam kode".
- **Frame:**
  - jendela kode `login.js` muncul; di kata "di kode", satu baris jadi merah ✗ dengan seekor kumbang di atasnya, berlabel `bug`;
  - di kata "sembunyi", tiga peti berlabel `login()` `bayar()` `keranjang()` bergetar dan retak, lalu 24 kumbang ungu mengalir keluar ke dinding dan setiap gigitan membuat lubang memancar;
  - label `belum dibaca` menunjuk mata Bayu yang merem;
  - Kursor di tangga kiri. Balon: "itu fitur, bos.".

### S7 · Naik pangkat · 38,5 – 44,2 · palka ×12, game di-pause
- **VO 07:** "Tapi tiap bug itu pelajaran. Bayu naik pangkat, dan belajar lima aturan."
- **Kartu:** `NAIK PANGKAT` / "tiap bug = pelajaran".
- **Frame:**
  - dunia digelapkan rata, Bayu tetap terang;
  - setiap kumbang jadi bintik emas yang melengkung ke bar `XP`, dan lubangnya tertambal;
  - bar penuh di "Bayu naik"; di "pangkat": kilat 1 frame, sinar emas transparan berputar di belakang Bayu, Bayu melompat 3 px, kostum bantal leher → bandana, HUD `PENUMPANG → AWAK`;
  - di "lima aturan", 5 slot kosong muncul di HUD.

### S8 · ① Baca dulu · 44,2 – 50,2 · close-up ×16, malam
- **VO 08:** "Satu: baca dulu. Periksa setiap baris yang ditulis AI, sebelum kamu terima."
- **Kartu:** `① BACA DULU` / "periksa sebelum diterima". Slot 1 terisi (`+1 BACA`).
- **Frame:**
  - mata terbuka ("ting": garis cahaya di sekitar kepala) dan kacamata dipakai di "baca dulu";
  - jendela `kode dari AI` (14 baris) di kanan;
  - kaca pembesar turun baris demi baris dan setiap baris dapat ✓;
  - baris 7 merah dengan kumbang, label `janggal?`; di "sebelum" kumbang disentil (bintang kecil) dan terlempar berputar keluar layar, barisnya jadi hijau;
  - semua ✓, lalu centang besar muncul dengan overshoot saat kartu masih tampil.

### S9 · Bos · 50,2 – 52,1 · wide ×4 (tanpa VO)
- Laut bergolak dan layar bergetar 0,25 s, lalu kraken bug ungu naik di kanan (kepala di luar zona tombol TikTok), 3 tentakel melilit haluan.
- Di bawah air, lengan-lengan gelapnya menjulur ke arah kapal.
- Layar berguncang. Papan `BOSS: KRAKEN BUG` + HP 6 segmen membuka seperti kartu.
- Masuk dari S8 dengan tirai pertempuran bergaris ungu.
- Mata Kursor "?". Musik pindah ke tempo tempur.

### S10 · ② Kasih konteks · 52,1 – 60,1 · close-up ×12
- **VO 09:** "Dua: kasih AI konteks. Tujuan aplikasinya, aturannya, dan contoh kode. Jangan suruh dia menebak."
- **Kartu:** `② KASIH KONTEKS` / "tujuan · aturan · contoh kode". Slot 2 terisi.
- **Frame:**
  - balon prompt samar "buatin login" ✗; Kursor "??"; AI menyusun menara tebakan (balok emas/merah) yang miring dan bergoyang di antara mereka;
  - panel `KONTEKS UNTUK AI` dengan ✓ satu per kata: `tujuan: toko online`, `aturan: login pakai email`, `contoh: kode yang sudah ada`;
  - lentera "ide" menyala di atas kepala Kursor dan matanya fokus;
  - di "menebak", menara dicoret ✗ (`AI menebak`) dan runtuh jadi puing; puing hilang dalam kepulan, lalu 3 balok hijau mendarat rapi dengan overshoot ✓. Balon: "oh, gitu maksudnya."

### S11 · ③ Perintah kecil · 60,1 – 67,3 · dek ×10, tentakel di belakang pagar
- **VO 10:** "Tiga: kasih satu perintah kecil setiap kali. Kalau ada yang salah, gampang ketahuan di mana."
- **Kartu:** `③ PERINTAH KECIL` / "satu tugas, satu prompt". Slot 3 terisi.
- **Frame:**
  - meriam laut: kereta kayu bertangga, dua roda berbingkai besi, laras meruncing bercincin dengan bibir moncong; kilat moncong + mundur saat menembak;
  - Kursor mendorong buntelan prompt raksasa (kertas kode diikat tali) `SEMUA SEKALIGUS`, memasukkannya ke moncong (kebesaran), lalu buntelan itu terbang dan meledak jadi asap + hujan kertas di langit kiri (`salah di mana?`);
  - tiga kapsul prompt kecil ditembakkan satu per satu dengan jejak berwarna, masing-masing mengenai tentakelnya (label `login`, `bayar`, `keranjang` di badan tentakel, jadi hijau saat kena);
  - HP 6 → 3.

### S12 · ④ Cek pakai tes · 67,3 – 75,9 · close-up ×16
- **VO 11:** "Empat: cek pakai tes, yaitu kode yang memeriksa aplikasimu secara otomatis. Ada yang rusak, langsung ketahuan."
- **Kartu:** `④ CEK PAKAI TES` / "tes = pemeriksa otomatis". Slot 4 terisi.
- **Frame:**
  - Bayu memegang perisai biru `TES OTOMATIS` di depan dadanya, dengan baris `login` ✓, `bayar` (berjalan), `keranjang` ✓;
  - di "rusak", `bayar` ✗ dan perisai berkedip merah (`rusak: bayar`);
  - Kursor melompat masuk dan membetulkan, lalu `bayar` ✓ dan muncul `TES 3/3 LOLOS`.

### S13 · ⑤ Commit · 75,9 – 83,7 · dek ×10
- **VO 12:** "Lima: lolos tes? Simpan versinya, namanya commit. Kalau nanti berantakan, tinggal balik ke versi ini."
- **Kartu:** `⑤ COMMIT` / "titik aman untuk balik". Slot 5 terisi.
- **Frame:**
  - `TES 3/3 LOLOS` di awal;
  - di "Simpan", kristal simpan muncul dengan overshoot dan melayang di tengah langit, garis pindai menyapu dek (versi disimpan), label `commit · v1`;
  - di "berantakan", tentakel naik di atas pagar lalu menghantam dek di depan, air menyiram, peti dan laptop terlempar (laptop crash merah), kru panik (`berantakan!`);
  - di "tinggal balik", kekacauan yang sama diputar mundur sepanjang lintasannya, dengan garis scan dan sinar titik-titik dari kristal, sampai semuanya persis di posisi v1 (`balik ke v1`).

### S14 · Ulangi · 83,7 – 88,4 · wide ×4, malam → fajar
- **VO 13:** "Ulangi langkah ini untuk setiap tugas, sampai bug-nya habis."
- **Kartu:** `ULANGI` / "tiap tugas, sampai bug habis".
- **Frame:**
  - lingkaran 5 ikon aturan di langit kanan atas (di atas kepala kraken, kapal tetap terlihat), penunjuk berputar 3 putaran (`x1 x2 x3`);
  - setiap putaran: satu tembakan menumbangkan satu tentakel dan satu kristal commit tertinggal di laut;
  - HP habis: kraken tenggelam dengan cipratan, tinta menyebar di dalam air, dan lengan di bawah air ikut tenggelam. Palet melangkah malam → fajar.

### S15 · Bedanya · 88,4 – 96,7 · layar terbelah ×16 → tiang ×6, fajar
- **VO 14:** "Vibe coder menerima semua kode AI. Vibe engineer memeriksanya dulu. Itu bedanya."
- **Kartu:** `VIBE CODER` / "terima semua kode AI" → `VIBE ENGINEER` / "periksa dulu, baru terima".
- **Frame:**
  - **kiri (malam):** Bayu berbantal leher, merem, memukul `TERIMA` berulang;
  - **kanan (fajar):** Bayu berkacamata membaca jendela kode dengan kaca pembesar;
  - sisi yang tidak sedang dibicarakan diredupkan; label `VIBE CODER` / `VIBE ENGINEER` di atas.
- **Sesudah VO (3,5 s):** cut ke tiang. Layar VIBE CODER jatuh, VIBE ENGINEER mengembang satu ketukan kemudian, kamera turun, topi kapten pindah dari Kursor ke Bayu dan keduanya bertukar tempat di kemudi, HUD `AWAK → KAPTEN`.

### S16 · Santai · 96,7 – 100,2 · wide ×4, fajar
- **VO 15:** "Tetap santai pakai AI. Tapi nggak asal."
- **Kartu:** `NEW GAME+` / "santai, tapi nggak asal".
- **Frame:** kapal berlayar ke matahari; Bayu bertopi di kemudi menyeruput es kopi; Kursor mengetik; bantal leher tergantung di tiang.
- **Akhir:** `▶ LANJUT` di posisi kartu, dipilih di ketukan, lalu iris-out ke logo.

### S17 · Closing · 100,2 – ±106
Lihat §8.

## 6. Audio

- **VO:** ElevenLabs Eleven v4, dibuat user langsung di ElevenLabs dalam **satu tarikan** (seluruh 16 baris sekali generate) supaya suara dan nada konsisten:
  - naskah siap-paste: `vo/naskah-elevenlabs.txt`. Teks = `el` di `timeline.js`, yaitu transkrip + tag nada v4 dalam `[kurung siku]`, satu tag per klausa, jeda `...` (v4 tidak mendukung SSML break);
  - satu suara dipilih user; 2–3 rekaman utuh dibandingkan dan dipilih satu (tidak disambung antar rekaman);
  - `npm run vo:bagi -- vo/satu-tarikan.mp3` memotong rekaman jadi 16 file di jeda yang paling cocok dengan proporsi teks (diuji pada audio sintetis: 15 dari 15 batas tepat; `--dry` untuk melihat, `--potong` untuk koreksi manual);
  - pemrosesan sesudahnya: hening dipotong, jeda maks. 0,45 s, **tempo asli**.
- **Sumber waktu:** `timeline.js`. VO elastis; cue besar dikuantisasi ke ketukan babaknya. Kata kunci dicari langsung di transkrip (`at(id, 'kata')`). Posisinya dihitung dari proporsi huruf yang dikunci ke jeda asli di file VO: `vo.js` mengukur jeda ≥ 0,1 s, lalu jeda terpanjang dicocokkan ke tanda baca terdekat dengan urutan tetap. Gambar jatuh di kata yang benar walaupun narator berhenti lebih lama di "Satu:" atau "lolos tes?".
- **Musik:** chiptune hangat, satu tema Bayu:

  | Scene | Tema |
  |---|---|
  | S2–S4 | malas, swing, 90 BPM |
  | S5–S6 | minor |
  | S7 | fanfare pangkat |
  | S8 | fokus |
  | S9–S14 | tempur, 135 BPM |
  | S15–S16 | mayor penuh |
  | S17 | brand |

- **Jingle "+1":** arpeggio 4 nada setiap slot aturan terisi.
- **SFX:**
  - game-over;
  - ketik prompt + kirim;
  - pukulan tombol, peti jatuh di ketukan, stempel;
  - notifikasi error, pancuran;
  - buzz baris merah, derap kumbang;
  - XP naik bernada;
  - "ting" mata terbuka, tik per baris;
  - ledakan peluru raksasa, tembakan kecil + hantaman;
  - perisai, buzzer gagal, chord lolos;
  - kristal berdenting, ombak, putar mundur;
  - blip lingkaran ulangi, lonceng kristal;
  - layar terbelah: klik tombol di kiri, tik baca di kanan;
  - layar mengembang, fanfare kapten;
  - wipe: desis kertas kiri → kanan; tirai pertempuran: deru naik.
- **Mix:** VO men-duck musik −11 dB dan SFX −5 dB. Master −14 LUFS (terukur −14,3 tanpa VO), true peak −1 dBTP.

### File VO
Teks lengkap ada di `vo/naskah-tts.txt` (transkrip + nada + kartu) dan `vo/naskah-elevenlabs.txt` (blok bertag, siap-paste).

| File | Teks |
|---|---|
| `01-karam` | Aplikasinya rusak... Di hari pertama rilis. |
| `02-bayu` | Ini Bayu. Dia vibe coder: bikin aplikasi dengan ngobrol sama AI, tanpa nulis kodenya sendiri. |
| `03-merem` | Saking percayanya sama AI, kodenya nggak pernah Bayu baca. Ngoding sambil merem. Literally. |
| `04-muat` | Kode dari AI? Diterima semua. Nggak dibaca, nggak dites. Langsung dirilis. |
| `05-malam` | Tengah malam... laporan error berdatangan. Tiga puluh delapan bug sekaligus. |
| `06-peti` | Bug itu kesalahan di kode. Semuanya sembunyi di fungsi yang nggak Bayu baca. |
| `07-pangkat` | Tapi tiap bug itu pelajaran. Bayu naik pangkat, dan belajar lima aturan. |
| `08-melek` | Satu: baca dulu. Periksa setiap baris yang ditulis AI, sebelum kamu terima. |
| `09-item` | Dua: kasih AI konteks. Tujuan aplikasinya, aturannya, dan contoh kode. Jangan suruh dia menebak. |
| `10-serang` | Tiga: kasih satu perintah kecil setiap kali. Kalau ada yang salah, gampang ketahuan di mana. |
| `11-cek` | Empat: cek pakai tes, yaitu kode yang memeriksa aplikasimu secara otomatis. Ada yang rusak, langsung ketahuan. |
| `12-simpan` | Lima: lolos tes? Simpan versinya, namanya commit. Kalau nanti berantakan, tinggal balik ke versi ini. |
| `13-ulangi` | Ulangi langkah ini untuk setiap tugas, sampai bug-nya habis. |
| `14-layar` | Vibe coder menerima semua kode AI. Vibe engineer memeriksanya dulu. Itu bedanya. |
| `15-santai` | Tetap santai pakai AI. Tapi nggak asal. |
| `16-follow` | Follow, biar naik pangkat bareng. |

Nama file lama (`09-item`, `10-serang`, …) sengaja dipertahankan supaya tooling tidak berubah.

## 7. Engine & alasannya

**Canvas2D + Node + Chromium headless (Playwright) → FFmpeg**, pola dari `evolusi-layar/`, tanpa impor lintas folder.

Pixel art adalah 2D, jadi kanvas resolusi rendah tanpa smoothing sudah cukup untuk pixel tajam. VO elastis, audio sintetis, preview yang bisa di-seek, render paralel, dan stills sudah ada polanya.

Yang baru di revisi ini:
- skala dunia ×10 dan ×16;
- lapisan ilustrasi ×4 (`src/art/props.js`, digambar di kanvas UI dengan transform ×2);
- kartu penjelas, slot aturan, dan `+1`;
- cue berbasis kata (`at()`);
- tool `vo-bagi.mjs` (pemotong satu tarikan → 16 file).

Frame = f(t) di mana pun. Determinisme dicek 15/15 frame identik.

## 8. Closing + CTA (STYLE.md §1, edukasi)

Tidak berubah dari versi 1:
- iris dari S16 berhenti di jari-jari cincin;
- cincin `#F5F5F5` tergambar dari jam 9;
- ▶ dari `▶ LANJUT` terbang dan pixelnya menghalus 8 → 4 → 2 → 1, lalu mengunci di celah kanan di ketukan (gelombang kejut `#60A5FA`, impact + bell);
- wordmark "Beyond Studio" (Inter Tight 700);
- VO 16 + kalimat **Follow, biar naik pangkat bareng.**;
- pil **+ Follow** → **✓ Following**;
- hold ≥ 1,2 s setelah VO 16.

Geometri logo sesuai STYLE.md §1.

## Lampiran · Referensi → versi ini (`zpsw0UuQkNzvfBVS.mp4`)

| Referensi | Vibe Engineer |
|---|---|
| 16:9, 43 s, kertas buku catatan | 9:16, ±101 s, dunia pixel di laut, palet waktu |
| Pix (chibi, kepala besar) | Bayu chibi 24×32, hoodie mustard, bantal leher → bandana → topi kapten |
| robot putih-biru | Kursor, kursor teks hijau |
| kotak "ASK AI ANYTHING" | kotak prompt `TANYA AI` |
| `ACCEPT ALL` | tombol hijau `TERIMA SEMUA` |
| stempel `SHIPPED!` | stempel `RILIS!` |
| `ERROR 500`, `BUGS: 99+` | notifikasi error bertumpuk, `BUG: 0 → 38` |
| kumbang ungu | kumbang ungu keluar dari peti `</>` (fungsi) |
| `LEVEL UP`, sinar emas | bar `XP`, `NAIK PANGKAT` |
| slot `GEAR`, `+1 PLAN` | 5 slot aturan, `+1 BACA` … `+1 COMMIT` |
| ① plan · ② context · ③ tests · ④ review | ① baca dulu · ② konteks · ③ perintah kecil · ④ tes · ⑤ commit |
| kaca pembesar di dokumen | kacamata + kaca pembesar di jendela kode |
| perisai centang, `TESTS 3/3 PASS` | perisai `TES OTOMATIS`, `TES 3/3 LOLOS` |
| `BOSS: PROD BUG` | `BOSS: KRAKEN BUG`, HP 6 |
| AI menyusun blok blueprint | balok hijau rapi setelah diberi konteks |
| "vibe coder" dicoret → "vibe engineer" | layar terbelah, lalu layar kapal ditukar |
| LV.99 | `NEW GAME+`, topi kapten |
