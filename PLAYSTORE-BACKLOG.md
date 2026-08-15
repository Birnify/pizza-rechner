# Play-Store-Backlog (Teigmeister)

Stand: 2026-08-15. Ausgangsversion: v4.38.3. Entscheidung des Nutzers vom 2026-08-15:
**Version 1 kommt ohne Konten und ohne Registrierung in den Store.** Alle Daten bleiben
auf dem Gerät. Ein Konto ist damit kein Teil dieses Backlogs.

Diese Datei ist die Arbeitsliste. Sie ist bewusst so geschrieben, dass **jeder Punkt
einzeln und ohne Vorwissen abgearbeitet werden kann**, auch von einem kleineren Modell:
jeder Punkt nennt Ziel, betroffene Dateien, exakte Schritte, Abnahmekriterien und eine
ausdrückliche Liste dessen, was nicht angefasst werden darf.

**Reihenfolge ist verbindlich.** Die Punkte bauen aufeinander auf. Block A funktioniert
komplett im normalen Browser ohne jedes neue Werkzeug, deshalb steht er vorne.

---

## Kernbefunde, die den Zuschnitt bestimmen

Ergebnis der Code-Durchsicht vom 2026-08-15, damit niemand sie neu herleiten muss:

1. **11 Speicher-Schlüssel an 22 Aufrufstellen in 10 Dateien.** Alle greifen direkt auf
   `localStorage` zu, es gibt keine gemeinsame Zwischenschicht.
2. **`localStorage` ist synchron, nativer Speicher ist asynchron.** Das ist die zentrale
   Schwierigkeit der ganzen Umstellung. Wer einfach `await` in die 22 Aufrufstellen
   streut, bricht die App und die Testsuite.
3. **Ein Inline-Script im `<head>` von allen drei HTML-Dateien liest `pizzaTheme`
   synchron vor dem ersten Rendern**, damit das Farbschema nicht flackert. Dieser eine
   Zugriff kann nicht asynchron werden. Lösung siehe B3.
4. **In einer WebView darf Android den `localStorage` jederzeit leeren.** Deshalb ist der
   Speicherumzug kein Schönheitsfehler, sondern der einzige Punkt mit echtem
   Datenverlustrisiko.
5. **Der Gärzeit-Timer läuft über `setInterval` plus Web-Notification plus Web-Audio.**
   Alle drei werden im Hintergrund angehalten. Bei 17 Stunden Biga oder 48 Stunden
   Kaltgare ist das der Normalfall, nicht der Ausnahmefall.
6. **`window.print()` und `a.download` tun in einer Android-WebView nichts.**

### Die 11 Schlüssel

| Schlüssel | Datei | Inhalt |
|---|---|---|
| `pizzaRechner` | `js/storage.js` | Alle benannten Rezepte. Der wichtigste |
| `pizzaPartyPlanner` | `js/party.js` | Pizza-Party-Planung |
| `pizzaRechnerFeatureFlags` | `js/settings.js` | Einstellungs-Schalter |
| `pizzaRechnerAdjustments` | `js/settings.js` | Hefemenge und Verschwendung |
| `pizzaLang` | `js/i18n.js` | Sprachwahl |
| `pizzaTheme` | `js/theme.js` | Hell oder dunkel. Siehe Befund 3 |
| `pizzaUnits` | `js/units.js` | Metrisch oder imperial |
| `pizzaSimpleMode` | `js/simplemode.js` | Einfachmodus |
| `pizzaOnboardingDontShow` | `js/onboarding.js` | Einführung nicht mehr zeigen |
| `pizzaRechnerTimers` | `js/timer.js` | Laufende Timer |
| `pizzaRechnerTimerHintShown` | `js/timer.js` | Timer-Hinweis gezeigt |

`pzPresetSwipeHint` in `js/presets.js` nutzt bewusst `sessionStorage` und bleibt
flüchtig. **Nicht mit umstellen.**

---

# Block A: Vorbereitung im Browser

Kein Capacitor, kein Node, keine neuen Werkzeuge. Alles läuft im normalen Browser und in
der bestehenden Testsuite. Diese drei Punkte sind mechanisch und risikoarm.

---

## A1. Speicher-Zwischenschicht `js/store.js` einziehen — ERLEDIGT (v4.38.4, 2026-08-15)

Details: `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Speicher-Zwischenschicht
js/store.js (v4.38.4)". Empfohlener nächster Punkt: A2 oder A3 (beide setzen nur A1
voraus).

**Aufwand:** 1 Zyklus. Mechanisch, kein Denken an der Fachlogik.

**Ziel:** Ein einziger Ort, über den aller Speicherzugriff läuft. Verhalten bleibt exakt
gleich, Hintergrund bleibt `localStorage`. Das ist reine Vorbereitung, damit später nur
noch **eine** Datei getauscht werden muss statt 22 Stellen.

**Neu anzulegen:** `js/store.js` mit diesem Umfang:

- `PZ.store.KEYS` als Objekt mit allen 11 Schlüsselnamen aus der Tabelle oben
- `PZ.store.get(key)` gibt den Rohwert als String zurück, oder `null`
- `PZ.store.set(key, value)` schreibt einen String
- `PZ.store.remove(key)`
- `PZ.store.getJSON(key, fallback)` und `PZ.store.setJSON(key, obj)` für die Stellen,
  die heute selbst `JSON.parse` und `JSON.stringify` aufrufen
- Alle Funktionen fangen Fehler ab und geben bei Fehlschlag `null` bzw. `false` zurück,
  genau wie die heutigen `try/catch`-Blöcke

**Zu ändern (9 Dateien, 22 Stellen):** `js/i18n.js`, `js/onboarding.js`, `js/party.js`,
`js/settings.js`, `js/simplemode.js`, `js/storage.js`, `js/theme.js`, `js/timer.js`,
`js/units.js`. Jedes `localStorage.getItem(X)` wird zu `PZ.store.get(X)`, jedes
`localStorage.setItem(X, Y)` zu `PZ.store.set(X, Y)`. Die umgebenden `try/catch`-Blöcke
können bleiben, sie schaden nicht.

**Einbinden:** `<script src="js/store.js"></script>` in `pizza-rechner.html` und
`pizza-rechner-mobile.html` **als allererstes Modul, vor `js/dom.js`**. Danach
`python build-mobile-standalone.py` laufen lassen.

**Abnahme:**
- `grep -rn "localStorage\." js/` findet in den 9 Dateien **keinen** Treffer mehr.
  Treffer erlaubt bleiben nur in `js/store.js` selbst.
- `js/presets.js` behält seine beiden `sessionStorage`-Zeilen unverändert.
- Alle 1353 Prüfungen in `tests/test.html` bleiben grün.
- Rezept speichern, App neu laden, Rezept ist noch da. Auf Desktop und Mobil.

**Nicht anfassen:** Das Inline-Script im `<head>` (kommt in B3 dran). Die
`sessionStorage`-Stellen. Jegliche Fachlogik, Berechnung oder Oberfläche.

---

## A2. `js/store.js` auf asynchronen Hintergrund vorbereiten — ERLEDIGT (v4.39.0, 2026-08-15)

Details: `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Speicher-Zwischenschicht js/store.js
asynchron vorbereitet (v4.39.0)". Empfohlener nächster Punkt: A3 oder B1 (beide setzen nur
A1/A2 voraus).

**Aufwand:** 1 Zyklus. Setzt A1 voraus.

**Ziel:** Die Zwischenschicht bekommt einen Zwischenspeicher im Arbeitsspeicher, damit
die 22 Aufrufstellen **synchron bleiben können**, obwohl der echte Speicher später
asynchron ist. Ohne diesen Schritt müsste später die halbe App auf `await` umgebaut
werden.

**Bauweise:**

- Internes `cache`-Objekt hält alle Werte im Arbeitsspeicher
- `PZ.store.hydrate()` ist `async`, liest alle 11 Schlüssel einmal aus dem Hintergrund
  in den Zwischenspeicher und gibt ein Promise zurück
- `PZ.store.get()` liest **nur** aus dem Zwischenspeicher, bleibt synchron
- `PZ.store.set()` schreibt sofort in den Zwischenspeicher, synchron, und stößt das
  Schreiben in den Hintergrund nebenher an, ohne darauf zu warten
- `PZ.store.flush()` gibt ein Promise zurück, das erfüllt ist, wenn alle angestoßenen
  Schreibvorgänge durch sind
- Der Hintergrund selbst steckt hinter `PZ.store._backend` mit den drei Methoden
  `get`, `set`, `remove`. In diesem Punkt ist der Hintergrund weiterhin `localStorage`

**Abnahme:**
- Alle 1353 Prüfungen bleiben grün
- App verhält sich unverändert, Werte überleben das Neuladen
- Neue Testsektion `43 · Speicher-Zwischenschicht (js/store.js)` in `tests/test.html`:
  Zwischenspeicher wird durch `hydrate()` gefüllt, `get()` liefert ohne `await`,
  `set()` ist im `get()` sofort sichtbar, `flush()` erfüllt sich

**Nicht anfassen:** Die 22 Aufrufstellen aus A1. Sie dürfen sich nicht ändern, das ist
der ganze Zweck der Übung.

---

## A3. Vollständige Sicherung exportieren und einlesen

**Aufwand:** 1 bis 2 Zyklen. Setzt A1 voraus.

**Ziel:** Ohne Konto ist das die Absicherung gegen Geräteverlust und der Weg auf ein neues
Handy. Es gibt in `js/main.js` bereits `PZ.exportRecipes()` und `PZ.importRecipes()`,
die aber **nur die Rezepte** umfassen.

**Umfang:** Eine Datei, die alle 11 Schlüssel enthält, plus Formatversion und
Erstellungsdatum. Beim Einlesen: Formatversion prüfen, unbekannte Schlüssel ignorieren
statt abzubrechen, dem Nutzer vor dem Überschreiben eine Rückfrage stellen.

**Abnahme:**
- Sicherung schreiben, App-Daten vollständig löschen, Sicherung einlesen, alles ist
  zurück: Rezepte, Party-Planung, Einstellungen, Sprache, Farbschema, Einheiten
- Eine Sicherung im alten Nur-Rezepte-Format lässt sich weiterhin einlesen
- Eine kaputte Datei erzeugt eine verständliche Meldung, keinen stillen Datenverlust
- Neue Prüfungen in `tests/test.html`

**Nicht anfassen:** Das bestehende Rezept-Teilen über Link (`js/share.js`).

---

# Block B: Capacitor-Grundgerüst

Ab hier werden Werkzeuge gebraucht. **Punkt B1 ist ein Einrichtungsschritt, kein
Programmierschritt**, und sollte nicht an ein kleines Modell gegeben werden.

---

## B1. Werkzeuge einrichten und Capacitor-Projekt aufsetzen

**Aufwand:** 1 Zyklus reine Einrichtung, plus Wartezeit für Installationen. **Einmalig.**

**Voraussetzungen, die installiert sein müssen:** Node.js (LTS), Java JDK,
Android Studio samt Android SDK und einem Emulator oder ein Handy mit
USB-Fehlersuche.

**Schritte:**
- `package.json` anlegen, Capacitor als Abhängigkeit, Android-Plattform ergänzen
- **Wichtige Entscheidung:** Capacitor braucht ein Verzeichnis mit genau den Dateien,
  die ins Paket sollen. Der Projektordner selbst taugt dafür nicht, weil `Versionen/`,
  `assets/` und `_review/` mit hineingeraten würden. Deshalb ein neues Skript
  `build-app.py` nach dem Vorbild von `build-mobile-standalone.py`, das die benötigten
  Dateien nach `www/` kopiert: `pizza-rechner-mobile.html` als `index.html`, dazu
  `css/`, `js/`, `fonts/`, `assets/img/`
- `www/` und die Capacitor-Ordner in `.gitignore` aufnehmen
- Erster Testbau, App startet auf Gerät oder Emulator

**Abnahme:** Die App startet nativ, Rechner, Anleitung, Glossar und Pizza-Party sind
bedienbar. Dass Timer, Drucken und Speicher noch nicht richtig arbeiten, ist an dieser
Stelle erwartet und kein Fehler.

**Bekannte Baustellen, die hier auffallen werden und je einen eigenen Punkt haben:**
Farbschema flackert beim Start (B3), Timer feuert nicht (C1), Drucken tut nichts (C2),
Zurück-Taste schließt die App (C3).

---

## B2. Startbildschirm hält, bis der Speicher geladen ist

**Aufwand:** 1 Zyklus. Setzt A2 und B1 voraus.

**Ziel:** Der native Startbildschirm bleibt sichtbar, bis `PZ.store.hydrate()` fertig ist.
Damit sieht der Nutzer nie einen halb geladenen Zustand, und die App darf intern
asynchron starten, ohne dass es auffällt.

**Umfang:** `js/main.js` startet die App erst, nachdem `hydrate()` erfüllt ist. Danach
Startbildschirm ausblenden. Sicherheitsnetz einbauen: falls `hydrate()` hängt, nach
wenigen Sekunden trotzdem starten, damit die App nie dauerhaft im Startbild klebt.

**Abnahme:** Kein sichtbares Umspringen von Inhalten beim Start. Beim allerersten Start
ohne gespeicherte Daten startet die App ebenfalls sauber.

---

## B3. Speicher-Hintergrund auf nativen Gerätespeicher umstellen

**Aufwand:** 1 bis 2 Zyklen. Setzt A2 und B2 voraus. **Der wichtigste Punkt im ganzen
Backlog.**

**Ziel:** Ab hier liegen die Daten dauerhaft und sind gegen das Leeren der WebView
geschützt.

**Umfang:** Nur `js/store.js` wird angefasst, `PZ.store._backend` zeigt statt auf
`localStorage` auf den nativen Speicher (Capacitor Preferences). Die 22 Aufrufstellen
bleiben unverändert. Das ist der Lohn für A1 und A2.

**Einmalige Übernahme der Altdaten:** Beim ersten Start nach der Umstellung alle 11
Schlüssel aus `localStorage` lesen und in den nativen Speicher schreiben, danach eine
Markierung setzen, damit das nur einmal passiert. Die Altdaten in `localStorage`
vorsichtshalber **nicht löschen**.

**Sonderfall Farbschema, siehe Kernbefund 3:** Das Inline-Script im `<head>` muss
synchron bleiben. Lösung: `PZ.store.set('pizzaTheme', ...)` schreibt den Wert
**zusätzlich** weiterhin nach `localStorage`, rein als Spiegel für diesen einen
Vorab-Zugriff. Das Inline-Script bleibt dadurch unverändert. Falls der Spiegel doch
einmal geleert wird, greift die vorhandene Systemerkennung, das Schlimmste ist ein
einmalig falsches Farbschema für den Bruchteil einer Sekunde, kein Datenverlust.

**Abnahme:**
- Rezept anlegen, App vollständig beenden, neu starten, Rezept ist da
- In den Android-Systemeinstellungen den Cache der App leeren, Rezepte überleben das
- Ein Gerät mit Altdaten aus der Browserversion übernimmt diese beim ersten Start
- Kein Flackern des Farbschemas beim Start
- Alle 1353 Prüfungen bleiben grün, die Testsuite läuft weiterhin im Browser gegen den
  `localStorage`-Hintergrund

---

# Block C: Native Funktionen

---

## C1. Gärzeit-Timer auf echte Systembenachrichtigungen

**Aufwand:** 2 bis 3 Zyklen. **Der anspruchsvollste Punkt.** Setzt B1 voraus.

**Ziel:** Ein Timer über 17 oder 48 Stunden feuert zuverlässig, auch wenn die App längst
geschlossen ist.

**Ausgangslage in `js/timer.js`:** `setInterval` für die Anzeige, Web-Notification für
die Meldung, Web-Audio für den Ton. Dazu zwei Behelfe, die es nur gibt, weil eine
Webseite das nicht kann: ein Android-Uhr-Intent und ein Kalender-Export.

**Umfang:**
- Benachrichtigungen beim Anlegen eines Timers über Capacitor Local Notifications
  **einplanen**, statt sie beim Ablauf auszulösen
- Berechtigung ab Android 13 abfragen, und den Fall behandeln, dass sie verweigert wird
- Timer nach einem Geräteneustart neu einplanen
- Energiesparfunktionen berücksichtigen, damit lange Laufzeiten nicht verschluckt werden
- `setInterval` bleibt **nur** für die Anzeige im Vordergrund zuständig
- Beim Öffnen der App die verbleibende Zeit aus dem gespeicherten Zielzeitpunkt neu
  berechnen, nie aus mitgezähltem Zwischenstand

**Entscheidung zu den zwei Behelfen:** Der Android-Uhr-Intent wird überflüssig und kann
in der nativen App entfallen. Der Kalender-Export ist weiterhin nützlich und bleibt.

**Abnahme:**
- Timer über 2 Minuten stellen, App vollständig beenden, Benachrichtigung kommt
- Timer über mehrere Stunden stellen, Gerät neu starten, Benachrichtigung kommt trotzdem
- Verweigerte Berechtigung führt zu einem verständlichen Hinweis, nicht zu einem stillen
  Nichtstun

---

## C2. Drucken und PDF über das Teilen-Menü

**Aufwand:** 1 Zyklus. Setzt B1 voraus.

**Ziel:** Anleitung und Einkaufsliste lassen sich wieder ausgeben.

**Ausgangslage:** `js/print.js` ruft `window.print()`, wirkungslos in der WebView.
`js/pdf.js` erzeugt ein Blob und hängt es an `a.download`, ebenfalls wirkungslos. Der
PDF-Erzeuger ist selbst geschrieben und braucht keine Fremdbibliothek, das erleichtert
die Sache.

**Umfang:** Das fertige PDF in eine Datei schreiben und ans System-Teilen-Menü übergeben.
Von dort kann der Nutzer drucken, speichern oder verschicken. Die beiden
Druckvarianten aus `js/print.js`, ganze Anleitung und nur Einkaufsliste, bleiben als
Auswahl erhalten.

**Abnahme:** Beide Varianten erzeugen eine PDF-Datei, das Teilen-Menü öffnet sich, die
Datei lässt sich speichern und öffnen und ist inhaltlich vollständig.

**Nicht anfassen:** Die PDF-Erzeugung selbst, also Aufbau, Schriften und Layout in
`js/pdf.js`.

---

## C3. Android-Feinschliff

**Aufwand:** 1 Zyklus. Setzt B1 voraus.

**Umfang:**
- **Zurück-Taste:** schließt heute die App. Sie soll stattdessen innerhalb der App
  zurückgehen, also offene Ansicht schließen oder zur vorherigen Ansicht wechseln, und
  erst auf der Startansicht die App verlassen. Anbindung an `js/nav.js`
- **Statusleiste:** Farbe passend zum Farbschema, hell und dunkel
- **Randbereiche:** die vorhandenen `env(safe-area-inset-*)`-Regeln aus dem iOS-Fix
  gegen echte Android-Geräte gegenprüfen
- **Bildschirm anlassen** während ein Timer sichtbar läuft, optional

**Abnahme:** Zurück-Taste verhält sich erwartbar, Statusleiste passt in beiden
Farbschemata, keine überdeckten Bedienelemente auf einem Gerät mit Gestensteuerung.

---

## C4. App-Symbol und Startbildschirm

**Aufwand:** 1 Zyklus.

**Umfang:** Aus `teigmeister-icon-optical-center.svg` die benötigten Android-Größen
erzeugen, inklusive adaptivem Symbol mit Vorder- und Hintergrundebene. Startbildschirm
in hell und dunkel.

**Abnahme:** Symbol sieht auf rundem, eckigem und quadratischem Zuschnitt gut aus,
Startbildschirm flackert nicht und passt zum Farbschema.

---

# Block D: Veröffentlichung

---

## D1. Aufräumen und Versionierung

**Aufwand:** 1 Zyklus.

**Umfang:**
- Die `?v=`-Parameter an allen Skript- und CSS-Pfaden entfernen. Sie lösen ein reines
  Browser-Problem und sind im Paket sinnlos. Betrifft alle drei HTML-Dateien
- `build-app.py` fertigstellen und dokumentieren
- Versionsnummer an einer Stelle pflegen und daraus die Android-Werte ableiten:
  `versionName` entspricht der SemVer-Nummer, `versionCode` ist eine ganze Zahl, die
  bei **jeder** Store-Einreichung steigen muss
- `pizza-rechner-KONTEXT.md` um einen kurzen Abschnitt zum App-Bau ergänzen

**Abnahme:** Frischer Bau aus sauberem Zustand ergibt eine lauffähige App.

---

## D2. Datenschutzerklärung und Impressum

**Aufwand:** 1 Zyklus plus Prüfung durch den Nutzer.

**Umfang:** Zwei öffentlich erreichbare Seiten. Ohne Konten ist die
Datenschutzerklärung kurz und ehrlich: die App erhebt keine Daten, überträgt nichts,
alles bleibt auf dem Gerät, es gibt keine Statistik- und keine Absturzberichte-Dienste.
Impressum nach Paragraf 5 Digitale-Dienste-Gesetz. Hosting über eine kostenlose
Projektseite genügt.

**Wichtig:** Diese Entscheidung muss auch eingehalten werden. **Keine Statistik- und
keine Absturzberichte-Dienste einbauen**, sonst wird zusätzlich eine
Einwilligungsabfrage beim ersten Start nötig, und die Datenschutzerklärung wird ein
ganz anderes Dokument.

**Abnahme:** Beide Seiten sind über eine feste Adresse erreichbar. Der Nutzer hat sie
gelesen und freigegeben. Für die endgültige Fassung ist juristischer Blick empfohlen.

---

## D3. Play Console einrichten

**Aufwand:** 1 Zyklus, überwiegend Formulare, nicht durch ein Modell erledigbar.

**Umfang:**
- Entwicklerkonto anlegen, 25 USD einmalig, Identitätsprüfung durchlaufen
- Store-Material: Symbol 512 mal 512, Grafik 1024 mal 500, mindestens zwei
  Bildschirmfotos, Kurzbeschreibung bis 80 Zeichen, Langbeschreibung bis 4000 Zeichen
- Formular Datensicherheit ausfüllen. Ohne Konten fast durchgehend nein
- Alterseinstufung beantworten, Zielgruppe festlegen, nicht Kinder
- App-Signatur über Google einrichten
- Ziel-API-Stand prüfen

**Sofort mit erledigen: Tester suchen.** Siehe D4, das ist der eigentliche Engpass.

---

## D4. Geschlossener Test und Freigabe

**Aufwand:** Wenig Arbeit, aber **mindestens 14 Tage Wartezeit, die sich nicht
abkürzen lässt.**

Google verlangt von neu angelegten privaten Entwicklerkonten einen geschlossenen Test
vor der ersten Produktionsfreigabe, nach zuletzt bekanntem Stand mit zwölf Testern, die
14 Tage ununterbrochen angemeldet bleiben. Firmenkonten sind ausgenommen.

**Diese Regel ändert Google regelmäßig. Beim Anlegen des Kontos in der Play Console
gegenprüfen, was dann tatsächlich gilt.** Unabhängig von den genauen Zahlen bleibt:
zwölf reale Menschen mit Google-Konto zu finden ist für die meisten der eigentliche
Engpass, nicht der Code. Damit anfangen, sobald das Entwicklerkonto steht, nicht erst
wenn die App fertig ist.

**Schritte:** Test einrichten, Tester einladen, Zeitraum abwarten, Rückmeldungen
einarbeiten, Produktionszugang beantragen, Prüfung abwarten, veröffentlichen. Start
zunächst gerne auf Deutschland begrenzt.

---

# Später, bewusst nicht Teil von Version 1

- **Konten und Geräte-Synchronisierung.** Vom Nutzer am 2026-08-15 zurückgestellt.
  Falls es später kommt: Anbieter mit Serverstandort in der EU, Löschung des Kontos in
  der App **und** über eine öffentliche Webseite (Google-Pflicht), App muss ohne
  Anmeldung voll nutzbar bleiben (Apple-Pflicht), dazu Auftragsverarbeitungsvertrag,
  Verarbeitungsverzeichnis und Löschkonzept.
- **Apple App Store.** 99 USD pro Jahr, ein Mac zum Bauen und Signieren nötig,
  Datenschutz-Etiketten im Eintrag, Richtlinie 4.2 zur Mindestfunktionalität beachten.
  Derselbe Code, zusätzliche Plattform im Capacitor-Projekt.
- Die offenen Punkte aus `pizza-rechner-KONTEXT.md`, Abschnitt „Mögliche nächste
  Schritte", laufen unabhängig weiter und sind von diesem Backlog nicht berührt.

---

# Überblick

| Punkt | Aufwand | Setzt voraus | Für kleines Modell geeignet |
|---|---|---|---|
| A1 Zwischenschicht einziehen | 1 Zyklus | nichts | ja, rein mechanisch |
| A2 Asynchron vorbereiten — **erledigt (v4.39.0)** | 1 Zyklus | A1 | ja, eng umrissen |
| A3 Sicherung exportieren | 1 bis 2 | A1 | ja |
| B1 Capacitor einrichten | 1 plus Installationen | Werkzeuge | nein, Einrichtung |
| B2 Startbildschirm | 1 Zyklus | A2, B1 | ja |
| B3 Nativer Speicher | 1 bis 2 | A2, B2 | mit Sorgfalt |
| C1 Timer nativ | 2 bis 3 | B1 | nein, anspruchsvollster Punkt |
| C2 Drucken und PDF | 1 Zyklus | B1 | ja |
| C3 Android-Feinschliff | 1 Zyklus | B1 | ja |
| C4 Symbol und Start | 1 Zyklus | B1 | ja |
| D1 Aufräumen | 1 Zyklus | B1 | ja |
| D2 Rechtstexte | 1 Zyklus | nichts | Entwurf ja, Freigabe Nutzer |
| D3 Play Console | 1 Zyklus | D2 | nein, Formulare |
| D4 Test und Freigabe | 14 Tage Wartezeit | alles | nein |

**A1 erledigt (v4.38.4, 2026-08-15). A2 erledigt (v4.39.0, 2026-08-15).** Empfohlener
nächster Einstieg: A3 oder B1 (beide setzen nur A1/A2 voraus).
