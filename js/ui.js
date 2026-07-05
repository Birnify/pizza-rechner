/* ui.js — Bedienelemente: Slider/Zahlenfelder, Segmente, Pills, Zeitplan */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;
  const state = PZ.state;

  // --- Slider <-> Number Verknüpfung ---
  function link(slider, number, key, decimals) {
    const s = $(slider), n = $(number), v = $(key + 'V');
    function set(val, from) {
      val = parseFloat(val);
      if (isNaN(val)) return;
      state[key] = val;
      if (from !== 's') s.value = val;
      if (from !== 'n') n.value = val;
      if (v) v.textContent = decimals != null ? val.toFixed(decimals) : val;
      PZ.calc();
    }
    s.addEventListener('input', () => set(s.value, 's'));
    n.addEventListener('input', () => set(n.value, 'n'));
    return set;
  }

  // Setter-Sammlung (von presets.js und storage.js genutzt)
  PZ.set = {
    balls: link('balls', 'ballsN', 'balls', 0),
    ballw: link('ballw', 'ballwN', 'ballw', 0),
    hyd:   link('hyd', 'hydN', 'hyd', 0),
    salt:  link('salt', 'saltN', 'salt', 1),
    pref:  link('pref', 'prefN', 'pref', 0),
    bhyd:  link('bhyd', 'bhydN', 'bhyd', 0),
    yeast: link('yeast', 'yeastN', 'yeast', 2),
    ddt:   link('ddt', 'ddtN', 'ddt', 1),
    room:  link('room', 'roomN', 'room', 0)
  };

  // --- Quick-Pills ---
  document.querySelectorAll('[data-ballw]').forEach(b => b.onclick = () => PZ.set.ballw(b.dataset.ballw));
  document.querySelectorAll('[data-yeast]').forEach(b => b.onclick = () => PZ.set.yeast(b.dataset.yeast));

  // --- Segment-Buttons ---
  function seg(containerId, attr, key, after) {
    const c = $(containerId);
    c.querySelectorAll('button').forEach(b => b.onclick = () => {
      c.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      state[key] = b.dataset[attr];
      if (after) after();
      PZ.calc();
    });
  }
  function selectSeg(cid, attr, val) {
    const c = $(cid);
    c.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', b.dataset[attr] == String(val));
    });
  }

  const methodHints = {
    direct: 'Direkt: alle Zutaten auf einmal. Einfachster Weg.',
    biga: 'Biga: steifer Vorteig (Vortag, 16–20 h bei ~18 °C). Mehr Aroma &amp; Struktur.',
    poolish: 'Poolish: flüssiger Vorteig 1:1 (12–16 h). Milder, dehnbarer Teig.'
  };
  function applyMethod() {
    const m = state.method;
    const isPref = m !== 'direct';
    $('prefBlock').classList.toggle('show', isPref);
    $('bigaHydBlock').classList.toggle('show', m === 'biga');
    $('stagePref').classList.toggle('show', isPref);
    $('stageMain').classList.toggle('show', isPref);
    $('methodHint').innerHTML = methodHints[m];
    $('prefTitle').textContent = m === 'biga' ? 'Biga (Vortag)' : 'Poolish (Vortag)';
    $('prefHint').innerHTML = m === 'biga'
      ? 'Biga klassisch: 70–100 % des Mehls.'
      : 'Poolish: meist 30–50 % des Mehls (Wasser 1:1 dazu).';
  }

  // --- Zeitplan-Eingaben ---
  function updateTimeLabel() {
    const t = state.timeMode === 'target';
    $('timeLabel').textContent = t ? 'Soll fertig sein um' : 'Startzeitpunkt';
    $('timeHint').textContent = t
      ? 'Die Anleitung rechnet rückwärts und sagt dir, wann du anfangen musst.'
      : 'Die Anleitung rechnet vorwärts und zeigt, wann die Pizza fertig ist.';
  }

  seg('method', 'm', 'method', applyMethod);
  seg('yeastType', 'y', 'yeastType');
  seg('knead', 'k', 'knead');
  seg('coldStage', 'cs', 'coldStage');
  seg('timeMode', 'tm', 'timeMode', updateTimeLabel);

  $('timeISO').addEventListener('input', () => { state.timeISO = $('timeISO').value; PZ.calc(); });
  $('nowBtn').addEventListener('click', () => {
    const d = new Date(); d.setSeconds(0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    $('timeISO').value = iso; state.timeISO = iso; PZ.calc();
  });

  PZ.seg = seg;
  PZ.selectSeg = selectSeg;
  PZ.applyMethod = applyMethod;
  PZ.updateTimeLabel = updateTimeLabel;
})(window);
