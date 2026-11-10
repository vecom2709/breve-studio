"""Bildschirmaufnahmen der Startseite für Laptop-Bildschirm, Handy-Bildschirm und Prüfbilder.
Aufruf: python3 tools/bilder/aufnahme.py <basis-url> <zielordner> [prüfen]
"""
import sys, os
from playwright.sync_api import sync_playwright

BASIS, ZIEL = sys.argv[1].rstrip('/'), sys.argv[2]
PRUEFEN = len(sys.argv) > 3
os.makedirs(ZIEL, exist_ok=True)
fehler = []

with sync_playwright() as p:
    br = p.chromium.launch()
    for lang in ('de', 'it'):
        # Laptop: 1440 × 900, oberer Bildschirm der Seite
        ctx = br.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1.25, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.on('console', lambda m: fehler.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        pg.goto(f'{BASIS}/{lang}/', wait_until='networkidle')
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{ZIEL}/screen-{lang}.png')
        ctx.close()
        # Handy: 390 × 844 (iPhone-Format), oberer Bildschirm
        ctx = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True, reduced_motion='reduce')
        pg = ctx.new_page()
        pg.goto(f'{BASIS}/{lang}/', wait_until='networkidle')
        pg.wait_for_timeout(400)
        pg.screenshot(path=f'{ZIEL}/handy-{lang}.png')
        ctx.close()
    if PRUEFEN:
        for w, h in ((1586, 1000), (1920, 1080), (1280, 800), (1024, 768), (768, 1024), (390, 844), (360, 740)):
            ctx = br.new_context(viewport={'width': w, 'height': h}, reduced_motion='reduce')
            pg = ctx.new_page()
            pg.on('console', lambda m: fehler.append(f'{w}: {m.type}: {m.text}') if m.type == 'error' else None)
            pg.on('requestfailed', lambda r: fehler.append(f'{w}: FEHLGESCHLAGEN {r.url}'))
            pg.on('response', lambda r: fehler.append(f'{w}: {r.status} {r.url}') if r.status >= 400 else None)
            pg.goto(f'{BASIS}/de/', wait_until='networkidle')
            pg.wait_for_timeout(300)
            ueber = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            if ueber > 0:
                fehler.append(f'{w}: waagerechter Überlauf {ueber}px')
            pg.screenshot(path=f'{ZIEL}/pruef-{w}.png', full_page=(w in (1586, 390)))
            ctx.close()
    br.close()
print('\n'.join(fehler) if fehler else 'keine Konsolenfehler')
