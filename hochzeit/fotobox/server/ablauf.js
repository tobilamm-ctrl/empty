/*
 * Ablauf der Fotobox (Zustandsautomat). Der Zustand liegt nur hier – iPad, großer Bildschirm und Service-Handy
 * zeigen ihn an und schicken Aktionen. Ansichten:
 *   start → modus → filter → aufnahme → vorschau → druck → drucken → danke → start
 *   stoerung (Kamera ausgefallen) → start
 *   pause (Pause-Modus oder außerhalb der Öffnungszeit; nur aus „start“ heraus, laufende Fotos werden fertig)
 *
 * new Ablauf({ kamera, drucker, speicher, bild, gestaltung, zeiten, knopfTasten, log })
 *   zeiten (ms): countdownSchritt, pause, leerlaufWarnung, leerlauf, danke, knopfSperre, takt, countdownSek
 *   zeiten.ausEinstellungen: Countdown- und Leerlauf-Dauer kommen aus den Service-Einstellungen
 *   aktion(name, daten)  zustand()  Ereignis 'aenderung'
 */
'use strict';
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

const LEERLAUF_ANSICHTEN = ['modus', 'filter', 'vorschau', 'druck', 'drucken', 'stoerung'];
const KNOPF_LERNEN_MS = 20000;

// Pause-Modus und Öffnungszeit → Text für die Pause, oder null wenn geöffnet.
// Nur „ab“: offen ab dieser Uhrzeit bis 5 Uhr morgens (Feier über Mitternacht). „ab“ und „bis“: auch über Mitternacht.
function geschlossen(e, jetzt = new Date()) {
  if (e.pause) return e.textPause || 'Kurze Pause';
  const min = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const t = jetzt.getHours() * 60 + jetzt.getMinutes();
  const ab = e.oeffnungAb ? min(e.oeffnungAb) : null, bis = e.oeffnungBis ? min(e.oeffnungBis) : null;
  if (ab === null && bis === null) return null;
  let offen;
  if (ab !== null && bis !== null) offen = ab <= bis ? t >= ab && t < bis : t >= ab || t < bis;
  else if (ab !== null) offen = t >= ab || t < 5 * 60;
  else offen = t < bis;
  if (offen) return null;
  // Noch nicht offen oder schon zu? Über Mitternacht: vormittags „geschlossen“, nachmittags „öffnet um“
  const vorOeffnung = ab !== null && (bis === null || ab <= bis ? t < ab : t >= 12 * 60);
  return vorOeffnung ? `Die Fotobox öffnet um ${e.oeffnungAb} Uhr.` : 'Die Fotobox hat jetzt geschlossen. Danke fürs Mitmachen!';
}

class Ablauf extends EventEmitter {
  constructor({ kamera, drucker, speicher, bild, gestaltung, zeiten, knopfTasten = [], log = () => {} }) {
    super();
    Object.assign(this, { kamera, drucker, speicher, bild, gestaltungVon: gestaltung, zeiten, knopfTasten, log });
    this.z = this._grundzustand();
    this.letzteAktivitaet = Date.now();
    this.letzterKnopf = 0;
    this.knopfLernenBis = 0;
    this.sitzung = 0;
    this.diashowVersion = 0;
    this.takt = setInterval(() => this._takt(), zeiten.takt || 1000);
    if (this.takt.unref) this.takt.unref();
    drucker.on('aenderung', () => this._melden());
  }

  _grundzustand() {
    return { ansicht: 'start', modus: 'einzel', filter: 'farbe', bild: null, countdown: null, hinweis: '', blitz: 0,
      foto: null, nochmal: 0, inDiashow: true, anzahl: 1, leerlaufWarnung: null, stoerung: null, pauseText: '', ohneDruck: false };
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

  // Dauer aus den Einstellungen (Betrieb) oder fest aus „zeiten“ (Tests)
  _dauer(e) {
    if (!this.zeiten.ausEinstellungen) return { countdownSek: this.zeiten.countdownSek || 3, leerlauf: this.zeiten.leerlauf, warnung: this.zeiten.leerlaufWarnung };
    const leerlauf = e.leerlaufSek * 1000;
    return { countdownSek: e.countdownSek, leerlauf, warnung: Math.max(leerlauf - 10000, leerlauf * 0.6) };
  }

  aktion(name, daten) {
    const e = this.speicher.einstellungen(), a = this.z.ansicht;
    this.letzteAktivitaet = Date.now();
    if (this.z.leerlaufWarnung !== null) { this.z.leerlaufWarnung = null; this._melden(); }
    if (a === 'pause') return;
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
        if (!this._druckMoeglich(e)) return this._zeige('danke', { ohneDruck: true });
        return this._zeige('druck', { anzahl: 1 });
      case 'anzahl':
        if (a !== 'druck') return;
        this.z.anzahl = Math.max(1, Math.min(Number(daten) || 1, this._maxAbzuege(e)));
        return this._melden();
      case 'drucken':
        if (a !== 'druck' || !this._druckMoeglich(e)) return;
        this._zeige('drucken');
        this._drucken(this.z.foto.id, Math.min(this.z.anzahl, this._maxAbzuege(e)), e);
        return;
      case 'ohneDruck': case 'fertig':
        if (a === 'druck' || a === 'drucken') this._zeige('danke');
        return;
      case 'stoerungOk':
        if (a === 'stoerung') this._zeige('start', this._grundzustand());
        return;
      default:
    }
  }

  _restGesamt(e) {
    if (!e.maxAbzuegeGesamt) return Infinity;
    const bisher = this.speicher.fotos().reduce((s, f) => s + (f.abzuege || 0), 0);
    return Math.max(0, e.maxAbzuegeGesamt - bisher);
  }
  _druckMoeglich(e) { return e.druckenAn && this._restGesamt(e) > 0 && this.drucker.papierGesamt() > 0; }
  _maxAbzuege(e) { return Math.max(1, Math.min(e.maxAbzuege || 1, this.drucker.papierGesamt() || 1, this._restGesamt(e))); }

  // Druckdatei, bei Feinkorrektur (Versatz in mm) als verschobene Kopie
  async _druckDatei(id, e) {
    const datei = this.speicher.druckDatei(id);
    if (!e.druckVersatzX && !e.druckVersatzY) return datei;
    const ziel = path.join(this.speicher.fotoOrdner(id), 'druck-versetzt.jpg');
    const g = this.gestaltungVon(e);
    fs.writeFileSync(ziel, await this.bild.versetzen(fs.readFileSync(datei), e.druckVersatzX, e.druckVersatzY, e.druckLayout === 'vollbild' ? '#ffffff' : g.papier));
    return ziel;
  }
  async _drucken(id, anzahl, e) {
    try {
      const neu = this.drucker.drucken(await this._druckDatei(id, e), anzahl, id);
      const f = this.speicher.foto(id);
      if (f) this.speicher.fotoAendern(id, { abzuege: (f.abzuege || 0) + neu.length });
      this._melden();
      return neu.length;
    } catch (err) { this.log('fehler', 'Drucken fehlgeschlagen: ' + err.message); return 0; }
  }

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

  // Knopf anlernen: der nächste Tastendruck auf iPad oder großem Bildschirm wird als Knopf-Taste gespeichert
  knopfLernen() { this.knopfLernenBis = Date.now() + KNOPF_LERNEN_MS; this._melden(); }
  knopfGelernt(taste) {
    if (Date.now() > this.knopfLernenBis || !taste) return false;
    this.knopfLernenBis = 0;
    const e = this.speicher.einstellungen();
    this.speicher.einstellungenSetzen({ knopfGelernt: [...new Set([...(e.knopfGelernt || []), String(taste)])] });
    this.log('info', `Knopf angelernt: Taste „${taste}“`);
    this._melden();
    return true;
  }
  knopfTastenAlle() { return [...new Set([...this.knopfTasten, ...(this.speicher.einstellungen().knopfGelernt || [])])]; }

  async _aufnehmen(filter) {
    if (this.z.ansicht === 'aufnahme') return;
    const s = this.sitzung;
    const anzahl = this.z.modus === 'streifen' ? 4 : 1;
    const dauer = this._dauer(this.speicher.einstellungen());
    this.z.filter = filter;
    this._zeige('aufnahme', { foto: null, inDiashow: true });
    try {
      const aufnahmen = [];
      for (let i = 0; i < anzahl; i++) {
        this.z.bild = { nr: i + 1, von: anzahl };
        this.z.hinweis = i === 0 ? 'Schaut in die Kamera!' : 'Neue Pose fürs nächste Bild!';
        for (let c = dauer.countdownSek; c >= 1; c--) { this.z.countdown = c; this._melden(); await this._warte(this.zeiten.countdownSchritt); }
        this.z.countdown = null; this.z.blitz++; this._melden();
        let b = await this.kamera.ausloesen();
        if (filter === 'sw') b = await this.bild.schwarzweiss(b);
        aufnahmen.push(b);
        if (i < anzahl - 1) await this._warte(this.zeiten.pause);
      }
      if (s !== this.sitzung) return;
      this.z.hinweis = 'Einen Moment …'; this._melden();
      const e = this.speicher.einstellungen();
      const druck = await this.bild.zusammensetzen({
        modus: this.z.modus, layout: e.druckLayout, fotos: aufnahmen, g: this.gestaltungVon(e), namen: e.namen, datum: e.datum,
        logo: e.logoStattNamen ? this.speicher.logo() : null,
      });
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

  _takt() {
    const e = this.speicher.einstellungen();
    // Pause und Öffnungszeit: nur zwischen zwei Gästen umschalten
    const zu = geschlossen(e);
    if (this.z.ansicht === 'start' && zu) return this._zeige('pause', { pauseText: zu });
    if (this.z.ansicht === 'pause') {
      if (!zu) return this._zeige('start', this._grundzustand());
      if (zu !== this.z.pauseText) { this.z.pauseText = zu; this._melden(); }
      return;
    }
    if (this.knopfLernenBis && Date.now() > this.knopfLernenBis) { this.knopfLernenBis = 0; this._melden(); }
    if (!LEERLAUF_ANSICHTEN.includes(this.z.ansicht)) return;
    const dauer = this._dauer(e), vorbei = Date.now() - this.letzteAktivitaet;
    if (vorbei >= dauer.leerlauf) {
      if (['vorschau', 'druck'].includes(this.z.ansicht)) this._behalten();
      this.log('info', 'Leerlauf: zurück zum Start');
      return this._zeige('start', this._grundzustand());
    }
    if (vorbei >= dauer.warnung) {
      const rest = Math.ceil((dauer.leerlauf - vorbei) / 1000);
      if (rest !== this.z.leerlaufWarnung) { this.z.leerlaufWarnung = rest; this._melden(); }
    }
  }

  // Service: Foto ein-/ausblenden, freigeben, nachdrucken, zum Start
  fotoAusblenden(id, aus) { if (this.speicher.fotoAendern(id, { ausgeblendet: !!aus })) { this.diashowVersion++; this._melden(); } }
  fotoFreigeben(id, frei) { if (this.speicher.fotoAendern(id, { freigegeben: !!frei })) { this.diashowVersion++; this._melden(); } }
  nachdrucken(id) { if (this.speicher.foto(id)) return this._drucken(id, 1, this.speicher.einstellungen()); return Promise.resolve(0); }
  zumStart() { if (this.z.ansicht !== 'pause') this._zeige('start', this._grundzustand()); }
  einstellungenGeaendert() { this.diashowVersion++; this._takt(); this._melden(); }

  zustand() {
    const e = this.speicher.einstellungen();
    const rest = this._restGesamt(e);
    return Object.assign({}, this.z, {
      auftraege: this.z.foto ? this.drucker.auftraegeZu(this.z.foto.id) : [],
      maxAbzuege: this._maxAbzuege(e),
      papier: this.drucker.papierGesamt(),
      drucker: this.drucker.uebersicht(),
      kamera: this.kamera.status(),
      diashowVersion: this.diashowVersion,
      knopfLernen: Date.now() < this.knopfLernenBis,
      druckRest: Number.isFinite(rest) ? rest : null,
      einstellungen: {
        namen: e.namen, datum: e.datum, streifen: e.streifen, schwarzweiss: e.schwarzweiss, maxAbzuege: e.maxAbzuege,
        druckenAn: e.druckenAn, spiegeln: e.spiegeln, diashowSek: e.diashowSek, knopfTasten: this.knopfTastenAlle(),
        texte: { startTitel: e.textStartTitel, start: e.textStart, buehne: e.textBuehne, danke: e.textDanke, dankeKlein: e.textDankeKlein },
      },
      gestaltung: this.gestaltungVon(e).css,
    });
  }

  beenden() { clearInterval(this.takt); }
}

module.exports = { Ablauf, geschlossen };
