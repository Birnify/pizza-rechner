# Kontext: Pizzateig-Rechner App
Stand: 2026-07-19 · Aktuelle Version: v3.26.0 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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

## Burgermenü-Navigation auch auf Desktop (v3.26.0) = aktueller Stand

Kein Backlog-Punkt, direkter Nutzerauftrag (in einer vorherigen Session begonnen, als
uncommitteter Zwischenstand ohne Doku übergeben — dieser Zyklus hat ihn geprüft,
gehärtet und abgeschlossen). Motivation: die bestehende Mobil-Ansicht hatte schon seit
v3.17.x/v3.18.0 eine Burgermenü-Navigation mit vier Bereichen (Rechner/Rezepte/
Zeitplan/Einstellungen), die Desktop-Seite zeigte stattdessen alle Bereiche
untereinander auf einer langen Seite. Jetzt hat auch Desktop dieselbe
Bereichs-Navigation — kürzere, fokussiertere Ansicht pro Bereich statt einer langen
Scroll-Seite.

- **`pizza-rechner.html`:** Header wurde zu einer `.header-bar` (Grid mit
  Hamburger-Button links, zentriertem `<h1>`, drittes Grid-Feld für den Button rechts
  im CSS-Raster) umgebaut; der bisherige `.viewlink`-Textlink „Zur Mobil-Ansicht" ist
  jetzt `#navMobileLink` im neuen `#navMenu`-Panel. Die vier bisherigen Cards/Bereiche
  wurden auf vier `data-view`-Container verteilt (`rechner` bleibt der bisherige
  Zwei-Spalten-`.wrap` inkl. Ergebnis-Panel + Anleitung; `rezepte` — „Meine Rezepte" +
  „Neues Rezept anlegen"; `zeitplan`; `einstellungen`), jeweils bis auf `rechner` mit
  `hidden` im HTML vorbelegt (funktioniert dadurch auch ohne JS sinnvoll als Fallback:
  nur der Rechner-Bereich ist ohne aktives Script sichtbar). Neue Klasse `.wrap.single`
  (`css/styles.css`) erzwingt für die Nicht-Rechner-Bereiche eine einzelne volle Spalte
  statt der für den Rechner reservierten 360px-Ergebnis-Spalte.
- **1:1-Kopie des etablierten Mobil-Musters, bewusst nicht als gemeinsames Modul:**
  eigenes Inline-`<script>` am Ende von `pizza-rechner.html` (analog zum bereits
  bestehenden Mobil-Inline-Script) mit `openNav()`/`closeNav()`/`activateView()`/
  `announceView()`/`focusView()` und einer eigenen Tab-Trap (`onNavKeydown`) —
  identische Logik wie auf Mobil, aber eigenständig kopiert statt die bestehende
  Mobil-Implementierung anzufassen oder in ein gemeinsames Modul auszulagern (Vorgabe:
  die bewährte Mobil-Umsetzung bleibt unangetastet). Ebenso wurden die
  `.header-bar`/`.nav-toggle`/`.nav-overlay`/`.nav-panel`/`.nav-item`/`.nav-link`/
  `.nav-divider`-CSS-Regeln in `css/styles.css` (dem gemeinsamen Stylesheet) ergänzt —
  auf der Mobil-Seite überschreibt `css/mobile.css` dieselben Selektoren ohnehin mit
  identischen Werten (lädt nach `styles.css`), also keine Verhaltensänderung dort, nur
  bewusste Redundanz zugunsten der strikten Abgrenzung.
- **Bereichswechsel:** Klick auf einen `.nav-item` blendet alle `data-view`-Container
  bis auf den gewählten per `hidden`-Attribut aus/ein, setzt `aria-current="page"` /
  `.active` auf den passenden Nav-Eintrag, schließt das Panel **ohne** den Fokus auf den
  Hamburger-Button zurückzusetzen (`closeNav(false)`), sondern springt stattdessen auf
  die `<h2>` des neu sichtbaren Bereichs (`focusView()`, setzt bei Bedarf `tabindex="-1"`)
  — analog zum SPA-Routenwechsel-Muster, WCAG-konform statt einfach nur visuell
  umzuschalten.
- **`js/settings.js` — `applyFlags()`:** Die Zeile, die bei abgeschaltetem
  `multiRecipes`-Flag den `.nav-item[data-goto="rezepte"]` ausblendet, existierte
  bereits aus der Mobil-Umsetzung; ihr Kommentar behauptete fälschlich „Auf Desktop
  existiert kein `.nav-item`-Element, no-op dort" — seit diesem Feature stimmt das nicht
  mehr (Desktop hat jetzt genau denselben Selektor-Treffer). Kommentar auf den
  aktuellen Stand korrigiert, keine Verhaltensänderung (der Code selbst war schon
  korrekt, traf nur vorher tatsächlich nichts auf Desktop).
- **Accessibility-Fix während des gezielten Audits** (`accessibility-expert`-Agent, nur
  auf die neuen Desktop-Nav-Stellen fokussiert): **WCAG 4.1.3 (Status Messages, Level
  AA)** — `announceView()` setzte `#viewAnnounce`s `textContent` direkt ohne
  vorheriges Leeren; bei zwei Bereichswechseln mit identischem Label hintereinander
  (z. B. versehentlich zweimal „Rechner" anklicken) hätten Screenreader die zweite
  Ansage ggf. unterdrückt — dasselbe, bereits in v3.25.0 an `#pdfGuideLiveMsg`
  behobene Muster. Fix: Live-Region wird zuerst geleert, der Text erst im nächsten
  Tick (`setTimeout(…, 50)`) gesetzt. Alle übrigen geprüften Punkte (Fokus-Falle/
  Tab-Reihenfolge im Panel inkl. `#navMobileLink`, Escape-Handling, `aria-expanded`/
  `aria-controls`, `role="dialog"`/`aria-modal`, Kontraste der neuen Farben, Klickziele,
  Fallback ohne JS) ohne Befund.
- **Nebenbefund fürs Backlog (nicht behoben, außerhalb des Scopes dieses Audits):**
  dasselbe Live-Region-Muster (kein Clear-Reset vor dem Setzen) steckt 1:1 identisch im
  `announceView()` des bestehenden Mobil-Inline-Scripts (`pizza-rechner-mobile.html`) —
  dort laut Auftrag nicht angefasst. Beim nächsten Zyklus, der die Mobil-Seite ohnehin
  berührt, mitziehen (ebenso das schon länger bekannte `#recipeIOLiveMsg`-Muster aus
  dem v3.25.0-Backlog-Eintrag).
- **Bewusst NICHT angefasst:** `pizza-rechner-mobile.html` und `css/mobile.css` selbst
  (nur Versions-Query-Strings hochgezogen, keine strukturelle Änderung — das Mobil-Muster
  war schon vorher fertig und ist die Vorlage für dieses Feature); keine Änderung an
  Rechenlogik (`js/calc.js`/`js/schedule.js`/`js/guide.js`).

**Tests:** reine Markup-/CSS-/UI-Glue-Änderung ohne Auswirkung auf Rechenlogik —
`tests/test.html` bleibt unverändert bei **498** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Interaktiv per
Headless-Edge-CDP (WebSocket, `--remote-allow-origins=*`) auf einer isolierten Kopie
gegen das echte DOM verifiziert: Hamburger-Button öffnet/schließt das Panel
(`aria-expanded` synchron), Klick auf „Rezepte"/„Zeitplan"/„Einstellungen"/„Rechner"
schaltet jeweils korrekt zwischen den vier Bereichen um (nur der gewählte Container ist
sichtbar, alle anderen inkl. der Anleitungs-`<section>` haben `hidden`), Live-Region
meldet „Ansicht: …", Fokus springt auf die `<h2>` des neuen Bereichs, Escape schließt
das Panel und stellt den vorherigen Fokus wieder her, das `multiRecipes`-Flag blendet
sowohl `#recipesCard` als auch den passenden `.nav-item` korrekt aus, keine
JavaScript-Konsolenfehler während des gesamten Durchlaufs.

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html` (nur `?v=`),
`css/styles.css`, `js/settings.js` (nur Kommentar). `?v=` auf `3.26.0` gezogen
(Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.26.0 - Burgermenü-Navigation auch auf Desktop/` enthält den
vollständigen Schnappschuss.

## PDF-Export der Anleitung (v3.25.0)

Neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt. Motivation:
der bestehende „Anleitung drucken"-Button (v3.9.0, `js/print.js`) braucht weiterhin den
Browser-Druckdialog samt manueller „Als PDF speichern"-Auswahl — ein direkter
Download-Button macht das Sichern der Anleitung als Datei einfacher/schneller. Scope
laut Feature-Definition: nur die Schritt-für-Schritt-Anleitung, keine Änderung an der
bestehenden Druckansicht/dem „Anleitung drucken"-Button, kein PDF-Export für andere
Bereiche (Einkaufsliste, Ergebnis-Panel), keine Cloud-/Server-Komponente.

**Technische Entscheidung (im Feature-Auftrag ausdrücklich zur eigenen Prüfung gestellt):
kein jsPDF/keine externe Bibliothek.** Die App läuft komplett offline per `file://`-
Doppelklick, ohne Build-Tools/Bundler/npm/CDN — eine Fremdbibliothek müsste als
vollständig gebündelte Datei im Projekt liegen (zusätzliche Lizenz-/Wartungslast, oft
mehrere hundert KB für einen simplen Text-Report). Der Anleitungsinhalt ist reiner
strukturierter Text (Überschriften, Absätze, kurze Hinweiszeilen) — dafür reicht ein von
Hand erzeugtes PDF nach klassischer PDF-1.4-Syntax (Catalog/Pages/Page/Content-Stream)
mit den Basis-14-Schriftarten Helvetica/Helvetica-Bold (WinAnsiEncoding, in jedem
PDF-Viewer eingebaut, kein Font-Embedding nötig) komplett aus. Passt damit zur
bestehenden „alles selbst geschrieben, nichts nachgeladen"-Linie (vgl. den
handgeschriebenen `.ics`-Kalendereintrag in `js/timer.js`, den Base64-Teilen-Link in
`js/share.js`).

- **Neues Modul `js/pdf.js`:**
  - `collectGuideContent()`: liest die **bereits gerenderte** Anleitung direkt aus dem DOM
    (`#guideSummary`/`#flourWarn`/`#guideSteps`) statt die Bau-Logik aus `js/guide.js` zu
    duplizieren — die Anleitung ist zum Klick-Zeitpunkt immer aktuell (reaktive
    Neuberechnung bei jeder Eingabe). Baut eine Liste strukturierter Blöcke
    (`title`/`summary`/`warn`/`schedbar`/`day`/`stepTitle`/`body`/`tip`), inkl. sauberer
    Trennung von Schritt-Titel, `.chip`- und `.timechip`-Zusatztext.
  - `sanitizeText()`: entfernt Emoji/Symbole ohne WinAnsi-Entsprechung (⏱️💡⚠️▶🍕 usw. +
    Variationsselektor, per Unicode-Bereichs-Regex) komplett statt sie durch „?" zu
    ersetzen, bildet gängige Sonderzeichen (Gedankenstriche, Anführungszeichen,
    Auslassungspunkte, Euro-Zeichen) auf ihre WinAnsi-Bytes ab, ersetzt „→" durch „->".
    Deutsche Umlaute/ß bleiben unverändert (Latin-1-Bereich = WinAnsi in diesem Bereich).
  - `layoutPages()`: bricht die Blöcke seitenweise um — eigene, angenäherte
    Helvetica-Zeichenbreiten-Tabelle (Standard-AFM-Metriken der Basis-14-Schrift, 1/1000
    em) fürs Wortumbruch, A4-Seiten (595,28 × 841,89 pt), automatischer Seitenumbruch bei
    Platzmangel. Helvetica-Bold nutzt dieselbe Tabelle + einen kleinen Aufschlag
    (`BOLD_FACTOR`) statt einer eigenen zweiten Metriktabelle — nur in kurzen
    Überschriften verwendet, lieber etwas zu früh als zu spät umbrechen.
  - `buildPdf()`: serialisiert die Seiten zu einem gültigen PDF-1.4-Byte-String (Catalog,
    Pages, zwei Font-Objekte, je ein Page-/Content-Stream-Objekt pro Seite, xref-Tabelle
    + Trailer). Farbakzente an die Website-Palette angelehnt (Warnungen in Tomatenrot,
    Tipps in Basilikum-Grün, s. `css/styles.css --tomato`/`--basil`).
  - `buildGuidePdfBytes()`: öffentliche reine Datenfunktion (kein DOM-Seiteneffekt),
    liefert ein `Uint8Array`. `downloadGuidePDF()`: baut daraus einen `Blob` +
    `URL.createObjectURL` + unsichtbaren `<a download>`-Klick (identisches, bereits
    bewährtes Muster wie der Rezepte-Export-Button, v3.21.0), Dateiname
    `pizza-anleitung-<ISO-Datum>.pdf`.
- **Neuer Button „Als PDF speichern" (`#pdfGuideBtn`)** direkt unter dem bestehenden
  `#shoppingRow` (den beiden Druck-Buttons), identisch in `pizza-rechner.html` und
  `pizza-rechner-mobile.html`. Eigener Block `#pdfGuideBlock` nach dem etablierten
  `#shareBlock`-Muster (v3.14.0): Hint-Text per `aria-describedby`, `.visually-hidden`
  Live-Region `#pdfGuideLiveMsg` (`role="status" aria-live="polite"`) für Erfolgs-/
  Fehler-Feedback.
- **Design-Entscheidung zur Sichtbarkeit:** `#pdfGuideBlock` teilt sich bewusst dasselbe
  Feature-Flag „shopping" (`js/settings.js`) wie `#shoppingRow` — inhaltlich ist „Als PDF
  speichern" eine dritte Export-Variante der Anleitung neben den beiden Druck-Buttons,
  kein eigenes neues Flag nötig. Schaltet der Nutzer die Druck-/Export-Zusatzfunktion ab,
  verschwindet der PDF-Button konsistent mit (Default des Flags ist AUS, wie bisher).
- **Accessibility-Fix während des gezielten Audits** (`accessibility-expert`-Agent, nur
  auf die drei neuen Markup-/Logik-Stellen fokussiert): **WCAG 4.1.3 (Status Messages,
  Level AA)** — `setPdfMsg()` setzte `#pdfGuideLiveMsg`s `textContent` direkt, ohne
  vorheriges Leeren. Da die Erfolgsmeldung („Anleitung als PDF gespeichert.") bei jedem
  Klick wortgleich identisch ist (anders als z. B. `#recipeIOLiveMsg`, deren Text meist
  eine variable Rezeptanzahl enthält), erkennen viele Screenreader bei zwei Klicks
  hintereinander keine echte DOM-Mutation und unterdrücken die zweite Ansage — für
  Tastatur-/Screenreader-Nutzer der einzige nicht-visuelle Beleg, dass der Klick
  funktioniert hat (kein sichtbarer Seiteneffekt außer dem Download selbst). Fix: die
  Live-Region wird zuerst geleert, der eigentliche Text erst im nächsten Tick
  (`setTimeout(…, 50)`) gesetzt — garantiert bei jedem Aufruf eine echte Inhaltsänderung.
  Alle übrigen geprüften Punkte (Markup-Struktur, Sichtbarkeitssteuerung per
  `style.display`) ohne Befund. *Nebenbefund fürs Backlog (nicht behoben, außerhalb des
  angefragten Scopes):* dasselbe latente Muster (kein Clear-Reset vor dem Setzen) liegt
  auch bei `#recipeIOLiveMsg` (`js/main.js`) vor, dort aber meist entschärft, weil die
  Meldung eine variable Rezeptanzahl enthält.
- **Bewusst NICHT angefasst:** die bestehende Druckansicht/`#shoppingRow`
  (`js/print.js`, `printGuide()`/`printShoppingList()`) bleibt vollständig unverändert;
  kein PDF-Export für Einkaufsliste oder Ergebnis-Panel; kein neues Feature-Flag; keine
  Cloud-/Server-Komponente.

**Tests** (`tests/test.html`, neue Sektion „21 · PDF-Export der Anleitung (js/pdf.js)",
+28 neue Prüfungen, 470 → **498**): reine Datenfunktionen getestet (`buildGuidePdfBytes()`/
`collectGuideContent()`/`sanitizeText()`), kein `window.print()`-artiger Seiteneffekt
unit-getestet (analog zu `buildShoppingList()` vs. `printGuide()`/`printShoppingList()`
in Sektion 15). Geprüft: PDF-Grundstruktur (Header `%PDF-1.4`, Catalog-/Page-Objekte,
Content-Stream, xref/Trailer, endet mit `%%EOF`); reale Anleitungstexte als
Klartext-Regressionsanker (Titel, „Kneten", „Stockgare", „Teiglinge formen",
„Tipp: "-Präfix); Biga-Vorteig erzeugt Tagesabschnitte + Vorteig-Schritte im PDF ohne
Fehler bei größerem Inhalt (mehrseitiges Layout); eine bekannte Mehl-Warnung
(Gärzeit zu lang, aus Sektion 6 wiederverwendet) fließt als „Achtung: "-präfigierter
Block ins PDF ein; `collectGuideContent()` liefert ausschließlich WinAnsi-taugliche
Blöcke (kein Emoji-Byte > 0xFF) mit allen erwarteten Block-Typen; `sanitizeText()`
entfernt Emoji vollständig, bildet „→" auf „->" ab, erhält deutsche Umlaute/ß, hält
Gedankenstriche WinAnsi-tauglich, liefert bei leerer/`undefined`-Eingabe einen leeren
String statt eines Fehlers. Alle 498 Prüfungen grün (Headless-Edge-Dump,
`msedge --headless --disable-gpu --virtual-time-budget=8000 --dump-dom` gegen die
absolute `file://`-URL — ein relativer Pfad liefert Edges interne Offline-Seite statt
der echten Datei). Kein `test-generator`-Lauf nötig (kein Logik-Eingriff in
`js/calc.js`/`js/schedule.js`/`js/guide.js` — reine Ergänzung eines neuen,
eigenständigen Moduls, Tests selbst geschrieben).

**Geändert:** `js/pdf.js` (neu), `js/settings.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.25.0` gezogen (Desktop +
Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu
gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.25.0 - PDF-Export der Anleitung/` enthält den vollständigen Schnappschuss.

## Zucker-Regler-Sync beim Rezept-Laden (v3.24.1)

Kleiner Bugfix, vom Nutzer per `/define-feature` strukturiert und bestätigt. Kein
neues Feature, keine Änderung an der Zucker-Berechnungslogik selbst — behebt den in
v3.22.0 entdeckten, damals bewusst außerhalb des Scopes gelassenen Nebenbefund
(s. Backlog-Eintrag unten).

**Problem:** `applyState()` (`js/storage.js`) übernahm beim Laden eines Rezepts
(über „Meine Rezepte" `#recipeSelect` **oder** die „Eigene Rezepte"-Optgroup im
`#preset`-Dropdown, s. v3.22.0) `state.sugar` zwar korrekt in `PZ.state` (per
`Object.assign`), rief aber nie `set.sugar(...)` auf — anders als bei allen übrigen
Reglern (`oil`, `flourTemp`, `hyd`, `salt` usw.), die direkt danach explizit
synchronisiert werden. Der Zucker-Slider im UI konnte dadurch nach dem Laden einen
veralteten Wert anzeigen, bis der Nutzer ihn selbst anfasst — die Berechnung selbst
war nie betroffen, da sie durchgehend `PZ.state.sugar` direkt liest.

- **Fix:** `applyState()` bekommt direkt nach der bestehenden `oil`-Fallback-Zeile
  einen analogen Aufruf: `if (state.sugar != null) set.sugar(state.sugar);` — mit
  demselben Null-Fallback wie bei `oil`/`flourTemp`, damit ältere gespeicherte
  Rezepte (vor v3.19.2, ohne `sugar`-Feld) den aktuell im UI stehenden Wert nicht
  mit `undefined` überschreiben.
- **Geprüft, ob andere Lade-Pfade denselben Fehler haben:** `applyPreset()`
  (`js/presets.js`, Zeile 79) rief `set.sugar(p.sugar)` bereits korrekt auf — dort
  bestand der Fehler nicht. Eine Codesuche nach `Object.assign(...state...)` im
  gesamten `js/`-Verzeichnis ergab nur die eine Stelle in `applyState()` — kein
  weiterer versteckter Lade-Pfad mit demselben Muster. `js/newrecipe.js` (eigener,
  unabhängiger `nrState` fürs Mini-Anlegeformular) ist bewusst nicht betroffen, da
  es nie in `PZ.state` schreibt (Kernidee des v3.22.0-Features).
- **Bewusst NICHT geändert:** keine Änderung an der Zucker-Berechnungsformel, an
  `applyPreset()` selbst (war schon korrekt) oder an anderen Reglern/Feldern.

**Tests** (`tests/test.html`, Sektion 16, +3 neue Prüfungen, 467 → **470**): `PZ.set`
ist in `test.html` ein No-op-Proxy-Stub (kein echtes DOM-Markup für Slider, s.
bestehender Kommentar an der Stub-Stelle) — der neue Test ersetzt ihn kurzzeitig
durch einen Spy-Proxy, der Aufrufe je Property protokolliert, ruft `PZ.loadRecipe()`
auf ein zuvor mit `sugar: 3.5` gespeichertes Rezept auf (nachdem `PZ.state.sugar`
zuvor künstlich auf `0` gesetzt wurde, um einen veralteten UI-Stand zu simulieren)
und stellt danach `PZ.set` wieder her. Geprüft: `set.sugar()` wird beim Laden
überhaupt aufgerufen, bekommt den korrekten gespeicherten Wert (3,5), und
`PZ.state.sugar` selbst ist ebenfalls korrekt übernommen. Alle 470 Prüfungen grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (eine einzelne, gezielt
selbst geschriebene Ergänzung an bestehender Stelle, keine Änderung an
`js/calc.js`/`js/schedule.js`/`js/guide.js`). Kein `accessibility-expert`- oder
`mobile-optimizer`-Lauf nötig (reine JS-Logik-Änderung, kein neues/verändertes
Markup, keine neue CSS — analog zur Begründung bei v3.20.1).

**Geändert:** `js/storage.js`, `tests/test.html`. `?v=` auf `3.24.1` gezogen
(Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.24.1 - Zucker-Regler-Sync beim Laden/` enthält den vollständigen
Schnappschuss.

## Umbenennung in „Teigmeister" (v3.24.0)

Kleines Vorhaben, vom Nutzer per `/define-feature` strukturiert und bestätigt. Kein
Backlog-Punkt, keine neue Idee des Orchestrators — reine Namenspräferenz: der
sichtbare App-Name wechselt von „Pizzateig-Rechner" zu „Teigmeister". Ausdrücklich
**kein** Rebranding auf Datei-/Repo-Ebene: Dateinamen (`pizza-rechner.html` usw.),
URLs, interne Code-Bezeichner und der Repo-Name bleiben unverändert — nur sichtbarer
Text im UI wechselt.

- **Geänderte sichtbare Textstellen** (Desktop `pizza-rechner.html`, Mobil
  `pizza-rechner-mobile.html`, `index.html`, `js/timer.js`):
  - `<title>` auf allen drei HTML-Seiten (`index.html`, Desktop, Mobil — Mobil-Titel
    weiterhin mit „· Mobil"-Suffix: „Teigmeister · Mobil").
  - `<h1>🍕 …</h1>` in Header (Desktop + Mobil).
  - `index.html`-Weiterleitungstext („Weiter zum Teigmeister …").
  - `<meta name="apple-mobile-web-app-title">` (Mobil) — bestimmt den Namen, der
    beim „Zum Home-Bildschirm hinzufügen" auf iOS unter dem Icon erscheint, vorher
    „Pizzateig" (Kurzform), jetzt „Teigmeister".
  - Der Beschreibungstext im `.ics`-Kalendereintrag des Gärzeit-Timers (`js/timer.js`,
    `icsDataUrl()`): „Erinnerung vom Teigmeister: …" statt „… vom Pizzateig-Rechner: …"
    — dieser Text erscheint sichtbar in der Kalender-App des Nutzers, zählt daher zum
    UI-Scope. Der rein technische `PRODID`-Header (`-//Pizzateig-Rechner//Timer//DE`)
    und die interne Kalender-UID (`@pizza-rechner`) wurden bewusst **nicht** angefasst
    — beides sind interne iCalendar-Bezeichner ohne Sichtbarkeit für den Nutzer,
    fallen unter die Abgrenzung „keine internen Code-Bezeichner".
- **Bewusst NICHT geändert:** Dateinamen (`pizza-rechner.html`,
  `pizza-rechner-mobile.html`, `pizza-rechner-mobile-standalone.html`, `index.html`
  selbst usw.), GitHub-Repo-Name, alle internen IDs/Variablennamen (`PZ`, `pizzaRechner`-
  localStorage-Key usw.), `README.md` und die beiden `*-KONTEXT.md`-Dateien (Projekt-/
  Prozessdokumentation, kein Teil der App-UI) sowie `tests/test.html` (internes
  Test-Tooling für Entwickler, kein Nutzer-UI — Titel/Überschrift dort bewusst bei
  „Pizzateig-Rechner — Tests" belassen).
- **Kein Accessibility-/Mobile-Audit nötig:** reiner Textinhalts-Austausch in bereits
  bestehenden Elementen (`<title>`, `<h1>`, `<meta>`-Attributwert) — keine neue/
  veränderte Struktur, kein neues Markup, keine neue CSS, keine ARIA-Änderung. Analog
  zur Begründung bei v3.20.1/v3.23.0 (reine Logik- bzw. CSS-Änderung ohne Markup-Wirkung)
  wird der Audit hier aus denselben Gründen ausgelassen.

**Tests:** reine Text-/Branding-Änderung ohne Auswirkung auf Rechenlogik —
`tests/test.html` bleibt unverändert bei **467** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (keine Änderung an
`js/calc.js`/`js/schedule.js`/`js/guide.js`). Visuell per Headless-Edge-Screenshot auf
Desktop (`pizza-rechner.html`) und Mobil (`pizza-rechner-mobile.html`) verifiziert:
Kopfbereich zeigt jetzt „🍕 Teigmeister", Layout/Abstände unverändert; per Textsuche
sichergestellt, dass keine der geänderten Dateien noch „Pizzateig-Rechner" enthält.

**Geändert:** `index.html`, `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`js/timer.js`. `?v=` auf `3.24.0` gezogen (Desktop + Mobil, Cache-Busting +
Footer-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.24.0 - Umbenennung Teigmeister/` enthält den vollständigen Schnappschuss.

## Card-Überschriften ohne Nummerierung (v3.23.0)

Kleines Vorhaben, vom Nutzer per `/define-feature` strukturiert und bestätigt. Kein
Backlog-Punkt, keine neue Idee des Orchestrators — reiner Wunsch des Nutzers: die
automatische „01 · "/„02 · "-Nummerierung vor jeder Card-Überschrift wurde als störend
empfunden und sollte weg (z. B. wurde aus „01 · Fertiges Rezept wählen" wieder „Fertiges
Rezept wählen").

- **Ursache/Umsetzung:** Die Nummerierung stand nie im HTML-Text, sondern wurde rein
  über CSS-Counter erzeugt (`css/styles.css`): `counter-reset:cardnum` auf `.wrap`,
  `counter-increment:cardnum` auf `.card`, sowie die eigentliche Anzeige über
  `.card h2::before{content:counter(cardnum,decimal-leading-zero) '  ·  '; …}`. Alle
  drei zusammengehörigen Regeln wurden ersatzlos entfernt (`.card h2::before` komplett
  gelöscht, die beiden `counter-*`-Deklarationen aus `.wrap` bzw. `.card` entfernt) —
  keine neue Regel, kein Ersatz-Layout nötig, da die restliche `.card h2`-Regel
  (Typografie, `border-bottom`) unverändert bleibt und ohne das `::before`-Pseudoelement
  einfach nur ohne vorangestellte Nummer rendert.
- **Betrifft automatisch Desktop und Mobil gleichermaßen**, da `css/styles.css` das
  gemeinsame Stylesheet beider Seiten ist (`css/mobile.css` enthielt keine eigene
  Counter-Regel) — keine Änderung an `pizza-rechner.html`, `pizza-rechner-mobile.html`
  oder irgendeinem JS-Modul nötig.
- **Bewusst NICHT angefasst** (laut Scope/Abgrenzung): die Nummerierung der
  Schritt-für-Schritt-Anleitung (`.step .num`, eigene, funktional sinnvolle Reihenfolge
  der Anleitungsschritte) ist ein komplett getrenntes Markup/CSS-Element und bleibt
  unverändert; keine sonstigen Layout-/Struktur-Änderungen an den Cards.

**Tests:** reine CSS-Änderung ohne Auswirkung auf Rechenlogik — `tests/test.html` bleibt
unverändert bei **467** Prüfungen, alle grün (Headless-Edge-Dump). Kein
`test-generator`-Lauf nötig (keine Änderung an `js/calc.js`/`js/schedule.js`/`js/guide.js`).
Visuell per Headless-Edge-Screenshot auf Desktop (`pizza-rechner.html`) und Mobil
(`pizza-rechner-mobile.html`) verifiziert: alle Card-Überschriften („Fertiges Rezept
wählen", „Meine Rezepte", „Neues Rezept anlegen", „Grundeinstellungen" usw.) erscheinen
jetzt ohne vorangestellte Nummer, Layout/Abstände unverändert. Kein
`accessibility-expert`- oder `mobile-optimizer`-Lauf nötig (keine Markup-/Strukturänderung,
nur eine rein dekorative CSS-Regel entfernt, die zuvor als generiertes Pseudoelement ohne
eigene Semantik lief).

**Geändert:** `css/styles.css`. `?v=` auf `3.23.0` gezogen (Desktop + Mobil,
Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.23.0 - Card-Ueberschriften ohne Nummerierung/` enthält den vollständigen
Schnappschuss.

## Eigenständiges Rezept-Anlegen-Formular + Presets-Dropdown-Integration (v3.22.0)

Neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt. Auslöser:
zum Anlegen eines neuen Rezepts musste man bisher die über die ganze Seite verstreuten
Hauptregler umstellen (was auch die gerade laufende Berechnung/Anleitung mit veränderte)
und erst danach in der „Meine Rezepte"-Card speichern. Jetzt gibt es dafür eine eigene,
vom Hauptrechner komplett unabhängige Card.

- **Neue Card „Neues Rezept anlegen"** (`#newRecipeCard`, Desktop direkt nach
  `#recipesCard`; Mobil als `<details class="card">` in der `data-view="rezepte"`-Ansicht,
  ebenfalls direkt nach `#recipesCard`). Enthält drei Unterabschnitte, die die bestehenden
  Haupt-Cards strukturell 1:1 spiegeln, aber mit eigenem `nr`-ID-Präfix (`#nrHyd` statt
  `#hyd` usw.): **Grundeinstellungen** (Mehl, Anzahl Teiglinge, Gewicht/Teigling, Hydration,
  Salz, Öl, Zucker), **Methode & Hefe** (Teigführung, Vorteig-Anteil, Biga-Hydration,
  Vorteig-Reife-Stufen, Hefe-Art, Hefemenge), **Teigtemperatur & Eiswasser** (DDT, Raum-
  und Mehltemperatur, Knetart) — plus Namensfeld + „Rezept anlegen"-Button + Live-Region.
  **Bewusst ohne Zeitplan-Felder** (Scope der Feature-Definition) **und ohne „Kalte
  Gare"-Auswahl** (im Scope nicht als eigenes Feld genannt, da es eher eine Zeitplan-nahe
  Entscheidung ist) — neu angelegte Rezepte bekommen dafür feste Defaults (`coldStage:
  'balls'`, `timeMode: 'start'`, `timeISO: ''`), die nach dem Laden im Hauptrechner normal
  änderbar sind.
- **`js/newrecipe.js` (neues Modul):** eigener, komplett unabhängiger Mini-State
  (`nrState`, Schema identisch zu `PZ.state`) + eigene Kopien von `link()`/`seg()`/
  `applyMethod()`/den Vorteig-Reife-Stufen-Funktionen aus `js/ui.js` — **ohne** einen
  einzigen `PZ.calc()`-Aufruf und **ohne** Schreibzugriff auf `PZ.state`. Das ist die
  Kernidee des Features: das Anlegen eines Rezepts beeinflusst die aktuell laufende
  Berechnung/Anleitung auf der Hauptseite in keiner Weise. Klick auf „Rezept anlegen"
  baut aus `nrState` + den festen Defaults ein vollständiges, mit `applyState()`
  kompatibles state-Objekt und übergibt es an die neue Speicherfunktion (s. u.).
- **`js/storage.js` — neue Funktion `addRecipeFromState(name, state)`:** fügt ein Rezept
  aus einem **beliebigen** übergebenen state-Objekt hinzu (nicht aus `PZ.state`, im
  Unterschied zu `save()`/`saveAsNew()`) und lässt `data.activeId` **unverändert** — das
  neu angelegte Rezept wird **nicht** automatisch aktiv/geladen. Sonst hätte ein Anlegen
  über das Mini-Formular beim nächsten Seitenaufruf plötzlich dieses (statt des zuvor
  aktiven) Rezepts geladen — ein Bruch der „beeinflusst den aktuellen Zustand nicht"-
  Kernidee. Name-Fallback identisch zu `saveAsNew()`: leer/nur Leerzeichen →
  `nextDefaultName()` („Rezept N"), sonst der übergebene (getrimmte) Name, auch wenn er
  ein bestehendes Rezept dupliziert (keine Uniqueness-Logik, wie schon bei `saveAsNew()`).
- **Presets-Dropdown (`#preset`) bekommt eine neue, dynamisch befüllte Optgroup „Eigene
  Rezepte"** (`#presetCustomGroup`, leer im HTML, per JS befüllt): jede Option trägt den
  Wert `recipe:<id>` statt eines `PZ.PRESETS`-Keys. `PZ.refreshPresetCustomRecipes()`
  (`js/newrecipe.js`) baut nur den Inhalt dieser einen Optgroup neu auf (nicht das ganze
  Select), erhält dabei die aktuelle Auswahl. Läuft automatisch bei **jeder** Änderung an
  der Rezept-Bibliothek — `js/main.js`s `refreshRecipeSelect()` wurde um einen Aufruf von
  `PZ.refreshPresetCustomRecipes()` ergänzt (ein gemeinsamer Aufrufpunkt statt Verdrahtung
  an jeder einzelnen Stelle: Neu/Umbenennen/Löschen/Import/Anlegen über das neue Formular).
- **`js/presets.js` — `#preset`-Change-Handler dispatcht jetzt zwischen zwei
  Datenquellen:** Werte mit `recipe:`-Präfix rufen `PZ.loadRecipe(id)` auf (1:1 derselbe
  Pfad wie „Meine Rezepte" → Laden über `#recipeSelect`, keine duplizierte Logik),
  `presetDesc` bekommt eine Meldung mit dem Rezeptnamen. Alle anderen Werte laufen
  weiterhin durch die bestehende `applyPreset()`. `lastAppliedPresetKey` (steuert den
  Zucker-Reset beim Verlassen von „New York Style", s. v3.20.1) wird auch beim Laden
  eines eigenen Rezepts aktualisiert, damit ein anschließender Wechsel weg von „New York
  Style" weiterhin korrekt erkannt wird.
- **Die Option „— Eigene Einstellung —" (`value=""`) wurde aus `#preset` entfernt**
  (Scope-Vorgabe). Eine manuelle Reglereingabe setzt `#preset.value = ''` weiterhin
  zurück (Bestandslogik, `js/presets.js`) — ohne passende `<option>` zeigt der native
  Select den Zustand jetzt einfach ohne sichtbare Auswahl an, statt eine eigene Option
  dafür vorzuhalten.
- **Accessibility-Fix während des gezielten Audits** (`accessibility-expert`-Agent, nur
  auf die neuen Teile fokussiert): der native `<select>` landete beim Löschen eines
  gerade im `#preset`-Dropdown ausgewählten eigenen Rezepts bei `selectedIndex = -1` —
  kein sichtbarer Optionstext, kein programmatisch bestimmbarer Wert (WCAG 4.1.2). Fix:
  eine unsichtbare, nicht wählbare Platzhalter-Option `<option value="" disabled
  hidden>Kein Rezept ausgewählt</option>` als erstes Kind des Selects (Desktop + Mobil) —
  `hidden` nimmt sie aus der sichtbaren Optionsliste, `disabled` verhindert jede Auswahl
  per Maus/Tastatur, sie dient nur als gültiger Rückfallwert für Skript-Zuweisungen. Kein
  Widerspruch zur obigen Entfernung von „Eigene Einstellung" — die ist weiterhin
  unwiederbringlich weg, dies ist eine rein technische, unsichtbare Absicherung. Zusätzlich
  `if (sel.selectedIndex === -1) sel.value = '';` in `refreshPresetCustomRecipes()`. Alle
  übrigen Kontrollen (Label-Verknüpfung, `aria-pressed`, `aria-valuetext`, Live-Region,
  Überschriftenhierarchie) waren bereits korrekt (1:1 Kopien der etablierten, schon
  auditierten Haupt-Regler) — keine weiteren Befunde.
- **Bewusst NICHT angefasst:** die bestehende „Meine Rezepte"-Verwaltung
  (Umbenennen/Löschen/Laden über `#recipeSelect`) bleibt unverändert; kein Cross-Sync der
  Auswahl zwischen `#recipeSelect` und `#preset` über das hier gebaute hinaus (beide
  bleiben, wie seit v3.10.0, unabhängig bedienbare Dropdowns); Export/Import (v3.21.0)
  unangetastet; die Hauptregler/Karten auf der übrigen Seite bleiben unverändert bedienbar.
- **Nebenbefund fürs Backlog (nicht behoben, außerhalb des Scopes):** `applyState()` in
  `js/storage.js` setzt `state.sugar` beim Laden eines Rezepts zwar korrekt in `PZ.state`
  (per `Object.assign`), ruft aber nie `set.sugar(...)` auf — der Zucker-Slider im UI zeigt
  nach dem Laden über `#recipeSelect` **oder** `#preset` (`recipe:...`) ggf. einen veralteten
  Wert an, bis der Nutzer den Regler selbst anfasst. Die Berechnung selbst ist korrekt
  (nutzt `PZ.state.sugar` direkt), nur die Anzeige hinkt hinterher. Vorbestehend, nicht
  durch dieses Feature verursacht — beim nächsten Storage-bezogenen Zyklus mit beheben.

**Tests** (`tests/test.html`, Sektion 16, +14 neue Prüfungen, 453 → **467**): neue
Testfälle direkt an die bestehende „Speichern & Laden"-Sektion angehängt (gleiches
`withCleanStorage()`-Muster). Geprüft: `addRecipeFromState()` legt ein Rezept mit den
übergebenen (nicht den PZ.state-)Werten an, ohne `PZ.state` oder `activeId` zu verändern,
neues Rezept ist nicht automatisch aktiv; automatische „Rezept N"-Namen bei leerem/nur-
Leerzeichen-Namen (analog `saveAsNew()`); Anlegen in eine komplett leere Bibliothek
(`activeId` bleibt `null`, Rezept lässt sich trotzdem normal laden). Alle 467 Prüfungen
grün (Headless-Edge-Dump). Die UI-Verdrahtung selbst (`js/newrecipe.js`, `js/presets.js`s
Dispatch-Logik) läuft in `tests/test.html` nicht mit (kein DOM-Markup für die neue Card,
`presets.js`/`main.js`/`newrecipe.js` sind dort wie gehabt nicht eingebunden) — stattdessen
per Headless-Edge-CDP (WebSocket, `--remote-allow-origins=*`) auf Desktop **und** Mobil
gegen das echte DOM verifiziert: Hauptzustand auf einen markanten Wert gesetzt (Teiglinge
6, Hydration 77 %) → Mini-Formular auf andere Werte gestellt (Teiglinge 12, Hydration
68 %, inkl. Wechsel auf Biga + Vorteig-Reife-Stufe „48 h") → „Rezept anlegen" → Hauptzustand
bleibt exakt bei 6/77 unverändert, neues Rezept korrekt mit 12/68/Biga in der Bibliothek,
taucht sofort in „Meine Rezepte" **und** in der neuen „Eigene Rezepte"-Optgroup auf → Auswahl
dort lädt das Rezept korrekt (Hauptzustand wird jetzt 12/68/Biga, `#recipeSelect`
synchronisiert automatisch mit). Identisches Ergebnis auf Desktop und Mobil.

**Geändert:** `js/storage.js`, `js/presets.js`, `js/main.js`, `js/newrecipe.js` (neu),
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.22.0`
gezogen (Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.22.0 - Neues Rezept anlegen + Presets-Integration/` enthält den
vollständigen Schnappschuss.

## Rezepte-Backup: Export/Import aller gespeicherten Rezepte als Datei (v3.21.0)

Neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt. Auslöser:
eine Nutzerfrage, wie sicher selbst erstellte Rezepte sind ("gehen die nicht hops wenn
ich Cache lösche?") — `localStorage` (in dem `js/storage.js` seit v3.10.0 mehrere
benannte Rezepte hält) geht beim Löschen von Websitedaten ersatzlos verloren, es gibt
keine Cloud-Sicherung, und `localStorage` ist zudem **pro Origin getrennt** (eine lokale
`file://`-Kopie und die GitHub-Pages-Live-Version haben getrennte Rezept-Bestände — kein
Bug, aber ein Grund mehr für eine Datei-Brücke zwischen beiden). Der bestehende
Teilen-Link (v3.14.0) deckt nur den gerade aktiven Zustand ab, nicht den kompletten
Rezept-Bestand. Bewusst **kein** Cloud-Backend/Account/automatische Synchronisation —
der Nutzer hat sich in der vorausgehenden Diskussion explizit für die reine
Datei-Export/Import-Lösung entschieden, um die Offline-Philosophie der App nicht zu
brechen (s. Abschnitt „Warum keine KI / kein Internet?" oben).

- **Neue Buttons in der bestehenden „Meine Rezepte"-Card** (`#recipesCard`, identisch in
  `pizza-rechner.html` und `pizza-rechner-mobile.html`, direkt unter dem bestehenden
  Umbenennen/Löschen-Zeilenpaar): „Als Datei sichern" (`#recipeExportBtn`) und „Aus
  Datei laden" (`#recipeImportBtn`) + ein versteckter `<input type="file"
  id="recipeImportInput" accept="application/json,.json">`. Neuer Hinweistext
  `#recipeIOHint` erklärt kurz den Zweck, neue Live-Region `#recipeIOLiveMsg`
  (`role="status" aria-live="polite"`, `.visually-hidden`) für Erfolgs-/Fehler-Feedback
  nach Export/Import, analog zum etablierten `#shareLiveMsg`-Muster aus v3.14.0.
- **`js/storage.js` — zwei neue reine Datenfunktionen, kein DOM-Zugriff:**
  - `PZ.exportRecipes()`: liest den kompletten Store (`readStore()`) und gibt
    `{format:'pizzaRechnerBackup', version:1, exportedAt:<ISO-String>, recipes:[…]}`
    zurück — **alle** gespeicherten Rezepte, nicht nur `PZ.state`/das aktive Rezept
    (Unterschied zum Teilen-Link, der bewusst nur den aktuellen State kodiert).
  - `PZ.importRecipes(parsed)`: **fügt** die Rezepte aus `parsed.recipes` den
    bestehenden hinzu, überschreibt/löscht **nie** etwas. Wirft einen `Error`, wenn
    `parsed` kein Objekt mit `recipes`-Array ist (z. B. `null`, `{}`, ein Array) — der
    Aufrufer fängt das ab und zeigt eine anwenderfreundliche Meldung, analog zum
    defensiven Fehlerverhalten von `js/share.js`. Einzelne kaputte Einträge **innerhalb**
    einer sonst gültigen Datei brechen den Import nicht ab: `isValidRecipeEntry()`
    prüft je Eintrag ein plausibles `state`-Objekt (dieselbe Heuristik wie
    `looksLikeState()` in `js/share.js` — `state.balls != null || state.hyd != null`),
    ungültige Einträge werden übersprungen und gezählt (`result.skipped`).
  - **Merge-Logik bei Namenskollision** (vom Nutzer in der Feature-Definition
    festgelegt: neue ID/Name statt Überschreiben, nichts geht verloren): jeder
    importierte Eintrag bekommt **immer** eine frische `id` (`makeId()`) — verhindert
    jede Kollision mit vorhandenen Rezept-IDs. Kollidiert der **Name** mit einem
    bestehenden Rezept, wird er über `uniqueImportName()` eindeutig gemacht: erste
    Kollision → `"<Name> (importiert)"`, jede weitere → `"<Name> (importiert 2)"`,
    `"<Name> (importiert 3)"`, … Ergebnis: `{imported, skipped, total}` für die
    Erfolgsmeldung im UI.
- **`js/main.js` — UI-Verdrahtung:**
  - Export-Klick: `PZ.exportRecipes()` → `JSON.stringify(…, null, 2)` → `Blob` →
    `URL.createObjectURL` → unsichtbarer `<a download>`-Klick (offline-tauglich, kein
    Server), Dateiname `pizza-rezepte-backup-<ISO-Datum>.json`. Bei noch komplett leerer
    Rezeptliste (nichts zu sichern) bricht der Export mit einer Live-Region-Meldung ab,
    statt eine leere Backup-Datei herunterzuladen.
  - Import-Klick öffnet über `recipeImportInput.click()` den nativen Datei-Dialog; nach
    Auswahl liest ein `FileReader` die Datei als Text, `JSON.parse` + `PZ.importRecipes()`
    laufen in einem `try/catch` — Erfolg **und** jeder Fehlerfall (kaputtes JSON, falsches
    Format, 0 gültige Einträge) enden in einer konkreten `#recipeIOLiveMsg`-Meldung, nie
    in einem stillen Fehlschlag oder Absturz. `refreshRecipeSelect()` läuft nach
    erfolgreichem Import, damit die neuen Rezepte sofort im Dropdown auftauchen.
- **Accessibility-Fix während des Audits** (`accessibility-expert`-Agent, gezielt auf
  dieses neue UI-Stück): `#recipeImportInput` ist zwar per `.visually-hidden` (clip-
  basiert, nicht `display:none` — bleibt fokussierbar) versteckt, landete aber ohne
  Gegenmaßnahme unsichtbar in der Tab-Reihenfolge, und der native Datei-Dialog verschob
  den Fokus dorthin, ohne ihn nach dem Schließen zurückzuholen (WCAG 2.4.7/2.4.3). Fix:
  `tabindex="-1"` auf `#recipeImportInput` (raus aus der sequenziellen Tab-Reihenfolge,
  weiterhin per Skript klickbar) + ein einmaliger `window`-`focus`-Listener in
  `js/main.js`, der den Fokus nach Schließen des Dialogs (Auswahl **oder** Abbruch)
  explizit zurück auf `#recipeImportBtn` holt, falls er noch auf dem unsichtbaren Input
  steht. Alles andere ohne Befund: Label-Verknüpfung, Button-Beschriftungen, Live-Region,
  44×44px-Touch-Ziele auf Mobil (generische `button{min-height:44px}`-Regel), kein
  unterdrückter Fokusring.
- **Bewusst NICHT angefasst:** kein Cloud-Backend, kein Account, keine automatische/
  geräteübergreifende Synchronisation, keine wiederkehrende Erinnerung ans Exportieren,
  der bestehende Teilen-Link (`js/share.js`) bleibt vollständig unverändert (weiterhin
  nur der aktuelle State, kein Bezug zum neuen Backup-Format).

**Tests** (`tests/test.html`, Sektion 20, +32 neue Prüfungen, 421 → **453**): neue
Sektion „Rezepte-Backup (js/storage.js) — Export/Import als Datei", nach demselben
`withCleanStorage()`-Muster wie Sektion 16 (sichert/stellt einen eventuell vorhandenen
echten `localStorage`-Inhalt vor/nach jedem Testblock wieder her). Geprüft:
`exportRecipes()`-Struktur (alle Felder, alle Rezepte statt nur `PZ.state`),
`importRecipes()` in eine leere Bibliothek (neue IDs, Namen 1:1 übernommen),
Namenskollision (bestehendes Rezept bleibt unangetastet, Duplikate bekommen
`"(importiert)"`/`"(importiert 2)"`-Namen), doppelter Import derselben Datei (kein
Datenverlust, beide Kopien bleiben erhalten), leere/korrupte Eingabe (`null`, `{}`, ein
Array — jeweils definierter `Error` statt stillem no-op oder Absturz, bestehende Rezepte
bleiben unangetastet), Datei mit teils kaputten Einträgen (gültige werden importiert,
kaputte übersprungen und gezählt, kein Abbruch des gesamten Imports), vollständige
Rundreise `exportRecipes()` → `JSON.stringify` → `JSON.parse` → `importRecipes()` (exakt
der Pfad, den Datei-Download + Datei-Upload in der echten App durchlaufen) — alle Werte
bleiben exakt erhalten. Alle 453 Prüfungen grün (Headless-Edge-Dump). Zusätzlich per
Headless-Edge-CDP (WebSocket, `--remote-allow-origins=*`) auf Desktop **und** Mobil den
kompletten Ablauf gegen das echte DOM verifiziert: zwei Rezepte anlegen → Export-Klick
löst ohne Fehler aus + korrekte Live-Region-Meldung ("2 Rezepte als Datei gesichert.") →
Store leeren (simuliert neuen Browser/gelöschte Websitedaten) → Import der exportierten
JSON-Daten → beide Rezepte korrekt im Store **und** im `#recipeSelect`-Dropdown → erneuter
Import derselben Datei in den bereits gefüllten Store → beide Original-Rezepte bleiben,
zwei weitere mit `"(importiert)"`-Suffix kommen hinzu (kein Datenverlust) → kaputtes JSON
wirft beim Parsen wie erwartet. Identisches Ergebnis auf beiden Seiten.

**Geändert:** `js/storage.js`, `js/main.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.21.0` gezogen (Desktop +
Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu
gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.21.0 - Rezepte-Backup Export-Import/` enthält den vollständigen
Schnappschuss.

## Zucker-Regler nur bei New-York-Style-Preset oder eigener Einstellung (v3.20.1)

Bugfix an der in v3.19.2/v3.19.3 bewusst so designten Sichtbarkeits-Logik, vom Nutzer
nach praktischer Nutzung per `/define-feature` strukturiert und bestätigt. Kein
Backlog-Punkt, kein neues Feature, keine Änderung an Berechnungslogik/Preset-Inhalt.

**Problem (v3.19.3):** `#sugarBlock` war sichtbar, wenn **entweder** das Feature-Flag
`newYorkStyle` manuell an war **oder** das Preset „New York Style" aktiv gewählt war —
eine ODER-Verknüpfung, die den Zucker-Regler bei aktivem Flag für **jedes** Preset
freischaltete, nicht nur für „New York Style". Dadurch ließ sich versehentlich Zucker
in Presets wie Napoli oder Teglia einstellen, wo er nicht hingehört.

**Fix:** `#sugarBlock` ist jetzt nur noch sichtbar, wenn (a) das Preset „New York
Style" gerade aktiv im `#preset`-Select gewählt ist, **oder** (b) „Eigene Einstellung"
aktiv ist (kein/unbekanntes Preset im `#preset`-Select) **und** das Flag manuell an
ist. Bei jedem anderen konkreten Preset (`napoli_klassisch`, `napoli_65`,
`napoli_kalt`, `schnell`, `napoli_biga`, `napoli_poolish`, `teglia`) bleibt der
Zucker-Regler verborgen, unabhängig vom Flag-Zustand.

- **`js/settings.js` (`applyFlags()`):** liest weiterhin live `#preset`-Wert und
  `PZ.PRESETS` aus, prüft aber jetzt **exakt den Preset-Key** (`presetKey ===
  'newyork_style'`) statt (wie in v3.19.2/v3.19.3) das generische `flag`-Feld des
  Presets. Das Flag selbst wirkt nur noch, wenn „Eigene Einstellung" aktiv ist
  (`isCustomSelection = !presetKey || !PZ.PRESETS[presetKey]`). Die Checkbox
  `#flagNewYorkStyle` bleibt unverändert ein reiner Spiegel des persistenten Flags
  (nicht der kombinierten Sichtbarkeit) — unangetastet von diesem Fix.
- **`js/presets.js` (`applyPreset()`):** neuer modulweiter State `lastAppliedPresetKey`
  verfolgt, welches Preset zuletzt aktiv über das `#preset`-Dropdown angewendet wurde
  (nicht dasselbe wie der reine `#preset`-Wert, der sich schon bei jeder manuellen
  Reglereingabe still auf `''` zurücksetzt). Wechselt der Nutzer **weg** von „New York
  Style" (zu einem anderen Preset ODER zu „Eigene Einstellung"), wird `state.sugar`
  zusätzlich per `set.sugar(0)` zurückgesetzt — sonst bliebe ein zuvor gesetzter
  Zucker-Wert unbemerkt im State stehen, auch wenn der Regler jetzt (korrekt) verborgen
  ist. Reine Reglereingaben (z. B. an der Hydration drehen) lösen diesen Reset nicht
  aus — nur ein expliziter Wechsel über das `#preset`-Dropdown.
- **Bewusst NICHT geändert:** „Eigene Einstellung" + manueller Flag zeigt den Regler
  weiterhin (Abgrenzung aus der Feature-Definition); keine Änderung an der
  Zucker-Berechnungsformel oder am „New York Style"-Preset selbst; kein neues
  Feature-Flag-Verhalten für andere Flags.

**Tests** (`tests/test.html`, Sektion 18, +3 neue Prüfungen, 418 → **421**): der
bestehende Render-Effekt-Block wurde erweitert statt neu geschrieben — `PZ.PRESETS`-Stub
um ein zweites, „fremdes" Preset (`napoli_klassisch`) ergänzt, dafür auch eine
entsprechende `<option>` im `#preset`-Stub-`<select>` ergänzt (ohne passende `<option>`
setzt der Browser `.value` bei einem unbekannten Preset-Key sonst still auf `''` zurück
— das hätte den neuen Testfall unbemerkt am eigentlichen Preset-Wechsel vorbeigeführt;
beim ersten Durchlauf genau so aufgefallen und korrigiert). Geprüft: Flag an + anderes
konkretes Preset aktiv → `#sugarBlock` bleibt verborgen (der eigentliche Bugfix),
Checkbox bleibt dabei weiterhin „an" (reiner Flag-Spiegel, unbeeinflusst von der
Sichtbarkeit), zurück zu „Eigene Einstellung" mit weiterhin aktivem Flag → wieder
sichtbar. Alle 421 Prüfungen grün (Headless-Edge-Dump). Der `state.sugar`-Reset beim
Verlassen von „New York Style" lässt sich in `tests/test.html` nicht direkt abdecken
(`js/presets.js` ist dort bewusst nicht geladen, s. Kommentar an der bestehenden
Preset-Stub-Stelle) — stattdessen per Headless-Edge-CDP (WebSocket,
`--remote-allow-origins=*`) auf Desktop **und** Mobil verifiziert: Preset „New York
Style" wählen (Zucker=2, Regler sichtbar) → anderes Preset wählen (Zucker=0, Regler
verborgen); Flag manuell an + anderes Preset → Regler bleibt verborgen; zurück zu
„Eigene Einstellung" mit aktivem Flag → Regler wieder sichtbar; Zucker manuell auf 3,5
gesetzt, dann „New York Style" → anderes Preset gewählt → Zucker wieder 0. Identisches
Ergebnis auf beiden Seiten.

**Kein Accessibility-/Mobile-Audit nötig:** reine JS-Logik-Änderung in
`js/settings.js`/`js/presets.js`, kein neues/verändertes Markup, keine neue CSS.

**Geändert:** `js/settings.js`, `js/presets.js`, `tests/test.html`. `?v=` auf `3.20.1`
gezogen (Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.20.1 - Zucker-Regler nur bei New York Style/` enthält den vollständigen
Schnappschuss.

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

## New York Style: nur temporäre statt dauerhafte Zucker-Regler-Sichtbarkeit (v3.19.3)

**⚠️ In v3.20.1 weiter verschärft, hier nur zur historischen Einordnung stehen
gelassen:** die hier eingeführte ODER-Verknüpfung (Flag ODER aktives Preset) schaltete
den Zucker-Regler bei aktivem Flag noch für JEDES Preset frei, nicht nur für „New York
Style" selbst. In v3.20.1 wirkt das Flag nur noch bei „Eigene Einstellung" — s. Abschnitt
„Zucker-Regler nur bei New-York-Style-Preset oder eigener Einstellung (v3.20.1)" ganz
oben (= aktueller Stand).

Korrektur am gerade erst umgesetzten Feature aus v3.19.2 (s. Abschnitt „Zucker-Feld /
New York Style" direkt darunter), vom Nutzer per `/define-feature` strukturiert. Kein
neues Feature, keine Änderung an Berechnungslogik/Preset-Inhalt — nur eine Verhaltens-
korrektur, wann der Zucker-Regler sichtbar ist.

**Problem (v3.19.2):** Preset „New York Style" schaltete beim Anwenden `PZ.setFlag
('newYorkStyle', true)` **dauerhaft/persistent** an. Der Zucker-Regler blieb danach für
immer sichtbar — auch nach Wechsel auf ein anderes Preset oder „Eigene Einstellung".
Ungewollt: die Sichtbarkeit sollte an das **aktuell gewählte Preset** gekoppelt sein,
nicht an eine dauerhafte Einstellungsänderung.

**Fix:** `#sugarBlock` ist jetzt sichtbar, wenn **entweder** (a) das Feature-Flag
`newYorkStyle` manuell im Einstellungen-Menü dauerhaft eingeschaltet ist, **oder** (b)
das Preset „New York Style" gerade aktiv im `#preset`-Select gewählt ist — beides ODER-
verknüpft, keine Persistenz mehr allein durchs Anwenden des Presets.

- **`js/presets.js` (`applyPreset()`):** ruft `PZ.setFlag(p.flag, true)` beim Anwenden
  **nicht mehr** auf. Ruft stattdessen am Ende **immer** (unabhängig von `p.flag`, und
  auch im early-return-Zweig für „Eigene Einstellung"/unbekannten Key) `PZ.applyFlags()`
  auf, damit die Sichtbarkeit bei jedem expliziten Preset-Wechsel über den `#preset`-
  Select neu ausgewertet wird. Das `p.flag`-Feld selbst bleibt (weiterhin generisch für
  künftige Presets nutzbar), wird jetzt aber nur noch **gelesen**, nicht mehr geschrieben.
- **`js/settings.js` (`applyFlags()`):** liest live `document.getElementById('preset')
  .value` aus, schlägt den Preset-Key in `PZ.PRESETS` nach und prüft, ob dessen `flag`-
  Feld `'newYorkStyle'` ist (`presetWantsSugar`). `#sugarBlock` bekommt die `show`-Klasse
  bei `f.newYorkStyle || presetWantsSugar`. Kein zusätzlicher, dopplender State — der
  `#preset`-Select ist bereits die Source of Truth für „welches Preset ist gerade aktiv"
  (jede manuelle Regler-Änderung setzt ihn ohnehin schon auf `''` zurück, etabliertes
  Muster seit den ersten Presets).
- **Checkbox `#flagNewYorkStyle` bleibt ein reiner Spiegel des persistenten Flags**
  (nicht der kombinierten Sichtbarkeit): der Sync-Block in `applyFlags()`
  (`el.checked = !!f[...]`) liest weiterhin nur `PZ.FLAGS`, nicht `presetWantsSugar` —
  wählt der Nutzer das Preset „New York Style", erscheint der Zucker-Regler zwar, die
  Checkbox im Einstellungen-Menü bleibt aber unverändert unchecked, bis der Nutzer sie
  selbst betätigt. Per CDP verifiziert (s. u.).
- **Bewusste Design-Entscheidung — Sichtbarkeit reagiert auf den `#preset`-Select, NICHT
  auf jede einzelne Regler-Änderung:** das bestehende Muster „jede Regler-Eingabe setzt
  `#preset` still auf `''` zurück" feuert auf jedes `input`-Event (jeden Slider-Pixel).
  Würde die Zucker-Sichtbarkeit ebenfalls an dieses `input`-Event gekoppelt, würde der
  Zucker-Regler verschwinden, sobald der Nutzer z. B. an der Hydration dreht — inklusive
  dem Extremfall, dass der Regler unter der eigenen Hand verschwindet, wenn der Nutzer
  gerade **am Zucker-Regler selbst** zieht. Stattdessen wird nur bei einem **expliziten**
  Preset-Wechsel über das Dropdown (inkl. „Eigene Einstellung") sowie beim Checkbox-
  Toggle und beim initialen Laden neu ausgewertet — deckt den im Scope beschriebenen
  Hauptfall ab („Wechselt der Nutzer weg vom Preset … verschwindet der Regler wieder"),
  vermeidet aber sowohl die UX-Falle als auch unnötige `buildGuide()`-Aufrufe pro
  Slider-Pixel (`applyFlags()` ruft `buildGuide()` mit auf). Nebeneffekt: tweakt der
  Nutzer nach Preset-Wahl einen anderen Regler (z. B. Hydration) manuell, bleibt der
  Zucker-Regler bis zum nächsten expliziten Preset-Wechsel sichtbar, auch wenn das
  Dropdown selbst optisch schon auf „Eigene Einstellung" zurückgesprungen ist — bewusst
  in Kauf genommen, damit der zuvor über das Preset sichtbar gemachte Zucker-Wert
  weiterhin erreichbar/editierbar bleibt, statt kommentarlos zu verschwinden.

**Tests** (`tests/test.html`, Sektion 18, +8 neue Prüfungen, 391 → **399**): neuer
Render-Effekt-Block „`#sugarBlock`-Sichtbarkeit: aktives Preset ODER manuelles Flag" —
`#preset`/`#sugarBlock`/`#flagNewYorkStyle` als neue Stub-Elemente im `#stubs`-Block
ergänzt, `PZ.PRESETS` minimal gestubbt (presets.js ist in `tests/test.html` bewusst nicht
geladen). Geprüft: Default aus, Preset aktiv → sichtbar (Checkbox bleibt unchecked),
zurück zu „Eigene Einstellung" → wieder aus, manuelles Flag allein → sichtbar (Checkbox
checked), Flag + Preset kombiniert → weiterhin sichtbar. Alle 399 Prüfungen grün
(Headless-Edge-Dump). Zusätzlich per Headless-Edge-CDP auf Desktop **und** Mobil den
kompletten Ablauf gegen das echte DOM verifiziert (Preset wählen → sichtbar, Preset
wechseln → unsichtbar, `state.sugar`-Wert bleibt beim Ausblenden erhalten statt
zurückgesetzt zu werden, manuelles Flag persistiert über Preset-Wechsel hinweg, Checkbox
bleibt in allen Fällen reiner Flag-Spiegel) — identisches Ergebnis auf beiden Seiten.

**Kein Accessibility-/Mobile-Audit nötig:** reine JS-Logik-Änderung in `js/settings.js`/
`js/presets.js`, kein neues/verändertes Markup, keine neue CSS, das etablierte
`.collapse`/`.show`-Sichtbarkeitsmuster für `#sugarBlock` selbst (inkl. der in v3.19.2
bereits geprüften Barrierefreiheit) ist unverändert.

**Geändert:** `js/settings.js`, `js/presets.js`, `tests/test.html`. `?v=` auf `3.19.3`
gezogen (Desktop + Mobil, Cache-Busting + Footer-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.19.3 - New York Style temporaere Sichtbarkeit/` enthält den vollständigen
Schnappschuss.

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

## Info-Knopf-Touch-Ziel auf 44×44px vergrößert (v3.19.1, `mobile-optimizer`-Agent)

Reiner Mobil-Layout-Fix, kein neues Feature, keine Logik-Änderung — greift den
Nebenbefund aus dem v3.19.0-Accessibility-Audit auf (s. Abschnitt „Mögliche nächste
Schritte" unten): `.info-btn` (Info-Knopf neben jedem Einstellungspunkt, öffnet den
`<p class="switch-info">`-Erklärtext) hatte auf Mobil eine Tap-Fläche von nur **28×28px**
— unter der sonst im Projekt konsequent eingehaltenen 44px-Touch-Ziel-Konvention
(Apple-HIG; vgl. `.seg button,.pills button{min-height:44px;}`, `.nav-toggle`
44×44px, `.switch{width:44px;height:44px;}` direkt daneben). Keine WCAG-2.1-AA-Pflicht
(Zielgröße ist erst WCAG 2.2 AA/2.1 AAA), aber ein klarer Bedienbarkeits-Fix.

**Nur `css/mobile.css` geändert** (reines Mobil-Layout, `css/styles.css`/Desktop-HTML/
Mobil-HTML unangetastet — Desktop-Mausnutzer profitieren nicht von größeren
Trefferflächen, aber es entsteht dort auch kein Schaden, also bewusst nicht dort
ergänzt). Die sichtbare 28px-Kreisoptik bleibt exakt gleich — nur die unsichtbare
Klickfläche wächst, analog zum bereits etablierten `.switch input{position:absolute;
inset:0;...}`-Muster direkt daneben:

```css
.info-btn{width:28px;height:28px;font-size:13px;position:relative;}
.info-btn::before{content:'';position:absolute;top:-8px;bottom:-8px;left:-4px;right:-12px;}
```

- **Asymmetrisch statt einem einfachen `inset:-8px` ringsum**, weil links nur 6px
  Platz bis zum `.switch-name`-Flag-Namen ist (fester `gap:6px` in `.switch-row-main`):
  `left:-4px` lässt 2px Puffer, damit ein Tap auf das Namens-Label nicht versehentlich
  den Info-Knopf statt des Checkbox-Labels trifft. `right:-12px` nutzt stattdessen den
  großzügigen Freiraum, den `justify-content:space-between` auf `.switch-row` vor dem
  Toggle-Switch lässt (dort ist deutlich mehr als 12px Luft, da `.switch-row-main` nur
  seine Inhaltsbreite beansprucht). `top:-8px`/`bottom:-8px` füllen exakt die Zeilenhöhe,
  die das benachbarte `.switch` (ebenfalls `44×44px` auf Mobil) in der Reihe ohnehin
  vorgibt (`align-items:center` auf `.switch-row`) — keine Überlappung mit den
  `border-bottom`-getrennten Nachbarzeilen der anderen sechs `.flag-item`-Blöcke.
- **Verifiziert per Headless-Edge-Dump + CDP `Emulation.setDeviceMetricsOverride`**
  (WebSocket, wie in v3.19.0 etabliert): für alle 7 Flags bei 375px Breite und für
  den längsten Flag-Namen („Mehrere Rezepte") zusätzlich bei 320px Breite (iPhone SE)
  `getBoundingClientRect()` von `.info-btn` + `getComputedStyle(info, '::before')`
  ausgelesen und die tatsächliche Trefferfläche berechnet: **in jedem Fall exakt
  44×44px**, `hit.left` blieb immer > `switch-name`-`right`-Kante (kein Überlapp mit
  dem Label), `hit.right` blieb immer < `.switch`-`left`-Kante (kein Überlapp mit dem
  Toggle-Switch).

**Tests:** reine CSS-Änderung, `.info-btn` kommt in `tests/test.html` nicht vor (die
Test-Sektion zu den Flags prüft nur `PZ.FLAG_DEFAULTS`/`PZ.setFlag()`-Logik, keine
DOM-IDs/CSS). Alle 338 Prüfungen weiterhin grün (Headless-Edge-Dump verifiziert). `?v=`
auf `3.19.1` gezogen (Desktop + Mobil, gleicher Cache-Busting-/Footer-Versionsstand,
Desktop-Markup/-Logik inhaltlich unverändert — etabliertes Muster seit v3.13.1/v3.17.1/
v3.18.0). `pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py`). `Versionen/v3.19.1 - Info-Knopf Touch-Ziel/` enthält den
vollständigen Schnappschuss.

## Einstellungen-Menü & Header überarbeitet (v3.19.0) + gezielter Accessibility-Audit

Zwei zusammenhängende Design-/Bedienbarkeits-Fixes, vom Nutzer selbst initiiert (kein
Backlog-Punkt) — **kein neues Feature, keine Logik-Änderung**, `js/calc.js`/
`schedule.js`/`guide.js` unangetastet. Auslöser: der Burger-Menü-Button auf Mobil
überlappte visuell mit dem Header-Titel, und die 7 Einstellungspunkte im Feature-
Flag-Menü wirkten unruhig (uneinheitliche Zeilenlängen, lange Fließtexte direkt in
der Liste, Checkbox unpassend für einen reinen Ein/Aus-Schalter). Gilt einheitlich
für Desktop (`pizza-rechner.html`) UND Mobil (`pizza-rechner-mobile.html`).

**1. Mobil-Header-Layout (nur `css/mobile.css`, kein Markup geändert):**
`header` ist jetzt ein 3-Spalten-Grid (`grid-template-columns:44px 1fr 44px;
align-items:center;column-gap:10px;`) statt zentriertem `text-align:center`-Titel mit
`position:absolute` positioniertem `.nav-toggle` darüber. Der Button bekommt
`grid-column:3;justify-self:end` (eigene Spalte, kann den Titel strukturell nicht
mehr überlagern), der Titel `grid-column:2;justify-self:center` — die leere erste
Spalte hält ihn trotzdem optisch zentriert. Bricht der Titel auf schmalen Screens
zweizeilig um (z. B. bei 320–390 px CSS-Breite, per CDP-`Emulation.setDeviceMetrics
Override` verifiziert — die bekannte `--window-size`-Klemme aus v3.13.1 macht den
reinen `--screenshot`-Weg hierfür weiterhin unbrauchbar), bleibt der Button dank
`align-items:center` senkrecht zentriert daneben stehen, nie mehr überlappend.
Desktop (`pizza-rechner.html`) hat keinen Hamburger-Button, daher unberührt.

**2. Einstellungen-Karte: Checkbox → Toggle-Switch + Info-Knopf statt Fließtext-Zeile.**
Vorher: `<label class="switch-row"><input type="checkbox" id="flagX"> Langer
erklärender Text</label>` je Flag. Jetzt pro Flag ein `.flag-item`-Block:
```html
<div class="flag-item">
  <div class="switch-row">
    <div class="switch-row-main">
      <label class="switch-name" for="flagTimer">Gärzeit-Timer</label>
      <button type="button" class="info-btn" aria-expanded="false"
        aria-controls="flagTimerInfo" aria-label="Erklärung zu „Gärzeit-Timer“ …">i</button>
    </div>
    <span class="switch"><input type="checkbox" id="flagTimer" role="switch"
      aria-describedby="flagTimerInfo"><span class="switch-slider" aria-hidden="true"></span></span>
  </div>
  <p class="switch-info" id="flagTimerInfo" hidden>Countdown mit optionalem Wecker …</p>
</div>
```
Alle 7 Flags (Timer, TimerSystem, Share, Shopping, FreezeHint, MultiRecipes, Hints)
bekamen kurze, gleichlange Namen statt der bisherigen Ein-Zeile-Romane; die
ausführliche Erklärung steckt jetzt im `<p class="switch-info">`, standardmäßig
`hidden`, nur per Klick auf den Info-Knopf sichtbar (`aria-expanded`/`hidden`
synchron gehalten — klassisches Disclosure-Widget-Muster).

- `js/settings.js`: `wireCheckboxes()` **unverändert** — liest/schreibt weiterhin
  `el.checked`/`change`-Event auf denselben `<input type=checkbox>`-IDs, nur die
  CSS-Optik ist jetzt ein Schalter (`role="switch"` ist eine laut ARIA-in-HTML
  zulässige Rollen-Transformation für `input[type=checkbox]`, kein neues Verhalten
  nötig). Neu: `wireInfoButtons()` togglet `hidden` auf dem `.switch-info`-Absatz +
  `aria-expanded` auf dem `.info-btn`, komplett unabhängig von der Flag-Logik.
- **Bewusst NICHT** von der bestehenden „Hinweistexte"-Flag (`body.hints-off .hint
  {display:none}`) betroffen: die neuen `.switch-info`-Erklärtexte tragen keine
  `.hint`-Klasse, da sie On-Demand über den Info-Knopf sind statt ambient sichtbar —
  sonst könnte man nicht mehr nachlesen, was „Hinweistexte" selbst bedeutet, nachdem
  man sie ausgeschaltet hat (Henne-Ei-Problem vermieden).
- `.switch` ist ein `<span>` (kein zweites `<label>` — würde mit dem externen
  `<label for="flagX">` kollidieren), das `<input>` liegt `position:absolute;inset:0`
  darin und deckt die komplette Klickfläche ab (auf Mobil `44×44px` per
  `.switch{width:44px;height:44px;}` in `css/mobile.css`, Desktop `40×26px`).
- CSS neu in `css/styles.css`: `.flag-item`, `.switch-row`, `.switch-row-main`,
  `.switch-name`, `.info-btn`, `.switch-info`, `.switch`, `.switch-slider` (ersetzt
  die alte `.switch-row`-Definition komplett). `css/mobile.css` ergänzt nur
  `.info-btn{width:28px;height:28px;}` + `.switch{width:44px;height:44px;}` als
  Touch-Ziel-Vergrößerung.

**Gezielter WCAG-2.1-AA-Audit nur für diese beiden Änderungen**
(`accessibility-expert`-Agent) — 1 Major, 1 Minor, Rest geprüft ohne Fund:

- **Major — Toggle-Switch im „Aus"-Zustand praktisch unsichtbar (1.4.11 Non-text
  Contrast):** `.switch-slider{background:var(--line)}` (`#ece3d8`) gegen die weiße
  Karte ergab nur **~1,27:1** (Soll 3:1) — betraf konkret die drei im Ausgangszustand
  ausgeschalteten Flags (`timerSystem`, `shopping`, `freezeHint`), deren Schalter für
  sehschwache Nutzer kaum erkennbar war. Fix: Grundfarbe auf `var(--muted)`
  (`#6e6359`) → **~5,85:1**. „Ein"-Zustand (`var(--tomato)`, **~4,86:1**) war bereits ok.
- **Minor — `.info-btn`-Rahmen zu kontrastarm (1.4.11), analog zum bereits
  akzeptierten `.nav-toggle`-Fund aus v3.17.1:** `border:1px solid var(--line)` gegen
  Weiß ebenfalls nur **~1,27:1**. Fix: Rahmenfarbe auf `var(--muted)` → **~5,85:1**.
- **Geprüft, kein Fix nötig:** `role="switch"` + externes `<label for>` +
  `aria-describedby` auf demselben `<input>` ist spezkonform (keine Namens-/
  Rollen-Kollision); `aria-describedby` auf ein `hidden`-Element wird trotzdem in die
  Accessible Description aufgenommen (etablierte Ausnahme für per Referenz
  eingebundene versteckte Inhalte); Tab-Reihenfolge je `.flag-item` ist
  `info-btn` → `switch`-Input (entspricht der visuellen Anordnung), keine positiven
  `tabindex`; `:focus-visible` auf `.info-btn` und (via `input:focus-visible +
  .switch-slider`, da das echte `<input>` `opacity:0` hat) auf dem sichtbaren
  Sibling-Element sichtbar; Kontraste `.switch-name`/`.switch-info`-Text bestehen AA
  klar (**~15,3:1** bzw. **~5,85:1**); Touch-Ziel `.info-btn` (28×28px auf Mobil)
  liegt unter der 44px-Konvention, ist aber **keine WCAG-2.1-AA-Pflicht** (Zielgröße
  ist erst WCAG 2.2 AA/2.1 AAA) — als Nebenbefund fürs Backlog vermerkt, s. u.;
  `#navToggle` weiterhin vor `<h1>` im DOM trotz visueller Rechts-Position ist
  unkritisch (1.3.2 Meaningful Sequence, identische Begründung wie v3.18.0 — Tab-
  Reihenfolge ist CSS-Position-unabhängig, etabliertes Hamburger-Menü-Muster).

**Tests:** `js/calc.js`/`schedule.js`/`guide.js` unangetastet, keine der neuen
IDs/Klassen (`flag-item`, `switch-row`, `info-btn`, `switch-info` usw.) taucht in
`tests/test.html` auf (die Test-Sektion zu den Flags prüft nur `PZ.FLAG_DEFAULTS`/
`PZ.setFlag()`-Logik, keine DOM-IDs). Alle 338 Prüfungen weiterhin grün
(Headless-Edge-Dump verifiziert, vor und nach dem Accessibility-Fix). `?v=` auf
`3.19.0` gezogen (Desktop + Mobil). `pizza-rechner-mobile-standalone.html` neu
gebaut (`python build-mobile-standalone.py`). `Versionen/v3.19.0 - Einstellungen-
Menue und Header ueberarbeitet/` enthält den vollständigen Schnappschuss.

**Verifikations-Hinweis fürs Vorgehen:** Für einen echten schmalen Mobil-Viewport
per Headless-Screenshot (statt der klemmenden `--window-size`-Methode, s. v3.13.1)
funktioniert `msedge --headless=new --remote-debugging-port=<port>
--remote-allow-origins=*` + CDP `Emulation.setDeviceMetricsOverride` über eine
WebSocket-Verbindung (Python + `websocket-client`). Ohne `--remote-allow-origins=*`
verweigert Edge die WebSocket-Verbindung von `127.0.0.1` mit HTTP 403 („Rejected an
incoming WebSocket connection … Use --remote-allow-origins=…"); `localhost` statt
`127.0.0.1` als Zieladresse führte in dieser Umgebung zusätzlich zu einem
`PermissionError`-Socketfehler auf Windows — `127.0.0.1` durchgängig verwenden.

## Mobil-Kopf-/Fußbereich aufgeräumt (v3.18.0) + gezielter Accessibility-Audit

Reines Aufräumen/Verschieben bestehender Anzeigen in `pizza-rechner-mobile.html` +
`css/mobile.css` — **kein neues Feature, keine Logik-Änderung**, Desktop
(`pizza-rechner.html`) bewusst unberührt außer dem gemeinsam gezogenen `?v=`/Footer-
Versionsstand (etabliertes Muster seit v3.13.1/v3.17.1). Auslöser: der Nutzer empfand
die Mobil-Kopf-/Fußzeile an mehreren Stellen als redundant/überladen. Sechs Einzelpunkte:

- **Doppelte Mengenanzeige an den 10 Reglern entfernt** (Teiglinge, Gewicht/Teigling,
  Hydration, Salz, Öl, Vorteig-Mehlanteil, Biga-Hydration, Hefemenge, Zieltemperatur,
  Raumtemperatur): die rote Zahl im `<label>` oberhalb des Sliders (`<span class="val">`)
  ist weg — die Zahl im Zahlenfeld neben dem Slider genügt. Damit keine Einheit
  (g/%/°C) verloren geht (Nutzer-Vorgabe: "ohne Informationsverlust"), steht jetzt
  stattdessen ein **statischer** `<span class="unit" id="XUnit">` neben dem Zahlenfeld
  (z. B. "g"/"%"/"°C"), und sowohl `<input type="range">` als auch `<input
  type="number">` bekamen zusätzlich `aria-describedby="XUnit"` (neben ihrem
  bestehenden `aria-labelledby`). `js/ui.js` (`link()`-Funktion) ist unverändert:
  `$(key + 'V')` liefert auf Mobil jetzt `null` (Element existiert nicht mehr), der
  vorhandene `if (v) v.textContent = …`-Guard fängt das ab — Desktop (behält die
  `.val`-Spans) ist davon nicht betroffen, dieselbe Funktion bedient beide Seiten
  sicher. `aria-valuetext` auf dem Slider (seit v3.x bereits vorhanden, mit Einheit)
  bleibt zusätzlich bestehen. `#prefStageLabel` ("Vorteig-Reife") behält seinen
  `.val`-Span unverändert — das ist ein Pills-Feld ohne Zahlenfeld-Duplikat, also keine
  echte Redundanz.
- **Methoden-Untertitel entfernt:** `<p>Neapolitanisch · Biga · Poolish — komplett
  offline</p>` unter dem `<h1>` ist auf Mobil raus (Desktop behält ihn unverändert).
- **Desktop-Link ins Burger-Menü verschoben:** `<a class="viewlink">Zur
  Desktop-Ansicht</a>` ist aus dem Header raus, steht jetzt als eigener
  `<a class="nav-link" id="navDesktopLink">` am Ende der `#navMenu`-Liste, per
  `<div class="nav-divider" role="separator">` optisch von den vier
  Bereichs-Buttons abgesetzt. Bewusst **kein** `.nav-item`/`<button>` (der Link
  verlässt die Seite, statt eine Ansicht umzuschalten) — deshalb eigene Klasse
  `.nav-link`, damit er nicht versehentlich in die `data-goto`-Klick-Logik
  hineinrutscht. Die Tastatur-Fokus-Trap (`focusablesInPanel()` im Inline-Script)
  wurde um dieses Element ergänzt: `[navClose].concat(navItems).concat(navDesktopLink
  ? [navDesktopLink] : [])` — Tab/Shift+Tab zyklieren jetzt korrekt über alle sechs
  fokussierbaren Elemente im Panel.
- **Footer-Erklärtext entfernt:** die zwei Zeilen ("Alles wird lokal…"/"Bäckerprozente…")
  sind auf Mobil raus, nur `<span id="appVersion">` bleibt — rechtsbündig
  (`footer{text-align:right;}`, mobile-only CSS-Regel). Desktop-Footer unverändert
  (behält den Erklärtext).
- **Gesamtteigmenge um Teiglingsanzahl ergänzt — an der Quick-Bar, nicht am
  Ergebnis-Panel:** das Ergebnis-Panel (`.total .lbl`) zeigte "Gesamtteig · 4 × 250 g"
  schon vorher auf beiden Seiten. Was fehlte, war die immer sichtbare, sticky
  Quick-Bar unten (`#qbTotal`) — die zeigte nur "1018 g · Gesamtteig ↓". Jetzt zeigt
  sie "1018 g · 4 Teiglinge" (`#qbBalls`, per zweitem `MutationObserver` auf
  `#ballsOut` gespiegelt, analog zum bestehenden `#totalW`→`#qbTotal`-Muster im
  Inline-Script). Der Sprungpfeil-Hinweis "↓" ist dabei weggefallen — der
  Accessibility-Audit (s. u.) hat das aufgefangen.
- **Burger-Menü-Button von links nach rechts verschoben:** reine CSS-Änderung in
  `css/mobile.css`, `.nav-toggle` von `left:` auf `right:` (gleiche Größe/Abstand,
  nur horizontal gespiegelt). DOM-Reihenfolge (Button steht weiterhin vor dem `<h1>`)
  bewusst unverändert gelassen — Tab-Reihenfolge ist unabhängig von der visuellen
  CSS-Position, vom Audit als unkritisch bestätigt (etabliertes Hamburger-Menü-Muster).

**Gezielter WCAG-2.1-AA-Audit für genau diese Änderungen** (`accessibility-expert`-Agent):
1 Major-Fund, Rest geprüft ohne Fund oder als bewusste Nutzer-Entscheidung markiert.

- **Major — Quick-Bar-Sprunglink ohne erkennbaren Linkzweck (2.4.4 Link Purpose):**
  Nach Wegfall von "↓" bestand der sichtbare Linktext nur noch aus "1018 g ·
  4 Teiglinge" — weder Text noch Kontext verrät Screenreader-Nutzern, dass es ein
  Sprunglink zum Ergebnis-Bereich ist (sie hören nur Zahlen + "Link"). Fix: neuer,
  visuell versteckter Präfix `<span class="visually-hidden">Zum Ergebnis springen:
  </span>` vor `#qbTotal` — nutzt die bereits vorhandene `.visually-hidden`-Utility,
  kein neues CSS, sichtbarer Text unverändert.
- **Geprüft, kein Fix nötig:**
  - `aria-labelledby` + `aria-describedby` auf demselben Slider/Zahlenfeld ist
    spezkonform (Name aus labelledby, zusätzliche Beschreibung aus describedby, keine
    Kollision); `aria-valuetext` mit Einheit bleibt zusätzlich bestehen — die Einheit
    geht Screenreader-Nutzern an keiner Stelle verloren.
  - Kontrast `.unit` und `.nav-link` (beide `var(--muted)` `#6e6359` auf Weiß/Karten-
    Hintergrund): rechnerisch **~5,85:1**, besteht AA klar.
  - `role="separator"` auf dem leeren `.nav-divider`-`<div>` ist eine zulässige, rein
    dekorative Trenner-Semantik (analog `<hr>`).
  - Fokus-Trap-Reihenfolge (`focusablesInPanel()`) korrekt: Tab-Zyklus jetzt
    navClose → 4× nav-item → navDesktopLink → (Tab) zurück zu navClose; Shift+Tab von
    navClose direkt zu navDesktopLink.
  - Button vor `<h1>` im DOM trotz visueller Rechts-Position (1.3.2 Meaningful
    Sequence): unkritisch, Tab-Reihenfolge ist CSS-Position-unabhängig, etabliertes
    Hamburger-Menü-Muster.
  - **Bewusste Nutzer-Entscheidung, kein WCAG-Verstoß:** der entfernte
    Privacy-/Datenschutz-Hinweis ("Alles läuft lokal … keine Internetverbindung
    nötig") existiert im Mobil-Footer nicht mehr — betrifft sehende wie
    Screenreader-Nutzer gleichermaßen (reine Inhaltskürzung, kein
    Screenreader-spezifischer Ausschluss), Desktop-Footer behält den Hinweis weiterhin.

**Tests:** `js/guide.js` unangetastet, `qb-jump`/`qbTotal`/`qbBalls`/`.unit`/`.nav-link`
kommen in `tests/test.html` nicht vor (reine Markup-/CSS-Änderung, kein String-Matching-
Ziel betroffen). Alle 338 Prüfungen weiterhin grün (Headless-Edge-Dump verifiziert, vor
und nach dem Accessibility-Fix). `?v=` auf `3.18.0` gezogen (Desktop + Mobil, gleicher
Cache-Busting-/Footer-Versionsstand, Desktop-Markup/-Logik inhaltlich unverändert).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.18.0 - Mobil Kopf-Fussbereich aufgeraeumt/` enthält den vollständigen
Schnappschuss.

## Mobil-Hamburger-Navigation (v3.17.x) + gezielter Accessibility-Audit

`pizza-rechner-mobile.html` wurde von einem durchgehenden One-Pager-Akkordeon auf eine
Hamburger-Menü-Navigation mit vier Bereichen umgestellt (**nur Mobil**, `pizza-rechner.html`
bleibt unverändert): „Rechner" (Preset, Grundeinstellungen, Methode & Hefe, Teigtemperatur &
Eiswasser, Ergebnis-Panel, Anleitung), „Rezepte" (Meine-Rezepte-Karte), „Zeitplan"
(Zeitplan-Karte), „Einstellungen" (Feature-Flag-Karte). Die vier Bereiche sind eigene
Top-Level-Container mit `class="view" data-view="rechner|rezepte|zeitplan|einstellungen"`;
Umschaltung passiert rein per JS (`[hidden]`-Attribut setzen/entfernen), verstärkt durch
`[data-view][hidden]{display:none!important;}` in `css/mobile.css` (author-CSS mit höherer
Spezifität als eine `[hidden]{display:block}`-Fallback-Regel).

`#navToggle` (Header, oben links, 44×44px) öffnet `#navMenu` (`<nav class="nav-overlay">`
mit innerem `<div class="nav-panel" role="dialog" aria-modal="true">`). Fokus-Trap ist reines
JS (kein natives `<dialog>`): `keydown`-Listener am `document`, der Tab/Shift+Tab zwischen
`navClose` + den vier `.nav-item`-Buttons zyklisch hält; ESC schließt, Klick auf den
Backdrop schließt, Fokus kehrt beim Schließen (ESC/Backdrop/✕) auf das auslösende Element
zurück (`lastFocused`, meist `#navToggle`).

**Gezielter WCAG-2.1-AA-Audit für dieses neue UI-Stück** (`accessibility-expert`-Agent,
Methodik wie v3.7.0/v3.12.0/v3.14.0/v3.15.0) — 1 Major, 2 Minor, Rest geprüft ohne Fund:

- **Major — Bereichswechsel ohne Rückmeldung für Screenreader (4.1.3 Status Messages):**
  Beim Klick auf einen `.nav-item` wurde der sichtbare Bereich komplett ausgetauscht, aber
  weder angesagt noch bekam der Fokus einen sinnvollen neuen Ankerpunkt — er sprang (über
  den generischen Dialog-Schließen-Pfad) zurück auf `#navToggle`, obwohl der Nutzer gerade
  aktiv navigiert hat. Fix: neue, dauerhaft im DOM stehende, visuell versteckte Live-Region
  `<div id="viewAnnounce" class="visually-hidden" role="status" aria-live="polite">` direkt
  nach `#navMenu`. `closeNav(restoreFocus)` bekam einen Parameter — beim Schließen per
  ESC/✕/Backdrop bleibt der alte Fokus-Rückkehr-Pfad (`restoreFocus !== false`), beim
  Schließen durch Auswahl eines `.nav-item` wird `closeNav(false)` aufgerufen und
  stattdessen `focusView(view)` (setzt `tabindex="-1"` auf das erste `h2` des neuen
  Bereichs und fokussiert es) + `announceView(label)` (schreibt „Ansicht: <Name>" in die
  Live-Region) ausgeführt — analog zum etablierten SPA-Routenwechsel-Muster (Fokus auf die
  neue Bereichsüberschrift + Live-Region-Ansage).
- **Minor — Kontrast `.nav-toggle`-Rahmen gegen den Header-Hintergrund (1.4.11 Non-text
  Contrast):** `border:1px solid rgba(255,255,255,.5)` kam gegen `var(--tomato-dark)`
  (`#a8341f`) rechnerisch nur auf **~2,76:1** — unter dem 3:1-Soll für UI-Komponenten-
  Umrandungen (das eigentliche Symbol „☰" selbst hat mit **~6,6:1** ausreichend Kontrast,
  betraf also nur den dekorativen Rahmen). Fix: Opacity auf `.8` angehoben.
- **Minor — Fehlender Fallback-Fokus in `openNav()`, falls `navItems` leer wäre (Robustheit,
  kein aktuell auslösbarer Bug):** Die vier `.nav-item`-Buttons sind fest im Markup verankert,
  können also derzeit nicht leer sein — trotzdem ergänzt: `if (current) current.focus(); else
  if (navClose) navClose.focus();` als defensives Sicherheitsnetz, damit der Fokus bei einer
  künftigen dynamischen Nav-Liste nie außerhalb des offenen Panels landen kann.
- **Geprüft, kein Fix nötig:**
  - `role="dialog"`/`aria-modal="true"` auf dem inneren `.nav-panel` innerhalb der äußeren
    `<nav>`-Landmark ist kein Rollenkonflikt — beide Semantiken (Navigations-Landmark +
    modaler Dialog) sind für ein Hamburger-Menü-Drawer ein etabliertes Muster; die `<nav>`
    ist Vorfahre des Dialogs, wird also durch `aria-modal` (das nur *Geschwister*-Inhalte
    außerhalb des Dialogs für AT unterdrückt) nicht mit ausgeblendet.
  - `aria-expanded`/`aria-controls` auf `#navToggle` korrekt referenziert (`navMenu`-ID
    existiert, Zustand wird bei jedem Öffnen/Schließen synchron gesetzt).
  - Tastatur-Trap greift korrekt zyklisch (Tab am Ende → `navClose`, Shift+Tab am Anfang →
    letztes `.nav-item`); da alle Panel-Elemente kontinuierlich im DOM stehen, genügt der
    Trap an den beiden Rändern, kein Element außerhalb des Panels wird während offenem
    Overlay fokussierbar (das Overlay deckt den Viewport per `position:fixed;inset:0` mit
    höherem `z-index` vollständig ab, dahinterliegende Elemente sind nicht mehr klickbar).
  - `[hidden]` entfernt die drei inaktiven Bereiche zuverlässig sowohl aus dem Accessibility-
    Tree als auch aus der Tab-Reihenfolge — verifiziert gegen die `!important`-Verstärkung
    in `css/mobile.css`.
  - Kontraste `.nav-item` aktiv (`var(--tomato-dark)` auf `var(--bg)`, **~6,14:1**) und
    `.nav-item`/`.nav-close`-Text (`var(--ink)` auf Weiß, deutlich über AA) bestehen klar.
  - `aria-current="page"` auf dem aktiven `.nav-item` ist ein zulässiger Wert für „aktueller
    Bereich in einer Menge gleichrangiger Ansichten", analog zur klassischen Seiten-Navigation.

**Tests:** `js/guide.js` (String-Matching-Ziel der Tests) wurde nicht angefasst — reine
`pizza-rechner-mobile.html`/`css/mobile.css`-Änderung. Alle 338 Prüfungen weiterhin grün
(Headless-Edge-Dump verifiziert). `?v=` auf `3.17.1` gezogen (Desktop + Mobil, da beide
Dateien denselben `appVersion`-Text/Cache-Busting-Stand teilen, auch wenn nur die Mobil-Seite
inhaltlich betroffen ist — Desktop-Markup/-Logik unverändert). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`). `Versionen/v3.17.1 -
Mobil-Hamburger-Nav Accessibility-Audit/` enthält den vollständigen Schnappschuss.

## System-Wecker/Kalender-Anbindung für Gärzeit-Timer (v3.15.0, `js/timer.js`) + Accessibility-Audit = aktueller Stand

Additiv zur bestehenden In-App-Countdown-Logik der Gärzeit-Timer (v3.11.0): solange ein
Timer noch **nicht** gestartet wurde (Idle-Zustand), rendert `systemTimerHtml()` neben
dem bestehenden „⏰ Timer starten"-Button einen `<div class="timersys">`-Block mit einer
kurzen Erklärung (`.timersys-hint`) und ein bis zwei Links (`.timersys-links`):
- **„📱 Android-Wecker stellen"** — nur wenn `navigator.userAgent` Android erkennt
  (`isAndroid()`). Öffnet eine `intent:`-URI mit der dokumentierten AlarmClock-Intent-
  Action `ACTION_SET_TIMER` (`SKIP_UI=true` startet den Timer direkt ohne die Uhr-App zu
  öffnen) — funktioniert nur in Chrome/Chromium-basierten Android-Browsern.
- **„📅 Kalender-Erinnerung"** — immer sichtbar (auch iOS/Desktop, die keine vergleichbare
  Web-API haben). `href` ist eine `data:text/calendar`-URL mit `download="pizza-timer-
  <key>.ics"`: eine offline generierte `.ics`-Datei mit `VALARM`/`TRIGGER:-PT0M`, die zum
  exakten Zielzeitpunkt (jetzt + Timerdauer) einen Alarm auslöst — offener Standard, den
  iOS/Android/Desktop-Kalender nativ unterstützen, ehrlicher Ersatz dort, wo es keine
  Web-Timer-API gibt.
- Erscheint **nur im Idle-Zustand**, nicht während des laufenden Countdowns oder im
  „Fertig!"-Zustand. Identisch auf Desktop + Mobil (beide laden dasselbe `js/timer.js`,
  keine HTML-Änderung nötig).
- Neues CSS in `css/styles.css`: `.timerbtn-alt`, `.timersys`, `.timersys-hint`,
  `.timersys-links`, `a.timerbtn{text-decoration:none;display:inline-block;}`.

**Gezielter WCAG-2.1-AA-Audit nur für diesen neuen `.timersys`-Block**
(`accessibility-expert`-Agent, Methodik wie v3.7.0/v3.12.0/v3.14.0):

- **Minor — Hint-Text nur visuell neben den Links (1.3.1):** `.timersys-hint` stand als
  reiner Nachbar-`<span>` neben `.timersys-links`, ohne programmatische Verknüpfung
  (identisches Muster wie der `#shareHint`-Fund aus v3.14.0). Fix: eindeutige
  `id="timersys-hint-<key>"` je Timer-Box (mehrere Boxen können gleichzeitig auf der
  Seite stehen) + `aria-describedby` auf beiden `<a class="timerbtn timerbtn-alt">`-Links.
- **Geprüft, kein Fix nötig:**
  - Beide Links sind native `<a>`-Elemente mit aussagekräftigem Linktext (kein
    Icon-only-Problem, 2.4.4/2.4.9) und tastaturerreichbar; kein `outline:none` auf
    `.timerbtn`/`a`, Standard-Fokusring bleibt sichtbar.
  - Kontrast `.timersys-hint` (`--muted` `#6e6359` auf `--bg` `#faf6f0`): rechnerisch
    **5,55:1**, besteht AA für Normaltext (11,5 px).
  - Kontrast `.timerbtn-alt` (`--ink` `#2b2420` auf `#fff`): rechnerisch **15,26:1**,
    weit über AA.
  - `intent:`/`data:`-URI-Navigation löst keinen Fokus-Verlust im WCAG-Sinn aus — beides
    ist regulärer, nutzerinitiierter Link-Klick (3.2.5 „change on request"); die
    `intent:`-URI wechselt ggf. die App (Android-Uhr), die `data:`-URI mit `download`
    triggert einen Browser-Download, beides ohne Skript-getriebenen Kontextwechsel/
    Fokus-Trap.
  - `aria-live="polite"`/`aria-atomic="true"` auf dem äußeren `.timerbox` (aus v3.12.0)
    bleibt kompatibel — der zusätzliche Idle-Inhalt wird nach demselben, bereits
    akzeptierten Muster mitgerendert. Bestehende, vorbekannte Einschränkung (nicht neu
    durch dieses Feature verursacht): weil `.timerbox` bei **jedem** `buildGuide()`-Lauf
    (also bei jeder Reglerbewegung) komplett per `innerHTML` neu geschrieben wird,
    könnte der Idle-Inhalt theoretisch bei jedem Re-Render erneut vorgelesen werden —
    das gilt aber unverändert bereits für den einfachen „Timer starten"-Button seit
    v3.11.0 und wurde dort bereits geprüft/akzeptiert; dieses Feature vergrößert nur den
    Textumfang des bestehenden Musters, führt keine neue Fehlerkategorie ein. Eine
    Neugestaltung (aria-live nur bei echten Zustandswechseln statt bei jedem Render)
    wäre eine Architekturänderung und außerhalb des minimal-invasiven Scopes dieser
    Session.

**Tests:** `js/timer.js` wird in `tests/test.html` bewusst nicht geladen (Browser-APIs
wie `Notification`/`setInterval`/Web Audio sind kein Unit-Test-Ziel, s. v3.11.0) — das
neue `aria-describedby` kollidiert dort mit nichts. Alle 311 Prüfungen weiterhin grün
(Headless-Edge-Dump verifiziert). `?v=` bereits bei `3.15.0` (Feature + Audit-Fix als ein
zusammenhängender Stand, analog v3.14.0). `Versionen/v3.15.0 - System-Wecker-Kalender-
Anbindung fuer Timer/` enthält den vollständigen Schnappschuss. Berechnungslogik
(`js/calc.js`, `js/schedule.js`, `js/guide.js`) unangetastet.

## Teilen-Link (v3.14.0, `js/share.js`) + Accessibility-Audit = aktueller Stand

Neues Feature: Button „Link kopieren" (`#shareLinkBtn`, `.actions`-Block, unter dem
Druck-Button-`row2`, identisch in Desktop + Mobil) kodiert `PZ.state` als Base64-JSON
in `?r=`-Query-Parameter, kopiert den vollständigen Link in die Zwischenablage
(`navigator.clipboard.writeText`, Fallback `document.execCommand('copy')` für
`file://`-Kontexte ohne sicheren Ursprung). Beim Laden übernimmt
`tryLoadFromShareLink()` einen vorhandenen `?r=`-Parameter über `PZ.applyState()`
(dieselbe Funktion wie beim Laden eines gespeicherten Rezepts) und entfernt den
Parameter danach per `history.replaceState`. Defensiv: jeder Fehler (kaputtes
Base64/JSON, unplausibler Inhalt) führt zu einem stillen no-op, nie zum Absturz.

**Gezielter WCAG-2.1-AA-Audit nur für dieses neue UI-Stück** (nicht die ganze App
neu geprüft — Methodik/Stil wie v3.7.0/v3.12.0):

- **Major — Kopier-Bestätigung ohne Live-Region (4.1.3 Status Messages):** Der Klick
  auf „Link kopieren" ändert `btn.textContent` auf „Link kopiert!“/„Kopieren
  fehlgeschlagen“ für 1,8 s, aber ohne jede ARIA-Live-Eigenschaft — und das Kopieren
  in die Zwischenablage hat sonst **keinen** anderen sichtbaren Effekt, den
  Screenreader-Nutzer verifizieren könnten (anders als z. B. `#saveBtn`, dessen
  Erfolg zusätzlich am aktualisierten Rezept-Dropdown ablesbar wäre — dort besteht
  dieselbe Lücke, wurde aber bewusst nicht mit angefasst, da außerhalb des Audit-
  Scopes dieser Session). Fix: neue, dauerhaft im DOM stehende, visuell versteckte
  Live-Region `<div id="shareLiveMsg" class="visually-hidden" role="status"
  aria-live="polite">` direkt nach `#shareHint` (Desktop + Mobil identisch).
  `copyShareLink()` schreibt dieselbe Meldung sowohl in `btn.textContent` (sichtbares
  Feedback) als auch in `#shareLiveMsg` (Screenreader-Ansage) und leert die
  Live-Region beim Zurücksetzen wieder. Bewusst **kein** `role="status"` direkt auf
  den Button selbst gesetzt — das würde dessen native Button-Rolle überschreiben.
- **Minor — `#shareHint` nur visuell neben dem Button (1.3.1):** Fix:
  `aria-describedby="shareHint"` auf `#shareLinkBtn`.
- **Geprüft, kein Fix nötig:**
  - Button-Text „Link kopieren“ ist selbsterklärend, kein Icon-only-Problem (2.4.6).
  - `#shareLinkBtn` liegt außerhalb von `.row2` und bekommt daher die Basis-Regel
    `.actions button` (weißer Hintergrund `#fff`, Text `--ink` `#2b2420`, Rahmen
    `--line`) statt des transparenten Ghost-Stils der Druck-Buttons — Kontrast
    Text/Hintergrund weit über AA (>13:1), kein Blocker.
  - `.hint`-Grauton `#6e6359` auf weißer Karte: rechnerisch **5,84:1**, besteht AA
    für Normaltext.
  - Natives `<button>`, kein `outline:none` in `.actions button` → Standard-Fokusring
    bleibt sichtbar, Tab-Reihenfolge folgt der DOM-Position (nach den Druck-Buttons,
    vor `#shareHint`).

**Tests:** `tests/test.html` prüft nur die reinen Encode/Decode/Rundreise-Funktionen
von `share.js` (Abschnitt „17 · Teilen-Link“), ruft `copyShareLink()` nicht auf —
die neue Live-Region/das `aria-describedby` brechen dort nichts. Alle 311 Prüfungen
weiterhin grün (Headless-Edge-Dump verifiziert).

Cache-Busting (`?v=`) bewusst bei `3.14.0` belassen (nicht auf `3.14.1` hochgezogen),
weil Feature + Audit-Fix als ein zusammenhängender Stand behandelt wurden — beides
kam vor dem ersten Commit dieses Standes zusammen. `Versionen/v3.14.0 - Teilen-Link/`
enthält den vollständigen Schnappschuss.

## Mobil-Overflow-Härtung v3.13.1

Gezielter Fix für den in v3.13.0 als Nebenbefund notierten horizontalen Overflow auf sehr
schmalen Mobil-Viewports (~430 px, iPhone SE/Mini). Reine CSS-Änderung, kein Markup/keine
Logik angefasst.

**Untersuchung (wichtig für künftige Sessions):** Der ursprüngliche "Beweis"-Screenshot aus
v3.13.0 wurde per `msedge --headless --window-size=390,844 --screenshot=…` erzeugt. In dieser
Session stellte sich heraus, dass die lokale Edge-Headless-Installation `--window-size`-Werte
unter ~490 px **auf ein Minimum klemmt** (`window.innerWidth` bleibt bei ~492, egal ob 390,
300 oder 450 angefordert werden — verifiziert per injiziertem Debug-Script), während das
`--screenshot`-PNG trotzdem in der angeforderten (kleineren) Pixelgröße geschrieben wird. Das
erzeugt genau das Bild eines rechts abgeschnittenen Layouts, **ohne dass echter DOM-Overflow
vorliegt** — ein Artefakt des Tools, kein Browser-Rendering. Verifiziert durch einen sauberen
Messweg: `Emulation.setDeviceMetricsOverride` über die Chrome-DevTools-Protocol-WebSocket-API
(Python + `websocket-client`, da kein Node/Puppeteer verfügbar) erzwingt einen **echten**
Viewport unabhängig vom Fenster. Damit gemessen: bei 320/360/375/390/414/430 px — sowohl im
alten v3.12.0-Stand als auch im aktuellen — `document.documentElement.scrollWidth ===
window.innerWidth` in jedem Fall, auch mit geöffnetem Akkordeon, Biga-Methode und Preset
„napoli_biga" aktiv. **Es ließ sich also kein reproduzierbarer Overflow in Chromium
nachweisen** — möglich, dass der ursprüngliche Befund ausschließlich auf dem beschriebenen
Tooling-Artefakt beruhte, oder dass es sich um ein iOS-Safari-spezifisches Rendering-Detail
handelt, das mit den hier verfügbaren Mitteln (kein echtes iOS-Gerät, kein WebKit) nicht
nachstellbar ist.

**Umgesetzte Härtung (trotzdem sinnvoll, unabhängig vom obigen Befund):**
- `css/styles.css`: `.field label` (Slider-/Zahlenfeld-Beschriftung + Wertanzeige, z. B.
  „Anzahl Teiglinge 4") bekommt `flex-wrap:wrap` + `column-gap:8px` statt starrem
  `justify-content:space-between` ohne Wrap-Möglichkeit — bei zu wenig Platz bricht die
  Wertanzeige (`.val`) jetzt in eine zweite Zeile um, statt den Container zu sprengen.
  `.val` bekommt zusätzlich `flex-shrink:0` (bleibt immer vollständig lesbar).
- `.field .hint` bekommt `overflow-wrap:break-word` (Sicherheitsnetz gegen einzelne lange
  Wörter).
- `.row` (Slider + Zahlenfeld nebeneinander) bekommt `.row>*{min-width:0;}` — Standard-Fix
  gegen das bekannte Flexbox-`min-width:auto`-Verhalten (analog zum CSS-Grid-Fix aus v3.13.0).
- `.actions .row2 button` (die beiden Druck-Buttons „Einkaufsliste drucken"/„Anleitung
  drucken") bekommt `min-width:0` — Button-Text bricht bei Platzmangel jetzt zweizeilig um
  statt den Button zu verbreitern.
- `css/mobile.css`: `html,body{overflow-x:hidden;max-width:100%;}` als generelles
  Sicherheitsnetz (nur in der Mobil-CSS, die App ist dort bewusst einspaltig — es gibt
  keinen legitimen Grund für horizontales Scrollen).

**Accessibility-Nachaudit (gezielt, `accessibility-expert`-Agent):** keine Funde. Geprüft:
`overflow-x:hidden` verursacht **keinen** echten Reflow-/Fokus-Erreichbarkeits-Verlust
(WCAG 1.4.10) — Gegenprüfung per DOM-Messung ergab keinen tatsächlichen Overflow, der
geclippt werden könnte. `min-width:0` erzwingt keine unlesbar schmalen Zahlenfelder (die
Inputs behalten ihre explizite `width`). `flex-wrap:wrap` auf `.field label` ändert nur die
visuelle Darstellung, nicht den DOM-Text, den `aria-labelledby` referenziert — Accessible
Name unverändert.

**Tests:** keine neue Test-Sektion nötig (reine CSS-Änderung, keine `js/*`-Logik/-Texte
angefasst). 293 Prüfungen unverändert grün, verifiziert per Chrome-DevTools-Protocol
(`Runtime.evaluate` gegen `#summary`-Text) statt des unzuverlässigen `--window-size`-
Headless-Wegs. `?v=` auf 3.13.1 gezogen (Desktop + Mobil), Standalone-Datei neu gebaut.

**Erkenntnis fürs Projekt-Vorgehen:** Für künftige Mobil-Layout-Prüfungen bei schmalen
Breiten **nicht** `msedge --headless --window-size=<schmal>` verwenden (klemmt auf ein
Minimum von ~490 px CSS-Breite in dieser lokalen Installation) — stattdessen `--remote-
debugging-port` + CDP `Emulation.setDeviceMetricsOverride` (z. B. per Python-Skript mit
`websocket-client`) für einen echten erzwungenen Viewport nutzen.

## Visuelles Redesign v3.13.0 (gegen den "KI-typischen" Standard-Look)


Reiner Design-Refresh, kein neues Feature, **keine** Änderung an Berechnungslogik
(`js/calc.js`, `js/schedule.js`, `js/guide.js` u. a. unangetastet) oder Datenmodellen.
Auslöser: Der Nutzer empfand das bisherige Layout als "typisch KI-generiert" — Ziel war,
ein eigenständigeres, weniger generisches Erscheinungsbild zu schaffen, ohne Bedienbarkeit,
Barrierefreiheit oder Funktion zu verschlechtern.

**Befund (was generisch wirkte):** Emoji vor praktisch jedem Card-Titel/Button (📖💾⚙️🧬
🌡️🕐📋📝🛒➕✏️🗑️), durchgängig identischer Border-Radius auf allen Elementen
(14 px Karten/20 px Pills/10 px Buttons — "alles gleich rund"), eine einzige
Schatten-Formel (`--shadow`) auf praktisch jeder Karte, 135°-Gradient an drei Stellen
(Header, Schedbar, mobile Quickbar — klassisches KI-Default-Muster), reiner
System-Sans-Font-Stack ohne eigene typografische Note, symmetrisches 3-gleich-große-
Buttons-Layout in `.actions`.

**Umsetzung (`css/styles.css`, `css/mobile.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`):**
- **Emoji auf ein einziges Markenzeichen reduziert:** nur noch 🍕 im `<h1>`-Header bleibt.
  Alle `<span class="ic">…</span>`-Icon-Präfixe vor Card-Titeln entfernt, alle
  Emoji-Präfixe in Button-Beschriftungen entfernt („➕ Neu"→„Neu", „💾 Speichern"→
  „Speichern" usw.). `js/*`-generierte Texte (Anleitung, Timer, Einkaufsliste) bewusst
  **nicht** angefasst (Test-Risiko durch String-Matching, s. u.).
- **Nummerierte Kicker-Titel statt Emoji-Icons:** `.card h2::before` erzeugt per CSS
  Counter (`counter-reset:cardnum` auf `.wrap`, `counter-increment:cardnum` auf `.card`)
  eine Nummer vor jedem Card-Titel (z. B. „01 · Fertiges Rezept wählen"). Titel-Text
  selbst unverändert (kein anderer Wortlaut) — nur das visuelle Präfix ist neu.
- **Border-Radius systemweit verschärft:** `--radius:3px` (Karten, Inputs, Selects,
  Segmente), `--radius-chip:6px` (Pills, Chips, Timer-Badges) statt vorher 14/20 px —
  weniger "alles ist eine abgerundete Card"-Optik. Slider-Thumbs leicht eckig (2 px)
  statt rund.
- **Schatten durch Akzent-Linie ersetzt:** Karten haben keinen `box-shadow` mehr, dafür
  `border-left:3px solid var(--tomato)` (Ergebnis-Karte: `var(--basil)`) als Signatur-
  Element. `.step`-Blöcke in der Anleitung analog (dezenter, kein Schatten mehr).
- **Gradients durch flache Farbe + Textur ersetzt:** Header und mobile Quickbar nutzen
  jetzt `var(--tomato-dark)` + eine sehr dezente `repeating-linear-gradient`-Diagonal-
  Textur (6 % weiße Deckkraft) statt des 135°-Zweifarben-Gradients. `.schedbar` (grüner
  Zeitplan-Balken in der Anleitung) ebenfalls von Gradient auf flache `var(--basil)`-
  Fläche mit Akzent-Rahmen umgestellt.
- **Eigene Typografie-Note:** neue CSS-Variable `--font-head` (Georgia/„Iowan Old
  Style"/„Palatino Linotype"/„Book Antiqua"/serif — bewusst nur Systemschriften, keine
  Web-Font-CDN, da die App offline per `file://` laufen muss) für `<h1>`, die große
  Gesamtgewicht-Zahl (`.result .total .big`), Slider-Wertanzeigen (`.field label .val`)
  und die Step-Nummern-Kreise in der Anleitung. Body-Text bleibt beim bisherigen
  System-Sans-Stack (Lesbarkeit der Formulare).
- **Asymmetrisches `.actions`-Layout:** „Speichern" ist jetzt ein großer, prominenter
  Button oben (grün, `.primary`, `order:-1`), die beiden Druck-Buttons stehen kleiner/
  transparent („Ghost"-Stil) in einer `.row2`-Zeile darunter — statt vorher drei gleich
  große Pillen nebeneinander.
- **Asymmetrische Temperatur-Boxen:** `.temp-out` zeigt die Schüttwasser-Box jetzt breiter
  (`flex:1.4`, eigener Farbton) als die Eis-Box (`flex:1`) — spiegelt die inhaltliche
  Gewichtung (Wassertemperatur ist die Hauptaussage, Eis nur ergänzend).
- **`.result .total`** (Gesamtgewicht-Anzeige) von abgerundeter gestrichelter Box mit
  Gradient-Hintergrund auf eine flache Fläche mit oberer/unterer 2-px-Linie umgestellt
  („Kassenbon"-Anmutung statt "Soft-Card").

**CSS-Grid-Overflow-Fix (Nebenbefund, kein Redesign-Ziel, aber beim Verifizieren
gefunden):** `.wrap` und `.card` sind Grid-Items ohne explizites `min-width` — CSS-Grid-
Items haben standardmäßig `min-width:auto`, was bei langen Card-Titeln (jetzt länger durch
den Kicker-Präfix) zu horizontalem Overflow auf schmalen Mobil-Viewports führen kann.
`min-width:0` auf `.wrap > *` und `.card` ergänzt (Standard-Fix für dieses bekannte
CSS-Grid-Verhalten). Ein **davon unabhängiger, bereits in v3.12.0 vorhandener** Overflow
bei sehr schmalen Mobil-Breiten (~430 px, per Vergleichs-Screenshot gegen den vorherigen
Commit-Stand verifiziert) bleibt bestehen — **nicht** Teil dieses Redesigns, Kandidat für
einen künftigen `mobile-optimizer`-Durchlauf.

**Accessibility-Nachaudit (gezielt für dieses Redesign, `accessibility-expert`-Agent):**
1 Major-Fund — die neue CSS-Counter-Nummerierung (`.card h2::before{content:counter(...)}`)
konnte je nach Browser/AT in den Accessible Name der Überschrift einfließen und wäre dann
z. B. als „01 · Fertiges Rezept wählen" statt „Fertiges Rezept wählen" vorgelesen worden.
Fix: `aria-label="<reiner Titeltext ohne Nummer>"` auf allen `.card h2`-Elementen (Desktop +
Mobil, je 7 Karten) — die Nummer bleibt visuell für sehende Nutzer sichtbar, der Accessible
Name ist aber wieder der reine, stabile Titeltext. Kontraste aller geänderten Elemente
(Kicker-Zahl, Card-Titel-Textfarbe, Ghost-Buttons, Header-Textur, asymmetrische Temp-Boxen)
geprüft — alle bestanden AA, keine weiteren Fixes nötig.

**Tests:** keine neue Test-Sektion (reine CSS-/Markup-Änderung, keine Logik-/Text-Änderung
in `js/*`, die von `tests/test.html` per String-Matching geprüfte Anleitungstexte etc. blieben
unangetastet). 293 Prüfungen unverändert grün, verifiziert per Headless-Edge-Dump (PowerShell-
Aufruf statt direktem Bash-Aufruf des Binaries — in dieser Session war der direkte
`msedge.exe … > out.html`-Aufruf über die Bash-Shell mehrfach unzuverlässig/leer, über
PowerShell `Out-File` lief er zuverlässig durch). `?v=` auf 3.13.0 gezogen (Desktop + Mobil),
Standalone-Datei neu gebaut. Manuell per Headless-Screenshot auf Desktop- und Mobil-Layout
gegengeprüft (`--screenshot`-Flag).

## Accessibility-Nachaudit v3.12.0 (Timer, Rezepte, Einkaufsliste)

WCAG-2.1-AA-Nachaudit gezielt für die drei jüngsten Feature-Runden (Einkaufsliste/Druck
v3.9.0, Mehrfach-Rezepte v3.10.0, Gärzeit-Timer v3.11.0) — dieselbe Methodik/derselbe Stil
wie beim ursprünglichen Audit in v3.7.0 (s. u.), diesmal mit Fokus auf die neuen
Custom-Controls. Befundliste: 2 Blocker, 2 Major — alle behoben.

- **Blocker — Timer-Countdown/„Fertig!"-Zustand ohne Live-Region (1.3.1, 4.1.3 Status
  Messages):** `js/timer.js` aktualisiert `.timerclock-val` per `setInterval` jede Sekunde
  und schreibt bei Ablauf einen neuen „🔔 Fertig!"-Zustand per `innerHTML` — beides ohne
  jede ARIA-Live-Eigenschaft. Screenreader-Nutzer bekamen weder den laufenden Countdown
  noch den Timer-Ablauf mitgeteilt. Fix: `aria-live="polite" aria-atomic="true"` auf dem
  **statischen** `.timerbox`-Container (identisches Muster wie `#flourWarn` aus v3.7.0 —
  nicht auf dynamisch ersetzten Kindern, sonst feuert es nicht zuverlässig), gesetzt in
  `render()` bei jedem Aufruf. Die Sekunden-Ziffern selbst (`.timerclock-val`) bekommen
  bewusst `aria-hidden="true"`, damit **nicht** jede Sekunde eine Ansage ausgelöst wird
  (würde bei `aria-live="polite"` zu einer Ansage-Spam-Kaskade führen) — angesagt werden
  nur die Zustandswechsel Start → Laufend → Fertig (kompletter `.timerwrap`-Austausch via
  `innerHTML` löst dann die Live-Region aus). `.timerdone` bekam zusätzlich `role="status"`.
- **Blocker — `#recipeName` ohne Label (1.3.1, 4.1.2):** Das Eingabefeld für den Namen
  eines neuen Rezepts hatte nur einen `placeholder`, der kein Ersatz für ein Label ist
  (verschwindet bei Eingabe, wird von vielen AT nicht als Name vorgelesen). Fix: sichtbar
  verstecktes `<label for="recipeName" class="visually-hidden">Name für neues Rezept</label>`.
  Neue Utility-Klasse `.visually-hidden` in `css/styles.css` (Standard-Clip-Pattern:
  Element bleibt für AT lesbar, ist aber optisch nicht sichtbar — hier bewusst gewählt statt
  eines sichtbaren Labels, weil das Feld durch den Karten-Titel „💾 Meine Rezepte" +
  `#recipeSaveNew`-Button-Beschriftung „➕ Neu" visuell bereits selbsterklärend ist).
- **Major — Kontrast `.timerclock` (1.4.3):** Tomatenrot-Text `#c8442e` auf dem
  Chip-Hintergrund `#fff3e8` kam auf **4,45:1** — knapp unter dem AA-Soll von 4,5:1 für
  normalen Text (13px, kein „large text"). Fix: Text auf `--tomato-dark` (`#a8341f`)
  umgestellt → **6,06:1**, deutlich bestanden. `--tomato-dark` existierte bereits als
  CSS-Variable (Header-Gradient), keine neue Farbe eingeführt.
- **Major — einmaliger Timer-Hinweistext ohne Live-Region:** `.timerhint` (erscheint beim
  ersten Timer-Start, verschwindet nach 9 s) hatte keine ARIA-Live-Eigenschaft — AT-Nutzer
  hätten den informativen Hinweis „Der Timer läuft nur, solange dieser Tab geöffnet ist…"
  nie mitbekommen. Fix: `role="status" aria-live="polite"` beim Erzeugen des Elements.
- **Geprüft, kein Fix nötig:**
  - Keyboard-Durchlauf durch die dynamisch pro Anleitungs-Schritt gerenderten Timer-Buttons
    (Start/Abbrechen/Zurücksetzen) folgt der DOM-/visuellen Reihenfolge (Timer-Box steht im
    Markup nach dem `<p>`-Body des Schritts, exakt wie visuell); native `<button>`-Elemente
    ohne `outline:none`, Standard-Fokusring bleibt sichtbar (Desktop + Mobil).
  - Einkaufsliste (`#shoppingList`, `js/print.js`): Zeilen (`.ing` mit `.name`/`.amt`) nutzen
    dasselbe, bereits in v3.7.0 akzeptierte Muster wie das Ergebnis-Panel (Label und Wert im
    selben Flex-Container, in DOM-Reihenfolge vorlesbar) — kein neuer Fund. Die beiden
    Druck-Buttons „🛒 Einkaufsliste drucken"/„📝 Anleitung drucken" haben aussagekräftige,
    eindeutige Textbeschriftungen (kein reines Icon).
  - `prompt()`/`confirm()`-Dialoge (Umbenennen/Löschen eines Rezepts in `js/main.js`) sind
    native Browser-Dialoge — Fokus-Management/Tastaturbedienbarkeit liegt beim Browser,
    kein zusätzlicher Fix nötig.
  - `#recipeSelect` ist bereits korrekt mit `<label for="recipeSelect">`/`aria-labelledby`
    verknüpft (identisches Muster wie `#preset`-Karte), keine Nacharbeit nötig.
- **Nicht angefasst (Test-Risiko):** `js/timer.js` wird in `tests/test.html` bewusst nicht
  geladen (Browser-APIs wie `Notification`/`setInterval`/Web Audio sind kein sinnvolles
  Unit-Test-Ziel, s. v3.11.0-Abschnitt) — die neuen ARIA-Attribute darin kollidieren also
  nicht mit den bestehenden 293 Prüfungen. `js/print.js`/`js/storage.js` wurden nicht
  verändert (nur HTML-Label + CSS-Klasse ergänzt) — auch dort unverändert grün.
- Manuell verifiziert per Headless-Edge-Dump (`--dump-dom`) gegen `tests/test.html`: alle
  293 Prüfungen weiterhin bestanden. `?v=` auf 3.12.0 gezogen (Desktop + Mobil),
  Standalone-Datei neu gebaut.

## Gärzeit-Timer / Wecker (v3.11.0)

Neues Modul `js/timer.js` (in Ladereihenfolge nach `guide.js`, vor `ui.js` — braucht
`PZ.$`/DOM, wird von `js/guide.js` nur optional aufgerufen). Rein clientseitig,
**kein Server, kein Service-Worker** — der Timer läuft nur, solange der Tab/das Fenster
geöffnet ist. Das ist eine bewusste Grenze (kein Bug) und wird dem Nutzer beim ersten
Timer-Start als kleiner Hinweistext auf der Seite mitgeteilt.

- **Welche Schritte bekommen einen Timer:** nur Schritte mit nennenswerter, unbeaufsichtigter
  Wartezeit — **Autolyse** (30 min), **Stretch & Fold-Phase** (120 min, nur bei Hydration
  ≥ 70 %), **Vorteig reifen lassen** (Biga/Poolish, `matureMin`), **Stockgare**
  (`f.bulkMin`), **Stückgare** (`f.proofMin`), **Ofen vorheizen** (fix 40 min, Richtwert
  aus „30–45 min"). Bewusst **kein** Timer bei Misch-/Knet-/Form-/Back-Schritten — die
  brauchen entweder Anwesenheit/Beobachtung oder sind zu kurz, um sich wegzubewegen.
- **Markup:** `js/guide.js` rendert pro timer-fähigem Schritt einen Platzhalter
  `<div class="timerbox" data-timer-key="…" data-timer-min="…"></div>` (neue Helper-
  Funktion `timerBox(key, min)`) als Teil des bestehenden `extra`-Felds im jeweiligen
  `st(...)`-Aufruf — **kein neues HTML in `pizza-rechner.html`/`-mobile.html` nötig**,
  da die komplette Anleitung (inkl. Timer-Boxen) ohnehin dynamisch in `#guideSteps`
  gerendert wird (identisch auf Desktop + Mobil, weil beide dasselbe `js/guide.js` laden).
  Stabile, sprechende Keys (`autolyse`, `stretch-fold`, `biga-reifen`, `poolish-reifen`,
  `stockgare`, `stueckgare`, `ofen-vorheizen`) statt Array-Index — bleiben über Regler-
  Änderungen und Re-Renders hinweg gleich.
- **`js/timer.js` (`PZ.wireTimers()`):** durchsucht nach jedem Rendern `#guideSteps` nach
  `.timerbox`-Elementen und rendert für jede entweder einen Start-Button
  („⏰ Timer starten (X min/h)") oder — falls in `localStorage['pizzaRechnerTimers']`
  bereits ein laufender/abgelaufener Timer für diesen Key existiert — den laufenden
  Countdown bzw. den „🔔 Fertig!"-Zustand samt „Zurücksetzen"-Button.
- **`js/guide.js` ruft `PZ.wireTimers()` am Ende von `buildGuide()` auf** (nach dem
  `$('guideSteps').innerHTML = html`-Zeile, mit `if (PZ.wireTimers)`-Guard, damit
  `tests/test.html` — das `js/timer.js` bewusst **nicht** lädt, s. u. — nicht bricht).
  Das ist der zentrale Kniff für Stabilität: `buildGuide()` läuft bei **jeder**
  Reglerbewegung und ersetzt `#guideSteps` komplett per `innerHTML` — ein rein DOM-
  gehaltener Timer-Zustand würde dabei verloren gehen. Der eigentliche Zustand
  (`endAt`, Label) lebt daher **ausschließlich in `localStorage`**, nicht im DOM;
  `wireTimers()` liest ihn bei jedem Aufruf neu aus und "klemmt" laufende Countdowns
  korrekt wieder an — auch beim Öffnen/Schließen anderer `<details>`-Karten im
  iOS-Akkordeon (kein Reset, weil der State nicht am DOM-Knoten hängt).
- **Mehrere gleichzeitig laufende Timer:** jeder Schritt hat einen eigenen Key, eigenes
  `setInterval` (Map `intervals[key]` in `js/timer.js`) und einen eigenen Eintrag in
  `localStorage['pizzaRechnerTimers']` (`{ [key]: { endAt, label } }`) — unabhängig
  start-/stoppbar (z. B. Vorteig-Timer im Kühlschrank + parallel ein Stretch-&-Fold-Timer).
- **Reload-Robustheit (kein Muss, aber einfach machbar gewesen):** `endAt` (absoluter
  Zeitstempel) statt einer verbleibenden Sekundenzahl in `localStorage` — ein
  versehentlicher Reload berechnet den Rest einfach neu (`endAt - Date.now()`) statt auf
  0 zurückzuspringen.
- **Browser-Notification (`Notification`-API):** `Notification.requestPermission()` wird
  **nur** beim expliziten Klick auf „Timer starten" angefragt (nicht automatisch beim
  Laden) — kein nerviger Permission-Dialog beim Öffnen der Seite. Bei Ablauf: falls
  `Notification.permission === 'granted'`, erscheint eine Browser-Notification
  („⏰ Timer fertig" + Schritt-Titel als Body).
- **Akustisches Signal ohne externe Datei:** `beep()` erzeugt einen kurzen aufsteigenden
  Dreiklang (880/1046,5/1318,5 Hz) rein synthetisch per **Web Audio API**
  (`OscillatorNode` + `GainNode`, Sinus, kurze Exponential-Fades) — kein `<audio>`-Tag,
  keine Sounddatei, keine externe Library (Web Audio API ist eine native Browser-API,
  fällt nicht unter „keine externen Libraries").
- **Fallback bei verweigerter/fehlender Permission:** unabhängig vom Notification-Status
  wechselt die Timer-Box selbst **immer** sichtbar in den „🔔 Fertig!"-Zustand
  (pulsierende Badge, `.timerdone`, CSS-Animation `timerpulse`) — wer die Seite offen
  hat/zurückkommt, sieht den Ablauf auch ganz ohne Notification-Erlaubnis.
- **Einmaliger Hinweistext** beim allerersten Timer-Start auf der Seite (`.timerhint`,
  verschwindet nach 9 s, merkt sich `pizzaRechnerTimerHintShown` in `localStorage` damit
  er nicht bei jedem Start erneut erscheint): „Der Timer läuft nur, solange dieser
  Tab/dieses Fenster geöffnet ist — kein Wecker mehr, wenn du den Tab schließt."
- **CSS (`css/styles.css`):** `.timerwrap`/`.timerbtn`/`.timerbtn-start`/`.timerclock`/
  `.timerdone` (inkl. `@keyframes timerpulse`)/`.timerhint`, passend zum bestehenden
  Farbschema (`--tomato` für Start-Button/laufenden Countdown, analog zu `.timechip`).
  `@media print`: `.timerbox`/`.timerhint` ausgeblendet (weder Anleitungs- noch
  Einkaufslisten-Druck sollen Timer-UI zeigen). `css/mobile.css`: `.timerbtn` bekommt
  `touch-action:manipulation` + `min-height:40px` (Touch-Ziel), analog zu den übrigen
  Buttons/Segmenten.
- **Desktop + Mobil:** keine neuen Element-IDs in den HTML-Dateien nötig (reine
  `js/guide.js`+`js/timer.js`-Änderung, wirkt automatisch auf beiden Seiten identisch,
  weil beide dasselbe `js/guide.js` laden) — trotzdem beide `<script src="js/timer.js">`
  ergänzt (Ladereihenfolge: nach `guide.js`, vor `ui.js`) und `?v=` auf 3.11.0 gezogen.
  Standalone-Datei neu gebaut.
- **Tests:** `js/timer.js` wird in `tests/test.html` bewusst **nicht** geladen — der
  Aufgabenstellung folgend sind Browser-APIs (`Notification`, `setInterval`, Web Audio)
  kein sinnvolles Unit-Test-Ziel, nur manuelle Verifikation im echten Browser. Bestehende
  248 Prüfungen bleiben unverändert grün (reine Additiv-Änderung an `extra`-HTML-Strings
  in `js/guide.js`, von den bestehenden `includes()`-Tests unberührt; `if (PZ.wireTimers)`-
  Guard verhindert einen Fehler, weil `PZ.wireTimers` in der Testsuite nicht existiert).
  Manuell verifiziert (Headless-Edge-Dump + Struktur-Check): Timer-Boxen erscheinen mit
  korrekten Keys/Minuten bei Autolyse/Stockgare/Stückgare/Ofen-Vorheizen (Standard-Zustand,
  Direkt-Methode, ~24 h Gare), Start-Button-Beschriftung korrekt formatiert („30 min",
  „2 h", „24 h", „40 min").

## Mehrere gespeicherte Rezepte (v3.10.0)

`js/storage.js` speichert nicht mehr nur einen einzelnen `state`-Slot, sondern beliebig
viele benannte, eigene Rezepte nebeneinander — unabhängig von den 7 festen Presets
(`js/presets.js`), die weiterhin unverändert im „Fertiges Rezept wählen"-Dropdown stehen.

- **Neues Speicherformat:** `localStorage['pizzaRechner']` ist jetzt
  `{ recipes: [{id, name, state, savedAt}], activeId }` statt eines nackten `state`.
  `id` ist ein zufälliger String (`makeId()`), `state` ist ein vollständiger Snapshot von
  `PZ.state` zum Speicherzeitpunkt, `savedAt` ein Zeitstempel (aktuell nicht in der UI
  angezeigt, aber fürs spätere Sortieren/Anzeigen vorbereitet).
- **Migration (automatisch, verlustfrei):** Erkennt `readStore()` beim ersten `load()`
  nach dem Update ein altes, nacktes `state`-Objekt (`isLegacyState()` prüft auf typische
  Felder wie `balls`/`hyd`, kein `recipes`-Array), wird daraus **automatisch und einmalig**
  ein erstes Rezept **„Mein Rezept"** erzeugt und im neuen Format zurückgeschrieben — die
  bisherigen Werte des Nutzers gehen dabei nicht verloren. Kein Präfix „Rezept 1" für den
  Migrationsfall (bewusst „Mein Rezept", damit der Nutzer seinen alten, vertrauten Stand
  wiedererkennt); **neu** angelegte Rezepte ohne eigenen Namen heißen automatisch
  „Rezept 1", „Rezept 2", … (`nextDefaultName()`).
- **API (`js/storage.js`):** `PZ.save()` (überschreibt das aktive Rezept, legt beim allerersten
  Aufruf automatisch eins an — bleibt 1:1 kompatibel zum bisherigen Quick-Save),
  `PZ.saveAsNew(name)` (legt immer ein neues Rezept an und macht es aktiv),
  `PZ.renameActive(name)`, `PZ.deleteRecipe(id)` (löscht, springt beim Löschen des aktiven
  Rezepts automatisch auf ein verbleibendes um), `PZ.loadRecipe(id)`, `PZ.listRecipes()`,
  `PZ.getActiveId()`. `PZ.load()` bleibt der Einstiegspunkt beim Seitenstart (lädt/migriert
  automatisch das aktive Rezept).
- **UI — eigene Card „💾 Meine Rezepte"** direkt unter „📖 Fertiges Rezept wählen" (Desktop +
  Mobil, identisches Markup/IDs): `#recipeSelect` (Dropdown aller gespeicherten Rezepte, lädt
  bei Auswahl sofort — analog zum Preset-Dropdown, aber **komplett getrennter State/Select**,
  keine Vermischung), `#recipeName` (Textfeld für einen neuen Namen) + `#recipeSaveNew`
  („➕ Neu" — speichert immer als **neues** Rezept), `#recipeRename` („✏️ Umbenennen" —
  einfacher `prompt()`-Dialog, passt zum bisherigen dialoglosen/minimalistischen Stil),
  `#recipeDelete` („🗑️ Löschen" — mit `confirm()`-Rückfrage). Keine Hard-Limit-Anzahl; das
  native `<select>` bleibt auch mit vielen Einträgen bedienbar (Scroll im Dropdown).
- **Bestehender `#saveBtn`** („💾 Speichern" im Ergebnis-Panel) bleibt der **Schnell-Speichern**-
  Button ohne Dialog: ruft weiterhin nur `PZ.save()` (überschreibt das aktive Rezept) und
  aktualisiert danach das `#recipeSelect`-Dropdown. **`#qbSave` auf Mobil** (Quick-Bar) klickt
  weiterhin einfach `#saveBtn` — unverändertes Daumen-Speichern, keine Logik dupliziert.
- **Verdrahtung in `js/main.js`:** `refreshRecipeSelect()` befüllt `#recipeSelect` aus
  `PZ.listRecipes()`/`PZ.getActiveId()` (auch als `PZ.refreshRecipeSelect` exponiert, damit
  `js/storage.js` nach `loadRecipe()` selbst neu befüllen kann); die vier Buttons/Select sind
  reine DOM-Glue-Handler, keine Berechnungslogik angefasst.
- **Presets vs. eigene Rezepte:** bewusst zwei unabhängige Konzepte/Datenquellen — ein Preset
  zu wählen setzt `#preset`, ein eigenes Rezept zu laden setzt nur `#recipeSelect` (und
  umgekehrt ändert keins das jeweils andere Dropdown). Beide bleiben nebeneinander bedienbar.
- **Tests:** neue Sektion „16 · Speichern & Laden (js/storage.js) — Migration & Mehrfach-
  Rezepte" in `tests/test.html` (`js/storage.js` wird dort zusätzlich geladen, mit Stubs für
  `PZ.set`/`PZ.selectSeg`/`PZ.applyMethod`/`PZ.updateTimeLabel`, da `ui.js` in der Testsuite
  nicht geladen wird). Prüft: Migration eines alten nackten `state`-Stands (Werte 1:1
  übernommen, korrekter `activeId`), sowie Speichern/Laden/Umbenennen/Löschen mehrerer
  unabhängiger Rezepte. Die Tests sichern einen eventuell vorhandenen echten
  `localStorage['pizzaRechner']`-Inhalt vor dem Lauf und stellen ihn danach wieder her —
  echte Nutzerdaten werden nie überschrieben. Bestehende 222 Prüfungen unverändert grün.
- **Desktop + Mobil:** identisches Markup/IDs in beiden HTML-Dateien ergänzt, `?v=` auf
  3.10.0 gezogen, Standalone-Datei neu gebaut.

## Einkaufsliste & getrennter Druck (v3.9.0)

Neues Modul `js/print.js` (in Ladereihenfolge nach `ui.js`, vor `presets.js` — braucht
`PZ.$` und `PZ.R`, wird von keinem anderen Modul vorausgesetzt). Rein additiv, **keine**
bestehende Logik/Datei (`calc.js`, `guide.js` etc.) verändert.

- **Einkaufsliste (`PZ.buildShoppingList()`):** liest ausschließlich die bereits
  berechneten Gesamtmengen aus `PZ.R` — **keine neue Berechnung**, nur Formatierung
  1:1 wie im Ergebnis-Panel (Mehl/Wasser/Eis gerundet, Salz/Öl 1 Nachkommastelle,
  Hefe < 10 g → 2 Nachkommastellen sonst gerundet, inkl. Frisch-/Trockenhefe-Label
  `R.yWord`). Zeilen nur wenn Betrag > 0: Mehl, Wasser, Salz, Hefe, Öl (Schwelle
  `oil >= 0.05` wie `#gOilRow`), Eis (`R.ice > 0`).
  **Bei Vorteig (Biga/Poolish) zeigt die Liste immer die Gesamtmengen**, nicht die
  Aufteilung Vorteig/Hauptteig — die bleibt fürs Formen im normalen Ergebnis-Panel
  (`#stagePref`/`#stageMain`) unverändert sichtbar.
- **Markup:** neues `<div id="shoppingList" class="shoppinglist-card">` im
  `.result`-Card, direkt vor dem `.actions`-Block (Desktop + Mobil identisch,
  gleiche ID). Standardmäßig `display:none` (`#shoppingList{display:none;}` in
  `css/styles.css`), wird nur beim Einkaufslisten-Druck sichtbar.
- **Zwei Druck-Buttons statt einem:** der bisherige einzelne „🖨️ Drucken"-Button
  wurde durch zwei ersetzt — „🛒 Einkaufsliste drucken" (`PZ.printShoppingList()`)
  und „📝 Anleitung drucken" (`PZ.printGuide()`). Beide rufen weiterhin ganz normal
  `window.print()` — **kein neuer Druckmechanismus**, nur zwei `body`-Klassen
  (`print-shopping`/`print-guide`), die vor dem Druck gesetzt und via `afterprint`-
  Event wieder entfernt werden, steuern per `@media print`, was sichtbar bleibt.
- **CSS (`@media print`, `css/styles.css`):**
  - `body.print-guide .result{display:none;}` → nur die Schritt-für-Schritt-Anleitung
    bleibt sichtbar (Eingaben/Header/Footer waren schon vorher per bestehender Regel
    ausgeblendet).
  - `body.print-shopping .result .card > *:not(.shoppinglist-card){display:none;}`
    + `.guidewrap{display:none;}` + `#shoppingList{display:block;}` → beim
    Einkaufslisten-Druck bleibt nur die Liste übrig (Ergebnis-Panel-Inhalte,
    Anleitung, Eingaben, Header/Footer alle ausgeblendet).
- **Desktop + Mobil:** identisches Markup/IDs in beiden HTML-Dateien ergänzt
  (`pizza-rechner.html` + `pizza-rechner-mobile.html`), `js/print.js` in beiden
  eingebunden, `?v=` auf 3.9.0 gezogen, Standalone-Datei neu gebaut.
- **Tests:** neue Sektion „15 · Einkaufsliste" in `tests/test.html` (`js/print.js`
  wird dort zusätzlich geladen, neuer `#shoppingList`-Stub) — prüft Zeilenauswahl
  (kein Öl bei 0 %, Öl-Zeile bei 4 %, keine/vorhandene Eis-Zeile je nach Wassertemp-
  Bedarf), identische Formatierung wie `PZ.R`, und dass bei Biga **keine** Vorteig/
  Hauptteig-Aufteilung in der Liste auftaucht (nur Gesamtmengen). Bestehende 217
  Prüfungen unverändert grün (kein bestehendes Modul/keine ID angefasst).

## Einfrier-Hinweis (v3.8.0)

Optionaler, informativer Tipp fürs Einfrieren geformter Teiglinge — kein Pflichtschritt,
unterbricht den normalen Ablauf (Formen → Stückgare → Backen) nicht und beeinflusst
`R.totalMin`/die Zeitplan-Rückrechnung nicht (reine Text-Ergänzung im `extra`-Feld des
Schritts, die Schritt-Dauer `dur: 10` bleibt unverändert).

- **Wo:** In `js/guide.js`, im Schritt „Teiglinge formen" (gemeinsamer Abschnitt
  „Gare & Formen" — läuft für **alle** Methoden (Direkt/Biga/Poolish) und **beide**
  `coldStage`-Varianten gleich durch, da der Schritt außerhalb der `pref`/`!pref`-Verzweigung liegt).
- **Formulierung** (zweiter `tip()`-Block nach dem bestehenden Cornicione-Tipp):
  „Einfrieren möglich: Teiglinge dünn mit Öl bestreichen, einzeln (nicht berührend)
  einfrieren – so **2–3 Monate** haltbar. Auftauen: **über Nacht im Kühlschrank**, dann
  **3–5 h bei Raumtemperatur** und **2–4 h Stückgare** wie gewohnt."
- Reine `js/guide.js`-Textänderung → wirkt automatisch auf Desktop **und** Mobil (keine
  neuen IDs/Markup nötig, kein HTML angefasst außer `?v=`-Bump).
- Neue Tests in Sektion „10 · Anleitungs-Hinweise" (`tests/test.html`): String-Matching auf
  „Einfrieren möglich" bei Direkt-Standard **und** bei Biga + `coldStage: 'bulk'` (belegt
  Methoden-/Kaltgare-Unabhängigkeit), plus Kontrollcheck dass `R.totalMin` weiterhin eine
  positive Zahl ist (keine Zeitplan-Störung).

## Accessibility (v3.7.0)

WCAG-2.1-AA-Audit (Desktop + Mobil, identische Fixes in beiden HTML-Dateien + `js/ui.js` +
`css/styles.css`). Befundliste war: 3 Blocker, 3 Major, 2 Minor — alle behoben.

- **Blocker — Label-Verknüpfung fehlte komplett:** Jedes `<label>` neben einem Slider/
  Zahlenfeld-Paar (Teiglinge, Gewicht, Hydration, Salz, Öl, Vorteig-Anteil, Biga-Hydration,
  Hefemenge, DDT, Raumtemp) stand nur visuell daneben, ohne `for`/`aria-labelledby` — Screenreader
  hatten für keinen dieser Regler einen Namen. Fix: jedes Feld-Label bekommt eine `id`
  (z. B. `id="hydLabel"`), beide zugehörigen Inputs (`range` + `number`) bekommen
  `aria-labelledby="hydLabel"` (ein Label kann mehrere Inputs benennen — kein `for` möglich,
  da zwei Inputs pro Label). Einzelne Controls (`#flour`-Select, `#timeISO`) bekamen normales
  `for`/`id`, das `#preset`-Select (hatte gar kein Label) ein `aria-label`.
- **Blocker — Custom-Controls ohne Zustand:** `.seg`-Segmente (Teigführung, Hefe-Art, Kalte
  Gare, Knetart, Bezugspunkt) und die dynamisch gerenderten Vorteig-Reife-Pills (`#prefStage`)
  zeigten den aktiven Zustand nur über die CSS-Klasse `.active` (Farbe) — für AT nicht erkennbar.
  Fix: `aria-pressed="true/false"` auf jedem Button, in `js/ui.js` zentral in `seg()`,
  `selectSeg()`, `renderPrefStages()` und `highlightPrefStage()` mitgepflegt (nicht nur im
  initialen Markup). Segment-Container bekamen zusätzlich `role="group"` +
  `aria-labelledby` aufs zugehörige Feld-Label.
- **Blocker — `#flourWarn` ohne Live-Region:** Die Mehl-/Hydration-Warnung wird bei jeder
  Reglerbewegung per `innerHTML` neu geschrieben, hatte aber keine ARIA-Live-Eigenschaft —
  Screenreader-Nutzer bekamen neue Warnungen nie mitgeteilt. Fix: `aria-live="polite"
  aria-atomic="true"` auf dem **statischen** Container (nicht dynamisch ersetzen — sonst
  feuert es nicht zuverlässig). `role="alert"` bewusst nicht verwendet (zu aufdringlich/
  assertiv bei Warnungen, die während des Reglerziehens laufend neu entstehen können).
- **Major — Kontrast `--muted` zu schwach:** `#8a7f76` (Hint-Texte, inaktive Segment-Labels)
  auf `--bg`/weißer Kartenfläche kam auf ≈3,6–3,9:1 (AA verlangt 4,5:1 für normalen Text).
  Neu: `--muted:#6e6359` → ≈5,4:1 (auf `--bg`) / ≈5,9:1 (auf Weiß) — bestanden mit Marge.
  (Zum Vergleich, geprüft & bereits ausreichend: weißer Text auf `--tomato` — Timechip,
  aktive Pill/Segment — ≈4,86:1; `.warn`-Text `#9a3a1c` auf `#fdf0ec` ≈6,3:1.)
- **Major — Fokus-Ring der Dropdowns unsichtbar:** `.selectbox:focus` nutzte
  `outline: 2px solid var(--crust)` (`#e8c98a`), Kontrast zu Weiß nur ≈1,6:1 (WCAG 1.4.11
  verlangt ≥3:1 für UI-Komponentenzustände). Neu: `outline-color: var(--tomato)` → ≈4,86:1.
- **Major — Slider ohne `aria-valuetext`:** native `<input type="range">` sagt nur die
  nackte Zahl an. `link()` in `js/ui.js` bekommt einen `unit`-Parameter, setzt
  `aria-valuetext` bei jeder Änderung **und** einmalig beim Setup (z. B. „62 Prozent
  Hydration" statt „62"). Rein additiv, keine Berechnungslogik berührt.
- **Geprüft, kein Fix nötig:** Tastatur-Reihenfolge folgt der DOM-/visuellen Reihenfolge auf
  beiden Seiten (inkl. `<details>`-Akkordeon auf Mobil — geschlossene Karten nehmen Kinder
  korrekt aus der Tab-Reihenfolge); Überschriften-Hierarchie h1→h2→h3 ohne Sprünge; `lang="de"`
  gesetzt; Quick-Bar-Bottom-Padding (`.wrap{padding-bottom:calc(84px + safe-area-inset-bottom)}`)
  verdeckt keine fokussierten Elemente am Seitenende.
- **Nicht angefasst (Test-Risiko):** `tests/test.html` prüft `#flourWarn`- und
  `#guideSteps`-Inhalte nur per `innerHTML.includes(text)` — keine der neuen ARIA-Attribute
  kollidiert damit, Tests liefen unverändert grün.
- `?v=` auf 3.7.0 gezogen (Desktop + Mobil), Standalone-Datei neu gebaut.

## Mobile iOS-Feinschliff (v3.6.0)

Reiner Mobil-Layout-/UX-Feinschliff (nur `pizza-rechner-mobile.html` + `css/mobile.css` +
das mobil-eigene Inline-Script — **keine** `js/*`- und **keine** Desktop-Änderung, IDs 1:1 gleich):

- **Safe-Area-Insets (iOS Notch/Home-Indikator):** Bei „Zum Home-Bildschirm" läuft die App
  mit `black-translucent`-Statusleiste + `viewport-fit=cover` unter die Statusleiste. `header`
  bekommt jetzt `padding-top: calc(22px + env(safe-area-inset-top))`, `.wrap`/`.guidewrap`/
  `footer` respektieren seitliche + untere Insets (Querformat-Rundungen, Home-Indikator).
- **Speichern per Daumen aus der Quick-Bar:** Die untere Sticky-Bar ist jetzt zweigeteilt —
  links `🍕 … g` als Sprung zum Ergebnis (`a.qb-jump[href="#result"]`), rechts ein Button
  `#qbSave`. Der löst per `saveBtn.click()` **denselben** bestehenden Speichern-Handler aus
  (keine Logik dupliziert), inkl. eigenem „✓ Gespeichert"-Feedback. Einhandbedienung.
- **Akkordeon-Auto-Scroll:** Öffnet man eine `details.card`, deren Kopf gerade nicht oben
  steht, scrollt das mobile Inline-Script die Summary sanft nach oben (`scrollIntoView`,
  Schwelle top<0 oder >90 px) — kein Blick mehr am Ende der vorigen Card. `scroll-margin-top`
  hält Abstand zum Rand.
- **Touch-Feinschliff:** `touch-action:manipulation` (kein 300 ms-Delay / Doppeltipp-Zoom auf
  Buttons/Slidern/Selects), `-webkit-tap-highlight-color:transparent`, `:active`-Feedback für
  Segmente/Pills/Aktionen, `overscroll-behavior-y:contain` gegen den Rubber-Band-Weißblitz.
- **Pflege:** Das mobil-eigene Inline-Script hängt jetzt drei Glue-Funktionen an (Quick-Total-
  Spiegel via `MutationObserver`, Quick-Save, Akkordeon-Scroll) — alle nur DOM-Glue, greifen
  **nicht** in die PZ-Rechenmodule ein. `?v=` in der Mobil-HTML auf 3.6.0 gezogen; Desktop-HTML
  bewusst unangetastet (nur Mobil-Layout betroffen). Danach `build-mobile-standalone.py` neu
  gebaut. Tests: 136/136 grün (IDs unverändert).

## Mobile Ansicht (v3.5.0)

`pizza-rechner-mobile.html` ist eine **komplett separate HTML-Datei** für Handys (auf Wunsch,
da bewusst mehr Bedienkomfort als reines responsives CSS gewünscht war). Sie bindet
**dieselben JS-Module unverändert** ein (gleiche Element-IDs wie auf der Desktop-Seite) —
es gibt also **keine zweite Rechenlogik**, nur ein anderes Markup/CSS drumherum:

- **Akkordeon statt Dauer-Scroll:** jede `.card` ist ein natives `<details>`/`<summary>`
  (kein eigenes JS nötig). „Fertiges Rezept" + „Grundeinstellungen" starten offen,
  „Methode & Hefe" / „Temperatur" / „Zeitplan" starten zu.
- **Größere Touch-Ziele** (`css/mobile.css`): Slider-Thumbs, Pills, Buttons, Zahlenfelder
  ≥ 44 px Mindesthöhe (Apple-HIG-Empfehlung), Schriftgröße 16 px bei Inputs (verhindert
  Safari-Auto-Zoom beim Fokussieren).
- **Sticky Quick-Bar unten** (`.quickbar`): zeigt live das Gesamtgewicht (per
  `MutationObserver` auf `#totalW` gespiegelt, kleines Inline-Script nur in dieser Datei)
  und springt per Anker-Link (`#result`) zum Ergebnis-Panel — kein Sidebar-Scrollen nötig.
- **Ergebnis-Panel nicht mehr sticky** (`css/mobile.css` überschreibt `.result{position:static}`),
  da es auf Mobil ohnehin unter den Eingaben liegt statt daneben.
- Kopfzeile jeder Seite verlinkt zur jeweils anderen (`.viewlink`, Klasse liegt in
  `css/styles.css`, damit sie auf beiden Seiten ohne `mobile.css` funktioniert):
  Desktop → „📱 Zur Mobil-Ansicht", Mobil → „🖥️ Zur Desktop-Ansicht".
- Zusätzliche Meta-Tags für „Zum Home-Bildschirm" auf iOS (Vollbild ohne Safari-Leiste,
  eigener Titel, Theme-Farbe): `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`,
  `theme-color`. Kein echtes PWA-Manifest/Service-Worker (nicht nötig — Datei liegt eh
  lokal/offline, z. B. über iCloud Drive synct).
- **Pflege-Hinweis:** Bei neuen Eingabefeldern/IDs in `pizza-rechner.html` müssen dieselben
  Felder (gleiche IDs!) auch in `pizza-rechner-mobile.html` ergänzt werden — sonst greift
  die JS-Logik dort ins Leere. Reine Logik-/Berechnungsänderungen in `js/*` brauchen dagegen
  **keine** Anpassung an der Mobil-Datei, die lädt dieselben Module.

### Standalone-Datei fürs iPhone (Pflicht, wegen iOS-Einschränkung!)

**Wichtiger Fund aus der Praxis:** iOS blockiert bei HTML-Dateien, die aus iCloud Drive
(Dateien-App) heraus geöffnet werden, das Nachladen von Geschwister-Dateien (`css/`, `js/`)
per `file://` — **egal ob Safari oder Edge** (beide nutzen denselben WebKit-Unterbau unter
iOS). Ergebnis: Seite lädt ungestylt (Serifenschrift, Standard-Regler) und ohne Funktion,
obwohl alle Dateien nachweislich korrekt in iCloud Drive liegen.

**Lösung:** `build-mobile-standalone.py` (Python, im Projekt-Hauptordner) baut aus
`pizza-rechner-mobile.html` eine einzige, in sich geschlossene Datei
**`pizza-rechner-mobile-standalone.html`** — CSS und JS werden per Regex direkt inline in
`<style>`/`<script>` eingebettet, keine externen `<link>`/`<script src>`-Verweise mehr.
**Nur diese `-standalone.html`-Datei geht aufs iPhone** (keine `css/`/`js`-Ordner nötig!).

- **Aufruf:** `python build-mobile-standalone.py` im Projektordner — liest
  `pizza-rechner-mobile.html` + `css/styles.css` + `css/mobile.css` + alle `js/*.js`,
  schreibt `pizza-rechner-mobile-standalone.html` neu.
- **Nach JEDER Änderung an `pizza-rechner-mobile.html` oder an `js/*`/`css/*` erneut laufen
  lassen**, bevor die Datei aufs iPhone synct wird — sonst ist die iPhone-Version veraltet.
- `pizza-rechner-mobile-standalone.html` selbst **nicht von Hand bearbeiten** (wird
  überschrieben) — sie ist reines Build-Ergebnis, nicht Quelle.
- Ist noch nicht ins Cache-Busting/`?v=`-Schema eingebunden (Datei enthält den Code direkt,
  kein Caching-Problem); trotzdem bei jedem Versions-Bump neu bauen.
- Für den Desktop-Rechner (`pizza-rechner.html`) besteht dasselbe Risiko NICHT, solange er
  vom PC per Doppelklick (lokales Dateisystem, kein iCloud-Sandboxing) geöffnet wird.

### Live-Version via GitHub Pages (seit v3.5.0)

Repo ist auf GitHub gepusht: **`https://github.com/Birnify/pizza-rechner`** (Remote `origin`,
Branch `master`), GitHub Pages ist aktiv (Settings → Pages → Deploy from branch → master → root).

**Das iPhone nutzt jetzt diese Live-URL statt einer lokalen Datei:**
`https://birnify.github.io/pizza-rechner/pizza-rechner-mobile-standalone.html`

Grund: „Zum Home-Bildschirm hinzufügen" (System-Funktion, auch aus Chrome/Edge nutzbar)
braucht eine echte `https://`-URL — funktioniert mit einer lokalen `file://`-Datei nicht.
Mit der Pages-URL klappt „Zum Home-Bildschirm" zuverlässig in jedem iOS-Browser.

**Bei jeder Version mitziehen:** nach Änderungen an `pizza-rechner-mobile.html`/`js/`/`css/`
→ `python build-mobile-standalone.py` laufen lassen → committen → `git push` (Remote ist
bereits gesetzt) → GitHub Pages baut automatisch neu (dauert ~1 Min). Die Desktop-Seite
(`pizza-rechner.html`) liegt zwar auch im selben Repo/auf Pages, wird aber weiterhin primär
lokal per Doppelklick genutzt (kein Vorteil durch Pages dort).

## Dateistruktur (modular)

```
pizza-rechner.html   Markup + Einbindung von CSS und allen JS-Modulen (?v=3.5.0)
pizza-rechner-mobile.html  Mobil-Ansicht (Akkordeon), nutzt dieselben JS-Module + IDs (Quelle)
pizza-rechner-mobile-standalone.html  Build-Ergebnis (alles inline) — DIESE Datei geht aufs iPhone
build-mobile-standalone.py  Python-Skript, das die Standalone-Datei erzeugt (Aufruf s. o.)
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       komplettes Stylesheet (inkl. .selectbox / .selectbox-lg / .viewlink)
css/mobile.css       Ergänzungen NUR für pizza-rechner-mobile.html (Akkordeon, Touch-Ziele, Quick-Bar)
js/dom.js            $-Helfer, legt globalen Namespace window.PZ an
js/state.js          PZ.state (inkl. flour, oil, coldStage, prefMature) + PZ.FRESH_TO_DRY (1/3)
js/flour.js          PZ.FLOURS (13 Mehle) + PZ.getFlour() + Dropdown-Befüllung
js/calc.js           PZ.calc() Hauptberechnung (inkl. Öl), schreibt PZ.R, ruft PZ.buildGuide()
js/schedule.js       PZ.schedule() — Gärzeit-Fahrplan (berücksichtigt coldStage)
js/guide.js          PZ.buildGuide() — Anleitung + Zeitberechnung + Mehl-Warnung + Timer-Platzhalter
js/timer.js          PZ.wireTimers() — Gärzeit-Timer/Wecker je Schritt (Notification + Web-Audio-Beep,
                     State in localStorage['pizzaRechnerTimers'], kein Server/Service-Worker)
js/ui.js             Slider/Segmente/Pills/Zeitplan; PZ.set, selectSeg, applyMethod, updateTimeLabel
js/print.js          PZ.buildShoppingList() (Einkaufsliste aus PZ.R) + PZ.printShoppingList()/PZ.printGuide()
js/presets.js        PZ.PRESETS (inkl. flour je Preset) + PZ.applyPreset()
js/storage.js        PZ.save()/PZ.load() + Mehrfach-Rezepte (saveAsNew/renameActive/deleteRecipe/
                     loadRecipe/listRecipes), localStorage-Format {recipes[],activeId}, migriert
                     alten Einzel-Slot-Stand automatisch
js/main.js           Start: Speichern-Button, Rezept-Auswahl/-Buttons, load(), applyMethod(), calc()
tests/test.html      293 Prüfungen in 16 Kategorien (Doppelklick, kein Server)
README.md            kurzer Einstieg
```

**Ladereihenfolge** (Abhängigkeiten): dom → state → flour → calc → schedule → guide →
timer → ui → print → presets → storage → main. Jedes Modul ist eine IIFE, kommuniziert nur über `window.PZ`.

**Cache-Busting:** CSS/JS werden mit `?v=3.13.0` geladen. **Bei jeder neuen Version mitziehen.**

**Sichtbare Versionsnummer (seit v3.7.1):** Im `<footer>` beider HTML-Dateien (Desktop +
Mobil, identisch) steht `<span id="appVersion">vX.Y.Z</span>` — rein statischer Text, keine
JS-Logik dahinter. **Bei jedem Versionssprung von Hand mitziehen** (zusammen mit `?v=` und der
Kontext-Datei), sonst zeigt die Live-App die falsche Version an.

## Wichtige Berechnungs-Details

- `calc()`: Mehl = total/(1+h+s+y+o); Öl = Mehl×o; Trockenhefe = Frischhefe × 1/3
- Vorteig: `pYeast = yeast` (100 % in den Vorteig), `mYeast = 0`, **Öl → Hauptteig**; Poolish-Wasser immer 1:1
- DDT: `wT = ddt×3 − room − room − friction` (Hand 3 °C, Maschine 6 °C; Mehltemp = Raumtemp angenommen)
- Eis: Energiebilanz `x = M·c·(Ttap−wT) / (Lf + c·wT + c·(Ttap−wT))`, c=4,18, Lf=334
- Schedule-Schwellen (yeast %): ≥1,2 Schnell · ≥0,5 Mittel · ≥0,18 ~24 h · ≥0,08 ~48 h · sonst 72 h+
- Zeitplan: `totalMin` = Summe Step-Dauern; Ziel-Modus rechnet rückwärts; `back:50` beim Vorheizen

## Entwicklungsweise / Mitarbeit

- **Kontext-Datei IMMER aktuell halten — nach JEDER Eingabe** (diese Datei ist die einzige
  Quelle für eine frische Session; Stand-Datum + Version oben mitziehen).
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
- **Tests:** `tests/test.html` per Doppelklick — grün = OK. **293 Prüfungen** in 16 Kategorien:
  Bäckerprozente, DDT/Eis, Vorteig-Aufteilung (inkl. Klemm-Grenzfälle exakt an/über der Grenze,
  auch für Biga wenn `bhyd > hyd`), Trockenhefe, Schedule-Schwellen (beide coldStage-Varianten),
  Mehl-Warnung (inkl. Vorteig-Reifezeit + exakte hydMin/hydMax-Grenzwerte), Backzeit-Skalierung,
  Vorteig-Reifezeit, Olivenöl (Masseerhaltung), Anleitungs-Hinweise (Autolyse-Dauer,
  Hefe-Präzision < 1 g, auch bei Trockenhefe), **Randfälle/Edge Cases** (1 bzw. 20 Teiglinge,
  0 % Öl, Hefemenge exakt an der 1-g-Grenze), **Kombinationen** (Vorteig + Kaltgare-Stufe `bulk`
  + Öl + Trockenhefe gleichzeitig statt isoliert), **Masseerhaltung für alle Methoden + alle
  7 Presets** (nicht nur Direkt/Teglia), **Zeitplan-Rückwärtsrechnung** ("Fertig sein um…" —
  prüft, dass der errechnete Startzeitpunkt im Anleitungstext korrekt erscheint, auch bei Biga
  mit Vorteig-Reifezeit). Nach Logik-Änderungen laufen lassen. BASE hat `oil: 0` (isoliert die
  Öl-Tests). v3.6.1: Testsuite von 136 auf 213 Prüfungen gehärtet (reine Test-Erweiterung,
  keine Logikänderung). v3.9.0: neue Sektion „15 · Einkaufsliste" (213→222 Prüfungen),
  testet `js/print.js` (Zeilenauswahl, Formatierung, Vorteig zeigt nur Gesamtmengen).
  v3.10.0: neue Sektion „16 · Speichern & Laden" (222→248 Prüfungen), testet `js/storage.js`
  (Migration alter Einzel-Slot-Stand, Mehrfach-Rezepte speichern/laden/umbenennen/löschen).
  v3.11.0: **keine neue Test-Sektion** — `js/timer.js` (Gärzeit-Timer/Wecker) nutzt
  `Notification`/`setInterval`/Web Audio API, die bewusst **nicht** in `tests/test.html`
  unit-getestet werden (schwer sinnvoll automatisierbar, s. Projektregeln); `js/timer.js`
  wird dort auch nicht geladen. Bestehende 248 Prüfungen unverändert grün (rein additive
  `extra`-HTML-Ergänzung in `js/guide.js`, `if (PZ.wireTimers)`-Guard verhindert Fehler ohne
  geladenes `js/timer.js`). Manuell verifiziert: Timer-Start/-Countdown/-Ablauf, Notification-
  Permission-Flows (erlaubt/verweigert/„default"), Persistenz über Reload, mehrere parallele
  Timer, Struktur-Check per Headless-Edge-Dump auf allen drei HTML-Dateien.
  v3.11.1 (reine Test-Erweiterung, kein Feature/keine Logik-Änderung): Sektionen „15 ·
  Einkaufsliste" und „16 · Speichern & Laden" von 248 auf **293 Prüfungen** gehärtet.
  Neu in „15": Poolish zeigt ebenfalls Gesamtmengen (bisher nur Biga getestet),
  Frisch-/Trockenhefe-Label `R.yWord` in der Liste, Hefe-Rundungsgrenze exakt an 10 g
  (knapp unter → 2 Nachkommastellen, knapp über → gerundete Ganzzahl bei 20 Teiglingen),
  Extremwerte 1 bzw. 20 Teiglinge (Gesamtteig bleibt exakt N × W), 0 %-Öl-Grenzfall, sowie
  `buildShoppingList()` ohne `PZ.R` (z. B. vor dem ersten `calc()`) wirft keinen Fehler.
  Neu in „16": leerer localStorage (kein Key) und korruptes JSON (`JSON.parse` schlägt fehl)
  werden beide fehlerfrei wie „leer" behandelt (`listRecipes()` = `[]`, `getActiveId()` =
  `null`); Löschen des **letzten** verbleibenden Rezepts (`activeId` wird `null`); Löschen
  eines **nicht-aktiven** Rezepts (`activeId` bleibt unverändert); Umbenennen auf einen
  bereits vergebenen Namen (Duplikate sind erlaubt, keine Dedupe-Logik in `renameActive()`);
  Umbenennen auf leeren/Leerzeichen-String (No-op, Name bleibt); `saveAsNew()` ohne
  gültigen Namen erzeugt fortlaufend „Rezept 1"/„Rezept 2"/„Rezept 3"; `loadRecipe()` mit
  unbekannter id (No-op, weder `activeId` noch `PZ.state` ändern sich); mehrfaches `PZ.save()`
  auf demselben aktiven Rezept überschreibt (keine Duplikate, gleiche `id`). Verifiziert per
  Headless-Edge-Dump (`msedge --headless --virtual-time-budget=5000 --dump-dom`, **nicht**
  das Preview-Tool — Cache-Fehlalarm-Risiko mit alten `js/*`-Ständen): alle 293 Prüfungen grün.
  v3.12.0 (Accessibility-Nachaudit, s. o.): reine ARIA-/CSS-/Label-Ergänzung, `js/timer.js`
  wird in `tests/test.html` weiterhin nicht geladen (Browser-APIs, s. o.) — 293 Prüfungen
  unverändert grün, erneut per Headless-Edge-Dump verifiziert.
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
- v3.1.0 — Vorteig-Reifezeit als (stufenloser) Slider (in v3.2.0 ersetzt)
- v3.2.0 — Vorteig-Reife als gekoppelte Stufen:
  - Stufenloser Slider raus → diskrete Pills (`PZ.PREF_STAGES`), die Reifezeit **und**
    Hefemenge zusammen setzen (weil physikalisch abhängig). Biga b16/b24/b48, Poolish p8/p14/p24.
  - Generische Hefe-Pills werden bei Vorteig ausgeblendet; Hefe-Regler bleibt (Feintuning).
  - `minH` der Mehle konservativ rekalibriert → keine False-Positive-Warnungen mehr.
  - Neue Preset-Plausibilitäts-Tests: jedes Preset darf keine Mehl-Warnung auslösen.
  - `.pills button.active`-CSS für die aktive Stufe.
- v3.3.0 — Olivenöl in Formel + allen Presets:
  - Neuer Öl-Slider (`state.oil`, 0–8 %, Default 2 %); Formel um `+ Öl%` erweitert (Masse bleibt N×W).
  - Öl kommt spät (nach dem Salz) in die Anleitung; bei Vorteig komplett in den Hauptteig.
  - Result-Panel: Öl-Zeile in Gesamtmengen (`#gOilRow`) + Hauptteig (`#mOilRow`), bei 0 % versteckt.
  - Alle 7 Presets bekommen Öl (neapolitanisch 2 %, Teglia 4 %); Zucker bewusst weiterhin nicht.
  - Neue Test-Sektion „9 · Olivenöl" (Masseerhaltung, Öl im Hauptteig); Preset-Tests um Öl ergänzt.
- v3.4.0 — Autolyse-Warnung & Hefe-Präzisionshinweis:
  - Autolyse-Schritt warnt jetzt immer vor zu langer Dauer ohne Salz (Enzym-/Glutenabbau-Risiko).
  - Bei < 1 g Hefe (absolut): Hinweis, sie in Wasser aufzulösen (auch Trockenhefe) + 0,01-g-Feinwaage.
  - Neue Test-Sektion „10 · Anleitungs-Hinweise" prüft beide Schwellen.
- v3.5.0 — Mobile Ansicht (Akkordeon):
  - Neue Datei `pizza-rechner-mobile.html` + `css/mobile.css`, siehe Abschnitt „Mobile Ansicht" oben.
  - Keine Logik dupliziert — nutzt dieselben `js/*`-Module über identische Element-IDs.
  - Kopfzeilen verlinken jetzt wechselseitig zwischen Desktop- und Mobil-Ansicht (`.viewlink`).
  - Anlass: App soll aufs iPhone (z. B. via iCloud Drive + „Zum Home-Bildschirm"); reines
    responsives CSS wurde als nicht komfortabel genug empfunden — explizit vereinfachte
    Mobil-Bedienung gewünscht (siehe Nutzer-Entscheidung in der Session).
- v3.6.0 — Mobile iOS-Feinschliff:
  - Safe-Area-Insets (Notch/Statusleiste oben, Home-Indikator + Querformat-Rundungen) für
    Header/Wrap/Guide/Footer/Quick-Bar → Home-Screen-Start liegt nicht mehr unter der Statusleiste.
  - Quick-Bar zweigeteilt: Sprung zum Ergebnis + Daumen-Speichern (`#qbSave` → `saveBtn.click()`,
    keine Logik dupliziert).
  - Akkordeon-Auto-Scroll: geöffnete Card scrollt sanft in den sichtbaren Bereich.
  - Touch-Feinschliff: `touch-action:manipulation`, `:active`-Feedback, `overscroll-behavior`.
  - Nur Mobil-Layout betroffen (Desktop-HTML unverändert); `?v=`→3.6.0, Standalone neu gebaut,
    Tests 136/136 grün.
- v3.6.1 — Testsuite gehärtet:
  - Reine Test-Erweiterung (kein Logik-/UI-Code geändert): 136 → 213 Prüfungen.
  - Poolish/Biga-Klemmgrenze jetzt exakt an der Grenze UND 1 % darüber getestet; erstmals auch
    der Fall „Biga wird geklemmt" (`bhyd > hyd`) — vorher nur der unbegrenzte Biga-Fall geprüft.
  - Mehl-Warnung: hydMin/hydMax jetzt exakt auf der Grenze (kein Warn) vs. 0,01 % drüber (Warn) geprüft.
  - Neue Sektion „11 · Randfälle": 1 und 20 Teiglinge, 0 % Öl, Hefemenge exakt an der 1-g-Schwelle.
  - Neue Sektion „12 · Kombinationen": Vorteig (Biga/Poolish) + `coldStage: 'bulk'` + Öl +
    Trockenhefe gleichzeitig (vorher wurden diese Features nur isoliert getestet).
  - Neue Sektion „13 · Masseerhaltung": Identität `flour+water+salt+yeast+oil=total` jetzt für
    alle 3 Methoden UND alle 7 Presets geprüft (vorher nur Direkt/Teglia/Biga vereinzelt).
  - Neue Sektion „14 · Zeitplan-Rückwärtsrechnung": „Fertig sein um…"-Modus war bisher gar nicht
    getestet — jetzt wird geprüft, dass der zurückgerechnete Startzeitpunkt korrekt im
    Anleitungstext erscheint (auch mit Vorteig-Reifezeit bei Biga).
  - Kein Bug gefunden — alle neuen Tests liefen beim ersten Anlauf grün gegen die bestehende Logik.
- **v3.7.0 — Accessibility (WCAG 2.1 AA)**:
  - Alle Slider/Zahlenfelder + Selects + Zeitfeld jetzt programmatisch mit ihrem `<label>`
    verknüpft (`for`/`aria-labelledby`/`aria-label`) — vorher komplett unverknüpft.
  - Segment-Buttons + Vorteig-Reife-Pills bekommen `aria-pressed` (zentral in `js/ui.js`
    gepflegt), Segment-Container `role="group"`.
  - `#flourWarn` bekommt `aria-live="polite"` — Warnungen werden jetzt vorgelesen.
  - Kontrastfixes: `--muted` `#8a7f76`→`#6e6359` (3,6:1→5,4:1+), Fokus-Outline der Dropdowns
    `--crust`→`--tomato` (1,6:1→4,86:1).
  - Slider bekommen `aria-valuetext` mit Einheit (z. B. „62 Prozent Hydration").
  - Reine a11y-Ergänzung, keine Berechnungslogik geändert; Tests unverändert grün.
- v3.7.1 — Sichtbare Versionsnummer:
  - Footer beider Seiten zeigt jetzt `vX.Y.Z` (`<span id="appVersion">`) — Nutzer sieht direkt,
    welche Version aktiv ist (auch auf dem per iCloud/GitHub-Pages synchten iPhone hilfreich,
    um zu prüfen ob die neueste Version geladen wurde).
  - Rein statischer Text, keine JS-Logik. **Muss ab jetzt bei jedem Versionssprung von Hand
    mitgezogen werden** (zusammen mit `?v=`).
- v3.8.0 — Einfrier-Hinweis:
  - Neuer optionaler Tipp im Schritt „Teiglinge formen" (`js/guide.js`): Teiglinge einölen,
    einzeln einfrieren (2–3 Monate), Auftauen über Nacht Kühlschrank + 3–5 h RT + 2–4 h Stückgare.
  - Reine Text-Ergänzung, kein Pflichtschritt — beeinflusst `R.totalMin`/Zeitplan nicht, gilt
    methoden- und kaltgare-unabhängig (liegt im gemeinsamen Schritte-Abschnitt).
  - Reine `js/guide.js`-Änderung, wirkt automatisch auf Desktop + Mobil; `?v=` auf 3.8.0 gezogen,
    Standalone-Datei neu gebaut.
  - Neue Tests in Sektion „10 · Anleitungs-Hinweise" (Direkt-Standard + Biga/`coldStage: bulk`
    + Kontrollcheck `R.totalMin` unverändert positiv).
- v3.9.0 — Einkaufsliste & getrennter Druck:
  - Neues Modul `js/print.js`: `PZ.buildShoppingList()` rendert eine Einkaufsliste rein aus
    den bereits berechneten `PZ.R`-Gesamtmengen (keine neue Berechnung), Formatierung 1:1 wie
    im Ergebnis-Panel. Bei Vorteig immer Gesamtmengen, keine Vorteig/Hauptteig-Aufteilung.
  - Der bisherige einzelne „Drucken"-Button wurde durch zwei ersetzt: „🛒 Einkaufsliste
    drucken" und „📝 Anleitung drucken" — beide nutzen weiterhin `window.print()`, gesteuert
    über zwei neue `body`-Klassen (`print-shopping`/`print-guide`) + `@media print`-Regeln.
  - Neues `<div id="shoppingList">` im Ergebnis-Panel (Desktop + Mobil, gleiche ID),
    standardmäßig unsichtbar, erscheint nur im Einkaufslisten-Druck.
  - `js/print.js` in beide HTML-Dateien eingebunden, `?v=` auf 3.9.0, Standalone neu gebaut.
  - Neue Test-Sektion „15 · Einkaufsliste" (213 → 222 Prüfungen), bestehende Tests unverändert
    grün (kein bestehendes Modul angefasst).
- **v3.10.0 — Mehrere gespeicherte Rezepte**:
  - `js/storage.js` umgebaut: `localStorage['pizzaRechner']` speichert jetzt beliebig viele
    benannte Rezepte (`{recipes:[{id,name,state,savedAt}], activeId}`) statt eines nackten
    `state`. Alter Einzel-Slot-Stand wird beim ersten `load()` automatisch und verlustfrei zu
    einem ersten Rezept „Mein Rezept" migriert.
  - Neue API: `PZ.saveAsNew()`, `PZ.renameActive()`, `PZ.deleteRecipe()`, `PZ.loadRecipe()`,
    `PZ.listRecipes()`, `PZ.getActiveId()`. `PZ.save()`/`PZ.load()` bleiben rückwärtskompatibel
    (überschreiben/laden das aktive Rezept) — `#saveBtn` und Mobil-`#qbSave` unverändert nutzbar.
  - Neue UI-Card „💾 Meine Rezepte" (Desktop + Mobil, identisch) unter den Presets: eigenes
    Dropdown + Neu/Umbenennen/Löschen — komplett getrennt von den 7 festen Presets.
  - Neue Test-Sektion „16 · Speichern & Laden" (222 → 248 Prüfungen): Migration + Mehrfach-
    Rezepte, sichert/restauriert einen eventuell vorhandenen echten Speicherstand.
  - `?v=` auf 3.10.0 gezogen (Desktop + Mobil), Standalone-Datei neu gebaut.
- **v3.11.0 — Gärzeit-Timer / Wecker**:
  - Neues Modul `js/timer.js`: Timer-Widget je Anleitungs-Schritt mit nennenswerter
    Wartezeit (Autolyse, Stretch & Fold, Vorteig reifen lassen, Stockgare, Stückgare,
    Ofen vorheizen). Rein clientseitig, kein Server/Service-Worker — läuft nur solange
    der Tab offen ist (im UI kommuniziert).
  - Countdown mit Browser-Notification (`Notification.requestPermission()` nur auf
    expliziten „Timer starten"-Klick) + synthetischem Beep per Web Audio API (kein
    `<audio>`, keine externe Datei) + sichtbarem „🔔 Fertig!"-Fallback unabhängig von der
    Notification-Erlaubnis.
  - Mehrere Timer unabhängig parallel start-/stoppbar; State (`endAt` + Label) in
    `localStorage['pizzaRechnerTimers']` — übersteht Reload und das Öffnen/Schließen
    anderer `<details>`-Karten im iOS-Akkordeon, weil der Zustand nicht am DOM hängt.
  - Keine neuen HTML-IDs nötig (Timer-Boxen werden dynamisch von `js/guide.js` in
    `#guideSteps` gerendert) — trotzdem `<script src="js/timer.js">` in beiden HTML-
    Dateien ergänzt, `?v=` auf 3.11.0, Standalone neu gebaut.
  - Keine neue Test-Sektion (Browser-APIs nicht sinnvoll unit-testbar); bestehende
    248 Prüfungen unverändert grün, manuell im Browser verifiziert.
- **v3.11.1 — Testsuite gehärtet (Einkaufsliste & Speichern/Laden)**:
  - Reine Testergänzung, **keine** Logik-/Feature-Änderung in `js/print.js` oder
    `js/storage.js` — kein `?v=`-Bump, kein Standalone-Rebuild nötig.
  - Sektion „15 · Einkaufsliste": Poolish (bisher nur Biga) zeigt ebenfalls Gesamt- statt
    Vorteig-Mengen, Frisch-/Trockenhefe-Label `R.yWord`, Hefe-Rundungsgrenze exakt an 10 g
    (2 Nachkommastellen vs. gerundete Ganzzahl), Extremwerte 1/20 Teiglinge, 0 %-Öl-Grenzfall,
    `buildShoppingList()` ohne `PZ.R` wirft keinen Fehler.
  - Sektion „16 · Speichern & Laden": leerer localStorage, korruptes JSON (beide fehlerfrei
    wie „leer" behandelt), Löschen des letzten bzw. eines nicht-aktiven Rezepts, Umbenennen
    auf Duplikat-Namen bzw. leeren String, `saveAsNew()` ohne Namen (fortlaufende
    „Rezept N"-Namen), `loadRecipe()` mit unbekannter id, mehrfaches `PZ.save()` auf
    demselben Rezept (überschreibt, kein Duplikat).
  - 248 → 293 Prüfungen, alle grün (verifiziert per Headless-Edge-Dump, nicht per
    Preview-Tool — Cache-Fehlalarm-Risiko).
- **v3.12.0 — Accessibility-Nachaudit (Timer, Rezepte, Einkaufsliste)**:
  - Gezielter WCAG-2.1-AA-Nachaudit für die drei jüngsten Feature-Runden (v3.9.0–v3.11.0),
    siehe Abschnitt „Accessibility-Nachaudit v3.12.0" oben für Details. 2 Blocker (Timer-
    Countdown/„Fertig!" ohne Live-Region, `#recipeName` ohne Label), 2 Major (Kontrast
    `.timerclock` 4,45:1→6,06:1, Timer-Hinweistext ohne Live-Region) — alle behoben.
  - Geänderte Dateien: `js/timer.js` (Live-Region + `aria-hidden` auf Sekunden-Countdown),
    `css/styles.css` (`.timerclock`-Textfarbe, neue `.visually-hidden`-Utility-Klasse),
    `pizza-rechner.html` + `pizza-rechner-mobile.html` (Label für `#recipeName`).
  - Keine Logikänderung, `js/print.js`/`js/storage.js` unangetastet. 293 Prüfungen
    unverändert grün (verifiziert per Headless-Edge-Dump). `?v=` auf 3.12.0 gezogen
    (Desktop + Mobil), Standalone-Datei neu gebaut.
- **v3.13.0 — Visuelles Redesign (gegen den "KI-typischen" Standard-Look)**:
  - Reiner Design-Refresh, siehe Abschnitt „Visuelles Redesign v3.13.0" oben für Details.
    Keine neue Funktion, keine Änderung an Berechnungslogik/Datenmodellen.
  - Emoji auf 🍕 im Header reduziert; Card-Titel bekommen stattdessen eine CSS-Counter-
    Nummerierung („01 · …"); Border-Radius systemweit verschärft (14→3 px Karten,
    20→6 px Pills); Schatten durch `border-left`-Akzentlinie ersetzt; 135°-Gradients
    (Header/Schedbar/Quickbar) durch flache Farbe + dezente Diagonal-Textur ersetzt; neue
    Serifenschrift (`--font-head`, offline-sicherer System-Font-Stack) für Headlines/große
    Zahlen; `.actions`-Buttons asymmetrisch (Speichern groß/prominent, Druck-Buttons klein/
    transparent); `.temp-out`-Boxen asymmetrisch gewichtet.
  - CSS-Grid-`min-width:0`-Fix als Nebenbefund ergänzt (Standard-Fix gegen Overflow bei
    langen Card-Titeln); ein davon unabhängiger, bereits vor diesem Redesign bestehender
    Mobil-Overflow bei sehr schmalen Breiten (~430 px) bleibt bestehen — Kandidat für einen
    künftigen `mobile-optimizer`-Durchlauf, nicht Teil dieses Zyklus.
  - Accessibility-Nachaudit: 1 Major (Counter-Nummerierung floss potenziell in den
    Accessible Name der Card-Überschriften ein) — Fix: `aria-label` mit reinem Titeltext auf
    allen `.card h2` (Desktop + Mobil). Kontraste aller geänderten Elemente geprüft, bestanden.
  - Keine neue Test-Sektion nötig (reine CSS-/Markup-Änderung, `js/*`-Texte unangetastet).
    293 Prüfungen unverändert grün. `?v=` auf 3.13.0 gezogen (Desktop + Mobil),
    Standalone-Datei neu gebaut.
- **v3.13.1 — Mobil-Overflow-Härtung**:
  - Gezielter Fix für den in v3.13.0 notierten Verdacht auf horizontalen Overflow bei sehr
    schmalen Mobil-Viewports, siehe Abschnitt „Mobil-Overflow-Härtung v3.13.1" oben für Details.
  - Untersuchung per Chrome-DevTools-Protocol (echter erzwungener Viewport statt des
    unzuverlässigen `--window-size`-Headless-Wegs) fand **keinen reproduzierbaren
    DOM-Overflow** in Chromium, weder im alten noch im neuen Stand — der ursprüngliche
    Screenshot-Befund war vermutlich ein Tooling-Artefakt (Edge-Headless klemmt
    `--window-size` unter ~490 px auf ein Minimum, das Screenshot-PNG wird aber trotzdem in
    der angeforderten kleineren Größe geschrieben).
  - Trotzdem präventive CSS-Härtung ergänzt (`css/styles.css`: `.field label` mit
    `flex-wrap:wrap`, `.row>*{min-width:0;}`, `.actions .row2 button{min-width:0;}`;
    `css/mobile.css`: `html,body{overflow-x:hidden;max-width:100%;}`) — reine CSS-Änderung,
    kein Markup/keine Logik angefasst.
  - Accessibility-Nachaudit: keine Funde (kein Reflow-/Fokus-Problem durch
    `overflow-x:hidden`, keine Änderung am Accessible Name durch `flex-wrap`).
  - Keine neue Test-Sektion nötig. 293 Prüfungen unverändert grün. `?v=` auf 3.13.1 gezogen
    (Desktop + Mobil), Standalone-Datei neu gebaut.
- **v3.14.0 — Teilen-Link (State als Base64-JSON-URL)**:
  - Neues Modul `js/share.js`: Button „Link kopieren" kodiert `PZ.state` als Base64-JSON in
    `?r=`-Query-Parameter, kopiert den vollständigen Link (`navigator.clipboard.writeText`,
    Fallback `document.execCommand('copy')` für `file://`-Kontexte). Beim Laden übernimmt
    `tryLoadFromShareLink()` einen vorhandenen `?r=`-Parameter über `PZ.applyState()` und
    entfernt ihn danach per `history.replaceState`. Defensiv: jeder Fehler führt zu einem
    stillen no-op, nie zum Absturz.
  - Accessibility-Nachaudit (gezielt): Major-Fund — Kopier-Bestätigung ohne Live-Region
    (4.1.3), Fix: neue `#shareLiveMsg`-Live-Region. Minor — `#shareHint` nur visuell neben
    dem Button (1.3.1), Fix: `aria-describedby="shareHint"`.
  - Neue Test-Sektion „17 · Teilen-Link" (Encode/Decode/Rundreise/defensive Fehlerbehandlung).
    311 Prüfungen (vorher 293), alle grün. `?v=` auf 3.14.0 gezogen (Desktop + Mobil),
    Standalone-Datei neu gebaut. Export als PDF bewusst nicht mitgebaut (Nutzer wollte nur
    den reinen Teilen-Link).
- **v3.15.0 — System-Wecker/Kalender-Anbindung für Gärzeit-Timer**:
  - Erweiterung von `js/timer.js` (rein additiv, bestehende In-App-Countdown-Logik aus
    v3.11.0 bleibt unverändert erhalten): jede Timer-Box bietet im Idle-Zustand jetzt
    zusätzlich zum „Timer starten"-Button einen System-Integrations-Block (`.timersys`).
  - **Android:** Link „📱 Android-Wecker stellen" nutzt eine `intent:`-URI mit der
    dokumentierten AlarmClock-Intent-Action `android.intent.action.SET_TIMER`
    (`SKIP_UI=true` startet den Timer direkt ohne Uhr-App-Umweg). Nur bei erkanntem
    Android (`navigator.userAgent`) angezeigt — funktioniert nur in Chromium-basierten
    Android-Browsern.
  - **iOS/alle Plattformen:** Link „📅 Kalender-Erinnerung" erzeugt eine `.ics`-Datei
    (data:text/calendar-URL, `VALARM` mit `TRIGGER:-PT0M` zum exakten Zielzeitpunkt) —
    bewusst gewählt, weil es **keine** offizielle Web-API gibt, um auf iOS einen nativen
    System-Timer zu stellen (Shortcuts-URL-Schemes würden einen vom Nutzer vorinstallierten
    Shortcut voraussetzen, den eine offline `file://`-App nicht bereitstellen kann — daher
    bewusst nicht vorgetäuscht). Der Hinweistext (`.timersys-hint`) kommuniziert das
    plattformabhängig ehrlich im UI.
  - Bugfix währenddessen: `stepLabel()` extrahiert jetzt nur den reinen Text-Knoten aus dem
    Schritt-`<h4>` (nicht `textContent` des ganzen Elements) — vorher liefen Titel und
    angehängte Chip-/Zeit-Badges ohne Trenner zusammen (z. B. „Autolyse (empfohlen)20–40 min"
    statt „Autolyse (empfohlen)"), betraf auch den Notification-Body aus v3.11.0.
  - Accessibility-Nachaudit (gezielt, `accessibility-expert`-Agent): Minor-Fund — `.timersys-
    hint` war nur visueller Nachbar der Links ohne programmatische Verknüpfung (1.3.1, analog
    `#shareHint` aus v3.14.0). Fix: `id="timersys-hint-<key>"` + `aria-describedby` auf beiden
    Links. Kontraste geprüft (Hint 5,55:1, Link-Text 15,26:1) — beide bestehen AA deutlich.
  - Keine neue Test-Sektion (`js/timer.js` wird in `tests/test.html` bewusst nicht geladen,
    Browser-APIs sind dort kein Unit-Test-Ziel, s. v3.11.0). 311 Prüfungen unverändert grün,
    verifiziert per Headless-Edge-Dump. `?v=` auf 3.15.0 gezogen (Desktop + Mobil),
    Standalone-Datei neu gebaut.
- **v3.16.0 — Einstellungen-Menü für Feature-Flags**: neues `js/settings.js`, `PZ.FLAGS`
  (localStorage-Key `pizzaRechnerFeatureFlags`), 6 Checkboxen zum Ein-/Ausschalten von
  Timer/System-Wecker-Links/Teilen-Link/Einkaufsliste-Druck/Einfrier-Hinweis/Mehrere
  Rezepte. Deaktivierte Features komplett aus dem Rendering genommen (`display:none`),
  keine Änderung an `js/storage.js`. 331 Prüfungen (vorher 311), Accessibility-Audit ohne
  Befunde. Siehe Abschnitt oben für Details.
- **v3.17.0 — Feature-Flag „hints"** = aktueller Stand: 7. Flag im Einstellungen-Menü,
  blendet alle `.hint`-erklärenden Kurztexte global per `body.hints-off`-CSS-Klasse aus
  (Default AN), Elemente bleiben im DOM (keine verwaisten `aria-describedby`-Referenzen
  bei `#shareHint`/`timersys-hint-<key>`). 338 Prüfungen (vorher 331), Accessibility-Audit
  ohne Befunde. Siehe Abschnitt oben für Details.

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
- Nebenbefund aus dem v3.25.0-Accessibility-Audit (nicht behoben, außerhalb des
  angefragten Scopes): `#recipeIOLiveMsg` (`js/main.js`) hat wie ursprünglich
  `#pdfGuideLiveMsg` kein Clear-Reset vor dem Setzen des Live-Region-Texts — bei zwei
  wortgleichen Meldungen hintereinander (selten, da die Meldung meist eine variable
  Rezeptanzahl enthält) könnten Screenreader die zweite Ansage unterdrücken. Beim
  nächsten Storage-bezogenen Zyklus mit beheben (analog zum in v3.25.0 gefixten Muster).
- ~~Burgermenü-Navigation auch auf Desktop~~ — **erledigt in v3.26.0** (kein
  Backlog-Punkt, direkter Nutzerauftrag; s. Abschnitt „Burgermenü-Navigation auch auf
  Desktop (v3.26.0)" oben).
- Nebenbefund aus dem v3.26.0-Accessibility-Audit (nicht behoben, außerhalb des
  angefragten Scopes): dasselbe Live-Region-Muster (kein Clear-Reset vor dem Setzen)
  steckt auch in `announceView()` des bestehenden Mobil-Inline-Scripts
  (`pizza-rechner-mobile.html`) — dort bewusst nicht angefasst (Vorgabe: Mobil-Seite
  bleibt in diesem Zyklus unverändert). Beim nächsten Zyklus, der die Mobil-Seite
  ohnehin berührt, mitziehen (zusammen mit dem `#recipeIOLiveMsg`-Nebenbefund oben).

**Stand v3.26.0: alle bisherigen Backlog-Punkte sind abgearbeitet** (durchgestrichen
oben), offene Punkte sind die beiden oben notierten Live-Region-Nebenbefunde
(`#recipeIOLiveMsg`, Mobil-`announceView()`). Für den nächsten Zyklus braucht es daher
frisches Brainstorming in Phase 1 (neue Nutzer-Ideen, Design-/Layout-Überarbeitungen,
Bugfixes, oder die eben genannten Live-Region-Nebenbefunde) statt eines vorgegebenen
Backlog-Punkts.

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
