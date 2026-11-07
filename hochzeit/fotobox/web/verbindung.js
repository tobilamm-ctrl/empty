/*
 * Verbindung zum Fotobox-Server (WebSocket mit automatischem Neuaufbau), Gestaltung anwenden, Bluetooth-Knopf.
 *   Fotobox.verbinden(beiZustand)   Fotobox.aktion(name, daten)   Fotobox.admin(pin, aktion, daten) → Promise
 *   Fotobox.toeneAusZustand(z, 'buehne'|'ipad')  Countdown-Piep und Auslösegeräusch je nach Einstellung „Töne“
 *   Fotobox.knopfAktivieren()       Tasten aus config.json („knopf.tasten“) und angelernte Tasten lösen den Countdown aus;
 *                                   im Lernmodus (Service → „Knopf anlernen“) wird der nächste Tastendruck gespeichert
 */
(function () {
  'use strict';
  let ws = null, beiZustand = () => {}, tasten = [], lernen = false, warteschlange = [], antworten = [];
  const banner = document.createElement('div');
  banner.className = 'getrennt'; banner.hidden = true; banner.textContent = 'Verbindung zur Fotobox unterbrochen – verbinde neu …';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));

  function senden(n) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(n)); else warteschlange.push(n); }

  function aufbauen(verzug) {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { banner.hidden = true; verzug = 500; warteschlange.splice(0).forEach(senden); };
    ws.onmessage = (ev) => {
      const n = JSON.parse(ev.data);
      if (n.typ === 'zustand') {
        tasten = n.zustand.einstellungen.knopfTasten || []; lernen = !!n.zustand.knopfLernen;
        gestaltung(n.zustand.gestaltung); beiZustand(n.zustand);
      }
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
      if (lernen && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) { e.preventDefault(); lernen = false; senden({ typ: 'knopfGelernt', taste: e.key || e.code }); return; }
      if (tasten.includes(e.key) || tasten.includes(e.code)) { e.preventDefault(); senden({ typ: 'aktion', aktion: 'knopf' }); }
    });
  }

  // Töne ohne Dateien (WebAudio): Piep je Countdown-Zahl, Auslösegeräusch beim Blitz.
  // Der Browser erlaubt Ton erst nach einer Berührung; am großen Bildschirm startet Edge mit passender Einstellung.
  let audio = null;
  const audioBereit = () => {
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; }
    return audio;
  };
  ['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, audioBereit, { capture: true, passive: true }));
  function ton(art, lautstaerke) {
    const a = audioBereit(); if (!a || !lautstaerke) return;
    const v = Math.max(0, Math.min(1, lautstaerke / 100)) * 0.5, t = a.currentTime, g = a.createGain();
    g.connect(a.destination);
    if (art === 'ausloeser') { // kurzes gefiltertes Rauschen wie ein Verschluss
      const len = Math.floor(a.sampleRate * 0.18), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const q = a.createBufferSource(), f = a.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.8;
      q.buffer = buf; q.connect(f); f.connect(g); g.gain.value = v * 1.6; q.start(t);
      return;
    }
    const o = a.createOscillator();
    o.type = 'sine'; o.frequency.value = art === 'letzter' ? 1320 : 880;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); o.start(t); o.stop(t + 0.13);
  }
  // Aus zwei aufeinanderfolgenden Zuständen die passenden Töne ableiten; ort: 'buehne' oder 'ipad'
  let vorher = null;
  function toeneAusZustand(z, ort) {
    const e = z.einstellungen, an = e.toene === 'beide' || e.toene === ort;
    if (an && vorher) {
      if (z.countdown && z.countdown !== vorher.countdown) ton(z.countdown === 1 ? 'letzter' : 'piep', e.lautstaerke);
      if (z.blitz !== vorher.blitz) ton('ausloeser', e.lautstaerke);
    }
    vorher = { countdown: z.countdown, blitz: z.blitz };
  }

  window.Fotobox = {
    toeneAusZustand,
    verbinden(f) { beiZustand = f; aufbauen(500); },
    aktion(name, daten) { senden({ typ: 'aktion', aktion: name, daten }); },
    admin(pin, aktion, daten) { return new Promise((ok) => { antworten.push(ok); senden({ typ: 'admin', pin, aktion, daten }); }); },
    knopfAktivieren,
  };
})();
