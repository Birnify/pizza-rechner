/* state.js — zentraler Zustand & Konstanten */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // Trockenhefe ≈ ein Drittel der Frischhefe
  PZ.FRESH_TO_DRY = 1 / 3;

  // Zentrales Objekt mit allen Eingaben
  PZ.state = {
    balls: 4, ballw: 250, hyd: 62, salt: 2.8, oil: 2, sugar: 0,
    method: 'direct', pref: 70, bhyd: 45, prefMature: 24, prefStage: 'b24',
    yeastType: 'fresh', yeast: 0.30,
    ddt: 24, room: 21, flourTemp: 21, knead: '3',
    timeMode: 'start', timeISO: '',
    flour: 'caputo_pizzeria',
    coldStage: 'balls'   // Kühlschrank-Phase: 'balls' = als Teiglinge (praktisch), 'bulk' = im Stück (klassisch)
  };

  // PZ.looksLikeState(o) — gemeinsame State-Plausibilisierung (v3.59.0, vorher
  // dreifach fast identisch dupliziert: looksLikeState() in js/share.js,
  // isLegacyState()/isValidRecipeEntry() in js/storage.js — alle drei prüften
  // dasselbe Kriterium unabhängig voneinander). Prüft, ob ein beliebiges Objekt
  // "wie ein PZ.state aussieht" (kein Array, mind. eines der beiden Kernfelder
  // balls/hyd vorhanden) — verhindert, dass ein fremdes/zufälliges/leeres JSON aus
  // einem Teilen-Link oder einer Backup-Datei unbemerkt als gültiger Rezept-State
  // übernommen wird bzw. still Datenmüll-Rezepte anlegt, die applyState() später
  // crashen lassen könnten. Bewusst EIN zentraler Ort für dieses Kriterium — auch
  // als natürlicher Ansatzpunkt für künftige Typ-Normalisierung/Schema-Migrations-
  // fragen bei Teilen-Link + Import (analog zum kürzlich behobenen
  // knead-Typinkonsistenz-Fall, s. pizza-rechner-KONTEXT.md v3.50.0) — hier NICHT
  // umgesetzt, reine Konsolidierung ohne neue Schema-Migration.
  PZ.looksLikeState = function (o) {
    return !!o && typeof o === 'object' && !Array.isArray(o) &&
      (o.balls != null || o.hyd != null);
  };
})(window);
