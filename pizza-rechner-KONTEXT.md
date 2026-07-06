# Kontext: Pizzateig-Rechner App
Stand: 2026-07-06 · Aktuelle Version: v3.1.0 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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

## Funktionsumfang (aktueller Stand v3.0.0)

### 1. Eingaben (linke Spalte, Reihenfolge = Arbeitsablauf)
1. **Preset-Auswahl**: 7 erprobte Rezepte (Dropdown), setzt alle Werte **inkl. passendem Mehl**
2. **Grundeinstellungen**: **Mehl-Dropdown** (13 Sorten, wird per JS aus `PZ.FLOURS` generiert),
   Anzahl Teiglinge, Gewicht/Teigling (Pills), Hydration %, Salz %
3. **Methode & Hefe**: Direkt/Biga/Poolish, Vorteig-Mehlanteil %, Biga-Hydration %,
   **Vorteig-Reifezeit** (Slider, nur bei Biga/Poolish), Frisch-/Trockenhefe,
   Hefemenge % (Pills: 72h+ / 48h / 24h / 8h / 4h),
   **Kaltgare-Stufe** (Segment): „Als Teiglinge (praktisch)" [Standard] / „Im Stück (klassisch)"
4. **Teigtemperatur & Eiswasser**: Ziel-Teigtemperatur (DDT), Raum-/Mehltemperatur, Knetart Hand/Maschine
5. **Zeitplan**: „Ich starte um…" / „Fertig sein um…" + datetime + „Jetzt"-Button

### 2. Ergebnis (rechte Spalte, sticky)
- Gesamtteig + Gesamtmengen (Mehl, Wasser, Salz, Hefe)
- Bei Vorteig: Aufteilung Vorteig-Stufe / Hauptteig-Stufe (**100 % der Hefe in den Vorteig**)
- Wassertemperatur (DDT) + Eismenge (Energiebilanz mit Schmelzwärme 334 J/g)
- Buttons: Drucken, Speichern

### 3. Schritt-für-Schritt-Anleitung (unten, volle Breite)
- Passt sich live an alle Einstellungen an
- **Mehl-Warnung** (`#flourWarn` über den Schritten): ⚠️ wenn Gärzeit > maxH (Mehl zu schwach),
  Gärzeit < minH (Mehl zu stark — Gluten relaxt nicht), Hydration außerhalb hydMin–hydMax.
  **Bei Vorteig zählt die Reifezeit mit** (Biga +18 h, Poolish +16 h).
- **Hefe-Reihenfolge korrekt**: Bei Autolyse (yeast < 1,2 %) kommt der Schritt „Hefe zugeben"
  NACH der Autolyse (Frischhefe: 2–3 EL Schüttwasser zurückbehalten; Trockenhefe: überstreuen).
  Ohne Autolyse: klassisch „Hefe lösen" vor dem Mischen.
- Ab 70 % Hydration: Stretch & Fold statt Kneten
- Zeitplan-Integration: rote `.timechip` je Schritt + grünes Banner Start→Fertig
- Backzeit skaliert mit Teiglingszahl: `max(10, N × (ballw≤260 ? 5 : 7))` Minuten
- Ofen-Vorheizen überlappt die Stückgare (`back: 50` = 50 min vor Backbeginn)

## Vorteig-Reifezeit (v3.1.0)

`state.prefMature` (Stunden). Slider erscheint nur bei Biga/Poolish (`applyMethod` togglet
`#prefMatureBlock`). **Methodenabhängige Range** (in `applyMethod` gesetzt):
- **Biga: 12–48 h** (Default 18) — Biga lässt sich weit dehnen (warm kurz → kühl/Kühlschrank lang).
- **Poolish: 8–24 h** (Default 14) — reißt über ~24 h über (fällt zusammen), daher enger.
Beim Methodenwechsel wird der Wert auf die neue Range geclamped, sonst auf den Default gesetzt.

Der Slider **ersetzt die vorher fixe Reifezeit** (war hart 18 h/16 h in guide.js). `buildGuide`
rechnet `matureMin = prefMature × 60`, nutzt sie als Dauer des „…reifen lassen"-Schritts und
passt den Temperatur-Text an (länger = kühler). Die **Mehl-Warnung zählt `prefMature` als
Vorteig-Reife** mit zur Gesamtgärzeit. `buildGuide` schreibt `R.totalMin` und `R.matureMin`
(für Zeitplan-Banner und Tests). **Hintergrund der Idee:** die Hefe-Pills (72h+ etc.) steuern
nur die Hauptteig-Gare; bei Vorteig dominiert die Reifezeit die Gesamtzeit — daher eigener Regler.

## Kaltgare-Stufe (v3.0.0)

`state.coldStage`: `'balls'` (Standard) oder `'bulk'`. Greift nur bei kalten Führungen (cold: true).
- **'balls' (praktisch)**: kurze Stockgare bei RT (~2 h), dann Teiglinge formen und
  **als Teiglinge in den Kühlschrank**; am Backtag nur temperieren + backen.
- **'bulk' (klassisch)**: der ganze Teig gärt kalt im Stück; Formen + Stückgare am Backtag.
- Die **Gesamtdauer (bulkMin + proofMin) ist in beiden Varianten identisch** —
  darauf verlassen sich die Mehl-Warnung und die Tests.

## Die 7 Presets (alle gegen die Mehl-Warnung geprüft — keine löst eine Warnung aus)

| Key | Methode | Hyd | Salz | Hefe | Mehl (empfohlen) |
|-----|---------|-----|------|------|------------------|
| `napoli_klassisch` | direct | 60 % | 2,8 % | 0,2 % | caputo_pizzeria |
| `napoli_65` | direct | 65 % | 2,8 % | 0,3 % | caputo_pizzeria |
| `napoli_kalt` | direct | **65 %** | 3,0 % | 0,1 % | **caputo_cuoco** |
| `schnell` | direct | 62 % | 2,5 % | 1,5 % | caputo_pizzeria |
| `napoli_biga` | biga (pref 100, bhyd 45) | 65 % | 2,8 % | 0,3 % | caputo_cuoco |
| `napoli_poolish` | poolish (pref 66) | 66 % | 2,5 % | 0,2 % | **dallag_monica** |
| `teglia` | direct (ballw 320) | 75 % | 2,5 % | 0,3 % | **caputo_nuvola_super** |

(napoli_kalt war 62 % → auf 65 % angehoben, damit es zum Cuoco passt;
poolish braucht hydMax ≥ 66 → Monica; teglia braucht hydMax ≥ 75 → Nuvola Super.)

## Mehl-Datenbank (js/flour.js, Quelle: pizza1.de/blog/pizzamehl-uebersicht/)

13 Mehle in 3 Gruppen (Molino Caputo / Molino Dallagiovanna / Teichners Beste).
Jedes Mehl: `{ group, name, w, minH, maxH, hydMin, hydMax, dur }`.
- `minH` = Mindest-Gärzeit (0 = keine), `maxH` = Maximum (168 = praktisch unbegrenzt, Anzeige „72 h+")
- W380-Mehle (Manitoba Oro, leDevine Anna, UNIQUA Blu, Teichners Beste 1): minH 72
- Cuoco/Nuvola Super/Tipo 1: minH 24 (profitieren von länger, brauchen es nicht zwingend)
- **Das `#flour`-Dropdown wird komplett aus `PZ.FLOURS` generiert** (optgroups nach `group`) —
  im HTML steht nur `<select id="flour" class="selectbox"></select>`. Keine Duplikation.

## Dateistruktur (modular)

```
pizza-rechner.html   Markup + Einbindung von CSS und allen JS-Modulen (?v=3.0.0)
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       komplettes Stylesheet (inkl. .selectbox / .selectbox-lg)
js/dom.js            $-Helfer, legt globalen Namespace window.PZ an
js/state.js          PZ.state (inkl. flour, coldStage, prefMature) + PZ.FRESH_TO_DRY (1/3)
js/flour.js          PZ.FLOURS (13 Mehle) + PZ.getFlour() + Dropdown-Befüllung
js/calc.js           PZ.calc() Hauptberechnung, schreibt PZ.R, ruft PZ.buildGuide()
js/schedule.js       PZ.schedule() — Gärzeit-Fahrplan (berücksichtigt coldStage)
js/guide.js          PZ.buildGuide() — Anleitung + Zeitberechnung + Mehl-Warnung
js/ui.js             Slider/Segmente/Pills/Zeitplan; PZ.set, selectSeg, applyMethod, updateTimeLabel
js/presets.js        PZ.PRESETS (inkl. flour je Preset) + PZ.applyPreset()
js/storage.js        PZ.save() / PZ.load() (localStorage, stellt auch flour & coldStage wieder her)
js/main.js           Start: Speichern-Button, load(), applyMethod(), calc()
tests/test.html      ~50 Prüfungen in 7 Kategorien (Doppelklick, kein Server)
README.md            kurzer Einstieg
```

**Ladereihenfolge** (Abhängigkeiten): dom → state → flour → calc → schedule → guide →
ui → presets → storage → main. Jedes Modul ist eine IIFE, kommuniziert nur über `window.PZ`.

**Cache-Busting:** CSS/JS werden mit `?v=3.0.0` geladen. **Bei jeder neuen Version mitziehen.**

## Wichtige Berechnungs-Details

- `calc()`: Mehl = total/(1+h+s+y); Trockenhefe = Frischhefe × 1/3
- Vorteig: `pYeast = yeast` (100 % in den Vorteig), `mYeast = 0`; Poolish-Wasser immer 1:1
- DDT: `wT = ddt×3 − room − room − friction` (Hand 3 °C, Maschine 6 °C; Mehltemp = Raumtemp angenommen)
- Eis: Energiebilanz `x = M·c·(Ttap−wT) / (Lf + c·wT + c·(Ttap−wT))`, c=4,18, Lf=334
- Schedule-Schwellen (yeast %): ≥1,2 Schnell · ≥0,5 Mittel · ≥0,18 ~24 h · ≥0,08 ~48 h · sonst 72 h+
- Zeitplan: `totalMin` = Summe Step-Dauern; Ziel-Modus rechnet rückwärts; `back:50` beim Vorheizen

## Entwicklungsweise / Mitarbeit

- **Kontext-Datei IMMER aktuell halten — nach JEDER Eingabe** (diese Datei ist die einzige
  Quelle für eine frische Session; Stand-Datum + Version oben mitziehen).
- **Versionen-Workflow (Pflicht bei jeder Änderung):** kompletten lauffähigen Stand nach
  `Versionen/vX.Y.Z - [Beschreibung]/` kopieren (html, index, css/, js/, README; tests/ optional).
  SemVer: Patch=Fix, Minor=Feature, Major=Umbau. `?v=` in der HTML mitziehen.
- **Tests:** `tests/test.html` per Doppelklick — grün = OK. Kategorien: Bäckerprozente,
  DDT/Eis, Vorteig-Aufteilung, Trockenhefe, Schedule-Schwellen (beide coldStage-Varianten),
  Mehl-Warnung (inkl. Vorteig-Reifezeit), Backzeit-Skalierung. Nach Logik-Änderungen laufen lassen.
- **Git:** Repo im Hauptordner, kleine Commits pro Änderungs-Satz. `Versionen/` + `.claude/` gitignored.
- **Plattform:** Windows / PowerShell. Kein Node, keine Build-Tools.
- **Preview-Hinweis:** Das Preview-Tool (localhost-Server) war in mehreren Sessions unzuverlässig
  (Browser lädt `chrome-error://`) — Tests einfach per Doppelklick im echten Browser öffnen lassen.

## Versions-Historie

- v1.0.0 — Ausgangsstand (Single-File)
- v2.0.0 — Modulare Struktur (HTML + css/ + js/)
- v2.1.0 — Tests, README, Git, Cache-Busting
- v2.2.0 — Misch-Schritte mit Maschine-vs-Hand-Anweisung
- v2.3.0 — Hefe-Pills beeinflussen auch Vorteig-Zeitplan
- v2.4.0 — Mehl-Auswahl mit Gärzeit-Warnung (7 Sorten)
- v2.5.0 — Mehl-Liste auf 14 Sorten erweitert
- v2.6.0 — Mehlliste aus pizza1.de (13 Mehle); Warnung auch bei W zu hoch (minH)
- v2.7.0 — 72 h+ Gäroption (Hefe-Pill 0,05 % + Schedule-Zweig)
- v2.8.0 — 6 Plausibilitäts-Korrekturen + erweiterte Tests
- v3.0.0 — Grundüberarbeitung:
  - Kaltgare-Stufe wählbar (`coldStage`: Teiglinge [Standard] vs. im Stück)
  - Hefe/Autolyse-Widerspruch behoben (Hefe-Schritt nach der Autolyse)
  - Presets empfehlen Mehl + 3 Preset-Korrekturen (napoli_kalt 65 %, poolish→Monica, teglia→Nuvola Super)
  - Mehl-Warnung zählt Vorteig-Reife mit; Cuoco/Nuvola Super/Tipo 1 minH auf 24 h entschärft
  - Mehl-Dropdown aus FLOURS generiert; Karten-Reihenfolge = Arbeitsablauf; .selectbox-CSS
- v3.0.1 — Poolish-Wasser-Bugfix:
  - Vorteig-Anteil wird in calc() automatisch begrenzt, damit das Vorteig-Wasser
    (pf × pHyd) nie das Gesamtwasser übersteigt (Poolish: max pref = hyd %).
    Vorher: Poolish 100 % bei 65 % Hydration → −312 g Restwasser in der Anleitung.
  - `R.prefEff` / `R.prefClamped` in PZ.R; ⚠️-Hinweis im Schritt „Vorteig abwiegen"
  - Hauptteig-Schritte blenden 0-g-Wasser/-Mehl sauber aus
  - Poolish-Hint unter dem Anteil-Slider erklärt die Grenze
- **v3.1.0 — Vorteig-Reifezeit als Slider** = aktueller Stand:
  - Neuer Regler `prefMature` (nur Biga/Poolish), methodenabhängige Range
    (Biga 12–48 h, Poolish 8–24 h); ersetzt die vorher fixe Reifezeit
  - `buildGuide` nutzt matureMin = prefMature×60, adaptiver Temperatur-Text,
    schreibt R.totalMin/R.matureMin; Mehl-Warnung zählt die Reifezeit mit
  - Presets setzen prefMature (Biga 18, Poolish 14); storage restauriert es
  - Tests: neue Kategorie 8 (Reifezeit → matureMin/totalMin + Mehl-Warnung)

## Mögliche nächste Schritte (offen / Ideen)

- Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)
- Felder für Öl / Zucker (New York / Teglia mit Öl)
- Einkaufsliste generieren; Druck nur für die Anleitung
- Gärzeit-Timer / Wecker; Export als PDF / Teilen-Link
- Mehrere gespeicherte Rezepte (statt einem localStorage-Slot)
- Einfrier-Hinweis in der Anleitung (Wissen dazu steht in der Session-Historie:
  Teiglinge nach dem Formen einölen, einzeln einfrieren, 2–3 Monate; Auftauen:
  über Nacht Kühlschrank + 3–5 h RT + 2–4 h Stückgare)

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
