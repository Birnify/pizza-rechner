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
      wrap.innerHTML = `<button type="button" class="timerbtn timerbtn-start" data-act="start">⏰ Timer starten (${fmtDurLabel(defaultMin)})</button>`;
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

  function startTimer(key, min, box) {
    const label = box.closest('.step') ? box.closest('.step').querySelector('h4').textContent.trim() : key;
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
