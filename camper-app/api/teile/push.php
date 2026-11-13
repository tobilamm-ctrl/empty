<?php
// Teil des LAMMping-Servers, wird von api/index.php eingebunden. Mitteilungen (Web Push, RFC 8291/8292) und Ticket-Erinnerungen.

declare(strict_types=1);
if (!defined('API_VERSION')) { http_response_code(403); exit; }

/* ---------- Mitteilungen (Web Push, RFC 8291/8292) ---------- */

function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64ud(string $s): string { return (string) base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4)); }
function kvGet(string $k): ?string { $r = one('SELECT v FROM kv WHERE k = ?', [$k]); return $r ? (string) $r['v'] : null; }
function kvSet(string $k, string $v): void { q('DELETE FROM kv WHERE k = ?', [$k]); q('INSERT INTO kv (k, v) VALUES (?, ?)', [$k, $v]); }
// Öffentlicher Schlüssel als rohe Punktdarstellung (65 Byte)
function ecRaw(array $d): string { return "\x04" . str_pad($d['ec']['x'], 32, "\0", STR_PAD_LEFT) . str_pad($d['ec']['y'], 32, "\0", STR_PAD_LEFT); }
// Rohen P-256-Punkt als PEM (für openssl_pkey_derive)
function ecPem(string $raw): string {
    $der = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $raw;
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----\n";
}
// VAPID-Schlüssel: beim ersten Bedarf erzeugen und in der Datenbank ablegen
function vapid(): array {
    $pem = kvGet('vapid_priv');
    if (!$pem) {
        $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
        if (!$key) fail('Auf dem Server fehlt OpenSSL mit elliptischen Kurven.', 500);
        openssl_pkey_export($key, $pem);
        kvSet('vapid_priv', $pem);
        kvSet('cron_key', bin2hex(random_bytes(12)));
    }
    $key = openssl_pkey_get_private($pem);
    return ['key' => $key, 'pub' => b64u(ecRaw(openssl_pkey_get_details($key)))];
}
// ECDSA-Signatur (DER) in die 64 Byte r||s umwandeln, wie JWT sie will
function derToRaw(string $der): string {
    $o = 3; if (ord($der[1]) & 0x80) $o += ord($der[1]) & 0x7f;
    $rl = ord($der[$o]); $r = substr($der, $o + 1, $rl); $o += 1 + $rl + 1;
    $sl = ord($der[$o]); $sv = substr($der, $o + 1, $sl);
    $fix = fn($x) => str_pad(ltrim($x, "\0"), 32, "\0", STR_PAD_LEFT);
    return $fix($r) . $fix($sv);
}
function vapidHeader(string $endpoint): string {
    $v = vapid();
    $u = parse_url($endpoint);
    $head = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $claims = b64u(json_encode(['aud' => $u['scheme'] . '://' . $u['host'], 'exp' => time() + 12 * 3600, 'sub' => 'mailto:lammping@' . ($_SERVER['HTTP_HOST'] ?? 'localhost')]));
    openssl_sign("$head.$claims", $sig, $v['key'], OPENSSL_ALGO_SHA256);
    return 'vapid t=' . "$head.$claims." . b64u(derToRaw($sig)) . ', k=' . $v['pub'];
}
// Nachricht verschlüsseln (aes128gcm, RFC 8291)
function pushEncrypt(string $payload, string $p256dh, string $auth): string {
    $ua = b64ud($p256dh); $secret = b64ud($auth);
    $eph = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    $as = ecRaw(openssl_pkey_get_details($eph));
    $shared = openssl_pkey_derive(openssl_pkey_get_public(ecPem($ua)), $eph, 32);
    $ikm = hash_hkdf('sha256', $shared, 32, "WebPush: info\0" . $ua . $as, $secret);
    $salt = random_bytes(16);
    $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
    $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);
    $ct = openssl_encrypt($payload . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
    return $salt . pack('N', 4096) . chr(65) . $as . $ct . $tag;
}
// An ein Gerät senden; abgelaufene Anmeldungen (404/410) werden gelöscht
function pushSend(array $sub, array $msg): int {
    $body = pushEncrypt(json_encode($msg, JSON_UNESCAPED_UNICODE), $sub['p256dh'], $sub['auth']);
    $ch = curl_init($sub['endpoint']);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6,
        CURLOPT_HTTPHEADER => ['Content-Type: application/octet-stream', 'Content-Encoding: aes128gcm', 'TTL: 43200', 'Urgency: normal',
            'Authorization: ' . vapidHeader($sub['endpoint'])]]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code === 404 || $code === 410) q('DELETE FROM push_subs WHERE id = ?', [$sub['id']]);
    return $code;
}
// An alle Mitglieder einer Crew (mit der jeweiligen Einstellung), außer an $skipUser
function pushCrew(string $crew, string $pref, array $msg, string $skipUser = ''): void {
    if (!function_exists('curl_init') || !function_exists('openssl_pkey_derive')) return;
    $subs = all("SELECT s.* FROM push_subs s JOIN members m ON m.user_id = s.user_id WHERE m.crew_id = ? AND s.$pref = 1 AND s.user_id <> ?", [$crew, $skipUser]);
    foreach ($subs as $sub) { try { pushSend($sub, $msg); } catch (Throwable $e) { /* ein Gerät darf die anderen nicht aufhalten */ } }
}
// Ticket-Erinnerungen: am Morgen (8 Uhr) des Tages und bei Uhrzeit 3 Stunden vorher, in der Zeitzone des Geräts
function ticketReminders(): int {
    $sent = 0;
    $subs = all('SELECT s.*, m.crew_id FROM push_subs s JOIN members m ON m.user_id = s.user_id WHERE s.tickets = 1');
    if (!$subs) return 0;
    $byCrew = []; $dead = [];
    foreach ($subs as $s) $byCrew[$s['crew_id']][] = $s;
    foreach ($byCrew as $crew => $list) {
        $tickets = array_filter(array_map(fn($r) => json_decode($r['data'], true), all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'games' AND deleted = 0 AND data LIKE '%\"kind\":\"ticket\"%'", [$crew])),
            fn($t) => is_array($t) && ($t['kind'] ?? '') === 'ticket' && !empty($t['date']));
        foreach ($tickets as $t) foreach ($list as $sub) {
            if (isset($dead[$sub['id']])) continue;
            try { $tz = new DateTimeZone($sub['tz'] ?: 'Europe/Berlin'); } catch (Throwable $e) { $tz = new DateTimeZone('Europe/Berlin'); }
            $now = new DateTime('now', $tz);
            $time = preg_match('/^\d\d:\d\d$/', (string) ($t['time'] ?? '')) ? $t['time'] : '';
            $title = '🎟️ ' . mb_substr((string) ($t['title'] ?? 'Ticket'), 0, 80);
            $msgs = []; $mins = null;
            if ($time) {
                $at = new DateTime($t['date'] . ' ' . $time, $tz);
                $mins = ($at->getTimestamp() - $now->getTimestamp()) / 60;
                // Flug: einen Tag vorher an den Online-Check-in erinnern (zwischen 25 und 20 Stunden vorher)
                if (($t['kindKey'] ?? '') === 'flug' && $mins > 20 * 60 && $mins <= 25 * 60) $msgs['c'] = 'Online-Check-in: Abflug ' . ($t['date'] === $now->format('Y-m-d') ? 'heute' : 'morgen') . ' um ' . $time . ' Uhr'
                    . (!empty($t['flight']) ? ' (' . $t['flight'] . ')' : '') . (!empty($t['number']) ? ' · Buchung ' . $t['number'] : '');
                if ($mins > 0 && $mins <= 180) $msgs['h'] = ($t['date'] === $now->format('Y-m-d') ? 'Heute' : 'Morgen') . ' um ' . $time . ' Uhr' . (!empty($t['place']) ? ', ' . $t['place'] : '') . (!empty($t['number']) ? ' · Buchung ' . $t['number'] : '');
            }
            // Morgens am Tag selbst (bei frühen Abfahrten reicht die Erinnerung 3 Stunden vorher)
            // Morgens nur, solange es bis zur Abfahrt noch mehr als 3 Stunden sind (sonst kommt die andere Erinnerung)
            if ($t['date'] === $now->format('Y-m-d') && $now->format('H:i') >= '08:00' && ($mins === null || $mins > 180)) {
                $msgs['m'] = 'Heute' . ($time ? ' um ' . $time . ' Uhr' : '') . (!empty($t['place']) ? ': ' . $t['place'] : '');
            }
            foreach ($msgs as $kind => $body) {
                $k = substr("t:{$t['id']}:{$t['date']}:$kind:{$sub['id']}", 0, 160);
                if (one('SELECT k FROM push_log WHERE k = ?', [$k])) continue;
                q('INSERT INTO push_log (k, at) VALUES (?, ?)', [$k, now()]);
                // Kommt die Erinnerung 3 Stunden vorher, ist die vom Morgen erledigt
                if ($kind === 'h') { $km = substr("t:{$t['id']}:{$t['date']}:m:{$sub['id']}", 0, 160); if (!one('SELECT k FROM push_log WHERE k = ?', [$km])) q('INSERT INTO push_log (k, at) VALUES (?, ?)', [$km, now()]); }
                try {
                    $code = pushSend($sub, ['title' => $title, 'body' => $body, 'url' => './#/tickets', 'tag' => 'ticket-' . $t['id']]);
                    if ($code === 404 || $code === 410) { $dead[$sub['id']] = true; break; }
                    $sent++;
                } catch (Throwable $e) { /* weiter */ }
            }
        }
    }
    q('DELETE FROM push_log WHERE at < ?', [now() - 14 * 86400000]);
    return $sent;
}
// Ohne Cronjob: bei Abgleichen höchstens alle 5 Minuten nachsehen
function maybeReminders(): void {
    if (!function_exists('curl_init')) return;
    $last = (int) (kvGet('cron_last') ?? 0);
    if (now() - $last < 5 * 60000) return;
    kvSet('cron_last', (string) now());
    try { ticketReminders(); } catch (Throwable $e) { /* nie den Abgleich stören */ }
    try { friendStarts(); } catch (Throwable $e) { /* nie den Abgleich stören */ }
}
