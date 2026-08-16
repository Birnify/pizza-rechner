/* timer.js — Gärzeit-Timer/Wecker pro Anleitungs-Schritt.
   Im normalen Browser (Desktop und Mobil ohne Capacitor) weiterhin rein clientseitig, kein
   Server, kein Service-Worker: läuft nur solange dieser Tab/dieses Fenster offen ist
   (bewusste Grenze, kein Bug — wird im UI kommuniziert). Persistiert nur Start-Zeitpunkt +
   Zieldauer in localStorage, damit ein versehentlicher Reload den Countdown nicht auf 0
   zurückwirft. Mehrere Timer laufen unabhängig nebeneinander (je Schritt-Key ein eigener
   Eintrag + eigenes Interval).

   In der nativen App (Play-Store-Vorbereitung C1a, PLAYSTORE-BACKLOG.md) plant `startTimer()`
   ZUSÄTZLICH eine echte, vom `setInterval` unabhängige Systembenachrichtigung über
   `@capacitor/local-notifications` ein (`LocalNotifications.schedule(...)`, Zieltag/-zeit =
   derselbe `endAt`) — die feuert auch, wenn die App komplett beendet wurde. `setInterval`
   bleibt in BEIDEN Welten unverändert nur für die Vordergrund-Anzeige zuständig, die
   verbleibende Zeit wird immer aus dem gespeicherten `endAt` neu berechnet (nie aus einem
   mitgezählten Zwischenstand). Identisches Erkennungsmuster wie js/main.js `boot()`/
   js/store.js: `window.Capacitor?.isNativePlatform()`.

   C1b (Neustart-Persistenz + Energiesparfunktionen, PLAYSTORE-BACKLOG.md): Recherche-Ergebnis
   (Quelle: `node_modules/@capacitor/local-notifications/android/...`, vollständiger
   Kotlin-Quelltext liegt lokal vor, kein Vermuten nötig):
   - **Geräteneustart braucht KEINEN eigenen `BroadcastReceiver`/nativen Java-Code.** Das
     Plugin registriert bereits selbst einen `LocalNotificationRestoreReceiver` auf
     `BOOT_COMPLETED`/`LOCKED_BOOT_COMPLETED`/`QUICKBOOT_POWERON` (`directBootAware`,
     s. `android/src/main/AndroidManifest.xml` des Pakets) und die zugehörigen Berechtigungen
     (`RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`) — beides landet automatisch per normalem
     Android-Manifest-Merge in der App (keine manuelle Ergänzung in `android/app/src/main/
     AndroidManifest.xml` nötig, per Gradle-Build verifiziert, s. PLAYSTORE-BACKLOG.md C1).
     Der Receiver liest beim Neustart alle noch nicht abgelaufenen Einträge aus der eigenen,
     von `LocalNotifications.schedule()` beschriebenen `NotificationStorage` (App-eigene
     SharedPreferences, getrennt von unserem `PZ.store`/Capacitor Preferences) und plant sie
     erneut über den `AlarmManager` ein — vollständig headless, ohne WebView/JS-Kontext.
     `cancelNativeNotification()` (also `stopTimer()`) entfernt den Eintrag dort ebenfalls
     wieder, ein abgebrochener Timer wird nach einem Neustart also korrekt NICHT wieder
     aufleben. Diese App muss dafür nichts Eigenes bauen — nur verifizieren, dass es wirklich
     funktioniert (s. PLAYSTORE-BACKLOG.md, Abschnitt C1, Emulator-Verifikation).
   - **Doze/Energiesparen:** `allowWhileIdle: true` (bereits seit C1a gesetzt) lässt das Plugin
     `AlarmManager.setExactAndAllowWhileIdle`/`setAndAllowWhileIdle` verwenden (s.
     `LocalNotificationManager.kt`), das ist laut Android-Dokumentation genau der vorgesehene
     Weg, damit ein Alarm auch im Doze-Modus feuert (Einschränkung: max. 1×/9 min pro App —
     irrelevant für uns, wir planen pro Timer nur einen einzigen Zeitpunkt). Eine zusätzliche
     Ausnahme von der Akku-Optimierung (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) wird deshalb
     bewusst NICHT angefragt: sie ist für einfache, seltene Exact-Alarms nicht nötig (dafür ist
     `allowWhileIdle` da), gilt bei Google Play als restriktiv geprüfte Berechtigung mit
     Rechtfertigungspflicht, und würde eine App wie einen Kochtimer eher in Erklärungsnot
     bringen als Nutzen bringen.
   - **Separate, plugin-interne "Exakte Alarme"-Berechtigung** (ab Android 12/API 31, unser
     `targetSdkVersion` 36 verlangt sie ab Android 13 aktiv): Das Plugin ruft bei jedem
     `schedule()` mit `isExactNotification: true` (Standard) automatisch den System-Dialog
     "Alarme & Erinnerungen" auf, falls die Berechtigung fehlt (`ACTION_REQUEST_SCHEDULE_
     EXACT_ALARM`) — bei Ablehnung fällt es non-fatal auf einen ungenauen, aber weiterhin
     `allowWhileIdle`-fähigen Alarm zurück (`ScheduleResult.warning`). Damit dieser
     Systemdialog nicht bei JEDEM Timer (auch kurzem Ofen-/Autolyse-Timer) aufpoppt, fragen
     wir „exakt" nur für lange Timer an (`EXACT_ALARM_THRESHOLD_MIN`, s. u.) — passend zur
     Vorgabe „sinnvoll platziert, erst wenn wirklich ein langer Timer gestellt wird". Kurze
     Timer laufen weiterhin `allowWhileIdle`-terminiert, nur ohne Exaktheits-Anspruch (ein paar
     Minuten Toleranz spielt bei einem 10-Minuten-Backzeit-Timer ohnehin keine Rolle). */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  const LS_KEY = 'pizzaRechnerTimers';
  const HINT_KEY = 'pizzaRechnerTimerHintShown';
  let audioCtx = null;
  let hintShown = false;
  const intervals = {}; // key -> intervalId

  // Feature-Erkennung, identisches Muster wie js/main.js boot() und js/store.js — einmalig
  // beim Laden dieses Moduls ausgewertet. js/timer.js wird bewusst NICHT in tests/test.html
  // geladen (s. Kommentar dort), diese Erkennung läuft also nie in der Testsuite.
  const isNativeApp = !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform());

  function nativeNotifPlugin() {
    return (global.Capacitor && global.Capacitor.Plugins && global.Capacitor.Plugins.LocalNotifications) || null;
  }

  // C1b: ab dieser Dauer (Minuten) fragt scheduleNativeNotification() eine EXAKTE
  // Terminierung an (löst ggf. den System-Settings-Dialog "Alarme & Erinnerungen" aus,
  // s. Datei-Kommentar oben). 180 min = 3 h — deckt die in PLAYSTORE-BACKLOG.md explizit
  // genannten langen Läufe (17 h Biga, 48 h Kaltgare, auch mehrstündige Stockgare/Poolish-
  // Reife) ab, lässt kurze Timer (Ofen vorheizen, Autolyse, Backzeit) aber ungefragt.
  const EXACT_ALARM_THRESHOLD_MIN = 180;

  // Capacitor Local Notifications verlangt eine 32-Bit-Ganzzahl-ID (-2147483648..2147483647).
  // Ein einfacher, deterministischer String-Hash reicht: dieselbe Schritt-Key liefert immer
  // dieselbe ID (wichtig, damit ein erneutes Starten/Canceln denselben Eintrag trifft), Kollisionen
  // zwischen den wenigen gleichzeitigen Schritt-Timern sind praktisch ausgeschlossen.
  function nativeNotifId(key) {
    let h = 0;
    const s = String(key);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (Math.abs(h) % 2147483647) + 1; // immer in [1, 2147483647], nie 0
  }

  function readTimers() {
    try {
      const raw = PZ.store.get(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function writeTimers(obj) {
    try { PZ.store.set(LS_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
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
        new Notification(t('timer.notificationTitle'), { body: label, tag: 'pz-timer-' + label });
        shown = true;
      } catch (e) { /* ignore */ }
    }
    return shown;
  }

  function showHintOnce(box) {
    if (hintShown) return;
    hintShown = true;
    try { if (PZ.store.get(HINT_KEY)) return; PZ.store.set(HINT_KEY, '1'); } catch (e) { /* ignore */ }
    const hint = document.createElement('div');
    hint.className = 'timerhint';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.innerHTML = t('timer.hint');
    box.parentNode.insertBefore(hint, box.nextSibling);
    setTimeout(() => hint.remove(), 9000);
  }

  // --- Native Systembenachrichtigung (C1a) — Berechtigungs-Hinweis --------------------
  // Wird sichtbar (nicht nur einmalig wie showHintOnce), sobald eine echte Terminierung
  // an einer verweigerten/fehlenden Berechtigung scheitert — orientiert sich am
  // bestehenden .note/.note--warn-Muster aus js/guide.js (ocker, WCAG-konformer Kontrast
  // bereits per Design-Token abgesichert), damit kein neues visuelles Muster entsteht.
  // Lebt bewusst als Geschwister-Element NACH der .timerbox (wie .timerhint), nicht als
  // Kind — sonst würde ihn render()s box.innerHTML='' bei jedem Neu-Rendern wegwerfen.
  function nativePermWarnEl(box) {
    const sib = box.nextSibling;
    return (sib && sib.nodeType === 1 && sib.classList && sib.classList.contains('timerpermwarn')) ? sib : null;
  }
  function showNativePermissionWarning(box) {
    if (nativePermWarnEl(box)) return;
    const warn = document.createElement('div');
    warn.className = 'note note--warn timerpermwarn';
    warn.setAttribute('role', 'status');
    warn.setAttribute('aria-live', 'polite');
    warn.innerHTML = t('timer.permissionDenied');
    box.parentNode.insertBefore(warn, box.nextSibling);
  }
  function clearNativePermissionWarning(box) {
    const el = nativePermWarnEl(box);
    if (el) el.remove();
  }

  // C1b: kurzer, transienter Hinweis (analog showHintOnce), NUR für lange Timer, kurz bevor
  // doScheduleNative() ggf. den Exakte-Alarme-Systemdialog auslöst (s. Datei-Kommentar oben) —
  // erklärt den Sprung in die Systemeinstellungen, statt ihn kommentarlos aufpoppen zu lassen.
  // Bewusst NICHT "nur einmal für immer" wie showHintOnce: der Systemdialog kann bei jedem
  // langen Timer erneut erscheinen (solange der Nutzer die Berechtigung nicht erteilt hat),
  // der erklärende Hinweis soll dann jedes Mal mitkommen.
  function showExactAlarmHint(box) {
    const hint = document.createElement('div');
    hint.className = 'note note--tip timerexacthint';
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    hint.innerHTML = t('timer.exactAlarmHint');
    box.parentNode.insertBefore(hint, box.nextSibling);
    setTimeout(() => hint.remove(), 12000);
  }

  // Plant die echte, vom setInterval unabhängige Systembenachrichtigung ein (nur native App,
  // s. startTimer). Ruft IMMER zuerst checkPermissions() (README-Empfehlung des Plugins),
  // fragt bei 'prompt'/'prompt-with-rationale' aktiv nach, zeigt bei 'denied' (vor oder nach
  // der Abfrage) einen sichtbaren Hinweis statt eines stillen Fehlschlags.
  function scheduleNativeNotification(key, endAt, label, box, min) {
    const plugin = nativeNotifPlugin();
    if (!plugin) { showNativePermissionWarning(box); return; } // sollte nur bei Build-/Setup-Fehler vorkommen
    clearNativePermissionWarning(box);
    plugin.checkPermissions()
      .then((status) => {
        const display = status && status.display;
        if (display === 'granted') return doScheduleNative(plugin, key, endAt, label, box, min);
        if (display === 'denied') { showNativePermissionWarning(box); return; }
        return plugin.requestPermissions().then((res) => {
          if (res && res.display === 'granted') return doScheduleNative(plugin, key, endAt, label, box, min);
          showNativePermissionWarning(box);
        });
      })
      .catch(() => showNativePermissionWarning(box));
  }

  function doScheduleNative(plugin, key, endAt, label, box, min) {
    // "Exakt" nur für lange Timer anfragen (s. EXACT_ALARM_THRESHOLD_MIN-Kommentar oben) —
    // kurze Timer bekommen isExactNotification:false, bleiben aber weiterhin
    // allowWhileIdle:true (Doze-fest, nur ohne Exaktheits-Anspruch).
    const isLong = min >= EXACT_ALARM_THRESHOLD_MIN;
    if (isLong) showExactAlarmHint(box);
    return plugin.schedule({
      notifications: [{
        id: nativeNotifId(key),
        title: t('timer.notificationTitle'),
        body: label,
        schedule: { at: new Date(endAt), allowWhileIdle: true },
        isExactNotification: isLong
      }]
    }).then(() => { clearNativePermissionWarning(box); })
      .catch(() => showNativePermissionWarning(box));
  }

  function cancelNativeNotification(key) {
    const plugin = nativeNotifPlugin();
    if (!plugin) return;
    try { plugin.cancel({ notifications: [{ id: nativeNotifId(key) }] }); } catch (e) { /* ignore */ }
  }

  function render(box) {
    const key = box.dataset.timerKey;
    const defaultMin = parseFloat(box.dataset.timerMin) || 0;
    if (defaultMin <= 0) { box.innerHTML = ''; return; }
    const all = readTimers();
    const tData = all[key];

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

    if (tData && tData.endAt) {
      const remain = tData.endAt - Date.now();
      if (remain <= 0) {
        wrap.innerHTML = `<span class="timerdone" role="status">${t('timer.done')}</span>
          <button type="button" class="timerbtn" data-act="dismiss">${t('timer.reset')}</button>`;
      } else {
        wrap.innerHTML = `<span class="timerclock">${t('timer.remaining.prefix')}<span class="timerclock-val" aria-hidden="true"></span>${t('timer.remaining.suffix')}</span>
          <button type="button" class="timerbtn" data-act="stop">${t('timer.cancel')}</button>`;
      }
    } else {
      wrap.innerHTML = `<button type="button" class="timerbtn timerbtn-start" data-act="start">${t('timer.start', { dur: fmtDurLabel(defaultMin) })}</button>
        ${systemTimerHtml(defaultMin, stepLabel(box), key)}`;
    }
    box.appendChild(wrap);

    wrap.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'start') {
          // Native App: die Web-Notification-API ist hier nicht die richtige Schnittstelle
          // (echte Terminierung läuft über LocalNotifications, s. startTimer) — die Web-
          // Berechtigungsabfrage bleibt dem Browser vorbehalten, exakt wie bisher.
          if (!isNativeApp && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().finally(() => startTimer(key, defaultMin, box));
          } else {
            startTimer(key, defaultMin, box);
          }
          // Der "läuft nur solange der Tab offen ist"-Hinweis stimmt in der nativen App seit
          // C1a nicht mehr (das ist ja der ganze Zweck dieses Punkts) — dort bewusst nicht
          // zeigen, um niemanden mit einer falschen Einschränkung zu verunsichern. Im Browser
          // exakt unverändert.
          if (!isNativeApp) showHintOnce(box);
        } else if (act === 'stop' || act === 'dismiss') {
          stopTimer(key);
          clearNativePermissionWarning(box);
          render(box);
        }
      });
    });

    clearTick(key);
    if (tData && tData.endAt && tData.endAt - Date.now() > 0) startTick(key, box, tData.endAt, tData.label);
  }

  function fmtDurLabel(min) {
    min = Math.round(min);
    if (min < 60) return min + ' ' + t('guide.dur.min');
    const h = Math.floor(min / 60), r = min % 60;
    return r ? `${h} ${t('guide.dur.h')} ${r} ${t('guide.dur.min')}` : `${h} ${t('guide.dur.h')}`;
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
    const msg = encodeURIComponent(label || t('timer.androidDefaultLabel'));
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
    const sum = icsEscape(t('timer.icsSummaryPrefix') + (label || t('timer.icsDefaultLabel')));
    const desc = icsEscape(t('timer.icsDescription', { label: label || t('timer.notifyDefaultLabel') }));
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
    // kein Platzhalter, also auch keine System-Links). `PZ.FLAGS` selbst fehlt in Tests NICHT
    // (js/settings.js wird dort geladen) — dieser Codepfad läuft in `tests/test.html` aber
    // trotzdem nie, weil js/timer.js dort bewusst gar nicht geladen wird: es nutzt
    // Notification/setInterval/Web Audio API, die bewusst nicht unit-getestet werden
    // (s. pizza-rechner-KONTEXT.md, Abschnitt „Gärzeit-Timer / Wecker (v3.11.0)").
    if (PZ.FLAGS && PZ.FLAGS.timerSystem === false) return '';
    // aria-describedby verknüpft den erklärenden Hint-Text programmatisch mit beiden
    // Links (analog zum #shareHint-Fix v3.14.0) — sonst ist der Zusammenhang für
    // Screenreader-Nutzer nur visuell erkennbar (WCAG 1.3.1). Eindeutige ID je Box
    // nötig, weil mehrere Timer-Boxen gleichzeitig auf der Seite gerendert werden.
    const hintId = `timersys-hint-${key}`;
    const links = [];
    // Der Android-Uhr-Intent-Behelf entfällt in der nativen App (C1a, PLAYSTORE-BACKLOG.md):
    // startTimer() plant dort bereits eine ECHTE Systembenachrichtigung ein, der Umweg über
    // die Uhr-App ist überflüssig geworden. Im Browser (Desktop und Mobil ohne Capacitor,
    // dort gibt es weiterhin keine native Alternative) bleibt der Link unverändert bestehen.
    if (isAndroid() && !isNativeApp) {
      links.push(`<a class="timerbtn timerbtn-alt" href="${androidTimerUrl(defaultMin, label)}" aria-describedby="${hintId}">${t('timer.androidBtn')}</a>`);
    }
    // Der Kalender-Export bleibt bewusst unverändert bestehen, auch nativ (PLAYSTORE-
    // BACKLOG.md-Entscheidung: weiterhin nützlich, z. B. um die Erinnerung auch nach einer
    // App-Deinstallation im Kalender zu behalten).
    links.push(`<a class="timerbtn timerbtn-alt" href="${icsDataUrl(defaultMin, label)}" download="pizza-timer-${key}.ics" aria-describedby="${hintId}">${t('timer.icsBtn')}</a>`);
    const hint = isNativeApp ? t('timer.hint.native') : (isAndroid() ? t('timer.hint.android') : t('timer.hint.ios'));
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
    // Zusätzliche, vom setInterval unabhängige Systembenachrichtigung nur in der nativen App
    // (C1a) — im Browser bleibt das Verhalten exakt wie vorher (Web-Notification via notify()
    // beim Ablauf, s. onExpire()).
    if (isNativeApp) scheduleNativeNotification(key, endAt, label, box, min);
  }

  function stopTimer(key) {
    setTimer(key, null);
    clearTick(key);
    if (isNativeApp) cancelNativeNotification(key);
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
    notify(label || t('timer.notifyDefaultLabel'));
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
