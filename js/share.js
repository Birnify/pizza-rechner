/* share.js — Teilen-Link: PZ.state als Base64-JSON in der URL, zum Kopieren/Laden
 *
 * Reiner Zustands-Transport, keine Server-Komponente, kein neues Speicherformat.
 * Ein Teilen-Link kodiert einen Snapshot von PZ.state (dieselben Felder, die auch
 * js/storage.js in ein Rezept schreibt) als Base64-JSON im Query-Parameter "?r=".
 * Beim Laden der Seite erkennt tryLoadFromShareLink() einen vorhandenen ?r=-Parameter,
 * dekodiert ihn und übernimmt ihn über PZ.applyState() (aus js/storage.js — dieselbe
 * Funktion, die auch beim Laden eines gespeicherten Rezepts läuft). Bei kaputten,
 * alten oder manipulierten Links wird defensiv abgebrochen (try/catch + Plausibilitäts-
 * check) — nie ein Absturz, einfach ein no-op zurück zum normalen PZ.load().
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  const PARAM = 'r';

  // UTF-8-sichere Base64-Kodierung (Standardmuster, s. MDN "The Unicode Problem") —
  // reines btoa()/atob() versteht nur Latin1, state-Werte sind zwar aktuell rein
  // ASCII, aber sicherheitshalber robust gegen künftige Sonderzeichen.
  function b64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))));
  }
  function b64Decode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str),
      c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }

  function encodeState(state) {
    return b64Encode(JSON.stringify(state));
  }
  function decodeState(encoded) {
    return JSON.parse(b64Decode(encoded));
  }
  PZ.encodeShareState = encodeState;
  PZ.decodeShareState = decodeState;

  // Baut den vollständigen, teilbaren Link (aktuelle Seite + kodierter State).
  function buildShareLink() {
    const url = new URL(location.href);
    url.hash = '';
    url.searchParams.set(PARAM, encodeState(PZ.state));
    return url.toString();
  }
  PZ.buildShareLink = buildShareLink;

  // Versucht, einen Teilen-Link aus der aktuellen URL zu übernehmen.
  // Gibt true zurück, wenn ein gültiger Zustand angewendet wurde (main.js kann dann
  // den normalen PZ.load() aus localStorage überspringen); sonst false — und zwar
  // in JEDEM Fehlerfall (fehlender Parameter, korruptes Base64, kaputtes JSON,
  // unplausibler Inhalt), nie eine Exception nach außen.
  function tryLoadFromShareLink() {
    try {
      const params = new URLSearchParams(location.search);
      const raw = params.get(PARAM);
      if (!raw) return false;
      const state = decodeState(raw);
      // Nur Objekte, die auch wirklich wie ein PZ.state aussehen, gelten als plausibel —
      // verhindert, dass ein fremdes/zufälliges/leeres JSON unbemerkt übernommen wird.
      // Seit v3.59.0 gemeinsame Prüfung PZ.looksLikeState() (js/state.js), vorher
      // eigene Kopie hier (identisch zu isLegacyState()/isValidRecipeEntry() in
      // js/storage.js).
      if (!PZ.looksLikeState(state)) return false;
      PZ.applyState(state);
      // Parameter aus der Adressleiste entfernen (ohne neuen History-Eintrag) —
      // ein späterer Reload/eigenes Speichern soll nicht ungewollt wieder auf den
      // geteilten Stand zurückspringen.
      const url = new URL(location.href);
      url.searchParams.delete(PARAM);
      history.replaceState(null, '', url.toString());
      return true;
    } catch (e) {
      // Kaputter/alter/manipulierter Link -> defensiv ignorieren, nie abstürzen.
      return false;
    }
  }
  PZ.tryLoadFromShareLink = tryLoadFromShareLink;

  // Baut den Link, kopiert ihn in die Zwischenablage, zeigt kurzes Text-Feedback
  // am übergebenen Button (analog zum "✓ Gespeichert"-Feedback von #saveBtn).
  // Zusätzlich wird dieselbe Meldung in eine eigene, dauerhaft im DOM stehende
  // aria-live-Region (#shareLiveMsg) geschrieben: der Klick auf "Link kopieren" ist der
  // einzige Beleg dafür, dass das Kopieren wirklich geklappt hat (kein anderer sichtbarer
  // Effekt), daher reicht der reine btn.textContent-Wechsel für Screenreader-Nutzer nicht.
  // Bewusst NICHT role="status" direkt auf den Button selbst (würde dessen Button-Rolle
  // überschreiben) — stattdessen eine separate, visuell versteckte Live-Region.
  // Live-Region-Ansage seit v3.58.0 über den gemeinsamen Helfer PZ.announce()
  // (js/dom.js, Clear-then-delayed-set-mit-Generation-Zähler-Muster, s. dort) —
  // vorher eigene Kopie, behoben im gebündelten Accessibility-Zyklus v3.42.0
  // (davor wurde direkt gesetzt, ohne Clear-Reset).
  function copyShareLink(btn) {
    const link = buildShareLink();
    const liveMsg = document.getElementById('shareLiveMsg');
    const t = PZ.t ? PZ.t : function (k) { return k; };
    const showFeedback = (ok) => {
      const msg = ok ? t('share.linkCopied') : t('share.copyFailed');
      PZ.announce('shareLiveMsg', msg);
      if (!btn) return;
      const original = btn.dataset.origLabel || btn.textContent;
      btn.dataset.origLabel = original;
      btn.textContent = msg;
      setTimeout(() => {
        btn.textContent = original;
        if (liveMsg) liveMsg.textContent = '';
      }, 1800);
    };
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(
        () => showFeedback(true),
        () => fallbackCopy(link, showFeedback)
      );
    } else {
      fallbackCopy(link, showFeedback);
    }
  }
  PZ.copyShareLink = copyShareLink;

  // Fallback für Kontexte ohne navigator.clipboard (u. a. file://-Aufruf ohne
  // sicheren Kontext, in dem die App primär läuft) — klassisches unsichtbares
  // Textfeld + execCommand('copy').
  function fallbackCopy(text, cb) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      cb(ok);
    } catch (e) {
      cb(false);
    }
  }
})(window);
