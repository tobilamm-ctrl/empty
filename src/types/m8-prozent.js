// M8 LB 1 (Prozentrechnung): Rabatt und Skonto, Umsatzsteuer, Brutto/Netto/Tara,
// Wachstumsfaktor, Kalkulation, Promille.
(function (AG) {
  const { Frac, num, rich, MINUS, fmtInt } = AG;

  // ---------- Hilfen ----------
  const F = (n, d = 1) => new Frac(n, d);
  const dec = x => num(x, { as: "dec" });                                              // 0,85 · 240 · 2,5
  const fs = x => num(x, { as: "dec", digits: Math.max(2, Frac.of(x).decimals()) });   // Faktor: 1,10 · 0,85
  const eur = x => rich(num(x, { as: "dec", digits: 2 }), " €");                       // 204,00 €
  const pc = x => rich(dec(x), " %");                                                  // 15 %, 2,5 %
  const pm = x => rich(dec(x), " ‰");                                                  // 35 ‰
  const unit = (x, u) => rich(dec(x), " ", u);                                         // 12 kg, 700 g
  const signed = x => rich(Frac.of(x).sign() < 0 ? MINUS : "+", pc(Frac.of(x).abs())); // +15,5 %, −4 %
  const cents = x => Frac.of(x).decimals() <= 2;                                       // genau auf den Cent
  const allCents = (...xs) => xs.every(cents);
  const multOf = (rng, [lo, hi], step) => step * rng.int(Math.ceil(lo / step), Math.floor(hi / step));
  const dw = s => (s > 0 ? "erhöht" : "gesenkt");
  const fail = name => { throw new Error(name + ": keine passende Aufgabe gefunden"); };

  // ======================================================================
  // 1. Rabatt, Skonto, Preisänderung
  // ======================================================================
  const OBJ = [
    { sub: "Ein Fahrrad", nom: "das Fahrrad", range: [200, 900], step: 10 },
    { sub: "Eine Jacke", nom: "die Jacke", range: [40, 180], step: 5 },
    { sub: "Ein Laptop", nom: "der Laptop", range: [400, 1200], step: 10 },
    { sub: "Ein Sofa", nom: "das Sofa", range: [300, 1500], step: 10 },
    { sub: "Ein Schulranzen", nom: "der Schulranzen", range: [80, 250], step: 5 },
    { sub: "Eine Waschmaschine", nom: "die Waschmaschine", range: [300, 900], step: 10 },
    { sub: "Ein Paar Sportschuhe", nom: "das Paar Sportschuhe", range: [40, 150], step: 5 },
    { sub: "Ein Smartphone", nom: "das Smartphone", range: [200, 800], step: 10 },
  ];
  const RS = {
    rabatt: { op: "−", sg: -1, lab: "Rabatt", base: "Ursprünglicher Preis", res: "Endpreis", acc: "den Endpreis",
      pl: [5, 10, 15, 20, 25, 50], pf: [5, 10, 15, 20, 25, 30, 40, 50] },
    senkung: { op: "−", sg: -1, lab: "Preissenkung", base: "Ursprünglicher Preis", res: "neuer Preis", acc: "den neuen Preis",
      pl: [5, 10, 15, 20, 25, 50], pf: [5, 10, 15, 20, 25, 30, 40, 50] },
    skonto: { op: "−", sg: -1, lab: "Skonto", base: "Rechnungsbetrag", res: "Zahlbetrag", acc: "den Zahlbetrag",
      pl: [2, 3], pf: [2, 3] },
    erhoehung: { op: "+", sg: 1, lab: "Preiserhöhung", base: "Ursprünglicher Preis", res: "neuer Preis", acc: "den neuen Preis",
      pl: [5, 10, 15, 20, 25], pf: [5, 10, 15, 20, 25, 30] },
  };
  const RS_ASK1 = {
    rabatt: "Wie viel € muss man bezahlen?", senkung: "Wie viel € kostet es jetzt?",
    skonto: "Wie viel € muss man zahlen?", erhoehung: "Wie viel € kostet der Artikel dann?",
  };
  // Satz über den Vorgang (Grundwert G, Prozentsatz p)
  const SV = {
    rabatt: (o, G, p) => rich(o.sub, " kostet ", eur(G), ". Im Schlussverkauf gibt es ", pc(p), " Rabatt."),
    senkung: (o, G, p) => rich(o.sub, " kostet ", eur(G), ". Der Preis wird um ", pc(p), " gesenkt."),
    skonto: (o, G, p) => rich("Eine Rechnung über ", eur(G), " wird innerhalb von 10 Tagen bezahlt. Dafür gibt es ", pc(p), " Skonto."),
    erhoehung: (o, G, p) => rich(o.sub, " kostet ", eur(G), ". Der Preis wird um ", pc(p), " erhöht."),
  };
  // Rückwärts: der veränderte Wert E ist gegeben
  const BACK = {
    rabatt: (o, p, E) => rich("Im Schlussverkauf gibt es ", pc(p), " Rabatt. Danach kostet ", o.nom, " ", eur(E), "."),
    senkung: (o, p, E) => rich("Der Preis wurde um ", pc(p), " gesenkt. Danach kostet ", o.nom, " ", eur(E), "."),
    erhoehung: (o, p, E) => rich("Der Preis wurde um ", pc(p), " erhöht. Danach kostet ", o.nom, " ", eur(E), "."),
    skonto: (o, p, E) => rich("Eine Rechnung wird innerhalb von 10 Tagen bezahlt. Dafür gibt es ", pc(p), " Skonto. Der Zahlbetrag ist ", eur(E), "."),
  };
  const faktor = (k, p) => F(100 + k.sg * p, 100);
  const fLine = (k, p) => rich("Faktor: 100 % ", k.op, " ", pc(p), " = ", pc(100 + k.sg * p), " = ", fs(faktor(k, p)));

  // Niveau 1: Abzug bzw. Aufschlag in Euro berechnen, dann verrechnen
  function rsL1(rng) {
    const kn = rng.pick(["rabatt", "senkung", "skonto", "erhoehung"]);
    const k = RS[kn], o = rng.pick(OBJ);
    const G = F(multOf(rng, o.range, o.step));
    const p = rng.pick(k.pl);
    const R = G.mul(p).div(100), E = G.add(R.mul(k.sg));
    return {
      q: rich(SV[kn](o, G, p), " ", RS_ASK1[kn]),
      a: eur(E),
      steps: [
        rich(k.lab, ": ", eur(G), " · ", dec(p), " : 100 = ", eur(R)),
        rich(k.res, ": ", eur(G), " ", k.op, " ", eur(R), " = ", eur(E)),
      ],
    };
  }

  // Niveau 2: mit dem Faktor rechnen (85 % von 240 € = 0,85 · 240 €)
  function rsL2(rng) {
    const kn = rng.pick(["rabatt", "senkung", "skonto", "erhoehung"]);
    const k = RS[kn], o = rng.pick(OBJ);
    const G = F(multOf(rng, o.range, o.step));
    const p = rng.pick(k.pf);
    const f = faktor(k, p), E = G.mul(f);
    return {
      q: rich(SV[kn](o, G, p), " Berechne ", k.acc, " mit einem Faktor."),
      a: eur(E),
      steps: [fLine(k, p), rich(fs(f), " · ", eur(G), " = ", eur(E))],
    };
  }

  // Niveau 3: rückwärts (Grundwert = 204 € : 0,85) oder Rabatt und Skonto nacheinander
  function rsL3(rng) {
    for (let i = 0; i < 500; i++) {
      const o = rng.pick(OBJ);
      if (rng.chance(0.5)) {
        const kn = rng.pick(["rabatt", "senkung", "skonto", "erhoehung"]);
        const k = RS[kn], p = rng.pick(k.pf);
        const f = faktor(k, p);
        const G = F(multOf(rng, o.range, o.step)), E = G.mul(f);
        return {
          q: rich(BACK[kn](o, p, E), " ", kn === "skonto" ? "Wie hoch war die Rechnung?" : "Wie teuer war " + o.nom + " vorher?"),
          a: eur(G),
          steps: [fLine(k, p), rich(k.base, ": ", eur(E), " : ", fs(f), " = ", eur(G))],
        };
      }
      const p1 = rng.pick([5, 10, 15, 20, 25, 30]), s = rng.pick([2, 3]);
      const G = F(multOf(rng, o.range, o.step));
      const f1 = F(100 - p1, 100), f2 = F(100 - s, 100);
      const G1 = G.mul(f1), Z = G1.mul(f2);
      if (!cents(Z)) continue;
      return {
        q: rich(o.sub, " kostet ", eur(G), ". Im Schlussverkauf gibt es ", pc(p1), " Rabatt. Danach gibt es bei Zahlung innerhalb von 10 Tagen noch ",
          pc(s), " Skonto auf den reduzierten Preis. Wie viel € zahlt man?"),
        a: eur(Z),
        steps: [
          rich("Nach dem Rabatt: ", eur(G), " · ", fs(f1), " = ", eur(G1)),
          rich("Zahlbetrag: ", eur(G1), " · ", fs(f2), " = ", eur(Z)),
        ],
      };
    }
    return fail("m8-rabatt-skonto");
  }

  AG.registerType({
    id: "m8-rabatt-skonto",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Rabatt und Skonto",
    instruction: {
      1: "Berechne den Endpreis bzw. den Zahlbetrag. Berechne zuerst den Betrag in Euro, dann verrechne ihn mit dem Preis.",
      2: "Berechne den neuen Preis mit einem Faktor.",
      3: "Berechne. Achte auf den Grundwert: Bei aufeinanderfolgenden Abzügen rechnet man jeweils vom reduzierten Preis.",
    },
    merke: [
      "Abzüge (Rabatt, Skonto, Preissenkung) werden abgezogen, Erhöhungen addiert. Mit dem Faktor gilt ",
      { b: "neuer Preis = Preis · Faktor" },
      ".   Beispiel: 240 € mit 15 % Rabatt → Faktor 100 % − 15 % = 85 % = 0,85 → 240 € · 0,85 = 204 €",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return rsL1(rng);
      if (level === 2) return rsL2(rng);
      return rsL3(rng);
    },
  });

  // ======================================================================
  // 2. Umsatzsteuer (19 % und 7 %)
  // ======================================================================
  const UST = [
    { sub: "Ein Buch", r: 7, n: [5, 40] },
    { sub: "Ein Kochbuch", r: 7, n: [10, 40] },
    { sub: "Eine Packung Müsli", r: 7, n: [2, 8] },
    { sub: "Ein Glas Honig", r: 7, n: [3, 9] },
    { sub: "Eine Packung Nudeln", r: 7, n: [1, 5] },
    { sub: "Ein Fahrradhelm", r: 19, n: [20, 90] },
    { sub: "Eine Jeans", r: 19, n: [30, 120] },
    { sub: "Ein Schreibtischstuhl", r: 19, n: [60, 250] },
    { sub: "Eine Taschenlampe", r: 19, n: [8, 40] },
    { sub: "Ein Paar Handschuhe", r: 19, n: [10, 40] },
  ];
  const MIX7 = [
    { t: "Lebensmittel", lab: "Lebensmittel", n: [10, 60] },
    { t: "Bücher", lab: "Bücher", n: [10, 60] },
  ];
  const MIX19 = [
    { t: "einen Schreibtischstuhl", lab: "Schreibtischstuhl", n: [60, 200] },
    { t: "eine Lampe", lab: "Lampe", n: [20, 80] },
    { t: "eine Jeans", lab: "Jeans", n: [30, 100] },
  ];
  // ganzer Euro-Betrag: Netto in ganzen Euro ergibt bei 7 % und 19 % stets glatte Cent
  const whole = (rng, [lo, hi]) => F(rng.int(lo, hi), 1);

  function ustL1(rng) {
    const o = rng.pick(UST), N = whole(rng, o.n), U = N.mul(o.r).div(100), B = N.add(U);
    return {
      q: rich(o.sub, " kostet netto ", eur(N), ". Die Umsatzsteuer beträgt ", pc(o.r), ". Wie viel € kostet es brutto?"),
      a: eur(B),
      steps: [
        rich("USt: ", eur(N), " · ", dec(o.r), " : 100 = ", eur(U)),
        rich("Brutto: ", eur(N), " + ", eur(U), " = ", eur(B)),
      ],
    };
  }

  function ustL2(rng) {
    const o = rng.pick(UST), f = F(100 + o.r, 100);
    const N = whole(rng, o.n), B = N.mul(f);
    return {
      q: rich(o.sub, " kostet brutto ", eur(B), ". Die Umsatzsteuer beträgt ", pc(o.r), ". Wie viel € beträgt der Nettopreis?"),
      a: eur(N),
      steps: [
        rich("Faktor: 100 % + ", pc(o.r), " = ", pc(100 + o.r), " = ", fs(f)),
        rich("Netto: ", eur(B), " : ", fs(f), " = ", eur(N)),
      ],
    };
  }

  function ustL3(rng) {
    if (rng.chance(0.5)) {
      // Umsatzsteuer gemischt auf einem Kassenbon (7 % und 19 %)
      const a = rng.pick(MIX7), b = rng.pick(MIX19);
      const N1 = whole(rng, a.n), N2 = whole(rng, b.n);
      const U1 = N1.mul(7).div(100), U2 = N2.mul(19).div(100), U = U1.add(U2);
      return {
        q: rich("Lena kauft ", a.t, " für ", eur(N1), " netto (7 % USt) und ", b.t, " für ", eur(N2),
          " netto (19 % USt). Wie viel € Umsatzsteuer sind insgesamt enthalten?"),
        a: eur(U),
        steps: [
          rich("USt ", a.lab, ": ", eur(N1), " · 7 : 100 = ", eur(U1)),
          rich("USt ", b.lab, ": ", eur(N2), " · 19 : 100 = ", eur(U2)),
          rich("USt gesamt: ", eur(U1), " + ", eur(U2), " = ", eur(U)),
        ],
      };
    }
    // USt-Betrag aus dem Bruttopreis
    const o = rng.pick(UST), f = F(100 + o.r, 100);
    const N = whole(rng, o.n), B = N.mul(f), U = B.sub(N);
    return {
      q: rich(o.sub, " kostet brutto ", eur(B), ". Die Umsatzsteuer beträgt ", pc(o.r), ". Wie viel € Umsatzsteuer sind im Preis enthalten?"),
      a: eur(U),
      steps: [
        rich("Netto: ", eur(B), " : ", fs(f), " = ", eur(N)),
        rich("USt: ", eur(B), " − ", eur(N), " = ", eur(U)),
      ],
    };
  }

  AG.registerType({
    id: "m8-umsatzsteuer",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Netto, Brutto und Umsatzsteuer",
    instruction: {
      1: "Berechne den Bruttopreis. Die Umsatzsteuer (USt) wird auf den Nettopreis aufgeschlagen.",
      2: "Berechne den Nettopreis aus dem Bruttopreis. Der Faktor ist 1,19 bzw. 1,07.",
      3: "Berechne. Die Umsatzsteuer ist die Differenz von Brutto und Netto.",
    },
    merke: [
      "Brutto = Netto · 1,19 (bei 7 %: · 1,07). Netto = Brutto : 1,19.   Beispiel: 100 € netto mit 19 % USt → 100 € · 1,19 = 119 € brutto",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return ustL1(rng);
      if (level === 2) return ustL2(rng);
      return ustL3(rng);
    },
  });

  // ======================================================================
  // 3. Brutto, Netto, Tara
  // ======================================================================
  const PACK = [
    { art: "Eine", pack: "Packung", ware: "Haferflocken" },
    { art: "Eine", pack: "Dose", ware: "Tomaten" },
    { art: "Ein", pack: "Beutel", ware: "Reis" },
    { art: "Eine", pack: "Packung", ware: "Nudeln" },
    { art: "Ein", pack: "Glas", ware: "Honig" },
  ];
  const KG = [
    { art: "Eine", pack: "Kiste", ware: "Äpfeln", b: [10, 30], ts: [4, 5, 8, 10, 12, 15, 20] },
    { art: "Ein", pack: "Sack", ware: "Kartoffeln", b: [10, 50], ts: [1, 2, 4, 5] },
    { art: "Ein", pack: "Sack", ware: "Mehl", b: [10, 50], ts: [1, 2, 4] },
    { art: "Eine", pack: "Kiste", ware: "Orangen", b: [10, 30], ts: [4, 5, 8, 10, 12, 15, 20] },
  ];

  function taraL1(rng) {
    if (rng.chance(0.5)) {
      // Packung in Gramm
      const o = rng.pick(PACK), N = rng.int(2, 20) * 50, t = rng.int(1, 12) * 5, B = N + t;
      return {
        q: rich(o.art, " ", o.pack, " mit ", o.ware, " wiegt brutto ", unit(B, "g"), ". Der Inhalt wiegt netto ",
          unit(N, "g"), ". Wie schwer ist die Verpackung (Tara)?"),
        a: unit(t, "g"),
        steps: [
          rich("Tara = Brutto − Netto"),
          rich("= ", unit(B, "g"), " − ", unit(N, "g"), " = ", unit(t, "g")),
        ],
      };
    }
    // Kiste oder Sack in Kilogramm, Tara auch in Gramm
    const o = rng.pick(KG), N = F(rng.int(80, 300), 10), t = F(rng.int(2, 15), 10), B = N.add(t);
    return {
      q: rich(o.art, " ", o.pack, " mit ", o.ware, " wiegt brutto ", unit(B, "kg"), ". Der Inhalt wiegt netto ",
        unit(N, "kg"), ". Wie schwer ist die Verpackung (Tara) in kg und in g?"),
      a: rich(unit(t, "kg"), " = ", unit(t.mul(1000), "g")),
      steps: [
        rich("Tara = Brutto − Netto"),
        rich("= ", unit(B, "kg"), " − ", unit(N, "kg"), " = ", unit(t, "kg")),
        rich("= ", unit(t.mul(1000), "g")),
      ],
    };
  }

  // Netto aus Brutto und Tara-Prozent
  function taraL2(rng) {
    const o = rng.pick(KG), B = rng.int(o.b[0], o.b[1]), t = rng.pick(o.ts);
    const T = F(B * t, 100), N = F(B).sub(T);
    return {
      q: rich(o.art, " ", o.pack, " mit ", o.ware, " wiegt brutto ", unit(B, "kg"), ". Die Verpackung (Tara) macht ",
        pc(t), " des Bruttogewichts aus. Wie viel kg wiegt die Ware (netto)?"),
      a: unit(N, "kg"),
      steps: [
        rich("Tara: ", unit(B, "kg"), " · ", dec(t), " : 100 = ", unit(T, "kg")),
        rich("Netto: ", unit(B, "kg"), " − ", unit(T, "kg"), " = ", unit(N, "kg")),
      ],
    };
  }

  // Brutto aus Netto und Tara-Prozent: Netto = (100 − t) % vom Brutto
  function taraL3(rng) {
    const o = rng.pick(KG), B = rng.int(o.b[0], o.b[1]), t = rng.pick(o.ts);
    const f = F(100 - t, 100), N = F(B).mul(f);
    return {
      q: rich(o.art, " ", o.pack, " mit ", o.ware, " hat netto ", unit(N, "kg"), ". Die Verpackung (Tara) macht ",
        pc(t), " des Bruttogewichts aus. Wie viel kg wiegt alles zusammen (brutto)?"),
      a: unit(B, "kg"),
      steps: [
        rich("Netto: 100 % − ", pc(t), " = ", pc(100 - t), " des Bruttogewichts, Faktor ", fs(f)),
        rich("Brutto: ", unit(N, "kg"), " : ", fs(f), " = ", unit(B, "kg")),
      ],
    };
  }

  AG.registerType({
    id: "m8-brutto-netto-tara",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Brutto, Netto und Tara",
    instruction: {
      1: "Berechne die Tara (Verpackung).",
      2: "Berechne das Nettogewicht.",
      3: "Berechne das Bruttogewicht.",
    },
    merke: [
      "Bruttogewicht = Nettogewicht + Tara. Die Tara ist ein Prozentsatz vom Bruttogewicht, das Nettogewicht entspricht (100 − t) % davon.   Beispiel: Netto 500 g, Tara 30 g → Brutto 530 g",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return taraL1(rng);
      if (level === 2) return taraL2(rng);
      return taraL3(rng);
    },
  });

  // ======================================================================
  // 4. Wachstumsfaktor und verkettete Prozentsätze (M-Zug)
  // ======================================================================
  const CH = [5, 10, 15, 20, 25, 30];                  // Änderungen in %
  const chg = (s, p) => F(100 + s * p, 100);           // Faktor einer Änderung (s = +1 oder −1)
  const fLineW = (s, p) => rich("Faktor: 100 % ", s > 0 ? "+" : MINUS, " ", pc(p), " = ", pc(100 + s * p), " = ", fs(chg(s, p)));

  function wL1(rng) {
    const o = rng.pick(OBJ), G = F(multOf(rng, o.range, o.step));
    const s = rng.pick([1, -1]), p = rng.pick(CH);
    const f = chg(s, p), E = G.mul(f);
    return {
      q: rich(o.sub, " kostet ", eur(G), ". Der Preis ", s > 0 ? "steigt" : "sinkt", " um ", pc(p),
        ". Gib den Wachstumsfaktor an und berechne den neuen Preis."),
      a: rich("Faktor ", fs(f), "; neuer Preis ", eur(E)),
      steps: [
        fLineW(s, p),
        rich("Neuer Preis: ", fs(f), " · ", eur(G), " = ", eur(E)),
      ],
    };
  }

  // zwei Änderungen nacheinander: Gesamtänderung in Prozent
  function wL2(rng) {
    for (let i = 0; i < 500; i++) {
      const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]), p1 = rng.pick(CH), p2 = rng.pick(CH);
      const f1 = chg(s1, p1), f2 = chg(s2, p2), f = f1.mul(f2), d = f.sub(1);
      if (d.eq(0)) continue;
      return {
        q: rich("Der Preis eines Artikels wird zuerst um ", pc(p1), " ", dw(s1), " und danach um ", pc(p2), " ", dw(s2),
          ". Um wie viel Prozent ändert sich der Preis insgesamt?"),
        a: signed(d.mul(100)),
        steps: [
          rich("Faktor: ", fs(f1), " · ", fs(f2), " = ", fs(f)),
          rich("Änderung: ", fs(f), " − 1 = ", dec(d), " = ", signed(d.mul(100))),
        ],
      };
    }
    return fail("m8-wachstumsfaktor");
  }

  // Niveau 3: Gesamtprozentsatz bei drei Änderungen oder Ausgangswert rückwärts
  function wL3(rng) {
    if (rng.chance(0.5)) {
      for (let i = 0; i < 1000; i++) {
        const s = [rng.pick([1, -1]), rng.pick([1, -1]), rng.pick([1, -1])];
        const p = [rng.pick(CH), rng.pick(CH), rng.pick(CH)];
        const fl = [chg(s[0], p[0]), chg(s[1], p[1]), chg(s[2], p[2])];
        const f = fl[0].mul(fl[1]).mul(fl[2]), d = f.sub(1);
        if (d.eq(0) || !cents(d.mul(100))) continue;
        return {
          q: rich("Der Preis eines Artikels wird zuerst um ", pc(p[0]), " ", dw(s[0]), ", danach um ", pc(p[1]), " ", dw(s[1]),
            " und zuletzt um ", pc(p[2]), " ", dw(s[2]), ". Um wie viel Prozent ändert sich der Preis insgesamt?"),
          a: signed(d.mul(100)),
          steps: [
            rich("Faktor: ", fs(fl[0]), " · ", fs(fl[1]), " · ", fs(fl[2]), " = ", fs(f)),
            rich("Änderung: ", fs(f), " − 1 = ", dec(d), " = ", signed(d.mul(100))),
          ],
        };
      }
    }
    const o = rng.pick(OBJ);
    for (let i = 0; i < 500; i++) {
      const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]), p1 = rng.pick(CH), p2 = rng.pick(CH);
      const f1 = chg(s1, p1), f2 = chg(s2, p2), f = f1.mul(f2);
      const G = F(multOf(rng, o.range, o.step)), E = G.mul(f);
      if (f.eq(1) || !cents(E)) continue;
      return {
        q: rich("Der Preis eines Artikels wird zuerst um ", pc(p1), " ", dw(s1), " und danach um ", pc(p2), " ", dw(s2),
          ". Danach kostet der Artikel ", eur(E), ". Wie teuer war er vorher?"),
        a: eur(G),
        steps: [
          rich("Faktor: ", fs(f1), " · ", fs(f2), " = ", fs(f)),
          rich("Ausgangspreis: ", eur(E), " : ", fs(f), " = ", eur(G)),
        ],
      };
    }
    return fail("m8-wachstumsfaktor");
  }

  AG.registerType({
    id: "m8-wachstumsfaktor",
    klasse: "8",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Wachstumsfaktor",
    instruction: {
      1: "Gib den Wachstumsfaktor an und berechne den neuen Wert.",
      2: "Berechne die Gesamtänderung in Prozent.",
      3: "Berechne die Gesamtänderung in Prozent bzw. den Ausgangswert.",
    },
    merke: [
      "Wachstumsfaktor = 1 + Prozentsatz bei einer Erhöhung, 1 − Prozentsatz bei einer Senkung. Verkettete Änderungen werden multipliziert. Achtung: +20 % und −20 % ergeben nicht 0 %!   Beispiel: 1,2 · 0,8 = 0,96 → −4 %",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return wL1(rng);
      if (level === 2) return wL2(rng);
      return wL3(rng);
    },
  });

  // ======================================================================
  // 5. Kalkulation (Einkaufspreis bis Bruttoverkaufspreis)
  // ======================================================================
  // Händler, Ware und realistischer Einkaufspreis in €
  const PROD = [
    { h: "Ein Fahrradhändler", p: "ein Fahrrad", r: [200, 800] },
    { h: "Ein Sportgeschäft", p: "ein Paar Ski", r: [150, 500] },
    { h: "Ein Elektrohändler", p: "einen Fernseher", r: [200, 900] },
    { h: "Ein Möbelhaus", p: "ein Regal", r: [60, 300] },
    { h: "Ein Schuhgeschäft", p: "ein Paar Sneaker", r: [30, 90] },
    { h: "Ein Spielwarenladen", p: "ein Brettspiel", r: [12, 40] },
  ];
  const HK = [10, 15, 20, 25, 30, 40, 50];   // Handlungskosten in % vom Einkaufspreis
  const GW = [10, 15, 20, 25, 30];           // Gewinn in % der Selbstkosten

  // Kalkulation mit Einkaufspreis E: volles Schema bis zum Netto- und Bruttoverkaufspreis
  function kM1(rng) {
    for (let i = 0; i < 500; i++) {
      const o = rng.pick(PROD), E = F(multOf(rng, o.r, o.r[1] > 100 ? 10 : 1));
      const h = rng.pick(HK), g = rng.pick(GW);
      const H = E.mul(h).div(100), S = E.add(H), Gw = S.mul(g).div(100), N = S.add(Gw);
      if (!allCents(H, S, Gw, N)) continue;
      return {
        q: rich(o.h, " kauft ", o.p, " für ", eur(E), " ein. Die Handlungskosten betragen ", pc(h), " des Einkaufspreises. Danach wird ein Gewinn von ", pc(g),
          " der Selbstkosten aufgeschlagen. Berechne den Nettoverkaufspreis."),
        a: eur(N),
        steps: [
          rich("Einkaufspreis ", eur(E)),
          rich("+ Handlungskosten ", pc(h), ": ", eur(E), " · ", dec(h), " : 100 = ", eur(H)),
          rich("= Selbstkosten ", eur(S)),
          rich("+ Gewinn ", pc(g), ": ", eur(S), " · ", dec(g), " : 100 = ", eur(Gw)),
          rich("= Nettoverkaufspreis ", eur(N)),
        ],
      };
    }
    return fail("m8-kalkulation");
  }

  // volles Schema bis zum Bruttoverkaufspreis (mit Gewinn oder Verlust)
  function kM2(rng) {
    for (let i = 0; i < 500; i++) {
      const o = rng.pick(PROD), E = F(multOf(rng, o.r, o.r[1] > 100 ? 10 : 1));
      const h = rng.pick(HK), g = rng.pick(GW), sg = rng.chance(0.25) ? -1 : 1;
      const H = E.mul(h).div(100), S = E.add(H), Gw = S.mul(sg * g).div(100), N = S.add(Gw);
      const U = N.mul(19).div(100), B = N.add(U);
      if (!allCents(H, S, Gw, N, U, B)) continue;
      return {
        q: rich(o.h, " kauft ", o.p, " für ", eur(E), " ein. Die Handlungskosten betragen ", pc(h),
          " des Einkaufspreises. Der Verkauf bringt einen ", sg > 0 ? "Gewinn" : "Verlust", " von ", pc(g),
          " der Selbstkosten. Dazu kommen 19 % Umsatzsteuer. Berechne den Bruttoverkaufspreis."),
        a: eur(B),
        steps: [
          rich("Einkaufspreis ", eur(E)),
          rich("+ Handlungskosten ", pc(h), ": ", eur(E), " · ", dec(h), " : 100 = ", eur(H)),
          rich("= Selbstkosten ", eur(S)),
          rich(sg > 0 ? "+ Gewinn " : "− Verlust ", pc(g), ": ", eur(S), " · ", dec(g), " : 100 = ", eur(Gw.abs())),
          rich("= Nettoverkaufspreis ", eur(N)),
          rich("+ 19 % USt: ", eur(N), " · 19 : 100 = ", eur(U)),
          rich("= Bruttoverkaufspreis ", eur(B)),
        ],
      };
    }
    return fail("m8-kalkulation");
  }

  // rückwärts: vom Bruttoverkaufspreis zum Einkaufspreis, oder Gewinn in Prozent
  function kM3(rng) {
    for (let i = 0; i < 500; i++) {
      const o = rng.pick(PROD), E = F(multOf(rng, o.r, o.r[1] > 100 ? 10 : 1));
      const h = rng.pick(HK), g = rng.pick(GW);
      const S = E.add(E.mul(h).div(100)), N = S.add(S.mul(g).div(100)), B = N.add(N.mul(19).div(100));
      if (!allCents(S, N, B)) continue;
      if (rng.chance(0.5)) {
        return {
          q: rich(o.h, " verkauft ", o.p, " für ", eur(B), " brutto. Die Handlungskosten betragen ", pc(h),
            " des Einkaufspreises, der Gewinn ", pc(g), " der Selbstkosten. Dazu kommen 19 % Umsatzsteuer. Berechne den Einkaufspreis."),
          a: eur(E),
          steps: [
            rich("Nettoverkaufspreis: ", eur(B), " : 1,19 = ", eur(N)),
            rich("Selbstkosten: ", eur(N), " : ", fs(F(100 + g, 100)), " = ", eur(S)),
            rich("Einkaufspreis: ", eur(S), " : ", fs(F(100 + h, 100)), " = ", eur(E)),
          ],
        };
      }
      return {
        q: rich(o.h, " hat für ", o.p, " Selbstkosten von ", eur(S), ". Der Nettoverkaufspreis beträgt ", eur(N),
          ". Wie viel Prozent Gewinn sind das (bezogen auf die Selbstkosten)?"),
        a: pc(g),
        steps: [
          rich("Gewinn: ", eur(N), " − ", eur(S), " = ", eur(N.sub(S))),
          rich("Gewinn in %: ", eur(N.sub(S)), " : ", eur(S), " · 100 = ", pc(g)),
        ],
      };
    }
    return fail("m8-kalkulation");
  }

  // R-Zug: nur Netto, Umsatzsteuer und Brutto
  function kR(rng, level) {
    const o = rng.pick(PROD), hi = Math.round(o.r[1] * 1.6);
    if (level === 3) {
      const N = F(rng.int(o.r[0], hi), 1), B = N.add(N.mul(19).div(100));
      return {
        q: rich(o.h, " verkauft ", o.p, " für ", eur(B), " brutto (19 % USt). Berechne den Nettoverkaufspreis."),
        a: eur(N),
        steps: [
          rich("Brutto = Netto · 1,19, also Netto = Brutto : 1,19"),
          rich("Nettoverkaufspreis: ", eur(B), " : 1,19 = ", eur(N)),
        ],
      };
    }
    const N = level === 1 ? F(multOf(rng, [o.r[0], hi], hi > 100 ? 10 : 1)) : F(rng.int(o.r[0], hi), 1);
    const U = N.mul(19).div(100), B = N.add(U);
    return {
      q: level === 1
        ? rich(o.h, " verkauft ", o.p, " netto für ", eur(N), ". Berechne den Bruttoverkaufspreis (19 % USt).")
        : rich(o.h, " verkauft ", o.p, " netto für ", eur(N), ". Berechne die Umsatzsteuer und den Bruttoverkaufspreis (19 %)."),
      a: level === 1 ? eur(B) : rich("USt ", eur(U), ", brutto ", eur(B)),
      steps: [
        rich("Nettoverkaufspreis ", eur(N)),
        rich("+ 19 % USt: ", eur(N), " · 19 : 100 = ", eur(U)),
        rich("= Bruttoverkaufspreis ", eur(B)),
      ],
    };
  }

  AG.registerType({
    id: "m8-kalkulation",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Kalkulation und Verkaufspreis",
    instruction: {
      1: "Berechne den Nettoverkaufspreis mit dem Kalkulationsschema.",
      2: "Berechne den Bruttoverkaufspreis mit dem Kalkulationsschema.",
      3: "Berechne. Rechne vom Bruttoverkaufspreis bzw. vom Nettoverkaufspreis rückwärts.",
    },
    merke: [
      "Selbstkosten = Einkaufspreis + Handlungskosten (% vom Einkaufspreis). Nettoverkaufspreis = Selbstkosten + Gewinn (% der Selbstkosten). Bruttoverkaufspreis = Netto + 19 % USt.   Beispiel: 120 € + 25 % Handlungskosten = 150 € Selbstkosten",
    ],
    cols: 1,
    generate(rng, level, ctx) {
      if (ctx && ctx.zug === "R") return kR(rng, level);
      if (level === 1) return kM1(rng);
      if (level === 2) return kM2(rng);
      return kM3(rng);
    },
  });

  // ======================================================================
  // 6. Promille
  // ======================================================================
  const PM_L1 = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 585, 600, 750];
  const GOLD = [333, 585, 750];

  // Niveau 1: Umwandeln zwischen ‰, % und Dezimalzahl
  function pmL1(rng) {
    const x = rng.pick(PM_L1), v = F(x, 1000);
    const kind = rng.pick(["pm2pct", "pct2pm", "dec2pm", "pm2dec"]);
    if (kind === "pm2pct") {
      return {
        q: rich("Schreibe als Prozentsatz: ", pm(x)),
        a: pc(F(x, 10)),
        steps: [rich(pm(x), " = ", dec(x), " : 1000 = ", dec(v)), rich(dec(v), " = ", pc(F(x, 10)))],
      };
    }
    if (kind === "pct2pm") {
      return {
        q: rich("Schreibe in Promille: ", pc(F(x, 10))),
        a: pm(x),
        steps: [rich(pc(F(x, 10)), " = ", dec(F(x, 10)), " : 100 = ", dec(v)), rich(dec(v), " · 1000 = ", pm(x))],
      };
    }
    if (kind === "dec2pm") {
      return {
        q: rich("Schreibe in Promille: ", dec(v)),
        a: pm(x),
        steps: [rich(dec(v), " · 1000 = ", pm(x))],
      };
    }
    return {
      q: rich("Schreibe als Dezimalzahl: ", pm(x)),
      a: dec(v),
      steps: [rich(pm(x), " = ", dec(x), " : 1000 = ", dec(v))],
    };
  }

  // Niveau 2: Promillewert (Gold, Salz, Steigung)
  function pmL2(rng) {
    const kind = rng.pick(["gold", "salz", "steig"]);
    if (kind === "gold") {
      for (let i = 0; i < 500; i++) {
        const G = rng.int(3, 15), x = rng.pick(GOLD), v = F(x, 1000), P = F(G).mul(v);
        if (!cents(P)) continue;
        return {
          q: rich("Ein Ring wiegt ", unit(G, "g"), " und besteht aus ", fmtInt(x), "er Gold. Wie viel g Gold enthält der Ring?"),
          a: unit(P, "g"),
          steps: [
            rich(pm(x), " = ", dec(x), " : 1000 = ", dec(v)),
            rich("Gold: ", unit(G, "g"), " · ", dec(v), " = ", unit(P, "g")),
          ],
        };
      }
      return fail("m8-promille");
    }
    if (kind === "salz") {
      const G = rng.int(1, 20), P = F(G * 35);   // G kg Meerwasser, 35 ‰ Salz
      return {
        q: rich("In ", unit(G, "kg"), " Meerwasser sind ", pm(35), " Salz. Wie viel g Salz sind das?"),
        a: unit(P, "g"),
        steps: [
          rich(unit(G, "kg"), " = ", unit(F(G * 1000), "g")),
          rich(unit(F(G * 1000), "g"), " · ", dec(F(35, 1000)), " = ", unit(P, "g")),
        ],
      };
    }
    const L = multOf(rng, [500, 5000], 100), p = rng.pick([5, 8, 10, 12, 15, 20]);
    const v = F(p, 1000), P = F(L).mul(v);
    return {
      q: rich("Eine Straße ist ", unit(L, "m"), " lang und hat eine Steigung von ", pm(p), ". Wie viel m beträgt der Höhenunterschied?"),
      a: unit(P, "m"),
      steps: [
        rich(pm(p), " = ", dec(p), " : 1000 = ", dec(v)),
        rich("Höhenunterschied: ", unit(L, "m"), " · ", dec(v), " = ", unit(P, "m")),
      ],
    };
  }

  // Niveau 3: Promillesatz (Gold im Ring) oder Grundwert (Salz, Steigung)
  function pmL3(rng) {
    if (rng.chance(0.5)) {
      for (let i = 0; i < 500; i++) {
        const x = rng.pick(GOLD), G = rng.int(3, 15), P = F(G).mul(F(x, 1000));
        if (!cents(P)) continue;
        return {
          q: rich("Ein Ring wiegt ", unit(G, "g"), ". Darin sind ", unit(P, "g"), " Gold. Wie viel ‰ Gold enthält der Ring?"),
          a: pm(x),
          steps: [
            rich("Anteil: ", unit(P, "g"), " : ", unit(G, "g"), " = ", dec(P.div(G))),
            rich(dec(P.div(G)), " · 1000 = ", pm(x)),
          ],
        };
      }
      return fail("m8-promille");
    }
    if (rng.chance(0.5)) {
      const G = rng.int(1, 30), P = F(G * 35);   // G kg Meerwasser enthalten P g Salz
      return {
        q: rich("Im Meerwasser sind ", pm(35), " Salz. Wie viele kg Meerwasser enthalten ", unit(P, "g"), " Salz?"),
        a: unit(G, "kg"),
        steps: [
          rich("Grundwert: ", unit(P, "g"), " : ", dec(F(35, 1000)), " = ", unit(F(G * 1000), "g")),
          rich(unit(F(G * 1000), "g"), " = ", unit(G, "kg")),
        ],
      };
    }
    const L = multOf(rng, [500, 5000], 100), p = rng.pick([5, 8, 10, 12, 15, 20]);
    const v = F(p, 1000), P = F(L).mul(v);
    return {
      q: rich("Eine Straße hat eine Steigung von ", pm(p), ". Sie überwindet einen Höhenunterschied von ", unit(P, "m"), ". Wie lang ist die Straße?"),
      a: unit(L, "m"),
      steps: [
        rich("Länge = Höhenunterschied : Steigung"),
        rich("Länge: ", unit(P, "m"), " : ", dec(v), " = ", unit(L, "m")),
      ],
    };
  }

  AG.registerType({
    id: "m8-promille",
    klasse: "8",
    zug: "RM",
    lb: "1",
    lbTitle: "Prozentrechnung",
    topic: "prozent",
    title: "Promillerechnung",
    instruction: {
      1: "Wandle um zwischen Promille, Prozent und Dezimalzahl.",
      2: "Berechne den Promillewert.",
      3: "Berechne den Promillesatz bzw. den Grundwert.",
    },
    merke: [
      "‰ bedeutet „von Tausend“: 1 ‰ = 1 : 1000 = 0,001 = 0,1 %. Promillewert = Grundwert · ‰ : 1000.   Beispiel: 35 ‰ = 0,035 = 3,5 %",
    ],
    cols: 2,
    generate(rng, level) {
      if (level === 1) return pmL1(rng);
      if (level === 2) return pmL2(rng);
      return pmL3(rng);
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
