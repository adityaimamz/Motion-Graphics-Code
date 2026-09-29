# Satu Frame · 75 s (9:16)

Seluruh video ini adalah **satu kali layar HP menyegarkan gambar** (16,667 ms, layar 60 Hz), diperlambat ribuan sampai miliaran kali. Selama satu frame itu, permintaan dari HP pulang-pergi ke server di Singapura: layar → chip → hujan beku → menara → kabel di bawah jalan → dasar Laut Jawa → serat kaca → prosesor (di sana ketukan musik = jam 3 GHz) → orbit → pulang → satu foton ke mata. Satu kamera tanpa cut, dan loop mulus. Konsep, storyboard, dan catatan fakta ada di [`TREATMENT.md`](TREATMENT.md).

- 1080×1920, 60 fps, 75 s = 40 bar @ 128 BPM.
- three.js + Vite + TypeScript. Engine (motion blur adaptif, bloom, grain, renderer Chrome headless) disalin dari `beyond-studio/app` (port dari pdoom-video, MIT, lihat `app/src/engine/LICENSE-pdoom.txt`).
- Setiap frame = f(t): tanpa `Math.random`/`Date.now`, dan dua kali ambil still di t yang sama hasilnya identik piksel per piksel (sudah dicek).

## Perlu disiapkan

**Tidak ada.** Musik dan SFX disintesis kode, dan data Bumi sudah dipanggang ke `app/public/data/`. Tidak ada VO.

Prasyarat: Node 22.6+ (disarankan 24), Google Chrome, FFmpeg (libx264) di PATH. Python 3.10+ dengan numpy, scipy, dan Pillow hanya diperlukan untuk membuat ulang audio atau data.

```bash
cd satu-frame/app
npm install
```

## Preview

```bash
cd satu-frame/app
npx vite            # → http://localhost:5173   (?t=40 mulai di detik 40)
```

| Tombol | Aksi |
|---|---|
| Spasi / klik | play / pause (audio sinkron) |
| ← / → | 1 frame (Shift: 1 s) |
| `[` / `]` | bab sebelumnya / berikutnya |
| `L` | loop bab ini |
| `H` | sembunyikan UI |

Preview berjalan real-time hanya di GPU yang cukup kuat. Di GPU laptop biasa, preview akan patah-patah, tapi waktunya tetap benar (setiap frame = f(t)).

## Cek visual (still, bukan video)

```bash
node scripts/render.ts stills --t 0.3,15,30.5,41,49.5,61.9,70.5   # → satu-frame/out/stills/
node scripts/render.ts sheet --from 0 --to 74.98 --n 48            # → satu-frame/out/sheet.png
node scripts/render.ts loop                                        # frame terakhir + frame 0 → out/loop/
```

## Render

```bash
cd satu-frame/app
# draft (tanpa motion blur, cepat)
node scripts/render.ts video --samples 1 --preset veryfast
# final (motion blur adaptif 4–108 sub-frame per frame, shutter 180°)
node scripts/render.ts video --samples auto
```

- Output: `satu-frame/out/satu-frame-75s.mp4` (H.264, audio AAC, loudness −14 LUFS / −1 dBTP diterapkan saat encode).
- Opsi:
  - `--max-samples 324`: blur lebih halus di bagian tercepat;
  - `--scale 2`: render 2× lalu diperkecil;
  - `--from 24 --to 38`: sebagian;
  - `--dry`: uji pipeline tanpa file.
- Waktu render di GPU Intel terintegrasi (i7-1360P): final penuh (`--samples auto`, maks. 108) ±11–12 jam (sebelum revisi cahaya kota: 10,4 jam, 0,12 frame/s). Di GPU diskrit jauh lebih cepat. Bagian terberat: S5 (dasar laut 76 km/s), S6 (tarik mundur), dan S3/S4/S8 (pantulan jalan basah di resolusi penuh, ±7 s per frame pada 36 sub-frame).
- Log browser hanya berisi peringatan `X4122 … double precision` dari kompiler shader ANGLE. Itu aman diabaikan. (Peringatan X4000, X3577, dan PCFSoftShadowMap sudah dibereskan.)

## Audio & data

```bash
cd satu-frame
python audio.py                 # → app/public/audio/score.wav (mix), score_music.wav + sfx.wav (stem)
python tools/bake_earth.py      # unduh ±63 MB (tools/.cache/), potong → app/public/data/earth_*.png + earth.json
```

`audio.py` membaca `cues.json`. Tape-stop / tape-start mengikuti ramp jam fisik yang sama dengan HUD. Jalankan ulang setiap kali `cues.json` diubah.

## Struktur

```text
satu-frame/
├── TREATMENT.md            konsep, storyboard, jam fisik, catatan fakta
├── cues.json               satu-satunya sumber waktu: bab, cue, jam fisik, teks, label
├── audio.py                musik + SFX sintetis (bus jam / musik / sfx)
├── tools/bake_earth.py     NASA Black Marble + Natural Earth → tekstur
└── app/
    ├── scripts/render.ts   still | sheet | loop | video
    └── src/
        ├── clock.ts        jam fisik: ms(t), perlambatan(t), baris refresh(t)
        ├── film.ts · hud.ts · r3.ts · path.ts · fx.ts
        ├── sets/           dunia per skala: screen (piksel), board (mm), city (m), seabed (m), fiber (µm),
        │                   datacenter (m), die (mm), earth (km), sprites (hujan beku, lampu, bokeh)
        └── chapters/       s1-layar … s10-closing
```

## Kredit data

- Lampu malam: NASA Earth Observatory, *Black Marble 2016* (Suomi NPP VIIRS), domain publik.
- Garis pantai: *Natural Earth* 10m land, domain publik.
- Rute kabel Jakarta–Singapura: rute plausibel lewat Selat Gaspar dan Selat Singapura, bukan kabel bernama. Panjangnya 996 km, dicek tidak melewati daratan.
