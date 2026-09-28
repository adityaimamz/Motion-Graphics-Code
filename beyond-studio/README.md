# Beyond Studio — Motion Promo 45 detik (3D, three.js)

Film promo Beyond Studio yang dibangun dengan three.js. Filmnya berupa pemotretan produk di sebuah studio gelap:
- perangkat 3D (laptop, HP, jendela browser) menampilkan website klien asli;
- panah logo mendarat di layar dan menjadi kursor;
- kamera crane naik dari satu set ke set berikutnya.

Konsep dan storyboard lengkap ada di [TREATMENT.md](TREATMENT.md).

Film ini tersedia dalam dua bahasa (ID/EN) dan dua format (9:16/16:9), ditambah dua potongan pendek (sting dan bumper). Setiap frame adalah fungsi murni dari waktu, jadi hasil preview selalu identik dengan hasil render.

## Kebutuhan
- **Node.js 22.6+** (disarankan 24). Node menjalankan `scripts/render.ts` secara langsung.
- **Google Chrome**. Render berjalan headless memakai GPU.
- **ffmpeg** (dengan libx264) di PATH.
- **Python 3.10+** dengan `numpy scipy`, hanya untuk membuat ulang audio. Untuk membuat ulang QR, tambahkan `segno`.

Sekali saja:
```
cd beyond-studio/app
npm install
```

## Preview
```
cd beyond-studio/app
npx vite
```
Buka salah satu alamat berikut:

| Varian | Alamat |
|---|---|
| 9:16 Indonesia | `http://localhost:5173/?fmt=v&lang=id` |
| 9:16 English | `http://localhost:5173/?fmt=v&lang=en` |
| 16:9 Indonesia | `http://localhost:5173/?fmt=h&lang=id` |
| 16:9 English | `http://localhost:5173/?fmt=h&lang=en` |

Untuk mulai dari detik tertentu, tambahkan `&t=12.5` di akhir alamat.

Tombol di player:

| Tombol | Fungsi |
|---|---|
| Spasi / klik gambar | Play/pause dengan musik |
| ← / → | Mundur/maju 1 frame |
| Shift + ← / → | Mundur/maju 1 detik |
| `[` / `]` | Pindah ke bab sebelumnya/berikutnya |
| `L` | Loop bab yang sedang tampil |
| `H` | Sembunyikan panel |

Preview live bisa terlihat patah-patah di laptop yang lemah. Itu hanya karena kecepatan tampilan; waktu dan suara tetap sinkron, dan hasil render tidak terpengaruh.

## Render
Semua perintah dijalankan dari `beyond-studio/app`. Hasil disimpan di `beyond-studio/out/`.

| Kebutuhan | Perintah | File hasil |
|---|---|---|
| **Final 9:16 Indonesia (TikTok)** | `node scripts/render.ts video --fmt v --lang id --samples auto` | `beyond-studio-45s-id-vertical.mp4` |
| Final 9:16 English | `node scripts/render.ts video --fmt v --lang en --samples auto` | `beyond-studio-45s-en-vertical.mp4` |
| Final 16:9 Indonesia | `node scripts/render.ts video --fmt h --lang id --samples auto` | `beyond-studio-45s-id.mp4` |
| Final 16:9 English | `node scripts/render.ts video --fmt h --lang en --samples auto` | `beyond-studio-45s-en.mp4` |
| Draft cepat (tanpa motion blur) | `node scripts/render.ts video --fmt v --lang id --samples 1 --preset veryfast` | sama seperti di atas |
| Logo sting 3 s | tambahkan `--cut sting` | `beyond-studio-sting-…mp4` |
| Bumper 7,5 s | tambahkan `--cut bumper` | `beyond-studio-bumper-…mp4` |
| Sebagian saja (cek satu bab) | tambahkan `--from 13.1 --to 18.8` | — |

**Motion blur.** Dengan `--samples auto`, setiap frame dirata-rata dari 4, 12, atau 36 sub-frame, tergantung seberapa cepat gerakannya. Hasilnya sama seperti shutter kamera 180°: frame yang diam cukup 4 sub-frame, sedangkan whip dan crane memakai 36. Opsi tambahan:
- `--max-samples 108` membuat blur lebih halus, tapi render lebih lama.
- `--scale 2` merender pada 2× resolusi lalu memperkecilnya, sehingga tepi lebih halus.

**Perkiraan waktu** (laptop dengan GPU terintegrasi):
- draft ±5 menit;
- final ±45–75 menit per varian.

**Audio** otomatis diambil dari `app/public/audio/score.wav` lalu dinormalisasi ke −14 LUFS / −1 dBTP. Untuk potongan sting/bumper, audionya ikut dipotong.

**Cek tanpa membuat file.** Tambahkan `--dry` untuk menguji pipeline dan mengukur kecepatan tanpa menghasilkan MP4.

**Still dan contact sheet** untuk cek visual:
```
node scripts/render.ts stills --fmt v --t 9.2,20.5
node scripts/render.ts sheet  --fmt h --from 0 --to 45 --n 24
```

## Audio
`python audio.py` menghasilkan tiga file di `app/public/audio/`:
- `score.wav`: mix final yang dipakai preview dan render;
- `score_music.wav`: stem musik saja;
- `sfx.wav`: stem efek suara saja.

Detail suaranya:
- Musik 128 BPM, 24 bar, dengan breakdown sebelum drop di 30,0 s.
- Setiap klik, pendaratan dan lepas landas panah, centang, odometer, logo mengunci, dan wipe punya bunyi sendiri. Whoosh-nya bergerak di stereo.

**Mengganti musik:** mix lagu berlisensi dengan `sfx.wav`, simpan hasilnya sebagai `score.wav`, lalu render ulang.

## Waktu & teks
- **`cues.json`** adalah satu-satunya sumber waktu: bab, klik, lock logo, flood, wipe, CTA, dan potongan sting/bumper. Nilainya dibaca oleh gambar (app) maupun suara (`audio.py`). Setelah mengubahnya, jalankan `python audio.py`.
- **`app/src/text.ts`** berisi semua teks ID dan EN.
- **`kontak.json`** berisi nomor WhatsApp dan pesan pembuka. Nomor dibaca langsung oleh app. Jika nomor atau pesan berubah, jalankan `python build.py` untuk membuat ulang QR 16:9.

## Isi folder
```
beyond-studio/
├── TREATMENT.md         konsep, tone, storyboard per scene (hasil review)
├── MOTION-GUIDE.md      panduan motion brand
├── cues.json            sumber waktu tunggal (gambar + suara)
├── kontak.json          WhatsApp end card
├── audio.py             sintesis musik + SFX → app/public/audio/
├── build.py             QR WhatsApp → app/public/assets/
└── app/                 film (three.js + Vite)
    ├── scripts/render.ts   stills / sheet / video (headless Chrome → ffmpeg)
    ├── public/             screenshot klien, font Inter Tight, ikon Lucide, audio
    └── src/
        ├── engine/         render loop, motion blur adaptif, post (bloom, grain, vignette); port dari pdoom-video (MIT)
        ├── stage/          studio (lantai, cahaya, pantulan, DOF), logo 3D, perangkat & layar, huruf 3D, tipe, motion
        ├── scenes/         s1-logo … s8-closing (satu modul per bab), headline, layout (framing & crane)
        ├── fmt.ts text.ts cues.ts
        └── main.ts         player preview + API export
```

## Mengedit
- **Waktu:** ubah di `cues.json`, bukan di dalam scene.
- **Framing kamera:** setiap set punya `HOME` di `scenes/layout.ts`. Crane antar-set dan pendaratan panah memakai helper yang sama di file itu.
- **Isi layar:** fungsi `draw…` di setiap scene. Semua koordinat memakai piksel screenshot asli (1240 px).
- **9:16 vs 16:9:** setiap nilai yang berbeda ditulis sebagai `pick(nilai9x16, nilai16x9)`.

Catatan: angka 80+, 98%, Rp 12,4 jt, hasil diagnosis, dan situs Nexora adalah ilustrasi tampilan, bukan data klien. Ganti dengan data yang disetujui klien sebelum dipublikasikan.

Engine di `app/src/engine/` diadaptasi dari pdoom-video karya Giacomo Magnanini (lisensi MIT, lihat `app/src/engine/LICENSE-pdoom.txt`).
