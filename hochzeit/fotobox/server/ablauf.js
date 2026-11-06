/*
 * Ablauf der Fotobox (Zustandsautomat). Der Zustand liegt nur hier – iPad, großer Bildschirm und Service-Handy
 * zeigen ihn an und schicken Aktionen. Ansichten:
 *   start → modus → filter → aufnahme → vorschau → druck → drucken → danke → start
 *   stoerung (Kamera ausgefallen) → start
 *
 * new Ablauf({ kamera, drucker, speicher, bild, gestaltung, zeiten, log })
 *   zeiten (ms): countdownSchritt, pause, leerlaufWarnung, leerlauf, danke, knopfSperre, takt
 *   aktion(name, daten)  zustand()  Ereignis 'aenderung'
 */
'use strict';
const EventEmitter = require('events');

const LEERLAUF_ANSICHTEN = ['modus', 'filter', 'vorschau', 'druck', 'drucken', 'stoerung'];

class Ablauf extends EventEmitter {
  constructor({ kamera, drucker, speicher, bild, gestaltung, zeiten, log = () => {} }) {
    super();
    Object.assign(this, { kamera, drucker, speicher, bild, gestaltungVon: gestaltung, zeiten, log });
    this.z = this._grundzustand();
    this.letzteAktivitaet = Date.now();
    this.letzterKnopf = 0;
    this.sitzung = 0;
    this.diashowVersion = 0;
    this.takt = setInterval(() => this._leerlauf(), zeiten.takt || 1000);
    if (this.takt.unref) this.takt.unref();
    drucker.on('aenderung', () => this._melden());
  }

  _grundzustand() {
    return { ansicht: 'start', modus: 'einzel', filter: 'farbe', bild: null, countdown: null, hinweis: '', blitz: 0,
      foto: null, nochmal: 0, inDiashow: true, anzahl: 1, leerlaufWarnung: null, stoerung: null };
  }
  _melden() { this.emit('aenderung'); }
  _zeige(ansicht, mehr) {
    Object.assign(this.z, mehr || {}, { ansicht, leerlaufWarnung: null });
    this.letzteAktivitaet = Date.now();
    if (ansicht === 'danke') {
      const s = this.sitzung;
      setTimeout(() => { if (this.z.ansicht === 'danke' && this.sitzung === s) this._zeige('start', this._grundzustand()); }, this.zeiten.danke);
    }
    this._melden();
  }
  _warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

  aktion(name, daten) {
    const e = this.speicher.einstellungen(), a = this.z.ansicht;
    this.letzteAktivitaet = Date.now();
    if (this.z.leerlaufWarnung !== null) { this.z.leerlaufWarnung = null; this._melden(); }
    switch (name) {
      case 'aktiv': return;
      case 'knopf': return this._knopf(e);
      case 'start': if (a === 'start') this._beginnen(e); return;
      case 'modus':
        if (a !== 'modus' || !['einzel', 'streifen'].includes(daten)) return;
        this.z.modus = daten;
        return e.schwarzweiss ? this._zeige('filter') : this._aufnehmen('farbe');
      case 'filter':
        if (a === 'filter' && ['farbe', 'sw'].includes(daten)) this._aufnehmen(daten);
        return;
      case 'zurueck':
        if (a === 'modus') this._zeige('start', this._grundzustand());
        else if (a === 'filter') e.streifen ? this._zeige('modus') : this._zeige('start', this._grundzustand());
        return;
      case 'nochmal':
        if (a === 'vorschau' && this.z.nochmal > 0) { this.z.nochmal--; this._aufnehmen(this.z.filter); }
        return;
      case 'inDiashow':
        if (a === 'vorschau') { this.z.inDiashow = !!daten; this._melden(); }
        return;
      case 'weiter':
        if (a !== 'vorschau') return;
        this._behalten();
        return this._zeige('druck', { anzahl: 1 });
      case 'anzahl':
        if (a !== 'druck') return;
        this.z.anzahl = Math.max(1, Math.min(Number(daten) || 1, this._maxAbzuege(e)));
        return this._melden();
      case 'drucken': {
        if (a !== 'druck' || this.drucker.papierGesamt() <= 0) return;
        const neu = this.drucker.drucken(this.speicher.druckDatei(this.z.foto.id), Math.min(this.z.anzahl, this._maxAbzuege(e)), this.z.foto.id);
        const f = this.speicher.foto(this.z.foto.id);
        if (f) this.speicher.fotoAendern(f.id, { abzuege: (f.abzuege || 0) + neu.length });
        return this._zeige('drucken');
      }
      case 'ohneDruck': case 'fertig':
        if (a === 'druck' || a === 'drucken') this._zeige('danke');
        return;
      case 'stoerungOk':
        if (a === 'stoerung') this._zeige('start', this._grundzustand());
        return;
      default:
    }
  }

  _maxAbzuege(e) { return Math.max(1, Math.min(e.maxAbzuege || 1, this.drucker.papierGesamt() || 1)); }

  _beginnen(e) {
    this.sitzung++;
    this.kamera.neueSzene();
    Object.assign(this.z, this._grundzustand(), { nochmal: e.maxNochmal });
    if (e.streifen) this._zeige('modus'); else { this.z.modus = 'einzel'; e.schwarzweiss ? this._zeige('filter') : this._aufnehmen('farbe'); }
  }

  // Bluetooth-Knopf (oder Buzzer): startet den Countdown sofort, fehlende Auswahl kommt aus den Einstellungen
  _knopf(e) {
    const jetzt = Date.now();
    if (jetzt - this.letzterKnopf < (this.zeiten.knopfSperre || 0)) return;
    this.letzterKnopf = jetzt;
    const a = this.z.ansicht;
    if (a === 'start') {
      this.sitzung++; this.kamera.neueSzene();
      Object.assign(this.z, this._grundzustand(), { nochmal: e.maxNochmal, modus: e.streifen ? e.knopfModus : 'einzel' });
      return this._aufnehmen(e.schwarzweiss ? e.knopfFilter : 'farbe');
    }
    if (a === 'modus') { this.z.modus = e.knopfModus; return this._aufnehmen(e.schwarzweiss ? e.knopfFilter : 'farbe'); }
    if (a === 'filter') return this._aufnehmen(e.knopfFilter);
  }

  async _aufnehmen(filter) {
    if (this.z.ansicht === 'aufnahme') return;
    const s = this.sitzung;
    const anzahl = this.z.modus === 'streifen' ? 4 : 1;
    this.z.filter = filter;
    this._zeige('aufnahme', { foto: null, inDiashow: true });
    try {
      const aufnahmen = [];
      for (let i = 0; i < anzahl; i++) {
        this.z.bild = { nr: i + 1, von: anzahl };
        this.z.hinweis = i === 0 ? 'Schaut in die Kamera!' : 'Neue Pose fürs nächste Bild!';
        for (let c = this.zeiten.countdownSek || 3; c >= 1; c--) { this.z.countdown = c; this._melden(); await this._warte(this.zeiten.countdownSchritt); }
        this.z.countdown = null; this.z.blitz++; this._melden();
        let b = await this.kamera.ausloesen();
        if (filter === 'sw') b = await this.bild.schwarzweiss(b);
        aufnahmen.push(b);
        if (i < anzahl - 1) await this._warte(this.zeiten.pause);
      }
      if (s !== this.sitzung) return;
      this.z.hinweis = 'Einen Moment …'; this._melden();
      const e = this.speicher.einstellungen();
      const druck = await this.bild.zusammensetzen({ modus: this.z.modus, fotos: aufnahmen, g: this.gestaltungVon(e), namen: e.namen, datum: e.datum });
      const foto = await this.speicher.neuesFoto({ modus: this.z.modus, filter, aufnahmen, druck });
      this.log('info', `Foto ${foto.id} aufgenommen`);
      this._zeige('vorschau', { foto: { id: foto.id, url: `/fotos/${foto.id}/druck.jpg` }, hinweis: '', bild: null });
    } catch (err) {
      this.log('fehler', 'Aufnahme fehlgeschlagen: ' + err.message);
      this._zeige('stoerung', { countdown: null, bild: null, hinweis: '', stoerung: 'Die Kamera hat nicht ausgelöst. Sagt bitte dem Brautpaar oder einem Helfer Bescheid.' });
    }
  }

  _behalten() {
    if (!this.z.foto) return;
    const f = this.speicher.foto(this.z.foto.id);
    if (f && !f.behalten) { this.speicher.fotoAendern(f.id, { behalten: true, inDiashow: this.z.inDiashow }); this.diashowVersion++; }
  }

  _leerlauf() {
    if (!LEERLAUF_ANSICHTEN.includes(this.z.ansicht)) return;
    const vorbei = Date.now() - this.letzteAktivitaet;
    if (vorbei >= this.zeiten.leerlauf) {
      if (['vorschau', 'druck'].includes(this.z.ansicht)) this._behalten();
      this.log('info', 'Leerlauf: zurück zum Start');
      return this._zeige('start', this._grundzustand());
    }
    if (vorbei >= this.zeiten.leerlaufWarnung) {
      const rest = Math.ceil((this.zeiten.leerlauf - vorbei) / 1000);
      if (rest !== this.z.leerlaufWarnung) { this.z.leerlaufWarnung = rest; this._melden(); }
    }
  }

  // Service: Foto ein-/ausblenden, nachdrucken
  fotoAusblenden(id, aus) { if (this.speicher.fotoAendern(id, { ausgeblendet: !!aus })) { this.diashowVersion++; this._melden(); } }
  nachdrucken(id) {
    const f = this.speicher.foto(id); if (!f) return;
    const neu = this.drucker.drucken(this.speicher.druckDatei(id), 1, id);
    this.speicher.fotoAendern(id, { abzuege: (f.abzuege || 0) + neu.length });
  }

  zustand() {
    const e = this.speicher.einstellungen();
    return Object.assign({}, this.z, {
      auftraege: this.z.foto ? this.drucker.auftraegeZu(this.z.foto.id) : [],
      maxAbzuege: this._maxAbzuege(e),
      papier: this.drucker.papierGesamt(),
      drucker: this.drucker.uebersicht(),
      kamera: this.kamera.status(),
      diashowVersion: this.diashowVersion,
      einstellungen: { namen: e.namen, datum: e.datum, streifen: e.streifen, schwarzweiss: e.schwarzweiss, maxAbzuege: e.maxAbzuege },
      gestaltung: this.gestaltungVon(e).css,
    });
  }

  beenden() { clearInterval(this.takt); }
}

module.exports = { Ablauf };
