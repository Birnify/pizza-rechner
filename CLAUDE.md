# Pizzateig-Rechner (Teigmeister) — Projektanweisungen

## Kontext-Dateien IMMER zuerst lesen

**Zu Beginn jeder Session in diesem Projekt** (bevor du irgendeine inhaltliche Frage
beantwortest oder Code änderst): lies **`pizza-rechner-KONTEXT.md`** vollständig. Sie ist
die Einzelquelle für aktuellen Stand, Domänenlogik, Dateistruktur, Arbeitsweise und offenes
Backlog — ohne sie kennst du weder die Fachlogik (Bäckerprozente, Vorteig-Verfahren,
Mehl-Warnung etc.) noch bereits getroffene Design-Entscheidungen.

**`pizza-rechner-KONTEXT-HISTORIE.md` NICHT standardmäßig laden.** Sie enthält die
ausführliche Release-für-Release-Erzählung aller bisherigen Versionen (deutlich größer als
die Hauptdatei) und wird nur gebraucht, wenn eine konkrete Frage zu einem bestimmten,
älteren Release auftaucht ("warum wurde X in v3.20.0 so gelöst?"). Dann gezielt nachladen,
nicht vorsorglich.

Diese Regel gilt für **jede Art von Arbeit** in diesem Projekt — egal ob direkt inline im
Chat, oder über einen gespawnten Subagenten (z. B. `feature-cycle-orchestrator`).

## Kontext-Datei schlank halten (Pflicht bei jedem Abschluss)

Siehe den Abschnitt „Entwicklungsweise / Mitarbeit" in `pizza-rechner-KONTEXT.md` für die
genaue Regel. Kurzfassung: Beim Abschluss einer Änderung wandert der **bisherige**
„= aktueller Stand"-Abschnitt unverkürzt an den Anfang von `pizza-rechner-KONTEXT-HISTORIE.md`,
und in der Hauptdatei entsteht dafür nur ein **neuer, kurzer** (5–10 Zeilen) Abschnitt mit
Verweis auf die Details in der HISTORIE-Datei. Niemals einfach unbegrenzt weitere volle
Abschnitte an die Hauptdatei anhängen — das war der Grund, warum sie auf 325 KB gewachsen war.

## Weitere Arbeitsweise

Alles Weitere (Kommunikationsstil, Orchestrator-Workflow, Bug-Untersuchung, Push-Berechtigung)
ist in den persönlichen Claude-Erinnerungen des Nutzers hinterlegt und muss hier nicht
dupliziert werden.
