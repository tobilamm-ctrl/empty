// M9 LB 1 (Prozent- und Zinsrechnung), Klasse 9 (Quali-Niveau): Jahreszinsen, Monats- und Tageszinsen,
// Zinseszins (M-Zug: Formel; R-Zug: Jahr für Jahr mit Tabelle) und Schaubilder zu Zinsen (Skizze).
(function (AG) {
  const { Frac, num, rich, MINUS, fmtInt, fmtDec } = AG;
  const minus = " " + MINUS + " ";

  // ---------- Hilfen ----------
  const F = (n, d = 1) => new Frac(n, d);
  const dec = x => num(x, { as: "dec" });                                                 // 1,5 · 12 · 2,25
  const money = x => rich(num(x, { as: "dec", digits: Frac.of(x).isInt() ? 0 : 2 }), " €"); // 1 500 €, 22,50 €
  const pc = x => rich(dec(x), " %");                                                     // 2,25 %
  const cents = x => Frac.of(x).decimals() <= 2;
  const decs = x => Frac.of(x).decimals();
  const pw = (f, n) => { let r = F(1); for (let i = 0; i < n; i++) r = r.mul(f); return r; };
  // kaufmännisch auf Cent runden (exakt mit ganzen Zahlen, nur positive Werte)
  const toCents = x => { const f = Frac.of(x); return F(Math.floor((200 * f.n + f.d) / (2 * f.d)), 100); };
  const pT = x => F(x, 10);                                                               // Zehntel-Prozent: 15 → 1,5 %
  const fail = name => { throw new Error(name + ": keine passende Aufgabe gefunden"); };

  // ======================================================================
  // 1. Jahreszinsen: Z = K · p : 100
  // ======================================================================
  const KINDS = ["spar", "fest", "kredit"];
  const KIND = {
    spar: { who: ["Lena", "Jonas", "Mia", "Tim", "Sophie"], lo: 500, hi: 5000, st: 100, p: [0.5, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4] },
    fest: { who: ["Herr Berger", "Frau Hofmann", "Herr Keller"], lo: 2000, hi: 15000, st: 500, p: [1, 1.5, 2, 2.25, 2.5, 3, 3.5, 4, 5, 6] },
    kredit: { who: ["Frau Schmid", "Herr Wagner", "Familie Braun"], lo: 2000, hi: 30000, st: 500, p: [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9] },
  };
  // Satz mit Betrag K (K = null: ohne Betrag)
  function intro(c, K) {
    const w = c.who;
    if (c.kind === "kredit") return K ? rich(w, " nimmt einen Kredit über ", money(K), " auf.") : rich(w, " nimmt einen Kredit auf.");
    if (c.kind === "fest") return K ? rich(w, " legt ", money(K), " als Festgeld für ein Jahr an.") : rich(w, " legt Geld als Festgeld für ein Jahr an.");
    return K ? rich(w, " legt ", money(K), " auf ein Sparbuch an.") : rich(w, " legt Geld auf ein Sparbuch an.");
  }

  function genJahr(rng, level) {
    for (let t = 0; t < 500; t++) {
      const kind = rng.pick(KINDS), c = KIND[kind];
      const cc = { kind, who: rng.pick(c.who) };
      const K = F(c.st * rng.int(c.lo / c.st, c.hi / c.st));
      const p = F(Math.round(rng.pick(c.p) * 100), 100);
      const Z = K.mul(p).div(100);
      if (!cents(Z)) continue;
      const E = K.add(Z);

      if (level === 1) return {
        q: rich(intro(cc, K), " Der Zinssatz beträgt ", pc(p), ". Wie viel € Zinsen sind das nach einem Jahr?"),
        a: money(Z),
        steps: [
          rich("Zinsen = Kapital · Zinssatz : 100"),
          rich("Zinsen = ", money(K), " · ", dec(p), " : 100 = ", money(Z)),
        ],
      };

      if (level === 2) {
        if (rng.chance(0.5)) return {
          q: rich(intro(cc, null), " Nach einem Jahr fallen ", money(Z), " Zinsen an. Der Zinssatz beträgt ", pc(p), ". Wie hoch war das Kapital?"),
          a: money(K),
          steps: [
            rich("Kapital = Zinsen · 100 : Zinssatz"),
            rich("Kapital = ", money(Z), " · 100 : ", dec(p), " = ", money(K)),
          ],
        };
        return {
          q: rich(intro(cc, K), " Nach einem Jahr fallen ", money(Z), " Zinsen an. Wie hoch ist der Zinssatz?"),
          a: pc(p),
          steps: [
            rich("Zinssatz = Zinsen · 100 : Kapital"),
            rich("Zinssatz = ", money(Z), " · 100 : ", money(K), " = ", pc(p)),
          ],
        };
      }

      // Niveau 3: gemischt mit Sachkontext
      const v = kind === "kredit" ? rng.pick(["A", "C"]) : rng.pick(["A", "B"]);
      if (v === "A") return {
        q: rich(intro(cc, K), " Der Zinssatz beträgt ", pc(p), ". (a) Wie viel € Zinsen sind das nach einem Jahr? (b) ",
          kind === "kredit" ? "Wie hoch ist die Gesamtrückzahlung nach einem Jahr?" : "Wie hoch ist das Guthaben danach?"),
        a: rich("(a) ", money(Z), ". (b) ", money(E), "."),
        steps: [
          rich("(a) Zinsen = Kapital · Zinssatz : 100 = ", money(K), " · ", dec(p), " : 100 = ", money(Z)),
          rich("(b) ", kind === "kredit" ? "Rückzahlung" : "Guthaben", " = Kapital + Zinsen = ", money(K), " + ", money(Z), " = ", money(E)),
        ],
      };
      if (v === "B") {
        // Kapital aus dem Guthaben nach einem Jahr: Faktor 1 + p : 100
        const f = F(100).add(p).div(100);
        return {
          q: rich(intro(cc, null), " Der Zinssatz beträgt ", pc(p), ". Nach einem Jahr ist das Guthaben auf ", money(E),
            " angewachsen. (a) Wie viel € wurden angelegt? (b) Wie viel € Zinsen wurden gutgeschrieben?"),
          a: rich("(a) ", money(K), ". (b) ", money(Z), "."),
          steps: [
            rich("(a) Faktor: 100 % + ", pc(p), " = ", pc(F(100).add(p)), " = ", dec(f)),
            rich("(a) Kapital = Guthaben : Faktor = ", money(E), " : ", dec(f), " = ", money(K)),
            rich("(b) Zinsen = Guthaben", minus, "Kapital = ", money(E), minus, money(K), " = ", money(Z)),
          ],
        };
      }
      // Kredit: Gesamtrückzahlung gegeben, Zinsen und Zinssatz gesucht
      return {
        q: rich(intro(cc, K), " Nach einem Jahr werden insgesamt ", money(E), " zurückgezahlt. (a) Wie hoch sind die Zinsen? (b) Wie hoch ist der Zinssatz?"),
        a: rich("(a) ", money(Z), ". (b) ", pc(p), "."),
        steps: [
          rich("(a) Zinsen = Rückzahlung", minus, "Kredit = ", money(E), minus, money(K), " = ", money(Z)),
          rich("(b) Zinssatz = Zinsen · 100 : Kredit = ", money(Z), " · 100 : ", money(K), " = ", pc(p)),
        ],
      };
    }
    return fail("m9-jahreszinsen");
  }

  AG.registerType({
    id: "m9-jahreszinsen",
    klasse: "9",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozent- und Zinsrechnung",
    topic: "prozent",
    title: "Jahreszinsen",
    instruction: {
      1: "Berechne die Zinsen für ein Jahr.",
      2: "Berechne das Kapital bzw. den Zinssatz.",
      3: "Berechne. Achte auf die Angaben im Sachzusammenhang.",
    },
    merke: [
      "Jahreszinsen: Z = K · p : 100 (K Kapital, p Zinssatz in %). Umgekehrt gilt K = Z · 100 : p und p = Z · 100 : K.   Beispiel: 1 500 € zu 1,5 % → Z = 1 500 € · 1,5 : 100 = 22,50 €",
    ],
    cols: 1,
    generate(rng, level) { return genJahr(rng, level); },
  });

  // ======================================================================
  // 2. Monats- und Tageszinsen (Bankjahr: 1 Monat = 30 Tage, 1 Jahr = 360 Tage)
  // ======================================================================
  const P_T = [10, 15, 20, 25, 30, 35, 40, 45, 50];        // Zehntel-Prozent, 1 % bis 5 %
  const DISPO_T = [90, 100, 105, 110, 120];                // Überziehungszins 9 % bis 12 %
  const RATE_T = [30, 40, 50, 60, 70, 80];                 // effektiver Zinssatz beim Ratenkauf 3 % bis 8 %
  const SUMME = [1200, 2400, 3600, 4800, 6000, 7200, 8400, 9600, 10800, 12000]; // Jahreszinsen dann glatte Cent-Beträge
  const MON = [1, 2, 3, 4, 5, 6, 9];
  const TAG = [15, 30, 45, 60, 75, 90, 120, 150, 180];
  const OBJ_BAR = ["Ein Laptop", "Eine Waschmaschine", "Ein Fernseher", "Eine Küche"];
  const mon = m => (m === 1 ? "1 Monat" : fmtInt(m) + " Monate");
  const tage = t => fmtInt(t) + " Tage";

  function genMon(rng, level) {
    for (let i = 0; i < 500; i++) {
      const K = F(rng.pick(SUMME)), p = pT(rng.pick(P_T));
      const J = K.mul(p).div(100);                           // Jahreszinsen

      if (level === 1) {
        if (rng.chance(0.5)) {
          const m = rng.pick(MON), Z = J.mul(m).div(12);
          if (!cents(Z)) continue;
          return {
            q: rich("Ein Betrag von ", money(K), " wird ", mon(m), " lang zu ", pc(p), " angelegt. Wie viel € Zinsen erhält man?"),
            a: money(Z),
            steps: [
              rich("Jahreszinsen = Kapital · Zinssatz : 100 = ", money(K), " · ", dec(p), " : 100 = ", money(J)),
              rich("Zinsen für ", mon(m), " = Jahreszinsen · ", fmtInt(m), " : 12 = ", money(J), " · ", fmtInt(m), " : 12 = ", money(Z)),
            ],
          };
        }
        const t = rng.pick(TAG), Z = J.mul(t).div(360);
        if (!cents(Z)) continue;
        return {
          q: rich("Ein Betrag von ", money(K), " wird ", tage(t), " lang zu ", pc(p), " angelegt. Wie viel € Zinsen erhält man? (Bankjahr: 360 Tage)"),
          a: money(Z),
          steps: [
            rich("Jahreszinsen = Kapital · Zinssatz : 100 = ", money(K), " · ", dec(p), " : 100 = ", money(J)),
            rich("Tageszinsen = Jahreszinsen · Tage : 360 = ", money(J), " · ", fmtInt(t), " : 360 = ", money(Z)),
          ],
        };
      }

      if (level === 2) {
        if (rng.chance(0.5)) {
          const m = rng.pick(MON), Z = J.mul(m).div(12);
          if (!cents(Z)) continue;
          return {
            q: rich("Ein Betrag wird ", mon(m), " lang zu ", pc(p), " angelegt. Dabei entstehen ", money(Z), " Zinsen. Wie hoch war das Kapital?"),
            a: money(K),
            steps: [
              rich("Jahreszinsen = Zinsen · 12 : Monate = ", money(Z), " · 12 : ", fmtInt(m), " = ", money(J)),
              rich("Kapital = Jahreszinsen · 100 : Zinssatz = ", money(J), " · 100 : ", dec(p), " = ", money(K)),
            ],
          };
        }
        const t = rng.pick(TAG), Z = J.mul(t).div(360);
        if (!cents(Z)) continue;
        return {
          q: rich("Ein Betrag von ", money(K), " wird zu ", pc(p), " angelegt. Dabei entstehen ", money(Z), " Zinsen. Wie viele Tage war das Geld angelegt? (Bankjahr: 360 Tage)"),
          a: rich(tage(t)),
          steps: [
            rich("Jahreszinsen = Kapital · Zinssatz : 100 = ", money(K), " · ", dec(p), " : 100 = ", money(J)),
            rich("Tage = Zinsen · 360 : Jahreszinsen = ", money(Z), " · 360 : ", money(J), " = ", fmtInt(t), " Tage"),
          ],
        };
      }

      // Niveau 3: effektiver Jahreszinssatz aus den Zinsen für eine Zeitspanne (Überziehung oder Ratenkauf)
      if (rng.chance(0.5)) {
        const pD = pT(rng.pick(DISPO_T)), tD = rng.pick(TAG);
        const JD = K.mul(pD).div(100), ZD = JD.mul(tD).div(360);
        if (!cents(ZD)) continue;
        return {
          q: rich("Lukas hat sein Girokonto für ", tage(tD), " um ", money(K), " überzogen. Dafür berechnet die Bank ", money(ZD),
            " Zinsen. Wie hoch ist der Jahreszinssatz? (Bankjahr: 360 Tage)"),
          a: pc(pD),
          steps: [
            rich("Zinsen für 1 Jahr = Zinsen · 360 : Tage = ", money(ZD), " · 360 : ", fmtInt(tD), " = ", money(JD)),
            rich("Zinssatz = Jahreszinsen · 100 : Kapital = ", money(JD), " · 100 : ", money(K), " = ", pc(pD)),
          ],
        };
      }
      const pR = pT(rng.pick(RATE_T)), mR = rng.pick([3, 6, 9, 12]);
      const ZR = K.mul(pR).mul(mR).div(1200);
      if (!cents(ZR)) continue;
      const JR = ZR.mul(12).div(mR);
      return {
        q: rich(K.cmp(new Frac(3000)) > 0 ? rng.pick(["Eine Einbauküche", "Ein Gebrauchtwagen"]) : rng.pick(OBJ_BAR.slice(0, 3)), " kostet bar ", money(K), ". Beim Kauf auf Raten bleibt dieser Betrag ", mon(mR),
          " lang als Kredit stehen. Dafür fallen ", money(ZR), " Zinsen an. Wie hoch ist der Jahreszinssatz?"),
        a: pc(pR),
        steps: [
          rich("Zinsen für 1 Jahr = Zinsen · 12 : Monate = ", money(ZR), " · 12 : ", fmtInt(mR), " = ", money(JR)),
          rich("Jahreszinssatz = Jahreszinsen · 100 : Kapital = ", money(JR), " · 100 : ", money(K), " = ", pc(pR)),
        ],
      };
    }
    return fail("m9-monats-tageszinsen");
  }

  AG.registerType({
    id: "m9-monats-tageszinsen",
    klasse: "9",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozent- und Zinsrechnung",
    topic: "prozent",
    title: "Monats- und Tageszinsen",
    instruction: {
      1: "Berechne die Zinsen für die angegebene Zeit. Rechne mit dem Bankjahr (1 Monat = 30 Tage, 1 Jahr = 360 Tage).",
      2: "Berechne das Kapital bzw. die Anzahl der Tage. Rechne über die Jahreszinsen.",
      3: "Berechne den Jahreszinssatz. Rechne zuerst die Zinsen für ein Jahr aus.",
    },
    merke: [
      "Monatszinsen: Z = K · p : 100 · m : 12. Tageszinsen im Bankjahr: Z = K · p : 100 · t : 360 (1 Monat = 30 Tage).   Beispiel: 1 200 € zu 3 % für 6 Monate → 1 200 € · 3 : 100 · 6 : 12 = 18 €",
    ],
    cols: 1,
    generate(rng, level) { return genMon(rng, level); },
  });

  // ======================================================================
  // 3. Zinseszins: M-Zug mit Formel K_n = K_0 · q^n, R-Zug Jahr für Jahr mit Tabelle
  // ======================================================================
  const KAP = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000];
  const PZ_T = [10, 15, 20, 25, 30, 40, 50];               // 1 % bis 5 %
  const NAMEN_M = ["Lena", "Jonas", "Mia", "Herr Keller", "Frau Hofmann"];

  // Endkapital mit exaktem Zinsfaktor q; e.exact: ohne Rundung auf Cent
  function mkE(K0, p, n) {
    const q = F(1).add(p.div(100)), qn = pw(q, n), E = K0.mul(qn);
    return { q, qn, E, Ec: toCents(E), exact: cents(E) };
  }
  // Rechenschritte mit Zinsfaktor (pre: optionales Präfix, z. B. „Bank Nord: “)
  function zinsSteps(K0, p, n, e, pre) {
    return [
      rich(pre, "q = 1 + ", dec(p), " : 100 = ", dec(e.q)),
      rich(pre, "Endkapital = ", money(K0), " · ", dec(e.q), { sup: fmtInt(n) }, " = ", money(K0), " · ", dec(e.qn)),
      rich(pre, "Endkapital ", e.exact ? "= " : "≈ ", money(e.Ec)),
    ];
  }

  function genZinsM(rng, level) {
    for (let t = 0; t < 500; t++) {
      const K0 = F(rng.pick(KAP)), p = pT(rng.pick(PZ_T)), n = rng.int(2, 5);
      const e = mkE(K0, p, n);
      if (decs(e.qn) > 8) continue;                           // Faktor bleibt lesbar (höchstens 8 Nachkommastellen)
      const who = rng.pick(NAMEN_M);
      const sym = e.exact ? "" : "≈ ";
      const base = rich(who, " legt ", money(K0), " für ", fmtInt(n), " Jahre zu ", pc(p),
        " Zinseszins an. Die Zinsen werden jedes Jahr dem Kapital gutgeschrieben. ");

      if (level === 1) return {
        q: rich(base, "Wie hoch ist das Endkapital? (auf Cent gerundet)"),
        a: rich(sym, money(e.Ec)),
        steps: zinsSteps(K0, p, n, e, ""),
      };

      if (level === 2) {
        const Zc = e.Ec.sub(K0);
        return {
          q: rich(base, "Wie viel € Zinsen bringt das insgesamt? (auf Cent gerundet)"),
          a: rich(sym, money(Zc)),
          steps: zinsSteps(K0, p, n, e, "").concat([rich("Zinsen = Endkapital", minus, "Kapital = ", money(e.Ec), minus, money(K0), " = ", money(Zc))]),
        };
      }

      // Niveau 3: Vergleich zweier Angebote oder Startkapital aus dem Endkapital
      if (rng.chance(0.5)) {
        const p2 = pT(rng.pick(PZ_T));
        if (p2.eq(p)) continue;
        const e2 = mkE(K0, p2, n);
        if (decs(e2.qn) > 8) continue;
        const bigFirst = e.Ec.cmp(e2.Ec) >= 0;
        const hi = bigFirst ? e.Ec : e2.Ec, lo = bigFirst ? e2.Ec : e.Ec;
        const diff = hi.sub(lo), win = bigFirst ? "Bank Nord" : "Bank Süd";
        const s2 = e.exact && e2.exact ? "" : "≈ ";
        return {
          q: rich("Ein Betrag von ", money(K0), " soll ", fmtInt(n), " Jahre mit Zinseszins angelegt werden. Bank Nord bietet ", pc(p),
            ", Bank Süd bietet ", pc(p2), ". Welche Bank bringt das größere Endkapital? Wie viel € ist der Unterschied? (auf Cent gerundet)"),
          a: rich(win, ": Endkapital ", s2, money(hi), ", Unterschied ", s2, money(diff)),
          steps: [
            ...zinsSteps(K0, p, n, e, "Bank Nord: "),
            ...zinsSteps(K0, p2, n, e2, "Bank Süd: "),
            rich("Unterschied = ", money(hi), minus, money(lo), " = ", money(diff)),
          ],
        };
      }
      if (!e.exact) continue;
      return {
        q: rich("Nach ", fmtInt(n), " Jahren ist ein Betrag bei ", pc(p), " Zinseszins auf ", money(e.E),
          " angewachsen. Wie viel € wurde ursprünglich angelegt?"),
        a: money(K0),
        steps: [
          rich("q = 1 + ", dec(p), " : 100 = ", dec(e.q)),
          rich("Startkapital = Endkapital : q", { sup: fmtInt(n) }, " = ", money(e.E), " : ", dec(e.qn)),
          rich("Startkapital = ", money(K0)),
        ],
      };
    }
    return fail("m9-zinseszins");
  }

  // R-Zug: Jahr für Jahr, Zinsen werden auf Cent gerundet; Tabelle mit Lücken
  function genZinsR(rng, level) {
    const K0 = F(rng.pick(KAP)), p = F(rng.pick([1, 2, 3, 4, 5, 6]), 1), n = rng.int(2, 4);
    const rows = [];
    let cur = K0;
    for (let k = 1; k <= n; k++) {
      const zx = cur.mul(p).div(100), z = toCents(zx);
      const end = cur.add(z);
      rows.push({ k, start: cur, zx, z, exact: cents(zx), end });
      cur = end;
    }
    const last = rows[n - 1], Zges = cur.sub(K0);
    const hdr = [rich("Jahr"), rich("Kapital am Jahresanfang"), rich("Zinsen"), rich("Kapital am Jahresende")];
    const qRows = [hdr].concat(rows.map(r => [
      rich(fmtInt(r.k), ". Jahr"),
      r.k === 1 ? rich(money(r.start)) : rich({ blank: 9 }),
      rich({ blank: 6 }),
      rich({ blank: 9 }),
    ]));
    const aRows = [hdr].concat(rows.map(r => [
      rich(fmtInt(r.k), ". Jahr"), rich(money(r.start)), rich(money(r.z)), rich(money(r.end)),
    ]));
    const steps = [];
    rows.forEach(r => {
      steps.push(rich(fmtInt(r.k), ". Jahr: Zinsen = ", money(r.start), " · ", dec(p), " : 100 = ",
        r.exact ? money(r.z) : rich(dec(r.zx), " ≈ ", money(r.z))));
      steps.push(rich(fmtInt(r.k), ". Jahr: Kapital am Jahresende = ", money(r.start), " + ", money(r.z), " = ", money(r.end)));
    });
    const base = rich("Ein Betrag von ", money(K0), " wird zu ", pc(p), " Zinseszins angelegt. Die Zinsen werden jedes Jahr auf Cent gerundet und dem Kapital gutgeschrieben. ");
    const table = { rows: qRows }, aTable = { rows: aRows };

    if (level === 1) return {
      q: rich(base, "Ergänze die Tabelle. Wie hoch ist das Kapital nach ", fmtInt(n), " Jahren?"),
      a: money(last.end),
      steps,
      table, aTable,
    };
    if (level === 2) return {
      q: rich(base, "Ergänze die Tabelle. Wie viel € Zinsen erhält man insgesamt in ", fmtInt(n), " Jahren?"),
      a: money(Zges),
      steps: steps.concat([rich("Zinsen insgesamt = Endkapital", minus, "Kapital = ", money(last.end), minus, money(K0), " = ", money(Zges))]),
      table, aTable,
    };
    return {
      q: rich(base, "Ergänze die Tabelle. (a) Wie viel € Zinsen werden im ", fmtInt(n), ". Jahr gutgeschrieben? (b) Wie hoch ist das Kapital am Ende des ", fmtInt(n), ". Jahres?"),
      a: rich("(a) ", money(last.z), ". (b) ", money(last.end), "."),
      steps,
      table, aTable,
    };
  }

  AG.registerType({
    id: "m9-zinseszins",
    klasse: "9",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozent- und Zinsrechnung",
    topic: "prozent",
    title: "Zinseszins",
    instruction: {
      1: "Berechne das Endkapital. Die Zinsen werden jedes Jahr dem Kapital gutgeschrieben (Zinseszins).",
      2: "Berechne die Zinsen. Das Ergebnis wird auf Cent gerundet.",
      3: "Berechne. Achte darauf, ob das Startkapital oder das Endkapital gesucht ist.",
    },
    merke: [
      "Zinseszins: Mit dem Zinsfaktor q = 1 + p : 100 gilt Endkapital = Anfangskapital · q hoch n.   Beispiel: 1 000 € zu 2 % für 2 Jahre → 1 000 € · 1,02 hoch 2 = 1 040,40 €",
    ],
    cols: 1,
    generate(rng, level, ctx) {
      if (ctx && ctx.zug === "R") return genZinsR(rng, level);
      return genZinsM(rng, level);
    },
  });

  // ======================================================================
  // 4. Schaubilder: Kontoentwicklung über Jahre bzw. Zinssätze verschiedener Banken (Säulendiagramm, Skizze)
  // ======================================================================
  const BAR = "#1f3f9e";
  // Säulen mit Werten darüber und Namen darunter; keine Achsenbeschriftung mit Zahlen (die gesuchte Größe darf nicht im Bild stehen)
  function columnFig(cats, heights, labels, T) {
    const W = 140, H = 60, xA = 8, yB = 50, yT = 9;
    const sy = v => yB - (v / T) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 3], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    const slot = (W - xA - 4) / cats.length, bw = slot * 0.6;
    cats.forEach((c, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(heights[i]), bw, yB - sy(heights[i]), { fill: BAR });
      s.label([x + bw / 2, sy(heights[i]) - 3.2], labels[i]);
      s.label([x + bw / 2, yB + 4.5], c);
    });
    return s.done();
  }

  const KONTO_K = [1000, 1200, 1500, 1800, 2000, 2400, 2500, 3000, 3500, 4000, 4500, 5000];
  const KONTO_P = [1, 2, 3, 4, 5];
  const KONTO_NAMEN = ["Mia", "Lena", "Jonas", "Tim"];
  function genKonto(rng, level) {
    const K0 = rng.pick(KONTO_K), p = rng.pick(KONTO_P), n = rng.int(3, 4), who = rng.pick(KONTO_NAMEN);
    const G = [], Z = [];
    let cur = K0;
    for (let k = 0; k < n; k++) {
      const z = Math.round((cur * p) / 100);               // Zinsen auf volle Euro gerundet
      Z.push(z); cur += z; G.push(cur);
    }
    const k = rng.int(0, n - 1), Gp = k === 0 ? K0 : G[k - 1], Zk = Z[k];
    const fig = columnFig(G.map((_, i) => "Jahr " + (i + 1)), G, G.map(g => fmtInt(g) + " €"), Math.max(...G) * 1.25);
    const base = rich("Auf dem Konto von ", who, " liegen zu Beginn ", money(K0),
      ". Das Säulendiagramm zeigt den Kontostand am Ende jedes Jahres. Die Zinsen werden auf volle Euro gerundet. ");
    const totZ = G[n - 1] - K0;

    if (level === 1) return {
      q: rich(base, "Wie viel € Zinsen wurden im ", fmtInt(k + 1), ". Jahr gutgeschrieben?"),
      a: money(Zk),
      steps: [
        rich("Zinsen = Guthaben am Jahresende", minus, "Guthaben am Jahresanfang"),
        rich("Zinsen = ", money(G[k]), minus, money(Gp), " = ", money(Zk)),
      ],
      fig, inline: false,
    };

    if (level === 2) {
      if (rng.chance(0.5)) return {
        // Zinssatz nur im 1. Jahr: dann ist der Anfangsbetrag K0 aus dem Text bekannt und der Satz exakt
        q: rich(base, "Wie hoch ist der Zinssatz im 1. Jahr?"),
        a: pc(p),
        steps: [
          rich("Zinsen = ", money(G[0]), minus, money(K0), " = ", money(Z[0])),
          rich("Zinssatz = Zinsen · 100 : Anfangsguthaben = ", money(Z[0]), " · 100 : ", money(K0), " = ", pc(p)),
        ],
        fig, inline: false,
      };
      return {
        q: rich(base, "Wie viel € Zinsen werden nach ", fmtInt(n), " Jahren insgesamt gutgeschrieben?"),
        a: money(totZ),
        steps: [rich("Zinsen insgesamt = ", money(G[n - 1]), minus, money(K0), " = ", money(totZ))],
        fig, inline: false,
      };
    }

    return {
      q: rich(base, "(a) Wie viel € Zinsen wurden im ", fmtInt(k + 1), ". Jahr gutgeschrieben? (b) Wie viel € Zinsen wurden insgesamt in ", fmtInt(n), " Jahren gutgeschrieben?"),
      a: rich("(a) ", money(Zk), ". (b) ", money(totZ), "."),
      steps: [
        rich("(a) Zinsen = ", money(G[k]), minus, money(Gp), " = ", money(Zk)),
        rich("(b) Zinsen insgesamt = ", money(G[n - 1]), minus, money(K0), " = ", money(totZ)),
      ],
      fig, inline: false,
    };
  }

  const BANKS = ["Bank Nord", "Bank Süd", "Bank West", "Bank Ost", "Bank Mitte"];
  const RATES_H = [50, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 550, 600]; // Hundertstel: 125 → 1,25 %
  const BKAP = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 8000];
  function genBanken(rng, level) {
    for (let t = 0; t < 500; t++) {
      const n = rng.int(3, 5);
      const names = rng.shuffle(BANKS).slice(0, n);
      const hs = rng.shuffle(RATES_H).slice(0, n);             // verschiedene Zinssätze
      const ps = hs.map(h => F(h, 100));
      const fig = columnFig(names, hs, hs.map(h => fmtDec(F(h, 100)) + " %"), Math.max(...hs) * 1.25);
      const iMax = hs.indexOf(Math.max(...hs)), iMin = hs.indexOf(Math.min(...hs));
      const base = rich("Die Säulen zeigen den jährlichen Zinssatz für Sparguthaben bei verschiedenen Banken. ");

      if (level === 1) {
        if (rng.chance(0.5)) return {
          q: rich(base, "Welche Bank bietet den höchsten Zinssatz?"),
          a: rich(names[iMax]),
          steps: [rich("Die höchste Säule gehört zu ", names[iMax], " mit ", pc(ps[iMax]))],
          fig, inline: false,
        };
        const dh = hs[iMax] - hs[iMin];
        if (hs.includes(dh)) continue;
        const d = F(dh, 100);
        return {
          q: rich(base, "Um wie viele Prozentpunkte unterscheiden sich der höchste und der niedrigste Zinssatz?"),
          a: rich(dec(d), " Prozentpunkte"),
          steps: [rich("Unterschied = ", pc(ps[iMax]), minus, pc(ps[iMin]), " = ", dec(d), " Prozentpunkte")],
          fig, inline: false,
        };
      }

      const K = F(rng.pick(BKAP)), i = rng.int(0, n - 1), j = rng.intExcept(0, n - 1, [i]);
      const Z = K.mul(ps[i]).div(100), Zj = K.mul(ps[j]).div(100);
      if (!cents(Z) || !cents(Zj)) continue;
      if (ps.some(x => x.eq(Z))) continue;                       // gesuchte Zahl steht nicht im Bild
      if (level === 2) return {
        q: rich(base, "Ein Betrag von ", money(K), " wird ein Jahr lang bei ", names[i], " angelegt. Wie viel € Zinsen bringt das?"),
        a: money(Z),
        steps: [rich("Zinsen = Kapital · Zinssatz : 100 = ", money(K), " · ", dec(ps[i]), " : 100 = ", money(Z))],
        fig, inline: false,
      };
      const D = Z.sub(Zj).abs();
      if (D.eq(0) || ps.some(x => x.eq(D))) continue;
      const hiZ = Z.cmp(Zj) >= 0 ? Z : Zj, loZ = Z.cmp(Zj) >= 0 ? Zj : Z;
      return {
        q: rich(base, "Ein Betrag von ", money(K), " wird ein Jahr lang angelegt. (a) Wie viel € Zinsen bringt ", names[i],
          "? (b) Um wie viel € unterscheiden sich die Zinsen bei ", names[i], " und bei ", names[j], "?"),
        a: rich("(a) ", money(Z), ". (b) ", money(D), "."),
        steps: [
          rich("(a) ", names[i], ": Zinsen = ", money(K), " · ", dec(ps[i]), " : 100 = ", money(Z)),
          rich("(b) ", names[j], ": Zinsen = ", money(K), " · ", dec(ps[j]), " : 100 = ", money(Zj)),
          rich("(b) Unterschied = ", money(hiZ), minus, money(loZ), " = ", money(D)),
        ],
        fig, inline: false,
      };
    }
    return fail("m9-zins-schaubild");
  }

  AG.registerType({
    id: "m9-zins-schaubild",
    klasse: "9",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozent- und Zinsrechnung",
    topic: "prozent",
    title: "Schaubilder zu Zinsen",
    instruction: {
      1: "Lies die Angaben aus dem Säulendiagramm ab und berechne.",
      2: "Lies die Angaben aus dem Säulendiagramm ab und berechne die Zinsen bzw. den Zinssatz.",
      3: "Lies die Angaben aus dem Säulendiagramm ab. Beantworte die Teilfragen a) und b) mit Rechnung.",
    },
    merke: [
      "Zinsen aus einem Kontoschaubild: Zinsen = Guthaben am Jahresende − Guthaben am Jahresanfang. Zinssatz = Zinsen · 100 : Guthaben am Jahresanfang.   Beispiel: Anfang 1 000 €, Ende 1 030 € → Zinsen 30 €, Zinssatz 3 %",
    ],
    cols: 1,
    generate(rng, level) {
      if (rng.chance(0.5)) return genKonto(rng, level);
      return genBanken(rng, level);
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
