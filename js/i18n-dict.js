/* i18n-dict.js: Wörterbuch-Inhalte für js/i18n.js (v3.55.0)
 *
 * Reine Daten, keine Laufzeit-Logik: alle add(key, de, en)-Einträge, die bis v3.54.0
 * direkt in js/i18n.js standen. Ausgelagert, weil js/i18n.js mit 569 Einträgen /
 * ~108 KB das mit Abstand größte Modul war und bei jedem Feature weiter wuchs --
 * Wartbarkeit litt (Laufzeit-Engine und Wörterbuch-Inhalt ließen sich nicht getrennt
 * überblicken). js/i18n.js (Laufzeit-Logik: t(), setLang(), applyStaticI18n(),
 * wireLangSwitch()) bleibt unverändert zuständig, DIESE Datei liefert nur den Inhalt.
 *
 * Muss VOR js/i18n.js geladen werden (s. <script>-Reihenfolge in pizza-rechner.html/
 * pizza-rechner-mobile.html) -- baut hier ein eigenes, lokales DICT auf und übergibt es
 * über PZ._I18N_DICT an js/i18n.js, das es beim eigenen Start übernimmt (statt ein
 * neues leeres DICT anzulegen) und PZ._i18nAdd() als Hook für spätere, nach js/i18n.js
 * ladende Module bereitstellt (bisher ungenutzt, bleibt für künftige Erweiterungen
 * verfügbar -- z. B. falls ein Modul eigene Übersetzungen dynamisch nachreichen will,
 * ohne diese Datei hier anzufassen).
 *
 * Reine Inhaltsverschiebung (v3.55.0) -- keine inhaltliche Änderung an den
 * Übersetzungstexten selbst, keine neue i18n-Funktionalität.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  const DICT = {
    de: {},
    en: {}
  };

  // Kleiner Helfer fürs Befüllen: erspart bei jedem einzelnen Eintrag "DICT.de[...] =".
  function add(key, de, en) {
    DICT.de[key] = de;
    DICT.en[key] = en;
  }

  // ---- js/schedule.js: Gärzeit-Fahrplan -------------------------------------------
  // Seit v4.24.0 (Poolish-Quellenrecherche, s. pizza-rechner-KONTEXT.md): der Vorteig-Zweig
  // ist von state.yeast entkoppelt und liefert für method !== 'direct' IMMER "prefLong" --
  // die früheren yeast-abhängigen Zweige sched.prefFast/prefMedium/prefVeryLong* sind
  // dadurch unerreichbar geworden und wurden entfernt (s. js/schedule.js für die
  // Begründung). sched.prefLong bleibt der einzige Vorteig-Zweig.
  add('sched.prefLong.label', 'Vorteig · Lange Hauptgare', 'Pre-ferment · Long bulk rise');
  add('sched.prefLong.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)', '<b>2–3 h</b> at room temp (bulk rise)');
  add('sched.prefLong.proof', '<b>5–7 h</b> bei Raumtemp · Fingertest', '<b>5–7 h</b> at room temp · finger test');
  add('sched.directFast.label', 'Schnellgare · gleicher Tag', 'Fast rise · same day');
  add('sched.directFast.bulk', '<b>1,5–2 h</b> bei warmer Raumtemp (24–26 °C)', '<b>1.5–2 h</b> at warm room temp (24–26 °C)');
  add('sched.directFast.proof', '<b>2–3 h</b> bei Raumtemp', '<b>2–3 h</b> at room temp');
  add('sched.directMedium.label', 'Mittlere Gare', 'Medium rise');
  add('sched.directMedium.bulk', '<b>2 h</b> bei Raumtemp', '<b>2 h</b> at room temp');
  add('sched.directMedium.proof', '<b>4–6 h</b> bei Raumtemp', '<b>4–6 h</b> at room temp');
  add('sched.directLong.label', 'Lange Gare · ~24 h', 'Long rise · ~24 h');
  add('sched.directLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)', '<b>2 h</b> at room temp (bulk rise)');
  add('sched.directLongCold.proof', 'Teiglinge <b>18–20 h</b> Kühlschrank (4–6 °C), am Backtag <b>4–5 h</b> temperieren', 'Dough balls <b>18–20 h</b> in the fridge (4–6 °C), let come to room temp <b>4–5 h</b> on baking day');
  add('sched.directLongBulk.bulk', '<b>2 h</b> Raumtemp, dann <b>18–20 h</b> Kühlschrank (4–6 °C)', '<b>2 h</b> room temp, then <b>18–20 h</b> in the fridge (4–6 °C)');
  add('sched.directLongBulk.proof', 'Teiglinge <b>4–6 h</b> bei Raumtemp akklimatisieren', 'Let dough balls acclimatize <b>4–6 h</b> at room temp');
  add('sched.directVeryLong.label', 'Sehr lange Kaltgare · ~48 h', 'Very long cold rise · ~48 h');
  add('sched.directVeryLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)', '<b>2 h</b> at room temp (bulk rise)');
  add('sched.directVeryLongCold.proof', 'Teiglinge <b>36–40 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren', 'Dough balls <b>36–40 h</b> in the fridge (4 °C), let come to room temp <b>5 h</b> on baking day');
  add('sched.directVeryLongBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>24–48 h</b> Kühlschrank (4 °C)', '<b>1–2 h</b> room temp, then <b>24–48 h</b> in the fridge (4 °C)');
  add('sched.directVeryLongBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren', 'Let dough balls come to room temp <b>5–6 h</b> before baking');
  add('sched.directExtreme.label', 'Extrem lange Kaltgare · 72 h+', 'Extremely long cold rise · 72 h+');
  add('sched.directExtremeCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)', '<b>2 h</b> at room temp (bulk rise)');
  add('sched.directExtremeCold.proof', 'Teiglinge <b>68–72 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren', 'Dough balls <b>68–72 h</b> in the fridge (4 °C), let come to room temp <b>5 h</b> on baking day');
  add('sched.directExtremeBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>48–72 h</b> Kühlschrank (4 °C)', '<b>1–2 h</b> room temp, then <b>48–72 h</b> in the fridge (4 °C)');
  add('sched.directExtremeBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren', 'Let dough balls come to room temp <b>5–6 h</b> before baking');
  // v4.28.0: Preset-Override-Fahrpläne für "teglia"/"newyork_style" (js/schedule.js,
  // js/presets.js) -- die Zeiten passen zu keinem der obigen generischen Zweige, s.
  // pizza-rechner-KONTEXT.md für die Quellenherleitung. Bewusst EIN flacher Fahrplan pro
  // Preset (keine Cold/Bulk-Variante wie oben), coldStage ist dadurch für diese zwei
  // Presets wirkungslos, analog zur Vorteig-Nebenwirkung weiter oben in schedule.js.
  add('sched.tegliaOverride.label', 'Teglia-Kaltgare · ~76 h', 'Teglia cold rise · ~76 h');
  add('sched.tegliaOverride.bulk', '<b>1 h</b> bei Raumtemp, dann <b>48 h</b> Kühlschrank (4 °C) im Ganzen', '<b>1 h</b> at room temp, then <b>48 h</b> in the fridge (4 °C) as one piece');
  add('sched.tegliaOverride.proof', 'Nach dem Portionieren nochmal <b>24 h</b> Kühlschrank (4 °C), am Backtag <b>3 h</b> temperieren', 'After portioning another <b>24 h</b> in the fridge (4 °C), let come to room temp <b>3 h</b> on baking day');
  add('sched.nyOverride.label', 'New-York-Style-Kaltgare · ~44 h', 'New York style cold rise · ~44 h');
  add('sched.nyOverride.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)', '<b>2 h</b> at room temp (bulk rise)');
  add('sched.nyOverride.proof', 'Teiglinge <b>38 h</b> Kühlschrank (4 °C), am Backtag <b>4 h</b> temperieren', 'Dough balls <b>38 h</b> in the fridge (4 °C), let come to room temp <b>4 h</b> on baking day');

  // ---- js/guide.js: Schritt-für-Schritt-Anleitung (dynamisch, mit {platzhaltern}) ---
  add('guide.title', 'Schritt-für-Schritt-Anleitung', 'Step-by-step guide');
  // Glossar-Verweis (v3.68.0, "Glossar-Verweise in der Anleitung"): klickbarer Sprung zu
  // einem passenden Glossar-Eintrag, s. Kommentar bei buildGuide()/glossaryLinkHtml() in
  // js/guide.js und PZ.gotoGlossaryEntry() in js/glossary.js. {term} kommt aus dem
  // jeweiligen glossary.<id>.title-Eintrag, damit der Linktext immer zum Zieltitel passt.
  // Gekürzt in v4.20.0 (Nutzerauftrag, /define-feature "Glossar-Verweis-Text kürzen"):
  // "Mehr zu " entfernt -- der Linktext beginnt jetzt direkt mit dem Begriff, "im Glossar"
  // bleibt als kurzer Kontext-Anker erhalten (wichtig fürs Accessible Name, da das 📖-Icon
  // davor aria-hidden ist, s. glossaryLinkHtml() in js/guide.js). Spart v. a. auf Mobil
  // sichtbaren Platz, ohne die Bedeutung für Screenreader-Nutzer zu verlieren.
  add('guide.glossaryLink.label', '{term} im Glossar', '{term} in the glossary');
  // Einklappbare Hinweisboxen (v4.10.0, Backlog Punkt H): sichtbarer Text des Toggle-
  // Buttons ist zugleich sein Accessible Name (kein zusätzliches aria-label nötig) --
  // Auf-/Zu-Zustand wird über aria-expanded angesagt, analog zum bestehenden .info-btn-Muster.
  add('guide.hint.toggleTip', 'Tipp', 'Tip');
  add('guide.hint.toggleWarn', 'Warnung', 'Warning');
  add('guide.weekday.0', 'So', 'Sun'); add('guide.weekday.1', 'Mo', 'Mon');
  add('guide.weekday.2', 'Di', 'Tue'); add('guide.weekday.3', 'Mi', 'Wed');
  add('guide.weekday.4', 'Do', 'Thu'); add('guide.weekday.5', 'Fr', 'Fri');
  add('guide.weekday.6', 'Sa', 'Sat');
  add('guide.dur.min', 'min', 'min');
  add('guide.dur.h', 'h', 'h');
  add('guide.dur.day', 'Tg', 'd');

  add('guide.warn.gareTooLong', 'Gärzeit zu lang für <b>{flourName}</b> (W{flourW}): ~{hours} h geplant, max. {maxH} h empfohlen. Das Gluten baut ab: Teig wird klebrig und reißt. Entweder stärkeres Mehl wählen oder Hefemenge erhöhen.',
    'Rise time too long for <b>{flourName}</b> (W{flourW}): ~{hours} h planned, max. {maxH} h recommended. Gluten breaks down: the dough gets sticky and tears. Either choose a stronger flour or increase the yeast amount.');
  add('guide.warn.gareTooShort', 'Gärzeit zu kurz für <b>{flourName}</b> (W{flourW}): ~{hours} h geplant, mind. {minH} h empfohlen. Das Gluten hat keine Zeit sich auszuentspannen: der Teig federt zurück und lässt sich kaum ausziehen. Entweder schwächeres Mehl wählen oder Hefemenge reduzieren.',
    'Rise time too short for <b>{flourName}</b> (W{flourW}): ~{hours} h planned, min. {minH} h recommended. The gluten has no time to relax: the dough springs back and is hard to stretch. Either choose a weaker flour or reduce the yeast amount.');
  add('guide.warn.hydTooHigh', 'Hydration zu hoch für <b>{flourName}</b>: {hyd} % gewählt, max. {hydMax} % empfohlen. Der Teig kann sehr klebrig werden und schwer zu formen sein.',
    'Hydration too high for <b>{flourName}</b>: {hyd} % chosen, max. {hydMax} % recommended. The dough can become very sticky and hard to shape.');
  add('guide.warn.hydTooLow', 'Hydration etwas niedrig für <b>{flourName}</b>: {hyd} % gewählt, {hydMin}–{hydMax} % wären ideal.',
    'Hydration a bit low for <b>{flourName}</b>: {hyd} % chosen, {hydMin}–{hydMax} % would be ideal.');

  add('guide.sec.prefBiga', 'Vorteig: Biga ansetzen', 'Pre-ferment: mix the biga');
  add('guide.sec.prefPoolish', 'Vorteig: Poolish ansetzen', 'Pre-ferment: mix the poolish');
  add('guide.sec.main', 'Hauptteig', 'Final dough');
  add('guide.sec.prep', 'Vorbereitung', 'Preparation');
  add('guide.sec.knead', 'Kneten', 'Kneading');
  add('guide.sec.rise', 'Gare & Formen', 'Rise & shaping');
  add('guide.sec.bake', 'Backen', 'Baking');

  add('guide.step.prefWeigh.title', 'Vorteig abwiegen', 'Weigh the pre-ferment');
  add('guide.chip.5min', '~5 min', '~5 min');
  add('guide.step.prefWeigh.body', 'Für den {prefName}: <b>{pf} Mehl</b>, <b>{pw} Wasser</b> ({hydTxt}) und <b>{pYeast} Hefe {yWord}</b>.',
    'For the {prefName}: <b>{pf} flour</b>, <b>{pw} water</b> ({hydTxt}) and <b>{pYeast} {yWord} yeast</b>.');
  add('guide.pref.poolishRatio', '100% (also 1:1)', '100% (i.e. 1:1)');
  add('guide.pref.clampNote', 'Der Vorteig-Anteil wurde automatisch auf <b>{prefEff} %</b> begrenzt: bei {hyd} % Hydration passt nicht mehr Wasser in den {prefType} als insgesamt im Teig ist.',
    'The pre-ferment share was automatically capped at <b>{prefEff} %</b>: at {hyd} % hydration, the {prefType} can\'t hold more water than the whole dough contains.');
  add('guide.step.prefWeigh.tip', 'Wasser hier <b>zimmerwarm</b> (nicht eisgekühlt) – der Vorteig soll ja in Ruhe arbeiten.',
    'Use <b>room-temperature</b> water here (not ice-cold): the pre-ferment should work slowly and calmly.');
  // Seit v4.25.0: eigener Tipp für Biga statt des Poolish-Bausteins oben -- die Quellen
  // widersprechen sich hier bewusst (Salamico rechnet mit der "Regola del 55", Speedelicious
  // nutzt ausdrücklich eiskaltes Wasser, Zieltemperatur der fertigen Biga 18–20 °C). Die
  // Regola-del-55-Formel selbst ist NICHT eingebaut (eigenes Feature), nur die Anweisung.
  add('guide.step.prefWeigh.tipBiga', 'Wasser hier bewusst <b>kühl</b> ansetzen, nicht zimmerwarm: die feste, wenig Hefe enthaltende Biga reift ohnehin langsam, kühles Schüttwasser hält ihre Starttemperatur niedrig (Zielwert ca. 18–20 °C) und verhindert ein zu schnelles Anspringen.',
    'Use deliberately <b>cool</b> water here, not room temperature: this firm, low-yeast pre-ferment already matures slowly, and cool water keeps its starting temperature low (roughly 18–20 °C) to avoid it taking off too fast.');

  add('guide.step.bigaMix.title', 'Biga grob mischen', 'Roughly mix the biga');
  add('guide.step.bigaMix.chip', 'mit der Hand', 'by hand');
  add('guide.step.bigaMix.body', 'Hefe im Wasser auflösen, übers Mehl geben und <b>mit den Händen nur grob vermengen</b> – ca. <b>1–2 min</b>, bis keine trockenen Mehlnester mehr da sind. Die Biga bleibt krümelig-stückig, <b>nicht glatt kneten</b>. (Hier keine Maschine nutzen – zu festes Kneten zerstört die Struktur.)',
    'Dissolve the yeast in the water, pour over the flour and <b>mix roughly by hand only</b>: about <b>1–2 min</b>, until there are no dry flour pockets left. The biga stays crumbly and lumpy, <b>do not knead it smooth</b>. (Don\'t use a machine here: kneading it too firm destroys the structure.)');
  add('guide.step.bigaMix.warn', 'Es soll aussehen wie nasse Brösel oder grober Streusel, nicht wie ein normaler Teig.',
    'It should look like wet breadcrumbs or coarse crumble, not like a normal dough.');
  // Seit v4.25.0: zwei statt drei Stufen (b_klassisch/b_kalt, s. PZ.PREF_STAGES in
  // js/ui.js) -- guide.biga.temp.cooler (die erfundenen "14–16 °C" ohne Quellenbeleg)
  // ersatzlos entfernt.
  add('guide.biga.temp.cool', 'Abgedeckt bei <b>16–18 °C</b> reifen lassen (Keller, Speisekammer, Kühlschranktür).',
    'Let it rise covered at <b>16–18 °C</b> (cellar, pantry, fridge door).');
  add('guide.biga.temp.cold', '<b>2 h</b> bei Raumtemp anspringen lassen, dann in den <b>Kühlschrank (4–6 °C)</b>.',
    'Let it start for <b>2 h</b> at room temp, then into the <b>fridge (4–6 °C)</b>.');
  add('guide.step.bigaRest.title', 'Biga reifen lassen', 'Let the biga rise');
  add('guide.step.bigaRest.body', '{bigaTempTxt} Reif = <b>etwa verdoppeltes Volumen</b>, sie lockert sich auf und duftet säuerlich-hefig.',
    '{bigaTempTxt} Ready = <b>roughly doubled in volume</b>, it loosens up and smells tangy-yeasty.');
  add('guide.step.bigaRest.tip', 'Längere Reife braucht <b>weniger Hefe</b> im Vorteig und/oder <b>kühlere</b> Lagerung. Fertig = luftig-schwammig, gerade eben eingefallen.',
    'A longer rise needs <b>less yeast</b> in the pre-ferment and/or <b>cooler</b> storage. Ready = airy and spongy, just barely starting to collapse.');

  add('guide.step.poolishMix.title', 'Poolish verrühren', 'Stir the poolish');
  add('guide.step.poolishMix.chip', 'mit Löffel / Schneebesen', 'with a spoon / whisk');
  add('guide.step.poolishMix.body', 'Hefe im Wasser auflösen, dann Mehl einrühren – <b>mit einem Löffel oder Schneebesen ca. 2–3 min rühren</b>, bis ein <b>zäher, klumpenfreier Pfannkuchenteig</b> entsteht. Abdecken.',
    'Dissolve the yeast in the water, then stir in the flour: <b>stir with a spoon or whisk for about 2–3 min</b> until you get a <b>thick, lump-free pancake-batter consistency</b>. Cover.');
  add('guide.poolish.temp.warm', 'Durchgehend bei <b>Raumtemperatur</b> ausreifen lassen, keine Kühlung nötig.',
    'Let it rise throughout at <b>room temperature</b>, no cooling needed.');
  add('guide.poolish.temp.cold', '<b>1 h</b> bei Raumtemp anspringen lassen, dann <b>kühl stellen (Kühlschrank)</b> und langsam ausreifen.',
    'Let it start for <b>1 h</b> at room temp, then place it <b>in the fridge</b> to rise slowly.');
  add('guide.step.poolishRest.title', 'Poolish reifen lassen', 'Let the poolish rise');
  add('guide.step.poolishRest.body', '{poolishTempTxt} Reif = <b>etwa verdoppeltes Volumen</b>, Oberfläche <b>voller Blasen</b>, kurz bevor er wieder einfällt.',
    '{poolishTempTxt} Ripe = <b>roughly doubled in volume</b>, surface <b>full of bubbles</b>, just before it starts to collapse again.');
  add('guide.step.poolishRest.tip', 'Fingertest: riecht angenehm nach Hefe/Joghurt, nicht stechend nach Alkohol. Länger als ~24 h zieht er nicht durch.',
    'Finger test: smells pleasantly of yeast/yogurt, not sharply of alcohol. It won\'t hold up much longer than ~24 h.');

  add('guide.step.waterTemp.title', 'Schüttwasser temperieren', 'Temper the mixing water');
  // Backlog Punkt I (v4.11.0, "Zieltemperatur statt Eis in der Hauptanleitung"): kein
  // {iceTxt}-Platzhalter mehr -- der Schritt spricht nur noch von der Zieltemperatur
  // selbst. guide.iceTxt/guide.step.waterTemp.tip (bisherige Eis-Bausteine) entfernt,
  // s. js/guide.js.
  add('guide.step.waterTemp.body', '<b>{mWater} Wasser</b> auf <b>{wT}</b> bringen. Das ist das Restwasser für den Hauptteig.',
    'Bring <b>{mWater} water</b> to <b>{wT}</b>. This is the remaining water for the final dough.');

  add('guide.pref.addWater', 'mit dem <b>{mWater} Wasser</b> lösen', 'dissolve it with the <b>{mWater} water</b>');
  add('guide.pref.addFlour', '<b>{mFlour} Mehl</b>{yeastPart}{sugarPart} zugeben', 'add <b>{mFlour} flour</b>{yeastPart}{sugarPart}');
  // Bugfix v4.24.0: eigene Formulierung, wenn die Mehlzugabe der EINZIGE addParts-Eintrag
  // ist (kein Restwasser mehr übrig, hasMW false -- tritt beim 66/66-Poolish-Preset immer
  // auf, 66 % Vorteig bei 66 % Hydration ergibt exakt 0 g Restwasser). Ohne eigenen
  // Bindesatz ergab "Den ganzen {prefName} {addParts} und {mixPhrase}" den grammatisch
  // kaputten Satz "Den ganzen Poolish 203 g Mehl zugeben und ...", weil guide.pref.addFlour
  // nur als ANSCHLUSS nach "...lösen, dann" gedacht war, nicht als direktes Objekt.
  add('guide.pref.addFlourOnly', 'sowie <b>{mFlour} Mehl</b>{yeastPart}{sugarPart} zugeben', 'and add <b>{mFlour} flour</b>{yeastPart}{sugarPart}');
  add('guide.pref.addFlour.yeastPart', ' und <b>{mYeast} Hefe {yWord}</b>', ' and <b>{mYeast} {yWord} yeast</b>');
  add('guide.pref.addFlour.sugarPart', ' und <b>{sugar} Zucker</b>', ' and <b>{sugar} sugar</b>');
  add('guide.pref.noAddParts', 'in die Schüssel geben', 'pour it into the bowl');
  add('guide.pref.joinThen', ', dann ', ', then ');
  add('guide.titleSuffix.water', ' + Wasser', ' + water');
  add('guide.titleSuffix.flour', ' + Mehl', ' + flour');
  add('guide.titleSuffix.sugar', ' + Zucker', ' + sugar');
  // Generischer Begriff "Vorteig" (Pre-ferment) als Schritt-Titel-Basis: bewusst NICHT
  // prefName (= "Biga"/"Poolish", Eigenname), sondern der übergeordnete Fachbegriff: an
  // dieser Stelle wird der gesamte, bereits gereifte Vorteig als Zutat in den Hauptteig
  // gegeben (Titel z. B. "Vorteig + Wasser + Mehl").
  add('guide.prefGenericTitle', 'Vorteig', 'Pre-ferment');
  add('guide.step.prefCombine.body', 'Den ganzen {prefName} {addParts} und {mixPhrase}',
    'Take the whole {prefName}, {addParts}, then {mixPhrase}');
  add('guide.mix.machine', '<b>in der Maschine ca. 2–3 min auf niedriger Stufe vermengen</b>, bis ein grober Teig entsteht.',
    '<b>mix in the machine on low speed for about 2–3 min</b>, until a rough dough forms.');
  add('guide.mix.hand', '<b>von Hand ca. 3–5 min vermengen</b> (drücken, falten, drehen), bis kein trockenes Mehl mehr sichtbar ist.',
    '<b>mix by hand for about 3–5 min</b> (press, fold, turn) until no dry flour is visible anymore.');
  add('guide.step.saltAdd.title', 'Salz zugeben', 'Add the salt');
  add('guide.suffix.oil', ' &amp; Öl', ' &amp; oil');
  add('guide.step.saltAdd.chip', 'nach 2–3 min', 'after 2–3 min');
  add('guide.step.saltAdd.body', 'Erst wenn alles grob zusammenhängt, <b>{salt} Salz</b> {saltPhrase}{oilStep}',
    'Only once everything roughly holds together, {saltPhrase} the <b>{salt} salt</b>{oilStep}');
  add('guide.salt.machine', 'zugeben und <b>weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.',
    'add and <b>work in for another 2–3 min on medium speed</b>.');
  add('guide.salt.hand', 'einstreuen und <b>von Hand ca. 2–3 min einkneten</b>.',
    'sprinkle in and <b>knead in by hand for about 2–3 min</b>.');
  add('guide.step.saltAdd.warn', 'Salz nie direkt auf die Hefe – es bremst sie. Immer zeitversetzt zugeben.',
    'Never put salt directly on the yeast: it slows it down. Always add it with a delay.');
  add('guide.oilStep', ' Zum Schluss <b>{oil} Olivenöl</b> nach und nach einarbeiten, bis der Teig es vollständig aufgenommen hat und wieder glatt ist.',
    ' Finally, work in <b>{oil} olive oil</b> gradually, until the dough has fully absorbed it and is smooth again.');
  add('guide.oilTip', 'Öl <b>erst nach dem Salz</b> zugeben: kommt es zu früh, umhüllt es das Mehl und stört die Glutenbildung. Langsam einarbeiten, dann wird der Teig geschmeidig.',
    'Add the oil <b>only after the salt</b>: added too early, it coats the flour and disrupts gluten development. Work it in slowly for a supple dough.');
  add('guide.sugarPhrase', ' sowie <b>{sugar} Zucker</b>', ' as well as <b>{sugar} sugar</b>');
  add('guide.sugarTip', 'Zucker <b>früh mit Mehl, Wasser &amp; Hefe</b> zugeben: er unterstützt die Hefeaktivität und sorgt beim Backen für die typische New-York-Style-Krustenbräunung.',
    'Add sugar <b>early, with the flour, water &amp; yeast</b>: it supports yeast activity and gives the typical New-York-style crust browning during baking.');

  add('guide.step.weighIngredients.title', 'Zutaten abwiegen', 'Weigh the ingredients');
  add('guide.step.weighIngredients.body', '<b>{flour} Mehl</b> · <b>{water} Wasser</b> · <b>{salt} Salz</b> · <b>{yeast} Hefe {yWord}</b>{sugarPart}{oilPart}.',
    '<b>{flour} flour</b> · <b>{water} water</b> · <b>{salt} salt</b> · <b>{yeast} {yWord} yeast</b>{sugarPart}{oilPart}.');
  add('guide.weighIngredients.sugarPart', ' · <b>{sugar} Zucker</b>', ' · <b>{sugar} sugar</b>');
  add('guide.weighIngredients.oilPart', ' · <b>{oil} Olivenöl</b>', ' · <b>{oil} olive oil</b>');
  add('guide.step.weighIngredients.tip', 'Für Hefe & Salz eine <b>0,1-g-Feinwaage</b> nutzen – bei diesen kleinen Mengen entscheidend.',
    'Use a <b>precision scale (0.1 g)</b> for yeast &amp; salt: essential at these small amounts.');
  // Backlog Punkt I (v4.11.0): identisch, kein {iceTxt}-Platzhalter mehr, s. Kommentar bei
  // guide.step.waterTemp.body oben. guide.step.waterTempDirect.tip (bisheriger Eis-Tipp)
  // entfernt.
  add('guide.step.waterTempDirect.body', 'Das <b>{water} Wasser</b> auf <b>{wT}</b> bringen. So landet der Teig nach dem Kneten bei ~{ddt}.',
    'Bring the <b>{water} water</b> to <b>{wT}</b>. That way the dough lands at ~{ddt} after kneading.');
  add('guide.reserveWaterTip', 'Behalte <b>2–3 EL vom Schüttwasser</b> zurück, um danach die Hefe darin aufzulösen.',
    'Set aside <b>2–3 tbsp of the mixing water</b> to dissolve the yeast in afterwards.');
  add('guide.step.autolyse.title', 'Autolyse (empfohlen)', 'Autolyse (recommended)');
  add('guide.step.autolyse.chip', '20–40 min', '20–40 min');
  add('guide.step.autolyse.body', 'Nur <b>Mehl + Wasser</b> grob mischen (Salz und Hefe kommen erst später), abdecken, ruhen lassen. Weniger Knetarbeit, dehnbarerer Teig.',
    'Roughly mix just <b>flour + water</b> (salt and yeast come later), cover, let it rest. Less kneading work, a more extensible dough.');
  add('guide.step.autolyse.warn', 'Ohne Salz arbeiten die Enzyme im Mehl ungebremst – <b>Autolyse nicht über ~40–60 min ausdehnen</b>. Länger baut das Klebergerüst eher ab als auf (Teig wird zunehmend klebrig-schwach statt elastisch).',
    'Without salt, the enzymes in the flour work unchecked: <b>don\'t extend the autolyse beyond ~40–60 min</b>. Longer breaks the gluten structure down rather than building it up (the dough gets increasingly sticky-weak instead of elastic).');
  add('guide.step.addYeast.title', 'Hefe zugeben', 'Add the yeast');
  add('guide.chip.2min', '~2 min', '~2 min');
  add('guide.yeastType.dry', 'Trockenhefe', 'dry yeast');
  add('guide.yeastType.fresh', 'Frischhefe', 'fresh yeast');
  add('guide.yeast.tinyBody', 'Bei dieser sehr kleinen Menge (<b>{yeast}</b>) die {yeastTypeName} im <b>zurückbehaltenen Wasser auflösen</b> und gleichmäßig über den Teig geben – trocken eingestreut verteilt sie sich bei so wenig Menge kaum gleichmäßig.',
    'At this very small amount (<b>{yeast}</b>), dissolve the {yeastTypeName} in the <b>reserved water</b> and pour it evenly over the dough: sprinkled in dry, it barely distributes evenly at such a small quantity.');
  add('guide.yeast.dryBody', 'Trockenhefe gleichmäßig <b>über den Autolyse-Teig streuen</b> und kurz einarbeiten.',
    'Sprinkle dry yeast evenly <b>over the autolyse dough</b> and briefly work it in.');
  add('guide.yeast.freshBody', 'Frischhefe im <b>zurückbehaltenen Wasser auflösen</b> und über den Teig geben.',
    'Dissolve fresh yeast in the <b>reserved water</b> and pour it over the dough.');
  add('guide.yeast.tinyTip', 'Für so kleine Mengen eine <b>0,01-g-Feinwaage</b> nutzen – normale Küchenwaagen liegen hier schnell 30 % daneben.',
    'Use a <b>0.01 g precision scale</b> for such small amounts: regular kitchen scales can easily be off by 30 % here.');
  add('guide.step.dissolveYeast.title', 'Hefe lösen', 'Dissolve the yeast');
  add('guide.yeast.dryDirect', 'Trockenhefe <b>direkt ins Mehl</b> mischen – sie muss nicht vorgelöst werden.',
    'Mix dry yeast <b>directly into the flour</b>: it doesn\'t need to be dissolved first.');
  add('guide.yeast.freshDirect', 'Frischhefe im <b>temperierten Wasser auflösen</b>, bis keine Stückchen mehr da sind.',
    'Dissolve fresh yeast in the <b>tempered water</b> until no lumps remain.');

  add('guide.step.mixSalt.title', 'Mischen', 'Mix');
  add('guide.suffix.sugar', ' &amp; Zucker', ' &amp; sugar');
  add('guide.suffix.salt', ' &amp; Salz', ' &amp; salt');
  add('guide.mixSalt.machine', 'Mehl, Wasser & Hefe{sugarPhrase} in die Maschine geben und <b>ca. 2–3 min auf niedriger Stufe vermengen</b>, dann <b>{salt} Salz zugeben und weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.',
    'Put flour, water &amp; yeast{sugarPhrase} in the machine and <b>mix on low speed for about 2–3 min</b>, then <b>add the {salt} salt and work in for another 2–3 min on medium speed</b>.');
  add('guide.mixSalt.hand', 'Mehl, Wasser & Hefe{sugarPhrase} <b>von Hand ca. 3–5 min grob vermengen</b> (bis kein trockenes Mehl mehr bleibt), dann <b>{salt} Salz einstreuen und weitere 2–3 min einkneten</b>.',
    'Roughly <b>mix flour, water &amp; yeast{sugarPhrase} by hand for about 3–5 min</b> (until no dry flour remains), then <b>sprinkle in the {salt} salt and knead for another 2–3 min</b>.');
  add('guide.step.mixSalt.warn', 'Salz zeitversetzt zur Hefe zugeben – nie direkt aufeinander.',
    'Add the salt with a delay after the yeast: never put them directly together.');

  add('guide.step.stretchFold.title', 'Stretch &amp; Fold statt Kneten', 'Stretch &amp; fold instead of kneading');
  add('guide.step.stretchFold.chip', '4 × alle 30 min', '4 × every 30 min');
  add('guide.step.stretchFold.body', 'Bei <b>{hyd}% Hydration</b> ist der Teig zu klebrig zum klassischen Kneten. Kurz mischen, dann <b>4 Runden Dehnen & Falten</b> alle 30 min mit <b>nassen Händen</b>.',
    'At <b>{hyd}% hydration</b> the dough is too sticky for classic kneading. Mix briefly, then do <b>4 rounds of stretch &amp; fold</b> every 30 min with <b>wet hands</b>.');
  add('guide.step.stretchFold.tip', 'Zwischen den Runden abgedeckt ruhen lassen – das Gluten entwickelt sich von selbst.',
    'Let it rest covered between rounds: the gluten develops on its own.');
  add('guide.step.knead.title', 'Kneten', 'Knead');
  add('guide.step.knead.chipMachine', '8–12 min', '8–12 min');
  add('guide.step.knead.chipHand', '10–15 min', '10–15 min');
  add('guide.knead.machineBody', 'Maschine: <b>8–12 min</b> auf niedriger/mittlerer Stufe', 'Machine: <b>8–12 min</b> on low/medium speed');
  add('guide.knead.handBody', 'Von Hand: <b>10–15 min</b> (kneten, dehnen, falten)', 'By hand: <b>10–15 min</b> (knead, stretch, fold)');
  add('guide.step.knead.bodySuffix', ', bis der Teig <b>glatt & elastisch</b> ist. Fenstertest: dünn ausziehbar ohne zu reißen.',
    ', until the dough is <b>smooth &amp; elastic</b>. Windowpane test: stretches thin without tearing.');
  add('guide.step.checkTemp.title', 'Teigtemperatur prüfen', 'Check the dough temperature');
  add('guide.step.checkTemp.chip', 'Ziel 23–25 °C', 'Target 23–25 °C');
  add('guide.step.checkTemp.body', 'Thermometer in den Teig: <b>{ddt}</b> angepeilt. Wärmer → schnellere Gare, kälter → langsamer.',
    'Thermometer into the dough: targeting <b>{ddt}</b>. Warmer → faster rise, colder → slower.');
  // Bugfix v4.24.0: Variante ohne Zieltemperatur-Behauptung für Vorteig-Rezepte ohne
  // Hauptteig-Restwasser (kein Schüttwasser-Stellhebel mehr übrig, s. Kommentar in
  // js/guide.js).
  add('guide.step.checkTemp.bodyNoWater', 'Thermometer in den Teig: aktuelle Temperatur notieren. Es ist kein Schüttwasser mehr übrig, über das sich die Temperatur gezielt steuern ließe.',
    'Thermometer into the dough: note the current temperature. There is no mixing water left here to steer the temperature with.');

  add('guide.step.bulkRise.title', 'Stockgare (im Stück)', 'Bulk rise (whole dough)');
  add('guide.step.bulkRise.chipColdBalls', 'Raumtemp + kühl', 'Room temp + cold');
  add('guide.step.bulkRise.chipDefault', 'Raumtemp', 'Room temp');
  add('guide.step.bulkRise.body', 'Teig zur Kugel formen, in eine geölte/abgedeckte Schüssel. {bulk}.',
    'Shape the dough into a ball, place in an oiled/covered bowl. {bulk}.');
  add('guide.step.formBalls.title', 'Teiglinge formen', 'Shape the dough balls');
  add('guide.step.formBalls.body', 'In <b>{N} Stücke à {W}</b> teilen. Jedes zu einer <b>straffen Kugel</b> formen (Oberfläche spannen, Schluss nach unten). Mit Abstand in eine {boxTxt}.',
    'Divide into <b>{N} pieces of {W} each</b>. Shape each into a <b>tight ball</b> (tension on the surface, seam down). Place with space between them in a {boxTxt}.');
  add('guide.box.cold', 'kühlschranktaugliche, dicht schließende Box', 'fridge-safe, tightly sealing container');
  add('guide.box.normal', 'Box', 'container');
  add('guide.step.formBalls.tip', 'Straff geformte Kugeln = runde Pizzen mit gleichmäßigem Rand (Cornicione).',
    'Tightly shaped balls = round pizzas with an even rim (cornicione).');
  add('guide.step.finalProof.title', 'Stückgare (Teiglinge)', 'Final proof (dough balls)');
  add('guide.step.finalProof.chipCold', 'kühl · Fingertest', 'cold · finger test');
  add('guide.step.finalProof.chipDefault', 'Fingertest', 'finger test');
  add('guide.step.finalProof.body', '{proof}. <b>Fertig</b>, wenn ein leichter Fingerdruck <b>langsam</b> zurückfedert (eine kleine Delle bleibt).',
    '{proof}. <b>Ready</b> when a light finger press springs back <b>slowly</b> (a small dent remains).');
  add('guide.step.finalProof.tip', 'Teiglinge vor dem Backen wirklich auf Raumtemperatur kommen lassen – kalter Teig reißt beim Ausziehen.',
    'Really let the dough balls come to room temperature before baking: cold dough tears when stretched.');

  // Temperaturskalierung (v4.27.0, js/schedule.js): ersetzt bei abweichender
  // Raumtemperatur (state.room != 21 °C) den statischen {bulk}/{proof}-Textbaustein durch
  // eine aus der tatsächlich skalierten Minutenzahl berechnete Anzeige (s. js/guide.js,
  // fmtDur()) -- verhindert einen Etiketten-Fehler (Text nennt eine andere Zahl als Timer/
  // Zeitplan). "Ca." markiert bewusst, dass es sich um einen an die Raumtemperatur
  // angepassten Richtwert handelt, keine erneut exakt vermessene Zeit.
  add('guide.tempScaled.bulk', 'Ca. <b>{h}</b> bei Raumtemp (Stockgare)', 'Approx. <b>{h}</b> at room temp (bulk rise)');
  add('guide.tempScaled.proof', 'Ca. <b>{h}</b> bei Raumtemp', 'Approx. <b>{h}</b> at room temp');
  add('guide.tempScaled.tip', 'Diese Zeit wurde an deine eingestellte Raumtemperatur ({room} °C) angepasst. Bezugswert dieser App ist 21 °C: wärmer lässt den Teig schneller reifen, kühler langsamer (Mechanismus durch Fachquellen belegt, die genaue Verdopplungsdistanz ist ein bewusst konservativ gewählter Richtwert).',
    'This time was adapted to your set room temperature ({room} °C). This app\'s reference value is 21 °C: warmer speeds up fermentation, cooler slows it down (the mechanism is backed by baking sources, the exact doubling distance is a deliberately conservative estimate).');

  add('guide.step.preheat.title', 'Ofen vorheizen', 'Preheat the oven');
  add('guide.step.preheat.chip', '30–45 min', '30–45 min');
  add('guide.step.preheat.body', 'Pizzastein/-stahl auf <b>höchste Stufe</b> vorheizen. Pizzaofen (Gas/Holz) <b>430–480 °C</b>; Haushaltsofen Maximum (250–300 °C) + Grill, Stein ganz oben.',
    'Preheat the pizza stone/steel on the <b>highest setting</b>. Pizza oven (gas/wood) <b>430–480 °C</b>; home oven maximum (250–300 °C) + grill/broiler, stone at the top.');
  add('guide.step.preheat.tip', 'Der Stein muss richtig durchglühen – lieber 10 min länger. (Startzeit = 50 min vor dem Backen.)',
    'The stone needs to really heat through: better 10 min too long. (Start time = 50 min before baking.)');
  add('guide.step.shape.title', 'Pizza ausziehen', 'Stretch the pizza');
  add('guide.step.shape.chip', 'kein Nudelholz!', 'no rolling pin!');
  add('guide.step.shape.body', 'Teigling in Mehl/Grieß betten, von der Mitte mit den <b>Fingerspitzen flachdrücken</b>, Rand (~1,5 cm) stehen lassen, über die Handrücken auf Größe ziehen.',
    'Bed the dough ball in flour/semolina, <b>flatten from the center with your fingertips</b>, leave the rim (~1.5 cm) untouched, stretch to size over the backs of your hands.');
  add('guide.step.shape.warn', 'Nie ein Nudelholz – das drückt die Luft aus dem Rand. Der Cornicione lebt von der Gärblase.',
    'Never use a rolling pin: it presses the air out of the rim. The cornicione lives off that trapped gas.');
  add('guide.bake.small', 'Pizzaofen bei ~450 °C: <b>60–90 Sekunden</b> (einmal drehen). Haushaltsofen: <b>5–8 min</b> unter dem Grill.',
    'Pizza oven at ~450 °C: <b>60–90 seconds</b> (turn once). Home oven: <b>5–8 min</b> under the grill/broiler.');
  add('guide.bake.large', 'Größere Teiglinge: Pizzaofen <b>~2 min</b>, Haushaltsofen <b>8–12 min</b>.',
    'Larger dough balls: pizza oven <b>~2 min</b>, home oven <b>8–12 min</b>.');
  add('guide.step.bakeTopping.title', 'Belegen & Backen', 'Top & bake');
  add('guide.step.bakeTopping.body', 'Zügig belegen (wenig Sauce, gut abgetropfter Mozzarella), sofort einschießen. {bakeTxt} Fertig beim <b>aufgegangenen, gefleckten Rand</b> (Leoparding).',
    'Top quickly (little sauce, well-drained mozzarella), launch immediately. {bakeTxt} Done when the rim is <b>puffed up and leopard-spotted</b>.');
  add('guide.step.bakeTopping.tip', 'Alles vorher bereitstellen – ab dem Ausziehen geht es schnell.',
    'Have everything ready beforehand: once you start stretching it goes fast.');

  // ---- Foto der fertigen Pizza (v3.69.0), abschließender Schritt nach dem Backen --------
  add('guide.step.finalPhoto.title', 'Fertig!', 'Done!');
  add('guide.step.finalPhoto.body', 'Deine Pizza ist fertig gebacken.', 'Your pizza is done baking.');
  add('guide.step.finalPhoto.alt.napoli', 'Fertig gebackene neapolitanische Pizza mit rundem, luftigem Rand',
    'Finished Neapolitan pizza with a round, airy rim');
  add('guide.step.finalPhoto.alt.teglia', 'Fertig gebackene rechteckige Teglia-Pizza vom Blech',
    'Finished rectangular Teglia pizza from a baking sheet');
  add('guide.step.finalPhoto.alt.newyork', 'Fertig gebackene New-York-Style-Pizza mit dünner, knuspriger Kruste',
    'Finished New-York-style pizza with a thin, crispy crust');

  add('guide.schedbar.withTime', '⏱️ <b>Gesamtdauer ca. {dur}</b><br><span class="big">▶ Start {startClock}</span> &nbsp;→&nbsp; <span class="big">🍕 Fertig {endClock}</span>',
    '⏱️ <b>Total time approx. {dur}</b><br><span class="big">▶ Start {startClock}</span> &nbsp;→&nbsp; <span class="big">🍕 Ready {endClock}</span>');
  add('guide.summary.withTime', '{label} · {N} × {W} · {hyd}% Hydration', '{label} · {N} × {W} · {hyd}% hydration');
  // Bugfix (v3.38.0): "gib oben eine Start-/Zielzeit an" stimmte seit der
  // Burgermenü-Navigation (v3.26.0) nicht mehr: Start-/Zielzeit-Felder liegen
  // seitdem im eigenen Menüpunkt "Zeitplan", nicht mehr im selben Bereich wie
  // die Anleitung. Der {zeitplan}-Platzhalter wird in js/guide.js mit einem
  // klickbaren <button data-goto="zeitplan">-Snippet befüllt (springt direkt
  // zum Menüpunkt, s. PZ.gotoView() in js/nav.js).
  add('guide.schedbar.noTime', '⏱️ Gesamtdauer ca. <b>{dur}</b>: lege im Bereich {zeitplan} eine <b>Start-</b> oder <b>Zielzeit</b> fest, dann bekommt jeder Schritt eine Uhrzeit.',
    '⏱️ Total time approx. <b>{dur}</b>: set a <b>start</b> or <b>target time</b> in the {zeitplan} section, then every step gets a clock time.');
  add('guide.summary.noTime', '{label} · Gesamt ~{dur}', '{label} · Total ~{dur}');

  // ---- js/party.js: Pizza-Party-Planer: 8 Presets + UI-Strings -----------------------
  add('party.preset.margherita.name', 'Margherita', 'Margherita');
  add('party.ing.tomatoSauce', 'Tomatensauce', 'Tomato sauce');
  add('party.ing.mozzarella', 'Mozzarella', 'Mozzarella');
  add('party.ing.basil', 'Basilikum', 'Basil');
  add('party.unit.leaves', 'Blätter', 'leaves');
  add('party.preset.salami.name', 'Salami', 'Salami');
  add('party.ing.salami', 'Salami', 'Salami');
  add('party.preset.funghi.name', 'Funghi', 'Funghi');
  add('party.ing.mushrooms', 'Champignons', 'Mushrooms');
  add('party.preset.diavola.name', 'Diavola', 'Diavola');
  add('party.ing.spicySalami', 'Scharfe Salami', 'Spicy salami');
  add('party.ing.chiliFlakes', 'Peperoncini', 'Chili flakes');
  add('party.preset.prosciutto.name', 'Prosciutto', 'Prosciutto');
  add('party.ing.cookedHam', 'Kochschinken', 'Cooked ham');
  add('party.preset.quattroFormaggi.name', 'Quattro Formaggi', 'Quattro Formaggi');
  add('party.ing.gorgonzola', 'Gorgonzola', 'Gorgonzola');
  add('party.ing.parmesan', 'Parmesan', 'Parmesan');
  add('party.ing.provolone', 'Provolone', 'Provolone');
  add('party.preset.verdure.name', 'Verdure', 'Verdure');
  add('party.ing.zucchini', 'Zucchini', 'Zucchini');
  add('party.ing.paprika', 'Paprika', 'Bell pepper');
  add('party.ing.eggplant', 'Aubergine', 'Eggplant');
  add('party.preset.hawaii.name', 'Hawaii', 'Hawaii');
  add('party.ing.pineapple', 'Ananas', 'Pineapple');

  add('party.noPizzas', 'Noch keine Pizzen vorhanden.', 'No pizzas yet.');
  add('party.qtyDecrease', '{name}: Anzahl verringern', '{name}: decrease amount');
  add('party.qtyIncrease', '{name}: Anzahl erhöhen', '{name}: increase amount');
  add('party.qtyGroupLabel', 'Anzahl {name}', 'Amount of {name}');
  add('party.deleteBtn', 'Eigene Pizza „{name}“ löschen', 'Delete custom pizza "{name}"');
  add('party.deleteConfirm', '„{name}“ wirklich löschen?', 'Really delete "{name}"?');
  add('party.deletedMsg', '„{name}“ wurde gelöscht.', '"{name}" was deleted.');
  add('party.noneSelectedHint', 'Noch keine Pizza ausgewählt: stelle oben Stückzahlen ein.', 'No pizza selected yet: set the quantities above.');
  add('party.summaryOne', '1 Pizza insgesamt', '1 pizza in total');
  add('party.summaryMany', '{n} Pizzen insgesamt', '{n} pizzas in total');
  // Design-Import Zyklus 3 (v4.2.0): Label-Halbsätze für die TotalSummary.jsx-Optik der
  // Kopfzahl (große Zahl + kleines Label statt eines einzelnen Fließtextsatzes, s.
  // js/party.js renderPartyResult()). party.summaryOne/Many oben bleiben unverändert
  // (vollständige Sätze, u. a. für tests/test.html).
  add('party.totalLabelOne', 'Pizza insgesamt', 'pizza in total');
  add('party.totalLabelMany', 'Pizzen insgesamt', 'pizzas in total');
  add('party.ingRemoveLabel', 'Zutatenzeile {n} entfernen', 'Remove ingredient row {n}');
  add('party.ingNamePlaceholder', 'Zutat, z. B. Mozzarella', 'Ingredient, e.g. mozzarella');
  add('party.ingNameLabel', 'Zutatname', 'Ingredient name');
  add('party.ingAmountLabel', 'Menge', 'Amount');
  add('party.ingUnitLabel', 'Einheit', 'Unit');
  add('party.createInvalidMsg', 'Bitte einen Namen und mindestens eine Zutat mit Menge > 0 angeben.', 'Please enter a name and at least one ingredient with an amount > 0.');
  add('party.createdMsg', '„{name}“ wurde angelegt.', '"{name}" was created.');
  add('party.defaultUnit', 'g', 'g');
  add('party.infoBtnLabel', 'Zutaten von „{name}“ ein-/ausblenden', 'Show/hide ingredients for "{name}"');
  add('btn.partyReset', 'Alle zurücksetzen', 'Reset all');
  add('hint.partyReset', 'Setzt nur die Stückzahlen zurück: deine eigenen Pizzen bleiben erhalten.', 'Only resets the quantities: your custom pizzas stay saved.');
  add('party.resetMsg', 'Alle Stückzahlen wurden zurückgesetzt.', 'All quantities have been reset.');

  // ---- js/print.js: Einkaufsliste (Druckansicht) --------------------------------
  add('print.title', '🛒 Einkaufsliste', '🛒 Shopping list');
  add('print.flour', 'Mehl', 'Flour');
  add('print.water', 'Wasser', 'Water');
  add('print.salt', 'Salz', 'Salt');
  add('print.yeast', 'Hefe', 'Yeast');
  add('print.oil', 'Olivenöl', 'Olive oil');
  add('print.sugar', 'Zucker', 'Sugar');
  add('print.ice', 'Eis (für Schüttwasser)', 'Ice (for mixing water)');
  add('print.totalDough', 'Gesamtteig', 'Total dough');

  // ---- js/pdf.js: nur die wenigen Strings, die NICHT bereits per DOM aus guide.js
  // kommen (der Rest wird 1:1 aus dem bereits übersetzten, gerenderten Anleitungs-DOM
  // gelesen: s. Kommentar in js/pdf.js) --------------------------------------------
  add('pdf.tipPrefix', 'Tipp: ', 'Tip: ');
  add('pdf.warnPrefix', 'Achtung: ', 'Note: ');
  add('pdf.notCalculatedYet', 'Noch keine Anleitung berechnet.', 'No guide calculated yet.');
  add('pdf.savedMsg', 'Anleitung als PDF gespeichert.', 'Guide saved as PDF.');

  // ---- js/timer.js: Gärzeit-Timer/Wecker + .ics-Kalendertext --------------------
  add('timer.done', '🔔 Fertig!', '🔔 Done!');
  add('timer.reset', 'Zurücksetzen', 'Reset');
  // Aufgeteilt (statt eines Templates mit {clock}), weil der Countdown-Wert live per
  // JS in einem eigenen <span class="timerclock-val"> aktualisiert wird (s. js/timer.js
  // startTick()): das Template darf dieses Element nicht "flach" interpolieren.
  add('timer.remaining.prefix', '⏳ ', '⏳ ');
  add('timer.remaining.suffix', ' verbleibend', ' remaining');
  add('timer.cancel', 'Abbrechen', 'Cancel');
  add('timer.start', '⏰ Timer starten ({dur})', '⏰ Start timer ({dur})');
  add('timer.hint', 'ℹ️ Der Timer läuft nur, solange dieser Tab/dieses Fenster geöffnet ist: kein Wecker mehr, wenn du den Tab schließt.',
    'ℹ️ The timer only runs while this tab/window stays open: no alarm anymore once you close the tab.');
  add('timer.notificationTitle', '⏰ Timer fertig', '⏰ Timer done');
  add('timer.androidBtn', '📱 Android-Wecker stellen', '📱 Set Android alarm');
  add('timer.icsBtn', '📅 Kalender-Erinnerung', '📅 Calendar reminder');
  add('timer.hint.android', 'Öffnet die Uhr-App mit vorausgefülltem Timer (Chrome): oder lade alternativ eine Kalender-Erinnerung herunter.',
    'Opens the clock app with a pre-filled timer (Chrome): or download a calendar reminder instead.');
  add('timer.hint.ios', 'iOS bietet keine Web-Schnittstelle für System-Timer: lade stattdessen eine Kalender-Erinnerung herunter (öffnet die Kalender-App mit Alarm zur richtigen Zeit).',
    'iOS has no web interface for system timers: download a calendar reminder instead (opens the calendar app with an alert at the right time).');
  add('timer.androidDefaultLabel', 'Pizza-Teig', 'Pizza dough');
  add('timer.icsDefaultLabel', 'Pizza-Timer', 'Pizza timer');
  add('timer.icsSummaryPrefix', '🍕 ', '🍕 ');
  add('timer.icsDescription', 'Erinnerung vom Teigmeister: {label} ist fertig.', 'Reminder from Teigmeister: {label} is done.');
  add('timer.notifyDefaultLabel', 'Timer', 'Timer');

  // ---- js/ui.js: aria-valuetext-Einheiten, Methode-Hinweise, Zeitplan-Labels ------
  add('unit.balls', 'Teiglinge', 'dough balls');
  add('unit.grams', 'Gramm', 'grams');
  add('unit.percentHyd', 'Prozent Hydration', 'percent hydration');
  add('unit.percentSalt', 'Prozent Salz', 'percent salt');
  add('unit.percentOil', 'Prozent Olivenöl', 'percent olive oil');
  add('unit.percentSugar', 'Prozent Zucker', 'percent sugar');
  add('unit.percentPref', 'Prozent Mehl im Vorteig', 'percent flour in the pre-ferment');
  add('unit.percentBhyd', 'Prozent Biga-Hydration', 'percent biga hydration');
  add('unit.percentYeast', 'Prozent Hefe', 'percent yeast');
  add('unit.celsiusDdt', 'Grad Celsius Teigtemperatur', 'degrees Celsius dough temperature');
  add('unit.celsiusRoom', 'Grad Celsius Raumtemperatur', 'degrees Celsius room temperature');
  add('unit.celsiusFlourTemp', 'Grad Celsius Mehltemperatur', 'degrees Celsius flour temperature');

  add('hint.method.direct', 'Direkt: alle Zutaten auf einmal. Einfachster Weg.', 'Direct: all ingredients at once. The simplest way.');
  add('hint.method.biga', 'Biga: steifer Vorteig (17 h bei 16–18 °C oder 48 h kalt). Mehr Aroma &amp; Struktur.', 'Biga: stiff pre-ferment (17 h at 16–18 °C or 48 h cold). More flavor &amp; structure.');
  add('hint.method.poolish', 'Poolish: flüssiger Vorteig 1:1 (10 h warm oder 24 h kalt). Milder, dehnbarer Teig.', 'Poolish: liquid 1:1 pre-ferment (10 h warm or 24 h cold). Milder, more extensible dough.');
  add('hint.yeast.pref', 'Wird von der <b>Vorteig-Reife</b> oben gesetzt. Feintuning per Regler möglich.', 'Set by the <b>pre-ferment maturity</b> above. Fine-tune with the slider if needed.');
  add('hint.yeast.normal', 'Prozent bezogen auf Frischhefe. Lange/warme Gare = weniger.', 'Percent based on fresh yeast. Longer/warmer rise = less.');
  add('label.prefTitle.biga', 'Biga (Vortag)', 'Biga (day before)');
  add('label.prefTitle.poolish', 'Poolish (Vortag)', 'Poolish (day before)');
  add('hint.pref.biga', 'Biga klassisch: 70–100 % des Mehls.', 'Classic biga: 70–100 % of the flour.');
  add('hint.pref.poolish', 'Poolish: meist 20–50 % des Mehls (Wasser 1:1 dazu), unsere Rezepte nutzen bewusst 66 % (kompletter 100-%-Poolish-Aufbau). Mehr als die Hydration-% geht nicht: sonst wäre mehr Wasser im Poolish als im ganzen Teig.',
    'Poolish: usually 20–50 % of the flour (water 1:1 with it), our recipes deliberately use 66 % (a full 100 % poolish build). Can\'t go higher than the hydration %: otherwise the poolish would hold more water than the whole dough.');
  add('label.timeMode.start', 'Startzeitpunkt', 'Start time');
  add('label.timeMode.target', 'Soll fertig sein um', 'Should be ready at');
  add('hint.timeMode.start', 'Die Anleitung rechnet vorwärts und zeigt, wann die Pizza fertig ist.', 'The guide calculates forward and shows when the pizza will be ready.');
  add('hint.timeMode.target', 'Die Anleitung rechnet rückwärts und sagt dir, wann du anfangen musst.', 'The guide calculates backward and tells you when to start.');

  // ---- js/flour.js: Mehl-Dropdown: "dur"-Anzeige-Text je Mehl (Namen/Gruppen sind
  // Markennamen und bleiben unübersetzt, s. Kommentar in js/flour.js) ----------------
  add('flour.dur.upTo48h', 'bis 48 h', 'up to 48 h');
  add('flour.dur.24to48h', '24–48 h', '24–48 h');
  add('flour.dur.24hTo72hPlus', '24 h – 72 h+', '24 h – 72 h+');
  add('flour.dur.upTo72hPlus', 'bis 72 h+', 'up to 72 h+');
  add('flour.dur.72hPlus', '72 h+', '72 h+');
  add('flour.dur.24to72h', '24–72 h', '24–72 h');
  add('flour.dur.upTo24h', 'bis 24 h', 'up to 24 h');
  add('flour.dur.upTo72h', 'bis 72 h', 'up to 72 h');

  // ---- js/presets.js: Preset-Beschreibungen + Ladehinweis ------------------------
  add('preset.defaultDesc', 'Wähle ein erprobtes Rezept: alle Werte werden automatisch gesetzt. Danach kannst du jederzeit feinjustieren.',
    'Choose a proven recipe: all values are set automatically. You can fine-tune anytime afterwards.');
  // v4.27.0 (Temperaturskalierung der Gärzeit, s. pizza-rechner-KONTEXT.md): die "~X h"-
  // Zeitangaben in den Dropdown-Labels (option.napoliKlassisch usw.) sind an der
  // Referenz-Raumtemperatur 21 °C gemessen (s. Sektion 33 in tests/test.html). Bei
  // anderer eingestellter Raumtemperatur passt die Schritt-für-Schritt-Anleitung unten
  // die tatsächliche Zeit automatisch an -- das Label selbst bleibt der ~21-°C-Richtwert.
  add('preset.tempNote', 'Die „~X h"-Zeitangaben oben gelten für 21 °C Raumtemperatur. Bei anderer Raumtemperatur passt die Schritt-für-Schritt-Anleitung die tatsächlichen Zeiten automatisch an.',
    'The "~X h" times above apply at 21 °C room temperature. At a different room temperature, the step-by-step guide automatically adapts the actual times.');
  // v4.25.1: AVPN-Aussage entschärft (Nutzer-Quellenprüfung gegen das offizielle
  // Disciplinare: nur Mehl/Wasser/Salz/Hefe, kein Öl) und die Gesamtgare-Angabe aus der
  // laufenden App nachgemessen (headless, PZ.calc() auf den echten Preset-Werten:
  // 27,62 h → ~28 h) statt der bisherigen geschätzten "~24 h". Öl bleibt im Rezept
  // unverändert, nur die Beschreibung ist jetzt korrekt: das Öl ist eine Abweichung von
  // der AVPN-Zutatenliste, nicht Teil davon. S. pizza-rechner-KONTEXT.md.
  add('preset.napoliKlassisch.desc', 'An den AVPN-Standard angelehnt: 60 % Hydration, Tipo 00. Das Olivenöl (2 %) ist eine bewusste Abweichung: die offizielle AVPN-Zutatenliste kennt nur Mehl, Wasser, Salz und Hefe (mehr dazu im Glossar „Echte neapolitanische Pizza (AVPN)“). ~28 h Gesamtgare, wenig Hefe, klassischer Geschmack.',
    'Inspired by the AVPN standard: 60 % hydration, Tipo 00. The olive oil (2 %) is a deliberate deviation: the official AVPN ingredient list only includes flour, water, salt and yeast (more in the glossary entry “True Neapolitan pizza (AVPN)”). ~28 h total rise, little yeast, classic flavor.');
  // v4.25.1: Gesamtgare aus der Berechnung nachgemessen (44,62 h → ~45 h) statt der
  // bisherigen geschätzten "~48 h" -- das lag sogar UNTER dem im Options-Label
  // versprochenen Minimum von 48 h. Teigwerte unverändert.
  add('preset.napoliKalt.desc', 'Lange Kaltgare: ~45 h insgesamt, der Großteil davon im Kühlschrank (4 °C), 2 % Olivenöl. Sehr wenig Hefe, maximales Aroma. Braucht ein starkes Mehl (W300+).',
    'Long cold rise: ~45 h in total, most of it in the fridge (4 °C), 2 % olive oil. Very little yeast, maximum flavor. Needs a strong flour (W300+).');
  add('preset.schnell.desc', 'Gleicher Tag: ~2 h Stockgare + 2–3 h Stückgare bei warmer Raumtemp (24–26 °C), 2 % Olivenöl. Mehr Hefe, weniger Aroma: aber spontan.',
    'Same day: ~2 h bulk rise + 2–3 h final proof at warm room temp (24–26 °C), 2 % olive oil. More yeast, less flavor: but spontaneous.');
  // Bewusst PLAIN "&" (nicht "&amp;") in allen drei descKey-Einträgen unten:
  // presets.js setzt sie per `$('presetDesc').textContent = ...`: textContent
  // dekodiert KEINE HTML-Entities, ein "&amp;" würde also buchstäblich als
  // "&amp;" auf dem Bildschirm erscheinen (Nebenbefund-Fix: derselbe Fehler
  // steckte bereits im deutschen Original-String vor dieser Umstellung).
  add('preset.napoliBigaKlassisch.desc', '100 % Biga (steifer Vorteig, 50 % Hydration), 17 h bei 16–18 °C reifen lassen. Dann Hauptteig mit Restwasser, Salz & 2 % Öl: ~29 h Gesamtreife. Kräftige, nussige Röstaromen, sehr offene Krume.',
    '100 % biga (stiff pre-ferment, 50 % hydration), let it rise 17 h at 16–18 °C. Then final dough with remaining water, salt & 2 % oil: ~29 h total rise. Rich, nutty roasted flavor, very open crumb.');
  add('preset.napoliBigaKalt.desc', '100 % Biga (steifer Vorteig, 50 % Hydration), 2 h anspringen lassen, dann 48 h im Kühlschrank. Dann Hauptteig mit Restwasser, Salz & 2 % Öl: ~60 h Gesamtreife. Noch mehr Aroma durch die kühlere, längere Führung.',
    '100 % biga (stiff pre-ferment, 50 % hydration), let it start for 2 h, then 48 h in the fridge. Then final dough with remaining water, salt & 2 % oil: ~60 h total rise. Even more flavor from the cooler, longer route.');
  add('preset.napoliPoolishSchnell.desc', 'Poolish (flüssig 1:1) mit 66 % des Mehls, 10 h durchgehend bei Raumtemp. Dann Hauptteig (mit 2 % Öl): ~20 h Gesamtreife. Milder, luftiger Teig, die schnellere der beiden Poolish-Varianten.',
    'Poolish (liquid 1:1) with 66 % of the flour, 10 h entirely at room temp. Then final dough (with 2 % oil): ~20 h total rise. Milder, airier dough, the faster of the two poolish variants.');
  add('preset.napoliPoolishKalt.desc', 'Poolish (flüssig 1:1) mit 66 % des Mehls, 1 h Raumtemp anspringen, dann 24 h Kühlschrank. Dann Hauptteig (mit 2 % Öl): ~34 h Gesamtreife. Milder, luftiger Teig, mehr Aroma durch die kühlere Führung.',
    'Poolish (liquid 1:1) with 66 % of the flour, 1 h at room temp to start, then 24 h in the fridge. Then final dough (with 2 % oil): ~34 h total rise. Milder, airier dough, more flavor from the cooler route.');
  // v4.26.0: Öl 4 % -> 2,5 % (drei unabhängige Quellen bei 2,5 %, keine bei 4 %, aus
  // Quellen abgeleitet, s. pizza-rechner-KONTEXT.md). v4.28.0: Hefe 0,3 % -> 0,45 % +
  // scheduleOverride, Gesamtgare-Zeitangabe ~30 h -> ~76 h (aus Quellen abgeleitet, mit
  // dem Hinweis dass zwei der drei Quellen möglicherweise gemeinsamen Ursprungs sind,
  // s. pizza-rechner-KONTEXT.md).
  add('preset.teglia.desc', 'Römische Blechpizza: 75 % Hydration, 2,5 % Olivenöl, sehr lockere Krume. Teig ist klebrig: mit Stretch & Fold statt langem Kneten arbeiten. ~76 h kühl. Braucht sehr starkes Mehl (W330+).',
    'Roman pan pizza: 75 % hydration, 2.5 % olive oil, very airy crumb. The dough is sticky: work with stretch & fold instead of long kneading. ~76 h cold. Needs a very strong flour (W330+).');
  // v4.26.0: Öl 3 % -> 1,5 % und Zucker 2 % -> 1 % (Feeling Foodish fährt exakt diese
  // Werte, aus Quellen abgeleitet, s. pizza-rechner-KONTEXT.md). v4.28.0: Hefe 0,2 % ->
  // 1,2 % + scheduleOverride, Gesamtgare-Zeitangabe ~28 h -> ~44 h (Hefemenge durch
  // Feeling Foodish belegt, die konkrete Gesamtdauer ist eine bewusste Wahl aus einer
  // breiten Quellenspanne, s. pizza-rechner-KONTEXT.md).
  add('preset.newyorkStyle.desc', 'New York Style: 62 % Hydration, 1,5 % Öl, 1 % Zucker (Bräunung & Hefeaktivität): größere, dünnere Teiglinge. ~44 h Kaltgare für Aroma & knusprig-zähe Kruste. Braucht ein mittelstarkes Mehl (W300+).',
    'New York style: 62 % hydration, 1.5 % oil, 1 % sugar (browning & yeast activity): larger, thinner dough balls. ~44 h cold rise for flavor & a crispy-chewy crust. Needs a medium-strong flour (W300+).');
  add('preset.customRecipeLoaded', 'Eigenes Rezept „{name}“ geladen: Werte wurden übernommen.', 'Custom recipe "{name}" loaded: values have been applied.');

  // ---- js/newrecipe.js: Live-Meldung nach dem Anlegen ----------------------------
  add('newrecipe.createdMsg', '„{name}“ wurde angelegt: zu finden in „Meine Rezepte“ und im Presets-Dropdown unter „Eigene Rezepte“. Die aktuelle Berechnung oben bleibt unverändert.',
    '"{name}" has been created: you\'ll find it under "My recipes" and in the presets dropdown under "Custom recipes". The calculation above remains unchanged.');

  // ---- js/main.js: Rezepte-Verwaltung (Prompt/Confirm/Live-Meldungen) ------------
  add('main.saved', '✓ Gespeichert', '✓ Saved');
  add('main.duplicated', '✓ Kopiert', '✓ Duplicated');
  add('main.renamePrompt', 'Neuer Name für dieses Rezept:', 'New name for this recipe:');
  add('main.deleteConfirm', '„{name}“ wirklich löschen?', 'Really delete "{name}"?');
  add('main.recipeFallbackName', 'Rezept', 'Recipe');
  add('main.noRecipesToExport', 'Noch keine gespeicherten Rezepte zum Sichern vorhanden.', 'No saved recipes to back up yet.');
  add('main.exportedOne', '1 Rezept als Datei gesichert.', '1 recipe backed up as a file.');
  add('main.exportedMany', '{n} Rezepte als Datei gesichert.', '{n} recipes backed up as a file.');
  add('main.noValidRecipesFound', 'Keine gültigen Rezepte in dieser Datei gefunden.', 'No valid recipes found in this file.');
  add('main.importedOne', '1 Rezept importiert.', '1 recipe imported.');
  add('main.importedMany', '{n} Rezepte importiert.', '{n} recipes imported.');
  add('main.skippedSuffix', ' {n} übersprungen (ungültig).', ' {n} skipped (invalid).');
  add('main.importFailedFormat', 'Import fehlgeschlagen: Datei ist kein gültiges Rezepte-Backup.', 'Import failed: file is not a valid recipe backup.');
  add('main.importFailedRead', 'Import fehlgeschlagen: Datei konnte nicht gelesen werden.', 'Import failed: file could not be read.');

  // ---- js/share.js: Teilen-Link-Feedback -----------------------------------------
  add('share.linkCopied', 'Link kopiert!', 'Link copied!');
  add('share.copyFailed', 'Kopieren fehlgeschlagen', 'Copy failed');

  // ======================================================================
  // Statische HTML-Oberfläche (pizza-rechner.html / pizza-rechner-mobile.html):
  // beide Seiten teilen sich (bis auf Layout-Struktur) fast identischen Text,
  // deshalb EIN gemeinsames Set an Keys für beide.
  // ======================================================================

  // -- Kopf / Navigation ------------------------------------------------------------
  add('app.title', 'Teigmeister', 'Teigmeister');
  add('nav.menuOpen', 'Menü öffnen', 'Open menu');
  add('nav.menuClose', 'Menü schließen', 'Close menu');
  add('nav.areasDialogLabel', 'Bereiche auswählen', 'Select area');
  add('nav.areasTitle', 'Bereiche', 'Areas');
  add('nav.rechner', 'Rechner', 'Calculator');
  add('nav.rezepte', 'Rezepte', 'Recipes');
  add('nav.zeitplan', 'Zeitplan', 'Schedule');
  add('nav.party', 'Pizza Party', 'Pizza Party');
  add('nav.glossar', 'Glossar', 'Glossary');
  add('nav.einstellungen', 'Einstellungen', 'Settings');
  add('nav.onboarding', 'Rundgang starten', 'Start tour');
  add('nav.group.dough', 'Teig-Rechner', 'Dough calculator');
  add('nav.group.party', 'Pizza Party', 'Pizza Party');
  add('nav.toMobile', 'Zur Mobil-Ansicht', 'Switch to mobile view');
  add('nav.toDesktop', 'Zur Desktop-Ansicht', 'Switch to desktop view');
  add('nav.viewAnnounce', 'Ansicht: {label}', 'View: {label}');

  // -- Willkommens-Screen / Einführung (v3.63.0, js/onboarding.js) --------------------
  add('onboarding.title', 'Willkommen Teigmeister', 'Welcome to Teigmeister');
  add('onboarding.intro', 'So findest du dich schnell zurecht:', 'Here’s how to get started quickly:');
  add('onboarding.feature.presets.title', 'Fertige Rezepte', 'Ready-made recipes');
  add('onboarding.feature.presets.text',
    'Wähle ein erprobtes Rezept aus dem Dropdown: alle Werte werden automatisch passend gesetzt. Danach kannst du jederzeit feinjustieren.',
    'Pick a proven recipe from the dropdown: all values are set automatically. You can fine-tune anything afterwards.');
  add('onboarding.feature.advanced.title', 'Alles anpassbar', 'Fully customizable');
  add('onboarding.feature.advanced.text',
    'Die Rechner-Seite zeigt zunächst nur die wichtigsten Regler. Über „Erweiterten Modus öffnen“ bekommst du Zugriff auf jedes Detail: Hydration, Salz, Vorteig-Verfahren, Temperaturen &amp; mehr.',
    'The calculator page starts out showing only the most important sliders. Use “Open advanced mode” to access every detail: hydration, salt, pre-ferment method, temperatures &amp; more.');
  add('onboarding.feature.schedule.title', 'Zeitplan', 'Schedule');
  add('onboarding.feature.schedule.text',
    'Gib an, wann du starten möchtest oder wann die Pizza fertig sein soll: die App rechnet rückwärts und zeigt jeden Schritt mit passender Uhrzeit.',
    'Enter when you want to start, or when the pizza should be ready: the app calculates backwards and shows every step with a matching time.');
  add('onboarding.feature.guide.title', 'Anleitung &amp; Timer', 'Guide &amp; timers');
  add('onboarding.feature.guide.text',
    'Eine Schritt-für-Schritt-Anleitung mit Countdown-Timern führt dich von den Zutaten bis zum fertigen Teig: inklusive Warnung, falls Gärzeit und Mehl nicht zusammenpassen.',
    'A step-by-step guide with countdown timers walks you from ingredients to finished dough: including a warning if the rise time and flour don’t match.');
  add('onboarding.feature.party.title', 'Pizza Party', 'Pizza Party');
  add('onboarding.feature.party.text',
    'Plane eine Pizza-Party: Wähle Pizzen mit Stückzahl aus, die App berechnet automatisch eine ungefähre Zutatenliste für alle zusammen.',
    'Plan a pizza party: choose pizzas with quantities, and the app automatically calculates an approximate ingredient list for everyone.');
  add('onboarding.settingsHint',
    'Tipp: Zusatzfunktionen (Sprache, Darstellung, Timer &amp; mehr) findest du im Menü unter „Einstellungen“, und den „Erweiterten Modus“ für alle Detail-Regler über den gleichnamigen Button auf der Rechner-Seite.',
    'Tip: find extra features (language, appearance, timers &amp; more) in the menu under “Settings”, and “Advanced mode” for every detail slider via the button on the calculator page.');
  add('onboarding.dontShowAgain', 'Beim nächsten Start nicht mehr anzeigen', 'Don’t show this again on next launch');
  add('onboarding.cta', 'Los geht’s', 'Let’s go');

  // -- Card: Fertiges Rezept wählen --------------------------------------------------
  add('card.preset.title', 'Fertiges Rezept wählen', 'Choose a ready-made recipe');
  add('card.preset.selectLabel', 'Fertiges Rezept auswählen', 'Select a ready-made recipe');
  add('option.preset.none', 'Kein Rezept ausgewählt', 'No recipe selected');
  add('optgroup.napoliDirect', 'Neapolitanisch · Direkt', 'Neapolitan · Direct');
  add('optgroup.napoliPref', 'Neapolitanisch · Vorteig', 'Neapolitan · Pre-ferment');
  add('optgroup.otherStyles', 'Andere Stile', 'Other styles');
  add('optgroup.customRecipes', 'Eigene Rezepte', 'Custom recipes');
  // Rezeptwahl führen (v3.71.0): einheitliches Namensschema für alle verbleibenden
  // Presets -- immer "Name · Gärzeit" (gleiches Trennzeichen "·", gleiche Position der
  // Zusatzinfo). Vorher uneinheitlich: "schnell" und "newyorkStyle" hatten zusätzlich
  // eine Besonderheit VOR/NEBEN der Dauer eingestreut (z. B. "· Zucker & Öl, ~26 h"),
  // "teglia" hatte statt einer Dauer eine Hydrationsangabe. Jetzt durchgängig nur noch
  // die Gärzeit (die Besonderheiten stehen weiterhin ausführlich in presetDesc/
  // *.desc-Keys, hier geht es nur um die kurze Dropdown-Beschriftung).
  // v4.25.1: "(AVPN)" aus dem kurzen Dropdown-Label entfernt -- das Preset behält 2 % Öl,
  // das offizielle AVPN-Disciplinare kennt aber kein Öl, ein nacktes "(AVPN)" wäre hier
  // eine nicht haltbare Konformitätsbehauptung ohne Platz für die nötige Nuance (die steht
  // jetzt in preset.napoliKlassisch.desc). Beide Gärzeiten aus der Berechnung nachgemessen
  // (27,62 h → ~28 h; 44,62 h → ~45 h, lag vorher sogar UNTER dem versprochenen
  // 48-h-Minimum) statt der bisherigen geschätzten Werte. Teigwerte unverändert.
  add('option.napoliKlassisch', 'Napoli Klassisch · ~28 h', 'Napoli Classic · ~28 h');
  add('option.napoliKalt', 'Napoli Lange Kaltgare · ~45 h', 'Napoli Long Cold Rise · ~45 h');
  // schnell: real gemessen 5,37 h liegt bereits innerhalb "4–6 h", keine Änderung nötig.
  add('option.schnell', 'Schnell · 4–6 h', 'Quick · 4–6 h');
  add('option.napoliBigaKlassisch', 'Napoli mit Biga (klassisch) · ~29 h', 'Napoli with Biga (classic) · ~29 h');
  add('option.napoliBigaKalt', 'Napoli mit Biga (kalt) · ~60 h', 'Napoli with Biga (cold) · ~60 h');
  add('option.napoliPoolishSchnell', 'Napoli mit Poolish (schnell) · ~20 h', 'Napoli with Poolish (fast) · ~20 h');
  add('option.napoliPoolishKalt', 'Napoli mit Poolish (kalt) · ~34 h', 'Napoli with Poolish (cold) · ~34 h');
  // v4.25.1: beide Gärzeiten aus der Berechnung nachgemessen (29,53 h → ~30 h;
  // 27,75 h → ~28 h) statt der bisherigen geschätzten Werte. Teigwerte unverändert.
  add('option.teglia', 'Teglia / Blech · ~76 h', 'Teglia / Pan · ~76 h');
  add('option.newyorkStyle', 'New York Style · ~44 h', 'New York Style · ~44 h');

  // Drei Empfehlungskarten (v3.71.0, "Rezeptwahl führen"): Schnell/Klassisch/Lang zeigen
  // Name, Gärzeit und eine kurze Eignung, bevor die volle Preset-Liste (jetzt hinter
  // "Alle Rezepte" eingeklappt) sichtbar wird.
  add('preset.recommend.groupLabel', 'Empfohlene Rezepte', 'Recommended recipes');
  add('preset.recommend.schnell.name', 'Schnell', 'Quick');
  add('preset.recommend.schnell.time', '4–6 h', '4–6 h');
  add('preset.recommend.schnell.fit', 'Für spontane Pizza am selben Tag', 'For spontaneous pizza the same day');
  // accessibility-expert-Befund (v3.71.0, MAJOR 1): der Accessible Name der drei
  // preset-card-Buttons war bisher nur die kommentarlose Aneinanderreihung von
  // Name+Zeit+Eignung ohne Trennzeichen (z. B. "Schnell 4–6 h Für spontane Pizza am
  // selben Tag") -- eigene aria-label-Texte mit Doppelpunkt/Komma-Struktur ergänzt.
  add('preset.recommend.schnell.ariaLabel', 'Schnell: 4–6 h Gärzeit, für spontane Pizza am selben Tag',
    'Quick: 4–6 h rise time, for spontaneous pizza the same day');
  // v4.25.1: "(AVPN)" als nackte Konformitätsbehauptung entschärft (das Preset behält
  // 2 % Öl, das AVPN-Disciplinare kennt kein Öl) und die Gärzeit aus der Berechnung
  // nachgemessen (27,62 h → ~28 h statt der bisherigen geschätzten "24 h"). Teigwerte
  // unverändert, s. preset.napoliKlassisch.desc oben für die ausführliche Erklärung.
  add('preset.recommend.klassisch.name', 'Klassisch', 'Classic');
  add('preset.recommend.klassisch.time', '~28 h', '~28 h');
  add('preset.recommend.klassisch.fit', 'An den AVPN-Standard angelehnter neapolitanischer Klassiker', 'Neapolitan classic, inspired by the AVPN standard');
  add('preset.recommend.klassisch.ariaLabel', 'Klassisch: ~28 h Gärzeit, an den AVPN-Standard angelehnter neapolitanischer Klassiker',
    'Classic: ~28 h rise time, Neapolitan classic inspired by the AVPN standard');
  // v4.25.1: Gärzeit aus der Berechnung nachgemessen (44,62 h → ~45 h) statt der
  // bisherigen geschätzten "48–72 h" -- die lag sogar UNTER dem versprochenen Minimum.
  add('preset.recommend.lang.name', 'Lang', 'Long');
  add('preset.recommend.lang.time', '~45 h', '~45 h');
  add('preset.recommend.lang.fit', 'Maximales Aroma, braucht starkes Mehl (W300+)', 'Maximum flavor, needs a strong flour (W300+)');
  add('preset.recommend.lang.ariaLabel', 'Lang: ~45 h Gärzeit, maximales Aroma, braucht starkes Mehl (W300+)',
    'Long: ~45 h rise time, maximum flavor, needs a strong flour (W300+)');
  add('preset.allRecipes', 'Alle Rezepte', 'All recipes');

  // -- Card: Einfacher Modus (v3.62.0) -------------------------------------------------
  // Reduzierte Karte, die im Einfachen Modus die 3 Kernfelder Anzahl-Teiglinge/
  // Hefe-Art/Knetart aufnimmt (js/simplemode.js verschiebt die bestehenden Feld-
  // Elemente per DOM-Reparenting hierher). Eigene Labels/Hints der 3 Felder selbst
  // sind bereits unter card.basics/card.method/card.temp abgedeckt (s. u.) --
  // hier nur Karten-Titel, Erklärtext und die beiden Umschalt-Buttons.
  add('card.simple.title', 'Deine Einstellungen', 'Your settings');
  // Komplexität staffeln (v3.72.0): Hinweistext verweist jetzt auf den Segmentschalter
  // oben ("Profi") statt auf den entfernten Button "Erweiterten Modus öffnen".
  add('hint.simpleMode', 'Für alle Details (Hydration, Salz, Vorteig-Verfahren, Temperaturen &amp; mehr) oben auf „Profi" wechseln.',
    'Switch to "Profi" above for all the details (hydration, salt, pre-ferment method, temperatures &amp; more).');
  add('simpleMode.announceSimple', 'Einfacher Modus aktiv.', 'Simple mode active.');
  add('simpleMode.announceAdvanced', 'Erweiterter Modus aktiv.', 'Advanced mode active.');
  // Segmentschalter "Einfach | Profi" (v3.72.0): dauerhaft sichtbar ganz oben in
  // #controlsCol, ersetzt die beiden vorherigen, sich gegenseitig ein-/ausblendenden
  // Umschalt-Buttons (btn.openAdvancedMode/btn.openSimpleMode, entfernt).
  add('modeToggle.groupLabel', 'Komplexitätsstufe', 'Complexity level');
  add('modeToggle.simple', 'Einfach', 'Simple');
  add('modeToggle.profi', 'Profi', 'Pro');

  // -- Card: Grundeinstellungen ------------------------------------------------------
  add('card.basics.title', 'Grundeinstellungen', 'Basic settings');
  add('label.flour', 'Mehl', 'Flour');
  add('hint.flour', 'W-Wert = Glutenstärke. Schwaches Mehl verträgt keine langen Gärzeiten: sehr starkes Mehl braucht sie. Wird per Preset mitgesetzt.',
    'W value = gluten strength. Weak flour can\'t handle long rise times: very strong flour needs them. Set automatically by presets.');
  // Mengensteuerung vereinfachen (v3.70.0): generische Stepper-Button-Beschriftungen,
  // wiederverwendet über alle 6 Stepper-Felder hinweg (aria-label allein, kein
  // sichtbarer Text -- die umgebende role="group"/aria-labelledby liefert den
  // Feldkontext, s. js/ui.js + pizza-rechner.html/-mobile.html).
  add('stepper.decrease', 'Verringern', 'Decrease');
  add('stepper.increase', 'Erhöhen', 'Increase');
  add('label.balls', 'Anzahl Teiglinge', 'Number of dough balls');
  add('label.ballw', 'Gewicht pro Teigling', 'Weight per dough ball');
  add('pill.mini180', 'Mini 180', 'Mini 180');
  add('pill.napoli250', 'Napoli 250', 'Napoli 250');
  add('pill.napoliXl280', 'Napoli XL 280', 'Napoli XL 280');
  add('pill.teglia320', 'Teglia 320', 'Teglia 320');
  add('label.hyd', 'Hydration (Wasser)', 'Hydration (water)');
  add('hint.hyd', 'Anfänger 60–62 % · Klassisch Napoli 65 % · Profi 68–70 %+', 'Beginner 60–62% · Classic Napoli 65% · Pro 68–70%+');
  add('label.salt', 'Salz', 'Salt');
  add('hint.salt', 'Napoli-Standard: 2,5–3 % (≈ 50–55 g/L Wasser)', 'Napoli standard: 2.5–3% (≈ 50–55 g/L water)');
  add('label.oil', 'Olivenöl', 'Olive oil');
  add('hint.oil', 'Macht den Teig geschmeidiger &amp; fördert die Bräunung. Klassisch Napoli 0 %, mit Öl 1–3 %, Blech/Teglia 3–5 %. Kommt spät zum Teig: nach dem Salz.',
    'Makes the dough more supple &amp; promotes browning. Classic Napoli 0%, with oil 1–3%, pan/teglia 3–5%. Added late: after the salt.');
  add('label.sugar', 'Zucker', 'Sugar');
  add('hint.sugar', 'New-York-Style: unterstützt die Hefeaktivität &amp; die Krustenbräunung. Wird früh zugegeben (mit Mehl/Wasser/Hefe), nicht spät wie Öl.',
    'New York style: supports yeast activity &amp; crust browning. Added early (with flour/water/yeast), not late like oil.');
  // Backlog Punkt J (MINOR-Nebenbefund, v4.12.0): Zucker-Pills hatten bislang kein
  // aria-label -- Screenreader lasen nur den reinen Zahlentext ("0 %"/"2 %") ohne
  // Feldkontext vor. Identisches Muster wie preset.recommend.*.ariaLabel oben
  // (data-i18n-attr="aria-label:...").
  add('pill.sugar0.ariaLabel', '0 % Zucker', '0% sugar');
  add('pill.sugar2.ariaLabel', '2 % Zucker', '2% sugar');

  // -- Card: Methode & Hefe -----------------------------------------------------------
  // Bewusst PLAIN "&" statt "&amp;": diese beiden Keys werden sowohl per
  // data-i18n (textContent) ALS AUCH per data-i18n-attr (setAttribute, KEINE
  // Entity-Dekodierung!) für aria-label genutzt: mit "&amp;" würde der
  // aria-label buchstäblich "&amp;" vorlesen lassen statt "&". Ein reines "&"
  // ist in textContent/Attributwerten gleichermaßen gültig, daher hier bewusst
  // kein HTML-Entity nötig.
  add('card.method.title', 'Methode & Hefe', 'Method & yeast');
  add('label.method', 'Teigführung', 'Dough method');
  add('seg.direct', 'Direkt', 'Direct');
  add('seg.biga', 'Biga', 'Biga');
  add('seg.poolish', 'Poolish', 'Poolish');
  add('label.pref', 'Anteil Mehl im Vorteig', 'Flour share in pre-ferment');
  add('label.bhyd', 'Biga-Hydration', 'Biga hydration');
  add('hint.bhyd', 'Steife Biga: 44–54 %, meist 45–50 %. Poolish ist fix 100 % (1:1).', 'Stiff biga: 44–54%, mostly 45–50%. Poolish is fixed at 100% (1:1).');
  add('label.prefStage', 'Vorteig-Reife', 'Pre-ferment maturity');
  add('hint.prefStage', 'Reifezeit und Hefemenge hängen zusammen: die Stufe setzt beides passend. Längere Reife = weniger Hefe + kühler stellen (steht in der Anleitung).',
    'Maturity time and yeast amount are linked: the stage sets both to match. Longer maturity = less yeast + cooler storage (explained in the guide).');
  add('label.yeastType', 'Hefe-Art', 'Yeast type');
  add('seg.freshYeast', 'Frischhefe', 'Fresh yeast');
  add('seg.dryYeast', 'Trockenhefe', 'Dry yeast');
  add('label.yeast', 'Hefemenge', 'Yeast amount');
  add('pill.yeastExtremeLong', 'Extrem lang (72h+)', 'Extremely long (72h+)');
  add('pill.yeastVeryLong', 'Sehr lang (48h kühl)', 'Very long (48h cold)');
  add('pill.yeastLong', 'Lang (24h)', 'Long (24h)');
  add('pill.yeastMedium', 'Mittel (8h RT)', 'Medium (8h room temp)');
  add('pill.yeastFast', 'Schnell (4h)', 'Fast (4h)');
  add('label.yeastCoupled', '🔒 An Reifestufe gekoppelt', '🔒 Locked to maturity stage');
  add('label.coldStage', 'Wie verbringt der Teig die Kühlschrank-Zeit?', 'How does the dough spend its fridge time?');
  add('seg.coldBalls', 'Als Teiglinge (praktisch)', 'As dough balls (convenient)');
  add('seg.coldBulk', 'Im Stück (klassisch)', 'In bulk (classic)');
  add('hint.coldStage', 'Greift nur bei kühlen Führungen (24 h+). <b>Teiglinge:</b> nach 2 h formen, dann kalt: am Backtag nur noch temperieren &amp; backen. <b>Im Stück:</b> der ganze Teig gärt kalt, Formen und Stückgare erst am Backtag.',
    'Only applies to cold methods (24 h+). <b>Dough balls:</b> shape after 2 h, then cold: on baking day just bring to room temp &amp; bake. <b>In bulk:</b> the whole dough rises cold, shaping and final proof happen on baking day.');

  // -- Card: Teigtemperatur & Eiswasser ------------------------------------------------
  add('card.temp.title', 'Teigtemperatur & Eiswasser', 'Dough temperature & ice water');
  add('label.ddt', 'Ziel-Teigtemperatur', 'Target dough temperature');
  add('hint.ddt', 'Napoli-Ziel nach dem Kneten: 23–25 °C.', 'Napoli target after kneading: 23–25 °C.');
  add('label.room', 'Raumtemperatur', 'Room temperature');
  add('label.flourTemp', 'Mehltemperatur', 'Flour temperature');
  add('hint.flourTemp', 'Startet gleich der Raumtemperatur, aber unabhängig änderbar: z. B. kühler bei Mehl aus dem Keller oder Kühlschrank.',
    'Starts equal to room temperature, but can be changed independently: e.g. cooler for flour from the cellar or fridge.');
  add('label.knead', 'Knetart', 'Kneading method');
  add('seg.hand', 'Hand', 'Hand');
  add('seg.machine', 'Maschine', 'Machine');
  add('hint.knead', 'Maschine erzeugt Reibungswärme → kälteres Wasser nötig.', 'Machines generate friction heat → colder water needed.');

  // -- Ergebnis-Panel -----------------------------------------------------------------
  add('card.result.title', 'Rezept', 'Recipe');
  add('result.totalDough', 'Gesamtteig', 'Total dough');
  add('result.totalAmounts', 'Gesamtmengen', 'Total amounts');
  add('ing.flour', 'Mehl', 'Flour');
  add('ing.water', 'Wasser', 'Water');
  add('ing.salt', 'Salz', 'Salt');
  add('ing.yeast', 'Hefe', 'Yeast');
  add('ing.oil', 'Olivenöl', 'Olive oil');
  add('ing.sugar', 'Zucker', 'Sugar');
  add('ing.plusFlour', '+ Mehl', '+ Flour');
  add('ing.plusWater', '+ Wasser', '+ Water');
  add('ing.plusSalt', '+ Salz', '+ Salt');
  add('ing.plusYeast', '+ Hefe', '+ Yeast');
  add('ing.plusOil', '+ Olivenöl', '+ Olive oil');
  add('ing.plusSugar', '+ Zucker', '+ Sugar');
  add('ing.plusWholePref', '+ ganze Biga/Poolish', '+ whole biga/poolish');
  add('ing.all', 'alles', 'all of it');
  add('result.mainDough', 'Hauptteig (am Backtag)', 'Final dough (on baking day)');
  // result.waterTemp/result.mixingWater/result.iceMethodLink/result.iceMethodLinkAnnounce
  // (die separate Wassertemperatur-/Schüttwasser-Anzeige im Ergebnis-Panel inkl. bedingtem
  // Glossar-Verweis-Link, Backlog Punkt I/v4.11.0) sind seit v4.16.0 ("Schüttwasser-Anzeige
  // entfernen") ersatzlos entfernt -- der Wert bleibt weiterhin in der Schritt-für-Schritt-
  // Anleitung sichtbar (guide.step.waterTemp.* in dieser Datei), nur die redundante
  // Extra-Anzeige im Ergebnis-Panel ist weg.
  // Live-Region-Ansage (WCAG 4.1.3, Backlog Punkt J, v4.12.0): wird per PZ.announce()
  // NUR beim Neu-Erscheinen von #sugarBlock ausgelöst (nicht bei jedem calc()-Lauf).
  add('result.sugarFieldShownAnnounce', 'Neues Feld eingeblendet: Zucker.',
    'New field shown: sugar.');
  add('yeast.fresh', '(frisch)', '(fresh)');
  add('yeast.dry', '(trocken)', '(dry)');
  add('btn.save', 'Speichern', 'Save');
  add('btn.printShoppingList', 'Einkaufsliste drucken', 'Print shopping list');
  add('btn.printGuide', 'Anleitung drucken', 'Print guide');
  add('btn.savePdf', 'Als PDF speichern', 'Save as PDF');
  add('hint.savePdf', 'Lädt die Schritt-für-Schritt-Anleitung direkt als PDF-Datei herunter: ganz ohne Druckdialog.',
    'Downloads the step-by-step guide directly as a PDF file: with no print dialog.');
  add('btn.copyShareLink', 'Rezept teilen', 'Share recipe');
  add('hint.copyShareLink', 'Kopiert einen Link, der dieses Rezept komplett enthält: zum Teilen, ohne Login oder Server.',
    'Copies a link that contains this entire recipe: for sharing, no login or server needed.');
  // "Ergebnis priorisieren" (Aktionsleiste neu geordnet): primäre Aktion "Zum Zeitplan"
  // springt in den bereits berechneten Zeitplan-Tab (PZ.gotoView, wie der bestehende
  // Sprung im Anleitungs-Banner); "Weitere Optionen" ist das <summary>-Label des
  // eingeklappten Bereichs mit Speichern/Einkaufsliste/Anleitung/PDF/Temperatur.
  add('btn.goToSchedule', 'Zum Zeitplan', 'Go to schedule');
  add('btn.moreOptions', 'Weitere Optionen', 'More options');

  // -- Anleitung-Kopf -------------------------------------------------------------------
  add('guide.headTitle', 'Schritt-für-Schritt-Anleitung', 'Step-by-step guide');

  // -- Card: Meine Rezepte --------------------------------------------------------------
  add('card.myRecipes.title', 'Meine Rezepte', 'My recipes');
  add('label.savedRecipe', 'Gespeichertes Rezept', 'Saved recipe');
  add('option.noneSavedYet', '(noch keins gespeichert)', '(none saved yet)');
  add('btn.duplicate', 'Kopieren', 'Duplicate');
  add('btn.rename', 'Umbenennen', 'Rename');
  add('btn.delete', 'Löschen', 'Delete');
  add('hint.myRecipes', 'Eigene Rezepte sind unabhängig von den Presets oben: hier landen deine per „Speichern" gesicherten Stände.',
    'Custom recipes are independent from the presets above: this is where your "Save"d states end up.');
  add('btn.exportFile', 'Als Datei sichern', 'Save as file');
  add('btn.importFile', 'Aus Datei laden', 'Load from file');
  add('label.importFile', 'Backup-Datei mit Rezepten auswählen', 'Select a backup file with recipes');
  add('hint.recipeIO', 'Sichert alle gespeicherten Rezepte als Datei (z. B. vor dem Löschen von Websitedaten) oder lädt eine solche Datei wieder ein: importierte Rezepte werden ergänzt, nichts wird überschrieben.',
    'Backs up all saved recipes as a file (e.g. before clearing site data) or loads such a file back in: imported recipes are added, nothing gets overwritten.');

  // -- Card: Neues Rezept anlegen --------------------------------------------------------
  add('card.newRecipe.title', 'Neues Rezept anlegen', 'Create a new recipe');
  add('hint.newRecipe', 'Legt ein neues, eigenständiges Rezept an: die aktuelle Berechnung im Rechner-Bereich bleibt dabei unverändert. Erscheint danach in „Meine Rezepte“ und im „Fertiges Rezept wählen“-Dropdown unter „Eigene Rezepte“.',
    'Creates a new, independent recipe: the current calculation in the Calculator area stays unchanged. It then appears under "My recipes" and in the "Choose a ready-made recipe" dropdown under "Custom recipes".');
  add('heading.basics', 'Grundeinstellungen', 'Basic settings');
  add('hint.newRecipeSugar', 'Anders als im Hauptrechner (dort sichtbar ab Zucker &gt; 0) hier immer sichtbar, mit „0“ vorbefüllt und frei änderbar.',
    'Unlike the main calculator (shown there only once sugar is above 0), always visible here, pre-filled with "0" and freely editable.');
  add('heading.methodYeast', 'Methode & Hefe', 'Method & yeast');
  add('heading.tempIce', 'Teigtemperatur & Eiswasser', 'Dough temperature & ice water');
  add('label.newRecipeFullName', 'Name für das neue Rezept', 'Name for the new recipe');
  add('placeholder.newRecipeFullName', 'Name für das neue Rezept', 'Name for the new recipe');
  add('btn.createRecipe', 'Rezept anlegen', 'Create recipe');
  add('hint.createRecipe', 'Kalte Gare startet für neu angelegte Rezepte auf „Als Teiglinge (praktisch)“, Zeitplan bleibt leer: beides nach dem Laden im Rechner-Bereich änderbar.',
    'Cold rise starts as "As dough balls (convenient)" for newly created recipes, schedule stays empty: both changeable after loading in the Calculator area.');

  // -- Card: Zeitplan ---------------------------------------------------------------------
  add('card.schedule.title', 'Zeitplan', 'Schedule');
  add('label.timeReference', 'Bezugspunkt', 'Reference point');
  add('seg.timeStart', 'Ich starte um…', 'I\'m starting at…');
  add('seg.timeTarget', 'Fertig sein um…', 'Should be ready at…');
  add('btn.now', 'Jetzt', 'Now');

  // -- Card: Pizza-Glossar (v3.37.0, js/glossary.js) -----------------------------------------
  // Reihenfolge/Themenliste s. PZ.GLOSSARY_CATEGORIES in js/glossary.js. Jeder Artikel hat einen
  // .title- und einen .body-Key; body darf HTML enthalten (hier: <p>), wird per innerHTML
  // gerendert.
  add('card.glossary.title', 'Pizza-Glossar', 'Pizza glossary');
  add('hint.glossary', 'Kurze Lexikon-Artikel zu Begriffen und Hintergrundwissen rund um Pizza: zum Nachlesen, unabhängig vom Rechner.',
    'Short reference articles on pizza-related terms and background knowledge: for reading, independent of the calculator.');

  // Glossar-Gruppierung + Suche (v4.14.0): Kategorie-Zwischenüberschriften (eine je
  // PZ.GLOSSARY_CATEGORIES-Eintrag) plus Suchfeld-Label/-Platzhalter/Leer-Text.
  add('glossary.cat.basics.title', 'Mehl & Teig-Grundlagen', 'Flour & Dough Basics');
  add('glossary.cat.techniques.title', 'Techniken', 'Techniques');
  add('glossary.cat.preferments.title', 'Vorteig & Gärmethoden', 'Preferments & Fermentation Methods');
  add('glossary.cat.tools.title', 'Werkzeuge & Ausrüstung', 'Tools & Equipment');
  add('glossary.cat.ingredients.title', 'Zutaten', 'Ingredients');
  add('glossary.cat.toppings.title', 'Pizzabeläge', 'Pizza Toppings');
  add('glossary.cat.styles.title', 'Pizza-Stile', 'Pizza Styles');
  add('label.glossarySearch', 'Glossar durchsuchen', 'Search glossary');
  add('placeholder.glossarySearch', 'Suchen, z. B. Hydration, Poolish…', 'Search, e.g. hydration, poolish…');
  add('glossary.noResults', 'Keine Treffer für diesen Suchbegriff.', 'No matches for this search term.');
  // accessibility-expert-Befund (v4.14.0, BLOCKER, WCAG 4.1.3): Ansage-Texte für die
  // neue Live-Region #glossarySearchLiveMsg (js/glossary.js applyFilter()).
  add('glossary.searchResultsOne', '1 Artikel gefunden.', '1 article found.');
  add('glossary.searchResultsMany', '{n} Artikel gefunden.', '{n} articles found.');

  add('glossary.wwert.title', 'W-Wert (Mehlstärke)', 'W-value (flour strength)');
  add('glossary.wwert.body',
    '<p>Der W-Wert (auch Mehlstärke oder Alveograph-Wert genannt) beschreibt, wie viel Wasser ein Mehl aufnehmen kann und wie belastbar sein Klebergerüst (Gluten) ist. Je höher der W-Wert, desto mehr Wasser bindet das Mehl und desto länger hält der Teig eine lange, warme oder kalte Gare aus, ohne zu erschlaffen.</p><p>Schwache Mehle (W 90–180) eignen sich für kurze Gärzeiten von wenigen Stunden, starke Mehle (W 260–350+) für 24 bis 72 Stunden. Der Teigrechner nutzt den W-Wert, um bei jedem Rezept zu warnen, wenn die gewählte Gärzeit nicht zur Mehlstärke passt.</p>',
    '<p>The W-value (also called flour strength or, more precisely, the alveograph value) describes how much water a flour can absorb and how resilient its gluten structure is. The higher the W-value, the more water the flour binds and the longer the dough can withstand a long, warm or cold rise without collapsing.</p><p>Weak flours (W 90–180) suit short rises of a few hours, strong flours (W 260–350+) suit 24 to 72 hours. The dough calculator uses the W-value to warn whenever the chosen rise time doesn\'t match the flour\'s strength.</p>');

  add('glossary.tipo00.title', '00-Mehl (Tipo 00)', '00 flour (Tipo 00)');
  add('glossary.tipo00.body',
    '<p>„Tipo 00" ist keine Mehlsorte, sondern eine italienische Vermahlungsstufe: Sie gibt an, wie fein das Mehl gemahlen und wie stark Schale und Keim des Korns entfernt wurden: 00 ist die feinste, hellste Stufe (danach folgen 0, 1, 2 und Vollkorn).</p><p>Für neapolitanische Pizza wird meist ein Tipo-00-Mehl mit hohem W-Wert verwendet, weil die feine Vermahlung einen besonders geschmeidigen, elastischen Teig ergibt. Der Feinheitsgrad allein sagt aber nichts über die Stärke des Mehls aus: ein Tipo-00-Mehl kann sowohl schwach als auch sehr stark sein, das hängt vom W-Wert ab.</p>',
    '<p>"Tipo 00" isn\'t a type of flour but an Italian milling grade: it indicates how finely the flour is ground and how much of the bran and germ have been removed: 00 is the finest, whitest grade (followed by 0, 1, 2 and whole wheat).</p><p>Neapolitan pizza typically uses a Tipo 00 flour with a high W-value, since the fine grind produces an especially smooth, elastic dough. The grind alone says nothing about the flour\'s strength, though: a Tipo 00 flour can be weak or very strong, depending on its W-value.</p>');

  add('glossary.baeckerprozente.title', 'Bäckerprozente', 'Baker\'s percentage');
  add('glossary.baeckerprozente.body',
    '<p>Bäckerprozente (englisch „baker\'s percentage") sind die Fachsprache jedes Teigrezepts: Alle Zutaten werden nicht in Gramm, sondern relativ zur Mehlmenge angegeben, die immer 100 % entspricht. Ein Rezept mit „62 % Hydration, 2,8 % Salz, 0,3 % Hefe" heißt: Wasser = 62 % der Mehlmenge, Salz = 2,8 % der Mehlmenge, und so weiter.</p><p>Der Vorteil: Rezepte lassen sich verlustfrei auf jede Teigmenge skalieren, ohne jede Zutat einzeln neu umzurechnen: genau das übernimmt dieser Rechner automatisch.</p>',
    '<p>Baker\'s percentage is the professional shorthand behind every dough recipe: every ingredient is stated not in grams but relative to the flour weight, which always equals 100%. A recipe reading "62% hydration, 2.8% salt, 0.3% yeast" means water = 62% of the flour weight, salt = 2.8% of the flour weight, and so on.</p><p>The advantage: recipes scale to any dough quantity without recalculating each ingredient by hand: exactly what this calculator does automatically.</p>');

  add('glossary.hydration.title', 'Hydration', 'Hydration');
  add('glossary.hydration.body',
    '<p>Hydration ist der Wasseranteil im Teig, angegeben als Bäckerprozent (Wassermenge geteilt durch Mehlmenge). Niedrige Hydration (58–62 %) ergibt einen griffigen, leicht zu formenden Teig: ideal für Einsteiger.</p><p>Hohe Hydration (68–75 %+) ergibt einen offenporigeren, luftigeren Rand, ist aber klebriger in der Verarbeitung und verlangt oft Dehnen-und-Falten statt klassisches Kneten. Neapolitanische Pizza liegt meist bei 60–65 %, Teglia-/Blechpizza oft deutlich darüber.</p>',
    '<p>Hydration is the water content of the dough, expressed as a baker\'s percentage (water weight divided by flour weight). Low hydration (58–62%) gives a firm, easy-to-shape dough: great for beginners.</p><p>High hydration (68–75%+) produces a more open, airier crumb and crust rim, but is stickier to handle and often calls for stretch-and-fold instead of classic kneading. Neapolitan pizza usually sits around 60–65%, while pan/tray pizza (teglia) often goes noticeably higher.</p>');

  // Neuer Eintrag (v4.11.0, Backlog Punkt I): bis v4.10.0 zeigte das Ergebnis-Panel
  // Eismenge + Anwärm-Hinweistext direkt in einer eigenen "davon Eis"-Box -- seit v4.11.0
  // nur noch bei Bedarf per Verweis-Link erreichbar (#waterTempGlossaryRef, js/calc.js,
  // sichtbar unter 15 °C/59 °F). Bewusst GENERISCH gehalten (kein dynamisches Einbetten
  // des aktuellen R.ice-Werts des gerade offenen Rezepts): js/glossary.js baut die
  // gesamte Artikelliste bei jedem Sprachwechsel rein aus PZ.GLOSSARY_TOPICS + t()-Keys
  // neu auf (kein Zugriff auf PZ.R), das Glossar ist außerdem auch direkt über das Menü
  // erreichbar (nicht nur über den Verweis-Link) -- ein dort eingebetteter Live-Wert wäre
  // in dem Fall entweder veraltet oder undefiniert. Ein genereller Artikel, der Formel/
  // Vorgehen erklärt, passt außerdem zum Muster aller anderen Glossar-Einträge (auch
  // "Kalte Gare"/"Einfrieren" verweisen nie auf Werte des aktuell offenen Rezepts).
  add('glossary.eisMethode.title', 'Eis-Methode', 'Ice method');
  add('glossary.eisMethode.body',
    '<p><b>DDT</b> (aus dem Englischen „Desired Dough Temperature", Ziel-Teigtemperatur) ist die Temperatur, die der fertig geknetete Teig unmittelbar nach dem Mischen haben soll: sie steuert maßgeblich, wie schnell die Hefe danach arbeitet. Damit diese Zieltemperatur trotz unterschiedlicher Raum- und Mehltemperatur zuverlässig erreicht wird, wird gezielt die Temperatur des Schüttwassers angepasst (wärmer oder kälter als der Raum), errechnet aus DDT, Raumtemperatur, Mehltemperatur und der beim Kneten entstehenden Reibungswärme.</p><p>Leitungswasser hat dabei eine natürliche Untergrenze: in Deutschland je nach Jahreszeit meist zwischen ca. 8 und 15 °C+. Liegt die berechnete Ziel-Wassertemperatur unter dieser Grenze, reicht reines Mischen von kaltem und warmem Leitungswasser nicht mehr aus, um sie zu erreichen: Eis wird als Werkzeug gebraucht, um das Wasser weiter herunterzukühlen, als es der Wasserhahn allein könnte.</p><p>Die benötigte Eismenge wird über eine Energiebilanz berechnet: Eis braucht beim Schmelzen zusätzliche Energie (Schmelzwärme, ca. 334 Joule pro Gramm) und kühlt das übrige Wasser dadurch stärker ab, als dieselbe Menge bereits kaltes Wasser es könnte. Rechnerisch wird so viel vom Leitungswasser durch Eis ersetzt, dass die Mischung nach dem vollständigen Schmelzen genau die Zieltemperatur ergibt.</p><p><b>Praktisch:</b> Eis vorher exakt abwiegen (Küchenwaage), zum restlichen Leitungswasser geben und unter gelegentlichem Rühren komplett auflösen lassen, bis ein Thermometer die Zieltemperatur bestätigt: erst danach zum Mischen des Teigs verwenden. Ein einfaches Einstich- oder Küchenthermometer reicht dafür völlig aus.</p>',
    '<p><b>DDT</b> ("Desired Dough Temperature", target dough temperature) is the temperature the finished, kneaded dough should have right after mixing: it largely controls how fast the yeast works afterward. To reliably hit this target despite varying room and flour temperatures, the mixing water\'s own temperature is adjusted (warmer or colder than the room), calculated from DDT, room temperature, flour temperature and the friction heat generated while kneading.</p><p>Tap water has a natural lower limit, though: in Germany it usually runs somewhere between about 8 and 15°C+ depending on the season. If the calculated target water temperature falls below that limit, simply mixing cold and warm tap water is no longer enough to reach it: ice is needed as a tool to cool the water down further than the tap alone could manage.</p><p>The required amount of ice is worked out via an energy balance: melting ice absorbs extra energy (latent heat of fusion, about 334 joules per gram), which cools the remaining water more than the same amount of already-cold water could. The calculation replaces just enough of the tap water with ice so that, once it has fully melted, the mixture lands exactly at the target temperature.</p><p><b>In practice:</b> weigh the ice precisely beforehand (kitchen scale), add it to the rest of the tap water and let it dissolve completely while stirring occasionally, until a thermometer confirms the target temperature: only then use it to mix the dough. A simple probe or kitchen thermometer is entirely sufficient for this.</p>');

  add('glossary.gluten.title', 'Gluten', 'Gluten');
  add('glossary.gluten.body',
    '<p>Gluten ist das elastische Eiweißnetzwerk, das entsteht, wenn Mehlproteine (Gliadin und Glutenin) mit Wasser in Kontakt kommen und geknetet oder gefaltet werden. Es macht den Teig dehnbar, hält die von der Hefe produzierten Gasblasen fest und ist verantwortlich für die luftige, offenporige Struktur eines gut gegarten Teigs.</p><p>Je länger und intensiver ein Teig bearbeitet (oder je länger er ruht) wird, desto stärker vernetzt sich das Gluten: bis zu einem Punkt, an dem weiteres Kneten nichts mehr bringt und nur Zeit/Ruhe weiterhilft.</p>',
    '<p>Gluten is the elastic protein network that forms when flour proteins (gliadin and glutenin) come into contact with water and are kneaded or folded. It makes the dough stretchy, traps the gas bubbles produced by the yeast, and is responsible for the airy, open crumb of a well-risen dough.</p><p>The longer and more intensely a dough is worked (or the longer it rests), the more the gluten network develops: up to a point where further kneading stops helping and only time/rest does.</p>');

  add('glossary.stretchFold.title', 'Stretch & Fold (Dehnen und Falten)', 'Stretch and fold');
  add('glossary.stretchFold.body',
    '<p>Stretch & Fold (Dehnen und Falten) ist eine schonende Alternative zum klassischen Kneten, vor allem bei hoher Hydration (ab ca. 70 %), wo der Teig zu klebrig für intensives Kneten wäre. Dabei wird der Teig alle 20–30 Minuten kurz an den Rändern gedehnt und über sich selbst gefaltet, statt ihn durchgehend zu bearbeiten.</p><p>Zwischen den Falten baut sich das Glutennetzwerk von selbst weiter auf, sodass am Ende trotzdem ein stabiler, gut belastbarer Teig entsteht: mit deutlich weniger Kraftaufwand.</p>',
    '<p>Stretch and fold is a gentle alternative to classic kneading, especially useful at high hydration (roughly 70%+), where the dough would be too sticky to knead intensively. The dough is briefly stretched at the edges and folded over itself every 20–30 minutes instead of being worked continuously.</p><p>Between folds, the gluten network keeps developing on its own, so a stable, resilient dough still forms in the end: with much less physical effort.</p>');

  add('glossary.windowpane.title', 'Windowpane-Test', 'Windowpane test');
  add('glossary.windowpane.body',
    '<p>Der Windowpane-Test prüft, ob der Teig genug geknetet ist: Man zieht ein kleines Stück Teig vorsichtig zwischen den Fingern auseinander, bis eine dünne, fast durchsichtige Membran entsteht: wie eine Fensterscheibe (englisch „windowpane").</p><p>Reißt der Teig dabei sofort mit unregelmäßigen Löchern, ist das Glutennetzwerk noch nicht ausreichend entwickelt und braucht mehr Knet- oder Ruhezeit. Hält die Membran stand, ohne sofort zu reißen, ist der Teig bereit für die Stockgare.</p>',
    '<p>The windowpane test checks whether a dough has been kneaded enough: a small piece is gently stretched between the fingers until it forms a thin, almost translucent membrane: like a windowpane.</p><p>If it tears immediately with ragged holes, the gluten network isn\'t developed enough yet and needs more kneading or rest. If the membrane holds without tearing right away, the dough is ready for bulk fermentation.</p>');

  add('glossary.autolyse.title', 'Autolyse', 'Autolyse');
  add('glossary.autolyse.body',
    '<p>Autolyse bezeichnet eine Ruhephase, bei der nur Mehl und Wasser (ohne Hefe und Salz) für 20–60 Minuten vermischt und dann ungestört stehen gelassen werden, bevor der eigentliche Teig fertiggestellt wird. In dieser Zeit nimmt das Mehl das Wasser vollständig auf und beginnt bereits von selbst, ein Glutennetzwerk zu bilden: ganz ohne Kneten.</p><p>Das verkürzt die spätere Knetzeit spürbar und macht den Teig geschmeidiger. Salz wird bewusst erst danach zugegeben, weil es die Wasseraufnahme des Mehls sonst verlangsamen würde.</p>',
    '<p>Autolyse is a resting phase in which only flour and water (no yeast or salt) are mixed and left undisturbed for 20–60 minutes before the actual dough is finished. During this time the flour fully absorbs the water and already starts forming a gluten network on its own: without any kneading.</p><p>This noticeably shortens the later kneading time and makes the dough smoother. Salt is deliberately added afterward, since it would otherwise slow down the flour\'s water absorption.</p>');

  add('glossary.poolish.title', 'Poolish', 'Poolish');
  add('glossary.poolish.body',
    '<p>Poolish ist ein flüssiger Vorteig aus gleichen Teilen Mehl und Wasser (100 % Hydration) mit einer kleinen Menge Hefe. Er reift entweder rund 10 Stunden durchgehend bei Raumtemperatur oder rund 24 Stunden mit kurzem Warm-Anspringen und anschließend deutlich langsamerer, kühler Fermentation im Kühlschrank (daher braucht die kühlere Führung mehr statt weniger Hefe). Beide Regime entwickeln milde Fruchtsäuren und Aromen, die dem fertigen Teig mehr Geschmack und eine offenere, luftigere Krume geben, als es direkte Teigführung könnte.</p><p>Nach der Reifezeit wird der Poolish komplett in den Hauptteig eingearbeitet, dort kommen dann auch Salz, Öl und der Rest des Mehls dazu.</p>',
    '<p>Poolish is a liquid pre-ferment made of equal parts flour and water (100% hydration) with a small amount of yeast. It matures either for about 10 hours entirely at room temperature, or for about 24 hours with a brief warm start followed by much slower, cool fermentation in the fridge (which is why the cooler route needs more yeast, not less). Both regimes develop mild fruity acids and aromas that give the finished dough more flavor and a more open, airier crumb than a same-day direct dough could achieve.</p><p>After maturing, the poolish is fully mixed into the main dough, where salt, oil and the remaining flour are then added.</p>');

  add('glossary.biga.title', 'Biga', 'Biga');
  add('glossary.biga.body',
    '<p>Biga ist ein fester, trockener Vorteig (Hydration meist 45–50 %) mit wenig Hefe, der 17–48 Stunden kühl reift: entweder durchgehend bei 16–18 °C oder mit kurzem Anspringen und anschließend deutlich langsamerer, kälterer Fermentation im Kühlschrank. Die geringe Wassermenge verlangsamt die Fermentation zusätzlich zur Kälte und sorgt für ein besonders stabiles Glutennetzwerk sowie kräftige, nussige Röstaromen.</p><p>Biga wird traditionell in vielen norditalienischen Brot- und Pizzarezepten verwendet und gilt als etwas anspruchsvoller in der Verarbeitung als Poolish, da der feste Teig von Hand aufgebrochen und eingearbeitet werden muss.</p>',
    '<p>Biga is a firm, dry pre-ferment (hydration usually 45–50%) with little yeast, left to mature cool for 17–48 hours: either entirely at 16–18 °C, or with a brief start followed by much slower, colder fermentation in the fridge. The low water content slows fermentation even further on top of the cold temperature, producing an especially stable gluten network and rich, nutty roasted flavors.</p><p>Biga is traditionally used in many northern Italian bread and pizza recipes and is considered somewhat trickier to handle than poolish, since the firm dough has to be broken up and worked in by hand.</p>');

  add('glossary.kalteGare.title', 'Kalte Gare', 'Cold fermentation');
  add('glossary.kalteGare.body',
    '<p>Kalte Gare bedeutet, den Teig (oder die bereits geformten Teiglinge) für viele Stunden bis mehrere Tage im Kühlschrank reifen zu lassen, statt bei Raumtemperatur. Die Kälte verlangsamt die Hefeaktivität stark, während enzymatische Prozesse im Mehl weiterlaufen: dadurch entstehen mehr Aromen und eine bekömmlichere, leichter verdauliche Kruste, ohne dass der Teig übergärt.</p><p>Wichtig ist die Unterscheidung: Reift der ganze Teig im Stück kalt, oder werden vorher einzelne Teiglinge geformt und dann kalt gestellt? Beides führt zu leicht unterschiedlichen Ergebnissen (s. Kaltgare-Einstellung im Rechner).</p>',
    '<p>Cold fermentation means letting the dough (or already-shaped dough balls) rise in the fridge for many hours up to several days, instead of at room temperature. The cold strongly slows down yeast activity while enzymatic processes in the flour keep going: this develops more flavor and a lighter, more digestible crust without the dough over-fermenting.</p><p>One important distinction: does the whole dough rise cold in one piece, or are individual dough balls shaped first and then chilled? Both lead to slightly different results (see the cold-rise setting in the calculator).</p>');

  // Neuer Eintrag (v4.8.0, Backlog Punkt D): bis v4.7.0 stand dieser Inhalt als optionaler
  // .tip-Textblock (Feature-Flag "freezeHint") direkt im Schritt "Teiglinge formen" -- seit
  // v4.8.0 ersatzlos entfernt und stattdessen hier als eigenständiger Glossar-Artikel
  // verfügbar, per Glossar-Verweis vom Schritt aus verlinkt (s. js/guide.js).
  add('glossary.einfrieren.title', 'Einfrieren', 'Freezing');
  add('glossary.einfrieren.body',
    '<p>Fertig geformte Teiglinge lassen sich problemlos einfrieren, praktisch z. B. wenn ein Rezept mehr Teiglinge ergibt, als am selben Tag gebraucht werden. Dünn mit Öl bestreichen und einzeln, mit Abstand zueinander (nicht berührend), einfrieren: erst wenn sie durchgefroren sind, können sie zusammen in einem Beutel/einer Box gelagert werden, ohne aneinander festzukleben. So halten sie sich etwa <b>2–3 Monate</b>.</p><p>Zum Auftauen zuerst <b>über Nacht im Kühlschrank</b> langsam auftauen lassen, dann <b>3–5 Stunden bei Raumtemperatur</b> weiter temperieren, und anschließend ganz normal <b>2–4 Stunden Stückgare</b> wie bei einem frisch geformten Teigling.</p>',
    '<p>Fully shaped dough balls freeze well, handy for example when a recipe makes more dough balls than are needed on the same day. Brush them thinly with oil and freeze individually, spaced apart (not touching): only once they\'re frozen solid can they be stored together in one bag/container without sticking to each other. This keeps them for roughly <b>2–3 months</b>.</p><p>To thaw, first let them defrost slowly <b>overnight in the fridge</b>, then bring them further up to temperature for <b>3–5 hours at room temperature</b>, and finally do a normal <b>2–4 hour final proof</b> just like a freshly shaped dough ball.</p>');

  add('glossary.malzmehl.title', 'Malzmehl (Malto)', 'Malt flour (malto)');
  add('glossary.malzmehl.body',
    '<p>Malzmehl (italienisch „malto", meist diastatisches Gerstenmalzmehl) enthält Enzyme, die Stärke im Mehl in vergärbaren Zucker aufspalten. Ein kleiner Anteil (oft unter 1 % der Mehlmenge) füttert die Hefe zusätzlich, fördert eine gleichmäßigere Bräunung der Kruste und kann bei sehr langen, kalten Gärzeiten helfen, wenn dem Mehl sonst die Energie ausgeht.</p><p>Viele italienische Pizzamehle haben bereits eine kleine Menge Malzmehl beigemischt: ein separater Zusatz ist meist nur bei sehr langer Reifezeit oder schwächerem Mehl sinnvoll.</p>',
    '<p>Malt flour (Italian "malto", usually diastatic barley malt flour) contains enzymes that break down starch in the flour into fermentable sugar. A small amount (often under 1% of the flour weight) gives the yeast extra fuel, promotes more even crust browning, and can help during very long, cold fermentations when the flour might otherwise run low on energy.</p><p>Many Italian pizza flours already have a small amount of malt flour blended in: adding more separately usually only makes sense for very long rises or weaker flour.</p>');

  add('glossary.ofenVsBackofen.title', 'Pizzaofen vs. Backofen', 'Pizza oven vs. home oven');
  add('glossary.ofenVsBackofen.body',
    '<p>Ein dedizierter Pizzaofen (Holz, Gas oder Strom) erreicht 400–500 °C und backt eine neapolitanische Pizza in 60–90 Sekunden: dadurch bleibt der Teig innen saftig, während außen schnell Röstblasen (Leoparding) entstehen.</p><p>Ein normaler Haushaltsbackofen schafft meist nur 250–300 °C, wodurch das Backen 6–12 Minuten dauert und der Teig eher austrocknet, bevor die Kruste ausreichend gebräunt ist. Ein Pizzastahl oder -stein hilft, diesen Unterschied teilweise auszugleichen, indem er Hitze speichert und von unten intensiver an den Teig abgibt, als es ein Backblech könnte.</p>',
    '<p>A dedicated pizza oven (wood, gas or electric) reaches 400–500°C and bakes a Neapolitan pizza in 60–90 seconds: this keeps the inside of the dough moist while quickly forming charred blisters (leoparding) on the outside.</p><p>A regular home oven usually maxes out at 250–300°C, so baking takes 6–12 minutes and the dough tends to dry out before the crust browns enough. A baking steel or pizza stone helps partly compensate for this by storing heat and transferring it to the dough from below far more intensely than a baking sheet could.</p>');

  // Neuer Eintrag (v3.68.0), ausgelöst durch Kollegen-Feedback zur Anleitung: "Was ist,
  // wenn ich keinen Grill im Ofen habe? Gibt es eine Option für Ober/Unterhitze und für
  // Umluft?" Ergänzt js/guide.js' Vorheiz-/Back-Schritte (bisher nur "+ Grill" empfohlen,
  // ohne Alternative für Nutzer ohne Grillfunktion oder mit Umluft-Ofen), s. Abschnitt
  // "Glossar-Verweise in der Anleitung" in pizza-rechner-KONTEXT.md.
  add('glossary.ofenHeizarten.title', 'Ofen-Heizarten für Pizza', 'Oven heat modes for pizza');
  add('glossary.ofenHeizarten.body',
    '<p>Ober/Unterhitze strahlt gleichmäßig von oben UND unten, ganz ohne Gebläse: das kommt der Hitzeverteilung eines Steinofens am nächsten, besonders zusammen mit einem vorgeheizten Pizzastein/-stahl möglichst weit oben im Ofen. Umluft (Heißluft/Konvektion) verteilt die Hitze per Ventilator gleichmäßiger über mehrere Backgüter und trocknet die Oberfläche schneller, kühlt eine einzelne Pizza aber leicht ab und bräunt die Oberseite meist etwas weniger stark. Der Backofengrill strahlt nur von oben, ganz ohne Unterhitze: dient meist nur als kurzer Extra-Schub am Ende für mehr Farbe oben, nicht als alleinige Backmethode.</p><p>Ohne Grillfunktion: einfach Ober/Unterhitze auf höchster Stufe nutzen, den Stein/Stahl so weit oben wie möglich platzieren, das kommt der fehlenden Grillhitze am nächsten. Nur mit Umluft: die Temperatur meist um etwa 15–20 °C gegenüber der angegebenen Ober/Unterhitze-Temperatur senken (übliche Umluft-Faustregel) und mit etwas mehr Backzeit sowie blasserer Bräunung oben rechnen.</p>',
    '<p>Conventional top/bottom heat radiates evenly from above AND below, with no fan at all: this comes closest to the heat distribution of a stone oven, especially together with a preheated pizza stone/steel placed as high up in the oven as possible. Convection (fan-assisted heat) circulates hot air more evenly across multiple items and dries the surface faster, but slightly cools a single pizza and usually browns the top a bit less. The oven grill/broiler radiates only from above, with no bottom heat at all: usually just a short extra boost at the end for more color on top, not a baking method on its own.</p><p>Without a grill function: simply use top/bottom heat on the highest setting and place the stone/steel as high up as possible, that comes closest to the missing grill heat. With convection only: usually lower the temperature by about 15 to 20°C compared to the stated top/bottom heat temperature (a common convection rule of thumb) and expect slightly longer baking time along with paler browning on top.</p>');

  // -- Werkzeuge & Ausrüstung (v3.66.0) --------------------------------------------------
  add('glossary.pizzastein.title', 'Pizzastein & Pizzastahl', 'Pizza stone & pizza steel');
  add('glossary.pizzastein.body',
    '<p>Beide speichern Hitze und geben sie von unten intensiv an den Teig ab: damit schließen sie einen Teil der Lücke zwischen Haushaltsofen (meist nur 250–300 °C) und Pizzaofen. Pizzastahl (Metall) leitet Wärme besser und schneller als der klassische Keramik-/Cordierit-Stein, ergibt dadurch oft eine noch knusprigere Unterseite, ist dafür aber deutlich schwerer.</p><p>Pizzastein ist leichter, günstiger und gibt die Hitze etwas sanfter ab: für viele Einsteiger die praktischere Wahl. Beide brauchen eine lange Vorheizzeit (30–60 Minuten bei Ofen-Maximaltemperatur), damit sie wirklich durchgeglüht sind, bevor der erste Teigling hineinkommt.</p>',
    '<p>Both store heat and release it intensely from below into the dough: this closes part of the gap between a home oven (usually only 250–300°C) and a dedicated pizza oven. A pizza steel (metal) conducts heat better and faster than the classic ceramic/cordierite stone, often giving an even crispier bottom, but is noticeably heavier.</p><p>A pizza stone is lighter, cheaper and releases heat a bit more gently: often the more practical choice for beginners. Both need a long preheat (30–60 minutes at the oven\'s maximum temperature) to be fully heated through before the first dough ball goes in.</p>');

  add('glossary.pizzaschieber.title', 'Pizzaschieber (Peel)', 'Pizza peel');
  add('glossary.pizzaschieber.body',
    '<p>Ein Holzschieber eignet sich besonders zum Aufsetzen der belegten Pizza in den Ofen: gut bemehlt oder mit Grieß bestäubt, rutscht der Teig länger, bevor er anfängt zu kleben. Ein Metallschieber (oft mit dünner, scharfer Kante, manche perforiert) eignet sich besser zum Drehen und Herausholen der schon backenden Pizza, weil die dünne Kante leicht unter die Kruste gleitet.</p><p>Viele Pizzabäcker nutzen deshalb beides parallel: Holz zum Einschießen, Metall zum Wenden und Herausnehmen. Ein perforierter Schieber lässt zusätzlich überschüssiges Mehl/Grieß durchfallen, statt mit in den Ofen zu wandern und dort zu verbrennen.</p>',
    '<p>A wooden peel works especially well for launching a topped pizza into the oven: well-floured or dusted with semolina, the dough slides longer before it starts sticking. A metal peel (often with a thin, sharp edge, sometimes perforated) works better for turning and retrieving a pizza that\'s already baking, since the thin edge slides easily under the crust.</p><p>Many pizza makers use both in parallel: wood for launching, metal for turning and retrieving. A perforated peel also lets excess flour/semolina fall through instead of going into the oven and burning there.</p>');

  add('glossary.ofenthermometer.title', 'Ofen-/Infrarot-Thermometer', 'Oven/infrared thermometer');
  add('glossary.ofenthermometer.body',
    '<p>Die eingebaute Temperaturanzeige vieler Haushaltsöfen ist ungenau oder zeigt die Lufttemperatur statt der tatsächlich entscheidenden Oberflächentemperatur von Stein/Stahl. Ein berührungsloses Infrarot-Thermometer misst die Oberfläche direkt und zeigt zuverlässig, ob der Stein wirklich durchgeheizt ist.</p><p>Sinnvoll ist es, mehrere Stellen zu messen (Mitte, Rand), da die Temperatur über die Fläche schwanken kann. Ein separates Ofenthermometer (analog oder digital) hilft zusätzlich, wenn die eingebaute Ofenanzeige generell von der tatsächlichen Innentemperatur abweicht.</p>',
    '<p>The built-in temperature display on many home ovens is imprecise or shows the air temperature instead of the surface temperature of the stone/steel, which is what actually matters. A contactless infrared thermometer measures the surface directly and reliably shows whether the stone is really heated through.</p><p>It\'s worth measuring several spots (center, edge), since temperature can vary across the surface. A separate oven thermometer (analog or digital) also helps whenever the built-in oven display generally deviates from the actual interior temperature.</p>');

  add('glossary.teigschaber.title', 'Teigschaber (Bench Scraper)', 'Dough scraper (bench scraper)');
  add('glossary.teigschaber.body',
    '<p>Ein Teigschaber ist eine flache, meist rechteckige Klinge (Metall mit gerader Kante oder flexibles Plastik) zum Teilen des Teigs in Portionen, zum Lösen klebrigen Teigs von der Arbeitsfläche ohne ihn zu zerreißen, und zum anschließenden Reinigen der Fläche.</p><p>Die Metallvariante mit gerader Kante eignet sich gut zum präzisen Abteilen (z. B. entlang einer Markierung), die flexible Plastikvariante („Schüsselschaber") eher zum restlosen Auskratzen von Schüsseln und zum Falten sehr feuchter Teige.</p>',
    '<p>A bench scraper is a flat, usually rectangular blade (metal with a straight edge, or flexible plastic) used to divide dough into portions, to lift sticky dough off the work surface without tearing it, and to clean the surface afterward.</p><p>The metal version with a straight edge is good for precise dividing (e.g. along a marking), while the flexible plastic version (a "bowl scraper") is better for scraping bowls completely clean and for folding very wet doughs.</p>');

  add('glossary.kuechenwaage.title', 'Küchenwaage', 'Kitchen scale');
  add('glossary.kuechenwaage.body',
    '<p>Bei kleinen Mengen (Salz, Hefe) wirkt sich ein Wägefehler prozentual viel stärker aus als bei großen (Mehl, Wasser), weil Bäckerprozente relativ zur Mehlmenge gerechnet werden. Eine Waage, die nur ganze Gramm anzeigt, ist für Mengen unter 5 g zu ungenau: eine 0,1-g-Feinwaage (bei sehr wenig Hefe sogar 0,01 g) nimmt hier das Rätselraten heraus.</p><p>Eine Tara-Funktion erlaubt es, alle Zutaten direkt nacheinander in dieselbe Schüssel abzuwiegen, ohne jedes Mal umzurechnen: praktisch, weil weniger Geschirr und weniger Rechenfehler.</p>',
    '<p>For small amounts (salt, yeast), a weighing error has a much bigger percentage impact than for large ones (flour, water), because baker\'s percentages are calculated relative to the flour weight. A scale that only shows whole grams is too imprecise for amounts under 5 g: a 0.1 g precision scale (or even 0.01 g for very small yeast amounts) removes the guesswork here.</p><p>A tare function lets you weigh every ingredient directly, one after another, into the same bowl without recalculating each time: practical, since it means less washing-up and fewer calculation errors.</p>');

  add('glossary.gaerbox.title', 'Gärbox (Proofing Box)', 'Proofing box');
  add('glossary.gaerbox.body',
    '<p>Eine Gärbox ist ein luftdicht schließender, meist stapelbarer Behälter für die Variante „als Teiglinge" der Kaltgare: er verhindert, dass die Teiglinge während der vielen Stunden im Kühlschrank an der Oberfläche austrocknen und eine Haut bilden, und spart durch die Stapelbarkeit Platz im Kühlschrank.</p><p>Statt einer speziellen Gärbox tut es genauso gut jede dicht schließende Frischhaltedose oder ein Blech straff mit Frischhaltefolie/wiederverwendbarer Abdeckung bespannt: entscheidend ist allein die Luftdichtigkeit, nicht ein bestimmtes Produkt.</p>',
    '<p>A proofing box is an airtight, usually stackable container for the "as dough balls" cold-rise variant: it keeps the dough balls from drying out and forming a skin on the surface during the many hours in the fridge, and its stackability saves fridge space.</p><p>Instead of a dedicated proofing box, any tightly sealing food storage container works just as well, or a sheet pan wrapped tightly in plastic wrap or a reusable lid: all that matters is airtightness, not a specific product.</p>');

  add('glossary.sanMarzano.title', 'San-Marzano-Tomaten', 'San Marzano tomatoes');
  add('glossary.sanMarzano.body',
    '<p>San-Marzano-Tomaten sind eine längliche Tomatensorte aus der vulkanischen Ebene am Fuß des Vesuvs bei Neapel, geschützt durch die EU-Herkunftsbezeichnung „San Marzano dell\'Agro Sarnese-Nocerino DOP". Sie zeichnen sich durch wenig Kerne, festes Fruchtfleisch, eine dünne Schale und einen ausgewogenen, wenig säuerlichen Geschmack aus.</p><p>Echte DOP-San-Marzano sind vergleichsweise teuer; viele günstigere Dosentomaten werben zwar mit dem Namen, stammen aber nicht aus der geschützten Anbauregion.</p>',
    '<p>San Marzano tomatoes are an elongated tomato variety from the volcanic plain at the foot of Mount Vesuvius near Naples, protected by the EU designation "San Marzano dell\'Agro Sarnese-Nocerino DOP". They\'re characterized by few seeds, firm flesh, thin skin and a balanced, low-acid flavor.</p><p>Genuine DOP San Marzano tomatoes are relatively expensive; many cheaper canned tomatoes carry the name but don\'t actually come from the protected growing region.</p>');

  add('glossary.passata.title', 'Passata di Pomodoro', 'Passata di pomodoro');
  add('glossary.passata.body',
    '<p>Passata di pomodoro ist passierte, ungekochte Tomatensauce aus gesiebten, aber nicht weiter reduzierten Tomaten: meist nur mit etwas Salz, manchmal Olivenöl oder Basilikum verfeinert. Anders als eingekochte Pastasaucen wird sie für Pizza bewusst NICHT vorgekocht.</p><p>Der Teig backt die Sauce erst im Ofen fertig, wodurch sie frisch und leicht säuerlich bleibt statt schwer und süßlich. Für die klassische Napoli-Pizza reicht meist ein dünner, gleichmäßiger Löffel Passata, der nicht bis an den Rand reicht.</p>',
    '<p>Passata di pomodoro is a smooth, uncooked tomato sauce made from sieved tomatoes that aren\'t reduced any further: usually seasoned with just a little salt, sometimes olive oil or basil. Unlike simmered pasta sauces, it\'s deliberately NOT pre-cooked for pizza.</p><p>The dough finishes cooking the sauce in the oven, keeping it fresh and lightly tangy instead of heavy and sweet. For classic Neapolitan pizza, a thin, even spoonful of passata that doesn\'t quite reach the rim is usually enough.</p>');

  add('glossary.fiorDiLatte.title', 'Fior di Latte vs. Mozzarella', 'Fior di latte vs. mozzarella');
  add('glossary.fiorDiLatte.body',
    '<p>Sowohl Fior di Latte als auch klassische Mozzarella gehören zur Familie der „Pasta filata"-Käse (gezogener Käseteig), unterscheiden sich aber in der Milch: Mozzarella (genauer: Mozzarella di Bufala Campana DOP) wird aus Wasserbüffelmilch hergestellt, kräftiger im Geschmack und wasserhaltiger.</p><p>Fior di Latte wird aus Kuhmilch gemacht, ist milder und etwas fester: dadurch für Pizza oft praktischer, weil sie beim Backen weniger Wasser abgibt und den Teig nicht so leicht durchweicht.</p>',
    '<p>Both fior di latte and classic mozzarella belong to the "pasta filata" (stretched-curd) cheese family, but they differ in the milk used: mozzarella (more precisely, Mozzarella di Bufala Campana DOP) is made from water buffalo milk, giving it a stronger flavor and higher water content.</p><p>Fior di latte is made from cow\'s milk, is milder and slightly firmer: often more practical for pizza, since it releases less water while baking and doesn\'t soak the dough as easily.</p>');

  add('glossary.olivenoel.title', 'Olivenöl (Extra Vergine)', 'Olive oil (extra virgin)');
  add('glossary.olivenoel.body',
    '<p>Olivenöl kommt bei neapolitanischer Pizza in zwei Rollen vor: als kleiner Anteil im Teig (macht ihn geschmeidiger und fördert die Bräunung, klassisch aber oft ganz weggelassen) und als Finish nach dem Backen, ein dünner Faden „Extra Vergine"-Olivenöl direkt vor dem Servieren.</p><p>Extra Vergine bedeutet kaltgepresst, unraffiniert und mit besonders niedrigem Säuregehalt: dadurch bleibt der fruchtige Eigengeschmack erhalten. Für den Teig selbst reicht meist ein einfacheres Olivenöl, für das Finish lohnt sich ein hochwertiges.</p>',
    '<p>Olive oil plays two roles in Neapolitan pizza: as a small ingredient in the dough itself (makes it more supple and promotes browning, though classically often left out entirely) and as a finishing touch after baking: a thin drizzle of extra virgin olive oil right before serving.</p><p>Extra virgin means cold-pressed, unrefined and with an especially low acidity level, which preserves the fruity flavor. A simpler olive oil is usually fine for the dough itself, while a higher-quality one is worth it for the finishing drizzle.</p>');

  add('glossary.basilikum.title', 'Frisches Basilikum', 'Fresh basil');
  add('glossary.basilikum.body',
    '<p>Frisches Basilikum wird bei klassischer Margherita traditionell ERST NACH dem Backen aufgelegt, nicht vorher: die Hitze des Ofens würde die zarten Blätter sonst innerhalb von Sekunden verbrennen und bitter machen.</p><p>Getrocknetes Basilikum verträgt die Backhitze zwar besser, hat aber ein deutlich anderes, weniger frisches Aroma und wird deshalb für die klassische Napoli-Pizza kaum verwendet. Ein paar frische Blätter kurz vor dem Servieren reichen meist aus.</p>',
    '<p>Fresh basil is traditionally added to a classic Margherita AFTER baking, not before: the oven\'s heat would otherwise scorch the delicate leaves within seconds and turn them bitter.</p><p>Dried basil holds up better to baking heat, but has a noticeably different, less fresh aroma, so it\'s rarely used for classic Neapolitan pizza. A few fresh leaves added just before serving are usually enough.</p>');

  // -- Pizzabeläge (v3.66.0) --------------------------------------------------------------
  add('glossary.belagMarinara.title', 'Pizza Marinara (ohne Käse)', 'Pizza Marinara (no cheese)');
  add('glossary.belagMarinara.body',
    '<p>Die Marinara ist historisch älter als die Margherita und kommt komplett ohne Käse aus: nur Tomate, Knoblauch, Oregano und Olivenöl, manchmal etwas frisches Basilikum. Der Name verweist nicht auf Meeresfrüchte, sondern wird meist damit erklärt, dass es ein einfaches, lange haltbares Gericht für Seeleute („marinai") war.</p><p>Ohne den zusätzlichen Wasseranteil des Käses backt die Marinara meist etwas schneller durch und bleibt in der Mitte weniger feucht als eine Margherita: eine gute Wahl, um die reine Tomatenqualität zu beurteilen.</p>',
    '<p>The Marinara is historically older than the Margherita and comes with no cheese at all: just tomato, garlic, oregano and olive oil, sometimes a little fresh basil. The name doesn\'t refer to seafood; it\'s usually explained as a simple, long-keeping dish for sailors ("marinai").</p><p>Without the extra moisture from cheese, a Marinara typically bakes through a bit faster and stays less wet in the center than a Margherita: a good way to judge the quality of the tomatoes on their own.</p>');

  add('glossary.belagCapricciosa.title', 'Pizza Capricciosa', 'Pizza Capricciosa');
  add('glossary.belagCapricciosa.body',
    '<p>„Capricciosa" bedeutet „launisch/willkürlich" und beschreibt einen Belag, der traditionell mehrere Zutaten gleichzeitig, aber getrennt in Sektoren angeordnet vereint: gekochter Schinken, Champignons, Artischocken, Oliven, manchmal ein Viertel hartgekochtes Ei.</p><p>Anders als bei einbelagigen Klassikern wie Margherita oder Marinara gibt es keine strenge Rezeptvorgabe: welche Zutatenkombination genau als „Capricciosa" gilt, unterscheidet sich von Pizzeria zu Pizzeria.</p>',
    '<p>"Capricciosa" means "capricious/whimsical" and describes a topping that traditionally combines several ingredients at once, arranged in separate sections rather than mixed together: cooked ham, mushrooms, artichokes, olives, sometimes a wedge of hard-boiled egg.</p><p>Unlike single-topping classics such as Margherita or Marinara, there\'s no strict recipe: exactly which combination of ingredients counts as a "Capricciosa" varies from pizzeria to pizzeria.</p>');

  add('glossary.belagDiavola.title', 'Pizza Diavola (scharf)', 'Pizza Diavola (spicy)');
  add('glossary.belagDiavola.body',
    '<p>Die Diavola („teuflisch") ist die klassische scharfe Pizza: scharfe Salami (Salame Piccante) oder auch die streichfähige, sehr scharfe Wurst \'Nduja auf einer Tomaten-Mozzarella-Basis, manchmal zusätzlich mit Chiliöl beträufelt.</p><p>Sie ähnelt der amerikanischen „Pepperoni-Pizza", verwendet aber meist eine anders gewürzte, oft schärfere Salami-Sorte als das in den USA übliche Pepperoni.</p>',
    '<p>The Diavola ("devilish") is the classic spicy pizza: spicy salami (salame piccante) or the spreadable, very hot \'nduja sausage on a tomato-mozzarella base, sometimes with an extra drizzle of chili oil.</p><p>It resembles the American "pepperoni pizza", but typically uses a differently seasoned, often spicier type of salami than the pepperoni common in the US.</p>');

  add('glossary.belagQuattroFormaggi.title', 'Pizza Quattro Formaggi (Vier Käse)', 'Pizza Quattro Formaggi (four cheese)');
  add('glossary.belagQuattroFormaggi.body',
    '<p>Quattro Formaggi kombiniert vier verschiedene Käsesorten, oft als „Pizza Bianca" ganz ohne Tomatensauce: typisch sind Mozzarella (mild, schmelzend), Gorgonzola (kräftig-würzig), Parmesan (salzig, nussig) und Fontina oder Taleggio (cremig).</p><p>Weil manche dieser Käse vor allem wegen ihres kräftigen Geschmacks und nicht wegen der Schmelzeigenschaft dabei sind, werden sie oft nur in kleinen Tupfen statt flächendeckend verteilt.</p>',
    '<p>Quattro Formaggi combines four different types of cheese, often as a "pizza bianca" with no tomato sauce at all: typical choices are mozzarella (mild, meltable), gorgonzola (strong, pungent), parmesan (salty, nutty) and fontina or taleggio (creamy).</p><p>Since some of these cheeses are included mainly for their strong flavor rather than how they melt, they\'re often dotted on in small amounts instead of spread evenly across the whole surface.</p>');

  add('glossary.belagNachDemBacken.title', 'Beläge, die erst nach dem Backen draufkommen', 'Toppings added after baking');
  add('glossary.belagNachDemBacken.body',
    '<p>Manche Zutaten würden in der kurzen, sehr heißen Backzeit einer neapolitanischen Pizza verbrennen, austrocknen oder welk werden: roher Schinken (Prosciutto Crudo), Rucola, frische Burrata und ein Faden hochwertiges Olivenöl gehören deshalb traditionell erst NACH dem Backen auf die fertige Pizza (analog zu frischem Basilikum, s. eigener Glossar-Eintrag).</p><p>Der Effekt: die Zutaten bleiben frisch, cremig oder knackig statt verkocht, und ihr Eigengeschmack tritt deutlicher hervor als er es beim Mitbacken könnte.</p>',
    '<p>Some ingredients would burn, dry out or wilt during the short, very hot bake of a Neapolitan pizza: raw ham (prosciutto crudo), arugula, fresh burrata and a drizzle of high-quality olive oil are therefore traditionally added AFTER baking, once the pizza is done (similar to fresh basil, see its own glossary entry).</p><p>The effect: the ingredients stay fresh, creamy or crisp instead of overcooked, and their own flavor comes through more clearly than it would if baked along with the pizza.</p>');

  add('glossary.echteNeapolitanische.title', 'Echte neapolitanische Pizza (AVPN)', 'True Neapolitan pizza (AVPN)');
  add('glossary.echteNeapolitanische.body',
    '<p>Die „Associazione Verace Pizza Napoletana" (AVPN) ist eine 1984 gegründete Vereinigung, die genaue Regeln für „echte" neapolitanische Pizza festlegt: nur bestimmte Mehltypen, ausschließlich Handarbeit beim Formen (kein Nudelholz), Backzeit von 60–90 Sekunden bei ca. 485 °C im Holzofen, ein Teigrand von 1–2 cm und maximal 35 cm Durchmesser.</p><p>Betriebe, die diese Kriterien erfüllen und sich zertifizieren lassen, dürfen das AVPN-Siegel führen. Die Regeln dienen eher als Referenz/Ideal: die meisten Hobby- und auch viele Profi-Pizzabäcker weichen in Details ab, ohne dass die Pizza dadurch „unecht" wird.</p>',
    '<p>The "Associazione Verace Pizza Napoletana" (AVPN) is an association founded in 1984 that sets precise rules for "true" Neapolitan pizza: only certain flour types, shaping done exclusively by hand (no rolling pin), a bake time of 60–90 seconds at around 485°C in a wood-fired oven, a crust rim of 1–2 cm, and a maximum diameter of 35 cm.</p><p>Establishments that meet these criteria and get certified may display the AVPN seal. The rules serve more as a reference/ideal: most home cooks and even many professional pizzaioli deviate in the details without the pizza thereby becoming "inauthentic".</p>');

  add('glossary.margherita.title', 'Pizza Margherita (Namensgeschichte)', 'Pizza Margherita (name origin)');
  add('glossary.margherita.body',
    '<p>Der bekanntesten Legende nach wurde die Pizza Margherita 1889 vom neapolitanischen Pizzabäcker Raffaele Esposito zu Ehren von Königin Margherita von Savoyen kreiert: mit Tomate (Rot), Mozzarella (Weiß) und Basilikum (Grün) in den Farben der italienischen Flagge.</p><p>Historiker bezweifeln inzwischen einige Details dieser Geschichte, die Kombination der drei Zutaten war vermutlich schon vorher in Neapel verbreitet. Unabhängig von der genauen Herkunft gilt die Margherita bis heute als die Referenz-Pizza.</p>',
    '<p>According to the best-known legend, Pizza Margherita was created in 1889 by Neapolitan pizzaiolo Raffaele Esposito in honor of Queen Margherita of Savoy: with tomato (red), mozzarella (white) and basil (green) representing the colors of the Italian flag.</p><p>Historians now doubt some details of this story, and the combination of these three ingredients was likely already common in Naples beforehand. Regardless of its exact origin, the Margherita remains the reference pizza today.</p>');

  add('glossary.napoletanaVsRomana.title', 'Neapolitanische vs. Römische Pizza', 'Neapolitan vs. Roman pizza');
  add('glossary.napoletanaVsRomana.body',
    '<p>Neapolitanische Pizza (Napoletana) hat einen dicken, weichen, luftigen Rand und eine dünne, biegsame Mitte: durch die kurze, sehr heiße Backzeit bleibt sie innen fast schon leicht feucht („al dente").</p><p>Römische Pizza (Romana, auch „scrocchiarella") ist dagegen insgesamt dünn und knusprig-kross bis zum Rand, mit weniger Hydration und oft längerer, kühlerer Backzeit im normalen Backofen. Beide Stile unterscheiden sich deutlich in Teigführung, Hydration und gewünschter Textur.</p>',
    '<p>Neapolitan pizza (Napoletana) has a thick, soft, airy rim and a thin, pliable center: the short, very hot bake keeps the inside almost slightly moist ("al dente").</p><p>Roman pizza (Romana, also called "scrocchiarella") is instead thin and crisp all the way to the edge, with lower hydration and often a longer, cooler bake in a regular oven. Both styles differ significantly in dough handling, hydration and intended texture.</p>');

  add('glossary.newYorkStyle.title', 'New York Style Pizza', 'New York style pizza');
  add('glossary.newYorkStyle.body',
    '<p>New York Style Pizza entstand durch italienische Einwanderer, die die neapolitanische Tradition an amerikanische Zutaten und große Haushaltsöfen anpassten. Typisch sind größere, dünnere Stücke, ein knuspriger, aber noch faltbarer Rand („foldable slice") und häufig etwas Zucker sowie Öl im Teig.</p><p>Der Käse ist meist Low-Moisture-Mozzarella statt frischer Fior di Latte, damit die Pizza beim Aufschneiden/Falten nicht durchweicht.</p>',
    '<p>New York style pizza emerged as Italian immigrants adapted the Neapolitan tradition to American ingredients and large home-style ovens. Typical features are larger, thinner slices, a crispy yet still foldable rim (the "foldable slice"), and often some sugar and oil in the dough.</p><p>The cheese is typically low-moisture mozzarella rather than fresh fior di latte, so the pizza doesn\'t get soggy when cut or folded.</p>');

  add('glossary.detroitStyle.title', 'Detroit-Style Pizza', 'Detroit-style pizza');
  add('glossary.detroitStyle.body',
    '<p>Detroit-Style Pizza wird in einer rechteckigen, tiefen Stahlpfanne (ursprünglich Auto-Teileschalen aus Detroits Automobilindustrie) gebacken und hat dadurch eine dicke, luftige Krume mit einer besonders knusprigen, fast frittiert wirkenden Unterseite und Rand.</p><p>Ungewöhnlich ist die Reihenfolge der Beläge: Der Käse (oft Wisconsin-Brick-Cheese) reicht bis an den Pfannenrand und karamellisiert dort zu einer knusprigen Käsekruste, die Tomatensauce kommt meist erst NACH dem Käse in Streifen obenauf.</p>',
    '<p>Detroit-style pizza is baked in a rectangular, deep steel pan (originally automotive parts trays from Detroit\'s car industry), giving it a thick, airy crumb with an especially crispy, almost fried-tasting bottom and edge.</p><p>The topping order is unusual: the cheese (often Wisconsin brick cheese) is spread all the way to the pan\'s edge, where it caramelizes into a crispy cheese crust, and the tomato sauce is typically added in stripes on top of the cheese, not underneath it.</p>');

  add('glossary.sfincione.title', 'Sizilianische Pizza (Sfincione)', 'Sicilian pizza (sfincione)');
  add('glossary.sfincione.body',
    '<p>Sfincione ist die traditionelle sizilianische Pizza: ein dicker, schwammig-luftiger Hefeteig, meist rechteckig in einem Blech gebacken, mit einer würzigen Sauce aus Tomaten, Zwiebeln, Anchovis und Oregano, oft ohne (oder nur mit wenig) geschmolzenem Käse: stattdessen häufig mit Semmelbröseln bestreut.</p><p>Der Name leitet sich vom lateinischen „spongia" (Schwamm) ab und verweist auf die charakteristisch lockere, poröse Krume: traditionell eher Streetfood-Snack als Hauptgericht.</p>',
    '<p>Sfincione is the traditional Sicilian pizza: a thick, spongy, airy yeasted dough, usually baked rectangular in a pan, topped with a savory sauce of tomatoes, onions, anchovies and oregano, often with little or no melted cheese: breadcrumbs are sprinkled on top instead.</p><p>The name derives from the Latin "spongia" (sponge), referring to its characteristically loose, porous crumb: traditionally eaten more as a street-food snack than a main course.</p>');

  // -- Card: Einführung (v4.18.0, eigene prominente Karte ganz oben auf der
  // Einstellungen-Seite, Desktop + Mobil, ersetzt den früheren Menüpunkt im Burgermenü
  // bzw. am Ende der "Funktionen"-Karte) ----------------------------------------------------
  add('card.onboarding.title', 'Einführung', 'Introduction');
  add('hint.onboardingCard', 'Kurzer Rundgang durch die wichtigsten Funktionen der App: jederzeit hier erneut aufrufbar.',
    'A short tour of the app\'s key features: available here again anytime.');

  // -- Card: Einstellungen ------------------------------------------------------------------
  add('card.settings.title', 'Einstellungen', 'Settings');
  add('hint.settings.desktop', 'Schalte einzelne Zusatzfunktionen ein oder aus: deine Wahl wird direkt im Browser gespeichert. Klick auf „i“ zeigt eine kurze Erklärung.',
    'Turn individual extra features on or off: your choice is saved directly in the browser. Click "i" for a short explanation.');
  // Design-System-Import Zyklus 5 (v4.4.0): Mobil teilt die bisher eine große
  // Einstellungen-Karte jetzt in zwei Cards ("Anzeige" + "Funktionen") auf und zeigt
  // jeden Erklärtext dauerhaft als .hint statt hinter einem Info-Knopf -- der alte
  // Hinweis auf den "i"-Knopf entfällt deshalb hier (Desktop bleibt unverändert,
  // behält card.settings.title/hint.settings.desktop samt Info-Knopf-Muster).
  add('card.settingsDisplay.title', 'Anzeige', 'Display');
  add('card.settingsFunctions.title', 'Funktionen', 'Features');
  add('hint.settings.mobile', 'Schalte einzelne Zusatzfunktionen ein oder aus: deine Wahl wird direkt im Browser gespeichert.',
    'Turn individual extra features on or off: your choice is saved directly in the browser.');
  add('flag.timer.name', 'Gärzeit-Timer', 'Rise timer');
  add('flag.timer.infoBtn', 'Erklärung zu „Gärzeit-Timer“ ein-/ausblenden', 'Show/hide explanation for "Rise timer"');
  add('flag.timer.info', 'Countdown mit optionalem Wecker für jeden Anleitungsschritt (z. B. Stockgare, Stückgare).',
    'Countdown with an optional alarm for every guide step (e.g. bulk rise, final proof).');
  add('flag.timerSystem.name', 'System-Wecker', 'System alarm');
  add('flag.timerSystem.infoBtn', 'Erklärung zu „System-Wecker“ ein-/ausblenden', 'Show/hide explanation for "System alarm"');
  add('flag.timerSystem.info', 'Zusätzliche Links zum Android-Wecker oder Kalender, direkt beim Timer.',
    'Extra links to the Android alarm or calendar, right next to the timer.');
  add('flag.hints.name', 'Hinweistexte', 'Hint texts');
  add('flag.hints.infoBtn', 'Erklärung zu „Hinweistexte“ ein-/ausblenden', 'Show/hide explanation for "Hint texts"');
  add('flag.hints.info', 'Erklärende Kurztexte bei Feldern & Buttons ein- oder ausblenden.', 'Turn short explanatory texts on fields & buttons on or off.');
  // -- Globale Hefemengen-/Verschwendungs-Anpassung (v3.64.0) -------------------------
  add('flag.yeastAdjust.name', 'Hefemenge anpassen', 'Adjust yeast amount');
  add('flag.yeastAdjust.infoBtn', 'Erklärung zu „Hefemenge anpassen“ ein-/ausblenden', 'Show/hide explanation for "Adjust yeast amount"');
  add('flag.yeastAdjust.info',
    'Persönliche Kalibrierung, falls deine Hefe regelmäßig stärker oder schwächer aufgeht als berechnet: gilt für jedes Rezept gleichermaßen. 0 % = keine Änderung.',
    'Personal calibration if your yeast consistently rises stronger or weaker than calculated: applies to every recipe equally. 0% = no change.');
  add('adjust.yeastAdjust.decrease', 'Hefemenge verringern', 'Decrease yeast amount');
  add('adjust.yeastAdjust.increase', 'Hefemenge erhöhen', 'Increase yeast amount');
  add('flag.wasteAdjust.name', 'Verschwendung anpassen', 'Adjust waste buffer');
  add('flag.wasteAdjust.infoBtn', 'Erklärung zu „Verschwendung anpassen“ ein-/ausblenden', 'Show/hide explanation for "Adjust waste buffer"');
  add('flag.wasteAdjust.info',
    'Erhöht das errechnete Gesamtgewicht um einen Puffer für Kneteverluste (Schüssel, Hände, Maschine): damit am Ende trotzdem die gewünschte Anzahl Teiglinge im Zielgewicht rauskommt.',
    'Increases the calculated total dough weight by a buffer for kneading losses (bowl, hands, machine): so you still end up with the desired number of dough balls at the target weight.');
  add('adjust.wasteAdjust.decrease', 'Verschwendungspuffer verringern', 'Decrease waste buffer');
  add('adjust.wasteAdjust.increase', 'Verschwendungspuffer erhöhen', 'Increase waste buffer');
  add('result.wasteNote', 'inkl. {pct} % Verschwendungspuffer', 'incl. {pct}% waste buffer');
  add('flag.lang.name', 'Sprache', 'Language');
  add('flag.lang.infoBtn', 'Erklärung zu „Sprache“ ein-/ausblenden', 'Show/hide explanation for "Language"');
  add('flag.lang.info', 'Deutsch oder Englisch für die komplette Oberfläche, Anleitung und Exporte. Automatisch anhand deiner Browser-Sprache vorausgewählt, hier jederzeit manuell umschaltbar: deine Wahl wird gespeichert.',
    'German or English for the entire interface, guide and exports. Automatically pre-selected based on your browser language, switchable manually here anytime: your choice is saved.');
  add('lang.german', 'Deutsch', 'German');
  add('lang.english', 'Englisch', 'English');
  // Live-Region-Ansage nach manuellem Sprachwechsel (#langAnnounce, s. wireLangSwitch()
  // weiter unten): WCAG 4.1.3 Status Messages: ein Klick auf "Englisch"/"English" tauscht
  // die KOMPLETTE sichtbare Oberfläche aus (Labels, Anleitung, Hinweise), ohne dass sich
  // der Fokus bewegt. Für Screenreader-Nutzer ist das aria-pressed am geklickten Button
  // allein kein verlässlicher Beleg für eine derart große, seitenweite Änderung: analog
  // zum bestehenden #viewAnnounce-Muster beim Bereichswechsel (Burger-Nav, v3.26.0).
  add('lang.announce', 'Sprache: {lang}', 'Language: {lang}');
  // Dunkelmodus (v3.47.0, js/theme.js): identisches Umschalter-/Ansage-Muster wie die
  // Sprachwahl direkt darüber.
  add('flag.theme.name', 'Darstellung', 'Appearance');
  add('flag.theme.infoBtn', 'Erklärung zu „Darstellung“ ein-/ausblenden', 'Show/hide explanation for "Appearance"');
  add('flag.theme.info', 'Hell oder Dunkel für die komplette Oberfläche. Folgt automatisch der Systemeinstellung deines Geräts, hier jederzeit manuell umschaltbar: deine Wahl wird gespeichert und übersteuert danach die Systemeinstellung.',
    'Light or dark for the entire interface. Automatically follows your device\'s system setting, switchable manually here anytime: your choice is saved and then overrides the system setting.');
  add('theme.light', 'Hell', 'Light');
  add('theme.dark', 'Dunkel', 'Dark');
  add('theme.announce', 'Darstellung: {theme}', 'Appearance: {theme}');
  // Einheitensystem-Umschaltung (v3.65.0, js/units.js): identisches Umschalter-/
  // Ansage-Muster wie Sprache/Darstellung direkt darüber. Betrifft NUR Anzeige/Ausgabe
  // (Ergebnis-Panel, Einkaufsliste, Anleitung, PDF-Export) — die Eingabe-Regler bleiben
  // unverändert in Gramm/Celsius, s. js/units.js.
  add('flag.units.name', 'Einheiten', 'Units');
  add('flag.units.infoBtn', 'Erklärung zu „Einheiten“ ein-/ausblenden', 'Show/hide explanation for "Units"');
  add('flag.units.info', 'Metrisch (Gramm, Celsius) oder Imperial (Unzen/Pfund, Fahrenheit) für Ergebnis-Panel, Einkaufsliste, Anleitung und PDF-Export. Automatisch anhand deiner Browser-Region vorausgewählt, hier jederzeit manuell umschaltbar: deine Wahl wird gespeichert. Die Eingabe-Regler (z. B. Teigling-Gewicht, Raumtemperatur) bleiben davon unberührt.',
    'Metric (grams, Celsius) or imperial (ounces/pounds, Fahrenheit) for the result panel, shopping list, guide and PDF export. Automatically pre-selected based on your browser region, switchable manually here anytime: your choice is saved. The input sliders (e.g. dough ball weight, room temperature) are not affected.');
  add('units.metric', 'Metrisch', 'Metric');
  add('units.imperial', 'Imperial', 'Imperial');
  add('units.announce', 'Einheiten: {units}', 'Units: {units}');

  // -- Card: Pizza Party --------------------------------------------------------------------
  add('card.party.title', 'Pizza Party', 'Pizza Party');
  add('hint.party', 'Wähle Pizzen mit Stückzahl aus: vorgegebene oder eigene, s. u. Unten erscheint eine aggregierte, ungefähre Zutatenliste für die ganze Party. Eigenständiger Bereich: die „Anzahl Teiglinge" im Rechner-Bereich wird hier nicht berücksichtigt.',
    'Choose pizzas with a quantity: preset or your own, see below. An aggregated, approximate ingredient list for the whole party appears below. Independent area: the "number of dough balls" in the Calculator area is not considered here.');
  add('card.newPizza.title', 'Eigene Pizza anlegen', 'Create a custom pizza');
  add('label.partyPizzaName', 'Name', 'Name');
  add('placeholder.partyPizzaName', 'z. B. Peperoni-Spezial', 'e.g. Pepperoni Special');
  add('label.partyIngredients', 'Zutaten (Menge pro EINER Pizza dieser Sorte)', 'Ingredients (amount per ONE pizza of this kind)');
  add('btn.addIngredient', '+ Zutat', '+ Ingredient');
  add('btn.createPizza', 'Pizza anlegen', 'Create pizza');
  add('hint.partyCreate', 'Bei der Auswahl oben wird die Menge automatisch mit der gewählten Stückzahl hochgerechnet.',
    'In the selection above, the amount is automatically scaled up by the chosen quantity.');
  add('card.partyResult.title', 'Zutatenliste für die Party', 'Ingredient list for the party');
  add('hint.partyResult', 'Ungefähre Richtmengen für den Einkauf: keine exakte Rezeptberechnung wie beim Teig.',
    'Approximate guideline amounts for shopping: not an exact recipe calculation like the dough.');

  // -- Quick-Bar (nur Mobil) -----------------------------------------------------------------
  add('quickbar.jumpToResult', 'Zum Ergebnis springen: ', 'Jump to result: ');
  add('quickbar.doughBalls', 'Teiglinge', 'dough balls');
  add('quickbar.jumpToPartyResult', 'Zur Zutatenliste springen: ', 'Jump to ingredient list: ');
  add('quickbar.partyNoneYet', 'Noch keine Pizza ausgewählt', 'No pizza selected yet');

  // ---- js/calc.js: Eiswasser-Hinweis (dynamisch berechneter Text) ----------------
  // Seit Backlog Punkt I (v4.11.0) und weiterhin seit v4.16.0 ("Schüttwasser-Anzeige
  // entfernen"): R.note (gebaut aus diesen Keys) wird in calcCore() weiterhin berechnet
  // (Energiebilanz-Formel technisch unverändert), aber NIRGENDS mehr im DOM angezeigt --
  // weder im Ergebnis-Panel (auch der bedingte Glossar-Verweis-Link ist seit v4.16.0 weg)
  // noch in der Anleitung. Die Keys bleiben stehen, da tests/test.html Sektion 2
  // weiterhin R.note direkt (nicht mehr über das DOM) gegen calc.noMixingWaterNote prüft.
  add('calc.ice.note', 'Nimm <b>{tapWater} Leitungswasser (~{tapTemp})</b> + <b>{ice} Eis</b>, ergibt ~{wT} Schüttwasser. Eis vorher abwiegen.',
    'Use <b>{tapWater} tap water (~{tapTemp})</b> + <b>{ice} ice</b>, giving ~{wT} mixing water. Weigh the ice beforehand.');
  add('calc.warmNote', 'Schüttwasser leicht anwärmen auf ~{wT} (z.B. handwarm).', 'Warm the mixing water slightly to ~{wT} (e.g. lukewarm).');
  add('calc.tapOkNote', 'Leitungswasser bei ~{tapTemp} passt direkt: kein Eis nötig.', 'Tap water at ~{tapTemp} works directly: no ice needed.');
  add('calc.veryColdWarn', ' <b>Achtung:</b> sehr kalt: ggf. Mehl vorher kühlen.', ' <b>Note:</b> very cold: consider chilling the flour beforehand.');
  // Grenzfall bei sehr hohem Vorteig-Anteil (z. B. Poolish an der Klemmgrenze): das
  // gesamte Wasser steckt im Vorteig, es gibt kein Hauptteig-Schüttwasser mehr zu
  // temperieren (Bugfix v3.48.0, s. pizza-rechner-KONTEXT.md).
  add('calc.noMixingWaterNote', 'Kein Schüttwasser mehr zu temperieren: bei diesem hohen Vorteig-Anteil steckt das gesamte Wasser bereits im Vorteig.',
    'No mixing water left to temper: at this high pre-ferment share, all the water is already in the pre-ferment.');

  // ---- js/storage.js: automatisch generierte Rezeptnamen -------------------------
  add('storage.migratedRecipeName', 'Mein Rezept', 'My recipe');
  add('storage.defaultRecipeName', 'Rezept {n}', 'Recipe {n}');
  add('storage.importedRecipeFallbackName', 'Importiertes Rezept', 'Imported recipe');
  add('storage.importedSuffix', '{name} (importiert)', '{name} (imported)');
  add('storage.importedSuffixN', '{name} (importiert {n})', '{name} (imported {n})');
  add('storage.duplicateName', 'Kopie von {name}', 'Copy of {name}');


  PZ._I18N_DICT = DICT; // Übergabe an js/i18n.js (lädt danach, übernimmt dieses DICT)
})(window);
