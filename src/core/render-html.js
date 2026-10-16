// Vorschau des Blatts als HTML – gleicher Aufbau wie die Word-Datei.
(function (AG) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function richHtml(r) {
    if (typeof r === "string") r = [r];
    return r.map(seg => {
      if (typeof seg === "string") return esc(seg);
      if (seg.f) {
        const pre = (seg.s < 0 ? AG.MINUS : "") + (seg.w ? seg.w : "");
        return `${esc(pre)}<span class="fr"><span>${seg.f[0]}</span><span>${seg.f[1]}</span></span>`;
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
  function sheetHtml(sheet, meta, mode, opts) {
    const sol = mode !== "worksheet";
    const subj = `Mathematik&nbsp; Klasse ${esc(meta.klasse)}${meta.zug === "M" ? " M-Zug" : ""}${meta.subject ? "&nbsp; | &nbsp;" + esc(meta.subject) : ""}`;
    let h = `<header class="sh-head"><span>${subj}</span><span class="sh-nr${sol ? " red" : ""}">${sol ? "Lösungen&nbsp; " : ""}Blatt ${esc(meta.blattNr)}&nbsp; | &nbsp;Gruppe ${sheet.group}</span></header>`;
    if (!sol) h += `<div class="sh-fields"><span>Name</span><span>Klasse</span><span>Datum</span></div>`;
    h += `<h1 class="sh-title${sol ? " red" : ""}">${esc(meta.title)}${sol ? " – Lösungen" : ""}</h1>`;
    if (!sol && opts.merke && meta.merke && meta.merke.length) {
      h += `<aside class="sh-merke"><b>Merke</b><p>${richHtml(meta.merke)}</p></aside>`;
    }
    sheet.parts.forEach((p, pi) => {
      h += `<section class="sh-part" data-part="${pi}" style="--pc: var(--part-${pi})">
        <div class="sh-part-head"><span class="sh-letter">${p.label}</span><span class="sh-part-title">${esc(p.title)}</span><span class="sh-stars" aria-label="Niveau ${p.level} von 3">${AG.stars(p.level)}</span></div>`;
      if (!sol) h += `<p class="sh-ins">${esc(p.instruction)}</p>`;
      h += `<ol class="sh-tasks" style="--cols:${Math.max(1, Math.min(3, p.cols))}">`;
      p.tasks.forEach((t, ti) => {
        const lab = String.fromCharCode(97 + ti) + ")";
        let body;
        const inline = sol && AG.isExpression(t);
        if (inline) body = `<div class="q">${richHtml(t.q)} = <b class="red">${richHtml(t.a)}</b></div>`;
        else {
          body = `<div class="q">${richHtml(t.q)}</div>`;
          if (t.table) body += tableHtml(sol && t.aTable ? t.aTable : t.table, sol);
        }
        if (sol && mode === "steps" && t.steps && t.steps.length) {
          body += `<div class="steps red">${t.steps.map(s => `<div>${richHtml(s)}</div>`).join("")}</div>`;
        }
        if (sol && !inline) body += `<div class="ans red">Ergebnis: <b>${richHtml(t.a)}</b></div>`;
        if (!sol && opts.workLines) body += `<div class="work" style="--lines:${opts.workLines}"></div>`;
        h += `<li data-task="${pi}.${ti}"><span class="lab">${lab}</span><div class="tb">${body}</div>` +
          (opts.interactive ? `<button type="button" class="reroll" data-reroll="${pi}.${ti}" title="Diese Aufgabe neu würfeln" aria-label="Aufgabe ${p.label} ${lab} neu würfeln">${DICE}</button>` : "") + `</li>`;
      });
      h += `</ol></section>`;
    });
    h += `<footer class="sh-foot"><span>Blatt-Code: ${esc(meta.code)}</span><span>Seite 1</span></footer>`;
    return h;
  }

  const DICE = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`;

  AG.richHtml = richHtml;
  AG.sheetHtml = sheetHtml;
  AG.DICE_SVG = DICE;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
