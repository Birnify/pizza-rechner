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

  // Rezeptwahl führen (v3.71.0, seit v4.32.0 9 statt 3 Karten -- "Bild-Grundgerüst plus
  // bebildertes Preset-Kartengitter"): die Karten setzen #preset direkt und lösen dessen
  // 'change'-Event aus -- identischer Codepfad wie eine Dropdown-Auswahl
  // (handlePresetChange()/applyPreset() oben), keine eigene Logik hier.
  document.querySelectorAll('.preset-card[data-preset]').forEach(b => {
    b.addEventListener('click', () => {
      const sel = $('preset');
      sel.value = b.dataset.preset;
      sel.dispatchEvent(new Event('change'));
    });
    // Tastaturbedienung der Swipe-Leiste (v4.33.0): der Browser scrollt eine per Tab
    // fokussierte Karte zwar von selbst ins Bild, aber per Headless-Test gefunden --
    // mit scroll-snap-type:mandatory reicht das bei JEDER zweiten Karte (der jeweils
    // rechten von zwei fast passenden Karten) nicht aus, weil eine nur teilweise
    // sichtbare Zwischenposition kein gültiger Einrastpunkt ist -- die Karte blieb dann
    // zu 98 % abgeschnitten stehen, obwohl sie den Fokus hatte. Expliziter
    // scrollIntoView holt sie zuverlässig vollständig ins Bild (auf dem Desktop-Gitter
    // ohne horizontalen Überlauf ein No-op).
    b.addEventListener('focus', () => b.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
  });

  // Anstupser bricht bei Nutzerinteraktion ab (Nachtrag v4.33.0, mobile-optimizer-/
  // accessibility-expert-Befund): wer direkt nach dem Laden schon selbst wischt, tippt
  // oder eine Karte per Tastatur fokussiert, hat die Leiste bereits gefunden -- der
  // Anstupser darf dann nicht mehr über eine bereits begonnene Geste hinweg die
  // Scroll-Position verändern. 'pointerdown'/'touchstart'/'wheel' auf der Leiste (deckt
  // Kartenklicks mit ab, da Events von den Kind-Buttons hochbubbeln) sowie 'focus' auf
  // jeder Karte zählen als Interaktion. Bewusst NICHT das 'scroll'-Event: der Anstupser
  // scrollt den Container ja selbst, das würde ihn augenblicklich wieder selbst
  // abbrechen. Die Listener werden sofort beim Modul-Setup registriert (nicht erst beim
  // Start des Anstupsers), damit auch eine sehr frühe Geste vor dem 'load'-Event zählt.
  let presetGridInteracted = false;
  (function watchPresetGridInteraction() {
    const grid = document.querySelector('.preset-grid');
    if (!grid) return;
    const mark = () => { presetGridInteracted = true; };
    ['pointerdown', 'touchstart', 'wheel'].forEach(ev => grid.addEventListener(ev, mark, { passive: true, once: true }));
    grid.querySelectorAll('.preset-card').forEach(b => b.addEventListener('focus', mark, { once: true }));
  })();

  // Ausgewählte Karte sichtbar/vorlesbar machen (v4.32.0, aria-pressed statt einer rein
  // optischen Markierung -- Vorgabe aus design-import/components/cards/PresetCard.jsx):
  // liest #preset.value FRISCH bei jedem Aufruf (kein separat mitgeführter State), damit
  // die Anzeige auch dann korrekt bleibt, wenn #preset.value von anderer Stelle gesetzt
  // wird. Läuft bei jedem 'change' von #preset (deckt Kartenklick UND direkte
  // Select-Bedienung inkl. "Eigene Rezepte" ab) sowie an den beiden Stellen unten, die
  // #preset.value ohne 'change'-Event auf '' zurücksetzen (Stepper-Felder).
  function syncPresetCardSelection() {
    const sel = $('preset');
    const key = sel ? sel.value : '';
    let activeBtn = null;
    document.querySelectorAll('.preset-card[data-preset]').forEach(b => {
      const isActive = b.dataset.preset === key;
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) activeBtn = b;
    });
    // Ausgewählte Karte ins Bild holen (v4.33.0, Feature "Preset-Karten als Swipe-Leiste
    // auf dem Handy"): scrollIntoView OHNE 'behavior' scrollt instant, keine Animation --
    // respektiert prefers-reduced-motion automatisch, weil schlicht nichts animiert wird.
    // 'nearest' auf beiden Achsen scrollt nur, wenn die Karte nicht schon sichtbar ist
    // (z. B. kein Sprung direkt nach einem Klick auf genau diese Karte) und verhindert,
    // dass ein 'block'-Sprung die ganze Seite vertikal verschiebt, obwohl die Karte
    // längst im sichtbaren Bereich liegt. Auf dem Desktop-Gitter (kein horizontaler
    // Überlauf) ist der Aufruf ein No-op.
    if (activeBtn) activeBtn.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }
  $('preset').addEventListener('change', syncPresetCardSelection);
  syncPresetCardSelection();

  // Wortgrenzen-sicheres Kürzen der Preset-Beschreibung (v4.33.1, Bugfix "ungleiche
  // Kartenhöhen in der Swipe-Leiste"): css/mobile.css begrenzt .preset-card-fit dort per
  // -webkit-line-clamp auf 4 Zeilen, damit alle Karten der Mobil-Swipe-Leiste gleich hoch
  // werden (feste Höhe für .preset-card-body). Reines CSS-Line-Clamp hat aber eine bekannte
  // Lücke: das Auslassungszeichen "…" wird auf der letzten sichtbaren Zeile einfach an die
  // Zeichenposition gesetzt, an der der verfügbare Platz endet -- OHNE Rücksicht auf
  // Wortgrenzen. Live per Headless-WebKit verifiziert: bei "New York Style" reichte das
  // letzte Wort ("Mehl") exakt bis an den Kartenrand, wodurch der Browser mitten im Wort
  // kürzte ("mittelstarkes Meh…" statt "…Mehl…"). Die anderen 8 Karten waren zufällig
  // nicht betroffen (ihr jeweils letztes sichtbares Wort ließ genug Platz für "…"), das
  // Problem ist aber vom exakten Textinhalt abhängig und nicht pauschal durch eine andere
  // Zeilenzahl zu vermeiden.
  // Deshalb hier ein kleiner Nachschliff NACH dem CSS-Clamp (der als No-JS-Fallback stehen
  // bleibt, s. css/mobile.css): läuft nur, wenn .preset-card-fit tatsächlich überläuft
  // (scrollHeight > clientHeight -- auf dem Desktop-Gitter ohne Line-Clamp immer false,
  // dort also ein No-op, kein Sonderfall nötig), kürzt dann testweise Wort für Wort und
  // übernimmt die längste Wortfolge, die inklusive "…" noch in die geklemmte Höhe passt.
  // Card-Breite ist fix (130px, unabhängig vom Viewport), eine erneute Prüfung bei
  // Fenster-Resize ist deshalb nicht nötig.
  // Liest den Ausgangstext IMMER frisch über t(data-i18n) statt über el.textContent --
  // sonst würde ein zweiter Lauf (Webfont-Nachlade-Fall unten, oder ein Sprachwechsel)
  // versehentlich einen bereits gekürzten String erneut kürzen.
  // Zwei Aufruf-Zeitpunkte nötig (Bug beim ersten Versuch live gefunden): direkt beim
  // Modul-Setup misst scrollHeight/clientHeight noch mit der System-Schriftart, weil die
  // selbst gehosteten Webfonts (css/fonts.css) asynchron nachladen -- zu dem frühen
  // Zeitpunkt erschien z. B. "New York Style" fälschlich als "passt bereits komplett" und
  // blieb unangetastet. Deshalb zusätzlich ein zweiter Lauf über document.fonts.ready.
  function truncatePresetFitWords() {
    document.querySelectorAll('.preset-grid .preset-card-fit').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const full = key ? t(key) : el.textContent;
      el.textContent = full;
      if (el.scrollHeight <= el.clientHeight + 1) return; // passt bereits komplett
      const words = full.split(' ');
      let fit = '';
      for (let i = 0; i < words.length; i++) {
        const candidate = fit ? fit + ' ' + words[i] : words[i];
        el.textContent = candidate + '…';
        if (el.scrollHeight > el.clientHeight + 1) break;
        fit = candidate;
      }
      el.textContent = (fit || words[0]) + '…';
    });
  }
  truncatePresetFitWords();
  if (global.document && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(truncatePresetFitWords).catch(function () { /* ignorierbar */ });
  }
  if (PZ.i18nOnChange) PZ.i18nOnChange(truncatePresetFitWords);

  // Einmaliger "Anstupser" für die Swipe-Leiste (v4.33.0): rückt die Kartenreihe beim
  // ersten Anzeigen einmal kurz an und wieder zurück, als Hinweis, dass rechts weitere
  // Karten folgen. Kein dauerhaft laufendes Karussell -- läuft höchstens einmal pro
  // Sitzung, danach bewegt sich die Leiste nie wieder von selbst (bewusste Vorgabe, s.
  // Feature-Definition: "Karten, die sich beim Lesen unter dem Finger wegbewegen" wurde
  // als Bedenken genannt und abgelehnt).
  // sessionStorage statt localStorage: eine dauerhafte (Tage/Wochen überdauernde)
  // Unterdrückung würde den Hinweis auch neuen Sitzungen vorenthalten, obwohl die
  // meisten Nutzer die App nicht täglich öffnen und bis dahin schlicht wieder vergessen
  // haben können, dass die Reihe wischbar ist -- "einmal pro Sitzung" ist der bessere
  // Kompromiss zwischen "nicht nervig" und "hilft beim Wiederentdecken".
  // Läuft nur, wenn tatsächlich horizontal übergelaufen wird (grid.scrollWidth >
  // grid.clientWidth) -- auf dem Desktop-Gitter ist das nie der Fall, ein eigener
  // Viewport-/Media-Check ist deshalb nicht nötig.
  function nudgePresetGrid() {
    const grid = document.querySelector('.preset-grid');
    if (!grid) return;
    if (presetGridInteracted) return; // Nutzer war schneller als der Anstupser
    let alreadyShown = false;
    try { alreadyShown = sessionStorage.getItem('pzPresetSwipeHint') === '1'; }
    catch (e) { /* z. B. privater Modus ohne sessionStorage -- dann einfach zulassen */ }
    if (alreadyShown) return;
    try { sessionStorage.setItem('pzPresetSwipeHint', '1'); } catch (e) { /* ignorieren */ }
    // prefers-reduced-motion ist PFLICHT, nicht optional (Feature-Vorgabe): wer
    // reduzierte Bewegung eingestellt hat, bekommt den Anstupser gar nicht erst.
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(() => {
      if (presetGridInteracted) return; // seit dem Scheduling doch noch selbst gegriffen
      const maxScroll = grid.scrollWidth - grid.clientWidth;
      if (maxScroll <= 1) return; // kein Überlauf -- Desktop-Gitter oder alles passt bereits
      const start = grid.scrollLeft;
      const target = Math.min(start + 48, maxScroll);
      if (target <= start) return; // schon ganz am rechten Rand, kein Platz zum Anstupsen
      // scroll-snap-type kurz aushebeln: sonst zieht der Browser den Zwischenstand des
      // Anstupsers (bewusst NICHT kartenweise ausgerichtet) sofort auf den nächsten
      // Einrastpunkt statt der gewollten kurzen Anschub-Bewegung.
      const prevSnap = grid.style.scrollSnapType;
      grid.style.scrollSnapType = 'none';
      // Erzwungener Reflow (per Headless-Edge-Test gefunden): ohne den lesenden Zugriff
      // auf offsetWidth zwischen dem Style-Wechsel und scrollTo() sieht scrollTo() noch
      // die alte (mandatory) Snap-Einstellung und klemmt das Ziel sofort wieder auf die
      // Startposition zurück -- der Anstupser bewegte sich dann sichtbar gar nicht.
      void grid.offsetWidth;
      grid.scrollTo({ left: target, behavior: 'smooth' });
      setTimeout(() => {
        // Während der Hinbewegung selbst gegriffen (v4.33.0-Nachtrag): NICHT mehr
        // zurückscrollen, das würde der eigenen Geste die Position unter dem Finger
        // wegziehen -- nur den Snap-Zustand wieder freigeben, den Rest übernimmt der
        // Nutzer selbst.
        if (presetGridInteracted) { grid.style.scrollSnapType = prevSnap; return; }
        grid.scrollTo({ left: start, behavior: 'smooth' });
        setTimeout(() => { grid.style.scrollSnapType = prevSnap; }, 450);
      }, 450);
    });
  }
  // Der Anstupser startet erst nach dem 'load'-Event (+ zwei rAF-Ticks, für einen
  // wirklich abgeschlossenen Layout-/Paint-Durchlauf), NICHT direkt beim Modul-Setup:
  // per Headless-Test gefunden (verifiziert gegen echtes Edge/Chromium), dass
  // scrollTo({behavior:'smooth'}) mitten in der noch laufenden Initial-Ladephase
  // (Bilder laden lazy nach, Layout verschiebt sich noch) von einem folgenden Reflow
  // unterbrochen und dabei sofort wieder auf die Startposition zurückgeklemmt wird --
  // der Anstupser bewegte sich dann sichtbar überhaupt nicht. Nach 'load' ist das
  // Layout stabil genug, damit die Animation zuverlässig läuft.
  function scheduleNudge() {
    const runSoon = () => requestAnimationFrame(() => requestAnimationFrame(nudgePresetGrid));
    if (document.readyState === 'complete') runSoon();
    else global.addEventListener('load', runSoon, { once: true });
  }
  scheduleNudge();

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
    if (n) n.addEventListener('input', () => { $('preset').value = ''; PZ.state.scheduleOverride = null; syncPresetCardSelection(); });
    ['Dec', 'Inc'].forEach(suffix => {
      const btn = $(f + suffix);
      if (btn) btn.addEventListener('click', () => { $('preset').value = ''; PZ.state.scheduleOverride = null; syncPresetCardSelection(); });
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
