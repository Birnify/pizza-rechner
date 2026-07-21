/* dom.js — kleiner DOM-Helfer, gemeinsamer PZ-Namespace */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // $('id') -> document.getElementById('id')
  PZ.$ = id => document.getElementById(id);

  // PZ.announce(elementId, text) — gemeinsamer Live-Region-Helfer (v3.58.0, vorher
  // 7+ fast identische handgeschriebene Kopien desselben Musters über das Projekt
  // verteilt: js/share.js, js/main.js, js/party.js (×2), js/newrecipe.js,
  // js/theme.js, js/pdf.js, plus js/i18n.js/js/nav.js, die das Muster OHNE
  // Generation-Zähler hatten — genau diese Drift führte schon einmal zu einem
  // echten Bug: js/pdf.js hatte als einzige Stelle keinen Generation-Zähler und
  // konnte deshalb bei schnellem Doppelklick eine neuere Meldung mit einer älteren
  // überschreiben (behoben in v3.50.0, isoliert statt strukturell).
  //
  // Zweck (WCAG 4.1.3 Status Messages): eine Live-Region (`aria-live`) muss ihren
  // Text ändern, damit Screenreader sie erneut vorlesen — bei zwei wortgleichen
  // Meldungen hintereinander (z. B. zweimal "Link kopiert") erkennen viele
  // Screenreader sonst keine echte DOM-Mutation und unterdrücken die zweite Ansage.
  // Fix: Text wird erst geleert, dann im nächsten Tick (50 ms) gesetzt — garantiert
  // bei jedem Aufruf eine echte Änderung. Ein Generation-Zähler JE ELEMENT-ID
  // verhindert dabei ein Race: löst derselbe (oder ein anderer, an dieselbe
  // Live-Region gebundener) Aufruf sehr schnell hintereinander zwei unterschiedliche
  // Meldungen aus, gewinnt immer die zuletzt angeforderte — ältere, noch
  // ausstehende Timeouts werden zu No-ops.
  const announceGens = {}; // elementId -> Zähler, unabhängig je Live-Region
  PZ.announce = function (elementId, text) {
    const el = PZ.$(elementId);
    if (!el) return;
    const gen = (announceGens[elementId] = (announceGens[elementId] || 0) + 1);
    el.textContent = '';
    global.setTimeout(function () {
      if (gen === announceGens[elementId]) el.textContent = text;
    }, 50);
  };
})(window);
