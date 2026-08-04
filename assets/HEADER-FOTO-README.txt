Header-Foto (v4.38.2 — Desktop und Mobil zeigen jetzt unterschiedliche Bilder)
================================================

Der Header (gemeinsame Markup-/Layout-Regel `header{}` in css/styles.css, gilt
für Desktop UND Mobil) nutzt die CSS-Variable `--header-photo` als Austausch-
Slot. Seit v4.38.2 ist das auf Desktop und Mobil NICHT mehr dasselbe Bild:

- **Desktop** (pizza-rechner.html, bindet nur css/styles.css ein): weiterhin
  assets/img/header-teig-desktop.webp (seit v4.38.0, 21:9, sechs Teiglinge auf
  bemehlter Arbeitsplatte, 2560x1096px WebP, ~144 KB).
- **Mobil** (pizza-rechner-mobile.html, bindet zusätzlich css/mobile.css NACH
  css/styles.css ein): seit v4.38.2 assets/img/header-teig-mobile.webp (4:5-
  Hochformat, Hand zieht Teig, 1200x1495px WebP, ~173 KB, moderat verkleinert
  aus dem 1400x1744-Original — Begründung s. Kommentar bei TARGETS in
  assets/prepare_web_images.py). Der Override sitzt als eigener `:root`-Block
  ganz oben in css/mobile.css (überschreibt den Desktop-Wert dank späterer
  Ladereihenfolge, KEIN Media-Query — die App hat bewusst zwei getrennte
  HTML-Seiten statt einer echten responsiven Seite, das bleibt so).

Davor (bis v4.38.1) zeigten Desktop und Mobil dasselbe Bild. Vor v4.38.0 zeigte
der Header von v3.44.0 bis v4.37.0 ein einzelnes vom Nutzer bereitgestelltes
Foto (assets/header-pizza.jpg, Nahaufnahme einer Margherita). Bis v3.43.0 war
das nur ein rein CSS-basierter Platzhalter (warmer Terrakotta-Verlauf mit zwei
Bokeh-artigen Lichtflecken + feiner Diagonal-Textur) — dieser Platzhalter
existiert im CSS weiterhin als Fallback-Ebene unter dem Foto, falls die
Bild-Datei aus irgendeinem Grund mal fehlt/nicht lädt.

So wird ein künftiges Ersatzbild eingebunden:

1. Bild-Original nach assets/originals/ legen (NICHT direkt nach assets/img/,
   s. die nicht-destruktive Konvention seit v4.35.2 in
   assets/prepare_web_images.py), dort einen TARGETS-Eintrag ergänzen und das
   Skript für diese eine Datei aufrufen:
     python assets/prepare_web_images.py <dateiname>.webp
   Das schreibt die aufbereitete Kopie nach assets/img/, das Original bleibt
   unangetastet erhalten (anders als bei header-pizza.jpg, dessen Original
   nicht mehr existiert). Empfehlung: querformatig, mind. 1600px breit.

2. Den Wert ändern — die CSS-Variable --header-photo. Für ein Bild, das auf
   BEIDEN Seiten gelten soll: im :root-Block ganz oben in css/styles.css:

     --header-photo:url('../assets/img/header-teig-desktop.webp');
   wird zu
     --header-photo:url('../assets/img/<dateiname>.webp');

   Für ein Bild, das NUR auf Mobil gelten soll (wie header-teig-mobile.webp
   seit v4.38.2): stattdessen den :root-Block ganz oben in css/mobile.css
   ändern (nicht css/styles.css) — der dortige Wert überschreibt den aus
   styles.css, weil pizza-rechner-mobile.html css/mobile.css NACH
   css/styles.css lädt; pizza-rechner.html (Desktop) bindet css/mobile.css
   gar nicht ein, ist also von einer Änderung dort unberührt.

   WICHTIG (gilt für beide Dateien): der Pfad ist relativ zur jeweiligen
   CSS-DATEI selbst (liegt im Unterordner css/), NICHT relativ zu den
   HTML-Dateien im Projekt-Root. Deshalb "../assets/…", nicht "assets/…" —
   sonst sucht der Browser unter css/assets/… und findet nichts (Bild bleibt
   unsichtbar, Fallback-Verlauf zeigt sich stattdessen, OHNE Fehlermeldung im
   UI — genau dieser Fehler ist beim ersten Einbau des echten Fotos in
   v3.44.0 passiert und wurde per Screenshot-Vergleich entdeckt).
   build-mobile-standalone.py korrigiert diesen Pfad beim Inlinen automatisch
   für pizza-rechner-mobile-standalone.html (gilt generisch für jede per
   <link> eingebundene CSS-Datei, nicht nur für styles.css) — bettet das Bild
   dabei aber NICHT als Base64 ein, nur der Pfad wird angepasst
   (unverändertes Verhalten seit header-pizza.jpg, keine spezielle
   Inline-Logik für --header-photo in build-mobile-standalone.py).

3. Kontrast gegenprüfen: Über dem Foto liegt eine feste halbtransparente
   Abdunklungs-Ebene, aktuell rgba(20,9,5,.62) (header{} in css/styles.css —
   dieser Wert wandert bei Bedarf mit, ihn hier im Kommentar nicht separat
   pflegen, sondern immer den tatsächlichen CSS-Wert nachschlagen), die für
   ausreichenden Kontrast des weißen Header-Texts sorgen soll (WCAG 1.4.3).
   Ist das gewählte Foto sehr hell (z. B. viel weißes Mehl/heller Tisch im
   Vordergrund), diesen Wert in css/styles.css ggf. leicht erhöhen und den
   Kontrast erneut prüfen — NICHT durch Schätzen oder Prüfung des
   Bild-Durchschnitts, sondern am Worst-Case-Pixel im tatsächlichen
   Titel-Textbereich, live gemessen (Canvas im Browser oder Python gegen den
   per sim_header_crop.py erzeugten Ausschnitt, echte gemessene
   Titel-Koordinaten, echte CSS-Overlay-Deckkraft). Bei v4.38.0 so geprüft:
   6,27:1 Desktop, 5,59:1 Mobil (damals noch dasselbe Bild wie Desktop),
   beide über der 3:1-Schwelle für den großen fetten Headertitel (26px, 700).
   Bei v4.38.2 (eigenes Mobil-Bild) erneut geprüft: ca. 5,76-5,83:1 Mobil
   (zwei unabhängige Methoden: Headless-Edge-Screenshot mit Text-Bounding-Box-
   Erkennung, plus analytische Gegenprobe direkt aus der Bilddatei mit
   derselben cover/center-Mathematik wie sim_header_crop.py).

4. Der Header ist SEHR breit und flach (Desktop bei 1280px Viewport gemessen
   1265x142px, Mobil bei 390px Viewport 390x90px) im Vergleich zu einem
   typischen 21:9-Bild (2560x1100px) — bei background-size:cover wird das
   Bild so skaliert, dass es die Breite exakt füllt, wodurch vertikal nur ein
   schmaler horizontaler Streifen sichtbar bleibt (Desktop ca. 26% der
   Bildhöhe, Mobil noch weniger, standardmäßig der mittige Streifen dank
   background-position:center). NICHT das Vollbild beurteilen, sondern den
   tatsächlich sichtbaren Ausschnitt:
     python assets/sim_header_crop.py <dateiname>.webp
     python assets/sim_header_crop.py <dateiname>.webp --mobile
   schneidet den sichtbaren Streifen heraus und legt ihn vergrößert unter
   assets/_sim/ ab. Bei einem neuen Foto lohnt es sich, testweise
   background-position (aktuell "center" für die Foto-Ebene) anzupassen,
   falls der interessanteste Bildausschnitt nicht im mittigen Streifen liegt
   — bei generierten Bildern ist es einfacher, das gewünschte Motiv gleich
   auf halber Bildhöhe zu komponieren (s. Block-3-Prompt in
   assets/BILD-PROMPTS.md als Vorbild).

5. ?v=-Cache-Busting auf allen <link>/<script>-Tags in pizza-rechner.html
   und pizza-rechner-mobile.html hochzählen (übliche Versionierungs-
   Konvention dieses Projekts) sowie pizza-rechner-mobile-standalone.html
   per build-mobile-standalone.py neu bauen.
