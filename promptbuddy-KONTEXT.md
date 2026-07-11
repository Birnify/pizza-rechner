# Kontext: Promptbuddy — Agent-Prompts für den Pizzateig-Rechner
Stand: 2026-07-11 · Für Fortsetzung in neuer Session

> Diese Datei beschreibt eine laufende Nebenaufgabe zum Pizzateig-Rechner-Projekt:
> das Schreiben von eigenständigen Prompts für spezialisierte "Agents", die in
> künftigen Sessions gezielt Teilaufgaben übernehmen (Mobile-Optimierung,
> Test-Erweiterung, Accessibility-Audit, ggf. weitere). Einfach diese Datei zu
> Beginn einer neuen Session mitgeben, um nahtlos weiterzuarbeiten.

## Worum geht es?

Für das Projekt **Pizzateig-Rechner** (siehe `pizza-rechner-KONTEXT.md` im selben
Ordner — **immer zuerst lesen**, das ist die App-Kontext-Datei) werden themenspezifische
Prompts entworfen, die man in einer frischen Claude-Code-Session einfügt, um Claude
in eine bestimmte "Expertenrolle" mit klarem Auftrag zu versetzen. Idee kam über
den Blick auf **https://www.claudecodeagents.com/** — ein freies, nicht mit Anthropic
verbundenes Verzeichnis vorgefertigter Subagent-Prompts (60+, Kategorien: Product
Strategy, Development, Design & UX, Quality & Testing, Operations, Business &
Analytics, Language/Framework Specialists, DevOps, Data & ML).

**Wichtige Einordnung:** Die Seite selbst wird nicht direkt genutzt (die meisten
dortigen Agents zielen auf Stacks, die der Pizza-Rechner nicht hat — Kubernetes,
React, APIs etc.). Stattdessen dient sie nur als **Kategorien-Inspiration**; die
eigentlichen Prompts werden hier im Projektkontext individuell zugeschnitten.

## Format eines Prompts (etabliertes Muster)

Jeder Agent-Prompt folgt derselben Struktur, damit er in einer neuen Session
selbständig funktioniert, ohne Rückfragen zu benötigen:

1. **Rollenzeile** (1–2 Sätze, deutsch, prägnant/griffig) — Persona + Kernversprechen.
2. **Projekt-Einordnung**: Hinweis, zuerst `pizza-rechner-KONTEXT.md` vollständig zu
   lesen (einzige Quelle für Stand/Regeln), dann die konkret relevanten Dateien.
3. **Arbeitsweise**: bei offenen/urteilslastigen Aufgaben zuerst Befund-/Ideenliste
   zeigen, dann erst umsetzen (verhindert unkontrolliertes Drauflos-Editieren).
4. **Prüfschwerpunkte**: konkrete, technisch spezifische Punkte (keine vagen
   Floskeln wie "gute UX" — sondern z. B. genaue ARIA-Attribute, Formeln, Dateien).
5. **Projektregeln** (aus der App-Kontext-Datei übernommen, nicht neu erfunden):
   - Desktop (`pizza-rechner.html`) + Mobile (`pizza-rechner-mobile.html`) bei
     inhaltlichen/Markup-Änderungen immer zusammen pflegen (identische Element-IDs,
     kein Auto-Sync). Reine `js/*`-Änderungen wirken automatisch auf beiden Seiten.
   - Nach jeder Änderung an Mobile-HTML/`js/`/`css/`: `python build-mobile-standalone.py`
     laufen lassen (erzeugt `pizza-rechner-mobile-standalone.html`, die iPhone-Datei
     via GitHub Pages), dann committen + pushen.
   - `tests/test.html` per Doppelklick prüfen, muss grün bleiben.
   - Versionen-Ordner (`Versionen/vX.Y.Z - Beschreibung/`) anlegen, `?v=`-Cache-Busting
     mitziehen, SemVer.
   - App-Kontext-Datei am Ende aktualisieren (neuer Abschnitt + Versions-Historie).
   - Keine externen Libraries/Frameworks/CDNs — muss offline per `file://` laufen.
   - **Preview-Tool ist in diesem Projekt unzuverlässig** (lädt `chrome-error://`) —
     Verifikation läuft über direktes Öffnen der Dateien im Browser, nicht über
     das Preview-Tool.
6. **Nicht-Scope**: was bewusst NICHT angefasst werden soll (verhindert Scope Creep).
7. **Abschluss-Erwartung**: klare Zusammenfassung am Ende (was wurde gefunden,
   was behoben, sind Tests grün).

## Bisher erstellte Prompts (Volltext-Archiv)

### 1. Mobile Optimizer
**Modellempfehlung: Sonnet 5** (Opus 4.8 als Option, falls UX-Feinschliff wichtiger
als Tempo ist — der Aufgabenanteil "identifiziere selbst 2–4 sinnvolle Optimierungen"
ist der einzige Grund, warum Opus infrage käme).

Rollenzeile-Bereich: Bedienbarkeit (Touch-Ziele, Einhandbedienung), Performance/
Ladeverhalten (MutationObserver-Jank), iOS-Eigenheiten (Safe-Area-Insets, Tastatur-
Verdeckung, 16px-Zoom-Regel), ID-Konsistenz Desktop↔Mobile, visuelles Feintuning.
Fokusdateien: `pizza-rechner-mobile.html`, `css/mobile.css`.

### 2. Test Generator
**Modellempfehlung: Sonnet 5.**

Rollenzeile: *"Testing-Experte, der umfassende Testsuiten erstellt. Schreibt die
Tests, die man sonst vor sich herschiebt. Unit, Integration, E2E — findet Bugs,
bevor sie die Nutzer finden."*

Fokus: Lücken in den ~50 bestehenden Tests (`tests/test.html`) schließen — Edge
Cases (Extremwerte), alle 7 Presets einzeln gegen Mehl-Warnung prüfen, Feature-
Kombinationen statt isolierter Werte (Vorteig + Kaltgare + Öl gleichzeitig),
Masseerhaltung für alle Methoden, Poolish-Wasser-Clamp (`R.prefEff`/`R.prefClamped`),
Zeitplan-Rückwärtsrechnung, Regressions-Anker pro historischem Bugfix (z. B.
Poolish-Wasser-Bug v3.0.1, Autolyse-Warnung v3.4.0). Bestehendes `testCase()`-Muster
und `BASE`-Objekt (mit `oil: 0` zur Isolation) beibehalten, kein neues Framework.

### 3. Accessibility Expert
**Modellempfehlung: Sonnet 5** (systematisches WCAG-Audit mit klaren Kriterien,
keine kreative Abwägung nötig — Opus wäre hier Overkill).

Rollenzeile: *"Accessibility-Experte. Maßstab ist WCAG 2.1 Level AA — findet
Barrieren, bevor sie Nutzer aussperren, behebt sie mit minimal-invasiven Eingriffen."*

Arbeitsweise: **Audit zuerst, Befundliste (Blocker/Major/Minor) mit WCAG-Kriterium
zeigen, erst dann umsetzen.**

Kern-Prüfpunkte:
- Dynamische Warnungen (`#flourWarn`, Autolyse-/Hefe-Hinweise): `aria-live="polite"`
  bzw. `role="alert"` **am statischen Container**, nicht an dynamisch ersetzten
  Kindern (sonst feuert es nicht zuverlässig) — größter Einzelfund, verifizieren.
- Custom-Controls (Pills, Segmente): `aria-pressed` oder Radiogroup-Pattern
  (`role="radiogroup"`/`role="radio"`/`aria-checked`), da der aktive Zustand aktuell
  nur visuell (rote Füllung) erkennbar ist.
- Slider: Label-Verknüpfung + `aria-valuetext` mit Einheit statt nackter Zahl.
- Ergebnis-Panel: Label-Wert-Zusammenhang für Screenreader prüfen.
- Kontraste (1.4.3/1.4.11) **konkret berechnen**, nicht schätzen: `.timechip`,
  `.warn`, gedämpfte Hint-Grautöne, aktive Pill (weiß auf Tomatenrot).
- Keyboard-Durchlauf (Tab/Shift-Tab/Pfeiltasten/Enter/Space) auf beiden Seiten,
  Fokus-Indikator + Fokus-Reihenfolge.
- Mobile: Quick-Bar-Anker-Link beschriftet? Verdeckt sie fokussierte Elemente?
- Dokumentstruktur: Überschriften-Hierarchie, `lang="de"`, Seitentitel.

Wichtiger technischer Hinweis im Prompt: `js/guide.js` erzeugt HTML-Strings, die
Tests per **String-Matching** prüfen — neue ARIA-Attribute dort können Tests brechen;
dann bewusst die Test-Erwartung mitziehen (nur in diesem begründeten Fall).

Nicht-Scope: HTML-Grundumbau (z. B. alles in `<fieldset>`), i18n, Dark Mode.

### 4. Performance Profiler
**Modellempfehlung: Sonnet 5** (systematisches Messen + gezielter Fix, keine
kreative Abwägung nötig).

Rollenzeile: *"Performance-Profiler. Macht spürbare Ruckler messbar, findet die
Ursache im Code und behebt sie mit dem kleinstmöglichen Eingriff."*

**Bewusst nur auf Abruf** (kein Standard-Check ohne Anlass — aktuell keine
gemeldeten Ruckler). Fokus: `MutationObserver` auf `#totalW` (Quick-Bar-Spiegel),
Slider-/Input-Reflows (löst jede Reglerbewegung eine volle `calc()`+`buildGuide()`-
Neuberechnung aus?), Akkordeon-Auto-Scroll-Layout-Thrashing, Ladezeit/Skript-
Reihenfolge. Da kein echtes altes iPhone verfügbar ist: Nachstellen über Chrome-
DevTools-Performance-Tab mit CPU-Throttling 4x–6x.

### 5. Feature Builder — Einfrier-Hinweis
**Modellempfehlung: Sonnet 5** (klar umrissener, bereits im Backlog beschriebener
Auftrag — keine offene Konzeptentscheidung).

Erster konkret umgesetzter Punkt aus „Mögliche nächste Schritte" der App-Kontext-
Datei: optionaler Anleitungs-Hinweis fürs Einfrieren geformter Teiglinge (einölen,
einzeln einfrieren, 2–3 Monate; Auftauen: über Nacht Kühlschrank + 3–5 h RT +
2–4 h Stückgare). Muss **optional/informativ** bleiben, darf Zeitberechnung/
Zeitplan-Rückrechnung nicht beeinflussen. Neuer Test analog Sektion „10 · Anleitungs-
Hinweise" (String-Matching).

### 6. Feature Builder — Einkaufsliste
**Modellempfehlung: Sonnet 5** (klarer, gut abgegrenzter Auftrag — reine
Darstellung bereits vorhandener `PZ.R`-Werte, keine neue Berechnung).

Backlog-Punkt „Einkaufsliste generieren; Druck nur für die Anleitung". Zwei
Teile: (1) druckbare Einkaufsliste aus den Gesamtmengen (Mehl/Wasser/Salz/Hefe/
Öl, bei Vorteig **Gesamtmenge, nicht Aufteilung**), (2) Druckansicht, die nur die
Schritt-für-Schritt-Anleitung zeigt (Eingaben/Ergebnis-Panel/Navigation
ausgeblendet). Nur Browser-Druckdialog (`window.print()` + `@media print`), kein
eigener PDF-Generator.

### 7. Feature Builder — Mehrere gespeicherte Rezepte
**Modellempfehlung: Sonnet 5** (Opus 4.8 als Option, falls die Migrations-/
Speicherformat-Entscheidung mehr architektonisches Gewicht bekommen soll — sonst
reicht Sonnet mit dem im Prompt vorgegebenen Format-Vorschlag).

**Architektonisch anspruchsvollster** der Feature-Builder-Prompts: `js/storage.js`
von einem einzelnen `state`-Slot auf `{ recipes: [...], activeId }` erweitern,
**rückwärtskompatible Migration** Pflicht (bestehende Nutzerdaten dürfen beim
ersten Laden nach dem Update nicht verloren gehen). Abgrenzung zu den 7 festen
Presets (`js/presets.js`) — unterschiedliche Konzepte, nicht vermischen. Quick-
Save auf Mobil (`#qbSave`) muss weiter ohne Dialog funktionieren.

### 8. Feature Builder — Gärzeit-Timer/Wecker
**Modellempfehlung: Sonnet 5** (native Browser-APIs, klar umrissene UX-Fragen im
Prompt bereits beantwortet — kein Opus nötig).

Backlog-Punkt „Gärzeit-Timer / Wecker" (PDF/Teilen-Link-Teil bleibt separat
offen). Rein clientseitig, **kein Service-Worker** (Timer läuft nur bei offenem
Tab — bewusste Grenze, im UI kommunizieren). `Notification`-API nur auf explizite
Nutzeraktion hin anfragen, mehrere parallele Timer möglich (z. B. Vorteig +
Formung), Fallback bei verweigerter Permission. Web-Audio-Beep statt externer
Sound-Datei (keine neue Library).

## Feature-Zyklus (Scrum-artiger Ablauf, ab 2026-07-11 fest etabliert)

Statt jeden Feature-Durchlauf einzeln zu planen, folgt das Projekt jetzt einem
festen, wiederholten 5-Phasen-Zyklus, orchestriert durch den neuen Agenten
`feature-cycle-orchestrator` (`.claude/agents/feature-cycle-orchestrator.md`):

1. **Brainstorming** (interaktiv, Nutzer entscheidet aktiv mit — nie automatisch!)
   — offene Punkte aus „Mögliche nächste Schritte" (`pizza-rechner-KONTEXT.md`)
   auflisten, Aufwand/Nutzen einschätzen, Nutzer wählt das nächste Vorhaben.
   Auch Nicht-Feature-Arbeit (Design-Überarbeitung, Bugfix, Refactoring) ist
   ein vollwertiges Zyklus-Vorhaben.
2. **Implementieren** (automatisch) — Standard: der Orchestrator setzt selbst
   um. Bestehende `feature-builder-*` nur bei genauer Passung aufrufen; neue
   Agenten-Dateien nur bei absehbarer Wiederverwendung anlegen (Schreiben nach
   `.claude/agents/` kann eine Permission-Blockade auslösen, die nur der Nutzer
   direkt freigeben kann).
3. **Testen** (automatisch) — `tests/test.html` immer grün prüfen;
   `test-generator` nur bei Logik-Änderungen (`js/calc.js`/`schedule.js`/`guide.js`).
4. **Härten** (automatisch, aber gezielt) — Audit-Agenten **synchron** aufrufen
   (nie im Hintergrund hängen lassen, nie doppelt starten): `accessibility-expert`
   bei UI-/Markup-/Styling-Änderungen, `mobile-optimizer`/`performance-profiler`
   nur bei konkretem Anlass.
5. **Abschluss** (automatisch) — ggf. Standalone-Build, Version, Kontext-Datei,
   Backlog abhaken, commit + push, Zusammenfassung mit Kandidaten für den
   nächsten Zyklus. Ein Folgezyklus startet erst nach neuer Nutzer-Bestätigung.

**Kernregel:** Nur Phase 1 (Brainstorming/Feature-Auswahl) ist bewusst
**nicht** autonom — der Nutzer möchte hier aktiv mitentscheiden, alle anderen
Phasen laufen ohne Rückfrage durch (außer bei roten Tests oder echten
Architektur-Entscheidungen, dann stoppt der Orchestrator und fragt nach).

**Modellempfehlung für den Orchestrator selbst: Sonnet 5** — er koordiniert
nur (ruft andere Agenten auf, trifft keine inhaltlichen Detailentscheidungen
selbst), Opus wäre hier Overkill.

## Von Prompt-Text zu echtem Claude-Code-Subagent

Ab 2026-07-11 liegen die Prompts **zusätzlich** als echte, direkt aufrufbare
Claude-Code-Subagents unter `.claude/agents/` (im Pizza-Projektordner):
`mobile-optimizer.md`, `test-generator.md`, `accessibility-expert.md`,
`performance-profiler.md`, `feature-builder-einfrierhinweis.md`,
`feature-builder-einkaufsliste.md`, `feature-builder-mehrere-rezepte.md`,
`feature-builder-timer.md` — jeweils mit YAML-Frontmatter (`name`, `description`,
`tools`) + demselben inhaltlichen Aufbau wie die Volltext-Prompts oben. Können
direkt über das Agent-Tool (`subagent_type`) aufgerufen werden, ohne den Prompt
manuell in eine neue Session zu kopieren. Die Volltext-Prompts hier bleiben als
lesbares Archiv/Backup bestehen — bei Änderungen an einem Agent **beide Stellen**
(Volltext hier + `.claude/agents/*.md`) pflegen, damit sie nicht auseinanderlaufen.

## Offene Ideen für weitere Agent-Prompts (noch nicht geschrieben)

Aus der Kategorien-Übersicht von claudecodeagents.com als möglich diskutiert,
aber (noch) zurückgestellt:

- **Design-Systems-Expert**: aktuell **nicht sinnvoll** — App ist Single-Purpose
  Vanilla-CSS ohne Komponenten-Wiederverwendungsdruck. Erst relevant, falls die
  App zu einer Rechner-Suite wächst (mehrere Seiten/Rechner) oder zu einem
  Framework (React/Vue) portiert wird.
- Noch nicht geschriebene Feature-Builder für die restlichen Backlog-Punkte:
  Zucker-Feld (New York Style), getrennte Mehl-/Raumtemperatur, PDF-Export/
  Teilen-Link (Timer-Teil ist mit „Feature Builder — Gärzeit-Timer/Wecker" bereits
  abgedeckt) — auf Zuruf einzeln nach demselben Muster schreibbar.
- Explizit **nicht sinnvoll** für dieses Projekt: Security-Agents (offline, kein
  Backend/API), Operations/DevOps-Agents (GitHub Pages reicht), Business/Analytics
  (keine Tracking-Anforderung), Framework-Specialists (kein Framework im Einsatz),
  Product-Strategy (Stabilität vor Wachstum-Fokus).

## Empfohlene Bearbeitungsreihenfolge

1. Mobile Optimizer ✓
2. Test Generator ✓
3. Accessibility Expert ✓ (läuft gerade / Stand 2026-07-11)
4. Feature Builder „Einfrier-Hinweis" — geschrieben, einsatzbereit (nächster Schritt)
5. Feature Builder „Einkaufsliste" — geschrieben, einsatzbereit
6. Feature Builder „Mehrere gespeicherte Rezepte" — geschrieben, einsatzbereit
   (architektonisch anspruchsvollster der drei, Migration beachten)
7. Feature Builder „Gärzeit-Timer/Wecker" — geschrieben, einsatzbereit
8. Performance Profiler — geschrieben, auf Abruf (nur bei spürbaren Rucklern starten,
   kein fester Platz in der Reihenfolge)
9. (optional, viel später) Design-Systems-Expert — nur bei Wachstum zur Suite

## Nutzerpräferenzen (für diese Nebenaufgabe)

- **Immer eine Modellempfehlung mitliefern**, wenn ein Agent-Prompt geschrieben
  wird (Sonnet 5 / Opus 4.8 / Fable 5 — mit kurzer Begründung, keine Standardwahl
  ohne Nachdenken).
- Rollenzeilen sollen **eingängig/griffig auf Deutsch** formuliert sein (angelehnt
  an den prägnanten Stil von claudecodeagents.com-Beschreibungen, aber übersetzt
  und leicht personalisiert, nicht wörtlich).
- Prompts sollen **eigenständig funktionieren** (neue Session, kein Vorwissen) —
  daher immer expliziter Verweis auf `pizza-rechner-KONTEXT.md` als erste Leseaufgabe.

## Verknüpfung zur App-Kontext-Datei

Diese Datei ergänzt `pizza-rechner-KONTEXT.md` (liegt im selben Ordner:
`C:\Users\soere\OneDrive\Dokumente\Claude\Pizza\`) — dort steht der App-Stand,
hier steht der Stand der **Prompt-Entwicklung** für die begleitenden Agents.
Bei Widersprüchen gilt die App-Kontext-Datei als Quelle der Wahrheit für den
App-Stand; diese Datei ist reine Prozess-/Prompt-Dokumentation.
