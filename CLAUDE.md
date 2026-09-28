# Motion-Grapich-Code — aturan kerja

Repo konten TikTok **Beyond Studio** (edukasi tech sampai promosi), dibuat sebagai motion graphics berbasis kode.

## Aturan tetap
- **Review dulu, kerjakan kemudian.** Setiap permintaan, sekecil apa pun, jangan langsung dikerjakan. Ajukan rencananya untuk direview: untuk video berupa storyboard, gaya, dan kebutuhan aset/audio; untuk revisi berupa apa yang diubah, di scene mana, dan dampaknya. Kerjakan hanya setelah user bilang setuju.
- Kerja langsung di branch `master`. Jangan membuat branch atau worktree baru.
- Hasil kerja = **file siap render** (kode, aset, naskah, dokumen). Jangan render MP4 (final maupun draft); user yang me-render sendiri. Still/contact sheet PNG boleh untuk pengecekan visual, simpan di `out/`.
- **Jangan pernah `git commit` / `git push`** tanpa persetujuan eksplisit user. Di akhir pekerjaan, tulis commit message siap copy dalam blok ```text```.
- Jangan menyentuh folder proyek lain selain yang sedang dikerjakan.

## Video baru
Setiap video baru maupun revisi (sekecil apa pun) wajib memakai skill `beyond-video` (`.claude/skills/beyond-video/`). Skill itu yang menjaga tone khas Beyond Studio.

## Peta repo
- `beyond-studio/`: promo 45 s 3D (three.js + Vite, render Node + Chrome headless; `cues.json` = sumber waktu).
- `evolusi-layar/`: edukasi vertikal (Node + Canvas2D, VO elastis, audio sintetis).
- `celestial-scrolls/`: promo sinematik satu file HTML (CDP).
- `pdoom-video-main/`: benchmark eksternal (gitignored, hanya ada lokal). Rujukan kualitas, bukan untuk diedit.
