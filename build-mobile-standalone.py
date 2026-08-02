#!/usr/bin/env python3
"""
Baut pizza-rechner-mobile-standalone.html aus pizza-rechner-mobile.html:
alle <link rel="stylesheet" href="css/...">- und <script src="js/...">-Verweise
werden durch den tatsaechlichen Dateiinhalt (inline <style>/<script>) ersetzt.

Grund: iOS blockiert bei aus iCloud Drive geoeffneten HTML-Dateien das Nachladen
von Geschwister-Dateien (css/js) ueber file:// - egal ob Safari oder Edge (beide
WebKit-basiert). Eine einzige Datei ohne externe Verweise umgeht das komplett.

Aufruf: python build-mobile-standalone.py
Quelle bleibt pizza-rechner-mobile.html (die wird weiter normal bearbeitet) -
dieses Skript nach jeder Aenderung daran einmal laufen lassen, dann die neu
erzeugte *-standalone.html aufs iPhone kopieren.
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "pizza-rechner-mobile.html"
OUT = ROOT / "pizza-rechner-mobile-standalone.html"

html = SRC.read_text(encoding="utf-8")

# Bilder im Standalone-Build (v3.69.0, seit v4.32.0 ueber das Bild-Register js/images.js,
# s. BILD-EINBAU-KONZEPT.md Abschnitt 4 "Getroffene Entscheidungen"): die App referenziert
# Bilder seit v4.32.0 NIRGENDS mehr als literalen String-Pfad im JS-Quelltext (der Pfad wird
# zur Laufzeit aus PZ.IMG[key].file + einem festen "assets/img/"-Praefix zusammengesetzt,
# s. js/images.js) -- ein reiner Text-Ersetzen wie frueher (html_text.replace(pfad, data-uri))
# findet deshalb nichts mehr. Stattdessen wird eine kleine window.PZ._IMG_INLINE = { dateiname:
# data-uri }-Zuweisung ALS ERSTE ANWEISUNG in denselben <script>-Block wie js/images.js selbst
# gesetzt (s. inline_js() unten) -- fuer eine bewusst KLEINE Auswahl (Nutzer-Entscheidung: die
# Einzeldatei bleibt klein, nicht alle ~18 MB Bildbestand werden eingebettet). js/images.js
# prueft diese Map zur Laufzeit: ein Dateiname, der dort NICHT drin steht, wird wie ein
# fehlendes Bild behandelt (PZ.img() liefert null) -- kein kaputtes <img>, einfach kein Bild.
# Aktuelle Auswahl: die 3 Fotos der fertigen Pizza (Anleitungsende) -- identisch zur
# bisherigen Auswahl vor v4.32.0. Die 9 Preset-Karten-Bilder sind bewusst NICHT dabei, die
# Karten erscheinen im Standalone-Build also textuell ohne Bild (laut Bild-Register ein
# gueltiger, vorgesehener Zustand -- "Karte ohne Bild" ist kein Fehlerfall).
#
# BUGFIX (v4.32.0, mobile-optimizer-Review, BLOCKER): eine fruehere Fassung haengte die
# _IMG_INLINE-Zuweisung als EIGENEN <script>-Block ans Ende von <body> an. js/images.js ruft
# an seinem eigenen Modulende aber SYNCHRON hydrateImages(document) auf (fuer das statische
# Preset-Kartengitter) -- das lief im Standalone-Build also VOR der _IMG_INLINE-Zuweisung,
# PZ._IMG_INLINE war zu diesem Zeitpunkt undefined. Folge: js/images.js behandelte ausnahmslos
# ALLE Bilder (auch die drei eigentlich eingebetteten) als "normalen assets/img/-Pfad" statt
# als Data-URI -- auf dem iPhone (kein Geschwister-Ordner neben der Einzeldatei) ueberall
# kaputte Bilder, inklusive der drei absichtlich eingebetteten Fotos. Von Unit-Tests nicht
# erkennbar, weil der Fehler nur im gebauten Artefakt auftritt, nicht im Quellcode. Fix: die
# Zuweisung steht jetzt als allererste Anweisung IM SELBEN <script>-Block wie js/images.js
# selbst (s. inline_js() unten), garantiert also Ausfuehrung vor jedem Code aus der Datei.
INLINE_IMAGE_FILES = [
    "pizza-final-neapolitanisch.jpg",
    "pizza-final-teglia.jpg",
    "pizza-final-newyork.jpg",
]
MIME_BY_EXT = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "png": "image/png"}

def build_img_inline_snippet():
    entries = []
    for name in INLINE_IMAGE_FILES:
        path = ROOT / "assets" / "img" / name
        ext = path.suffix.lstrip(".").lower()
        b64 = base64.b64encode(path.read_bytes()).decode("ascii")
        entries.append("%r: 'data:%s;base64,%s'" % (name, MIME_BY_EXT.get(ext, "image/jpeg"), b64))
    return "window.PZ = window.PZ || {}; window.PZ._IMG_INLINE = {" + ",".join(entries) + "};\n"

IMG_INLINE_SNIPPET = build_img_inline_snippet()

def inline_css(match):
    href = match.group(1).split("?")[0]
    css = (ROOT / href).read_text(encoding="utf-8")
    # Die CSS-Datei liegt im css/-Unterordner; relative url(...)-Pfade darin sind
    # relativ zu CSS-DATEI-Verzeichnis gemeint (z.B. url('../assets/foto.jpg') zeigt
    # von css/ aus eine Ebene hoch auf den Projekt-Root). Nach dem Inlinen sitzt
    # derselbe Pfad aber direkt in dieser Root-Level-HTML-Datei -- url()-Werte in
    # <style>-Blöcken lösen relativ zur HTML-Datei selbst auf, nicht zur
    # Ursprungsdatei. Ein führendes "../" muss deshalb beim Inlinen entfernt werden,
    # sonst zeigt der Pfad eine Ebene zu hoch (Bug beim ersten Header-Foto-Einbau in
    # v3.44.0 entdeckt: das Bild blieb in der Standalone-Datei unsichtbar).
    css = re.sub(r"url\((['\"]?)\.\./", r"url(\1", css)
    return f"<style>\n{css}\n</style>"

def inline_js(match):
    src = match.group(1).split("?")[0]
    js = (ROOT / src).read_text(encoding="utf-8")
    if src == "js/images.js":
        # PZ._IMG_INLINE MUSS bereits gesetzt sein, BEVOR js/images.js seinen eigenen
        # Modul-Code ausfuehrt (hydrateImages(document) am Modulende) -- deshalb hier als
        # allererste Anweisung im SELBEN <script>-Block vorangestellt, s. Kommentar oben.
        js = IMG_INLINE_SNIPPET + js
    return f"<script>\n{js}\n</script>"

html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)

OUT.write_text(html, encoding="utf-8")
print(f"Geschrieben: {OUT} ({len(html):,} Zeichen)")
