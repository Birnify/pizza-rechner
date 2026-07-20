Header-Foto — Platzhalter-Slot (v3.41.0)
==========================================

Der Header (Desktop + Mobil, gemeinsame Regel in css/styles.css) zeigt aktuell
noch KEIN echtes Foto, sondern einen rein CSS-basierten Platzhalter (warmer
Terrakotta-Verlauf mit zwei Bokeh-artigen Lichtflecken + feiner Diagonal-
Textur), damit die App weiterhin komplett offline/ohne externe Bild-Datei
läuft.

So wird später ein echtes, generiertes Pizza-Foto eingebaut:

1. Bild-Datei hier in diesen Ordner legen, z. B.:
     assets/header-pizza.jpg
   (oder .webp — beides geht, JPG/WebP werden von allen Zielbrowsern
   unterstützt). Empfehlung: querformatig, mind. 1600px breit, komprimiert
   auf ein vernünftiges Datei-Gewicht (die App soll weiterhin schnell per
   file:// laden).

2. In css/styles.css EINEN Wert ändern — die CSS-Variable --header-photo
   im :root-Block (ganz oben in der Datei):

     --header-photo:none;
   wird zu
     --header-photo:url('assets/header-pizza.jpg');

   Das ist die EINZIGE nötige Änderung. Keine Struktur-/Markup-Änderung
   nötig — der Header nutzt diese Variable bereits als eigene
   background-image-Ebene (mit den Fallback-Verläufen darunter, falls das
   Bild aus irgendeinem Grund nicht lädt).

3. Kontrast gegenprüfen: Über dem Foto liegt bereits eine feste
   halbtransparente Abdunklungs-Ebene (rgba(20,9,5,.55)), die für
   ausreichenden Kontrast des weißen Header-Texts sorgen soll (WCAG 1.4.3).
   Ist das gewählte Foto sehr hell (z. B. viel weißes Mehl/heller
   Tisch im Vordergrund), diesen Wert in css/styles.css ggf. leicht
   erhöhen (z. B. .6–.65) und den Kontrast erneut prüfen.

4. ?v=-Cache-Busting auf allen <link>/<script>-Tags in pizza-rechner.html
   und pizza-rechner-mobile.html hochzählen (übliche Versionierungs-
   Konvention dieses Projekts) sowie pizza-rechner-mobile-standalone.html
   per build-mobile-standalone.py neu bauen.
