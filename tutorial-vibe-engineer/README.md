# Tutorial Vibe Engineer — Beyond Studio

Video edukasi vertikal 1080×1920 @ 60 fps, ±2 menit 32 detik (panjangnya mengikuti file VO). Motion design gaya SaaS
dari HTML/CSS: setiap frame ditulis ulang dari waktu `t` (tanpa CSS transition/animation), lalu di-screenshot di
Chromium headless dan dirakit ffmpeg. Preview dan hasil render identik dan bisa di-seek ke frame mana pun.

Isinya tutorial sungguhan cara video *Vibe Engineer* dibuat: tujuh bab (siapkan, aturan kerja, naskah, storyboard, kode,
suara, cek & render) dengan artefak asli repo ini (`CLAUDE.md`, skill `beyond-video`, `TREATMENT.md`, still dan klip asli
video pertama, commit asli), lalu ditarik ke lima aturan video pertama. Storyboard, gaya, dan audio:
[`TREATMENT.md`](TREATMENT.md).

## Kebutuhan

Node.js 18+, ffmpeg (dengan libx264) di PATH, dan Chrome/Chromium.

```sh
npm install
npx playwright install chromium     # sekali saja; atau pakai Chrome yang sudah ada:
                                    #   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe"
```

Aset video pertama (`assets/ve/`: 44 still + 11 klip asli) di-ignore git. Di clone baru, buat ulang dengan `npm run aset`
(hanya membaca `vibe-engineer/` dan MP4 final di `vibe-engineer/out/`). Suara klip dibuat ulang **tanpa narator video pertama**
(`tools/ambil-klip-audio.mjs`, ikut jalan di `npm run aset`; sendiri: `npm run aset:audio`): soundtrack video pertama dirender ulang
dengan kodenya sendiri, narasi dibisukan, level dicocokkan dengan mix aslinya, lalu klip dipotong dari situ. Saat preview/render pertama, frame klip
diekstrak otomatis ke `assets/ve/.frames/`.

## Preview

```sh
npm run preview        # lalu buka http://localhost:5173/
```

Saat pertama kali play, soundtrack disintesis di browser (beberapa detik), lalu diputar sinkron dengan gambar.
Kontrol: `space` play/pause, `←/→` ±1 s (shift ±5 s), `,` / `.` satu frame, `[` / `]` pindah scene, `l` loop scene,
`m` mute, `h` sembunyikan UI. `?t=62.3` membuka langsung di detik tertentu.

## Render

```sh
npm run render:draft   # cepat (1×, tanpa motion blur)  → out/tutorial-vibe-engineer_<tanggal>_<jam>_draft.mp4
npm run render         # final (supersampling 2×, motion blur sub-frame, x264 CRF 16, 4 browser paralel)
                       #                                 → out/tutorial-vibe-engineer_<tanggal>_<jam>_final.mp4
node render.mjs video --from 58 --to 70 --out out/potongan.mp4      # sebagian saja
```

Nama file diberi cap waktu, jadi render baru tidak menimpa yang lama. Audio (AAC 256 kbps, 48 kHz) ikut otomatis.
Opsi lain: `--noaudio`, `--audio mix-saya.wav`, `--novo` (abaikan `vo/`), `--ss 1|2`, `--nomb`, `--jobs N`.

```sh
npm run audio          # soundtrack saja → out/tutorial-vibe-engineer_<tanggal>_<jam>.wav
npm run stills         # still per momen kunci (semua scene + closing) → out/stills/
npm run sheet          # contact sheet → out/sheet.png
npm run strip -- --from 58 --to 63      # strip 10 fps untuk dibandingkan dengan reference video/
npm run check          # determinisme: frame di t yang sama harus identik (-- --dump menyimpan frame yang beda ke out/check/)
npm run vo             # laporan VO: file terbaca, durasi, posisi tiap scene, durasi total
node render.mjs cues naskah             # semua waktu cue satu scene (kata VO → momen di layar)
```

## Voice over

19 file sudah ada di `vo/` (`01-komentar` … `19-follow`), dipotong dari satu tarikan ElevenLabs Eleven v4
(`vo/ElevenLabs_…_v4.mp3`). Kalau rekaman diganti:

```sh
npm run vo:bagi -- "vo/<rekaman>.mp3" --dry   # tampilkan titik potong (tidak menulis apa-apa)
npm run vo:bagi -- "vo/<rekaman>.mp3"         # potong → vo/raw/, rapatkan → vo/<id>.wav
npm run env                                   # perbarui selubung waveform asli VO 13 (digambar di S9)
npm run vo                                    # cek posisi dan durasi
```

VO elastis: kalimat yang lebih panjang membuat scene-nya melebar dan semua yang sesudahnya ikut bergeser; momen di layar
dikunci ke kata VO (`at(id, 'kata')` di `src/timeline.js`). Musik di-duck ±11 dB dan efek ±5 dB saat narator bicara.

## Struktur

```
render.mjs              server preview + renderer (Chromium headless → ffmpeg): serve video audio vo cues stills sheet strip check
index.html              panggung + player preview
src/timeline.js         SATU sumber waktu: panjang scene dari VO, semua cue per scene, motion blur, SFX
src/film.js             komposit per frame: latar + HUD, scene, dok prompt + kursor bersama, overlay, closing, grain
src/naskah.js           19 baris VO + teks prompt yang diketik di layar
src/artefak.js          salinan beku file asli repo + daftar klip (dibuat tools/ambil-aset.mjs)
src/vo-env.js           selubung amplitudo asli VO 13 (dibuat tools/ambil-env.mjs)
src/ui/                 komponen: prompt (dok), headline, rotator, select (Figma), card, term, chip, fx (centang,
                        coret, cap), clip (klip asli/still), cursor, hud, background, geo (persegi serah-terima antar-scene)
src/scenes/             s01-komentar … s11-lima, s12-closing
src/audio.js            musik sintetis 128 BPM + SFX dari cue + suara klip asli, ducking VO, master
tools/                  ambil-aset (still + klip dari vibe-engineer/), ambil-klip-audio (suara klip tanpa narator), ambil-env, frames, vo-bagi, vo-rapat
assets/ve/              44 still + 11 klip asli video pertama (di-ignore git, npm run aset)
fonts/                  Inter Tight, Inter, JetBrains Mono, Instrument Serif Italic (semua OFL)
```

Di mesin ini tidak ada yang perlu disiapkan lagi: VO, aset, dan font sudah ada. Di clone baru: `npm install` lalu `npm run aset`.
