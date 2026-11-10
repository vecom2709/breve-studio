"""QR-Codes zur App-Version (DE/IT): Petrol auf Weiß, goldenes V in der Mitte (Fehlerkorrektur H).
Ziel ist die öffentlich erreichbare Vorschau; nach dem Domainstart ZIEL anpassen und neu erzeugen.
Aufruf: python3 tools/bilder/qr_codes.py
"""
import base64, io
import segno
import numpy as np
import cv2
from PIL import Image

ZIEL = 'https://vecom2709.github.io/breve-studio/{lang}/app/'
logo = Image.open('public/logo-studio-breve-gold.png').convert('RGBA')
a = np.asarray(logo).astype(np.float32)
mx, mn = a[..., :3].max(2), a[..., :3].min(2)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
ys, xs = np.nonzero((sat > 0.35) & (a[..., 3] > 40))
v = logo.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
va = np.asarray(v).copy(); vs = np.where(va[..., :3].max(2) > 0, (va[..., :3].max(2) - va[..., :3].min(2)) / np.maximum(va[..., :3].max(2), 1), 0)
va[..., 3] = np.where(vs > 0.3, va[..., 3], 0)
v = Image.fromarray(va)
puffer = io.BytesIO(); v.save(puffer, 'PNG')
v64 = base64.b64encode(puffer.getvalue()).decode()

for lang in ('de', 'it'):
    url = ZIEL.format(lang=lang)
    qr = segno.make(url, error='h', boost_error=False)
    n = qr.symbol_size(border=2)[0]
    svg = io.BytesIO()
    qr.save(svg, kind='svg', scale=1, border=2, dark='#0b302e', light='#ffffff', xmldecl=False, svgns=True, nl=False)
    inhalt = svg.getvalue().decode()
    # Mitte: weiße Fläche + goldenes V (bedeckt < 9 % der Fläche, Fehlerkorrektur H trägt bis 30 %)
    f = n * 0.24; x0 = (n - f) / 2
    vb = f * 0.78; vh = vb * v.height / v.width
    mitte = (f'<rect x="{x0:.2f}" y="{x0:.2f}" width="{f:.2f}" height="{f:.2f}" rx="{f*0.18:.2f}" fill="#fff"/>'
             f'<image x="{(n-vb)/2:.2f}" y="{(n-vh)/2:.2f}" width="{vb:.2f}" height="{vh:.2f}" href="data:image/png;base64,{v64}"/>')
    inhalt = inhalt.replace('</svg>', mitte + '</svg>')
    inhalt = inhalt.replace('<svg ', f'<svg viewBox="0 0 {n} {n}" shape-rendering="crispEdges" ', 1)
    open(f'public/images/app/qr-{lang}.svg', 'w').write(inhalt)
    # Prüfung: Code mit Logo rendern und wieder auslesen
    png = io.BytesIO(); qr.save(png, kind='png', scale=12, border=2, dark='#0b302e')
    img = Image.open(png).convert('RGBA'); s = img.width / n
    w_ = int(f * s); weiss = Image.new('RGBA', (w_, w_), 'white'); img.alpha_composite(weiss, (int(x0 * s), int(x0 * s)))
    vv = v.resize((int(vb * s), int(vh * s))); img.alpha_composite(vv, (int((n - vb) / 2 * s), int((n - vh) / 2 * s)))
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(np.asarray(img.convert('RGB')), cv2.COLOR_RGB2BGR))
    print(lang, 'Module', n, 'gelesen:', text, 'OK' if text == url else 'FEHLER')
