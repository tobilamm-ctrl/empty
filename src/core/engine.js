// Aufgabentypen registrieren und Arbeitsblätter erzeugen.
(function (AG) {
  const TYPES = [];
  const BY_ID = {};

  // Aufgabentyp anmelden. Pflichtfelder: id, klasse, zug, lb, lbTitle, title, instruction, generate.
  function registerType(t) {
    for (const k of ["id", "klasse", "zug", "lb", "lbTitle", "title", "instruction", "generate"]) {
      if (t[k] === undefined) throw new Error("registerType: Feld fehlt: " + k + " in " + (t.id || "?"));
    }
    if (BY_ID[t.id]) throw new Error("registerType: doppelte id " + t.id);
    t.levels = t.levels || [1, 2, 3];
    t.cols = t.cols || 2;
    TYPES.push(t);
    BY_ID[t.id] = t;
  }

  function instructionFor(type, level) {
    const ins = type.instruction;
    return typeof ins === "string" ? ins : (ins[level] || ins[1] || Object.values(ins)[0]);
  }

  function taskKey(task) {
    return task.key || AG.plain(task.q) + "|" + (task.table ? JSON.stringify(task.table.rows.map(r => r.map(AG.plain))) : "");
  }

  // Eine Aufgabe erzeugen (ohne Duplikatprüfung)
  function generateTask(type, level, seedStr) {
    const rng = AG.makeRng(seedStr);
    const task = type.generate(rng, level);
    if (!task || !task.q || !task.a) throw new Error(type.id + ": generate() muss {q, a} liefern");
    return task;
  }

  // Arbeitsblatt erzeugen. config siehe defaultConfig().
  function generateSheet(config, group) {
    const seen = new Set();
    const parts = config.parts.map((p, pi) => {
      const type = BY_ID[p.type];
      if (!type) throw new Error("Unbekannter Aufgabentyp: " + p.type);
      const tasks = [];
      for (let ti = 0; ti < p.count; ti++) {
        const reroll = (config.rerolls && config.rerolls[group + "." + pi + "." + ti]) || 0;
        let task = null;
        for (let attempt = 0; attempt < 60; attempt++) {
          const t = generateTask(type, p.level, [config.seed, group, pi, ti, reroll, attempt, p.type, p.level].join("|"));
          const key = taskKey(t);
          if (!seen.has(key)) { seen.add(key); task = t; break; }
        }
        if (!task) task = generateTask(type, p.level, [config.seed, group, pi, ti, reroll, "x"].join("|"));
        tasks.push(task);
      }
      return {
        label: String.fromCharCode(65 + pi),
        level: p.level,
        type,
        title: p.title || type.title,
        instruction: p.instruction || instructionFor(type, p.level),
        cols: p.cols || type.cols,
        tasks,
      };
    });
    return { group, parts };
  }

  // ---------- Blatt-Code: komplette Einstellung als kurze Zeichenkette ----------
  // Aufbau: 1-7M-4821-<teil>_<teil>..[-<neu gewürfelt>]
  //   teil = <typkürzel><niveau><anzahl als Buchstabe a=1..>[<spalten>]
  //   typkürzel = 4 Zeichen aus dem Hash der Typ-id
  function typeShort(id) { return AG.hash(id).toString(36).padStart(7, "0").slice(-4); }

  function encodeCode(config) {
    const parts = config.parts.map(p =>
      typeShort(p.type) + p.level + String.fromCharCode(96 + p.count) + (p.cols ? p.cols : ""));
    const rr = Object.entries(config.rerolls || {}).filter(([, n]) => n > 0)
      .map(([k, n]) => k.replace(/\./g, "") + (n > 1 ? "x" + n : ""));
    return ["1", config.klasse + config.zug, config.seed, parts.join("_")].concat(rr.length ? [rr.join("_")] : []).join("-");
  }
  function decodeCode(code) {
    const bits = code.trim().split("-");
    if (bits[0] !== "1" || bits.length < 4) throw new Error("Das ist kein gültiger Blatt-Code.");
    const klasse = bits[1].replace(/\D/g, ""), zug = bits[1].replace(/\d/g, "");
    const parts = bits[3].split("_").map(s => {
      const m = /^([0-9a-z]{4})(\d)([a-z])(\d?)$/.exec(s);
      if (!m) throw new Error("Blatt-Code beschädigt: " + s);
      const type = TYPES.find(t => typeShort(t.id) === m[1]);
      if (!type) throw new Error("Aufgabentyp aus dem Code ist in dieser Version nicht vorhanden.");
      return { type: type.id, level: Number(m[2]), count: m[3].charCodeAt(0) - 96, cols: m[4] ? Number(m[4]) : undefined };
    });
    const rerolls = {};
    if (bits[4]) for (const s of bits[4].split("_")) {
      const m = /^([AB])(\d)(\d+?)(?:x(\d+))?$/.exec(s);
      if (m) rerolls[m[1] + "." + m[2] + "." + m[3]] = m[4] ? Number(m[4]) : 1;
    }
    return { klasse, zug, seed: Number(bits[2]), parts, rerolls };
  }

  AG.TYPES = TYPES;
  AG.typeById = id => BY_ID[id];
  AG.registerType = registerType;
  AG.generateSheet = generateSheet;
  AG.generateTask = generateTask;
  AG.encodeCode = encodeCode;
  AG.decodeCode = decodeCode;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
