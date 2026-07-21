/* pdf.js — "Als PDF speichern": erzeugt einen direkten PDF-Download der Schritt-für-
 * Schritt-Anleitung, ohne den Umweg über den Browser-Druckdialog (der bestehende
 * "Anleitung drucken"-Button, js/print.js, bleibt unverändert bestehen).
 *
 * Technische Entscheidung (Offline-Philosophie, s. pizza-rechner-KONTEXT.md): KEINE
 * externe Bibliothek (z. B. jsPDF) eingebunden. Die App läuft komplett offline per
 * file://-Doppelklick, ohne Build-Tools/Bundler/npm/CDN — eine Fremdbibliothek müsste
 * als vollständig gebündelte Datei im Projekt liegen (zusätzliche Lizenz-/Wartungslast,
 * oft mehrere hundert KB für einen simplen Text-Report). Der Anleitungsinhalt ist reiner
 * strukturierter Text (Überschriften, Absätze, kurze Hinweiszeilen) — dafür reicht ein
 * von Hand erzeugtes PDF nach klassischer PDF-1.4-Syntax (Catalog/Pages/Page/Content-
 * Stream) mit den Basis-14-Schriftarten Helvetica/Helvetica-Bold (WinAnsiEncoding) —
 * beide sind in JEDEM PDF-Viewer eingebaut, brauchen also kein Font-Embedding. Passt
 * damit zur bestehenden "alles selbst geschrieben, nichts nachgeladen"-Linie (vgl. den
 * handgeschriebenen .ics-Kalendereintrag in js/timer.js, den Base64-Teilen-Link in
 * js/share.js).
 *
 * Ablauf: (1) collectGuideContent() liest die BEREITS gerenderte Anleitung direkt aus
 * dem DOM (#guideSummary/#flourWarn/#guideSteps) — keine Duplikation der Bau-Logik aus
 * js/guide.js, die Anleitung ist zum Klick-Zeitpunkt immer schon aktuell (reaktive
 * Neuberechnung bei jeder Eingabe). (2) sanitizeText() entfernt Emoji/Symbole ohne
 * WinAnsi-Entsprechung und bildet gängige Sonderzeichen (Gedankenstriche, Anführungs-
 * zeichen, Auslassungspunkte, Euro) auf ihre WinAnsi-Bytes ab. (3) layoutPages() bricht
 * die Textblöcke seitenweise um (eigene, angenäherte Helvetica-Zeichenbreiten-Tabelle
 * fürs Wortumbruch — Standard-Metriken der Basis-14-Schrift, kein Font-Embedding nötig).
 * (4) buildPdf() serialisiert das Ergebnis zu einem gültigen PDF-Byte-String.
 */
(function (global) {
  'use strict';
  const PZ = global.PZ || (global.PZ = {});
  const $ = PZ.$;

  function t(key, vars) { return PZ.t ? PZ.t(key, vars) : key; }

  // ---- Seiten-Geometrie (A4, Punkte) ----
  const PAGE_W = 595.28, PAGE_H = 841.89;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - 2 * MARGIN;

  // ---- Farben (an die Website-Palette angelehnt, s. css/styles.css --tomato/--basil) ----
  const TOMATO = [0.784, 0.267, 0.180];
  const BASIL = [0.227, 0.490, 0.267];
  const GRAY = [0.45, 0.42, 0.40];

  // ---- Helvetica-Zeichenbreiten (Standard-AFM-Metriken, 1/1000 em) — nur für den
  // Zeilenumbruch gebraucht. Helvetica-Bold nutzt dieselbe Tabelle + einen kleinen
  // Aufschlag (BOLD_FACTOR) statt einer eigenen zweiten Tabelle — Bold-Text kommt hier
  // nur in kurzen Überschriften vor, eine exakte zweite Metriktabelle wäre unnötiger
  // Mehraufwand; der Aufschlag sorgt dafür, dass eher zu früh als zu spät umgebrochen wird.
  const CW = {
    32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
    40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
    48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556,
    58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556, 64: 1015,
    65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778, 72: 722, 73: 278,
    74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778, 82: 722,
    83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611,
    91: 278, 92: 278, 93: 278, 94: 469, 95: 556, 96: 333,
    97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556, 104: 556, 105: 222,
    106: 222, 107: 500, 108: 222, 109: 833, 110: 556, 111: 556, 112: 556, 113: 556, 114: 333,
    115: 500, 116: 278, 117: 556, 118: 500, 119: 722, 120: 500, 121: 500, 122: 500,
    123: 334, 124: 260, 125: 334, 126: 584,
    128: 556, 133: 1000, 145: 191, 146: 191, 147: 333, 148: 333, 149: 350, 150: 556, 151: 1000,
    176: 400, 196: 667, 214: 778, 220: 722, 223: 611, 228: 556, 246: 556, 252: 556
  };
  const DEFAULT_W = 556;
  const BOLD_FACTOR = 1.08;

  // Unicode-Codepoint -> WinAnsi-Byte für gängige Sonderzeichen außerhalb 0x00–0xFF,
  // die in den Anleitungstexten vorkommen können (Gedankenstriche, Anführungszeichen,
  // Auslassungspunkte, Euro-Zeichen). Alles andere außerhalb 0x00–0xFF (v. a. Emoji)
  // wird ersatzlos entfernt, s. sanitizeText().
  const SPECIAL_MAP = {
    0x2013: 0x96, 0x2014: 0x97, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2026: 0x85, 0x20AC: 0x80
  };
  // Emoji-/Symbolbereiche ohne WinAnsi-Entsprechung, die in js/guide.js verwendet
  // werden (⏱️💡⚠️▶🍕 usw. + Variationsselektor). Werden komplett entfernt statt durch
  // "?" ersetzt — sonst bliebe ein irreführendes "?" mitten im Anleitungstext stehen.
  const EMOJI_RE = new RegExp(
    '[\\u2300-\\u23FF\\u2600-\\u27BF\\u2B00-\\u2BFF\\u25A0-\\u25FF\\uFE0F' +
    '\\u{1F300}-\\u{1FAFF}]', 'gu'
  );

  function sanitizeText(str) {
    if (!str) return '';
    let out = '';
    const cleaned = String(str).replace(EMOJI_RE, '').replace(/→/g, '->');
    for (const ch of cleaned) {
      const code = ch.codePointAt(0);
      if (code <= 0xFF) { out += ch; continue; }
      const mapped = SPECIAL_MAP[code];
      if (mapped !== undefined) out += String.fromCharCode(mapped);
      // sonst: Zeichen ohne WinAnsi-Entsprechung, ersatzlos entfernen
    }
    return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+\n/g, '\n').trim();
  }

  function textOf(el) { return el ? sanitizeText(el.textContent) : ''; }

  // ---- Anleitungsinhalt aus dem bereits gerenderten DOM einsammeln ----
  function collectGuideContent() {
    const blocks = [];
    blocks.push({ type: 'title', text: t('guide.title') });

    const summary = textOf(document.getElementById('guideSummary'));
    if (summary) blocks.push({ type: 'summary', text: summary });

    const warnEl = document.getElementById('flourWarn');
    if (warnEl) {
      Array.prototype.forEach.call(warnEl.children, function (w) {
        const t = textOf(w);
        if (t) blocks.push({ type: 'warn', text: t });
      });
    }

    const stepsEl = document.getElementById('guideSteps');
    if (stepsEl) {
      Array.prototype.forEach.call(stepsEl.children, function (child) {
        if (child.classList.contains('schedbar')) {
          const t = textOf(child);
          if (t) blocks.push({ type: 'schedbar', text: t });
        } else if (child.classList.contains('daybadge')) {
          const t = textOf(child);
          if (t) blocks.push({ type: 'day', text: t });
        } else if (child.classList.contains('step')) {
          const num = textOf(child.querySelector('.num'));
          const h4 = child.querySelector('.body > h4');
          let title = '';
          if (h4) {
            const clone = h4.cloneNode(true);
            const chipEl = clone.querySelector('.chip');
            const chipText = chipEl ? textOf(chipEl) : '';
            if (chipEl) chipEl.parentNode.removeChild(chipEl);
            const timeEl = clone.querySelector('.timechip');
            const timeText = timeEl ? textOf(timeEl) : '';
            if (timeEl) timeEl.parentNode.removeChild(timeEl);
            title = sanitizeText(clone.textContent);
            if (chipText) title += ' (' + chipText + ')';
            if (timeText) title += '  [' + timeText + ']';
          }
          blocks.push({ type: 'stepTitle', num: num, text: title });
          const body = textOf(child.querySelector('.body > p'));
          if (body) blocks.push({ type: 'body', text: body });
          const extras = child.querySelectorAll('.body > .tip, .body > .warn');
          Array.prototype.forEach.call(extras, function (ex) {
            const isWarn = ex.classList.contains('warn');
            const t = textOf(ex);
            if (t) blocks.push({ type: isWarn ? 'warn' : 'tip', text: t });
          });
        }
      });
    }
    return blocks;
  }

  // ---- Wortumbruch ----
  function charWidthOf(ch, font) {
    const code = ch.charCodeAt(0);
    let w = CW[code] !== undefined ? CW[code] : DEFAULT_W;
    if (font === 'F2') w *= BOLD_FACTOR;
    return w;
  }
  function textWidth(str, font, size) {
    let w = 0;
    for (let i = 0; i < str.length; i++) w += charWidthOf(str[i], font);
    return w * size / 1000;
  }
  function wrapText(text, font, size, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let cur = '', curWidth = 0;
    const spaceW = charWidthOf(' ', font) * size / 1000;
    words.forEach(function (word) {
      const wWidth = textWidth(word, font, size);
      if (cur && curWidth + spaceW + wWidth > maxWidth) {
        lines.push(cur);
        cur = word; curWidth = wWidth;
      } else {
        curWidth = cur ? curWidth + spaceW + wWidth : wWidth;
        cur = cur ? cur + ' ' + word : word;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // ---- Blöcke -> seitenweise angeordnete Textzeilen ----
  function layoutPages(blocks) {
    const pages = [];
    let page = { lines: [] };
    let y = PAGE_H - MARGIN;
    function newPage() { pages.push(page); page = { lines: [] }; y = PAGE_H - MARGIN; }
    function addLine(text, opts) {
      opts = opts || {};
      const font = opts.font || 'F1', size = opts.size || 10;
      const lh = opts.lineHeight || size * 1.35;
      if (opts.gapBefore) y -= opts.gapBefore;
      if (y < MARGIN) newPage();
      page.lines.push({ text: text, font: font, size: size, x: MARGIN + (opts.indent || 0), y: y, color: opts.color || null });
      y -= lh;
    }
    function addWrapped(text, font, size, indent, gapBefore, color) {
      wrapText(text, font, size, CONTENT_W - (indent || 0)).forEach(function (line, i) {
        addLine(line, { font: font, size: size, indent: indent, gapBefore: i === 0 ? gapBefore : 0, color: color });
      });
    }

    blocks.forEach(function (b) {
      switch (b.type) {
        case 'title': addWrapped(b.text, 'F2', 18, 0, 0); break;
        case 'summary': addWrapped(b.text, 'F1', 10, 0, 6, GRAY); break;
        case 'schedbar': addWrapped(b.text, 'F2', 11, 0, 12); break;
        case 'day': addWrapped(b.text, 'F2', 13, 0, 16); break;
        case 'stepTitle': addWrapped((b.num ? b.num + '. ' : '') + b.text, 'F2', 12, 0, 12); break;
        case 'body': addWrapped(b.text, 'F1', 10, 10, 3); break;
        case 'tip': addWrapped(t('pdf.tipPrefix') + b.text, 'F1', 9, 14, 3, BASIL); break;
        case 'warn': addWrapped(t('pdf.warnPrefix') + b.text, 'F1', 9, 14, 3, TOMATO); break;
      }
    });
    if (page.lines.length) pages.push(page);
    return pages;
  }

  // ---- PDF-Serialisierung (klassisches PDF 1.4, kein Font-Embedding) ----
  function escapePdfString(s) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '(' || c === ')' || c === '\\') out += '\\' + c;
      else out += c;
    }
    return out;
  }
  function colorOp(color) {
    if (!color) return '0 g';
    return color.map(function (v) { return v.toFixed(3); }).join(' ') + ' rg';
  }

  function buildPdf(pages) {
    const src = pages.length ? pages : [{ lines: [] }];
    let out = '%PDF-1.4\n%' + String.fromCharCode(0xE2, 0xE3, 0xCF, 0xD3) + '\n';
    const offsets = [];
    function addObj(body) {
      const num = offsets.length + 1;
      offsets.push(out.length);
      out += num + ' 0 obj\n' + body + '\nendobj\n';
      return num;
    }

    const pageNums = src.map(function (_, i) { return 5 + i * 2; });
    addObj('<< /Type /Catalog /Pages 2 0 R >>');                                                    // 1
    addObj('<< /Type /Pages /Kids [' + pageNums.map(function (n) { return n + ' 0 R'; }).join(' ') + '] /Count ' + src.length + ' >>'); // 2
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');      // 3
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4

    src.forEach(function (pg, i) {
      const contentNum = pageNums[i] + 1;
      const content = pg.lines.map(function (ln) {
        return 'BT /' + ln.font + ' ' + ln.size + ' Tf 1 0 0 1 ' + ln.x.toFixed(2) + ' ' + ln.y.toFixed(2) +
          ' Tm ' + colorOp(ln.color) + ' (' + escapePdfString(ln.text) + ') Tj ET';
      }).join('\n');
      addObj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE_W.toFixed(2) + ' ' + PAGE_H.toFixed(2) +
        '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + contentNum + ' 0 R >>');
      addObj('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    });

    const xrefOffset = out.length;
    out += 'xref\n0 ' + (offsets.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (off) { out += String(off).padStart(10, '0') + ' 00000 n \n'; });
    out += 'trailer\n<< /Size ' + (offsets.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
    return out;
  }

  // ---- Öffentliche API ----
  function buildGuidePdfBytes() {
    const blocks = collectGuideContent();
    const pages = layoutPages(blocks);
    const pdfString = buildPdf(pages);
    const bytes = new Uint8Array(pdfString.length);
    for (let i = 0; i < pdfString.length; i++) bytes[i] = pdfString.charCodeAt(i) & 0xFF;
    return bytes;
  }

  // Anders als #shareLiveMsg/#recipeIOLiveMsg ist die Erfolgsmeldung hier bei jedem
  // Klick WORTGLEICH identisch ("Anleitung als PDF gespeichert.") — kein variabler Teil
  // wie eine Rezeptanzahl. Ein reines `el.textContent = msg` würde bei zwei Klicks in
  // Folge (z. B. versehentlicher Doppelklick) beim zweiten Mal keine DOM-Änderung
  // auslösen, wodurch viele Screenreader (NVDA/JAWS/VoiceOver) die zweite, identische
  // Ansage stillschweigend unterdrücken (unzuverlässige Status-Ankündigung, WCAG 4.1.3).
  // Fix: Region erst leeren, dann den eigentlichen Text im nächsten Tick setzen — so
  // gibt es bei jedem Aufruf garantiert eine echte Inhaltsänderung, unabhängig vom
  // vorherigen Text.
  // Generation-Zähler (identisches Muster wie copyShareLink() in js/share.js bzw.
  // showRecipeIOMsg() in js/main.js, s. dortige Kommentare): ohne ihn könnte bei einem
  // schnellen Doppelklick (z. B. erst "nicht berechnet"-Hinweis, dann sofort die
  // Erfolgsmeldung) der ÄLTERE, verzögerte `setTimeout` die NEUERE Meldung wieder
  // überschreiben. Mit dem Zähler gewinnt immer der zuletzt gestartete Aufruf.
  let pdfMsgGen = 0;
  function setPdfMsg(msg) {
    const el = document.getElementById('pdfGuideLiveMsg');
    if (!el) return;
    const gen = ++pdfMsgGen;
    el.textContent = '';
    window.setTimeout(function () {
      if (gen === pdfMsgGen) el.textContent = msg;
    }, 50);
  }

  // Feature-Flag "shopping" (js/settings.js): "Als PDF speichern" ist inhaltlich eine
  // dritte Export-Variante der Anleitung neben den beiden Druck-Buttons und teilt sich
  // deshalb bewusst dasselbe Flag (s. Kommentar in js/settings.js). Der Button ist bei
  // deaktiviertem Flag bereits per CSS aus dem Rendering genommen — dieser Guard ist nur
  // eine defensive zweite Absicherung, analog zu printShoppingList()/printGuide() oben in
  // js/print.js. `tests/test.html` setzt `PZ.FLAGS.shopping` explizit auf `true` (Baseline
  // "alles an", s. test.html), daher dort weiterhin uneingeschränkt aufrufbar.
  function downloadGuidePDF() {
    if (PZ.FLAGS && PZ.FLAGS.shopping === false) return;
    const R = PZ.R;
    if (!R || !R.total) { setPdfMsg(t('pdf.notCalculatedYet')); return; }
    const bytes = buildGuidePdfBytes();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pizza-anleitung-' + new Date().toISOString().slice(0, 10) + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setPdfMsg(t('pdf.savedMsg'));
  }

  // Für Tests exponiert (reine Datenfunktionen, kein Download/DOM-Seiteneffekt).
  PZ._pdfSanitizeText = sanitizeText;
  PZ._pdfCollectGuideContent = collectGuideContent;
  PZ.buildGuidePdfBytes = buildGuidePdfBytes;
  PZ.downloadGuidePDF = downloadGuidePDF;
})(window);
