"""Bewegte Kartenbilder der Startseite (nahtlose Schleifen, H.264-MP4 + Standbild).

  website  – die echte Startseite scrollt auf dem Laptop-Bildschirm
  alarm    – die Glocke auf dem Bildschirm läutet (Pendel um den Aufhängepunkt), Leuchten pulsiert
  produkt  – Goldpaket aus Blender (pk_0001.png …) dreht sich um 90° und schwebt, dazu Lichtschein
  dienst   – Zahnräder aus Blender (Bildfolge zr_0001.png …), jedes Rad dreht genau eine Zahnteilung

Aufruf: python3 tools/bilder/karten_animation.py <quellordner> <zielordner> [zahnrad-bildordner] [paket-bildordner]
Quellordner: karte-website.png, karte-alarm.png, karte-produkt.png, seite-voll-de.png
"""
import os, subprocess, sys
import numpy as np
import cv2
from PIL import Image

Q, Z = sys.argv[1], sys.argv[2]
ZR = sys.argv[3] if len(sys.argv) > 3 else None
FPS, OW, OH = 24, 1152, 360  # Ausgabe 3,2 : 1 wie die Karte
os.makedirs(Z, exist_ok=True)


def laden(n):
    return np.asarray(Image.open(os.path.join(Q, n)).convert('RGB')).astype(np.float32)


def band(img, pos):
    H, W = img.shape[:2]
    bh = round(W / 3.2)
    y0 = round(pos * (H - bh))
    return img[y0:y0 + bh]


def kodieren(name, bilder):
    """bilder: Erzeuger von HxWx3-float-Bildern im Kartenformat."""
    pfad = os.path.join(Z, f'karte-{name}.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', pfad],
                         stdin=subprocess.PIPE)
    erstes = None
    for b in bilder:
        b8 = cv2.resize(np.clip(b, 0, 255).astype(np.uint8), (OW, OH), interpolation=cv2.INTER_AREA)
        if erstes is None:
            erstes = b8
        p.stdin.write(b8.tobytes())
    p.stdin.close(); p.wait()
    poster = Image.fromarray(erstes)
    poster.save(os.path.join(Z, f'karte-{name}-poster.webp'), quality=82, method=6)
    poster.save(os.path.join(Z, f'karte-{name}-poster.jpg'), quality=84, optimize=True)
    print(name, os.path.getsize(pfad) // 1024, 'KB')


def sanft(x):  # weich ein- und ausschwingen
    x = np.clip(x, 0, 1)
    return x * x * x * (x * (6 * x - 15) + 10)


# ---------- Website: echte Seite scrollt ----------
def website():
    basis = laden('karte-website.png')
    seite = laden('seite-voll-de.png')
    # Ecken der Anzeigefläche, an 4-fach vergrößerten Ausschnitten nachgemessen (links unten liegt die Kante bei x≈656)
    ecken = np.float32([[683.5, 284.0], [1050.5, 282.5], [1031.5, 559.5], [655.5, 526.5]])
    mitte_q = ecken.mean(0)
    ecken = mitte_q + (ecken - mitte_q) * 1.006   # minimal größer: alter Bildschirminhalt darf nirgends durchblitzen
    H, W = basis.shape[:2]
    maske = np.zeros((H * 4, W * 4), np.uint8)
    cv2.fillPoly(maske, [np.int32(ecken * 4)], 255)
    maske = cv2.resize(maske, (W, H), interpolation=cv2.INTER_AREA)[..., None] / 255.0
    sw, sh = 1280, 800
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), ecken)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # dezenter Glanz von links oben (Fenster) statt des alten Bildes
    glanz = (np.clip(1 - ((xx - 700) / 420 + (yy - 290) / 300) * 0.8, 0, 1) ** 2 * 14)[..., None]
    tief = min(2400, seite.shape[0] - 800)
    n = FPS * 8
    for i in range(n):
        t = i / n * 8
        if t < 0.8: y = 0
        elif t < 3.8: y = sanft((t - 0.8) / 3.0) * tief
        elif t < 4.6: y = tief
        elif t < 7.6: y = (1 - sanft((t - 4.6) / 3.0)) * tief
        else: y = 0
        y0 = int(y)
        fenster = cv2.resize(seite[y0:y0 + 800], (sw, sh), interpolation=cv2.INTER_AREA) * 0.95
        w = cv2.warpPerspective(fenster, M, (W, H), flags=cv2.INTER_LINEAR)
        bild = basis * (1 - maske) + (w + glanz) * maske
        yield band(bild, 0.8)


# ---------- Ausschreibungs-Alarm: Glocke läutet ----------
def alarm():
    basis = laden('karte-alarm.png')
    H, W = basis.shape[:2]
    r, g, b = basis[..., 0], basis[..., 1], basis[..., 2]
    gold = ((r > 150) & (g > 95) & (r > b + 70)).astype(np.uint8)
    bereich = np.zeros_like(gold); bereich[300:445, 735:845] = 1   # Glocke auf dem Bildschirm, am Raster vermessen
    gold = gold * bereich
    n_, lab, st, _ = cv2.connectedComponentsWithStats(gold)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[k, :4]
    print('Glocke', x, y, w, h)
    kern = (lab == k).astype(np.uint8)
    hof = cv2.dilate(kern, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    weich = cv2.GaussianBlur(hof.astype(np.float32), (0, 0), 6)[..., None]
    grund = cv2.inpaint(np.clip(basis, 0, 255).astype(np.uint8), cv2.dilate(hof, np.ones((7, 7), np.uint8)) * 255, 9, cv2.INPAINT_TELEA).astype(np.float32)
    drehpunkt = (797.0, float(y + 3))   # Öse oben an der Glocke
    n = FPS * 4
    for i in range(n):
        t = i / FPS
        if t < 1.7:
            winkel = 13 * np.sin(2 * np.pi * t / 0.42) * np.exp(-t * 1.6) * np.clip(t / 0.1, 0, 1)
            glanz = 1 + 0.22 * np.exp(-t * 1.4)
        else:
            winkel, glanz = 0.0, 1.0
        R = cv2.getRotationMatrix2D(drehpunkt, float(winkel), 1.0)
        teil = cv2.warpAffine(basis * weich, R, (W, H), flags=cv2.INTER_LINEAR)
        ma = cv2.warpAffine(weich, R, (W, H), flags=cv2.INTER_LINEAR)[..., None]
        bild = grund * (1 - ma) + teil * glanz
        yield band(bild, 0.5)


# ---------- Digitales Produkt: Goldpaket dreht sich (Blender-Bildfolge) + Lichtschein ----------
PK = sys.argv[4] if len(sys.argv) > 4 else None


def produkt():
    dateien = sorted(f for f in os.listdir(PK) if f.startswith('pk_') and f.endswith('.png'))
    for f in dateien:
        b = np.asarray(Image.open(os.path.join(PK, f)).convert('RGB')).astype(np.float32)
        hell = np.clip((b.max(2, keepdims=True) - 238) / 17, 0, 1) * b   # nur Nähte und Glanzlichter, nicht die ganze Fläche
        schein = cv2.GaussianBlur(hell, (0, 0), 8) * 0.45 + cv2.GaussianBlur(hell, (0, 0), 26) * 0.4
        strahl = cv2.GaussianBlur(hell, (0, 0), sigmaX=60, sigmaY=2.5) * 0.3     # waagerechte Lichtstrahlen
        yield b + schein + strahl


# ---------- Dienstleistung: Zahnräder aus Blender ----------
def dienst():
    dateien = sorted(f for f in os.listdir(ZR) if f.startswith('zr_') and f.endswith('.png'))
    bilder = [np.asarray(Image.open(os.path.join(ZR, f)).convert('RGB')).astype(np.float32) for f in dateien]
    for _ in range(3):  # 3 × 2 s, damit der Browser seltener neu ansetzt
        for b in bilder:
            yield b


kodieren('website', website())
kodieren('alarm', alarm())
if ZR and os.path.isdir(ZR):
    kodieren('dienst', dienst())
if PK and os.path.isdir(PK):
    kodieren('produkt', produkt())
