# Membuat ulang QR WhatsApp end card (versi 16:9) dari kontak.json:
#   app/public/assets/qr-wa-id.svg dan qr-wa-en.svg (masing-masing dengan pesan pembuka sesuai bahasa).
# Nomor yang tampil di layar dibaca langsung oleh app dari kontak.json, jadi cukup jalankan ini bila nomor/pesan berubah.
# Butuh: pip install segno
import json, pathlib, urllib.parse
import segno

root = pathlib.Path(__file__).resolve().parent
kontak = json.loads((root / 'kontak.json').read_text(encoding='utf-8'))
for lang in ('en', 'id'):
    url = 'https://wa.me/' + kontak['nomor'] + '?text=' + urllib.parse.quote(kontak['pesan_' + lang])
    segno.make(url, error='m').save(str(root / f'app/public/assets/qr-wa-{lang}.svg'), scale=10, border=1, dark='#0A0A0A', light='#FFFFFF')
print('QR WhatsApp dibuat ->', 'https://wa.me/' + kontak['nomor'])
