// Word-Datei (.docx) direkt im Browser erzeugen – ohne Bibliothek, funktioniert offline.
(function (AG) {
  const INK = "1F3F9E";      // Füllerblau
  const RED = "C8102E";      // Korrekturrot
  const GREY = "5A6275";
  const FILL = "EAF0FC";     // Merke-Kasten
  const FONT = "Arial";
  const PART_FILL = ["1F3F9E", "2E7D5B", "B5541B", "6B3FA0", "0F6E7A", "A1324A"]; // Teil A–F

  // ---------- ZIP (ohne Kompression) ----------
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const enc = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;
    for (const [name, content] of files) {
      const nameB = enc.encode(name);
      const isPacked = content && content.packed;
      const raw = isPacked ? content.raw : (typeof content === "string" ? enc.encode(content) : content);
      const data = isPacked ? content.packed : raw;
      const method = isPacked ? 8 : 0;
      const crc = crc32(raw);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, method, true); local.setUint16(10, 0, true); local.setUint16(12, 0x21, true);
      local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, raw.length, true);
      local.setUint16(26, nameB.length, true); local.setUint16(28, 0, true);
      chunks.push(new Uint8Array(local.buffer), nameB, data);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, method, true); cen.setUint16(12, 0, true); cen.setUint16(14, 0x21, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, raw.length, true);
      cen.setUint16(28, nameB.length, true); cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nameB);
      offset += 30 + nameB.length + data.length;
    }
    const cenSize = central.reduce((s, c) => s + c.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
    const all = [...chunks, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0));
    let p = 0;
    for (const c of all) { out.set(c, p); p += c.length; }
    return out;
  }

  // ---------- XML-Bausteine ----------
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function rPr(o = {}) {
    let x = `<w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>`;
    if (o.b) x += "<w:b/>";
    if (o.i) x += "<w:i/>";
    if (o.color) x += `<w:color w:val="${o.color}"/>`;
    if (o.size) x += `<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>`;
    if (o.sup) x += `<w:vertAlign w:val="superscript"/>`;
    if (o.spacing) x += `<w:spacing w:val="${o.spacing}"/>`;
    return `<w:rPr>${x}</w:rPr>`;
  }
  function run(text, o = {}) {
    if (text === "") return "";
    const parts = String(text).split("\t");
    return parts.map((t, i) => (i ? `<w:r>${rPr(o)}<w:tab/></w:r>` : "") +
      (t ? `<w:r>${rPr(o)}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>` : "")).join("");
  }
  function mRun(text, o) {
    return `<m:r><m:rPr><m:sty m:val="p"/></m:rPr>${rPr(o).replace(`w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"`, 'w:ascii="Cambria Math" w:hAnsi="Cambria Math"')}<m:t>${esc(text)}</m:t></m:r>`;
  }
  function fracXml(n, d, o) {
    return `<m:oMath><m:f><m:fPr><m:ctrlPr>${rPr(o)}</m:ctrlPr></m:fPr><m:num>${mRun(String(n), o)}</m:num><m:den>${mRun(String(d), o)}</m:den></m:f></m:oMath>`;
  }
  // Rich -> Runs (Inhalt eines Absatzes)
  function richXml(r, o = {}) {
    if (typeof r === "string") r = [r];
    return r.map(seg => {
      if (typeof seg === "string") return run(AG.glue(seg.replace(/ {2,}\|/g, "\t|")), o);
      if (seg.f) {
        let pre = (seg.s < 0 ? AG.MINUS : "") + (seg.w ? String(seg.w) : "");
        return run(pre, o) + fracXml(seg.f[0], seg.f[1], o);
      }
      if (seg.b !== undefined) return run(seg.b, { ...o, b: true });
      if (seg.sup !== undefined) return run(seg.sup, { ...o, sup: true });
      if (seg.br) return `<w:r><w:br/></w:r>`;
      if (seg.blank !== undefined) return run(" ".repeat(2) + "_".repeat(Math.max(3, seg.blank * 2)) + " ", { ...o, color: o.color || GREY });
      return "";
    }).join("");
  }
  function para(inner, o = {}) {
    let p = "";
    if (o.style) p += `<w:pStyle w:val="${o.style}"/>`;
    if (o.keepNext) p += "<w:keepNext/>";
    if (o.pageBreakBefore) p += "<w:pageBreakBefore/>";
    if (o.shade) p += `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`;
    if (o.tabs) p += `<w:tabs>${o.tabs.map(t => `<w:tab w:val="${t.val || "left"}" w:pos="${t.pos}"/>`).join("")}</w:tabs>`;
    p += `<w:spacing w:before="${o.before || 0}" w:after="${o.after === undefined ? 60 : o.after}" w:line="${o.line || 264}" w:lineRule="${o.exact ? "exact" : "auto"}"/>`;
    if (o.indent) p += `<w:ind w:left="${o.indent}"${o.hanging ? ` w:hanging="${o.hanging}"` : ""}/>`;
    if (o.align) p += `<w:jc w:val="${o.align}"/>`;
    if (o.size) p += `<w:rPr><w:sz w:val="${o.size}"/></w:rPr>`;
    return `<w:p><w:pPr>${p}</w:pPr>${inner}</w:p>`;
  }
  // Tabelle: rows = [[{xml, w, fill, borders, vAlign, margins}]]
  function table(rows, o = {}) {
    const widths = o.widths;
    const total = widths.reduce((a, b) => a + b, 0);
    const bd = o.borders || {};
    const b = side => bd[side] ? `<w:${side} w:val="${bd[side].val || "single"}" w:sz="${bd[side].sz || 4}" w:space="0" w:color="${bd[side].color || "auto"}"/>` : `<w:${side} w:val="nil"/>`;
    let x = `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${o.indent ? `<w:tblInd w:w="${o.indent}" w:type="dxa"/>` : ""}<w:tblLayout w:type="fixed"/>` +
      `<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(b).join("")}</w:tblBorders>` +
      `<w:tblCellMar><w:top w:w="${o.padT || 0}" w:type="dxa"/><w:left w:w="${o.padL === undefined ? 80 : o.padL}" w:type="dxa"/><w:bottom w:w="${o.padB || 0}" w:type="dxa"/><w:right w:w="${o.padR === undefined ? 80 : o.padR}" w:type="dxa"/></w:tblCellMar>` +
      `</w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
    for (const row of rows) {
      x += `<w:tr>${o.cantSplit ? "<w:trPr><w:cantSplit/></w:trPr>" : ""}`;
      row.forEach((c, i) => {
        const cb = c.borders ? `<w:tcBorders>${Object.entries(c.borders).map(([s, v]) => `<w:${s} w:val="${v.val || "single"}" w:sz="${v.sz || 4}" w:space="0" w:color="${v.color || "auto"}"/>`).join("")}</w:tcBorders>` : "";
        const span = c.span ? `<w:gridSpan w:val="${c.span}"/>` : "";
        const w = c.span ? widths.slice(i, i + c.span).reduce((a, b) => a + b, 0) : widths[i];
        const mar = c.margins ? `<w:tcMar>${Object.entries(c.margins).map(([s, v]) => `<w:${s} w:w="${v}" w:type="dxa"/>`).join("")}</w:tcMar>` : "";
        x += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span}${cb}${c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${c.fill}"/>` : ""}${mar}${c.vAlign ? `<w:vAlign w:val="${c.vAlign}"/>` : ""}</w:tcPr>${c.xml || para("")}</w:tc>`;
      });
      x += "</w:tr>";
    }
    return x + "</w:tbl>";
  }

  // ---------- Blatt-Layout ----------
  const PAGE_W = 11906, MARGIN = 1020; // A4, 1,8 cm Rand
  const TEXT_W = PAGE_W - 2 * MARGIN;
  const STAR_ON = "★", STAR_OFF = "☆";

  function stars(level) { return STAR_ON.repeat(level) + STAR_OFF.repeat(3 - level); }

  function headerXml(meta, solution, pageBreak) {
    const left = `Mathematik  Klasse ${meta.klasse}${meta.zug === "M" ? " M-Zug" : ""}${meta.subject ? "  |  " + meta.subject : ""}`;
    const right = `${solution ? "Lösungen  " : ""}Blatt ${meta.blattNr}  |  Gruppe ${meta.group}`;
    let x = para(run(left, { size: 17, color: GREY }) + run("\t" + right, { size: 17, color: solution ? RED : INK, b: true }),
      { tabs: [{ val: "right", pos: TEXT_W }], after: 80, pageBreakBefore: !!pageBreak });
    if (!solution) {
      const cell = label => ({ xml: para(run(label, { size: 18, color: GREY }), { after: 0, before: 160 }), borders: { bottom: { sz: 6, color: "9AA3B8" } } });
      x += table([[cell("Name"), { xml: para("") }, cell("Klasse"), { xml: para("") }, cell("Datum")]],
        { widths: [5200, 300, 1700, 300, TEXT_W - 7500], padL: 0, padR: 0 });
    }
    x += para(run(meta.title + (solution ? " – Lösungen" : ""), { size: 36, b: true, color: solution ? RED : INK }), { before: 260, after: 120, line: 240 });
    return x;
  }

  function merkeXml(merke) {
    const inner = para(run("Merke", { b: true, color: INK, size: 20 }), { after: 40 }) + para(richXml(AG.merkeRich(merke), { size: 21 }), { after: 0, line: 300 });
    return table([[{ xml: inner, fill: FILL, borders: { left: { sz: 36, color: INK } }, margins: { top: 120, bottom: 140, left: 220, right: 200 } }]],
      { widths: [TEXT_W] }) + para("", { after: 120 });
  }

  function partHeadXml(part, idx, solution) {
    const color = PART_FILL[idx % PART_FILL.length];
    const letter = { xml: para(run(part.label, { b: true, color: "FFFFFF", size: 26 }), { align: "center", after: 0, keepNext: true }), fill: color, vAlign: "center" };
    const title = { xml: para(run(part.title, { b: true, size: 24 }) + run("   " + stars(part.level), { color, size: 22 }), { after: 0, keepNext: true }), vAlign: "center", margins: { left: 180 } };
    let x = para("", { before: 140, after: 0, keepNext: true, size: 8 });
    x += table([[letter, title]], { widths: [460, TEXT_W - 460], padT: 50, padB: 50 });
    if (!solution) x += para(run(part.instruction, { i: true, color: GREY, size: 21 }), { before: 80, after: 100, keepNext: true });
    else x += para("", { after: 60, keepNext: true, size: 8 });
    return x;
  }

  function taskTableXml(tbl, o) {
    const cols = tbl.rows[0].length;
    const first = cols > 8 ? 1000 : 1800;   // breite Tabellen (z. B. Stellenwerttafel): schmalere Kopfspalte
    const w = Math.max(cols > 8 ? 380 : 700, Math.min(2200, Math.floor((o.width - first - 200) / (cols - 1))));
    const widths = [first, ...Array(cols - 1).fill(w)];
    const rows = tbl.rows.map((r, ri) => r.map((c, ci) => ({
      xml: para(richXml(c, { size: 20, color: o.color && ci > 0 && ri > 0 ? o.color : undefined, b: ci === 0 }), { after: 0, align: ci ? "center" : "left" }),
      fill: ci === 0 ? "F1F3F8" : undefined, vAlign: "center",
    })));
    const line = { sz: 4, color: "9AA3B8" };
    return table(rows, { widths, indent: o.indent, padT: 50, padB: 50, borders: { top: line, left: line, bottom: line, right: line, insideH: line, insideV: line } });
  }

  function tasksXml(part, mode, workLines, pi, layout) {
    const cols = Math.max(1, Math.min(3, part.cols));
    const colW = Math.floor(TEXT_W / cols);
    const label = i => String.fromCharCode(97 + i) + ")";
    const cells = part.tasks.map((t, i) => {
      const sol = mode !== "worksheet";
      const color = sol ? RED : undefined;
      let x = "";
      const lab = run(label(i) + "\t", { b: true, color: INK });
      const qRich = t.q;
      if (sol && AG.isExpression(t)) {
        x += para(lab + richXml(qRich) + run(" = ", {}) + richXml(t.a, { color, b: true }), { indent: 380, hanging: 380, tabs: [{ pos: 380 }], after: 40, line: 300 });
      } else {
        x += para(lab + richXml(qRich), { indent: 380, hanging: 380, tabs: [{ pos: 380 }, { pos: 380 + 2600 }], after: 60, line: 300 });
        if (t.table) {
          const tb = sol && t.aTable ? t.aTable : t.table;
          x += taskTableXml(tb, { width: colW - 380, color, indent: 380 }) + para("", { after: 40, size: 6 });
        }
        const fig = sol && t.aFig ? t.aFig : t.fig;
        if (fig) x += para(figRun(fig, (colW - 380) / 56.7), { indent: 380, after: 60, line: 240 });
      }
      const inline = sol && AG.isExpression(t);
      if (sol && mode === "steps" && t.steps && t.steps.length) {
        for (const s of t.steps) x += para(richXml(s, { color, size: 20 }), { indent: inline ? 600 : 380, tabs: [{ pos: (inline ? 600 : 380) + 2600 }], after: 0, line: 300 });
      }
      if (sol && !inline) x += para(run("Ergebnis: ", { color, size: 20 }) + richXml(t.a, { color, b: true }), { indent: 380, before: 40, after: 40, line: 300 });
      const rowKey = pi + "." + Math.floor(i / cols);
      const exPx = layout ? (layout.rowExtra ? (layout.rowExtra.get(rowKey) || 0) : layout.extra) : 0;
      const workTw = Math.round((workLines || 0) * 300 + exPx * 15);
      if (!sol && workTw > 0) x += para("", { after: 0, line: Math.max(20, workTw), exact: true, size: 4 });
      x += para("", { after: 0, size: 10, line: 200 });
      return { xml: x };
    });
    // Zeilen; bei einem Seitenumbruch Tabelle beenden und neue Seite beginnen
    let out = "", rows = [];
    const flush = () => { if (rows.length) out += table(rows, { widths: Array(cols).fill(colW), padL: 0, padR: 120, cantSplit: true }); rows = []; };
    for (let i = 0, r = 0; i < cells.length; i += cols, r++) {
      if (r > 0 && layout && layout.breaks.has(pi + "." + r)) { flush(); out += PAGE_BREAK; }
      const row = cells.slice(i, i + cols);
      while (row.length < cols) row.push({ xml: para("") });
      rows.push(row);
    }
    flush();
    return out;
  }
  const PAGE_BREAK = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>`;

  // Ein Blatt (Arbeitsblatt oder Lösung) als Body-XML
  function sheetXml(sheet, meta, mode, opts, pageBreak, layout) {
    const solution = mode !== "worksheet";
    let x = headerXml({ ...meta, group: sheet.group }, solution, pageBreak);
    if (!solution && opts.merke && meta.merke && meta.merke.length) x += merkeXml(meta.merke);
    sheet.parts.forEach((p, i) => {
      if (layout && layout.breaks.has(i + ".0")) x += PAGE_BREAK;
      x += partHeadXml(p, i, solution);
      x += tasksXml(p, mode, opts.workLines || 0, i, layout);
    });
    return x;
  }

  function documentXml(body, code) {
    const sect = `<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="${PAGE_W}" w:h="16838"/>` +
      `<w:pgMar w:top="900" w:right="${MARGIN}" w:bottom="900" w:left="${MARGIN}" w:header="500" w:footer="420" w:gutter="0"/></w:sectPr>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${body}${sect}</w:body></w:document>`;
  }

  function footerXml(code) {
    const fld = (instr) => `<w:r>${rPr({ size: 15, color: GREY })}<w:fldChar w:fldCharType="begin"/></w:r><w:r>${rPr({ size: 15, color: GREY })}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r>${rPr({ size: 15, color: GREY })}<w:fldChar w:fldCharType="separate"/></w:r><w:r>${rPr({ size: 15, color: GREY })}<w:t>1</w:t></w:r><w:r>${rPr({ size: 15, color: GREY })}<w:fldChar w:fldCharType="end"/></w:r>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${para(
      run("Blatt-Code: " + code, { size: 13, color: "8A91A3" }) + run("\tSeite ", { size: 15, color: GREY }) + fld("PAGE"),
      { tabs: [{ val: "right", pos: TEXT_W }], after: 0 })}</w:ftr>`;
  }

  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}" w:eastAsia="${FONT}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Standard"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="NormaleTabelle"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;

  // Mit Kompression (kleinere Datei), falls der Browser CompressionStream kann
  async function packFiles(files) {
    if (typeof CompressionStream === "undefined") return files;
    const enc = new TextEncoder();
    const out = [];
    for (const [name, content] of files) {
      const raw = typeof content === "string" ? enc.encode(content) : content;
      const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      const packed = new Uint8Array(await new Response(stream).arrayBuffer());
      out.push([name, { raw, packed }]);
    }
    return out;
  }

  // pages: [{sheet, mode: "worksheet"|"answers"|"steps"}]
  async function buildDocxAsync(pages, meta, opts) {
    if (AG.rasterizeSheet) for (const pg of pages) await AG.rasterizeSheet(pg.sheet);
    return zip(await packFiles(docxFiles(pages, meta, opts)));
  }
  function buildDocx(pages, meta, opts) { return zip(docxFiles(pages, meta, opts)); }

  // ---------- Skizzen als PNG-Bilder ----------
  let IMAGES = [];
  function figRun(fig, maxWmm) {
    const png = AG.figPng ? AG.figPng(fig) : null;
    if (!png) return run("[Skizze]", { color: GREY, i: true });
    let img = IMAGES.find(im => im.png === png);
    if (!img) { img = { png, n: IMAGES.length + 1 }; IMAGES.push(img); }
    const sc = Math.min(1, maxWmm / fig.w);
    const cx = Math.round(fig.w * sc * 36000), cy = Math.round(fig.h * sc * 36000);
    const id = 1000 + IMAGES.length * 10 + Math.floor(Math.random() * 9);
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Skizze ${img.n}"/>` +
      `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="skizze${img.n}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="rIdImg${img.n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  }

  function docxFiles(pages, meta, opts) {
    IMAGES = [];
    const body = pages.map((pg, i) => sheetXml(pg.sheet, meta, pg.mode, opts, i > 0, pg.layout)).join("");
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
      ["docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(meta.title)}</dc:title><dc:creator>Aufgaben-Generator</dc:creator></cp:coreProperties>`],
      ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${IMAGES.map(im => `<Relationship Id="rIdImg${im.n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/skizze${im.n}.png"/>`).join("")}</Relationships>`],
      ["word/styles.xml", STYLES],
      ["word/footer1.xml", footerXml(meta.code)],
      ["word/document.xml", documentXml(body, meta.code)],
      ...IMAGES.map(im => [`word/media/skizze${im.n}.png`, im.png.bytes]),
    ];
    return files;
  }

  AG.buildDocx = buildDocx;
  AG.buildDocxAsync = buildDocxAsync;
  AG.DOCX_COLORS = { INK, RED, GREY, FILL, PART_FILL };
  AG.stars = stars;
  AG._zip = zip;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
