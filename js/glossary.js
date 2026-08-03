/* glossary.js — Pizza-Glossar (v3.37.0): eigenständiger Menü-Bereich mit kurzen
 * Lexikon-Artikeln zu Begriffen und Hintergrundwissen rund um Pizza. Reine
 * Anzeige-Funktion, keine Interaktion mit dem Rechner/PZ.state.
 *
 * Seit v4.36.0 ("Glossar-Kachelregal", per /define-feature strukturiert, Vorschlag 2
 * eines dreier Design-Konzepte, vom Nutzer nach Live-Sichtung gewählt): das Glossar
 * startet als Regal aus 7 Kategoriekacheln mit Bannerbild (renderShelf) statt einer
 * reinen Textliste. Eine Kategorie wird als eigene Ansicht betreten (renderCategory,
 * mit Zurück-Weg ins Regal) -- NUR EINE Kategorie ist je Ansicht sichtbar (Preis dieses
 * Redesigns: "mehrere Kategorien gleichzeitig offen" entfällt ersatzlos, bewusst
 * akzeptiert, s. Feature-Definition). Innerhalb einer Kategorie bleibt das bereits
 * bestehende Single-Open-Akkordeon der Artikel unverändert (nur einer gleichzeitig
 * offen). Die Suche (renderSearch) verlässt beide Ebenen und liefert eine flache, nach
 * Kategorie gruppierte Trefferliste über ALLE Kategorien (Titel + Artikeltext), am
 * selben Suchfeld wie zuvor (#glossarySearch, unverändert an gleicher Stelle im
 * Markup). Leeren des Suchfelds kehrt zur vorherigen Ansicht zurück (Regal ODER die
 * zuvor geöffnete Kategorie) -- das ergibt sich von selbst, weil `state.cat` beim
 * Suchen unangetastet bleibt, s. render() unten.
 *
 * State (rein intern, kein PZ.state): { cat: <Kategorie-Key>|null, query: <String>,
 * openId: <Artikel-Id>|null }. `openId` ist bewusst EIN globaler Wert (nicht pro
 * Kategorie/Suche getrennt) -- da zu jedem Zeitpunkt ohnehin nur eine Artikelliste im
 * DOM steht (Kategorie-Ansicht ODER Suchtreffer, nie beides gleichzeitig), reicht das
 * für ein korrektes Single-Open-Verhalten über beide Fälle hinweg.
 *
 * Kategorie-Banner (3:1, PZ.imgHtml('glossary.cat.<key>', ...), js/images.js) werden
 * ZWEIMAL verwendet: klein auf der Regal-Kachel, groß mit Text-Overlay im
 * Kategoriekopf. Abgrenzung der Feature-Definition: KEIN Icon-Badge auf dem Banner
 * (weder Kachel noch Kategoriekopf) -- das Bild identifiziert die Kategorie bereits
 * ausreichend, Titel + Artikelzahl bleiben als Text. Das bestehende CAT_ICONS-Set
 * bleibt ausschließlich der Suchtrefferliste vorbehalten (dort gibt es kein
 * Bannerbild, s. renderSearch unten) -- unverändert seit v4.14.0, inkl. der beiden
 * Glyphen "techniques"/"tools", die im Design-Vorschlag zum Tausch vorgeschlagen,
 * aber laut Abgrenzung NICHT ausgetauscht wurden.
 *
 * Titel + Text jedes Artikels kommen weiterhin aus dem i18n-Wörterbuch (js/i18n-dict.js)
 * über `glossary.<id>.title` / `glossary.<id>.body` (DE+EN, body darf HTML enthalten,
 * wird per innerHTML gerendert). Die Kategorie-Überschriften kommen aus
 * `glossary.cat.<key>.title`.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Fachlich-thematische Quell-Reihenfolge (Mehl/Teig-Grundlagen → Techniken →
  // Vorteig-/Gärmethoden → Werkzeuge & Ausrüstung → Zutaten → Pizzabeläge →
  // Pizza-Stile) -- NICHT die Anzeige-Reihenfolge (die ist alphabetisch, s.
  // sortedCategories() unten), aber weiterhin die Zuordnungslogik: welche IDs gehören
  // zu welcher Kategorie.
  PZ.GLOSSARY_CATEGORIES = [
    { key: 'basics', ids: ['wwert', 'tipo00', 'baeckerprozente', 'hydration', 'eisMethode', 'gluten'] },
    { key: 'techniques', ids: ['stretchFold', 'windowpane', 'autolyse'] },
    { key: 'preferments', ids: ['poolish', 'biga', 'kalteGare', 'einfrieren', 'malzmehl'] },
    { key: 'tools', ids: ['ofenVsBackofen', 'ofenHeizarten', 'pizzastein', 'pizzaschieber', 'ofenthermometer', 'teigschaber', 'kuechenwaage', 'gaerbox'] },
    { key: 'ingredients', ids: ['sanMarzano', 'passata', 'fiorDiLatte', 'olivenoel', 'basilikum'] },
    { key: 'toppings', ids: ['belagMarinara', 'belagCapricciosa', 'belagDiavola', 'belagQuattroFormaggi', 'belagNachDemBacken'] },
    { key: 'styles', ids: ['echteNeapolitanische', 'margherita', 'napoletanaVsRomana', 'newYorkStyle', 'detroitStyle', 'sfincione'] }
  ];

  // Abgeleitete Flat-Liste, unverändert seit v4.14.0 -- bleibt für etwaigen anderen
  // Code, der die reine ID-Reihenfolge ohne Kategorien braucht, nutzbar.
  PZ.GLOSSARY_TOPICS = PZ.GLOSSARY_CATEGORIES.reduce(function (acc, cat) {
    return acc.concat(cat.ids);
  }, []);

  // Ein dezentes, monochromes Icon je Kategorie -- seit v4.36.0 AUSSCHLIESSLICH als
  // Gruppenmarke in der Suchtrefferliste genutzt (s. Kopfkommentar). Unverändert
  // gegenüber v4.14.0, inkl. der beiden nicht getauschten Glyphen.
  const CAT_ICONS = {
    basics: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="4" ry="8"/><path d="M12 4v16"/></svg>',
    techniques: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4"/></svg>',
    preferments: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6M10 2v4.5L6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6l-4-6.5V2"/><path d="M7.3 15h9.4"/></svg>',
    tools: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2 2.8-2.8Z"/></svg>',
    ingredients: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15Z"/><path d="M5.5 18.5c2-3.2 4.7-5.9 8-8"/></svg>',
    toppings: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 20h18L12 3Z"/><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none"/><circle cx="9.3" cy="16.5" r="1" fill="currentColor" stroke="none"/><circle cx="14.7" cy="16.5" r="1" fill="currentColor" stroke="none"/></svg>',
    styles: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>'
  };

  const listEl = $('glossaryList');
  if (!listEl) return; // keine Glossar-Ansicht auf dieser Seite -> Modul inaktiv

  const searchEl = $('glossarySearch');

  // state.cat bleibt beim Suchen UNANGETASTET (s. render() unten) -- das ist der
  // gesamte Mechanismus, der "Leeren des Suchfelds kehrt zur vorherigen Ansicht
  // zurück" implementiert, ganz ohne einen eigenen Snapshot-Mechanismus (anders als
  // die Vorgänger-Fassung vor v4.36.0, die dafür catOpenSnapshot brauchte).
  const state = { cat: null, query: '', openId: null };

  function norm(s) { return (s || '').toLowerCase(); }
  function lang() { return PZ.getLang ? PZ.getLang() : undefined; }

  function categoryOf(id) {
    const cat = PZ.GLOSSARY_CATEGORIES.filter(function (c) { return c.ids.indexOf(id) !== -1; })[0];
    return cat ? cat.key : null;
  }

  function sortedCategories() {
    return PZ.GLOSSARY_CATEGORIES.slice().sort(function (a, b) {
      return t('glossary.cat.' + a.key + '.title').localeCompare(t('glossary.cat.' + b.key + '.title'), lang(), { sensitivity: 'base' });
    });
  }

  function sortedIds(cat) {
    return cat.ids.slice().sort(function (a, b) {
      return t('glossary.' + a + '.title').localeCompare(t('glossary.' + b + '.title'), lang(), { sensitivity: 'base' });
    });
  }

  function articleCountLabel(n) {
    return n === 1 ? t('glossary.articleCountOne') : t('glossary.articleCountMany', { n: n });
  }
  function categoryCountLabel(n) {
    return n === 1 ? t('glossary.categoryCountOne') : t('glossary.categoryCountMany', { n: n });
  }

  // Baut das <span class="media media--3x1">…</span>-Markup aus dem Bild-Register
  // (js/images.js, Schicht 3 aus BILD-EINBAU-KONZEPT.md) und liefert es als echten
  // DOM-Knoten (statt eines Strings), damit der Aufrufer bei Bedarf noch ein
  // Overlay-Kind anhängen kann (s. renderCategory unten). Liefert null, wenn kein Bild
  // im Register steht (PZ.imgHtml() liefert dann '') -- der Aufrufer rendert in dem
  // Fall Titel/Artikelzahl ohne Bannerbild statt eines kaputten/leeren Rahmens.
  function bannerEl(key, extraClass) {
    if (!PZ.imgHtml) return null;
    const html = PZ.imgHtml(key, { extraClass: extraClass || '' });
    if (!html) return null;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.firstElementChild;
  }

  // Ein einzelner Artikel als <details class="glossary-item"> -- identisches Markup/
  // Verhalten wie vor v4.36.0 (unverändertes CSS), nur der Single-Open-Abgleich läuft
  // jetzt über den gemeinsamen state.openId statt einer reinen DOM-Abfrage aller
  // offenen .glossary-item in listEl (die bleibt als Umsetzungsdetail unten trotzdem
  // bestehen, weil zu jedem Zeitpunkt ohnehin nur EINE Artikelliste im DOM steht).
  function makeArticleDetails(id) {
    const details = document.createElement('details');
    details.className = 'glossary-item';
    details.dataset.id = id;
    if (state.openId === id) details.open = true;

    const summary = document.createElement('summary');
    summary.textContent = t('glossary.' + id + '.title');

    const body = document.createElement('div');
    body.className = 'glossary-body';
    body.innerHTML = t('glossary.' + id + '.body');

    details.appendChild(summary);
    details.appendChild(body);

    details.addEventListener('toggle', function () {
      if (details.open) {
        state.openId = id;
        Array.prototype.forEach.call(
          listEl.querySelectorAll('details.glossary-item[open]'),
          function (d) { if (d !== details) d.open = false; }
        );
      } else if (state.openId === id) {
        state.openId = null;
      }
    });
    return details;
  }

  // Ebene 1: Regal -- 7 Kategoriekacheln mit Bannerbild, Titel, Artikelzahl. KEIN Icon
  // (Abgrenzung Feature-Definition, s. Kopfkommentar).
  function renderShelf() {
    listEl.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'glossary-shelf';

    sortedCategories().forEach(function (cat) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'glossary-tile';
      tile.dataset.cat = cat.key;
      const count = cat.ids.length;
      tile.setAttribute('aria-label', t('glossary.cat.' + cat.key + '.title') + ': ' + articleCountLabel(count));

      const banner = bannerEl('glossary.cat.' + cat.key, 'glossary-tile-banner');
      if (banner) tile.appendChild(banner);

      const body = document.createElement('span');
      body.className = 'glossary-tile-body';
      const title = document.createElement('span');
      title.className = 'glossary-tile-title';
      title.textContent = t('glossary.cat.' + cat.key + '.title');
      const countEl = document.createElement('span');
      countEl.className = 'glossary-tile-count';
      countEl.textContent = articleCountLabel(count);
      body.appendChild(title);
      body.appendChild(countEl);
      tile.appendChild(body);

      tile.addEventListener('click', function () { enterCategory(cat.key); });
      grid.appendChild(tile);
    });

    listEl.appendChild(grid);
  }

  // Ebene 2: eine betretene Kategorie -- Zurück-Button, großer Bannerkopf mit
  // Titel/Artikelzahl-Overlay (kein Icon-Badge, s. Kopfkommentar), darunter die
  // Artikel als Single-Open-Akkordeon (unverändert seit v4.3.0).
  function renderCategory(catKey) {
    const cat = PZ.GLOSSARY_CATEGORIES.filter(function (c) { return c.key === catKey; })[0];
    if (!cat) { state.cat = null; renderShelf(); return; }

    listEl.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'glossary-back-btn';
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 6 8 12l6 6"></path></svg>';
    const backLabel = document.createElement('span');
    backLabel.textContent = t('btn.glossaryBack');
    backBtn.appendChild(backLabel);
    backBtn.addEventListener('click', function () {
      state.cat = null;
      state.openId = null;
      render();
      const prevTile = listEl.querySelector('.glossary-tile[data-cat="' + cat.key + '"]');
      if (prevTile) prevTile.focus({ preventScroll: true });
    });
    listEl.appendChild(backBtn);

    const count = cat.ids.length;
    const header = document.createElement('div');
    header.className = 'glossary-cat-header';
    const banner = bannerEl('glossary.cat.' + cat.key, 'glossary-cat-banner');
    let headingEl;
    if (banner) {
      const scrim = document.createElement('span');
      scrim.className = 'glossary-cat-banner-scrim';
      scrim.setAttribute('aria-hidden', 'true');
      banner.appendChild(scrim);
      const overlay = document.createElement('span');
      overlay.className = 'glossary-cat-banner-overlay';
      headingEl = document.createElement('h3');
      headingEl.className = 'glossary-cat-banner-title';
      headingEl.textContent = t('glossary.cat.' + cat.key + '.title');
      const countEl = document.createElement('span');
      countEl.className = 'glossary-cat-banner-count';
      countEl.textContent = articleCountLabel(count);
      overlay.appendChild(headingEl);
      overlay.appendChild(countEl);
      banner.appendChild(overlay);
      header.appendChild(banner);
    } else {
      // Kein Bild im Register (z. B. pending) -> Titel/Artikelzahl weiterhin als reiner
      // Text, kein kaputter/leerer Bildrahmen.
      headingEl = document.createElement('h3');
      headingEl.className = 'glossary-cat-title-plain';
      headingEl.textContent = t('glossary.cat.' + cat.key + '.title') + ' · ' + articleCountLabel(count);
      header.appendChild(headingEl);
    }
    listEl.appendChild(header);

    const list = document.createElement('div');
    list.className = 'glossary-cat-articles';
    sortedIds(cat).forEach(function (id) { list.appendChild(makeArticleDetails(id)); });
    listEl.appendChild(list);

    // Fokus auf die neue Kategorie-Überschrift (analog zu PZ.focusView() in js/nav.js) --
    // die Ansage des neuen Überschrift-Texts durch den Screenreader ersetzt hier eine
    // eigene Live-Region-Ansage (Fokus-Wechsel selbst ist das Signal, WCAG-konformes
    // SPA-Navigationsmuster, identisch zum bestehenden Vorbild in js/nav.js).
    if (headingEl) {
      if (!headingEl.hasAttribute('tabindex')) headingEl.setAttribute('tabindex', '-1');
      headingEl.focus({ preventScroll: true });
    }
  }

  function enterCategory(key) {
    state.cat = key;
    state.openId = null;
    render();
  }

  // Ebene 3: Suche -- verlässt Regal UND Kategorie, flache nach Kategorie gruppierte
  // Trefferliste über Titel + Artikeltext ALLER Kategorien. Kategorie-Icon (s.
  // CAT_ICONS) als Gruppenmarke, da hier kein Bannerbild zur Verfügung steht.
  function computeSearchResults(q) {
    const groups = [];
    let count = 0;
    sortedCategories().forEach(function (cat) {
      const ids = sortedIds(cat).filter(function (id) {
        const titleText = norm(t('glossary.' + id + '.title'));
        if (titleText.indexOf(q) !== -1) return true;
        const tmp = document.createElement('div');
        tmp.innerHTML = t('glossary.' + id + '.body');
        return norm(tmp.textContent).indexOf(q) !== -1;
      });
      if (ids.length) {
        groups.push({ cat: cat, ids: ids });
        count += ids.length;
      }
    });
    return { groups: groups, count: count };
  }

  function buildEmptyState() {
    const wrap = document.createElement('div');
    wrap.className = 'glossary-empty';
    const imgHtml = PZ.imgHtml ? PZ.imgHtml('glossary.emptySearch', { extraClass: 'glossary-empty-media' }) : '';
    if (imgHtml) wrap.insertAdjacentHTML('beforeend', imgHtml);
    const title = document.createElement('p');
    title.className = 'glossary-empty-title';
    title.textContent = t('glossary.noResults');
    const hint = document.createElement('p');
    hint.className = 'glossary-empty-hint';
    hint.textContent = t('glossary.emptyHint', { n: PZ.GLOSSARY_CATEGORIES.length });
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'glossary-empty-reset';
    resetBtn.textContent = t('btn.glossaryResetSearch');
    resetBtn.addEventListener('click', function () {
      if (searchEl) { searchEl.value = ''; searchEl.focus(); }
      state.query = '';
      render();
    });
    wrap.appendChild(title);
    wrap.appendChild(hint);
    wrap.appendChild(resetBtn);
    return wrap;
  }

  function renderSearch(q) {
    listEl.innerHTML = '';
    const res = computeSearchResults(q);

    // accessibility-expert-Befund (v4.14.0, BLOCKER, WCAG 4.1.3 Status Messages) --
    // unverändert übernommen: Fokus bleibt beim Tippen im Suchfeld, daher braucht die
    // Trefferzahl eine eigene Live-Region-Ansage statt eines Fokus-Wechsels.
    if (PZ.announce) {
      const msg = res.count === 0
        ? t('glossary.noResults')
        : (res.count === 1 ? t('glossary.searchResultsOne') : t('glossary.searchResultsMany', { n: res.count }));
      PZ.announce('glossarySearchLiveMsg', msg);
    }

    if (res.groups.length === 0) {
      listEl.appendChild(buildEmptyState());
      return;
    }

    const summary = document.createElement('p');
    summary.className = 'glossary-search-summary';
    summary.textContent = t('glossary.searchSummary', {
      articles: articleCountLabel(res.count),
      categories: categoryCountLabel(res.groups.length)
    });
    listEl.appendChild(summary);

    res.groups.forEach(function (g) {
      const groupEl = document.createElement('div');
      groupEl.className = 'glossary-search-group';
      const heading = document.createElement('div');
      heading.className = 'glossary-group-heading';
      const icon = document.createElement('span');
      icon.className = 'glossary-cat-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = CAT_ICONS[g.cat.key] || '';
      const label = document.createElement('span');
      label.textContent = t('glossary.cat.' + g.cat.key + '.title');
      heading.appendChild(icon);
      heading.appendChild(label);
      groupEl.appendChild(heading);
      g.ids.forEach(function (id) { groupEl.appendChild(makeArticleDetails(id)); });
      listEl.appendChild(groupEl);
    });
  }

  // Zentraler Dispatcher: Suche schlägt Kategorie schlägt Regal. state.cat bleibt beim
  // Suchen unangetastet (s. Kopfkommentar) -- das allein sorgt dafür, dass Leeren des
  // Suchfelds zur vorherigen Ansicht zurückkehrt.
  function render() {
    const q = norm(state.query).trim();
    if (q) renderSearch(q);
    else if (state.cat) renderCategory(state.cat);
    else renderShelf();
  }
  render();
  PZ.renderGlossary = render;

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      state.query = searchEl.value;
      render();
    });
  }

  // Sprachwechsel: komplette Neu-Darstellung der jeweils aktiven Ansicht (Regal/
  // Kategorie/Suche) in der neuen Sprache, neue alphabetische Sortierung. state.cat/
  // state.query/state.openId bleiben unverändert erhalten (kein Zurückspringen ins
  // Regal beim Sprachwechsel).
  if (PZ.i18nOnChange) PZ.i18nOnChange(render);

  // Glossar-Verweise in der Anleitung (v3.68.0, js/guide.js): springt aus einem
  // Anleitungsschritt heraus direkt zu einem bestimmten Glossar-Eintrag. Nutzt zuerst
  // PZ.gotoView('glossar') (js/nav.js) für den Bereichswechsel selbst -- identisch auf
  // Desktop (Burgermenü) und Mobil (Bottom-Tab-Leiste), da beide denselben
  // view-generischen [data-view]-Mechanismus nutzen. Seit v4.36.0: statt nur ein
  // <details> aufzuklappen, betritt der Sprung jetzt die passende KATEGORIE als eigene
  // Ansicht (der Artikel existiert nur noch dort im DOM, nicht mehr in einer flachen
  // Gesamtliste) -- "landet direkt beim aufgeklappten Artikel in seiner Kategorie" wie
  // in der Feature-Definition gefordert. Kein "Aus der Anleitung"-Badge (nicht Teil der
  // abgestimmten Feature-Definition, bewusst nicht ergänzt).
  function gotoGlossaryEntry(id) {
    if (PZ.gotoView) PZ.gotoView('glossar');
    const catKey = categoryOf(id);
    if (!catKey) return; // unbekannte ID -> kein Crash, kein Sprung
    if (searchEl && searchEl.value) searchEl.value = '';
    state.query = '';
    state.cat = catKey;
    state.openId = id;
    render();
    const details = listEl.querySelector('details.glossary-item[data-id="' + id + '"]');
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const summary = details.querySelector('summary');
    // <summary> ist nativ fokussierbar (Teil des <details>-Disclosure-Widgets), braucht
    // kein zusätzliches tabindex-Attribut. Überschreibt bewusst den Kategorie-
    // Überschrift-Fokus, den renderCategory() oben schon gesetzt hat -- das eigentliche
    // Sprungziel ist der einzelne Artikel, nicht nur die Kategorie.
    if (summary) summary.focus({ preventScroll: true });
  }
  PZ.gotoGlossaryEntry = gotoGlossaryEntry;
})(window);
