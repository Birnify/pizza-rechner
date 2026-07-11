/* print.js — Einkaufsliste (abgeleitet aus PZ.R) + zwei Druckvarianten (Einkaufsliste / Anleitung) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

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
    rows.push({ name: 'Mehl', amt: `${Math.round(R.flour)} g` });
    rows.push({ name: 'Wasser', amt: `${Math.round(R.water)} g` });
    if (R.salt > 0) rows.push({ name: 'Salz', amt: `${R.salt.toFixed(1)} g` });
    if (R.yeast > 0) rows.push({ name: `Hefe ${R.yWord || ''}`.trim(), amt: `${fmtYeast(R.yeast)} g` });
    if (R.oil >= 0.05) rows.push({ name: 'Olivenöl', amt: `${R.oil.toFixed(1)} g` });
    if (R.ice > 0) rows.push({ name: 'Eis (für Schüttwasser)', amt: `${Math.round(R.ice)} g` });

    const list = $('shoppingList');
    if (!list) return;
    const itemsHtml = rows.map(r =>
      `<div class="ing"><span class="name">${r.name}</span><span class="amt">${r.amt}</span></div>`
    ).join('');
    list.innerHTML = `
      <h2 style="margin-top:0;">🛒 Einkaufsliste</h2>
      <div class="total" style="margin-bottom:10px;">
        <div class="big">${Math.round(R.total)} g</div>
        <div class="lbl">Gesamtteig · ${R.N} × ${R.W} g</div>
      </div>
      ${itemsHtml}
    `;
  }

  // Zwei Druckvarianten, ohne den bestehenden window.print()-Mechanismus zu ersetzen:
  // je eine body-Klasse steuert per @media print, was sichtbar bleibt.
  function printShoppingList() {
    buildShoppingList();
    document.body.classList.add('print-shopping');
    window.print();
  }

  function printGuide() {
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
