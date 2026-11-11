"""Kartenbilder aller Pakete mit Vorschau: Aufnahme der klickbaren Vorschau je Sprache (1024 × 576).
Ergebnis: public/images/packages/<nr>-<slug>-vorschau.jpg und -vorschau-it.jpg
Aufruf (Vorschau-Server läuft): python3 tools/bilder/vorschau_bilder.py http://127.0.0.1:4173 [--nur-fehlende]
"""
import io, json, os, re, sys
from playwright.sync_api import sync_playwright
from PIL import Image
BASIS = sys.argv[1].rstrip('/')
NUR_FEHLENDE = '--nur-fehlende' in sys.argv
quelle = open('src/content/packages.ts').read() + open('src/content/packages-neu.ts').read()
PAKETE = {s: int(n) for n, s in re.findall(r"number: (\d+),\s*slug: '([a-z]+)'", quelle)}
PAKETE.update({p['slug']: p['number'] for p in json.load(open('src/content/pakete-auto.json'))})
PFAD = {'de': 'pakete', 'it': 'pacchetti'}
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang in ('de', 'it'):
        pg = b.new_page(viewport={'width': 1280, 'height': 1000}, device_scale_factor=1.25, reduced_motion='reduce')
        for slug, nr in sorted(PAKETE.items(), key=lambda x: x[1]):
            ziel = f'public/images/packages/{nr:02d}-{slug}-vorschau' + ('' if lang == 'de' else '-it') + '.jpg'
            if NUR_FEHLENDE and os.path.exists(ziel):
                continue
            pg.goto(f'{BASIS}/{lang}/{PFAD[lang]}/{slug}/', wait_until='networkidle')
            if not pg.locator('.vs').count():
                continue
            pg.wait_for_timeout(250)
            im = Image.open(io.BytesIO(pg.locator('.vs').screenshot())).convert('RGB').resize((1024, 576), Image.LANCZOS)
            im.save(ziel, quality=84, optimize=True, progressive=True)
            print(ziel)
        pg.close()
    b.close()
