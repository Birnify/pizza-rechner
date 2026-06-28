# 🍕 Pizzateig-Rechner

Ein Rechner für neapolitanischen Pizzateig (Direkt / Biga / Poolish) mit adaptiver
Schritt-für-Schritt-Anleitung und Zeitplan. **Läuft komplett offline** im Browser —
kein Server, keine Installation, kein Internet.

## Starten
`pizza-rechner.html` doppelklicken (oder `index.html`). Fertig.

## Bedienung in Kürze
- Links Werte einstellen (oder oben ein fertiges **Preset** wählen).
- Rechts erscheinen Mengen (Bäckerprozente), Schüttwasser-Temperatur und ggf. Eismenge.
- Unten eine Anleitung, die sich live an die Einstellungen anpasst; mit Start-/Zielzeit
  bekommt jeder Schritt eine konkrete Uhrzeit.
- 💾 **Speichern** legt die Einstellungen im Browser ab (`localStorage`).

## Projektstruktur
```
pizza-rechner.html   Markup + Einbindung von CSS/JS
index.html           Weiterleitung auf pizza-rechner.html
css/styles.css       Stylesheet
js/                  modulare Logik (dom, state, calc, schedule, guide, ui, presets, storage, main)
tests/test.html      Rechenlogik-Tests (per Doppelklick öffnen, kein Server nötig)
Versionen/           vollständige Schnappschüsse je Version (siehe Versionen/LIESMICH.txt)
pizza-rechner-KONTEXT.md   ausführliche Projekt-/Übergabe-Doku
```

## Tests
`tests/test.html` doppelklicken — prüft die echte Rechenlogik (Bäckerprozente,
Wassertemperatur, Eismenge, Vorteig-Aufteilung, Trockenhefe-Umrechnung). Oben steht
grün „Alle Prüfungen bestanden" bzw. rot mit Details.

## Versionen
Bei jeder abgeschlossenen Änderung wird ein vollständiger Schnappschuss unter
`Versionen/vX.Y.Z - Beschreibung/` abgelegt (SemVer: Patch=Fix, Minor=Feature,
Major=Umbau). Details in `Versionen/LIESMICH.txt`.
