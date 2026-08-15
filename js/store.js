/* store.js — Speicher-Zwischenschicht (Play-Store-Vorbereitung, Punkt A1 + A2)
 *
 * Ein einziger Ort, über den aller Speicherzugriff der App läuft.
 *
 * A1 (v4.38.4): PZ.store.get/set/remove/getJSON/setJSON ersetzen die 22 direkten
 * localStorage-Aufrufe der App 1:1, Verhalten blieb exakt identisch.
 *
 * A2 (dieser Punkt): ein Zwischenspeicher (`cache`) im Arbeitsspeicher liegt zwischen den
 * 22 bestehenden, synchronen Aufrufstellen und dem eigentlichen Hintergrund (`_backend`).
 * Grund: der heutige Hintergrund (localStorage) ist synchron, ein künftiger nativer
 * Gerätespeicher (s. PLAYSTORE-BACKLOG.md Punkt B3) ist es nicht. Mit dem Zwischenspeicher
 * bleiben PZ.store.get()/set() weiterhin synchron, ganz gleich, wie `_backend` künftig
 * aussieht — nur `js/store.js` selbst muss sich bei B3 noch ändern, keine der 22
 * Aufrufstellen. PZ.store.hydrate() befüllt den Zwischenspeicher explizit und asynchron
 * aus dem Hintergrund (für B2: der Startbildschirm wartet künftig darauf); zusätzlich
 * befüllt sich der Zwischenspeicher HEUTE auch schon synchron beim Laden dieses Moduls
 * selbst (`fillCacheSync()` unten), weil der Hintergrund in diesem Punkt A2 noch
 * localStorage ist — das hält die App unverändert lauffähig, OHNE dass irgendwo im
 * bestehenden Code schon auf hydrate() gewartet werden müsste (das ist erst Punkt B2).
 * Sobald `_backend` in B3 auf einen echten asynchronen Speicher wechselt, entfällt diese
 * synchrone Vorbefüllung zwangsläufig (ein asynchroner Hintergrund kann beim Laden nicht
 * mehr synchron gelesen werden) — ab dann MUSS die App hydrate() vor der ersten Nutzung
 * abwarten, das ist exakt der in B2 beschriebene Schritt.
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

  const ALL_KEYS = Object.keys(KEYS).map((k) => KEYS[k]);

  // Der eigentliche Hintergrund-Adapter. In diesem Punkt (A2) weiterhin localStorage,
  // identisches try/catch-Fallback-Verhalten wie zuvor direkt in get/set/remove. Der
  // Tausch auf nativen Speicher (B3) betrifft NUR dieses Objekt.
  const _backend = {
    get(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); return true; } catch (e) { return false; }
    }
  };

  // Zwischenspeicher im Arbeitsspeicher. Fehlender Schlüssel bzw. nicht befüllter
  // Zwischenspeicher-Eintrag verhält sich wie bisher ein fehlender localStorage-Eintrag:
  // get() liefert dann null (s. u.), niemals undefined.
  const cache = Object.create(null);

  function fillCacheSync() {
    ALL_KEYS.forEach((key) => { cache[key] = _backend.get(key); });
  }
  // Synchrone Erstbefüllung beim Laden dieses Moduls, s. Datei-Kommentar oben.
  fillCacheSync();

  // Angestoßene, aber noch nicht abgeschlossene Hintergrund-Schreibvorgänge (fire-and-
  // forget aus set()/remove()) — flush() wartet auf genau diese Menge.
  let pendingWrites = [];

  function trackWrite(promise) {
    pendingWrites.push(promise);
    const forget = () => {
      const i = pendingWrites.indexOf(promise);
      if (i !== -1) pendingWrites.splice(i, 1);
    };
    promise.then(forget, forget);
  }

  // async: liest alle 11 Schlüssel einmal aus dem Hintergrund in den Zwischenspeicher.
  // Läuft immer über einen echten Promise-Tick (auch wenn `_backend` heute synchron ist),
  // damit Aufrufer sich nie auf Zufalls-Timing verlassen, sondern korrekt awaiten.
  function hydrate() {
    return Promise.resolve().then(fillCacheSync);
  }

  // Rohwert lesen. Liest NUR aus dem Zwischenspeicher, bleibt synchron. Kein Crash-Risiko
  // (reiner Objektzugriff) — fehlender Schlüssel liefert wie bisher null.
  function get(key) {
    const v = cache[key];
    return v === undefined ? null : v;
  }

  // Rohwert schreiben. Schreibt sofort synchron in den Zwischenspeicher (ein direkt
  // folgendes get() sieht den neuen Wert) UND stößt das eigentliche Schreiben in den
  // Hintergrund an, ohne selbst darauf zu warten (fire-and-forget: set() awaitet
  // `_backend.set()` nicht). `_backend.set()` wird bewusst NICHT künstlich in einen
  // späteren Promise-Tick verschoben, sondern direkt aufgerufen — in diesem Punkt A2 ist
  // der Hintergrund (localStorage) noch synchron, ruft also sofort im selben Durchlauf
  // durch, exakt wie vor A2 (wichtig für Code, der Cache UND Hintergrund im selben
  // synchronen Durchlauf konsistent erwartet, z. B. bestehende Testsuite-Abschnitte, die
  // zur Testisolation direkt am Zwischenspeicher vorbei echte Nutzerdaten sichern). Erst
  // wenn `_backend` in B3 auf einen echten asynchronen Speicher wechselt, liefert
  // `_backend.set()` selbst ein Promise, und genau dieses Nicht-Awaiten wird dann zum
  // eigentlichen, spürbaren Fire-and-Forget.
  function set(key, value) {
    cache[key] = value;
    trackWrite(Promise.resolve(_backend.set(key, value)));
    return true;
  }

  function remove(key) {
    cache[key] = null;
    trackWrite(Promise.resolve(_backend.remove(key)));
    return true;
  }

  // async: erfüllt sich, wenn alle bis zu diesem Aufruf angestoßenen Schreibvorgänge
  // durch sind (später angestoßene Schreibvorgänge zählen nicht mehr mit).
  function flush() {
    return Promise.all(pendingWrites.slice()).then(() => undefined);
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

  PZ.store = { KEYS, get, set, remove, getJSON, setJSON, hydrate, flush, _backend };
})(typeof window !== 'undefined' ? window : this);
