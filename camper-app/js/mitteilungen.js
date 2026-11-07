// Mitteilungen aufs Gerät (Web Push): neue Zettel an der Pinnwand und Erinnerungen an Tickets. Eingeschaltet wird je
// Gerät in den Einstellungen; der Server verschickt (api/index.php), angezeigt wird im Service Worker (sw.js).

export default function installMitteilungen(app) {
  const { ACTIONS, CHANGES, esc, toast, api, settingsPanels } = app;
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const b64uToBytes = s => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  const toB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sha1 = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');

  async function state() {
    if (!supported()) return { ok: false, why: ios() && !standalone() ? 'ios' : 'browser' };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    let srv = {};
    try { srv = await api('push-key'); } catch (e) { return { ok: false, why: 'server', msg: e.message }; }
    if (!srv.key) return { ok: false, why: 'server', msg: srv.error };
    const id = sub ? await sha1(sub.endpoint) : null;
    const row = (srv.subs || []).find(x => x.id === id) || null;
    return { ok: true, reg, sub, srv, row, perm: Notification.permission };
  }

  const panel = () => `<section class="panel" id="pushPanel"><h2>Mitteilungen</h2><div id="pushBody"><p class="sub">Wird geprüft …</p></div></section>`;
  settingsPanels.push(panel);
  async function fill() {
    const box = document.getElementById('pushBody');
    if (!box) return;
    const s = await state().catch(e => ({ ok: false, why: 'server', msg: e.message }));
    if (!document.getElementById('pushBody')) return;
    if (!s.ok) {
      box.innerHTML = s.why === 'ios' ? `<p>Auf dem iPhone und iPad gibt es Mitteilungen nur für die installierte App: in Safari auf <b>Teilen › Zum Home-Bildschirm</b>, dann LAMMping vom Home-Bildschirm öffnen und hier einschalten (ab iOS 16.4).</p>`
        : s.why === 'browser' ? '<p class="sub">Dieser Browser kann keine Mitteilungen empfangen.</p>'
          : `<p class="sub">Mitteilungen gehen gerade nicht: ${esc(s.msg || 'Der Server antwortet nicht.')} Dafür braucht es die neue api/index.php (Lieferung 70).</p>`;
      return;
    }
    const on = !!(s.sub && s.row && s.perm === 'granted');
    const pins = s.row ? s.row.pins : true, tickets = s.row ? s.row.tickets : true, friends = s.row ? s.row.friends !== false : true;
    box.innerHTML = `${s.perm === 'denied' ? `<p class="hint">Mitteilungen sind für LAMMping blockiert. Erlauben lässt es sich in den Einstellungen des Browsers bzw. des Handys
        (Android: Einstellungen › Apps › LAMMping › Benachrichtigungen; PC: Schloss links neben der Adresse › Benachrichtigungen).</p>` : ''}
      <p class="sub">${on ? '✅ Auf diesem Gerät eingeschaltet.' : 'Auf diesem Gerät aus. Mitteilungen kommen auch, wenn LAMMping geschlossen ist.'}</p>
      <label class="check"><input type="checkbox" data-action="push-pref" name="pins"${pins ? ' checked' : ''}><span>📌 Neue Zettel an der Pinnwand (von den anderen)</span></label>
      <label class="check"><input type="checkbox" data-action="push-pref" name="tickets"${tickets ? ' checked' : ''}><span>🎟️ Tickets: am Morgen des Tages und 3 Stunden vor Abfahrt, bei Flügen auch 24 Stunden vorher (Online-Check-in)</span></label>
      <label class="check"><input type="checkbox" data-action="push-pref" name="friends"${friends ? ' checked' : ''}><span>👋 Andere Crews: wenn eine losfährt, neue Einträge bei Crews, denen ihr folgt, und Anfragen zum Folgen (an Crew-Leiter)</span></label>
      <div class="btnrow">${on ? `<button class="ghost" data-action="push-test">Test-Mitteilung</button><button class="ghost danger" data-action="push-off">Ausschalten</button>`
        : `<button class="primary" data-action="push-on"${s.perm === 'denied' ? ' disabled' : ''}>Mitteilungen auf diesem Gerät einschalten</button>`}</div>
      ${s.srv.cron ? `<details class="push-cron"><summary>Für pünktliche Ticket-Erinnerungen: Cronjob (nur Super-Admin)</summary>
        <p class="sub">Ohne Cronjob prüft der Server die Tickets nur, wenn gerade jemand LAMMping offen hat. Viele Webspaces bieten „Cronjobs“ an:
          diese Adresse dort alle 10 Minuten aufrufen lassen.</p>
        <p class="cron-url"><code>${esc(s.srv.cron)}</code></p><button class="ghost small-btn" data-action="push-cron-copy" data-u="${esc(s.srv.cron)}">Adresse kopieren</button>
        <p class="sub">${s.srv.cronLast ? `Zuletzt aufgerufen: ${new Date(s.srv.cronLast).toLocaleString('de-DE')}` : 'Noch nie aufgerufen.'}</p></details>` : ''}`;
  }
  app.afterDraw.push(() => { if (document.getElementById('pushBody')) fill(); });

  const prefs = () => {
    const f = document.getElementById('pushBody');
    return { pins: !!(f && f.querySelector('[name=pins]:checked')), tickets: !!(f && f.querySelector('[name=tickets]:checked')), friends: !!(f && f.querySelector('[name=friends]:checked')) };
  };
  async function register(sub) {
    const j = sub.toJSON();
    await api('push-sub', { endpoint: sub.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, ...prefs() });
  }
  ACTIONS['push-on'] = async el => {
    el.disabled = true;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast('Ohne Erlaubnis keine Mitteilungen.'); return fill(); }
      const { key } = await api('push-key');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) });
      await register(sub);
      toast('Mitteilungen eingeschaltet');
    } catch (e) { toast(`Hat nicht geklappt: ${e.message}`); }
    fill();
  };
  ACTIONS['push-off'] = async () => {
    try {
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { await api('push-unsub', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
      toast('Mitteilungen auf diesem Gerät ausgeschaltet');
    } catch (e) { toast(e.message); }
    fill();
  };
  CHANGES['push-pref'] = async () => {
    try {
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (sub) { await register(sub); toast('Gespeichert'); }
    } catch (e) { toast(e.message); }
  };
  ACTIONS['push-test'] = async () => {
    try {
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      const r = await api('push-test', { endpoint: sub.endpoint });
      toast(r.ok ? 'Test-Mitteilung ist unterwegs' : `Der Push-Dienst hat abgelehnt (${r.code}).`);
    } catch (e) { toast(e.message); }
  };
  ACTIONS['push-cron-copy'] = async el => { try { await navigator.clipboard.writeText(el.dataset.u); toast('Kopiert'); } catch { toast(el.dataset.u); } };
  // Einmal im Monat die Anmeldung auffrischen (Zeitzone, falls der Push-Dienst sie erneuert hat)
  setTimeout(async () => {
    if (!supported() || Notification.permission !== 'granted' || !app.session()) return;
    try {
      const last = app.LS.get('pushRefresh', 0);
      if (Date.now() - last < 30 * 864e5) return;
      const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      const s = await api('push-key'), id = await sha1(sub.endpoint), row = (s.subs || []).find(x => x.id === id);
      await api('push-sub', { endpoint: sub.endpoint, p256dh: sub.toJSON().keys.p256dh, auth: sub.toJSON().keys.auth, tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pins: row ? row.pins : true, tickets: row ? row.tickets : true, friends: row ? row.friends !== false : true });
      app.LS.set('pushRefresh', Date.now());
    } catch { /* später noch einmal */ }
  }, 8000);
}
