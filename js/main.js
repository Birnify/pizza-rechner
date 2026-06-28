/* main.js — Start: Speichern-Button verdrahten, Zustand laden, erste Berechnung */
(function (global) {
  'use strict';
  const PZ = global.PZ;
  const $ = PZ.$;

  $('saveBtn').onclick = () => {
    PZ.save();
    const b = $('saveBtn'); const t = b.textContent;
    b.textContent = '✓ Gespeichert';
    setTimeout(() => b.textContent = t, 1400);
  };

  PZ.load();
  PZ.applyMethod();
  PZ.calc();
})(window);
