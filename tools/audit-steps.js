// Prüft, ob das Endergebnis jeder Aufgabe in den Zwischenschritten vorkommt (letzter Rechenschritt fehlt sonst).
// node tools/audit-steps.js [typ-id-teil]
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { console, TextEncoder, TextDecoder, btoa, atob };
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
for (const f of ["rng.js", "content.js", "engine.js", "figures.js"]) load(path.join(root, "src/core", f));
for (const f of fs.readdirSync(path.join(root, "src/types")).sort()) if (f.endsWith(".js")) load(path.join(root, "src/types", f));
const AG = ctx.AG;
const filter = process.argv[2] || "";
// Zahlen eines Textes (mit Komma, Brüchen, Minus) als normierte Zeichenketten
const nums = s => (s.replace(/ | /g, " ").replace(/(\d) (\d{3})\b/g, "$1$2").match(/−?\d+(?:,\d+)?(?: \d+\/\d+|\/\d+)?/g) || []).map(x => x.replace("−", "-"));
let bad = 0;
for (const type of AG.TYPES) {
  if (!type.id.includes(filter)) continue;
  for (const level of type.levels) {
    let miss = 0, noSteps = 0, ex = null;
    for (let i = 0; i < 200; i++) {
      const zug = type.zug === "RM" ? (i % 2 ? "R" : "M") : type.zug;
      const t = AG.generateTask(type, level, "audit|" + level + "|" + i, { zug });
      if (!t.steps || !t.steps.length) { noSteps++; continue; }
      const stepText = t.steps.map(s => AG.plain(s)).join("  ");
      const need = nums(AG.plain(t.a));
      const have = new Set(nums(stepText));
      const missing = need.filter(n => !have.has(n));
      if (missing.length) { miss++; if (!ex) ex = { q: AG.plain(t.q), a: AG.plain(t.a), steps: t.steps.map(s => AG.plain(s)), missing }; }
    }
    if (miss || noSteps) {
      bad++;
      console.log(`${type.id} Niveau ${level}: ${miss}/200 Ergebnis fehlt in den Schritten${noSteps ? `, ${noSteps}/200 ohne Schritte` : ""}`);
      if (ex) console.log("   Beispiel:", ex.q.slice(0, 110).replace(/\n/g, " "), "\n   Ergebnis:", ex.a, "| fehlt:", ex.missing.join(", "), "\n   Schritte:", ex.steps.join(" / ").slice(0, 300));
    }
  }
}
console.log(bad ? `\n${bad} Niveau(s) auffällig.` : "\nIn allen Typen steht das Ergebnis in den Schritten.");
