// Rendert mit Chromium:  "png" -> bilder/png/*.png (für Word)   "pdf" -> druck/*.pdf
// Aufruf: node werkzeuge/rendern.mjs png|pdf
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require("playwright");
} catch {
  playwright = require(join(dirname(process.execPath), "../lib/node_modules/playwright"));
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modus = process.argv[2];
const browser = await playwright.chromium.launch();
const page = await browser.newPage();

if (modus === "png") {
  const quelle = join(root, "bilder");
  const ziel = join(quelle, "png");
  mkdirSync(ziel, { recursive: true });
  for (const datei of readdirSync(quelle).filter((f) => f.endsWith(".svg"))) {
    const svg = readFileSync(join(quelle, datei), "utf8");
    const breite = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(svg)[1] > 100 ? 1200 : 256;
    await page.setContent(`<body style="margin:0;background:transparent"><div id="b" style="width:${breite}px">${svg.replace("<svg ", '<svg style="display:block;width:100%;height:auto" ')}</div></body>`);
    await page.locator("#b").screenshot({ path: join(ziel, datei.replace(".svg", ".png")), omitBackground: true });
  }
  console.log("PNG-Bilder geschrieben:", ziel);
} else if (modus === "pdf") {
  const druck = join(root, "druck");
  for (const datei of readdirSync(druck).filter((f) => f.endsWith(".html"))) {
    await page.goto(pathToFileURL(join(druck, datei)).href);
    const ziel = join(druck, datei.replace(/\.html$/, ".pdf"));
    await page.pdf({ path: ziel, format: "A4", printBackground: true, preferCSSPageSize: true });
    console.log("geschrieben:", ziel);
  }
} else {
  console.error("Aufruf: node rendern.mjs png|pdf");
  process.exitCode = 1;
}
await browser.close();
