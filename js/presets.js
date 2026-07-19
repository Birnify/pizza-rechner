/* presets.js — fertige, erprobte Rezepte + Anwenden auf die Bedienelemente */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Jedes Preset empfiehlt auch ein passendes Mehl (flour) — geprüft gegen die
  // Warnlogik in guide.js: keine der Kombinationen löst eine Mehl-Warnung aus.
  // "descKey" statt eines fertigen Texts (js/i18n.js, v3.28.0) — presetDesc wird
  // live über t(descKey) nachgeschlagen, damit ein Sprachwechsel den aktuell
  // angezeigten Beschreibungstext mit aktualisiert (s. Re-Render-Hook unten).
  const PRESETS = {
    napoli_klassisch: {
      method: 'direct', hyd: 60, salt: 2.8, oil: 2, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      descKey: 'preset.napoliKlassisch.desc'
    },
    napoli_65: {
      method: 'direct', hyd: 65, salt: 2.8, oil: 2, yeastType: 'fresh', yeast: 0.3, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      descKey: 'preset.napoli65.desc'
    },
    napoli_kalt: {
      method: 'direct', hyd: 65, salt: 3.0, oil: 2, yeastType: 'fresh', yeast: 0.1, ballw: 250, ddt: 23, flour: 'caputo_cuoco',
      descKey: 'preset.napoliKalt.desc'
    },
    schnell: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 2, yeastType: 'fresh', yeast: 1.5, ballw: 250, ddt: 25, flour: 'caputo_pizzeria',
      descKey: 'preset.schnell.desc'
    },
    napoli_biga: {
      method: 'biga', hyd: 65, salt: 2.8, oil: 2, pref: 100, bhyd: 45, prefStage: 'b24', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      descKey: 'preset.napoliBiga.desc'
    },
    napoli_poolish: {
      method: 'poolish', hyd: 66, salt: 2.5, oil: 2, pref: 66, prefStage: 'p14', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'dallag_monica',
      descKey: 'preset.napoliPoolish.desc'
    },
    teglia: {
      method: 'direct', hyd: 75, salt: 2.5, oil: 4, yeastType: 'fresh', yeast: 0.3, ballw: 320, ddt: 24, flour: 'caputo_nuvola_super',
      descKey: 'preset.teglia.desc'
    },
    newyork_style: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 3, sugar: 2, yeastType: 'fresh', yeast: 0.2, ballw: 300, ddt: 24, flour: 'dallag_napoletana',
      flag: 'newYorkStyle',
      descKey: 'preset.newyorkStyle.desc'
    }
  };

  // Verfolgt, welches Preset zuletzt über das #preset-Dropdown aktiv angewendet wurde
  // (nicht dasselbe wie der reine #preset-Wert, der sich schon bei jeder manuellen
  // Reglereingabe still auf '' zurücksetzt, s. u.) — nur so lässt sich erkennen, ob der
  // Nutzer gerade WEG von „New York Style" wechselt (v3.20.1, s. u.).
  let lastAppliedPresetKey = '';
  let lastLoadedRecipeName = null; // für den Re-Render-Hook bei Sprachwechsel (s. u.)

  function applyPreset(key) {
    const state = PZ.state, set = PZ.set;
    const p = PRESETS[key];
    // Wechsel WEG von „New York Style" (zu einem anderen Preset ODER zu „Eigene
    // Einstellung"): Zucker-Wert auf 0 zurücksetzen. Sonst bliebe ein zuvor gesetzter
    // Zucker-Wert unbemerkt im State stehen, auch wenn der Regler jetzt (korrekt) verborgen
    // ist — s. „Zucker-Regler nur bei New-York-Style-Preset" (v3.20.1) in der Kontext-Datei.
    if (lastAppliedPresetKey === 'newyork_style' && key !== 'newyork_style' && set.sugar) {
      set.sugar(0);
    }
    lastAppliedPresetKey = key;
    lastLoadedRecipeName = null;
    if (!p) {
      $('presetDesc').textContent = t('preset.defaultDesc');
      // Zurück zu "Eigene Einstellung" (oder unbekannter Key): preset-gated Regler
      // (aktuell nur der Zucker-Regler) wieder ausblenden, sofern das zugehörige Flag
      // nicht manuell/dauerhaft an ist — applyFlags() liest dafür live aus #preset (s. dort).
      if (PZ.applyFlags) PZ.applyFlags();
      return;
    }
    if (p.method) { state.method = p.method; PZ.selectSeg('method', 'm', p.method); PZ.applyMethod(); }
    if (p.yeastType) { state.yeastType = p.yeastType; PZ.selectSeg('yeastType', 'y', p.yeastType); }
    if (p.knead != null) { state.knead = String(p.knead); PZ.selectSeg('knead', 'k', p.knead); }
    if (p.ballw != null) set.ballw(p.ballw);
    if (p.hyd != null)   set.hyd(p.hyd);
    if (p.salt != null)  set.salt(p.salt);
    if (p.oil != null)   set.oil(p.oil);
    if (p.sugar != null) set.sugar(p.sugar);
    if (p.pref != null)  set.pref(p.pref);
    if (p.bhyd != null)  set.bhyd(p.bhyd);
    if (p.yeast != null) set.yeast(p.yeast);
    if (p.ddt != null)   set.ddt(p.ddt);
    if (p.room != null)  set.room(p.room);
    if (p.flourTemp != null) set.flourTemp(p.flourTemp);
    if (p.flour) { state.flour = p.flour; const fs = $('flour'); if (fs) fs.value = p.flour; }
    // Vorteig-Reife-Stufe setzt Reifezeit + Hefe passend (nach applyMethod, das die Pills rendert)
    if (p.prefStage && PZ.selectPrefStage) PZ.selectPrefStage(state.method, p.prefStage);
    // Manche Presets brauchen einen sonst standardmäßig ausgeblendeten Regler sichtbar
    // (z. B. „New York Style" den Zucker-Regler) — NUR solange dieses Preset aktiv gewählt
    // ist (v3.19.3). Kein automatisches, dauerhaftes Anschalten des Feature-Flags mehr
    // (vorher: PZ.setFlag(p.flag, true) — das ließ den Regler auch nach dem Wechsel auf ein
    // anderes Preset oder „Eigene Einstellung" für immer sichtbar, s. Kontext-Datei). Der
    // manuelle Flag-Schalter im Einstellungen-Menü wirkt seit v3.20.1 NUR noch bei „Eigene
    // Einstellung" (kein konkretes Preset aktiv) — bei jedem anderen konkreten Preset bleibt
    // der Zucker-Regler verborgen, unabhängig vom Flag-Zustand (applyFlags() in
    // js/settings.js prüft dafür exakt den Preset-Key, nicht mehr das generische
    // `flag`-Feld).
    if (PZ.applyFlags) PZ.applyFlags();
    $('presetDesc').textContent = t(p.descKey);
    PZ.calc();
  }

  // Eigene Rezepte ("Eigene Rezepte"-Optgroup, v3.22.0, js/newrecipe.js): Optionen dort
  // tragen den Wert "recipe:<id>" statt eines PRESETS-Keys. Auswahl lädt das Rezept
  // 1:1 wie über "Meine Rezepte" -> Laden (PZ.loadRecipe), statt applyPreset() zu
  // durchlaufen — ein Preset und ein eigenes Rezept sind unterschiedliche Datenquellen.
  const RECIPE_PREFIX = 'recipe:';
  function handlePresetChange(value) {
    if (value && value.indexOf(RECIPE_PREFIX) === 0) {
      const id = value.slice(RECIPE_PREFIX.length);
      lastAppliedPresetKey = value;
      if (PZ.loadRecipe) PZ.loadRecipe(id);
      const rec = (PZ.listRecipes ? PZ.listRecipes() : []).find(r => r.id === id);
      lastLoadedRecipeName = rec ? rec.name : null;
      $('presetDesc').textContent = rec ? t('preset.customRecipeLoaded', { name: rec.name }) : t('preset.defaultDesc');
      return;
    }
    applyPreset(value);
  }
  $('preset').addEventListener('change', e => handlePresetChange(e.target.value));

  // Manuelle Änderung an einem Regler → #preset-Auswahl zurücksetzen (kein Preset/eigenes
  // Rezept mehr aktiv). Seit v3.22.0 gibt es dafür keine "Eigene Einstellung"-Option mehr —
  // ein leerer Wert ohne passende <option> zeigt den Select schlicht ohne Auswahl an.
  ['hyd', 'salt', 'oil', 'sugar', 'yeast', 'pref', 'bhyd', 'ballw', 'ddt', 'room', 'flourTemp', 'hydN', 'saltN', 'oilN', 'sugarN', 'yeastN'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', () => { $('preset').value = ''; });
  });

  PZ.PRESETS = PRESETS;
  PZ.applyPreset = applyPreset;

  // Sprachwechsel: den aktuell angezeigten presetDesc-Text neu auflösen (Preset-
  // Beschreibung ODER "eigenes Rezept geladen"-Hinweis ODER Standardtext) — sonst
  // bliebe er nach dem Umschalten in der alten Sprache stehen, obwohl der Rest der
  // Karte schon übersetzt ist.
  if (PZ.i18nOnChange) {
    PZ.i18nOnChange(function () {
      const p = PRESETS[lastAppliedPresetKey];
      if (p) {
        $('presetDesc').textContent = t(p.descKey);
      } else if (lastLoadedRecipeName) {
        $('presetDesc').textContent = t('preset.customRecipeLoaded', { name: lastLoadedRecipeName });
      } else {
        $('presetDesc').textContent = t('preset.defaultDesc');
      }
    });
  }
})(window);
