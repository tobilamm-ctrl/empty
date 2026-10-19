// M10 LB 2 (Wachstum und Zerfall): Wachstumsfaktor, Endwert, Anfangswert, Dauer und Wertetabellen.
// Vorbilder: m7-prozent.js (Prozentrechnung), m9-zinsen.js (Zinseszins), m8-funktionen.js (Wertetabellen mit table/aTable).
(function (AG) {
  const { Frac, rich, MINUS, fmtDec, fmtInt } = AG;

  // ---------- Hilfen ----------
  const sup = t => ({ sup: t });
  const ex = n => (n < 0 ? MINUS : "") + String(Math.abs(n));
  const powF = (f, n) => { let v = new Frac(1); for (let i = 0; i < n; i++) v = v.mul(f); return v; };
  // Zahl als Text mit dec Nachkommastellen (Standard: so viele wie nötig)
  const F = (x, dec) => fmtDec(Frac.of(x), dec);
  // kaufmännisch runden auf dec Stellen (f ≥ 0)
  const roundF = (f, dec) => { const s = 10 ** dec; return new Frac(Math.floor((2 * f.n * s + f.d) / (2 * f.d)), s); };
  // Startwert K · f, nur wenn die Zahlen sicher rechenbar bleiben
  const mulK = (K, f) => { const nn = K * f.n; return Number.isSafeInteger(nn) ? new Frac(nn, f.d) : null; };
  // Wachstumsfaktor: Zunahme um p % bzw. Abnahme um p %
  const qOf = (up, p) => (up ? new Frac(100 + p, 100) : new Frac(100 - p, 100));
  const range = (a, b, s) => { const out = []; for (let x = a; x <= b; x += s) out.push(x); return out; };

  // ======================================================================
  // 1. Wachstum und Zerfall (Endwert, Anfangswert, Dauer)
  // ======================================================================
  const CTX = [
    {
      id: "bev", up: true, rates: [1, 2, 3], kList: range(20000, 90000, 500), dec: 0, kDec: 0, unit: " Einwohner",
      sub: "In einer Kleinstadt wird die Einwohnerzahl beobachtet.",
      start: K => `Eine Kleinstadt hat heute ${K} Einwohner.`,
      rule: p => `Die Einwohnerzahl steigt jedes Jahr um ${p} %.`,
      ask: n => `Wie viele Einwohner hat die Stadt nach ${n} Jahren? Runde auf ganze Einwohner.`,
      back: (n, E) => `Nach ${n} Jahren hat die Stadt etwa ${E} Einwohner. Wie viele Einwohner hatte sie am Anfang? Runde auf ganze Einwohner.`,
      dauer: T => `Nach wie vielen vollen Jahren hat die Stadt erstmals mindestens ${T} Einwohner?`,
      nach: c => `Nach ${c} Jahren.`,
    },
    {
      id: "bak", up: true, rates: [10, 20, 25, 50], kList: range(500, 5000, 100), dec: 0, kDec: 0, unit: " Bakterien",
      sub: "Eine Bakterienkultur wird im Labor beobachtet.",
      start: K => `In einer Kulturschale sind zu Beginn ${K} Bakterien.`,
      rule: p => `Die Anzahl wächst jede Stunde um ${p} %.`,
      ask: n => `Wie viele Bakterien sind nach ${n} Stunden vorhanden? Runde auf ganze Zahlen.`,
      back: (n, E) => `Nach ${n} Stunden sind etwa ${E} Bakterien vorhanden. Wie viele Bakterien waren es am Anfang? Runde auf ganze Zahlen.`,
      dauer: T => `Nach wie vielen vollen Stunden sind erstmals mindestens ${T} Bakterien vorhanden?`,
      nach: c => `Nach ${c} Stunden.`,
    },
    {
      id: "auto", up: false, rates: [10, 12, 15, 20], kList: range(12000, 40000, 500), dec: 0, kDec: 0, unit: " €",
      sub: "Der Wert eines Autos wird beobachtet.",
      start: K => `Ein Auto kostet neu ${K} €.`,
      rule: p => `Es verliert jedes Jahr ${p} % seines Wertes.`,
      ask: n => `Wie viel ist es nach ${n} Jahren noch wert? Runde auf ganze Euro.`,
      back: (n, E) => `Nach ${n} Jahren ist das Auto noch ${E} € wert. Was hat es neu gekostet? Runde auf ganze Euro.`,
      dauer: T => `Nach wie vielen vollen Jahren ist der Wert erstmals auf höchstens ${T} € gesunken?`,
      nach: c => `Nach ${c} Jahren.`,
    },
    {
      id: "kap", up: true, rates: [2, 3, 4, 5], kList: range(1000, 10000, 100), dec: 2, kDec: 0, unit: " €",
      sub: "Ein Kapital wird auf einem Sparkonto angelegt.",
      start: K => `Ein Kapital von ${K} € wird angelegt.`,
      rule: p => `Es wächst jedes Jahr um ${p} %, die Zinsen werden mitverzinst.`,
      ask: n => `Wie hoch ist das Kapital nach ${n} Jahren? Runde auf Cent.`,
      back: (n, E) => `Nach ${n} Jahren beträgt das Kapital etwa ${E} €. Wie hoch war das Kapital am Anfang? Runde auf Cent.`,
      dauer: T => `Nach wie vielen vollen Jahren hat das Kapital erstmals mindestens ${T} € erreicht?`,
      nach: c => `Nach ${c} Jahren.`,
    },
    {
      id: "rad", up: false, rates: [50], kList: [80, 120, 160, 200, 240, 400, 800], dec: 1, kDec: 0, unit: " g",
      sub: "Eine radioaktive Probe wird untersucht.",
      start: K => `Eine Probe enthält ${K} g eines radioaktiven Stoffs.`,
      rule: () => "Nach jeder Halbwertszeit ist die Hälfte des Stoffs zerfallen.",
      ask: n => `Wie viel Gramm sind nach ${n} Halbwertszeiten noch vorhanden? Runde auf eine Nachkommastelle.`,
      back: (n, E) => `Nach ${n} Halbwertszeiten sind noch ${E} g vorhanden. Wie viel Gramm waren es am Anfang? Runde auf eine Nachkommastelle.`,
      dauer: null,
      nach: c => `Nach ${c} Halbwertszeiten.`,
    },
  ];
  const MUP = [new Frac(3, 2), new Frac(2), new Frac(5, 2), new Frac(3)];
  const MDOWN = [new Frac(1, 2), new Frac(3, 4)];
  const FAK_P = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60];

  function tryWachstum(rng, level) {
    const kind = level === 1 ? rng.pick(["endwert", "endwert", "faktor", "prozent-faktor"])
      : level === 2 ? rng.pick(["endwert", "anfang", "prozent-zwei"])
        : rng.pick(["dauer", "anfang", "endwert"]);

    if (kind === "faktor") {
      const up = rng.chance(0.5), p = rng.pick(FAK_P);
      const qF = qOf(up, p);
      return {
        q: rich(`Eine Größe ${up ? "steigt" : "sinkt"} jedes Jahr um ${p} %. Gib den Wachstumsfaktor q an.`),
        a: rich("q = ", F(qF, 2)),
        steps: [rich("q = 1 ", up ? "+" : MINUS, " ", F(new Frac(p, 100), 2), " = ", F(qF, 2))],
      };
    }

    if (kind === "prozent-faktor") {
      const up = rng.chance(0.5), p = rng.pick(FAK_P);
      const qF = qOf(up, p);
      return {
        q: rich(`Der Wachstumsfaktor ist q = ${F(qF, 2)}. Um wie viel Prozent ${up ? "steigt" : "sinkt"} die Größe jedes Jahr?`),
        a: rich(`${p} % ${up ? "Zunahme" : "Abnahme"}`),
        steps: [
          rich("p = ", up ? "(q − 1)" : "(1 − q)", " · 100 = ", up ? "(" + F(qF, 2) + " − 1)" : "(1 − " + F(qF, 2) + ")",
            " · 100 = ", F(new Frac(p, 100), 2), " · 100 = ", String(p)),
        ],
      };
    }

    const ctx = rng.pick(CTX);
    const up = ctx.up;
    const p = rng.pick(ctx.rates);
    const qF = qOf(up, p);
    const pF = new Frac(p, 100);
    const sym = up ? "+" : MINUS;

    if (kind === "prozent-zwei") {
      const K2 = rng.pick([200, 400, 500, 800, 1000, 2000, 4000]);
      const up2 = rng.chance(0.5);
      const p2 = up2 ? rng.pick([10, 15, 20, 25, 30, 40, 50]) : rng.pick([10, 20, 25, 30, 40, 50]);
      const E2 = up2 ? K2 + (K2 * p2) / 100 : K2 - (K2 * p2) / 100;
      const q2 = qOf(up2, p2);
      return {
        q: rich(`Ein Wert ${up2 ? "steigt" : "sinkt"} von ${F(K2)} auf ${F(E2)}. Um wie viel Prozent hat er sich insgesamt verändert?`),
        a: rich(`${p2} % ${up2 ? "Zunahme" : "Abnahme"}`),
        steps: [
          rich("q = ", F(E2), " : ", F(K2), " = ", F(q2, 2)),
          rich("p = ", up2 ? "(q − 1)" : "(1 − q)", " · 100 = ", up2 ? "(" + F(q2, 2) + " − 1)" : "(1 − " + F(q2, 2) + ")",
            " · 100 = ", F(new Frac(p2, 100), 2), " · 100 = ", String(p2)),
        ],
      };
    }

    const K = rng.pick(ctx.kList);
    const kTxt = F(K, ctx.kDec);

    if (kind === "endwert") {
      const n = level === 1 ? rng.int(1, 3) : level === 2 ? rng.int(2, 5) : rng.int(3, 6);
      const qPow = powF(qF, n);
      const V = mulK(K, qPow);
      if (!V) return null;
      const exact = V.decimals() <= ctx.dec;
      const vTxt = exact ? F(V, ctx.dec) : F(V);
      const q = rich(ctx.start(kTxt), " ", ctx.rule(p), " ", ctx.ask(n));
      const steps = [
        rich("q = 1 ", sym, " ", F(pF, 2), " = ", F(qF, 2)),
        rich("K · q", sup(ex(n)), " = ", kTxt, " · ", F(qPow), " = ", vTxt),
      ];
      if (exact) return { q, a: rich(vTxt, ctx.unit), steps };
      const R = roundF(V, ctx.dec);
      steps.push(rich("≈ ", F(R, ctx.dec)));
      return { q, a: rich("≈ ", F(R, ctx.dec), ctx.unit), steps };
    }

    if (kind === "anfang") {
      const n = level === 2 ? rng.int(2, 4) : rng.int(3, 6);
      const qPow = powF(qF, n);
      const V = mulK(K, qPow);
      if (!V) return null;
      const E = roundF(V, ctx.dec);
      const Eflt = E.n / E.d;
      // Anfangswert K = E : q^n, gerundet (Rechnung aus dem gegebenen, gerundeten Endwert)
      const Kq = new Frac(Math.round((Eflt / (qPow.n / qPow.d)) * 10 ** ctx.dec), 10 ** ctx.dec);
      return {
        q: rich(ctx.sub, " ", ctx.rule(p), " ", ctx.back(n, F(E, ctx.dec))),
        a: rich("≈ ", F(Kq, ctx.dec), ctx.unit),
        steps: [
          rich("K · q", sup(ex(n)), " = ", F(E, ctx.dec)),
          rich("K = ", F(E, ctx.dec), " : ", F(qPow), " ≈ ", F(Kq, ctx.dec)),
        ],
      };
    }

    // dauer: K · q^n erreicht bzw. unterschreitet T erstmals (ganze Jahre, aufgerundet)
    if (!ctx.dauer) return null;
    const m = rng.pick(up ? MUP : MDOWN);
    const T = new Frac(K).mul(m);
    if (!T.isInt()) return null;
    const mNum = m.n / m.d, qNum = qF.n / qF.d;
    const nEx = Math.log(mNum) / Math.log(qNum);
    if (!(nEx > 0) || Math.abs(nEx - Math.round(nEx)) < 0.03) return null;
    const c = Math.ceil(nEx);
    if (c < 2 || c > 40) return null;
    const Vc = mulK(K, powF(qF, c));
    if (!Vc || !(up ? Vc.cmp(T) >= 0 : Vc.cmp(T) <= 0)) return null;
    const nRound = Math.round(nEx * 100) / 100;
    return {
      q: rich(ctx.start(kTxt), " ", ctx.rule(p), " ", ctx.dauer(F(T, ctx.kDec))),
      a: rich(ctx.nach(c)),
      steps: [
        rich(kTxt, " · ", F(qF, 2), sup("n"), " = ", F(T, ctx.kDec)),
        rich(F(qF, 2), sup("n"), " = ", F(m)),
        rich("n = log ", F(m), " : log ", F(qF, 2), " ≈ ", F(nRound, 2)),
        rich(ctx.nach(c)),
      ],
    };
  }

  function genWachstum(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryWachstum(rng, level);
      if (t) return t;
    }
    throw new Error("wachstum: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-wachstum",
    klasse: "10",
    zug: "M",
    lb: "2",
    lbTitle: "Wachstum und Zerfall",
    topic: "prozent",
    title: "Wachstum und Zerfall berechnen",
    instruction: {
      1: "Berechne bzw. bestimme den Wachstumsfaktor. Runde wie angegeben.",
      2: "Berechne. Achte bei Abnahmen auf den Faktor kleiner als 1.",
      3: "Löse die Sachaufgabe. Gib am Ende einen Antwortsatz an.",
    },
    merke: [
      "Wachstumsfaktor: Bei einer Zunahme um p % ist q = 1 + p : 100, bei einer Abnahme um p % ist q = 1 − p : 100. ",
      "Nach n Schritten gilt: Endwert = Anfangswert · q", sup("n"), ". Den Anfangswert erhält man durch Teilen: Anfangswert = Endwert : q", sup("n"), ". ",
      "Beispiel: 2 000 Bakterien wachsen jede Stunde um 50 %, also q = 1,5. Nach 3 Stunden: 2 000 · 1,5", sup("3"), " = 6 750.",
    ],
    cols: 1,
    generate: genWachstum,
  });

  // ======================================================================
  // 2. Wertetabellen: exponentiell oder linear
  // ======================================================================
  const YEARS = [0, 1, 2, 3, 4];
  // Faktor q und Startwerte K, für die alle Werte der Tabelle ganzzahlig bleiben
  const QS = [
    { q: new Frac(3, 2), txt: "1,5", ks: [16, 32, 48, 64, 80, 96, 160] },
    { q: new Frac(2), txt: "2", ks: [5, 10, 12, 15, 20, 25, 30, 40, 50] },
    { q: new Frac(1, 2), txt: "0,5", ks: [160, 320, 480, 640, 800] },
    { q: new Frac(3, 4), txt: "0,75", ks: [256, 512, 768] },
    { q: new Frac(3), txt: "3", ks: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
  ];
  const SUBJ = [
    { label: "Frösche", intro: "Die Anzahl der Frösche in einem Teich wird jedes Jahr gezählt." },
    { label: "Wert in €", intro: "Der Wert einer Briefmarkensammlung wird jedes Jahr geschätzt." },
    { label: "Fläche in m²", intro: "Die Fläche, die Seerosen auf einem Teich bedecken, wird jedes Jahr gemessen." },
  ];

  // Werte K · q^j für die Jahre 0 bis 4 (ganzzahlig)
  function valsOf(K, qF) {
    const out = [];
    for (const j of YEARS) {
      const v = new Frac(K).mul(powF(qF, j));
      if (!v.isInt()) return null;
      out.push(v.n);
    }
    return out;
  }
  const powSeg = e => (e === 1 ? [] : [sup(String(e))]);
  const answerTxt = (v, blanks) => blanks.map(j => "Jahr " + j + ": " + fmtInt(v[j])).join(" ; ");
  // Tabelle mit Jahren als Kopfzeile; shown: Jahre, deren Werte stehen (übrige sind Lücken)
  function tableOf(label, v, shown) {
    const row0 = [[{ b: "Jahr" }], ...YEARS.map(j => rich(String(j)))];
    const row1 = [[{ b: label }], ...YEARS.map(j => (shown.includes(j) ? rich(fmtInt(v[j])) : [{ blank: 3 }]))];
    const full = [[{ b: label }], ...YEARS.map(j => rich(fmtInt(v[j])))];
    return { table: { rows: [row0, row1] }, aTable: { rows: [row0, full] } };
  }
  function rowsOf(rows) {
    const row0 = [[{ b: "Jahr" }], ...YEARS.map(j => rich(String(j)))];
    const body = rows.map(r => [[{ b: r.label }], ...YEARS.map(j => rich(fmtInt(r.v[j])))]);
    const tbl = { rows: [row0, ...body] };
    return { table: tbl, aTable: tbl };
  }
  const dTxt = x => (x > 0 ? "+" : MINUS) + String(Math.abs(x));

  function tryTabelle(rng, level) {
    const kind = level === 1 ? "faktor" : level === 2 ? rng.pick(["zwei", "zwei", "linexp"]) : "sprung";
    const subj = rng.pick(SUBJ);

    if (kind === "linexp") {
      const d = rng.pick([20, 30, 40, -20, -30]);
      const a0 = d > 0 ? rng.pick([20, 40, 60, 80, 100]) : rng.pick([140, 160, 180, 200]);
      const A = YEARS.map(j => a0 + j * d);
      const Q = rng.pick(QS);
      const B = valsOf(rng.pick(Q.ks), Q.q);
      if (!B) return null;
      const diffs = YEARS.slice(1).map(j => dTxt(A[j] - A[j - 1])).join(", ");
      const quots = YEARS.slice(1).map(j => F(new Frac(B[j], B[j - 1]))).join(" ; ");
      return {
        q: rich("Die Tabelle zeigt zwei Bestände über fünf Jahre. Entscheide für Reihe A und Reihe B, ob sie linear oder exponentiell wachsen bzw. abnehmen, und begründe mit den Werten."),
        a: rich("A: linear (Änderung ", dTxt(d), " je Jahr); B: exponentiell (Faktor ", Q.txt, " je Jahr)"),
        steps: [
          rich("A: Änderungen von Jahr zu Jahr: ", diffs, " , also immer gleich und linear."),
          rich("B: Quotienten: ", quots, " , also immer gleich ", Q.txt, " und exponentiell."),
        ],
        ...rowsOf([{ label: "Reihe A", v: A }, { label: "Reihe B", v: B }]),
      };
    }

    const Q = rng.pick(QS);
    const K = rng.pick(Q.ks);
    const v = valsOf(K, Q.q);
    if (!v) return null;
    const qTxt = Q.txt;

    if (kind === "faktor") {
      const blanks = rng.shuffle([1, 2, 3, 4]).slice(0, 2).sort((x, y) => x - y);
      const shown = YEARS.filter(j => !blanks.includes(j));
      return {
        q: rich(subj.intro, ` Jedes Jahr ist der Bestand q = ${qTxt} mal so groß wie im Vorjahr. Ergänze die fehlenden Werte der Tabelle.`),
        a: rich(answerTxt(v, blanks)),
        steps: blanks.map(j => rich("Jahr ", String(j), ": ", fmtInt(K), " · ", qTxt, powSeg(j), " = ", fmtInt(v[j]))),
        ...tableOf(subj.label, v, shown),
      };
    }

    if (kind === "zwei") {
      const blanks = rng.shuffle([2, 3, 4]).slice(0, 2).sort((x, y) => x - y);
      const shown = YEARS.filter(j => !blanks.includes(j));
      return {
        q: rich(subj.intro, " Der Bestand wird jedes Jahr mit demselben Faktor multipliziert. Bestimme den Faktor und ergänze die fehlenden Werte der Tabelle."),
        a: rich(answerTxt(v, blanks)),
        steps: [
          rich("q = ", fmtInt(v[1]), " : ", fmtInt(v[0]), " = ", qTxt),
          ...blanks.map(j => rich("Jahr ", String(j), ": ", fmtInt(v[1]), " · ", qTxt, powSeg(j - 1), " = ", fmtInt(v[j]))),
        ],
        ...tableOf(subj.label, v, shown),
      };
    }

    // sprung: zwei Werte im Abstand von zwei Jahren, daraus q = √(Wert_b : Wert_a)
    const a = rng.pick([0, 1, 2]), b = a + 2;
    const blanks = YEARS.filter(j => j !== a && j !== b);
    const ratio = new Frac(v[b], v[a]);
    return {
      q: rich(subj.intro, " Der Bestand wird jedes Jahr mit demselben Faktor multipliziert. Ergänze die fehlenden Werte der Tabelle."),
      a: rich(answerTxt(v, blanks)),
      steps: [
        rich("q", sup("2"), " = ", fmtInt(v[b]), " : ", fmtInt(v[a]), " = ", F(ratio)),
        rich("q = √", F(ratio), " = ", qTxt),
        ...blanks.map(j => {
          if (j < a) return rich("Jahr ", String(j), ": ", fmtInt(v[a]), " : ", qTxt, powSeg(a - j), " = ", fmtInt(v[j]));
          const ref = j > b ? b : a;
          return rich("Jahr ", String(j), ": ", fmtInt(v[ref]), " · ", qTxt, powSeg(j - ref), " = ", fmtInt(v[j]));
        }),
      ],
      ...tableOf(subj.label, v, [a, b]),
    };
  }

  function genTabelle(rng, level) {
    for (let i = 0; i < 400; i++) {
      const t = tryTabelle(rng, level);
      if (t) return t;
    }
    throw new Error("wachstum-tabelle: keine Aufgabe gefunden");
  }

  AG.registerType({
    id: "m10-wachstum-tabelle",
    klasse: "10",
    zug: "M",
    lb: "2",
    lbTitle: "Wachstum und Zerfall",
    topic: "prozent",
    title: "Wertetabelle exponentiell oder linear",
    instruction: {
      1: "Ergänze die fehlenden Werte der Tabelle.",
      2: "Ergänze die Tabelle bzw. entscheide, ob der Bestand linear oder exponentiell wächst.",
      3: "Ergänze die Tabelle. Bestimme zuerst den Faktor q aus zwei Werten.",
    },
    merke: [
      "Wächst ein Bestand jedes Jahr um den gleichen Faktor q, ist das ", { b: "exponentiell" },
      ". Der Faktor ist der Quotient zweier aufeinanderfolgender Werte. Bei ", { b: "linearem" },
      " Wachstum ist dagegen die Differenz gleich. ",
      "Beispiel: 160 → 240 → 360 hat den Faktor 240 : 160 = 1,5 (exponentiell). 160 → 180 → 200 hat die Differenz 20 (linear).",
    ],
    cols: 2,
    generate: genTabelle,
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
