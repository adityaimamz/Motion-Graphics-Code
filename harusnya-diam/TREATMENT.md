# Harusnya Diam · Treatment

Status: **naskah, treatment, dan struktur disetujui; dibangun** (`app/`). Dokumen ini sudah disesuaikan dengan hasil akhir; perubahan dari rancangan ditandai *(berubah)* dan dirangkum di bawah.
Jenis: promosi (showreel skill motion design Beyond Studio). 60,0 s = 32 bar @ 128 BPM (1 ketukan = 0,46875 s, 1 bar = 1,875 s). 1080×1920, 60 fps. Tanpa VO.
Waktu persis ada di `cues.json`.

Perubahan sejak naskah gerbang 1:
- **Tanpa footage proyek lama** (permintaan user). Setiap stasiun reaksi berantai sekarang memamerkan satu *skill* motion design, dibuat khusus untuk film ini. Tidak ada aset dari proyek lain kecuali brand kit closing.
- Rujukan Beyond Studio hanya dari `beyond-studio-legacy/`: tesis "gerak punya sebab" (`MOTION-GUIDE.md` baris 8) dan tata letak end card vertikal (`site/template.html`, `site/engine.js` fungsi `S8`).

Perubahan saat dibangun (ringkas; detail di bagian masing-masing):
- **Tata letak papan** mengikuti rantai yang selalu menurun: poster (kiri atas) → flipbook (kanan) → HP (kiri) → penggaris → pop-up (kanan) → kartu GERAK (kiri bawah) → pensil → halaman (bawah). Area kanan atas diisi **lembar storyboard film ini** (8 thumbnail pensil + timecode) dan strip swatch tinta riso, supaya tarik-mundur S7 terbaca sebagai papan kerja desainer.
- **Cahaya:** jendela dari kiri atas + kolam cahaya lembut per setup (seperti panggung stop-motion). Untuk pop-up (S5) ada *bounce card* di depan set, karena panel yang berdiri membelakangi jendela.
- **Chase shot:** tiga perpindahan (flipbook → HP, gelinding di penggaris, lontaran ke kartu) menjadi shot yang mengikuti cakram dari dekat, bukan wide shot yang menunggu.
- **S3** diperpanjang: 46 halaman, empat pantulan di ketukan, keluar 16,875 (bukan 15,0). Cakram mendarat *di atas* halaman lalu menjadi gambarnya.
- **S8:** caption dicetak *di halaman itu sendiri* (tidak ada ruang papan di atasnya). Halaman bertuliskan "brand-mu." lalu terlipat, jadi yang terbang benar-benar brand-mu.
- **Closing:** logo dirakit besar di tengah dulu, lalu mengendap menjadi lockup horizontal legacy di atas.

## 1. Ide

Sebuah papan gambar desainer, miring seperti meja drafting, penuh cetakan risograf yang ditempel masking tape. Poster teratas berbunyi **HALAMAN INI HARUSNYA DIAM.** Titik di ujung kalimat itu tidak mau diam: ia robek lepas dari kertas dan memicu **reaksi berantai** menuruni papan. Setiap benda yang ditabraknya ikut bergerak dan memamerkan satu keahlian motion design: bidang halftone yang beriak seperti air lalu dibekukan waktunya (generatif + manipulasi waktu), flipbook yang menganimasikan bola memantul frame demi frame, prototipe aplikasi dari kertas dengan micro-interaction, kartu pop-up berisi grafik yang menari mengikuti musik film ini, dan deretan kartu huruf yang jatuh bernada. Seluruh dunia kertas bergerak **12 fps** seperti stop-motion. Kamera lalu mundur memperlihatkan seluruh mesin beserta coretan pensil perencanaannya, dan banner di puncak papan akhirnya terbaca: **SEMUA GERAK ADA SEBABNYA.** Di dasar papan tinggal satu lembar kosong yang belum bergerak, yaitu *brand-mu*. Kertas itu melipat dirinya menjadi pesawat dan terbang dengan **60 fps**, satu-satunya gerak mulus di dunia kertas. Pesawat itu menembus papan ke kegelapan dan menjadi panah logo Beyond Studio yang mengunci ke cincinnya.

## 2. Tone & gaya

- **Kerajinan tangan yang presisi.** Semua terlihat dibuat tangan: kertas, tinta riso, tape, pensil, stop-motion. Tetapi timing-nya presisi sampai ketukan. Kesan yang dituju: "ini dikerjakan orang yang peduli detail", lawan dari kilap mulus konten AI.
- **Sebab-akibat yang bisa ditunjuk.** Tidak ada yang bergerak sendiri. Pemicu yang sah hanya sentuhan benda, waktu yang ditahan/dilepas (S2), dan musik (hanya S5, dan datanya jujur dari musik film ini).
- **Lucu yang kering.** Caption berbicara datar seperti desainer yang sedang menjelaskan mesinnya ("Harusnya sih.", "Angka pun ikut bergoyang."). Tanpa emoji, tanpa maskot; titik hitam adalah benda, bukan karakter berwajah.
- **Satu kalimat utama di layar**, dicetak di kertas sebagai bagian gambar, bukan subtitle di atasnya.
- **Tetap terbaca tanpa suara.** Setiap sebab-akibat terlihat. Tidak ada informasi yang hanya ada di audio.

### 2.1 Trend yang ditegakkan (wajib, dicek di setiap still)

| Trend | Wujud di film ini | Di mana | Cara cek |
|---|---|---|---|
| Craft buatan tangan, reaksi terhadap kilap AI | Kertas bertekstur serat, tinta riso dengan misregistrasi dan kepadatan tidak rata, masking tape, coretan pensil perencanaan, kedip cahaya halus per langkah stop-motion | Seluruh S1–S8 | Tidak ada gradien digital mulus atau bayangan "UI" di dunia kertas |
| Tekstur analog | Grain kertas, debu, serat, relief tinta tertangkap cahaya menyapu | Seluruh S1–S8 | Still 100 % memperlihatkan serat kertas |
| Sobekan kertas | Titik robek lepas (0,94), kartu notifikasi robek di perforasi (22,5), pesawat menembus papan (50,6). Tepi sobekan selalu berserat putih | S1, S4, S8 | Tepi sobekan tidak lurus dan tidak bersih |
| Frame rate dikurangi | Dunia kertas 12 fps (satu langkah = 5 frame), langkah di-anchor ke cue agar hentakan tetap tepat ketukan. Grain film juga ditahan per langkah. Hanya pesawat (brand-mu) dan closing yang 60 fps | Seluruh film | Frame dalam satu langkah identik (renderer memakai ulang frame yang ditahan); pesawat berubah setiap frame |
| Generatif berbasis kode: halftone & dither | Semua cetakan dirender shader halftone (layar per tinta bersudut, rosette). S2: riak mengubah ukuran dot, zoom tak berujung dot-dalam-dot, lapisan terdalam dither Bayer 1-bit | Semua cetakan; puncaknya S2 | Tidak ada gambar raster jadi; semua dot dihitung |
| Hybrid 2D/3D | Cetakan 2D di atas kertas 3D; bola gambar flipbook keluar menjadi cakram 3D; pop-up dan origami 3D | S3, S5, S8 | Momen 2D → 3D terlihat di satu frame |
| Kinetic type font variabel | Headline menyempit/melebar bereaksi pada titik; angka penghitung melebar saat cepat; kartu GERAK menyapu sumbu wdth/wght; caption tercetak dengan lebar yang mengembang; CTA closing bobot 260 → 790 (legacy) | S1, S4, S6, S9 | Sumbu font benar-benar berubah, bukan scale |
| Foley ASMR yang taktil | Kertas robek, lipatan, gelinding, tik pensil, klak kartu, direkam "dekat" (kering, detail tinggi) | Seluruh film | Foley terdengar jelas di HP tanpa musik |
| Hit hanya di momen kunci | Maksimal ±10 hit besar (daftar §6). Gerak lain cukup foley halus atau diam | Seluruh film | Hitung hit di stem SFX |
| Sunyi sebagai tanda baca | Hampir sunyi 0–0,94; waktu beku 4,69–5,63; halaman kosong 45,0–46,9; **sunyi total** 51,56–52,50 sebelum logo | S1, S2, S8 | Level RMS di jendela itu |
| Ide tersampaikan ≤ 3 s | "Halaman ini harusnya diam." terbaca sejak frame 0, titik lepas 0,94, "Harusnya sih." 1,88 | S1 | Still 0,0 / 1,0 / 2,5 |
| Shot terbaik lebih dulu | Frame 0 dikomposisikan sebagai poster terbaik film; stasiun paling spektakuler (S2) datang pertama | S1–S2 | Contact sheet: frame 0 dan S2 terkuat |
| Sedikit tapi kuat | Lima stasiun skill, masing-masing satu gagasan, tanpa pengisi | S2–S6 | Setiap stasiun bisa dijelaskan dalam satu kalimat |

## 3. Palet & tipografi

Isi konten memakai palet cetak risograf. Brand kit hanya di closing (S9).

| Peran | Warna |
|---|---|
| Papan (kertas penutup papan gambar) | `#CFC6B4` *(berubah, sedikit lebih gelap agar cetakan menonjol)* |
| Kertas cetak | `#F4F0E8`, sisi bayangan `#D9D2C4` |
| Tinta hitam riso | `#1D1B1A` (sedikit transparan, menumpuk lebih gelap) |
| Riso Fluorescent Pink | `#FF48B0` |
| Riso Blue | `#0078BF` |
| Riso Yellow | `#FFE800` |
| Masking tape | `#E6DABB`, tembus cahaya 30 % |
| Grafit pensil | `#55555A`, opasitas 55–70 % |
| Closing (brand kit) | void `#000`, paper `#F5F5F5`, mute `#9CA3AF`, ice `#60A5FA`, WhatsApp `#25D366` |

Aturan tinta: setiap cetakan maksimal tiga tinta + hitam, dengan misregistrasi 2–6 px per tinta (hash per cetakan). Tumpukan tinta dicampur secara multiply, seperti riso sungguhan.

Tipografi (semua OFL, diunduh ke `app/public/fonts/`):
- **Anybody** (variabel wdth 50–150, wght 100–900): headline, caption, angka, kartu huruf. Caption 820–860, wdth 86–96 (dipersempit otomatis lewat sumbu wdth bila baris terlalu lebar), tinggi huruf besar ≥ 64 px di layar, tinta hitam. Headline dan banner dirata-kanan-kirikan dengan sumbu wdth per baris.
- **Instrument Serif Italic**: sela kering ("Harusnya sih."), tinta pink.
- **Space Mono**: label stasiun di masking tape dan label sumbu, 24–28 px.
- **Architects Daughter**: coretan pensil perencanaan (catatan kecil, bukan kalimat utama).
- **Inter Tight** (dari `beyond-studio-legacy/site/fonts/it.woff2`): hanya closing.

Caption muncul **tercetak**: beberapa huruf per langkah 12 fps; setiap huruf mulai sempit dan pucat lalu mengembang di slotnya sendiri (wdth 60 → lebar akhir, tinta 45 → 100 %), dengan kerning asli font. Caption tetap tinggal di kertas setelah kamera pergi; di tarik-mundur S7 ukurannya < 30 px (tekstur, bukan kalimat utama). Tidak ada outline atau halo.

Area aman: teks penting di y 250–1570, x ≤ 930.

## 4. Motif / benang merah

1. **Titik.** Titik hitam dari ujung kalimat pembuka adalah satu-satunya benda yang menempuh seluruh perjalanan: cakram kertas tebal (±2 cm) yang menggelinding seperti koin, menjadi bola gambar di flipbook, menjadi kenop slider, menjadi penumpang grafik pop-up.
2. **Sebab-akibat.** Setiap gerak punya pemicu yang terlihat di frame (§2). Tesis ini diambil dari prinsip pertama `beyond-studio-legacy/MOTION-GUIDE.md`.
3. **12 fps vs 60 fps.** Dunia kertas stop-motion 12 fps. Gerak mulus 60 fps hanya milik *brand-mu* (pesawat, 49,69) dan closing. Kontras laju frame adalah pesannya.
4. **Semua gambar adalah cetakan.** Tidak ada layar, footage, atau gradien digital di dunia kertas; semua cetakan halftone yang dihitung kode.
5. **Coretan pensil perencanaan.** Garis lintasan putus-putus, tanda ukur, dan catatan kecil ("± 2 cm", "jatuh di ketukan", "12 fps") di sekitar setiap stasiun. Baru terbaca sebagai cetak biru mesin di S7.
6. **Motif bunyi.** Lima klak kartu bernada di S6 adalah lima nada yang sama dengan lonceng logo di closing.

## 5. Storyboard

Waktu dalam detik (1 ketukan = 0,469; 1 bar = 1,875). Dunia: papan gambar dari kertas yang direntang (±1,5 × 2,6 m; mesinnya ±1,1 × 1,96 m), miring seperti meja drafting; kamera hampir tegak lurus papan, jadi "turun" di layar = menuruni papan. Cahaya jendela hangat dari kiri atas, menyapu (raking) supaya serat dan relief tinta terlihat; bayangan lembut; kolam cahaya per setup. Lensa setara ±65 mm (FOV vertikal 30°), DOF hanya di shot miring.

Tata letak papan *(berubah, lihat `app/src/layout.ts`)*: banner di puncak; poster kiri + storyboard dan swatch kanan; flipbook kanan-tengah; HP kiri-tengah; penggaris dari HP ke pop-up (kanan bawah); kartu GERAK kiri bawah; pensil dan halaman di dasar. Lintasan titik zig-zag menuruninya dan digambar dengan pensil (lintasan sebenarnya).

### S1 · Hook · 0,000–3,750 (bar 1–2)
- **Teks:** poster "HALAMAN INI / HARUSNYA / DIAM." (sudah ada di frame 0) → 1,875 "Harusnya sih."
- **Frame kunci (0,000), dikomposisikan sebagai still terbaik film:**
  - Poster A2 mengisi frame.
  - Headline Anybody 900, tiga baris; dua baris pertama dirata-kanan-kirikan lewat sumbu wdth (HALAMAN INI sangat sempit, HARUSNYA lebih lebar), DIAM wdth 72. Tinta hitam dengan bayangan tinta pink yang meleset.
  - Titik: cakram hitam Ø ±64 px di ujung "DIAM" (x ±560, y ±760), dengan serat kertas mulai terlihat di tepinya.
  - Bawah (y 900–1560): bidang halftone pink + biru, rosette halus, gradien lembut.
  - Crop mark pensil di sudut poster; dua potong masking tape di sudut atas; label tape kecil "01 · tipografi kinetik" (x 96, y ±1500).
- **Gerak:**
  - 0,000–0,938: titik bergetar per langkah; di bawahnya kawah sobekan mulai terlihat. Huruf "DIAM" menyempit (wdth 72 → 62) seperti menahan napas.
  - 0,938: titik robek lepas (meninggalkan kawah serat putih) dan rebah ke tepinya. "DIAM" memantul dengan pegas (wdth 62 → 74). *(berubah: rentang lebih kecil agar M tidak menabrak kawah)*
  - 0,938–3,750: titik menggelinding di tepinya seperti koin, melengkung turun ke bidang halftone, lalu berputar makin rendah dan makin cepat (Euler's disk). Ia rebah tepat di 3,750 di tengah bidang (x 540, y ±1230).
  - 1,875: "Harusnya sih." tercetak rata kanan di bawah bekas titik, Instrument Serif Italic, tinta pink. *(berubah: di bawah, bukan di kanan, supaya tidak menimpa kawah)*
  - Kamera diam (locked-off) sampai 2,8, lalu dolly-in bertahap ke bidang halftone.
- **Transisi keluar:** tanpa potong; cakram rebah = ketukan pertama S2.
- **SFX:**
  - Hampir sunyi: nada ruang, kertas menegang (krek halus) 0–0,9.
  - **0,938 *tik* sobekan** (hit 1), kering, di tengah.
  - Gelinding: desis halus mengikuti posisi x (stereo).
  - 2,8–3,75: dengung Euler's disk makin cepat (riser alami), berhenti mendadak di 3,75.

### S2 · Generatif + waktu · 3,750–13,125 (bar 3–7)
- **Teks:** 4,688 "Bentar, / waktunya kita pause."
- **Label tape:** "02 · generatif · time remap"
- **Frame kunci (5,000):**
  - Bidang halftone mengisi frame (y 250–1700), permukaan kertasnya bergelombang 3D seperti air: riak konsentris dari cakram, ±4 mm.
  - Dot membesar di puncak dan mengecil di lembah; tinta bergeser pink ↔ biru mengikuti fase riak.
  - Cakram hitam melayang ±3 cm di atas puncak riak (x 540, y ±1100), bayangannya jatuh di kertas. Serpih serat kertas beku di udara.
  - Caption dicetak hitam *di atas* bidang halftone (bagian atasnya), dua baris: riso klasik, teks di atas gambar. *(berubah)*
- **Gerak:**
  - 3,750: cakram rebah → riak pertama menyebar dari titik itu (gelombang analitik). Ukuran dot = gambar dasar + riak.
  - 4,219: puncak riak kedua melontarkan cakram ke atas.
  - 4,688: **waktu berhenti.** Riak, cakram, dan serpih serat membeku. Caption tercetak.
  - 4,688–5,625: kamera orbit ±35° mengitari cakram (bullet time, 12 fps), memperlihatkan bahwa kertasnya benar-benar bergelombang.
  - 5,625–6,094: kamera 3D menyelam ke satu dot pink bertone sedang di kiri bawah pendaratan (jauh dari caption dan bayangan cakram).
  - 6,094: serah terima ke pass 2D yang mereplikasi cetakan poster persis (tekstur, sudut layar, misregistrasi, serat, riak, cahaya). Mulai di sini zoom menyelam; setiap ketukan (6,563 / 7,031 / 7,500) mendarat tepat saat sebuah dot memenuhi layar dan di dalamnya tampak **seluruh bidang (matahari + riak beku) dicetak ulang** dengan tinta berikutnya: pink → biru (ungu di atas pink) → kuning (hijau di atas biru) → dither Bayer 1-bit hitam. Setiap tingkat = gambar yang sama diskalakan 2^6,25 kali (Droste sejati).
  - 7,500: tingkat terdalam: gambar yang sama sebagai dither Bayer 1-bit. Tahan satu ketukan.
  - 7,969–8,906: tarik mundur cepat melewati semua tingkat, kembali ke adegan beku.
  - 9,375–10,313: waktu dilepas pelan: jarak waktu per langkah membesar dari 0 ke normal (ramp), langkah tetap 12 fps.
  - 10,313–13,125: riak berjalan lagi; cakram jatuh tepat di 10,313, "berselancar" di puncak riak lalu melambat di tepi kanan poster (ancang-ancang), melompat dari tepinya (12,188) dalam busur tinggi (±110 mm, ±11 pose) dan mendarat tepat 13,125 di flipbook; kamera mengikuti busurnya (chase). *(berubah: lompatan diberi waktu dua kali lipat, sebelumnya terasa seperti teleport)* *(berubah: tepi kanan)*
- **Transisi keluar:** kamera tilt turun bertahap mengikuti cakram.
- **SFX:**
  - **3,750 hit musik pertama** (hit 2): sub + akor hangat; groove 2-step mulai, dibangun dari foley kertas.
  - 4,219: pop kecil.
  - 4,688: tape-stop, musik melengkung turun ke **sunyi**; tersisa nada "udara beku" tipis.
  - Menyelam: whoosh granular lembut + tiga blip bernada naik di tiap tingkat.
  - 7,500: klik bitcrush kecil. Tarik mundur: reverse whoosh.
  - 9,375: tape-start. 11,250: groove utuh lagi.

### S3 · Frame-by-frame · 13,125–18,750 (bar 8–10)
- **Teks:** 13,594 "Jadul? / Masih jalan kok."
- **Label tape:** "03 · frame-by-frame · 12 fps"
- **Frame kunci (14,000):**
  - Flipbook 210 × 150 mm (±780 px di layar) di tengah, diikat strip karton + dua staples di **tepi kanan**; halaman membalik ke kanan, menjauhi jendela, jadi bayangannya jatuh keluar buku. *(berubah)*
  - Di halamannya: gambar pensil + satu tinta pink, bola memantul (squash & stretch), jejak onion-skin pensil samar, bagan timing animator (garis tik) di margin.
  - Caption di slip kertas di atas buku.
- **Gerak:** *(berubah)*
  - 13,125: cakram mendarat di atas halaman teratas, jauh dari engsel. 13,208: cakram **meresap**: ia pipih rata di atas cetakan hitam dirinya sendiri (posisi dan ukuran sama). 13,292: tinggal cetakannya, dan halaman 01 mulai membalik. Tinta bola lalu berubah dari hitam ke pink riso selama empat halaman (3D → 2D tanpa lompatan). *(berubah)*
  - 13,292–16,875: 45 halaman membalik, satu per langkah 12 fps (tiga di udara sekaligus). Di halaman: bola pink halftone dengan garis grafit, onion-skin dua frame sebelumnya, lintasan rencana pensil biru non-foto, bagan timing, nomor frame tulisan tangan. Bola memantul empat kali di ketukan (13,594 / 14,531 / 15,469 / 16,406), makin tinggi, squash saat menyentuh ("squash!"), stretch di udara.
  - Di empat halaman terakhir tinta bola kembali hitam. 16,875: bola hitam tepat di tepi kiri halaman, dan cakram 3D muncul pipih di atas cetakan itu; 16,958: cakram menebal dan terangkat lepas dari kertas (**2D → 3D tanpa pose kosong**). *(berubah)*
  - 16,875–18,750: chase shot: kamera mengikuti cakram yang melengkung tinggi ke toggle HP.
- **SFX:** desir masuk halaman; kibaran halaman *brrrt* 12 Hz (laju frame-nya terdengar); empat "tok" kayu bernada turun di tiap pantulan; **16,875 *pop* keluar ke 3D** (hit 3).

### S4 · UI motion · 18,750–26,250 (bar 11–14)
- **Teks:** 21,094 "Tombol yang bikin / gatel pengin dipencet."
- **Label tape:** "04 · UI motion · micro-interaction"
- **Frame kunci (21,094):**
  - Prototipe HP dari kertas: bingkai dipotong, antarmuka digambar pensil dan dicetak riso. Lebar ±560 px, y 600–1560, x 260–820.
  - Komponen: toggle (atas), slider dengan penghitung angka di roda kertas (tengah), tombol "Kirim" (bawah).
  - Cakram hitam menjadi kenop slider, di ujung kanan jalur.
  - Caption di atas (y 330–470).
- **Gerak:**
  - 18,750: cakram mendarat di kenop toggle "Mode diam" yang menyala → toggle bergeser **OFF** dengan pegas (overshoot sekali); tab pink tertarik. *(berubah: mode diam dimatikan)*
  - 19,219: toggle menjatuhkan cakram ke jalur slider; cakram menjadi kenop dan bergerak kiri → kanan (ease in-out) sampai 20,625.
  - Angka penghitung bergulir 0 → 100 (Anybody, digit lebar tetap); huruf melebar saat bergulir cepat, menyempit saat pelan.
  - 21,094: kenop menekan "Kirim": tombol turun (lapisan kertas tertekan, bayangan menyusut) lalu naik.
  - 20,625–21,094: cakram jatuh dari ujung slider ke tombol "Kirim" (tombol kertas di atas riser 3 mm).
  - 22,031: toast "Terkirim" turun dari celah di bawah status bar (pegas), masih menempel lewat tab berperforasi.
  - 22,500–23,438: toast **robek** di perforasi (stub tetap di celah), melayang turun di atas layar sambil berputar, lalu menabrak cakram (secondary action), melayang ke kiri, dan mendarat rata di papan di kiri bawah HP lalu diam (terlihat lagi di tarik-mundur).
  - 23,438–26,250: cakram terlempar ke tepi HP, jatuh ke penggaris kayu, lalu menggelinding di tepinya menuruni penggaris ke kartu pop-up. Chase shot rendah dari sisi kanan.
- **Transisi keluar:** tilt turun mengikuti penggaris.
- **SFX:** klik tab toggle (renyah); desir geser + tik penghitung halus; **21,094 *thock* tombol + bloop UI** (hit 4); desis kartu meluncur; **22,500 sobekan perforasi ASMR** (hit 5); gelinding.

### S5 · Infografis audio-reaktif · 26,250–33,750 (bar 15–18)
- **Teks:** 28,125 "Angka pun ikut bergoyang."
- **Label tape:** "05 · infografis · audio-reactive"
- **Frame kunci (29,000):**
  - Kartu pop-up terbuka 90° (sampul tegak di belakang). Delapan batang kertas pop-up (V-fold) berdiri di atas sumbu tercetak, di tengah frame (y 700–1450); tinta kuning/pink/biru bergantian.
  - Label sumbu kecil (Space Mono 24 px): "tinggi batang = musik video ini, per pita frekuensi".
  - Cakram duduk di atas batang bass (paling kiri).
  - Caption di atas.
- **Gerak:**
  - 26,250: cakram jatuh ke sampul kartu tertutup ("DATA") → sampul terbuka pada engselnya dengan pegas (26,25–27,19), mengangkat cakram lalu menjatuhkannya ke puncak batang bass; batang terangkat bersama kartu. Kamera turun ke sudut rendah; bounce card menerangi panel dari depan.
  - 27,188–31,875: tinggi batang = energi musik per pita, dihitung dari stem musik film ini (bukan animasi manual). Tetap 12 fps.
  - 31,875: hentakan bass memuncak dan batang bass melontarkan cakram melengkung ke kiri.
  - 31,875–33,750: cakram melayang ke deretan kartu huruf.
- **SFX:** kepak sampul + derit lipatan. Di sini musik yang memimpin (bassline ditonjolkan). 31,875 aksen kick = lontaran.

### S6 · Ritme & suara · 33,750–39,375 (bar 19–21)
- **Teks:** 35,625 "Sampai suaranya / kami atur."
- **Label tape:** "06 · ritme · sound design"
- **Frame kunci (35,300):**
  - Lima kartu huruf G · E · R · A · K yang sudah rebah menghadap atas, berderet di birai kertas (y 900–1250, x 110–930).
  - Hurufnya Anybody dengan sumbu yang menyapu: G tipis-sempit (wght 320, wdth 74) → K hitam-lebar (wght 900, wdth 150). Nilai sumbu tercetak kecil di tiap kartu. *(berubah: G ekstrem terbaca sebagai "I")*
  - Caption di atas.
- **Gerak:**
  - 33,750: cakram menabrak kartu G → kartu jatuh berurutan per ⅛ ketukan (33,750 / 33,984 / 34,219 / 34,453 / 34,688); setiap kartu rebah memperlihatkan hurufnya.
  - 35,156: kartu K menyenggol pensil; pensil mulai menggelinding pelan menuruni papan, menuju halaman kosong.
- **SFX:** lima *klak* kartu bernada pentatonik naik (lima nada lonceng logo, dibocorkan lebih awal); pensil kayu menggelinding di kertas.

### S7 · Tarik mundur · 39,375–45,000 (bar 22–24)
- **Teks:** banner di puncak papan, **SEMUA GERAK / ADA SEBABNYA.** Sudah ada sejak awal (di luar frame S1), baru terbaca sekarang. Anybody 900 dirata-kanan-kirikan lewat wdth, tinta hitam + pink meleset di atas latar halftone kuning.
- **Frame kunci (42,200):**
  - Seluruh mesin mengisi 9:16: banner di atas (y ±250–470), poster, lembar storyboard + swatch, flipbook, HP dengan toast robek, penggaris, pop-up yang batangnya masih menari, huruf GERAK, pensil, halaman di dasar.
  - Coretan pensil perencanaan menghubungkan semua stasiun: garis lintasan putus-putus yang cocok dengan lintasan sebenarnya, tanda ukur, catatan kecil.
- **Gerak:**
  - 39,375–42,188: kamera tarik mundur bertahap (12 fps) sampai seluruh papan terlihat.
  - 42,188–43,125: tahan baca banner.
  - 43,125–45,000: kamera turun mendekat ke halaman kosong mengikuti pensil.
- **SFX:** **39,375 drop penuh** (hit 6, terbesar); 43,125 musik ditipiskan (filter turun).

### S8 · Halaman kosong · 45,000–52,500 (bar 25–28)
- **Teks:** 45,000 "Tinggal satu yang / belum bergerak:" → 45,938 "brand-mu." (pink, besar), **dicetak di halaman itu sendiri** dan terbaca utuh sebelum kertas mulai bergerak. *(berubah)*
- **Frame kunci (46,000):**
  - Selembar kertas A5 mendatar (lebar ±690 px) di tengah frame, bayangan lembut; captionnya mulai tercetak di atas kertas itu.
  - Pensil sudah berhenti di tepi atasnya.
- **Gerak:**
  - 45,000: pensil menyentuh tepi kertas dan berhenti.
  - 47,344 / 47,813 / 48,281 / 48,750: kertas melipat dirinya menjadi pesawat dart, satu lipatan per ketukan (12 fps, tiga langkah per lipatan): sudut ke garis tengah, tepi ke garis tengah, dilipat dua (V), sayap dibuka datar. Tulisannya ikut terlipat; "brand-mu." terbawa di badan pesawat.
  - 48,750–49,688: pesawat diam dua ketukan. *(berubah: lipatan satu ketukan lebih lambat supaya caption sempat dibaca)*
  - 49,688: pesawat lepas landas: meluncur rata dari halaman, lalu naik ke arah kamera. **Gerak 60 fps pertama** di dunia kertas; papan di sekitarnya tetap 12 fps. Kamera mengikutinya dengan mulus (motion blur adaptif aktif).
  - 50,625: pesawat menembus kertas papan (sobek, tepi berserat) ke kegelapan di baliknya; kamera ikut masuk lewat lubang.
  - 51,563–52,500: gelap total.
- **Transisi keluar:** lubang sobekan → void closing.
- **SFX:**
  - 45,000: ketukan pensil kecil, lalu **hampir sunyi** (nada ruang + derit kertas).
  - Empat lipatan renyah (ASMR).
  - 45,938–49,688: sub lembut naik.
  - **49,688 luncuran:** nada sintetis bersih melengkung, suara "digital" pertama sebagai kontras dengan foley (hit 7).
  - **50,625 sobekan besar** (hit 8).
  - 51,563–52,500: **sunyi digital total.**

### S9 · Closing · 52,500–60,000 (bar 29–32)
Lihat §8.

## 6. Audio

- **Mode:** 100 % sintetis (`audio.py`, numpy/scipy), tanpa VO dan tanpa file dari luar.
- **Sumber waktu:** `cues.json`, dibaca app dan `audio.py`. Hentakan visual di dunia 12 fps jatuh di frame cue karena langkah di-anchor ke cue.
- **Musik:** 128 BPM, groove 2-step bergoyang (swing 16-an ±58 %).
  - Kit drum dibangun dari foley kertas: kick = hentakan papan, snare = tamparan kertas, hat = tik pensil.
  - Bass, akor hangat, pluck. Kunci D♭ mayor; lima nada kartu S6 = D♭ E♭ F A♭ B♭; lonceng logo memakai nada yang sama.
  - Aransemen: S1 tanpa musik → S2 musik masuk → tape-stop/tape-start → lapis demi lapis per stasiun → drop penuh S7 → hampir sunyi S8 → sunyi total → closing.
- **Ruang:**
  - Dunia kertas: foley dekat, kering, hampir mono, detail tinggi.
  - Pesawat dan closing: lebar, bersih, ber-reverb. Kontras ruang = kontras 12 / 60 fps.
- **Hit besar (maks. ±10):** 0,938 sobekan titik · 3,750 musik masuk · 16,875 pop 2D→3D · 21,094 tombol · 22,500 sobekan perforasi · 39,375 drop · 49,688 luncuran · 50,625 sobekan tembus · 54,375 kunci logo + lonceng · 58,125 tap WhatsApp.
- **Sunyi:** 0–0,94 (hampir) · 4,69–5,63 (beku) · 45,0–46,9 (hampir) · 51,56–52,50 (total).
- **SFX lain (halus, bukan hit):** krek kertas, gelinding (stereo mengikuti x), dengung Euler's disk, blip Droste, klik bitcrush, kibaran flipbook 12 Hz, tok pensil, klik toggle, geser slider, tik penghitung, desis notifikasi, kepak pop-up, lima klak bernada, pensil menggelinding, empat lipatan, kilau cincin, whoosh panah, pop CTA.
- **Data S5:** `audio.py` merender stem musik dulu, lalu menghitung energi 8 pita per frame ke `app/public/data/bars.json`, yang dibaca batang pop-up. Jujur dan deterministik.
- **Output:** `score.wav` (mix), `score_music.wav`, `sfx.wav`. Master diukur BS.1770: −14,4 LUFS, true peak −1,0 dBTP (limiter look-ahead, reduksi median 0 dB, maks. ±8 dB hanya di transien).

## 7. Engine & alasannya

**three.js + Vite + TypeScript, render Node + Chrome headless.** Polanya *disalin* (bukan diimpor) dari `satu-frame/`: `cues.json` → `cues.ts`, `scripts/render.ts` (video / stills / sheet, tidak menimpa file lama, progres per frame), motion blur adaptif.

Alasan:
- Kertas butuh 3D sungguhan: gelombang kertas, lipatan origami dan pop-up, halaman flipbook yang melengkung, bayangan lembut, DOF makro.
- Halftone, rosette, misregistrasi, dan dither Bayer paling rapi sebagai shader, dan semuanya f(t).
- Font variabel: Anybody dimuat sekali per nilai wdth (FontFace `AnyW50…150` dengan descriptor stretch), bobot tetap kontinu di `ctx.font`; digambar ke kanvas tinta per langkah 12 fps. *(berubah: tanpa fontkit)*

Aturan render:
- Dunia kertas: frame `f = round(t·60)`, langkah = 5 frame dihitung dari frame cue terakhir ≤ f (`app/src/step.ts`). Tanpa motion blur, seperti stop-motion; frame yang sama dalam satu langkah dirender sekali lalu dipakai ulang. Kedip eksposur ±0,6 % per langkah memakai `hash(langkah)`; grain ditahan per langkah.
- Pesawat (sejak 49,688) dan closing: 60 fps penuh + motion blur adaptif.
- Setiap frame = f(t), tanpa state terakumulasi.

Aset: hanya font OFL, logo yang digambar dari geometri STYLE.md §1, dan nomor WhatsApp dari `beyond-studio-legacy/kontak.json` (disalin ke `kontak.json`). Tidak ada footage atau gambar dari proyek lain.

Risiko yang disadari:
- Realisme kertas (serat, tepi sobek, lipatan) adalah taruhan kualitas terbesar. Dicek lewat still makro sebelum stasiun lain dibangun.
- Jika 12 fps terasa terlalu patah di HP, cadangannya 15 fps. Keputusan diambil dari still/sheet, tanpa render MP4.

## 8. Closing + CTA

Rujukan: STYLE.md §1–2 (geometri, urutan, brand kit) dan end card vertikal legacy (`beyond-studio-legacy/site/template.html` + `engine.js` `S8`) untuk tata letak dan timing relatif.

- **Latar:** void `#000`, vinyet halus. Pesawat datang dari kegelapan kiri.
- **Tata letak 9:16 (mengikuti legacy):**
  - Logo dirakit besar di tengah (y 820), lalu mengendap menjadi lockup **horizontal** (logo 96 px kiri + wordmark "Beyond Studio" 58 px kanan), terpusat di y 540. *(berubah: dirakit besar dulu agar momen kunci terasa)*
  - CTA "**Yuk, animasikan / brand-mu**" dua baris di y 770 / 872, Inter Tight 88 px (satu baris melanggar area aman kanan).
  - Pil URL "beyondstudio.site" (ikon globe, kursor ice, tombol go biru) di y 1000.
  - Tombol WhatsApp `#25D366` "0819-2707-0239" di y 1140.
  - Sub "Konsultasi dulu, gratis. Baru putuskan." di y 1322, mute.
- **Urutan:**
  1. 52,500–53,450: cincin tergambar simetris dari arah jam 9 (dua busur, ease in-out 0,95 s).
  2. 53,438–54,375: pesawat meratakan diri menjadi panah logo `#F5F5F5` (geometri persis), terbang dari kiri dengan jejak cahaya biru, lalu **mengunci di celah kanan tepat 54,375**: gelombang kejut `#60A5FA`, guncangan kecil, pop outBack, impact + lonceng.
  3. 54,84–55,46: lockup mengendap ke atas; wordmark naik per huruf dari balik mask (stagger 0,022 s, outExpo 0,65 s).
  4. 55,313: CTA naik per huruf, bobot 260 → 790 (1,0 s), seperti legacy.
  5. 56,250: pil pop dan melebar; 56,5–57,3 URL diketik dengan ritme ketik legacy.
  6. 57,188: tombol WhatsApp pop (outBack 1,5).
  7. 57,656: sub muncul.
  8. 58,125: tombol WhatsApp di-tap di ketukan (cincin hijau melebar).
  9. Tahan sampai 60,000 (≥ 1,7 s setelah sub terbaca).
- **SFX:** kilau tipis cincin, whoosh panah kiri → tengah, impact + lonceng (nada lima kartu S6), sapuan wordmark, pop CTA, tap; akor akhir berdengung sampai 60,0.
- **Catatan:** STYLE.md §1 menulis wordmark *di bawah* logo, sedangkan end card legacy memakai lockup horizontal. Film ini mengikuti legacy (dikonfirmasi user).

## 9. Versi EN

Satu film, dua bahasa: `?lang=en` (preview) / `--lang en` (render). Timeline, gerak, kamera, dan audio sama persis; hanya teks yang berganti. Semua teks kedua bahasa ada di `app/src/copy.ts`. Copy ID di atas sudah memakai versi yang dilueskan (disetujui user).

| Tempat | ID | EN |
|---|---|---|
| Poster (headline) | HALAMAN INI / HARUSNYA / DIAM. | THIS PAGE / SHOULD STAY / STILL. |
| Poster (sela) | Harusnya sih. | Supposedly. |
| S2 | Bentar, / waktunya kita pause. | Hold on, / we're pausing time. |
| S3 | Jadul? / Masih jalan kok. | Old school. / Still works. |
| S4 | Tombol yang bikin / gatel pengin dipencet. | Buttons you / want to press. |
| S5 | Angka pun ikut bergoyang. | Even data can dance. |
| S6 | Sampai suaranya / kami atur. | Down to how / it sounds. |
| Banner S7 | SEMUA GERAK / ADA SEBABNYA. | EVERY MOVE / HAS A CAUSE. |
| Halaman S8 | Tinggal satu yang / belum bergerak: / brand-mu. | One thing hasn't / moved yet: / your brand. |
| Kartu S6 | G·E·R·A·K | M·O·V·E·S |
| CTA closing | Yuk, animasikan / brand-mu | Let's get your / brand moving. |
| Sub closing | Konsultasi dulu, gratis. Baru putuskan. | Free consultation before you commit. |

Teks kecil (UI HP, label sumbu pop-up, label selotip, header flipbook, footer poster, catatan pensil, storyboard) ikut diterjemahkan.
