// Prüft alle Aufgabentypen: node tools/test-types.js [typ-id-teil] [--samples N]
// Lädt src/core/*.js und src/types/*.js wie im Browser und erzeugt viele Aufgaben je Niveau.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = { console, TextEncoder, TextDecoder, btoa, atob };
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
for (const f of ["rng.js", "content.js", "engine.js", "figures.js"]) load(path.join(root, "src/core", f));
for (const f of fs.readdirSync(path.join(root, "src/types")).sort()) if (f.endsWith(".js")) load(path.join(root, "src/types", f));

const AG = ctx.AG;
const args = process.argv.slice(2);
const si = args.indexOf("--samples");
const filter = args.find((a, i) => !a.startsWith("--") && i !== si + 1) || "";
const samples = si >= 0 ? Number(args[si + 1]) : 4;
const N = 300;

function checkRich(r, where) {
  if (!Array.isArray(r)) throw new Error(where + ": kein Array");
  for (const seg of r) {
    if (typeof seg === "string") continue;
    if (Array.isArray(seg)) throw new Error(where + ": verschachteltes Array – AG.rich() benutzen");
    if (seg.f) {
      const [n, d] = seg.f;
      if (!Number.isInteger(n) || !Number.isInteger(d) || n < 0 || d < 1) throw new Error(where + ": ungültiger Bruch " + JSON.stringify(seg));
      if (seg.w !== undefined && (!Number.isInteger(seg.w) || seg.w < 0)) throw new Error(where + ": ungültige ganze Zahl " + JSON.stringify(seg));
      continue;
    }
    if (seg.b !== undefined || seg.sup !== undefined || seg.blank !== undefined || seg.br) continue;
    throw new Error(where + ": unbekanntes Segment " + JSON.stringify(seg));
  }
  const t = AG.plain(r);
  if (/NaN|undefined|Infinity|null|\[object/.test(t)) throw new Error(where + ": verdächtiger Text: " + t);
  if (/\d\.\d/.test(t)) throw new Error(where + ": Dezimalpunkt statt Komma: " + t);
  if (/(^|[^\w])-\d/.test(t)) throw new Error(where + ": Bindestrich statt Minuszeichen (AG.MINUS): " + t);
}

let failed = 0;
for (const type of AG.TYPES) {
  if (!type.id.includes(filter)) continue;
  console.log(`\n=== ${type.id} — ${type.title} (Kl. ${type.klasse} ${type.zug}, LB ${type.lb})`);
  for (const level of type.levels) {
    const keys = new Set();
    let errors = 0;
    const shown = [];
    for (let i = 0; i < N; i++) {
      try {
        const zug = type.zug === "RM" ? (i % 2 ? "R" : "M") : type.zug;
        const t = AG.generateTask(type, level, "test|" + level + "|" + i, { zug });
        checkRich(t.q, "q"); checkRich(t.a, "a");
        (t.steps || []).forEach((s, k) => checkRich(s, "steps[" + k + "]"));
        if (t.table) t.table.rows.forEach(r => r.forEach(c => checkRich(c, "table")));
        if (t.aTable) t.aTable.rows.forEach(r => r.forEach(c => checkRich(c, "aTable")));
        for (const fg of [t.fig, t.aFig]) if (fg && (typeof fg.svg !== "string" || !fg.svg.startsWith("<svg") || !(fg.w > 0) || !(fg.h > 0) || /NaN|undefined/.test(fg.svg))) throw new Error("ungültige Skizze");
        if (type.verify) { const v = type.verify(t, level); if (v !== true) throw new Error("verify: " + v); }
        keys.add(AG.plain(t.q) + (t.table ? JSON.stringify(t.table.rows.map(r => r.map(AG.plain))) : ""));
        if (shown.length < samples) shown.push(t);
      } catch (e) {
        errors++;
        if (errors <= 3) console.log(`  ✗ Niveau ${level}, Lauf ${i}: ${e.message}`);
      }
    }
    const uniq = keys.size;
    const okUniq = uniq >= Math.min(N, 40);
    console.log(`  Niveau ${level}: ${errors ? "✗ " + errors + " Fehler" : "ok"}, ${uniq} verschiedene von ${N}${okUniq ? "" : "  ✗ zu wenig Abwechslung"}`);
    if (errors || !okUniq) failed++;
    for (const t of shown) {
      console.log("    " + AG.plain(t.q) + (t.table ? "  [Tabelle " + t.table.rows.map(r => r.map(AG.plain).join("|")).join(" / ") + "]" : "") + "   →  " + AG.plain(t.a));
      if (t.steps && samples > 0) for (const s of t.steps) console.log("        " + AG.plain(s));
    }
  }
}
console.log(failed ? `\n${failed} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(failed ? 1 : 0);
