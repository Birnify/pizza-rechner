# Backlog / Sessionübergabe

Stand: 2026-07-25. Für Fortsetzung in einer neuen Session (auch anderer Account/Maschine).
Lies zusätzlich `pizza-rechner-KONTEXT.md` (Pflicht, siehe `CLAUDE.md`) für den aktuellen
App-Stand — diese Datei hier ist nur die Warteschlange/Ideensammlung.

**Wichtig zur Fortsetzung:** Es gibt keine über Sessions hinweg erreichbare
Orchestrator-Instanz. Eine neue Session muss für den nächsten Punkt immer einen frischen
`feature-cycle-orchestrator` starten (`Agent`-Tool), nicht versuchen, eine alte Instanz per
`SendMessage` zu erreichen — das schlägt ohnehin fehl (Instanz-IDs sind sitzungsgebunden).
Siehe `CLAUDE.md`, Abschnitt „Arbeitsablauf: Orchestrator..." für den genauen Ablauf,
inklusive der seit 2026-07-23 geltenden Regel „ein Zyklus/Punkt pro Instanz" (Kostengrund:
eine Dauer-Instanz über mehrere Zyklen erzeugte in einem gemessenen Fall ~196 Mio.
Cache-Read-Tokens bei nur ~304K echtem Output).

## Ursprüngliche Warteschlange — beide Punkte erledigt

Ursprünglich zwei Punkte, bereits an eine Orchestrator-Instanz übergeben und von ihr
bestätigt, aber auf Nutzerwunsch pausiert. **Punkt 2 ist seit v4.0.0 (Design-System-Import
Zyklus 1: Tokens + Rechner-Screen) erledigt** — der neue `.seg`-Schalter aus dem
Design-Token-Import bekam automatisch einen sichtbaren Rahmen (`--surface-2`-Fläche +
`1px solid var(--line)`), identisches Problem, andere Lösung als ursprünglich hier
geplant. **Punkt 1 ist seit v4.5.0 ("Ergebnis priorisieren + Kontrast-Fixes") ebenfalls
erledigt** — Aktionsleiste der Ergebniskarte neu geordnet (primär "Zum Zeitplan",
sekundär "Rezept teilen", Rest in "Weitere Optionen" eingeklappt), auf Desktop UND Mobil,
plus im selben Zyklus zwei app-weite Kontrast-Nebenbefunde (`--line`-Rahmenkontrast,
Weiß-auf-Tomate-Text im Dunkelmodus) gefixt. Details: `pizza-rechner-KONTEXT.md`,
Abschnitt „Ergebnis priorisieren + Kontrast-Fixes (v4.5.0)". **Punkt B unten
("Teilen-Link"/Einkaufsliste aus Einstellungen entfernen) ist seit v4.6.0 ebenfalls
erledigt** (s. `pizza-rechner-KONTEXT.md`, Abschnitt „„Teilen-Link"/„Einkaufsliste" aus
Einstellungen entfernt (v4.6.0)"). **Punkt C unten ("New York Style"-Einstellung
entfernen, Zuckerfeld wertbasiert) ist seit v4.7.0 ebenfalls erledigt** (s.
`pizza-rechner-KONTEXT.md`, Abschnitt „„New York Style"-Einstellung entfernt, Zuckerfeld
wertbasiert (v4.7.0)"). **Punkt D unten (Einfrier-Hinweis entfernen, Glossar-Artikel
"Einfrieren") ist seit v4.8.0 ebenfalls erledigt** (s. `pizza-rechner-KONTEXT.md`,
Abschnitt „Einfrier-Hinweis entfernt, Glossar-Artikel „Einfrieren" (v4.8.0)"). **Punkt A
unten (Inline-Verlinkung von Glossar-Begriffen im Anleitungstext) ist seit v4.9.0
ebenfalls erledigt** (s. `pizza-rechner-KONTEXT.md`, Abschnitt „Inline-Verlinkung von
Glossar-Begriffen im Anleitungstext (v4.9.0)"). **Punkt E unten (Bug: untere
Navigationsleiste rutscht hoch) ist seit v4.9.1 umgesetzt, aber NICHT auf echtem
iOS-Gerät bestätigt** (s. `pizza-rechner-KONTEXT.md`, Abschnitt „Bottom-Nav iOS
Safe-Area Fix (v4.9.1)"). **Punkt H unten (Einklappbare Hinweisboxen mit gegenseitigem
Ausschluss) ist seit v4.10.0 ebenfalls erledigt** (s. `pizza-rechner-KONTEXT.md`,
Abschnitt „Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (v4.10.0)"). **Punkt I
unten (Zieltemperatur statt Eis in der Hauptanleitung) ist seit v4.11.0 ebenfalls erledigt**
(s. `pizza-rechner-KONTEXT.md`, Abschnitt „Zieltemperatur statt Eis in der Hauptanleitung,
Eis nur als Glossar-Fallback (v4.11.0)"). **Punkt J unten (Fokus-Verlust bei
`.collapse`/`.show`-Feldern) ist seit v4.12.0 ebenfalls erledigt** (s.
`pizza-rechner-KONTEXT.md`, Abschnitt „Fokus-Erhalt bei .collapse/.show-Feldern (v4.12.0)").

## Weitere Ideen (aus Backlog.txt, noch nicht in die Orchestrator-Warteschlange eingereiht)

Reihenfolge unter den 9 Punkten noch nicht final festgelegt. **Punkt B war an "Ergebnis
priorisieren" gekoppelt (referenziert dessen "Weitere Optionen"-Bereich) — diese
Abhängigkeit ist seit v4.5.0 erfüllt, Punkt B ist damit nicht mehr blockiert.**

### ~~A. Inline-Verlinkung von Glossar-Begriffen im Anleitungstext~~ — erledigt in v4.9.0

Umgesetzt wie unten beschrieben: `js/guide.js` bekam einen neuen Helfer
`inlineGlossaryLink()`, der das erste wörtliche Vorkommen eines Glossar-Artikeltitels im
Schritt-Titel/-Text durch einen Inline-Link ersetzt (neue CSS-Klasse
`.inline-glossary-link`). Von 8 geprüften Begriffen kommen 3 (Biga, Poolish, Autolyse)
exakt im jeweiligen Schritt-Titel vor und wurden inline verlinkt; die anderen 5 behalten
den separaten Fallback-Zeilenlink (Begriff kommt nicht wortgleich im generierten Text
vor). Details: `pizza-rechner-KONTEXT.md`, Abschnitt „Inline-Verlinkung von
Glossar-Begriffen im Anleitungstext (v4.9.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Statt eines separaten Zeilenlinks unterhalb der Anleitung ("📖 Mehr zu Kalte Gare
im Glossar") wird das relevante Fachwort direkt im bestehenden Anleitungstext selbst zum
klickbaren Link zum passenden Glossar-Artikel.

Motivation: Separate "Mehr erfahren"-Links unterbrechen den Lesefluss; ein inline
verlinktes Fachwort erfüllt denselben Zweck ohne zusätzlichen UI-Block, Linktext bleibt
selbsterklärend (entspricht exakt dem Begriff).

Scope: Erstes Vorkommen eines Begriffs mit passendem Glossar-Artikel pro
Anleitungsschritt wird im Fließtext verlinkt (Linktext = exakter Artikeltitel, z. B.
"Stückgare", "Kalte Gare", "Autolyse", "Windowpane-Test"), gleiches Sprungziel wie
bisher. Bisheriger separater Zeilenlink entfällt dort, wo der Begriff bereits inline
verlinkt ist; bleibt als Fallback erhalten, falls der Begriff nicht wörtlich im Text
vorkommt.

Abgrenzung: Keine Änderung an Glossar-Artikeln/-Inhalten oder der
Verlinkungslogik/Zielzuordnung, nur an der Darstellung. Keine Icon-only-Links. Keine
erzwungene Verlinkung ohne passenden Artikel.

### ~~B. "Teilen-Link" und "Einkaufsliste" aus Einstellungen entfernen, dauerhaft in "Weitere Optionen" verfügbar machen~~ — erledigt in v4.6.0

Umgesetzt wie unten beschrieben: beide Feature-Flags (`share`/`shopping`, `js/settings.js`)
samt Menüpunkten (Desktop + Mobil) entfernt, `js/print.js`/`js/pdf.js`-Guards entfernt,
„Rezept teilen"/„Einkaufsliste drucken"/„Als PDF speichern" seither permanent sichtbar.
Details: `pizza-rechner-KONTEXT.md`, Abschnitt „„Teilen-Link"/„Einkaufsliste" aus
Einstellungen entfernt (v4.6.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Die Einstellungspunkte "Teilen-Link" und "Einkaufsliste" verschwinden ersatzlos.
Die Funktionen (Rezept teilen/Link kopieren, Einkaufsliste drucken) sind stattdessen immer
im eingeklappten Bereich "Weitere Optionen" der Ergebniskarte verfügbar, unabhängig von
einem globalen Schalterzustand.

Motivation: Sobald "Weitere Optionen" existiert (Punkt 1) und die Funktionen ohnehin
nicht mehr im direkten Sichtfeld stehen, ist ein zusätzlicher globaler Ausblend-Schalter
redundant.

Scope: Menüpunkte "Teilen-Link" und "Einkaufsliste" (Label, Info-Button, Toggle) aus den
Einstellungen entfernen, zugehörige Bedingungslogik entfernen. "Rezept teilen" bleibt
permanent sekundäre Aktion sichtbar. "Einkaufsliste drucken" dauerhaft und
bedingungslos in "Weitere Optionen" verfügbar.

Abgrenzung: Keine Änderung an der übrigen Aktionsleisten-Neuordnung aus Punkt 1, keine
Änderung an anderen Einstellungspunkten (Gärzeit-Timer, System-Wecker, Mehrere Rezepte,
New York Style, Hinweistexte, Hefemenge/Verschwendung), keine Migration alter
Toggle-Werte, keine Änderung an Berechnungslogik/Zeitplan/Quickbar.

### ~~C. "New York Style"-Einstellung entfernen, Zuckerfeld wertbasiert statt togglebasiert steuern~~ — erledigt in v4.7.0

Umgesetzt wie unten beschrieben: Feature-Flag `newYorkStyle` samt Menüpunkt (Desktop +
Mobil) entfernt, `#sugarBlock` ist seither rein wertbasiert (`state.sugar > 0`), alle 7
Kern-Presets setzen `sugar` jetzt explizit (0 bzw. 2 bei „New York Style"). Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „„New York Style"-Einstellung entfernt, Zuckerfeld
wertbasiert (v4.7.0)". Neuer Nebenbefund aus dem begleitenden `accessibility-expert`-
Review als eigener Punkt J unten dokumentiert (Fokus-Verlust bei `.collapse`/`.show`-
Feldern, app-weites Bestandsmuster, bewusst nicht in diesem Zyklus mitgefixt).

Ursprünglicher Auftragstext (zur Referenz):

Idee: Der globale Einstellungspunkt "New York Style" verschwindet ersatzlos. Ob das
Zuckerfeld angezeigt wird, hängt stattdessen ausschließlich vom gespeicherten Wert des
Presets ab: 0 = ausgeblendet, größer 0 = eingeblendet. Bei Preset-Erstellung ist das Feld
immer sichtbar, mit "0" vorbefüllt, frei veränderbar.

Motivation: Ein globaler Toggle, der unabhängig vom Preset steuert, ob das Zuckerfeld
existiert, ist unnötig starr — Sichtbarkeit sollte sich am tatsächlich gespeicherten Wert
orientieren (etabliertes UX-Prinzip für optionale Formularfelder).

Scope: Menüpunkt "New York Style" (Label, Info-Button, Toggle) komplett entfernen,
zugrunde liegende globale Bedingungslogik entfernen. Bestehende/gespeicherte Presets:
Zucker-Metadaten/-Option nur bei Wert > 0 sichtbar. Preset-Erstellung/-Bearbeitung: Feld
immer sichtbar, vorbefüllt mit "0". Beim Speichern mit Wert > 0: Metadaten/Option auch in
Normalansicht sichtbar, analog zu Standard-Presets.

Abgrenzung: Keine Änderung an anderen Preset-Feldern/-Struktur, keine Änderung an anderen
Einstellungspunkten, keine Migration bestehender Presets nötig (neue Logik greift
automatisch anhand des vorhandenen Werts), kein Einfluss auf DDT-/Rezeptberechnung.

### ~~D. Einfrier-Hinweis aus Anleitung und Einstellungen entfernen, Glossar-Artikel "Einfrieren" erstellen~~ — erledigt in v4.8.0

Umgesetzt wie unten beschrieben: die Einfrier-Hinweisbox (tatsächlich im Schritt
"Teiglinge formen", nicht "Stückgare (Teiglinge)" -- s. Korrektur im Kontext-Abschnitt)
und das Feature-Flag `freezeHint` samt Menüpunkt (Desktop + Mobil) sind ersatzlos
entfernt, Inhalt lebt als neuer Glossar-Artikel "Einfrieren" weiter, per Glossar-Verweis
vom Anleitungsschritt aus verlinkt. Details: `pizza-rechner-KONTEXT.md`, Abschnitt
„Einfrier-Hinweis entfernt, Glossar-Artikel „Einfrieren" (v4.8.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Die Einfrier-Hinweisbox verschwindet ersatzlos aus der Anleitung (Schritt
"Stückgare (Teiglinge)"), der Toggle "Einfrier-Hinweis" verschwindet ersatzlos aus den
Einstellungen, Inhalt wird als eigenständiger Glossar-Artikel "Einfrieren" verfügbar.

Motivation: Die Einfrier-Hinweisbox ist ein Zusatzinfo-Block, der die Anleitung optisch
verlängert, obwohl nur für einen Teil der Nutzer relevant — passt zum Muster, optionale
Zusatzinfos ins Glossar zu verlagern statt dauerhaft einzublenden.

Scope: Einfrier-Hinweisbox aus dem Anleitungsschritt entfernen (überall, wo sie über den
Toggle eingeblendet wird), Menüpunkt "Einfrier-Hinweis" (Label, Info-Button, Toggle) aus
Einstellungen entfernen, zugrunde liegende Bedingungslogik entfernen. Neuer
Glossar-Artikel "Einfrieren" mit bisherigem Hinweisinhalt (Teiglinge dünn mit Öl
bestreichen, einzeln einfrieren, 2–3 Monate haltbar; Auftauen über Nacht im Kühlschrank,
dann 3–5 h Raumtemperatur, dann 2–4 h Stückgare). Bestehender Link "Mehr zu Kalte Gare im
Glossar" bleibt als Vorbild-Muster erhalten; vergleichbarer Verweis auf "Einfrieren"
optional ergänzbar.

Abgrenzung: Keine Änderung an übriger Anleitung des Schritts (Stückgare-Zeiten,
Fingertest-Hinweis, Timer-Button, Kalte-Gare-Link), keine Änderung an anderen
Einstellungen, kein genereller Glossar-Redesign, keine Migration alter Toggle-Werte
(sofern nicht separat gewünscht).

### ~~E. Bug: Untere Navigationsleiste rutscht hoch, Farblücke am Bildschirmrand~~ — umgesetzt in v4.9.1, NICHT bestätigt gelöst

Umgesetzt wie unten beschrieben: `viewport-fit=cover` war bereits vorhanden;
`env(safe-area-inset-*)`-Fallbacks bei `.bottom-tabs`/`.quickbar` ergänzt;
`position:sticky` statt `fixed` geprüft und begründet verworfen (kein
`min-height:100dvh`-Flex-Shell-Layout, Risiko dass die Leiste bei kurzem Inhalt nicht am
Bildschirmrand bleibt); stattdessen ein Scroll-Nudge-Workaround in `js/nav.js`
(`activateView()`) nach jedem Tab-Wechsel ergänzt. Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „Bottom-Nav iOS Safe-Area Fix (v4.9.1)".

**WICHTIG:** Die Wirksamkeit konnte NICHT live auf einem echten iOS-Gerät verifiziert
werden (kein iPhone/iPad in dieser Umgebung, Bug lässt sich in Headless-Chromium/Edge
nicht reproduzieren). Dieser Punkt bleibt bis zu einer echten Geräteprüfung als
"umgesetzt, nicht bestätigt gelöst" offen — bei erneutem Auftreten auf echtem iOS-Gerät
bitte melden, dann weitere Diagnose (z. B. genaue iOS-Version, Standalone-PWA vs.
Safari-Tab, Reproduktionsschritte).

Ursprünglicher Auftragstext (zur Referenz):

Beobachtung: Gelegentlich verschiebt sich die untere Menüleiste (Rechner/Pizza
Party/Glossar/Einstellungen) nach oben, sodass darunter ein unbedeckter Farbstreifen bis
zum echten Gerätrand sichtbar wird, statt bündig am unteren Rand zu kleben.

Wahrscheinliche Ursache: iOS Safari (bzw. installierte PWA) verändert die Höhe des
sichtbaren Viewports dynamisch beim Ein-/Ausblenden der Adressleiste. Fixierte Elemente
(`position: fixed; bottom: 0`) werden dabei nicht immer korrekt neu positioniert,
besonders wenn `env(safe-area-inset-bottom)` fehlt, der Viewport-Meta-Tag kein
`viewport-fit=cover` enthält, oder iOS diese Werte nach einer Seitenaktion zwischenzeitlich
auf 0 zurücksetzt.

Scope für den Fix: Viewport-Meta-Tag um `viewport-fit=cover` ergänzen (falls fehlend).
Menüleisten-Container bekommt `padding-bottom: env(safe-area-inset-bottom, 0)` statt sich
rein auf `bottom: 0` zu verlassen. Prüfen, ob `position: sticky` robuster ist als `fixed`,
oder alternativ Workaround (kurzer programmatischer Scroll-Trigger beim Tab-Wechsel)
testen. Testen auf mehreren iOS-Versionen/Geräten.

Abgrenzung: Kein Eingriff in Funktionalität der Menüleiste selbst (Icons, Navigation,
aktiver Zustand), kein genereller Layout-Umbau anderer Bereiche, nur Positionierungslogik
der unteren Leiste. Betrifft ausschließlich iOS-Safari/PWA, keine Android-Anpassung
vorgesehen, sofern das Problem dort nicht ebenfalls auftritt.

### ~~F. Akkordeon-Verhalten für Glossar-Artikel, Entfernen des Glossar-Gesamt-Einklappens~~ — erledigt in v4.3.0

Umgesetzt als Teil von Design-System-Import Zyklus 4 (Glossar-Screen), da das Mockup
(`GlossarScreen.jsx`) genau dieses Single-Open-Akkordeon-Verhalten zeigt. `js/glossary.js`
schließt beim Öffnen eines Artikels automatisch alle anderen; der "PIZZA-GLOSSAR"-Header
in `pizza-rechner-mobile.html` ist kein `<details>` mehr (kein Gesamt-Einklappen). Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „Design-System-Import Zyklus 4: Glossar-Screen
(v4.3.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Im Glossar wird beim Aufklappen eines Artikels automatisch der vorher geöffnete
Artikel wieder eingeklappt (nur ein Artikel gleichzeitig offen). Der übergeordnete
"PIZZA-GLOSSAR"-Header verliert seine Einklapp-Funktion für die gesamte Liste.

Motivation: Aktuell lässt sich jeder Glossar-Artikel unabhängig aufklappen, wodurch
mehrere lange Texte gleichzeitig sichtbar sein können und die Liste unübersichtlich wird.
Der Gesamt-Einklapp-Pfeil am Header erzeugt nur unnötige zusätzliche Klicks.

Scope: Akkordeon-Verhalten für alle Glossar-Artikel (neuer Artikel auf → vorheriger
automatisch zu). Einklapp-Pfeil/-Funktion am "PIZZA-GLOSSAR"-Container-Header entfernen;
Artikelliste immer sichtbar, nur einzelne Artikelinhalte bleiben ein-/ausklappbar. Gilt
für alle Kategorien (W-Wert, 00-Mehl, Bäckerprozente, San-Marzano-Tomaten, Passata di
Pomodoro etc.).

Abgrenzung: Keine Änderung an Artikelinhalten, keine Änderung an Suchfunktion/Sortierung
(sofern vorhanden). Kein Zusammenhang mit dem separaten Akkordeon-Feature für
Hinweisboxen in der Rechner-Anleitung (Punkt H unten, eigenständiger Fix). Keine
Persistenz des Aufklapp-Zustands über App-Neustart, sofern nicht anders gewünscht.

### G. Bug: Info-Button bei "Verschwendung anpassen" wird vom "−"-Stepper-Button überdeckt

**Status (2026-07-25): Bereits gelöst, keine Umsetzung mehr nötig.** Live per Headless-
Browser bei echter Mobil-Breite (375px) gegengeprüft (Screenshot-Vergleich Hell/Dunkel):
"Verschwendung anpassen" und "Hefemenge anpassen" brechen sauber auf zwei Zeilen um,
der Stepper (−/Eingabefeld/+/%) sitzt in einer eigenen Zeile darunter, keine
Überlappung. Ursache der Auflösung: das Design-Import Zyklus 5 (v4.4.0,
"Einstellungen-Screen") hat den ursprünglich crowded Info-Button ("i", öffnete/schloss
den Erklärtext) komplett entfernt und durch einen dauerhaft sichtbaren `.hint`-Text
darunter ersetzt (`.switch-row` enthält jetzt nur noch das Label, `.adjust-stepper` ist
eine eigene Zeile darunter) — das genau die Zeile, die vorher überlappte, existiert in
dieser Form nicht mehr. Kein Code-Fix nötig, dieser Punkt bleibt nur zur Doku stehen.

<details><summary>Ursprüngliche Beobachtung/vorgeschlagener Fix (archiviert, nicht mehr relevant)</summary>

Ursache (vermutet): Zeile enthält Label + Info-Icon + Minus-Button + Eingabefeld +
Plus-Button + %-Einheit nebeneinander; Eingabefeld hat wahrscheinlich eine fixe
Mindestbreite, die bei diesem längeren Label ("Verschwendung anpassen" länger als z. B.
"Hefemenge anpassen") nicht mehr genug Platz für den Info-Button lässt, wodurch sich
Elemente überlappen statt umzubrechen.

Vorgeschlagener Fix: Eingabefeld schmaler machen bzw. `min-width` statt fixer `width`,
damit es sich an den verfügbaren Platz anpasst. Alternativ: Label/Steuerzeile per
Flexbox-Wrap bei zu wenig Platz auf zwei Zeilen umbrechen statt zu überlappen.

Scope: Eingabefeld-Breite bei "Verschwendung anpassen" (und vorsorglich bei "Hefemenge
anpassen", strukturell identisch) reduzieren/flexibel gestalten. Sicherstellen, dass
Info-Button-Icon in beiden Zeilen immer vollständig sichtbar bleibt, unabhängig von
Label-Länge/Bildschirmbreite. Kein Eingriff in die Wertelogik der Stepper selbst.

</details>

### ~~H. Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (Akkordeon)~~ — erledigt in v4.10.0

Umgesetzt wie unten beschrieben, mit einem wichtigen Vorbehalt: der Auftragstext stammt von
VOR dem Design-Import-Redesign (v4.0.0-v4.9.1) und referenziert die ALTE Emoji-Farboptik
("grüne 💡, orange ⚠️"). Die konzeptionelle Absicht (Akkordeon, App-weites Single-Open)
wurde 1:1 umgesetzt, aber gegen die TATSÄCHLICH aktuelle Optik/Klassenstruktur (`.tip` =
oliv-grüner Linksrand, `.warn` = ocker-Linksrand, beide ohne Emoji-Hintergrundfläche, seit
Design-Import Zyklus 1-2). `.note`-Boxen (Ergebnis-Panel, `#iceNote`) bewusst NICHT
einbezogen: kein Teil eines einzelnen Anleitungsschritts (anders als der Scope-Text
"innerhalb der Anleitungsschritte" es verlangt), einmaliges Banner statt wiederkehrender
Box je Schritt, und Gegenstand des separaten, noch offenen Backlog Punkts I. `#flourWarn`
(Mehl-Warnung) ebenfalls unverändert (kein Schritt-Bestandteil, direkt handlungsrelevant).
Details: `pizza-rechner-KONTEXT.md`, Abschnitt „Einklappbare Hinweisboxen mit
gegenseitigem Ausschluss (v4.10.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Die bisher permanent sichtbaren Hinweis-/Tipp-Boxen (grüne 💡, orange ⚠️) innerhalb
der Anleitungsschritte werden standardmäßig eingeklappt, nur über einen kleinen
Info-Button pro Schritt aufklappbar. Wird ein zweiter Hinweis geöffnet, klappt der zuvor
geöffnete automatisch zu (nie mehr als eine Box gleichzeitig sichtbar, app-weit über alle
Schritte hinweg).

Motivation: Aktuell werden alle Hinweise dauerhaft ausgeklappt angezeigt, was jede
Schrittkarte erheblich verlängert und den schnellen Überblick erschwert, besonders auf
kleinen Mobildisplays.

Scope: Jede Hinweisbox bekommt eingeklappten Standardzustand (kompakter
Info-Button/Icon-Zeile). Tippen klappt auf, erneutes Tippen klappt zu. Globaler Zustand
pro Ansicht/Session: neue Box auf → alle anderen zu, unabhängig vom Schritt. Gilt für
💡-Tipp- und ⚠️-Warnboxen einheitlich in allen Schritten. Optische Kennzeichnung des
Info-Buttons konsistent mit bestehendem Farbschema.

Abgrenzung: Kein Eingriff in Hinweistext-Inhalte, nur Darstellung/Interaktion. Keine
Änderung an der (separat bereits umgesetzten) Entfernung der Eis-Hinweisbox aus Schritt 2.
Keine Änderung an Kernanleitung/Zahlenwerten/Schrittreihenfolge. Keine Persistenz des
Auf-/Zugeklappt-Zustands über App-Neustart (rein sitzungsbezogen), sofern nicht anders
gewünscht.

### ~~I. Zieltemperatur statt Eis in der Hauptanleitung, Eis nur als Glossar-Fallback~~ — erledigt in v4.11.0

Umgesetzt wie unten beschrieben: Ergebnis-Panel zeigt nur noch die reine Ziel-
Wassertemperatur (eine `.temp-box`), "davon Eis"-Box + Anwärm-Hinweistext entfernt (Desktop
+ Mobil). Unter 15 °C/59 °F (intern immer Celsius verglichen) erscheint ein Verweis-Link zum
neuen, generisch gehaltenen Glossar-Artikel "Eis-Methode". `js/guide.js`-Anleitungsschritte
sprechen ebenfalls nur noch von der Zieltemperatur. `R.ice`/`R.note`/die Energiebilanz-
Formel bleiben in `js/calc.js` technisch unverändert (nur nicht mehr angezeigt);
Einkaufsliste (`js/print.js`) bewusst unangetastet (außerhalb des Scopes). Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „Zieltemperatur statt Eis in der Hauptanleitung, Eis
nur als Glossar-Fallback (v4.11.0)".

Ursprünglicher Auftragstext (zur Referenz):

Idee: Die Hauptanleitung spricht ausschließlich von einer konkreten Ziel-Wassertemperatur
(generisch "Temperatur", automatisch °C/°F je nach Nutzereinstellung), per Thermometer
eingestellt. Eis, Eismenge und redundanter Anwärm-Hinweistext verschwinden komplett aus
der Hauptanleitung. Erst wenn die Zieltemperatur unter 15 °C (bzw. 59 °F) fällt, erscheint
ein Verweis-Link zu einem neuen Glossar-Artikel, der das Eis-Verfahren für diesen
Grenzfall erklärt.

Motivation: Die bisherige Eis-Berechnung setzt voraus, dass Leitungswasser exakt bei
Raumtemperatur startet, was oft nicht zutrifft. Eine direkt angezeigte Zieltemperatur ist
einfacher/robuster (mischen bis Thermometer den Zielwert zeigt). Leitungswasser in
Deutschland liegt je nach Jahreszeit meist zwischen ca. 8–15 °C+; unterhalb dieser
Untergrenze reicht reines Mischen nicht mehr, Eis wird als Werkzeug gebraucht. Der
bisherige Anwärm-Hinweistext ("Schüttwasser leicht anwärmen auf ~27°C") ist zudem
redundant zur bereits prominent angezeigten Temperaturzahl.

Scope: Hauptanleitung zeigt nur noch Ziel-Wassertemperatur in einer Box (Label
"Wassertemperatur" + Wert in aktiver Einheit), kein Eis-Text, keine Eismenge, kein
separater Anwärm-Hinweis. "Davon Eis"-Box + Anwärm-Zusatztext entfallen komplett aus dem
UI-Layout der Wassertemperatur-Karte. Interner Schwellenwert-Vergleich einheitlich in
Celsius (15 °C = 59 °F), Umrechnung nur für Darstellung. Bei Zielwassertemperatur unter
15 °C/59 °F: Hinweis-Link "Temperatur mit Leitungswasser nicht erreichbar? → Glossar:
Eis-Methode". Neuer Glossar-Artikel erklärt DDT, Wassertemperatur-Untergrenze durch
Leitungswasser, Eismengen-Berechnung (bestehende Formel bleibt technische Grundlage),
praktisches Mischen von Eis + Wasser. Bestehende Eis-Berechnungslogik (`js/calc.js`)
bleibt technisch erhalten, nur für Glossar-Fallback-Wert weiterverwendet, nicht mehr
standardmäßig in der Hauptanleitung angezeigt.

Abgrenzung: Keine Änderung an DDT-Grundformel oder Eis-Berechnungsformel selbst, keine
Änderung am Komplexitätsschalter (`.seg`) oder anderen unabhängigen UI-Elementen aus
früheren Fixes, kein genereller Glossar-Redesign (nur ein neuer Artikel plus eine bedingte
Verlinkung). Schwellenwert 15 °C/59 °F fest im Code hinterlegt, nicht konfigurierbar über
Einstellungen.

### ~~J. Fokus-Verlust bei dynamisch ausgeblendeten Feldern (`.collapse`/`.show`-Muster, WCAG 2.4.3)~~ — erledigt in v4.12.0

Umgesetzt wie unten beschrieben: neuer gemeinsamer Helfer `PZ.moveFocusBeforeHide(containers,
fallbackTarget)` + `PZ.toggleCollapse(container, show, opts)` (`js/dom.js`), verschiebt den
Fokus kontrolliert weg, bevor ein fokussiertes `.collapse`/`.show`-Feld verschwindet (nie
mehr kommentarlos auf `<body>`), inkl. optionaler Live-Region-Ansage beim Neu-Erscheinen.
Eingebaut in `#sugarBlock` (`js/calc.js`), `#prefBlock`/`#bigaHydBlock`/`#prefStageBlock`
(`js/ui.js applyMethod()`, gegen gleichzeitig verschwindende Nachbar-Container gehärtet) und
im „Neues Rezept anlegen"-Formular (`js/newrecipe.js`, nicht im engeren Scope genannt, aber
identisches Muster, geringer Zusatzaufwand). Beide MINOR-Nebenbefunde mit erledigt:
Zucker-Pills bekommen `aria-label`; die Live-Region-Ansage beim Neu-Erscheinen wurde bewusst
nur für `#sugarBlock` umgesetzt, nicht für `#prefBlock`/`#bigaHydBlock`/`#prefStageBlock`
(Abgrenzung: ein Methodenwechsel blendet oft mehrere Felder gleichzeitig ein, mehrere
simultane Live-Region-Ansagen wären eher verwirrend als hilfreich). Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „Fokus-Erhalt bei .collapse/.show-Feldern (v4.12.0)".

Ursprünglicher Auftragstext (zur Referenz):

Nebenbefund aus dem `accessibility-expert`-Review zu Backlog Punkt C (v4.7.0, Zucker-Feld
wertbasiert): Wird ein Feld, das gerade den Fokus hält (z. B. `#sugarN`, während der
Nutzer den Zucker-Wert per Tastatur auf 0 ändert), durch das `.collapse`/`.show`-Muster
ausgeblendet, landet der Fokus verloren (meist bei `<body>`) — `renderResult()`/die
jeweilige Render-Funktion prüft beim Toggle nicht, ob gerade ein Kind-Element fokussiert
ist. **Kein neues, durch Punkt C verursachtes Problem:** dasselbe Muster (und damit
dasselbe Risiko) besteht laut Audit identisch bei anderen dynamisch ein-/ausgeblendeten
Feldern der App (`#prefBlock`, `#bigaHydBlock` bei Methodenwechsel) — ein app-weites
Bestandsmuster, nicht lokal auf `#sugarBlock` beschränkt. Bewusst nicht in Punkt C
mitgefixt (hätte den engen Scope auf mehrere unabhängige Felder ausgeweitet), analog zum
Umgang mit früheren app-weiten Nebenbefunden (`--line`-Rahmenkontrast, Tomate-Dunkel).

Idee: Bevor ein fokussiertes Kind-Element durch das `.collapse`/`.show`-Muster aus dem
sichtbaren Bereich verschwindet, den Fokus aktiv auf ein sicheres, weiterhin sichtbares
Ziel verschieben (z. B. das vorherige/nächste sichtbare Feld, oder ein übergeordnetes,
fokussierbares Container-Element), statt ihn kommentarlos auf `<body>` fallen zu lassen.

Motivation: Tastatur-/Screenreader-Nutzer verlieren sonst ohne Ankündigung ihre Position
im Formular (WCAG 2.4.3, Fokus-Reihenfolge) — spürbar z. B. beim Zurücksetzen des
Zucker-Werts auf 0 direkt im Zahlenfeld, beim Preset-Wechsel weg von einem
zucker-/vorteig-haltigen Rezept, oder bei einem Methodenwechsel, der `#prefBlock`
einklappt.

Scope: Ein gemeinsamer, wiederverwendbarer Mechanismus (idealerweise ein kleiner Helfer
in `js/dom.js`, analog zu `PZ.announce()`), der vor jedem `.collapse`/`.show`-Toggle
prüft, ob `document.activeElement` innerhalb des betroffenen Containers liegt, und falls
ja, den Fokus kontrolliert verschiebt. Betrifft mindestens `#sugarBlock`, `#prefBlock`,
`#bigaHydBlock` (Desktop **und** Mobil).

Abgrenzung: Kein genereller Fokus-Management-Umbau der gesamten App, nur die
`.collapse`/`.show`-Container. Keine Änderung an der eigentlichen Sichtbarkeits-Bedingung
der einzelnen Felder (Zucker weiterhin wertbasiert, Vorteig-Felder weiterhin
methodenbasiert). Ebenfalls aus demselben Audit, als MINOR eingestuft (kann bei
Gelegenheit mit erledigt werden, kein eigener Punkt nötig): Zucker-Pills ohne
`aria-label`/`aria-labelledby` (identisches Muster wie die bestehenden Öl-Pills), sowie
fehlende `aria-live`-Ansage, wenn ein `.collapse`/`.show`-Feld neu sichtbar wird.
