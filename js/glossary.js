/* glossary.js — Pizza-Glossar (v3.37.0): eigenständiger Menü-Bereich mit kurzen
 * Lexikon-Artikeln zu Begriffen und Hintergrundwissen rund um Pizza. Reine
 * Anzeige-Funktion, keine Interaktion mit dem Rechner/PZ.state, keine
 * Verknüpfung aus bestehenden Hinweistexten (bewusst außerhalb des Scopes
 * dieser ersten Fassung, s. pizza-rechner-KONTEXT.md).
 *
 * Seit v4.3.0 (Design-System-Import Zyklus 4, Backlog Punkt F): Single-Open-
 * Akkordeon -- klappt ein Artikel auf, klappt der zuvor offene automatisch zu
 * (max. ein Artikel gleichzeitig offen). Gilt identisch auf Desktop und Mobil,
 * da beide Seiten dieses Modul laden.
 *
 * Seit v4.14.0 (Backlog "Glossar-Gruppierung", per /define-feature strukturiert,
 * plus zwei Nachtrags-Anforderungen aus derselben Runde): die vorher rein interne
 * thematische Sortierung ist jetzt als sichtbare, auf-/zuklappbare Kategorie-
 * Zwischenüberschriften gerendert (PZ.GLOSSARY_CATEGORIES ersetzt die vorherige
 * flache PZ.GLOSSARY_TOPICS als Quelle -- letztere bleibt als abgeleitete
 * Flat-Liste erhalten, falls anderer Code sie erwartet), plus ein Suchfeld
 * (#glossarySearch), das Titel UND Artikeltext filtert (Teilstring,
 * case-insensitive). Sowohl die Kategorien selbst als auch die Artikel
 * INNERHALB jeder Kategorie werden bei jedem Render alphabetisch nach ihrem
 * (sprachabhängigen) Titel sortiert -- daher live per localeCompare() statt
 * einer festen Reihenfolge im Datenmodell (PZ.GLOSSARY_CATEGORIES bleibt die
 * fachlich-thematisch geordnete Quelle, nur die ANZEIGE-Reihenfolge ist
 * alphabetisch). Eine Kategorie wird beim Filtern komplett ausgeblendet,
 * sobald kein Artikel darunter mehr zum Suchbegriff passt; treffen gar keine
 * Artikel mehr zu, erscheint #glossaryNoResults.
 *
 * Kategorien sind eigene <details>-Elemente (Summary = Kategorie-Überschrift),
 * VERSCHACHTELT um die einzelnen Artikel-<details> -- bewusst KEIN Single-Open
 * zwischen Kategorien (anders als bei den Artikeln): mehrere Kategorien dürfen
 * gleichzeitig offen sein, weil hier nicht "eine Definition lesen" (wo ein
 * einzelner langer Textblock im Fokus stehen soll), sondern "den Überblick
 * behalten/scannen" das Ziel ist -- das Single-Open-Akkordeon-Verhalten bleibt
 * ausschließlich zwischen einzelnen ARTIKELN bestehen, unverändert. Default:
 * alle Kategorien starten offen (unverändertes Bild ggü. vor v4.14.0, wo alles
 * immer sichtbar war); der Auf-/Zu-Zustand jeder Kategorie bleibt über
 * Sprachwechsel hinweg erhalten (analog zum offenen Artikel). Während eine
 * Suche aktiv ist, werden alle Kategorien zwangsweise geöffnet (sonst
 * verschwänden Treffer in einer manuell zugeklappten Kategorie) -- der
 * manuelle Zustand wird beim Leeren des Suchfelds wiederhergestellt.
 *
 * Titel + Text jedes Artikels kommen aus dem i18n-Wörterbuch (js/i18n.js)
 * über die Keys `glossary.<id>.title` / `glossary.<id>.body` (DE+EN, body
 * darf HTML enthalten — z. B. <b>/<p>/<em> — analog zu anderen data-i18n-html-
 * artigen Textstellen in der App, wird hier aber direkt per innerHTML
 * gerendert, da js/glossary.js keine data-i18n-Attribute nutzt, sondern die
 * Liste komplett dynamisch aus PZ.GLOSSARY_CATEGORIES aufbaut). Die
 * Kategorie-Überschriften selbst kommen aus `glossary.cat.<key>.title`.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Fachlich-thematische Quell-Reihenfolge (Mehl/Teig-Grundlagen → Techniken →
  // Vorteig-/Gärmethoden → Werkzeuge & Ausrüstung [v3.65.0] → Zutaten →
  // Pizzabeläge [v3.65.0] → Pizza-Stile) -- seit v4.14.0 NICHT mehr die
  // Anzeige-Reihenfolge (die ist alphabetisch, s. renderGlossary() unten),
  // aber weiterhin die sinnvolle Gruppierungs-/Zuordnungslogik: welche IDs
  // gehören zu welcher Kategorie.
  PZ.GLOSSARY_CATEGORIES = [
    { key: 'basics', ids: ['wwert', 'tipo00', 'baeckerprozente', 'hydration', 'eisMethode', 'gluten'] },
    { key: 'techniques', ids: ['stretchFold', 'windowpane', 'autolyse'] },
    { key: 'preferments', ids: ['poolish', 'biga', 'kalteGare', 'einfrieren', 'malzmehl'] },
    { key: 'tools', ids: ['ofenVsBackofen', 'ofenHeizarten', 'pizzastein', 'pizzaschieber', 'ofenthermometer', 'teigschaber', 'kuechenwaage', 'gaerbox'] },
    { key: 'ingredients', ids: ['sanMarzano', 'passata', 'fiorDiLatte', 'olivenoel', 'basilikum'] },
    { key: 'toppings', ids: ['belagMarinara', 'belagCapricciosa', 'belagDiavola', 'belagQuattroFormaggi', 'belagNachDemBacken'] },
    { key: 'styles', ids: ['echteNeapolitanische', 'margherita', 'napoletanaVsRomana', 'newYorkStyle', 'detroitStyle', 'sfincione'] }
  ];

  // Abgeleitete Flat-Liste, identisch zur vor v4.14.0 einzigen Quelle
  // PZ.GLOSSARY_TOPICS -- bleibt für etwaigen anderen Code, der die reine
  // ID-Reihenfolge ohne Kategorien braucht, unverändert nutzbar.
  PZ.GLOSSARY_TOPICS = PZ.GLOSSARY_CATEGORIES.reduce(function (acc, cat) {
    return acc.concat(cat.ids);
  }, []);

  // Ein dezentes, monochromes Icon je Kategorie vor der Überschrift (Nachtrag
  // zur v4.14.0-Runde: analog zum bestehenden `.card-icon`-Linien-Icon-Muster
  // vor jedem Card-Titel, hier aber kleiner (14x14 statt 20x20) und mit
  // `stroke="currentColor"`, damit es automatisch die gedeckte
  // Überschrift-Farbe (`var(--muted)`) übernimmt statt eine eigene Farbe zu
  // brauchen -- bewusst KEIN bunter Icon-Zoo. Rein dekorativ (aria-hidden auf
  // dem Wrapper-Span in renderGlossary() unten), verändert den Accessible
  // Name der Kategorie-<summary> nicht.
  const CAT_ICONS = {
    // Mehl & Teig-Grundlagen: stilisiertes Getreidekorn (Ellipse + Mittelrille).
    basics: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="4" ry="8"/><path d="M12 4v16"/></svg>',
    // Techniken: Dehnen-Symbol (Doppelpfeil), analog zu Stretch & Fold.
    techniques: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/></svg>',
    // Vorteig & Gärmethoden: Glas/Behälter mit Vorteig (analog Poolish/Biga im Glas).
    preferments: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v4.5L6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6l-4-6.5V2"/><path d="M7.3 15h9.4"/></svg>',
    // Werkzeuge & Ausrüstung: Schraubenschlüssel.
    tools: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z"/></svg>',
    // Zutaten: Blatt (frische Zutaten wie Basilikum/Olivenöl/Tomaten).
    ingredients: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15Z"/><path d="M5.5 18.5c2-3.2 4.7-5.9 8-8"/></svg>',
    // Pizzabeläge: Pizzastück mit Belag-Punkten.
    toppings: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 20h18L12 3Z"/><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="9.3" cy="16.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="16.5" r="1" fill="currentColor" stroke="none"/></svg>',
    // Pizza-Stile: ganze Pizza (Kreis, geviertelt) -- bewusst als GANZE Pizza statt
    // Stück, zur optischen Abgrenzung von "toppings" (Stück) oben.
    styles: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>'
  };

  const listEl = $('glossaryList');
  if (!listEl) return; // keine Glossar-Ansicht auf dieser Seite -> Modul inaktiv

  const searchEl = $('glossarySearch');
  const noResultsEl = $('glossaryNoResults');
  let currentQuery = '';
  // Snapshot der manuellen Kategorie-Auf/Zu-Zustände, angelegt beim Start einer
  // Suche (leer -> nicht-leer) und wiederhergestellt, sobald das Suchfeld
  // wieder geleert wird (s. applyFilter() unten).
  let catOpenSnapshot = null;

  function norm(s) { return (s || '').toLowerCase(); }
  function lang() { return PZ.getLang ? PZ.getLang() : undefined; }

  // Filtert die BEREITS gerenderte Liste anhand von currentQuery (Titel ODER
  // Artikeltext, Teilstring, case-insensitive) -- läuft nach jedem
  // renderGlossary()-Aufbau (Sprachwechsel/Erststart) und bei jeder Eingabe
  // ins Suchfeld. Kategorien ohne verbleibenden sichtbaren Artikel werden
  // komplett ausgeblendet (`hidden`-Attribut, kein separates CSS nötig).
  // Während q nicht leer ist, werden alle Kategorien zwangsweise geöffnet
  // (sonst blieben Treffer in einer manuell zugeklappten Kategorie unsichtbar);
  // beim Leeren von q wird der Zustand von vor der Suche wiederhergestellt.
  function applyFilter() {
    const q = norm(currentQuery).trim();
    const catEls = Array.prototype.slice.call(listEl.querySelectorAll('.glossary-category'));

    if (q && !catOpenSnapshot) {
      catOpenSnapshot = new Map();
      catEls.forEach(function (catEl) { catOpenSnapshot.set(catEl.dataset.cat, catEl.open); });
    }

    let anyVisible = false;
    let matchCount = 0;
    catEls.forEach(function (catEl) {
      let catVisible = false;
      Array.prototype.forEach.call(catEl.querySelectorAll('details.glossary-item'), function (item) {
        const titleText = norm(item.querySelector('summary').textContent);
        const bodyText = norm(item.querySelector('.glossary-body').textContent);
        const match = !q || titleText.indexOf(q) !== -1 || bodyText.indexOf(q) !== -1;
        item.hidden = !match;
        if (match) { catVisible = true; matchCount++; }
      });
      catEl.hidden = !catVisible;
      if (catVisible) anyVisible = true;

      if (q) {
        catEl.open = true;
      } else if (catOpenSnapshot) {
        catEl.open = catOpenSnapshot.has(catEl.dataset.cat) ? catOpenSnapshot.get(catEl.dataset.cat) : true;
      }
    });

    if (!q) catOpenSnapshot = null;
    if (noResultsEl) noResultsEl.hidden = anyVisible;

    // accessibility-expert-Befund (v4.14.0, BLOCKER, WCAG 4.1.3 Status Messages):
    // das Ein-/Ausblenden von Kategorien/Artikeln + #glossaryNoResults beim Filtern
    // war rein visuell, ohne Ansage für Screenreader-Nutzer. Nur ansagen, solange
    // eine Suche aktiv ist (q nicht leer) -- beim Leeren des Suchfelds ist die
    // Rückkehr zur vollständigen Liste kein meldepflichtiger Status. PZ.announce()
    // übernimmt Clear-then-delayed-set + Generation-Zähler, daher unproblematisch
    // bei schnellem Tippen (jede Eingabe ruft applyFilter() erneut auf).
    if (q && PZ.announce) {
      const msg = matchCount === 0
        ? t('glossary.noResults')
        : (matchCount === 1 ? t('glossary.searchResultsOne') : t('glossary.searchResultsMany', { n: matchCount }));
      PZ.announce('glossarySearchLiveMsg', msg);
    }
  }

  // Merkt sich, welche Einträge/Kategorien gerade geöffnet sind, damit ein
  // Sprachwechsel (renderGlossary() baut die Liste komplett neu auf, s. u.)
  // beides nicht zurücksetzt — sonst würde ein offener Artikel bzw. eine
  // aufgeklappte Kategorie beim Umschalten DE<->EN überraschend wieder
  // zuklappen. Kategorien ohne vorherigen Eintrag (== erster Render) starten
  // offen (Default, s. Datei-Kopfkommentar).
  function renderGlossary() {
    const openIds = new Set(
      Array.prototype.slice.call(listEl.querySelectorAll('details.glossary-item[open]'))
        .map(function (d) { return d.dataset.id; })
    );
    const openCats = new Map(
      Array.prototype.slice.call(listEl.querySelectorAll('.glossary-category'))
        .map(function (d) { return [d.dataset.cat, d.open]; })
    );
    listEl.innerHTML = '';

    // Kategorien alphabetisch nach ihrem (sprachabhängigen) Label sortieren --
    // eine Kopie, PZ.GLOSSARY_CATEGORIES selbst bleibt in der fachlich-
    // thematischen Quell-Reihenfolge unangetastet (s. Kommentar dort).
    const sortedCats = PZ.GLOSSARY_CATEGORIES.slice().sort(function (a, b) {
      return t('glossary.cat.' + a.key + '.title').localeCompare(t('glossary.cat.' + b.key + '.title'), lang(), { sensitivity: 'base' });
    });

    sortedCats.forEach(function (cat) {
      const catEl = document.createElement('details');
      catEl.className = 'glossary-category';
      catEl.dataset.cat = cat.key;
      catEl.open = openCats.has(cat.key) ? openCats.get(cat.key) : true;

      const summary = document.createElement('summary');
      summary.className = 'glossary-cat-heading';
      const icon = document.createElement('span');
      icon.className = 'glossary-cat-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = CAT_ICONS[cat.key] || '';
      const label = document.createElement('span');
      label.textContent = t('glossary.cat.' + cat.key + '.title');
      summary.appendChild(icon);
      summary.appendChild(label);
      catEl.appendChild(summary);

      // Artikel INNERHALB der Kategorie ebenfalls alphabetisch nach Titel
      // sortiert (statt der bisherigen internen Reihenfolge).
      const sortedIds = cat.ids.slice().sort(function (a, b) {
        return t('glossary.' + a + '.title').localeCompare(t('glossary.' + b + '.title'), lang(), { sensitivity: 'base' });
      });

      sortedIds.forEach(function (id) {
        const details = document.createElement('details');
        details.className = 'glossary-item';
        details.dataset.id = id;
        if (openIds.has(id)) details.open = true;

        const itemSummary = document.createElement('summary');
        itemSummary.textContent = t('glossary.' + id + '.title');

        const body = document.createElement('div');
        body.className = 'glossary-body';
        body.innerHTML = t('glossary.' + id + '.body');

        details.appendChild(itemSummary);
        details.appendChild(body);
        // Single-Open-Akkordeon (Backlog Punkt F, v4.3.0): sobald dieser Artikel
        // aufklappt, alle anderen offenen Artikel automatisch zuklappen -- nur
        // einer gleichzeitig sichtbar, unabhängig von der Kategorie (Kategorien
        // selbst sind NICHT Teil dieses Single-Open-Verhaltens, s.
        // Datei-Kopfkommentar). Der native "toggle"-Event feuert auch bei
        // programmatisch gesetztem .open (z. B. gotoGlossaryEntry() unten),
        // daher reicht dieser eine Listener pro Artikel, kein zusätzliches
        // Klick-Wiring.
        details.addEventListener('toggle', function () {
          if (!details.open) return;
          Array.prototype.forEach.call(
            listEl.querySelectorAll('details.glossary-item[open]'),
            function (d) { if (d !== details) d.open = false; }
          );
        });
        catEl.appendChild(details);
      });

      listEl.appendChild(catEl);
    });
    applyFilter();
  }
  renderGlossary();
  PZ.renderGlossary = renderGlossary;

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      currentQuery = searchEl.value;
      applyFilter();
    });
  }

  // Sprachwechsel: komplette Neu-Darstellung (Titel + Text in der neuen
  // Sprache, neue alphabetische Sortierung), Aufklapp-Zustand (Artikel UND
  // Kategorien) sowie aktueller Suchbegriff bleiben erhalten (s. o. bzw.
  // currentQuery, angewandt am Ende von renderGlossary()).
  if (PZ.i18nOnChange) PZ.i18nOnChange(renderGlossary);

  // Glossar-Verweise in der Anleitung (v3.68.0, js/guide.js): springt aus einem
  // Anleitungsschritt heraus direkt zu einem bestimmten Glossar-Eintrag. Nutzt zuerst
  // PZ.gotoView('glossar') (js/nav.js) für den Bereichswechsel selbst -- das funktioniert
  // identisch auf Desktop (Burgermenü) und Mobil (Bottom-Tab-Leiste seit v3.67.0), da
  // beide denselben view-generischen [data-view]-Mechanismus nutzen, unabhängig davon,
  // über welches Navigations-Widget die jeweilige Seite den Bereich wechselt. Klappt
  // danach den passenden <details>-Eintrag auf, scrollt ihn ins Bild und verschiebt den
  // Fokus dorthin -- überschreibt bewusst den generischen Überschrift-Fokus, den
  // gotoView() selbst schon gesetzt hat: das eigentliche Ziel hier ist der einzelne
  // Eintrag, nicht nur die Bereichs-Überschrift "Pizza-Glossar".
  function gotoGlossaryEntry(id) {
    if (PZ.gotoView) PZ.gotoView('glossar');
    // Seit v4.14.0 (Suchfeld): ein aktiver Filter könnte das Sprungziel per
    // `hidden` ausblenden -- Suchfeld vor dem Sprung zurücksetzen, damit der
    // angesprungene Eintrag garantiert sichtbar ist.
    if (searchEl && searchEl.value) {
      searchEl.value = '';
      currentQuery = '';
      applyFilter();
    }
    const details = listEl.querySelector('details.glossary-item[data-id="' + id + '"]');
    if (!details) return; // unbekannte/falsche ID -> kein Crash, einfach kein Sprung
    // Seit v4.14.0 (auf-/zuklappbare Kategorien): die umgebende Kategorie muss
    // offen sein, sonst ist der Artikel als Nachfahre eines geschlossenen
    // <details> weder sichtbar noch fokussierbar.
    const parentCat = details.closest('.glossary-category');
    if (parentCat) parentCat.open = true;
    // Vor dem Öffnen explizit alle anderen schließen (Single-Open-Akkordeon) --
    // unabhängig davon, ob der "toggle"-Listener in renderGlossary() bei diesem
    // programmatischen Set zuverlässig feuert.
    Array.prototype.forEach.call(
      listEl.querySelectorAll('details.glossary-item[open]'),
      function (d) { if (d !== details) d.open = false; }
    );
    details.open = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const summary = details.querySelector('summary');
    // <summary> ist nativ fokussierbar (Teil des <details>-Disclosure-Widgets), braucht
    // anders als z. B. eine <h2> KEIN zusätzliches tabindex-Attribut (vgl. focusView()
    // in js/nav.js, das dafür extra tabindex="-1" auf die Überschrift setzt).
    if (summary) summary.focus({ preventScroll: true });
  }
  PZ.gotoGlossaryEntry = gotoGlossaryEntry;
})(window);
