/* theme.js — Dunkelmodus (v3.47.0)
 *
 * Folgt standardmäßig der Systemeinstellung (prefers-color-scheme), bis der Nutzer den
 * manuellen Umschalter in den Einstellungen betätigt — danach übersteuert die manuelle
 * Wahl die Systemeinstellung dauerhaft (identisches Persistenz-Muster wie die Sprachwahl
 * in js/i18n.js: eigener localStorage-Key "pizzaTheme", "noch nie manuell gewählt" ist von
 * "explizit gewählt" unterscheidbar — nur wenn NICHTS gespeichert ist, greift die
 * Systemerkennung).
 *
 * Die FRÜHE Anwendung (vor dem ersten Bildaufbau, damit kein Hell/Dunkel-Flash beim Laden
 * auftritt) passiert NICHT hier, sondern über ein kleines Inline-Script ganz am Anfang des
 * <head> in beiden HTML-Dateien (pizza-rechner.html, pizza-rechner-mobile.html) — dieses
 * Modul hier läuft wie alle anderen Skripte erst am Ende von <body> und übernimmt den dort
 * bereits gesetzten data-theme-Wert von <html> als Ausgangspunkt (keine zweite, potenziell
 * abweichende Erkennungslogik). Zuständig für: (1) den manuellen Umschalter in den
 * Einstellungen (#themeSwitch, identisches .seg-Muster wie #langSwitch), (2) Live-
 * Mitverfolgen der Systemeinstellung, SOLANGE noch keine manuelle Wahl gespeichert ist
 * (z. B. wenn der Nutzer während einer laufenden Session das System-Theme wechselt).
 *
 * Farbwerte selbst stehen NICHT hier, sondern in css/styles.css (:root[data-theme="dark"])
 * — dieses Modul setzt nur das data-theme-Attribut auf <html>, CSS erledigt den Rest.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const THEME_KEY = 'pizzaTheme';

  function readStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function writeStoredTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  function systemPrefersDark() {
    return !!(global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  // Reine Entscheidungsfunktion (kein DOM/localStorage-Zugriff) — für Tests exponiert,
  // analog zu PZ._mergeFlags in js/settings.js: gespeicherte manuelle Wahl gewinnt immer,
  // nur ein leerer/unbekannter Wert fällt auf die Systemerkennung zurück.
  function resolveInitialTheme(stored, prefersDark) {
    if (stored === 'light' || stored === 'dark') return stored;
    return prefersDark ? 'dark' : 'light';
  }
  PZ._resolveInitialTheme = resolveInitialTheme;

  // Übernimmt den bereits im <head>-Inline-Script gesetzten Wert als Startpunkt --
  // vermeidet, dieselbe Erkennung zweimal (potenziell abweichend) zu implementieren. Läuft
  // dieses Modul mal ohne das Inline-Script (z. B. testweise eingebunden), greift derselbe
  // resolveInitialTheme()-Fallback wie im Kopf-Script.
  const initialAttr = document.documentElement.getAttribute('data-theme');
  let currentTheme = (initialAttr === 'light' || initialAttr === 'dark')
    ? initialAttr
    : resolveInitialTheme(readStoredTheme(), systemPrefersDark());
  let manualOverride = readStoredTheme() === 'light' || readStoredTheme() === 'dark';

  // theme-color-Meta-Tag (nur pizza-rechner-mobile.html hat dieses <meta>, der Desktop-
  // Seite fehlt es bewusst — s. pizza-rechner.html <head>): steuert bei mobilen Browsern
  // (v. a. Android Chrome/Edge) die Färbung von Status-/Adressleiste. War bisher statisch
  // auf die helle Marken-Terrakotta-Farbe gesetzt und blieb das auch im Dunkelmodus, obwohl
  // der restliche Bildschirm dann überwiegend sehr dunkel ist (Nebenbefund aus dem
  // v3.47.0-Accessibility-Audit). Werte hier bewusst identisch zu --tomato (hell) bzw.
  // --bg im Dunkelmodus (s. css/styles.css :root[data-theme="dark"]) — MUSS bei einer
  // künftigen Änderung dieser beiden CSS-Werte von Hand mitgezogen werden, da der Browser
  // nur das Meta-Attribut liest, keine berechneten Styles.
  // v4.0.0 (Design-Import Zyklus 1): auf die neuen Token-Werte mitgezogen.
  const THEME_COLOR = { light: '#c4472e', dark: '#151312' };
  function applyThemeColorMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme] || THEME_COLOR.light);
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    applyThemeColorMeta(theme);
  }
  // Erstanwendung nicht überspringen, falls das Inline-Script aus irgendeinem Grund fehlte.
  applyTheme(currentTheme);

  function getTheme() { return currentTheme; }
  PZ.getTheme = getTheme;

  // Manuelle Wahl: persistiert dauerhaft, übersteuert ab jetzt die Systemeinstellung.
  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    manualOverride = true;
    writeStoredTheme(theme);
    applyTheme(theme);
    reflectSwitch();
  }
  PZ.setTheme = setTheme;

  // Solange noch keine manuelle Wahl getroffen wurde: live der Systemeinstellung folgen.
  if (global.matchMedia) {
    const mq = global.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = function (e) {
      if (manualOverride) return;
      applyTheme(e.matches ? 'dark' : 'light');
      reflectSwitch();
    };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange); // Safari < 14 Fallback
  }

  // ======================================================================
  // Umschalter in den Einstellungen (#themeSwitch, .seg-Muster mit zwei Buttons
  // "Hell"/"Dunkel", identisch zum bestehenden #langSwitch-Muster in js/i18n.js).
  // ======================================================================
  function reflectSwitch() {
    const wrap = document.getElementById('themeSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-theme-choice]'));
    btns.forEach(function (b) {
      const on = b.getAttribute('data-theme-choice') === currentTheme;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // Live-Region-Ansage seit v3.58.0 über den gemeinsamen Helfer PZ.announce()
  // (js/dom.js, Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort).
  function announceThemeChange(theme) {
    const t = PZ.t ? PZ.t : function (k) { return k; };
    const themeName = t(theme === 'dark' ? 'theme.dark' : 'theme.light');
    PZ.announce('themeAnnounce', t('theme.announce', { theme: themeName }));
  }

  function wireThemeSwitch() {
    const wrap = document.getElementById('themeSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-theme-choice]'));
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        const theme = b.getAttribute('data-theme-choice');
        setTheme(theme);
        announceThemeChange(theme);
      });
    });
    reflectSwitch();
  }

  // Läuft die Datei in einer Umgebung ohne das übrige Markup (z. B. tests/test.html),
  // findet wireThemeSwitch() einfach keine Elemente — kein Fehler, no-op.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireThemeSwitch);
  } else {
    wireThemeSwitch();
  }
})(window);
