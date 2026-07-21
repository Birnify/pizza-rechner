/* widgets.js — gemeinsame Fabrik-Funktionen für Bedienelemente (v3.56.0)
 *
 * js/ui.js (Hauptrechner) und js/newrecipe.js (eigenständiges Mini-Formular „Neues
 * Rezept anlegen") hatten bis v3.55.0 fast identische, unabhängig gepflegte Kopien
 * derselben Widget-Logik (~150 Zeilen doppelt): Slider<->Zahlenfeld-Verknüpfung
 * (link()/nrLink()), Segment-Buttons (seg()/nrSeg()), Vorteig-Reife-Stufen
 * (renderPrefStages()/nrRenderPrefStages() + Geschwister), Mehl-Dropdown-Befüllung
 * (js/flour.js renderFlourOptions() / newrecipe.js populateNrFlour()) sowie ein exakt
 * dupliziertes PREF_DEFAULT-Objekt. Echtes Divergenzrisiko: der Komma-Format-Fix
 * (v3.32.0) musste seinerzeit zweimal gemacht werden, weil beide Kopien unabhängig
 * existierten — und das Zahlenfeld-Clamping (v3.51.0, Fable-Review-Fund „B8") wurde
 * seither nur in js/ui.js nachgezogen, nicht in js/newrecipe.js (s. Nebenbefund am
 * Ende dieser Datei).
 *
 * Diese Datei liefert vier Fabrik-Funktionen, die je eine KONFIGURATION entgegennehmen
 * (welches State-Objekt beschrieben wird, ob/welche Nebeneffekte beim Setzen laufen
 * sollen) und eine fertige, aufrufbare Funktion zurückgeben — js/ui.js und
 * js/newrecipe.js rufen sie nur noch als dünne Konfigurationsaufrufe auf, die eigentliche
 * Logik steht genau einmal hier:
 *   - PZ.makeLink(cfg)       — ersetzt link()/nrLink()
 *   - PZ.makeSeg(cfg)        — ersetzt seg()/nrSeg()
 *   - PZ.makePrefStages(cfg) — ersetzt renderPrefStages()/highlightPrefStage()/
 *                              selectPrefStage() (+ die nr*-Geschwister)
 *   - PZ.fillFlourSelect(cfg) — ersetzt renderFlourOptions()/populateNrFlour()
 *
 * WICHTIG — keine Verhaltensänderung (Auftrag: reines Wartbarkeits-Refactoring):
 * js/ui.js hat seit v3.51.0 Zahlenfeld-Clamping in link(), js/newrecipe.js hatte es
 * NIE. PZ.makeLink() bekommt deshalb ein `clamp:true|false`-Flag, das genau diese
 * bestehende Asymmetrie 1:1 erhält (ui.js ruft mit clamp:true auf, newrecipe.js mit
 * clamp:false) — KEIN stillschweigendes Nachziehen des Clamping in newrecipe.js in
 * diesem Zug (das wäre eine Verhaltensänderung, nicht Teil dieses Auftrags). Als
 * Nebenbefund fürs Backlog dokumentiert, s. pizza-rechner-KONTEXT.md.
 *
 * Lädt früh (nach dom.js/state.js, vor flour.js/ui.js/newrecipe.js) — braucht nur
 * PZ.$ zur Aufrufzeit der zurückgegebenen Funktionen, keine Abhängigkeit zu
 * PZ.state/PZ.FLOURS/PZ.calc zum eigenen Ladezeitpunkt (die werden erst gebraucht,
 * wenn die konfigurierten Funktionen später tatsächlich aufgerufen werden).
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // ======================================================================
  // makeLink(cfg) — Slider <-> Zahlenfeld-Verknüpfung
  //   cfg.stateObj  — Objekt, in das state[key] geschrieben wird (PZ.state bzw. nrState)
  //   cfg.onSet     — optionaler Callback nach jedem Setzen (z. B. PZ.calc)
  //   cfg.clamp     — true: klemmt getippte/programmatische Werte auf min/max des
  //                   auslösenden Elements (s. Kommentar unten); false: kein Clamping
  //                   (bestehendes newrecipe.js-Verhalten, unverändert erhalten)
  //   cfg.unitLinks — Array, in das { slider, unitKey, fmt } für refreshUnits()-artige
  //                   Sprachwechsel-Auffrischung gepusht wird
  // Gibt link(sliderId, numberId, key, decimals, unitKey) zurück -- Aufruf/Rückgabewert
  // (die set()-Funktion) identisch zum bisherigen link()/nrLink().
  // ======================================================================
  function makeLink(cfg) {
    return function link(sliderId, numberId, key, decimals, unitKey) {
      const s = $(sliderId), n = $(numberId), v = $(sliderId + 'V');
      // Deutsches Komma statt Punkt (v3.32.0-Bugfix): das native <input type="number">
      // darunter rendert je nach OS-Locale mit Komma (z. B. deutsches Windows), während
      // `toFixed()` immer einen Punkt liefert — derselbe Wert sah dadurch wie zwei
      // unterschiedliche Zahlen aus. Fix: die rote Wertanzeige wird unabhängig von der
      // OS-Locale fest auf Komma normiert. `stateObj[key]` bleibt intern immer ein
      // normaler JS-Fließkommawert (Punkt) — nur die Anzeige wird umformatiert.
      function fmt(val) { return decimals != null ? val.toFixed(decimals).replace('.', ',') : val; }
      // Clamping (Fable-Review-Fund "B8", v3.51.0): HTML-`min`/`max`-Attribute
      // verhindern nur das Ziehen des Sliders, nicht das Eintippen eines Werts im
      // Zahlenfeld — `n`/`s` haben bewusst gestaffelte Grenzen (Zahlenfeld meist weiter
      // gefasst als der Slider), daher wird gegen die Grenzen des jeweils AUSLÖSENDEN
      // Elements geklemmt.
      function clampTo(el, val) {
        if (!el) return val;
        const lo = el.min !== '' ? parseFloat(el.min) : NaN;
        const hi = el.max !== '' ? parseFloat(el.max) : NaN;
        if (!isNaN(lo) && val < lo) val = lo;
        if (!isNaN(hi) && val > hi) val = hi;
        return val;
      }
      function set(val, from) {
        val = parseFloat(val);
        if (isNaN(val)) return;
        if (cfg.clamp) {
          const raw = val;
          val = clampTo(from === 's' ? s : n, val);
          const wasClamped = val !== raw;
          cfg.stateObj[key] = val;
          // Normalerweise wird das AUSLÖSENDE Element nicht zurückgeschrieben (vermeidet
          // Cursor-Sprünge/Störungen beim Tippen) — wurde der Wert aber geklemmt, muss
          // auch das auslösende Element den tatsächlich übernommenen Wert zeigen.
          if (from !== 's' || wasClamped) s.value = val;
          if (from !== 'n' || wasClamped) n.value = val;
        } else {
          cfg.stateObj[key] = val;
          if (from !== 's') s.value = val;
          if (from !== 'n') n.value = val;
        }
        const disp = fmt(val);
        if (v) v.textContent = disp;
        if (unitKey) s.setAttribute('aria-valuetext', disp + ' ' + t(unitKey));
        if (cfg.onSet) cfg.onSet();
      }
      if (unitKey) {
        s.setAttribute('aria-valuetext', fmt(parseFloat(s.value)) + ' ' + t(unitKey));
        if (cfg.unitLinks) cfg.unitLinks.push({ slider: s, unitKey: unitKey, fmt: fmt });
      }
      s.addEventListener('input', () => set(s.value, 's'));
      n.addEventListener('input', () => set(n.value, 'n'));
      return set;
    };
  }
  PZ.makeLink = makeLink;

  // ======================================================================
  // makeSeg(cfg) — Segment-Buttons (aktiver Button per .active/aria-pressed)
  //   cfg.stateObj — Objekt, in das state[key] geschrieben wird
  //   cfg.onSet    — optionaler Callback nach jedem Setzen (z. B. PZ.calc)
  // Gibt seg(containerId, attr, key, after) zurück -- identisch zum bisherigen
  // seg()/nrSeg(). selectSeg() (programmatisches Vorauswählen beim Laden) bleibt
  // unverändert nur in js/ui.js, da js/newrecipe.js nie ein Rezept lädt/vorbelegt.
  // ======================================================================
  function makeSeg(cfg) {
    return function seg(containerId, attr, key, after) {
      const c = $(containerId);
      c.querySelectorAll('button').forEach(b => b.onclick = () => {
        c.querySelectorAll('button').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('active');
        b.setAttribute('aria-pressed', 'true');
        cfg.stateObj[key] = b.dataset[attr];
        if (after) after();
        if (cfg.onSet) cfg.onSet();
      });
    };
  }
  PZ.makeSeg = makeSeg;

  // ======================================================================
  // makePrefStages(cfg) — Vorteig-Reife-Stufen (Biga/Poolish): koppeln Reifezeit +
  // Hefemenge (physikalisch abhängig), rendern als Pills, halten die aktive Stufe
  // hervorgehoben.
  //   cfg.stateObj      — Objekt, in das prefStage/prefMature geschrieben wird
  //   cfg.wrapId         — ID des Pills-Containers (z. B. 'prefStage'/'nrPrefStage')
  //   cfg.valId          — ID des Reifezeit-Anzeige-Elements (…StageVal)
  //   cfg.setYeast       — Funktion(yeastValue), setzt die gekoppelte Hefemenge
  //                        (z. B. PZ.set.yeast bzw. nrSet.yeast)
  //   cfg.onSelectClick  — optionaler Callback VOR dem eigentlichen select() bei
  //                        Nutzer-Klick auf eine Pill (ui.js nutzt das, um #preset
  //                        auf "Eigene" zurückzusetzen — newrecipe.js braucht das nicht)
  // Gibt { render(m), highlight(key), select(m,key), selectValidOrDefault(m) } zurück.
  // Letzteres bündelt das bisher in applyMethod()/nrApplyMethod() duplizierte Muster
  // "aktuelle Stufe gültig? behalten : auf PREF_DEFAULT[m] zurückfallen".
  // ======================================================================
  const PREF_DEFAULT = { biga: 'b24', poolish: 'p14' };

  function makePrefStages(cfg) {
    function render(m) {
      const wrap = $(cfg.wrapId);
      const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
      wrap.innerHTML = '';
      stages.forEach(s => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.ps = s.key;
        b.setAttribute('aria-pressed', 'false');
        b.textContent = s.label;
        b.onclick = () => {
          if (cfg.onSelectClick) cfg.onSelectClick();
          select(m, s.key);
        };
        wrap.appendChild(b);
      });
    }
    function highlight(key) {
      const wrap = $(cfg.wrapId);
      let matured = '';
      wrap.querySelectorAll('button').forEach(b => {
        const on = b.dataset.ps === key;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
        if (on) matured = b.textContent.split(' ·')[0];
      });
      if (matured) $(cfg.valId).textContent = matured;
    }
    function select(m, key) {
      const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
      const s = stages.find(x => x.key === key) || stages[0];
      if (!s) return;
      cfg.stateObj.prefStage = s.key;
      cfg.stateObj.prefMature = s.mature;
      highlight(s.key);
      cfg.setYeast(s.yeast);
    }
    function selectValidOrDefault(m) {
      const stages = (PZ.PREF_STAGES && PZ.PREF_STAGES[m]) || [];
      const valid = stages.some(s => s.key === cfg.stateObj.prefStage);
      select(m, valid ? cfg.stateObj.prefStage : PREF_DEFAULT[m]);
    }
    return { render: render, highlight: highlight, select: select, selectValidOrDefault: selectValidOrDefault };
  }
  PZ.makePrefStages = makePrefStages;

  // ======================================================================
  // fillFlourSelect(cfg) — Mehl-Dropdown aus PZ.FLOURS befüllen (eine Datenquelle,
  // keine Duplikation im HTML), gruppiert per <optgroup>, erhält die aktuelle Auswahl.
  //   cfg.selectId — ID des <select> (z. B. 'flour'/'nrFlour')
  //   cfg.stateObj — Objekt, dessen .flour als Fallback für die Vorauswahl dient,
  //                  falls das <select> selbst noch keinen Wert hat
  // Gibt render() zurück -- identisch zum bisherigen renderFlourOptions()/
  // populateNrFlour(). Das Schreiben von stateObj.flour beim change-Event (+ ggf.
  // PZ.calc()) bleibt bewusst AUSSERHALB dieser Fabrik (js/flour.js und
  // js/newrecipe.js verdrahten das weiterhin je selbst, da nur flour.js danach
  // PZ.calc() auslöst).
  // ======================================================================
  function fillFlourSelect(cfg) {
    return function render() {
      const sel = $(cfg.selectId);
      if (!sel || !PZ.FLOURS) return;
      const prevValue = sel.value || cfg.stateObj.flour;
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
    };
  }
  PZ.fillFlourSelect = fillFlourSelect;
})(window);
