# Kontext: Pizzateig-Rechner App
Stand: 2026-07-11 · Aktuelle Version: v3.13.1 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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

## Mobil-Overflow-Härtung v3.13.1 = aktueller Stand

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
- **v3.13.1 — Mobil-Overflow-Härtung** = aktueller Stand:
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

## Mögliche nächste Schritte (offen / Ideen)

- Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)
- Zucker-Feld (New York Style) — bewusst noch nicht drin; Öl ist seit v3.3.0 integriert
- ~~Einkaufsliste generieren; Druck nur für die Anleitung~~ — **erledigt in v3.9.0**
- ~~Gärzeit-Timer / Wecker~~ — **erledigt in v3.11.0**; Export als PDF / Teilen-Link (offen)
- ~~Mehrere gespeicherte Rezepte (statt einem localStorage-Slot)~~ — **erledigt in v3.10.0**
- ~~Mobil-Overflow bei sehr schmalen Viewports (~430 px)~~ — **untersucht/gehärtet in
  v3.13.1**: kein reproduzierbarer DOM-Overflow in Chromium nachweisbar (ursprünglicher
  Befund vermutlich ein Headless-Tooling-Artefakt), präventive CSS-Fixes trotzdem ergänzt.
  Falls auf einem echten iPhone SE/Mini (Safari) doch noch ein sichtbares Abschneiden
  auftritt, bitte mit Screenshot/genauer iOS-Version melden — dann gezielt mit Safari-
  spezifischen Workarounds nachfassen (in Chromium nicht nachstellbar).

## Rahmen-Kontext (nicht App-bezogen)

Nutzer macht neapolitanische Pizza; Hardware-Recherche früherer Sessions:
Küchenmaschine AEG KM5-1-4BPT (~150 € refurbished), Pizzaofen Ooni Koda 12
gebraucht (~165 €) oder Cozze 13" (~99–110 €).
