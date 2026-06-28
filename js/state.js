/* state.js — zentraler Zustand & Konstanten */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // Trockenhefe ≈ ein Drittel der Frischhefe
  PZ.FRESH_TO_DRY = 1 / 3;

  // Zentrales Objekt mit allen Eingaben
  PZ.state = {
    balls: 4, ballw: 250, hyd: 62, salt: 2.8,
    method: 'direct', pref: 70, bhyd: 45,
    yeastType: 'fresh', yeast: 0.30,
    ddt: 24, room: 21, knead: 3,
    timeMode: 'start', timeISO: ''
  };
})(window);
