/*
 * Fotos auf die persönliche Gästeseite des Sitzplantools hochladen (nach der Feier, braucht Internet).
 * Jedes Foto geht mit den Einladungscodes (Haushalte) der Gäste darauf hoch; jeder Haushalt sieht dort nur seine Fotos.
 * Schnittstelle (Sitzplantool, api.php): fotobox_list, fotobox_upload, fotobox_delete mit dem Schlüssel f.
 *
 * abgleichen({ speicher, adresse, schluessel, log }) → { hochgeladen, aktualisiert, geloescht, ohneZuordnung, fehler: [text] }
 * pruefen({ adresse, schluessel }) → { ok, fotos, limit, fehler }
 */
'use strict';
const fs = require('fs');

const url = (adresse, aktion) => `${String(adresse).replace(/\/+$/, '').replace(/\/api\.php$/, '')}/api.php?a=${aktion}`;

async function anfrage(adresse, aktion, { schluessel, body, methode = 'GET' }) {
  const ziel = url(adresse, aktion) + (methode === 'GET' ? `&f=${encodeURIComponent(schluessel)}` : '');
  const r = await fetch(ziel, {
    method: methode,
    headers: methode === 'POST' ? { 'Content-Type': 'application/json' } : {},
    body: methode === 'POST' ? JSON.stringify(Object.assign({ f: schluessel }, body)) : undefined,
    signal: AbortSignal.timeout(90000),
  });
  let d; try { d = await r.json(); } catch (e) { throw new Error(`Antwort ist kein JSON (HTTP ${r.status}) – stimmt die Adresse?`); }
  if (!d.ok) throw new Error(d.error || d.code || `HTTP ${r.status}`);
  return d;
}

// Einladungscodes der Personen auf einem Foto (Gäste ohne Einladung zählen nicht)
function codesVon(speicher, f) {
  const g = speicher.gaesteNamen();
  return [...new Set(speicher.personenVon(f).map((id) => (g.get(id) || {}).einladung).filter(Boolean))].sort();
}

async function pruefen({ adresse, schluessel }) {
  if (!adresse || !schluessel) return { ok: false, fehler: 'Adresse und Schlüssel fehlen.' };
  try { const d = await anfrage(adresse, 'fotobox_list', { schluessel }); return { ok: true, fotos: d.photos.length, limit: d.limit }; } catch (e) { return { ok: false, fehler: e.message }; }
}

async function abgleichen({ speicher, adresse, schluessel, log = () => {} }) {
  const erg = { hochgeladen: 0, aktualisiert: 0, geloescht: 0, ohneZuordnung: 0, fehler: [] };
  if (!adresse || !schluessel) { erg.fehler.push('Adresse und Schlüssel fehlen.'); return erg; }
  // Codes vergleichbar machen (der Server speichert sie evtl. anders geschrieben)
  const norm = (c) => String(c).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const online = new Map((await anfrage(adresse, 'fotobox_list', { schluessel })).photos.map((p) => [p.id, (p.codes || []).map(norm).sort()]));
  const lokal = new Set();
  for (const f of speicher.fotos().filter((x) => x.behalten && !x.ausgeblendet)) {
    const codes = codesVon(speicher, f);
    if (!codes.length) { erg.ohneZuordnung++; continue; }
    lokal.add(f.id);
    const vorher = online.get(f.id);
    if (vorher && vorher.join() === codes.join()) continue;
    try {
      const body = { id: f.id, codes, zeit: f.zeit };
      if (!vorher) body.bild = 'data:image/jpeg;base64,' + fs.readFileSync(speicher.druckDatei(f.id)).toString('base64');
      await anfrage(adresse, 'fotobox_upload', { schluessel, body, methode: 'POST' });
      if (vorher) erg.aktualisiert++; else erg.hochgeladen++;
      speicher.fotoAendern(f.id, { online: { zeit: new Date().toISOString(), codes } });
    } catch (e) { erg.fehler.push(`${f.id}: ${e.message}`); if (/limit|bad_token|off/i.test(e.message)) break; }
  }
  // Online, aber hier ausgeblendet, gelöscht oder ohne Zuordnung → online löschen
  for (const id of online.keys()) {
    if (lokal.has(id)) continue;
    try { await anfrage(adresse, 'fotobox_delete', { schluessel, body: { id }, methode: 'POST' }); erg.geloescht++; } catch (e) { erg.fehler.push(`${id}: ${e.message}`); }
  }
  log('info', `Gästeseite: ${erg.hochgeladen} hochgeladen, ${erg.aktualisiert} aktualisiert, ${erg.geloescht} gelöscht, ${erg.ohneZuordnung} ohne Zuordnung, ${erg.fehler.length} Fehler`);
  return erg;
}

module.exports = { abgleichen, pruefen, codesVon };
