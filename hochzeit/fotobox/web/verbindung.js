/*
 * Verbindung zum Fotobox-Server (WebSocket mit automatischem Neuaufbau), Gestaltung anwenden, Bluetooth-Knopf.
 *   Fotobox.verbinden(beiZustand)   Fotobox.aktion(name, daten)   Fotobox.admin(pin, aktion, daten) → Promise
 *   Fotobox.knopfAktivieren()       Tasten aus config.json („knopf.tasten“) lösen den Countdown aus
 */
(function () {
  'use strict';
  let ws = null, beiZustand = () => {}, tasten = [], warteschlange = [], antworten = [];
  const banner = document.createElement('div');
  banner.className = 'getrennt'; banner.hidden = true; banner.textContent = 'Verbindung zur Fotobox unterbrochen – verbinde neu …';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));

  function senden(n) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(n)); else warteschlange.push(n); }

  function aufbauen(verzug) {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { banner.hidden = true; verzug = 500; warteschlange.splice(0).forEach(senden); };
    ws.onmessage = (ev) => {
      const n = JSON.parse(ev.data);
      if (n.knopfTasten) tasten = n.knopfTasten;
      if (n.typ === 'zustand') { gestaltung(n.zustand.gestaltung); beiZustand(n.zustand); }
      if (n.typ === 'antwort') { const a = antworten.shift(); if (a) a(n); }
    };
    ws.onclose = () => { banner.hidden = false; setTimeout(() => aufbauen(Math.min(verzug * 2, 5000)), verzug); };
  }

  let letzteGestaltung = '';
  function gestaltung(css) {
    const s = JSON.stringify(css || {});
    if (s === letzteGestaltung) return;
    letzteGestaltung = s;
    Object.keys(css || {}).forEach((k) => document.documentElement.style.setProperty(k, css[k]));
  }

  // Eigene Schriften aus dem Import (z. B. die Schrift der Einladungskarte)
  fetch('/api/schriften').then((r) => r.json()).then((d) => (d.eigene || []).forEach((s) => {
    try { const f = new FontFace(s.name, `url(/schriften/${encodeURIComponent(s.datei)})`); f.load().then(() => document.fonts.add(f)); } catch (e) { /* alte Browser */ }
  })).catch(() => {});

  // Bluetooth-Knopf: koppelt sich wie eine Tastatur und schickt z. B. Enter, Leertaste oder „Lauter“
  function knopfAktivieren() {
    document.addEventListener('keydown', (e) => {
      if (e.repeat || /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
      if (tasten.includes(e.key) || tasten.includes(e.code)) { e.preventDefault(); senden({ typ: 'aktion', aktion: 'knopf' }); }
    });
  }

  window.Fotobox = {
    verbinden(f) { beiZustand = f; aufbauen(500); },
    aktion(name, daten) { senden({ typ: 'aktion', aktion: name, daten }); },
    admin(pin, aktion, daten) { return new Promise((ok) => { antworten.push(ok); senden({ typ: 'admin', pin, aktion, daten }); }); },
    knopfAktivieren,
  };
})();
