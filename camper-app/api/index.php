<?php
// LAMMping-Server: Konten, Crews, Abgleich der Daten und Fotos.
// Alle Anfragen laufen über api/?a=<aktion>. Antworten sind JSON.

declare(strict_types=1);

$CFG = require __DIR__ . '/config.php';
const COLLS = ['trips', 'entries', 'expenses', 'boxes', 'items', 'packstate', 'lists', 'listItems', 'meta', 'photos',
    'fuel', 'places', 'checklists', 'checkstate', 'deadlines', 'tracks', 'documents', 'recipes', 'plates', 'games', 'ideas', 'stamps', 'files'];
const CASH_COLLS = ['expenses', 'fuel'];   // nur mit Kassen-Freigabe
const ADMIN_COLLS = ['documents'];         // Ausweise & Co.: nur Crew-Leiter
const ADMIN_WRITE = ['stamps'];            // eigene Reisepass-Stempel: alle sehen sie, nur Crew-Leiter vergeben sie
const FILE_MAX = 10 * 1024 * 1024;         // PDFs (Tickets, Prospekte, Dokumente) bis 10 MB
const INVITE_DAYS = 14;                    // so lange gilt ein Einladungslink
const TOKEN_DAYS = 400;
const API_VERSION = 32;                     // erhöhen, wenn die App neue Server-Aktionen braucht
const COOKIE = 'lammping';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(string $msg, int $code = 400): void { out(['error' => $msg], $code); }
function newId(): string { return bin2hex(random_bytes(8)); }
function now(): int { return (int) round(microtime(true) * 1000); }
function validId($s): bool { return is_string($s) && preg_match('/^[A-Za-z0-9_-]{1,64}$/', $s) === 1; }

/* ---------- Datenbank ---------- */

function db(): PDO {
    static $pdo = null;
    global $CFG;
    if ($pdo) return $pdo;
    $pdo = new PDO($CFG['db'], $CFG['db_user'], $CFG['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    if (!$mysql) {
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    }
    $tables = [
        'users' => 'id VARCHAR(32) PRIMARY KEY, name VARCHAR(100) NOT NULL, login VARCHAR(100) NOT NULL UNIQUE, pass VARCHAR(255) NOT NULL, is_admin INT NOT NULL DEFAULT 0, created BIGINT NOT NULL',
        'crews' => 'id VARCHAR(32) PRIMARY KEY, name VARCHAR(100) NOT NULL, created BIGINT NOT NULL',
        'members' => 'crew_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, shares INT NOT NULL DEFAULT 1, PRIMARY KEY (crew_id, user_id)',
        'tokens' => 'hash CHAR(64) PRIMARY KEY, user_id VARCHAR(32) NOT NULL, expires BIGINT NOT NULL',
        'docs' => 'crew_id VARCHAR(32) NOT NULL, coll VARCHAR(32) NOT NULL, id VARCHAR(64) NOT NULL, data MEDIUMTEXT, deleted INT NOT NULL DEFAULT 0, rev BIGINT NOT NULL, by_user VARCHAR(32), PRIMARY KEY (crew_id, coll, id)'
            . ($mysql ? ', INDEX docs_rev (crew_id, rev)' : ''),
        'counter' => 'name VARCHAR(16) PRIMARY KEY, value BIGINT NOT NULL',
        'attempts' => 'ip VARCHAR(64) NOT NULL, ts BIGINT NOT NULL',
        // Reiseblog: geheimer Link zum Lesen einer Reise
        'shares' => 'token CHAR(32) PRIMARY KEY, crew_id VARCHAR(32) NOT NULL, trip_id VARCHAR(64) NOT NULL, created BIGINT NOT NULL, by_user VARCHAR(32)',
        // Einladung in eine Crew (Link bzw. QR-Code), mehrfach nutzbar bis zum Ablauf
        'invites' => 'token CHAR(32) PRIMARY KEY, crew_id VARCHAR(32) NOT NULL, created BIGINT NOT NULL, expires BIGINT NOT NULL, by_user VARCHAR(32), uses INT NOT NULL DEFAULT 0',
        // Mitverfolgen: follower_crew darf die Reisen von crew_id sehen (status ok) oder hat angefragt (requested)
        'follows' => 'crew_id VARCHAR(32) NOT NULL, follower_crew VARCHAR(32) NOT NULL, status VARCHAR(12) NOT NULL, created BIGINT NOT NULL, by_user VARCHAR(32), PRIMARY KEY (crew_id, follower_crew)',
        // Zuletzt gemeldeter Standort einer Crew (nur wenn sie ihn für Mitreisende freigibt)
        'livepos' => 'crew_id VARCHAR(32) PRIMARY KEY, lat DOUBLE NOT NULL, lng DOUBLE NOT NULL, at BIGINT NOT NULL, by_user VARCHAR(32)',
        // Mitteilungen (Web Push): ein Eintrag je Gerät; push_log verhindert doppelte Erinnerungen; kv: Schlüssel & Co.
        'push_subs' => 'id CHAR(40) PRIMARY KEY, user_id VARCHAR(32) NOT NULL, endpoint TEXT NOT NULL, p256dh VARCHAR(200) NOT NULL, auth VARCHAR(64) NOT NULL, tz VARCHAR(64), pins INT NOT NULL DEFAULT 1, tickets INT NOT NULL DEFAULT 1, created BIGINT NOT NULL',
        'push_log' => 'k VARCHAR(160) PRIMARY KEY, at BIGINT NOT NULL',
        'kv' => 'k VARCHAR(40) PRIMARY KEY, v TEXT NOT NULL',
        // Herzen im Reiseblog (Leser ohne Konto): eines je Gerät und Eintrag, Name freiwillig
        'blog_likes' => 'token CHAR(32) NOT NULL, entry_id VARCHAR(64) NOT NULL, device CHAR(40) NOT NULL, name VARCHAR(60), at BIGINT NOT NULL, PRIMARY KEY (token, entry_id, device)',
        // Tracker-App (GPSLogger, OwnTracks, Overland): geheimer Schlüssel je Person und Crew
        // Herzen von anderen Crews (Crews on the Road): eines je Person und Eintrag
        'crew_likes' => 'of_crew VARCHAR(32) NOT NULL, entry_id VARCHAR(64) NOT NULL, by_crew VARCHAR(32) NOT NULL, by_user VARCHAR(32) NOT NULL, at BIGINT NOT NULL, PRIMARY KEY (of_crew, entry_id, by_user)',
        'gps_keys' => 'k CHAR(32) PRIMARY KEY, crew_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, created BIGINT NOT NULL, last BIGINT NOT NULL DEFAULT 0',
    ];
    foreach ($tables as $name => $cols) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS $name ($cols)" . ($mysql ? ' DEFAULT CHARSET=utf8mb4' : ''));
    }
    if (!$mysql) $pdo->exec('CREATE INDEX IF NOT EXISTS docs_rev ON docs (crew_id, rev)');
    // Spätere Ergänzung: Wer darf die Kasse sehen? (bestehende Konten: ja)
    $cols = $mysql ? array_column($pdo->query('SHOW COLUMNS FROM users')->fetchAll(), 'Field')
                   : array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(), 'name');
    if (!in_array('can_cash', $cols, true)) $pdo->exec('ALTER TABLE users ADD COLUMN can_cash INT NOT NULL DEFAULT 1');
    // Kinderkonten: sichtbare Bereiche (JSON, leer = alles), einfache Ansicht, eigene Startseite
    if (!in_array('areas', $cols, true)) $pdo->exec('ALTER TABLE users ADD COLUMN areas TEXT');
    if (!in_array('simple', $cols, true)) $pdo->exec('ALTER TABLE users ADD COLUMN simple INT NOT NULL DEFAULT 0');
    if (!in_array('start', $cols, true)) $pdo->exec("ALTER TABLE users ADD COLUMN start VARCHAR(32) NOT NULL DEFAULT ''");
    // Mehrere Familien: wer darf eigene Crews gründen (bisherige Verwalter: ja)
    if (!in_array('can_found', $cols, true)) {
        $pdo->exec('ALTER TABLE users ADD COLUMN can_found INT NOT NULL DEFAULT 0');
        $pdo->exec('UPDATE users SET can_found = 1 WHERE is_admin = 1');
    }
    // Crew-Leiter je Crew (bisherige Verwalter werden Leiter ihrer Crews)
    $mcols = $mysql ? array_column($pdo->query('SHOW COLUMNS FROM members')->fetchAll(), 'Field')
                    : array_column($pdo->query('PRAGMA table_info(members)')->fetchAll(), 'name');
    if (!in_array('leader', $mcols, true)) {
        $pdo->exec('ALTER TABLE members ADD COLUMN leader INT NOT NULL DEFAULT 0');
        $pdo->exec('UPDATE members SET leader = 1 WHERE user_id IN (SELECT id FROM users WHERE is_admin = 1)');
    }
    // Reiseblog-Einstellungen (Fotos, Texte, Verzögerung …)
    $scols = $mysql ? array_column($pdo->query('SHOW COLUMNS FROM shares')->fetchAll(), 'Field')
                    : array_column($pdo->query('PRAGMA table_info(shares)')->fetchAll(), 'name');
    if (!in_array('opts', $scols, true)) $pdo->exec('ALTER TABLE shares ADD COLUMN opts TEXT');
    // Mitteilungen über andere Crews (losgefahren, Folge-Anfragen); bestehende Geräte: ja
    $pcols = $mysql ? array_column($pdo->query('SHOW COLUMNS FROM push_subs')->fetchAll(), 'Field')
                    : array_column($pdo->query('PRAGMA table_info(push_subs)')->fetchAll(), 'name');
    if (!in_array('friends', $pcols, true)) $pdo->exec('ALTER TABLE push_subs ADD COLUMN friends INT NOT NULL DEFAULT 1');
    $pdo->exec("INSERT INTO counter (name, value) SELECT 'rev', 0 WHERE NOT EXISTS (SELECT 1 FROM counter WHERE name = 'rev')");
    return $pdo;
}

function q(string $sql, array $args = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st;
}
function one(string $sql, array $args = []) { return q($sql, $args)->fetch() ?: null; }
function all(string $sql, array $args = []): array { return q($sql, $args)->fetchAll(); }

/* ---------- Anfrage ---------- */

$action = $_GET['a'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$body = [];
if ($method === 'POST') {
    // Eigener Header: Formulare fremder Seiten können ihn nicht setzen (Schutz vor CSRF)
    // Ausnahme: Tracker-Apps melden Standorte ohne eigenen Header, geschützt durch ihren geheimen Schlüssel (siehe 'gps')
    if ($action !== 'gps' && ($_SERVER['HTTP_X_LAMMPING'] ?? '') !== '1') fail('Ungültige Anfrage', 403);
    // PDFs kommen roh (siehe 'file'), alles andere als JSON
    $raw = file_get_contents('php://input') ?: '';
    $body = $action === 'file' ? [] : json_decode($raw ?: '[]', true);
    if ($action === 'gps' && !is_array($body)) $body = [];
    if (!is_array($body)) fail('Ungültige Daten');
}

/* ---------- Anmeldung ---------- */

function setCookieToken(string $token, int $expires): void {
    setcookie(COOKIE, $token, [
        'expires' => $expires,
        'path' => dirname($_SERVER['SCRIPT_NAME']) . '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function currentUser(): ?array {
    $token = $_COOKIE[COOKIE] ?? '';
    if (!$token) return null;
    $row = one('SELECT u.* FROM tokens t JOIN users u ON u.id = t.user_id WHERE t.hash = ? AND t.expires > ?', [hash('sha256', $token), now()]);
    return $row ?: null;
}

function requireUser(): array {
    $u = currentUser();
    if (!$u) fail('Nicht angemeldet', 401);
    return $u;
}

// Super-Admin: verwaltet alle Konten und darf das Gründen von Crews erlauben (sieht aber keine fremden Inhalte)
function requireAdmin(): array {
    $u = requireUser();
    if (!(int) $u['is_admin']) fail('Nur für den Super-Admin', 403);
    return $u;
}
function isLeader(array $u, string $crew): bool {
    return (bool) one('SELECT 1 AS ok FROM members WHERE crew_id = ? AND user_id = ? AND leader = 1', [$crew, $u['id']]);
}
function ledCrews(array $u): array { return array_column(all('SELECT crew_id FROM members WHERE user_id = ? AND leader = 1', [$u['id']]), 'crew_id'); }
function requireLeader(array $u, $crew): string {
    $crew = requireCrew($u, $crew);
    if (!isLeader($u, $crew)) fail('Nur für Crew-Leiter', 403);
    return $crew;
}
// Ein Konto „gehört“ einem Crew-Leiter, wenn es nur in Crews ist, die er leitet (und kein Super-Admin ist)
function manages(array $u, string $id): bool {
    if ((int) $u['is_admin']) return true;
    $t = one('SELECT is_admin FROM users WHERE id = ?', [$id]);
    if (!$t || (int) $t['is_admin']) return false;
    $theirs = array_column(all('SELECT crew_id FROM members WHERE user_id = ?', [$id]), 'crew_id');
    return $theirs && !array_diff($theirs, ledCrews($u));
}

// Crew-Leiter sehen die Kasse ihrer Crew immer, alle anderen nur mit Freigabe
function canCash(array $u, string $crew = ''): bool { return (int) $u['can_cash'] || ($crew !== '' && isLeader($u, $crew)); }

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
// Neuer Eintrag in der laufenden, sichtbaren Reise: Crews, die folgen, bekommen eine Mitteilung.
// Höchstens eine je Gerät und 20 Minuten (mehrere Fotos hintereinander sollen nicht dauernd klingeln).
function friendPosts(string $crew, array $entries): void {
    if (!function_exists('curl_init') || !function_exists('openssl_pkey_derive')) return;
    $t = friendRunning($crew);
    if (!$t) return;
    $mine = array_values(array_filter($entries, fn($e) => ($e['tripId'] ?? '') === $t['id']));
    if (!$mine) return;
    $e = end($mine);
    $types = ['stellplatz' => 'Stellplatz', 'sight' => 'Sehenswert', 'notiz' => 'Notiz', 'restaurant' => 'Café / Restaurant', 'wanderung' => 'Tour', 'baden' => 'Baden', 'unterkunft' => 'Unterkunft'];
    $what = trim((string) ($e['title'] ?? '')) ?: ($types[$e['type'] ?? ''] ?? 'Neuer Eintrag');
    $name = crewName($crew);
    $subs = all("SELECT s.* FROM push_subs s JOIN members m ON m.user_id = s.user_id JOIN follows f ON f.follower_crew = m.crew_id
        WHERE f.crew_id = ? AND f.status = 'ok' AND s.friends = 1 AND m.crew_id <> ?", [$crew, $crew]);
    foreach ($subs as $sub) {
        $k = substr("fp:$crew:{$sub['id']}", 0, 160);
        $last = one('SELECT at FROM push_log WHERE k = ?', [$k]);
        if ($last && (int) $last['at'] > now() - 20 * 60000) continue;
        q('DELETE FROM push_log WHERE k = ?', [$k]);
        q('INSERT INTO push_log (k, at) VALUES (?, ?)', [$k, now()]);
        try { pushSend($sub, ['title' => '👋 ' . $name . (count($mine) > 1 ? ': ' . count($mine) . ' neue Einträge' : ': neuer Eintrag'), 'body' => mb_substr($what, 0, 80) . (!empty($e['place']) ? ' · ' . $e['place'] : ''),
            'url' => './#/tagebuch', 'tag' => 'post-' . $crew]); } catch (Throwable $e2) { /* weiter */ }
    }
}
// Andere Crew ist losgefahren (ihre Reise läuft seit eben): allen anderen Crews Bescheid geben.
// Wer schon folgt, bekommt „ansehen“, die anderen „folgen anfragen“. Den Namen der Reise erfährt nur, wer folgt.
function friendStarts(?string $only = null): int {
    $sent = 0;
    $crews = $only ? [['id' => $only, 'name' => crewName($only)]] : all('SELECT id, name FROM crews');
    $d = date('Y-m-d');
    foreach ($crews as $c) {
        // Die zuletzt begonnene laufende Reise (eine alte, nie beendete Reise soll eine neue nicht verdecken)
        $run = array_filter(crewTrips($c['id']), fn($x) => empty($x['friendsHide']) && empty($x['ended']) && empty($x['archived']) && ($x['start'] ?? '') !== '' && $x['start'] <= $d && (($x['end'] ?? '') === '' || $x['end'] >= $d));
        usort($run, fn($a, $b) => strcmp((string) $b['start'], (string) $a['start']));
        $t = $run[0] ?? null;
        $k = 'run_' . $c['id'];
        $prev = kvGet($k);
        $now = $t ? (string) $t['id'] : '-';
        if ($prev === $now) continue;
        kvSet($k, $now);
        // Beim ersten Mal (neue api/index.php) nur merken, nicht melden; nur frisch begonnene Reisen (Start höchstens 2 Tage her),
        // damit eine alte, nie beendete Reise nicht als „losgefahren“ gilt
        if ($prev === null || !$t || (string) ($t['start'] ?? '') < date('Y-m-d', time() - 2 * 86400)) continue;
        $subs = all('SELECT s.*, m.crew_id FROM push_subs s JOIN members m ON m.user_id = s.user_id WHERE m.crew_id <> ? AND s.friends = 1', [$c['id']]);
        foreach ($subs as $sub) {
            $f = one("SELECT status FROM follows WHERE crew_id = ? AND follower_crew = ?", [$c['id'], $sub['crew_id']]);
            $ok = $f && $f['status'] === 'ok';
            try {
                pushSend($sub, ['title' => '👋 ' . $c['name'] . ' ist losgefahren', 'body' => $ok ? '„' . mb_substr((string) ($t['name'] ?? ''), 0, 60) . '“ – jetzt mitverfolgen' : ($f ? 'Eure Anfrage zum Folgen läuft noch.' : 'Antippen, um zu fragen, ob ihr folgen dürft.'),
                    'url' => './#/mitreisen', 'tag' => 'start-' . $c['id']]);
                $sent++;
            } catch (Throwable $e) { /* weiter */ }
        }
    }
    return $sent;
}

function crewName(string $id): string { return (string) (one('SELECT name FROM crews WHERE id = ?', [$id])['name'] ?? ''); }
// Laufende Reise einer Crew (nicht beendet, Start erreicht, Ende nicht vorbei) bzw. die zuletzt begonnene
function crewTrips(string $crew): array {
    return array_values(array_filter(array_map(fn($r) => json_decode($r['data'], true), all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'trips' AND deleted = 0", [$crew])), 'is_array'));
}
function runningTrip(string $crew): ?array {
    $d = date('Y-m-d');
    foreach (crewTrips($crew) as $t) {
        $s = (string) ($t['start'] ?? ''); $e = (string) ($t['end'] ?? '');
        if (empty($t['ended']) && empty($t['archived']) && $s !== '' && $s <= $d && ($e === '' || $e >= $d)) return $t;
    }
    return null;
}
// Für andere Crews sichtbare Reisen (Schalter „Für andere Crews sichtbar“), die neueste zuerst
function friendTrips(string $crew): array {
    $list = array_values(array_filter(crewTrips($crew), fn($t) => validId($t['id'] ?? null) && empty($t['friendsHide'])));
    usort($list, fn($a, $b) => strcmp((string) ($b['start'] ?? ''), (string) ($a['start'] ?? '')));
    return $list;
}
// Die zuletzt begonnene laufende, für andere Crews sichtbare Reise
function friendRunning(string $crew): ?array {
    $d = date('Y-m-d');
    foreach (friendTrips($crew) as $t) {
        $s = (string) ($t['start'] ?? ''); $e = (string) ($t['end'] ?? '');
        if (empty($t['ended']) && empty($t['archived']) && $s !== '' && $s <= $d && ($e === '' || $e >= $d)) return $t;
    }
    return null;
}
function lastTrip(string $crew): ?array {
    $d = date('Y-m-d');
    $list = array_filter(crewTrips($crew), fn($t) => ($t['start'] ?? '') !== '' && $t['start'] <= $d);
    usort($list, fn($a, $b) => strcmp($b['start'], $a['start']));
    return $list[0] ?? null;
}
function requireCrew(array $u, $crew): string {
    if (!validId($crew) || !one('SELECT 1 AS ok FROM members WHERE crew_id = ? AND user_id = ?', [$crew, $u['id']])) {
        fail('Kein Zugriff auf diese Crew', 403);
    }
    return $crew;
}

function login(string $userId): void {
    $token = bin2hex(random_bytes(32));
    $expires = now() + TOKEN_DAYS * 864e5;
    q('INSERT INTO tokens (hash, user_id, expires) VALUES (?, ?, ?)', [hash('sha256', $token), $userId, $expires]);
    q('DELETE FROM tokens WHERE expires < ?', [now()]);
    setCookieToken($token, (int) ($expires / 1000));
}

// Höchstens 10 Fehlversuche je Gerät (IP) in 15 Minuten
function limitAttempts(): void {
    q('DELETE FROM attempts WHERE ts < ?', [now() - 15 * 60000]);
    if ((int) one('SELECT COUNT(*) AS n FROM attempts WHERE ip = ?', [$_SERVER['REMOTE_ADDR'] ?? ''])['n'] >= 10) {
        fail('Zu viele Fehlversuche. Bitte in 15 Minuten noch einmal probieren.', 429);
    }
}
function failedAttempt(string $msg): void {
    q('INSERT INTO attempts (ip, ts) VALUES (?, ?)', [$_SERVER['REMOTE_ADDR'] ?? '', now()]);
    usleep(400000);
    fail($msg, 401);
}

function checkPassword($pw): string {
    if (!is_string($pw) || mb_strlen($pw) < 6) fail('Das Passwort braucht mindestens 6 Zeichen.');
    return password_hash($pw, PASSWORD_DEFAULT);
}

function cleanName($s, string $what): string {
    $s = trim((string) $s);
    if ($s === '' || mb_strlen($s) > 100) fail("$what fehlt oder ist zu lang.");
    return $s;
}

function sessionInfo(array $u): array {
    $crews = all('SELECT c.id, c.name, m.leader FROM crews c JOIN members m ON m.crew_id = c.id WHERE m.user_id = ? ORDER BY c.name', [$u['id']]);
    foreach ($crews as &$c) {
        $c['leader'] = (bool) (int) $c['leader'];
        $c['members'] = array_map(fn($m) => ['id' => $m['id'], 'name' => $m['name'], 'shares' => (bool) (int) $m['shares']],
            all('SELECT u.id, u.name, m.shares FROM members m JOIN users u ON u.id = m.user_id WHERE m.crew_id = ? ORDER BY u.name', [$c['id']]));
    }
    return [
        // isAdmin und canCash setzt die App je geöffneter Crew (Crew-Leiter); superAdmin gilt für alle Konten
        'user' => ['id' => $u['id'], 'name' => $u['name'], 'login' => $u['login'], 'superAdmin' => (bool) (int) $u['is_admin'],
            'canFound' => (bool) (int) $u['is_admin'] || !empty($u['can_found']), 'canCashOwn' => (bool) (int) $u['can_cash'],
            'isAdmin' => (bool) (int) $u['is_admin'], 'canCash' => canCash($u)]
            + userView($u),
        'crews' => $crews,
    ];
}

// Was ein Konto sieht: Bereiche (null = alles), einfache Kinder-Ansicht, Startseite
function userView(array $u): array {
    $areas = isset($u['areas']) && $u['areas'] !== null && $u['areas'] !== '' ? json_decode($u['areas'], true) : null;
    return ['areas' => (int) $u['is_admin'] ? null : (is_array($areas) ? array_values($areas) : null),
        'simple' => !(int) $u['is_admin'] && !empty($u['simple']), 'start' => (string) ($u['start'] ?? '')];
}
function cleanAreas($a): ?string {
    if (!is_array($a)) return null;
    return json_encode(array_values(array_filter($a, fn($x) => is_string($x) && preg_match('/^[a-z:]{2,32}$/', $x))));
}

/* ---------- Automatische Sicherung (einmal pro Woche, die letzten vier bleiben) ---------- */

function backupDir(): string { global $CFG; return dirname(rtrim($CFG['photos'], '/')) . '/sicherungen'; }
function trashDir(): string { global $CFG; return dirname(rtrim($CFG['photos'], '/')) . '/papierkorb'; }

function makeBackup(): string {
    $dir = backupDir();
    if (!is_dir($dir)) mkdir($dir, 0750, true);
    $pdo = db();
    $stamp = date('Y-m-d-His');
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') {
        // Vollständige, in sich stimmige Kopie der Datenbank; lässt sich direkt als lammping.sqlite einsetzen
        $file = "$dir/lammping-$stamp.sqlite";
        $pdo->exec('VACUUM INTO ' . $pdo->quote($file));
    } else {
        $dump = [];
        foreach (['users', 'crews', 'members', 'docs', 'shares'] as $t) $dump[$t] = all("SELECT * FROM $t");
        $file = "$dir/lammping-$stamp.json.gz";
        file_put_contents($file, gzencode(json_encode($dump, JSON_UNESCAPED_UNICODE), 6));
    }
    $all = glob("$dir/lammping-*") ?: [];
    rsort($all);
    foreach (array_slice($all, 4) as $old) @unlink($old);
    // Gelöschte Fotos liegen 30 Tage im Papierkorb, dann endgültig weg
    foreach (array_merge(glob(trashDir() . '/*/*.jpg') ?: [], glob(trashDir() . '/*/*.pdf') ?: []) as $f) if (filemtime($f) < time() - 30 * 86400) @unlink($f);
    return basename($file);
}
function autoBackup(): void {
    $all = glob(backupDir() . '/lammping-*') ?: [];
    rsort($all);
    if ($all && filemtime($all[0]) > time() - 7 * 86400) return;
    try { makeBackup(); } catch (Throwable $e) { /* Sicherung darf den Abgleich nie stören */ }
}

/* ---------- Aktionen ---------- */

switch ($action) {

case 'me':
    if (!one('SELECT id FROM users LIMIT 1')) out(['setup' => true]);
    $u = currentUser();
    out($u ? sessionInfo($u) : ['user' => null]);

case 'setup':
    if (one('SELECT id FROM users LIMIT 1')) fail('Die Einrichtung ist schon erledigt.', 403);
    if (!hash_equals((string) $CFG['setup_code'], (string) ($body['code'] ?? '')) || $CFG['setup_code'] === 'bitte-aendern') {
        fail('Der Einrichtungscode stimmt nicht. Er steht in api/config.php und muss dort geändert worden sein.', 403);
    }
    $uid = newId();
    $cid = newId();
    q('INSERT INTO users (id, name, login, pass, is_admin, created) VALUES (?, ?, ?, ?, 1, ?)',
        [$uid, cleanName($body['name'] ?? '', 'Der Name'), mb_strtolower(cleanName($body['login'] ?? '', 'Der Anmeldename')), checkPassword($body['password'] ?? ''), now()]);
    q('INSERT INTO crews (id, name, created) VALUES (?, ?, ?)', [$cid, cleanName($body['crew'] ?? '', 'Der Crew-Name'), now()]);
    q('INSERT INTO members (crew_id, user_id, shares, leader) VALUES (?, ?, 1, 1)', [$cid, $uid]);
    q('UPDATE users SET can_found = 1 WHERE id = ?', [$uid]);
    login($uid);
    out(sessionInfo(one('SELECT * FROM users WHERE id = ?', [$uid])));

case 'login':
    limitAttempts();
    $name = mb_strtolower(trim((string) ($body['login'] ?? '')));
    $u = one('SELECT * FROM users WHERE login = ?', [$name]);
    // Bewusst getrennte Meldungen: hilft der Familie beim Finden des Fehlers (Versuche sind begrenzt)
    if (!$u) failedAttempt("Den Anmeldenamen „{$name}“ gibt es nicht. Groß- und Kleinschreibung spielt keine Rolle.");
    if (!password_verify((string) ($body['password'] ?? ''), $u['pass'])) failedAttempt('Das Passwort stimmt nicht.');
    login($u['id']);
    out(sessionInfo($u));

case 'reset':
    // Passwort vergessen: mit dem Einrichtungscode aus api/config.php ein neues Passwort setzen
    limitAttempts();
    if ($CFG['setup_code'] === 'bitte-aendern' || !hash_equals((string) $CFG['setup_code'], trim((string) ($body['code'] ?? '')))) {
        failedAttempt('Der Einrichtungscode stimmt nicht. Er steht in api/config.php bei setup_code.');
    }
    $u = one('SELECT * FROM users WHERE login = ?', [mb_strtolower(trim((string) ($body['login'] ?? '')))]);
    if (!$u) failedAttempt('Diesen Anmeldenamen gibt es nicht.');
    q('UPDATE users SET pass = ? WHERE id = ?', [checkPassword($body['password'] ?? ''), $u['id']]);
    q('DELETE FROM tokens WHERE user_id = ?', [$u['id']]);
    login($u['id']);
    out(sessionInfo(one('SELECT * FROM users WHERE id = ?', [$u['id']])));

case 'logout':
    if (!empty($_COOKIE[COOKIE])) q('DELETE FROM tokens WHERE hash = ?', [hash('sha256', $_COOKIE[COOKIE])]);
    setCookieToken('', 1);
    out(['ok' => true]);

case 'prefs':
    // Eigene Startseite festlegen
    $u = requireUser();
    q('UPDATE users SET start = ? WHERE id = ?', [preg_replace('/[^a-z]/', '', (string) ($body['start'] ?? '')), $u['id']]);
    out(['ok' => true]);

case 'backups':
    requireAdmin();
    if ($method === 'POST') { makeBackup(); }
    $list = glob(backupDir() . '/lammping-*') ?: [];
    rsort($list);
    out(['backups' => array_map(fn($f) => ['name' => basename($f), 'size' => filesize($f), 'time' => filemtime($f) * 1000], $list)]);

case 'backup-get':
    requireAdmin();
    $name = basename((string) ($_GET['name'] ?? ''));
    $file = backupDir() . '/' . $name;
    if (!preg_match('/^lammping-[0-9-]+\.(sqlite|json\.gz)$/', $name) || !is_file($file)) fail('Sicherung nicht gefunden', 404);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $name . '"');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;

case 'password':
    $u = requireUser();
    if (!password_verify((string) ($body['old'] ?? ''), $u['pass'])) fail('Das bisherige Passwort stimmt nicht.', 403);
    q('UPDATE users SET pass = ? WHERE id = ?', [checkPassword($body['new'] ?? ''), $u['id']]);
    out(['ok' => true]);

/* ----- Abgleich ----- */

case 'sync':
    $u = requireUser();
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $since = (int) ($_GET['since'] ?? 0);
    $hidden = array_merge(canCash($u, $crew) ? [] : CASH_COLLS, isLeader($u, $crew) ? [] : ADMIN_COLLS);
    $hide = $hidden ? " AND coll NOT IN ('" . implode("', '", $hidden) . "')" : '';
    // Namen von Dokument-PDFs (Kennung „doc-…“) sehen nur Crew-Leiter
    if (!isLeader($u, $crew)) $hide .= " AND NOT (coll = 'files' AND id LIKE 'doc-%')";
    $rows = all("SELECT coll, id, data, deleted, rev FROM docs WHERE crew_id = ? AND rev > ?$hide ORDER BY rev LIMIT 2000", [$crew, $since]);
    $docs = array_map(fn($r) => [
        'coll' => $r['coll'], 'id' => $r['id'], 'rev' => (int) $r['rev'],
        'data' => (int) $r['deleted'] ? null : json_decode($r['data'], true),
    ], $rows);
    $rev = $docs ? end($docs)['rev'] : $since;
    if (!$since || !$docs) autoBackup();
    maybeReminders();
    out(['docs' => $docs, 'rev' => $rev, 'more' => count($docs) === 2000]);

case 'push':
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    $changes = $body['changes'] ?? [];
    $lead = isLeader($u, $crew); $cash = canCash($u, $crew);
    $newPins = []; $newEntries = [];
    if (!is_array($changes) || count($changes) > 500) fail('Ungültige Änderungen');
    $pdo = db();
    $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    $mysql ? $pdo->beginTransaction() : $pdo->exec('BEGIN IMMEDIATE');
    try {
        foreach ($changes as $c) {
            if (!in_array($c['coll'] ?? '', COLLS, true) || !validId($c['id'] ?? null)) continue;
            if (in_array($c['coll'], CASH_COLLS, true) && !$cash) continue;
            if ((in_array($c['coll'], ADMIN_COLLS, true) || in_array($c['coll'], ADMIN_WRITE, true)) && !$lead) continue;
            if ($c['coll'] === 'files' && str_starts_with($c['id'], 'doc-') && !$lead) continue;
            $data = $c['data'] ?? null;
            if ($data !== null && !is_array($data)) continue;
            // Laufende Nummer: bestimmt die Reihenfolge, in der die Handys Änderungen abholen
            q("UPDATE counter SET value = value + 1 WHERE name = 'rev'");
            $rev = (int) one("SELECT value FROM counter WHERE name = 'rev'")['value'];
            // Neuer Pinnwand-Zettel? (vor dem Ersetzen prüfen, ob es ihn schon gab)
            // Neuer Eintrag (nicht nur geändert)? Für die Mitteilung an Crews, die folgen
            if ($c['coll'] === 'entries' && $data !== null && empty($data['blogHide'])
                && !one("SELECT id FROM docs WHERE crew_id = ? AND coll = 'entries' AND id = ?", [$crew, $c['id']])) $newEntries[] = $data;
            if ($c['coll'] === 'games' && $data !== null && ($data['kind'] ?? '') === 'pin'
                && !one("SELECT id FROM docs WHERE crew_id = ? AND coll = 'games' AND id = ?", [$crew, $c['id']])) $newPins[] = $data;
            q('DELETE FROM docs WHERE crew_id = ? AND coll = ? AND id = ?', [$crew, $c['coll'], $c['id']]);
            q('INSERT INTO docs (crew_id, coll, id, data, deleted, rev, by_user) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                $crew, $c['coll'], $c['id'],
                $data === null ? null : json_encode($data, JSON_UNESCAPED_UNICODE),
                $data === null ? 1 : 0, $rev, $u['id'],
            ]);
            if ($c['coll'] === 'photos' && $data === null && is_file(photoPath($crew, $c['id']))) {
                // Nicht sofort löschen: 30 Tage Papierkorb (siehe makeBackup)
                $t = trashDir() . '/' . $crew;
                if (!is_dir($t)) mkdir($t, 0750, true);
                @rename(photoPath($crew, $c['id']), "$t/{$c['id']}.jpg");
                @touch("$t/{$c['id']}.jpg");
            }
            if ($c['coll'] === 'files' && $data === null && is_file(filePath($crew, $c['id']))) {
                $t = trashDir() . '/' . $crew;
                if (!is_dir($t)) mkdir($t, 0750, true);
                @rename(filePath($crew, $c['id']), "$t/{$c['id']}.pdf");
                @touch("$t/{$c['id']}.pdf");
            }
        }
        $mysql ? $pdo->commit() : $pdo->exec('COMMIT');
    } catch (Throwable $e) {
        $mysql ? $pdo->rollBack() : $pdo->exec('ROLLBACK');
        throw $e;
    }
    if ($newEntries) { try { friendPosts($crew, $newEntries); } catch (Throwable $e) { /* weiter */ } }
    // Reise gestartet (oder beendet)? Dann gleich den anderen Crews Bescheid geben
    if (array_filter($changes, fn($c) => ($c['coll'] ?? '') === 'trips')) { try { friendStarts($crew); } catch (Throwable $e) { /* weiter */ } }
    foreach (array_slice($newPins, 0, 5) as $pin) {
        pushCrew($crew, 'pins', ['title' => '📌 ' . $u['name'] . ' an der Pinnwand', 'body' => mb_substr((string) ($pin['text'] ?? ''), 0, 160),
            'url' => './#/pinnwand', 'tag' => 'pin-' . ($pin['id'] ?? '')], $u['id']);
    }
    out(['ok' => true]);

/* ----- Fotos ----- */

case 'photo':
    $u = requireUser();
    // Bilder von Dokumenten (Kennung „doc-…“) gibt es nur für Verwalter
    $pid = $method === 'POST' ? ($body['id'] ?? '') : ($_GET['id'] ?? '');
    $pcrew = (string) ($method === 'POST' ? ($body['crew'] ?? '') : ($_GET['crew'] ?? ''));
    if (str_starts_with((string) $pid, 'doc-') && !isLeader($u, $pcrew)) fail('Nur für Crew-Leiter', 403);
    if ($method === 'POST') {
        $crew = requireCrew($u, $body['crew'] ?? '');
        $id = $body['id'] ?? '';
        if (!validId($id)) fail('Ungültiges Foto');
        // Fotos (JPEG) und Sprachnotizen (webm, mp4, ogg); beide liegen im Fotoordner, die Art steckt in den ersten Bytes
        if (!preg_match('#^data:(image/jpeg|audio/[a-z0-9.+-]+)(;[^,]*)?;base64,(.+)$#', (string) ($body['data'] ?? ''), $m)) fail('Nur JPEG-Fotos und Sprachnotizen');
        $bin = base64_decode($m[3], true);
        if ($bin === false || strlen($bin) > 4 * 1024 * 1024 || mediaType((string) $bin) === '' || ($m[1] === 'image/jpeg') !== (mediaType((string) $bin) === 'image/jpeg')) fail('Ungültiges Foto');
        $path = photoPath($crew, $id);
        if (!is_dir(dirname($path))) mkdir(dirname($path), 0750, true);
        file_put_contents($path, $bin);
        out(['ok' => true]);
    }
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $id = $_GET['id'] ?? '';
    $path = validId($id) ? photoPath($crew, $id) : '';
    if (!$path || !is_file($path)) fail('Foto nicht gefunden', 404);
    header('Content-Type: ' . (mediaType((string) file_get_contents($path, false, null, 0, 16)) ?: 'image/jpeg'));
    header('Cache-Control: private, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;

/* ----- Google-Maps-Kurzlink auflösen (der Browser darf fremden Weiterleitungen nicht folgen) ----- */

case 'maplink':
    requireUser();
    $url = trim((string) ($_GET['u'] ?? ''));
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    // Nur Kurzlinks von Google, damit der Server nicht beliebige Adressen abruft
    if (!preg_match('~^https://~', $url) || !in_array($host, ['maps.app.goo.gl', 'goo.gl', 'g.co'], true)) fail('Kein Google-Maps-Kurzlink');
    for ($i = 0; $i < 6; $i++) {
        $ctx = stream_context_create(['http' => ['method' => 'GET', 'follow_location' => 0, 'timeout' => 6, 'ignore_errors' => true,
            'header' => "User-Agent: Mozilla/5.0 LAMMping\r\nAccept-Language: de\r\n"]]);
        $headers = @get_headers($url, true, $ctx);
        if (!$headers) fail('Der Link ließ sich nicht öffnen.');
        $loc = $headers['Location'] ?? $headers['location'] ?? null;
        if (is_array($loc)) $loc = end($loc);
        if (!$loc) break;
        $next = strpos($loc, 'http') === 0 ? $loc : 'https://' . $host . '/' . ltrim($loc, '/');
        if (!preg_match('~^https://([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl|g\.co)(/|$)~i', $next)) break;
        $url = $next;
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        // Zustimmungsseite: das eigentliche Ziel steht im Parameter „continue“
        if (strpos($host, 'consent.') === 0) { parse_str((string) parse_url($url, PHP_URL_QUERY), $qs); if (!empty($qs['continue'])) $url = $qs['continue']; break; }
    }
    out(['url' => $url]);

/* ----- Reiseblog: geheimer Link zum Lesen (für Großeltern & Co.) ----- */

case 'version':
    out(['version' => API_VERSION]);

case 'share':
    $u = requireUser();
    if ($method === 'POST') {
        $crew = requireCrew($u, $body['crew'] ?? '');
        if (!isLeader($u, $crew)) fail('Nur Crew-Leiter können den Reiseblog ein- und ausschalten.', 403);
        $trip = $body['trip'] ?? '';
        if (!validId($trip)) fail('Ungültige Reise');
        $old = one('SELECT * FROM shares WHERE crew_id = ? AND trip_id = ?', [$crew, $trip]);
        if (empty($body['on'])) { q('DELETE FROM shares WHERE crew_id = ? AND trip_id = ?', [$crew, $trip]); out(['token' => null]); }
        $opts = is_array($body['opts'] ?? null) ? json_encode(array_intersect_key($body['opts'], array_flip(['photos', 'texts', 'highlights', 'map', 'delay', 'greeting', 'sounds', 'likes'])), JSON_UNESCAPED_UNICODE) : ($old['opts'] ?? null);
        if ($old && empty($body['renew'])) {
            q('UPDATE shares SET opts = ? WHERE token = ?', [$opts, $old['token']]);
            out(['token' => $old['token'], 'opts' => json_decode((string) $opts, true)]);
        }
        q('DELETE FROM shares WHERE crew_id = ? AND trip_id = ?', [$crew, $trip]);
        $token = bin2hex(random_bytes(16));
        q('INSERT INTO shares (token, crew_id, trip_id, created, by_user, opts) VALUES (?, ?, ?, ?, ?, ?)', [$token, $crew, $trip, now(), $u['id'], $opts]);
        out(['token' => $token, 'opts' => json_decode((string) $opts, true)]);
    }
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    // Alle Reiseblogs der Crew (für die Übersicht unter „Mehr“)
    $rows = all("SELECT trip_id, token, opts, created FROM shares WHERE crew_id = ? AND trip_id <> '~plaetze'", [$crew]);
    out(['shares' => array_map(fn($r) => ['trip' => $r['trip_id'], 'token' => $r['token'], 'created' => (int) $r['created'], 'opts' => json_decode((string) $r['opts'], true) ?: new stdClass()], $rows)]);

/* ----- Lieblingsplätze weitergeben: fester Schnappschuss hinter einem geheimen Link ----- */

case 'placeshare':
    $u = requireUser();
    $crew = requireCrew($u, $method === 'POST' ? ($body['crew'] ?? '') : ($_GET['crew'] ?? ''));
    $old = one("SELECT * FROM shares WHERE crew_id = ? AND trip_id = '~plaetze'", [$crew]);
    if ($method !== 'POST') out(['token' => $old['token'] ?? null, 'created' => (int) ($old['created'] ?? 0)]);
    if (!isLeader($u, $crew)) fail('Nur Crew-Leiter können Plätze weitergeben.', 403);
    if (empty($body['on'])) { q("DELETE FROM shares WHERE crew_id = ? AND trip_id = '~plaetze'", [$crew]); out(['token' => null]); }
    $list = [];
    foreach (array_slice(is_array($body['places'] ?? null) ? $body['places'] : [], 0, 300) as $p) {
        if (!is_array($p) || !is_numeric($p['lat'] ?? null) || !is_numeric($p['lng'] ?? null)) continue;
        $list[] = [
            'name' => mb_substr((string) ($p['name'] ?? ''), 0, 120), 'place' => mb_substr((string) ($p['place'] ?? ''), 0, 120),
            'lat' => (float) $p['lat'], 'lng' => (float) $p['lng'], 'rating' => (int) ($p['rating'] ?? 0),
            'kind' => mb_substr((string) ($p['kind'] ?? ''), 0, 40), 'country' => mb_substr((string) ($p['country'] ?? ''), 0, 2),
            'note' => mb_substr((string) ($p['note'] ?? ''), 0, 1000), 'features' => array_slice(array_map('strval', is_array($p['features'] ?? null) ? $p['features'] : []), 0, 20),
            'date' => mb_substr((string) ($p['date'] ?? ''), 0, 10),
        ];
    }
    $data = json_encode(['title' => mb_substr((string) ($body['title'] ?? ''), 0, 120), 'note' => mb_substr((string) ($body['note'] ?? ''), 0, 1000), 'places' => $list, 'at' => now()], JSON_UNESCAPED_UNICODE);
    $token = $old && empty($body['renew']) ? $old['token'] : bin2hex(random_bytes(16));
    q("DELETE FROM shares WHERE crew_id = ? AND trip_id = '~plaetze'", [$crew]);
    q("INSERT INTO shares (token, crew_id, trip_id, created, by_user, opts) VALUES (?, ?, '~plaetze', ?, ?, ?)", [$token, $crew, now(), $u['id'], $data]);
    out(['token' => $token, 'count' => count($list)]);

case 'plaetze':
    header('X-Robots-Tag: noindex, nofollow');
    $token = (string) ($_GET['t'] ?? '');
    $share = preg_match('/^[a-f0-9]{32}$/', $token) ? one("SELECT * FROM shares WHERE token = ? AND trip_id = '~plaetze'", [$token]) : null;
    if (!$share) fail('Diese Liste gibt es nicht (mehr).', 404);
    out(json_decode((string) $share['opts'], true) ?: ['places' => []]);

case 'blog':
case 'blogphoto':
case 'blogaudio':
case 'blog-like':
    header('X-Robots-Tag: noindex, nofollow');
    $token = (string) ($_GET['t'] ?? ($body['t'] ?? ''));
    $share = preg_match('/^[a-f0-9]{32}$/', $token) ? one('SELECT * FROM shares WHERE token = ?', [$token]) : null;
    if (!$share) fail('Diesen Reiseblog gibt es nicht (mehr).', 404);
    $crew = $share['crew_id'];
    $tripRow = one("SELECT data FROM docs WHERE crew_id = ? AND coll = 'trips' AND id = ? AND deleted = 0", [$crew, $share['trip_id']]);
    if (!$tripRow) fail('Diese Reise gibt es nicht mehr.', 404);
    $trip = json_decode($tripRow['data'], true);
    $o = json_decode((string) ($share['opts'] ?? ''), true) ?: [];
    $opt = fn($k, $def = true) => array_key_exists($k, $o) ? $o[$k] : $def;
    // Verzögerung: Einträge erst ab dem nächsten Tag zeigen (niemand sieht, wo ihr gerade seid)
    $until = $opt('delay', false) ? date('Y-m-d') : '9999';
    // Nur was zur Reise gehört und nicht ausgeblendet ist; ohne Kosten und ohne Namen
    $entries = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'entries' AND deleted = 0", [$crew]) as $r) {
        $e = json_decode($r['data'], true);
        if (($e['tripId'] ?? '') !== $share['trip_id'] || !empty($e['blogHide'])) continue;
        if (substr((string) ($e['date'] ?? ''), 0, 10) >= $until) continue;
        $entries[] = [
            'id' => $e['id'], 'type' => $e['type'] ?? 'notiz', 'title' => $e['title'] ?? '', 'place' => $e['place'] ?? '',
            'date' => $e['date'] ?? '', 'text' => $opt('texts') ? ($e['text'] ?? '') : '', 'rating' => $e['rating'] ?? 0, 'country' => $e['country'] ?? '',
            'lat' => $e['lat'] ?? null, 'lng' => $e['lng'] ?? null, 'extra' => $e['extra'] ?? new stdClass(),
            'photos' => !$opt('photos') ? [] : array_values(array_filter(array_map(fn($p) => ['id' => $p['id'] ?? '', 'thumb' => $p['thumb'] ?? ''], $e['photos'] ?? []),
                fn($p) => validId($p['id']) && !str_starts_with($p['id'], 'doc-'))),
            // Sprachnotizen: nur Kennung und Länge, den Ton liefert 'blogaudio'
            'sounds' => !$opt('sounds') ? [] : array_values(array_filter(array_map(fn($x) => ['id' => $x['id'] ?? '', 'sec' => (int) ($x['sec'] ?? 0)], $e['sounds'] ?? []),
                fn($x) => validId($x['id']))),
        ];
    }
    if ($action === 'blog-like') {
        if ($method !== 'POST') fail('Nur POST');
        if (!$opt('likes')) fail('Herzen sind für diesen Reiseblog ausgeschaltet.', 403);
        $id = (string) ($body['id'] ?? ''); $dev = strtolower((string) ($body['d'] ?? ''));
        if (!preg_match('/^[a-f0-9]{16,40}$/', $dev) || !in_array($id, array_column($entries, 'id'), true)) fail('Ungültiges Herz');
        q('DELETE FROM blog_likes WHERE token = ? AND entry_id = ? AND device = ?', [$token, $id, $dev]);
        if (empty($body['off'])) {
            if ((int) one('SELECT COUNT(*) AS n FROM blog_likes WHERE token = ?', [$token])['n'] >= 20000) fail('Zu viele Herzen', 429);
            $name = trim(preg_replace('/[\x00-\x1f<>]/u', '', mb_substr((string) ($body['name'] ?? ''), 0, 40)));
            q('INSERT INTO blog_likes (token, entry_id, device, name, at) VALUES (?, ?, ?, ?, ?)', [$token, $id, $dev, $name, now()]);
        }
        out(['ok' => true, 'n' => (int) one('SELECT COUNT(*) AS n FROM blog_likes WHERE token = ? AND entry_id = ?', [$token, $id])['n']]);
    }
    if ($action === 'blogaudio') {
        $id = (string) ($_GET['id'] ?? '');
        $ok = false;
        foreach ($entries as $e) foreach ($e['sounds'] as $x) if ($x['id'] === $id) $ok = true;
        $path = $ok ? photoPath($crew, $id) : '';
        if (!$path || !is_file($path)) fail('Sprachnotiz nicht gefunden', 404);
        $type = mediaType((string) file_get_contents($path, false, null, 0, 16));
        if (!str_starts_with($type, 'audio/')) fail('Sprachnotiz nicht gefunden', 404);
        header('Content-Type: ' . $type);
        header('Cache-Control: private, max-age=86400');
        header('Content-Length: ' . filesize($path));
        header('Accept-Ranges: none');
        readfile($path);
        exit;
    }
    if ($action === 'blogphoto') {
        $id = (string) ($_GET['id'] ?? '');
        $ok = false;
        foreach ($entries as $e) foreach ($e['photos'] as $p) if ($p['id'] === $id) $ok = true;
        $path = $ok ? photoPath($crew, $id) : '';
        if (!$path || !is_file($path)) fail('Foto nicht gefunden', 404);
        header('Content-Type: image/jpeg');
        header('Cache-Control: private, max-age=86400');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
    $tracks = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'tracks' AND deleted = 0", [$crew]) as $r) {
        $k = json_decode($r['data'], true);
        if (($k['tripId'] ?? '') === $share['trip_id'] && $opt('map') && (!$opt('delay', false) || !empty($trip['ended']))) $tracks[] = ['kind' => $k['kind'] ?? '', 'name' => $k['name'] ?? '', 'pts' => $k['pts'] ?? ''];
    }
    $highlights = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'games' AND deleted = 0", [$crew]) as $r) {
        $g = json_decode($r['data'], true);
        if ($opt('highlights') && ($g['kind'] ?? '') === 'highlight' && ($g['tripId'] ?? '') === $share['trip_id'] && ($g['day'] ?? '') < $until && (($g['text'] ?? '') !== '' || ($g['emoji'] ?? '') !== '')) {
            $highlights[] = ['day' => $g['day'] ?? '', 'text' => $g['text'] ?? '', 'emoji' => $g['emoji'] ?? ''];
        }
    }
    out([
        'highlights' => $highlights, 'greeting' => (string) $opt('greeting', ''), 'likesOn' => (bool) $opt('likes'), 'showMap' => (bool) $opt('map'), 'delayed' => (bool) $opt('delay', false),
        'trip' => ['name' => $trip['name'] ?? '', 'start' => $trip['start'] ?? '', 'end' => $trip['end'] ?? '', 'color' => $trip['color'] ?? '#0F6670', 'ended' => !empty($trip['ended']), 'kind' => (string) ($trip['kind'] ?? '')],
        'entries' => $entries, 'tracks' => $tracks, 'at' => now(),
        // Herzen der Leser je Eintrag
        'likes' => (object) array_column(array_map(fn($r) => [$r['entry_id'], (int) $r['n']],
            all('SELECT entry_id, COUNT(*) AS n FROM blog_likes WHERE token = ? GROUP BY entry_id', [$token])), 1, 0),
    ]);

/* ----- Herzen aus dem Reiseblog fürs Tagebuch ----- */

case 'blog-likes':
    $u = requireUser();
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $res = [];
    foreach (all('SELECT l.entry_id, l.name, l.at FROM blog_likes l JOIN shares s ON s.token = l.token WHERE s.crew_id = ? ORDER BY l.at', [$crew]) as $r) {
        $x = &$res[$r['entry_id']];
        $x ??= ['n' => 0, 'names' => [], 'at' => 0];
        $x['n']++;
        if ($r['name'] !== null && $r['name'] !== '' && !in_array($r['name'], $x['names'], true)) $x['names'][] = $r['name'];
        $x['at'] = max($x['at'], (int) $r['at']);
        unset($x);
    }
    // Herzen anderer Crews (Crews on the Road), getrennt gezählt, mit Crew-Namen
    $cr = [];
    foreach (all('SELECT l.entry_id, c.name FROM crew_likes l JOIN crews c ON c.id = l.by_crew WHERE l.of_crew = ? ORDER BY l.at', [$crew]) as $r) {
        $x = &$cr[$r['entry_id']];
        $x ??= ['n' => 0, 'names' => []];
        $x['n']++;
        if (!in_array($r['name'], $x['names'], true)) $x['names'][] = $r['name'];
        unset($x);
    }
    out(['likes' => (object) $res, 'crews' => (object) $cr]);

/* ----- Wie viel Platz belegt was auf dem Server? ----- */

case 'sizes':
    $u = requireUser();
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    // Welche Datei gehört zu welcher Reise (über Einträge, Tickets, Fotos mit Reise)
    $owner = []; $kind = [];
    foreach (all("SELECT coll, data FROM docs WHERE crew_id = ? AND deleted = 0 AND coll IN ('entries', 'games', 'documents', 'photos')", [$crew]) as $r) {
        $d = json_decode($r['data'], true);
        if (!is_array($d)) continue;
        $tid = (string) ($d['tripId'] ?? '');
        if ($r['coll'] === 'photos') { if ($tid !== '' && validId($d['id'] ?? null) && !isset($owner[$d['id']])) $owner[$d['id']] = $tid; continue; }
        foreach (['photos' => 'photo', 'images' => 'photo', 'sounds' => 'sound', 'files' => 'pdf'] as $k => $kd) {
            foreach (is_array($d[$k] ?? null) ? $d[$k] : [] as $p) {
                if (!is_array($p) || !validId($p['id'] ?? null)) continue;
                $owner[$p['id']] = $tid; $kind[$p['id']] = $kd;
            }
        }
    }
    $trips = [];
    foreach (crewTrips($crew) as $t) if (validId($t['id'] ?? null)) $trips[$t['id']] = ['id' => $t['id'], 'name' => $t['name'] ?? '', 'start' => $t['start'] ?? '', 'photo' => 0, 'sound' => 0, 'pdf' => 0, 'n' => 0];
    $none = ['photo' => 0, 'sound' => 0, 'pdf' => 0, 'n' => 0];
    $total = 0;
    $dir = photoDir($crew);
    foreach (is_dir($dir) ? scandir($dir) : [] as $f) {
        if (!preg_match('/^([A-Za-z0-9_-]{1,64})\.(jpg|pdf)$/', $f, $m)) continue;
        $size = (int) @filesize("$dir/$f");
        $total += $size;
        $kd = $m[2] === 'pdf' ? 'pdf' : ($kind[$m[1]] ?? 'photo');
        $tid = $owner[$m[1]] ?? '';
        if (isset($trips[$tid])) { $trips[$tid][$kd] += $size; $trips[$tid]['n']++; }
        else { $none[$kd] += $size; $none['n']++; }
    }
    $res = ['trips' => array_values($trips), 'other' => $none, 'total' => $total,
        'db' => (int) strlen(implode('', array_column(all('SELECT data FROM docs WHERE crew_id = ? AND deleted = 0', [$crew]), 'data')))];
    // Super-Admin: der ganze Webspace von LAMMping (alle Crews, Datenbank, Sicherungen, Papierkorb)
    if ((int) $u['is_admin']) {
        $sum = function (string $d) use (&$sum): int {
            $n = 0;
            foreach (is_dir($d) ? scandir($d) : [] as $f) {
                if ($f === '.' || $f === '..') continue;
                $n += is_dir("$d/$f") ? $sum("$d/$f") : (int) @filesize("$d/$f");
            }
            return $n;
        };
        global $CFG;
        $dbFile = str_starts_with((string) $CFG['db'], 'sqlite:') ? substr((string) $CFG['db'], 7) : '';
        $res['server'] = [
            'photos' => $sum(rtrim($CFG['photos'], '/')), 'backups' => $sum(backupDir()), 'trash' => $sum(trashDir()),
            'db' => $dbFile && is_file($dbFile) ? (int) filesize($dbFile) + (int) @filesize("$dbFile-wal") : 0,
            'free' => @disk_free_space(rtrim($CFG['photos'], '/')) ?: null,
            'crews' => array_map(fn($c) => ['name' => $c['name'], 'size' => $sum(photoDir($c['id']))], all('SELECT id, name FROM crews ORDER BY name')),
        ];
    }
    out($res);

/* ----- Tracker-App: Standorte im Hintergrund (GPSLogger, OwnTracks, Overland) ----- */

case 'gps-key':
    $u = requireUser();
    $crew = requireCrew($u, $method === 'POST' ? ($body['crew'] ?? '') : ($_GET['crew'] ?? ''));
    $row = one('SELECT k, last FROM gps_keys WHERE crew_id = ? AND user_id = ?', [$crew, $u['id']]);
    if ($method === 'POST') {
        q('DELETE FROM gps_keys WHERE crew_id = ? AND user_id = ?', [$crew, $u['id']]);
        if (!empty($body['off'])) out(['key' => null]);
        $row = ['k' => bin2hex(random_bytes(16)), 'last' => 0];
        q('INSERT INTO gps_keys (k, crew_id, user_id, created, last) VALUES (?, ?, ?, ?, 0)', [$row['k'], $crew, $u['id'], now()]);
    }
    if (!$row) out(['key' => null]);
    $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '') . strtok($_SERVER['REQUEST_URI'] ?? '/api/', '?');
    out(['key' => $row['k'], 'url' => $base . '?a=gps&k=' . $row['k'], 'last' => (int) $row['last']]);

case 'gps':
    $k = (string) ($_GET['k'] ?? ($body['k'] ?? ''));
    $key = preg_match('/^[a-f0-9]{32}$/', $k) ? one('SELECT * FROM gps_keys WHERE k = ?', [$k]) : null;
    if (!$key) fail('Unbekannter Schlüssel', 403);
    // Punkte einsammeln, je nach App in anderer Form
    $pts = [];
    $time = function ($v): int {
        if (is_numeric($v)) { $v = (float) $v; return (int) ($v > 1e11 ? $v : $v * 1000); }
        $t = strtotime((string) $v); return $t ? $t * 1000 : now();
    };
    $add = function ($lat, $lng, $at, $acc) use (&$pts) {
        if (!is_numeric($lat) || !is_numeric($lng) || abs((float) $lat) > 90 || abs((float) $lng) > 180) return;
        if ((float) $lat == 0 && (float) $lng == 0) return;
        if (is_numeric($acc) && (float) $acc > 100) return;          // zu ungenau
        $pts[] = [round((float) $lat, 5), round((float) $lng, 5), $at];
    };
    $reply = ['ok' => true];
    if (isset($body['locations']) && is_array($body['locations'])) {                 // Overland
        foreach (array_slice($body['locations'], 0, 1000) as $l) {
            $c = $l['geometry']['coordinates'] ?? null; $pr = $l['properties'] ?? [];
            if (is_array($c) && count($c) >= 2) $add($c[1], $c[0], $time($pr['timestamp'] ?? now()), $pr['horizontal_accuracy'] ?? null);
        }
        $reply = ['result' => 'ok'];
    } elseif (($body['_type'] ?? '') !== '') {                                     // OwnTracks
        if ($body['_type'] === 'location') $add($body['lat'] ?? null, $body['lon'] ?? null, $time($body['tst'] ?? now()), $body['acc'] ?? null);
        $reply = [];
    } else {                                                                       // GPSLogger & Co. (Adresse oder Formular)
        $p = array_merge($_GET, $_POST, $body);
        $add($p['lat'] ?? $p['latitude'] ?? null, $p['lon'] ?? $p['lng'] ?? $p['longitude'] ?? null, $time($p['time'] ?? $p['timestamp'] ?? $p['tst'] ?? now()), $p['acc'] ?? $p['accuracy'] ?? null);
    }
    $crew = $key['crew_id'];
    q('UPDATE gps_keys SET last = ? WHERE k = ?', [now(), $k]);
    $trip = runningTrip($crew);
    if (!$pts || !$trip) out($reply);
    usort($pts, fn($a, $b) => $a[2] <=> $b[2]);
    $tid = 'gps' . substr(hash('sha256', $trip['id'] . '|' . $key['user_id']), 0, 20);
    $old = one("SELECT data FROM docs WHERE crew_id = ? AND coll = 'tracks' AND id = ? AND deleted = 0", [$crew, $tid]);
    $doc = $old ? json_decode($old['data'], true) : null;
    $user = one('SELECT name FROM users WHERE id = ?', [$key['user_id']]);
    if (!is_array($doc)) $doc = ['id' => $tid, 'tripId' => $trip['id'], 'kind' => 'drive', 'auto' => 'tracker', 'by' => $key['user_id'],
        'name' => 'Aufgezeichnet' . ($user ? ' (' . $user['name'] . ')' : ''), 'pts' => '', 'km' => 0, 'createdAt' => now()];
    $line = $doc['pts'] !== '' ? array_map(fn($x) => array_map('floatval', explode(',', $x)), explode(';', $doc['pts'])) : [];
    $last = $doc['last'] ?? null;     // [lat, lng, ms] des letzten Punkts
    $dist = function ($a, $b): float {
        $r = M_PI / 180; $h = sin(($b[0] - $a[0]) * $r / 2) ** 2 + cos($a[0] * $r) * cos($b[0] * $r) * sin(($b[1] - $a[1]) * $r / 2) ** 2;
        return 12742 * asin(min(1, sqrt($h)));
    };
    $changed = false; $km = (float) ($doc['km'] ?? 0);
    foreach ($pts as $pt) {
        if ($last && $pt[2] <= $last[2]) continue;                      // schon da (oder älter)
        if ($last) {
            $d = $dist($last, $pt);
            if ($d < 0.05) continue;                                    // steht (unter 50 m): nichts Neues
            $h = max(1, $pt[2] - $last[2]) / 3600000;
            if ($d / $h > 1000) continue;                               // Ausreißer (über 1000 km/h)
            $km += $d;
        }
        $line[] = [$pt[0], $pt[1]];
        $last = $pt; $changed = true;
    }
    // Live-Standort für „Crews on the Road“, wenn die Crew ihn teilt
    $meta = one("SELECT data FROM docs WHERE crew_id = ? AND coll = 'meta' AND id = 'follow' AND deleted = 0", [$crew]);
    $end = end($pts);
    if ($meta && !empty(json_decode($meta['data'], true)['live']) && $end[2] > now() - 2 * 3600000) {
        q('DELETE FROM livepos WHERE crew_id = ?', [$crew]);
        q('INSERT INTO livepos (crew_id, lat, lng, at, by_user) VALUES (?, ?, ?, ?, ?)', [$crew, $end[0], $end[1], min(now(), $end[2]), $key['user_id']]);
    }
    if (!$changed) out($reply);
    if (count($line) > 20000) $line = array_slice($line, -20000);
    $doc['pts'] = implode(';', array_map(fn($x) => sprintf('%.5f,%.5f', $x[0], $x[1]), $line));
    $doc['km'] = round($km, 1); $doc['last'] = $last; $doc['updatedAt'] = now();
    q("UPDATE counter SET value = value + 1 WHERE name = 'rev'");
    $rev = (int) one("SELECT value FROM counter WHERE name = 'rev'")['value'];
    q("DELETE FROM docs WHERE crew_id = ? AND coll = 'tracks' AND id = ?", [$crew, $tid]);
    q("INSERT INTO docs (crew_id, coll, id, data, deleted, rev, by_user) VALUES (?, 'tracks', ?, ?, 0, ?, ?)",
        [$crew, $tid, json_encode($doc, JSON_UNESCAPED_UNICODE), $rev, $key['user_id']]);
    out($reply);

/* ----- Mitteilungen ----- */

case 'push-key':
    $u = requireUser();
    $ok = function_exists('curl_init') && function_exists('openssl_pkey_derive');
    if (!$ok) out(['key' => null, 'error' => 'Auf dem Server fehlen PHP-Erweiterungen (curl, openssl).']);
    $v = vapid();
    $res = ['key' => $v['pub']];
    // Für den Super-Admin: Adresse für einen Cronjob, damit Ticket-Erinnerungen pünktlich kommen
    if ((int) $u['is_admin']) {
        $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '') . strtok($_SERVER['REQUEST_URI'] ?? '/api/', '?');
        $res['cron'] = $base . '?a=cron&k=' . kvGet('cron_key');
        $res['cronLast'] = (int) (kvGet('cron_seen') ?? 0);
    }
    $res['subs'] = array_map(fn($r) => ['id' => $r['id'], 'pins' => (bool) (int) $r['pins'], 'tickets' => (bool) (int) $r['tickets'], 'friends' => (bool) (int) $r['friends']],
        all('SELECT id, pins, tickets, friends FROM push_subs WHERE user_id = ?', [$u['id']]));
    out($res);

case 'push-sub':
    $u = requireUser();
    $ep = (string) ($body['endpoint'] ?? '');
    // Push-Dienste sind immer https; http://localhost nur mit 'push_test' => true in config.php (lokaler Test-Dienst)
    $okEp = preg_match('#^https://#', $ep) || (!empty($CFG['push_test']) && preg_match('#^http://(localhost|127\.0\.0\.1)[:/]#', $ep));
    if (!$okEp || strlen($ep) > 2000) fail('Ungültige Anmeldung');
    $p = (string) ($body['p256dh'] ?? ''); $a = (string) ($body['auth'] ?? '');
    if (strlen(b64ud($p)) !== 65 || strlen(b64ud($a)) < 16) fail('Ungültige Schlüssel');
    $id = sha1($ep);
    q('DELETE FROM push_subs WHERE id = ?', [$id]);
    q('INSERT INTO push_subs (id, user_id, endpoint, p256dh, auth, tz, pins, tickets, friends, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [$id, $u['id'], $ep, $p, $a,
        mb_substr((string) ($body['tz'] ?? 'Europe/Berlin'), 0, 64), empty($body['pins']) ? 0 : 1, empty($body['tickets']) ? 0 : 1, array_key_exists('friends', $body) && empty($body['friends']) ? 0 : 1, now()]);
    out(['ok' => true, 'id' => $id]);

case 'push-unsub':
    $u = requireUser();
    q('DELETE FROM push_subs WHERE id = ? AND user_id = ?', [sha1((string) ($body['endpoint'] ?? '')), $u['id']]);
    out(['ok' => true]);

case 'push-test':
    $u = requireUser();
    $sub = one('SELECT * FROM push_subs WHERE id = ? AND user_id = ?', [sha1((string) ($body['endpoint'] ?? '')), $u['id']]);
    if (!$sub) fail('Auf diesem Gerät sind Mitteilungen nicht eingeschaltet.', 404);
    $code = pushSend($sub, ['title' => '🐑 LAMMping', 'body' => 'So sehen Mitteilungen aus. Alles eingerichtet!', 'url' => './#/einstellungen', 'tag' => 'test']);
    out(['ok' => $code >= 200 && $code < 300, 'code' => $code]);

case 'cron':
    // Vom Webspace regelmäßig aufrufen lassen (z. B. alle 10 Minuten): Ticket-Erinnerungen pünktlich verschicken
    $k = kvGet('cron_key');
    if (!$k || !hash_equals($k, (string) ($_GET['k'] ?? ''))) fail('Falscher Schlüssel', 403);
    kvSet('cron_seen', (string) now());
    kvSet('cron_last', (string) now());
    $sent = ticketReminders();
    try { $sent += friendStarts(); } catch (Throwable $e) { /* weiter */ }
    out(['ok' => true, 'sent' => $sent]);

/* ----- Mitverfolgen: Reisen anderer Crews (nach Freigabe) ----- */

case 'travel':
    $u = requireUser();
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $rel = [];
    foreach (all('SELECT * FROM follows WHERE crew_id = ? OR follower_crew = ?', [$crew, $crew]) as $f) {
        if ($f['follower_crew'] === $crew) $rel[$f['crew_id']]['me'] = $f['status'];       // wir folgen ihnen
        else $rel[$f['follower_crew']]['them'] = $f['status'];                              // sie folgen uns
    }
    $list = [];
    foreach (all('SELECT c.id, c.name, (SELECT COUNT(*) FROM members m WHERE m.crew_id = c.id) AS n FROM crews c WHERE c.id <> ? ORDER BY c.name', [$crew]) as $c) {
        $t = friendRunning($c['id']);
        $me = $rel[$c['id']]['me'] ?? null;
        $row = ['id' => $c['id'], 'name' => $c['name'], 'travelling' => (bool) $t, 'since' => $t['start'] ?? '', 'follow' => $me, 'follower' => $rel[$c['id']]['them'] ?? null];
        // Wer folgt, sieht Name und Art der laufenden Reise (für die Zeile im Tagebuch)
        if ($me === 'ok' && $t) $row['trip'] = ['id' => $t['id'], 'name' => $t['name'] ?? '', 'kind' => (string) ($t['kind'] ?? ''), 'color' => $t['color'] ?? '#0F6670'];
        // Wer freigegeben hat: Stand der Einträge (für „Neues“)
        if ($me === 'ok') $row['rev'] = (int) (one("SELECT MAX(rev) AS r FROM docs WHERE crew_id = ? AND coll IN ('entries', 'trips', 'tracks')", [$c['id']])['r'] ?? 0);
        $list[] = $row;
    }
    out(['crews' => $list, 'leader' => isLeader($u, $crew)]);

case 'follow':
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    $target = (string) ($body['target'] ?? '');
    if (!validId($target) || $target === $crew || !one('SELECT id FROM crews WHERE id = ?', [$target])) fail('Diese Crew gibt es nicht.', 404);
    $op = (string) ($body['op'] ?? '');
    $row = fn($a, $b) => one('SELECT status FROM follows WHERE crew_id = ? AND follower_crew = ?', [$a, $b]);
    $set = function ($a, $b, $st) use ($u) {
        q('DELETE FROM follows WHERE crew_id = ? AND follower_crew = ?', [$a, $b]);
        q('INSERT INTO follows (crew_id, follower_crew, status, created, by_user) VALUES (?, ?, ?, ?, ?)', [$a, $b, $st, now(), $u['id']]);
    };
    if ($op === 'request') {                 // wir möchten ihnen folgen
        if (!$row($target, $crew)) {
            $set($target, $crew, 'requested');
            // Crew-Leiter der anderen Crew aufs Handy
            if (function_exists('curl_init') && function_exists('openssl_pkey_derive')) {
                foreach (all('SELECT s.* FROM push_subs s JOIN members m ON m.user_id = s.user_id WHERE m.crew_id = ? AND m.leader = 1 AND s.friends = 1', [$target]) as $sub) {
                    try { pushSend($sub, ['title' => '👋 ' . crewName($crew) . ' möchte euch folgen', 'body' => 'Antippen zum Annehmen oder Ablehnen (Crews on the Road).', 'url' => './#/mitreisen', 'tag' => 'ask-' . $crew]); }
                    catch (Throwable $e) { /* weiter */ }
                }
            }
        }
    } elseif ($op === 'invite') {            // sie dürfen uns folgen (gleich freigegeben)
        if (!isLeader($u, $crew)) fail('Nur Crew-Leiter geben eure Reisen frei.', 403);
        $set($crew, $target, 'ok');
    } elseif ($op === 'accept') {            // Anfrage an uns annehmen
        if (!isLeader($u, $crew)) fail('Nur Crew-Leiter geben eure Reisen frei.', 403);
        if (!$row($crew, $target)) fail('Keine Anfrage von dieser Crew.', 404);
        $set($crew, $target, 'ok');
    } elseif ($op === 'revoke') {            // Freigabe zurücknehmen oder Anfrage ablehnen
        if (!isLeader($u, $crew)) fail('Nur Crew-Leiter geben eure Reisen frei.', 403);
        q('DELETE FROM follows WHERE crew_id = ? AND follower_crew = ?', [$crew, $target]);
    } elseif ($op === 'unfollow') {          // nicht mehr folgen bzw. Anfrage zurückziehen
        q('DELETE FROM follows WHERE crew_id = ? AND follower_crew = ?', [$target, $crew]);
    } else fail('Unbekannt');
    out(['ok' => true]);

case 'follow-feed':
case 'follow-photo':
case 'follow-audio':
case 'follow-like':
    $u = requireUser();
    $arg = fn($k) => (string) ($method === 'POST' ? ($body[$k] ?? '') : ($_GET[$k] ?? ''));
    $crew = requireCrew($u, $arg('crew'));
    $of = $arg('of');
    $f = validId($of) ? one("SELECT status FROM follows WHERE crew_id = ? AND follower_crew = ? AND status = 'ok'", [$of, $crew]) : null;
    if (!$f) fail('Diese Crew hat ihre Reisen nicht für euch freigegeben.', 403);
    // Alle für andere Crews sichtbaren Reisen; ohne Angabe die laufende, sonst die zuletzt begonnene
    $trips = friendTrips($of);
    $run = friendRunning($of);
    $want = $arg('trip');
    $begun = array_values(array_filter($trips, fn($t) => ($t['start'] ?? '') !== '' && $t['start'] <= date('Y-m-d')));
    $trip = $want !== '' ? (array_values(array_filter($trips, fn($t) => $t['id'] === $want))[0] ?? null) : ($run ?: ($begun[0] ?? ($trips[0] ?? null)));
    $tripList = array_map(fn($t) => ['id' => $t['id'], 'name' => $t['name'] ?? '', 'start' => $t['start'] ?? '', 'end' => $t['end'] ?? '', 'color' => $t['color'] ?? '#0F6670',
        'kind' => (string) ($t['kind'] ?? ''), 'running' => $run && $run['id'] === $t['id']], $trips);
    if (!$trip) { if ($action !== 'follow-feed') fail('Diese Reise ist nicht sichtbar.', 404); out(['crew' => crewName($of), 'trip' => null, 'trips' => $tripList]); }
    // Wie im Reiseblog: nur Einträge der Reise, ohne ausgeblendete, ohne Kosten
    $entries = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'entries' AND deleted = 0", [$of]) as $r) {
        $e = json_decode($r['data'], true);
        if (($e['tripId'] ?? '') !== $trip['id'] || !empty($e['blogHide'])) continue;
        $entries[] = [
            'id' => $e['id'], 'type' => $e['type'] ?? 'notiz', 'title' => $e['title'] ?? '', 'place' => $e['place'] ?? '', 'date' => $e['date'] ?? '',
            'text' => $e['text'] ?? '', 'rating' => $e['rating'] ?? 0, 'country' => $e['country'] ?? '', 'lat' => $e['lat'] ?? null, 'lng' => $e['lng'] ?? null,
            'extra' => array_intersect_key(is_array($e['extra'] ?? null) ? $e['extra'] : [], array_flip(['kind', 'from', 'fromLat', 'fromLng'])),
            'photos' => array_values(array_filter(array_map(fn($p) => ['id' => $p['id'] ?? '', 'thumb' => $p['thumb'] ?? ''], $e['photos'] ?? []),
                fn($p) => validId($p['id']) && !str_starts_with($p['id'], 'doc-'))),
            'sounds' => array_values(array_filter(array_map(fn($x) => ['id' => $x['id'] ?? '', 'sec' => (int) ($x['sec'] ?? 0)], $e['sounds'] ?? []), fn($x) => validId($x['id']))),
        ];
    }
    if ($action === 'follow-photo' || $action === 'follow-audio') {
        $id = $arg('id');
        $ok = false;
        foreach ($entries as $e) foreach ($e[$action === 'follow-photo' ? 'photos' : 'sounds'] as $p) if ($p['id'] === $id) $ok = true;
        $path = $ok ? photoPath($of, $id) : '';
        if (!$path || !is_file($path)) fail('Nicht gefunden', 404);
        $type = mediaType((string) file_get_contents($path, false, null, 0, 16));
        if ($action === 'follow-audio' && !str_starts_with($type, 'audio/')) fail('Nicht gefunden', 404);
        header('Content-Type: ' . ($action === 'follow-photo' ? 'image/jpeg' : $type));
        header('Cache-Control: private, max-age=86400');
        header('Content-Length: ' . filesize($path));
        readfile($path);
        exit;
    }
    if ($action === 'follow-like') {
        if ($method !== 'POST') fail('Nur POST');
        $id = $arg('id');
        if (!in_array($id, array_column($entries, 'id'), true)) fail('Diesen Eintrag gibt es nicht (mehr).', 404);
        q('DELETE FROM crew_likes WHERE of_crew = ? AND entry_id = ? AND by_user = ?', [$of, $id, $u['id']]);
        if (empty($body['off'])) q('INSERT INTO crew_likes (of_crew, entry_id, by_crew, by_user, at) VALUES (?, ?, ?, ?, ?)', [$of, $id, $crew, $u['id'], now()]);
        out(['ok' => true, 'n' => (int) one('SELECT COUNT(*) AS n FROM crew_likes WHERE of_crew = ? AND entry_id = ?', [$of, $id])['n']]);
    }
    // Herzen: Anzahl je Eintrag und ob ich schon eines gegeben habe
    $likes = []; $mine = [];
    foreach (all('SELECT entry_id, by_user FROM crew_likes WHERE of_crew = ?', [$of]) as $r) {
        $likes[$r['entry_id']] = ($likes[$r['entry_id']] ?? 0) + 1;
        if ($r['by_user'] === $u['id']) $mine[] = $r['entry_id'];
    }
    foreach ($entries as &$e) { $e['likes'] = $likes[$e['id']] ?? 0; $e['liked'] = in_array($e['id'], $mine, true); }
    unset($e);
    $tracks = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'tracks' AND deleted = 0", [$of]) as $r) {
        $k = json_decode($r['data'], true);
        if (($k['tripId'] ?? '') === $trip['id']) $tracks[] = ['kind' => $k['kind'] ?? '', 'pts' => $k['pts'] ?? ''];
    }
    $highlights = [];
    foreach (all("SELECT data FROM docs WHERE crew_id = ? AND coll = 'games' AND deleted = 0 AND data LIKE '%highlight%'", [$of]) as $r) {
        $g = json_decode($r['data'], true);
        if (($g['kind'] ?? '') === 'highlight' && ($g['tripId'] ?? '') === $trip['id'] && (($g['text'] ?? '') !== '' || ($g['emoji'] ?? '') !== ''))
            $highlights[] = ['day' => $g['day'] ?? '', 'text' => $g['text'] ?? '', 'emoji' => $g['emoji'] ?? ''];
    }
    $isRun = $run && $run['id'] === $trip['id'];
    // Standort: nur während der laufenden Reise und höchstens 2 Tage alt
    $live = $isRun ? one('SELECT lat, lng, at FROM livepos WHERE crew_id = ? AND at > ?', [$of, now() - 2 * 86400000]) : null;
    out([
        'crew' => crewName($of), 'running' => (bool) $isRun, 'trips' => $tripList,
        'trip' => ['id' => $trip['id'], 'name' => $trip['name'] ?? '', 'start' => $trip['start'] ?? '', 'end' => $trip['end'] ?? '', 'color' => $trip['color'] ?? '#0F6670', 'kind' => (string) ($trip['kind'] ?? '')],
        'entries' => $entries, 'tracks' => $tracks, 'highlights' => $highlights,
        'live' => $live ? ['lat' => (float) $live['lat'], 'lng' => (float) $live['lng'], 'at' => (int) $live['at']] : null,
    ]);

case 'livepos':
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    if (!empty($body['off'])) { q('DELETE FROM livepos WHERE crew_id = ?', [$crew]); out(['ok' => true]); }
    $lat = $body['lat'] ?? null; $lng = $body['lng'] ?? null;
    if (!is_numeric($lat) || !is_numeric($lng) || abs((float) $lat) > 90 || abs((float) $lng) > 180) fail('Ungültige Position');
    q('DELETE FROM livepos WHERE crew_id = ?', [$crew]);
    q('INSERT INTO livepos (crew_id, lat, lng, at, by_user) VALUES (?, ?, ?, ?, ?)', [$crew, (float) $lat, (float) $lng, now(), $u['id']]);
    out(['ok' => true]);

/* ----- Verwaltung: Super-Admin (alle Konten) und Crew-Leiter (eigene Crews) ----- */

case 'admin':
    $u = requireUser();
    $super = (bool) (int) $u['is_admin'];
    $led = ledCrews($u);
    if (!$super && !$led && empty($u['can_found'])) fail('Nur für Crew-Leiter', 403);
    $view = fn($r) => ['id' => $r['id'], 'name' => $r['name'], 'login' => $r['login'], 'isAdmin' => (bool) (int) $r['is_admin'],
        'canFound' => !empty($r['can_found']), 'canCash' => (bool) (int) $r['can_cash'], 'managed' => manages($u, $r['id'])] + userView($r);
    // Super-Admin: alle Konten; Crew-Leiter: die Mitglieder seiner Crews
    $users = $super ? all('SELECT * FROM users ORDER BY name')
        : (!$led ? all('SELECT * FROM users WHERE id = ?', [$u['id']]) : all('SELECT DISTINCT u.* FROM users u JOIN members m ON m.user_id = u.id WHERE m.crew_id IN (' . implode(',', array_fill(0, count($led), '?')) . ') ORDER BY u.name', $led));
    $crews = [];
    foreach (all('SELECT c.id, c.name, (SELECT COUNT(*) FROM members m WHERE m.crew_id = c.id) AS n FROM crews c ORDER BY c.name') as $c) {
        if (in_array($c['id'], $led, true)) {
            $c['members'] = array_map(fn($m) => ['id' => $m['user_id'], 'shares' => (bool) (int) $m['shares'], 'leader' => (bool) (int) $m['leader']],
                all('SELECT user_id, shares, leader FROM members WHERE crew_id = ?', [$c['id']]));
            $c['invites'] = array_map(fn($i) => ['token' => $i['token'], 'expires' => (int) $i['expires'], 'uses' => (int) $i['uses']],
                all('SELECT token, expires, uses FROM invites WHERE crew_id = ? AND expires > ? ORDER BY created DESC', [$c['id'], now()]));
            $c['leader'] = true;
            $crews[] = $c;
        } elseif ($super) {
            // Fremde Crews: nur Name und Mitgliederzahl
            $crews[] = ['id' => $c['id'], 'name' => $c['name'], 'count' => (int) $c['n'], 'foreign' => true];
        }
    }
    out(['users' => array_map($view, $users), 'crews' => array_map(fn($c) => ['count' => (int) ($c['n'] ?? $c['count'] ?? 0)] + array_diff_key($c, ['n' => 1]), $crews),
        'superAdmin' => $super]);

case 'user-save':
    $u = requireUser();
    $super = (bool) (int) $u['is_admin'];
    $id = $body['id'] ?? null;
    $join = (string) ($body['joinCrew'] ?? '');
    if ($id) {
        if (!one('SELECT id FROM users WHERE id = ?', [$id])) fail('Konto nicht gefunden', 404);
        if ($id !== $u['id'] && !manages($u, $id)) fail('Dieses Konto verwaltest du nicht.', 403);
    } else {
        // Neue Konten: Super-Admin überall, Crew-Leiter nur direkt in eine eigene Crew
        if (!$super && ($join === '' || !isLeader($u, $join))) fail('Neue Konten legen Crew-Leiter für ihre Crew an.', 403);
    }
    $name = cleanName($body['name'] ?? '', 'Der Name');
    $login = mb_strtolower(cleanName($body['login'] ?? '', 'Der Anmeldename'));
    $taken = one('SELECT id FROM users WHERE login = ?', [$login]);
    if ($taken && $taken['id'] !== $id) fail('Diesen Anmeldenamen gibt es schon.');
    $old = $id ? one('SELECT * FROM users WHERE id = ?', [$id]) : null;
    // Super-Admin und „darf Crews gründen“ vergibt nur der Super-Admin
    $isAdmin = $super ? (!empty($body['isAdmin']) ? 1 : 0) : (int) ($old['is_admin'] ?? 0);
    $canFound = $super ? (!empty($body['canFound']) || $isAdmin ? 1 : 0) : (int) ($old['can_found'] ?? 0);
    if ($id === $u['id'] && $super && !$isAdmin) fail('Du kannst dir die Rolle Super-Admin nicht selbst entziehen.');
    $cash = !empty($body['canCash']) ? 1 : 0;
    $areas = cleanAreas($body['areas'] ?? null); $simple = !empty($body['simple']) ? 1 : 0;
    $start = preg_replace('/[^a-z]/', '', (string) ($body['start'] ?? ''));
    if ($id) {
        q('UPDATE users SET name = ?, login = ?, is_admin = ?, can_found = ?, can_cash = ?, areas = ?, simple = ?, start = ? WHERE id = ?',
            [$name, $login, $isAdmin, $canFound, $cash, $areas, $simple, $start, $id]);
        if (!empty($body['password'])) {
            q('UPDATE users SET pass = ? WHERE id = ?', [checkPassword($body['password']), $id]);
            if ($id !== $u['id']) q('DELETE FROM tokens WHERE user_id = ?', [$id]);
        }
    } else {
        $id = newId();
        q('INSERT INTO users (id, name, login, pass, is_admin, can_found, can_cash, areas, simple, start, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $name, $login, checkPassword($body['password'] ?? ''), $isAdmin, $canFound, $cash, $areas, $simple, $start, now()]);
        if ($join !== '' && (isLeader($u, $join) || ($super && one('SELECT id FROM crews WHERE id = ?', [$join])))) {
            q('INSERT INTO members (crew_id, user_id, shares, leader) VALUES (?, ?, ?, 0)', [$join, $id, !empty($body['shares']) ? 1 : 0]);
        }
    }
    out(['id' => $id]);

case 'user-delete':
    $u = requireUser();
    $id = (string) ($body['id'] ?? '');
    if ($id === $u['id']) fail('Du kannst dein eigenes Konto nicht löschen.');
    if (!manages($u, $id)) fail('Dieses Konto verwaltest du nicht.', 403);
    q('DELETE FROM members WHERE user_id = ?', [$id]);
    q('DELETE FROM tokens WHERE user_id = ?', [$id]);
    q('DELETE FROM push_subs WHERE user_id = ?', [$id]);
    q('DELETE FROM users WHERE id = ?', [$id]);
    out(['ok' => true]);

case 'crew-save':
    $u = requireUser();
    $id = $body['id'] ?? null;
    $name = cleanName($body['name'] ?? '', 'Der Crew-Name');
    if ($id) {
        requireLeader($u, $id);
        q('UPDATE crews SET name = ? WHERE id = ?', [$name, $id]);
    } else {
        // Neue Crew gründen: wer es darf, wird ihr Leiter
        if (!(int) $u['is_admin'] && empty($u['can_found'])) fail('Du darfst keine eigenen Crews gründen. Das erlaubt der Super-Admin.', 403);
        $id = newId();
        q('INSERT INTO crews (id, name, created) VALUES (?, ?, ?)', [$id, $name, now()]);
        q('INSERT INTO members (crew_id, user_id, shares, leader) VALUES (?, ?, 1, 1)', [$id, $u['id']]);
    }
    // Mitglieder setzen: [{id, shares, leader}]; nur bisherige Mitglieder und selbst verwaltete Konten
    if (isset($body['members']) && is_array($body['members'])) {
        $before = array_column(all('SELECT user_id FROM members WHERE crew_id = ?', [$id]), 'user_id');
        $rows = [];
        foreach ($body['members'] as $m) {
            $mid = $m['id'] ?? null;
            if (!validId($mid) || !one('SELECT id FROM users WHERE id = ?', [$mid])) continue;
            if (!in_array($mid, $before, true) && $mid !== $u['id'] && !manages($u, $mid)) continue;
            $rows[$mid] = [!empty($m['shares']) ? 1 : 0, !empty($m['leader']) ? 1 : 0];
        }
        if (!array_filter($rows, fn($r) => $r[1])) fail('Eine Crew braucht mindestens einen Crew-Leiter.');
        q('DELETE FROM members WHERE crew_id = ?', [$id]);
        foreach ($rows as $mid => [$sh, $ld]) q('INSERT INTO members (crew_id, user_id, shares, leader) VALUES (?, ?, ?, ?)', [$id, $mid, $sh, $ld]);
    }
    out(['id' => $id]);

case 'crew-delete':
    $u = requireUser();
    $id = (string) ($body['id'] ?? '');
    requireLeader($u, $id);
    q('DELETE FROM members WHERE crew_id = ?', [$id]);
    q('DELETE FROM docs WHERE crew_id = ?', [$id]);
    q('DELETE FROM invites WHERE crew_id = ?', [$id]);
    q('DELETE FROM shares WHERE crew_id = ?', [$id]);
    q('DELETE FROM follows WHERE crew_id = ? OR follower_crew = ?', [$id, $id]);
    q('DELETE FROM livepos WHERE crew_id = ?', [$id]);
    q('DELETE FROM crew_likes WHERE of_crew = ? OR by_crew = ?', [$id, $id]);
    q('DELETE FROM crews WHERE id = ?', [$id]);
    $dir = photoDir($id);
    if (is_dir($dir)) { array_map('unlink', array_merge(glob("$dir/*.jpg") ?: [], glob("$dir/*.pdf") ?: [])); @rmdir($dir); }
    out(['ok' => true]);

/* ----- Einladungen in eine Crew (Link bzw. QR-Code) ----- */

case 'invite-create':
    $u = requireUser();
    $crew = requireLeader($u, $body['crew'] ?? '');
    $token = bin2hex(random_bytes(16));
    q('INSERT INTO invites (token, crew_id, created, expires, by_user, uses) VALUES (?, ?, ?, ?, ?, 0)', [$token, $crew, now(), now() + INVITE_DAYS * 864e5, $u['id']]);
    out(['token' => $token, 'expires' => now() + INVITE_DAYS * 864e5]);

case 'invite-delete':
    $u = requireUser();
    $inv = one('SELECT * FROM invites WHERE token = ?', [(string) ($body['token'] ?? '')]);
    if ($inv) { requireLeader($u, $inv['crew_id']); q('DELETE FROM invites WHERE token = ?', [$inv['token']]); }
    out(['ok' => true]);

case 'invite':
    // Öffentlich: Wohin lädt der Link ein? (nur Crew-Name)
    $token = (string) ($_GET['t'] ?? $body['token'] ?? '');
    $inv = preg_match('/^[a-f0-9]{32}$/', $token) ? one('SELECT i.*, c.name FROM invites i JOIN crews c ON c.id = i.crew_id WHERE i.token = ? AND i.expires > ?', [$token, now()]) : null;
    if (!$inv) fail('Diese Einladung gibt es nicht (mehr). Bitte um einen neuen Link.', 404);
    if ($method !== 'POST') out(['crew' => $inv['name'], 'expires' => (int) $inv['expires']]);
    limitAttempts();
    $u = currentUser();
    if (!$u) {
        // Neues Konto über die Einladung
        $login = mb_strtolower(cleanName($body['login'] ?? '', 'Der Anmeldename'));
        if (one('SELECT id FROM users WHERE login = ?', [$login])) fail('Diesen Anmeldenamen gibt es schon. Wer schon ein Konto hat, meldet sich zuerst an.');
        $uid = newId();
        q('INSERT INTO users (id, name, login, pass, is_admin, can_found, can_cash, created) VALUES (?, ?, ?, ?, 0, 0, 1, ?)',
            [$uid, cleanName($body['name'] ?? '', 'Der Name'), $login, checkPassword($body['password'] ?? ''), now()]);
        login($uid);
        $u = one('SELECT * FROM users WHERE id = ?', [$uid]);
    }
    if (!one('SELECT 1 AS ok FROM members WHERE crew_id = ? AND user_id = ?', [$inv['crew_id'], $u['id']])) {
        q('INSERT INTO members (crew_id, user_id, shares, leader) VALUES (?, ?, 1, 0)', [$inv['crew_id'], $u['id']]);
        q('UPDATE invites SET uses = uses + 1 WHERE token = ?', [$token]);
    }
    out(['crewId' => $inv['crew_id']] + sessionInfo($u));

/* ----- PDFs (Tickets, Prospekte, Dokumente): roh hochladen, im Fotoordner der Crew ablegen ----- */

case 'file':
    $u = requireUser();
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $id = (string) ($_GET['id'] ?? '');
    if (!validId($id)) fail('Ungültige Datei');
    // Dateien zu Dokumenten (Kennung „doc-…“) nur für Crew-Leiter
    if (str_starts_with($id, 'doc-') && !isLeader($u, $crew)) fail('Nur für Crew-Leiter', 403);
    if ($method === 'POST') {
        $len = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        $bin = (string) file_get_contents('php://input');
        if ($len > 0 && strlen($bin) === 0) fail('Die Datei ist zu groß für den Server (Grenze: ' . ini_get('post_max_size') . ').', 413);
        if (strlen($bin) > FILE_MAX) fail('Die Datei ist zu groß (höchstens 10 MB).', 413);
        if (substr($bin, 0, 5) !== '%PDF-') fail('Nur PDF-Dateien');
        $path = filePath($crew, $id);
        if (!is_dir(dirname($path))) mkdir(dirname($path), 0750, true);
        file_put_contents($path, $bin);
        out(['ok' => true, 'size' => strlen($bin)]);
    }
    $path = filePath($crew, $id);
    if (!is_file($path)) fail('Datei nicht gefunden', 404);
    $name = preg_replace('/[^A-Za-z0-9ÄÖÜäöüß ._-]/u', '', (string) ($_GET['name'] ?? 'Dokument')) ?: 'Dokument';
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . (str_ends_with(mb_strtolower($name), '.pdf') ? $name : "$name.pdf") . '"');
    header('Cache-Control: private, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;

default:
    fail('Unbekannte Aktion', 404);
}

// Art einer Datei aus den ersten Bytes: JPEG oder eine Sprachnotiz
function mediaType(string $b): string {
    if (substr($b, 0, 3) === "\xFF\xD8\xFF") return 'image/jpeg';
    if (substr($b, 0, 4) === "\x1A\x45\xDF\xA3") return 'audio/webm';
    if (substr($b, 4, 4) === 'ftyp') return 'audio/mp4';
    if (substr($b, 0, 4) === 'OggS') return 'audio/ogg';
    if (substr($b, 0, 3) === 'ID3' || substr($b, 0, 2) === "\xFF\xFB") return 'audio/mpeg';
    return '';
}
function photoDir(string $crew): string { global $CFG; return rtrim($CFG['photos'], '/') . '/' . $crew; }
function photoPath(string $crew, string $id): string { return photoDir($crew) . '/' . $id . '.jpg'; }
function filePath(string $crew, string $id): string { return photoDir($crew) . '/' . $id . '.pdf'; }
