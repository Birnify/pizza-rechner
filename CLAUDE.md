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
6. Bei Sitzungslimit-/API-Fehlern des Hintergrund-Agenten: nicht sofort neu versuchen.
   Die im Fehlertext genannte Reset-Zeit gegen die aktuelle Uhrzeit prüfen (z. B. `date`
   per Bash) und erst danach fortsetzen.
7. Falls eine `SendMessage` an eine vermeintlich laufende Instanz mit "kein Transkript
   gefunden" fehlschlägt: Repo-Stand prüfen (`git status`/`git log`), meist ist nichts
   verloren, dann einfach einen frischen Orchestrator mit vollem Kontext zur aktuellen
   Warteschlange starten (wie in Punkt 2 beschrieben).
8. Wenn der Orchestrator meldet "Warteschlange leer, neuer Zyklus?": auf die nächste
   Nutzeranweisung warten, nicht selbst neue Arbeit erfinden.
9. **Spezialisten-Anforderungen des Orchestrators bedienen (Sub-Agenten-Relay):** Der
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
