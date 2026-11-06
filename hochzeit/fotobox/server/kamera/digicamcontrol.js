/*
 * Echte Kamera unter Windows über digiCamControl (kostenlos, https://digicamcontrol.com).
 * UNGETESTET – muss mit der Canon 200D am Mini-PC ausprobiert werden (siehe README, „Kamera einrichten“).
 *
 * Annahmen: In digiCamControl ist unter Einstellungen → Webserver der Webserver eingeschaltet (Port 5513),
 * und die Fotos werden in `ordner` gespeichert. Auslösen über „/?CMD=Capture“, Livebild über „/liveview.jpg“
 * (dafür muss das Livebild-Fenster offen sein: „/?CMD=LiveViewWnd_Show“).
 */
'use strict';
const fs = require('fs');
const path = require('path');

function kameraDigicamcontrol({ url, ordner }) {
  let letzterFehler = null;
  const holen = async (pfad) => {
    const r = await fetch(url + pfad, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`digiCamControl antwortet mit ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  };
  const neueste = () => {
    if (!fs.existsSync(ordner)) return null;
    const dateien = fs.readdirSync(ordner).filter((f) => /\.jpe?g$/i.test(f))
      .map((f) => ({ f, t: fs.statSync(path.join(ordner, f)).mtimeMs })).sort((a, b) => b.t - a.t);
    return dateien[0] || null;
  };
  return {
    name: 'digiCamControl',
    async start() {
      try { await holen('/?CMD=LiveViewWnd_Show'); letzterFehler = null; } catch (e) { letzterFehler = 'Kamera nicht erreichbar: ' + e.message; }
    },
    neueSzene() {},
    async livebild() {
      try { const b = await holen('/liveview.jpg'); letzterFehler = null; return b; } catch (e) { letzterFehler = 'Kein Livebild: ' + e.message; throw e; }
    },
    async ausloesen() {
      const vorher = neueste();
      await holen('/?CMD=Capture');
      const ende = Date.now() + 15000;
      while (Date.now() < ende) {
        await new Promise((r) => setTimeout(r, 250));
        const jetzt = neueste();
        if (jetzt && (!vorher || jetzt.f !== vorher.f || jetzt.t > vorher.t)) {
          await new Promise((r) => setTimeout(r, 400)); // Datei fertig schreiben lassen
          letzterFehler = null;
          return fs.readFileSync(path.join(ordner, jetzt.f));
        }
      }
      letzterFehler = 'Kamera hat kein Foto geliefert';
      throw new Error(letzterFehler);
    },
    status() { return letzterFehler ? { ok: false, text: letzterFehler } : { ok: true, text: 'bereit (digiCamControl)' }; },
    fehlerSetzen() {},
  };
}

module.exports = { kameraDigicamcontrol };
