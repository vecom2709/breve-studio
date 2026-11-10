"""Bildstrecke der Startseite: Hero (Szene erweitern, Original-Vecom-V auf die Tasse,
echte Seite auf den Laptop-Bildschirm), Kartenbilder, Ausgabe als AVIF/WebP/JPG.

Aufruf:
  python3 tools/bilder/startseite_bilder.py <quellordner> <zielordner> [screen-de.png screen-it.png]

Quellordner enthält: hero-roh.png (KI-Szene mit Grünbildschirm), v-emblem.png (Original-Logo),
karte-website.png, karte-dienst.png, karte-produkt.png, karte-alarm.png.
Ohne Screenshots wird der Bildschirm dunkel gefüllt (Zwischenstand für die Aufnahme).
"""
import sys, os
import numpy as np
import cv2
from PIL import Image

Q, Z = sys.argv[1], sys.argv[2]
SCREENS = sys.argv[3:5] if len(sys.argv) >= 5 else None
os.makedirs(Z, exist_ok=True)

LINKS, RECHTS = 400, 1400  # Erweiterung der Szene in Pixeln (Original 3168 × 1344)


def speichern(img: Image.Image, basis: str, jpg=True, avif_q=52, webp_q=80):
    img = img.convert('RGB')
    img.save(basis + '.avif', quality=avif_q, speed=4)
    img.save(basis + '.webp', quality=webp_q, method=6)
    if jpg:
        img.save(basis + '.jpg', quality=84, optimize=True, progressive=True)


# ---------- Kartenbilder ----------
for n in ('website', 'dienst', 'produkt', 'alarm'):
    im = Image.open(os.path.join(Q, f'karte-{n}.png')).convert('RGB').resize((960, 536), Image.LANCZOS)
    speichern(im, os.path.join(Z, f'karte-{n}'))

# ---------- Hero ----------
roh = np.asarray(Image.open(os.path.join(Q, 'hero-roh.png')).convert('RGB')).astype(np.float32)
H, W, _ = roh.shape

# 1) Bildschirmecken aus der Grünmaske, Kanten per Ausgleichsgerade
r, g, b = roh[..., 0], roh[..., 1], roh[..., 2]
gruen = (g - np.maximum(r, b))
maske = (gruen > 90).astype(np.uint8)
cnts, _ = cv2.findContours(maske, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cnts, key=cv2.contourArea).reshape(-1, 2).astype(np.float32)
s, d = c.sum(1), c[:, 0] - c[:, 1]
grob = np.array([c[s.argmin()], c[d.argmax()], c[s.argmax()], c[d.argmin()]])  # OL, OR, UR, UL


def kante(p, q):
    v = q - p
    t = ((c - p) @ v) / (v @ v)
    n = np.array([-v[1], v[0]]) / np.linalg.norm(v)
    abst = np.abs((c - p) @ n)
    sel = (t > 0.12) & (t < 0.88) & (abst < 6)
    vx, vy, x0, y0 = cv2.fitLine(c[sel], cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    return np.array([x0, y0]), np.array([vx, vy])


def schnitt(a, b_):
    (p1, v1), (p2, v2) = a, b_
    A = np.array([v1, -v2]).T
    t = np.linalg.solve(A, p2 - p1)
    return p1 + t[0] * v1


k = [kante(grob[i], grob[(i + 1) % 4]) for i in range(4)]  # oben, rechts, unten, links
ecken = np.array([schnitt(k[3], k[0]), schnitt(k[0], k[1]), schnitt(k[1], k[2]), schnitt(k[2], k[3])], np.float32)
print('Bildschirmecken', ecken.round(1).tolist())

# 2) Original-Vecom-V auf die Tasse (Zylinderabwicklung, Licht der Tasse übernehmen)
logo = np.asarray(Image.open(os.path.join(Q, 'v-emblem.png')).convert('RGBA')).astype(np.float32)
lh, lw = logo.shape[:2]
CX, CY, R = 1657.0, 908.0, 103.0           # Tassenmitte, Logomitte (Höhe), Radius in Pixeln
THETA = np.radians(33.5)                   # halbe Winkelbreite des Aufdrucks
breite_abgewickelt = 2 * R * THETA
hoehe = breite_abgewickelt * lh / lw
SENKUNG = 6.5                              # Aufsicht: Mitte einer Waagerechten liegt tiefer
x0, x1 = int(CX - R), int(CX + R)
y0, y1 = int(CY - hoehe), int(CY + hoehe)
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
sx = np.clip((xx - CX) / R, -0.999, 0.999)
th = np.arcsin(sx)
u = (th / THETA + 1) * 0.5 * lw
v = ((yy - CY - SENKUNG * (np.cos(th) - np.cos(THETA))) / hoehe + 0.5) * lh
gilt = (np.abs(th) <= THETA)
mx = np.where(gilt, u, -10).astype(np.float32)
my = np.where(gilt, v, -10).astype(np.float32)
pre = logo.copy(); pre[..., :3] *= pre[..., 3:4] / 255.0
warp = cv2.remap(pre, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
warp = cv2.GaussianBlur(warp, (0, 0), 0.75)
alpha = np.clip(warp[..., 3:4] / 255.0, 0, 1)
farbe = np.where(alpha > 1e-3, warp[..., :3] / np.maximum(alpha, 1e-3), 0)
tasse = roh[y0:y1, x0:x1]
lum = tasse.mean(2, keepdims=True)
ref = np.percentile(lum[gilt[..., None].repeat(1, 2)], 70)
schatten = np.clip(lum / ref, 0.45, 1.08)
# Druck auf Keramik: Gold behält Glanz, folgt aber dem Licht der Tasse
farbe = np.clip(farbe * (0.25 + 0.8 * schatten), 0, 255)
rng = np.random.default_rng(7)
farbe += rng.normal(0, 3.2, farbe.shape)
alpha *= np.clip((THETA - np.abs(th))[..., None] / np.radians(4), 0, 1) * 0.97
roh[y0:y1, x0:x1] = tasse * (1 - alpha) + farbe * alpha

# Farbgradierung an die Vorlage angeglichen (gemessen: Szene war ~25 % zu dunkel, Schatten zu neutral)
x = np.clip(roh / 255.0, 0, 1)
x = x ** 0.84
lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
x = x + (1 - lum) ** 2.2 * np.array([-0.012, 0.05, 0.042])
grau = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
x = grau + (x - grau) * 1.1
roh = np.clip(x, 0, 1) * 255.0

# 3) Szene links und rechts erweitern (gespiegelt, rechts unscharf und dunkler – darüber liegt das Panel)
canvas = np.zeros((H, W + LINKS + RECHTS, 3), np.float32)
canvas[:, LINKS:LINKS + W] = roh
canvas[:, :LINKS] = roh[:, :LINKS][:, ::-1]
# rechts nur den Randstreifen (Pflanze, Vorhang) gespiegelt fortsetzen – nie den Laptop mitspiegeln
streifen = roh[:, W - 420:]
kacheln, gespiegelt = [], True
while sum(k_.shape[1] for k_ in kacheln) < RECHTS:
    kacheln.append(streifen[:, ::-1] if gespiegelt else streifen)
    gespiegelt = not gespiegelt
canvas[:, LINKS + W:] = np.concatenate(kacheln, 1)[:, :RECHTS]
unscharf = cv2.GaussianBlur(canvas, (0, 0), 30)
X = np.arange(canvas.shape[1], dtype=np.float32)
rampe = np.clip((X - (LINKS + W - 260)) / 420, 0, 1)[None, :, None]
dunkel = 1 - 0.28 * np.clip((X - (LINKS + W - 200)) / 900, 0, 1)[None, :, None]
canvas = (canvas * (1 - rampe) + unscharf * rampe) * dunkel
ecken_c = ecken + np.array([LINKS, 0], np.float32)

# Bildschirm-Matte (weich) und Grünsaum am Rahmen entfernen
r, g, b = canvas[..., 0], canvas[..., 1], canvas[..., 2]
matte = np.clip((g - np.maximum(r, b) - 25) / 80, 0, 1)
nah = cv2.dilate((matte > 0.02).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
spill = nah & (g > np.maximum(r, b))
canvas[..., 1] = np.where(spill, np.maximum(r, b) + (g - np.maximum(r, b)) * 0.08, g)


def hero_bauen(screen_png, lang):
    out = canvas.copy()
    sw, sh = 1600, 1000
    if screen_png:
        scr = np.asarray(Image.open(screen_png).convert('RGB').resize((sw, sh), Image.LANCZOS)).astype(np.float32)
    else:
        scr = np.zeros((sh, sw, 3), np.float32) + np.array([14, 48, 46], np.float32)
    # Bildschirm leuchtet, aber nicht heller als die Szene: leicht absenken, Vignette, Lampenreflex oben rechts
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    vign = 1 - 0.16 * (((xx / sw - 0.5) ** 2 + (yy / sh - 0.5) ** 2) * 2.2)
    scr = scr * 0.9 * vign[..., None]
    reflex = np.clip(1 - np.hypot((xx - sw * 0.92) / (sw * 0.7), (yy - sh * 0.02) / (sh * 0.9)), 0, 1) ** 2 * 26
    scr = np.clip(scr + reflex[..., None], 0, 255)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), ecken_c)
    warped = cv2.warpPerspective(scr, M, (out.shape[1], out.shape[0]), flags=cv2.INTER_AREA)
    a = matte[..., None]
    out = out * (1 - a) + warped * a
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    for bw in (1600, 2560, 3600):
        bh = round(img.height * bw / img.width)
        speichern(img.resize((bw, bh), Image.LANCZOS), os.path.join(Z, f'hero-{lang}-{bw}'), jpg=(bw == 2560))
    # Handy-Ausschnitt: Tasse + Laptop, 5:4
    mx0 = LINKS + 1380
    mob = img.crop((mx0, 128, mx0 + 1520, 128 + 1216)).resize((1000, 800), Image.LANCZOS)
    speichern(mob, os.path.join(Z, f'hero-{lang}-mobil'), jpg=False)
    print('Hero', lang, img.size)


hero_bauen(SCREENS[0] if SCREENS else None, 'de')
hero_bauen(SCREENS[1] if SCREENS else None, 'it')
