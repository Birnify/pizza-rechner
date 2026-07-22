/* nav.js — gemeinsames Burgermenü-Navigations-Modul (Desktop + Mobil, v3.54.0)
 *
 * Bis v3.53.0 als zwei eigenständige, praktisch identische Inline-<script>-Kopien in
 * pizza-rechner.html und pizza-rechner-mobile.html gepflegt — bewusste Entscheidung
 * beim ersten Bau der Desktop-Navigation (v3.26.0), um die bereits bewährte Mobil-
 * Implementierung nicht anzufassen (s. pizza-rechner-KONTEXT.md, Abschnitt
 * „Burgermenü-Navigation auch auf Desktop"). Jede künftige Menü-Erweiterung (z. B. die
 * gruppierte Navigation, v3.36.0) musste dadurch doppelt/dreifach gepflegt werden
 * (Desktop-Inline-Script, Mobil-Inline-Script, dessen Kopie im Standalone-Build).
 *
 * Ab v3.54.0 hierher ausgelagert — Mobil-Implementierung war die maßgebliche Referenz,
 * funktional 1:1 übernommen (KEINE Verhaltensänderung, reine Konsolidierung). Da dies
 * jetzt ein echtes js/*-Modul ist, zieht der Standalone-Build (build-mobile-standalone.py)
 * es automatisch inline mit — kein separates drittes Duplikat mehr nötig.
 *
 * Einzige tatsächliche Abweichung zwischen den beiden früheren Kopien: der jeweils
 * letzte fokussierbare Eintrag im Panel war ein plattform-spezifischer Cross-Link zur
 * jeweils anderen Ansicht (`#navMobileLink` auf dem Desktop, `#navDesktopLink` auf
 * Mobil) — hier per Feature-Erkennung vereinheitlicht (`crossLink` unten), weil auf
 * jeder Seite ohnehin nur einer der beiden Links im Markup existiert.
 *
 * Läuft bewusst als letztes Modul in der Ladereihenfolge (nach main.js, wie die
 * vorherigen Inline-Scripts es taten) — reine UI-Verdrahtung für bereits vorhandenes
 * Markup, rührt keine PZ-Rechenmodule an und wird von keinem anderen Modul beim Laden
 * gebraucht (nur `js/guide.js`s "Zeitplan"-Sprung ruft zur Klickzeit `PZ.gotoView()`
 * auf, s. dort — das liegt weit nach dem initialen Laden, Reihenfolge ist unkritisch).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  const navToggle = $('navToggle');
  const navOverlay = $('navMenu');
  const navClose = $('navClose');
  // panelItems: NUR die .nav-item-Buttons innerhalb des Burgermenü-Overlays (falls
  // vorhanden) -- ausschließlich für den Tab-Trap/die Anfangsfokussierung beim Öffnen
  // des Overlays gebraucht (focusablesInPanel()/openNav()). Existiert kein Overlay
  // (z. B. pizza-rechner-mobile.html seit v3.67.0, Bottom-Tab-Navigation ersetzt das
  // Burgermenü vollständig), bleibt dies einfach eine leere Liste -- openNav()/
  // onNavKeydown() werden dann ohnehin nie aufgerufen (kein Button, der sie auslöst).
  const panelItems = navOverlay ? Array.prototype.slice.call(navOverlay.querySelectorAll('.nav-item')) : [];
  // allNavItems: ALLE .nav-item-Buttons auf der Seite, unabhängig davon, ob sie in einem
  // Overlay-Panel liegen oder (seit v3.67.0) in einer persistenten Bottom-Tab-Leiste bzw.
  // einer eingebetteten Sekundär-Navigation (.calc-subnav) -- Grundlage für die
  // Klick-Verdrahtung und die Aktiv-Markierung in activateView() unten. Auf
  // pizza-rechner.html (Desktop, unverändertes Burgermenü) ist das identisch zu
  // panelItems, da dort alle .nav-item-Elemente ohnehin nur im Overlay vorkommen.
  const allNavItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
  // Plattform-übergreifender Cross-Link: nur einer der beiden existiert je nach Seite
  // (#navMobileLink auf pizza-rechner.html, #navDesktopLink auf pizza-rechner-mobile.html
  // bzw. dessen Standalone-Build).
  const crossLink = $('navMobileLink') || $('navDesktopLink');
  const viewEls = Array.prototype.slice.call(document.querySelectorAll('[data-view]')).filter(function (el) {
    return el.closest && !el.closest('.nav-overlay');
  });
  let lastFocused = null;

  // Reihenfolge entspricht der DOM-/visuellen Reihenfolge im Panel: Schließen-Button,
  // die vier Bereichs-Buttons, zuletzt der Cross-Link (eigenes <a>, kein .nav-item —
  // navigiert weg statt eine Ansicht umzuschalten, s. activateView-Klick-Handler unten).
  function focusablesInPanel() {
    return [navClose].concat(panelItems).concat(crossLink ? [crossLink] : []);
  }

  function onNavKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeNav(); return; }
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

  function openNav() {
    if (!navOverlay) return;
    lastFocused = document.activeElement;
    navOverlay.hidden = false;
    navToggle.setAttribute('aria-expanded', 'true');
    const current = panelItems.filter(function (b) { return b.classList.contains('active'); })[0] || panelItems[0];
    if (current) current.focus(); else if (navClose) navClose.focus();
    document.addEventListener('keydown', onNavKeydown);
  }

  // restoreFocus=false wird nur beim Bereichswechsel per Klick auf ein .nav-item
  // genutzt — dort soll der Fokus NICHT auf den Hamburger-Button zurückspringen,
  // sondern (per focusView, s. u.) in den neu sichtbaren Bereich wandern.
  function closeNav(restoreFocus) {
    if (!navOverlay) return;
    navOverlay.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onNavKeydown);
    if (restoreFocus !== false) (lastFocused || navToggle).focus();
  }

  function activateView(view) {
    viewEls.forEach(function (el) {
      if (el.getAttribute('data-view') === view) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    allNavItems.forEach(function (b) {
      // data-goto-group (v3.67.0, Bottom-Tab-Navigation): der Haupt-Tab "Rechner" auf
      // pizza-rechner-mobile.html bleibt optisch aktiv, solange einer seiner drei
      // Unterbereiche (Rechner/Rezepte/Zeitplan) sichtbar ist -- die eigentliche
      // Umschaltung zwischen den dreien läuft über die separate .calc-subnav, deren
      // eigene Buttons weiterhin exakt (nicht als Gruppe) auf data-goto matchen.
      // Ohne data-goto-group-Attribut (Desktop, alle übrigen Mobil-Tabs) ist das
      // Verhalten exakt wie zuvor: 1:1-Vergleich mit data-goto.
      const group = b.getAttribute('data-goto-group');
      const isActive = group ? group.split(',').indexOf(view) !== -1 : b.getAttribute('data-goto') === view;
      b.classList.toggle('active', isActive);
      if (isActive) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }

  // Nach einem Bereichswechsel bekommen Screenreader-Nutzer sonst keinerlei
  // Rückmeldung, dass sich der sichtbare Inhalt komplett ausgetauscht hat
  // (WCAG 4.1.3 Status Messages) — Live-Region-Ansage + Fokus auf die erste
  // Überschrift des neuen Bereichs (analog zum SPA-Routenwechsel-Muster).
  // Seit v3.58.0 über den gemeinsamen Helfer PZ.announce() (js/dom.js,
  // Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort). Nebenbefund beim
  // Konsolidieren gefunden: diese Stelle hatte VORHER keinen Generation-Zähler — bei
  // zwei schnellen Bereichswechseln hintereinander (z. B. Menü öffnen, "Rechner"
  // anklicken, obwohl "Rechner" schon aktiv ist) hätte der ältere, verzögerte
  // setTimeout die neuere Ansage überschreiben können. Die Migration auf
  // PZ.announce() behebt das automatisch mit, da der Helfer den Zähler immer hat.
  function announceView(label) {
    PZ.announce('viewAnnounce', PZ.t ? PZ.t('nav.viewAnnounce', { label: label }) : ('Ansicht: ' + label));
  }

  function focusView(view) {
    const h = document.querySelector('[data-view="' + view + '"] h2');
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }

  // Wechselt die Ansicht identisch zum Klick auf einen Menüpunkt, aber OHNE über
  // das Bereiche-Menü zu gehen — genutzt vom klickbaren "Zeitplan"-Sprung im
  // Anleitungs-Banner ohne Zeitangabe (v3.38.0-Fix, s. js/guide.js). closeNav(false)
  // ist hier defensiv/für den unwahrscheinlichen Fall, dass das Menü doch offen ist.
  function gotoView(view) {
    const item = allNavItems.filter(function (b) { return b.getAttribute('data-goto') === view; })[0];
    activateView(view);
    announceView(item ? item.textContent : view);
    closeNav(false);
    focusView(view);
  }
  PZ.gotoView = gotoView;
  // Export für js/onboarding.js (v3.63.0): der "Einführung"-Menüpunkt schließt das
  // Burgermenü, bevor er das Onboarding-Modal öffnet (zwei gleichzeitig offene
  // position:fixed;inset:0-Overlays wären verwirrend). restoreFocus=false, weil der
  // Fokus direkt danach ins neu geöffnete Onboarding-Modal wandert, nicht zurück auf
  // den Hamburger-Button. Auf Mobil (seit v3.67.0 kein Burgermenü mehr) no-op, s.
  // closeNav() oben ("if (!navOverlay) return;").
  PZ.closeNav = closeNav;

  // Overlay-spezifische Verdrahtung (Öffnen/Schließen-Button, Klick auf den abgedunkelten
  // Hintergrund): nur relevant, wenn es überhaupt ein Burgermenü-Overlay gibt (Desktop,
  // s. pizza-rechner.html). Auf pizza-rechner-mobile.html existiert seit v3.67.0 weder
  // #navToggle noch #navMenu (Bottom-Tab-Navigation ersetzt das Burgermenü vollständig) --
  // dieser Block bleibt dort einfach ungenutzt.
  if (navToggle && navOverlay) {
    navToggle.addEventListener('click', function () {
      if (navOverlay.hidden) openNav(); else closeNav();
    });
    navClose.addEventListener('click', function () { closeNav(); });
    navOverlay.addEventListener('click', function (e) {
      if (e.target === navOverlay) closeNav();
    });
  }

  // Klick-Verdrahtung für ALLE .nav-item-Buttons auf der Seite (Burgermenü-Einträge auf
  // Desktop, Bottom-Tab-Leiste + Sekundär-Navigation .calc-subnav auf Mobil seit v3.67.0)
  // -- läuft bewusst UNABHÄNGIG vom Overlay-Block oben, da die Bottom-Tab-Navigation ohne
  // jedes Overlay auskommt (persistente Leiste statt Ein-/Ausklappen).
  allNavItems.forEach(function (b) {
    b.addEventListener('click', function () {
      const view = b.getAttribute('data-goto');
      // Menüpunkte ohne eigenen data-goto (z. B. "Einführung", v3.63.0) sind keine
      // Bereichs-Wechsel -- die werden von ihrem eigenen Modul separat verdrahtet
      // (js/onboarding.js). Ohne diesen Guard würde activateView(undefined) ALLE
      // [data-view]-Bereiche verstecken, da keiner das leere data-goto matcht.
      if (!view) return;
      activateView(view);
      announceView(b.textContent);
      closeNav(false);
      focusView(view);
    });
  });
})(window);
