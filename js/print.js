/* print.js — Einkaufsliste (abgeleitet aus PZ.R) + zwei Druckvarianten (Einkaufsliste / Anleitung) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Formatierung 1:1 wie im Ergebnis-Panel (calc.js), seit v3.65.0 über js/units.js:
  // Hefe < 10 g → 2 Nachkommastellen, sonst gerundet (im Imperial-Modus einheitlich
  // die 0,1-oz-Rundung, s. PZ.formatWeightAuto). Rückgabe enthält bereits die Einheit.
  function fmtYeast(grams) {
    return PZ.formatWeightAuto ? PZ.formatWeightAuto(grams)
      : (grams < 10 ? grams.toFixed(2) : String(Math.round(grams))) + ' g';
  }
  function fmtW(grams, decimals) {
    return PZ.formatWeight ? PZ.formatWeight(grams, decimals)
      : (decimals > 0 ? grams.toFixed(decimals) : String(Math.round(grams))) + ' g';
  }

  // Baut die Zeilen der Einkaufsliste aus den bereits berechneten Gesamtmengen (PZ.R).
  // Keine neue Berechnung — reine Darstellung/Formatierung, immer Gesamtmengen
  // (bei Vorteig NICHT nach Vorteig/Hauptteig aufgeteilt, das ist fürs Einkaufen irrelevant).
  function buildShoppingList() {
    const R = PZ.R;
    if (!R || !R.total) return;

    const rows = [];
    rows.push({ name: t('print.flour'), amt: fmtW(R.flour) });
    rows.push({ name: t('print.water'), amt: fmtW(R.water) });
    if (R.salt > 0) rows.push({ name: t('print.salt'), amt: fmtW(R.salt, 1) });
    if (R.yeast > 0) rows.push({ name: `${t('print.yeast')} ${R.yWord || ''}`.trim(), amt: fmtYeast(R.yeast) });
    if (R.oil >= 0.05) rows.push({ name: t('print.oil'), amt: fmtW(R.oil, 1) });
    // Zucker fehlte hier bisher komplett (Bugfix v3.48.0) — bei „New York Style" (2 % Zucker)
    // stand er zwar korrekt im Ergebnis-Panel (#gSugarRow), aber nicht auf der Einkaufsliste.
    // Gleicher Schwellwert/Formatierung wie die Öl-Zeile direkt darüber.
    if (R.sugar >= 0.05) rows.push({ name: t('print.sugar'), amt: fmtW(R.sugar, 1) });
    if (R.ice > 0) rows.push({ name: t('print.ice'), amt: fmtW(R.ice) });

    const list = $('shoppingList');
    if (!list) return;
    const itemsHtml = rows.map(r =>
      `<div class="ing"><span class="name">${r.name}</span><span class="amt">${r.amt}</span></div>`
    ).join('');
    list.innerHTML = `
      <h2 style="margin-top:0;">${t('print.title')}</h2>
      <div class="total" style="margin-bottom:10px;">
        <div class="big">${fmtW(R.total)}</div>
        <div class="lbl">${t('print.totalDough')} · ${R.N} × ${fmtW(R.W)}</div>
      </div>
      ${itemsHtml}
    `;
  }

  // Zwei Druckvarianten, ohne den bestehenden window.print()-Mechanismus zu ersetzen:
  // je eine body-Klasse steuert per @media print, was sichtbar bleibt.
  // Feature-Flag "shopping" (js/settings.js, Default AUS): deckt die komplette
  // Einkaufsliste/Druck-Funktion ab (js/print.js). Der zugehörige Button ist bei
  // deaktiviertem Flag bereits per CSS aus dem Rendering genommen (applyFlags() in
  // settings.js) — dieser Guard ist nur eine defensive zweite Absicherung, falls die
  // Funktion doch aufgerufen wird. `tests/test.html` setzt `PZ.FLAGS.shopping` explizit
  // auf `true` (Baseline "alles an", s. test.html), daher dort weiterhin uneingeschränkt
  // aufrufbar.
  function printShoppingList() {
    if (PZ.FLAGS && PZ.FLAGS.shopping === false) return;
    buildShoppingList();
    document.body.classList.add('print-shopping');
    window.print();
  }

  function printGuide() {
    if (PZ.FLAGS && PZ.FLAGS.shopping === false) return;
    document.body.classList.add('print-guide');
    window.print();
  }

  // Klassen nach dem Druckdialog wieder entfernen (afterprint feuert in allen gängigen Browsern).
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('print-shopping', 'print-guide');
  });

  PZ.buildShoppingList = buildShoppingList;
  PZ.printShoppingList = printShoppingList;
  PZ.printGuide = printGuide;
})(window);
