// M8 LB 1 (Prozentrechnung): Schaubilder auswerten. Drei Diagrammarten, zufällig gemischt:
// Halbkreisdiagramm (Winkel ↔ Prozent, Sitzverteilung), Plus-Minus-Darstellung (Zu- und Abnahme in %)
// sowie Kreis- oder Säulendiagramm mit Prozentangaben. Mit Skizzen (AG.sketch).
// Zeichen- und Hilfsfunktionen für Kreis- und Säulendiagramm sind aus m7-diagramme.js übernommen.
(function (AG) {
  const { rich, fmtInt, MINUS } = AG;
  const COLORS = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];
  const pct = v => fmtInt(v) + " %";
  const spct = v => (v < 0 ? MINUS : "+") + fmtInt(Math.abs(v)) + " %";
  const deg = v => fmtInt(v) + "°";
  const ang = p => (p * 9) / 5;                 // Winkel zu p % (p Vielfaches von 5): 1 % = 1,8°
  const fail = name => { throw new Error(name + ": keine passende Aufgabe gefunden"); };
  function listTxt(a) {
    const q = a.map(s => "„" + s + "“");
    return q.length <= 1 ? q.join("") : q.slice(0, -1).join(", ") + " und " + q[q.length - 1];
  }

  // Anteile in Vielfachen von 5 % (Summe 100 %), je zwischen minU und maxU Einheiten zu 5 %
  function shares5(rng, n, minU, maxU) {
    for (let t = 0; t < 400; t++) {
      const u = new Array(n).fill(minU);
      for (let r = 20 - minU * n; r > 0; r--) u[rng.int(0, n - 1)]++;
      if (Math.max(...u) <= maxU) return u.map(x => 5 * x);
    }
    return fail("Anteile");
  }

  // Plus-Minus-Werte: Vielfache von 5 %, ohne 0, mindestens eine Zunahme und eine Abnahme
  const PM_VALS = [-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30];
  function pmValues(rng, n, sc) {
    for (let t = 0; t < 500; t++) {
      const v = rng.shuffle(sc.vals || PM_VALS).slice(0, n);
      if (v.some(x => x > 0) && v.some(x => x < 0)) return v;
    }
    return fail("Plus-Minus-Werte");
  }

  // Halbkreisdiagramm: 100 % = 180°. Sektoren von links nach rechts über die Spitze, Winkel außen,
  // Basislinie darunter, Legende rechts.
  function semiFig(names, pcts, hide = -1) {   // hide: Sektor, dessen Winkel gesucht ist („?“)
    const W = 146, H = 56, cx = 51, cy = 42, r = 33, lr = r + 4.5;
    const s = AG.sketch(W, H);
    let a = Math.PI;
    pcts.forEach((p, i) => {
      const span = (p / 100) * Math.PI, a1 = a - span;
      const p0 = [cx + r * Math.cos(a), cy - r * Math.sin(a)];
      const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
      s.path(`M${cx},${cy} L${p0[0]},${p0[1]} A${r},${r} 0 0,1 ${p1[0]},${p1[1]} Z`, { fill: COLORS[i] });
      const mid = a - span / 2, c = Math.cos(mid);
      s.label([cx + lr * c, cy - lr * Math.sin(mid)], i === hide ? "?" : deg(ang(p)), { anchor: c > 0.3 ? "start" : c < -0.3 ? "end" : "middle" });
      a = a1;
    });
    s.line([cx - r, cy], [cx + r, cy]);
    s.label([cx, cy + 6], "180° = 100 %", { anchor: "middle" });
    names.forEach((nm, i) => {
      const y = 20 + i * 7;
      s.rect(104, y - 1.75, 3.5, 3.5, { fill: COLORS[i] });
      s.label([108.5, y], nm, { anchor: "start" });
    });
    return s.done();
  }

  // Kreisdiagramm: Sektoren ab 12 Uhr im Uhrzeigersinn, Prozent außen, Legende rechts (aus m7-diagramme.js)
  function pieFig(cats, vals) {
    const W = 140, H = 60, cx = 38, cy = 30, r = 19;
    const s = AG.sketch(W, H);
    let a = -Math.PI / 2;
    vals.forEach((v, i) => {
      const span = (v / 100) * 2 * Math.PI, a1 = a + span;
      const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
      const large = span > Math.PI ? 1 : 0;
      s.path(`M${cx},${cy} L${p0[0]},${p0[1]} A${r},${r} 0 ${large},1 ${p1[0]},${p1[1]} Z`, { fill: COLORS[i] });
      const mid = a + span / 2, lr = r + 4.5;
      const lx = cx + lr * Math.cos(mid), ly = cy + lr * Math.sin(mid);
      const c = Math.cos(mid);
      s.label([lx, ly], pct(v), { anchor: c > 0.3 ? "start" : c < -0.3 ? "end" : "middle" });
      a = a1;
    });
    const y0 = cy - (cats.length - 1) * 4;
    cats.forEach((c, i) => {
      const y = y0 + i * 8;
      s.rect(80, y - 1.75, 3.5, 3.5, { fill: COLORS[i] });
      s.label([84.5, y], c, { anchor: "start" });
    });
    return s.done();
  }

  // Säulendiagramm: Achse mit Skala (0 bis T), Werte über den Säulen, Namen darunter (aus m7-diagramme.js)
  function niceTop(max) { return Math.ceil((max + 4) / 10) * 10; }
  function columnFig(cats, vals) {
    const W = 140, H = 60, xA = 20, yB = 50, yT = 9;
    const T = niceTop(Math.max(...vals)), step = T > 50 ? 20 : 10;
    const sy = v => yB - (v / T) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 2], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    for (let t = 0; t <= T; t += step) {
      s.line([xA - 1, sy(t)], [xA, sy(t)]);
      s.label([xA - 2, sy(t)], String(t), { anchor: "end" });
    }
    s.label([xA - 2, yT - 5], "%", { anchor: "end" });
    const slot = (W - xA - 4) / cats.length, bw = slot * 0.6;
    cats.forEach((c, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(vals[i]), bw, yB - sy(vals[i]), { fill: COLORS[i] });
      s.label([x + bw / 2, sy(vals[i]) - 3.2], pct(vals[i]));
      s.label([x + bw / 2, yB + 4.5], c);
    });
    return s.done();
  }

  // Plus-Minus-Darstellung: Balken nach rechts (Zunahme, blau) bzw. links (Abnahme, rot) von der
  // Nulllinie in der Mitte. Namen links, Werte in % an den Balken, 1,2 mm je Prozent.
  function pmFig(names, vals) {
    const W = 146, H = 60, xN = 4, x0 = 94, sc = 1.2, top = 12, slot = 8, bh = 5;
    const s = AG.sketch(W, H);
    s.label([x0 - 3, 4], "← Abnahme", { anchor: "end" });
    s.label([x0 + 3, 4], "Zunahme →", { anchor: "start" });
    s.line([x0, 8], [x0, top + slot * names.length]);
    names.forEach((nm, i) => {
      const v = vals[i], yc = top + slot * (i + 0.5);
      s.label([xN, yc], nm, { anchor: "start" });
      if (v > 0) {
        s.rect(x0, yc - bh / 2, v * sc, bh, { fill: COLORS[0] });
        s.label([x0 + v * sc + 1.5, yc], spct(v), { anchor: "start" });
      } else {
        s.rect(x0 + v * sc, yc - bh / 2, -v * sc, bh, { fill: COLORS[2] });
        s.label([x0 + v * sc - 1.5, yc], spct(v), { anchor: "end" });
      }
    });
    s.label([x0, top + slot * names.length + 4], "0 %", { anchor: "middle" });
    return s.done();
  }

  // ---------- Kontexte ----------
  const SEM_LISTS = ["Liste Ahorn", "Liste Buche", "Liste Eiche", "Liste Linde", "Liste Kastanie"];
  const SEATS = [20, 30, 40];
  const CHART = [
    { asked: "wofür sie ihr Taschengeld ausgeben", cats: ["Kleidung", "Süßes", "Apps", "Sparen", "Kino", "Bücher"] },
    { asked: "wie sie zur Schule kommen", cats: ["Bus", "Auto", "Fahrrad", "zu Fuß", "Bahn"] },
    { asked: "was sie in ihrer Freizeit am liebsten machen", cats: ["Sport", "Musik", "Lesen", "Gaming", "Freunde"] },
  ];
  const GROUPS = [40, 60, 80, 120, 160, 180, 200, 240]; // Anzahl Befragter, Vielfache von 20 (dann sind Anteile in 5er-Schritten ganzzahlig)
  const PM_SCEN = [
    { noun: "Schule", names: ["Schule Nord", "Schule Süd", "Schule West", "Schule Ost", "Schule Mitte"],
      unit: " Schüler", V: [120, 160, 200, 240, 280, 320, 360, 400, 480, 520, 600], vals: [-15, -10, -5, 5, 10, 15],
      intro: "Die Schülerzahlen der Mittelschulen im Landkreis haben sich gegenüber dem Vorjahr verändert. Das Plus-Minus-Diagramm zeigt die Veränderung in Prozent.",
      have: (nm, V) => `Die ${nm} hatte im Vorjahr ${fmtInt(V)} Schüler.`,
      ask: "Wie viele Schüler hat sie jetzt?" },
    { noun: "Filiale", names: ["Filiale Nord", "Filiale Süd", "Filiale West", "Filiale Ost", "Filiale Mitte"],
      unit: " Tausend €", V: [120, 160, 200, 240, 280, 320, 360, 400, 480],
      intro: "Ein Handelsunternehmen vergleicht den Umsatz seiner Filialen mit dem Vorjahr. Das Plus-Minus-Diagramm zeigt die Umsatzänderung in Prozent.",
      have: (nm, V) => `Die ${nm} hatte im Vorjahr einen Umsatz von ${fmtInt(V)} Tausend €.`,
      ask: "Wie hoch ist der Umsatz jetzt?" },
  ];

  // ---------- Halbkreisdiagramm ----------
  function genSemi(rng, level) {
    const S = rng.pick(SEATS);
    const n = rng.int(3, 5);
    const names = rng.shuffle(SEM_LISTS).slice(0, n);
    let pcts, idx;
    for (let t = 0; ; t++) {
      if (t > 3000) fail("Halbkreisdiagramm");
      pcts = shares5(rng, n, 2, 10);                                          // je 10 bis 50 %
      idx = pcts.map((p, k) => k);
      if (pcts.every(p => (S * p) % 100 === 0)) break;                          // alle Sitzzahlen ganzzahlig
    }
    const base = `Im Gemeinderat von Musterdorf gibt es ${S} Sitze. Das Halbkreisdiagramm zeigt die Verteilung nach der Wahl; die Winkel der Sektoren sind eingetragen.`;
    const cnt = k => (S * pcts[k]) / 100;
    let fig = semiFig(names, pcts);
    const meta = { kind: "semi", vals: pcts };

    if (level === 1) {
      if (rng.chance(0.5)) {
        const i = rng.int(0, n - 1);
        return {
          q: rich(base, " Wie viel Prozent der Sitze erhält „", names[i], "“?"),
          a: rich(pct(pcts[i])),
          steps: [rich(deg(ang(pcts[i])), " : 180° · 100 = ", pct(pcts[i]))],
          fig, inline: false, meta: { ...meta, expect: [pcts[i]] },
        };
      }
      const i = rng.int(0, n - 1), j = rng.intExcept(0, n - 1, [i]);
      const s = pcts[i] + pcts[j];
      return {
        q: rich(base, " Wie viel Prozent der Sitze entfallen zusammen auf „", names[i], "“ und „", names[j], "“?"),
        a: rich(pct(s)),
        steps: [
          rich(deg(ang(pcts[i])), " + ", deg(ang(pcts[j])), " = ", deg(ang(s))),
          rich(deg(ang(s)), " : 180° · 100 = ", pct(s)),
        ],
        fig, inline: false, meta: { ...meta, expect: [s] },
      };
    }

    if (level === 2) {
      if (rng.chance(0.5)) {
        // Winkel ↔ Prozent: Prozentsatz aus dem Winkel, dann Anzahl Sitze
        const i = rng.pick(idx), c = cnt(i);
        return {
          q: rich(base, " Wie viele Sitze erhält „", names[i], "“?"),
          a: rich(fmtInt(c), " Sitze"),
          steps: [
            rich(deg(ang(pcts[i])), " : 180° · 100 = ", pct(pcts[i])),
            rich(fmtInt(S), " · ", fmtInt(pcts[i]), " : 100 = ", fmtInt(c), " Sitze"),
          ],
          fig, inline: false, meta: { ...meta, expect: [c] },
        };
      }
      // Prozent → Winkel: 1 % = 1,8°; dieser Winkel steht im Bild als „?“
      const i = rng.int(0, n - 1);
      fig = semiFig(names, pcts, i);
      return {
        q: rich(base, " „", names[i], "“ erhält ", pct(pcts[i]), " der Sitze. Wie groß ist ihr Mittelpunktswinkel im Halbkreisdiagramm?"),
        a: rich(deg(ang(pcts[i]))),
        steps: [
          rich("1 % = 180° : 100 = 1,8°"),
          rich(fmtInt(pcts[i]), " · 1,8° = ", deg(ang(pcts[i]))),
        ],
        fig, inline: false, meta: { ...meta, expect: [ang(pcts[i])] },
      };
    }

    // Niveau 3: Sitze einer Liste und Sitze einer Koalition (2 bis n−1 Listen)
    const x = rng.pick(idx);
    const size = rng.int(2, Math.min(n - 1, idx.length));
    const C = [x, ...rng.shuffle(idx.filter(k => k !== x)).slice(0, size - 1)];
    const cX = cnt(x);
    const cC = C.reduce((acc, k) => acc + cnt(k), 0);
    const pC = C.reduce((acc, k) => acc + pcts[k], 0);
    return {
      q: rich(base, " (a) Wie viele Sitze erhält „", names[x], "“? (b) ", listTxt(C.map(k => names[k])),
        " bilden eine Koalition. Wie viele Sitze hat die Koalition? Wie viel Prozent der Sitze sind das?"),
      a: rich("(a) ", fmtInt(cX), " Sitze. (b) ", fmtInt(cC), " Sitze, das sind ", pct(pC), " der Sitze."),
      steps: [
        rich("(a) ", deg(ang(pcts[x])), " : 180° · 100 = ", pct(pcts[x])),
        rich("(a) ", fmtInt(S), " · ", fmtInt(pcts[x]), " : 100 = ", fmtInt(cX), " Sitze"),
        rich("(b) Sitze: ", C.map(k => fmtInt(cnt(k))).join(" + "), " = ", fmtInt(cC), " Sitze"),
        rich("(b) Anteil: ", C.map(k => pct(pcts[k])).join(" + "), " = ", pct(pC)),
      ],
      fig, inline: false, meta: { ...meta, expect: [cX, cC, pC] },
    };
  }

  // ---------- Plus-Minus-Darstellung ----------
  function genPm(rng, level) {
    const sc = rng.pick(PM_SCEN);
    const n = rng.int(4, 5);
    const names = rng.shuffle(sc.names).slice(0, n);
    let vals, i, lower;
    for (let t = 0; ; t++) {
      if (t > 3000) fail("Plus-Minus-Diagramm");
      vals = pmValues(rng, n, sc);
      i = rng.int(0, n - 1);
      lower = vals.map((v, k) => k).filter(k => vals[k] < vals[i]);
      if (level !== 3 || lower.length) break;
    }
    const base = sc.intro;
    const fig = pmFig(names, vals);
    const meta = { kind: "pm", vals };
    const maxV = Math.max(...vals), minV = Math.min(...vals);

    if (level === 1) {
      if (rng.chance(0.5)) {
        // größte Zunahme und größte Abnahme: Unterschied in Prozentpunkten
        const iMax = vals.indexOf(maxV), iMin = vals.indexOf(minV), d = maxV - minV;
        return {
          q: rich(base, " Um wie viele Prozentpunkte unterscheiden sich die größte Zunahme (", names[iMax],
            ") und die größte Abnahme (", names[iMin], ")?"),
          a: rich(fmtInt(d), " Prozentpunkte"),
          steps: [
            rich(names[iMax], ": ", spct(maxV), ", ", names[iMin], ": ", spct(minV)),
            rich("(", spct(maxV), ") ", MINUS, " (", spct(minV), ") = ", fmtInt(d), " Prozentpunkte"),
          ],
          fig, inline: false, meta: { ...meta, expect: [d] },
        };
      }
      const iMin = vals.indexOf(minV);
      return {
        q: rich(base, " Bei welcher ", sc.noun, " ist die Abnahme am größten? Wie viel Prozent beträgt sie?"),
        a: rich(names[iMin], ": ", spct(minV)),
        steps: [rich("Der längste Balken nach links gehört zu ", names[iMin], ": ", spct(minV))],
        fig, inline: false, meta: { ...meta, expect: [Math.abs(minV)] },
      };
    }

    // Niveau 2/3: alter Wert aus dem Text, Änderung aus dem Diagramm
    const V = rng.pick(sc.V);
    const p = vals[i];
    const d = (V * Math.abs(p)) / 100;
    const neu = p < 0 ? V - d : V + d;
    const change = [
      rich("Änderung: ", pct(Math.abs(p)), " von ", fmtInt(V), " = ", fmtInt(V), " · ", fmtInt(Math.abs(p)), " : 100 = ", fmtInt(d), sc.unit),
      rich(fmtInt(V), sc.unit, p < 0 ? " " + MINUS + " " : " + ", fmtInt(d), sc.unit, " = ", fmtInt(neu), sc.unit),
    ];

    if (level === 2) {
      return {
        q: rich(base, " ", sc.have(names[i], V), " ", sc.ask),
        a: rich(fmtInt(neu), sc.unit),
        steps: change,
        fig, inline: false, meta: { ...meta, expect: [neu] },
      };
    }

    const j = rng.pick(lower), dd = vals[i] - vals[j];
    return {
      q: rich(base, " ", sc.have(names[i], V), " (a) ", sc.ask,
        " (b) Um wie viele Prozentpunkte ist die Veränderung von ", names[i], " größer als die von ", names[j], "?"),
      a: rich("(a) ", fmtInt(neu), sc.unit, ". (b) ", fmtInt(dd), " Prozentpunkte."),
      steps: [
        rich("(a) ", change[0]),
        rich("(a) ", change[1]),
        rich("(b) (", spct(vals[i]), ") ", MINUS, " (", spct(vals[j]), ") = ", fmtInt(dd), " Prozentpunkte"),
      ],
      fig, inline: false, meta: { ...meta, expect: [neu, dd] },
    };
  }

  // ---------- Kreis- oder Säulendiagramm mit Prozentangaben ----------
  function genChart(rng, level) {
    const T = rng.pick(CHART);
    const kind = rng.pick(["pie", "col"]);
    const n = rng.int(3, 5);
    const cats = rng.shuffle(T.cats).slice(0, n);
    const pcts = shares5(rng, n, 1, 10);
    const G = rng.pick(GROUPS);
    const x = rng.int(0, n - 1), y = rng.intExcept(0, n - 1, [x]);
    const fig = kind === "pie" ? pieFig(cats, pcts) : columnFig(cats, pcts);
    const ctx = `Bei einer Umfrage unter Schülern der Mittelschule wurde gefragt, ${T.asked}. Das ${kind === "pie" ? "Kreisdiagramm" : "Säulendiagramm"} zeigt das Ergebnis in Prozent.`;
    const meta = { kind, vals: pcts };
    const px = pcts[x], py = pcts[y];

    if (level === 1) {
      if (rng.chance(0.5)) {
        const s = px + py;
        return {
          q: rich(ctx, " Wie viel Prozent entfallen zusammen auf „", cats[x], "“ und „", cats[y], "“?"),
          a: rich(pct(s)),
          steps: [rich(pct(px), " + ", pct(py), " = ", pct(s))],
          fig, inline: false, meta: { ...meta, expect: [s] },
        };
      }
      return {
        q: rich(ctx, " Wie viel Prozent nennen nicht „", cats[x], "“?"),
        a: rich(pct(100 - px)),
        steps: [rich("100 % ", MINUS, " ", pct(px), " = ", pct(100 - px))],
        fig, inline: false, meta: { ...meta, expect: [100 - px] },
      };
    }

    const cG = (G * px) / 100;   // Anzahl der Befragten, die X nennen
    if (level === 2) {
      if (rng.chance(0.5)) {
        // Prozentwert aus dem Grundwert
        return {
          q: rich(ctx, " Insgesamt wurden ", fmtInt(G), " Schüler befragt. Wie viele Schüler nennen „", cats[x], "“?"),
          a: rich(fmtInt(cG), " Schüler"),
          steps: [
            rich("Anteil: ", pct(px)),
            rich(fmtInt(G), " · ", fmtInt(px), " : 100 = ", fmtInt(cG), " Schüler"),
          ],
          fig, inline: false, meta: { ...meta, expect: [cG] },
        };
      }
      // Grundwert aus dem Prozentwert
      return {
        q: rich(ctx, " Genau ", fmtInt(cG), " Schüler nennen „", cats[x], "“. Wie viele Schüler wurden insgesamt befragt?"),
        a: rich(fmtInt(G), " Schüler"),
        steps: [
          rich("Anteil: ", pct(px)),
          rich("G = ", fmtInt(cG), " · 100 : ", fmtInt(px), " = ", fmtInt(G), " Schüler"),
        ],
        fig, inline: false, meta: { ...meta, expect: [G] },
      };
    }

    // Niveau 3: erst Grundwert aus X, dann Prozentwert von Y
    const Py = (G * py) / 100;
    return {
      q: rich(ctx, " Genau ", fmtInt(cG), " Schüler nennen „", cats[x], "“. (a) Wie viele Schüler wurden insgesamt befragt? (b) Wie viele Schüler nennen „", cats[y], "“?"),
      a: rich("(a) ", fmtInt(G), " Schüler. (b) ", fmtInt(Py), " Schüler."),
      steps: [
        rich("(a) G = ", fmtInt(cG), " · 100 : ", fmtInt(px), " = ", fmtInt(G)),
        rich("(b) ", fmtInt(G), " · ", fmtInt(py), " : 100 = ", fmtInt(Py), " Schüler"),
      ],
      fig, inline: false, meta: { ...meta, expect: [G, Py] },
    };
  }

  AG.registerType({
    id: "m8-schaubilder",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Schaubilder zur Prozentrechnung",
    instruction: {
      1: "Lies die Angaben aus dem Schaubild ab und berechne.",
      2: "Lies die Angaben aus dem Schaubild ab und rechne mit ihnen.",
      3: "Lies die Angaben aus dem Schaubild ab. Beantworte die Teilfragen a) und b) mit Rechnung.",
    },
    merke: [
      "Halbkreisdiagramm: ", { b: "100 % = 180°, also 1 % = 1,8°" },
      ". Prozent = Winkel : 1,8, z. B. 54° entsprechen 30 %. Plus-Minus-Diagramm: Balken nach rechts ist eine Zunahme, Balken nach links eine Abnahme. Neuer Wert = alter Wert ± Änderung, z. B. 240 Schüler und "
      + MINUS + "5 %: 240 · 5 : 100 = 12, neu 240 − 12 = 228 Schüler.",
    ],
    cols: 1,
    generate(rng, level) {
      const kind = rng.pick(["semi", "pm", "chart"]);
      if (kind === "semi") return genSemi(rng, level);
      if (kind === "pm") return genPm(rng, level);
      return genChart(rng, level);
    },
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const v = m.vals;
      if (v.some(x => !Number.isInteger(x))) return "Werte nicht ganzzahlig";
      if (m.kind === "pm") {
        if (v.some(x => x === 0 || x % 5 !== 0)) return "Plus-Minus-Wert kein Vielfaches von 5 oder null";
      } else {
        if (v.reduce((a, b) => a + b, 0) !== 100) return "Anteile ergeben nicht 100 %";
        if (v.some(x => x < 5 || x % 5 !== 0)) return "Anteil unter 5 % oder kein Vielfaches von 5";
      }
      const txt = AG.plain(t.a);
      const bad = m.expect.filter(x => !txt.includes(String(x)));
      return bad.length ? "Ergebnis fehlt im Lösungstext: " + bad.join(", ") : true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
