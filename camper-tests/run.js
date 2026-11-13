#!/usr/bin/env node
// Alle Tests von LAMMping laufen lassen:  node camper-tests/run.js            (alle)
//                                         node camper-tests/run.js e2e80 push84   (nur diese)
// Baut in camper-tests/.work eine frische Kopie der App mit Testdaten auf, startet den PHP-Server (Port 8766) und den
// Ersatz-Push-Dienst (Port 9911) und setzt vor jedem Test die Datenbank zurück. Braucht php, node und Playwright.
const fs = require('fs'), path = require('path'), { spawn, spawnSync, execSync } = require('child_process');
const ROOT = __dirname, APP = path.join(ROOT, '..', 'camper-app'), WORK = path.join(ROOT, '.work'), SRV = path.join(WORK, 'srv');
const all = fs.readdirSync(path.join(ROOT, 'tests')).filter(f => /^(e2e|karte|srv|push)\w*\.js$/.test(f)).map(f => f.slice(0, -3))
  .sort((a, b) => (parseInt(a.replace(/\D+/, ''), 10) || 0) - (parseInt(b.replace(/\D+/, ''), 10) || 0) || a.localeCompare(b));
const want = process.argv.slice(2).length ? process.argv.slice(2) : all;
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(SRV, { recursive: true });
fs.cpSync(APP, SRV, { recursive: true, filter: p => !/[\\/]api[\\/](data|config\.php)/.test(p) || /[\\/]api[\\/]data$/.test(p) || /\.htaccess$/.test(p) });
fs.mkdirSync(path.join(SRV, 'api', 'data', 'photos'), { recursive: true });
fs.writeFileSync(path.join(SRV, 'api', 'config.php'), `<?php
return ['push_test' => true, 'setup_code' => 'nur-fuer-tests', 'db' => 'sqlite:' . __DIR__ . '/data/lammping.sqlite', 'db_user' => null, 'db_pass' => null, 'photos' => __DIR__ . '/data/photos'];
`);
// Tests und Hilfsdateien in den Arbeitsordner (Bildschirmfotos landen dort, nicht im Projekt)
for (const d of ['tests', 'fixtures']) for (const f of fs.readdirSync(path.join(ROOT, d))) fs.copyFileSync(path.join(ROOT, d, f), path.join(WORK, f));
for (const f of fs.readdirSync(WORK)) if (f.endsWith('.js')) for (const m of fs.readFileSync(path.join(WORK, f), 'utf8').matchAll(/\/(shots\d*)\//g)) fs.mkdirSync(path.join(WORK, m[1]), { recursive: true });
// Das Testfoto „jetzt.jpg“ braucht eine Aufnahmezeit von eben (die Tests prüfen „vor kurzem aufgenommen“)
{ const p = path.join(WORK, 'jetzt.jpg'), d = new Date(), z = n => String(n).padStart(2, '0');
  const now = `${d.getFullYear()}:${z(d.getMonth() + 1)}:${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
  fs.writeFileSync(p, Buffer.from(fs.readFileSync(p).toString('latin1').replace(/\d{4}:\d\d:\d\d \d\d:\d\d:\d\d/g, now), 'latin1')); }
const resetDb = () => { for (const x of ['', '-wal', '-shm']) fs.rmSync(path.join(SRV, 'api', 'data', 'lammping.sqlite' + x), { force: true });
  fs.copyFileSync(path.join(ROOT, 'fixtures', 'testdaten.sqlite'), path.join(SRV, 'api', 'data', 'lammping.sqlite')); };

(async () => {
  const php = spawn('php', ['-S', 'localhost:8766', '-t', SRV], { stdio: ['ignore', fs.openSync(path.join(WORK, 'php.log'), 'w'), fs.openSync(path.join(WORK, 'php.log'), 'a')] });
  const push = spawn('node', ['fakepush.js'], { cwd: WORK, stdio: 'ignore' });
  const stop = () => { php.kill(); push.kill(); };
  process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(130); });
  resetDb();
  for (let i = 0; i < 40; i++) { try { execSync('curl -fs -m 2 "http://localhost:8766/api/?a=version"', { stdio: 'ignore' }); break; } catch { await sleep(250); } }
  const bad = [];
  for (const t of want) {
    if (!fs.existsSync(path.join(WORK, t + '.js'))) { console.log(`?  ${t}: gibt es nicht`); bad.push(t); continue; }
    resetDb();
    const r = spawnSync('node', [t + '.js'], { cwd: WORK, encoding: 'utf8', timeout: 300000 });
    const out = (r.stdout || '') + (r.stderr || '');
    fs.writeFileSync(path.join(WORK, t + '.log'), out);
    // Fehlgeschlagen: Absturz, gemeldete Fehler (außer der bekannten Grenze des Testbrowsers bei Push) oder ein ✘
    const errLine = out.split('\n').find(l => /^Fehler:/.test(l) && !/^Fehler: keine/.test(l) && !/Push API in incognito/.test(l));
    const ok = r.status === 0 && !errLine && !/✘/.test(out);
    console.log(`${ok ? '✔' : '✘'}  ${t}${ok ? '' : `  (Ausgabe: camper-tests/.work/${t}.log)`}`);
    if (!ok) bad.push(t);
  }
  console.log(bad.length ? `\n${bad.length} von ${want.length} fehlgeschlagen: ${bad.join(', ')}` : `\nAlle ${want.length} Tests bestanden.`);
  stop();
  process.exit(bad.length ? 1 : 0);
})();
