/* images.js — Bild-Register (v4.32.0, "Bild-Grundgerüst plus bebildertes Preset-
   Kartengitter"), Schicht 2+3 aus BILD-EINBAU-KONZEPT.md.

   Diese Datei ist die EINZIGE Stelle im gesamten Code, die Bild-Dateinamen kennt. Kein
   anderes Modul und keine HTML-Datei enthält je wieder einen Dateinamen — genau die
   Streuung fester Pfade (js/guide.js FINAL_PHOTO) hat den Bugfix nötig gemacht, der diesen
   Zyklus ausgelöst hat (drei Fotos zeigten nach einer Ordner-Umbenennung ins Leere).

   PZ.img(key)  liefert den Registereintrag oder null (unbekannter Key, als "pending"
                markiertes noch fehlendes Bild, oder — im Standalone-Build fürs iPhone —
                ein Bild, das dort bewusst nicht eingebettet wurde, s. PZ._IMG_INLINE unten).
   PZ.imgHtml(key, opts) liefert dafür fertiges Markup (Schicht 3, EIN Baustein für alle
                Bildkategorien) oder '', wenn PZ.img(key) null ist. Aufrufer rendern in dem
                Fall schlicht nichts — kein kaputtes Bild, kein leerer Rahmen. */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // file ist relativ zu assets/img/ (s. DIR unten). ratio muss zu einer .media--<ratio>-
  // CSS-Klasse passen (css/styles.css) UND zu einem RATIOS-Eintrag in
  // design-import/components/media/Media.jsx (Referenz-Spezifikation, kein App-Code).
  // alt:null = dekorativ (alt=""), sonst ein i18n-Key (js/i18n-dict.js) für einen
  // beschreibenden Alt-Text. w/h = tatsächliche Pixelmaße der (ggf. per
  // assets/prepare_web_images.py aufbereiteten) Datei, fürs <img width/height> --
  // verhindert Layout-Sprung beim Nachladen zusätzlich zur aspect-ratio-Box aus CSS.
  // pending:true markiert ein noch nicht abgenommenes Bild (aktuell keins in diesem Zyklus).
  const IMG = {
    'preset.napoli_klassisch': { file: 'card-napoli_klassisch.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.napoli_kalt': { file: 'card-napoli_kalt.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.schnell': { file: 'card-schnell.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    // Biga-/Poolish-Presets teilen sich je EIN Bild zwischen ihrer klassischen/schnellen
    // und ihrer kalten Variante (s. BILD-EINBAU-KONZEPT.md-Auftrag): beide Varianten sind
    // derselbe Teig, unterscheiden sich nur im Gärregime (Zeit/Temperatur), nicht im
    // Erscheinungsbild der fertigen Pizza — ein zweites, nahezu identisches Fotomotiv wäre
    // kein zusätzlicher Informationswert gewesen. Damit sind alle 9 Presets bebildert statt
    // 7 von 9.
    'preset.napoli_biga_klassisch': { file: 'card-napoli_biga.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.napoli_biga_kalt': { file: 'card-napoli_biga.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.napoli_poolish_schnell': { file: 'card-napoli_poolish.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.napoli_poolish_kalt': { file: 'card-napoli_poolish.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.teglia': { file: 'card-teglia.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    'preset.newyork_style': { file: 'card-newyork_style.webp', ratio: '3x2', alt: null, w: 600, h: 400 },
    // Foto der fertigen Pizza (Anleitungsende, js/guide.js) — hier TRÄGT das Bild eigene
    // Information (Krustenform), die der umgebende Anleitungstext ("Fertig!") nicht sagt,
    // deshalb ein beschreibender Alt-Text statt alt:null (s. Kommentar in js/guide.js).
    'guide.final.napoli': { file: 'pizza-final-neapolitanisch.jpg', ratio: '16x9', alt: 'guide.step.finalPhoto.alt.napoli', w: 960, h: 540 },
    'guide.final.teglia': { file: 'pizza-final-teglia.jpg', ratio: '16x9', alt: 'guide.step.finalPhoto.alt.teglia', w: 960, h: 540 },
    'guide.final.newyork': { file: 'pizza-final-newyork.jpg', ratio: '16x9', alt: 'guide.step.finalPhoto.alt.newyork', w: 960, h: 540 },
    // Seiten-Hintergrund-Textur (v4.34.0, "Geblurrte Textur als Seitenhintergrund"): kein
    // <img>, sondern CSS background-image auf dem --bg-gradient-Token (s. Kommentar
    // "Seiten-Hintergrund-Textur" unten). ratio/alt bleiben trotzdem im Register gepflegt
    // (konsistente Eintragsform, auch wenn imgHtml() hier nie aufgerufen wird) --
    // dekorativ (alt:null), da die Textur reine Farbstimmung ist, keine eigene Information
    // traegt. w/h = tatsaechliche Pixelmasse NACH assets/prepare_web_images.py (800x800,
    // Gaussian-Blur 120px bereits in der Datei gebacken -- kein CSS filter noetig).
    // v4.34.1: texture-teighaut.webp (Hell) durch texture-marmor.webp ersetzt -- bei
    // vergleichbarer WCAG-Marge deutlich mehr Alpha-Spielraum (0,070 -> 0,190), s.
    // Kontextdatei. texture-kruste.webp (Dunkel) bleibt die Datei, bekommt aber eine
    // Lichter-Kompression VOR der Alpha-Ebene (assets/prepare_web_images.py), moderater
    // Alpha-Gewinn (0,110 -> 0,150).
    'bg.texture.light': { file: 'texture-marmor.webp', ratio: '1x1', alt: null, w: 800, h: 800 },
    'bg.texture.dark': { file: 'texture-kruste.webp', ratio: '1x1', alt: null, w: 800, h: 800 }
  };

  const DIR = 'assets/img/';

  // Standalone-Build fürs iPhone (build-mobile-standalone.py): bettet bewusst nur eine
  // kleine Auswahl Bilder als base64 ein (s. BILD-EINBAU-KONZEPT.md Abschnitt 4) statt aller
  // ~18 MB — der Rest würde beim Öffnen der Einzeldatei von iCloud Drive per file:// ohnehin
  // nicht nachladen (iOS blockiert das Laden von Geschwister-Dateien, s. Kommentar in
  // build-mobile-standalone.py). Das Build-Skript hängt dafür NACH dem Inlinen von
  // js/images.js einen kleinen zusätzlichen <script>-Block an, der window.PZ._IMG_INLINE
  // mit { dateiname: 'data:...' } befüllt. Ist ein Dateiname dort NICHT enthalten, behandelt
  // img() ihn wie ein fehlendes Bild (liefert null) — dieselbe "kein Bild statt kaputtes
  // Bild"-Regel gilt also auch für die Standalone-Datei, nicht nur für echte Lücken im
  // Bildbestand. Ganz normale Web-Deployments (pizza-rechner.html / -mobile.html) haben
  // PZ._IMG_INLINE nie gesetzt, dort greift immer der normale assets/img/-Pfad.
  function img(key) {
    const e = IMG[key];
    if (!e || e.pending) return null;
    if (PZ._IMG_INLINE && !PZ._IMG_INLINE[e.file]) return null;
    return e;
  }

  function resolveSrc(file) {
    return (PZ._IMG_INLINE && PZ._IMG_INLINE[file]) || (DIR + file);
  }

  // PZ.imgHtml(key, opts): der EINE Markup-Baustein für alle Bildkategorien (Schicht 3).
  // opts.eager: sofort laden statt loading="lazy" (nur Header/Hero, hier noch ungenutzt).
  // opts.extraClass: zusätzliche CSS-Klasse auf dem äußeren <span> (z. B. "final-photo" für
  // eine seitenspezifische Zusatzregel wie max-width, s. css/styles.css).
  function imgHtml(key, opts) {
    opts = opts || {};
    const e = img(key);
    if (!e) return '';
    const altText = e.alt ? (PZ.t ? PZ.t(e.alt) : e.alt) : '';
    const cls = 'media media--' + e.ratio + (opts.extraClass ? ' ' + opts.extraClass : '');
    const dims = (e.w && e.h) ? ` width="${e.w}" height="${e.h}"` : '';
    const loading = opts.eager ? 'eager' : 'lazy';
    return `<span class="${cls}"><img src="${resolveSrc(e.file)}" alt="${altText}"${dims} loading="${loading}" decoding="async"></span>`;
  }

  // Statische HTML-Platzhalter <span data-img-key="…"></span> (z. B. das Preset-
  // Kartengitter in pizza-rechner.html/-mobile.html) werden hier durch das echte Markup aus
  // imgHtml() ersetzt bzw. entfernt, wenn kein Bild verfügbar ist. Läuft einmalig beim Laden
  // dieses Moduls: alle Scripts liegen am Ende von <body> (s. Ladereihenfolge in
  // pizza-rechner-KONTEXT.md), das übrige HTML-Markup steht zu diesem Zeitpunkt bereits
  // vollständig im DOM. `data-img-eager`/`data-img-class` sind optionale Attribute für
  // Fälle, die opts.eager/opts.extraClass brauchen -- z. B. das Preset-Kartengitter
  // (`data-img-eager`, steht immer oberhalb der Falz statt nachgeladen zu werden).
  //
  // WICHTIG für Standalone-Builds (s. build-mobile-standalone.py): dieser Aufruf läuft
  // SYNCHRON beim Laden dieses Moduls. Ein Build-Skript, das PZ._IMG_INLINE per separatem,
  // SPÄTER im Dokument stehendem <script>-Block setzt, kommt damit zu spät -- die Zuweisung
  // MUSS vor diesem Modul-Code stehen (s. ausführlicher Kommentar + Bugfix in
  // build-mobile-standalone.py).
  function hydrateImages(root) {
    (root || document).querySelectorAll('[data-img-key]').forEach(function (el) {
      const key = el.getAttribute('data-img-key');
      const html = imgHtml(key, {
        eager: el.hasAttribute('data-img-eager'),
        extraClass: el.getAttribute('data-img-class') || ''
      });
      if (html) el.outerHTML = html; else el.remove();
    });
  }

  // Seiten-Hintergrund-Textur (v4.34.0): css/styles.css braucht den Dateipfad NICHT als
  // <img>-Tag, sondern als CSS-Wert fuer background-image (Teil des --bg-gradient-Tokens).
  // PZ.imgCssUrl(key) liefert dafuer ein fertiges url("...")-Fragment (inkl. Standalone-
  // Build-Aufloesung ueber resolveSrc(), identisch zu imgHtml()) oder '' wenn PZ.img(key)
  // null ist (unbekannt/pending/im Standalone-Build nicht eingebettet) -- der Aufrufer setzt
  // das Ergebnis als Wert einer CSS-Custom-Property, css/styles.css haelt den Fallback
  // (var(--bg-photo-*, none)), falls das Modul aus irgendeinem Grund nicht laeuft (z. B.
  // in tests/test.html, wo <html> kein document.documentElement-Zugriff auf echtes CSS hat).
  //
  // WICHTIG (per Live-Test gefunden, v4.34.0): ein relativer Pfad wie "assets/img/x.webp"
  // als Wert einer per JS gesetzten CSS-Custom-Property wird NICHT relativ zur Seite
  // aufgeloest, sondern relativ zu der Stylesheet-Datei, in der der spaetere var(...)-
  // Gebrauch steht (hier css/styles.css) -- das ergaebe "css/assets/img/x.webp" und damit
  // ein kaputtes Bild. Deshalb hier IMMER in eine absolute URL ueber document.baseURI
  // aufloesen (funktioniert identisch unter http(s):// wie unter file://, s. "Warum keine
  // KI / kein Internet" in pizza-rechner-KONTEXT.md -- die App laeuft auch per
  // Doppelklick ohne Server). data:-URIs (Standalone-Build) sind bereits absolut und
  // werden unveraendert durchgereicht.
  function imgCssUrl(key) {
    const e = img(key);
    if (!e) return '';
    const src = resolveSrc(e.file);
    const abs = /^data:/.test(src) ? src : new URL(src, document.baseURI).href;
    return `url("${abs}")`;
  }

  // Setzt die beiden Rohpfad-Variablen einmalig beim Laden dieses Moduls (Register-Inhalt
  // aendert sich nie zur Laufzeit) -- welche der beiden CSS tatsaechlich anzeigt, entscheidet
  // ausschliesslich css/styles.css ueber :root[data-theme="dark"] (identisches Muster wie
  // --bg-gradient selbst), dieses Modul kennt "hell/dunkel" bewusst nicht.
  function applyBgPhotoVars() {
    const root = document.documentElement;
    if (!root || !root.style) return; // Testumgebungen ohne echtes <html> ueberspringen das
    root.style.setProperty('--bg-photo-light', imgCssUrl('bg.texture.light'));
    root.style.setProperty('--bg-photo-dark', imgCssUrl('bg.texture.dark'));
  }

  PZ.IMG = IMG;
  PZ.img = img;
  PZ.imgHtml = imgHtml;
  PZ.imgCssUrl = imgCssUrl;
  PZ.hydrateImages = hydrateImages;

  hydrateImages(document);
  applyBgPhotoVars();
})(window);
