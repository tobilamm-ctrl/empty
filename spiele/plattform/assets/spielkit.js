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

  // ---------- Töne (im Browser erzeugt, keine Dateien) ----------
  const Sound = (() => {
    let ctx = null, on = true;
    try { on = localStorage.getItem("spieleabend-ton") !== "aus"; } catch (e) { /* egal */ }
    const ac = () => {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    // Ton erst nach der ersten Berührung erlauben (Vorgabe der Browser)
    const unlock = () => { if (on) ac(); };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    function tone(c, f, t0, dur, type = "sine", vol = .15, f2) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + .02);
    }
    // Rauschen mit Filter; type lowpass/bandpass, freq2 = Filter gleitet dorthin
    function noise(c, t0, dur, freq, vol = .2, q = 1.2, type = "bandpass", freq2) {
      const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = b; f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q; g.gain.value = vol;
      if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t0 + dur);
      s.connect(f).connect(g).connect(c.destination); s.start(t0);
    }
    const SOUNDS = {
      tap: (c, t) => tone(c, 720, t, .045, "sine", .06),
      move: (c, t) => { tone(c, 520, t, .09, "triangle", .12); tone(c, 780, t + .07, .12, "triangle", .1); },
      card: (c, t) => { noise(c, t, .12, 2600, .35, .8); tone(c, 340, t + .02, .05, "sine", .05); },
      stone: (c, t) => { tone(c, 190, t, .16, "sine", .35, 70); noise(c, t, .05, 900, .25, 2); },
      dice: (c, t) => { for (let k = 0; k < 5; k++) noise(c, t + k * .045 + Math.random() * .02, .035, 1800 + Math.random() * 1500, .3, 3); },
      tile: (c, t) => { tone(c, 1200, t, .05, "triangle", .12); tone(c, 1650, t + .035, .07, "triangle", .08); },
      turn: (c, t) => { tone(c, 660, t, .16, "sine", .14); tone(c, 990, t + .13, .24, "sine", .13); },
      // Schiffe versenken: Wasser, Treffer, versenkt
      splash: (c, t) => { noise(c, t, .5, 1400, .45, .9, "bandpass", 300); tone(c, 420, t + .03, .18, "sine", .12, 140); tone(c, 300, t + .16, .14, "sine", .08, 110); },
      hit: (c, t) => { noise(c, t, .45, 1800, .7, .7, "lowpass", 200); tone(c, 130, t, .3, "sine", .4, 45); },
      sunk: (c, t) => {
        noise(c, t, .5, 2200, .75, .7, "lowpass", 180); tone(c, 120, t, .35, "sine", .45, 40);
        noise(c, t + .25, 1.1, 500, .45, .6, "lowpass", 60);                       // Grollen
        tone(c, 440, t + .35, .9, "triangle", .1, 70);                           // sinkt
        for (let k = 0; k < 4; k++) tone(c, 500 + k * 120, t + .7 + k * .12, .06, "sine", .05, 900); // Blasen
      },
      win: (c, t) => [523, 659, 784, 1047].forEach((f, k) => tone(c, f, t + k * .11, .28, "triangle", .13)),
    };
    return {
      on: () => on,
      toggle() { on = !on; try { localStorage.setItem("spieleabend-ton", on ? "an" : "aus"); } catch (e) { /* egal */ } },
      play(name) {
        try { window.dispatchEvent(new CustomEvent("spielkit:ton", { detail: name })); } catch (e) { /* alt */ }   // für Tests
        if (!on || !SOUNDS[name]) return;
        const c = ac(); if (!c || c.state !== "running") return;
        try { SOUNDS[name](c, c.currentTime + .01); } catch (e) { /* kein Ton */ }
      },
    };
  })();

  // ---------- Sprachausgabe (Stimmen des Geräts, nur solche, die auf dem Gerät selbst laufen) ----------
  const Speech = (() => {
    const syn = window.speechSynthesis || null;
    const LEVELS = ["Aus", "Wer dran ist", "Mit Zügen", "Mit Anweisungen"];
    const SHORT = ["Aus", "Wer dran", "Züge", "Alles"];
    let level = 0, voice = null;
    try { level = Math.min(3, Math.max(0, +localStorage.getItem("spieleabend-ansage") || 0)); } catch (e) { /* egal */ }
    // deutsche Stimme, die auf dem Gerät läuft (Stimmen aus dem Netz, z. B. von Google, schicken den Text weg)
    const pick = () => {
      if (!syn) return;
      const vs = syn.getVoices().filter(v => /^de([-_]|$)/i.test(v.lang) && v.localService !== false);
      voice = vs.find(v => /de[-_]DE/i.test(v.lang) && v.default) || vs.find(v => /de[-_]DE/i.test(v.lang)) || vs[0] || null;
    };
    if (syn) { pick(); if (syn.addEventListener) syn.addEventListener("voiceschanged", pick); else syn.onvoiceschanged = pick; }
    // erst nach einer Berührung darf der Browser sprechen
    window.addEventListener("pointerdown", () => { if (level && syn) syn.speak(new SpeechSynthesisUtterance("")); }, { once: true, passive: true });
    return {
      LEVELS, SHORT,
      level: () => level,
      available() { if (!voice) pick(); return !!(syn && voice); },
      cycle() { level = (level + 1) % LEVELS.length; try { localStorage.setItem("spieleabend-ansage", String(level)); } catch (e) { /* egal */ } if (!level && syn) syn.cancel(); return level; },
      busy: () => !!syn && (syn.speaking || syn.pending),
      say(text) {
        if (!level || !syn || !text) return;
        if (!voice) pick();
        if (!voice) return;
        try {
          if (syn.pending) syn.cancel();           // nicht hinterherreden: Wartendes verwerfen
          const u = new SpeechSynthesisUtterance(text);
          u.voice = voice; u.lang = voice.lang; u.rate = 1.05;
          syn.speak(u);
        } catch (e) { /* Sprachausgabe darf das Spiel nie stören */ }
      },
    };
  })();

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
      botDelay: 750,       // Pause vor jedem Zug eines Computer-Gegners (ms)
      botPending: null,    // () => true, wenn gerade ein Computer-Gegner ziehen muss
      botStep: null,       // () => einen einzelnen Schritt des Computers ausführen
      nextUp: null,        // (S, aktiv) => wer als Nächstes dran ist (sonst der Sitz danach)
      turnInfo: null,      // (S) => { active, next, also } für Spiele mit besonderer Reihenfolge
      moveSound: "move",   // Ton, wenn ein anderer zieht: move, card, stone, dice, tile
      speech: null,        // (text) => Text zum Vorlesen umformen (z. B. Zugschreibweise)
      sharedDevice: false, // true: ein Gerät für alle am Tisch (z. B. Punkteblock) – kein „Du bist dran“, kein Weitergeben
    }, cfg);

    let S = null;
    const ui = { room: null, busy: false, banner: "", lastHuman: 0, ackHuman: null, seen: {}, prevLog: null, newsOpen: false, fresh: [], spokeTurn: null, spokeStatus: "",
      botT: 0, botAt: 0, changedAt: Date.now(), lastPoll: 0, wasMine: null, lastPhase: null };
    const suffix = P ? "-" + P.user : "";
    const store = {
      get(k) { try { return localStorage.getItem(`${cfg.id}-${k}${suffix}`); } catch (e) { return null; } },
      set(k, v) { try { localStorage.setItem(`${cfg.id}-${k}${suffix}`, v); } catch (e) { /* privat/gesperrt */ } },
    };
    const stateKey = "spiel-v" + cfg.version;
    const q = sel => document.querySelector(sel);
    const setS = s => { S = s; ui.changedAt = Date.now(); if (cfg.onState) cfg.onState(s); };

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
    // Neuigkeiten berechnen (angezeigt in der Zugleiste und beim Weitergeben); Ton, wenn gerade etwas dazukam
    function renderNews(mi) {
      if (!S.log) return [];
      const key = viewerKey(mi);
      if (key && !ui.seen[key]) { ui.seen[key] = snap(); saveSeen(); }
      const since = key && S.phase !== "lobby" ? newSince(ui.seen[key]) : [];
      const fresh = ui.prevLog ? newSince(ui.prevLog) : [];
      ui.prevLog = snap(); ui.fresh = fresh;
      if (fresh.length && S.phase !== "lobby") Sound.play(cfg.moveSound);
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
      // Computer-Gegner ziehen mit kurzer Pause einzeln (das Spielkit treibt sie an). Für Tests:
      // window.SPIELKIT_SOFORT = true lässt die Spiele wie früher alle Computerzüge sofort ausführen.
      paced: () => !!(cfg.botStep && cfg.botPending) && !window.SPIELKIT_SOFORT,
      sound: name => Sound.play(name),
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
    async function act(fn0, opt = {}) {
      const mi = kit.me();
      const fn = opt.bot ? fn0 : () => {
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

    // ---------- Computer-Gegner einzeln mit Pause ----------
    function botsWaiting() {
      try { return !!(kit.paced() && S && S.phase !== "lobby" && S.phase !== "over" && cfg.botPending(S)); } catch (e) { return false; }
    }
    function scheduleBots() {
      if (!botsWaiting() || !q("#sk-dlg").hidden) { clearTimeout(ui.botT); ui.botT = 0; return; }
      // online zieht das Gerät des Gastgebers die Computer; ist es weg, übernimmt nach 5 s ein anderes
      const delay = S.mode !== "online" || kit.isHost() ? cfg.botDelay + (S.mode === "online" ? 250 : 0) : 5000;
      const at = (S.mode === "online" && !kit.isHost() ? ui.changedAt : Date.now()) + delay;
      if (ui.botT && Math.abs(ui.botAt - at) < 50) return;
      clearTimeout(ui.botT); ui.botAt = at;
      const fire = () => {
        ui.botT = 0;
        if (!botsWaiting() || ui.busy) { scheduleBots(); return; }
        // mit Ansage: warten, bis sie fertig ist
        if (Speech.level() >= 2 && Speech.busy()) { ui.botAt = Date.now() + 250; ui.botT = setTimeout(fire, 250); return; }
        act(() => { if (!cfg.botPending(S)) return false; cfg.botStep(S); }, { bot: true });
      };
      ui.botT = setTimeout(fire, Math.max(60, at - Date.now()));
    }

    // ---------- Zugleiste: wer ist dran, wer als Nächstes ----------
    function turnInfo() {
      if (cfg.turnInfo) return cfg.turnInfo(S);
      const acts = cfg.whoActs ? cfg.whoActs(S) : [];
      if (acts.length !== 1) return { active: -1, next: -1, also: acts };
      const a = acts[0], n = S.players.length;
      return { active: a, next: cfg.nextUp ? cfg.nextUp(S, a) : (a + 1) % n, also: [] };
    }
    // Die Leiste hat immer dieselbe Höhe, damit das Spielfeld darunter nicht springt.
    function renderTurns(mi, since) {
      const bar = q("[data-sk-turns]");
      if (!bar) return;
      const show = S.players.length > 1 && S.phase !== "lobby";
      bar.hidden = !show;
      if (!show) return;
      const over = S.phase === "over";
      const ti = over ? { active: -1, next: -1, also: [] } : turnInfo() || { active: -1, next: -1, also: [] }, also = ti.also || [];
      const me = i => i >= 0 && i === mi && !S.players[i].ai;
      bar.classList.toggle("sk-mine", me(ti.active) || also.includes(mi));
      const head = ti.active >= 0
        ? (me(ti.active) ? `<b>Du bist dran${S.players.filter(p => !p.ai).length > 1 ? `, ${esc(S.players[mi].name)}` : ""}!</b>` : `<b>${esc(S.players[ti.active].name)}</b> ist dran${S.players[ti.active].ai ? " (Computer)" : ""}`)
        : also.length ? `Gleichzeitig dran: ${also.map(i => `<b>${esc(S.players[i].name)}</b>`).join(", ")}` : over ? "<b>Spiel vorbei</b>" : "";
      // zweite Zeile: was die anderen seit dem eigenen letzten Zug gemacht haben (Neuestes zuerst)
      const news = since && since.length ? since : [];
      const line = news.length
        ? `<span class="sk-lab">Seit deinem Zug:</span><span class="sk-txt">${news.slice(0, 6).join(" · ")}</span>`
        : `<span class="sk-lab sk-muted">Zuletzt:</span><span class="sk-txt sk-old">${S.log[0] || "–"}</span>`;
      const list = (news.length ? news : S.log).slice(0, 8);
      bar.innerHTML = `<div class="sk-row"><div class="sk-turn-head">${head}</div><ol class="sk-order" aria-label="Reihenfolge">${S.players.map((p, i) => {
        const cls = i === ti.active ? " sk-now" : also.includes(i) ? " sk-also" : i === ti.next ? " sk-next" : "";
        const tag = i === ti.active ? "am Zug" : also.includes(i) ? "dran" : i === ti.next ? "als Nächstes" : "";
        return `<li class="sk-p${cls}${i === mi ? " sk-self" : ""}"><span class="sk-pn">${esc(p.name)}${p.ai ? " 🤖" : ""}</span>${tag ? `<small>${tag}</small>` : ""}</li>`;
      }).join("")}</ol></div>
        <div class="sk-last${news.length ? " sk-new" : ""}">${line}<button type="button" class="sk-more" aria-expanded="${ui.newsOpen}">${ui.newsOpen ? "Zu" : "Alle"}</button></div>
        <div class="sk-drop"${ui.newsOpen ? "" : " hidden"}><div class="sk-label">${news.length ? "Seit deinem letzten Zug" : "Zuletzt"}</div><ol class="sk-news">${recapList(list, 8)}</ol></div>`;
      const now = bar.querySelector(".sk-now");
      if (now && now.scrollIntoView && bar.scrollWidth > bar.clientWidth) { const ol = bar.querySelector(".sk-order"); ol.scrollLeft = now.offsetLeft - ol.clientWidth / 2 + now.clientWidth / 2; }
    }
    // Töne: eigener Zug beginnt, Spielende
    function soundCues(mi) {
      const ti = turnInfo() || { active: -1, also: [] };
      const mine = S.phase !== "lobby" && S.phase !== "over" && mi >= 0 && !S.players[mi].ai && (ti.active === mi || (ti.also || []).includes(mi));
      if (ui.wasMine === false && mine && S.players.length > 1) Sound.play("turn");
      ui.wasMine = mine;
      if (ui.lastPhase && ui.lastPhase !== "over" && S.phase === "over") Sound.play("win");
      ui.lastPhase = S.phase;
    }

    // ---------- Ansage ----------
    // Verlaufseintrag (HTML) in vorlesbaren Text: Elemente mit title (z. B. Farbstecker) zählen mit ihrem Namen
    function speakable(html) {
      const d = document.createElement("div");
      d.innerHTML = html;
      d.querySelectorAll("[title]").forEach(el => { el.textContent = ` ${el.getAttribute("title")} `; });
      let t = d.textContent;
      if (cfg.speech) t = cfg.speech(t);
      return t.replace(/×/g, " ").replace(/·/g, ",").replace(/→/g, " auf ").replace(/[−–](?=\s?\d)/g, "minus ")
        .replace(/(^|[\s(])-(?=\d)/g, "$1minus ").replace(/\+(?=\d)/g, "plus ").replace(/\s:\s/g, " zu ").replace(/…/g, "")
        .replace(/\s+/g, " ").trim();
    }
    function announce(mi, handover) {
      const L = Speech.level();
      if (!L || S.phase === "lobby") { ui.spokeTurn = null; ui.spokeStatus = ""; return; }
      const parts = [];
      // Züge der anderen (Stufe 2 und 3), älteste zuerst; bei vielen nur die letzten drei
      if (L >= 2 && ui.fresh.length) {
        if (ui.fresh.length > 3) parts.push("Mehrere Züge.");
        parts.push(...ui.fresh.slice(0, 3).reverse().map(speakable));
      }
      // wer dran ist
      const over = S.phase === "over", ti = over ? null : turnInfo() || { active: -1, also: [] };
      const also = ti ? ti.also || [] : [];
      const mine = !!ti && mi >= 0 && !S.players[mi].ai && (ti.active === mi || also.includes(mi));
      const key = over ? "over" : `${ti.active}|${also.join(",")}|${handover ? "ho" : ""}`;
      const many = S.players.filter(p => !p.ai).length > 1;
      let status = "";
      if (L >= 3 && mine && !handover && !over) { const st = q("#status"); status = st ? speakable(st.innerHTML) : ""; }
      if (key !== ui.spokeTurn) {
        ui.spokeTurn = key;
        if (over) {
          const h = q("#result h2");
          parts.push("Spiel vorbei." + (h && h.offsetParent ? " " + speakable(h.innerHTML) + "." : ""));
        } else if (handover && mi >= 0) parts.push(`Gerät weitergeben an ${S.players[mi].name}.`);
        else if (mine) { if (!/dran/.test(status)) parts.push(many ? `${S.players[mi].name}, du bist dran.` : "Du bist dran."); }
        else if (L === 1 && ti.active >= 0) parts.push(`${S.players[ti.active].name} ist dran.`);
        else if (L === 1 && also.length) parts.push(`Gleichzeitig dran: ${also.map(i => S.players[i].name).join(", ")}.`);
      }
      // Anweisung (Stufe 3): wenn sich die Statuszeile im eigenen Zug ändert
      if (status && status !== ui.spokeStatus) parts.push(status);
      ui.spokeStatus = status;
      if (parts.length) Speech.say(parts.map(s => /[.!?:]$/.test(s) ? s : s + ".").join(" "));
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
        <button class="btn small sk-snd" id="sk-sound" type="button" aria-pressed="true"></button>
        <button class="btn small sk-snd" id="sk-speech" type="button" title="Ansage: aus, wer dran ist, mit Zügen, mit Anweisungen"></button>
        ${cfg.fullscreen === false ? "" : `<button class="btn small sk-snd" id="sk-full" type="button" aria-pressed="false" title="Vollbild: nur das Spielfeld, Bildschirm bleibt an"></button>`}
        <button class="btn" id="sk-new" type="button">Neues Spiel</button>`;
      if (!q("[data-sk-turns]")) {
        const bn = q("[data-sk-banner]");
        if (bn) bn.insertAdjacentHTML("beforebegin", `<div class="sk-turns" data-sk-turns hidden aria-live="polite"></div>`);
      }
      document.body.insertAdjacentHTML("beforeend", `
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
      const show = !cfg.sharedDevice && kit.hotSeat() && S.phase !== "lobby" && S.phase !== "over" && mi !== ui.ackHuman && q("#sk-dlg").hidden;
      q("#sk-handover").hidden = !show;
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
      const vi = cfg.sharedDevice ? -1 : mi;   // wer „du“ ist (bei einem gemeinsamen Gerät niemand)
      const since = renderNews(vi);
      renderChrome(mi, since);
      renderTurns(vi, since);
      soundCues(vi);
      try { announce(vi, !q("#sk-handover").hidden); } catch (e) { /* Ansage darf das Spiel nie stören */ }
      save();
      scheduleBots();
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
      // Liste „Alle“ in der Zugleiste auf- und zuklappen (liegt über dem Spielfeld, verschiebt nichts)
      document.addEventListener("click", e => {
        if (e.target.closest(".sk-more")) { ui.newsOpen = !ui.newsOpen; render(); return; }
        if (ui.newsOpen && !e.target.closest(".sk-drop")) { ui.newsOpen = false; render(); }
      });
      const snd = q("#sk-sound");
      const showSnd = () => { snd.textContent = Sound.on() ? "🔊 Ton an" : "🔇 Ton aus"; snd.setAttribute("aria-pressed", Sound.on()); };
      if (snd) { showSnd(); snd.addEventListener("click", () => { Sound.toggle(); showSnd(); Sound.play("tap"); }); }
      const sp = q("#sk-speech");
      const showSp = () => { sp.textContent = `🗣 ${Speech.SHORT[Speech.level()]}`; sp.setAttribute("aria-label", `Ansage: ${Speech.LEVELS[Speech.level()]}`); };
      if (sp) {
        showSp();
        sp.addEventListener("click", () => {
          const l = Speech.cycle(); showSp();
          ui.spokeTurn = null; ui.spokeStatus = "";
          if (l && !Speech.available()) { ui.banner = "Auf diesem Gerät gibt es keine deutsche Stimme. Am Handy lässt sie sich in den Einstellungen unter Sprachausgabe nachladen."; render(); return; }
          if (ui.banner.startsWith("Auf diesem Gerät gibt es keine deutsche Stimme")) ui.banner = "";
          if (l) Speech.say(`Ansage: ${Speech.LEVELS[l]}.`);
          render();
        });
      }
      // Vollbild: Titel, Verlauf und Regeln ausblenden, Bildschirm wach halten. Ohne Vollbild-Erlaubnis
      // (z. B. eingebettet oder am iPhone) füllt das Spiel trotzdem die Seite.
      const fb = q("#sk-full");
      if (fb) {
        let wake = null;
        const de = document.documentElement, fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
        const showFb = () => { const on = document.body.classList.contains("sk-full"); fb.textContent = on ? "✕ Vollbild" : "⛶ Vollbild"; fb.setAttribute("aria-pressed", on); };
        const lock = async on => {
          try { if (on && navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } else if (!on && wake) { wake.release(); wake = null; } } catch (e) { /* ohne Wachhalten */ }
        };
        const setFull = async on => {
          document.body.classList.toggle("sk-full", on); showFb(); lock(on);
          try {
            if (on && !fsEl()) { if (de.requestFullscreen) await de.requestFullscreen(); else if (de.webkitRequestFullscreen) de.webkitRequestFullscreen(); }
            if (!on && fsEl()) { if (document.exitFullscreen) await document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); }
          } catch (e) { /* Vollbild nicht erlaubt: Seite trotzdem aufs Spielfeld beschränken */ }
          window.scrollTo(0, 0);
        };
        showFb();
        fb.addEventListener("click", () => setFull(!document.body.classList.contains("sk-full")));
        const left = () => { if (!fsEl() && ui.wasFs && document.body.classList.contains("sk-full")) setFull(false); ui.wasFs = !!fsEl(); };
        document.addEventListener("fullscreenchange", left); document.addEventListener("webkitfullscreenchange", left);
        document.addEventListener("visibilitychange", () => { if (!document.hidden && document.body.classList.contains("sk-full")) lock(true); });
      }
      // Klick beim Antippen von allem, was man im Spiel bedienen kann
      document.addEventListener("pointerdown", e => {
        if (e.target.closest("#sk-sound")) return;
        const el = e.target.closest("button, [role=button], .can, .ok, .pick, [data-x], [data-p], [data-c], [data-col], [data-i], [data-n]");
        if (el && !el.disabled && !el.closest("[disabled]")) Sound.play("tap");
      }, { passive: true });
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

    function safeBot() { try { return !!cfg.botPending(S); } catch (e) { return false; } }

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
          setInterval(() => {
            const every = S && S.mode === "online" && (botsWaiting() || (cfg.botPending && S.phase !== "lobby" && safeBot())) ? 450 : cfg.pollMs;
            if (Date.now() - ui.lastPoll >= every - 20) { ui.lastPoll = Date.now(); poll(); }
          }, 150);
          document.addEventListener("visibilitychange", () => { if (!document.hidden) poll(); });
        }
      };
      const hot = window.claude && window.claude.hot;
      if (hot && hot.ready) hot.ready(boot); else boot(hot ? hot.data : null);
    }

    return kit;
  }

  window.Spielkit = { create, esc, rnd, sound: n => Sound.play(n) };
})();
