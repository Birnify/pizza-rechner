/* flour.js — Mehl-Datenbank + Dropdown-Befüllung (Quelle: pizza1.de/blog/pizzamehl-uebersicht/) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // minH = mind. Gärzeit (h), damit das starke Gluten relaxt; maxH = max. bevor die Struktur abbaut
  // durKey = Wörterbuch-Key für den Anzeige-Text im Dropdown (js/i18n.js, "flour.dur.*")
  // minH = Reifezeit, unter der DIESES (starke) Mehl springig/untergar bleibt (0 = keine).
  //        Nur wirklich starke Mehle brauchen wirklich lange Gare → sonst 0.
  // maxH = Reifezeit, ab der das Gluten abbaut (168 = praktisch unbegrenzt, Anzeige „72 h+").
  // Mehlnamen (z. B. "Caputo Pizzeria Tradizionale") und Gruppen (z. B. "Molino Caputo")
  // sind Markennamen/Eigennamen und bleiben bewusst UNÜBERSETZT — nur der "dur"-Anzeige-
  // Text (reine Zeitangabe) kommt über t() aus dem Wörterbuch.
  PZ.FLOURS = {
    // Molino Caputo
    caputo_pizzeria:     { group: 'Molino Caputo', name: 'Caputo Pizzeria Tradizionale',  w: 270, minH:  0, maxH:  48, hydMin: 60, hydMax: 65, durKey: 'flour.dur.upTo48h' },
    caputo_nuvola:       { group: 'Molino Caputo', name: 'Caputo Nuvola',                 w: 280, minH: 12, maxH:  48, hydMin: 60, hydMax: 65, durKey: 'flour.dur.24to48h' },
    caputo_cuoco:        { group: 'Molino Caputo', name: 'Caputo Cuoco / Chef',           w: 310, minH: 16, maxH: 168, hydMin: 65, hydMax: 70, durKey: 'flour.dur.24hTo72hPlus' },
    caputo_nuvola_super: { group: 'Molino Caputo', name: 'Caputo Nuvola Super',           w: 330, minH: 24, maxH: 168, hydMin: 70, hydMax: 85, durKey: 'flour.dur.24hTo72hPlus' },
    caputo_tipo1:        { group: 'Molino Caputo', name: 'Caputo Tipo 1',                 w: 260, minH:  0, maxH: 168, hydMin: 65, hydMax: 70, durKey: 'flour.dur.upTo72hPlus' },
    caputo_manitoba:     { group: 'Molino Caputo', name: 'Caputo Manitoba Oro',           w: 380, minH: 48, maxH: 168, hydMin: 70, hydMax: 85, durKey: 'flour.dur.72hPlus' },
    // Molino Dallagiovanna
    dallag_napoletana:   { group: 'Molino Dallagiovanna', name: 'laNapoletana',           w: 310, minH: 16, maxH:  48, hydMin: 60, hydMax: 65, durKey: 'flour.dur.24to48h' },
    dallag_monica:       { group: 'Molino Dallagiovanna', name: 'leDevine Monica',        w: 300, minH: 12, maxH:  72, hydMin: 65, hydMax: 70, durKey: 'flour.dur.24to72h' },
    dallag_sofia:        { group: 'Molino Dallagiovanna', name: 'leDevine Sofia',         w: 180, minH:  0, maxH:  24, hydMin: 60, hydMax: 65, durKey: 'flour.dur.upTo24h' },
    dallag_anna:         { group: 'Molino Dallagiovanna', name: 'leDevine Anna',          w: 380, minH: 48, maxH: 168, hydMin: 70, hydMax: 85, durKey: 'flour.dur.72hPlus' },
    dallag_uniqua:       { group: 'Molino Dallagiovanna', name: 'UNIQUA Blu',             w: 380, minH: 48, maxH: 168, hydMin: 70, hydMax: 85, durKey: 'flour.dur.72hPlus' },
    // Teichners Beste
    teichner_00:         { group: 'Teichners Beste', name: 'Teichners Beste 00',          w: 240, minH:  0, maxH:  72, hydMin: 65, hydMax: 70, durKey: 'flour.dur.upTo72h' },
    teichner_1:          { group: 'Teichners Beste', name: 'Teichners Beste 1',           w: 280, minH: 12, maxH: 168, hydMin: 70, hydMax: 85, durKey: 'flour.dur.24hTo72hPlus' }
  };

  PZ.getFlour = function () {
    return PZ.FLOURS[PZ.state.flour] || PZ.FLOURS['caputo_pizzeria'];
  };

  // Dropdown aus der Datenbank befüllen (eine Quelle, keine Duplikation im HTML)
  function renderFlourOptions() {
    const sel = $('flour');
    if (!sel) return;
    const prevValue = sel.value || PZ.state.flour;
    sel.innerHTML = '';
    const groups = {};
    Object.keys(PZ.FLOURS).forEach(key => {
      const f = PZ.FLOURS[key];
      if (!groups[f.group]) {
        const og = document.createElement('optgroup');
        og.label = f.group;
        sel.appendChild(og);
        groups[f.group] = og;
      }
      const o = document.createElement('option');
      o.value = key;
      o.textContent = f.name + ' · W' + f.w + ' · ' + t(f.durKey);
      groups[f.group].appendChild(o);
    });
    sel.value = prevValue;
  }
  renderFlourOptions();
  const sel = $('flour');
  if (sel) {
    sel.addEventListener('change', function () {
      PZ.state.flour = sel.value;
      PZ.calc();
    });
    // Sprachwechsel: Dropdown-Texte (nur der "dur"-Teil ändert sich) neu aufbauen,
    // ausgewählter Wert bleibt erhalten.
    if (PZ.i18nOnChange) PZ.i18nOnChange(renderFlourOptions);
  }
})(window);
