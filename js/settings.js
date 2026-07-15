/* settings.js — Einstellungen-Menü: Feature-Flags für die zuletzt gebauten Zusatzfunktionen.
 *
 * Persistiert in localStorage (eigener Key, getrennt vom Rezept-Speicher `pizzaRechner`),
 * gemeinsam für Desktop + Mobil (gleicher Key). Vorwärtskompatibel: künftige neue Flags
 * bekommen automatisch ihren Default, ohne bestehende Nutzereinstellungen zu überschreiben
 * (Merge aus DEFAULTS + gespeicherten Werten, analog zum Migrationsgedanken in storage.js).
 *
 * WICHTIG für Rechenlogik/Tests: PZ.FLAGS wird bewusst NUR hier gesetzt. js/guide.js,
 * js/timer.js und js/print.js prüfen `PZ.FLAGS && PZ.FLAGS.<key> === false` (nicht
 * `PZ.FLAGS.<key>`) — ist dieses Modul gar nicht geladen (z. B. in tests/test.html, das
 * bewusst nur die reinen Rechen-/Render-Module lädt), bleibt das alte Verhalten (Feature an)
 * erhalten. So bricht kein bestehender Test durch die bloße Existenz dieses Moduls.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  const KEY = 'pizzaRechnerFeatureFlags';

  // Default-Werte exakt wie vom Nutzer festgelegt.
  const DEFAULTS = {
    timer: true,          // Gärzeit-Timer/Wecker je Anleitungsschritt
    timerSystem: false,   // System-Wecker/Kalender-Links (Teil-Feature von timer)
    share: true,          // Teilen-Link
    shopping: false,      // Einkaufsliste & separater Druck
    freezeHint: false,    // Einfrier-Hinweis in der Anleitung
    multiRecipes: true,   // Mehrere gespeicherte Rezepte (sonst: Einzel-Slot-Verhalten)
    hints: true           // Tooltip-/Hinweistexte (erklärende .hint-Kurztexte). Default AN:
                           // reine Erklärhilfen sind für neue Nutzer wertvoll, erfahrene
                           // Nutzer können bewusst abschalten (anders als die übrigen, im
                           // Ausgangszustand unauffälligen Zusatzfunktionen oben).
  };

  function readFlags() {
    let stored = {};
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) { stored = {}; }
    if (typeof stored !== 'object' || Array.isArray(stored)) stored = {};
    return Object.assign({}, DEFAULTS, stored);
  }

  function writeFlags(flags) {
    try { localStorage.setItem(KEY, JSON.stringify(flags)); } catch (e) { /* ignore */ }
  }

  PZ.FLAGS = readFlags();
  PZ.FLAG_DEFAULTS = DEFAULTS;

  // Reine Merge-Funktion (kein localStorage/DOM) — für Tests exponiert, damit das
  // Vorwärtskompatibilitäts-Verhalten (gespeicherte Teilobjekte + neue Default-Keys)
  // geprüft werden kann, ohne einen echten Page-Reload simulieren zu müssen.
  PZ._mergeFlags = function (stored) {
    return Object.assign({}, DEFAULTS, stored || {});
  };

  // Setzt ein einzelnes Flag, persistiert sofort. Unbekannte Keys werden ignoriert
  // (Schutz gegen Tippfehler/künftige Refaktorierungen).
  function setFlag(key, value) {
    if (!(key in DEFAULTS)) return;
    PZ.FLAGS[key] = !!value;
    writeFlags(PZ.FLAGS);
  }
  PZ.setFlag = setFlag;

  // Wendet die aktuellen Flags auf die statischen UI-Blöcke an (Karten/Buttons komplett
  // aus dem Rendering nehmen per display:none — sauberer als nur optisch verstecken,
  // display:none nimmt Elemente auch aus Tab-Reihenfolge & Accessibility-Tree) und stößt
  // ein Neu-Rendern der Anleitung an (js/guide.js liest PZ.FLAGS.timer/freezeHint dort
  // bei jedem buildGuide()-Lauf neu aus).
  function applyFlags() {
    const f = PZ.FLAGS;
    const recipesCard = document.getElementById('recipesCard');
    if (recipesCard) recipesCard.style.display = f.multiRecipes ? '' : 'none';
    // Mobil-Hamburger-Nav (falls vorhanden, s. pizza-rechner-mobile.html): Menüpunkt
    // "Rezepte" führt bei abgeschaltetem Flag nur zu einer leeren Ansicht — Punkt
    // ausblenden. Auf Desktop existiert kein `.nav-item`-Element, no-op dort.
    const recipesNavItem = document.querySelector('.nav-item[data-goto="rezepte"]');
    if (recipesNavItem) recipesNavItem.style.display = f.multiRecipes ? '' : 'none';
    const shareBlock = document.getElementById('shareBlock');
    if (shareBlock) shareBlock.style.display = f.share ? '' : 'none';
    const shoppingRow = document.getElementById('shoppingRow');
    if (shoppingRow) shoppingRow.style.display = f.shopping ? '' : 'none';
    // Tooltip-/Hinweistexte: EIN globaler Body-Klassen-Schalter statt Dutzender
    // Einzel-Elemente. CSS blendet darüber alle .hint/.timersys-hint/.timerhint-Elemente
    // per display:none aus — die Elemente (und ihre IDs) bleiben dabei im DOM erhalten,
    // nur unsichtbar/nicht mehr im Accessibility-Tree. Wichtig: #shareHint (referenziert
    // von #shareLinkBtn via aria-describedby) und die dynamischen timersys-hint-<key>-
    // Spans (referenziert von den System-Wecker-Links, js/timer.js) bleiben dadurch
    // gültige DOM-Knoten — nie eine "verwaiste" aria-describedby-Referenz auf eine
    // nicht-existente ID, nur eine (wie visuell) nicht wahrnehmbare.
    document.body.classList.toggle('hints-off', !f.hints);
    if (PZ.buildGuide) PZ.buildGuide();
  }
  PZ.applyFlags = applyFlags;

  // --- UI-Verdrahtung der Checkboxen (nur falls vorhanden — beide Seiten identisch) ---
  const CHECKBOX_MAP = {
    flagTimer: 'timer',
    flagTimerSystem: 'timerSystem',
    flagShare: 'share',
    flagShopping: 'shopping',
    flagFreezeHint: 'freezeHint',
    flagMultiRecipes: 'multiRecipes',
    flagHints: 'hints'
  };

  function wireCheckboxes() {
    Object.keys(CHECKBOX_MAP).forEach(id => {
      const el = $ ? $(id) : document.getElementById(id);
      if (!el) return;
      const key = CHECKBOX_MAP[id];
      el.checked = !!PZ.FLAGS[key];
      el.addEventListener('change', () => {
        setFlag(key, el.checked);
        applyFlags();
      });
    });
  }

  wireCheckboxes();
  applyFlags();
})(window);
