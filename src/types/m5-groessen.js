// M5 LB 5 (Größen im Alltag) und LB 6 (Daten): Umrechnen von Größen, Brüche bei Größen,
// Kommaschreibweise bei Geld und Längen, Sachaufgaben mit Größen sowie Strichliste → Tabelle → Säulendiagramm.
(function (AG) {
  const { Frac, num, rich, plain, fmtInt, fmtDec, MINUS } = AG;
  const COLORS = ["#1f3f9e", "#2e7d5b", "#b5541b", "#6b3fa0", "#9aa3b8"];
  const N = x => fmtInt(x);                                   // ganze Zahl („2040“, „12 345“)
  const S = x => String(x);                                   // Zahl als Text (Faktoren, Anzahlen, Stellen)
  const frac = (n, d) => ({ f: [n, d] });                     // Bruch als Segment
  const dec2 = c => fmtDec(new Frac(c, 100), 2);              // Cent als Euro mit zwei Stellen („3,05“)
  const dmin = (n, d) => fmtDec(new Frac(n, d));              // Dezimalzahl mit so vielen Stellen wie nötig
  const clock = t => `${Math.floor(t / 60) % 24}:${String(t % 60).padStart(2, "0")} Uhr`; // t in Minuten ab 0:00
  const durStr = t => {
    const h = Math.floor(t / 60), m = t % 60;
    return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`;
  };
  const kmStr = x => {
    const k = Math.floor(x / 1000), m = x % 1000;
    return m ? `${k} km ${m} m` : `${k} km`;
  };
  const Pron = gend => (gend === "sie" ? "Sie" : "Er");
  // Begrenzte Wiederholung: fn liefert einen Wert oder null; nach k Versuchen ein Fehler (keine Endlosschleife)
  const tryN = (k, fn) => {
    for (let i = 0; i < k; i++) {
      const v = fn();
      if (v !== null) return v;
    }
    throw new Error("m5-groessen: keine passende Zufallszahl gefunden");
  };

  // ---------- 1. Größen umrechnen ----------
  // Ketten von groß nach klein. r[i] = Umrechnungszahl zwischen u[i] und u[i + 1].
  const CHAINS = [
    { u: ["km", "m", "dm", "cm", "mm"], r: [1000, 10, 10, 10] },
    { u: ["l", "ml"], r: [1000] },
    { u: ["t", "kg", "g", "mg"], r: [1000, 1000, 1000] },
    { u: ["d", "h", "min", "s"], r: [24, 60, 60] },
    { u: ["€", "ct"], r: [100] },
  ];
  // Schrittweite für gemischte Angaben („2 kg 40 g“, „3 h 25 min“, „4 € 35 ct“)
  const STEP = {
    "km-m": 50, "m-dm": 1, "dm-cm": 1, "cm-mm": 1, "l-ml": 50, "t-kg": 100, "kg-g": 10, "g-mg": 100,
    "d-h": 1, "h-min": 5, "min-s": 5, "€-ct": 5,
  };
  const stepOf = (a, b) => STEP[a + "-" + b];
  // Vielfaches der Schrittweite, kleiner als r (der Rest in der kleineren Einheit)
  const remOf = (rng, st, r) => st * rng.int(1, Math.floor((r - 1) / st));

  // Niveau 1: eine Stufe, groß → klein (mal) oder klein → groß (geteilt, ohne Rest)
  function umrOne(rng) {
    const c = rng.pick(CHAINS), i = rng.int(0, c.u.length - 2);
    const big = c.u[i], small = c.u[i + 1], r = c.r[i];
    if (rng.chance(0.6)) {
      const x = rng.chance(0.8) ? rng.int(2, 9) : rng.int(10, 30), y = x * r;
      return {
        q: rich("Rechne um: ", S(x), " ", big, " = ? ", small),
        a: rich(N(y), " ", small),
        steps: [rich(S(x), " ", big, " = ", S(x), " · ", N(r), " ", small, " = ", N(y), " ", small)],
      };
    }
    const k = rng.int(2, 9), v = k * r;
    return {
      q: rich("Rechne um: ", N(v), " ", small, " = ? ", big),
      a: rich(S(k), " ", big),
      steps: [rich(N(v), " ", small, " : ", N(r), " = ", S(k), " ", big)],
    };
  }

  // Niveau 2: gemischte Einheiten in eine Einheit (3 h 25 min = 205 min), oder zwei Stufen (2 d = 2880 min)
  function umrTwo(rng) {
    if (rng.chance(0.5)) {
      const c = rng.pick(CHAINS), i = rng.int(0, c.u.length - 2);
      const big = c.u[i], small = c.u[i + 1], r = c.r[i];
      const a = rng.int(1, 6), b = remOf(rng, stepOf(big, small), r), T = a * r + b;
      return {
        q: rich("Rechne um: ", S(a), " ", big, " ", N(b), " ", small, " = ? ", small),
        a: rich(N(T), " ", small),
        steps: [
          rich(S(a), " ", big, " = ", S(a), " · ", N(r), " ", small, " = ", N(a * r), " ", small),
          rich(N(a * r), " ", small, " + ", N(b), " ", small, " = ", N(T), " ", small),
        ],
      };
    }
    const [c, i] = rng.pick([[CHAINS[0], 1], [CHAINS[0], 2], [CHAINS[3], 0], [CHAINS[3], 1]]);
    const big = c.u[i], mid = c.u[i + 1], small = c.u[i + 2], r1 = c.r[i], r2 = c.r[i + 1];
    const x = rng.int(2, r1 * r2 > 1000 ? 5 : 9);
    return {
      q: rich("Rechne um: ", S(x), " ", big, " = ? ", small),
      a: rich(N(x * r1 * r2), " ", small),
      steps: [
        rich(S(x), " ", big, " = ", S(x), " · ", N(r1), " ", mid, " = ", N(x * r1), " ", mid),
        rich(N(x * r1), " ", mid, " = ", N(x * r1), " · ", N(r2), " ", small, " = ", N(x * r1 * r2), " ", small),
      ],
    };
  }

  // Niveau 3: in die größere Einheit mit Rest (4300 m = 4 km 300 m)
  function umrThree(rng) {
    const c = rng.pick(CHAINS), i = rng.int(0, c.u.length - 2);
    const big = c.u[i], small = c.u[i + 1], r = c.r[i];
    const a = rng.int(1, 9), b = remOf(rng, stepOf(big, small), r), T = a * r + b;
    return {
      q: rich("Rechne um: ", N(T), " ", small, " = ? ", big, " ", small),
      a: rich(S(a), " ", big, " ", N(b), " ", small),
      steps: [
        rich(N(T), " ", small, " = ", S(a), " · ", N(r), " ", small, " + ", N(b), " ", small),
        rich(N(T), " ", small, " = ", S(a), " ", big, " ", N(b), " ", small),
      ],
    };
  }

  AG.registerType({
    id: "m5-groessen-umrechnen",
    klasse: "5",
    zug: "RM",
    lb: "5",
    lbTitle: "Größen im Alltag",
    title: "Größen umrechnen",
    topic: "groessen",
    instruction: {
      1: "Rechne in die angegebene Einheit um.",
      2: "Rechne in die angegebene Einheit um. Achte auf gemischte Angaben und auf mehrere Umrechnungsschritte.",
      3: "Rechne in die größere Einheit um. Der Rest bleibt in der kleineren Einheit.",
    },
    merke: [
      "Länge: 1 km = 1000 m = 10 dm = 100 cm = 1000 mm. Geld: 1 € = 100 ct. Zeit: 1 d = 24 h, 1 h = 60 min, 1 min = 60 s; 1 Jahr = 12 Monate. ",
      "In eine kleinere Einheit wird mit der Umrechnungszahl multipliziert, in eine größere geteilt. Beispiel: 3 km = 3 · 1000 m = 3000 m; 4300 m = 4 km 300 m.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return umrOne(rng);
      if (level === 2) return umrTwo(rng);
      return umrThree(rng);
    },
  });

  // ---------- 2. Brüche bei Größen ----------
  const F = (n, d) => new Frac(n, d);
  const SIMPLE = [F(1, 2), F(1, 4), F(3, 4)];
  const MIXED = [F(3, 2), F(9, 4), F(7, 4), F(5, 2)];
  const TENTHS = [F(1, 10), F(3, 10), F(7, 10), F(9, 10)];
  const FIFTHS = [F(1, 5), F(2, 5), F(3, 5), F(4, 5)];   // nur bei Stunden und Metern
  const PAIRS = [
    { u: "h", v: "min", r: 60, fifth: true },
    { u: "km", v: "m", r: 1000, fifth: true },
    { u: "m", v: "cm", r: 100, fifth: true },
    { u: "l", v: "ml", r: 1000 },
    { u: "kg", v: "g", r: 1000 },
    { u: "t", v: "kg", r: 1000 },
    { u: "€", v: "ct", r: 100 },
    { u: "d", v: "h", r: 24 },
  ];
  // Brüche, die in der kleineren Einheit eine ganze Zahl ergeben
  const poolOf = (level, p) => {
    const base = level === 1 ? SIMPLE : [...SIMPLE, ...MIXED, ...TENTHS, ...(p.fifth ? FIFTHS : [])];
    return base.filter(f => f.mul(p.r).isInt());
  };

  // Bruch der großen Einheit → kleine Einheit: ¾ h = 45 min
  function brForward(p, f) {
    const r = p.r, d = f.d, w = Math.floor(f.n / d), rem = f.n - w * d;
    const unit = r / d, part = rem * unit, val = f.mul(r).n;
    const steps = [];
    if (w > 0) steps.push(rich(S(w), " ", p.u, " = ", N(w * r), " ", p.v));
    if (rem > 0) steps.push(rich(frac(1, d), " ", p.u, " = ", N(r), " ", p.v, " : ", S(d), " = ", N(unit), " ", p.v));
    if (rem > 1) steps.push(rich(frac(rem, d), " ", p.u, " = ", S(rem), " · ", N(unit), " ", p.v, " = ", N(part), " ", p.v));
    if (w > 0 && rem > 0) steps.push(rich(N(w * r), " ", p.v, " + ", N(part), " ", p.v, " = ", N(val), " ", p.v));
    return {
      q: rich(num(f), " ", p.u, " = ? ", p.v),
      a: rich(N(val), " ", p.v),
      steps,
      check: { f, r, t: val, rev: false },
    };
  }

  // Kleine Einheit → Bruch der großen Einheit: 750 g = ¾ kg
  function brReverse(p, f) {
    const t = f.mul(p.r).n;
    const steps = [rich(N(t), " ", p.v, " = ", frac(t, p.r), " ", p.u), rich("= ", frac(f.n, f.d), " ", p.u)];
    if (f.n > f.d) steps.push(rich("= ", num(f), " ", p.u));
    return {
      q: rich(N(t), " ", p.v, " = ? ", p.u),
      a: rich(num(f), " ", p.u),
      steps,
      check: { f, r: p.r, t, rev: true },
    };
  }

  AG.registerType({
    id: "m5-groessen-brueche",
    klasse: "5",
    zug: "RM",
    lb: "5",
    lbTitle: "Größen im Alltag",
    title: "Brüche bei Größen",
    topic: "groessen",
    instruction: {
      1: "Rechne in die angegebene Einheit um.",
      2: "Rechne in die angegebene Einheit um. Die Bruchzahl gehört zur großen Einheit.",
      3: "Rechne um. Achte auf die Richtung: Manchmal ist eine Bruchzahl gesucht.",
    },
    merke: [
      "Einen Bruchteil einer Größe berechnet man über die kleine Einheit: ", frac(3, 4), " h = 3 · (60 min : 4) = 3 · 15 min = 45 min. ",
      "Umgekehrt: 750 g = ", frac(750, 1000), " kg = ", frac(3, 4), " kg.",
    ],
    cols: 3,
    generate(rng, level) {
      for (let i = 0; i < 500; i++) {
        const p = rng.pick(PAIRS);
        const pool = poolOf(level, p);
        if (!pool.length) continue;
        const f = rng.pick(pool);
        const rev = level === 1 ? rng.chance(0.4) : level === 3 && rng.chance(0.5);
        return rev ? brReverse(p, f) : brForward(p, f);
      }
      throw new Error("m5-groessen-brueche: keine Aufgabe gefunden");
    },
    verify(t) {
      const m = t.check;
      if (!m) return "kein Prüfdatensatz";
      if (!m.f.mul(m.r).eq(m.t)) return "Umrechnung stimmt nicht";
      const want = m.rev ? plain(num(m.f)) : S(m.t);
      if (!plain(t.a).includes(want)) return "Ergebnis fehlt im Lösungstext: " + want;
      return true;
    },
  });

  // ---------- 3. Kommaschreibweise bei Geld und Längen ----------
  // Niveau 1: 3 € 45 ct = 3,45 €  und  2 m 5 cm = 2,05 m
  function komOne(rng) {
    if (rng.chance(0.5)) {
      const E = rng.int(1, 9), R = 5 * rng.int(1, 19);
      return {
        q: rich("Schreibe in Euro mit Komma: ", S(E), " € ", S(R), " ct"),
        a: rich(dec2(E * 100 + R), " €"),
        steps: [
          rich(S(R), " ct = ", dec2(R), " €"),
          rich(S(E), " € + ", dec2(R), " € = ", dec2(E * 100 + R), " €"),
        ],
      };
    }
    const E = rng.int(1, 9), R = rng.int(1, 99), tot = dmin(E * 100 + R, 100);
    return {
      q: rich("Schreibe in Metern mit Komma: ", S(E), " m ", S(R), " cm"),
      a: rich(tot, " m"),
      steps: [
        rich(S(R), " cm = ", dmin(R, 100), " m"),
        rich(S(E), " m + ", dmin(R, 100), " m = ", tot, " m"),
      ],
    };
  }

  // Niveau 2: Komma in die kleine Einheit: 3,45 € = 345 ct, 1,5 m = 150 cm, 0,05 € = 5 ct
  function komTwo(rng) {
    if (rng.chance(0.5)) {
      const C = 5 * rng.int(1, 300);
      return {
        q: rich("Rechne um: ", dec2(C), " € = ? ct"),
        a: rich(N(C), " ct"),
        steps: [rich(dec2(C), " € = ", dec2(C), " · 100 ct = ", N(C), " ct")],
      };
    }
    const C = tryN(100, () => { const c = rng.int(1, 999); return c % 100 === 0 ? null : c; });
    return {
      q: rich("Rechne um: ", dmin(C, 100), " m = ? cm"),
      a: rich(N(C), " cm"),
      steps: [rich(dmin(C, 100), " m = ", dmin(C, 100), " · 100 cm = ", N(C), " cm")],
    };
  }

  // Niveau 3: km und m (2,35 km = 2350 m) sowie Ordnen von Längen
  function komThree(rng) {
    if (rng.chance(0.5)) {
      const M = tryN(100, () => { const m = rng.int(100, 999) * 10; return m % 1000 === 0 ? null : m; });
      const km = dmin(M, 1000);
      if (rng.chance(0.5)) {
        return {
          q: rich("Rechne um: ", km, " km = ? m"),
          a: rich(N(M), " m"),
          steps: [rich(km, " km = ", km, " · 1000 m = ", N(M), " m")],
        };
      }
      return {
        q: rich("Rechne um: ", N(M), " m = ? km"),
        a: rich(km, " km"),
        steps: [rich(N(M), " m = ", N(M), " : 1000 km = ", km, " km")],
      };
    }
    // drei Längen: eine in km mit einer Nachkommastelle, eine in m, eine in km mit zwei Stellen
    const a10 = tryN(100, () => { const v = rng.int(11, 59); return v % 10 === 0 ? null : v; });
    const vA = a10 * 100;
    const o1 = rng.pick([-300, -200, -150, -100, 100, 150, 200, 300]);
    const o2 = rng.pick([-90, -50, -30, -10, 10, 30, 50, 90]);
    const items = [
      { lab: dmin(vA, 1000) + " km", v: vA, km: true },
      { lab: N(vA + o1) + " m", v: vA + o1, km: false },
      { lab: dmin(vA + o2, 1000) + " km", v: vA + o2, km: true },
    ];
    const sorted = [...items].sort((x, y) => x.v - y.v);
    return {
      q: rich("Ordne die Längen der Größe nach. Beginne mit der kürzesten: ", rng.shuffle(items).map(x => x.lab).join("; "), "."),
      a: rich(sorted.map(x => x.lab).join(" < ")),
      steps: [
        ...items.filter(x => x.km).map(x => rich(x.lab, " = ", N(x.v), " m")),
        rich("Vergleich in m: ", sorted.map(x => N(x.v) + " m").join(" < ")),
      ],
    };
  }

  AG.registerType({
    id: "m5-kommaschreibweise",
    klasse: "5",
    zug: "RM",
    lb: "5",
    lbTitle: "Größen im Alltag",
    title: "Kommaschreibweise bei Geld und Längen",
    topic: "groessen",
    instruction: {
      1: "Schreibe die Größe mit Komma.",
      2: "Rechne um. Achte auf die Nullen nach dem Komma.",
      3: "Rechne um oder ordne die Längen der Größe nach.",
    },
    merke: [
      "Das Komma trennt die großen Einheiten von den kleinen: 1 € = 100 ct, also 45 ct = 0,45 €. 1 m = 100 cm, also 5 cm = 0,05 m. 1 km = 1000 m, also 2,5 km = 2500 m. ",
      "Beispiel: 3 € 45 ct = 3,45 €; 1,5 m = 150 cm.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) return komOne(rng);
      if (level === 2) return komTwo(rng);
      return komThree(rng);
    },
  });

  // ---------- 4. Sachaufgaben mit Größen ----------
  const PERS = [["Lena", "sie"], ["Tim", "er"], ["Mia", "sie"], ["Ben", "er"], ["Anna", "sie"], ["Paul", "er"]];
  const WARE = [["Hefte", 125], ["Brötchen", 45], ["Packungen Nudeln", 139], ["Tafeln Schokolade", 89], ["Becher Joghurt", 65], ["Stifte", 35]];
  const ZUT = ["Mehl", "Nudeln", "Hackfleisch", "Reis", "Zucker", "Käse"];

  // Einkauf mit Wechselgeld (ein Artikel)
  function saEinkauf1(rng) {
    const [name, gend] = rng.pick(PERS);
    const [ware, p] = rng.pick(WARE);
    const n = rng.int(2, 6), sum = n * p;
    const paid = rng.pick([500, 1000, 2000].filter(x => x > sum));
    const back = paid - sum;
    return {
      q: rich(name, " kauft ", S(n), " ", ware, " zu je ", dec2(p), " €. ", Pron(gend), " zahlt mit ", dec2(paid), " €. Wie viel Wechselgeld bekommt ", gend, " zurück?"),
      a: rich(dec2(back), " €"),
      steps: [
        rich(S(n), " · ", dec2(p), " € = ", dec2(sum), " €"),
        rich(dec2(paid), " € ", MINUS, " ", dec2(sum), " € = ", dec2(back), " €"),
        rich("Antwort: ", name, " bekommt ", dec2(back), " € Wechselgeld zurück."),
      ],
    };
  }

  // Einkauf mit zwei Posten
  function saEinkauf2(rng) {
    const [name, gend] = rng.pick(PERS);
    const p = rng.pick([35, 40, 45, 50, 55]), n = rng.int(2, 5), k = rng.pick([120, 150, 180, 210, 240, 275, 300]);
    const sum = n * p + k;
    const paid = rng.pick([1000, 2000].filter(x => x > sum));
    const back = paid - sum;
    return {
      q: rich(name, " kauft ", S(n), " Brötchen zu je ", dec2(p), " € und ein Stück Kuchen für ", dec2(k), " €. ", Pron(gend), " zahlt mit ", dec2(paid), " €. Wie viel Wechselgeld bekommt ", gend, " zurück?"),
      a: rich(dec2(back), " €"),
      steps: [
        rich(S(n), " · ", dec2(p), " € = ", dec2(n * p), " €"),
        rich(dec2(n * p), " € + ", dec2(k), " € = ", dec2(sum), " €"),
        rich(dec2(paid), " € ", MINUS, " ", dec2(sum), " € = ", dec2(back), " €"),
        rich("Antwort: ", name, " bekommt ", dec2(back), " € Wechselgeld zurück."),
      ],
    };
  }

  // Fahrplan: Abfahrt und Fahrtdauer, Ankunft gesucht
  function saBus1(rng) {
    const dep = rng.int(6, 17) * 60 + 5 * rng.int(0, 11);
    const d = 5 * rng.int(2, 28), arr = dep + d;
    const hh = Math.floor(d / 60), mm = d % 60;
    const steps = [];
    let cur = dep;
    if (hh > 0) {
      steps.push(rich(clock(cur), " + ", S(hh), " h = ", clock(cur + 60 * hh)));
      cur += 60 * hh;
    }
    if (mm > 0) steps.push(rich(clock(cur), " + ", S(mm), " min = ", clock(arr)));
    steps.push(rich("Der Bus kommt um ", clock(arr), " an."));
    return {
      q: rich("Der Bus fährt um ", clock(dep), " ab. Die Fahrt dauert ", durStr(d), ". Wann kommt er an?"),
      a: rich(clock(arr)),
      steps,
    };
  }

  // Fahrplan rückwärts: Abfahrt und Ankunft gegeben, Fahrtdauer gesucht (Übergang über volle Stunden)
  function saZugRueck(rng) {
    const dep = rng.int(6, 19) * 60 + 5 * rng.int(0, 11);
    const d = 5 * rng.int(4, 40), end = dep + d;
    const steps = [];
    let cur = dep;
    const nextFull = Math.ceil(cur / 60) * 60;
    if (cur % 60 !== 0 && end > nextFull) {
      steps.push(rich("Von ", clock(cur), " bis ", clock(nextFull), ": ", S(nextFull - cur), " min"));
      cur = nextFull;
    }
    while (end - cur >= 60) {
      steps.push(rich("Von ", clock(cur), " bis ", clock(cur + 60), ": 1 h"));
      cur += 60;
    }
    if (end - cur > 0) steps.push(rich("Von ", clock(cur), " bis ", clock(end), ": ", S(end - cur), " min"));
    steps.push(rich("Die Fahrt dauert also ", durStr(d), "."));
    return {
      q: rich("Der Zug fährt um ", clock(dep), " ab und kommt um ", clock(end), " an. Wie lange dauert die Fahrt?"),
      a: rich(durStr(d)),
      steps,
    };
  }

  // Wanderung: Strecke zum Ziel (Differenz) oder Gesamtstrecke (Summe), jeweils in km und m
  function saWander(rng) {
    if (rng.chance(0.5)) {
      const k = rng.int(3, 9), T = 1000 * k + 50 * rng.int(1, 19);
      const B = tryN(100, () => {
        const b = 1000 * rng.int(1, k - 1) + 50 * rng.int(1, 19);
        return T - b < 1000 ? null : b;
      }), R = T - B;
      return {
        q: rich("Die Wanderung ist ", kmStr(T), " lang. Nach ", kmStr(B), " machen wir eine Pause. Wie weit ist es danach noch bis zum Ziel?"),
        a: rich(kmStr(R)),
        steps: [
          rich(kmStr(T), " = ", N(T), " m"),
          rich(kmStr(B), " = ", N(B), " m"),
          rich(N(T), " m ", MINUS, " ", N(B), " m = ", N(R), " m"),
          rich("Bis zum Ziel sind es noch ", kmStr(R), "."),
        ],
      };
    }
    const A = 1000 * rng.int(1, 5) + 50 * rng.int(1, 19), B = 1000 * rng.int(1, 4) + 50 * rng.int(1, 19), T = A + B;
    return {
      q: rich("Am Vormittag wandern wir ", kmStr(A), ". Am Nachmittag sind es ", kmStr(B), ". Wie weit sind wir insgesamt gewandert?"),
      a: rich(kmStr(T)),
      steps: [
        rich(kmStr(A), " = ", N(A), " m"),
        rich(kmStr(B), " = ", N(B), " m"),
        rich(N(A), " m + ", N(B), " m = ", N(T), " m"),
        rich("Insgesamt sind wir ", kmStr(T), " gewandert."),
      ],
    };
  }

  // Zutaten für ein Rezept: für 4 Personen → für p Personen
  function saZutaten(rng) {
    const z = rng.pick(ZUT), g = 4 * rng.int(20, 150), p = rng.pick([2, 6, 8, 10, 12]);
    const pro = g / 4, res = pro * p;
    return {
      q: rich("Für 4 Personen braucht man ", N(g), " g ", z, ". Wie viel g braucht man für ", S(p), " Personen?"),
      a: rich(N(res), " g"),
      steps: [
        rich(N(g), " g : 4 = ", N(pro), " g (für 1 Person)"),
        rich(N(pro), " g · ", S(p), " = ", N(res), " g"),
        rich("Für ", S(p), " Personen braucht man ", N(res), " g ", z, "."),
      ],
    };
  }

  // Sinnvoll runden: Busse (aufrunden)
  function saBusse(rng) {
    const [S_, P] = tryN(100, () => {
      const s = rng.int(31, 95), p = rng.pick([20, 25, 30]);
      return s % p === 0 ? null : [s, p];
    });
    const q0 = Math.floor(S_ / P), need = q0 + 1;
    return {
      q: rich("Die Klasse 5a fährt ins Museum. Es fahren ", S(S_), " Kinder mit. In einen Bus passen ", S(P), " Kinder. Wie viele Busse braucht man?"),
      a: rich(S(need), " Busse"),
      steps: [
        rich(N(S_), " : ", S(P), " = ", S(q0), " Rest ", S(S_ % P)),
        rich(q0 === 1 ? "Ein Bus reicht" : S(q0) + " Busse reichen", " nicht für alle Kinder, also braucht man ", S(need), " Busse."),
      ],
    };
  }

  // Sinnvoll runden: Packungen (aufrunden)
  function saPack(rng) {
    const [nm, gend] = rng.pick(PERS);
    const P = rng.pick([250, 500]);
    const g = tryN(100, () => {
      const v = 50 * rng.int(5, 25);
      return v % P === 0 || v < P ? null : v;
    });
    const q0 = Math.floor(g / P), need = q0 + 1;
    return {
      q: rich("Für einen Kuchen braucht ", nm, " ", dmin(g, 1000), " kg Mehl. Mehl gibt es nur in Packungen zu ", S(P), " g. Wie viele Packungen muss ", gend, " kaufen?"),
      a: rich(S(need), " Packungen"),
      steps: [
        rich(dmin(g, 1000), " kg = ", N(g), " g"),
        rich(N(g), " g : ", S(P), " g = ", dmin(g, P), " Packungen"),
        rich(q0 === 1 ? "Eine Packung reicht" : S(q0) + " Packungen reichen", " nicht, also braucht ", nm, " ", S(need), " Packungen."),
      ],
    };
  }

  AG.registerType({
    id: "m5-groessen-sachaufgaben",
    klasse: "5",
    zug: "RM",
    lb: "5",
    lbTitle: "Größen im Alltag",
    title: "Sachaufgaben mit Größen",
    topic: "groessen",
    instruction: {
      1: "Rechne. Schreibe am Ende einen Antwortsatz.",
      2: "Rechne. Achte auf die Einheiten und schreibe am Ende einen Antwortsatz.",
      3: "Rechne. Runde sinnvoll und beantworte die Frage mit einem Antwortsatz.",
    },
    merke: [
      "Zuerst die Angaben und die Frage herausschreiben, dann rechnen. Die Einheiten müssen zusammenpassen: 2 km 350 m = 2350 m. ",
      "Anzahlen wie Busse rundet man aufrunden, wenn ein Rest übrig bleibt. Beispiel: 52 Kinder, 30 Plätze pro Bus: 52 : 30 = 1 Rest 22, also 2 Busse.",
    ],
    cols: 1,
    generate(rng, level) {
      if (level === 1) return rng.chance(0.5) ? saEinkauf1(rng) : saBus1(rng);
      if (level === 2) return rng.pick([saEinkauf2, saWander, saZutaten])(rng);
      return rng.pick([saBusse, saPack, saZugRueck])(rng);
    },
  });

  // ---------- 5. Strichliste → Häufigkeitstabelle → Säulendiagramm ----------
  const SURVEYS = [
    { intro: "Die Klasse 5a hat die Kinder nach ihrem Lieblingstier gefragt.", head: "Lieblingstier", names: ["Hund", "Katze", "Pferd", "Hase", "Fisch", "Hamster"] },
    { intro: "Die Klasse 5a hat notiert, wie die Kinder zur Schule kommen.", head: "Verkehrsmittel", names: ["Bus", "Fahrrad", "zu Fuß", "Auto", "Bahn"] },
    { intro: "Die Klasse 5a hat die Kinder nach ihrem Lieblingssport gefragt.", head: "Lieblingssport", names: ["Fußball", "Schwimmen", "Turnen", "Tanzen", "Radfahren"] },
  ];
  // Strichliste: Fünfergruppen „|||||“, Rest einzeln, Gruppen durch Leerzeichen getrennt
  const strokes = n => {
    const g = [];
    for (let k = 0; k < Math.floor(n / 5); k++) g.push("|||||");
    if (n % 5) g.push("|".repeat(n % 5));
    return g.join(" ");
  };
  // Zählen einer Fünfergruppe in Worten: „2 · 5 + 2 = 12“
  const brk = n => {
    const f5 = Math.floor(n / 5), r = n % 5;
    return f5 ? `${f5} · 5` + (r ? ` + ${r}` : "") : `${r} Striche`;
  };
  // Häufigkeiten zwischen 2 und 9, Summe zwischen 20 und 28 (realistische Klassengröße)
  const counts = (rng, n) => {
    return tryN(200, () => {
      const v = Array.from({ length: n }, () => rng.int(2, 9));
      const s = v.reduce((a, b) => a + b, 0);
      return s < 20 || s > 28 || new Set(v).size < 2 ? null : v;
    });
  };
  // Tabelle: Kopf, je eine Zeile je Antwort, Summe. blank: Zellen leer lassen
  function freqTable(head, names, vals, blank) {
    const total = vals.reduce((a, b) => a + b, 0);
    const cell = v => [blank ? { blank: 3 } : S(v)];
    return {
      rows: [
        [[{ b: head }], [{ b: "absolute Häufigkeit" }]],
        ...names.map((nm, i) => [[nm], cell(vals[i])]),
        [[{ b: "Summe" }], cell(total)],
      ],
    };
  }
  // Säulendiagramm mit absoluten Häufigkeiten: Achse mit Schritt 1, keine Werte über den Säulen
  function columnFig(names, vals) {
    const W = 140, H = 60, xA = 14, yB = 50, yT = 8;
    const T = Math.max(...vals) + 1;
    const sy = v => yB - (v / T) * (yB - yT);
    const s = AG.sketch(W, H);
    s.line([xA, yT - 2], [xA, yB]);
    s.line([xA, yB], [W - 3, yB]);
    for (let t = 0; t <= T; t++) {
      s.line([xA - 1, sy(t)], [xA, sy(t)]);
      s.label([xA - 2, sy(t)], String(t), { anchor: "end" });
    }
    const slot = (W - xA - 4) / names.length, bw = slot * 0.5;
    names.forEach((nm, i) => {
      const x = xA + slot * i + (slot - bw) / 2;
      s.rect(x, sy(vals[i]), bw, yB - sy(vals[i]), { fill: COLORS[i] });
      s.label([x + bw / 2, yB + 4.5], nm);
    });
    return s.done();
  }

  AG.registerType({
    id: "m5-strichliste",
    klasse: "5",
    zug: "RM",
    lb: "6",
    lbTitle: "Daten",
    title: "Strichliste, Tabelle, Säulendiagramm",
    topic: "daten",
    instruction: {
      1: "Übertrage die Strichliste in eine Häufigkeitstabelle.",
      2: "Lies die absoluten Häufigkeiten im Säulendiagramm ab und trage sie in die Tabelle ein.",
      3: "Lies die Werte im Säulendiagramm ab und beantworte die Fragen.",
    },
    merke: [
      "In einer Strichliste steht jeder Strich für ein Kind. Fünfergruppen ||||| zählt man zuerst. Die absolute Häufigkeit ist die Anzahl der Kinder. ",
      "Beispiel: ||||| || bedeutet 5 + 2 = 7 Kinder.",
    ],
    cols: 1,
    generate(rng, level) {
      const sv = rng.pick(SURVEYS);
      const n = level === 1 ? 4 : rng.int(4, 5);
      const names = rng.shuffle(sv.names).slice(0, n);
      const vals = counts(rng, n);
      const total = vals.reduce((a, b) => a + b, 0);

      if (level === 1) {
        const lines = names.map((nm, i) => [{ br: true }, nm + ": " + strokes(vals[i])]);
        return {
          q: rich(sv.intro, " Jeder Strich steht für ein Kind.", lines, { br: true }, "Übertrage die Strichliste in die Tabelle und ergänze die Summe."),
          table: freqTable(sv.head, names, vals, true),
          aTable: freqTable(sv.head, names, vals, false),
          a: rich(names.map((nm, i) => nm + ": " + S(vals[i])).join("; "), "; Summe: ", S(total)),
          steps: [
            ...names.map((nm, i) => rich(nm, ": ", brk(vals[i]), " = ", S(vals[i]))),
            rich("Summe: ", vals.map(S).join(" + "), " = ", S(total)),
          ],
        };
      }

      if (level === 2) {
        return {
          q: rich("Das Säulendiagramm zeigt, wie die Kinder der Klasse 5a geantwortet haben: ", names.join(", "), ". Lies die absoluten Häufigkeiten ab und trage sie in die Tabelle ein. Ergänze die Summe."),
          table: freqTable(sv.head, names, vals, true),
          aTable: freqTable(sv.head, names, vals, false),
          fig: columnFig(names, vals),
          inline: false,
          a: rich(names.map((nm, i) => nm + ": " + S(vals[i])).join("; "), "; Summe: ", S(total)),
          steps: [
            rich("Ablesen: ", names.map((nm, i) => nm + " " + S(vals[i])).join(", ")),
            rich("Summe: ", vals.map(S).join(" + "), " = ", S(total)),
          ],
        };
      }

      // Niveau 3: Unterschied, Summe und Summe zweier Antworten aus dem Diagramm
      let ia = rng.int(0, n - 1);
      let ib = tryN(100, () => { const j = rng.int(0, n - 1); return vals[j] === vals[ia] ? null : j; });
      if (vals[ib] > vals[ia]) [ia, ib] = [ib, ia];
      const d = vals[ia] - vals[ib];
      const ic = rng.int(0, n - 1);
      const id = tryN(100, () => { const j = rng.int(0, n - 1); return j === ic ? null : j; });
      return {
        q: rich(sv.intro, " Das Diagramm zeigt das Ergebnis. (a) Wie viele Kinder mehr nennen „", names[ia], "“ als „", names[ib], "“? (b) Wie viele Kinder wurden insgesamt befragt? (c) Wie viele Kinder nennen „", names[ic], "“ oder „", names[id], "“ zusammen?"),
        fig: columnFig(names, vals),
        inline: false,
        a: rich("(a) ", S(d), " Kinder mehr; (b) ", S(total), " Kinder; (c) ", S(vals[ic] + vals[id]), " Kinder."),
        steps: [
          rich("(a) ", S(vals[ia]), " ", MINUS, " ", S(vals[ib]), " = ", S(d)),
          rich("(b) ", vals.map(S).join(" + "), " = ", S(total)),
          rich("(c) ", S(vals[ic]), " + ", S(vals[id]), " = ", S(vals[ic] + vals[id])),
        ],
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
