# Backlog / Sessionübergabe

Stand: 2026-07-23. Für Fortsetzung in einer neuen Session (auch anderer Account/Maschine).
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

## Aktuell pausierte Warteschlange (bereits vollständig definiert, bereit für den Orchestrator)

Ursprünglich zwei Punkte, bereits an eine Orchestrator-Instanz übergeben und von ihr
bestätigt, aber auf Nutzerwunsch pausiert. **Punkt 2 ist seit v4.0.0 (Design-System-Import
Zyklus 1: Tokens + Rechner-Screen) erledigt** — der neue `.seg`-Schalter aus dem
Design-Token-Import bekam automatisch einen sichtbaren Rahmen (`--surface-2`-Fläche +
`1px solid var(--line)`), identisches Problem, andere Lösung als ursprünglich hier
geplant. Details: `pizza-rechner-KONTEXT.md`, Abschnitt „Mögliche nächste Schritte".
Nur noch Punkt 1 ist offen, direkt 1:1 an eine neue, frische Orchestrator-Instanz
übergebbar.

### Punkt 1: Ergebnis priorisieren

Name: Ergebnis priorisieren

Idee: Die Aktionsleiste am Ende der Ergebniskarte neu ordnen: primäre Aktion "Zum
Zeitplan", sekundär "Rezept teilen" direkt daneben, alle übrigen Aktionen und Detailboxen
in einen eingeklappten Bereich "Weitere Optionen" verschieben.

Motivation: Die ausführliche Ergebniskarte konkurriert mit vielen Detailwerten und
mehreren gleichrangigen Aktionen (UX-Review "Teigmeister", Punkt 4, Priorität Mittel).
Aktuell stehen Speichern, Einkaufsliste drucken, Anleitung drucken, Als PDF speichern und
Link kopieren ohne Rangfolge nebeneinander, das erschwert den Abschluss des Rechenflusses
und die Weiterführung zum eigentlich nächsten Schritt (Zeitplan).

Scope: Primäre Aktion "Zum Zeitplan" (springt in den bestehenden, bereits live
berechneten Zeitplan-Tab), sekundäre Aktion "Rezept teilen" (bisheriges Link kopieren).
Speichern, Einkaufsliste drucken, Anleitung drucken, Als PDF speichern sowie die
"Temperatur"-Detailbox wandern in einen eingeklappten Bereich "Weitere Optionen"
darunter. Gesamtteig-Kopfzeile und die 6 Gesamtmengen (Mehl/Wasser/Salz/Hefe/Öl/Zucker)
bleiben wie bisher zuerst sichtbar.

Abgrenzung: Keine Änderung der Berechnungslogik oder der Zeitplan-Funktion selbst, keine
Änderung an den bereits kollabierbaren Vorteig-/Hauptteig-Stufen, keine Änderung an der
bestehenden Sticky-Ergebnisleiste (Quickbar) unten.

### ~~Punkt 2: Rahmen-Fix Komplexitätsschalter~~ — erledigt in v4.0.0

Ursprünglich geplant als eigener, kleiner Fix (Rahmen/Kontrast für den freistehenden
"Einfach | Profi"-Schalter, `.seg` nutzte `background:var(--bg)` identisch zum
Seitenhintergrund). Stattdessen automatisch durch den Design-Token-Import (Zyklus 1:
Tokens + Rechner-Screen) miterledigt: `.seg` nutzt jetzt app-weit `background:
var(--surface-2)` + `border:1px solid var(--line)`. Details:
`pizza-rechner-KONTEXT.md`, Abschnitt „Mögliche nächste Schritte".

## Weitere Ideen (aus Backlog.txt, noch nicht in die Orchestrator-Warteschlange eingereiht)

Reihenfolge unter den 9 Punkten noch nicht final festgelegt. Ausdrücklicher
Abhängigkeits-Hinweis: **Punkt B setzt voraus, dass Punkt 1 oben ("Ergebnis
priorisieren") bereits umgesetzt ist** (referenziert dessen "Weitere Optionen"-Bereich).

### A. Inline-Verlinkung von Glossar-Begriffen im Anleitungstext

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

### B. "Teilen-Link" und "Einkaufsliste" aus Einstellungen entfernen, dauerhaft in "Weitere Optionen" verfügbar machen

*(Abhängig von Punkt 1 "Ergebnis priorisieren" oben.)*

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

### C. "New York Style"-Einstellung entfernen, Zuckerfeld wertbasiert statt togglebasiert steuern

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

### D. Einfrier-Hinweis aus Anleitung und Einstellungen entfernen, Glossar-Artikel "Einfrieren" erstellen

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

### E. Bug: Untere Navigationsleiste rutscht hoch, Farblücke am Bildschirmrand

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

### F. Akkordeon-Verhalten für Glossar-Artikel, Entfernen des Glossar-Gesamt-Einklappens

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

### H. Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (Akkordeon)

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

### I. Zieltemperatur statt Eis in der Hauptanleitung, Eis nur als Glossar-Fallback

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
