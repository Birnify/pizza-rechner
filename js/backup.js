/* backup.js — Vollständige Sicherung aller App-Daten exportieren/einlesen
 * (Play-Store-Vorbereitung, Punkt A3 aus PLAYSTORE-BACKLOG.md).
 *
 * Erweitert das bisherige, auf Rezepte beschränkte PZ.exportRecipes()/PZ.importRecipes()
 * (js/storage.js) auf ALLE 11 Speicher-Schlüssel aus PZ.store.KEYS (Rezepte, Pizza-Party-
 * Planung, Feature-Flags, Hefemenge-/Verschwendung-Anpassungen, Sprache, Farbschema,
 * Einheiten, Einfachmodus, Onboarding-Status, laufende Timer, Timer-Hinweis-Status).
 *
 * Arbeitet ausschließlich über PZ.store.get()/set() (rohe String-Werte) -- kennt die
 * interne Struktur der einzelnen Schlüssel bewusst NICHT, genau wie js/store.js selbst.
 * Jeder Wert landet 1:1 (als String) in der Backup-Datei; das ist robust gegenüber
 * künftigen Änderungen an der internen Struktur einzelner Module.
 *
 * Format:
 *   { format: 'pizzaRechnerFullBackup', version: 1, exportedAt: <ISO-String>,
 *     data: { <Speicherschlüssel>: <roher String-Wert>, ... } }
 * Nur tatsächlich gesetzte Schlüssel (kein null) landen in `data`.
 *
 * Abwärtskompatibilität: eine Datei im alten, reinen Rezepte-Format
 * (PZ.exportRecipes(), erkennbar am `recipes`-Array statt einem `data`-Objekt) bleibt
 * einlesbar -- js/main.js erkennt dieses Format per PZ.isLegacyRecipesBackup() und ruft
 * weiterhin unverändert PZ.importRecipes() auf (nur Rezepte werden ergänzt, alles andere
 * bleibt unangetastet, kein Überschreiben, keine Rückfrage -- exakt wie bisher).
 *
 * Restore-Semantik der NEUEN vollen Sicherung ist bewusst ein echtes "Ersetzen" (anders
 * als das reine Rezepte-"Ergänzen" von PZ.importRecipes()): jeder in der Datei enthaltene
 * bekannte Schlüssel überschreibt den heutigen Wert 1:1 (auch die Rezepte-Liste als
 * Ganzes, nicht zusammengeführt). Das entspricht dem Nutzungsfall "Sicherung auf neues
 * Gerät übertragen" bzw. "App-Stand auf einen Sicherungspunkt zurücksetzen" -- js/main.js
 * holt deshalb vor dem Aufruf eine Bestätigung ein und lädt die Seite danach neu, damit
 * jedes Modul (Farbschema, Sprache, Einheiten, Einfachmodus, Party-Planung, Timer, ...)
 * seinen normalen, bereits getesteten Boot-Pfad durchläuft, statt dass hier künstlich
 * jedes einzelne Modul einzeln zur Laufzeit neu synchronisiert werden müsste.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});

  const FORMAT = 'pizzaRechnerFullBackup';
  const VERSION = 1;

  // Baut das Backup-Objekt. Reine Datenfunktion, kein DOM-Zugriff -- der Download
  // (Blob + <a download>) passiert wie beim Rezepte-Export in js/main.js.
  function exportFullBackup() {
    const data = {};
    Object.keys(PZ.store.KEYS).forEach((k) => {
      const key = PZ.store.KEYS[k];
      const raw = PZ.store.get(key);
      if (raw !== null && raw !== undefined) data[key] = raw;
    });
    return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data: data };
  }

  // Erkennt eine volle Sicherung an format + data-Objekt. Bewusst tolerant gegenüber
  // einem fehlenden/höheren `version`-Feld (eine künftige, abwärtskompatible
  // Formatversion soll nicht hart abgelehnt werden) -- verlangt aber format + data.
  function isFullBackup(parsed) {
    return !!parsed && typeof parsed === 'object' && parsed.format === FORMAT &&
      !!parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data);
  }

  // Erkennt das alte, reine Rezepte-Format (PZ.exportRecipes()) -- identische Prüfung
  // wie PZ.importRecipes() selbst (Array.isArray(parsed.recipes)); hier nur vorab
  // genutzt, um in js/main.js zwischen den beiden Einlese-Pfaden zu unterscheiden.
  function isLegacyRecipesBackup(parsed) {
    return !!parsed && typeof parsed === 'object' && Array.isArray(parsed.recipes);
  }

  // Liest eine volle Sicherung ein: jeder bekannte Schlüssel (PZ.store.KEYS) wird 1:1
  // überschrieben (echtes Ersetzen, s. Datei-Kommentar oben). Unbekannte Schlüssel in
  // `parsed.data` (z. B. aus einer künftigen App-Version mit mehr Schlüsseln) werden
  // übersprungen, keine harte Ablehnung der ganzen Datei. Wirft bei offensichtlich
  // falschem Format einen Error -- der Aufrufer (js/main.js) fängt das ab, analog zum
  // defensiven Fehlerverhalten von PZ.importRecipes()/js/share.js. Ruft NIE selbst eine
  // Bestätigung ab und lädt auch nicht selbst die Seite neu -- beides ist Sache des
  // Aufrufers (js/main.js).
  function importFullBackup(parsed) {
    if (!isFullBackup(parsed)) throw new Error('invalid-format');
    const known = new Set(Object.keys(PZ.store.KEYS).map((k) => PZ.store.KEYS[k]));
    let restored = 0, skipped = 0;
    Object.keys(parsed.data).forEach((key) => {
      const value = parsed.data[key];
      if (!known.has(key) || typeof value !== 'string') { skipped++; return; }
      PZ.store.set(key, value);
      restored++;
    });
    return { restored: restored, skipped: skipped, total: Object.keys(parsed.data).length };
  }

  PZ.exportFullBackup = exportFullBackup;
  PZ.importFullBackup = importFullBackup;
  PZ.isFullBackup = isFullBackup;
  PZ.isLegacyRecipesBackup = isLegacyRecipesBackup;
})(typeof window !== 'undefined' ? window : this);
