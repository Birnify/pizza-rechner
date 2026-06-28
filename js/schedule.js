/* schedule.js — Gärzeit-Fahrplan je nach Methode & Hefemenge */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  function schedule() {
    const state = PZ.state;
    // Bei Vorteig: Stockgare ist kürzer (Reife steckt im Vorteig), aber Stückgare skaliert mit Hefemenge
    if (state.method !== 'direct') {
      const y = state.yeast;
      if (y >= 1.2) return {
        label: 'Vorteig · Schnelle Hauptgare',
        bulk: '<b>1–2 h</b> bei Raumtemp (Stockgare)', bulkMin: 90,
        proof: '<b>2–3 h</b> bei Raumtemp · Fingertest', proofMin: 150, cold: false
      };
      if (y >= 0.5) return {
        label: 'Vorteig · Mittlere Hauptgare',
        bulk: '<b>2 h</b> bei Raumtemp (Stockgare)', bulkMin: 120,
        proof: '<b>3–5 h</b> bei Raumtemp · Fingertest', proofMin: 240, cold: false
      };
      if (y >= 0.18) return {
        label: 'Vorteig · Lange Hauptgare',
        bulk: '<b>2–3 h</b> bei Raumtemp (Stockgare)', bulkMin: 150,
        proof: '<b>5–7 h</b> bei Raumtemp · Fingertest', proofMin: 360, cold: false
      };
      return {
        label: 'Vorteig · Sehr lange Hauptgare',
        bulk: '<b>2–3 h</b> Raumtemp, dann <b>12–18 h</b> Kühlschrank', bulkMin: 960,
        proof: 'Teiglinge <b>4–5 h</b> vor dem Backen temperieren', proofMin: 270, cold: true
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
