# Kontext: Pizzateig-Rechner App
Stand: 2026-07-11 · Aktuelle Version: v3.8.0 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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
- **Persistenz:** `localStorage` (Key: `pizzaRechner`) speichert den `state` — gemeinsam für Desktop- und Mobil-Seite (gleicher Key, gleiche Domain/Ordner)

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
1. **Preset-Auswahl**: 7 erprobte Rezepte (Dropdown), setzt alle Werte **inkl. passendem Mehl**
2. **Grundeinstellungen**: **Mehl-Dropdown** (13 Sorten, wird per JS aus `PZ.FLOURS` generiert),
   Anzahl Teiglinge, Gewicht/Teigling (Pills), Hydration %, Salz %, **Olivenöl %**
3. **Methode & Hefe**: Direkt/Biga/Poolish, Vorteig-Mehlanteil %, Biga-Hydration %,
   **Vorteig-Reife-Stufen** (Pills, nur bei Biga/Poolish — koppeln Reifezeit + Hefe),
   Frisch-/Trockenhefe, Hefemenge % (Pills 72h+…4h nur bei Direkt sichtbar),
   **Kaltgare-Stufe** (Segment): „Als Teiglinge (praktisch)" [Standard] / „Im Stück (klassisch)"
4. **Teigtemperatur & Eiswasser**: Ziel-Teigtemperatur (DDT), Raum-/Mehltemperatur, Knetart Hand/Maschine
5. **Zeitplan**: „Ich starte um…" / „Fertig sein um…" + datetime + „Jetzt"-Button

### 2. Ergebnis (rechte Spalte, sticky)
- Gesamtteig + Gesamtmengen (Mehl, Wasser, Salz, Hefe, **Öl** — Öl-Zeile blendet bei 0 % aus)
- Bei Vorteig: Aufteilung Vorteig-Stufe / Hauptteig-Stufe (**100 % der Hefe in den Vorteig**,
  **Öl komplett in den Hauptteig** — nie in Biga/Poolish)
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
- Alle 7 Presets haben Öl: neapolitanisch je **2 %**, Teglia/Blech **4 %**. Zucker bewusst **nicht**.

## Kaltgare-Stufe (v3.0.0)

`state.coldStage`: `'balls'` (Standard) oder `'bulk'`. Greift nur bei kalten Führungen (cold: true).
- **'balls' (praktisch)**: kurze Stockgare bei RT (~2 h), dann Teiglinge formen und
  **als Teiglinge in den Kühlschrank**; am Backtag nur temperieren + backen.
- **'bulk' (klassisch)**: der ganze Teig gärt kalt im Stück; Formen + Stückgare am Backtag.
- Die **Gesamtdauer (bulkMin + proofMin) ist in beiden Varianten identisch** —
  darauf verlassen sich die Mehl-Warnung und die Tests.

## Die 7 Presets (alle gegen die Mehl-Warnung geprüft — keine löst eine Warnung aus)

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
js/guide.js          PZ.buildGuide() — Anleitung + Zeitberechnung + Mehl-Warnung
js/ui.js             Slider/Segmente/Pills/Zeitplan; PZ.set, selectSeg, applyMethod, updateTimeLabel
js/presets.js        PZ.PRESETS (inkl. flour je Preset) + PZ.applyPreset()
js/storage.js        PZ.save() / PZ.load() (localStorage, stellt auch flour & coldStage wieder her)
js/main.js           Start: Speichern-Button, load(), applyMethod(), calc()
tests/test.html      217 Prüfungen in 14 Kategorien (Doppelklick, kein Server)
README.md            kurzer Einstieg
```

**Ladereihenfolge** (Abhängigkeiten): dom → state → flour → calc → schedule → guide →
ui → presets → storage → main. Jedes Modul ist eine IIFE, kommuniziert nur über `window.PZ`.

**Cache-Busting:** CSS/JS werden mit `?v=3.0.0` geladen. **Bei jeder neuen Version mitziehen.**

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
- **Tests:** `tests/test.html` per Doppelklick — grün = OK. **217 Prüfungen** in 14 Kategorien:
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
  keine Logikänderung).
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
- **v3.7.0 — Accessibility (WCAG 2.1 AA)** = aktueller Stand:
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
- **v3.8.0 — Einfrier-Hinweis** = aktueller Stand:
  - Neuer optionaler Tipp im Schritt „Teiglinge formen" (`js/guide.js`): Teiglinge einölen,
    einzeln einfrieren (2–3 Monate), Auftauen über Nacht Kühlschrank + 3–5 h RT + 2–4 h Stückgare.
  - Reine Text-Ergänzung, kein Pflichtschritt — beeinflusst `R.totalMin`/Zeitplan nicht, gilt
    methoden- und kaltgare-unabhängig (liegt im gemeinsamen Schritte-Abschnitt).
  - Reine `js/guide.js`-Änderung, wirkt automatisch auf Desktop + Mobil; `?v=` auf 3.8.0 gezogen,
    Standalone-Datei neu gebaut.
  - Neue Tests in Sektion „10 · Anleitungs-Hinweise" (Direkt-Standard + Biga/`coldStage: bulk`
    + Kontrollcheck `R.totalMin` unverändert positiv).

## Mögliche nächste Schritte (offen / Ideen)

- Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)
- Zucker-Feld (New York Style) — bewusst noch nicht drin; Öl ist seit v3.3.0 integriert
- Einkaufsliste generieren; Druck nur für die Anleitung
- Gärzeit-Timer / Wecker; Export als PDF / Teilen-Link
- Mehrere gespeicherte Rezepte (statt einem localStorage-Slot)

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
