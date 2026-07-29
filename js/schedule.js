/* schedule.js — Gärzeit-Fahrplan je nach Methode, Hefemenge & Kaltgare-Stufe */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  // Übersetzt (js/i18n.js, v3.28.0): label/bulk/proof kommen jetzt über PZ.t() aus dem
  // Wörterbuch statt als hartkodierter deutscher Text. Eigener Key je Zweig
  // ('sched.<zweig>.label/bulk/proof'), PZ.t() fällt bei fehlendem Key/fehlender
  // js/i18n.js automatisch auf den literalen Key zurück — s. Kommentar in js/i18n.js.
  // `t` ist ein No-op-Fallback (gibt den deutschen Default zurück), falls js/i18n.js aus
  // irgendeinem Grund nicht geladen ist (sollte nicht vorkommen, defensiv trotzdem).
  function t(key, def) {
    return PZ.t ? PZ.t(key) : def;
  }

  function schedule() {
    const state = PZ.state;
    const y = state.yeast;
    // Bei kalten Führungen: 'balls' = Teiglinge wandern in den Kühlschrank (praktisch, Standard),
    // 'bulk' = der ganze Teig gärt kalt im Stück (klassisch).
    // Die Gesamtdauer ist in beiden Varianten gleich — nur die Verteilung ändert sich.
    const ballsCold = state.coldStage !== 'bulk';

    // --- Vorteig-Methoden: Stockgare ist kürzer (Reife steckt im Vorteig) ---
    // Seit v4.24.0 (Poolish-Quellenrecherche, s. pizza-rechner-KONTEXT.md) entkoppelt von
    // state.yeast: die alten Hefe-Schwellen (>=1,2/0,5/0,18/darunter) existierten nur, damit
    // die früheren, unbelegten Poolish-Stufenwerte zufällig im "Lange Hauptgare"-Zweig
    // landeten -- mit belegten Werten (0,6 % / 1,0 %, jeweils bezogen aufs Poolish-Mehl,
    // nicht mehr aufs Gesamtmehl) hätte diese Ableitung aus state.yeast falsche Zweige
    // getroffen. Der Hauptteig bleibt bei Vorteig-Methoden bewusst durchgehend bei
    // Raumtemperatur (Ein-Phasen-Bauart, gedeckt durch My Pizza Corner/Electric Blue
    // Food/Oonis Sofort-Variante) -- IMMER derselbe Zweig wie zuvor "prefLong"
    // (Biga-Stufen 0,4/0,3/0,2 % und die alte Poolish-Voreinstellung lagen bereits alle
    // hier, verhaltensneutral für den Bestand). Nebenwirkung (nicht behoben, dokumentiert):
    // die Kaltgare-Umschaltung "als Teiglinge/im Stück" (coldStage) greift dadurch bei
    // Vorteig nie (cold immer false) -- das war schon vorher der Fall für jede Kombination,
    // die hier landete, keine Regression.
    if (state.method !== 'direct') {
      return {
        label: t('sched.prefLong.label', 'Vorteig · Lange Hauptgare'),
        bulk: t('sched.prefLong.bulk', '<b>2–3 h</b> bei Raumtemp (Stockgare)'), bulkMin: 150,
        proof: t('sched.prefLong.proof', '<b>5–7 h</b> bei Raumtemp · Fingertest'), proofMin: 360, cold: false
      };
    }

    // --- Direkte Führung (Basiswerte unverändert wie bisher) ---
    let r;
    // --- Preset-Override (v4.28.0) -------------------------------------------------
    // Letzte offene Lücke aus der Preset-Quellenprüfung (v4.24.0-v4.27.0): die vier
    // Hefemenge-Schwellen unten unterstellen "mehr Hefe = kürzer/wärmer". Das stimmt bei
    // "newyork_style" (0,4 % Trockenhefe laut Feeling Foodish, trotzdem 24-72 h Kaltgare)
    // und "teglia" (0,45 % laut Manopasto/Salamico -- Verdacht auf gemeinsamen Ursprung,
    // gestützt durch eine unschärfere dritte Quelle -- trotzdem 72 h+) NICHT: beide
    // brauchen MEHR Hefe UND eine LÄNGERE Gare als die Kaskade unten liefern würde. Ein
    // komplettes Stufensystem (analog PZ.PREF_STAGES bei Biga/Poolish) wurde geprüft und
    // bewusst verworfen (s. pizza-rechner-KONTEXT.md): bei Direktführung ist die Hefemenge
    // seit jeher der freie, stufenlose Regler, die Pills sind nur Schnellwahl-Sprünge
    // darauf, die Zeit ist reine Anzeige -- ein Stufensystem hätte das Bedienparadigma für
    // die GESAMTE Direktführung umgedreht. Stattdessen: state.scheduleOverride wird NUR
    // von js/presets.js für genau diese zwei Presets gesetzt (kein neuer Regler, keine
    // UI) -- jeder freie Hefe-Regler/jede Pill/jedes manuelle Rezept lässt es bei null,
    // die Kaskade unten bleibt für sie unverändert. Das Override-Objekt speichert i18n-
    // KEYS + Default-Text (nicht schon aufgelöste Strings), damit ein späterer
    // Sprachwechsel (js/calc.js ruft calc() bei jedem i18nOnChange erneut auf) hier
    // genauso live neu übersetzt wie bei jedem anderen Zweig -- s. t()-Aufrufe unten.
    // Bewusst EIN flacher, feststehender Fahrplan pro Preset (keine ballsCold-Variante
    // wie bei den generischen Zweigen unten): die Kaltgare-Umschaltung "als Teiglinge/im
    // Stück" (coldStage) ist für diese zwei Presets dadurch wirkungslos, analog zur
    // bereits bestehenden Nebenwirkung bei Vorteig-Methoden weiter oben in dieser Datei.
    if (state.scheduleOverride) {
      const o = state.scheduleOverride;
      r = {
        label: t(o.labelKey, o.labelDefault),
        bulk: t(o.bulkKey, o.bulkDefault), bulkMin: o.bulkMin,
        proof: t(o.proofKey, o.proofDefault), proofMin: o.proofMin,
        cold: !!o.cold
      };
    } else if (y >= 1.2) {
      r = {
        label: t('sched.directFast.label', 'Schnellgare · gleicher Tag'),
        bulk: t('sched.directFast.bulk', '<b>1,5–2 h</b> bei warmer Raumtemp (24–26 °C)'), bulkMin: 105,
        proof: t('sched.directFast.proof', '<b>2–3 h</b> bei Raumtemp'), proofMin: 150, cold: false
      };
    } else if (y >= 0.5) {
      r = {
        label: t('sched.directMedium.label', 'Mittlere Gare'),
        bulk: t('sched.directMedium.bulk', '<b>2 h</b> bei Raumtemp'), bulkMin: 120,
        proof: t('sched.directMedium.proof', '<b>4–6 h</b> bei Raumtemp'), proofMin: 300, cold: false
      };
    } else if (y >= 0.18) {
      r = ballsCold ? {
        label: t('sched.directLong.label', 'Lange Gare · ~24 h'),
        bulk: t('sched.directLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.directLongCold.proof', 'Teiglinge <b>18–20 h</b> Kühlschrank (4–6 °C), am Backtag <b>4–5 h</b> temperieren'), proofMin: 1440, cold: true
      } : {
        label: t('sched.directLong.label', 'Lange Gare · ~24 h'),
        bulk: t('sched.directLongBulk.bulk', '<b>2 h</b> Raumtemp, dann <b>18–20 h</b> Kühlschrank (4–6 °C)'), bulkMin: 1260,
        proof: t('sched.directLongBulk.proof', 'Teiglinge <b>4–6 h</b> bei Raumtemp akklimatisieren'), proofMin: 300, cold: true
      };
    } else if (y >= 0.08) {
      r = ballsCold ? {
        label: t('sched.directVeryLong.label', 'Sehr lange Kaltgare · ~48 h'),
        bulk: t('sched.directVeryLongCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.directVeryLongCold.proof', 'Teiglinge <b>36–40 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren'), proofMin: 2460, cold: true
      } : {
        label: t('sched.directVeryLong.label', 'Sehr lange Kaltgare · ~48 h'),
        bulk: t('sched.directVeryLongBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>24–48 h</b> Kühlschrank (4 °C)'), bulkMin: 2250,
        proof: t('sched.directVeryLongBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren'), proofMin: 330, cold: true
      };
    } else {
      r = ballsCold ? {
        label: t('sched.directExtreme.label', 'Extrem lange Kaltgare · 72 h+'),
        bulk: t('sched.directExtremeCold.bulk', '<b>2 h</b> bei Raumtemp (Stockgare)'), bulkMin: 120,
        proof: t('sched.directExtremeCold.proof', 'Teiglinge <b>68–72 h</b> Kühlschrank (4 °C), am Backtag <b>5 h</b> temperieren'), proofMin: 4530, cold: true
      } : {
        label: t('sched.directExtreme.label', 'Extrem lange Kaltgare · 72 h+'),
        bulk: t('sched.directExtremeBulk.bulk', '<b>1–2 h</b> Raumtemp, dann <b>48–72 h</b> Kühlschrank (4 °C)'), bulkMin: 4320,
        proof: t('sched.directExtremeBulk.proof', 'Teiglinge <b>5–6 h</b> vor dem Backen temperieren'), proofMin: 330, cold: true
      };
    }

    // --- Raumtemperatur-Skalierung (v4.27.0) -----------------------------------------
    // MECHANISMUS quellenbelegt durch zwei unabhängige, fachlich anerkannte Quellen
    // (s. pizza-rechner-KONTEXT.md, Abschnitt "Wichtige Berechnungs-Details"): Weekend
    // Bakery ("bei 21 °C/70 °F hat sich die Hefeaktivität gegenüber ~27 °C ungefähr
    // halbiert, die Gare dauert doppelt so lange" -- rund 6 °C Differenz für Faktor 2) und
    // PizzaPlan ("alle 8-10 °C mehr verdoppelt sich die Gärgeschwindigkeit ungefähr")
    // bracketieren die Verdopplungsdistanz zwischen ~6 und ~10 °C. Die konkrete Zahl
    // 10 °C ist daraus bewusst konservativ gewählt (der größere, weniger aggressive Wert
    // der Bandbreite) -- eine Design-Entscheidung, KEINE exakt zitierte Einzelzahl einer
    // Quelle. Referenz 21 °C = bestehender state.room-Default (deckt sich mit Crust
    // Kingdom, das 21 °C explizit als Bezugstemperatur nennt).
    const room = state.room;
    let tempFactor = Math.pow(2, (21 - room) / 10);
    // Sicherheitsgrenze (nicht aus einer Quelle abgeleitet, reiner Schutz gegen absurde
    // Zeitangaben an extremen Reglerwerten): Faktor auf [0,25; 4] gekappt.
    tempFactor = Math.min(4, Math.max(0.25, tempFactor));
    function scaled(min) { return Math.round(min * tempFactor); }

    // Welche der beiden Phasen (bulkMin/proofMin) für DIESEN Zweig tatsächlich eine reine
    // Raumtemperatur-Dauer ist, hängt nicht nur von r.cold ab, sondern -- bei kalten
    // Zweigen -- zusätzlich von coldStage:
    //  - r.cold === false (Schnell-/Mittlere Gare): beide Phasen sind reine Raumtemp
    //    -> beide skalieren.
    //  - r.cold === true UND ballsCold (Standard "als Teiglinge"): bulkMin ist die reine
    //    Raumtemp-Stockgare, proofMin mischt Kühlschrankzeit + Temperieren in einer Zahl
    //    -> NUR bulkMin skalieren, proofMin unverändert lassen (erfundene Genauigkeit
    //    vermeiden, s. Auftrag).
    //  - r.cold === true UND NICHT ballsCold (coldStage "im Stück"): hier ist es
    //    strukturell umgekehrt -- bulkMin mischt Raumtemp-Start + Kühlschrank ("2 h
    //    Raumtemp, dann 18-20 h Kühlschrank"), proofMin ist dort die reine Temperier-/
    //    Stückgare-Phase am Backtag ("Teiglinge X h bei Raumtemp akklimatisieren").
    //    Skaliert wird deshalb NUR proofMin, bulkMin bleibt unverändert. Bewusste
    //    Verallgemeinerung des im Auftrag für den Standardfall genannten Prinzips
    //    ("Mischwerte nicht aufteilen, das wäre erfundene Genauigkeit") auf diesen
    //    spiegelbildlichen Fall -- im Auftrag selbst nur für coldStage "als Teiglinge"
    //    explizit benannt, dort aber nicht bedacht, dass sich bei coldStage "im Stück"
    //    die Rollen von bulkMin/proofMin genau umkehren (s. pizza-rechner-KONTEXT.md für
    //    die ausführliche Begründung dieser bewussten Abweichung von der wörtlichen
    //    Formulierung "bulkMin wird IMMER skaliert").
    const scaleBulk = !r.cold || ballsCold;
    const scaleProof = !r.cold || !ballsCold;
    const rawBulkMin = r.bulkMin, rawProofMin = r.proofMin;
    if (scaleBulk) r.bulkMin = scaled(rawBulkMin);
    if (scaleProof) r.proofMin = scaled(rawProofMin);
    // Nur bei tatsächlicher Zahlenänderung als "skaliert" markieren (bei room===21 ist
    // tempFactor exakt 1, Math.round liefert wieder den Ausgangswert -> keine
    // Verhaltensänderung, guide.js zeigt weiterhin den identischen statischen Text).
    r.bulkScaled = scaleBulk && r.bulkMin !== rawBulkMin;
    r.proofScaled = scaleProof && r.proofMin !== rawProofMin;
    r.tempFactor = tempFactor;
    return r;
  }

  PZ.schedule = schedule;
})(window);
