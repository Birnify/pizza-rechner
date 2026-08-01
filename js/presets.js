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
  // v4.29.0: ALLE Presets setzen jetzt zusätzlich "balls" explizit (vorher setzte KEIN
  // Preset "balls" -- die Anzahl blieb einfach, was zuvor im Regler stand, App-Default
  // 4, s. js/state.js). Nötig geworden, weil "teglia" jetzt bewusst balls:1 braucht
  // (Blechflächen-Modell statt Teigling-Modell, s. u.) -- ohne diese Ergänzung würde
  // "balls" nach dem Verlassen von "teglia" bei JEDEM danach gewählten Preset bei 1
  // hängen bleiben (kein Preset hätte es je zurückgesetzt), exakt die Art von Preset-
  // Altlast, die "sugar" oben schon einmal absichtlich verhindert. balls:4 ist bei den
  // 7 Nicht-Teglia-Presets keine inhaltliche Änderung (identisch zum bisherigen
  // Default), nur die bisher implizite Annahme jetzt explizit gemacht.
  const PRESETS = {
    napoli_klassisch: {
      method: 'direct', hyd: 60, salt: 2.8, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 0.2, balls: 4, ballw: 250, ddt: 24, flour: 'caputo_pizzeria',
      descKey: 'preset.napoliKlassisch.desc'
    },
    // v4.30.0: Hefe 0,1 % -> 0,25 % + scheduleOverride (geteilte Kaltgare statt der
    // generischen "Sehr lange Kaltgare ~48 h"-Schwelle) -- aus einer 7-Quellen-Prüfung
    // (u. a. pizza1.de, Lorenzo's Gusto, Waldis Pizza, Burnhard, Ooni). Zwei Befunde:
    // (1) sechs von sieben Quellen dosieren 0,2-0,3 % Hefe bei 44-52 h Gesamtdauer, unsere
    // bisherigen 0,1 % lagen klar darunter -- 0,25 % sitzt mittig im belegten Cluster.
    // (2) drei von vier detaillierten Quellen teilen die Kühlschrankzeit ungefähr hälftig:
    // erst der GANZE Teig 12-24 h kalt, dann formen, dann die TEIGLINGE nochmal 12-20 h
    // kalt -- das bildet die bisherige Kaltgare-Umschaltung (nur "alles vorne" ODER "alles
    // hinten") nicht ab. state.scheduleOverride (s. js/schedule.js, seit v4.28.0) macht das
    // Preset davon unabhängig: bulk 1 h Raumtemp + 20 h Kühlschrank im Ganzen, danach
    // 20 h Kühlschrank als Teiglinge + 3 h temperieren, macht ~44 h in Summe. Die 20 h/20 h-
    // Aufteilung selbst ist KEINE zitierte Einzelzahl, sondern bewusst am oberen Rand
    // beider Quellenspannen (12-24 h bzw. 12-20 h) gewählt, damit die Gesamtdauer im
    // belegten 44-52-h-Band landet -- Mechanismus (geteilte Kaltgare existiert, ungefähr
    // hälftig) ist quellenbelegt, die konkrete Stundenverteilung ist eine konservative Wahl
    // innerhalb der Bandbreite, keine getestete Einzelzahl. s. pizza-rechner-KONTEXT.md.
    napoli_kalt: {
      method: 'direct', hyd: 65, salt: 3.0, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 0.25, balls: 4, ballw: 250, ddt: 23, flour: 'caputo_cuoco',
      scheduleOverride: {
        labelKey: 'sched.napoliKaltOverride.label', labelDefault: 'Napoli-Kaltgare (geteilt) · ~44 h',
        bulkKey: 'sched.napoliKaltOverride.bulk',
        bulkDefault: '<b>1 h</b> bei Raumtemp anspringen lassen, dann <b>20 h</b> Kühlschrank (4 °C) im Ganzen',
        bulkMin: 1260,
        proofKey: 'sched.napoliKaltOverride.proof',
        proofDefault: 'Nach dem Formen nochmal <b>20 h</b> Kühlschrank (4 °C), am Backtag <b>3 h</b> temperieren',
        proofMin: 1380,
        cold: true
      },
      descKey: 'preset.napoliKalt.desc'
    },
    schnell: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 2, sugar: 0, yeastType: 'fresh', yeast: 1.5, balls: 4, ballw: 250, ddt: 25, flour: 'caputo_pizzeria',
      descKey: 'preset.schnell.desc'
    },
    // Seit v4.25.0: "napoli_biga" (eine Stufe, unbelegte Hefewerte) ersetzt durch zwei
    // Presets, die sich bewusst NUR im Gärregime unterscheiden (analoge Design-
    // Entscheidung zum Poolish, s. pizza-rechner-KONTEXT.md). Geometrie gegenüber dem
    // Vorgänger geändert (Nutzer ausdrücklich freigegeben): Biga-Hydration 45 % -> 50 %
    // (7 von 12 Quellen bei 50 %), Gesamthydration 65 % -> 70 % (sitzt exakt auf
    // caputo_cuoco hydMax 70, keine Warnung, aber kein Spielraum nach oben).
    napoli_biga_klassisch: {
      method: 'biga', hyd: 70, salt: 2.8, oil: 2, sugar: 0, pref: 100, bhyd: 50, prefStage: 'b_klassisch', yeastType: 'fresh', balls: 4, ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      descKey: 'preset.napoliBigaKlassisch.desc'
    },
    napoli_biga_kalt: {
      method: 'biga', hyd: 70, salt: 2.8, oil: 2, sugar: 0, pref: 100, bhyd: 50, prefStage: 'b_kalt', yeastType: 'fresh', balls: 4, ballw: 250, ddt: 24, flour: 'caputo_cuoco',
      descKey: 'preset.napoliBigaKalt.desc'
    },
    // Seit v4.24.0: "napoli_poolish" (eine Stufe, unbelegte Hefewerte) ersetzt durch zwei
    // Presets, die sich bewusst NUR im Gärregime unterscheiden (Geometrie 66/66 identisch,
    // Manopasto-Aufbau: 500 g Poolish-Mehl von 755 g Gesamtmehl) -- damit der Unterschied
    // schnell/kalt verständlich bleibt, statt in einer dritten Stellschraube unterzugehen.
    napoli_poolish_schnell: {
      method: 'poolish', hyd: 66, salt: 2.5, oil: 2, sugar: 0, pref: 66, prefStage: 'p_warm', yeastType: 'fresh', balls: 4, ballw: 250, ddt: 24, flour: 'dallag_monica',
      descKey: 'preset.napoliPoolishSchnell.desc'
    },
    napoli_poolish_kalt: {
      method: 'poolish', hyd: 66, salt: 2.5, oil: 2, sugar: 0, pref: 66, prefStage: 'p_cold', yeastType: 'fresh', balls: 4, ballw: 250, ddt: 24, flour: 'dallag_monica',
      descKey: 'preset.napoliPoolishKalt.desc'
    },
    // v4.26.0: Öl 4 % -> 2,5 % (drei unabhängige Quellen bei 2,5 %, keine bei 4 %,
    // s. pizza-rechner-KONTEXT.md). v4.28.0: Hefe 0,3 % -> 0,45 % + scheduleOverride
    // (72 h+ statt der generischen ~30 h) -- Manopasto und Salamico nennen 2,5 g
    // Frischhefe auf 550 g Mehl (0,45 %), 72 h Gesamtdauer (1 h Raumtemp, 48 h
    // Kühlschrank im Ganzen, nach dem Portionieren nochmal 24 h Kühlschrank, 2-4 h
    // temperieren) -- BEIDE Quellen mit identischer Mehl-/Hefemenge, Verdacht auf
    // gemeinsamen Ursprung, nicht als zwei unabhängige Datenpunkte zu werten. Eine dritte,
    // unschärfere Quelle (Bonci-Aggregation, 0,3-0,9 % Frischhefe-Äquivalent für 24-48 h)
    // stützt zumindest die Größenordnung. s. js/schedule.js für den Override-Mechanismus,
    // pizza-rechner-KONTEXT.md für die volle Herleitung.
    // v4.29.0: balls 4 -> 1, ballw 320 -> 600 (bewusste Verkleinerung des Gesamtteigs
    // 1280 g -> 600 g, KEIN Tippfehler). Teglia/Pizza Romana wird traditionell nicht als
    // N Teiglinge dosiert, sondern nach Blechfläche ("grammatura"): drei unabhängige
    // Quellen (lievitonaturale.org, massimodesantis.com, eine weitere englischsprachige
    // Quelle) landen bei 0,5-0,6 g Teig je cm² Blechfläche. Referenz 30x40 cm (=1200 cm²)
    // x 0,5 g/cm² = 600 g, direkt so vorgerechnet bei einer der Quellen (nicht selbst
    // interpoliert). balls:1/ballw:600 bildet "ein 30x40-cm-Blech" ab -- ein größeres/
    // kleineres Blech skaliert der Nutzer proportional über die bestehenden Regler
    // (Anzahl/Gewicht), s. preset.teglia.desc. js/guide.js bekommt dafür einen eigenen
    // Teglia-Zweig für Formen-/Ausziehen-Text und Backzeit (s. dort).
    teglia: {
      method: 'direct', hyd: 75, salt: 2.5, oil: 2.5, sugar: 0, yeastType: 'fresh', yeast: 0.45, balls: 1, ballw: 600, ddt: 24, flour: 'caputo_nuvola_super',
      scheduleOverride: {
        labelKey: 'sched.tegliaOverride.label', labelDefault: 'Teglia-Kaltgare · ~76 h',
        bulkKey: 'sched.tegliaOverride.bulk',
        bulkDefault: '<b>1 h</b> bei Raumtemp, dann <b>48 h</b> Kühlschrank (4 °C) im Ganzen',
        bulkMin: 2940,
        proofKey: 'sched.tegliaOverride.proof',
        proofDefault: 'Nach dem Portionieren nochmal <b>24 h</b> Kühlschrank (4 °C), am Backtag <b>3 h</b> temperieren',
        proofMin: 1620,
        cold: true
      },
      descKey: 'preset.teglia.desc'
    },
    // v4.26.0: Öl 3 % -> 1,5 % und Zucker 2 % -> 1 % (Feeling Foodish fährt exakt diese
    // Werte, Quellenband 1-3 % Öl / 0,5-1 % Zucker, s. pizza-rechner-KONTEXT.md). v4.28.0:
    // Hefe 0,2 % -> 1,2 % + scheduleOverride (~44 h statt der generischen Schnellgare-
    // Schwelle bei 1,2 %) -- Feeling Foodish nennt 0,4 % Instant-Trockenhefe, umgerechnet
    // mit PZ.FRESH_TO_DRY (1/3) ~1,2 % Frischhefe, UND TROTZDEM 24-72 h Kaltgare
    // ("optimal 72", aber das ist die obere Grenze für Enthusiasten). ~44 h ist eine
    // bewusste Wahl von der unteren Mitte dieser Spanne, KEINE exakt zitierte Einzelzahl
    // -- ursprünglich war ~48 h (rechnerische Bandmitte) vorgesehen, aber das liegt exakt
    // auf der maxH-Obergrenze (48 h) von dallag_napoletana und wäre je nach
    // Raumtemperatur-Skalierung (v4.27.0) riskant nah an einer Mehl-Warnung -- nach unten
    // auf 44 h korrigiert (im Auftrag als Fallback vorgesehen), 4 h Sicherheitsabstand.
    newyork_style: {
      method: 'direct', hyd: 62, salt: 2.5, oil: 1.5, sugar: 1, yeastType: 'fresh', yeast: 1.2, balls: 4, ballw: 300, ddt: 24, flour: 'dallag_napoletana',
      scheduleOverride: {
        labelKey: 'sched.nyOverride.label', labelDefault: 'New-York-Style-Kaltgare · ~44 h',
        bulkKey: 'sched.nyOverride.bulk', bulkDefault: '<b>2 h</b> bei Raumtemp (Stockgare)', bulkMin: 120,
        proofKey: 'sched.nyOverride.proof',
        proofDefault: 'Teiglinge <b>38 h</b> Kühlschrank (4 °C), am Backtag <b>4 h</b> temperieren',
        proofMin: 2520,
        cold: true
      },
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
    // v4.29.0: neu -- bisher setzte kein Preset "balls" (s. Kommentar oben bei PRESETS),
    // jetzt setzen alle acht es explizit (Teglia braucht balls:1).
    if (p.balls != null) set.balls(p.balls);
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
    // v4.28.0: IMMER explizit setzen (nicht nur bei p.scheduleOverride vorhanden), analog
    // zu "sugar" oben -- sonst würde ein zuvor über teglia/newyork_style gesetzter
    // Override beim Wechsel auf ein anderes Preset stehen bleiben (Object.assign-artiges
    // Verhalten der einzelnen set.*-Aufrufe oben löscht nur Felder, die sie selbst
    // kennen). Reihenfolge wichtig: NACH set.yeast() oben, damit der korrekte,
    // preset-eigene Wert zuletzt gilt.
    state.scheduleOverride = p.scheduleOverride || null;
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
  // v4.28.0: dieselbe Stelle löscht jetzt zusätzlich state.scheduleOverride, sobald der
  // Nutzer manuell an einem der Regler dreht -- sonst würde nach dem Laden von "teglia"/
  // "newyork_style" ein anschließend manuell geänderter Regler (z. B. Hefemenge) den
  // Override-Fahrplan unverändert weiterlaufen lassen, obwohl die Werte längst nicht mehr
  // zum Preset passen. Die #yeastPills-Schnellwahl-Chips (data-yeast, js/ui.js) und der
  // Methode-Segmentschalter (applyMethod(), ebenfalls js/ui.js) setzen zwar bewusst NICHT
  // #preset zurück (dokumentierter, akzeptierter Bestandsschutz seit vor v3.70.0), löschen
  // scheduleOverride aber JEWEILS selbst an ihrer eigenen Stelle -- ein stehen gebliebener
  // Override-Fahrplan wäre deutlich irreführender als die rein kosmetische #preset-Altlast.
  const stepperFields = ['balls', 'ballw', 'hyd', 'salt', 'oil', 'sugar', 'pref', 'bhyd', 'yeast', 'ddt', 'room', 'flourTemp'];
  stepperFields.forEach(f => {
    const n = $(f + 'N');
    if (n) n.addEventListener('input', () => { $('preset').value = ''; PZ.state.scheduleOverride = null; });
    ['Dec', 'Inc'].forEach(suffix => {
      const btn = $(f + suffix);
      if (btn) btn.addEventListener('click', () => { $('preset').value = ''; PZ.state.scheduleOverride = null; });
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
