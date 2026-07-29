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
  // Seit v4.24.0: onSet bekommt den geänderten Feld-Key mit -- wird gebraucht, um die
  // Hefemenge einer aktiven Poolish-Reife-Stufe mit rel:'pref' nachzuziehen (sonst
  // driftet die Dosis, s. Kommentar bei PZ.PREF_STAGES unten).
  // v4.24.1: NICHT nur bei "pref". select() rechnet mit dem in js/calc.js geklemmten
  // prefEff = min(pref, hyd / pHyd), und dieser Klemmwert hängt genauso an "hyd" (und
  // bei Biga über pHyd an "bhyd"). Wurde nur "pref" nachgezogen, blieb die Hefemenge
  // nach einer reinen Hydration-Senkung stehen und war um den Klemmfaktor zu hoch
  // (gemessen: Preset "Napoli mit Poolish (kalt)", Hydration 66 -> 60, Dosis 1,1 %
  // statt 1,0 %). Der Resync ist bei rel:'total' (Biga) idempotent, deshalb ist die
  // breitere Auslöserliste dort folgenlos.
  // `prefStages` wird erst weiter unten in dieser Datei zugewiesen -- unproblematisch,
  // da diese Funktion erst bei einer späteren Nutzerinteraktion aufgerufen wird.
  const PREF_CLAMP_KEYS = ['pref', 'hyd', 'bhyd'];
  const stepper = PZ.makeStepper({
    stateObj: state,
    onSet: function (key) {
      if (PREF_CLAMP_KEYS.indexOf(key) !== -1 && state.method !== 'direct' && prefStages) prefStages.resync(state.method);
      PZ.calc();
    },
    announceId: 'stepperLiveMsg'
  });

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
  // v4.28.0: ein Pill-Klick setzt state.scheduleOverride explizit zurück (auch wenn
  // #preset selbst dabei bewusst NICHT zurückgesetzt wird, s. Kommentar in js/presets.js)
  // -- sonst würde nach dem Laden von "teglia"/"newyork_style" ein Klick auf eine der
  // generischen Hefe-Pills die tatsächliche Hefemenge ändern, aber der alte Override-
  // Fahrplan (z. B. "Teglia-Kaltgare · ~76 h") bliebe trotzdem sichtbar -- deutlich
  // irreführender als die rein kosmetische #preset-Altlast.
  document.querySelectorAll('[data-yeast]').forEach(b => b.onclick = () => { PZ.state.scheduleOverride = null; PZ.set.yeast(b.dataset.yeast); });
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
  // Jede Stufe trägt seit v4.24.0 ein explizites `rel`-Feld, das die Bezugsgröße von
  // `yeast` festlegt (keine stille Asymmetrie zwischen den Methoden):
  //   rel: 'total' — % bezogen auf das GESAMT-Mehl (geht bei Vorteig komplett in den
  //                  Vorteig). Bisheriges, unveränderliches Verhalten -- weiterhin für Biga.
  //   rel: 'pref'  — % bezogen auf das POOLISH-Mehl selbst (alle 14 ausgewerteten Quellen
  //                  geben Poolish-Hefe so an). PZ.makePrefStages() (js/widgets.js)
  //                  rechnet bei rel:'pref' zur Anwendungszeit um: state.yeast (%
  //                  Gesamtmehl) = stage.yeast * (state.pref / 100) -- und zieht das bei
  //                  jeder Änderung des Vorteig-Anteil-Reglers automatisch nach (sonst
  //                  würde die tatsächliche Poolish-Hefedosis mit dem Regler wegdriften,
  //                  genau der Fehler, den diese Umstellung behebt).
  // Biga-Werte unverändert (eigene Quellenrecherche für Biga steht noch aus, s. Backlog
  // in pizza-rechner-KONTEXT.md). Poolish-Werte seit v4.24.0 aus 14 ausgewerteten Online-
  // Quellen abgeleitet (Plötzblog, Manopasto, My Pizza Corner u. a., s. Kontextdatei) --
  // NICHT selbst gebacken/verifiziert, nur quellenbasiert plausibilisiert.
  PZ.PREF_STAGES = {
    // Seit v4.25.0: aus 12 ausgewerteten Quellen abgeleitet (NICHT selbst gebacken/
    // verifiziert, s. pizza-rechner-KONTEXT.md) -- ersetzt die drei alten, unbelegten
    // Stufen (0,4/0,3/0,2 %). Jetzt rel:'pref' (Hefe bezogen aufs BIGA-Mehl, wie beim
    // Poolish), vorher rel:'total'. Beide Stufen landen bei 1,0 % Hefe -- das ist KEIN
    // Copy-Paste, sondern kommt aus zwei unabhängigen Quellen: b_klassisch aus drei
    // Quellen, die die Hefeart eindeutig als FRISCH benennen -- PizzaBlab (einzige
    // Regelquelle: "0,3 % Trockenhefe oder 1 % Frischhefe bezogen aufs Biga-Mehl" bei
    // 16-20 h/~20 °C), Salamico (klassische Formel 100-44-1, "10 g frische Hefe") und
    // Pala Pizza ("2 g instant dry yeast" = 0,4 % Trockenhefe, x3 = 1,2 % Frischhefe-
    // Äquivalent). Gozney (Nutzerquelle, 1 %, 16-18 h bei 16-18 °C) nennt den Wert
    // konsistent, aber OHNE Angabe der Hefeart -- deshalb hier nicht als vierter Beleg
    // gezählt (s. pizza-rechner-KONTEXT.md fuer die volle Einordnung). b_kalt aus
    // Burnhard (Nutzerquelle, exakt 48 h im Kühlschrank, ebenfalls 1 %). Die Kaltstufe
    // kompensiert die Kälte über die DREIFACHE DAUER (48 h statt 17 h), nicht über
    // mehr Hefe.
    biga: [
      { key: 'b_klassisch', label: '17 h · 1,0 %', mature: 17, yeast: 1.0, rel: 'pref' },
      { key: 'b_kalt', label: '48 h · 1,0 %', mature: 48, yeast: 1.0, rel: 'pref' }
    ],
    poolish: [
      // p_warm: 0,6 % Poolish-Mehl bei ~10 h Raumtemp (My Pizza Corner, zugleich Median
      // der 5 ausgewerteten Warm-Quellen). p_cold: 1,0 % Poolish-Mehl bei 1 h Raumtemp
      // + 24 h Kühlschrank (Manopasto + Plötzblog, unabhängig übereinstimmend) -- bewusst
      // MEHR Hefe als die Warm-Stufe, weil "länger = weniger Hefe" nur bei gleicher
      // Temperatur gilt, nicht wenn die längere Stufe zusätzlich kalt geführt wird.
      { key: 'p_warm', label: '10 h · 0,6 %', mature: 10, yeast: 0.6, rel: 'pref' },
      { key: 'p_cold', label: '24 h · 1,0 %', mature: 24, yeast: 1.0, rel: 'pref' }
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
    // Backlog Punkt J (v4.12.0, WCAG 2.4.3): #prefBlock/#bigaHydBlock/#prefStageBlock
    // werden hier ggf. MEHRERE gleichzeitig ausgeblendet (z. B. Biga -> Direkt blendet
    // alle drei auf einmal aus) -- deshalb EIN gebündelter PZ.moveFocusBeforeHide()-Aufruf
    // mit der vollständigen Liste der tatsächlich verschwindenden Container, BEVOR
    // irgendeine der .show-Klassen entfernt wird (s. Batch-Warnung in js/dom.js). Ohne
    // Bündelung würde ein einzeln aufgerufener Helfer den Fokus u. U. auf einen Nachbarn
    // legen, der im nächsten Schritt selbst mit ausgeblendet wird -- der Fokus ginge dann
    // trotzdem verloren, nur einen Schritt später. Fallback-Ziel: der Methode-
    // Segmentschalter selbst (bleibt in jedem Fall sichtbar, ist der naheliegendste
    // "vorige" Bezugspunkt für einen Methodenwechsel).
    const prefBlockEl = $('prefBlock'), bigaHydBlockEl = $('bigaHydBlock'), prefStageBlockEl = $('prefStageBlock');
    const hidingNow = [];
    if (!isPref && prefBlockEl.classList.contains('show')) hidingNow.push(prefBlockEl);
    if (m !== 'biga' && bigaHydBlockEl.classList.contains('show')) hidingNow.push(bigaHydBlockEl);
    if (!isPref && prefStageBlockEl.classList.contains('show')) hidingNow.push(prefStageBlockEl);
    if (hidingNow.length && PZ.moveFocusBeforeHide) PZ.moveFocusBeforeHide(hidingNow, $('method'));
    prefBlockEl.classList.toggle('show', isPref);
    bigaHydBlockEl.classList.toggle('show', m === 'biga');
    prefStageBlockEl.classList.toggle('show', isPref);
    // #stagePref/#stageMain (Ergebnis-Panel, Vorteig-/Hauptteig-Aufteilung) enthalten
    // ausschließlich reinen Anzeigetext (keine Buttons/Eingabefelder) -- kein
    // Fokus-Schutz nötig, PZ.moveFocusBeforeHide() wäre hier ein reines No-op.
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

  // v4.28.0: state.scheduleOverride NUR hier zurücksetzen, nicht innerhalb applyMethod()
  // selbst -- applyMethod() wird nämlich auch NICHT-nutzerinitiiert aufgerufen (aus
  // applyPreset()/applyState() nach dem Setzen von state.method, UND bei jedem
  // Sprachwechsel über PZ.i18nOnChange() weiter unten in dieser Datei). Ein Reset
  // innerhalb applyMethod() selbst hatte genau diese beiden Aufrufer kaputt gemacht: ein
  // Sprachwechsel und ein Rezept-Laden während eines aktiven Overrides löschten ihn
  // fälschlich (per echtem Headless-Test gefunden, s. pizza-rechner-KONTEXT.md). Dieser
  // Wrapper läuft dagegen AUSSCHLIESSLICH innerhalb des seg()-onclick-Handlers
  // (js/widgets.js makeSeg), also nur bei einem echten Nutzer-Klick auf das
  // Methode-Segment.
  seg('method', 'm', 'method', function () { state.scheduleOverride = null; applyMethod(); });
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
