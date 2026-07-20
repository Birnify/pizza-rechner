Header-Foto (v3.44.0 — echtes Bild aktiv)
==========================================

Der Header (Desktop + Mobil, gemeinsame Regel in css/styles.css) zeigt seit
v3.44.0 ein echtes Foto: assets/header-pizza.jpg (vom Nutzer bereitgestellt,
1920x1079px JPEG, ~257 KB, Nahaufnahme einer Margherita auf dunklem Holztisch).
Bis v3.43.0 war das nur ein rein CSS-basierter Platzhalter (warmer Terrakotta-
Verlauf mit zwei Bokeh-artigen Lichtflecken + feiner Diagonal-Textur) — dieser
Platzhalter existiert im CSS weiterhin als Fallback-Ebene unter dem Foto, falls
die Bild-Datei aus irgendeinem Grund mal fehlt/nicht lädt.

So wird das Foto (oder ein künftiges Ersatzfoto) eingebunden:

1. Bild-Datei in diesen Ordner legen, z. B.:
     assets/header-pizza.jpg
   (oder .webp — beides geht, JPG/WebP werden von allen Zielbrowsern
   unterstützt). Empfehlung: querformatig, mind. 1600px breit, komprimiert
   auf ein vernünftiges Datei-Gewicht (die App soll weiterhin schnell per
   file:// laden).

2. In css/styles.css EINEN Wert ändern — die CSS-Variable --header-photo
   im :root-Block (ganz oben in der Datei):

     --header-photo:none;
   wird zu
     --header-photo:url('../assets/header-pizza.jpg');

   WICHTIG (Bug in der ursprünglichen v3.41.0-Anleitung, in v3.44.0 korrigiert):
   der Pfad ist relativ zu css/styles.css selbst (liegt im Unterordner css/),
   NICHT relativ zu den HTML-Dateien im Projekt-Root. Deshalb "../assets/…",
   nicht "assets/…" — sonst sucht der Browser unter css/assets/… und findet
   nichts (Bild bleibt unsichtbar, Fallback-Verlauf zeigt sich stattdessen,
   OHNE Fehlermeldung im UI — genau dieser Fehler ist beim ersten Einbau des
   echten Fotos passiert und wurde per Screenshot-Vergleich entdeckt).

3. Kontrast gegenprüfen: Über dem Foto liegt eine feste halbtransparente
   Abdunklungs-Ebene (rgba(20,9,5,.55)), die für ausreichenden Kontrast des
   weißen Header-Texts sorgen soll (WCAG 1.4.3). Ist das gewählte Foto sehr
   hell (z. B. viel weißes Mehl/heller Tisch im Vordergrund), diesen Wert in
   css/styles.css ggf. leicht erhöhen (z. B. .6–.65) und den Kontrast erneut
   prüfen — am zuverlässigsten per Headless-Edge-Screenshot + rechnerischer
   Kontrastprüfung der sichtbaren Bildbereiche, nicht nur durch Schätzen.

4. Der Header ist SEHR breit und flach (Desktop z. B. ~1280x140px) im
   Vergleich zu einem typischen querformatigen Foto (z. B. 1920x1079px,
   Seitenverhältnis ~1,78:1) — bei background-size:cover wird das Bild so
   skaliert, dass es die Breite exakt füllt, wodurch vertikal nur ein
   schmaler horizontaler Streifen sichtbar bleibt (die volle Bildbreite,
   aber nur ein Bruchteil der Bildhöhe, standardmäßig der mittige Streifen
   dank background-position:center). Bei einem neuen/anderen Foto lohnt es
   sich, testweise background-position (aktuell "center" für die Foto-Ebene)
   anzupassen, falls der interessanteste Bildausschnitt (z. B. die Kruste
   mit den charakteristischen Röstflecken) nicht im mittigen Streifen liegt.

5. ?v=-Cache-Busting auf allen <link>/<script>-Tags in pizza-rechner.html
   und pizza-rechner-mobile.html hochzählen (übliche Versionierungs-
   Konvention dieses Projekts) sowie pizza-rechner-mobile-standalone.html
   per build-mobile-standalone.py neu bauen.
