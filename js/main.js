/* main.js — Start: Speichern-Button verdrahten, Zustand laden, erste Berechnung */
(function (global) {
  'use strict';
  const PZ = global.PZ;
  const $ = PZ.$;

  $('saveBtn').onclick = () => {
    PZ.save();
    refreshRecipeSelect();
    const b = $('saveBtn'); const t = b.textContent;
    b.textContent = '✓ Gespeichert';
    setTimeout(() => b.textContent = t, 1400);
  };

  // --- Mehrere gespeicherte Rezepte (js/storage.js) ---------------------
  function refreshRecipeSelect() {
    const sel = $('recipeSelect');
    if (!sel) return;
    const recipes = PZ.listRecipes();
    const activeId = PZ.getActiveId();
    sel.innerHTML = '';
    if (!recipes.length) {
      sel.appendChild(new Option('— noch keins gespeichert —', ''));
      return;
    }
    recipes.forEach(r => sel.appendChild(new Option(r.name, r.id)));
    sel.value = activeId || recipes[0].id;
  }
  PZ.refreshRecipeSelect = refreshRecipeSelect;

  // Jede Änderung an der Rezepte-Bibliothek (Neu/Umbenennen/Löschen/Import/Anlegen
  // über das neue Mini-Formular, js/newrecipe.js, v3.22.0) muss auch die "Eigene
  // Rezepte"-Optgroup im #preset-Dropdown der Hauptseite aktuell halten — ein
  // gemeinsamer Aufrufpunkt statt an jeder einzelnen Stelle unten separat.
  const _refreshRecipeSelect = refreshRecipeSelect;
  refreshRecipeSelect = function () {
    _refreshRecipeSelect();
    if (PZ.refreshPresetCustomRecipes) PZ.refreshPresetCustomRecipes();
  };
  PZ.refreshRecipeSelect = refreshRecipeSelect;

  const recipeSelect = $('recipeSelect');
  if (recipeSelect) {
    recipeSelect.addEventListener('change', e => {
      if (e.target.value) PZ.loadRecipe(e.target.value);
    });
  }
  const recipeSaveNew = $('recipeSaveNew');
  if (recipeSaveNew) {
    recipeSaveNew.onclick = () => {
      const nameEl = $('recipeName');
      const rec = PZ.saveAsNew(nameEl ? nameEl.value : '');
      if (nameEl) nameEl.value = '';
      refreshRecipeSelect();
      const b = recipeSaveNew; const t = b.textContent;
      b.textContent = '✓ Gespeichert';
      setTimeout(() => b.textContent = t, 1400);
      void rec;
    };
  }
  const recipeRename = $('recipeRename');
  if (recipeRename) {
    recipeRename.onclick = () => {
      const recipes = PZ.listRecipes();
      if (!recipes.length) return;
      const current = recipes.find(r => r.id === PZ.getActiveId());
      const name = prompt('Neuer Name für dieses Rezept:', current ? current.name : '');
      if (name && name.trim()) { PZ.renameActive(name); refreshRecipeSelect(); }
    };
  }
  const recipeDelete = $('recipeDelete');
  if (recipeDelete) {
    recipeDelete.onclick = () => {
      const recipes = PZ.listRecipes();
      const id = PZ.getActiveId();
      if (!recipes.length || !id) return;
      const current = recipes.find(r => r.id === id);
      if (!confirm('„' + (current ? current.name : 'Rezept') + '" wirklich löschen?')) return;
      const nextId = PZ.deleteRecipe(id);
      refreshRecipeSelect();
      if (nextId) PZ.loadRecipe(nextId);
    };
  }

  // --- Rezepte-Backup: Export/Import als Datei (js/storage.js) ----------
  function showRecipeIOMsg(msg) {
    const el = $('recipeIOLiveMsg');
    if (el) el.textContent = msg;
  }

  const recipeExportBtn = $('recipeExportBtn');
  if (recipeExportBtn) {
    recipeExportBtn.onclick = () => {
      const backup = PZ.exportRecipes();
      if (!backup.recipes.length) {
        showRecipeIOMsg('Noch keine gespeicherten Rezepte zum Sichern vorhanden.');
        return;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pizza-rezepte-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const n = backup.recipes.length;
      showRecipeIOMsg(n + (n === 1 ? ' Rezept' : ' Rezepte') + ' als Datei gesichert.');
    };
  }

  const recipeImportBtn = $('recipeImportBtn');
  const recipeImportInput = $('recipeImportInput');
  if (recipeImportBtn && recipeImportInput) {
    // recipeImportInput ist per tabindex="-1" bewusst aus der Tab-Reihenfolge genommen
    // (unsichtbares Steuerelement, s. .visually-hidden) und wird nur über diesen Button
    // ausgelöst. Der native Datei-Dialog verschiebt den Fokus dabei technisch auf das
    // Input selbst; ohne Gegenmaßnahme bliebe er dort stehen — für Tastatur-Nutzer ohne
    // sichtbaren Fokusring (WCAG 2.4.7). Sobald das Fenster nach dem Schließen des
    // Dialogs (egal ob Datei gewählt oder abgebrochen) den Fokus zurückbekommt, holen
    // wir ihn zurück auf den sichtbaren Button.
    recipeImportBtn.onclick = () => {
      recipeImportInput.click();
      const restoreFocus = () => {
        window.removeEventListener('focus', restoreFocus);
        if (document.activeElement === recipeImportInput) recipeImportBtn.focus();
      };
      window.addEventListener('focus', restoreFocus);
    };
    recipeImportInput.onchange = () => {
      const file = recipeImportInput.files && recipeImportInput.files[0];
      recipeImportInput.value = ''; // erlaubt erneutes Auswählen derselben Datei
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const result = PZ.importRecipes(parsed);
          refreshRecipeSelect();
          if (result.imported === 0) {
            showRecipeIOMsg('Keine gültigen Rezepte in dieser Datei gefunden.');
          } else {
            let msg = result.imported + (result.imported === 1 ? ' Rezept' : ' Rezepte') + ' importiert.';
            if (result.skipped > 0) msg += ' ' + result.skipped + ' übersprungen (ungültig).';
            showRecipeIOMsg(msg);
          }
        } catch (e) {
          showRecipeIOMsg('Import fehlgeschlagen: Datei ist kein gültiges Rezepte-Backup.');
        }
      };
      reader.onerror = () => showRecipeIOMsg('Import fehlgeschlagen: Datei konnte nicht gelesen werden.');
      reader.readAsText(file);
    };
  }

  // Ein gültiger Teilen-Link (?r=…, js/share.js) hat Vorrang vor dem zuletzt
  // gespeicherten Rezept — wer einen Link öffnet, will das geteilte Rezept sehen.
  // Bei fehlendem/kaputtem Link (oder falls js/share.js gar nicht geladen ist)
  // greift ganz normal PZ.load().
  const sharedApplied = PZ.tryLoadFromShareLink ? PZ.tryLoadFromShareLink() : false;
  if (!sharedApplied) PZ.load();
  refreshRecipeSelect();
  PZ.applyMethod();
  PZ.calc();
})(window);
