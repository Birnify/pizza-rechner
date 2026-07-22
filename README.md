# 🍕 Teigmeister (Pizzateig-Rechner)

Ein Rechner für neapolitanischen Pizzateig (Direkt / Biga / Poolish) mit adaptiver
Schritt-für-Schritt-Anleitung, Zeitplan und Einkaufsliste. Läuft komplett offline im
Browser: kein Server, keine Installation, kein Internet, keine KI.

## Starten
- **Desktop:** `pizza-rechner.html` doppelklicken (oder `index.html`).
- **Mobil:** `pizza-rechner-mobile-standalone.html` aufs Handy übertragen und dort
  öffnen (alles in einer Datei, kein Server nötig).

## Bedienung in Kürze
- Oben ein fertiges **Preset** wählen, oder im **Erweiterten Modus** alle Details selbst
  einstellen (Hydration, Salz, Hefe, Vorteig-Verfahren, Temperaturen).
- Ergebnis zeigt Mengen (Bäckerprozente), Schüttwassertemperatur und ggf. Eismenge.
- Schritt-für-Schritt-Anleitung passt sich live an, mit Start-/Zielzeit bekommt jeder
  Schritt eine Uhrzeit sowie optional einen Countdown-Timer.
- Klickbare Glossar-Verweise direkt in der Anleitung erklären Fachbegriffe (Autolyse,
  Poolish, Ofen-Heizarten und mehr).
- 💾 Speichern legt beliebig viele benannte Rezepte im Browser ab (`localStorage`),
  inklusive Export/Import als Datei und Teilen-Link.
- Pizza-Party-Planer für mehrere Pizzen gleichzeitig, mit aggregierter Einkaufsliste.
- Einstellungen-Menü: Sprache (DE/EN), Dunkelmodus, Einheitensystem
  (metrisch/imperial), Feature-Flags, globale Hefe-/Verschwendungs-Anpassung.

## Projektstruktur
```
pizza-rechner.html            Desktop-Ansicht: Markup + Einbindung von CSS/JS
pizza-rechner-mobile.html     Mobil-Ansicht (Quelle), eigene Bottom-Tab-Navigation
pizza-rechner-mobile-standalone.html   Build-Ergebnis (alles inline), diese Datei aufs Handy
build-mobile-standalone.py    Erzeugt die Standalone-Datei aus pizza-rechner-mobile.html
index.html                    Weiterleitung auf pizza-rechner.html
css/                          Stylesheets (styles.css gemeinsam, mobile.css nur Mobil)
js/                           modulare Logik, siehe Dateistruktur in pizza-rechner-KONTEXT.md
tests/test.html               Rechenlogik-Tests (per Doppelklick öffnen, kein Server nötig)
Versionen/                    vollständige Schnappschüsse je Version (siehe Versionen/LIESMICH.txt)
pizza-rechner-KONTEXT.md      ausführliche Projekt-/Übergabe-Doku: aktueller Stand,
                              Domänenlogik, Dateistruktur, Backlog
pizza-rechner-KONTEXT-HISTORIE.md   ausführliche Release-für-Release-Historie
.claude/                      Sub-Agenten-Definitionen + Preview-Server-Konfiguration
                              für die Arbeit mit Claude Code
```

## Tests
`tests/test.html` doppelklicken, prüft die echte Rechenlogik (Bäckerprozente,
Wassertemperatur, Eismenge, Vorteig-Aufteilung, Trockenhefe-Umrechnung, Zeitplan,
Einheitensystem und mehr). Oben steht grün "Alle Prüfungen bestanden" bzw. rot mit
Details.

## Versionen
Bei jeder abgeschlossenen Änderung wird ein vollständiger Schnappschuss unter
`Versionen/vX.Y.Z - Beschreibung/` abgelegt (SemVer: Patch=Fix, Minor=Feature,
Major=Umbau). Details in `Versionen/LIESMICH.txt`.

## Weiterarbeiten mit Claude Code
Für eine neue Session genügt `pizza-rechner-KONTEXT.md`: sie enthält den kompletten
aktuellen Stand, die Domänenlogik und das offene Backlog. `CLAUDE.md` beschreibt den
Arbeitsablauf (Orchestrator-Workflow, Versionierung, Bug-Untersuchung). Beide Dateien
sind bewusst so geschrieben, dass eine frische Session (auch unter einem anderen
Account) nahtlos weiterarbeiten kann.
