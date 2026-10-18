// M6 LB 1.1 (Erweiterung auf Bruchzahlen): Bruchteile an Figuren und am Zahlenstrahl, Erweitern und
// Kürzen, Vergleichen und Ordnen, gemischte Zahlen und unechte Brüche, Bruchteile von Größen.
// Mit Skizzen (AG.sketch) für die Bruchteile an Figuren und am Zahlenstrahl.
(function (AG) {
  const { Frac, num, rich, fmtInt, plain, gcd, lcm } = AG;
  const KL = "6", ZUG = "RM", LB = "1.1", LBT = "Erweiterung auf Bruchzahlen", TOPIC = "brueche";
  const SH = "#9aa3b8";   // gefärbte Teile (Farbe aus der Diagrammpalette)

  // ---------- Hilfen ----------
  const R = (...parts) => rich(...parts.map(p => (typeof p === "number" ? String(p) : p)));
  const fmt = n => fmtInt(n);
  const bruch = (z, n) => ({ f: [z, n] });                 // Bruch-Segment (waagerechter Bruchstrich)
  const coprime = (a, b) => gcd(a, b) === 1;
  const r2 = v => Math.round(v * 100) / 100;
  const lcmOf = list => list.reduce((acc, d) => lcm(acc, d), 1);
  // Rich-Teile mit einem Trennzeichen verbinden
  const joinR = (items, sep) => rich(...items.flatMap((x, i) => (i ? [sep, x] : [x])));
  // Aufzählung: „a, b und c“
  const listR = items => rich(...items.flatMap((x, i) => (i === 0 ? [x] : [i === items.length - 1 ? " und " : ", ", x])));
  // Zähler z mit 1 ≤ z < d, teilerfremd zu d (der Bruch ist dann schon gekürzt)
  const zsFor = d => [...Array(d).keys()].slice(1).filter(z => coprime(z, d));
  // Bruch aus Zähler und Nenner, ungekürzt angezeigt
  const raw = (z, d) => ({ seg: [bruch(z, d)], val: new Frac(z, d), n: z, d, kind: "echt" });
  // Zufälliger Wert für Niveau 3: echter Bruch, gemischte Zahl oder unechter Bruch
  const randVal3 = rng => { const d = rng.int(2, 8); return new Frac(rng.int(0, 3) * d + rng.pick(zsFor(d)), d); };
  function val3(v, rng) {
    if (v.n < v.d) return { seg: [bruch(v.n, v.d)], val: v, n: v.n, d: v.d, kind: "echt" };
    const mixed = rng.chance(0.5);
    return { seg: mixed ? num(v) : num(v, { as: "improper" }), val: v, n: v.n, d: v.d, kind: mixed ? "gemischt" : "unecht" };
  }

  // ---------- Skizzen ----------
  // Rechteck mit n gleich breiten Streifen, die ersten k gefärbt
  function stripFig(n, k) {
    const s = AG.sketch(70, 30);
    const x0 = 5, y0 = 4, w = 60, h = 22, cw = w / n;
    for (let i = 0; i < n; i++) s.rect(x0 + i * cw, y0, cw, h, { fill: i < k ? SH : "none" });
    return s.done();
  }
  // Gitter r × c, die ersten k Felder (zeilenweise) gefärbt
  function gridFig(r, c, k) {
    const s = AG.sketch(70, 40);
    const x0 = 5, y0 = 4, w = 60, h = 32, cw = w / c, ch = h / r;
    for (let i = 0; i < r * c; i++) {
      s.rect(x0 + (i % c) * cw, y0 + Math.floor(i / c) * ch, cw, ch, { fill: i < k ? SH : "none" });
    }
    return s.done();
  }
  // Kreis in n gleich große Sektoren, die ersten k ab oben im Uhrzeigersinn gefärbt
  function circleFig(n, k) {
    const s = AG.sketch(70, 40);
    const cx = 35, cy = 20, R0 = 17, th = 2 * Math.PI / n;
    const P = a => [cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)];
    for (let i = 0; i < k; i++) {
      const a1 = -Math.PI / 2 + i * th, p1 = P(a1), p2 = P(a1 + th);
      const d = `M${cx},${cy} L${r2(p1[0])},${r2(p1[1])} A${R0},${R0} 0 ${th > Math.PI ? 1 : 0} 1 ${r2(p2[0])},${r2(p2[1])} Z`;
      s.path(d, { fill: SH });
    }
    s.circle([cx, cy], R0);
    for (let i = 0; i < n; i++) s.line([cx, cy], P(-Math.PI / 2 + i * th));
    return s.done();
  }
  // Zahlenstrahl von 0 bis maxV, jede Einheit in n Teile; Punkt A bei k Teilen. Nur die ganzen Zahlen sind beschriftet.
  function lineFig(n, maxV, k) {
    const s = AG.sketch(70, 30);
    const x0 = 8, x1 = 62, y = 16, N = n * maxV;
    const X = j => x0 + ((x1 - x0) * j) / N;
    s.line([x0 - 3, y], [x1 + 3, y]);
    // ganze Zahlen mit längerem Strich und beschriftet
    for (let j = 0; j <= N; j++) { const g = j % n === 0; s.line([X(j), y - (g ? 3 : 1.8)], [X(j), y + (g ? 3 : 1.8)], g ? { width: 0.5 } : {}); }
    for (let v = 1; v < maxV; v++) s.label([X(v * n), y + 6.5], String(v));
    s.label([X(0), y + 6.5], "0");
    s.label([X(N), y + 6.5], String(maxV));
    s.line([X(k), y - 5.5], [X(k), y - 1.6]);
    s.circle([X(k), y], 0.9, { fill: AG.SKETCH_COLORS.INK });
    s.label([X(k), y - 8], "A", { bold: true });
    return s.done();
  }

  // ==================== Aufgabentypen ====================

  // ---------- 1. Bruchteil an Figur oder Zahlenstrahl ----------
  AG.registerType({
    id: "m6-bruchteil-figur",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Bruchteile an Figuren und am Zahlenstrahl",
    instruction: {
      1: "Gib den Bruchteil an, der gefärbt ist bzw. zu Punkt A gehört.",
      2: "Gib den gefärbten Bruchteil als gekürzten Bruch an.",
      3: "Gib den Bruch an. Der Zahlenstrahl geht bis 2, der Bruch kann also größer als 1 sein.",
    },
    merke: [
      "Der Nenner zählt alle gleich großen Teile, der Zähler die gefärbten Teile. Beispiel: 3 von 4 Teilen sind gefärbt, also ",
      bruch(3, 4), ". Auf dem Zahlenstrahl ist jeder Teil ein Bruchteil der Einheit.",
    ],
    cols: 2,
    generate(rng, level) {
      const phrase = rng.pick(["Welcher Bruchteil ist gefärbt?", "Welcher Bruchteil der Figur ist gefärbt?", "Wie viel ist gefärbt? Schreibe als Bruch."]);
      let kind;
      if (level === 1) kind = rng.pick(["strip", "circle", "line"]);
      else if (level === 2) kind = "grid";
      else kind = rng.pick(["grid", "line2"]);

      if (kind === "grid") {
        let r, c, n, k;
        for (let i = 0; ; i++) {
          if (i > 300) throw new Error("m6-bruchteil-figur: kein Gitter gefunden");
          r = rng.pick([2, 3, 4, 6]); c = rng.pick([2, 3, 4, 6]);
          n = r * c; k = rng.int(1, n - 1);
          if (gcd(k, n) > 1) break;          // Niveau 2/3: der Bruch muss gekürzt werden
        }
        const g = gcd(k, n), x = new Frac(k, n);
        const ctx = rng.pick([`Eine Schokoladentafel ist in ${n} gleich große Stücke geteilt.`, `Ein Gitter ist in ${n} gleich große Felder geteilt.`, `Ein Blatt Papier ist in ${n} gleich große Kästchen geteilt.`]);
        const ask = rng.pick(["Welcher Bruchteil ist gefärbt?", "Welcher Bruchteil der Figur ist gefärbt?", "Wie viel ist gefärbt?"]);
        return {
          q: R(ctx, " ", ask, " Gib den Bruch gekürzt an."),
          a: R(num(x)),
          steps: [R(k, " von ", n, " Feldern sind gefärbt: ", bruch(k, n)), R("Zähler und Nenner durch ", g, " teilen: ", bruch(k / g, n / g))],
          fig: gridFig(r, c, k), inline: false, meta: { x },
        };
      }

      if (kind === "line" || kind === "line2") {
        const maxV = kind === "line" ? 1 : 2;
        let n, k;
        for (let i = 0; ; i++) {
          if (i > 300) throw new Error("m6-bruchteil-figur: keine Zahlenstrahl-Lage gefunden");
          n = maxV === 1 ? rng.pick([2, 3, 4, 5, 6, 8, 10]) : rng.pick([2, 3, 4, 6]);
          k = maxV === 1 ? rng.int(1, n - 1) : rng.int(n + 1, 2 * n - 1);   // bei 0–2 liegt A über 1
          if (maxV === 2 || coprime(k, n)) break;
        }
        const x = new Frac(k, n), g = gcd(k, n);
        const steps = [R("Ein Teil ist ", bruch(1, n), "."), R("Punkt A liegt nach ", k, " Teilen: ", k, " · ", bruch(1, n), " = ", bruch(k, n))];
        if (g > 1) steps.push(R("= ", bruch(k / g, n / g)));
        if (x.n > x.d) steps.push(R("= ", num(x)));
        const q = R(`Der Zahlenstrahl geht von 0 bis ${maxV}. Jede Einheit ist in ${n} gleich lange Teile geteilt. Welcher Bruch gehört zum Punkt A?`,
          maxV === 2 ? " Gib ihn als gemischte Zahl und als unechten Bruch an." : "");
        const a = x.n > x.d ? R(num(x), " = ", num(x, { as: "improper" })) : R(num(x));
        return { q, a, steps, fig: lineFig(n, maxV, k), inline: false, meta: { x } };
      }

      // Streifen oder Kreis (Niveau 1), Bruch schon gekürzt
      const isCircle = kind === "circle";
      let n, k;
      for (let i = 0; ; i++) {
        if (i > 300) throw new Error("m6-bruchteil-figur: keine Lage gefunden");
        n = isCircle ? rng.pick([3, 4, 5, 6, 8]) : rng.pick([2, 3, 4, 5, 6, 8, 10]);
        k = rng.int(1, n - 1);
        if (coprime(k, n)) break;
      }
      const x = new Frac(k, n);
      const ctx = isCircle ? `Ein Kreis ist in ${n} gleich große Stücke geteilt.` : `Ein Rechteck ist in ${n} gleich große Teile geteilt.`;
      return {
        q: R(ctx, " ", phrase),
        a: R(num(x)),
        steps: [R(k, " von ", n, " Teilen sind gefärbt."), R("Gefärbt ist ", bruch(k, n), ".")],
        fig: isCircle ? circleFig(n, k) : stripFig(n, k), inline: false, meta: { x },
      };
    },
    verify(task) {
      const m = task.meta;
      if (!m || !m.x) return "meta fehlt";
      return plain(task.a).startsWith(plain(num(m.x))) ? true : "Lösung falsch";
    },
  });

  // ---------- 2. Erweitern und Kürzen ----------
  AG.registerType({
    id: "m6-erweitern-kuerzen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Brüche erweitern und kürzen",
    instruction: {
      1: "Erweitere bzw. kürze den Bruch mit der angegebenen Zahl.",
      2: "Kürze vollständig bzw. erweitere auf den angegebenen Nenner.",
      3: "Mache die Brüche gleichnamig. Bestimme zuerst den Hauptnenner.",
    },
    merke: [
      "Erweitern und Kürzen ändert den Wert eines Bruchs nicht. Zähler und Nenner werden mit derselben Zahl malgenommen bzw. durch dieselbe Zahl geteilt. Beispiel: ",
      bruch(3, 4), " = ", bruch(6, 8), " (mit 2 erweitert), ", bruch(6, 8), " = ", bruch(3, 4), " (durch 2 gekürzt).",
    ],
    cols: 3,
    generate(rng, level) {
      if (level === 1) {
        let a, b, m;
        for (let i = 0; ; i++) {
          if (i > 200) throw new Error("m6-erweitern-kuerzen: keine Zahlen gefunden");
          b = rng.int(2, 10); a = rng.int(1, b - 1); m = rng.pick([2, 3, 4, 5]);
          if (coprime(a, b) && b * m <= 50) break;
        }
        if (rng.chance(0.5)) {
          return {
            q: R("Erweitere ", bruch(a, b), " mit ", m, "."),
            a: R(bruch(a * m, b * m)),
            steps: [R("Zähler: ", a, " · ", m, " = ", a * m), R("Nenner: ", b, " · ", m, " = ", b * m), R("= ", bruch(a * m, b * m))],
            inline: false,
          };
        }
        return {
          q: R("Kürze ", bruch(a * m, b * m), " mit ", m, "."),
          a: R(bruch(a, b)),
          steps: [R("Zähler: ", a * m, " : ", m, " = ", a), R("Nenner: ", b * m, " : ", m, " = ", b), R("= ", bruch(a, b))],
          inline: false,
        };
      }

      if (level === 2 && rng.chance(0.5)) {          // vollständig kürzen
        let a, b, g;
        for (let i = 0; ; i++) {
          if (i > 200) throw new Error("m6-erweitern-kuerzen: keine Zahlen gefunden");
          b = rng.int(3, 12); a = rng.int(1, b - 1); g = rng.pick([2, 3, 4, 5, 6]);
          if (coprime(a, b) && b * g <= 60) break;
        }
        return {
          q: R("Kürze ", bruch(a * g, b * g), " vollständig."),
          a: R(bruch(a, b)),
          steps: [R("Größter gemeinsamer Teiler von ", a * g, " und ", b * g, ": ", g),
            R("Zähler: ", a * g, " : ", g, " = ", a, ",   Nenner: ", b * g, " : ", g, " = ", b),
            R("= ", bruch(a, b))],
          inline: false,
        };
      }

      if (level === 2) {                             // auf gegebenen Nenner erweitern
        let a, b, m;
        for (let i = 0; ; i++) {
          if (i > 200) throw new Error("m6-erweitern-kuerzen: keine Zahlen gefunden");
          b = rng.pick([2, 3, 4, 5, 6, 8]); a = rng.int(1, b - 1); m = rng.pick([2, 3, 4, 5, 6]);
          if (coprime(a, b) && b * m <= 48) break;
        }
        const N = b * m;
        return {
          q: R("Erweitere auf den Nenner ", N, ".  ", bruch(a, b), " = ", { blank: 2 }, " / ", N),
          a: R(bruch(a, b), " = ", bruch(a * m, N)),
          steps: [R("Nenner: ", b, " · ", m, " = ", N, ", also mit ", m, " erweitern."),
            R("Zähler: ", a, " · ", m, " = ", a * m),
            R(bruch(a, b), " = ", bruch(a * m, N))],
          inline: false,
        };
      }

      // Niveau 3: Hauptnenner bei zwei oder drei Brüchen
      const DEN = [2, 3, 4, 5, 6, 8, 9, 10, 12];
      let ds, L;
      for (let i = 0; ; i++) {
        if (i > 300) throw new Error("m6-erweitern-kuerzen: kein Hauptnenner gefunden");
        ds = rng.shuffle(DEN).slice(0, rng.pick([2, 3]));
        L = lcmOf(ds);
        if (L <= 60 && ds.every(d => d < L)) break;
      }
      const zs = ds.map(d => rng.pick(zsFor(d)));
      const nums = zs.map((z, i) => bruch(z, ds[i]));
      const ext = zs.map((z, i) => bruch(z * (L / ds[i]), L));
      return {
        q: R("Mache die Brüche gleichnamig: ", listR(nums), "."),
        a: R("Hauptnenner ", L, ": ", listR(ext)),
        steps: [
          R("Hauptnenner: kleinstes gemeinsames Vielfaches von ", listR(ds.map(String)), " ist ", L, "."),
          ...ds.map((d, i) => R(bruch(zs[i], d), " = ", bruch(zs[i] * (L / d), L), "   (mit ", L / d, " erweitert)")),
          R("Gleichnamig: ", listR(ext)),
        ],
        inline: false,
      };
    },
  });

  // ---------- 3. Brüche vergleichen und ordnen ----------
  function vergleich(rng, level) {
    let X, Y;
    for (let i = 0; ; i++) {
      if (i > 300) throw new Error("m6-brueche-vergleichen: kein Paar gefunden");
      if (level === 1) {
        if (rng.chance(0.5)) {                       // gleicher Nenner
          const d = rng.int(3, 12), zs = zsFor(d);
          if (zs.length < 2) continue;
          [X, Y] = rng.shuffle(zs).slice(0, 2).map(z => raw(z, d));
        } else {                                     // gleicher Zähler
          const z = rng.int(2, 5), ds = [];
          for (let d = z + 1; d <= 12; d++) if (coprime(z, d)) ds.push(d);
          if (ds.length < 2) continue;
          [X, Y] = rng.shuffle(ds).slice(0, 2).map(d => raw(z, d));
        }
      } else if (level === 2) {
        if (rng.chance(0.2)) {                       // gleicher Wert, andere Schreibweise
          const d = rng.int(2, 6), z = rng.pick(zsFor(d));
          X = raw(z, d); Y = raw(z * 2, d * 2);
        } else {
          const d1 = rng.int(2, 12), d2 = rng.int(2, 12);
          if (d1 === d2) continue;
          X = raw(rng.pick(zsFor(d1)), d1); Y = raw(rng.pick(zsFor(d2)), d2);
        }
      } else {
        X = val3(randVal3(rng), rng);
        Y = val3(rng.chance(0.2) ? X.val : randVal3(rng), rng);
      }
      const c = X.val.cmp(Y.val);
      if (level === 1 && c === 0) continue;
      break;
    }
    const c = X.val.cmp(Y.val);
    const sign = c < 0 ? "<" : c > 0 ? ">" : "=";
    const steps = [];
    if (level === 1) {
      steps.push(X.d === Y.d
        ? R("Gleicher Nenner ", X.d, ": Vergleiche die Zähler ", X.n, " und ", Y.n, ".")
        : R("Gleicher Zähler ", X.n, ": Je größer der Nenner, desto kleiner der Bruch."));
    } else {
      for (const it of [X, Y]) if (it.kind === "gemischt") steps.push(R(it.seg, " = ", num(it.val, { as: "improper" })));
      const L = lcm(X.d, Y.d);
      steps.push(R("Gleichnamig machen mit dem Nenner ", L, ": ", bruch(X.n * (L / X.d), L), " und ", bruch(Y.n * (L / Y.d), L)));
    }
    steps.push(R(X.seg, " ", sign, " ", Y.seg));
    return {
      q: R("Setze das Zeichen <, > oder = ein: ", X.seg, "  ", { blank: 2 }, "  ", Y.seg),
      a: R(X.seg, " ", sign, " ", Y.seg),
      steps, inline: false,
    };
  }

  function ordnen(rng, level) {
    const cnt = rng.pick([3, 4]);
    let items;
    for (let i = 0; ; i++) {
      if (i > 300) throw new Error("m6-brueche-vergleichen: keine Zahlenmenge gefunden");
      if (level === 1) {                              // gleicher Nenner
        const d = rng.int(4, 12), zs = zsFor(d);
        if (zs.length < cnt) continue;
        items = rng.shuffle(zs).slice(0, cnt).map(z => raw(z, d));
      } else if (level === 2) {                       // ungleichnamige echte Brüche
        items = Array.from({ length: cnt }, () => { const d = rng.int(2, 12); return raw(rng.pick(zsFor(d)), d); });
        if (new Set(items.map(it => it.d)).size < 2) continue;
        if (lcmOf(items.map(it => it.d)) > 60) continue;
      } else {                                        // echte, gemischte und unechte Brüche gemischt
        items = Array.from({ length: cnt }, () => val3(randVal3(rng), rng));
      }
      if (new Set(items.map(it => it.val.toString())).size !== cnt) continue;
      break;
    }
    const asc = rng.chance(0.5);
    const sorted = [...items].sort((p, q) => p.val.cmp(q.val));
    const ordered = asc ? sorted : sorted.slice().reverse();
    const sign = asc ? " < " : " > ";
    const steps = [];
    if (level === 1) {
      steps.push(R("Gleicher Nenner ", items[0].d, ": Vergleiche die Zähler ", sorted.map(it => String(it.n)).join(" < "), "."));
    } else {
      for (const it of items) if (it.kind === "gemischt") steps.push(R(it.seg, " = ", num(it.val, { as: "improper" })));
      const L = lcmOf(items.map(it => it.d));
      steps.push(R("Gleichnamig machen mit dem Nenner ", L, ": ", joinR(items.map(it => bruch(it.n * (L / it.d), L)), ", ")));
    }
    steps.push(R(joinR(ordered.map(it => it.seg), sign)));
    return {
      q: R("Ordne die Zahlen der Größe nach. Beginne mit der ", asc ? "kleinsten" : "größten", " Zahl: ", joinR(items.map(it => it.seg), ", ")),
      a: R(joinR(ordered.map(it => it.seg), sign)),
      steps, inline: false,
    };
  }

  AG.registerType({
    id: "m6-brueche-vergleichen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Brüche vergleichen und ordnen",
    instruction: {
      1: "Setze das Zeichen <, > oder = ein bzw. ordne die Brüche. Die Brüche haben den gleichen Nenner.",
      2: "Setze das Zeichen <, > oder = ein bzw. ordne die Brüche. Mache die Brüche zuerst gleichnamig.",
      3: "Vergleiche und ordne. Wandle gemischte Zahlen und unechte Brüche zuerst um.",
    },
    merke: [
      "Haben Brüche den gleichen Nenner, ist der Bruch mit dem größeren Zähler größer. Sonst macht man die Brüche gleichnamig. Beispiel: 2/3 und 3/4 haben den Hauptnenner 12, also ",
      bruch(8, 12), " < ", bruch(9, 12), ", somit ", bruch(2, 3), " < ", bruch(3, 4), ".",
    ],
    cols: 2,
    generate(rng, level) {
      return rng.chance(0.4) ? vergleich(rng, level) : ordnen(rng, level);
    },
  });

  // ---------- 4. Gemischte Zahl und unechter Bruch ----------
  AG.registerType({
    id: "m6-gemischte-zahl",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Gemischte Zahlen und unechte Brüche",
    instruction: {
      1: "Wandle die Zahl um. Ganze Zahl und Bruch zusammen ergeben den unechten Bruch.",
      2: "Wandle die Zahl um: gemischte Zahl in unechten Bruch oder umgekehrt.",
      3: "Wandle die Zahl um. Achte auf den Rest bei der Division.",
    },
    merke: [
      "Aus einer gemischten Zahl wird ein unechter Bruch: Ganze mal Nenner plus Zähler ergibt den neuen Zähler, der Nenner bleibt. Beispiel: 2 · 3 + 1 = 7, also ",
      { f: [1, 3], w: 2 }, " = ", bruch(7, 3), ". Umgekehrt: Der Zähler wird durch den Nenner geteilt, der Rest ist der neue Zähler.",
    ],
    cols: 3,
    generate(rng, level) {
      const cfg = { 1: [1, 3, 2, 6], 2: [2, 5, 2, 8], 3: [3, 12, 3, 12] }[level];
      const w = rng.int(cfg[0], cfg[1]), d = rng.int(cfg[2], cfg[3]), r = rng.pick(zsFor(d));
      const x = new Frac(w * d + r, d);
      if (rng.chance(0.5)) {                          // gemischte Zahl → unechter Bruch
        return {
          q: R("Schreibe als unechten Bruch: ", num(x)),
          a: R(num(x, { as: "improper" })),
          steps: [R(w, " · ", d, " + ", r, " = ", w * d + r), R("Nenner bleibt ", d, ":  ", num(x, { as: "improper" }))],
          inline: false,
        };
      }
      return {                                        // unechter Bruch → gemischte Zahl
        q: R("Schreibe als gemischte Zahl: ", num(x, { as: "improper" })),
        a: R(num(x)),
        steps: [R(w * d + r, " : ", d, " = ", w, " Rest ", r), R("Ganze Zahl ", w, ", Rest ", r, ", Nenner ", d, ":  ", num(x))],
        inline: false,
      };
    },
  });

  // ---------- 5. Bruchteil von Größen ----------
  const UNITS = [
    { big: "kg", small: "g", f: 1000, bigs: [1, 2, 3, 4, 5, 6] },
    { big: "km", small: "m", f: 1000, bigs: [1, 2, 3, 4, 5, 6] },
    { big: "m", small: "cm", f: 100, bigs: [1, 2, 3, 4, 5, 6, 8, 10] },
    { big: "h", small: "min", f: 60, bigs: [1, 2, 3, 4, 5, 6] },
    { big: "€", small: "€", f: 1, bigs: [10, 12, 15, 20, 24, 30, 36, 40, 50, 60] },
  ];
  // Niveau 3: Ganzes = q · k, ein Teil = k; k in glatten Schritten
  const BACK = [
    { unit: "€", kMin: 2, kMax: 20, kStep: 1 },
    { unit: "min", kMin: 5, kMax: 60, kStep: 5 },
    { unit: "cm", kMin: 10, kMax: 80, kStep: 10 },
    { unit: "g", kMin: 50, kMax: 200, kStep: 50 },
  ];
  AG.registerType({
    id: "m6-bruchteil-groessen",
    klasse: KL, zug: ZUG, lb: LB, lbTitle: LBT, topic: TOPIC,
    title: "Bruchteile von Größen",
    instruction: {
      1: "Berechne den Bruchteil. Rechne zuerst in die kleinere Einheit um.",
      2: "Berechne den Bruchteil. Achte auf die Einheiten.",
      3: "Berechne das Ganze. Überlege zuerst, wie groß ein Teil ist.",
    },
    merke: [
      "Einen Bruchteil berechnet man in drei Schritten: in die kleinere Einheit umrechnen, durch den Nenner teilen, mit dem Zähler malnehmen. Beispiel: ",
      bruch(3, 4), " von 2 kg: 2 kg = 2000 g, 2000 g : 4 = 500 g, 3 · 500 g = 1500 g.",
    ],
    cols: 3,
    generate(rng, level) {
      if (level < 3) {
        const qs = level === 1 ? [2, 4, 5] : [3, 4, 5, 6, 8, 10];
        let u, q, p, G;
        for (let i = 0; ; i++) {
          if (i > 300) throw new Error("m6-bruchteil-groessen: keine Werte gefunden");
          u = rng.pick(UNITS); q = rng.pick(qs); p = rng.int(1, q - 1); G = rng.pick(u.bigs);
          if (coprime(p, q) && (G * u.f) % q === 0) break;
        }
        const Gs = G * u.f, X = Gs / q, Rs = p * X;
        const steps = [];
        if (u.f !== 1) steps.push(R(G, " ", u.big, " = ", fmt(Gs), " ", u.small));
        steps.push(R("Ein Teil (1/", q, ") von ", fmt(Gs), " ", u.small, ": ", fmt(Gs), " : ", q, " = ", fmt(X), " ", u.small));
        steps.push(R(bruch(p, q), " von ", fmt(Gs), " ", u.small, ": ", p, " · ", fmt(X), " = ", fmt(Rs), " ", u.small));
        return {
          q: R("Wie viel sind ", bruch(p, q), " von ", G, " ", u.big, "?", u.f !== 1 ? " Gib das Ergebnis in " + u.small + " an." : ""),
          a: R(fmt(Rs), " ", u.small),
          steps, inline: false,
        };
      }
      // Niveau 3: vom Teil auf das Ganze schließen
      const bk = rng.pick(BACK);
      let q, p, k;
      for (let i = 0; ; i++) {
        if (i > 300) throw new Error("m6-bruchteil-groessen: keine Werte gefunden");
        q = rng.pick([2, 3, 4, 5, 6, 8, 10]); p = rng.int(1, q - 1);
        k = bk.kStep * rng.int(bk.kMin / bk.kStep, bk.kMax / bk.kStep);
        if (coprime(p, q)) break;
      }
      const P = p * k, G = q * k;
      return {
        q: R(bruch(p, q), " sind ", fmt(P), " ", bk.unit, ". ", rng.pick(["Wie viel ist das Ganze?", "Wie viel beträgt das Ganze?"])),
        a: R(fmt(G), " ", bk.unit),
        steps: [
          R(fmt(P), " ", bk.unit, " : ", p, " = ", fmt(k), " ", bk.unit, "   (ein Teil ist 1/", q, " des Ganzen)"),
          R("Das Ganze hat ", q, " Teile: ", q, " · ", fmt(k), " = ", fmt(G), " ", bk.unit),
        ],
        inline: false,
      };
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
