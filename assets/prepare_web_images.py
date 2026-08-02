#!/usr/bin/env python3
"""
Bereitet abgenommene Bilder aus assets/img/ auf Anzeigegroesse auf (Schicht 4 aus
BILD-EINBAU-KONZEPT.md): die Quelldateien liegen auf Erzeugungs-Aufloesung (z. B. 1496x1000
fuer Karten, 1920x1080 fuer das Foto der fertigen Pizza), angezeigt werden sie deutlich
kleiner (Karten ca. 150-300 px Breite). Skaliert + re-encodiert IN PLACE (ein Bild = eine
Datei unter assets/img/, keine zweite "Web"-Kopie, keine doppelten 18 MB im Repo -- s.
BILD-EINBAU-KONZEPT.md Abschnitt "Schicht 1").

Verarbeitet bewusst NUR die Dateien, die der jeweilige Bild-Einbau-Zyklus tatsaechlich
verdrahtet hat (s. TARGETS unten) -- nicht alle 118 abgenommenen Bilder auf einmal, weil
Zielgroessen fuer noch nicht angebundene Kategorien (Glossar, Anleitungsschritte, Header, ...)
erst in ihrem jeweils eigenen Zyklus feststehen. Ein spaeterer Zyklus ergaenzt seine eigenen
Dateien in TARGETS und ruft das Skript erneut auf.

Aufruf: python assets/prepare_web_images.py
Vorher/Nachher-Groessen werden auf der Konsole ausgegeben. Nicht mehrfach hintereinander auf
dieselbe Datei anwenden (jeder Lauf skaliert ausgehend vom AKTUELLEN Dateiinhalt, wiederholtes
Verkleinern wuerde weiter verlustig re-encodieren) -- bei Bedarf aus assets/BILD-PROMPTS.md /
dem Erzeugungs-Workflow neu abnehmen, statt aus einer bereits verkleinerten Fassung erneut zu
skalieren.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
IMG_DIR = ROOT / "img"

# Zyklus 1 (Bild-Grundgerüst + Preset-Kartengitter, v4.32.0): Preset-Karten (3:2) und das
# Foto der fertigen Pizza (16:9). Breite jeweils rund 2x der groessten tatsaechlichen
# Anzeigebreite (Retina-tauglich), Hoehe im exakten Zielverhaeltnis der Kategorie (s.
# design-import/components/media/Media.jsx RATIOS).
TARGETS = {
    # 3:2 Karten (Rezept-Auswahl) -- angezeigt mit ca. 150-300 px Breite
    "card-napoli_klassisch.webp": (600, 400, "WEBP", 80),
    "card-napoli_kalt.webp": (600, 400, "WEBP", 80),
    "card-schnell.webp": (600, 400, "WEBP", 80),
    "card-teglia.webp": (600, 400, "WEBP", 80),
    "card-newyork_style.webp": (600, 400, "WEBP", 80),
    "card-napoli_biga.webp": (600, 400, "WEBP", 80),
    "card-napoli_poolish.webp": (600, 400, "WEBP", 80),
    # 16:9 Foto der fertigen Pizza (Anleitungsende) -- css/styles.css begrenzt die Anzeige
    # auf max-width:440px
    "pizza-final-neapolitanisch.jpg": (960, 540, "JPEG", 80),
    "pizza-final-teglia.jpg": (960, 540, "JPEG", 80),
    "pizza-final-newyork.jpg": (960, 540, "JPEG", 80),
}


def main():
    total_before = 0
    total_after = 0
    for name, (w, h, fmt, quality) in TARGETS.items():
        path = IMG_DIR / name
        if not path.exists():
            print(f"UEBERSPRUNGEN (fehlt): {name}")
            continue
        before = path.stat().st_size
        with Image.open(path) as im:
            im = im.convert("RGB") if fmt == "JPEG" else im.convert("RGBA") if im.mode in ("P", "LA") else im
            resized = im.resize((w, h), Image.LANCZOS)
            save_kwargs = {"quality": quality}
            if fmt == "JPEG":
                save_kwargs["optimize"] = True
            resized.save(path, fmt, **save_kwargs)
        after = path.stat().st_size
        total_before += before
        total_after += after
        print(f"{name}: {before/1024:.0f} KB -> {after/1024:.0f} KB ({w}x{h})")
    print(f"\nGesamt: {total_before/1024:.0f} KB -> {total_after/1024:.0f} KB")


if __name__ == "__main__":
    main()
