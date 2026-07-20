/* newrecipe.js — eigenständiges Mini-Formular "Neues Rezept anlegen" (v3.22.0)
 *
 * Legt ein neues Rezept in der bestehenden Mehrfach-Rezepte-Bibliothek an
 * (js/storage.js), OHNE den aktuell auf der Hauptseite laufenden Rechner-
 * Zustand (PZ.state) zu berühren. Eigener, komplett unabhängiger Mini-State
 * (nrState) + eigene Bedienelemente (IDs mit "nr"-Präfix, z. B. #nrHyd statt
 * #hyd) — keine PZ.calc()-Aufrufe, kein Schreibzugriff auf PZ.state/PZ.set.
 *
 * Bewusst OHNE Zeitplan-Felder (Scope der Feature-Definition) und OHNE
 * "Kalte Gare"-Auswahl (im Scope nicht als eigenes Feld genannt) — neu
 * angelegte Rezepte bekommen dafür feste, unauffällige Defaults
 * (coldStage: 'balls', timeMode: 'start', timeISO: ''), die nach dem Laden
 * im Hauptrechner jederzeit normal änderbar sind.
 *
 * Zusätzlich: befüllt die neue "Eigene Rezepte"-Optgroup im #preset-Dropdown
 * der Hauptseite (PZ.refreshPresetCustomRecipes) — läuft auch für Rezepte,
 * die über die bestehende "Meine Rezepte"-Card angelegt/umbenannt/gelöscht
 * wurden (js/main.js ruft das über den erweiterten refreshRecipeSelect()
 * mit auf).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // --- Eigenständiger Mini-State (Schema identisch zu PZ.state, s. js/state.js,
  // damit das Ergebnis 1:1 als gültiges Rezept-state-Objekt gespeichert werden
  // kann) — bewusst eine eigene Kopie, keine Referenz auf PZ.state. ---
  const nrState = {
    balls: 4, ballw: 250, hyd: 62, salt: 2.8, oil: 2, sugar: 0,
    method: 'direct', pref: 70, bhyd: 45, prefMature: 24, prefStage: 'b24',
    yeastType: 'fresh', yeast: 0.30,
    ddt: 24, room: 21, flourTemp: 21, knead: '3',
    flour: 'caputo_pizzeria'
  };

  const nrCard = $('newRecipeCard');
  if (!nrCard) return; // Karte nicht auf dieser Seite vorhanden -> Modul inaktiv

  // --- Slider <-> Zahlenfeld, analog zu link() in js/ui.js, aber OHNE PZ.calc()
  // und OHNE Bezug auf PZ.state — schreibt ausschliesslich in nrState. `unitKey`
  // ist (wie in js/ui.js) ein Wörterbuch-Key, kein fertiger String, damit ein
  // späterer Sprachwechsel den aria-valuetext auffrischen kann (s. nrUnitLinks).
  const nrUnitLinks = [];
  function nrLink(sliderId, numberId, key, decimals, unitKey) {
    const s = $(sliderId), n = $(numberId), v = $(sliderId + 'V');
    // Deutsches Komma statt Punkt (v3.32.0-Bugfix), analog zu link() in js/ui.js.
    function fmt(val) { return decimals != null ? val.toFixed(decimals).replace('.', ',') : val; }
    function set(val, from) {
      val = parseFloat(val);
      if (isNaN(val)) return;
      nrState[key] = val;
      if (from !== 's') s.value = val;
      if (from !== 'n') n.value = val;
      const disp = fmt(val);
      if (v) v.textContent = disp;
      if (unitKey) s.setAttribute('aria-valuetext', disp + ' ' + t(unitKey));
    }
    if (unitKey) { s.setAttribute('aria-valuetext', fmt(parseFloat(s.value)) + ' ' + t(unitKey)); nrUnitLinks.push({ slider: s, unitKey: unitKey, fmt: fmt }); }
    s.addEventListener('input', () => set(s.value, 's'));
    n.addEventListener('input', () => set(n.value, 'n'));
    return set;
  }

  const nrSet = {
    balls: nrLink('nrBalls', 'nrBallsN', 'balls', 0, 'unit.balls'),
    ballw: nrLink('nrBallw', 'nrBallwN', 'ballw', 0, 'unit.grams'),
    hyd: nrLink('nrHyd', 'nrHydN', 'hyd', 0, 'unit.percentHyd'),
    salt: nrLink('nrSalt', 'nrSaltN', 'salt', 1, 'unit.percentSalt'),
    oil: nrLink('nrOil', 'nrOilN', 'oil', 1, 'unit.percentOil'),
    sugar: nrLink('nrSugar', 'nrSugarN', 'sugar', 1, 'unit.percentSugar'),
    pref: nrLink('nrPref', 'nrPrefN', 'pref', 0, 'unit.percentPref'),
    bhyd: nrLink('nrBhyd', 'nrBhydN', 'bhyd', 0, 'unit.percentBhyd'),
    yeast: nrLink('nrYeast', 'nrYeastN', 'yeast', 2, 'unit.percentYeast'),
    ddt: nrLink('nrDdt', 'nrDdtN', 'ddt', 1, 'unit.celsiusDdt'),
    room: nrLink('nrRoom', 'nrRoomN', 'room', 0, 'unit.celsiusRoom'),
    flourTemp: nrLink('nrFlourTemp', 'nrFlourTempN', 'flourTemp', 0, 'unit.celsiusFlourTemp')
  };

  document.querySelectorAll('[data-nrballw]').forEach(b => b.onclick = () => nrSet.ballw(b.dataset.nrballw));
  document.querySelectorAll('[data-nryeast]').forEach(b => b.onclick = () => nrSet.yeast(b.dataset.nryeast));

  // --- Segment-Buttons, analog zu seg()/selectSeg() in js/ui.js, aber schreibt
  // nur in nrState (kein PZ.calc(), keine Rückwirkung auf #preset). ---
  function nrSeg(containerId, attr, key, after) {
    const c = $(containerId);
    c.querySelectorAll('button').forEach(b => b.onclick = () => {
      c.querySelectorAll('button').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      nrState[key] = b.dataset[attr];
      if (after) after();
    });
  }

  // --- Vorteig-Reife-Stufen (Biga/Poolish): nutzt dieselbe Datenquelle wie die
  // Hauptseite (PZ.PREF_STAGES, js/ui.js), koppelt Reifezeit + Hefemenge exakt
  // wie dort — nur eben isoliert im Mini-Formular. ---
  const PREF_DEFAULT = { biga: 'b24', poolish: 'p14' };

  function nrRenderPrefStages(m) {
    const wrap = $('nrPrefStage');
    const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
    wrap.innerHTML = '';
    stages.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.ps = s.key;
      b.setAttribute('aria-pressed', 'false');
      b.textContent = s.label;
      b.onclick = () => nrSelectPrefStage(m, s.key);
      wrap.appendChild(b);
    });
  }
  function nrHighlightPrefStage(key) {
    const wrap = $('nrPrefStage');
    let matured = '';
    wrap.querySelectorAll('button').forEach(b => {
      const on = b.dataset.ps === key;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
      if (on) matured = b.textContent.split(' ·')[0];
    });
    if (matured) $('nrPrefStageVal').textContent = matured;
  }
  function nrSelectPrefStage(m, key) {
    const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
    const s = stages.find(x => x.key === key) || stages[0];
    if (!s) return;
    nrState.prefStage = s.key;
    nrState.prefMature = s.mature;
    nrHighlightPrefStage(s.key);
    nrSet.yeast(s.yeast);
  }

  function nrApplyMethod() {
    const m = nrState.method;
    const isPref = m !== 'direct';
    $('nrPrefBlock').classList.toggle('show', isPref);
    $('nrBigaHydBlock').classList.toggle('show', m === 'biga');
    $('nrPrefStageBlock').classList.toggle('show', isPref);
    $('nrYeastPills').style.display = isPref ? 'none' : '';
    // Sichtbare Kopplung (v3.31.0), analog zu applyMethod() in js/ui.js.
    $('nrYeastField').classList.toggle('coupled', isPref);
    $('nrYeastCoupledBadge').hidden = !isPref;
    if (isPref) {
      nrRenderPrefStages(m);
      const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
      const valid = stages.some(s => s.key === nrState.prefStage);
      nrSelectPrefStage(m, valid ? nrState.prefStage : PREF_DEFAULT[m]);
    }
  }

  nrSeg('nrMethod', 'm', 'method', nrApplyMethod);
  nrSeg('nrYeastType', 'y', 'yeastType');
  nrSeg('nrKnead', 'k', 'knead');
  nrApplyMethod();

  // --- Mehl-Dropdown, analog zur Befüllung von #flour in js/flour.js — eigene
  // Kopie statt Wiederverwendung, da flour.js fest auf #flour/PZ.state verdrahtet ist. ---
  function populateNrFlour() {
    const sel = $('nrFlour');
    if (!sel || !PZ.FLOURS) return;
    const prevValue = sel.value || nrState.flour;
    sel.innerHTML = '';
    const groups = {};
    Object.keys(PZ.FLOURS).forEach(key => {
      const f = PZ.FLOURS[key];
      if (!groups[f.group]) {
        const og = document.createElement('optgroup');
        og.label = f.group;
        sel.appendChild(og);
        groups[f.group] = og;
      }
      const o = document.createElement('option');
      o.value = key;
      o.textContent = f.name + ' · W' + f.w + ' · ' + t(f.durKey);
      groups[f.group].appendChild(o);
    });
    sel.value = prevValue;
  }
  populateNrFlour();
  const nrFlourSel = $('nrFlour');
  if (nrFlourSel) nrFlourSel.addEventListener('change', () => { nrState.flour = nrFlourSel.value; });

  // --- Anlegen ---
  function showNrMsg(msg) {
    const el = $('nrLiveMsg');
    if (el) el.textContent = msg;
  }

  const nrCreateBtn = $('nrCreateBtn');
  if (nrCreateBtn) {
    nrCreateBtn.onclick = () => {
      const nameEl = $('nrName');
      const name = nameEl ? nameEl.value : '';
      // Feste, im Mini-Formular nicht editierbare Felder ergänzen, damit ein
      // vollständiges, mit applyState() kompatibles Rezept-state-Objekt entsteht.
      const fullState = Object.assign({}, nrState, {
        coldStage: 'balls',
        timeMode: 'start',
        timeISO: ''
      });
      const rec = PZ.addRecipeFromState(name, fullState);
      if (nameEl) nameEl.value = '';
      if (PZ.refreshRecipeSelect) PZ.refreshRecipeSelect();
      showNrMsg(t('newrecipe.createdMsg', { name: rec.name }));
    };
  }

  // --- "Eigene Rezepte"-Optgroup im #preset-Dropdown (Hauptseite) ---------
  // Rein additiv: baut nur den Inhalt der eigens dafür vorgesehenen, leeren
  // Optgroup (#presetCustomGroup) neu auf, alle anderen <option>s im Select
  // bleiben unangetastet. Erhält die aktuelle Auswahl, sofern der gewählte
  // Wert nach dem Neuaufbau noch existiert (z. B. nach dem Löschen eines
  // gerade dort ausgewählten Rezepts). Seit v3.22.0 gibt es keine "Eigene
  // Einstellung"-Option mehr als Fallback — OHNE Gegenmaßnahme würde
  // `sel.value = current` in diesem Fall still fehlschlagen: der native
  // <select> landet bei `selectedIndex = -1` (kein Options-Text sichtbar,
  // kein programmatisch bestimmbarer Zustand mehr — WCAG 4.1.2, per
  // accessibility-expert-Audit gefunden und mit Headless-Edge-CDP
  // reproduziert). Fix: eine unsichtbare, nicht wählbare Platzhalter-Option
  // (`<option value="" disabled hidden>`, s. HTML) fängt genau diesen Fall
  // auf — bleibt für die normale Bedienung unsichtbar/unwählbar (disabled),
  // wird aber gültiges Ziel für `sel.value = ''`, sodass der Select immer
  // einen klar benannten Zustand hat.
  function refreshPresetCustomRecipes() {
    const group = $('presetCustomGroup');
    const sel = $('preset');
    if (!group || !sel || !PZ.listRecipes) return;
    const current = sel.value;
    group.innerHTML = '';
    PZ.listRecipes().forEach(r => {
      const o = document.createElement('option');
      o.value = 'recipe:' + r.id;
      o.textContent = r.name;
      group.appendChild(o);
    });
    sel.value = current;
    if (sel.selectedIndex === -1) sel.value = '';
  }
  PZ.refreshPresetCustomRecipes = refreshPresetCustomRecipes;
  refreshPresetCustomRecipes();

  // Sprachwechsel: Regler-Einheiten (aria-valuetext) und das Mehl-Dropdown (nur der
  // "dur"-Teil je Option ändert sich) auffrischen.
  if (PZ.i18nOnChange) {
    PZ.i18nOnChange(function () {
      nrUnitLinks.forEach(function (u) {
        u.slider.setAttribute('aria-valuetext', u.fmt(parseFloat(u.slider.value)) + ' ' + t(u.unitKey));
      });
      populateNrFlour();
    });
  }
})(window);
