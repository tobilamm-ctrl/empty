// Vorschau des Blatts als HTML – gleicher Aufbau wie die Word-Datei.
(function (AG) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function richHtml(r) {
    if (typeof r === "string") r = [r];
    return r.map(seg => {
      if (typeof seg === "string") return esc(AG.glue(seg)).replace(/ {2,}\|(.*)$/, '<span class="op">|$1</span>');
      if (seg.f) {
        const pre = (seg.s < 0 ? AG.MINUS : "") + (seg.w ? seg.w : "");
        return `<span class="nw">${esc(pre)}<span class="fr"><span>${seg.f[0]}</span><span>${seg.f[1]}</span></span></span>`;
      }
      if (seg.b !== undefined) return `<b>${esc(seg.b)}</b>`;
      if (seg.sup !== undefined) return `<sup>${esc(seg.sup)}</sup>`;
      if (seg.br) return "<br>";
      if (seg.blank !== undefined) return `<span class="blank" style="--w:${seg.blank}"></span>`;
      return "";
    }).join("");
  }

  function tableHtml(tbl, solution) {
    return `<table class="vt${solution ? " sol" : ""}">${tbl.rows.map((r, ri) =>
      `<tr>${r.map((c, ci) => `<${ci === 0 ? "th" : "td"}${solution && ri > 0 && ci > 0 ? ' class="red"' : ""}>${richHtml(c)}</${ci === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>`;
  }

  // mode: "worksheet" | "answers" | "steps"
  // opts.layout = { extra: Zusatzplatz je Aufgabenzeile in px, breaks: Set("teil.zeile") } -> mehrere A4-Seiten
  // ohne layout: ein durchgehendes Blatt (zum Ausmessen und für Lösungen)
  function sheetHtml(sheet, meta, mode, opts) {
    const sol = mode !== "worksheet";
    const layout = opts.layout || null;
    const extra = layout ? layout.extra : 0;
    const subj = `Mathematik&nbsp; Klasse ${esc(meta.klasse)}${meta.zug === "M" ? " M-Zug" : ""}${meta.subject ? "&nbsp; | &nbsp;" + esc(meta.subject) : ""}`;
    const cls = `sheet${sol ? " sol" : ""}${layout ? " paged" : ""}${opts.measure ? " measure" : ""}`;
    let page = 1;
    const foot = () => `<footer class="sh-foot"><span>Blatt-Code: ${esc(meta.code)}</span><span>Seite ${page}</span></footer>`;
    let h = `<article class="${cls}">`;
    h += `<div class="sh-top"><header class="sh-head"><span>${subj}</span><span class="sh-nr${sol ? " red" : ""}">${sol ? "Lösungen&nbsp; " : ""}Blatt ${esc(meta.blattNr)}&nbsp; | &nbsp;Gruppe ${sheet.group}</span></header>`;
    if (!sol) h += `<div class="sh-fields"><span>Name</span><span>Klasse</span><span>Datum</span></div>`;
    h += `<h1 class="sh-title${sol ? " red" : ""}">${esc(meta.title)}${sol ? " – Lösungen" : ""}</h1>`;
    if (!sol && opts.merke && meta.merke && meta.merke.length) {
      h += `<aside class="sh-merke"><b>Merke</b><p>${richHtml(AG.merkeRich(meta.merke))}</p></aside>`;
    }
    h += `</div>`;
    const newPage = () => { h += foot() + `</article>`; page++; h += `<article class="${cls}">`; };

    sheet.parts.forEach((p, pi) => {
      const cols = Math.max(1, Math.min(3, p.cols));
      const sectionOpen = head => `<section class="sh-part" data-part="${pi}" style="--pc: var(--part-${pi})">` + (head ?
        `<div class="sh-part-head"><span class="sh-letter">${p.label}</span><span class="sh-part-title">${esc(p.title)}</span><span class="sh-stars" aria-label="Niveau ${p.level} von 3">${AG.stars(p.level)}</span></div>` +
        (sol ? "" : `<p class="sh-ins">${esc(p.instruction)}</p>`) : "") + `<ol class="sh-tasks" style="--cols:${cols}">`;
      if (layout && layout.breaks.has(pi + ".0")) newPage();
      h += sectionOpen(true);
      p.tasks.forEach((t, ti) => {
        const row = Math.floor(ti / cols);
        if (layout && ti % cols === 0 && row > 0 && layout.breaks.has(pi + "." + row)) {
          h += `</ol></section>`; newPage(); h += sectionOpen(false);
        }
        const lab = String.fromCharCode(97 + ti) + ")";
        let body;
        const inline = sol && AG.isExpression(t);
        if (inline) body = `<div class="q">${richHtml(t.q)} = <b class="red">${richHtml(t.a)}</b></div>`;
        else {
          body = `<div class="q">${richHtml(t.q)}</div>`;
          if (t.table) body += tableHtml(sol && t.aTable ? t.aTable : t.table, sol);
          if (t.fig || t.aFig) body += AG.figHtml(sol && t.aFig ? t.aFig : t.fig);
        }
        if (sol && mode === "steps" && t.steps && t.steps.length) {
          body += `<div class="steps red">${t.steps.map(s => `<div>${richHtml(s)}</div>`).join("")}</div>`;
        }
        if (sol && !inline) body += `<div class="ans red">Ergebnis: <b>${richHtml(t.a)}</b></div>`;
        const ex = layout && layout.rowExtra ? (layout.rowExtra.get(pi + "." + row) || 0) : extra;
        if (!sol && (opts.workLines || ex)) body += `<div class="work" style="height: calc(${opts.workLines || 0} * 15pt + ${ex.toFixed(1)}px)"></div>`;
        h += `<li data-task="${pi}.${ti}" data-row="${pi}.${row}"><span class="lab">${lab}</span><div class="tb">${body}</div>` +
          (opts.interactive ? `<button type="button" class="reroll" data-reroll="${pi}.${ti}" title="Diese Aufgabe neu würfeln" aria-label="Aufgabe ${p.label} ${lab} neu würfeln">${DICE}</button>` : "") + `</li>`;
      });
      h += `</ol></section>`;
    });
    h += foot() + `</article>`;
    return h;
  }

  // ---------- Seiten aufteilen ----------
  // Misst ein durchgehend gerendertes Blatt (Element mit Klasse .sheet.measure) und berechnet
  // Seitenumbrüche und Zusatzplatz, sodass das Arbeitsblatt genau 1 oder 2 Seiten füllt.
  function computeLayout(sheetEl, fill) {
    const mm = sheetEl.ownerDocument.createElement("div");
    mm.style.cssText = "position:absolute;visibility:hidden;height:100mm;width:1px";
    sheetEl.appendChild(mm);
    const pxPerMm = mm.getBoundingClientRect().height / 100;
    mm.remove();
    const cs = getComputedStyle(sheetEl);
    const padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom);
    const footEl = sheetEl.querySelector(".sh-foot");
    const footH = footEl.getBoundingClientRect().height + 6;
    const SAFETY = 0.985; // Word setzt etwas anders als der Browser
    const avail = (297 * pxPerMm - padT - padB - footH) * SAFETY;
    const top0 = sheetEl.getBoundingClientRect().top + padT;
    const topBlock = (sheetEl.querySelector(".sh-top").getBoundingClientRect().bottom - top0) * (AG.LAYOUT_K || 1);

    // Blöcke: je Teil Kopf + Zeilen
    const parts = [...sheetEl.querySelectorAll(".sh-part")].map(sec => {
      const secTop = sec.getBoundingClientRect().top;
      const lis = [...sec.querySelectorAll("li[data-row]")];
      const rows = new Map();
      for (const li of lis) {
        const r = li.getBoundingClientRect();
        const key = li.dataset.row;
        const cur = rows.get(key) || { top: r.top, bottom: r.bottom };
        cur.top = Math.min(cur.top, r.top); cur.bottom = Math.max(cur.bottom, r.bottom);
        rows.set(key, cur);
      }
      const rowList = [...rows.entries()].map(([key, v]) => ({ key, top: v.top }));
      const secBottom = sec.getBoundingClientRect().bottom;
      rowList.forEach((r, i) => { r.h = (i + 1 < rowList.length ? rowList[i + 1].top : secBottom) - r.top; });
      const marginTop = parseFloat(getComputedStyle(sec).marginTop);
      return { head: (rowList.length ? rowList[0].top : secBottom) - secTop + marginTop, rows: rowList };
    });

    // Word setzt etwas kompakter als der Browser: gemessene Höhen mit Faktor K umrechnen
    const K = AG.LAYOUT_K || 1;
    for (const part of parts) { part.head *= K; for (const r of part.rows) r.h *= K; }
    function paginate(extra) {
      let pages = 1, y = topBlock;
      const breaks = new Set();
      const pageRows = [[]], used = [];
      for (const part of parts) {
        part.rows.forEach((row, ri) => {
          const need = (ri === 0 ? part.head : 0) + row.h + extra;
          if (y + need > avail && y > 0) {
            used.push(y); pages++; breaks.add(row.key); pageRows.push([]);
            y = (ri === 0 ? part.head : 0) + row.h + extra;
          } else y += need;
          pageRows[pageRows.length - 1].push(row.key);
        });
      }
      used.push(y);
      return { pages, breaks, pageRows, used };
    }
    const base = paginate(0);
    if (!fill) return { extra: 0, breaks: base.breaks, pages: base.pages, rowExtra: null };
    const target = base.pages;
    let lo = 0, hi = 600;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (paginate(mid).pages <= target) lo = mid; else hi = mid;
    }
    const res = paginate(lo);
    // Restplatz jeder Seite auf ihre eigenen Zeilen verteilen, damit jede Seite voll wird
    const rowExtra = new Map();
    res.pageRows.forEach((keys, pi) => {
      const rest = Math.max(0, avail - res.used[pi]);
      const add = keys.length ? rest / keys.length : 0;
      for (const k of keys) rowExtra.set(k, lo + add);
    });
    return { extra: lo, breaks: res.breaks, pages: res.pages, rowExtra };
  }

  const DICE = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`;

  AG.richHtml = richHtml;
  AG.sheetHtml = sheetHtml;
  AG.computeLayout = computeLayout;
  AG.DICE_SVG = DICE;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
