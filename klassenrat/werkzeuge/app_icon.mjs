// Rendert das App-Symbol (bilder/app-icon.svg) in den Größen für iPad/iPhone, Android und den Browser-Tab.
// Aufruf: node werkzeuge/app_icon.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(join(dirname(process.execPath), "../lib/node_modules/playwright")); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "bilder", "app-icon.svg"), "utf8");
const browser = await playwright.chromium.launch();
const page = await browser.newPage();
for (const [groesse, name] of [[180, "apple-touch-icon.png"], [192, "app-icon-192.png"], [512, "app-icon-512.png"], [64, "favicon.png"]]) {
  await page.setViewportSize({ width: groesse, height: groesse });
  await page.setContent(`<body style="margin:0">${svg.replace("<svg ", `<svg width="${groesse}" height="${groesse}" style="display:block" `)}</body>`);
  await page.screenshot({ path: join(root, "digital", name), clip: { x: 0, y: 0, width: groesse, height: groesse } });
  console.log("geschrieben:", name);
}
await browser.close();
