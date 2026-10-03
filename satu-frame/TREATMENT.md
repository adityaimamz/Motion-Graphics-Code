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
- *(berubah)* **Kamar kita hanya diterangi layar HP.** Di S8 jendela kita satu-satunya yang berpendar putih-dingin di antara tirai-tirai hangat tetangga: plafon putih menangkap genangan cahaya layar, dan pantulannya samar-samar menerangi dinding, lemari, dan kasur. Penonton tahu "itu kamarnya" sebelum kamera masuk. *(berubah lagi)* Yang membuat jendela itu berpendar dari jalan adalah **vitrase** (tirai tipis putih) yang terkumpul di sisi kirinya: kain itu disinari cahaya dingin dari plafon dan meneruskannya ke luar. Dari luar pada sudut tukikan, plafonnya sendiri tidak terlihat.
- *(berubah)* **Kampung yang bisa ditunjuk di peta.** Dari dekat, atap-atapnya Jakarta, bukan perumahan generik: tiang listrik beton dengan kabel melendut dan kusut, toren air, parabola, AC, pagar dan gerbang besi, jemuran. *(berubah lagi)* Dari atas pun terbaca kampung, bukan perumahan:
  - atap campuran: genteng pelana dan limasan, dak beton datar berpagar rendah (toren dan jemuran di atasnya), dan seng miring sepihak;
  - rumah yang tumbuh: kamar tambahan di atas dak, dapur atau warung yang dibangun ke celah tetangga, menyisakan gang selebar ±1 m;
  - lampu teras di samping ±70 % pintu, pintu selalu menghadap jalan atau gang;
  - tanah bukan aspal semua: aspal hanya di tengah jalan, dengan got di kiri-kanan, lalu beton cor yang retak per petak di gang dan halaman, dan sebagian halaman tanah atau rumput. Semuanya basah.
  - Gedung kita berdiri di **ujung gang** (rumah tusuk sate): gang yang dilihat jendela kita berhenti di depan pintunya. Dulu gedung kita berdiri di tengah perempatan.
- **Cerdas tapi kering.** Setiap angka di layar benar, dan kejujurannya terlihat (`λ 1550 nm · inframerah · warna palsu`). Lucunya muncul dari fakta ("Hujan pun berhenti." / "Sinyalnya tidak.").
- **Kecepatan terasa lewat perubahan skala dan laju waktu.** Perubahan laju selalu terlihat (angka × bergulir), dan musik ikut tape-stop / tape-start.

## 3. Palet & tipografi

Default brand: void `#000`, paper `#F5F5F5`, mute `#9CA3AF`, blue `#3B82F6`, blue2 `#2563EB`, ice `#60A5FA`, deep `#1D4ED8`. **Warna sinyal: biru**, yaitu pulsa, gelombang radio, jejak, jam H-tree, foton, dan angka laju.

Penyimpangan (disengaja):
- **Subpixel merah dan hijau** hanya di makro layar (S1, S2 awal, S8 akhir, keluar-loop), karena layar memang tersusun dari emitor R/G/B. R `#FF3B2F`, G `#3DFF7A`, B `#2F5BFF`. Tidak pernah dipakai untuk teks atau UI.
- **Logam redup** (emas pad `#B8A987`, tembaga `#A08A7A`) hanya sebagai material.
- **Lampu kota** = putih hangat samar (LED), tidak oranye sodium. Awan di atas Jakarta memantulkannya sedikit lebih dalam (hangat-gelap), tetap bukan oranye. *(berubah)* Dari bawah, langit mendung dan udara hujan memakai pendar hangat-netral yang sama (horizon ±`#4E4945`, zenit hampir hitam). Tirai jendela yang menyala berwarna hangat, lebih dalam dari lampu jalan. *(baru)* **Lampu teras:** ±60 % bohlam hangat 2.700 K (lebih jingga dari lampu jalan), ±40 % LED putih-netral 4.000 K (sama dengan lampu jalan). Tidak ada yang sedingin layar HP, supaya layar tetap cahaya paling dingin di kota.
- *(berubah)* **Warna kampung** hanya sebagai material: dinding kapur pucat dan cat pudar, atap genteng tanah liat, seng berkarat, dan semen. Ditambah toren oranye/biru/abu, gerbang besi hijau tua/hitam, dan jemuran berwarna pudar, semuanya diredam. *(baru)* Seng: abu seng, karat, spandek biru/hijau pudar, asbes abu. Dak dan tanah: beton cor abu basah, aspal hampir hitam, tanah coklat tua, rumput hijau gelap. Dinding tambahan: plester semen yang belum dicat atau bata.
- *(berubah)* **Cahaya layar HP di kamar** putih dingin (D65, `SCREEN_WHITE`), lebih dingin dari lampu mana pun di luar. Dinding kamar dicat putih pucat netral, sehingga kamar terbaca dingin di samping fasad yang hangat.
- *(berubah)* **Coating serat biru** (serat nomor 1 dalam kode warna TIA-598) hanya sebagai material dinding terowongan di S5. Masih keluarga biru brand.
- *(baru)* **Air Selat Singapura** dan pendar langit malam di jendela Snell (S5 akhir): biru-batu keruh yang diredam, dari pendar kota hangat-netral yang sama dengan S3 setelah disaring air. Hanya sebagai cahaya adegan.
- *(baru)* **Konektor LC biru** di port server (S6): biru adalah kode warna konektor single-mode UPC, jadi keluarga biru brand ini memang ada di dunia nyata. Hanya sebagai material.
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

   *(berubah)* Di tempat gambar di bawah HUD terang, vinyet sudutnya menebal dan melebar, tanpa halo atau outline pada huruf. Tempat itu: emitor menyala saat lensa jatuh ke layar (S1 akhir–S2 awal) dan saat mundur darinya (S9), layar HP putih dalam tukikan S8, dan jendela Snell (S5, lebih ringan). Rentangnya diturunkan dari cue yang ada. Di luar rentang itu HUD identik per piksel.
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
- *(berubah)* **Koaksial punya dua ujung yang nyata.** Kabel mikro-koaksial 0,81 mm menghubungkan dua konektor U.FL:
  - J2 di dekat chip RF, dan J4 di dekat rel;
  - masing-masing berupa receptacle (badan LCP, tab ground timah di kedua sisi, tab sinyal menghadap jalurnya) dengan steker terpasang (cangkang timah, ferrule crimp tempat kabel keluar menyamping), tinggi 1,25 mm.

  Dari J4, jalur microstrip 50 Ω yang pendek menuju pad pegas antena. Papan kini memanjang sampai rel (dulu pad pegas melayang di luar tepi papan). Sablon: `J2`, `J4`, `ANT1`.
- **10,3125:** permintaan lahir. Kilat biru di jalur SoC → RF → J2 → koaksial → J4 → jalur → pegas → titik umpan antena sekaligus (pada ×18.700 listrik tetap instan), lalu memudar. Kamera whip mengikuti jejaknya. *(berubah)* Titik umpan (pegas emas yang menyentuh rel) **tetap menyala biru**: antena masih memancar sepanjang bab ini (satu slot kirim 0,5–1 ms = 9–18 s film).
- **Transisi keluar** *(berubah)*: celah antena adalah lorong nyata selebar 1,5 mm. Plastik pengisinya mundur 0,6 mm dari muka rel, dan tepi celah dibevel. Lensa melebar (50° → 84°) saat masuk. Dinding aluminium tersikat disinari biru dari titik umpan. Di ujung lorong, plastik tembus cahaya berpendar biru tua dengan satu sudut bocor terang di sisi umpan. Kamera menembus pendar itu (kabut biru tua, bukan layar hitam), lalu keluar ke ruangan.
- **SFX:** 4 hit lapisan, dengung papan, zap kelahiran, whoosh whip kiri→kanan, klik celah.

### S3 · Hujan · 13,125 – 20,625 *(berubah: cara menampilkan gelombang)*
- **Teks** (y 1380):
  - 13,59 – 15,2: **Hujan pun berhenti.**
  - 15,47 – 18,28: **Sinyalnya tidak.**
- **Frame kunci:**
  - Keluar dari celah antena, melintasi meja, menembus kaca jendela berbutir air, ke hujan beku. *(berubah)* Tepi HP masih memancarkan cahaya biru samar ke meja dan kusen sampai kubah radio lahir dari titik yang sama (14,53), sehingga ruangan terbaca dan tidak ada frame hitam kosong.
  - *(baru)* **Satu tetes hujan beku, 12 cm di luar kaca (13,5 – 14,0625).** Tepat setelah menembus jendela, kamera mengerem di depan satu tetes yang menggantung diam (Ø 3 mm, sedikit pipih di bawah, bukan berbentuk air mata). Lensa berubah jadi makro:
    - kota di belakangnya melebur menjadi blur lembut dan lampu jalan menjadi bokeh;
    - tetesnya tajam dan tumbuh dengan zoom tetap dari ±50 ke ±360 px, di atas pita caption;
    - di dalam tetes, seluruh kota terbalik: jalan, jendela menyala, dan deret lampu di atas, langit di bawah, dengan tepi gelap pantulan total.

    "Hujan pun berhenti." (13,59) muncul saat tetes itu diam di layar. Lalu kamera **menembus tetes tepat di ketukan 14,0625**, yaitu saat tape-stop ke ×1.000.000 dimulai (hujan berhenti, lalu waktu berhenti). Satu frame dari dalam air, lalu fokus langsung ke jauh dan kamera dilempar keluar dan berbalik menatap jendela. Key 14,4 dan seterusnya (kubah 14,53, menara 18,75) tidak berubah; lesatan keluar jadi lebih cepat.
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
  - *(baru)* **Detail kampung**, hanya di tempat kamera lewat dekat: ±280 m sekitar gedung kita, koridor jalan kabel S4, dan ±140 m sekitar menara. Detail ini memakai aliran acak sendiri, jadi tata letak kota tidak bergeser.
    - **Tiang listrik beton** di setiap lampu jalan (lampu tidak lagi melayang). Lengannya menjangkau ke atas jalan. Dari tiang ke tiang: tiga kabel fase di palang, bundel twist, dan 1–3 kabel telekomunikasi yang paling melendut. Ada sambungan ke rumah-rumah dan gulungan kabel cadangan di sebagian tiang. Kabel digambar sebagai pita minimal ±1,4 px yang memudar bila lebih tipis, sehingga tidak berkedip. Tetes beku menempel di bawah kabel dan berkilau hanya dekat lampu.
    - **Toren air** oranye, biru, abu, atau krem di atas rangka besi yang mengangkangi bubungan.
    - **Parabola** diarahkan ke satelit sungguhan: Telkom-4 (hampir tegak, elevasi 82,6°) atau MEASAT-3 (rendah ke barat-barat laut).
    - **AC luar** dengan noda tetesan di bawahnya.
    - **Tembok depan dengan gerbang besi**, di rumah yang punya halaman ke jalan.
    - **Jemuran beku** di halaman depan, dan di atas dak.
  - *(baru)* **Tanah, atap, dan lampu teras** (seluruh kampung, bukan hanya dekat kamera):
    - **Tanah per zona.** Dulu seluruh tanah satu bidang aspal basah dengan albedo ±1 % yang tidak menerima cahaya langit sama sekali, sehingga celah di antara rumah hitam pekat. Sekarang: aspal di tengah jalan (lebar ±5,4 m), got terbuka di kedua sisi, kerb beton; beton cor yang retak per petak 1,8 m di gang dan halaman; ±25 % halaman sebagian tanah atau rumput. Tanah menerima cahaya mendung (lebih sedikit di gang sempit di antara dinding) dan genangan lampu secara difus. Kilau lampu paling kuat di aspal basah, lebih lemah di lapisan air tipis di atas beton, paling lemah di tanah. Genangan berupa noda lembut berbagai ukuran, bukan pola belang.
    - **Lampu teras** di samping pintu (2,4 m, 22 cm dari dinding). Cahayanya menerangi dinding di sekitar pintu (jatuh seperti titik sedekat itu, sebagian besar ke bawah) dan menggenang di tanah depan pintu. Genangan bohlam hangat dilukis lebih jingga.
    - **Atap**: ±40 % genteng pelana (dengan baris genteng, bayangan di bawah tiap baris, lumut), ±10 % limasan, ±30 % dak beton datar berpagar rendah (rumah tinggi lebih sering dak), ±20 % seng miring yang turun ke arah pintu (gelombang seng 7,6 cm menangkap langit sebagai garis-garis).
    - **Rumah tumbuh**: separuh rumah ber-dak punya kamar tambahan di atasnya beratap seng. ±75 % rumah membangun dapur atau warung satu lantai ke celah tetangga (tidak ke arah pintu, tidak ke jalan), menyisakan gang ±1,2 m.
    - **Tepi kampung tidak lurus**: 15–85 m dari tepi lamanya, di sebagian tempat, blok-blok kota sudah menggantikan rumah. Dulu dari 1,5 km tepi itu terbaca sebagai garis lurus.
    - **Gedung kita di ujung gang.** Gang menuju menara berhenti di depan pintu gedung kita. Kaki-kaki jalan yang dulu bersilang di bawahnya (di belakang dan kedua sisinya) kini rumah (tiga sel di sisi, enam di belakang), tanpa lampu jalan di dalamnya. Fasad gedung kita: plester bertambal, lis beton di setiap lantai, noda hujan dari parapet dan ambang, plint gelap, roster di atas setiap jendela, pintu besi hijau tua berkanopi beton, dan kotak meteran listrik.
  - Butir hujan diam: tajam di bidang fokus, bokeh di depan/belakang, dan hanya sebagian yang berkilau lampu kota.
  - Kota: ribuan atap kampung, gedung dengan jendela menyala, menara seluler rangka baja di ±1,3 km.
  - 14,06: ramp ke ×1.000.000.
  - 14,53: dari jendela lahir **kubah** gelombang radio. Jari-jarinya = c·Δt dari jam fisik. Kamera menatap balik ke jendela. Di permukaan tanah, kubah itu menjadi **cincin biru yang menyapu atap-atap**, dan butir hujan yang dilewatinya menyala.
  - 15,0: kubah menelan kamera.
  - Kamera lalu naik tinggi ke samping dan menyaksikan cincin menyapu kota ke menara. Tepat 18,75 cincin menyentuh menara: kilat di panel, guncangan kecil.
- **18,9–20,6:** garis biru turun di sepanjang kaki menara, kamera ikut turun. Ramp keluar ke ×1.400.
- **SFX:** hujan beku (butir noise yang dibekukan), *(baru)* nada tipis yang naik saat lensa mendekati tetes lalu "plink" tetes air saat menembusnya, tape-stop, nada kubah naik, sapuan yang menembus kamera, denting kristal, impact menara + bell, tape-start, sapuan turun.

### S4 · Pantai · 20,625 – 24,375 *(berubah: ombak pecah diganti laut beku)*
- **Teks:** tidak ada.
- **Frame kunci:**
  - Di pangkal menara, kabel menyala seperti sinar-X di bawah jalan, belok, lalu lurus ke utara melewati pelabuhan.
  - Garis itu **terus keluar ke laut beku** (air hitam mengkilap yang memantulkan lampu pantai, dari tangkapan cube map adegan asli) sampai ke cakrawala. *(berubah)* Tangkapan cube map dulu tidak melihat lampu (lampu ada di layer efek), jadi laut hanya memantulkan langit. Sekarang lampu tanggul dan pelabuhan tampak sebagai goresan di air beku, di bawah langit mendung bergumpal yang berpendar.
  - *(berubah lagi)* Halaman pelabuhan berupa apron beton per petak 6 m dengan noda oli. Jalan kabel dan jalan dermaga beraspal, dengan garis kuning di tepinya. Lapisan air tipis di beton mengaburkan pantulan langit; hanya genangan yang bening. Dulu pantulan tajam dari gumpalan awan terbaca seperti pola loreng.
  - *(berubah)* Jalan kabel di pelabuhan basah dan memantulkan deretan lampunya. Gudang seng yang basah memantulkan langit, dan tanggul disinari lampu-lampunya sendiri.
  - *(berubah)* **Tanggul laut** tidak lagi pita gelap di cakrawala. Bentuknya tanggul raksasa Jakarta: dinding beton cor 2,2 m di atas jalan pelabuhan dengan panel 12 m bersambungan gelap, garis cor, noda hujan yang mengalir, dan kaki yang gelap basah. Di atasnya ada jalan setapak basah dan pagar besi. Lampu-lampu jalan pelabuhan berdiri di tiangnya sendiri di depan tanggul dan menerangi mukanya satu per satu, membentuk pola sisik cahaya.
  - *(berubah)* **Laut beku** di balik tanggul punya ombak yang terbaca: 22 deret gelombang, dari alun 20 m sampai riak 30 cm, menyebar di sekitar arah angin, dihitung per piksel (mesh laut terlalu kasar untuk membawanya, jadi dulu terlihat abu-abu rata). Kaca hitam memantulkan langit mendung. Deret yang terlalu halus untuk satu piksel beralih menjadi kekasaran, sehingga tidak berkilap-kilap.
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
- *(berubah)* **Dasar laut terlihat.** Paket adalah garis cahaya sepanjang 80 m, jadi cahayanya jatuh ±1/r, bukan 1/r² seperti titik. Lumpur Laut Jawa (lanau abu-zaitun gelap, sesekali pecahan cangkang) di kiri-kanan kabel terbaca sebagai hamparan beralur yang diterangi paket, memudar ke air keruh. Dulu hanya beberapa sentimeter dari kabel yang terang.
  - Tiap 2 ketukan paket melewati **penguat**: kilat biru, dan terangnya pulih (gigi gergaji).
- *(berubah)* Kabel selalu terbaring di atas dasar laut (di sepanjang kabel dasarnya tergerus), jadi kamera yang turun ke kabel tidak pernah masuk ke dalam pasir.
- **28,6–30:** kabel terkupas lapis demi lapis (selubung PE → kawat baja heliks → tembaga → tabung baja) sampai berkas serat. *(berubah)* Tepi potongan setiap lapisan menangkap cahaya yang keluar dari dalam. Kawat baja, tembaga, dan tabung punya kilap sendiri. Selubung berpendar biru di sekitar paket. Serat-serat yang gelap tetap tampak sebagai untaian kaca bening (kilau dan tepi Fresnel dari cahaya paket), bukan batang hitam.
- **30–34,5:** **di dalam satu serat.** Inti menyala (mode ±10,4 µm, sedikit melampaui inti) dengan riak halus sepanjang gelombang di kaca. Dinding kelongsong memantulkannya secara total, sehingga inti tampak berulang. Orbit pelan mengelilingi inti. *(berubah)* Terowongannya kini terbaca:
  - dari luar, serat adalah batang biru tembus cahaya (coating akrilat serat nomor 1) dengan inti yang menyala di dalamnya. *(berubah)* Dulu terbaca sebagai baji datar, karena kilau Fresnel memantulkan "lingkungan" berwarna rata di seluruh batang. Sekarang bentuk silindernya terbaca dari cahayanya sendiri:
    - gel di sekeliling gelap, jadi kilau luarnya samar;
    - cangkang coating berpendar paling terang di tempat garis pandang menyinggung kaca (tali busur terpanjang);
    - kaca paling terang di tengah;
    - ketiga batas lapisan (kaca 125 µm, coating primer lunak ±190 µm, coating sekunder keras 250 µm) tampak sebagai garis-garis tipis sejajar, karena sinar yang menyinggungnya terpantul sepanjang batas itu.

    Garis-garis itu menyempit ke titik hilang, sehingga batangnya terbaca sebagai silinder berlapis. Hanya batas di depan lensa yang digambar (tidak ada silang bintang);
  - dari dalam, muka dalam coating menjadi dinding tabung yang berpendar lembut oleh cahaya yang dihamburkan kaca dari mode (hamburan Rayleigh). Dinding lebih terang ke arah titik hilang, karena dilihat menyerempet, jalur cahaya di lapisan buram itu lebih panjang.

  Dulu ruang hitam dengan dua berkas yang terbaca seperti sinar laser.
- **34,5–37,5:** kembali ke skala kabel. Dasar laut naik dan air mendangkal dari ±40 m ke 7,5 m (mendekati Singapura). *(berubah lagi)* Riak pasir melintang dan berkas cahaya miring dihapus:
  - Kamera ikut paket ±1,27 km per frame, jadi motion blur menghapus pola apa pun yang melintang arah gerak.
  - Adegannya malam, jadi berkas ala matahari tidak punya sumber.

  Gantinya, semua yang tahan kecepatan dan punya sumber:
  - **Cahaya dari atas:** pendar langit malam Singapura (hangat-netral, sama dengan S3), meredup eksponensial dengan kedalaman dan disaring air Selat yang keruh (merah terserap lebih dulu). Air berangsur terang ke biru-batu. Eksposur lensa membuka pelan mengikutinya (paket tetap yang paling terang). Lensa juga diperkecil bukaannya supaya dasar laut dekat tetap tajam.
  - **Pita pasir memanjang** (35,2 dan seterusnya): pasir pucat di atas kerikil-cangkang gelap, sejajar arus pasang Selat (kabel diletakkan sepanjang selat), dengan lineasi halus searah arus. Polanya berubah per kilometer, bukan diulang per 5 km, sehingga di MP4 ia bergeser pelan dari frame ke frame dan tidak berkedip. Kabel yang menyala berbaring di alurnya.
  - **Jendela Snell** (±36,7 dan seterusnya): kamera mendongak (pitch sampai ±33°, lensa melebar 54° → 72°). Di atas, seluruh langit terkumpul dalam lingkaran 97°, paling terang di dekat tepinya (tempat cakrawala mendarat) dan ke arah Singapura. Di luar sudut kritis 48,6°, permukaan adalah cermin gelap (pantulan total). Tepinya sedikit bergelombang oleh alun beku yang puncaknya sejajar selat. Lingkaran ini bergerak bersama kamera, jadi tetap tajam di MP4.
- **Transisi keluar** *(berubah, dulu cut keras; berubah lagi)*: pada 0,35 s terakhir, air keruh menutup dan serat yang menyala naik dari kabel di bawah frame. Garisnya setipis rambut (±1,5 px, cahaya ketat dan hamburan air yang lembut), bukan batang buram seperti dulu. Titik awalnya diproyeksikan dari kabel yang sebenarnya, lalu berayun ke posisi serat di baki kabel S6. Di S6, garis yang sama mengikuti proyeksi serat baki per frame sampai air hilang, jadi tidak ada garis ganda.
- **SFX:** hamparan tekanan bawah air, desir paket, ping penguat yang naik nadanya tiap kali, sapuan kupas, nada kaca tinggi, riser.

### S6 · Server · 37,5 – 46,875
- **Teks** (y 1400):
  - 37,97 – 39,0: **Singapura.**
  - 39,375 – 40,6: **Kami perlambat lagi.**
  - 40,78 – 43,0: **Beat ini = jam prosesor.**
- **Label:** `3 GHz ÷ 1.406.250.000 = 128 BPM`.
- **Frame kunci:**
  - Lorong dingin pusat data: rak hitam dengan LED putih (satu biru), lantai berlubang, lampu strip. Serat biru di baki kabel masuk ke satu server. *(berubah)* Dulu abu-abu monoton: lantai terang rata dan bercak cahaya di plafon dari lampu titik tanpa sumber. Sekarang semua cahaya berasal dari benda di ruangan:
    - dua luminer strip memancar ke bawah (lampu area), sehingga plafon di atasnya tetap gelap;
    - lantai naik berupa laminasi HPL gelap yang agak mengkilap (ubin berlubang di depan rak tempat udara dingin naik, ubin polos di tengah). Lantai memantulkan strip dan LED memanjang di sepanjang lorong, dari cube map lorong itu sendiri yang ditangkap sekali;
    - di ujung lorong ada pintu kaca containment berbingkai aluminium, dengan LED lorong berikutnya samar di baliknya;
    - serat patch yang menyala turun dari baki melewati tepi atas rak, menyusuri mukanya, lalu masuk ke port server lewat sangkar SFP dan **konektor LC biru** (single-mode UPC);
    - LED aktivitas port menyala biru sejak paket kita tiba (pulsa LED ±50 ms bertahan ±5 menit film pada ×5.840, jadi menyala sepanjang bab).
  - Menembus bezel ke prosesor: substrat dengan kapasitor, lalu die telanjang (blok inti, cache, baris sel).
  - 38,9: tape-stop.
  - 39,375–43,125, 8 ketukan: **H-tree jam** (12 level). Di setiap ketukan, sisi jam menyala dari akar ke cabang, ±18 ms film per level (≈ 13 ps nyata), lalu flip-flop di ujungnya menyala. *(berubah)* Semua level digambar utuh sekaligus, jadi batang pohon lurus bersih (dulu tergigit cabang halus).
  - *(berubah)* Keterbacaan: selama caption tampil, kilat pohon diredupkan (hingga 85 %) di pita caption dan pojok HUD, dengan tepi lembut. Yang diredupkan hanya cahayanya: permukaan die tetap terlihat, dan tidak ada bentuk yang mengikuti huruf (bukan halo/outline).
  - 43,3: jawaban pergi, seluruh pohon menyala.
- **Tarik mundur:** die → server → lorong → **tembus atap (sekejap gelap)** → 150 km di atas Singapura → 900 km. *(berubah)* Dari 150 km, lampu Singapura tidak lagi kotak-kotak: tekstur 500 m disampel bicubic, lubang satu-texel di inti kota yang jenuh ditambal dari mip berikutnya, dan eksposur lampu diturunkan di bawah ±500 km supaya inti kota tidak putih rata. *(berubah lagi)* Pada 60–500 km kota yang terang adalah jalan-jalannya, seperti di foto dari orbit (data 500 m tidak bisa menunjukkannya):
  - distrik ±4 km, masing-masing dengan grid jalan sendiri (arah, ukuran blok, dan terang berbeda);
  - jalan tol yang melengkung;
  - taman atau waduk gelap di sana-sini.

  Rata-ratanya dijaga ±1, sehingga total cahaya tetap milik NASA. Eksposur lampu di 150 km menjadi 0,35. Dulu gumpalan putih berbintik.

  *(berubah lagi, 44,95–46,8)* Batas antar-distrik tidak lagi berupa garis poligon yang tegas: grid dan terangnya saling membaur sejauh ±600 m, dan perbedaan terang antar-distrik dikurangi separuh. Eksposur lampu turun lagi 40 % (lensa masih disetel untuk lorong). Semuanya kembali ke nilai S7 pada 46,8.
- **SFX:** kipas ruang server, sapuan masuk die, tape-stop; lalu hanya jam (kick kering + klik logam) dengan mekaran akor di setiap kilat; reverse swell, riser naik, lepas "udara".

### S7 · Orbit · 46,875 – 54,375
- **Teks** (y 1400):
  - 47,34 – 50,0: **Lalu pulang.**
  - 50,625 – 53,8: **Tiap klik = perjalanan ini.**
- **Frame kunci:**
  - ±900 km di atas Selat Malaka, menghadap tenggara (pitch ±40°). Lampu malam asli (NASA Black Marble): Jawa di dekat cakrawala, Sumatra di kanan, Singapura di bawah, pinggiran atmosfer biru tua di atas.
  - **Benang biru** rute kabel dengan **kepala pulsa** yang merambat naik dengan kecepatan fisik (996 km dalam 4,9 ms).
  - *(berubah)* **Jakarta di bawah awan hujan**, menyambung dengan dek awan yang dimasuki S8 (dulu Jakarta tampak cerah dan tajam dari orbit, lalu mendadak berawan di tukikan). Dek hujan setebal beberapa km tidak meneruskan cahaya lurus, tapi secara difus (±15–40 %, bukan e^−τ) dan menyebarkannya ke samping sejauh tebal deknya. Kota di bawahnya jadi satu pendar hangat yang lembut, berbintik mengikuti sel-sel konvektif (±15–20 km: tipis lebih terang, inti tebal lebih redup). Lampu tajam hanya tampak di celah awan. Berlaku di skala orbit saja (> ±0,08 km/px), sehingga tukikan S8 di bawah itu identik.
  - 52,5: kamera mulai menukik ke Jakarta.
- **SFX:** nada tinggi tipis untuk kepala pulsa, bell pada "Tiap klik".

### S8 · Pulang · 54,375 – 63,75
- **Teks:** 61,875 – 63,5: **Sampai. Pas satu frame.** (y 520, di atas cakrawala layar).
- **Frame kunci:**
  - Menukik ke Jakarta, masuk **lapisan awan di atas kota**, yang disinari lampu kota dari bawah (sedang hujan). *(berubah)* Dilihat dari atas pada malam hari, awan tidak punya cahaya sendiri. Bagian yang tebal gelap, bagian yang tipis berpendar hangat dari lampu kota di bawahnya (±5× lebih gelap dari sebelumnya, tidak lagi abu-abu terang), dan kota terlihat di celah-celahnya. *(berubah lagi, 54,4–56,1)* Dulu lampu di celah awan terbaca sebagai gumpalan putih "kembang kol". Penyebabnya dua: tepi celah berbutir halus, dan pada 12–30 m/piksel kota tidak punya struktur (di antara skala distrik dan skala lampu tunggal). Sekarang fisikanya sama dengan dari orbit:
    - di bawah awan tipis maupun tebal, kota adalah pendar difus yang menyebar ±3 km ke samping, diredupkan kedalaman optis awan (±20 di tepi tipis sampai ratusan di inti hujan);
    - lampu tajam hanya di celah sejati, yang tepinya lembut;
    - di celah itu terlihat jaringan jalan sampai lampu tunggal mengambil alih.
  - Keluar di bawah awan: karpet lampu kota. Hujan beku muncul di bawah ±400 m. *(berubah)* Lampu-lampu berbaris di sepanjang jaringan jalan yang terpaku ke tanah, dengan genangan cahaya di jalan di antara atap rumah yang gelap. Lampu di jalan melintang juga menyala.
  - *(berubah)* Di bawah dek awan, udara hujan berpendar hangat (kabut lebih tebal di awal tukikan), menyambung dari awan yang berpendar di earth.ts. Dari 1,5 km kota terbaca sebagai jaringan jalan yang menyala di antara blok-blok gelap, dengan jalan utama kampung yang lebih hangat. Makin rendah, rumah-rumah menampakkan jendela, atap basah, dan genangan lampu yang memanjang.
  - *(berubah lagi)* Lampu jalan di depan gedung kita memancar ke bawah dan ke depan, tidak ke atas (dulu sumber titiknya juga menerangi kamar kita menembus dinding). Fasad di atasnya diterangi genangan cahaya di jalan. Dari tukikan, jendela kita yang paling dingin: vitrase putih yang disinari plafon di belakangnya, dan lubang roster di atasnya yang samar memperlihatkan plafon itu.
  - *(berubah)* 57,6–58,6: lampu jalan di depan gedung kita menyinari fasad dari bawah. Jendela-jendela bertirai menyala di relungnya. Pada 57,656 kilat radio jawaban menyalakan ribuan butir hujan biru di depan fasad.
  - *(berubah)* **Kamar kita tidak lagi lubang hitam.** Layar HP (91–95 % putih) adalah satu-satunya lampu kamar. Cahayanya memancar ke atas seperti bidang difus, menjadi genangan putih-dingin lembut di plafon yang dicat putih. Genangan itu memantulkan sedikit cahaya ke bawah, ke partisi 3,6 m di belakang (ada pintu ke lorong gelap), lemari, kasur, dan lantai keramik. Kamar terbaca dingin dan redup di samping fasad yang hangat. Khusus S8: S3 dan S9 identik per piksel dengan sebelumnya.
  - *(berubah)* Eksposur kota (+0,3 stop) masuk saat menembus awan (56,1–56,35) dan keluar saat kamera masuk jendela (58,6–59,3). Meja, HP, dan kaca layar tetap pada eksposur film.
  - *(berubah)* Tukikan dari 1,5 km ke meja memakai jalur kamera monoton: kamera tidak lagi sempat menembus tanah (dulu y −1,5 m di 57,27) atau melewati HP.
  - **57,656: gelombang radio jawaban melintasi kota di dalam satu frame** (pada ×2.500 radio 1,3 km = 4 µs). Tampil jujur sebagai satu kilat biru pada butir hujan.
  - Jendela yang sama, meja, HP dari atas (atas putih, sepertiga bawah masih hitam), menembus kaca ke baris-baris terakhir.
  - *(berubah)* **Tukikan ke kaca tanpa frame gelap** (dulu 59,95–60,9 hampir hitam: kamera menatap tegak lurus ke baris yang belum dilukis). Alurnya kini:
    - 59,53 (ketukan): kamera diam sejenak 7 cm di atas layar;
    - lalu menukik sambil mengangkat pandangan. Lensa selalu membidik satu baris tepat melewati garis refresh, jadi baris putih yang sudah dilukis ada di atas bingkai dan baris gelap di bawahnya;
    - 59,62: begitu bingkai hanya berisi layar (±2 cm), shader layar mengambil alih dan putih terurai menjadi emitor R/G/B, mosaik yang sama dengan S1;
    - 60,15 (denting kaca): lensa menembus permukaan kaca penutup dan tetap di dalamnya sampai mendarat (S9 mundur keluar darinya).

    Baris yang belum dilukis tidak hitam mati: cahaya dari baris yang sudah menyala merambat di kaca penutup dan membuat dinding emitor mati serta debu di kaca berkilau. Kecerahan layar HP di S8 sama dengan S9 (0,5).
  - Garis refresh datang dari kejauhan ke lensa dan **mendarat di baris 2.400 tepat 61,875**. Semua putih.
- **SFX:** riser tukik, sapuan awan, hujan beku, kilauan radio, denting jendela & kaca (kaca: saat lensa menembus kaca penutup), desis "zipper" baris yang makin rapat, **impact + gema + akor D mayor** saat mendarat.

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
  - **sfx:** daftar di storyboard. Semua whoosh di-pan mengikuti layar. *(berubah)* Tetes di S3 punya bunyinya sendiri: nada tipis yang naik selama tahanan (`hujan.hold` → `hujan.drop`) lalu "plink" tetes air tepat di ketukan saat lensa menembusnya. Suara tetes memakai generator acak sendiri, sehingga SFX lain tidak bergeser (dicek: stem SFX hanya berubah di 13,5–16,7 s, termasuk ekor gemanya).
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
- **Revisi terakhir** *(baru)*:
  - **Tetes-lensa** (`sets/drop.ts`): ellipsoid air ditrace analitik di atas frame (setelah DOF), dengan refraksi masuk-keluar, Fresnel, dan pantulan total. Isinya cube map kota yang ditangkap sekali dari posisi tetes (kota beku, jadi satu tangkapan berlaku untuk semua frame). Selama tahanan, adegan kota memakai DOF-nya sendiri (`CityState.dof`); blur DOF kini bisa sampai 64 px.
  - **Detail kampung** (`sets/kampung.ts`): instancing dari aliran acak sendiri (`mulberry32(41)`); daftar rumah dan lampu dikumpulkan tanpa menambah tarikan acak kota. Kabel berupa pita layar (shader sendiri, dua sisi, lebar minimal ±1,4 px, alpha = tebal sebenarnya / tebal gambar) yang membaca medan lampu yang sama.
  - **Tanggul**: `outdoor()` menerima kait GLSL (`Hooks`) untuk permukaan dan cahaya. Tanggul, pagar, dan tiangnya menjumlahkan lampu jalan pelabuhan satu per satu (`QUAY_LIGHT`), karena tekstur genangan berhenti di garis pantai.
  - **Laut beku**: normal ombak per piksel (spektrum 22 deret, memudar ke kekasaran bila lebih halus dari satu piksel); mesh laut kini datar dan kasar.
  - **Kamar**: cahaya layar = SpotLight ke atas (kerucut difus) + RectAreaLight di plafon (pantulan genangan), hanya diisi S8 (`phoneSky`). Material kamar baru tidak memakai hemisphere/direksional lama (`indoor()`).
  - **Layar**: satu kamera satuan layar untuk tukikan S8 yang dipetakan ke meter kamar (serah terima kota → shader layar identik). `leak` di shader layar (default 0; S1/S2/S9 tidak berubah) untuk cahaya yang merambat di kaca penutup.
  - **Dasar laut**: iluminasi sumber garis analitik (selisih atan / r) untuk permukaan; hamburan air tetap memakai model lama supaya air tetap gelap.
  - **Serat**: coating (r 125 µm) sebagai cangkang tembus cahaya dari luar dan dinding buram yang berpendar dari dalam.
  - **Bumi**: `cityGrain` (distrik Voronoi 4 km, grid jalan per distrik, jalan tol dari isoline noise, taman) pada fp 0,03–0,5 km/px.
- **Revisi koaksial–Singapura** *(baru)*:
  - **Varian shader yang menjaga frame lama.** Kode baru yang dipasang di shader bersama membuat kompiler D3D mengurutkan ulang aritmetika, sehingga frame yang tak disentuh bergeser 1 LSB. Karena itu kode baru ditaruh di varian program sendiri (`#if`), dan varian lama adalah shader asli persis:
    - `seabed` polos / `up` (dipilih bila `rise` atau `surf` > 0);
    - `fiber` dalam / luar kaca (dipilih dari posisi kamera);
    - `underwater` / `fibreLine` (garis serat serah terima).
  - **Papan** (`board.ts`): `ufl()` membangun receptacle + steker. Kabel `TubeGeometry` di antara ferrule J2 dan J4. `PULSE_PATH` lewat kedua konektor, jalur, dan pegas. Jejak pulsa 190 titik supaya tikungan di konektor tetap tajam.
  - **Dasar laut** `up`: `surfD` (kedalaman permukaan), `sKm` (jarak rute dalam km tanpa modulo, untuk pola pita pasir), atenuasi per kanal (`KC` pancaran, `KD` difus), refraksi dan Fresnel air–udara per piksel (jendela Snell), `upK()` (eksposur yang membuka). Kamera: pitch, fov, fokus, dan bukaan punya trek sendiri di 35,2–37,5.
  - **Serah terima serat**: `cableOnScreen()` (S5) dan `fibreOnScreen()` (S6) memproyeksikan kabel atau serat yang sebenarnya ke layar setiap frame. Konstanta `FIBRE_A/B` dihapus.
  - **Serat luar**: parameter tumbukan transversal → tali busur cangkang analitik + garis batas lapisan (125/190/250 µm) yang hanya dihitung untuk singgungan di depan lensa. Kilau luar diredam ke 15 %.
  - **Bumi**: pada fp > 0,08 km/px, cahaya kota di bawah awan diambil dari mip ±12 km dan dikalikan transmisi difus `1 / (1 + 0,1125 τ)`, dengan τ dari sel konvektif (`fbm` ±18 km).
  - **HUD**: `backdrop(t)` dari cue (`layar.plunge`, `chip.layers`, `laut.rise`, `pulang.window/glass`, `foton.back`) → vinyet sudut lebih gelap dan lebar.
  - **Pusat data**: `RectAreaLight` per luminer, lantai HPL (roughness 0,2–0,28, metalness 0) dengan `envMap` dari `CubeCamera` sekali di `init`, pintu containment, LED lorong seberang, sangkar SFP + LC + LED aktivitas, serat patch lewat muka rak.
- **Revisi tanah–kampung–pulang** *(baru)*:
  - **Sel kampung** (`kampung.ts`): `isStreet`, `filledCell`, `doorDir`, dan `ihash` (hash integer yang bitnya sama di JS dan GLSL). Rumah, tanah, dan shader dinding memakai aturan yang sama, jadi pintu, lampu teras, dan genangannya selalu cocok.
  - **Aliran acak sendiri**: rumah pengisi `mulberry32(46)`, tipe atap `(44)`, rumah tumbuh `(45)`, blok tepi `(47)`. Undian kota lama tetap ditarik walau hasilnya tidak dipasang, jadi tata letak kota tidak bergeser. Detail dekat-kamera kini memakai aliran per rumah dan per deret tiang (diseed dari sel). Karena itu detailnya terkocok ulang sekali di revisi ini, dan selanjutnya perubahan di satu tempat tidak menggeser tempat lain.
  - **Varian program**:
    - tanah `GROUND_ZONES` (`groundAt`);
    - dinding kampung `KAMPUNG_DOOR` (pintu + lampu teras), tambahan `NO_DOOR`;
    - atap `tile` / `seng` (kait vertex `vRl`, normal bergelombang);
    - fasad gedung kita `facade` (+ `roomGlow`);
    - Bumi `DIVE` (S8) dan `PULL` (S6).

    Program S1, S2, S5, S6 lorong/die, S7, S9, dan S10 tidak berubah.
  - **`Hooks`** kini punya `head`, `norm`, `vhead`, dan `vert`.
  - **Lampu jalan di depan gedung**: `SpotLight` ke bawah (83° + penumbra) di S3, S4, dan S8 (`lampSpot`). S9 tetap memakai titik lama, karena tidak terlihat dari meja dan S9 harus identik. Vitrase juga hanya ditampilkan di S3, S4, dan S8.
  - **Dicek**: maxdiff 0 di 2, 10, 30, 36, 39, 40,5, 42, 43,4, 44,5, 46,8, 50, 62, 63,9, 64,2, 64,6, 65,5, 66, 67,2, 72, dan 74,8 s. Dua kali render pada t yang sama hasilnya identik. Tidak ada "program not valid".
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
| Tetes hujan 3 mm sedikit pipih, bukan berbentuk air mata; di dalamnya kota tampak terbalik | tetes > ±2 mm dipipihkan hambatan udara (rasio sumbu ±0,9). Bola air adalah lensa bola: bayangannya terbalik dan diperkecil |
| Parabola kampung menghadap hampir tegak ke atas | dari Jakarta (6,2° LS, 106,8° BT): Telkom-4 di 108° BT → elevasi 82,6°, azimut ±11° (utara-timur laut); MEASAT-3 di 91,5° BT → elevasi 70,6°, azimut ±292° (barat-barat laut) |
| Serat nomor 1 berwarna biru | kode warna serat TIA-598: 1 biru, 2 oranye, 3 hijau, … |
| Dinding serat berpendar oleh cahaya inti | hamburan Rayleigh di kaca silika, penyebab utama redaman serat (±0,2 dB/km di 1550 nm) |
| Cahaya paket jatuh ±1/r ke dasar laut | sumber garis sepanjang 80 m: iradiansi ∝ sudut yang dibentang ÷ jarak |
| Dari orbit, kota terbaca sebagai jaringan jalan | foto malam dari ISS. Data Black Marble 500 m tidak memuatnya, jadi ditambahkan prosedural dengan rata-rata cahaya dijaga |
| Layar HP menerangi plafon | layar ±500 nit seluas ±0,01 m² ≈ ±5 cd tegak lurus ke atas → ±1 lux di plafon 2,5 m di atasnya. Terang di dalam gambar sedikit dilebihkan supaya kamar terbaca |
| Koaksial antena HP berujung di konektor U.FL, lalu jalur pendek ke kontak pegas | U.FL (Hirose): tinggi terpasang maks. 1,25 mm, untuk kabel mikro-koaksial 0,81/1,13 mm, steker bisa berputar di receptacle. Jalur RF di papan adalah microstrip 50 Ω |
| Di S5 hanya pola memanjang yang terbaca | kamera ikut paket: 204.000 km/s ÷ 2.670 = ±76 km per detik film = ±1,27 km per frame. Pola melintang terhapus motion blur |
| Pita pasir di Selat Singapura sejajar arus | arus pasang kuat di selat membentuk bentuk dasar memanjang (pita pasir, alur) sejajar arus. Kabel diletakkan sepanjang selat |
| Jendela Snell 97° | sudut kritis air–udara arcsin(1/1,333) = 48,6°, jadi seluruh langit terlihat dalam kerucut 2 × 48,6° = 97,2°. Di luarnya permukaan memantul penuh. Radiansi yang masuk air naik n² = 1,78 |
| Cahaya dari atas melemah dengan kedalaman, merah lebih dulu | atenuasi difus air pesisir yang keruh ±0,1–0,3 /m, paling besar di merah |
| Awan hujan dari orbit menjadi pendar lembut kota | transmisi difus awan tebal ≈ 1 / (1 + 0,75 τ (1 − g)), g ≈ 0,85: pada τ 10–60 sekitar 15–45 %, bukan e^−τ. Cahaya disebar ke samping sejauh tebal awan (beberapa km) |
| Coating serat dua lapis | coating primer lunak ±190 µm dan sekunder keras 245–250 µm di atas kaca 125 µm |
| Konektor LC biru | kode warna konektor: biru = single-mode UPC, hijau = APC, krem/aqua = multimode |
| LED aktivitas port menyala sepanjang lorong | pulsa LED aktivitas ±50 ms × 5.840 = ±5 menit film |
| Tanah kampung malam hampir gelap kecuali dekat lampu | permukaan berwarna 12 % di bawah langit seragam memantulkan ±12 % terang langit. Celah antar-rumah terlihat karena lampu teras, jendela, dan lampu jalan, bukan karena langit |
| Beton basah ±12–14 %, aspal basah ±3 %, tanah basah ±4–5 % | albedo material umum; basah menurunkan albedo dan menambah kilap |
| Lampu teras ±1/5–1/10 lampu jalan | bohlam/LED 5–10 W (±500–800 lm) dibanding lampu jalan LED ±60–100 W |
| Lampu jalan tidak menerangi ke atas | luminer jalan LED modern full cut-off: hampir tidak ada cahaya di atas bidang horizontal |
| Rumah tusuk sate | sebutan untuk rumah di ujung jalan berbentuk T yang menghadap lurus ke jalan; lazim di kampung kota |
| Roster di atas jendela | blok ventilasi beton/tanah liat, umum di rumah Indonesia; lubangnya membuka ke ruang di belakang |
| Vitrase berpendar dari luar | kain tipis meneruskan ±30–40 % dan memantulkan ±40–50 % cahaya; disinari dari dalam, ia menjadi permukaan terang yang terlihat dari jalan |
| Awan hujan dari atas gelap di inti, berpendar di tepi | kedalaman optis awan hujan ±20 di tepi tipis sampai ratusan di inti; transmisi difus ≈ 1 / (1 + 0,1125 τ) |

Penyederhanaan yang disadari:
- Kamera terbang lebih cepat daripada yang mungkin secara fisik.
- Lapisan di bawah emitor direnggangkan.
- Foton digambar sebagai titik terlihat.
- Server "di Singapura" bersifat generik.
- Rute kabel bukan kabel bernama.
- Tanggul, kampung, dan kamar bersifat generik (bukan alamat nyata); detail kampung hanya dipasang di tempat kamera lewat dekat.
- Kampung tetap berupa grid sel 10,5 m (tiang, kabel, dan jalur kamera bergantung padanya). Kesan padat datang dari atap, rumah tumbuh, dan gang, bukan dari tata letak organik.
- Genangan lampu teras di dinding tetangga dan di tanah memakai satu tekstur genangan: warnanya hanya dua (hangat atau netral).
- S9 tetap memakai lampu jalan bersumber titik dan tanpa vitrase. Keduanya tidak terlihat dari meja, dan S9 harus identik per piksel.
- Tetes di S3 dan butir hujan beku lainnya tidak jatuh 12 cm selama 13 ms antara S3 dan S8 (medan hujan yang sama dipakai di kedua bab).
- S5 akhir: eksposur lensa membuka ±28× saat cahaya dari atas datang (mata dan kamera beradaptasi; di air 8 m pada malam hari aslinya jauh lebih gelap). Pita pasir ±3 m lebih sempit daripada pita pasir besar di selat (puluhan–ratusan m), supaya terbaca dari ketinggian kamera.
- Serat dari luar: di kabel asli serat terendam gel (indeks mendekati kaca, sehingga tepinya hampir tak terlihat). Potongan ini diperlakukan di udara, seperti adegan kupas. Garis batas lapisan ditegaskan.
- Pusat data dan tata letak lorong bersifat generik.
