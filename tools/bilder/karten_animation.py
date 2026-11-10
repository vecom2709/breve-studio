"""Bewegte Kartenbilder der Startseite (nahtlose Schleifen, H.264-MP4 + Standbild).

  website  – die echte Startseite scrollt auf dem Laptop-Bildschirm
  alarm    – die Glocke auf dem Bildschirm läutet (Pendel um den Aufhängepunkt), Leuchten pulsiert
  produkt  – die Schachtel glüht im Atemrhythmus, Leiterbahnen pulsieren, sanfte Kamerafahrt
  dienst   – Zahnräder aus Blender (Bildfolge zr_0001.png …), jedes Rad dreht genau eine Zahnteilung

Aufruf: python3 tools/bilder/karten_animation.py <quellordner> <zielordner> [zahnrad-bildordner]
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
    ecken = np.float32([[684, 281], [1052, 282], [1033, 560], [664, 528]])
    H, W = basis.shape[:2]
    maske = np.zeros((H * 4, W * 4), np.uint8)
    cv2.fillPoly(maske, [np.int32(ecken * 4)], 255)
    maske = cv2.resize(maske, (W, H), interpolation=cv2.INTER_AREA)[..., None] / 255.0
    sw, sh = 1280, 800
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]), ecken)
    tief = min(2700, seite.shape[0] - 900)
    n = FPS * 8
    for i in range(n):
        t = i / n * 8
        if t < 0.8: y = 0
        elif t < 3.8: y = sanft((t - 0.8) / 3.0) * tief
        elif t < 4.6: y = tief
        elif t < 7.6: y = (1 - sanft((t - 4.6) / 3.0)) * tief
        else: y = 0
        y0 = int(y)
        fenster = cv2.resize(seite[y0:y0 + 900], (sw, sh), interpolation=cv2.INTER_AREA) * 0.94
        w = cv2.warpPerspective(fenster, M, (W, H), flags=cv2.INTER_LINEAR)
        bild = basis * (1 - maske) + (w * 0.9 + basis * 0.1) * maske   # leichter Rest der Spiegelung bleibt
        yield band(bild, 0.8)


# ---------- Ausschreibungs-Alarm: Glocke läutet ----------
def alarm():
    basis = laden('karte-alarm.png')
    H, W = basis.shape[:2]
    r, g, b = basis[..., 0], basis[..., 1], basis[..., 2]
    gold = ((r > 150) & (g > 95) & (r > b + 70)).astype(np.uint8)
    gold[:150] = 0; gold[600:] = 0; gold[:, :500] = 0; gold[:, 1100:] = 0
    n_, lab, st, _ = cv2.connectedComponentsWithStats(gold)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[k, :4]
    print('Glocke', x, y, w, h)
    kern = (lab == k).astype(np.uint8)
    hof = cv2.dilate(kern, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    weich = cv2.GaussianBlur(hof.astype(np.float32), (0, 0), 6)[..., None]
    grund = cv2.inpaint(np.clip(basis, 0, 255).astype(np.uint8), cv2.dilate(hof, np.ones((7, 7), np.uint8)) * 255, 9, cv2.INPAINT_TELEA).astype(np.float32)
    drehpunkt = (float(x + w / 2), float(y + h * 0.04))
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


# ---------- Digitales Produkt: Glühen, Leiterbahnen, Kamerafahrt ----------
def produkt():
    basis = laden('karte-produkt.png')
    H, W = basis.shape[:2]
    r, g, b = basis[..., 0] / 255, basis[..., 1] / 255, basis[..., 2] / 255
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    warm = np.clip((L - 0.42) / 0.4, 0, 1) * np.clip((r - b) * 3, 0, 1)
    warm = cv2.GaussianBlur(warm, (0, 0), 3)[..., None]
    cyan = (np.clip((b - r) * 4, 0, 1) * np.clip((L - 0.18) / 0.3, 0, 1))[..., None]
    X = np.arange(W, dtype=np.float32)[None, :, None] / W
    mitte = (688.0, 358.0)
    n = FPS * 4
    for i in range(n):
        p = i / n
        atem = 0.5 - 0.5 * np.cos(2 * np.pi * p)
        welle = 0.5 + 0.5 * np.sin(2 * np.pi * (X * 2.2 - p))
        bild = basis * (1 + 0.24 * atem * warm) + basis * cyan * 0.55 * welle
        s = 1 + 0.022 * atem
        A = cv2.getRotationMatrix2D(mitte, 0, s)
        bild = cv2.warpAffine(bild, A, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        yield band(bild, 0.5)


# ---------- Dienstleistung: Zahnräder aus Blender ----------
def dienst():
    dateien = sorted(f for f in os.listdir(ZR) if f.startswith('zr_') and f.endswith('.png'))
    bilder = [np.asarray(Image.open(os.path.join(ZR, f)).convert('RGB')).astype(np.float32) for f in dateien]
    for _ in range(3):  # 3 × 2 s, damit der Browser seltener neu ansetzt
        for b in bilder:
            yield b


kodieren('website', website())
kodieren('alarm', alarm())
kodieren('produkt', produkt())
if ZR and os.path.isdir(ZR):
    kodieren('dienst', dienst())
