/* calc.js — Hauptberechnung (Bäckerprozente, Wassertemperatur, Eismenge) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // letzte Ergebnisse (für die Anleitung)
  PZ.R = {};

  function calc() {
    const state = PZ.state;
    const N = state.balls, W = state.ballw;
    const total = N * W;
    const h = state.hyd / 100, s = state.salt / 100, y = state.yeast / 100;
    const o = (state.oil || 0) / 100;
    const su = (state.sugar || 0) / 100;

    // Mehl = Total / (1 + Hydration + Salz + Hefe + Öl + Zucker)
    // (Öl und Zucker sind Bäckerprozente wie Salz/Hefe → das Gesamtgewicht bleibt exakt N×W.)
    const flour = total / (1 + h + s + y + o + su);
    const water = flour * h;
    const salt  = flour * s;
    const oil   = flour * o;
    const sugar = flour * su;
    let yeast   = flour * y;                       // immer als Frischhefe gerechnet
    if (state.yeastType === 'dry') yeast *= PZ.FRESH_TO_DRY;
    const yWord = state.yeastType === 'dry' ? t('yeast.dry') : t('yeast.fresh');

    // Vorteig-Werte (unten ggf. gefüllt)
    let pf = 0, pw = 0, pYeast = 0, mYeast = yeast, mFlour = flour, mWater = water;

    $('totalW').textContent = Math.round(total);
    $('ballsOut').textContent = N;
    $('ballwOut').textContent = W;
    $('gFlour').textContent = Math.round(flour);
    $('gWater').textContent = Math.round(water);
    $('gSalt').textContent  = salt.toFixed(1);
    $('gYeast').textContent = yeast < 10 ? yeast.toFixed(2) : Math.round(yeast);
    $('yLabel').textContent = yWord;
    if ($('gOil')) $('gOil').textContent = oil.toFixed(1);
    // Öl-Zeile ganz ausblenden, wenn kein Öl im Rezept
    if ($('gOilRow')) $('gOilRow').style.display = oil >= 0.05 ? 'flex' : 'none';
    if ($('gSugar')) $('gSugar').textContent = sugar.toFixed(1);
    // Zucker-Zeile ganz ausblenden, wenn kein Zucker im Rezept (Standard: New-York-Style-Feld ist 0)
    if ($('gSugarRow')) $('gSugarRow').style.display = sugar >= 0.05 ? 'flex' : 'none';

    // --- Vorteig-Aufteilung ---
    let prefEff = state.pref, prefClamped = false;
    if (state.method !== 'direct') {
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
      $('pFlour').textContent = Math.round(pf);
      $('pWater').textContent = Math.round(pw);
      $('pYeast').textContent = pYeast < 10 ? pYeast.toFixed(2) : Math.round(pYeast);
      $('pyLabel').textContent = yWord;
      // Hauptteig = Rest
      $('mFlour').textContent = Math.round(flour - pf);
      $('mWater').textContent = Math.round(water - pw);
      $('mSalt').textContent = salt.toFixed(1);
      $('mYeast').textContent = mYeast < 10 ? mYeast.toFixed(2) : Math.round(mYeast);
      // bei sehr langer Führung oft keine zusätzliche Hefe
      $('mYeastRow').style.display = mYeast < 0.05 ? 'none' : 'flex';
      // Öl kommt komplett in den Hauptteig (nie in Biga/Poolish)
      if ($('mOil')) $('mOil').textContent = oil.toFixed(1);
      if ($('mOilRow')) $('mOilRow').style.display = oil >= 0.05 ? 'flex' : 'none';
      // Zucker kommt komplett in den Hauptteig (nie in Biga/Poolish, analog zu Öl)
      if ($('mSugar')) $('mSugar').textContent = sugar.toFixed(1);
      if ($('mSugarRow')) $('mSugarRow').style.display = sugar >= 0.05 ? 'flex' : 'none';
    }

    // --- Wassertemperatur (DDT-Methode) ---
    // Wassertemp = DDT*3 - Mehltemp - Raumtemp - Reibungsfaktor
    const friction = parseFloat(state.knead); // Hand 3, Maschine 6
    let wT = state.ddt * 3 - state.room - state.flourTemp - friction;
    wT = Math.round(wT * 10) / 10;
    $('waterTemp').textContent = wT;

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
    $('iceAmt').textContent = ice;
    $('iceNote').innerHTML = note;
    // Ganzen Wassertemperatur-Block ausblenden, wenn es kein Schüttwasser mehr gibt
    // (analog zum bestehenden Öl-/Zucker-Zeilen-Muster, s. gOilRow/gSugarRow oben).
    if ($('tempStage')) $('tempStage').style.display = hasMixingWater ? '' : 'none';

    PZ.R = { N, W, total, flour, water, salt, oil, sugar, yeast, yWord, pf, pw, pYeast, mYeast, mFlour, mWater, wT, ice, Ttap, prefEff, prefClamped };
    PZ.buildGuide();
  }

  PZ.calc = calc;
  // Sprachwechsel: kompletter Neu-Durchlauf (yWord-Label, Eiswasser-Hinweis, und am
  // Ende automatisch auch buildGuide() über den bestehenden calc()-Aufruf).
  if (PZ.i18nOnChange) PZ.i18nOnChange(function () { if (PZ.state && PZ.state.flour) calc(); });
})(window);
