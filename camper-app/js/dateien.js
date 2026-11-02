// PDFs (Fährtickets, Buchungsbestätigungen, Prospekte, Dokumente): direkt zum Server hochladen, als kleine
// Karte anzeigen und im Browser öffnen. Einmal geöffnet, liegen sie im Speicher des Geräts (sw.js) und gehen auch offline.

export default function installDateien(app) {
  const { esc, icon, newId, save, remove, toast } = app;
  const MAX = 10 * 1024 * 1024;
  const url = f => `api/?a=file&crew=${encodeURIComponent(app.crewId())}&id=${encodeURIComponent(f.id)}&name=${encodeURIComponent(f.name || 'Dokument')}`;
  const size = n => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  const isPdf = f => /pdf$/i.test(f.type || '') || /\.pdf$/i.test(f.name || '');

  async function upload(file, prefix = '') {
    if (!isPdf(file)) throw new Error('Nur PDF-Dateien.');
    if (file.size > MAX) throw new Error(`„${file.name}“ ist zu groß (höchstens 10 MB).`);
    if (!navigator.onLine) throw new Error('PDFs lassen sich nur mit Internet hochladen.');
    const id = prefix + newId();
    let res;
    try {
      res = await fetch(`api/?a=file&crew=${encodeURIComponent(app.crewId())}&id=${id}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'X-Lammping': '1', 'Content-Type': 'application/pdf' }, body: file,
      });
    } catch { throw new Error('Keine Verbindung zum Server.'); }
    let d = {};
    try { d = await res.json(); } catch { /* leere Antwort */ }
    if (!res.ok) throw new Error(d.error || `Serverfehler (${res.status})`);
    const meta = { id, name: (file.name || 'Dokument').replace(/\.pdf$/i, ''), size: file.size, at: Date.now(), by: app.me() };
    save('files', meta);
    fetch(url(meta), { credentials: 'same-origin' }).catch(() => {});   // gleich für offline ablegen
    return { id, name: meta.name, size: meta.size };
  }

  app.pdf = {
    url, isPdf, upload,
    // Mehrere Dateien nacheinander; Fehler einzeln melden, die übrigen trotzdem hochladen
    async uploadAll(files, prefix = '') {
      const out = [];
      for (const f of [...files].filter(isPdf)) {
        toast(`„${f.name}“ wird hochgeladen …`);
        try { out.push(await upload(f, prefix)); } catch (e) { toast(e.message); }
      }
      return out;
    },
    chips: (list, dropAction) => (list || []).map(f => `<span class="pdf-chip"><a href="${url(f)}" target="_blank" rel="noopener">📄 ${esc(f.name)} <small>${size(f.size || 0)}</small></a>${dropAction
      ? `<button type="button" class="icon-btn small" data-action="${dropAction}" data-id="${f.id}" aria-label="PDF entfernen">${icon('close')}</button>` : ''}</span>`).join(''),
    drop: id => remove('files', id),
    // Für unterwegs ohne Netz vorab holen
    prefetch: list => (list || []).forEach(f => fetch(url(f), { credentials: 'same-origin' }).catch(() => {})),
  };
}
