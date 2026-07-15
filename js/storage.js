/* storage.js — Speichern/Laden mehrerer benannter Rezepte in localStorage
 *
 * Format (seit v3.10.0): { recipes: [{id, name, state, savedAt}], activeId }
 * Migriert automatisch alten Einzel-Slot-Stand (nackter `state`, vor v3.10.0)
 * zu einem ersten Rezept "Mein Rezept" — keine Datenverluste bestehender Nutzer.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const KEY = 'pizzaRechner';

  // --- Rohdaten lesen/schreiben ---------------------------------------
  function readRaw() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeRaw(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // Erkennt das alte Format (nackter state: hat z.B. "balls"/"hyd", aber kein "recipes")
  function isLegacyState(o) {
    return o && typeof o === 'object' && !Array.isArray(o.recipes) &&
      (o.balls != null || o.hyd != null);
  }

  function makeId() {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Liest den localStorage-Inhalt, migriert bei Bedarf ins neue Format
  // und schreibt das migrierte Ergebnis sofort zurück (einmalig).
  function readStore() {
    let data = readRaw();
    if (!data) {
      data = { recipes: [], activeId: null };
      return data;
    }
    if (isLegacyState(data)) {
      // Alter Einzel-Slot-Stand -> erstes Rezept "Mein Rezept"
      const id = makeId();
      data = {
        recipes: [{ id, name: 'Mein Rezept', state: data, savedAt: Date.now() }],
        activeId: id
      };
      writeRaw(data);
      return data;
    }
    if (!Array.isArray(data.recipes)) data.recipes = [];
    if (data.activeId === undefined) data.activeId = data.recipes[0] ? data.recipes[0].id : null;
    return data;
  }

  function listRecipes() {
    return readStore().recipes.slice();
  }
  function getActiveId() {
    return readStore().activeId;
  }

  // Aktuellen PZ.state in ein Rezept schreiben (bestehendes überschreiben oder neu anlegen)
  function saveState(id, name) {
    const data = readStore();
    const snapshot = JSON.parse(JSON.stringify(PZ.state));
    let rec = data.recipes.find(r => r.id === id);
    if (rec) {
      rec.state = snapshot;
      rec.savedAt = Date.now();
      if (name) rec.name = name;
    } else {
      rec = { id: id || makeId(), name: name || nextDefaultName(data.recipes), state: snapshot, savedAt: Date.now() };
      data.recipes.push(rec);
    }
    data.activeId = rec.id;
    writeRaw(data);
    return rec;
  }

  function nextDefaultName(recipes) {
    let n = recipes.length + 1;
    const names = new Set(recipes.map(r => r.name));
    while (names.has('Rezept ' + n)) n++;
    return 'Rezept ' + n;
  }

  // --- Öffentliche API ---------------------------------------------------

  // Speichert unter dem aktuell aktiven Rezept (überschreibt); legt beim ersten
  // Mal automatisch ein neues Rezept an. Bleibt die Basis für #saveBtn/#qbSave
  // (Quick-Save ohne Dialog).
  function save() {
    const data = readStore();
    const id = data.activeId || makeId();
    saveState(id);
  }

  // Legt immer ein neues Rezept mit dem angegebenen Namen an und macht es aktiv.
  function saveAsNew(name) {
    const data = readStore();
    const rec = saveState(makeId(), name && name.trim() ? name.trim() : nextDefaultName(data.recipes));
    return rec;
  }

  // Benennt das aktive Rezept um (ohne den Stand neu zu überschreiben).
  function renameActive(name) {
    if (!name || !name.trim()) return;
    const data = readStore();
    const rec = data.recipes.find(r => r.id === data.activeId);
    if (!rec) return;
    rec.name = name.trim();
    writeRaw(data);
  }

  function deleteRecipe(id) {
    const data = readStore();
    data.recipes = data.recipes.filter(r => r.id !== id);
    if (data.activeId === id) {
      data.activeId = data.recipes[0] ? data.recipes[0].id : null;
    }
    writeRaw(data);
    return data.activeId;
  }

  // Schreibt einen gespeicherten state in PZ.state + UI und macht ihn aktiv
  function applyState(o) {
    const state = PZ.state, set = PZ.set;
    Object.assign(state, o);
    set.balls(state.balls); set.ballw(state.ballw); set.hyd(state.hyd); set.salt(state.salt);
    if (state.oil != null) set.oil(state.oil);
    set.pref(state.pref); set.bhyd(state.bhyd); set.yeast(state.yeast);
    // prefMature/prefStage werden von applyMethod() unten aus state.prefStage gesetzt
    set.ddt(state.ddt); set.room(state.room);
    // Ältere gespeicherte Rezepte (vor v3.20.0) kennen flourTemp noch nicht — dann bleibt
    // der aktuell im UI stehende Wert unangetastet, analog zum bestehenden oil-Fallback oben.
    if (state.flourTemp != null) set.flourTemp(state.flourTemp);
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
  }

  function loadRecipe(id) {
    const data = readStore();
    const rec = data.recipes.find(r => r.id === id);
    if (!rec) return;
    data.activeId = id;
    writeRaw(data);
    applyState(rec.state);
    if (PZ.refreshRecipeSelect) PZ.refreshRecipeSelect();
  }

  // Lädt beim Start das aktive Rezept (bzw. migriert einen alten Einzel-Slot-Stand)
  function load() {
    const data = readStore();
    const rec = data.recipes.find(r => r.id === data.activeId) || data.recipes[0];
    if (!rec) return; // noch nichts gespeichert
    applyState(rec.state);
  }

  PZ.save = save;
  PZ.load = load;
  PZ.applyState = applyState;
  PZ.saveAsNew = saveAsNew;
  PZ.renameActive = renameActive;
  PZ.deleteRecipe = deleteRecipe;
  PZ.loadRecipe = loadRecipe;
  PZ.listRecipes = listRecipes;
  PZ.getActiveId = getActiveId;
})(window);
