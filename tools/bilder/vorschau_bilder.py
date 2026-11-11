"""Kartenbilder der Pakete mit Vorschau: Aufnahme der klickbaren Vorschau je Sprache (1024 × 576).
Aufruf (Vorschau-Server läuft): python3 tools/bilder/vorschau_bilder.py http://127.0.0.1:4173
"""
import sys, io
from playwright.sync_api import sync_playwright
from PIL import Image
BASIS = sys.argv[1].rstrip('/')
PAKETE = {'menuvivo': 11, 'mappaviva': 12, 'agendabreve': 13, 'socialsettimana': 14, 'eventolampo': 15}
PFAD = {'de': 'pakete', 'it': 'pacchetti'}
with sync_playwright() as p:
    b = p.chromium.launch()
    for lang in ('de', 'it'):
        pg = b.new_page(viewport={'width': 1280, 'height': 1000}, device_scale_factor=1.25, reduced_motion='reduce')
        for slug, nr in PAKETE.items():
            pg.goto(f'{BASIS}/{lang}/{PFAD[lang]}/{slug}/', wait_until='networkidle')
            pg.wait_for_timeout(300)
            png = pg.locator('.vs').screenshot()
            im = Image.open(io.BytesIO(png)).convert('RGB').resize((1024, 576), Image.LANCZOS)
            ziel = f'public/images/packages/{nr:02d}-{slug}-hero' + ('' if lang == 'de' else '-it') + '.jpg'
            im.save(ziel, quality=84, optimize=True, progressive=True)
            print(ziel)
        pg.close()
    b.close()
