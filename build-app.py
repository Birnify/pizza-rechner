#!/usr/bin/env python3
"""
Baut den www/-Ordner fuer Capacitor aus dem bestehenden Quellcode:
pizza-rechner-mobile.html wird zu www/index.html, dazu css/, js/, fonts/ und
assets/img/ (nicht ganz assets/, das enthaelt auch die Bild-Erzeugungs-Skripte
und Arbeitsstaende, die nicht ins App-Paket sollen).

Grund fuer ein eigenes www/-Verzeichnis statt Capacitor direkt auf den Projektordner
zeigen zu lassen: der Projektordner enthaelt Versionen/, assets/ (Erzeugungs-Skripte),
_review/ etc., die nicht mit ins App-Paket sollen (s. PLAYSTORE-BACKLOG.md, Punkt B1).

ABLAUF NACH DIESEM SKRIPT (kurz, ausfuehrlich in pizza-rechner-KONTEXT.md, Abschnitt
"Android-App bauen"):
    1. python build-app.py            (dieses Skript -- baut www/)
    2. npx cap sync android           (kopiert www/ in das native Android-Projekt)
    3. JAVA_HOME auf ein JDK 21 setzen (Capacitor/Gradle brauchen 21, nicht 17)
    4. cd android && .\\gradlew assembleDebug   (baut die eigentliche APK)
    5. adb install -r <apk-pfad>      (auf Emulator/Geraet installieren)

WANN NEU LAUFEN LASSEN: nach jeder Aenderung an pizza-rechner-mobile.html, css/, js/,
fonts/, assets/img/ oder assets/logo.svg erneut aufrufen, danach Schritt 2 (cap sync)
wiederholen -- sonst baut Android weiter aus einem veralteten www/-Stand.

VERSIONSNUMMER: dieses Skript ruft als allerersten Schritt automatisch
sync-version.py auf (s. dort), das die Versionsnummer aus package.json in die
sichtbare App-Versionsanzeige und android/app/build.gradle (versionName/versionCode)
schreibt. Wer nur die Versionsnummer aktualisieren will, ohne www/ neu zu bauen, kann
"python sync-version.py" auch direkt einzeln aufrufen.

FEHLERBEHANDLUNG: dieses Skript bricht bei fehlenden Quelldateien/-ordnern mit einer
klaren, auf Deutsch verstaendlichen Meldung ab (statt eines rohen Python-Tracebacks),
damit auch eine Session mit kleinerem Modell ohne Rueckfragen versteht, was zu tun ist.
Unerwartete Fehler (z.B. Berechtigungsprobleme beim Schreiben) werden NICHT
verschluckt -- die laufen bewusst als normale Python-Exception durch, damit nichts
still fehlschlaegt.

EIGENHEIT DIESES PROJEKTORDNERS (liegt in OneDrive): ein kompletter
"shutil.rmtree(www/)" vor dem Neubau schlug wiederholt mit PermissionError fehl, weil
OneDrive kurzzeitig einen Sync-Lock auf den Ordner haelt. Deshalb wird www/ NICHT
geloescht, sondern per copytree(..., dirs_exist_ok=True) ueberschrieben -- das kommt
mit bereits vorhandenen Zieldateien klar. Dateien, die in der Quelle entfernt wurden,
bleiben dadurch als Leichen in www/ liegen; das ist unschaedlich (www/ ist nur ein
Build-Artefakt, kein Ort fuer Handarbeit), aber bei einem groesseren Aufraeumen ggf.
"rd /s /q www" manuell im Explorer/einer normalen Konsole nachholen.

Aufruf: python build-app.py
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
WWW = ROOT / "www"
SRC_HTML = ROOT / "pizza-rechner-mobile.html"
SYNC_VERSION_SCRIPT = ROOT / "sync-version.py"

# (Quellordner unter ROOT, Zielordner unter WWW) -- alle drei muessen 1:1 mitkommen,
# damit die App identisch zur Mobil-Webseite funktioniert.
SOURCE_FOLDERS = ("css", "js", "fonts")


def require_exists(path: Path, hint: str) -> Path:
    """Bricht mit einer klaren deutschen Fehlermeldung ab, wenn eine erwartete Quelle
    (Datei oder Ordner) fehlt, statt spaeter mit einem kryptischen
    FileNotFoundError/shutil-Traceback abzubrechen. `hint` erklaert, was zu tun ist."""
    if not path.exists():
        sys.exit(
            f"FEHLER: erwartete Quelle nicht gefunden: {path}\n{hint}"
        )
    return path


def run_sync_version() -> None:
    """Ruft sync-version.py als eigenen Prozess auf (bewusst nicht per import -- der
    Dateiname enthaelt einen Bindestrich und ist damit kein gueltiger Python-
    Modulname). Bricht build-app.py ab, wenn die Versionsnummer nicht sauber
    durchgezogen werden konnte -- ein App-Build mit widerspruechlicher Versionsnummer
    waere schlimmer als gar kein Build."""
    if not SYNC_VERSION_SCRIPT.exists():
        sys.exit(f"FEHLER: {SYNC_VERSION_SCRIPT} nicht gefunden.")
    result = subprocess.run([sys.executable, str(SYNC_VERSION_SCRIPT)])
    if result.returncode != 0:
        sys.exit(
            "FEHLER: sync-version.py ist fehlgeschlagen (s. Meldung oben) -- www/ wird "
            "nicht gebaut, um keinen Stand mit falscher/fehlender Versionsnummer zu "
            "erzeugen."
        )


def build_www() -> None:
    require_exists(
        SRC_HTML,
        "pizza-rechner-mobile.html ist die Quelle fuer www/index.html -- sollte im "
        "Projekt-Root liegen.",
    )
    for folder in SOURCE_FOLDERS:
        require_exists(
            ROOT / folder,
            f'Ordner "{folder}/" wird 1:1 nach www/{folder}/ kopiert, sollte im '
            f"Projekt-Root liegen.",
        )
    require_exists(
        ROOT / "assets" / "img",
        'assets/img/ enthaelt die eingebundenen App-Bilder (nicht die '
        "Bild-Erzeugungs-Skripte in assets/) -- sollte vorhanden sein.",
    )
    require_exists(
        ROOT / "assets" / "logo.svg",
        "assets/logo.svg wird fuer das Logo in der App gebraucht.",
    )

    WWW.mkdir(exist_ok=True)

    html = SRC_HTML.read_text(encoding="utf-8")
    (WWW / "index.html").write_text(html, encoding="utf-8")

    for folder in SOURCE_FOLDERS:
        shutil.copytree(ROOT / folder, WWW / folder, dirs_exist_ok=True)

    (WWW / "assets").mkdir(exist_ok=True)
    shutil.copytree(ROOT / "assets" / "img", WWW / "assets" / "img", dirs_exist_ok=True)
    shutil.copy(ROOT / "assets" / "logo.svg", WWW / "assets" / "logo.svg")

    print(
        f"www/ gebaut aus {SRC_HTML.name}: "
        f"{', '.join(f + '/' for f in SOURCE_FOLDERS)}, assets/img/, assets/logo.svg kopiert."
    )
    print("Naechste Schritte: npx cap sync android, dann gewohnter Gradle-Bau (s. Kopf dieser Datei).")


if __name__ == "__main__":
    run_sync_version()
    build_www()
