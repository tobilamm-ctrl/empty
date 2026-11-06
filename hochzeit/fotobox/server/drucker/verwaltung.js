/*
 * Druckerverwaltung: verteilt Abzüge auf mehrere Drucker, zählt das Papier (der Selphy meldet den Papierstand nicht)
 * und schätzt den Fortschritt aus der üblichen Druckdauer.
 *
 * new DruckerVerwaltung({ treiber: [treiber], kassette: 18, dauerMs, papier?: [n, n] })
 *   drucken(datei, anzahl, fotoId) → [auftrag]   auftrag: { id, nr, fotoId, drucker, status, fortschritt }
 *   kassetteGetauscht(i), fehlerBehoben(i), ausSetzen(i, aus), papierGesamt(), uebersicht(), auftraegeZu(fotoId)
 *   Ereignis 'aenderung' bei jeder Änderung.
 * Status je Drucker: bereit | druckt | leer | fehler | aus. Ein abgeschalteter Drucker bekommt nichts mehr,
 * wartende Abzüge gehen an den anderen. Ein Fehler nimmt den Drucker aus der Verteilung,
 * der Auftrag geht an einen anderen Drucker mit Papier (sonst wartet er, bis „Fehler behoben“).
 */
'use strict';
const EventEmitter = require('events');

class DruckerVerwaltung extends EventEmitter {
  constructor({ treiber, kassette = 18, dauerMs = 45000, papier }) {
    super();
    this.kassette = kassette;
    this.dauerMs = dauerMs;
    this.drucker = treiber.map((t, i) => ({
      i, name: t.name, treiber: t, papier: Number.isFinite(papier && papier[i]) ? papier[i] : kassette,
      warteschlange: [], aktiv: null, fehler: null, aus: false,
    }));
    this.auftraege = [];
    this.zaehler = 0;
    this.gedruckt = 0;
    this.takt = setInterval(() => this._fortschritt(), 250);
    if (this.takt.unref) this.takt.unref();
  }

  status(d) { return d.aus ? 'aus' : d.fehler ? 'fehler' : d.aktiv ? 'druckt' : d.papier <= 0 ? 'leer' : 'bereit'; }
  papierGesamt() { return this.drucker.filter((d) => !d.fehler && !d.aus).reduce((a, d) => a + d.papier, 0); }

  _waehlen() {
    const frei = this.drucker.filter((d) => !d.fehler && !d.aus && d.papier > 0);
    if (!frei.length) return null;
    return frei.sort((a, b) => (a.warteschlange.length + (a.aktiv ? 1 : 0)) - (b.warteschlange.length + (b.aktiv ? 1 : 0)) || a.i - b.i)[0];
  }

  drucken(datei, anzahl, fotoId) {
    const neu = [];
    for (let k = 0; k < anzahl; k++) {
      const d = this._waehlen();
      if (!d) break;
      d.papier--;
      const a = { id: ++this.zaehler, nr: k + 1, fotoId, datei, drucker: d.name, status: 'wartet', fortschritt: 0, start: 0 };
      d.warteschlange.push(a); this.auftraege.push(a); neu.push(a);
    }
    this.drucker.forEach((d) => this._weiter(d));
    this.emit('aenderung');
    return neu;
  }

  _weiter(d) {
    if (d.aktiv || d.fehler || d.aus || !d.warteschlange.length) return;
    const a = d.warteschlange.shift();
    d.aktiv = a; a.status = 'druckt'; a.start = Date.now(); a.drucker = d.name;
    this.emit('aenderung');
    d.treiber.drucken(a.datei).then(() => {
      a.status = 'fertig'; a.fortschritt = 100; d.aktiv = null; this.gedruckt++;
      this.emit('aenderung'); this._weiter(d);
    }, (err) => {
      d.aktiv = null; d.fehler = err.message || 'Druckerfehler'; d.papier++; // Blatt zurückbuchen, Auftrag neu verteilen
      a.status = 'wartet'; a.fortschritt = 0;
      const ziel = this._waehlen();
      if (ziel) { ziel.papier--; ziel.warteschlange.unshift(a); a.drucker = ziel.name; this._weiter(ziel); } else { d.warteschlange.unshift(a); }
      this.emit('aenderung');
    });
  }

  _fortschritt() {
    let geaendert = false;
    this.drucker.forEach((d) => {
      if (!d.aktiv) return;
      const p = Math.min(95, Math.round((Date.now() - d.aktiv.start) / this.dauerMs * 100));
      if (p !== d.aktiv.fortschritt) { d.aktiv.fortschritt = p; geaendert = true; }
    });
    if (geaendert) this.emit('aenderung');
  }

  kassetteGetauscht(i) { const d = this.drucker[i]; if (!d) return; d.papier = this.kassette; this.drucker.forEach((x) => this._weiter(x)); this.emit('aenderung'); }
  ausSetzen(i, aus) {
    const d = this.drucker[i]; if (!d) return;
    d.aus = !!aus;
    if (d.aus) { // wartende Abzüge umverteilen
      d.warteschlange.splice(0).forEach((a) => {
        d.papier++;
        const ziel = this._waehlen();
        if (ziel) { ziel.papier--; a.drucker = ziel.name; ziel.warteschlange.push(a); } else { d.papier--; d.warteschlange.push(a); }
      });
    }
    this.drucker.forEach((x) => this._weiter(x));
    this.emit('aenderung');
  }
  fehlerBehoben(i) { const d = this.drucker[i]; if (!d) return; d.fehler = null; d.treiber.fehlerSetzen(null); this._weiter(d); this.emit('aenderung'); }
  auftraegeZu(fotoId) { return this.auftraege.filter((a) => a.fotoId === fotoId).map(({ id, nr, drucker, status, fortschritt }) => ({ id, nr, drucker, status, fortschritt })); }
  uebersicht() {
    return this.drucker.map((d) => ({ i: d.i, name: d.name, papier: d.papier, kassette: this.kassette, status: this.status(d), fehler: d.fehler, aus: d.aus, warten: d.warteschlange.length }));
  }
  beenden() { clearInterval(this.takt); }
}

module.exports = { DruckerVerwaltung };
