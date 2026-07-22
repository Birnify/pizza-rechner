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

# Fotos der fertigen Pizza (v3.69.0, "Foto der fertigen Pizza am Ende der Anleitung"):
# js/guide.js referenziert sie als normale relative Pfade ("assets/pizza-final-*.jpg"),
# die als String-Literale im weiter unten inline eingebetteten JS landen. Anders als
# CSS/JS werden Bilder hier NICHT generisch inlined -- bewusst nur diese drei bekannten
# Dateien (Scope der Feature-Definition), nicht das bestehende Header-Foto
# (assets/header-pizza.jpg, CSS-Hintergrund, dort bislang ungeklärt/unverändert gelassen).
# Ersetzung als reiner String-Austausch NACH dem JS-Inlining unten (s. Aufruf von
# inline_images()): base64 enthält keine Anführungszeichen/Backslashes, bleibt also
# innerhalb des umgebenden JS-String-Literals unproblematisch.
def inline_images(html_text):
    for img_path in sorted((ROOT / "assets").glob("pizza-final-*.jpg")):
        rel = "assets/" + img_path.name
        b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        html_text = html_text.replace(rel, "data:image/jpeg;base64," + b64)
    return html_text

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
    return f"<script>\n{js}\n</script>"

html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)
html = inline_images(html)

OUT.write_text(html, encoding="utf-8")
print(f"Geschrieben: {OUT} ({len(html):,} Zeichen)")
