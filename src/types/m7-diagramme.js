// M7 LB 1 und LB 6: Prozentanteile aus Diagrammen (Kreis-, Streifen-, Säulen-, Balkendiagramm)
// und Beurteilung eines Säulendiagramms mit abgeschnittener y-Achse. Mit Skizzen (AG.sketch).
(function (AG) {
  const { Frac, rich, fmtInt, fmtDec, MINUS } = AG;
  const COLORS = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];
  const CHAR = 0.58 * 3.4; // ungefähre Zeichenbreite in mm (Skizzenschrift ca. 10 pt)
  const pct = v => fmtInt(v) + " %";

  const TOPICS = [
    { ctx: "In einer Umfrage in der Klasse 7b wurde nach dem Lieblingssport gefragt.", noun: "Schüler",
      cats: ["Fußball", "Schwimmen", "Turnen", "Tanzen", "Radfahren"] },
    { ctx: "Schüler wurden gefragt, wie sie zur Schule kommen.", noun: "Schüler",
      cats: ["Bus", "Auto", "Fahrrad", "zu Fuß", "Bahn"] },
    { ctx: "Jugendliche wurden gefragt, wofür sie ihr Taschengeld ausgeben.", noun: "Jugendliche",
      cats: ["Kleidung", "Süßes", "Apps", "Sparen", "Kino"] },
    { ctx: "Schüler wurden nach ihrer Freizeit gefragt.", noun: "Schüler",
      cats: ["Sport", "Musik", "Lesen", "Gaming", "Freunde"] },
    { ctx: "In der Klasse 7a wurde das Lieblingsfach erfragt.", noun: "Schüler",
      cats: ["Mathe", "Deutsch", "Englisch", "Sport", "Kunst"] },
  ];

  // Anteile in Prozent: n Teile, je mindestens 5 %, Summe 100 %. Niveau 1 nur Vielfache von 5.
  function shares(rng, n, level) {
    const unit = level === 1 ? 5 : 1;
    for (let tries = 0; tries < 300; tries++) {
      const vals = new Array(n).fill(5 / unit);
      for (let r = 100 / unit - (5 / unit) * n; r > 0; r--) vals[rng.int(0, n - 1)]++;
      const out = vals.map(v => v * unit);
      if (Math.max(...out) <= 55) return out;
    }
    throw new Error("shares: keine passende Verteilung gefunden");
  }

  // Legende in Zeilen (Kategorie mit Farbquadrat)
  function legendRow(s, cats, x0, y0, maxX) {
    let x = x0, y = y0;
    cats.forEach((c, i) => {
      const w = 4.5 + c.length * CHAR + 5;
      if (x + w > maxX && x > x0) { x = x0; y += 7; }
      s.rect(x, y - 1.75, 3.5, 3.5, { fill: COLORS[i] });
      s.label([x + 4.5, y], c, { anchor: "start" });
      x += w;
    });
  }

  // Kreisdiagramm: Sektoren ab 12 Uhr im Uhrzeigersinn, Prozent außen, Legende rechts
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

  // Streifendiagramm: ein Streifen mit 100 %, Segmente nebeneinander, Prozent oben, Legende unten
  function stripFig(cats, vals) {
    const W = 140, H = 56, x0 = 5, bw = 130, y0 = 18, bh = 14;
    const s = AG.sketch(W, H);
    let x = x0;
    vals.forEach((v, i) => {
      const w = (bw * v) / 100;
      s.rect(x, y0, w, bh, { fill: COLORS[i] });
      s.label([x + w / 2, y0 - 4], pct(v));
      x += w;
    });
    legendRow(s, cats, 5, 42, 137);
    return s.done();
  }

  // Säulendiagramm: Achse mit Skala (0 bis T), Werte über den Säulen, Namen darunter
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

  // Balkendiagramm: Namen links, Balken waagerecht, Skala unten
  function barFig(cats, vals) {
    const W = 140, H = 60, xL = 34, x0 = 37, xw = 90, yT = 6, yB = 50;
    const T = niceTop(Math.max(...vals)), step = 10;
    const sx = v => x0 + (v / T) * xw;
    const n = cats.length, slot = (yB - yT) / n, bh = slot * 0.6;
    const s = AG.sketch(W, H);
    s.line([x0, yT - 1], [x0, yB + 1]);
    s.line([x0, yB], [x0 + xw, yB]);
    for (let t = 0; t <= T; t += step) {
      s.line([sx(t), yB], [sx(t), yB + 1.2]);
      s.label([sx(t), yB + 4], String(t));
    }
    s.label([x0 + xw + 5, yB + 4], "%", { anchor: "start" });
    cats.forEach((c, i) => {
      const yc = yT + slot * (i + 0.5);
      s.label([xL, yc], c, { anchor: "end" });
      s.rect(x0, yc - bh / 2, sx(vals[i]) - x0, bh, { fill: COLORS[i] });
      s.label([sx(vals[i]) + 1.5, yc], pct(vals[i]), { anchor: "start" });
    });
    return s.done();
  }

  function chartFig(kind, cats, vals) {
    if (kind === "pie") return pieFig(cats, vals);
    if (kind === "strip") return stripFig(cats, vals);
    if (kind === "col") return columnFig(cats, vals);
    return barFig(cats, vals);
  }

  AG.registerType({
    id: "m7-diagramm-prozent",
    klasse: "7",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Prozente aus Diagrammen",
    instruction: {
      1: "Lies die Anteile aus dem Diagramm ab.",
      2: "Lies den Anteil ab und berechne damit die Anzahl.",
      3: "Rechne mit den Anteilen aus dem Diagramm.",
    },
    merke: [
      "Prozentwert P = Grundwert G · Prozentsatz p : 100. Beispiel: 25 % von 600 Schülern sind 600 · 25 : 100 = 150 Schüler. Alle Anteile eines Diagramms ergeben zusammen 100 %.",
    ],
    cols: 1,
    generate(rng, level) {
      const topic = rng.pick(TOPICS);
      const kind = rng.pick(["pie", "strip", "col", "bar"]);
      const n = rng.int(3, 5);
      const cats = rng.shuffle(topic.cats).slice(0, n);
      const vals = shares(rng, n, level);
      const fig = chartFig(kind, cats, vals);
      const noun = topic.noun;
      const k = rng.int(2, 12), G = 100 * k; // Grundwert G = 100 · k, damit Anzahlen ganzzahlig sind
      const base = topic.ctx + " Das Diagramm zeigt das Ergebnis.";

      if (level === 1) {
        if (rng.chance(0.6)) {
          const i = rng.int(0, n - 1);
          return {
            q: rich(base, " Wie groß ist der Anteil für „", cats[i], "“?"),
            a: rich(pct(vals[i])),
            steps: [rich("Am Diagramm ablesen: ", cats[i], " = ", pct(vals[i]))],
            fig, inline: false,
            meta: { vals, ask: "share", i, expect: vals[i] },
          };
        }
        const i = rng.int(0, n - 1), j = rng.intExcept(0, n - 1, [i]);
        const sum = vals[i] + vals[j];
        return {
          q: rich(base, " Wie viel Prozent entfallen zusammen auf „", cats[i], "“ und „", cats[j], "“?"),
          a: rich(pct(sum)),
          steps: [rich(pct(vals[i]), " + ", pct(vals[j]), " = ", pct(sum))],
          fig, inline: false,
          meta: { vals, ask: "two", i, j, expect: sum },
        };
      }

      if (level === 2) {
        const ctxG = topic.ctx + " Insgesamt wurden " + fmtInt(G) + " " + noun + " befragt.";
        const i = rng.int(0, n - 1);
        if (rng.chance(0.6)) {
          const cnt = k * vals[i];
          return {
            q: rich(ctxG, " Wie viele ", noun, " entfallen auf „", cats[i], "“?"),
            a: rich(fmtInt(cnt), " ", noun),
            steps: [rich("Anteil: ", pct(vals[i])), rich(fmtInt(G), " · ", fmtInt(vals[i]), " : 100 = ", fmtInt(cnt))],
            fig, inline: false,
            meta: { vals, ask: "count", i, G, expect: cnt },
          };
        }
        const cnt = G - k * vals[i];
        return {
          q: rich(ctxG, " Wie viele ", noun, " geben etwas anderes als „", cats[i], "“ an?"),
          a: rich(fmtInt(cnt), " ", noun),
          steps: [
            rich("Anteil ohne „", cats[i], "“: 100 % ", MINUS, " ", pct(vals[i]), " = ", pct(100 - vals[i])),
            rich(fmtInt(G), " · ", fmtInt(100 - vals[i]), " : 100 = ", fmtInt(cnt)),
          ],
          fig, inline: false,
          meta: { vals, ask: "notCount", i, G, expect: cnt },
        };
      }

      // Niveau 3: Vergleich (Prozentpunkte oder Anzahl) oder Grundwert aus einem Anteil
      const pairs = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (vals[i] > vals[j]) pairs.push([i, j]);
      const sub = pairs.length ? rng.pick(["pp", "diff", "base"]) : "base";
      if (sub === "pp" || sub === "diff") {
        const [i, j] = rng.pick(pairs);
        const d = vals[i] - vals[j];
        if (sub === "pp") {
          return {
            q: rich(base, " Um wie viele Prozentpunkte ist der Anteil der „", cats[i], "“ größer als der Anteil der „", cats[j], "“?"),
            a: rich(fmtInt(d), " Prozentpunkte"),
            steps: [rich(pct(vals[i]), " ", MINUS, " ", pct(vals[j]), " = ", fmtInt(d), " Prozentpunkte")],
            fig, inline: false,
            meta: { vals, ask: "pp", i, j, expect: d },
          };
        }
        return {
          q: rich(topic.ctx, " Insgesamt wurden ", fmtInt(G), " ", noun, " befragt. Wie viele ", noun, " mehr entfallen auf „", cats[i], "“ als auf „", cats[j], "“?"),
          a: rich(fmtInt(d * k), " ", noun),
          steps: [
            rich("Unterschied: ", pct(vals[i]), " ", MINUS, " ", pct(vals[j]), " = ", pct(d)),
            rich(fmtInt(G), " · ", fmtInt(d), " : 100 = ", fmtInt(d * k)),
          ],
          fig, inline: false,
          meta: { vals, ask: "diff", i, j, G, expect: d * k },
        };
      }
      const i = rng.int(0, n - 1), cnt = k * vals[i];
      return {
        q: rich(base, " Von den Befragten nannten ", fmtInt(cnt), " ", noun, " die Antwort „", cats[i], "“. Wie viele ", noun, " wurden insgesamt befragt?"),
        a: rich(fmtInt(G), " ", noun),
        steps: [
          rich(pct(vals[i]), " entsprechen ", fmtInt(cnt), " ", noun),
          rich("100 % = ", fmtInt(cnt), " · 100 : ", fmtInt(vals[i]), " = ", fmtInt(G)),
        ],
        fig, inline: false,
        meta: { vals, ask: "base", i, count: cnt, expect: G },
      };
    },
    verify(t, level) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const v = m.vals;
      if (v.reduce((a, b) => a + b, 0) !== 100) return "Anteile ergeben nicht 100 %";
      if (v.some(x => !Number.isInteger(x) || x < 5)) return "Anteil unter 5 % oder nicht ganzzahlig";
      if (level === 1 && v.some(x => x % 5)) return "Niveau 1: kein Vielfaches von 5";
      let e;
      switch (m.ask) {
        case "share": e = v[m.i]; break;
        case "two": e = v[m.i] + v[m.j]; break;
        case "count": e = (m.G * v[m.i]) / 100; break;
        case "notCount": e = (m.G * (100 - v[m.i])) / 100; break;
        case "pp": e = v[m.i] - v[m.j]; break;
        case "diff": e = ((v[m.i] - v[m.j]) * m.G) / 100; break;
        case "base": e = (m.count * 100) / v[m.i]; break;
        default: return "unbekannte Frage";
      }
      if (e !== m.expect) return "Rechnung stimmt nicht: " + e + " statt " + m.expect;
      if (!AG.plain(t.a).includes(fmtInt(m.expect))) return "Ergebnis fehlt im Lösungstext";
      return true;
    },
  });

  // ---------- Diagramme beurteilen: Säulendiagramm mit abgeschnittener y-Achse ----------
  const BASES = [20, 25, 40, 50, 80, 100];
  const SCEN = [
    { ctx: "Ein Unternehmen vergleicht die Verkaufszahlen (in Tausend Stück) von Filialen. Das Diagramm zeigt die Werte.",
      pool: ["Filiale Nord", "Filiale Süd", "Filiale West", "Filiale Ost", "Filiale Mitte", "Filiale Hafen"], unit: " Tausend Stück" },
    { ctx: "Mehrere Klassen haben dieselbe Arbeit geschrieben. Das Diagramm zeigt die Durchschnittspunkte.",
      pool: ["Klasse 7a", "Klasse 7b", "Klasse 7c", "Klasse 7d", "Klasse 7e"], unit: " Punkte" },
    { ctx: "Das Diagramm zeigt das durchschnittliche Taschengeld (in €) verschiedener Gruppen.",
      pool: ["Gruppe A", "Gruppe B", "Gruppe C", "Gruppe D", "Gruppe E"], unit: " €" },
  ];

  // Säulen mit Achse, die bei b (nicht bei 0) beginnt (ohne Achsenbruch: die Skala zeigt den Ausschnitt)
  function truncFig(names, vals, b, T, step) {
    const W = 120, H = 58, xA = 24, yB = 48, yT = 8;
    const sy = v => yB - ((v - b) / (T - b)) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 2], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    for (let t = b; t <= T; t += step) {
      s.line([xA - 1, sy(t)], [xA, sy(t)]);
      s.label([xA - 2, sy(t)], String(t), { anchor: "end" });
    }
    const slot = (W - xA - 4) / names.length, bw = slot * 0.5;
    names.forEach((nm, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(vals[i]), bw, yB - sy(vals[i]), { fill: COLORS[i] });
      s.label([x + bw / 2, sy(vals[i]) - 3.2], fmtInt(vals[i]));
      s.label([x + bw / 2, yB + 4.5], nm);
    });
    return s.done();
  }

  AG.registerType({
    id: "m7-diagramm-beurteilen",
    klasse: "7",
    zug: "RM",
    lb: "6",
    lbTitle: "Diagramme und statistische Kennwerte",
    title: "Diagramme beurteilen",
    instruction: {
      2: "Lies die Werte ab und beurteile das Diagramm.",
      3: "Lies die Werte ab, rechne den echten Unterschied aus und beurteile das Diagramm.",
    },
    merke: [
      "Eine Säulenachse sollte bei 0 beginnen. Ist sie abgeschnitten, wirken kleine Unterschiede riesig. Den echten Unterschied berechnet man in Prozent: ",
      { b: "(neu − alt) · 100 : alt" }, ".",
    ],
    cols: 1,
    levels: [2, 3],
    generate(rng, level) {
      const sc = rng.pick(SCEN);
      const n = level === 2 ? 2 : 3;
      const names = rng.shuffle(sc.pool).slice(0, n);
      const vA = rng.pick(BASES);
      const pOK = [];
      for (let p = 2; p <= 15; p++) if ((p * vA) % 100 === 0) pOK.push(p); // d = p · vA : 100 ist ganzzahlig
      const pB = rng.pick(pOK);
      const vals = [vA, vA + (pB * vA) / 100];
      if (n === 3) vals.push(vA + (rng.pick(pOK.filter(p => p !== pB)) * vA) / 100);
      const vmax = Math.max(...vals);
      const bs = [];
      for (let x = 10; x <= vA - 5; x += 10) if (x >= vA - 30) bs.push(x);
      const b = rng.pick(bs); // Achse beginnt bei b < vA
      const rough = (vmax - b) * 1.2;
      const step = rough <= 40 ? 5 : 10;
      const T = b + step * Math.ceil(rough / step);
      const fig = truncFig(names, vals, b, T, step);
      const A = names[0], B = names[1];
      const d = vals[1] - vals[0];
      const p = (d * 100) / vA;

      if (level === 2) {
        return {
          q: rich(sc.ctx, " (a) Um wie viel Prozent ist der Wert von „", B, "“ größer als der von „", A, "“? Rechne vom Wert von „", A, "“ aus. (b) Warum wirkt der Unterschied im Diagramm so groß?"),
          a: rich("(a) ", pct(p), " größer. (b) Die Achse beginnt bei ", fmtInt(b), " und nicht bei 0. Dadurch wirkt der kleine Unterschied im Diagramm sehr groß."),
          steps: [
            rich(fmtInt(vals[1]), " ", MINUS, " ", fmtInt(vals[0]), " = ", fmtInt(d), sc.unit),
            rich(fmtInt(d), " · 100 : ", fmtInt(vA), " = ", pct(p)),
          ],
          fig, inline: false,
          meta: { vals, b, p, expect: p, ask: "trunc" },
        };
      }

      // Niveau 3: zusätzlich die scheinbare Steigerung aus den gemessenen Säulenhöhen (ab b)
      const vis = Math.round((d * 1000) / (vA - b)) / 10;
      return {
        q: rich(sc.ctx, " (a) Um wie viel Prozent ist der Wert von „", B, "“ größer als der von „", A, "“? (b) Miss die Säulenhöhen ab der Achse, die bei ", fmtInt(b), " beginnt. Um wie viel Prozent scheint die Säule von „", B, "“ höher als die von „", A, "“ zu sein?"),
        a: rich("(a) ", pct(p), " größer. (b) Im Diagramm scheint B um ca. ", fmtDec(new Frac(Math.round((d * 1000) / (vA - b)), 10)), " % höher zu sein."),
        steps: [
          rich("Echter Unterschied: ", fmtInt(d), " · 100 : ", fmtInt(vA), " = ", pct(p)),
          rich("Höhen ab ", fmtInt(b), ": B = ", fmtInt(vals[1] - b), ", A = ", fmtInt(vA - b)),
          rich(fmtInt(d), " · 100 : ", fmtInt(vA - b), " = ca. ", fmtDec(new Frac(Math.round((d * 1000) / (vA - b)), 10)), " %"),
        ],
        fig, inline: false,
        meta: { vals, b, p, vis, expect: p, ask: "trunc3" },
      };
    },
    verify(t, level) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const v = m.vals;
      if (v.some(x => !Number.isInteger(x) || x <= 0)) return "Werte ungültig";
      if (!(m.b % 10 === 0 && m.b > 0 && m.b < Math.min(...v))) return "Achse beginnt nicht unterhalb der Säulen";
      const d = v[1] - v[0];
      const p = (d * 100) / v[0];
      if (!Number.isInteger(p) || p !== m.p) return "Prozentwert falsch";
      if (!AG.plain(t.a).includes(fmtInt(p))) return "Ergebnis fehlt im Lösungstext";
      if (level === 3 && Math.abs(m.vis - (d * 100) / (v[0] - m.b)) > 0.051) return "sichtbare Steigerung falsch";
      return true;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
