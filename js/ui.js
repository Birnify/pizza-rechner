/* ui.js — Bedienelemente: Slider/Zahlenfelder, Segmente, Pills, Zeitplan */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const state = PZ.state;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // --- Mengensteuerung vereinfachen (v3.70.0) ---
  // ALLE Regler im Hauptrechner nutzen jetzt Zahlenfeld + Minus/Plus-Buttons statt
  // Slider+Zahlenfeld (s. PZ.makeStepper(), js/widgets.js) -- kein <input type=range>
  // mehr in pizza-rechner.html/-mobile.html. PZ.makeLink() (der Slider-Mechanismus)
  // bleibt als Fabrik in js/widgets.js bestehen, wird aber von HIER aus nicht mehr
  // aufgerufen -- js/newrecipe.js nutzt ihn weiterhin unabhängig für sein eigenes
  // Mini-Formular (nrBalls/nrHyd/... bleiben bewusst bei Slider+Zahlenfeld, nicht Teil
  // dieses Umbaus). `announceId` liefert eine Live-Region-Ansage bei +/- Klick (nicht
  // beim Tippen ins Zahlenfeld oder Klick auf eine Schnellwahl-Chip, da dort der neue
  // Wert ohnehin sofort sichtbar wird).
  const stepper = PZ.makeStepper({ stateObj: state, onSet: PZ.calc, announceId: 'stepperLiveMsg' });

  // Setter-Sammlung (von presets.js und storage.js genutzt)
  PZ.set = {
    balls: stepper('ballsN', 'ballsDec', 'ballsInc', 'balls', 0, 1, 'unit.balls', 'ballsV'),
    ballw: stepper('ballwN', 'ballwDec', 'ballwInc', 'ballw', 0, 10, 'unit.grams', 'ballwV'),
    hyd:   stepper('hydN', 'hydDec', 'hydInc', 'hyd', 0, 1, 'unit.percentHyd', 'hydV'),
    salt:  stepper('saltN', 'saltDec', 'saltInc', 'salt', 1, 0.1, 'unit.percentSalt', 'saltV'),
    oil:   stepper('oilN', 'oilDec', 'oilInc', 'oil', 1, 0.5, 'unit.percentOil', 'oilV'),
    sugar: stepper('sugarN', 'sugarDec', 'sugarInc', 'sugar', 1, 0.5, 'unit.percentSugar', 'sugarV'),
    pref:  stepper('prefN', 'prefDec', 'prefInc', 'pref', 0, 5, 'unit.percentPref', 'prefV'),
    bhyd:  stepper('bhydN', 'bhydDec', 'bhydInc', 'bhyd', 0, 1, 'unit.percentBhyd', 'bhydV'),
    yeast: stepper('yeastN', 'yeastDec', 'yeastInc', 'yeast', 2, 0.05, 'unit.percentYeast', 'yeastV'),
    ddt:   stepper('ddtN', 'ddtDec', 'ddtInc', 'ddt', 1, 0.5, 'unit.celsiusDdt', 'ddtV'),
    room:  stepper('roomN', 'roomDec', 'roomInc', 'room', 0, 1, 'unit.celsiusRoom', 'roomV'),
    flourTemp: stepper('flourTempN', 'flourTempDec', 'flourTempInc', 'flourTemp', 0, 1, 'unit.celsiusFlourTemp', 'flourTempV')
  };

  // --- Quick-Pills ---
  document.querySelectorAll('[data-ballw]').forEach(b => b.onclick = () => PZ.set.ballw(b.dataset.ballw));
  document.querySelectorAll('[data-yeast]').forEach(b => b.onclick = () => PZ.set.yeast(b.dataset.yeast));
  // Mengensteuerung vereinfachen (v3.70.0): permanent sichtbare Schnellwahl-Chips für
  // die 5 neuen Stepper-Felder (Gewicht/Teigling hatte diese Chips bereits vorher, s. o.).
  // Vorteig-Anteil/Biga-Hydration/DDT/Raumtemperatur/Mehltemperatur bekommen bewusst
  // KEINE neuen Chips (s. Kommentare in pizza-rechner.html/-mobile.html) -- Hefemenge hat
  // mit #yeastPills direkt oben bereits ihre eigene, etablierte Schnellwahl.
  document.querySelectorAll('[data-balls]').forEach(b => b.onclick = () => PZ.set.balls(b.dataset.balls));
  document.querySelectorAll('[data-hyd]').forEach(b => b.onclick = () => PZ.set.hyd(b.dataset.hyd));
  document.querySelectorAll('[data-salt]').forEach(b => b.onclick = () => PZ.set.salt(b.dataset.salt));
  document.querySelectorAll('[data-oil]').forEach(b => b.onclick = () => PZ.set.oil(b.dataset.oil));
  document.querySelectorAll('[data-sugar]').forEach(b => b.onclick = () => PZ.set.sugar(b.dataset.sugar));

  // --- Vorteig-Reife-Stufen: koppeln Reifezeit + Hefemenge (physikalisch abhängig) ---
  // yeast = % bezogen auf Gesamtmehl (geht bei Vorteig komplett in den Vorteig).
  // Werte >= 0,18 % halten die Hauptteig-Gare in einem praktikablen Rahmen.
  PZ.PREF_STAGES = {
    biga: [
      { key: 'b16', label: '16 h · 0,4 %', mature: 16, yeast: 0.4 },
      { key: 'b24', label: '24 h · 0,3 %', mature: 24, yeast: 0.3 },
      { key: 'b48', label: '48 h · 0,2 %', mature: 48, yeast: 0.2 }
    ],
    poolish: [
      { key: 'p8',  label: '8 h · 0,4 %',  mature: 8,  yeast: 0.4 },
      { key: 'p14', label: '14 h · 0,2 %', mature: 14, yeast: 0.2 },
      { key: 'p24', label: '24 h · 0,18 %', mature: 24, yeast: 0.18 }
    ]
  };
  // Seit v3.56.0: gemeinsame Fabrik PZ.makePrefStages() (js/widgets.js) statt eigener
  // render/highlight/select-Implementierung. onSelectClick setzt bei Nutzer-Klick auf
  // eine Pill #preset auf "Eigene" zurück (unverändert wie bisher) — der
  // programmatische Aufruf aus applyMethod()/presets.js unten tut das NICHT.
  const prefStages = PZ.makePrefStages({
    stateObj: state,
    wrapId: 'prefStage',
    valId: 'prefStageVal',
    setYeast: function (y) { PZ.set.yeast(y); }, // setzt Hefe + löst calc() aus
    onSelectClick: function () { const p = $('preset'); if (p) p.value = ''; }
  });
  function renderPrefStages(m) { prefStages.render(m); }
  function selectPrefStage(m, key) { prefStages.select(m, key); }
  PZ.selectPrefStage = selectPrefStage;

  // --- Segment-Buttons ---
  // Seit v3.56.0: gemeinsame Fabrik PZ.makeSeg() (js/widgets.js) statt eigener
  // Implementierung — onSet:PZ.calc löst wie bisher die Neuberechnung aus.
  const seg = PZ.makeSeg({ stateObj: state, onSet: PZ.calc });
  function selectSeg(cid, attr, val) {
    const c = $(cid);
    c.querySelectorAll('button').forEach(b => {
      const on = b.dataset[attr] == String(val);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function applyMethod() {
    const m = state.method;
    const isPref = m !== 'direct';
    $('prefBlock').classList.toggle('show', isPref);
    $('bigaHydBlock').classList.toggle('show', m === 'biga');
    $('prefStageBlock').classList.toggle('show', isPref);
    $('stagePref').classList.toggle('show', isPref);
    $('stageMain').classList.toggle('show', isPref);
    // Bei Vorteig steuert die Reife-Stufe die Hefe → generische Hefe-Pills ausblenden
    $('yeastPills').style.display = isPref ? 'none' : '';
    $('yeastHint').innerHTML = isPref ? t('hint.yeast.pref') : t('hint.yeast.normal');
    // Sichtbare Kopplung (v3.31.0): Hefemenge-Regler wirkt bei aktiver Vorteig-Reife-
    // Stufe optisch gesperrt (ausgegraut + Schloss-Badge), damit Nutzer ihn nicht für
    // frei einstellbar halten — die Kopplung selbst (selectPrefStage setzt die Hefe)
    // ist unverändert, der Regler bleibt technisch bedienbar.
    $('yeastField').classList.toggle('coupled', isPref);
    $('yeastCoupledBadge').hidden = !isPref;
    // accessibility-expert-Befund (v3.70.0, MINOR): die optische Kopplung allein (Klasse
    // "coupled", s. CSS) teilt Screenreader-Nutzern den gesperrten Zustand nicht mit --
    // aria-disabled an den beiden neuen Stepper-Buttons ergänzt (der Regler bleibt bewusst
    // technisch bedienbar, s. Kommentar oben, daher aria-disabled statt disabled).
    $('yeastDec').setAttribute('aria-disabled', String(isPref));
    $('yeastInc').setAttribute('aria-disabled', String(isPref));
    $('methodHint').innerHTML = t('hint.method.' + m);
    $('prefTitle').textContent = m === 'biga' ? t('label.prefTitle.biga') : t('label.prefTitle.poolish');
    $('prefHint').innerHTML = m === 'biga' ? t('hint.pref.biga') : t('hint.pref.poolish');
    // Reife-Stufen für die gewählte Methode rendern und eine gültige Stufe aktivieren
    if (isPref) {
      renderPrefStages(m);
      prefStages.selectValidOrDefault(m);
    }
  }

  // --- Zeitplan-Eingaben ---
  function updateTimeLabel() {
    const isTarget = state.timeMode === 'target';
    $('timeLabel').textContent = isTarget ? t('label.timeMode.target') : t('label.timeMode.start');
    $('timeHint').textContent = isTarget ? t('hint.timeMode.target') : t('hint.timeMode.start');
  }

  seg('method', 'm', 'method', applyMethod);
  seg('yeastType', 'y', 'yeastType');
  seg('knead', 'k', 'knead');
  seg('coldStage', 'cs', 'coldStage');
  seg('timeMode', 'tm', 'timeMode', updateTimeLabel);

  $('timeISO').addEventListener('input', () => { state.timeISO = $('timeISO').value; PZ.calc(); });
  $('nowBtn').addEventListener('click', () => {
    const d = new Date(); d.setSeconds(0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $('timeISO').value = iso; state.timeISO = iso; PZ.calc();
  });

  PZ.seg = seg;
  PZ.selectSeg = selectSeg;
  PZ.applyMethod = applyMethod;
  PZ.updateTimeLabel = updateTimeLabel;

  // Sprachwechsel: Methode-/Zeitplan-Hinweistexte und die Vorteig-Reife-Pills (deren
  // Labels selbst sprachneutral aus Zahlen bestehen, aber ihre umgebenden Hinweise nicht)
  // neu rendern. Seit v3.70.0 kein refreshUnits() mehr nötig: die Regler-Einheiten hängen
  // jetzt an statischen aria-describedby-Spans (".unit", übersetzungsfrei -- "%"/"g"/"°C"
  // sind in DE/EN identisch) statt an einem live nachgeführten aria-valuetext auf einem
  // (inzwischen entfernten) Slider.
  if (PZ.i18nOnChange) {
    PZ.i18nOnChange(function () {
      applyMethod();
      updateTimeLabel();
    });
  }
})(window);
