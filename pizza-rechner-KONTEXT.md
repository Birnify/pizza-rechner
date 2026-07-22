# Kontext: Pizzateig-Rechner App
Stand: 2026-07-22 · Aktuelle Version: v3.63.0 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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
   (1 davon, „New York Style", ist flag-gated — s. Abschnitt „Zucker-Feld / New York Style")
2. **Grundeinstellungen**: **Mehl-Dropdown** (13 Sorten, wird per JS aus `PZ.FLOURS` generiert),
   Anzahl Teiglinge, Gewicht/Teigling (Pills), Hydration %, Salz %, **Olivenöl %**, optional
   **Zucker %** (nur sichtbar bei Flag „New York Style" oder gleichnamigem Preset)
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

## Vorteig-Reife-Stufen (v3.2.0 — ersetzt den Slider aus v3.1.0)

Reifezeit und Hefemenge hängen physikalisch zusammen (länger = weniger Hefe / kühler).
Deshalb **keine freien Regler**, sondern **diskrete Stufen**, die beides koppeln.
Datenquelle: `PZ.PREF_STAGES` in `js/ui.js`:
- **Biga:** `b16` (16 h · 0,4 %) · `b24` (24 h · 0,3 %, Default) · `b48` (48 h · 0,2 %)
- **Poolish:** `p8` (8 h · 0,4 %) · `p14` (14 h · 0,2 %, Default) · `p24` (24 h · 0,18 %)

`yeast` ist % vom Gesamtmehl (geht bei Vorteig komplett in den Vorteig). Alle Stufen-Hefewerte
liegen bei ≥ 0,18 %, damit die Hauptteig-Gare (`schedule()`) im „Lange Hauptgare"-Rahmen (~8,5 h)
bleibt — die Differenzierung steckt in der **Reifezeit**, nicht in der Hauptgare.

- State: `state.prefStage` (aktive Stufe) + `state.prefMature` (h, von der Stufe gesetzt).
- `applyMethod()` (ui.js): rendert die Pills der Methode (`renderPrefStages`), blendet bei Vorteig
  die generischen Hefe-Pills (`#yeastPills`) aus, wählt eine gültige Stufe (`selectPrefStage`).
- `selectPrefStage(m, key)` setzt `prefStage` + `prefMature` **und** `PZ.set.yeast(stage.yeast)`.
  Nutzer-Klick auf eine Pill setzt zusätzlich `#preset` zurück auf „Eigene"; der **programmatische**
  Aufruf (Load/Preset) nicht.
- `buildGuide` nutzt `matureMin = prefMature × 60` als Dauer des „…reifen lassen"-Schritts,
  adaptiver Temperatur-Text (länger = kühler), schreibt `R.totalMin` / `R.matureMin`.
- **Mehl-Warnung** zählt `prefMature` als Vorteig-Reife zur Gesamtgärzeit.
- **Hintergrund:** die Hefe-Pills (72h+ etc.) steuern nur die Hauptteig-Gare; bei Vorteig dominiert
  die Reifezeit — daher eigene, gekoppelte Stufen statt der (irreführenden) Zeit-Hefe-Trennung.

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
- Alle 7 Presets haben Öl: neapolitanisch je **2 %**, Teglia/Blech **4 %**. Zucker bewusst
  **nicht** — außer beim flag-gated 8. Preset „New York Style" (2 % Zucker), s. Abschnitt
  „Zucker-Feld / New York Style (v3.19.2)" weiter oben.

## Kaltgare-Stufe (v3.0.0)

`state.coldStage`: `'balls'` (Standard) oder `'bulk'`. Greift nur bei kalten Führungen (cold: true).
- **'balls' (praktisch)**: kurze Stockgare bei RT (~2 h), dann Teiglinge formen und
  **als Teiglinge in den Kühlschrank**; am Backtag nur temperieren + backen.
- **'bulk' (klassisch)**: der ganze Teig gärt kalt im Stück; Formen + Stückgare am Backtag.
- Die **Gesamtdauer (bulkMin + proofMin) ist in beiden Varianten identisch** —
  darauf verlassen sich die Mehl-Warnung und die Tests.

## Die 7 Kern-Presets (alle gegen die Mehl-Warnung geprüft — keine löst eine Warnung aus)

Daneben gibt es ein 8. Preset, „New York Style" — flag-gated (nicht immer im Dropdown-Effekt
sichtbar aktivierbar ohne das zugehörige Flag), s. Abschnitt „Zucker-Feld / New York Style"
weiter unten. Bewusst nicht in dieser Tabelle, da einziges Preset mit `flag`-Eigenschaft.

| Key | Methode | Hyd | Salz | Öl | Hefe | Mehl (empfohlen) |
|-----|---------|-----|------|------|------|------------------|
| `napoli_klassisch` | direct | 60 % | 2,8 % | 2 % | 0,2 % | caputo_pizzeria |
| `napoli_65` | direct | 65 % | 2,8 % | 2 % | 0,3 % | caputo_pizzeria |
| `napoli_kalt` | direct | **65 %** | 3,0 % | 2 % | 0,1 % | **caputo_cuoco** |
| `schnell` | direct | 62 % | 2,5 % | 2 % | 1,5 % | caputo_pizzeria |
| `napoli_biga` | biga (pref 100, bhyd 45) | 65 % | 2,8 % | 2 % | 0,3 % | caputo_cuoco |
| `napoli_poolish` | poolish (pref 66) | 66 % | 2,5 % | 2 % | 0,2 % | **dallag_monica** |
| `teglia` | direct (ballw 320) | 75 % | 2,5 % | **4 %** | 0,3 % | **caputo_nuvola_super** |

(napoli_kalt war 62 % → auf 65 % angehoben, damit es zum Cuoco passt;
poolish braucht hydMax ≥ 66 → Monica; teglia braucht hydMax ≥ 75 → Nuvola Super.)

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

## Willkommens-Screen / Einführung (v3.63.0) = aktueller Stand

Direkter Nutzerauftrag (kein Backlog-Punkt): neues Modal-Overlay `js/onboarding.js`
stellt die 4 Kernfunktionen (Presets, Erweiterter Modus, Zeitplan, Anleitung & Timer)
plus einen kombinierten Hinweis auf Einstellungen-Menü/Erweiterten Modus vor. Erscheint
automatisch beim allerersten Start (kein `pizzaOnboardingDontShow`-Flag in localStorage),
jederzeit erneut über den neuen Burgermenü-Punkt „Einführung". Checkbox „Beim nächsten
Start nicht mehr anzeigen" steuert NUR das automatische Wiedererscheinen — schließbar
auf 4 Wegen (X, Escape, Backdrop-Klick, CTA-Button), alle persistieren den
Checkbox-Stand gleichermaßen. Eigener Fokus-Trap analog zum Burgermenü-Muster, `js/nav.js`
um `PZ.closeNav`-Export + Guard für Menüpunkte ohne `data-goto` ergänzt. Tests unverändert
614/614 (Modul lädt bewusst nicht in `tests/test.html`, reines DOM-Wiring, per Headless-
Klicktests inkl. Tab-Trap verifiziert). **Volle Details:**
`pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Willkommens-Screen / Einführung (v3.63.0)".

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

## Zucker-Feld / New York Style (v3.19.2)

Neues Feature, vom Nutzer über `/define-feature` strukturiert und in einer Rückfrage-Runde
präzisiert: ein Zucker-Regler als Bäckerprozent (analog zu Öl, s. v3.3.0) plus ein neues
Preset „New York Style", das ihn nutzt. Außerhalb dieses Presets bleibt der Zucker-Regler
ausgeblendet, es sei denn, ein neuer Feature-Flag „New York Style" wird aktiv eingeschaltet.
Bewusst **kein** sonstiger New-York-Style-spezifischer Eingriff (keine andere Backzeit-/
Temperaturlogik, keine Krustenform-Logik) — nur der Regler + das Preset.

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
  vorm ersten `applyFlags()`-Lauf, da `.collapse{display:none}` schon per CSS vor jeder
  JS-Ausführung greift. **CSS-Detail:** weil `.field:last-child{margin-bottom:0}` strukturell
  immer auf `sugarBlock` zeigt (auch bei `display:none` — `:last-child` ist DOM-Struktur,
  nicht Sichtbarkeit), bekommt stattdessen das Öl-Feld davor fix `margin-bottom:0` und
  `sugarBlock` selbst `margin-top:18px` (statt `margin-bottom:0` allein) — sonst hätte das
  Öl-Feld bei ausgeblendetem Zucker (Standardfall für die meisten Nutzer) eine unschöne
  Extra-Lücke am Kartenboden gehabt. Per Headless-Edge-CDP verifiziert: Kartenboden-Abstand
  ist in beiden Zuständen (Zucker aus/an) exakt 21 px (20 px Padding + 1 px Rahmen), der
  Row-Abstand zwischen Öl und sichtbarem Zucker-Feld 18 px (Standard-Feldabstand).
- **Feature-Flag `newYorkStyle`** (`js/settings.js`, Default **AUS**, Checkbox `#flagNewYorkStyle`
  im Einstellungen-Menü „New York Style"): blendet den Zucker-Regler standardmäßig aus — die
  meisten neapolitanischen Rezepte brauchen ihn nicht.
  **⚠️ Überholt seit v3.19.3, hier nur zur historischen Einordnung stehen gelassen:** in
  v3.19.2 schaltete `applyPreset()` das Flag beim Anwenden noch generisch dauerhaft an
  (`PZ.setFlag(p.flag, true)`) und ließ den Regler danach für immer sichtbar, auch nach
  Wechsel auf ein anderes Preset oder „Eigene Einstellung". Das war ungewollt und wurde in
  v3.19.3 korrigiert — der Regler ist jetzt nur sichtbar, solange das Preset „New York
  Style" aktiv gewählt ist ODER das Flag manuell im Einstellungen-Menü an ist, s. Abschnitt
  „New York Style: nur temporäre statt dauerhafte Zucker-Regler-Sichtbarkeit (v3.19.3)"
  weiter oben (= aktueller Stand).
  **Bugfix während der v3.19.2-Umsetzung (weiterhin gültig):** `applyFlags()` synct jetzt bei jedem Aufruf auch alle
  Checkbox-`.checked`-Zustände aus `PZ.FLAGS` (vorher setzte `wireCheckboxes()` das nur
  einmalig beim Laden — ein programmatisch gesetztes Flag wie hier hätte die Checkbox
  optisch auf „aus" stehen lassen, obwohl das Feature technisch an war). Per Headless-CDP
  verifiziert: nach Preset-Anwendung ist sowohl `PZ.FLAGS.newYorkStyle` als auch
  `#flagNewYorkStyle.checked` `true`.
- **Neues 8. Preset „New York Style"** (`js/presets.js`, `newyork_style`, flag-gated):
  `direct`, 62 % Hydration, 2,5 % Salz, 3 % Öl, **2 % Zucker**, 0,2 % Hefe (frisch),
  300 g/Teigling, 24 °C DDT, Mehl `dallag_napoletana` (W310, hydMin 60/hydMax 65,
  minH 16/maxH 48) — ergibt „Lange Gare · ~24 h"-Stufe (real ~26 h: 2 h Stockgare +
  24 h Kühlschrank/Temperieren), löst keine Mehl-Warnung aus (per Headless-CDP verifiziert:
  `#flourWarn` bleibt leer, Massesumme = Gesamtgewicht bis auf Rundung). Bewusst **nicht**
  Teil der „7 Kern-Presets"-Tabelle weiter oben (die bleibt unverändert, dieses Preset ist
  das einzige mit einem `flag`-Gate).
- **`js/guide.js` — Zucker kommt anders als Öl FRÜH in den Teig** (mit Mehl/Wasser/Hefe,
  nicht erst nach dem Salz): unterstützt die Hefeaktivität statt das Glutennetz zu stören.
  `hasSugar = R.sugar >= 0.05`. Direkt-Methode: taucht in der „Zutaten abwiegen"-Zeile
  (zwischen Hefe und Öl) und im Mischen-Schritt-Titel/-Text auf (Titel wird zu „Mischen &
  Zucker & Salz & Öl", Body bekommt `sugarPhrase` nach „Mehl, Wasser & Hefe" eingefügt,
  `sugarTip` erklärt die frühe Zugabe). Vorteig-Methoden: taucht im „Vorteig + Wasser +
  Mehl + Zucker"-Hauptteig-Mix-Schritt auf (`sugarTip` dort im Extra-Block) — der spät
  zugegebene Öl-Schritt bleibt unverändert getrennt davon.
- **Presets sind jetzt generisch flag-fähig:** `applyPreset()` prüft `p.flag` unabhängig
  vom Zucker-Feature — künftige Presets, die einen sonst versteckten Regler brauchen,
  können dasselbe `flag`-Feld nutzen, ohne `presets.js` erneut anzufassen.

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
pizza-rechner.html   Markup + Einbindung von CSS und allen JS-Modulen (?v=3.63.0)
pizza-rechner-mobile.html  Mobil-Ansicht (Akkordeon), nutzt dieselben JS-Module + IDs (Quelle)
pizza-rechner-mobile-standalone.html  Build-Ergebnis (alles inline) — DIESE Datei geht aufs iPhone
build-mobile-standalone.py  Python-Skript, das die Standalone-Datei erzeugt (Aufruf s. o.)
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       komplettes Stylesheet (inkl. .selectbox / .selectbox-lg / .viewlink)
css/mobile.css       Ergänzungen NUR für pizza-rechner-mobile.html (Akkordeon, Touch-Ziele, Quick-Bar)
js/dom.js            $-Helfer, legt globalen Namespace window.PZ an + PZ.announce(elementId, text)
                     (v3.58.0, gemeinsamer Live-Region-Helfer — Clear-then-delayed-set mit
                     Generation-Zähler je Element-ID, ersetzt 7+ frühere Einzelkopien)
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
js/settings.js       PZ.FLAGS — Feature-Flags fürs Einstellungen-Menü (v3.16.0), eigener
                     localStorage-Key `pizzaRechnerFeatureFlags`, vorwärtskompatibler Merge mit DEFAULTS
js/theme.js          Dunkelmodus (v3.47.0): folgt `prefers-color-scheme`, bis der manuelle
                     Umschalter im Einstellungen-Menü übersteuert (persistiert)
js/widgets.js        Gemeinsame Widget-Fabriken (v3.56.0, vorher in js/ui.js + js/newrecipe.js +
                     js/flour.js dupliziert): PZ.makeLink/makeSeg/makePrefStages/fillFlourSelect —
                     js/flour.js, js/ui.js, js/newrecipe.js rufen sie als dünne Konfigurationsaufrufe
js/flour.js          PZ.FLOURS (13 Mehle) + PZ.getFlour() + Dropdown-Befüllung (via
                     PZ.fillFlourSelect(), s. js/widgets.js)
js/calc.js           PZ.calcCore(state)→R reine Rechenfunktion (kein DOM) + PZ.renderResult(R) fürs
                     DOM (seit v3.57.0 getrennt) + PZ.calc()-Fassade (ruft beides + PZ.buildGuide())
js/schedule.js       PZ.schedule() — Gärzeit-Fahrplan (berücksichtigt coldStage)
js/guide.js          PZ.buildGuide() — Anleitung + Zeitberechnung + Mehl-Warnung + Timer-Platzhalter
js/timer.js          PZ.wireTimers() — Gärzeit-Timer/Wecker je Schritt (Notification + Web-Audio-Beep,
                     State in localStorage['pizzaRechnerTimers'], kein Server/Service-Worker); nutzt
                     Browser-APIs, die bewusst NICHT in tests/test.html geladen/unit-getestet werden
js/ui.js             Slider/Segmente/Pills/Zeitplan; PZ.set, selectSeg, applyMethod, updateTimeLabel
                     (Slider/Segmente/Reife-Stufen seit v3.56.0 über js/widgets.js-Fabriken)
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
js/glossary.js       Pizza-Glossar (v3.37.0) — eigenständiger Menü-Bereich, reine Anzeige-Funktion
js/main.js           Start: Speichern-Button, Rezept-Auswahl/-Buttons, load(), applyMethod(), calc()
js/nav.js            Gemeinsames Burgermenü-Navigations-Modul (v3.54.0, vorher zwei/drei duplizierte
                     Inline-Scripts): openNav/closeNav/activateView/announceView/focusView/gotoView +
                     Tab-Trap; läuft bewusst als letztes Script (nach main.js). PZ.closeNav seit
                     v3.63.0 exportiert (für js/onboarding.js), Klick-Guard für Menüpunkte ohne
                     eigenen data-goto (z. B. "Einführung")
js/onboarding.js     Willkommens-Screen / Einführung (v3.63.0): eigenständiges Modal-Overlay mit
                     eigenem Fokus-Trap, stellt 4 Kernfunktionen vor, automatisch beim Erststart
                     + jederzeit über Burgermenü-Punkt "Einführung" aufrufbar, Persistenz via
                     localStorage-Key pizzaOnboardingDontShow. Läuft als letztes Script (nach nav.js)
tests/test.html      614 Prüfungen in 24 Kategorien (Doppelklick, kein Server) — lädt 16 der 25
                     js/*-Module direkt (dom/state/i18n-dict/i18n/settings/theme/widgets/flour/
                     schedule/guide/calc/print/pdf/storage/share/party); ui.js, timer.js,
                     presets.js, newrecipe.js, glossary.js, main.js, nav.js, simplemode.js,
                     onboarding.js werden NICHT geladen (reines DOM-Wiring bzw. Browser-APIs) —
                     einzelne Ausschnitte wie PZ.PRESETS werden bei Bedarf punktuell gestubbt
README.md            kurzer Einstieg
```

**Ladereihenfolge** (Abhängigkeiten): dom → state → i18n-dict → i18n → settings → theme → widgets →
flour → calc → schedule → guide → timer → ui → simplemode → print → pdf → presets → storage →
newrecipe → share → party → glossary → main → nav → onboarding. Jedes Modul ist eine IIFE,
kommuniziert nur über `window.PZ`. `onboarding` MUSS nach `nav` geladen werden (braucht `PZ.closeNav`).
**`i18n-dict` MUSS vor `i18n` geladen werden** (Handoff über `PZ._I18N_DICT`); **`widgets` MUSS vor
`flour`/`ui`/`newrecipe` geladen werden** (liefert PZ.makeLink/makeSeg/makePrefStages/
fillFlourSelect, die diese drei Module beim eigenen Laden direkt aufrufen).

**Cache-Busting:** CSS/JS werden mit `?v=3.63.0` geladen. **Bei jeder neuen Version mitziehen.**

**Sichtbare Versionsnummer (seit v3.7.1, seit v3.46.0 im Menü statt im Footer):** Im
Burgermenü (`.nav-panel`) beider HTML-Dateien (Desktop + Mobil, identisch) steht
`<span class="nav-version" id="appVersion">vX.Y.Z</span>` — rein statischer Text, keine
JS-Logik dahinter. **Bei jedem Versionssprung von Hand mitziehen** (zusammen mit `?v=` und der
Kontext-Datei — bei allen drei HTML-Dateien, also auch `pizza-rechner-mobile-standalone.html`
nach dem Rebuild, gegenprüfen), sonst zeigt die Live-App die falsche Version an.

## Wichtige Berechnungs-Details

- `calc()`: Mehl = total/(1+h+s+y+o); Öl = Mehl×o; Trockenhefe = Frischhefe × 1/3
- Vorteig: `pYeast = yeast` (100 % in den Vorteig), `mYeast = 0`, **Öl → Hauptteig**; Poolish-Wasser immer 1:1
- DDT: `wT = ddt×3 − room − flourTemp − friction` (Hand 3 °C, Maschine 6 °C; Mehltemp seit
  v3.20.0 ein eigener Regler, Default = Raumtemp, danach unabhängig änderbar)
- Eis: Energiebilanz `x = M·c·(Ttap−wT) / (Lf + c·wT + c·(Ttap−wT))`, c=4,18, Lf=334
- Schedule-Schwellen (yeast %): ≥1,2 Schnell · ≥0,5 Mittel · ≥0,18 ~24 h · ≥0,08 ~48 h · sonst 72 h+
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
- **Tests:** `tests/test.html` per Doppelklick — grün = OK. **Aktueller Stand: 614 Prüfungen in
  24 Kategorien** (s. Dateistruktur oben): Bäckerprozente, DDT/Eis, Vorteig-Aufteilung, Trockenhefe,
  Schedule-Schwellen, Mehl-Warnung, Backzeit-Skalierung, Olivenöl (Masseerhaltung), Anleitungs-
  Hinweise, Randfälle/Edge Cases, Kombinationen, Zeitplan-Rückwärtsrechnung, Einkaufsliste,
  Speichern & Laden, Teilen-Link, Feature-Flags/Einstellungen, Zucker/New-York-Style,
  Rezepte-Backup, PDF-Export, Pizza-Party-Planer, Sprachversion DE/EN, Dunkelmodus. Nach
  Logik-Änderungen laufen lassen. `js/timer.js` (Notification/setInterval/Web-Audio-API) und
  `js/newrecipe.js` (reines DOM-Wiring) werden bewusst **nicht** in `tests/test.html` geladen —
  beide stattdessen manuell bzw. per isoliertem Headless-Aufbau verifiziert. Die Wachstums-
  Historie der Testsuite Version für Version steht in `pizza-rechner-KONTEXT-HISTORIE.md`.
- **Git:** Repo im Hauptordner, kleine Commits pro Änderungs-Satz. `Versionen/` + `.claude/` gitignored.
- **Plattform:** Windows / PowerShell. Kein Node, keine Build-Tools.
- **Preview-Hinweis:** Das Preview-Tool (localhost-Server) war in mehreren Sessions unzuverlässig
  (Browser lädt `chrome-error://`) — Tests einfach per Doppelklick im echten Browser öffnen lassen.

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

## Feature-Flag „hints" — Tooltip-/Hinweistexte optional abschaltbar (v3.17.0) = aktueller Stand

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

- **Foto-Anleitung:** Schritt-für-Schritt-Anleitung um Fotos je Schritt ergänzen (z. B.
  Autolyse, Kneten, Salz zugeben), analog einer Referenz-App, die der Nutzer per
  Screenshot gezeigt hat. Noch nicht spezifiziert (Bildquelle offen: generische Stock-/
  Illustrationsbilder pro Schritt-Typ vs. Aufwand, ob sie zu allen Methoden/Presets
  passen). Braucht vor Umsetzung eine eigene `/define-feature`-Runde. (Als Backlog-Notiz
  vom Nutzer nachgetragen, 2026-07-22 — noch kein eigener Zyklus dafür gestartet.)
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

**Stand v3.63.0: alle bisherigen versionierten Backlog-Punkte sind abgearbeitet**
(durchgestrichen oben) — offen ist nur die neue, noch unspezifizierte Foto-Anleitung-Idee
ganz oben in dieser Liste. Der Bring!-Deeplink-Testaufbau ist abschließend geklärt
(verworfen, vollständig zurückgebaut, keine offene Frage mehr). Drei direkte
Nutzeraufträge bereits als Warteschlange für die nächsten Zyklen angekündigt (noch nicht
umgesetzt, in dieser Reihenfolge): 1) Globale Hefemengen- und Verschwendungs-Anpassung
(zwei neue %-Regler im Einstellungen-Menü), 2) Einheitensystem-Umschaltung
Metrisch/Imperial (automatische Spracherkennung + persistente manuelle Übersteuerung).
Für einen sonst neuen Zyklus wieder frisches Brainstorming in Phase 1 statt eines
vorgegebenen Auftrags.

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
