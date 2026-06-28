/* schedule.js — Gärzeit-Fahrplan je nach Methode & Hefemenge */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  function schedule() {
    const state = PZ.state;
    // Bei Vorteig ist die Hauptgare kürzer (die lange Reife steckt im Vorteig)
    if (state.method !== 'direct') {
      return {
        label: 'Reifung nach Vorteig',
        bulk: '<b>2–3 h</b> bei Raumtemp (Stockgare)', bulkMin: 150,
        proof: '<b>4–6 h</b> bei Raumtemp · Fingertest', proofMin: 300, cold: false
      };
    }
    const y = state.yeast;
    if (y >= 1.2) return {
      label: 'Schnellgare · gleicher Tag',
      bulk: '<b>1,5–2 h</b> bei warmer Raumtemp (24–26 °C)', bulkMin: 105,
      proof: '<b>2–3 h</b> bei Raumtemp', proofMin: 150, cold: false
    };
    if (y >= 0.5) return {
      label: 'Mittlere Gare',
      bulk: '<b>2 h</b> bei Raumtemp', bulkMin: 120,
      proof: '<b>4–6 h</b> bei Raumtemp', proofMin: 300, cold: false
    };
    if (y >= 0.18) return {
      label: 'Lange Gare · ~24 h',
      bulk: '<b>2 h</b> Raumtemp, dann <b>18–20 h</b> Kühlschrank (4–6 °C)', bulkMin: 1260,
      proof: 'Teiglinge <b>4–6 h</b> bei Raumtemp akklimatisieren', proofMin: 300, cold: true
    };
    return {
      label: 'Sehr lange Kaltgare · 48–72 h',
      bulk: '<b>1–2 h</b> Raumtemp, dann <b>24–48 h</b> Kühlschrank (4 °C)', bulkMin: 2250,
      proof: 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren', proofMin: 330, cold: true
    };
  }

  PZ.schedule = schedule;
})(window);
