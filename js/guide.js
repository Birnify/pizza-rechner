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

  // Live-Region-Ansage bei Anleitungs-Änderung (v4.31.0, Nebenbefund aus dem
  // v4.27.0-accessibility-expert-Review, WCAG 4.1.3 Status Messages): #guideSteps wird
  // bei jeder Reglerbewegung komplett per innerHTML neu gerendert (s. buildGuide() unten),
  // ohne dass Screenreader-Nutzer davon etwas mitbekommen. Bewusst KEIN aria-live direkt
  // auf #guideSteps (bei über 20 Absätzen zu viel Vorleselärm) und bewusst KEINE
  // Wiederverwendung von #flourWarn (trägt sichtbaren Warntext, der nicht durch eine
  // andere Meldung überschrieben werden darf) — stattdessen eine EIGENE, visuell
  // versteckte Live-Region (#guideAnnounce, pizza-rechner.html/-mobile.html) mit einer
  // kurzen, entprellten Sammelansage ("Anleitung aktualisiert"). Entprellt auf 1,5 s Ruhe
  // nach der letzten Änderung, damit z. B. Slider-Ziehen über mehrere Stufen genau EINE
  // Ansage ergibt statt einer Kaskade. `announceReady` bleibt false, bis js/main.js nach
  // dem allerersten Boot-Aufruf von PZ.calc() PZ.enableGuideAnnounce() aufruft — vorher
  // (Laden aus localStorage, applyMethod(), Erstrender) löst buildGuide() bewusst KEINE
  // Ansage aus, sonst gäbe es Lärm direkt beim ersten Laden der Seite.
  let announceReady = false;
  let announceTimer = null;
  PZ.enableGuideAnnounce = function () { announceReady = true; };

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
  // EIN Aufklapper pro Schritt statt Einzel-Toggles je Hinweis (v4.35.0, "Anleitungs-
  // Schrittbilder + Ein-Aufklapper-Redesign", ersetzt das v4.10.0-Muster unten in der
  // Historie): tip()/warn() liefern jetzt nur noch reine Text-Bausteine
  // (`<div class="note note--tip/warn">…</div>`, KEIN eigener Toggle-Button mehr). Der
  // Render-Loop weiter unten sammelt pro Schritt alle Bausteine (tip/warn-Notes + optionale
  // Timer-Box + optionaler Glossar-Verweis) in EINEM `.step__extras`-Container, davor EIN
  // gemeinsamer `.step__more`-Aufklapper-Button (Icons statt Emoji, s. svgIcon() unten).
  // App-weites Single-Open-Verhalten (nur ein Schritt gleichzeitig aufgeklappt) bleibt
  // erhalten, jetzt auf Schritt-Ebene statt auf Einzel-Hinweis-Ebene -- s. der delegierte
  // Klick-Listener auf #guideSteps weiter unten.
  function tip(txt) { return `<div class="note note--tip">${txt}</div>`; }
  function warn(txt) { return `<div class="note note--warn">${txt}</div>`; }

  // Icon-Satz fürs Design-System (design-import/components/core/Icon.jsx) -- 24x24
  // viewBox, handgezeichnet, KEIN Emoji im Aufklapper (ausdrücklicher Design-System-Satz
  // "Emoji is not iconography here"). `warn` (Dreieck mit Ausrufezeichen) existierte im
  // Satz noch nicht und wurde für diesen Zyklus nach dem Bauprinzip von `info` ergänzt --
  // auch in design-import/components/core/Icon.jsx nachgezogen, damit Referenz und App
  // nicht auseinanderlaufen. Kleine Größe (14px) + etwas kräftigerer Strich (1.8 statt
  // 1.6-1.7) ist das bereits etablierte Muster für kleine Inline-Icons (s.
  // js/glossary.js-Kategorie-Icons).
  const ICON_PATHS = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
    warn: '<path d="M12 4.8 21 19.8H3z"/><path d="M12 10v4M12 17v.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    glossar: '<path d="M12 6.5c-1.6-1.3-3.6-2-6.5-2v12c2.9 0 4.9.7 6.5 2 1.6-1.3 3.6-2 6.5-2v-12c-2.9 0-4.9.7-6.5 2Z"/><path d="M12 6.5v12"/>',
    chevron: '<path d="M6 9.5 12 15.5 18 9.5"/>'
  };
  function svgIcon(name, size) {
    size = size || 14;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
  }
  // Gesprochener Name des Aufklappers (aria-label, DE/EN mit korrektem Singular/Plural) --
  // der Button selbst enthält nur Icons + eine Ziffer + einen Pfeil, ohne aria-label würde
  // ein Screenreader dort nur Icon-Beschriftungen (falls vorhanden) und eine nackte Zahl
  // ansagen.
  function buildMoreLabel(warnCount, tipCount, hasTimer, hasGlossary) {
    const parts = [];
    if (warnCount) parts.push(t(warnCount === 1 ? 'guide.more.warnOne' : 'guide.more.warnMany', { n: warnCount }));
    if (tipCount) parts.push(t(tipCount === 1 ? 'guide.more.tipOne' : 'guide.more.tipMany', { n: tipCount }));
    if (hasTimer) parts.push(t('guide.more.timer'));
    if (hasGlossary) parts.push(t('guide.more.glossary'));
    return t('guide.more.label', { parts: parts.join(', ') });
  }
  // `_extrasSeq` (Reset je buildGuide()-Durchlauf, analog `_usedGlossaryIds`) vergibt
  // eindeutige IDs für die aria-controls-Verknüpfung Aufklapper-Button -> Extras-Container.
  let _extrasSeq = 0;
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
  // Seit v4.32.0 ("Bild-Grundgerüst"): der Dateiname selbst steht NICHT mehr hier, sondern
  // ausschließlich im Bild-Register js/images.js (PZ.IMG) -- genau die vorher hier fest
  // verdrahteten Pfade (assets/pizza-final-*.jpg) zeigten nach einer Ordner-Umbenennung ins
  // Leere und lösten den Bugfix aus, der diesen Zyklus angestoßen hat.
  function finalPhotoKey() {
    const presetEl = $('preset');
    const key = presetEl ? presetEl.value : '';
    if (key === 'teglia') return 'guide.final.teglia';
    if (key === 'newyork_style') return 'guide.final.newyork';
    return 'guide.final.napoli';
  }

  // Teglia-spezifische Anleitungstexte (v4.29.0, "Formen"-Tipp/"Ausziehen"-Schritt/
  // Backzeit): identisches Zuordnungsmuster wie finalPhotoKey() oben -- reiner
  // #preset-DOM-Wert, kein state.preset (Begründung s. Kommentar dort). Bewusst NICHT
  // über state.balls===1 o.ä. ausgelöst: ein manuell auf 1 Teigling reduziertes
  // NICHT-Teglia-Rezept soll weiterhin die generischen runden Formulierungen/Formel
  // bekommen -- nur das Preset "teglia" selbst schaltet auf die Blech-Variante um.
  function isTegliaPreset() {
    const presetEl = $('preset');
    return !!presetEl && presetEl.value === 'teglia';
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
    _extrasSeq = 0;                            // Aufklapper-Extras-ID-Reset je buildGuide()-Durchlauf

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
        clampNote + tip(t(isBiga ? 'guide.step.prefWeigh.tipBiga' : 'guide.step.prefWeigh.tip')), 5);
      if (isBiga) {
        st(t('guide.step.bigaMix.title'), '',
          t('guide.step.bigaMix.body'),
          warn(t('guide.step.bigaMix.warn')), 10, { imgKey: 'bigaMix' });
        // Seit v4.25.0: nur noch zwei Stufen (b_klassisch 17 h / b_kalt 48 h, s.
        // PZ.PREF_STAGES in js/ui.js) statt vorher drei -- Schwelle 30 h liegt mittig
        // zwischen beiden und ist unkritisch, solange nur diese zwei Werte gewählt werden.
        const bigaTempTxt = state.prefMature <= 30
          ? t('guide.biga.temp.cool')
          : t('guide.biga.temp.cold');
        st(inlineGlossaryLink(t('guide.step.bigaRest.title'), 'biga'), `${state.prefMature} ${t('guide.dur.h')}`,
          t('guide.step.bigaRest.body', { bigaTempTxt: bigaTempTxt }),
          tip(t('guide.step.bigaRest.tip')) + timerBox('biga-reifen', matureMin), matureMin,
          { glossaryId: _usedGlossaryIds.has('biga') ? undefined : 'biga', imgKey: 'bigaRest' });
      } else {
        st(t('guide.step.poolishMix.title'), '',
          t('guide.step.poolishMix.body'), '', 10, { imgKey: 'poolishMix' });
        const poolishTempTxt = state.prefMature <= 14
          ? t('guide.poolish.temp.warm')
          : t('guide.poolish.temp.cold');
        st(inlineGlossaryLink(t('guide.step.poolishRest.title'), 'poolish'), `${state.prefMature} ${t('guide.dur.h')}`,
          t('guide.step.poolishRest.body', { poolishTempTxt: poolishTempTxt }),
          tip(t('guide.step.poolishRest.tip')) + timerBox('poolish-reifen', matureMin), matureMin,
          { glossaryId: _usedGlossaryIds.has('poolish') ? undefined : 'poolish', imgKey: 'poolishRest' });
      }
      sec(t('guide.sec.main'));
      const hasMW = R.mWater >= 1, hasMF = R.mFlour >= 1;
      if (hasMW) {
        st(t('guide.step.waterTemp.title'), '',
          t('guide.step.waterTemp.body', { mWater: g(R.mWater), wT: gt(R.wT) }),
          '', 5, { imgKey: 'waterTemp' });
      }
      const addParts = [];
      if (hasMW) addParts.push(t('guide.pref.addWater', { mWater: g(R.mWater) }));
      if (hasMF) {
        const yeastPart = R.mYeast >= 0.05 ? t('guide.pref.addFlour.yeastPart', { mYeast: g(R.mYeast), yWord: R.yWord }) : '';
        const sugarPart = hasSugar ? t('guide.pref.addFlour.sugarPart', { sugar: g(R.sugar) }) : '';
        // Bugfix v4.24.0: eigener Bindesatz (guide.pref.addFlourOnly), wenn kein Restwasser
        // mehr übrig ist (hasMW false) -- s. Kommentar bei den i18n-Keys in js/i18n-dict.js.
        addParts.push(t(hasMW ? 'guide.pref.addFlour' : 'guide.pref.addFlourOnly', { mFlour: g(R.mFlour), yeastPart: yeastPart, sugarPart: sugarPart }));
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
        tip(t('guide.step.weighIngredients.tip')), 5, { imgKey: 'weighIngredients' });
      st(t('guide.step.waterTemp.title'), '',
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
          { glossaryId: _usedGlossaryIds.has('autolyse') ? undefined : 'autolyse', imgKey: 'autolyse' });
        st(t('guide.step.addYeast.title'), t('guide.chip.2min'),
          tinyYeast
            ? t('guide.yeast.tinyBody', { yeast: g(R.yeast), yeastTypeName: state.yeastType === 'dry' ? t('guide.yeastType.dry') : t('guide.yeastType.fresh') })
            : (state.yeastType === 'dry' ? t('guide.yeast.dryBody') : t('guide.yeast.freshBody')),
          tinyYeast ? tip(t('guide.yeast.tinyTip')) : '', 2, { imgKey: 'addYeast' });
      } else {
        st(t('guide.step.dissolveYeast.title'), t('guide.chip.2min'),
          state.yeastType === 'dry' ? t('guide.yeast.dryDirect') : t('guide.yeast.freshDirect'), '', 2, { imgKey: 'dissolveYeast' });
      }
      sec(t('guide.sec.knead'));
      st(t('guide.step.mixSalt.title') + (hasSugar ? t('guide.suffix.sugar') : '') + t('guide.suffix.salt') + (hasOil ? t('guide.suffix.oil') : ''), t('guide.step.saltAdd.chip'),
        (state.knead === '6'
          ? t('guide.mixSalt.machine', { sugarPhrase: sugarPhrase, salt: g(R.salt) })
          : t('guide.mixSalt.hand', { sugarPhrase: sugarPhrase, salt: g(R.salt) })) + oilStep,
        warn(t('guide.step.mixSalt.warn')) + sugarTip + oilTip, 5, { imgKey: 'mixSalt' });
    }

    // ===== GEMEINSAME SCHRITTE (Kneten → Backen) =====
    if (hi) {
      let stretchFoldTitle = inlineGlossaryLink(t('guide.step.stretchFold.title'), 'stretchFold');
      let stretchFoldBody = t('guide.step.stretchFold.body', { hyd: state.hyd });
      if (!_usedGlossaryIds.has('stretchFold')) stretchFoldBody = inlineGlossaryLink(stretchFoldBody, 'stretchFold');
      st(stretchFoldTitle, t('guide.step.stretchFold.chip'),
        stretchFoldBody,
        tip(t('guide.step.stretchFold.tip')) + timerBox('stretch-fold', 120), 120,
        { glossaryId: _usedGlossaryIds.has('stretchFold') ? undefined : 'stretchFold', imgKey: 'stretchFold' });
    } else {
      let kneadTitle = inlineGlossaryLink(t('guide.step.knead.title'), 'windowpane');
      let kneadBody = `${state.knead === '6' ? t('guide.knead.machineBody') : t('guide.knead.handBody')}${t('guide.step.knead.bodySuffix')}`;
      if (!_usedGlossaryIds.has('windowpane')) kneadBody = inlineGlossaryLink(kneadBody, 'windowpane');
      st(kneadTitle, state.knead === '6' ? t('guide.step.knead.chipMachine') : t('guide.step.knead.chipHand'),
        kneadBody, '', state.knead === '6' ? 10 : 13,
        { glossaryId: _usedGlossaryIds.has('windowpane') ? undefined : 'windowpane', imgKey: 'knead' });
    }
    // Bugfix v4.24.0: bei Vorteig-Rezepten OHNE Hauptteig-Restwasser (R.hasMixingWater
    // false, z. B. das 66/66-Poolish-Preset) gibt es keinen Schüttwasser-Stellhebel mehr,
    // über den sich {ddt} noch gezielt ansteuern ließe -- die bisherige Formulierung
    // "24 °C angepeilt" behauptete das trotzdem. Eigener, ehrlicherer Text für diesen Fall.
    const checkTempBody = (pref && !R.hasMixingWater)
      ? t('guide.step.checkTemp.bodyNoWater')
      : t('guide.step.checkTemp.body', { ddt: gt(state.ddt) });
    st(t('guide.step.checkTemp.title'), '',
      checkTempBody, '', 2, { imgKey: 'checkTemp' });

    const ballsCold = f.cold && state.coldStage !== 'bulk';
    // Kaltgare-Glossarverweis (v3.68.0): nur an der Stelle, die für DIESES Rezept
    // tatsächlich die kalte Phase ist -- bei coldStage "im Stück" (klassisch) ist das die
    // Stockgare (bulkRise), bei "als Teiglinge" (praktisch, Standard) die Stückgare
    // (finalProof). Bei nicht-kalter Führung (f.cold===false) bekommt keiner der beiden
    // Schritte den Verweis.
    const bulkColdGlossary = f.cold && !ballsCold ? 'kalteGare' : undefined;
    const finalProofColdGlossary = ballsCold ? 'kalteGare' : undefined;
    // Temperaturskalierung (v4.27.0, js/schedule.js): bei abweichender Raumtemperatur
    // (state.room != 21 °C) skaliert schedule() bulkMin/proofMin, ABER f.bulk/f.proof
    // bleiben statische, an der ursprünglichen Zeitspanne hängende Textbausteine -- ohne
    // diesen Schritt würde die Anzeige eine andere Zahl behaupten als der Timer/die
    // Zeitplan-Rückwärtsrechnung tatsächlich verwendet (genau der Etiketten-Fehler, der
    // in den letzten Zyklen bei den Presets behoben wurde). f.bulkScaled/f.proofScaled
    // sind nur dann true, wenn sich die jeweilige Minutenzahl durch die Skalierung
    // TATSÄCHLICH geändert hat (bei room===21 ist der Faktor exakt 1 -> unverändert,
    // identischer Text wie vor v4.27.0).
    const bulkText = f.bulkScaled ? t('guide.tempScaled.bulk', { h: fmtDur(f.bulkMin) }) : f.bulk;
    const proofText = f.proofScaled ? t('guide.tempScaled.proof', { h: fmtDur(f.proofMin) }) : f.proof;
    // Eigene tip()-Aufrufe je Schritt (nicht einen HTML-String wiederverwenden!): seit
    // v4.35.0 sind tip()/warn() reine, id-lose Text-Bausteine (die aria-controls-ID sitzt
    // jetzt am gemeinsamen Aufklapper, s. _extrasSeq weiter oben) -- ein wiederverwendeter
    // String wäre inhaltlich trotzdem falsch, weil er bei cold:false-Zweigen (bulkScaled UND
    // proofScaled oft gleichzeitig true, beide Phasen reine Raumtemp) in zwei verschiedenen
    // Schritten denselben DOM-Knoten doppelt einfügen würde.
    function tempScaledTip() { return tip(t('guide.tempScaled.tip', { room: state.room })); }
    sec(t('guide.sec.rise'));
    let bulkRiseTitle = inlineGlossaryLink(t('guide.step.bulkRise.title'), bulkColdGlossary);
    let bulkRiseBody = t('guide.step.bulkRise.body', { bulk: bulkText });
    if (bulkColdGlossary && !_usedGlossaryIds.has(bulkColdGlossary)) bulkRiseBody = inlineGlossaryLink(bulkRiseBody, bulkColdGlossary);
    st(bulkRiseTitle, '',
      bulkRiseBody, (f.bulkScaled ? tempScaledTip() : '') + timerBox('stockgare', f.bulkMin), f.bulkMin,
      { glossaryId: (bulkColdGlossary && !_usedGlossaryIds.has(bulkColdGlossary)) ? bulkColdGlossary : undefined, imgKey: 'bulkRise' });
    // Einfrier-Hinweis (bis v4.7.0 hier als optionaler .tip-Textblock, Feature-Flag
    // "freezeHint"): seit v4.8.0 (Backlog Punkt D) ersatzlos entfernt -- Inhalt lebt jetzt
    // als eigenständiger Glossar-Artikel "Einfrieren" weiter (js/glossary.js), von hier aus
    // per Glossar-Verweis verlinkt, analog zum "Mehr zu Kalte Gare im Glossar"-Muster
    // weiter unten am Stückgare-Schritt.
    let formBallsTitle = inlineGlossaryLink(t('guide.step.formBalls.title'), 'einfrieren');
    let formBallsBody = t('guide.step.formBalls.body', { N: R.N, W: g(R.W), boxTxt: ballsCold ? t('guide.box.cold') : t('guide.box.normal') });
    if (!_usedGlossaryIds.has('einfrieren')) formBallsBody = inlineGlossaryLink(formBallsBody, 'einfrieren');
    st(formBallsTitle, '',
      formBallsBody,
      tip(isTegliaPreset() ? t('guide.step.formBalls.tipTeglia') : t('guide.step.formBalls.tip')), 10,
      { glossaryId: _usedGlossaryIds.has('einfrieren') ? undefined : 'einfrieren', imgKey: 'formBalls' });
    let finalProofTitle = inlineGlossaryLink(t('guide.step.finalProof.title'), finalProofColdGlossary);
    let finalProofBody = t('guide.step.finalProof.body', { proof: proofText });
    if (finalProofColdGlossary && !_usedGlossaryIds.has(finalProofColdGlossary)) finalProofBody = inlineGlossaryLink(finalProofBody, finalProofColdGlossary);
    st(finalProofTitle, '',
      finalProofBody,
      (f.proofScaled ? tempScaledTip() : '') + (f.cold ? tip(t('guide.step.finalProof.tip')) : '') + timerBox('stueckgare', f.proofMin), f.proofMin,
      { glossaryId: (finalProofColdGlossary && !_usedGlossaryIds.has(finalProofColdGlossary)) ? finalProofColdGlossary : undefined, imgKey: 'finalProof' });

    sec(t('guide.sec.bake'));
    let preheatTitle = inlineGlossaryLink(t('guide.step.preheat.title'), 'ofenHeizarten');
    let preheatBody = t('guide.step.preheat.body');
    if (!_usedGlossaryIds.has('ofenHeizarten')) preheatBody = inlineGlossaryLink(preheatBody, 'ofenHeizarten');
    st(preheatTitle, t('guide.step.preheat.chip'),
      preheatBody,
      tip(t('guide.step.preheat.tip')) + timerBox('ofen-vorheizen', 40), 0,
      { back: 50, glossaryId: _usedGlossaryIds.has('ofenHeizarten') ? undefined : 'ofenHeizarten', imgKey: 'preheat' });
    const teglia = isTegliaPreset();
    st(t(teglia ? 'guide.step.shapeTeglia.title' : 'guide.step.shape.title'), '',
      t(teglia ? 'guide.step.shapeTeglia.body' : 'guide.step.shape.body'),
      warn(t(teglia ? 'guide.step.shapeTeglia.warn' : 'guide.step.shape.warn')), 5,
      teglia ? {} : { imgKey: 'shape' });
    // Teglia-Backzeit (v4.29.0): eigener, preset-gebundener Override statt der
    // generischen N x 5/7-Formel (s. Kommentar bei guide.bake.teglia in
    // js/i18n-dict.js) -- ein ganzes Blech wird EINMAL gebacken, nicht N Einzelpizzen
    // nacheinander, die generische Formel würde mit balls:1 nur 10 min ergeben.
    const bakeTxt = teglia ? t('guide.bake.teglia') : (state.ballw <= 260 ? t('guide.bake.small') : t('guide.bake.large'));
    const bakeDur = teglia ? 15 : Math.max(10, R.N * (state.ballw <= 260 ? 5 : 7));
    let bakeToppingTitle = inlineGlossaryLink(t('guide.step.bakeTopping.title'), 'ofenHeizarten');
    let bakeToppingBody = t('guide.step.bakeTopping.body', { bakeTxt: bakeTxt });
    if (!_usedGlossaryIds.has('ofenHeizarten')) bakeToppingBody = inlineGlossaryLink(bakeToppingBody, 'ofenHeizarten');
    st(bakeToppingTitle, '',
      bakeToppingBody,
      tip(t('guide.step.bakeTopping.tip')), bakeDur,
      { glossaryId: _usedGlossaryIds.has('ofenHeizarten') ? undefined : 'ofenHeizarten', imgKey: 'bakeTopping' });

    // Foto der fertigen Pizza (v3.69.0): eigener, abschließender Schritt nach dem letzten
    // Backschritt, keine sichtbare Bildunterschrift zusätzlich zum Alt-Text (Accessibility).
    // Seit v4.32.0: Markup + Dateiname kommen aus dem Bild-Register (PZ.imgHtml(), s.
    // js/images.js) statt aus einem festen Pfad hier -- fehlt PZ.imgHtml() ausnahmsweise
    // (sollte nicht vorkommen, Ladereihenfolge stellt es sicher), erscheint der Schritt
    // ohne Foto statt mit einem kaputten <img>. Eigenes, IMMER sichtbares großes Foto --
    // fachlich etwas anderes als das neue randlose Bildband der übrigen Schritte (kein
    // opts.imgKey/step__photo-Band, keine eigene Registerbild-Kategorie „guide.step.*"),
    // deshalb über `opts.directExtra` gereicht (v4.35.0): landet IMMER sichtbar direkt im
    // Kartenkörper, unabhängig vom neuen Ein-Aufklapper-Mechanismus (der zählt nur
    // Warnungen/Tipps/Timer/Glossar, s. Render-Loop weiter unten) -- ein `extra`-Parameter
    // hier wäre fälschlich in die Zählung eingeflossen (0 Treffer für note--tip/warn, also
    // KEIN Aufklapper, das Foto wäre dadurch nie gerendert worden).
    const photoHtml = PZ.imgHtml ? PZ.imgHtml(finalPhotoKey(), { extraClass: 'final-photo' }) : '';
    st(t('guide.step.finalPhoto.title'), '', t('guide.step.finalPhoto.body'), '', 0, { directExtra: photoHtml });

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
      let timeHtml = '';
      if (i.chip || valid) {
        const chipHtml = i.chip ? `<span class="step__chip">${i.chip}</span>` : '';
        let clockHtml = '';
        if (valid) {
          const d = new Date(base.getTime() + (i._min - (i.back || 0)) * 60000);
          clockHtml = `<span class="step__clock">${fmtClock(d)}</span>`;
        }
        // REGEL (Referenz "Variante 3a"): der Zeit-Bereich ist immer das letzte Element
        // der Titelzeile, oben ausgerichtet, bricht nie um -- unabhängig von der
        // Titellänge (behebt die zuvor uneinheitliche Positionierung von .chip/.timechip
        // bei langen Titeln). Beide Chips (Dauer-Chip UND Wanduhrzeit-Chip) können
        // gleichzeitig vorkommen, s. js/guide.js-Historie -- sie sitzen jetzt gemeinsam in
        // EINEM flex-shrink:0-Wrapper statt einzeln umzubrechen.
        // v4.35.1-Bugfix ("Zeit-Chip drängt Titel zusammen"): `i.chip` trägt seit hier NUR
        // NOCH echte Zeit-/Dauerangaben (z. B. "8–12 min", "4 × alle 30 min", Vorteig-
        // Reifezeit in Stunden) -- der fixe, nie schrumpfende Chip-Platz ließ auf schmalen
        // Mobil-Viewports (375px) sonst kaum Raum für den Titel, 10 von 15 Titeln im
        // Testrezept brachen dadurch mehrzeilig um. Technik- (`bigaMix`/`poolishMix`),
        // Temperatur- (`waterTemp`/`checkTemp`), Orts- (`bulkRise`), Stückzahl-
        // (`formBalls`) und Warn-Hinweise (`shape`/`shapeTeglia`) haben seither KEINEN Chip
        // mehr -- ihr Inhalt stand in allen Fällen bereits wortgleich im Fließtext oder im
        // warn()/tip()-Aufklapper (s. js/i18n-dict.js-Kommentare bei den jeweiligen
        // `.chip`-Keys), nur `checkTemp.bodyNoWater` bekam dafür einen ergänzten
        // Zahlenwert. `saltAdd`/`mixSalt` behalten ihren Chip ("nach 2–3 min") bewusst: das
        // ist kein Schrittdauer-Etikett, sondern ein Timing-Hinweis INNERHALB des Schritts
        // (wann das Öl nach dem Salz dazukommt), fürs korrekte Ausführen wichtig genug, um
        // sichtbar zu bleiben.
        timeHtml = `<span class="step__time">${chipHtml}${clockHtml}</span>`;
      }

      // EIN Aufklapper pro Schritt (v4.35.0): Notes (tip()/warn()) + optionaler
      // Timer-Platzhalter (bereits Teil von i.extra, s. die jeweiligen st()-Aufrufe oben)
      // + optionaler Glossar-Fallback-Link werden zu EINEM .step__extras-Container
      // zusammengefasst. Zähl-/Farbentscheidung rein über die bereits gerenderten
      // HTML-Fragmente (keine zweite, parallele Datenstruktur nötig) -- robust, weil
      // tip()/warn()/timerBox() feste, hier bekannte Klassennamen erzeugen.
      const glossaryHtml = glossaryLinkHtml(i.glossaryId);
      const extrasHtml = (i.extra || '') + glossaryHtml;
      const warnCount = (extrasHtml.match(/note--warn/g) || []).length;
      const tipCount = (extrasHtml.match(/note--tip/g) || []).length;
      const hasTimer = /class="timerbox"/.test(extrasHtml);
      const hasGlossary = glossaryHtml !== '';
      const total = warnCount + tipCount + (hasTimer ? 1 : 0) + (hasGlossary ? 1 : 0);
      let moreHtml = '', extrasBlockHtml = '';
      if (total > 0) {
        const extrasId = 'step-extras-' + (_extrasSeq++);
        const label = buildMoreLabel(warnCount, tipCount, hasTimer, hasGlossary);
        const iconsHtml = (warnCount ? svgIcon('warn') : '') + (tipCount ? svgIcon('info') : '') +
          (hasTimer ? svgIcon('clock') : '') + (hasGlossary ? svgIcon('glossar') : '');
        moreHtml = `<button type="button" class="step__more${warnCount ? ' step__more--warn' : ''}" ` +
          `aria-expanded="false" aria-controls="${extrasId}" aria-label="${label}">` +
          `${iconsHtml}<span class="step__more-count">${total}</span>${svgIcon('chevron', 10)}</button>`;
        extrasBlockHtml = `<div class="step__extras" id="${extrasId}">${extrasHtml}</div>`;
      }

      // Schrittbild-Band (v4.35.0, "Anleitungs-Schrittbilder"): randlos an der linken
      // Kartenkante, s. Kommentar bei opts.imgKey in js/images.js. Fehlt der Key oder ist
      // das Bild (noch) nicht verdrahtet, liefert PZ.imgHtml() '' -- der Schritt bekommt
      // dann stattdessen die 3px-Akzentkante (.step--noimg), genau wie ein Schritt, der
      // bewusst kein imgKey gesetzt hat (saltAdd, prefWeigh, prefCombine, shapeTeglia,
      // waterTempDirect, finalPhoto).
      const photoHtml = (i.imgKey && PZ.imgHtml) ? PZ.imgHtml('guide.step.' + i.imgKey, { extraClass: 'step__photo', bare: true }) : '';
      const stepCls = 'step' + (photoHtml ? '' : ' step--noimg');

      html += `<article class="${stepCls}">${photoHtml}<div class="step__body">
        <div class="step__head"><div class="step__num">${n++}</div><h4 class="step__title">${i.title}</h4>${timeHtml}</div>
        <p class="step__text">${i.body}${moreHtml}</p>${i.directExtra || ''}${extrasBlockHtml}</div></article>`;
    });
    $('guideSteps').innerHTML = html;
    if (PZ.wireTimers) PZ.wireTimers();
    if (announceReady) {
      if (announceTimer) global.clearTimeout(announceTimer);
      announceTimer = global.setTimeout(function () {
        announceTimer = null;
        if (PZ.announce) PZ.announce('guideAnnounce', t('guide.announce.updated'));
      }, 1500);
    }
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
  // EIN Aufklapper pro Schritt (v4.35.0, ersetzt das v4.10.0-Einzel-Toggle-Muster): Helfer
  // für den Auf-/Zuklapp-Zustand eines .step__more-Buttons + der Elternkarte (.step). Die
  // Karte selbst (nicht nur der Extras-Container) trägt die Klasse "is-open", weil CSS
  // darüber zusätzlich das Bildband auf der geschlossenen Höhe einfriert
  // (.step.is-open .step__photo, s. css/styles.css) und den Button von float:right auf
  // float:none umschaltet.
  // Bildband-Höhe einfrieren (v4.35.0, per Live-Test korrigiert -- s. ausführlicher
  // Kommentar bei .step.is-open .step__photo in css/styles.css): ein fixer CSS-Pixelwert
  // (ursprünglich 152px aus der Referenz) passte auf Mobil-Viewports nicht zur tatsächlich
  // stark schwankenden geschlossenen Kartenhöhe -- stattdessen wird die Höhe UNMITTELBAR
  // VOR dem Öffnen (während die Karte noch geschlossen ist, .step__photo also noch per
  // align-self:stretch auf die echte Kartenhöhe gestreckt ist) gemessen und als
  // Inline-Style gesetzt, danach erst die Klasse is-open ergänzt (die per CSS auf
  // align-self:flex-start umschaltet, damit ein später wachsender Extras-Bereich die
  // eingefrorene Höhe nicht per Flex-Stretch wieder überschreibt).
  //
  // Obergrenze gegen Hochskalierung (v4.35.1-Bugfix, Befund 2 "Schrittbilder wirken
  // sichtbar hochskaliert/unscharf"; Quellbilder in v4.35.2 auf die doppelte lineare
  // Auflösung neu erzeugt, s. u.): object-fit:cover skaliert bei 88px Bandbreite rein
  // nach der Höhe (containerHeight/PHOTO_SRC_H). Bis v4.35.1 waren alle 19 Quellbilder
  // (assets/img/step-*.webp) nur 300x224px -- auf Mobil-Viewports maß die eingefrorene
  // Höhe bis zu 314-334px (Skalierungsfaktor ~1,4-1,49x CSS-Pixel), real (× devicePixelRatio)
  // ~2,8-4,5x, spürbar unscharf auf modernen 3x-Handys.
  // v4.35.2: die 19 Originale (1200x896, aus dem Git-Verlauf zurückgeholt, s.
  // pizza-rechner-KONTEXT.md) werden jetzt auf 600x448 statt 300x224 verkleinert --
  // PHOTO_SRC_H entsprechend verdoppelt. Live-Nachmessung (Headless-Edge-CDP, worst-case
  // Schritt "Mischen & Zucker & Salz & Öl" im Preset New York Style, sowie testweise Biga-
  // /Poolish-/Teglia-Presets, jeweils bei mehreren Breiten/devicePixelRatio-Kombinationen):
  // bei realistischen Mobil-Breiten (320-390px CSS, 2x-3x DPR) liegt die eingefrorene Höhe
  // jetzt bei 314-473px -- das ist CSS-seitig bereits ein Faktor von nur noch ~0,7-1,06x
  // der neuen Quellhöhe (also größtenteils gar kein Hochskalieren mehr nötig), real
  // (× DPR) ~1,7-2,24x statt vorher ~2,8-4,5x. Selbst bei einer sehr schmalen 280px-Breite
  // (z. B. zusammengeklapptes Foldable-Außendisplay, in der Praxis kein typischer
  // Nutzungsfall) blieb der schlechteste gemessene Wert bei 553,9px = Faktor 1,236x --
  // weiterhin UNTER dem bisherigen Deckel von 1,3x.
  // Entscheidung PHOTO_MAX_UPSCALE bewusst UNVERÄNDERT bei 1,3 belassen (nicht gelockert):
  // die Messung zeigt, dass der Deckel bei keinem getesteten realistischen Fall mehr
  // greift (deutlich mehr Reserve als vorher) -- eine Lockerung hätte keinen Nutzen (löst
  // kein beobachtetes Problem), würde aber die Sicherheitsmarge für künftig wachsende
  // Extras-Texte oder noch schmalere/ungetestete Geräte verringern und dabei denselben
  // realen Geräte-Skalierungsfaktor (~3,9x auf 3x-Displays) wieder ermöglichen, der vor
  // v4.35.1 als sichtbar unscharf gemeldet wurde. Der Deckel wirkt dadurch jetzt als reines
  // Sicherheitsnetz statt (wie in v4.35.1) als aktiv fast immer eingreifender Regler --
  // das ist auch der Grund, warum die in v4.35.1 dokumentierte vergrößerte Lücke unter
  // dem Bildband (".step.is-open .step__photo{border-bottom:...}") jetzt seltener/gar
  // nicht mehr auftritt, ohne dass am Deckel selbst etwas geändert werden musste.
  const PHOTO_SRC_H = 448;
  const PHOTO_MAX_UPSCALE = 1.3;
  function openMore(btn) {
    const step = btn.closest('.step');
    const photo = step ? step.querySelector('.step__photo') : null;
    if (photo) {
      const measured = photo.getBoundingClientRect().height;
      const capped = Math.min(measured, PHOTO_SRC_H * PHOTO_MAX_UPSCALE);
      photo.style.height = capped + 'px';
    }
    btn.setAttribute('aria-expanded', 'true');
    if (step) step.classList.add('is-open');
  }
  function closeMore(btn) {
    btn.setAttribute('aria-expanded', 'false');
    const step = btn.closest('.step');
    if (step) {
      step.classList.remove('is-open');
      const photo = step.querySelector('.step__photo');
      if (photo) photo.style.height = '';
    }
  }

  const guideStepsEl = $('guideSteps');
  if (guideStepsEl) {
    guideStepsEl.addEventListener('click', function (e) {
      const zeitplanBtn = e.target.closest('.schedbar-goto-zeitplan');
      if (zeitplanBtn) { if (PZ.gotoView) PZ.gotoView('zeitplan'); return; }
      // App-weites Single-Open-Akkordeon (unverändert seit v4.10.0, jetzt auf
      // Schritt-Ebene statt auf Einzel-Hinweis-Ebene): vor dem (ggf.) Öffnen DIESES
      // Aufklappers werden alle anderen gerade offenen Schritte im gesamten
      // #guideSteps-Container geschlossen, danach der geklickte Button umgeschaltet.
      const moreBtn = e.target.closest('.step__more');
      if (moreBtn) {
        const wasOpen = moreBtn.getAttribute('aria-expanded') === 'true';
        Array.prototype.forEach.call(
          guideStepsEl.querySelectorAll('.step__more[aria-expanded="true"]'),
          function (b) { if (b !== moreBtn) closeMore(b); }
        );
        if (wasOpen) closeMore(moreBtn); else openMore(moreBtn);
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
