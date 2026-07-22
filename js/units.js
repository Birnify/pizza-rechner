/* units.js — Einheitensystem-Umschaltung Metrisch/Imperial (v3.65.0)
 *
 * Reine Anzeige-/Formatierungsschicht, analog zum Dunkelmodus-Muster in js/theme.js:
 * folgt standardmäßig einer automatischen Erkennung (hier: Browser-Region statt
 * Farbschema-Präferenz), bis der Nutzer den manuellen Umschalter in den Einstellungen
 * betätigt — danach übersteuert die manuelle Wahl die Erkennung dauerhaft (eigener
 * localStorage-Key "pizzaUnits", "noch nie manuell gewählt" ist von "explizit gewählt"
 * unterscheidbar, exakt wie bei js/theme.js/js/i18n.js).
 *
 * WICHTIG (Scope, per Nutzervorgabe): NUR Anzeige/Ausgabe wird umgerechnet (Ergebnis-
 * Panel, Einkaufsliste, Anleitungstext, PDF-Export, da PDF/Druck den bereits gerenderten
 * DOM-Text übernehmen). ALLE Eingabe-Regler (Teigling-Gewicht, Raumtemperatur,
 * Mehltemperatur, Ziel-Teigtemperatur/DDT) bleiben intern unverändert in Gramm/Celsius
 * mit ihren bestehenden Wertebereichen/Schrittweiten — dieses Modul rührt weder
 * PZ.state noch js/calc.js/js/schedule.js/js/widgets.js/Presets/Storage an. Bäckerprozente
 * (Hydration, Salz, Hefe, Öl, Zucker) bleiben unverändert einheitenlos.
 *
 * Auto-Erkennung: NUR bei Browser-Region "en-US" gilt Imperial als Default, alle
 * anderen Sprachen/Regionen (inkl. en-GB) bleiben Metrisch — unabhängig von der
 * bestehenden DE/EN-Sprachauswahl der App (js/i18n.js), das ist eine eigenständige,
 * zweite Weiche auf Basis derselben Browser-Angabe (navigator.language).
 *
 * Rundung: Gewichte auf 0,1 oz (ab 16 oz zusätzlich in "X lb Y oz" umgebrochen, sonst
 * "X oz" — beides in der Nutzervorgabe als Beispielformate genannt, hier so entschieden:
 * kleine Zutatenmengen bleiben reine Unzen, das Gesamtgewicht/größere Mengen bekommen
 * die vertrautere Pfund-Schreibweise). Temperaturen auf ganze °F.
 *
 * Bewusst NICHT umgerechnet (Abgrenzung, s. Kontext-Datei): statische Referenztexte ohne
 * Bezug zu einem konkreten Rechenergebnis (Ofentemperatur-Richtwerte, Kühlschrank-
 * Lagerbereiche in den Gärzeit-Texten, Glossar-Inhalte) — nur Werte, die direkt aus
 * PZ.R (Rechenergebnis) oder den unmittelbar davon abgeleiteten Anleitungs-/
 * Ergebnis-Panel-Ausgaben stammen.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const UNITS_KEY = 'pizzaUnits';

  function readStoredUnits() {
    try { return localStorage.getItem(UNITS_KEY); } catch (e) { return null; }
  }
  function writeStoredUnits(units) {
    try { localStorage.setItem(UNITS_KEY, units); } catch (e) { /* ignore */ }
  }

  function systemPrefersImperial() {
    const loc = global.navigator && (global.navigator.language ||
      (global.navigator.languages && global.navigator.languages[0])) || '';
    return /^en-us$/i.test(loc);
  }

  // Reine Entscheidungsfunktion (kein DOM/localStorage-Zugriff) — für Tests exponiert,
  // analog zu PZ._resolveInitialTheme in js/theme.js: gespeicherte manuelle Wahl gewinnt
  // immer, nur ein leerer/unbekannter Wert fällt auf die Regions-Erkennung zurück.
  function resolveInitialUnits(stored, prefersImperial) {
    if (stored === 'metric' || stored === 'imperial') return stored;
    return prefersImperial ? 'imperial' : 'metric';
  }
  PZ._resolveInitialUnits = resolveInitialUnits;

  let currentUnits = resolveInitialUnits(readStoredUnits(), systemPrefersImperial());
  let manualOverride = readStoredUnits() === 'metric' || readStoredUnits() === 'imperial';

  function getUnitSystem() { return currentUnits; }
  PZ.getUnitSystem = getUnitSystem;

  // ======================================================================
  // Re-Render-Hooks (analog zu PZ.i18nOnChange in js/i18n.js): js/calc.js registriert
  // sich hier, damit nach einem Umschaltvorgang Ergebnis-Panel + Anleitung neu mit der
  // jeweils anderen Einheit gerendert werden.
  // ======================================================================
  const rerenderHooks = [];
  function onUnitsChange(fn) { if (typeof fn === 'function') rerenderHooks.push(fn); }
  PZ.unitsOnChange = onUnitsChange;

  function applyUnits(units) {
    currentUnits = units;
    rerenderHooks.forEach(function (fn) {
      try { fn(); } catch (e) { /* ein defektes Modul darf die übrigen nicht blockieren */ }
    });
  }

  // Manuelle Wahl: persistiert dauerhaft, übersteuert ab jetzt die Regions-Erkennung.
  function setUnitSystem(units) {
    if (units !== 'metric' && units !== 'imperial') return;
    manualOverride = true;
    writeStoredUnits(units);
    applyUnits(units);
    reflectSwitch();
  }
  PZ.setUnitSystem = setUnitSystem;

  // ======================================================================
  // Umrechnung/Formatierung — Grundlage für alle Anzeige-Stellen (calc.js/guide.js/
  // print.js). Rückgabe ist immer der KOMPLETTE Anzeigetext inkl. Einheit (z. B.
  // "600 g" bzw. "21.2 oz") — die aufrufenden Module/das HTML halten dafür keine
  // eigene(n) statische(n) Einheiten-Suffixe mehr vor.
  // ======================================================================
  const GRAMS_PER_OZ = 28.349523125;
  const OZ_PER_LB = 16;

  function formatOzNumber(oz) { return oz.toFixed(1); }

  function formatImperialWeight(grams) {
    let oz = Math.round((grams / GRAMS_PER_OZ) * 10) / 10;
    if (oz < 0) oz = 0;
    if (oz < OZ_PER_LB) return formatOzNumber(oz) + ' oz';
    let lb = Math.floor(oz / OZ_PER_LB + 1e-9);
    let remOz = Math.round((oz - lb * OZ_PER_LB) * 10) / 10;
    if (remOz >= OZ_PER_LB) { remOz -= OZ_PER_LB; lb += 1; }
    return lb + ' lb ' + formatOzNumber(remOz) + ' oz';
  }
  PZ._formatImperialWeight = formatImperialWeight; // für gezielte Tests exponiert

  // Metrische Rundung frei wählbar (deckt die bisherigen, je Anzeigestelle
  // unterschiedlichen Konventionen ab: 0 Nachkommastellen für Mehl/Wasser/Eis,
  // 1 für Salz/Öl/Zucker) — im Imperial-Modus gilt unabhängig davon immer die
  // 0,1-oz-Rundung, hier gibt es keine Sonderfälle je Zutat.
  function formatWeight(grams, metricDecimals) {
    if (getUnitSystem() === 'imperial') return formatImperialWeight(grams);
    const d = metricDecimals == null ? 0 : metricDecimals;
    const val = d > 0 ? grams.toFixed(d) : String(Math.round(grams));
    return val + ' g';
  }
  PZ.formatWeight = formatWeight;

  // Das bisherige, in js/guide.js und js/print.js (Hefe-Zeile) etablierte Rundungs-
  // muster für "kleine Mengen genauer" (< 10 g → 2 Nachkommastellen, sonst ganzzahlig
  // gerundet) — im Imperial-Modus identisch zu formatWeight() (die 0,1-oz-Rundung
  // deckt kleine Mengen bereits ausreichend genau ab, kein weiterer Sonderfall nötig).
  function formatWeightAuto(grams) {
    if (getUnitSystem() === 'imperial') return formatImperialWeight(grams);
    const val = grams < 10 ? grams.toFixed(2) : String(Math.round(grams));
    return val + ' g';
  }
  PZ.formatWeightAuto = formatWeightAuto;

  // Temperatur: der übergebene Celsius-Wert ist bereits vom Aufrufer wie gewünscht
  // gerundet (z. B. R.wT auf 1 Nachkommastelle in js/calc.js) — im Metrisch-Modus wird
  // hier nur die Einheit angehängt, keine erneute Rundung. Im Imperial-Modus gilt die
  // Vorgabe "Rundung auf ganze °F".
  function formatTemp(celsius) {
    if (getUnitSystem() === 'imperial') {
      return Math.round(celsius * 9 / 5 + 32) + '°F';
    }
    return celsius + '°C';
  }
  PZ.formatTemp = formatTemp;

  // ======================================================================
  // Umschalter in den Einstellungen (#unitSwitch, .seg-Muster mit zwei Buttons
  // "Metrisch"/"Imperial", identisch zum bestehenden #themeSwitch-Muster).
  // ======================================================================
  function reflectSwitch() {
    const wrap = document.getElementById('unitSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-units-choice]'));
    btns.forEach(function (b) {
      const on = b.getAttribute('data-units-choice') === currentUnits;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // Live-Region-Ansage über den gemeinsamen Helfer PZ.announce() (js/dom.js,
  // Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort) — identisches Muster
  // wie announceThemeChange()/announceLangChange().
  function announceUnitsChange(units) {
    const t = PZ.t ? PZ.t : function (k) { return k; };
    const unitsName = t(units === 'imperial' ? 'units.imperial' : 'units.metric');
    PZ.announce('unitsAnnounce', t('units.announce', { units: unitsName }));
  }

  function wireUnitsSwitch() {
    const wrap = document.getElementById('unitSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-units-choice]'));
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        const units = b.getAttribute('data-units-choice');
        setUnitSystem(units);
        announceUnitsChange(units);
      });
    });
    reflectSwitch();
  }

  // Läuft die Datei in einer Umgebung ohne das übrige Markup (z. B. tests/test.html),
  // findet wireUnitsSwitch() einfach keine Elemente — kein Fehler, no-op.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUnitsSwitch);
  } else {
    wireUnitsSwitch();
  }
})(window);
