// Datenhaltung: gleiche Schnittstelle für Testmodus (IndexedDB) und Firebase (Firestore).
//   watch(coll, cb)  -> liefert bei jeder Änderung alle Dokumente der Sammlung
//   get(coll, id), put(coll, doc), patch(coll, id, felder), del(coll, id)
// Schreibzugriffe werden in der Oberfläche nicht abgewartet: Firestore zeigt Änderungen
// sofort lokal an und synchronisiert, sobald wieder Netz da ist.

export const COLLS = ['trips', 'entries', 'expenses', 'boxes', 'items', 'packstate', 'listItems', 'meta', 'photos'];

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Testmodus: nur dieses Gerät ---------- */

class LocalStore {
  constructor() {
    this.mode = 'local';
    this.subs = {};
  }

  async init() {
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('camper', 1);
      req.onupgradeneeded = () => COLLS.forEach(c => req.result.createObjectStore(c, { keyPath: 'id' }));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    // Andere Tabs desselben Geräts mitbekommen lassen
    this.bc = 'BroadcastChannel' in window ? new BroadcastChannel('camper') : null;
    if (this.bc) this.bc.onmessage = e => this._notify(e.data, false);
  }

  _tx(coll, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(coll, mode);
      const req = fn(tx.objectStore(coll));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async _notify(coll, broadcast = true) {
    if (broadcast && this.bc) this.bc.postMessage(coll);
    const list = this.subs[coll];
    if (!list || !list.length) return;
    const all = await this._tx(coll, 'readonly', s => s.getAll());
    list.forEach(cb => cb(all));
  }

  watch(coll, cb) {
    (this.subs[coll] ||= []).push(cb);
    this._tx(coll, 'readonly', s => s.getAll()).then(cb);
    return () => { this.subs[coll] = this.subs[coll].filter(f => f !== cb); };
  }

  get(coll, id) { return this._tx(coll, 'readonly', s => s.get(id)); }

  async put(coll, doc) {
    await this._tx(coll, 'readwrite', s => s.put(JSON.parse(JSON.stringify(doc))));
    this._notify(coll);
  }

  async patch(coll, id, fields) {
    const old = (await this.get(coll, id)) || { id };
    await this.put(coll, { ...old, ...fields });
  }

  async del(coll, id) {
    await this._tx(coll, 'readwrite', s => s.delete(id));
    this._notify(coll);
  }

  // Anmeldung gibt es im Testmodus nicht
  onAuth(cb) { cb({ email: null, local: true }); }
}

/* ---------- Firebase: gemeinsam, offline-fähig ---------- */

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

class FirebaseStore {
  constructor(cfg) {
    this.mode = 'firebase';
    this.cfg = cfg;
  }

  async init() {
    const [{ initializeApp }, fs, au] = await Promise.all([
      import(FB + 'firebase-app.js'),
      import(FB + 'firebase-firestore.js'),
      import(FB + 'firebase-auth.js'),
    ]);
    this.fs = fs;
    this.au = au;
    const app = initializeApp(this.cfg);
    this.db = fs.initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    this.auth = au.getAuth(app);
    await au.setPersistence(this.auth, au.browserLocalPersistence);
  }

  onAuth(cb) { this.au.onAuthStateChanged(this.auth, u => cb(u ? { email: u.email } : null)); }
  signIn(email, pw) { return this.au.signInWithEmailAndPassword(this.auth, email, pw); }
  signOut() { return this.au.signOut(this.auth); }

  watch(coll, cb) {
    const { onSnapshot, collection } = this.fs;
    return onSnapshot(collection(this.db, coll),
      snap => cb(snap.docs.map(d => ({ ...d.data(), id: d.id }))),
      err => console.error('Sync-Fehler', coll, err));
  }

  async get(coll, id) {
    const snap = await this.fs.getDoc(this.fs.doc(this.db, coll, id));
    return snap.exists() ? { ...snap.data(), id } : undefined;
  }

  put(coll, doc) { return this.fs.setDoc(this.fs.doc(this.db, coll, doc.id), doc); }
  patch(coll, id, fields) { return this.fs.setDoc(this.fs.doc(this.db, coll, id), fields, { merge: true }); }
  del(coll, id) { return this.fs.deleteDoc(this.fs.doc(this.db, coll, id)); }
}

export async function createStore() {
  const cfg = window.CAMPER_CONFIG && window.CAMPER_CONFIG.firebase;
  const store = cfg ? new FirebaseStore(cfg) : new LocalStore();
  await store.init();
  return store;
}
