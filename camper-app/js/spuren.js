// Spuren der Reise ohne Zutun: (1) Beim Öffnen der App merkt sie sich still den Standort (nur während einer laufenden
// Reise und nur, wenn die Standort-Erlaubnis schon erteilt ist). (2) Die Linie einer Reise läuft auch durch die
// Standorte der Fotos und diese gemerkten Punkte, sortiert nach Zeit; „Der Straße folgen“ nutzt dieselben Punkte.
// (3) Tracker-App im Hintergrund (GPSLogger, OwnTracks, Overland): meldet Punkte an eine geheime Adresse des Servers,
// daraus wächst eine aufgezeichnete Strecke (api/index.php, Aktion „gps“).

export default function installSpuren(app) {
  const { S, LS, ACTIONS, CHANGES, esc, toast, save, api, km, hasPos, tripEntries, settingsPanels } = app;
  const MAX = 3000;
  const localNow = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const pingDoc = t => S.meta.find(x => x.id === `pings_${t.id}`);
  const pings = t => { const d = pingDoc(t); return d && Array.isArray(d.pts) ? d.pts : []; };
  const on = () => LS.get('autoPing', true) !== false;

  /* ---------- (2) Punkte einer Reise in zeitlicher Reihenfolge ---------- */

  // Einträge mit Ort sind immer dabei; Foto-Standorte und gemerkte Punkte nur, wenn sie nicht ganz nah am Vorgänger liegen
  app.routePoints = (t, near = 0.3) => {
    const es = tripEntries(t);
    const inTrip = d => !!d && (!t.start || d.slice(0, 10) >= t.start) && (!t.end || d.slice(0, 10) <= t.end);
    const list = es.filter(hasPos).map(e => ({ lat: e.lat, lng: e.lng, date: e.date, e }));
    es.forEach(e => (e.photos || []).forEach(p => {
      if (typeof p.lat !== 'number' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(p.at || '') || !inTrip(p.at)) return;
      if (hasPos(e) && km(e, p) < 0.1) return;
      list.push({ lat: p.lat, lng: p.lng, date: p.at.slice(0, 16), photo: true });
    }));
    pings(t).forEach(p => { if (inTrip(p[2])) list.push({ lat: p[0], lng: p[1], date: p[2], ping: true }); });
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const out = [];
    list.forEach(p => {
      const prev = out[out.length - 1];
      if (!p.e && prev && km(prev, p) < near) return;
      out.push(p);
    });
    return out;
  };

  /* ---------- (1) Still einen Punkt merken, wenn die App geöffnet wird ---------- */

  let busy = false;
  async function ping() {
    if (busy || !on() || document.hidden || !app.session || !app.session()) return;
    let t = null;
    try { t = app.currentTrip(); } catch { return; }      // noch keine Crew gewählt
    const d = app.today();
    if (!t || t.ended || !t.start || t.start > d || (t.end && t.end < d)) return;
    if (LS.get('rec', null)) return;                        // eine Aufzeichnung läuft ohnehin
    const last = pings(t).slice(-1)[0];
    if (last && Date.now() - (LS.get('pingAt', 0) || 0) < 10 * 60000) return;
    // Nie selbst nach der Erlaubnis fragen
    try { const p = navigator.permissions && await navigator.permissions.query({ name: 'geolocation' }); if (!p || p.state !== 'granted') return; } catch { return; }
    busy = true;
    try {
      const pos = await app.getPos({ wait: 8000, good: 30 });
      LS.set('pingAt', Date.now());
      if (!pos || (pos.acc && pos.acc > 150)) return;
      if (last && km({ lat: last[0], lng: last[1] }, pos) < 0.2) return;   // seit dem letzten Mal nicht bewegt
      const doc = pingDoc(t) || { id: `pings_${t.id}`, tripId: t.id, pts: [] };
      const pts = [...(doc.pts || []), [+pos.lat.toFixed(5), +pos.lng.toFixed(5), localNow()]].slice(-MAX);
      save('meta', { ...doc, pts });
    } catch { /* ohne Standort weiter */ } finally { busy = false; }
  }
  setTimeout(ping, 6000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(ping, 1500); });

  /* ---------- Einstellungen: automatisch und Tracker-App ---------- */

  settingsPanels.push(() => `<section class="panel" id="trackPanel"><h2>Strecke automatisch</h2>
    <label class="check"><input type="checkbox" data-action="auto-ping"${on() ? ' checked' : ''}><span>Beim Öffnen der App den Standort merken (nur während einer Reise)
      <small class="sub"> Daraus und aus den Standorten der Fotos entsteht die Linie auf der Karte. Fragt nie selbst nach der Erlaubnis.</small></span></label>
    <h3>Im Hintergrund mit einer Tracker-App</h3>
    <p class="sub">Eine Web-App darf den Standort nicht im Hintergrund verfolgen. Eine kleine Tracker-App auf dem Handy kann das und schickt
      die Punkte an LAMMping: Die Strecke wächst von selbst, auch wenn LAMMping zu ist. Teilt ihr euren Standort unter „Crews on the Road“, sehen die anderen Crews ihn dann aktuell.</p>
    <div id="trackBody"><p class="sub">Wird geladen …</p></div></section>`);

  const guide = url => `<details class="trk-help"><summary>Android: GPSLogger (kostenlos, F-Droid oder Play Store)</summary><ol>
      <li>GPSLogger installieren und öffnen, oben links das Menü › <b>Logging details</b> › <b>Log to custom URL</b>.</li>
      <li>Einschalten und als <b>URL</b> eintragen:<br><code class="trk-url">${esc(url)}&amp;lat=%LAT&amp;lon=%LON&amp;time=%TIME&amp;acc=%ACC</code>
        <button type="button" class="ghost small-btn" data-action="trk-copy" data-u="${esc(url)}&lat=%LAT&lon=%LON&time=%TIME&acc=%ACC">Kopieren</button></li>
      <li><b>HTTP Method</b>: GET. Unter <b>Performance</b> z. B. alle 60 Sekunden und „Distance filter“ 50 m.</li>
      <li>Akku-Optimierung für GPSLogger ausschalten (Einstellungen › Apps › GPSLogger › Akku › Nicht eingeschränkt), dann auf <b>Start</b>.</li></ol></details>
    <details class="trk-help"><summary>iPhone: OwnTracks (kostenlos)</summary><ol>
      <li>OwnTracks installieren, oben links ⓘ › <b>Settings</b> › <b>Mode</b>: <b>HTTP</b>.</li>
      <li>Als <b>URL</b> eintragen: <code class="trk-url">${esc(url)}</code>
        <button type="button" class="ghost small-btn" data-action="trk-copy" data-u="${esc(url)}">Kopieren</button></li>
      <li>Standort „Immer erlauben“. Auf der Karte oben <b>Move</b> wählen, damit regelmäßig gemeldet wird.</li></ol></details>
    <details class="trk-help"><summary>iPhone: Overland (kostenlos, genauer, mehr Akku)</summary><ol>
      <li>Overland installieren, <b>Settings</b> › <b>Receiver Endpoint</b>: <code class="trk-url">${esc(url)}</code>
        <button type="button" class="ghost small-btn" data-action="trk-copy" data-u="${esc(url)}">Kopieren</button></li>
      <li>Standort „Immer erlauben“, oben den Schalter auf <b>On</b>.</li></ol></details>
    <p class="sub">Punkte zählen nur, solange eine Reise läuft. Ungenaue Punkte (über 100 m) und Stillstand fallen weg. Die Adresse ist geheim wie ein Passwort:
      wer sie kennt, kann Punkte in eure Strecke schreiben. „Neue Adresse“ macht die alte ungültig.</p>`;
  async function fill() {
    const box = document.getElementById('trackBody');
    if (!box) return;
    let r;
    try { r = await api('gps-key', undefined, `&crew=${encodeURIComponent(app.crewId())}`); } catch (e) {
      if (document.getElementById('trackBody')) box.innerHTML = `<p class="sub">Geht gerade nicht: ${esc(e.message)} Dafür braucht es die neue api/index.php (Lieferung 74).</p>`;
      return;
    }
    if (!document.getElementById('trackBody')) return;
    if (!r.key) { box.innerHTML = '<div class="btnrow"><button class="primary" data-action="trk-on">Meine Tracker-Adresse erzeugen</button></div>'; return; }
    const mine = S.tracks.filter(x => x.auto === 'tracker' && x.by === app.me());
    const kmSum = mine.reduce((s, x) => s + (x.km || 0), 0);
    box.innerHTML = `<p class="sub">${r.last ? `✅ Zuletzt gemeldet: ${new Date(r.last).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}` : 'Noch nichts angekommen.'}
        ${kmSum ? ` · bisher ${app.fmtKm(kmSum)} aufgezeichnet` : ''}</p>
      <p class="cron-url"><code>${esc(r.url)}</code></p>
      <div class="btnrow"><button class="ghost small-btn" data-action="trk-copy" data-u="${esc(r.url)}">Adresse kopieren</button>
        <button class="ghost small-btn" data-action="trk-renew">Neue Adresse</button><button class="ghost small-btn danger" data-action="trk-off">Ausschalten</button></div>
      ${guide(r.url)}`;
  }
  app.afterDraw.push(() => { if (document.getElementById('trackBody')) fill(); });
  CHANGES['auto-ping'] = el => { LS.set('autoPing', el.checked); toast(el.checked ? 'Standort wird beim Öffnen gemerkt' : 'Aus'); };
  const setKey = async body => {
    try { await api('gps-key', { crew: app.crewId(), ...body }); } catch (e) { toast(e.message); }
    fill();
  };
  ACTIONS['trk-on'] = () => setKey({});
  ACTIONS['trk-renew'] = () => { if (confirm('Neue Adresse erzeugen? Die alte funktioniert dann nicht mehr; in der Tracker-App muss die neue eingetragen werden.')) setKey({}); };
  ACTIONS['trk-off'] = () => { if (confirm('Tracker-Adresse ausschalten? Die Tracker-App kann dann nichts mehr melden.')) setKey({ off: true }); };
  ACTIONS['trk-copy'] = async el => { try { await navigator.clipboard.writeText(el.dataset.u); toast('Kopiert'); } catch { prompt('Adresse kopieren:', el.dataset.u); } };
}
