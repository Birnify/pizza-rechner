/* store.js — Speicher-Zwischenschicht (Play-Store-Vorbereitung, Punkt A1)
 *
 * Ein einziger Ort, über den aller Speicherzugriff der App läuft. Verhalten bleibt
 * exakt identisch zu den bisherigen direkten localStorage-Zugriffen (inkl. try/catch-
 * Fallback-Verhalten) — dieser Punkt ist reine Vorbereitung, damit ein künftiger
 * Wechsel des Speicher-Hintergrunds (z. B. nativer Gerätespeicher in einer Android-
 * WebView, s. PLAYSTORE-BACKLOG.md Punkt B3) nur noch diese eine Datei betrifft statt
 * 22 Aufrufstellen in 9 Dateien.
 *
 * Muss als ALLERERSTES Skript geladen werden, noch vor js/dom.js — alle anderen Module
 * greifen über PZ.store zu, PZ.store selbst hat keine Abhängigkeiten.
 *
 * PZ.store.KEYS listet alle 11 bekannten Speicher-Schlüssel der App (s. Tabelle in
 * PLAYSTORE-BACKLOG.md, Abschnitt "Kernbefunde"). Bewusst NICHT enthalten:
 * `pzPresetSwipeHint` (js/presets.js) — nutzt weiterhin bewusst sessionStorage direkt,
 * bleibt flüchtig, ist kein Teil dieser Zwischenschicht.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  const KEYS = {
    RECIPES: 'pizzaRechner',
    PARTY: 'pizzaPartyPlanner',
    FEATURE_FLAGS: 'pizzaRechnerFeatureFlags',
    ADJUSTMENTS: 'pizzaRechnerAdjustments',
    LANG: 'pizzaLang',
    THEME: 'pizzaTheme',
    UNITS: 'pizzaUnits',
    SIMPLE_MODE: 'pizzaSimpleMode',
    ONBOARDING_DONT_SHOW: 'pizzaOnboardingDontShow',
    TIMERS: 'pizzaRechnerTimers',
    TIMER_HINT_SHOWN: 'pizzaRechnerTimerHintShown'
  };

  // Rohwert lesen. Gibt bei Fehlschlag (z. B. localStorage nicht verfügbar, Privater
  // Modus in manchen Browsern) null zurück — identisch zum bisherigen Verhalten, bei
  // dem ein fehlender/ungültiger Key ebenfalls als "nichts gespeichert" behandelt wurde.
  function get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  // Rohwert schreiben. Gibt bei Erfolg true, bei Fehlschlag false zurück (Aufrufer
  // ignorierten den Fehler bisher durchgehend per leerem catch-Block — dieses
  // Rückgabeverhalten ändert daran nichts, macht es aber für künftige Aufrufer prüfbar).
  function set(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }

  function remove(key) {
    try { localStorage.removeItem(key); return true; } catch (e) { return false; }
  }

  // JSON-Komfortfunktionen für die Stellen, die heute selbst JSON.parse/JSON.stringify
  // aufrufen. getJSON gibt bei fehlendem Wert oder kaputtem JSON den mitgegebenen
  // fallback zurück (Default: null) — nie einen Crash.
  function getJSON(key, fallback) {
    if (fallback === undefined) fallback = null;
    const raw = get(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function setJSON(key, obj) {
    try { return set(key, JSON.stringify(obj)); } catch (e) { return false; }
  }

  PZ.store = { KEYS, get, set, remove, getJSON, setJSON };
})(typeof window !== 'undefined' ? window : this);
