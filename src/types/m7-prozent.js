// M7 LB 1 (Prozentrechnung): Prozentwert, Grundwert, Prozentsatz, Umwandlung,
// Mischungsverhältnisse, Prozentsatz als Faktor.
(function (AG) {
  const { Frac, num, rich } = AG;

  // ---------- Hilfen ----------
  const v = x => num(x, { as: "dec" });   // Zahl als Dezimalzahl mit Komma („2,5“, „80“)
  const pc = p => rich(v(p), " %");       // Prozentsatz („2,5 %“)
  const ok = (cond, msg) => (cond ? true : msg);

  // Nominativ mit Zahl: „1 Schüler“, „28 Schüler“ (Singular bei 1)
  const Q = (c, x) => rich(v(x), " ", x.eq(1) ? c.sg : c.pl);
  // Dativ nach „von“/„mit“/„für“: „von 60 Schülern“, „von 1 Schüler“
  const D = (c, x) => rich(v(x), " ", x.eq(1) ? c.sg : c.dat);

  // Prozentsatz je Niveau. over: über 100 % (nur Sachkontexte mit over)
  function pickPct(rng, level, over) {
    if (level === 1) return new Frac(rng.pick([5, 10, 20, 25, 50, 75]), 1);
    if (level === 2) return new Frac(rng.int(2, 95), 1);
    if (over) return new Frac(rng.pick([105, 110, 115, 120, 125, 150]), 1);
    // mit Komma (1,5 … 39,5 %) oder ganzzahlig
    return rng.chance(0.5) ? new Frac(2 * rng.int(1, 39) + 1, 2) : new Frac(rng.int(5, 95), 1);
  }

  // ---------- Sachkontexte ----------
  // range/step: realistischer Bereich des Ganzen G (ganzzahlig, Vielfache von step)
  // whole: Ergebnisse müssen ganze Zahlen sein (Personen, Seiten, Stück, Minuten)
  // money: Geld, Ergebnisse höchstens 2 Nachkommastellen (sonst 1)
  // sh: Dativ-Ergänzung für Kurzaufgaben; qw: Fragewort; pwl, gw, ps: Langfassungen
  const CTX = [
    { sg: "km", pl: "km", dat: "km", range: [2, 12], step: 1, qw: "Wie viele km",
      sh: (c, G) => rich("von einem Schulweg mit ", D(c, G)),
      pwl: (c, G, p) => rich("Der Schulweg ist ", Q(c, G), " lang. Tim fährt ", pc(p), " davon mit dem Rad. Wie viele km sind das?"),
      gw: (c, G, p, P) => rich("Tim fährt ", pc(p), " seines Schulwegs mit dem Rad. Das sind ", Q(c, P), ". Wie lang ist der Schulweg?"),
      ps: (c, G, p, P) => rich("Der Schulweg ist ", Q(c, G), " lang. Tim fährt ", Q(c, P), " mit dem Rad. Wie viel Prozent sind das?") },
    { sg: "km", pl: "km", dat: "km", range: [8, 25], step: 1, qw: "Wie viele km",
      sh: (c, G) => rich("von einer Wanderung mit ", D(c, G)),
      pwl: (c, G, p) => rich("Die Wanderung ist ", Q(c, G), " lang. Nach ", pc(p), " der Strecke machen wir eine Pause. Wie viele km sind das?"),
      gw: (c, G, p, P) => rich("Nach ", pc(p), " der Wanderung sind wir bei ", Q(c, P), ". Wie lang ist die ganze Wanderung?"),
      ps: (c, G, p, P) => rich("Die Wanderung ist ", Q(c, G), " lang. Wir sind ", Q(c, P), " gewandert. Wie viel Prozent sind das?") },
    { sg: "Schüler", pl: "Schüler", dat: "Schülern", range: [20, 32], step: 1, whole: true, qw: "Wie viele Schüler",
      sh: (c, G) => rich("von einer Klasse mit ", D(c, G)),
      pwl: (c, G, p) => rich("In der Klasse 7b sind ", Q(c, G), ". ", pc(p), " davon fahren mit dem Bus. Wie viele Schüler sind das?"),
      gw: (c, G, p, P) => rich(pc(p), " der Klasse 7b nehmen am Ausflug teil. Das sind ", Q(c, P), ". Wie viele Schüler hat die Klasse?"),
      ps: (c, G, p, P) => rich("In der Klasse 7b sind ", Q(c, G), ". ", Q(c, P), " davon spielen Fußball. Wie viel Prozent sind das?") },
    { sg: "Schüler", pl: "Schüler", dat: "Schülern", range: [20, 32], step: 1, whole: true, qw: "Wie viele Schüler",
      sh: (c, G) => rich("von einer Umfrage mit ", D(c, G)),
      pwl: (c, G, p) => rich("An einer Umfrage in der Klasse haben ", Q(c, G), " teilgenommen. ", pc(p), " davon wünschen sich einen Schulausflug. Wie viele Schüler sind das?"),
      gw: (c, G, p, P) => rich(pc(p), " der Klasse wünschen sich eine Pizzaparty. Das sind ", Q(c, P), ". Wie viele Schüler hat die Klasse?"),
      ps: (c, G, p, P) => rich("In der Klasse sind ", Q(c, G), ". ", Q(c, P), " wünschen sich eine Pizzaparty. Wie viel Prozent sind das?") },
    { sg: "Schüler", pl: "Schüler", dat: "Schülern", range: [250, 900], step: 10, whole: true, qw: "Wie viele Schüler",
      sh: (c, G) => rich("von einer Schule mit ", D(c, G)),
      pwl: (c, G, p) => rich("Die Schule hat ", Q(c, G), ". ", pc(p), " davon nehmen am Schulchor teil. Wie viele Schüler sind das?"),
      gw: (c, G, p, P) => rich(pc(p), " der Schüler nehmen am Sporttag teil. Das sind ", Q(c, P), ". Wie viele Schüler hat die Schule?"),
      ps: (c, G, p, P) => rich("Die Schule hat ", Q(c, G), ". Am Sporttag machen ", Q(c, P), " mit. Wie viel Prozent sind das?") },
    { sg: "Besucher", pl: "Besucher", dat: "Besuchern", range: [120, 600], step: 10, whole: true, qw: "Wie viele Besucher",
      sh: (c, G) => rich("von einem Schulfest mit ", D(c, G)),
      pwl: (c, G, p) => rich("Beim Schulfest kommen ", Q(c, G), ". ", pc(p), " davon bleiben bis zum Abend. Wie viele Besucher sind das?"),
      gw: (c, G, p, P) => rich("Am Abend bleiben ", pc(p), " der Besucher. Das sind ", Q(c, P), ". Wie viele Besucher kamen zum Schulfest?"),
      ps: (c, G, p, P) => rich("Zum Schulfest kommen ", Q(c, G), ". Am Abend bleiben ", Q(c, P), ". Wie viel Prozent sind das?") },
    { sg: "Seite", pl: "Seiten", dat: "Seiten", range: [120, 480], step: 10, whole: true, qw: "Wie viele Seiten",
      sh: (c, G) => rich("von einem Buch mit ", D(c, G)),
      pwl: (c, G, p) => rich("Ein Buch hat ", Q(c, G), ". Tim hat ", pc(p), " davon gelesen. Wie viele Seiten sind das?"),
      gw: (c, G, p, P) => rich("Tim hat ", pc(p), " des Buches gelesen. Das sind ", Q(c, P), ". Wie viele Seiten hat das Buch?"),
      ps: (c, G, p, P) => rich("Ein Buch hat ", Q(c, G), ". Tim hat ", Q(c, P), " gelesen. Wie viel Prozent des Buches sind das?") },
    { sg: "€", pl: "€", dat: "€", range: [250, 900], step: 10, money: true, pMax: 50, qw: "Wie viel €",
      sh: (c, G) => rich("von einem Fahrrad für ", Q(c, G)),
      pwl: (c, G, p) => rich("Ein Fahrrad kostet ", Q(c, G), ". Im Sommerangebot gibt es ", pc(p), " Rabatt. Wie viel € spart man?"),
      gw: (c, G, p, P) => rich("Im Sommerangebot spart man ", pc(p), " des Fahrradpreises. Das sind ", Q(c, P), ". Wie teuer war das Fahrrad vorher?"),
      ps: (c, G, p, P) => rich("Ein Fahrrad kostet ", Q(c, G), ". Im Sommerangebot spart man ", Q(c, P), ". Wie viel Prozent Rabatt ist das?") },
    { sg: "€", pl: "€", dat: "€", range: [150, 800], step: 10, money: true, pMax: 50, qw: "Wie viel €",
      sh: (c, G) => rich("von einem Handy für ", Q(c, G)),
      pwl: (c, G, p) => rich("Ein Handy kostet ", Q(c, G), ". Beim Sale gibt es ", pc(p), " Rabatt. Wie viel € spart man?"),
      gw: (c, G, p, P) => rich("Beim Sale spart man ", pc(p), " vom Preis. Das sind ", Q(c, P), ". Wie viel € kostete das Handy vorher?"),
      ps: (c, G, p, P) => rich("Ein Handy kostet ", Q(c, G), ". Beim Sale spart man ", Q(c, P), ". Wie viel Prozent sind das?") },
    { sg: "€", pl: "€", dat: "€", range: [40, 180], step: 1, money: true, pMax: 50, qw: "Wie viel €",
      sh: (c, G) => rich("von einer Jacke für ", Q(c, G)),
      pwl: (c, G, p) => rich("Eine Jacke kostet ", Q(c, G), ". Im Schlussverkauf gibt es ", pc(p), " Rabatt. Wie viel € spart man?"),
      gw: (c, G, p, P) => rich("Im Schlussverkauf spart Lena ", pc(p), " vom Jackenpreis. Das sind ", Q(c, P), ". Wie viel € kostete die Jacke vorher?"),
      ps: (c, G, p, P) => rich("Eine Jacke kostet ", Q(c, G), ". Im Schlussverkauf spart Lena ", Q(c, P), ". Wie viel Prozent sind das?") },
    { sg: "kg", pl: "kg", dat: "kg", range: [20, 200], step: 1, qw: "Wie viel kg",
      sh: (c, G) => rich("von einem Lager mit ", Q(c, G), " Mehl"),
      pwl: (c, G, p) => rich("Im Lager liegen ", Q(c, G), " Mehl. Davon werden ", pc(p), " verbraucht. Wie viel kg sind das?"),
      gw: (c, G, p, P) => rich("Vom Mehl im Lager werden ", pc(p), " verbraucht. Das sind ", Q(c, P), ". Wie viel kg Mehl lagen vorher im Lager?"),
      ps: (c, G, p, P) => rich("Im Lager liegen ", Q(c, G), " Mehl. Davon werden ", Q(c, P), " verbraucht. Wie viel Prozent sind das?") },
    { sg: "€", pl: "€", dat: "€", range: [10, 60], step: 1, money: true, pMax: 50, qw: "Wie viel €",
      sh: (c, G) => rich("von einem Taschengeld von ", D(c, G)),
      pwl: (c, G, p) => rich("Lena bekommt ", Q(c, G), " Taschengeld im Monat. Davon spart sie ", pc(p), ". Wie viel € spart sie?"),
      gw: (c, G, p, P) => rich("Lena spart ", pc(p), " ihres Taschengeldes. Das sind ", Q(c, P), ". Wie viel € Taschengeld bekommt sie im Monat?"),
      ps: (c, G, p, P) => rich("Lena bekommt ", Q(c, G), " Taschengeld im Monat und spart ", Q(c, P), ". Wie viel Prozent spart sie?") },
    { sg: "€", pl: "€", dat: "€", range: [150, 400], step: 10, money: true, qw: "Wie viel €",
      sh: (c, G) => rich("von einer Klassenfahrt für ", Q(c, G)),
      pwl: (c, G, p) => rich("Die Klassenfahrt kostet ", Q(c, G), ". Max zahlt ", pc(p), " selbst. Wie viel € sind das?"),
      gw: (c, G, p, P) => rich("Max zahlt ", pc(p), " der Kosten für die Klassenfahrt selbst. Das sind ", Q(c, P), ". Wie teuer ist die ganze Klassenfahrt?"),
      ps: (c, G, p, P) => rich("Die Klassenfahrt kostet ", Q(c, G), ". Max zahlt ", Q(c, P), " selbst. Wie viel Prozent der Kosten sind das?") },
    { sg: "€", pl: "€", dat: "€", range: [15, 60], step: 1, money: true, qw: "Wie viel €",
      sh: (c, G) => rich("von einem Handyvertrag für ", Q(c, G), " im Monat"),
      pwl: (c, G, p) => rich("Ein Handyvertrag kostet ", Q(c, G), " im Monat. Die Eltern übernehmen ", pc(p), " davon. Wie viel € übernehmen die Eltern?"),
      gw: (c, G, p, P) => rich("Die Eltern übernehmen ", pc(p), " der Vertragskosten. Das sind ", Q(c, P), " im Monat. Wie viel € kostet der Vertrag im Monat?"),
      ps: (c, G, p, P) => rich("Ein Handyvertrag kostet ", Q(c, G), " im Monat. Die Eltern zahlen ", Q(c, P), " davon. Wie viel Prozent sind das?") },
    { sg: "Minute", pl: "Minuten", dat: "Minuten", range: [30, 120], step: 5, whole: true, qw: "Wie viele Minuten",
      sh: (c, G) => rich("von einem Training mit ", Q(c, G)),
      pwl: (c, G, p) => rich("Das Training dauert ", Q(c, G), ". ", pc(p), " davon sind Dehnübungen. Wie viele Minuten sind das?"),
      gw: (c, G, p, P) => rich("Die Dehnübungen dauern ", pc(p), " des Trainings. Das sind ", Q(c, P), ". Wie lange dauert das Training?"),
      ps: (c, G, p, P) => rich("Das Training dauert ", Q(c, G), ". Die Dehnübungen dauern ", Q(c, P), ". Wie viel Prozent sind das?") },
    // über 100 %: nur für Prozentwert und Grundwert
    { sg: "€", pl: "€", dat: "€", range: [800, 9000], step: 100, money: true, over: true, qw: "Wie viel €",
      sh: (c, G) => rich("von einem Vorjahresumsatz von ", Q(c, G)),
      pwl: (c, G, p) => rich("Im Vorjahr machte ein Laden ", Q(c, G), " Umsatz. Dieses Jahr ist der Umsatz ", pc(p), " des Vorjahres. Wie viel € Umsatz macht der Laden dieses Jahr?"),
      gw: (c, G, p, P) => rich("Dieses Jahr beträgt der Umsatz ", pc(p), " des Vorjahresumsatzes. Das sind ", Q(c, P), ". Wie hoch war der Umsatz im Vorjahr?") },
  ];
  const CTX_ALL = CTX;
  const CTX_PLAIN = CTX.filter(c => !c.over);

  // Fall wählen: Kontext, Prozentsatz p und Ganzes G (realistisch), daraus P = G · p : 100.
  // P muss schön sein: ganzzahlig bei zählbaren Größen und Niveau 1, sonst höchstens 1 (Geld 2) Nachkommastelle.
  function pickCase(rng, level, list) {
    for (let i = 0; i < 1000; i++) {
      const c = rng.pick(list);
      const p = pickPct(rng, level, c.over);
      if (c.pMax && Frac.of(p).cmp(c.pMax) > 0) continue;
      const lo = Math.ceil(c.range[0] / c.step), hi = Math.floor(c.range[1] / c.step);
      const G = new Frac(c.step * rng.int(lo, hi), 1);
      const P = G.mul(p).div(100);
      const lim = level === 1 || c.whole ? 0 : c.money ? 2 : 1;
      if (P.decimals() > lim) continue;
      return { c, p, G, P };
    }
    throw new Error("pickCase: keine passende Aufgabe gefunden");
  }

  // ---------- 1. Prozentwert ----------
  AG.registerType({
    id: "m7-prozentwert",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Prozentwert berechnen",
    instruction: {
      1: "Berechne den Prozentwert P.",
      2: "Berechne den Prozentwert P. Das Ergebnis hat höchstens eine Nachkommastelle, Geldbeträge höchstens zwei.",
      3: "Löse die Sachaufgaben. Berechne jeweils den Prozentwert P.",
    },
    merke: [
      "Prozentwert ", { b: "P" }, " = Grundwert ", { b: "G" }, " · Prozentsatz ", { b: "p" },
      " : 100.   Beispiel: 25 % von 80 € → 80 € · 25 : 100 = 20 €",
    ],
    cols: 2,
    generate(rng, level) {
      const sach = level === 3 || (level === 2 && rng.chance(0.5));
      const { c, p, G, P } = pickCase(rng, level, sach ? CTX_ALL : CTX_PLAIN);
      const q = sach
        ? (level === 2 ? rich(c.qw, " sind ", pc(p), " ", c.sh(c, G), "?") : c.pwl(c, G, p))
        : rich(pc(p), " von ", D(c, G), ".");
      const a = Q(c, P);
      const steps = [
        rich("P = ", v(G), " · ", v(p), " : 100"),
        rich("= ", a),
      ];
      return { q, a, steps, _G: G, _p: p, _P: P };
    },
    verify(t) {
      return ok(t._P.eq(t._G.mul(t._p).div(100)), "P ist nicht G · p : 100");
    },
  });

  // ---------- 2. Grundwert ----------
  AG.registerType({
    id: "m7-grundwert",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Grundwert berechnen",
    instruction: {
      1: "Berechne den Grundwert G.",
      2: "Berechne den Grundwert G. Das Ergebnis ist eine ganze Zahl.",
      3: "Löse die Sachaufgaben. Berechne jeweils den Grundwert G.",
    },
    merke: [
      "Grundwert ", { b: "G" }, " = Prozentwert ", { b: "P" }, " · 100 : Prozentsatz ", { b: "p" },
      ".   Beispiel: 25 % von G sind 20 € → G = 20 € · 100 : 25 = 80 €",
    ],
    cols: 2,
    generate(rng, level) {
      const sach = level === 3 || (level === 2 && rng.chance(0.5));
      const { c, p, G, P } = pickCase(rng, level, sach ? CTX_ALL.filter(x => x.gw) : CTX_PLAIN);
      const q = sach
        ? c.gw(c, G, p, P)
        : rich(pc(p), " von G sind ", Q(c, P), ".");
      const a = Q(c, G);
      const steps = [
        rich("G = P · 100 : p"),
        rich("G = ", Q(c, P), " · 100 : ", v(p), " = ", a),
      ];
      return { q, a, steps, _G: G, _p: p, _P: P };
    },
    verify(t) {
      return ok(t._G.isInt() && t._G.eq(t._P.mul(100).div(t._p)), "G ist nicht P · 100 : p oder nicht glatt");
    },
  });

  // ---------- 3. Prozentsatz ----------
  AG.registerType({
    id: "m7-prozentsatz",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Prozentsatz berechnen",
    instruction: {
      1: "Berechne den Prozentsatz p.",
      2: "Berechne den Prozentsatz p. Das Ergebnis ist eine ganze Zahl.",
      3: "Löse die Sachaufgaben. Berechne den Prozentsatz p auf eine Stelle nach dem Komma.",
    },
    merke: [
      "Prozentsatz ", { b: "p" }, " = Prozentwert ", { b: "P" }, " : Grundwert ", { b: "G" }, " · 100.   Beispiel: 15 von 60 → 15 : 60 · 100 = 25 %",
    ],
    cols: 2,
    generate(rng, level) {
      const sach = level === 3 || (level === 2 && rng.chance(0.5));
      const { c, p, G, P } = pickCase(rng, level, sach ? CTX_PLAIN.filter(x => x.ps) : CTX_PLAIN);
      const q = sach
        ? c.ps(c, G, p, P)
        : rich("Wie viel Prozent sind ", Q(c, P), " von ", D(c, G), "?");
      const a = pc(p);
      const steps = [
        rich("p = P : G · 100"),
        rich("p = ", v(P), " : ", v(G), " · 100 = ", v(P.mul(100)), " : ", v(G)),
        rich("= ", a),
      ];
      return { q, a, steps, _G: G, _p: p, _P: P };
    },
    verify(t) {
      return ok(t._p.eq(t._P.mul(100).div(t._G)) && t._P.decimals() <= 2, "p ist nicht P : G · 100");
    },
  });

  // ---------- 4. Bruch, Dezimalzahl, Prozent ----------
  const HUND_SIMPLE = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [3, 10], [7, 10],
    [1, 20], [9, 20], [3, 25], [7, 50], [1, 10], [9, 10]];

  AG.registerType({
    id: "m7-prozent-umwandeln",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Bruch, Dezimalzahl, Prozent",
    instruction: {
      1: "Schreibe als Prozentsatz.",
      2: "Schreibe als gekürzten Bruch und als Dezimalzahl.",
      3: "Wandle um zwischen Bruch, Dezimalzahl und Prozentsatz.",
    },
    merke: [
      "Ein Prozent ist ein Hundertstel: ", { b: "1 % = 1/100 = 0,01" },
      ".   Beispiel: ", { f: [3, 8] }, " = 0,375 = 37,5 %",
    ],
    cols: 3,
    generate(rng, level) {
      let val, pct, q, a, steps;
      if (level === 1) {
        const m = rng.int(0, 2);
        if (m < 2) {
          // Hundertstelbruch (ungekürzt) oder einfacher Bruch
          let bruch;
          if (m === 0) {
            const n = rng.int(1, 99);
            bruch = { f: [n, 100] };
            val = new Frac(n, 100);
          } else {
            const [n, d] = rng.pick(HUND_SIMPLE);
            bruch = { f: [n, d] };
            val = new Frac(n, d);
          }
          pct = val.mul(100);
          q = rich("Schreibe als Prozentsatz: ", bruch);
          a = rich(bruch, " = ", v(val), " = ", pc(pct));
        } else {
          // Dezimalzahl → Prozent, z. B. 0,35 → 35 %
          val = new Frac(rng.int(1, 99), 100);
          pct = val.mul(100);
          q = rich("Schreibe als Prozentsatz: ", v(val));
          a = rich(num(val), " = ", v(val), " = ", pc(pct));
        }
        steps = [rich(v(val), " · 100 = ", pc(pct))];
      } else if (level === 2) {
        pct = new Frac(rng.int(1, 99), 1);
        val = pct.div(100);
        q = rich("Schreibe als gekürzten Bruch und als Dezimalzahl: ", pc(pct));
        a = rich(num(val), " = ", v(val), " = ", pc(pct));
        steps = [rich(v(pct), "/100 = ", num(val), " = ", v(val))];
      } else if (rng.chance(0.5)) {
        const d = rng.pick([8, 16, 20, 25, 40]);
        val = new Frac(rng.int(1, d - 1), d);
        pct = val.mul(100);
        q = rich("Schreibe als Dezimalzahl und als Prozentsatz: ", num(val));
        a = rich(num(val), " = ", v(val), " = ", pc(pct));
        steps = [rich(v(val), " · 100 = ", pc(pct))];
      } else {
        pct = rng.chance(0.5) ? new Frac(2 * rng.int(1, 39) + 1, 2) : new Frac(rng.int(1, 99), 1);
        val = pct.div(100);
        q = rich("Schreibe als Bruch und als Dezimalzahl: ", pc(pct));
        a = rich(num(val), " = ", v(val), " = ", pc(pct));
        steps = [rich(v(pct), "/100 = ", num(val), " = ", v(val))];
      }
      return { q, a, steps, _val: val, _pct: pct };
    },
    verify(t) {
      return ok(t._val.mul(100).eq(t._pct), "Prozentsatz ist nicht Dezimalzahl · 100");
    },
  });

  // ---------- 5. Mischungsverhältnisse ----------
  // story: Einleitung; art/noun: Artikel und Name; parts: Bestandteile (2 oder 3);
  // range: realistische Gesamtmenge in unit; kstep: Schrittweite der Teilmenge k
  const MIX = [
    { story: "Für das Schulfest mischt die Klasse Saftschorle.", art: "Die", noun: "Saftschorle",
      parts: ["Saft", "Wasser", "Sirup"], unit: "ml", ulong: "Milliliter", vessel: "einen Krug", range: [200, 1500], kstep: 10 },
    { story: "Zum Streichen des Klassenzimmers wird Farbe gemischt.", art: "Die", noun: "Farbe",
      parts: ["Weiß", "Blau", "Grün"], unit: "l", ulong: "Liter", vessel: "einen Eimer", range: [1, 20], kstep: 1 },
    { story: "Für eine Gartenmauer wird Mörtel angerührt.", art: "Der", noun: "Mörtel",
      parts: ["Sand", "Kalk", "Zement"], unit: "kg", ulong: "Kilogramm", vessel: "einen Eimer", range: [5, 60], kstep: 1 },
    { story: "Für die Pfannkuchen beim Sommerfest wird Teig gerührt.", art: "Der", noun: "Teig",
      parts: ["Mehl", "Milch"], unit: "g", ulong: "Gramm", vessel: "eine Schüssel", range: [200, 1000], kstep: 10 },
    { story: "Für den Weihnachtsmarkt wird Fruchtpunsch gekocht.", art: "Der", noun: "Fruchtpunsch",
      parts: ["Fruchtsaft", "Tee"], unit: "l", ulong: "Liter", vessel: "einen Topf", range: [2, 10], kstep: 1 },
    { story: "Für das Bastelprojekt wird Kleister angerührt.", art: "Der", noun: "Kleister",
      parts: ["Mehl", "Wasser"], unit: "g", ulong: "Gramm", vessel: "eine Schale", range: [200, 1000], kstep: 10 },
  ];

  // Teile im Dativ („besteht aus 5 Teilen Saft und 2 Teilen Wasser“)
  function ratioTxt(r, names) {
    const out = [];
    r.forEach((x, i) => {
      if (i > 0) out.push(i === r.length - 1 ? " und " : ", ");
      out.push(String(x) + " Teilen " + names[i]);
    });
    return rich(out);
  }

  AG.registerType({
    id: "m7-mischung",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Mischungsverhältnisse",
    instruction: {
      1: "Löse die Aufgaben zum Mischungsverhältnis.",
      2: "Löse die Aufgaben zum Mischungsverhältnis. Rechne mit den Teilen.",
      3: "Löse die Aufgaben zum Mischungsverhältnis. Die Teile zuerst zusammenzählen.",
    },
    merke: [
      "Die Teile werden zusammengezählt. Der Anteil einer Sorte ist ",
      { b: "Teile dieser Sorte : Teile insgesamt · 100 = Prozent" },
      ".   Beispiel: 3 Teile Saft und 2 Teile Wasser → 3 : 5 · 100 = 60 % Saft",
    ],
    cols: 1,
    generate(rng, level) {
      const ctx = rng.pick(MIX);
      const n = level === 3 && ctx.parts.length === 3 && rng.chance(0.5) ? 3 : 2;
      const names = ctx.parts.slice(0, n);
      const modes = level === 1 ? ["anteil", "menge"] : ["anteil", "menge", "gesamt"];
      const mode = rng.pick(modes);
      const unit = ctx.unit;
      let r, i, S;
      for (let k = 0; k < 500; k++) {
        r = names.map(() => rng.int(2, 5));
        S = r.reduce((x, y) => x + y, 0);
        i = rng.int(0, n - 1);
        if (mode !== "anteil" || new Frac(r[i] * 100, S).isInt()) break;
      }
      // Vielfaches k so, dass die Gesamtmenge S · k im realistischen Bereich liegt
      const pickK = () => {
        const st = ctx.kstep;
        const a = Math.max(1, Math.ceil(ctx.range[0] / (S * st)));
        const b = Math.max(a, Math.floor(ctx.range[1] / (S * st)));
        return st * rng.int(a, b);
      };
      const ratio = ratioTxt(r, names);
      const intro = rich(ctx.story, " ", ctx.art, " ", ctx.noun, " besteht aus ", ratio, ". ");
      let q, a, steps, val, ans;
      if (mode === "anteil") {
        ans = new Frac(r[i] * 100, S);
        val = ans;
        q = rich(intro, "Wie viel Prozent ist ", names[i], "?");
        a = pc(ans);
        steps = [
          rich("Teile insgesamt: ", r.join(" + "), " = ", String(S)),
          rich(String(r[i]), " : ", String(S), " · 100 = ", v(ans), " %"),
        ];
      } else if (mode === "menge") {
        const k = pickK();
        const V = new Frac(S * k, 1);
        val = V;
        ans = new Frac(r[i] * k, 1);
        q = rich(intro, "Wie viel ", unit, " ", names[i], " sind in ", v(V), " ", unit, " ", ctx.noun, "?");
        a = rich(v(ans), " ", unit);
        steps = [
          rich("1 Teil = ", v(V), " : ", String(S), " = ", String(k), " ", unit),
          rich(String(r[i]), " Teile = ", String(r[i]), " · ", String(k), " = ", v(ans), " ", unit),
        ];
      } else {
        const k = pickK();
        const amt = new Frac(r[i] * k, 1);
        val = amt;
        ans = new Frac(S * k, 1);
        q = rich(intro, "Für ", ctx.vessel, " ", ctx.noun, " nimmt Max ", v(amt), " ", unit, " ", names[i],
          ". Wie viel ", ctx.ulong, " ", ctx.noun, " erhält er insgesamt?");
        a = rich(v(ans), " ", unit);
        steps = [
          rich("1 Teil = ", v(amt), " : ", String(r[i]), " = ", String(k), " ", unit),
          rich("Insgesamt: ", String(S), " Teile = ", String(S), " · ", String(k), " = ", v(ans), " ", unit),
        ];
      }
      return { q, a, steps, _r: r, _i: i, _mode: mode, _val: val, _ans: ans };
    },
    verify(t) {
      const S = t._r.reduce((x, y) => x + y, 0);
      const ri = t._r[t._i];
      let e;
      if (t._mode === "anteil") e = new Frac(ri * 100, S);
      else if (t._mode === "menge") e = t._val.mul(ri).div(S);
      else e = t._val.mul(S).div(ri);
      return ok(e.eq(t._ans), "Mischungsergebnis falsch");
    },
  });

  // ---------- 6. Prozentsatz als Faktor ----------
  AG.registerType({
    id: "m7-prozentfaktor",
    klasse: "7",
    zug: "M",
    lb: "1",
    lbTitle: "Prozentrechnung",
    title: "Prozentsatz als Faktor",
    instruction: {
      1: "Schreibe den Prozentsatz als Faktor und berechne damit.",
      2: "Schreibe den Prozentsatz als Faktor und berechne damit.",
      3: "Schreibe den Prozentsatz als Faktor und berechne damit. Achte auf Faktoren über 1.",
    },
    merke: [
      "Ein Prozentsatz wird als Faktor geschrieben, indem man durch 100 teilt: ",
      { b: "p % = p : 100" },
      ".   Beispiel: 35 % = 0,35.  0,35 · 240 kg = 84 kg",
    ],
    cols: 2,
    generate(rng, level) {
      const list = level === 3 && rng.chance(0.3) ? CTX_ALL : CTX_PLAIN;
      const { c, p, G, P } = pickCase(rng, level, list);
      const fac = p.div(100);
      const q = rich("Schreibe ", pc(p), " als Faktor und berechne ", pc(p), " von ", D(c, G), ".");
      const a = rich(v(fac), " · ", Q(c, G), " = ", Q(c, P));
      const steps = [rich(v(p), " % = ", v(p), " : 100 = ", v(fac))];
      return { q, a, steps, _G: G, _p: p, _P: P, _fac: fac };
    },
    verify(t) {
      return ok(t._fac.eq(t._p.div(100)) && t._P.eq(t._G.mul(t._fac)), "Faktor oder Ergebnis falsch");
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
