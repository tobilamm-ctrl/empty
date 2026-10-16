// OneNote-Export: Blatt als HTML für die Zwischenablage (Strg+V auf einer leeren OneNote-Seite).
// OneNote übernimmt nur Inline-Styles, Tabellen und Bilder – kein <style>, kein Flexbox/Grid,
// keine CSS-Variablen. Brüche werden deshalb als kleine PNG-Bilder mit Bruchstrich gezeichnet.
(function (AG) {
  const FONT = "Arial";
  const W = 680;                       // Breite der Inhaltstabelle in px
  const DC = AG.DOCX_COLORS || {};
  const hex = (v, fb) => "#" + (v || fb);
  const INK = hex(DC.INK, "1F3F9E"), RED = hex(DC.RED, "C8102E"), GREY = hex(DC.GREY, "5A6275");
  const FILL = hex(DC.FILL, "EAF0FC");
  const PART_FILL = (DC.PART_FILL || ["1F3F9E", "2E7D5B", "B5541B", "6B3FA0"]).map(c => "#" + c);
  const TEXT = "#1B2130";             // Fließtext wie in der Vorschau
  const LINE = "#9AA3B8", HEAD = "#F1F3F8";
  const SCALE = 3;                     // Auflösung der Bruch-Bilder

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pxOf = pt => pt * 4 / 3;       // pt -> CSS-px (96 dpi)
  const stars = level => AG.stars ? AG.stars(level) : "★".repeat(level) + "☆".repeat(3 - level);
  const gap = pt => `<p style="margin:0;font-size:${pt}pt;line-height:${pt}pt">&nbsp;</p>`;
  const line = n => `<span style="color:${GREY}">${"_".repeat(n)}</span>`;

  // Text: feste Leerzeichen (AG.glue) und Mehrfach-Leerzeichen bleiben erhalten
  function txt(s) {
    return esc(AG.glue(s)).replace(/ {2,}/g, m => "&nbsp;".repeat(m.length));
  }

  // ---------- Brüche als Bild ----------
  const frCache = new Map();

  // Zeichnet z/n auf ein Canvas: Zähler, Bruchstrich, Nenner – Höhe ca. 1,9 × Textzeile
  function drawFrac(n, d, color, px) {
    try {
      const cv = document.createElement("canvas");
      const g = cv.getContext("2d");
      if (!g) return null;
      const font = px + "px " + FONT;
      g.font = font;
      const H = 2 * Math.round(px * 0.95);          // gerade Höhe: Bruchstrich liegt auf Pixelgrenze
      const mid = H / 2;
      const digit = px * 0.72;                      // Ziffernhöhe Arial (ca. 0,716 em)
      const W = Math.ceil(Math.max(g.measureText(String(n)).width, g.measureText(String(d)).width)) + 4;
      cv.width = Math.ceil(W * SCALE); cv.height = Math.ceil(H * SCALE); // Setzen des Maßes leert den Kontext
      g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      g.font = font; g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.fillText(String(n), W / 2, mid - 2.5);
      g.fillText(String(d), W / 2, mid + 2.5 + digit);
      g.fillRect(0, mid - 1 / SCALE, W, 1);         // Bruchstrich: 1 px = 3 Gerätepixel, scharf
      return { src: cv.toDataURL("image/png"), w: W, h: H };
    } catch (e) {
      return null;
    }
  }

  // Bruch als <img>; ohne document (z. B. in Node) als Text „z/n“
  function fracHtml(n, d, cx) {
    const px = pxOf(cx.size);
    if (typeof document !== "undefined" && document && document.createElement) {
      const key = [n, d, cx.color, px].join("|");
      if (!frCache.has(key)) frCache.set(key, drawFrac(n, d, cx.color, px));
      const f = frCache.get(key);
      if (f) return `<img src="${f.src}" width="${f.w}" height="${f.h}" alt="${n}/${d}" style="vertical-align:middle">`;
    }
    return `${n}/${d}`;
  }

  // ---------- Rich -> HTML ----------
  // cx = { color: Textfarbe, size: Schriftgröße in pt }
  function rhtml(r, cx) {
    if (typeof r === "string") r = [r];
    if (!Array.isArray(r)) r = [r];
    return r.map(seg => {
      if (typeof seg === "string") return txt(seg);
      if (Array.isArray(seg)) return rhtml(seg, cx);
      if (seg.f) {
        const pre = (seg.s < 0 ? AG.MINUS : "") + (seg.w ? String(seg.w) : "");
        return `<span style="white-space:nowrap">${txt(pre)}${fracHtml(seg.f[0], seg.f[1], cx)}</span>`;
      }
      if (seg.b !== undefined) return `<b>${txt(seg.b)}</b>`;
      if (seg.sup !== undefined) return `<sup>${txt(seg.sup)}</sup>`;
      if (seg.br) return "<br>";
      if (seg.blank !== undefined) return `<span style="color:${GREY}">&nbsp;&nbsp;${"_".repeat(Math.max(3, seg.blank * 2))}&nbsp;</span>`;
      return "";
    }).join("");
  }

  // Tabelle innerhalb einer Aufgabe: dünne graue Ränder, erste Spalte fett auf Hellgrau
  function tableHtml(tbl, sol) {
    const rows = tbl.rows.map((r, ri) => `<tr>${r.map((c, ci) => {
      const red = sol && ri > 0 && ci > 0;
      const color = red ? RED : TEXT;
      const first = ci === 0;
      const st = `border:0.5pt solid ${LINE};padding:2pt 6pt;font-family:${FONT};font-size:10pt;line-height:13pt;` +
        `color:${color};text-align:${first ? "left" : "center"};vertical-align:middle;` +
        (first ? `background-color:${HEAD};font-weight:bold;` : "");
      return `<td${first ? ` bgcolor="${HEAD}"` : ""} style="${st}">${rhtml(c, { color, size: 10 })}</td>`;
    }).join("")}</tr>`).join("");
    return `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:2pt 0 4pt 0"><tbody>${rows}</tbody></table>`;
  }

  // mode: "worksheet" | "answers" | "steps"; opts.merke, opts.workLines wie sheetHtml
  function oneNoteHtml(sheet, meta, mode, opts) {
    opts = opts || {};
    const sol = mode !== "worksheet";
    const workLines = sol ? 0 : (opts.workLines || 0);

    // Kopfzeile: links Fach/Klasse, rechts Blatt/Gruppe
    const left = `Mathematik&nbsp; Klasse ${esc(meta.klasse)}${meta.zug === "M" ? " M-Zug" : ""}${meta.subject ? "&nbsp; | &nbsp;" + esc(meta.subject) : ""}`;
    const right = `${sol ? "Lösungen&nbsp; " : ""}Blatt ${esc(meta.blattNr)}&nbsp; | &nbsp;Gruppe ${esc(sheet.group)}`;
    let h = `<table width="${W}" cellpadding="0" cellspacing="0" border="0" style="width:${W}px;border-collapse:collapse"><tr>` +
      `<td style="border:none;padding:0;font-family:${FONT};font-size:8.5pt;color:${GREY};text-align:left;vertical-align:top">${left}</td>` +
      `<td style="border:none;padding:0;font-family:${FONT};font-size:8.5pt;font-weight:bold;color:${sol ? RED : INK};text-align:right;vertical-align:top">${right}</td>` +
      `</tr></table>`;

    if (!sol) {
      h += `<p style="margin:14pt 0 0 0;font-family:${FONT};font-size:11pt;color:${TEXT}">` +
        `Name&nbsp; ${line(26)}&nbsp;&nbsp; Klasse&nbsp; ${line(10)}&nbsp;&nbsp; Datum&nbsp; ${line(12)}</p>`;
    }
    h += `<p style="margin:14pt 0 8pt 0;font-family:${FONT};font-size:18pt;line-height:22pt;font-weight:bold;color:${sol ? RED : INK}">` +
      `${esc(meta.title)}${sol ? " – Lösungen" : ""}</p>`;

    // Merke-Kasten: einzellige Tabelle, hellblau, dicker blauer linker Rand
    if (!sol && opts.merke && meta.merke && meta.merke.length) {
      h += `<table width="${W}" cellpadding="0" cellspacing="0" border="0" style="width:${W}px;border-collapse:collapse"><tr>` +
        `<td bgcolor="${FILL}" style="background-color:${FILL};border:none;border-left:4.5pt solid ${INK};padding:8pt 10pt 9pt 11pt;` +
        `font-family:${FONT};font-size:10.5pt;line-height:15pt;color:${TEXT};vertical-align:top">` +
        `<p style="margin:0 0 3pt 0;font-weight:bold;color:${INK};font-size:10pt">Merke</p>` +
        `<p style="margin:0">${rhtml(AG.merkeRich(meta.merke), { color: TEXT, size: 10.5 })}</p>` +
        `</td></tr></table>` + gap(6);
    }

    // Teile A–D
    sheet.parts.forEach((p, pi) => {
      const cols = Math.max(1, Math.min(3, p.cols));
      const colW = Math.floor(W / cols);
      const pc = PART_FILL[pi % 4];

      // Kopf: Buchstabe weiß auf Teilfarbe, daneben Titel und Sterne
      h += gap(7);
      h += `<table width="${W}" cellpadding="0" cellspacing="0" border="0" style="width:${W}px;border-collapse:collapse"><tr>` +
        `<td width="32" bgcolor="${pc}" style="width:32px;background-color:${pc};border:none;padding:4pt 0;text-align:center;vertical-align:middle;` +
        `font-family:${FONT};font-size:13pt;font-weight:bold;color:#FFFFFF">${esc(p.label)}</td>` +
        `<td style="border:none;padding:4pt 0 4pt 12px;vertical-align:middle;font-family:${FONT};font-size:12pt;font-weight:bold;color:${TEXT}">` +
        `${esc(p.title)}<span style="font-size:11pt;font-weight:normal;color:${pc}">&nbsp;&nbsp;&nbsp;${stars(p.level)}</span></td>` +
        `</tr></table>`;
      if (!sol) h += `<p style="margin:5pt 0 6pt 0;font-family:${FONT};font-size:10.5pt;font-style:italic;color:${GREY}">${txt(String(p.instruction || ""))}</p>`;
      else h += gap(4);

      // Aufgaben: randlose Tabelle mit `cols` Spalten
      const cells = p.tasks.map((t, ti) => {
        const inline = sol && AG.isExpression(t);
        const lab = `<b style="color:${INK}">${String.fromCharCode(97 + ti)})</b>&nbsp;&nbsp;`;
        let x = "";
        if (inline) {
          x += `<p style="margin:0 0 3pt 0">${lab}${rhtml(t.q, { color: TEXT, size: 11 })}&nbsp;=&nbsp;` +
            `<b style="color:${RED}">${rhtml(t.a, { color: RED, size: 11 })}</b></p>`;
        } else {
          x += `<p style="margin:0 0 3pt 0">${lab}${rhtml(t.q, { color: TEXT, size: 11 })}</p>`;
          if (t.table) x += tableHtml(sol && t.aTable ? t.aTable : t.table, sol);
        }
        if (sol && mode === "steps" && t.steps && t.steps.length) {
          for (const s of t.steps) x += `<p style="margin:0 0 0 20px;color:${RED};font-size:10pt;line-height:15pt">${rhtml(s, { color: RED, size: 10 })}</p>`;
        }
        if (sol && !inline) {
          x += `<p style="margin:3pt 0 0 0;color:${RED};font-size:10pt">Ergebnis:&nbsp; <b>${rhtml(t.a, { color: RED, size: 10 })}</b></p>`;
        }
        if (workLines > 0) x += `<p style="margin:0;font-size:11pt;line-height:15pt">&nbsp;</p>`.repeat(workLines);
        return `<td width="${colW}" valign="top" style="width:${colW}px;border:none;padding:0 12px 10pt 0;vertical-align:top;` +
          `font-family:${FONT};font-size:11pt;line-height:15pt;color:${TEXT}">${x}</td>`;
      });
      if (cells.length) {
        let trs = "";
        for (let i = 0; i < cells.length; i += cols) {
          const row = cells.slice(i, i + cols);
          while (row.length < cols) row.push(`<td width="${colW}" style="width:${colW}px;border:none"></td>`);
          trs += `<tr>${row.join("")}</tr>`;
        }
        h += `<table width="${W}" cellpadding="0" cellspacing="0" border="0" style="width:${W}px;border-collapse:collapse;border:none"><tbody>${trs}</tbody></table>`;
      }
    });

    return `<div style="font-family:${FONT};font-size:11pt;color:${TEXT};width:${W}px">${h}</div>`;
  }

  // ---------- Zwischenablage ----------
  // Klartext für text/plain: Bruch-Bilder als „z/n“, Zellen mit Tab, Absätze mit Zeilenumbruch
  function plainOf(html) {
    return html
      .replace(/<img[^>]*?alt="([^"]*)"[^>]*>/g, "$1")
      .replace(/<\/t[dh]>/gi, "\t")
      .replace(/<\/(p|div|tr|table)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;| /g, " ")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  // HTML in die Zwischenablage. Gibt true/false zurück.
  async function copyForOneNote(html) {
    const plain = plainOf(html);
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        })]);
        return true;
      } catch (e) {
        // weiter mit dem Rückfall
      }
    }
    if (typeof document === "undefined") return false;
    // Rückfall: unsichtbares contenteditable-Element markieren und kopieren
    let div = null, ok = false;
    try {
      div = document.createElement("div");
      div.setAttribute("contenteditable", "true");
      div.setAttribute("aria-hidden", "true");
      div.style.cssText = "position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none";
      div.innerHTML = html;
      document.body.appendChild(div);
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(div);
      sel.removeAllRanges(); sel.addRange(range);
      ok = document.execCommand("copy");
      sel.removeAllRanges();
    } catch (e) {
      ok = false;
    } finally {
      if (div && div.remove) div.remove();
    }
    return !!ok;
  }

  AG.oneNoteHtml = oneNoteHtml;
  AG.copyForOneNote = copyForOneNote;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
