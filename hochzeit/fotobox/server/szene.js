/*
 * Gezeichnete Gäste vor Lichterketten – Ersatzbild für den Kamera-Simulator.
 * zeichneSzene(ctx, w, h, t, seed): t in Sekunden (leichtes Wippen), seed bestimmt Personen und Farben.
 */
'use strict';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
const KLEIDUNG = ['#5d6f99', '#b45b5b', '#4f7f63', '#c9a25a', '#7d64a0', '#2f3a4a', '#9a6b4f'];
const HAUT = ['#f1c9a5', '#d9a47c', '#a8714f', '#f3d3b8', '#8c5a3c'];
const HAARE = ['#2b1d14', '#5a3a22', '#c9a46a', '#151515', '#8a4b2a'];

function zeichneSzene(ctx, w, h, t, seed) {
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3d3029'); g.addColorStop(1, '#191517');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    const x = r() * w + Math.sin(t * 0.3 + i) * w * 0.01, y = r() * h * 0.62, rad = (0.015 + r() * 0.045) * w, a = 0.07 + r() * 0.2;
    ctx.fillStyle = `rgba(255,205,135,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  const n = 2 + Math.floor(r() * 3);
  const leute = [];
  for (let i = 0; i < n; i++) {
    leute.push({ i, kl: KLEIDUNG[Math.floor(r() * KLEIDUNG.length)], hk: HAUT[Math.floor(r() * HAUT.length)], hr: HAARE[Math.floor(r() * HAARE.length)], s: 0.92 + r() * 0.16, dy: r() * 0.06, schleier: i === 0 && r() < 0.6 });
  }
  const einheit = Math.min(h, w / 1.5);
  leute.forEach((p) => {
    const cx = w * (0.5 + (p.i - (n - 1) / 2) * (0.62 / (n - 1))) + Math.sin(t * 0.9 + p.i) * w * 0.006;
    const kr = einheit * 0.085 * p.s;
    const ky = h * (0.42 + p.dy) + Math.sin(t * 1.3 + p.i * 1.7) * h * 0.008;
    if (p.schleier) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath();
      ctx.moveTo(cx - kr * 0.9, ky - kr * 0.4); ctx.lineTo(cx + kr * 0.9, ky - kr * 0.4); ctx.lineTo(cx + kr * 2.1, h); ctx.lineTo(cx - kr * 2.1, h);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = p.schleier ? '#f2eee6' : p.kl;
    rrect(ctx, cx - kr * 1.9, ky + kr * 1.15, kr * 3.8, h, kr * 0.9); ctx.fill();
    ctx.fillStyle = p.hk; ctx.beginPath(); ctx.arc(cx, ky, kr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.hr; ctx.beginPath(); ctx.arc(cx, ky - kr * 0.08, kr * 1.04, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    ctx.fillStyle = '#1c1410'; ctx.beginPath();
    ctx.arc(cx - kr * 0.35, ky + kr * 0.05, kr * 0.09, 0, Math.PI * 2); ctx.arc(cx + kr * 0.35, ky + kr * 0.05, kr * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a2a22'; ctx.lineWidth = Math.max(2, kr * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, ky + kr * 0.25, kr * 0.38, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
  });
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}

module.exports = { zeichneSzene };
