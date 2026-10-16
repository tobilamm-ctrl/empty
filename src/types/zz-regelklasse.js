// Regelklasse 7: Welche M7-Typen auch für die Regelklasse gelten und was dort eingeschränkt wird.
// Wird nach allen anderen Typdateien geladen (Dateiname zz-…).
(function (AG) {
  // Lehrplan R7 = M7 bis auf: keine Division durch Brüche (Divisor nur dezimal), Prozentsatz als Faktor nicht verlangt.
  const BOTH = [
    "m7-winkelsumme", "m7-masstab", "m7-terme-vereinfachen", "m7-termwert", "m7-gleichung", "m7-fehler-finden",
    "m7-dreisatz", "m7-wertetabelle", "m7-proportional-pruefen", "m7-prozentwert", "m7-grundwert", "m7-prozentsatz",
    "m7-prozent-umwandeln", "m7-mischung", "m7-q-addsub", "m7-q-muldiv", "m7-q-verbindung", "m7-q-vorteilhaft", "m7-kennwerte",
  ];
  // Regelklasse: kein Bruch als Divisor
  const NO_FRACTION_DIVISOR = ["m7-q-muldiv", "m7-q-verbindung"];

  function hasFractionDivisor(rich) {
    for (let i = 0; i < rich.length; i++) {
      const seg = rich[i];
      if (typeof seg !== "string" || !/:\s*\(?\s*$/.test(seg)) continue;
      let j = i + 1;
      while (j < rich.length && typeof rich[j] === "string" && /^[\s(]*$/.test(rich[j])) j++;
      if (j < rich.length && rich[j] && rich[j].f) return true;
    }
    return false;
  }

  for (const id of BOTH) {
    const t = AG.typeById(id);
    if (!t) continue;
    t.zug = "RM";
    if (NO_FRACTION_DIVISOR.includes(id)) {
      const gen = t.generate;
      t.generate = (rng, level, ctx) => {
        let task = gen(rng, level, ctx);
        if (!ctx || ctx.zug !== "R") return task;
        for (let i = 0; i < 80 && hasFractionDivisor(task.q); i++) task = gen(rng, level, ctx);
        return task;
      };
    }
  }
  AG._hasFractionDivisor = hasFractionDivisor;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
