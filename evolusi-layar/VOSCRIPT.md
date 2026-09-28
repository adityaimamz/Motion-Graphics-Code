# Evolusi Layar — Naskah Voice Over

Narasi = teks caption, kata per kata. Yang diucapkan narator sama persis dengan yang terbaca di layar, jadi penonton
yang menonton tanpa suara dan yang menonton dengan suara mendapat pesan yang sama.

**Satu file per kalimat**, 21 kalimat wajib + 1 opsional. Taruh di folder `vo/` dengan nama file persis seperti di
tabel. Renderer akan meletakkan tiap kalimat di cue-nya, memotong hening di awal dan akhir file, men-duck musik
saat narator bicara, dan **melebarkan scene** kalau kalimatnya lebih panjang dari slotnya.

## Struktur: fakta, lalu "kenapa"

Tiga era punya **halaman caption kedua** yang menjelaskan alasan di balik faktanya. Urutannya jadi sebab-akibat yang
bersambung, sekaligus menjawab pertanyaan hook ("kenapa desain website terus berubah?"):

| Era | Fakta (halaman 1) | Kenapa (halaman 2, baru) |
|---|---|---|
| 2007 | Semua didesain biar kelihatan ‘mahal’. | Soalnya orang masih asing sama layar — tombol harus kelihatan bisa dipencet. |
| 2015 | Sampai orang sadar: simpel itu lebih dipercaya. | Orang udah terbiasa sama layar — tombol nggak perlu pura-pura timbul lagi. |
| 2023 | Sekarang bukan soal ramai atau simpel — tapi soal terasa pas untuk penggunanya. | Karena websitenya udah ‘kenal’ kamu: kopi langganan, cukup sekali tap. |

2007 dan 2015 sengaja dibuat berpasangan: *masih asing* ↔ *udah terbiasa*, *harus kelihatan bisa dipencet* ↔
*nggak perlu pura-pura timbul*. Penonton mendengar sebabnya di 2007, lalu mendengar "jawabannya" di 2015. 2023 membuat
"terasa pas" jadi konkret dengan contoh yang sedang terjadi di layar. Kalimat era lain tidak berubah.

Penutupnya ditambah ajakan follow yang menggemakan hook: **"Follow, biar tahu ‘kenapa’ lainnya."** Kalimat ini muncul
di end card di bawah wordmark (sesudah "Beyond Studio." kalau baris itu diisi). Tombol pil **+ Follow** ikut muncul,
berdenyut, lalu ditekan di akhir kalimat dan berubah jadi **✓ Following**.

Halaman 1 keluar begitu narasinya selesai, lalu halaman 2 masuk. Visual yang ikut kalimat baru:

- **2007:** kursor "orang yang belum terbiasa" berkeliling ragu-ragu (kotak, cangkir) selama *masih asing sama layar*.
  Di kalimat tombol, label **kilap / bayangan / pantulan** menempel ke elemennya, lalu kursor menekan tombol glossy
  tepat di *dipencet*. Saat morph ke flat, ketiga label dicoret satu per satu.
- **2015:** bayangan panjang ikon cangkir tumbuh. Jari mengetuk "Lihat Menu" tanpa ragu, halaman scroll ke menu flat,
  lalu mengetuk tombol flat "Pesan" (ripple, berubah jadi centang) di *tombol nggak perlu pura-pura timbul lagi*.
- **2023:** jumlah antrean berganti 3 → 2, jam 6:04 → 6:05, strip menu bergeser pelan. Di *udah ‘kenal’ kamu*,
  yang "dikenal" menyala satu per satu: avatar, "Rina", "kurang gula", "4 menit dari kamu". Tap "Pesan lagi" jatuh di kata *tap*.

## Perkiraan durasi

Durasi video tanpa VO 56.6 detik. Dengan VO, durasinya bergantung pada tempo bicara (dihitung dari durasi take
ElevenLabs yang sudah ada di `vo/`, ditambah perkiraan untuk 7 kalimat baru):

| Tempo | Kira-kira | Total video | Scene yang melebar |
|---|---|---|---|
| Cepat, gaya TikTok | ±7 suku kata/detik (speed ±1.1) | **±58 s** | closing +1.2 s, sisanya ≤ 0.1 s |
| Normal | ±6 suku kata/detik (speed 1.0) | ±63 s | closing +2.2 s, 2023 +1.2 s, 2015 +1.0 s, 2007 +0.9 s, 1991 +0.8 s, 2002 +0.6 s |
| Pelan | ±5 suku kata/detik | ±72 s | semua scene |

Saran: **tempo cepat tapi tetap santai** (speed 1.05–1.1). Untuk TikTok, tempo ini terasa natural dan menjaga
video tetap di bawah 60 detik (aman juga untuk Reels/Shorts). Scene yang melebar hanya "menahan" gambar lebih lama;
tidak ada yang terpotong, dan animasi di dalamnya (kursor, tap, highlight) ikut menunggu kalimatnya.

## Arahan suara

Karakter: **teman yang kebetulan desainer**, menjelaskan sesuatu yang dia pahami betul. Santai, yakin, sedikit
jenaka. Bukan penyiar berita, bukan iklan yang berteriak. Senyum boleh terdengar di suara.

- **Hook:** pertanyaan tulus dengan intonasi naik di "berubah?". Energi tertinggi di awal supaya orang berhenti scroll.
- **1991–2002:** nada bercerita, sedikit geli melihat masa lalu. "Rame" dan "makin heboh" boleh diucapkan sambil tersenyum. Kalimat 2002 kedua sedikit sinis.
- **2007:** ringan; beri penekanan kecil pada "mahal". Kalimat "Soalnya…" diucapkan seperti membocorkan rahasia kecil, nada menjelaskan (bukan menggurui). "Dipencet" jelas dan sedikit ditekan: kursor menekan tombol di kata itu.
- **2015:** melambat sedikit. Ini momen "sadar", beri jeda kecil setelah "sadar". Kalimat "Orang udah terbiasa…" santai dan yakin, seperti menjawab kalimat 2007. "Pura-pura timbul" boleh sambil senyum.
- **2023:** hangat dan mantap. "Pas untuk penggunanya" adalah inti pesan, jadi ucapkan dengan jelas. "Karena websitenya udah ‘kenal’ kamu:" hangat dengan jeda kecil setelah "kamu". "Cukup sekali tap" ringan dan renyah, berhenti tegas di "tap": jari mengetuk tombol di kata itu.
- **Closing:** bicara langsung ke penonton, seolah menunjuk layar mereka. Kalimat terakhir tegas, tanpa nada menjual.
- **Brand (opsional):** tenang dan pendek, seperti tanda tangan. Bukan jingle.
- **Follow (penutup):** ramah dan santai, seperti teman yang ngajak, bukan iklan. Sedikit senyum, beri tekanan kecil di "kenapa" (menggemakan pertanyaan di hook). Tombol Follow di layar ditekan saat kalimat ini selesai.

## Daftar kalimat

"Mulai" adalah waktu default di video tanpa perpanjangan. Setelah VO dipasang, posisi pastinya bisa dilihat dengan
`npm run vo`. Kalimat **tebal** adalah kalimat baru; sisanya sama persis dengan naskah sebelumnya.

| File | Mulai | Diucapkan | Arahan | ±Durasi |
|---|---|---|---|---|
| `01-hook` | 0.05 s | Kenapa desain website terus berubah? | Tanya, naik di akhir | 2.0–2.3 s |
| `02-1991a` | 3.75 s | Dulu, internet cuma teks. | Bercerita, pelan di "dulu" | 1.5–1.7 s |
| `03-1991b` | 4.50 s | Orang cuma butuh informasi, bukan tampilan. | Tekan "informasi" | 2.5–2.9 s |
| `04-1998a` | 9.40 s | Lalu semua orang pengen ‘rame’. | Geli | 1.7–2.0 s |
| `05-1998b` | 10.20 s | Makin heboh, makin keren. | Senyum, ritmis | 1.5–1.7 s |
| `06-2002a` | 15.40 s | Era pamer teknologi — | Sedikit dramatis | 1.5–1.7 s |
| `07-2002b` | 16.20 s | bahkan kalau harus mengorbankan kecepatan dan kegunaan. | Sinis ringan, kalimat terpanjang | 2.9–3.3 s |
| `08-2007a` | 20.65 s | Semua didesain biar kelihatan ‘mahal’. | Tekan "mahal" | 2.2–2.5 s |
| `09-2007b` | 22.90 s | **Soalnya orang masih asing sama layar —** | *Baru.* Menjelaskan, menggantung di akhir | 1.9–2.2 s |
| `10-2007c` | 25.05 s | **tombol harus kelihatan bisa dipencet.** | *Baru.* Tekan "dipencet" | 1.9–2.2 s |
| `11-2015a` | 28.35 s | Sampai orang sadar: | Melambat, jeda sesudahnya | 1.2–1.4 s |
| `12-2015b` | 28.85 s | simpel itu lebih dipercaya. | Yakin | 1.6–1.8 s |
| `13-2015c` | 31.50 s | **Orang udah terbiasa sama layar —** | *Baru.* Santai, yakin (menjawab 2007) | 1.7–2.0 s |
| `14-2015d` | 33.35 s | **tombol nggak perlu pura-pura timbul lagi.** | *Baru.* Senyum di "pura-pura" | 2.0–2.3 s |
| `15-2023a` | 37.25 s | Sekarang bukan soal ramai atau simpel — | Menggantung di akhir | 2.2–2.5 s |
| `16-2023b` | 38.10 s | tapi soal terasa pas untuk penggunanya. | Hangat, jelas | 2.2–2.5 s |
| `17-2023c` | 41.75 s | **Karena websitenya udah ‘kenal’ kamu:** | *Baru.* Hangat, jeda kecil setelah "kamu" | 1.8–2.1 s |
| `18-2023d` | 43.80 s | **kopi langganan, cukup sekali tap.** | *Baru.* Ringan, berhenti tegas di "tap" | 1.8–2.1 s |
| `19-closing-a` | 46.85 s | Kalau website kamu masih kelihatan seperti salah satu era di atas, | Langsung ke penonton | 4.0–4.5 s |
| `20-closing-b` | 49.20 s | itu tandanya sudah waktunya berubah. | Tegas, turun di akhir | 2.0–2.3 s |
| `21-brand` *(opsional)* | 52.75 s | Beyond Studio. | Tenang, pendek | 0.9–1.1 s |
| `22-follow` | 53.55 s | **Follow, biar tahu ‘kenapa’ lainnya.** | *Baru.* Ngajak, ramah, tekan kecil di "kenapa" | 1.6–1.9 s |

Kalimat dalam satu era (a/b/c/d) diucapkan terpisah. Tiap kalimat otomatis menunggu kalimat sebelumnya selesai, dan
caption-nya muncul bersamaan dengan suaranya. Di 2007, 2015, dan 2023, kalimat pertama halaman "kenapa" (2007b, 2015c,
2023c) menunggu sedikit lebih lama (±0.45 s) supaya caption halaman pertama sempat keluar.

### Sudah punya file VO dari naskah lama?

Nomor file bergeser karena ada kalimat baru. Kalimat 01–07 tidak berubah dan namanya tetap. Kalimat lama lain
teksnya sama, cukup **ganti nama**; yang benar-benar perlu dibuat baru hanya 7 file:

| Nama lama | Nama baru |
|---|---|
| `08-2007` | `08-2007a` |
| `09-2015a` | `11-2015a` |
| `10-2015b` | `12-2015b` |
| `11-2023a` | `15-2023a` |
| `12-2023b` | `16-2023b` |
| `13-closing-a` | `19-closing-a` |
| `14-closing-b` | `20-closing-b` |
| `15-brand` | `21-brand` |
| *(baru)* | `09-2007b`, `10-2007c`, `13-2015c`, `14-2015d`, `17-2023c`, `18-2023d`, `22-follow` |

File dengan nama lama tidak terbaca lagi (diabaikan), jadi tidak akan salah pasang, hanya belum bersuara.
Supaya warna suara konsisten, lebih aman generate ulang semua 21 baris dengan suara dan setting yang sama.

## Aturan file

- **Nama persis** seperti tabel, ekstensi bebas: `.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, `.aac`, `.webm`.
  Contoh: `vo/07-2002b.mp3`.
- **Satu kalimat per file.** Hening di awal dan akhir boleh ada; akan dipotong otomatis.
- **Jangan tambahkan musik atau efek** di file VO. Level juga tidak perlu disamakan; renderer menormalisasi tiap kalimat.
- Mono atau stereo sama saja. 44.1 atau 48 kHz sama saja (dikonversi ke 48 kHz).
- File yang belum ada dilewati saja, jadi kamu bisa mencoba 2–3 kalimat dulu.

## Teks untuk TTS dan pelafalan

Salin dari `vo/naskah-tts.txt`. Isinya sama dengan tabel, tapi tanda kutip dan tanda pisah sudah diganti supaya
tidak dibaca aneh oleh TTS. Kalau ada kata yang salah dilafalkan, ubah **hanya teks input TTS-nya**; caption tetap:

| Kata | Kalau terdengar salah, tulis di TTS |
|---|---|
| website, websitenya | `websait`, `websaitnya` |
| rame | `ramé` |
| tap | `tep` (kalau terdengar kaku) |
| nggak | `ngga` (kalau huruf k-nya terdengar keras) |
| Follow | `Folo` (kalau terdengar kaku) |
| Beyond Studio | `Biyon Studio` (atau buat baris ini dengan suara berbahasa Inggris dari karakter yang sama) |

## Pengaturan per tool

Nama model dan letak menu bisa berubah; cek di aplikasinya.

**ElevenLabs.** Pilih model multilingual terbaru yang mendukung bahasa Indonesia, lalu pilih atau kloning satu
suara dan pakai terus untuk semua baris. Titik awal yang baik: Stability 40–50 %, Similarity 75 %, Style 0–20 %,
Speed 1.05–1.1. Generate per baris, ambil 2–3 take, pilih yang intonasinya paling pas, lalu unduh sebagai MP3 atau
WAV dan beri nama sesuai tabel. Hak pakai komersial biasanya hanya di paket berbayar.

**Microsoft Azure TTS.** Suara `id-ID-ArdiNeural` (pria) atau `id-ID-GadisNeural` (wanita). Contoh SSML satu baris:

```xml
<speak version="1.0" xml:lang="id-ID" xmlns="http://www.w3.org/2001/10/synthesis">
  <voice name="id-ID-GadisNeural">
    <prosody rate="+8%">Sampai orang sadar:<break time="200ms"/></prosody>
  </voice>
</speak>
```

**Google Cloud TTS.** Pilih suara `id-ID` kualitas tertinggi yang tersedia, `speakingRate` sekitar 1.08, format
output LINEAR16 (WAV) atau MP3.

**CapCut.** TTS-nya ada di editor dan tidak menghasilkan file per kalimat. Kalau VO dibuat di CapCut, lebih praktis
render video di sini (dengan soundtrack) lalu tambahkan VO di CapCut. Konsekuensinya, timeline tidak melebar
otomatis dan musik tidak di-duck.

## Setelah file masuk

```sh
npm run vo          # cek: file mana yang terbaca, durasi, posisi, scene mana yang melebar, total durasi baru
npm run preview     # tonton & dengar hasilnya (preview membaca vo/ sendiri)
npm run render      # render final dengan VO
```

`vo-uji/` berisi VO robotik (espeak-ng) dari **naskah lama** (15 file, penomoran lama) dan belum diperbarui untuk naskah
ini. Jangan disalin ke `vo/`: mulai nomor 08 namanya tidak cocok lagi dan kalimat baru tidak ada.
