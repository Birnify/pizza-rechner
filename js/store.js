/* store.js — Speicher-Zwischenschicht (Play-Store-Vorbereitung, Punkt A1 + A2 + B3)
 *
 * Ein einziger Ort, über den aller Speicherzugriff der App läuft.
 *
 * A1 (v4.38.4): PZ.store.get/set/remove/getJSON/setJSON ersetzen die 22 direkten
 * localStorage-Aufrufe der App 1:1, Verhalten blieb exakt identisch.
 *
 * A2 (v4.39.0): ein Zwischenspeicher (`cache`) im Arbeitsspeicher liegt zwischen den
 * 22 bestehenden, synchronen Aufrufstellen und dem eigentlichen Hintergrund (`_backend`).
 * Grund: der heutige Hintergrund (localStorage) ist synchron, ein künftiger nativer
 * Gerätespeicher (s. PLAYSTORE-BACKLOG.md Punkt B3) ist es nicht. Mit dem Zwischenspeicher
 * bleiben PZ.store.get()/set() weiterhin synchron, ganz gleich, wie `_backend` aussieht —
 * nur `js/store.js` selbst musste sich bei B3 noch ändern, keine der 22 Aufrufstellen.
 *
 * B3 (dieser Punkt): `_backend` zeigt in einer nativen Capacitor-App (Android, erkannt über
 * `window.Capacitor?.isNativePlatform()`, identisches Muster wie js/main.js `boot()`) auf
 * Capacitor Preferences (nativer Gerätespeicher, überlebt das Leeren des WebView-
 * localStorage) statt auf `localStorage`. Im normalen Browser (Desktop UND Mobil ohne
 * Capacitor, also auch die Testsuite) bleibt der Hintergrund unverändert `localStorage` —
 * `isNativeApp` wird einmalig beim Laden dieses Moduls ausgewertet.
 *
 * Weil `_backend` jetzt in der nativen App wirklich asynchron ist, entfällt dort die
 * bisherige synchrone Erstbefüllung des Zwischenspeichers beim Laden dieses Moduls
 * (`fillCacheSync()` unten läuft nur noch im Browser) — die native App MUSS `hydrate()`
 * vor der ersten Nutzung abwarten, das übernimmt bereits `js/main.js` `boot()` seit B2.
 *
 * Einmalige Altdaten-Übernahme (nur nativ): `hydrate()` prüft vor dem eigentlichen Befüllen
 * eine interne Markierung (`MIGRATION_MARKER_KEY`, KEIN Teil von PZ.store.KEYS) im nativen
 * Speicher. Fehlt sie, werden alle 11 Schlüssel aus `localStorage` (dem alten Speicherort,
 * WebView-lokal weiterhin lesbar) in den nativen Speicher übernommen und die Markierung
 * gesetzt — die Altdaten in `localStorage` werden dabei bewusst NICHT gelöscht
 * (Sicherheitsnetz, s. PLAYSTORE-BACKLOG.md B3). `migrateLegacyLocalStorage()` ist über
 * `PZ.store._migrateLegacyLocalStorage` auch direkt aufrufbar (Testbarkeit ohne echtes
 * Capacitor — sie prüft/schreibt nur über `_backend`, unabhängig von `isNativeApp`).
 *
 * Sonderfall Farbschema (Kernbefund 3, PLAYSTORE-BACKLOG.md): das Inline-Script im `<head>`
 * von pizza-rechner-mobile.html liest `pizzaTheme` synchron aus `localStorage`, bevor
 * irgendein JS-Modul lädt — das MUSS so bleiben. Deshalb schreibt `set()` den Wert für den
 * Theme-Schlüssel in der nativen App IMMER zusätzlich synchron nach `localStorage`, rein als
 * Spiegel für diesen einen Vorab-Zugriff (`mirrorThemeToLocalStorage()`, auch über
 * `PZ.store._mirrorThemeToLocalStorage` direkt testbar). Wird der Spiegel doch einmal
 * geleert, greift die vorhandene Systemerkennung als Fallback — kein Datenverlust, im
 * schlimmsten Fall ein einmalig falsches Farbschema für den Bruchteil einer Sekunde.
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

  // Interne Markierung für die einmalige Altdaten-Übernahme (B3) -- bewusst KEIN Teil von
  // PZ.store.KEYS/ALL_KEYS (kein Anwendungsdatum, reines Migrations-Flag im nativen Speicher).
  const MIGRATION_MARKER_KEY = 'pizzaStoreMigratedV1';

  // Feature-Erkennung, identisches Muster wie js/main.js boot(): in einer nativen
  // Capacitor-App zeigt _backend auf Capacitor Preferences, sonst weiterhin localStorage.
  // Einmalig beim Laden dieses Moduls ausgewertet.
  const isNativeApp = !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());

  function nativePreferencesPlugin() {
    return (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.Preferences) || null;
  }

  // Der eigentliche Hintergrund-Adapter. Im Browser (auch die Testsuite) weiterhin
  // localStorage, identisches try/catch-Fallback-Verhalten wie schon vor B3. In der
  // nativen App zeigt er auf Capacitor Preferences (`@capacitor/preferences`) -- async,
  // liefert bei fehlendem Plugin (sollte nur bei einem Build-/Setup-Fehler vorkommen)
  // defensiv null/false statt eines Absturzes, analog zum bestehenden try/catch-Muster.
  const _backend = isNativeApp ? {
    get(key) {
      try {
        return nativePreferencesPlugin().get({ key })
          .then((r) => (r && r.value != null) ? r.value : null)
          .catch(() => null);
      } catch (e) { return Promise.resolve(null); }
    },
    set(key, value) {
      try {
        return nativePreferencesPlugin().set({ key, value: String(value) })
          .then(() => true)
          .catch(() => false);
      } catch (e) { return Promise.resolve(false); }
    },
    remove(key) {
      try {
        return nativePreferencesPlugin().remove({ key })
          .then(() => true)
          .catch(() => false);
      } catch (e) { return Promise.resolve(false); }
    }
  } : {
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
  // Synchrone Erstbefüllung beim Laden dieses Moduls -- nur möglich, wenn der Hintergrund
  // selbst synchron ist (Browser/localStorage). In der nativen App ist `_backend.get()`
  // asynchron (liefert ein Promise statt eines Werts), eine synchrone Vorbefüllung würde
  // dort Promise-Objekte statt echter Werte in den Zwischenspeicher schreiben -- dort MUSS
  // stattdessen hydrate() vor der ersten Nutzung abgewartet werden (js/main.js boot(), B2).
  if (!isNativeApp) fillCacheSync();

  // async, robust für sowohl synchrone als auch asynchrone _backend.get()-Rückgaben
  // (Promise.resolve() eines bereits fertigen Werts löst sofort auf): liest alle 11
  // Schlüssel aus dem Hintergrund in den Zwischenspeicher.
  function fillCacheAsync() {
    return Promise.all(ALL_KEYS.map((key) =>
      Promise.resolve(_backend.get(key)).then((v) => { cache[key] = (v === undefined ? null : v); })
    ));
  }

  // Einmalige Altdaten-Übernahme (B3): alle 11 Schlüssel aus `localStorage` (altem
  // Speicherort) in `_backend` (neuer Speicherort) übernehmen, falls noch nicht geschehen.
  // Bewusst UNABHÄNGIG von `isNativeApp` implementiert (nur über `_backend`/`localStorage`
  // selbst) -- die eigentliche Gating-Entscheidung "nur in der nativen App ausführen" trifft
  // ausschließlich hydrate() unten, das hält diese Funktion für Tests direkt aufrufbar, ohne
  // eine echte Capacitor-Umgebung zu brauchen. Liefert true, wenn migriert wurde, false,
  // wenn die Markierung bereits gesetzt war (nichts zu tun). Löscht die Altdaten in
  // `localStorage` bewusst NICHT (Sicherheitsnetz, s. Datei-Kommentar oben).
  function migrateLegacyLocalStorage() {
    return Promise.resolve(_backend.get(MIGRATION_MARKER_KEY)).then((marker) => {
      if (marker) return false;
      const writes = ALL_KEYS.map((key) => {
        let legacyValue = null;
        try { legacyValue = localStorage.getItem(key); } catch (e) { legacyValue = null; }
        if (legacyValue === null) return Promise.resolve();
        return Promise.resolve(_backend.set(key, legacyValue));
      });
      return Promise.all(writes)
        .then(() => Promise.resolve(_backend.set(MIGRATION_MARKER_KEY, '1')))
        .then(() => true);
    });
  }

  // Reiner Spiegel-Schreibvorgang für das Farbschema, s. Datei-Kommentar "Sonderfall
  // Farbschema" oben -- die einzige Stelle in diesem Modul, die `localStorage` losgelöst
  // von `_backend` direkt anfasst, bewusst, weil das Inline-Theme-Script im <head> synchron
  // bleiben MUSS. Kein Crash-Risiko, reiner Best-Effort-Spiegel.
  function mirrorThemeToLocalStorage(value) {
    try { localStorage.setItem(KEYS.THEME, value); } catch (e) { /* ignore, reiner Spiegel */ }
  }

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

  // async: befüllt den Zwischenspeicher einmal aus dem Hintergrund. In der nativen App läuft
  // vorher die einmalige Altdaten-Übernahme (s. o.), im Browser entfällt sie (dort gab es nie
  // einen "alten" localStorage-Speicherort -- der Hintergrund IST localStorage). Läuft immer
  // über mindestens einen echten Promise-Tick, damit Aufrufer sich nie auf Zufalls-Timing
  // verlassen, sondern korrekt awaiten (js/main.js boot(), B2).
  function hydrate() {
    const migration = isNativeApp ? migrateLegacyLocalStorage() : Promise.resolve(false);
    return migration.then(fillCacheAsync);
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
  // `_backend.set()` nicht). Im Browser (localStorage, synchron) läuft `_backend.set()`
  // dadurch weiterhin sofort im selben Durchlauf durch (wichtig für Code, der Cache UND
  // Hintergrund im selben synchronen Durchlauf konsistent erwartet, z. B. bestehende
  // Testsuite-Abschnitte, die zur Testisolation direkt am Zwischenspeicher vorbei echte
  // Nutzerdaten sichern). In der nativen App (B3) liefert `_backend.set()` ein echtes
  // Promise, und genau dieses Nicht-Awaiten wird zum spürbaren Fire-and-Forget.
  function set(key, value) {
    cache[key] = value;
    trackWrite(Promise.resolve(_backend.set(key, value)));
    // Sonderfall Farbschema (s. Datei-Kommentar oben): nur in der nativen App zusätzlich
    // synchron nach localStorage spiegeln -- im Browser IST der Hintergrund bereits
    // localStorage, ein zweiter Schreibvorgang wäre dort nur redundant.
    if (isNativeApp && key === KEYS.THEME) mirrorThemeToLocalStorage(value);
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

  PZ.store = {
    KEYS, get, set, remove, getJSON, setJSON, hydrate, flush, _backend,
    // Nicht-öffentliche Zusatz-Exports, ausschließlich für gezielte Tests/Diagnose (B3):
    // erlauben, die Migrations- und Theme-Spiegel-Logik direkt zu prüfen, ohne eine echte
    // Capacitor-Umgebung zu brauchen (s. Datei-Kommentar oben). Kein Teil der öffentlichen
    // API, von keiner der 22 Aufrufstellen genutzt.
    _isNativeApp: isNativeApp,
    _migrateLegacyLocalStorage: migrateLegacyLocalStorage,
    _mirrorThemeToLocalStorage: mirrorThemeToLocalStorage,
    _MIGRATION_MARKER_KEY: MIGRATION_MARKER_KEY
  };
})(typeof window !== 'undefined' ? window : this);
