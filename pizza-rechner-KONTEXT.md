# Kontext: Pizzateig-Rechner App
Stand: 2026-06-28 · Aktuelle Version: v2.1.0 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

> Diese Datei beschreibt den aktuellen Stand der App, damit eine neue Claude-Session
> nahtlos weiterarbeiten kann. Einfach diese Datei zu Beginn der neuen Session
> mitgeben oder den Inhalt einfügen.

## Was ist das?

Ein **Pizzateig-Rechner** für neapolitanische Pizza, aufgeteilt in **mehrere Dateien**
(HTML + ausgelagertes CSS + modulare JS-Dateien). Läuft **komplett offline**
per Doppelklick im Browser — kein Server, keine Build-Tools, kein Internet, keine KI.
Alles ist Vanilla HTML + CSS + JavaScript; die Module werden als **klassische
`<script src>`-Dateien** geladen (kein `type="module"`), damit es per `file://` auf
jedem Windows-11-Rechner in Edge/Chrome/Firefox ohne Server läuft.

- **Einstieg:** `pizza-rechner.html` (oder `index.html`, leitet dorthin weiter)
- **Ordner:** `C:\Users\soere\OneDrive\Dokumente\Claude\Pizza\`
- **Sprache der UI:** Deutsch
- **Persistenz:** `localStorage` (Key: `pizzaRechner`) speichert den `state`

## Warum keine KI / kein Internet?

Teigberechnung ist reine Mathematik (Bäckerprozente). Kernformel:

```
Mehl = Gesamtgewicht / (1 + Hydration% + Salz% + Hefe%)
```

Wasser, Salz, Hefe sind immer **relativ zur Mehlmenge (= 100 %)**.

## Funktionsumfang (aktueller Stand)

### 1. Eingaben (linke Spalte)
- **Zeitplan** (oben): Modus „Ich starte um…" / „Fertig sein um…" + datetime-Eingabe + „Jetzt"-Button
- **Preset-Auswahlmenü**: 7 erprobte Rezepte (Dropdown), setzt alle Werte automatisch
- **Grundeinstellungen**: Anzahl Teiglinge, Gewicht/Teigling (mit Presets-Pills), Hydration %, Salz %
- **Methode & Hefe**: Direkt/Biga/Poolish (Segment), Vorteig-Mehlanteil %, Biga-Hydration %, Frisch-/Trockenhefe, Hefemenge % (mit Pills für Gärzeit)
- **Teigtemperatur & Eiswasser**: Ziel-Teigtemperatur, Raum-/Mehltemperatur, Knetart Hand/Maschine

### 2. Ergebnis (rechte Spalte, sticky)
- Gesamtteig-Gewicht + Gesamtmengen (Mehl, Wasser, Salz, Hefe)
- Bei Vorteig: Aufteilung in Vorteig-Stufe + Hauptteig-Stufe
- Wassertemperatur (DDT-Methode) + nötige Eismenge (Energiebilanz mit Schmelzwärme)
- Buttons: Drucken, Speichern (localStorage)

### 3. Schritt-für-Schritt-Anleitung (unten, volle Breite)
- **Passt sich live an alle Einstellungen an** (Methode, Mengen, Hydration, Gärzeit)
- Erzeugt aus einem `_items`-Array (Sections + Steps mit Dauern in Minuten)
- Bei Biga/Poolish: eigene Vorteig-Abschnitte (Tag 1) + Hauptteig
- Ab 70 % Hydration: Stretch & Fold statt Kneten
- Autolyse-Schritt nur bei wenig Hefe (Direkt-Methode)
- 💡 Tipps und ⚠️ Warnungen in jedem relevanten Schritt
- **Zeitplan-Integration**: Wenn Start-/Zielzeit gesetzt, bekommt jeder Schritt eine
  konkrete Uhrzeit (rote `.timechip`), plus grünes Banner mit Gesamtdauer + Start→Fertig

## Die 7 Presets (Quellen-basiert)

| Key | Name | Methode | Hydration | Salz | Hefe |
|-----|------|---------|-----------|------|------|
| `napoli_klassisch` | Napoli Klassisch (AVPN) · 24 h | direct | 60 % | 2,8 % | 0,2 % frisch |
| `napoli_65` | Napoli 65 % · 24 h | direct | 65 % | 2,8 % | 0,3 % |
| `napoli_kalt` | Napoli Lange Kaltgare · 48–72 h | direct | 62 % | 3,0 % | 0,1 % |
| `schnell` | Schnell · gleicher Tag (4–6 h) | direct | 62 % | 2,5 % | 1,5 % |
| `napoli_biga` | Napoli mit Biga · 16–24 h | biga | 65 % | 2,8 % | 0,3 %, pref 100 %, bhyd 45 % |
| `napoli_poolish` | Napoli mit Poolish · 24–48 h | poolish | 66 % | 2,5 % | 0,2 %, pref 66 % |
| `teglia` | Teglia / Blech · 75 % | direct | 75 % | 2,5 % | 0,3 %, ballw 320 |

Quellen: AVPN-Standard (pizzastunde.com), BURNHARD 24h/65%, manopasto.com (Poolish),
pizzablab.com (Bäckerprozente aller Stile).

## Dateistruktur (modular)

```
pizza-rechner.html   Markup + Einbindung von CSS und allen JS-Modulen
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       komplettes Stylesheet (vorher inline <style>)
js/dom.js            $-Helfer, legt globalen Namespace window.PZ an
js/state.js          PZ.state (Eingaben) + PZ.FRESH_TO_DRY
js/calc.js           PZ.calc() Hauptberechnung, schreibt PZ.R, ruft PZ.buildGuide()
js/schedule.js       PZ.schedule() — Gärzeit-Fahrplan
js/guide.js          PZ.buildGuide() — adaptive Anleitung + Zeitberechnung
js/ui.js             Slider/Segmente/Pills/Zeitplan; exportiert PZ.set, selectSeg, applyMethod, updateTimeLabel
js/presets.js        PZ.PRESETS + PZ.applyPreset()
js/storage.js        PZ.save() / PZ.load() (localStorage)
js/main.js           Start: Speichern-Button, load(), applyMethod(), calc()
tests/test.html      Rechenlogik-Tests (Doppelklick, kein Server) — lädt dom/state/
                     schedule/guide/calc, setzt state, prüft PZ.R gegen erwartete Werte
README.md            kurzer Einstieg (was/starten/struktur/tests/versionen)
```

**Cache-Busting:** CSS/JS in `pizza-rechner.html` werden mit `?v=<version>` geladen
(aktuell `?v=2.1.0`). **Bei jeder neuen Version den `?v=`-Wert mitziehen**, damit der
Browser nach einer Änderung garantiert die neuen Dateien lädt statt gecachter.

## Entwicklungsweise / Mitarbeit
- **Kontext-Datei IMMER aktuell halten — nach JEDER Eingabe:** Diese Datei
  (`pizza-rechner-KONTEXT.md`) am Ende jeder Anweisung/Änderung so hinterlassen, dass eine
  **komplett frische Session allein damit nahtlos weiterarbeiten** könnte. Heißt: Stand-Datum
  und aktuelle Versionsnummer oben aktualisieren, neue Funktionen/Dateien eintragen, getroffene
  Entscheidungen und Eigenheiten festhalten. Pflicht, nicht optional — die Datei ist die
  „einzige Quelle", die für die Weiterarbeit gebraucht wird.
- **Tests:** `tests/test.html` per Doppelklick öffnen — grün = alle Prüfungen bestanden.
  Deckt Bäckerprozente, DDT-Wassertemperatur, Eismenge, Biga-Vorteig-Aufteilung und
  Trockenhefe-Umrechnung ab. Nach Logik-Änderungen kurz prüfen; bei neuer Rechenlogik
  einen Testfall ergänzen.
- **Git:** Der Hauptordner ist ein Git-Repo (kleine Commits, Diff-Historie).
  `Versionen/` und `.claude/` sind gitignored (Schnappschüsse bzw. lokale Tool-Configs).
- **Plattform:** Windows / PowerShell. Keine Build-Tools, kein Node nötig.

Jedes Modul ist eine **IIFE** `(function(global){ ... })(window)`, die nur über das
gemeinsame Objekt **`window.PZ`** kommuniziert (explizite „Exporte" wie `PZ.calc`).
Dadurch keine `const`-Mehrfachdeklaration über mehrere klassische Scripts hinweg.
**Ladereihenfolge** in der HTML beachten (Abhängigkeiten): dom → state → calc →
schedule → guide → ui → presets → storage → main.

## Technische Struktur (Logik, jetzt über die Module verteilt)

- `state` — zentrales Objekt mit allen Eingaben (inkl. `timeMode`, `timeISO`)
- `link(slider, number, key, decimals)` — koppelt Slider + Zahlenfeld, ruft `calc()`
- `seg(containerId, attr, key, after)` — Segment-Buttons (Methode, Hefe-Art, Knetart, Zeitmodus)
- `selectSeg(...)` — aktiviert Segment-Button programmatisch (für load/preset)
- `applyMethod()` — blendet Vorteig-Felder je nach Methode ein/aus
- `calc()` — **Hauptberechnung**, schreibt Ergebnis-DOM, füllt globales `R` (Ergebnisse), ruft `buildGuide()`
- `R` — globales Objekt mit allen berechneten Werten (flour, water, salt, yeast, pf, pw, mFlour, mWater, wT, ice, …)
- `PRESETS` + `applyPreset(key)` — Preset-Logik
- `schedule()` — liefert Gärzeit-Fahrplan (label, bulk/proof-Texte + bulkMin/proofMin) je nach Methode/Hefe
- `buildGuide()` — baut die Anleitung als `_items`-Array, berechnet Zeiten, rendert
- `fmtClock(date)` / `fmtDur(min)` — Zeit-Formatierung
- `sec(t)` / `st(title,chip,body,extra,dur,opts)` — Helfer zum Befüllen von `_items`
- `tip(t)` / `warn(t)` — HTML-Snippets für Tipp-/Warn-Boxen
- `load()` — stellt `state` aus localStorage wieder her
- Speichern-Button schreibt `state` nach localStorage

### Zeitberechnung (Logik)
- Jeder Step hat `dur` (Minuten). Sections haben keine Dauer.
- `totalMin` = Summe aller Step-Dauern. `s._min` = kumulierte Startminute je Step.
- Start-Modus: `base = Startzeit`. Ziel-Modus: `base = Zielzeit − totalMin`.
- Step-Uhrzeit = `base + (_min − back)*60000`. `back:40` beim Vorheizen → 40 min früher (überlappt Stückgare).
- Lange Phasen (Minuten): Biga-Reife 1080, Poolish-Reife 960, Kaltgare-Bulk bis 2250.

## Designsystem (CSS-Variablen)
- `--tomato` #c8442e (Akzent), `--basil` #3a7d44 (grün), `--crust` #e8c98a
- `--bg` #faf6f0, `--card` #fff, `--ink` #2b2420, `--muted` #8a7f76
- Responsive: ab 860px zweispaltig (Eingaben | Ergebnis), Anleitung volle Breite
- `@media print` blendet Bedienelemente aus, zeigt nur Rezept + Anleitung

## Versionen-Workflow (vom Nutzer gewünscht — BEI JEDER ÄNDERUNG anwenden)
- **IMMER bei jeder abgeschlossenen Änderung eine NEUE Version anlegen** (funktioniert
  per Doppelklick → Schnappschuss). Pflicht, nicht optional. Versäumte Zwischenstände
  werden NICHT nachträglich nachgeholt — ab jetzt konsequent pro Änderungs-Satz eine
  neue Version.
- Schnappschuss-Ordner: `Versionen/vX.Y.Z - [kurze Beschreibung]/`.
- **Nummern (SemVer):** Patch = Fix (v1.0.1), Minor = Feature (v1.1.0), Major = großer Umbau (v2.0.0).
- **Schnappschuss = der vollständige, lauffähige Stand:** `pizza-rechner.html`, `index.html`,
  `css/`, `js/`, `README.md`. Den ganzen App-Stand in den neuen Versions-Ordner kopieren —
  jede Version ist eigenständig per Doppelklick startbar (offline, kein Server).
  (`tests/` muss nicht mitkopiert werden; Tests laufen aus dem Hauptordner gegen `../js/`.)
- **`?v=`-Cache-Busting in der neuen `pizza-rechner.html` auf die neue Versionsnummer setzen.**
- **Daten:** Einstellungen liegen im `localStorage` (`pizzaRechner`) — pro Browser, nicht
  pro Ordner. Alle Versionen teilen sich denselben Speicher-Slot.
- Konventionen stehen in `Versionen/LIESMICH.txt`. Die „lebende" App ist immer der
  Hauptordner `…/Claude/Pizza/`; `Versionen/` enthält nur Schnappschüsse.
- **Bisherige Schnappschüsse:**
  - v1.0.0 — Ausgangsstand (Single-File, alles inline in einer `pizza-rechner.html`)
  - v2.0.0 — Modulare Struktur (HTML + `css/styles.css` + `js/`-Module)
  - **v2.1.0 — Tests, README, Git, Cache-Busting** = aktueller Stand
- (Angelehnt an das identische Versionsschema der Food-Bot-App: `…/Claude/Food Bot/Versionen/`.)

## Verlauf / Reihenfolge der Entwicklung
1. Grund-App: Rechner mit Slidern, Bäckerprozente, Vorteig-Aufteilung, Eiswasser-Berechnung
2. Preset-Auswahlmenü mit 7 erprobten Rezepten (recherchiert)
3. Adaptive Schritt-für-Schritt-Anleitung (passt sich an Einstellungen an)
4. Zeitplan-Modus: Start- oder Zielzeit → konkrete Uhrzeiten pro Schritt

## Mögliche nächste Schritte (offen / Ideen)
- Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)
- Felder für Öl / Zucker (für andere Stile wie New York / Teglia mit Öl)
- Einkaufsliste generieren
- Separater Druck-Button nur für die Anleitung
- Gärzeit-Timer / Wecker-Funktion
- Export als PDF oder Teilen-Link
- Mehrere gespeicherte Rezepte (statt nur einem localStorage-Slot)

## Rahmen-Kontext (nicht App-bezogen, aber aus der Session)
Der Nutzer will neapolitanische Pizza machen und hat parallel nach Hardware gesucht:
- **Küchenmaschine** (Budget ~150 €): Beste Option war AEG KM5-1-4BPT (1200 W, Planeten­rührwerk,
  Vollmetall, 5 L) für 149,95 € refurbished auf refurbed.de. Knethaken für Pizzateig nutzen.
- **Pizzaofen**: Statt ZiiPa Piana (119 € neu, 400 °C) eher Ooni Koda 12 gebraucht (~165 €, 500 °C)
  oder Cozze 13" gebraucht (~99–110 €) auf kleinanzeigen.de.
