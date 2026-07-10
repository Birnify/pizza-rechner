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
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "pizza-rechner-mobile.html"
OUT = ROOT / "pizza-rechner-mobile-standalone.html"

html = SRC.read_text(encoding="utf-8")

def inline_css(match):
    href = match.group(1).split("?")[0]
    css = (ROOT / href).read_text(encoding="utf-8")
    return f"<style>\n{css}\n</style>"

def inline_js(match):
    src = match.group(1).split("?")[0]
    js = (ROOT / src).read_text(encoding="utf-8")
    return f"<script>\n{js}\n</script>"

html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)

OUT.write_text(html, encoding="utf-8")
print(f"Geschrieben: {OUT} ({len(html):,} Zeichen)")
