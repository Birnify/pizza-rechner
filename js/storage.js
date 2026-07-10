/* storage.js — Speichern/Laden des Zustands in localStorage */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const KEY = 'pizzaRechner';

  function save() {
    localStorage.setItem(KEY, JSON.stringify(PZ.state));
  }

  function load() {
    const state = PZ.state, set = PZ.set;
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const o = JSON.parse(raw);
      Object.assign(state, o);
      // Werte in UI schreiben
      set.balls(state.balls); set.ballw(state.ballw); set.hyd(state.hyd); set.salt(state.salt);
      if (state.oil != null) set.oil(state.oil);
      set.pref(state.pref); set.bhyd(state.bhyd); set.yeast(state.yeast);
      // prefMature/prefStage werden von applyMethod() unten aus state.prefStage gesetzt
      set.ddt(state.ddt); set.room(state.room);
      // Segmente
      PZ.selectSeg('method', 'm', state.method);
      PZ.selectSeg('yeastType', 'y', state.yeastType);
      PZ.selectSeg('knead', 'k', state.knead);
      PZ.selectSeg('coldStage', 'cs', state.coldStage || 'balls');
      PZ.selectSeg('timeMode', 'tm', state.timeMode || 'start');
      if (state.timeISO) $('timeISO').value = state.timeISO;
      if (state.flour && $('flour')) $('flour').value = state.flour;
      PZ.updateTimeLabel();
      PZ.applyMethod();
    } catch (e) { /* defekter Eintrag wird ignoriert */ }
  }

  PZ.save = save;
  PZ.load = load;
})(window);
