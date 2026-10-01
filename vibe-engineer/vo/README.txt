Voice over Vibe Engineer: 16 file, satu per baris, nama persis:

  01-karam  02-bayu  03-merem  04-muat  05-malam  06-peti  07-pangkat  08-melek
  09-item  10-serang  11-cek  12-simpan  13-ulangi  14-layar  15-santai  16-follow

Ekstensi bebas: .wav .mp3 .m4a .ogg .flac .aac .webm   (contoh: 05-malam.wav)

CARA UTAMA: satu tarikan di ElevenLabs (Eleven v4), supaya suara dan nada konsisten.
  1. Buka naskah-elevenlabs.txt, copy blok di antara >>> dan <<<, generate SEKALI (jangan mode dialog).
  2. Pilih satu rekaman utuh terbaik, simpan sebagai  vo/satu-tarikan.mp3
  3. Dari folder vibe-engineer:
       npm run vo:bagi -- vo/satu-tarikan.mp3 --dry     lihat titik potongnya
       npm run vo:bagi -- vo/satu-tarikan.mp3           potong jadi 16 file + rapatkan → vo/<id>.wav
       npm run vo                                       cek posisi tiap scene dan durasi total

raw/        hasil potongan mentah (dan salinan satu-tarikan). Yang dipakai film adalah <id>.wav di folder ini.
lama/       VO Gemini dari naskah sebelumnya (tidak dipakai lagi; teksnya sudah berubah).
naskah-tts.txt   transkrip, nada, dan kartu tiap baris.

Hening di awal/akhir file dipotong otomatis. Kalimat yang lebih panjang dari perkiraan membuat scene-nya melebar;
semua yang sesudahnya (gambar, musik, efek, closing) ikut bergeser.
