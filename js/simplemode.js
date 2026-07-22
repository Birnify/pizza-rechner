/* simplemode.js — Einfacher Modus für Presets (v3.62.0)
 *
 * Zeigt auf der Rechner-Seite standardmäßig nur die 3 wesentlichen Parameter (Anzahl
 * Teiglinge, Hefe-Art, Knetart) in EINER Karte statt der 3 vollen Karten
 * (Grundeinstellungen / Methode & Hefe / Teigtemperatur & Eiswasser). Ein Button
 * schaltet auf den vollen "Erweiterten Modus" um; die Wahl wird persistiert
 * (eigener localStorage-Key, unabhängig vom Rezept-Speicher, analog zu js/theme.js).
 *
 * Bewusst KEIN Duplizieren der 3 Feld-Elemente mit eigenen IDs + eigener State-
 * Synchronisierung: stattdessen werden die 3 bestehenden Feld-<div>s
 * (#ballsField/#yeastTypeField/#kneadField, jeweils bereits über js/ui.js an
 * PZ.state gebunden) per DOM-Reparenting (appendChild/insertBefore) zwischen ihrer
 * ursprünglichen Karte und der neuen Karte "#simpleModeFields" hin- und hergeschoben.
 * Dadurch bleibt exakt EIN DOM-Knoten je Feld die einzige Quelle der Wahrheit -- keine
 * zwei Slider/Segmente, die synchron gehalten werden müssten, kein Sonderfall beim
 * Laden von Presets/Rezepten (die weiterhin nur die bestehenden Original-IDs kennen).
 *
 * Reiner Sicht-Schalter (Nutzerwunsch, per Rückfrage bestätigt): gilt unabhängig
 * davon, ob im Preset-Dropdown gerade ein Preset oder "Eigene Einstellung" aktiv ist.
 *
 * Nur auf der Rechner-Ansicht relevant (#controlsCol dort) -- läuft harmlos als no-op,
 * falls die erwarteten Elemente fehlen (z. B. in tests/test.html, wo dieses Modul
 * bewusst NICHT geladen wird, analog zu js/nav.js/js/newrecipe.js -- reines
 * DOM-Wiring auf echtem Markup).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const SIMPLE_MODE_KEY = 'pizzaSimpleMode';

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  function readStored() {
    try { return localStorage.getItem(SIMPLE_MODE_KEY); } catch (e) { return null; }
  }
  function writeStored(isSimple) {
    try { localStorage.setItem(SIMPLE_MODE_KEY, isSimple ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  // Default: Einfacher Modus AN (neue Standardansicht) -- außer der Nutzer hat beim
  // letzten Besuch bereits explizit den erweiterten Modus gewählt.
  const stored = readStored();
  let simple = stored === '0' ? false : true;

  // Die 3 Kernfelder, die zwischen ihrer ursprünglichen Karte und der neuen
  // "Deine Einstellungen"-Karte hin- und herwandern. Originaler Elternknoten +
  // folgendes Geschwister-Element werden EINMALIG gemerkt (vor dem ersten Verschieben),
  // damit "Erweiterten Modus öffnen" jedes Feld exakt an seine ursprüngliche Stelle
  // innerhalb seiner Karte zurückstellt statt nur "irgendwo" anzuhängen.
  const FIELD_IDS = ['ballsField', 'yeastTypeField', 'kneadField'];
  let captured = null; // [{el, originalParent, originalNext}] -- null bis erstmalig erfasst

  function captureOriginalPositions() {
    captured = FIELD_IDS.map(function (id) {
      const el = document.getElementById(id);
      if (!el) return null;
      return { el: el, originalParent: el.parentNode, originalNext: el.nextElementSibling };
    }).filter(Boolean);
  }

  function moveFieldsToSimpleCard() {
    const target = document.getElementById('simpleModeFields');
    if (!target || !captured) return;
    captured.forEach(function (m) { target.appendChild(m.el); });
  }

  function moveFieldsBackToAdvanced() {
    if (!captured) return;
    captured.forEach(function (m) { m.originalParent.insertBefore(m.el, m.originalNext); });
  }

  function applyMode() {
    const col = document.getElementById('controlsCol');
    if (!col) return; // andere Ansicht (z. B. Rezepte-Seite) -- betrifft nur die Rechner-Seite
    col.classList.toggle('mode-simple', simple);
    col.classList.toggle('mode-advanced', !simple);
    if (simple) moveFieldsToSimpleCard(); else moveFieldsBackToAdvanced();
  }

  function announceMode(isSimple) {
    PZ.announce('simpleModeLiveMsg', t(isSimple ? 'simpleMode.announceSimple' : 'simpleMode.announceAdvanced'));
  }

  function setSimpleMode(v, opts) {
    const isSimple = !!v;
    simple = isSimple;
    writeStored(isSimple);
    applyMode();
    if (!opts || !opts.silent) announceMode(isSimple);
  }
  PZ.setSimpleMode = setSimpleMode;
  PZ.isSimpleMode = function () { return simple; };

  function wire() {
    if (!document.getElementById('controlsCol')) return; // Rechner-Seite nicht vorhanden
    captureOriginalPositions();
    applyMode(); // stille Erstanwendung -- kein Live-Region-Geplapper beim Laden

    // Fokus-Management (Accessibility-Härtung): der jeweils geklickte Umschalt-Button
    // verschwindet selbst per display:none (sein Container wechselt die Sichtbarkeits-
    // klasse) -- ohne aktives Umsetzen fiele der Tastatur-/Screenreader-Fokus auf
    // <body> zurück (WCAG 2.4.3 Fokus-Reihenfolge). Stattdessen wandert der Fokus auf
    // den jeweils GEGENTEILIGEN, jetzt neu sichtbaren Umschalt-Button -- bleibt im
    // etablierten "Umschalten"-Kontext, ist garantiert vorhanden und sichtbar.
    const openAdvancedBtn = document.getElementById('openAdvancedBtn');
    if (openAdvancedBtn) openAdvancedBtn.addEventListener('click', function () {
      setSimpleMode(false);
      const target = document.getElementById('openSimpleBtn');
      if (target) target.focus();
    });
    const openSimpleBtn = document.getElementById('openSimpleBtn');
    if (openSimpleBtn) openSimpleBtn.addEventListener('click', function () {
      setSimpleMode(true);
      const target = document.getElementById('openAdvancedBtn');
      if (target) target.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})(window);
