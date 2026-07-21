/* i18n.js — Deutsch/Englisch-Sprachversion (v3.28.0, Laufzeit-Engine seit v3.55.0
 * von den Wörterbuch-Inhalten getrennt, s. js/i18n-dict.js)
 *
 * Deckt die KOMPLETTE Oberfläche ab: statische HTML-Texte (Labels, Buttons, Hinweise),
 * die generierte Schritt-für-Schritt-Anleitung (js/guide.js, js/schedule.js), den
 * PDF-Export (js/pdf.js), die Druckansicht/Einkaufsliste (js/print.js), den
 * .ics-Kalendertext (js/timer.js) sowie die Pizza-Party-Presets (js/party.js). Deutsch
 * bleibt Standard/Fallback, nur Deutsch/Englisch (kein weiteres Sprachenmenü).
 *
 * Architektur: ein zentrales Wörterbuch { de: {...}, en: {...} }, flach mit
 * punktnotierten Keys (z. B. "label.hyd"). PZ.t(key, vars) liefert den Text der
 * aktuell aktiven Sprache, interpoliert {platzhalter} in vars, fällt bei fehlendem
 * Key in der Zielsprache auf Deutsch zurück, und als allerletzten Rückfall auf den
 * Key selbst (kein Crash, kein leerer Text). Statische HTML-Texte werden per
 * data-i18n(-html|-attr)-Attribut deklarativ verdrahtet (applyStaticI18n()); alle
 * generierten/dynamischen Texte (guide.js, pdf.js, print.js, timer.js, party.js,
 * presets.js, ui.js, newrecipe.js, flour.js, main.js, share.js) rufen PZ.t() direkt auf.
 *
 * Sprachwahl (Feature-Auftrag): automatische Vorauswahl per navigator.language beim
 * ersten Aufruf (de/at/ch-Locales -> Deutsch, sonst Englisch), plus manueller Umschalter
 * in den Einstellungen, der die Automatik übersteuert und in localStorage persistiert
 * (eigener Key "pizzaLang", analog zu den bestehenden Feature-Flags in js/settings.js,
 * aber bewusst NICHT im selben Objekt/Key — Sprachwahl ist kein Ein/Aus-Flag und hat
 * eine eigene Persistenz-Semantik: "noch nie manuell gewählt" muss von "explizit auf
 * Deutsch gewählt" unterscheidbar bleiben, damit Auto-Erkennung nur beim ALLERERSTEN
 * Aufruf greift).
 *
 * WÖRTERBUCH-INHALT SEIT v3.55.0 AUSGELAGERT (js/i18n-dict.js, lädt VOR dieser Datei,
 * s. <script>-Reihenfolge in pizza-rechner.html/pizza-rechner-mobile.html): diese Datei
 * übernimmt das dort bereits befüllte DICT über PZ._I18N_DICT, statt selbst ein leeres
 * anzulegen. `add()`/`PZ._i18nAdd` bleiben hier definiert und werden weiterhin exportiert
 * — als Hook für Module, die NACH dieser Datei laden und eigene Einträge nachreichen
 * wollen (bisher ungenutzt, bleibt für künftige Erweiterungen verfügbar).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const LANG_KEY = 'pizzaLang';

  // ======================================================================
  // Wörterbuch — Inhalt kommt aus js/i18n-dict.js (muss vorher geladen sein), mit
  // defensivem leerem Fallback, falls diese Datei mal isoliert läuft (z. B. künftiger
  // Testaufbau ohne i18n-dict.js).
  // ======================================================================
  const DICT = PZ._I18N_DICT || { de: {}, en: {} };

  // Kleiner Helfer fürs Befüllen: erspart bei jedem einzelnen Eintrag "DICT.de[...] =".
  // Bleibt als PZ._i18nAdd-Hook exportiert (s. Datei-Kommentar oben).
  function add(key, de, en) {
    DICT.de[key] = de;
    DICT.en[key] = en;
  }

  PZ._I18N_DICT = DICT; // für weitere Module (guide.js etc.) zum Ergänzen via PZ._i18nAdd()
  PZ._i18nAdd = add;

  // ======================================================================
  // Sprachwahl: Erkennung + Persistenz
  // ======================================================================

  // de/at/ch-Locale-Codes (z. B. "de", "de-DE", "de-AT", "de-CH") -> Deutsch, alles
  // andere (inkl. unbekannt/nicht gesetzt) -> Englisch. Deutsch bleibt aber der
  // Programm-Fallback für fehlende Übersetzungsschlüssel, unabhängig von dieser Wahl.
  function detectLang() {
    const nav = (global.navigator && (global.navigator.language || global.navigator.userLanguage)) || 'de';
    return String(nav).toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }

  function readStoredLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function writeStoredLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  // Manuelle Wahl (falls vorhanden) hat Vorrang vor der Auto-Erkennung — nur beim
  // ALLERERSTEN Aufruf (noch kein Key in localStorage) greift navigator.language.
  let currentLang = readStoredLang();
  if (currentLang !== 'de' && currentLang !== 'en') currentLang = detectLang();

  function getLang() { return currentLang; }

  function t(key, vars) {
    const dict = DICT[currentLang] || DICT.de;
    let str = dict[key];
    if (str == null) str = DICT.de[key];   // Fallback: Deutsch (Programm-Standard)
    if (str == null) return key;            // Letzter Rückfall: der Key selbst (kein Crash)
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.split('{' + k + '}').join(vars[k] == null ? '' : vars[k]);
      });
    }
    return str;
  }

  // ======================================================================
  // Statische HTML-Texte (data-i18n / data-i18n-html / data-i18n-attr)
  // ======================================================================
  // - data-i18n="key"            -> el.textContent = t(key)
  // - data-i18n-html="key"       -> el.innerHTML = t(key)   (nur für Keys mit erlaubtem,
  //                                  fest hinterlegtem Markup wie <b>/<br> — nie mit
  //                                  Nutzereingaben kombiniert)
  // - data-i18n-attr="attr1:key1,attr2:key2" -> setzt beliebig viele Attribute (z. B.
  //                                  aria-label, placeholder, title)
  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        const idx = pair.indexOf(':');
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.setAttribute('lang', currentLang);
  }

  // Nach einem Sprachwechsel müssen auch alle dynamisch/reaktiv erzeugten Bereiche neu
  // gerendert werden (Anleitung, Ergebnis-Panel-Beschriftungen, Party-Liste, Vorteig-
  // Reife-Pills, Zeitplan-Label, Mehl-Dropdown, Presets-Beschreibung) — jedes Modul
  // registriert dafür optional eine Re-Render-Funktion statt hart in i18n.js verdrahtet
  // zu sein (lose Kopplung, jedes Modul bleibt für sein eigenes Rendering zuständig).
  const rerenderHooks = [];
  function onLangChange(fn) { if (typeof fn === 'function') rerenderHooks.push(fn); }

  function setLang(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    currentLang = lang;
    writeStoredLang(lang);
    applyStaticI18n();
    rerenderHooks.forEach(function (fn) {
      try { fn(); } catch (e) { /* ein defektes Modul darf die übrigen nicht blockieren */ }
    });
  }

  PZ.t = t;
  PZ.getLang = getLang;
  PZ.setLang = setLang;
  PZ.i18nOnChange = onLangChange;
  PZ.i18nApplyStatic = applyStaticI18n;

  // ======================================================================
  // Sprach-Umschalter in den Einstellungen (#langSwitch, ein .seg-Element mit
  // zwei Buttons "Deutsch"/"Englisch", identisches Markup auf Desktop + Mobil).
  // Kein Bestandteil des Ein/Aus-Feature-Flag-Systems (js/settings.js) — eigene,
  // simple Verdrahtung hier direkt im Sprachmodul.
  // ======================================================================
  function wireLangSwitch() {
    const wrap = document.getElementById('langSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-lang]'));
    function reflect() {
      btns.forEach(function (b) {
        const on = b.getAttribute('data-lang') === currentLang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    // Live-Region-Ansage seit v3.58.0 über den gemeinsamen Helfer PZ.announce()
    // (js/dom.js, Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort).
    // Nebenbefund beim Konsolidieren gefunden: diese Stelle hatte VORHER keinen
    // Generation-Zähler (anders als die meisten übrigen Live-Region-Stellen) — bei
    // zwei schnellen Sprachwechseln hintereinander hätte der ältere, verzögerte
    // setTimeout die neuere Ansage überschreiben können. Die Migration auf
    // PZ.announce() behebt das automatisch mit, da der Helfer den Zähler immer hat.
    function announceLangChange(lang) {
      const langName = t(lang === 'de' ? 'lang.german' : 'lang.english');
      PZ.announce('langAnnounce', t('lang.announce', { lang: langName }));
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        const lang = b.getAttribute('data-lang');
        setLang(lang);
        reflect();
        announceLangChange(lang);
      });
    });
    reflect();
    onLangChange(reflect);
  }

  // Läuft die Datei in einer Umgebung ohne das übrige Markup (z. B. tests/test.html),
  // findet applyStaticI18n()/wireLangSwitch() einfach keine Elemente — kein Fehler, no-op.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyStaticI18n(); wireLangSwitch(); });
  } else {
    applyStaticI18n();
    wireLangSwitch();
  }
})(window);
