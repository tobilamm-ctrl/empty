// M6 LB 3: Geometrische Figuren, Körper und Lagebeziehungen – Viereckarten, Koordinaten in allen vier
// Quadranten, Körper benennen und beschreiben (Schrägbilder), Würfelnetze.
// Typen: m6-viereckarten, m6-koordinaten-4q, m6-koerper, m6-wuerfelnetz.
// Skizzen: Koordinatensystem wie m5-geometrie.js, Schrägbilder wie m7-prismen.js.
(function (AG) {
  const { rich, plain, fmtInt, MINUS, SKETCH_COLORS } = AG;
  const { INK, GREY, FILL } = SKETCH_COLORS;

  const sInt = n => fmtInt(n);
  const listDe = a => (a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " und " + a[a.length - 1]);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const NAMES = ["Lea", "Max", "Tim", "Sophie", "Jonas", "Mia"];
  const NZ = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

  // ================= 1. Viereckarten =================
  // Eigenschaften, die für JEDES Viereck der Art gelten (Haus der Vierecke). Nur positive Aussagen.
  const VK = ["Quadrat", "Rechteck", "Raute", "Parallelogramm", "Trapez", "Drachen"];
  const ART = { Quadrat: "das", Rechteck: "das", Raute: "die", Parallelogramm: "das", Trapez: "das", Drachen: "den" };
  const JEDES = { Quadrat: "jedes Quadrat", Rechteck: "jedes Rechteck", Raute: "jede Raute", Parallelogramm: "jedes Parallelogramm", Trapez: "jedes Trapez", Drachen: "jeden Drachen" };
  const PROPS = [
    { t: "Alle vier Seiten sind gleich lang.", in: ["Quadrat", "Raute"] },
    { t: "Gegenüberliegende Seiten sind gleich lang.", in: ["Quadrat", "Rechteck", "Raute", "Parallelogramm"] },
    { t: "Alle vier Winkel sind rechte Winkel.", in: ["Quadrat", "Rechteck"] },
    { t: "Gegenüberliegende Seiten sind parallel.", in: ["Quadrat", "Rechteck", "Raute", "Parallelogramm"] },
    { t: "Mindestens zwei Seiten sind parallel.", in: ["Quadrat", "Rechteck", "Raute", "Parallelogramm", "Trapez"] },
    { t: "Die Diagonalen stehen senkrecht aufeinander.", in: ["Quadrat", "Raute", "Drachen"] },
    { t: "Die Diagonalen sind gleich lang.", in: ["Quadrat", "Rechteck"] },
    { t: "Es gibt zwei Paare benachbarter Seiten, die gleich lang sind.", in: ["Quadrat", "Raute", "Drachen"] },
    { t: "Die Diagonalen halbieren sich gegenseitig.", in: ["Quadrat", "Rechteck", "Raute", "Parallelogramm"] },
  ];
  // eindeutige Beschreibungen (je Art mehrere Fassungen)
  const DESC = {
    Quadrat: [["Alle vier Seiten sind gleich lang.", "Alle vier Winkel sind rechte Winkel."],
      ["Die Diagonalen sind gleich lang.", "Die Diagonalen stehen senkrecht aufeinander."]],
    Rechteck: [["Alle vier Winkel sind rechte Winkel.", "Benachbarte Seiten sind verschieden lang."],
      ["Die Diagonalen sind gleich lang und halbieren sich gegenseitig.", "Die Diagonalen stehen nicht senkrecht aufeinander."]],
    Raute: [["Alle vier Seiten sind gleich lang.", "Es gibt keinen rechten Winkel."],
      ["Die Diagonalen stehen senkrecht aufeinander und halbieren sich gegenseitig.", "Die Diagonalen sind verschieden lang."]],
    Parallelogramm: [["Gegenüberliegende Seiten sind parallel.", "Es gibt keinen rechten Winkel.", "Benachbarte Seiten sind verschieden lang."],
      ["Die Diagonalen halbieren sich gegenseitig.", "Die Diagonalen sind verschieden lang und stehen nicht senkrecht aufeinander."]],
    Trapez: [["Genau zwei Seiten sind parallel, die beiden anderen nicht."]],
    Drachen: [["Es gibt zwei Paare benachbarter Seiten, die gleich lang sind.", "Nicht alle vier Seiten sind gleich lang."],
      ["Die Diagonalen stehen senkrecht aufeinander.", "Nur eine der beiden Diagonalen wird halbiert."]],
  };
  // Teilmengen im Haus der Vierecke: SUB[A] = Arten, zu denen jedes A auch gehört (ohne Trapez – Definitionen unterscheiden sich)
  const SUB = { Quadrat: ["Rechteck", "Raute", "Parallelogramm", "Drachen"], Rechteck: ["Parallelogramm"], Raute: ["Parallelogramm", "Drachen"], Parallelogramm: [], Drachen: [] };
  const WHY_NOT = {
    Rechteck: "nicht alle Seiten sind gleich lang", Raute: "es muss keine rechten Winkel geben", Parallelogramm: "die Winkel müssen keine rechten Winkel sein",
    Drachen: "gegenüberliegende Seiten müssen nicht parallel sein", Quadrat: "Seiten oder Winkel können verschieden sein",
  };
  const NOM = { Quadrat: "jedes Quadrat", Rechteck: "jedes Rechteck", Raute: "jede Raute", Parallelogramm: "jedes Parallelogramm", Drachen: "jeder Drachen" };
  const EIN = { Quadrat: "ein Quadrat", Rechteck: "ein Rechteck", Raute: "eine Raute", Parallelogramm: "ein Parallelogramm", Drachen: "ein Drachen" };
  const DAT = { Quadrat: "einem Quadrat", Rechteck: "einem Rechteck", Raute: "einer Raute", Parallelogramm: "einem Parallelogramm", Drachen: "einem Drachen" };
  const INTRO1 = ["Welches Viereck ist gemeint?", ...NAMES.map(n => `${n} beschreibt ein Viereck. Welches ist es?`)];
  const KEYPROP = { Quadrat: "vier gleich lange Seiten und vier rechte Winkel", Rechteck: "vier rechte Winkel", Raute: "vier gleich lange Seiten", Parallelogramm: "gegenüberliegende Seiten sind parallel", Drachen: "zwei Paare benachbarter gleich langer Seiten" };
  const lines = arr => rich(arr.map((t, i) => [{ br: true }, (i < 9 ? "" : "") + t]));

  function vkLevel1(rng) {
    const art = rng.pick(VK), d = rng.shuffle(rng.pick(DESC[art]).slice());
    return {
      q: rich(rng.pick(INTRO1), ...d.map(t => [{ br: true }, "• " + t])),
      a: rich(art),
      steps: [rich("Passt zu allen Aussagen: ", art, ".")],
      check: { exp: art },
    };
  }
  function vkLevel2(rng) {
    const art = rng.pick(VK);
    for (let i = 0; i < 200; i++) {
      const sel = rng.shuffle(PROPS.slice()).slice(0, 4);
      const right = sel.map((p, k) => (p.in.includes(art) ? k + 1 : 0)).filter(Boolean);
      if (!right.length || (right.length === 4 && art !== "Quadrat")) continue;
      const exp = right.length === 1 ? `Richtig ist nur Aussage ${right[0]}.` : `Richtig sind die Aussagen ${listDe(right.map(String))}.`;
      return {
        q: rich(`Welche Aussagen gelten für ${JEDES[art]}? Nenne die Nummern.`, ...sel.map((p, k) => [{ br: true }, `(${k + 1}) ${p.t}`])),
        a: rich(exp),
        steps: sel.map((p, k) => rich(`(${k + 1}) `, p.in.includes(art) ? "gilt" : "gilt nicht", ` für ${JEDES[art]}.`)),
        check: { exp },
      };
    }
    throw new Error("m6-viereckarten: keine Auswahl gefunden");
  }
  function vkLevel3(rng) {
    const A = rng.pick(Object.keys(SUB));
    const B = rng.pick(Object.keys(SUB).filter(x => x !== A));
    const ok = SUB[A].includes(B);
    const who = rng.pick(NAMES);
    const exp = ok ? "Die Behauptung stimmt." : "Die Behauptung stimmt nicht.";
    const why = ok
      ? `${NOM[A].charAt(0).toUpperCase() + NOM[A].slice(1)} hat ${KEYPROP[B]}. Also ist ${NOM[A]} auch ${EIN[B]}.`
      : `Nicht ${NOM[A]} hat ${KEYPROP[B]}. Also ist nicht ${NOM[A]} ${EIN[B]}.`;
    return {
      q: rich(`${who} behauptet: „${NOM[A].charAt(0).toUpperCase() + NOM[A].slice(1)} ist ${EIN[B]}.“ Stimmt das? Begründe.`),
      a: rich(exp),
      steps: [rich(why)],
      check: { exp },
    };
  }

  AG.registerType({
    id: "m6-viereckarten",
    klasse: "6",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren, Körper und Lagebeziehungen",
    title: "Viereckarten bestimmen",
    topic: "winkel",
    instruction: {
      1: "Welches Viereck passt zu allen Aussagen? Schreibe den Namen.",
      2: "Welche Aussagen gelten immer? Schreibe die Nummern auf.",
      3: "Stimmt die Behauptung? Begründe mit den Eigenschaften der Vierecke.",
    },
    merke: [
      { b: "Quadrat" }, ": alle Seiten gleich lang, vier rechte Winkel. ", { b: "Rechteck" }, ": vier rechte Winkel. ",
      { b: "Raute" }, ": alle Seiten gleich lang. ", { b: "Parallelogramm" }, ": gegenüberliegende Seiten parallel. ",
      { b: "Trapez" }, ": zwei Seiten parallel. ", { b: "Drachen" },
      ": zwei Paare benachbarter gleich langer Seiten, Diagonalen senkrecht.",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return vkLevel1(rng);
      if (level === 2) return vkLevel2(rng);
      return vkLevel3(rng);
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 2. Koordinaten in allen vier Quadranten =================
  const KSC = 5, KML = 7, KMT = 5, KMB = 5, KMR = 7;      // mm je Einheit und Ränder
  const KW = KML + 10 * KSC + KMR, KH = KMT + 10 * KSC + KMB;
  const KP = (x, y) => [KML + (x + 5) * KSC, KMT + (5 - y) * KSC];

  // Koordinatensystem von −5 bis 5. pts: Punkte mit name, x, y. o.edges: Strecken [i, j]; o.guides: Lote zu den Achsen
  function gridFig(pts, o = {}) {
    const s = AG.sketch(KW, KH);
    for (let v = -5; v <= 5; v++) {
      if (v === 0) continue;
      s.line(KP(v, -5), KP(v, 5), { stroke: GREY, width: 0.12 });
      s.line(KP(-5, v), KP(5, v), { stroke: GREY, width: 0.12 });
    }
    s.line(KP(-5, 0), KP(5, 0), { width: 0.4 });
    s.line(KP(0, -5), KP(0, 5), { width: 0.4 });
    const ax = KP(5, 0), ay = KP(0, 5);
    s.poly([[ax[0] + 2, ax[1]], [ax[0] - 0.4, ax[1] - 1], [ax[0] - 0.4, ax[1] + 1]], { fill: INK, stroke: INK, width: 0.1 });
    s.poly([[ay[0], ay[1] - 2], [ay[0] - 1, ay[1] + 0.4], [ay[0] + 1, ay[1] + 0.4]], { fill: INK, stroke: INK, width: 0.1 });
    for (let v = -5; v <= 5; v++) {
      if (v === 0) continue;
      const p = KP(v, 0), q = KP(0, v);
      s.label([p[0], p[1] + 3.6], sInt(v), { size: 2.9 });
      s.label([q[0] - 1.4, q[1]], sInt(v), { anchor: "end", size: 2.9 });
    }
    const o0 = KP(0, 0);
    s.label([o0[0] - 1.2, o0[1] + 3.6], "0", { anchor: "end", size: 2.9 });
    s.label([KW - 1.5, o0[1] - 3], "x", { anchor: "end" });
    s.label([ay[0] + 2.2, 2.5], "y", { anchor: "start" });
    for (const [i, j] of o.edges || []) s.line(KP(pts[i].x, pts[i].y), KP(pts[j].x, pts[j].y), { width: 0.5 });
    for (const p of pts) {
      const q = KP(p.x, p.y);
      if (o.guides) { s.line(q, KP(p.x, 0), { dash: true }); s.line(q, KP(0, p.y), { dash: true }); }
      s.circle(q, 0.9, { fill: INK });
      s.label([q[0] + 2.6, q[1] - 2.6], p.name, { anchor: "start", bold: true });
    }
    return s.done();
  }

  const QUADRANT = (x, y) => (x > 0 ? (y > 0 ? "I" : "IV") : (y > 0 ? "II" : "III"));

  // Niveau 1: Koordinaten der Punkte ablesen (Punkte nur in der Skizze, Koordinaten nicht im Text)
  function koLevel1(rng) {
    const n = rng.pick([2, 3]);
    const letters = rng.shuffle("ABCDEFGHIJKLMNOPRSTUVWXYZ".split("")).slice(0, n);
    const pts = [];
    for (let i = 0; pts.length < n && i < 500; i++) {
      const x = rng.pick(NZ), y = rng.pick(NZ);
      if (pts.some(p => p.x === x && p.y === y)) continue;
      pts.push({ name: letters[pts.length], x, y });
    }
    if (pts.length < n) throw new Error("Koordinaten: zu wenige Punkte");
    const exp = pts.map(p => `${p.name}(${sInt(p.x)} | ${sInt(p.y)})`).join("; ");
    return {
      q: rich(`Lies die Koordinaten der Punkte ${listDe(pts.map(p => p.name))} ab. Schreibe sie so: ${pts[0].name}(x | y).`),
      a: rich(exp),
      steps: pts.map(p => rich(`${p.name}: x = ${sInt(p.x)} (${p.x < 0 ? "links" : "rechts"} von der y-Achse), `
        + `y = ${sInt(p.y)} (${p.y < 0 ? "unter" : "über"} der x-Achse). Also ${p.name}(${sInt(p.x)} | ${sInt(p.y)}).`)),
      fig: gridFig(pts),
      aFig: gridFig(pts, { guides: true }),
      inline: false,
      check: { lvl: 1, exp },
    };
  }

  // Niveau 2: Quadrant eines Punktes angeben oder einen Punkt an einer Achse spiegeln
  function koLevel2(rng) {
    const x = rng.pick(NZ), y = rng.pick(NZ);
    if (rng.chance(0.5)) {
      const Q = QUADRANT(x, y);
      return {
        q: rich(`In welchem Quadranten liegt der Punkt P(${sInt(x)} | ${sInt(y)})? Antworte mit der römischen Zahl (I, II, III oder IV).`),
        a: rich(Q),
        steps: [
          rich(`x = ${sInt(x)} ist ${x < 0 ? "negativ (links)" : "positiv (rechts)"}, `
            + `y = ${sInt(y)} ist ${y < 0 ? "negativ (unten)" : "positiv (oben)"}.`),
          rich(`Also liegt P im Quadranten ${Q}.`),
        ],
        inline: false,
        check: { lvl: 2, exp: Q },
      };
    }
    const axis = rng.pick(["x", "y"]);
    const img = axis === "x" ? { x, y: -y } : { x: -x, y };
    const exp = `P′(${sInt(img.x)} | ${sInt(img.y)})`;
    const steps = axis === "x"
      ? [
        rich(`Spiegelung an der x-Achse: Der x-Wert bleibt gleich, x = ${sInt(x)}.`),
        rich(`Der y-Wert wechselt das Vorzeichen: ${sInt(y)} wird zu ${sInt(-y)}.`),
      ]
      : [
        rich(`Spiegelung an der y-Achse: Der y-Wert bleibt gleich, y = ${sInt(y)}.`),
        rich(`Der x-Wert wechselt das Vorzeichen: ${sInt(x)} wird zu ${sInt(-x)}.`),
      ];
    return {
      q: rich(`Spiegle den Punkt P(${sInt(x)} | ${sInt(y)}) an der ${axis}-Achse. Gib die Koordinaten des Bildpunkts P′ an.`),
      a: rich(exp),
      steps: [...steps, rich(`Also ${exp}.`)],
      fig: gridFig([{ name: "P", x, y }]),
      inline: false,
      check: { lvl: 2, exp },
    };
  }

  // Niveau 3: Rechteck oder Quadrat ABCD mit gegebenen Punkten A, B, C (D ist nicht eingezeichnet)
  function koLevel3(rng) {
    for (let tries = 0; tries < 300; tries++) {
      const square = rng.chance(0.4);
      const s = rng.int(2, 6), t = square ? s : rng.intExcept(2, 6, [s]);
      const x0 = rng.int(-5, 5 - s), y0 = rng.int(-5, 5 - t);
      const A = { name: "A", x: x0, y: y0 }, B = { name: "B", x: x0 + s, y: y0 };
      const C = { name: "C", x: x0 + s, y: y0 + t }, D = { name: "D", x: x0, y: y0 + t };
      const exp = `D(${sInt(D.x)} | ${sInt(D.y)})`;
      return {
        q: rich(`Die Punkte A(${sInt(A.x)} | ${sInt(A.y)}), B(${sInt(B.x)} | ${sInt(B.y)}) und C(${sInt(C.x)} | ${sInt(C.y)}) `
          + `sind Eckpunkte eines ${square ? "Quadrats" : "Rechtecks"} ABCD. Gib die Koordinaten des Punktes D an.`),
        a: rich(exp),
        steps: [
          rich(`AB ist waagerecht: Die y-Werte sind gleich (${sInt(A.y)}).`),
          rich(`Länge AB: ${sInt(B.x)} ${MINUS} (${sInt(A.x)}) = ${s} Einheiten.`),
          rich(`BC ist senkrecht: Die x-Werte sind gleich (${sInt(C.x)}).`),
          rich(`Länge BC: ${sInt(C.y)} ${MINUS} (${sInt(B.y)}) = ${t} Einheiten.`),
          rich(`D hat den x-Wert von A (${sInt(A.x)}) und den y-Wert von C (${sInt(C.y)}).`),
          rich(`Also ${exp}.`),
        ],
        fig: gridFig([A, B, C], { edges: [[0, 1], [1, 2]] }),
        aFig: gridFig([A, B, C, D], { edges: [[0, 1], [1, 2], [2, 3], [3, 0]], guides: true }),
        inline: false,
        check: { lvl: 3, exp },
      };
    }
    throw new Error("Koordinaten: kein Rechteck gefunden");
  }

  AG.registerType({
    id: "m6-koordinaten-4q",
    klasse: "6",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren, Körper und Lagebeziehungen",
    title: "Koordinaten in allen vier Quadranten",
    topic: "winkel",
    instruction: {
      1: "Lies die Koordinaten der Punkte ab. Negative Werte liegen links der y-Achse bzw. unter der x-Achse.",
      2: "Bestimme den Quadranten oder spiegle den Punkt. Achte auf die Vorzeichen.",
      3: "Ergänze den fehlenden Eckpunkt des Rechtecks bzw. Quadrats.",
    },
    merke: [
      "Die Achsen teilen die Ebene in ", { b: "vier Quadranten" }, " (I rechts oben, II links oben, III links unten, IV rechts unten). ",
      "Spiegelung an der x-Achse: y-Wert wechselt das Vorzeichen. Spiegelung an der y-Achse: x-Wert wechselt das Vorzeichen. "
      + "Beispiel: P(−2 | 3) an der y-Achse gespiegelt ist P′(2 | 3).",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return koLevel1(rng);
      if (level === 2) return koLevel2(rng);
      return koLevel3(rng);
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 3. Körper (Schrägbilder) =================
  const DEPTH = [9, 6];      // Tiefe im Schrägbild: nach hinten oben rechts (Mathe-Koordinaten, y nach oben)
  const ellipse = (cx, cy, rx, ry, a0, a1, n) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; out.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]); }
    return out;
  };

  // Gerades Prisma mit Vorderfläche F (CCW, Mathe-Koordinaten) und Tiefe o.
  // Seitenfläche sichtbar, wenn ihre Außennormale in Tiefenrichtung zeigt; verdeckte Kanten gestrichelt.
  function prismPrims(F, o) {
    const n = F.length, B = F.map(p => [p[0] + o[0], p[1] + o[1]]);
    const vis = F.map((p, i) => {
      const q = F[(i + 1) % n], d = [q[0] - p[0], q[1] - p[1]], nr = [d[1], -d[0]];
      return nr[0] * o[0] + nr[1] * o[1] > 1e-9;
    });
    const prims = [{ t: "poly", pts: F, fill: true }];
    for (let i = 0; i < n; i++) prims.push({ t: "line", pts: [B[i], B[(i + 1) % n]], dash: !vis[i] });
    for (let j = 0; j < n; j++) prims.push({ t: "line", pts: [F[j], B[j]], dash: !(vis[j] || vis[(j - 1 + n) % n]) });
    return prims;
  }

  // Quadratische Pyramide: Grundfläche liegt waagerecht, Spitze über der Mitte
  function pyramidPrims(s, hgt) {
    const FL = [0, 0], FR = [s, 0], BR = [s + DEPTH[0], DEPTH[1]], BL = [DEPTH[0], DEPTH[1]];
    const S = [s / 2 + DEPTH[0] / 2, DEPTH[1] / 2 + hgt];
    return [
      { t: "poly", pts: [S, FL, FR], fill: true },
      { t: "poly", pts: [S, FR, BR], fill: true },
      { t: "line", pts: [FL, FR] }, { t: "line", pts: [FR, BR] },
      { t: "line", pts: [BR, BL], dash: true }, { t: "line", pts: [BL, FL], dash: true },
      { t: "line", pts: [S, FL] }, { t: "line", pts: [S, FR] }, { t: "line", pts: [S, BR] },
      { t: "line", pts: [S, BL], dash: true },
    ];
  }

  // Zylinder: Grundkreis unten, Deckfläche oben (Ellipsen); verdeckte Teile gestrichelt
  function cylPrims(rx, H) {
    const ry = Math.round(rx * 4) / 10;
    const top = ellipse(0, H, rx, ry, 0, 2 * Math.PI, 72);
    return [
      { t: "poly", pts: top, fill: true },
      { t: "line", pts: [[-rx, 0], [-rx, H]] }, { t: "line", pts: [[rx, 0], [rx, H]] },
      { t: "path", pts: ellipse(0, 0, rx, ry, Math.PI, 2 * Math.PI, 36) },
      { t: "path", pts: ellipse(0, 0, rx, ry, 0, Math.PI, 36), dash: true },
    ];
  }

  // Kegel: Grundkreis unten, Spitze über der Mitte
  function konePrims(rx, H) {
    const ry = Math.round(rx * 4) / 10;
    return [
      { t: "poly", pts: [[0, H], ...ellipse(0, 0, rx, ry, Math.PI, 2 * Math.PI, 36)], fill: true },
      { t: "line", pts: [[0, H], [-rx, 0]] }, { t: "line", pts: [[0, H], [rx, 0]] },
      { t: "path", pts: ellipse(0, 0, rx, ry, Math.PI, 2 * Math.PI, 36) },
      { t: "path", pts: ellipse(0, 0, rx, ry, 0, Math.PI, 36), dash: true },
    ];
  }

  // Kugel mit Äquator (vorne durchgezogen, hinten gestrichelt)
  function kugelPrims(r) {
    return [
      { t: "poly", pts: ellipse(0, r, r, r, 0, 2 * Math.PI, 96), fill: true },
      { t: "path", pts: ellipse(0, r, r, r * 0.25, Math.PI, 2 * Math.PI, 36) },
      { t: "path", pts: ellipse(0, r, r, r * 0.25, 0, Math.PI, 36), dash: true },
    ];
  }

  // Alle Primitive in mm (y nach unten) mittig in 46 × 42 mm
  function drawBody(prims) {
    const all = prims.flatMap(p => p.pts);
    const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
    const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
    const W = 46, H = 42;
    const ox = (W - (maxX - minX)) / 2 - minX, oy = (H - (maxY - minY)) / 2 + maxY;
    const T = p => [ox + p[0], oy - p[1]];
    const s = AG.sketch(W, H);
    for (const p of prims) {
      const q = p.pts.map(T);
      if (p.t === "poly") s.poly(q, { fill: p.fill ? FILL : false });
      else if (p.t === "line") s.line(q[0], q[1], { dash: p.dash });
      else s.path("M" + q.map(v => v[0].toFixed(2) + "," + v[1].toFixed(2)).join(" L"), { dash: p.dash });
    }
    return s.done();
  }

  // Körper mit Eigenschaften (feat: null = nicht sinnvoll zählbar, z. B. Spitze beim Kegel)
  const FEAT_KEYS = ["ecken", "kreis", "krumm", "dreieck", "quadrat", "rechteck"];
  const FEAT_TXT = {
    ecken: v => (v === 0 ? "keine Ecken" : v === 1 ? "eine Ecke" : `${v} Ecken`),
    kreis: v => (v === 0 ? "keine Kreisfläche" : v === 1 ? "eine Kreisfläche" : "zwei Kreisflächen"),
    krumm: v => (v === 0 ? "keine gekrümmte Fläche" : "eine gekrümmte Fläche"),
    dreieck: v => (v === 0 ? "keine dreieckige Fläche" : v === 2 ? "zwei dreieckige Flächen" : "vier dreieckige Flächen"),
    quadrat: v => (v === 0 ? "keine quadratische Fläche" : v === 1 ? "eine quadratische Fläche" : "sechs quadratische Flächen"),
    rechteck: v => (v === 0 ? "keine rechteckige Fläche" : v === 1 ? "eine rechteckige Fläche" : v === 3 ? "drei rechteckige Flächen" : "sechs rechteckige Flächen"),
  };
  const KOERPER = [
    {
      name: "Würfel", poly: true,
      feat: { ecken: 8, kreis: 0, krumm: 0, dreieck: 0, quadrat: 6, rechteck: 6 },
      cnt: { Ecken: [8, "4 Ecken oben + 4 Ecken unten = 8"], Kanten: [12, "4 Kanten oben + 4 Kanten unten + 4 senkrechte Kanten = 12"],
        Flächen: [6, "2 Quadrate (oben und unten) + 4 Seitenflächen = 6"] },
      step: "Alle sechs Flächen sind gleich große Quadrate.",
      draw: rng => { const a = rng.int(18, 22); return prismPrims([[0, 0], [a, 0], [a, a], [0, a]], DEPTH); },
    },
    {
      name: "Quader", poly: true,
      feat: { ecken: 8, kreis: 0, krumm: 0, dreieck: 0, quadrat: 0, rechteck: 6 },
      cnt: { Ecken: [8, "4 Ecken oben + 4 Ecken unten = 8"], Kanten: [12, "4 Kanten oben + 4 Kanten unten + 4 senkrechte Kanten = 12"],
        Flächen: [6, "2 Rechtecke (oben und unten) + 4 Seitenflächen = 6"] },
      step: "Die sechs Flächen sind Rechtecke, gegenüberliegende Flächen sind gleich groß.",
      draw: rng => { const w = rng.int(24, 30), h = rng.int(13, 17); return prismPrims([[0, 0], [w, 0], [w, h], [0, h]], DEPTH); },
    },
    {
      name: "Dreiseitiges Prisma", poly: true,
      feat: { ecken: 6, kreis: 0, krumm: 0, dreieck: 2, quadrat: 0, rechteck: 3 },
      cnt: { Ecken: [6, "3 Ecken oben + 3 Ecken unten = 6"], Kanten: [9, "3 Kanten oben + 3 Kanten unten + 3 senkrechte Kanten = 9"],
        Flächen: [5, "2 Dreiecke (vorne und hinten) + 3 Rechtecke = 5"] },
      step: "Zwei gleiche Dreiecke und drei Rechtecke begrenzen den Körper.",
      draw: rng => {
        const w = rng.int(24, 30), h = rng.int(16, 20), a = rng.int(Math.round(w * 0.25), Math.round(w * 0.75));
        return prismPrims([[0, 0], [w, 0], [a, h]], DEPTH);
      },
    },
    {
      name: "Quadratische Pyramide", poly: true,
      feat: { ecken: 5, kreis: 0, krumm: 0, dreieck: 4, quadrat: 1, rechteck: 1 },
      cnt: { Ecken: [5, "4 Ecken der Grundfläche + 1 Spitze = 5"], Kanten: [8, "4 Kanten der Grundfläche + 4 Seitenkanten zur Spitze = 8"],
        Flächen: [5, "1 Grundfläche + 4 Dreiecke = 5"] },
      step: "Eine quadratische Grundfläche und vier dreieckige Seitenflächen, die in einer Spitze zusammenlaufen.",
      draw: rng => pyramidPrims(rng.int(18, 22), rng.int(20, 26)),
    },
    {
      name: "Zylinder", poly: false,
      feat: { ecken: 0, kreis: 2, krumm: 1, dreieck: 0, quadrat: 0, rechteck: 0 },
      step: "Zwei Kreisflächen und eine gekrümmte Fläche.",
      draw: rng => cylPrims(rng.int(9, 12), rng.int(20, 26)),
    },
    {
      name: "Kegel", poly: false,
      feat: { ecken: null, kreis: 1, krumm: 1, dreieck: 0, quadrat: 0, rechteck: 0 },
      step: "Eine Kreisfläche, eine gekrümmte Fläche und eine Spitze.",
      draw: rng => konePrims(rng.int(9, 12), rng.int(22, 26)),
    },
    {
      name: "Kugel", poly: false,
      feat: { ecken: 0, kreis: 0, krumm: 1, dreieck: 0, quadrat: 0, rechteck: 0 },
      step: "Nur eine gekrümmte Fläche, keine Ecken und keine Kanten.",
      draw: rng => kugelPrims(rng.int(10, 13)),
    },
  ];
  const KBY = Object.fromEntries(KOERPER.map(b => [b.name, b]));
  const KINTRO = ["", ...NAMES.map(n => `${n} hat diesen Körper gezeichnet.`)];
  const KQ = ["Welcher Körper ist abgebildet?", "Wie heißt der Körper in der Skizze?", "Benenne den abgebildeten Körper."];
  const KEND = ["Schreibe den Namen auf.", "Antworte mit einem Wort."];

  // Niveau 1: Name des Körpers aus dem Schrägbild
  function koerperLevel1(rng) {
    const b = rng.pick(KOERPER);
    const fig = drawBody(b.draw(rng));
    const q = [rng.pick(KINTRO), rng.pick(KQ), rng.pick(KEND)].filter(Boolean).join(" ");
    return {
      q: rich(q),
      a: rich(b.name),
      steps: [rich(b.step), rich(`Also: ${b.name}.`)],
      fig,
      inline: false,
      check: { lvl: 1, exp: b.name },
    };
  }

  // Niveau 2: Anzahl der Ecken, Kanten oder Flächen eines abgebildeten Vielflachs
  function koerperLevel2(rng) {
    const poly = KOERPER.filter(b => b.poly);
    const b = rng.pick(poly);
    const word = rng.pick(["Ecken", "Kanten", "Flächen"]);
    const [n, how] = b.cnt[word];
    const fig = drawBody(b.draw(rng));
    const q = [rng.pick(KINTRO), rng.pick([`Wie viele ${word} hat der abgebildete Körper?`, `Zähle die ${word} des Körpers.`, `Gib die Anzahl der ${word} an.`])].filter(Boolean).join(" ");
    return {
      q: rich(q),
      a: rich(String(n)),
      steps: [rich(`${word}: ${how}.`), rich(`Der Körper ist ein ${b.name}.`)],
      fig,
      inline: false,
      check: { lvl: 2, exp: String(n) },
    };
  }

  // Niveau 3: Körper aus einer Beschreibung erkennen
  function koerperLevel3(rng) {
    for (let tries = 0; tries < 300; tries++) {
      const b = rng.pick(KOERPER);
      const keys = FEAT_KEYS.filter(k => b.feat[k] !== null && !(k === "quadrat" && b.feat[k] === 0));
      const chosen = rng.shuffle(keys).slice(0, rng.pick([2, 3]));
      const match = KOERPER.filter(o => chosen.every(k => o.feat[k] !== null && o.feat[k] === b.feat[k]));
      if (match.length !== 1) continue;
      const parts = chosen.map(k => FEAT_TXT[k](b.feat[k]));
      return {
        q: rich(`Welcher Körper ist beschrieben? Er hat ${listDe(parts)}.`),
        a: rich(b.name),
        steps: [
          ...chosen.map(k => rich(`„${FEAT_TXT[k](b.feat[k])}“ passt zu: `
            + `${listDe(KOERPER.filter(o => o.feat[k] !== null && o.feat[k] === b.feat[k]).map(o => o.name))}.`)),
          rich(`Alle Merkmale passen nur zu: ${b.name}.`),
        ],
        inline: false,
        check: { lvl: 3, exp: b.name },
      };
    }
    throw new Error("Körper: keine eindeutige Beschreibung gefunden");
  }

  AG.registerType({
    id: "m6-koerper",
    klasse: "6",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren, Körper und Lagebeziehungen",
    title: "Körper erkennen und beschreiben",
    topic: "koerper",
    instruction: {
      1: "Welcher Körper ist im Schrägbild abgebildet? Die gestrichelten Linien sind verdeckte Kanten.",
      2: "Zähle die Ecken, Kanten oder Flächen des abgebildeten Körpers.",
      3: "Welcher Körper passt zur Beschreibung? Denke an die Flächen, Ecken und gekrümmten Flächen.",
    },
    merke: [
      "Körper mit ebenen Flächen heißen ", { b: "Vielflache" }, " (Würfel, Quader, Prisma, Pyramide). ",
      "Runde Körper haben gekrümmte Flächen (Zylinder, Kegel, Kugel). ",
      "Beispiel: Ein Zylinder hat zwei Kreisflächen und eine gekrümmte Fläche, aber keine Ecken.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return koerperLevel1(rng);
      if (level === 2) return koerperLevel2(rng);
      return koerperLevel3(rng);
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ================= 4. Würfelnetze =================
  // Die 11 Würfelnetze als Gitter (X = Quadrat, Zeilen von oben nach unten)
  const NETZE = [
    ["X...", "XXXX", "X..."], ["X...", "XXXX", ".X.."], ["X...", "XXXX", "..X."], ["X...", "XXXX", "...X"],
    [".X..", "XXXX", ".X.."], [".X..", "XXXX", "..X."],
    ["XX..", ".XXX", ".X.."], ["XX..", ".XXX", "..X."], ["XX..", ".XXX", "...X"],
    ["XX..", ".XX.", "..XX"],
    ["XXX..", "..XXX"],
  ];
  // Nicht-Netze (zum Vergleich: vier in einer Reihe und zwei übereinander auf einer Seite, 2×3-Block)
  const KEINE_NETZE = [
    ["XXXX", "X...", "X..."], ["XXX", "XXX"], ["XXXX", ".X..", ".X.."], ["X.X.", "XXXX"],
    ["X...", "XXXX", "X.X."], ["XX..", "XX..", "..XX"],
  ];
  const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
  // Rollen des Würfels: Seite, auf die der Würfel rollt, wird unten; so ergibt sich, welche Fläche auf welches Quadrat fällt
  const ROLL = {
    E: s => ({ T: s.W, E: s.T, B: s.E, W: s.B, N: s.N, S: s.S }),
    W: s => ({ T: s.E, W: s.T, B: s.W, E: s.B, N: s.N, S: s.S }),
    S: s => ({ T: s.N, S: s.T, B: s.S, N: s.B, E: s.E, W: s.W }),
    N: s => ({ T: s.S, N: s.T, B: s.N, S: s.B, E: s.E, W: s.W }),
  };
  const FACE = ["T", "B", "N", "S", "E", "W"];
  const GEGEN = { T: "B", B: "T", N: "S", S: "N", E: "W", W: "E" };

  const gitter = rows => {
    const cells = [];
    rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "X") cells.push([c, r]); }));
    return cells;
  };
  // Falten per Rollen: liefert je Quadrat die Würfelfläche (T, B, N, S, E, W), ok nur wenn alle 6 Flächen verschieden sind
  function falten(cells) {
    const key = (c, r) => c + "," + r;
    const idx = new Map(cells.map((p, i) => [key(p[0], p[1]), i]));
    const st = new Array(cells.length).fill(null);
    st[0] = { T: "T", B: "B", N: "N", S: "S", E: "E", W: "W" };
    const queue = [0];
    while (queue.length) {
      const i = queue.shift();
      for (const d of ["E", "W", "S", "N"]) {
        const [dc, dr] = DIRS[d];
        const j = idx.get(key(cells[i][0] + dc, cells[i][1] + dr));
        if (j === undefined) continue;
        const want = ROLL[d](st[i]);
        if (!st[j]) { st[j] = want; queue.push(j); }
        else if (FACE.some(k => st[j][k] !== want[k])) return { ok: false, labels: null };
      }
    }
    const labels = st.map(s => s.B);
    return { ok: cells.length === 6 && new Set(labels).size === 6, labels };
  }

  // Zufälliges Sechs-Quadrat-Gebilde (zusammenhängend), das kein Netz ist
  function zufallsFigur(rng, maxC, maxR) {
    for (let t = 0; t < 400; t++) {
      const cells = [[0, 0]];
      for (let g = 0; cells.length < 6 && g < 300; g++) {
        const [c, r] = rng.pick(cells);
        const [dc, dr] = rng.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        const p = [c + dc, r + dr];
        if (cells.some(q => q[0] === p[0] && q[1] === p[1])) continue;
        cells.push(p);
      }
      if (cells.length !== 6) continue;
      const mc = Math.min(...cells.map(p => p[0])), mr = Math.min(...cells.map(p => p[1]));
      const norm = cells.map(([c, r]) => [c - mc, r - mr]);
      const w = Math.max(...norm.map(p => p[0])) + 1, h = Math.max(...norm.map(p => p[1])) + 1;
      if (w > maxC || h > maxR || falten(norm).ok) continue;
      return norm;
    }
    throw new Error("Würfelnetz: keine Figur gefunden");
  }

  // Skizze: Quadrate mit Rand; labels optional (Zahlen je Quadrat)
  function netzFig(cells, labels) {
    const maxC = Math.max(...cells.map(p => p[0])) + 1, maxR = Math.max(...cells.map(p => p[1])) + 1;
    const cs = Math.min(10, 64 / maxC, 38 / maxR);
    const s = AG.sketch(maxC * cs + 6, maxR * cs + 6);
    cells.forEach(([c, r], i) => {
      const x = 3 + c * cs, y = 3 + r * cs;
      s.rect(x, y, cs, cs);
      if (labels) s.label([x + cs / 2, y + cs / 2], labels[i], { size: 4.6, bold: true });
    });
    return s.done();
  }

  const NETZ_Q = ["Ist das ein Würfelnetz?", "Lässt sich diese Figur zu einem Würfel falten?",
    "Kann man aus diesem Muster einen Würfel falten?", "Ist die Figur ein Würfelnetz?"];
  const NETZ_END = ["Antworte mit Ja oder Nein.", "Entscheide: Ja oder Nein?"];
  const NETZ_INTRO = ["", ...NAMES.map(n => `${n} hat dieses Muster gezeichnet.`)];

  // Niveau 1 und 2: Ja/Nein, ob die Figur ein Würfelnetz ist. Niveau 2 mit schwierigeren Fehlern
  function netzLevel12(rng, level) {
    const valid = rng.chance(0.5);
    let cells;
    if (valid) cells = gitter(rng.pick(NETZE));
    else if (level === 1 && rng.chance(0.4)) cells = gitter(rng.pick(KEINE_NETZE));
    else if (level === 1) cells = zufallsFigur(rng, 6, 6);
    else cells = zufallsFigur(rng, 4, 3);
    if (falten(cells).ok !== valid) throw new Error("Würfelnetz: Prüfung stimmt nicht");
    const q = [rng.pick(NETZ_INTRO), rng.pick(NETZ_Q), "Die Figur besteht aus sechs gleich großen Quadraten.", rng.pick(NETZ_END)]
      .filter(Boolean).join(" ");
    return {
      q: rich(q),
      a: rich(valid ? "Ja" : "Nein"),
      steps: valid
        ? [rich("Die sechs Quadrate lassen sich zu einem Würfel falten, ohne dass sich zwei überlappen."), rich("Also ist es ein Würfelnetz: Ja.")]
        : [rich("Beim Falten überlappen sich Quadrate, und eine Würfelfläche bleibt leer."), rich("Also ist es kein Würfelnetz: Nein.")],
      fig: netzFig(cells),
      inline: false,
      check: { lvl: level, exp: valid ? "Ja" : "Nein" },
    };
  }

  // Niveau 3: Zahlen auf dem Netz, welche Zahl liegt der gesuchten gegenüber?
  function netzLevel3(rng) {
    const cells = gitter(rng.pick(NETZE));
    const f = falten(cells);
    if (!f.ok) throw new Error("Würfelnetz: Netz ungültig");
    const nums = rng.shuffle([1, 2, 3, 4, 5, 6]);
    const numOf = {};
    FACE.forEach((k, i) => { numOf[k] = nums[i]; });
    const cellNum = f.labels.map(l => numOf[l]);
    const X = rng.pick([1, 2, 3, 4, 5, 6]);
    const iX = cellNum.indexOf(X);
    const opp = numOf[GEGEN[f.labels[iX]]];
    const nbrs = [1, 2, 3, 4, 5, 6].filter(v => v !== X && v !== opp);
    const intro = rng.pick(["", ...NAMES.map(n => `${n} faltet ein Netz aus dem Mathebuch.`)]);
    const frage = rng.pick([
      `Welche Zahl liegt der ${X} gegenüber?`,
      `Welche Zahl steht auf der Fläche, die der ${X} gegenüberliegt?`,
    ]);
    const q = [intro, "Auf der Figur stehen die Zahlen 1 bis 6. Die Figur wird zu einem Würfel gefaltet.", frage]
      .filter(Boolean).join(" ");
    return {
      q: rich(q),
      a: rich(String(opp)),
      steps: [
        rich(`Die ${X} grenzt im Würfel an die Zahlen ${listDe(nbrs.map(String))}.`),
        rich("Jede Fläche grenzt an vier andere Flächen. Nur die fünfte Fläche liegt gegenüber."),
        rich(`Also liegt der ${X} die ${opp} gegenüber.`),
      ],
      fig: netzFig(cells, cellNum.map(String)),
      inline: false,
      check: { lvl: 3, exp: String(opp) },
    };
  }

  AG.registerType({
    id: "m6-wuerfelnetz",
    klasse: "6",
    zug: "RM",
    lb: "3",
    lbTitle: "Geometrische Figuren, Körper und Lagebeziehungen",
    title: "Würfelnetze erkennen",
    topic: "koerper",
    instruction: {
      1: "Ist die Figur ein Würfelnetz? Denke dir die Figur gefaltet.",
      2: "Ist die Figur ein Würfelnetz? Achte auf Quadrate, die übereinander oder am gleichen Platz landen würden.",
      3: "Falte das Netz im Kopf zu einem Würfel. Welche Zahl liegt der gesuchten Zahl gegenüber?",
    },
    merke: [
      "Ein Würfel hat 6 Flächen. Ein ", { b: "Würfelnetz" }, " besteht aus 6 Quadraten, die sich zum Würfel falten lassen, ohne dass sich zwei überlappen. "
      + "Es gibt genau 11 Würfelnetze. ", "Gegenüberliegende Flächen haben keine gemeinsame Kante.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 3) return netzLevel3(rng);
      return netzLevel12(rng, level);
    },
    verify(t) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      return plain(t.a) === k.exp || `erwartet „${k.exp}“, steht „${plain(t.a)}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
