"""
Render video Beyond Studio frame-per-frame (1920x1080, 60fps, 30 detik = 1800 frame),
dengan motion blur sub-frame asli (seperti shutter kamera 180°), lalu otomatis digabung dengan audio.

Pemakaian (flag bisa digabung):
  python render.py                     -> 16:9 Inggris:     beyond-studio-30s.mp4
  python render.py --id                -> 16:9 Indonesia:   beyond-studio-30s-id.mp4
  python render.py --v                 -> 9:16 vertikal (Reels/TikTok/Shorts): beyond-studio-30s-vertical.mp4
  python render.py --id --v            -> 9:16 Indonesia:   beyond-studio-30s-id-vertical.mp4
  python render.py --cut sting         -> logo sting 3 detik (intro/outro konten lain)
  python render.py --cut bumper        -> bumper 6,5 detik (Designed/Built/Launched + end card WhatsApp)
  python render.py out.mp4 START END   -> render sebagian frame saja (mis. 0 600), tanpa audio

Opsi (environment variable):
  MB=6          jumlah sub-frame per frame untuk motion blur (1 = mati/draft cepat, 6 = default, 12 = paling halus)
  SHUTTER=180   sudut shutter dalam derajat (180 = standar film; 270-360 = blur lebih panjang)
  SCALE=1       2 = render 4K lalu diperkecil ke 1080p (tepi lebih halus, ~3x lebih lama)
  CRF=15        kualitas H.264 (lebih kecil = lebih tajam, file lebih besar)
  PRESET=medium preset x264
"""
import asyncio, os, sys, time, base64, io, subprocess, pathlib
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent
OUT_DIR = ROOT / 'videos'
OUT_DIR.mkdir(exist_ok=True)
FPS = 60; DUR = 30.0; N = int(FPS * DUR); W, H = 1920, 1080
ID = '--id' in sys.argv; VERT = '--v' in sys.argv
CUT = sys.argv[sys.argv.index('--cut') + 1] if '--cut' in sys.argv else None
args = [a for i, a in enumerate(sys.argv[1:], 1) if a not in ('--id', '--v', '--cut') and sys.argv[i - 1] != '--cut']
if VERT: W, H = 1080, 1920
sfx = ('-id' if ID else '') + ('-vertical' if VERT else '')
PAGE = ROOT / 'site' / (('index-id' if ID else 'index') + ('-v' if VERT else '') + '.html')
name = {'sting': 'beyond-studio-sting', 'bumper': 'beyond-studio-bumper'}.get(CUT, 'beyond-studio-30s')
# cut-downs = frame ranges of the same film + the matching audio slices
CUTS = {'sting': ([(0, 180)], "[1:a]atrim=0:3.0,asetpts=PTS-STARTPTS,afade=t=out:st=2.55:d=0.45[a]"),
        'bumper': ([(225, 394), (1578, 1800)], "[1:a]atrim=3.75:6.566667,asetpts=PTS-STARTPTS,afade=t=out:st=2.77:d=0.045[a1];"
                   "[1:a]atrim=26.3:30,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a2];[a1][a2]concat=n=2:v=0:a=1[a]")}
partial = len(args) > 1
out = args[0] if len(args) > 0 else str(OUT_DIR / f'video_noaudio-{name}{sfx}.mp4')
start = int(args[1]) if len(args) > 1 else 0
end = int(args[2]) if len(args) > 2 else N
FRAMES = [i for a, b in CUTS[CUT][0] for i in range(a, b)] if CUT else list(range(start, end))
CRF = os.environ.get('CRF', '15'); PRESET = os.environ.get('PRESET', 'medium')
SCALE = int(os.environ.get('SCALE', '1'))
MB = max(1, int(os.environ.get('MB', '6')))
SHUTTER = float(os.environ.get('SHUTTER', '180')) / 360.0

# sRGB <-> linear lookup tables: blur is averaged in linear light, like a real camera
_x = np.arange(256) / 255.0
TO_LIN = np.where(_x <= 0.04045, _x / 12.92, ((_x + 0.055) / 1.055) ** 2.4).astype(np.float32)
_y = np.arange(4096) / 4095.0
TO_SRGB = np.clip(np.round(255 * np.where(_y <= 0.0031308, _y * 12.92, 1.055 * _y ** (1 / 2.4) - 0.055)), 0, 255).astype(np.uint8)

vf = f'scale={W}:{H}:flags=lanczos,' if SCALE > 1 else ''
vf += 'scale=in_range=full:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p'
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', f'{W * SCALE}x{H * SCALE}', '-framerate', str(FPS), '-i', '-',
    '-vf', vf, '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-tune', 'film', '-g', '120', '-bf', '3',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-r', str(FPS), out], stdin=subprocess.PIPE)

async def grab(cdp):
    r = await cdp.send('Page.captureScreenshot', {'format': 'png', 'optimizeForSpeed': True})
    return np.asarray(Image.open(io.BytesIO(base64.b64decode(r['data']))).convert('RGB'))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--font-render-hinting=none', '--force-color-profile=srgb'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=SCALE)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(PAGE.as_uri() + '#capture' + (f'&mb={MB}' if MB > 1 else ''))
        await pg.evaluate('window.__ready')
        cdp = await pg.context.new_cdp_session(pg)
        print(f'render {PAGE.name}  {W}x{H}  {len(FRAMES)} frame{"  (" + CUT + ")" if CUT else ""}  motion blur: {MB} sub-frame, shutter {SHUTTER * 360:.0f}°', flush=True)
        t0 = time.time()
        for n_, i in enumerate(FRAMES):
            if MB == 1:
                await pg.evaluate(f'seek({i / FPS})')
                frame = await grab(cdp)
            else:
                acc = None
                for k in range(MB):
                    ts = max(0.0, (i + ((k + 0.5) / MB - 0.5) * SHUTTER) / FPS)
                    await pg.evaluate(f'seek({ts:.6f})')
                    lin = TO_LIN[await grab(cdp)]
                    acc = lin if acc is None else acc + lin
                frame = TO_SRGB[np.clip(np.rint(acc * (4095.0 / MB)), 0, 4095).astype(np.int16)]
            ff.stdin.write(np.ascontiguousarray(frame).tobytes())
            if n_ % 60 == 0:
                el = time.time() - t0; done = n_ + 1
                print(f'frame {n_}/{len(FRAMES)}  {el:.0f}s  sisa ~{(el / done) * (len(FRAMES) - n_) / 60:.1f} menit', flush=True)
        if errs: print('PAGE ERRORS:', errs[:5])
        await b.close()
    ff.stdin.close(); ff.wait(); print('video selesai:', out, flush=True)

asyncio.run(main())

if not partial and (ROOT / 'score.wav').exists():
    final = str(OUT_DIR / f'{name}{sfx}.mp4')
    af = (CUTS[CUT][1] + ';[a]loudnorm=I=-14:TP=-1.0:LRA=11[ao]') if CUT else '[1:a]loudnorm=I=-14:TP=-1.0:LRA=11[ao]'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out, '-i', str(ROOT / 'score.wav'),
        '-filter_complex', af, '-map', '0:v', '-map', '[ao]', '-c:v', 'copy', '-ar', '48000',
        '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final], check=True)
    print('FINAL:', final)
