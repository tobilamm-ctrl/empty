// Prüft den Übungsmodus: node tools/test-check.js
// Lädt src/core/*.js (inkl. check-answer.js) und src/types/*.js wie im Browser.
// 1. Tabelle: je Aufgabentyp und Niveau, wie viele von 100 Aufgaben answerKind "number" / "term" / null haben.
// 2. Für alle prüfbaren Aufgaben: richtige Lösung in mehreren Schreibweisen ist richtig, Lösung + 1 ist falsch.
// 3. Feste Testfälle.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { console, TextEncoder, TextDecoder, btoa, atob };
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
for (const f of ["rng.js", "content.js", "engine.js", "figures.js", "check-answer.js"]) load(path.join(root, "src/core", f));
for (const f of fs.readdirSync(path.join(root, "src/types")).sort()) if (f.endsWith(".js")) load(path.join(root, "src/types", f));

const AG = ctx.AG;
const { Frac, MINUS } = AG;
const N = 100;
const KINDS = ["number", "term", null];

let failures = 0;
const problems = [];
const fail = msg => { failures++; problems.push(msg); };

// ---------- 1. Tabelle ----------
console.log("Typ | Niveau | number | term | null | prüfbar");
const perType = {};
for (const type of AG.TYPES) {
  for (const level of type.levels) {
    const counts = { number: 0, term: 0, null: 0 };
    for (let i = 0; i < N; i++) {
      let task;
      try {
        task = AG.generateTask(type, level, "check|" + level + "|" + i);
      } catch (e) {
        fail(`${type.id} Niveau ${level}, Lauf ${i}: Erzeugung fehlgeschlagen: ${e.message}`);
        continue;
      }
      const kind = AG.answerKind(task);
      if (!KINDS.includes(kind)) fail(`${type.id}: unbekannte answerKind ${kind}`);
      counts[kind ?? "null"]++;
      const acc = (perType[type.id] ??= { n: 0, checkable: 0 });
      acc.n++; if (kind) acc.checkable++;
    }
    const pct = Math.round((100 * (counts.number + counts.term)) / N);
    console.log(`${type.id} | ${level} | ${counts.number} | ${counts.term} | ${counts.null} | ${pct} %`);
  }
}
console.log("\nAnteil prüfbarer Aufgaben je Typ (alle Niveaus):");
for (const [id, a] of Object.entries(perType)) console.log(`  ${id}: ${Math.round((100 * a.checkable) / a.n)} %`);

// ---------- 2. Prüfung aller Aufgaben ----------
// Zahl (Frac) aus Text wie „1 3/4“, „−3,25“, „48“ (ohne Einheit)
function coreOf(sol) {
  const body = sol.replace(/^\S\s*[=≈]\s*/, "").replace(/^≈\s*/, "");
  const m = body.replace(/^\+/, "").match(/^[−-]?\d(?:[\d   \/,]*\d)?/);
  return m ? m[0] : null;
}
function fracOf(core) {
  const neg = /^[−-]/.test(core);
  const c = core.replace(/^[−-]/, "");
  let m = c.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  let f;
  if (m) f = new Frac(+m[1] * +m[3] + +m[2], +m[3]);
  else if ((m = c.match(/^(\d+)\/(\d+)$/))) f = new Frac(+m[1], +m[2]);
  else {
    const digits = c.replace(/[   ]/g, "").replace(",", ".");
    const [int, dec = ""] = digits.split(".");
    f = new Frac(Number(int + dec), 10 ** dec.length);
  }
  return neg ? f.neg() : f;
}
const variantsNumber = sol => {
  const core = coreOf(sol);
  const f = fracOf(core);
  const out = [["Lösung mit Einheit", sol], ["ohne Einheit", core], ["Punkt statt Komma", core.replace(",", ".")], ["- statt −", core.replace(MINUS, "-")]];
  if (core.includes("/") && f.isTerminating()) {
    const dec = AG.fmtDec(f).replace(MINUS, "-");
    out.push(["Dezimalzahl", dec], ["Dezimalzahl mit Punkt", dec.replace(",", ".")]);
  }
  return { out, value: f };
};
function variantsTerm(sol) {
  const plainSign = sol.replace(MINUS, "-");
  const nospace = plainSign.replace(/\s+/g, "");
  const parts = nospace.match(/[+-]?[^+-]+/g).map(p => (/^[+-]/.test(p) ? p : "+" + p));
  const reversed = parts.slice().reverse().join("").replace(/^\+/, "");
  const out = [["Lösung", sol], ["ohne Leerzeichen, - statt −", nospace], ["Glieder vertauscht", reversed], ["mit *", nospace.replace(/(\d)([a-z])/g, "$1*$2")]];
  if (/\d,\d/.test(sol)) out.push(["Punkt statt Komma", nospace.replace(/(\d),(\d)/g, "$1.$2")]);
  return out;
}

let checked = 0;
for (const type of AG.TYPES) {
  for (const level of type.levels) {
    for (let i = 0; i < N; i++) {
      let task;
      try { task = AG.generateTask(type, level, "check|" + level + "|" + i); } catch (e) { continue; }
      const where = `${type.id} Niveau ${level}, Lauf ${i} („${AG.plain(task.a)}“)`;
      const kind = AG.answerKind(task);
      if (!kind) {
        if (AG.checkAnswer(task, "5") !== null) fail(where + ": null-Art, aber checkAnswer liefert kein null");
        continue;
      }
      checked++;
      const sol = AG.plain(task.a).trim();
      let correct, wrong;
      if (kind === "number" && !coreOf(sol)) { fail(where + ": keine Zahl erkennbar"); continue; }
      if (kind === "number") {
        const v = variantsNumber(sol);
        correct = v.out;
        const wrongVal = AG.plain(AG.num(v.value.add(1)));
        wrong = [["Lösung + 1", wrongVal]];
      } else {
        correct = variantsTerm(sol);
        wrong = [["Lösung + 1", sol + " + 1"]];
      }
      for (const [label, input] of correct) {
        const r = AG.checkAnswer(task, input);
        if (!r || r.ok !== true) fail(`${where}: richtige Lösung (${label}) „${input}“ abgelehnt${r && r.reason ? " (" + r.reason + ")" : ""}`);
      }
      for (const [label, input] of wrong) {
        const r = AG.checkAnswer(task, input);
        if (!r || r.ok !== false) fail(`${where}: falsche Eingabe (${label}) „${input}“ akzeptiert`);
      }
    }
  }
}
console.log(`\nGeprüfte Aufgaben mit answerKind ≠ null: ${checked}`);

// ---------- 3. Feste Testfälle ----------
const rich = (...segs) => segs;
const fixed = [
  { a: rich({ f: [3, 4], w: 1 }), kind: "number", cases: [["1 3/4", true], ["7/4", true], ["1,75", true], ["1.75", true], ["1 1/4", false]] },
  { a: ["x = −5"], kind: "number", cases: [["-5", true], ["x=-5", true], ["5", false]] },
  { a: ["−4a + 5"], kind: "term", cases: [["5-4a", true], ["-4*a+5", true], ["4a+5", false]] },
  { a: ["48 Besucher"], kind: "number", cases: [["48", true], ["48 Besucher", true], ["49", false]] },
  { a: ["−3,25 €"], kind: "number", cases: [["-3.25", true], ["−3,25 €", true], ["3,25", false]] },
  { a: ["15 000 Besucher"], kind: "number", cases: [["15000", true], ["15 000", true], ["15 001", false]] },
  { a: ["2a"], kind: "term", cases: [["a*2", true], ["2 a", true], ["3a", false]] },
  { a: ["7x − 12"], kind: "term", cases: [["-12+7x", true], ["7*x-12", true], ["7x+12", false], ["7y-12", false]] },
  { a: ["Maßstab 1 : 5000"], kind: null, cases: [] },
  { a: ["a) 2; b) 3"], kind: null, cases: [] },
  { a: ["x = 2 oder x = 3"], kind: null, cases: [] },
];
for (const f of fixed) {
  const task = { a: f.a };
  const kind = AG.answerKind(task);
  const label = AG.plain(f.a);
  if (kind !== f.kind) fail(`Festfall „${label}“: answerKind ${kind} statt ${f.kind}`);
  for (const [input, want] of f.cases) {
    const r = AG.checkAnswer(task, input);
    if (!r || r.ok !== want) fail(`Festfall „${label}“: Eingabe „${input}“ ${want ? "muss richtig sein" : "muss falsch sein"}, Ergebnis ${JSON.stringify(r)}`);
  }
}
console.log(`Feste Testfälle: ${fixed.length} Aufgaben, ${fixed.reduce((s, f) => s + f.cases.length, 0)} Eingaben.`);

// ---------- Ergebnis ----------
if (problems.length) {
  console.log("\nBeispiele für Fehler:");
  for (const p of problems.slice(0, 15)) console.log("  ✗ " + p);
  if (problems.length > 15) console.log(`  … ${problems.length - 15} weitere`);
}
console.log(failures ? `\n${failures} Fehler.` : "\nAlle Prüfungen bestanden.");
process.exit(failures ? 1 : 0);
