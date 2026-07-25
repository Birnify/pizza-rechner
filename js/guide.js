/* guide.js — adaptive Schritt-für-Schritt-Anleitung + Zeitberechnung
 *
 * Übersetzt (js/i18n.js, v3.28.0): jeder zuvor hartkodierte deutsche Textbaustein ist
 * jetzt ein PZ.t()-Aufruf mit {platzhaltern} für die interpolierten Werte (Mengen,
 * Zeiten, Mehlname …). Die Struktur/Logik (welcher Schritt wann erscheint, welche
 * Bedingungen greifen) ist unverändert — nur die Textbausteine kommen jetzt aus dem
 * Wörterbuch statt als String-Literal im Code zu stehen. `t` unten ist ein dünner
 * Wrapper: liefert bei fehlender js/i18n.js (sollte nicht vorkommen) den rohen Key
 * zurück statt zu crashen (kein deutscher Fallback-Text wie in js/schedule.js — bei
 * hunderten Aufrufstellen mit interpolierten {platzhaltern} wäre ein echter Text-
 * Fallback je Key unverhältnismäßig; i18n.js ist in der Praxis immer geladen, s.
 * `<script>`-Reihenfolge in pizza-rechner.html/-mobile.html).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Rundung/Formatierung für Mengenangaben, INKL. Einheit (v3.65.0: über js/units.js,
  // damit die Anleitung im Imperial-Modus oz/lb statt g zeigt). Alle Wörterbuch-
  // Einträge, die {platzhalter} für Gewichte nutzen, haben deshalb KEIN hartkodiertes
  // " g" mehr im Text selbst (s. js/i18n-dict.js) — g(x) liefert bereits den fertigen
  // String inkl. Einheit. Fallback reproduziert 1:1 das bisherige Metrisch-Verhalten,
  // falls js/units.js aus irgendeinem Grund nicht geladen ist.
  function g(x) {
    if (PZ.formatWeightAuto) return PZ.formatWeightAuto(x);
    return (x < 10 ? (Math.round(x * 100) / 100) : Math.round(x)) + ' g';
  }
  // Temperatur, ebenfalls inkl. Einheit (°C/°F je nach Einheitensystem).
  function gt(x) {
    return PZ.formatTemp ? PZ.formatTemp(x) : x + '°C';
  }

  function fmtClock(d) {
    const wd = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return t('guide.weekday.' + i); })[d.getDay()];
    const p = n => String(n).padStart(2, '0');
    return `${wd} ${p(d.getDate())}.${p(d.getMonth() + 1)}. · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fmtDur(min) {
    min = Math.round(min);
    if (min < 60) return min + ' ' + t('guide.dur.min');
    const h = Math.round(min / 60);
    if (h < 24) return h + ' ' + t('guide.dur.h');
    const d = Math.floor(h / 24), r = h % 24;
    return d + ' ' + t('guide.dur.day') + (r ? ' ' + r + ' ' + t('guide.dur.h') : '');
  }

  // Bausteine für die _items-Liste
  let _items = [];
  function sec(txt) { _items.push({ sec: txt }); }
  function st(title, chip, body, extra, dur, opts) {
    _items.push(Object.assign({ title, chip, body, extra: extra || '', dur: dur || 0 }, opts || {}));
  }
  // Einklappbare Hinweisboxen mit gegenseitigem Ausschluss (v4.10.0, Backlog Punkt H,
  // "Akkordeon"): tip()/warn() bauten bis hierher permanent sichtbare `<div class="tip">`/
  // `<div class="warn">`-Volltextblöcke. Jetzt liefern beide stattdessen einen kompakten
  // Toggle-Button (.hint-toggle, initial `aria-expanded="false"`) + einen initial
  // versteckten Volltext-Container (.hint-body). App-weites Single-Open-Verhalten (immer
  // maximal EIN Hinweis gleichzeitig offen, über alle Schritte hinweg) wird unten im
  // gemeinsamen, bereits bestehenden delegierten Klick-Listener auf #guideSteps ergänzt --
  // da es je Seite (Desktop/Mobil) nur diesen EINEN #guideSteps-Container gibt, ist "app-
  // weit" damit automatisch erfüllt, ohne eigene globale Zustandsvariable. Technisches
  // Vorbild: js/glossary.js löst dasselbe Grundmuster (ein Artikel offen schließt alle
  // anderen) scoped auf eine <details>-Liste -- hier ist die Struktur (Button + Div statt
  // <details>/<summary>) bewusst anders, weil mehrere Hinweisboxen INNERHALB eines einzigen
  // Anleitungsschritts vorkommen können (z. B. Warnung + Öl-Tipp im selben Schritt), wo ein
  // natives <details> die visuelle .step-Karte stärker verändert hätte.
  // `_hintSeq` (Reset je buildGuide()-Durchlauf, analog `_usedGlossaryIds`) vergibt
  // eindeutige IDs für die aria-controls-Verknüpfung Button -> Textcontainer.
  let _hintSeq = 0;
  function hintBox(kind, icon, txt) {
    const id = 'hintbox-' + (_hintSeq++);
    const label = t(kind === 'warn' ? 'guide.hint.toggleWarn' : 'guide.hint.toggleTip');
    return `<div class="hintbox hintbox-${kind}">` +
      `<button type="button" class="hint-toggle" aria-expanded="false" aria-controls="${id}">` +
      `<span class="hint-toggle-icon" aria-hidden="true">${icon}</span>` +
      `<span class="hint-toggle-label">${label}</span>` +
      `</button>` +
      `<div class="hint-body" id="${id}">${txt}</div>` +
      `</div>`;
  }
  function tip(txt) { return hintBox('tip', '💡', txt); }
  function warn(txt) { return hintBox('warn', '⚠️', txt); }
  // Timer-Widget-Platzhalter für Schritte mit nennenswerter Wartezeit (js/timer.js rendert hinein).
  // Feature-Flag "timer" (js/settings.js): ist das Feature deaktiviert, wird gar kein
  // Platzhalter gerendert — js/timer.js findet dann nichts zu verdrahten, und das damit
  // verknüpfte Teil-Feature "timerSystem" (System-Wecker/Kalender-Links) wird automatisch
  // mit ausgeblendet. `tests/test.html` lädt `js/settings.js` mit und setzt `PZ.FLAGS` dort
  // explizit auf eine "alles an"-Baseline (s. test.html) — der `PZ.FLAGS &&`-Guard bleibt
  // trotzdem als defensive Absicherung stehen, falls `PZ.FLAGS` einmal fehlt.
  function timerBox(key, min) {
    if (PZ.FLAGS && PZ.FLAGS.timer === false) return '';
    return `<div class="timerbox" data-timer-key="${key}" data-timer-min="${Math.round(min)}"></div>`;
  }

  // Foto der fertigen Pizza (v3.69.0, "Foto der fertigen Pizza am Ende der Anleitung"):
  // abschließender Anleitungsschritt nach dem letzten Backschritt, Foto passend zur
  // gewählten Pizzaform (Feedback von Sörens Kollegen Benjamin). Zuordnung AUSSCHLIESSLICH
  // nach dem aktiven Preset-Key -- es gibt bewusst kein `state.preset` (der Preset-Wert
  // lebt nur im #preset-Dropdown selbst), deshalb wird dessen DOM-Wert direkt gelesen statt
  // eines State-Felds. `lastAppliedPresetKey` in js/presets.js wäre hierfür ungeeignet: er
  // wird bei manueller Reglerabweichung NICHT zurückgesetzt, das #preset-Element selbst aber
  // schon (s. presets.js, Slider-Listener setzen `$('preset').value = ''`). Alles außer
  // 'teglia'/'newyork_style' (leer = "Eigene Einstellung", jedes andere Preset, ein
  // geladenes eigenes Rezept "recipe:<id>") fällt auf das neapolitanische Foto zurück.
  const FINAL_PHOTO = {
    teglia: { src: 'assets/pizza-final-teglia.jpg', altKey: 'guide.step.finalPhoto.alt.teglia' },
    newyork_style: { src: 'assets/pizza-final-newyork.jpg', altKey: 'guide.step.finalPhoto.alt.newyork' }
  };
  function finalPhoto() {
    const presetEl = $('preset');
    const key = presetEl ? presetEl.value : '';
    return FINAL_PHOTO[key] || { src: 'assets/pizza-final-neapolitanisch.jpg', altKey: 'guide.step.finalPhoto.alt.napoli' };
  }

  // Glossar-Verweis (v3.68.0, "Glossar-Verweise in der Anleitung"): kleiner klickbarer
  // Sprung-Link am Ende eines Anleitungsschritts zu einem passenden, bereits bestehenden
  // Glossar-Eintrag (z. B. Autolyse, Poolish, Biga, Kaltgare, Ofen-Heizarten). Reiner
  // Anzeige-/Navigations-Baustein, keine neue Berechnung. Wird als eigene, separate Zeile
  // gerendert (nicht im Schritt-Titel selbst), damit Titel-Chip/Timechip nicht überladen
  // werden. `data-glossary-id` wird vom einzigen delegierten Klick-Listener auf
  // #guideSteps weiter unten ausgelesen (identisches Delegations-Muster wie der
  // bestehende ".schedbar-goto-zeitplan"-Sprung). `.glossary-ref` wird bewusst NICHT in
  // PDF-Export (js/pdf.js, extrahiert nur `.tip`/`.warn` als "extras") oder Druck
  // (`@media print`, s. css/styles.css) übernommen -- ein Klick-Link ist auf Papier
  // nutzlos.
  // Dedup (v3.69.1-Bugfix): derselbe Glossar-Begriff soll nur EINMAL pro Anleitung
  // verlinkt werden -- am ersten Schritt, an dem er vorkommt (z. B. "ofenHeizarten" trat
  // vorher sowohl am Vorheiz- als auch am Back-Schritt auf). `_usedGlossaryIds` wird bei
  // jedem buildGuide()-Durchlauf zusammen mit `_items` zurückgesetzt (s. u.); spätere
  // Vorkommen derselben `glossaryId` werden hier still unterdrückt (leerer String), die
  // Zuordnung Schritt→glossaryId in den einzelnen st(...)-Aufrufen bleibt unverändert.
  let _usedGlossaryIds = new Set();
  function glossaryLinkHtml(id) {
    if (!id) return '';
    if (_usedGlossaryIds.has(id)) return '';
    _usedGlossaryIds.add(id);
    const term = t('glossary.' + id + '.title');
    const label = t('guide.glossaryLink.label', { term: term });
    // `aria-hidden="true"` aufs Icon (v3.69.1, accessibility-expert-Befund): verhindert,
    // dass Screenreader das 📖-Emoji zusätzlich zum ohnehin vorgelesenen Button-Text
    // ansagen (redundante Doppelansage). Eigenes <span> statt reinem Text-Knoten, damit
    // es weiterhin als eigenes Flex-Item neben dem Button steht (s. .glossary-ref-CSS).
    return `<div class="glossary-ref"><span aria-hidden="true">📖</span><button type="button" class="step-glossary-link" data-glossary-id="${id}">${label}</button></div>`;
  }

  // Inline-Verlinkung von Glossar-Begriffen im Anleitungstext (v4.9.0, Backlog Punkt A):
  // ersetzt -- statt eines zusätzlichen separaten Zeilenlinks (glossaryLinkHtml() oben) --
  // das ERSTE wörtliche Vorkommen des exakten Glossar-Artikeltitels innerhalb eines
  // übergebenen Textausschnitts (Schritt-Titel ODER -Textkörper) durch einen klickbaren
  // Begriff, der denselben gotoGlossaryEntry()-Sprung auslöst wie der bisherige Zeilenlink
  // (identisches `data-glossary-id`-Attribut, vom selben delegierten Klick-Listener weiter
  // unten ausgelesen). Reine Textersetzung per `indexOf` -- bewusst KEIN Regex-/HTML-Parser:
  // die Kandidatentexte hier (Schritt-Titel, kurze Body-Sätze) sind bekannt und enthalten
  // an den fraglichen Stellen kein Markup, das den Treffer verschlucken könnte. Die
  // Tag-Balance-Prüfung (`openTags !== closeTags`) ist eine defensive Zusatzsicherung,
  // falls sich das doch mal ändert -- verhindert, dass mitten in ein `<b>`-Tag/-Attribut
  // hineingeschrieben wird.
  //
  // Nutzt `_usedGlossaryIds` (s. o.) als GEMEINSAMEN Dedup-Speicher mit
  // glossaryLinkHtml(): wird ein Begriff hier bereits inline verlinkt, markiert diese
  // Funktion die ID sofort als "verbraucht" -- der Aufrufer lässt dann `glossaryId` beim
  // zugehörigen st(...)-Aufruf weg (kein zusätzlicher Zeilenlink mehr). Kommt der exakte
  // Titel nicht wörtlich vor, bleibt der Text unverändert und die ID unverbraucht -- der
  // Aufrufer reicht `glossaryId` unverändert weiter, sodass glossaryLinkHtml() wie bisher
  // den separaten Zeilenlink als Fallback rendert (Vorgabe: keine erzwungene Verlinkung
  // ohne wörtlichen Vorkommen).
  function inlineGlossaryLink(text, id) {
    if (!id || _usedGlossaryIds.has(id)) return text;
    const term = t('glossary.' + id + '.title');
    if (!term) return text;
    const idx = text.indexOf(term);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const openTags = (before.match(/</g) || []).length;
    const closeTags = (before.match(/>/g) || []).length;
    if (openTags !== closeTags) return text; // Treffer mitten in einem Tag -> nicht ersetzen
    _usedGlossaryIds.add(id);
    const linked = `<button type="button" class="inline-glossary-link" data-glossary-id="${id}">${term}</button>`;
    return before + linked + text.slice(idx + term.length);
  }

  function buildGuide() {
    const state = PZ.state;
    const R = PZ.R;
    if (!R.flour) return;
    const f = PZ.schedule();

    // Mehl-Warnung (bei Vorteig zählt die eingestellte Reifezeit mit zur Gesamtgärzeit)
    if (PZ.getFlour) {
      const fl = PZ.getFlour();
      const prefH = state.method !== 'direct' ? state.prefMature : 0;
      const totalH = (f.bulkMin + f.proofMin) / 60 + prefH;
      const warnMsgs = [];
      if (totalH > fl.maxH) {
        warnMsgs.push(t('guide.warn.gareTooLong', { flourName: fl.name, flourW: fl.w, hours: Math.round(totalH), maxH: fl.maxH }));
      } else if (fl.minH > 0 && totalH < fl.minH) {
        warnMsgs.push(t('guide.warn.gareTooShort', { flourName: fl.name, flourW: fl.w, hours: Math.round(totalH), minH: fl.minH }));
      }
      if (state.hyd > fl.hydMax) {
        warnMsgs.push(t('guide.warn.hydTooHigh', { flourName: fl.name, hyd: state.hyd, hydMax: fl.hydMax }));
      } else if (state.hyd < fl.hydMin) {
        warnMsgs.push(t('guide.warn.hydTooLow', { flourName: fl.name, hyd: state.hyd, hydMin: fl.hydMin, hydMax: fl.hydMax }));
      }
      const warnEl = document.getElementById('flourWarn');
      if (warnEl) warnEl.innerHTML = warnMsgs.map(w => `<div class="warn">⚠️ ${w}</div>`).join('');
    }

    const m = state.method, isBiga = m === 'biga', pref = m !== 'direct';
    const prefName = isBiga ? 'Biga' : 'Poolish'; // Eigenname, sprachunabhängig
    const hi = state.hyd >= 70;               // hohe Hydration → Stretch & Fold
    const hasOil = R.oil >= 0.05;             // Öl im Rezept?
    // Öl kommt spät zum Teig (nach dem Salz, wenn das Gluten steht) — als Satzbaustein
    const oilStep = hasOil ? t('guide.oilStep', { oil: g(R.oil) }) : '';
    const oilTip = hasOil ? tip(t('guide.oilTip')) : '';
    const hasSugar = R.sugar >= 0.05;         // Zucker im Rezept? (New-York-Style-Feld)
    // Zucker kommt anders als Öl früh in den Teig (mit Mehl/Wasser/Hefe) — er
    // unterstützt die Hefeaktivität, statt (wie Öl) das Glutennetz zu stören.
    const sugarPhrase = hasSugar ? t('guide.sugarPhrase', { sugar: g(R.sugar) }) : '';
    const sugarTip = hasSugar ? tip(t('guide.sugarTip')) : '';
    // Backlog Punkt I (v4.11.0, "Zieltemperatur statt Eis in der Hauptanleitung"): die
    // Wassertemperatur-Schritte unten sprechen nur noch von der reinen Zieltemperatur,
    // kein Eis-/Eismengen-Text mehr (iceTxt/waterTemp.tip-Bausteine entfallen komplett).
    // R.ice/R.note bleiben in js/calc.js technisch weiter berechnet (Energiebilanz-Formel
    // unverändert), werden hier aber bewusst nicht mehr gelesen.
    let matureMin = 0;                        // Vorteig-Reifezeit (nur bei Biga/Poolish)
    _items = [];
    _usedGlossaryIds = new Set();              // Dedup-Reset je buildGuide()-Durchlauf
    _hintSeq = 0;                              // Hinweisbox-ID-Reset je buildGuide()-Durchlauf

    // ===== VORTEIG (Biga / Poolish) =====
    if (pref) {
      matureMin = Math.round(state.prefMature * 60);
      sec(isBiga ? t('guide.sec.prefBiga') : t('guide.sec.prefPoolish'));
      const clampNote = R.prefClamped
        ? warn(t('guide.pref.clampNote', { prefEff: Math.round(R.prefEff), hyd: state.hyd, prefType: isBiga ? 'Biga' : 'Poolish (1:1)' }))
        : '';
      st(t('guide.step.prefWeigh.title'), t('guide.chip.5min'),
        t('guide.step.prefWeigh.body', {
          prefName: prefName, pf: g(R.pf), pw: g(R.pw),
          hydTxt: isBiga ? state.bhyd + '%' : t('guide.pref.poolishRatio'),
          pYeast: g(R.pYeast), yWord: R.yWord
        }),
        clampNote + tip(t('guide.step.prefWeigh.tip')), 5);
      if (isBiga) {
        st(t('guide.step.bigaMix.title'), t('guide.step.bigaMix.chip'),
          t('guide.step.bigaMix.body'),
          warn(t('guide.step.bigaMix.warn')), 10);
        const bigaTempTxt = state.prefMature <= 20
          ? t('guide.biga.temp.cool')
          : state.prefMature <= 32
            ? t('guide.biga.temp.cooler')
            : t('guide.biga.temp.cold');
        st(inlineGlossaryLink(t('guide.step.bigaRest.title'), 'biga'), `${state.prefMature} ${t('guide.dur.h')}`,
          t('guide.step.bigaRest.body', { bigaTempTxt: bigaTempTxt }),
          tip(t('guide.step.bigaRest.tip')) + timerBox('biga-reifen', matureMin), matureMin,
          { glossaryId: _usedGlossaryIds.has('biga') ? undefined : 'biga' });
      } else {
        st(t('guide.step.poolishMix.title'), t('guide.step.poolishMix.chip'),
          t('guide.step.poolishMix.body'), '', 10);
        const poolishTempTxt = state.prefMature <= 14
          ? t('guide.poolish.temp.warm')
          : t('guide.poolish.temp.cold');
        st(inlineGlossaryLink(t('guide.step.poolishRest.title'), 'poolish'), `${state.prefMature} ${t('guide.dur.h')}`,
          t('guide.step.poolishRest.body', { poolishTempTxt: poolishTempTxt }),
          tip(t('guide.step.poolishRest.tip')) + timerBox('poolish-reifen', matureMin), matureMin,
          { glossaryId: _usedGlossaryIds.has('poolish') ? undefined : 'poolish' });
      }
      sec(t('guide.sec.main'));
      const hasMW = R.mWater >= 1, hasMF = R.mFlour >= 1;
      if (hasMW) {
        st(t('guide.step.waterTemp.title'), gt(R.wT),
          t('guide.step.waterTemp.body', { mWater: g(R.mWater), wT: gt(R.wT) }),
          '', 5);
      }
      const addParts = [];
      if (hasMW) addParts.push(t('guide.pref.addWater', { mWater: g(R.mWater) }));
      if (hasMF) {
        const yeastPart = R.mYeast >= 0.05 ? t('guide.pref.addFlour.yeastPart', { mYeast: g(R.mYeast), yWord: R.yWord }) : '';
        const sugarPart = hasSugar ? t('guide.pref.addFlour.sugarPart', { sugar: g(R.sugar) }) : '';
        addParts.push(t('guide.pref.addFlour', { mFlour: g(R.mFlour), yeastPart: yeastPart, sugarPart: sugarPart }));
      }
      const titleSuffix = (hasMW ? t('guide.titleSuffix.water') : '') + (hasMF ? t('guide.titleSuffix.flour') : '') + (hasSugar ? t('guide.titleSuffix.sugar') : '');
      st(t('guide.prefGenericTitle') + titleSuffix, t('guide.chip.5min'),
        t('guide.step.prefCombine.body', {
          prefName: prefName,
          addParts: addParts.length ? addParts.join(t('guide.pref.joinThen')) : t('guide.pref.noAddParts'),
          mixPhrase: state.knead === '6' ? t('guide.mix.machine') : t('guide.mix.hand')
        }), sugarTip, 5);
      st(t('guide.step.saltAdd.title') + (hasOil ? t('guide.suffix.oil') : ''), t('guide.step.saltAdd.chip'),
        t('guide.step.saltAdd.body', {
          salt: g(R.salt),
          saltPhrase: state.knead === '6' ? t('guide.salt.machine') : t('guide.salt.hand'),
          oilStep: oilStep
        }),
        warn(t('guide.step.saltAdd.warn')) + oilTip, 3);
    }

    // ===== DIREKT =====
    if (!pref) {
      sec(t('guide.sec.prep'));
      st(t('guide.step.weighIngredients.title'), t('guide.chip.5min'),
        t('guide.step.weighIngredients.body', {
          flour: g(R.flour), water: g(R.water), salt: g(R.salt), yeast: g(R.yeast), yWord: R.yWord,
          sugarPart: hasSugar ? t('guide.weighIngredients.sugarPart', { sugar: g(R.sugar) }) : '',
          oilPart: hasOil ? t('guide.weighIngredients.oilPart', { oil: g(R.oil) }) : ''
        }),
        tip(t('guide.step.weighIngredients.tip')), 5);
      st(t('guide.step.waterTemp.title'), gt(R.wT),
        t('guide.step.waterTempDirect.body', { water: g(R.water), wT: gt(R.wT), ddt: gt(state.ddt) }),
        '', 5);
      if (state.yeast < 1.2) {
        // Autolyse: Hefe kommt erst DANACH in den Teig — kein Widerspruch in der Reihenfolge
        const tinyYeast = R.yeast < 1;   // < 1 g lässt sich trocken kaum gleichmäßig verteilen
        const reserveWaterTip = (state.yeastType !== 'dry' || tinyYeast)
          ? tip(t('guide.reserveWaterTip'))
          : '';
        st(inlineGlossaryLink(t('guide.step.autolyse.title'), 'autolyse'), t('guide.step.autolyse.chip'),
          t('guide.step.autolyse.body'),
          warn(t('guide.step.autolyse.warn')) + reserveWaterTip + timerBox('autolyse', 30), 30,
          { glossaryId: _usedGlossaryIds.has('autolyse') ? undefined : 'autolyse' });
        st(t('guide.step.addYeast.title'), t('guide.chip.2min'),
          tinyYeast
            ? t('guide.yeast.tinyBody', { yeast: g(R.yeast), yeastTypeName: state.yeastType === 'dry' ? t('guide.yeastType.dry') : t('guide.yeastType.fresh') })
            : (state.yeastType === 'dry' ? t('guide.yeast.dryBody') : t('guide.yeast.freshBody')),
          tinyYeast ? tip(t('guide.yeast.tinyTip')) : '', 2);
      } else {
        st(t('guide.step.dissolveYeast.title'), t('guide.chip.2min'),
          state.yeastType === 'dry' ? t('guide.yeast.dryDirect') : t('guide.yeast.freshDirect'), '', 2);
      }
      sec(t('guide.sec.knead'));
      st(t('guide.step.mixSalt.title') + (hasSugar ? t('guide.suffix.sugar') : '') + t('guide.suffix.salt') + (hasOil ? t('guide.suffix.oil') : ''), t('guide.step.saltAdd.chip'),
        (state.knead === '6'
          ? t('guide.mixSalt.machine', { sugarPhrase: sugarPhrase, salt: g(R.salt) })
          : t('guide.mixSalt.hand', { sugarPhrase: sugarPhrase, salt: g(R.salt) })) + oilStep,
        warn(t('guide.step.mixSalt.warn')) + sugarTip + oilTip, 5);
    }

    // ===== GEMEINSAME SCHRITTE (Kneten → Backen) =====
    if (hi) {
      let stretchFoldTitle = inlineGlossaryLink(t('guide.step.stretchFold.title'), 'stretchFold');
      let stretchFoldBody = t('guide.step.stretchFold.body', { hyd: state.hyd });
      if (!_usedGlossaryIds.has('stretchFold')) stretchFoldBody = inlineGlossaryLink(stretchFoldBody, 'stretchFold');
      st(stretchFoldTitle, t('guide.step.stretchFold.chip'),
        stretchFoldBody,
        tip(t('guide.step.stretchFold.tip')) + timerBox('stretch-fold', 120), 120,
        { glossaryId: _usedGlossaryIds.has('stretchFold') ? undefined : 'stretchFold' });
    } else {
      let kneadTitle = inlineGlossaryLink(t('guide.step.knead.title'), 'windowpane');
      let kneadBody = `${state.knead === '6' ? t('guide.knead.machineBody') : t('guide.knead.handBody')}${t('guide.step.knead.bodySuffix')}`;
      if (!_usedGlossaryIds.has('windowpane')) kneadBody = inlineGlossaryLink(kneadBody, 'windowpane');
      st(kneadTitle, state.knead === '6' ? t('guide.step.knead.chipMachine') : t('guide.step.knead.chipHand'),
        kneadBody, '', state.knead === '6' ? 10 : 13,
        { glossaryId: _usedGlossaryIds.has('windowpane') ? undefined : 'windowpane' });
    }
    st(t('guide.step.checkTemp.title'), t('guide.step.checkTemp.chip'),
      t('guide.step.checkTemp.body', { ddt: gt(state.ddt) }), '', 2);

    const ballsCold = f.cold && state.coldStage !== 'bulk';
    // Kaltgare-Glossarverweis (v3.68.0): nur an der Stelle, die für DIESES Rezept
    // tatsächlich die kalte Phase ist -- bei coldStage "im Stück" (klassisch) ist das die
    // Stockgare (bulkRise), bei "als Teiglinge" (praktisch, Standard) die Stückgare
    // (finalProof). Bei nicht-kalter Führung (f.cold===false) bekommt keiner der beiden
    // Schritte den Verweis.
    const bulkColdGlossary = f.cold && !ballsCold ? 'kalteGare' : undefined;
    const finalProofColdGlossary = ballsCold ? 'kalteGare' : undefined;
    sec(t('guide.sec.rise'));
    let bulkRiseTitle = inlineGlossaryLink(t('guide.step.bulkRise.title'), bulkColdGlossary);
    let bulkRiseBody = t('guide.step.bulkRise.body', { bulk: f.bulk });
    if (bulkColdGlossary && !_usedGlossaryIds.has(bulkColdGlossary)) bulkRiseBody = inlineGlossaryLink(bulkRiseBody, bulkColdGlossary);
    st(bulkRiseTitle, f.cold && !ballsCold ? t('guide.step.bulkRise.chipColdBalls') : t('guide.step.bulkRise.chipDefault'),
      bulkRiseBody, timerBox('stockgare', f.bulkMin), f.bulkMin,
      { glossaryId: (bulkColdGlossary && !_usedGlossaryIds.has(bulkColdGlossary)) ? bulkColdGlossary : undefined });
    // Einfrier-Hinweis (bis v4.7.0 hier als optionaler .tip-Textblock, Feature-Flag
    // "freezeHint"): seit v4.8.0 (Backlog Punkt D) ersatzlos entfernt -- Inhalt lebt jetzt
    // als eigenständiger Glossar-Artikel "Einfrieren" weiter (js/glossary.js), von hier aus
    // per Glossar-Verweis verlinkt, analog zum "Mehr zu Kalte Gare im Glossar"-Muster
    // weiter unten am Stückgare-Schritt.
    let formBallsTitle = inlineGlossaryLink(t('guide.step.formBalls.title'), 'einfrieren');
    let formBallsBody = t('guide.step.formBalls.body', { N: R.N, W: g(R.W), boxTxt: ballsCold ? t('guide.box.cold') : t('guide.box.normal') });
    if (!_usedGlossaryIds.has('einfrieren')) formBallsBody = inlineGlossaryLink(formBallsBody, 'einfrieren');
    st(formBallsTitle, `${R.N} × ${g(R.W)}`,
      formBallsBody,
      tip(t('guide.step.formBalls.tip')), 10,
      { glossaryId: _usedGlossaryIds.has('einfrieren') ? undefined : 'einfrieren' });
    let finalProofTitle = inlineGlossaryLink(t('guide.step.finalProof.title'), finalProofColdGlossary);
    let finalProofBody = t('guide.step.finalProof.body', { proof: f.proof });
    if (finalProofColdGlossary && !_usedGlossaryIds.has(finalProofColdGlossary)) finalProofBody = inlineGlossaryLink(finalProofBody, finalProofColdGlossary);
    st(finalProofTitle, ballsCold ? t('guide.step.finalProof.chipCold') : t('guide.step.finalProof.chipDefault'),
      finalProofBody,
      (f.cold ? tip(t('guide.step.finalProof.tip')) : '') + timerBox('stueckgare', f.proofMin), f.proofMin,
      { glossaryId: (finalProofColdGlossary && !_usedGlossaryIds.has(finalProofColdGlossary)) ? finalProofColdGlossary : undefined });

    sec(t('guide.sec.bake'));
    let preheatTitle = inlineGlossaryLink(t('guide.step.preheat.title'), 'ofenHeizarten');
    let preheatBody = t('guide.step.preheat.body');
    if (!_usedGlossaryIds.has('ofenHeizarten')) preheatBody = inlineGlossaryLink(preheatBody, 'ofenHeizarten');
    st(preheatTitle, t('guide.step.preheat.chip'),
      preheatBody,
      tip(t('guide.step.preheat.tip')) + timerBox('ofen-vorheizen', 40), 0,
      { back: 50, glossaryId: _usedGlossaryIds.has('ofenHeizarten') ? undefined : 'ofenHeizarten' });
    st(t('guide.step.shape.title'), t('guide.step.shape.chip'),
      t('guide.step.shape.body'),
      warn(t('guide.step.shape.warn')), 5);
    const bakeTxt = state.ballw <= 260 ? t('guide.bake.small') : t('guide.bake.large');
    const bakeDur = Math.max(10, R.N * (state.ballw <= 260 ? 5 : 7));
    let bakeToppingTitle = inlineGlossaryLink(t('guide.step.bakeTopping.title'), 'ofenHeizarten');
    let bakeToppingBody = t('guide.step.bakeTopping.body', { bakeTxt: bakeTxt });
    if (!_usedGlossaryIds.has('ofenHeizarten')) bakeToppingBody = inlineGlossaryLink(bakeToppingBody, 'ofenHeizarten');
    st(bakeToppingTitle, '',
      bakeToppingBody,
      tip(t('guide.step.bakeTopping.tip')), bakeDur,
      { glossaryId: _usedGlossaryIds.has('ofenHeizarten') ? undefined : 'ofenHeizarten' });

    // Foto der fertigen Pizza (v3.69.0): eigener, abschließender Schritt nach dem letzten
    // Backschritt, keine sichtbare Bildunterschrift zusätzlich zum Alt-Text (Accessibility).
    const photo = finalPhoto();
    st(t('guide.step.finalPhoto.title'), '', t('guide.step.finalPhoto.body'),
      `<img src="${photo.src}" alt="${t(photo.altKey)}" class="final-photo" loading="lazy" width="1920" height="1079">`, 0);

    // ===== Zeiten berechnen =====
    const steps = _items.filter(i => !i.sec);
    let totalMin = 0, cum = 0;
    steps.forEach(s => { s._min = cum; cum += s.dur; });
    totalMin = cum;
    R.totalMin = totalMin;      // Gesamtdauer (für Zeitplan-Banner & Tests)
    R.matureMin = matureMin;    // Vorteig-Reifezeit (0 bei Direkt)
    let base = null, valid = false;
    if (state.timeISO) {
      const tISO = new Date(state.timeISO);
      if (!isNaN(tISO.getTime())) {
        valid = true;
        base = state.timeMode === 'target' ? new Date(tISO.getTime() - totalMin * 60000) : tISO;
      }
    }

    // ===== Render =====
    let html = '';
    if (valid) {
      const endT = new Date(base.getTime() + totalMin * 60000);
      html += `<div class="schedbar">${t('guide.schedbar.withTime', { dur: fmtDur(totalMin), startClock: fmtClock(base), endClock: fmtClock(endT) })}</div>`;
      $('guideSummary').innerHTML = t('guide.summary.withTime', { label: f.label, N: R.N, W: g(R.W), hyd: state.hyd });
    } else {
      // {zeitplan}-Platzhalter: klickbarer Sprung zum Menüpunkt "Zeitplan" (v3.38.0-Fix,
      // s. Kommentar bei guide.schedbar.noTime in js/i18n.js). Label kommt bewusst aus
      // demselben nav.zeitplan-Key wie der Menüpunkt selbst (keine doppelte Übersetzung).
      const zeitplanLink = `<button type="button" class="schedbar-goto-zeitplan" data-goto="zeitplan">${t('nav.zeitplan')}</button>`;
      // Gradient-Endfarben dunkler als ursprünglich (#8a7f76/#6f655c): der hellere
      // Farbton lag mit weißem Text bei nur ~3,91:1 (WCAG 1.4.3 verlangt 4,5:1 für
      // Fließtext) -- Fund aus dem v3.38.0-Accessibility-Audit, behoben im gebündelten
      // Accessibility-Zyklus v3.42.0. Neue Werte rechnerisch geprüft: hellstes Ende
      // (#645c55) liegt bei ~6,55:1, deutliche Sicherheitsmarge statt nur knapp über
      // der Schwelle. .schedbar bekommt zusätzlich per CSS einen text-shadow als
      // zweite Absicherung (s. css/styles.css).
      html += `<div class="schedbar" style="background:linear-gradient(135deg,#645c55,#4a443e)">${t('guide.schedbar.noTime', { dur: fmtDur(totalMin), zeitplan: zeitplanLink })}</div>`;
      $('guideSummary').innerHTML = t('guide.summary.noTime', { label: f.label, dur: fmtDur(totalMin) });
    }
    let n = 1;
    _items.forEach(i => {
      if (i.sec) { html += `<div class="daybadge">${i.sec}</div>`; return; }
      let timeChip = '';
      if (valid) {
        const d = new Date(base.getTime() + (i._min - (i.back || 0)) * 60000);
        timeChip = `<span class="timechip">${fmtClock(d)}</span>`;
      }
      html += `<div class="step"><div class="num">${n++}</div><div class="body">
        <h4>${i.title}${i.chip ? `<span class="chip">${i.chip}</span>` : ''}${timeChip}</h4>
        <p>${i.body}</p>${i.extra}${glossaryLinkHtml(i.glossaryId)}</div></div>`;
    });
    $('guideSteps').innerHTML = html;
    if (PZ.wireTimers) PZ.wireTimers();
  }

  PZ.buildGuide = buildGuide;
  // Sprachwechsel: kein eigener Hook nötig — js/calc.js registriert bereits einen
  // Hook, der calc() neu aufruft, und calc() ruft am Ende immer buildGuide() auf
  // (s. PZ.R = {...}; PZ.buildGuide(); ganz unten in calc.js). Ein zweiter, separater
  // Hook hier würde buildGuide() bei jedem Sprachwechsel unnötig doppelt ausführen.

  // Klickbarer "Zeitplan"-Sprung im Banner ohne Zeitangabe (v3.38.0-Fix): #guideSteps
  // wird bei JEDEM buildGuide()-Aufruf komplett per innerHTML neu aufgebaut (s. o.) —
  // ein direkt am Button hängender Listener würde also bei jeder Eingabe verloren
  // gehen. Stattdessen EIN einziger, dauerhaft delegierter Listener auf dem stabilen
  // #guideSteps-Container selbst, der auf Klicks auf .schedbar-goto-zeitplan reagiert
  // (Event-Bubbling), egal wie oft der Inhalt neu gerendert wird. PZ.gotoView() wird
  // vom gemeinsamen Nav-Modul bereitgestellt (js/nav.js, seit v3.54.0 — vorher zwei
  // identische Burgermenü-Inline-Scripts auf Desktop + Mobil) — falls aus irgendeinem
  // Grund nicht vorhanden (z. B. isolierte Testumgebung ohne Menü-Markup/js/nav.js),
  // passiert einfach nichts (kein Crash).
  // Einklappbare Hinweisboxen (v4.10.0, Backlog Punkt H): kleine Helfer für den
  // Auf-/Zuklapp-Zustand eines einzelnen .hint-toggle-Buttons + seines per
  // aria-controls verknüpften .hint-body-Containers.
  function hintBodyOf(btn) {
    const id = btn.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }
  function openHintToggle(btn) {
    btn.setAttribute('aria-expanded', 'true');
    const body = hintBodyOf(btn);
    if (body) body.classList.add('is-open');
  }
  function closeHintToggle(btn) {
    btn.setAttribute('aria-expanded', 'false');
    const body = hintBodyOf(btn);
    if (body) body.classList.remove('is-open');
  }

  const guideStepsEl = $('guideSteps');
  if (guideStepsEl) {
    guideStepsEl.addEventListener('click', function (e) {
      const zeitplanBtn = e.target.closest('.schedbar-goto-zeitplan');
      if (zeitplanBtn) { if (PZ.gotoView) PZ.gotoView('zeitplan'); return; }
      // Einklappbare Hinweisboxen (v4.10.0, Backlog Punkt H): App-weites Single-Open-
      // Akkordeon -- vor dem (ggf.) Öffnen DIESES Toggles werden alle anderen gerade
      // offenen Hinweisboxen im gesamten #guideSteps-Container geschlossen (nicht nur
      // innerhalb desselben Schritts), danach der geklickte Button umgeschaltet.
      const hintBtn = e.target.closest('.hint-toggle');
      if (hintBtn) {
        const wasOpen = hintBtn.getAttribute('aria-expanded') === 'true';
        Array.prototype.forEach.call(
          guideStepsEl.querySelectorAll('.hint-toggle[aria-expanded="true"]'),
          function (b) { if (b !== hintBtn) closeHintToggle(b); }
        );
        if (wasOpen) closeHintToggle(hintBtn); else openHintToggle(hintBtn);
        return;
      }
      // Glossar-Verweise (v3.68.0): identisches Delegations-Muster wie der
      // Zeitplan-Sprung direkt darüber -- ein einziger Listener auf dem stabilen
      // #guideSteps-Container statt Einzel-Listenern, die bei jedem buildGuide()-Neuaufbau
      // verloren gingen. PZ.gotoGlossaryEntry() wird von js/glossary.js bereitgestellt --
      // falls aus irgendeinem Grund nicht vorhanden (z. B. isolierte Testumgebung),
      // passiert einfach nichts (kein Crash).
      // Seit v4.9.0 (Backlog Punkt A, Inline-Verlinkung): generisches `[data-glossary-id]`-
      // Attribut-Selektor statt der festen `.step-glossary-link`-Klasse -- deckt sowohl den
      // separaten Zeilenlink (`.step-glossary-link`, Fallback) als auch den neuen Inline-
      // Link im Fließtext (`.inline-glossary-link`, s. inlineGlossaryLink() oben) mit einem
      // einzigen Listener ab, statt die Selektorliste bei jeder neuen Link-Variante zu
      // erweitern.
      const glossaryBtn = e.target.closest('[data-glossary-id]');
      if (glossaryBtn && PZ.gotoGlossaryEntry) {
        PZ.gotoGlossaryEntry(glossaryBtn.getAttribute('data-glossary-id'));
      }
    });
  }
})(window);
