"""
Memanggang tekstur Bumi malam untuk S6 (tarik mundur), S7 (orbit), dan S8 (tukik). Cukup dijalankan sekali;
hasilnya (PNG kecil) ikut di repo, jadi render tidak butuh internet.

Sumber (domain publik):
  - NASA Earth Observatory, Black Marble 2016 (Suomi NPP VIIRS), ubin D1 + D2 (±500 m/px)
  - Natural Earth 10m land (GeoJSON)

Hasil di app/public/data/:
  earth_core.png  lon 101–111 E, lat -8,5–3,5   R = lampu malam, G = jarak ke pantai (SDF), B = 0
  earth_wide.png  lon  85–135 E, lat -25–15     sama, resolusi rendah (medan jauh sampai cakrawala)
  earth.json      batas wilayah + rute kabel (lat/lon) + pengecekan rute tidak melewati daratan

Pemakaian: python tools/bake_earth.py   (unduhan ±63 MB disimpan di tools/.cache/, tidak ikut git)
"""
import json, math, pathlib, urllib.request
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / '.cache'
OUT = HERE.parent / 'app' / 'public' / 'data'
CACHE.mkdir(exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)

NASA = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/'
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_land.geojson'
TILE = 21600  # px per 90° (D1: lon 90–180, lat 90–0; D2: lon 90–180, lat 0 – -90)

# Rute kabel Jakarta → Singapura lewat Selat Gaspar, timur Bintan, Selat Singapura, mendarat di Changi (plausibel, bukan kabel bernama).
ROUTE = [(-6.09, 106.83), (-5.55, 106.88), (-4.9, 106.95), (-4.1, 107.05), (-3.35, 107.12), (-2.75, 107.2),
         (-2.2, 107.02), (-1.65, 106.75), (-1.05, 106.3), (-0.5, 105.75), (0.05, 105.3), (0.5, 105.05),
         (0.85, 105.0), (1.12, 104.93), (1.27, 104.68), (1.25, 104.4), (1.23, 104.15), (1.28, 104.03), (1.33, 103.99)]
PHONE = (-6.2, 106.82)      # Jakarta: HP penonton
SERVER = (1.35, 103.96)     # Singapura: pusat data (generik), dekat stasiun pendaratan Changi


def fetch(url, name):
    p = CACHE / name
    if not p.exists():
        print('unduh', url)
        urllib.request.urlretrieve(url, p)
    return p


def lights(box, res):
    """Lampu malam (0..1, float) untuk box (lon0, lat0, lon1, lat1) pada res derajat/px."""
    lon0, lat0, lon1, lat1 = box
    W = round((lon1 - lon0) / res); H = round((lat1 - lat0) / res)
    out = np.zeros((H, W), np.float32)
    for tile, latTop in (('D1', 90.0), ('D2', 0.0)):
        # bagian box yang ada di ubin ini
        a, b = max(lat0, latTop - 90), min(lat1, latTop)
        if a >= b: continue
        im = Image.open(fetch(NASA + f'BlackMarble_2016_{tile}.jpg', f'bm_{tile}.jpg'))
        px = TILE / 90.0
        crop = (int((lon0 - 90) * px), int((latTop - b) * px), int(math.ceil((lon1 - 90) * px)), int(math.ceil((latTop - a) * px)))
        sub = im.crop(crop).convert('RGB')
        rows = round((b - a) / res)
        sub = sub.resize((W, rows), Image.LANCZOS if res > 1 / px else Image.BICUBIC)
        arr = np.asarray(sub, np.float32) / 255.0
        # luminans (lampu jingga/putih) tanpa latar biru laut: ambil kanal maksimum dikurangi dasar biru
        lum = np.clip(arr.max(axis=2) - 0.55 * arr[..., 2] * (arr[..., 2] > arr[..., 0]), 0, 1)
        y0 = round((lat1 - b) / res)
        out[y0:y0 + rows] = lum[: H - y0]
        im.close()
    # buang lantai derau / latar bulan
    base = np.percentile(out, 40)
    return np.clip((out - base) / (1 - base), 0, 1)


def land_mask(box, res, ss=2):
    lon0, lat0, lon1, lat1 = box
    W = round((lon1 - lon0) / res) * ss; H = round((lat1 - lat0) / res) * ss
    img = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(img)
    gj = json.loads(fetch(NE, 'ne_10m_land.geojson').read_text(encoding='utf-8'))
    def xy(c): return ((c[0] - lon0) / (lon1 - lon0) * W, (lat1 - c[1]) / (lat1 - lat0) * H)
    for f in gj['features']:
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            xs = [c[0] for c in poly[0]]; ys = [c[1] for c in poly[0]]
            if max(xs) < lon0 - 1 or min(xs) > lon1 + 1 or max(ys) < lat0 - 1 or min(ys) > lat1 + 1: continue
            d.polygon([xy(c) for c in poly[0]], fill=255)
            for hole in poly[1:]: d.polygon([xy(c) for c in hole], fill=0)
    return np.asarray(img) > 127


def sdf(mask, ss, px_range):
    """Jarak bertanda ke pantai (px pada resolusi akhir), dikodekan 0..1 dengan 0,5 = pantai."""
    inside = ndimage.distance_transform_edt(mask)
    outside = ndimage.distance_transform_edt(~mask)
    d = (inside - outside) / ss
    d = d.reshape(d.shape[0] // ss, ss, d.shape[1] // ss, ss).mean(axis=(1, 3))
    return np.clip(0.5 + d / (2 * px_range), 0, 1)


def bake(name, box, res, px_range):
    L = lights(box, res)
    M = land_mask(box, res)
    S = sdf(M, 2, px_range)
    rgb = np.stack([L, S, np.zeros_like(L)], 2)
    Image.fromarray((rgb * 255 + 0.5).astype(np.uint8)).save(OUT / f'{name}.png', optimize=True)
    print(name, L.shape[::-1], 'lampu rata-rata', float(L.mean()))
    return M


CORE = (101.0, -8.5, 111.0, 3.5)
WIDE = (85.0, -25.0, 135.0, 15.0)
core_res = 90.0 / TILE          # 0,004167° ≈ 463 m
Mc = bake('earth_core', CORE, core_res, 24)
bake('earth_wide', WIDE, 0.04, 6)

# rute tidak boleh menyentuh daratan (cek di peta inti, sampel tiap ±1 km)
bad = []
H, W = Mc.shape
for (a, b) in zip(ROUTE, ROUTE[1:]):
    n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1])) / 0.01) + 1
    for i in range(n):
        lat = a[0] + (b[0] - a[0]) * i / n; lon = a[1] + (b[1] - a[1]) * i / n
        x = int((lon - CORE[0]) / (CORE[2] - CORE[0]) * W); y = int((CORE[3] - lat) / (CORE[3] - CORE[1]) * H)
        if Mc[y, x]: bad.append((round(lat, 3), round(lon, 3)))
km = sum(6371 * math.radians(math.hypot(b[0] - a[0], (b[1] - a[1]) * math.cos(math.radians((a[0] + b[0]) / 2)))) for a, b in zip(ROUTE, ROUTE[1:]))
print('panjang rute ±%.0f km, titik di darat: %d' % (km, len(bad)), bad[:8])
(OUT / 'earth.json').write_text(json.dumps({'core': CORE, 'wide': WIDE, 'route': ROUTE, 'phone': PHONE, 'server': SERVER,
                                            'routeKm': round(km), 'landHits': bad[:20]}, indent=1), encoding='utf-8')
