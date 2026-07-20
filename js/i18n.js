/* i18n.js — Deutsch/Englisch-Sprachversion (v3.28.0)
 *
 * Neues Feature, vom Nutzer per /define-feature strukturiert und bestätigt. Deckt die
 * KOMPLETTE Oberfläche ab: statische HTML-Texte (Labels, Buttons, Hinweise), die
 * generierte Schritt-für-Schritt-Anleitung (js/guide.js, js/schedule.js), den PDF-Export
 * (js/pdf.js), die Druckansicht/Einkaufsliste (js/print.js), den .ics-Kalendertext
 * (js/timer.js) sowie die Pizza-Party-Presets (js/party.js). Deutsch bleibt Standard/
 * Fallback, nur Deutsch/Englisch (kein weiteres Sprachenmenü).
 *
 * Architektur: ein zentrales Wörterbuch { de: {...}, en: {...} }, flach mit
 * punktnotierten Keys (z. B. "label.hyd"). PZ.t(key, vars) liefert den Text der
 * aktuell aktiven Sprache, interpoliert {platzhalter} in vars, fällt bei fehlendem
 * Key in der Zielsprache auf Deutsch zurück, und als allerletzten Rückfall auf den
 * Key selbst (kein Crash, kein leerer Text). Statische HTML-Texte werden per
 * data-i18n(-html|-attr)-Attribut deklarativ verdrahtet (applyStaticI18n()); alle
 * generierten/dynamischen Texte (guide.js, pdf.js, print.js, timer.js, party.js,
 * presets.js, ui.js, newrecipe.js, flour.js, main.js, share.js) rufen PZ.t() direkt auf.
 *
 * Sprachwahl (Feature-Auftrag): automatische Vorauswahl per navigator.language beim
 * ersten Aufruf (de/at/ch-Locales -> Deutsch, sonst Englisch), plus manueller Umschalter
 * in den Einstellungen, der die Automatik übersteuert und in localStorage persistiert
 * (eigener Key "pizzaLang", analog zu den bestehenden Feature-Flags in js/settings.js,
 * aber bewusst NICHT im selben Objekt/Key — Sprachwahl ist kein Ein/Aus-Flag und hat
 * eine eigene Persistenz-Semantik: "noch nie manuell gewählt" muss von "explizit auf
 * Deutsch gewählt" unterscheidbar bleiben, damit Auto-Erkennung nur beim ALLERERSTEN
 * Aufruf greift).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const LANG_KEY = 'pizzaLang';

  // ======================================================================
  // Wörterbuch
  // ======================================================================
  const DICT = {
    de: {},
    en: {}
  };

  // Kleiner Helfer fürs Befüllen: erspart bei jedem einzelnen Eintrag "DICT.de[...] =".
  function add(key, de, en) {
    DICT.de[key] = de;
    DICT.en[key] = en;
  }

  // ---- js/schedule.js — Gärzeit-Fahrplan (13 Zweige × label/bulk/proof) -------------
  add('sched.prefFast.label', 'Vorteig · Schnelle Hauptgare', 'Pre-ferment · Fast bulk rise');
  add('sched.prefFast.bulk', '<b>1–2 h</b> bei Raumtemp (Stockgare)', '<b>1–2 h</b> at room temp (bulk rise)');
  add('sched.prefFast.proof', '<b>2–3 h</b> bei Raumtemp · Fingertest', '<b>2–3 h</b> at room temp · finger test');
  add('sched.prefMedium.label', 'Vorteig · Mittlere Hauptgare', 'Pre-ferment · Medium bulk rise');
  add('sched.prefMedium.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)', '<b>2 h</b> at room temp (bulk rise)');
  add('sched.prefMedium.proof', '<b>3–5 h</b> bei Raumtemp · Fingertest', '<b>3–5 h</b> at room temp · finger test');
  add('sched.prefLong.label', 'Vorteig · Lange Hauptgare', 'Pre-ferment · Long bulk rise');
  add('sched.prefLong.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)', '<b>2–3 h</b> at room temp (bulk rise)');
  add('sched.prefLong.proof', '<b>5–7 h</b> bei Raumtemp · Fingertest', '<b>5–7 h</b> at room temp · finger test');
  add('sched.prefVeryLong.label', 'Vorteig · Sehr lange Hauptgare', 'Pre-ferment · Very long bulk rise');
  add('sched.prefVeryLongCold.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)', '<b>2–3 h</b> at room temp (bulk rise)');
  add('sched.prefVeryLongCold.proof', 'Teiglinge <b>12–16 h</b> Kühlschrank (4 °C), am Backtag <b>4–5 h</b> temperieren', 'Dough balls <b>12–16 h</b> in the fridge (4 °C), let come to room temp <b>4–5 h</b> on baking day');
  add('sched.prefVeryLongBulk.bulk', '<b>2–3 h</b> Raumtemp, dann <b>12–18 h</b> Kühlschrank', '<b>2–3 h</b> room temp, then <b>12–18 h</b> in the fridge');
  add('sched.prefVeryLongBulk.proof', 'Teiglinge <b>4–5 h</b> vor dem Backen temperieren', 'Let dough balls come to room temp <b>4–5 h</b> before baking');
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

  // ---- js/guide.js — Schritt-für-Schritt-Anleitung (dynamisch, mit {platzhaltern}) ---
  add('guide.title', 'Schritt-für-Schritt-Anleitung', 'Step-by-step guide');
  add('guide.weekday.0', 'So', 'Sun'); add('guide.weekday.1', 'Mo', 'Mon');
  add('guide.weekday.2', 'Di', 'Tue'); add('guide.weekday.3', 'Mi', 'Wed');
  add('guide.weekday.4', 'Do', 'Thu'); add('guide.weekday.5', 'Fr', 'Fri');
  add('guide.weekday.6', 'Sa', 'Sat');
  add('guide.dur.min', 'min', 'min');
  add('guide.dur.h', 'h', 'h');
  add('guide.dur.day', 'Tg', 'd');

  add('guide.warn.gareTooLong', 'Gärzeit zu lang für <b>{flourName}</b> (W{flourW}): ~{hours} h geplant, max. {maxH} h empfohlen. Das Gluten baut ab — Teig wird klebrig und reißt. Entweder stärkeres Mehl wählen oder Hefemenge erhöhen.',
    'Rise time too long for <b>{flourName}</b> (W{flourW}): ~{hours} h planned, max. {maxH} h recommended. Gluten breaks down — the dough gets sticky and tears. Either choose a stronger flour or increase the yeast amount.');
  add('guide.warn.gareTooShort', 'Gärzeit zu kurz für <b>{flourName}</b> (W{flourW}): ~{hours} h geplant, mind. {minH} h empfohlen. Das Gluten hat keine Zeit sich auszuentspannen — der Teig federt zurück und lässt sich kaum ausziehen. Entweder schwächeres Mehl wählen oder Hefemenge reduzieren.',
    'Rise time too short for <b>{flourName}</b> (W{flourW}): ~{hours} h planned, min. {minH} h recommended. The gluten has no time to relax — the dough springs back and is hard to stretch. Either choose a weaker flour or reduce the yeast amount.');
  add('guide.warn.hydTooHigh', 'Hydration zu hoch für <b>{flourName}</b>: {hyd} % gewählt, max. {hydMax} % empfohlen. Der Teig kann sehr klebrig werden und schwer zu formen sein.',
    'Hydration too high for <b>{flourName}</b>: {hyd} % chosen, max. {hydMax} % recommended. The dough can become very sticky and hard to shape.');
  add('guide.warn.hydTooLow', 'Hydration etwas niedrig für <b>{flourName}</b>: {hyd} % gewählt, {hydMin}–{hydMax} % wären ideal.',
    'Hydration a bit low for <b>{flourName}</b>: {hyd} % chosen, {hydMin}–{hydMax} % would be ideal.');

  add('guide.sec.prefBiga', 'Vorteig — Biga ansetzen', 'Pre-ferment — mix the biga');
  add('guide.sec.prefPoolish', 'Vorteig — Poolish ansetzen', 'Pre-ferment — mix the poolish');
  add('guide.sec.main', 'Hauptteig', 'Final dough');
  add('guide.sec.prep', 'Vorbereitung', 'Preparation');
  add('guide.sec.knead', 'Kneten', 'Kneading');
  add('guide.sec.rise', 'Gare & Formen', 'Rise & shaping');
  add('guide.sec.bake', 'Backen', 'Baking');

  add('guide.step.prefWeigh.title', 'Vorteig abwiegen', 'Weigh the pre-ferment');
  add('guide.chip.5min', '~5 min', '~5 min');
  add('guide.step.prefWeigh.body', 'Für den {prefName}: <b>{pf} g Mehl</b>, <b>{pw} g Wasser</b> ({hydTxt}) und <b>{pYeast} g Hefe {yWord}</b>.',
    'For the {prefName}: <b>{pf} g flour</b>, <b>{pw} g water</b> ({hydTxt}) and <b>{pYeast} g {yWord} yeast</b>.');
  add('guide.pref.poolishRatio', '100% — also 1:1', '100% — i.e. 1:1');
  add('guide.pref.clampNote', 'Der Vorteig-Anteil wurde automatisch auf <b>{prefEff} %</b> begrenzt: bei {hyd} % Hydration passt nicht mehr Wasser in den {prefType} als insgesamt im Teig ist.',
    'The pre-ferment share was automatically capped at <b>{prefEff} %</b>: at {hyd} % hydration, the {prefType} can\'t hold more water than the whole dough contains.');
  add('guide.step.prefWeigh.tip', 'Wasser hier <b>zimmerwarm</b> (nicht eisgekühlt) – der Vorteig soll ja in Ruhe arbeiten.',
    'Use <b>room-temperature</b> water here (not ice-cold) — the pre-ferment should work slowly and calmly.');

  add('guide.step.bigaMix.title', 'Biga grob mischen', 'Roughly mix the biga');
  add('guide.step.bigaMix.chip', 'mit der Hand', 'by hand');
  add('guide.step.bigaMix.body', 'Hefe im Wasser auflösen, übers Mehl geben und <b>mit den Händen nur grob vermengen</b> – ca. <b>1–2 min</b>, bis keine trockenen Mehlnester mehr da sind. Die Biga bleibt krümelig-stückig, <b>nicht glatt kneten</b>. (Hier keine Maschine nutzen – zu festes Kneten zerstört die Struktur.)',
    'Dissolve the yeast in the water, pour over the flour and <b>mix roughly by hand only</b> — about <b>1–2 min</b>, until there are no dry flour pockets left. The biga stays crumbly and lumpy, <b>do not knead it smooth</b>. (Don\'t use a machine here — kneading it too firm destroys the structure.)');
  add('guide.step.bigaMix.warn', 'Es soll aussehen wie nasse Brösel oder grober Streusel, nicht wie ein normaler Teig.',
    'It should look like wet breadcrumbs or coarse crumble, not like a normal dough.');
  add('guide.biga.temp.cool', 'Abgedeckt bei <b>ca. 18 °C</b> reifen lassen (Keller, Speisekammer, Kühlschranktür).',
    'Let it rise covered at <b>about 18 °C</b> (cellar, pantry, fridge door).');
  add('guide.biga.temp.cooler', 'Abgedeckt <b>kühl bei ~14–16 °C</b> reifen lassen (kühler Keller / Kühlschranktür).',
    'Let it rise covered at a <b>cool ~14–16 °C</b> (cool cellar / fridge door).');
  add('guide.biga.temp.cold', '<b>2 h</b> bei Raumtemp anspringen lassen, dann in den <b>Kühlschrank (4–6 °C)</b>.',
    'Let it start for <b>2 h</b> at room temp, then into the <b>fridge (4–6 °C)</b>.');
  add('guide.step.bigaRest.title', 'Biga reifen lassen', 'Let the biga rise');
  add('guide.step.bigaRest.body', '{bigaTempTxt} Sie lockert sich auf und duftet säuerlich-hefig.',
    '{bigaTempTxt} It loosens up and smells tangy-yeasty.');
  add('guide.step.bigaRest.tip', 'Längere Reife braucht <b>weniger Hefe</b> im Vorteig und/oder <b>kühlere</b> Lagerung. Fertig = luftig-schwammig, gerade eben eingefallen.',
    'A longer rise needs <b>less yeast</b> in the pre-ferment and/or <b>cooler</b> storage. Ready = airy and spongy, just barely starting to collapse.');

  add('guide.step.poolishMix.title', 'Poolish verrühren', 'Stir the poolish');
  add('guide.step.poolishMix.chip', 'mit Löffel / Schneebesen', 'with a spoon / whisk');
  add('guide.step.poolishMix.body', 'Hefe im Wasser auflösen, dann Mehl einrühren – <b>mit einem Löffel oder Schneebesen ca. 2–3 min rühren</b>, bis ein <b>zäher, klumpenfreier Pfannkuchenteig</b> entsteht. Abdecken.',
    'Dissolve the yeast in the water, then stir in the flour — <b>stir with a spoon or whisk for about 2–3 min</b> until you get a <b>thick, lump-free pancake-batter consistency</b>. Cover.');
  add('guide.poolish.temp.warm', '<b>1 h</b> bei Raumtemp anspringen lassen, dann bei <b>~20 °C</b> ausreifen.',
    'Let it start for <b>1 h</b> at room temp, then let it fully rise at <b>~20 °C</b>.');
  add('guide.poolish.temp.cold', '<b>1 h</b> bei Raumtemp anspringen lassen, dann <b>kühl stellen (Kühlschrank)</b> und langsam ausreifen.',
    'Let it start for <b>1 h</b> at room temp, then place it <b>in the fridge</b> to rise slowly.');
  add('guide.step.poolishRest.title', 'Poolish reifen lassen', 'Let the poolish rise');
  add('guide.step.poolishRest.body', '{poolishTempTxt} Reif = Oberfläche <b>voller Blasen</b>, kurz bevor er wieder einfällt.',
    '{poolishTempTxt} Ripe = surface <b>full of bubbles</b>, just before it starts to collapse again.');
  add('guide.step.poolishRest.tip', 'Fingertest: riecht angenehm nach Hefe/Joghurt, nicht stechend nach Alkohol. Länger als ~24 h zieht er nicht durch.',
    'Finger test: smells pleasantly of yeast/yogurt, not sharply of alcohol. It won\'t hold up much longer than ~24 h.');

  add('guide.step.waterTemp.title', 'Schüttwasser temperieren', 'Temper the mixing water');
  add('guide.step.waterTemp.body', '<b>{mWater} g Wasser</b> auf <b>{wT} °C</b> bringen{iceTxt}. Das ist das Restwasser für den Hauptteig.',
    'Bring <b>{mWater} g water</b> to <b>{wT} °C</b>{iceTxt}. This is the remaining water for the final dough.');
  add('guide.step.waterTemp.tip', 'Eis vorher exakt abwiegen und auflösen, bis die Zieltemperatur steht.',
    'Weigh the ice precisely beforehand and let it melt in until the target temperature is reached.');
  add('guide.iceTxt', ' (davon <b>{ice} g Eis</b>)', ' (of which <b>{ice} g is ice</b>)');

  add('guide.pref.addWater', 'mit dem <b>{mWater} g Wasser</b> lösen', 'dissolve it with the <b>{mWater} g water</b>');
  add('guide.pref.addFlour', '<b>{mFlour} g Mehl</b>{yeastPart}{sugarPart} zugeben', 'add <b>{mFlour} g flour</b>{yeastPart}{sugarPart}');
  add('guide.pref.addFlour.yeastPart', ' und <b>{mYeast} g Hefe {yWord}</b>', ' and <b>{mYeast} g {yWord} yeast</b>');
  add('guide.pref.addFlour.sugarPart', ' und <b>{sugar} g Zucker</b>', ' and <b>{sugar} g sugar</b>');
  add('guide.pref.noAddParts', 'in die Schüssel geben', 'pour it into the bowl');
  add('guide.pref.joinThen', ', dann ', ', then ');
  add('guide.titleSuffix.water', ' + Wasser', ' + water');
  add('guide.titleSuffix.flour', ' + Mehl', ' + flour');
  add('guide.titleSuffix.sugar', ' + Zucker', ' + sugar');
  // Generischer Begriff "Vorteig" (Pre-ferment) als Schritt-Titel-Basis — bewusst NICHT
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
  add('guide.step.saltAdd.body', 'Erst wenn alles grob zusammenhängt, <b>{salt} g Salz</b> {saltPhrase}{oilStep}',
    'Only once everything roughly holds together, {saltPhrase} the <b>{salt} g salt</b>{oilStep}');
  add('guide.salt.machine', 'zugeben und <b>weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.',
    'add and <b>work in for another 2–3 min on medium speed</b>.');
  add('guide.salt.hand', 'einstreuen und <b>von Hand ca. 2–3 min einkneten</b>.',
    'sprinkle in and <b>knead in by hand for about 2–3 min</b>.');
  add('guide.step.saltAdd.warn', 'Salz nie direkt auf die Hefe – es bremst sie. Immer zeitversetzt zugeben.',
    'Never put salt directly on the yeast — it slows it down. Always add it with a delay.');
  add('guide.oilStep', ' Zum Schluss <b>{oil} g Olivenöl</b> nach und nach einarbeiten, bis der Teig es vollständig aufgenommen hat und wieder glatt ist.',
    ' Finally, work in <b>{oil} g olive oil</b> gradually, until the dough has fully absorbed it and is smooth again.');
  add('guide.oilTip', 'Öl <b>erst nach dem Salz</b> zugeben — kommt es zu früh, umhüllt es das Mehl und stört die Glutenbildung. Langsam einarbeiten, dann wird der Teig geschmeidig.',
    'Add the oil <b>only after the salt</b> — added too early, it coats the flour and disrupts gluten development. Work it in slowly for a supple dough.');
  add('guide.sugarPhrase', ' sowie <b>{sugar} g Zucker</b>', ' as well as <b>{sugar} g sugar</b>');
  add('guide.sugarTip', 'Zucker <b>früh mit Mehl, Wasser &amp; Hefe</b> zugeben — er unterstützt die Hefeaktivität und sorgt beim Backen für die typische New-York-Style-Krustenbräunung.',
    'Add sugar <b>early, with the flour, water &amp; yeast</b> — it supports yeast activity and gives the typical New-York-style crust browning during baking.');

  add('guide.step.weighIngredients.title', 'Zutaten abwiegen', 'Weigh the ingredients');
  add('guide.step.weighIngredients.body', '<b>{flour} g Mehl</b> · <b>{water} g Wasser</b> · <b>{salt} g Salz</b> · <b>{yeast} g Hefe {yWord}</b>{sugarPart}{oilPart}.',
    '<b>{flour} g flour</b> · <b>{water} g water</b> · <b>{salt} g salt</b> · <b>{yeast} g {yWord} yeast</b>{sugarPart}{oilPart}.');
  add('guide.weighIngredients.sugarPart', ' · <b>{sugar} g Zucker</b>', ' · <b>{sugar} g sugar</b>');
  add('guide.weighIngredients.oilPart', ' · <b>{oil} g Olivenöl</b>', ' · <b>{oil} g olive oil</b>');
  add('guide.step.weighIngredients.tip', 'Für Hefe & Salz eine <b>0,1-g-Feinwaage</b> nutzen – bei diesen kleinen Mengen entscheidend.',
    'Use a <b>precision scale (0.1 g)</b> for yeast &amp; salt — essential at these small amounts.');
  add('guide.step.waterTempDirect.body', 'Das <b>{water} g Wasser</b> auf <b>{wT} °C</b> bringen{iceTxt}. So landet der Teig nach dem Kneten bei ~{ddt} °C.',
    'Bring the <b>{water} g water</b> to <b>{wT} °C</b>{iceTxt}. That way the dough lands at ~{ddt} °C after kneading.');
  add('guide.step.waterTempDirect.tip', 'Eis abwiegen, im Wasser auflösen bis die Temperatur passt – dann erst loslegen.',
    'Weigh the ice, let it melt in the water until the temperature is right — only then start.');
  add('guide.reserveWaterTip', 'Behalte <b>2–3 EL vom Schüttwasser</b> zurück, um danach die Hefe darin aufzulösen.',
    'Set aside <b>2–3 tbsp of the mixing water</b> to dissolve the yeast in afterwards.');
  add('guide.step.autolyse.title', 'Autolyse (empfohlen)', 'Autolyse (recommended)');
  add('guide.step.autolyse.chip', '20–40 min', '20–40 min');
  add('guide.step.autolyse.body', 'Nur <b>Mehl + Wasser</b> grob mischen (Salz und Hefe kommen erst später), abdecken, ruhen lassen. Weniger Knetarbeit, dehnbarerer Teig.',
    'Roughly mix just <b>flour + water</b> (salt and yeast come later), cover, let it rest. Less kneading work, a more extensible dough.');
  add('guide.step.autolyse.warn', 'Ohne Salz arbeiten die Enzyme im Mehl ungebremst – <b>Autolyse nicht über ~40–60 min ausdehnen</b>. Länger baut das Klebergerüst eher ab als auf (Teig wird zunehmend klebrig-schwach statt elastisch).',
    'Without salt, the enzymes in the flour work unchecked — <b>don\'t extend the autolyse beyond ~40–60 min</b>. Longer breaks the gluten structure down rather than building it up (the dough gets increasingly sticky-weak instead of elastic).');
  add('guide.step.addYeast.title', 'Hefe zugeben', 'Add the yeast');
  add('guide.chip.2min', '~2 min', '~2 min');
  add('guide.yeastType.dry', 'Trockenhefe', 'dry yeast');
  add('guide.yeastType.fresh', 'Frischhefe', 'fresh yeast');
  add('guide.yeast.tinyBody', 'Bei dieser sehr kleinen Menge (<b>{yeast} g</b>) die {yeastTypeName} im <b>zurückbehaltenen Wasser auflösen</b> und gleichmäßig über den Teig geben – trocken eingestreut verteilt sie sich bei so wenig Menge kaum gleichmäßig.',
    'At this very small amount (<b>{yeast} g</b>), dissolve the {yeastTypeName} in the <b>reserved water</b> and pour it evenly over the dough — sprinkled in dry, it barely distributes evenly at such a small quantity.');
  add('guide.yeast.dryBody', 'Trockenhefe gleichmäßig <b>über den Autolyse-Teig streuen</b> und kurz einarbeiten.',
    'Sprinkle dry yeast evenly <b>over the autolyse dough</b> and briefly work it in.');
  add('guide.yeast.freshBody', 'Frischhefe im <b>zurückbehaltenen Wasser auflösen</b> und über den Teig geben.',
    'Dissolve fresh yeast in the <b>reserved water</b> and pour it over the dough.');
  add('guide.yeast.tinyTip', 'Für so kleine Mengen eine <b>0,01-g-Feinwaage</b> nutzen – normale Küchenwaagen liegen hier schnell 30 % daneben.',
    'Use a <b>0.01 g precision scale</b> for such small amounts — regular kitchen scales can easily be off by 30 % here.');
  add('guide.step.dissolveYeast.title', 'Hefe lösen', 'Dissolve the yeast');
  add('guide.yeast.dryDirect', 'Trockenhefe <b>direkt ins Mehl</b> mischen – sie muss nicht vorgelöst werden.',
    'Mix dry yeast <b>directly into the flour</b> — it doesn\'t need to be dissolved first.');
  add('guide.yeast.freshDirect', 'Frischhefe im <b>temperierten Wasser auflösen</b>, bis keine Stückchen mehr da sind.',
    'Dissolve fresh yeast in the <b>tempered water</b> until no lumps remain.');

  add('guide.step.mixSalt.title', 'Mischen', 'Mix');
  add('guide.suffix.sugar', ' &amp; Zucker', ' &amp; sugar');
  add('guide.suffix.salt', ' &amp; Salz', ' &amp; salt');
  add('guide.mixSalt.machine', 'Mehl, Wasser & Hefe{sugarPhrase} in die Maschine geben und <b>ca. 2–3 min auf niedriger Stufe vermengen</b>, dann <b>{salt} g Salz zugeben und weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.',
    'Put flour, water &amp; yeast{sugarPhrase} in the machine and <b>mix on low speed for about 2–3 min</b>, then <b>add the {salt} g salt and work in for another 2–3 min on medium speed</b>.');
  add('guide.mixSalt.hand', 'Mehl, Wasser & Hefe{sugarPhrase} <b>von Hand ca. 3–5 min grob vermengen</b> (bis kein trockenes Mehl mehr bleibt), dann <b>{salt} g Salz einstreuen und weitere 2–3 min einkneten</b>.',
    'Roughly <b>mix flour, water &amp; yeast{sugarPhrase} by hand for about 3–5 min</b> (until no dry flour remains), then <b>sprinkle in the {salt} g salt and knead for another 2–3 min</b>.');
  add('guide.step.mixSalt.warn', 'Salz zeitversetzt zur Hefe zugeben – nie direkt aufeinander.',
    'Add the salt with a delay after the yeast — never put them directly together.');

  add('guide.step.stretchFold.title', 'Stretch &amp; Fold statt Kneten', 'Stretch &amp; fold instead of kneading');
  add('guide.step.stretchFold.chip', '4 × alle 30 min', '4 × every 30 min');
  add('guide.step.stretchFold.body', 'Bei <b>{hyd}% Hydration</b> ist der Teig zu klebrig zum klassischen Kneten. Kurz mischen, dann <b>4 Runden Dehnen & Falten</b> alle 30 min mit <b>nassen Händen</b>.',
    'At <b>{hyd}% hydration</b> the dough is too sticky for classic kneading. Mix briefly, then do <b>4 rounds of stretch &amp; fold</b> every 30 min with <b>wet hands</b>.');
  add('guide.step.stretchFold.tip', 'Zwischen den Runden abgedeckt ruhen lassen – das Gluten entwickelt sich von selbst.',
    'Let it rest covered between rounds — the gluten develops on its own.');
  add('guide.step.knead.title', 'Kneten', 'Knead');
  add('guide.step.knead.chipMachine', '8–12 min', '8–12 min');
  add('guide.step.knead.chipHand', '10–15 min', '10–15 min');
  add('guide.knead.machineBody', 'Maschine: <b>8–12 min</b> auf niedriger/mittlerer Stufe', 'Machine: <b>8–12 min</b> on low/medium speed');
  add('guide.knead.handBody', 'Von Hand: <b>10–15 min</b> (kneten, dehnen, falten)', 'By hand: <b>10–15 min</b> (knead, stretch, fold)');
  add('guide.step.knead.bodySuffix', ', bis der Teig <b>glatt & elastisch</b> ist. Fenstertest: dünn ausziehbar ohne zu reißen.',
    ', until the dough is <b>smooth &amp; elastic</b>. Windowpane test: stretches thin without tearing.');
  add('guide.step.checkTemp.title', 'Teigtemperatur prüfen', 'Check the dough temperature');
  add('guide.step.checkTemp.chip', 'Ziel 23–25 °C', 'Target 23–25 °C');
  add('guide.step.checkTemp.body', 'Thermometer in den Teig: <b>{ddt} °C</b> angepeilt. Wärmer → schnellere Gare, kälter → langsamer.',
    'Thermometer into the dough: targeting <b>{ddt} °C</b>. Warmer → faster rise, colder → slower.');

  add('guide.step.bulkRise.title', 'Stockgare (im Stück)', 'Bulk rise (whole dough)');
  add('guide.step.bulkRise.chipColdBalls', 'Raumtemp + kühl', 'Room temp + cold');
  add('guide.step.bulkRise.chipDefault', 'Raumtemp', 'Room temp');
  add('guide.step.bulkRise.body', 'Teig zur Kugel formen, in eine geölte/abgedeckte Schüssel. {bulk}.',
    'Shape the dough into a ball, place in an oiled/covered bowl. {bulk}.');
  add('guide.step.formBalls.title', 'Teiglinge formen', 'Shape the dough balls');
  add('guide.step.formBalls.body', 'In <b>{N} Stücke à {W} g</b> teilen. Jedes zu einer <b>straffen Kugel</b> formen (Oberfläche spannen, Schluss nach unten). Mit Abstand in eine {boxTxt}.',
    'Divide into <b>{N} pieces of {W} g each</b>. Shape each into a <b>tight ball</b> (tension on the surface, seam down). Place with space between them in a {boxTxt}.');
  add('guide.box.cold', 'kühlschranktaugliche, dicht schließende Box', 'fridge-safe, tightly sealing container');
  add('guide.box.normal', 'Box', 'container');
  add('guide.step.formBalls.tip', 'Straff geformte Kugeln = runde Pizzen mit gleichmäßigem Rand (Cornicione).',
    'Tightly shaped balls = round pizzas with an even rim (cornicione).');
  add('guide.freezeTip', 'Einfrieren möglich: Teiglinge dünn mit Öl bestreichen, einzeln (nicht berührend) einfrieren – so <b>2–3 Monate</b> haltbar. Auftauen: <b>über Nacht im Kühlschrank</b>, dann <b>3–5 h bei Raumtemperatur</b> und <b>2–4 h Stückgare</b> wie gewohnt.',
    'Freezing works too: brush the dough balls thinly with oil, freeze individually (not touching) — keeps for <b>2–3 months</b>. Thawing: <b>overnight in the fridge</b>, then <b>3–5 h at room temperature</b> and a normal <b>2–4 h final proof</b>.');
  add('guide.step.finalProof.title', 'Stückgare (Teiglinge)', 'Final proof (dough balls)');
  add('guide.step.finalProof.chipCold', 'kühl · Fingertest', 'cold · finger test');
  add('guide.step.finalProof.chipDefault', 'Fingertest', 'finger test');
  add('guide.step.finalProof.body', '{proof}. <b>Fertig</b>, wenn ein leichter Fingerdruck <b>langsam</b> zurückfedert (eine kleine Delle bleibt).',
    '{proof}. <b>Ready</b> when a light finger press springs back <b>slowly</b> (a small dent remains).');
  add('guide.step.finalProof.tip', 'Teiglinge vor dem Backen wirklich auf Raumtemperatur kommen lassen – kalter Teig reißt beim Ausziehen.',
    'Really let the dough balls come to room temperature before baking — cold dough tears when stretched.');

  add('guide.step.preheat.title', 'Ofen vorheizen', 'Preheat the oven');
  add('guide.step.preheat.chip', '30–45 min', '30–45 min');
  add('guide.step.preheat.body', 'Pizzastein/-stahl auf <b>höchste Stufe</b> vorheizen. Pizzaofen (Gas/Holz) <b>430–480 °C</b>; Haushaltsofen Maximum (250–300 °C) + Grill, Stein ganz oben.',
    'Preheat the pizza stone/steel on the <b>highest setting</b>. Pizza oven (gas/wood) <b>430–480 °C</b>; home oven maximum (250–300 °C) + grill/broiler, stone at the top.');
  add('guide.step.preheat.tip', 'Der Stein muss richtig durchglühen – lieber 10 min länger. (Startzeit = 50 min vor dem Backen.)',
    'The stone needs to really heat through — better 10 min too long. (Start time = 50 min before baking.)');
  add('guide.step.shape.title', 'Pizza ausziehen', 'Stretch the pizza');
  add('guide.step.shape.chip', 'kein Nudelholz!', 'no rolling pin!');
  add('guide.step.shape.body', 'Teigling in Mehl/Grieß betten, von der Mitte mit den <b>Fingerspitzen flachdrücken</b>, Rand (~1,5 cm) stehen lassen, über die Handrücken auf Größe ziehen.',
    'Bed the dough ball in flour/semolina, <b>flatten from the center with your fingertips</b>, leave the rim (~1.5 cm) untouched, stretch to size over the backs of your hands.');
  add('guide.step.shape.warn', 'Nie ein Nudelholz – das drückt die Luft aus dem Rand. Der Cornicione lebt von der Gärblase.',
    'Never use a rolling pin — it presses the air out of the rim. The cornicione lives off that trapped gas.');
  add('guide.bake.small', 'Pizzaofen bei ~450 °C: <b>60–90 Sekunden</b> (einmal drehen). Haushaltsofen: <b>5–8 min</b> unter dem Grill.',
    'Pizza oven at ~450 °C: <b>60–90 seconds</b> (turn once). Home oven: <b>5–8 min</b> under the grill/broiler.');
  add('guide.bake.large', 'Größere Teiglinge: Pizzaofen <b>~2 min</b>, Haushaltsofen <b>8–12 min</b>.',
    'Larger dough balls: pizza oven <b>~2 min</b>, home oven <b>8–12 min</b>.');
  add('guide.step.bakeTopping.title', 'Belegen & Backen', 'Top & bake');
  add('guide.step.bakeTopping.body', 'Zügig belegen (wenig Sauce, gut abgetropfter Mozzarella), sofort einschießen. {bakeTxt} Fertig beim <b>aufgegangenen, gefleckten Rand</b> (Leoparding).',
    'Top quickly (little sauce, well-drained mozzarella), launch immediately. {bakeTxt} Done when the rim is <b>puffed up and leopard-spotted</b>.');
  add('guide.step.bakeTopping.tip', 'Alles vorher bereitstellen – ab dem Ausziehen geht es schnell.',
    'Have everything ready beforehand — once you start stretching it goes fast.');

  add('guide.schedbar.withTime', '⏱️ <b>Gesamtdauer ca. {dur}</b><br><span class="big">▶ Start {startClock}</span> &nbsp;→&nbsp; <span class="big">🍕 Fertig {endClock}</span>',
    '⏱️ <b>Total time approx. {dur}</b><br><span class="big">▶ Start {startClock}</span> &nbsp;→&nbsp; <span class="big">🍕 Ready {endClock}</span>');
  add('guide.summary.withTime', '{label} · {N} × {W} g · {hyd}% Hydration', '{label} · {N} × {W} g · {hyd}% hydration');
  add('guide.schedbar.noTime', '⏱️ Gesamtdauer ca. <b>{dur}</b> — gib oben eine <b>Start-</b> oder <b>Zielzeit</b> an, dann bekommt jeder Schritt eine Uhrzeit.',
    '⏱️ Total time approx. <b>{dur}</b> — enter a <b>start</b> or <b>target time</b> above, then every step gets a clock time.');
  add('guide.summary.noTime', '{label} · Gesamt ~{dur}', '{label} · Total ~{dur}');

  // ---- js/party.js — Pizza-Party-Planer: 8 Presets + UI-Strings -----------------------
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
  add('party.noneSelectedHint', 'Noch keine Pizza ausgewählt — stelle oben Stückzahlen ein.', 'No pizza selected yet — set the quantities above.');
  add('party.summaryOne', '1 Pizza insgesamt', '1 pizza in total');
  add('party.summaryMany', '{n} Pizzen insgesamt', '{n} pizzas in total');
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
  add('hint.partyReset', 'Setzt nur die Stückzahlen zurück — deine eigenen Pizzen bleiben erhalten.', 'Only resets the quantities — your custom pizzas stay saved.');
  add('party.resetMsg', 'Alle Stückzahlen wurden zurückgesetzt.', 'All quantities have been reset.');

  // ---- js/print.js — Einkaufsliste (Druckansicht) --------------------------------
  add('print.title', '🛒 Einkaufsliste', '🛒 Shopping list');
  add('print.flour', 'Mehl', 'Flour');
  add('print.water', 'Wasser', 'Water');
  add('print.salt', 'Salz', 'Salt');
  add('print.yeast', 'Hefe', 'Yeast');
  add('print.oil', 'Olivenöl', 'Olive oil');
  add('print.ice', 'Eis (für Schüttwasser)', 'Ice (for mixing water)');
  add('print.totalDough', 'Gesamtteig', 'Total dough');

  // ---- js/pdf.js — nur die wenigen Strings, die NICHT bereits per DOM aus guide.js
  // kommen (der Rest wird 1:1 aus dem bereits übersetzten, gerenderten Anleitungs-DOM
  // gelesen — s. Kommentar in js/pdf.js) --------------------------------------------
  add('pdf.tipPrefix', 'Tipp: ', 'Tip: ');
  add('pdf.warnPrefix', 'Achtung: ', 'Note: ');
  add('pdf.notCalculatedYet', 'Noch keine Anleitung berechnet.', 'No guide calculated yet.');
  add('pdf.savedMsg', 'Anleitung als PDF gespeichert.', 'Guide saved as PDF.');

  // ---- js/timer.js — Gärzeit-Timer/Wecker + .ics-Kalendertext --------------------
  add('timer.done', '🔔 Fertig!', '🔔 Done!');
  add('timer.reset', 'Zurücksetzen', 'Reset');
  // Aufgeteilt (statt eines Templates mit {clock}), weil der Countdown-Wert live per
  // JS in einem eigenen <span class="timerclock-val"> aktualisiert wird (s. js/timer.js
  // startTick()) — das Template darf dieses Element nicht "flach" interpolieren.
  add('timer.remaining.prefix', '⏳ ', '⏳ ');
  add('timer.remaining.suffix', ' verbleibend', ' remaining');
  add('timer.cancel', 'Abbrechen', 'Cancel');
  add('timer.start', '⏰ Timer starten ({dur})', '⏰ Start timer ({dur})');
  add('timer.hint', 'ℹ️ Der Timer läuft nur, solange dieser Tab/dieses Fenster geöffnet ist — kein Wecker mehr, wenn du den Tab schließt.',
    'ℹ️ The timer only runs while this tab/window stays open — no alarm anymore once you close the tab.');
  add('timer.notificationTitle', '⏰ Timer fertig', '⏰ Timer done');
  add('timer.androidBtn', '📱 Android-Wecker stellen', '📱 Set Android alarm');
  add('timer.icsBtn', '📅 Kalender-Erinnerung', '📅 Calendar reminder');
  add('timer.hint.android', 'Öffnet die Uhr-App mit vorausgefülltem Timer (Chrome) — oder lade alternativ eine Kalender-Erinnerung herunter.',
    'Opens the clock app with a pre-filled timer (Chrome) — or download a calendar reminder instead.');
  add('timer.hint.ios', 'iOS bietet keine Web-Schnittstelle für System-Timer — lade stattdessen eine Kalender-Erinnerung herunter (öffnet die Kalender-App mit Alarm zur richtigen Zeit).',
    'iOS has no web interface for system timers — download a calendar reminder instead (opens the calendar app with an alert at the right time).');
  add('timer.androidDefaultLabel', 'Pizza-Teig', 'Pizza dough');
  add('timer.icsDefaultLabel', 'Pizza-Timer', 'Pizza timer');
  add('timer.icsSummaryPrefix', '🍕 ', '🍕 ');
  add('timer.icsDescription', 'Erinnerung vom Teigmeister: {label} ist fertig.', 'Reminder from Teigmeister: {label} is done.');
  add('timer.notifyDefaultLabel', 'Timer', 'Timer');

  // ---- js/ui.js — aria-valuetext-Einheiten, Methode-Hinweise, Zeitplan-Labels ------
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
  add('hint.method.biga', 'Biga: steifer Vorteig (Vortag, 16–20 h bei ~18 °C). Mehr Aroma &amp; Struktur.', 'Biga: stiff pre-ferment (day before, 16–20 h at ~18 °C). More flavor &amp; structure.');
  add('hint.method.poolish', 'Poolish: flüssiger Vorteig 1:1 (12–16 h). Milder, dehnbarer Teig.', 'Poolish: liquid 1:1 pre-ferment (12–16 h). Milder, more extensible dough.');
  add('hint.yeast.pref', 'Wird von der <b>Vorteig-Reife</b> oben gesetzt. Feintuning per Regler möglich.', 'Set by the <b>pre-ferment maturity</b> above. Fine-tune with the slider if needed.');
  add('hint.yeast.normal', 'Prozent bezogen auf Frischhefe. Lange/warme Gare = weniger.', 'Percent based on fresh yeast. Longer/warmer rise = less.');
  add('label.prefTitle.biga', 'Biga (Vortag)', 'Biga (day before)');
  add('label.prefTitle.poolish', 'Poolish (Vortag)', 'Poolish (day before)');
  add('hint.pref.biga', 'Biga klassisch: 70–100 % des Mehls.', 'Classic biga: 70–100 % of the flour.');
  add('hint.pref.poolish', 'Poolish: meist 30–50 % des Mehls (Wasser 1:1 dazu). Mehr als die Hydration-% geht nicht — sonst wäre mehr Wasser im Poolish als im ganzen Teig.',
    'Poolish: usually 30–50 % of the flour (water 1:1 with it). Can\'t go higher than the hydration % — otherwise the poolish would hold more water than the whole dough.');
  add('label.timeMode.start', 'Startzeitpunkt', 'Start time');
  add('label.timeMode.target', 'Soll fertig sein um', 'Should be ready at');
  add('hint.timeMode.start', 'Die Anleitung rechnet vorwärts und zeigt, wann die Pizza fertig ist.', 'The guide calculates forward and shows when the pizza will be ready.');
  add('hint.timeMode.target', 'Die Anleitung rechnet rückwärts und sagt dir, wann du anfangen musst.', 'The guide calculates backward and tells you when to start.');

  // ---- js/flour.js — Mehl-Dropdown: "dur"-Anzeige-Text je Mehl (Namen/Gruppen sind
  // Markennamen und bleiben unübersetzt, s. Kommentar in js/flour.js) ----------------
  add('flour.dur.upTo48h', 'bis 48 h', 'up to 48 h');
  add('flour.dur.24to48h', '24–48 h', '24–48 h');
  add('flour.dur.24hTo72hPlus', '24 h – 72 h+', '24 h – 72 h+');
  add('flour.dur.upTo72hPlus', 'bis 72 h+', 'up to 72 h+');
  add('flour.dur.72hPlus', '72 h+', '72 h+');
  add('flour.dur.24to72h', '24–72 h', '24–72 h');
  add('flour.dur.upTo24h', 'bis 24 h', 'up to 24 h');
  add('flour.dur.upTo72h', 'bis 72 h', 'up to 72 h');

  // ---- js/presets.js — Preset-Beschreibungen + Ladehinweis ------------------------
  add('preset.defaultDesc', 'Wähle ein erprobtes Rezept — alle Werte werden automatisch gesetzt. Danach kannst du jederzeit feinjustieren.',
    'Choose a proven recipe — all values are set automatically. You can fine-tune anytime afterwards.');
  add('preset.napoliKlassisch.desc', 'AVPN-Standard: 60 % Hydration, Tipo 00, 2 % Olivenöl. ~24 h Gesamtgare. Wenig Hefe, klassischer Geschmack.',
    'AVPN standard: 60 % hydration, Tipo 00, 2 % olive oil. ~24 h total rise. Little yeast, classic flavor.');
  add('preset.napoli65.desc', '65 % macht den Teig dehnbarer & verzeihlicher, 2 % Olivenöl. ~24 h: 2 h Raumtemp, dann kühl, vor dem Backen temperieren.',
    '65 % makes the dough more extensible & forgiving, 2 % olive oil. ~24 h: 2 h room temp, then cold, bring to room temp before baking.');
  add('preset.napoliKalt.desc', 'Lange Kaltgare ~48 h im Kühlschrank (4 °C), 2 % Olivenöl. Sehr wenig Hefe, maximales Aroma. Braucht ein starkes Mehl (W300+).',
    'Long cold rise ~48 h in the fridge (4 °C), 2 % olive oil. Very little yeast, maximum flavor. Needs a strong flour (W300+).');
  add('preset.schnell.desc', 'Gleicher Tag: ~2 h Stockgare + 2–3 h Stückgare bei warmer Raumtemp (24–26 °C), 2 % Olivenöl. Mehr Hefe, weniger Aroma — aber spontan.',
    'Same day: ~2 h bulk rise + 2–3 h final proof at warm room temp (24–26 °C), 2 % olive oil. More yeast, less flavor — but spontaneous.');
  // Bewusst PLAIN "&" (nicht "&amp;") in allen drei descKey-Einträgen unten:
  // presets.js setzt sie per `$('presetDesc').textContent = ...` — textContent
  // dekodiert KEINE HTML-Entities, ein "&amp;" würde also buchstäblich als
  // "&amp;" auf dem Bildschirm erscheinen (Nebenbefund-Fix: derselbe Fehler
  // steckte bereits im deutschen Original-String vor dieser Umstellung).
  add('preset.napoliBiga.desc', '100 % Biga (steifer Vorteig, 45 % Hydration). 24 h reifen lassen, dann Hauptteig mit Restwasser, Salz & 2 % Öl. Sehr offene Krume.',
    '100 % biga (stiff pre-ferment, 45 % hydration). Let it rise 24 h, then final dough with remaining water, salt & 2 % oil. Very open crumb.');
  add('preset.napoliPoolish.desc', 'Poolish (flüssig 1:1) mit ~66 % des Mehls. 14 h reifen, dann Hauptteig (mit 2 % Öl) — ~22 h Gesamtreife. Milder, luftiger Teig.',
    'Poolish (liquid 1:1) with ~66 % of the flour. 14 h rise, then final dough (with 2 % oil) — ~22 h total rise. Milder, airier dough.');
  add('preset.teglia.desc', 'Römische Blechpizza: 75 % Hydration, 4 % Olivenöl, sehr lockere Krume. Teig ist klebrig — mit Stretch & Fold statt langem Kneten arbeiten. 24 h kühl. Braucht sehr starkes Mehl (W330+).',
    'Roman pan pizza: 75 % hydration, 4 % olive oil, very airy crumb. The dough is sticky — work with stretch & fold instead of long kneading. 24 h cold. Needs a very strong flour (W330+).');
  add('preset.newyorkStyle.desc', 'New York Style: 62 % Hydration, 3 % Öl, 2 % Zucker (Bräunung & Hefeaktivität) — größere, dünnere Teiglinge. ~26 h Kaltgare für Aroma & knusprig-zähe Kruste. Braucht ein mittelstarkes Mehl (W300+).',
    'New York style: 62 % hydration, 3 % oil, 2 % sugar (browning & yeast activity) — larger, thinner dough balls. ~26 h cold rise for flavor & a crispy-chewy crust. Needs a medium-strong flour (W300+).');
  add('preset.customRecipeLoaded', 'Eigenes Rezept „{name}“ geladen — Werte wurden übernommen.', 'Custom recipe "{name}" loaded — values have been applied.');

  // ---- js/newrecipe.js — Live-Meldung nach dem Anlegen ----------------------------
  add('newrecipe.createdMsg', '„{name}“ wurde angelegt — zu finden in „Meine Rezepte“ und im Presets-Dropdown unter „Eigene Rezepte“. Die aktuelle Berechnung oben bleibt unverändert.',
    '"{name}" has been created — you\'ll find it under "My recipes" and in the presets dropdown under "Custom recipes". The calculation above remains unchanged.');

  // ---- js/main.js — Rezepte-Verwaltung (Prompt/Confirm/Live-Meldungen) ------------
  add('main.saved', '✓ Gespeichert', '✓ Saved');
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

  // ---- js/share.js — Teilen-Link-Feedback -----------------------------------------
  add('share.linkCopied', 'Link kopiert!', 'Link copied!');
  add('share.copyFailed', 'Kopieren fehlgeschlagen', 'Copy failed');

  // ======================================================================
  // Statische HTML-Oberfläche (pizza-rechner.html / pizza-rechner-mobile.html) —
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
  add('nav.einstellungen', 'Einstellungen', 'Settings');
  add('nav.toMobile', 'Zur Mobil-Ansicht', 'Switch to mobile view');
  add('nav.toDesktop', 'Zur Desktop-Ansicht', 'Switch to desktop view');
  add('nav.viewAnnounce', 'Ansicht: {label}', 'View: {label}');

  // -- Card: Fertiges Rezept wählen --------------------------------------------------
  add('card.preset.title', 'Fertiges Rezept wählen', 'Choose a ready-made recipe');
  add('card.preset.selectLabel', 'Fertiges Rezept auswählen', 'Select a ready-made recipe');
  add('option.preset.none', 'Kein Rezept ausgewählt', 'No recipe selected');
  add('optgroup.napoliDirect', 'Neapolitanisch · Direkt', 'Neapolitan · Direct');
  add('optgroup.napoliPref', 'Neapolitanisch · Vorteig', 'Neapolitan · Pre-ferment');
  add('optgroup.otherStyles', 'Andere Stile', 'Other styles');
  add('optgroup.customRecipes', 'Eigene Rezepte', 'Custom recipes');
  add('option.napoliKlassisch', 'Napoli Klassisch (AVPN) · 24 h', 'Napoli Classic (AVPN) · 24 h');
  add('option.napoli65', 'Napoli 65 % · 24 h (einsteigerfreundlich)', 'Napoli 65% · 24 h (beginner-friendly)');
  add('option.napoliKalt', 'Napoli Lange Kaltgare · 48–72 h', 'Napoli Long Cold Rise · 48–72 h');
  add('option.schnell', 'Schnell · gleicher Tag (4–6 h)', 'Quick · same day (4–6 h)');
  add('option.napoliBiga', 'Napoli mit Biga · 16–24 h', 'Napoli with Biga · 16–24 h');
  add('option.napoliPoolish', 'Napoli mit Poolish · 24–48 h', 'Napoli with Poolish · 24–48 h');
  add('option.teglia', 'Teglia / Blech · hohe Hydration 75 %', 'Teglia / Pan · high hydration 75%');
  add('option.newyorkStyle', 'New York Style · Zucker &amp; Öl, ~26 h', 'New York Style · sugar &amp; oil, ~26 h');

  // -- Card: Grundeinstellungen ------------------------------------------------------
  add('card.basics.title', 'Grundeinstellungen', 'Basic settings');
  add('label.flour', 'Mehl', 'Flour');
  add('hint.flour', 'W-Wert = Glutenstärke. Schwaches Mehl verträgt keine langen Gärzeiten — sehr starkes Mehl braucht sie. Wird per Preset mitgesetzt.',
    'W value = gluten strength. Weak flour can\'t handle long rise times — very strong flour needs them. Set automatically by presets.');
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
  add('hint.oil', 'Macht den Teig geschmeidiger &amp; fördert die Bräunung. Klassisch Napoli 0 %, mit Öl 1–3 %, Blech/Teglia 3–5 %. Kommt spät zum Teig — nach dem Salz.',
    'Makes the dough more supple &amp; promotes browning. Classic Napoli 0%, with oil 1–3%, pan/teglia 3–5%. Added late — after the salt.');
  add('label.sugar', 'Zucker', 'Sugar');
  add('hint.sugar', 'New-York-Style: unterstützt die Hefeaktivität &amp; die Krustenbräunung. Wird früh zugegeben (mit Mehl/Wasser/Hefe), nicht spät wie Öl.',
    'New York style: supports yeast activity &amp; crust browning. Added early (with flour/water/yeast), not late like oil.');

  // -- Card: Methode & Hefe -----------------------------------------------------------
  // Bewusst PLAIN "&" statt "&amp;": diese beiden Keys werden sowohl per
  // data-i18n (textContent) ALS AUCH per data-i18n-attr (setAttribute, KEINE
  // Entity-Dekodierung!) für aria-label genutzt — mit "&amp;" würde der
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
  add('hint.bhyd', 'Steife Biga: 44–48 %. Poolish ist fix 100 % (1:1).', 'Stiff biga: 44–48%. Poolish is fixed at 100% (1:1).');
  add('label.prefStage', 'Vorteig-Reife', 'Pre-ferment maturity');
  add('hint.prefStage', 'Reifezeit und Hefemenge hängen zusammen — die Stufe setzt beides passend. Längere Reife = weniger Hefe + kühler stellen (steht in der Anleitung).',
    'Maturity time and yeast amount are linked — the stage sets both to match. Longer maturity = less yeast + cooler storage (explained in the guide).');
  add('label.yeastType', 'Hefe-Art', 'Yeast type');
  add('seg.freshYeast', 'Frischhefe', 'Fresh yeast');
  add('seg.dryYeast', 'Trockenhefe', 'Dry yeast');
  add('label.yeast', 'Hefemenge', 'Yeast amount');
  add('pill.yeastExtremeLong', 'Extrem lang (72h+)', 'Extremely long (72h+)');
  add('pill.yeastVeryLong', 'Sehr lang (48h kühl)', 'Very long (48h cold)');
  add('pill.yeastLong', 'Lang (24h)', 'Long (24h)');
  add('pill.yeastMedium', 'Mittel (8h RT)', 'Medium (8h room temp)');
  add('pill.yeastFast', 'Schnell (4h)', 'Fast (4h)');
  add('label.coldStage', 'Kalte Gare — wo verbringt der Teig die Kühlschrank-Zeit?', 'Cold rise — where does the dough spend its fridge time?');
  add('seg.coldBalls', 'Als Teiglinge (praktisch)', 'As dough balls (convenient)');
  add('seg.coldBulk', 'Im Stück (klassisch)', 'In bulk (classic)');
  add('hint.coldStage', 'Greift nur bei kühlen Führungen (24 h+). <b>Teiglinge:</b> nach 2 h formen, dann kalt — am Backtag nur noch temperieren &amp; backen. <b>Im Stück:</b> der ganze Teig gärt kalt, Formen und Stückgare erst am Backtag.',
    'Only applies to cold methods (24 h+). <b>Dough balls:</b> shape after 2 h, then cold — on baking day just bring to room temp &amp; bake. <b>In bulk:</b> the whole dough rises cold, shaping and final proof happen on baking day.');

  // -- Card: Teigtemperatur & Eiswasser ------------------------------------------------
  add('card.temp.title', 'Teigtemperatur & Eiswasser', 'Dough temperature & ice water');
  add('label.ddt', 'Ziel-Teigtemperatur', 'Target dough temperature');
  add('hint.ddt', 'Napoli-Ziel nach dem Kneten: 23–25 °C.', 'Napoli target after kneading: 23–25 °C.');
  add('label.room', 'Raumtemperatur', 'Room temperature');
  add('label.flourTemp', 'Mehltemperatur', 'Flour temperature');
  add('hint.flourTemp', 'Startet gleich der Raumtemperatur, aber unabhängig änderbar — z. B. kühler bei Mehl aus dem Keller oder Kühlschrank.',
    'Starts equal to room temperature, but can be changed independently — e.g. cooler for flour from the cellar or fridge.');
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
  add('result.waterTemp', 'Wassertemperatur', 'Water temperature');
  add('result.mixingWater', 'Schüttwasser', 'Mixing water');
  add('result.ofWhichIce', 'davon Eis', 'of which ice');
  add('yeast.fresh', '(frisch)', '(fresh)');
  add('yeast.dry', '(trocken)', '(dry)');
  add('btn.save', 'Speichern', 'Save');
  add('btn.printShoppingList', 'Einkaufsliste drucken', 'Print shopping list');
  add('btn.printGuide', 'Anleitung drucken', 'Print guide');
  add('btn.savePdf', 'Als PDF speichern', 'Save as PDF');
  add('hint.savePdf', 'Lädt die Schritt-für-Schritt-Anleitung direkt als PDF-Datei herunter — ganz ohne Druckdialog.',
    'Downloads the step-by-step guide directly as a PDF file — with no print dialog.');
  add('btn.copyShareLink', 'Link kopieren', 'Copy link');
  add('hint.copyShareLink', 'Kopiert einen Link, der dieses Rezept komplett enthält — zum Teilen, ohne Login oder Server.',
    'Copies a link that contains this entire recipe — for sharing, no login or server needed.');

  // -- Anleitung-Kopf -------------------------------------------------------------------
  add('guide.headTitle', 'Schritt-für-Schritt-Anleitung', 'Step-by-step guide');

  // -- Card: Meine Rezepte --------------------------------------------------------------
  add('card.myRecipes.title', 'Meine Rezepte', 'My recipes');
  add('label.savedRecipe', 'Gespeichertes Rezept', 'Saved recipe');
  add('option.noneSavedYet', '— noch keins gespeichert —', '— none saved yet —');
  add('label.newRecipeName', 'Name für neues Rezept', 'Name for new recipe');
  add('placeholder.newRecipeName', 'Name für neues Rezept', 'Name for new recipe');
  add('btn.new', 'Neu', 'New');
  add('btn.rename', 'Umbenennen', 'Rename');
  add('btn.delete', 'Löschen', 'Delete');
  add('hint.myRecipes', 'Eigene Rezepte sind unabhängig von den Presets oben — hier landen deine per „Speichern" gesicherten Stände.',
    'Custom recipes are independent from the presets above — this is where your "Save"d states end up.');
  add('btn.exportFile', 'Als Datei sichern', 'Save as file');
  add('btn.importFile', 'Aus Datei laden', 'Load from file');
  add('label.importFile', 'Backup-Datei mit Rezepten auswählen', 'Select a backup file with recipes');
  add('hint.recipeIO', 'Sichert alle gespeicherten Rezepte als Datei (z. B. vor dem Löschen von Websitedaten) oder lädt eine solche Datei wieder ein — importierte Rezepte werden ergänzt, nichts wird überschrieben.',
    'Backs up all saved recipes as a file (e.g. before clearing site data) or loads such a file back in — imported recipes are added, nothing gets overwritten.');

  // -- Card: Neues Rezept anlegen --------------------------------------------------------
  add('card.newRecipe.title', 'Neues Rezept anlegen', 'Create a new recipe');
  add('hint.newRecipe', 'Legt ein neues, eigenständiges Rezept an — die aktuelle Berechnung im Rechner-Bereich bleibt dabei unverändert. Erscheint danach in „Meine Rezepte“ und im „Fertiges Rezept wählen“-Dropdown unter „Eigene Rezepte“.',
    'Creates a new, independent recipe — the current calculation in the Calculator area stays unchanged. It then appears under "My recipes" and in the "Choose a ready-made recipe" dropdown under "Custom recipes".');
  add('heading.basics', 'Grundeinstellungen', 'Basic settings');
  add('hint.newRecipeSugar', 'Nicht flag-/preset-gebunden wie im Hauptrechner — im eigenständigen Formular immer verfügbar.',
    'Not tied to a flag/preset like in the main calculator — always available in this standalone form.');
  add('heading.methodYeast', 'Methode & Hefe', 'Method & yeast');
  add('heading.tempIce', 'Teigtemperatur & Eiswasser', 'Dough temperature & ice water');
  add('label.newRecipeFullName', 'Name für das neue Rezept', 'Name for the new recipe');
  add('placeholder.newRecipeFullName', 'Name für das neue Rezept', 'Name for the new recipe');
  add('btn.createRecipe', 'Rezept anlegen', 'Create recipe');
  add('hint.createRecipe', 'Kalte Gare startet für neu angelegte Rezepte auf „Als Teiglinge (praktisch)“, Zeitplan bleibt leer — beides nach dem Laden im Rechner-Bereich änderbar.',
    'Cold rise starts as "As dough balls (convenient)" for newly created recipes, schedule stays empty — both changeable after loading in the Calculator area.');

  // -- Card: Zeitplan ---------------------------------------------------------------------
  add('card.schedule.title', 'Zeitplan', 'Schedule');
  add('label.timeReference', 'Bezugspunkt', 'Reference point');
  add('seg.timeStart', 'Ich starte um…', 'I\'m starting at…');
  add('seg.timeTarget', 'Fertig sein um…', 'Should be ready at…');
  add('btn.now', 'Jetzt', 'Now');

  // -- Card: Einstellungen ------------------------------------------------------------------
  add('card.settings.title', 'Einstellungen', 'Settings');
  add('hint.settings.desktop', 'Schalte einzelne Zusatzfunktionen ein oder aus — deine Wahl wird direkt im Browser gespeichert. Klick auf „i“ zeigt eine kurze Erklärung.',
    'Turn individual extra features on or off — your choice is saved directly in the browser. Click "i" for a short explanation.');
  add('hint.settings.mobile', 'Schalte einzelne Zusatzfunktionen ein oder aus — deine Wahl wird direkt im Browser gespeichert. Tipp auf „i“ zeigt eine kurze Erklärung.',
    'Turn individual extra features on or off — your choice is saved directly in the browser. Tap "i" for a short explanation.');
  add('flag.timer.name', 'Gärzeit-Timer', 'Rise timer');
  add('flag.timer.infoBtn', 'Erklärung zu „Gärzeit-Timer“ ein-/ausblenden', 'Show/hide explanation for "Rise timer"');
  add('flag.timer.info', 'Countdown mit optionalem Wecker für jeden Anleitungsschritt (z. B. Stockgare, Stückgare).',
    'Countdown with an optional alarm for every guide step (e.g. bulk rise, final proof).');
  add('flag.timerSystem.name', 'System-Wecker', 'System alarm');
  add('flag.timerSystem.infoBtn', 'Erklärung zu „System-Wecker“ ein-/ausblenden', 'Show/hide explanation for "System alarm"');
  add('flag.timerSystem.info', 'Zusätzliche Links zum Android-Wecker oder Kalender, direkt beim Timer.',
    'Extra links to the Android alarm or calendar, right next to the timer.');
  add('flag.share.name', 'Teilen-Link', 'Share link');
  add('flag.share.infoBtn', 'Erklärung zu „Teilen-Link“ ein-/ausblenden', 'Show/hide explanation for "Share link"');
  add('flag.share.info', 'Rezept als Link kopieren, um es ohne Login oder Server zu teilen.', 'Copy the recipe as a link to share it without a login or server.');
  add('flag.shopping.name', 'Einkaufsliste', 'Shopping list');
  add('flag.shopping.infoBtn', 'Erklärung zu „Einkaufsliste“ ein-/ausblenden', 'Show/hide explanation for "Shopping list"');
  add('flag.shopping.info', 'Einkaufsliste aus den Gesamtmengen erzeugen und separat drucken.', 'Generate a shopping list from the total amounts and print it separately.');
  add('flag.freezeHint.name', 'Einfrier-Hinweis', 'Freezing tip');
  add('flag.freezeHint.infoBtn', 'Erklärung zu „Einfrier-Hinweis“ ein-/ausblenden', 'Show/hide explanation for "Freezing tip"');
  add('flag.freezeHint.info', 'Zusätzlicher Hinweis in der Anleitung zum Einfrieren geformter Teiglinge.', 'Extra tip in the guide about freezing shaped dough balls.');
  add('flag.multiRecipes.name', 'Mehrere Rezepte', 'Multiple recipes');
  add('flag.multiRecipes.infoBtn', 'Erklärung zu „Mehrere Rezepte“ ein-/ausblenden', 'Show/hide explanation for "Multiple recipes"');
  add('flag.multiRecipes.info', 'Mehrere benannte Rezepte speichern und verwalten statt nur eines.', 'Save and manage multiple named recipes instead of just one.');
  add('flag.newYorkStyle.name', 'New York Style', 'New York Style');
  add('flag.newYorkStyle.infoBtn', 'Erklärung zu „New York Style“ ein-/ausblenden', 'Show/hide explanation for "New York Style"');
  add('flag.newYorkStyle.info', 'Blendet den Zucker-Regler (Bäckerprozent, wie Öl) bei den Grundeinstellungen ein — für New-York-Style-Teige. Wird auch automatisch angeschaltet, wenn du das „New York Style"-Preset wählst.',
    'Shows the sugar slider (baker\'s percentage, like oil) in the basic settings — for New York style doughs. Also switches on automatically when you choose the "New York Style" preset.');
  add('flag.hints.name', 'Hinweistexte', 'Hint texts');
  add('flag.hints.infoBtn', 'Erklärung zu „Hinweistexte“ ein-/ausblenden', 'Show/hide explanation for "Hint texts"');
  add('flag.hints.info', 'Erklärende Kurztexte bei Feldern & Buttons ein- oder ausblenden.', 'Turn short explanatory texts on fields & buttons on or off.');
  add('flag.lang.name', 'Sprache', 'Language');
  add('flag.lang.infoBtn', 'Erklärung zu „Sprache“ ein-/ausblenden', 'Show/hide explanation for "Language"');
  add('flag.lang.info', 'Deutsch oder Englisch für die komplette Oberfläche, Anleitung und Exporte. Automatisch anhand deiner Browser-Sprache vorausgewählt, hier jederzeit manuell umschaltbar — deine Wahl wird gespeichert.',
    'German or English for the entire interface, guide and exports. Automatically pre-selected based on your browser language, switchable manually here anytime — your choice is saved.');
  add('lang.german', 'Deutsch', 'German');
  add('lang.english', 'Englisch', 'English');
  // Live-Region-Ansage nach manuellem Sprachwechsel (#langAnnounce, s. wireLangSwitch()
  // weiter unten) — WCAG 4.1.3 Status Messages: ein Klick auf "Englisch"/"English" tauscht
  // die KOMPLETTE sichtbare Oberfläche aus (Labels, Anleitung, Hinweise), ohne dass sich
  // der Fokus bewegt. Für Screenreader-Nutzer ist das aria-pressed am geklickten Button
  // allein kein verlässlicher Beleg für eine derart große, seitenweite Änderung — analog
  // zum bestehenden #viewAnnounce-Muster beim Bereichswechsel (Burger-Nav, v3.26.0).
  add('lang.announce', 'Sprache: {lang}', 'Language: {lang}');

  // -- Card: Pizza Party --------------------------------------------------------------------
  add('card.party.title', 'Pizza Party', 'Pizza Party');
  add('hint.party', 'Wähle Pizzen mit Stückzahl aus — vorgegebene oder eigene, s. u. Unten erscheint eine aggregierte, ungefähre Zutatenliste für die ganze Party. Eigenständiger Bereich: die „Anzahl Teiglinge" im Rechner-Bereich wird hier nicht berücksichtigt.',
    'Choose pizzas with a quantity — preset or your own, see below. An aggregated, approximate ingredient list for the whole party appears below. Independent area: the "number of dough balls" in the Calculator area is not considered here.');
  add('card.newPizza.title', 'Eigene Pizza anlegen', 'Create a custom pizza');
  add('label.partyPizzaName', 'Name', 'Name');
  add('placeholder.partyPizzaName', 'z. B. Peperoni-Spezial', 'e.g. Pepperoni Special');
  add('label.partyIngredients', 'Zutaten (Menge pro EINER Pizza dieser Sorte)', 'Ingredients (amount per ONE pizza of this kind)');
  add('btn.addIngredient', '+ Zutat', '+ Ingredient');
  add('btn.createPizza', 'Pizza anlegen', 'Create pizza');
  add('hint.partyCreate', 'Bei der Auswahl oben wird die Menge automatisch mit der gewählten Stückzahl hochgerechnet.',
    'In the selection above, the amount is automatically scaled up by the chosen quantity.');
  add('card.partyResult.title', 'Zutatenliste für die Party', 'Ingredient list for the party');
  add('hint.partyResult', 'Ungefähre Richtmengen für den Einkauf — keine exakte Rezeptberechnung wie beim Teig.',
    'Approximate guideline amounts for shopping — not an exact recipe calculation like the dough.');

  // -- Quick-Bar (nur Mobil) -----------------------------------------------------------------
  add('quickbar.jumpToResult', 'Zum Ergebnis springen: ', 'Jump to result: ');
  add('quickbar.doughBalls', 'Teiglinge', 'dough balls');

  // ---- js/calc.js — Eiswasser-Hinweis (dynamisch berechneter Text) ----------------
  add('calc.ice.note', 'Nimm <b>{tapWater} g Leitungswasser (~{tapTemp}°)</b> + <b>{ice} g Eis</b>, ergibt ~{wT}° Schüttwasser. Eis vorher abwiegen.',
    'Use <b>{tapWater} g tap water (~{tapTemp}°)</b> + <b>{ice} g ice</b>, giving ~{wT}° mixing water. Weigh the ice beforehand.');
  add('calc.warmNote', 'Schüttwasser leicht anwärmen auf ~{wT}° (z.B. handwarm).', 'Warm the mixing water slightly to ~{wT}° (e.g. lukewarm).');
  add('calc.tapOkNote', 'Leitungswasser bei ~{tapTemp}° passt direkt — kein Eis nötig.', 'Tap water at ~{tapTemp}° works directly — no ice needed.');
  add('calc.veryColdWarn', ' <b>Achtung:</b> sehr kalt — ggf. Mehl vorher kühlen.', ' <b>Note:</b> very cold — consider chilling the flour beforehand.');

  // ---- js/storage.js — automatisch generierte Rezeptnamen -------------------------
  add('storage.migratedRecipeName', 'Mein Rezept', 'My recipe');
  add('storage.defaultRecipeName', 'Rezept {n}', 'Recipe {n}');
  add('storage.importedRecipeFallbackName', 'Importiertes Rezept', 'Imported recipe');
  add('storage.importedSuffix', '{name} (importiert)', '{name} (imported)');
  add('storage.importedSuffixN', '{name} (importiert {n})', '{name} (imported {n})');

  PZ._I18N_DICT = DICT; // für weitere Module (guide.js etc.) zum Ergänzen via PZ._i18nAdd()
  PZ._i18nAdd = add;

  // ======================================================================
  // Sprachwahl: Erkennung + Persistenz
  // ======================================================================

  // de/at/ch-Locale-Codes (z. B. "de", "de-DE", "de-AT", "de-CH") -> Deutsch, alles
  // andere (inkl. unbekannt/nicht gesetzt) -> Englisch. Deutsch bleibt aber der
  // Programm-Fallback für fehlende Übersetzungsschlüssel, unabhängig von dieser Wahl.
  function detectLang() {
    const nav = (global.navigator && (global.navigator.language || global.navigator.userLanguage)) || 'de';
    return String(nav).toLowerCase().indexOf('de') === 0 ? 'de' : 'en';
  }

  function readStoredLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function writeStoredLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
  }

  // Manuelle Wahl (falls vorhanden) hat Vorrang vor der Auto-Erkennung — nur beim
  // ALLERERSTEN Aufruf (noch kein Key in localStorage) greift navigator.language.
  let currentLang = readStoredLang();
  if (currentLang !== 'de' && currentLang !== 'en') currentLang = detectLang();

  function getLang() { return currentLang; }

  function t(key, vars) {
    const dict = DICT[currentLang] || DICT.de;
    let str = dict[key];
    if (str == null) str = DICT.de[key];   // Fallback: Deutsch (Programm-Standard)
    if (str == null) return key;            // Letzter Rückfall: der Key selbst (kein Crash)
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.split('{' + k + '}').join(vars[k] == null ? '' : vars[k]);
      });
    }
    return str;
  }

  // ======================================================================
  // Statische HTML-Texte (data-i18n / data-i18n-html / data-i18n-attr)
  // ======================================================================
  // - data-i18n="key"            -> el.textContent = t(key)
  // - data-i18n-html="key"       -> el.innerHTML = t(key)   (nur für Keys mit erlaubtem,
  //                                  fest hinterlegtem Markup wie <b>/<br> — nie mit
  //                                  Nutzereingaben kombiniert)
  // - data-i18n-attr="attr1:key1,attr2:key2" -> setzt beliebig viele Attribute (z. B.
  //                                  aria-label, placeholder, title)
  function applyStaticI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        const idx = pair.indexOf(':');
        if (idx === -1) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.setAttribute('lang', currentLang);
  }

  // Nach einem Sprachwechsel müssen auch alle dynamisch/reaktiv erzeugten Bereiche neu
  // gerendert werden (Anleitung, Ergebnis-Panel-Beschriftungen, Party-Liste, Vorteig-
  // Reife-Pills, Zeitplan-Label, Mehl-Dropdown, Presets-Beschreibung) — jedes Modul
  // registriert dafür optional eine Re-Render-Funktion statt hart in i18n.js verdrahtet
  // zu sein (lose Kopplung, jedes Modul bleibt für sein eigenes Rendering zuständig).
  const rerenderHooks = [];
  function onLangChange(fn) { if (typeof fn === 'function') rerenderHooks.push(fn); }

  function setLang(lang) {
    if (lang !== 'de' && lang !== 'en') return;
    currentLang = lang;
    writeStoredLang(lang);
    applyStaticI18n();
    rerenderHooks.forEach(function (fn) {
      try { fn(); } catch (e) { /* ein defektes Modul darf die übrigen nicht blockieren */ }
    });
  }

  PZ.t = t;
  PZ.getLang = getLang;
  PZ.setLang = setLang;
  PZ.i18nOnChange = onLangChange;
  PZ.i18nApplyStatic = applyStaticI18n;

  // ======================================================================
  // Sprach-Umschalter in den Einstellungen (#langSwitch, ein .seg-Element mit
  // zwei Buttons "Deutsch"/"Englisch", identisches Markup auf Desktop + Mobil).
  // Kein Bestandteil des Ein/Aus-Feature-Flag-Systems (js/settings.js) — eigene,
  // simple Verdrahtung hier direkt im Sprachmodul.
  // ======================================================================
  function wireLangSwitch() {
    const wrap = document.getElementById('langSwitch');
    if (!wrap) return;
    const btns = Array.prototype.slice.call(wrap.querySelectorAll('button[data-lang]'));
    function reflect() {
      btns.forEach(function (b) {
        const on = b.getAttribute('data-lang') === currentLang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    // Erst leeren, Text erst im nächsten Tick setzen (analog zum #viewAnnounce-/
    // #pdfGuideLiveMsg-Muster) — sonst bekommen Screenreader bei zwei Klicks auf
    // dieselbe Sprache hintereinander keine zweite Ansage, da der Text wortgleich wäre.
    function announceLangChange(lang) {
      const el = document.getElementById('langAnnounce');
      if (!el) return;
      const langName = t(lang === 'de' ? 'lang.german' : 'lang.english');
      el.textContent = '';
      global.setTimeout(function () {
        el.textContent = t('lang.announce', { lang: langName });
      }, 50);
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        const lang = b.getAttribute('data-lang');
        setLang(lang);
        reflect();
        announceLangChange(lang);
      });
    });
    reflect();
    onLangChange(reflect);
  }

  // Läuft die Datei in einer Umgebung ohne das übrige Markup (z. B. tests/test.html),
  // findet applyStaticI18n()/wireLangSwitch() einfach keine Elemente — kein Fehler, no-op.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyStaticI18n(); wireLangSwitch(); });
  } else {
    applyStaticI18n();
    wireLangSwitch();
  }
})(window);
