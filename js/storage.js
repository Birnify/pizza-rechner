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

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

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
        recipes: [{ id, name: t('storage.migratedRecipeName'), state: data, savedAt: Date.now() }],
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

  // Repariert data.activeId, falls es auf kein existierendes Rezept mehr zeigt
  // (z. B. noch nie gesetzt: null), obwohl bereits Rezepte vorhanden sind —
  // reines Storage-Housekeeping, rührt NIE PZ.state/den Hauptrechner-Zustand an
  // (kein loadRecipe()/applyState()-Aufruf). Notwendig, weil sowohl
  // addRecipeFromState() (s. o., "Neues Rezept anlegen"-Formular) als auch
  // importRecipes() bewusst NIE activeId setzen — landet ein so angelegtes/
  // importiertes Rezept als erstes/einziges in einer vorher leeren Bibliothek,
  // blieb activeId bislang dauerhaft null. refreshRecipeSelect() (js/main.js)
  // zeigte es im <select> trotzdem als "ausgewählt" an (rein visueller
  // `sel.value = activeId || recipes[0].id`-Fallback dort), wodurch
  // #recipeDuplicate/#recipeRename/#recipeDelete — die alle PZ.getActiveId()
  // lesen, nicht den Select-Wert — wirkungslos abbrachen (Bug gemeldet +
  // reproduziert, v3.38.1). Wird von refreshRecipeSelect() vor jedem Lesen
  // von activeId aufgerufen, damit Dropdown-Anzeige und echter Storage-Zustand
  // nie mehr auseinanderlaufen können.
  function ensureActiveId() {
    const data = readStore();
    if (data.activeId && data.recipes.some(r => r.id === data.activeId)) return data.activeId;
    const fallback = data.recipes[0] ? data.recipes[0].id : null;
    if (data.activeId !== fallback) {
      data.activeId = fallback;
      writeRaw(data);
    }
    return data.activeId;
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
    while (names.has(t('storage.defaultRecipeName', { n: n }))) n++;
    return t('storage.defaultRecipeName', { n: n });
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
    // Defensive Typ-Normalisierung: state.knead MUSS ein String sein (js/guide.js
    // vergleicht an mehreren Stellen strikt mit '6'). Reguläre Quellen (js/ui.js
    // Segment-Klick, js/presets.js) liefern bereits String, aber ein von außen
    // eingeschleustes state-Objekt (Teilen-Link, Rezepte-Backup-Import) validiert
    // Typen nicht und könnte z. B. { knead: 6 } als Number enthalten — das würde
    // sonst calc.js (parseFloat, typtolerant) korrekt als Maschine erkennen, aber
    // guide.js weiterhin fälschlich "Hand" anzeigen (String-Vergleich schlägt fehl).
    if (state.knead != null) state.knead = String(state.knead);
    set.balls(state.balls); set.ballw(state.ballw); set.hyd(state.hyd); set.salt(state.salt);
    if (state.oil != null) set.oil(state.oil);
    // Ältere gespeicherte Rezepte (vor v3.19.2) kennen sugar noch nicht — dann bleibt
    // der aktuell im UI stehende Wert unangetastet, analog zum oil-Fallback direkt oben.
    if (state.sugar != null) set.sugar(state.sugar);
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

  // --- Backup: Export/Import aller Rezepte als Datei (v3.21.0) ------------
  //
  // localStorage lebt nur im Browser-Profil (und ist zudem pro Origin getrennt,
  // z.B. file:// vs. GitHub-Pages-Live-Version) — "Websitedaten löschen" nimmt
  // alle gespeicherten Rezepte ersatzlos mit. Export/Import ist die einzige
  // Brücke dagegen, bewusst als reine Datei (kein Server, kein Account, s.
  // pizza-rechner-KONTEXT.md "Warum keine KI / kein Internet?").

  // Baut ein Backup-Objekt mit ALLEN gespeicherten Rezepten (nicht nur dem
  // aktiven state). Reine Datenfunktion, kein DOM-Zugriff — der Download
  // (Blob + <a download>) passiert in js/main.js.
  function exportRecipes() {
    const data = readStore();
    return {
      format: 'pizzaRechnerBackup',
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: JSON.parse(JSON.stringify(data.recipes))
    };
  }

  // Ein Eintrag zählt nur als importierbar, wenn er wie ein echtes Rezept
  // aussieht (state-Objekt mit mind. einem der Kern-Felder) — analog zu
  // looksLikeState() in js/share.js. Verhindert, dass eine fremde/kaputte
  // Datei stille Datenmüll-Rezepte anlegt, die applyState() später crashen
  // lassen könnten.
  function isValidRecipeEntry(r) {
    const s = r && r.state;
    return !!r && typeof r === 'object' && !!s && typeof s === 'object' &&
      !Array.isArray(s) && (s.balls != null || s.hyd != null);
  }

  // Findet einen noch nicht vergebenen Namen für einen importierten Eintrag,
  // ohne einen bestehenden Namen zu überschreiben oder zu verwerfen: erste
  // Kollision -> "<Name> (importiert)", jede weitere -> "<Name> (importiert 2)",
  // "<Name> (importiert 3)", ...
  function uniqueImportName(base, existingNames) {
    if (!existingNames.has(base)) return base;
    let name = t('storage.importedSuffix', { name: base });
    let n = 2;
    while (existingNames.has(name)) {
      name = t('storage.importedSuffixN', { name: base, n: n });
      n++;
    }
    return name;
  }

  // Liest ein zuvor per exportRecipes() erzeugtes (oder strukturell gleich
  // aufgebautes) Backup-Objekt ein und FÜGT die enthaltenen Rezepte den
  // bestehenden hinzu — nichts wird überschrieben oder gelöscht. Jeder
  // importierte Eintrag bekommt immer eine neue id (verhindert Kollisionen
  // mit vorhandenen Rezepten) und ggf. einen angepassten Namen bei
  // Namenskollision (s. uniqueImportName). Wirft bei offensichtlich falschem
  // Format (kein Objekt / kein recipes-Array) einen Error — der Aufrufer
  // (js/main.js) fängt das ab und zeigt eine anwenderfreundliche Meldung,
  // analog zum defensiven Fehlerverhalten von js/share.js. Einzelne kaputte
  // Einträge INNERHALB einer sonst gültigen Datei brechen den Import nicht ab,
  // sie werden übersprungen und gezählt (result.skipped).
  function importRecipes(parsed) {
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.recipes)) {
      throw new Error('invalid-format');
    }
    const data = readStore();
    const existingNames = new Set(data.recipes.map(r => r.name));
    let imported = 0, skipped = 0;
    parsed.recipes.forEach(entry => {
      if (!isValidRecipeEntry(entry)) { skipped++; return; }
      const baseName = (entry.name && String(entry.name).trim()) || t('storage.importedRecipeFallbackName');
      const name = uniqueImportName(baseName, existingNames);
      existingNames.add(name);
      data.recipes.push({
        id: makeId(),
        name: name,
        state: JSON.parse(JSON.stringify(entry.state)),
        savedAt: typeof entry.savedAt === 'number' ? entry.savedAt : Date.now()
      });
      imported++;
    });
    if (imported > 0) writeRaw(data);
    return { imported: imported, skipped: skipped, total: parsed.recipes.length };
  }

  // Fügt EIN neues Rezept aus einem BELIEBIGEN state-Objekt hinzu — im Unterschied
  // zu save()/saveAsNew() bezieht sich diese Funktion NIE auf PZ.state, sondern
  // ausschliesslich auf das übergebene state-Objekt, und rührt data.activeId NICHT
  // an (das aktive/zuletzt geladene Rezept bleibt unverändert). Genutzt vom
  // eigenständigen "Neues Rezept anlegen"-Formular (js/newrecipe.js, v3.22.0) —
  // Kernidee des Features: ein Rezept anlegen, OHNE den aktuell laufenden
  // Rechner-Zustand auf der Hauptseite zu beeinflussen oder zu überschreiben.
  function addRecipeFromState(name, state) {
    const data = readStore();
    const snapshot = JSON.parse(JSON.stringify(state));
    const rec = {
      id: makeId(),
      name: name && name.trim() ? name.trim() : nextDefaultName(data.recipes),
      state: snapshot,
      savedAt: Date.now()
    };
    data.recipes.push(rec);
    writeRaw(data);
    return rec;
  }

  // Legt eine 1:1-Kopie EINES bestehenden gespeicherten Rezepts an (per id) —
  // im Unterschied zu saveAsNew() bezieht sich diese Funktion NIE auf PZ.state
  // (den evtl. ungespeicherten Live-Stand des Hauptrechners), sondern
  // ausschliesslich auf den bereits gespeicherten `state` des Quell-Rezepts.
  // Ersetzt seit v3.33.0 das entfernte "Name für neues Rezept"-Feld
  // (#recipeName/#recipeSaveNew) — dort ließ sich versehentlich der LIVE-Stand
  // statt eines bestehenden Rezepts unter neuem Namen speichern, was oft mit
  // dem separaten "Neues Rezept anlegen"-Formular verwechselt wurde. Name wird
  // automatisch vergeben ("Kopie von <Name>"), bei Kollision mit
  // fortlaufender Nummer ("Kopie von <Name> (2)", "(3)", …) — analog zu
  // uniqueImportName() oben. activeId wird bewusst NICHT hier verändert
  // (macht der Aufrufer in js/main.js über PZ.loadRecipe(), s. dort).
  function duplicateRecipe(id) {
    const data = readStore();
    const src = data.recipes.find(r => r.id === id);
    if (!src) return null;
    const existingNames = new Set(data.recipes.map(r => r.name));
    const base = t('storage.duplicateName', { name: src.name });
    let name = base, n = 2;
    while (existingNames.has(name)) { name = base + ' (' + n + ')'; n++; }
    const rec = {
      id: makeId(),
      name: name,
      state: JSON.parse(JSON.stringify(src.state)),
      savedAt: Date.now()
    };
    data.recipes.push(rec);
    writeRaw(data);
    return rec;
  }

  PZ.save = save;
  PZ.load = load;
  PZ.applyState = applyState;
  PZ.saveAsNew = saveAsNew;
  PZ.duplicateRecipe = duplicateRecipe;
  PZ.addRecipeFromState = addRecipeFromState;
  PZ.renameActive = renameActive;
  PZ.deleteRecipe = deleteRecipe;
  PZ.loadRecipe = loadRecipe;
  PZ.listRecipes = listRecipes;
  PZ.getActiveId = getActiveId;
  PZ.ensureActiveId = ensureActiveId;
  PZ.exportRecipes = exportRecipes;
  PZ.importRecipes = importRecipes;
})(window);
