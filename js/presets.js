/* presets.js — fertige, erprobte Rezepte + Anwenden auf die Bedienelemente */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  const DEFAULT_DESC = 'Wähle ein erprobtes Rezept — alle Werte werden automatisch gesetzt. Danach kannst du jederzeit feinjustieren.';

  const PRESETS = {
    napoli_klassisch: {
      method: 'direct', hyd: 60, salt: 2.8, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24,
      desc: 'AVPN-Standard: 60 % Hydration, Tipo 00. ~24 h bei Raumtemp (18–20 °C). Wenig Hefe, klassischer Geschmack.'
    },
    napoli_65: {
      method: 'direct', hyd: 65, salt: 2.8, yeastType: 'fresh', yeast: 0.3, ballw: 250, ddt: 24,
      desc: '65 % macht den Teig dehnbarer & verzeihlicher. ~24 h: 2 h Raumtemp, dann kühl, vor dem Backen 3–4 h akklimatisieren.'
    },
    napoli_kalt: {
      method: 'direct', hyd: 62, salt: 3.0, yeastType: 'fresh', yeast: 0.1, ballw: 250, ddt: 23,
      desc: 'Lange Kaltgare 48–72 h im Kühlschrank (4 °C). Sehr wenig Hefe, maximales Aroma. Teiglinge am Backtag 4–5 h temperieren.'
    },
    schnell: {
      method: 'direct', hyd: 62, salt: 2.5, yeastType: 'fresh', yeast: 1.5, ballw: 250, ddt: 25,
      desc: 'Gleicher Tag: ~2 h Stockgare + 2–3 h Stückgare bei warmer Raumtemp (24–26 °C). Mehr Hefe, weniger Aroma — aber spontan.'
    },
    napoli_biga: {
      method: 'biga', hyd: 65, salt: 2.8, pref: 100, bhyd: 45, yeastType: 'fresh', yeast: 0.3, ballw: 250, ddt: 24,
      desc: '100 % Biga (steifer Vorteig, 45 % Hydration). 16–20 h bei ~18 °C reifen lassen, dann Hauptteig mit Restwasser & Salz. Sehr offene Krume.'
    },
    napoli_poolish: {
      method: 'poolish', hyd: 66, salt: 2.5, pref: 66, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24,
      desc: 'Poolish (flüssig 1:1) mit ~66 % des Mehls. 1 h Raumtemp + 16–24 h kühl. Hauptteig kneten, dann 48 h Gesamtreife. Milder, luftiger Teig.'
    },
    teglia: {
      method: 'direct', hyd: 75, salt: 2.5, yeastType: 'fresh', yeast: 0.3, ballw: 320, ddt: 24,
      desc: 'Römische Blechpizza: 75 % Hydration, sehr lockere Krume. Teig ist klebrig — mit Stretch & Fold statt langem Kneten arbeiten. 24 h kühl.'
    }
  };

  function applyPreset(key) {
    const state = PZ.state, set = PZ.set;
    const p = PRESETS[key];
    if (!p) { $('presetDesc').textContent = DEFAULT_DESC; return; }
    if (p.method) { state.method = p.method; PZ.selectSeg('method', 'm', p.method); PZ.applyMethod(); }
    if (p.yeastType) { state.yeastType = p.yeastType; PZ.selectSeg('yeastType', 'y', p.yeastType); }
    if (p.knead != null) { state.knead = String(p.knead); PZ.selectSeg('knead', 'k', p.knead); }
    if (p.ballw != null) set.ballw(p.ballw);
    if (p.hyd != null)   set.hyd(p.hyd);
    if (p.salt != null)  set.salt(p.salt);
    if (p.pref != null)  set.pref(p.pref);
    if (p.bhyd != null)  set.bhyd(p.bhyd);
    if (p.yeast != null) set.yeast(p.yeast);
    if (p.ddt != null)   set.ddt(p.ddt);
    if (p.room != null)  set.room(p.room);
    $('presetDesc').textContent = p.desc;
    PZ.calc();
  }

  $('preset').addEventListener('change', e => applyPreset(e.target.value));

  // Manuelle Änderung an einem Regler → Auswahl zurück auf "Eigene Einstellung"
  ['hyd', 'salt', 'yeast', 'pref', 'bhyd', 'ballw', 'ddt', 'room', 'hydN', 'saltN', 'yeastN'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', () => { $('preset').value = ''; });
  });

  PZ.PRESETS = PRESETS;
  PZ.applyPreset = applyPreset;
})(window);
