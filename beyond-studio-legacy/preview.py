"""Ambil still frame di detik tertentu untuk cek visual.
Pemakaian: python preview.py 1.9,8.5,20,28  [prefix_output]  [--id] [--v]"""
import sys, asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent
ID = '--id' in sys.argv; VERT = '--v' in sys.argv
args = [a for a in sys.argv[1:] if a not in ('--id', '--v')]
PAGE = ROOT / 'site' / (('index-id' if ID else 'index') + ('-v' if VERT else '') + '.html')
times = [float(x) for x in args[0].split(',')]
out = args[1] if len(args) > 1 else str(ROOT / ('still-id' if ID else 'still'))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--font-render-hinting=none'])
        pg = await b.new_page(viewport={'width': 1080, 'height': 1920} if VERT else {'width': 1920, 'height': 1080})
        pg.on('pageerror', lambda e: print('ERR', e))
        await pg.goto(PAGE.as_uri() + '#capture')
        await pg.evaluate('window.__ready')
        for t in times:
            await pg.evaluate(f'seek({t})')
            f = f'{out}_{t:05.2f}.png'; await pg.screenshot(path=f); print(f)
        await b.close()
asyncio.run(main())
