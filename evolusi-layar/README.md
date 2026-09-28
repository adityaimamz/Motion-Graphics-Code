# Evolusi Layar — Beyond Studio

Video edukasi vertikal 1080×1920 @ 60 fps, 56.6 detik (±58 detik dengan voice over tempo TikTok). Seluruhnya code-rendered di Canvas2D: tidak ada footage,
tidak ada gambar eksternal. Setiap frame adalah fungsi murni dari waktu `t`, jadi live preview di browser dan hasil
render identik, dan bisa di-seek ke frame mana pun.

Konsep, shot list, dan timing: [`STORYBOARD.md`](STORYBOARD.md). Gaya visual, easing, caption, transisi:
[`ANIMATION_GUIDE.md`](ANIMATION_GUIDE.md). Naskah dan arahan voice over: [`VOSCRIPT.md`](VOSCRIPT.md).

## Kebutuhan

Node.js 18+, ffmpeg (dengan libx264) di PATH, dan Chromium untuk Playwright.

```sh
npm install
npx playwright install chromium     # sekali saja; atau pakai Chrome sendiri: CHROME_PATH=/path/ke/chrome
```

## Preview

```sh
npm run preview        # lalu buka http://localhost:5173/
```

Harus lewat server (bukan `file://`) karena ES module dan font. Saat pertama kali play, soundtrack disintesis
di browser (±3 detik) lalu diputar sinkron: jam audio yang menggerakkan gambar, jadi tidak ada drift. Kontrol: `space` play/pause, `←/→` ±1 s
(shift ±5 s), `,` / `.` satu frame, `[` / `]` pindah scene, `l` loop scene, `m` mute, `h` sembunyikan UI.
`?t=23.2` membuka langsung di detik tertentu.

## Render

```sh
npm run render                                   # final: motion blur adaptif, x264 CRF 16 preset slow
node render.mjs video --jobs 4                   # sama, dibagi 4 browser paralel lalu digabung lossless
npm run render:draft                             # cepat untuk cek timing (tanpa motion blur)
node render.mjs video --from 20 --to 26 --out out/potongan.mp4   # sebagian saja
```

Opsi `video`: `--samples auto|N` (sub-frame per frame untuk motion blur; `auto` memakai 3 saat tenang dan
8–10 di transisi/whip), `--shutter 0.5` (panjang shutter dalam frame), `--crf 16`, `--preset slow`,
`--jobs N`, `--scale 1`.

Audio otomatis ikut di MP4 (AAC 256 kbps, 48 kHz). Opsinya:

```sh
npm run audio                                    # soundtrack saja → out/evolusi-layar.wav (untuk dibuka di editor)
node render.mjs video --noaudio                  # video tanpa suara
node render.mjs video --audio mix-saya.wav       # pakai mix sendiri (mis. soundtrack + voice over) sebagai audio
```

## Voice over

Taruh file narasi di `vo/`, satu kalimat per file (`01-hook.mp3`, `02-1991a.mp3`, … lihat `vo/README.txt` dan
[`VOSCRIPT.md`](VOSCRIPT.md)). Tidak ada yang perlu diubah di kode:

- tiap kalimat diletakkan di cue caption-nya, hening di awal/akhir file dipotong otomatis;
- caption kalimat kedua di sebuah scene menunggu narator selesai kalimat pertama;
- kalau narasi lebih panjang dari slotnya, scene melebar dan semua yang sesudahnya (transisi, musik, efek, logo) ikut
  bergeser; di 2002, fase "loading macet di 99%" yang memanjang;
- musik di-duck ±11 dB dan efek ±5 dB saat narator bicara; suara duduk ±10 dB di atas bed;
- preview membaca `vo/` sendiri, jadi langsung bisa didengar.

```sh
npm run vo                         # laporan: file terbaca, durasi, posisi, scene yang melebar, durasi total baru
node render.mjs video --novo       # render mengabaikan vo/
```

`vo-uji/` berisi VO robot (espeak-ng) dari naskah lama; penomorannya sudah tidak cocok, jadi jangan disalin ke `vo/`.

Cek visual tanpa render video:

```sh
npm run stills                                   # PNG full-res ke out/stills/
node render.mjs sheet --from 28 --to 31 --n 12   # contact sheet ke out/sheet.png
```

Perkiraan kecepatan: overhead terbesar adalah membaca 8 MB piksel per frame dan encode x264. Di laptop modern,
`--samples 1` biasanya beberapa frame per detik; `--samples auto` kira-kira 3–4× lebih lambat. `--jobs` sebaiknya
≈ jumlah core / 2 (setiap job menjalankan Chromium + ffmpeg sendiri).

## Font

Semua font ikut di `fonts/` (lisensi OFL, dari Fontsource), jadi render tidak bergantung font sistem.
Family brand bernama `IT` dan saat ini diisi **Inter Tight**. Kalau file `it.woff2` / `it-i.woff2` asli dari
project promo Beyond Studio berbeda, cukup timpa kedua file itu di `fonts/` — tidak ada kode yang perlu diubah.

| Era | Font |
|---|---|
| Brand / narator / 2023 | IT (Inter Tight) |
| 1991 | VT323 |
| 1998 | Comic Neue, Tinos |
| 2002 | Orbitron, Exo 2, Silkscreen |
| 2007 | Nunito, Arimo |
| 2015 | Montserrat |

## Struktur

```
index.html      harness: preview + mode ?export=1 (1:1, tanpa UI)
src/timeline.js sumber waktu bersama: S, TR, CAPTIONS, CUE, VO_LINES; applyVO() menghitung ulang timeline dari durasi VO
src/vo.js       deteksi awal/akhir ucapan, pencocokan nama file, loader VO di browser
vo/             file voice over (kosong) + naskah-tts.txt + README.txt
vo-uji/         VO robot naskah lama (tidak cocok dengan penomoran baru)
src/audio.js    soundtrack: synth (polyBLEP, SVF, FM, Karplus-Strong), skor per era, reverb, mastering, WAV
src/core.js     math, easing, keys(), hash, warna, bentuk, teks
src/sites.js    website "Kopi Pagi" di enam era + bezel perangkat
src/film.js     odometer, caption per era, transisi, hook, closing, grain/vignette
src/main.js     loader font, akumulasi sub-frame (motion blur), API window.__evo, player preview
render.mjs      server statis + frame sink → Playwright → ffmpeg + mux audio; mode serve/video/audio/vo/stills/sheet
```

Mengubah timing: semua awal scene ada di `S` dan jendela transisi di `TR` pada `src/timeline.js`; waktu di
dalam scene ditulis relatif terhadap awal scene. Karena audio membaca file yang sama, suara ikut bergeser. Semua waktu sebaiknya kelipatan 1/60 detik.

## Aturan determinisme

Tidak ada `Math.random()`, `Date.now()`, atau state yang terakumulasi. Acak memakai `hash(i, seed)`. Hal yang
berkedip atau melompat memakai `fq(t)` (waktu yang dikunci ke frame) supaya konstan selama shutter motion blur.
Sudah diuji: frame yang sama di-render dari urutan seek berbeda menghasilkan checksum piksel identik.

## Catatan

Soundtrack 100% disintesis oleh kode (tidak ada sampel atau lagu pihak ketiga), jadi aman dipakai untuk konten brand.
Voice over dipasang lewat folder `vo/` (lihat di atas). Kalau kamu lebih suka me-mix sendiri di DAW/editor, `--audio
mix-saya.wav` tetap bisa dipakai, tapi timeline tidak melebar otomatis. Wordmark Beyond Studio di closing digambar ulang dari
geometri logo di `index-v.html` (cincin dua arc dengan celah kanan + panah).
