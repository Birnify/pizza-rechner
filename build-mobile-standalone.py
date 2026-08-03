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
# gesetzt (s. inline_js() unten).
#
# BUGFIX (v4.32.1, am iPhone reproduziert): die urspruengliche Entscheidung "nur eine kleine,
# von Hand ausgewaehlte Menge Bilder einbetten" hatte zur Folge, dass die 9 neuen
# Preset-Kartenbilder NICHT in der Auswahl standen -- auf dem iPhone (Standalone-Datei ohne
# Geschwister-Ordner) blieb das gesamte Kartengitter bildlos, ausgerechnet dort, wo der
# Nutzer die App tatsächlich benutzt. Neue Regel (s. BILD-EINBAU-KONZEPT.md Abschnitt 4):
# der Standalone-Build bettet ALLE Bilder ein, die im Register (js/images.js, PZ.IMG) nicht
# als pending markiert sind -- keine von Hand gepflegte zweite Liste mehr, die Auswahl ergibt
# sich automatisch aus dem, was ohnehin schon verdrahtet ist. Bleibt automatisch klein, weil
# pro Zyklus nur die Bilder verdrahtet werden, die die jeweilige Kategorie braucht, und
# assets/prepare_web_images.py sie vorher auf Anzeigegroesse verkleinert (s. Warnschwelle
# rund 3 MB in BILD-EINBAU-KONZEPT.md, falls kuenftige Kategorien -- Schrittbilder,
# Glossar -- die Datei deutlich waechst).
#
# BUGFIX (v4.32.0, mobile-optimizer-Review, BLOCKER): eine fruehere Fassung haengte die
# _IMG_INLINE-Zuweisung als EIGENEN <script>-Block ans Ende von <body> an. js/images.js ruft
# an seinem eigenen Modulende aber SYNCHRON hydrateImages(document) auf (fuer das statische
# Preset-Kartengitter) -- das lief im Standalone-Build also VOR der _IMG_INLINE-Zuweisung,
# PZ._IMG_INLINE war zu diesem Zeitpunkt undefined. Folge: js/images.js behandelte ausnahmslos
# ALLE Bilder (auch die eigentlich eingebetteten) als "normalen assets/img/-Pfad" statt
# als Data-URI -- auf dem iPhone (kein Geschwister-Ordner neben der Einzeldatei) ueberall
# kaputte Bilder, inklusive der absichtlich eingebetteten Fotos. Von Unit-Tests nicht
# erkennbar, weil der Fehler nur im gebauten Artefakt auftritt, nicht im Quellcode. Fix: die
# Zuweisung steht jetzt als allererste Anweisung IM SELBEN <script>-Block wie js/images.js
# selbst (s. inline_js() unten), garantiert also Ausfuehrung vor jedem Code aus der Datei.
MIME_BY_EXT = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "png": "image/png"}

def inline_image_files():
    """Liest js/images.js und liefert die Dateinamen aller nicht-pending, nicht-noStandalone
    Registereintraege (PZ.IMG). Ein zweiter, von Hand gepflegter Ort fuer diese Liste ist
    bewusst vermieden -- genau diese Doppelpflege war der Grund, warum die 9
    Preset-Kartenbilder in v4.32.0 in der Standalone-Datei fehlten.

    Scannt NUR das literale "const IMG = {...}"-Objekt -- Eintraege, die (wie die 33
    Glossar-Artikelbilder seit v4.37.0) per forEach() NACH dem Schliessen dieses Literals
    programmatisch ergaenzt werden, sind fuer diese Funktion dadurch strukturell unsichtbar
    und werden nie eingebettet. Das ist hier beabsichtigt (alle 33 Dateien tragen
    noStandalone:true, s. js/images.js: roh > 3 MB, base64 > 4 MB, haette die
    ~3-MB-Warnschwelle aus BILD-EINBAU-KONZEPT.md weit gerissen) -- die zusaetzliche
    noStandalone-Pruefung unten ist ein Sicherheitsnetz, falls ein kuenftiger Zyklus
    einzelne dieser Eintraege doch ins Literal verschiebt, ohne das Flag zu entfernen."""
    js = (ROOT / "js" / "images.js").read_text(encoding="utf-8")
    block = re.search(r"const IMG = \{(.*?)\n  \};", js, re.S)
    if not block:
        raise RuntimeError("js/images.js: IMG-Registerblock nicht gefunden")
    entries = re.findall(r"\{[^{}]*\}", block.group(1))
    files = []
    for entry in entries:
        if re.search(r"pending\s*:\s*true", entry):
            continue
        if re.search(r"noStandalone\s*:\s*true", entry):
            continue
        m = re.search(r"file\s*:\s*'([^']+)'", entry)
        if m and m.group(1) not in files:
            files.append(m.group(1))
    return files

def build_img_inline_snippet():
    entries = []
    total_bytes = 0
    files = inline_image_files()
    for name in files:
        path = ROOT / "assets" / "img" / name
        ext = path.suffix.lstrip(".").lower()
        raw = path.read_bytes()
        total_bytes += len(raw)
        b64 = base64.b64encode(raw).decode("ascii")
        entries.append("%r: 'data:%s;base64,%s'" % (name, MIME_BY_EXT.get(ext, "image/jpeg"), b64))
    print(f"Eingebettete Bilder: {len(files)} ({total_bytes / 1024:.0f} KB roh, s. BILD-EINBAU-KONZEPT.md "
          f"Abschnitt 4 fuer die rund-3-MB-Warnschwelle der Gesamtdatei)")
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
