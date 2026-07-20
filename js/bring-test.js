/* bring-test.js — EXPERIMENTELLER TESTAUFBAU (v3.39.0, NICHT Teil des regulären
 * Feature-Umfangs, kein fertiges Feature)
 *
 * Prüft eine offene technische Frage: die Shopping-List-App "Bring!" bietet einen
 * offiziellen Import-Deeplink (https://getbring.com/en/integration-check), der KEINEN
 * API-Key/Login braucht — die Bring!-App holt sich beim Öffnen des Links selbst
 * schema.org/Recipe-JSON-LD von der übergebenen url. Unklar (nur mit echtem Gerät +
 * App zu klären): akzeptiert Bring! dafür auch CLIENTSEITIG per JS nachträglich
 * eingefügtes JSON-LD (s. bring-import.html), oder nur bereits im initialen HTML
 * vorhandenes?
 *
 * Baut aus der aktuell aggregierten Pizza-Party-Zutatenliste (PZ.partyComputeAggregatedList(),
 * js/party.js) einen kompakten Base64-JSON-Zustand (identisches Muster wie js/share.js,
 * v3.14.0 — hier aber bewusst eigenständig dupliziert statt importiert, damit
 * bring-import.html komplett unabhängig von den übrigen App-Modulen bleibt) und hängt
 * ihn als ?d=-Parameter an die GitHub-Pages-URL von bring-import.html. Diese komplette
 * URL wird wiederum als url-Parameter in den offiziellen Bring!-Deeplink eingebettet.
 *
 * Abgrenzung (bewusst, s. Auftrag): kein Fallback für Nutzer ohne Bring!-App, keine
 * echte Fehlerbehandlung — bewusster Testaufruf, kein fertiges Feature.
 *
 * FALLS SICH DIE IDEE NICHT BESTÄTIGT: rückstandslos entfernbar durch Löschen von
 * — dieser Datei
 * — bring-import.html
 * — dem <script src="js/bring-test.js">-Tag + dem #bringTestBtn-Block in
 *   pizza-rechner.html UND pizza-rechner-mobile.html
 * — den i18n-Keys btn.bringTest/hint.bringTest/bring.recipeName in js/i18n.js
 * — der .btn-experimental-Regel in css/styles.css
 * Kein anderer bestehender Code (js/party.js, js/share.js, …) wird von diesem Modul
 * verändert oder vorausgesetzt.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // Muss eine echte, öffentlich über https:// erreichbare URL sein (GitHub Pages) —
  // Bring!s Server ruft diese URL SERVERSEITIG ab, um das JSON-LD zu lesen; eine
  // lokale file://-URL wäre für Bring! nicht erreichbar, unabhängig davon, ob diese
  // Seite hier gerade lokal per Doppelklick oder über GitHub Pages läuft.
  const BRING_IMPORT_URL = 'https://birnify.github.io/pizza-rechner/bring-import.html';

  // UTF-8-sichere Base64-Kodierung — identisches Muster wie b64Encode() in js/share.js,
  // hier absichtlich dupliziert statt von dort importiert (s. Kommentar oben: bewusst
  // eigenständiges, leicht wieder entfernbares Testmodul).
  function b64Encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, hex) => String.fromCharCode(parseInt(hex, 16))));
  }

  function buildDeeplink() {
    const result = PZ.partyComputeAggregatedList ? PZ.partyComputeAggregatedList() : { ingredients: [] };
    const payload = {
      name: t('bring.recipeName'),
      ingredients: result.ingredients.map(function (i) {
        return { name: i.name, amount: i.amount, unit: i.unit };
      })
    };
    const encoded = b64Encode(JSON.stringify(payload));
    const importUrl = BRING_IMPORT_URL + '?d=' + encoded;
    return 'https://api.getbring.com/rest/bringrecipes/deeplink?url=' + encodeURIComponent(importUrl) + '&source=web';
  }
  // Für manuelles Nachtesten in der Browser-Konsole (z. B. PZ.buildBringTestDeeplink())
  // zugänglich gemacht, ohne extra Klick nötig zu haben.
  PZ.buildBringTestDeeplink = buildDeeplink;

  const btn = $('bringTestBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      // Direkte Navigation (nicht window.open) — für App-Deeplink-Handoffs auf iOS
      // Safari das zuverlässigere Muster als ein neuer Tab per window.open().
      location.href = buildDeeplink();
    });
  }
})(window);
