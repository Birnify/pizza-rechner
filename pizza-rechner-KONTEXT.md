# Kontext: Pizzateig-Rechner App
Stand: 2026-08-15 · Aktuelle Version: v4.40.0 (Desktop + Mobil, vollständige Sicherung exportieren und einlesen) · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

> Diese Datei beschreibt den aktuellen Stand der App, damit eine neue Claude-Session
> nahtlos weiterarbeiten kann. Einfach diese Datei zu Beginn der neuen Session
> mitgeben oder den Inhalt einfügen.

> **Hinweis (Kontext-Aufteilung):** Die ausführliche Release-für-Release-Historie
> (abgeschlossene Features, Bugfixes, Refactorings, Redesigns, Accessibility-Audits,
> verworfene Experimente) wurde nach **`pizza-rechner-KONTEXT-HISTORIE.md`** ausgelagert,
> um diese Datei schlank und schnell ladbar zu halten. Diese Datei enthält den
> **aktuellen Stand, die Domänen-/Berechnungslogik, die Dateistruktur, den Arbeitsablauf
> und das offene Backlog** — alles, was eine frische Session normalerweise braucht.
> Für Detail-Nachschau zu einem konkreten früheren Release die HISTORIE-Datei laden.

## Was ist das?

Ein **Pizzateig-Rechner** für neapolitanische Pizza, aufgeteilt in **mehrere Dateien**
(HTML + ausgelagertes CSS + modulare JS-Dateien). Läuft **komplett offline**
per Doppelklick im Browser — kein Server, keine Build-Tools, kein Internet, keine KI.
Alles ist Vanilla HTML + CSS + JavaScript; die Module werden als **klassische
`<script src>`-Dateien** geladen (kein `type="module"`), damit es per `file://` auf
jedem Windows-11-Rechner in Edge/Chrome/Firefox ohne Server läuft.

- **Einstieg:** `pizza-rechner.html` (oder `index.html`, leitet dorthin weiter)
- **Mobil:** `pizza-rechner-mobile.html` — eigene Akkordeon-Ansicht fürs Handy (v3.5.0), s. u.
- **Ordner:** `C:\Users\soere\OneDrive\Dokumente\Claude\Pizza\`
- **Sprache der UI:** Deutsch
- **Persistenz:** `localStorage` (Key: `pizzaRechner`) speichert **mehrere benannte Rezepte**
  (seit v3.10.0: `{ recipes: [{id, name, state, savedAt}], activeId }`) — gemeinsam für
  Desktop- und Mobil-Seite (gleicher Key, gleiche Domain/Ordner)

## Warum keine KI / kein Internet?

Teigberechnung ist reine Mathematik (Bäckerprozente). Kernformel:

```
Mehl = Gesamtgewicht / (1 + Hydration% + Salz% + Hefe% + Öl%)
```

Wasser, Salz, Hefe **und Olivenöl** sind immer **relativ zur Mehlmenge (= 100 %)**.
Weil Öl ein Bäckerprozent ist, bleibt das Gesamtgewicht exakt N × Teiglingsgewicht —
die anderen Mengen sinken nur minimal, weil das Öl seinen Gewichtsanteil bekommt.

## Funktionsumfang (aktueller Stand v3.0.0)

### 1. Eingaben (linke Spalte, Reihenfolge = Arbeitsablauf)
1. **Preset-Auswahl**: 8 erprobte Rezepte (Dropdown), setzt alle Werte **inkl. passendem Mehl**
2. **Grundeinstellungen**: **Mehl-Dropdown** (13 Sorten, wird per JS aus `PZ.FLOURS` generiert),
   Anzahl Teiglinge, Gewicht/Teigling (Pills), Hydration %, Salz %, **Olivenöl %**, optional
   **Zucker %** (nur sichtbar bei `state.sugar > 0`, s. Abschnitt „Zucker-Feld / New York Style")
3. **Methode & Hefe**: Direkt/Biga/Poolish, Vorteig-Mehlanteil %, Biga-Hydration %,
   **Vorteig-Reife-Stufen** (Pills, nur bei Biga/Poolish — koppeln Reifezeit + Hefe),
   Frisch-/Trockenhefe, Hefemenge % (Pills 72h+…4h nur bei Direkt sichtbar),
   **Kaltgare-Stufe** (Segment): „Als Teiglinge (praktisch)" [Standard] / „Im Stück (klassisch)"
4. **Teigtemperatur & Eiswasser**: Ziel-Teigtemperatur (DDT), **Raumtemperatur und Mehltemperatur
   getrennt einstellbar** (Mehltemperatur startet auf demselben Wert wie die Raumtemperatur,
   ist danach aber unabhängig änderbar, s. Abschnitt „Mehltemperatur getrennt von
   Raumtemperatur (v3.20.0)" unten), Knetart Hand/Maschine
5. **Zeitplan**: „Ich starte um…" / „Fertig sein um…" + datetime + „Jetzt"-Button

### 2. Ergebnis (rechte Spalte, sticky)
- Gesamtteig + Gesamtmengen (Mehl, Wasser, Salz, Hefe, **Öl**, **Zucker** — Öl-/Zucker-Zeile
  blenden je bei 0 % aus)
- Bei Vorteig: Aufteilung Vorteig-Stufe / Hauptteig-Stufe (**100 % der Hefe in den Vorteig**,
  **Öl und Zucker komplett in den Hauptteig** — nie in Biga/Poolish)
- **Keine eigene Wassertemperatur-/Schüttwasser-Anzeige mehr** (seit v4.16.0 entfernt,
  redundant zur Anleitung): die Berechnung (DDT + Eismenge, Energiebilanz mit
  Schmelzwärme 334 J/g) läuft weiterhin intern (`js/calc.js`), der Wert steht nur noch
  in der Schritt-für-Schritt-Anleitung (s. u.)
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

## Vorteig-Reife-Stufen (v3.2.0 — ersetzt den Slider aus v3.1.0)

Reifezeit und Hefemenge hängen physikalisch zusammen (länger = weniger Hefe / kühler bei
gleicher Temperatur — kälter UND länger kann dagegen MEHR Hefe brauchen, s. Poolish unten).
Deshalb **keine freien Regler**, sondern **diskrete Stufen**, die beides koppeln.
Datenquelle: `PZ.PREF_STAGES` in `js/ui.js`. Jede Stufe hat seit v4.24.0 ein explizites
`rel`-Feld, das die Bezugsgröße von `yeast` festlegt — seit v4.25.0 sind **beide**
Vorteig-Methoden `rel:'pref'` (kein `rel:'total'` mehr in der App):
- **Biga** (% vom BIGA-Mehl, aus 12 ausgewerteten Quellen abgeleitet, s. HISTORIE v4.25.0):
  `b_klassisch` (17 h bei 16–18 °C · 1,0 %, Default) · `b_kalt` (2 h anspringen + 48 h
  Kühlschrank · 1,0 %). Beide Stufen landen bei 1,0 %, aber aus zwei unabhängigen
  Quellen (nicht kopiert) — die Kaltstufe kompensiert die Kälte über die dreifache Dauer,
  nicht über mehr Hefe.
- **Poolish** (% vom POOLISH-MEHL, aus 14 ausgewerteten Quellen abgeleitet,
  s. HISTORIE v4.24.0): `p_warm` (10 h Raumtemp · 0,6 %) · `p_cold` (1 h Raumtemp + 24 h
  Kühlschrank · 1,0 %, Default). `p_cold` hat bewusst MEHR Hefe als `p_warm`, weil „länger
  = weniger Hefe" nur bei gleicher Temperatur gilt.

`state.yeast` ist immer % vom GESAMTMEHL (geht bei Vorteig komplett in den Vorteig). Seit
v4.25.0 sind beide Vorteig-Methoden `rel:'pref'`, `PZ.makePrefStages().select()`
(`js/widgets.js`) rechnet dafür immer um: `state.yeast = stage.yeast × (prefEff / 100)`,
wobei `prefEff` derselbe geklemmte Vorteig-Anteil ist, den auch `js/calc.js` verwendet
(`PZ.calcCore(...).prefEff`, NICHT der rohe `state.pref` — sonst überhöhte Dosis, sobald
die Hydration-Klemmung greift; bei Biga ist die Klemmgrenze `hyd / bhyd × 100`, bei Poolish
`hyd` direkt, da `pHyd` dort fix 1 ist). Eine `resync(m)`-Funktion wiederholt diese
Umrechnung, sobald sich der Vorteig-Anteil-Regler (`state.pref`) **oder** `state.hyd`
**oder** `state.bhyd` bei aktiver Stufe ändert (Hook in `js/ui.js` UND `js/newrecipe.js`
über den mitgegebenen Feld-Key in `cfg.onSet(key)`, Auslöserliste `['pref','hyd','bhyd']`
seit v4.24.1) — ohne diesen Nachzieh-Mechanismus würde die tatsächliche Vorteig-Hefedosis
mit dem Regler wegdriften.

- State: `state.prefStage` (aktive Stufe) + `state.prefMature` (h, von der Stufe gesetzt).
- `applyMethod()` (ui.js): rendert die Pills der Methode (`renderPrefStages`), blendet bei Vorteig
  die generischen Hefe-Pills (`#yeastPills`) aus, wählt eine gültige Stufe (`selectPrefStage`).
- `selectPrefStage(m, key)` setzt `prefStage` + `prefMature` **und** die (ggf. umgerechnete,
  s. o.) Hefemenge. Nutzer-Klick auf eine Pill setzt zusätzlich `#preset` zurück auf „Eigene";
  der **programmatische** Aufruf (Load/Preset) nicht.
- `buildGuide` nutzt `matureMin = prefMature × 60` als Dauer des „…reifen lassen"-Schritts,
  adaptiver Temperatur-Text (länger = kühler), schreibt `R.totalMin` / `R.matureMin`.
- **Mehl-Warnung** zählt `prefMature` als Vorteig-Reife zur Gesamtgärzeit.
- **`js/schedule.js` ist seit v4.24.0 von `state.yeast` entkoppelt:** jede Vorteig-Methode
  (Biga UND Poolish) landet unabhängig von der Hefemenge immer im „Lange Hauptgare"-Zweig
  (2–3 h Stockgare, 5–7 h Stückgare, Raumtemp, `cold: false`) — die Hefe-Pills (72h+ etc.)
  steuern also nur noch die Hauptteig-Gare bei der DIREKTEN Methode, bei Vorteig dominiert
  ausschließlich die Reifezeit der Stufe. Nebenwirkung: die Kaltgare-Umschaltung „als
  Teiglinge/im Stück" (`coldStage`) ist bei Vorteig-Methoden dadurch wirkungslos.

**CSS:** `.pills button.active` (tomatenrot gefüllt) zeigt die aktive Stufe.

## Autolyse-Warnung & Hefe-Präzisionshinweis (v3.4.0)

Ausgelöst durch einen realen Fehlschlag: Direkt-Teigführung, 2 h Autolyse, 72 h Kaltgare,
Caputo Cuoco, 0,3 g Hefe/kg Mehl (0,03 %) **trocken** zugegeben → Teig ging schon in der
Stockgare kaum auf und war beim Formen sehr klebrig. Diagnose: (1) Autolyse ist salzfrei —
ohne Salz arbeiten Enzyme (v. a. Protease) ungebremst und bauen bei zu langer Ruhezeit
Klebergerüst eher ab als auf. (2) Bei < 1 g Hefe lässt sich trocken kaum gleichmäßig
verteilen/abwiegen — normale Küchenwaagen liegen hier schnell 30 % daneben.

In `js/guide.js`, im Autolyse-Zweig (`state.yeast < 1,2 %`, nur Direkt-Methode):
- **Autolyse-Schritt** bekommt jetzt immer eine `warn()`: nicht über ~40–60 min ausdehnen.
- `tinyYeast = R.yeast < 1` (absolute Gramm, nicht %): ab hier wird empfohlen, die Hefe
  **immer in Wasser aufzulösen** (auch Trockenhefe) statt trocken einzustreuen, plus Hinweis
  auf **0,01-g-Feinwaage**. `reserveWaterTip` reserviert dafür auch bei Trockenhefe Wasser.
- Bei normaler Hefemenge bleibt das bisherige Verhalten (trocken einstreuen bei Trockenhefe) unverändert.
- Test-Sektion „10 · Anleitungs-Hinweise" prüft beide Schwellen gegen `guideSteps`-HTML.

## Olivenöl (v3.3.0)

Öl ist ein **Bäckerprozent wie Salz/Hefe** (`state.oil`, Default 2 %, Slider 0–8 %).
- `calc()`: `flour = total / (1 + h + s + y + o)`, `oil = flour × o`. Dadurch bleibt das
  **Gesamtgewicht exakt N × W** (Masse erhalten) — Test 9 prüft `flour+water+salt+yeast+oil = total`.
- **Öl kommt spät zum Teig** (erst nach dem Salz, wenn das Gluten steht) — sonst umhüllt es das
  Mehl und stört die Glutenbildung. In der Anleitung als Satzbaustein `oilStep`/`oilTip` in den
  Salz-Schritten (Direkt: „Mischen & Salz & Öl"; Vorteig: „Salz zugeben & Öl").
- **Bei Vorteig geht das Öl komplett in den Hauptteig**, nie in Biga/Poolish (analog wie Salz).
  Result-Panel: `#gOilRow` (Gesamtmengen) + `#mOilRow` (Hauptteig), beide bei 0 % ausgeblendet.
- Öl beeinflusst **nicht** die Eis-/DDT-Rechnung (`M = water` bleibt) — kleine Masse, Raumtemp.
- Alle 7 Presets haben Öl: neapolitanisch je **2 %**, Teglia/Blech **2,5 %** (bis v4.25.1:
  4 %, s. „= aktueller Stand" oben). Zucker bewusst **nicht** (explizit `sugar: 0`) — außer
  beim 8. Preset „New York Style" (**1 %** Zucker, bis v4.25.1: 2 %), s. Abschnitt
  „Zucker-Feld / New York Style" weiter oben.

## Kaltgare-Stufe (v3.0.0)

`state.coldStage`: `'balls'` (Standard) oder `'bulk'`. Greift nur bei kalten Führungen (cold: true).
- **'balls' (praktisch)**: kurze Stockgare bei RT (~2 h), dann Teiglinge formen und
  **als Teiglinge in den Kühlschrank**; am Backtag nur temperieren + backen.
- **'bulk' (klassisch)**: der ganze Teig gärt kalt im Stück; Formen + Stückgare am Backtag.
- Die **Gesamtdauer (bulkMin + proofMin) ist in beiden Varianten identisch** —
  darauf verlassen sich die Mehl-Warnung und die Tests.

## Die 8 Kern-Presets (alle gegen die Mehl-Warnung geprüft — keine löst eine Warnung aus)

Daneben gibt es ein 9. Preset, „New York Style" (einziges Preset mit Zucker > 0), s.
Abschnitt „Zucker-Feld / New York Style" weiter unten. Bewusst nicht in dieser Tabelle.

| Key | Methode | Hyd | Salz | Öl | Hefe | Mehl (empfohlen) |
|-----|---------|-----|------|------|------|------------------|
| `napoli_klassisch` | direct | 60 % | 2,8 % | 2 % | 0,2 % | caputo_pizzeria |
| `napoli_kalt` | direct (`scheduleOverride`, geteilte Kaltgare ~44 h — s. „= aktueller Stand" oben) | **65 %** | 3,0 % | 2 % | **0,25 %** | **caputo_cuoco** |
| `schnell` | direct | 62 % | 2,5 % | 2 % | 1,5 % | caputo_pizzeria |
| `napoli_biga_klassisch` | biga (pref 100, bhyd **50**, b_klassisch) | **70 %** | 2,8 % | 2 % | 1,0 % | caputo_cuoco |
| `napoli_biga_kalt` | biga (pref 100, bhyd **50**, b_kalt) | **70 %** | 2,8 % | 2 % | 1,0 % | caputo_cuoco |
| `napoli_poolish_schnell` | poolish (pref 66, p_warm) | 66 % | 2,5 % | 2 % | 0,396 % | **dallag_monica** |
| `napoli_poolish_kalt` | poolish (pref 66, p_cold) | 66 % | 2,5 % | 2 % | 0,66 % | **dallag_monica** |
| `teglia` | direct (balls 1, ballw 600 — Blechfläche, s. „= aktueller Stand" oben) | 75 % | 2,5 % | **2,5 %** | **0,45 %** | **caputo_nuvola_super** |

(napoli_kalt war 62 % → auf 65 % angehoben, damit es zum Cuoco passt; die beiden Biga-Presets
seit v4.25.0 (s. Historie): bhyd 45 % → 50 %, Gesamthydration 65 % → 70 %
(sitzt exakt auf caputo_cuoco hydMax 70, keine Warnung, aber kein Spielraum nach oben) und
Hefe 0,3 % → 1,0 % (state.yeast, bereits umgerechnet — beide Presets haben pref 100, also
prefEff 100, ungeklemmt); poolish braucht hydMax ≥ 66 → Monica; teglia braucht hydMax ≥ 75 →
Nuvola Super. Hefe bei den beiden Poolish-Presets = effektiver Wert in `state.yeast`, also
bereits umgerechnet auf % Gesamtmehl — s. „rel:'pref'" oben. Zeile „napoli_65" entfernt,
v4.24.0 beim Aktualisieren dieser Tabelle bemerkt: der Preset-Key existierte in
`js/presets.js` gar nicht (mind. seit v4.7.0 nicht mehr, unklar seit wann genau) — reiner
Dokumentationsfehler, keine Code-Änderung nötig. `teglia`-Öl seit v4.26.0 4 % → 2,5 %, aus
Quellen abgeleitet; `teglia`-Hefe seit v4.28.0 0,3 % → 0,45 % + `scheduleOverride` (~76 h
statt ~30 h); `napoli_kalt`-Hefe seit v4.30.0 0,1 % → 0,25 % + `scheduleOverride` (geteilte
Kaltgare, ~44 h statt der vorherigen generischen ~45-h-Schwelle) — s. „= aktueller Stand" oben.)

**Erste reale Backbestätigung (2026-08-03):** der Nutzer hat `napoli_kalt` praktisch nachgebacken, mit gutem Ergebnis. Damit ist dies der bisher einzige Preset-Wert dieser Tabelle mit echter Back-Rückmeldung, konkret für die in v4.30.0 aus der Quellenlage abgeleitete Hefemenge (0,1 % → 0,25 %) und die geteilte Kaltgare (`scheduleOverride`, ~44 h). Alle anderen Presets beruhen weiterhin ausschließlich auf Quellenherleitung ohne eigenen Backtest, s. „Teigwerte und Rahmenparameter nie ohne verlässliche Quellen ändern" in `CLAUDE.md`.

## Mehl-Datenbank (js/flour.js, Quelle: pizza1.de/blog/pizzamehl-uebersicht/)

13 Mehle in 3 Gruppen (Molino Caputo / Molino Dallagiovanna / Teichners Beste).
Jedes Mehl: `{ group, name, w, minH, maxH, hydMin, hydMax, dur }`.
- `minH` = Mindest-Gärzeit (0 = keine), `maxH` = Maximum (168 = praktisch unbegrenzt, Anzeige „72 h+")
- **minH bewusst konservativ** (v3.2.0 reckalibriert): nur wirklich starke Mehle „brauchen"
  lange Gare, sonst 0 — sonst würden kurze Presets (z. B. „schnell" ~4 h) fälschlich warnen.
  W380 (Manitoba Oro, Anna, UNIQUA Blu): minH 48 · W330 (Nuvola Super): 24 ·
  W300–310 (Cuoco, Napoletana): 16 · Monica/Nuvola/Teichner 1 (~W280–300): 12 · Rest: 0.
- **Das `#flour`-Dropdown wird komplett aus `PZ.FLOURS` generiert** (optgroups nach `group`) —
  im HTML steht nur `<select id="flour" class="selectbox"></select>`. Keine Duplikation.

## Vollständige Sicherung exportieren und einlesen (v4.40.0) = aktueller Stand

Play-Store-Vorbereitung, Punkt A3 aus `PLAYSTORE-BACKLOG.md`. Neue Datei `js/backup.js`
(`PZ.exportFullBackup/importFullBackup/isFullBackup/isLegacyRecipesBackup`) erweitert die
bestehenden Buttons (jetzt `#fullBackupExportBtn`/`#fullBackupImportBtn`, vorher
`#recipeExportBtn`/`#recipeImportBtn`) in `js/main.js` von reinem Rezepte-Export auf alle
11 `PZ.store.KEYS` (roher String-Wert je Schlüssel, ein Mechanismus statt zwei). Format:
`{format:'pizzaRechnerFullBackup', version, exportedAt, data:{...}}`. Restore ist ein
echtes Ersetzen (nicht Zusammenführen wie beim alten Rezepte-Import): vor dem Einlesen
eine Bestätigung, danach `PZ.store.flush()` + Live-Region-Ansage + `location.reload()`,
damit jedes Modul seinen normalen Boot-Pfad durchläuft statt einzeln nachsynchronisiert zu
werden. Eine Datei im alten, reinen Rezepte-Format bleibt einlesbar (nur Rezepte werden
ergänzt, Rest bleibt unangetastet, unverändertes `PZ.importRecipes()`). Testsuite 1393 →
**1442** grün (32 eigene + 17 `test-generator`-Fälle), `accessibility-expert`-Review ergab
einen Blocker (fehlende Live-Region-Ansage vor dem Reload, WCAG 4.1.3) und einen Major
(i18n-Text noch nicht an die neue Formulierung angepasst) — beide behoben. `js/backup.js`
neu, `js/main.js`, `js/i18n-dict.js`, `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`tests/test.html` geändert; Standalone-Build neu erzeugt. `PLAYSTORE-BACKLOG.md` Punkt A3
erledigt, nächster empfohlener Punkt B1.

**Volle Details:** `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Vollständige Sicherung
exportieren und einlesen (v4.40.0)".

## LAUFENDE ARBEIT (kein App-Release): Bild-Prompts + automatisierte Bilderzeugung

Stand 2026-08-04 (Sitzung 6), **nicht abgeschlossen**, betrifft nur `assets/`, kein
App-Code. Ausführliche Vorgeschichte (Prompt-Fehlerklassen, Header-Zuschnitt-Geometrie,
CFG-1.0-Erkenntnisse) in `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „LAUFENDE ARBEIT
… Stand bis 2026-08-01, Sitzungen 1–5".

**Neu in Sitzung 6: alle 6 verbleibenden Blöcke aus Bild-Einbau Zyklus 4 (Hero/Header)
generiert**, je 4 Varianten (`python assets/generate_bilder.py --blocks 1,2,4,5,6,7
--variants 4`) — Margherita-Desktop, Menschen-Desktop, Abend-Desktop, Mehl-Desktop,
Margherita-Mobil, Teig-Mobil, zusammen 24 Dateien unter `assets/header-<konzept>_v<1-4>.jpg`.
Nur Teig-Desktop v1 ist aktiv verdrahtet (s. „= aktueller Stand"), die restlichen 23
liegen fertig, aber ungenutzt.

**Beobachtung, die eine künftige Sitzung kennen sollte: die Erzeugung war deutlich und
wiederholt langsamer als die aus Sitzung 5 bekannte ~60–65s/Bild-Baseline**, zeitweise bis
zu ~1000s/Bild bei den 21:9-Großformaten. Live per Windows-Performance-Countern gemessen:
der ComfyUI-Prozess (PyTorch/ROCm) zeigte während aktiver Generierung wiederholt **0%
GPU-Auslastung auf allen Engines** (mehrfach über mehrere Sekunden bestätigt), während die
CPU durchgehend ~1 Kern beschäftigte — sieht nach einem CPU-gebundenen Pfad statt echter
GPU-Berechnung aus. Kein Eintrag im Windows-Systemprotokoll (kein Grafiktreiber-Crash/TDR,
nur 30 Informationsereignisse in 3h, keine Warnungen/Fehler). Ein kompletter Prozess-Neustart
(nicht nur der eingebaute Job-zu-Job-Neustart) linderte es (~630-650s/Bild danach), behob es
aber nicht vollständig — die Ursache ist **nicht abschließend geklärt**. Bei künftigen
Generierungs-Sitzungen mit ähnlich starker Verlangsamung: `Get-Counter '\GPU
Engine(*)\Utilization Percentage'` gegen den ComfyUI-Prozess prüfen, bevor man auf
Fragmentierung tippt oder viel Zeit in weitere Neustarts steckt.

**Neu in Sitzung 5: Referenzbild-Workflow.** Nutzer liefert ein Referenzfoto, das per
`C:\Users\soere\OneDrive\Desktop\KI\Ollama-Essensbeschreibung.ps1 -ImagePath <Bild>`
(Ollama, `127.0.0.1:11434`) in eine dichte englische Bildbeschreibung umgewandelt wird;
daraus werden nur die stimmigen Detailsätze (Textur, Farbgebung) in den bestehenden
deutschen Block-Prompt integriert, nie die Komposition unbesehen übernommen (z. B. wich
ein flach fotografiertes Referenzfoto von der eigentlich gewollten Komposition eines
Blocks ab). Referenzbilder liegen in `KI/Bilder`, `generate_bilder.py` bekam `--variants N`
(erzeugt `_v1.._vN`, lässt die Zieldatei unangetastet), damit der Nutzer aus mehreren
Seeds auswählen kann — das ist jetzt Standard-Vorgehen pro Block.

**Komplexer Mehrfach-Belag überfordert das Modell sichtbar** (Nutzer-Beobachtung
2026-08-01): Einzelmotive mit 1-2 Zutaten (Margherita, Käsekugeln, rohe Zutaten in
Schalen) gelingen zuverlässig, Motive mit mehreren fertig gebackenen, unterschiedlich
belegten Pizzen gleichzeitig (Block 96-98: Pizza-Party-Übersichten) nicht — Ergebnisse
wirken wie Fehlinterpretationen (z. B. Gorgonzola-Tupfen sahen aus wie Spinatnester).
**Blöcke 96-98 deshalb bewusst zurückgestellt**, bis es einen besseren Ansatz gibt oder
sie ohne Bild auskommen müssen.

**Block 77 (`glossar-fiorDiLatte`) mehrfach überarbeitet, Nutzer zuletzt unzufrieden**
mit dem Ergebnis (kleine Bocconcini-Kugeln in hohen Schälchen, unaufgeschnitten, kein
sichtbares Wasser am Boden — funktioniert technisch, trifft aber den gewünschten Look
noch nicht). Bei Fortsetzung zuerst hier ansetzen.

**generate_bilder.py wurde in Sitzung 5 mehrfach an der ComfyUI-Infrastruktur
nachgebessert** (nicht an den Bild-Prompts selbst):
- `ensure_vram_headroom()` prüft vor jedem Bild den freien VRAM
  (`GET /system_stats`) und startet ComfyUI bei Bedarf automatisch über
  `C:\AI\ComfyUI\Start-ComfyUI.bat` neu (NICHT über einen eigenen rohen Befehl — das
  Batch-Skript setzt zusätzlich `PYTORCH_HIP_ALLOC_CONF=expandable_segments:True`).
  Grund: nach vielen Jobs in einer Sitzung hält PyTorch/ROCm zunehmend VRAM als
  „reserviert" ohne es freizugeben; weder der `/free`-API-Endpunkt noch der
  `PizzaVRAMGuard`-Node bekommen das zuverlässig zurück, nur ein Prozess-Neustart.
- `comfyui_workflow_template.json` bekam einen zweiten Custom Node, `WarmupGuard`
  (`custom_nodes/comfyui-warmup-guard`, node 16, direkt vor dem echten KSampler): führt
  einen 1-Step-Warmup-Sample nur aus, wenn das Modell laut ComfyUIs eigener
  Modellverwaltung gerade NICHT auf der GPU liegt, sonst reiner Passthrough. Grund:
  MIOpen/ROCm wählt beim ersten Sampling-Aufruf nach einem Laden die Kernel-Implementierung
  neu aus (Autotuning), das macht genau diesen ersten Durchlauf sichtbar langsamer.
- **Vorbild für beide Nodes und ihre Verdrahtung:** `C:\AI\ComfyUI\user\default\workflows\
  Krea2-Turbo-LoRA-Stack.json` — ein vom Nutzer von Hand gebauter, in der ComfyUI-Oberfläche
  bereits bewährter Workflow mit dem exakt selben `PizzaVRAMGuard` → LoRA-Kette →
  `WarmupGuard` → KSampler-Aufbau (dort mit 4 LoRAs, unser Template nutzt weiterhin nur
  „Filter Bypass"). **Bei künftigen Problemen mit der ComfyUI-Anbindung zuerst dort
  nachsehen, ob die Referenz-Workflow-Datei etwas anders verdrahtet oder parametriert hat**,
  statt neue Mechanismen zu erfinden.
- `PizzaVRAMGuard`-Schwelle im Template bewusst wieder auf **6.0 GB** (Referenzwert aus
  Krea2-Turbo-LoRA-Stack), nachdem ein zwischenzeitlicher Senkversuch auf 2.0 GB und ein
  clientseitiger Zusatz-Warmup-Job sich als Umweg erwiesen hatten, der das eigentliche
  Problem nicht traf (Sitzung 5, ausführlich in der Historie, falls die Details für eine
  Fortsetzung gebraucht werden).
- **Erledigt (Sitzung 6, 2026-08-01):** die am Ende von Sitzung 5 offene Frage hat sich
  bestätigt — bei Block 118 (Neugenerierung wegen falschem Motiv, s. u.) trat erneut live
  eine progressive Verlangsamung auf, obwohl `ensure_vram_headroom()` vor jedem Job „genug
  GB frei" meldete (`vram_free` fiel dabei live nachweisbar von 13,8 GB auf 3,75 GB
  innerhalb weniger Jobs, `torch_vram_total` stieg entsprechend). Der reine
  Schwellenwert-Check erkennt die Fragmentierung offenbar zu spät. `generate_bilder.py`
  erzwingt deshalb jetzt bei Großformaten oberhalb `LARGE_FORMAT_PIXEL_THRESHOLD`
  (2,5 Mio. Px, trifft nur die 21:9-Header mit 2,8 Mio. Px, nicht die 1920x1080-Formate
  mit 2,07 Mio. Px) einen `restart_comfyui()` nach **jedem einzelnen Bild**, nicht erst
  bei Schwellenwert-Unterschreitung — abschaltbar über `--no-large-format-restart`.
- Ein ähnliches „Warum lädt es so lange"-Muster ist möglich, sobald wieder ein
  Header-großes Bild ansteht — dann `curl http://127.0.0.1:8188/system_stats` prüfen
  (`vram_free`), und bei Verdacht auf Fragmentierung `Start-ComfyUI.bat` manuell neu
  starten, bevor man an den Prompts selbst sucht.

**Aktueller Abnahme-Stand** (Block-Nummer → Dateiname per `assets/_final/`-Abgleich):
**~112 von 128 Blöcken** in `assets/_final/` abgenommen. Noch offen:
- **96-100** (`onboarding-party`, `party-hero/auswahl/zutatenliste/eigene-pizza`) —
  99/100 fertig, **96-98 zurückgestellt** (s. o., komplexe Mehrfach-Pizza-Motive).
- **118** (`alt-header-teig-desktop`) — 4 Varianten liegen bereits generiert in `assets/`
  als `alt-header-teig-desktop_v1..v4.webp` (mit dem reparierten Setup erzeugt, ~60-65s
  pro Bild), warten nur noch auf Sichtprüfung + Auswahl + Verschieben nach `_final/`.
- **119** (`alt-card-napoli_klassisch`) — noch nicht begonnen.
- **124** (`alt-glossar-hydration`) — noch nicht begonnen.
- **126** (`detail-hefe`) — noch nicht begonnen, Referenzfoto liegt bereits in
  `KI/Bilder/detail-hefe.jpeg`.
- **77** (`glossar-fiorDiLatte`) — technisch fertig, aber Nutzer zuletzt unzufrieden,
  s. o.

**Nicht mehr in Originalauflösung rekonstruierbar (v4.35.2-Befund):** bei folgenden 12
Dateien fiel die destruktive Verkleinerung in denselben Commit (`c17acf7`), in dem sie
erstmals ins Repo kamen — anders als bei den 19 Anleitungs-Schrittbildern (s. „= aktueller
Stand" oben, dort gab es einen früheren Git-Zustand mit voller Auflösung) existiert hier
kein Git-Zustand mit voller Auflösung, kein lokales Backup gefunden. Nur per Neuerzeugung
über den eigenen ComfyUI-Workflow wiederherstellbar, falls künftig höhere Auflösung
gewünscht ist (kein automatisierter Zyklus, s. Projektregel zu Bildern):
- 7 Rezept-Karten (aktuell 600×400): Block 8 `card-napoli_klassisch`, Block 9
  `card-napoli_kalt`, Block 10 `card-schnell`, Block 11 `card-napoli_biga`, Block 12
  `card-napoli_poolish`, Block 13 `card-teglia`, Block 14 `card-newyork_style`
- 3 Fotos der fertigen Pizza (aktuell 960×540): Block 19 `pizza-final-neapolitanisch`,
  Block 20 `pizza-final-teglia`, Block 21 `pizza-final-newyork`
- 2 Seitenhintergrund-Texturen (aktuell 800×800, stark weichgezeichnet): Block 113
  `texture-marmor`, Block 116 `texture-kruste`

Damit erledigt in Sitzung 5 (zusätzlich zu den 103 aus Sitzung 4): 77 (vorläufig), 82-84,
90 (alle zurückgeholt und mit Referenzbild-Workflow neu bestätigt bzw. bei bereits guten
Ergebnissen belassen), 92-94, 99-100, 107, 109, 115, 117, 120, 122, 123. Block 118 noch
nicht final ausgewählt, s. oben.

**Was noch offen ist (unverändert gegenüber Sitzung 4, s. Historie für Details):**
Restblöcke oben erzeugen und abnehmen; „Fläche freilassen" funktioniert weiterhin nicht
zuverlässig übers Prompting (Layout/Gradient-Overlay statt Prompt-Anweisung). Git-Stand
weiterhin komplett uncommittet (betrifft nur die Erzeugungs-Skripte/Prompts unter `assets/`,
nicht `assets/img/` selbst, das seit v4.32.0 der reguläre, versionierte App-Bildordner ist).

**Bild-Einbau Zyklus 1 (Grundgerüst + Preset-Kartengitter) ist seit v4.32.0 erledigt**,
**Zyklus 6 (Teil, Seitenhintergrund-Textur) seit v4.34.0**, **Zyklus 4 (Teil, Hero/Header)
seit v4.38.0 (Desktop) und v4.38.2 (eigener Mobil-Header)** — s. „= aktueller Stand" oben
und `BILD-EINBAU-KONZEPT.md`. Die restlichen 5 Blöcke aus Zyklus 4 (4 Desktop-Konzepte,
1 weiterer Mobil-Entwurf) bleiben offen.

## Mehltemperatur getrennt von Raumtemperatur (v3.20.0)

Letzter offener Punkt aus „Mögliche nächste Schritte" umgesetzt, vom Nutzer per
`/define-feature` strukturiert und bestätigt. Bisher nahm die Wassertemperatur-Formel
(DDT-Methode) an, dass Mehl- und Raumtemperatur identisch sind (`wT = ddt*3 - room - room
- friction`) — das verfälscht die Schüttwasser-/Eiswasser-Berechnung, wenn das Mehl kühler
(Keller, Kühlschrank) oder wärmer als der Raum lagert.

- **Neuer Regler „Mehltemperatur"** (`#flourTemp`/`#flourTempN`) direkt neben/unter dem
  bestehenden Raumtemperatur-Regler, auf beiden Seiten im Card „Teigtemperatur & Eiswasser".
  Das bisherige Feld hieß „Mehl-/Raumtemperatur" (repräsentierte beide Werte gleichzeitig)
  und wurde umbenannt zu reinem „Raumtemperatur" — jetzt bildet es nur noch `state.room` ab.
- **`js/state.js`:** neuer State-Wert `flourTemp: 21` (identischer Default wie `room: 21`
  — „startet standardmäßig auf demselben Wert wie die Raumtemperatur"). Danach völlig
  unabhängig änderbar, **keine laufende Synchronisierung**: ändert der Nutzer später die
  Raumtemperatur, zieht das die Mehltemperatur nicht automatisch mit (bewusste
  Abgrenzung aus der Feature-Definition — nur der initiale Default-Wert ist identisch).
- **`js/calc.js` (DDT-Formel):** `wT = state.ddt * 3 - state.room - state.flourTemp -
  friction` statt vorher `state.room` doppelt. Sonst keine Änderung an der Formel/
  Eiswasser-Energiebilanz — `Ttap` (Leitungswassertemperatur für den Eisbedarf) bleibt
  weiterhin `state.room`, nicht `flourTemp` (Leitungswasser hat Raumtemperatur, nicht
  Mehltemperatur).
- **`js/ui.js`:** `PZ.set.flourTemp = link('flourTemp', 'flourTempN', 'flourTemp', 0,
  'Grad Celsius Mehltemperatur')`, analog zu `room`.
- **`js/storage.js` (`applyState`):** `if (state.flourTemp != null) set.flourTemp
  (state.flourTemp)` — Fallback-Muster analog zum bestehenden `oil`-Guard, damit ältere
  gespeicherte Rezepte (vor v3.20.0, ohne `flourTemp`-Feld) beim Laden nicht crashen; der
  zuvor im UI stehende Wert bleibt in dem Fall einfach stehen statt mit `undefined`
  überschrieben zu werden.
- **`js/presets.js`:** `if (p.flourTemp != null) set.flourTemp(p.flourTemp)` ergänzt
  (aktuell nutzt kein Preset dieses Feld — aus dem Scope explizit ausgeklammert, alle
  Presets bleiben unverändert), plus `'flourTemp'` in der Liste der Regler-IDs, die bei
  manueller Eingabe `#preset` auf „Eigene Einstellung" zurücksetzen.
- **Slider-Bereich bewusst weiter als beim Raumtemperatur-Regler:** `min="4" max="32"
  step="1"` (Raumtemperatur: `min="10" max="32"`) — deckt explizit auch kühl gelagertes
  Mehl aus dem Kühlschrank ab (~4–8 °C), das laut Feature-Motivation ein Kernfall ist.
  Zahlenfeld `min="0" max="40"`, identisch zum Raumtemperatur-Feld. Eigene Design-
  Entscheidung des Orchestrators (im Feature-Auftrag nicht spezifiziert), im
  `accessibility-expert`-Review mitgeprüft, keine Einwände.
- **Bewusst NICHT angefasst** (laut Scope/Abgrenzung): Mehl-Warnung und Gärzeit-Logik
  (`js/guide.js`/`js/schedule.js`) bleiben unverändert an `state.room` gekoppelt, kein
  separates Mehltemperatur-Feld pro Mehlsorte, keine automatische Kopplung nach dem
  initialen Default.

**Tests** (`tests/test.html`, `BASE` + Sektion 2 „Wassertemperatur & Eismenge" + Sektion
16 „Speichern & Laden", 399 → **418**): `BASE.flourTemp: 21` ergänzt (Test-Isolation,
identisch zu `room`); alle bestehenden DDT-/Eiswasser-Testfälle, die `room` überschreiben,
um ein passendes `flourTemp: <gleicher Wert>` ergänzt (regressionssichert das alte
„Mehl=Raum"-Verhalten weiter); 3 neue Testfälle für unabhängige Werte (Mehl kühler als
Raum, Mehl wärmer als Raum, Default-Regression); vom `test-generator`-Agenten gezielt
ergänzt: 2 Kombinationsfälle, in denen allein `flourTemp` (nicht `room`) den Eisbedarf
auslöst bzw. vermeidet, ein Masseerhaltung-Anker (unterschiedliches `flourTemp` ändert
`flour`/`water`/`salt`/`yeast`/`total` nicht, nur `wT`/`ice`), sowie ein Legacy-Storage-
Regressionstest (gespeichertes Rezept ganz ohne `flourTemp`-Feld lädt ohne Crash, Sentinel-
UI-Wert bleibt erhalten). Alle 418 Prüfungen grün (Headless-Edge-Dump). Gezielter
`accessibility-expert`-Review der neuen Regler-Markup-Instanz (identisches Muster wie
`#ddt`/`#room`, keine neuen CSS-Klassen) auf Desktop **und** Mobil: keine Befunde, keine
Änderungen nötig — Label-Verknüpfung, `aria-valuetext` mit eigener Einheit-Ansage,
Mobil-`.unit`-Span-Muster, Tab-Reihenfolge, alles bereits korrekt durch Wiederverwendung
der etablierten Feld-Struktur. Kein `mobile-optimizer`-Lauf nötig (keine neue CSS/kein
neues Layout, reine Feld-Wiederholung).

**Geändert:** `js/state.js`, `js/calc.js`, `js/ui.js`, `js/storage.js`, `js/presets.js`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.20.0`
gezogen (Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.20.0 - Mehltemperatur getrennt von Raumtemperatur/` enthält den
vollständigen Schnappschuss.

## Zucker-Feld / New York Style (v3.19.2, Sichtbarkeit seit v4.7.0 wertbasiert)

Neues Feature, vom Nutzer über `/define-feature` strukturiert und in einer Rückfrage-Runde
präzisiert: ein Zucker-Regler als Bäckerprozent (analog zu Öl, s. v3.3.0) plus ein neues
Preset „New York Style", das ihn nutzt. Bewusst **kein** sonstiger New-York-Style-
spezifischer Eingriff (keine andere Backzeit-/Temperaturlogik, keine Krustenform-Logik) —
nur der Regler + das Preset. **Seit v4.7.0 (Backlog Punkt C) ist die Regler-Sichtbarkeit
rein wertbasiert** (`state.sugar > 0`) statt über ein Feature-Flag/Preset-Gate — s. den
„= aktueller Stand"-Abschnitt weiter oben; die Bullets unten zu Formel/DOM/Anleitungstext
sind weiterhin aktuell, nur der frühere Flag-Mechanismus (unten historisch dokumentiert)
existiert nicht mehr.

- **Formel** (`js/calc.js`): `flour = total / (1 + h + s + y + o + su)` (`su = sugar/100`),
  `sugar = flour × su`. Dadurch bleibt das Gesamtgewicht weiterhin exakt N × W (Masse
  erhalten), jetzt auch mit Zucker in der Summe. `PZ.R.sugar` neu im Ergebnis-Objekt.
  `state.sugar` (Default **0**, `js/state.js`) — Slider 0–5 %, analog Öl aber engerer
  Bereich (typische Zucker-Bäckerprozente liegen niedriger als Öl).
- **DOM:** `#gSugar`/`#gSugarRow` (Gesamtmengen) + bei Vorteig-Methoden zusätzlich
  `#mSugar`/`#mSugarRow` (Hauptteig) — beide Zeilen blenden bei `sugar < 0,05 g` per
  `display:none` aus, analog `#gOilRow`/`#mOilRow`. Es gibt bewusst **kein** `pSugar`-Feld:
  Zucker geht wie Öl komplett in den Hauptteig, taucht im Vorteig (Biga/Poolish) selbst
  nie auf.
- **Regler-Sichtbarkeit:** `#sugarBlock` (`pizza-rechner.html` + `pizza-rechner-mobile.html`,
  jeweils im Grundeinstellungen-Feld nach Öl) nutzt das etablierte `.collapse`/`.show`-Muster
  (wie `prefBlock`/`bigaHydBlock`) statt `style.display` — verhindert einen Flacker-Moment
  vorm ersten Render-Lauf, da `.collapse{display:none}` schon per CSS vor jeder
  JS-Ausführung greift. Seit v4.7.0 setzt `js/calc.js` (`renderResult()`) die `show`-Klasse
  bei jedem `PZ.calc()`-Aufruf rein wertbasiert (`R.sugar >= 0.05`, identischer Schwellwert
  wie `#gSugarRow`/`#mSugarRow` unten). **CSS-Detail:** weil `.field:last-child{margin-bottom:0}` strukturell
  immer auf `sugarBlock` zeigt (auch bei `display:none` — `:last-child` ist DOM-Struktur,
  nicht Sichtbarkeit), bekommt stattdessen das Öl-Feld davor fix `margin-bottom:0` und
  `sugarBlock` selbst `margin-top:18px` (statt `margin-bottom:0` allein) — sonst hätte das
  Öl-Feld bei ausgeblendetem Zucker (Standardfall für die meisten Nutzer) eine unschöne
  Extra-Lücke am Kartenboden gehabt. Per Headless-Edge-CDP verifiziert: Kartenboden-Abstand
  ist in beiden Zuständen (Zucker aus/an) exakt 21 px (20 px Padding + 1 px Rahmen), der
  Row-Abstand zwischen Öl und sichtbarem Zucker-Feld 18 px (Standard-Feldabstand).
- **⚠️ Historisch, seit v4.7.0 entfernt:** bis v4.6.0 gab es zusätzlich ein Feature-Flag
  `newYorkStyle` (`js/settings.js`, Menüpunkt „New York Style"), das den Zucker-Regler
  unabhängig vom Preset-Wert dauerhaft ein-/ausblenden konnte (Historie der mehrfachen
  Korrekturen an dieser Logik in v3.19.2/v3.19.3/v3.20.1: s.
  `pizza-rechner-KONTEXT-HISTORIE.md`). Seit v4.7.0 (Backlog Punkt C) ersatzlos entfernt —
  die Sichtbarkeit hängt nur noch vom aktuellen `state.sugar`-Wert ab (s. Bullet oben).
- **Preset „New York Style"** (`js/presets.js`, `newyork_style`): `direct`, 62 % Hydration,
  2,5 % Salz, **1,5 % Öl**, **1 % Zucker** (seit v4.26.0, aus Quellen abgeleitet — bis
  v4.25.1: 3 % Öl / 2 % Zucker, s. „= aktueller Stand" oben), **1,2 % Hefe** (frisch, seit
  v4.28.0, vorher 0,2 %) **+ `scheduleOverride`** (~44 h statt der generischen
  Schnellgare-Schwelle, die 1,2 % sonst treffen würde — s. „= aktueller Stand" oben),
  300 g/Teigling, 24 °C DDT, Mehl `dallag_napoletana` (W310, hydMin 60/hydMax 65, minH
  16/maxH 48), löst keine Mehl-Warnung aus (per Headless-Edge verifiziert: `#flourWarn`
  bleibt leer, 4 h Sicherheitsabstand zur maxH-Grenze 48 h). Bewusst **nicht**
  Teil der „7 Kern-Presets"-Tabelle weiter oben (die bleibt unverändert). Seit v4.7.0 kein
  `flag`-Gate mehr (alle 7
  Kern-Presets + dieses setzen `sugar` jetzt gleichrangig explizit, 0 bzw. 1).
- **`js/guide.js` — Zucker kommt anders als Öl FRÜH in den Teig** (mit Mehl/Wasser/Hefe,
  nicht erst nach dem Salz): unterstützt die Hefeaktivität statt das Glutennetz zu stören.
  `hasSugar = R.sugar >= 0.05`. Direkt-Methode: taucht in der „Zutaten abwiegen"-Zeile
  (zwischen Hefe und Öl) und im Mischen-Schritt-Titel/-Text auf (Titel wird zu „Mischen &
  Zucker & Salz & Öl", Body bekommt `sugarPhrase` nach „Mehl, Wasser & Hefe" eingefügt,
  `sugarTip` erklärt die frühe Zugabe). Vorteig-Methoden: taucht im „Vorteig + Wasser +
  Mehl + Zucker"-Hauptteig-Mix-Schritt auf (`sugarTip` dort im Extra-Block) — der spät
  zugegebene Öl-Schritt bleibt unverändert getrennt davon.

**Tests** (`tests/test.html`, `test-generator`-Agent, +53 neue Prüfungen, 338 → **391**):
`BASE`-Objekt um `sugar: 0` ergänzt (Test-Isolation, analog `oil: 0`); `PRESET_STATES` um
`newyork_style` ergänzt (läuft automatisch durch Mehl-Warnung- und Masseerhaltung-Schleifen
mit); Masseerhaltung-Formel um `+sugar` erweitert + eigene Methoden-Schleife (Direkt/Biga/
Poolish) mit Öl **und** Zucker kombiniert; neue Sektion **„19 · Zucker (New York Style,
Bäckerprozent)"**: Masseerhaltung mit Öl+Zucker, Default-Regression, `#gSugarRow`-
Sichtbarkeit, Vorteig-Fall (Zucker komplett im Hauptteig, kein `#pSugar`-Element, Biga
**und** Poolish), Kombi-Test (Biga+Öl+Zucker+Kaltgare „im Stück"), `guide.js`-Textprüfung
(„Zucker" bei Direkt **und** Biga, verschwindet bei 0 %), Randfälle 1/20 Teiglinge; Sektion
Feature-Flags: `newYorkStyle`-Default (`false`) + Vorwärtskompatibilitäts-Regressionsanker
in `PZ._mergeFlags()` (alter Flag-Stand ohne `newYorkStyle`-Key bekommt sauber `false`,
ohne andere gespeicherte Werte zu verlieren). Alle 391 Prüfungen grün (Headless-Edge-Dump).
Funktional zusätzlich per Headless-Edge-CDP (WebSocket, `--remote-allow-origins=*`)
verifiziert: Preset-Anwendung auf Desktop **und** Mobil (Zucker/Öl/Hefe/Mehl/Gewicht korrekt
gesetzt, Flag + Checkbox + `#sugarBlock`-Sichtbarkeit synchron, keine Mehl-Warnung, „Zucker"
im gerenderten Anleitungstext), Flag-Persistenz beim Zurückwechseln auf „Eigene Einstellung".

**Geändert:** `js/state.js`, `js/calc.js`, `js/ui.js`, `js/presets.js`, `js/settings.js`,
`js/guide.js`, `pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`.
`?v=` auf `3.19.2` gezogen (Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.19.2 - Zucker-Feld New York Style/` enthält den vollständigen Schnappschuss.

## Dateistruktur (modular)

```
pizza-rechner.html   Markup + Einbindung von CSS und allen JS-Modulen (?v=4.25.0 -- seit
                     v4.5.0 synchron mit Mobil, s. u.: Desktop lädt weiterhin ohne
                     css/fonts.css, das ist unabhängig von der Versionsnummer)
pizza-rechner-mobile.html  Mobil-Ansicht (Akkordeon), nutzt dieselben JS-Module + IDs (Quelle,
                     ?v=4.25.0)
pizza-rechner-mobile-standalone.html  Build-Ergebnis (alles inline) — DIESE Datei geht aufs iPhone
build-mobile-standalone.py  Python-Skript, das die Standalone-Datei erzeugt (Aufruf s. o.)
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       komplettes Stylesheet (inkl. .selectbox / .selectbox-lg / .viewlink),
                     Design-Tokens (Farben/Typografie/Spacing) seit v4.0.0 aus dem
                     Claude-Design-Projekt-Import, gemeinsam für Desktop + Mobil
css/mobile.css       Ergänzungen NUR für pizza-rechner-mobile.html (Akkordeon, Touch-Ziele, Quick-Bar)
css/fonts.css        selbst gehostete Webfonts (Bitter + Hanken Grotesk, v4.0.0), NUR in
                     pizza-rechner-mobile.html eingebunden (vor css/styles.css) — Desktop bleibt
                     bei Georgia/System-Sans, s. Design-Import-Zyklus-1-Abschnitt oben
fonts/               3 WOFF2-Dateien (Bitter normal/italic, Hanken Grotesk normal, je variabel
                     400-800), von css/fonts.css referenziert
assets/logo.svg      App-Icon (v4.0.0, aus dem Design-Import), im Header vor "Teigmeister" --
                     Mobil seit v4.0.0, Desktop seit v4.19.0 (vorher 🍕-Emoji)
js/store.js          Speicher-Zwischenschicht (v4.38.4 A1, async vorbereitet seit v4.39.0 A2,
                     s. „= aktueller Stand" oben): PZ.store.get/set/remove/getJSON/setJSON
                     (synchron, Zwischenspeicher im Arbeitsspeicher) + PZ.store.hydrate()/
                     flush() (async) + PZ.store._backend (aktuell localStorage). Lädt als
                     ALLERERSTES Skript, noch vor js/dom.js, hat selbst keine Abhängigkeiten.
js/dom.js            $-Helfer, legt globalen Namespace window.PZ an + PZ.announce(elementId, text)
                     (v3.58.0, gemeinsamer Live-Region-Helfer — Clear-then-delayed-set mit
                     Generation-Zähler je Element-ID, ersetzt 7+ frühere Einzelkopien) + seit
                     v4.12.0 PZ.moveFocusBeforeHide(containers, fallbackTarget)/
                     PZ.toggleCollapse(container, show, opts) (Fokus-Erhalt bei .collapse/
                     .show-Feldern, WCAG 2.4.3/4.1.3, s. „= aktueller Stand" oben)
js/state.js          PZ.state (inkl. flour, oil, coldStage, prefMature, knead) + PZ.FRESH_TO_DRY (1/3)
                     + PZ.looksLikeState(o) (v3.59.0, gemeinsame State-Plausibilisierung — ersetzt
                     looksLikeState()/isLegacyState()/isValidRecipeEntry() aus share.js/storage.js)
js/i18n-dict.js      Wörterbuch-INHALT (v3.55.0, aus js/i18n.js ausgelagert): ~569 add(key,de,en)-
                     Einträge, reine Daten. Lädt VOR js/i18n.js, übergibt sein DICT per
                     PZ._I18N_DICT-Handoff
js/i18n.js           PZ.t()/PZ.setLang() — Deutsch/Englisch-Sprachversion (v3.28.0), deckt statische
                     HTML-Texte + dynamisch generierte JS-Texte ab (Anleitung, Einkaufsliste, ...).
                     Seit v3.55.0 reine Laufzeit-Engine (übernimmt DICT von js/i18n-dict.js), PZ.
                     _i18nAdd bleibt als Hook für spätere, nach dieser Datei ladende Ergänzungen
js/images.js         Bild-Register (v4.32.0, s. BILD-EINBAU-KONZEPT.md): PZ.IMG (einzige Stelle mit
                     Bild-Dateinamen) + PZ.img(key)/PZ.imgHtml(key,opts) (liefern null/'' bei
                     unbekanntem/pending/im Standalone-Build nicht eingebettetem Bild) +
                     PZ.hydrateImages() (füllt statische `[data-img-key]`-Platzhalter beim Laden)
js/settings.js       PZ.FLAGS — Feature-Flags fürs Einstellungen-Menü (v3.16.0), eigener
                     localStorage-Key `pizzaRechnerFeatureFlags`, vorwärtskompatibler Merge mit DEFAULTS.
                     Seit v3.64.0 zusätzlich PZ.ADJUST (Hefemengen-/Verschwendungs-Anpassung, eigener
                     Key `pizzaRechnerAdjustments`, geklemmt per PZ._clampAdjust())
js/theme.js          Dunkelmodus (v3.47.0): folgt `prefers-color-scheme`, bis der manuelle
                     Umschalter im Einstellungen-Menü übersteuert (persistiert)
js/units.js          Einheitensystem-Umschaltung Metrisch/Imperial (v3.65.0): folgt
                     `navigator.language` (nur "en-US" → Imperial), bis der manuelle Umschalter im
                     Einstellungen-Menü übersteuert (persistiert, eigener Key `pizzaUnits`, Muster
                     identisch zu js/theme.js). PZ.formatWeight/formatWeightAuto/formatTemp: reine
                     Anzeige-Formatierungsschicht (g↔oz/lb, °C↔°F), rührt PZ.state nicht an
js/widgets.js        Gemeinsame Widget-Fabriken (v3.56.0, vorher in js/ui.js + js/newrecipe.js +
                     js/flour.js dupliziert): PZ.makeLink/makeSeg/makePrefStages/fillFlourSelect —
                     js/flour.js, js/ui.js, js/newrecipe.js rufen sie als dünne Konfigurationsaufrufe.
                     Seit v3.70.0 zusätzlich PZ.makeStepper (Zahlenfeld+Minus/Plus statt Slider),
                     genutzt von js/ui.js; js/newrecipe.js bleibt bei PZ.makeLink (unverändert)
js/flour.js          PZ.FLOURS (13 Mehle) + PZ.getFlour() + Dropdown-Befüllung (via
                     PZ.fillFlourSelect(), s. js/widgets.js)
js/calc.js           PZ.calcCore(state)→R reine Rechenfunktion (kein DOM) + PZ.renderResult(R) fürs
                     DOM (seit v3.57.0 getrennt) + PZ.calc()-Fassade (ruft beides + PZ.buildGuide())
js/schedule.js       PZ.schedule() — Gärzeit-Fahrplan (berücksichtigt coldStage); state.
                     scheduleOverride (seit v4.28.0, nur von js/presets.js gesetzt) sticht
                     vor der generischen Hefemenge-Schwellen-Kaskade
js/guide.js          PZ.buildGuide() — Anleitung + Zeitberechnung + Mehl-Warnung + Timer-Platzhalter
js/timer.js          PZ.wireTimers() — Gärzeit-Timer/Wecker je Schritt (Notification + Web-Audio-Beep,
                     State in localStorage['pizzaRechnerTimers'], kein Server/Service-Worker); nutzt
                     Browser-APIs, die bewusst NICHT in tests/test.html geladen/unit-getestet werden
js/ui.js             Stepper/Segmente/Pills/Zeitplan; PZ.set, selectSeg, applyMethod, updateTimeLabel
                     (Segmente/Reife-Stufen seit v3.56.0, Stepper seit v3.70.0 über
                     js/widgets.js-Fabriken — kein <input type=range> mehr im Hauptrechner)
js/simplemode.js     Einfacher Modus für Presets (v3.62.0): #controlsCol.mode-simple/.mode-advanced
                     + DOM-Reparenting der 3 Kernfelder zwischen ihrer Original-Karte und der neuen
                     Karte "Deine Einstellungen", Persistenz via localStorage-Key pizzaSimpleMode
js/print.js          PZ.buildShoppingList() (Einkaufsliste aus PZ.R) + PZ.printShoppingList()/PZ.printGuide()
js/pdf.js            PZ.downloadGuidePDF() — „Als PDF speichern" (v3.25.0), handgeschriebener
                     PDF-1.4-Generator ohne externe Bibliothek, teilt sich das Flag „shopping" mit print.js
js/presets.js        PZ.PRESETS (inkl. flour je Preset) + PZ.applyPreset()
js/storage.js        PZ.save()/PZ.load() + Mehrfach-Rezepte (saveAsNew/renameActive/deleteRecipe/
                     loadRecipe/listRecipes) + Rezepte-Backup (exportRecipes/importRecipes, v3.21.0),
                     localStorage-Format {recipes[],activeId}, migriert alten Einzel-Slot-Stand automatisch
js/newrecipe.js      eigenständiges Mini-Formular „Neues Rezept anlegen" (v3.22.0) — legt IMMER ein
                     neues Rezept an, rührt PZ.state/den laufenden Rechner-Zustand nie an (Slider/
                     Segmente/Reife-Stufen/Mehl-Dropdown seit v3.56.0 über js/widgets.js-Fabriken)
js/share.js          Teilen-Link (v3.14.0): PZ.state als Base64-JSON in der URL, zum Kopieren/Laden
                     (über PZ.applyState() aus js/storage.js)
js/party.js          Pizza-Party-Planer (v3.27.0) — eigenständiger Bereich, kein Zugriff auf
                     PZ.state/PZ.calc()
js/glossary.js       Pizza-Glossar (v3.37.0) — eigenständiger Menü-Bereich, reine Anzeige-Funktion.
                     Seit v4.36.0 (komplett neu geschrieben, "Glossar-Kachelregal"): drei
                     Ansichten -- Regal aus 7 bebilderten Kategoriekacheln (PZ.GLOSSARY_
                     CATEGORIES, alphabetisch sortiert) / betretene Kategorie (Bannerkopf +
                     unverändertes Single-Open-<details>-Akkordeon der Artikel, seit v4.3.0)
                     / flache, gruppierte Suchtrefferliste über Titel+Artikeltext, s.
                     „= aktueller Stand" oben
js/main.js           Start: Speichern-Button, Rezept-Auswahl/-Buttons, load(), applyMethod(), calc()
js/nav.js            Gemeinsames Navigations-Modul (v3.54.0, vorher zwei/drei duplizierte
                     Inline-Scripts): openNav/closeNav/activateView/announceView/focusView/gotoView +
                     Tab-Trap; läuft bewusst als letztes Script (nach main.js). PZ.closeNav seit
                     v3.63.0 exportiert (für js/onboarding.js), Klick-Guard für Menüpunkte ohne
                     eigenen data-goto (z. B. "Einführung"). Seit v3.67.0 (Bottom-Tab-Navigation
                     Mobil) verdrahtet activateView() ALLE .nav-item-Buttons site-weit (nicht nur
                     die im Burgermenü-Overlay) + neues data-goto-group-Attribut (hält einen
                     Haupt-Tab aktiv, solange einer seiner Unterbereiche offen ist) — Desktop
                     unverändert (behält sein Burgermenü), nur Mobil nutzt die neue
                     Bottom-Tab-Leiste + eingebettete Sekundär-Navigation (.calc-subnav)
js/onboarding.js     Willkommens-Screen / Einführung (v3.63.0): eigenständiges Modal-Overlay mit
                     eigenem Fokus-Trap, stellt 4 Kernfunktionen vor, automatisch beim Erststart
                     + jederzeit über die eigene "Einführung"-Karte ganz oben auf der
                     Einstellungen-Seite aufrufbar (Desktop + Mobil, seit v4.18.0 -- vorher
                     Burgermenü-Punkt auf Desktop bzw. Ende der "Funktionen"-Karte auf Mobil,
                     s. "= aktueller Stand" oben), Persistenz via
                     localStorage-Key pizzaOnboardingDontShow. Läuft als letztes Script (nach nav.js)
tests/test.html      964 Prüfungen in 32 Kategorien (Doppelklick, kein Server) — lädt 18 der 28
                     js/*-Module direkt (dom/state/i18n-dict/i18n/images/settings/theme/units/
                     widgets/flour/schedule/guide/calc/print/pdf/storage/share/party); ui.js,
                     timer.js, presets.js, newrecipe.js, glossary.js, main.js, nav.js,
                     simplemode.js, onboarding.js werden NICHT geladen (reines DOM-Wiring bzw.
                     Browser-APIs) — einzelne Ausschnitte wie PZ.PRESETS werden bei Bedarf
                     punktuell gestubbt
README.md            kurzer Einstieg
```

## Design-System (wo es liegt, Stand 2026-08-02)

Die maßgebliche Design-System-Beschreibung für Teigmeister liegt im Repo unter
**`design-import/DESIGNSYSTEM-TEIGMEISTER.md`** (vom Nutzer am 2026-08-02 bereitgestellt,
vorher auf seinem Desktop). Sie enthält Farbrollen für beide Themes, das Typo-Konzept
(Bitter + Hanken Grotesk), Radien, Abstände, Komponenten-Spezifikationen, Ton der Texte
und die bewussten Abweichungen von der laufenden App. **Bei Design-Fragen zuerst dort
nachsehen**, statt Werte neu zu erfinden.

Im selben Ordner `design-import/` liegt das dazugehörige System als Dateien: `tokens/`
(Farb-/Typo-/Abstands-Variablen, Quelle des v4.0.0-Imports), `components/` (React-Fassungen
der App-Bausteine, unter anderem `cards/PresetCard.jsx`, `media/Media.jsx`), `guidelines/`
(Spezimen-Karten), `ui_kits/teigmeister/` (Bildschirm-Nachbau). Das ist **Referenz, kein
App-Code** — die App selbst lädt nichts daraus, `css/styles.css` ist die gelebte Fassung.

Derselbe Stand liegt im Claude-Design-Projekt „Design System" des Nutzers
(Projekt-ID `9e7391e5-3857-4faf-a77c-e3a0b5460e1b`), dorthin am 2026-08-02 mit 44 Dateien
hochgeschoben. Änderungen am Design-System gehören in beide Richtungen abgeglichen.

**Bild-Einbau:** das Konzept, wie die rund 128 erzeugten Bilder in die App kommen, steht
in **`BILD-EINBAU-KONZEPT.md`** im Projekt-Root (Ordnerregel, zentrales Bild-Register,
Markup-Baustein, Reihenfolge der Kategorien, getroffene Entscheidungen). Zyklus 1 (Grundgerüst
+ Preset-Kartengitter) ist seit v4.32.0 erledigt, s. „= aktueller Stand" oben.

**Ladereihenfolge** (Abhängigkeiten): store → dom → state → i18n-dict → i18n → images → settings → theme →
units → widgets → flour → calc → schedule → guide → timer → ui → simplemode → print → pdf →
presets → storage → newrecipe → share → party → glossary → main → nav → onboarding. Jedes Modul
ist eine IIFE, kommuniziert nur über `window.PZ`. `onboarding` MUSS nach `nav` geladen werden
(braucht `PZ.closeNav`). **`i18n-dict` MUSS vor `i18n` geladen werden** (Handoff über
`PZ._I18N_DICT`); `images` MUSS nach `i18n` geladen werden (löst dekorative vs. beschreibende
Alt-Texte über `PZ.t()` auf) und vor `guide`/`glossary`/`presets` (die künftig/bereits
`PZ.imgHtml()` aufrufen). **`widgets` MUSS vor `flour`/`ui`/`newrecipe` geladen werden** (liefert
PZ.makeLink/makeSeg/makePrefStages/fillFlourSelect, die diese drei Module beim eigenen Laden
direkt aufrufen). `units` MUSS vor `calc`/`guide`/`print` geladen werden (liefert PZ.formatWeight/formatWeightAuto/
formatTemp, die diese drei Module beim Rendern direkt aufrufen).

**Cache-Busting:** CSS/JS werden mit `?v=X.Y.Z` geladen. **Bei jeder neuen Version mitziehen.**
Zwischen v4.0.0 und v4.4.0 bewusst auseinandergelaufen (Design-Import-Zyklen waren
mobile-only, Desktop-HTML wurde nicht angefasst) — **seit v4.5.0 wieder synchron**, beide
HTML-Dateien stehen bei `?v=4.25.0`. Bei einem künftigen Zyklus, der nur eine Seite ändert,
erneut bewusst entscheiden, ob ein Auseinanderlaufen sinnvoll ist oder beide mitgezogen
werden (v4.17.0 war rein mobil-inhaltlich, `?v=` wurde bewusst trotzdem auf beiden Seiten
mitgezogen, um die Synchronität zu erhalten — s. Abschnitt „Quick-Bar-Speichern-Button
entfernen (v4.17.0)" in der HISTORIE-Datei; v4.18.0 betraf inhaltlich wieder beide Seiten;
v4.19.0 war inhaltlich reines Desktop-Markup, v4.20.0 inhaltlich eine reine i18n-Textkürzung,
v4.21.0 (`--bg-gradient`-Token in `css/styles.css`, gemeinsam für beide Seiten), v4.22.0
(Card-Elevation, `css/styles.css`, ebenfalls beide Seiten), v4.23.0 (plattformabhängige
Feature-Flag-Defaults, `js/settings.js`, funktional nur auf Mobil relevant -- Desktop läuft
faktisch immer im "Fallback"-Zweig -- `?v=` trotzdem bewusst auf beiden Seiten mitgezogen),
v4.23.1 (Button-Text `nav.onboarding`, `js/i18n-dict.js`, inhaltlich beide Seiten) und
v4.23.2 (Logo-Schatten `assets/logo.svg` entfernt, inhaltlich beide Seiten, zusätzlich
eigenes `?v=4.23.2` an der Logo-`<img>` selbst ergänzt).

**Sichtbare Versionsnummer (seit v3.7.1, seit v3.46.0 im Menü statt im Footer):** Im
Burgermenü (`.nav-panel`) beider HTML-Dateien steht `<span class="nav-version"
id="appVersion">vX.Y.Z</span>` — rein statischer Text, keine JS-Logik dahinter. Seit v4.5.0
wieder synchron (beide `v4.25.0`), analog zum Cache-Busting oben. **Bei jedem
Versionssprung von Hand mitziehen** (zusammen mit `?v=` und der Kontext-Datei — bei allen
drei HTML-Dateien, also auch `pizza-rechner-mobile-standalone.html` nach dem Rebuild,
gegenprüfen), sonst zeigt die Live-App die falsche Version an.

## Wichtige Berechnungs-Details

- `calc()`: Mehl = total/(1+h+s+y+o); Öl = Mehl×o; Trockenhefe = Frischhefe × 1/3
- Vorteig: `pYeast = yeast` (100 % in den Vorteig), `mYeast = 0`, **Öl → Hauptteig**; Poolish-Wasser immer 1:1
- DDT: `wT = ddt×3 − room − flourTemp − friction` (Hand 3 °C, Maschine 6 °C; Mehltemp seit
  v3.20.0 ein eigener Regler, Default = Raumtemp, danach unabhängig änderbar)
- Eis: Energiebilanz `x = M·c·(Ttap−wT) / (Lf + c·wT + c·(Ttap−wT))`, c=4,18, Lf=334
- Schedule-Schwellen (yeast %): ≥1,2 Schnell · ≥0,5 Mittel · ≥0,18 ~24 h · ≥0,08 ~48 h · sonst 72 h+
- Temperaturskalierung (v4.27.0, nur `method==='direct'`): `factor = 2^((21-room)/10)`,
  gekappt [0,25; 4]. Mechanismus quellenbelegt (Weekend Bakery, PizzaPlan), 10 °C bewusst
  konservativ aus der belegten 6-10-°C-Bandbreite gewählt. `bulkMin` skaliert außer bei
  `coldStage 'bulk'` (dort mischt es Raumtemp+Kühlschrank); `proofMin` skaliert nur bei
  `coldStage 'bulk'` oder `cold===false` (sonst mischt es Kühlschrank+Temperieren) — s.
  HISTORIE für die genaue Begründung.
- DDT-Reibungskonstanten (3 °C Hand / 6 °C Maschine) quellengeprüft (v4.27.0, gegen King
  Arthur Baking und Dolf Starrevelds Referenzseite), keine Änderung nötig.
- Backzeit-Formel (`max(10, N × 5 oder 7)`) quellenlos, aber intern konsistent mit den
  Anleitungstexten geprüft (v4.27.0) und für in Ordnung befunden, keine Änderung.
- Zeitplan: `totalMin` = Summe Step-Dauern; Ziel-Modus rechnet rückwärts; `back:50` beim Vorheizen

## Entwicklungsweise / Mitarbeit

- **Kontext-Datei IMMER aktuell halten — nach JEDER Eingabe** (diese Datei ist die einzige
  Quelle für eine frische Session; Stand-Datum + Version oben mitziehen).
- **Kontext-Datei schlank halten (seit der Aufteilung in v3.61.0/2026-07-21) — PFLICHT bei
  jedem Abschluss:** Diese Datei (`pizza-rechner-KONTEXT.md`) enthält NUR aktuelles Verhalten,
  Domänenlogik, Dateistruktur, Arbeitsweise und das offene Backlog. Die Release-für-Release-
  Erzählung (was wurde geändert, warum, wie getestet, welche Dateien) gehört NICHT hierher,
  sondern in `pizza-rechner-KONTEXT-HISTORIE.md`. Konkret bei jedem Zyklus-Abschluss:
  1. Den **vorherigen** „= aktueller Stand"-Abschnitt (den der letzte Zyklus hier hinterlassen
     hat) **unverkürzt an den Anfang** von `pizza-rechner-KONTEXT-HISTORIE.md` verschieben
     (unter eigener `## Titel (vX.Y.Z)`-Überschrift, ohne den „= aktueller Stand"-Zusatz —
     der gilt ja nicht mehr).
  2. In dieser Hauptdatei dafür einen **neuen, kurzen** „= aktueller Stand"-Abschnitt schreiben
     (Richtwert: 5–10 Zeilen) — nur das Nötigste: was geändert, kurz warum, welche Dateien,
     Testergebnis, ein Verweis „Volle Details: `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt
     „…"". Keine Wiederholung von Implementierungsdetails, die schon im Code stehen.
  3. Sonstige Wachstumshistorie (z. B. Testsuite-Kategorien über die Zeit) gehört ebenfalls
     in die HISTORIE-Datei, nicht in Fließtext-Bullets dieser Datei — hier nur der aktuelle
     Zahlenstand.
  - **Nichts wird beim Auslagern gelöscht oder gekürzt inhaltlich verändert** — nur verschoben.
    Bei Unsicherheit, ob etwas „aktuelles Verhalten" oder „Historie" ist: Verhalten/Fakten, die
    ein Leser *heute* wissen muss, um die App zu verstehen → hier bleiben. Die Geschichte, *wie*
    es dazu kam → HISTORIE.
- **Desktop + Mobil immer zusammen pflegen (Nutzer-Vorgabe, seit v3.5.0):** Bei
  **inhaltlichen Änderungen** — neue/geänderte Felder, Berechnungslogik, Presets, Mehle,
  Texte/Hinweise in der Anleitung, Vorteig-/Kaltgare-Optionen usw. — **immer beide Dateien**
  anfassen: `pizza-rechner.html` (Desktop) **und** `pizza-rechner-mobile.html` (Mobil), da
  Letztere ihr eigenes Markup mit denselben Element-IDs hat (kein Auto-Sync). Reine
  `js/*`-Logikänderungen ohne neue/geänderte IDs wirken automatisch auf beiden Seiten, weil
  beide dieselben Module laden — **nur bei neuen/umbenannten Feldern** muss das HTML doppelt
  gepflegt werden.
  **Ausnahme:** Änderungen, die wirklich nur das Mobil-**Layout** betreffen (Akkordeon-Verhalten,
  Touch-Ziele, Quick-Bar, `css/mobile.css`) oder nur das Desktop-Layout (`css/styles.css`,
  Grid-Spalten) betreffen nur die jeweilige Seite — dort reicht eine Datei.
- **Versionen-Workflow (Pflicht bei jeder Änderung):** kompletten lauffähigen Stand nach
  `Versionen/vX.Y.Z - [Beschreibung]/` kopieren (html, index, css/, js/, README; tests/ optional).
  SemVer: Patch=Fix, Minor=Feature, Major=Umbau. `?v=` in der HTML mitziehen.
- **Tests:** `tests/test.html` per Doppelklick — grün = OK. **Aktueller Stand: 1077 Prüfungen in
  35 Kategorien** (Zahl seit mehreren Zyklen nicht mehr Zeile für Zeile mitgezogen, s. „=
  aktueller Stand" oben für den genauen v4.28.0-Zuwachs; volle Kategorie-Liste s. Dateistruktur
  oben): Bäckerprozente, DDT/Eis, Vorteig-Aufteilung, Trockenhefe,
  Schedule-Schwellen, Mehl-Warnung, Backzeit-Skalierung, Olivenöl (Masseerhaltung), Anleitungs-
  Hinweise, Randfälle/Edge Cases, Kombinationen, Zeitplan-Rückwärtsrechnung, Einkaufsliste,
  Speichern & Laden, Teilen-Link, Feature-Flags/Einstellungen, Zucker/New-York-Style,
  Rezepte-Backup, PDF-Export, Pizza-Party-Planer, Sprachversion DE/EN, Dunkelmodus,
  Hefemengen-/Verschwendungs-Anpassung, Einheitensystem Metrisch/Imperial,
  Glossar-Verweise in der Anleitung, Foto der fertigen Pizza, Inline-Verlinkung von
  Glossar-Begriffen im Anleitungstext, Akkordeon-Verhalten der Hinweisboxen,
  Fokus-Erhalt bei .collapse/.show-Feldern, Vorteig-Stufen (Biga + Poolish) rel:'pref'-
  Umrechnung + Klemm-/Vorteig-Anteil-Drift-Fix. Nach
  Logik-Änderungen laufen lassen. `js/timer.js` (Notification/setInterval/Web-Audio-API) und
  `js/newrecipe.js` (reines DOM-Wiring) werden bewusst **nicht** in `tests/test.html` geladen —
  beide stattdessen manuell bzw. per isoliertem Headless-Aufbau verifiziert. Die Wachstums-
  Historie der Testsuite Version für Version steht in `pizza-rechner-KONTEXT-HISTORIE.md`.
- **Git:** Repo im Hauptordner, kleine Commits pro Änderungs-Satz. `Versionen/` + `.claude/` gitignored.
- **Plattform:** Windows / PowerShell. Kein Node, keine Build-Tools.
- **Preview-Hinweis:** Das Preview-Tool (localhost-Server) war in mehreren Sessions unzuverlässig
  (Browser lädt `chrome-error://`) — Tests einfach per Doppelklick im echten Browser öffnen lassen.
- **Hängende Headless-Edge-Instanz beenden — NIEMALS systemweit killen:** Falls ein
  `msedge --headless`-Verifikationsaufbau hängt, **niemals** `taskkill /F /IM msedge.exe`
  (killt ALLE Edge-Prozesse systemweit, auch reguläre Fenster des Nutzers ungefragt).
  Stattdessen den selbst gestarteten Prozess gezielt per PID beenden (PID beim Start merken,
  z. B. `Start-Process msedge -PassThru` in PowerShell liefert sie; unter Bash z. B. `wmic
  process where "name='msedge.exe' and commandline like '%--headless%'" get processid` zur
  gezielten Identifikation, dann `taskkill /F /PID <nur diese ID>`). Im Zweifel lieber einzelne,
  sich selbst beendende Kurzaufrufe statt eines dauerhaft laufenden Headless-Prozesses.

## Einstellungen-Menü für Feature-Flags (v3.16.0, `js/settings.js`)

Neues Modul `js/settings.js` (Ladereihenfolge direkt nach `state.js`, vor allen anderen
Modulen — braucht `PZ.$`, wird aber selbst von `guide.js`/`timer.js`/`print.js` nur
optional gelesen). Auslöser: der Nutzer wollte die zuletzt gebauten Zusatzfunktionen
(Timer, System-Wecker-Links, Teilen-Link, Einkaufsliste/Druck, Einfrier-Hinweis, Mehrere
Rezepte) einzeln ein-/ausschalten können, statt sie fest im Layout zu haben.

- **Feature-Flags** (`PZ.FLAGS`), persistiert unter eigenem localStorage-Key
  `pizzaRechnerFeatureFlags` (getrennt vom Rezept-Speicher `pizzaRechner`), gemeinsam
  für Desktop + Mobil (gleicher Key, gleicher Ordner). Defaults exakt wie vom Nutzer
  festgelegt:

  | Flag | Feature | Default |
  |------|---------|---------|
  | `timer` | Gärzeit-Timer/Wecker je Anleitungsschritt (v3.11.0) | **AN** |
  | `timerSystem` | System-Wecker/Kalender-Links im Idle-Timer (v3.15.0, Teil-Feature von `timer`) | **AUS** |
  | `share` | Teilen-Link (v3.14.0) | **AN** |
  | `shopping` | Einkaufsliste & separater Druck (v3.9.0) | **AUS** |
  | `freezeHint` | Einfrier-Hinweis in der Anleitung (v3.8.0) | **AUS** |
  | `multiRecipes` | Mehrere gespeicherte Rezepte (v3.10.0, sonst Einzel-Slot-Verhalten) | **AN** |

  `readFlags()` merged gespeicherte Werte mit `DEFAULTS` (`Object.assign({}, DEFAULTS,
  stored)`) — vorwärtskompatibel: künftige neue Flags bekommen automatisch ihren Default,
  ohne bestehende Nutzereinstellungen zu überschreiben. `PZ.setFlag(key, value)` schreibt
  sofort persistent, unbekannte Keys werden ignoriert (Tippfehler-Schutz).

- **Neue Card „Einstellungen"** (Desktop: normale `<div class="card">` nach der
  Zeitplan-Card; Mobil: `<details class="card">` im Akkordeon, identisches Muster wie
  die anderen Karten) mit 6 nativen `<label class="switch-row"><input type="checkbox"
  id="flagXxx"> Text</label>`-Zeilen — natives Label+Checkbox braucht kein zusätzliches
  ARIA für den Accessible Name. Neue CSS-Klasse `.switch-row` (`css/styles.css`):
  44 px Touch-Ziel, `accent-color:var(--tomato)`, dünner Trenner zwischen den Zeilen.

- **Rendering-Effekt je Flag** (`PZ.applyFlags()`, aufgerufen bei jeder Checkbox-Änderung
  und einmal beim Seitenstart):
  - `multiRecipes` aus → die komplette „Meine Rezepte"-Card (`#recipesCard`) wird per
    `style.display='none'` **komplett aus dem Rendering genommen** (nicht nur optisch
    versteckt — `display:none` nimmt Elemente auch aus Tab-Reihenfolge/Accessibility-Tree).
    **Bewusst keine Änderung an `js/storage.js`/dessen Datenmodell** (`{recipes:[...],
    activeId}` bleibt unangetastet): mit ausgeblendeter Karte kann der Nutzer nur noch den
    normalen „Speichern"-Button nutzen, der laut bestehender `save()`-Logik ohnehin immer
    nur das aktuell aktive Rezept überschreibt (bzw. beim allerersten Mal genau eines
    anlegt) — das ergibt exakt das gewünschte Einzel-Slot-Verhalten, ohne Datenverlust und
    ohne Migrationscode: wird das Flag später wieder aktiviert, stehen alle zuvor
    gespeicherten Rezepte unverändert wieder im Dropdown.
  - `share` aus → `#shareBlock` (umschließt `#shareLinkBtn` + `#shareHint` +
    `#shareLiveMsg`, mit `display:flex;flex-direction:column;gap:8px` um das bisherige
    Abstandsmuster in `.actions` exakt zu erhalten) wird ausgeblendet.
  - `shopping` aus → `#shoppingRow` (die `.row2`-Zeile mit „Einkaufsliste drucken"/
    „Anleitung drucken") wird ausgeblendet. Zusätzlich defensive Guards direkt in
    `PZ.printShoppingList()`/`PZ.printGuide()` (no-op bei deaktiviertem Flag), falls die
    Funktionen doch aufgerufen werden.
  - `timer` aus → `js/guide.js`s `timerBox()` liefert einen leeren String statt des
    `.timerbox`-Platzhalters — `js/timer.js` findet dann nichts zu verdrahten. Da
    `timerSystem` (System-Wecker-Links) nur **innerhalb** einer bereits gerenderten
    Timer-Box erscheint, ist das Teil-Feature damit automatisch mit deaktiviert, ganz ohne
    eigene Prüfung an der Stelle.
  - `timer` an + `timerSystem` aus → `js/timer.js`s `systemTimerHtml()` liefert einen
    leeren String, der normale Start-Button bleibt erhalten — genau das vom Nutzer
    gewünschte Verhalten „Timer ja, Android/Kalender-Links nein".
  - `freezeHint` aus → der zusätzliche Tipp „Einfrieren möglich: …" im Schritt „Teiglinge
    formen" (`js/guide.js`) wird nicht mit ausgegeben; der andere Tipp in demselben Schritt
    (Cornicione-Hinweis) bleibt unverändert.
  - Nach jeder Flag-Änderung ruft `applyFlags()` zusätzlich `PZ.buildGuide()` neu auf,
    damit `timer`/`freezeHint` sofort sichtbar werden, ohne dass der Nutzer erst einen
    Regler bewegen muss.

- **Rückwärtskompatibilität mit `tests/test.html`:** Alle Guards in `guide.js`/`timer.js`/
  `print.js` prüfen explizit `PZ.FLAGS && PZ.FLAGS.<key> === false` (nicht
  `PZ.FLAGS.<key>`) — lädt eine Umgebung `js/settings.js` gar nicht (wie die bestehende
  Testsuite es für `js/timer.js`/`js/ui.js` schon länger bewusst nicht tut), bleibt exakt
  das alte Verhalten (Feature an) erhalten. `tests/test.html` lädt `js/settings.js`
  trotzdem mit (um die Flag-Logik selbst zu testen), setzt aber direkt nach dem Laden via
  `Object.assign(PZ.FLAGS, {...alle: true})` eine „Alles an"-Baseline für die gesamte
  restliche Testsuite — sonst hätte allein der neue Default `freezeHint:false` den
  bestehenden Einfrier-Hinweis-Test gebrochen.

- **Neue Test-Sektion „18 · Feature-Flags / Einstellungen-Menü"** (`tests/test.html`):
  Default-Werte, Merge-/Vorwärtskompatibilitäts-Verhalten (`PZ._mergeFlags()`, ein für
  Tests exponierter reiner Merge-Helper ohne localStorage/DOM), Persistenz von
  `setFlag()` (mit Backup/Restore des echten localStorage-Stands, analog zu den
  Storage-/Share-Tests), Render-Effekt auf `buildGuide()` (`.timerbox`/„Einfrieren
  möglich" erscheinen/verschwinden je nach Flag) und auf `applyFlags()` (drei neue
  Stub-Elemente `#recipesCard`/`#shareBlock`/`#shoppingRow` im `#stubs`-Block von
  `tests/test.html`, geprüft auf `display:none` vs. sichtbar). Alle **331 Prüfungen**
  bestehen (vorher 311 + 20 neue), verifiziert per Headless-Edge-Dump.

- **Accessibility-Nachaudit (gezielt, `accessibility-expert`-Agent):** keine Blocker/
  Major/Minor-Funde. Native Checkbox+Label-Verknüpfung braucht kein zusätzliches ARIA,
  Tab-Reihenfolge/Fokusring unauffällig (kein `outline:none` auf Checkboxen), Kontrast
  `.switch-row`-Text ~14,7:1 (weit über AA). Kein Live-Region-Fix für die verschwindenden
  Blöcke nötig (4.1.3 greift hier nicht — der native `checked`-Zustand der Checkbox selbst
  ist die direkt am fokussierten Element ablesbare Bestätigung, und der Label-Text jeder
  Checkbox benennt bereits, welchen Bereich sie steuert). Card-Titel-Muster (`aria-label`
  aus v3.13.0) korrekt übernommen.

- **Nicht angefasst:** Berechnungslogik (`js/calc.js`, `js/schedule.js`) komplett
  unverändert — das Einstellungen-Menü schaltet ausschließlich Anzeige/Rendering,
  nie eine Bäckerprozent- oder Zeitrechnung.

## Feature-Flag „hints" — Tooltip-/Hinweistexte optional abschaltbar (v3.17.0)

Direkter Nutzerwunsch (Erweiterung des Einstellungen-Menüs aus v3.16.0 um einen 7. Flag):
„Auch die ganzen ToolTip Hinweise würde ich gerne als Optional in die Featureliste
aufnehmen lassen." Vor der Umsetzung wurden systematisch **alle** `.hint`-Vorkommen im
Projekt gesichtet (`grep` nach `class="hint"`, `.hint{`, `hint(` in HTML/CSS/JS), um klar
abzugrenzen, was unter den neuen Flag fällt:

- **Eingeschlossen** (reine Erklär-/Zusatztexte, kein Pflichtinhalt): alle `.field .hint`-
  Sätze unter Reglern (z. B. „Napoli-Standard: 2,5–3 %…", „Maschine erzeugt Reibungswärme…"),
  `#presetDesc`, `#recipeHint`, `#methodHint`, `#prefHint`, `#prefStageHint`, `#yeastHint`,
  `#timeHint`, der Intro-Satz der Einstellungen-Card selbst, `#shareHint` (Teilen-Link-
  Erklärung), sowie die dynamisch erzeugten `js/timer.js`-Elemente `.timerhint` (einmaliger
  Toast „Der Timer läuft nur, solange dieser Tab geöffnet ist…") und `.timersys-hint`
  (Erklärung neben den Android-/Kalender-Wecker-Links).
- **Bewusst ausgeschlossen** (dokumentiert wie vom Nutzer gewünscht, mit Begründung):
  - `#guideSummary` (die Zusammenfassungszeile über der Anleitung, z. B. „Direkt · Napoli ·
    62% Hydration") trug zwar `class="hint"`, hatte aber **nie** eine passende CSS-Regel
    (nur `.field .hint` existiert, `#guideSummary` liegt außerhalb eines `.field`) — die
    Klasse war rein kosmetisch tot. In dieser Session entfernt (keine visuelle Änderung)
    und bewusst NICHT unter den neuen Flag gestellt: es ist Funktions-/Statustext (aktueller
    Rezept-Zustand), keine optionale Erklärung.
  - `.tip`/`.warn`-Textblöcke innerhalb der Anleitungsschritte (`js/guide.js`, z. B. die
    💡/⚠️-Hinweise zu Autolyse, Öl-Zugabe, Salz-Reihenfolge) — anderer CSS-Klassenname
    (`.tip`/`.warn`, nicht `.hint`), tiefer in die eigentliche Schritt-für-Schritt-Anleitung
    verwoben (viele bestehende String-Matching-Tests, Sektionen 10/11/12), und inhaltlich
    eher **Anleitungsbestandteil** als optionaler Tooltip. Nicht Teil dieses Flags.
  - `#flourWarn` (Mehl-Warnung) — `.warn`-Klasse, funktional/actionable, keine Erklärung.

- **Ein globaler Schalter statt Dutzender Einzel-Elemente:** `PZ.applyFlags()`
  (`js/settings.js`) setzt `document.body.classList.toggle('hints-off', !PZ.FLAGS.hints)`.
  Neue CSS-Regel (`css/styles.css`, nach `.field .hint`):
  ```
  body.hints-off .hint,
  body.hints-off .timersys-hint,
  body.hints-off .timerhint{display:none;}
  ```
  Höhere Spezifität (`body` + 2 Klassen) als `.field .hint` (nur 2 Klassen) — überschreibt
  zuverlässig unabhängig von der Reihenfolge im Stylesheet.
- **Default AN** (anders als `timerSystem`/`shopping`/`freezeHint`): reine Erklärhilfen sind
  für neue Nutzer wertvoll, erfahrene Nutzer können bewusst abschalten — kein Grund
  gefunden, der einen anderen Default rechtfertigen würde.
- **Elemente bleiben immer im DOM, auch wenn `hints=false`** — nur `display:none`, nie
  entfernt. Wichtig für zwei bestehende `aria-describedby`-Fälle: `#shareLinkBtn` →
  `aria-describedby="shareHint"` und die beiden System-Wecker-Links → `aria-describedby="timersys-hint-<key>"`
  (`js/timer.js`). Damit zeigt die Referenz **nie** auf eine nicht-existente ID.
- Neue Checkbox `#flagHints` („Tooltip-/Hinweistexte (Erklärungen bei Feldern & Buttons)")
  in beiden Settings-Cards (Desktop + Mobil), identisches `<label class="switch-row">`-
  Muster wie die 6 bestehenden Flags.

**Test-Sektion „18 · Feature-Flags" erweitert** (`tests/test.html`): Default-Wert (`hints:
true`), sowie ein neuer Render-Effekt-Block mit zwei Stub-Elementen im `#stubs`-Block
(`#testHintStub` mit `class="hint"`, `#testDescribedBtn` mit `aria-describedby="testHintStub"`)
— geprüft wird: `hints=false` setzt `body.hints-off`, blendet den Stub per `getComputedStyle`
(`display:none`) aus, das Element bleibt im DOM (`getElementById` findet es weiterhin),
die `aria-describedby`-Referenz löst weiterhin zu einem existierenden Element auf, und
`hints=true` macht alles wieder rückgängig. Da `tests/test.html` bewusst kein echtes
App-Stylesheet lädt (reine Rechenlogik-Tests, eigenes minimales Test-Runner-CSS), enthält
die Datei eine 1:1-Kopie der `body.hints-off`-CSS-Regel nur für diesen DOM-Effekt-Test.
**338 Prüfungen** bestehen (vorher 331 + 7 neue), verifiziert per Headless-Edge-Dump.

**Accessibility-Nachaudit (gezielt, `accessibility-expert`-Agent):** keine Blocker/Major-
Funde. Kernfrage war, ob `aria-describedby` auf ein per `display:none` verstecktes Ziel
(`#shareHint`, `timersys-hint-<key>`) problematisch ist — Ergebnis: die WAI-ARIA
Accessible-Name-and-Description-Computation sieht für **direkt per IDREF referenzierte**
Knoten explizit eine Ausnahme von der „hidden wird ignoriert"-Regel vor; reale AT-
Unterstützung dafür ist zwar uneinheitlich, erzeugt aber in keinem Fall eine Asymmetrie
zwischen sehenden und nicht-sehenden Nutzern (entweder beide behalten die Beschreibung,
oder beide verlieren sie — nie „stumme Beschreibung wo vorher eine echte stand"). Ebenfalls
geprüft: alle Regler bleiben unabhängig vom `hints`-Flag über ihr eigenes
`aria-labelledby` benannt (Hint-Text ist nie die einzige Benennungsquelle), `#guideSummary`-
Abgrenzung ist sinnvoll, neue Checkbox folgt unauffällig dem etablierten `.switch-row`-Muster.
Keine Code-Änderung durch den Audit nötig.

**Nicht angefasst:** Berechnungslogik (`js/calc.js`, `js/schedule.js`) unverändert.

## Mögliche nächste Schritte (offen / Ideen)

- ~~**Glossar-Artikelbilder (Bild-Einbau Zyklus 3, Rest)**~~ — **erledigt in v4.37.0**
  (s. „= aktueller Stand" oben). 33 von 38 Artikeln bebildert, Zyklus 3 aus
  `BILD-EINBAU-KONZEPT.md` damit komplett abgeschlossen. ~~Nachbesserung: die 33 Bilder
  fehlten dadurch auf dem echten iPhone (Standalone-Build)~~ — **erledigt in v4.38.1**
  (s. „= aktueller Stand" oben), kleinere 600×400-Zweitfassung nur fürs Embedding.
- **Neu (v4.37.0): 5 Glossar-Artikel weiterhin ohne Bild.** `biga`/`belagCapricciosa`
  haben kein fertiges Bild in `assets/img/` (nur lose Arbeitsstände unter `assets/`,
  außerhalb des App-Bild-Workflows). `belagNachDemBacken`/`belagQuattroFormaggi`/
  `sfincione` haben eine fertige Datei, wurden aber vom Nutzer während des v4.37.0-Zyklus
  per Direktanweisung gesperrt (`GLOSSARY_ARTICLE_BLOCKLIST`, `js/images.js`) — Grund
  nicht dokumentiert, ggf. beim Nutzer nachfragen, falls das für einen künftigen Zyklus
  relevant wird. Freigabe/Ergänzung ist eine reine Registeränderung (Id aus der
  Blockliste entfernen bzw. Bild erzeugen + Id zu `GLOSSARY_ARTICLE_IDS_WITH_FILE`
  hinzufügen), kein neuer Code-Zyklus nötig.
- **Zurück-Weg vom Regal, wenn ein Filter/Zustand aktiv war** (Nebenbefund, v4.36.0,
  kein Bug): der Zurück-Weg ins Regal setzt aktuell keinen Scroll-Zustand zurück — bei
  sehr langen Kategorien könnte ein Nutzer nach „Zurück" auf einer Regal-Position
  landen, die nicht der ursprünglichen entspricht (kein Scroll-Reset). Sehr geringe
  praktische Relevanz (Regal ist selten länger als eine Bildschirmhöhe), nur zur
  Kenntnis, kein Handlungsbedarf.
- ~~**Schrittbilder auf modernen 3x-Displays weiterhin unscharf beim Aufklappen**~~ —
  **erledigt in v4.35.2** (s. „= aktueller Stand" oben): Originale aus dem Git-Verlauf
  zurückgeholt, Quellauflösung verdoppelt (300x224 → 600x448), Deckel wirkt jetzt nur noch
  als Sicherheitsnetz statt aktiv fast immer einzugreifen.
- **Weitere Nebenbefunde aus dem v4.35.1-Bugfix-Zyklus** (kein Blocker):
  - **Zwei Anleitungstitel bleiben bei 375px mehrzeilig, unabhängig vom Chip-Fix:**
    „Schüttwasser temperieren" und „Teigtemperatur prüfen" (beide MIT Bildband, dadurch nur
    ~168px statt ~245px verfügbare Titelbreite) sind rein längenbedingt zweizeilig, kein
    Chip beteiligt. Bei 320px sind es sogar 11 von 15 Titeln (reines Platzproblem auf sehr
    schmalen/alten Geräten wie iPhone SE 1./2. Generation). Kandidat für einen künftigen
    Layout-Zyklus (z. B. schmaleres Bildband, kleinere Titel-Schrift ab einem Breakpoint),
    falls das stört — noch nicht spezifiziert.
  - **Lücke unter dem Bildband bei sehr hohen, extras-lastigen aufgeklappten Karten:**
    bereits mit einem dezenten `border-bottom` entschärft (s. „= aktueller Stand" oben),
    aber die Lücke selbst (bis zu ~415px einfarbige Fläche unter dem Bild) besteht
    strukturell weiter. Mögliche künftige Richtung: Deckel-Faktor für sehr hohe Karten
    großzügiger fassen (Kompromiss Schärfe/Lücke), falls der Trenner allein nicht reicht.
- **Nebenbefunde aus dem v4.32.0-`accessibility-expert`-/`mobile-optimizer`-Review des
  Preset-Kartengitters** (Blocker + MAJOR 2/3 direkt im selben Zyklus behoben, s. „=
  aktueller Stand" oben — hier nur die bewusst zurückgestellten Punkte):
  - **A11y MAJOR 1 (app-weite Musterfrage, nicht kartenspezifisch):** `role="group"` +
    `aria-pressed` auf den 9 `.preset-card`-Buttons beschreibt streng genommen eine Gruppe
    unabhängiger Umschalter, nicht eine „eins aus neun"-Auswahl — dafür wäre
    `role="radiogroup"`/`role="radio"`/`aria-checked` das genauere Muster. Bewusst NICHT
    geändert: identisch zum bestehenden Muster der App-Segmentschalter (`.seg button`,
    ebenfalls `aria-pressed` statt `radiogroup`) — ein Wechsel nur hier hätte zwei
    unterschiedliche Auswahlmuster nebeneinander erzeugt. Kandidat für einen künftigen,
    app-weiten Zyklus, der beide Stellen gemeinsam umstellt, falls gewünscht.
  - **A11y MINOR 1:** `syncPresetCardSelection()` (`js/presets.js`) hält den sichtbaren
    `aria-pressed`-Zustand nur bei `#preset`-`change`-Events sowie den beiden Stepper-
    Feld-Stellen nach, die `#preset.value` manuell zurücksetzen, aktuell auf dem Laufenden.
    Strukturelles Risiko für künftigen Code, der `#preset.value` an neuer Stelle ohne
    Event setzt (bliebe dann optisch veraltet) — kein aktuell nachweisbarer Fehler.
  - **A11y MINOR 2:** Touch-Ziele der Karten bei extremem Browser-Zoom theoretisch knapp,
    praktisch unkritisch.
  - **Mobile MINOR 4:** Karten-Bilder sind mit 600×400 px aufbereitet, angezeigt aber nur
    mit rund 135–150 px Breite — ein `srcset`/eine kleinere Zielgröße wäre sparsamer.
    Bewusst nicht in diesem Zyklus (Gewichtsziel für die 10 verdrahteten Dateien mit ~428
    KB bereits deutlich unter der ~2-MB-Zielmarke erreicht, s. „= aktueller Stand" oben).
- ~~Napoli Lange Kaltgare an Quellen angleichen~~ — **erledigt in v4.30.0** (kein Backlog-
  Punkt im engeren Sinne, direkter Nutzerauftrag mit fertiger 7-Quellen-Prüfung; s.
  „= aktueller Stand" oben). `napoli_kalt`-Hefe 0,1 % → 0,25 %, geteilte Kaltgare (~44 h)
  über `scheduleOverride`.
- ~~Teglia- und New-York-Style-Teigwerte an Quellen korrigieren~~ — **Öl/Zucker-Teil
  erledigt in v4.26.0** (kein Backlog-Punkt im engeren Sinne mehr, direkter Nutzerauftrag
  mit fertiger Quellenprüfung; s. „= aktueller Stand" oben). `teglia`-Öl 4 % → 2,5 %,
  `newyork_style`-Öl 3 % → 1,5 % und Zucker 2 % → 1 %.
- ~~Hefe-/Gärzeit-Kopplung bei Direktführung entkoppeln~~ — **Hefe-/Gärzeit-Teil erledigt
  in v4.28.0** (kein Backlog-Punkt im engeren Sinne mehr, direkter Nutzerauftrag mit
  fertiger Quellenprüfung; s. „= aktueller Stand" oben). Statt eines kompletten
  Stufensystems (verworfen, s. HISTORIE) bekam `js/schedule.js` einen neuen, NUR von
  `js/presets.js` gesetzten `state.scheduleOverride`-Mechanismus: `newyork_style`
  (Hefe 0,2 % → 1,2 %, laut Feeling Foodish, jetzt ~44 h statt der generischen
  Schnellgare-Schwelle) und `teglia` (Hefe 0,3 % → 0,45 %, laut Manopasto/Salamico, jetzt
  ~76 h statt ~30 h). Der freie Hefe-Regler, alle fünf Pills und jedes manuelle Rezept
  bleiben unverändert an die vier generischen Schwellen gekoppelt.
  - ~~`teglia`-Teiglingsgewicht 320 g auf Blechflächen-Modell umstellen~~ — **erledigt in
    v4.29.0** (s. „= aktueller Stand" oben): `balls: 1, ballw: 600` (30×40-cm-Referenzblech,
    0,5 g/cm², drei Quellen), Anleitungstexte + Backzeit preset-gebunden umgeschaltet.
    Nachrichtlich, weiterhin offen: `teglia`-Hydration 75 % liegt am unteren Rand des
    Quellenbands (75–85 %) — kein Fehler, nur ausbaufähig.
    - **Bugfix v4.29.1** (noch am selben Tag gefunden): das neue `ballw: 600` wurde durch
      ein veraltetes `max="500"` an `#ballwN`/`#nrBallwN` in allen drei HTML-Dateien
      lautlos auf 500 gekappt (s. „= aktueller Stand" oben). Behoben, `max` jetzt `1000`.
  - **Neue Backlog-Idee aus v4.28.0:** `state.scheduleOverride` könnte künftig als
    optionaler manueller Umschalter exponiert werden (eigener Regler/Toggle in der UI),
    falls der Nutzer auch außerhalb dieser zwei Presets einen festen statt einen aus der
    Hefemenge abgeleiteten Fahrplan wählen möchte — bewusst NICHT in v4.28.0 umgesetzt
    (Scope-Grenze im Auftrag), reine Idee für einen möglichen künftigen Zyklus.
- **Preset-Beschreibung: unverlinkter Glossar-Verweis** (Nebenbefund,
  `accessibility-expert`-Review v4.25.1, MINOR, kein WCAG-Verstoß):
  `preset.napoliKlassisch.desc` erwähnt jetzt textlich das Glossar „Echte neapolitanische
  Pizza (AVPN)", aber
  `presetDesc` wird bewusst per `textContent` gesetzt (`js/presets.js`, damit ein
  Sprachwechsel den Text live nachzieht) — kein klickbarer Link möglich, ohne auf `innerHTML`
  umzustellen (eigene Escaping-Frage). Optionale spätere Verbesserung, kein Mangel; könnte
  sich am bestehenden `inlineGlossaryLink()`-Muster (`js/guide.js`) orientieren.
- ~~AVPN-Aussage entschärft + Preset-Zeitangaben korrigiert~~ — **erledigt in v4.25.1** (kein
  Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag mit fertiger Quellenprüfung; s.
  „= aktueller Stand" oben). `preset.napoliKlassisch.desc` behauptet nicht mehr, das Öl sei
  Teil des AVPN-Standards; alle fünf Zeitangaben-Labels sind jetzt aus `PZ.calc()`
  nachgemessen statt geschätzt.
- ~~Biga-Stufenwerte aus Quellenrecherche ableiten~~ — **erledigt in v4.25.0** (kein
  Backlog-Punkt im engeren Sinne mehr, direkter Nutzerauftrag mit fertiger Quellenrecherche;
  s. „= aktueller Stand" oben). `b16`/`b24`/`b48` (0,4/0,3/0,2 %, `rel:'total'`) ersetzt
  durch `b_klassisch`/`b_kalt` (je 1,0 %, `rel:'pref'`, aus 12 Quellen abgeleitet).
- ~~Temperaturabhängige Reifezeit statt fester Stundenzahl~~ — **erledigt in v4.27.0** (kein
  Backlog-Punkt im engeren Sinne mehr, direkter Nutzerauftrag mit fertiger Quellenlage;
  s. „= aktueller Stand" oben). In v4.24.0 noch verworfen (nur eine dünne Quelle), seither
  bessere Beleglage gefunden (Weekend Bakery + PizzaPlan, unabhängig übereinstimmend) —
  betrifft aber nur die Raumtemperatur-Skalierung bei Direktführung, NICHT die vier
  Hefemenge-Schwellen selbst (die bleiben unbelegt-aber-unverändert) und NICHT die
  Vorteig-Reifestufen (Biga/Poolish bleiben komplett unangetastet).
- ~~Nebenbefund aus dem v4.27.0-`accessibility-expert`-Review: `#guideSteps`-Live-Region-
  Ansage~~ — **erledigt in v4.31.0** (s. „= aktueller Stand" oben). Eigene, visuell
  versteckte Live-Region `#guideAnnounce` mit entprellter Sammelansage „Anleitung
  aktualisiert", statt `#flourWarn` wiederzuverwenden oder `#guideSteps` selbst live zu
  schalten.
- **Type-ahead-Kette im `#preset`-Dropdown wird länger** (Nebenbefund aus dem
  v4.24.0-`accessibility-expert`-Review, kein Blocker, keine Regression; seit v4.25.0 durch
  die Biga-Aufteilung um einen weiteren Eintrag gewachsen): alle „Napoli …"-Optionen
  (`napoli_klassisch`, `napoli_kalt`, `napoli_biga_klassisch`, `napoli_biga_kalt`,
  `napoli_poolish_schnell`, `napoli_poolish_kalt`) teilen sich denselben Anfangstext, native
  `<select>`-Sprungnavigation per Tastatur (Type-ahead) kann deshalb nicht direkt auf eine
  einzelne Option springen, sondern muss durchtabben. Bestand schon vorher (4 Optionen mit
  „Napoli …"-Präfix), durch die Aufteilung von je einer auf zwei Poolish- (v4.24.0) und
  Biga-Optionen (v4.25.0) auf inzwischen 6 Einträge gewachsen. Kein Handlungsbedarf, nur zur
  Kenntnis.
- **Visuelles Redesign: Foto-Hero + Card-Elevation** (noch nicht spezifiziert,
  aus einer vom Nutzer geteilten Design-Analyse/Ooini-Vergleich): eigene
  Pizza-/Teig-Fotos als Hintergrund für Rezeptkarten, größere Typografie-
  Hierarchie, mehr Whitespace zwischen Sektionen, aktiver Nav-Tab mit
  gefülltem Farbchip statt reiner Textfarbe. Größerer, mehrschrittiger Umbau
  (Bilder beschaffen/lizenzieren, Card-Komponente umbauen, Farbsystem
  anpassen) — braucht eine eigene `/define-feature`-Runde, kein Sofort-Fix.
  Die kleine Teilmaßnahme daraus (Card-Elevation) ist bereits erledigt, s.
  „Card-Design: Elevation statt Outline (v4.22.0)" oben.
- ~~Hintergrund-Farbverlauf kräftiger/wärmer~~ — **erledigt in v4.21.0** (kein
  Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag per `/define-feature`;
  s. Abschnitt „Hintergrund-Farbverlauf kräftiger/wärmer (v4.21.0)" oben).
  `--bg-gradient` ist jetzt ein kräftigerer, warmtoniger radialer Lichtschein
  statt des kaum sichtbaren linearen v4.13.0-Verlaufs.
- **Nebenbefund aus dem v4.21.0-`accessibility-expert`-Review (kein Blocker, Hell-
  UND Dunkelmodus, app-weit, durch den kräftigeren Verlauf verstärkt sichtbar):**
  `.card`-Rand (`--line`) gegen die stärkste Stelle des neuen Verlaufs liegt nur
  bei ~2,0:1 (Hell, `--line #8c7b64` gegen `#dfa796`) bzw. ~2,2:1 (Dunkel,
  `--line #7a6e5f` gegen `#642e24`), unter der 3:1-Schwelle für UI-Komponenten-
  grenzen (WCAG 1.4.11). Bewusst nicht in diesem Zyklus behoben (Karte hat
  zusätzlich `box-shadow` + 3px `--tomato`-Akzentrand als weitere, unabhängige
  Abgrenzungshinweise; die meisten Karten sitzen ohnehin auf der flachen
  `--bg`-Basis mit komfortablen 3,4-3,9:1). Kandidat für einen künftigen,
  gezielten `--line`-Nachjustierungs-Zyklus, falls gewünscht.
- ~~Glossar-Verweis-Text kürzen~~ — **erledigt in v4.20.0** (kein Backlog-Punkt im
  engeren Sinne, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Glossar-Verweis-Text kürzen (v4.20.0)" oben). `guide.glossaryLink.label`
  (`js/i18n-dict.js`) ist jetzt `"{term} im Glossar"` statt `"Mehr zu {term} im
  Glossar"` — wirkt automatisch überall, wo der Glossar-Verweis-Link erscheint.
- ~~Desktop-Logo auf SVG umstellen~~ — **erledigt in v4.19.0** (kein Backlog-Punkt im
  engeren Sinne, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Desktop-Logo auf SVG umstellen (v4.19.0)" oben). `pizza-rechner.html`-Header nutzt
  jetzt dasselbe `assets/logo.svg` wie Mobil statt des 🍕-Emojis.
- ~~Einführung prominent platzieren~~ — **erledigt in v4.18.0** (kein Backlog-Punkt im
  engeren Sinne, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Einführung
  prominent platzieren (v4.18.0)" oben). Eigene Karte ganz oben auf der Einstellungen-
  Seite (Desktop + Mobil), alter Eintrag (Burgermenü Desktop / Ende der „Funktionen"-
  Karte Mobil) entfernt.
- **Nebenbefund aus dem v4.17.0-`accessibility-expert`-Review (MAJOR, Dark-Mode, mobile
  Quick-Bar, vorbestehend, keine Regression):** `.quickbar .qb-jump small`
  (`rgba(255,255,255,.85)` auf `var(--tomato-dark)`) liegt im Dark-Mode bei ~4,3:1, knapp
  unter der 4,5:1-Text-Schwelle (WCAG 1.4.3) — selbst per WCAG-2.0-Luminanzformel
  nachgerechnet und bestätigt (Light-Mode ~5,0:1 ist unauffällig). Kandidat für einen
  kleinen, gezielten Folge-Fix (z. B. Deckkraft leicht erhöhen oder auf einen dunkleren
  Weißton wechseln), analog zu den bereits behobenen „Weiß auf --tomato"-Fällen aus v4.5.0.
- ~~Quick-Bar-Speichern-Button entfernen~~ — **erledigt in v4.17.0** (kein Backlog-Punkt im
  engeren Sinne, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Quick-Bar-
  Speichern-Button entfernen (v4.17.0)" oben). `#qbSave` war redundant zu `#saveBtn`.
- ~~Schüttwasser-Anzeige entfernen~~ — **erledigt in v4.16.0** (kein Backlog-Punkt im
  engeren Sinne, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Schüttwasser-Anzeige entfernen (v4.16.0)" oben). Die separate Wassertemperatur-/
  Schüttwasser-Box im Ergebnis-Panel ist weg, der Wert bleibt in der Anleitung.
- ~~Rezepte-Reiter fest aktivieren (Feature-Flag `multiRecipes` entfernen)~~ —
  **erledigt in v4.15.0** (kein Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag
  per `/define-feature`; s. Abschnitt „Rezepte-Reiter fest aktivieren (v4.15.0)"
  oben). Damit sind jetzt alle sechs ursprünglichen Feature-Flags aus v3.16.0 bis auf
  drei (`timer`, `timerSystem`, `hints`) entfernt.
- **Nebenbefund aus dem v4.14.0-Testen (nicht behoben, außerhalb des Scopes, sehr
  unwahrscheinlicher Real-World-Fall):** Single-Open-Akkordeon der Glossar-Artikel
  (`js/glossary.js`, seit v4.3.0) hat eine latente Race Condition — ein asynchron
  gequeuter `toggle`-Event einer ALTEN `<details>`-Instanz (aus einer vorherigen
  `renderGlossary()`-Generation) kann, wenn ein Sprachwechsel praktisch synchron auf
  einen Sprung via `gotoGlossaryEntry()` folgt, einen frisch gerenderten Artikel
  gleichen Namens wieder schließen. Kein realistischer Nutzerpfad (nur in einem
  synchronen Test-Skript ohne Verzögerung reproduzierbar), vom `accessibility-expert`
  zur Kenntnis genommen (kein WCAG-Bezug). Kandidat für einen künftigen, gezielten
  Fix (Listener beim Entfernen alter Elemente abmelden, oder Vergleich über
  `dataset.id` statt Objektidentität). S. `pizza-rechner-KONTEXT-HISTORIE.md`,
  Abschnitt „Glossar-Gruppierung (v4.14.0)".
- ~~Backlog.md Punkt H: Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (Akkordeon)~~
  — **erledigt in v4.10.0**: `.tip`/`.warn`-Boxen in der Anleitung sind jetzt standardmäßig
  eingeklappt (kompakter `.hint-toggle`-Button statt Volltext), App-weites Single-Open-
  Akkordeon über alle Schritte hinweg. Umgesetzt gegen die AKTUELLE Optik (Design-Import
  Zyklus 1-2), nicht gegen die im ursprünglichen Backlog-Text beschriebene alte Emoji-
  Farboptik. S. Abschnitt „Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (v4.10.0)"
  oben und `Backlog.md` Punkt H.
- ~~Backlog.md Punkt G: Info-Button bei "Verschwendung anpassen" wird vom "−"-Stepper-Button
  überdeckt~~ — **bereits gelöst, kein eigener Zyklus nötig** (Design-Import Zyklus 5,
  v4.4.0, hat den ursprünglich überlappenden Info-Button ersatzlos entfernt). S. `Backlog.md`
  Punkt G für die Live-Verifikation.
- ~~Backlog.md Punkt E: Bug untere Navigationsleiste rutscht hoch (iOS Safari)~~ —
  **umgesetzt in v4.9.1** (env()-Fallbacks, sticky-vs-fixed-Evaluation, Scroll-Nudge-
  Workaround in js/nav.js), **seit 2026-07-25 auf echtem iOS-Gerät bestätigt**, s. Abschnitt
  „Bottom-Nav iOS Safe-Area Fix (v4.9.1)" oben und `Backlog.md` Punkt E.
- ~~Design-System-Import Zyklus 5 von 5 (Einstellungen-Screen)~~ — **erledigt in v4.4.0**,
  letzter Schritt der mobilen Redesign-Reihe, damit **komplett abgeschlossen** (Zyklus 1 =
  Tokens + Rechner, v4.0.0; Zyklus 2 = Anleitung/Zeitplan, v4.1.0; Zyklus 3 = Pizza Party,
  v4.2.0; Zyklus 4 = Glossar, v4.3.0; Zyklus 5 = Einstellungen, v4.4.0). S. Abschnitt
  „Design-System-Import Zyklus 5: Einstellungen-Screen (v4.4.0)" oben.
- **Nebenbefund aus dem v4.4.0-`accessibility-expert`-Review (MINOR, Hellmodus, app-weit,
  vorbestehend, keine Regression, identischer Wert wie Zyklus 1):** `.seg button`
  inaktiver Text liegt bei ~4,43:1, knapp unter der 4,5:1-Text-Schwelle (WCAG 1.4.3).
  Betrifft alle `.seg`-Instanzen app-weit. Kandidat für einen kleinen, gezielten Folge-Fix
  (Text dunkler als `--muted`, oder Hintergrund heller).
- **Nebenbefund aus dem v4.2.0-`accessibility-expert`-Review (MAJOR, Hellmodus, app-weit,
  vorbestehend, keine Regression):** `.note`-Rahmen (`var(--crust)` gegen `var(--note-bg)`)
  liegt bei ~2,33-2,49:1, unter der 3:1-Schwelle (WCAG 1.4.11). Betrifft alle `.note`-
  Instanzen app-weit (Eiswasser-/DDT-Notizen, seit v4.2.0 auch der Party-Genauigkeits-
  Hinweis), nicht neu durch diesen Zyklus. Fix bräuchte eine `--crust`-Wertänderung
  app-weit (betrifft auch `.temp-box`/`.timerclock`/Schedbar-Rahmen) — Kandidat für einen
  eigenen, künftigen Kontrast-Zyklus, analog zum inzwischen (v4.5.0) behobenen
  `--line`-Nebenbefund aus Zyklus 1.
- ~~Wachsende Nebenbefund-Familie „Weiß auf `--tomato`-Text im Dunkelmodus"~~ —
  **erledigt in v4.5.0**: alle 10 gefundenen Text-auf-Tomate-Stellen app-weit
  (`.onboarding-cta`, `.stepper-btn:hover`, `.seg button.active`, `.pills button.active`,
  `.info-btn[aria-expanded="true"]`, `.actions button.primary`, `.timerbtn-start`,
  `.timerdone`, mobile `.quickbar .qb-save`, `.calc-subnav .nav-item.active`) auf
  `var(--tomato-dark)` umgestellt (~5,38:1 dunkel statt ~4,19:1). S. Abschnitt
  „Ergebnis priorisieren + Kontrast-Fixes (v4.5.0)" oben.
- ~~Backlog.md Punkt B: "Teilen-Link"/"Einkaufsliste" aus Einstellungen entfernen~~ —
  **erledigt in v4.6.0**: beide Feature-Flags samt Menüpunkten entfernt, „Rezept teilen"/
  „Einkaufsliste drucken" (+„Als PDF speichern", teilte sich bislang das Flag) sind seither
  permanent verfügbar. S. Abschnitt „„Teilen-Link"/„Einkaufsliste" aus Einstellungen
  entfernt (v4.6.0)" oben.
- ~~Backlog.md Punkt C: "New York Style"-Einstellung entfernen, Zuckerfeld wertbasiert~~ —
  **erledigt in v4.7.0**: Feature-Flag `newYorkStyle` samt Menüpunkt entfernt, `#sugarBlock`
  ist seither rein wertbasiert (`state.sugar > 0`). Neuer Backlog-Nebenbefund aus dem
  begleitenden `accessibility-expert`-Review: `Backlog.md` Punkt J (Fokus-Verlust bei
  `.collapse`/`.show`-Feldern, app-weites Bestandsmuster). S. Abschnitt „„New York
  Style"-Einstellung entfernt, Zuckerfeld wertbasiert (v4.7.0)" oben.
- ~~Backlog.md Punkt J: Fokus-Verlust bei dynamisch ausgeblendeten Feldern
  (`.collapse`/`.show`-Muster, WCAG 2.4.3)~~ — **erledigt in v4.12.0**: neuer Helfer
  `PZ.moveFocusBeforeHide()`/`PZ.toggleCollapse()` (`js/dom.js`), eingebaut in `#sugarBlock`,
  `#prefBlock`/`#bigaHydBlock`/`#prefStageBlock` und im „Neues Rezept anlegen"-Formular.
  MINOR mit erledigt: Zucker-Pills-`aria-label`. S. Abschnitt „Fokus-Erhalt bei
  .collapse/.show-Feldern (v4.12.0)" oben und `Backlog.md` Punkt J.
- ~~Backlog.md Punkt D: Einfrier-Hinweis aus Anleitung/Einstellungen entfernen, Glossar-
  Artikel "Einfrieren" erstellen~~ — **erledigt in v4.8.0**: Einfrier-Hinweisbox (Schritt
  „Teiglinge formen") und Feature-Flag `freezeHint` samt Menüpunkt entfernt, Inhalt lebt
  als neuer Glossar-Artikel „Einfrieren" weiter (per Glossar-Verweis vom Anleitungsschritt
  aus verlinkt). S. Abschnitt „Einfrier-Hinweis entfernt, Glossar-Artikel „Einfrieren"
  (v4.8.0)" oben.
- ~~Backlog.md Punkt A: Inline-Verlinkung von Glossar-Begriffen im Anleitungstext~~ —
  **erledigt in v4.9.0**: erstes wörtliches Vorkommen eines Glossar-Artikeltitels im
  Schritt-Text wird jetzt zum Inline-Link (Biga/Poolish/Autolyse), separater Zeilenlink
  bleibt Fallback für die restlichen 5 Begriffe ohne wörtliches Vorkommen. S. Abschnitt
  „Inline-Verlinkung von Glossar-Begriffen im Anleitungstext (v4.9.0)" oben.
- ~~Backlog.md Punkt 2 „Rahmen-Fix Komplexitätsschalter"~~ — **erledigt als Nebeneffekt
  von v4.0.0** (Design-System-Import Zyklus 1): `.seg` nutzt jetzt `--surface-2` +
  sichtbaren `1px solid var(--line)`-Rahmen statt der bisherigen, identisch zum
  Seitenhintergrund gefärbten Fläche. Betrifft alle `.seg`-Instanzen app-weit, nicht
  nur den Komplexitätsschalter. **Backlog.md Punkt 1 „Ergebnis priorisieren" ist seit
  v4.5.0 ebenfalls erledigt** (s. Abschnitt oben).
- ~~Nebenbefund aus v4.0.0 (Design-System-Import Zyklus 1): `--line` gegen `--bg`/`--card`~~
  — **erledigt in v4.5.0**: `--line` in beiden Themes nachgedunkelt (Hell) bzw.
  aufgehellt (Dunkel), jetzt ≥3:1 gegen `--bg` UND `--card` (WCAG 1.4.11). Die
  Flächenkontraste zwischen benachbarten neutralen Oberflächen (`--card` vs. `--bg`
  ~1,13:1 usw.) bleiben bewusst unverändert (tonale Design-Philosophie, kein
  UI-Komponenten-Rahmen im engeren Sinne). S. Abschnitt „Ergebnis priorisieren +
  Kontrast-Fixes (v4.5.0)" oben.
- ~~Bugfix: Glossar-Verweise doppelt + Icon-Ausrichtung versetzt~~ — **erledigt in
  v3.69.1** (kein Backlog-Punkt, live reproduzierter Bugfix-Auftrag direkt an den
  Orchestrator; s. `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Glossar-Verweise:
  Dedup + Icon-Ausrichtung (v3.69.1)").
- ~~Doku-Debt: zwei stale Verweise/Tags in dieser Datei~~ — **erledigt in v3.70.0**:
  veraltetes zweites „= aktueller Stand"-Tag beim Abschnitt „Feature-Flag „hints"…"
  (v3.17.0) entfernt; stale Verweis im Zucker-Feld/New-York-Style-Abschnitt auf eine
  bereits nach HISTORIE ausgelagerte Zwischenüberschrift korrigiert (zeigt jetzt auf
  `pizza-rechner-KONTEXT-HISTORIE.md`).
- ~~UX-Review "Teigmeister", Punkt 1: Mengensteuerung vereinfachen~~ — **erledigt in
  v3.70.0** (kein Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag über den
  Orchestrator; s. Abschnitt „Mengensteuerung vereinfachen (v3.70.0)" oben).
- **Nebenbefund aus dem v3.69.1-`accessibility-expert`-Review:** Kontrast von
  `.step .body .glossary-ref`-Text (`color:var(--muted)`, ~3,2:1) liegt unter der
  WCAG-1.4.3-Schwelle 4,5:1 für Fließtext — vorbestehend seit v3.68.0, nicht durch
  v3.69.1 verursacht, bewusst außerhalb des Bugfix-Scopes gelassen. Kandidat für einen
  kleinen, gezielten Folge-Fix (z. B. `var(--step-text)` statt `--muted`).
- **Nebenbefund aus dem v3.70.0-`accessibility-expert`-Review (MINOR, unverändert seit
  jeher, kein neues Problem):** `.pills button` hat weiterhin kein `aria-label`/
  `aria-describedby` (Screenreader sagt bei Zahlen-Chips wie „250" nur „button 250" statt
  „250 Gramm"). Betrifft alle `.pills`-Instanzen app-weit, nicht auf die neuen
  Mengensteuerung-Chips beschränkt. Kandidat für einen kleinen, gezielten Folge-Fix.
- ~~UX-Review "Teigmeister", Punkt 2: Rezeptwahl führen~~ — **erledigt in v3.71.0** (kein
  Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag über den Orchestrator; s.
  Abschnitt „Rezeptwahl führen (v3.71.0)" oben).
- **Nebenbefund aus dem v3.71.0-`accessibility-expert`-Review (MAJOR 2, Bestandsmuster
  von vor diesem Zyklus, keine Regression):** `<select id="preset">` hat nur ein
  dynamisches `aria-label` (per i18n gesetzt), keine statische `<label for="preset">`.
  Funktioniert, aber etwas fragiler falls die i18n-Attribut-Zuweisung zur Laufzeit
  verzögert/fehlschlägt. Kandidat für einen kleinen Folge-Fix (visuell verstecktes
  `<label for="preset">` ergänzen).
- **3 MINOR-Nebenbefunde aus dem v3.71.0-`accessibility-expert`-Review (kosmetisch/
  optional):** `.preset-card`-Touch-Ziel bei sehr schmalen Viewports (~320px) rechnerisch
  knapp über 44px (optionaler `@media`-Umbruch auf 2 Karten pro Zeile denkbar);
  `<summary>` „Alle Rezepte" ohne explizit mitgeführtes `aria-expanded` (native
  `<details>`-Semantik reicht laut Review, rein optionale Verbesserung); Fokus-Ring der
  `<summary>` könnte auf Mobil von der Sticky-Quickbar knapp verdeckt werden (nicht sicher
  reproduzierbar, `scrollIntoView()`-Idee als möglicher Folge-Fix).
- ~~UX-Review "Teigmeister", Punkt 3: Komplexität staffeln~~ — **erledigt in v3.72.0**
  (kein Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag über den Orchestrator; s.
  Abschnitt „Komplexität staffeln (v3.72.0)" oben).
- **Nebenbefund aus dem v3.72.0-`accessibility-expert`-Review (MAJOR 2, Backlog, app-weit,
  keine Regression):** keine Pfeiltasten-Navigation (Links/Rechts) für `.seg`-Toggle-
  Gruppen (ARIA Authoring Practices legen das für `role="group"` + `aria-pressed"` nahe).
  Betrifft ALLE `.seg`-Elemente app-weit (Teigführung, Hefe-Art, Knetart, Kaltgare-Stufe,
  Zeitplan-Modus, der neue Komplexitäts-Schalter), nicht neu durch dieses Feature.
  Kandidat für einen größeren, eigenständigen Folge-Zyklus (App-weiter Arrow-Key-Handler).
- **Nebenbefund aus dem v3.72.0-`accessibility-expert`-Review (MINOR, vorbestehend,
  app-weit):** Kontrast des inaktiven `.seg`/`.pills`-Buttons (~2,5:1, unter der
  3:1-Schwelle für UI-Komponenten). Kandidat für einen kleinen, gezielten Folge-Fix.
- ~~UX-Review "Teigmeister", letzter Punkt 4: Ergebnis priorisieren~~ — **erledigt in
  v4.5.0** (Aktionsleiste der Ergebniskarte neu geordnet: „Zum Zeitplan" primär, „Rezept
  teilen" sekundär, Rest in „Weitere Optionen" eingeklappt, Desktop + Mobil; s. Abschnitt
  „Ergebnis priorisieren + Kontrast-Fixes (v4.5.0)" oben). Damit ist die gesamte
  UX-Review-„Teigmeister"-Reihe (Punkt 1-4) abgeschlossen.
- **Foto-Anleitung (Fotos je Schritt):** Schritt-für-Schritt-Anleitung um Fotos je
  Schritt ergänzen (z. B. Autolyse, Kneten, Salz zugeben), analog einer Referenz-App,
  die der Nutzer per Screenshot gezeigt hat. Noch nicht spezifiziert (Bildquelle offen:
  generische Stock-/Illustrationsbilder pro Schritt-Typ vs. Aufwand, ob sie zu allen
  Methoden/Presets passen). Braucht vor Umsetzung eine eigene `/define-feature`-Runde.
  (Als Backlog-Notiz vom Nutzer nachgetragen, 2026-07-22, noch kein eigener Zyklus dafür
  gestartet.)
- ~~Foto der fertigen Pizza am Ende der Anleitung~~ — **erledigt in v3.69.0** (kein
  Backlog-Punkt im engeren Sinne mehr, über `/define-feature` abgestimmter
  Nutzerauftrag; s. Abschnitt „Foto der fertigen Pizza am Ende der Anleitung (v3.69.0)"
  oben). Abschließender Anleitungsschritt „Fertig!" mit Foto passend zur Pizzaform
  (Zuordnung über `#preset`-Dropdown-Wert), Base64-Einbettung im Standalone-Build.
- ~~Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)~~ —
  **erledigt in v3.20.0**: eigener Mehltemperatur-Regler (`#flourTemp`), Default =
  Raumtemperatur, danach unabhängig änderbar; DDT-Formel nutzt beide Werte statt
  Raumtemperatur doppelt (s. Abschnitt oben)
- ~~Zucker-Feld (New York Style)~~ — **erledigt in v3.19.2**: Zucker-Regler als
  Bäckerprozent (wie Öl), neues 8. Preset „New York Style" + flag-gated Sichtbarkeit
  (s. Abschnitt oben)
- ~~Einkaufsliste generieren; Druck nur für die Anleitung~~ — **erledigt in v3.9.0**
- ~~Gärzeit-Timer / Wecker~~ — **erledigt in v3.11.0**; System-Wecker/Kalender-Anbindung
  (Android-Intent + .ics-Kalendererinnerung als iOS-Ersatz, da keine offizielle Web-API
  existiert) **ergänzt in v3.15.0**
- ~~Teilen-Link (State als Base64-JSON in der URL)~~ — **erledigt in v3.14.0**; Export
  als PDF war damals bewusst nicht mitgebaut (Nutzer wollte nur den reinen Teilen-Link)
  — **jetzt eigenständig nachgeholt in v3.25.0** (s. u.)
- ~~Mehrere gespeicherte Rezepte (statt einem localStorage-Slot)~~ — **erledigt in v3.10.0**
- ~~Mobil-Overflow bei sehr schmalen Viewports (~430 px)~~ — **untersucht/gehärtet in
  v3.13.1**: kein reproduzierbarer DOM-Overflow in Chromium nachweisbar (ursprünglicher
  Befund vermutlich ein Headless-Tooling-Artefakt), präventive CSS-Fixes trotzdem ergänzt.
  Falls auf einem echten iPhone SE/Mini (Safari) doch noch ein sichtbares Abschneiden
  auftritt, bitte mit Screenshot/genauer iOS-Version melden — dann gezielt mit Safari-
  spezifischen Workarounds nachfassen (in Chromium nicht nachstellbar).
- ~~Nebenbefund aus v3.19.0 (Accessibility-Audit): `.info-btn`-Touch-Ziel auf Mobil nur
  28×28px~~ — **erledigt in v3.19.1**: unsichtbare Tap-Fläche per `::before` auf 44×44px
  vergrößert (sichtbare 28px-Kreisoptik unverändert), analog zum `.switch`-Muster.
- ~~Bugfix: Zucker-Regler wurde durch den manuellen „New York Style"-Flag bei JEDEM
  Preset sichtbar/nutzbar, nicht nur beim gleichnamigen Preset~~ — **erledigt in
  v3.20.1** (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s.
  Abschnitt „Zucker-Regler nur bei New-York-Style-Preset oder eigener Einstellung
  (v3.20.1)" oben).
- ~~Rezepte-Backup (Export/Import aller gespeicherten Rezepte als Datei)~~ — **erledigt
  in v3.21.0** (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s.
  Abschnitt „Rezepte-Backup: Export/Import aller gespeicherten Rezepte als Datei
  (v3.21.0)" oben).
- ~~Eigenständiges Rezept-Anlegen-Formular + Presets-Dropdown-Integration~~ — **erledigt
  in v3.22.0** (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s.
  Abschnitt „Eigenständiges Rezept-Anlegen-Formular + Presets-Dropdown-Integration
  (v3.22.0)" oben).
- ~~Card-Überschriften ohne Nummerierung~~ — **erledigt in v3.23.0** (kein Backlog-Punkt,
  direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Card-Überschriften ohne
  Nummerierung (v3.23.0)" oben).
- ~~Umbenennung in „Teigmeister"~~ — **erledigt in v3.24.0** (kein Backlog-Punkt,
  direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Umbenennung in
  „Teigmeister" (v3.24.0)" oben).
- ~~`applyState()` ruft beim Laden eines Rezepts nie `set.sugar(...)` auf (Zucker-
  Slider kann veraltet aussehen)~~ — **erledigt in v3.24.1** (Nebenbefund aus
  v3.22.0, kein Backlog-Punkt im engeren Sinne, direkter Nutzerauftrag per
  `/define-feature`; s. Abschnitt „Zucker-Regler-Sync beim Rezept-Laden (v3.24.1)"
  oben).
- ~~Export als PDF (offen gebliebene Teilaufgabe aus der Teilen-Link-Zeile, v3.14.0)~~ —
  **erledigt in v3.25.0**: eigener Button „Als PDF speichern" neben den Druck-Buttons,
  handgeschriebener PDF-1.4-Generator ohne externe Bibliothek (s. Abschnitt „PDF-Export
  der Anleitung (v3.25.0)" oben).
- ~~Nebenbefund aus dem v3.25.0-Accessibility-Audit: `#recipeIOLiveMsg`
  (`js/main.js`) hat wie ursprünglich `#pdfGuideLiveMsg` kein Clear-Reset vor dem
  Setzen des Live-Region-Texts~~ — **erledigt in v3.28.1** (s. Abschnitt
  „Live-Region-Fix `#recipeIOLiveMsg` (v3.28.1)" oben).
- ~~Burgermenü-Navigation auch auf Desktop~~ — **erledigt in v3.26.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Burgermenü-Navigation auch auf
  Desktop (v3.26.0)" oben).
- ~~Nebenbefund aus dem v3.26.0-Accessibility-Audit: dasselbe Live-Region-Muster
  (kein Clear-Reset vor dem Setzen) steckt auch in `announceView()` des Mobil-
  Inline-Scripts~~ — **erledigt in v3.27.0**: da `pizza-rechner-mobile.html` in diesem
  Zyklus ohnehin für den Pizza-Party-Planer angefasst wurde, direkt mitgezogen (gleicher
  Clear-then-delayed-set-Fix wie auf Desktop).
- ~~Pizza-Party-Planer (Zutatenliste nach Pizzenauswahl)~~ — **erledigt in v3.27.0**
  (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Pizza-Party-Planer (v3.27.0)" oben).
- ~~Sprachversion Deutsch/Englisch~~ — **erledigt in v3.28.0** (kein Backlog-Punkt,
  direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Sprachversion
  Deutsch/Englisch (v3.28.0)" oben).
- ~~Nebenbefund aus dem v3.28.1-Fix: `#shareLiveMsg` (`js/share.js`,
  `copyShareLink()`) und `#nrLiveMsg` (`js/newrecipe.js`, `showNrMsg()`) setzen
  ihren Live-Region-Text ohne vorheriges Leeren (WCAG 4.1.3)~~ — **bereits
  erledigt in v3.42.0** (Clear-then-delayed-set-Fix mit Generation-Zähler, s.
  Abschnitt „Gebündelter Accessibility-Zyklus (v3.42.0)", Punkt 1, oben). Dieser
  Backlog-Eintrag war seither versehentlich nicht als erledigt markiert —
  bei einem gezielten Verifikations-Durchlauf (2026-07-21, Auftrag „gebündelter
  Nebenbefund-Zyklus") nachträglich korrigiert (Code seit v3.42.0 unverändert,
  per Codelesung + Git-History bestätigt: `git log -- js/share.js js/newrecipe.js`
  zeigt keinen Commit nach v3.42.0). Reine Dokumentationskorrektur, kein
  App-Versionssprung nötig (kein Code/Asset geändert).
- ~~Zutaten-Info je Pizza im Pizza-Party-Bereich~~ — **erledigt in v3.29.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Zutaten-Info je Pizza im Pizza-Party-Bereich (v3.29.0)" oben).
- ~~Pizza-Party zurücksetzen~~ — **erledigt in v3.30.0** (kein Backlog-Punkt,
  direkter Nutzerauftrag per `/define-feature`; s. Abschnitt „Pizza-Party
  zurücksetzen (v3.30.0)" oben).
- ~~Nebenbefund aus dem v3.30.0-Accessibility-Audit: dieselbe
  `<details>`-zugeklappt-Problematik betrifft vermutlich auch `#partyCreateLiveMsg`
  (Karte „Eigene Pizza anlegen") sowie `#nrLiveMsg` (Formular „Neues Rezept
  anlegen")~~ — **bereits geprüft in v3.42.0** (s. Abschnitt „Gebündelter
  Accessibility-Zyklus (v3.42.0)", Punkt 2, oben): für beide genannten IDs
  Fehlalarm — ihr jeweils einziger Trigger-Button liegt in derselben
  `<details>`-Karte wie die Live-Region selbst (Karte muss beim Klicken
  zwangsläufig offen sein, kein Cross-Card-Fall). Der einzige damals gefundene
  echte Cross-Card-Bug betraf einen anderen Fall (Pizza-Löschen meldete über die
  falsche, ggf. zugeklappte Karte) und wurde behoben. Dieser Backlog-Eintrag war
  seither versehentlich nicht als erledigt markiert — beim selben Verifikations-
  Durchlauf (2026-07-21) nachträglich korrigiert (HTML-Struktur in
  `pizza-rechner-mobile.html` seit v3.42.0 unverändert, per Codelesung
  bestätigt: `#nrLiveMsg` liegt zwischen `#nrCreateBtn` und dem schließenden
  `</details>` derselben Karte, `#partyCreateLiveMsg` analog bei
  `#partyCreateBtn`). Reine Dokumentationskorrektur, kein App-Versionssprung
  nötig.
- ~~Desktop-Untertitel entfernen (Header-Tagline + Footer-Beschreibungszeilen, Angleichung an Mobil)~~
  — **erledigt in v3.30.1** (kein Backlog-Punkt, direkter Nutzerauftrag; s.
  Abschnitt „Desktop-Untertitel entfernt (v3.30.1)" oben).
- ~~Textkorrektur Kaltgare-Segment-Titel~~ — **erledigt in v3.30.2** (kein
  Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Textkorrektur
  Kaltgare-Segment-Titel (v3.30.2)" oben).
- ~~Sichtbare Kopplung Vorteig-Reife ↔ Hefemenge~~ — **erledigt in v3.31.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Sichtbare Kopplung
  Vorteig-Reife ↔ Hefemenge (v3.31.0)" oben).
- ~~Bugfix: inkonsistente Dezimaltrennzeichen bei Regler-Wertanzeigen~~ —
  **erledigt in v3.32.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s.
  Abschnitt „Bugfix: inkonsistente Dezimaltrennzeichen bei
  Regler-Wertanzeigen (v3.32.0)" oben).
- ~~„Name für neues Rezept"-Feld durch Rezept-Duplizieren ersetzen~~ —
  **erledigt in v3.33.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s.
  Abschnitt „"Name für neues Rezept"-Feld ersetzt durch Rezept-Duplizieren
  (v3.33.0)" oben).
- ~~Sticky Zutatenliste im Pizza-Party-Bereich~~ — **erledigt in v3.34.0**
  (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Sticky
  Zutatenliste im Pizza-Party-Bereich (v3.34.0)" oben).
- ~~Sticky Quickbar für Pizza Party auf Mobil~~ — **erledigt in v3.35.0**
  (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Sticky Quickbar
  für Pizza Party auf Mobil (v3.35.0)" oben).
- ~~Gruppierte Menü-Navigation~~ — **erledigt in v3.36.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Gruppierte
  Menü-Navigation (v3.36.0)" oben).
- ~~Pizza-Glossar~~ — **erledigt in v3.37.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag; s. Abschnitt „Pizza-Glossar (v3.37.0)" oben).
- ~~Fix: veralteter Hinweistext im Anleitungs-Banner~~ — **erledigt in
  v3.38.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt
  „Fix: veralteter Hinweistext im Anleitungs-Banner (v3.38.0)" oben).
- Nebenbefund aus dem v3.37.0-Accessibility-Audit (bereits mitgefixt, hier
  nur zur Nachvollziehbarkeit dokumentiert): `details.card summary::after`
  (`css/mobile.css`) nutzte `content:'▾'` ohne Alt-Text-Syntax, wodurch der
  generierte Pfeil in den Accessible Name jeder Akkordeon-Karten-Überschrift
  auf Mobil einfloss — behoben auf `content:'▾' / '';` (CSS Generated
  Content Module Level 3), betraf ALLE Akkordeon-Karten, nicht nur das neue
  Glossar.
- Nebenbefund aus dem v3.38.0-Accessibility-Audit (nicht behoben, außerhalb
  des angefragten Scopes): der reguläre `.schedbar`-Bannertext (weißer Text
  auf dem helleren Ende des Gradients `#8a7f76`) liegt bei ~3,91:1 Kontrast
  — unter der 4,5:1-Schwelle für Fließtext (WCAG 1.4.3). Vorbestehender,
  von diesem Zyklus unabhängiger Zustand des gesamten `.schedbar`-Bausteins.
  Beim nächsten Kontrast-/Accessibility-Zyklus mit aufgreifen (z. B. dunklere
  Gradient-Endfarbe oder Text-Shadow).
- ~~Bugfix: activeId-Desync bei "Neues Rezept anlegen"/Import in leere
  Bibliothek~~ — **erledigt in v3.38.1** (kein Backlog-Punkt, vom Nutzer
  live reproduzierter und gemeldeter Bug; s. Abschnitt „Bugfix:
  activeId-Desync bei 'Neues Rezept anlegen'/Import in leere Bibliothek
  (v3.38.1)" oben).
- ~~EXPERIMENTELL: Bring!-Deeplink-Testaufbau~~ — **geprüft und wieder
  vollständig entfernt in v3.40.0** (kein Backlog-Punkt, vom Nutzer
  beauftragter Testaufbau; Ergebnis: technische Sackgasse, Bring! braucht
  serverseitig gerendertes HTML mit Pflichtfeldern wie `author`/`image`,
  diese App bleibt aber bewusst server-/build-frei; s. Abschnitt „Rückbau:
  Bring!-Deeplink-Testaufbau geprüft und verworfen (v3.40.0)" oben —
  **nicht erneut versuchen ohne fundamentalen Architekturbruch**).

- ~~Visuelles Redesign — Header-Foto, Bereichs-Icons & Buttons~~ — **erledigt in
  v3.41.0** (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s.
  Abschnitt „Visuelles Redesign — Header-Foto-Platzhalter, Bereichs-Icons & Buttons
  (v3.41.0)" oben). **Teilweise offen:** das Header-Foto ist aktuell nur ein
  CSS-Platzhalter (Bokeh-Verlauf, kein echtes Bild) — sobald der Nutzer ein
  generiertes Pizza-Foto bereitstellt, s. `assets/HEADER-FOTO-README.txt` für den
  Ein-Wert-Austausch.
- ~~Gebündelter Accessibility-Zyklus (Live-Region-Fixes, `<details>`-Zugeklappt-
  Problematik, `.schedbar`-Kontrast, Fokus-Ring kreisrunde Icon-Buttons)~~ —
  **erledigt in v3.42.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt
  „Gebündelter Accessibility-Zyklus (v3.42.0)" oben).
- ~~Redesign-Korrektur: Icon-Farben, farbige Quickbar & Fokusring~~ — **erledigt
  in v3.43.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt
  „Redesign-Korrektur: Icon-Farben, farbige Quickbar & Fokusring (v3.43.0)" oben).
- ~~Echtes Header-Foto einsetzen~~ — **erledigt in v3.44.0** (kein Backlog-Punkt,
  direkter Nutzerauftrag; s. Abschnitt „Echtes Header-Foto eingebunden (v3.44.0)"
  oben). Dabei zwei Infrastruktur-Bugs gefunden/behoben (Pfad-Bug in der
  README-Anleitung, fehlende Pfad-Korrektur beim CSS-Inlinen in
  `build-mobile-standalone.py`) — beide für künftige `url(...)`-Referenzen in
  `css/*.css` relevant, nicht nur für dieses eine Bild.

- ~~Icon-Zentrierung & -Größe Korrektur (Card-Icons + Burgermenü)~~ — **erledigt
  in v3.45.0** (kein Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`;
  s. Abschnitt „Icon-Zentrierung & -Größe Korrektur (v3.45.0)" oben). Nebenbefund
  aus der Verifikation: von den 13 Karten-Icons waren 11 bereits exakt zentriert
  (die `.card-icon`-Flex-Zentrierung selbst funktionierte seit v3.41.0 korrekt) —
  nur 2 Icon-Pfade (Thermometer, Waage-Symbol) hatten eine echte, messbare
  Asymmetrie im eigenen viewBox. Falls künftig neue Line-Icons ergänzt werden:
  Pfad-Symmetrie zum viewBox-Mittelpunkt (12,12) direkt beim Entwurf prüfen, statt
  erst nachträglich per Pixelmessung zu korrigieren.

- ~~Versionsnummer nur im Menü statt im Footer~~ — **erledigt in v3.46.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag per `/define-feature`; s. Abschnitt
  „Versionsnummer nur im Menü statt im Footer (v3.46.0)" oben). Nebenbefund aus dem
  Härten: `.nav-version` hatte anfangs denselben Muted+Opacity-Kontrastfehler wie
  `.quickbar .qb-jump small` in v3.41.0 — beim nächsten Mal direkt vermeiden, wenn
  gedämpfter/leiser Text auf hellem Grund entsteht: `var(--muted)` alleine reicht
  (~5,84:1), `opacity` zusätzlich drückt es unter 4,5:1.

- ~~Dunkelmodus (Hell/Dunkel-Farbschema, automatisch per `prefers-color-scheme` +
  manueller Umschalter)~~ — **erledigt in v3.47.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag per `/define-feature`; s. Abschnitt „Dunkelmodus (v3.47.0)" oben).
- Nebenbefund aus dem v3.47.0-Accessibility-Audit (nicht behoben, außerhalb des
  angefragten Scopes, beide Minor/kosmetisch): (1) `<meta name="theme-color"
  content="#c8442e">` in `pizza-rechner-mobile.html` ist statisch und wechselt nicht
  mit dem Dunkelmodus (native Status-/Adressleisten-Färbung auf Mobil bleibt immer
  Terrakotta) — ließe sich per `js/theme.js` dynamisch mitziehen, falls gewünscht.
  (2) `.daybadge.d2` (feste Farbe `#b5851a` mit weißer Schrift) liegt bei nur
  ~3,32:1 Kontrast (unter der 4,5:1-Schwelle, WCAG 1.4.3) — vorbestehender,
  themenunabhängiger Fund, unabhängig vom Dunkelmodus-Feature. Beim nächsten
  Kontrast-/Accessibility-Zyklus mit aufgreifen.
- ~~Bugfix: Eismenge bei Vorteig ignorierte die Vorteig-Aufteilung; Bugfix: Zucker
  fehlte in der Einkaufsliste~~ — **erledigt in v3.48.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag aus einem separaten Bug-Review; s. Abschnitt „Bugfixes: Eismenge bei
  Vorteig & fehlende Zucker-Zeile in der Einkaufsliste (v3.48.0)" oben).
- ~~B3: sichtbare Versionsnummer im Menü nicht mitgezogen (blieb bei v3.46.0 trotz
  zweier weiterer Releases); B4: KONTEXT.md-Schnellreferenz „Wichtige
  Berechnungs-Details" veraltet (DDT-Formel, Prüfungs-Anzahl, Beispiel-`?v=`,
  Footer- statt Menü-Hinweis)~~ — **erledigt in v3.49.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag aus demselben separaten Bug-Review wie v3.48.0; s. Abschnitt
  „Kleinkorrekturen: Versionsnummer im Menü nachgezogen & KONTEXT.md-Schnellreferenz
  aktualisiert (v3.49.0)" oben). **Neuer Nebenbefund dabei:** der Dateibaum + die
  „Ladereihenfolge"-Zeile im Abschnitt „Dateistruktur" nennen 8 längst existierende
  Module nicht (`i18n.js`, `settings.js`, `theme.js`, `newrecipe.js`, `share.js`,
  `party.js`, `glossary.js`, `pdf.js`) — Kandidat für einen künftigen reinen
  Doku-Pflege-Zyklus (größerer Umfang als die reinen B3/B4-Korrekturen).
- ~~Doku-Nachtrag Dateibaum (Nebenbefund aus v3.49.0); B5: veraltete Code-Kommentare
  zu `PZ.FLAGS`/„New York Style"-Auto-Flag; B6: `state.knead` Typ-Inkonsistenz
  Number vs. String; B7: `setPdfMsg()` ohne Generation-Zähler~~ — **erledigt in
  v3.50.0** (kein Backlog-Punkt, direkter Nutzerauftrag aus demselben separaten
  Fable-Review wie v3.48.0/v3.49.0; s. Abschnitt „Doku-Nachtrag Dateibaum & drei
  Kleinkorrekturen aus dem Fable-Review (v3.50.0)" oben).
- ~~B8 (letzter Kleinkram aus dem Fable-Review): toter Global
  `PZ.PARTY_PRESET_PIZZAS`; `js/guide.js`-Docstring-Diskrepanz zu `t()`;
  Zahlenfelder ohne Clamping auf `min`/`max`~~ — **erledigt in v3.51.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag aus demselben separaten Fable-Review; s.
  Abschnitt „B8: letzter Kleinkram aus dem Fable-Review (v3.51.0)" oben). Die
  übrigen B8-Punkte (Timer nur bei offenem Tab, Zucker-/Öl-Fallback, duplizierte
  Nav-Inline-Scripts, theme-color-Meta, `.daybadge.d2`-Kontrast) waren bewusst
  NICHT Teil dieses Auftrags.
- ~~Nebenbefund aus dem v3.47.0-Dunkelmodus-Audit: `theme-color`-Meta-Tag
  statisch (folgt nicht dem Dunkelmodus); `.daybadge.d2`-Kontrast nur ~3,32:1~~ —
  **erledigt in v3.52.0** (kein Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt
  „Dynamisches theme-color-Meta & `.daybadge.d2`-Kontrastfix (v3.52.0)" oben). Die
  übrigen, noch offenen B8-Punkte (Timer nur bei offenem Tab, Zucker-/Öl-Fallback
  beim Laden alter Rezepte, duplizierte Nav-Inline-Scripts) bleiben weiterhin
  offen/als bewusste Design-Entscheidung dokumentiert.
- ~~Zucker-/Öl-Fallback beim Laden alter Rezepte (letzter offener B8-Punkt, Teil 1
  von 2)~~ — **erledigt in v3.53.0** (kein Backlog-Punkt, direkter Nutzerauftrag;
  s. Abschnitt „Zucker-/Öl-Legacy-Fallback entfernt (v3.53.0)" oben). Das
  strukturell identische `flourTemp`-Fallback-Muster (vor v3.20.0) war explizit
  nicht Teil dieses Auftrags und bleibt unverändert bestehen — Kandidat für einen
  künftigen Zyklus, falls dieselbe Begründung (keine real existierenden alten
  Rezepte) dort ebenfalls bestätigt wird.

- ~~Gemeinsames Nav-Modul (letzter offener B8-Punkt: duplizierte Nav-Inline-Scripts;
  „Auftrag B" desselben zweiteiligen Nutzerauftrags wie v3.53.0)~~ — **erledigt in
  v3.54.0** (per `/define-feature` bestätigt; s. Abschnitt „Gemeinsames Nav-Modul
  (v3.54.0)" oben). Die zwei früheren Inline-Script-Kopien (Desktop + Mobil) sind
  jetzt `js/nav.js`, Mobil-Implementierung war die maßgebliche Referenz, keine
  Verhaltensänderung (per Headless-Verhaltenstest + gezieltem
  `accessibility-expert`-Durchlauf verifiziert).

- ~~i18n-Datei aufteilen (Struktur-Refactoring 1 von 5, S1 aus dem
  Fable-Architektur-Review)~~ — **erledigt in v3.55.0** (per `/define-feature`
  bestätigt; s. Abschnitt „i18n-Datei aufgeteilt (v3.55.0)" oben). `js/i18n.js`
  (569 Einträge / ~108 KB) in schlanke Laufzeit-Engine + neue reine
  Wörterbuch-Datei `js/i18n-dict.js` aufgeteilt, keine inhaltliche Änderung.
  **Nächste vier Struktur-Refactorings aus demselben Fünferauftrag noch offen,
  in fester Reihenfolge:** 2) Widget-Fabrik ui.js/newrecipe.js, 3) Rechenkern/
  Renderer-Trennung calc.js, 4) `PZ.announce()`-Helfer, 5) `PZ.looksLikeState()`.
- ~~Gemeinsame Widget-Fabrik für ui.js/newrecipe.js (Struktur-Refactoring 2 von 5,
  S2)~~ — **erledigt in v3.56.0** (per `/define-feature` bestätigt; s. Abschnitt
  „Gemeinsame Widget-Fabrik für ui.js/newrecipe.js (v3.56.0)" oben). Neues Modul
  `js/widgets.js` (`makeLink`/`makeSeg`/`makePrefStages`/`fillFlourSelect`),
  ~150 Zeilen Duplikat entfernt, keine Verhaltensänderung — inkl. bewusst
  erhaltener Clamping-Asymmetrie (`js/ui.js` klemmt, `js/newrecipe.js` nicht).
  **Neuer Nebenbefund:** ob `js/newrecipe.js`s Zahlenfelder künftig ebenfalls
  klemmen sollen, ist eine eigene Produktentscheidung (kein reines Refactoring),
  braucht explizite Bestätigung in einem künftigen Zyklus. **Noch offen, in
  fester Reihenfolge:** 3) Rechenkern/Renderer-Trennung calc.js, 4)
  `PZ.announce()`-Helfer, 5) `PZ.looksLikeState()`.
- ~~Rechenkern von Renderer trennen (calc.js) (Struktur-Refactoring 3 von 5,
  S3)~~ — **erledigt in v3.57.0** (per `/define-feature` bestätigt; s. Abschnitt
  „Rechenkern von Renderer getrennt (calc.js) (v3.57.0)" oben). Neue
  `PZ.calcCore(state)`→R (kein DOM) + `PZ.renderResult(R)` (nur DOM), `PZ.calc()`
  bleibt als Fassade — keine Verhaltensänderung, keine Änderung an bestehenden
  Aufrufern. `js/guide.js`/`js/schedule.js` bewusst nicht angefasst. **Noch
  offen, in fester Reihenfolge:** 4) `PZ.announce()`-Helfer, 5)
  `PZ.looksLikeState()`.
- ~~Gemeinsamer Live-Region-Helfer PZ.announce() (Struktur-Refactoring 4 von 5,
  S4)~~ — **erledigt in v3.58.0** (per `/define-feature` bestätigt; s. Abschnitt
  „Gemeinsamer Live-Region-Helfer PZ.announce() (v3.58.0)" oben). Neues
  `PZ.announce(elementId, text)` in `js/dom.js`, alle 7 bestehenden Kopien
  (share/main/party×2/newrecipe/theme/pdf) darauf umgestellt. **Zwei echte,
  vorher unentdeckte Bugs beim Konsolidieren gefunden und mitbehoben:**
  `js/i18n.js` `announceLangChange()` und `js/nav.js` `announceView()` hatten
  KEINEN Generation-Zähler (Race-Risiko bei schnellen Doppelklicks) — jetzt
  identisch robust wie die übrigen Stellen. Gezielter `accessibility-expert`-
  Durchlauf (wie beauftragt) bestätigt alles korrekt. **Noch offen, letzter
  Punkt des Fünferauftrags:** 5) `PZ.looksLikeState()`.
- ~~Gemeinsame State-Plausibilisierung PZ.looksLikeState() (Struktur-Refactoring
  5 von 5, S6)~~ — **erledigt in v3.59.0** (per `/define-feature` bestätigt; s.
  Abschnitt „Gemeinsame State-Plausibilisierung PZ.looksLikeState() (v3.59.0)"
  oben). Neues `PZ.looksLikeState(o)` in `js/state.js`, ersetzt drei unabhängige
  Kopien (`looksLikeState()` in `js/share.js`, `isLegacyState()`/
  `isValidRecipeEntry()` in `js/storage.js`). **Damit ist der komplette
  Fünferauftrag „Struktur-Refactorings aus dem Fable-Architektur-Review"
  abgeschlossen** (S1–S6, S5 Nav-Modul separat in v3.54.0 erledigt).

- ~~`flourTemp`-Legacy-Fallback in `js/storage.js` `applyState()` (Nebenbefund aus dem
  Struktur-Refactoring-Fünferauftrag, strukturell identisch zum bereits in v3.53.0
  entfernten Zucker-/Öl-Fallback)~~ — **erledigt in v3.60.0** (direkter Nutzerauftrag,
  „Punkt 1" eines zweiteiligen Folgeauftrags; s. Abschnitt „flourTemp-Legacy-Fallback
  entfernt (v3.60.0)" oben).
- ~~Zahlenfeld-Clamping auch in `js/newrecipe.js` (Nebenbefund aus v3.56.0, eigene
  Produktentscheidung)~~ — **erledigt in v3.61.0** (direkter Nutzerauftrag, „Punkt 2"
  desselben zweiteiligen Auftrags; s. Abschnitt „Zahlenfeld-Clamping auch in
  js/newrecipe.js (v3.61.0)" oben).

- ~~Einfacher Modus für Presets (Rechner-Seite zeigt standardmäßig nur 3 Kernparameter
  statt aller Felder)~~ — **erledigt in v3.62.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag mit Rückfrage-Runde; s. Abschnitt „Einfacher Modus für Presets
  (v3.62.0)" oben).
- ~~Willkommens-Screen (Onboarding-Modal mit Vorstellung der 4 Kernfunktionen,
  automatisch beim Erststart + jederzeit über Burgermenü)~~ — **erledigt in v3.63.0**
  (kein Backlog-Punkt, direkter Nutzerauftrag mit Rückfrage-Runde; s. Abschnitt
  „Willkommens-Screen / Einführung (v3.63.0)" oben).
- ~~Globale Hefemengen- und Verschwendungs-Anpassung (zwei neue %-Stepper im
  Einstellungen-Menü)~~ — **erledigt in v3.64.0** (kein Backlog-Punkt, direkter
  Nutzerauftrag mit Rückfrage-Runde; s. Abschnitt „Globale Hefemengen-/
  Verschwendungs-Anpassung & Aufräumarbeiten (v3.64.0)" oben). Im selben Zyklus
  gebündelt: Mobil-Onboarding-Zentrierungs-Bugfix, 5. Onboarding-Punkt „Pizza Party",
  Gedankenstrich-Bereinigung in `js/i18n-dict.js`/allen `.html`-Dateien.

- ~~Einheitensystem-Umschaltung Metrisch/Imperial (automatische Regions-Erkennung +
  persistente manuelle Übersteuerung)~~ — **erledigt in v3.65.0** (Warteschlangen-Punkt 1
  von 3, kein Backlog-Punkt; s. Abschnitt „Einheitensystem-Umschaltung Metrisch/Imperial
  (v3.65.0)" oben).
- ~~Glossar-Erweiterung: Werkzeuge & Ausrüstung + Pizzabeläge~~ — **erledigt in v3.66.0**
  (Warteschlangen-Punkt 2 von 3, kein Backlog-Punkt; s. Abschnitt „Glossar-Erweiterung:
  Werkzeuge & Ausrüstung + Pizzabeläge (v3.66.0)" oben).
- ~~Bottom-Tab-Navigation auf Mobil~~ — **erledigt in v3.67.0** (Warteschlangen-Punkt 3
  von 3, letzter Punkt der Warteschlange, kein Backlog-Punkt; s. Abschnitt
  „Bottom-Tab-Navigation (Mobil) (v3.67.0)" oben).
- ~~Glossar-Verweise in der Anleitung (inkl. neuem Glossar-Eintrag "Ofen-Heizarten für
  Pizza")~~ — **erledigt in v3.68.0** (kein Backlog-Punkt, ausgelöst durch
  Kollegen-Feedback zur Anleitung; s. Abschnitt „Glossar-Verweise in der Anleitung
  (v3.68.0)" oben).

**Stand v3.69.0: alle bisherigen versionierten Backlog-Punkte sind abgearbeitet**
(durchgestrichen oben), offen ist nur noch die eine noch unspezifizierte Foto-Idee weiter
oben in dieser Liste (Fotos je Schritt der Anleitung, z. B. Autolyse/Kneten/Salz
zugeben — braucht vor Umsetzung eine eigene `/define-feature`-Runde, Bildquelle noch
offen). Der Bring!-Deeplink-Testaufbau ist abschließend geklärt (verworfen, vollständig
zurückgebaut, keine offene Frage mehr). Kein weiterer vorgegebener Auftrag mehr
angekündigt, für einen neuen Zyklus wieder frisches Brainstorming in Phase 1.

Nach v3.68.0 wurden zusätzlich drei kleine, direkt inline (ohne Orchestrator)
umgesetzte Nutzeraufträge abgeschlossen und gepusht: v3.68.1 (Teilen-Link-Abstand +
versteckter Flex-Bug in js/settings.js), v3.68.2 (Einführung-Modal: X-Button entfernt,
Titel zu "Willkommen Teigmeister" geändert) und eine README.md-Aktualisierung (war noch
auf dem Stand vor der Mobil-Version). Volle Details zu v3.68.1/v3.68.2 in der
HISTORIE-Datei, s. o.

Zusätzlich wurde das Projekt account-unabhängig portabel gemacht (Commit
`36369da`, nicht versioniert/kein `?v=`-Bump, da reine Tooling-/Doku-Änderung ohne
Auswirkung auf die App selbst): `.claude/` (Sub-Agenten-Definitionen + Preview-Server-
Konfiguration) ist jetzt Teil des Git-Repos statt gitignored, und `CLAUDE.md` enthält
jetzt den kompletten Orchestrator-Workflow, Bug-Untersuchungsstandard und
Kommunikationsstil direkt, statt nur auf persönliche Claude-Erinnerungen zu verweisen.
Eine neue Session kann daher auch unter einem anderen Account/einer anderen Maschine
nahtlos weiterarbeiten, einfach diesen Ordner öffnen (bzw. von
`https://github.com/Birnify/pizza-rechner` klonen). **Eine Grenze bleibt:** ein zuvor
in einer Sitzung laufender Orchestrator-Agent ist nicht sitzungsübergreifend
erreichbar, jede neue Sitzung startet einen frischen Orchestrator (s. CLAUDE.md,
Abschnitt „Arbeitsablauf: Orchestrator statt direkter Implementierung").
**Stil-Hinweis für alle künftigen Texte (Glossar, i18n-Strings, Onboarding, sonstige
Beschreibungen):** keine Gedankenstriche (Em-Dash) verwenden, stattdessen Komma, Punkt,
Doppelpunkt oder Klammern, je nach Kontext.

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
