# Pizzateig-Rechner (Teigmeister) - Projektanweisungen

## Kontext-Dateien immer zuerst lesen

**Zu Beginn jeder Session in diesem Projekt** (bevor du irgendeine inhaltliche Frage
beantwortest oder Code änderst): lies **`pizza-rechner-KONTEXT.md`** vollständig. Sie ist
die Einzelquelle für aktuellen Stand, Domänenlogik, Dateistruktur, Arbeitsweise und offenes
Backlog. Ohne sie kennst du weder die Fachlogik (Bäckerprozente, Vorteig-Verfahren,
Mehl-Warnung etc.) noch bereits getroffene Design-Entscheidungen.

**`pizza-rechner-KONTEXT-HISTORIE.md` nicht standardmäßig laden.** Sie enthält die
ausführliche Release-für-Release-Erzählung aller bisherigen Versionen (deutlich größer als
die Hauptdatei) und wird nur gebraucht, wenn eine konkrete Frage zu einem bestimmten,
älteren Release auftaucht ("warum wurde X in v3.20.0 so gelöst?"). Dann gezielt nachladen,
nicht vorsorglich.

Diese Regel gilt für **jede Art von Arbeit** in diesem Projekt, egal ob direkt inline im
Chat oder über einen gespawnten Subagenten (z. B. `feature-cycle-orchestrator`).

## Kontext-Datei schlank halten (Pflicht bei jedem Abschluss)

Siehe den Abschnitt "Entwicklungsweise / Mitarbeit" in `pizza-rechner-KONTEXT.md` für die
genaue Regel. Kurzfassung: Beim Abschluss einer Änderung wandert der **bisherige**
"= aktueller Stand"-Abschnitt unverkürzt an den Anfang von `pizza-rechner-KONTEXT-HISTORIE.md`,
und in der Hauptdatei entsteht dafür nur ein **neuer, kurzer** (5-10 Zeilen) Abschnitt mit
Verweis auf die Details in der HISTORIE-Datei. Niemals einfach unbegrenzt weitere volle
Abschnitte an die Hauptdatei anhängen, das war der Grund, warum sie auf 325 KB gewachsen war.

## Versionierung (Pflicht bei jeder abgeschlossenen Änderung)

Einen vollständigen, lauffähigen Schnappschuss anlegen: `Versionen/vX.Y.Z - [kurze
Beschreibung]/` mit dem kompletten App-Stand (`pizza-rechner.html`, `index.html`, `css/`,
`js/`). SemVer: Patch = Fix, Minor = Feature, Major = Umbau. Konventionen in
`Versionen/LIESMICH.txt`. `Versionen/` ist bewusst gitignored (eigene lokale
Änderungshistorie, kein Ersatz für Git-Commits).

## Arbeitsablauf: Orchestrator statt direkter Implementierung im Hauptgespräch

Der Nutzer möchte Features/Bugfixes in der Regel nicht direkt im Hauptgespräch umgesetzt
bekommen. Etablierter Ablauf:

1. Grobe Idee: `/define-feature` ausführen (Rückfragen stellen, wo eine echte Lücke bei
   Motivation/Scope/Abgrenzung besteht) bis die fünf Felder (Name/Idee/Motivation/Scope/
   Abgrenzung) sauber feststehen.
2. Auftrag an einen Hintergrund-Agenten übergeben: `subagent_type feature-cycle-orchestrator`
   per Agent-Tool starten. **Seit 2026-07-23 bewusst NUR EIN Zyklus/Punkt pro Instanz:**
   eine einzelne Instanz, die über mehrere Zyklen hinweg per `SendMessage` immer weiterlief
   (in einem gemessenen Fall 670 Turns über ~13,5 h für 5 Zyklen), erzeugte durch die
   akkumulierende Konversation ~196 Mio. Cache-Read-Tokens bei nur ~304K tatsächlich neu
   generiertem Output — jeder Turn liest die komplette bisherige Konversation erneut,
   das wird mit wachsender Turn-Zahl immer teurer, ganz ohne dass irgendwas "falsch" läuft.
   Deshalb gilt jetzt: `SendMessage` an eine laufende Instanz nur **innerhalb** desselben,
   noch nicht abgeschlossenen Punktes (Sub-Agenten-Ergebnis liefern, Rückfrage beantworten,
   nach Sitzungslimit fortsetzen). **Sobald eine Instanz einen Punkt abschließt (Phase 5,
   committet + gepusht) und ihre Runde beendet, für den NÄCHSTEN Punkt der Warteschlange
   einen frischen `Agent`-Aufruf starten** (nicht dieselbe Instanz per `SendMessage`
   weiterlaufen lassen), mit der Definition des nächsten Punktes plus kurzem Kontext zum
   aktuellen Commit-/Versionsstand. Die Orchestrator-Definition selbst (s.
   `.claude/agents/feature-cycle-orchestrator.md`) erwartet dieses Verhalten und beendet
   ihre eigene Runde entsprechend nach jedem einzelnen Punkt, statt automatisch
   weiterzumachen.
   **Wichtig für eine neue Sitzung (z. B. anderer Account/andere Maschine):** eine laufende
   Agenten-Instanz ist niemals sitzungsübergreifend erreichbar, ihre ID existiert nur
   innerhalb der Sitzung, die sie gestartet hat. Jede neue Sitzung muss einen frischen
   Orchestrator starten (`Agent`-Tool, `subagent_type feature-cycle-orchestrator`, mit
   einem Prompt, der die aktuelle Warteschlange und relevante Vorentscheidungen enthält).
   Es gibt keine alte Instanz zum Wiederverwenden, das ist kein Fehler.
3. Mehrere Ideen queuen sequenziell. Reihenfolge explizit angeben ("nach den bisherigen
   N Punkten anhängen"), statt sie vom Agenten selbst wählen zu lassen. Jeder Punkt der
   Warteschlange bekommt seine eigene, frische Orchestrator-Instanz (s. Punkt 2) — die
   Warteschlange selbst führt der Hauptagent (nicht der Orchestrator), der nach jeder
   Abschluss-Zusammenfassung den nächsten Punkt als neuen `Agent`-Aufruf lostritt.
4. Kleine, klar umrissene Bugs oder Textfixes brauchen **kein** `/define-feature`, direkt
   mit klarer Diagnose an den Orchestrator übergeben (siehe Bug-Untersuchung unten).
5. Auto-Push nach jedem Commit ist für den Orchestrator in diesem Projekt standardmäßig
   erlaubt, keine Rückfrage pro Push nötig. Das gilt nur für die automatisierten Commits
   des Orchestrators in diesem Projekt, keine pauschale Push-Erlaubnis darüber hinaus.
6. Falls eine `SendMessage` an eine vermeintlich laufende Instanz mit "kein Transkript
   gefunden" fehlschlägt: Repo-Stand prüfen (`git status`/`git log`), meist ist nichts
   verloren, dann einfach einen frischen Orchestrator mit vollem Kontext zur aktuellen
   Warteschlange starten (wie in Punkt 2 beschrieben).
7. Wenn der Orchestrator meldet "Warteschlange leer, neuer Zyklus?": auf die nächste
   Nutzeranweisung warten, nicht selbst neue Arbeit erfinden.
8. **Spezialisten-Anforderungen des Orchestrators bedienen (Sub-Agenten-Relay):** Der
   Orchestrator läuft als Hintergrund-Subagent und kann selbst **keine** weiteren
   Sub-Agenten spawnen (verschachteltes Spawnen ist in dieser Umgebung gesperrt, ein
   Subagent hat kein nutzbares `Agent`-Tool). Damit die echten Spezialisten
   (`test-generator`, `accessibility-expert`, `mobile-optimizer`, `performance-profiler`)
   trotzdem laufen und nicht nur simuliert werden, fordert er sie über den Hauptagenten an:
   Schickt er dir eine Nachricht, die mit `SUBAGENT-ANFRAGE:` beginnt, dann spawne den
   genannten Spezialisten selbst per `Agent`-Tool (`run_in_background: false`, mit dem im
   Auftrag genannten Fokus und den Dateipfaden), warte sein Ergebnis ab und schicke es per
   `SendMessage` an den Orchestrator zurück, wobei dein Nachrichtentext mit
   `SUBAGENT-ERGEBNIS:` beginnt und die vollständige Befundliste enthält. Das ist eine
   interne Steuernachricht, **keine** Nutzer-Rückfrage: bediene sie autonom, ohne den
   Nutzer zu fragen (auch während er weg ist), und leite den Befund dem Nutzer anschließend
   nur informativ weiter. Ist ein Spezialist nicht verfügbar oder schlägt fehl, melde das
   ehrlich per `SUBAGENT-ERGEBNIS:` zurück, statt ihn zu erfinden. Da der Hauptagent (nicht
   verschachtelt) sehr wohl spawnen kann, laufen so die echten Spezialisten, ohne dass der
   asynchrone Hintergrundbetrieb des Orchestrators verloren geht.

## Wann inline statt über den Orchestrator

Der Orchestrator startet kalt und liest `pizza-rechner-KONTEXT.md` komplett neu
(Kaltstart-Overhead). Das lohnt sich nur für größere Aufgaben.

**Bei jedem neuen Umsetzungswunsch zuerst kurz rückfragen** (Nutzer-Vorgabe), ob es nur
eine einzelne, abgeschlossene Sache ist (dann inline) oder mehrere Schritte/Zyklen braucht
(dann Orchestrator), statt die Route still selbst zu wählen. Empfehlung mit kurzer
Begründung dazugeben, aber die Wahl bestätigt der Nutzer. Nicht extra fragen, wenn der
Nutzer die Arbeitsweise schon vorgegeben hat oder es reine Analyse/Verifizierung ohne
Code-Umsetzung ist.

- **Inline (im Hauptgespräch) erledigen:** winzige, klar umrissene Fixes (eine Zeile Code,
  ein Doku-Nachtrag, ein Textfehler), kurze Tests/Analysen, oder wenn der Kontext ohnehin
  schon geladen ist. Faustregel: Wäre das eine Minute Handarbeit? Dann inline.
- **An den Orchestrator geben:** Mehrschritt-Features/Zyklen (Design + Implementierung +
  Test + Härtung + Commit), Hintergrundarbeit während der Nutzer weg ist, komplexe
  Audit-Aufgaben, bei denen Sub-Agenten sinnvoll sind.
- **Modell-Tiering der Sub-Agenten:** `accessibility-expert`, `test-generator`,
  `mobile-optimizer`, `performance-profiler` laufen auf Haiku (kostengünstig).
  Feature-Builder und der Orchestrator selbst laufen auf Sonnet. Ein Modell wie Fable nur
  für tiefe Architektur-Reviews, nicht standardmäßig.

## Bug-Untersuchung vor Weitergabe an den Orchestrator

Bei gemeldeten Bugs nicht nur aus dem Code heraus theoretisieren und nicht ungeprüft
weiterreichen: erst live reproduzieren, dann Diagnose plus Repro-Schritte an den
Orchestrator übergeben.

- `.claude/launch.json` enthält eine "pizza"-Konfiguration (`python -m http.server 8137`).
  Mit dem Preview-Tool starten (`preview_start {name: "pizza"}`) und per
  `javascript_tool`/`computer` bedienen. Eine Datei direkt über `file://` öffnen zeigt nur
  eine statische Momentaufnahme (kein JS, kein `localStorage`) und eignet sich nicht zur
  Fehlernachstellung.
- Falls die erste Reproduktion fehlschlägt: nicht bei "konnte nicht reproduzieren" stehen
  bleiben, nach der exakten Abfolge der UI-Schritte fragen. Der genaue Einstiegspunkt
  (z. B. welcher von mehreren Wegen, ein Rezept anzulegen) ist oft entscheidend.
- Erst danach Ursache und Repro-Schritte an den Orchestrator übergeben, damit dieser die
  Diagnose nicht selbst neu herleiten muss.

## Teigwerte und Rahmenparameter nie ohne verlässliche Quellen ändern

**Nutzer-Vorgabe (2026-07-29), gilt dauerhaft für dieses Projekt:** Änderungen an der
Teigzusammensetzung (Mengen, Bäckerprozente wie Hydration/Salz/Öl/Zucker/Hefe,
Teiglingsgewicht) oder an Rahmenparametern (Temperaturen, Gärzeiten, Reibungsfaktoren,
Backzeit-Formeln etc.) werden **nie** ohne Quellen vorgenommen, die belegen, dass der neue
Wert stimmt. Das gilt unabhängig davon, ob direkt inline gearbeitet wird oder über den
Orchestrator.

- **"Quelle" heißt nicht irgendein Treffer.** Kein Vertrauen in erkennbar KI-generierte
  Inhalte, anonyme SEO-Blogtexte ohne erkennbare fachliche Autorschaft, oder einzelne
  Hobby-Rezepte ohne Bestätigung. Belastbar sind: reale, veröffentlichte und getestete
  Rezepte (auch von Herstellern/Marken), etablierte Fachseiten mit erkennbarer
  Back-Expertise, offizielle Regelwerke (z. B. AVPN-Disciplinare), sowie Fachliteratur.
  Bei Rechner-/Blog-Seiten unklarer Autorenschaft: skeptisch bleiben, nach Möglichkeit
  gegen eine zweite, unabhängige Quelle prüfen.
- **Mehrere Quellen einholen, wo möglich, und deren Übereinstimmung explizit machen.**
  Wenn sich Quellen widersprechen, das offen benennen statt einen Mittelwert zu bilden,
  der wie Evidenz aussieht, aber keine ist. Wenn zwei Quellen exakt identische Zahlen
  nennen, prüfen, ob sie tatsächlich unabhängig sind, oder gemeinsamen Ursprungs sein
  könnten (dann als solches kennzeichnen, nicht als "mehrfach bestätigt" verkaufen).
- **Mechanismus und konkreten Parameter sauber trennen**, falls nur einer von beiden
  wirklich belegt ist (Beispiel v4.27.0: dass Temperatur die Gärzeit exponentiell
  beeinflusst, war durch zwei unabhängige Fachquellen belegt; die konkrete Verdopplungs-
  distanz von 10 °C war eine bewusst konservative Wahl innerhalb der von den Quellen
  aufgespannten Bandbreite, keine zitierte Einzelzahl — beides wurde in Commit-Nachricht
  und Kontextdatei unterschiedlich benannt).
- **Wenn die Quellenlage nicht ausreicht, um sicher zu sein: nichts ändern.** Ein neuer
  Ratewert mit Quellenanstrich ist nicht besser als der alte unbelegte Wert. Beispiel: die
  vier generischen Hefemenge-Schwellen bei Direktführung (`js/schedule.js`) blieben bei der
  gesamten Preset-Quellenprüfungs-Serie (v4.24.0 bis v4.28.0) bewusst unangetastet, weil
  sich die dafür gefundenen Quellen um bis zu Faktor 25 widersprachen.
- **In Commit-Nachricht und Kontextdatei ehrlich formulieren, was die Quellenlage
  tatsächlich hergibt** — "aus Quellen abgeleitet" nur, wenn das wirklich zutrifft, sonst
  präziser ("Mechanismus quellenbelegt, Parameter konservativ gewählt", "durch zwei
  Quellen mit Verdacht auf gemeinsamen Ursprung gestützt" o. ä.). Nie "verifiziert" oder
  "getestet" in Bezug auf tatsächliches Gärverhalten schreiben — keiner der aus dieser
  Regel entstandenen Werte wurde je gebacken, die Testsuite prüft nur Rechenwege.

## Datenschutzerklärung/Impressum bei Änderungen mitdenken (docs/)

**Nutzer-Vorgabe (2026-08-16), gilt dauerhaft für dieses Projekt:** Seit D2 des
Play-Store-Vorhabens gibt es zwei öffentlich gehostete, von der App unabhängige Seiten
unter `docs/` (`datenschutz.html`, `impressum.html`, per GitHub Pages live unter
`https://birnify.github.io/pizza-rechner/`). Ihr zentrales Versprechen: **die App
erhebt keine Daten, überträgt nichts, alles bleibt auf dem Gerät, keine Analyse-/
Absturzberichte-Dienste** (s. `PLAYSTORE-BACKLOG.md`, Punkt D2). Damit dieses
Versprechen nie stillschweigend falsch wird, muss **bei jeder Änderung** (egal ob
inline oder über den Orchestrator) kurz mitgedacht werden, ob `docs/datenschutz.html`
und/oder `docs/impressum.html` angepasst werden müssen.

- **Auslöser, bei denen ein Abgleich nötig ist:** jede neue Netzwerk-/API-Anbindung,
  jedes neue Capacitor-Plugin oder jede neue Bibliothek, die Daten sammeln/übertragen
  könnte (Analytics, Crash-Reporting, Werbe-SDKs, Cloud-Sync), jede neue dauerhafte
  Kennung (Geräte-ID, Nutzer-ID), sowie jede Änderung an Name/Adresse/Kontakt der
  verantwortlichen Person.
- **Kein Auslöser:** reine UI-/Layout-/Fachlogik-Änderungen ohne neue
  Datenerhebung/-übertragung (die meisten C1-C4-artigen Punkte betreffen das nicht).
- Bei einem Auftrag an den Orchestrator, der einen der obigen Auslöser berührt: explizit
  im Auftrag erwähnen, dass `docs/datenschutz.html`/`docs/impressum.html` mitgeprüft
  und bei Bedarf aktualisiert werden müssen — nicht stillschweigend voraussetzen, dass
  das automatisch passiert.
- **Adress-Vorbehalt (Stand 2026-08-16):** Die Impressum-Adresse ist aktuell noch ein
  unverifizierter Platzhalter (s. `PLAYSTORE-BACKLOG.md`, Punkt D2, dortiger
  ⚠️-Vermerk) — vor jeder echten Store-Einreichung (D3/D4) muss das mit dem Nutzer final
  geklärt werden, das ist keine Aufgabe für einen Orchestrator.

## Kommunikationsstil

- Keinen Gedankenstrich (Em-Dash) in Texten verwenden, die der Nutzer sieht: weder im Chat
  noch in Texten für die App selbst (Glossar, i18n-Strings, Feature-Beschreibungen etc.).
  Stattdessen normale Satzzeichen: Komma, Punkt, Doppelpunkt, Klammern.
- Skills/Agents/Automationen sollen bei echten Lücken gezielt nachfragen (z. B. über
  `AskUserQuestion`) statt still zu raten oder automatisch im Hintergrund zu laufen.
  Vorher prüfen, ob die Antwort schon aus dem bisherigen Gespräch hervorgeht.

## `.claude/` ist Teil des Repos

Anders als in vielen Projekten ist `.claude/` hier bewusst **nicht** gitignored:
`.claude/agents/` (Sub-Agenten-Definitionen wie `feature-cycle-orchestrator`) und
`.claude/launch.json` (Preview-Server-Konfiguration) sind Teil des Git-Repos, damit ein
Klon unter einem anderen Account oder einer anderen Maschine sofort denselben
Arbeitsablauf zur Verfügung hat, ohne dass etwas manuell nachgebaut werden muss.
