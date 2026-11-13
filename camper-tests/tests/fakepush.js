// Ersatz-Push-Dienst: nimmt Web-Push-Nachrichten an, prüft VAPID und entschlüsselt (RFC 8291) wie ein Gerät
const http = require('http'), crypto = require('crypto'), fs = require('fs');
const keys = crypto.createECDH('prime256v1'); keys.generateKeys();
const auth = crypto.randomBytes(16);
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
fs.writeFileSync(__dirname + '/fakepush-sub.json', JSON.stringify({ p256dh: b64u(keys.getPublicKey()), auth: b64u(auth) }));
const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
const got = [];
http.createServer((req, res) => {
  const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
    if (req.method === 'GET') { res.end(JSON.stringify(got)); return; }
    const body = Buffer.concat(chunks), out = { path: req.url, enc: req.headers['content-encoding'], ttl: req.headers.ttl };
    try {
      // VAPID prüfen
      const m = /vapid t=([^,]+), k=(.+)/.exec(req.headers.authorization || '');
      const [h, c, sig] = m[1].split('.');
      const pub = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(unb(m[2]).slice(1, 33)), y: b64u(unb(m[2]).slice(33, 65)) }, format: 'jwk' });
      out.vapidOk = crypto.verify('sha256', Buffer.from(`${h}.${c}`), { key: pub, dsaEncoding: 'ieee-p1363' }, unb(sig));
      out.claims = JSON.parse(unb(c).toString());
      // Entschlüsseln
      const salt = body.slice(0, 16), idlen = body[20], as = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
      const shared = keys.computeSecret(as);
      const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), keys.getPublicKey(), as]), 32);
      const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
      const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(ct.slice(-16));
      const plain = Buffer.concat([d.update(ct.slice(0, -16)), d.final()]);
      out.payload = JSON.parse(plain.slice(0, plain.lastIndexOf(2)).toString());
    } catch (e) { out.error = e.message; }
    got.push(out); res.statusCode = req.url.includes('gone') ? 410 : 201; res.end();
  });
}).listen(9911, () => console.log('fakepush ready'));
