/* glossary.js — Pizza-Glossar (v3.37.0): eigenständiger Menü-Bereich mit kurzen
 * Lexikon-Artikeln zu Begriffen und Hintergrundwissen rund um Pizza. Reine
 * Anzeige-Funktion, keine Interaktion mit dem Rechner/PZ.state, keine
 * Verknüpfung aus bestehenden Hinweistexten (bewusst außerhalb des Scopes
 * dieser ersten Fassung, s. pizza-rechner-KONTEXT.md).
 *
 * Titel + Text jedes Artikels kommen aus dem i18n-Wörterbuch (js/i18n.js)
 * über die Keys `glossary.<id>.title` / `glossary.<id>.body` (DE+EN, body
 * darf HTML enthalten — z. B. <b>/<p>/<em> — analog zu anderen data-i18n-html-
 * artigen Textstellen in der App, wird hier aber direkt per innerHTML
 * gerendert, da js/glossary.js keine data-i18n-Attribute nutzt, sondern die
 * Liste komplett dynamisch aus PZ.GLOSSARY_TOPICS aufbaut).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Reihenfolge der IDs = Anzeige-Reihenfolge in der Liste. Bewusst eine
  // einfache, unkategorisierte Liste (kein Suchfeld, keine Kategorien-
  // Gruppierung über diese Reihenfolge hinaus, s. Abgrenzung der
  // Feature-Definition) — grob thematisch sortiert (Mehl/Teig-Grundlagen →
  // Techniken → Vorteig-/Gärmethoden → Werkzeuge & Ausrüstung [v3.65.0] →
  // Zutaten → Pizzabeläge [v3.65.0] → Pizza-Stile), aber ohne sichtbare
  // Zwischenüberschriften.
  PZ.GLOSSARY_TOPICS = [
    'wwert',
    'tipo00',
    'baeckerprozente',
    'hydration',
    'gluten',
    'stretchFold',
    'windowpane',
    'autolyse',
    'poolish',
    'biga',
    'kalteGare',
    'malzmehl',
    'ofenVsBackofen',
    'pizzastein',
    'pizzaschieber',
    'ofenthermometer',
    'teigschaber',
    'kuechenwaage',
    'gaerbox',
    'sanMarzano',
    'passata',
    'fiorDiLatte',
    'olivenoel',
    'basilikum',
    'belagMarinara',
    'belagCapricciosa',
    'belagDiavola',
    'belagQuattroFormaggi',
    'belagNachDemBacken',
    'echteNeapolitanische',
    'margherita',
    'napoletanaVsRomana',
    'newYorkStyle',
    'detroitStyle',
    'sfincione'
  ];

  const listEl = $('glossaryList');
  if (!listEl) return; // keine Glossar-Ansicht auf dieser Seite -> Modul inaktiv

  // Merkt sich, welche Einträge gerade geöffnet sind, damit ein Sprachwechsel
  // (renderGlossary() baut die Liste komplett neu auf, s. u.) den Aufklapp-
  // Zustand nicht zurücksetzt — sonst würde ein offener Artikel beim
  // Umschalten DE<->EN überraschend wieder zuklappen.
  function renderGlossary() {
    const openIds = new Set(
      Array.prototype.slice.call(listEl.querySelectorAll('details.glossary-item[open]'))
        .map(function (d) { return d.dataset.id; })
    );
    listEl.innerHTML = '';
    PZ.GLOSSARY_TOPICS.forEach(function (id) {
      const details = document.createElement('details');
      details.className = 'glossary-item';
      details.dataset.id = id;
      if (openIds.has(id)) details.open = true;

      const summary = document.createElement('summary');
      summary.textContent = t('glossary.' + id + '.title');

      const body = document.createElement('div');
      body.className = 'glossary-body';
      body.innerHTML = t('glossary.' + id + '.body');

      details.appendChild(summary);
      details.appendChild(body);
      listEl.appendChild(details);
    });
  }
  renderGlossary();
  PZ.renderGlossary = renderGlossary;

  // Sprachwechsel: komplette Neu-Darstellung (Titel + Text in der neuen
  // Sprache), Aufklapp-Zustand bleibt erhalten (s. o.).
  if (PZ.i18nOnChange) PZ.i18nOnChange(renderGlossary);
})(window);
