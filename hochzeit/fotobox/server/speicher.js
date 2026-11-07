/*
 * Speicher im Datenordner:
 *   einstellungen.json, fotos.json, gaeste.json, drucker.json (Papierstand), schriften/ (aus dem Import),
 *   fotos/<id>/aufnahme-1.jpg …, druck.jpg und ggf. unterschrift.png (Gästebuch), eigene/ (eigene Fotos für die Diashow)
 * Jedes Foto wird sofort gespeichert (auch verworfene – „behalten: false“) und, wenn eingestellt,
 * zusätzlich in den Sicherungsordner (z. B. USB-Stick) kopiert.
 */
'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { zip } = require('./zip');

const STANDARD = {
  namen: 'Anna & Max',
  datum: '14. Juni 2027',
  farbwelt: 'champagner',
  akzent: '',
  schriftstil: 'romantisch',
  namenSchrift: '',
  // Ablauf
  countdownSek: 3,
  leerlaufSek: 45,
  maxNochmal: 2,
  streifen: true,
  schwarzweiss: true,
  knopfModus: 'einzel',
  knopfFilter: 'farbe',
  knopfGelernt: [],
  pause: false,
  oeffnungAb: '',
  oeffnungBis: '',
  // Drucken
  druckenAn: true,
  maxAbzuege: 4,
  maxAbzuegeGesamt: 0,
  druckerAus: [],
  druckLayout: 'rahmen',
  druckVersatzX: 0,
  druckVersatzY: 0,
  logoStattNamen: false,
  // Diashow und Anzeige
  diashowVerzoegerungSek: 0,
  diashowSek: 5,
  diashowFreigabe: false,
  eigeneAlle: 3,
  spiegeln: true,
  // Filter (Farbe gibt es immer)
  filterVintage: true,
  filterWeich: false,
  // Töne, Posen, QR-Code, Gästebuch
  toene: 'buehne',
  lautstaerke: 70,
  posenAn: true,
  posenListe: [
    'Alle machen ein Herz mit den Händen', 'Tut so, als hättet ihr den Brautstrauß gefangen', 'Großes Staunen!',
    'Alle schauen nach links', 'Gruppen-Umarmung', 'Euer bestes Tanz-Foto', 'Zeigt eure schönsten Zähne',
    'Alle zeigen auf die Person mit der besten Frisur', 'Jubel wie beim Torschuss', 'Ganz vornehm, kleiner Finger hoch',
    'Flüstert euch ein Geheimnis zu', 'Alle machen die Augen zu', 'Superhelden-Pose', 'Tut so, als wäre es eiskalt',
    'Prost auf das Brautpaar!',
  ].join('\n'),
  qrAn: true,
  wlanName: '',
  wlanPasswort: '',
  adresse: '',
  gaestebuchAn: true,
  // Texte
  textStartTitel: 'Lächeln, bitte!',
  textStart: 'Euer Bild seht ihr groß auf dem Bildschirm über der Kamera.',
  textBuehne: 'Zum Mitmachen aufs iPad tippen',
  textDanke: 'Danke!',
  textDankeKlein: 'Viel Spaß noch beim Feiern.',
  textPause: 'Kurze Pause – gleich geht’s weiter!',
  // Service
  pin: '',
};

// Erlaubte Bereiche für Zahlen (Werte außerhalb werden auf den Rand gesetzt)
const GRENZEN = {
  countdownSek: [1, 10], leerlaufSek: [15, 600], maxNochmal: [0, 5], maxAbzuege: [1, 10], maxAbzuegeGesamt: [0, 100000],
  druckVersatzX: [-5, 5], druckVersatzY: [-5, 5], diashowVerzoegerungSek: [0, 3600], diashowSek: [2, 60], eigeneAlle: [1, 20], lautstaerke: [0, 100],
};
const NACHKOMMA = { druckVersatzX: 10, druckVersatzY: 10 };
const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

function bereinigen(k, v) {
  const art = Array.isArray(STANDARD[k]) ? 'liste' : typeof STANDARD[k];
  if (art === 'number') {
    if (v === '' || v === null || typeof v === 'boolean') return undefined;
    const n = Number(v); if (!Number.isFinite(n)) return undefined; // ungültige Zahlen ignorieren
    const [min, max] = GRENZEN[k] || [0, Infinity], f = NACHKOMMA[k] || 1;
    return Math.min(max, Math.max(min, Math.round(n * f) / f));
  }
  if (art === 'boolean') return v === true || v === 'true' || v === 1 || v === '1';
  if (art === 'liste') {
    if (!Array.isArray(v)) return undefined;
    return k === 'druckerAus' ? [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n >= 0))] : [...new Set(v.map(String))].slice(0, 10);
  }
  const t = String(v == null ? '' : v).slice(0, k === 'posenListe' ? 3000 : 300);
  if (k === 'oeffnungAb' || k === 'oeffnungBis') return t === '' || UHRZEIT.test(t) ? t : undefined;
  if (k === 'pin') return t === '' || /^\d{4,8}$/.test(t) ? t : undefined;
  if (k === 'toene') return ['aus', 'buehne', 'ipad', 'beide'].includes(t) ? t : undefined;
  if (k === 'adresse') return t === '' || /^https?:\/\/[^\s/]+$/.test(t.replace(/\/$/, '')) ? t.replace(/\/$/, '') : undefined;
  return t;
}

const zweistellig = (n) => String(n).padStart(2, '0');
const zeitstempel = (d) => `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}_${zweistellig(d.getHours())}-${zweistellig(d.getMinutes())}-${zweistellig(d.getSeconds())}`;

class Speicher {
  constructor(ordner, { sicherung = '', log = () => {} } = {}) {
    this.ordner = ordner;
    this.sicherung = sicherung;
    this.log = log;
    fs.mkdirSync(path.join(ordner, 'fotos'), { recursive: true });
    fs.mkdirSync(path.join(ordner, 'schriften'), { recursive: true });
    fs.mkdirSync(path.join(ordner, 'eigene'), { recursive: true });
    this._einst = Object.assign({}, STANDARD, this._lesen('einstellungen.json', {}));
    this._fotos = this._lesen('fotos.json', []);
    this._gaeste = this._lesen('gaeste.json', []);
  }

  _lesen(datei, standard) {
    try { return JSON.parse(fs.readFileSync(path.join(this.ordner, datei), 'utf8')); } catch (e) { return standard; }
  }
  _schreiben(datei, wert) {
    const ziel = path.join(this.ordner, datei), tmp = ziel + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(wert, null, 1)); fs.renameSync(tmp, ziel); // nie halb geschriebene Dateien
  }

  einstellungen() { return Object.assign({}, this._einst); }
  einstellungenSetzen(teil) {
    Object.keys(teil || {}).forEach((k) => {
      if (!(k in STANDARD)) return;
      const v = bereinigen(k, teil[k]);
      if (v !== undefined) this._einst[k] = v;
    });
    this._schreiben('einstellungen.json', this._einst);
    return this.einstellungen();
  }

  gaeste() { return this._gaeste.slice(); }
  gaesteSetzen(liste) { this._gaeste = liste; this._schreiben('gaeste.json', liste); }

  druckerStand() { return this._lesen('drucker.json', null); }
  druckerStandSetzen(papier) { this._schreiben('drucker.json', papier); }

  schriftenOrdner() { return path.join(this.ordner, 'schriften'); }
  logoDatei() { return path.join(this.ordner, 'logo.png'); }
  logo() { try { return fs.readFileSync(this.logoDatei()); } catch (e) { return null; } }
  logoSetzen(daten) { if (daten) fs.writeFileSync(this.logoDatei(), daten); else fs.rmSync(this.logoDatei(), { force: true }); }

  // Freier Platz im Datenordner und im Sicherungsordner (USB-Stick)
  async platz() {
    const info = async (ordner) => {
      try { const s = await fsp.statfs(ordner); return { ok: true, freiGB: +(s.bavail * s.bsize / 1e9).toFixed(1), gesamtGB: +(s.blocks * s.bsize / 1e9).toFixed(1) }; } catch (e) { return { ok: false, fehler: e.code || e.message }; }
    };
    return { daten: Object.assign({ pfad: this.ordner }, await info(this.ordner)), sicherung: this.sicherung ? Object.assign({ pfad: this.sicherung }, await info(this.sicherung)) : null };
  }

  schriftSpeichern(name, endung, daten) { fs.writeFileSync(path.join(this.schriftenOrdner(), `${name}.${endung}`), daten); }

  fotos() { return this._fotos.slice(); }
  foto(id) { return this._fotos.find((f) => f.id === id) || null; }
  fotoOrdner(id) { return path.join(this.ordner, 'fotos', id); }
  druckDatei(id) { return path.join(this.fotoOrdner(id), 'druck.jpg'); }

  async neuesFoto({ modus, filter, aufnahmen, druck }) {
    const jetzt = new Date();
    let id = `${zeitstempel(jetzt)}_${modus}`, n = 2;
    while (this.foto(id)) id = `${zeitstempel(jetzt)}_${modus}-${n++}`;
    const ordner = this.fotoOrdner(id);
    await fsp.mkdir(ordner, { recursive: true });
    await Promise.all(aufnahmen.map((b, i) => fsp.writeFile(path.join(ordner, `aufnahme-${i + 1}.jpg`), b)));
    await fsp.writeFile(path.join(ordner, 'druck.jpg'), druck);
    const foto = { id, zeit: jetzt.toISOString(), modus, filter, behalten: false, inDiashow: true, ausgeblendet: false, abzuege: 0,
      schluessel: crypto.randomBytes(6).toString('hex') }; // für den Download-Link per QR-Code
    this._fotos.push(foto);
    this._schreiben('fotos.json', this._fotos);
    this._sichern(id);
    return foto;
  }

  fotoAendern(id, teil) {
    const f = this.foto(id); if (!f) return null;
    Object.assign(f, teil);
    this._schreiben('fotos.json', this._fotos);
    return f;
  }

  async _sichern(id) {
    if (!this.sicherung) return;
    try {
      const ziel = path.join(this.sicherung, 'fotobox-sicherung', id);
      await fsp.mkdir(ziel, { recursive: true });
      for (const f of await fsp.readdir(this.fotoOrdner(id))) await fsp.copyFile(path.join(this.fotoOrdner(id), f), path.join(ziel, f));
    } catch (e) {
      this.log('warnung', `Sicherung fehlgeschlagen (${e.message}). Ist der USB-Stick eingesteckt?`);
    }
  }

  // Fotos für die Diashow: behalten, nicht ausgeblendet, vom Gast freigegeben, Wartezeit abgelaufen.
  // bilder: Adressen in Abspielreihenfolge, nach jedem n-ten Fotobox-Foto ein eigenes Foto
  diashow(jetzt = Date.now()) {
    const warten = (this._einst.diashowVerzoegerungSek || 0) * 1000, freigabe = this._einst.diashowFreigabe;
    const sichtbar = (f) => f.behalten && f.inDiashow && !f.ausgeblendet && (!freigabe || f.freigegeben);
    const fotos = this._fotos.filter((f) => sichtbar(f) && jetzt - Date.parse(f.zeit) >= warten).map((f) => f.id).reverse();
    const eigene = this.eigene().map((d) => `/eigene/${encodeURIComponent(d)}`), alle = this._einst.eigeneAlle || 3;
    const bilder = [];
    if (!fotos.length) bilder.push(...eigene);
    fotos.forEach((id, i) => {
      bilder.push(`/fotos/${id}/druck.jpg`);
      if (eigene.length && (i + 1) % alle === 0) bilder.push(eigene[((i + 1) / alle - 1) % eigene.length]);
    });
    return { fotos, bilder, gleich: this._fotos.filter((f) => sichtbar(f) && jetzt - Date.parse(f.zeit) < warten).length };
  }

  // ---------- Eigene Fotos für die Diashow ----------
  eigeneOrdner() { return path.join(this.ordner, 'eigene'); }
  eigene() { try { return fs.readdirSync(this.eigeneOrdner()).filter((d) => /\.(jpe?g|png)$/i.test(d)).sort(); } catch (e) { return []; } }
  eigenesSpeichern(daten, endung) {
    const datei = `eigen-${zeitstempel(new Date())}-${crypto.randomBytes(3).toString('hex')}.${endung}`;
    fs.writeFileSync(path.join(this.eigeneOrdner(), datei), daten);
    return datei;
  }
  eigenesLoeschen(datei) { if (this.eigene().includes(datei)) fs.rmSync(path.join(this.eigeneOrdner(), datei)); }

  // ---------- Gästebuch ----------
  unterschriftDatei(id) { return path.join(this.fotoOrdner(id), 'unterschrift.png'); }
  gaestebuchSpeichern(id, { gaeste, namenFrei, gruss, unterschrift }) {
    const f = this.foto(id); if (!f) return null;
    const bekannt = new Set(this._gaeste.map((g) => g.id));
    if (unterschrift) fs.writeFileSync(this.unterschriftDatei(id), unterschrift);
    return this.fotoAendern(id, {
      gaestebuch: {
        gaeste: [...new Set((Array.isArray(gaeste) ? gaeste : []).map(String))].filter((g) => bekannt.has(g)).slice(0, 40),
        namenFrei: String(namenFrei || '').slice(0, 200), gruss: String(gruss || '').slice(0, 300),
        unterschrift: !!unterschrift, zeit: new Date().toISOString(),
      },
    });
  }
  // Wer ist auf welchem Foto? (aus dem Gästebuch; nur behaltene Fotos)
  gaesteNamen() { return new Map(this._gaeste.map((g) => [g.id, g])); }

  // ---------- Statistik ----------
  statistik() {
    const fotos = this._fotos.filter((f) => f.behalten), g = this.gaesteNamen();
    const proStunde = {}, filter = {}, genannt = {};
    fotos.forEach((f) => {
      const h = new Date(f.zeit).getHours(); proStunde[h] = (proStunde[h] || 0) + 1;
      filter[f.filter || 'farbe'] = (filter[f.filter || 'farbe'] || 0) + 1;
      ((f.gaestebuch && f.gaestebuch.gaeste) || []).forEach((id) => { genannt[id] = (genannt[id] || 0) + 1; });
    });
    const stunden = Object.keys(proStunde).map(Number).sort((a, b) => ((a + 12) % 24) - ((b + 12) % 24)); // Abend vor Nacht
    const beliebt = stunden.reduce((m, h) => (m === null || proStunde[h] > proStunde[m] ? h : m), null);
    return {
      fotos: fotos.length, verworfen: this._fotos.length - fotos.length,
      einzel: fotos.filter((f) => f.modus !== 'streifen').length, streifen: fotos.filter((f) => f.modus === 'streifen').length,
      abzuege: this._fotos.reduce((s, f) => s + (f.abzuege || 0), 0), filter,
      proStunde: stunden.map((h) => ({ stunde: h, anzahl: proStunde[h] })), beliebtesteStunde: beliebt,
      gaestebuch: fotos.filter((f) => f.gaestebuch).length,
      top: Object.entries(genannt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ name: (g.get(id) || {}).name || '?', anzahl: n })),
      gaesteGesamt: this._gaeste.length, gaesteOhneFoto: this._gaeste.filter((x) => !genannt[x.id]).length,
    };
  }

  // ---------- Dankeskarten: je Gast ein Foto-Vorschlag (neuestes Foto mit dem Gast, Einzelfoto bevorzugt) ----------
  dankeskarten() {
    const fotos = this._fotos.filter((f) => f.behalten && f.gaestebuch).slice().reverse();
    return this._gaeste.map((x) => {
      const mit = fotos.filter((f) => f.gaestebuch.gaeste.includes(x.id));
      const foto = mit.find((f) => f.modus !== 'streifen') || mit[0] || null;
      return { id: x.id, name: x.name, tisch: x.tisch || '', strasse: x.strasse || '', plz: x.plz || '', ort: x.ort || '', foto: foto ? foto.id : null, fotos: mit.length };
    });
  }
  dankeskartenCsv() {
    const z = (t) => `"${String(t).replace(/"/g, '""')}"`;
    return '\ufeff' + [['Name', 'Tisch', 'Straße', 'PLZ', 'Ort', 'Foto', 'Fotos mit diesem Gast'].map(z).join(';')]
      .concat(this.dankeskarten().map((d) => [d.name, d.tisch, d.strasse, d.plz, d.ort, d.foto ? `${d.foto}.jpg` : '', d.fotos].map(z).join(';'))).join('\r\n');
  }

  // ZIP mit allen behaltenen Fotos. sortierung: 'zeit' (Druckbilder + einzelne Aufnahmen),
  // 'tisch' oder 'gast' (Ordner je Tisch bzw. Gast laut Gästebuch, Rest in „ohne Zuordnung“).
  // Dazu immer gaestebuch.csv, die Unterschriften und dankeskarten.csv.
  async exportZip(sortierung = 'zeit') {
    const eintraege = [], g = this.gaesteNamen();
    const ordnerName = (t) => String(t || '').replace(/[\\/:*?"<>|]/g, '').trim() || 'ohne Zuordnung';
    const z = (t) => `"${String(t).replace(/"/g, '""')}"`;
    const buch = [['Foto', 'Zeit', 'Gäste', 'Weitere Namen', 'Gruß', 'Unterschrift'].map(z).join(';')];
    for (const f of this._fotos.filter((x) => x.behalten)) {
      const zeit = new Date(f.zeit);
      let druck; try { druck = await fsp.readFile(this.druckDatei(f.id)); } catch (e) { continue; }
      const gb = f.gaestebuch, leute = gb ? gb.gaeste.map((id) => g.get(id)).filter(Boolean) : [];
      if (sortierung === 'tisch' || sortierung === 'gast') {
        const gruppen = sortierung === 'tisch' ? [...new Set(leute.map((x) => x.tisch || 'ohne Tisch'))] : leute.map((x) => x.name);
        (gruppen.length ? gruppen : ['ohne Zuordnung']).forEach((o) => eintraege.push({ name: `${sortierung === 'tisch' ? 'nach-tisch' : 'nach-gast'}/${ordnerName(o)}/${f.id}.jpg`, daten: druck, zeit }));
      } else {
        eintraege.push({ name: `druckbilder/${f.id}.jpg`, daten: druck, zeit });
        for (const a of (await fsp.readdir(this.fotoOrdner(f.id)).catch(() => [])).filter((x) => x.startsWith('aufnahme'))) {
          eintraege.push({ name: `aufnahmen/${f.id}_${a}`, daten: await fsp.readFile(path.join(this.fotoOrdner(f.id), a)), zeit });
        }
      }
      if (gb) {
        buch.push([`${f.id}.jpg`, zeit.toLocaleString('de-DE'), leute.map((x) => x.name).join(', '), gb.namenFrei, gb.gruss, gb.unterschrift ? `unterschriften/${f.id}.png` : ''].map(z).join(';'));
        if (gb.unterschrift) { try { eintraege.push({ name: `gaestebuch/unterschriften/${f.id}.png`, daten: await fsp.readFile(this.unterschriftDatei(f.id)), zeit }); } catch (e) { /* fehlt */ } }
      }
    }
    eintraege.push({ name: 'gaestebuch/gaestebuch.csv', daten: Buffer.from('\ufeff' + buch.join('\r\n'), 'utf8') });
    if (this._gaeste.length) eintraege.push({ name: 'dankeskarten.csv', daten: Buffer.from(this.dankeskartenCsv(), 'utf8') });
    return zip(eintraege);
  }
}

module.exports = { Speicher, STANDARD, bereinigen };
