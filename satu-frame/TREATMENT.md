# Satu Frame · Treatment

Status: **naskah & treatment disetujui, dibangun** (`app/`). Dokumen ini sudah disesuaikan dengan hasil akhir; perubahan dari rancangan awal ditandai *(berubah)*.
Jenis: edukasi. Durasi 75 s = 40 bar @ 128 BPM (1 ketukan = 0,46875 s, 1 bar = 1,875 s). 1080×1920, 60 fps. Tanpa VO.
Waktu persis ada di `cues.json`; angka di bawah adalah rancangannya.

## 1. Ide

Seluruh video ini adalah **satu kali layar HP menyegarkan gambar**: 16,667 milidetik (layar 60 Hz), diperlambat ribuan sampai miliaran kali. Pojok kiri atas menampilkan jam fisik yang jujur: milidetik yang sedang berjalan dan berapa kali waktu sedang diperlambat. Selama satu frame itu, layar sedang *melukis* frame berikutnya baris demi baris (frame putih), sementara sinyal dari HP menempuh perjalanan pulang-pergi ke server di Singapura. Sinyal itu menembus lapisan layar, keluar lewat antena ke hujan yang membeku, turun ke kabel di bawah jalan, keluar ke laut, menyusuri dasar Laut Jawa di dalam kaca, lalu masuk ke prosesor server. Di sana waktu diperlambat sampai jam prosesor berdetak tepat 128 BPM, sehingga **ketukan musik yang kita dengar sejak awal ternyata adalah jam prosesor itu**. Jawabannya kembali lewat orbit, menukik pulang ke layar tepat ketika garis refresh mencapai baris terakhir, lalu satu foton membawa frame putih itu 30 cm ke mata penonton. Dari putih itu lahir closing. Setelah closing, refresh berikutnya dimulai dan video kembali ke frame 0 **tanpa sambungan**. Satu kamera, tanpa satu pun cut, melintasi sepuluh orde besaran.

## 2. Tone

- **Sunyi yang presisi.** Alam membeku: hujan dan laut berhenti. Yang bergerak hanya sinyal, dan geraknya tegas: melesat, berhenti, melesat lagi, jatuh di ketukan.
- **Fotografi malam yang nyata**, bukan "tech" generik: makro dengan DOF sempit, hitam pekat, highlight dingin. Bloom **hanya** untuk biru sinyal dan emitor layar. Teks putih tidak pernah ber-bloom: ambang bloom dikunci di atas putih kertas.
- *(berubah)* **Kota malam hujan: berpendar hangat, bukan gelap datar** (S3, S4, S8 di bawah awan). Hitam pekat tetap milik makro (S1, S2, S5, S9). Di kota, setiap cahaya punya sumber yang bisa ditunjuk, tanpa lampu isi:
  - langit mendung diterangi kota dari bawah, dengan dasar awan bergumpal yang lebih terang di atas pusat kota;
  - udara hujan berpendar dengan cahaya yang sama, sehingga kota jauh melebur ke langit tanpa garis horizon;
  - lampu jalan menerangi dinding di dekatnya;
  - jalan, atap, dan laut basah memantulkan lampu dan langit;
  - lampu berhalo di udara hujan.

  Halo itu bagian dari adegan, bukan bloom, jadi caption tetap tanpa halo. Kota diberi eksposur +0,3 stop, masuk dan keluar dengan halus di celah antena, permukaan laut, dek awan, dan jendela. Biru sinyal tetap yang paling terang.
- **Cerdas tapi kering.** Setiap angka di layar benar, dan kejujurannya terlihat (`λ 1550 nm · inframerah · warna palsu`). Lucunya muncul dari fakta ("Hujan pun berhenti." / "Sinyalnya tidak.").
- **Kecepatan terasa lewat perubahan skala dan laju waktu.** Perubahan laju selalu terlihat (angka × bergulir), dan musik ikut tape-stop / tape-start.

## 3. Palet & tipografi

Default brand: void `#000`, paper `#F5F5F5`, mute `#9CA3AF`, blue `#3B82F6`, blue2 `#2563EB`, ice `#60A5FA`, deep `#1D4ED8`. **Warna sinyal: biru**, yaitu pulsa, gelombang radio, jejak, jam H-tree, foton, dan angka laju.

Penyimpangan (disengaja):
- **Subpixel merah dan hijau** hanya di makro layar (S1, S2 awal, S8 akhir, keluar-loop), karena layar memang tersusun dari emitor R/G/B. R `#FF3B2F`, G `#3DFF7A`, B `#2F5BFF`. Tidak pernah dipakai untuk teks atau UI.
- **Logam redup** (emas pad `#B8A987`, tembaga `#A08A7A`) hanya sebagai material.
- **Lampu kota** = putih hangat samar (LED), tidak oranye sodium. Awan di atas Jakarta memantulkannya sedikit lebih dalam (hangat-gelap), tetap bukan oranye. *(berubah)* Dari bawah, langit mendung dan udara hujan memakai pendar hangat-netral yang sama (horizon ±`#4E4945`, zenit hampir hitam). Tirai jendela yang menyala berwarna hangat, lebih dalam dari lampu jalan.
- *(berubah)* **Warna kampung** hanya sebagai material: dinding kapur pucat dan cat pudar, atap genteng tanah liat, seng berkarat, dan semen.
- **Meja kayu walnut yang hampir hitam** (S3 awal, S8 akhir, S9) dan **keramik kapasitor coklat-krem** di papan (S2) hanya sebagai material.

Tipografi:
- Inter Tight saja (`fonts/it.woff2`).
- Kalimat utama: 740, maks. 84 px, tracking −0,04 em, naik dari balik mask (outExpo 0,65 s), keluar 0,28 s.
- HUD & label: 500–560, 24–29 px, angka di sel lebar tetap. Format Indonesia: `0,300 000 ms`, `×25.000`.

Satu kalimat utama di layar. Area aman: y 250–1570, x 150–930.

## 4. Motif / benang merah

1. **Jam fisik (HUD).** Kiri atas (x 72, y 272–340), dengan vinyet lembut di bawahnya supaya selalu terbaca:
   - ikon layar 9:16 dengan garis refresh;
   - `t … ms` (desimal bertambah saat waktu melambat: 6 → 9 → 12);
   - `×…` (tepat untuk segmen fisika, 3 angka penting untuk sisanya).

   Hilang saat white-out, kembali saat keluar-loop dengan nilai frame berikutnya (`0,000 000 ms`).
2. **Garis refresh = jam tersembunyi.** 2.400 baris dalam 16,0 ms, lalu blanking sampai 16,667. Terlihat di:
   - S1 (baris 0 → 45);
   - S2 (baris transistor yang menyala: "transistor · baris 61");
   - S3 (layar HP dari atas meja);
   - S8 (baris terakhir, mendarat tepat 61,875);
   - ikon HUD.
3. **Frame putih.** Yang dilukis layar adalah frame putih. Foton di S9 membawanya ke mata (white-out). Closing lahir dari putih itu.
4. **Waktu beku.** Hujan dan laut diam. Hanya sinyal yang bergerak.
5. **Panah = pulsa.** Kilat biru di papan sirkuit, garis kabel, kepala pulsa di orbit, dan panah yang mengunci logo di closing, semuanya satu cahaya biru.
6. **Ketukan = jam.** Kick 128 BPM terdengar sejak detik 0. Di S6 terungkap sebagai jam prosesor 3 GHz yang diperlambat 1.406.250.000 kali.

## 5. Storyboard

### Jam fisik per bab (nilai akhir dari `app/src/clock.ts`)

| Bab | Detik film | Jam (ms) | Laju yang tampil di HUD |
|---|---|---|---|
| S1 Layar | 0 – 7,5 | 0 → 0,300 | ×25.000 |
| S2 Chip | 7,5 – 13,125 | → 0,600 | ×18.700 |
| S3 Hujan | 13,125 – 20,625 | → 1,800 | ×21.000 → **×1.000.000** (14,53–18,6, radio 300 m/s) → ×1.400 |
| S4 Pantai | 20,625 – 24,375 | → 2,300 | ×7.660 |
| S5 Laut | 24,375 – 37,5 | → 7,200 | ×2.670 (pengulang tiap 2 ketukan = 71,6 km) |
| S6 Server | 37,5 – 46,875 | → 8,100 | ×5.840 → **×1.406.250.000** (39,375–43,125) → ×5.260 |
| S7 Orbit | 46,875 – 54,375 | → 13,000 | ×1.520 (996 km dalam 4,9 ms) |
| S8 Pulang | 54,375 – 63,75 | → 16,583 | ×2.500 → ×3.220 |
| S9 Foton | 63,75 – 67,5 | → 16,667 | **×2.800.000.000** (64,66–67,46: 30 cm = 1 ns) |
| S10 Closing | 67,5 – 75 | (HUD hilang) | — |

Laju konstan per segmen, ramp log halus di antaranya. Segmen fisika dipakai persis; segmen lain diskalakan supaya setiap anchor tercapai (dicek numerik: semua anchor tepat). Audio membaca ramp yang sama untuk tape-stop.

---

### S1 · Layar · 0 – 7,5 *(berubah: komposisi)*
- **Teks** (y 600, di atas bagian yang belum dilukis):
  - 0,3 – 3,45: **Video ini cuma satu frame.**
  - 3,75 – 7,05: **1/60 detik. Diperlambat.**
- **Frame kunci:**
  - Kamera makro di tepi atas layar (di atas bezel), 16 piksel-pitch di atas kaca, menatap *ke bawah layar* (pitch 20°).
  - Frame 0: medan subpixel mati, gelap berkilau. Garis es tipis menandai baris 0.
  - 0,17: baris 0 **menyala tepat di depan lensa** (flash tulis). Garis refresh lalu menjauh naik ke frame (±6 baris/detik). Fokus menunggang garis itu. Latar depan: bokeh R/G/B. Dekat garis: berlian R/B dan oval G tajam.
  - Kaca penutup: pantulan ruang gelap, sidik jari samar dan debu yang menyala oleh baris di bawahnya. *(berubah)* Punggung sidik jari berjarak ±0,45 mm (7 pitch piksel), melengkung tak beraturan dan terputus, di dalam noda lembut, bukan cincin konsentris.
  - Lubang kamera depan (punch-hole) di tengah atas layar, sebagai detail nyata. *(berubah)* Lensa: kaca hitam dalam laras (dua undakan tipis), kilau lapisan antipantul ungu-hijau yang samar, satu titik spekular.
- **Gerak:** dolly maju sangat pelan. 7,03–7,5: menunduk dan jatuh ke kaca, di atas baris yang sudah menyala.
- **SFX:** dentang kaca saat nyala pertama, tik kaca per baris (±6/s), dengung refresh yang naik, whoosh jatuh, "tembus kaca".

### S2 · Chip · 7,5 – 13,125
- **Teks:** 10,31 – 12,6: **HP-mu memanggil server.** (y 520).
- **Label:** `kaca · 0,5 mm` · `sensor sentuh` · `OLED` · `transistor · baris {n}` (nomor hidup dari jam) · `papan sirkuit`.
- **Gerak:** turun lurus menembus lapisan, satu per ketukan, dengan roll pelan: kaca → jaring logam sensor sentuh → emitor → backplane TFT (garis gate yang sedang di-scan menyala biru) → substrat → pelat belakang. Lapisan di bawah emitor sengaja direnggangkan (skala aslinya mikron) supaya terbaca.
- **Papan sirkuit (mm):** solder mask hitam, jalur tembaga 45°, pad & via emas, ratusan pasif 01005/0201/0402, SoC package-on-package, kaleng pelindung terbuka, koaksial ke rel aluminium. Satu lampu kunci rendah dengan bayangan nyata, DOF makro. *(berubah)* Pasif sesuai jenisnya: kapasitor MLCC keramik coklat-krem, resistor bertutup hitam, beberapa induktor gelap. Sablon putih di atas mask: garis tepi chip dengan tanda pin-1, garis tepi dan kode komponen (C…, R…, L…, U1, J3, ANT1), tiga fiducial emas.
- **Backplane TFT** *(berubah)*: garis gate/data logam Mo/Al abu-perak, pulau silikon transistor, pelat kapasitor, elektroda piksel ITO berkilau samar di atas kaca gelap (bukan coklat).
- **10,3125:** permintaan lahir. Kilat biru di jalur SoC → RF → koaksial → titik umpan antena sekaligus (pada ×18.700 listrik tetap instan), lalu memudar. Kamera whip mengikuti jejaknya. *(berubah)* Titik umpan (pegas emas yang menyentuh rel) **tetap menyala biru**: antena masih memancar sepanjang bab ini (satu slot kirim 0,5–1 ms = 9–18 s film).
- **Transisi keluar** *(berubah)*: celah antena adalah lorong nyata selebar 1,5 mm. Plastik pengisinya mundur 0,6 mm dari muka rel, dan tepi celah dibevel. Lensa melebar (50° → 84°) saat masuk. Dinding aluminium tersikat disinari biru dari titik umpan. Di ujung lorong, plastik tembus cahaya berpendar biru tua dengan satu sudut bocor terang di sisi umpan. Kamera menembus pendar itu (kabut biru tua, bukan layar hitam), lalu keluar ke ruangan.
- **SFX:** 4 hit lapisan, dengung papan, zap kelahiran, whoosh whip kiri→kanan, klik celah.

### S3 · Hujan · 13,125 – 20,625 *(berubah: cara menampilkan gelombang)*
- **Teks** (y 1380):
  - 13,59 – 15,2: **Hujan pun berhenti.**
  - 15,47 – 18,28: **Sinyalnya tidak.**
- **Frame kunci:**
  - Keluar dari celah antena, melintasi meja, menembus kaca jendela berbutir air, ke hujan beku. *(berubah)* Tepi HP masih memancarkan cahaya biru samar ke meja dan kusen sampai kubah radio lahir dari titik yang sama (14,53), sehingga ruangan terbaca dan tidak ada frame hitam kosong.
  - *(berubah)* Jendela-jendela yang menyala di gedung kita sendiri adalah bukaan yang punya kedalaman:
    - kusen dan palang di muka dinding, lalu relung plester 14 cm yang diterangi dari dalam, dan ambang jendela;
    - di belakangnya tirai kain hangat yang berlipat lembut dan disinari lampu kamar (satu tersingkap sedikit);
    - kaca di depan dengan tetes beku dan kilau langit.

    Tidak lagi rata seperti kardus.
  - *(berubah)* Di bawah jendela kita berdiri tiang lampu jalan. Lampunya menyinari fasad (plester pucat) dari bawah, dan tampak sebagai latar depan saat kamera keluar jendela.
  - *(berubah)* Setiap cahaya punya sumber:
    - **Langit dan udara:** langit mendung berpendar hangat dari kota. Udara hujan (kabut) berwarna sama, jadi kota jauh melebur ke langit tanpa garis horizon.
    - **Lampu jalan:** ada di setiap blok. Genangan cahayanya memanjang searah jalan, sehingga dari atas jalan-jalan terbaca sebagai garis menyala. Genangan yang sama menerangi dinding rumah di dekatnya dan membuat butir hujan beku di sekitarnya berkilau hangat. Setiap lampu berhalo lembut di udara hujan.
    - **Permukaan basah:** aspal memantulkan lampu, gedung, dan langit (pantulan planar, direntang menjadi goresan menuju mata, dengan genangan dan riak beku di tempat tetes jatuh). Atap basah memantulkan langit.
  - *(berubah)* Rumah punya jendela di setiap lantai dan sisi:
    - bingkai putih atau gelap, dan kaca gelap yang memantulkan langit;
    - ±1/3 menyala dengan tirai hangat atau LED; kamar yang tidak menyala tetap redup, bukan lubang hitam;
    - satu pintu, noda hujan di bawah ambang, dan pondasi yang lebih gelap.

    Dari jauh, pola jendela memudar ke rata-ratanya supaya tidak moiré. Di luar kampung, kota diisi ±40 ribu blok beratap datar berjendela di antara jalan-jalan lampu karpet. Menara jauh punya jendela per lantai.
  - Butir hujan diam: tajam di bidang fokus, bokeh di depan/belakang, dan hanya sebagian yang berkilau lampu kota.
  - Kota: ribuan atap kampung, gedung dengan jendela menyala, menara seluler rangka baja di ±1,3 km.
  - 14,06: ramp ke ×1.000.000.
  - 14,53: dari jendela lahir **kubah** gelombang radio. Jari-jarinya = c·Δt dari jam fisik. Kamera menatap balik ke jendela. Di permukaan tanah, kubah itu menjadi **cincin biru yang menyapu atap-atap**, dan butir hujan yang dilewatinya menyala.
  - 15,0: kubah menelan kamera.
  - Kamera lalu naik tinggi ke samping dan menyaksikan cincin menyapu kota ke menara. Tepat 18,75 cincin menyentuh menara: kilat di panel, guncangan kecil.
- **18,9–20,6:** garis biru turun di sepanjang kaki menara, kamera ikut turun. Ramp keluar ke ×1.400.
- **SFX:** hujan beku (butir noise yang dibekukan), tape-stop, nada kubah naik, sapuan yang menembus kamera, denting kristal, impact menara + bell, tape-start, sapuan turun.

### S4 · Pantai · 20,625 – 24,375 *(berubah: ombak pecah diganti laut beku)*
- **Teks:** tidak ada.
- **Frame kunci:**
  - Di pangkal menara, kabel menyala seperti sinar-X di bawah jalan, belok, lalu lurus ke utara melewati pelabuhan.
  - Garis itu **terus keluar ke laut beku** (air hitam mengkilap yang memantulkan lampu pantai, dari tangkapan cube map adegan asli) sampai ke cakrawala. *(berubah)* Tangkapan cube map dulu tidak melihat lampu (lampu ada di layer efek), jadi laut hanya memantulkan langit. Sekarang lampu tanggul dan pelabuhan tampak sebagai goresan di air beku, di bawah langit mendung bergumpal yang berpendar.
  - *(berubah)* Jalan kabel di pelabuhan basah dan memantulkan deretan lampunya. Gudang seng yang basah memantulkan langit, dan tanggul disinari lampu-lampunya sendiri.
  - Kamera terbang rendah mengikutinya, menunduk, dan tenggelam tepat di bar 13 (24,375). *(berubah)* Dilihat dari sangat dekat, pendar kabel tetap berupa garis dan tidak membanjiri layar dengan biru. Di bawah permukaan, garis kabel terus terlihat menembus air keruh dan berbelok ke posisi kabel di dasar laut, sampai kabel dan paket S5 sendiri muncul (±24,9).
- *Alasan perubahan:* ombak pecah yang membeku tidak terbaca di malam gelap tanpa sumber cahaya. Garis kabel yang keluar ke laut lebih bersih dan lebih bermakna.
- **SFX:** angin tipis, napas, boom bawah air.

### S5 · Laut · 24,375 – 37,5 · set utama
- **Teks:**
  - 24,84 – 27,66: **Dasar Laut Jawa.** (y 520)
  - 28,59 – 31,4: **Cahaya. Di dalam kaca.**
  - 31,875 – 33,5: **Tercepat di alam semesta,**
  - 33,75 – 36,9: **tetap butuh 5 milidetik.** *(berubah dari "4": rute 996 km ÷ 204.000 km/s = 4,9 ms)*
- **Label:** `λ 1550 nm · inframerah · warna palsu` · `di kaca: 204.000 km/s (⅔ c)` · `kaca 125 µm · inti 9 µm`.
- **Frame kunci:**
  - Air keruh gelap total. Satu-satunya cahaya adalah **paket data ±80 m cahaya** (500 B pada 10 Gb/s = 400 ns cahaya) di satu serat, bersinar menembus kabel dan menghamburi air.
  - Kamera ikut paket (±76 km per detik film). Dasar laut menjadi garis-garis blur; benda di kabel lewat dalam satu frame.
  - Tiap 2 ketukan paket melewati **penguat**: kilat biru, dan terangnya pulih (gigi gergaji).
- *(berubah)* Kabel selalu terbaring di atas dasar laut (di sepanjang kabel dasarnya tergerus), jadi kamera yang turun ke kabel tidak pernah masuk ke dalam pasir.
- **28,6–30:** kabel terkupas lapis demi lapis (selubung PE → kawat baja heliks → tembaga → tabung baja) sampai berkas serat. *(berubah)* Tepi potongan setiap lapisan menangkap cahaya yang keluar dari dalam. Kawat baja, tembaga, dan tabung punya kilap sendiri. Selubung berpendar biru di sekitar paket. Serat-serat yang gelap tetap tampak sebagai untaian kaca bening (kilau dan tepi Fresnel dari cahaya paket), bukan batang hitam.
- **30–34,5:** **di dalam satu serat.** Inti menyala (mode ±10,4 µm, sedikit melampaui inti) dengan riak halus sepanjang gelombang di kaca. Dinding kelongsong memantulkannya secara total, sehingga inti tampak berulang. Orbit pelan mengelilingi inti.
- **34,5–37,5:** kembali ke skala kabel. Dasar laut naik, cahaya dari atas mulai terasa (mendekati Singapura). *(berubah)* Air berangsur terang ke biru-batu, riak pasir tersinari dari atas, dan ada berkas cahaya miring yang samar (membeku seperti yang lain).
- **Transisi keluar** *(berubah, dulu cut keras)*: pada 0,35 s terakhir kamera mengikuti serat yang menyala naik ke stasiun pendaratan. Air keruh menutup, garis biru berayun ke tempat serat itu menyusuri baki kabel di lorong S6, lalu lorong terbuka di sekelilingnya.
- **SFX:** hamparan tekanan bawah air, desir paket, ping penguat yang naik nadanya tiap kali, sapuan kupas, nada kaca tinggi, riser.

### S6 · Server · 37,5 – 46,875
- **Teks** (y 1400):
  - 37,97 – 39,0: **Singapura.**
  - 39,375 – 40,6: **Kami perlambat lagi.**
  - 40,78 – 43,0: **Beat ini = jam prosesor.**
- **Label:** `3 GHz ÷ 1.406.250.000 = 128 BPM`.
- **Frame kunci:**
  - Lorong dingin pusat data: rak hitam dengan LED putih (satu biru), lantai berlubang, lampu strip. Serat biru di baki kabel masuk ke satu server.
  - Menembus bezel ke prosesor: substrat dengan kapasitor, lalu die telanjang (blok inti, cache, baris sel).
  - 38,9: tape-stop.
  - 39,375–43,125, 8 ketukan: **H-tree jam** (12 level). Di setiap ketukan, sisi jam menyala dari akar ke cabang, ±18 ms film per level (≈ 13 ps nyata), lalu flip-flop di ujungnya menyala. *(berubah)* Semua level digambar utuh sekaligus, jadi batang pohon lurus bersih (dulu tergigit cabang halus).
  - *(berubah)* Keterbacaan: selama caption tampil, kilat pohon diredupkan (hingga 85 %) di pita caption dan pojok HUD, dengan tepi lembut. Yang diredupkan hanya cahayanya: permukaan die tetap terlihat, dan tidak ada bentuk yang mengikuti huruf (bukan halo/outline).
  - 43,3: jawaban pergi, seluruh pohon menyala.
- **Tarik mundur:** die → server → lorong → **tembus atap (sekejap gelap)** → 150 km di atas Singapura → 900 km. *(berubah)* Dari 150 km, lampu Singapura tidak lagi kotak-kotak: tekstur 500 m disampel bicubic, lubang satu-texel di inti kota yang jenuh ditambal dari mip berikutnya, dan eksposur lampu diturunkan di bawah ±500 km supaya inti kota tidak putih rata.
- **SFX:** kipas ruang server, sapuan masuk die, tape-stop; lalu hanya jam (kick kering + klik logam) dengan mekaran akor di setiap kilat; reverse swell, riser naik, lepas "udara".

### S7 · Orbit · 46,875 – 54,375
- **Teks** (y 1400):
  - 47,34 – 50,0: **Lalu pulang.**
  - 50,625 – 53,8: **Tiap klik = perjalanan ini.**
- **Frame kunci:**
  - ±900 km di atas Selat Malaka, menghadap tenggara (pitch ±40°). Lampu malam asli (NASA Black Marble): Jawa di dekat cakrawala, Sumatra di kanan, Singapura di bawah, pinggiran atmosfer biru tua di atas.
  - **Benang biru** rute kabel dengan **kepala pulsa** yang merambat naik dengan kecepatan fisik (996 km dalam 4,9 ms).
  - 52,5: kamera mulai menukik ke Jakarta.
- **SFX:** nada tinggi tipis untuk kepala pulsa, bell pada "Tiap klik".

### S8 · Pulang · 54,375 – 63,75
- **Teks:** 61,875 – 63,5: **Sampai. Pas satu frame.** (y 520, di atas cakrawala layar).
- **Frame kunci:**
  - Menukik ke Jakarta, masuk **lapisan awan di atas kota**, yang disinari lampu kota dari bawah (sedang hujan). *(berubah)* Dilihat dari atas pada malam hari, awan tidak punya cahaya sendiri. Bagian yang tebal gelap, bagian yang tipis berpendar hangat dari lampu kota di bawahnya (±5× lebih gelap dari sebelumnya, tidak lagi abu-abu terang), dan kota terlihat di celah-celahnya.
  - Keluar di bawah awan: karpet lampu kota. Hujan beku muncul di bawah ±400 m. *(berubah)* Lampu-lampu berbaris di sepanjang jaringan jalan yang terpaku ke tanah, dengan genangan cahaya di jalan di antara atap rumah yang gelap. Lampu di jalan melintang juga menyala.
  - *(berubah)* Di bawah dek awan, udara hujan berpendar hangat (kabut lebih tebal di awal tukikan), menyambung dari awan yang berpendar di earth.ts. Dari 1,5 km kota terbaca sebagai jaringan jalan yang menyala di antara blok-blok gelap, dengan jalan utama kampung yang lebih hangat. Makin rendah, rumah-rumah menampakkan jendela, atap basah, dan genangan lampu yang memanjang.
  - *(berubah)* 57,6–58,6: lampu jalan di depan gedung kita menyinari fasad dari bawah. Jendela-jendela bertirai menyala di relungnya. Pada 57,656 kilat radio jawaban menyalakan ribuan butir hujan biru di depan fasad.
  - *(berubah)* Eksposur kota (+0,3 stop) masuk saat menembus awan (56,1–56,35) dan keluar saat kamera masuk jendela (58,6–59,3). Meja, HP, dan kaca layar tetap pada eksposur film.
  - *(berubah)* Tukikan dari 1,5 km ke meja memakai jalur kamera monoton: kamera tidak lagi sempat menembus tanah (dulu y −1,5 m di 57,27) atau melewati HP.
  - **57,656: gelombang radio jawaban melintasi kota di dalam satu frame** (pada ×2.500 radio 1,3 km = 4 µs). Tampil jujur sebagai satu kilat biru pada butir hujan.
  - Jendela yang sama, meja, HP dari atas (atas putih, sepertiga bawah masih hitam), menembus kaca ke baris-baris terakhir.
  - Garis refresh datang dari kejauhan ke lensa dan **mendarat di baris 2.400 tepat 61,875**. Semua putih.
- **SFX:** riser tukik, sapuan awan, hujan beku, kilauan radio, denting jendela & kaca, desis "zipper" baris yang makin rapat, **impact + gema + akor D mayor** saat mendarat.

### S9 · Foton · 63,75 – 67,5
- **Teks:** 64,69 – 67,2: **Terakhir: 30 cm ke matamu.** (y 520, di atas meja gelap).
- **Label:** `30 cm ÷ c = 1 ns`.
- **Frame kunci:**
  - Mundur keluar kaca ke posisi mata penonton, 30 cm di atas HP yang layarnya putih penuh. *(berubah)* HP berupa lempeng bersudut membulat dengan tepi melandai (rangka aluminium), tombol samping, muka kaca hitam, dan layar bersudut membulat dengan bezel tipis serta punch-hole. Meja berupa kayu walnut hampir hitam dengan finishing satin.
  - 63,9: tape-stop ke ×2.800.000.000.
  - 64,66: satu foton lepas dari subpixel biru di tengah layar dan menempuh 30 cm ke lensa dalam 1 ns (posisinya dari jam fisik). Karena lurus menuju lensa, ia diam di layar dan membesar.
  - **67,5: white-out.**
- **SFX:** mundur, tape-stop, satu nada murni yang naik, hening sesaat, noise putih + impact dalam.

### S10 · Closing · 67,5 – 75
Lihat bagian 8.

## 6. Audio

- **Mode:** 100 % sintetis (`audio.py`, 48 kHz), tanpa VO dan tanpa file dari user. 128 BPM, kunci D minor, dengan **D mayor** saat mendarat di S8.
- **Sumber waktu:** `cues.json` (bab, cue, dan jam fisik).
- **Tiga bus:**
  - **jam:** kick di setiap ketukan, tidak pernah di-tape-stop. Lembut di S1–S4, penuh di S5, kering sendirian di S6, lebar di S7–S8, hilang di S9.
  - **musik:** pad, bass 8-an + arpeggio 16-an di S5 dan S8. Kena tape-stop/start persis di ramp jam fisik: 14,06–14,53 / 18,6–19,1; 38,9–39,375 / 43,125–43,6; 63,9–64,66 / 67,46–67,5.
  - **sfx:** daftar di storyboard. Semua whoosh di-pan mengikuti layar.
- **Loop:** 0,6 s terakhir meluruh ke hening, dan detik 0 mulai dari hening.
- **Mix:** peak −1 dBTP, dinormalisasi ke −14 LUFS saat encode. Stem terpisah: `score_music.wav` (jam + musik) dan `sfx.wav`; `score.wav` = mix.

## 7. Engine & alasannya

**three.js + Vite + TypeScript, disalin dari `beyond-studio/app`** (engine port pdoom, MIT): motion blur adaptif (4–108 sub-frame), bloom, grain, player preview, renderer Node + Chrome headless → FFmpeg. Tidak ada impor lintas folder.

Yang baru:
- **Jam fisik** (`clock.ts`), dipakai HUD, garis refresh, gelombang radio, paket, jam H-tree, foton, dan audio.
- **Dunia per skala**, masing-masing dalam satuannya sendiri. Serah terima antar-dunia terjadi di dalam gerak (menembus kaca, celah, air, awan, atap).

  | Dunia | Satuan | Dipakai di |
  |---|---|---|
  | `screen` | piksel-pitch | S1, S2 awal, S8, S9, keluar-loop |
  | `board` | mm | S2 |
  | `city` | m (+ hujan beku, cincin gelombang, laut beku) | S3, S4, S8, S9 |
  | `seabed` | m | S5 |
  | `fiber` | µm | S5 |
  | `datacenter` | m | S6 |
  | `die` | mm | S6 |
  | `earth` | km | S6, S7, S8 |
- **Data asli**, dipanggang sekali oleh `tools/bake_earth.py`: NASA Black Marble (500 m) dan Natural Earth. Hanya S7 yang memakai data Bumi di ketinggian di mana data itu tajam (≥150 km). Di bawahnya, awan dan kota prosedural mengambil alih. *(berubah)* Di ketinggian 150–300 km (tarik mundur S6, awal tukikan S8), texel 500 m yang diperbesar disampel bicubic. Lubang satu-texel di inti kota yang jenuh ditambal dari mip berikutnya. Di inti yang jenuh ada variasi lingkungan ±3 km yang halus (rata-rata 1, sehingga total cahayanya tetap milik NASA). Lebih rendah lagi, cahaya pecah menjadi lampu tunggal di sepanjang jaringan jalan, terpaku ke tanah (dulu ikut bergeser bersama kamera).
- **Optik bokeh per butir** (hujan, lampu): setiap titik cahaya membesar ke lingkaran kaburnya dengan energi tetap. *(berubah)* Piringan bokeh bertepi lembut, sedikit lebih terang di pinggirnya, dengan cincin onion yang samar dan jejak pinggiran warna.
- **Jalur kamera monoton** *(baru)*: tukikan S3 (keluar jendela) dan S8 (1,5 km → meja) memakai `mcamPath` (Fritsch–Carlson per komponen, ketinggian log di atas lantai). Kunci yang berjarak jauh tidak lagi membuat spline berayun balik ke ruangan, menembus meja, atau menembus tanah.
- **Tanpa cut** *(dicek)*: semua batas bab bersambung di dalam gerak. Satu-satunya cut keras (S5 → S6) sudah diganti serah terima lewat serat.
- **Cahaya kota termotivasi** *(baru)*, semuanya di `sets/city.ts`:
  - Langit dan peta lingkungan (PMREM) dari fungsi pendar yang sama. Kabut = warna horizon.
  - Material luar ruang disuntik lewat `onBeforeCompile`:
    - medan lampu dari tekstur genangan yang sudah digambar;
    - hemisphere dan cahaya direksional lama dimatikan di luar ruang (ruangan dan S9 tetap memakainya);
    - bagian dalam gedung kita dikecualikan.
  - Pantulan planar jalan basah di resolusi penuh (kamera dicerminkan pada y = 0, bidang klip, tanpa hujan).
  - Jendela prosedural per instance dengan anti-aliasing ke rata-rata.
  - Halo lampu sebagai sprite adegan (`LightPoints` mode halo).
  - Kilau butir hujan dari medan lampu (`sprites.ts`).
- **Peringatan kompiler shader** *(dibereskan)*:
  - X4000: satu `return` per fungsi di screen, die, dan earth;
  - X3577: pengaman NaN memakai bit (`floatBitsToUint`), karena kompiler D3D membuang `isnan()`;
  - PCFSoftShadowMap → PCFShadowMap.

  Yang tersisa hanya X4122 (catatan presisi dari ANGLE, aman).

## 8. Closing + CTA (STYLE.md §1, edukasi)

- **67,5:** white-out meluruh ke void (±0,5 s). HUD hilang.
- **67,7–68,9:** cincin tergambar simetris dari arah jam 9. Logo di tengah y 790, diameter luar ±390 px.
- **68,4–69,375:** panah terbang masuk dari kiri bawah, miring, dengan jejak cahaya biru (pulsa yang sama dari seluruh film).
- **69,375:** mengunci di celah kanan. Gelombang kejut `#60A5FA`, pop outBack, guncangan kecil, impact + bell (tumpukan Dm9).
- **69,6:** wordmark "Beyond Studio" naik dari mask (Inter Tight 700, 112 px, −0,045 em, baseline y 1135).
- **70,78:** **Kami bedah balik layarnya.** (y 1262).
- **71,25:** pil **+ Follow** pop (y 1392).
- **72,66:** di-tap → **✓ Following**.
- **Hold:** sampai 74,4 (±3 s setelah kalimat selesai).
- Geometri logo sesuai §1. Tidak diputar, dicerminkan, atau diubah proporsinya.
- **74,4–75 · keluar-loop:** end card ternyata tampil di layar HP (baris 240–2160, seperti video 9:16 di layar 1080×2400). Kamera berputar masuk ke bilah hitam di atasnya, isi kartu meluruh, dan pada 75,0 tiba di pose frame 0 dengan HUD `0,000 000 ms ×25.000`. Frame terakhir dan frame 0 sudah dicek berdampingan.

## Lampiran · Catatan fakta

| Klaim | Dasar |
|---|---|
| 1 frame = 16,667 ms | layar 60 Hz |
| Layar dilukis baris per baris dari atas | scan-out panel. 1080×2400 → 2.400 baris dalam ±16 ms |
| Cahaya di serat ±204.000 km/s | indeks bias ±1,47 (⅔ c) |
| Jakarta–Singapura 996 km, ±4,9 ms sekali jalan ("5 milidetik") | rute plausibel lewat Selat Gaspar, timur Bintan, Selat Singapura, mendarat di Changi. Dicek tidak melewati daratan (data Natural Earth) |
| Pulang-pergi dalam satu frame | ping Jakarta–Singapura 10–20 ms di dunia nyata. Kita tampilkan skenario jaringan yang baik. Kalimat di layar tidak mengklaim "selalu" |
| Laut Jawa dangkal | karena itu adegannya malam supaya gelap total |
| Penguat tiap ±72 km | penguat optik kabel bawah laut umumnya berjarak 50–100 km |
| Paket ±80 m cahaya | 500 B pada 10 Gb/s = 400 ns × 204.000 km/s |
| Serat single-mode, inti 9 µm, mode ±10,4 µm, 1550 nm inframerah | standar kabel jarak jauh. Ditampilkan biru = warna palsu (dilabeli) |
| Pantulan total di dinding kelongsong | sinar yang cukup miring memantul penuh (sudut kritis ±44° silika–udara); lapisan pelindung (coating) tidak digambar |
| Jam distribusi H-tree, ±13 ps per level | struktur umum distribusi jam chip, disederhanakan |
| 3 GHz ÷ 1.406.250.000 = 2,133 Hz = 128 BPM | aritmetika |
| Radio melintasi kota dalam satu frame di S8 | 1,3 km ÷ c = 4,3 µs → pada ×2.500 = 11 ms film |
| Antena masih memancar saat kamera masuk celahnya (S2 akhir – S3 awal) | satu slot kirim LTE/5G ±0,5–1 ms. Permintaan lahir di ±0,46 ms jam fisik; celah (12,6 s) ±0,57 ms; kubah radio (14,53 s) ±0,63 ms, jadi semuanya masih di dalam satu slot |
| Jarak punggung sidik jari ±0,45 mm | ±7 pitch piksel (63,5 µm) di layar |
| 30 cm ke mata = 1 ns | 0,3 m ÷ 3×10⁸ m/s |
| Hujan/laut beku | tetes jatuh ±9 m/s ÷ ≥1.400 → ≤ 7 mm/s di layar |

Penyederhanaan yang disadari:
- Kamera terbang lebih cepat daripada yang mungkin secara fisik.
- Lapisan di bawah emitor direnggangkan.
- Foton digambar sebagai titik terlihat.
- Server "di Singapura" bersifat generik.
- Rute kabel bukan kabel bernama.
