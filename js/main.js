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

  // --- Vollständige Sicherung: Export/Import als Datei (js/backup.js, seit A3/v4.40.0)
  // Bis v4.39.0 sicherten diese beiden Buttons NUR die Rezepte (PZ.exportRecipes()/
  // PZ.importRecipes(), js/storage.js). Seit A3 sichern sie ALLE 11 Speicher-Schlüssel
  // (PZ.exportFullBackup()/PZ.importFullBackup(), js/backup.js) -- ein Mechanismus statt
  // zwei, s. pizza-rechner-KONTEXT.md. Eine ältere, reine Rezepte-Backup-Datei bleibt
  // beim Einlesen erkannt und wird weiterhin über PZ.importRecipes() (reines Ergänzen,
  // kein Überschreiben) verarbeitet.
  // Live-Region-Ansage seit v3.58.0 über den gemeinsamen Helfer PZ.announce()
  // (js/dom.js, Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort).
  function showRecipeIOMsg(msg) {
    PZ.announce('fullBackupIOLiveMsg', msg);
  }

  const fullBackupExportBtn = $('fullBackupExportBtn');
  if (fullBackupExportBtn) {
    fullBackupExportBtn.onclick = () => {
      const backup = PZ.exportFullBackup();
      if (!Object.keys(backup.data).length) {
        showRecipeIOMsg(t('main.noDataToExport'));
        return;
      }
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pizza-teigmeister-sicherung-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showRecipeIOMsg(t('main.fullBackupExported'));
    };
  }

  const fullBackupImportBtn = $('fullBackupImportBtn');
  const fullBackupImportInput = $('fullBackupImportInput');
  if (fullBackupImportBtn && fullBackupImportInput) {
    // fullBackupImportInput ist per tabindex="-1" bewusst aus der Tab-Reihenfolge
    // genommen (unsichtbares Steuerelement, s. .visually-hidden) und wird nur über
    // diesen Button ausgelöst. Der native Datei-Dialog verschiebt den Fokus dabei
    // technisch auf das Input selbst; ohne Gegenmaßnahme bliebe er dort stehen — für
    // Tastatur-Nutzer ohne sichtbaren Fokusring (WCAG 2.4.7). Sobald das Fenster nach
    // dem Schließen des Dialogs (egal ob Datei gewählt oder abgebrochen) den Fokus
    // zurückbekommt, holen wir ihn zurück auf den sichtbaren Button.
    fullBackupImportBtn.onclick = () => {
      fullBackupImportInput.click();
      const restoreFocus = () => {
        window.removeEventListener('focus', restoreFocus);
        if (document.activeElement === fullBackupImportInput) fullBackupImportBtn.focus();
      };
      window.addEventListener('focus', restoreFocus);
    };
    fullBackupImportInput.onchange = () => {
      const file = fullBackupImportInput.files && fullBackupImportInput.files[0];
      fullBackupImportInput.value = ''; // erlaubt erneutes Auswählen derselben Datei
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let parsed;
        try {
          parsed = JSON.parse(reader.result);
        } catch (e) {
          showRecipeIOMsg(t('main.importFailedFormat'));
          return;
        }
        if (PZ.isFullBackup(parsed)) {
          // Echtes Ersetzen (s. js/backup.js) -- erst eine Bestätigung einholen, danach
          // die App neu laden, damit jedes Modul (Farbschema, Sprache, Einheiten,
          // Einfachmodus, Party-Planung, Timer, ...) seinen normalen Boot-Pfad
          // durchläuft, statt hier jedes einzeln zur Laufzeit nachsynchronisieren zu
          // müssen. PZ.store.flush() wartet auf angestoßene Hintergrund-Schreibvorgänge,
          // bevor neu geladen wird (heute mit localStorage synchron irrelevant, macht
          // diese Stelle aber robust für einen künftigen asynchronen Hintergrund, s.
          // PLAYSTORE-BACKLOG.md Punkt B3).
          if (!confirm(t('main.fullBackupConfirm'))) return;
          try {
            const result = PZ.importFullBackup(parsed);
            if (result.restored === 0) {
              showRecipeIOMsg(t('main.noValidDataInBackup'));
              return;
            }
          } catch (e) {
            showRecipeIOMsg(t('main.importFailedFormat'));
            return;
          }
          // Live-Region-Ansage VOR dem Reload auslösen (WCAG 4.1.3) -- PZ.announce()
          // setzt den Text erst nach einem eigenen 50-ms-Tick (s. js/dom.js), ein
          // sofortiger reload() würde die Ansage sonst nie hörbar machen. Der
          // zusätzliche Timeout gibt Screenreadern Zeit, die Meldung tatsächlich
          // vorzulesen, bevor die Seite neu lädt.
          showRecipeIOMsg(t('main.fullBackupRestored'));
          PZ.store.flush().then(() => {
            global.setTimeout(() => { global.location.reload(); }, 1500);
          });
        } else if (PZ.isLegacyRecipesBackup(parsed)) {
          try {
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
        } else {
          showRecipeIOMsg(t('main.importFailedFormat'));
        }
      };
      reader.onerror = () => showRecipeIOMsg(t('main.importFailedRead'));
      reader.readAsText(file);
    };
  }

  // Eigentlicher Boot-Aufbau (Laden aus dem Speicher, Erstrender). Unverändert
  // gegenüber vor v4.41.0 -- nur in eine benannte Funktion gefasst, damit sie sich
  // (s. u.) sowohl sofort synchron (Browser) als auch erst nach PZ.store.hydrate()
  // (native App, Play-Store-Vorbereitung B2) auslösen lässt.
  function boot() {
    // Ein gültiger Teilen-Link (?r=…, js/share.js) hat Vorrang vor dem zuletzt
    // gespeicherten Rezept — wer einen Link öffnet, will das geteilte Rezept sehen.
    // Bei fehlendem/kaputtem Link (oder falls js/share.js gar nicht geladen ist)
    // greift ganz normal PZ.load().
    const sharedApplied = PZ.tryLoadFromShareLink ? PZ.tryLoadFromShareLink() : false;
    if (!sharedApplied) PZ.load();
    refreshRecipeSelect();
    PZ.applyMethod();
    PZ.calc();
    // Live-Region-Ansage der Anleitung (v4.31.0, js/guide.js) erst NACH dem allerersten
    // Boot-Aufbau scharf schalten -- sonst würde der initiale Render (Laden aus
    // localStorage, applyMethod(), Erstrender oben) fälschlich schon eine Ansage auslösen.
    if (PZ.enableGuideAnnounce) PZ.enableGuideAnnounce();
  }

  // Nativer Startbildschirm (Play-Store-Vorbereitung B2, PLAYSTORE-BACKLOG.md):
  // in einer Capacitor-App bleibt der native Startbildschirm sichtbar
  // (capacitor.config.json: plugins.SplashScreen.launchAutoHide = false), bis
  // PZ.store.hydrate() fertig ist -- danach erst startet die App UND blendet den
  // Startbildschirm aus, damit nie ein halb geladener Zustand aufblitzt. Im
  // normalen Browser (Desktop und Mobil ohne Capacitor, `window.Capacitor` dann
  // nicht vorhanden) bleibt das Verhalten davon komplett unberührt: boot() läuft
  // wie bisher sofort synchron, keine neue Wartezeit vor dem ersten Rendern.
  const isNativeApp = !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());

  if (isNativeApp) {
    // Sicherheitsnetz: falls hydrate() ungewöhnlich lange braucht oder nie
    // aufloest, nach 4 Sekunden trotzdem starten -- die App darf nie dauerhaft im
    // Startbild kleben bleiben. `started` verhindert einen doppelten Boot-Aufruf,
    // falls hydrate() UND der Sicherheitsnetz-Timer beide feuern.
    let started = false;
    const startOnce = () => {
      if (started) return;
      started = true;
      // Feature-Flags (js/settings.js) neu einlesen, JETZT wo PZ.store.hydrate() den
      // nativen Zwischenspeicher gefüllt hat (oder das 4s-Sicherheitsnetz gegriffen hat)
      // -- der allererste PZ.FLAGS = readFlags()-Aufruf in settings.js lief synchron beim
      // Skript-Laden, also VOR hydrate(), und sah dort in der nativen App noch einen
      // leeren Zwischenspeicher (nur Plattform-Defaults). Ohne diesen Re-Sync würde jeder
      // gespeicherte Flag-Wert (Gärzeit-Timer, System-Wecker, Hinweistexte) bei jedem
      // Kaltstart der nativen App stillschweigend verloren gehen -- s. js/settings.js
      // reloadFlags() für die Details. Muss vor boot() laufen, damit der allererste
      // buildGuide()-Aufruf (in boot()) schon die korrekten Flags sieht.
      if (PZ.reloadFlags) PZ.reloadFlags();
      boot();
      try {
        const SplashScreen = global.Capacitor.Plugins && global.Capacitor.Plugins.SplashScreen;
        if (SplashScreen && SplashScreen.hide) SplashScreen.hide();
      } catch (e) { /* kein Absturz, falls das Plugin doch fehlt/anders heisst */ }
    };
    PZ.store.hydrate().then(startOnce);
    global.setTimeout(startOnce, 4000);
  } else {
    boot();
  }
})(window);
