#!/usr/bin/env python3
"""
Erzeugt aus den 33 Glossar-Artikelbildern (assets/img/glossar-<id>.webp, 1200x800) eine
kleinere Zweitfassung (600x400) NUR fuers Standalone-Embedding
(pizza-rechner-mobile-standalone.html, s. build-mobile-standalone.py) unter
assets/img_standalone/. Die Web-Version in assets/img/ bleibt UNVERAENDERT -- dieses
Skript LIEST von dort, schreibt aber nie dorthin zurueck.

Hintergrund (v4.38.1, "Glossar-Artikelbilder im Standalone-Build"): die App-Regel
(BILD-EINBAU-KONZEPT.md Abschnitt 4) verlangt, dass der Standalone-Build ALLE registrierten,
nicht-pending Bilder einbettet -- keine handverlesene Teilmenge. Die volle
1200x800-Aufloesung aller 33 Dateien haette den Standalone-Build aber auf geschaetzt 7-10 MB
aufgeblaeht (v4.37.0 wich deshalb mit noStandalone:true bewusst von der Regel ab, s.
pizza-rechner-KONTEXT.md). 600x400 ist Retina-tauglich fuer die live am Mobil-Layout
gemessene tatsaechliche Anzeigebreite (307 CSS-Pixel bei devicePixelRatio 2).

Kein Original in assets/originals/ vorhanden (die 33 Dateien wurden schon bei ihrer
Erzeugung in v4.37.0 ohne separates Original registriert, s.
pizza-rechner-KONTEXT-HISTORIE.md) -- deshalb liest dieses Skript direkt von assets/img/
statt von assets/originals/ wie assets/prepare_web_images.py. Erneutes Ausfuehren ist
verlustarm (liest immer von der unveraenderten 1200x800-Fassung), aber nicht perfekt
verlustfrei wie der originals/-Workflow, da die Quelle selbst schon eine komprimierte
WEBP-Datei ist -- fuer eine reine Herunterskalierung um Faktor 2 unproblematisch.

Die Artikel-Id-Liste wird NICHT hier zusaetzlich gepflegt, sondern aus
js/images.js (GLOSSARY_ARTICLE_IDS_WITH_FILE) ausgelesen -- einzige Quelle bleibt die
JS-Datei, analog zur Doppelpflege-Vermeidung aus BILD-EINBAU-KONZEPT.md Abschnitt 4.

Aufruf: python assets/prepare_standalone_glossary_images.py
"""
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
IMG_DIR = ROOT / "img"
OUT_DIR = ROOT / "img_standalone"
IMAGES_JS = ROOT.parent / "js" / "images.js"

TARGET_W, TARGET_H, QUALITY = 600, 400, 78


def glossary_ids():
    js = IMAGES_JS.read_text(encoding="utf-8")
    m = re.search(r"const GLOSSARY_ARTICLE_IDS_WITH_FILE = \[(.*?)\];", js, re.S)
    if not m:
        raise RuntimeError("js/images.js: GLOSSARY_ARTICLE_IDS_WITH_FILE nicht gefunden")
    return re.findall(r"'([^']+)'", m.group(1))


def main():
    OUT_DIR.mkdir(exist_ok=True)
    ids = glossary_ids()
    total_before = total_after = 0
    missing = []
    for article_id in ids:
        name = "glossar-" + article_id + ".webp"
        src = IMG_DIR / name
        if not src.exists():
            missing.append(name)
            continue
        with Image.open(src) as im:
            im = im.convert("RGB")
            resized = im.resize((TARGET_W, TARGET_H), Image.LANCZOS)
            dst = OUT_DIR / name
            resized.save(dst, "WEBP", quality=QUALITY)
        before = src.stat().st_size
        after = dst.stat().st_size
        total_before += before
        total_after += after
        print(f"{name}: {before/1024:.0f} KB -> {after/1024:.0f} KB ({TARGET_W}x{TARGET_H})")

    if missing:
        print("\nFEHLEND (in js/images.js gelistet, aber keine Datei in assets/img/):")
        for name in missing:
            print(f"  - {name}")

    print(f"\nGesamt ({len(ids) - len(missing)} von {len(ids)} Dateien): "
          f"{total_before/1024:.0f} KB -> {total_after/1024:.0f} KB")


if __name__ == "__main__":
    main()
