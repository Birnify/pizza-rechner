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
  // Alle Presets setzen "sugar" explizit (0 bei den 6 Presets ohne Zucker, 2 beim
  // "New York Style"-Preset) — seit v4.7.0 (Backlog Punkt C) gibt es kein Feature-Flag
  // mehr, das den Zucker-Regler/-Wert beim Preset-Wechsel zurücksetzt (s. applyPreset()
  // unten); die explizite 0 hier sorgt dafür, dass ein zuvor über "New York Style"
  // gesetzter Zucker-Wert beim Wechsel auf ein anderes Preset zuverlässig verschwindet
  // (analog zu "oil", das ebenfalls jedes Preset explizit setzt).
  const PRESETS = {
    napoli_klassisch: {
      method: 'direct', hyd: 60, salt: 2.8, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 0.2, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      descKey: 'preset.napoliKlassisch.desc'
    },
    napoli_kalt: {
      method: 'direct', hyd: 65, salt: 3.0, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 0.1, ballw: 250, ddt: 23, flour: 'caputo_cuoco',
      descKey: 'preset.napoliKalt.desc'
    },
    schnell: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 1.5, ballw: 250, ddt: 25, flour: 'caputo_pizzeria',
      descKey: 'preset.schnell.desc'
    },
    // Seit v4.25.0: "napoli_biga" (eine Stufe, unbelegte Hefewerte) ersetzt durch zwei
    // Presets, die sich bewusst NUR im Gärregime unterscheiden (analoge Design-
    // Entscheidung zum Poolish, s. pizza-rechner-KONTEXT.md). Geometrie gegenüber dem
    // Vorgänger geändert (Nutzer ausdrücklich freigegeben): Biga-Hydration 45 % -> 50 %
    // (7 von 12 Quellen bei 50 %), Gesamthydration 65 % -> 70 % (sitzt exakt auf
    // caputo_cuoco hydMax 70, keine Warnung, aber kein Spielraum nach oben).
    napoli_biga_klassisch: {
      method: 'biga', hyd: 70, salt: 2.8, oil: 2, sugar: 0, pref: 100, bhyd: 50, prefStage: 'b_klassisch', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      descKey: 'preset.napoliBigaKlassisch.desc'
    },
    napoli_biga_kalt: {
      method: 'biga', hyd: 70, salt: 2.8, oil: 2, sugar: 0, pref: 100, bhyd: 50, prefStage: 'b_kalt', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      descKey: 'preset.napoliBigaKalt.desc'
    },
    // Seit v4.24.0: "napoli_poolish" (eine Stufe, unbelegte Hefewerte) ersetzt durch zwei
    // Presets, die sich bewusst NUR im Gärregime unterscheiden (Geometrie 66/66 identisch,
    // Manopasto-Aufbau: 500 g Poolish-Mehl von 755 g Gesamtmehl) -- damit der Unterschied
    // schnell/kalt verständlich bleibt, statt in einer dritten Stellschraube unterzugehen.
    napoli_poolish_schnell: {
      method: 'poolish', hyd: 66, salt: 2.5, oil: 2, sugar: 0, pref: 66, prefStage: 'p_warm', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'dallag_monica',
      descKey: 'preset.napoliPoolishSchnell.desc'
    },
    napoli_poolish_kalt: {
      method: 'poolish', hyd: 66, salt: 2.5, oil: 2, sugar: 0, pref: 66, prefStage: 'p_cold', yeastType: 'fresh', ballw: 250, ddt: 24, flour: 'dallag_monica',
      descKey: 'preset.napoliPoolishKalt.desc'
    },
    teglia: {
      method: 'direct', hyd: 75, salt: 2.5, oil: 4, sugar: 0, yeastType: 'fresh', yeast: 0.3, ballw: 320, ddt: 24, flour: 'caputo_nuvola_super',
      descKey: 'preset.teglia.desc'
    },
    newyork_style: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 3, sugar: 2, yeastType: 'fresh', yeast: 0.2, ballw: 300, ddt: 24, flour: 'dallag_napoletana',
      descKey: 'preset.newyorkStyle.desc'
    }
  };

  // Verfolgt, welches Preset zuletzt über das #preset-Dropdown aktiv angewendet wurde
  // (nicht dasselbe wie der reine #preset-Wert, der sich schon bei jeder manuellen
  // Reglereingabe still auf '' zurücksetzt, s. u.) — für den Re-Render-Hook bei
  // Sprachwechsel (s. u.).
  let lastAppliedPresetKey = '';
  let lastLoadedRecipeName = null; // für den Re-Render-Hook bei Sprachwechsel (s. u.)

  function applyPreset(key) {
    const state = PZ.state, set = PZ.set;
    const p = PRESETS[key];
    lastAppliedPresetKey = key;
    lastLoadedRecipeName = null;
    if (!p) {
      $('presetDesc').textContent = t('preset.defaultDesc');
      // Zurück zu "Eigene Einstellung" (oder unbekannter Key): keine Feldänderung mehr
      // nötig -- der Zucker-Regler (#sugarBlock) ist seit v4.7.0 wertbasiert (s.
      // js/calc.js renderResult()) und bleibt einfach bei seinem aktuellen state.sugar-
      // Wert stehen, bis ein neues Preset oder eine manuelle Eingabe ihn ändert.
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
    // Kein applyFlags()-Aufruf mehr nötig: der Zucker-Regler (#sugarBlock) war der einzige
    // preset-abhängige Sichtbarkeits-Effekt darin, und ist seit v4.7.0 rein wertbasiert
    // (set.sugar() oben löst über PZ.calc() -> renderResult() bereits die passende
    // #sugarBlock-Sichtbarkeit aus, s. js/calc.js).
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

  // Rezeptwahl führen (v3.71.0): die 3 Empfehlungskarten (Schnell/Klassisch/Lang) setzen
  // #preset direkt und lösen dessen 'change'-Event aus -- identischer Codepfad wie eine
  // Dropdown-Auswahl (handlePresetChange()/applyPreset() oben), keine eigene Logik hier.
  document.querySelectorAll('.preset-card[data-preset]').forEach(b => b.addEventListener('click', () => {
    const sel = $('preset');
    sel.value = b.dataset.preset;
    sel.dispatchEvent(new Event('change'));
  }));

  // Manuelle Änderung an einem Regler → #preset-Auswahl zurücksetzen (kein Preset/eigenes
  // Rezept mehr aktiv). Seit v3.22.0 gibt es dafür keine "Eigene Einstellung"-Option mehr —
  // ein leerer Wert ohne passende <option> zeigt den Select schlicht ohne Auswahl an.
  // Bugfix (v3.70.1, beim Lesen für "Rezeptwahl führen" entdeckt): diese Liste
  // enthielt noch die alten Slider-IDs (hyd/salt/oil/... vor der Mengensteuerung-
  // Vereinfachung v3.70.0), die es seitdem nicht mehr gibt ($(id) liefert dort still
  // null, keine Wirkung mehr) -- UND deckte nur 5 von 12 Zahlenfeldern ab (ballwN/prefN/
  // bhydN/ddtN/roomN/flourTempN/ballsN fehlten komplett). Jetzt: alle 12 Stepper-
  // Zahlenfelder (Tippen) UND alle 12×2 Stepper-Buttons (Minus/Plus-Klick, der
  // funktionale Nachfolger des alten Slider-Ziehens) setzen #preset zurück. Schnellwahl-
  // Chip-Klicks (data-ballw/-yeast/-hyd/...) taten das schon VOR v3.70.0 nicht (rufen
  // PZ.set.* direkt auf, nicht über ein 'input'-Event) -- unverändert, kein neues
  // Verhalten, s. Nebenbefund in pizza-rechner-KONTEXT.md.
  const stepperFields = ['balls', 'ballw', 'hyd', 'salt', 'oil', 'sugar', 'pref', 'bhyd', 'yeast', 'ddt', 'room', 'flourTemp'];
  stepperFields.forEach(f => {
    const n = $(f + 'N');
    if (n) n.addEventListener('input', () => { $('preset').value = ''; });
    ['Dec', 'Inc'].forEach(suffix => {
      const btn = $(f + suffix);
      if (btn) btn.addEventListener('click', () => { $('preset').value = ''; });
    });
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
