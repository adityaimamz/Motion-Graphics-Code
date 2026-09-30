# Harusnya Diam — showreel 60 s (9:16)

Showreel skill motion design Beyond Studio. Seluruh video adalah reaksi berantai di papan gambar penuh cetakan risograf: titik di ujung "HALAMAN INI HARUSNYA DIAM." robek lepas dan memicu enam stasiun. Setiap stasiun memamerkan satu keahlian:

1. tipografi kinetik
2. generatif + time remap (halftone beriak, beku, menyelam Droste sampai dither Bayer)
3. frame-by-frame
4. UI motion
5. infografis audio-reaktif
6. ritme dan sound design

Setelah itu kamera mundur memperlihatkan seluruh papan, lalu halaman terakhir melipat diri jadi pesawat kertas dan menembus papan ke logo. Dunia kertas bergerak **12 fps** seperti stop-motion. Hanya pesawat dan closing yang **60 fps**.

Konsep, storyboard, dan keputusan desain ada di [TREATMENT.md](TREATMENT.md).

- 1080×1920, 60 fps, 60,0 s (32 bar @ 128 BPM)
- three.js + Vite + TypeScript, render Node + Chrome headless (pola dari `satu-frame/`)
- Audio 100 % sintetis (`audio.py`)
- Setiap frame = f(t), deterministik piksel per piksel (sudah dicek: dua kali render menghasilkan still identik)

## Kebutuhan
- Node.js 22.6+ (disarankan 24; `scripts/render.ts` dijalankan langsung oleh Node)
- Google Chrome (render headless)
- FFmpeg (libx264) di PATH
- Python 3.10+ dengan `numpy` dan `scipy`, hanya untuk membuat ulang audio

```bash
cd harusnya-diam/app
npm install
```

## Perintah
Semua perintah dijalankan dari `harusnya-diam/app`.

| Kebutuhan | Perintah | Hasil |
|---|---|---|
| Preview + audio | `npx vite` → buka `http://localhost:5173/` (atau `/?t=27.5`) | Player: Spasi play, ←/→ 1 frame, Shift ±1 s, `[`/`]` bab, L loop bab, H sembunyikan UI |
| Render draft (cepat, tanpa motion blur) | `node scripts/render.ts video --samples 1 --preset veryfast` | `out/harusnya-diam-60s_<tanggal>_<jam>_draft.mp4` |
| Render final | `node scripts/render.ts video --samples auto` | `out/harusnya-diam-60s_<tanggal>_<jam>_final.mp4` |
| Render sebagian | tambahkan `--from 49 --to 53` | nama berisi rentangnya |
| Still per detik tertentu | `node scripts/render.ts stills --t 0,6.1,42.5` | `out/stills/` |
| Contact sheet | `node scripts/render.ts sheet --from 0.5 --to 59.5 --n 60 --cols 12` | `out/sheet.png` |
| Uji pipeline tanpa file | tambahkan `--dry` | (tidak menulis MP4) |
| Audio ulang | `cd .. && python audio.py` | `app/public/audio/*.wav` + `app/public/data/bars.json` |

Catatan render:
- Render **tidak pernah menimpa** file lama. Namanya memuat tanggal dan jam; `--out` yang sudah ada otomatis diberi `-2`, `-3`, dan seterusnya.
- Terminal menampilkan progres per frame (bab, sub-frame, sisa waktu, jam selesai).
- Frame stop-motion (sampai 49,69 s) dirender sekali dan dipakai ulang selama pose ditahan.
- Motion blur adaptif (4–108 sub-frame) hanya bekerja di bagian 60 fps: pesawat dan closing.
- Perkiraan waktu render final ±20 menit, tergantung GPU. `--max-samples 36` mempercepat bagian pesawat dan closing.
- Loudness: `audio.py` sudah memaster ke −14 LUFS / −1 dBTP, dan encoder menerapkan `loudnorm` −14 LUFS lagi.

## Yang perlu kamu siapkan
Tidak ada. Font (OFL) ada di `app/public/fonts/`, audio sudah dibuat, dan nomor WhatsApp dibaca dari [kontak.json](kontak.json) (salinan dari `beyond-studio-legacy/kontak.json`). Jalankan `python audio.py` lagi hanya kalau `cues.json` diubah.

## Struktur
```
harusnya-diam/
├─ TREATMENT.md · README.md
├─ cues.json      sumber waktu tunggal (bab, cue, caption) untuk app/ dan audio.py
├─ audio.py       musik 2-step + foley kertas sintetis → score.wav, score_music.wav, sfx.wav, bars.json
├─ kontak.json    nomor WhatsApp end card
└─ app/
   ├─ scripts/render.ts           stills / sheet / video (Chrome headless + ffmpeg)
   ├─ public/fonts/               Anybody (variable), Instrument Serif, Space Mono, Architects Daughter, Inter Tight
   ├─ public/audio/ · public/data/bars.json
   └─ src/
      ├─ engine/                  renderer, motion blur adaptif, post (dari satu-frame / pdoom-video, MIT)
      ├─ cues.ts · step.ts        waktu film; waktu stop-motion 12 fps (jangkar di setiap cue)
      ├─ paper/                   material kertas + tinta riso (halftone per piksel, misregistrasi, serat),
      │                           kanvas tinta, huruf yang "tercetak", slip caption, selotip
      ├─ stations/                poster (+ riak), droste (dive 2D), flipbook, phone, props (penggaris, pensil),
      │                           popup, cards, banner (+ catatan pensil, storyboard), plane (lipatan + terbang), disc
      ├─ hero.ts                  perjalanan titik dari awal sampai kartu G
      ├─ camera.ts                kamera per bab, chase shot, kamera terbang (60 fps)
      ├─ closing.ts               end card brand kit (tata letak end card legacy)
      ├─ world.ts · layout.ts     papan, cahaya jendela + bayangan, letak setiap stasiun
      └─ film.ts · main.ts        film (f(t)) dan player/export
```

## Lisensi aset
- Font: SIL Open Font License, teks lisensi di `app/public/fonts/OFL-*.txt`. Inter Tight disalin dari `beyond-studio-legacy/site/fonts/`.
- Engine: diadaptasi dari pdoom-video (MIT), lisensi di `app/src/engine/LICENSE-pdoom.txt`.
