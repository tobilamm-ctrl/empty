// Quali-Training (Klasse 9): Prüfungsähnliche Teile, die ihre Aufgaben aus vorhandenen Aufgabentypen der Klassen 5–9 ziehen.
// Teil A ohne Taschenrechner (kurze Grundaufgaben), Teil B mit Taschenrechner (Sachaufgaben, Geometrie).
// Jede Aufgabe stammt aus einem zufällig gewählten Typ des Pools; dessen Arbeitsanweisung wird der Aufgabe vorangestellt.
(function (AG) {
  const { rich } = AG;

  // Pools: [Typ-ID, höchstes Niveau, das für diesen Teil passt]
  // Abgleich mit den Quali-Prüfungen 2021–2025 (Teil A: schriftliches Rechnen mit Dezimalzahlen, Umformungen ergänzen
  // und Fehler finden, Vergleichen, Dreisatz, Winkel, Wahrscheinlichkeit; Teil B: Gleichungen und Textaufgaben, Körper,
  // Prozent und Zinsen, Graphen, Vielecke und Pythagoras)
  const POOLS = {
    aZahlen: [
      ["m6-dezimal-addsub", 2], ["m6-dezimal-muldiv", 2], ["m6-brueche-addsub", 2], ["m6-brueche-vergleichen", 2],
      ["m7-q-addsub", 2], ["m5-punkt-vor-strich", 3], ["m8-quadrat-wurzel", 2], ["m5-zahlenfolgen", 2],
      ["m7-gleichung", 2], ["m8-fehler-finden", 2], ["m5-platzhalter", 3], ["m9-zehnerpotenz-schreibweise", 2],
      ["m9-zehnerpotenz-ordnen", 2], ["m5-ueberschlag", 2], ["q9-raetsel", 3], ["q9-klammern-setzen", 2],
    ],
    aGroessen: [
      ["m5-groessen-umrechnen", 3], ["m5-flaecheneinheiten", 2], ["m6-volumeneinheiten", 2], ["m7-dreisatz", 2],
      ["m7-prozentwert", 1], ["m7-prozentsatz", 1], ["m7-winkelsumme", 2], ["m6-viereckarten", 2],
      ["m5-rechteck-flaeche", 2], ["m9-laplace", 1], ["m8-relative-haeufigkeit", 1], ["m9-vorsilben", 2], ["q9-groessen-schaetzen", 3], ["q9-groessen-schaetzen", 3],   // doppelt: häufigste Aufgabe in Teil A
    ],
    bProzent: [
      ["m8-rabatt-skonto", 3], ["m8-umsatzsteuer", 3], ["m8-kalkulation", 3], ["m9-jahreszinsen", 3],
      ["m9-monats-tageszinsen", 3], ["m9-zinseszins", 3], ["m8-schaubilder", 3], ["m8-wachstumsfaktor", 3],
      ["m7-prozent-umwandeln", 3],
    ],
    bGeometrie: [
      ["m8-kreis-zusammengesetzt", 3], ["m8-zylinder-volumen", 3], ["m8-zylinder-oberflaeche", 3], ["m9-pythagoras-anwendung", 3],
      ["m9-pyramide-kegel-volumen", 3], ["m9-flaeche-zusammengesetzt", 3], ["m9-prisma-vieleck-volumen", 3], ["m9-vieleck-flaeche", 3],
      ["m9-vielecke", 3], ["m7-prisma-volumen", 3],
    ],
    bGleichungen: [
      ["m8-gleichung-klammern", 3], ["m9-gleichung-brueche", 3], ["m8-textgleichungen", 3], ["m9-text-mischung", 3],
      ["m9-formeln-umstellen", 3], ["m9-gleichungssystem", 2], ["m8-graph-ablesen", 3], ["m9-graph-ablesen", 3],
      ["m9-zuordnung-art", 3], ["m9-zweistufig", 3], ["m8-relative-haeufigkeit", 3], ["m9-schnittpunkt", 3],
    ],
  };

  const instr = (T, level) => {
    const i = T.instruction;
    return typeof i === "string" ? i : (i && (i[level] || i[1])) || "";
  };

  function pick(rng, pool, zug) {
    const ok = pool.map(([id, max]) => [AG.typeById(id), max])
      .filter(([T]) => T && (T.zug === zug || T.zug === "RM" || (T.zug === "R" && zug === "R")));
    if (!ok.length) throw new Error("Quali: leerer Aufgabenpool");
    return rng.pick(ok);
  }

  function make(id, title, poolKey, ohneTR, cols) {
    AG.registerType({
      id, klasse: "9", zug: "RM", lb: "Q", lbTitle: "Quali-Training", topic: "quali", title, cols,
      instruction: ohneTR ? "Ohne Taschenrechner und ohne Formelsammlung lösen." : "Taschenrechner und Formelsammlung sind erlaubt.",
      merke: [{ b: "Quali Teil A" }, ": ohne Taschenrechner und Formelsammlung. ", { b: "Teil B" },
        ": Taschenrechner und Formelsammlung erlaubt. Schreibe immer den Rechenweg auf."],
      generate(rng, level, ctx) {
        const zug = (ctx && ctx.zug) || "M";
        const [T, max] = pick(rng, POOLS[poolKey], zug);
        const lv = Math.min(level, max, Math.max(...T.levels));
        const inner = AG.generateTask(T, T.levels.includes(lv) ? lv : T.levels[0], "quali|" + rng.int(1, 1e9), { zug });
        const head = instr(T, lv);
        return Object.assign({}, inner, {
          q: head ? rich(head, { br: true }, inner.q) : inner.q,
          inline: false,
          _src: T.id, _lv: lv, _inner: inner,
        });
      },
      verify(t) {
        const T = AG.typeById(t._src);
        return T && T.verify ? T.verify(t._inner, t._lv) : true;
      },
    });
  }

  make("q9-teil-a-zahlen", "Teil A – Zahlen und Terme (ohne Taschenrechner)", "aZahlen", true, 2);
  make("q9-teil-a-groessen", "Teil A – Größen, Prozente, Geometrie (ohne Taschenrechner)", "aGroessen", true, 2);
  make("q9-teil-b-prozent", "Teil B – Prozente und Zinsen (mit Taschenrechner)", "bProzent", false, 1);
  make("q9-teil-b-geometrie", "Teil B – Geometrie (mit Taschenrechner)", "bGeometrie", false, 1);
  make("q9-teil-b-gleichungen", "Teil B – Gleichungen, Funktionen, Wahrscheinlichkeit (mit Taschenrechner)", "bGleichungen", false, 1);
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
