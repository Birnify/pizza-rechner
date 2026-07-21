/* ui.js — Bedienelemente: Slider/Zahlenfelder, Segmente, Pills, Zeitplan */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const state = PZ.state;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // --- Slider <-> Number Verknüpfung ---
  // `unitKey` liefert (per PZ.t()) einen aria-valuetext fürs Screenreader-Ansagen
  // (z. B. "62 percent hydration" statt einer nackten Zahl) — reine a11y-Ergänzung,
  // ändert keine Berechnungslogik. Ein Wörterbuch-KEY statt eines fertigen Strings,
  // damit ein späterer Sprachwechsel den bereits gesetzten aria-valuetext auf den
  // vorhandenen Slidern aktualisieren kann (s. refreshUnits() weiter unten).
  // Seit v3.56.0: gemeinsame Fabrik PZ.makeLink() (js/widgets.js) statt eigener
  // Implementierung — clamp:true behält das bestehende Zahlenfeld-Clamping (v3.51.0)
  // bei, onSet:PZ.calc löst wie bisher die Neuberechnung nach jedem Setzen aus.
  const unitLinks = []; // { slider, unitKey } — für refreshUnits() bei Sprachwechsel
  const link = PZ.makeLink({ stateObj: state, onSet: PZ.calc, clamp: true, unitLinks: unitLinks });

  // Setter-Sammlung (von presets.js und storage.js genutzt)
  PZ.set = {
    balls: link('balls', 'ballsN', 'balls', 0, 'unit.balls'),
    ballw: link('ballw', 'ballwN', 'ballw', 0, 'unit.grams'),
    hyd:   link('hyd', 'hydN', 'hyd', 0, 'unit.percentHyd'),
    salt:  link('salt', 'saltN', 'salt', 1, 'unit.percentSalt'),
    oil:   link('oil', 'oilN', 'oil', 1, 'unit.percentOil'),
    sugar: link('sugar', 'sugarN', 'sugar', 1, 'unit.percentSugar'),
    pref:  link('pref', 'prefN', 'pref', 0, 'unit.percentPref'),
    bhyd:  link('bhyd', 'bhydN', 'bhyd', 0, 'unit.percentBhyd'),
    yeast: link('yeast', 'yeastN', 'yeast', 2, 'unit.percentYeast'),
    ddt:   link('ddt', 'ddtN', 'ddt', 1, 'unit.celsiusDdt'),
    room:  link('room', 'roomN', 'room', 0, 'unit.celsiusRoom'),
    flourTemp: link('flourTemp', 'flourTempN', 'flourTemp', 0, 'unit.celsiusFlourTemp')
  };

  // Bei Sprachwechsel: aria-valuetext aller Regler neu setzen (Wert bleibt gleich,
  // nur die Einheit übersetzt sich), s. Aufruf ganz unten in dieser Datei.
  function refreshUnits() {
    unitLinks.forEach(function (u) {
      u.slider.setAttribute('aria-valuetext', u.fmt(parseFloat(u.slider.value)) + ' ' + t(u.unitKey));
    });
  }

  // --- Quick-Pills ---
  document.querySelectorAll('[data-ballw]').forEach(b => b.onclick = () => PZ.set.ballw(b.dataset.ballw));
  document.querySelectorAll('[data-yeast]').forEach(b => b.onclick = () => PZ.set.yeast(b.dataset.yeast));

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

  // Sprachwechsel: Regler-Einheiten (aria-valuetext), Methode-/Zeitplan-Hinweistexte
  // und die Vorteig-Reife-Pills (deren Labels selbst sprachneutral aus Zahlen bestehen,
  // aber ihre umgebenden Hinweise nicht) neu rendern.
  if (PZ.i18nOnChange) {
    PZ.i18nOnChange(function () {
      refreshUnits();
      applyMethod();
      updateTimeLabel();
    });
  }
})(window);
