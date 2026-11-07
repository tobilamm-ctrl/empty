// Start-Hilfe oben im Tagebuch, nur solange etwas fehlt:
// (1) LAMMping läuft noch im Browser → auf den Startbildschirm legen (mit Grund und passender Anleitung),
// (2) installiert, aber Mitteilungen noch nicht erlaubt → mit einem Tipp einschalten.
// Das Erlaubnis-Fenster des Handys darf erst nach einem Tipp kommen; deshalb ein eigener Hinweis statt automatisch.
// „Später“ fragt nach 3 Tagen wieder, „Nein, danke“ bei den Mitteilungen nie wieder.

export default function installStarthilfe(app) {
  const { LS, ACTIONS, icon, render } = app;
  const DAY = 864e5;
  const ua = navigator.userAgent;
  const pushOk = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const snoozed = k => Date.now() < (LS.get(k, 0) || 0);
  // Je Browser die passende Anleitung (ohne eigenen Installieren-Knopf)
  function howTo(st) {
    if (st.ios) return `In Safari unten auf ${st.shareIcon} <b>Teilen</b>, dann <b>„Zum Home-Bildschirm“</b>. Danach LAMMping über das Schaf auf dem Startbildschirm öffnen.`;
    if (/SamsungBrowser/.test(ua)) return 'Unten auf <b>☰ Menü</b>, dann <b>„Seite hinzufügen zu“ › „Startbildschirm“</b>.';
    if (/Firefox/.test(ua)) return 'Oben auf <b>⋮</b>, dann <b>„Installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b>.';
    if (/Android/.test(ua)) return 'Oben rechts auf <b>⋮</b>, dann <b>„App installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b>.';
    return 'Im Browser-Menü <b>„App installieren“</b> wählen (Chrome und Edge: Symbol rechts in der Adresszeile).';
  }
  const card = (body, btns) => `<aside class="install-hint start-help">
    <svg class="hint-sheep" aria-hidden="true"><use href="#schaf"/></svg>
    <div class="sh-body">${body}<div class="sh-btns">${btns}</div></div></aside>`;

  app.startHelp = () => {
    const ses = app.session && app.session();
    // Kinderansicht: keine Einrichtungs-Hinweise
    if (!ses || (ses.user && ses.user.simple)) return '';
    const st = app.installState();
    if (!st.standalone) {
      if (snoozed('helpInstallUntil')) return '';
      return card(`<p><b>LAMMping auf den Startbildschirm legen</b></p>
        <p class="sub">Als App läuft LAMMping zuverlässiger: auch ohne Netz, ohne Browserleiste, mit Mitteilungen${st.ios ? ' (auf dem iPhone nur so)' : ''}
          und mit „Teilen › LAMMping“ für Fotos. Der Browser räumt Daten einer App außerdem nicht so schnell weg.</p>
        ${st.prompt ? '' : `<p class="sh-how">${howTo(st)}</p>`}`,
      `${st.prompt ? '<button class="primary" data-action="install">Installieren</button>' : ''}
        <button class="ghost small-btn" data-action="help-later" data-k="helpInstallUntil">Später</button>`);
    }
    if (pushOk() && Notification.permission === 'default' && !LS.get('helpPushNever', false) && !snoozed('helpPushUntil')) {
      return card(`<p><b>🔔 Mitteilungen einschalten?</b></p>
        <p class="sub">Für neue Zettel an der Pinnwand, Ticket-Erinnerungen und wenn andere Crews losfahren. Was genau, stellt ihr unter Einstellungen › Mitteilungen ein.</p>`,
      `<button class="primary" data-action="help-push">Einschalten</button>
        <button class="ghost small-btn" data-action="help-later" data-k="helpPushUntil">Später</button>
        <button class="link" data-action="help-push-never">Nein, danke</button>`);
    }
    return '';
  };
  ACTIONS['help-later'] = el => { LS.set(el.dataset.k, Date.now() + 3 * DAY); render(); };
  ACTIONS['help-push-never'] = () => { LS.set('helpPushNever', true); app.toast('Einschalten geht jederzeit unter Einstellungen › Mitteilungen.'); render(); };
  // Gleicher Weg wie in den Einstellungen (mitteilungen.js): Erlaubnis, Anmeldung beim Push-Dienst, beim Server speichern
  ACTIONS['help-push'] = async el => {
    if (ACTIONS['push-on']) await ACTIONS['push-on'](el);
    render();
  };
  // Erledigt? Dann gleich neu zeichnen (z. B. nach der Installation)
  window.addEventListener('appinstalled', () => setTimeout(render, 300));
}
