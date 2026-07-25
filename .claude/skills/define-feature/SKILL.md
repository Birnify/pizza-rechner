---
name: define-feature
description: Turns a rough feature idea into a short, structured feature brief (name, idea, motivation, scope, exclusions) — not a full execution prompt. Meant as input for a feature orchestrator's brainstorming phase (e.g. feature-cycle-orchestrator). Use when the user has a rough feature idea they want captured cleanly before deciding whether/how to build it.
user-invocable: true
allowed-tools:
  - AskUserQuestion
  - Read
---

# /define-feature — Feature-Definition

Nimmt eine grobe Feature-Idee entgegen und gibt eine kurze, strukturierte
Feature-Definition zurück — bewusst KEIN ausführlicher Umsetzungs-Prompt.
Gedacht als Eingabe für die Brainstorming-Phase eines Feature-Orchestrators
(z. B. feature-cycle-orchestrator), der selbst entscheidet, ob und wie das
Feature umgesetzt wird.

## Abgrenzung zu /optimize-prompt

- `/optimize-prompt` macht aus einer Aufgabe einen ausführbaren,
  detaillierten Prompt (Kontext/Aufgabe/Anforderungen/Format).
- `/define-feature` bleibt bewusst auf Ideen-Ebene: kurz, ungefähr,
  entscheidungsreif für ein Brainstorming — keine Implementierungsdetails,
  keine Akzeptanzkriterien, kein fertiger Auftrag.

## Eingabe

Grobe Feature-Idee (Argumente des Aufrufs):

$ARGUMENTS

- Sind die Argumente leer, nimm die zuletzt im Chat besprochene Idee.
- Verweisen die Argumente auf eine Datei, lies sie mit Read.
- Gibt es weder Argumente noch eine erkennbare Idee im Chat: kurz fragen,
  um welches Feature es geht — nichts erfinden.

## Ablauf

1. **Kernidee erfassen** — Worum geht es im Kern? Nicht ausschmücken,
   nicht mit Umsetzungsdetails anreichern.

2. **Lücken erkennen und gezielt nachfragen** — Vorher im bisherigen
   Chat-Verlauf nachsehen, ob Motivation, Scope oder Abgrenzung schon
   erwähnt wurden — dann zählt das als vorhanden und wird nicht erneut
   erfragt. Bei echten, dort nicht auflösbaren Lücken über AskUserQuestion
   nachfragen — so viele Fragen/Runden wie nötig, um alle fünf Felder aus
   Schritt 3 sauber zu füllen. Kein künstliches Fragen-Limit: wenn
   Antworten neue Lücken aufdecken, ruhig eine weitere Runde stellen, z. B.:
   - Motivation unklar (welches Problem löst es, wer profitiert?)
   - Scope komplett offen (was gehört minimal dazu?)
   - Keine erkennbare Abgrenzung (Risiko, dass "ein Feature" eigentlich
     mehrere verschiedene Features sind)

   Trotzdem gezielt bleiben: nur Fragen stellen, die eines der fünf Felder
   tatsächlich klären — keine Fragen um der Vollständigkeit willen.

3. **Auf fünf Felder verdichten** — nicht mehr, nicht weniger:
   - **Name** — kurzer, eindeutiger Titel
   - **Idee** — ein Satz, was es tut
   - **Motivation** — warum, welches Problem/Bedürfnis es löst
   - **Scope** — grob, was dazugehört
   - **Abgrenzung** — was bewusst NICHT dazugehört

4. **Auf Ideen-Höhe bleiben** — keine Implementierungsschritte, keine
   Akzeptanzkriterien, keine Prompt-Struktur wie bei /optimize-prompt. Der
   Feature-Orchestrator entscheidet selbst, wie er das Feature weiter
   ausarbeitet.

5. **Scope bewahren** — nichts hinzuerfinden, was der Nutzer nicht gesagt
   hat. Bei Unsicherheit lieber knapp lassen als spekulativ ausschmücken.

## Ausgabeformat

Falls Schritt 2 eine echte Lücke ergeben hat: erst die Rückfrage(n)
stellen und die Antwort abwarten, bevor ausgegeben wird.

Danach: die Feature-Definition in einem eigenen Codeblock ausgeben, direkt
kopierbar für die Brainstorming-Phase des Orchestrators. Kein Vorspann,
keine Meta-Diskussion, keine Ausführung der Aufgabe selbst.

## Beispiel

**Eingabe:** `sowas wie ein reminder falls der teig zu lange steht`

**Ausgabe:**

```
Name: Übergar-Warnung

Idee: Hinweis, wenn der Teig länger als geplant in einer Gärphase steht.

Motivation: Nutzer verpassen den optimalen Zeitpunkt und der Teig übergärt, ohne dass sie es merken.

Scope: Warnung nach Ablauf der geplanten Gärzeit plus Kulanzpuffer.

Abgrenzung: Kein automatisches Anpassen des Rezepts, keine Benachrichtigung außerhalb der App.
```
