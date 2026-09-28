# Motion-Grapich-Code — aturan kerja

Repo konten TikTok **Beyond Studio** (edukasi tech sampai promosi), dibuat sebagai motion graphics berbasis kode.

## Aturan tetap
- Kerja langsung di branch `master`. Jangan membuat branch atau worktree baru.
- Hasil kerja = **file siap render** (kode, aset, naskah, dokumen). Jangan render MP4 (final maupun draft); user yang me-render sendiri. Still/contact sheet PNG boleh untuk pengecekan visual, simpan di `out/`.
- **Jangan pernah `git commit` / `git push`** tanpa persetujuan eksplisit user. Di akhir pekerjaan, tulis commit message siap copy dalam blok ```text```.
- Jangan menyentuh folder proyek lain selain yang sedang dikerjakan.

## Video baru
Setiap video baru (atau revisi besar) wajib memakai skill `beyond-video` (`.claude/skills/beyond-video/`). Skill itu yang menjaga tone khas Beyond Studio.

## Peta repo
- `beyond-studio/`: promo 30 s (Python + DOM, render Playwright).
- `evolusi-layar/`: edukasi vertikal (Node + Canvas2D, VO elastis, audio sintetis).
- `celestial-scrolls/`: promo sinematik satu file HTML (CDP).
- `pdoom-video-main/`: benchmark eksternal (gitignored, hanya ada lokal). Rujukan kualitas, bukan untuk diedit.
