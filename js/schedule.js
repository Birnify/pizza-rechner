/* schedule.js — Gärzeit-Fahrplan je nach Methode, Hefemenge & Kaltgare-Stufe */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // Übersetzt (js/i18n.js, v3.28.0): label/bulk/proof kommen jetzt über PZ.t() aus dem
  // Wörterbuch statt als hartkodierter deutscher Text. Eigener Key je Zweig
  // ('sched.<zweig>.label/bulk/proof'), PZ.t() fällt bei fehlendem Key/fehlender
  // js/i18n.js automatisch auf den literalen Key zurück — s. Kommentar in js/i18n.js.
  // `t` ist ein No-op-Fallback (gibt den deutschen Default zurück), falls js/i18n.js aus
  // irgendeinem Grund nicht geladen ist (sollte nicht vorkommen, defensiv trotzdem).
  function t(key, def) {
    return PZ.t ? PZ.t(key) : def;
  }

  function schedule() {
    const state = PZ.state;
    const y = state.yeast;
    // Bei kalten Führungen: 'balls' = Teiglinge wandern in den Kühlschrank (praktisch, Standard),
    // 'bulk' = der ganze Teig gärt kalt im Stück (klassisch).
    // Die Gesamtdauer ist in beiden Varianten gleich — nur die Verteilung ändert sich.
    const ballsCold = state.coldStage !== 'bulk';

    // --- Vorteig-Methoden: Stockgare ist kürzer (Reife steckt im Vorteig) ---
    if (state.method !== 'direct') {
      if (y >= 1.2) return {
        label: t('sched.prefFast.label', 'Vorteig · Schnelle Hauptgare'),
        bulk: t('sched.prefFast.bulk', '<b>1–2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 90,
        proof: t('sched.prefFast.proof', '<b>2–3 h</b> bei Raumtemp · Fingertest'), proofMin: 150, cold: false
      };
      if (y >= 0.5) return {
        label: t('sched.prefMedium.label', 'Vorteig · Mittlere Hauptgare'),
        bulk: t('sched.prefMedium.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.prefMedium.proof', '<b>3–5 h</b> bei Raumtemp · Fingertest'), proofMin: 240, cold: false
      };
      if (y >= 0.18) return {
        label: t('sched.prefLong.label', 'Vorteig · Lange Hauptgare'),
        bulk: t('sched.prefLong.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)'), bulkMin: 150,
        proof: t('sched.prefLong.proof', '<b>5–7 h</b> bei Raumtemp · Fingertest'), proofMin: 360, cold: false
      };
      if (ballsCold) return {
        label: t('sched.prefVeryLong.label', 'Vorteig · Sehr lange Hauptgare'),
        bulk: t('sched.prefVeryLongCold.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)'), bulkMin: 150,
        proof: t('sched.prefVeryLongCold.proof', 'Teiglinge <b>12–16 h</b> Kühlschrank (4 °C), am Backtag <b>4–5 h</b> temperieren'), proofMin: 1080, cold: true
      };
      return {
        label: t('sched.prefVeryLong.label', 'Vorteig · Sehr lange Hauptgare'),
        bulk: t('sched.prefVeryLongBulk.bulk', '<b>2–3 h</b> Raumtemp, dann <b>12–18 h</b> Kühlschrank'), bulkMin: 960,
        proof: t('sched.prefVeryLongBulk.proof', 'Teiglinge <b>4–5 h</b> vor dem Backen temperieren'), proofMin: 270, cold: true
      };
    }

    // --- Direkte Führung ---
    if (y >= 1.2) return {
      label: t('sched.directFast.label', 'Schnellgare · gleicher Tag'),
      bulk: t('sched.directFast.bulk', '<b>1,5–2 h</b> bei warmer Raumtemp (24–26 °C)'), bulkMin: 105,
      proof: t('sched.directFast.proof', '<b>2–3 h</b> bei Raumtemp'), proofMin: 150, cold: false
    };
    if (y >= 0.5) return {
      label: t('sched.directMedium.label', 'Mittlere Gare'),
      bulk: t('sched.directMedium.bulk', '<b>2 h</b> bei Raumtemp'), bulkMin: 120,
      proof: t('sched.directMedium.proof', '<b>4–6 h</b> bei Raumtemp'), proofMin: 300, cold: false
    };
    if (y >= 0.18) {
      if (ballsCold) return {
        label: t('sched.directLong.label', 'Lange Gare · ~24 h'),
        bulk: t('sched.directLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.directLongCold.proof', 'Teiglinge <b>18–20 h</b> Kühlschrank (4–6 °C), am Backtag <b>4–5 h</b> temperieren'), proofMin: 1440, cold: true
      };
      return {
        label: t('sched.directLong.label', 'Lange Gare · ~24 h'),
        bulk: t('sched.directLongBulk.bulk', '<b>2 h</b> Raumtemp, dann <b>18–20 h</b> Kühlschrank (4–6 °C)'), bulkMin: 1260,
        proof: t('sched.directLongBulk.proof', 'Teiglinge <b>4–6 h</b> bei Raumtemp akklimatisieren'), proofMin: 300, cold: true
      };
    }
    if (y >= 0.08) {
      if (ballsCold) return {
        label: t('sched.directVeryLong.label', 'Sehr lange Kaltgare · ~48 h'),
        bulk: t('sched.directVeryLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.directVeryLongCold.proof', 'Teiglinge <b>36–40 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren'), proofMin: 2460, cold: true
      };
      return {
        label: t('sched.directVeryLong.label', 'Sehr lange Kaltgare · ~48 h'),
        bulk: t('sched.directVeryLongBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>24–48 h</b> Kühlschrank (4 °C)'), bulkMin: 2250,
        proof: t('sched.directVeryLongBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren'), proofMin: 330, cold: true
      };
    }
    if (ballsCold) return {
      label: t('sched.directExtreme.label', 'Extrem lange Kaltgare · 72 h+'),
      bulk: t('sched.directExtremeCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
      proof: t('sched.directExtremeCold.proof', 'Teiglinge <b>68–72 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren'), proofMin: 4530, cold: true
    };
    return {
      label: t('sched.directExtreme.label', 'Extrem lange Kaltgare · 72 h+'),
      bulk: t('sched.directExtremeBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>48–72 h</b> Kühlschrank (4 °C)'), bulkMin: 4320,
      proof: t('sched.directExtremeBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren'), proofMin: 330, cold: true
    };
  }

  PZ.schedule = schedule;
})(window);
