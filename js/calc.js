/* calc.js — Hauptberechnung (Bäckerprozente, Wassertemperatur, Eismenge)
 *
 * Seit v3.57.0 in zwei Teile getrennt (vorher ~30 DOM-Schreibzugriffe direkt in der
 * Rechenlogik vermischt — Kernberechnungen waren dadurch nur über DOM-Stubs testbar,
 * echte Logikfehler wie der Eis-Bug (v3.48.0) schwerer isoliert zu finden/testen):
 *   - PZ.calcCore(state) — reine Rechenfunktion OHNE jeden DOM-Zugriff, liefert das
 *     komplette Ergebnis-Objekt R (inkl. ein paar reinen Render-Hilfsfeldern wie
 *     hasPref/hasMixingWater/note, damit renderResult() unten NUR R als Parameter
 *     braucht). Ruft PZ.t() für Text (yWord/note) — reine, DOM-freie Wörterbuch-
 *     Abfrage, zählt nicht als DOM-Zugriff.
 *   - PZ.renderResult(R) — schreibt das bereits berechnete R ins DOM. Keine
 *     Berechnung mehr hier, nur Anzeige.
 *   - PZ.calc() bleibt als Fassade (ruft beides + PZ.buildGuide() auf) — keine
 *     Änderung an bestehenden Aufrufern nötig (js/ui.js, js/presets.js,
 *     js/storage.js usw. rufen weiterhin einfach PZ.calc()).
 * Reines Wartbarkeits-Refactoring — keine Änderung an der Berechnungslogik selbst.
 * js/guide.js/js/schedule.js bewusst NICHT angefasst (separates Vorhaben).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // letzte Ergebnisse (für die Anleitung)
  PZ.R = {};

  // ======================================================================
  // calcCore(state) — reine Rechenfunktion, kein DOM-Zugriff
  // ======================================================================
  function calcCore(state) {
    const N = state.balls, W = state.ballw;
    const totalBase = N * W;
    // Verschwendungsaufschlag (v3.64.0, PZ.ADJUST.wasteAdjust, Einstellungen-Menü):
    // erhöht das vorkalkulierte Gesamtgewicht, damit nach Kneteverlusten (Schüssel/
    // Hände/Maschine) trotzdem N Teiglinge im Zielgewicht rauskommen. Wirkt VOR der
    // Aufteilung auf die Zutaten -- "total" ist ab hier bewusst NICHT mehr zwingend
    // identisch mit N*W (das bleibt totalBase), die Masseerhaltungs-Formel
    // (Mehl+Wasser+Salz+Hefe+Öl+Zucker=total) gilt aber unverändert weiter.
    const wasteAdj = (PZ.ADJUST && PZ.ADJUST.wasteAdjust) || 0;
    const total = totalBase * (1 + wasteAdj / 100);
    const h = state.hyd / 100, s = state.salt / 100;
    // Hefe-Aufschlag (v3.64.0, PZ.ADJUST.yeastAdjust, Einstellungen-Menü): persönliche
    // Kalibrierung für stärkere/schwächere Hefe, fließt als Faktor auf die
    // Hefe-Bäckerprozentzahl direkt in den Nenner ein (analog zu Öl/Zucker) --
    // Masseerhaltung bleibt dadurch exakt erhalten (anders als ein nachträglicher
    // Aufschlag NACH der Berechnung, der das Gesamtgewicht verändert hätte).
    const yeastAdj = (PZ.ADJUST && PZ.ADJUST.yeastAdjust) || 0;
    const y = (state.yeast / 100) * (1 + yeastAdj / 100);
    const o = (state.oil || 0) / 100;
    const su = (state.sugar || 0) / 100;

    // Mehl = Total / (1 + Hydration + Salz + Hefe + Öl + Zucker)
    // (Öl und Zucker sind Bäckerprozente wie Salz/Hefe → das Gesamtgewicht bleibt exakt N×W
    // bzw. bei aktivem Verschwendungsaufschlag exakt dem inkl. Puffer berechneten "total".)
    const flour = total / (1 + h + s + y + o + su);
    const water = flour * h;
    const salt  = flour * s;
    const oil   = flour * o;
    const sugar = flour * su;
    let yeast   = flour * y;                       // immer als Frischhefe gerechnet
    if (state.yeastType === 'dry') yeast *= PZ.FRESH_TO_DRY;
    const yWord = state.yeastType === 'dry' ? t('yeast.dry') : t('yeast.fresh');

    // --- Vorteig-Aufteilung ---
    let pf = 0, pw = 0, pYeast = 0, mYeast = yeast, mFlour = flour, mWater = water;
    const hasPref = state.method !== 'direct';
    let prefEff = state.pref, prefClamped = false;
    if (hasPref) {
      const pHyd = state.method === 'poolish' ? 1 : state.bhyd / 100;
      // Das Vorteig-Wasser (pf × pHyd) darf das Gesamtwasser (flour × h) nie übersteigen —
      // sonst wird das Hauptteig-Restwasser negativ. Max-Anteil: hyd / pHyd.
      const maxPref = Math.min(100, (h / pHyd) * 100);
      if (prefEff > maxPref) { prefEff = Math.floor(maxPref); prefClamped = true; }
      pf = flour * (prefEff / 100);
      pw = pf * pHyd;
      // Alle Hefe in den Vorteig (klassische Biga/Poolish-Methode)
      pYeast = yeast;
      mYeast = 0;
      mFlour = flour - pf;
      mWater = water - pw;
    }

    // --- Wassertemperatur (DDT-Methode) ---
    // Wassertemp = DDT*3 - Mehltemp - Raumtemp - Reibungsfaktor
    const friction = parseFloat(state.knead); // Hand 3, Maschine 6
    let wT = state.ddt * 3 - state.room - state.flourTemp - friction;
    wT = Math.round(wT * 10) / 10;

    // --- Eismenge, um Schüttwasser auf wT zu bringen (aus Leitungswasser ~ room) ---
    // Bei Vorteig (Biga/Poolish) wird NICHT das Gesamtwasser gekühlt, sondern nur das
    // Hauptteig-Restwasser (mWater) — das Vorteig-Wasser ist laut Anleitung
    // (guide.step.prefWeigh.tip) bewusst zimmerwarm und Stunden vorher schon verbraucht.
    // Bei method:'direct' ist mWater === water (unverändert seit der Initialisierung oben),
    // daher hier einheitlich mit mWater statt water rechnen — kein Sonderfall für 'direct' nötig.
    let ice = 0, note = '';
    const Ttap = state.room;
    // Grenzfall (v3.48.0-Fix): bei sehr hohem Vorteig-Anteil kann das gesamte Wasser im
    // Vorteig stecken (z. B. Poolish-Preset an der Klemmgrenze) — dann gibt es kein
    // Schüttwasser mehr zu temperieren. Derselbe Schwellwert wie js/guide.js (hasMW),
    // damit Anleitungsschritt und Ergebnis-Panel konsistent verschwinden.
    const hasMixingWater = mWater >= 1;
    if (!hasMixingWater) {
      note = t('calc.noMixingWaterNote');
    } else if (wT < Ttap - 0.5) {
      // Energiebilanz mit Schmelzwärme: x*(334+4.18*wT)=(M-x)*4.18*(Ttap-wT)
      const M = mWater; // nur das tatsächlich zu kühlende Hauptteig-Restwasser
      const c = 4.18, Lf = 334;
      const x = M * c * (Ttap - wT) / (Lf + c * wT + c * (Ttap - wT));
      ice = Math.max(0, Math.round(x));
      note = t('calc.ice.note', { tapWater: Math.round(M - ice), tapTemp: Ttap, ice: ice, wT: wT });
    } else if (wT > Ttap + 1) {
      note = t('calc.warmNote', { wT: wT });
    } else {
      note = t('calc.tapOkNote', { tapTemp: Ttap });
    }
    if (hasMixingWater && wT < 1) note += t('calc.veryColdWarn');

    return {
      N, W, total, totalBase, wasteAdj, flour, water, salt, oil, sugar, yeast, yWord,
      pf, pw, pYeast, mYeast, mFlour, mWater,
      wT, ice, Ttap, prefEff, prefClamped,
      hasPref, hasMixingWater, note
    };
  }
  PZ.calcCore = calcCore;

  // ======================================================================
  // renderResult(R) — schreibt das bereits berechnete Ergebnis ins DOM
  // ======================================================================
  function renderResult(R) {
    $('totalW').textContent = Math.round(R.total);
    $('ballsOut').textContent = R.N;
    $('ballwOut').textContent = R.W;
    // Verschwendungsaufschlag (v3.64.0): "Gesamtteig" zeigt jetzt ggf. mehr als
    // N×Teiglingsgewicht (die Zahlen unter dem großen Gesamtgewicht) -- ohne Hinweis
    // sähe das wie ein Rechenfehler aus. Blendet sich bei 0 % Aufschlag komplett aus.
    if ($('wasteNote')) {
      const showWaste = R.wasteAdj >= 0.05;
      $('wasteNote').style.display = showWaste ? '' : 'none';
      if (showWaste) $('wasteNote').textContent = t('result.wasteNote', { pct: Math.round(R.wasteAdj) });
    }
    $('gFlour').textContent = Math.round(R.flour);
    $('gWater').textContent = Math.round(R.water);
    $('gSalt').textContent  = R.salt.toFixed(1);
    $('gYeast').textContent = R.yeast < 10 ? R.yeast.toFixed(2) : Math.round(R.yeast);
    $('yLabel').textContent = R.yWord;
    if ($('gOil')) $('gOil').textContent = R.oil.toFixed(1);
    // Öl-Zeile ganz ausblenden, wenn kein Öl im Rezept
    if ($('gOilRow')) $('gOilRow').style.display = R.oil >= 0.05 ? 'flex' : 'none';
    if ($('gSugar')) $('gSugar').textContent = R.sugar.toFixed(1);
    // Zucker-Zeile ganz ausblenden, wenn kein Zucker im Rezept (Standard: New-York-Style-Feld ist 0)
    if ($('gSugarRow')) $('gSugarRow').style.display = R.sugar >= 0.05 ? 'flex' : 'none';

    if (R.hasPref) {
      $('pFlour').textContent = Math.round(R.pf);
      $('pWater').textContent = Math.round(R.pw);
      $('pYeast').textContent = R.pYeast < 10 ? R.pYeast.toFixed(2) : Math.round(R.pYeast);
      $('pyLabel').textContent = R.yWord;
      // Hauptteig = Rest
      $('mFlour').textContent = Math.round(R.mFlour);
      $('mWater').textContent = Math.round(R.mWater);
      $('mSalt').textContent = R.salt.toFixed(1);
      $('mYeast').textContent = R.mYeast < 10 ? R.mYeast.toFixed(2) : Math.round(R.mYeast);
      // bei sehr langer Führung oft keine zusätzliche Hefe
      $('mYeastRow').style.display = R.mYeast < 0.05 ? 'none' : 'flex';
      // Öl kommt komplett in den Hauptteig (nie in Biga/Poolish)
      if ($('mOil')) $('mOil').textContent = R.oil.toFixed(1);
      if ($('mOilRow')) $('mOilRow').style.display = R.oil >= 0.05 ? 'flex' : 'none';
      // Zucker kommt komplett in den Hauptteig (nie in Biga/Poolish, analog zu Öl)
      if ($('mSugar')) $('mSugar').textContent = R.sugar.toFixed(1);
      if ($('mSugarRow')) $('mSugarRow').style.display = R.sugar >= 0.05 ? 'flex' : 'none';
    }

    $('waterTemp').textContent = R.wT;
    $('iceAmt').textContent = R.ice;
    $('iceNote').innerHTML = R.note;
    // Ganzen Wassertemperatur-Block ausblenden, wenn es kein Schüttwasser mehr gibt
    // (analog zum bestehenden Öl-/Zucker-Zeilen-Muster, s. gOilRow/gSugarRow oben).
    if ($('tempStage')) $('tempStage').style.display = R.hasMixingWater ? '' : 'none';
  }
  PZ.renderResult = renderResult;

  // ======================================================================
  // calc() — Fassade: rechnet, publiziert PZ.R, rendert, löst die Anleitung aus.
  // Bestehende Aufrufer (js/ui.js, js/presets.js, js/storage.js, js/share.js, ...)
  // rufen weiterhin unverändert PZ.calc() auf.
  // ======================================================================
  function calc() {
    const state = PZ.state;
    const R = calcCore(state);
    PZ.R = R;
    renderResult(R);
    PZ.buildGuide();
  }

  PZ.calc = calc;
  // Sprachwechsel: kompletter Neu-Durchlauf (yWord-Label, Eiswasser-Hinweis, und am
  // Ende automatisch auch buildGuide() über den bestehenden calc()-Aufruf).
  if (PZ.i18nOnChange) PZ.i18nOnChange(function () { if (PZ.state && PZ.state.flour) calc(); });
})(window);
