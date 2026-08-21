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

## A3. Vollständige Sicherung exportieren und einlesen — ERLEDIGT (v4.40.0, 2026-08-15)

Details: `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Vollständige Sicherung
exportieren und einlesen (v4.40.0)". Empfohlener nächster Punkt: B1 (Capacitor-
Grundgerüst, kein Programmierschritt, sollte nicht an ein kleines Modell gegeben werden).

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

## B1. Werkzeuge einrichten und Capacitor-Projekt aufsetzen — ERLEDIGT (2026-08-16)

Alle Werkzeuge installiert (Node.js LTS, Temurin JDK 17 **und** 21 — Capacitor/Gradle
brauchen JDK 21, nicht 17, das war beim ersten Build-Versuch nicht bekannt —, Android
Studio, Android SDK headless per `sdkmanager` eingerichtet: platform-tools, Android-14-
Plattform, Build-Tools 34, Emulator, virtuelles Testgerät `Teigmeister_Test`). Neues
`build-app.py` baut `www/` aus `pizza-rechner-mobile.html` + `css/`/`js/`/`fonts/`/
`assets/img/` + `assets/logo.svg` (Root-Datei, wurde im ersten Anlauf vergessen, führte
zu fehlendem Logo, seither mit ergänzt). `package.json` + Capacitor (`@capacitor/core`,
`@capacitor/cli`, `@capacitor/android`) installiert, `capacitor.config.json`
(`appId: com.teigmeister.app`, **Platzhalter, vor der ersten echten Store-Einreichung
bewusst prüfen/ändern** — danach nicht mehr änderbar ohne neuen Store-Eintrag),
natives `android/`-Projekt via `npx cap add android` erzeugt. `www/` und generierte
Android-Build-Artefakte in `.gitignore` aufgenommen, `android/` selbst bleibt
versioniert.

**Eigenheit dieses Projektordners:** liegt in OneDrive, `shutil.rmtree()` auf `www/`
schlug wiederholt mit `PermissionError` fehl (OneDrive-Sync-Lock) — `build-app.py`
löscht `www/` daher nicht mehr, sondern überschreibt nur (`dirs_exist_ok=True`).

**Erster Testbau erfolgreich** (`gradlew assembleDebug`, JDK 21), auf dem Emulator
installiert und **live per Screenshot + Touch-Simulation (adb) durchgeklickt**, nicht
nur behauptet: Rechner (Rezeptauswahl, Einstellungen-Stepper, Hefe-Art-Umschalter),
Schritt-für-Schritt-Anleitung (mit Fotos), Glossar (mit Fotos + Suchfeld), Pizza Party
(Steppers) — alle vier funktionieren nativ, keine Abstürze, keine Fehler im Logcat außer
dem behobenen Logo-Pfad. Wie erwartet (s. „Bekannte Baustellen" unten) noch nicht
geprüft/funktionsfähig: Farbschema-Flackern beim Start, Timer, Drucken, Zurück-Taste —
das sind B2/C1/C2/C3.

**Nebenbefund, für D3 relevant:** Googles Play-Console-Bestätigung „Zugriff auf ein
Android-Mobilgerät" verlangt ausdrücklich ein ECHTES physisches Gerät mit der
Play-Console-App, nicht per Emulator lösbar (bewusste Anti-Fraud-Prüfung von Google).
Nutzer hat aktuell kein eigenes Android-Handy — entweder kurz eins leihen oder ein
günstiges Gebrauchtgerät besorgen, bevor D3 ansteht.

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

## B2. Startbildschirm hält, bis der Speicher geladen ist — ERLEDIGT (2026-08-16)

`@capacitor/splash-screen` installiert (`npm install`, danach `npx cap sync android` --
das Plugin registriert sich automatisch, kein manueller Java-Eintrag nötig).
`capacitor.config.json` bekam `plugins.SplashScreen.launchAutoHide: false`, damit der
native Startbildschirm NICHT mehr automatisch beim ersten WebView-Rendering verschwindet.

**`js/main.js`:** der bisherige Boot-Ablauf (Laden aus dem Speicher, `applyMethod()`,
`calc()`, Live-Region scharfschalten) steckt jetzt in einer Funktion `boot()`.
Feature-Erkennung `window.Capacitor?.isNativePlatform()` entscheidet den Weg dorthin:
- **Kein Capacitor (normaler Browser, Desktop und Mobil):** `boot()` läuft weiterhin
  sofort synchron, exakt wie vorher -- keine neue Wartezeit, kein Promise-Tick.
- **Native App:** erst `PZ.store.hydrate()` abwarten (oder ein 4-Sekunden-Sicherheitsnetz-
  Timer, je nachdem was zuerst feuert -- ein `started`-Flag verhindert einen doppelten
  Boot), danach `boot()` und `Capacitor.Plugins.SplashScreen.hide()` (bewusst der
  ungebündelte `Capacitor.Plugins.<Name>`-Zugriff, nicht ein ES-Modul-Import -- die App
  lädt weiterhin klassische `<script src>`-Dateien ohne Bundler).

**Nebenbefund, für künftige `gradlew`-Aufrufe relevant:** `:app:mergeDebugResources`
schlug reproduzierbar mit `AccessDeniedException`/„Unable to delete directory" auf einem
frisch angelegten `app/build/intermediates/merged_res_blame_folder/...`-Ordner fehl --
weder Gradle-Daemon-Neustart noch manuelles Löschen von `app/build` halfen dauerhaft.
Ursache: die Ordner tragen laut `Get-ChildItem -Force`-Check das `ReparsePoint`-Attribut
(OneDrive-Cloud-Platzhalter, obwohl "Pinned"/lokal verfügbar) -- Gradles Dateisystem-
Watcher (VFS) kollidiert damit beim Erstellen/Löschen kurzlebiger Zwischenordner.
**Behoben durch `org.gradle.vfs.watch=false` in `android/gradle.properties`**
(dauerhaft, kommentiert dort), danach lief `gradlew assembleDebug` wiederholt sauber
durch, auch nach `rm -rf app/build build`.

**Echte Verifikation auf dem Emulator (`Teigmeister_Test`, nicht nur Code-Review):**
`gradlew assembleDebug` (JDK 21) + `adb install -r`. Logcat bestätigt den `SplashScreen.
hide()`-Aufruf zeitlich NACH dem vollständigen JS-Boot (Anleitungsbilder bereits im
Netzwerk-Log, bevor `hide()` greift), native Splash-View verschwindet danach sauber
(`SplashScreenView: remove starting view`), kein Hängenbleiben. Per Screenshot bestätigt:
normaler Neustart mit vorhandenen Daten zeigt sofort den fertigen Rechner ohne
Zwischenzustand; `adb shell pm clear` (frische Installation ohne jede gespeicherte
Einstellung) startet ebenfalls sauber bis zum Onboarding-Screen, kein Kleben im
Startbild.

**Tests:** `tests/test.html` unverändert 1442/1442 grün (die Datei lädt `js/main.js`
nicht, s. Dateistruktur -- das Boot-Verhalten ist hier ausschließlich über die native
Live-Verifikation abgesichert, nicht über die Testsuite).

**Geändert:** `js/main.js`, `capacitor.config.json`, `android/gradle.properties`,
`package.json`/`package-lock.json` (neue Abhängigkeit), `android/app/capacitor.build.gradle`
+ `android/capacitor.settings.gradle` (automatisch von `npx cap sync` aktualisiert),
`pizza-rechner-mobile-standalone.html` neu gebaut. **Nicht angefasst:** `pizza-rechner.html`
(Desktop-Quelle lädt zwar dasselbe `js/main.js`, aber ohne `window.Capacitor` bleibt das
Verhalten dort unverändert), Inline-Theme-Script im `<head>` (B3), `PZ.store.hydrate()`/
`flush()` selbst (kommen aus A2, werden hier nur aufgerufen). Empfohlener nächster Punkt:
B3 (nativer Speicher, der wichtigste Punkt im ganzen Backlog).

---

## B3. Speicher-Hintergrund auf nativen Gerätespeicher umstellen — ERLEDIGT (2026-08-16)

**Der wichtigste Punkt im ganzen Backlog** — ab hier sind Nutzerdaten wirklich vor dem
WebView-Datenverlust geschützt, den Android jederzeit auslösen darf.

`@capacitor/preferences` installiert (`npm install`, `npx cap sync android`, Plugin-Name
bestätigt: `Preferences`). Nur `js/store.js` fachlich geändert (die 22 Aufrufstellen aus A1
bleiben unangetastet): `PZ.store._backend` zeigt in einer nativen Capacitor-App
(`window.Capacitor?.isNativePlatform()`, identisches Erkennungsmuster wie `js/main.js
boot()`) auf Capacitor Preferences statt `localStorage`; im Browser (Desktop, Mobil, die
gesamte Testsuite) bleibt der Hintergrund unverändert `localStorage`.

**Einmalige Altdaten-Übernahme:** `hydrate()` prüft bei nativer App zuerst eine interne
Markierung (`pizzaStoreMigratedV1`, kein Teil der 11 offiziellen Schlüssel) im nativen
Speicher; fehlt sie, werden alle 11 Schlüssel aus `localStorage` in den nativen Speicher
übernommen und die Markierung gesetzt. Die Altdaten in `localStorage` werden bewusst
**nicht** gelöscht (Sicherheitsnetz). Läuft nachweislich nur einmal (Idempotenz getestet).

**Sonderfall Farbschema:** `set()` spiegelt den Theme-Wert in der nativen App zusätzlich
synchron nach `localStorage`, das Inline-Script im `<head>` von
`pizza-rechner-mobile.html` bleibt unangetastet.

**Testsuite:** 1442 → **1468** grün (26 neue Prüfungen in Sektion 45 "Nativer
Speicher-Hintergrund", 16 eigene + 10 vom `test-generator`-Agenten ergänzt, alle selbst per
Headless-Edge-CDP nachgeprüft, nicht nur übernommen — zwei eigene Bugs beim ersten
Testentwurf gefunden und behoben, s. Historie). Läuft weiterhin ausschließlich im Browser
gegen `localStorage` (die veraltete Zahl "1353" in der ursprünglichen Fassung dieses
Punktes war der Stand bei Erstellung dieser Backlog-Zeile, nicht mehr aktuell).

**Echte Verifikation auf dem Android-Emulator** (`Teigmeister_Test`, nicht nur
Code-Review): `build-app.py`, `npx cap sync android`, JDK 21, `gradlew assembleDebug`
(nach Lösen einer OneDrive-Reparse-Point-Eigenheit dieses Projektordners — Gradle verweigert
das Snapshotten von Dateien mit gesetztem `FILE_ATTRIBUTE_REPARSE_POINT`, das OneDrive
"Files on Demand" auch bei lokal gepinnten Dateien setzt; behoben durch einmaliges
Neuschreiben der betroffenen Dateien vor dem Build), `adb install -r`. Per direktem
WebView-CDP (Chrome-DevTools-Protokoll gegen den laufenden `webview_devtools_remote_*`-
Socket, nicht nur Screenshots) bestätigt: native Erkennung + Preferences-Plugin korrekt
aktiv; Migration mit echten Alt-Daten byte-identisch übernommen, Marker gesetzt,
`localStorage`-Altdaten nicht gelöscht; Daten überleben einen vollständigen App-Neustart;
**Kernszenario bewiesen** — `Storage.clearDataForOrigin` löscht gezielt nur den
WebView-`localStorage`-Anteil (Capacitor Preferences ist architektonisch davon getrennt,
präziser als ein pauschaler `pm clear`, der auch die Preferences selbst gelöscht hätte),
nach Neuladen ist das migrierte Rezept über `PZ.listRecipes()` weiterhin da, per Screenshot
in der echten UI bestätigt; kein Crash, keine Fehler in Logcat; Farbschema-Fallback bei
geleertem Spiegel verhält sich wie dokumentiert (Systemerkennung greift, kein Datenverlust).

**Geändert:** `js/store.js`, `tests/test.html`, `package.json`/`package-lock.json` (neue
Abhängigkeit `@capacitor/preferences`), `android/app/capacitor.build.gradle` +
`android/capacitor.settings.gradle` (automatisch von `npx cap sync`), Standalone-Build neu
gebaut. **Nicht angefasst:** die 22 Aufrufstellen aus A1, `PZ.store.get/set/remove/
getJSON/setJSON/hydrate/flush` selbst (nur `_backend` dahinter getauscht), das Inline-Theme-
Script im `<head>`, Desktop (`pizza-rechner.html`), jegliche Fachlogik/Berechnung/Oberfläche.
Reine Infrastruktur ohne App-Versionssprung (wie B1/B2), kein neuer `Versionen/`-Schnappschuss.

Empfohlener nächster Punkt: C2 (Drucken und PDF) oder C3 (Android-Feinschliff) — beide
1 Zyklus, für ein kleines Modell geeignet. C1 (Timer nativ) bleibt der anspruchsvollste
Punkt, nicht für ein kleines Modell.

---

# Block C: Native Funktionen

---

## C1. Gärzeit-Timer auf echte Systembenachrichtigungen — ERLEDIGT (C1a 2026-08-16, C1b 2026-08-17)

**C1a-Umfang:** `@capacitor/local-notifications` installiert. `js/timer.js`
plant beim Anlegen eines Timers in der nativen App zusätzlich zum bestehenden
`setInterval` eine echte, terminierte Systembenachrichtigung ein
(`LocalNotifications.schedule`, gleicher Zielzeitpunkt wie die Anzeige), inklusive
Berechtigungsabfrage (`checkPermissions`/`requestPermissions`) und sichtbarem
`.note.note--warn`-Hinweis bei verweigerter Berechtigung statt stillem Nichtstun. Der
Android-Uhr-Intent-Button entfällt in der nativen App (überflüssig geworden), der
Kalender-Export bleibt unverändert bestehen. Im Browser (Desktop und Mobil ohne
Capacitor) ist das Verhalten exakt unverändert.

Zwei zusätzliche, vom Hauptagenten in Vollmacht des Nutzers getroffene Entscheidungen,
beim Umsetzen von C1a mitbehoben bzw. mitgezogen:
1. **Nebenbefund-Fix `PZ.reloadFlags()`:** durch B3 (nativer Speicher, asynchrones
   `hydrate()`) fielen alle Feature-Flags (Timer, System-Wecker, Hinweistexte) bei
   jedem nativen Kaltstart stillschweigend auf ihren Plattform-Default zurück, weil der
   allererste `readFlags()`-Aufruf in `js/settings.js` synchron beim Skript-Laden lief,
   also vor `hydrate()`. `js/main.js` ruft jetzt `PZ.reloadFlags()` direkt nach
   `hydrate()` und vor `boot()` auf, das liest die Flags neu ein und mutiert das
   bestehende `PZ.FLAGS`-Objekt in place.
2. **Android-Default für den Gärzeit-Timer-Schalter (`timer`) von AUS auf AN
   umgestellt** (`js/settings.js`, `flagDefaultsForAndroid`): der ursprüngliche Grund
   für AUS (unzuverlässiger `setInterval`-Hintergrundlauf im Browser) entfällt in der
   nativen App durch C1a, ein Beibehalten von AUS hätte die neue Funktion für die
   meisten nativen Nutzer standardmäßig unsichtbar gemacht. `timerSystem`
   (Kalender-Erinnerung) bleibt unverändert AN.

**Tests:** `tests/test.html` 1442 → **1471** grün (per Headless-Edge-Dump selbst
nachgeprüft, nicht nur übernommen). `accessibility-expert`-Review ohne Blocker/Major,
ein optionaler Minor (Emoji im Warn-Hinweistext leicht redundant zu `role="status"`) —
bewusst so belassen, weil dasselbe Emoji-plus-Text-Muster bereits an anderer Stelle der
App etabliert ist (`js/guide.js`, Mehl-Warnung), Konsistenz wog hier höher als das rein
optionale Entfernen.

**C1b-Umfang (Neustart-Persistenz + Energiesparfunktionen):** Recherche im lokal
vorliegenden Kotlin-Quelltext von `@capacitor/local-notifications`
(`node_modules/@capacitor/local-notifications/android/...`) ergab, dass beide
Kernprobleme bereits vom Plugin selbst gelöst werden, kein eigener nativer Code nötig:
- **Geräteneustart:** das Plugin registriert bereits einen eigenen
  `LocalNotificationRestoreReceiver` auf `BOOT_COMPLETED`/`LOCKED_BOOT_COMPLETED`/
  `QUICKBOOT_POWERON` (inkl. `RECEIVE_BOOT_COMPLETED`-Permission), der beim Neustart
  headless (ohne WebView/JS-Kontext) alle noch nicht abgelaufenen Einträge aus seiner
  eigenen `NotificationStorage` liest und über den `AlarmManager` neu einplant. Landet
  automatisch per Android-Manifest-Merge in der App — per Gradle-Build der `app-debug.apk`
  und Prüfung des `merged_manifests`-Outputs bestätigt (Receiver + alle vier Permissions
  `RECEIVE_BOOT_COMPLETED`/`WAKE_LOCK`/`POST_NOTIFICATIONS`/`SCHEDULE_EXACT_ALARM`
  vorhanden), keine manuelle Ergänzung in `android/app/src/main/AndroidManifest.xml`
  nötig.
- **Energiesparen/Doze:** `allowWhileIdle: true` (bereits seit C1a gesetzt) lässt das
  Plugin `AlarmManager.setExactAndAllowWhileIdle`/`setAndAllowWhileIdle` verwenden, der
  von Android dokumentierte Weg für Doze-feste Alarme. Eine zusätzliche Ausnahme von der
  Akku-Optimierung (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) wird bewusst NICHT angefragt:
  nicht nötig für einzelne Exact-Alarms, restriktiv geprüfte Play-Store-Berechtigung mit
  Rechtfertigungspflicht.
- **Neu ergänzt in `js/timer.js`:** `isExactNotification` wird nur noch für lange Timer
  (≥ 180 min, `EXACT_ALARM_THRESHOLD_MIN`) angefragt, damit der System-Berechtigungsdialog
  "Alarme & Erinnerungen" nicht bei jedem kurzen Timer aufpoppt — passend zur Vorgabe
  "sinnvoll platziert, erst wenn wirklich ein langer Timer gestellt wird". Ein neuer,
  transienter `.note--tip`-Hinweistext (`timer.exactAlarmHint`) erklärt den möglichen
  Sprung in die Systemeinstellungen, bevor er passieren kann.

**Echte Verifikation auf dem Android-Emulator** (`Teigmeister_Test`, Android 14/API 34,
nicht nur Code-Review): `build-app.py`, `npx cap sync android`, JDK 21,
`gradlew assembleDebug`, `adb install -r`. 24h-Timer über das Preset „Napoli Lange
Kaltgare" gestellt (Schritt „Stückgare"), POST_NOTIFICATIONS-Dialog erlaubt, der neue
Hinweistext erschien korrekt, `isExactNotification:true` + `allowWhileIdle:true` korrekt
in `NOTIFICATION_STORE.xml` (App-eigene SharedPreferences des Plugins) persistiert.
`adb shell dumpsys deviceidle force-idle`: Alarm blieb unverändert exakt terminiert
(`device_idle`-Offset ~0, kein Verschlucken). **Zentraler Beweis:** `adb reboot` (echter
Neustart des Emulators) — `dumpsys alarm` zeigt danach denselben Alarm mit identischem
`origWhen`-Zeitstempel automatisch wieder scharf gestellt, vollständig headless, ohne
dass die App geöffnet wurde. Nach Öffnen der App zeigte die Timer-UI korrekt die aus
`endAt` neu berechnete Restzeit. Danach sauber aufgeräumt: Timer abgebrochen,
`NOTIFICATION_STORE.xml` leer, keine aktive Alarm-Registrierung mehr, Feature-Flag auf
den ursprünglich vorgefundenen Zustand zurückgesetzt.

**Tests:** `tests/test.html` unverändert 1471/1471 grün (`js/timer.js` wird dort wie
dokumentiert nicht geladen, reine JS-Logik-Erweiterung ohne neue testbare Oberfläche).

**Geändert (C1b):** `js/timer.js`, `js/i18n-dict.js`. Standalone-Build neu erzeugt.
**Nicht angefasst:** die C1a-Logik selbst (Terminierung, Berechtigungsabfrage,
Warnhinweis-Box), der Kalender-Export, jegliche Fachlogik/Berechnung, Desktop.

**Abnahme (vollständig erfüllt):**
- Timer über 2 Minuten stellen, App vollständig beenden, Benachrichtigung kommt (C1a)
- Timer über mehrere Stunden stellen, Gerät neu starten, Benachrichtigung kommt trotzdem
  (C1b, s. Emulator-Verifikation oben)
- Verweigerte Berechtigung führt zu einem verständlichen Hinweis, nicht zu einem stillen
  Nichtstun (C1a)
- Lange Laufzeiten werden nicht durch Energiesparfunktionen verschluckt (C1b,
  `force-idle` + `allowWhileIdle` bestätigt)

---

## C2. Drucken und PDF über das Teilen-Menü — ERLEDIGT (v4.41.0, 2026-08-16)

`@capacitor/filesystem` + `@capacitor/share` installiert (`npm install`, `npx cap sync
android` — der native `FileProvider` war bereits vorhanden, `res/xml/file_paths.xml`
deckt `Directory.Cache` per `<cache-path>` bereits ab, keine Manifest-Änderung nötig).

**`js/pdf.js`:** neuer, kleiner Baustein `buildShoppingListPdfBytes()` +
`collectShoppingListContent()` (liest das bereits von `js/print.js buildShoppingList()`
gerenderte `#shoppingList`-DOM, analog zu `collectGuideContent()`) — wiederverwendet
`layoutPages()`/`buildPdf()` unverändert, nur mit den bereits vorhandenen Blocktypen
`title`/`summary`/`body` gefüttert (Scope-Vorgabe eingehalten: Layout-Primitiven nicht
angefasst). Neuer nativer Teilen-Weg `shareBytesAsFile()`: schreibt die PDF-Bytes per
`Filesystem.writeFile()` ins Cache-Verzeichnis (Base64, kein Font-Embedding/keine
Fremdbibliothek nötig, s. bestehende Datei-Doku) und öffnet `Share.share()` mit der
Datei-URI. `downloadGuidePDF()` (Button „Als PDF speichern") verzweigt darüber in der
nativen App, im Browser exakt unverändert (`Blob` + `a.download`).

**`js/print.js`:** `printShoppingList()`/`printGuide()` verzweigen in der nativen App
(identisches `window.Capacitor?.isNativePlatform()`-Muster wie `js/main.js`/`js/store.js`/
`js/timer.js`) auf die neuen `PZ.shareShoppingListPdf()`/`PZ.shareGuidePdfForPrint()`
statt `window.print()` (dort wirkungslos). Im Browser (Desktop und Mobil ohne Capacitor)
bleibt `window.print()` exakt unverändert.

**Verworfener/korrigierter Fall (Android-Share-API):** deklariertes Nutzerverhalten
„Teilen-Menü ohne Ziel schließen" löst `@capacitor/share` mit `call.reject("Share
canceled")` auf (`SharePlugin.java`, `activityResult()` bei `RESULT_CANCELED`) — auf dem
Emulator live reproduziert. `shareBytesAsFile()` behandelt genau diese Meldung bewusst
als stillen Nicht-Fehler (kein „PDF konnte nicht geteilt werden" bei reinem Abbrechen),
nur ein echter Fehlschlag (Datei schreiben/Teilen-Aufruf selbst) wird angesagt.

**accessibility-expert-Review (C2):** ein Major behoben — der Hinweistext von
`#pdfGuideBtn` ("...lädt...direkt...herunter") war in der nativen App irreführend (der
Button teilt dort, lädt nicht direkt herunter). `js/pdf.js` tauscht dort jetzt das
`data-i18n`-Attribut selbst gegen den neuen Schlüssel `hint.savePdfNative`, live per
WebView-CDP verifiziert. Ein Minor (`type="button"` bei den beiden Druckbuttons ergänzt,
kein WCAG-Pflichtpunkt) mitgenommen.

**Tests:** `tests/test.html` 1486 → **1542** grün (test-generator-Agent lieferte 17 neue
Testfälle/~56 Prüfungen; beim eigenen Nachprüfen zeigte der erste Headless-Lauf 8 rote
Prüfungen — der Agent hatte ein nicht existierendes `state.preset`-Feld verwendet (es
gibt bewusst kein `state.preset`, s. `js/guide.js`) sowie `R.yeast`/`R.sugar`
(Grammgewicht) fälschlich gegen Bäckerprozente verglichen; alle 8 selbst korrigiert,
Ursache jeweils dokumentiert).

**Echte Verifikation auf dem Android-Emulator** (`Teigmeister_Test`, nicht nur
Code-Review): `build-app.py`, `npx cap sync android`, JDK 21, `gradlew assembleDebug`
(nach erneutem Lösen der bekannten OneDrive-Reparse-Point-Eigenheit, `rm -rf app/build
build`), `adb install -r`. Alle drei Buttons live angetippt: „Einkaufsliste drucken" und
„Anleitung drucken" öffnen das System-Teilen-Menü mit `pizza-einkaufsliste-<datum>.pdf`
bzw. `pizza-anleitung-<datum>.pdf` (inkl. „Drucken" als Ziel), `#pdfGuideBtn` ("Als PDF
speichern") teilt ebenfalls statt herunterzuladen. Dateien per `run-as`
aus dem App-Cache gezogen und inhaltlich per Grep bestätigt (alle erwarteten
Zutaten-/Anleitungstexte enthalten, gültige `%PDF-1.4`-Struktur). Direkt per
WebView-CDP (`webview_devtools_remote_*`-Socket, `suppress_origin=True` gegen den
403-Origin-Check) den `data-i18n`/textContent-Tausch von `#pdfGuideHint` sowie den
stillen Cancel-Pfad (`#printLiveMsg` bleibt leer nach Abbrechen) live bestätigt.

**Nicht angefasst** (wie vorgegeben): `layoutPages()`/`buildPdf()`/`escapePdfString()`/
`wrapText()` selbst, `buildShoppingList()`, das Browser-Verhalten (Desktop und Mobil im
Browser), jegliche Fachlogik/Berechnung.

---

## C3. Android-Feinschliff — ERLEDIGT (v4.42.0, 2026-08-16)

`@capacitor/app` installiert (`npm install`, `npx cap sync android`).

**Zurück-Taste:** `js/nav.js` bekam einen Listener auf `App.addListener('backButton', ...)`
(nur nativ, identisches `isNativePlatform()`-Muster wie die übrigen Module), mit einer
Prioritätenkette: (1) offenes Burgermenü-Overlay schließen — auf `pizza-rechner-mobile.html`
seit v3.67.0 praktisch nie relevant (Bottom-Tab-Nav statt Burgermenü, `navOverlay` dort
`null`), rein defensiv erhalten; (2) offenes Onboarding-Modal schließen (`js/onboarding.js`
exportiert dafür neu `PZ.closeOnboarding`, schließt inkl. Fokus-Rückgabe/Checkbox-Persistenz
statt rohem `hidden = true`); (3) die aufklappbare `#newRecipeCard`-Karte einklappen, falls
geöffnet — bewusst nur diese eine `<details>` (funktioniert wie ein Anlage-Dialog), nicht
alle Akkordeons der Seite; (4) von einer Nicht-Start-Ansicht zurück zur Startansicht
("rechner", per Live-DOM-Check `[data-view]:not([hidden])` ermittelt); (5) auf der
Startansicht `App.exitApp()`.

**Statusleiste:** bewusst **kein** `@capacitor/status-bar` installiert — stattdessen das in
`@capacitor/core` 8.5.0 bereits gebündelte, edge-to-edge-taugliche `SystemBars`-Plugin
genutzt (`js/theme.js`, bei jedem `applyTheme()`-Aufruf `SystemBars.setStyle({style:
theme==='dark'?'DARK':'LIGHT'})`, läuft sowohl beim Start als auch bei jedem Laufzeit-
Wechsel). `SystemBars` unterstützt laut eigener Doku bewusst kein `setBackgroundColor()`
mehr — auf dem Emulator (WebView 113, Android 14, unter der Schwelle für echtes
Edge-to-Edge-Passthrough) blieb die Leiste dadurch dauerhaft schwarz (Fensterhintergrund
der Splash-/Launch-Theme), wodurch die korrekt gesetzten dunklen Icons im Hellmodus
unsichtbar wurden — live per Screenshot gefunden. Behoben durch eine kleine ergänzende
native Brücke (`android/.../MainActivity.java`, `TeigmeisterNativeBars.setBarColor`,
klassische `Window.setStatusBarColor()`/`setNavigationBarColor()`-API, auf Android-Versionen
ohne erzwungenes Edge-to-Edge weiterhin wirksam, auf Android 15+ dokumentiert folgenlos
ignoriert), die denselben Farbwert nutzt wie das bestehende `theme-color`-Meta-Tag
(`THEME_COLOR`, `#c4472e` hell / `#151312` dunkel).

**Randbereiche:** keine Code-Änderung nötig — Capacitor 8s gebündeltes `SystemBars` handhabt
die `env(safe-area-inset-*)`-Werte bereits automatisch (Insets-Listener auf dem
WebView-Elternelement, inkl. Fallback-Pfad für ältere WebView-Stände). Mit aktivierter
Gestensteuerung (`adb shell settings put secure navigation_mode 2`) live geprüft: keine
Überdeckung der Bottom-Tab-Leiste durch die Geräte-Gestenleiste.

**Bildschirm anlassen (Punkt 4) bewusst NICHT umgesetzt:** kein offizielles
`@capacitor/keep-awake`-Paket (npm bestätigt 404), nur das inoffizielle
`@capacitor-community/keep-awake@8.0.1` — als einzige Nicht-`@capacitor/*`-Abhängigkeit
dieses Projekts eine bewusste Scope-Entscheidung für einen künftigen eigenen Punkt, nicht
für diesen Zyklus (war im Backlog explizit optional, keine eigene Abnahmekriterium-Zeile).

**Tests:** `tests/test.html` unverändert **1542/1542** grün (`js/nav.js`/`js/onboarding.js`
werden dort wie dokumentiert nicht geladen, `js/theme.js`-Ergänzung ist im Browser durch den
`isNativePlatform()`-Guard ein No-op). Kein `test-generator`-Lauf (keine Berechnungslogik
verändert).

**Echte Verifikation auf dem Android-Emulator** (`Teigmeister_Test`, Android 14/API 34,
nicht nur Code-Review): komplette Zurück-Tasten-Prioritätenkette per `adb shell input
keyevent 4` durchgeklickt und per Screenshot + `dumpsys activity activities` bestätigt
(Onboarding schließt zuerst, dann `#newRecipeCard` klappt zu, dann Rezepte-Unteransicht
zurück zu Rechner, erst danach verlässt die App wirklich — `topResumedActivity` wechselt
zum Launcher). Statusleiste live in Hell **und** Dunkel geprüft, inkl. Laufzeit-Wechsel ohne
Neustart. Gestensteuerung aktiviert, keine Überdeckung. Logcat ohne Crashes/Fatal-Exceptions.

**Geändert:** `js/nav.js`, `js/onboarding.js`, `js/theme.js`, `android/app/src/main/java/
com/teigmeister/app/MainActivity.java`, `package.json`/`package-lock.json` (neue Abhängigkeit
`@capacitor/app`), `android/app/capacitor.build.gradle` + `android/capacitor.settings.gradle`
(automatisch von `npx cap sync`), Standalone-Build neu gebaut. `?v=` auf `4.42.0` gezogen
(Mobil **und** Desktop, wie bei C2 — reines Cache-Busting, Desktop-Verhalten bleibt
unverändert, da `isNativePlatform()` dort immer `false` ist). **Nicht angefasst:**
`activateView()`/`gotoView()` selbst, jegliche Fachlogik/Berechnung, Desktop-Verhalten im
Browser.

---

## C4. App-Symbol und Startbildschirm — erledigt (v4.43.0, 2026-08-16)

**Aufwand:** 1 Zyklus.

**Umfang:** Aus `teigmeister-icon-optical-center.svg` die benötigten Android-Größen
erzeugen, inklusive adaptivem Symbol mit Vorder- und Hintergrundebene. Startbildschirm
in hell und dunkel.

**Abnahme:** Symbol sieht auf rundem, eckigem und quadratischem Zuschnitt gut aus,
Startbildschirm flackert nicht und passt zum Farbschema.

**Ergebnis:** adaptives Icon aus vier neuen Root-SVGs erzeugt (Original-SVG unangetastet,
Skalierung auf die 66dp-Sicherheitszone korrigiert), alle Mipmap-Größen + Splash-PNGs
(inkl. `-night`-Varianten) fertig eingebaut. Dabei einen echten, live gefundenen Bug
behoben — **bewusste Entscheidung des Hauptagenten** (Nutzer nicht erreichbar, Vollmacht
für diese Warteschlange erteilt), nicht nur Nebenbefund: `@capacitor/splash-screen` nutzt
ab Android 12 intern `androidx.core.splashscreen`, das nicht das alte `android:background`
liest — ohne die dedizierten `windowSplashScreenBackground`/
`windowSplashScreenAnimatedIcon`-Attribute (jetzt in `values/styles.xml` + neu
`values-night/styles.xml`) zeigte jeder zweite und weitere Kaltstart einen komplett leeren
Bildschirm ohne Marke. Über mehrere aufeinanderfolgende Kaltstarts in Hell und Dunkel auf
dem Emulator verifiziert, kein Blank-Screen mehr. Testsuite unverändert 1542/1542 grün.
Details: `pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „App-Symbol und Startbildschirm
(v4.43.0)". **Damit ist Block C (C1-C4) komplett abgeschlossen.**

---

# Block D: Veröffentlichung

---

## D1. Aufräumen und Versionierung — Code erledigt (v4.44.0, 2026-08-16), Live-Bau offen

**Umgesetzt:** `?v=`-Parameter aus allen Skript-/CSS-/Logo-Pfaden in `pizza-rechner.html`
(31 Treffer) und `pizza-rechner-mobile.html` (33 Treffer) entfernt — `index.html` hatte
keine Treffer. `build-app.py` robustifiziert (klare Fehlermeldungen bei fehlenden
Quelldateien, ausführlich dokumentiert). Versionsnummer zentralisiert: neues
`sync-version.py` liest `package.json["version"]` (jetzt `4.44.0`) als einzige Quelle
und schreibt sie automatisch in die `#appVersion`-Spans beider HTML-Dateien **und**
`android/app/build.gradle` (`versionName` + `versionCode` = `major·1 000 000 +
minor·1 000 + patch`, mit Monotonie-Schutz gegen einen sinkenden Wert).
`pizza-rechner-KONTEXT.md` hat einen neuen Abschnitt „Android-App bauen". Testsuite
unverändert 1542/1542 grün. Details:
`pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „D1: Aufräumen und Versionierung
(v4.44.0)".

**Offen — Abnahmekriterium nicht erfüllt:** in der umsetzenden Instanz standen keine
Android-Emulator-/Browser-Werkzeuge zur Verfügung. Das Abnahmekriterium „frischer Bau
aus sauberem Zustand ergibt eine lauffähige App" (`build-app.py` → `npx cap sync
android` → JDK 21 → `gradlew assembleDebug` → `adb install -r` auf `Teigmeister_Test`
→ App startet und ist bedienbar) wurde **nicht** nachgeholt, nur die beiden
Python-Skripte selbst per Bash getestet (Normallauf, Idempotenz, Fehlerfälle) und
`www/index.html` stichprobenartig per Grep geprüft. **Vor D2 nachholen, oder beim
nächsten ohnehin anstehenden App-Bau mit erledigen.**

---

## D2. Datenschutzerklärung und Impressum — Entwurf erledigt (2026-08-16), Adresse final bestätigt (2026-08-17)

**Adresse final bestätigt (2026-08-17):** Der Nutzer hat die im Impressum und in der
Datenschutzerklärung verwendete Postadresse ("Sören Stapelfeldt, c/o Autorenglück #56678,
Albert-Einstein-Straße 47, 02977 Hoyerswerda") im Chat explizit als "finale Adresse"
bestätigt. Der bisherige Platzhalter-Vorbehalt (unverifizierter Adress-Dienst
"Autorenglück") ist damit erledigt, keine weitere Prüfung vor D3 nötig.

**Umgesetzt:** zwei neue, von der App unabhängige Seiten `docs/datenschutz.html` +
`docs/impressum.html`, gemeinsames `docs/style.css` (Design an `css/styles.css`
angelehnt, Hell/Dunkel automatisch über `prefers-color-scheme`). Datenschutzerklärung
kurz und ehrlich (keine Datenerhebung, lokale Speicherung, lokale
Timer-Systembenachrichtigungen, ausdrücklich keine Statistik-/Absturzberichte-Dienste).
Impressum nach § 5 DDG, klar als private, nicht-gewerbliche App formuliert.
`accessibility-expert`-Review ohne Blocker/Major/Minor-Pflichtbefund (Kontraste weit
über AA). `tests/test.html` gegengeprüft: unverändert 1542/1542 grün. Details:
`pizza-rechner-KONTEXT-HISTORIE.md`, Abschnitt „Rechtstexte: Datenschutzerklärung und
Impressum (D2, 2026-08-16)".

**Offen — GitHub Pages ist noch NICHT aktiv:** `gh`-CLI ist auf der Bau-Maschine nicht
installiert. Ein Versuch, stattdessen das vom Git Credential Manager bereits
gespeicherte OAuth-Token für einen direkten `api.github.com`-Aufruf zu nutzen, wurde vom
Auto-Mode-Classifier der Umgebung als riskante Aktion blockiert — bewusst nicht
umgangen. **Manueller Schritt, der noch fehlt:** im GitHub-Repo (`Birnify/pizza-rechner`)
unter Settings → Pages → "Build and deployment" → Source: "Deploy from a branch" →
Branch `master`, Ordner `/docs` auswählen und speichern. Danach sollten die Seiten unter
`https://birnify.github.io/pizza-rechner/datenschutz.html` bzw. `.../impressum.html`
erreichbar sein (URL noch nicht live verifiziert).

**Nachtrag 2026-08-21 (wichtig):** Die oben beschriebene Umstellung auf „Deploy from a
branch → master → /docs" war ein Fehler. Das Repo hatte bereits einen eigenen
Pages-Workflow (`.github/workflows/deploy-pages.yml`, Quelle „GitHub Actions"), der das
komplette Repo ausliefert und darüber die App selbst hostet. Mit der /docs-Quelle lieferte
Pages nur noch die zwei Rechtstexte aus, die App war unter
`https://birnify.github.io/pizza-rechner/` und unter
`.../pizza-rechner-mobile-standalone.html` (iPhone-Startbildschirm) nur noch 404. Behoben:
der Workflow spiegelt `docs/` zusätzlich in die Ausgabe-Wurzel, damit beide URL-Sätze
gleichzeitig gelten. Die Pages-Quelle muss dauerhaft auf „GitHub Actions" stehen.

**Abnahme:** Beide Seiten sind über eine feste GitHub-Pages-Adresse erreichbar — laut
Kontextdatei (Stand 2026-08-16) vom Nutzer aktiviert und per `WebFetch` erreichbar
bestätigt. Inhaltlich korrekt und vollständig laut Vorgabe — erfüllt. Adresse final
bestätigt (s. oben). **Explizit weiterhin offen:** der Nutzer hat die Texte inhaltlich
gelesen und freigegeben (kann nicht vom Orchestrator selbst erledigt werden), sowie der
juristische Blick vor der endgültigen Fassung.

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
| A3 Sicherung exportieren — **erledigt (v4.40.0)** | 1 bis 2 | A1 | ja |
| B1 Capacitor einrichten — **erledigt (2026-08-16)** | 1 plus Installationen | Werkzeuge | nein, Einrichtung |
| B2 Startbildschirm — **erledigt (2026-08-16)** | 1 Zyklus | A2, B1 | ja |
| B3 Nativer Speicher — **erledigt (2026-08-16)** | 1 bis 2 | A2, B2 | mit Sorgfalt |
| C1 Timer nativ — **erledigt (C1a 2026-08-16, C1b 2026-08-17)** | 2 bis 3 | B1 | nein, anspruchsvollster Punkt |
| C2 Drucken und PDF — **erledigt (v4.41.0, 2026-08-16)** | 1 Zyklus | B1 | ja |
| C3 Android-Feinschliff — **erledigt (v4.42.0, 2026-08-16)** | 1 Zyklus | B1 | ja |
| C4 Symbol und Start — **erledigt (v4.43.0, 2026-08-16)** | 1 Zyklus | B1 | ja |
| D1 Aufräumen — Code erledigt (v4.44.0), Live-Bau offen | 1 Zyklus | B1 | ja |
| D2 Rechtstexte — Entwurf erledigt (2026-08-16), Freigabe + Pages-Aktivierung offen | 1 Zyklus | nichts | Entwurf ja, Freigabe Nutzer |
| D3 Play Console | 1 Zyklus | D2 | nein, Formulare |
| D4 Test und Freigabe | 14 Tage Wartezeit | alles | nein |

**A1 erledigt (v4.38.4, 2026-08-15). A2 erledigt (v4.39.0, 2026-08-15). A3 erledigt
(v4.40.0, 2026-08-15). B1 erledigt (2026-08-16). B2 erledigt (2026-08-16). B3 erledigt
(2026-08-16) — der wichtigste Punkt im ganzen Backlog, Nutzerdaten sind jetzt vor dem
WebView-Datenverlust geschützt. C1 (Timer nativ, C1a+C1b) erledigt (2026-08-17) — echte
Systembenachrichtigungen inkl. Neustart-Persistenz und Doze-Festigkeit, auf dem
Android-Emulator verifiziert. C2 (Drucken und PDF) erledigt (v4.41.0, 2026-08-16) —
beide Druckvarianten sowie der bestehende PDF-Button teilen in der nativen App jetzt
über das System-Teilen-Menü statt der wirkungslosen `window.print()`/`a.download`-Wege,
auf dem Android-Emulator verifiziert. C3 (Android-Feinschliff) erledigt (v4.42.0,
2026-08-16) — Zurück-Taste navigiert jetzt sinnvoll statt die App sofort zu verlassen,
Statusleiste passt sich Hell/Dunkel auch zur Laufzeit an (inkl. eines dabei gefundenen und
behobenen echten Bugs, dauerhaft schwarze Leiste durch fehlende Hintergrundfarben-
Unterstützung von Capacitors gebündeltem SystemBars-Plugin), Randbereiche bei aktivierter
Gestensteuerung bereits korrekt ohne Code-Änderung. C4 (Symbol und Startbildschirm)
erledigt (v4.43.0, 2026-08-16) — adaptives Icon + Startbildschirm hell/dunkel fertig,
inklusive eines dabei gefundenen und behobenen echten Bugs (leerer Bildschirm bei
wiederholten Kaltstarts ab Android 12 mangels der dedizierten
`windowSplashScreenBackground`/`windowSplashScreenAnimatedIcon`-Theme-Attribute). Damit
ist Block C (C1-C4) komplett abgeschlossen.** D1 (Aufräumen und Versionierung)
code-seitig erledigt (v4.44.0, 2026-08-16) — `?v=` entfernt, Versionsnummer über
`package.json` + `sync-version.py` zentralisiert, `build-app.py` robustifiziert; die
Live-Verifikation (frischer Gradle-Bau + Emulator-Installation) steht noch aus, da der
umsetzenden Instanz keine Android-/Browser-Werkzeuge zur Verfügung standen. D2
(Datenschutzerklärung und Impressum) im Entwurf erledigt (2026-08-16) —
`docs/datenschutz.html` + `docs/impressum.html` fertig, `accessibility-expert`-geprüft
ohne Befund; GitHub Pages ist inzwischen aktiv (vom Nutzer manuell aktiviert, per
`WebFetch` erreichbar bestätigt) und die Adresse ist seit 2026-08-17 vom Nutzer final
bestätigt. Empfohlener nächster Einstieg: D1-Live-Bau nachholen (frischer Gradle-Bau +
Emulator-Installation) und die Rechtstexte inhaltlich vom Nutzer freigeben lassen, bevor
es zu D3 (Play Console) geht.
