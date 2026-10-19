// Übungsmodus für Schüler: eine Aufgabe nach der anderen, Lösung schrittweise, Selbstkontrolle oder Eingabe.
(function (AG) {
  const $ = id => document.getElementById(id);
  const STORE = "mathe-ueben-v1";
  const KLASSEN = ["5", "6", "7", "8", "9", "10"];

  const setup = { sortBy: "klasse", klasse: "7", zug: "M", topics: [], level: 2, adapt: true, mode: "s" };
  let run = null;   // laufende Übung
  let cur = null;   // aktuelle Aufgabe

  function typesFor(k, z) { return AG.TYPES.filter(t => t.klasse === k && (t.zug === z || t.zug === "RM")); }
  function typesAllGrades(z) { return AG.TYPES.filter(t => t.zug === z || t.zug === "RM" || (z === "R" && Number(t.klasse) <= 6)); }
  function groupKey(t) { return setup.sortBy === "thema" ? AG.topicOf(t) : t.lb; }
  function lbGroups() {
    const map = new Map();
    if (setup.sortBy === "thema") {
      const types = typesAllGrades(setup.zug).slice().sort((a, b) => Number(a.klasse) - Number(b.klasse));
      for (const tp of AG.TOPICS) {
        const ts = types.filter(t => AG.topicOf(t) === tp.id);
        if (ts.length) map.set(tp.id, { title: tp.title, types: ts });
      }
      return [...map.entries()];
    }
    for (const t of typesFor(setup.klasse, setup.zug)) {
      if (!map.has(t.lb)) map.set(t.lb, { title: t.lbTitle, types: [] });
      map.get(t.lb).types.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }

  // ---------- Übungs-Code der Lehrkraft: U1-7M-2ea-xxxx_yyyy ----------
  function encodePractice() {
    return ["U1", setup.klasse + setup.zug, setup.level + setup.mode + (setup.adapt ? "a" : ""), setup.topics.map(AG.typeShort).join("_")].join("-");
  }
  function decodePractice(code) {
    const m = /^U1-(\d+)([A-Z]+)-([0-3])([se])(a?)-([0-9a-z_]+)$/i.exec(code.trim());
    if (!m) throw new Error("Dieser Code passt nicht. Prüfe, ob du ihn richtig abgetippt hast.");
    const topics = m[6].split("_").map(s => AG.TYPES.find(t => AG.typeShort(t.id) === s.toLowerCase())).filter(Boolean).map(t => t.id);
    if (!topics.length) throw new Error("Die Themen aus dem Code gibt es in dieser Version nicht.");
    return { klasse: m[1], zug: m[2].toUpperCase(), level: Number(m[3]), mode: m[4], adapt: !!m[5], topics };
  }

  function save() { try { localStorage.setItem(STORE, JSON.stringify(setup)); } catch (e) { /* egal */ } }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s) { Object.assign(setup, s); setup.topics = setup.topics.filter(id => AG.typeById(id)); }
    } catch (e) { /* egal */ }
  }

  // ---------- Auswahl ----------
  function seg(el, items, current, onPick, disabled) {
    el.innerHTML = "";
    for (const [v, label] of items) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.setAttribute("aria-pressed", String(String(v) === String(current)));
      if (disabled && disabled(v)) { b.disabled = true; b.title = "Kommt später"; }
      b.onclick = () => onPick(v);
      el.appendChild(b);
    }
  }
  function renderSetup() {
    seg($("sortBy"), [["klasse", "Jahrgangsstufe"], ["thema", "Thema (alle Klassen)"]], setup.sortBy, s => { setup.sortBy = s; renderSetup(); });
    $("klasse").hidden = setup.sortBy === "thema";
    $("klasseH").textContent = setup.sortBy === "thema" ? "Zug" : "Klasse";
    seg($("klasse"), KLASSEN.map(k => [k, k]), setup.klasse, k => { setup.klasse = k; if (k === "5" || k === "6") setup.zug = "R"; if (k === "10") setup.zug = "M"; setup.topics = []; renderSetup(); },
      k => !AG.TYPES.some(t => t.klasse === k));
    // Klassen 5 und 6: kein M-Zug
    const zugItems = setup.sortBy !== "thema" && setup.klasse === "10" ? [["M", "M-Zug"]]   // Klasse 10 gibt es nur im M-Zug
      : setup.sortBy === "thema" || Number(setup.klasse) >= 7 ? [["R", "Regelklasse"], ["M", "M-Zug"]] : [["R", "alle"]];
    seg($("zug"), zugItems, setup.zug, z => {
      setup.zug = z;
      const ok = new Set((setup.sortBy === "thema" ? typesAllGrades(z) : typesFor(setup.klasse, z)).map(t => t.id));
      setup.topics = setup.topics.filter(id => ok.has(id));
      renderSetup();
    }, z => (setup.sortBy === "thema" ? typesAllGrades(z) : typesFor(setup.klasse, z)).length === 0);
    const box = $("topics");
    box.innerHTML = "";
    lbGroups().forEach(([lb, g], gi) => {
      const div = document.createElement("div");
      div.className = "lb"; div.style.setProperty("--lbc", `var(--part-${gi % 8})`);
      const allOn = g.types.every(t => setup.topics.includes(t.id));
      div.innerHTML = `<div class="lb-title">${g.title} <button type="button" class="link select-all">${allOn ? "keine" : "alle"}</button></div><div class="topics"></div>`;
      div.querySelector(".select-all").onclick = () => {
        setup.topics = setup.topics.filter(id => !g.types.some(t => t.id === id));
        if (!allOn) setup.topics.push(...g.types.map(t => t.id));
        renderSetup();
      };
      const tbox = div.querySelector(".topics");
      for (const t of g.types) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "topic"; b.textContent = t.title + (setup.sortBy === "thema" ? " · " + AG.gradeLabel(t, setup.zug) : "");
        b.setAttribute("aria-pressed", String(setup.topics.includes(t.id)));
        b.onclick = () => {
          const i = setup.topics.indexOf(t.id);
          if (i >= 0) setup.topics.splice(i, 1); else setup.topics.push(t.id);
          renderSetup();
        };
        tbox.appendChild(b);
      }
      box.appendChild(div);
    });
    $("level").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(Number(b.dataset.l) === setup.level)));
    $("mode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === setup.mode)));
    $("adapt").checked = setup.adapt;
    $("modeHint").textContent = setup.mode === "s"
      ? "Du rechnest im Heft, schaust dir die Lösung an und sagst ehrlich, ob du es richtig hattest."
      : "Du tippst dein Ergebnis ein und bekommst sofort Rückmeldung. Aufgaben ohne eindeutiges Ergebnis kontrollierst du selbst.";
    $("start").disabled = setup.topics.length === 0;
    $("startMsg").textContent = setup.topics.length ? "" : "Wähle mindestens ein Thema.";
    if (!$("codeBox").hidden) $("codeOut").textContent = encodePractice();
    save();
  }

  // ---------- Üben ----------
  function startRun() {
    run = { results: [], perType: {}, levelOf: {}, streak: 0, lastKeys: [] };
    for (const id of setup.topics) {
      const t = AG.typeById(id);
      run.levelOf[id] = setup.level === 0 ? null : clamp(t, setup.level);
    }
    show("practice");
    nextTask();
  }
  function clamp(type, lv) {
    if (type.levels.includes(lv)) return lv;
    return type.levels.reduce((b, l) => Math.abs(l - lv) < Math.abs(b - lv) ? l : b, type.levels[0]);
  }

  function nextTask() {
    $("levelToast").hidden = true;
    let type, level, task;
    for (let i = 0; i < 30; i++) {
      type = AG.typeById(setup.topics[Math.floor(Math.random() * setup.topics.length)]);
      level = run.levelOf[type.id] || type.levels[Math.floor(Math.random() * type.levels.length)];
      task = AG.generateTask(type, level, "u" + Date.now() + "|" + Math.random(), { zug: setup.zug });
      const key = AG.plain(task.q);
      if (!run.lastKeys.includes(key)) { run.lastKeys = [key, ...run.lastKeys].slice(0, 20); break; }
    }
    const kind = setup.mode === "e" && AG.answerKind ? AG.answerKind(task) : null;
    cur = { type, level, task, kind, step: 0, done: false, counted: false };
    renderTask();
  }

  function renderTask() {
    const { type, level, task, kind } = cur;
    const gi = lbGroups().findIndex(([lb]) => lb === groupKey(type));
    $("practice").style.setProperty("--pc", `var(--part-${Math.max(0, gi) % 8})`);
    $("tTopic").textContent = type.title;
    $("tStars").textContent = AG.stars(level);
    $("tNo").textContent = `Aufgabe ${run.results.length + 1}`;
    const ins = typeof type.instruction === "string" ? type.instruction : (type.instruction[level] || type.instruction[1]);
    $("tIns").textContent = ins;
    let q = AG.richHtml(task.q);
    if (task.table) q += `<div class="table-wrap">${tableHtml(task.table, false)}</div>`;
    if (task.fig) q += AG.figHtml(task.fig);
    $("tQ").innerHTML = q;
    addZoom($("tQ"));

    $("answerRow").hidden = !kind;
    $("inputHint").hidden = !kind;
    $("answerIn").value = ""; $("answerIn").className = "";
    $("feedback").textContent = setup.mode === "e" && !kind ? "Diese Aufgabe kontrollierst du selbst mit der Lösung." : "";
    $("feedback").className = "feedback";
    $("merke").hidden = true;
    $("merke").innerHTML = type.merke ? `<b>Merke</b>${AG.richHtml(AG.merkeRich(type.merke))}` : "Für diese Aufgabe gibt es keinen Tipp.";
    $("tip").hidden = false;
    $("solution").hidden = true; $("solution").innerHTML = "";
    $("showStep").textContent = "Lösung zeigen"; $("showStep").hidden = false; $("showAll").hidden = true;
    $("selfcheck").hidden = true;
    $("selfcheck").querySelectorAll("button").forEach(b => b.removeAttribute("aria-pressed"));
    $("nextHint").textContent = "";
    updateScore();
    if (kind) setTimeout(() => $("answerIn").focus(), 30);
  }

  function tableHtml(tbl, sol) {
    return `<table class="vt">${tbl.rows.map((r, ri) => `<tr>${r.map((c, ci) => `<${ci ? "td" : "th"}${sol && ri && ci ? ' class="red"' : ""}>${AG.richHtml(c)}</${ci ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`;
  }

  // Lupe: Zeichnungen groß anzeigen
  const ZOOM_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="cursor:inherit"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  function addZoom(box) {
    box.querySelectorAll(".fig").forEach(f => {
      if (f.querySelector(".zoom")) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "zoom"; b.innerHTML = ZOOM_ICON + "Vergrößern";
      b.title = "Zeichnung vergrößern"; b.setAttribute("aria-label", "Zeichnung vergrößern");
      b.onclick = () => openZoom(f);
      f.querySelector("svg").addEventListener("click", () => openZoom(f));
      f.appendChild(b);
    });
  }
  function openZoom(fig) {
    const svg = fig.querySelector("svg").cloneNode(true);
    const box = $("lightbox");
    box.querySelector(".lb-fig").innerHTML = "";
    box.querySelector(".lb-fig").appendChild(svg);
    box.hidden = false;
    box.querySelector(".lb-close").focus();
  }
  function closeZoom() { $("lightbox").hidden = true; }

  // Lösung schrittweise aufdecken
  function reveal(all) {
    const steps = cur.task.steps || [];
    const sol = $("solution");
    sol.hidden = false;
    const target = all ? steps.length + 1 : cur.step + 1;
    while (cur.step < target) {
      if (cur.step < steps.length) sol.insertAdjacentHTML("beforeend", `<div class="step">${AG.richHtml(steps[cur.step])}</div>`);
      else {
        let res = `<div class="step result">Ergebnis: ${AG.richHtml(cur.task.a)}</div>`;
        if (cur.task.aTable) res = `<div class="step table-wrap">${tableHtml(cur.task.aTable, true)}</div>` + res;
        if (cur.task.aFig) res = `<div class="step">${AG.figHtml(cur.task.aFig)}</div>` + res;
        sol.insertAdjacentHTML("beforeend", res);
      }
      cur.step++;
    }
    addZoom(sol);
    const finished = cur.step > steps.length;
    // Fortschritt anzeigen: Schritte plus Ergebniszeile
    const total = steps.length + 1;
    $("showStep").textContent = `Nächster Schritt (${cur.step} von ${total} gezeigt)`;
    $("showStep").hidden = finished;
    $("showAll").hidden = finished || steps.length < 2;
    if (finished && !cur.counted) {
      if (setup.mode === "s" || !cur.kind) $("selfcheck").hidden = false;
      else if (!cur.counted) { record(false, true); $("nextHint").textContent = "Lösung angesehen – zählt als nicht gelöst."; }
    }
  }

  function check() {
    if (!cur.kind || !AG.checkAnswer) return;
    const res = AG.checkAnswer(cur.task, $("answerIn").value);
    const fb = $("feedback"), inp = $("answerIn");
    if (!res || res.reason === "Eingabe nicht lesbar") {
      fb.className = "feedback err"; fb.textContent = "Das kann ich nicht lesen. Beispiele: 12,5 oder 3/4 oder x = 7"; return;
    }
    if (res.ok) {
      inp.className = "right"; fb.className = "feedback ok"; fb.textContent = "Richtig!";
      if (!cur.counted) record(true);
    } else {
      inp.className = "wrong"; fb.className = "feedback err";
      fb.textContent = (res.reason ? res.reason + ". " : "") + "Noch nicht richtig – versuch es noch einmal oder schau dir die Lösung an.";
      if (!cur.counted) record(false);
    }
  }

  function record(ok, viaSolution) {
    cur.counted = true;
    const id = cur.type.id;
    run.results.push({ id, level: cur.level, ok });
    const pt = run.perType[id] || (run.perType[id] = { ok: 0, all: 0, streakOk: 0, streakBad: 0 });
    pt.all++; if (ok) { pt.ok++; pt.streakOk++; pt.streakBad = 0; run.streak++; } else { pt.streakBad++; pt.streakOk = 0; run.streak = 0; }
    if (setup.adapt) adapt(pt);
    updateScore();
    if (!viaSolution) $("nextHint").textContent = ok ? "Weiter so!" : "";
  }

  function adapt(pt) {
    const t = cur.type;
    const lv = run.levelOf[t.id] || cur.level;
    let to = null;
    if (pt.streakOk >= 3 && t.levels.includes(lv + 1)) to = lv + 1;
    if (pt.streakBad >= 2 && t.levels.includes(lv - 1)) to = lv - 1;
    if (to === null) return;
    run.levelOf[t.id] = to; pt.streakOk = 0; pt.streakBad = 0;
    const toast = $("levelToast");
    toast.innerHTML = to > lv
      ? `Stark! Bei „${t.title}“ geht es jetzt mit ${AG.stars(to)} weiter.`
      : `Bei „${t.title}“ machen wir mit ${AG.stars(to)} weiter, bis es sicher klappt.`;
    toast.hidden = false;
  }

  function updateScore() {
    $("score").hidden = !run;
    if (!run) return;
    const ok = run.results.filter(r => r.ok).length;
    $("scoreOk").textContent = `${ok} richtig`;
    $("scoreAll").textContent = `${run.results.length} ${run.results.length === 1 ? "Aufgabe" : "Aufgaben"}`;
    $("streak").hidden = run.streak < 3;
    $("streak").textContent = `${run.streak} in Folge`;
  }

  // ---------- Auswertung ----------
  function finish() {
    if (!run) return;
    const ok = run.results.filter(r => r.ok).length, all = run.results.length;
    $("sumBig").textContent = all ? `${ok} von ${all} richtig` : "Noch keine Aufgabe gelöst";
    $("sumList").innerHTML = Object.entries(run.perType).map(([id, p]) => {
      const t = AG.typeById(id);
      return `<div class="result-row"><span>${t.title}</span><b>${p.ok} / ${p.all}</b><div class="bar"><span style="width:${Math.round(100 * p.ok / p.all)}%"></span></div></div>`;
    }).join("");
    const date = new Date().toLocaleDateString("de-DE");
    const proof = proofCode(date, ok, all, setup.topics);
    $("proof").innerHTML = all ? `Prüfcode für deine Lehrkraft: <b>${proof}</b>  (${date}, ${ok}/${all})` : "";
    show("summary");
  }

  // Prüfcode hängt von Datum, Ergebnis und gewählten Themen ab
  function proofCode(date, ok, all, topics) {
    return AG.hash(JSON.stringify(["U1", date, ok, all, topics.map(AG.typeShort).sort()])).toString(36).toUpperCase().padStart(6, "0").slice(-6);
  }

  function show(which) {
    $("setup").hidden = which !== "setup";
    $("practice").hidden = which !== "practice";
    $("summary").hidden = which !== "summary";
    $("levelToast").hidden = true;
    if (which === "setup") { run = null; updateScore(); renderSetup(); }
    window.scrollTo({ top: 0 });
  }

  // ---------- Ereignisse ----------
  $("level").onclick = e => { const b = e.target.closest("button"); if (b) { setup.level = Number(b.dataset.l); renderSetup(); } };
  $("mode").onclick = e => { const b = e.target.closest("button"); if (b) { setup.mode = b.dataset.m; renderSetup(); } };
  $("adapt").onchange = e => { setup.adapt = e.target.checked; renderSetup(); };
  $("start").onclick = startRun;
  $("codeLoad").onclick = () => {
    const msg = $("codeMsg");
    try {
      Object.assign(setup, decodePractice($("codeIn").value));
      msg.className = "msg ok"; msg.textContent = `Übernommen: ${setup.topics.length} ${setup.topics.length === 1 ? "Thema" : "Themen"}. Tippe auf „Los geht's“.`;
      renderSetup();
    } catch (e) { msg.className = "msg err"; msg.textContent = e.message; }
  };
  $("codeIn").onkeydown = e => { if (e.key === "Enter") $("codeLoad").click(); };
  $("makeCode").onclick = () => { $("codeBox").hidden = !$("codeBox").hidden; renderSetup(); };
  $("pcCheck").onclick = () => {
    const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec($("pcRes").value);
    const msg = $("pcMsg");
    if (!m) { msg.className = "msg err"; msg.textContent = "Ergebnis bitte als richtig/gesamt eingeben, z. B. 8/10."; return; }
    const want = proofCode($("pcDate").value.trim(), Number(m[1]), Number(m[2]), setup.topics);
    const ok = want === $("pcCode").value.trim().toUpperCase();
    msg.className = ok ? "msg ok" : "msg err";
    msg.textContent = ok ? "Der Prüfcode passt zu Datum, Ergebnis und Auswahl." : "Der Prüfcode passt nicht. Stimmen Datum, Ergebnis und die eingestellte Auswahl (Code der Klasse oben übernehmen)?";
  };
  $("tip").onclick = () => { $("merke").hidden = !$("merke").hidden; };
  $("showStep").onclick = () => reveal(false);
  $("showAll").onclick = () => reveal(true);
  $("check").onclick = check;
  $("answerIn").onkeydown = e => { if (e.key === "Enter") check(); };
  $("yes").onclick = () => { if (!cur.counted) record(true); $("yes").setAttribute("aria-pressed", "true"); };
  $("no").onclick = () => { if (!cur.counted) record(false); $("no").setAttribute("aria-pressed", "true"); };
  $("next").onclick = nextTask;
  $("lightbox").onclick = e => { if (e.target.closest(".lb-close") || !e.target.closest(".lb-fig")) closeZoom(); };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("lightbox").hidden) closeZoom(); });
  $("finish").onclick = finish;
  $("again").onclick = () => { show("practice"); nextTask(); };
  $("newSel").onclick = () => show("setup");

  restore();
  if (!setup.topics.length) setup.topics = typesFor(setup.klasse, setup.zug).filter(t => t.lb === "1").map(t => t.id);
  show("setup");
})(AG);
