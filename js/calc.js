/* calc.js — Hauptberechnung (Bäckerprozente, Wassertemperatur, Eismenge) */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  // letzte Ergebnisse (für die Anleitung)
  PZ.R = {};

  function calc() {
    const state = PZ.state;
    const N = state.balls, W = state.ballw;
    const total = N * W;
    const h = state.hyd / 100, s = state.salt / 100, y = state.yeast / 100;

    // Mehl = Total / (1 + Hydration + Salz + Hefe)
    const flour = total / (1 + h + s + y);
    const water = flour * h;
    const salt  = flour * s;
    let yeast   = flour * y;                       // immer als Frischhefe gerechnet
    if (state.yeastType === 'dry') yeast *= PZ.FRESH_TO_DRY;
    const yWord = state.yeastType === 'dry' ? '(trocken)' : '(frisch)';

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

    // --- Vorteig-Aufteilung ---
    if (state.method !== 'direct') {
      pf = flour * (state.pref / 100);
      const pHyd = state.method === 'poolish' ? 1 : state.bhyd / 100;
      pw = pf * pHyd;
      // Hefe größtenteils in den Vorteig
      pYeast = yeast * 0.9;
      mYeast = yeast - pYeast;
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
    }

    // --- Wassertemperatur (DDT-Methode) ---
    // Wassertemp = DDT*3 - Mehltemp - Raumtemp - Reibungsfaktor
    const friction = parseFloat(state.knead); // Hand 3, Maschine 6
    let wT = state.ddt * 3 - state.room - state.room - friction;
    // (Mehl- und Raumtemp als gleich angenommen = state.room)
    wT = Math.round(wT * 10) / 10;
    $('waterTemp').textContent = wT;

    // --- Eismenge, um Schüttwasser auf wT zu bringen (aus Leitungswasser ~ room) ---
    let ice = 0, note = '';
    const Ttap = state.room;
    if (wT < Ttap - 0.5) {
      // Energiebilanz mit Schmelzwärme: x*(334+4.18*wT)=(M-x)*4.18*(Ttap-wT)
      const M = water; // gesamte Wassermenge im Teig
      const c = 4.18, Lf = 334;
      const x = M * c * (Ttap - wT) / (Lf + c * wT + c * (Ttap - wT));
      ice = Math.max(0, Math.round(x));
      note = `Nimm <b>${Math.round(M - ice)} g Leitungswasser (~${Ttap}°)</b> + <b>${ice} g Eis</b>, ergibt ~${wT}° Schüttwasser. Eis vorher abwiegen.`;
    } else if (wT > Ttap + 1) {
      note = `Schüttwasser leicht anwärmen auf ~${wT}° (z.B. handwarm).`;
    } else {
      note = `Leitungswasser bei ~${Ttap}° passt direkt — kein Eis nötig.`;
    }
    if (wT < 1) note += ' <b>Achtung:</b> sehr kalt — ggf. Mehl vorher kühlen.';
    $('iceAmt').textContent = ice;
    $('iceNote').innerHTML = note;

    PZ.R = { N, W, total, flour, water, salt, yeast, yWord, pf, pw, pYeast, mYeast, mFlour, mWater, wT, ice, Ttap };
    PZ.buildGuide();
  }

  PZ.calc = calc;
})(window);
