/* timer.js — Gärzeit-Timer/Wecker pro Anleitungs-Schritt.
   Rein clientseitig, kein Server, kein Service-Worker: läuft nur solange dieser Tab/
   dieses Fenster offen ist (bewusste Grenze, kein Bug — wird im UI kommuniziert).
   Persistiert nur Start-Zeitpunkt + Zieldauer in localStorage, damit ein versehentlicher
   Reload den Countdown nicht auf 0 zurückwirft. Mehrere Timer laufen unabhängig
   nebeneinander (je Schritt-Key ein eigener Eintrag + eigenes Interval). */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  const LS_KEY = 'pizzaRechnerTimers';
  const HINT_KEY = 'pizzaRechnerTimerHintShown';
  let audioCtx = null;
  let hintShown = false;
  const intervals = {}; // key -> intervalId

  function readTimers() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeTimers(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
  }
  function setTimer(key, data) {
    const all = readTimers();
    if (data === null) delete all[key];
    else all[key] = data;
    writeTimers(all);
  }

  function fmtRemain(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const p = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
  }

  // Synthetischer Beep per Web Audio API (kein <audio>-Tag, keine externe Datei)
  function beep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [880, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch (e) { /* Web Audio nicht verfügbar — Notification/Sichtbar-Fallback bleiben */ }
  }

  function notify(label) {
    let shown = false;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('⏰ Timer fertig', { body: label, tag: 'pz-timer-' + label });
        shown = true;
      } catch (e) { /* ignore */ }
    }
    return shown;
  }

  function showHintOnce(box) {
    if (hintShown) return;
    hintShown = true;
    try { if (localStorage.getItem(HINT_KEY)) return; localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* ignore */ }
    const hint = document.createElement('div');
    hint.className = 'timerhint';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.innerHTML = 'ℹ️ Der Timer läuft nur, solange dieser Tab/dieses Fenster geöffnet ist — kein Wecker mehr, wenn du den Tab schließt.';
    box.parentNode.insertBefore(hint, box.nextSibling);
    setTimeout(() => hint.remove(), 9000);
  }

  function render(box) {
    const key = box.dataset.timerKey;
    const defaultMin = parseFloat(box.dataset.timerMin) || 0;
    if (defaultMin <= 0) { box.innerHTML = ''; return; }
    const all = readTimers();
    const t = all[key];

    // Live-Region auf dem STATISCHEN .timerbox-Container (nicht auf dynamisch ersetzten
    // Kindern) — analog zu #flourWarn, sonst feuert es nicht zuverlässig bei jedem Update.
    // aria-live bewusst nur "polite" + Countdown-Ziffern per aria-hidden: der laufende
    // Sekunden-Countdown selbst wird NICHT jede Sekunde vorgelesen (würde bei "polite"
    // zu einer Ansage-Spam-Kaskade führen) — nur Start/Abbruch/Fertig-Zustandswechsel.
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-atomic', 'true');

    box.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'timerwrap';

    if (t && t.endAt) {
      const remain = t.endAt - Date.now();
      if (remain <= 0) {
        wrap.innerHTML = `<span class="timerdone" role="status">🔔 Fertig!</span>
          <button type="button" class="timerbtn" data-act="dismiss">Zurücksetzen</button>`;
      } else {
        wrap.innerHTML = `<span class="timerclock">⏳ <span class="timerclock-val" aria-hidden="true"></span> verbleibend</span>
          <button type="button" class="timerbtn" data-act="stop">Abbrechen</button>`;
      }
    } else {
      wrap.innerHTML = `<button type="button" class="timerbtn timerbtn-start" data-act="start">⏰ Timer starten (${fmtDurLabel(defaultMin)})</button>
        ${systemTimerHtml(defaultMin, stepLabel(box), key)}`;
    }
    box.appendChild(wrap);

    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'start') {
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().finally(() => startTimer(key, defaultMin, box));
          } else {
            startTimer(key, defaultMin, box);
          }
          showHintOnce(box);
        } else if (act === 'stop' || act === 'dismiss') {
          stopTimer(key);
          render(box);
        }
      });
    });

    clearTick(key);
    if (t && t.endAt && t.endAt - Date.now() > 0) startTick(key, box, t.endAt, t.label);
  }

  function fmtDurLabel(min) {
    min = Math.round(min);
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60), r = min % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  }

  function stepLabel(box) {
    const step = box.closest('.step');
    const h4 = step && step.querySelector('h4');
    if (!h4) return box.dataset.timerKey;
    // Nur der reine Titel-Text (erster Text-Knoten): guide.js hängt Chip-/Zeit-Badges
    // als <span> direkt ohne Leerzeichen an den Titel an (z. B. "Autolyse<span>...
    // </span>"), sonst würden sie hier ohne Trenner zusammenlaufen (betrifft
    // Notification-Body, ICS-Titel und den Android-Wecker-Namen gleichermaßen).
    for (const node of h4.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return node.textContent.trim();
    }
    return h4.textContent.trim();
  }

  // --- System-Wecker/Kalender-Anbindung (v3.15.0) ---------------------------
  // Web-Apps ohne Service Worker/nativen App-Zugriff haben KEINE offizielle,
  // plattformübergreifende API, um den System-Timer zu stellen. Zwei ehrliche,
  // realistische Wege:
  //  - Android: Chrome unterstützt `intent:`-URIs, die die dokumentierte
  //    AlarmClock-Intent-Action ACTION_SET_TIMER an die Uhr-App weiterreichen
  //    (SKIP_UI=true startet den Timer direkt, ohne die Uhr-App zu öffnen).
  //    Funktioniert nur in Chrome/Chromium-basierten Android-Browsern, nicht
  //    in Firefox Android o.ä. — deshalb nur bei erkanntem Android angeboten.
  //  - iOS: es gibt keine vergleichbare Web-API (Shortcuts-URL-Schemes würden
  //    einen vom Nutzer vorinstallierten Shortcut voraussetzen, den eine
  //    offline laufende file://-App nicht bereitstellen kann — daher bewusst
  //    NICHT vorgetäuscht). Als ehrlicher Ersatz: Download einer .ics-Datei
  //    (Kalender-Termin zum exakten Zielzeitpunkt + Erinnerungs-Alarm) — das
  //    ist ein offener Standard, den iOS/Android/Desktop-Kalender alle nativ
  //    unterstützen. Wird plattformunabhängig IMMER zusätzlich angeboten.
  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  function androidTimerUrl(minutes, label) {
    const seconds = Math.max(1, Math.round(minutes * 60));
    const msg = encodeURIComponent(label || 'Pizza-Teig');
    return `intent:#Intent;action=android.intent.action.SET_TIMER;` +
      `S.android.intent.extra.alarm.MESSAGE=${msg};` +
      `i.android.intent.extra.alarm.LENGTH=${seconds};` +
      `B.android.intent.extra.alarm.SKIP_UI=true;end`;
  }

  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }
  function icsDate(d) {
    const p = n => String(n).padStart(2, '0');
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' +
      p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
  }
  // Baut eine .ics-Kalendereinladung mit VALARM als data:-URL — kein Server nötig,
  // funktioniert offline. TRIGGER:-PT0M lässt den Alarm exakt zum Zielzeitpunkt
  // (jetzt + Dauer) feuern, nicht zur (irrelevanten) Terminstart-Uhrzeit selbst.
  function icsDataUrl(minutes, label) {
    const now = new Date();
    const target = new Date(now.getTime() + minutes * 60000);
    const end = new Date(target.getTime() + 60000);
    const sum = icsEscape('🍕 ' + (label || 'Pizza-Timer'));
    const desc = icsEscape('Erinnerung vom Teigmeister: ' + (label || 'Timer') + ' ist fertig.');
    const uid = 'pz-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@pizza-rechner';
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pizzateig-Rechner//Timer//DE', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + icsDate(now), 'DTSTART:' + icsDate(target),
      'DTEND:' + icsDate(end), 'SUMMARY:' + sum, 'DESCRIPTION:' + desc,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + desc, 'TRIGGER:-PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }

  function systemTimerHtml(defaultMin, label, key) {
    // Feature-Flag "timerSystem" (js/settings.js, Default AUS): Teil-Feature von "timer" —
    // hängt bereits durch guide.js/timerBox() vom übergeordneten "timer"-Flag ab (ohne Timer
    // kein Platzhalter, also auch keine System-Links). `PZ.FLAGS` fehlt in Tests bewusst,
    // js/timer.js wird dort ohnehin nicht geladen (s. Kommentar oben in der Datei).
    if (PZ.FLAGS && PZ.FLAGS.timerSystem === false) return '';
    // aria-describedby verknüpft den erklärenden Hint-Text programmatisch mit beiden
    // Links (analog zum #shareHint-Fix v3.14.0) — sonst ist der Zusammenhang für
    // Screenreader-Nutzer nur visuell erkennbar (WCAG 1.3.1). Eindeutige ID je Box
    // nötig, weil mehrere Timer-Boxen gleichzeitig auf der Seite gerendert werden.
    const hintId = `timersys-hint-${key}`;
    const links = [];
    if (isAndroid()) {
      links.push(`<a class="timerbtn timerbtn-alt" href="${androidTimerUrl(defaultMin, label)}" aria-describedby="${hintId}">📱 Android-Wecker stellen</a>`);
    }
    links.push(`<a class="timerbtn timerbtn-alt" href="${icsDataUrl(defaultMin, label)}" download="pizza-timer-${key}.ics" aria-describedby="${hintId}">📅 Kalender-Erinnerung</a>`);
    const hint = isAndroid()
      ? 'Öffnet die Uhr-App mit vorausgefülltem Timer (Chrome) — oder lade alternativ eine Kalender-Erinnerung herunter.'
      : 'iOS bietet keine Web-Schnittstelle für System-Timer — lade stattdessen eine Kalender-Erinnerung herunter (öffnet die Kalender-App mit Alarm zur richtigen Zeit).';
    return `<div class="timersys">
        <span class="timersys-hint" id="${hintId}">${hint}</span>
        <span class="timersys-links">${links.join(' ')}</span>
      </div>`;
  }

  function startTimer(key, min, box) {
    const label = stepLabel(box);
    const endAt = Date.now() + min * 60000;
    setTimer(key, { endAt, label });
    render(box);
  }

  function stopTimer(key) {
    setTimer(key, null);
    clearTick(key);
  }

  function clearTick(key) {
    if (intervals[key]) { clearInterval(intervals[key]); delete intervals[key]; }
  }

  function startTick(key, box, endAt, label) {
    const update = () => {
      const remain = endAt - Date.now();
      const valEl = box.querySelector('.timerclock-val');
      if (remain <= 0) {
        clearTick(key);
        onExpire(key, box, label);
        return;
      }
      if (valEl) valEl.textContent = fmtRemain(remain);
    };
    update();
    intervals[key] = setInterval(update, 1000);
  }

  function onExpire(key, box, label) {
    beep();
    notify(label || 'Timer');
    render(box);
  }

  // Nach jedem buildGuide()-Rendering die Timer-Boxen (neu) verdrahten/wiederherstellen.
  // Läuft auch stabil neben dem iOS-Akkordeon: der State lebt in localStorage, nicht im DOM.
  function wire() {
    const boxes = document.querySelectorAll('.timerbox');
    boxes.forEach(render);
  }

  // Alle 1s auch dann ticken, wenn wire() selten läuft (z. B. keine Reglerbewegung) —
  // eigentliche Anzeige-Updates laufen über startTick je Box; wire() stellt nach jedem
  // Neu-Rendern der Anleitung (innerHTML-Ersetzung) den korrekten Reststand wieder her.
  PZ.wireTimers = wire;

  document.addEventListener('DOMContentLoaded', wire);
})(window);
