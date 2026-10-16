// Zeigt Aufgaben eines Typs mit Skizzen als PNG: node tools/render-figs.js <typ-id> <ausgabe.png> [anzahl je Niveau]
// Braucht Playwright (NODE_PATH=$(npm root -g)) und Chromium unter /opt/pw-browsers/chromium.
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");
const [id, out = "figs.png", nArg = "3"] = process.argv.slice(2);
if (!id) { console.error("Aufruf: node tools/render-figs.js <typ-id> <ausgabe.png> [anzahl]"); process.exit(1); }
const core = ["rng.js", "content.js", "engine.js", "figures.js", "docx.js", "render-html.js"].map(f => path.join(root, "src/core", f));
const types = fs.readdirSync(path.join(root, "src/types")).filter(f => f.endsWith(".js")).sort().map(f => path.join(root, "src/types", f));
const scripts = [...core, ...types].map(f => `<script>${fs.readFileSync(f, "utf8")}</script>`).join("\n");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:Arial,sans-serif;font-size:11pt;margin:16px;background:#fff;color:#1b2130}
.grid{display:grid;grid-template-columns:repeat(${Number(nArg)},1fr);gap:14px}
.cell{border:1px solid #d8dfeb;padding:8px;border-radius:6px}.lv{font-weight:bold;color:#1f3f9e;margin:14px 0 4px}
.fig{margin:4px 0}.fig svg{display:block;width:100%;height:auto}.fr{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.9em}
.fr>span:first-child{border-bottom:1px solid}.a{color:#c8102e;font-size:10pt;margin-top:4px}.nw{white-space:nowrap}
</style></head><body>${scripts}<div id="out"></div><script>
const t = AG.typeById(${JSON.stringify(id)});
let h = "<h2>" + t.id + " – " + t.title + "</h2>";
for (const lv of t.levels) {
  h += '<div class="lv">Niveau ' + lv + '</div><div class="grid">';
  for (let i = 0; i < ${Number(nArg)}; i++) {
    const zug = t.zug === "RM" ? (i % 2 ? "R" : "M") : t.zug;
    const k = AG.generateTask(t, lv, "figs|" + lv + "|" + i, { zug });
    h += '<div class="cell"><div>' + AG.richHtml(k.q) + ' <small>(' + zug + ')</small></div>' + AG.figHtml(k.fig) +
      (k.aFig ? '<div class="a">Lösungsskizze:</div>' + AG.figHtml(k.aFig) : "") + '<div class="a">' + AG.richHtml(k.a) + '</div></div>';
  }
  h += "</div>";
}
document.getElementById("out").innerHTML = h;
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  console.log(errs.length ? "Fehler: " + errs.join("; ") : "geschrieben: " + out);
})();
