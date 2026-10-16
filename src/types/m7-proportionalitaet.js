// M7 LB 8: Proportionalität – Dreisatz, Wertetabellen ergänzen, proportional oder nicht?
(function (AG) {
  const { Frac, num, rich, plain, gcd } = AG;

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  // {platzhalter} im Text ersetzen
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
  // Größe mit Einheit als Rich: Euro mit zwei Stellen, sonst so viele Stellen wie nötig
  const amt = (x, c) => rich(num(x, c.u === "€" ? { as: "dec", digits: 2 } : { as: "dec" }), " ", c.u);
  const amtS = (x, c) => plain(amt(x, c));
  // Zahl als Rich ohne Einheit (Euro mit zwei Stellen)
  const numE = (x, money) => num(x, money ? { as: "dec", digits: 2 } : { as: "dec" });

  // ---------- 1. Dreisatz ----------
  const CTX_DREISATZ = [
    { u: "€", one: "1 Heft", many: "Hefte", pre: "{n} Hefte kosten {t}.", ask: "Wie viel kosten {m} Hefte?", rev: "Wie viele Hefte bekommt man für {b}?" },
    { u: "€", one: "1 Breze", many: "Brezen", pre: "{n} Brezen kosten {t}.", ask: "Wie viel kosten {m} Brezen?", rev: "Wie viele Brezen bekommt man für {b}?" },
    { u: "€", one: "1 Eintrittskarte", many: "Eintrittskarten", pre: "{n} Eintrittskarten fürs Schwimmbad kosten {t}.", ask: "Wie viel kosten {m} Eintrittskarten?", rev: "Wie viele Eintrittskarten bekommt man für {b}?" },
    { u: "€", one: "1 Kugel Eis", many: "Kugeln Eis", pre: "{n} Kugeln Eis kosten {t}.", ask: "Wie viel kosten {m} Kugeln Eis?", rev: "Wie viele Kugeln Eis bekommt man für {b}?" },
    { u: "€", one: "1 Liter Benzin", many: "Liter Benzin", pre: "{n} Liter Benzin kosten {t}.", ask: "Wie viel kosten {m} Liter Benzin?", rev: "Wie viele Liter Benzin bekommt man für {b}?" },
    { u: "€", one: "1 kg Äpfel", many: "kg Äpfel", pre: "{n} kg Äpfel kosten {t}.", ask: "Wie viel kosten {m} kg Äpfel?", rev: "Wie viele kg Äpfel bekommt man für {b}?" },
    { u: "€", one: "1 Stunde", many: "Stunden", pre: "Max gibt Nachhilfe. Für {n} Stunden bekommt er {t}.", ask: "Wie viel bekommt er für {m} Stunden?", rev: "Wie viele Stunden muss er arbeiten, um {b} zu verdienen?" },
    { u: "€", one: "1 Stunde", many: "Stunden", pre: "Lena trägt Zeitungen aus. In {n} Stunden verdient sie {t}.", ask: "Wie viel verdient sie in {m} Stunden?", rev: "Wie viele Stunden muss sie arbeiten, um {b} zu verdienen?" },
    { u: "km", one: "1 Stunde", many: "Stunden", pre: "Ein Zug legt in {n} Stunden {t} zurück.", ask: "Welche Strecke legt er in {m} Stunden zurück?", rev: "Wie lange braucht er für {b}?" },
    { u: "km", one: "1 Stunde", many: "Stunden", pre: "Ein Wanderer geht in {n} Stunden {t} weit.", ask: "Wie weit geht er in {m} Stunden?", rev: "Wie lange braucht er für {b}?" },
    { u: "km", one: "1 Liter", many: "Liter", pre: "Mit {n} Litern Benzin fährt ein Auto {t} weit.", ask: "Wie weit kommt es mit {m} Litern Benzin?", rev: "Wie viele Liter Benzin braucht es für {b}?" },
  ];

  AG.registerType({
    id: "m7-dreisatz",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Dreisatz",
    instruction: {
      1: "Löse die Sachaufgaben mit dem Dreisatz. Schließe zuerst auf die Einheit.",
      2: "Löse die Sachaufgaben mit dem Dreisatz. Das Ergebnis kann ein Komma haben.",
      3: "Löse die Sachaufgaben mit dem Dreisatz. Suche zuerst einen gemeinsamen Teiler und beantworte beide Fragen (a und b).",
    },
    merke: [
      "Bei proportionalen Größen gilt: Je mehr, desto mehr. Mit dem ", { b: "Dreisatz" }, " schließt man zuerst auf ", { b: "1" }, ": ",
      "5 Hefte → 4,50 €, 1 Heft → 0,90 €, 8 Hefte → 7,20 €.",
    ],
    cols: 1,
    generate(rng, level) {
      const c = rng.pick(CTX_DREISATZ);
      const money = c.u === "€";

      if (level < 3) {
        let n, m, u;
        for (let i = 0; i < 200; i++) {
          if (level === 1) {
            n = rng.pick([2, 3, 4, 5, 6, 8, 10]);
            m = rng.intExcept(2, 12, [n]);
            u = money ? new Frac(10 * rng.int(1, 25), 100) : new Frac(5 * rng.int(1, 10));
          } else {
            n = rng.int(3, 15);
            m = rng.intExcept(4, 30, [n]);
            u = money ? new Frac(rng.int(5, 399), 100) : new Frac(rng.int(11, 199), 10);
            if (u.mul(m).isInt()) continue; // Ergebnis soll ein Komma haben
          }
          break;
        }
        const total = u.mul(n);
        const res = u.mul(m);
        return {
          q: rich(fill(c.pre, { n, t: amtS(total, c) }), " ", fill(c.ask, { m })),
          a: amt(res, c),
          steps: [
            rich(`${n} ${c.many} → `, amt(total, c)),
            rich(`${c.one} → `, amt(u, c)),
            rich(`${m} ${c.many} → `, amt(res, c)),
          ],
          check: { c, n, m, total },
        };
      }

      // Niveau 3: Schluss über einen gemeinsamen Teiler g, zwei Fragen (a, b)
      let g, m1, m2;
      do {
        g = rng.pick([2, 3, 4, 5, 6]);
        m1 = rng.int(2, 6);
        m2 = rng.int(2, 8);
      } while (m1 === m2 || gcd(m1, m2) !== 1);
      const P = money ? new Frac(rng.int(30, 1200), 100) : new Frac(rng.int(20, 300), 10); // Preis für g Einheiten
      const j = rng.int(2, 6);
      const B = P.mul(j); // Budget
      const cnt = j * g; // dafür bekommt man cnt Einheiten
      const q1 = g * m1, q2 = g * m2;
      const tot1 = P.mul(m1);
      const res2 = P.mul(m2);
      return {
        q: rich(fill(c.pre, { n: q1, t: amtS(tot1, c) }), " a) ", fill(c.ask, { m: q2 }), " b) ", fill(c.rev, { b: amtS(B, c) })),
        a: rich("a) ", amt(res2, c), `; b) ${cnt} ${c.many}`),
        steps: [
          rich(`${q1} ${c.many} → `, amt(tot1, c)),
          rich(`${g} ${c.many} → `, amt(P, c), `   (÷ ${m1})`),
          rich(`${q2} ${c.many} → `, amt(res2, c), `   (· ${m2})`),
          rich(amt(B, c), " : ", amt(P, c), ` = ${j}`),
          rich(`${j} · ${g} = ${cnt} ${c.many}`),
        ],
        check: { c, P, g, q2, B, cnt, level },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      if (level === 3) {
        // Preis für q2 Einheiten über P/g (anderer Rechenweg als im Generator), Anzahl für das Budget
        const r = k.P.mul(k.q2).div(k.g);
        const cnt = k.B.div(k.P).mul(k.g);
        const exp = `a) ${amtS(r, k.c)}; b) ${cnt.n} ${k.c.many}`;
        return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
      }
      const r = k.total.div(k.n).mul(k.m); // über die Einheit: Gesamtpreis : n · m
      const exp = amtS(r, k.c);
      return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ---------- 2. Wertetabellen ergänzen ----------
  const CTX_TAB = [
    { xl: "Menge in kg", yl: "Preis in €", u: "€", fr: [2, 9], intro: "Äpfel werden nach Gewicht verkauft.", fac: "Faktor: 1 kg kostet {f}" },
    { xl: "Menge in l", yl: "Preis in €", u: "€", fr: [2, 9], intro: "Milch wird im Hofladen nach Liter verkauft.", fac: "Faktor: 1 l kostet {f}" },
    { xl: "Anzahl Brezen", yl: "Preis in €", u: "€", fr: [2, 9], intro: "In der Bäckerei kostet jede Breze gleich viel.", fac: "Faktor: 1 Breze kostet {f}" },
    { xl: "Zeit in h", yl: "Strecke in km", u: "km", fr: [30, 90], intro: "Ein Bus fährt mit gleichbleibender Geschwindigkeit.", fac: "Faktor: In 1 h fährt der Bus {f}" },
    { xl: "Zeit in min", yl: "Wasser in l", u: "l", fr: [2, 12], intro: "Aus einem Wasserhahn fließt gleichmäßig Wasser.", fac: "Faktor: In 1 min fließen {f}" },
  ];

  AG.registerType({
    id: "m7-wertetabelle",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Wertetabellen ergänzen",
    instruction: {
      1: "Ergänze die fehlenden Werte der proportionalen Zuordnung.",
      2: "Ergänze die Wertetabelle. Bestimme zuerst den Faktor.",
      3: "Ergänze die Wertetabelle und gib den Proportionalitätsfaktor an.",
    },
    merke: [
      "Bei einer proportionalen Zuordnung ist der Quotient ", { b: "y : x" }, " immer gleich. Dieser Wert heißt ",
      { b: "Proportionalitätsfaktor" }, ": 8 kg kosten 19,20 €, also 1 kg kostet 2,40 €.",
    ],
    cols: 1,
    generate(rng, level) {
      const c = rng.pick(CTX_TAB);
      const money = c.u === "€";
      const k = rng.pick([4, 5]); // Wertepaare -> Spalten = k + 1 (5 oder 6)
      const fdig = money ? { as: "dec", digits: 2 } : { as: "dec" };

      let f;
      if (level === 1) f = money ? new Frac(10 * rng.int(2, 30), 100) : new Frac(rng.int(c.fr[0], c.fr[1]));
      else if (level === 2) f = money ? new Frac(rng.int(35, 495), 100) : new Frac(rng.int(c.fr[0] * 2, c.fr[1] * 2), 2);
      else f = money ? new Frac(2 * rng.int(20, 245), 100) : new Frac(rng.int(c.fr[0], c.fr[1]));

      let xs;
      if (level === 3) {
        // halbe Einheiten: x = j/2
        xs = rng.shuffle(range(2, 24)).slice(0, k).sort((a, b) => a - b).map(j => new Frac(j, 2));
      } else {
        const [lo, hi] = level === 1 ? [1, 12] : [2, 30];
        xs = rng.shuffle(range(lo, hi)).slice(0, k).sort((a, b) => a - b).map(v => new Frac(v));
      }
      const ys = xs.map(x => f.mul(x));

      // 2 oder 3 Lücken, zufällig über die Wertezellen verteilt
      const cells = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < k; i++) cells.push([r, i]);
      const blanks = rng.shuffle(cells).slice(0, rng.pick([2, 3]));
      const isBlank = (r, i) => blanks.some(([br, bi]) => br === r && bi === i);

      const numX = x => num(x, { as: "dec" });
      const numY = y => numE(y, money);
      const table = {
        rows: [
          [[{ b: c.xl }], ...xs.map((x, i) => (isBlank(0, i) ? [{ blank: 3 }] : numX(x)))],
          [[{ b: c.yl }], ...ys.map((y, i) => (isBlank(1, i) ? [{ blank: 3 }] : numY(y)))],
        ],
      };
      const aTable = {
        rows: [
          [[{ b: c.xl }], ...xs.map(numX)],
          [[{ b: c.yl }], ...ys.map(numY)],
        ],
      };

      const [fPre, fPost] = c.fac.split("{f}");
      const i0 = range(0, k - 1).find(i => !isBlank(0, i) && !isBlank(1, i));
      const steps = [rich(amt(ys[i0], c), " : ", numX(xs[i0]), " = ", amt(f, c))];
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < k; i++) {
          if (!isBlank(r, i)) continue;
          if (r === 1) steps.push(rich(numX(xs[i]), " · ", numE(f, money), " = ", numY(ys[i])));
          else steps.push(rich(numY(ys[i]), " : ", numE(f, money), " = ", numX(xs[i])));
        }
      }

      return {
        q: rich(c.intro, " Ergänze die fehlenden Werte in der Tabelle und gib den Proportionalitätsfaktor an."),
        a: rich(fPre, amt(f, c), fPost),
        table,
        aTable,
        steps,
        check: { c, f, xs, ys, blanks: blanks.length },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const blanks = t.table.rows.flat().flat().filter(s => s && typeof s === "object" && "blank" in s).length;
      if (blanks < 2 || blanks > 3) return `${blanks} Lücken statt 2–3`;
      for (let i = 0; i < k.xs.length; i++) {
        if (!k.ys[i].div(k.xs[i]).eq(k.f)) return "Quotient y : x ≠ Faktor in Spalte " + i;
        if (plain(t.aTable.rows[0][i + 1]) !== plain(num(k.xs[i], { as: "dec" }))) return "aTable: x falsch";
        if (plain(t.aTable.rows[1][i + 1]) !== plain(numE(k.ys[i], k.c.u === "€"))) return "aTable: y falsch";
      }
      const exp = k.c.fac.replace("{f}", amtS(k.f, k.c));
      return plain(t.a) === exp || `erwartet „${exp}“, steht „${plain(t.a)}“`;
    },
  });

  // ---------- 3. Proportional oder nicht? ----------
  const CTX_PR = [
    { xl: "Anzahl Hefte", yl: "Preis in €", u: "€", qu: "€ pro Heft", intro: "Im Schreibwarenladen werden Hefte verkauft." },
    { xl: "Zeit in h", yl: "Strecke in km", u: "km", qu: "km pro h", intro: "Ein Radfahrer fährt auf verschiedenen Strecken." },
    { xl: "Anzahl Eintrittskarten", yl: "Preis in €", u: "€", qu: "€ pro Karte", intro: "Für Gruppen werden Eintrittskarten verkauft." },
    { xl: "Liter Benzin", yl: "Strecke in km", u: "km", qu: "km pro l", intro: "Ein Auto fährt mit verschiedenen Mengen Benzin." },
    { xl: "Minuten", yl: "Kosten in €", u: "€", qu: "€ pro Minute", intro: "Die Tabelle gehört zu einem Handytarif." },
  ];
  const POOL_PR = [1, 2, 4, 5, 10, 20, 25];

  AG.registerType({
    id: "m7-proportional-pruefen",
    klasse: "7",
    zug: "M",
    lb: "8",
    lbTitle: "Proportionalität",
    title: "Proportional oder nicht?",
    instruction: {
      1: "Prüfe, ob die Zuordnung proportional ist. Bilde dazu die Quotienten y : x.",
      2: "Prüfe, ob die Zuordnung proportional ist. Bilde die Quotienten und begründe deine Antwort.",
      3: "Prüfe, ob die Zuordnung proportional ist. Bilde die Quotienten aller Wertepaare und begründe genau.",
    },
    merke: [
      "Eine Zuordnung ist ", { b: "proportional" }, ", wenn alle Quotienten ", { b: "y : x" },
      " gleich sind. Beispiel: 2 : 1 = 6 : 3 = 10 : 5 = 2 → proportional. Gilt das nicht, ist sie nicht proportional.",
    ],
    cols: 1,
    generate(rng, level) {
      const c = rng.pick(CTX_PR);
      const money = c.u === "€";
      const fdig = money ? { as: "dec", digits: 2 } : { as: "dec" };
      const kk = rng.pick([4, 5]);
      const wantProp = rng.chance(0.5);

      let xs, ys, qs, f;
      for (let tries = 0; tries < 500; tries++) {
        xs = rng.shuffle(POOL_PR).slice(0, kk).sort((a, b) => a - b).map(v => new Frac(v));
        if (level === 1) f = money ? new Frac(10 * rng.int(2, 30), 100) : new Frac(rng.int(2, 9));
        else f = money ? new Frac(rng.int(25, 495), 100) : new Frac(rng.int(2, 40), 10);

        if (wantProp) {
          ys = xs.map(x => f.mul(x));
        } else if (level === 3 && rng.chance(0.5)) {
          // ein verfälschter Wert (Ausreißer), sonst linear mit Grundgebühr
          ys = xs.map(x => f.mul(x));
          const i = rng.int(0, kk - 1);
          const d = money ? new Frac(rng.pick([50, 100, 150]), 100) : new Frac(rng.pick([1, 2, 3]));
          ys[i] = rng.chance(0.5) ? ys[i].add(d) : ys[i].sub(d);
          if (ys[i].sign() <= 0) continue;
        } else {
          const g0 = money ? new Frac(rng.int(1, 12) * 50, 100) : new Frac(rng.int(1, 10));
          ys = xs.map(x => g0.add(f.mul(x)));
        }

        qs = xs.map((x, i) => ys[i].div(x));
        // Quotienten nur mit höchstens zwei Nachkommastellen, damit die Begründung sauber ist
        if (qs.some(q => !q.isTerminating() || q.decimals() > 2)) continue;
        break;
      }

      const prop = qs.every(q => q.eq(qs[0]));
      const numX = x => num(x, { as: "dec" });
      const numY = y => numE(y, money);
      const row = (label, vals, fmt) => [[{ b: label }], ...vals.map(v => fmt(v))];

      let a;
      if (prop) {
        a = rich("proportional, Quotient immer ", num(f, fdig), " ", c.qu);
      } else {
        // zwei Quotienten, die verschieden sind
        let pi = 0, pj = 1;
        outer: for (let i = 0; i < kk; i++) for (let j = i + 1; j < kk; j++) {
          if (!qs[i].eq(qs[j])) { pi = i; pj = j; break outer; }
        }
        a = rich(
          "nicht proportional, denn die Quotienten sind verschieden: ",
          numY(ys[pi]), " : ", numX(xs[pi]), " = ", num(qs[pi], fdig),
          " und ",
          numY(ys[pj]), " : ", numX(xs[pj]), " = ", num(qs[pj], fdig),
        );
      }

      return {
        q: rich(c.intro, " Ist die Zuordnung proportional? Begründe mit den Quotienten."),
        a,
        table: { rows: [row(c.xl, xs, numX), row(c.yl, ys, numY)] },
        steps: qs.map((q, i) => rich(numY(ys[i]), " : ", numX(xs[i]), " = ", num(q, fdig))),
        check: { c, xs, ys, prop },
      };
    },
    verify(t, level) {
      const k = t.check;
      if (!k) return "kein Prüfdatensatz";
      const cols = t.table.rows[0].length - 1;
      if (cols < 4 || cols > 5) return `${cols} Wertepaare statt 4–5`;
      const qs = k.xs.map((x, i) => k.ys[i].div(x));
      const prop = qs.every(q => q.eq(qs[0]));
      if (prop !== k.prop) return "Entscheidung proportional/nicht stimmt nicht";
      const s = plain(t.a);
      if (prop) return s.startsWith("proportional, Quotient immer ") || `Antwort falsch: „${s}“`;
      return s.startsWith("nicht proportional, denn") || `Antwort falsch: „${s}“`;
    },
  });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
