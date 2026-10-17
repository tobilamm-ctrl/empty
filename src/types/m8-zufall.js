// M8 LB 6: Zufallsexperimente – relative Häufigkeit, Gewinnchance (Laplace), Ergebnisse auswerten.
(function (AG) {
  const { Frac, num, rich, plain, fmtDec } = AG;
  const PAL = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];

  // ---------- Hilfen ----------
  const Q = s => "„" + s + "“";
  const joinList = items => (items.length > 1 ? items.slice(0, -1).join(", ") + " und " + items[items.length - 1] : String(items[0]));
  // Prozentwert, wenn er glatt ist (höchstens 1 Nachkommastelle), sonst null
  const exactPct = f => { const p = new Frac(f.n * 100, f.d); return p.decimals() <= 1 ? fmtDec(p) + " %" : null; };
  // Prozentwert, auf eine Nachkommastelle gerundet, wenn nötig („33,3 %“)
  const approxPct = f => exactPct(f) || fmtDec(new Frac(Math.round((f.n * 1000) / f.d), 10), 1) + " %";
  // Prozentwert mit Zeichen („= 25 %“ bzw. „≈ 33,3 %“)
  const pctTxt = f => (exactPct(f) ? exactPct(f) : "≈ " + approxPct(f));
  // Bruch mit Prozentwert („3/8 = 37,5 %“, „1/3 ≈ 33,3 %“)
  const chanceRich = f => rich(num(f), " " + (exactPct(f) ? "=" : "≈") + " " + approxPct(f));

  // ---------- Zufallsexperimente ----------
  const DICE = [
    { t: "eine gerade Zahl", s: [2, 4, 6] },
    { t: "eine ungerade Zahl", s: [1, 3, 5] },
    { t: "eine Primzahl", s: [2, 3, 5] },
    { t: "eine Zahl größer als 4", s: [5, 6] },
    { t: "eine Zahl kleiner als 3", s: [1, 2] },
    { t: "eine durch 3 teilbare Zahl", s: [3, 6] },
    { t: "eine 6", s: [6] },
    { t: "eine Zahl kleiner als 5", s: [1, 2, 3, 4] },
    { t: "eine Zahl größer als 2", s: [3, 4, 5, 6] },
  ];
  // Farben der Felder und Kugeln (Standardfarben)
  const COLS = [
    { n: "blau", a: "blaue", c: PAL[0] },
    { n: "grün", a: "grüne", c: PAL[1] },
    { n: "orange", a: "orange", c: PAL[2] },
    { n: "lila", a: "lila", c: PAL[3] },
    { n: "grau", a: "graue", c: PAL[4] },
  ];
  const WHEEL_N = [4, 5, 6, 8];
  const URN_T = [6, 8, 10, 12, 15, 20];
  const LOTS = [10, 12, 15, 20, 25, 30, 40, 50];
  // Zielwerte für Lostrommeln (alle mit glattem Prozentsatz: 50, 75, 60, 80, 40, 25 %)
  const TARGETS = [[1, 2], [3, 4], [3, 5], [4, 5], [2, 5], [1, 4]];

  // Farben mit Anzahlen: Farbe col mit c Feldern bzw. Kugeln, die übrigen Farben mit je mindestens 1
  function colorSet(rng, total, col, c) {
    const rest = total - c;
    const others = rng.shuffle(COLS.filter(x => x !== col)).slice(0, Math.min(rest, rng.int(1, 3)));
    const cnt = others.map(() => 1);
    for (let r = rest - others.length; r > 0; r--) cnt[rng.int(0, cnt.length - 1)]++;
    return { cols: [col, ...others], cnt: [c, ...cnt] };
  }
  // Farbindex je Feld in zufälliger Reihenfolge
  function sectorsOf(rng, cnt) {
    const seq = [];
    cnt.forEach((c, i) => { for (let r = 0; r < c; r++) seq.push(i); });
    return rng.shuffle(seq);
  }
  function wheelText(n, cols, cnt) {
    return "Ein Glücksrad hat " + n + " gleich große Felder: " + joinList(cols.map((c, i) => cnt[i] + " " + c.n)) + ".";
  }
  function urnText(cols, cnt) {
    return "In einer Urne liegen " + cnt.reduce((a, b) => a + b, 0) + " Kugeln: " + joinList(cols.map((c, i) => cnt[i] + " " + c.a)) + ".";
  }

  // Glücksrad: Felder ab 12 Uhr im Uhrzeigersinn, Feldnummern außen
  function drawWheel(s, cx, cy, r, cols, sectors) {
    const n = sectors.length, step = (2 * Math.PI) / n, a0 = -Math.PI / 2;
    sectors.forEach((ci, i) => {
      const a = a0 + i * step, b = a + step;
      const p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const p1 = [cx + r * Math.cos(b), cy + r * Math.sin(b)];
      s.path(`M${cx},${cy} L${p0[0]},${p0[1]} A${r},${r} 0 0,1 ${p1[0]},${p1[1]} Z`, { fill: cols[ci].c });
      const m = a + step / 2, lr = r + 3.8;
      s.label([cx + lr * Math.cos(m), cy + lr * Math.sin(m)], String(i + 1));
    });
  }
  function wheelFig(cols, sectors) {
    const s = AG.sketch(70, 46);
    drawWheel(s, 35, 23, 15, cols, sectors);
    return s.done();
  }
  function wheelsFig(colsA, secA, colsB, secB) {
    const s = AG.sketch(76, 46);
    drawWheel(s, 19, 23, 12.5, colsA, secA);
    s.circle([19, 23], 2.6, { fill: "#fff" });
    s.label([19, 23], "A");
    drawWheel(s, 57, 23, 12.5, colsB, secB);
    s.circle([57, 23], 2.6, { fill: "#fff" });
    s.label([57, 23], "B");
    return s.done();
  }

  // Ergebnis als Aufgabe: günstige Ergebnisse : alle möglichen Ergebnisse
  function outcome(favN, totN, q, fig, meta, pre) {
    const f = new Frac(favN, totN);
    const steps = [pre || rich("günstige Ergebnisse: ", num(favN), " von ", num(totN))];
    steps.push(rich("Gewinnchance = ", num(favN), " : ", num(totN), " = ", chanceRich(f)));
    const out = { q, a: chanceRich(f), steps, inline: false, meta: { ...meta, favN, totN } };
    if (fig) out.fig = fig;
    return out;
  }

  // Stufe 1: ein einfaches Ereignis
  function level1(rng) {
    const kind = rng.pick(["wheel", "urn", "lot", "dice"]);
    if (kind === "wheel") {
      const n = rng.pick(WHEEL_N), col = rng.pick(COLS), c = rng.int(1, n - 1);
      const W = colorSet(rng, n, col, c);
      return outcome(c, n,
        rich(wheelText(n, W.cols, W.cnt), " Man gewinnt, wenn der Zeiger auf ", Q(col.n), " stehen bleibt. Wie groß ist die Gewinnchance?"),
        wheelFig(W.cols, sectorsOf(rng, W.cnt)), { kind: "chance" });
    }
    if (kind === "urn") {
      const T = rng.pick(URN_T), col = rng.pick(COLS), c = rng.int(1, T - 1);
      const W = colorSet(rng, T, col, c);
      return outcome(c, T,
        rich(urnText(W.cols, W.cnt), " Man zieht ohne Hinzuschauen eine Kugel und gewinnt, wenn sie ", Q(col.n), " ist. Wie groß ist die Gewinnchance?"),
        null, { kind: "chance" });
    }
    if (kind === "lot") {
      const n = rng.pick(LOTS), x = rng.int(1, n - 1), niete = rng.chance(0.3);
      return outcome(niete ? n - x : x, n,
        rich(`In einer Lostrommel liegen ${n} Lose, davon ${x} Gewinnlose. Man zieht ohne Hinzuschauen ein Los. `,
          niete ? "Wie groß ist die Chance, eine Niete zu ziehen?" : "Wie groß ist die Gewinnchance?"),
        null, { kind: "chance" });
    }
    const E = rng.pick(DICE);
    return outcome(E.s.length, 6,
      rich("Ein Würfel wird einmal geworfen. Man gewinnt, wenn ", E.t, " fällt. Wie groß ist die Gewinnchance?"),
      null, { kind: "chance" });
  }

  // Stufe 2: zusammengesetztes Ereignis („blau oder grün“)
  function level2(rng) {
    const kind = rng.pick(["wheel", "urn", "dice"]);
    if (kind === "wheel" || kind === "urn") {
      let n, col1, W, j, fav;
      for (let t = 0; ; t++) {
        if (t > 2000) throw new Error("m8-gewinnchance: keine Aufgabe gefunden");
        n = kind === "wheel" ? rng.pick(WHEEL_N) : rng.pick(URN_T);
        col1 = rng.pick(COLS);
        W = colorSet(rng, n, col1, rng.int(1, n - 2));
        j = rng.int(1, W.cols.length - 1);
        fav = W.cnt[0] + W.cnt[j];
        if (fav < n) break;
      }
      const pre = rich("günstige Ergebnisse: ", num(W.cnt[0]), " + ", num(W.cnt[j]), " = ", num(fav), " von ", num(n));
      const end = rich(" Man gewinnt, wenn ", kind === "wheel" ? "der Zeiger auf " : "die Kugel ", Q(W.cols[0].n), " oder ", Q(W.cols[j].n),
        kind === "wheel" ? " stehen bleibt. Wie groß ist die Gewinnchance?" : " ist. Wie groß ist die Gewinnchance?");
      if (kind === "wheel") {
        return outcome(fav, n, rich(wheelText(n, W.cols, W.cnt), end), wheelFig(W.cols, sectorsOf(rng, W.cnt)), { kind: "chance" }, pre);
      }
      return outcome(fav, n, rich(urnText(W.cols, W.cnt), " Man zieht ohne Hinzuschauen eine Kugel.", end), null, { kind: "chance" }, pre);
    }
    let E1, E2, u;
    for (let t = 0; ; t++) {
      if (t > 2000) throw new Error("m8-gewinnchance: keine Würfelaufgabe gefunden");
      E1 = rng.pick(DICE);
      E2 = rng.pick(DICE);
      if (E1 === E2) continue;
      u = [...new Set([...E1.s, ...E2.s])].sort((x, y) => x - y);
      if (u.length < 6) break;
    }
    return outcome(u.length, 6,
      rich("Ein Würfel wird einmal geworfen. Man gewinnt, wenn ", E1.t, " oder ", E2.t, " fällt. Wie groß ist die Gewinnchance?"),
      null, { kind: "chance" },
      rich("günstige Augenzahlen: ", joinList(u.map(String)), ", also ", num(u.length), " von 6"));
  }

  // Stufe 3: Vergleich zweier Glücksräder, Urnen oder Lostrommeln bzw. fehlende Gewinnlose
  function addTask(rng) {
    let n, x, p, qd, k;
    for (let t = 0; ; t++) {
      if (t > 2000) throw new Error("m8-gewinnchance: keine Lostrommel-Aufgabe gefunden");
      n = rng.pick([10, 12, 15, 20, 25, 30, 40]);
      x = rng.int(1, n - 1);
      [p, qd] = rng.pick(TARGETS);
      const top = p * n - qd * x, den = qd - p;
      if (top <= 0 || top % den !== 0) continue;
      k = top / den;
      if (k < 1 || k > 30) continue;
      break;
    }
    const pct = exactPct(new Frac(p, qd));
    const q = rich(`In einer Lostrommel liegen ${n} Lose, davon ${x} Gewinnlose. Es werden nur Gewinnlose dazugelegt. ` +
      `Wie viele Gewinnlose müssen dazugelegt werden, damit die Gewinnchance genau ${pct} beträgt?`);
    const steps = [
      rich("(", String(x), " + k) : (", String(n), " + k) = ", num(new Frac(p, qd))),
      rich(String(qd), " · (", String(x), " + k) = ", String(p), " · (", String(n), " + k)"),
      rich(String(qd * x), " + ", String(qd), "k = ", String(p * n), " + ", String(p), "k   | − ", String(p), "k − ", String(qd * x)),
      rich(qd - p === 1 ? "k" : String(qd - p) + "k", " = ", String(p * n - qd * x)),
      ...(qd - p === 1 ? [] : [rich("k = ", String(k))]),
    ];
    return { q, a: rich(String(k), " Gewinnlose"), steps, inline: false, meta: { kind: "add", x, n, k, p, qd } };
  }

  function level3(rng) {
    const kind = rng.pick(["wheel", "urn", "lot", "add"]);
    if (kind === "add") return addTask(rng);
    const col = rng.pick(COLS);
    const pair = () => {
      const tot = kind === "wheel" ? rng.pick(WHEEL_N) : kind === "urn" ? rng.pick(URN_T) : rng.pick(LOTS);
      return { tot, fav: rng.int(1, tot - 1) };
    };
    let A, B;
    for (let t = 0; ; t++) {
      if (t > 2000) throw new Error("m8-gewinnchance: keine Vergleichsaufgabe gefunden");
      A = pair();
      B = pair();
      if (Math.abs(A.fav / A.tot - B.fav / B.tot) >= 0.02) break;
    }
    const labels = kind === "wheel" ? ["Glücksrad A", "Glücksrad B"] : kind === "urn" ? ["Urne A", "Urne B"] : ["Lostrommel A", "Lostrommel B"];
    const fa = new Frac(A.fav, A.tot), fb = new Frac(B.fav, B.tot);
    const aWin = fa.cmp(fb) > 0;
    const labW = aWin ? labels[0] : labels[1];
    const fW = aWin ? fa : fb, fL = aWin ? fb : fa;
    let text, fig;
    if (kind === "wheel") {
      const WA = colorSet(rng, A.tot, col, A.fav), WB = colorSet(rng, B.tot, col, B.fav);
      fig = wheelsFig(WA.cols, sectorsOf(rng, WA.cnt), WB.cols, sectorsOf(rng, WB.cnt));
      text = `Glücksrad A (links) hat ${A.tot} gleich große Felder, davon ${A.fav} ${col.n}. ` +
        `Glücksrad B (rechts) hat ${B.tot} gleich große Felder, davon ${B.fav} ${col.n}. ` +
        `Man gewinnt, wenn der Zeiger auf ${Q(col.n)} stehen bleibt. Bei welchem Glücksrad ist die Gewinnchance größer? Begründe mit Brüchen oder Prozenten.`;
    } else if (kind === "urn") {
      const andere = n => `${n} andere Kugel${n === 1 ? "" : "n"}`;
      text = `Urne A enthält ${A.fav} ${col.a} und ${andere(A.tot - A.fav)}. ` +
        `Urne B enthält ${B.fav} ${col.a} und ${andere(B.tot - B.fav)}. ` +
        `Man gewinnt, wenn man ohne Hinzuschauen eine Kugel in der Farbe ${Q(col.n)} zieht. In welcher Urne ist die Gewinnchance größer? Begründe mit Brüchen oder Prozenten.`;
    } else {
      text = `Lostrommel A hat ${A.tot} Lose, davon ${A.fav} Gewinnlose. Lostrommel B hat ${B.tot} Lose, davon ${B.fav} Gewinnlose. ` +
        `Man zieht ohne Hinzuschauen ein Los. Bei welcher Lostrommel ist die Gewinnchance größer? Begründe mit Brüchen oder Prozenten.`;
    }
    const steps = [
      rich(labels[0], ": ", num(A.fav), " : ", num(A.tot), " = ", chanceRich(fa)),
      rich(labels[1], ": ", num(B.fav), " : ", num(B.tot), " = ", chanceRich(fb)),
      rich("Vergleich: ", approxPct(fL), " < ", approxPct(fW)),
    ];
    const out = {
      q: rich(text),
      a: rich(labW, " hat die größere Gewinnchance: ", chanceRich(fW), " gegenüber ", chanceRich(fL), "."),
      steps, inline: false,
      meta: { kind: "cmp", favA: A.fav, totA: A.tot, favB: B.fav, totB: B.tot, labW },
    };
    if (fig) out.fig = fig;
    return out;
  }

  AG.registerType({
    id: "m8-gewinnchance",
    klasse: "8",
    zug: "RM",
    lb: "6",
    lbTitle: "Zufallsexperimente",
    title: "Gewinnchance",
    topic: "daten",
    instruction: {
      1: "Berechne die Gewinnchance. Gib sie als gekürzten Bruch und in Prozent an.",
      2: "Berechne die Gewinnchance für das zusammengesetzte Ereignis. Gib sie als gekürzten Bruch und in Prozent an.",
      3: "Vergleiche die Gewinnchancen bzw. berechne die fehlenden Gewinnlose. Begründe.",
    },
    merke: [
      "Laplace-Regel (nur bei gleich wahrscheinlichen Ergebnissen): Gewinnchance = günstige Ergebnisse : alle möglichen Ergebnisse. ",
      "Beispiel: Glücksrad mit 8 gleich großen Feldern, 3 davon blau → 3 : 8 = ", { f: [3, 8] }, " = 37,5 %.",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return level1(rng);
      if (level === 2) return level2(rng);
      return level3(rng);
    },
    verify(t) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const s = plain(t.a);
      if (m.kind === "add") {
        const k = m.k;
        if (!(Number.isInteger(k) && k > 0)) return "k ungültig";
        if (!new Frac(m.x + k, m.n + k).eq(new Frac(m.p, m.qd))) return "Gewinnchance nach dem Hinzufügen stimmt nicht";
        return s === k + " Gewinnlose" ? true : "Ergebnis falsch: " + s;
      }
      if (m.kind === "cmp") {
        const fA = new Frac(m.favA, m.totA), fB = new Frac(m.favB, m.totB);
        if (fA.eq(fB)) return "gleiche Gewinnchancen";
        const win = fA.cmp(fB) > 0 ? "A" : "B";
        if (!m.labW.endsWith(win)) return "Gewinner falsch";
        if (!s.startsWith(m.labW + " hat die größere")) return "Antwort nennt falschen Gewinner";
        const fW = win === "A" ? fA : fB;
        if (!s.includes(plain(chanceRich(fW)))) return "Gewinnchance fehlt im Lösungstext";
        return true;
      }
      if (!(m.favN >= 1 && m.favN < m.totN)) return "Anzahl günstiger Ergebnisse unplausibel";
      const f = new Frac(m.favN, m.totN);
      return s === plain(chanceRich(f)) ? true : "Lösung stimmt nicht: " + s;
    },
  });

  // ---------- Absolute und relative Häufigkeit ----------
  // Gesamtzahlen, bei denen jede Anzahl einen glatten Prozentwert ergibt (höchstens 1 Nachkommastelle)
  const PCT_N = [20, 25, 40, 50, 100, 200];
  const HAEUF_EXPS = [
    { intro: N => `Ein Würfel wird ${N}-mal geworfen.`, outs: () => ["1", "2", "3", "4", "5", "6"] },
    { intro: N => `Eine Münze wird ${N}-mal geworfen.`, outs: () => ["Wappen", "Zahl"] },
    { intro: N => `Eine Reißzwecke wird ${N}-mal geworfen. Die Tabelle zeigt, wie sie liegen blieb.`, outs: () => ["Spitze oben", "Spitze unten"] },
    { intro: N => `Ein Glücksrad wird ${N}-mal gedreht. Die Tabelle zeigt, auf welcher Farbe der Zeiger stehen blieb.`,
      outs: rng => rng.shuffle(["Blau", "Grün", "Orange", "Lila", "Grau"]).slice(0, rng.int(3, 4)) },
  ];
  // Absolute Häufigkeiten: jede mindestens 10 % und höchstens 60 % der Gesamtzahl
  function partition(rng, N, k) {
    const lo = Math.max(1, Math.round(0.1 * N)), hi = Math.round(0.6 * N);
    for (let t = 0; t < 5000; t++) {
      const c = new Array(k).fill(1);
      for (let r = N - k; r > 0; r--) c[rng.int(0, k - 1)]++;
      if (c.every(v => v >= lo && v <= hi)) return c;
    }
    throw new Error("m8-relative-haeufigkeit: keine Verteilung gefunden");
  }

  AG.registerType({
    id: "m8-relative-haeufigkeit",
    klasse: "8",
    zug: "RM",
    lb: "6",
    lbTitle: "Zufallsexperimente",
    title: "Absolute und relative Häufigkeit",
    topic: "daten",
    instruction: {
      1: "Ergänze die relative Häufigkeit. Kürze den Bruch vollständig.",
      2: "Ergänze die Tabelle: relative Häufigkeiten als gekürzte Brüche und in Prozent.",
      3: "Ergänze die fehlende absolute Häufigkeit. Nutze die relative Häufigkeit.",
    },
    merke: [
      "Relative Häufigkeit = absolute Häufigkeit : Gesamtzahl. In Prozent: relative Häufigkeit · 100. ",
      "Beispiel: 5 von 20 Würfen ergeben eine 6 → 5 : 20 = ", { f: [1, 4] }, " = 25 %.",
    ],
    cols: 1,
    generate(rng, level) {
      const E = rng.pick(HAEUF_EXPS);
      const outs = E.outs(rng);
      const k = outs.length;
      const N = rng.pick(PCT_N);
      const cnt = partition(rng, N, k);
      const i = rng.int(0, k - 1);
      const x = outs[i], c = cnt[i];
      const f = new Frac(c, N);
      const bruch = j => num(new Frac(cnt[j], N));
      const pct = j => rich(exactPct(new Frac(cnt[j], N)));
      const blankRel = [{ blank: 5 }], blankPct = [{ blank: 4 }], blankAbs = [{ blank: 3 }];
      const head = [rich("Ergebnis"), rich("absolute Häufigkeit"), rich("relative Häufigkeit als Bruch"), rich("in %")];
      const total = [rich({ b: "Gesamt" }), num(N), num(new Frac(1)), rich("100 %")];
      const full = j => [rich(outs[j]), num(cnt[j]), bruch(j), pct(j)];
      const body = outs.map((o, j) => {
        if (level === 2 || (level === 1 && j === i)) return [rich(o), num(cnt[j]), blankRel, blankPct];
        if (level === 3 && j === i) return [rich(o), blankAbs, bruch(j), pct(j)];
        return full(j);
      });
      const table = { rows: [head, ...body, total] };
      const aTable = { rows: [head, ...outs.map((_, j) => full(j)), total] };
      const intro = E.intro(N);
      let q, a, steps;
      if (level === 1) {
        q = rich(intro, " Ergänze in der Tabelle die relative Häufigkeit von ", Q(x), " als gekürzten Bruch und in Prozent.");
        a = rich(bruch(i), " = ", pct(i));
        steps = [rich(num(c), " : ", num(N), " = ", bruch(i)), rich("= ", num(f, { as: "dec" }), " = ", pct(i))];
      } else if (level === 2) {
        q = rich(intro, " Ergänze die Tabelle: Gib die relativen Häufigkeiten als gekürzte Brüche und in Prozent an.");
        const parts = [];
        outs.forEach((o, j) => { if (j) parts.push("; "); parts.push(rich(o, ": ", bruch(j), " = ", pct(j))); });
        a = rich(parts);
        steps = outs.map((o, j) => rich(o, ": ", num(cnt[j]), " : ", num(N), " = ", bruch(j), " = ",
          num(new Frac(cnt[j], N), { as: "dec" }), " = ", pct(j)));
      } else {
        q = rich(intro, " Die absolute Häufigkeit von ", Q(x), " fehlt in der Tabelle. Berechne sie aus der relativen Häufigkeit.");
        a = rich(num(c), "-mal");
        steps = [rich("absolute Häufigkeit = relative Häufigkeit · Gesamtzahl"), rich(bruch(i), " · ", num(N), " = ", num(c))];
      }
      return { q, a, steps, table, aTable, meta: { N, cnt, i, k } };
    },
    verify(t, level) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const { N, cnt, i } = m;
      if (cnt.reduce((a, b) => a + b, 0) !== N) return "Summe der Häufigkeiten ist nicht N";
      if (cnt.some(c => c < 1)) return "Häufigkeit 0";
      const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
      const want = level === 1 ? 2 : level === 2 ? 2 * cnt.length : 1;
      if (blanks !== want) return "Anzahl der Lücken falsch";
      const s = plain(t.a);
      if (level === 3) return s === cnt[i] + "-mal" ? true : "Lösung falsch: " + s;
      const rows = level === 1 ? [i] : cnt.map((_, j) => j);
      for (const j of rows) {
        const f = new Frac(cnt[j], N);
        if (!s.includes(plain(num(f))) || !s.includes(exactPct(f))) return "Bruch oder Prozent fehlt im Lösungstext";
      }
      return true;
    },
  });

  // ---------- Ergebnisse auswerten ----------
  const EXP3 = [
    { faces: ["1", "2", "3", "4", "5", "6"], sym: ["1", "2", "3", "4", "5", "6"], face: "Augenzahl", obj: "Würfel", k: 6,
      intro: N => `Ein Würfel wird ${N}-mal geworfen.` },
    { faces: ["Wappen", "Zahl"], sym: ["W", "Z"], face: "Ergebnis", obj: "Münze", k: 2,
      intro: N => `Eine Münze wird ${N}-mal geworfen.` },
  ];
  // Anzahlen mit fester Abweichung: jede höchstens d von N/k (d so, dass die Abweichung der Häufigkeit höchstens 3 Prozentpunkte ist)
  function spread(rng, total, k, d) {
    const base = Math.round(total / k);
    for (let t = 0; t < 2000; t++) {
      const c = Array.from({ length: k }, () => base + rng.int(-d, d));
      let sum = c.reduce((a, b) => a + b, 0), guard = 0;
      while (sum !== total && guard++ < 1000) {
        const j = rng.int(0, k - 1);
        if (sum < total && c[j] < base + d) { c[j]++; sum++; }
        else if (sum > total && c[j] > base - d) { c[j]--; sum--; }
      }
      if (sum === total) return c;
    }
    throw new Error("m8-ergebnisse-auswerten: keine Verteilung gefunden");
  }
  // Säulendiagramm mit Achse ab 0 und Anzahlen über den Säulen
  function colFig(names, vals) {
    const W = 120, H = 58, xA = 14, yB = 48, yT = 8;
    const raw = Math.max(...vals) * 1.15;
    const step = [5, 10, 20, 25, 50, 100].find(st => raw / st <= 6);
    const T = Math.ceil(raw / step) * step;
    const sy = v => yB - (v / T) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 2], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    for (let t = 0; t <= T; t += step) {
      s.line([xA - 1, sy(t)], [xA, sy(t)]);
      s.label([xA - 2, sy(t)], String(t), { anchor: "end" });
    }
    const slot = (W - xA - 4) / names.length, bw = slot * 0.5;
    names.forEach((nm, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(vals[i]), bw, yB - sy(vals[i]), { fill: PAL[0] });
      s.label([x + bw / 2, sy(vals[i]) - 3.2], String(vals[i]));
      s.label([x + bw / 2, yB + 4.5], nm);
    });
    return s.done();
  }

  AG.registerType({
    id: "m8-ergebnisse-auswerten",
    klasse: "8",
    zug: "RM",
    lb: "6",
    lbTitle: "Zufallsexperimente",
    title: "Ergebnisse auswerten",
    topic: "daten",
    instruction: {
      1: "Werte das Ergebnis aus. Gib die relative Häufigkeit als gekürzten Bruch und in Prozent an.",
      2: "Werte das Ergebnis aus und vergleiche die relative Häufigkeit mit der erwarteten Wahrscheinlichkeit.",
      3: "Werte das Diagramm aus. Begründe deine Antwort in ganzen Sätzen.",
    },
    merke: [
      "Relative Häufigkeit = absolute Häufigkeit : Anzahl aller Versuche. Passt sie nicht zur erwarteten Wahrscheinlichkeit, kann das Zufall sein. ",
      "Bei sehr vielen Versuchen spricht eine große Abweichung dafür, dass das Experiment verfälscht ist (z. B. ein gezinkter Würfel).",
    ],
    cols: 1,
    generate(rng, level) {
      const E = level === 3 ? EXP3[0] : rng.pick(EXP3);
      const k = E.k;
      const pres = level !== 3 && rng.chance(0.5) ? "list" : "chart";
      const N = level === 3 ? rng.pick([120, 150, 180, 200, 240, 300, 360, 400, 500, 600])
        : pres === "list" ? rng.pick([20, 24, 30]) : rng.pick([60, 120, 150, 200]);
      let cnt, i, gez = false;
      if (level === 3) {
        gez = rng.chance(0.5);
        const d = Math.floor(0.025 * N);
        if (gez) {
          // eine Augenzahl kommt deutlich häufiger oder seltener vor als erwartet
          i = rng.int(0, k - 1);
          const delta = (rng.chance(0.5) ? 1 : -1) * rng.pick([0.1, 0.12, 0.14]);
          const cf = Math.round(N * (1 / k + delta));
          const others = spread(rng, N - cf, k - 1, d);
          let o = 0;
          cnt = Array.from({ length: k }, (_, j) => (j === i ? cf : others[o++]));
        } else {
          cnt = spread(rng, N, k, d);
          i = rng.int(0, k - 1);
        }
      } else {
        cnt = partition(rng, N, k);
        i = rng.int(0, k - 1);
      }
      const x = E.faces[i], c = cnt[i];
      const f = new Frac(c, N), p = new Frac(1, k);
      const devPP = fmtDec(new Frac(Math.round(Math.abs((c * 100) / N - 100 / k) * 10), 10));
      let base = (level === 1 ? (E.obj === "Würfel" ? "Ein Würfel wird mehrmals geworfen." : "Eine Münze wird mehrmals geworfen.") : E.intro(N)) + " ";
      if (pres === "list") {
        const seq = [];
        cnt.forEach((cc, j) => { for (let r = 0; r < cc; r++) seq.push(j); });
        const order = rng.shuffle(seq).map(j => E.sym[j]).join("; ");
        base += "Die Ergebnisse in der Reihenfolge" + (E.obj === "Münze" ? " (W = Wappen, Z = Zahl)" : "") + ": " + order + ".";
      } else {
        base += "Das Säulendiagramm zeigt, wie oft jedes Ergebnis vorkam.";
      }
      const fig = pres === "chart" || level === 3 ? colFig(E.faces, cnt) : null;
      const meta = { N, cnt, i, k, pres, gez };
      if (level === 1) {
        return {
          q: rich(base, " Wie oft wurde insgesamt geworfen? Wie oft kam ", Q(x), " vor? Gib die relative Häufigkeit von ", Q(x), " als gekürzten Bruch und in Prozent an."),
          a: rich("Insgesamt ", num(N), " Würfe. ", Q(x), ": ", num(c), "-mal, relative Häufigkeit ", chanceRich(f), "."),
          steps: [rich("insgesamt: ", cnt.join(" + "), " = ", num(N)), rich("Anzahl ", Q(x), ": ", num(c)), rich("relative Häufigkeit: ", num(c), " : ", num(N), " = ", chanceRich(f))],
          fig: fig || undefined, inline: false, meta,
        };
      }
      if (level === 2) {
        const pass = Math.abs(c / N - 1 / k) <= 0.05;
        return {
          q: rich(base, " Wie groß ist die relative Häufigkeit von ", Q(x), " in Prozent? Passt das zur erwarteten Wahrscheinlichkeit ",
            num(p), " für ", Q(x), "? Begründe kurz."),
          a: rich("relative Häufigkeit ", pctTxt(f), ". ", pass
            ? rich("Ja, das passt gut zu ", num(p), ": die Abweichung ist klein.")
            : rich("Die Abweichung von ", num(p), " ist recht groß. Bei nur ", num(N), " Würfen ist das aber nicht ungewöhnlich. Erst bei sehr vielen Würfen liegt die relative Häufigkeit meist nahe bei ", num(p), ".")),
          steps: [
            rich("relative Häufigkeit: ", num(c), " : ", num(N), " = ", chanceRich(f)),
            rich("erwartet: ", chanceRich(p)),
            rich("Abweichung: ", devPP, " Prozentpunkte"),
          ],
          fig: fig || undefined, inline: false, meta: { ...meta, pass },
        };
      }
      const maxDev = Math.max(...cnt.map(cc => Math.abs(cc / N - 1 / k)));
      return {
        q: rich(base, " a) Wie groß ist die relative Häufigkeit der ", E.face, " ", Q(x), "? b) Ist der ", E.obj, " vermutlich gezinkt? Begründe mit den Zahlen."),
        a: rich("a) ", chanceRich(f), ". b) ", gez
          ? rich("Ja, der Würfel ist vermutlich gezinkt. Bei ", num(N), " Würfen weicht die Häufigkeit der Augenzahl ", x, " stark von ", num(p), " ab.")
          : rich("Nein, der Würfel ist vermutlich nicht gezinkt. Bei ", num(N), " Würfen sind alle Abweichungen von ", num(p), " klein.")),
        steps: [
          rich("relative Häufigkeit: ", num(c), " : ", num(N), " = ", chanceRich(f)),
          rich("erwartet: ", chanceRich(p)),
          rich("Abweichung: ", devPP, " Prozentpunkte"),
          rich(gez ? "Bei so vielen Würfen ist eine Abweichung von über 8 Prozentpunkten kein Zufall mehr."
            : "Bei so vielen Würfen ist eine kleine Abweichung normal."),
        ],
        fig, inline: false, meta: { ...meta, maxDev },
      };
    },
    verify(t, level) {
      const m = t.meta;
      if (!m) return "meta fehlt";
      const { N, cnt, i, k } = m;
      if (cnt.reduce((a, b) => a + b, 0) !== N) return "Summe der Häufigkeiten ist nicht N";
      const s = plain(t.a);
      const f = new Frac(cnt[i], N);
      if (level === 1) {
        return s.startsWith("Insgesamt " + N + " Würfe.") && s.includes(plain(num(f))) && s.includes(approxPct(f))
          ? true : "Lösung unvollständig: " + s;
      }
      if (level === 2) {
        const pass = Math.abs(cnt[i] / N - 1 / k) <= 0.05;
        if (s.includes("Ja, das passt") !== pass) return "Bewertung passt nicht zur Abweichung";
        return s.includes(approxPct(f)) ? true : "Prozent fehlt";
      }
      const maxDev = Math.max(...cnt.map(cc => Math.abs(cc / N - 1 / k)));
      if (m.gez && maxDev < 0.08) return "als gezinkt markiert, aber Abweichung klein";
      if (!m.gez && maxDev > 0.03) return "nicht gezinkt, aber Abweichung groß";
      const want = m.gez ? "Ja, der Würfel ist vermutlich gezinkt" : "Nein, der Würfel ist vermutlich nicht gezinkt";
      if (!s.includes(want)) return "Antwort zur Zinkung fehlt";
      return s.includes(plain(num(f))) && s.includes(approxPct(f)) ? true : "Bruch oder Prozent fehlt";
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
