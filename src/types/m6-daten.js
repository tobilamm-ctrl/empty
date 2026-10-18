// M6 LB 6 (Daten): Mittelwert berechnen (Summe : Anzahl, Umkehrung) und Säulen-/Liniendiagramme
// lesen (Veränderungen, größte Zunahme, Durchschnitt aus dem Diagramm). Mit Skizzen (AG.sketch).
(function (AG) {
  const { Frac, rich, plain, fmtDec, fmtInt, MINUS: MI } = AG;
  const KL = "6", ZUG = "RM", LB = "6", LBT = "Daten", TOPIC = "daten";
  const BLUE = "#1f3f9e";

  // ==================== 1. Mittelwert ====================
  // Werte in Einheiten: ganze Zahlen (dig 0) oder Hundertstel (dig 2, z. B. 3,45 m).
  // Der Mittelwert ist ebenfalls in Einheiten ganzzahlig, daher ist er stets genau (keine Rundung).
  const MW_INT = [
    { intro: n => `Die Anzahl der Tore der Mannschaft in ${n} Spielen:`, unit: " Tore", dig: 0, range: [0, 8], mean: [2, 6] },
    { intro: n => `Die Lesezeit von Lena an ${n} Tagen in Minuten:`, unit: " Minuten", dig: 0, range: [10, 45], mean: [15, 35] },
    { intro: n => `Die Taschengelder von ${n} Kindern in Euro:`, unit: " €", dig: 0, range: [5, 30], mean: [8, 25] },
    { intro: n => `Die Anzahl der Seiten von ${n} Büchern:`, unit: " Seiten", dig: 0, range: [80, 300], mean: [120, 250] },
  ];
  const MW_DEC = [
    { intro: n => `Die Sprungweiten von ${n} Kindern im Weitsprung in m:`, unit: " m", dig: 2, range: [320, 420], mean: [340, 400] },
    { intro: n => `Die Laufzeiten von ${n} Kindern über 50 m in Sekunden:`, unit: " s", dig: 2, range: [700, 950], mean: [750, 900] },
    { intro: n => `Die Weiten von ${n} Kindern im Kugelstoßen in m:`, unit: " m", dig: 2, range: [450, 900], mean: [550, 800] },
  ];

  // Wert in Einheiten als Text (dig 2: Hundertstel mit Komma)
  const fv = (u, dig) => (dig ? fmtDec(new Frac(u, 100), 2) : fmtInt(u));

  // Datenreihe: n−1 Werte zufällig, der letzte so gewählt, dass der Mittelwert genau M ist
  function mwData(rng, c, n) {
    const [lo, hi] = c.range, [mlo, mhi] = c.mean;
    for (let tries = 0; tries < 500; tries++) {
      const vals = [];
      for (let i = 0; i < n - 1; i++) vals.push(rng.int(lo, hi));
      const M = rng.int(mlo, mhi);
      const last = n * M - vals.reduce((a, b) => a + b, 0);
      if (last < lo || last > hi) continue;
      const data = rng.shuffle([...vals, last]);
      if (new Set(data).size < 2) continue; // keine konstante Reihe
      return { data, M };
    }
    throw new Error("m6-mittelwert: keine Datenreihe gefunden");
  }

  // Niveau 3a: Umkehrung mit Noten. Summe der 5 Noten = s, Durchschnitt = s : 5 (z. B. 12 : 5 = 2,4)
  function notenAufgabe(rng) {
    for (let tries = 0; tries < 500; tries++) {
      const s = rng.int(10, 24);
      const x = rng.int(1, 6);                 // gesuchte Note
      const a3 = [rng.int(1, 6), rng.int(1, 6), rng.int(1, 6)];
      const four = s - x - a3.reduce((p, q) => p + q, 0);
      if (four < 1 || four > 6) continue;
      const others = rng.shuffle([...a3, four]);
      if (new Set(others).size < 2) continue;
      const sumO = others.reduce((p, q) => p + q, 0);
      const mean = fmtDec(new Frac(s, 5), 1);
      const list = others.slice(0, -1).join(", ") + " und " + others[others.length - 1];
      return {
        q: rich("Der Durchschnitt von 5 Tests ist ", mean, ". Vier Noten sind ", list, ". Welche Note hat der fünfte Test?"),
        a: rich("Note ", String(x)),
        steps: [
          rich("Summe aller 5 Noten: ", mean, " · 5 = ", String(s)),
          rich("Summe der vier Noten: ", others.join(" + "), " = ", String(sumO)),
          rich("Fünfte Note: ", String(s), " − ", String(sumO), " = ", String(x)),
        ],
        inline: false,
        check: { kind: "noten", s, x, others },
      };
    }
    throw new Error("m6-mittelwert: keine Notenaufgabe gefunden");
  }

  // Niveau 3b: fehlender Wert. Vier Sprungweiten, drei gegeben, Mittelwert gegeben.
  function fehlendAufgabe(rng) {
    const n = 4, f = u => fv(u, 2);
    for (let tries = 0; tries < 500; tries++) {
      const M = rng.int(340, 400);             // Mittelwert in Hundertstel
      const three = [rng.int(320, 420), rng.int(320, 420), rng.int(320, 420)];
      const sum3 = three.reduce((p, q) => p + q, 0);
      const x = n * M - sum3;
      if (x < 320 || x > 420) continue;
      if (new Set([...three, x]).size < 2) continue;
      return {
        q: rich("Vier Kinder springen im Weitsprung. Drei Sprungweiten sind ", f(three[0]), " m, ", f(three[1]),
          " m und ", f(three[2]), " m. Der Mittelwert aller vier Sprungweiten ist ", f(M), " m. Wie weit ist der vierte Sprung?"),
        a: rich(f(x), " m"),
        steps: [
          rich("Summe aller vier Sprungweiten: ", f(M), " · 4 = ", f(n * M)),
          rich("Summe der drei Sprungweiten: ", three.map(f).join(" + "), " = ", f(sum3)),
          rich("Vierter Sprung: ", f(n * M), " − ", f(sum3), " = ", f(x), " m"),
        ],
        inline: false,
        check: { kind: "fehlend", M, three, x },
      };
    }
    throw new Error("m6-mittelwert: keine Aufgabe mit fehlendem Wert gefunden");
  }

  AG.registerType({
    id: "m6-mittelwert",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Mittelwert (Durchschnitt) berechnen",
    instruction: {
      1: "Berechne den Mittelwert. Rechne zuerst die Summe aus, dann teile durch die Anzahl.",
      2: "Berechne den Mittelwert. Achte auf das Komma.",
      3: "Berechne den fehlenden Wert. Denke an die Summe: Summe = Mittelwert · Anzahl.",
    },
    merke: [
      { b: "Mittelwert = Summe : Anzahl." },
      " Beispiel: Zahlen 4, 6, 2, 8 → Summe 20, also Mittelwert 20 : 4 = 5. Umgekehrt gilt: Summe = Mittelwert · Anzahl.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 3) return rng.chance(0.5) ? notenAufgabe(rng) : fehlendAufgabe(rng);
      const c = level === 1 ? rng.pick(MW_INT) : rng.pick(MW_DEC);
      const n = level === 1 ? rng.int(4, 5) : rng.int(4, 6);
      const { data, M } = mwData(rng, c, n);
      const sum = data.reduce((a, b) => a + b, 0);
      const f = u => fv(u, c.dig);
      return {
        q: rich(c.intro(n), " ", data.map(f).join("; "), ". Berechne den Mittelwert."),
        a: rich("Mittelwert ", f(M), c.unit),
        steps: [
          rich("Summe: ", data.map(f).join(" + "), " = ", f(sum), c.unit),
          rich("Mittelwert: ", f(sum), " : ", String(n), " = ", f(M), c.unit),
        ],
        inline: false,
        check: { kind: "mw", data, M, n, dig: c.dig, unit: c.unit },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const s = plain(t.a);
      if (k.kind === "noten") {
        const sumO = k.others.reduce((p, q) => p + q, 0);
        if (sumO + k.x !== k.s) return "Summe der Noten falsch";
        if (k.x < 1 || k.x > 6 || k.others.some(x => x < 1 || x > 6)) return "Note außerhalb 1 bis 6";
        return s === "Note " + k.x ? true : "Lösung falsch";
      }
      if (k.kind === "fehlend") {
        const x = 4 * k.M - k.three.reduce((p, q) => p + q, 0);
        if (x !== k.x) return "fehlender Wert falsch";
        return s === fv(x, 2) + " m" ? true : "Lösung falsch";
      }
      const sum = k.data.reduce((a, b) => a + b, 0);
      if (sum !== k.n * k.M) return "Summe passt nicht zum Mittelwert";
      if (level === 1 && (k.dig !== 0 || !Number.isInteger(k.M))) return "Mittelwert in Stufe 1 nicht ganzzahlig";
      if (level === 2 && k.dig !== 2) return "Stufe 2 ohne Dezimalzahlen";
      return s === "Mittelwert " + fv(k.M, k.dig) + k.unit ? true : "Mittelwert falsch: " + s;
    },
  });

  // ==================== 2. Diagramme: Veränderungen ====================
  // Werte stehen nicht im Diagramm. Sie sind Vielfache der Skalenschritte s und auf Gitterlinien ablesbar.
  const DSC = [
    { ctx: "Die Säulen zeigen, wie viele Besucher ein Freibad in den Sommermonaten durchschnittlich an einem Tag hatte.", unit: "Besucher",
      names: ["Mai", "Juni", "Juli", "August", "September"], s: 50, k: [2, 8], kinds: ["col", "line"] },
    { ctx: "Die Linie zeigt die Höchsttemperatur an den Tagen einer Woche im Mai in °C.", unit: "°C",
      names: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], s: 5, k: [3, 6], kinds: ["line"] },
    { ctx: "Die Säulen zeigen, wie viele Eisbecher ein Kiosk in den Sommermonaten verkauft hat.", unit: "Becher",
      names: ["Mai", "Juni", "Juli", "August", "September"], s: 20, k: [2, 8], kinds: ["col", "line"] },
    { ctx: "Die Grafik zeigt die Mitgliederzahl eines Sportvereins am Jahresende.", unit: "Mitglieder",
      names: ["2020", "2021", "2022", "2023", "2024", "2025"], s: 50, k: [5, 8], kinds: ["col", "line"] },
  ];

  // Skizze: Säulen oder Linie über Kategorien, Skala mit Gitterlinien in Schritten s bis T
  function diagFig(kind, names, vals, s, T, unit) {
    const W = 140, H = 60, xA = 18, yB = 50, yT = 8;
    const sy = v => yB - (v / T) * (yB - yT);
    const slot = (W - xA - 4) / names.length;
    const cx = i => xA + slot * (i + 0.5);
    const sk = AG.sketch(W, H);
    for (let v = s; v <= T; v += s) sk.line([xA, sy(v)], [W - 3, sy(v)], { dash: true });
    sk.line([xA, yT - 2], [xA, yB]);
    sk.line([xA, yB], [W - 3, yB]);
    for (let v = 0; v <= T; v += s) {
      sk.line([xA - 1.2, sy(v)], [xA, sy(v)]);
      sk.label([xA - 2.5, sy(v)], String(v), { anchor: "end" });
    }
    sk.label([xA + 1, yT - 4], unit, { anchor: "start" });
    names.forEach((nm, i) => sk.label([cx(i), yB + 4.5], nm));
    if (kind === "col") {
      const bw = slot * 0.6;
      vals.forEach((v, i) => sk.rect(cx(i) - bw / 2, sy(v), bw, yB - sy(v), { fill: BLUE }));
    } else {
      const d = vals.map((v, i) => (i ? "L" : "M") + cx(i).toFixed(2) + " " + sy(v).toFixed(2)).join(" ");
      sk.path(d, { width: 0.6 });
      vals.forEach((v, i) => sk.circle([cx(i), sy(v)], 0.9, { fill: AG.SKETCH_COLORS.INK }));
    }
    return sk.done();
  }

  // Werte als Vielfache von s (Anzahl k). Niveau 2: größte Änderung (sigma: +1 Zunahme, −1 Abnahme)
  // eindeutig und in die gewünschte Richtung. Niveau 3: Summe der Werte ist durch die Anzahl teilbar,
  // damit der Durchschnitt glatt ist.
  function makeSeries(rng, sc, level, sigma) {
    const n = sc.names.length;
    for (let tries = 0; tries < 500; tries++) {
      const ks = [];
      for (let i = 0; i < n; i++) ks.push(rng.int(sc.k[0], sc.k[1]));
      if (new Set(ks).size < 3) continue;
      if (level === 3 && ks.reduce((a, b) => a + b, 0) % n) continue;
      const vals = ks.map(k => k * sc.s);
      if (level === 2) {
        const signed = [];
        for (let i = 0; i + 1 < n; i++) signed.push(sigma * (vals[i + 1] - vals[i]));
        const ext = Math.max(...signed);
        if (ext <= 0 || signed.filter(x => x === ext).length !== 1) continue;
      }
      return vals;
    }
    throw new Error("m6-diagramm-veraenderung: keine Werte gefunden");
  }

  AG.registerType({
    id: "m6-diagramm-veraenderung",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Diagramm: Zunahme, Abnahme und Durchschnitt",
    instruction: {
      1: "Lies die Werte aus dem Diagramm ab und berechne die Veränderung.",
      2: "Lies die Werte ab. Berechne die Veränderungen zwischen den Zeitpunkten.",
      3: "Lies die Werte ab und berechne die Veränderung und den Durchschnitt.",
    },
    merke: [
      { b: "Veränderung = späterer Wert − früherer Wert." },
      " Positiv ist es eine Zunahme, negativ eine Abnahme. Beispiel: von 150 auf 200 ist 200 − 150 = 50, also eine Zunahme um 50.",
    ],
    cols: 1,
    generate(rng, level) {
      const sc = rng.pick(DSC);
      const kind = rng.pick(sc.kinds);
      const names = sc.names, n = names.length, U = sc.unit;
      const sigma = rng.chance(0.5) ? 1 : -1;
      const vals = makeSeries(rng, sc, level, sigma);
      const T = (Math.floor(Math.max(...vals) / sc.s) + 1) * sc.s;
      const fig = diagFig(kind, names, vals, sc.s, T, U);
      const K = v => fmtInt(v) + " " + U;
      const ch = d => (d > 0 ? "Zunahme um " + K(d) : "Abnahme um " + K(-d));
      const ctx = sc.ctx + " Die Skala ist in Schritten von " + sc.s + " eingeteilt.";
      const meta = { vals, s: sc.s, unit: U, names };

      if (level === 1) {
        const pairs = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (vals[i] !== vals[j]) pairs.push([i, j]);
        const [i, j] = rng.pick(pairs);
        const d = vals[j] - vals[i];
        return {
          q: rich(ctx, " Wie hat sich der Wert von „", names[i], "“ bis „", names[j], "“ verändert? Gib an, ob es eine Zunahme oder eine Abnahme ist, und wie groß sie ist."),
          a: rich(ch(d)),
          steps: [
            rich(names[i], ": ", K(vals[i])),
            rich(names[j], ": ", K(vals[j])),
            rich("Veränderung: ", fmtInt(vals[j]), " ", MI, " ", fmtInt(vals[i]), " = ", fmtInt(d)),
          ],
          fig, inline: false, meta: { ...meta, i, j },
        };
      }

      if (level === 2) {
        const diffs = [];
        for (let i = 0; i + 1 < n; i++) diffs.push(vals[i + 1] - vals[i]);
        const ext = Math.max(...diffs.map(x => sigma * x));
        const im = diffs.findIndex(x => sigma * x === ext);
        const pairs = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (vals[i] !== vals[j]) pairs.push([i, j]);
        const [i, j] = rng.pick(pairs);
        const tot = vals[j] - vals[i];
        const word = sigma > 0 ? "gestiegen" : "gesunken";
        const label = sigma > 0 ? "Größte Zunahme" : "Größte Abnahme";
        const steps = diffs.map((d, k) => rich(names[k], " bis ", names[k + 1], ": ", fmtInt(vals[k + 1]), " ", MI, " ", fmtInt(vals[k]), " = ", fmtInt(d)));
        steps.push(rich(label, ": ", names[im], " bis ", names[im + 1], " (", K(Math.abs(ext)), ")"));
        steps.push(rich("Veränderung von ", names[i], " bis ", names[j], ": ", fmtInt(vals[j]), " ", MI, " ", fmtInt(vals[i]), " = ", fmtInt(tot)));
        return {
          q: rich(ctx, " a) Zwischen welchen zwei aufeinanderfolgenden Zeitpunkten ist der Wert am stärksten ", word, "? Wie groß ist die Änderung? b) Wie hat sich der Wert von „", names[i], "“ bis „", names[j], "“ insgesamt verändert? Gib an, ob es eine Zunahme oder eine Abnahme ist, und wie groß sie ist."),
          a: rich("a) von „", names[im], "“ bis „", names[im + 1], "“ um ", K(Math.abs(ext)), "; b) ", ch(tot)),
          steps, fig, inline: false, meta: { ...meta, im, i, j, sigma },
        };
      }

      // Niveau 3: Veränderung zwischen zwei Zeitpunkten und Durchschnitt aller Werte
      const pairs = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (vals[i] !== vals[j]) pairs.push([i, j]);
      const [i, j] = rng.pick(pairs);
      const d = vals[j] - vals[i];
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / n;
      return {
        q: rich(ctx, " a) Wie hat sich der Wert von „", names[i], "“ bis „", names[j], "“ verändert? Gib an, ob es eine Zunahme oder eine Abnahme ist, und wie groß sie ist. b) Wie groß ist der Durchschnitt (Mittelwert) aller Werte im Diagramm?"),
        a: rich(ch(d), "; b) Durchschnitt ", K(avg)),
        steps: [
          rich("Veränderung: ", fmtInt(vals[j]), " ", MI, " ", fmtInt(vals[i]), " = ", fmtInt(d)),
          rich("Summe aller Werte: ", vals.map(v => fmtInt(v)).join(" + "), " = ", fmtInt(sum)),
          rich("Durchschnitt: ", fmtInt(sum), " : ", String(n), " = ", fmtInt(avg), " ", U),
        ],
        fig, inline: false, meta: { ...meta, i, j, avg },
      };
    },
    verify(t, level) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const v = m.vals, n = v.length, s = plain(t.a);
      if (v.some(x => x <= 0 || x % m.s !== 0)) return "Werte nicht auf Gitterlinien";
      const K = x => fmtInt(x) + " " + m.unit;
      const ch = d => (d > 0 ? "Zunahme um " + K(d) : "Abnahme um " + K(-d));
      if (level === 1) {
        const d = v[m.j] - v[m.i];
        return d !== 0 && s === ch(d) ? true : "Veränderung falsch";
      }
      if (level === 2) {
        const diffs = [];
        for (let i = 0; i + 1 < n; i++) diffs.push(v[i + 1] - v[i]);
        const ext = Math.max(...diffs.map(x => m.sigma * x));
        if (diffs.filter(x => m.sigma * x === ext).length !== 1) return "größte Änderung nicht eindeutig";
        if (m.sigma * diffs[m.im] !== ext) return "größte Änderung falsch";
        const tot = v[m.j] - v[m.i];
        if (tot === 0) return "keine Gesamtveränderung";
        const want = "a) von „" + m.names[m.im] + "“ bis „" + m.names[m.im + 1] + "“ um " + K(Math.abs(ext)) + "; b) " + ch(tot);
        return s === want ? true : "Lösung falsch";
      }
      const sum = v.reduce((a, b) => a + b, 0);
      if (sum % n) return "Durchschnitt nicht glatt";
      const d = v[m.j] - v[m.i];
      if (d === 0) return "keine Veränderung";
      return s === ch(d) + "; b) Durchschnitt " + K(sum / n) ? true : "Lösung falsch";
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
