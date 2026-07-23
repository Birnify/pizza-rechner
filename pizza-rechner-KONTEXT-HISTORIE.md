# Kontext-HISTORIE: Pizzateig-Rechner App

> Ausgelagerte Release-für-Release-Detailhistorie aus `pizza-rechner-KONTEXT.md`.
> Enthält die vollständigen Abschnitte zu abgeschlossenen Features, Bugfixes,
> Refactorings, Redesigns, Accessibility-Audits und verworfenen Experimenten —
> chronologisch (neueste zuerst, wie in der Hauptdatei). Nichts hiervon wurde
> gelöscht; es ist nur aus der schlanken Hauptdatei ausgelagert. Bei Bedarf zu einem
> konkreten Release hier nachschlagen. Der **aktuelle Stand, die Domänenlogik und das
> Backlog** stehen weiterhin in `pizza-rechner-KONTEXT.md`.

## Bugfix: #preset-Reset nach Mengensteuerung-Vereinfachung (v3.70.1)

Beim Lesen von `js/presets.js` für den Feature-Auftrag „Rezeptwahl führen" entdeckt (kein
gemeldeter Nutzer-Bug, selbst gefunden): der Block, der `#preset` bei manueller Regler-
Interaktion auf „kein Preset aktiv" zurücksetzt, hing an einer Liste von Element-IDs, die
seit v3.70.0 (Mengensteuerung vereinfachen, Stepper statt Slider) teils nicht mehr
existierten (`hyd`, `salt`, `oil`, `sugar`, `yeast`, `pref`, `bhyd`, `ballw`, `ddt`, `room`,
`flourTemp` waren die alten Slider-IDs) und ohnehin nur 5 der 12 Zahlenfelder abdeckte
(`hydN`/`saltN`/`oilN`/`sugarN`/`yeastN` — `ballwN`/`prefN`/`bhydN`/`ddtN`/`roomN`/
`flourTempN`/`ballsN` fehlten von Anfang an). Folge: nach Auswahl eines Presets blieb der
Dropdown-Wert nach einem Klick auf einen Stepper-Minus/Plus-Button (dem funktionalen
Nachfolger des alten Slider-Ziehens) fälschlich auf dem Preset-Namen stehen, obwohl der
tatsächliche Zustand längst davon abwich.

**Fix (`js/presets.js`):** die ID-Liste durch eine generische Schleife über alle 12
Stepper-Felder (`balls`/`ballw`/`hyd`/`salt`/`oil`/`sugar`/`pref`/`bhyd`/`yeast`/`ddt`/
`room`/`flourTemp`) ersetzt, die für jedes Feld sowohl das Zahlenfeld (`XN`, `input`-Event
fürs Tippen) als auch beide Stepper-Buttons (`XDec`/`XInc`, `click`-Event) verkabelt.
Schnellwahl-Chip-Klicks (`data-ballw`/`data-yeast`/`data-hyd`/...) lösten das schon VOR
v3.70.0 nicht aus (rufen `PZ.set.*` direkt auf, nicht über ein `input`-Event) — bewusst
unverändert gelassen, kein neu eingeführtes Verhalten, da vorbestehende Lücke außerhalb des
Bugfix-Scopes.

**Verifikation:** per Headless-Edge-CDP (WebSocket): Preset auswählen → Klick auf
`hydInc`/`ballwDec`/`flourTempInc` → `#preset`-Wert jeweils korrekt auf `''` zurückgesetzt
(vorher: blieb auf dem Preset-Namen stehen). `tests/test.html` unverändert 716/716 grün
(reines DOM-Wiring, wird dort nicht geladen).

**Geändert:** `js/presets.js`. `?v=` + Menü-Version auf `3.70.1` gezogen (Desktop + Mobil).
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.70.1 - Bugfix Preset-Reset
nach Mengensteuerung/` enthält den vollständigen Schnappschuss.

## Mengensteuerung vereinfachen (v3.70.0)

UX-Review "Teigmeister", Punkt 1 (Priorität Hoch), über den `feature-cycle-orchestrator`
umgesetzt: Slider-plus-Zahlenfeld-Kombinationen durch Stepper (Minus/Plus) mit Schnellwahl
ersetzt, da Slider und Zahlenfeld denselben Wert redundant steuerten und präzise Änderungen
per Slider auf Mobilgeräten unnötig feinmotorisch waren.

**Umfang (nach einer Nutzer-Rückfrage zur Scope-Breite erweitert):** ursprünglich beauftragt
waren die 6 Regler in "Grundeinstellungen" (Anzahl Teiglinge, Gewicht/Teigling, Hydration,
Salz, Öl, Zucker). Nach Rückfrage des Orchestrators (Interpretation "alle vergleichbaren
Regler" war mehrdeutig) hat der Nutzer die Erweiterung auf ALLE Slider+Zahlenfeld-Regler im
Hauptrechner bestätigt: zusätzlich Vorteig-Anteil, Biga-Hydration, Hefemenge, DDT,
Raumtemperatur, Mehltemperatur (12 Felder insgesamt). `js/newrecipe.js` (separates
Mini-Formular "Neues Rezept anlegen") bleibt bewusst unverändert bei Slider+Zahlenfeld.

**Neue Fabrik `PZ.makeStepper(cfg)`** (`js/widgets.js`, analog zu `PZ.makeLink()`): statt
Slider+Zahlenfeld nur noch ein `<input type="number">` + zwei Buttons (`XDec`/`XInc`), die
den Wert um einen festen `step` ändern. Min/Max-Klemmung weiterhin über die `min`/`max`-
Attribute des Zahlenfelds selbst (identische `clampTo()`-Logik wie bei `makeLink()`).
Optionaler `announceId` löst bei +/- Klick (nicht beim Tippen oder Chip-Klick) eine
`PZ.announce()`-Live-Region-Ansage mit übersetztem Einheitentext aus (neue Live-Region
`#stepperLiveMsg`). `js/ui.js`: alle 12 `PZ.set.*`-Einträge nutzen jetzt `stepper(...)`
statt `link(...)`; die dadurch tote `unitLinks`/`refreshUnits()`-Altlast (aria-valuetext-
Nachführung bei Sprachwechsel, brauchte den jetzt entfernten Slider) wurde entfernt.
`PZ.makeLink()` selbst bleibt als Fabrik bestehen (wird weiterhin von `js/newrecipe.js`
für dessen unverändertes Mini-Formular genutzt).

**Schnellwahl-Chips** (`.pills`, permanent sichtbar, kein Ein-/Ausblenden): neu für Anzahl
Teiglinge (2/4/6/8/12), Hydration (60/62/65/70/75 %, matcht den bestehenden Hinweistext),
Salz (2,5/2,8/3 %), Öl (0/2/4 %), Zucker (0/2 %) -- Gewicht/Teigling hatte bereits eine
Chip-Reihe (unverändert übernommen). Bewusst OHNE neue Chips: Vorteig-Anteil (der "gute"
Wert hängt stark von Biga vs. Poolish ab, ein einziger statischer Chip-Satz hätte für die
jeweils andere Methode in die Irre geführt), Biga-Hydration (schmaler Bereich 40-55 %, nur
in einer Methode sichtbar, der Hinweistext nennt bereits die engen 44-48 %-Richtwerte),
Hefemenge (hat mit `#yeastPills` bereits eine etablierte, method-übergreifende Schnellwahl
-- nicht dupliziert), DDT/Raumtemperatur/Mehltemperatur (Nutzer-Vorgabe: bei
Temperaturfeldern zählt eher ein guter Default als eine Chip-Reihe; bestehende Defaults
24 °C/21 °C/21 °C wurden geprüft und für sinnvoll befunden, keine Änderung nötig).

**CSS** (`css/styles.css` + kleines Override in `css/mobile.css`): neue Klassen `.stepper`
(Flex-Container), `.stepper-btn` (44×44px Touch-Ziel, Projekt-Konvention), `.stepper .unit`
(kleine graue Einheit neben dem Zahlenfeld, ersetzt das entfernte Slider-`aria-valuetext` --
auf Desktop neu ergänzt, auf Mobil gab es das Muster für ballw/hyd/salt/oil/sugar/pref/
bhyd/yeast/ddt/room/flourTemp teilweise schon). `.field.coupled .stepper-btn{opacity:.5}`
neu als Pendant zur bestehenden Slider-Ausgrauung (Hefemenge-Feld bei aktiver Vorteig-
Reife-Stufe optisch gesperrt, technisch weiter bedienbar, unverändertes Verhalten seit
v3.31.0). `css/mobile.css`: `.stepper input[type=number]{width:auto;min-height:44px}` +
`.stepper-btn{min-height:44px}` überschreiben gezielt die generische feste Zahlenfeld-
Breite (`input[type=number]{width:86px}`), damit das Stepper-Zahlenfeld die verfügbare
Restbreite zwischen den Buttons ausfüllt.

**Härtung** (`accessibility-expert`, zwei Runden -- erst die ursprünglichen 6 Felder, dann
gezielter Nachtrag zu den 6 zusätzlichen Feldern):
- BLOCKER/MAJOR 1: `.stepper input[type=number]` hatte keinen sichtbaren
  `:focus-visible`-Indikator (nur Border-Farbänderung) -- ergänzt, identisch zu
  `.stepper-btn`.
- MAJOR 2 (mitgefixt statt nur Backlog-Nebenbefund): `.pills button` hatte app-weit (nicht
  neu, betraf auch Hefe-Pills/Vorteig-Reife-Stufen u. a.) kein `:focus-visible`-Outline --
  ergänzt, da dieser Zyklus ohnehin mehrere neue `.pills`-Instanzen einführt.
- MINOR: Pills-Buttons ohne `aria-label`/`aria-describedby` (Screenreader sagt nur
  "button 250" statt "250 Gramm") -- bestehendes Pattern, kein neuer Handlungsbedarf.
  Zweiter Nachtrag: `.field.coupled .stepper-btn{opacity:.5}` hat wie das bisherige
  Slider-Pendant kein `aria-disabled` -- mitgefixt (`js/ui.js` `applyMethod()` setzt
  `aria-disabled` an `yeastDec`/`yeastInc` synchron zur `coupled`-Klasse), da trivial
  ohne neues JS-Konzept möglich.
- Kein Befund bei: Touch-Ziel-Größe (44×44px erfüllt), Fokus-Reihenfolge, Screenreader-
  ARIA (`role=group`/`aria-labelledby`/`aria-label`/`aria-describedby` korrekt), Kontrast
  (unveränderte Farbwerte), native Zahlenfeld-Tastaturbedienung (`step`-Attribut greift
  weiterhin für Pfeiltasten), fehlende Chips bei den 6 zusätzlichen Feldern (unbedenklich,
  bewusste UX-Entscheidung ohne funktionale Lücke).
- `mobile-optimizer` NICHT angefordert: Touch-Ziel-Dimension bereits vollständig durch den
  `accessibility-expert`-Durchlauf abgedeckt, kein zusätzlicher spezifisch-mobiler Befund
  zu erwarten.

**Verifikation:** funktional per Headless-Edge-CDP (WebSocket, `--remote-allow-origins=*`)
auf Desktop UND Mobil: alle 12 Felder ändern `PZ.state` korrekt bei +/- Klick (inkl.
Dezimalschritten bei Salz/Öl/Zucker/DDT/Hefemenge), Min/Max-Klemmung funktioniert, alle
Schnellwahl-Chips setzen Werte korrekt, keine `<input type=range>` mehr im DOM für die 12
Felder (die 12 `nrXxx`-Slider von `js/newrecipe.js` bleiben unverändert bestehen), keine
Konsolenfehler, Live-Region liefert korrekt übersetzten Text, `yeastField` behält die
`coupled`-Klasse + `aria-disabled` korrekt synchron zur Methode. `tests/test.html`
unverändert bei 716 Prüfungen grün (reines DOM-Wiring in `js/ui.js`/`js/widgets.js`, wird
in der Testdatei nicht geladen -- `test-generator` daher nicht angefordert).

**Geändert:** `js/widgets.js` (neue Fabrik `PZ.makeStepper`), `js/ui.js` (alle `PZ.set.*`
auf `stepper()` umgestellt, tote Slider-Sprachwechsel-Logik entfernt, `aria-disabled` bei
Hefemenge-Kopplung), `js/i18n-dict.js` (2 neue Keys `stepper.decrease`/`stepper.increase`),
`css/styles.css`, `css/mobile.css`, `pizza-rechner.html`, `pizza-rechner-mobile.html`.
`?v=` + Menü-Version auf `3.70.0` gezogen (Desktop + Mobil). `pizza-rechner-mobile-
standalone.html` neu gebaut. `Versionen/v3.70.0 - Mengensteuerung vereinfachen/` enthält
den vollständigen Schnappschuss.

## Glossar-Verweise: Dedup + Icon-Ausrichtung (v3.69.1)

Klar diagnostizierter Zwei-Punkte-Bugfix an den Glossar-Verweisen aus v3.68.0 (live
reproduziert vor Auftragserteilung, direkt an den `feature-cycle-orchestrator` übergeben,
kein `/define-feature` nötig).

**Bug 1 — Doppelter Verweis:** derselbe Glossar-Verweis (z. B. „Ofen-Heizarten") erschien
zweimal in der gerenderten Anleitung, weil sowohl der Vorheiz-Schritt als auch der
Back-Schritt dieselbe `glossaryId: 'ofenHeizarten'` setzten. **Fix in `js/guide.js`:**
neuer privater Modul-State `_usedGlossaryIds` (Set), zurückgesetzt bei jedem
`buildGuide()`-Aufruf zusammen mit `_items`. `glossaryLinkHtml(id)` prüft, ob `id` bereits
im Set liegt — falls ja, wird ein leerer String zurückgegeben (Verweis unterdrückt), sonst
wird die ID zum Set hinzugefügt und der Link gerendert. Allgemeine Regel (nicht nur der
Ofen-Heizarten-Fall hart verdrahtet): jede `glossaryId` erscheint jetzt projektweit nur noch
beim ERSTEN Schritt, an dem sie vorkommt. Die Zuordnung Schritt→glossaryId in den einzelnen
`st(...)`-Aufrufen bleibt unverändert — nur die Rendering-Ebene filtert.

**Bug 2 — Icon-Ausrichtung:** das 📖-Icon stand (v. a. auf Mobil, wo der Linktext oft
umbricht) auf einer eigenen Zeile über dem `<button>`, weil der Button-Browser-Default
(`display:inline-block` + `text-align:center`) die volle Containerbreite einnahm und
seinen Text zentrierte. **Fix in `css/styles.css`:** `.step .body .glossary-ref` jetzt
`display:flex;align-items:flex-start;gap:6px` (Icon und Button als zwei nebeneinander-
liegende Flex-Items, Icon oben am ggf. mehrzeiligen Linktext ausgerichtet statt vertikal
zentriert); `.step-glossary-link` zusätzlich `text-align:left;flex:1;min-width:0` (Linktext
bleibt bei Zeilenumbruch linksbündig, kann innerhalb der verfügbaren Restbreite wrappen).
Ein gemeinsamer Fix in `css/styles.css` reichte (gilt für Desktop UND Mobil, kein separates
`css/mobile.css`-Override nötig).

**Härtung (`accessibility-expert`-Review der CSS-Änderung):** ein Blocker gefunden und
behoben — `.step-glossary-link` hatte `padding:0` + `font-size:12.5px`, ergab nur ~16–20px
Klickhöhe, unter dem im Projekt etablierten 44px-Touch-Ziel-Richtwert (s. `.switch-row`,
Zeile 209/230 in `css/styles.css`). Fix: `min-height:44px;display:flex;align-items:center`
statt zusätzlichem vertikalem Padding, damit die Icon-Ausrichtung aus Bug 2 nicht
verschoben wird (Icon und Button starten weiterhin an derselben Oberkante dank
`align-items:flex-start` am Elternelement, der Button bekommt nur zusätzliche, unsichtbare
Klickfläche nach unten). Zusätzlich ein Minor-Befund direkt mitgefixt: das Icon war ein
nackter Text-Knoten, wurde vom Screenreader potenziell redundant zum Button-Text
vorgelesen — jetzt `<span aria-hidden="true">📖</span>` in `js/guide.js`. Ein weiterer
Minor-Befund (Kontrast von `.glossary-ref`-Text, `color:var(--muted)`, ~3,2:1, unter der
WCAG-Schwelle 4,5:1) war bereits **vor** diesem Zyklus so und wurde bewusst NICHT
mitgefixt (außerhalb des beauftragten Scopes) — s. Backlog in `pizza-rechner-KONTEXT.md`.

**Tests (`tests/test.html`, `test-generator`-Agent):** Sektion 27 angepasst (712 → 716
Prüfungen grün):
1. Test „Ofen-Heizarten-Glossarverweis an Vorheiz- und Back-Schritt (genau 2×)" → geändert
   zu „...an Vorheiz-Schritt nach Dedup (genau 1×)"; Kommentar korrigiert.
2. Neuer Test „Dedup unterdrückt nicht alle glossaryIds, nur wiederholte": kombiniert
   `autolyse` + `kalteGare` (beide einzeln vorhanden) und prüft, dass jede je 1× bleibt.
3. Neuer Test „Dedup-Set wird bei neuem buildGuide()-Aufruf zurückgesetzt": zwei
   aufeinanderfolgende `PZ.calc()`-Aufrufe, prüft dass der Ofen-Heizarten-Link bei jedem
   Durchlauf wieder 1× vorhanden ist (keine kumulative Unterdrückung).
   Reine CSS-/Markup-Härtungsänderungen (Touch-Ziel, `aria-hidden`) ändern die geprüften
   `data-glossary-id`-Attribute nicht — alle 716 Prüfungen blieben nach beiden
   Nachbesserungen unverändert grün (Headless-Edge-Dump gegengeprüft).

**Ablauf-Hinweis (Delegation über den Hauptagenten):** der `test-generator`-Lauf hat in
seinem eigenen Commit versehentlich zusätzlich zu den Testdatei-Änderungen auch die zu dem
Zeitpunkt im Arbeitsbaum stehenden, noch uncommitteten Phase-2-Änderungen des Orchestrators
(js/guide.js-Dedup-Logik, css/styles.css-Flex-Fix, Versionsbump auf 3.69.1 in
`pizza-rechner.html`/`pizza-rechner-mobile.html`) mit committet — inhaltlich unverändert
übernommen (per `git show` gegengeprüft), aber die dabei automatisch mitgeschriebenen
Kontext-Dateien beschrieben nur den Dedup-Teil (Bug 1), nicht Bug 2/die Härtung, und
enthielten die inzwischen überholte Aussage „kein CSS, Version noch nicht gezogen". Dieser
Abschnitt hier sowie der „aktueller Stand"-Abschnitt in `pizza-rechner-KONTEXT.md` wurden
im Rahmen des regulären Phase-5-Abschlusses korrigiert/vervollständigt.

**Dateien geändert:** `js/guide.js`, `css/styles.css`, `tests/test.html`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`. `?v=` + Menü-Version auf `3.69.1` gezogen (Desktop + Mobil).
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.69.1 - Glossar-Verweise
Dedup und Icon-Ausrichtung/` enthält den vollständigen Schnappschuss.

## Foto der fertigen Pizza am Ende der Anleitung (v3.69.0)

Über eine vollständige `/define-feature`-Runde abgestimmtes Feature (Feedback von Sörens
Kollegen Benjamin, wie schon beim Ofen-Heizarten-Punkt in v3.68.0): die Schritt-für-
Schritt-Anleitung wirkte ohne visuellen Abschluss nach dem letzten Backschritt. Sören
lieferte drei vorbereitete Fotos (JPG, 1920×1079, 188–306 KB, analog zum bestehenden
Header-Foto): `assets/pizza-final-neapolitanisch.jpg`, `assets/pizza-final-teglia.jpg`,
`assets/pizza-final-newyork.jpg`.

**Foto-Zuordnung (`js/guide.js`):** Wichtige technische Erkenntnis vor der Umsetzung: es
gibt **kein** `state.preset` — der aktive Preset-Key lebt ausschließlich im `#preset`-
Dropdown-DOM-Element selbst; `js/presets.js` trackt intern zusätzlich ein privates
`lastAppliedPresetKey`, das aber bei manueller Reglerabweichung NICHT zurückgesetzt wird
(anders als der `#preset`-Wert selbst, den die bestehenden Slider-Listener bei jeder
manuellen Eingabe auf `''` setzen). Deshalb liest die neue Funktion `finalPhoto()` direkt
`document.getElementById('preset').value`: `'teglia'` → Teglia-Foto, `'newyork_style'` →
New-York-Foto, alles andere (leer = „Eigene Einstellung", jedes andere der 6
neapolitanischen Presets, ein geladenes eigenes Rezept `recipe:<id>`) → neapolitanisches
Foto als Fallback/Default. Eine kleine `FINAL_PHOTO`-Lookup-Map mit den zwei Sonderfällen,
alles andere fällt durch den `||`-Fallback.

**Platzierung:** ein normaler nummerierter Anleitungsschritt direkt nach „Belegen &
Backen" im selben „Backen"-Abschnitt (kein neuer Tages-Trenner), Titel „Fertig!"/„Done!",
kurzer Abschlusssatz als Body-Text, das `<img>` selbst im `extra`-Feld (nicht im `<p>`-
Body) mit `alt`-Text passend zur Pizzaform, `loading="lazy"`, `width="1920" height="1079"`
(reserviert den Platz vorab gegen Layoutsprung). Bewusst **keine** zusätzliche sichtbare
Bildunterschrift — der Alt-Text trägt die Beschreibung für Screenreader, der kurze Body-
Satz ist ein normaler Anleitungs-Abschlusssatz, keine Bildunterschrift im engeren Sinne.

**CSS (`css/styles.css`):** neue Regel `.step .body .final-photo` (max-width 440px,
abgerundete Ecken, dünner Rahmen `var(--line)`) — gilt automatisch für Desktop UND Mobil
gemeinsam, da beide Seiten dasselbe Stylesheet und dieselbe `js/guide.js`-Logik laden;
keine separate Mobil-Anpassung nötig (`.step .body` ist bereits `flex:1;min-width:0`, das
Bild skaliert mit der Kartenbreite).

**`js/i18n-dict.js`:** 5 neue Textkeys (DE+EN): `guide.step.finalPhoto.title`,
`guide.step.finalPhoto.body`, sowie je ein Alt-Text-Key für die drei Fotovarianten
(`.alt.napoli`/`.alt.teglia`/`.alt.newyork`).

**`build-mobile-standalone.py`:** neuer `inline_images()`-Schritt nach dem bestehenden
CSS-/JS-Inlining — ersetzt die drei bekannten `assets/pizza-final-*.jpg`-Pfadstrings
(die als String-Literale im inline eingebetteten `js/guide.js`-Code landen) durch
`data:image/jpeg;base64,...`. Bewusst nur diese drei Dateien, nicht generisch alle
Bildpfade: das bestehende Header-Foto (`assets/header-pizza.jpg`, CSS-Hintergrund über
`--header-photo`) bleibt unverändert bei seinem bisherigen (ungeklärten) Verhalten auf
dem Standalone-Build — das war nicht Teil des Feature-Scopes. Base64 enthält keine
Anführungszeichen/Backslashes, daher ist der reine String-Ersatz innerhalb des
umgebenden JS-String-Literals unproblematisch. Nach dem Rebuild verifiziert: alle 3
Fotos als `data:image/jpeg;base64,...`-URIs vorhanden, kein Rest-Pfad mehr im Standalone-
HTML.

**Tests (`tests/test.html`, +13 Prüfungen, 699 → 712):** neue Sektion „28 · Foto der
fertigen Pizza am Ende der Anleitung" — da es kein `state.preset` gibt, manipulieren
diese Tests direkt den Stub-`<select id="preset">` (dafür zusätzlich eine `teglia`-Option
im Stub ergänzt) statt über `testCase()`-State-Overrides zu gehen. Geprüft: Fallback bei
„Eigene Einstellung" (leerer Wert) UND bei einem anderen konkreten Preset (beide →
neapolitanisches Foto), Teglia-Preset → Teglia-Foto, New-York-Preset → New-York-Foto,
jeweils genau 1 `.final-photo`-Bild, Alt-Text nicht leer, Fotoschritt steht nachweislich
nach „Belegen & Backen" (Text-Index-Vergleich im gerenderten HTML, inkl. `&amp;`-
Entity-Fall), Foto erscheint auch bei Vorteig-Methoden (Biga). Alle 712 Prüfungen grün
(Headless-Edge-Dump). Bestehende Tests unverändert grün — keine Prüfung erwartete eine
exakte Schrittanzahl oder eine exakte `#guideSteps`-Gesamt-HTML-Gleichheit, daher kein
Kollisionsrisiko mit dem neuen letzten Schritt.

**Accessibility-Review (gezielt, gegen WCAG 2.1 AA):** keine Befunde. 1.1.1 (Alt-Text
vorhanden und beschreibend je Fotovariante), 4.1.2 (Bild hat über `alt` einen korrekten
Accessible Name, `role="img"` implizit), Lesereihenfolge (Titel → Body-Satz → Bild,
analog zu den anderen Schritten), Sprachwechsel-Konsistenz (Alt-Text läuft über `PZ.t()`,
wird bei jedem `buildGuide()`-Aufruf inkl. Sprachwechsel neu aufgelöst), Tastatur/Fokus
(Bild ist nicht-interaktiv und zu Recht nicht im Tab-Fokus, kein unnötiges `tabindex`).
`js/pdf.js`s `collectGuideContent()` liest nur `.body > p`/`.body > .tip/.warn` — das
neue `<img>` (im `extra`-Feld, keine `.tip`/`.warn`-Klasse) taucht im PDF-Export
automatisch NICHT auf, das ist unproblematisch (reiner Text-Export, kein Bild-Support
vorgesehen). `js/print.js`s „Anleitung drucken" druckt weiterhin die komplette
gerenderte Seite inkl. Bild, unverändertes Verhalten.

**Nicht angefasst (Scope/Abgrenzung):** Berechnungslogik (`js/calc.js`, `js/schedule.js`)
komplett unverändert. Keine weiteren Fotos/Varianten über die drei genannten hinaus,
kein automatischer Fotowechsel nach anderen State-Werten (nur Preset-Key). Bestehendes
Header-Foto (`assets/header-pizza.jpg`) unverändert.

**Geändert:** `js/guide.js`, `js/i18n-dict.js`, `css/styles.css`, `build-mobile-
standalone.py`, `tests/test.html`, `pizza-rechner.html`, `pizza-rechner-mobile.html`.
Neu: `assets/pizza-final-neapolitanisch.jpg`, `assets/pizza-final-teglia.jpg`,
`assets/pizza-final-newyork.jpg`. `?v=` + Menü-Versionsnummer auf `3.69.0` gezogen
(Desktop + Mobil). `pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py`, jetzt inkl. Base64-Fotos).
`Versionen/v3.69.0 - Foto der fertigen Pizza/` enthält den vollständigen Schnappschuss.

## Einführung-Dialog: X-Button entfernt + Titel geändert (v3.68.2)

Sören leitete Feedback von seinem Kollegen Benjamin weiter, per Screenshot-Annotation:
"Mach mal den Button vom Vorschaltdialog rot und nicht blau". Vermutlich war damit der
"X"-Schließen-Button im Einführung-Modal gemeint (der einzige Button dort, der nicht
bereits tomatenrot ist). Statt die Farbe zu ändern, entschied Sören: der Button kann
komplett weg, der CTA-Button "Los geht's" unten reicht als Schließweg, ein zweiter
Button oben stiftet eher Verwirrung als Nutzen. Zusätzlich wurde der Titel von
"Willkommen bei Teigmeister" auf "Willkommen Teigmeister" geändert (Nutzerwunsch, ohne
"bei" liest es sich schwungvoller/persönlicher, "spricht die App direkt an").

**Umsetzung:**
- `pizza-rechner.html` + `pizza-rechner-mobile.html`: `<button id="onboardingClose">`
  komplett aus dem Markup entfernt, Titeltext im Fallback auf "Willkommen Teigmeister"
  geändert.
- `js/i18n-dict.js`: `onboarding.title` DE-Text geändert (EN-Text "Welcome to
  Teigmeister" unverändert, das deutsche Wortspiel überträgt sich nicht 1:1), der jetzt
  ungenutzte Key `onboarding.closeLabel` komplett entfernt.
- `js/onboarding.js`: `closeBtn`-Variable und alle Referenzen entfernt (Klick-Listener,
  Tab-Trap-Liste, Fokus-beim-Öffnen). Fokus beim Öffnen springt jetzt auf das erste
  Element in `focusablesInPanel()` (die Checkbox) statt auf den entfernten X-Button.
  Kopfkommentar aktualisiert: "vier Wegen" zu schließen wird zu "drei Wegen" (Escape,
  Backdrop-Klick, CTA-Button). Der bestehende Rücksprung-Fokus-Mechanismus fürs
  Schließen über den "Einführung"-Menüpunkt (explizites `navToggle`-Rücksprungziel,
  s. v3.63.0-Härtung) bleibt unverändert korrekt, unabhängig davon, welches Element
  innerhalb des Panels zuletzt fokussiert war.

Per Headless-Edge auf Desktop UND Mobil verifiziert: kein `#onboardingClose` mehr im
DOM, Titel korrekt "Willkommen Teigmeister", Fokus landet beim Öffnen auf der Checkbox,
alle 3 verbleibenden Schließwege (Escape, Backdrop-Klick, CTA-Button-Klick) funktionieren
weiterhin. Reine UI-Änderung, keine Berechnungslogik betroffen, `tests/test.html`
unverändert **699/699** grün (das Modul lädt dort ohnehin nicht, reines DOM-Wiring).

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`, `js/i18n-dict.js`,
`js/onboarding.js`. `pizza-rechner-mobile-standalone.html` neu gebaut. `?v=` auf
`3.68.2` gezogen (Desktop und Mobil, Cache-Busting + Footer-Version). `Versionen/v3.68.2
- Einfuehrung X-Button entfernt + Titel/` enthält den vollständigen Schnappschuss.

## Teilen-Link-Abstand & versteckter Flex-Bug (v3.68.1)

Kollegen-Feedback per Screenshot: der Hinweistext unter "Link kopieren" ("Kopiert einen
Link, der dieses Rezept komplett enthält, zum Teilen, ohne Login oder Server.") saß
optisch zu eng am Button, sichtbar durch handschriftliche Pfeil-Annotation "Text tiefer,
ein paar Pixel".

Root Cause war tiefer als die Optik vermuten ließ: `#shareBlock` (und identisch
`#pdfGuideBlock`) nutzen `style="display:flex;flex-direction:column;gap:8px;"` als
inline Markup, damit Button und Hinweistext im 8px-Standardabstand stehen. `js/settings.js`
(`applyFlags()`) setzt aber beim Ein-/Ausblenden je nach Feature-Flag
`shareBlock.style.display = f.share ? '' : 'none'` bzw. `pdfGuideBlock.style.display =
f.shopping ? '' : 'none'`. Das Leeren auf `''` löscht nur die `display`-Eigenschaft aus
dem Inline-Style (nicht `flex-direction`/`gap`), wodurch der Container ohne eigene
CSS-Klasse auf den Browser-Standard `display:block` zurückfällt. `gap` wirkt nur bei
Flex-/Grid-Containern, der Effekt: Button und Hinweistext stapeln sich ohne Abstand,
zusätzlich verstärkt durch das bisherige `margin-top:-4px` auf dem Hinweistext.

**Fix:**
- `js/settings.js`: `f.share ? 'flex' : 'none'` bzw. `f.shopping ? 'flex' : 'none'` statt
  `''`, stellt das Flex-Layout beim Einblenden explizit wieder her statt es zu löschen.
- `pizza-rechner.html` + `pizza-rechner-mobile.html`: `margin-top:-4px` auf
  `margin-top:0` geändert, auf `#shareHint` und `#pdfGuideHint`, damit der volle
  8px-Flex-Gap zum Tragen kommt (vorher: 8px Flex-Gap minus 4px negativer Margin, nur
  4px effektiver Abstand, jetzt mit dem Flex-Bugfix zusammen sauber 8px, wie bei den
  übrigen Hinweistexten der App).

Per Headless-Edge verifiziert (Vorher/Nachher-Messung via `getBoundingClientRect()`):
Abstand Button zu Hinweistext vorher 0px (Flex-Bug aktiv, Block-Fallback ohne Gap), nach
dem Fix korrekt 8px bei `display:flex`. Reine Layout-Änderung, keine Berechnungslogik
betroffen, `tests/test.html` unverändert **699/699** grün.

**Geändert:** `js/settings.js`, `pizza-rechner.html`, `pizza-rechner-mobile.html`.
`pizza-rechner-mobile-standalone.html` neu gebaut. `?v=` auf `3.68.1` gezogen (Desktop
und Mobil, Cache-Busting + Footer-Version). `Versionen/v3.68.1 - Teilen-Link Abstand
Fix/` enthält den vollständigen Schnappschuss.

## Glossar-Verweise in der Anleitung (v3.68.0)

Direkter Nutzerauftrag, ausgelöst durch Kollegen-Feedback zur Anleitung: der
Autolyse-Schritt sagte nur "Weniger Knetarbeit, dehnbarerer Teig" ohne zu erklären
warum, das fand ein Kollege verwirrend. Statt die kurzen Anleitungstexte aufzublähen,
verlinkt die Anleitung jetzt auf die bereits vorhandenen, ausführlichen
Glossar-Einträge. Während der Umsetzung kam ein zweites Kollegen-Feedback dazu: "Was
ist, wenn ich keinen Grill im Ofen habe? Gibt es eine Option für Ober/Unterhitze und
für Umluft?" — als Teil desselben Features ergänzt um einen neuen Glossar-Eintrag
"Ofen-Heizarten für Pizza", verlinkt von den Vorheiz-/Back-Schritten.

- **`js/glossary.js` — `PZ.gotoGlossaryEntry(id)`** (neue Funktion): ruft zuerst
  `PZ.gotoView('glossar')` auf (Bereichswechsel selbst, funktioniert identisch auf
  Desktop [Burgermenü] und Mobil [Bottom-Tab-Leiste seit v3.67.0], da beide denselben
  view-generischen `[data-view]`-Mechanismus aus `js/nav.js` nutzen, unabhängig vom
  jeweiligen Navigations-Widget), klappt danach den passenden `<details
  class="glossary-item" data-id="...">`-Eintrag auf (`.open = true`), scrollt ihn per
  `scrollIntoView({behavior:'smooth', block:'start'})` ins Bild und verschiebt den
  Fokus auf dessen `<summary>` (nativ fokussierbar, kein zusätzliches
  `tabindex`-Attribut nötig, anders als bei der generischen Überschrift-Fokussierung in
  `focusView()`). Überschreibt damit bewusst den generischen Überschrift-Fokus, den
  `gotoView()` selbst schon gesetzt hat: das eigentliche Ziel ist der einzelne Eintrag,
  nicht nur die Bereichs-Überschrift "Pizza-Glossar". Unbekannte/fehlende ID → kein
  Crash, einfach kein Sprung zum Eintrag (View-Wechsel selbst passiert trotzdem).
- **`js/guide.js` — neue `st()`-Option `glossaryId`**: jeder Anleitungsschritt kann per
  `{ glossaryId: 'autolyse' }` (6. Parameter von `st()`, bereits bestehender generischer
  Options-Mechanismus, vorher nur für `{back: 50}` beim Vorheiz-Schritt genutzt) einen
  Glossar-Verweis bekommen. Neuer Helfer `glossaryLinkHtml(id)` baut die Zeile
  `<div class="glossary-ref">📖 <button class="step-glossary-link"
  data-glossary-id="...">Mehr zu {term} im Glossar</button></div>` (Linktext-Vorlage
  `guide.glossaryLink.label` in `js/i18n-dict.js`, `{term}` kommt aus dem jeweiligen
  `glossary.<id>.title`, bleibt so immer synchron zum tatsächlichen Zieltitel). Zentral
  im zuletzt gemeinsamen Render-Loop angehängt (nicht in den Titel selbst, um
  Chip/Timechip nicht zu überladen). Klick-Verdrahtung: der bereits bestehende, einzige
  delegierte Klick-Listener auf `#guideSteps` (bisher nur für den
  `.schedbar-goto-zeitplan`-Sprung) bekommt einen zweiten Zweig für
  `.step-glossary-link`, der `PZ.gotoGlossaryEntry(id)` aufruft — kein zweiter,
  separater Listener nötig.
- **Angewandte Begriffe** (jeweils an der inhaltlich passendsten Stelle, nicht
  zwangsläufig beim ersten Auftauchen des Wortes): `autolyse` am Autolyse-Schritt
  selbst; `biga`/`poolish` am jeweiligen "...reifen lassen"-Schritt (Titel enthält
  bereits den Eigennamen); `stretchFold` am Stretch-&-Fold-Schritt (Hydration ≥ 70 %);
  `windowpane` am klassischen Knet-Schritt (Hydration < 70 %, erwähnt den "Fenstertest");
  `kalteGare` **exakt an der Stelle, die für das jeweilige Rezept tatsächlich die kalte
  Phase ist** (`coldStage: 'balls'` → Stückgare/`finalProof`, da dort die Teiglinge in
  den Kühlschrank wandern; `coldStage: 'bulk'` → Stockgare/`bulkRise`, da dort der ganze
  Teig kalt gärt) — nie an beiden Stellen gleichzeitig, nie bei nicht-kalter
  (schneller) Führung; `ofenHeizarten` (neu) an Vorheiz- **und** Back-Schritt.
- **Neuer Glossar-Eintrag `ofenHeizarten`** ("Ofen-Heizarten für Pizza"): erklärt
  Ober/Unterhitze vs. Umluft vs. Backofengrill, was der Hitzeverteilung eines
  Steinofens am nächsten kommt (Ober/Unterhitze + Stein/Stahl weit oben), die
  praktische Alternative ohne Grillfunktion (Ober/Unterhitze auf höchster Stufe, Stein/
  Stahl so weit oben wie möglich) und die übliche Temperatur-Faustregel bei reiner
  Umluft (ca. 15–20 °C weniger als die angegebene Ober/Unterhitze-Temperatur, etwas
  mehr Backzeit, blassere Bräunung oben). Eingefügt in `PZ.GLOSSARY_TOPICS`
  (`js/glossary.js`) direkt nach `ofenVsBackofen` (thematisch verwandt). Generisches
  Fachwissen, DE+EN, identisches Muster wie alle bestehenden Glossar-Einträge.
  **Nebenbefund dabei behoben:** die Gruppen-Kommentare "Werkzeuge & Ausrüstung"/
  "Pizzabeläge" in `js/i18n-dict.js` waren fälschlich mit "(v3.65.0)" statt "(v3.66.0)"
  beschriftet (Tippfehler aus dem vorherigen Zyklus) — korrigiert.
- **`css/styles.css`:** neue `.glossary-ref`/`.step-glossary-link`-Regeln (unauffälliger
  unterstrichener Text-Link, KEINE farbige Box wie `.tip`/`.warn`, da mehrere Verweise
  pro Anleitung gleichzeitig auftreten können und das sonst zu viel visuelle Konkurrenz
  erzeugen würde) — analog zum bestehenden `.schedbar-goto-zeitplan`-Muster. Kontraste
  rechnerisch geprüft: `var(--tomato-text)` (Link) auf `var(--card)` ~6,61:1 hell/
  ~5,93:1 dunkel, `var(--muted)` (Fließtext/Emoji) unverändert die bereits an anderer
  Stelle geprüften ~5,84:1/~7,0:1. `.glossary-ref{display:none;}` in `@media print`
  ergänzt (Klick-Link ist auf Papier nutzlos). `js/pdf.js` brauchte KEINE Änderung: die
  bestehende Extraktion sammelt nur `.body > .tip, .body > .warn` als "Extras" ein,
  `.glossary-ref` matcht diesen Selektor ohnehin nicht und wird automatisch nicht mit
  exportiert.
- **Kein Eingriff in die Berechnungslogik** (`js/calc.js`-`calcCore`, `js/schedule.js`):
  reine Anzeige-/Navigations-Ergänzung, `PZ.R`/`PZ.schedule()` unverändert.

**Tests** (`tests/test.html`, 688 → **699**, neue Sektion "27 · Glossar-Verweise in der
Anleitung"): prüft je Bedingung, dass genau der erwartete `data-glossary-id`-Button im
gerenderten `#guideSteps`-HTML auftaucht (Autolyse, Windowpane vs. Stretch-&-Fold
exklusiv, Biga, Poolish, Kaltgare exakt einmal für beide `coldStage`-Varianten und gar
nicht bei schneller Führung, Ofen-Heizarten exakt zweimal). `js/glossary.js`
(`PZ.gotoGlossaryEntry`) ist wie üblich nicht Teil der Testsuite (reines DOM-Wiring) —
der eigentliche Sprung/Fokus-Wechsel wurde stattdessen per Headless-Edge-
Klicksimulation auf Desktop **und** Mobil verifiziert: Bereichswechsel, geöffneter
Glossar-Eintrag, Fokus auf dessen `<summary>`, aktiver Zustand des jeweiligen
Navigations-Widgets (Burgermenü-Aktiv-Markierung bzw. Bottom-Tab "Glossar"). Alle 699
Prüfungen grün (Headless-Edge-Dump).

**Geändert:** `js/glossary.js`, `js/guide.js`, `js/i18n-dict.js`, `css/styles.css`,
`tests/test.html`. `?v=` auf `3.68.0` gezogen (Desktop + Mobil, Cache-Busting +
Menü-/Einstellungen-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`). `Versionen/v3.68.0 - Glossar-Verweise in der
Anleitung/` enthält den vollständigen Schnappschuss.

## Bottom-Tab-Navigation (Mobil) (v3.67.0)

Direkter Nutzerauftrag (Warteschlangen-Punkt 3 von 3, letzter Punkt der Warteschlange,
kein Backlog-Punkt), bereits vollständig spezifiziert inkl. Vorab-Klärungen (Tab-Leiste
ersetzt Burgermenü komplett, Rechner-Untermenü als Segmented Control statt Scroll-Anker).
Auf `pizza-rechner-mobile.html` ersetzt eine feste, persistente Tab-Leiste unten das
bisherige Burgermenü vollständig — vier Haupt-Tabs (Teig-Rechner, Pizza Party, Glossar,
Einstellungen), einhändig besser erreichbar als ein verstecktes Menü. Desktop
(`pizza-rechner.html`) bleibt komplett unverändert, behält sein Burgermenü.

- **Neue `<nav class="bottom-tabs">`** (persistente Leiste, sitzt fix über der
  Quick-Bar): vier Buttons mit denselben Icons wie die entsprechenden Karten
  (Ergebnis-Panel-Icon für "Rechner", Party-Icon, Glossar-Buch-Icon, Zahnrad-Icon für
  "Einstellungen"). Der "Rechner"-Tab bekommt zusätzlich `data-goto-group=
  "rechner,rezepte,zeitplan"` (neues, generisches Attribut, s. `js/nav.js` unten): er
  bleibt optisch aktiv, solange einer seiner drei Unterbereiche sichtbar ist.
- **Neue `.calc-subnav`** (Segmented Control Rechner/Rezepte/Zeitplan, ersetzt die
  frühere Burgermenü-Gruppe "Teig-Rechner"): identisch eingebettet als erstes Element
  in allen drei `[data-view="rechner"|"rezepte"|"zeitplan"]`-Containern, damit sie beim
  Wechseln zwischen den dreien sichtbar bleibt (sonst würde ein Ansichtswechsel die
  Subnav mitsamt ihrem Elternelement verstecken, ohne dass in der neuen Ansicht wieder
  eine sichtbar wäre).
- **"Einführung" + "Zur Desktop-Ansicht"-Link + Versionsnummer** (`#navOnboardingItem`/
  `#navDesktopLink`/`#appVersion`) in die Einstellungen-Ansicht umgezogen (ans Ende der
  bestehenden Einstellungen-Karte, per `.nav-divider` abgetrennt) — es gibt kein
  Burgermenü mehr, das ihnen vorher als Zuhause diente. Unverändert dieselben
  Elemente/IDs, `js/onboarding.js` verdrahtet `#navOnboardingItem` weiterhin per ID,
  keine JS-Änderung dort nötig (der bestehende Fallback `returnFocusEl || document.
  activeElement` in `open()` fängt das fehlende `$('navToggle')` auf Mobil bereits ab).
- **`js/nav.js` generalisiert** (Kernänderung, betrifft beide Seiten, aber verhaltens-
  neutral für Desktop): bisher scannte das Modul `.nav-item`-Buttons NUR innerhalb des
  Burgermenü-Overlays (`navOverlay.querySelectorAll('.nav-item')`) und gatete die
  gesamte Klick-Verdrahtung hinter `if (navToggle && navOverlay)` — auf Mobil (seit
  v3.67.0 ohne Overlay) wäre dadurch GAR KEINE Klick-Verdrahtung mehr gelaufen. Jetzt
  zwei getrennte Listen: `panelItems` (weiterhin overlay-scoped, nur für den Tab-Trap/
  die Anfangsfokussierung beim Öffnen) und `allNavItems` (site-weit, Grundlage für
  Klick-Verdrahtung + Aktiv-Markierung in `activateView()`). Die Klick-Verdrahtung
  selbst läuft jetzt IMMER (nicht mehr an die Overlay-Existenz gekoppelt), die
  Overlay-spezifische Verdrahtung (Toggle-Button, Backdrop-Klick) bleibt weiterhin
  gegated. Neues `data-goto-group`-Attribut (kommagetrennte Liste): `activateView()`
  markiert einen Button als aktiv, wenn entweder `data-goto` exakt matcht ODER (falls
  vorhanden) die aktuelle Ansicht in seiner `data-goto-group`-Liste steht — ohne dieses
  Attribut (Desktop, alle übrigen Mobil-Tabs) ist das Verhalten exakt wie zuvor.
- **`js/settings.js`-Bugfix:** `applyFlags()`s Logik, die den "Rezepte"-Menüpunkt bei
  ausgeschaltetem `multiRecipes`-Flag versteckt, nutzte bisher `document.querySelector
  ('.nav-item[data-goto="rezepte"]')` (nur der ERSTE Treffer). Seit die Sekundär-
  Navigation auf Mobil identisch in drei Unterbereichen eingebettet ist, gibt es dort
  bis zu drei solcher Treffer — mit `querySelector` allein wären zwei davon fälschlich
  sichtbar geblieben. Umgestellt auf `querySelectorAll` + `forEach`.
- **`css/mobile.css`:** neue `.bottom-tabs`/`.calc-subnav`-Regeln (eigene, gezielt
  scoped Overrides mit höherer Selektor-Spezifität als die generische `.nav-item`/
  `.nav-item.active`-Basisregel, s. Kommentar dort). Kopfzeile vereinfacht (kein
  3-Spalten-Grid/Hamburger-Button mehr nötig, einfache Zentrierung). Die Quick-Bar
  sitzt jetzt nicht mehr ganz am unteren Rand, sondern direkt über der Bottom-Tab-
  Navigation (eigener `bottom`-Offset, kein eigener `safe-area-inset-bottom`-Zuschlag
  im Padding mehr, das übernimmt jetzt die Tab-Leiste darunter). `.wrap`s
  `padding-bottom` und der `<footer>`-Scroll-Puffer entsprechend erweitert (84px
  Quick-Bar + 58px Tab-Leiste + safe-area). `.nav-overlay`/`.nav-panel`/
  `.nav-panel-head`/`.nav-close`/`.nav-list`/`.nav-divider`/`.nav-link`-Basisregeln
  bewusst NICHT entfernt (weiterhin aktiv vom Onboarding-Modal bzw. den relozierten
  Einstellungen-Links genutzt) — nur `.nav-toggle` (eindeutig tot) entfernt.
- **Per Headless-Edge-Verhaltenstest verifiziert** (`js/nav.js` ist wie `js/timer.js`/
  `js/newrecipe.js` bewusst nicht Teil von `tests/test.html`, reines DOM-Wiring):
  Bottom-Tab-Klicks schalten die Ansicht korrekt um, der Rechner-Haupt-Tab bleibt über
  `data-goto-group` aktiv markiert während Rezepte/Zeitplan offen sind, die jeweilige
  Subnav-Kopie markiert korrekt den aktiven Unterbereich, "Einführung" öffnet
  weiterhin das Onboarding-Modal, Desktop-Burgermenü verhält sich unverändert (Öffnen/
  Schließen/Bereichswechsel gegengetestet). Per Pixel-Messung (`getBoundingClientRect`)
  verifiziert: Quick-Bar sitzt exakt über der Tab-Leiste (1px Spalt, keine Über-
  lappung) — dabei einen Rechenfehler in der reservierten Höhe gefunden und korrigiert
  (54px → 58px, an vier Stellen synchron). Gezielter Accessibility-Review (kein
  Vollaudit): Kontraste rechnerisch geprüft (Tab-Beschriftung ~5,84:1 hell/~7,0:1
  dunkel, aktive Zustände wiederverwenden bereits geprüfte Farbkombinationen aus `.seg`/
  `.pills`), ein echter Befund gefunden und behoben (`.calc-subnav`-Buttons hatten nur
  40px statt der App-weiten 44px-Touch-Ziel-Konvention).

**Tests:** `tests/test.html` bleibt unverändert bei 688 Prüfungen (kein Eingriff in
`js/calc.js`/`js/schedule.js`/`js/guide.js`, `js/nav.js` ist kein Teil der Testsuite;
`js/settings.js`s Änderung läuft dort weiterhin grün mit, da kein `.nav-item`-Stub in
`tests/test.html` existiert, `querySelectorAll` liefert dort wie zuvor `querySelector`
einfach eine leere Trefferliste).

**Geändert:** `js/nav.js`, `js/settings.js`, `css/mobile.css`, `pizza-rechner-mobile.html`.
`?v=` auf `3.67.0` gezogen (Desktop + Mobil, Cache-Busting + Menü-/Einstellungen-
Version). `pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py`). `Versionen/v3.67.0 - Bottom-Tab-Navigation Mobil/`
enthält den vollständigen Schnappschuss.

## Glossar-Erweiterung: Werkzeuge & Ausrüstung + Pizzabeläge (v3.66.0)

Direkter Nutzerauftrag (Warteschlangen-Punkt 2 von 3, kein Backlog-Punkt), bereits
vollständig spezifiziert (kein Brainstorming nötig). Zwei neue thematische Gruppen im
bestehenden Pizza-Glossar (`js/glossary.js`, v3.37.0): "Werkzeuge & Ausrüstung" und
"Pizzabeläge", je generische, sachlich-informative Texte (DE+EN), identisches Muster wie
alle bestehenden Glossar-Einträge (`<details>`/`<summary>`, zwei `<p>`-Absätze im Body).

- **"Werkzeuge & Ausrüstung" (6 neue Einträge)**, eingefügt nach `ofenVsBackofen` und vor
  `sanMarzano` (zwischen Gärmethoden- und Zutaten-Gruppe): `pizzastein` (Pizzastein &
  Pizzastahl: Wärmeleitung/-speicherung, Vorheizzeit), `pizzaschieber` (Holz zum
  Einschießen vs. Metall zum Wenden/Herausnehmen), `ofenthermometer` (Infrarot-Thermometer
  gegen ungenaue eingebaute Ofenanzeigen), `teigschaber` (Metall mit gerader Kante zum
  Abteilen vs. flexibler Schüsselschaber), `kuechenwaage` (0,1-g-Feinwaage-Begründung
  analog zum bestehenden Hefe-Präzisionshinweis in `js/guide.js`), `gaerbox` (luftdichter
  Behälter für die "als Teiglinge"-Kaltgare-Variante).
- **"Pizzabeläge" (5 neue Einträge)**, eingefügt nach `basilikum` und vor
  `echteNeapolitanische` (zwischen Zutaten- und Pizza-Stile-Gruppe): `belagMarinara`
  (käsefreier Klassiker, älter als Margherita), `belagCapricciosa` (mehrere Zutaten in
  Sektoren, kein festes Rezept), `belagDiavola` (scharfe Salami/'Nduja), `belagQuattroFormaggi`
  (vier Käsesorten, oft als Pizza Bianca ohne Tomatensauce), `belagNachDemBacken`
  (Prosciutto Crudo/Rucola/Burrata/Olivenöl: Prinzip "brennt/welkt sonst", analog zum
  bestehenden `basilikum`-Eintrag, aber als eigenständiges, verallgemeinertes Prinzip).
- **`js/glossary.js`:** `PZ.GLOSSARY_TOPICS` um die 11 neuen IDs an den beiden genannten
  Stellen erweitert, Kommentar zur thematischen Gruppierung entsprechend nachgezogen.
  Keine Änderung an der Render-Logik selbst (`renderGlossary()`), da rein neue Daten in
  der bestehenden Struktur.
- **Kein neues Markup/keine neue CSS-Klasse:** alles läuft über das bestehende, bereits
  geprüfte `.glossary-item`/`.glossary-body`-Muster — kein gezielter Accessibility-/
  Mobile-Durchlauf nötig.

**Tests:** reine Inhalts-/Datenergänzung, kein Eingriff in `js/calc.js`/`js/schedule.js`/
`js/guide.js` — kein test-generator-Durchlauf nötig (`js/glossary.js` wird laut
Dateistruktur-Dokumentation bewusst nicht in `tests/test.html` geladen). Bestehende 688
Prüfungen bleiben unverändert grün. Per Headless-Edge auf der echten `pizza-rechner.html`
zusätzlich verifiziert: alle 11 neuen Einträge rendern korrekt in DE und EN an der
vorgesehenen Position in der Liste, keine Konsolenfehler.

**Geändert:** `js/i18n-dict.js`, `js/glossary.js`. `?v=` auf `3.66.0` gezogen (Desktop +
Mobil, Cache-Busting + Menü-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`). `Versionen/v3.66.0 - Glossar-Erweiterung Werkzeuge
und Belaege/` enthält den vollständigen Schnappschuss.

## Einheitensystem-Umschaltung Metrisch/Imperial (v3.65.0)

Direkter Nutzerauftrag (Warteschlange, kein Backlog-Punkt), Rückfrage-Runde bereits von
einem vorherigen (durch Sitzungslimit unterbrochenen) Orchestrator-Durchlauf beantwortet
vorliegend: Umfang von "auch Bäckerprozente" auf "nur Anzeige/Ausgabe" reduziert. Die
App erkennt automatisch anhand der Browser-Region (`navigator.language`), ob Imperial
(oz/lb, °F) statt Metrisch (g, °C) sinnvoller ist, und bietet eine persistente manuelle
Übersteuerung im Einstellungen-Menü an — identisches Muster wie der Dunkelmodus
(`js/theme.js`).

- **Neues Modul `js/units.js`:** eigener localStorage-Key `pizzaUnits` ('metric'/
  'imperial'), `PZ._resolveInitialUnits(stored, prefersImperial)` als reine, testbare
  Entscheidungsfunktion (gespeicherte manuelle Wahl gewinnt immer, sonst Regions-Fallback).
  Auto-Erkennung bewusst NUR bei Browser-Region exakt `en-US` (`/^en-us$/i.test(navigator
  .language)`) → Imperial-Default, alle anderen Sprachen/Regionen (inkl. `en-GB`) bleiben
  Metrisch — unabhängig von der bestehenden DE/EN-Sprachauswahl der App (`js/i18n.js`),
  das ist eine zweite, eigenständige Weiche auf Basis derselben Browser-Angabe.
- **Formatierungsschicht (kein Eingriff in `PZ.state`/Rechenkern):** `PZ.formatWeight
  (grams, metricDecimals)` (Metrisch: frei wählbare Nachkommastellen, Default 0 — deckt
  die bisherigen, je Anzeigestelle unterschiedlichen Konventionen ab; Imperial: 0,1-oz-
  Rundung, ab 16 oz Umbruch in "X lb Y oz", darunter reine "X oz"), `PZ.formatWeightAuto
  (grams)` (das bisherige `js/guide.js`-interne Rundungsmuster < 10 g → 2 Nachkomma-
  stellen, sonst ganzzahlig — im Imperial-Modus identisch zu `formatWeight`), `PZ.
  formatTemp(celsius)` (Metrisch: hängt nur die Einheit an, keine erneute Rundung;
  Imperial: rundet auf ganze °F). Alle drei liefern den KOMPLETTEN Anzeigetext inkl.
  Einheit (z. B. `"600 g"`/`"21.2 oz"`) — aufrufende Module halten dafür keine eigenen
  statischen Einheiten-Suffixe mehr vor.
- **`js/calc.js` (`renderResult`):** alle Gewichts-/Temperatur-Textzuweisungen
  (`#totalW`, `#gFlour`…`#gSugar`, `#pFlour`…`#pYeast`, `#mFlour`…`#mSugar`, `#waterTemp`,
  `#iceAmt`, `#ballwOut`) nutzen jetzt `PZ.formatWeight`/`PZ.formatWeightAuto`/`PZ.
  formatTemp` statt `Math.round`/`toFixed` + hartkodiertem HTML-Suffix. `calcCore()`s
  Eiswasser-Hinweistexte (`calc.ice.note`/`calc.warmNote`/`calc.tapOkNote`) übergeben
  ebenfalls bereits fertig formatierte Strings an `PZ.t()`. Neuer Re-Render-Hook `PZ.
  unitsOnChange(fn)` (analog `PZ.i18nOnChange`): `js/calc.js` registriert sich, damit ein
  Umschaltvorgang Ergebnis-Panel + Anleitung sofort neu rendert.
- **`js/guide.js`:** der interne Rundungshelfer `g(x)` delegiert jetzt an `PZ.
  formatWeightAuto` (liefert direkt den Text inkl. Einheit) statt selbst zu runden — alle
  bestehenden Aufrufstellen (`g(R.pf)`, `g(R.salt)` usw.) bleiben dadurch unverändert.
  Neuer Helfer `gt(x)` für Temperaturen (delegiert an `PZ.formatTemp`), ersetzt die vier
  Stellen, an denen `R.wT`/`state.ddt` direkt (ohne `PZ.t()`) in Chip-Texten bzw. als
  Template-Variable verwendet wurden. `js/i18n-dict.js`: ~20 Wörterbuch-Einträge (DE+EN),
  die zuvor `{platzhalter} g`/`{platzhalter} °C` hartkodiert hatten, verloren dieses
  hartkodierte Suffix (der übergebene Wert bringt die Einheit jetzt selbst mit) — Beispiel:
  `'{salt} g Salz'` → `'{salt} Salz'`. In Summe für den Metrisch-Fall **byte-identischer**
  gerenderter Anleitungstext wie vor der Umstellung (verifiziert), da `formatWeightAuto`/
  `formatWeight` exakt dieselben Rundungsregeln reproduzieren wie die vorher inline im
  jeweiligen Modul stehende Logik.
- **`js/print.js` (Einkaufsliste):** `fmtYeast()`/neuer `fmtW()`-Helfer delegieren
  ebenfalls an `PZ.formatWeightAuto`/`PZ.formatWeight`.
- **`js/pdf.js` brauchte KEINE Änderung:** liest den PDF-Text direkt aus dem bereits
  gerenderten DOM (`#guideSummary`/`#flourWarn`/`#guideSteps`), übernimmt die neue
  Formatierung dadurch automatisch.
- **Bewusste Abgrenzung (Scope-Entscheidung, nicht Teil der Vorgabe-Klärung):** statische
  Referenztexte OHNE Bezug zu einem konkreten Rechenergebnis bleiben unkonvertiert — z. B.
  Ofentemperatur-Richtwerte (`guide.step.preheat.body`, `guide.bake.small`), der generische
  DDT-Zielbereich-Chip (`guide.step.checkTemp.chip`, "Ziel 23–25 °C"), Kühlschrank-
  Lagerbereiche in den Gärzeit-Texten (`js/schedule.js`, alle `sched.*`-Einträge) und
  Glossar-Inhalte. Nur Werte, die direkt aus `PZ.R` (Rechenergebnis) stammen oder
  unmittelbar davon abgeleitete Anleitungs-/Ergebnis-Panel-Ausgaben sind, werden
  umgerechnet — konvertierte Werte wären sonst Ranges/generische Richtwerte, keine
  Berechnungsergebnisse, deren Umrechnung eine eigene, umfangreichere Recherche(Runde
  bräuchte (Kandidat für einen künftigen, eigenen Zyklus, falls gewünscht).
- **Eingabe-Regler unverändert:** Teigling-Gewicht (`#ballw`/`#ballwN`, inkl. `#ballwV`-
  Live-Anzeige und der Formular-Duplikate in "Neues Rezept anlegen"), Raumtemperatur,
  Mehltemperatur, Ziel-Teigtemperatur/DDT bleiben intern in Gramm/Celsius mit ihren
  bestehenden Wertebereichen/Schrittweiten — `js/calc.js`s Rechenkern (`calcCore`), `js/
  schedule.js`, `js/widgets.js`, Presets und Storage wurden NICHT angefasst.
- **Neuer Menüpunkt "Einheiten"** im Einstellungen-Menü (`#unitSwitch`, Desktop + Mobil
  identisch), direkt unter "Darstellung": zwei Buttons "Metrisch"/"Imperial", Live-Region
  `#unitsAnnounce`, Info-Button `#flagUnitsInfo` (automatisch vom bestehenden generischen
  `wireInfoButtons()`-Handler in `js/settings.js` erfasst, keine Zusatz-Verdrahtung nötig).
  Gezielter Accessibility-Review (kein Vollaudit): keine Befunde, reine Struktur-
  Wiederverwendung des etablierten `#themeSwitch`-Musters.
- **`pizza-rechner.html`/`pizza-rechner-mobile.html`:** statische " g"/"°"-Text-Suffixe im
  Ergebnis-Panel entfernt (Wert inkl. Einheit kommt jetzt komplett aus JS); Mobil-
  Quick-Bar-Anker (`#qbTotal`) spiegelt weiterhin per `MutationObserver` einfach das
  komplette `#totalW`-`textContent`, keine Änderung an der Spiegel-Logik nötig.

**Tests** (`tests/test.html`, 657 → **688**, neue Sektion "26 · Einheitensystem-Umschaltung
Metrisch/Imperial"): `PZ._resolveInitialUnits`, `formatWeight`/`formatWeightAuto` Metrisch
(reproduziert bestehende Rundung) + Imperial (inkl. Rundungs-Grenzfall exakt 1 lb, kein
"0 lb 16.0 oz"-Bug), `formatTemp` Metrisch/Imperial, Persistenz via `localStorage`
("pizzaUnits"), `setUnitSystem()` ignoriert ungültige Werte, DOM-Spiegelung im
`#unitSwitch`-Stub (`aria-pressed`/`.active`, analog zum bestehenden Theme-Test), sowie ein
Integrationstest: `PZ.calc()` im Imperial-Modus schreibt oz/lb/°F ins DOM, während `PZ.R`
(Rechenkern) unverändert in Gramm/Celsius bleibt (Anker gegen versehentliche Kopplung von
Anzeige und Berechnung). `tests/test.html` selbst erzwingt vor jedem Lauf `PZ.setUnitSystem
('metric')` (Determinismus-Fix analog zum bestehenden Sprach-Fix), damit die Host-Browser-
Region die 657 bestehenden Prüfungen nicht verfälscht. Alle 688 Prüfungen grün (Headless-
Edge-Dump). Zusätzlich per Headless-Edge mit `--lang=en-US` auf der echten `pizza-
rechner.html` end-to-end verifiziert: Auto-Erkennung + komplette Umrechnungskette
funktioniert korrekt über Ergebnis-Panel UND generierten Anleitungstext hinweg.

**Geändert:** `js/units.js` (neu), `js/calc.js`, `js/guide.js`, `js/print.js`, `js/i18n-
dict.js`, `pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf
`3.65.0` gezogen (Desktop + Mobil, Cache-Busting + Menü-Version). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.65.0 - Einheitensystem-Umschaltung Metrisch-Imperial/` enthält den
vollständigen Schnappschuss.

## Globale Hefemengen-/Verschwendungs-Anpassung & Aufräumarbeiten (v3.64.0)

Direkter Nutzerauftrag (kein Backlog-Punkt), Brainstorming-Phase mit Rückfrage-Runde.
Motivation: manche Nutzer erleben regelmäßig stärkere/schwächere Hefe als von der App
berechnet, und beim Kneten geht immer etwas Teig an Schüssel/Händen/Maschine verloren,
sodass am Ende weniger Teiglinge im Zielgewicht rauskommen als geplant. Zwei neue,
globale (rezeptunabhängige) Kalibrierungswerte im Einstellungen-Menü sollen das
ausgleichen.

**Vier Design-Entscheidungen per Rückfrage geklärt, bevor die Umsetzung begann:**
1. **Formel-Wirkung Hefe-Aufschlag:** fließt in die effektive Hefe-Bäckerprozentzahl im
   Nenner der Kernformel ein (analog zu Öl/Zucker) — Masseerhaltung
   (Mehl+Wasser+Salz+Hefe+Öl+Zucker=Gesamtgewicht) bleibt dadurch exakt erhalten, statt
   nachträglich auf die fertig berechnete Hefemenge aufzuschlagen (was das Gesamtgewicht
   verändert hätte).
2. **Formel-Wirkung Verschwendungsaufschlag:** erhöht das Gesamtgewicht
   (`Teiglinge × Gewicht × (1 + Verschwendung%)`) VOR der Aufteilung auf die Zutaten,
   plus ein kurzer Hinweistext im Ergebnis-Panel, damit die Diskrepanz zwischen der
   großen Gesamtteig-Zahl und der kleineren „N × Gewicht"-Unterzeile nicht wie ein
   Rechenfehler aussieht.
3. **Default-Wert Verschwendung:** 2 % (typischer Kneteverlust an Händen/Maschine/Schüssel).
4. **UI-Bedienelement:** Stepper mit +/− Buttons + editierbarem Zahlenfeld (wie der
   bereits bestehende Pizza-Party-Stückzahl-Stepper), NICHT der sonst für Rezeptregler
   übliche Slider+Zahlenfeld-Kombo. Wertebereiche: Hefemenge anpassen −50…+100 %
   (Schritt 5 %), Verschwendung anpassen 0…15 % (Schritt 1 %).

**Technische Umsetzung:** zwei neue Settings-Werte in `js/settings.js`
(`PZ.ADJUST = {yeastAdjust, wasteAdjust}`), eigener localStorage-Key
`pizzaRechnerAdjustments` (getrennt von `pizzaRechnerFeatureFlags`/`pizzaRechner`/
`pizzaTheme`/`pizzaSimpleMode`/`pizzaOnboardingDontShow`), Default
`{yeastAdjust:0, wasteAdjust:2}`. `PZ._clampAdjust(key, v)` klemmt auf Bereich UND
rundet auf die Schrittweite (verhindert krumme Werte durch direkte Zahlenfeld-Eingabe),
`PZ.setAdjust(key, value)` persistiert sofort und löst `PZ.calc()` neu aus.
`PZ._mergeAdjust()` (Vorwärtskompatibilitäts-Merge, analog `PZ._mergeFlags()`) für
Tests exponiert. Neue Stepper-UI (`.adjust-stepper`/`.adjust-btn`/`.adjust-input`,
CSS teilt sich bewusst dieselben Regeln wie `.party-qty-*` statt eines zweiten
Bedienmuster-Vokabulars) als zwei neue Zeilen am Ende der bestehenden
„Einstellungen"-Card (Desktop + Mobil identisch).

**`js/calc.js` (`calcCore`):** `totalBase = N*W` (reine Ziel-Menge, unverändert),
`total = totalBase * (1 + wasteAdj/100)` NEU als das tatsächlich für die
Zutaten-Aufteilung verwendete Gesamtgewicht. `y = (state.yeast/100) * (1 + yeastAdj/100)`
NEU als effektive Hefe-Bäckerprozentzahl, direkt im Nenner der Mehl-Formel verwendet.
`R` liefert zusätzlich `totalBase`/`wasteAdj` zurück (für die Hinweistext-Anzeige).
`js/schedule.js`/`js/guide.js` unverändert (Vorteig-Aufteilung/Hefe-Reihenfolge/
Mehl-Warnung greifen wie gehabt auf `PZ.R`/`PZ.state` zu, keine Anpassung nötig, da die
beiden neuen Werte bereits vollständig in `PZ.R.yeast`/`PZ.R.total` eingerechnet sind).
`renderResult()`: neues `#wasteNote`-Element (in `.total`, unter der „N × Gewicht"-Zeile)
blendet sich bei `wasteAdj < 0,05` komplett aus, zeigt sonst „inkl. X % Verschwendungspuffer".

**Kritischer Test-Isolations-Punkt:** da `wasteAdjust` einen Default von **2 %** (nicht 0)
hat, hätte das reale Default allein ALLE bestehenden Masseerhaltungs-Tests
(`total === N*W`) in `tests/test.html` gebrochen. Deshalb dieselbe Baseline-Technik wie
bei `PZ.FLAGS` (v3.16.0): `PZ.ADJUST = {yeastAdjust:0, wasteAdjust:0}` direkt nach dem
Laden explizit für die gesamte restliche Testsuite gesetzt, die eigentliche
Adjust-Logik in einer eigenen Sektion 25 geprüft (Default-Werte, Wertebereiche,
`_clampAdjust()`, `_mergeAdjust()`, `setAdjust()`-Persistenz, Rechenwirkung beider
Aufschläge einzeln und kombiniert mit Vorteig, `#wasteNote`-Render-Effekt) — 43 neue
Prüfungen, alle mit Backup/Restore des echten localStorage-Stands. **614 → 657**
Prüfungen, alle grün (Headless-Edge-Dump).

**Zusätzlich in derselben Session gebündelt (drei kleinere, klar umrissene
Zwischenaufträge, kein eigener `/define-feature`-Zyklus nötig):**

1. **Bugfix Mobil-Onboarding-Zentrierung** (Nebenbefund/Live-Bug aus v3.63.0, vom Nutzer
   selbst reproduziert und mit Root Cause gemeldet): der Willkommens-Screen erschien auf
   `pizza-rechner-mobile.html` linksbündig als schmaler ~300px-Seiten-Drawer statt
   zentriert/breit wie auf Desktop. Ursache: `css/mobile.css` definiert `.nav-overlay`/
   `.nav-panel` mobil-spezifisch neu (wegen `safe-area-inset`-Padding) und lädt NACH
   `css/styles.css` — die dortigen `.onboarding-overlay`/`.onboarding-panel`-Overrides
   (Zentrierung, `width:min(92vw,520px)`) haben dieselbe Selektor-Spezifität wie
   `.nav-overlay`/`.nav-panel` und wurden durch die spätere Ladereihenfolge auf Mobil
   wieder verworfen (Desktop lädt kein `mobile.css`, war daher nie betroffen). Fix:
   analoge `.onboarding-overlay`/`.onboarding-panel`-Overrides auch in `css/mobile.css`
   ergänzt (nach dem `.nav-panel`-Block dort), kombiniert mit denselben
   `safe-area-inset`-Anpassungen wie `.nav-panel` (oben+unten statt oben+links, da der
   Screen zentriert statt am linken Rand verankert ist). Per Headless-Screenshot
   (375×812) verifiziert.
2. **5. Onboarding-Feature-Punkt „Pizza Party"** ergänzt (kleine, klar umrissene
   Ergänzung): Icon wiederverwendet (Pizza-Schnitte-Symbol der bestehenden
   Pizza-Party-Karte), Text selbst formuliert (DE+EN), Desktop + Mobil identisch. Kein
   Eingriff in `js/onboarding.js` nötig (der Tab-Trap besteht weiterhin nur aus
   X-Button/Checkbox/CTA-Button, reine Vorstellungstexte sind nicht interaktiv).
3. **Stil-Bereinigung: keine Gedankenstriche (—/Em-Dash) mehr** (expliziter,
   rückwirkender Stil-Wunsch — spätere Präzisierung des Nutzers, dass Gedankenstriche
   „super nach KI aussehen"): alle 189 Fundstellen in `js/i18n-dict.js`, 32 in
   `pizza-rechner.html`, 35 in `pizza-rechner-mobile.html` sowie 179 in `tests/test.html`
   durch Doppelpunkt (Standardfall, elaborierender Nebensatz), Komma+„und" (koordinierte
   Nebensätze) oder Klammern (reine Einschübe/Kennzeichnungen wie das leere
   Rezepte-Dropdown-Element) ersetzt. Bewusst NICHT angefasst: Halbgeviertstriche
   (–, „1–2 min"-Zahlbereiche) sind ein anderes Zeichen mit anderer, unauffälliger
   typografischer Funktion und nicht Teil der Beanstandung; Code-Kommentare in den
   übrigen `js/*.js`-Dateien (calc.js, guide.js, party.js, storage.js usw.) waren nicht
   Teil des benannten Scopes („js/i18n-dict.js und alle .html-Dateien") und bleiben
   unverändert — `pizza-rechner-mobile-standalone.html` enthält dadurch nach dem
   Neubau weiterhin einzelne Gedankenstriche aus inline-kopierten JS-Kommentaren
   (keine sichtbaren Nutzertexte). Alle 657 Tests bleiben grün (keine Test-Assertion
   prüfte den Gedankenstrich als Zeichen).

**Geändert:** `js/settings.js`, `js/calc.js`, `js/i18n-dict.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `css/styles.css`, `css/mobile.css`, `tests/test.html`.
`?v=` auf `3.64.0` gezogen (Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.64.0 - Hefe- und Verschwendungsanpassung/` enthält den vollständigen
Schnappschuss. `js/schedule.js`/`js/guide.js` inhaltlich unverändert (lesen nur bereits
korrekt vor-berechnete `PZ.R`-Werte).

## Willkommens-Screen / Einführung (v3.63.0)

Direkter Nutzerauftrag (kein Backlog-Punkt), Brainstorming-Phase mit Rückfrage-Runde:
neue Nutzer landeten bisher direkt im Rechner ohne jede Einordnung, was die App kann
(Presets, Anpassung, Zeitplan, Anleitung/Timer) oder wo sich Einstellungen/Erweiterter
Modus finden. Vorbild war eine Referenz-App mit Vollbild-Screen (Icon+Titel+Text je
Feature, CTA-Button unten).

**Vier Design-Entscheidungen per Rückfrage geklärt, bevor die Umsetzung begann:**
1. **Technische Umsetzung:** eigenständiges Modal-Dialog-Overlay (analog zum
   bestehenden Burgermenü-Muster: `role="dialog"`, `aria-modal="true"`, eigener
   Fokus-Trap) statt einer neuen `data-view`-Ansicht — kein dauerhafter
   Navigationspunkt, sondern ein Vorschalt-Overlay.
2. **Menü-Eintrag:** heißt „Einführung", dritter Eintrag in der bestehenden generischen
   Liste im Burgermenü, direkt neben „Glossar"/„Einstellungen".
3. **Schließverhalten:** vier gleichwertige Wege — X-Button, Escape-Taste, Klick auf
   den Hintergrund, CTA-Button unten. Die Checkbox „Beim nächsten Start nicht mehr
   anzeigen" bestimmt dabei **nur**, ob der Screen beim NÄCHSTEN App-Start automatisch
   erneut erscheint — unabhängig davon, wie er diesmal geschlossen wurde.
4. **Icons & Texte:** bestehende Line-Icons wiederverwendet, wo passend (Chef-Hut-Icon
   der Preset-Karte, das neue Sliders-Icon aus dem „Einfacher Modus"-Feature v3.62.0,
   das Uhr-Icon der Zeitplan-Karte); für „Anleitung & Timer" gab es kein passendes
   bestehendes Icon — dafür ein neues, minimales Listen-/Checklisten-Icon entworfen.
   Texte (je 1–2 Sätze, Deutsch + Englisch) selbst formuliert, orientiert an den
   bestehenden Card-Beschreibungen.

**Technische Umsetzung:** neues eigenständiges Modul **`js/onboarding.js`** mit eigenem
Fokus-Trap (Reihenfolge: X-Button → Checkbox → CTA-Button, Wrap-Around in beide
Richtungen) — bewusst NICHT der bestehende, an `#navMenu` gebundene Trap aus `js/nav.js`
wiederverwendet, da dieser fest an dessen eigene `navItems`/`focusablesInPanel()`
gekoppelt ist. Eigene CSS-Klassen `.onboarding-overlay`/`.onboarding-panel` (statt der
schmalen `.nav-panel`-Drawer-Breite `min(78vw,300px)`) für einen zentrierten, größeren
Dialog (`width:min(92vw,520px);max-height:min(88vh,720px)`) — auf Mobil praktisch
Vollbild, auf Desktop ein großer zentrierter Dialog, näher am Referenzstil.

**`js/nav.js` um zwei kleine, abwärtskompatible Ergänzungen erweitert:**
- `PZ.closeNav` exportiert (vorher nur intern nutzbar) — der „Einführung"-Menüpunkt
  schließt damit zuerst das Burgermenü, bevor er das Onboarding-Modal öffnet (zwei
  gleichzeitig offene `position:fixed;inset:0`-Overlays wären verwirrend gewesen:
  doppelter abgedunkelter Hintergrund, zwei konkurrierende Escape-Handler).
- Guard `if (!view) return;` im generischen `.nav-item`-Klick-Handler: der neue
  „Einführung"-Button hat bewusst **kein** `data-goto`-Attribut (er wechselt keine
  `data-view`-Ansicht) — ohne den Guard hätte `activateView(undefined)` ALLE
  `[data-view]`-Bereiche der Seite versteckt, da keiner das leere `data-goto` matcht
  (echter Blank-Page-Bug, beim ersten Testlauf gedanklich vorhergesehen und präventiv
  verhindert, nicht erst live aufgetreten).

**Persistenz:** eigener localStorage-Key `pizzaOnboardingDontShow` (`'1'`/`'0'`),
getrennt von allen bestehenden Keys (`pizzaRechner`, `pizzaRechnerFeatureFlags`,
`pizzaTheme`, `pizzaSimpleMode`). `readDontShow()` liefert `false` sowohl bei fehlendem
als auch bei explizit `'0'` gespeichertem Wert — in beiden Fällen erscheint der Screen
automatisch. Die Checkbox spiegelt beim Öffnen **immer** den aktuell gespeicherten
Stand (nicht immer unchecked) — ein Nutzer, der den Screen einmal dauerhaft ausgeblendet
hat und ihn über „Einführung" erneut aufruft, sieht die Checkbox weiterhin als „an".

**Zwei echte Bugs beim Härten (selbst durchgeführt nach dem Kriterienkatalog aus
`.claude/agents/accessibility-expert.md`, mangels verfügbarem Task-Tool zum
synchronen Subagenten-Aufruf) gefunden und behoben:**
1. **Ampersand-Bug** (dieselbe Kategorie wie bereits in v3.62.0 aufgetreten, hier gleich
   zweimal): zwei Textstellen (`onboarding.feature.advanced.text`,
   `onboarding.feature.guide.title`) enthalten `&amp;` in der i18n-Datei, waren im
   Markup aber mit `data-i18n` (textContent, keine Entity-Dekodierung) statt
   `data-i18n-html` (innerHTML) verknüpft — zeigten beim ersten Screenshot buchstäblich
   „&amp;" statt „&" an. Korrigiert auf `data-i18n-html`, beim Screenshot-Vergleich
   bestätigt.
2. **Fokus-Verlust beim Schließen (WCAG 2.4.3):** wurde das Onboarding über den
   „Einführung"-Menüpunkt geöffnet, blieb der Fokus beim Schließen auf dem inzwischen
   unsichtbaren X-Button hängen, statt zu einem sichtbaren Element zurückzukehren.
   Ursache: `PZ.closeNav(false)` versteckt den Menüpunkt-Button, BEVOR `open()` den
   „zuletzt fokussierten" Rücksprungpunkt (`lastFocused = document.activeElement`)
   erfasst — Chromium blurt ein fokussiertes Element aber nicht zuverlässig synchron,
   nur weil ein Vorfahre `display:none` bekommt (per Headless-Klicktest verifiziert:
   `document.activeElement` blieb auf dem längst unsichtbaren Element stehen, ein
   späterer `.focus()`-Aufruf darauf war wirkungslos, da nicht-fokussierbare Elemente
   `.focus()` ignorieren). Fix: `open(returnFocusEl)` akzeptiert jetzt ein optionales
   explizites Rücksprung-Ziel; der „Einführung"-Menüpunkt übergibt bewusst `navToggle`
   (immer sichtbar, immer fokussierbar) statt sich auf `document.activeElement`
   im Moment des Aufrufs zu verlassen. Der Auto-Erststart-Pfad (kein expliziter
   Aufrufer) bleibt beim alten Verhalten (`document.activeElement`, i. d. R. `<body>`).
   Per Headless-Klicktest verifiziert: `activeElement` landet nach dem Schließen jetzt
   korrekt auf `navToggle` statt auf dem unsichtbaren Close-Button.

**Verifikation (Headless-Edge, `--dump-dom` + iframe-Klick-/Tastatursimulation, kein
Preview-Server nötig):** kompletter Zyklus getestet — automatische Anzeige beim
Erststart (kein localStorage-Flag), alle 4 Schließwege (CTA, Escape, Backdrop-Klick,
X-Button implizit über den Trap-Test), Checkbox-Persistenz (`localStorage` korrekt bei
checked `'1'`/unchecked `'0'`), Menüpunkt schließt das Burgermenü und öffnet das
Onboarding, Checkbox spiegelt beim erneuten Öffnen zuverlässig den gespeicherten Stand,
Tab-Trap-Reihenfolge inkl. Wrap-Around in beide Richtungen (`Tab`/`Shift+Tab`) korrekt.
Screenshots (Desktop 1300 px + Mobil 420 px) bestätigen sauberes Layout, auf Mobil
praktisch Vollbild wie vom Referenzstil gewünscht. `tests/test.html` unverändert
**614/614** grün (`js/onboarding.js` lädt dort bewusst nicht mit, analog zu
`js/nav.js`/`js/theme.js`/`js/simplemode.js` — reines DOM-Wiring auf echtem Markup,
kein `test-generator`-Lauf nötig, da `js/calc.js`/`js/schedule.js`/`js/guide.js` nicht
angefasst wurden).

**Neue i18n-Einträge** (`js/i18n-dict.js`, DE/EN): `nav.onboarding`, `onboarding.title`,
`onboarding.closeLabel`, `onboarding.intro`, `onboarding.feature.{presets,advanced,
schedule,guide}.{title,text}`, `onboarding.settingsHint`, `onboarding.dontShowAgain`,
`onboarding.cta`.

**Geändert:** `js/onboarding.js` (neu), `js/nav.js` (2 kleine Ergänzungen),
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `css/styles.css`, `js/i18n-dict.js`.
`?v=` auf `3.63.0` gezogen (Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.63.0 - Willkommens-Screen Onboarding/` enthält den vollständigen
Schnappschuss. Berechnungslogik (`js/calc.js`, `js/schedule.js`, `js/guide.js`)
komplett unverändert — reine UI-/Struktur-Änderung.

## Einfacher Modus für Presets (v3.62.0)

Direkter Nutzerauftrag (kein Backlog-Punkt), Brainstorming-Phase mit Rückfrage-Runde:
die Rechner-Seite (Desktop `pizza-rechner.html` + Mobil `pizza-rechner-mobile.html`)
zeigte bei Preset-Nutzung immer alle Einstellungen auf einmal (3 Karten „Grundeinstellungen"
/ „Methode & Hefe" / „Teigtemperatur & Eiswasser"), obwohl für reine Preset-Nutzung
meist nur 3 Parameter tatsächlich angepasst werden: Anzahl Teiglinge, Hefe-Art, Knetart.

**Vier Design-Entscheidungen per Rückfrage geklärt, bevor die Umsetzung begann:**
1. Der Einfache Modus ist ein **reiner Sicht-Schalter**, unabhängig davon, ob im
   Preset-Dropdown gerade ein Preset oder „Eigene Einstellung" aktiv ist (nicht an den
   Preset-Status gekoppelt).
2. **Layout:** eine einzelne neue Karte mit den 3 Feldern + Button „Erweiterten Modus
   öffnen" ersetzt im Einfachen Modus optisch die 3 klassischen Karten; im Erweiterten
   Modus erscheinen die 3 klassischen Karten vollständig, mit einem Gegenknopf
   „Einfachen Modus aktivieren" oben, um zurückzuschalten. Die Preset-Auswahl-Karte
   bleibt in beiden Modi immer sichtbar.
3. Umsetzung auf **beiden Seiten** (Desktop + Mobil).
4. „Hefe-Art" ist nur das Frisch/Trocken-Segment; die Hefemenge selbst bleibt im
   Einfachen Modus versteckt und wird beim Umschalten der Hefeart automatisch per
   bestehender `PZ.FRESH_TO_DRY`-Umrechnung mitgezogen — das ist bereits das
   bestehende, unveränderte Verhalten des `yeastType`-Segments (`js/calc.js`
   `calcCore()`: `if (state.yeastType === 'dry') yeast *= PZ.FRESH_TO_DRY`), keine
   neue Logik nötig.

**Technische Umsetzung — DOM-Reparenting statt Feld-Duplizierung:** Ein naheliegender,
aber verworfener Ansatz wäre gewesen, die 3 Felder als eigene Kopie mit neuen IDs in der
neuen Karte anzulegen und deren Wert mit dem Original zu synchronisieren (Klick auf die
Kopie setzt den Original-State, und umgekehrt). Das hätte eine eigene Zwei-Wege-
Synchronisierung gebraucht (Presets/Rezept-Laden kennen nur die Original-IDs, ein
Preset-Wechsel hätte die Kopie nicht automatisch mitgezogen) — echtes Duplikat-/Drift-
Risiko. Stattdessen verschiebt das neue Modul **`js/simplemode.js`** die 3
**bestehenden** Feld-`<div>`s (`#ballsField`/`#yeastTypeField`/`#kneadField`, jeweils
bereits vollständig über `js/ui.js`/`js/widgets.js` an `PZ.state` gebunden) per
`appendChild()`/`insertBefore()` zwischen ihrer ursprünglichen Karte und der neuen Karte
„Deine Einstellungen" hin und her — exakt EIN DOM-Knoten je Feld bleibt die einzige
Quelle der Wahrheit, keine Synchronisierung nötig, Presets/Rezept-Laden funktionieren
unverändert weiter (sie kennen nur die Original-IDs, die Position im DOM ist ihnen egal).
Original-Elternknoten + folgendes Geschwister-Element werden beim ersten Verschieben
einmalig gemerkt, damit „Erweiterten Modus öffnen" jedes Feld exakt an seine
ursprüngliche Stelle zurückstellt statt nur ans Kartenende anzuhängen.

**Sichtbarkeit ohne Extra-Wrapper:** `#controlsCol` (id neu ergänzt, nur auf der
Rechner-Ansicht) trägt genau eine der Klassen `mode-simple`/`mode-advanced`. Die 3
klassischen Karten + der „Einfachen Modus aktivieren"-Button bekommen die Klasse
`advanced-only`, die neue Karte die Klasse `simple-only`. Neue CSS-Regeln
(`css/styles.css`): `#controlsCol.mode-simple .advanced-only{display:none;}` /
`#controlsCol.mode-advanced .simple-only{display:none;}`. Bewusst **kein** zusätzlicher
Wrapper-`<div>` um die 3 klassischen Karten (hätte den bestehenden
`display:grid;gap:20px`-Kartenabstand gebrochen, da `gap` nur zwischen direkten
Grid-Kindern wirkt) — alle Karten/Buttons bleiben direkte Kinder von `#controlsCol`.
Default-Zustand bereits im HTML (`class="controls-col mode-simple"`) statt erst per JS
gesetzt, analog zum `.collapse{display:none}`-Muster aus v3.19.2 — verhindert einen
Flacker-Moment vor dem ersten Skript-Durchlauf.

**Persistenz:** eigener localStorage-Key `pizzaSimpleMode` (`'1'`/`'0'`), getrennt vom
Rezept-Speicher `pizzaRechner` und vom Feature-Flag-Speicher `pizzaRechnerFeatureFlags`
— analog zum Muster aus `js/theme.js` (`pizzaTheme`). Default bei fehlendem/leerem Wert:
Einfacher Modus AN (neue Standardansicht laut Feature-Motivation). `PZ.setSimpleMode(v)`
+ `PZ.isSimpleMode()` als öffentliche API (aktuell nicht von anderen Modulen genutzt,
für künftige Erweiterungen wie einen Menü-Schalter offengehalten).

**Mobil-Besonderheit:** die neue Karte ist wie alle anderen Mobil-Karten ein
`<details class="card simple-only" open>` (Akkordeon-Muster, kollabierbar wie jede
andere Karte) statt eines starren Blocks — konsistente Optik/Bedienung.

**Accessibility-Härtung (selbst durchgeführt nach dem Kriterienkatalog aus
`.claude/agents/accessibility-expert.md`, da in dieser Session kein Task-Tool zum
synchronen Subagenten-Aufruf zur Verfügung stand):** ein echtes Problem gefunden und
behoben — beim Klick auf einen Umschalt-Button verschwand genau dieser (gerade
fokussierte) Button selbst per `display:none`, der Tastatur-/Screenreader-Fokus wäre auf
`<body>` zurückgefallen (WCAG 2.4.3 Fokus-Reihenfolge). Fix: `js/simplemode.js` setzt
nach jedem Klick den Fokus explizit auf den jeweils neu sichtbaren Gegenpart-Button
(„Erweiterten Modus öffnen" ↔ „Einfachen Modus aktivieren") — bleibt im etablierten
Umschalt-Kontext, garantiert vorhanden und sichtbar. Per Headless-Klicksimulation
verifiziert (`document.activeElement.id` nach beiden Klickrichtungen korrekt). Alle
anderen Prüfpunkte (Live-Region-Muster `#simpleModeLiveMsg` analog `#themeAnnounce`,
`aria-labelledby`-Referenzen der 3 verschobenen Felder bleiben beim Reparenting
intra-Node und damit gültig, Button-Kontrast identisch zu den bereits geprüften
`.actions button`-Design-Tokens, Karten-Icon `aria-hidden`) unauffällig, da 1:1
bestehende, bereits geprüfte Muster wiederverwendet wurden.

**Ein Bug beim ersten visuellen Check gefunden und behoben:** der Hinweistext in der
neuen Karte zeigte zunächst buchstäblich „&amp;" statt „&" an — `data-i18n` (setzt
`textContent`) statt `data-i18n-html` (setzt `innerHTML`) für einen Text mit
HTML-Entity verwendet. Korrigiert auf `data-i18n-html`, per Screenshot-Vergleich
bestätigt.

**Neue i18n-Einträge** (`js/i18n-dict.js`, DE/EN): `card.simple.title`,
`hint.simpleMode`, `btn.openAdvancedMode`, `btn.openSimpleMode`,
`simpleMode.announceSimple`, `simpleMode.announceAdvanced`.

**Verifikation (Headless-Edge, CDP/`--dump-dom` + iframe-Klicksimulation, kein
Preview-Server nötig):** Default-Zustand (3 Felder liegen initial in
`#simpleModeFields`, `#controlsCol` trägt `mode-simple`) auf Desktop UND Mobil per
`--dump-dom` bestätigt. Voller Umschalt-Zyklus (Simple → Advanced → Simple) per
simuliertem Klick in einem Iframe verifiziert: Felder wandern korrekt zwischen den
Karten, landen exakt an ihrer Original-Position zurück, `localStorage` wird korrekt
geschrieben (`0`/`1`). Persistenz bei simuliertem Neuladen (localStorage vor dem Laden
auf `'0'` gesetzt) ergibt korrekt sofort den Erweiterten Modus. Screenshot-Vergleich
Einfacher/Erweiterter Modus zeigt sauberes Layout ohne Bruch im Karten-Abstand.
`tests/test.html` unverändert **614/614** grün (`js/simplemode.js` lädt dort bewusst
nicht mit, analog zu `js/nav.js`/`js/newrecipe.js`/`js/theme.js` — reines DOM-Wiring auf
echtem Markup, kein `test-generator`-Lauf nötig, da `js/calc.js`/`js/schedule.js`/
`js/guide.js` nicht angefasst wurden).

**Geändert:** `js/simplemode.js` (neu), `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`css/styles.css`, `js/i18n-dict.js`. `?v=` auf `3.62.0` gezogen (Desktop + Mobil,
Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`). `Versionen/v3.62.0 - Einfacher Modus fuer
Presets/` enthält den vollständigen Schnappschuss. Berechnungslogik (`js/calc.js`,
`js/schedule.js`, `js/guide.js`) komplett unverändert — reine UI-/Struktur-Änderung.

## Zahlenfeld-Clamping auch in js/newrecipe.js (v3.61.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: „Punkt 2" desselben
zweiteiligen Auftrags wie v3.60.0. Hintergrund: bei der Einführung der gemeinsamen
Widget-Fabrik `PZ.makeLink()` (`js/widgets.js`, v3.56.0) wurde die bestehende Asymmetrie
bewusst 1:1 erhalten — `js/ui.js` ruft mit `clamp:true` auf (Zahlenfeld-Clamping seit
v3.51.0), `js/newrecipe.js` mit `clamp:false` (hatte das Clamping nie). Das war damals
explizit KEIN Refactoring-Scope, sondern als Nebenbefund fürs Backlog dokumentiert. Der
Nutzer hat jetzt bestätigt: für Konsistenz sollen beide Formulare (Rezept bearbeiten via
`js/ui.js`, neues Rezept anlegen via `js/newrecipe.js`) gleich klemmen.

**Geändert:** da `PZ.makeLink()` das `clamp`-Flag bereits vollständig unterstützt (reine
Konfiguration, keine neue Logik nötig), genügt eine einzige Zeile in `js/newrecipe.js`:
`PZ.makeLink({ stateObj: nrState, clamp: false, ... })` → `clamp: true`. Alle 12 Zahlenfelder
des Formulars (`nrBalls`, `nrBallw`, `nrHyd`, `nrSalt`, `nrOil`, `nrSugar`, `nrPref`,
`nrBhyd`, `nrYeast`, `nrDdt`, `nrRoom`, `nrFlourTemp`) klemmen jetzt identisch zu ihren
`js/ui.js`-Pendants: getippte Werte außerhalb der `min`/`max`-Attribute des jeweils
auslösenden Elements werden auf die Grenze geklemmt, das auslösende Element wird bei
tatsächlicher Klemmung zurückgeschrieben (kein Diskrepanz-Risiko zwischen Anzeige und
State) — exakt dieselbe, bereits in v3.51.0 gehärtete `clampTo()`-Logik, nur jetzt auch
hier aktiv. Kommentare in `js/newrecipe.js` (Aufrufstelle) und `js/widgets.js`
(Datei-Kopfkommentar zur früheren Asymmetrie) aktualisiert, damit sie den neuen Stand
korrekt beschreiben.

**Bewusst NICHT angefasst:** die gestaffelten `min`/`max`-Grenzen selbst (Zahlenfeld meist
weiter gefasst als der zugehörige Slider, z. B. `nrBalls` Slider 1–20 / Zahlenfeld 1–50) —
unverändert wie im `js/ui.js`-Vorbild; ein `<input type="range">` kann von sich aus nie
über sein eigenes `max`-Attribut hinaus angezeigt werden (Browser-natives Verhalten), auch
wenn `state`/Zahlenfeld korrekt auf den weiteren Zahlenfeld-Grenzwert geklemmt sind — kein
neuer Effekt, identisch zum bereits bestehenden `js/ui.js`-Verhalten.

**Härten:** keine neue UI/kein neues Markup (reine Verhaltens-Härtung bestehender Felder,
identisch zur bereits produktiv laufenden `js/ui.js`-Logik) — analog zur Begründung bei der
Einführung des Clampings selbst (v3.51.0) kein `accessibility-expert`-Durchlauf nötig.

**Tests:** `js/newrecipe.js` wird in `tests/test.html` bewusst nicht geladen (reines
DOM-Wiring ohne eigene Test-Sektion, wie `js/ui.js`) — daher unverändert **614 Prüfungen**,
alle grün. Stattdessen mit einem isolierten, temporären Headless-Edge-Verifikations-Aufbau
geprüft (Kopie der `#newRecipeCard`-Formularfelder + `js/dom.js`/`js/state.js`/
`js/i18n-dict.js`/`js/i18n.js`/`js/settings.js`/`js/theme.js`/`js/widgets.js`/`js/flour.js`/
`js/newrecipe.js`, echte `input`-Events simuliert): `nrBallsN=500` klemmt korrekt auf 50
(Zahlenfeld-Grenze), `nrHydN=5` klemmt auf 40, `nrHydN=65` (innerhalb der Grenzen) bleibt
unverändert, `nrRoomN=-15` klemmt auf 0, `nrBallwN=400` (gemeinsames Slider-/Zahlenfeld-
Maximum) bleibt korrekt synchron — 5/5 Kernprüfungen wie erwartet. Verifikations-Datei
nach Gebrauch wieder gelöscht (war nie Teil des Repos, analog zu v3.51.0).

**Geändert:** `js/newrecipe.js`, `js/widgets.js`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.61.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in
allen drei HTML-Dateien auf `v3.61.0`. `pizza-rechner-mobile-standalone.html` neu gebaut.
`Versionen/v3.61.0 - Zahlenfeld-Clamping newrecipe/` enthält den vollständigen Schnappschuss.

**Damit ist der zweiteilige Nutzerauftrag (v3.60.0 + v3.61.0) komplett abgeschlossen.**

## flourTemp-Legacy-Fallback entfernt (v3.60.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: „Punkt 1" eines
zweiteiligen Folgeauftrags (Punkt 2 — Zahlenfeld-Clamping in `js/newrecipe.js` — folgt
als eigener Zyklus direkt im Anschluss). Hintergrund: `applyState()` (`js/storage.js`)
enthielt seit Einführung des eigenständigen Mehltemperatur-Reglers (v3.20.0) eine
Legacy-Fallback-Bedingung — `if (state.flourTemp != null) set.flourTemp(state.flourTemp);`
—, die Rezepte abfing, die VOR dieser Version gespeichert wurden und das Feld noch nicht
kannten. Strukturell identisch zum bereits in v3.53.0 entfernten Zucker-/Öl-Fallback, dort
aber explizit ausgeklammert (kein bestätigter Auftrag). Der Nutzer hat jetzt bestätigt:
dieselbe Begründung trifft zu — die App wird bisher ausschließlich von ihm selbst genutzt,
aktuell ist kein einziges Rezept in `localStorage` gespeichert, es gibt also keine real
existierenden alten Rezepte, die diesen Fallback je gebraucht hätten, und jedes künftig
gespeicherte Rezept enthält das Feld ohnehin automatisch (`js/state.js` `PZ.state`-Defaults,
`flourTemp: 21`).

**Entfernt:** der `if (state.flourTemp != null)`-Guard in `applyState()` —
`set.flourTemp(state.flourTemp)` wird jetzt unconditional aufgerufen, genau wie
`set.oil(state.oil)`/`set.sugar(state.sugar)` direkt daneben seit v3.53.0.

**Bewusst NICHT angefasst (Unterscheidung von normalem defensivem Programmieren, analog
zur v3.53.0-Abgrenzung):**
- Die Robustheit gegen kaputte/unvollständige EXTERNE Importe (Teilen-Link, Rezepte-Backup)
  bleibt vollständig erhalten — sie hängt nicht an diesem Guard, sondern an `set()` selbst
  (`js/ui.js`/`js/widgets.js` `makeLink`): `val = parseFloat(val); if (isNaN(val)) return;`
  fängt `null`/`undefined`/kaputte Werte unabhängig davon ab, ob `applyState()` den Aufruf
  bedingt oder unconditional macht.
- Der breitere Format-Migrationscode (`isLegacyState()`/`readStore()`, alter Einzel-Slot-
  Stand vor v3.10.0 → `{recipes:[...],activeId}`) — eine andere Migrationskategorie,
  unangetastet.

**Härten:** keine UI-/Markup-Änderung (reine Logik-Vereinfachung in `js/storage.js`) — kein
`accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen**, alle grün (kein separater
`test-generator`-Lauf — Fix eng umrissen, bestehender Regressionstest deckt den Fall
bereits ab). Der schon seit v3.20.0 existierende Test in Sektion „16 · Speichern & Laden"
(„Altes Rezept ohne flourTemp-Feld … kein Crash, Sentinel-Wert bleibt erhalten") prüft
weiterhin exakt dasselbe Verhalten (Object.assign kopiert nur vorhandene Keys, ein
fehlendes `flourTemp`-Feld überschreibt den vorherigen UI-Wert nicht mit `undefined`) —
Titel/Kommentar nur aktualisiert (verwies vorher auf den jetzt entfernten Guard als
Erklärung, jetzt auf die unconditional-Variante, analog zum oil/sugar-Test direkt
darunter). Verifiziert per Headless-Edge-Dump (`msedge --headless --disable-gpu
--virtual-time-budget=8000 --dump-dom` gegen die `file://`-URL): „✓ Alle 614 Prüfungen
bestanden".

**Geändert:** `js/storage.js`, `tests/test.html`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.60.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in
allen drei HTML-Dateien auf `v3.60.0`. `pizza-rechner-mobile-standalone.html` neu gebaut.
`Versionen/v3.60.0 - flourTemp-Legacy-Fallback entfernt/` enthält den vollständigen
Schnappschuss.

## Gemeinsame State-Plausibilisierung PZ.looksLikeState() (v3.59.0)

Per `/define-feature` bestätigt — **fünftes und letztes** von fünf Struktur-
Refactorings aus demselben Fable-Architektur-Review (S1–S6, S5 Nav-Modul bereits in
v3.54.0 erledigt): 1) i18n-Split (v3.55.0), 2) Widget-Fabrik (v3.56.0), 3) Rechenkern/
Renderer-Trennung calc.js (v3.57.0), 4) `PZ.announce()`-Helfer (v3.58.0), 5)
`PZ.looksLikeState()` (dieser Abschnitt). **Mit diesem Zyklus ist der komplette
Fünferauftrag abgeschlossen** — reines Wartbarkeits-Refactoring **ohne Änderung des
Validierungsverhaltens selbst, keine neue Schema-Migration** (exakt wie beauftragt).

**Motivation:** dieselbe Prüfung „sieht dieses Objekt wie ein gültiger `PZ.state`
aus" (kein Array, mindestens eines der Kernfelder `balls`/`hyd` vorhanden) existierte
dreifach unabhängig: `looksLikeState()` in `js/share.js` (Teilen-Link), `isLegacyState()`
in `js/storage.js` (alte Einzel-Slot-Migration), `isValidRecipeEntry()` in
`js/storage.js` (Rezepte-Backup-Import) — kein bisher fehlender zentraler Ort für
künftige Typ-Normalisierung/Schema-Migrationsfragen bei Teilen-Link + Import (analog
zum kürzlich behobenen `knead`-Typinkonsistenz-Fall, v3.50.0).

**Neue gemeinsame Funktion `PZ.looksLikeState(o)`** in `js/state.js` (natürlicher
Ort — state.js definiert bereits die Form von `PZ.state` selbst): identisches
Kriterium wie vorher (`!!o && typeof o === 'object' && !Array.isArray(o) &&
(o.balls != null || o.hyd != null)`), 1:1 aus `js/share.js`s bisheriger Version
übernommen.

**Alle drei Aufrufer darauf umgestellt:**
- `js/share.js` — die lokale `looksLikeState()`-Funktion komplett entfernt (reiner
  Passthrough ohne eigene Zusatzlogik, kein Wrapper nötig), Aufrufstelle direkt auf
  `PZ.looksLikeState(state)` umgestellt.
- `js/storage.js` `isLegacyState(o)` — behält seine legacy-spezifische
  Zusatzbedingung (`!Array.isArray(o.recipes)`, unterscheidet altes Einzel-Slot- vom
  neuen `{recipes:[...],activeId}`-Format), nutzt aber `PZ.looksLikeState(o)` für den
  „sieht wie state aus"-Teil: `PZ.looksLikeState(o) && !Array.isArray(o.recipes)`.
- `js/storage.js` `isValidRecipeEntry(r)` — vereinfacht auf `!!r && typeof r ===
  'object' && PZ.looksLikeState(r.state)`.
- Geprüfte Äquivalenz: `PZ.looksLikeState` prüft zusätzlich `!Array.isArray(o)`
  selbst (die alten `isLegacyState`/`isValidRecipeEntry`-Versionen taten das nicht
  explizit für ihr jeweiliges Objekt) — ändert das Ergebnis für keinen realistischen
  Input (ein Array ohne `.balls`/`.hyd`-Eigenschaften scheitert ohnehin am
  Kernfeld-Check; `typeof [] === 'object'` in JS, Arrays wurden vorher also implizit
  mitgeprüft, nur nicht explizit ausgeschlossen).

**Härten:** keine neue UI/kein neues Markup (reine Funktions-Konsolidierung) — kein
`accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen**, alle grün — Sektion
„16 · Speichern & Laden" (Legacy-Migration, korruptes JSON, Rezepte-Backup-Import) und
„17 · Teilen-Link" (Rundreise, defensive Fehlerbehandlung) decken die konsolidierte
Logik bereits ab und dienen hier als Regressionsanker wie vom Auftrag gefordert.
Zusätzlich mit einem isolierten, temporären Headless-Edge-Test verifiziert (nie
committet): `PZ.looksLikeState()` direkt mit acht Grenzfällen geprüft (`null`,
`undefined`, Array, leeres Objekt, Objekt mit `balls`, Objekt mit `hyd`, String,
Number) — alle 8/8 liefern das rechnerisch erwartete Ergebnis.

**Geändert:** `js/state.js`, `js/share.js`, `js/storage.js`, `pizza-rechner-KONTEXT.md`.
`?v=` auf `3.59.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags),
`appVersion`-Text in allen drei HTML-Dateien auf `v3.59.0`.
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.59.0 -
PZ-looksLikeState State-Plausibilisierung/` enthält den vollständigen Schnappschuss.

**Fünferauftrag „Struktur-Refactorings aus dem Fable-Architektur-Review" komplett
abgeschlossen** (S1–S6, S5 Nav-Modul separat in v3.54.0): i18n-Split (v3.55.0),
Widget-Fabrik (v3.56.0), calc.js-Trennung (v3.57.0), `PZ.announce()` (v3.58.0),
`PZ.looksLikeState()` (v3.59.0). Zwei dabei entdeckte, unabhängige Nebenbefunde bleiben
offen fürs Backlog: (1) ob `js/newrecipe.js`s Zahlenfelder künftig ebenfalls das
Zahlenfeld-Clamping wie `js/ui.js` bekommen sollen (eigene Produktentscheidung,
v3.56.0), (2) der `flourTemp`-Legacy-Fallback in `js/storage.js` `applyState()` (v3.53.0,
strukturell identisch zum bereits entfernten Zucker-/Öl-Fallback, aber nicht explizit
bestätigt).

## Gemeinsamer Live-Region-Helfer PZ.announce() (v3.58.0)

Per `/define-feature` bestätigt — viertes von fünf Struktur-Refactorings aus demselben
Fable-Architektur-Review, in fester Reihenfolge: 1) i18n-Split (v3.55.0), 2)
Widget-Fabrik (v3.56.0), 3) Rechenkern/Renderer-Trennung calc.js (v3.57.0), 4)
`PZ.announce()`-Helfer (dieser Abschnitt), 5) `PZ.looksLikeState()` — noch offen,
folgt als eigener, letzter Zyklus dieses Fünferauftrags. Reines
Wartbarkeits-Refactoring **ohne beabsichtigte Änderung des Ansage-Verhaltens/-Timings
selbst, keine neuen Live-Regions** (exakt wie beauftragt).

**Motivation:** dasselbe „erst leeren, dann im nächsten Tick setzen, dabei ein
Generation-Zähler gegen Races" Live-Region-Muster (WCAG 4.1.3 Status Messages)
existierte als 7+ handgeschriebene, unabhängig gepflegte Kopien über das ganze
Projekt verteilt. Genau diese Drift hatte schon einmal zu einem echten Bug geführt:
`js/pdf.js` war bis v3.50.0 die einzige Stelle OHNE Generation-Zähler und konnte
deshalb bei schnellem Doppelklick eine neuere Live-Region-Meldung mit einer älteren
überschreiben — isoliert gefixt statt strukturell behoben.

**Neuer gemeinsamer Helfer `PZ.announce(elementId, text)`** in `js/dom.js` (Clear
sofort, Text nach 50 ms setzen, Generation-Zähler PRO Element-ID in einem internen
`announceGens`-Objekt — mehrere unabhängige Live-Regions stören sich nicht
gegenseitig).

**Alle sieben bestehenden Aufrufer darauf umgestellt** (Funktionsnamen/Signaturen an
den Aufrufstellen bewusst unverändert gelassen, nur der Funktionskörper delegiert
jetzt an `PZ.announce()` — kein Risiko durch Call-Site-Änderungen):
`js/share.js` `copyShareLink()`→`#shareLiveMsg`, `js/main.js` `showRecipeIOMsg()`→
`#recipeIOLiveMsg`, `js/party.js` `announcePartyCreate()`→`#partyCreateLiveMsg` +
`announcePartyStatus()`→`#partyStatusLiveMsg`, `js/newrecipe.js` `showNrMsg()`→
`#nrLiveMsg`, `js/theme.js` `announceThemeChange()`→`#themeAnnounce`, `js/pdf.js`
`setPdfMsg()`→`#pdfGuideLiveMsg`.

**Zwei echte, vorher unentdeckte Bugs beim Konsolidieren gefunden und automatisch
mitbehoben** (keine Sonderbehandlung nötig — sie hatten schlicht dasselbe Muster
OHNE den Generation-Zähler, was der ganze Sinn dieses Refactorings ist zu verhindern):
- `js/i18n.js` `announceLangChange()`→`#langAnnounce` hatte **keinen**
  Generation-Zähler — zwei schnelle Sprachwechsel hintereinander hätten die neuere
  Ansage mit der älteren überschreiben können.
- `js/nav.js` `announceView()`→`#viewAnnounce` hatte ebenfalls **keinen**
  Generation-Zähler — dieselbe Race-Gefahr bei zwei schnellen Bereichswechseln.
Beide sind nach der Migration jetzt identisch robust wie die übrigen sieben Stellen.

**Bewusst NICHT angefasst:** die separate `liveMsg.textContent = '';`-Zeile in
`js/share.js`s `copyShareLink()` innerhalb eines eigenen `setTimeout(..., 1800)`
(Cleanup nach dem Verblassen des Button-Feedbacks) — kein Bezug zum
Generation-Zähler-Muster, reines Zurücksetzen der Live-Region auf leer, unverändert.

**Härten:** da dieses Refactoring ALLE Live-Region-Ansagen im gesamten Projekt anfasst
(wie vom Auftrag explizit hervorgehoben), zusätzlich zur normalen Testsuite ein
**gezielter `accessibility-expert`-Durchlauf** (synchron, nur auf die Live-Region-
Stellen fokussiert, kein Vollaudit): bestätigt `PZ.announce()`s Logik korrekt, alle
sieben Aufrufer übergeben die richtige Element-ID + fertig zusammengesetzten Text
(keine vertauschten Keys), die beiden Nachzügler (i18n.js/nav.js) korrekt migriert
und weiterhin korrekt von ihren jeweiligen Klick-Handlern aufgerufen, alle neun
Ziel-Elemente haben `role="status" aria-live="polite"` direkt am statischen Container
(kein dynamisch ersetztes Kind-Element) — korrektes Live-Region-Pattern. Der
share.js-Sonderfall (1800ms-Cleanup) bestätigt unproblematisch: läuft bei
Einzelklick weit nach dem 50ms-Announce-Timeout; bei sehr schnellem Doppelklick
(< 1800 ms) ein bereits VOR diesem Refactoring bestehendes, unverändertes
Randverhalten (kein neuer Bug). Keine Korrekturen nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen** (Live-Region-Timing
wird dort projektweit bewusst nicht unit-getestet, s. bestehende Kommentare bei
`#themeAnnounce`/`#langAnnounce` — Regressionsanker wie vom Auftrag gefordert).
Zusätzlich mit einem isolierten, temporären Headless-Edge-Verhaltenstest verifiziert
(nie committet): `PZ.announce()` leert sofort, setzt nach 50 ms korrekt, ein Race
zwischen zwei schnellen Aufrufen auf dieselbe Element-ID lässt zuverlässig den
NEUEREN Aufruf gewinnen, zwei verschiedene Element-IDs beeinflussen sich nicht
gegenseitig — alle Prüfungen grün.

**Geändert:** `js/dom.js`, `js/share.js`, `js/main.js`, `js/party.js`,
`js/newrecipe.js`, `js/theme.js`, `js/pdf.js`, `js/i18n.js`, `js/nav.js`,
`pizza-rechner-KONTEXT.md`. `?v=` auf `3.58.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags), `appVersion`-Text in allen drei HTML-Dateien auf `v3.58.0`.
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.58.0 -
PZ-announce Live-Region-Helfer/` enthält den vollständigen Schnappschuss.

## Rechenkern von Renderer getrennt (calc.js) (v3.57.0)

Per `/define-feature` bestätigt — drittes von fünf Struktur-Refactorings aus demselben
Fable-Architektur-Review, in fester Reihenfolge: 1) i18n-Split (v3.55.0), 2)
Widget-Fabrik (v3.56.0), 3) Rechenkern/Renderer-Trennung calc.js (dieser Abschnitt),
4) `PZ.announce()`-Helfer, 5) `PZ.looksLikeState()` — noch offen, folgen als eigene
Zyklen. Reines Wartbarkeits-Refactoring **ohne beabsichtigte Verhaltensänderung**.

**Motivation:** `js/calc.js` vermischte bis v3.56.0 Mathematik mit ~30 direkten
DOM-Schreibzugriffen (`$('totalW').textContent = ...` usw. quer über die ganze
Funktion verteilt) — Kernberechnungen waren dadurch nur über vollständige DOM-Stubs
testbar, echte Logikfehler (wie der Eis-Bug, v3.48.0) schwerer isoliert zu
finden/testen.

**Umsetzung — Scope exakt wie beauftragt:**
- **`PZ.calcCore(state)`** — neue, reine Rechenfunktion **ohne jeden DOM-Zugriff**:
  nimmt ein `state`-Objekt entgegen (muss nicht `PZ.state` sein — jedes Objekt mit
  den passenden Feldern funktioniert, s. Verifikation unten), liefert das komplette
  Ergebnis-Objekt `R` zurück. Ruft `PZ.t()` für Text (`yWord`/`note`) — reine,
  DOM-freie Wörterbuch-Abfrage, zählt nicht als DOM-Zugriff. Drei neue, rein interne
  Render-Hilfsfelder in `R` ergänzt (`hasPref`, `hasMixingWater`, `note`), damit
  `renderResult()` unten wirklich NUR `R` als Parameter braucht, kein zusätzliches
  `state` — rein additiv, keine bestehenden `R`-Felder verändert/entfernt (geprüft:
  kein Aufrufer iteriert `Object.keys(PZ.R)`, alle lesen benannte Felder).
- **`PZ.renderResult(R)`** — neue Funktion, schreibt ein bereits berechnetes `R` ins
  DOM. Keine Berechnung mehr hier, nur Anzeige — 1:1 dieselben ~30 DOM-Schreibzugriffe
  wie vorher, nur aus `R.*` statt aus lokalen Variablen gespeist.
  Der bedingte Vorteig-Block (`pFlour`/`mFlour`/... — nur bei Biga/Poolish
  geschrieben) hängt nach der Trennung an `R.hasPref` statt am direkten
  `state.method !== 'direct'`-Check.
- **`PZ.calc()`** bleibt als Fassade bestehen: `calcCore(state) → PZ.R → renderResult(R)
  → PZ.buildGuide()`. **Keine Änderung an bestehenden Aufrufern nötig** — `js/ui.js`,
  `js/presets.js`, `js/storage.js`, `js/share.js` usw. rufen weiterhin unverändert
  `PZ.calc()` auf.
- **Bewusst NICHT angefasst** (wie beauftragt): `js/guide.js`/`js/schedule.js` bleiben
  strukturell unverändert, obwohl sie ähnliche DOM-Vermischung haben könnten —
  separates, hier nicht beauftragtes Vorhaben.

**Härten:** keine neue UI/kein neues Markup (reine, verhaltensidentische Funktions-
Aufteilung) — kein `accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen**, alle grün — die
Testsuite ruft weiterhin `PZ.calc()` auf (nicht `calcCore()` direkt), dient hier
als Regressionsanker wie vom Auftrag gefordert. Zusätzlich gezielt verifiziert (per
temporärem Headless-Edge-Aufbau, nie committet): `PZ.calcCore()` direkt mit einem
**komplett eigenen, PZ.state-unabhängigen** Test-state-Objekt aufgerufen — liefert
korrekte Werte (`R.total`, `R.flour`, `R.hasPref`, `R.wT`) OHNE dass währenddessen
irgendein DOM-Element existieren oder berührt werden muss (beweist den eigentlichen
Zweck des Refactorings: isolierte Testbarkeit der Rechenlogik). Der v3.48.0-Grenzfall
(Poolish an der Klemmgrenze, `mWater` exakt 0) über `calcCore()` erneut gegengeprüft:
`hasMixingWater:false`, `ice:0`, korrekte Hinweis-Notiz — Regression durch die
Trennung ausgeschlossen. Danach die normale `PZ.calc()`-Fassade mit echtem `PZ.state`
geprüft: DOM (`#totalW`/`#gFlour`/`#waterTemp`) zeigt exakt dieselben Werte wie
`calcCore()` pur zurückgab. Mobil-Seite zusätzlich per Headless-Dump gegengeprüft
(`#totalW` korrekt gerendert).

**Geändert:** `js/calc.js`, `pizza-rechner-KONTEXT.md`. `?v=` auf `3.57.0` gezogen
(Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in allen drei
HTML-Dateien auf `v3.57.0`. `pizza-rechner-mobile-standalone.html` neu gebaut.
`Versionen/v3.57.0 - Rechenkern-Renderer-Trennung calc/` enthält den vollständigen
Schnappschuss.

## Gemeinsame Widget-Fabrik für ui.js/newrecipe.js (v3.56.0)

Per `/define-feature` bestätigt — zweites von fünf Struktur-Refactorings aus demselben
Fable-Architektur-Review, in fester Reihenfolge: 1) i18n-Split (v3.55.0, erledigt),
2) Widget-Fabrik (dieser Abschnitt), 3) Rechenkern/Renderer-Trennung calc.js, 4)
`PZ.announce()`-Helfer, 5) `PZ.looksLikeState()` — noch offen, folgen als eigene
Zyklen. Reines Wartbarkeits-Refactoring **ohne beabsichtigte Verhaltensänderung**.

**Motivation:** `js/ui.js` (Hauptrechner) und `js/newrecipe.js` (Mini-Formular „Neues
Rezept anlegen") hatten ~150 Zeilen fast identisch dupliziert: Slider<->Zahlenfeld
(`link()`/`nrLink()`), Segment-Buttons (`seg()`/`nrSeg()`), Vorteig-Reife-Stufen
(`renderPrefStages()`+Geschwister/`nrRenderPrefStages()`+Geschwister), Mehl-Dropdown
(`js/flour.js` `renderFlourOptions()`/`newrecipe.js` `populateNrFlour()`), plus ein
exakt dupliziertes `PREF_DEFAULT`-Objekt. Echtes Divergenzrisiko: der Komma-Format-Fix
(v3.32.0) musste damals zweimal gemacht werden — und das Zahlenfeld-Clamping (v3.51.0,
Fable-Review-Fund „B8") wurde seither nur in `js/ui.js` nachgezogen, `js/newrecipe.js`
hatte es nie (s. „Bewusst NICHT vereinheitlicht" unten).

**Neues Modul `js/widgets.js`** liefert vier Fabrik-Funktionen, die je eine Konfiguration
entgegennehmen und eine fertige, aufrufbare Funktion zurückgeben:
- `PZ.makeLink(cfg)` — ersetzt `link()`/`nrLink()`. `cfg.stateObj` (welches Objekt
  beschrieben wird), `cfg.onSet` (optionaler Callback wie `PZ.calc`), `cfg.clamp`
  (true/false — s. u.), `cfg.unitLinks` (Array für Sprachwechsel-Auffrischung).
- `PZ.makeSeg(cfg)` — ersetzt `seg()`/`nrSeg()`. `cfg.stateObj`, `cfg.onSet`.
- `PZ.makePrefStages(cfg)` — ersetzt `renderPrefStages()`/`highlightPrefStage()`/
  `selectPrefStage()` (+ `nr*`-Geschwister). Gibt `{render, highlight, select,
  selectValidOrDefault}` zurück — Letzteres bündelt das bisher in
  `applyMethod()`/`nrApplyMethod()` duplizierte „aktuelle Stufe gültig? behalten :
  auf `PREF_DEFAULT[m]` zurückfallen"-Muster. `PREF_DEFAULT` lebt jetzt nur noch
  einmal, modul-intern in `js/widgets.js` (vorher exakt dupliziertes Objekt in
  beiden Dateien).
- `PZ.fillFlourSelect(cfg)` — ersetzt `renderFlourOptions()`/`populateNrFlour()`.
  `cfg.selectId`, `cfg.stateObj` (nur für den Vorauswahl-Fallback — das eigentliche
  Schreiben von `stateObj.flour` beim `change`-Event bleibt bewusst AUSSERHALB der
  Fabrik, da nur `js/flour.js` danach `PZ.calc()` auslöst, `js/newrecipe.js` nicht).

**`js/ui.js`, `js/flour.js`, `js/newrecipe.js`** rufen diese vier Fabriken jetzt nur
noch als dünne Konfigurationsaufrufe auf (s. jeweilige Datei) — die eigentliche Logik
steht genau einmal in `js/widgets.js`.

**Bewusst NICHT vereinheitlicht (echte, bestehende Verhaltens-Asymmetrie erhalten, wie
vom Auftrag verlangt: „keine Verhaltensänderung der Formulare selbst"):** `js/ui.js`
ruft `PZ.makeLink({..., clamp: true})` auf (Zahlenfeld-Clamping seit v3.51.0),
`js/newrecipe.js` ruft `PZ.makeLink({..., clamp: false})` auf (hatte das Clamping nie).
Beide Verhaltensweisen bleiben nach der Konsolidierung exakt so bestehen wie vorher —
kein stillschweigendes Nachziehen des Clampings in `js/newrecipe.js` in diesem Zug.
**Neuer Nebenbefund fürs Backlog:** dieselbe Drift-Gefahr, die dieses Refactoring
eigentlich beheben sollte, ist hier in der Zwischenzeit schon einmal aufgetreten
(B8-Clamping-Fix nur einseitig nachgezogen) — ob `js/newrecipe.js`s Zahlenfelder
künftig ebenfalls klemmen sollen, ist eine eigene Produktentscheidung (kein reines
Refactoring mehr) und braucht eine explizite Bestätigung in einem künftigen Zyklus.

**Härten:** keine neue UI/kein neues Markup (reine Verhaltens-identische
Fabrik-Extraktion) — kein `accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen**, alle grün (weder
`js/ui.js`, `js/newrecipe.js` noch `js/widgets.js` selbst werden dort geladen/getestet
— reine Regressionsanker-Funktion der bestehenden Suite, wie vom Auftrag gefordert).
Zusätzlich mit einem isolierten, temporären Headless-Edge-Verhaltenstest verifiziert
(13 Prüfungen je Seite, nie committet): `link()`-Clamping in `js/ui.js` weiterhin aktiv
(getippt `balls=500` → geklemmt auf 50, Anzeige synchron), `js/newrecipe.js`s `nrLink()`
weiterhin UNGEKLEMMT (bewusst, s. o.); Segment-Klick setzt `state.method` korrekt;
Vorteig-Reife-Pill-Klick setzt `prefStage`+`yeast` korrekt und setzt `#preset` zurück
(nur auf der Hauptseite); Mehl-Dropdown wird auf beiden Formularen korrekt mit 13
Mehlen/3 Herstellergruppen befüllt. Alle 13/13 grün auf Desktop UND Mobil. Standalone-
Build gegengeprüft: `makeLink`/`makeSeg`/`makePrefStages`/`fillFlourSelect` kommen im
Ergebnis jeweils nur noch **einmal** vor (vorher implizit über mehrere Textkopien).

**Geändert:** `js/widgets.js` (neu), `js/ui.js`, `js/flour.js`, `js/newrecipe.js`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`,
`pizza-rechner-KONTEXT.md`. `?v=` auf `3.56.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags inkl. der neuen `js/widgets.js`-Referenz), `appVersion`-Text
in allen drei HTML-Dateien auf `v3.56.0`. `pizza-rechner-mobile-standalone.html` neu
gebaut. `Versionen/v3.56.0 - Widget-Fabrik ui-newrecipe/` enthält den vollständigen
Schnappschuss.

## i18n-Datei aufgeteilt (v3.55.0)

Per `/define-feature` bestätigt — erstes von fünf Struktur-Refactorings (S1–S6 minus S5
Nav-Modul, bereits erledigt in v3.54.0) aus demselben Fable-Architektur-Review, **in
fester Reihenfolge nacheinander abzuarbeiten**: 1) i18n-Datei aufteilen (dieser
Abschnitt), 2) Widget-Fabrik ui.js/newrecipe.js, 3) Rechenkern/Renderer-Trennung
calc.js, 4) `PZ.announce()`-Helfer, 5) `PZ.looksLikeState()`. Alle fünf sind reine
Wartbarkeits-Refactorings **ohne beabsichtigte Verhaltensänderung** — Testsuite dient
jeweils als Regressionsanker.

**Motivation:** `js/i18n.js` war mit 569 `add(key,de,en)`-Einträgen / ~108 KB das mit
Abstand größte Modul und wuchs bei jedem neuen Feature weiter — Laufzeit-Engine und
Wörterbuch-Inhalt ließen sich nicht getrennt überblicken.

**Umsetzung:** neue Datei `js/i18n-dict.js` (~100 KB, 867 Zeilen) enthält jetzt
ausschließlich die `add()`-Wörterbuch-Einträge (reine Daten, 1:1 unverändert aus
`js/i18n.js` übernommen — keine inhaltliche Textänderung). `js/i18n.js` selbst (jetzt
nur noch ~10 KB) bleibt die Laufzeit-Engine: `t()`, `setLang()`, `applyStaticI18n()`,
`wireLangSwitch()`, Sprach-Erkennung/-Persistenz, Umschalter-Verdrahtung — unverändert.

**Handoff-Mechanismus (nutzt den vorhandenen, bisher ungenutzten `PZ._i18nAdd`-Hook,
wie beauftragt):** `js/i18n-dict.js` lädt **vor** `js/i18n.js` (neue `<script>`-Zeile in
`pizza-rechner.html`/`pizza-rechner-mobile.html`/`tests/test.html`, direkt vor der
bestehenden `i18n.js`-Zeile), baut sein eigenes lokales `DICT` auf und übergibt es am
Dateiende über `PZ._I18N_DICT = DICT;`. `js/i18n.js` übernimmt dieses bereits befüllte
DICT beim eigenen Start (`const DICT = PZ._I18N_DICT || { de: {}, en: {} };` — leerer
Fallback bleibt defensiv erhalten, falls die Datei je isoliert läuft) statt ein neues
leeres anzulegen, und exportiert `add()` weiterhin als `PZ._i18nAdd` — jetzt ein
**echter, funktionierender** Hook für Module, die künftig NACH `js/i18n.js` laden und
eigene Übersetzungen nachreichen wollen (vorher nur ein toter Kommentar-Verweis ohne
tatsächlichen Konsumenten).

**Härten:** keine UI-/Markup-Änderung (reine Modul-Aufteilung, keine neuen DOM-Elemente)
— kein `accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` unverändert bei **614 Prüfungen**, alle grün — reine
Infrastruktur-Änderung ohne Verhaltensänderung, die bestehende Testsuite ist hier der
Regressionsanker (wie vom Auftrag gefordert: Zahlen ändern sich nur durch neue Tests,
nicht durch verändertes Verhalten — hier: unverändert). Zusätzlich per Headless-Edge-Dump
verifiziert: `data-i18n="label.balls"` rendert weiterhin korrekt „Anzahl Teiglinge" auf
der echten Seite; `PZ.t('label.balls')` liefert nach `PZ.setLang('en')` korrekt „Number
of dough balls" (DICT.de UND DICT.en beide korrekt über den Handoff übernommen).
Standalone-Build gegengeprüft: `js/i18n-dict.js` wird vor `js/i18n.js` inline gebaut,
beide `PZ._I18N_DICT = DICT`-Zuweisungen liegen in der richtigen Reihenfolge.

**Geändert:** `js/i18n-dict.js` (neu), `js/i18n.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `tests/test.html`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.55.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags inkl. der neuen
`js/i18n-dict.js`-Referenz), `appVersion`-Text in allen drei HTML-Dateien auf `v3.55.0`.
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.55.0 - i18n-Datei
aufgeteilt/` enthält den vollständigen Schnappschuss.

## Gemeinsames Nav-Modul (v3.54.0)

Per `/define-feature` bestätigt, direkt im Anschluss an „Auftrag A" (Zucker-/Öl-Fallback,
v3.53.0) aus demselben zweiteiligen Nutzerauftrag. Hintergrund: seit v3.26.0 gab es die
Burgermenü-Navigation (`openNav`/`closeNav`/`activateView`/`announceView`/`focusView` +
Tab-Trap) als zwei praktisch identische, unabhängig gepflegte Inline-`<script>`-Kopien in
`pizza-rechner.html` und `pizza-rechner-mobile.html` (plus eine dritte, mechanisch aus
Mobil abgeleitete Kopie im Standalone-Build) — damals bewusst dupliziert statt
ausgelagert, um die bewährte Mobil-Implementierung nicht anzufassen (s. Abschnitt
„Burgermenü-Navigation auch auf Desktop (v3.26.0)" oben). Diese Vorgabe gilt seit diesem
Zyklus nicht mehr: jede künftige Menü-Erweiterung musste bisher doppelt/dreifach gepflegt
werden — reines Wartbarkeitsrisiko ohne funktionalen Nutzen der Duplizierung.

**Neues Modul `js/nav.js`:** enthält jetzt `openNav()`/`closeNav()`/`activateView()`/
`announceView()`/`focusView()`/`gotoView()` + die komplette Tab-Trap-Logik
(`onNavKeydown`/`focusablesInPanel()`) + die Event-Verdrahtung (Toggle-Klick, Close-Klick,
Overlay-Klick-außerhalb, Escape, `.nav-item`-Klicks). **Mobil-Implementierung war die
maßgebliche Referenz** (wie beauftragt) — der Code ist funktional 1:1 aus dem bisherigen
Mobil-Inline-Script übernommen, **keine Verhaltensänderung**.

**Einzige tatsächliche Abweichung zwischen den beiden früheren Kopien — jetzt per
Feature-Erkennung vereinheitlicht:** der jeweils letzte fokussierbare Eintrag im Panel war
ein plattform-spezifischer Cross-Link zur anderen Ansicht (`#navMobileLink` auf Desktop,
`#navDesktopLink` auf Mobil). `js/nav.js` ermittelt ihn jetzt mit
`const crossLink = $('navMobileLink') || $('navDesktopLink');` — funktioniert auf beiden
Seiten korrekt, da ohnehin nur je einer der beiden Links im jeweiligen Markup existiert.

**Geänderte HTML-Dateien:** in `pizza-rechner.html` wurde das komplette Desktop-Inline-
Script (openNav…Event-Verdrahtung) durch `<script src="js/nav.js?v=3.54.0"></script>`
ersetzt (letztes Script vor `</body>`, wie zuvor). In `pizza-rechner-mobile.html` wurde
NUR die Sektion „4) Hamburger-Navigation" aus dem umschließenden „Mobil-only UI-Glue"-
Inline-Script entfernt (die Sektionen 1/1b/2/3 — Quick-Bar-Sync, Party-Quick-Bar,
Quick-Save, Akkordeon-Auto-Scroll — bleiben unverändert dort, sind Mobil-exklusiv und
nicht Teil der Nav-Logik); `<script src="js/nav.js?v=3.54.0">` wurde direkt nach
`main.js` und vor dem verbleibenden Mobil-Glue-Script eingefügt. Der Standalone-Build
zieht `js/nav.js` automatisch inline mit (bestehender `build-mobile-standalone.py`-
Mechanismus für alle `<script src="js/…">`-Referenzen) — kein separates drittes Duplikat
mehr nötig, verifiziert per Duplikat-Zählung (`function openNav` kommt im Standalone-
Ergebnis nur noch **einmal** vor, vorher implizit über zwei unabhängige Textkopien).

**Nachgezogene Cross-Referenzen** (Kommentare in anderen Modulen, die auf die alten
Inline-Scripts verwiesen): `js/guide.js` (Zeitplan-Sprung-Kommentar), `js/i18n.js`
(`guide.schedbar.noTime`-Kommentar), `js/party.js` (zwei `focusView()`-Analogie-
Kommentare), sowie ein `activateView()`-Verweis im `pizza-rechner-mobile.html`-Markup-
Kommentar über der Party-Quick-Bar — alle jetzt auf „`js/nav.js`" statt „Burgermenü-
Inline-Script(s)" korrigiert.

**Härten (gezielt, wie vom Nutzer explizit gefordert — echtes Refactoring mit
Verhaltensrisiko):**
- **Automatisierte Verhaltens-Verifikation** (eigener Headless-Edge-Testaufbau, temporär,
  nie ins Repo committet): 13 Prüfungen je Seite — Panel öffnet bei Toggle-Klick
  (`aria-expanded` synchron), initialer Fokus auf dem aktiven `.nav-item`, Tab-Trap
  vorwärts (letztes → erstes Element) UND rückwärts (Shift+Tab, erstes → letztes),
  Bereichswechsel-Klick (Ziel-View sichtbar, andere Views `hidden`, `aria-current`
  gesetzt, Panel schließt, Fokus auf die neue `<h2>`), Escape schließt das Panel und
  stellt den vorherigen Fokus wieder her, `PZ.gotoView` ist verfügbar. **Alle 13/13 grün
  auf Desktop, Mobil UND dem Standalone-Build.**
- **Gezielter `accessibility-expert`-Durchlauf** (nur auf die Nav-Stelle, kein Vollaudit,
  explizit vom Nutzer gefordert): Tab-Trap-DOM-Reihenfolge in beiden HTML-Dateien
  gegengeprüft (identisch: `navClose` → 6× `.nav-item` → `crossLink`), Escape erzeugt
  keinen Keyboard-Trap (WCAG 2.1.2), `aria-expanded`/Live-Region-Clear-then-delayed-set-
  Muster (WCAG 4.1.3) bestätigt korrekt, `crossLink`-IDs kollisionsfrei (je nur einmal im
  Markup), keine verwaisten Inline-Nav-Reste, alle 6 `[data-view]`-Bereiche haben ein
  `<h2>` für `focusView()`. **Keine Korrekturen nötig** — einzige Randnotiz: ein bereits
  vor v3.36.0 bestehender, rein kosmetischer Kommentar-Zahlendreher („die vier
  Bereichs-Buttons", tatsächlich inzwischen 6) wurde 1:1 wie im Original übernommen,
  bewusst nicht angefasst (außerhalb des angefragten Prüfbereichs, keine Regression durch
  diesen Zyklus).

**Tests:** `tests/test.html` unverändert (weder `js/nav.js` noch `js/ui.js` werden dort
geladen — reines DOM-Wiring, s. Abschnitt „Dateistruktur") — 614 Prüfungen weiterhin grün.

**Geändert:** `js/nav.js` (neu), `js/guide.js`, `js/i18n.js`, `js/party.js`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.54.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags inkl. der neuen
`js/nav.js`-Referenz), `appVersion`-Text in allen drei HTML-Dateien auf `v3.54.0`.
`pizza-rechner-mobile-standalone.html` neu gebaut. `Versionen/v3.54.0 - Gemeinsames
Nav-Modul/` enthält den vollständigen Schnappschuss.

## Zucker-/Öl-Legacy-Fallback entfernt (v3.53.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: „Auftrag A" aus einem
zweiteiligen Folgeauftrag (Auftrag B — gemeinsames Nav-Modul — folgt als eigener Zyklus direkt
im Anschluss, s. Abschnitt weiter oben sobald dort committet). Hintergrund: `applyState()`
(`js/storage.js`) enthielt seit Einführung von Öl (v3.3.0) bzw. Zucker (v3.19.2) je eine
Legacy-Fallback-Bedingung — `if (state.oil != null) set.oil(state.oil);` bzw. das Sugar-Pendant
—, die Rezepte abfing, die VOR diesen Versionen gespeichert wurden und die entsprechenden Felder
noch nicht kannten. Der Nutzer hat bestätigt: die App wird bisher ausschließlich von ihm selbst
genutzt, aktuell ist **kein einziges Rezept in `localStorage` gespeichert** — es gibt also keine
real existierenden alten Rezepte, die diesen Fallback je gebraucht hätten, und jedes künftig
gespeicherte Rezept enthält beide Felder ohnehin automatisch (`js/state.js` `PZ.state`-Defaults).

**Entfernt:** die beiden `if (state.oil != null)`/`if (state.sugar != null)`-Guards in
`applyState()` — `set.oil(state.oil)`/`set.sugar(state.sugar)` werden jetzt unconditional
aufgerufen, genau wie die übrigen Standardfelder (`balls`/`ballw`/`hyd`/`salt`) direkt daneben.

**Bewusst NICHT entfernt (Unterscheidung von normalem defensivem Programmieren, wie vom Nutzer
explizit verlangt):**
- Die **Robustheit gegen kaputte/unvollständige EXTERNE Importe** (Teilen-Link, Rezepte-Backup)
  bleibt vollständig erhalten — sie hängt gar nicht an den jetzt entfernten Guards, sondern an
  `set()` selbst (`js/ui.js` `link()`): `val = parseFloat(val); if (isNaN(val)) return;` fängt
  `null`/`undefined`/kaputte Werte unabhängig davon ab, ob `applyState()` den Aufruf bedingt
  oder unconditional macht. Verifiziert: `parseFloat(null)`/`parseFloat(undefined)` sind beide
  `NaN` → `set()` no-opt bereits dort, bevor überhaupt `state[key]` überschrieben würde.
- Das **strukturell identische Fallback-Muster für `state.flourTemp`** (vor v3.20.0, direkt
  darunter in derselben Funktion) — war explizit NICHT Teil dieses Auftrags (nur „Zucker-/
  Öl-Fallback" war benannt), bleibt unverändert bestehen. Nebenbefund für einen künftigen
  Zyklus: dieselbe Begründung (keine real existierenden alten Rezepte) träfe wahrscheinlich
  auch hier zu, aber ohne explizite Bestätigung nicht in diesem Zyklus mit entfernt.
- Der breitere Format-Migrationscode (`isLegacyState()`/`readStore()`, alter Einzel-Slot-Stand
  vor v3.10.0 → `{recipes:[...],activeId}`) — eine andere, umfassendere Migrationskategorie,
  ebenfalls nicht Teil dieses Auftrags.

**Härten:** keine UI-/Markup-Änderung (reine Logik-Vereinfachung in `js/storage.js`) — kein
`accessibility-expert`-Durchlauf nötig.

**Tests:** `tests/test.html` von **608 auf 614 Prüfungen** erweitert (kein separater
`test-generator`-Lauf — Fix eng umrissen, Testfall beim Umbau direkt bekannt). Neuer Test in
Sektion „16 · Speichern & Laden" (direkt neben dem bestehenden, unverändert bleibenden
flourTemp-Test): ein simuliertes Legacy-Rezept ohne `oil`/`sugar`-Felder lädt weiterhin ohne
Crash, beide Felder behalten korrekt ihren vorherigen UI-Wert (Object.assign kopiert nur
vorhandene Keys, überschreibt nicht mit `undefined`), `PZ.calc()` läuft anschließend fehlerfrei
mit gültigem `R.total`. Bestehender flourTemp-Test-Kommentar aktualisiert (verwies auf das jetzt
entfernte oil-Fallback als Vergleichsmuster — korrigiert, da sonst irreführend).

**Geändert:** `js/storage.js`, `tests/test.html`, `pizza-rechner-KONTEXT.md`. `?v=` auf `3.53.0`
gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in allen drei
HTML-Dateien auf `v3.53.0`. `pizza-rechner-mobile-standalone.html` neu gebaut.
`Versionen/v3.53.0 - Zucker-Oel-Legacy-Fallback entfernt/` enthält den vollständigen
Schnappschuss.

## Dynamisches theme-color-Meta & `.daybadge.d2`-Kontrastfix (v3.52.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: die zwei Nebenbefunde aus
dem v3.47.0-Dunkelmodus-Accessibility-Audit, die dort bewusst außerhalb des damaligen Scopes
belassen wurden (s. Abschnitt „Dunkelmodus (v3.47.0)" oben, dortiger Nebenbefund-Absatz).

**1. `theme-color`-Meta-Tag folgt jetzt dem aktiven Theme (`js/theme.js`,
`pizza-rechner-mobile.html`):** nur `pizza-rechner-mobile.html` hat dieses `<meta>` (Desktop
bewusst ohne, s. `pizza-rechner.html` `<head>`) — es steuerte bisher statisch die helle
Marken-Terrakotta-Farbe (`#c8442e`), blieb das auch im Dunkelmodus, obwohl der restliche
Bildschirm dann überwiegend sehr dunkel ist. **Fix:** neue Funktion `applyThemeColorMeta(theme)`
in `js/theme.js`, aufgerufen aus dem bereits zentralen `applyTheme(theme)` (läuft bei jedem
Theme-Wechsel — manueller Umschalter UND Live-Mitverfolgen der Systemeinstellung). Werte:
hell `#c8442e` (unverändert, matcht `--tomato`/Header-Branding), dunkel `#1c1815` (matcht
`--bg` im Dunkelmodus, s. `css/styles.css` `:root[data-theme="dark"]`). Zusätzlich im
`<head>`-Inline-Flash-Schutz-Script von `pizza-rechner-mobile.html` (läuft synchron VOR dem
ersten Bildaufbau, noch vor `js/theme.js` am Body-Ende) dieselbe Logik dupliziert, damit der
allererste Seitenaufbau (Cold Load im Dunkelmodus) korrekt startet, statt kurz falsch zu
blitzen und erst später von `js/theme.js` nachgezogen zu werden.

**2. `.daybadge.d2`-Kontrast behoben (`css/styles.css`):** die „Tag 2"-Badge (Mehrtage-Zeitplan
bei langer Kaltgare) hatte `background:#b5851a` mit weißer Schrift — rechnerisch nach der
WCAG-Relativluminanz-Formel nur **~3,32:1** (unter der 4,5:1-Schwelle für Fließtext, WCAG
1.4.3), exakt wie im Audit-Fund vermutet. **Fix:** `#8d6814` (dieselbe Farbe abgedunkelt),
rechnerisch **~5,09:1**. Theme-unabhängig: weder `--basil` (Grundfarbe von `.daybadge`) noch
dieser Wert werden im Dunkelmodus-Block überschrieben (bewusst, s. „Gesättigte
Marken-/Akzentfarben bleiben bewusst UNVERÄNDERT" in `css/styles.css`) — der Fix gilt daher
identisch für Hell- UND Dunkelmodus, keine zweite Anpassung nötig.

**Härten:** gezielter `accessibility-expert`-Durchlauf NUR auf diese beiden Stellen (nicht
Vollaudit) bestätigt beide Kontrastrechnungen unabhängig nach (3,32:1 alt / 5,09:1 neu für
`.daybadge.d2`) und prüfte zusätzlich die bisher nicht explizit betrachtete
UI-Komponentengrenze (WCAG 1.4.11, 3:1) der neuen Badge-Farbe gegen die Kartenfläche im
Dunkelmodus (`--card:#241f19`): **~3,21:1** — knapp, aber zuverlässig über der 3:1-Schwelle.
Für das `theme-color`-Meta bestätigt: reine Attribut-Manipulation ohne neues interaktives/
fokussierbares Markup, keine Screenreader-/Tastatur-Relevanz. Keine Korrekturen nötig, beide
Stellen waren bereits korrekt.

**Tests:** `tests/test.html` unverändert (weder `js/theme.js` noch `css/styles.css` werden dort
unit-getestet, s. Abschnitt „Dateistruktur" — CSS-Kontraste sind ohnehin kein
`tests/test.html`-Fall) — 608 Prüfungen weiterhin grün, keine Regression durch diesen rein
visuellen/Meta-Tag-Fix.

**Geändert:** `js/theme.js`, `css/styles.css`, `pizza-rechner-mobile.html`,
`pizza-rechner-KONTEXT.md`. `?v=` auf `3.52.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags), `appVersion`-Text in allen drei HTML-Dateien auf `v3.52.0`.
`pizza-rechner-mobile-standalone.html` neu gebaut (theme-color-Meta + Inline-Script-Änderung
werden dort mit inline gebaut) — gegengeprüft, dass Meta-Tag UND Inline-Script-Fix im
Standalone-Ergebnis korrekt ankommen. `Versionen/v3.52.0 - theme-color dynamisch und
daybadge-Kontrastfix/` enthält den vollständigen Schnappschuss.

## B8: letzter Kleinkram aus dem Fable-Review (toter Global, Docstring-Diskrepanz, Zahlenfeld-Clamping) (v3.51.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: die drei letzten,
unabhängigen Kleinfunde aus demselben separaten, rein lesenden Fable-Architektur-Review
(„B8"). Die übrigen B8-Punkte aus dem Report (Timer nur bei offenem Tab, Zucker-/Öl-Fallback
beim Laden alter Rezepte, duplizierte Nav-Inline-Scripts, theme-color-Meta,
`.daybadge.d2`-Kontrast) waren explizit NICHT Teil dieses Auftrags — teils bereits als
bewusste Design-Entscheidung dokumentiert, teils separat als eigener Auftrag nachgereicht
(s. Abschnitte weiter oben mit höheren Versionsnummern).

**1. Toter Global `PZ.PARTY_PRESET_PIZZAS` entfernt (`js/party.js`):** der Sprachwechsel-Hook
(`PZ.i18nOnChange(...)`, ganz am Dateiende) setzte `PZ.PARTY_PRESET_PIZZAS = getPresetPizzas();`
— das widersprach dem eigenen Kommentar direkt darüber im selben Modul („Bewusst KEIN
Modul-globaler Snapshot mehr … Aufrufer nutzen ausschließlich PZ.partyGetAllPizzas()").
Vor dem Entfernen geprüft: projektweite Suche (`js/*`, `*.html`, `pizza-rechner-KONTEXT.md`)
findet **keine einzige Lese-Stelle** von `PZ.PARTY_PRESET_PIZZAS` — der Aufruf war reiner,
funktional folgenloser Totcode (rief `getPresetPizzas()` nur für den Rückgabewert auf, der
dann nirgends gelesen wurde). Die eigentliche Neu-Darstellung bei Sprachwechsel passiert
bereits korrekt über `renderPartyList()`/`renderPartyResult()`, die `PZ.partyGetAllPizzas()`
bei jedem Aufruf frisch auswerten — diese beiden Zeilen bleiben unverändert im Hook stehen.

**2. `js/guide.js`-Docstring korrigiert (Diskrepanz zu `t()`):** der Datei-Kopfkommentar
behauptete, `t()` liefere bei fehlender `js/i18n.js` einen „deutschen Default" zurück —
tatsächlich gibt `function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }` in diesem
Fall den rohen i18n-**Key** zurück, keinen deutschen Text (anders als `js/schedule.js`s
`t(key, def)`, das echte, an jeder Aufrufstelle mitgegebene Fallback-Texte hat). Bewusst
**nicht** ans schedule.js-Muster angeglichen (die vom Nutzer explizit angebotene Alternative):
`guide.js` hat hunderte `t()`-Aufrufstellen mit interpolierten `{platzhaltern}` — ein echter
Text-Fallback je Key wäre unverhältnismäßiger Aufwand für einen Pfad, der in der Praxis nie
greift (i18n.js ist immer geladen, feste `<script>`-Reihenfolge in beiden HTML-Dateien).
Stattdessen den Docstring ehrlich auf das tatsächliche Verhalten korrigiert. Reine
Kommentar-Änderung, keine Logik.

**3. Zahlenfelder klemmen jetzt auf ihre `min`/`max`-Attribute (`js/ui.js`, `link()`):**
HTML-`min`/`max` verhindert nur das Ziehen des Sliders, nicht das Eintippen eines Werts im
gekoppelten `<input type="number">` — z. B. `balls = 500` oder `hyd = 5` flossen bisher
ungefiltert in `PZ.calc()` (kein Crash, aber unsinnige Ergebnisse ohne Warnung). Neue
`clampTo(el, val)`-Hilfsfunktion in `link()`: klemmt gegen die Grenzen des jeweils
**auslösenden** Elements — Slider-Input (`from === 's'`) gegen `s.min`/`s.max` (rein defensiv,
der Browser klemmt Range-Inputs beim Ziehen ohnehin schon selbst), Zahlenfeld-Input sowie
**programmatische** Aufrufe (Presets/Laden/Teilen-Link, `from` ist dort `undefined`) gegen
`n.min`/`n.max` — bewusst die **weiteren** der beiden gestaffelten Grenzen (Zahlenfelder sind
in fast allen Feldern absichtlich weiter gefasst als die Slider, z. B. `balls`: Slider 1–20,
Zahlenfeld 1–50 — das bleibt unverändert so, nur echte Ausreißer wie `500` oder `0` werden
abgefangen). **Nebenbefund beim Testen selbst gefunden und mitbehoben:** ohne Zusatzmaßnahme
hätte das geklemmte Zahlenfeld weiterhin den ungeklemmten getippten Wert anzeigen können
(bestehendes „Auslösendes Element nicht zurückschreiben"-Muster, das Cursor-Sprünge beim
Tippen vermeidet) — `state.balls` wäre z. B. korrekt auf 50 geklemmt gewesen, während das
Zahlenfeld weiter „500" gezeigt hätte. Fix: das auslösende Element wird jetzt IMMER
zurückgeschrieben, wenn der Wert tatsächlich geklemmt wurde (`wasClamped`-Flag), sonst bleibt
das bisherige Verhalten (kein Echo ins gerade getippte Feld) unverändert erhalten.

**Härten:** keine neue UI/kein neues Markup in diesem Zyklus (Clamping ist reine
Verhaltens-Härtung bestehender Felder) — kein `accessibility-expert`-, `mobile-optimizer`-
oder `performance-profiler`-Durchlauf nötig.

**Tests:** `js/ui.js` wird in `tests/test.html` bewusst nicht geladen (reines DOM-Wiring ohne
eigene Test-Sektion, s. Abschnitt „Dateistruktur" oben) — daher **keine** neue automatisierte
Prüfung dort (unverändert 608 Prüfungen, alle grün). Stattdessen mit einem isolierten,
temporären Verifikations-Aufbau geprüft (Kopie der 12 Slider/Zahlenfeld-Paare + `js/dom.js` +
`js/state.js` + `js/ui.js`, `PZ.calc` gestubbt, `PZ.i18n`/`PZ.t` bewusst fehlend): getippte
Werte weit über/unter den Zahlenfeld-Grenzen (`balls=500`→50, `hyd=5`→40, `balls=0`→1,
`room=-15`→0) klemmen korrekt, sowohl `state.<key>` als auch die Zahlenfeld-Anzeige stimmen
danach überein; Werte innerhalb der Grenzen (`hyd=65`) bleiben unverändert; ein Slider-Wert am
gemeinsamen Maximum (`ballw=400`, Slider- UND Zahlenfeld-Grenze) bleibt ebenfalls korrekt
synchron. Verifikations-Datei nach Gebrauch wieder gelöscht (war nie Teil des Repos).

**Geändert:** `js/party.js`, `js/guide.js`, `js/ui.js`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.51.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in allen
drei HTML-Dateien auf `v3.51.0`. `pizza-rechner-mobile-standalone.html` neu gebaut (die
geänderten `js/*`-Module werden dort inline mitgebaut). `Versionen/v3.51.0 - B8
Kleinkram-Aufraeumung/` enthält den vollständigen Schnappschuss.

## Doku-Nachtrag Dateibaum & drei Kleinkorrekturen aus dem Fable-Review (v3.50.0)

Direkter Nutzerauftrag (kein `/define-feature`), kein Backlog-Punkt: ein Doku-Nebenbefund aus
dem letzten Zyklus (v3.49.0) plus drei weitere diagnostische Funde aus demselben separaten,
rein lesenden Fable-Architektur-Review.

**Doku-Nachtrag — Dateibaum & Ladereihenfolge vollständig auf Ist-Stand gebracht:** der
Abschnitt „Dateistruktur" nannte 8 längst existierende Module nicht (`i18n.js`, `settings.js`,
`theme.js`, `newrecipe.js`, `share.js`, `party.js`, `glossary.js`, `pdf.js`). Dateibaum jetzt
vollständig mit allen 20 `js/*`-Modulen in der tatsächlichen `<script src>`-Reihenfolge (Referenz:
`pizza-rechner.html`/`pizza-rechner-mobile.html`, beide identisch), inkl. Kurzbeschreibung je
Modul. „Ladereihenfolge"-Zeile ebenfalls vervollständigt: `dom → state → i18n → settings → theme
→ flour → calc → schedule → guide → timer → ui → print → pdf → presets → storage → newrecipe →
share → party → glossary → main`. Zusätzlich dabei zwei weitere veraltete Werte in derselben
Nachbarschaft korrigiert (beim Lesen aufgefallen, nicht separat gemeldet): `tests/test.html`-Zeile
ergänzt um die 6 dort NICHT geladenen Module (`ui.js`, `timer.js`, `presets.js`, `newrecipe.js`,
`glossary.js`, `main.js`) statt nur der Kategorien-/Prüfungs-Anzahl; „**Cache-Busting:** … `?v=3.13.0`"
war ein weiteres veraltetes Beispiel (jetzt `?v=3.50.0`, wie der Rest der Datei).

**B5 (Prio 3) — veraltete Code-Kommentare korrigiert:** mehrere Kommentare behaupteten, `PZ.FLAGS`
fehle in `tests/test.html` bewusst, weil das Modul dort nicht geladen werde. Stimmt nicht mehr
(seit `js/settings.js` selbst dort geladen wird, s. `test.html:66` + die „alles an"-Baseline
`Object.assign(PZ.FLAGS, {...})` um `test.html:135`) — korrigiert in `js/guide.js` (zwei Stellen:
`timerBox()`-Kommentar, Freeze-Hint-Tipp-Kommentar), `js/print.js` (`printShoppingList()`),
`js/pdf.js` (`downloadGuidePDF()`). Bei `js/timer.js` war der Kern der Aussage weiterhin korrekt
(`js/timer.js` selbst wird in `tests/test.html` tatsächlich nicht geladen, Browser-APIs), nur die
Begründung („PZ.FLAGS fehlt") war irreführend — auf „js/timer.js wird nicht geladen, PZ.FLAGS
selbst aber schon" präzisiert. Zusätzlich `js/settings.js:29–31` korrigiert: die Behauptung, das
„New York Style"-Preset schalte das Flag „automatisch (persistiert)" an, wurde bereits in
v3.19.3/v3.20.1 bewusst entfernt (Regler blendet nur ein, solange das Preset aktiv gewählt ist,
unabhängig vom Flag-Zustand) — `js/presets.js:94–103` beschrieb das schon korrekt, jetzt auch der
Kommentar in `js/settings.js`. Zusätzlich den Datei-Kopfkommentar in `js/settings.js` (Zeile 8–12)
mitkorrigiert (identische veraltete Behauptung, nicht separat in der Fund-Liste, aber direkt
danebenstehend und offensichtlich derselbe Fehler). Reine Kommentar-Änderung, keine Logik.

**B6 (Prio 3) — `state.knead`: Typ-Inkonsistenz Number vs. String behoben:** `js/state.js` setzte
den Default `knead: 3` als **Number**, während `js/ui.js` (Segment-Klick, `dataset`-Werte sind
immer Strings), `js/presets.js` (`String(p.knead)`) und `js/newrecipe.js` (`knead: '3'`) durchweg
**String** liefern. `js/guide.js` vergleicht an mehreren Stellen strikt mit `state.knead === '6'`
— im Normalbetrieb harmlos (der einzige Number-Fall war der ungenutzte Default), aber ein per
Teilen-Link oder Rezepte-Backup-Import eingeschleustes `{ knead: 6 }` (Number, da `share.js`/
`importRecipes()` Typen nicht validieren) hätte in `js/calc.js` (typtolerantes `parseFloat`)
korrekt als „Maschine" (6 °C Reibungswärme) gerechnet, in `js/guide.js` aber weiterhin fälschlich
„Hand"-Anleitungstext gezeigt. **Fix:** `state.knead` konsequent als String geführt — Default in
`js/state.js` auf `'3'` geändert, und in `storage.js`s zentraler `applyState(o)`-Funktion (einziger
Ort, über den sowohl `js/storage.js` selbst als auch `js/share.js` — via `PZ.applyState(state)` —
jedes von außen kommende state-Objekt anwenden) direkt nach `Object.assign(state, o)` eine
defensive Normalisierung ergänzt: `if (state.knead != null) state.knead = String(state.knead);`.
Ein einziger Normalisierungspunkt deckt damit alle Importwege ab (Laden, Rezept wechseln,
Teilen-Link, Backup-Import), ohne jede Quelle einzeln anzufassen.

**B7 (Prio 3) — `setPdfMsg()` ohne Generation-Zähler behoben:** als einzige Live-Region-Meldung im
Projekt nutzte `js/pdf.js`s `setPdfMsg()` noch nicht das sonst etablierte Clear-then-delayed-set-
mit-Generation-Zähler-Muster (`share.js:copyShareLink()`, `main.js`, `party.js`, `newrecipe.js`,
`theme.js`). Bei einem schnellen Doppelklick auf „Als PDF speichern" (z. B. erst „nicht
berechnet"-Hinweis, dann sofort die Erfolgsmeldung) konnte der ältere, verzögerte `setTimeout`
die neuere Meldung nachträglich wieder überschreiben. **Fix:** modul-weiter `pdfMsgGen`-Zähler,
bei jedem Aufruf erhöht; der verzögerte `el.textContent = msg`-Schreibvorgang greift nur noch,
wenn `gen === pdfMsgGen` weiterhin gilt (kein neuerer Aufruf dazwischen war). Identisches Muster
wie die übrigen Live-Region-Fixes im Projekt, keine Verhaltensänderung im Normalfall (einzelner
Klick).

**Härten:** keine UI-/Markup-Änderung in diesem Zyklus (nur `js/*`-Logik + Kommentare + Doku) —
kein `accessibility-expert`- oder `mobile-optimizer`-Durchlauf nötig, kein gemeldeter Ruckler
also auch kein `performance-profiler`-Anlass.

**Tests:** `tests/test.html` von **605 auf 608 Prüfungen** erweitert (kein separater
`test-generator`-Lauf — B6 ist eng umrissen und synchron testbar, kein Timing-Verhalten wie B7).
Neue Sektion in „16 · Speichern & Laden": Regressionsanker für B6 — ein über `localStorage`
simuliertes, von außen eingeschleustes Rezept mit `knead: 6` (Number statt String) wird nach
`PZ.load()` korrekt zu `PZ.state.knead === '6'` (String) normalisiert, `PZ.R.wT` bleibt eine
gültige Zahl. B7 (Timing-/Live-Region-Verhalten) bekam bewusst **keinen** neuen automatisierten
Test, analog zu den bisherigen Live-Region-Fixes im Projekt (`share.js`/`party.js`/`newrecipe.js`
haben ebenfalls keine test.html-Abdeckung für ihr Generation-Zähler-Timing) — Verifikation per
Codelesung (identisches, bereits etabliertes Muster 1:1 übertragen).

**Verifikation:** Headless-Edge-Dump von `pizza-rechner.html` nach dem `state.js`-Default-Wechsel
(`knead: '3'`) bestätigt: Segment „Hand" bleibt korrekt als `class="active"`/`aria-pressed="true"`
vorausgewählt (`data-k="3"`), `#waterTemp` zeigt weiterhin korrekt `27` (Default-DDT-Werte,
unverändert) — keine Regression durch den Typ-Wechsel.

**Geändert:** `js/state.js`, `js/storage.js`, `js/guide.js`, `js/print.js`, `js/pdf.js`,
`js/timer.js`, `js/settings.js`, `tests/test.html`, `pizza-rechner-KONTEXT.md`. `?v=` auf
`3.50.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in allen
drei HTML-Dateien auf `v3.50.0`. `pizza-rechner-mobile-standalone.html` neu gebaut (die
geänderten `js/*`-Module werden dort inline mitgebaut, obwohl `pizza-rechner-mobile.html` selbst
in diesem Zyklus nicht angefasst wurde). `Versionen/v3.50.0 - Dateibaum-Nachtrag und
Fable-Review-Kleinkorrekturen/` enthält den vollständigen Schnappschuss.

## Kleinkorrekturen: Versionsnummer im Menü nachgezogen & KONTEXT.md-Schnellreferenz aktualisiert (v3.49.0)

Zwei weitere Funde aus demselben separaten, rein lesenden Architektur-/Bug-Review (Fable-Modell),
das bereits die v3.48.0-Bugfixes lieferte. Beide klein/eindeutig, kein `/define-feature` nötig,
direkt umgesetzt.

**B3 (Prio 2) — Sichtbare Versionsnummer im Menü nicht mitgezogen:** `pizza-rechner.html`,
`pizza-rechner-mobile.html` und `pizza-rechner-mobile-standalone.html` zeigten trotz zwei
Releases seither (v3.47.0 Dunkelmodus, v3.48.0 Bugfixes) noch `v3.46.0` im
`<span class="nav-version" id="appVersion">` — der Text war beim Versionssprung schlicht
vergessen worden. **Fix:** Text in allen drei Dateien auf `v3.49.0` gezogen (Desktop + Mobil
händisch, Standalone automatisch über `python build-mobile-standalone.py`, da sie aus
`pizza-rechner-mobile.html` gebaut wird). Gegengeprüft: `grep` auf `id="appVersion"` in allen
drei Dateien liefert übereinstimmend `v3.49.0`. `?v=` in beiden Quell-HTML-Dateien ebenfalls auf
`3.49.0` gezogen (war zuvor schon korrekt bei `3.48.0`, folgt jetzt derselben Version).

**B4 (Prio 3) — KONTEXT.md-Schnellreferenz „Wichtige Berechnungs-Details" veraltet:** reine
Doku-Korrektur, kein Code betroffen. Vier Stellen in den Abschnitten „Dateistruktur", „Wichtige
Berechnungs-Details" und „Entwicklungsweise / Mitarbeit" korrigiert:
- DDT-Formel stand noch als `wT = ddt×3 − room − room − friction` (Mehltemp = Raumtemp
  angenommen) — das war seit **v3.20.0** überholt, seither ist Mehltemperatur ein eigener Regler
  (`flourTemp`). Jetzt: `wT = ddt×3 − room − flourTemp − friction`. Der ausführliche
  v3.20.0-Abschnitt weiter oben in derselben Datei beschrieb es bereits korrekt — nur diese
  Kompakt-Referenz widersprach dem Code.
- „293 Prüfungen in 16 Kategorien" (Dateistruktur-Dateibaum) → **605 Prüfungen in 24
  Kategorien** (per Headless-Edge-Dump von `tests/test.html` verifizierter Ist-Stand vor diesem
  Zyklus). Dieselbe veraltete Zahl in der „Entwicklungsweise"-Sektion „Tests:" bekam einen
  klarstellenden Zusatz statt einer stillschweigenden Umschreibung: die ausführliche Prosa dort
  beschreibt weiterhin explizit den historischen Aufbau bis v3.12.0 (293 Prüfungen), mit einem
  Verweis, dass die späteren Kategorien 17–24 in der Versions-Historie dokumentiert sind statt
  hier erneut ausformuliert zu werden — verhindert, dass „605 Prüfungen in 24 Kategorien" gefolgt
  von einer Beschreibung mit nur 16 Kategorien widersprüchlich wirkt.
- Dateibaum zeigte `pizza-rechner.html ... (?v=3.5.0)` als veralteten Beispielwert im Kommentar
  → auf `?v=3.49.0` gezogen.
- „Sichtbare Versionsnummer (seit v3.7.1): Im `<footer>`" → korrigiert auf „seit v3.46.0 im Menü
  (`.nav-panel`)" statt Footer, inkl. Hinweis, bei jedem Versionssprung alle drei HTML-Dateien
  gegenzuprüfen (nicht nur die beiden Quelldateien).

**Nebenbefund (nicht behoben, außerhalb des angefragten Scopes):** die „Ladereihenfolge"-Zeile
direkt unter dem Dateistruktur-Dateibaum (`dom → state → flour → calc → schedule → guide → timer
→ ui → print → presets → storage → main`) und der Dateibaum selbst nennen weder `i18n.js`,
`settings.js`, `theme.js`, `newrecipe.js`, `share.js`, `party.js`, `glossary.js` noch `pdf.js` —
alle acht existieren längst (s. `<script>`-Tags in `pizza-rechner.html`), wurden aber nie in
diese Übersicht nachgetragen. Größerer Umfang als B3/B4 (vollständige Dateibaum-Überarbeitung),
daher hier nur dokumentiert statt im selben Zyklus mitgezogen — Kandidat für einen künftigen
reinen Doku-Pflege-Zyklus.

**Härten:** keine Logik-/Markup-Änderung (nur Text-/Doku-Korrektur), daher kein
`accessibility-expert`- oder `test-generator`-Durchlauf nötig. `tests/test.html` unverändert
grün geprüft (605 Prüfungen), da B3/B4 keine der getesteten Dateien (`js/calc.js`,
`js/schedule.js`, `js/guide.js`, `js/print.js`, `js/storage.js` usw.) berühren.

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`, `pizza-rechner-KONTEXT.md`.
`?v=` auf `3.49.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags), `appVersion`-Text in
allen drei HTML-Dateien auf `v3.49.0`. `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`). `Versionen/v3.49.0 - Versionsnummer im Menue nachgezogen
und KONTEXT-Schnellreferenz aktualisiert/` enthält den vollständigen Schnappschuss.

## Bugfixes: Eismenge bei Vorteig & fehlende Zucker-Zeile in der Einkaufsliste (v3.48.0)

Direkter Nutzerauftrag (kein `/define-feature`, kein Backlog-Punkt) — zwei klar diagnostizierte
Bugfixes aus einem separaten, rein lesenden Architektur-/Bug-Review (Fable-Modell). Beide
gegen diese Kontext-Datei abgeglichen: keine bewusste Design-Entscheidung, echte Fehler.

**Bug 1 (Prio 1) — Eismenge ignorierte die Vorteig-Aufteilung (`js/calc.js`):** Die Eismenge
wurde bisher immer gegen die GESAMTE Wassermenge (`M = water`) berechnet. Bei Biga/Poolish
wird aber nur das Hauptteig-Restwasser (`mWater`) tatsächlich gekühlt — das Vorteig-Wasser ist
laut eigener Anleitung (`guide.step.prefWeigh.tip`) bewusst zimmerwarm und Stunden vorher schon
verbraucht. Folge: bei hohem Vorteig-Anteil konnte `ice` weit über `mWater` hinausgehen (Beispiel
Biga pref 100 %/bhyd 45 %: `mWater` nur ~31 % der Gesamtwassermenge, Eis wurde aber gegen 100 %
gerechnet — ~84 g statt korrekt ~26 g bei den im Bugfix-Auftrag genannten Testbedingungen).
Extremfall Poolish-Preset „napoli_poolish" (pref 66 bei hyd 66): `mWater` ist **exakt 0** (das
gesamte Wasser steckt im Poolish), der Wassertemperatur-Anleitungsschritt entfiel dort zwar
bereits korrekt (`hasMW`-Guard in `js/guide.js`, unverändert), aber das Ergebnis-Panel zeigte
trotzdem weiterhin „Nimm X g Leitungswasser + Y g Eis" — widersinnig ohne Hauptteig-Schüttwasser.
- **Fix:** `const M = water` → `const M = mWater;` in der Eisberechnung. Da `mWater` bei
  `method:'direct'` unverändert gleich `water` ist (Initialisierung `let ... mWater = water`
  ganz oben in `calc()`, nur der Vorteig-Zweig überschreibt sie), war **kein** Sonderfall für
  `direct` nötig — eine einzige Variable ersetzt, alle bestehenden Direkt-Tests bleiben unberührt.
- **Neuer Grenzfall-Guard:** `hasMixingWater = mWater >= 1` (derselbe Schwellwert wie das
  bestehende `hasMW` in `js/guide.js`, für Konsistenz zwischen Anleitung und Ergebnis-Panel).
  Ist er `false`, zeigt `#iceNote` die neue Erklär-Notiz (`calc.noMixingWaterNote`, neuer
  i18n-Key) statt einer widersinnigen Mengenangabe, und der komplette Wassertemperatur-Block
  (`<div class="stage" id="tempStage">`, neue ID in beiden HTML-Dateien) wird per
  `style.display='none'` ausgeblendet — analog zum bestehenden Öl-/Zucker-Zeilen-Muster
  (`gOilRow`/`gSugarRow`). Bei jedem `calc()`-Lauf neu aus `hasMixingWater` abgeleitet, kein
  dauerhafter Zustand.
- **Bewusst NICHT geändert:** `js/guide.js` (der `hasMW`-Guard dort war schon korrekt, nutzte
  bereits `mWater` für die Anleitungstext-Menge — nur die Eis-MENGE selbst kam fehlerhaft aus
  `calc.js`/`R.ice`, was jetzt automatisch mit repariert ist, da `guide.js` `R.ice` unverändert
  weiterverwendet). `js/schedule.js` unangetastet (Zeitplan-Logik unabhängig von Wassermengen).

**Bug 2 (Prio 2) — Einkaufsliste vergaß den Zucker (`js/print.js`):** `buildShoppingList()`
listete Mehl, Wasser, Salz, Hefe, Öl, Eis — aber keinen Zucker. Beim „New York Style"-Preset
(2 % Zucker) fehlte eine echte Rezeptzutat auf der Einkaufsliste, obwohl sie im Ergebnis-Panel
(`#gSugarRow`) korrekt erschien. **Fix:** neue Zucker-Zeile analog zur bestehenden Öl-Zeile
(`R.sugar >= 0.05`-Schwellwert, 1 Nachkommastelle, direkt nach Öl — dieselbe Reihenfolge wie im
Ergebnis-Panel), neuer i18n-Key `print.sugar`.

**Härten:** Kein dedizierter `accessibility-expert`-Durchlauf — bewusst als nicht nötig
eingeschätzt (gezielt statt routinemäßig, s. Zyklus-Regeln): die einzige Markup-Änderung ist
die neue `id="tempStage"` auf einem bereits bestehenden `<div class="stage">`, versteckt per
`display:none` nach demselben, bereits etablierten und unauffälligen Muster wie
`gOilRow`/`gSugarRow`/`mOilRow`/`mSugarRow` (keine neuen interaktiven Elemente, kein Fokus-Ziel
im versteckten Bereich, keine neue ARIA-/Kontrast-Fläche). `#iceNote` war schon vor diesem Fix
eine reine, bei jedem `calc()`-Lauf aktualisierte Text-Div ohne Live-Region (bewusst, wie die
übrigen kontinuierlich Slider-getriebenen Ergebnis-Panel-Werte) — der neue Notiz-Text ändert
daran nichts. Beide neuen i18n-Keys (`calc.noMixingWaterNote`, `print.sugar`) vollständig
DE+EN gepflegt.

**Tests:** `tests/test.html` von **593 auf 605 Prüfungen** erweitert (kein separater
`test-generator`-Lauf — Tests direkt selbst ergänzt, da der Fix eng umrissen und die nötigen
Testfälle beim Debugging bereits exakt bekannt waren):
- Sektion „2 · Wassertemperatur & Eismenge": Regressionsanker Biga pref 100 %/bhyd 45 % (Eis
  jetzt ~26 g statt der alten ~84 g, plus explizite „< 50 g"-Kontrollgrenze gegen den alten
  Bug-Wert), Extremfall Poolish-Preset (mWater exakt 0, neue Notiz statt Mengenangabe,
  `#tempStage` ausgeblendet), Gegenprobe dass `#tempStage` bei normalem Rezept wieder erscheint.
- Sektion „15 · Einkaufsliste": Zucker-Zeile erscheint bei 2 % (New-York-Style-artig) mit
  1 Nachkommastelle, fehlt korrekt bei 0 %.
Alle bestehenden Tests (inkl. Masseerhaltung, Direkt/Biga/Poolish-Kombinationen) unverändert
grün — die Bäckerprozent-Mengen (`R.flour`/`R.water`/`R.salt`/`R.yeast`/`R.total`) sind von
diesem Fix nicht betroffen, nur `R.ice` und der Anzeige-Text.

**Verifikation:** Zusätzlich per Headless-Edge-Screenshot gegen die echte App geprüft (nicht
nur die Testsuite) — Poolish-Extremfall-Preset zeigt „+ Wasser 0 g" im Hauptteig UND der
komplette Wassertemperatur-Block verschwindet vollständig aus dem Ergebnis-Panel; Biga-Fall
mit erzwungenen kalten Bedingungen zeigt exakt „26 g Eis" (vorher wären es ~84 g gewesen);
New-York-Style-Preset zeigt „Zucker 14,1 g" korrekt im Ergebnis-Panel (Kontrollcheck für
`R.sugar`, das `js/print.js` unverändert übernimmt).

**Geändert:** `js/calc.js`, `js/print.js`, `js/i18n.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.48.0` gezogen (Desktop + Mobil,
alle `<link>`/`<script>`-Tags). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`). `Versionen/v3.48.0 - Bugfixes Eis-Vorteig und
Einkaufsliste-Zucker/` enthält den vollständigen Schnappschuss.

## Dunkelmodus (v3.47.0)

Direkter Nutzerauftrag per `/define-feature` (kein Backlog-Punkt). Ein dunkles Farbschema
für Desktop- und Mobil-Ansicht, das standardmäßig automatisch der Systemeinstellung
(`prefers-color-scheme`) folgt, mit manuellem Umschalter in den Einstellungen zum
Überschreiben. **Rein visuelle Erweiterung — keine Änderung an Layout/Struktur, nur
Farbwerte; keine Änderung an Berechnungslogik** (`js/calc.js`, `js/schedule.js`
unangetastet).

**1. Technik — `data-theme`-Attribut auf `<html>`, kein Klassen-Toggle:** Ein kleines
Inline-Script ganz am Anfang von `<head>` (VOR dem CSS-Link, identisch in
`pizza-rechner.html` UND `pizza-rechner-mobile.html`) liest `localStorage.getItem
('pizzaTheme')`; ist dort `"light"`/`"dark"` gespeichert, gewinnt das, sonst entscheidet
`matchMedia('(prefers-color-scheme: dark)')`. Das Ergebnis wird sofort als
`data-theme="light"/"dark"` auf `<html>` gesetzt — **vor dem ersten Bildaufbau**, verhindert
einen kurzen Hell/Dunkel-Flash beim Laden (FOUC). `js/theme.js` (neu, am Ende von `<body>`
wie alle anderen Module) übernimmt diesen bereits gesetzten Wert als Ausgangspunkt (keine
zweite, potenziell abweichende Erkennung) und ist zuständig für: (a) den manuellen
Umschalter in den Einstellungen, (b) Live-Mitverfolgen der Systemeinstellung per
`matchMedia(...).addEventListener('change', ...)`, SOLANGE noch keine manuelle Wahl
gespeichert ist (wechselt der Nutzer während einer offenen Session das System-Theme,
zieht die App live mit).

**2. Persistenz — identisches Muster wie die Sprachwahl (`js/i18n.js`, `LANG_KEY`):**
eigener `localStorage`-Key `"pizzaTheme"`, komplett getrennt vom Rezept-Speicher
(`pizzaRechner`) und den Feature-Flags (`pizzaRechnerFeatureFlags`). „Noch nie manuell
gewählt" (kein Key vorhanden) ist von „explizit gewählt" unterscheidbar — nur im
erstgenannten Fall greift die Systemerkennung überhaupt, danach übersteuert die manuelle
Wahl dauerhaft. `PZ._resolveInitialTheme(stored, prefersDark)` ist die reine
Entscheidungsfunktion (für Tests exponiert, analog `PZ._mergeFlags`), `PZ.setTheme()`/
`PZ.getTheme()` die öffentliche API.

**3. Neue CSS-Variablen (`css/styles.css`, `:root{}` + `:root[data-theme="dark"]` unter
`@media screen`):** Bestehende Basis-Tokens (`--bg`, `--card`, `--ink`, `--muted`,
`--line`, `--shadow`) werden im Dunkelmodus komplett neu belegt. Zusätzlich neue
semantische Tokens für Fälle, in denen dieselbe Farbe zwei unterschiedliche Rollen hatte,
die sich im Dunkelmodus GEGENSÄTZLICH verhalten müssen:
- `--tomato-text`/`--basil-text`: vorher wurde `var(--tomato)`/`var(--tomato-dark)`/
  `var(--basil)` direkt sowohl als gesättigte Button-/Badge-**Füllfläche mit weißer
  Schrift** (bleibt im Dunkelmodus unverändert gut lesbar) ALS AUCH als reiner **Text auf
  der Karten-/Seitenfläche** verwendet (`.field label .val`, `.temp-box .v`,
  `.nav-item.active`, `.timerclock`, `.stage h3`, Fokusringe u. a.) — Letzteres fiel im
  Dunkelmodus unter 4,5:1 (`--tomato-dark` `#a8341f` nur ~2,4–2,7:1 auf dunklem Grund).
  Light-Default = alter Wert (keine optische Änderung im hellen Modus), Dark-Override
  `#ef7a5c`/`#6fbb6f` (~5,9–7,0:1 gegen die neuen dunklen Flächen).
- `--ink-strong` (theme-**unabhängig**, `#2b2420` in beiden Themes): `.step .num` und
  `.step .body .timechip` nutzten `background:var(--ink)` als fest dunkle Badge-Fläche mit
  weißer Schrift — da `var(--ink)` im Dunkelmodus aber die (dann HELLE) Textfarbe ist,
  wäre die weiße Schrift auf hellem Grund verschwunden. Eigener, nie themenabhängiger
  Token behebt das.
- `--note-bg`/`--note-text`/`--note-text-strong`, `--chip-bg`/`--chip-text`,
  `--warn-bg`/`--warn-text`, `--tip-bg`, `--temp-highlight-bg`, `--step-text`,
  `--biga-text`: ersetzen zuvor hartkodierte Hex-Farben (`.note`, `.step .body .chip`,
  `.step .body .warn`, `.step .body .tip`, `.temp-box:first-child`, `.step .body p`,
  `.stage.biga h3`) — jeweils Light-Default = alter Hex-Wert, Dark-Override neu berechnet.
- Gesättigte Marken-Flächen (`--tomato`, `--tomato-dark`, `--basil`, `--crust`) bleiben
  bewusst **unverändert** zwischen den Themes — sie dienen weiterhin fast ausschließlich
  als Flächenfarbe mit weißer Schrift (Buttons, Badges, Header-/Quickbar-Chrome) und
  funktionieren darin themenunabhängig gleich gut.
- Reine `#fff`-Hintergründe, die eigentlich „Karten-/Formular-Oberfläche" bedeuten
  (`.nav-close`, `.party-qty-btn`, `.party-delete-btn`, `.party-ing-remove`, `.selectbox`,
  `.pills button`, `.actions button`, `.timerbtn`/`.timerbtn-alt`, `.info-btn`,
  `input[type=number]` — Letzteres hatte vorher gar kein explizites `background`) wurden
  auf `var(--card)` umgestellt. Bewusst **unverändert weiß** blieben der Ring um den
  Slider-Thumb (`border:3px solid #fff`) und der Toggle-Switch-Knopf
  (`.switch-slider::before{background:#fff}`) — beides Bedienelement-Indikatoren, die in
  beiden Themes als heller Punkt sichtbar bleiben sollen, kein Kartenflächen-Bezug.
- `color-scheme:light`/`color-scheme:dark` gesetzt (steuert native Formularelemente/
  Scrollbars passend zum Theme).
- Der komplette Dark-Override-Block sitzt in `@media screen` — beim Drucken gelten
  automatisch wieder die hellen `:root`-Defaultwerte, unabhängig vom `data-theme`-Attribut
  (zusätzlich erzwingt `@media print{body{background:#fff}}` weiterhin Weiß).

**4. `css/mobile.css`:** zwei kleine Anpassungen auf dieselben neuen Tokens
(`.nav-close`-Hintergrund → `var(--card)`, `.nav-item.active`-Textfarbe →
`var(--tomato-text)`) — der Rest (Quickbar, Foto-Header, Nav-Toggle) bleibt bewusst
unverändert (feste, immer terrakottafarbene Chrome-Elemente, kein Kartenflächen-Bezug).

**5. Neuer Umschalter „Darstellung" im Einstellungen-Menü:** `.seg`-Segmented-Control
`#themeSwitch` mit zwei Buttons (`data-theme-choice="light"/"dark"`, Label „Hell"/„Dunkel"),
strukturell 1:1 identisch zum etablierten Sprachumschalter `#langSwitch` (gleiche
`role="group"`/`aria-labelledby`/`aria-pressed`/Info-Button/Live-Region-Struktur), direkt
darunter platziert — in BEIDEN HTML-Dateien. Neue i18n-Keys (`js/i18n.js`):
`flag.theme.name/infoBtn/info`, `theme.light`, `theme.dark`, `theme.announce`.
Live-Region `#themeAnnounce` nutzt das etablierte Clear-then-delayed-set-Muster
(Generation-Zähler, WCAG 4.1.3) wie `#langAnnounce`.

**Härten (gezielter `accessibility-expert`-Audit, synchron):** keine Blocker/Major-Funde.
ARIA/Semantik des neuen Umschalters bestätigt korrekt (identisch zu `#langSwitch`),
Kontrastwerte stichprobenartig nachgerechnet und bestätigt (`--tomato-text`/`--basil-text`
sowie alle neuen Callout-Tokens deutlich über 4,5:1, Fokusringe über 3:1), Print-Isolation
bestätigt (kein Dunkelmodus-Leck in Druck/PDF-Export), `data-theme`-Technik aus
Screenreader-Sicht unproblematisch (reines Presentation-Attribut). Zwei Minor-Funde nur
dokumentiert, nicht gefixt (außerhalb des Feature-Scopes): `<meta name="theme-color">` auf
Mobil bleibt statisch terrakottafarben (wechselt nicht mit dem Theme — rein kosmetisch,
kein WCAG-Kriterium); `.daybadge.d2` (fest `#b5851a` mit weißer Schrift, ~3,32:1) ist ein
vorbestehender, themenunabhängiger Kontrastfund, unabhängig von diesem Feature.

**Verifikation:** Da das Preview-Tool in diesem Projekt unzuverlässig ist, per
Headless-Edge-Screenshot geprüft (Desktop hell/dunkel inkl. Anleitung/Einstellungen-Ansicht,
Mobil dunkel) — Kartenflächen, Ergebnis-Panel, Anleitungs-Steps (Chips/Tipp-/Warnboxen/
Timer-Badges), Einstellungen-Umschalter (inkl. korrekt reflektiertem aktivem Zustand) alle
mit gutem Kontrast bestätigt. Auto-Erkennung real per `matchMedia` verifiziert (Testmaschine
hat System-Dunkelmodus aktiv, App folgte dem korrekt ohne gespeicherten Override).

**Tests:** `tests/test.html` von **577 auf 593 Prüfungen** erweitert (neue Sektion
„24 · Dunkelmodus (js/theme.js)": `PZ._resolveInitialTheme()`, `setTheme()`/`getTheme()`
inkl. Persistenz, ungültige Werte werden ignoriert, `#themeSwitch`-Stub spiegelt den
Zustand über `PZ.setTheme()` korrekt in `aria-pressed`/`.active`). **Wichtige Erkenntnis
beim Testen:** ein ursprünglich per simuliertem `button.click()` geschriebener DOM-Test
schlug fehl, weil `wireThemeSwitch()` an `DOMContentLoaded` hängt — das im synchron
WÄHREND des HTML-Parsings laufenden Test-Inline-Script von `test.html` zum Testzeitpunkt
noch nicht gefeuert hat (identischer, bereits in Sektion 23 dokumentierter Timing-Grund,
weshalb `#langSwitch` dort ebenfalls nicht per simuliertem Klick, sondern nur über die
zugrunde liegende `PZ.setLang()`-API getestet wird). Fix: Test treibt die Zustandsänderung
über `PZ.setTheme()` statt `.click()` — reflectSwitch() läuft so garantiert synchron mit,
unabhängig von der Klick-Verdrahtung. Click-Verdrahtung selbst bleibt entsprechend
ungetestet, analog zu `#langSwitch`/`#langAnnounce`.

**Geändert:** `css/styles.css`, `css/mobile.css`, `js/theme.js` (neu), `js/i18n.js`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.47.0`
gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.47.0 - Dunkelmodus/` enthält den vollständigen Schnappschuss.

## Versionsnummer nur im Menü statt im Footer (v3.46.0)

Direkter Nutzerauftrag per `/define-feature` (kein Backlog-Punkt, direkt im Anschluss
an den Icon-Zentrierung-Zyklus v3.45.0 nachgeschoben). Motivation: `#appVersion` stand
bisher in einem dauerhaft sichtbaren `<footer>` auf jeder Seite/Ansicht — für den
normalen Gebrauch nicht relevant, reicht bei geöffnetem Burgermenü. **Reine
Markup-/CSS-Verschiebung, keine Änderung an der Versionsnummer-Pflege selbst**
(weiterhin manuell bei jedem Release hochgezählt, kein `js/*`-Eingriff).

**1. Versionsnummer ins Menü verschoben:** `<span id="appVersion">` wandert aus dem
`<footer>` in beide `.nav-panel`-Dialoge (`<nav id="navMenu">`), als letztes
Kind-Element nach dem bestehenden `.nav-link` („Zur Mobil-Ansicht"/„Zur
Desktop-Ansicht"): `<span class="nav-version" id="appVersion">v3.46.0</span>`.
Neue Regel `.nav-version{margin-top:auto;padding:14px 14px 2px;font-size:11.5px;
color:var(--muted);}` in `css/styles.css` (gilt gemeinsam für Desktop + Mobil) —
`margin-top:auto` schiebt sie im flex-column `.nav-panel` unabhängig von der Höhe der
Liste darüber ans untere Ende (per Screenshot mit erzwungen offenem Menü verifiziert,
sowohl Desktop als auch Mobil).

**2. `<footer>`-Elemente bleiben bestehen, sind aber jetzt leer:** Desktop
`<footer aria-hidden="true"></footer>`, Mobil `<footer style="padding-bottom:
calc(84px + env(safe-area-inset-bottom));" aria-hidden="true"></footer>` — die
Mobil-Padding-Angabe bleibt bewusst erhalten (dient als Scroll-Puffer, damit die
fixierte Sticky-Quickbar den letzten Karteninhalt nicht verdeckt, hat nichts mit der
Versionsnummer zu tun). In `css/mobile.css` wurde die dadurch gegenstandslose Regel
`footer{text-align:right;}` samt Kommentar entfernt (nichts mehr auszurichten).

**Härten (gezielter `accessibility-expert`-Audit, synchron) — zwei echte Funde,
beide selbst durch den Audit-Agenten behoben:**
- **Major (WCAG 1.4.3):** `.nav-version` kombinierte `color:var(--muted)` zusätzlich
  mit `opacity:.7` (Übernahme aus dem alten `style="opacity:.7"` am Footer-Span) —
  auf dem hellen `.nav-panel`-Hintergrund nur **~3,07:1**, unter der 4,5:1-Schwelle.
  **Exakt derselbe Fehler wie bereits einmal bei `.quickbar .qb-jump small` in
  v3.41.0** (dort ebenfalls durch Entfernen der `opacity` behoben) — offenbar ein
  wiederkehrendes Muster bei Muted+Opacity-Kombinationen, künftig direkt vermeiden.
  Fix: `opacity:.7` aus `.nav-version` entfernt, `var(--muted)` allein liegt auf Weiß
  bei ~5,84:1.
- **Minor (Landmark-Best-Practice):** Die jetzt leeren `<footer>`-Elemente mappen als
  direktes `<body>`-Kind auf die implizite `contentinfo`-Landmark-Rolle — für
  Screenreader-Nutzer mit Landmark-Navigation eine Sackgasse ohne Inhalt. Kein harter
  WCAG-SC-Blocker, trotzdem behoben: `aria-hidden="true"` auf beide leeren
  `<footer>`-Elemente ergänzt (Padding-/Print-Regeln unangetastet, `@media print{...
  footer{display:none}}` bleibt über den Tag-Selektor weiterhin wirksam).
- **Kein Fund:** `.nav-version` als reines `<span>` (kein `tabindex`, nicht im
  Tab-Trap-Fokusarray `js/ui.js`) — korrekt unauffällig im Dialog-Lesefluss, keine
  Änderung nötig. Desktop/Mobil blieben deckungsgleich.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump, vor und nach den Audit-Fixes verifiziert) — reine
CSS-/Markup-Änderung ohne Bezug zu per String-Matching geprüften Texten,
`js/calc.js`/`js/schedule.js`/`js/guide.js` unangetastet, kein `test-generator`-Lauf
nötig.

**Geändert:** `css/styles.css`, `css/mobile.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`. `?v=` auf `3.46.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags + `.nav-version`-Versionstext). `pizza-rechner-mobile-
standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.46.0 - Versionsnummer nur im Menue statt im Footer/` enthält den
vollständigen Schnappschuss.

## Icon-Zentrierung & -Größe Korrektur (v3.45.0)

Direkter Nutzerauftrag per `/define-feature` (kein Backlog-Punkt — Stand v3.44.0 war
das Backlog leer). Auslöser: einige `.card-icon`-Badges wirkten optisch nicht exakt
mittig, ebenso die Streifen im Hamburger-Menü-Icon; beides sollte gegenüber dem
sonst aufgeräumten v3.41.0-Redesign nachgeschärft werden. **Reine Icon-/Markup-
Korrektur, keine Änderung an Berechnungslogik, Badge-Farbe oder Badge-Gesamtgröße.**

**Vorgehen (wichtig, da der mitgelieferte Diagnose-Hinweis explizit zur Verifikation
aufforderte statt blind zu vertrauen):** Vor jedem Fix per Headless-Edge-Screenshot +
Python/Pillow-Pixelmessung (Farbmasken für Kreis-Hintergrund vs. weiße Icon-Pixel,
Bounding-Box-Mittelpunkt-Vergleich) objektiv nachgemessen, statt nur visuell zu
schätzen — bestätigte, dass die `.card-icon`-Flex-Zentrierung selbst (`display:flex;
align-items:center;justify-content:center`) bereits seit v3.41.0 korrekt arbeitet;
das eigentliche Problem lag bei zwei der 13 handgezeichneten SVG-Icons, deren
Pfad-Koordinaten innerhalb ihres eigenen `viewBox="0 0 24 24"` nicht symmetrisch zum
Mittelpunkt (12,12) lagen (Bounding-Box des Pfads war nicht zentriert — analog einem
Icon-Font-Rendering-Fehler, nur hier in den eigenen Pfaddaten). Alle anderen 11 Icons
maßen sich als bereits sauber zentriert (Abweichung ≤0,5px bei 34px-Badge-Durchmesser,
Rendering-Rauschen).

**1. Zwei SVG-Pfade neu zentriert (per Pixelmessung verifiziert vorher/nachher):**
- **Thermometer** (Karte „Teigtemperatur & Eiswasser"): Pfad lag 2 Einheiten zu weit
  links im viewBox (gemessene Abweichung vorher: −1,5px bei 34px-Badge). Fix:
  `M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z` + `M10 8h1.5` →
  `M14 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z` + `M12 8h1.5` (Verschiebung +2 in x,
  Pfadform unverändert, nur Position). Nachher: 0px Abweichung.
- **Waage/Schloss-Symbol** (Ergebnis-Panel „Rezept"): Pfad lag 2,5 Einheiten zu weit
  unten (gemessene Abweichung vorher: +1,9px). Fix: `rect x="4" y="14" width="16"
  height="7" rx="2"` + `M8 14v-2a4 4 0 0 1 8 0v2` + `M10.5 17.5h3` → `rect x="4"
  y="11.5" ...` + `M8 11.5v-2a4 4 0 0 1 8 0v2` + `M10.5 15h3` (Verschiebung −2,5 in y).
  Nachher: 0px Abweichung.
- In beiden Dateien (`pizza-rechner.html`, `pizza-rechner-mobile.html`) identisch
  angewendet — beide hatten exakt denselben SVG-Markup-String (verifiziert vor dem
  Edit), keine Divergenz zwischen Desktop/Mobil entstanden.

**2. Icon-Größe innerhalb der Badges erhöht** (`css/styles.css`, `.card-icon
svg{width:18px;height:18px}` → `width:20px;height:20px`) — Badge selbst bleibt bei
34px (unverändert aus v3.41.0/v3.43.0), Innenabstand sinkt von 8px auf 7px pro Seite,
per Zoom-Screenshot gegengeprüft: keine Überlappung mit dem Kreisrand. Gilt für alle
13 Karten-Badges auf Desktop UND Mobil (gemeinsame `css/styles.css`, kein
`mobile.css`-Override vorhanden). Inline-`width="18" height="18"`-Attribute an allen
13 `<svg>`-Tags in beiden HTML-Dateien ebenfalls auf `20`/`20` nachgezogen (rein
kosmetisch/korrektheitshalber — CSS überschreibt Präsentationsattribute ohnehin,
per Grep bestätigt: nichts im Projekt hing vom alten `width="18"`-Wert ab).

**3. Hamburger-Menü-Icon (`.nav-toggle`) von Unicode-Glyph auf Inline-SVG umgestellt
— größte inhaltliche Änderung dieses Zyklus:** Bisher `<span aria-hidden="true">☰</span>`
(Unicode-Zeichen U+2630), dessen Zentrierung/Größe von Systemschriftart-Metriken
abhing (auf diesem System per Pixelmessung zwar aktuell zufällig exakt zentriert,
aber fontabhängig fragil — kein belastbares Zentrierungsverhalten über
Browser/OS-Kombinationen hinweg). Fix: explizites Drei-Balken-SVG, symmetrisch per
Konstruktion (x 4–20 um Mittelachse x=12, y-Linien bei 6/12/18 um Mittelachse y=12):
`<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"
stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6"
x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20"
y2="18"/></svg>` ersetzt den `<span>` 1:1 in `#navToggle` (beide HTML-Dateien,
`aria-expanded`/`aria-controls`/`aria-label`-Attribute des Buttons selbst
unangetastet). CSS: `.nav-toggle` (eigene Basisregel in `css/styles.css` UND
`css/mobile.css`, Desktop/Mobil je eigenständig) bekam `display:flex;
align-items:center;justify-content:center;`, `font-size:20px;line-height:1;` entfernt
(waren nur für die alte Text-Glyphe nötig), neue Regel `.nav-toggle svg{width:22px;
height:22px;display:block;}`. Button-Box selbst unverändert 44×44px (Touch-Ziel),
`.nav-toggle:focus-visible`-Fokusring aus v3.42.0 unangetastet und weiterhin korrekt
wirksam (kein `overflow:hidden`, das den Ring clippen würde).

**Härten (gezielter `accessibility-expert`-Audit, synchron):** Fünf Prüfpunkte
gegengecheckt, keine Blocker/Major/Minor-Funde: Accessible Name von `#navToggle`
unverändert (SVG `aria-hidden`, Name kommt weiterhin nur aus `aria-label`), Kontrast
der SVG-Linien identisch zur alten Glyphe (`stroke="currentColor"` erbt `color:#fff`,
~6,6:1 auf dem Header-Hintergrund, bereits in v3.17.1 gegengerechnet), Touch-Ziel
44×44px unverändert, Fokus-Ring clippt nicht, `.card-icon`-Innenabstand nach der
Größenerhöhung weiterhin ausreichend. Keine Fixes nötig, Desktop/Mobil blieben
deckungsgleich.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump, vor und nach den Fixes sowie nach dem Accessibility-Audit
verifiziert) — reine CSS-/SVG-Pfad-/Markup-Änderung ohne Bezug zu per String-Matching
geprüften Texten, `js/calc.js`/`js/schedule.js`/`js/guide.js` unangetastet, kein
`test-generator`-Lauf nötig.

**Geändert:** `css/styles.css`, `css/mobile.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`. `?v=` auf `3.45.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags + `#appVersion`-Fußzeile).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.45.0 - Icon-Zentrierung und -Groesse Korrektur/` enthält den
vollständigen Schnappschuss.

## Echtes Header-Foto eingebunden (v3.44.0)

Kleiner, klar umrissener Auftrag (kein `/define-feature`, kein Brainstorming) —
der in v3.41.0 vorbereitete `--header-photo`-Slot bekommt sein erstes echtes Bild.
Der Nutzer hat `assets/header-pizza.jpg` bereitgestellt (1920×1079px JPEG, ~257 KB,
Nahaufnahme einer Margherita auf dunklem Holztisch) und selbst nach
`assets/HEADER-FOTO-README.txt` umgesetzt.

**Umsetzung laut README, plus zwei dabei gefundene Bugs (beide in der eigenen
v3.41.0-Doku/Infrastruktur, nicht im Nutzer-Bild):**

1. `--header-photo` in `css/styles.css` (`:root`) von `none` auf ein `url(...)`
   umgestellt.
2. **Bug 1 gefunden (Pfad-Bug):** Die ursprüngliche README-Anleitung nannte
   `url('assets/header-pizza.jpg')` — das ist aber relativ zu `css/styles.css`
   selbst gemeint (liegt im Unterordner `css/`), nicht relativ zum Projekt-Root.
   Ohne Korrektur landete das Bild dadurch unsichtbar (still, ohne Fehlermeldung —
   nur der CSS-Fallback-Verlauf blieb sichtbar), erst per Vorher/Nachher-Screenshot-
   Vergleich entdeckt. **Fix:** `url('../assets/header-pizza.jpg')` (ein Verzeichnis
   hoch von `css/` aus). `assets/HEADER-FOTO-README.txt` entsprechend korrigiert.
3. **Bug 2 gefunden (Standalone-Build-Bug):** `build-mobile-standalone.py` inlined
   `css/styles.css` unverändert in ein `<style>`-Tag der Root-Level-Datei
   `pizza-rechner-mobile-standalone.html` — dabei verschiebt sich die effektive
   Basis für relative `url()`-Pfade eine Ebene nach oben (von `css/` auf den
   Projekt-Root), wodurch das frisch gefixte `../assets/…` in der Standalone-Datei
   NOCHMAL falsch gezeigt hätte (diesmal eine Ebene ÜBER dem Projekt-Root). **Fix:**
   `inline_css()` im Build-Skript entfernt jetzt automatisch ein führendes `../` aus
   jedem `url(...)` beim Inlinen (generischer Fix, nicht nur für diesen einen Pfad)
   — verifiziert per Headless-Edge-Screenshot direkt gegen die erzeugte Standalone-
   Datei, Bild erscheint dort jetzt korrekt.
4. **Kontrast konkret gemessen statt geschätzt** (WCAG 1.4.3): Pixel-Sampling
   (Python/Pillow) auf Headless-Edge-Screenshots bei mehreren Viewport-Breiten
   (390/860/1280/1920px), Text-/Button-Bereiche gezielt ausgeschlossen, um die
   tatsächliche Hintergrundfarbe HINTER dem Text zu messen statt versehentlich die
   weißen Textpixel selbst. Mit der ursprünglichen Abdunklungs-Ebene
   (`rgba(20,9,5,.55)`) lag der schlechteste gemessene Fall (helle Mozzarella-Stelle
   im Foto, direkt hinter dem `<h1>`) bei nur **~4,75–4,9:1** — über der 4,5:1-
   Schwelle, aber mit wenig Marge. Abdunklungs-Ebene auf **.62** erhöht (im vom
   README empfohlenen .6–.65-Bereich): derselbe Fall liegt jetzt bei **~6,0–6,1:1**,
   konsistent über alle getesteten Breiten.
5. Header ist strukturell sehr breit/flach im Vergleich zum Foto-Seitenverhältnis
   (`background-size:cover` zeigt dadurch nur einen schmalen horizontalen Streifen
   der vollen Bildbreite, keinen horizontalen Ausschnitt) — beim aktuellen Foto
   zeigt der mittige Streifen zufällig einen gut erkennbaren, appetitlichen
   Ausschnitt (Kruste, Mozzarella, Basilikum). In `assets/HEADER-FOTO-README.txt`
   dokumentiert für den Fall eines künftigen Ersatzfotos mit anderem Bildaufbau.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump) — reine CSS-/Build-Skript-Änderung ohne Bezug zu per
String-Matching geprüften Texten. Kein `test-generator`-, kein
`accessibility-expert`-Vollaudit nötig (Auftrag sah nur den gezielten
Kontrast-Check vor, s. o. — der wurde rechnerisch statt geschätzt durchgeführt).

**Geändert:** `css/styles.css`, `assets/HEADER-FOTO-README.txt`,
`build-mobile-standalone.py`, `pizza-rechner.html`, `pizza-rechner-mobile.html`,
neu (jetzt erstmals committet): `assets/header-pizza.jpg`. `?v=` auf `3.44.0`
gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags + `#appVersion`-Fußzeile).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`,
jetzt mit dem Pfad-Korrektur-Fix).
`Versionen/v3.44.0 - Echtes Header-Foto/` enthält den vollständigen Schnappschuss.

## Redesign-Korrektur: Icon-Farben, farbige Quickbar & Fokusring (v3.43.0)

Direkter Nutzerauftrag (kein Backlog-Punkt, kein `/define-feature`-Brainstorming
nötig — Auftrag kam bereits vollständig spezifiziert). Auslöser: Der Nutzer fand
die Icon-Farben aus dem v3.41.0-Redesign nicht passend zum geteilten Referenz-
Screenshot (dort: satte, gefüllte Terrakotta-Flächen) und vermisste die vorherige
farbige Optik der unteren Mobil-Sticky-Leiste (v3.41.0 hatte sie versehentlich zu
nüchtern/hell umgestellt). Reine Farb-/Stil-Korrektur, keine Struktur-/
Funktionsänderung.

**1. `.card-icon`-Badges (13 Karten, Desktop + Mobil) — von blassem Tint-Ton auf
satte gefüllte Fläche:** `css/styles.css`. Vorher `background:rgba(200,68,46,.12);
color:var(--tomato-dark)` (blasser Terrakotta-Hauch, farbiger Strich) → jetzt
`background:var(--tomato);color:#fff` (volle Terrakotta-Fläche, weißes Icon).
`.result .card-icon` analog von `rgba(58,125,68,.14)`/`var(--basil)` auf volle
`var(--basil)`-Fläche mit weißem Icon. Rein dekorativ (`aria-hidden`), kein
Kontrastkriterium zwingend, aber weiß auf `var(--tomato)`/`var(--basil)` liegt
ohnehin deutlich über AA (bereits in v3.41.0/v3.42.0 für andere Elemente
gegengerechnet).

**2. Mobile Sticky-Quickbar (`css/mobile.css`) — zurück zur farbigen Fläche:**
v3.41.0 hatte den Grund auf `var(--card)` (hell/neutral) umgestellt; jetzt wieder
`var(--tomato-dark)` + dieselbe Diagonal-Textur wie der Foto-Header (optische
Klammer Kopf-/Fußzeile). `.qb-jump`-Text zurück auf `#fff`, `.qb-jump small`
von `var(--muted)` auf `rgba(255,255,255,.85)` (gegen den jetzt dunklen Grund
gerechnet: ~5,2:1, über der 4,5:1-Schwelle). `.qb-save` bleibt gefüllt
`var(--tomato)`, bekommt aber einen 2px weißen Rahmen, damit sich der Button von
der jetzt ebenfalls terrakottafarbenen Bar optisch abhebt (sonst liefen beide
Flächen ineinander).

**3. Neuer Fokus-Ring `.quickbar .qb-save:focus-visible` (WCAG 2.4.7/1.4.11):**
Einziges durch diese Farbänderung neu betroffenes interaktives Element (saß vorher
auf hellem Grund ohne eigene Fokus-Ring-Definition, jetzt auf farbigem Terrakotta-
Grund, wo ein evtl. bläulicher Browser-Standard-Fokusring nicht zuverlässig
kontrastreich genug wäre) — `outline:2px solid #fff`. **Bewusst kein weiterer
Fokusring-Umbau:** `.nav-toggle`, `.nav-close`, `.party-qty-btn`,
`.party-delete-btn`, `.party-ing-remove` sind von dieser Farbänderung nicht
betroffen (unveränderte Hintergründe) — ihre im v3.42.0-Accessibility-Zyklus
gesetzten Fokus-Ringe (`#fff` auf dem dunklen Header bzw. `var(--tomato-dark)`
auf hellen Karten) bleiben unverändert korrekt, ein pauschales Umfärben auf Weiß
hätte sie gegen ihre weißen Karten-Hintergründe sogar unsichtbar gemacht.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump) — reine CSS-Änderung ohne Bezug zu per String-Matching
geprüften Texten. Visuell per Headless-Edge-Screenshot (Desktop + Mobil)
gegengeprüft. Kein `test-generator`-, kein `accessibility-expert`-Lauf nötig
(reine Farbkorrektur ohne neues Custom-Control/neue Live-Region/neue
Kontrastfrage über die oben bereits mitgerechneten Werte hinaus).

**Geändert:** `css/styles.css`, `css/mobile.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`. `?v=` auf `3.43.0` gezogen (Desktop + Mobil, alle
`<link>`/`<script>`-Tags + `#appVersion`-Fußzeile).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.43.0 - Redesign-Korrektur Icon-Farben Quickbar Fokusring/` enthält
den vollständigen Schnappschuss.

## Gebündelter Accessibility-Zyklus (v3.42.0)

Direkter Nutzerauftrag (kein Brainstorming nötig, alle vier Punkte waren bereits als
Nebenbefunde aus früheren Zyklen diagnostiziert und im Backlog notiert). Reine
Härtung — keine Änderung an Berechnungslogik, keine neue Funktionalität.

**1. Live-Region ohne vorheriges Leeren (WCAG 4.1.3), analog zum `#recipeIOLiveMsg`-
Fix aus v3.28.1:**
- `js/share.js` (`copyShareLink()`): neuer Generation-Zähler `shareMsgGen`. Die
  Erfolgs-/Fehlermeldung wird jetzt erst geleert (`textContent=''`), dann per
  `window.setTimeout(...,50)` gesetzt (geprüft gegen den Zähler) — identisches
  Muster wie `announcePartyStatus()`/`showRecipeIOMsg()`. Der bestehende
  1800-ms-Auto-Clear am Ende bleibt unverändert erhalten.
- `js/newrecipe.js` (`showNrMsg()`): identischer Clear-then-delayed-set-Fix mit
  neuem Zähler `nrMsgGen`.

**2. `<details>`-zugeklappt-Problematik bei Mobil-Live-Regions (WCAG 4.1.3) —
geprüft, ein echter Fund + ein Fehlalarm:**
- **Echter Fund:** Der "🗑 Pizza gelöscht"-Klick (`.party-delete-btn`, `js/party.js`)
  meldete bisher über `announcePartyCreate()`/`#partyCreateLiveMsg` — diese
  Live-Region liegt aber in der SEPARATEN Karte "Eigene Pizza anlegen", die auf
  Mobil per `<details>` standardmäßig ZUGEKLAPPT ist. Der Lösch-Button selbst liegt
  aber in der (zum Klicken zwangsläufig offenen) "Pizza Party"-Karte — ein
  Cross-Card-Fall, der Screenreadern die Ansage verschluckt hätte, wenn "Eigene
  Pizza anlegen" gerade zu ist (der Regelfall). **Fix:** Wiederverwendung der
  bereits korrekt platzierten `#partyResetLiveMsg`-Live-Region (v3.30.0, für den
  „Alle zurücksetzen"-Button gebaut, liegt in der SELBEN "Pizza Party"-Karte wie
  der Lösch-Button) — dabei generischer umbenannt zu `#partyStatusLiveMsg` /
  `announcePartyStatus()` (HTML-ID in beiden Dateien angepasst, `js/party.js`
  entsprechend), da sie jetzt sowohl für „Alle zurückgesetzt" als auch „Pizza
  gelöscht" zuständig ist. `announcePartyCreate()`/`#partyCreateLiveMsg` bleiben
  unverändert für die Create-Erfolgs-/Fehlermeldung (dort liegt der auslösende
  Button in derselben Karte wie die Live-Region — die Karte muss zum Klicken
  zwangsläufig offen sein, kein Cross-Card-Problem).
- **Fehlalarm (geprüft, kein Fix nötig):** `#nrLiveMsg` ("Neues Rezept anlegen")
  hat nur einen einzigen Trigger (`nrCreateBtn`), der in DERSELBEN `<details>`-Karte
  liegt wie die Live-Region selbst — die Karte muss beim Klicken zwangsläufig
  offen sein (per `<details>`-Browser-Semantik ist deren Inhalt bei geschlossenem
  Zustand gar nicht klickbar/gerendert). Codesuche bestätigt: kein zweiter,
  Cross-Card-Aufruf von `showNrMsg()` vorhanden. Bekommt trotzdem den
  Clear-then-delayed-set-Fix aus Punkt 1 (unabhängiges WCAG-4.1.3-Muster:
  doppelte wortgleiche Meldungen hintereinander).

**3. `.schedbar`-Bannertext-Kontrast (WCAG 1.4.3), Nebenbefund aus dem
v3.38.0-Audit:** Die Variante OHNE gesetzte Zeit (`guide.schedbar.noTime`,
`js/guide.js`) hatte einen inline `background:linear-gradient(135deg,#8a7f76,#6f655c)`
— am helleren Ende lag weißer Text nur bei ~3,91:1. Der reguläre grüne
`.schedbar`-Grund (`var(--basil)`, Variante MIT Zeit) war davon nicht betroffen
(bereits ausreichend Kontrast). **Fix:** Gradient auf `#645c55`/`#4a443e`
gedunkelt (helleres Ende jetzt rechnerisch ~6,56:1). Zusätzlich `text-shadow:0 1px 2px rgba(0,0,0,.25)`
auf `.schedbar` allgemein ergänzt (`css/styles.css`) als zweite Absicherung,
schadet der bereits ausreichend kontrastreichen Basil-Variante nicht.

**4. Fehlender eigener Fokus-Ring für die seit v3.41.0 kreisrunden Icon-Buttons
(WCAG 2.4.7), Nebenbefund aus dem v3.41.0-Redesign:** `.nav-toggle` (dunkler
Foto-Header-Hintergrund) bekommt `:focus-visible{outline:2px solid #fff;...}`.
`.nav-close`, `.party-qty-btn`, `.party-delete-btn`, `.party-ing-remove` (heller
Karten-Hintergrund) bekommen `:focus-visible{outline:2px solid var(--tomato-dark);...}`
(identisches Muster wie das bereits bestehende `.info-btn:focus-visible`).

**Härten (gezielter `accessibility-expert`-Audit, synchron, reine Verifikation):**
Alle vier Fixes gegengeprüft — korrekt umgesetzt, keine weiteren Änderungen nötig.
Kontraste konkret nachgerechnet: `.schedbar`-Fix ~6,56:1 (weit über 4,5:1), neue
Fokusring-Farben `var(--tomato-dark)` auf Weiß ~6,61:1 (über der 3:1-Schwelle für
Non-Text-Kontrast). Kein Clipping des `outline-offset:2px` durch `overflow:hidden`
(das einzige `overflow:hidden` bei `details.card` hat 18–20px Innenabstand, weit
mehr als nötig). `announcePartyStatus`-Hoisting (Funktionsdeklaration, vor ihrer
Definition im Lösch-Handler aufgerufen) funktioniert korrekt in JS, kein Bug.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump, mehrfach verifiziert — vor den Fixes, nach den Fixes, nach
dem Audit). Kein `test-generator`-Lauf nötig (reine Timing-/ID-/Kontrast-Fixes,
keine neue Berechnungslogik, `js/calc.js`/`js/schedule.js` unangetastet).

**Geändert:** `js/share.js`, `js/newrecipe.js`, `js/party.js`, `js/guide.js`,
`css/styles.css`, `pizza-rechner.html`, `pizza-rechner-mobile.html`. `?v=` auf
`3.42.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags + `#appVersion`-
Fußzeile). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.42.0 - Gebuendelter Accessibility-Zyklus/` enthält den
vollständigen Schnappschuss.

## Visuelles Redesign — Header-Foto-Platzhalter, Bereichs-Icons & Buttons (v3.41.0)

Direkter Nutzerauftrag per `/define-feature` (Motivation: Freund + Nutzer fanden die
App optisch "zu nüchtern/KI-typisch"; Referenz-Screenshot eines Mobil-Mockups als
Stilvorlage). **Rein visuelles Redesign — keine Änderung an Berechnungslogik,
Formularen oder Feature-Umfang** (`js/calc.js`, `js/schedule.js`, `js/guide.js` u. a.
unangetastet, kein einziger `js/*`-Eingriff in diesem Zyklus).

**Wichtiger Kontext zum Vorlauf:** In v3.13.0 gab es bereits ein bewusstes Redesign
"gegen den KI-typischen Look" — dort wurden ALLE Emoji-Icons vor Card-Titeln entfernt,
scharfe 3px-Radien statt runder Karten eingeführt, Schatten durch eine Akzentlinie
ersetzt. Dieser Zyklus ist eine **bewusste, vom Nutzer im Brainstorming aktiv
bestätigte Kurskorrektur** in die andere Richtung (wieder rundlicher, wieder Icons —
aber Line-Icons statt Emoji, s. u.), kein Widerspruch/Versehen.

**1. Header-Foto-Platzhalter (`css/styles.css`, gemeinsame `header{}`-Regel für
Desktop UND Mobil):** Da im Environment weder ein Bildgenerierungs- noch ein
Web-Fetch-Tool zur Verfügung stand, konnte in dieser Session kein echtes Bild erzeugt
werden. Lösung (mit dem Nutzer abgestimmt): **austauschbarer CSS-Slot** statt fertigem
Bild.
- Neue Custom Property `--header-photo:none;` in `:root`. Der Header nutzt sie als
  eigene `background-image`-Ebene: `linear-gradient(dunkle Abdunklung 55%) , var(--header-photo),
  radial-gradient(Bokeh warm oben-links), radial-gradient(Bokeh orange unten-rechts),
  linear-gradient(Terrakotta-Basis), repeating-linear-gradient(Diagonal-Textur)`.
  Solange `--header-photo:none` ist, zeigen die Fallback-Ebenen eine warme,
  foto-ähnliche Bokeh-Anmutung ganz ohne Bilddatei.
- **Umschalten auf ein echtes Foto später: EIN einziger Wert ändern**
  (`--header-photo:url('assets/header-pizza.jpg');`), keine Struktur-/Markup-Änderung
  nötig. Ausführliche Anleitung in `assets/HEADER-FOTO-README.txt` (neuer `assets/`-
  Ordner, aktuell nur diese Anleitung, kein Bild).
- Die oberste Abdunklungs-Ebene (`rgba(20,9,5,.55)`, gleichmäßig über den ganzen
  Header) ist bewusst **unabhängig vom Foto/Fallback-Inhalt** — sichert die
  Lesbarkeit von weißem `<h1>`-Text/Hamburger-Icon auch bei einem künftigen hellen
  Foto ab (rechnerisch geprüft: selbst im hellsten Bokeh-Bereich des aktuellen
  Platzhalters liegt Weiß-auf-Hintergrund bei ~7:1, weit über der 4,5:1-Schwelle für
  Fließtext). `header h1` bekam zusätzlich `text-shadow:0 1px 4px rgba(0,0,0,.35)`
  als weitere Absicherung.

**2. Runde Icon-Badges je Card-Titel (13 Karten, Desktop `pizza-rechner.html` +
Mobil `pizza-rechner-mobile.html`, je identisch):** Inline-SVG-Line-Icons (dünner
Strich, `stroke=currentColor`, kein Icon-Font/CDN — App bleibt offline-tauglich),
in einem runden `.card-icon`-Badge (34px, `background:rgba(200,68,46,.12)`,
`color:var(--tomato-dark)`; beim Ergebnis-Panel grün getönt passend zum grünen
Card-Akzent). Zuordnung (mit dem Nutzer im Brainstorming abgestimmt): Kochmütze
(Fertiges Rezept wählen), Weizenähre (Grundeinstellungen), Gärglas mit Bläschen
(Methode & Hefe), Thermometer (Teigtemperatur & Eiswasser), Waage (Rezept/Ergebnis),
Ordner (Meine Rezepte), Stift+Plus (Neues Rezept anlegen), Uhr (Zeitplan),
aufgeschlagenes Buch (Pizza-Glossar), Zahnrad (Einstellungen), Pizzastück mit
Belag-Punkten (Pizza Party), Pizzastück mit Plus (Eigene Pizza anlegen),
Einkaufskorb (Zutatenliste für die Party). `guide.headTitle` ("Schritt-für-Schritt-
Anleitung") bewusst ausgenommen — kein `.card`, sondern eigener Anleitungs-Abschnitt.
- **Technische Besonderheit wegen i18n:** `applyStaticI18n()` (`js/i18n.js`) setzt bei
  `data-i18n`/`data-i18n-html` **direkt** `el.textContent`/`el.innerHTML` auf dem
  Element, das das Attribut trägt — hätte das Icon-`<span>` als Kind des `<h2>`
  zerstört, wäre das Attribut auf dem `<h2>` selbst geblieben. Fix: `data-i18n`/
  `data-i18n-html` wandert auf einen inneren `<span>` (Text), das Icon liegt als
  Geschwister-`<span class="card-icon" aria-hidden="true">` daneben. `data-i18n-attr="aria-label:…"`
  bleibt auf dem `<h2>` selbst (setzt nur das Attribut, rührt keine Kind-Knoten an) —
  der Accessible Name der Überschrift bleibt dadurch exakt der reine Titeltext, das
  Icon ist rein dekorativ und für Screenreader unsichtbar (verifiziert). Umsetzung
  automatisiert per kleinem Python-Skript (Regex-Ersetzung in beiden HTML-Dateien,
  identische Icons garantiert) statt 26 manueller Einzel-Edits.

**3. Einheitliches Buttons-Redesign (auch kleinere Utility-Buttons, wie vom Nutzer
gewünscht):**
- **Globale Rundung:** `--radius` 3px → **14px** (Karten, Inputs, Selects, Segmente,
  Buttons), `--radius-chip` 6px → **999px/voll rund** (Pills, Chips, Badges, Timer-
  Buttons) — ein einziger Variablen-Wechsel rundet praktisch alle Eingabefelder/
  Chips/Pills im ganzen Projekt konsistent ab ("abgerundete Eingabefelder" aus der
  Referenz).
- **Kreis-Sprache für reine Icon-Buttons:** `.nav-toggle`, `.nav-close`,
  `.party-qty-btn`, `.party-delete-btn`, `.party-ing-remove` jetzt `border-radius:50%`
  (vorher eckig/var(--radius)) — `.info-btn` war schon rund. Klare visuelle Regel:
  **kreisrund = reiner Icon-/Utility-Button, abgerundetes Rechteck = Text-Button,
  volle Pille = primäre CTA.**
- **Primärer "Speichern"-Button** (`.actions button.primary`, Desktop-Ergebnis-Panel):
  Farbe von Grün (`var(--basil)`) auf **Terrakotta** (`var(--tomato)`) geändert (wie
  im Referenz-Screenshot), Pill-Form (`border-radius:999px`) statt Rechteck, Schlagschatten.
  Grüner Akzent bleibt für den Card-Rahmen/-Icon des Ergebnis-Panels selbst erhalten
  (unverändertes bestehendes Unterscheidungsmerkmal Eingabe- vs. Ausgabe-Karten).
- **Mobile Sticky-Quickbar** (`css/mobile.css`, `.quickbar`) von dunklem Tomate-
  Verlauf mit transparentem Save-Button auf **hellen `var(--card)`-Grund mit
  gefüllter Terrakotta-Pille** als "Speichern"-CTA umgestellt — entspricht der
  Referenz (helle Fußleiste + farbiger Pill-Button) deutlich näher als die vorige
  dunkle Variante.
- Weitere Rundungs-Konsistenz: Slider-Thumb (`2px` → `50%`, war in v3.13.0 bewusst
  eckig), `.seg button` (`2px` → `10px`), `.step .num`-Kreis (`2px` → `50%`),
  `.ing .dot`-Farbpunkte (`1px` → `50%`). `.card` bekam den bereits vorhandenen,
  seit v3.13.0 ungenutzten `--shadow`-Wert zurück (leichter Schatten statt reiner
  Akzentlinie).

**Härten (gezielter Selbst-Audit statt `accessibility-expert`-Subagent — der
Subagent-Aufruf brach nach einer ungewöhnlich langen Laufzeit mit einem Stream-Fehler
ab, ohne Dateien geändert zu haben; die verbleibende Prüfung wurde danach selbst mit
konkreten Kontrastberechnungen durchgeführt, um keine Zeit mit einem erneuten
Vollaudit zu verlieren):**
- **Gefunden & behoben (WCAG 1.4.3, ~3,4:1 statt 4,5:1):** `.quickbar .qb-jump small`
  (Mobil, Gewicht/Anzahl-Kleintext) kombinierte `color:var(--muted)` **zusätzlich**
  mit `opacity:.75` — dieser Opacity-Abschwächer war auf den alten DUNKLEN
  Quickbar-Hintergrund abgestimmt und drückte den Kontrast gegen den jetzt HELLEN
  Hintergrund unter die Schwelle. Fix: `opacity` entfernt — `var(--muted)` allein
  liegt gegen einen hellen Grund bereits nachweislich bei ~5,85:1 (identischer,
  im Projekt bereits an anderer Stelle dokumentierter Farbwert, s. Kommentar bei
  `.switch-slider` in `css/styles.css`).
- **Geprüft, keine Fixes nötig:** Header-Text-Kontrast (s. o., ~7:1 im hellsten
  Platzhalter-Bereich), `.qb-save`/`.actions button.primary` Weiß-auf-Terrakotta
  (~4,86:1, über 4,5:1), Icon-Badges rein dekorativ ohne Kontrastpflicht (WCAG 1.4.11
  gilt nicht für rein dekorative, durch Text begleitete Icons), Accessible-Name-
  Mechanik der Card-Titel (s. Punkt 2), Touch-Ziel-Größen der neu kreisrunden Buttons
  unverändert (36–44px, nur Form geändert), keine Text-Abschneidung durch die volle
  `--radius-chip`-Rundung (CSS `border-radius` schneidet nie in die Padding-Box).
- **Nicht neu geprüft (vorbestehend, nicht durch dieses Redesign verursacht):** kein
  eigener `:focus-visible`-Ring für `.nav-toggle`/`.nav-close`/Party-Buttons (Browser-
  Default-Outline greift, war schon vor diesem Zyklus so) — Kandidat für einen
  künftigen Accessibility-Zyklus, kein Blocker.

**Tests:** `tests/test.html` unverändert bei **577 Prüfungen**, alle grün
(Headless-Edge-Dump, vor UND nach dem Kontrast-Fix erneut verifiziert) — reine
CSS-/Markup-Änderung ohne Bezug zu den per String-Matching geprüften `js/guide.js`-
Texten, kein `test-generator`-Lauf nötig. Zusätzlich per Headless-Edge-Screenshot
(Desktop + Mobil) visuell gegengeprüft; bekanntes, bereits in v3.13.1 dokumentiertes
Headless-Tooling-Artefakt (horizontaler Cut-off in schmalen Mobil-Screenshots) per
Baseline-Vergleich gegen den unveränderten HEAD-Stand als vorbestehend bestätigt
(keine neue Regression durch dieses Redesign).

**Offen für einen künftigen Zyklus:** echtes Header-Foto einsetzen, sobald der
Nutzer eines generiert/bereitstellt (s. `assets/HEADER-FOTO-README.txt` für die
genaue Anleitung — nur ein CSS-Variablenwert + Datei ablegen).

**Geändert:** `css/styles.css`, `css/mobile.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, neu: `assets/HEADER-FOTO-README.txt`. `?v=` auf
`3.41.0` gezogen (Desktop + Mobil, alle `<link>`/`<script>`-Tags).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.41.0 - Visuelles Redesign Header-Foto Icons Buttons/` enthält den
vollständigen Schnappschuss.

## Rückbau: Bring!-Deeplink-Testaufbau geprüft und verworfen (v3.40.0)

**Kurzfassung für den schnellen Wiedereinstieg:** Der in v3.39.0 gebaute
experimentelle Bring!-Deeplink-Testaufbau wurde vom Nutzer live auf einem
iPhone mit der echten Bring!-App getestet. **Ergebnis: technische
Sackgasse, Idee endgültig verworfen.** Der komplette Testcode
(`bring-import.html`, `js/bring-test.js`, der Button „Test: Mit Bring!
teilen" + zugehörige i18n-Keys/CSS) wurde in diesem Zyklus wieder
vollständig entfernt. **Nichts davon existiert mehr im Code** — falls die
Idee in Zukunft nochmal aufkommt, s. Fehlerursache unten, bevor erneut Zeit
investiert wird.

**Testergebnis:** Die Bring!-App öffnete sich beim Antippen des Deeplinks
zwar korrekt, der Import selbst schlug aber fehl („Oops etwas ist
schiefgelaufen").

**Root Cause (laut Bring!s eigenem Entwickler-Guide):** Bring! braucht für
den Import-Deeplink serverseitig statisch gerendertes HTML mit
vollständigem Schema.org-`Recipe`-Markup, **inklusive Pflichtfeldern wie
`author` und `image`**, die im ursprünglichen Testaufbau nicht mitgeliefert
wurden. Unsere Zutatenliste ist außerdem grundsätzlich dynamisch — sie wird
erst clientseitig aus dem URL-Parameter berechnet und das JSON-LD erst
danach per JavaScript in den `<head>` eingefügt (das war ja genau die
ursprünglich offene Testfrage). Ein für Bring! funktionierender Ansatz
bräuchte **serverseitiges Rendering pro Anfrage** (mindestens die
Pflichtfelder `author`/`image` müssten bereits im initial ausgelieferten
HTML stehen) — das erfordert einen echten Anwendungsserver und verstößt
damit gegen das Kernprinzip dieser App („kein Server, komplett
offline/statisch nutzbar", GitHub Pages ist reines Static Hosting ohne
serverseitige Logik). **Nicht ohne fundamentalen Architekturbruch lösbar —
daher endgültig verworfen, keine Weiterverfolgung geplant.**

**Rückbau (vollständig, verifiziert):**
- `bring-import.html` gelöscht.
- `js/bring-test.js` gelöscht.
- Button „Test: Mit Bring! teilen (experimentell)" + Hinweistext aus der
  Pizza-Party-Card „Zutatenliste für die Party" entfernt — Desktop UND
  Mobil.
- `<script src="js/bring-test.js">`-Einbindung aus beiden HTML-Dateien
  entfernt.
- i18n-Keys `btn.bringTest`/`hint.bringTest`/`bring.recipeName` aus
  `js/i18n.js` entfernt.
- `.btn-experimental`-CSS-Regel aus `css/styles.css` entfernt.
- `tests/test.html` musste nicht bereinigt werden — für den experimentellen
  Testaufbau wurden nie dauerhafte Unit-Tests angelegt (nur Ad-hoc-
  Verifikation per Headless-Edge während des Bauens in v3.39.0).
- Vollständige Codesuche nach `bringTest`/`bring-test`/`bring-import`/
  `btn-experimental`/`bring.recipeName` bestätigt: keine Referenzen mehr in
  irgendeiner aktiven Datei (nur noch in den unveränderlichen
  `Versionen/v3.39.0 - …/`-Schnappschüssen, wie es sein soll).

**Tests:** `tests/test.html` bleibt unverändert bei **577** Prüfungen,
alle grün (Headless-Edge-Dump) — identischer Stand wie vor v3.39.0, da für
den Testaufbau nie dauerhafte Tests existierten. Zusätzlich per gezieltem
Headless-Edge-Skript verifiziert: Party-Ansicht rendert nach dem Rückbau
fehlerfrei (keine JS-Fehler, `#bringTestBtn` nicht mehr vorhanden,
`#partyResultList` weiterhin vorhanden/funktionsfähig).

Kein `accessibility-expert`-Audit nötig (reine Entfernung, keine neue
UI/Markup-Ergänzung).

**Geändert:** `bring-import.html` (gelöscht), `js/bring-test.js` (gelöscht),
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `js/i18n.js`,
`css/styles.css`. `?v=` auf `3.40.0` gezogen (Desktop + Mobil, Cache-Busting
+ `#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.40.0 - Rueckbau Bring-Deeplink-Test/` enthält den
vollständigen Schnappschuss (der vorherige `Versionen/v3.39.0 - …/`-
Schnappschuss mit dem vollständigen experimentellen Code bleibt unverändert
als historisches Nachschlagewerk erhalten, falls die technischen Details
später nochmal gebraucht werden).

## EXPERIMENTELL: Bring!-Deeplink-Testaufbau (v3.39.0)

**Ausdrücklich kein reguläres Feature** — ein vom Nutzer beauftragter
technischer Testaufbau, um live auf einem echten iPhone mit der echten
Bring!-App zu prüfen, ob eine bestimmte Integration funktioniert. Bewusst
als Wegwerf-Testcode markiert (Kommentare in allen betroffenen Dateien) —
falls sich die Idee nicht bestätigt, ist alles gezielt und rückstandslos
wieder entfernbar.

**Hintergrund/offene Frage:** die Shopping-List-App „Bring!" bietet einen
offiziellen Import-Deeplink
(`https://api.getbring.com/rest/bringrecipes/deeplink?url=${url}&source=web`,
dokumentiert unter getbring.com/en/integration-check), der KEINEN
API-Key/Login braucht — Bring! holt sich beim Öffnen des Links selbst
`schema.org/Recipe`-JSON-LD von der übergebenen `url`. Nur mit echtem
Gerät+App zu klären: akzeptiert Bring! dafür auch CLIENTSEITIG per
JavaScript nachträglich eingefügtes JSON-LD, oder nur bereits im initialen
HTML vorhandenes?

- **Neue, komplett eigenständige statische Seite `bring-import.html`**
  (Repo-Root, NICHT Teil der regulären Navigation) — liest einen kompakt
  kodierten Party-Zustand (Rezeptname + aggregierte Zutatenliste) aus dem
  Base64-JSON-Query-Parameter `?d=` (identisches Kodierungsmuster wie
  `js/share.js`, v3.14.0, hier aber bewusst dupliziert statt importiert,
  damit die Seite komplett unabhängig von den übrigen App-Modulen bleibt —
  kein `<script src="js/…">`). Fügt beim Laden per JavaScript ein
  `<script type="application/ld+json">` mit `schema.org/Recipe` (Name +
  `recipeIngredient`-Liste) in den `<head>` ein — genau das ist der Kern
  des Tests. Rendert zusätzlich sichtbaren Inhalt (Überschrift + Liste) zur
  visuellen Kontrolle. Muss über GitHub Pages öffentlich erreichbar sein
  (nicht nur `file://`) — Voraussetzung, damit Bring!s Server die Seite
  überhaupt serverseitig abrufen kann.
- **Neues, eigenständiges Modul `js/bring-test.js`:** baut aus
  `PZ.partyComputeAggregatedList()` (`js/party.js`, unverändert
  wiederverwendet) den Base64-Payload, hängt ihn an
  `https://birnify.github.io/pizza-rechner/bring-import.html?d=…` an und
  bettet diese komplette URL wiederum als `url`-Parameter in den
  offiziellen Bring!-Deeplink ein. `PZ.buildBringTestDeeplink()` zusätzlich
  für manuelles Nachtesten in der Browser-Konsole zugänglich gemacht.
- **Neuer Button „Test: Mit Bring! teilen (experimentell)"** (`#bringTestBtn`,
  neue i18n-Keys `btn.bringTest`/`hint.bringTest`/`bring.recipeName`) in
  der Pizza-Party-Card „Zutatenliste für die Party" — Desktop UND Mobil,
  identisch, unterhalb von `#partyResultList`, sichtbar durch
  `border-top:1px dashed` abgetrennt, mit erklärendem Hinweistext direkt
  darunter. **Immer sichtbar** (kein neues Feature-Flag) — bewusste
  Einschätzung, dass ein neuer Settings-Umschalter für einen einmaligen,
  klar als experimentell/Wegwerf gekennzeichneten Test unverhältnismäßig
  viel Zusatzaufwand/Dokumentationslast wäre.
- Klick navigiert direkt weg (`location.href = …`, kein `window.open`, für
  App-Deeplink-Handoffs auf iOS Safari das zuverlässigere Muster) — bewusst
  ohne Fehlerbehandlung/Fallback-UI (Abgrenzung der Aufgabenstellung: reiner
  Testaufruf, kein fertiges Feature).
- **`.btn-experimental`-CSS** (`css/styles.css`): gestrichelter Rahmen als
  zusätzliche visuelle „experimentell"-Kennzeichnung (nicht alleiniger
  Signalträger — Button-Text und Hinweistext benennen es bereits explizit).

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung) —
2 Major-Befunde gefunden und behoben:**
- **WCAG 1.3.1/4.1.2:** der Warnhinweis unter dem Button (macht klar: nur
  experimentell, nur mit installierter Bring!-App) war nur visuell
  sichtbar, nicht programmatisch mit dem Button verknüpft — Screenreader-
  Nutzer hätten vor dem sofort wegnavigierenden Klick nichts davon
  mitbekommen. **Fix:** `id="bringTestHint"` + `aria-describedby` auf dem
  Button, identisches Muster wie bereits `#pdfGuideBtn`/`#pdfGuideHint` und
  `#shareLinkBtn`/`#shareHint`.
- **Touch-Ziel/Konsistenz:** `#bringTestBtn` liegt außerhalb von
  `.actions`/`.pills`/`.seg` und bekam dadurch ursprünglich GAR KEIN
  App-Button-Styling — nur nackter Browser-Default-Button, gemessen **21px
  Höhe** statt der sonst überall im Code üblichen ~39px. **Fix:**
  `.btn-experimental` um Padding/Radius/Font/Farbe identisch zu
  `.actions button` ergänzt (Höhe jetzt korrekt **39px**, per Headless-Edge
  nachgemessen), gestrichelter Rahmen bleibt als Kennzeichnung erhalten.
- Kein Fund bei `bring-import.html` (eigenständige Testseite): `lang="de"`
  gesetzt, sinnvolle `<h1>`, alle Textfarb-Kombinationen rechnerisch
  geprüft (Body-Text 14,18:1, Badge 5,28:1, Hint 5,43:1 — alle über der
  4,5:1-Schwelle).

**Tests:** reine Test-/Anzeige-Ergänzung ohne Berechnungslogik-Bezug —
`tests/test.html` bleibt unverändert bei **577** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert (Desktop + Mobil):
`PZ.buildBringTestDeeplink()` liefert eine korrekt strukturierte URL
(äußerer Bring!-Deeplink → `url`-Parameter zeigt auf
`bring-import.html?d=…` → dekodierter Payload enthält Rezeptname +
vollständige, korrekt aggregierte Zutatenliste); `bring-import.html`
direkt mit einem echten `?d=`-Parameter aufgerufen: JSON-LD korrekt in
`<head>` eingefügt, sichtbare Liste stimmt überein; ohne `?d=`-Parameter:
Hinweistext sichtbar, kein JSON-LD eingefügt (kein Crash); Button-Text
übersetzt sich bei Sprachwechsel korrekt zu „Test: Share with Bring!
(experimental)"; Button-Höhe nach dem CSS-Fix 39px, `aria-describedby`
korrekt verdrahtet.

**Geändert:** `bring-import.html` (neu), `js/bring-test.js` (neu),
`js/i18n.js`, `css/styles.css`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`. `?v=` auf `3.39.0` gezogen (Desktop + Mobil,
Cache-Busting + `#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.39.0 - Experimentell Bring-Deeplink-Test/` enthält den
vollständigen Schnappschuss.

**Nächster Schritt liegt beim Nutzer:** Live-Test auf dem iPhone mit der
echten Bring!-App — Ergebnis (funktioniert der clientseitig eingefügte
JSON-LD-Ansatz oder nicht) entscheidet, ob dieser Testaufbau zu einem
echten Feature ausgebaut oder wieder vollständig entfernt wird (s. Liste
der zu löschenden Dateien/Blöcke in den Code-Kommentaren, z. B. oberster
Kommentar in `js/bring-test.js`).

## Bugfix: activeId-Desync bei "Neues Rezept anlegen"/Import in leere Bibliothek (v3.38.1)

Bugfix, vom Nutzer live reproduziert und mit exakter Root-Cause-Analyse
gemeldet (die eigene Verifikation im vorherigen Zyklus hatte den Fall knapp
verfehlt — dort waren nur Szenarien mit bereits vorhandenem aktivem Rezept
getestet worden).

**Reproduktion:** Frischer Zustand (kein Rezept aktiv, `activeId: null`) →
über „Neues Rezept anlegen" (`#nrCreateBtn`) ein Rezept anlegen → zu „Meine
Rezepte" wechseln (`#recipeSelect` zeigt das neue Rezept bereits sichtbar
ausgewählt) → „Kopieren"/„Umbenennen"/„Löschen" klicken → **wirkungslos**.

**Root Cause:** `addRecipeFromState()` (`js/storage.js`, „Neues Rezept
anlegen"-Formular, `js/newrecipe.js`) setzt bewusst NIE `data.activeId` —
Kernidee von v3.22.0: das unabhängige Anlege-Formular darf den
Hauptrechner-Zustand nicht antasten. `refreshRecipeSelect()` (`js/main.js`)
hat aber nur einen rein visuellen Fallback
(`sel.value = activeId || recipes[0].id`), der NICHT in den Storage
zurückgeschrieben wird — das Dropdown zeigte das neue Rezept dadurch zwar
als „ausgewählt", aber `PZ.getActiveId()` blieb `null`.
`#recipeDuplicate`/`#recipeRename`/`#recipeDelete` lesen aber alle
`PZ.getActiveId()` (nicht den Select-Wert) und brachen intern mit
`if (!id) return;` bzw. `if (!rec) return;` in `renameActive()`/
`duplicateRecipe()`/`deleteRecipe()` wirkungslos ab. Betraf **nur** den
Fall, dass zum Anlage-/Import-Zeitpunkt noch kein Rezept aktiv war — der
reguläre „Speichern"-Pfad (`save()`/`saveAsNew()`/`duplicateRecipe()`)
setzt `data.activeId` immer korrekt selbst.
- **Derselbe Mechanismus betraf zusätzlich `importRecipes()`** (Rezepte-
  Backup-Import, v3.21.0) beim Importieren in eine vorher leere Bibliothek —
  auch dort wird `activeId` bewusst nie selbst gesetzt (per zusätzlichem
  Test bestätigt, s. u.).

- **Fix:** neue Funktion `PZ.ensureActiveId()` (`js/storage.js`): repariert
  `data.activeId` im Storage, falls es auf kein existierendes Rezept mehr
  zeigt, obwohl bereits Rezepte vorhanden sind — reines Storage-
  Housekeeping, rührt **niemals** `PZ.state`/den Hauptrechner-Zustand an
  (kein `loadRecipe()`/`applyState()`-Aufruf, dadurch bleibt die
  v3.22.0-Kernidee vollständig gewahrt). `refreshRecipeSelect()`
  (`js/main.js`) ruft `PZ.ensureActiveId()` jetzt VOR jedem Lesen von
  `activeId` auf — da diese Funktion nach praktisch jeder Rezepte-
  Bibliotheks-Änderung aufgerufen wird (Neu/Umbenennen/Löschen/Import/
  Anlegen über das Mini-Formular), heilt sich ein Desync an genau der
  Stelle, an der er entsteht, sofort selbst.
- Heilt auch bereits VOR diesem Fix persistierte kaputte Zustände (z. B.
  wenn ein Nutzer den Bug schon vor dem Update ausgelöst hat): beim
  nächsten Seitenaufruf durchläuft `PZ.load()` → `refreshRecipeSelect()` →
  `PZ.ensureActiveId()` denselben Reparaturpfad automatisch.
- Betrifft Desktop UND Mobil gleichermaßen (gemeinsamer `js/storage.js`/
  `js/main.js`-Code, keine separate Mobil-Anpassung nötig).

**Tests:** 10 neue Unit-Tests in `tests/test.html` (`ensureActiveId()`:
Reparatur nach `addRecipeFromState()` in leere Bibliothek, Reparatur nach
`importRecipes()` in leere Bibliothek, `PZ.state` bleibt unangetastet,
Idempotenz bei bereits gültiger `activeId`, kein Crash bei komplett leerer
Bibliothek) — **577** Prüfungen insgesamt, alle grün (Headless-Edge-Dump,
vorher 567). Zusätzlich per gezieltem Headless-Edge-Skript exakt den vom
Nutzer gemeldeten Repro-Ablauf nachgestellt (Desktop UND Mobil): „Neues
Rezept anlegen" in leere Bibliothek → zu „Meine Rezepte" wechseln →
Kopieren (+1 Rezept), Umbenennen (Name geändert), Löschen (−1 Rezept) — alle
drei jetzt korrekt wirksam. Bonus-Szenario (Import in leere Bibliothek,
danach Kopieren) ebenfalls verifiziert funktionsfähig.

Kein `accessibility-expert`-Audit nötig (reine JS-Logik-Änderung in
`js/storage.js`/`js/main.js`, kein HTML-/CSS-/Markup-Bezug).

**Geändert:** `js/storage.js`, `js/main.js`, `tests/test.html`. `?v=` auf
`3.38.1` gezogen (Desktop + Mobil, Cache-Busting + `#appVersion`-Fußzeile
separat aktualisiert). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.38.1 - Bugfix activeId-Desync/` enthält den vollständigen
Schnappschuss.

## Fix: veralteter Hinweistext im Anleitungs-Banner (v3.38.0)

Bugfix, vom Nutzer klar umrissen (kein `/define-feature` nötig): Der graue
Banner über der Schritt-für-Schritt-Anleitung, der erscheint wenn noch keine
Start-/Zielzeit gesetzt ist (`guide.schedbar.noTime`, `js/guide.js`), verwies
noch auf „gib oben eine Start- oder Zielzeit an" — seit der Burgermenü-
Navigation (v3.26.0) liegen die Start-/Zielzeit-Felder aber im eigenen
Menüpunkt „Zeitplan" (`data-view="zeitplan"`), nicht mehr im selben Bereich
wie die Anleitung.

- **Text angepasst** UND **„Zeitplan" darin klickbar gemacht** (springt
  direkt zum Menüpunkt) — DE: „…lege im Bereich **Zeitplan** eine Start-
  oder Zielzeit fest…", EN: „…set a start or target time in the
  **Schedule** section…". Der Linktext kommt bewusst aus demselben
  `nav.zeitplan`-Key wie der Menüpunkt selbst (keine doppelte Übersetzung).
- **`js/guide.js`:** baut den Link als
  `<button type="button" class="schedbar-goto-zeitplan" data-goto="zeitplan">…</button>`
  und interpoliert ihn über einen neuen `{zeitplan}`-Platzhalter in
  `guide.schedbar.noTime`. Da `#guideSteps` bei JEDER Eingabe (Slider/
  Zahlenfeld) komplett per `innerHTML` neu aufgebaut wird, hängt der
  Klick-Handler NICHT direkt am Button, sondern ist EIN einziger, dauerhaft
  delegierter `click`-Listener auf dem stabilen `#guideSteps`-Container
  selbst (`e.target.closest('.schedbar-goto-zeitplan')`) — bleibt über
  beliebig viele Re-Renders hinweg zuverlässig funktionsfähig.
- **Neue Funktion `PZ.gotoView(view)`** (identisch in `pizza-rechner.html`
  und `pizza-rechner-mobile.html`, Burgermenü-Inline-Script): macht exakt
  dasselbe wie der bestehende `.nav-item`-Klick-Handler
  (`activateView(view); announceView(item.textContent); closeNav(false);
  focusView(view);`), aber aufrufbar von AUSSERHALB des Bereiche-Menüs —
  wiederverwendbar für künftige ähnliche Sprung-Links.
- **CSS** (`css/styles.css`, neue Klasse `.schedbar-goto-zeitplan`): sieht
  wie ein unterstrichenes Wort im Fließtext aus (kein sichtbarer
  Button-Rahmen), ist aber ein echter `<button>` (Tastatur/Screenreader-
  bedienbar), mit `:focus-visible`-Ring in Weiß (Banner hat dunklen
  Hintergrund).
- Gilt für Desktop UND Mobil (gemeinsamer `js/guide.js`-Code, identische
  `PZ.gotoView()`-Ergänzung in beiden HTML-Dateien).

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung):**
keine Befunde, keine Code-Änderungen nötig. Verifiziert per Headless-Edge
(echtes DOM/Klick-Verhalten, nicht nur Code-Lesen): Accessible Name des
Buttons = „Zeitplan"/„Schedule" (Linktext = Zielbereichs-Name ist eine
anerkannte WCAG-2.4.4-Technik, keine Namenskollision mit dem gleichnamigen
Menüpunkt, da dieser im geschlossenen Overlay per `hidden` aus dem
Accessibility-Tree entfernt ist); Fokus-Kontrast des `:focus-visible`-Rings
auf dem Banner-Gradient ~3,91–5,69:1 (über der 3:1-Schwelle für
Fokusindikatoren); Tab-Reihenfolge unauffällig; Live-Region-Ansage
(„Ansicht: Zeitplan") funktioniert nach Klick zuverlässig, inkl. bekanntem
Clear-then-delayed-set-Timing; Fokus landet korrekt auf der `<h2>` des
Zeitplan-Bereichs; delegierter Klick-Handler bleibt nach erzwungenem
Re-Render von `#guideSteps` funktionsfähig (kein Listener-Verlust, kein
doppeltes Auslösen).
- **Nebenbefund (nicht behoben, außerhalb des Scopes):** der reguläre
  Bannertext selbst (weißer Text auf dem helleren Ende des
  `.schedbar`-Gradients, `#8a7f76`) liegt bei ~3,91:1 Kontrast — unter der
  4,5:1-Schwelle für Fließtext (WCAG 1.4.3). Vorbestehender, von dieser
  Änderung unabhängiger Zustand des gesamten `.schedbar`-Bausteins (der neue
  Button erbt exakt dieselbe Farbe wie der umgebende Text) — fürs Backlog
  vermerkt.

**Tests:** reine Text-/Markup-/JS-Ergänzung ohne Berechnungslogik-Bezug —
`tests/test.html` bleibt unverändert bei **567** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert (Desktop + Mobil):
Klick auf den neuen Link wechselt zur Zeitplan-Ansicht (Rechner-Ansicht wird
`hidden`, Zeitplan-Ansicht sichtbar, passender Menüpunkt als aktiv markiert),
Link-Text übersetzt sich bei Sprachwechsel korrekt zu „Schedule".

**Geändert:** `js/i18n.js`, `js/guide.js`, `css/styles.css`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`. `?v=` auf `3.38.0`
gezogen (Desktop + Mobil, Cache-Busting + `#appVersion`-Fußzeile separat
aktualisiert). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.38.0 - Fix Anleitungs-Banner Zeitplan-Link/` enthält den
vollständigen Schnappschuss.

## Pizza-Glossar (v3.37.0)

Feature, vom Nutzer beauftragt: Ein neuer, eigenständiger Menü-Bereich mit
kurzen Lexikon-Artikeln, die Begriffe und Hintergrundwissen rund um Pizza
erklären — startend mit den vorgegebenen Beispielthemen (W-Wert, Pizzaofen
vs. Backofen, echte neapolitanische Pizza, San-Marzano-Tomaten) plus 20
weiteren, selbst recherchierten/verfassten Artikeln zu verwandten
Pizza-Themen. Alle 24 Artikel von Anfang an zweisprachig (DE/EN).

- **Neuer Menüpunkt „Glossar"** (`data-goto="glossar"`), eingehängt in die
  bereits bestehende unbenannte Utility-Zeile neben „Einstellungen" (kein
  eigenes `role="group"`, analog zu „Einstellungen" selbst — beide sind
  reine Utility-/Zusatz-Bereiche, keine der beiden thematischen Gruppen aus
  v3.36.0). DOM-Reihenfolge: Rechner → Rezepte → Zeitplan → Pizza Party →
  Glossar → Einstellungen.
- **Neue Ansicht** `data-view="glossar"` (Desktop: `<div class="card">`,
  Mobil: `<details class="card" open>`, identisch zum bestehenden Muster
  anderer einfacher Bereiche wie „Einstellungen") — eine Karte „Pizza-Glossar"
  mit Hinweistext und einem Container `<div id="glossaryList"></div>`.
- **Neues JS-Modul `js/glossary.js`:** rendert die 24 Artikel dynamisch als
  verschachtelte `<details class="glossary-item" data-id="…">`-Elemente
  INNERHALB der Karte (`<summary>` = Titel, `<div class="glossary-body">` =
  Text per `innerHTML`, darf `<p>`-Tags enthalten). `PZ.GLOSSARY_TOPICS`
  (Array von IDs) legt Reihenfolge/Themenliste fest — grob thematisch
  sortiert (Mehl-/Teig-Grundlagen → Vorteig-/Gärmethoden → Zutaten →
  Pizza-Stile), aber ohne sichtbare Zwischenüberschriften (Abgrenzung: keine
  Kategorisierung über eine einfache Liste hinaus). Aufklapp-Zustand bleibt
  bei Sprachwechsel erhalten (Re-Render merkt sich offene IDs vor dem
  Neuaufbau).
- **Die 24 Themen** (i18n-Keys `glossary.<id>.title`/`glossary.<id>.body`,
  DE+EN vollständig): W-Wert, 00-Mehl (Tipo 00), Bäckerprozente, Hydration,
  Gluten, Stretch & Fold, Windowpane-Test, Autolyse, Poolish, Biga,
  Kalte Gare, Malzmehl (Malto), Pizzaofen vs. Backofen, San-Marzano-Tomaten,
  Passata di Pomodoro, Fior di Latte vs. Mozzarella, Olivenöl (Extra
  Vergine), Frisches Basilikum, Echte neapolitanische Pizza (AVPN), Pizza
  Margherita (Namensgeschichte), Neapolitanische vs. Römische Pizza,
  New York Style Pizza, Detroit-Style Pizza, Sizilianische Pizza
  (Sfincione).
- **CSS** (`css/styles.css`, gemeinsam Desktop+Mobil): `.glossary-item`/
  `.glossary-body` — eigener Chevron-Marker (▾) analog zum bestehenden
  `details.card`-Akkordeon-Muster in `css/mobile.css`.
- **Abgrenzung eingehalten:** keine Verlinkung aus bestehenden
  Rechner-Hinweistexten in dieser ersten Fassung, keine Suchfunktion, keine
  nutzergenerierten/editierbaren Einträge — reine, feste Liste zum
  Nachlesen.

**Härten (gezielter `accessibility-expert`-Audit, nur diese neue
Funktion) — 1 Major-Befund gefunden und behoben:**
- **WCAG 4.1.2 (Name, Role, Value) — Major:** native `<details>`/`<summary>`-
  Semantik selbst war korrekt (Rolle „DisclosureTriangle", `expanded`-Status
  automatisch korrekt, per CDP-AX-Snapshot verifiziert) — das eigentliche
  Problem war der neue CSS-Chevron-Marker (`summary::after{content:'▾'}`):
  er wurde entgegen der Erwartung NICHT vom Accessible-Name-Algorithmus
  ignoriert, sondern hängte sich an jeden der 24 Artikel-Titel an (Accessible
  Name z. B. „W-Wert (Mehlstärke) ▾" statt „W-Wert (Mehlstärke)" — verifiziert
  per `Accessibility.getPartialAXTree`).
- **Fix:** CSS-Alt-Text-Syntax (`content:'▾' / '';`, CSS Generated Content
  Module Level 3) statt nur `content:'▾';` — verifiziert per CDP, dass der
  Accessible Name danach wieder sauber nur den Titel enthält, visuelle
  Darstellung unverändert (`computed ::after content: "▾" / ""`, per
  `getComputedStyle(el,'::after').content` gegengeprüft).
- **Nebenbefund proaktiv mitgefixt:** derselbe Marker-Fehler steckte auch im
  bereits bestehenden `details.card summary::after` in `css/mobile.css`
  (betraf ALLE Akkordeon-Karten auf Mobil, nicht nur das neue Glossar) — da
  Fix und Ursache identisch und der Aufwand trivial war, direkt mit
  behoben statt als offener Backlog-Punkt liegen zu lassen.
- Tab-Reihenfolge (Schließen → Rechner/Rezepte/Zeitplan → Pizza Party →
  Glossar → Einstellungen → Cross-Link) nach dem Hinzufügen des neuen
  Menüpunkts weiterhin korrekt. Enter/Space toggeln jeden der 24 Einträge
  zuverlässig (stichprobenartig per CDP-Keyboard-Events verifiziert). Kein
  Performance-/Fokus-Problem bei den >20 verschachtelten `<details>`
  festgestellt. Kontrast Chevron/Titeltext unproblematisch (`--muted`
  ~5,85:1, `--ink` sehr hoher Kontrast).

**Tests:** reine Anzeige-Funktion ohne Berechnungslogik-Bezug —
`tests/test.html` bleibt unverändert bei **567** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert: alle 24 Artikel
rendern mit korrektem Titel/Text (keine fehlenden/Fallback-i18n-Keys),
Aufklapp-Zustand bleibt bei DE↔EN-Sprachwechsel erhalten und Titel/Text
übersetzen sich korrekt, Chevron-Alt-Text-Fix per `getComputedStyle`
gegengeprüft.

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`js/glossary.js` (neu), `js/i18n.js`, `css/styles.css`, `css/mobile.css`.
`?v=` auf `3.37.0` gezogen (Desktop + Mobil, Cache-Busting +
`#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.37.0 - Pizza-Glossar/` enthält den vollständigen Schnappschuss.
Hinweis: wegen des Umfangs dieses Zyklus (24 zweisprachige Artikel) wurde
zusätzlich zwischendurch lokal committet (Sicherungs-Commit vor dem
Härten), auf ausdrücklichen Wunsch des Nutzers wegen zuvor aufgetretener
Sitzungsabbrüche.

## Gruppierte Menü-Navigation (v3.36.0)

Feature, vom Nutzer beauftragt: Das Bereiche-Menü clustert die vorhandenen
Menüpunkte sichtbar in zwei Gruppen mit kurzer Zwischenüberschrift —
„Teig-Rechner" (Rechner, Rezepte, Zeitplan) und „Pizza Party" (Pizza Party)
— getrennt von „Einstellungen" als eigenständigem Utility-Punkt. Hintergrund:
die bisher flache Menüliste verschleierte, dass Rechner/Rezepte/Zeitplan
zusammengehören (rund um ein Teig-Rezept), während Pizza Party ein
unabhängiges, eigenständiges Werkzeug ist.

- **Struktur (Desktop + Mobil, identisch):** die fünf Menüpunkte stecken
  jetzt in drei separaten `<ul class="nav-list">`-Blöcken statt einer
  einzigen Liste, getrennt durch das bereits bestehende
  `<div class="nav-divider" role="separator">`-Muster (wiederverwendet, wie
  in der Feature-Definition gefordert):
  „Teig-Rechner" (Rechner/Rezepte/Zeitplan) → Divider → „Pizza Party"
  (Pizza Party) → Divider → Einstellungen (ohne eigene Gruppenüberschrift,
  bleibt bewusst unbenannter Utility-Punkt) → Divider → Cross-Link
  (Mobil-/Desktop-Ansicht).
- **Neue Gruppen-Beschriftung:** `<div class="nav-group-title">` (neue
  CSS-Klasse, kleine graue Uppercase-Beschriftung) vor den ersten beiden
  Listen, i18n-Keys `nav.group.dough`/`nav.group.party`.
- **Keine funktionale Änderung:** Reihenfolge/Klickziele der Menüpunkte
  unverändert, DOM-Reihenfolge der `.nav-item`-Buttons bleibt
  Rechner→Rezepte→Zeitplan→Party→Einstellungen — die bestehende Tab-Trap-
  Logik (`focusablesInPanel()`) baut auf `querySelectorAll('.nav-item')` in
  DOM-Reihenfolge auf und funktioniert dadurch unverändert über mehrere
  `<ul>`-Elemente hinweg. Cross-Links (Zur Mobil-/Desktop-Ansicht)
  unangetastet.

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung) —
1 Blocker gefunden und behoben:**
- **WCAG 1.3.1 (Info and Relationships):** `.nav-group-title` war zunächst
  ein rein visuelles `<div>` ohne jede programmatische Verbindung zur
  folgenden `<ul>` — beim Tab-Fokussieren eines Menüpunkts (z. B. „Rechner")
  kam für Screenreader-Nutzer **kein** Kontext zur Gruppe „Teig-Rechner" an
  (per Headless-Edge-Accessibility-Snapshot verifiziert: nur ein isolierter
  `text`-Knoten, keine Verbindung). Nur sehende Nutzer sahen die Cluster-
  Bildung — echter Informationsverlust, kein „nice to have".
- **Fix:** `id="navGroupDough"`/`id="navGroupParty"` auf die
  `.nav-group-title`-Divs, `role="group" aria-labelledby="…"` auf die jeweils
  zugehörige `<ul class="nav-list">` — konsistent mit bereits etabliertem
  Muster im Projekt (`#method`, `#coldStage`, `#partyIngredientRows` nutzen
  dasselbe `role="group"`/`aria-labelledby`-Paar). „Einstellungen" bekam
  bewusst **keine** Gruppierung (kein `role="group"`, keine
  `.nav-group-title`) — bleibt wie gefordert eigenständiger Utility-Punkt.
  Vorher/nachher per AX-Snapshot verifiziert: vorher `text: Teig-Rechner` /
  `list`, nachher `text: Teig-Rechner` / `group "Teig-Rechner"`.
- Tab-Reihenfolge/Fokus-Trap nach dem Fix erneut geprüft: unverändert
  korrekt (Schließen → 5 Bereichs-Buttons → Cross-Link → Wrap zurück).
- Kontrast `.nav-group-title` (`--muted` #6e6359 auf `--card` #ffffff,
  11px): **≈5,83:1**, über der WCAG-AA-Schwelle 4,5:1.

**Tests:** reine Markup-/Struktur-Änderung ohne Auswirkung auf
Rechenlogik — `tests/test.html` bleibt unverändert bei **567** Prüfungen,
alle grün (Headless-Edge-Dump). Kein `test-generator`-Lauf nötig.
Zusätzlich per gezieltem Headless-Edge-Skript interaktiv verifiziert
(Desktop + Mobil): Panel-Kinder-Reihenfolge exakt wie geplant
(Titel → Liste → Divider → Titel → Liste → Divider → Liste →
Divider → Cross-Link), Klick auf jeden Menüpunkt in jeder Gruppe schaltet
korrekt die zugehörige Ansicht frei, DOM-Reihenfolge der `.nav-item`-Buttons
unverändert, Pizza-Party-Quickbar (v3.35.0) funktioniert weiterhin korrekt
in Kombination mit der neuen Navigation.

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`css/styles.css`, `js/i18n.js`. `?v=` auf `3.36.0` gezogen (Desktop + Mobil,
Cache-Busting + `#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.36.0 - Gruppierte Menü-Navigation/` enthält den vollständigen
Schnappschuss.

## Sticky Quickbar für Pizza Party auf Mobil (v3.35.0)

Feature, vom Nutzer beauftragt: Eine kompakte, sticky Quickbar am unteren
Bildschirmrand für den Pizza-Party-Bereich auf Mobil, nach demselben Muster
wie die bereits bestehende Quickbar im Teig-Rechner — bleibt beim Auswählen/
Anpassen der Pizzen-Stückzahlen sichtbar, mit Sprung-Link zur Zutatenliste.

- **Neu:** `<div class="quickbar" id="partyQuickbar" data-view="party" hidden>`
  in `pizza-rechner-mobile.html` — enthält NUR einen Sprung-Link
  (`.qb-jump`, kompakte Kennzahl `#qbPartyCount`, z. B. „3 Pizzen insgesamt"),
  bewusst OHNE Speichern-Button (Party-Daten persistieren automatisch bei
  jeder Mengenänderung, kein manueller Speicherschritt wie beim Rechner).
- **Sichtbarkeits-Umbau der bestehenden Rechner-Quickbar:** bekam zusätzlich
  `data-view="rechner"` (vorher kein `data-view`-Attribut, dadurch auf ALLEN
  Ansichten permanent sichtbar — auch mit veralteten Rechner-Daten z. B. in
  der Party-Ansicht). Beide Quickbars nutzen jetzt dieselbe, bereits
  etablierte `[data-view]`-Sichtbarkeits-Infrastruktur (`activateView()`) wie
  alle Bereichs-Container — notwendige Anpassung, damit nicht zwei
  überlappende sticky Bottom-Bars gleichzeitig sichtbar sind (der Kern des
  Features "nur in der Party-Ansicht sichtbar" verlangt zwingend, dass die
  andere Quickbar dafür ausgeblendet wird). Inhalt/Verhalten der
  Rechner-Quickbar selbst (Text, Speichern-Button-Logik) bleibt unverändert.
- **JS (Inline-Script):** `MutationObserver` auf `#partyResultSummary`
  spiegelt dessen Text (von `js/party.js` `renderPartyResult()` gesetzt) in
  `#qbPartyCount`. Ist noch keine Pizza ausgewählt, ist die Quelle leer —
  eigener kurzer Platzhaltertext (`quickbar.partyNoneYet`) statt eines langen
  Hinweissatzes. Klick auf den Sprung-Link öffnet zusätzlich per JS die
  standardmäßig eingeklappte `<details class="card">` der Zutatenliste
  (Sicherheitsnetz zusätzlich zum nativen Browser-Verhalten, das geschlossene
  `<details>`-Vorfahren bei Fragment-Navigation ohnehin automatisch öffnet).
  Sprachwechsel-Hook (`PZ.i18nOnChange`) übersetzt den Platzhaltertext neu,
  falls die Quelle leer bleibt (der `MutationObserver` allein würde das nicht
  auslösen, da keine DOM-Änderung stattfindet).
- **i18n:** neue Keys `quickbar.jumpToPartyResult`, `quickbar.partyNoneYet`.
- **CSS:** eine neue Zeile `#partyResultSummary{scroll-margin-top:16px;}`
  (`css/mobile.css`, analog zu `#result{scroll-margin-top:16px;}`) — kein
  neues `.quickbar`-Styling nötig, die Party-Quickbar erbt die bestehende
  `.quickbar`/`.qb-jump`-Optik vollständig.
- **Desktop unverändert** (Abgrenzung der Feature-Definition) — die sticky
  Seitenleiste aus v3.34.0 deckt dasselbe Bedürfnis dort bereits ab.

**Tests:** reine Mobil-UI-/Markup-Änderung ohne Logikbezug —
`tests/test.html` bleibt unverändert bei **567** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert: Wechsel Rechner→Party
blendet die Rechner-Quickbar aus und die Party-Quickbar ein (und umgekehrt);
`#qbPartyCount` spiegelt „3 Pizzen insgesamt" korrekt nach einer
Mengenänderung (inkl. Microtask-Timing der `MutationObserver`-Zustellung);
Rückfall auf „Noch keine Pizza ausgewählt" bei 0 Pizzen; Sprachwechsel
übersetzt den Platzhaltertext korrekt zu „No pizza selected yet"; Klick auf
den Sprung-Link öffnet die zuvor geschlossene Zutatenliste-Card.

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung):**
keine Befunde, keine Code-Änderungen nötig — Beschriftung des Sprung-Links
identisch zum bestehenden Muster der Rechner-Quickbar, Touch-Ziel gemessen
461×44px (deutlich über dem 44×44px-Minimum, da kein zweiter Button die
Breite teilt), Fokus wechselt beim Ansichtswechsel sauber auf die neue
Bereichsüberschrift (kein verwaistes Fokus-Ziel, identisches `focusView()`-
Muster wie bei allen anderen Bereichswechseln), keine `aria-live`-Ergänzung
nötig (konsistent mit dem bestehenden `#qbTotal`/`#qbBalls`-Muster der
Rechner-Quickbar). Kein separater `mobile-optimizer`-Lauf nötig (Touch-Ziel-
Größe und Safe-Area bereits durch den Accessibility-Audit abgedeckt bzw. von
der unveränderten `.quickbar`-Basis geerbt).

**Nebenbei verifiziert (Nutzer-Meldung, siehe Rückmeldung des Nutzers während
dieses Zyklus):** ein gemeldeter Verdacht „Kopieren/Umbenennen-Button
funktionieren nach dem Speichern eines Teigrezepts nicht" ließ sich in drei
Szenarien (erstes Speichern, Überschreiben eines aktiven Rezepts, Speichern
über die Quick-Bar `#qbSave`) auf Desktop UND Mobil NICHT reproduzieren —
`activeId`/`#recipeSelect`-Wert blieben in allen Fällen synchron, beide
Buttons funktionierten korrekt. Vermutlich ein zwischenzeitlich erwischter
Arbeitsstand während der laufenden Sticky-Layout-/Quickbar-Änderungen dieses
Zyklus. Keine Code-Änderung nötig.

**Geändert:** `pizza-rechner-mobile.html`, `js/i18n.js`, `css/mobile.css`.
`?v=` auf `3.35.0` gezogen (Desktop + Mobil, Cache-Busting +
`#appVersion`-Fußzeile separat aktualisiert, auch wenn Desktop inhaltlich
unverändert blieb — Versions-Konsistenz).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py`).
`Versionen/v3.35.0 - Sticky Quickbar Pizza-Party Mobil/` enthält den
vollständigen Schnappschuss.

## Sticky Zutatenliste im Pizza-Party-Bereich (v3.34.0)

Feature, vom Nutzer beauftragt: Die aggregierte Zutatenliste im
Pizza-Party-Bereich wird auf Desktop-Breite als sticky Seitenleiste
dargestellt, genau wie das Ergebnis-Panel im Teig-Rechner — bleibt beim
Durchscrollen der Pizza-Auswahl weiterhin sichtbar.

- **Layout-Umbau in `pizza-rechner.html`:** die Party-Ansicht
  (`data-view="party"`) nutzte bisher `class="wrap view single"` (erzwungene
  einspaltige Darstellung, alle drei Cards untereinander in einer
  `.controls-col`) — jetzt `class="wrap view"` (ohne `single`), identisches
  Zwei-Spalten-Grid-Muster wie der Teig-Rechner
  (`.wrap{grid-template-columns:1fr}`, ab 860px Breite
  `grid-template-columns:1fr 360px`, `css/styles.css`).
- **Linke Spalte** (`.controls-col`): „Pizza Party" (Pizzen-Auswahl) und
  „Eigene Pizza anlegen" — unverändert, nur aus der bisherigen gemeinsamen
  dritten Karte herausgelöst.
- **Rechte Spalte** (neu: `<div class="result" id="partyResult">`, analog zu
  `#result` im Teig-Rechner): enthält nur noch die Karte „Zutatenliste für
  die Party" — durch die bereits bestehende, generische `.result{position:
  sticky;top:20px;}`-Regel automatisch sticky, keine neue CSS-Regel nötig.
- **Mobil unverändert** (Abgrenzung der Feature-Definition): 
  `pizza-rechner-mobile.html` wurde nicht angefasst, bleibt einspaltiges
  Akkordeon wie bisher.
- **Keine Änderung** an der Berechnungs-/Aggregationslogik der Zutatenliste
  (`js/party.js` unangetastet) — reine Layout-Maßnahme.

**Tests:** reine CSS-/Markup-Umstrukturierung ohne Logikänderung —
`tests/test.html` bleibt unverändert bei **567** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert: bei ≥860px Breite
`grid-template-columns` der Party-Ansicht = `560px 360px` (Zwei-Spalten),
`#partyResult` `position:sticky;top:20px`, rechte Spalte visuell rechts von
der linken (`offsetLeft` verglichen); bei schmaler Fensterbreite (390px)
fällt das Grid korrekt auf eine Spalte zurück (identisches, bereits
etabliertes Verhalten wie beim Teig-Rechner — `.result` bleibt technisch
weiterhin sticky positioniert, wie im Teig-Rechner auch schon immer, nur
`@media print` setzt `position:static`, kein neues Verhalten). DOM-Reihenfolge
(Controls-Spalte vor Ergebnis-Spalte im Markup, wie beim Teig-Rechner)
bestätigt — Tab-/Lesereihenfolge unverändert gegenüber dem bisher schon
etablierten, geprüften Muster. Kein dediziertes `accessibility-expert`-Audit
nötig (reine Wiederverwendung des bereits vorhandenen, andernorts geprüften
Zwei-Spalten/Sticky-Musters, keine neuen interaktiven Elemente).

**Geändert:** `pizza-rechner.html`. `?v=` auf `3.34.0` gezogen (Desktop +
Mobil, Cache-Busting + `#appVersion`-Fußzeile separat aktualisiert, auch
wenn Mobil inhaltlich unverändert blieb — Versions-Konsistenz).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py` — Quelle ist `pizza-rechner-mobile.html`, daher
inhaltlich unverändert, nur der `?v=`-Stand zieht mit).
`Versionen/v3.34.0 - Sticky Zutatenliste Pizza-Party/` enthält den
vollständigen Schnappschuss.

## "Name für neues Rezept"-Feld ersetzt durch Rezept-Duplizieren (v3.33.0)

Feature, vom Nutzer beauftragt: Das Namensfeld + „Neu"-Button in der Card
„Meine Rezepte" wurde entfernt und durch eine „Kopieren"-Funktion ersetzt, die
das aktuell im Dropdown ausgewählte gespeicherte Rezept als neue Kopie anlegt.
Hintergrund: Das alte Feld (`#recipeName`/`#recipeSaveNew` → `PZ.saveAsNew()`)
legte ein neues Rezept aus dem **Live-Stand des Hauptrechners** unter einem
eingegebenen Namen an — das wurde als verwirrend/redundant neben dem separaten
„Neues Rezept anlegen"-Formular empfunden (funktional unterschiedlich, aber
in der UI zu ähnlich).

- **Entfernt:** `#recipeName` (Textfeld + `.visually-hidden`-Label) und
  `#recipeSaveNew` („Neu") aus der Card „Meine Rezepte" — Desktop + Mobil.
  `PZ.saveAsNew()` selbst bleibt als Funktion unangetastet in `js/storage.js`
  (falls künftig wieder gebraucht), nur die UI-Anbindung an diese Card wurde
  entfernt.
- **Neu:** Button `#recipeDuplicate` („Kopieren"/„Duplicate", i18n-Key
  `btn.duplicate`) direkt unter `#recipeSelect`, in derselben Zeile wie die
  bereits bestehenden Buttons `#recipeRename`/`#recipeDelete` — jetzt eine
  Drei-Buttons-Reihe: Kopieren / Umbenennen / Löschen.
- **Neue Funktion `PZ.duplicateRecipe(id)`** (`js/storage.js`): dupliziert
  GENAU den gespeicherten `state` des Quell-Rezepts (per id, **nicht**
  `PZ.state`/den evtl. ungespeicherten Live-Stand) als neuen, unabhängigen
  Eintrag. Name automatisch „Kopie von {name}", bei Kollision fortlaufend
  nummeriert („Kopie von {name} (2)", „(3)", …, analog zu
  `uniqueImportName()`). Rührt `activeId` bewusst nicht selbst an — das
  übernimmt der Aufrufer.
- **Wiring in `js/main.js`:** Klick auf „Kopieren" → Guard
  `if (!recipes.length || !id) return;` (identisch zum bestehenden Muster von
  `#recipeRename`/`#recipeDelete`) → `PZ.duplicateRecipe(id)` →
  `PZ.loadRecipe(rec.id)` (macht die Kopie sofort aktiv, ausgewählt im
  Dropdown und lädt sie in den Hauptrechner — ruft intern bereits
  `refreshRecipeSelect()` auf) → Button-Text kurz zu „✓ Kopiert"
  (`main.duplicated`), 1,4 s, exakt das etablierte `#saveBtn`-Muster.
- **Keine Änderung** an `save()`/`#saveBtn` (überschreibt weiterhin nur das
  aktive Rezept) oder am unabhängigen „Neues Rezept anlegen"-Formular
  (`js/newrecipe.js`, nutzt weiterhin `addRecipeFromState()`).
- **i18n:** neue Keys `btn.duplicate`, `main.duplicated`,
  `storage.duplicateName`. Tote Keys entfernt: `label.newRecipeName`,
  `placeholder.newRecipeName` (nach Entfernung nirgends mehr referenziert,
  Codesuche bestätigt).

**Tests:** 9 neue Unit-Tests für `PZ.duplicateRecipe()` in `tests/test.html`
(neues Rezept anlegen, unabhängige id, Namensgebung inkl. Kollisions-
Nummerierung, 1:1-Zustandsübernahme, Unabhängigkeit vom späteren Live-Stand,
`activeId` bleibt unverändert, `null` bei unbekannter id statt Crash) —
**567** Prüfungen insgesamt, alle grün (Headless-Edge-Dump, vorher 558).
Zusätzlich per gezieltem Headless-Edge-Skript interaktiv verifiziert:
Klick auf „Kopieren" legt die Kopie an, wählt sie im Dropdown aus, `activeId`
synchronisiert sich korrekt, Button zeigt „✓ Kopiert", Klick bei leerer
Bibliothek wirft keinen Fehler (stiller No-op).

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung):**
keine Befunde, keine Code-Änderungen nötig — `#recipeDuplicate` ist
strukturell identisch zu den beiden Nachbar-Buttons (reiner
`<button type="button">` mit aussagekräftigem sichtbaren Text), Tab-
Reihenfolge nach Entfernen von `#recipeName` weiterhin logisch
(Select → Kopieren → Umbenennen → Löschen), Text-Austausch „✓ Kopiert"
verliert keinen Fokus (`PZ.loadRecipe()` ersetzt nur den Inhalt von
`#recipeSelect`, nicht den Button selbst) — verhält sich exakt wie das
etablierte `#saveBtn`-Muster, kein zusätzliches `aria-live` nötig. Der
Guard bei leerer Bibliothek ist konsistent mit dem bereits akzeptierten
Bestandsverhalten von `#recipeRename`/`#recipeDelete`.

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`, `js/main.js`,
`js/storage.js`, `js/i18n.js`, `tests/test.html`. `?v=` auf `3.33.0` gezogen
(Desktop + Mobil, Cache-Busting + `#appVersion`-Fußzeile separat
aktualisiert). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.33.0 - Rezept-Duplizieren/` enthält den vollständigen
Schnappschuss.

## Bugfix: inkonsistente Dezimaltrennzeichen bei Regler-Wertanzeigen (v3.32.0)

Bugfix, vom Nutzer selbst diagnostiziert: Auf Desktop zeigt jedes Regler-Feld
(Salz, Öl, Zucker, Hefemenge) den aktuellen Wert **zweimal** — einmal als rote
Zahl im Label (`#saltV`/`#oilV`/`#sugarV`/`#yeastV`, per `link()` in `js/ui.js`
bzw. `nrLink()` in `js/newrecipe.js`) und einmal im nativen
`<input type="number">` darunter. Die rote Zahl kam bisher immer über
`val.toFixed(decimals)` zustande (fest mit Punkt, z. B. „2.8"), während der
native `<input type="number">` browserseitig je nach OS-Locale gerendert wird
(z. B. deutsches Windows/Edge: „2,8" mit Komma) — **derselbe Wert sah dadurch
wie zwei unterschiedliche Zahlen aus.**

- **Fix:** `fmt()` in `link()` (`js/ui.js`) und in `nrLink()`
  (`js/newrecipe.js`) hängt jetzt `.replace('.', ',')` an `toFixed()` an — die
  rote Wertanzeige normiert sich fest auf Komma, unabhängig von der OS-Locale
  des Browsers (analog zum bereits bestehenden Komma-Format der Pizza-Party-
  Zutatenliste, `fmtAmount()` in `js/party.js`). `state[key]` bleibt intern
  ein normaler JS-Fließkommawert mit Punkt — nur die **Anzeige** wird
  umformatiert, nirgends wird aus dem angezeigten Text zurückgeparst (per
  Codesuche verifiziert: keine Stelle liest `#saltV`/`#yeastV` &c. per
  `parseFloat` wieder ein).
- **Statische HTML-Fallback-Texte mitgezogen:** die Werte, die vor dem ersten
  JS-Rendering (`applyState()`/`PZ.calc()`) im Markup stehen (`saltV="2.8"`,
  `oilV="2.0"`, `sugarV="0.0"`, `yeastV="0.30"` — sowohl im Hauptformular als
  auch im unabhängigen „Neues Rezept anlegen"-Formular) wurden ebenfalls auf
  Komma umgestellt, damit auch der allererste Seitenaufruf (vor jeder
  Nutzerinteraktion bzw. bei fehlendem gespeicherten Rezept, `PZ.load()` ruft
  dann kein `applyState()` auf) schon konsistent ist.
- **Mobil ist von diesem Bug nicht betroffen** (Codesuche bestätigt: die
  Mobil-Seite hat für Salz/Öl/Zucker/Hefe **keine** rote Zahl-Duplikat-Anzeige
  im Label — nur den nativen `<input type="number">` selbst, also keine zwei
  Darstellungen desselben Werts, die auseinanderlaufen könnten). Entsprechend
  wurden auf `pizza-rechner-mobile.html` keine Markup-Änderungen nötig. Die
  JS-Fix-Logik in `link()` (geteiltes `js/ui.js`) ist trotzdem korrekt: sollte
  Mobil künftig doch einen `#xxxV`-Span für ein Feld bekommen, greift der Fix
  automatisch mit.
- **`ddtV` (Ziel-Teigtemperatur) bewusst nicht angefasst:** zeigt als
  statischer Fallback „24" (kein Dezimalpunkt) trotz `decimals:1` in der
  `link()`-Konfiguration — ein vorbestehender, von diesem Bug unabhängiger
  Anzeige-Sonderfall (keine Nachkommastelle bei ganzzahligen Default-Werten
  vor der ersten Interaktion), außerhalb des gemeldeten Scopes.

**Tests:** reine Anzeige-Formatierung, keine Berechnungslogik geändert —
`tests/test.html` bleibt unverändert bei **558** Prüfungen, alle grün
(Headless-Edge-Dump; keine bestehende Prüfung liest die betroffenen
`#xxxV`-Spans, daher keine Anpassung nötig). Kein `test-generator`-Lauf nötig.
Zusätzlich per gezieltem Headless-Edge-Skript interaktiv verifiziert:
`PZ.set.yeast(0.35)` → `#yeastV` zeigt „0,35"; Tippen „0.42" ins Zahlenfeld →
`#yeastV` zeigt „0,42" und `state.yeast` bleibt korrekt `0.42` (intern
weiterhin Punkt); `aria-valuetext` des Sliders zeigt ebenfalls Komma
(„3,3 Prozent Salz" statt „3.3 Prozent Salz" — bei `lang="de"` liest ein
deutschsprachiger Screenreader das korrekt als „drei Komma drei" vor, keine
Regression). Kein dediziertes `accessibility-expert`-Audit nötig (reine
Textformatierungs-Änderung ohne neue/veränderte interaktive Struktur, analog
zur Begründung bei v3.23.0/v3.30.1/v3.30.2).

**Geändert:** `js/ui.js`, `js/newrecipe.js`, `pizza-rechner.html` (nur
statische Fallback-Texte). `?v=` auf `3.32.0` gezogen (Desktop + Mobil,
Cache-Busting + `#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python
build-mobile-standalone.py` — inline-JS betroffen, auch wenn kein
Mobil-Markup geändert wurde).
`Versionen/v3.32.0 - Bugfix Dezimaltrennzeichen Regler-Wertanzeigen/` enthält
den vollständigen Schnappschuss.

## Sichtbare Kopplung Vorteig-Reife ↔ Hefemenge (v3.31.0)

Feature, vom Nutzer beauftragt: Der Hefemenge-Regler wird bei aktiver Vorteig-Reife-
Auswahl (Biga/Poolish) optisch als abhängig/gesperrt dargestellt, statt wie ein
normaler frei einstellbarer Regler auszusehen. Hintergrund: `PZ.selectPrefStage()`
(`js/ui.js`) setzt die Hefemenge automatisch passend zur gewählten Reifestufe
(z. B. „24 h · 0,3 %") — das war der Optik nach bisher nicht klar erkennbar, Nutzer
könnten fälschlich annehmen, der Regler sei unabhängig einstellbar.

- **Neuer Feld-Wrapper mit ID:** `#yeastField` (Desktop + Mobil) sowie
  `#nrYeastField` im unabhängigen „Neues Rezept anlegen"-Formular (dieselbe
  Kopplung existiert dort ebenfalls, `js/newrecipe.js`), jeweils um den bereits
  bestehenden `.field`-Container für die Hefemenge.
- **Neues Schloss-Badge** `#yeastCoupledBadge` / `#nrYeastCoupledBadge`
  (`🔒 An Reifestufe gekoppelt` / `🔒 Locked to maturity stage`, neuer i18n-Key
  `label.yeastCoupled`) im Label, standardmäßig per `hidden`-Attribut unsichtbar.
- **CSS:** `.field.coupled input[type=range]`/`input[type=number]` werden
  ausgegraut (reduzierte Opazität, `--muted`-Farbe) — rein visuell, **kein**
  `disabled`-Attribut und **kein** `aria-disabled` (der Regler bleibt technisch
  voll bedienbar: `link()` ruft bei jeder Eingabe weiterhin `PZ.calc()` auf, ein
  Feintuning per Hand ist laut bestehendem Hinweistext `hint.yeast.pref`
  ausdrücklich möglich — `aria-disabled` hätte Screenreader-Nutzern fälschlich
  signalisiert, der Regler nehme keine Eingaben an, s. u.).
- **JS:** `applyMethod()` (`js/ui.js`) und `nrApplyMethod()` (`js/newrecipe.js`)
  toggeln zusätzlich zum bereits bestehenden Verhalten (Hefe-Pills ausblenden,
  Hint-Text wechseln) `classList.toggle('coupled', isPref)` auf dem Feld-Wrapper
  und `hidden = !isPref` auf dem Badge.
- **Keine Änderung an der Kopplungslogik selbst** — `selectPrefStage()` setzt
  weiterhin automatisch die Hefemenge, exakt wie zuvor.

**Härten (gezielter `accessibility-expert`-Audit, nur diese Änderung, nicht
Vollaudit):** per Headless-Edge/CDP mit echtem Accessible-Name/-Description-
Auslesen verifiziert.
- Kopplungs-Info ist für Screenreader beim Fokussieren des Reglers bereits
  korrekt erkennbar: das Badge liegt innerhalb des per `aria-labelledby`
  referenzierten Labels, der berechnete Accessible Name wechselt automatisch
  zwischen `"Hefemenge 0.30 %"` (Direkt) und `"Hefemenge 🔒 An Reifestufe
  gekoppelt 0.30 %"` (Biga/Poolish).
- **Fix:** `aria-describedby` auf `#yeast`/`#yeastN` ergänzt, damit der bereits
  vorhandene, sich dynamisch ändernde Hint-Text (`#yeastHint`, wechselt zu
  „Wird von der Vorteig-Reife oben gesetzt. Feintuning per Regler möglich." bei
  aktiver Kopplung) auch programmatisch mit dem Regler verknüpft ist und beim
  Fokussieren vorgelesen wird — wichtig, weil das 🔒-Badge für sich genommen als
  „komplett gesperrt" missverstanden werden könnte. Desktop: `aria-describedby`
  neu gesetzt. Mobil: zu vorhandenem `aria-describedby="yeastUnit"` ergänzt
  (→ `"yeastUnit yeastHint"`).
- Kontrast `.coupled-badge` (Text `--muted` #6e6359 auf `--bg` #faf6f0, 11px/600
  = normaler Text): **~5,43:1**, über der WCAG-AA-Schwelle 4,5:1.
- `hidden`-Attribut robust in allen 4 Kontexten (Desktop-Haupt, Desktop-„Neues
  Rezept", Mobil-Haupt, Mobil-„Neues Rezept") per Methodenwechsel verifiziert.
- Badges sind reine `<span>`s ohne `tabindex` — kein Einfluss auf Tab-Reihenfolge
  oder Fokus-Ring.

**Tests:** reine Markup-/CSS-/Attribut-Ergänzung ohne Auswirkung auf
Rechenlogik — `tests/test.html` bleibt unverändert bei **558** Prüfungen, alle
grün (Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (keine
Logikänderung in `js/calc.js`/`js/schedule.js`/`js/guide.js`). Zusätzlich per
gezieltem Headless-Edge-Skript interaktiv verifiziert: Kopplungs-Klasse/Badge
schalten beim Wechsel Direkt→Biga→Direkt→Poolish korrekt um, Badge-Text
übersetzt sich bei Sprachwechsel korrekt (DE↔EN).

**Geändert:** `pizza-rechner.html`, `pizza-rechner-mobile.html`, `js/ui.js`,
`js/newrecipe.js`, `css/styles.css`, `js/i18n.js`. `?v=` auf `3.31.0` gezogen
(Desktop + Mobil, Cache-Busting + `#appVersion`-Fußzeile separat aktualisiert).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.31.0 - Sichtbare Kopplung Vorteig-Reife-Hefemenge/` enthält den
vollständigen Schnappschuss.

## Textkorrektur Kaltgare-Segment-Titel (v3.30.2)

Kleiner direkter Text-Fix, vom Nutzer beauftragt (keine Logik-/Strukturänderung).
Der Titel über dem Kaltgare-Segment („Als Teiglinge (praktisch)" / „Im Stück
(klassisch)") lautete „Kalte Gare — wo verbringt der Teig die Kühlschrank-Zeit?"
und wurde als sprachlich holprig/redundant empfunden („Kalte Gare" und
„Kühlschrank-Zeit" sagen im selben Satz zweimal dasselbe).

- **Neuer Text:** „Wie verbringt der Teig die Kühlschrank-Zeit?" (DE) /
  „How does the dough spend its fridge time?" (EN) — ersetzt den alten Titel
  vollständig, gleicher i18n-Key `label.coldStage`.
- **Geändert:** `js/i18n.js` (Wörterbucheintrag `label.coldStage`, DE + EN),
  statischer Fallback-Text im `<label id="coldStageLabel">` in
  `pizza-rechner.html` und `pizza-rechner-mobile.html` (beide auf den neuen
  Text angeglichen, damit vor dem JS-Rendering kein alter Text aufblitzt).

**Tests:** reine Textänderung ohne Auswirkung auf Rechenlogik oder Struktur —
`tests/test.html` bleibt unverändert bei **558** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (kein Logik-Code
geändert). Kein `accessibility-expert`-Lauf nötig (reiner Label-Text, keine
neue/veränderte interaktive Struktur).

**Geändert:** `js/i18n.js`, `pizza-rechner.html`, `pizza-rechner-mobile.html`.
`?v=` auf `3.30.2` gezogen (Desktop + Mobil, Cache-Busting + `#appVersion`-
Fußzeile separat aktualisiert, wie seit v3.28.1 bekannt). Alte Textreste per
Codesuche verifiziert (keine verbleibenden Referenzen außer im vor dem
Rebuild noch alten Standalone-File).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.30.2 - Textkorrektur Kaltgare-Segment-Titel/` enthält den
vollständigen Schnappschuss.

## Desktop-Untertitel entfernt (v3.30.1)

Kleiner direkter Fix, vom Nutzer beauftragt (Desktop→Mobil-Angleichung, kein Feature).
Der Header-Untertitel („Neapolitanisch · Biga · Poolish — komplett offline") und die
zwei Footer-Beschreibungszeilen („Alles wird lokal in deinem Browser gerechnet &
gespeichert …" / „Bäckerprozente — Wasser, Salz & Hefe immer relativ zur Mehlmenge …")
existierten bisher nur auf Desktop (`pizza-rechner.html`) — die Mobil-Seite
(`pizza-rechner-mobile.html`) hatte sie nie (Header nur `<h1>🍕 Teigmeister</h1>`,
Footer nur die Versionsnummer). Desktop wurde jetzt exakt an diesen bereits
bestehenden Mobil-Zustand angeglichen.

- **Entfernt aus `pizza-rechner.html`:** das `<p data-i18n="app.tagline">`-Element
  direkt unter dem `<h1>` im Header; die beiden `<span data-i18n-html="footer.line1">`/
  `<span data-i18n-html="footer.line2">`-Zeilen im Footer (samt ihrer `<br>`-Trenner)
  — der Footer zeigt jetzt nur noch die Versionsnummer, identisch zur Mobil-Seite.
- **Tote i18n-Keys entfernt:** `app.tagline`, `footer.line1`, `footer.line2` wurden
  nach der Entfernung nirgends mehr referenziert (Codesuche über alle `.html`/`.js`-
  Dateien bestätigt das) und wurden daher auch aus dem Wörterbuch (`js/i18n.js`)
  gelöscht statt als toter Code liegen zu bleiben.
- **Mobil-Seite unverändert** (hatte diese Texte nie) — nur die `?v=`-Cache-Busting-
  Parameter wurden zur Versions-Konsistenz mit hochgezogen, obwohl
  `pizza-rechner-mobile.html` inhaltlich nicht geändert wurde.

**Tests:** reine Markup-/Wörterbuch-Entfernung ohne Auswirkung auf Rechenlogik —
`tests/test.html` bleibt unverändert bei **558** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig. Kein
`accessibility-expert`-Lauf nötig (reine Entfernung von dekorativem Text, keine neue
interaktive Struktur — analog zur Begründung bei v3.23.0 „Card-Überschriften ohne
Nummerierung"). Visuell per Headless-Edge-Dump verifiziert: Header zeigt nur noch
`<h1>`, Footer nur noch die Versionsnummer, keine JavaScript-Konsolenfehler.

**Geändert:** `pizza-rechner.html`, `js/i18n.js`. `?v=` auf `3.30.1` gezogen
(Desktop + Mobil, Cache-Busting + Footer-Version — inkl. dem seit v3.28.1 bekannten
Stolperstein, dass die bloße `#appVersion`-Fußzeile separat vom `sed`-basierten
`?v=`-Bump aktualisiert werden muss).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.30.1 - Desktop-Untertitel entfernt/` enthält den vollständigen
Schnappschuss.

## Pizza-Party zurücksetzen (v3.30.0)

Kleines neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt.
Direkt im Anschluss an „Zutaten-Info je Pizza" (v3.29.0) im selben Pizza-Party-Bereich
umgesetzt — beide Vorhaben wurden im selben Arbeitsgang implementiert, aber bewusst
in zwei getrennte, eigenständige Versions-Zyklen mit je eigenem Commit aufgeteilt
(per gezielter Git-Patch-Trennung der bereits interleavten Änderungen), damit die
Versionshistorie weiterhin ein Feature = ein Commit abbildet.

- **Neuer Button „Alle zurücksetzen"** (`#partyResetBtn`) direkt unter der
  Pizzenliste in der „Pizza Party"-Karte (Desktop + Mobil, identisches Markup).
  Setzt über die neue, reine Datenfunktion `PZ.partyResetAllQuantities()`
  (`js/party.js`) alle Stückzahlen — Presets **und** eigene Pizzen — auf 0 zurück,
  in einem einzigen `writeRaw()`-Aufruf statt N einzelner `setQty()`-Aufrufe.
  **Löscht dabei bewusst KEINE eigenen Pizzen** (Abgrenzung laut Feature-Auftrag) —
  nur die Auswahl/Mengen werden zurückgesetzt, die Pizza-Bibliothek bleibt
  unangetastet.
- **Kein Bestätigungsdialog** (bewusste Entscheidung: reversible, geringschwellige
  Aktion, anders als das mit `confirm()` abgesicherte Löschen einer eigenen Pizza,
  das unwiederbringliche Nutzerdaten entfernt).
- **Accessibility-Fix während des gezielten Audits** (`accessibility-expert`-Agent):
  **WCAG 4.1.3 (Status Messages, Level AA)** — der Reset-Klick ändert alle
  Stepper-Werte der Liste gleichzeitig, ohne Fokusbewegung; anders als bei einem
  einzelnen +/−-Klick (Fokus sitzt direkt auf dem betroffenen Element) war für
  Screenreader-Nutzer nicht erkennbar, dass überhaupt etwas passiert ist — die
  etablierte Linie „kein Live-Region-Bedarf für die laufend neu berechnete
  Ergebnisliste" aus dem v3.27.0-Audit bezog sich auf lokale, fokusnahe
  Einzeländerungen und lässt sich nicht auf eine Sammelaktion über die ganze Liste
  übertragen. Fix: neue, eigene Live-Region `#partyResetLiveMsg` **in derselben,
  auf Mobil immer sichtbaren „Pizza Party"-Karte** (bewusst NICHT die bestehende
  `#partyCreateLiveMsg` aus der Karte „Eigene Pizza anlegen" wiederverwendet — die
  ist auf Mobil per `<details>` standardmäßig zugeklappt, eine dort liegende
  Live-Region würde im zugeklappten Zustand nicht vorgelesen). Meldet „Alle
  Stückzahlen wurden zurückgesetzt." nach jedem Klick, mit demselben „erst leeren,
  dann im nächsten Tick setzen"-Muster + Generation-Zähler wie
  `announcePartyCreate()`.
- **Nebenbefund fürs Backlog (nicht behoben, außerhalb des Scopes):** dieselbe
  `<details>`-zugeklappt-Problematik (Live-Region in einer standardmäßig
  eingeklappten Mobil-Karte wird dort nicht vorgelesen) betrifft vermutlich auch
  das bestehende `#partyCreateLiveMsg` selbst sowie ältere Formular-Live-Regionen
  wie `#nrLiveMsg` — nicht neu durch dieses Feature verursacht, aber beim nächsten
  Accessibility-Durchlauf über die Formulare mit prüfen.
- **Bewusst NICHT angefasst:** die Pizza-Bibliothek (Presets/eigene Pizzen)
  selbst, die Aggregations-/Mengenlogik, das Löschen einzelner eigener Pizzen
  (weiterhin mit `confirm()` abgesichert).
- **Prozess-Fix während der Finalisierung (vom Nutzer gemeldet):** die
  Footer-Versionsanzeige (`#appVersion`) blieb seit v3.28.1 fälschlich bei
  „v3.28.0" stehen, obwohl die `?v=`-Cache-Busting-Parameter in denselben
  HTML-Dateien korrekt bei jeder Version mit hochgezählt wurden. Ursache: die
  Versions-Bumps für v3.28.1/v3.29.0/v3.30.0 liefen jeweils per
  `sed 's/v=3\.X\.Y/v=3.A.B/g'` — dieses Muster verlangt zwingend ein `=`-Zeichen
  und traf daher nur die `?v=…`-Query-Strings in den `<script src>`/`<link
  href>`-Tags, nicht aber den bloßen Text `v3.28.0` im Footer-`<span
  id="appVersion">` (keine `=`-Signatur dort). Für v3.28.0 selbst (Sprachversion)
  war die Footer-Zeile noch korrekt, weil sie dort per gezieltem `Edit`-Aufruf
  mitgezogen wurde — die drei folgenden Versionen nutzten stattdessen
  ausschließlich das schnellere, aber zu eng gefasste `sed`-Muster. Für v3.30.0
  jetzt in `pizza-rechner.html`, `pizza-rechner-mobile.html` und (automatisch über
  den Neu-Build) `pizza-rechner-mobile-standalone.html` korrigiert. **Lehre fürs
  nächste Mal:** bei künftigen Versions-Bumps IMMER zusätzlich gezielt nach
  `id="appVersion"` suchen und den literalen Versionstext dort separat
  aktualisieren, nicht nur die `?v=`-Parameter per Sed ersetzen.

**Tests** (`tests/test.html`, Sektion „22 · Pizza-Party-Planer", +6 neue Prüfungen,
552 → **558**): `PZ.partyResetAllQuantities()` als reine Datenfunktion getestet —
setzt alle Stückzahlen (Presets **und** eine eigene Test-Pizza) zurück auf 0, die
eigene Pizza bleibt aber weiterhin in `getAllPizzas()` vorhanden (nicht gelöscht),
die aggregierte Liste ist danach wieder leer. Alle 558 Prüfungen grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (keine Änderung an
`js/calc.js`/`js/schedule.js`/`js/guide.js`). Zusätzlich interaktiv per
Headless-Edge-CDP auf Desktop verifiziert: Reset-Button setzt alle sichtbaren
Stepper-Werte auf 0 zurück, die aggregierte Liste zeigt wieder den
„noch keine Pizza ausgewählt"-Hinweis, eine währenddessen neu angelegte eigene
Pizza übersteht den Reset unverändert, die Live-Region meldet den Reset korrekt;
keine JavaScript-Konsolenfehler.

**Geändert:** `js/party.js`, `js/i18n.js`, `pizza-rechner.html`,
`pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf `3.30.0` gezogen
(Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.30.0 - Pizza-Party zuruecksetzen/` enthält den vollständigen
Schnappschuss.

## Zutaten-Info je Pizza im Pizza-Party-Bereich (v3.29.0)

Kleines neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt.
Motivation: vor der Auswahl sehen können, was auf einer Pizza tatsächlich drauf ist,
ohne das erst über die aggregierte Einkaufsliste erschließen zu müssen.

- **Info-Button pro Pizza** (vorgegebene wie eigene) in `#partyPizzaList`
  (`js/party.js`, `renderPartyList()`): ein Info-Button ("i", Klasse `.info-btn`,
  identisch zum bereits etablierten Disclosure-Muster in den Einstellungen,
  `js/settings.js` `wireInfoButtons()`) neben dem Pizzennamen klappt eine zuvor
  versteckte Zutatenliste auf/zu (`<p class="party-pizza-ings switch-info" hidden>`).
  Anders als die generische, nur einmal beim Laden laufende `wireInfoButtons()` wird
  der Klick-Handler hier **pro dynamisch erzeugter Zeile direkt in
  `renderPartyList()`** verdrahtet — die Party-Liste wird bei jedem
  Sprachwechsel/Anlegen/Löschen einer Pizza neu gerendert, die statische Verdrahtung
  würde neu erzeugte Buttons nie erreichen.
- **Bewusst NUR Zutatennamen, keine Mengenangaben** (Abgrenzung laut
  Feature-Auftrag) — Mengen bleiben ausschließlich der aggregierten Zutatenliste
  weiter unten vorbehalten, die auf Basis der gewählten Stückzahlen berechnet wird.
  Keine Änderung an der bestehenden Aggregations-/Mengenlogik
  (`PZ.partyComputeAggregatedList()` unverändert).
- **Eindeutige `aria-label`s je Pizza** (`party.infoBtnLabel`, enthält den
  Pizzennamen) und `aria-expanded`/`aria-controls`-Verdrahtung analog zum
  Settings-Muster — Fokus bleibt beim Auf-/Zuklappen auf dem Info-Button selbst (kein
  DOM-Ersatz beim Klick, anders als beim v3.27.0-Löschen-Button-Fall, wo das Element
  aus dem DOM verschwand).
- **Neue CSS-Klassen** `.party-pizza-name-row` (Name + Info-Button in einer
  Flex-Zeile) und `.party-pizza-ings.switch-info` (Override von `.switch-info`s
  serienmäßigem `padding-right:54px`, das in den Einstellungen Platz für den
  danebenliegenden Toggle-Switch lässt — in der schmaleren Party-Zeile gibt es
  keinen Switch, das würde nur unnötig Platz verschwenden).
- **Accessibility-Audit** (`accessibility-expert`-Agent, gezielt nur auf diese neue
  Stelle fokussiert): keine Befunde bei Info-Button-Disclosure, Tab-Reihenfolge,
  Fokus-Verhalten, Kontrasten/Klickzielen (`.info-btn` bleibt unverändert 22×22px,
  `flex-shrink:0` verhindert ein Zusammendrücken; lange eigene Pizzennamen brechen
  normal um statt abgeschnitten zu werden).
- **Bewusst NICHT angefasst:** die Aggregations-/Mengenlogik selbst, die restliche
  Pizza-Party-Struktur (Presets, eigene Pizzen anlegen/löschen), keine Änderung an
  anderen Bereichen der App.

**Tests:** reine UI-Erweiterung (Disclosure-Widget, kein neuer Datenfunktions-Bedarf)
— `tests/test.html` bleibt unverändert bei **552** Prüfungen, alle grün
(Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (keine Änderung an
`js/calc.js`/`js/schedule.js`/`js/guide.js`). Interaktiv per Headless-Edge-CDP auf
Desktop **und** Mobil (Deutsch **und** Englisch) verifiziert: Info-Button togglet
`aria-expanded` + sichtbaren Panel-Zustand korrekt, zeigt nur Zutatennamen ohne
Zahlen/Mengen, zweiter Klick klappt wieder zu; keine JavaScript-Konsolenfehler.

**Geändert:** `js/party.js`, `js/i18n.js`, `css/styles.css`. `?v=` auf `3.29.0`
gezogen (Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.29.0 - Zutaten-Info je Pizza/` enthält den vollständigen Schnappschuss.

## Live-Region-Fix `#recipeIOLiveMsg` (v3.28.1)

Kleiner Bugfix, vom Nutzer direkt beauftragt (Backlog-Nebenbefund aus dem
v3.25.0-Accessibility-Audit, seither mehrfach mitgeschleppt). Kein neues Feature,
keine Änderung an der Rezepte-Backup-Logik selbst.

**Problem:** `showRecipeIOMsg()` (`js/main.js`) setzte `#recipeIOLiveMsg`s
`textContent` direkt, ohne die Region vorher zu leeren — bei zwei wortgleichen
Meldungen hintereinander (z. B. zweimal hintereinander „Als Datei sichern" ohne
gespeicherte Rezepte, oder zweimal ein fehlgeschlagener Import) erkennen viele
Screenreader keine echte DOM-Mutation und unterdrücken die zweite Ansage
(WCAG 4.1.3, Level AA) — derselbe Fehlerklasse wie beim ursprünglich in v3.25.0
gefundenen und dort gefixten `#pdfGuideLiveMsg`.

- **Fix:** `showRecipeIOMsg()` nutzt jetzt dasselbe „erst leeren, dann im nächsten
  Tick setzen"-Muster (`setTimeout(…, 50)`), **plus** einen Generation-Zähler
  (analog zu `announcePartyCreate()` aus `js/party.js`, v3.27.0) — verhindert, dass
  eine verzögerte ältere Meldung eine inzwischen aktuellere überschreibt, falls zwei
  *unterschiedliche* `showRecipeIOMsg()`-Aufrufe sehr schnell hintereinander erfolgen
  (z. B. Export-Fehlermeldung sofort gefolgt von einem Import-Ergebnis). Das ist eine
  Verschärfung gegenüber dem einfacheren v3.25.0-Muster (dort ohne Zähler), da
  `showRecipeIOMsg()` (anders als `setPdfMsg()`) von sechs verschiedenen Stellen mit
  unterschiedlichen Texten aufgerufen wird.
- **Geprüft, ob derselbe Fehler noch anderswo vorkommt:** eine Codesuche nach allen
  `textContent = `-Zuweisungen auf `role="status"`/`aria-live`-Elementen im gesamten
  `js/`-Verzeichnis ergab keine weiteren offenen Fälle — `#pdfGuideLiveMsg`
  (v3.25.0), `#viewAnnounce`/`#langAnnounce` (v3.26.0/v3.28.0) und
  `#partyCreateLiveMsg` (v3.27.0) haben das Muster bereits; `#shareLiveMsg`
  (`js/share.js`) und `#nrLiveMsg`/`#recipeIOLiveMsg` waren die einzigen
  verbleibenden — `#recipeIOLiveMsg` ist mit diesem Fix jetzt behoben.
  *Neuer Nebenbefund fürs Backlog (nicht behoben, außerhalb des angefragten Scopes):*
  `#shareLiveMsg` (`js/share.js`, `copyShareLink()`) und `#nrLiveMsg`
  (`js/newrecipe.js`, `showNrMsg()`) setzen ihren Text ebenfalls noch direkt ohne
  vorheriges Leeren — bei `#shareLiveMsg` in der Praxis meist unkritisch (die
  Meldung wechselt typischerweise zwischen „Link kopiert!"/„Kopieren
  fehlgeschlagen" und wird nach 1,8 s wieder geleert), bei `#nrLiveMsg` enthält der
  Text meist einen variablen Rezeptnamen — beide daher niedrigere Priorität als der
  jetzt gefixte Fall, aber beim nächsten Storage-/Formular-bezogenen Zyklus
  mit aufgreifen.
- **Bewusst NICHT geändert:** keine Änderung an der Export-/Import-Logik selbst
  (`js/storage.js`), an den übrigen Live-Region-Stellen (s. Nebenbefund oben), oder
  an sonstiger UI/Markup.

**Tests:** reine JS-Logik-Änderung ohne Auswirkung auf Rechenlogik — `tests/test.html`
bleibt unverändert bei **552** Prüfungen, alle grün (Headless-Edge-Dump). Kein
`test-generator`-Lauf nötig (keine Änderung an `js/calc.js`/`js/schedule.js`/
`js/guide.js`). `js/main.js` wird in `tests/test.html` wie bisher nicht geladen (reine
UI-Verdrahtung, kein Rechenlogik-Modul) — stattdessen per Headless-Edge-CDP
interaktiv gegen das echte DOM verifiziert: zwei aufeinanderfolgende Klicks auf
„Als Datei sichern" (ohne gespeicherte Rezepte, identische Meldung beide Male) lösen
zuverlässig eine echte Zwischen-Leerung aus (`#recipeIOLiveMsg` ist unmittelbar nach
dem zweiten Klick leer, bevor der Text nach 50 ms erneut gesetzt wird) — das war vor
dem Fix nicht der Fall. Keine JavaScript-Konsolenfehler. Kein separater
`accessibility-expert`-Lauf nötig (reine Anwendung eines bereits an mehreren Stellen
etablierten, mehrfach auditierten Musters auf eine weitere Stelle, keine neue
UI/kein neues Markup — die WCAG-4.1.3-relevante Verhaltensänderung selbst wurde
gezielt interaktiv verifiziert).

**Geändert:** `js/main.js`. `?v=` auf `3.28.1` gezogen (Desktop + Mobil,
Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.28.1 - Live-Region-Fix recipeIOLiveMsg/` enthält den vollständigen
Schnappschuss.

## Sprachversion Deutsch/Englisch (v3.28.0)

Neues, großes Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt.
Deckt laut Auftrag die **komplette Oberfläche** ab: statische UI-Texte (Labels, Buttons,
Hinweise, Einstellungen-Beschreibungen), die generierte Schritt-für-Schritt-Anleitung
(`js/guide.js`, `js/schedule.js`, `js/calc.js`), den PDF-Export (`js/pdf.js`), die
Druckansicht/Einkaufsliste (`js/print.js`), den `.ics`-Kalendertext (`js/timer.js`)
sowie die Pizza-Party-Presets (`js/party.js`). Deutsch bleibt Standard/Fallback, es gibt
nur Deutsch/Englisch (kein weiteres Sprachenmenü).

- **Sprachwahl (laut Feature-Auftrag):** automatische Vorauswahl per
  `navigator.language` beim allerersten Aufruf (`de`/`at`/`ch`-Locale-Codes → Deutsch,
  sonst Englisch), plus ein manueller Umschalter in den Einstellungen (neuer Punkt
  „Sprache", Segment-Control „Deutsch"/„Englisch"), der die Automatik übersteuert. Die
  manuelle Wahl wird in einem **eigenen** localStorage-Key (`pizzaLang`, getrennt vom
  Feature-Flags-Key `pizzaRechnerFeatureFlags` aus `js/settings.js`) persistiert und hat
  bei künftigen Aufrufen Vorrang vor der Auto-Erkennung — bewusst kein Ein/Aus-Flag,
  da „noch nie manuell gewählt" von „explizit auf Deutsch gewählt" unterscheidbar
  bleiben muss (sonst würde Auto-Erkennung nie mehr greifen können bzw. andersherum
  eine explizite Deutsch-Wahl bei jedem Aufruf erneut von der Browser-Sprache
  überschrieben).
- **Neues zentrales Modul `js/i18n.js`:** ein flaches Wörterbuch `{ de: {...},
  en: {...} }` mit punktnotierten Keys (z. B. `label.hyd`, `guide.step.knead.title`).
  `PZ.t(key, vars)` liefert den Text der aktuell aktiven Sprache, interpoliert
  `{platzhalter}` in `vars`, fällt bei fehlendem Key in der Zielsprache auf Deutsch
  zurück und als allerletzten Rückfall auf den Key selbst (kein Crash, kein leerer
  Text). Statische HTML-Texte werden deklarativ verdrahtet:
  - `data-i18n="key"` → `el.textContent = t(key)`
  - `data-i18n-html="key"` → `el.innerHTML = t(key)` (nur für Keys mit fest
    hinterlegtem, sicherem Markup wie `<b>`/`<br>` — nie mit Nutzereingaben kombiniert)
  - `data-i18n-attr="attr1:key1,attr2:key2"` → setzt beliebig viele Attribute
    (`aria-label`, `placeholder`, `optgroup`-`label` usw.)

  `applyStaticI18n()` läuft bei jedem Sprachwechsel erneut und aktualisiert
  `document.documentElement`s `lang`-Attribut (WCAG 3.1.1). Alle **dynamischen** Texte
  (Anleitung, PDF, Druck, Timer, Party-Presets, Presets-Beschreibungen,
  Mehl-Dropdown-Zeitangaben, Rezept-Default-Namen, Live-Region-Meldungen …) rufen
  `PZ.t()` direkt in ihrem jeweiligen Modul auf, statt über das generische
  Attribut-System zu laufen. `PZ.i18nOnChange(fn)` registriert Re-Render-Hooks, die bei
  jedem Sprachwechsel laufen (z. B. `js/calc.js` ruft `calc()` erneut auf, was am Ende
  automatisch `buildGuide()` mit anstößt — ein einziger zentraler Hook statt eines
  separaten in `js/guide.js`, um doppeltes Rendering zu vermeiden).
- **Betroffene Module (Auflistung, da sehr viele):** `js/i18n.js` (neu, Wörterbuch +
  Infrastruktur), `js/guide.js` (komplette Anleitung, ~90 Textbausteine mit
  `{platzhaltern}` statt fester deutscher Strings), `js/schedule.js` (13 Gärzeit-Fahrplan-
  Zweige × label/bulk/proof), `js/calc.js` (Hefe-Label „(frisch)"/„(trocken)",
  Eiswasser-Hinweistext), `js/print.js` (Einkaufsliste), `js/pdf.js` (Titel,
  „Tipp:"/„Achtung:"-Präfixe — der Rest kommt automatisch aus dem bereits übersetzten,
  gerenderten Anleitungs-DOM, s. bestehende Architektur aus v3.25.0), `js/timer.js`
  (Timer-Widget-Texte, System-Wecker-Hinweise, `.ics`-Kalendertext — der interne
  `PRODID`-Header bleibt bewusst unübersetzt, analog zur v3.24.0-Abgrenzung „keine
  internen Code-Bezeichner"), `js/party.js` (8 Preset-Pizzen + UI-Texte — Presets werden
  über eine Funktion `getPresetPizzas()` bei **jedem** Aufruf frisch aus dem Wörterbuch
  gebaut, nicht einmalig beim Laden „eingefroren", sonst würde ein späterer
  Sprachwechsel die Namen nicht mehr aktualisieren), `js/ui.js` (Regler-Einheiten als
  `aria-valuetext`, Methode-/Zeitplan-Hinweistexte), `js/flour.js` (Mehl-Dropdown-
  Zeitangabe „bis 48 h" → „up to 48 h"; Mehlnamen/Markennamen wie „Caputo Pizzeria
  Tradizionale" bleiben bewusst unübersetzt), `js/presets.js` (8 Preset-Beschreibungen),
  `js/newrecipe.js` (Regler-Einheiten, Erfolgsmeldung), `js/storage.js`
  (automatisch generierte Rezeptnamen „Rezept N"/„Mein Rezept"/„Importiertes Rezept"),
  `js/main.js` (Prompt-/Confirm-Dialoge, Import/Export-Meldungen), `js/share.js`
  (Kopier-Feedback).
- **Neuer Menüpunkt „Sprache"** in den Einstellungen (Desktop + Mobil, identisches
  Markup): Segment-Control „Deutsch"/„Englisch" statt eines Ein/Aus-Schalters (wie bei
  den übrigen Feature-Flags) — passend zur 2-Werte-Natur der Sprachwahl. Info-Button
  mit Erklärtext folgt demselben Disclosure-Muster wie alle anderen
  Einstellungen-Punkte.
- **Ausnahmen (laut Feature-Auftrag, analog zum v3.24.0-Präzedenzfall
  „Teigmeister"-Umbenennung):** `pizza-rechner-KONTEXT.md`, `README.md` und
  `tests/test.html` bleiben unangetastet/Deutsch-only (interne Doku/Tooling, kein
  Nutzer-UI). `tests/test.html` bindet `js/i18n.js` zwar als **technische Abhängigkeit**
  ein (da `js/guide.js`/`js/schedule.js`/etc. jetzt `PZ.t()` aufrufen), erzwingt aber
  ganz am Anfang explizit `PZ.setLang('de')` (nach `localStorage.removeItem('pizzaLang')`)
  — damit bleiben alle bestehenden deutschen String-Vergleiche in der Testsuite
  deterministisch unabhängig vom Browser-Profil/der Browser-Sprache der Test-Umgebung.
- **Zwei echte Bugs beim eigenen Vortest gefunden und behoben** (bevor der
  `accessibility-expert`-Agent überhaupt lief): (1) In `js/guide.js` blieb der
  Schritt-Titel „Vorteig + Wasser + Mehl" (Kombinieren von Vorteig in den Hauptteig)
  zunächst hartkodiert deutsch stehen („+ Wasser"/„+ Mehl"/„+ Zucker" sowie das
  Verbindungswort „dann" beim Auflisten mehrerer Zutaten) — mit eigens geschriebenen
  Mehrfach-Branch-Tests (Autolyse/Stretch&Fold/Maschine/Poolish+Trockenhefe+Zucker+Öl/
  Biga+Stück-Kaltgare) über Headless-Edge-CDP gefunden, korrigiert (neue Keys
  `guide.titleSuffix.*`, `guide.pref.joinThen`, `guide.prefGenericTitle`) und erneut
  gegen alle Branches verifiziert (kein Leck mehr). (2) 11 englische Übersetzungen im
  Wörterbuch enthielten fälschlich SQL-Stil-Escaping (`can''t` statt `can\'t`), was
  `js/i18n.js` beim Parsen mit `SyntaxError: missing ) after argument list` zum
  Absturz brachte — per Function-Constructor-Syntaxcheck (Headless-Edge) lokalisiert und
  mit einem gezielten, Backslash-sicheren Such-/Ersetzungsskript korrigiert.
- **Accessibility-Fix während des gezielten Audits** (`accessibility-expert`-Agent, nur
  auf den neuen Sprachumschalter fokussiert): **WCAG 4.1.3 (Status Messages, Level
  AA)** — ein Klick auf „Deutsch"/„English" löst eine komplette Neu-Übersetzung der
  sichtbaren Oberfläche aus (alle Labels, Ergebnis-Panel, komplette Anleitung), ohne
  dass sich der Fokus bewegt oder es eine Live-Region-Ansage gibt; `aria-pressed` am
  geklickten Button allein reicht für Screenreader-Nutzer nicht als Beleg der
  seitenweiten Änderung. Fix: neue Live-Region `#langAnnounce` (identisch zum
  etablierten `#viewAnnounce`-Muster aus v3.26.0) meldet „Sprache: Deutsch"/„Language:
  English" nach jedem manuellen Wechsel, mit demselben „erst leeren, dann im nächsten
  Tick setzen"-Muster gegen das bekannte Zwei-Klicks-mit-gleichem-Text-Problem. Alle
  übrigen geprüften Punkte (`aria-pressed`/`role="group"` am Segment-Control,
  `document.documentElement.lang`-Aktualisierung, Kontraste/Klickziele des
  `.seg`-Elements, Info-Button-Disclosure-Muster) ohne Befund.
- **Bewusst NICHT angefasst:** `pizza-rechner-KONTEXT.md`, `README.md`,
  `tests/test.html` (s. Ausnahmen oben); Dateinamen (`pizza-rechner.html` usw.) und der
  Repo-Name bleiben Deutsch/unverändert; keine Änderung an der Berechnungslogik selbst
  (Zahlenwerte/Formeln unverändert, nur die Textausgabe drumherum); keine
  Einheiten-Umrechnung (g bleibt g, °C bleibt °C in beiden Sprachen); Mehl-/Marken-Namen
  und Pizza-Party-Eigennamen wie „Biga"/„Poolish"/„Margherita" bleiben unübersetzt
  (italienische Fachbegriffe/Eigennamen); eigene, vom Nutzer angelegte Rezepte/Pizzen
  behalten ihren eingegebenen Namen unabhängig von der Sprache (keine Übersetzung von
  Nutzereingaben).

**Tests** (`tests/test.html`, neue Sektion „23 · Sprachversion Deutsch/Englisch
(js/i18n.js)", +16 neue Prüfungen, 536 → **552**): reine Funktions-/Datenschicht
getestet (`PZ.t()`/`getLang()`/`setLang()`/`i18nOnChange()`) — die DOM-Verdrahtung
(`applyStaticI18n()`, Sprachumschalter-UI) läuft in `tests/test.html` mangels
passendem Markup nicht mit, analog zum etablierten Umgang mit anderen UI-Modulen dort.
Geprüft: `t()` liefert den korrekten deutschen Text per Default; `{platzhalter}`-
Interpolation; unbekannter Key liefert den Key selbst zurück statt zu crashen;
fehlende Übersetzung in der Zielsprache fällt auf Deutsch zurück; `setLang()`/
`getLang()` schalten korrekt um und persistieren in `localStorage`; ungültige
Sprachcodes (z. B. `"fr"`) werden ignoriert; `i18nOnChange()`-Callbacks feuern bei
jedem Sprachwechsel. Alle bisherigen 536 Prüfungen bleiben unverändert grün (Beweis,
dass die deutschen Wörterbuch-Werte 1:1 mit den vorher hartkodierten Strings
übereinstimmen). Zusätzlich sehr ausführlich interaktiv per Headless-Edge-CDP
(WebSocket, `--remote-allow-origins=*`, sowie `fetch()`+`new Function()` für
Syntaxchecks) auf isolierten Kopien gegen das echte DOM verifiziert, auf **beiden**
Seiten (Desktop + Mobil): Sprachumschalter schaltet um, persistiert, aktualisiert
`<html lang>`; komplette Neu-Übersetzung von Labels/Ergebnis-Panel/Anleitung/
Party-Presets/Mehl-Dropdown/Presets-Beschreibung; fünf verschiedene Anleitungs-
Branches (Autolyse mit Mini-Hefemenge, hohe Hydration/Stretch&Fold, Maschinenknetung,
Poolish mit Trockenhefe+Zucker+Öl, Biga mit Stück-Kaltgare) auf englische Leckstellen
gescannt (keine gefunden); Mehl-Warnung, PDF-Export (`Tip: `-Präfix, Titel), Druck-
Einkaufsliste, Timer-Start-Button, Party-Pizza-Anlegen, Rezept-Anlegen-Erfolgsmeldung
alle korrekt in Englisch; Live-Region-Ansagen (`#langAnnounce`, `#viewAnnounce`)
korrekt; keine JavaScript-Konsolenfehler während der gesamten Durchläufe. Alle 552
Prüfungen grün (Headless-Edge-Dump). Kein separater `test-generator`-Lauf nötig (die
Berechnungslogik selbst — Zahlenwerte/Formeln in `js/calc.js`/`js/schedule.js`/
`js/guide.js` — ist unverändert, nur die Textausgabe drumherum wurde umgebaut; die
neuen i18n-spezifischen Tests wurden selbst geschrieben, analog zum Vorgehen bei
`js/pdf.js` in v3.25.0 und `js/party.js` in v3.27.0).

**Geändert:** `js/i18n.js` (neu), `js/guide.js`, `js/schedule.js`, `js/calc.js`,
`js/print.js`, `js/pdf.js`, `js/timer.js`, `js/party.js`, `js/ui.js`, `js/flour.js`,
`js/presets.js`, `js/newrecipe.js`, `js/storage.js`, `js/main.js`, `js/share.js`,
`pizza-rechner.html`, `pizza-rechner-mobile.html`, `tests/test.html`. `?v=` auf
`3.28.0` gezogen (Desktop + Mobil, Cache-Busting + Footer-Version).
`pizza-rechner-mobile-standalone.html` neu gebaut (`python build-mobile-standalone.py`).
`Versionen/v3.28.0 - Sprachversion Deutsch-Englisch/` enthält den vollständigen
Schnappschuss.

## Pizza-Party-Planer (v3.27.0)

Neues Feature, vom Nutzer per `/define-feature` strukturiert und bestätigt. Motivation:
beim Planen einer Pizzaparty mit mehreren Sorten will man auf einen Blick wissen, welche
Beläge in welcher ungefähren Menge eingekauft werden müssen, statt das für jede Sorte
einzeln im Kopf zusammenzurechnen. Bewusst ein **komplett eigenständiger Bereich**,
getrennt vom Teig-Rechner: kein automatischer Abgleich mit der „Anzahl Teiglinge" dort,
keine exakte/rezeptgenaue Mengenberechnung wie bei den Teig-Grundzutaten (`js/calc.js`)
— nur ungefähre Richtmengen für die Beläge.

- **Neuer Bereich „Pizza Party"** über die Burgermenü-Navigation (v3.26.0) erreichbar —
  fünfter Nav-Eintrag (`data-goto="party"` / `data-view="party"`) zwischen „Zeitplan" und
  „Einstellungen", identisch auf Desktop (`pizza-rechner.html`) und Mobil
  (`pizza-rechner-mobile.html`, dort im etablierten `<details class="card">`-Akkordeon-
  Muster, erste Card `open`). Drei Karten: **„Pizza Party"** (Pizzenauswahl mit
  Stückzahl-Stepper), **„Eigene Pizza anlegen"** (Mini-Formular), **„Zutatenliste für die
  Party"** (live berechnetes Ergebnis).
- **Neues, eigenständiges Modul `js/party.js`:** komplett getrennt von `PZ.state`/
  `PZ.calc()` — kein Zugriff auf den Teig-Rechner-Zustand. Eigener localStorage-Key
  `pizzaPartyPlanner` (getrennt vom Rezepte-Key `pizzaRechner`, `js/storage.js`), Format
  `{ customPizzas: [{id, name, ingredients:[{name, amount, unit}]}], qty: {pizzaId: n} }`.
  Robust gegen leeren/korrupten localStorage-Inhalt (fällt auf leere Struktur zurück,
  kein Crash).
- **8 vorgegebene Beispielpizzen** (`PZ.PARTY_PRESET_PIZZAS`, feste ids `preset_*`):
  Margherita, Salami, Funghi, Diavola, Prosciutto, Quattro Formaggi, Verdure, Hawaii —
  je mit 3–5 Zutaten und groben Richtmengen für eine Standard-Pizza (~250–280 g Teigling,
  28–30 cm), keine exakte Rezeptur.
- **Stückzahl-Stepper** pro Pizze (Minus-Button, `<input type="number">` 0–50, Plus-Button,
  `role="group" aria-label="Anzahl <Pizza>"`) — Änderungen persistieren sofort
  (`PZ.partySetQty()`, klemmt auf 0–50, 0 entfernt den Eintrag wieder) und lösen live ein
  Neu-Rendern der aggregierten Ergebnisliste aus, kein „Speichern"-Button nötig.
- **Eigene Pizza anlegen:** Namensfeld + dynamische Zutatenzeilen (Name/Menge/Einheit,
  Start mit 3 leeren Zeilen, „+ Zutat" fügt beliebig viele hinzu, „✕" entfernt eine
  Zeile). `PZ.partyAddCustomPizza(name, ingredients)` filtert Zeilen ohne Namen oder mit
  Menge ≤ 0 automatisch heraus (Formular-Robustheit); liefert `null` bei komplett
  ungültiger Eingabe (kein Name ODER keine einzige gültige Zutat) statt eine leere/kaputte
  Pizza anzulegen — der Aufrufer zeigt dann eine Fehlermeldung statt zu speichern. Eigene
  Pizzen bekommen einen Löschen-Button (🗑, nur bei `custom:true`), mit
  `confirm()`-Bestätigung (analog zum bestehenden Rezept-Löschen-Muster).
- **Aggregation (`PZ.partyComputeAggregatedList()`):** summiert alle ausgewählten Pizzen
  (Stückzahl > 0) zu einer deduplizierten Zutatenliste. Gruppierungsschlüssel = Zutatenname
  (getrimmt, klein geschrieben) **+ Einheit** (ebenso normalisiert) — zwei Zutaten mit
  demselben Namen aber unterschiedlicher Einheit (z. B. Basilikum in „Blättern" vs. „g")
  bleiben bewusst getrennte Zeilen, da **keine Einheiten-Umrechnung** stattfindet (passend
  zur Abgrenzung „keine exakte Mengenberechnung" im Feature-Auftrag). Liefert zusätzlich
  `totalPizzaCount` (Summe aller Stückzahlen) für die Kopfzeile des Ergebnisses. Ergebnis
  alphabetisch sortiert (`localeCompare` mit `'de'`-Locale).
- **Accessibility-Fixes während des gezielten Audits** (`accessibility-expert`-Agent, nur
  auf die neuen Party-Stellen fokussiert):
  - **WCAG 2.4.3 (Focus Order)** — Löschen einer eigenen Pizza entfernte den geklickten
    Button per Re-Render aus dem DOM, ohne den Fokus umzulenken (fiel auf `<body>`
    zurück). Fix: `focusPartyHeading()` (Muster identisch zu `focusView()` aus der
    Burger-Nav) lenkt den Fokus nach dem Löschen auf die `<h2>` der „Pizza Party"-Card,
    zusätzlich Ansage über die Live-Region.
  - **WCAG 2.4.3 (Focus Order)** — dasselbe Problem beim Entfernen einer Zutatenzeile im
    Anlege-Formular (`✕`-Button), hier ohne Bestätigungsdialog also bei jeder Nutzung
    reproduzierbar. Fix: Fokus wandert auf das Namensfeld der nächsten verbleibenden
    Zeile (oder auf „+ Zutat" als Fallback, wenn keine Zeile mehr übrig ist).
  - **WCAG 2.4.6 (Headings and Labels)** — alle „Zutatenzeile entfernen"-Buttons hatten
    identische `aria-label`s, bei mehreren Zeilen für Screenreader nicht unterscheidbar.
    Fix: `renumberIngRowLabels()` nummeriert durch („Zutatenzeile 1 entfernen", „…2…").
  - **WCAG 3.3.1 (Error Identification)** — bei ungültiger Eingabe im Anlege-Formular
    sprang der Fokus nicht zum betroffenen Feld. Fix: Fokus auf `#partyNewName` bei
    fehlendem Namen, sonst auf das erste Zutatname-Feld.
  - Alle übrigen geprüften Punkte (Stepper-Gruppierung/-Beschriftung, Live-Region-Anbindung
    inkl. Generation-Zähler gegen Race-Conditions, Kontraste, Klickzielgrößen 40×40/36×36
    konsistent zum Rest der App, Fallback ohne JS) ohne Befund.
- **Race-Condition-Fix (im Zuge des eigenen Vortests gefunden, vor dem Audit selbst
  behoben):** die Live-Region (`#partyCreateLiveMsg`) nutzt das etablierte
  „erst leeren, dann im nächsten Tick setzen"-Muster (WCAG 4.1.3, wie `#pdfGuideLiveMsg`/
  `#viewAnnounce`) — das kann aber bei zwei schnell aufeinanderfolgenden Aktionen
  (z. B. erfolgreich anlegen, dann sofort nochmal mit leerem Namen versuchen) dazu
  führen, dass eine verzögerte ältere Meldung eine neuere überschreibt. Fix:
  `announcePartyCreate()` nutzt einen Generation-Zähler — nur der jeweils neueste Aufruf
  darf seinen Text tatsächlich setzen, ältere ausstehende Timeouts werden zu No-ops.
- **Bewusst NICHT angefasst:** Teig-Rechner-Zustand/-Logik (`js/calc.js`/`js/schedule.js`/
  `js/guide.js`), bestehende Rezepte-Verwaltung, die Burger-Nav-Logik selbst (v3.26.0,
  nur der generische `[data-view]`/`.nav-item[data-goto]`-Mechanismus wird
  mitgenutzt — kein Nav-Code geändert); kein Print-/PDF-Export für die Party-Zutatenliste
  (nicht im Scope der Feature-Definition); keine Einheiten-Umrechnung.

**Tests** (`tests/test.html`, neue Sektion „22 · Pizza-Party-Planer (js/party.js)",
+38 neue Prüfungen, 498 → **536**): reine Datenfunktionen getestet (`partyGetAllPizzas`/
`partyAddCustomPizza`/`partyDeleteCustomPizza`/`partySetQty`/`partyGetQty`/
`partyComputeAggregatedList`), kein DOM-Rendering unit-getestet (die UI-Verdrahtung in
`js/party.js` läuft in `tests/test.html` mangels `#partyPizzaList`-Markup gar nicht erst
an — die Datenschicht ist aber vollständig unabhängig davon nutzbar, analog zum
`newrecipe.js`-Ansatz aus v3.22.0). Geprüft: 8 Presets bei leerer Bibliothek; gültige
Custom-Pizza-Anlage inkl. `custom:true`-Markierung; automatisches Filtern leerer/
ungültiger Zutatenzeilen (Name fehlt, Menge ≤ 0, nur Leerzeichen); `null`-Rückgabe bei
komplett ungültiger Eingabe ohne Seiteneffekt; Löschen entfernt Pizza UND Stückzahl;
`setQty()`-Klemmung auf 0–50 inkl. Rückführung auf 0; Aggregationsmathematik im Detail
(3× Margherita + 2× Salami → korrekt aufsummierte, deduplizierte Mengen je Zutat,
unterschiedliche Einheiten bleiben getrennt); Pizzen mit Stückzahl 0 fließen nicht ein;
leere Auswahl liefert eine leere, aber gültige Struktur statt eines Fehlers; eigene
Pizzen fließen genauso in die Aggregation ein wie Presets; eigener localStorage-Key
komplett getrennt vom Rezepte-Key (Isolationstest); korruptes JSON im Party-Storage
verursacht keinen Absturz. Zusätzlich interaktiv per Headless-Edge-CDP (WebSocket,
`--remote-allow-origins=*`) auf einer isolierten Kopie gegen das echte DOM verifiziert
(Desktop **und** Mobil): Bereichswechsel über die Burger-Nav, Stepper-Klicks aktualisieren
Anzeige und Ergebnis live, Mengen-Klemmung bei Eingabe > 50, eigene Pizza anlegen inkl.
Zeilenfilterung, Löschen mit Bestätigungsdialog, sowie gezielt die beiden
Fokus-Fixes (Fokus landet nach Pizza-Löschen auf der `<h2>`, nach Zutatenzeile-Entfernen
auf dem nächsten Namensfeld — nie auf `<body>`) und die Label-Nummerierung. Alle 536
Prüfungen grün (Headless-Edge-Dump). Kein `test-generator`-Lauf nötig (kein Logik-
Eingriff in `js/calc.js`/`js/schedule.js`/`js/guide.js` — eigenständiges neues Modul,
Tests selbst geschrieben, analog zum Vorgehen bei `js/pdf.js` in v3.25.0).

**Geändert:** `js/party.js` (neu), `pizza-rechner.html`, `pizza-rechner-mobile.html`,
`css/styles.css`, `tests/test.html`. `?v=` auf `3.27.0` gezogen (Desktop + Mobil,
Cache-Busting + Footer-Version). `pizza-rechner-mobile-standalone.html` neu gebaut
(`python build-mobile-standalone.py`).
`Versionen/v3.27.0 - Pizza-Party-Planer/` enthält den vollständigen Schnappschuss.

## Burgermenü-Navigation auch auf Desktop (v3.26.0)

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

**Überholt seit v3.54.0:** die hier begründete bewusste Duplizierung („bewährte
Mobil-Umsetzung bleibt unangetastet") wurde im Zyklus „Gemeinsames Nav-Modul (v3.54.0)"
(s. Abschnitt weiter oben) aufgehoben — die damalige Vorgabe galt nicht mehr, beide
Inline-Scripts wurden zu `js/nav.js` zusammengeführt (Mobil-Implementierung blieb dabei
die maßgebliche Referenz). Dieser Abschnitt bleibt als historische Begründung stehen,
warum ursprünglich dupliziert statt gemeinsam ausgelagert wurde.

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

## Testsuite-Wachstumshistorie (Detail, Version für Version)

Ausgelagert aus „Entwicklungsweise / Mitarbeit" in der Hauptdatei (dort nur noch der aktuelle
Stand: 614 Prüfungen in 24 Kategorien). Diese Historie dokumentiert, wie die Testsuite über
die Versionen gewachsen ist:

Die ursprünglichen 16 Kategorien bis v3.12.0 (293 Prüfungen) deckten ab: Bäckerprozente,
DDT/Eis, Vorteig-Aufteilung (inkl. Klemm-Grenzfälle exakt an/über der Grenze, auch für Biga
wenn `bhyd > hyd`), Trockenhefe, Schedule-Schwellen (beide coldStage-Varianten), Mehl-Warnung
(inkl. Vorteig-Reifezeit + exakte hydMin/hydMax-Grenzwerte), Backzeit-Skalierung,
Vorteig-Reifezeit, Olivenöl (Masseerhaltung), Anleitungs-Hinweise (Autolyse-Dauer,
Hefe-Präzision < 1 g, auch bei Trockenhefe), Randfälle/Edge Cases (1 bzw. 20 Teiglinge,
0 % Öl, Hefemenge exakt an der 1-g-Grenze), Kombinationen (Vorteig + Kaltgare-Stufe `bulk`
+ Öl + Trockenhefe gleichzeitig statt isoliert), Masseerhaltung für alle Methoden + alle
7 Presets (nicht nur Direkt/Teglia), Zeitplan-Rückwärtsrechnung ("Fertig sein um…" — prüft,
dass der errechnete Startzeitpunkt im Anleitungstext korrekt erscheint, auch bei Biga mit
Vorteig-Reifezeit). BASE hat `oil: 0` (isoliert die Öl-Tests).

Die seither hinzugekommenen Kategorien 17–24 (Teilen-Link, Feature-Flags/Einstellungen,
Zucker/New-York-Style, Rezepte-Backup, PDF-Export, Pizza-Party-Planer, Sprachversion DE/EN,
Dunkelmodus) sind jeweils im zugehörigen Release-Abschnitt dieser Datei beschrieben.

v3.6.1: Testsuite von 136 auf 213 Prüfungen gehärtet (reine Test-Erweiterung,
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
v3.12.0 (Accessibility-Nachaudit): reine ARIA-/CSS-/Label-Ergänzung, `js/timer.js`
wird in `tests/test.html` weiterhin nicht geladen (Browser-APIs, s. o.) — 293 Prüfungen
unverändert grün, erneut per Headless-Edge-Dump verifiziert.

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
