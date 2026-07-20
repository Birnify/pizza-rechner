/* main.js — Start: Speichern-Button verdrahten, Zustand laden, erste Berechnung */
(function (global) {
  'use strict';
  const PZ = global.PZ;
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  $('saveBtn').onclick = () => {
    PZ.save();
    refreshRecipeSelect();
    const b = $('saveBtn'); const orig = b.textContent;
    b.textContent = t('main.saved');
    setTimeout(() => b.textContent = orig, 1400);
  };

  // --- Mehrere gespeicherte Rezepte (js/storage.js) ---------------------
  function refreshRecipeSelect() {
    const sel = $('recipeSelect');
    if (!sel) return;
    // ensureActiveId() VOR dem Lesen: repariert data.activeId im Storage, falls es
    // (z. B. nach addRecipeFromState()/importRecipes() in eine vorher leere
    // Bibliothek) noch nie gesetzt wurde — sonst würde das <select> unten zwar
    // korrekt ein Rezept anzeigen (per Fallback), aber PZ.getActiveId() bliebe
    // null und #recipeDuplicate/#recipeRename/#recipeDelete (lesen alle
    // PZ.getActiveId(), nicht den Select-Wert) würden wirkungslos abbrechen
    // (Bug gemeldet + reproduziert, v3.38.1). Rührt PZ.state/den Hauptrechner
    // NICHT an (reines Storage-Housekeeping, s. ensureActiveId() in js/storage.js).
    const activeId = PZ.ensureActiveId ? PZ.ensureActiveId() : PZ.getActiveId();
    const recipes = PZ.listRecipes();
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
  // "Kopieren"-Button (ersetzt seit v3.33.0 das Namensfeld + "Neu"-Button):
  // dupliziert GENAU das aktuell im Dropdown ausgewählte gespeicherte Rezept
  // (PZ.getActiveId() — der Select-Wert und die activeId laufen synchron, s.
  // change-Handler oben) als neue, separate Kopie. Bezieht sich bewusst NICHT
  // auf PZ.state (den evtl. ungespeicherten Live-Stand des Hauptrechners) —
  // das übernimmt weiterhin ausschließlich das unabhängige "Neues Rezept
  // anlegen"-Formular bzw. der bestehende "Speichern"-Button.
  const recipeDuplicate = $('recipeDuplicate');
  if (recipeDuplicate) {
    recipeDuplicate.onclick = () => {
      const recipes = PZ.listRecipes();
      const id = PZ.getActiveId();
      if (!recipes.length || !id) return;
      const rec = PZ.duplicateRecipe(id);
      if (!rec) return;
      PZ.loadRecipe(rec.id); // macht die Kopie aktiv + selektiert + rendert sie (ruft intern refreshRecipeSelect())
      const b = recipeDuplicate; const orig = b.textContent;
      b.textContent = t('main.duplicated');
      setTimeout(() => b.textContent = orig, 1400);
    };
  }
  const recipeRename = $('recipeRename');
  if (recipeRename) {
    recipeRename.onclick = () => {
      const recipes = PZ.listRecipes();
      if (!recipes.length) return;
      const current = recipes.find(r => r.id === PZ.getActiveId());
      const name = prompt(t('main.renamePrompt'), current ? current.name : '');
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
      if (!confirm(t('main.deleteConfirm', { name: current ? current.name : t('main.recipeFallbackName') }))) return;
      const nextId = PZ.deleteRecipe(id);
      refreshRecipeSelect();
      if (nextId) PZ.loadRecipe(nextId);
    };
  }

  // --- Rezepte-Backup: Export/Import als Datei (js/storage.js) ----------
  // Live-Region wird (wie an anderen Stellen der App, z. B. #pdfGuideLiveMsg seit
  // v3.25.0, #partyCreateLiveMsg seit v3.27.0) erst geleert und der eigentliche Text
  // erst im nächsten Tick gesetzt — sonst erkennen viele Screenreader bei zwei
  // wortgleichen Meldungen hintereinander (z. B. zweimal "Import fehlgeschlagen: ...")
  // keine echte DOM-Mutation und unterdrücken die zweite Ansage (WCAG 4.1.3). Ein
  // Generation-Zähler (analog zu announcePartyCreate() in js/party.js) verhindert
  // dabei ein Race: löst ein Klick sehr schnell hintereinander zwei unterschiedliche
  // Meldungen aus, gewinnt immer die zuletzt angeforderte — ältere, noch ausstehende
  // Timeouts werden zu No-ops.
  let recipeIOMsgGen = 0;
  function showRecipeIOMsg(msg) {
    const el = $('recipeIOLiveMsg');
    if (!el) return;
    const gen = ++recipeIOMsgGen;
    el.textContent = '';
    window.setTimeout(function () {
      if (gen === recipeIOMsgGen) el.textContent = msg;
    }, 50);
  }

  const recipeExportBtn = $('recipeExportBtn');
  if (recipeExportBtn) {
    recipeExportBtn.onclick = () => {
      const backup = PZ.exportRecipes();
      if (!backup.recipes.length) {
        showRecipeIOMsg(t('main.noRecipesToExport'));
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
      showRecipeIOMsg(n === 1 ? t('main.exportedOne') : t('main.exportedMany', { n: n }));
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
            showRecipeIOMsg(t('main.noValidRecipesFound'));
          } else {
            let msg = result.imported === 1 ? t('main.importedOne') : t('main.importedMany', { n: result.imported });
            if (result.skipped > 0) msg += t('main.skippedSuffix', { n: result.skipped });
            showRecipeIOMsg(msg);
          }
        } catch (e) {
          showRecipeIOMsg(t('main.importFailedFormat'));
        }
      };
      reader.onerror = () => showRecipeIOMsg(t('main.importFailedRead'));
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
