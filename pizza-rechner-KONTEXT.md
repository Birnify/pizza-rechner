# Kontext: Pizzateig-Rechner App
Stand: 2026-07-15 · Aktuelle Version: v3.17.1 · Für Fortsetzung in neuer Session (auch mit kleinerem Modell)

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

## Mobil-Hamburger-Navigation (v3.17.x) + gezielter Accessibility-Audit = aktueller Stand

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

- Mehl- und Raumtemperatur getrennt einstellbar (aktuell als gleich angenommen)
- Zucker-Feld (New York Style) — bewusst noch nicht drin; Öl ist seit v3.3.0 integriert
- ~~Einkaufsliste generieren; Druck nur für die Anleitung~~ — **erledigt in v3.9.0**
- ~~Gärzeit-Timer / Wecker~~ — **erledigt in v3.11.0**; System-Wecker/Kalender-Anbindung
  (Android-Intent + .ics-Kalendererinnerung als iOS-Ersatz, da keine offizielle Web-API
  existiert) **ergänzt in v3.15.0**
- ~~Teilen-Link (State als Base64-JSON in der URL)~~ — **erledigt in v3.14.0**; Export
  als PDF weiterhin offen (bewusst nicht mitgebaut, s. Abschnitt oben — Nutzer wollte
  nur den reinen Teilen-Link, keinen zusätzlichen PDF-Button)
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
