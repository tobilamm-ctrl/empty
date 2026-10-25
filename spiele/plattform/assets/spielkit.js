/* Spielkit – gemeinsames Gerüst für die Spiele der Plattform „Spieleabend“.
   Übernimmt alles, was jedes Spiel braucht: Spielart wählen (allein / an einem Gerät / online),
   Spieler und Computer-Gegner, Online-Räume mit Wartebereich, Bildschirm zum Weitergeben des
   Geräts, Speichern auf dem Gerät. Das Spiel selbst liefert Regeln und Darstellung.
   Anleitung: README.md, Abschnitt „Ein neues Spiel bauen“. */
(function () {
  "use strict";
  const P = window.PLATFORM || null;
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const rnd = n => Math.floor(Math.random() * n);
  const BOT_NAMES = ["Ada", "Kurt", "Mila", "Ole", "Pia", "Rudi"];

  function create(cfg) {
    cfg = Object.assign({
      version: 1,          // bei inkompatiblen Änderungen am Spielstand erhöhen
      minPlayers: 2,       // für „an einem Gerät“ und online
      maxPlayers: 6,
      bots: true,          // gibt es Computer-Gegner?
      defaultBots: 2,
      solo: null,          // { label, small } wenn es eine Solo-Variante gibt
      botNames: BOT_NAMES,
      setup: null,         // { html, init(root, kit), sync(root, mode), read(root, mode) }
      privateHands: false, // true: verdeckte Infos (Karten, Schiffe) – Weitergeben-Bildschirm deckt alles ab
      pollMs: 1500,
    }, cfg);

    let S = null;
    const ui = { room: null, busy: false, banner: "", lastHuman: 0, ackHuman: null, seen: {}, prevLog: null, toastT: 0 };
    const suffix = P ? "-" + P.user : "";
    const store = {
      get(k) { try { return localStorage.getItem(`${cfg.id}-${k}${suffix}`); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(`${cfg.id}-${k}${suffix}`, v); } catch (e) { /* privat/gesperrt */ } },
    };
    const stateKey = "spiel-v" + cfg.version;
    const q = sel => document.querySelector(sel);
    const setS = s => { S = s; if (cfg.onState) cfg.onState(s); };

    // ---------- Neuigkeiten: was die anderen (Mitspieler, Computer) gemacht haben ----------
    // Der Verlauf S.log hat die neuesten Einträge vorn. Gemerkt werden die ersten Einträge, die jemand
    // zuletzt gesehen hat; neu ist alles, was davor dazugekommen ist.
    const SNAP = 6;
    const snap = () => S.log.slice(0, SNAP);
    function newSince(old) {
      if (!old) return [];
      if (!old.length) return S.log.slice(0, 12);
      for (let k = 0; k < S.log.length; k++) {
        const m = Math.min(old.length, S.log.length - k);
        let ok = true;
        for (let j = 0; j < m && ok; j++) ok = S.log[k + j] === old[j];
        if (ok) return S.log.slice(0, k);
      }
      return S.log.slice(0, 12);   // nicht gefunden (neues Spiel): die letzten Einträge zeigen
    }
    // Nach einer eigenen Aktion: alles, was sie in den Verlauf geschrieben hat, gilt als gesehen. Was danach
    // die Computer-Gegner (im selben Schritt) gemacht haben, bleibt neu. Ihr Teil beginnt mit dem ersten
    // Eintrag, der mit dem Namen eines Computers anfängt.
    function markOwn(before, mi) {
      const added = newSince(before).reverse();      // in zeitlicher Reihenfolge
      const bots = S.players.filter(p => p.ai).map(p => `<b>${esc(p.name)}</b>`);
      let j = added.findIndex(h => bots.some(tag => h.startsWith(tag)));
      if (j < 0) j = added.length;
      const after = S.log.slice(added.length - j, added.length - j + SNAP);
      const key = viewerKey(mi);
      if (key) ui.seen[key] = after;
      ui.prevLog = after;
      saveSeen();
    }
    const viewerKey = mi => (S.players[mi] ? S.players[mi].id : null);
    const seenScope = () => (S.mode === "online" ? "raum-" + (ui.room ? ui.room.id : "") : "lokal");
    function saveSeen() { store.set("gesehen", JSON.stringify({ scope: seenScope(), seen: ui.seen })); }
    function loadSeen() {
      try { const d = JSON.parse(store.get("gesehen")); ui.seen = d && d.scope === seenScope() ? d.seen || {} : {}; } catch (e) { ui.seen = {}; }
    }
    // Bei einem neuen Spiel hat jeder Mensch den Anfang gesehen
    function resetSeen() {
      ui.seen = {};
      S.players.forEach(p => { if (!p.ai) ui.seen[p.id] = snap(); });
      ui.prevLog = snap();
      saveSeen();
    }
    const recapList = (list, max) => {
      const shown = list.slice(0, max).reverse();
      return `${list.length > max ? `<li class="sk-muted">… und ${list.length - max} frühere</li>` : ""}${shown.map(h => `<li>${h}</li>`).join("")}`;
    };
    function renderNews(mi) {
      if (!S.log) return;
      const key = viewerKey(mi);
      if (key && !ui.seen[key]) { ui.seen[key] = snap(); saveSeen(); }
      // Kasten „Seit deinem letzten Zug“
      const box = q("[data-sk-recap]");
      const since = key && S.phase !== "lobby" ? newSince(ui.seen[key]) : [];
      if (box) {
        box.hidden = !since.length;
        if (since.length) box.innerHTML = `<div class="sk-label">Seit deinem letzten Zug</div><ol class="sk-news">${recapList(since, 5)}</ol>`;
      }
      // kurzer Hinweis unten, wenn gerade etwas von anderen dazugekommen ist
      const fresh = ui.prevLog ? newSince(ui.prevLog) : [];
      ui.prevLog = snap();
      const toast = q("#sk-toast");
      // nur nötig, wenn der Kasten gerade nicht im Bild ist
      const r = box && !box.hidden ? box.getBoundingClientRect() : null;
      const boxSeen = r && r.bottom > 0 && r.top < window.innerHeight - 40;
      if (fresh.length && !boxSeen && S.phase !== "lobby" && q("#sk-dlg").hidden) {
        toast.querySelector("ol").innerHTML = recapList(fresh, 3);
        toast.hidden = false;
        clearTimeout(ui.toastT);
        ui.toastT = setTimeout(() => { toast.hidden = true; }, 3500 + 1200 * Math.min(fresh.length, 3));
      }
      return since;
    }

    const kit = {
      platform: P, esc, rnd, store, error: "",
      get S() { return S; },
      online: () => S.mode === "online",
      solo: () => S.mode === "solo",
      inLobby: () => S.phase === "lobby",
      isHost: () => S.mode === "online" && !!P && S.host === P.user,
      roomId: () => (ui.room ? ui.room.id : null),
      humans: () => S.players.map((p, i) => i).filter(i => !S.players[i].ai),
      hotSeat: () => S.mode === "local" && kit.humans().length > 1,
      addLog(html) { S.log.unshift(html); S.log = S.log.slice(0, 80); },
      // Wer bedient gerade das Gerät? Online: das eigene Konto (−1 = Zuschauer). Lokal: der erste
      // Mensch, den das Spiel über whoActs() als handelnd meldet, sonst der zuletzt aktive.
      me() {
        if (S.mode === "online") return S.players.findIndex(p => !p.ai && p.id === P.user);
        if (S.mode === "solo") return 0;
        const now = (cfg.whoActs ? cfg.whoActs(S) : []).filter(i => S.players[i] && !S.players[i].ai);
        if (now.length) return now[0];
        const hs = kit.humans();
        return hs.includes(ui.lastHuman) ? ui.lastHuman : hs[0];
      },
      act, render, openSetup, rematch, leave, start, newPlayer: r => cfg.newPlayer(r),
    };

    // ---------- Spielstand anlegen ----------
    function build(mode, roster, options, rematch) {
      const s = cfg.newState({ mode, roster, options, rematch: !!rematch });
      s.v = cfg.version; s.mode = mode; s.options = options; s.host = P ? P.user : null;
      s.log = s.log || [];
      if (mode === "online" && !rematch) s.phase = "lobby";
      return s;
    }
    function rosterFrom(humans, bots) {
      const names = humans.map((n, k) => (n || "").trim() || (humans.length === 1 ? (P ? P.name : "Du") : `Spieler ${k + 1}`));
      const taken = new Set(names);
      const botNames = cfg.botNames.filter(n => !taken.has(n)).concat(cfg.botNames);
      return names.map((n, k) => ({ id: "h" + k, name: n, ai: false }))
        .concat(Array.from({ length: bots }, (_, k) => ({ id: "bot" + k, name: botNames[k], ai: true })));
    }
    function newLocalGame(mode, humans, bots, options) {
      const roster = rosterFrom(mode === "solo" ? humans.slice(0, 1) : humans, mode === "local" ? bots : 0);
      const s = build(mode, roster, options);
      const nh = roster.filter(r => !r.ai).length, nb = roster.length - nh;
      const parts = [];
      if (nh > 1) parts.push(`${nh} Spieler an diesem Gerät`);
      if (nb) parts.push(`${nb} Computer-Gegner`);
      s.log.unshift(mode === "solo" ? "Neues Solo-Spiel." : `Neues Spiel: ${parts.join(" und ")}.`);
      ui.ackHuman = null; ui.lastHuman = 0;
      return s;
    }
    function defaultGame() {
      const opts = cfg.defaultOptions ? cfg.defaultOptions() : {};
      if (cfg.bots) return newLocalGame("local", [P ? P.name : "Du"], Math.min(cfg.defaultBots, cfg.maxPlayers - 1), opts);
      if (cfg.solo) return newLocalGame("solo", [P ? P.name : "Du"], 0, opts);
      return newLocalGame("local", Array.from({ length: cfg.minPlayers }, (_, k) => `Spieler ${k + 1}`), 0, opts);
    }

    // ---------- Änderungen (lokal sofort, online mit Versionsabgleich) ----------
    // fn verändert kit.S; gibt sie false zurück, wird nichts gespeichert.
    async function act(fn0) {
      const mi = kit.me();
      const fn = () => {
        const before = snap(), r = fn0();
        if (r !== false && S.phase !== "lobby") markOwn(before, mi);
        return r;
      };
      if (S.mode !== "online") {
        if (fn() !== false) { kit.error = ""; render(); }
        return;
      }
      if (ui.busy) return;
      ui.busy = true;
      try {
        for (let t = 0; t < 6; t++) {
          const base = JSON.stringify(S);
          if (fn() === false) { setS(JSON.parse(base)); render(); return; }
          const r = await api("put", { id: ui.room.id, version: ui.room.version, state: S, meta: roomMeta() });
          if (r.ok) { ui.room.version = r.data.version; kit.error = ""; render(); return; }
          if (r.status === 409 && r.data.state) { setS(r.data.state); ui.room.version = r.data.version; continue; }
          setS(JSON.parse(base));
          kit.error = r.data.error || "Speichern fehlgeschlagen.";
          render(); return;
        }
      } finally { ui.busy = false; }
    }

    // ---------- Server ----------
    async function api(a, body, query = "") {
      const opt = body ? { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": P.csrf }, body: JSON.stringify(body) } : {};
      try {
        const res = await fetch(`${P.api}?a=${a}${query}`, { credentials: "same-origin", cache: "no-store", ...opt });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
      } catch (e) {
        return { ok: false, status: 0, data: { error: "Keine Verbindung zum Server." } };
      }
    }
    function roomMeta() {
      const host = S.players.find(p => p.id === S.host);
      const status = S.phase === "lobby" ? "wartet auf Mitspieler" : S.phase === "over" ? "beendet"
        : (cfg.roomStatus ? cfg.roomStatus(S) : "läuft");
      return {
        title: `Runde von ${host ? host.name : S.host}`, status,
        players: S.players.map(p => p.name + (p.ai ? " (Computer)" : "")),
        open: S.phase === "lobby" && S.players.length < cfg.maxPlayers,
      };
    }
    function forgetRoom(msg) {
      ui.room = null; store.set("raum", "");
      setS(load() || defaultGame());
      loadSeen(); ui.prevLog = snap();
      ui.banner = msg || "";
      render();
    }
    async function openRoom(id) {
      const r = await api("get", null, `&id=${encodeURIComponent(id)}`);
      if (!r.ok) { ui.banner = r.data.error || "Raum nicht erreichbar."; render(); return false; }
      setS(r.data.state); ui.room = { id, version: r.data.version };
      store.set("raum", id);
      loadSeen(); ui.prevLog = snap();
      ui.banner = ""; kit.error = "";
      if (kit.me() < 0 && S.phase === "lobby" && S.players.length < cfg.maxPlayers) {
        await act(() => {
          if (S.phase !== "lobby" || kit.me() >= 0 || S.players.length >= cfg.maxPlayers) return false;
          S.players.push(cfg.newPlayer({ id: P.user, name: P.name, ai: false }));
          kit.addLog(`<b>${esc(P.name)}</b> ist beigetreten.`);
        });
      }
      render();
      return true;
    }
    async function createRoom(options) {
      const prev = S;
      setS(build("online", [{ id: P.user, name: P.name, ai: false }], options));
      kit.addLog(`<b>${esc(P.name)}</b> hat den Raum eröffnet.`);
      const r = await api("create", { game: P.game, state: S, meta: roomMeta() });
      if (!r.ok) { setS(prev); ui.banner = r.data.error || "Raum konnte nicht eröffnet werden."; render(); return; }
      ui.room = { id: r.data.id, version: r.data.version };
      store.set("raum", r.data.id);
      resetSeen();
      ui.banner = ""; render();
    }
    function leave() {
      if (S.phase === "lobby" && kit.me() >= 0 && !kit.isHost()) {
        act(() => {
          const k = kit.me();
          if (S.phase !== "lobby" || k < 0) return false;
          S.players.splice(k, 1);
          kit.addLog(`<b>${esc(P.name)}</b> hat den Raum verlassen.`);
        }).then(() => forgetRoom());
      } else forgetRoom();
    }
    async function poll() {
      if (!ui.room || ui.busy || document.hidden) return;
      const r = await api("get", null, `&id=${ui.room.id}&since=${ui.room.version}`);
      if (ui.busy || !ui.room) return;
      if (r.status === 404) { forgetRoom("Der Raum wurde geschlossen."); return; }
      if (r.ok && r.data.changed) { setS(r.data.state); ui.room.version = r.data.version; render(); }
    }
    async function loadRooms() {
      const ul = q("#sk-room-list");
      ul.innerHTML = `<li class="sk-muted">Lade …</li>`;
      const r = await api("rooms", null, `&game=${encodeURIComponent(P.game)}`);
      if (!r.ok) { ul.innerHTML = `<li class="sk-muted">${esc(r.data.error || "Liste nicht verfügbar.")}</li>`; return; }
      const rooms = r.data.rooms.filter(x => x.meta.open || x.owner === P.user || x.meta.players.includes(P.name));
      ul.innerHTML = rooms.length ? rooms.map(x => `<li><div class="sk-r-info"><b>${esc(x.meta.title)}</b> <span class="sk-muted">${esc(x.id)}</span>
          <small>${esc(x.meta.status)} · ${x.meta.players.map(esc).join(", ")}</small></div>
          <button class="btn small" type="button" data-room="${esc(x.id)}">${x.meta.open ? "Beitreten" : "Öffnen"}</button></li>`).join("")
        : `<li class="sk-muted">Gerade ist kein Raum offen. Eröffne einen neuen.</li>`;
    }
    function rematch() {
      if (S.mode !== "online") { openSetup(); return; }
      act(() => {
        if (!kit.isHost() || S.phase !== "over") return false;
        const roster = S.players.map(p => ({ id: p.id, name: p.name, ai: p.ai }));
        const s = build("online", roster, S.options, true);
        s.host = S.host;
        setS(s);
        cfg.onStart(S);
        kit.addLog("Neue Runde im selben Raum.");
      });
    }
    function lobbyAction(a, arg) {
      if (a === "bot") act(() => {
        if (!kit.isHost() || S.phase !== "lobby" || S.players.length >= cfg.maxPlayers) return false;
        const used = new Set(S.players.map(p => p.name));
        const name = cfg.botNames.find(n => !used.has(n)) || "Computer";
        S.players.push(cfg.newPlayer({ id: "bot-" + Math.random().toString(36).slice(2, 8), name, ai: true }));
        kit.addLog(`Computer-Gegner <b>${esc(name)}</b> sitzt mit am Tisch.`);
      });
      else if (a === "kick") act(() => {
        const k = +arg;
        if (!kit.isHost() || S.phase !== "lobby" || !S.players[k] || S.players[k].id === S.host) return false;
        kit.addLog(`<b>${esc(S.players[k].name)}</b> wurde entfernt.`);
        S.players.splice(k, 1);
      });
      else if (a === "start") act(() => {
        if (!kit.isHost() || S.phase !== "lobby" || S.players.length < cfg.minPlayers) return false;
        cfg.onStart(S);
      });
      else if (a === "close") api("delete", { id: ui.room.id }).then(r => {
        if (!r.ok) { ui.banner = r.data.error || "Raum konnte nicht geschlossen werden."; render(); return; }
        forgetRoom();
      });
    }

    // ---------- Speichern auf dem Gerät ----------
    function save() { if (S && S.mode !== "online") store.set(stateKey, JSON.stringify(S)); }
    function load() {
      try {
        const s = JSON.parse(store.get(stateKey));
        if (s && s.v === cfg.version && Array.isArray(s.players) && (!cfg.validState || cfg.validState(s))) return s;
      } catch (e) { /* kein gültiger Stand */ }
      return null;
    }

    // ---------- Oberfläche des Gerüsts ----------
    function injectDom() {
      const tb = q("[data-sk-toolbar]");
      if (tb) tb.innerHTML = `<a class="sk-home" id="sk-home" href="index.php" hidden>← Alle Spiele</a>
        <button class="btn small" id="sk-leave" type="button" hidden>Raum verlassen</button>
        <button class="btn" id="sk-new" type="button">Neues Spiel</button>`;
      if (!q("[data-sk-recap]")) {
        const bn = q("[data-sk-banner]");
        if (bn) bn.insertAdjacentHTML("afterend", `<section class="sk-recap" data-sk-recap hidden aria-live="polite"></section>`);
      }
      document.body.insertAdjacentHTML("beforeend", `
<div class="sk-toast" id="sk-toast" role="status" aria-live="polite" hidden><ol class="sk-news"></ol><button type="button" class="sk-toast-x" aria-label="Hinweis schließen">×</button></div>
<div class="sk-overlay" id="sk-dlg" hidden>
  <form class="sk-dialog" id="sk-form">
    <h2>Neues Spiel</h2>
    <div class="sk-field"><div class="sk-label">Spielart</div>
      <div class="sk-seg" role="radiogroup" aria-label="Spielart">
        <label><input type="radio" name="sk-mode" id="sk-mode-local" value="local" checked>An diesem Gerät<small>${cfg.bots ? "Mitspieler und/oder Computer" : "Gerät wird weitergegeben"}</small></label>
        ${cfg.solo ? `<label><input type="radio" name="sk-mode" id="sk-mode-solo" value="solo">${esc(cfg.solo.label || "Allein")}<small>${esc(cfg.solo.small || "")}</small></label>` : ""}
        ${P ? `<label><input type="radio" name="sk-mode" id="sk-mode-online" value="online">Online<small>jeder am eigenen Gerät</small></label>` : ""}
      </div></div>
    <div class="sk-field" id="sk-humans-field"><div class="sk-label" id="sk-humans-label">Spieler an diesem Gerät</div>
      <div class="sk-humans" id="sk-humans"></div>
      <button class="btn small" type="button" id="sk-add-human">+ Spieler</button></div>
    <div class="sk-field" id="sk-bots-field"><label class="sk-label" for="sk-bots">Computer-Gegner</label>
      <select id="sk-bots"></select><small class="sk-muted" id="sk-count"></small></div>
    <div id="sk-extra">${cfg.setup ? cfg.setup.html : ""}</div>
    <div class="sk-field" id="sk-rooms-field" hidden><div class="sk-label">Offene Räume</div>
      <ul class="sk-rooms" id="sk-room-list"></ul>
      <button class="btn small" type="button" id="sk-refresh">Liste aktualisieren</button></div>
    <div class="sk-actions">
      <button class="btn primary" type="submit" id="sk-start">Spiel starten</button>
      <button class="btn" type="button" id="sk-cancel">Abbrechen</button>
    </div>
  </form>
</div>
<div class="sk-overlay${cfg.privateHands ? " sk-private" : ""}" id="sk-handover" hidden>
  <div class="sk-dialog sk-ho" role="dialog" aria-labelledby="sk-ho-name">
    <div class="sk-label" id="sk-ho-label">Gerät weitergeben an</div>
    <div class="sk-big" id="sk-ho-name"></div>
    <p class="sk-muted" id="sk-ho-text"></p>
    <div class="sk-ho-news" id="sk-ho-news" hidden></div>
    <button class="btn primary big" type="button" id="sk-ho-btn">Los geht's</button>
  </div>
</div>`);
    }

    function renderChrome(mi, since) {
      const online = S.mode === "online";
      const home = q("#sk-home");
      if (home) { home.hidden = !P; if (P) home.href = P.home; }
      const lv = q("#sk-leave");
      if (lv) { lv.hidden = !online; lv.textContent = kit.isHost() && S.phase === "lobby" ? "Zurück" : "Raum verlassen"; }
      const bn = q("[data-sk-banner]");
      if (bn) { bn.hidden = !ui.banner; bn.textContent = ui.banner; }
      const lobbyEl = q("[data-sk-lobby]");
      if (lobbyEl) {
        lobbyEl.hidden = S.phase !== "lobby";
        if (S.phase === "lobby") lobbyEl.innerHTML = lobbyHtml();
      }
      const show = kit.hotSeat() && S.phase !== "lobby" && S.phase !== "over" && mi !== ui.ackHuman && q("#sk-dlg").hidden;
      q("#sk-handover").hidden = !show;
      if (show) q("#sk-toast").hidden = true;
      if (show) {
        const p = S.players[mi];
        q("#sk-ho-label").textContent = ui.ackHuman == null ? "Es beginnt" : "Gerät weitergeben an";
        q("#sk-ho-name").textContent = p.name;
        q("#sk-ho-text").textContent = cfg.handoverText ? cfg.handoverText(S, mi) : "Du bist dran.";
        q("#sk-ho-btn").textContent = `Los geht's, ${p.name}`;
        const ho = q("#sk-ho-news");
        ho.hidden = !since || !since.length;
        if (since && since.length) ho.innerHTML = `<div class="sk-label">Seit deinem letzten Zug</div><ol class="sk-news">${recapList(since, 6)}</ol>`;
      }
    }
    function lobbyHtml() {
      const host = kit.isHost(), hostName = (S.players.find(p => p.id === S.host) || {}).name || "der Gastgeber";
      return `<h2>Warten auf Mitspieler</h2>
        <div class="sk-label">Raumcode</div><div class="sk-code">${esc(ui.room.id)}</div>
        <p class="sk-muted">Die anderen öffnen dieses Spiel, tippen auf „Neues Spiel“ → „Online“ und treten diesem Raum bei.</p>
        <ul class="sk-roster">${S.players.map((p, k) => `<li><span>${esc(p.name)}${p.ai ? ' <span class="sk-muted">(Computer)</span>' : ""}</span>
          ${p.id === S.host ? '<span class="sk-chip on">eröffnet</span>' : host ? `<button class="btn small" type="button" data-sk-lobby-act="kick" data-arg="${k}">Entfernen</button>` : ""}</li>`).join("")}</ul>
        ${host ? `<div class="sk-actions">
          <button class="btn primary" type="button" data-sk-lobby-act="start"${S.players.length < cfg.minPlayers ? " disabled" : ""}>Spiel starten</button>
          ${cfg.bots ? `<button class="btn" type="button" data-sk-lobby-act="bot"${S.players.length >= cfg.maxPlayers ? " disabled" : ""}>+ Computer-Gegner</button>` : ""}
          <button class="btn small" type="button" data-sk-lobby-act="close">Raum schließen</button></div>
          ${S.players.length < cfg.minPlayers ? `<p class="sk-muted">Zum Starten braucht es mindestens ${cfg.minPlayers} Spieler.</p>` : ""}`
        : `<p class="sk-muted">Warte, bis ${esc(hostName)} das Spiel startet.</p>`}
        ${kit.error ? `<p class="sk-err">${esc(kit.error)}</p>` : ""}`;
    }

    function render() {
      if (!S) return;
      const mi = kit.me();
      if (S.mode === "local") ui.lastHuman = mi;
      cfg.render(S);
      const since = renderNews(mi);
      renderChrome(mi, since);
      save();
    }

    // ---------- Dialog „Neues Spiel“ ----------
    const DLG = { humans: [P ? P.name : "Du"], bots: cfg.bots ? cfg.defaultBots : 0 };
    try { const d = JSON.parse(store.get("einstellung")); if (d && Array.isArray(d.humans) && d.humans.length) Object.assign(DLG, d); } catch (e) { /* neu */ }
    const dlgMode = () => q('input[name="sk-mode"]:checked').value;
    function syncDlg() {
      const mode = dlgMode(), local = mode === "local";
      if (mode === "solo") DLG.humans = DLG.humans.slice(0, 1);
      if (local && !cfg.bots) while (DLG.humans.length < cfg.minPlayers) DLG.humans.push(`Spieler ${DLG.humans.length + 1}`);
      DLG.humans = DLG.humans.slice(0, cfg.maxPlayers);
      const nh = DLG.humans.length;
      const minBots = local && cfg.bots ? Math.max(0, cfg.minPlayers - nh) : 0, maxBots = local && cfg.bots ? cfg.maxPlayers - nh : 0;
      DLG.bots = Math.min(maxBots, Math.max(minBots, DLG.bots));
      q("#sk-humans-field").hidden = mode === "online";
      q("#sk-humans-label").textContent = mode === "solo" ? "Dein Name" : "Spieler an diesem Gerät";
      const minHumans = local && !cfg.bots ? cfg.minPlayers : 1;
      q("#sk-humans").innerHTML = DLG.humans.map((n, k) => `<div class="sk-hrow">
          <input id="sk-h-${k}" data-h="${k}" maxlength="16" value="${esc(n)}" aria-label="Name Spieler ${k + 1}" autocomplete="off">
          ${nh > minHumans ? `<button class="btn small" type="button" data-hdel="${k}" aria-label="Spieler ${k + 1} entfernen">Entfernen</button>` : ""}</div>`).join("");
      q("#sk-add-human").hidden = !local || nh >= cfg.maxPlayers;
      q("#sk-bots-field").hidden = !local || !cfg.bots;
      let opts = "";
      for (let b = minBots; b <= maxBots; b++) opts += `<option value="${b}"${b === DLG.bots ? " selected" : ""}>${b === 0 ? "keine" : b}</option>`;
      q("#sk-bots").innerHTML = opts;
      q("#sk-count").textContent = local ? `Insgesamt ${nh + DLG.bots} Spieler${nh > 1 ? ". Das Gerät wird nach jedem Zug weitergegeben." : "."}` : "";
      q("#sk-rooms-field").hidden = mode !== "online";
      q("#sk-start").textContent = mode === "online" ? "Neuen Raum eröffnen" : "Spiel starten";
      if (cfg.setup && cfg.setup.sync) cfg.setup.sync(q("#sk-extra"), mode);
    }
    function openSetup() {
      q("#sk-dlg").hidden = false; q("#sk-handover").hidden = true;
      const r = q(`#sk-mode-${S.mode}`);
      if (r && S.mode !== "online") r.checked = true;
      syncDlg();
      if (dlgMode() === "online") loadRooms();
    }
    function closeSetup() { q("#sk-dlg").hidden = true; render(); }
    function wireDom() {
      q("#sk-new").addEventListener("click", openSetup);
      q("#sk-leave").addEventListener("click", leave);
      q("#sk-cancel").addEventListener("click", closeSetup);
      q("#sk-dlg").addEventListener("keydown", e => { if (e.key === "Escape") closeSetup(); });
      document.querySelectorAll('input[name="sk-mode"]').forEach(r => r.addEventListener("change", () => { syncDlg(); if (dlgMode() === "online") loadRooms(); }));
      q("#sk-add-human").addEventListener("click", () => { DLG.humans.push(`Spieler ${DLG.humans.length + 1}`); syncDlg(); q("#sk-h-" + (DLG.humans.length - 1)).select(); });
      q("#sk-humans").addEventListener("input", e => { const k = e.target.dataset.h; if (k != null) DLG.humans[+k] = e.target.value; });
      q("#sk-humans").addEventListener("click", e => { const b = e.target.closest("[data-hdel]"); if (b) { DLG.humans.splice(+b.dataset.hdel, 1); syncDlg(); } });
      q("#sk-bots").addEventListener("change", () => { DLG.bots = +q("#sk-bots").value; syncDlg(); });
      q("#sk-refresh").addEventListener("click", loadRooms);
      q("#sk-room-list").addEventListener("click", async e => {
        const b = e.target.closest("[data-room]");
        if (b && await openRoom(b.dataset.room)) q("#sk-dlg").hidden = true;
      });
      q("#sk-ho-btn").addEventListener("click", () => { ui.ackHuman = kit.me(); render(); });
      q("#sk-toast .sk-toast-x").addEventListener("click", () => { q("#sk-toast").hidden = true; });
      document.addEventListener("click", e => {
        const b = e.target.closest("[data-sk-lobby-act]");
        if (b) lobbyAction(b.dataset.skLobbyAct, b.dataset.arg);
      });
      q("#sk-form").addEventListener("submit", async e => {
        e.preventDefault();
        const mode = dlgMode();
        const options = cfg.setup && cfg.setup.read ? cfg.setup.read(q("#sk-extra"), mode) : {};
        kit.error = ""; ui.banner = "";
        if (mode === "online") { await createRoom(options); q("#sk-dlg").hidden = true; render(); return; }
        DLG.humans = DLG.humans.map((n, k) => n.trim() || (DLG.humans.length === 1 ? (P ? P.name : "Du") : `Spieler ${k + 1}`));
        store.set("einstellung", JSON.stringify(DLG));
        ui.room = null; store.set("raum", "");
        setS(newLocalGame(mode, DLG.humans, DLG.bots, options));
        resetSeen();
        q("#sk-dlg").hidden = true;
        render();
      });
      if (cfg.setup && cfg.setup.init) cfg.setup.init(q("#sk-extra"), kit);
    }

    // ---------- Start ----------
    function start() {
      const boot = data => {
        injectDom(); wireDom();
        const hot = !P && data && data.v === cfg.version && Array.isArray(data.players) ? data : null;
        setS(hot || load() || defaultGame());
        loadSeen(); ui.prevLog = snap();
        if (!P && window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => S);
        render();
        if (P) {
          const last = store.get("raum");
          if (last) openRoom(last).then(ok => { if (!ok) { store.set("raum", ""); ui.banner = ""; render(); } });
          setInterval(poll, cfg.pollMs);
          document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
        }
      };
      const hot = window.claude && window.claude.hot;
      if (hot && hot.ready) hot.ready(boot); else boot(hot ? hot.data : null);
    }

    return kit;
  }

  window.Spielkit = { create, esc, rnd };
})();
