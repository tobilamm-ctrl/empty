/*
 * Baut ein fertiges Paket mit eingebautem Node.js – auf dem Mini-PC muss nichts installiert werden.
 *   node tools/paket.js            → paket/Fotobox-Windows.zip   (Doppelklick auf „Fotobox-starten.bat“)
 *   node tools/paket.js --linux    → paket/Fotobox-Linux.zip     (zum Testen auf Linux: ./fotobox-starten.sh)
 * Braucht beim Bauen Internet (Node.js von nodejs.org, Pakete von npm) und unter Linux/macOS die Befehle unzip bzw. tar.
 * Die Node.js-Datei wird mit der Prüfsumme von nodejs.org kontrolliert.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { zip } = require('../server/zip');

const NODE_VERSION = 'v24.22.2'; // Node.js 24 LTS („Krypton“)
const WURZEL = path.join(__dirname, '..');
const linux = process.argv.includes('--linux');
const ziel = linux ? { os: 'linux', cpu: 'x64', datei: `node-${NODE_VERSION}-linux-x64.tar.xz`, name: 'Fotobox-Linux' }
  : { os: 'win32', cpu: 'x64', datei: `node-${NODE_VERSION}-win-x64.zip`, name: 'Fotobox-Windows' };
const AUSGABE = path.join(WURZEL, 'paket');
const CACHE = path.join(AUSGABE, 'cache');
const BAU = path.join(AUSGABE, ziel.name);

async function laden(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function nodeHolen() {
  fs.mkdirSync(CACHE, { recursive: true });
  const datei = path.join(CACHE, ziel.datei);
  const summen = (await laden(`https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt`)).toString();
  const soll = (summen.split('\n').find((z) => z.endsWith('  ' + ziel.datei)) || '').split(' ')[0];
  if (!soll) throw new Error('Keine Prüfsumme für ' + ziel.datei);
  if (!fs.existsSync(datei)) { console.log('Lade', ziel.datei, '…'); fs.writeFileSync(datei, await laden(`https://nodejs.org/dist/${NODE_VERSION}/${ziel.datei}`)); }
  const ist = crypto.createHash('sha256').update(fs.readFileSync(datei)).digest('hex');
  if (ist !== soll) { fs.unlinkSync(datei); throw new Error('Prüfsumme von Node.js stimmt nicht – Datei gelöscht, bitte neu bauen.'); }
  return datei;
}

function kopieren(von, nach) {
  fs.cpSync(von, nach, { recursive: true, filter: (q) => !/(^|[\\/])(daten|paket|node_modules)([\\/]|$)/.test(path.relative(WURZEL, q)) });
}

function alleDateien(ordner, basis = ordner) {
  return fs.readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(ordner, e.name);
    return e.isDirectory() ? alleDateien(p, basis) : [path.relative(basis, p)];
  });
}

const START_WINDOWS = {
  'Fotobox-starten.bat': `@echo off\r\ncd /d "%~dp0"\r\ntitle Fotobox\r\necho Fotobox startet ... Dieses Fenster bitte offen lassen.\r\n"%~dp0node\\node.exe" server\\index.js\r\necho.\r\necho Die Fotobox wurde beendet.\r\npause\r\n`,
  'Grosser-Bildschirm-Vollbild.bat': `@echo off\r\nrem Oeffnet den grossen Bildschirm im Vollbild (Microsoft Edge, Kiosk-Modus). Beenden mit Alt+F4.\r\nrem Wartet vorher, bis die Fotobox laeuft. Toene duerfen ohne Klick abgespielt werden (autoplay-policy).\r\n:warten\r\ncurl -s -o nul http://localhost:8080/buehne\r\nif errorlevel 1 (timeout /t 2 /nobreak >nul & goto warten)\r\nstart "" msedge --kiosk http://localhost:8080/buehne --edge-kiosk-type=fullscreen --no-first-run --autoplay-policy=no-user-gesture-required\r\n`,
  'Simulator-oeffnen.bat': `@echo off\r\nstart "" http://localhost:8080/simulator\r\n`,
};
const START_LINUX = {
  'fotobox-starten.sh': '#!/bin/sh\ncd "$(dirname "$0")"\nexec ./node/bin/node server/index.js\n',
};

async function bauen() {
  const nodeArchiv = await nodeHolen();
  fs.rmSync(BAU, { recursive: true, force: true });
  fs.mkdirSync(BAU, { recursive: true });
  ['server', 'web', 'schriften', 'tools'].forEach((o) => kopieren(path.join(WURZEL, o), path.join(BAU, o)));
  ['config.json', 'package.json', 'README.md'].forEach((d) => fs.copyFileSync(path.join(WURZEL, d), path.join(BAU, d)));
  fs.rmSync(path.join(BAU, 'tools', 'paket.js'));

  // Node.js: nur das Programm selbst (npm wird zum Betrieb nicht gebraucht)
  fs.mkdirSync(path.join(BAU, 'node', linux ? 'bin' : ''), { recursive: true });
  if (linux) execFileSync('tar', ['-xJf', nodeArchiv, '-C', path.join(BAU, 'node', 'bin'), '--strip-components=2', `node-${NODE_VERSION}-linux-x64/bin/node`]);
  else execFileSync('unzip', ['-q', '-j', nodeArchiv, `node-${NODE_VERSION}-win-x64/node.exe`, `node-${NODE_VERSION}-win-x64/LICENSE`, '-d', path.join(BAU, 'node')]);

  // Pakete passend zum Zielsystem (Bildbearbeitung hat für jedes System eine eigene Programmdatei)
  console.log('Installiere Pakete für', ziel.os, '…');
  execFileSync('npm', ['install', '--omit=dev', `--os=${ziel.os}`, `--cpu=${ziel.cpu}`, '--no-audit', '--no-fund', '--no-package-lock'], { cwd: BAU, stdio: 'inherit', shell: process.platform === 'win32' });
  const canvas = path.join(BAU, 'node_modules', '@napi-rs', linux ? 'canvas-linux-x64-gnu' : 'canvas-win32-x64-msvc');
  if (!fs.existsSync(canvas)) throw new Error('Bildbearbeitung für das Zielsystem fehlt: ' + canvas);

  const starter = linux ? START_LINUX : START_WINDOWS;
  Object.entries(starter).forEach(([n, t]) => fs.writeFileSync(path.join(BAU, n), t, { mode: 0o755 }));

  console.log('Packe', ziel.name + '.zip', '…');
  const eintraege = alleDateien(BAU).map((rel) => ({ name: `${ziel.name}/${rel.split(path.sep).join('/')}`, daten: fs.readFileSync(path.join(BAU, rel)), packen: true, modus: fs.statSync(path.join(BAU, rel)).mode & 0o777 }));
  const datei = path.join(AUSGABE, ziel.name + '.zip');
  fs.writeFileSync(datei, zip(eintraege));
  console.log(`Fertig: ${datei} (${(fs.statSync(datei).size / 1e6).toFixed(1)} MB, ${eintraege.length} Dateien)`);
}

bauen().catch((e) => { console.error('Fehler:', e.message); process.exit(1); });
