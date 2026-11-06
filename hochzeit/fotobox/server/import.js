/*
 * Import aus dem Sitzplantool: Datei „…sitzplan.json“ (Datei → Speichern) → Gäste mit Tisch und Gestaltung.
 * sitzplanLesen(text) → { namen, datum, ort, farbwelt, akzent, schriftstil, gaeste: [{ id, vorname, nachname, name, tisch }],
 *                         tische: [name], schriften: [{ name, endung, daten: Buffer }] }
 */
'use strict';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function datumText(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${+m[3]}. ${MONATE[+m[2] - 1]} ${m[1]}` : String(iso || '');
}

function sitzplanLesen(text) {
  let p;
  try { p = JSON.parse(text); } catch (e) { throw new Error('Die Datei ist keine Sitzplan-Datei (kein gültiges JSON).'); }
  if (!p || typeof p !== 'object' || !p.settings || !Array.isArray(p.guests)) throw new Error('Die Datei ist keine Sitzplan-Datei.');
  const s = p.settings;
  const tische = new Map();
  (Array.isArray(p.items) ? p.items : []).forEach((it) => { if (it && it.id) tische.set(it.id, it.name || ''); });
  const gaeste = p.guests.filter((g) => g && (g.first || g.last)).map((g) => {
    const vorname = String(g.first || '').trim(), nachname = String(g.last || '').trim();
    return { id: g.id, vorname, nachname, name: [vorname, nachname].filter(Boolean).join(' '), tisch: (g.seat && tische.get(g.seat.item)) || '' };
  });
  const schriften = [];
  const assets = p.assets || {};
  (Array.isArray(s.customFonts) ? s.customFonts : []).forEach((f) => {
    const url = f && f.asset && assets[f.asset];
    const m = typeof url === 'string' && /^data:([^;,]*)(;base64)?,(.*)$/s.exec(url);
    if (!m || !f.name) return;
    const endung = /woff2/.test(m[1]) ? 'woff2' : /woff/.test(m[1]) ? 'woff' : /otf|opentype/.test(m[1]) ? 'otf' : 'ttf';
    schriften.push({ name: String(f.name).replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Eigene Schrift', endung, daten: Buffer.from(m[3], m[2] ? 'base64' : 'utf8') });
  });
  return {
    namen: [s.partner1, s.partner2].map((n) => String(n || '').trim()).filter(Boolean).join(' & '),
    datum: datumText(s.date),
    ort: String(s.place || ''),
    farbwelt: s.theme || '',
    akzent: s.accent || '',
    schriftstil: s.font || '',
    gaeste,
    tische: [...new Set(gaeste.map((g) => g.tisch).filter(Boolean))],
    schriften,
  };
}

module.exports = { sitzplanLesen, datumText };
