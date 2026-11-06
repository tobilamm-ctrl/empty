/*
 * Drucker-Treiber: druckt eine Bilddatei auf einem Drucker. Schnittstelle: drucken(datei) → Promise (fertig oder Fehler).
 *   simulator: braucht dauerMs, fehlerSetzen(text) lässt den nächsten Druck scheitern (z. B. Papierstau).
 *   windows:   stilles Drucken über SumatraPDF (https://www.sumatrapdfreader.org). UNGETESTET mit dem Selphy –
 *              vorher einmal von Hand ausprobieren (README, „Drucker einrichten“).
 */
'use strict';
const { execFile } = require('child_process');

function druckerSimulator(name, dauerMs) {
  let fehler = null;
  return {
    name,
    drucken() {
      return new Promise((ok, nein) => setTimeout(() => (fehler ? nein(new Error(fehler)) : ok()), dauerMs));
    },
    fehlerSetzen(text) { fehler = text || null; },
  };
}

function druckerWindows(name, sumatra) {
  return {
    name,
    drucken(datei) {
      return new Promise((ok, nein) => {
        execFile(sumatra, ['-print-to', name, '-print-settings', 'fit', '-silent', datei], { timeout: 120000 },
          (err) => (err ? nein(new Error('Druck fehlgeschlagen: ' + err.message)) : ok()));
      });
    },
    fehlerSetzen() {},
  };
}

module.exports = { druckerSimulator, druckerWindows };
