#!/usr/bin/env python3
"""
Erzeugt eine kleinere 300x200-Zweitfassung der 7 Preset-Kartenbilder fuer srcset
(Nebenbefund "Karten-Bilder sind mit 600x400px aufbereitet, aber nur ~135-150px breit
angezeigt", s. pizza-rechner-KONTEXT.md "Moegliche naechste Schritte").

Quelle ist bewusst die BESTEHENDE 600x400-Datei unter assets/img/, NICHT ein Original in
assets/originals/ -- fuer die Preset-Karten existiert laut assets/prepare_web_images.py
kein Original mehr (vor v4.35.2 destruktiv in place verkleinert, s. dortiger Kommentar).
Eine weitere Verkleinerung der bereits komprimierten 600x400-Datei ist fuer eine reine
~150px-Anzeigegroesse unproblematisch (der Qualitaetsverlust einer zweiten WebP-Kompression
faellt bei dieser Zielgroesse nicht ins Gewicht), aber ehrlich zu benennen: dies ist KEINE
Neuerzeugung aus einer hochaufgeloesten Quelle.

Nicht-destruktiv: schreibt nur NEUE "-sm"-Dateien, die bestehenden 600x400-Dateien bleiben
unveraendert (weiterhin die Quelle fuer srcset 2x/1x auf breiteren Anzeigen bzw. hoher
devicePixelRatio, s. js/images.js).

Aufruf: python assets/generate_card_srcset.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
IMG_DIR = ROOT / "img"

# Alle 7 tatsaechlich unter assets/img/ liegenden Kartenbilder (9 preset.*-Registerkeys
# teilen sich card-napoli_biga.webp bzw. card-napoli_poolish.webp je zwischen ihrer
# klassischen/schnellen und ihrer kalten Variante, s. js/images.js).
FILES = [
    "card-napoli_klassisch.webp",
    "card-napoli_kalt.webp",
    "card-schnell.webp",
    "card-napoli_biga.webp",
    "card-napoli_poolish.webp",
    "card-teglia.webp",
    "card-newyork_style.webp",
]

TARGET_W, TARGET_H = 300, 200
QUALITY = 78  # analog zu den 600x448-Schrittbildern in prepare_web_images.py

def main():
    for name in FILES:
        src = IMG_DIR / name
        if not src.exists():
            print(f"UEBERSPRUNGEN (fehlt): {name}")
            continue
        dst = IMG_DIR / name.replace(".webp", "-sm.webp")
        with Image.open(src) as im:
            im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
            resized = im.resize((TARGET_W, TARGET_H), Image.LANCZOS)
            resized.save(dst, "WEBP", quality=QUALITY)
        before = src.stat().st_size
        after = dst.stat().st_size
        print(f"{name}: {before} B (600x400) -> {dst.name}: {after} B (300x200)")

if __name__ == "__main__":
    main()
