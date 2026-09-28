# Menyusun halaman animasi dari site/template.html + ikon Lucide di folder icons/.
#   site/index.html     -> versi Inggris
#   site/index-id.html  -> versi Indonesia (teks diganti sesuai teks-id.json)
# Jalankan ulang setiap kali kamu mengedit template.html atau teks-id.json.
import re, json, pathlib, sys
root = pathlib.Path(__file__).resolve().parent
tpl = (root/'site/template.html').read_text(encoding='utf-8')

def icon(m):
    svg = (root/f'icons/{m.group(1)}.svg').read_text(encoding='utf-8')
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.S).strip()
    inner = re.sub(r'\s+', ' ', re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)).strip()
    return f'<svg class="ic" viewBox="0 0 24 24">{inner}</svg>'

# WhatsApp contact (kontak.json) -> number on screen + QR codes
kontak = json.loads((root/'kontak.json').read_text(encoding='utf-8'))
tpl = tpl.replace('{{wa_tampil}}', kontak['tampil'])
try:
    import segno, urllib.parse
    for lang in ('en', 'id'):
        url = 'https://wa.me/' + kontak['nomor'] + '?text=' + urllib.parse.quote(kontak['pesan_' + lang])
        segno.make(url, error='m').save(str(root/f'site/assets/qr-wa-{lang}.svg'), scale=10, border=1, dark='#0A0A0A', light='#FFFFFF')
    print('QR WhatsApp dibuat ->', 'https://wa.me/' + kontak['nomor'])
except ImportError:
    print('(segno tidak terpasang: QR lama dipakai. pip install segno untuk membuat ulang)')

en = re.sub(r'\{\{i:([a-z0-9-]+)\}\}', icon, tpl)
(root/'site/index.html').write_text(en, encoding='utf-8')
print('built site/index.html')

tr = json.loads((root/'teks-id.json').read_text(encoding='utf-8'))
idv = en.replace('<html lang="en">', '<html lang="id">', 1)
missing = []
for k, v in tr.items():
    if k.startswith('_'): continue
    n = idv.count(k)
    if n == 0: missing.append(k); continue
    idv = idv.replace(k, v)
if tr.get('_css'):
    idv = idv.replace('</style>', '/* penyesuaian ukuran versi Indonesia */\n' + tr['_css'] + '\n</style>', 1)
(root/'site/index-id.html').write_text(idv, encoding='utf-8')
print('built site/index-id.html')
# vertical 9:16 variants (same film, re-flowed for Reels/TikTok/Shorts)
(root/'site/index-v.html').write_text(en.replace('<html lang="en">', '<html lang="en" class="v">', 1), encoding='utf-8')
(root/'site/index-id-v.html').write_text(idv.replace('<html lang="id">', '<html lang="id" class="v">', 1), encoding='utf-8')
print('built site/index-v.html, site/index-id-v.html')
if missing:
    print('\nPERINGATAN: teks berikut tidak ditemukan di template (belum diterjemahkan):')
    for k in missing: print('  -', k)
    sys.exit(1)
