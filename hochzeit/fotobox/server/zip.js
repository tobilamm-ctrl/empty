/*
 * ZIP-Datei. zip([{ name, daten: Buffer, zeit?: Date, packen?: true, modus?: 0o755 }]) → Buffer
 * „modus“ speichert Unix-Dateirechte (z. B. ausführbar), Windows ignoriert sie.
 * Ohne „packen“ unkomprimiert (Fotos sind schon JPEG), mit „packen“ Deflate (z. B. Programmdateien).
 */
'use strict';
const zlib = require('zlib');

const TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = TABELLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

function dosZeit(d) {
  return {
    zeit: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    datum: ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

function zip(eintraege) {
  const teile = [], verzeichnis = [];
  let pos = 0;
  eintraege.forEach((e) => {
    const name = Buffer.from(e.name, 'utf8'), roh = e.daten, crc = crc32(roh), { zeit, datum } = dosZeit(e.zeit || new Date());
    const gepackt = e.packen ? zlib.deflateRawSync(roh, { level: 9 }) : null;
    const methode = gepackt && gepackt.length < roh.length ? 8 : 0, daten = methode ? gepackt : roh;
    const kopf = Buffer.alloc(30);
    kopf.writeUInt32LE(0x04034b50, 0); kopf.writeUInt16LE(20, 4); kopf.writeUInt16LE(0x0800, 6); kopf.writeUInt16LE(methode, 8);
    kopf.writeUInt16LE(zeit, 10); kopf.writeUInt16LE(datum, 12); kopf.writeUInt32LE(crc, 14);
    kopf.writeUInt32LE(daten.length, 18); kopf.writeUInt32LE(roh.length, 22); kopf.writeUInt16LE(name.length, 26); kopf.writeUInt16LE(0, 28);
    const z = Buffer.alloc(46);
    z.writeUInt32LE(0x02014b50, 0); z.writeUInt16LE(e.modus ? (3 << 8) | 20 : 20, 4); z.writeUInt16LE(20, 6); z.writeUInt16LE(0x0800, 8); z.writeUInt16LE(methode, 10);
    z.writeUInt16LE(zeit, 12); z.writeUInt16LE(datum, 14); z.writeUInt32LE(crc, 16); z.writeUInt32LE(daten.length, 20);
    z.writeUInt32LE(roh.length, 24); z.writeUInt16LE(name.length, 28);
    if (e.modus) z.writeUInt32LE(((0o100000 | e.modus) << 16) >>> 0, 38);
    z.writeUInt32LE(pos, 42);
    teile.push(kopf, name, daten); verzeichnis.push(z, name);
    pos += 30 + name.length + daten.length;
  });
  const vz = Buffer.concat(verzeichnis), ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50, 0); ende.writeUInt16LE(eintraege.length, 8); ende.writeUInt16LE(eintraege.length, 10);
  ende.writeUInt32LE(vz.length, 12); ende.writeUInt32LE(pos, 16);
  return Buffer.concat([...teile, vz, ende]);
}

module.exports = { zip, crc32 };
