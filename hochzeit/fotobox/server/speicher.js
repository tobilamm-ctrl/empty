/*
 * Speicher im Datenordner:
 *   einstellungen.json, fotos.json, gaeste.json, drucker.json (Papierstand), schriften/ (aus dem Import),
 *   fotos/<id>/aufnahme-1.jpg … und druck.jpg
 * Jedes Foto wird sofort gespeichert (auch verworfene – „behalten: false“) und, wenn eingestellt,
 * zusätzlich in den Sicherungsordner (z. B. USB-Stick) kopiert.
 */
'use strict';
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { zip } = require('./zip');

const STANDARD = {
  namen: 'Anna & Max',
  datum: '14. Juni 2027',
  farbwelt: 'champagner',
  akzent: '',
  schriftstil: 'romantisch',
  namenSchrift: '',
  maxAbzuege: 4,
  maxNochmal: 2,
  streifen: true,
  schwarzweiss: true,
  diashowVerzoegerungSek: 0,
  knopfModus: 'einzel',
  knopfFilter: 'farbe',
};

const zweistellig = (n) => String(n).padStart(2, '0');
const zeitstempel = (d) => `${d.getFullYear()}-${zweistellig(d.getMonth() + 1)}-${zweistellig(d.getDate())}_${zweistellig(d.getHours())}-${zweistellig(d.getMinutes())}-${zweistellig(d.getSeconds())}`;

class Speicher {
  constructor(ordner, { sicherung = '', log = () => {} } = {}) {
    this.ordner = ordner;
    this.sicherung = sicherung;
    this.log = log;
    fs.mkdirSync(path.join(ordner, 'fotos'), { recursive: true });
    fs.mkdirSync(path.join(ordner, 'schriften'), { recursive: true });
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
    Object.keys(teil || {}).forEach((k) => { if (k in STANDARD) this._einst[k] = teil[k]; });
    this._schreiben('einstellungen.json', this._einst);
    return this.einstellungen();
  }

  gaeste() { return this._gaeste.slice(); }
  gaesteSetzen(liste) { this._gaeste = liste; this._schreiben('gaeste.json', liste); }

  druckerStand() { return this._lesen('drucker.json', null); }
  druckerStandSetzen(papier) { this._schreiben('drucker.json', papier); }

  schriftenOrdner() { return path.join(this.ordner, 'schriften'); }
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
    const foto = { id, zeit: jetzt.toISOString(), modus, filter, behalten: false, inDiashow: true, ausgeblendet: false, abzuege: 0 };
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

  // Fotos für die Diashow: behalten, nicht ausgeblendet, vom Gast freigegeben, Wartezeit abgelaufen
  diashow(jetzt = Date.now()) {
    const warten = (this._einst.diashowVerzoegerungSek || 0) * 1000;
    const sichtbar = (f) => f.behalten && f.inDiashow && !f.ausgeblendet;
    return {
      fotos: this._fotos.filter((f) => sichtbar(f) && jetzt - Date.parse(f.zeit) >= warten).map((f) => f.id).reverse(),
      gleich: this._fotos.filter((f) => sichtbar(f) && jetzt - Date.parse(f.zeit) < warten).length,
    };
  }

  // ZIP mit allen behaltenen Fotos (Druckbild) und den einzelnen Aufnahmen
  async exportZip() {
    const eintraege = [];
    for (const f of this._fotos.filter((x) => x.behalten)) {
      const zeit = new Date(f.zeit);
      try { eintraege.push({ name: `druckbilder/${f.id}.jpg`, daten: await fsp.readFile(this.druckDatei(f.id)), zeit }); } catch (e) { /* fehlt */ }
      for (const a of (await fsp.readdir(this.fotoOrdner(f.id)).catch(() => [])).filter((x) => x.startsWith('aufnahme'))) {
        eintraege.push({ name: `aufnahmen/${f.id}_${a}`, daten: await fsp.readFile(path.join(this.fotoOrdner(f.id), a)), zeit });
      }
    }
    return zip(eintraege);
  }
}

module.exports = { Speicher, STANDARD };
