// Erzeugt ein Beispielblatt als .docx: node tools/sample-docx.js <ausgabe.docx> [typ-id,...]
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { console, TextEncoder, TextDecoder, btoa, atob, Blob, Response, CompressionStream };
vm.createContext(ctx);
const load = f => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
for (const f of ["rng.js", "content.js", "engine.js", "docx.js"]) load(path.join(root, "src/core", f));
for (const f of fs.readdirSync(path.join(root, "src/types")).sort()) if (f.endsWith(".js")) load(path.join(root, "src/types", f));
const AG = ctx.AG;
const out = process.argv[2] || "beispiel.docx";
const ids = (process.argv[3] || AG.TYPES.map(t => t.id).slice(0, 4).join(",")).split(",");
const config = { klasse: "7", zug: "M", seed: 4821, title: "Rechnen mit rationalen Zahlen", rerolls: {},
  parts: ids.map((id, i) => ({ type: id, level: Math.min(3, i + 1), count: AG.typeById(id).cols === 1 ? 3 : 6 })) };
const A = AG.generateSheet(config, "A");
const meta = { klasse: "7", zug: "M", title: config.title, subject: AG.typeById(ids[0]).lbTitle, blattNr: config.seed, code: AG.encodeCode(config), merke: AG.typeById(ids[0]).merke };
(async () => {
const bytes = await AG.buildDocxAsync([{ sheet: A, mode: "worksheet" }, { sheet: A, mode: "steps" }], meta, { merke: true, workLines: 1 });
fs.writeFileSync(out, Buffer.from(bytes));
console.log("geschrieben:", out, bytes.length, "Bytes");
})();
