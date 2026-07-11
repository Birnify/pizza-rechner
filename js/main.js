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
