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
from PIL import Image, ImageFilter

ROOT = Path(__file__).parent
IMG_DIR = ROOT / "img"

# Zyklus 1 (Bild-Grundgerüst + Preset-Kartengitter, v4.32.0): Preset-Karten (3:2) und das
# Foto der fertigen Pizza (16:9). Breite jeweils rund 2x der groessten tatsaechlichen
# Anzeigebreite (Retina-tauglich), Hoehe im exakten Zielverhaeltnis der Kategorie (s.
# design-import/components/media/Media.jsx RATIOS).
#
# Optionales 5. Tupel-Element "blur" (Gaussian-Blur-Radius in px, auf der Zielgroesse
# angewendet, NACH dem Resize) und optionales 6. Element "alpha" (0..1, deckende Alpha-
# Ebene NACH dem Blur, RGBA-Ausgabe): fuer Zyklus "Geblurrte Textur als Seitenhintergrund"
# (css/styles.css --bg-gradient) ergaenzt. Radius 120 auf 800x800 wurde per Sichtvergleich
# (Radius 20/35/50/80/120/160) gewaehlt -- ab ~120 ist keine Teig-/Krustenstruktur (Blasen,
# Leopardierung) mehr erkennbar, nur noch eine warme, leicht ungleichmaessige Farbflaeche
# ("Farbstimmung" statt scharfes Foto, wie vom Nutzer gefordert). Radius 160 wirkte im
# Vergleich bereits wie eine reine Verlaufsflaeche ohne jede organische Variation.
# Alpha 0.35 kam ERST beim Live-Test dazu (Nebenbefund, nicht vorab geplant): body{
# background:var(--bg-gradient)} skaliert die Foto-Ebene per background-size:cover auf die
# GESAMTE (oft mehrere Bildschirmhoehen lange) Seite, nicht nur den Viewport -- an manchen
# Scrollpositionen landete dadurch ein stark gezoomter, ueberraschend kraeftig wirkender
# Bildausschnitt im Hintergrund (Corner-Crop-Test zeigte das). Eine teiltransparente Ebene
# (ueber var(--bg) gemischt) haelt jeden moeglichen Bildausschnitt gedeckt "dezent",
# unabhaengig von Scrollposition/Bildschirmhoehe -- robuster als eine Groessenbeschraenkung
# per vh-Einheiten (die haette am unteren Rand einen harten Schnitt zu --bg erzeugt).
#
# Optionales 7. Tupel-Element "highlight" = (thr_mode, comp): nichtlineare Lichter-
# Kompression NACH dem Blur, VOR der Alpha-Ebene (v4.34.1, Kontrastspielraum-Nachbesserung
# Seitenhintergrund-Textur). thr_mode -2 = je RGB-Kanal am eigenen Bildmittelwert ansetzen,
# nur ueberdurchschnittlich helle Pixel werden Richtung Mittelwert gestaucht (Faktor comp),
# unterdurchschnittliche bleiben unangetastet. Anders als ein simples Toning Richtung --bg
# oder eine globale Kontrastspreizung (beides mathematisch aequivalent zu einem einfach
# niedrigeren Alpha-Wert, s. Kontextdatei v4.34.1) veraendert diese Kompression NUR die
# Lichter, die den Worst-Case-Kontrast ausloesen, und erlaubt dadurch einen tatsaechlich
# hoeheren Alpha-Wert bei gleicher WCAG-Marge. Bei Texturen mit sehr hellem Durchschnittston
# gegen ein sehr dunkles --bg (Dark-Theme) bleibt der Gewinn trotzdem MODERAT, kein
# Wunder-Fix (s. Kontextdatei fuer die ehrliche Einordnung).
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
    # 1:1 Seitenhintergrund-Texturen (stark weichgezeichnet, s. Kommentar oben) --
    # 800x800 deckt auch breite Desktop-Viewports ohne sichtbares Nachschaerfen ab, obwohl
    # background-size:cover das Bild hochskaliert (der starke Blur macht Upscaling-
    # Artefakte ohnehin unsichtbar). Alpha-Werte s. Kommentar "Kontrast-Worst-Case" in
    # css/styles.css -- per Pixel-Worst-Case-Skript (WCAG-2.0-Luminanzformel) ermittelt.
    # v4.34.1: texture-teighaut.webp (zu kontrastarm bei brauchbarer Deckkraft) durch
    # texture-marmor.webp ersetzt (Hell); texture-kruste.webp bleibt (Dunkel), bekommt aber
    # eine Lichter-Kompression VOR der Alpha-Ebene (s. Kommentar "highlight" oben).
    "texture-marmor.webp": (800, 800, "WEBP", 80, 120, 0.190),
    "texture-kruste.webp": (800, 800, "WEBP", 80, 120, 0.150, (-2, 0.05)),
}


def apply_highlight_compression(im, highlight):
    """Nichtlineare Lichter-Kompression (s. Kommentar bei TARGETS oben): stauche NUR Pixel
    oberhalb eines Schwellwerts Richtung Schwellwert, der Rest bleibt unangetastet. thr_mode
    -2 setzt den Schwellwert je RGB-Kanal auf den eigenen Bildmittelwert (identische
    Methodik wie im Kontrast-Verifikationsskript dieses Zyklus, s. Kontextdatei v4.34.1)."""
    from PIL import ImageStat

    thr_mode, comp = highlight
    if thr_mode == -2:
        stat = ImageStat.Stat(im.convert("RGB"))
        thr_r, thr_g, thr_b = stat.mean[0], stat.mean[1], stat.mean[2]
    else:
        thr_r = thr_g = thr_b = thr_mode
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y][:3]
            nr = thr_r + (r - thr_r) * comp if r > thr_r else r
            ng = thr_g + (g - thr_g) * comp if g > thr_g else g
            nb = thr_b + (b - thr_b) * comp if b > thr_b else b
            px[x, y] = (round(nr), round(ng), round(nb))
    return im


def main():
    # Optionale Dateinamen-Filter ueber sys.argv (z. B. beim Iterieren einzelner Alpha-/
    # Blur-Werte fuer EIN Bild): ohne Argumente verarbeitet main() wie bisher ALLE
    # TARGETS -- das re-encodiert dabei zwangslaeufig auch bereits fertige Dateien anderer
    # Zyklen erneut verlustig (s. Warnung im Docstring oben). Mit `python
    # prepare_web_images.py texture-teighaut.webp` wird NUR diese eine Datei angefasst.
    import sys
    only = set(sys.argv[1:]) or None
    total_before = 0
    total_after = 0
    for name, cfg in TARGETS.items():
        if only and name not in only:
            continue
        w, h, fmt, quality = cfg[:4]
        blur = cfg[4] if len(cfg) > 4 else None
        alpha = cfg[5] if len(cfg) > 5 else None
        highlight = cfg[6] if len(cfg) > 6 else None
        path = IMG_DIR / name
        if not path.exists():
            print(f"UEBERSPRUNGEN (fehlt): {name}")
            continue
        before = path.stat().st_size
        with Image.open(path) as im:
            im = im.convert("RGB") if fmt == "JPEG" else im.convert("RGBA") if im.mode in ("P", "LA") else im
            resized = im.resize((w, h), Image.LANCZOS)
            if blur:
                resized = resized.filter(ImageFilter.GaussianBlur(radius=blur))
            if highlight is not None:
                resized = apply_highlight_compression(resized, highlight)
            if alpha is not None:
                resized = resized.convert("RGBA")
                resized.putalpha(int(round(alpha * 255)))
            save_kwargs = {"quality": quality}
            if fmt == "JPEG":
                save_kwargs["optimize"] = True
            resized.save(path, fmt, **save_kwargs)
        after = path.stat().st_size
        total_before += before
        total_after += after
        extra_note = (
            (f", blur {blur}px" if blur else "")
            + (f", highlight {highlight}" if highlight is not None else "")
            + (f", alpha {alpha}" if alpha is not None else "")
        )
        print(f"{name}: {before/1024:.0f} KB -> {after/1024:.0f} KB ({w}x{h}{extra_note})")
    print(f"\nGesamt: {total_before/1024:.0f} KB -> {total_after/1024:.0f} KB")


if __name__ == "__main__":
    main()
