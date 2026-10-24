// Datenhaltung: Jedes Handy hält eine vollständige Kopie der Crew-Daten in IndexedDB.
// Änderungen landen sofort lokal und in einem Postausgang; der Abgleich schickt sie an den
// eigenen Server (api/) und holt Änderungen der anderen ab, sobald Netz da ist.
//   watch(coll, cb)  -> liefert bei jeder Änderung alle Dokumente der Sammlung
//   get(coll, id), put(coll, doc), patch(coll, id, felder), del(coll, id)
// Fotos: put('photos', {id, data}) lädt die volle Größe hoch, get('photos', id).data ist eine Bild-URL.

export const COLLS = ['trips', 'entries', 'expenses', 'boxes', 'items', 'packstate', 'listItems', 'meta'];
const SYNC_EVERY = 15000;

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Server ---------- */

export class AuthError extends Error {}

export async function api(action, body, query = '') {
  let res;
  try {
    res = await fetch(`api/?a=${action}${query}`, body === undefined
      ? { credentials: 'same-origin' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Bordbuch': '1' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Keine Verbindung zum Server.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* leere Antwort */ }
  if (res.status === 401 && action !== 'login') throw new AuthError(data.error || 'Nicht angemeldet');
  if (!res.ok) throw new Error(data.error || `Serverfehler (${res.status})`);
  return data;
}

/* ---------- Lokale Datenbank ---------- */

function openDb(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      COLLS.forEach(c => req.result.createObjectStore(c, { keyPath: 'id' }));
      req.result.createObjectStore('outbox', { keyPath: 'key' });
      req.result.createObjectStore('photoOut', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const req = fn(...[].concat(stores).map(s => t.objectStore(s)));
    t.oncomplete = () => resolve(req && req.result);
    t.onerror = () => reject(t.error);
  });
}

export class SyncStore {
  constructor(crewId) {
    this.crew = crewId;
    this.subs = {};
    this.statusSubs = [];
    this.status = { pending: 0, lastSync: +localStorage.getItem('bb.lastSync.' + crewId) || 0, error: null, busy: false };
  }

  async init() {
    this.db = await openDb('bordbuch-' + this.crew);
    this.rev = +localStorage.getItem('bb.rev.' + this.crew) || 0;
    this.bc = 'BroadcastChannel' in window ? new BroadcastChannel('bordbuch-' + this.crew) : null;
    if (this.bc) this.bc.onmessage = e => this._notify(e.data, false);
    await this._countPending();
    window.addEventListener('online', () => this.sync());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.sync(); });
    setInterval(() => { if (document.visibilityState === 'visible') this.sync(); }, SYNC_EVERY);
    this.sync();
  }

  /* --- Lesen & Schreiben (immer lokal) --- */

  async _notify(coll, broadcast = true) {
    if (broadcast && this.bc) this.bc.postMessage(coll);
    const list = this.subs[coll];
    if (!list || !list.length) return;
    const all = await tx(this.db, coll, 'readonly', s => s.getAll());
    list.forEach(cb => cb(all));
  }

  watch(coll, cb) {
    (this.subs[coll] ||= []).push(cb);
    tx(this.db, coll, 'readonly', s => s.getAll()).then(cb);
    return () => { this.subs[coll] = this.subs[coll].filter(f => f !== cb); };
  }

  async get(coll, id) {
    if (coll === 'photos') {
      const local = await tx(this.db, 'photoOut', 'readonly', s => s.get(id));
      return { id, data: local ? local.data : `api/?a=photo&crew=${this.crew}&id=${id}` };
    }
    return tx(this.db, coll, 'readonly', s => s.get(id));
  }

  async put(coll, doc) {
    if (coll === 'photos') {
      await tx(this.db, 'photoOut', 'readwrite', s => s.put({ id: doc.id, data: doc.data }));
    } else {
      const copy = JSON.parse(JSON.stringify(doc));
      await tx(this.db, [coll, 'outbox'], 'readwrite', (s, out) => {
        s.put(copy);
        return out.put({ key: coll + '/' + doc.id, coll, id: doc.id, data: copy, at: Date.now() });
      });
      this._notify(coll);
    }
    this._changed();
  }

  async patch(coll, id, fields) {
    const old = (await this.get(coll, id)) || { id };
    await this.put(coll, { ...old, ...fields });
  }

  async del(coll, id) {
    if (coll === 'photos') {
      await tx(this.db, ['photoOut', 'outbox'], 'readwrite', (p, out) => {
        p.delete(id);
        return out.put({ key: 'photos/' + id, coll, id, data: null, at: Date.now() });
      });
    } else {
      await tx(this.db, [coll, 'outbox'], 'readwrite', (s, out) => {
        s.delete(id);
        return out.put({ key: coll + '/' + id, coll, id, data: null, at: Date.now() });
      });
      this._notify(coll);
    }
    this._changed();
  }

  _changed() {
    this._countPending();
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.sync(), 800);
  }

  /* --- Abgleich mit dem Server --- */

  onStatus(cb) { this.statusSubs.push(cb); cb(this.status); }
  _setStatus(patch) {
    Object.assign(this.status, patch);
    this.statusSubs.forEach(cb => cb(this.status));
  }

  async _countPending() {
    const [a, b] = await Promise.all([
      tx(this.db, 'outbox', 'readonly', s => s.count()),
      tx(this.db, 'photoOut', 'readonly', s => s.count()),
    ]);
    this._setStatus({ pending: a + b });
  }

  async sync() {
    if (this.running) { this.again = true; return; }
    if (!navigator.onLine) return;
    this.running = true;
    this._setStatus({ busy: true });
    try {
      await this._pushPhotos();
      await this._push();
      await this._pull();
      localStorage.setItem('bb.lastSync.' + this.crew, Date.now());
      this._setStatus({ lastSync: Date.now(), error: null });
    } catch (e) {
      this._setStatus({ error: e instanceof AuthError ? 'auth' : e.message });
    } finally {
      this.running = false;
      await this._countPending();
      this._setStatus({ busy: false });
      if (this.again) { this.again = false; this.sync(); }
    }
  }

  async _pushPhotos() {
    const photos = await tx(this.db, 'photoOut', 'readonly', s => s.getAll());
    for (const p of photos) {
      await api('photo', { crew: this.crew, id: p.id, data: p.data });
      // Hochgeladen: ab jetzt kommt das Foto vom Server (und landet dort im Offline-Speicher)
      await tx(this.db, 'photoOut', 'readwrite', s => s.delete(p.id));
    }
  }

  async _push() {
    const items = await tx(this.db, 'outbox', 'readonly', s => s.getAll());
    for (let i = 0; i < items.length; i += 200) {
      const batch = items.slice(i, i + 200);
      await api('push', { crew: this.crew, changes: batch.map(({ coll, id, data }) => ({ coll, id, data })) });
      // Nur entfernen, was sich in der Zwischenzeit nicht erneut geändert hat
      await tx(this.db, 'outbox', 'readwrite', out => {
        batch.forEach(it => {
          const r = out.get(it.key);
          r.onsuccess = () => { if (r.result && r.result.at === it.at) out.delete(it.key); };
        });
      });
    }
  }

  async _pull() {
    let more = true;
    while (more) {
      const res = await api('sync', undefined, `&crew=${this.crew}&since=${this.rev}`);
      more = res.more;
      if (!res.docs.length) break;
      const pending = new Set((await tx(this.db, 'outbox', 'readonly', s => s.getAllKeys())));
      const touched = new Set();
      const docs = res.docs.filter(d => d.coll !== 'photos' && COLLS.includes(d.coll) && !pending.has(d.coll + '/' + d.id));
      const stores = [...new Set(docs.map(d => d.coll))];
      if (stores.length) {
        await tx(this.db, stores, 'readwrite', (...st) => {
          docs.forEach(d => {
            const s = st[stores.indexOf(d.coll)];
            if (d.data) s.put({ ...d.data, id: d.id }); else s.delete(d.id);
            touched.add(d.coll);
          });
        });
      }
      this.rev = res.rev;
      localStorage.setItem('bb.rev.' + this.crew, this.rev);
      touched.forEach(c => this._notify(c));
    }
  }

  // Lokale Kopie einer Sammlung verwerfen (z. B. Kasse, wenn die Freigabe entzogen wurde)
  async clearLocal(coll) {
    await tx(this.db, coll, 'readwrite', s => s.clear());
    this._notify(coll);
  }

  // Alles neu vom Server holen (z. B. nach dem Einspielen einer Sicherung auf einem anderen Gerät)
  async resync() {
    this.rev = 0;
    await this.sync();
  }
}
