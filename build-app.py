#!/usr/bin/env python3
"""
Baut den www/-Ordner fuer Capacitor aus dem bestehenden Quellcode:
pizza-rechner-mobile.html wird zu www/index.html, dazu css/, js/, fonts/ und
assets/img/ (nicht ganz assets/, das enthaelt auch die Bild-Erzeugungs-Skripte
und Arbeitsstaende, die nicht ins App-Paket sollen).

Grund fuer ein eigenes www/-Verzeichnis statt Capacitor direkt auf den Projektordner
zeigen zu lassen: der Projektordner enthaelt Versionen/, assets/ (Erzeugungs-Skripte),
_review/ etc., die nicht mit ins App-Paket sollen (s. PLAYSTORE-BACKLOG.md, Punkt B1).

Aufruf: python build-app.py
Nach jeder Aenderung an pizza-rechner-mobile.html/css/js/fonts/assets/img erneut
laufen lassen, danach "npx cap sync" fuer die native Android-Kopie.

Der Projektordner liegt in OneDrive: ein kompletter "shutil.rmtree(www/)" vor dem
Neubau schlug wiederholt mit PermissionError fehl, weil OneDrive kurzzeitig einen
Sync-Lock auf den Ordner haelt. Deshalb wird www/ NICHT gelöscht, sondern per
copytree(..., dirs_exist_ok=True) ueberschrieben -- das kommt mit bereits
vorhandenen Zieldateien klar. Dateien, die in der Quelle entfernt wurden, bleiben
dadurch als Leichen in www/ liegen; das ist unschaedlich (www/ ist nur ein Build-
Artefakt, kein Ort fuer Handarbeit), aber bei einem groesseren Aufraeumen ggf.
"rd /s /q www" manuell im Explorer/einer normalen Konsole nachholen.
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
WWW = ROOT / "www"
SRC_HTML = ROOT / "pizza-rechner-mobile.html"

WWW.mkdir(exist_ok=True)

html = SRC_HTML.read_text(encoding="utf-8")
(WWW / "index.html").write_text(html, encoding="utf-8")

for folder in ("css", "js", "fonts"):
    shutil.copytree(ROOT / folder, WWW / folder, dirs_exist_ok=True)

(WWW / "assets").mkdir(exist_ok=True)
shutil.copytree(ROOT / "assets" / "img", WWW / "assets" / "img", dirs_exist_ok=True)
shutil.copy(ROOT / "assets" / "logo.svg", WWW / "assets" / "logo.svg")

print(f"www/ gebaut aus {SRC_HTML.name}: css/, js/, fonts/, assets/img/, assets/logo.svg kopiert.")
