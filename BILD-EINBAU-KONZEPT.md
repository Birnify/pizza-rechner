# Konzept: Bilder in die App einbauen

Stand: 2026-08-02 · App-Stand v4.31.0 · Grundlage für mehrere aufeinander folgende Zyklen

Dieses Dokument legt die **Mechanik** fest, mit der alle 128 Bild-Blöcke aus
`assets/BILD-PROMPTS.md` in die App kommen. Es entsteht bewusst **vor** dem ersten
Einbau-Zyklus, damit nicht jede Bildkategorie ihr eigenes Muster erfindet und später
alles umgebaut werden muss.

Es beschreibt **nicht**, wie die Bilder erzeugt werden (das steht in
`assets/BILD-PROMPTS.md` und `assets/SESSION-STATUS.md`).

---

## 1. Ausgangslage (gemessen, nicht geschätzt)

- **Die App hat heute genau einen echten Bild-Slot:** `--header-photo` in
  `css/styles.css` (Headerfoto). Dazu drei fest verdrahtete Pfade in `js/guide.js`
  (`FINAL_PHOTO`, Foto der fertigen Pizza).
- **118 von 128 Bildern liegen abgenommen in `assets/_final/`**, zusammen rund **18 MB**.
  Einzelne Dateien zwischen 59 KB und 527 KB.
- **Rund 10 Bilder fehlen noch** (Blöcke 77, 82, 83, 84 mit bekannten Problemen, 96 bis 98
  zurückgestellt, 118/119/124/126 offen). Das Konzept muss deshalb **teilweise befüllte
  Kategorien aushalten**, ohne kaputt auszusehen.
- **Aktiver Fehler im Repo:** die drei von `js/guide.js` referenzierten Dateien
  (`assets/pizza-final-neapolitanisch.jpg`, `-newyork.jpg`, `-teglia.jpg`) wurden nach
  `assets/_final/` verschoben und aus `assets/` gelöscht. Der Anleitungs-Abschluss zeigt
  damit aktuell ein **kaputtes Bild**. Muss im ersten Zyklus mit behoben werden.
- **Der Standalone-Build inlined Bilder als base64** (`build-mobile-standalone.py`,
  `inline_images()`, aktuell nur `pizza-final-*.jpg`). Die Datei liegt heute bei 663 KB.
  Mit allen Bildern würde daraus eine rund 25 MB große Einzeldatei.
- **Die Preset-Karten existieren schon als Markup**, aber nur drei Stück und rein textlich:
  `.preset-card` für „Schnell", „Klassisch", „Lang" (`pizza-rechner.html`), dahinter ein
  aufklappbares `<details>` mit dem vollständigen `#preset`-Dropdown (9 Rezepte).
  Bildmaterial existiert dagegen für **11 Karten** (Blöcke 8 bis 18), darunter
  `card-napoli_65.webp` für ein Preset, das es im Code gar nicht mehr gibt.

---

## 2. Die vier Schichten

### Schicht 1: Ein einziger app-seitiger Bildordner

`assets/_final/` ist heute die **Abnahme-Schleuse** des Bild-Workflows. Ein Ordnername mit
führendem Unterstrich, der „intern, noch nicht öffentlich" bedeutet, ist kein guter Ort,
aus dem die laufende App liest.

**Regel:** `assets/_final/` wird zu **`assets/img/`** umbenannt und ist ab dann der
app-seitige Bildordner. Der Erzeugungs-Workflow schreibt Entwürfe weiterhin nach
`assets/`, und „abgenommen" heißt weiterhin „nach `assets/img/` verschoben".

Damit gibt es **keine Kopie, keinen Sync-Schritt und keine doppelten 18 MB** im Repo.
Geändert werden muss nur die Wortwahl in `BILD-PROMPTS.md`, `SESSION-STATUS.md` und den
Python-Skripten.

### Schicht 2: Ein zentrales Bild-Register (`js/images.js`)

Neues Modul, früh in der Ladereihenfolge (nach `i18n`, vor `guide`/`glossary`/`presets`).
Es hält die **einzige** Zuordnung von logischem Schlüssel zu Datei:

```js
PZ.IMG = {
  'preset.napoli_klassisch': { file:'card-napoli_klassisch.webp', ratio:'3/2', alt:null },
  'guide.final.teglia':      { file:'pizza-final-teglia.jpg',     ratio:'16/9',
                               alt:'img.alt.guideFinal.teglia' },
  'glossar.hydration':       { file:'glossar-hydration.webp',     ratio:'3/2', alt:null,
                               pending:true },
  ...
};
```

- **Kein anderes Modul und keine HTML-Datei enthält je wieder einen Dateinamen.**
  Genau die Streuung fester Pfade hat den oben genannten aktiven Fehler erzeugt.
- `alt:null` heißt **dekorativ** (`alt=""`). Das ist der Regelfall: eine Preset-Karte
  trägt Name, Zeit und Eignung bereits als Text, ein beschreibender Alt-Text würde für
  Screenreader-Nutzer nur alles doppeln. Ein Alt-Text steht nur dort, wo das Bild
  **eigene** Information trägt.
- `pending:true` markiert noch nicht abgenommene Bilder.

`PZ.img(key)` liefert `null`, wenn der Schlüssel unbekannt oder `pending` ist. Aufrufer
rendern dann **gar nichts** statt eines kaputten Bildes. Das ist der Mechanismus, der es
erlaubt, eine Kategorie einzubauen, obwohl vier ihrer Bilder noch fehlen.

### Schicht 3: Ein einziger Markup-Baustein

`PZ.imgHtml(key, opts)` erzeugt für alle Kategorien dasselbe Muster:

```html
<span class="media media--3x2">
  <img src="assets/img/card-napoli_klassisch.webp" alt=""
       width="1500" height="1000" loading="lazy" decoding="async">
</span>
```

- `width`/`height` bzw. `aspect-ratio` aus dem Register: **kein Layout-Sprung** beim
  Nachladen, kein Ruckeln beim Scrollen.
- `loading="lazy"` überall außer beim Header/Hero (der ist sofort sichtbar).
- Dazu **ein** CSS-Block `.media` mit den Seitenverhältnis-Varianten, einmal definiert,
  von jeder Kategorie genutzt.
- Fehlt die Datei trotzdem, bleibt dank fester Box das Layout stabil.

### Schicht 4: Gewicht und der Standalone-Build

- Die Quelldateien sind für die Anzeigegröße **deutlich zu groß** (Karten werden mit rund
  150 bis 300 px Breite dargestellt, die Dateien haben 1500 px). Ein Aufbereitungsschritt
  (`assets/prepare_web_images.py`) erzeugt anzeigegerechte Fassungen. Zielmarke: die
  gesamte App unter rund 2 MB Bildlast, statt 18 MB.
- Der Standalone-Build kann **nicht** alle Bilder als base64 einbetten. Das ist die
  einzige offene Grundsatzentscheidung, s. Abschnitt 4.

---

## 3. Reihenfolge des Einbaus

Jede Kategorie ist ein eigener Zyklus über den Orchestrator (Markup plus CSS in Desktop
und Mobil, also klar kein Inline-Fix). Der erste Zyklus baut zusätzlich die Schichten 1
bis 3 auf, die folgenden nutzen sie nur noch.

| # | Kategorie | Blöcke | Aufwand | Status |
|---|-----------|--------|---------|--------|
| 1 | Preset-Karten **plus Grundgerüst** plus Fix des kaputten Anleitungsfotos | 8 bis 18 | groß (Fundament) | **erledigt (v4.32.0)** |
| 2 | Anleitungs-Schrittbilder | 27 bis 45 | mittel | offen |
| 3 | Glossar (Kategorie-Banner und Artikelbilder) | 46 bis 90 | mittel | offen |
| 4 | Hero/Header (ersetzt das heutige Einzelfoto) | 1 bis 7 | klein | offen |
| 5 | Onboarding, Party, Leerzustände | 91 bis 105 | mittel | offen |
| 6 | Texturen, Marketing, Varianten | 106 bis 128 | offen | offen |

---

## 4. Getroffene Entscheidungen (Nutzer, 2026-08-02)

1. **Standalone-Build fürs iPhone bleibt eine Einzeldatei.** Eingebettet wird nur eine
   kleine, bewusst ausgewählte Menge Bilder. Alle übrigen fehlen dort absichtlich, und
   dank des `null`-Verhaltens aus Schicht 2 sieht die App auf dem iPhone trotzdem sauber
   aus (kein kaputtes Bild, kein Layout-Loch). Welche Bilder zur Auswahl gehören, wird
   pro Kategorie-Zyklus entschieden.
2. **Die Preset-Auswahl wird ein bebildertes Kartengitter über alle neun Rezepte.** Das
   heutige Dropdown im aufklappbaren `<details>` wird dadurch ersetzt. Jede Karte trägt
   Bild, Name, Zeitangabe und Eignung. Die bisherige Sonderrolle der drei Empfehlungen
   („Schnell", „Klassisch", „Lang") entfällt damit als eigenes Markup.
3. **Kein Schalter „Bilder anzeigen".** Bewusst nicht eingeführt, um den Umfang klein zu
   halten. Kann später nachgeholt werden, `PZ.FLAGS` existiert bereits.

Offen bleibt nur, was pro Kategorie-Zyklus ohnehin einzeln entschieden wird
(Auswahl der eingebetteten Bilder, konkrete Anzeigegrößen).

---

## 5. Design-System (erledigt am 2026-08-02)

Die maßgebliche Design-System-Beschreibung liegt seit 2026-08-02 im Repo unter
`design-import/DESIGNSYSTEM-TEIGMEISTER.md`. Der Ordner `design-import/` enthält das
System als Dateien (Tokens, Komponenten, Spezimen-Karten, Bildschirm-Nachbau). Derselbe
Stand liegt im Claude-Design-Projekt „Design System" des Nutzers, dorthin mit 44 Dateien
hochgeschoben. Details s. `pizza-rechner-KONTEXT.md`, Abschnitt „Design-System".

Für den Bild-Einbau wurden dort drei Dinge ergänzt, damit die Bildbehandlung **einmal**
festgelegt ist statt in jedem Zyklus neu in CSS erfunden zu werden:

- **`components/media/Media.jsx`** — die eine Bildbox. Legt die erlaubten
  Seitenverhältnisse fest (3:2 Karten und Glossar, 4:3 Anleitungsschritte, 16:9
  Fertig-Foto, 3:1 Glossar-Banner, 21:9 Desktop-Header, 4:5 Mobil-Header, 1:1 Texturen),
  reserviert die Fläche vor dem Laden, füllt sie währenddessen mit `--surface-2` statt
  Weiß, lädt alles außer dem Header verzögert und **rendert bei fehlender Datei gar
  nichts**.
- **`components/cards/PresetCard.jsx`** — um eine Bildvariante erweitert. Bild bündig an
  der Oberkante, dekorativ ausgezeichnet, weil Name, Zeit und Eignung darunter dasselbe
  bereits als Text sagen. Karten mit und ohne Bild dürfen im selben Gitter stehen.
- **`guidelines/imagery.card.html`** — Spezimen-Karte, die genau diese drei Fälle zeigt
  (feste Verhältnisse, Bild auf einer Karte, Karte ohne Bild).

Der Umsetzungs-Zyklus überträgt diese Spezifikation nach `css/styles.css` und
`js/images.js`, er erfindet sie nicht neu.

---

## 6. Zyklus 1: Ergebnis (v4.32.0, erledigt)

Alle vier Schichten wie oben beschrieben umgesetzt: `assets/img/` (Umbenennung von
`assets/_final/`), `js/images.js` (Register + `PZ.imgHtml()` + `PZ.hydrateImages()` für
statische Platzhalter), `.media`/`.media--<ratio>` in `css/styles.css` (alle 7 Verhältnisse
schon definiert, 3:2 und 16:9 in Benutzung), `assets/prepare_web_images.py` (Pillow, verkleinert
gezielt angebundene Dateien auf Anzeigegröße statt aller 128 auf einmal). Preset-Auswahl ist
jetzt ein 9-Karten-Gitter, das kaputte Anleitungsfoto ist behoben. Details, Testzahlen und
Commit-Hash: `pizza-rechner-KONTEXT.md`, Abschnitt „Bild-Grundgerüst plus bebildertes
Preset-Kartengitter (v4.32.0)".

Offene Nebenpunkte für spätere Zyklen: `assets/BILD-PROMPTS.md`/`assets/SESSION-STATUS.md`/
die Erzeugungs-Skripte (`generate_bilder.py` u. a.) sprechen noch von `assets/_final/` statt
`assets/img/` — bewusst nicht in diesem Zyklus mitgezogen (die laufende Bild-Erzeugungsarbeit
war explizit außerhalb des Auftrags), sollte aber vor der nächsten Erzeugungs-Sitzung
nachgezogen werden, sonst legt der Workflow versehentlich einen neuen `assets/_final/`-Ordner
an.
