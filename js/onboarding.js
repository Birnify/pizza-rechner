/* onboarding.js — Willkommens-Screen / Einführung (v3.63.0)
 *
 * Vorschalt-Modal, das die 4 Kernfunktionen der App kurz vorstellt (Presets/Rezepte,
 * Anpassung im Erweiterten Modus, Zeitplan, Anleitung & Timer) plus einen kombinierten
 * Hinweis auf das Einstellungen-Menü und den Erweiterten Modus. Erscheint automatisch
 * beim allerersten Start (kein "nicht mehr anzeigen"-Flag in localStorage) und ist
 * jederzeit über den Menüpunkt "Einführung" im Burgermenü erneut aufrufbar.
 *
 * Technisch ein eigenständiges Modal-Dialog-Overlay (role="dialog" aria-modal="true"),
 * analog zum bestehenden Burgermenü-Muster (js/nav.js) -- eigener Fokus-Trap statt
 * Wiederverwendung von dessen internem, an #navMenu gebundenem Trap. Schließen geht auf
 * vier Wegen (X-Button, Escape, Klick auf den Hintergrund, CTA-Button) -- die Checkbox
 * "Beim nächsten Start nicht mehr anzeigen" bestimmt dabei NUR, ob der Screen beim
 * NÄCHSTEN Start automatisch wieder erscheint, unabhängig davon, wie er diesmal
 * geschlossen wurde (Nutzer-Entscheidung, Rückfrage-Runde vor der Umsetzung).
 *
 * Eigener localStorage-Key `pizzaOnboardingDontShow` ('1'/'0'), getrennt vom
 * Rezept-Speicher `pizzaRechner`, vom Feature-Flag-Speicher `pizzaRechnerFeatureFlags`
 * und vom Einfacher-Modus-Speicher `pizzaSimpleMode` -- analog zum Muster aus
 * js/theme.js/js/simplemode.js.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const DONT_SHOW_KEY = 'pizzaOnboardingDontShow';

  function readDontShow() {
    try { return localStorage.getItem(DONT_SHOW_KEY) === '1'; } catch (e) { return false; }
  }
  function writeDontShow(v) {
    try { localStorage.setItem(DONT_SHOW_KEY, v ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  function wire() {
    const overlay = $('onboardingOverlay');
    if (!overlay) return; // Seite ohne Onboarding-Markup (z. B. tests/test.html) -- no-op

    const closeBtn = $('onboardingClose');
    const ctaBtn = $('onboardingCta');
    const checkbox = $('onboardingDontShow');
    const menuItem = $('navOnboardingItem');
    let lastFocused = null;

    // Tab-Trap-Reihenfolge entspricht der visuellen/DOM-Reihenfolge im Panel: X-Button,
    // dann die Checkbox, dann der CTA-Button (die reinen Vorstellungstexte dazwischen
    // sind nicht interaktiv, brauchen also keinen eigenen Trap-Eintrag).
    function focusablesInPanel() {
      return [closeBtn, checkbox, ctaBtn].filter(Boolean);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        const f = focusablesInPanel();
        const idx = f.indexOf(document.activeElement);
        if (e.shiftKey) {
          if (idx <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        } else {
          if (idx === -1 || idx === f.length - 1) { e.preventDefault(); f[0].focus(); }
        }
      }
    }

    // returnFocusEl: optionales explizites Rücksprung-Ziel fürs Schließen -- Default
    // ist das gerade fokussierte Element (Normalfall). Der "Einführung"-Menüpunkt
    // übergibt stattdessen explizit navToggle (s. u.): er schließt selbst vorher das
    // Burgermenü (PZ.closeNav), wodurch der Menüpunkt-Button beim Schließen des
    // Onboardings längst unsichtbar (nicht mehr fokussierbar) wäre -- ohne diese
    // Übersteuerung bliebe der Fokus beim Schließen auf dem unsichtbaren X-Button hängen
    // (Chromium blurt ein fokussiertes Element nicht zuverlässig synchron, nur weil ein
    // Vorfahre display:none bekommt -- per Headless-Klicktest verifiziert).
    function open(returnFocusEl) {
      lastFocused = returnFocusEl || document.activeElement;
      // Checkbox spiegelt beim Öffnen immer den aktuell gespeicherten Stand -- egal ob
      // automatischer Erststart (dann unchecked) oder manueller Aufruf über "Einführung"
      // nach einem früheren "nicht mehr anzeigen" (dann checked).
      if (checkbox) checkbox.checked = readDontShow();
      overlay.hidden = false;
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    }
    PZ.openOnboarding = function () { open(); };

    function close() {
      overlay.hidden = true;
      document.removeEventListener('keydown', onKeydown);
      if (checkbox) writeDontShow(checkbox.checked);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (ctaBtn) ctaBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    if (menuItem) {
      menuItem.addEventListener('click', function () {
        // Burgermenü zuerst schließen -- zwei gleichzeitig offene position:fixed;inset:0-
        // Overlays wären verwirrend (doppelter abgedunkelter Hintergrund, zwei konkurrierende
        // Escape-Handler). restoreFocus=false: der Fokus wandert gleich weiter in dieses
        // Modal, statt kurz auf den Hamburger-Button zurückzuspringen.
        if (PZ.closeNav) PZ.closeNav(false);
        open($('navToggle'));
      });
    }

    // Automatisch beim allerersten Start zeigen (kein "nicht mehr anzeigen"-Flag gesetzt).
    // readDontShow() liefert false sowohl bei fehlendem als auch bei explizit '0'
    // gespeichertem Wert -- in beiden Fällen soll der Screen erscheinen.
    if (!readDontShow()) open();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})(window);
