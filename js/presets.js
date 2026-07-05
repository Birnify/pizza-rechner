/* presets.js — fertige, erprobte Rezepte + Anwenden auf die Bedienelemente */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  const DEFAULT_DESC = 'Wähle ein erprobtes Rezept — alle Werte werden automatisch gesetzt. Danach kannst du jederzeit feinjustieren.';

  // Jedes Preset empfiehlt auch ein passendes Mehl (flour) — geprüft gegen die
  // Warnlogik in guide.js: keine der Kombinationen löst eine Mehl-Warnung aus.
  const PRESETS = {
    napoli_klassisch: {
      method: 'direct', hyd: 60, salt: 2.8, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      desc: 'AVPN-Standard: 60 % Hydration, Tipo 00. ~24 h Gesamtgare. Wenig Hefe, klassischer Geschmack.'
    },
    napoli_65: {
      method: 'direct', hyd: 65, salt: 2.8, yeastType: 'fresh', yeast: 0.3, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      desc: '65 % macht den Teig dehnbarer & verzeihlicher. ~24 h: 2 h Raumtemp, dann kühl, vor dem Backen temperieren.'
    },
    napoli_kalt: {
      method: 'direct', hyd: 65, salt: 3.0, yeastType: 'fresh', yeast: 0.1, ballw: 250, ddt: 23, flour: 'caputo_cuoco',
      desc: 'Lange Kaltgare ~48 h im Kühlschrank (4 °C). Sehr wenig Hefe, maximales Aroma. Braucht ein starkes Mehl (W300+).'
    },
    schnell: {
      method: 'direct', hyd: 62, salt: 2.5, yeastType: 'fresh', yeast: 1.5, ballw: 250, ddt: 25, flour: 'caputo_pizzeria',
      desc: 'Gleicher Tag: ~2 h Stockgare + 2–3 h Stückgare bei warmer Raumtemp (24–26 °C). Mehr Hefe, weniger Aroma — aber spontan.'
    },
    napoli_biga: {
      method: 'biga', hyd: 65, salt: 2.8, pref: 100, bhyd: 45, yeastType: 'fresh', yeast: 0.3, ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      desc: '100 % Biga (steifer Vorteig, 45 % Hydration). 16–20 h bei ~18 °C reifen lassen, dann Hauptteig mit Restwasser & Salz. Sehr offene Krume.'
    },
    napoli_poolish: {
      method: 'poolish', hyd: 66, salt: 2.5, pref: 66, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24, flour: 'dallag_monica',
      desc: 'Poolish (flüssig 1:1) mit ~66 % des Mehls. 1 h Raumtemp + 12–16 h kühl reifen, dann Hauptteig — ~24 h Gesamtreife. Milder, luftiger Teig.'
    },
    teglia: {
      method: 'direct', hyd: 75, salt: 2.5, yeastType: 'fresh', yeast: 0.3, ballw: 320, ddt: 24, flour: 'caputo_nuvola_super',
      desc: 'Römische Blechpizza: 75 % Hydration, sehr lockere Krume. Teig ist klebrig — mit Stretch & Fold statt langem Kneten arbeiten. 24 h kühl. Braucht sehr starkes Mehl (W330+).'
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
    if (p.flour) { state.flour = p.flour; const fs = $('flour'); if (fs) fs.value = p.flour; }
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
