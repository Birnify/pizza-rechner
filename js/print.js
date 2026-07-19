/* print.js — Einkaufsliste (abgeleitet aus PZ.R) + zwei Druckvarianten (Einkaufsliste / Anleitung) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Formatierung 1:1 wie im Ergebnis-Panel (calc.js): Hefe < 10 g → 2 Nachkommastellen,
  // sonst gerundet; Mehl/Wasser/Eis gerundet; Salz/Öl 1 Nachkommastelle.
  function fmtYeast(g) {
    return g < 10 ? g.toFixed(2) : String(Math.round(g));
  }

  // Baut die Zeilen der Einkaufsliste aus den bereits berechneten Gesamtmengen (PZ.R).
  // Keine neue Berechnung — reine Darstellung/Formatierung, immer Gesamtmengen
  // (bei Vorteig NICHT nach Vorteig/Hauptteig aufgeteilt, das ist fürs Einkaufen irrelevant).
  function buildShoppingList() {
    const R = PZ.R;
    if (!R || !R.total) return;

    const rows = [];
    rows.push({ name: t('print.flour'), amt: `${Math.round(R.flour)} g` });
    rows.push({ name: t('print.water'), amt: `${Math.round(R.water)} g` });
    if (R.salt > 0) rows.push({ name: t('print.salt'), amt: `${R.salt.toFixed(1)} g` });
    if (R.yeast > 0) rows.push({ name: `${t('print.yeast')} ${R.yWord || ''}`.trim(), amt: `${fmtYeast(R.yeast)} g` });
    if (R.oil >= 0.05) rows.push({ name: t('print.oil'), amt: `${R.oil.toFixed(1)} g` });
    if (R.ice > 0) rows.push({ name: t('print.ice'), amt: `${Math.round(R.ice)} g` });

    const list = $('shoppingList');
    if (!list) return;
    const itemsHtml = rows.map(r =>
      `<div class="ing"><span class="name">${r.name}</span><span class="amt">${r.amt}</span></div>`
    ).join('');
    list.innerHTML = `
      <h2 style="margin-top:0;">${t('print.title')}</h2>
      <div class="total" style="margin-bottom:10px;">
        <div class="big">${Math.round(R.total)} g</div>
        <div class="lbl">${t('print.totalDough')} · ${R.N} × ${R.W} g</div>
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
  // Funktion doch aufgerufen wird. `PZ.FLAGS` fehlt in tests/test.html bewusst (dort
  // nicht geladen) -> dort weiterhin uneingeschränkt aufrufbar (altes Verhalten).
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
