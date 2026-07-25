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

  // PZ.moveFocusBeforeHide(containers, fallbackTarget) — Backlog Punkt J (v4.12.0,
  // WCAG 2.4.3 Fokus-Reihenfolge). Nebenbefund aus dem accessibility-expert-Review zu
  // Backlog Punkt C (v4.7.0): wird ein Feld, das gerade den Fokus hält, per
  // .collapse/.show-Muster ausgeblendet, fällt der Fokus kommentarlos auf <body> --
  // Tastatur-/Screenreader-Nutzer verlieren dadurch unbemerkt ihre Position im Formular.
  // App-weites Bestandsmuster (u. a. #sugarBlock in js/calc.js, #prefBlock/#bigaHydBlock/
  // #prefStageBlock in js/ui.js applyMethod() und js/newrecipe.js nrApplyMethod()) --
  // deshalb hier EIN gemeinsamer Helfer statt lokaler Einzel-Fixes je Stelle.
  //
  // `containers`: ein einzelnes Element ODER ein Array mehrerer Elemente, die alle
  // GEMEINSAM/UNMITTELBAR NACHEINANDER ausgeblendet werden (z. B. applyMethod() blendet
  // bei einem Methodenwechsel mehrere .collapse-Container gleichzeitig aus). Wichtig:
  // ALLE gerade tatsächlich verschwindenden Container in einem Aufruf übergeben, NICHT
  // einzeln pro Container aufrufen -- sonst würde der Helfer beim ersten Container einen
  // Nachbarn als "sicheres Ziel" wählen, der im nächsten Schritt selbst verschwindet
  // (Fokus würde dann trotzdem verloren gehen, nur einen Schritt später).
  // `fallbackTarget`: optionales, garantiert sichtbar bleibendes Element (z. B. das
  // auslösende Steuerelement selbst, etwa der Methode-Segmentschalter) -- wird genutzt,
  // falls kein passendes Geschwister-Element gefunden wird.
  //
  // Strategie (robusteste, am wenigsten überraschende Wahl): zuerst das nächste
  // sichtbare, nicht mit-betroffene Geschwister-Element NACH dem letzten Container
  // (= "das nächste Feld"), sonst das vorherige sichtbare Geschwister VOR dem ersten
  // Container (= "das vorige Feld"), sonst der optionale `fallbackTarget`, zuletzt das
  // übergeordnete Card-/Container-Element (per tabindex="-1" fokussierbar gemacht) --
  // niemals kommentarlos auf <body> fallen lassen.
  const FOCUSABLE_SEL = 'a[href],button:not([disabled]),input:not([disabled]),' +
    'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function isVisibleEl(el) { return !!(el && el.offsetParent !== null); }
  PZ.moveFocusBeforeHide = function (containers, fallbackTarget) {
    const list = Array.isArray(containers) ? containers.filter(Boolean) : (containers ? [containers] : []);
    if (!list.length) return;
    const active = document.activeElement;
    if (!list.some(function (c) { return c.contains(active); })) return; // Fokus liegt gar nicht in einem der Container

    function inList(el) { return list.indexOf(el) !== -1; }
    function focusableIn(el) {
      if (!el || inList(el) || !isVisibleEl(el)) return null;
      if (el.matches && el.matches(FOCUSABLE_SEL)) return el;
      return el.querySelector ? el.querySelector(FOCUSABLE_SEL) : null;
    }

    const last = list[list.length - 1];
    for (let sib = last.nextElementSibling; sib; sib = sib.nextElementSibling) {
      const target = focusableIn(sib);
      if (target) { target.focus(); return; }
    }
    const first = list[0];
    for (let sib = first.previousElementSibling; sib; sib = sib.previousElementSibling) {
      const target = focusableIn(sib);
      if (target) { target.focus(); return; }
    }
    if (fallbackTarget && isVisibleEl(fallbackTarget)) { fallbackTarget.focus(); return; }
    const card = first.closest ? (first.closest('.card') || first.parentElement) : first.parentElement;
    if (card) {
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');
      card.focus();
    }
  };

  // PZ.toggleCollapse(container, show, opts) — Backlog Punkt J (v4.12.0). Dünner
  // Wrapper für den EINZELNEN, unabhängig (nicht als Teil einer Batch-Umschaltung wie
  // applyMethod()) getoggelten .collapse-Container, z. B. #sugarBlock: kombiniert den
  // Fokus-Schutz (PZ.moveFocusBeforeHide) mit der bestehenden .show-Klasse UND optional
  // einer Live-Region-Ansage beim NEU-Erscheinen (WCAG 4.1.3, identisches Muster wie das
  // #waterTempGlossaryRef-Announcement aus v4.11.0) -- feuert nur beim Wechsel
  // verborgen->sichtbar, nicht bei jedem Render, während der Container ohnehin schon
  // sichtbar ist/bleibt. `opts`: { announceId, announceText } (beide nötig, sonst keine
  // Ansage). Für gemeinsam/gleichzeitig getoggelte Container-Gruppen (z. B. applyMethod())
  // NICHT diesen Wrapper je Container einzeln aufrufen (s. Batch-Warnung oben bei
  // PZ.moveFocusBeforeHide) -- dort direkt PZ.moveFocusBeforeHide() mit der vollständigen
  // Container-Liste EINMAL vor allen Toggles aufrufen.
  PZ.toggleCollapse = function (container, show, opts) {
    if (!container) return;
    const wasVisible = container.classList.contains('show');
    if (!show && wasVisible) PZ.moveFocusBeforeHide(container);
    container.classList.toggle('show', show);
    if (show && !wasVisible && opts && opts.announceId && opts.announceText && PZ.announce) {
      PZ.announce(opts.announceId, opts.announceText);
    }
  };
})(window);
