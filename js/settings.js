/* settings.js — Einstellungen-Menü: Feature-Flags für die zuletzt gebauten Zusatzfunktionen.
 *
 * Persistiert in localStorage (eigener Key, getrennt vom Rezept-Speicher `pizzaRechner`),
 * gemeinsam für Desktop + Mobil (gleicher Key). Vorwärtskompatibel: künftige neue Flags
 * bekommen automatisch ihren Default, ohne bestehende Nutzereinstellungen zu überschreiben
 * (Merge aus DEFAULTS + gespeicherten Werten, analog zum Migrationsgedanken in storage.js).
 *
 * WICHTIG für Rechenlogik/Tests: PZ.FLAGS wird bewusst NUR hier gesetzt. js/guide.js,
 * js/timer.js und js/print.js prüfen `PZ.FLAGS && PZ.FLAGS.<key> === false` (nicht
 * `PZ.FLAGS.<key>`) — der `PZ.FLAGS &&`-Guard ist trotzdem sinnvoll, falls dieses Modul in
 * einem künftigen, bewusst reduzierten Testaufbau mal nicht geladen wird: dann bliebe das
 * alte Verhalten (Feature an) erhalten statt eines Fehlers. `tests/test.html` selbst lädt
 * dieses Modul seit v3.16.0 mit (s. `<script src="../js/settings.js">`) und setzt `PZ.FLAGS`
 * dort explizit auf eine "alles an"-Baseline (s. test.html) — js/timer.js ist die einzige
 * bestehende Ausnahme, die dort weiterhin NICHT geladen wird (Browser-APIs, s. Kommentar dort).
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
    newYorkStyle: false,  // Zucker-Regler (Bäckerprozent, wie Öl) — sonst ausgeblendet.
                           // Wirkt seit v3.20.1 NUR noch bei „Eigene Einstellung" (kein
                           // konkretes Preset aktiv). Das Preset „New York Style" selbst
                           // schaltet dieses Flag NICHT mehr automatisch/dauerhaft an — es
                           // blendet den Regler nur, solange es selbst aktiv gewählt ist,
                           // unabhängig vom Flag-Zustand (s. js/presets.js applyPreset(),
                           // Fix in v3.19.3/v3.20.1, s. pizza-rechner-KONTEXT.md).
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
    // Bereichs-Navigation (Desktop-Burgermenü UND seit v3.67.0 Mobil-Sekundärnavigation
    // .calc-subnav, s. pizza-rechner.html / pizza-rechner-mobile.html): Menüpunkt
    // "Rezepte" führt bei abgeschaltetem Flag nur zu einer leeren Ansicht — Punkt überall
    // ausblenden. querySelectorAll statt querySelector (Bugfix v3.67.0): seit die
    // Sekundär-Navigation auf Mobil identisch in allen drei Rechner-Unterbereichen
    // eingebettet ist, gibt es dort bis zu drei `.nav-item[data-goto="rezepte"]`-Treffer
    // statt nur einem — mit querySelector allein wären zwei davon fälschlich sichtbar
    // geblieben, auch bei ausgeschaltetem Flag.
    const recipesNavItems = document.querySelectorAll('.nav-item[data-goto="rezepte"]');
    recipesNavItems.forEach(function (item) { item.style.display = f.multiRecipes ? '' : 'none'; });
    const shareBlock = document.getElementById('shareBlock');
    if (shareBlock) shareBlock.style.display = f.share ? 'flex' : 'none';
    const shoppingRow = document.getElementById('shoppingRow');
    if (shoppingRow) shoppingRow.style.display = f.shopping ? '' : 'none';
    // "Als PDF speichern" (js/pdf.js) ist inhaltlich eine dritte Export-Variante der
    // Anleitung (neben den beiden Druck-Buttons oben) — teilt sich bewusst dasselbe
    // "shopping"-Flag statt ein eigenes Flag zu bekommen: schaltet der Nutzer die
    // Druck-/Export-Zusatzfunktionen ab, verschwindet der PDF-Button konsistent mit.
    const pdfGuideBlock = document.getElementById('pdfGuideBlock');
    if (pdfGuideBlock) pdfGuideBlock.style.display = f.shopping ? 'flex' : 'none';
    // Zucker-Regler (New-York-Style): nutzt das etablierte .collapse/.show-Muster
    // (wie prefBlock/bigaHydBlock) statt style.display — verhindert einen Flackerer
    // vorm ersten applyFlags()-Lauf, da .collapse per CSS schon vor JS-Ausführung greift.
    // Sichtbar NUR, wenn ENTWEDER das Preset „New York Style" gerade aktiv im #preset-
    // Select gewählt ist, ODER „Eigene Einstellung" (kein/unbekanntes Preset) aktiv ist
    // UND das Flag dauerhaft/manuell an ist (v3.20.1 — verschärft gegenüber v3.19.3, wo
    // ein manuell angeschalteter Flag den Regler bei JEDEM Preset sichtbar machte, auch
    // bei Napoli/Teglia, wo Zucker nicht hingehört; s. pizza-rechner-KONTEXT.md). Fragt
    // dafür live den #preset-Select ab statt einen zusätzlichen State zu duplizieren —
    // presets.js ruft applyFlags() bei jedem Preset-Wechsel (inkl. "Eigene Einstellung")
    // neu auf, s. dort.
    const presetEl = document.getElementById('preset');
    const presetKey = presetEl ? presetEl.value : '';
    const isNewYorkPreset = presetKey === 'newyork_style';
    // "Eigene Einstellung": kein Preset gewählt ODER (im Test-Stub möglich) ein Key, der
    // in PZ.PRESETS gar nicht existiert — beides zählt als "kein konkretes Preset aktiv".
    const isCustomSelection = !presetKey || !(PZ.PRESETS && PZ.PRESETS[presetKey]);
    const sugarBlock = document.getElementById('sugarBlock');
    if (sugarBlock) sugarBlock.classList.toggle('show', isNewYorkPreset || (isCustomSelection && !!f.newYorkStyle));
    // Tooltip-/Hinweistexte: EIN globaler Body-Klassen-Schalter statt Dutzender
    // Einzel-Elemente. CSS blendet darüber alle .hint/.timersys-hint/.timerhint-Elemente
    // per display:none aus — die Elemente (und ihre IDs) bleiben dabei im DOM erhalten,
    // nur unsichtbar/nicht mehr im Accessibility-Tree. Wichtig: #shareHint (referenziert
    // von #shareLinkBtn via aria-describedby) und die dynamischen timersys-hint-<key>-
    // Spans (referenziert von den System-Wecker-Links, js/timer.js) bleiben dadurch
    // gültige DOM-Knoten — nie eine "verwaiste" aria-describedby-Referenz auf eine
    // nicht-existente ID, nur eine (wie visuell) nicht wahrnehmbare.
    document.body.classList.toggle('hints-off', !f.hints);
    // Checkboxen synchron halten: wireCheckboxes() setzt el.checked nur einmalig beim
    // Laden. Seit dem "New York Style"-Preset (js/presets.js) kann ein Flag aber auch
    // PROGRAMMATISCH (ohne Checkbox-Klick) angeschaltet werden — ohne diesen Sync bliebe
    // der Schalter im Einstellungen-Menü optisch "aus", obwohl das Flag technisch an ist.
    Object.keys(CHECKBOX_MAP).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.checked = !!f[CHECKBOX_MAP[id]];
    });
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
    flagNewYorkStyle: 'newYorkStyle',
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

  // ======================================================================
  // Globale Hefemengen-/Verschwendungs-Anpassung (v3.64.0) — zwei persönliche
  // Kalibrierungswerte (in Prozent), unabhängig von PZ.state/PZ.FLAGS: sie gelten für
  // JEDES Rezept/Preset gleichermaßen (anders als die Rezept-Regler), daher eigener
  // localStorage-Key `pizzaRechnerAdjustments`, getrennt vom Rezept-Speicher und vom
  // Feature-Flag-Speicher. js/calc.js liest PZ.ADJUST direkt (defensiv mit
  // `PZ.ADJUST && ...` geprüft, falls dieses Modul in einer reduzierten Umgebung wie
  // tests/test.html mal nicht geladen würde — analog zum PZ.FLAGS-Guard oben).
  //
  // - yeastAdjust (Default 0 %, Bereich −50…+100 %, Schritt 5 %): persönliche
  //   Kalibrierung für Nutzer, deren Hefe regelmäßig stärker/schwächer aufgeht als
  //   von der App angenommen. Fließt in js/calc.js als zusätzlicher Faktor auf die
  //   Hefe-Bäckerprozentzahl EIN NENNER ein (analog zu Öl/Zucker) — Masseerhaltung
  //   (Mehl+Wasser+Salz+Hefe+Öl+Zucker=Gesamtgewicht) bleibt dadurch exakt erhalten.
  // - wasteAdjust (Default 2 %, Bereich 0…15 %, Schritt 1 %): erhöht das
  //   vorkalkulierte Gesamtgewicht (N×Teiglingsgewicht), damit nach Kneteverlusten
  //   (Schüssel/Hände/Maschine) trotzdem die gewünschte Anzahl Teiglinge im
  //   Zielgewicht rauskommt. Wirkt in js/calc.js VOR der Aufteilung auf die Zutaten.
  const ADJUST_KEY = 'pizzaRechnerAdjustments';
  const ADJUST_DEFAULTS = { yeastAdjust: 0, wasteAdjust: 2 };
  const ADJUST_RANGE = {
    yeastAdjust: { min: -50, max: 100, step: 5 },
    wasteAdjust: { min: 0, max: 15, step: 1 }
  };

  function clampAdjust(key, v) {
    const r = ADJUST_RANGE[key];
    let n = parseFloat(v);
    if (!isFinite(n)) n = ADJUST_DEFAULTS[key];
    n = Math.min(r.max, Math.max(r.min, n));
    // Auf die Schrittweite runden -- verhindert krumme Werte durch direkte
    // Zahlenfeld-Eingabe (z. B. getippte "37" bei Schrittweite 5 -> 35).
    n = Math.round(n / r.step) * r.step;
    // Rundungsfehler durch Fließkomma-Arithmetik vermeiden (z. B. 0.1+0.2-Effekt).
    return Math.round(n * 100) / 100;
  }
  PZ._clampAdjust = clampAdjust; // für Tests exponiert (reine Funktion, kein State)

  function readAdjust() {
    let stored = {};
    try {
      const raw = localStorage.getItem(ADJUST_KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) { stored = {}; }
    if (typeof stored !== 'object' || Array.isArray(stored)) stored = {};
    const merged = Object.assign({}, ADJUST_DEFAULTS, stored);
    Object.keys(ADJUST_DEFAULTS).forEach(function (k) { merged[k] = clampAdjust(k, merged[k]); });
    return merged;
  }
  function writeAdjust(a) {
    try { localStorage.setItem(ADJUST_KEY, JSON.stringify(a)); } catch (e) { /* ignore */ }
  }

  PZ.ADJUST = readAdjust();
  PZ.ADJUST_DEFAULTS = ADJUST_DEFAULTS;
  PZ.ADJUST_RANGE = ADJUST_RANGE;

  // Reine Merge-Funktion (kein localStorage/DOM) — für Tests exponiert, analog zu
  // PZ._mergeFlags oben (Vorwärtskompatibilitäts-Verhalten prüfbar ohne echten Reload).
  PZ._mergeAdjust = function (stored) {
    const merged = Object.assign({}, ADJUST_DEFAULTS, stored || {});
    Object.keys(ADJUST_DEFAULTS).forEach(function (k) { merged[k] = clampAdjust(k, merged[k]); });
    return merged;
  };

  function reflectAdjust() {
    Object.keys(ADJUST_DEFAULTS).forEach(function (key) {
      const input = $ ? $(key + 'Input') : document.getElementById(key + 'Input');
      if (input) input.value = PZ.ADJUST[key];
    });
  }

  // Setzt einen einzelnen Anpassungswert, klemmt ihn auf Bereich/Schrittweite, persistiert
  // sofort und löst eine Neuberechnung aus (die Werte wirken direkt in js/calc.js).
  function setAdjust(key, value) {
    if (!(key in ADJUST_DEFAULTS)) return;
    PZ.ADJUST[key] = clampAdjust(key, value);
    writeAdjust(PZ.ADJUST);
    reflectAdjust();
    if (PZ.calc) PZ.calc();
  }
  PZ.setAdjust = setAdjust;

  // --- UI-Verdrahtung der beiden Stepper (nur falls vorhanden — beide Seiten identisch) ---
  function wireAdjustStepper(key) {
    const input = $ ? $(key + 'Input') : document.getElementById(key + 'Input');
    const minus = $ ? $(key + 'Minus') : document.getElementById(key + 'Minus');
    const plus = $ ? $(key + 'Plus') : document.getElementById(key + 'Plus');
    if (!input) return;
    input.value = PZ.ADJUST[key];
    input.addEventListener('change', function () { setAdjust(key, input.value); });
    if (minus) minus.addEventListener('click', function () {
      setAdjust(key, PZ.ADJUST[key] - ADJUST_RANGE[key].step);
    });
    if (plus) plus.addEventListener('click', function () {
      setAdjust(key, PZ.ADJUST[key] + ADJUST_RANGE[key].step);
    });
  }

  function wireAdjustSteppers() {
    Object.keys(ADJUST_DEFAULTS).forEach(wireAdjustStepper);
  }

  // Info-Knöpfe neben jedem Einstellungspunkt (v3.19.0): reines Anzeige-Detail, rührt
  // keine Flags an. Klick/Enter/Space blendet den zugehörigen Erklär-Absatz
  // (<p class="switch-info" id="…">) per hidden-Attribut ein/aus und spiegelt den
  // Zustand in aria-expanded — klassisches Disclosure-Widget-Muster. Läuft identisch
  // auf Desktop + Mobil (beide laden dieselbe Karte/Markup-Struktur).
  function wireInfoButtons() {
    const btns = document.querySelectorAll('.info-btn[aria-controls]');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('click', function () {
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        if (expanded) panel.setAttribute('hidden', ''); else panel.removeAttribute('hidden');
      });
    });
  }

  wireCheckboxes();
  wireInfoButtons();
  wireAdjustSteppers();
  applyFlags();
})(window);
