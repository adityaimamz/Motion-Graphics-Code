# Tutorial Vibe Engineer · Treatment

Status: **semua scene dibangun (S1–S12, 2026-10-03).** Potongan uji S1 + S2 + closing disetujui; S3–S11 dibangun sesuai storyboard ini, dok prompt dan animasi ketik dipoles (lihat "Catatan build S3–S11" di akhir). Naskah v2 disetujui di gerbang 1. VO sudah direkam dan didengar user.
Jenis: edukasi (tutorial sungguhan). Sekitar 2 menit 25 detik, elastis (panjang tiap beat mengikuti file VO). 1080×1920, 60 fps.
Audio: VO ElevenLabs **Eleven v4** (satu tarikan 136,2 s, suara "Zephlyn", dipotong jadi 19 file) + musik dan SFX sintetis.
Waktu scene di storyboard masih perkiraan (±14 karakter/detik). Waktu persisnya dihitung `timeline.js` dari file VO.

## Standar kualitas (dibedah frame demi frame dari KEDUA referensi)

Target: setara `reference video/original.mp4` (Notion, 46 s, dibedah 5 fps) dan `original (1).mp4` (TypingMind, 15 s, dibedah 8–10 fps).

### Bedah `original.mp4` (Notion AI workspace)
| Waktu | Yang terjadi | Teknik |
|---|---|---|
| 0–5 | Latar gelap. Kicker `• YOUR WORK, TODAY`. "Docs here. / Chats there. / Tasks **everywhere.**", satu baris per ±1 s. Ikon app (Slack, Gmail, GitHub, Figma) muncul satu-satu, miring, berbayang. | Kekacauan dibangun sedikit demi sedikit. Kata aksen biru di baris terakhir. |
| 5–6,4 | Semua teks dan ikon tersedot jadi titik-titik ke tengah, lalu **lingkaran terang membesar (iris)** dan membuka dunia terang dengan logo. | Transisi gelap → terang yang bermakna: kekacauan → satu tempat. |
| 6,4–9,6 | "Where teams and / agents **[Think]** together.", kata biru (dengan titik) menggulung Think → Build → Ship. Ilustrasi tokoh pop di kiri/kanan. | Kata muncul per kata dengan blur-in, gulungan slot vertikal. |
| 9,6–12 | Kicker `INTRODUCING THE AI WORKSPACE`. "The AI workspace that / *works* for you." Kata "works" **serif italic**. Screenshot app naik dari bawah dengan kemiringan 3D, lalu **kamera mendorong masuk sampai UI memenuhi layar**. | Kontras tipografi sans + serif italic. Transisi = zoom ke UI. |
| 12–16 | Board penuh layar, badge `• Agents working on your board`, isi board bergerak sedikit. Pudar ke putih. | Badge status kecil di pojok. |
| 16,6–20 | Kicker `• CAPTURE KNOWLEDGE`. Headline kiri diketik per baris, kartu Meetings masuk dari kanan, lalu pil rekaman (gelombang + tombol stop) pop di atas kartu. Satu baris tersorot, chip `Notes captured` muncul. Sub-teks abu kecil di bawah headline. | Satu kartu + satu pil status = satu ide. Sub-teks kecil sebagai penjelas. |
| 20–26 | Kolom tanya sendirian di tengah, diketik ±17 karakter/s. Kirim dengan **denyut biru**, kolom naik, lalu kartu dashboard (donut, batang, garis, ikon sumber) **merakit diri** dalam kelompok 3D. "Get answers, instantly. With **citations.**" | Prompt → hasil dirakit. Tata letak bergeser saat headline masuk. |
| 28,8–33 | Kicker `• AUTOMATE BUSYWORK`. Kartu Coding Agent (header kuning) naik, board tugas masuk dari kanan, pesan agen di-stream, pil `Working…` → `✓ Updated 5 pages`. Satu kartu tugas dipindah kolom dengan tooltip. | Status berubah = bukti kerja. |
| 33–36 | UI di belakang **diburamkan dan diredupkan (depth of field)**, lalu angka besar biru **24/7** menghantam masuk dan "Keep work moving with agents." muncul per kata. | Angka pahlawan di atas latar buram. |
| 36–39 | **Cut keras ke gelap** + cahaya biru di pojok. "Build agents that / **triage product feedback.**" Baris biru menggulung 4 kali (±0,9 s per kata), dengan **garis progres bertik + penghitung `02 / 04`** di bawahnya. | Daftar = gulungan + penanda progres. |
| 39–43 | Cut ke terang. "Trusted by teams that **ship.**" Dinding logo muncul per baris. **Tiga kartu angka menghitung naik** (24 → 100M, 37 → 62%, 30 → 50%+, ±1,5 s, berjenjang). | Hitungan naik dengan ease-out. |
| 43–46 | Ikon logo keluar dari tengah dinding logo, menjadi lockup + tagline diketik. Tombol CTA pop, **kursor mengklik dengan riak cincin + pendar biru di bawah tombol**, URL kecil. Pudar ke putih. | CTA diklik kursor. |

### Bedah `original (1).mp4` (TypingMind)
| Waktu | Yang terjadi | Teknik |
|---|---|---|
| 0–1 | "Chat with" diketik per huruf; huruf naik dari garis dasar dengan blur. Ada HUD, grid titik, dan crop guide. | Mask + blur-in per huruf. |
| 1–3,3 | Pil muncul dari garis kecil lalu melebar. Nama model **menggulung vertikal ±0,25 s per kata** (GPT-5 → Claude → Gemini → Grok → DeepSeek → Mistral → Llama → Qwen → **every model.**), warna pil ber-crossfade, kotak seleksi Figma mengikuti dan label `W × H` berubah. | Gulungan slot cepat, ritme menanjak, ditahan di kata terakhir. |
| 3,3–4 | Huruf "Chat with" **jatuh berguling** dengan blur. **Pil meregang dan berubah menjadi kolom prompt.** | **Morph: satu benda menjadi benda berikutnya** (tanpa cut). |
| 4–6 | Chip model muncul di atas kolom. "Plan our product launch" diketik dengan caret. Kirim + cincin, teks terbang jadi gelembung di kanan atas, dan tiga kartu jawaban **tumbuh dari belakang kolom**. Jawaban di-stream dengan ekor memudar, badge waktu mono. "Ask them all at once." diketik. | Prompt → hasil keluar dari prompt itu sendiri. |
| 6,5–8,5 | **Kamera mundur**: UI mengecil jadi jendela browser, lalu jadi bagian **dinding banyak kartu** dengan kedalaman buram. "Now for your whole **team.**" | Zoom-out untuk skala. |
| 8,5–10 | Dinding pecah ke 3D, dan kartu fitur (SOC 2, 5,000+, Self-host, SSO) **mengorbit dengan paralaks** di sekitar judul tengah. Motion blur berat saat cepat. | Paralaks 3D + motion blur. |
| 10–12,5 | Kartu terbang masuk dan menjadi jendela app "Acme AI". "Your **brand.** / Your **domain.** / Your **data.**" Warna kata aksen dan **rona latar berganti** mengikuti brand di jendela (oranye → ungu → hijau → pink). | Rona latar per bagian. |
| 12,5–15 | Ikon app membesar ke kamera, lalu dunia gelap (gradasi anggur-navy). Pecahan low-poly meledak lalu **merakit jadi logo**. Wordmark diketik dengan caret, tagline, dua pil URL berlabel kecil. | Logo dirakit, CTA berupa pil URL. |

### Prinsip yang diambil (berlaku di seluruh video)
1. **Kamera hampir tidak pernah cut.**
   - Notion hanya punya 2 cut keras (masuk dan keluar bagian gelap); TypingMind nol.
   - Pergantian bab memakai **morph** (benda menjadi benda berikutnya), **zoom** ke UI, **zoom-out**, atau **iris**.
   - Geser kanvas hanya dipakai bila maknanya "maju".
2. **Selalu ada yang berubah setiap ±1–1,5 s**, dipicu kata VO, ketikan, atau klik. Tidak ada frame diam lebih dari 2 s kecuali hold yang disengaja.
3. **Teks:**
   - masuk per huruf/kata dengan mask + blur-in (stagger 0,02–0,05 s);
   - keluar dengan huruf jatuh berguling + blur (stagger ±0,02 s);
   - kata aksen biru, sesekali **serif italic** untuk kata yang ingin "dirasakan".
4. **Gulungan slot vertikal** untuk kata yang berganti dan untuk daftar.
   - Satu ganti kata ±0,25–0,3 s (cepat) atau ±0,9 s (daftar yang dibaca).
   - Pil berwarna dengan lebar pegas (sedikit overshoot) dan warna crossfade.
   - Kotak seleksi Figma + label `W × H` yang hidup.
5. **Prompt → hasil keluar dari prompt.** Kirim memicu denyut biru + cincin, dan kartu hasil tumbuh dari belakang kolom atau merakit diri.
6. **Teks AI di-stream** dengan ekor memudar (3–5 karakter), titik "•" di ujung, dan badge waktu mono.
7. **Kartu:**
   - radius 28 px (setara 16 px di 1280);
   - garis 1 px `#E3E6EC`;
   - bayangan dua lapis lembut;
   - header kartu dipisah garis tipis;
   - masuk dengan rotateX 8° → 0 dari bawah.
8. **Kedalaman:** layer belakang diburamkan dan diredupkan saat ada momen pahlawan (angka besar, rumus). Paralaks 3D untuk kelompok kartu.
9. **Angka menghitung naik** (ease-out ±1,5 s, berjenjang antarkartu).
10. **Status kecil sebagai bukti kerja:** badge `• …` di pojok, pil `Working…` → `✓ …`, dan chip yang muncul di baris.
11. **Rona latar per bab:** bercak gradasi ber-crossfade ke warna chip bab, sangat tipis.
12. **Bagian gelap** dibuka dengan cut keras, ditemani cahaya biru di pojok dan garis progres bertik + penghitung `0X / 0N`.
13. **CTA:** kursor mengklik dengan riak cincin + pendar di bawah tombol; pil URL diberi label kecil.
14. **Latar dan HUD:**
    - grid titik halus + bercak gradasi + crop mark tipis di sekitar elemen yang sedang "diedit";
    - HUD mono uppercase kecil abu: kiri atas `BEYOND STUDIO · TUTORIAL`, kanan atas `02 — NASKAH`, kiri bawah `00:05:38 ● 128 BPM`, kanan bawah `1080×1920 · 60FPS`.

### Teknis kualitas
- **Motion blur sungguhan (sub-frame)** untuk gerak cepat (gulungan, morph, zoom, huruf jatuh, paralaks): 6–12 sub-frame dirata-rata, hanya di frame yang sedang bergerak cepat (adaptif). Gerak lambat tanpa blur, supaya teks tetap tajam.
- **Supersampling 2×** untuk render final: dirender di 2160×3840 lalu diperkecil (lanczos), supaya tepi teks, garis 1 px, dan bayangan sehalus referensi.
- **Uji pembanding:** `npm run strip` membuat strip 10 fps dari potongan mana pun. Strip itu ditaruh berdampingan dengan strip referensi pada momen sejenis (gulungan kata, morph, kirim prompt, hitungan naik) sebelum scene dianggap selesai.

### Perubahan storyboard dari bedah ini
- **S1:** dibuka di **latar hitam**, persis seperti layar balas komentar TikTok. Teks komentar diseleksi dan terbang ke kolom prompt. Saat dikirim, **iris terang membesar dari tombol kirim** dan membuka dunia terang (pola Notion 5–6,4 s).
- **S2:** kartu angka **menghitung naik** (0 → 4.246, berjenjang). Saat "100% kode", still dan kartu di belakang diburamkan (depth of field).
- **Pergantian bab:** geser kanvas diganti morph/zoom per bab. Rinciannya ada di bagian "Transisi keluar" tiap scene, yang memang sudah berupa morph. Motif #6 diperbarui.
- **S7:** kamera mendorong masuk ke `TREATMENT.md` sampai blok S8 memenuhi panggung (pola Notion 9,6–12 s).
- **S10:** di "satu-satu", kamera **mundur dari satu still ke dinding seluruh 44 still** *Vibe Engineer* dengan kedalaman buram (pola TypingMind 6,5–8,5 s), lalu maju lagi ke still S5 untuk revisi.
- **S11:** setelah cut keras ke gelap, "Ini lima aturan yang sama:" dengan baris biru yang **menggulung** baca dulu → kasih konteks → perintah kecil → tes → commit, mengikuti VO, plus garis progres bertik `01 / 05` (pola Notion 36–39 s). Di belakangnya (buram), chip bab yang cocok menyala per aturan.
- **Serif italic** (Instrument Serif Italic, OFL) untuk tiga kata: "*bongkar*" (S1), "*tiap*" (S7, "Tulis *tiap* detiknya."), dan "*cara*" (S11).
- **Closing CTA:** pil Follow diklik kursor dengan riak + pendar biru. URL dan WhatsApp jadi pil berlabel kecil (`SITUS`, `WHATSAPP`). Urutan dan geometri logo tetap STYLE.md §1.

Pemicu: komentar TikTok dari **frenius_17** di video *Vibe Engineer* (42 rb views, 4.900 like di hari pertama): "wihhh bagus bang. buat tutorial nya bang".

## 1. Ide

Gelembung "Balas komentar" muncul, lalu teks komentarnya diseleksi dan terbang masuk ke kolom prompt Claude Code. Kolom prompt itu jadi poros seluruh video. Setiap langkah dimulai dengan sesuatu yang diketik dan dikirim di sana, lalu hasilnya muncul di atasnya sebagai kartu UI. Tutorialnya ada **tujuh bab (00–06)**: siapkan, aturan kerja, naskah, storyboard, kode, suara, cek & render. Yang ditampilkan adalah **artefak asli dari repo ini**: `CLAUDE.md`, skill `beyond-video`, `TREATMENT.md`, rumus `frame = f(t)`, still pixel asli, dan angka sungguhan. Di akhir, layar berubah gelap dan langkah-langkah itu ditarik garis ke **lima aturan dari video pertama**. Video tentang vibe engineer ternyata dibuat dengan cara vibe engineer. Bingkai HP lalu memutar akhir video pertama, kamera masuk ke layarnya, dan kita mendarat di closing Beyond Studio.

## 2. Tone & gaya

- **Motion design SaaS profesional**, mengikuti dua referensi di `reference video/`:
  - `original.mp4`: launch Notion AI workspace;
  - `original (1).mp4`: TypingMind.

  Unsur yang diambil:
  - latar terang dengan gradasi lembut;
  - headline grotesk tebal dengan satu kata aksen biru;
  - UI kartu yang naik pelan dengan bayangan lembut;
  - kata berganti dengan blur horizontal;
  - kotak seleksi ala Figma dengan label ukuran;
  - kursor yang mengklik dengan cincin;
  - HUD tipis di pojok (timecode, BPM, resolusi, bab);
  - selingan gelap untuk momen besar.
- **Suara bicara, layar mendokumentasi.** VO santai ("aku", "kamu", "nah", "terus"); nama tool, perintah, dan isi file ada di layar. Nomor bab hanya di layar, tidak diucapkan.
- **Sebab-akibat:** setiap kartu muncul karena prompt dikirim, chip diklik, atau kata VO jatuh. Tidak ada yang melayang tanpa sebab.
- **Satu kalimat utama di layar** (headline). Teks lain hanya isi UI (lebih kecil, abu) atau label.
- **Jujur:**
  - Claude Code butuh paket berbayar; ditulis kecil di layar.
  - Video pertama lewat tiga versi; diucapkan.
  - Tidak ada "before" palsu di beat revisi.
- Teks tanpa garis tepi dan tanpa halo.

## 3. Palet & tipografi

### Palet terang (bab 00–06)
| Peran | Warna |
|---|---|
| Latar dasar | `#F3F4F7` |
| Gradasi lembut (3 bercak radial, bergeser hanya saat kamera pindah bab) | biru `#DCE5FF`, lavender `#ECE3FA`, persik `#FBEADF` (opasitas 60–80 %) |
| Grid titik + crop mark (dekoratif) | `#0E1116` 5 % |
| Tinta / tinta 2 / mute | `#0E1116` / `#3A404B` / `#8A909C` |
| Kartu / garis kartu | `#FFFFFF` / `#E3E6EC`, bayangan `0 24 60 rgba(16,24,40,.10)` + `0 2 6 rgba(16,24,40,.06)` |
| Aksen (kata kunci, tombol kirim, kotak seleksi) | `#2F6BFF`, tekan `#1F55E0` |
| Lolos / salah / peringatan | `#1F9D63` / `#E5484D` / `#F2A93B` |
| Chip bab (6 warna lembut, satu per bab) | `#E7EEFF` `#EAF7EF` `#FFF3E2` `#F1EAFE` `#E6F6F8` `#FDEBEC` |

### Palet gelap (beat 17–18, mengalir ke closing)
| Peran | Warna |
|---|---|
| Latar | `#0B0D12` → `#000` saat masuk closing, satu bercak biru gelap `#13213F` |
| Teks / mute | `#F3F4F7` / `#8A909C` |
| Aksen | `#5B8CFF` (biru yang sama, dinaikkan untuk latar gelap) |

### Tipografi
- **Inter Tight** (`fonts/it.woff2`, disalin): headline, UI, dan closing.
  - Headline 600/700, 96–104 px, tracking −0,035 em, line-height 1,02.
  - UI kartu 30–36 px. Label kecil 24–26 px.
  - Saat build dicek apakah file ini variable. Kalau bukan, versi variable diunduh dari Google Fonts (OFL).
- **JetBrains Mono** (OFL, diunduh ke `fonts/`): prompt, terminal, isi file, HUD.
  - Prompt/terminal 30–32 px. HUD 20 px uppercase tracking 0,12 em.
  - Kicker bab `● 02 · NASKAH` 24 px.
- Angka besar (`4.246`, `0`, `6.090`) memakai Inter Tight 700 tabular, 150–180 px.
- Ukuran minimum di layar 24 px (masih terbaca di HP).

### Tata letak 9:16
```
y    0 ┌──────────────────────────────┐
       │ HUD atas (dekoratif)          │  kiri: BEYOND STUDIO · TUTORIAL   kanan: 02 · NASKAH
  250  ├──────────────────────────────┤
  300  │ kicker mono  ● 02 · NASKAH    │  x 80–930
       │ HEADLINE (maks. 3 baris)      │
  640  ├──────────────────────────────┤
       │ PANGGUNG: kartu UI, file,     │  x 60–1020 (teks penting ≤ x 930)
       │ terminal, still pixel         │
 1398  ├──────────────────────────────┤
       │ DOK PROMPT (kolom Claude Code)│  x 80–930, tinggi 156 (chip konteks di atasnya, y 1336)
 1554  ├──────────────────────────────┤
       │ HUD bawah (dekoratif)         │  kiri: timecode · 128 BPM   kanan: 1080×1920 · 60FPS
 1920  └──────────────────────────────┘
```
Area aman STYLE.md (250 atas, 350 bawah, 150 kanan) terpenuhi untuk semua teks penting. HUD hanya hiasan dan boleh tertutup UI TikTok.

## 4. Motif / benang merah

1. **Dok prompt = poros.** Selalu di y 1398–1554 (tepi bawah tetap; dok yang memuat 3 baris tumbuh ke atas). Gelembung komentar menjadi prompt pertama (S1). Setiap bab dimulai dengan prompt diketik lalu dikirim (tombol biru dengan cincin klik). Di S11 dok prompt meredup dan tenggelam: kerjanya selesai.
2. **Rel bab di HUD.** Tujuh titik `00–06` di pojok kanan atas, terisi satu per bab. Di S11 rel ini diputar 90° dan menjadi kolom kiri diagram "langkah → aturan".
3. **Kotak seleksi Figma** (`#2F6BFF`, 4 handle, label `W × H`) menandai hal yang harus diingat penonton: `100% kode` (S2), baris aturan (S4), `frame = f(t)` (S7), pin revisi (S9).
4. **Bukti asli dari video pertama.** Still pixel *Vibe Engineer* muncul sebagai kartu di S2, S6, S7, S9, dan S11. Pixel tajam (`image-rendering: pixelated`) di dalam kartu yang bersih: kontras dua gaya.
5. **Kata aksen biru.** Di setiap headline hanya satu kata yang biru, yaitu kata yang diucapkan VO saat itu.
6. **Tanpa cut, dengan morph.** Antar bab, satu benda berubah menjadi benda berikutnya (gelembung → prompt, layar sambutan → dok, kartu → chip, still → thumbnail, playhead → kanvas), atau kamera zoom masuk/mundur. Hanya ada dua cut keras: masuk dan keluar bagian gelap S11 (pola kedua referensi). Rona latar ber-crossfade ke warna chip bab.

## 5. Storyboard

Gerak dasar, kecuali disebut lain:
- headline naik dari balik mask per kata (outExpo 0,6 s, stagger 0,05 s) dan keluar ke atas (inExpo 0,25 s);
- kartu naik 40 px + skala 0,96 → 1 + bayangan tumbuh (outExpo 0,7 s);
- ketikan dikunci ke frame dengan ritme tangan: jeda per tombol tidak rata (±38 % lewat `hash`), jeda singkat sesudah spasi, lebih panjang sesudah koma/titik; total satu baris tetap panjang ÷ cps sehingga cue tidak bergeser. Huruf terbaru muncul dengan tinta biru yang memudar ke warna teks dalam 0,2 s; caret solid saat mengetik, lalu berdenyut lembut 1,06 Hz (bukan kedip keras);
- kursor panah digambar sendiri, klik = cincin `#2F6BFF` melebar 0,4 s.

Cue memakai `at(id, 'kata')`, sama seperti `vibe-engineer`.

### S1 · Komentar · 0,0 – 3,9 · VO 01
- **VO 01:** "Ada yang minta tutorialnya. Oke, aku bongkar semua."
- **Frame kunci:**
  - frame 0: **latar hitam** seperti layar balas komentar TikTok (tanpa HUD). 0,1 s: gelembung putih **Balas komentar frenius_17** pop (outBack) di tengah (x 120–860, y 640–900) dengan ekor kiri bawah, persis seperti sticker TikTok;
  - avatar = lingkaran inisial "F" abu `#D9DCE3`, bukan foto profil;
  - judul abu 26 px, teks hitam 44 px bold: "wihhh bagus bang. buat tutorial nya bang". "[Stiker]" tidak ditulis.
  - Di "Oke": kursor masuk dan memblok teks (sorot biru per kata).
  - Di "bongkar": blok teks lepas dari gelembung dan terbang melengkung ke dok prompt (yang naik dari bawah). Gelembung mengempis; teks mendarat sebagai isi prompt.
- **Transisi keluar:** tombol kirim diklik (denyut biru) → **iris terang membesar dari tombol kirim** dan membuka dunia terang + HUD → teks prompt naik jadi "pesan terkirim" kecil di atas dok → headline S2 masuk.
- **SFX:** pop gelembung (nada TikTok-ish, bukan sampel asli), sapuan blok teks, whoosh melengkung kiri → tengah, klik kirim.

### S2 · Nol keyframe · 3,9 – 12,6 · VO 02
- **VO 02:** "Video kemarin itu nggak ada keyframe-nya sama sekali. Nggak pakai After Effects. Semuanya kode... dan yang nulis, Claude Code."
- **Frame kunci:**
  - kicker `● VIDEO KEMARIN · 42RB VIEWS`; kartu video di tengah panggung (412×690, miring −2,5°) yang **memutar reel klip asli** *Vibe Engineer*: 7 potongan dari MP4 final, berganti setiap 2 ketukan dengan bar progres di bawah dan chip `42rb` / `4.900`. Urutannya: GAME OVER (0,5 s), TERIMA SEMUA + peti (19,05), bocor `BUG: 0 → 3` (25,7), kumbang keluar peti (33,0), naik pangkat (39,15), kraken (48,0), tembakan kecil (59,45). Suara klip terdengar pelan di bus musik, sehingga ikut ditekan VO;
  - headline besar dengan kata di pil yang menggulung vertikal (pola "Chat with [GPT-5]" referensi): *Nol* **[keyframe.]** (pil merah lembut) → (di "After Effects") *Nol* **[After Effects.]** (pil ungu tua) → (di "kode") *100%* **[kode.]** (pil biru `#2F6BFF`). Pil dibingkai kotak seleksi Figma yang label `W × H`-nya berubah mengikuti lebar pil;
  - di "kode": kartu video dibalik dan sisi belakangnya kode `film.js` (baris asli) yang bergulir pelan;
  - sesudah terbalik, kartu kode **berubah bentuk jadi jendela editor lebar**, pola morph TypingMind:
    - lebar 412 → 880 px dengan pegas, tinggi 690 → 560 px, dalam 0,7 s;
    - muncul nomor baris, tab `film.js` + path `vibe-engineer/src`;
    - huruf kode 17 → 22 px;
    - motion blur dan whoosh;
  - di "Claude Code": tiga kartu angka naik bergantian di bawah: `4.246` baris kode · `0` gambar dari luar · `musik` juga kode (ikon gelombang).
- **Transisi keluar:** kartu angka menyusut menjadi titik-titik yang terbang ke HUD kanan atas dan menjadi rel bab.
- **SFX:** swish per pergantian kata, klik seleksi, kibasan kartu, tiga tik angka bernada naik.

### S3 · Ada urutannya · 12,6 – 18,5 · VO 03
- **VO 03:** "Tapi jangan bayangin sekali prompt langsung jadi, ya. Nggak gitu. Ada urutannya."
- **Frame kunci:**
  - di dok prompt mengetik sendiri "bikinin video kayak kemarin" lalu tombol kirim berkedip merah dan diberi garis coret (`satu prompt ✗`);
  - di "Nggak gitu": headline **Bukan satu prompt.** dengan "satu prompt" tercoret garis biru yang ditarik kiri → kanan;
  - di "urutannya": daftar 7 chip bab tersusun vertikal di panggung (`00 SIAPKAN` … `06 CEK & RENDER`), masing-masing warna chip babnya, masuk berurutan di ketukan 128 BPM.
- **Transisi keluar:** chip `00 SIAPKAN` membesar, yang lain memudar; kanvas geser.
- **SFX:** ketik, buzz gagal pendek, garis coret, 7 tik di ketukan.

### S4 · 00 Siapkan · 18,5 – 25,2 · VO 04
- **VO 04:** "Yang perlu di-install ada di layar, ya. Udah? Bikin folder kosong, terus ketik claude."
- **Frame kunci:**
  - kicker `● 00 · SIAPKAN`, headline **Install tiga hal.** (kata aksen "tiga");
  - kartu terminal putih (judul `PowerShell`), baris diketik berurutan:
    - `# Claude Code`
    - `irm https://claude.ai/install.ps1 | iex`
    - `# Node.js 18+ dan ffmpeg (untuk render)`
    - `winget install OpenJS.NodeJS.LTS Gyan.FFmpeg`
  - catatan kecil mute di bawah kartu: "Mac/Linux: `curl -fsSL https://claude.ai/install.sh | bash` · butuh paket Claude Pro ke atas";
  - di "Udah?": tiga centang hijau di kanan baris;
  - di "folder kosong": baris `mkdir video-saya; cd video-saya`, lalu di "ketik claude": `claude` + enter, dan terminal berubah jadi layar sambutan Claude Code (dibuat ulang generik: kotak judul "Claude Code" + path folder, tanpa logo resmi).
- **Transisi keluar:** layar sambutan menyusut ke dok prompt (terminal dan dok adalah benda yang sama).
- **SFX:** ketikan mekanis lembut, centang ×3, enter.
- **Catatan fakta:** perintah install dari dokumentasi resmi `code.claude.com/docs/en/setup` (dicek 2026-10-03): native installer tidak butuh Node.js; Node dan ffmpeg dibutuhkan pipeline render kita. Paket winget untuk Node/ffmpeg dicek ulang saat build.

### S5 · 01 Aturan kerja · 25,2 – 49,0 · VO 05, 06, 07
- **VO 05:** "Nah, sebelum nyuruh apa-apa, aku bikin satu file, namanya CLAUDE.md. Isinya aturan kerja... dan Claude bakal baca ini tiap kali mulai."
- **VO 06:** "Isinya simpel. Jangan langsung ngerjain, kasih rencana dulu. Jangan render sendiri. Dan jangan pernah commit tanpa nanya aku."
- **VO 07:** "Terus aku bikinin dia skill, semacam buku panduan gaya. Ukuran video, logo di akhir, sampai daftar hal yang nggak boleh... biar hasilnya nggak kelihatan generik."
- **Frame kunci, VO 05:**
  - kicker `● 01 · ATURAN`, headline **Kasih aturan main.**;
  - kartu file `CLAUDE.md` muncul dengan tab ikon dokumen;
  - di "tiap kali mulai": panah kecil dari dok prompt ke kartu dengan label `dibaca otomatis tiap sesi`;
  - tip mute: "`/init` bisa bikinin draf awalnya".
- **Frame kunci, VO 06:** tiga baris asli dari `CLAUDE.md` disorot satu per satu mengikuti kata, masing-masing dengan kotak seleksi Figma:
  - "Review dulu, kerjakan kemudian." (di "rencana");
  - "Jangan render MP4" (di "render");
  - "Jangan pernah `git commit`" (di "commit").

  Baris lain diredupkan.
- **Frame kunci, VO 07:**
  - headline berganti **Lalu buku panduan gaya.**;
  - kartu `CLAUDE.md` bergeser kiri dan mengecil; dari kanan masuk pohon folder `.claude/skills/beyond-video/` dengan `SKILL.md` dan `STYLE.md`;
  - `STYLE.md` terbuka. Di "Ukuran video", "logo di akhir", dan "nggak boleh", chip `1080×1920 · 60 fps`, `closing logo`, lalu daftar **LARANGAN** muncul;
  - di "nggak boleh", tiga item larangan asli dicoret merah satu per satu: "otak bercahaya", "hujan kode Matrix", "gerak mengambang ala screensaver";
  - di "generik": cap kecil `anti-generik ✓`.
- **Transisi keluar:** kedua kartu terlipat menjadi dua chip kecil `CLAUDE.md` `skill` yang menempel di atas dok prompt (konteks ini ikut ke setiap prompt sesudahnya).
- **SFX:** buka file (kertas lembut), tiga klik seleksi, pohon folder terbuka (tik bertingkat), coret ×3, stempel kecil.

### S6 · 02 Naskah · 49,0 – 60,6 · VO 08, 09
- **VO 08:** "Baru deh mulai. Tapi jangan minta videonya dulu... minta naskahnya."
- **VO 09:** "Baca, coret yang nggak pas, bolak-balik sampai cocok. Baru bilang setuju."
- **Frame kunci, VO 08:**
  - kicker `● 02 · NASKAH`, headline **Naskah dulu.**;
  - **prompt diketik penuh di dok** (dipertahankan sesuai permintaan) dan dok melebar jadi 3 baris: "Bikin video edukasi 9:16 tentang vibe coder vs vibe engineer, gaya pixel art. Tulis naskahnya dulu, jangan coding.";
  - di "jangan minta videonya", frasa "jangan coding." disorot biru; di "naskahnya", tombol kirim diklik.
- **Frame kunci, VO 09:**
  - balasan Claude: tiga kartu hook (A/B/C) naik berjajar miring seperti referensi TypingMind, masing-masing satu baris pembuka + perkiraan detik;
  - di "coret": satu baris di kartu B dicoret dan ditulis ulang (ketikan kecil);
  - di "bolak-balik": dua gelembung pesan pendek bolak-balik di atas dok;
  - di "setuju": kursor mengklik chip **Setuju** di kartu A, kartu lain memudar, kartu A mendapat centang hijau.
- **Transisi keluar:** kartu A menjadi halaman pertama tumpukan dokumen yang terbuka ke S7.
- **SFX:** ketik, kirim, tiga kartu masuk (swish), coret, dua pop pesan, klik setuju + chime.

### S7 · 03 Storyboard · 60,6 – 68,6 · VO 10
- **VO 10:** "Habis itu minta storyboard. Detail banget... sampai posisi teks sama bunyi tiap gerakan ditulis."
- **Frame kunci:**
  - kicker `● 03 · STORYBOARD`, headline **Tulis tiap detiknya.**;
  - kartu `TREATMENT.md` bergulir cepat (judul-judul scene asli lewat dengan blur vertikal);
  - di "Detail banget" guliran berhenti di blok asli **S8 · ① Baca dulu**, yang mengembang;
  - kolomnya menyala berurutan: `waktu 44,2 – 50,2` → `teks ① BACA DULU` → di "posisi teks", diagram kecil 9:16 dengan kotak kartu → di "bunyi", baris `SFX: "ting" mata terbuka, tik per baris` dengan ikon gelombang;
  - **klip asli** S8 *baca dulu* (42,4–45,6 s video pertama) diputar berulang di samping kanan sebagai hasil jadi.
- **Transisi keluar:** still membesar dan menjadi thumbnail pertama di timeline S8.
- **SFX:** gulir (desis kertas cepat), klik berhenti, 4 tik nyala, "ting" kecil (kutipan dari video pertama).

### S8 · 04 Kode · 68,6 – 86,0 · VO 11, 12
- **VO 11:** "Nah, baru masuk kode. Ada satu kalimat yang wajib kamu taruh di prompt: tiap frame itu fungsi dari waktu."
- **VO 12:** "Artinya, mau lompat ke detik berapa pun, gambarnya selalu sama persis. Yang kamu lihat di preview, itu juga yang keluar pas render."
- **Frame kunci, VO 11:**
  - kicker `● 04 · KODE`, headline **Satu kalimat kunci.**;
  - dok prompt mengetik "... setiap frame adalah fungsi dari waktu t."; di "fungsi dari waktu" kalimat itu terangkat dari dok dan menjadi rumus besar di tengah panggung, `frame = f(t)` (JetBrains Mono 150 px), dibingkai kotak seleksi Figma (label `760 × 180`).
- **Frame kunci, VO 12:**
  - di bawah rumus: dua pemutar `preview` dan `render.mp4` memainkan **klip asli yang sama** (44,0–47,0 s) secara sinkron, dan kartu timeline dengan 8 thumbnail still asli + playhead biru;
  - di "lompat": playhead melompat-lompat (12,3 → 87,0 → 44,8 s) dan thumbnail di atasnya mengikuti;
  - di "sama persis": dua kopi frame di 44,8 s ditumpuk dan digeser hingga berimpit, label `diff 0 px · identik ✓`;
  - di "preview"/"render": dua label kecil `preview` dan `render.mp4` ditarik ke frame yang sama.
- **Transisi keluar:** playhead berlari ke kanan keluar layar, menarik kanvas ke S9.
- **SFX:** ketik, angkat rumus (whoosh naik), klik seleksi, tik playhead per lompatan, chord lolos lembut.

### S9 · 05 Suara · 86,0 – 96,4 · VO 13
- **VO 13:** "Buat suara, rekam aja suaramu sendiri. Sekali jalan, dari awal sampai akhir. Nanti Claude yang motong per kalimat, terus dicocokin ke gambarnya."
- **Frame kunci:**
  - kicker `● 05 · SUARA`, headline **Rekam sekali jalan.**;
  - ikon mikrofon (digambar sendiri, datar) + tombol rekam merah;
  - di "Sekali jalan": satu waveform panjang tergambar kiri → kanan (dari amplitudo VO beat ini sendiri, jadi bentuknya asli);
  - di "motong": garis potong turun di jeda-jeda waveform (`tools/vo-bagi.mjs`), waveform terbelah jadi klip `01` `02` `03` …;
  - di "dicocokin ke gambarnya": klip-klip menempel ke baris thumbnail scene di bawahnya, masing-masing ditarik garis tipis.
- **Transisi keluar:** klip terakhir menempel; seluruh baris mengecil jadi contact sheet S10.
- **SFX:** klik rekam, waveform tidak berbunyi sendiri (VO yang berbunyi), gunting ×5, snap klip ×5.

### S10 · 06 Cek & render · 96,4 – 116,6 · VO 14, 15, 16
- **VO 14:** "Terus minta dia ekspor gambar tiap scene. Dan ini penting... lihat sendiri, satu-satu."
- **VO 15:** "Ada yang aneh? Bilang aja, yang spesifik. Video kemarin aja sampai tiga versi."
- **VO 16:** "Kalau udah oke, render di laptopmu sendiri. Terus commit, biar ada titik aman buat balik."
- **Frame kunci, VO 14:**
  - kicker `● 06 · CEK & RENDER`, headline **Lihat sendiri.**;
  - dok prompt mengetik `npm run stills`; contact sheet 4×3 still asli *Vibe Engineer* tersusun;
  - di "satu-satu": lingkaran fokus (kaca pembesar datar) menyapu tiap still bergantian.
- **Frame kunci, VO 15:**
  - kaca pembesar berhenti di still `s05-bocor.png`; pin komentar biru menancap di bagian bawah palka;
  - dok prompt mengetik prompt kecil berdasarkan temuan nyata revisi 3 (redaksinya disederhanakan, bukan kutipan): "S5: laut depan jangan menutupi palka";
  - balasan Claude satu baris: "Diperbaiki: laut depan dipotong di garis air." + centang;
  - tidak ada "before" palsu; yang ditampilkan hanya keluhan → perintah → hasil, dan hasilnya berupa **klip asli** kapal bocor (25,0–28,0 s) yang diputar sebagai `v3`;
  - di "tiga versi": penghitung chip `v1 → v2 → v3` dengan v3 biru.
- **Frame kunci, VO 16:**
  - terminal: `npm run render`, progres `frame 0 → 6.090` (dihitung dari 101,4 s × 60) dengan bar biru;
  - di "commit": kartu commit message asli `feat(vibe-engineer): video edukasi Vibe Engineer …` diketik di kartu `git commit`, ikon kristal kecil `titik aman`.
- **Transisi keluar:** layar meredup ke gelap (lampu dimatikan) dimulai dari pojok kanan atas, tempat rel bab berada.
- **SFX:** ketik, shutter lembut per still masuk, sapuan kaca pembesar, pin tancap, ketik, centang, tik progres (dikunci ke ketukan), enter commit, bel kecil.

### S11 · Lima aturan · 116,6 – 131,2 · VO 17, 18 · gelap
- **VO 17:** "Eh, sadar nggak? Ini lima aturan yang sama kayak di video kemarin. Baca dulu, kasih konteks, perintah kecil, tes, commit."
- **VO 18:** "Jadi video soal vibe engineer... ya dibikin pakai cara vibe engineer juga."
- **Frame kunci, VO 17:**
  - latar `#0B0D12`; dok prompt tenggelam dan memudar;
  - rel bab dari HUD berputar dan turun menjadi **kolom kiri** (7 chip bab, x 80–440);
  - kolom kanan: lima chip aturan muncul satu per satu tepat di namanya diucapkan (x 600–930), dengan ikon slot warna video pertama (`#7FD3FF` `#F5B342` `#E5484D` `#5BD07D` `#5FE3F0`);
  - setiap chip aturan ditarik garis biru melengkung ke langkahnya:
    - baca dulu ← 02 naskah, 06 cek;
    - kasih konteks ← 01 aturan;
    - perintah kecil ← 03 storyboard, 06 revisi;
    - tes ← 04 kode;
    - commit ← 06 render.
- **Frame kunci, VO 18:**
  - diagram mundur dan memudar; headline putih **Vibe engineer, dibikin dengan cara vibe engineer.** (aksen pada "cara");
  - bingkai HP (garis tipis, sudut 64 px) naik dari bawah, memutar potongan asli *Vibe Engineer* S15 topi pindah → S16 `▶ LANJUT` (±5 s, urutan frame JPG, deterministik).
- **Transisi keluar (direvisi, disetujui user):** video pertama berakhir dengan iris pixel yang meninggalkan **cincin putih bercelah di kanan, berproporsi sama dengan logo** (diukur di frame terakhir klip: Ø 194 px, tebal 21,5 px). Kamera mendorong masuk (ease inOutExpo, 0,78 s) sambil bergeser, sehingga cincin itu mendarat tepat di tempat dan ukuran cincin logo closing (pusat 538,9 / 636,6; Ø 340,5). Layer closing memudar masuk di 0,14 s terakhir dengan cincin yang identik, jadi closing **melanjutkan** cincin itu, bukan menggambar cincin kedua (sebelumnya terasa seperti hampir membentuk logo lalu mengulang dari awal).
- **SFX:** whoosh rel berputar, 5 nada naik saat chip aturan muncul (motif jingle "+1" video pertama, diaransemen ulang lembut), garis tertarik ×5, chiptune + efek asli video pertama terdengar kecil dari "speaker HP" (klip **tanpa narator lama**, di-EQ ke 380 Hz–5,2 kHz, memudar saat kamera mendorong), dorongan masuk (whoosh rendah + nada D2→D3 sesuai kunci pad).

### S12 · Closing · 131,2 – ±141,5 · VO 19
Lihat §8.

## 6. Audio

- **VO:** ElevenLabs Eleven v4, satu tarikan, 19 baris. Naskah siap-paste `vo/naskah-elevenlabs.txt` (dibuat saat build) berisi tag nada v4 dalam `[kurung siku]`, satu tag per klausa, dan jeda `...`.
  - Nada umum: santai, hangat, seperti ngobrol ke teman; jangan nada iklan.
  - Pelafalan yang perlu dicek di rekaman pertama: "Claude" (klod), "CLAUDE.md" (klod em-de), "After Effects", "commit", "render", "preview", "storyboard", "skill". Kalau v4 salah ucap, tulisannya di naskah ElevenLabs diganti ejaan fonetis. Transkrip di layar tetap ejaan asli.
  - Dipotong dengan `tools/vo-bagi.mjs` (disalin dan disesuaikan ke 19 baris), dirapatkan `vo-rapat.mjs`, tempo asli.
- **Sumber waktu:** `src/timeline.js`. VO elastis; cue besar dikuantisasi ke ketukan 128 BPM; kata kunci dicari dengan `at(id, 'kata')`, dikunci ke jeda asli di file VO (pola `vibe-engineer/src/vo.js`).
- **Musik (sintetis, 128 BPM, satu tema):**

  | Bagian | Rasa |
  |---|---|
  | S1–S2 | pluck + pad lembut, tanpa kick |
  | S3–S7 | groove ringan: kick lembut, hat tipis, bass bulat |
  | S8 | breakdown (rumus `f(t)` butuh ruang tenang) |
  | S9–S10 | groove kembali, sedikit lebih padat |
  | S11 | pad gelap, lalu melodi terbuka di VO 18 |
  | S12 | akor brand Beyond Studio |

- **SFX:**
  - UI: pop, klik, ketik lembut, enter, swish kartu, swish ganti kata;
  - seleksi Figma (klik tipis), coret, centang, chime setuju, buzz gagal pendek;
  - gulir kertas, shutter still, pin, gunting, snap;
  - tik progres render, bel commit;
  - S11: 5 nada aturan, whoosh;
  - closing: whoosh panah, impact + bell, pop CTA, tap.
- **Mix:** VO men-duck musik −11 dB dan SFX −5 dB. Master −14 LUFS, true peak −1 dBTP. Stem musik dan SFX terpisah.

### File VO
| File | Teks |
|---|---|
| `01-komentar` | Ada yang minta tutorialnya. Oke, aku bongkar semua. |
| `02-kode` | Video kemarin itu nggak ada keyframe-nya sama sekali. Nggak pakai After Effects. Semuanya kode... dan yang nulis, Claude Code. |
| `03-urutan` | Tapi jangan bayangin sekali prompt langsung jadi, ya. Nggak gitu. Ada urutannya. |
| `04-siapkan` | Yang perlu di-install ada di layar, ya. Udah? Bikin folder kosong, terus ketik claude. |
| `05-claudemd` | Nah, sebelum nyuruh apa-apa, aku bikin satu file, namanya CLAUDE.md. Isinya aturan kerja... dan Claude bakal baca ini tiap kali mulai. |
| `06-aturan` | Isinya simpel. Jangan langsung ngerjain, kasih rencana dulu. Jangan render sendiri. Dan jangan pernah commit tanpa nanya aku. |
| `07-skill` | Terus aku bikinin dia skill, semacam buku panduan gaya. Ukuran video, logo di akhir, sampai daftar hal yang nggak boleh... biar hasilnya nggak kelihatan generik. |
| `08-naskah` | Baru deh mulai. Tapi jangan minta videonya dulu... minta naskahnya. |
| `09-setuju` | Baca, coret yang nggak pas, bolak-balik sampai cocok. Baru bilang setuju. |
| `10-storyboard` | Habis itu minta storyboard. Detail banget... sampai posisi teks sama bunyi tiap gerakan ditulis. |
| `11-kunci` | Nah, baru masuk kode. Ada satu kalimat yang wajib kamu taruh di prompt: tiap frame itu fungsi dari waktu. |
| `12-identik` | Artinya, mau lompat ke detik berapa pun, gambarnya selalu sama persis. Yang kamu lihat di preview, itu juga yang keluar pas render. |
| `13-suara` | Buat suara, rekam aja suaramu sendiri. Sekali jalan, dari awal sampai akhir. Nanti Claude yang motong per kalimat, terus dicocokin ke gambarnya. |
| `14-cek` | Terus minta dia ekspor gambar tiap scene. Dan ini penting... lihat sendiri, satu-satu. |
| `15-revisi` | Ada yang aneh? Bilang aja, yang spesifik. Video kemarin aja sampai tiga versi. |
| `16-render` | Kalau udah oke, render di laptopmu sendiri. Terus commit, biar ada titik aman buat balik. |
| `17-lima` | Eh, sadar nggak? Ini lima aturan yang sama kayak di video kemarin. Baca dulu, kasih konteks, perintah kecil, tes, commit. |
| `18-cara` | Jadi video soal vibe engineer... ya dibikin pakai cara vibe engineer juga. |
| `19-follow` | Follow, ya. Biar nggak cuma vibe coding. Terus kalau mau dibikinin video kayak gini... kontaknya ada di layar. |

`19-follow` diperpanjang dari naskah gerbang 1 untuk mengantar CTA kontak (lihat §8).

## 7. Engine & alasannya

**HTML/CSS (DOM) yang di-seek per frame di Chromium headless (Playwright) → screenshot → FFmpeg.** Pipeline VO, audio, dan render disalin dan disesuaikan dari `vibe-engineer/` (render.mjs, vo.js, vo-bagi, vo-rapat, audio.js), tanpa impor lintas folder.

Alasan:
- Gaya SaaS hidup dari tipografi tajam, bayangan lembut, sudut membulat, blur, dan teks UI panjang. Semua itu bawaan browser dan jauh lebih rapi di DOM daripada digambar ulang di Canvas2D.
- Pola render Chrome headless + VO elastis + audio sintetis sudah terbukti di `vibe-engineer/`.

Aturan determinisme (STYLE.md §1):
- Tidak ada CSS transition/animation. Setiap frame, `render(t)` menulis ulang transform, opasitas, isi teks, dan filter seluruh elemen dari t.
- Font dan semua gambar di-preload sebelum frame pertama; render menunggu `document.fonts.ready` dan `img.decode()`.
- Ketikan, caret, timecode, dan progres dikunci `round(t*60)/60`. Acak memakai `hash(i, seed)`.
- **Motion blur:** sub-frame adaptif. `timeline.js` menandai jendela gerak cepat, lalu renderer mengambil 6–12 sub-frame di sekitar t dan merata-ratakannya. Ini tetap f(t) karena setiap sub-frame juga f(t). Blur gaya (gulungan kata, huruf jatuh) ditambah SVG `feGaussianBlur` berarah, yang besarnya dihitung dari kecepatan analitis.
- Grain halus 3 % (statis per frame lewat `hash`) untuk mencegah banding gradasi. Lebih tipis dari rujukan 11–14 % karena gayanya bersih.

Struktur rencana (dirinci di gerbang 3):
- `render.mjs`
- `index.html`
- `src/timeline.js`
- `src/film.js`
- `src/ui/` (kartu, terminal, prompt dok, kursor, seleksi Figma, HUD)
- `src/scenes/s01…s12`
- `src/audio.js`
- `src/vo.js`
- `tools/`
- `fonts/`
- `assets/ve/`: aset dari *Vibe Engineer*, dibuat oleh `npm run aset` (hanya membaca `vibe-engineer/`, tidak ada yang diubah):
  - 44 still 540×960 JPG;
  - `klip/*.mp4`: 11 klip asli dipotong dari MP4 final (540×960, 30 fps, nearest-neighbour, yuv444p) + `.wav` untuk klip yang bersuara (reel S2, HP S11);
  - ±7 MB, **di-ignore git** (`.gitignore`): di clone baru dibuat ulang dengan `npm run aset`.

  Frame klip diekstrak otomatis ke `assets/ve/.frames/` (di-ignore git) saat preview atau render pertama. Saat ekspor, setiap frame menunggu gambar klip selesai di-decode, jadi tetap deterministik.

Kecepatan render: screenshot DOM ±80–120 ms/frame. ±8.500 frame jadi ±12–17 menit dengan 1 browser, atau ±4–5 menit dengan `--jobs 4`.

## 8. Closing + CTA

Mengikuti STYLE.md §1–2, dengan **satu tambahan atas permintaan user**: selain pil Follow (edukasi), ditampilkan juga URL **beyondstudio.site** dan tombol WhatsApp **0819-2707-0239** (`beyond-studio/kontak.json`). Ini hook untuk calon klien yang ingin dibuatkan video motion design.

- **Masuk:** dari dorongan kamera ke layar HP (S11), latar void `#000`.
- **Urutan:**
  1. **(direvisi, disetujui user)** cincin `#F5F5F5` sudah utuh sejak awal karena datang dari klip HP (S11): tebal dan diameter identik dengan logo, celahnya menyempit dari 81 ke 36 unit logo dalam 0,5 s. Pengganti langkah "digambar simetris dari jam 9" (STYLE.md §1.1). Kunci panah dimajukan ±0,5 s;
  2. panah terbang masuk dari kiri dengan jejak cahaya biru dan mengunci di celah kanan **tepat di ketukan** (gelombang kejut `#60A5FA`, pop outBack, impact + bell);
  3. wordmark "Beyond Studio" (Inter Tight 700, −0,045 em) naik dari balik mask (outExpo 0,75 s), di bawah logo;
  4. di "Follow" (VO 19): kalimat **Follow, biar nggak cuma vibe coding.** naik, pil **+ Follow** `#3B82F6` pop (outBack), lalu di-tap di ketukan → **✓ Following**;
  5. di "dibikinin video": baris mute "Mau dibikinin video kayak gini?", lalu pil URL `beyondstudio.site` (ikon globe, diketik) dan tombol WhatsApp `#25D366` `0819-2707-0239` pop berurutan; tombol WhatsApp mendapat satu cincin pulse (tanpa tap kedua, supaya Follow tetap aksi utama).
- **Tata letak:**

  | Elemen | Posisi |
  |---|---|
  | Logo | Ø 340 px, pusat y 600 |
  | Wordmark | y 860 |
  | Kalimat ajakan | y 990 |
  | Follow | y 1090 |
  | Baris "Mau dibikinin…" | y 1230 |
  | URL | y 1300 |
  | WhatsApp | y 1410 (bawah 1480) |

  Semua di dalam area aman.
- **Hold:** ≥ 1,2 s setelah VO 19 selesai.
- Geometri logo sesuai STYLE.md §1. Logo tidak diputar, tidak dicerminkan, dan celah tetap di kanan.

## Lampiran · Referensi → versi ini

| Referensi | Tutorial Vibe Engineer |
|---|---|
| 16:9, latar terang bergradasi | 9:16, latar `#F3F4F7` + 3 bercak lembut |
| "Docs here. Chats there." headline bertumpuk | headline satu kalimat, satu kata aksen biru |
| GPT-5 → Gemini → Mistral, ganti kata dengan blur | Nol keyframe → Nol After Effects → 100% kode |
| kotak seleksi Figma + label ukuran | kotak seleksi menandai hal yang harus diingat |
| kolom chat "Press / to focus input" | dok prompt Claude Code, poros seluruh video |
| tiga kartu jawaban GPT/Claude/Gemini | tiga kartu hook A/B/C, satu dipilih |
| HUD timecode, 128 BPM, 1920×1080 60FPS | HUD timecode, 128 BPM, 1080×1920 · 60FPS, rel bab |
| selingan gelap "Build agents that…" | selingan gelap "lima aturan" |
| logo wall + kartu angka | kartu angka asli: 4.246 baris, 0 gambar, musik kode |
| logo + CTA di-klik | closing Beyond Studio + Follow + URL + WhatsApp |

## Catatan build S3–S11 (2026-10-03)

**Revisi sesudah review:** (1) suara klip dibuat ulang tanpa narator video pertama — sebelumnya "…tapi nggak asal" dari narator lama terdengar setelah VO 18 selesai karena klip dipotong dari MP4 final; (2) closing menyambung dari cincin iris klip (lihat S11 "Transisi keluar" dan §8). Tool: `tools/ambil-klip-audio.mjs`.

Waktu sebenarnya dari file VO (`npm run vo`): S3 15,8 · S4 23,0 · S5 29,9 · S6 58,4 · S7 69,7 · S8 77,3 · S9 94,3 · S10 105,0 ·
S11 123,9 · closing 141,1 – 152,4 s. Semua cue dikunci ke kata VO di `src/timeline.js` (`node render.mjs cues <scene>`).

Yang berbeda dari storyboard di atas (semuanya kecil, maksud tiap beat tetap):
- **Determinisme klip:** frame klip dan still dipasang di ukuran sumber 540 × 960 lalu diperkecil dengan `transform` (bukan diatur lebarnya), supaya Chromium selalu memakai decode JPEG yang sama; `npm run check -- --dump` menyimpan dua versi frame yang berbeda ke `out/check/`.
- **Tanpa jeda kosong antar-bab:** headline bab berikutnya mulai ±0,1–0,4 s sebelum scene lama selesai, jadi selalu ada yang bergerak (dicek dengan strip 10 fps di tiap pergantian).
- **Dok prompt dipoles:** tinggi 124 → 156 (tepi bawah tetap 1554), toolbar ikon 25 px dengan tombol `+` bulat, tombol kirim 56 px yang tetap biru muda saat kosong (biru penuh saat siap kirim), satu sumbu dengan toolbar; bayangan tiga lapis + garis 1 px. Animasi ketik: lihat "Gerak dasar".
- **S3:** "Bukan satu prompt." sudah masuk di "jangan bayangin" (coretan biru tetap di "Nggak gitu"); tujuh chip bab diberi keterangan pendek (`install · folder`, `CLAUDE.md · skill`, …) dan disambung garis tipis; chip mulai di "Ada". Keluar: chip `00 SIAPKAN` mengecil naik menjadi kicker S4 (pengganti "kanvas geser").
- **S4:** centang ada di kanan baris komentar (`# Claude Code`, lalu dua untuk `# Node.js 18+ dan ffmpeg`). Terminal tidak dibersihkan: `mkdir …` dan `claude` menyusul di bawah baris install, lalu terminal menggulir naik untuk memperlihatkan layar sambutan (VO "Udah? Bikin folder" terlalu cepat untuk dua layar terpisah).
- **S5:** baris `CLAUDE.md` berupa kutipan asli yang dipotong "…" agar muat; satu kotak seleksi Figma berpindah di antara tiga aturan; kartu `CLAUDE.md` melipat jadi header saja (bukan geser kiri), skill tampil sebagai satu kartu pohon folder + `STYLE.md`; tag di baris asli: `ukuran video`, `logo di akhir`, `nggak boleh`.
- **S6:** tiap kartu hook punya tombol Setuju; isi hook A/B/C adalah contoh balasan (bukan klaim dari video pertama). Gelembung: "ganti hook B, bikin lebih singkat" → "oke, udah kuganti".
- **S7:** prompt "Tulis storyboard: teks, posisi, dan bunyi."; judul scene asli bergulir (daftar diulang supaya gulirannya panjang) lalu berhenti di S8. Isi blok S8 diambil dari teks asli treatment video pertama: `WAKTU`, `TEKS`, `POSISI` (diagram 9:16 mini), `BUNYI` ("ting"). Klip mengecil menjadi thumbnail ke-4 timeline S8.
- **S8:** rumus `frame = f(t)` 104 px (150 px melewati batas kanan area aman). Bukti "sama persis": pemutar `render.mp4` digeser menumpuk `preview` dengan blend *difference*, hasilnya hitam (`diff 0 px · identik ✓`); pembacaan `WAKTU VIDEO` + nomor frame ikut melompat.
- **S9:** pil REC dengan meter level dari amplitudo asli; waveform 1 take disapu kiri → kanan di "Sekali jalan … akhir" (selubung asli dari `vo/13-suara.wav`, `npm run env`); prompt "Potong per kalimat, cocokkan ke gambar."; 4 garis potong → 5 klip yang menempel di 5 thumbnail scene.
- **S10:** contact sheet 6×2 (4×3 terlalu kecil untuk 9:16); headline berganti per VO (Lihat sendiri. → Bilang yang spesifik. → Render, lalu commit.); keluhan muncul sebagai gelembung, jawaban di-stream dengan ekor memudar; kristal "titik aman" di header kartu commit. Lampu mati = cakram gelap dari pojok kanan atas; dok prompt tenggelam di saat yang sama (bukan di awal S11), jadi S11 dibuka gelap bersih.
- **S11:** di "video kemarin" lima slot kosong bergaris putus (warna slot video pertama) menunggu di kanan, lalu terisi chip aturan satu per satu. "Lima aturan yang sama:" + baris biru menggulung lima aturan dengan garis progres bertik dan `0N / 05`; HUD kanan atas bertuliskan `LIMA ATURAN`; HP 400 × 711 di tengah, dorongan kamera 2,8× masuk ke layar hitam tepat saat iris klip menutup.
