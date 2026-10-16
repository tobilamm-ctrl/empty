// Bedienoberfläche: Bauplan links, Vorschau rechts, Word-Download.
(function (AG) {
  const $ = id => document.getElementById(id);
  const KLASSEN = ["5", "6", "7", "8", "9", "10"];
  const NIVEAU_LEVELS = { 1: [1, 1, 2, 2], 2: [1, 2, 3, 3], 3: [2, 3, 3, 3] };
  const STORE_KEY = "aufgaben-generator-v1";

  const state = {
    klasse: "7", zug: "M", thema: null, niveau: 2, parts: [],
    title: "", titleCustom: false, merke: true, fill: true, target: "word", work: 1, solmode: "steps",
    groupB: false, seed: randomSeed(), rerolls: {}, view: "A",
  };

  function randomSeed() { return 1000 + Math.floor(Math.random() * 9000); }
  function typesFor(k, z) { return AG.TYPES.filter(t => t.klasse === k && (t.zug === z || t.zug === "RM")); }
  function themesFor(k, z) {
    const map = new Map();
    for (const t of typesFor(k, z)) if (!map.has(t.lb)) map.set(t.lb, t.lbTitle);
    return [...map.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  }
  function defaultCount(type) { return type.cols === 1 ? 3 : type.cols === 2 ? 6 : 9; }

  // Thema gewählt -> Teile A–C (bzw. so viele Typen wie vorhanden, höchstens 4) vorbelegen
  function applyTheme() {
    const types = typesFor(state.klasse, state.zug).filter(t => t.lb === state.thema);
    if (!types.length) { state.parts = []; return; }
    const levels = NIVEAU_LEVELS[state.niveau];
    const n = Math.min(4, Math.max(3, types.length));
    state.parts = [];
    for (let i = 0; i < n; i++) {
      const type = types.length >= n ? types[i] : types[i % types.length];
      const lv = clampLevel(type, levels[i]);
      state.parts.push({ type: type.id, level: lv, count: defaultCount(type) });
    }
    // gleiche Typen mit gleichem Niveau vermeiden
    state.rerolls = {};
    if (!state.titleCustom) state.title = types[0].lbTitle;
  }
  function clampLevel(type, lv) {
    if (type.levels.includes(lv)) return lv;
    return type.levels.reduce((best, l) => Math.abs(l - lv) < Math.abs(best - lv) ? l : best, type.levels[0]);
  }
  function applyNiveau() {
    const levels = NIVEAU_LEVELS[state.niveau];
    state.parts.forEach((p, i) => { p.level = clampLevel(AG.typeById(p.type), levels[i]); });
    state.rerolls = {};
  }

  function config() {
    return { klasse: state.klasse, zug: state.zug, seed: state.seed, parts: state.parts, rerolls: state.rerolls, title: state.title };
  }
  function meta(cfg) {
    const first = state.parts[0] && AG.typeById(state.parts[0].type);
    const lbs = [...new Set(state.parts.map(p => AG.typeById(p.type).lbTitle))];
    return {
      klasse: state.klasse, zug: state.zug, title: state.title || "Arbeitsblatt",
      subject: lbs.length === 1 ? lbs[0] : "Gemischte Aufgaben",
      blattNr: state.seed, code: AG.encodeCode(cfg), merke: first ? first.merke : null,
    };
  }

  // ---------- Speichern ----------
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* privat/gesperrt */ }
  }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!s) return false;
      Object.assign(state, s);
      state.parts = state.parts.filter(p => AG.typeById(p.type));
      return state.parts.length > 0;
    } catch (e) { return false; }
  }

  // ---------- Bauplan zeichnen ----------
  function segButtons(el, items, current, onPick, disabledFn) {
    el.innerHTML = "";
    for (const [val, label] of items) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.setAttribute("aria-pressed", String(String(val) === String(current)));
      if (disabledFn && disabledFn(val)) { b.disabled = true; b.title = "Kommt in einem späteren Ausbauschritt"; }
      b.onclick = () => onPick(val);
      el.appendChild(b);
    }
  }
  function markSeg(el, attr, current) {
    el.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === String(current))));
  }

  function renderPlan() {
    segButtons($("klasse"), KLASSEN.map(k => [k, k]), state.klasse, k => {
      state.klasse = k; if (k === "5" || k === "6") state.zug = "R";
      state.thema = (themesFor(state.klasse, state.zug)[0] || [])[0]; state.titleCustom = false; applyTheme(); update();
    }, k => !AG.TYPES.some(t => t.klasse === k));
    const zugItems = Number(state.klasse) >= 7 ? [["R", "Regelklasse"], ["M", "M-Zug"]] : [["R", "alle"]];
    segButtons($("zug"), zugItems, state.zug, z => {
      state.zug = z; state.thema = (themesFor(state.klasse, state.zug)[0] || [])[0]; state.titleCustom = false; applyTheme(); update();
    }, z => typesFor(state.klasse, z).length === 0);

    const sel = $("thema");
    const themes = themesFor(state.klasse, state.zug);
    sel.innerHTML = themes.map(([lb, t]) => `<option value="${lb}">LB ${lb}  ${t}</option>`).join("") +
      `<option value="mix">Eigene Zusammenstellung</option>`;
    sel.value = state.thema || "mix";

    markSeg($("niveau"), "n", state.niveau);
    markSeg($("work"), "w", state.work);
    markSeg($("solmode"), "s", state.solmode);
    if (document.activeElement !== $("title")) $("title").value = state.title;
    $("merke").checked = state.merke;
    $("fill").checked = state.fill;
    markSeg($("target"), "t", state.target);
    $("fillRow").hidden = state.target !== "word";
    document.querySelector(".plan").classList.toggle("target-onenote", state.target === "onenote");
    $("groupB").checked = state.groupB;
    if (document.activeElement !== $("seed")) $("seed").value = state.seed;
    renderParts();
    renderView();
  }

  function typeOptions(current) {
    const byLb = new Map();
    for (const t of typesFor(state.klasse, state.zug)) {
      if (!byLb.has(t.lb)) byLb.set(t.lb, { title: t.lbTitle, types: [] });
      byLb.get(t.lb).types.push(t);
    }
    return [...byLb.entries()].sort((a, b) => a[0] - b[0]).map(([lb, g]) =>
      `<optgroup label="LB ${lb}  ${g.title}">${g.types.map(t => `<option value="${t.id}"${t.id === current ? " selected" : ""}>${t.title}</option>`).join("")}</optgroup>`).join("");
  }

  function renderParts() {
    const box = $("parts");
    box.innerHTML = "";
    state.parts.forEach((p, i) => {
      const type = AG.typeById(p.type);
      const el = document.createElement("div");
      el.className = "part"; el.id = "part-" + i;
      el.style.setProperty("--pc", `var(--part-${i})`);
      el.innerHTML = `<div class="part-tab">${String.fromCharCode(65 + i)}</div>
        <div class="part-body">
          <select aria-label="Aufgabentyp Teil ${String.fromCharCode(65 + i)}">${typeOptions(p.type)}</select>
          <div class="part-row">
            <span class="stars" role="group" aria-label="Niveau">${[1, 2, 3].map(l => `<button type="button" data-l="${l}" ${type.levels.includes(l) ? "" : "disabled"} aria-label="${l} Stern${l > 1 ? "e" : ""}" aria-pressed="${l === p.level}">${l <= p.level ? "★" : "☆"}</button>`).join("")}</span>
            <span class="stepper"><button type="button" data-d="-1" aria-label="Weniger Aufgaben">−</button><output aria-label="Anzahl">${p.count}</output><button type="button" data-d="1" aria-label="Mehr Aufgaben">+</button></span>
            <span class="mini">Aufgaben</span>
            ${state.parts.length > 1 ? `<button type="button" class="icon-btn" data-rm aria-label="Teil entfernen" title="Teil entfernen"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>` : ""}
          </div>
        </div>`;
      el.querySelector("select").onchange = e => {
        p.type = e.target.value; const t = AG.typeById(p.type);
        p.level = clampLevel(t, p.level); p.count = defaultCount(t); p.cols = undefined;
        state.thema = derivedTheme(); clearRerolls(i); update();
      };
      el.querySelectorAll(".stars button").forEach(b => b.onclick = () => { p.level = Number(b.dataset.l); clearRerolls(i); update(); });
      el.querySelectorAll(".stepper button").forEach(b => b.onclick = () => {
        p.count = Math.max(1, Math.min(type.cols === 1 ? 8 : 18, p.count + Number(b.dataset.d))); update();
      });
      const rm = el.querySelector("[data-rm]");
      if (rm) rm.onclick = () => { state.parts.splice(i, 1); state.rerolls = {}; state.thema = derivedTheme(); update(); };
      box.appendChild(el);
    });
    $("addPart").hidden = state.parts.length >= 4;
  }
  function derivedTheme() {
    const lbs = new Set(state.parts.map(p => AG.typeById(p.type).lb));
    return lbs.size === 1 ? [...lbs][0] : null;
  }
  function clearRerolls(pi) {
    for (const k of Object.keys(state.rerolls)) if (k.split(".")[1] === String(pi)) delete state.rerolls[k];
  }

  // ---------- Vorschau ----------
  let lastSheets = null;
  function renderView() {
    markSeg($("view"), "view", state.view);
    $("view").querySelector('[data-view="B"]').hidden = !state.groupB;
    if (!state.groupB && state.view === "B") state.view = "A";
    const sheetEl = $("sheet");
    if (!state.parts.length) { sheetEl.innerHTML = `<p>Wähle links ein Thema, um ein Blatt zu erzeugen.</p>`; return; }
    try {
      const cfg = config();
      const A = AG.generateSheet(cfg, "A");
      const B = state.groupB ? AG.generateSheet(cfg, "B") : null;
      lastSheets = { A, B, cfg };
      const m = meta(cfg);
      const showSheet = state.view === "B" ? B : A;
      const mode = state.view === "answers" ? state.solmode : "worksheet";
      const opts = { merke: state.merke, workLines: state.work, interactive: mode === "worksheet" };
      if (mode === "worksheet" && state.target === "word") opts.layout = layoutFor(showSheet, m);
      sheetEl.innerHTML = AG.sheetHtml(showSheet, m, mode, opts);
      $("code").value = m.code;
      $("tabs").innerHTML = showSheet.parts.map((p, i) => `<button type="button" style="--pc: var(--part-${i})" data-jump="${i}" title="Teil ${p.label}: ${p.title}">${p.label}</button>`).join("");
      const n = (B ? 2 : 1);
      $("dlInfo").textContent = `Enthält ${n === 2 ? "Gruppe A und B" : "das Arbeitsblatt"} und ${n === 2 ? "beide Lösungsblätter" : "das Lösungsblatt"} (${state.solmode === "steps" ? "mit Zwischenschritten" : "nur Ergebnisse"}).`;
    } catch (e) {
      sheetEl.innerHTML = `<div class="error-box">Das Blatt ließ sich nicht erzeugen: ${e.message}</div>`;
      console.error(e);
    }
  }

  // Seitenaufteilung: Blatt unsichtbar durchgehend setzen, ausmessen, Umbrüche berechnen
  function layoutFor(sheet, m) {
    const box = $("measure");
    box.innerHTML = AG.sheetHtml(sheet, m, "worksheet", { merke: state.merke, workLines: state.work, measure: true });
    const lay = AG.computeLayout(box.firstElementChild, state.fill);
    box.innerHTML = "";
    return lay;
  }

  function update() { renderPlan(); save(); }

  // ---------- Ereignisse ----------
  function wire() {
    $("thema").onchange = e => {
      if (e.target.value === "mix") { state.thema = null; update(); return; }
      state.thema = e.target.value; state.titleCustom = false; applyTheme(); update();
    };
    $("niveau").onclick = e => { const b = e.target.closest("button"); if (!b) return; state.niveau = Number(b.dataset.n); applyNiveau(); update(); };
    $("work").onclick = e => { const b = e.target.closest("button"); if (!b) return; state.work = Number(b.dataset.w); update(); };
    $("solmode").onclick = e => { const b = e.target.closest("button"); if (!b) return; state.solmode = b.dataset.s; update(); };
    $("view").onclick = e => { const b = e.target.closest("button"); if (!b) return; state.view = b.dataset.view; update(); };
    $("title").oninput = e => { state.title = e.target.value; state.titleCustom = true; renderView(); save(); };
    $("merke").onchange = e => { state.merke = e.target.checked; update(); };
    $("fill").onchange = e => { state.fill = e.target.checked; update(); };
    $("target").onclick = e => { const b = e.target.closest("button"); if (!b) return; state.target = b.dataset.t; update(); };
    $("copyOneNote").onclick = copyOneNote;
    $("copyOneNoteImg").onclick = copyOneNoteImage;
    $("groupB").onchange = e => { state.groupB = e.target.checked; if (state.groupB) state.view = "B"; update(); };
    $("seed").onchange = e => {
      const v = Math.max(1, Math.min(99999, Math.round(Number(e.target.value) || 1)));
      state.seed = v; state.rerolls = {}; update();
    };
    $("newSeed").onclick = () => { state.seed = randomSeed(); state.rerolls = {}; update(); };
    $("addPart").onclick = () => {
      const last = state.parts[state.parts.length - 1];
      const t = last ? AG.typeById(last.type) : typesFor(state.klasse, state.zug)[0];
      state.parts.push({ type: t.id, level: clampLevel(t, Math.min(3, (last ? last.level : 1) + 1)), count: defaultCount(t) });
      update();
      const el = $("part-" + (state.parts.length - 1)); if (el) el.scrollIntoView({ block: "nearest" });
    };
    $("loadCode").onclick = () => {
      const msg = $("codeMsg");
      try {
        const c = AG.decodeCode($("code").value);
        Object.assign(state, { klasse: c.klasse, zug: c.zug, seed: c.seed, parts: c.parts, rerolls: c.rerolls });
        state.thema = derivedTheme();
        msg.className = "msg ok"; msg.textContent = "Blatt wiederhergestellt.";
        update();
      } catch (e) { msg.className = "msg err"; msg.textContent = e.message; }
    };
    $("sheet").onclick = e => {
      const b = e.target.closest("[data-reroll]");
      if (!b) return;
      const g = state.view === "B" ? "B" : "A";
      const key = g + "." + b.dataset.reroll;
      state.rerolls[key] = (state.rerolls[key] || 0) + 1;
      update();
      const nb = $("sheet").querySelector(`[data-reroll="${b.dataset.reroll}"]`);
      if (nb) { nb.classList.add("spin"); nb.focus({ preventScroll: true }); }
    };
    $("tabs").onclick = e => {
      const b = e.target.closest("[data-jump]");
      if (!b) return;
      const sec = $("sheet").querySelector(`[data-part="${b.dataset.jump}"]`);
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      const part = $("part-" + b.dataset.jump);
      if (part) { part.scrollIntoView({ block: "nearest" }); part.classList.remove("flash"); void part.offsetWidth; part.classList.add("flash"); }
    };
    $("download").onclick = download;
    // Teil im Blatt <-> Karte im Bauplan
    $("sheet").addEventListener("mouseover", e => {
      const sec = e.target.closest("[data-part]");
      document.querySelectorAll(".part.hot").forEach(p => p.classList.remove("hot"));
      if (sec) { const card = $("part-" + sec.dataset.part); if (card) card.classList.add("hot"); }
    });
    $("sheet").addEventListener("mouseleave", () => document.querySelectorAll(".part.hot").forEach(p => p.classList.remove("hot")));
  }

  async function copyOneNote() {
    const msg = $("copyMsg");
    if (!lastSheets || !AG.oneNoteHtml) { msg.className = "msg err"; msg.textContent = "OneNote-Export ist in dieser Version nicht verfügbar."; return; }
    const { A, B, cfg } = lastSheets;
    const sheet = state.view === "B" && B ? B : A;
    const mode = state.view === "answers" ? state.solmode : "worksheet";
    const html = AG.oneNoteHtml(sheet, meta(cfg), mode, { merke: state.merke, workLines: state.work });
    const ok = await AG.copyForOneNote(html);
    const what = mode === "worksheet" ? `Arbeitsblatt (Gruppe ${sheet.group})` : `Lösungsblatt (Gruppe ${sheet.group})`;
    msg.className = ok ? "msg ok" : "msg err";
    msg.textContent = ok ? `${what} kopiert. In OneNote eine leere Seite öffnen und Strg+V drücken.` : "Kopieren hat nicht geklappt. Bitte den Browser Chrome oder Edge verwenden.";
  }

  // Blatt als Bild („Ausdruck“) für OneNote
  async function copyOneNoteImage() {
    const msg = $("copyMsg");
    if (!lastSheets || !AG.sheetsToPng) { msg.className = "msg err"; msg.textContent = "Bild-Export ist in dieser Version nicht verfügbar."; return; }
    const { A, B, cfg } = lastSheets;
    const sheet = state.view === "B" && B ? B : A;
    const mode = state.view === "answers" ? state.solmode : "worksheet";
    const m = meta(cfg);
    const opts = { merke: state.merke, workLines: state.work, interactive: false };
    if (mode === "worksheet" && state.target === "word") opts.layout = layoutFor(sheet, m);
    const what = mode === "worksheet" ? `Arbeitsblatt (Gruppe ${sheet.group})` : `Lösungsblatt (Gruppe ${sheet.group})`;
    msg.className = "msg"; msg.textContent = "Bild wird erzeugt …";
    try {
      const blob = await AG.sheetsToPng(AG.sheetHtml(sheet, m, mode, opts), { scale: 2 });
      if (await AG.copyPng(blob)) {
        msg.className = "msg ok"; msg.textContent = `${what} als Bild kopiert. In OneNote Strg+V drücken.`;
      } else {
        AG.downloadPng(blob, `${(state.title || "Arbeitsblatt").replace(/[^\wäöüÄÖÜß\- ]+/g, "").trim().replace(/\s+/g, "_")}_Blatt-${state.seed}.png`);
        msg.className = "msg err"; msg.textContent = "Kopieren als Bild hat nicht geklappt. Das Bild wurde stattdessen heruntergeladen – in OneNote über Einfügen > Bild einfügen.";
      }
    } catch (e) {
      msg.className = "msg err"; msg.textContent = "Das Bild ließ sich nicht erzeugen: " + e.message;
    }
  }

  async function download() {
    if (!lastSheets) return;
    const { A, B, cfg } = lastSheets;
    const m = meta(cfg);
    const pages = [{ sheet: A, mode: "worksheet", layout: layoutFor(A, m) }];
    if (B) pages.push({ sheet: B, mode: "worksheet", layout: layoutFor(B, m) });
    pages.push({ sheet: A, mode: state.solmode });
    if (B) pages.push({ sheet: B, mode: state.solmode });
    const bytes = await AG.buildDocxAsync(pages, m, { merke: state.merke, workLines: state.work });
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const name = (state.title || "Arbeitsblatt").replace(/[^\wäöüÄÖÜß\- ]+/g, "").trim().replace(/\s+/g, "_") + `_Blatt-${state.seed}.docx`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // ---------- Start ----------
  if (!restore()) {
    state.thema = (themesFor(state.klasse, state.zug)[0] || [])[0];
    applyTheme();
  }
  wire();
  update();
})(AG);
