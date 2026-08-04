Header-Foto (v4.38.0 — generiertes Bild aktiv)
================================================

Der Header (Desktop + Mobil, gemeinsame Regel in css/styles.css) zeigt seit
v4.38.0 assets/img/header-teig-desktop.webp (generiert, Bild-Einbau Zyklus 4,
Block 3 "header-teig-desktop" aus assets/BILD-PROMPTS.md — sechs Teiglinge auf
bemehlter Arbeitsplatte, 21:9, 2560x1096px WebP, ~144 KB). Davor zeigte der
Header von v3.44.0 bis v4.37.0 ein einzelnes vom Nutzer bereitgestelltes Foto
(assets/header-pizza.jpg, Nahaufnahme einer Margherita). Bis v3.43.0 war das
nur ein rein CSS-basierter Platzhalter (warmer Terrakotta-Verlauf mit zwei
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

2. In css/styles.css EINEN Wert ändern — die CSS-Variable --header-photo
   im :root-Block (ganz oben in der Datei):

     --header-photo:none;
   wird zu
     --header-photo:url('../assets/img/<dateiname>.webp');

   WICHTIG: der Pfad ist relativ zu css/styles.css selbst (liegt im
   Unterordner css/), NICHT relativ zu den HTML-Dateien im Projekt-Root.
   Deshalb "../assets/…", nicht "assets/…" — sonst sucht der Browser unter
   css/assets/… und findet nichts (Bild bleibt unsichtbar, Fallback-Verlauf
   zeigt sich stattdessen, OHNE Fehlermeldung im UI — genau dieser Fehler ist
   beim ersten Einbau des echten Fotos in v3.44.0 passiert und wurde per
   Screenshot-Vergleich entdeckt). build-mobile-standalone.py korrigiert
   diesen Pfad beim Inlinen automatisch für pizza-rechner-mobile-
   standalone.html, die im Projekt-Root selbst liegt — bettet das Bild dabei
   aber NICHT als Base64 ein, nur der Pfad wird angepasst (unverändertes
   Verhalten seit header-pizza.jpg, keine spezielle Inline-Logik für
   --header-photo in build-mobile-standalone.py).

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
   6,27:1 Desktop, 5,59:1 Mobil, beide über der 3:1-Schwelle für den großen
   fetten Headertitel (26px, 700).

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
