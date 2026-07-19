/* party.js — Pizza-Party-Planer (v3.27.0, Sprachversion ergänzt in v3.28.0)
 *
 * Neuer, eigenständiger Bereich ("Pizza Party"), komplett getrennt vom Teig-Rechner:
 * kein Zugriff auf PZ.state, kein PZ.calc()-Aufruf. Kernidee laut Feature-Auftrag:
 * Nutzer wählt vorgegebene ODER selbst angelegte Pizzen mit einer Stückzahl aus
 * ("4x Funghi, 3x Salami"), daraus wird eine aggregierte, deduplizierte Zutatenliste
 * mit UNGEFÄHREN Gesamtmengen für den Einkauf berechnet — bewusst KEINE exakte/
 * rezeptgenaue Mengenberechnung wie bei den Teig-Grundzutaten (js/calc.js), nur
 * Richtmengen für die Beläge. Kein automatischer Abgleich mit der "Anzahl Teiglinge"
 * im Hauptrechner (Abgrenzung laut Feature-Auftrag).
 *
 * Eigener localStorage-Key ("pizzaPartyPlanner"), komplett getrennt vom
 * Rezepte-Key ("pizzaRechner", js/storage.js) — unabhängiger Datensatz, kein
 * Migrationsrisiko für bestehende Rezepte.
 *
 * Sprachversion (v3.28.0): die 8 Preset-Pizzen (Namen + Zutatennamen) sind ins
 * Wörterbuch gewandert (js/i18n.js). WICHTIG: die Preset-Liste wird über
 * getPresetPizzas() bei JEDEM Aufruf frisch aus dem Wörterbuch gebaut (PZ.t() live
 * ausgewertet) statt einmalig beim Laden der Datei — sonst würde ein späterer
 * Sprachwechsel (oder ein Testlauf, der die Sprache erst nach dem Laden der Module
 * explizit setzt) die bereits "eingefrorenen" deutschen Namen nicht mehr aktualisieren.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$ || function (id) { return document.getElementById(id); };
  const KEY = 'pizzaPartyPlanner';

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // --- Vorgegebene Beispielpizzen ------------------------------------------------
  // Ungefähre Richtmengen an Belag für EINE Standard-Pizza (~250–280 g Teigling,
  // 28–30 cm) — grobe Küchenerfahrungswerte, keine exakte Rezeptur. Struktur/ids
  // bleiben sprachunabhängig fest, nur name/ingredients[].name kommen aus t().
  function getPresetPizzas() {
    return [
      { id: 'preset_margherita', name: t('party.preset.margherita.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 100, unit: 'g' },
        { name: t('party.ing.basil'), amount: 3, unit: t('party.unit.leaves') }
      ] },
      { id: 'preset_salami', name: t('party.preset.salami.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 90, unit: 'g' },
        { name: t('party.ing.salami'), amount: 40, unit: 'g' }
      ] },
      { id: 'preset_funghi', name: t('party.preset.funghi.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 90, unit: 'g' },
        { name: t('party.ing.mushrooms'), amount: 60, unit: 'g' }
      ] },
      { id: 'preset_diavola', name: t('party.preset.diavola.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 90, unit: 'g' },
        { name: t('party.ing.spicySalami'), amount: 40, unit: 'g' },
        { name: t('party.ing.chiliFlakes'), amount: 5, unit: 'g' }
      ] },
      { id: 'preset_prosciutto', name: t('party.preset.prosciutto.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 90, unit: 'g' },
        { name: t('party.ing.cookedHam'), amount: 50, unit: 'g' }
      ] },
      { id: 'preset_quattro_formaggi', name: t('party.preset.quattroFormaggi.name'), ingredients: [
        { name: t('party.ing.mozzarella'), amount: 60, unit: 'g' },
        { name: t('party.ing.gorgonzola'), amount: 30, unit: 'g' },
        { name: t('party.ing.parmesan'), amount: 20, unit: 'g' },
        { name: t('party.ing.provolone'), amount: 30, unit: 'g' }
      ] },
      { id: 'preset_verdure', name: t('party.preset.verdure.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 80, unit: 'g' },
        { name: t('party.ing.zucchini'), amount: 30, unit: 'g' },
        { name: t('party.ing.paprika'), amount: 30, unit: 'g' },
        { name: t('party.ing.eggplant'), amount: 30, unit: 'g' }
      ] },
      { id: 'preset_hawaii', name: t('party.preset.hawaii.name'), ingredients: [
        { name: t('party.ing.tomatoSauce'), amount: 80, unit: 'g' },
        { name: t('party.ing.mozzarella'), amount: 90, unit: 'g' },
        { name: t('party.ing.cookedHam'), amount: 40, unit: 'g' },
        { name: t('party.ing.pineapple'), amount: 40, unit: 'g' }
      ] }
    ];
  }
  // Bewusst KEIN Modul-globaler Snapshot (z.B. "PZ.PARTY_PRESET_PIZZAS = getPresetPizzas()")
  // mehr — das würde die Presets beim Laden des Scripts einmalig in der zu diesem
  // Zeitpunkt aktiven Sprache "einfrieren". Aufrufer nutzen ausschließlich
  // PZ.partyGetAllPizzas(), die getPresetPizzas() bei jedem Aufruf frisch auswertet.

  // --- Storage ---------------------------------------------------------------
  function readRaw() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function writeRaw(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function readStore() {
    let data = readRaw();
    if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
    if (!Array.isArray(data.customPizzas)) data.customPizzas = [];
    if (!data.qty || typeof data.qty !== 'object' || Array.isArray(data.qty)) data.qty = {};
    return data;
  }

  function makeId() {
    return 'cp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Presets + eigene Pizzen, in dieser Reihenfolge (Presets zuerst, stabil).
  function getAllPizzas() {
    const data = readStore();
    return getPresetPizzas().map(function (p) {
      return { id: p.id, name: p.name, ingredients: p.ingredients, custom: false };
    }).concat(data.customPizzas.map(function (p) {
      return { id: p.id, name: p.name, ingredients: p.ingredients, custom: true };
    }));
  }
  PZ.partyGetAllPizzas = getAllPizzas;

  // Legt eine neue eigene Pizza an. Zutaten ohne Namen ODER mit Menge <= 0 werden
  // stillschweigend verworfen (Formular-Robustheit gegen leere Zeilen). Liefert
  // die neue Pizza zurück, oder null bei ungültiger Eingabe (kein Name / keine
  // gültige Zutat) — der Aufrufer zeigt dann eine Fehlermeldung statt anzulegen.
  // Eigene Pizzen werden bewusst NICHT übersetzt (Nutzereingabe, keine App-Texte) —
  // sie bleiben unabhängig von der aktuellen Sprache exakt so gespeichert, wie
  // eingegeben.
  function addCustomPizza(name, ingredients) {
    const clean = (ingredients || []).map(function (i) {
      return {
        name: String((i && i.name) || '').trim(),
        amount: Number(i && i.amount) || 0,
        unit: (String((i && i.unit) || '').trim()) || 'g'
      };
    }).filter(function (i) { return i.name && i.amount > 0; });
    if (!name || !String(name).trim() || clean.length === 0) return null;
    const data = readStore();
    const pizza = { id: makeId(), name: String(name).trim(), ingredients: clean };
    data.customPizzas.push(pizza);
    writeRaw(data);
    return pizza;
  }
  PZ.partyAddCustomPizza = addCustomPizza;

  function deleteCustomPizza(id) {
    const data = readStore();
    data.customPizzas = data.customPizzas.filter(function (p) { return p.id !== id; });
    delete data.qty[id];
    writeRaw(data);
  }
  PZ.partyDeleteCustomPizza = deleteCustomPizza;

  function getQty(id) {
    const data = readStore();
    return data.qty[id] || 0;
  }
  PZ.partyGetQty = getQty;

  // Klemmt auf 0–50 Stück (0 = aus der Auswahl entfernt, kein separater "Löschen"-
  // Zustand nötig). Persistiert sofort, damit die Auswahl den Bereichswechsel
  // übersteht (kein "Speichern"-Button für die Party-Auswahl, anders als beim
  // Rezept-Rechner).
  function setQty(id, qty) {
    const data = readStore();
    const n = Math.max(0, Math.min(50, Math.round(Number(qty) || 0)));
    if (n === 0) delete data.qty[id]; else data.qty[id] = n;
    writeRaw(data);
    return n;
  }
  PZ.partySetQty = setQty;

  // Aggregiert alle ausgewählten Pizzen (Stückzahl > 0) zu einer deduplizierten
  // Zutatenliste. Gruppierungsschlüssel = Zutatenname (getrimmt, klein geschrieben)
  // + Einheit (ebenso normalisiert) — zwei Zutaten mit demselben Namen aber
  // unterschiedlicher Einheit (z. B. "Basilikum" in Blättern vs. Gramm) bleiben
  // bewusst getrennte Zeilen, da keine Einheiten-Umrechnung stattfindet (s.
  // Abgrenzung "keine exakte Mengenberechnung" im Feature-Auftrag).
  function computeAggregatedList() {
    const data = readStore();
    const pizzas = getAllPizzas();
    const totals = new Map();
    let totalPizzaCount = 0;
    pizzas.forEach(function (p) {
      const qty = data.qty[p.id] || 0;
      if (qty <= 0) return;
      totalPizzaCount += qty;
      (p.ingredients || []).forEach(function (ing) {
        const nameTrim = String(ing.name).trim();
        const unitTrim = String(ing.unit).trim();
        const key = nameTrim.toLowerCase() + '|' + unitTrim.toLowerCase();
        const cur = totals.get(key) || { name: nameTrim, unit: unitTrim, amount: 0 };
        cur.amount += ing.amount * qty;
        totals.set(key, cur);
      });
    });
    const locale = (PZ.getLang ? PZ.getLang() : 'de') === 'en' ? 'en' : 'de';
    const ingredients = Array.from(totals.values()).sort(function (a, b) {
      return a.name.localeCompare(b.name, locale);
    });
    return { totalPizzaCount: totalPizzaCount, ingredients: ingredients };
  }
  PZ.partyComputeAggregatedList = computeAggregatedList;

  // --- UI-Verdrahtung (no-op, wenn das Markup fehlt, z.B. in tests/test.html) ----
  const pizzaListEl = $('partyPizzaList');
  if (!pizzaListEl) { return; } // keine Party-Ansicht auf dieser Seite -> reine Datenschicht bleibt trotzdem verfügbar

  function fmtAmount(n) {
    // Ganzzahlen ohne Nachkommastelle, sonst maximal 1 Nachkommastelle (Komma statt Punkt).
    const r = Math.round(n * 10) / 10;
    return (Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ','));
  }

  // Fokus-Ziel nach dem Entfernen eines Elements aus dem DOM (z.B. nach dem
  // Löschen einer eigenen Pizza, wo die gesamte Liste per renderPartyList()
  // neu aufgebaut wird und der geklickte Button dabei verschwindet). Identisches
  // Muster wie focusView() im Burger-Menü-Inline-Script beider Seiten.
  function focusPartyHeading() {
    const card = pizzaListEl.closest('.card');
    const h = card && card.querySelector('h2');
    if (h) {
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }

  function renderPartyList() {
    const pizzas = getAllPizzas();
    pizzaListEl.innerHTML = '';
    if (!pizzas.length) {
      const p = document.createElement('div');
      p.className = 'hint';
      p.textContent = t('party.noPizzas');
      pizzaListEl.appendChild(p);
      return;
    }
    pizzas.forEach(function (pizza) {
      const qty = getQty(pizza.id);
      const row = document.createElement('div');
      row.className = 'party-pizza-row';
      row.dataset.id = pizza.id;

      const info = document.createElement('div');
      info.className = 'party-pizza-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'party-pizza-name';
      nameEl.textContent = pizza.name;
      const ingEl = document.createElement('div');
      ingEl.className = 'party-pizza-ings hint';
      ingEl.textContent = (pizza.ingredients || []).map(function (i) { return i.name; }).join(' · ');
      info.appendChild(nameEl);
      info.appendChild(ingEl);

      const stepper = document.createElement('div');
      stepper.className = 'party-qty-stepper';
      stepper.setAttribute('role', 'group');
      stepper.setAttribute('aria-label', t('party.qtyGroupLabel', { name: pizza.name }));

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'party-qty-btn';
      minus.textContent = '−';
      minus.setAttribute('aria-label', t('party.qtyDecrease', { name: pizza.name }));
      minus.addEventListener('click', function () {
        const cur = getQty(pizza.id);
        const next = setQty(pizza.id, cur - 1);
        input.value = next;
        renderPartyResult();
      });

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'party-qty-input';
      input.min = '0';
      input.max = '50';
      input.value = String(qty);
      input.setAttribute('aria-label', t('party.qtyGroupLabel', { name: pizza.name }));
      input.addEventListener('change', function () {
        const next = setQty(pizza.id, input.value);
        input.value = next;
        renderPartyResult();
      });

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'party-qty-btn';
      plus.textContent = '+';
      plus.setAttribute('aria-label', t('party.qtyIncrease', { name: pizza.name }));
      plus.addEventListener('click', function () {
        const cur = getQty(pizza.id);
        const next = setQty(pizza.id, cur + 1);
        input.value = next;
        renderPartyResult();
      });

      stepper.appendChild(minus);
      stepper.appendChild(input);
      stepper.appendChild(plus);

      row.appendChild(info);
      row.appendChild(stepper);

      if (pizza.custom) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'party-delete-btn';
        del.setAttribute('aria-label', t('party.deleteBtn', { name: pizza.name }));
        del.textContent = '🗑';
        del.addEventListener('click', function () {
          if (!confirm(t('party.deleteConfirm', { name: pizza.name }))) return;
          deleteCustomPizza(pizza.id);
          renderPartyList();
          renderPartyResult();
          // Der geklickte Button existiert nach dem Re-Render nicht mehr im DOM —
          // ohne explizite Fokus-Umlenkung würde der Fokus auf <body> zurückfallen
          // (Tastatur-/Screenreader-Nutzer verlieren ihren Ort auf der Seite).
          // Analog zu focusView() im Burger-Menü-Script: Fokus auf die Bereichs-
          // überschrift, zusätzlich Löschung per Live-Region ansagen (WCAG 4.1.3).
          focusPartyHeading();
          announcePartyCreate(t('party.deletedMsg', { name: pizza.name }));
        });
        row.appendChild(del);
      }

      pizzaListEl.appendChild(row);
    });
  }

  function renderPartyResult() {
    const summaryEl = $('partyResultSummary');
    const listEl = $('partyResultList');
    if (!summaryEl || !listEl) return;
    const result = computeAggregatedList();
    if (result.totalPizzaCount === 0) {
      summaryEl.textContent = '';
      listEl.innerHTML = '';
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = t('party.noneSelectedHint');
      listEl.appendChild(hint);
      return;
    }
    summaryEl.textContent = result.totalPizzaCount === 1
      ? t('party.summaryOne')
      : t('party.summaryMany', { n: result.totalPizzaCount });
    listEl.innerHTML = '';
    result.ingredients.forEach(function (ing) {
      const row = document.createElement('div');
      row.className = 'ing';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = ing.name;
      const amtSpan = document.createElement('span');
      amtSpan.className = 'amt';
      amtSpan.textContent = fmtAmount(ing.amount) + ' ' + ing.unit;
      row.appendChild(nameSpan);
      row.appendChild(amtSpan);
      listEl.appendChild(row);
    });
  }
  PZ.partyRenderResult = renderPartyResult;

  // --- Eigene Pizza anlegen: dynamische Zutatenzeilen -------------------------
  const ingRowsEl = $('partyIngredientRows');
  const addIngBtn = $('partyAddIngRow');
  const createBtn = $('partyCreateBtn');
  const nameInput = $('partyNewName');
  const liveMsg = $('partyCreateLiveMsg');
  const START_ROWS = 3;

  // Nummeriert die "Zutatenzeile entfernen"-Buttons durch (1, 2, 3, …), statt sie
  // alle identisch "Zutatenzeile entfernen" zu nennen — bei mehreren Zeilen sonst
  // nicht unterscheidbare Accessible Names für Screenreader-Nutzer (WCAG 2.4.6).
  function renumberIngRowLabels() {
    if (!ingRowsEl) return;
    const rows = ingRowsEl.querySelectorAll('.party-ing-row');
    rows.forEach(function (row, i) {
      const btn = row.querySelector('.party-ing-remove');
      if (btn) btn.setAttribute('aria-label', t('party.ingRemoveLabel', { n: i + 1 }));
    });
  }

  function addIngRow() {
    if (!ingRowsEl) return;
    const row = document.createElement('div');
    row.className = 'party-ing-row';

    const nameEl = document.createElement('input');
    nameEl.type = 'text';
    nameEl.className = 'selectbox party-ing-name';
    nameEl.placeholder = t('party.ingNamePlaceholder');
    nameEl.setAttribute('aria-label', t('party.ingNameLabel'));

    const amountEl = document.createElement('input');
    amountEl.type = 'number';
    amountEl.className = 'party-ing-amount';
    amountEl.min = '0';
    amountEl.step = '1';
    amountEl.placeholder = t('party.ingAmountLabel');
    amountEl.setAttribute('aria-label', t('party.ingAmountLabel'));

    const unitEl = document.createElement('input');
    unitEl.type = 'text';
    unitEl.className = 'selectbox party-ing-unit';
    unitEl.value = t('party.defaultUnit');
    unitEl.setAttribute('aria-label', t('party.ingUnitLabel'));

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'party-ing-remove';
    removeBtn.setAttribute('aria-label', t('party.ingRemoveLabel', { n: 1 }));
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', function () {
      // Fokus-Ziel VOR dem Entfernen ermitteln: der geklickte Button verschwindet
      // gleich aus dem DOM, ohne Umlenkung fiele der Fokus auf <body> zurück
      // (Tastatur-/Screenreader-Nutzer verlieren ihren Ort im Formular).
      const rows = Array.prototype.slice.call(ingRowsEl.querySelectorAll('.party-ing-row'));
      const idx = rows.indexOf(row);
      row.remove();
      renumberIngRowLabels();
      const remaining = Array.prototype.slice.call(ingRowsEl.querySelectorAll('.party-ing-row'));
      const target = remaining[Math.min(idx, remaining.length - 1)];
      const focusEl = (target && target.querySelector('.party-ing-name')) || addIngBtn;
      if (focusEl) focusEl.focus();
    });

    row.appendChild(nameEl);
    row.appendChild(amountEl);
    row.appendChild(unitEl);
    row.appendChild(removeBtn);
    ingRowsEl.appendChild(row);
    renumberIngRowLabels();
  }

  function resetIngRows() {
    if (!ingRowsEl) return;
    ingRowsEl.innerHTML = '';
    for (let i = 0; i < START_ROWS; i++) addIngRow();
  }

  if (addIngBtn) addIngBtn.addEventListener('click', function () { addIngRow(); });

  // Live-Region-Text wird (wie an anderen Stellen der App, z.B. #pdfGuideLiveMsg,
  // #viewAnnounce) erst geleert und im nächsten Tick gesetzt, damit Screenreader auch
  // bei zwei wortgleichen Meldungen hintereinander eine echte DOM-Mutation erkennen
  // (WCAG 4.1.3). Ein Generation-Zähler verhindert dabei ein Race: klickt der Nutzer
  // z.B. erst erfolgreich "Pizza anlegen" und direkt danach (innerhalb von 50ms) noch
  // einmal mit leerem Namen, würde ohne den Zähler die verzögerte Erfolgsmeldung die
  // eigentlich aktuellere Fehlermeldung überschreiben — die jeweils NEUESTE
  // announcePartyCreate()-Anfrage gewinnt immer, ältere, noch ausstehende Timeouts
  // werden zu No-ops.
  let liveMsgGen = 0;
  function announcePartyCreate(text) {
    if (!liveMsg) return;
    const gen = ++liveMsgGen;
    liveMsg.textContent = '';
    window.setTimeout(function () {
      if (gen === liveMsgGen) liveMsg.textContent = text;
    }, 50);
  }

  if (createBtn) {
    createBtn.addEventListener('click', function () {
      const name = nameInput ? nameInput.value : '';
      const rows = ingRowsEl ? Array.prototype.slice.call(ingRowsEl.querySelectorAll('.party-ing-row')) : [];
      const ingredients = rows.map(function (row) {
        return {
          name: row.querySelector('.party-ing-name').value,
          amount: row.querySelector('.party-ing-amount').value,
          unit: row.querySelector('.party-ing-unit').value
        };
      });
      const pizza = addCustomPizza(name, ingredients);
      if (!pizza) {
        announcePartyCreate(t('party.createInvalidMsg'));
        // Fokus auf das wahrscheinlichste fehlerhafte Feld lenken (WCAG 3.3.1
        // Error Identification) statt die Fehlermeldung nur akustisch/visuell
        // ohne jeden Bezugspunkt im Formular zu melden.
        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus();
        } else {
          const firstNameField = ingRowsEl && ingRowsEl.querySelector('.party-ing-name');
          if (firstNameField) firstNameField.focus();
        }
        return;
      }
      if (nameInput) nameInput.value = '';
      resetIngRows();
      renderPartyList();
      renderPartyResult();
      announcePartyCreate(t('party.createdMsg', { name: pizza.name }));
    });
  }

  resetIngRows();
  renderPartyList();
  renderPartyResult();

  // Sprachwechsel: komplette Neu-Darstellung (Presets in der neuen Sprache, Formular-
  // Platzhalter/Labels, Ergebnisliste inkl. neuer Sortierreihenfolge). Eigene Pizzen
  // ändern ihren gespeicherten Namen/ihre Zutaten NICHT (Nutzereingabe), nur die
  // Presets + die Rahmen-UI-Texte wechseln.
  if (PZ.i18nOnChange) {
    PZ.i18nOnChange(function () {
      PZ.PARTY_PRESET_PIZZAS = getPresetPizzas();
      renderPartyList();
      renderPartyResult();
    });
  }
})(window);
