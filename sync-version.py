#!/usr/bin/env python3
"""
Liest die eine zentrale Versionsnummer aus package.json ("version": "X.Y.Z") und
schreibt sie an die Stellen, die sie sonst von Hand haetten mitgezogen werden muessen
(s. PLAYSTORE-BACKLOG.md, Punkt D1 "Versionsnummer zentralisieren"):

1. Sichtbare Versionsanzeige im Burgermenue beider HTML-Quellen
   (<span class="nav-version" id="appVersion">vX.Y.Z</span>),
   in pizza-rechner.html UND pizza-rechner-mobile.html.
2. android/app/build.gradle: versionName (derselbe SemVer-String) und versionCode
   (eine bei jeder Play-Store-Einreichung garantiert steigende ganze Zahl,
   s. compute_version_code() unten fuer das genaue Ableitungsschema).

Wird automatisch von build-app.py als allererster Schritt aufgerufen (s. dort), kann
aber auch alleine laufen: "python sync-version.py" -- z.B. direkt nach dem Erhoehen von
package.json["version"], noch bevor ein App-Build ansteht, um schon mal die sichtbare
HTML-Versionsanzeige zu aktualisieren.

WICHTIG, falls dieses Skript fehlschlaegt: es aendert NIE package.json selbst (das ist
die von Hand gepflegte Quelle der Wahrheit) und bricht mit einer klaren, auf Deutsch
verstaendlichen Meldung ab, statt irgendetwas mit einer geratenen Versionsnummer zu
ueberschreiben oder still nichts zu tun.

Was dieses Skript bewusst NICHT tut: pizza-rechner-mobile-standalone.html direkt
anfassen (die wird ganz normal ueber "python build-mobile-standalone.py" aus der bereits
synchronisierten pizza-rechner-mobile.html neu erzeugt), package.json selbst
hochzaehlen (SemVer-Entscheidung -- Patch/Minor/Major -- bleibt bewusst Handarbeit),
"?v="-Cache-Busting-Parameter setzen (die wurden mit D1 aus allen drei HTML-Dateien
entfernt, s. PLAYSTORE-BACKLOG.md).

Aufruf: python sync-version.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
PACKAGE_JSON = ROOT / "package.json"
HTML_FILES = [ROOT / "pizza-rechner.html", ROOT / "pizza-rechner-mobile.html"]
GRADLE_FILE = ROOT / "android" / "app" / "build.gradle"

# Nur "echtes" SemVer X.Y.Z (reine Ziffern) -- Vorabversionen wie "4.44.0-beta" oder
# Build-Metadaten sind hier bewusst nicht vorgesehen, s. compute_version_code().
VERSION_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def read_version():
    """Liest package.json["version"] und prueft das Format. Bricht mit sys.exit (klare
    Meldung, kein wirrer Traceback) ab, wenn die Datei fehlt, kein version-Feld hat oder
    das Feld kein einfaches SemVer ist -- lieber gar nichts tun als etwas Falsches
    schreiben."""
    if not PACKAGE_JSON.exists():
        sys.exit(
            f"FEHLER: {PACKAGE_JSON} nicht gefunden -- das ist die einzige Quelle der "
            f"Versionsnummer, ohne sie kann sync-version.py nichts tun."
        )
    try:
        data = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"FEHLER: {PACKAGE_JSON} ist kein gueltiges JSON ({e}).")
    raw = data.get("version")
    if not raw:
        sys.exit(f'FEHLER: {PACKAGE_JSON} hat kein "version"-Feld.')
    m = VERSION_RE.match(raw)
    if not m:
        sys.exit(
            f'FEHLER: package.json["version"] = {raw!r} ist kein einfaches SemVer '
            f'X.Y.Z (nur Ziffern, z.B. "4.44.0"). Vorabversionen/Build-Metadaten '
            f"unterstuetzt compute_version_code() bewusst nicht."
        )
    return raw, tuple(int(g) for g in m.groups())


def compute_version_code(major, minor, patch):
    """Leitet aus der SemVer-Nummer den Android/Play-Store-"versionCode" ab (muss bei
    jeder Store-Einreichung hoeher sein als beim letzten Mal, s. PLAYSTORE-BACKLOG.md D1
    -- das ist eine Play-Store-Pflicht, kein Stilwunsch).

    Schema: major * 1_000_000 + minor * 1_000 + patch.
    - Erlaubt minor UND patch je bis 999, bevor sie rechnerisch in die naechsthoehere
      Stelle "hineinlaufen" wuerden. Zum Vergleich: bei Einfuehrung dieses Schemas
      (D1, package.json-Version 4.44.0) stand minor bei 44 -- reichlich Puffer, da nicht
      jede App-Aenderung die Minor-Version erhoeht (rein interne/Infrastruktur-Punkte wie
      B3 bekamen z.B. bewusst keinen Versionssprung).
    - Play Store erlaubt versionCode bis 2 100 000 000. Mit diesem Schema waere selbst
      major=2000 noch innerhalb der Grenze.
    - Bewusst KEIN eigenstaendiger fortlaufender Zaehler (haette eine zusaetzliche
      Zaehlerdatei gebraucht, die unabhaengig von package.json gepflegt werden muesste,
      also eine zweite Quelle der Wahrheit). Dieses Schema ist aus der SemVer-Nummer
      jederzeit deterministisch neu herleitbar, keine zusaetzliche Datei noetig.

    Randfall, den dieses Schema NICHT abfaengt: sollte minor oder patch jemals ueber 999
    steigen, wuerde der Uebertrag in die naechste Stelle das Ergebnis verfaelschen --
    deshalb bricht diese Funktion in dem Fall bewusst ab (s. Aufrufer), statt eine
    falsche Zahl zu produzieren.
    """
    if minor > 999 or patch > 999:
        sys.exit(
            f"FEHLER: minor={minor} oder patch={patch} > 999 -- das aktuelle "
            f"versionCode-Schema (major*1_000_000 + minor*1_000 + patch) in "
            f"sync-version.py wuerde dabei ueberlaufen. Schema ueberarbeiten, bevor es "
            f"weitergeht (bei diesem Versionsstand noch weit entfernt)."
        )
    return major * 1_000_000 + minor * 1_000 + patch


def sync_html(version_str):
    """Ersetzt in beiden HTML-Quellen den Text im appVersion-Span. Erwartet genau EINEN
    Treffer pro Datei -- bei 0 oder >1 Treffern lieber laut abbrechen (Markup hat sich
    vermutlich geaendert) als still das Falsche zu tun oder mehrere Stellen blind zu
    ersetzen."""
    pattern = re.compile(
        r'(<span class="nav-version" id="appVersion">)v[\d.]+(</span>)'
    )
    changed = []
    for path in HTML_FILES:
        if not path.exists():
            sys.exit(f"FEHLER: {path} nicht gefunden.")
        text = path.read_text(encoding="utf-8")
        new_text, n = pattern.subn(rf"\g<1>v{version_str}\g<2>", text)
        if n == 0:
            sys.exit(
                f'FEHLER: In {path.name} wurde kein '
                f'<span class="nav-version" id="appVersion">...</span> gefunden -- '
                f"Markup vermutlich geaendert, Regex in sync-version.py anpassen statt "
                f"stillschweigend nichts zu tun."
            )
        if n > 1:
            sys.exit(
                f"FEHLER: In {path.name} wurden {n} appVersion-Stellen gefunden, "
                f"erwartet war genau 1 -- bitte pruefen statt blind alle zu ersetzen."
            )
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            changed.append(path.name)
    return changed


def sync_gradle(version_str, version_code):
    """Schreibt versionName/versionCode in android/app/build.gradle. Bricht ab, wenn der
    neu berechnete versionCode KLEINER als der bisher eingetragene waere (echter Play-
    Store-Regelverstoss, deutet meist auf eine versehentlich zurueckgedrehte
    package.json-Version hin) -- gleich bleiben ist dagegen erlaubt (z.B. ein erneuter
    Build derselben, noch nicht veroeffentlichten Version)."""
    if not GRADLE_FILE.exists():
        sys.exit(f"FEHLER: {GRADLE_FILE} nicht gefunden.")
    text = GRADLE_FILE.read_text(encoding="utf-8")

    old_code_match = re.search(r"versionCode (\d+)", text)
    if not old_code_match:
        sys.exit(f"FEHLER: 'versionCode <Zahl>' nicht in {GRADLE_FILE.name} gefunden.")
    old_code = int(old_code_match.group(1))
    if version_code < old_code:
        sys.exit(
            f"FEHLER: neu berechneter versionCode ({version_code}) ist KLEINER als der "
            f"bisher eingetragene ({old_code}) in {GRADLE_FILE.name}. Play Store "
            f"verlangt einen bei jeder Einreichung steigenden versionCode -- pruefen, "
            f"ob package.json[\"version\"] versehentlich zurueckgedreht wurde, bevor "
            f"das ueberschrieben wird."
        )

    text, n_code = re.subn(r"versionCode \d+", f"versionCode {version_code}", text, count=1)
    text, n_name = re.subn(
        r'versionName "[^"]*"', f'versionName "{version_str}"', text, count=1
    )
    if n_name == 0:
        sys.exit(f"FEHLER: 'versionName \"...\"' nicht in {GRADLE_FILE.name} gefunden.")

    original = GRADLE_FILE.read_text(encoding="utf-8")
    changed = text != original
    if changed:
        GRADLE_FILE.write_text(text, encoding="utf-8")
    return changed


def sync_all():
    """Fuehrt den kompletten Abgleich aus und gibt (version_str, version_code) zurueck --
    von build-app.py wiederverwendet, damit der Bau-Schritt nicht seine eigene Kopie der
    Ableitungslogik braucht."""
    version_str, (major, minor, patch) = read_version()
    version_code = compute_version_code(major, minor, patch)
    html_changed = sync_html(version_str)
    gradle_changed = sync_gradle(version_str, version_code)
    print(f"Version aus package.json: {version_str} -> versionCode {version_code}")
    print(
        "  HTML-Versionsanzeige: "
        + (", ".join(html_changed) + " aktualisiert" if html_changed else "bereits aktuell")
    )
    print(
        "  android/app/build.gradle: "
        + ("aktualisiert" if gradle_changed else "bereits aktuell")
    )
    return version_str, version_code


if __name__ == "__main__":
    sync_all()
