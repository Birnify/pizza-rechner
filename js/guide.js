/* guide.js — adaptive Schritt-für-Schritt-Anleitung + Zeitberechnung */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  // Rundung für Mengenangaben
  function g(x) { return x < 10 ? (Math.round(x * 100) / 100) : Math.round(x); }

  function fmtClock(d) {
    const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()];
    const p = n => String(n).padStart(2, '0');
    return `${wd} ${p(d.getDate())}.${p(d.getMonth() + 1)}. · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function fmtDur(min) {
    min = Math.round(min);
    if (min < 60) return min + ' min';
    const h = Math.round(min / 60);
    if (h < 24) return h + ' h';
    const d = Math.floor(h / 24), r = h % 24;
    return d + ' Tg' + (r ? ' ' + r + ' h' : '');
  }

  // Bausteine für die _items-Liste
  let _items = [];
  function sec(t) { _items.push({ sec: t }); }
  function st(title, chip, body, extra, dur, opts) {
    _items.push(Object.assign({ title, chip, body, extra: extra || '', dur: dur || 0 }, opts || {}));
  }
  function tip(t) { return `<div class="tip">💡 ${t}</div>`; }
  function warn(t) { return `<div class="warn">⚠️ ${t}</div>`; }

  function buildGuide() {
    const state = PZ.state;
    const R = PZ.R;
    if (!R.flour) return;
    const f = PZ.schedule();

    // Mehl-Warnung (bei Vorteig zählt die Reifezeit des Vorteigs mit zur Gesamtgärzeit)
    if (PZ.getFlour) {
      const fl = PZ.getFlour();
      const prefH = state.method === 'biga' ? 18 : state.method === 'poolish' ? 16 : 0;
      const totalH = (f.bulkMin + f.proofMin) / 60 + prefH;
      const warnMsgs = [];
      if (totalH > fl.maxH) {
        warnMsgs.push(`Gärzeit zu lang für <b>${fl.name}</b> (W${fl.w}): ~${Math.round(totalH)} h geplant, max. ${fl.maxH} h empfohlen. Das Gluten baut ab — Teig wird klebrig und reißt. Entweder stärkeres Mehl wählen oder Hefemenge erhöhen.`);
      } else if (fl.minH > 0 && totalH < fl.minH) {
        warnMsgs.push(`Gärzeit zu kurz für <b>${fl.name}</b> (W${fl.w}): ~${Math.round(totalH)} h geplant, mind. ${fl.minH} h empfohlen. Das Gluten hat keine Zeit sich auszuentspannen — der Teig federt zurück und lässt sich kaum ausziehen. Entweder schwächeres Mehl wählen oder Hefemenge reduzieren.`);
      }
      if (state.hyd > fl.hydMax) {
        warnMsgs.push(`Hydration zu hoch für <b>${fl.name}</b>: ${state.hyd} % gewählt, max. ${fl.hydMax} % empfohlen. Der Teig kann sehr klebrig werden und schwer zu formen sein.`);
      } else if (state.hyd < fl.hydMin) {
        warnMsgs.push(`Hydration etwas niedrig für <b>${fl.name}</b>: ${state.hyd} % gewählt, ${fl.hydMin}–${fl.hydMax} % wären ideal.`);
      }
      const warnEl = document.getElementById('flourWarn');
      if (warnEl) warnEl.innerHTML = warnMsgs.map(w => `<div class="warn">⚠️ ${w}</div>`).join('');
    }

    const m = state.method, isBiga = m === 'biga', pref = m !== 'direct';
    const hi = state.hyd >= 70;               // hohe Hydration → Stretch & Fold
    const iceTxt = R.ice > 0 ? ` (davon <b>${R.ice} g Eis</b>)` : '';
    _items = [];

    // ===== VORTEIG (Biga / Poolish) =====
    if (pref) {
      sec(isBiga ? 'Vorteig — Biga ansetzen' : 'Vorteig — Poolish ansetzen');
      const clampNote = R.prefClamped
        ? warn(`Der Vorteig-Anteil wurde automatisch auf <b>${Math.round(R.prefEff)} %</b> begrenzt: bei ${state.hyd} % Hydration passt nicht mehr Wasser in den ${isBiga ? 'Biga' : 'Poolish (1:1)'} als insgesamt im Teig ist.`)
        : '';
      st('Vorteig abwiegen', '~5 min',
        `Für den ${isBiga ? 'Biga' : 'Poolish'}: <b>${g(R.pf)} g Mehl</b>, <b>${g(R.pw)} g Wasser</b> (${isBiga ? state.bhyd + '%' : '100% — also 1:1'}) und <b>${g(R.pYeast)} g Hefe ${R.yWord}</b>.`,
        clampNote + tip('Wasser hier <b>zimmerwarm</b> (nicht eisgekühlt) – der Vorteig soll ja in Ruhe arbeiten.'), 5);
      if (isBiga) {
        st('Biga grob mischen', 'mit der Hand',
          `Hefe im Wasser auflösen, übers Mehl geben und <b>mit den Händen nur grob vermengen</b> – ca. <b>1–2 min</b>, bis keine trockenen Mehlnester mehr da sind. Die Biga bleibt krümelig-stückig, <b>nicht glatt kneten</b>. (Hier keine Maschine nutzen – zu festes Kneten zerstört die Struktur.)`,
          warn('Es soll aussehen wie nasse Brösel oder grober Streusel, nicht wie ein normaler Teig.'), 10);
        st('Biga reifen lassen', '16–20 h',
          `Abgedeckt bei <b>ca. 18 °C</b> reifen lassen. Sie lockert sich auf und duftet säuerlich-hefig. Bei 21–22 °C reichen 14–16 h.`,
          tip('Keller, Speisekammer oder Kühlschranktür treffen die 18 °C oft gut.'), 1080);
      } else {
        st('Poolish verrühren', 'mit Löffel / Schneebesen',
          `Hefe im Wasser auflösen, dann Mehl einrühren – <b>mit einem Löffel oder Schneebesen ca. 2–3 min rühren</b>, bis ein <b>zäher, klumpenfreier Pfannkuchenteig</b> entsteht. Abdecken.`, '', 10);
        st('Poolish reifen lassen', '12–24 h',
          `<b>1 h</b> bei Raumtemp anspringen lassen, dann kühl stellen. Reif = Oberfläche <b>voller Blasen</b>, kurz bevor er wieder einfällt.`,
          tip('Fingertest: riecht angenehm nach Hefe/Joghurt, nicht stechend nach Alkohol.'), 960);
      }
      sec('Hauptteig');
      const hasMW = R.mWater >= 1, hasMF = R.mFlour >= 1;
      if (hasMW) {
        st('Schüttwasser temperieren', `${R.wT} °C`,
          `<b>${g(R.mWater)} g Wasser</b> auf <b>${R.wT} °C</b> bringen${iceTxt}. Das ist das Restwasser für den Hauptteig.`,
          R.ice > 0 ? tip('Eis vorher exakt abwiegen und auflösen, bis die Zieltemperatur steht.') : '', 5);
      }
      const addParts = [];
      if (hasMW) addParts.push(`mit dem <b>${g(R.mWater)} g Wasser</b> lösen`);
      if (hasMF) addParts.push(`<b>${g(R.mFlour)} g Mehl</b>${R.mYeast >= 0.05 ? ` und <b>${g(R.mYeast)} g Hefe ${R.yWord}</b>` : ''} zugeben`);
      st('Vorteig' + (hasMW ? ' + Wasser' : '') + (hasMF ? ' + Mehl' : ''), '~5 min',
        `Den ganzen ${isBiga ? 'Biga' : 'Poolish'} ` + (addParts.length ? addParts.join(', dann ') : 'in die Schüssel geben') + ' und '
        + (state.knead === '6'
          ? `<b>in der Maschine ca. 2–3 min auf niedriger Stufe vermengen</b>, bis ein grober Teig entsteht.`
          : `<b>von Hand ca. 3–5 min vermengen</b> (drücken, falten, drehen), bis kein trockenes Mehl mehr sichtbar ist.`), '', 5);
      st('Salz zugeben', 'nach 2–3 min',
        `Erst wenn alles grob zusammenhängt, <b>${g(R.salt)} g Salz</b> `
        + (state.knead === '6'
          ? `zugeben und <b>weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.`
          : `einstreuen und <b>von Hand ca. 2–3 min einkneten</b>.`),
        warn('Salz nie direkt auf die Hefe – es bremst sie. Immer zeitversetzt zugeben.'), 3);
    }

    // ===== DIREKT =====
    if (!pref) {
      sec('Vorbereitung');
      st('Zutaten abwiegen', '~5 min',
        `<b>${g(R.flour)} g Mehl</b> · <b>${g(R.water)} g Wasser</b> · <b>${g(R.salt)} g Salz</b> · <b>${g(R.yeast)} g Hefe ${R.yWord}</b>.`,
        tip('Für Hefe & Salz eine <b>0,1-g-Feinwaage</b> nutzen – bei diesen kleinen Mengen entscheidend.'), 5);
      st('Schüttwasser temperieren', `${R.wT} °C`,
        `Das <b>${g(R.water)} g Wasser</b> auf <b>${R.wT} °C</b> bringen${iceTxt}. So landet der Teig nach dem Kneten bei ~${state.ddt} °C.`,
        R.ice > 0 ? tip('Eis abwiegen, im Wasser auflösen bis die Temperatur passt – dann erst loslegen.') : '', 5);
      if (state.yeast < 1.2) {
        // Autolyse: Hefe kommt erst DANACH in den Teig — kein Widerspruch in der Reihenfolge
        st('Autolyse (empfohlen)', '20–40 min',
          `Nur <b>Mehl + Wasser</b> grob mischen (Salz und Hefe kommen erst später), abdecken, ruhen lassen. Weniger Knetarbeit, dehnbarerer Teig.`,
          state.yeastType === 'dry' ? '' : tip('Behalte <b>2–3 EL vom Schüttwasser</b> zurück, um danach die Frischhefe darin zu lösen.'), 30);
        st('Hefe zugeben', '~2 min',
          state.yeastType === 'dry'
            ? `Trockenhefe gleichmäßig <b>über den Autolyse-Teig streuen</b> und kurz einarbeiten.`
            : `Frischhefe im <b>zurückbehaltenen Wasser auflösen</b> und über den Teig geben.`, '', 2);
      } else {
        st('Hefe lösen', '~2 min',
          state.yeastType === 'dry'
            ? `Trockenhefe <b>direkt ins Mehl</b> mischen – sie muss nicht vorgelöst werden.`
            : `Frischhefe im <b>temperierten Wasser auflösen</b>, bis keine Stückchen mehr da sind.`, '', 2);
      }
      sec('Kneten');
      st('Mischen & Salz', 'nach 2–3 min',
        (state.knead === '6'
          ? `Alle Zutaten in die Maschine geben und <b>ca. 2–3 min auf niedriger Stufe vermengen</b>, dann <b>${g(R.salt)} g Salz zugeben und weitere 2–3 min auf mittlerer Stufe einarbeiten</b>.`
          : `Alle Zutaten <b>von Hand ca. 3–5 min grob vermengen</b> (bis kein trockenes Mehl mehr bleibt), dann <b>${g(R.salt)} g Salz einstreuen und weitere 2–3 min einkneten</b>.`),
        warn('Salz zeitversetzt zur Hefe zugeben – nie direkt aufeinander.'), 5);
    }

    // ===== GEMEINSAME SCHRITTE (Kneten → Backen) =====
    if (hi) {
      st('Stretch &amp; Fold statt Kneten', '4 × alle 30 min',
        `Bei <b>${state.hyd}% Hydration</b> ist der Teig zu klebrig zum klassischen Kneten. Kurz mischen, dann <b>4 Runden Dehnen & Falten</b> alle 30 min mit <b>nassen Händen</b>.`,
        tip('Zwischen den Runden abgedeckt ruhen lassen – das Gluten entwickelt sich von selbst.'), 120);
    } else {
      st('Kneten', state.knead === '6' ? '8–12 min' : '10–15 min',
        `${state.knead === '6' ? 'Maschine: <b>8–12 min</b> auf niedriger/mittlerer Stufe' : 'Von Hand: <b>10–15 min</b> (kneten, dehnen, falten)'}, bis der Teig <b>glatt & elastisch</b> ist. Fenstertest: dünn ausziehbar ohne zu reißen.`, '', state.knead === '6' ? 10 : 13);
    }
    st('Teigtemperatur prüfen', 'Ziel 23–25 °C',
      `Thermometer in den Teig: <b>${state.ddt} °C</b> angepeilt. Wärmer → schnellere Gare, kälter → langsamer.`, '', 2);

    const ballsCold = f.cold && state.coldStage !== 'bulk';
    sec('Gare & Formen');
    st('Stockgare (im Stück)', f.cold && !ballsCold ? 'Raumtemp + kühl' : 'Raumtemp',
      `Teig zur Kugel formen, in eine geölte/abgedeckte Schüssel. ${f.bulk}.`, '', f.bulkMin);
    st('Teiglinge formen', `${R.N} × ${R.W} g`,
      `In <b>${R.N} Stücke à ${R.W} g</b> teilen. Jedes zu einer <b>straffen Kugel</b> formen (Oberfläche spannen, Schluss nach unten). Mit Abstand in eine ${ballsCold ? 'kühlschranktaugliche, dicht schließende Box' : 'Box'}.`,
      tip('Straff geformte Kugeln = runde Pizzen mit gleichmäßigem Rand (Cornicione).'), 10);
    st('Stückgare (Teiglinge)', ballsCold ? 'kühl · Fingertest' : 'Fingertest',
      `${f.proof}. <b>Fertig</b>, wenn ein leichter Fingerdruck <b>langsam</b> zurückfedert (eine kleine Delle bleibt).`,
      f.cold ? tip('Teiglinge vor dem Backen wirklich auf Raumtemperatur kommen lassen – kalter Teig reißt beim Ausziehen.') : '', f.proofMin);

    sec('Backen');
    st('Ofen vorheizen', '30–45 min',
      `Pizzastein/-stahl auf <b>höchste Stufe</b> vorheizen. Pizzaofen (Gas/Holz) <b>430–480 °C</b>; Haushaltsofen Maximum (250–300 °C) + Grill, Stein ganz oben.`,
      tip('Der Stein muss richtig durchglühen – lieber 10 min länger. (Startzeit = 50 min vor dem Backen.)'), 0, { back: 50 });
    st('Pizza ausziehen', 'kein Nudelholz!',
      `Teigling in Mehl/Grieß betten, von der Mitte mit den <b>Fingerspitzen flachdrücken</b>, Rand (~1,5 cm) stehen lassen, über die Handrücken auf Größe ziehen.`,
      warn('Nie ein Nudelholz – das drückt die Luft aus dem Rand. Der Cornicione lebt von der Gärblase.'), 5);
    const bakeTxt = state.ballw <= 260
      ? 'Pizzaofen bei ~450 °C: <b>60–90 Sekunden</b> (einmal drehen). Haushaltsofen: <b>5–8 min</b> unter dem Grill.'
      : 'Größere Teiglinge: Pizzaofen <b>~2 min</b>, Haushaltsofen <b>8–12 min</b>.';
    const bakeDur = Math.max(10, R.N * (state.ballw <= 260 ? 5 : 7));
    st('Belegen & Backen', '',
      `Zügig belegen (wenig Sauce, gut abgetropfter Mozzarella), sofort einschießen. ${bakeTxt} Fertig beim <b>aufgegangenen, gefleckten Rand</b> (Leoparding).`,
      tip('Alles vorher bereitstellen – ab dem Ausziehen geht es schnell.'), bakeDur);

    // ===== Zeiten berechnen =====
    const steps = _items.filter(i => !i.sec);
    let totalMin = 0, cum = 0;
    steps.forEach(s => { s._min = cum; cum += s.dur; });
    totalMin = cum;
    let base = null, valid = false;
    if (state.timeISO) {
      const t = new Date(state.timeISO);
      if (!isNaN(t.getTime())) {
        valid = true;
        base = state.timeMode === 'target' ? new Date(t.getTime() - totalMin * 60000) : t;
      }
    }

    // ===== Render =====
    let html = '';
    if (valid) {
      const endT = new Date(base.getTime() + totalMin * 60000);
      html += `<div class="schedbar">⏱️ <b>Gesamtdauer ca. ${fmtDur(totalMin)}</b><br>
        <span class="big">▶ Start ${fmtClock(base)}</span> &nbsp;→&nbsp; <span class="big">🍕 Fertig ${fmtClock(endT)}</span></div>`;
      $('guideSummary').innerHTML = `${f.label} · ${R.N} × ${R.W} g · ${state.hyd}% Hydration`;
    } else {
      html += `<div class="schedbar" style="background:linear-gradient(135deg,#8a7f76,#6f655c)">⏱️ Gesamtdauer ca. <b>${fmtDur(totalMin)}</b> — gib oben eine <b>Start-</b> oder <b>Zielzeit</b> an, dann bekommt jeder Schritt eine Uhrzeit.</div>`;
      $('guideSummary').innerHTML = `${f.label} · Gesamt ~${fmtDur(totalMin)}`;
    }
    let n = 1;
    _items.forEach(i => {
      if (i.sec) { html += `<div class="daybadge">${i.sec}</div>`; return; }
      let timeChip = '';
      if (valid) {
        const d = new Date(base.getTime() + (i._min - (i.back || 0)) * 60000);
        timeChip = `<span class="timechip">${fmtClock(d)}</span>`;
      }
      html += `<div class="step"><div class="num">${n++}</div><div class="body">
        <h4>${i.title}${i.chip ? `<span class="chip">${i.chip}</span>` : ''}${timeChip}</h4>
        <p>${i.body}</p>${i.extra}</div></div>`;
    });
    $('guideSteps').innerHTML = html;
  }

  PZ.buildGuide = buildGuide;
})(window);
