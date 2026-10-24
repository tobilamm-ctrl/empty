<?php
// Bordbuch-Server: Konten, Crews, Abgleich der Daten und Fotos.
// Alle Anfragen laufen über api/?a=<aktion>. Antworten sind JSON.

declare(strict_types=1);

$CFG = require __DIR__ . '/config.php';
const COLLS = ['trips', 'entries', 'expenses', 'boxes', 'items', 'packstate', 'listItems', 'meta', 'photos'];
const TOKEN_DAYS = 400;
const COOKIE = 'bordbuch';

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
    ];
    foreach ($tables as $name => $cols) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS $name ($cols)" . ($mysql ? ' DEFAULT CHARSET=utf8mb4' : ''));
    }
    if (!$mysql) $pdo->exec('CREATE INDEX IF NOT EXISTS docs_rev ON docs (crew_id, rev)');
    // Spätere Ergänzung: Wer darf die Kasse sehen? (bestehende Konten: ja)
    $cols = $mysql ? array_column($pdo->query('SHOW COLUMNS FROM users')->fetchAll(), 'Field')
                   : array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(), 'name');
    if (!in_array('can_cash', $cols, true)) $pdo->exec('ALTER TABLE users ADD COLUMN can_cash INT NOT NULL DEFAULT 1');
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
    if (($_SERVER['HTTP_X_BORDBUCH'] ?? '') !== '1') fail('Ungültige Anfrage', 403);
    $body = json_decode(file_get_contents('php://input') ?: '[]', true);
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

function requireAdmin(): array {
    $u = requireUser();
    if (!(int) $u['is_admin']) fail('Nur für Verwalter', 403);
    return $u;
}

// Verwalter sehen die Kasse immer, alle anderen nur mit Freigabe
function canCash(array $u): bool { return (int) $u['is_admin'] || (int) $u['can_cash']; }

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
    $crews = all('SELECT c.id, c.name FROM crews c JOIN members m ON m.crew_id = c.id WHERE m.user_id = ? ORDER BY c.name', [$u['id']]);
    foreach ($crews as &$c) {
        $c['members'] = array_map(fn($m) => ['id' => $m['id'], 'name' => $m['name'], 'shares' => (bool) (int) $m['shares']],
            all('SELECT u.id, u.name, m.shares FROM members m JOIN users u ON u.id = m.user_id WHERE m.crew_id = ? ORDER BY u.name', [$c['id']]));
    }
    return [
        'user' => ['id' => $u['id'], 'name' => $u['name'], 'login' => $u['login'], 'isAdmin' => (bool) (int) $u['is_admin'], 'canCash' => canCash($u)],
        'crews' => $crews,
    ];
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
    q('INSERT INTO members (crew_id, user_id, shares) VALUES (?, ?, 1)', [$cid, $uid]);
    login($uid);
    out(sessionInfo(one('SELECT * FROM users WHERE id = ?', [$uid])));

case 'login':
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    q('DELETE FROM attempts WHERE ts < ?', [now() - 15 * 60000]);
    if ((int) one('SELECT COUNT(*) AS n FROM attempts WHERE ip = ?', [$ip])['n'] >= 10) {
        fail('Zu viele Fehlversuche. Bitte in 15 Minuten noch einmal probieren.', 429);
    }
    $u = one('SELECT * FROM users WHERE login = ?', [mb_strtolower(trim((string) ($body['login'] ?? '')))]);
    if (!$u || !password_verify((string) ($body['password'] ?? ''), $u['pass'])) {
        q('INSERT INTO attempts (ip, ts) VALUES (?, ?)', [$ip, now()]);
        usleep(400000);
        fail('Anmeldename oder Passwort stimmt nicht.', 401);
    }
    login($u['id']);
    out(sessionInfo($u));

case 'logout':
    if (!empty($_COOKIE[COOKIE])) q('DELETE FROM tokens WHERE hash = ?', [hash('sha256', $_COOKIE[COOKIE])]);
    setCookieToken('', 1);
    out(['ok' => true]);

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
    $hide = canCash($u) ? '' : " AND coll <> 'expenses'";
    $rows = all("SELECT coll, id, data, deleted, rev FROM docs WHERE crew_id = ? AND rev > ?$hide ORDER BY rev LIMIT 2000", [$crew, $since]);
    $docs = array_map(fn($r) => [
        'coll' => $r['coll'], 'id' => $r['id'], 'rev' => (int) $r['rev'],
        'data' => (int) $r['deleted'] ? null : json_decode($r['data'], true),
    ], $rows);
    $rev = $docs ? end($docs)['rev'] : $since;
    out(['docs' => $docs, 'rev' => $rev, 'more' => count($docs) === 2000]);

case 'push':
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    $changes = $body['changes'] ?? [];
    if (!is_array($changes) || count($changes) > 500) fail('Ungültige Änderungen');
    $pdo = db();
    $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';
    $mysql ? $pdo->beginTransaction() : $pdo->exec('BEGIN IMMEDIATE');
    try {
        foreach ($changes as $c) {
            if (!in_array($c['coll'] ?? '', COLLS, true) || !validId($c['id'] ?? null)) continue;
            if ($c['coll'] === 'expenses' && !canCash($u)) continue;
            $data = $c['data'] ?? null;
            if ($data !== null && !is_array($data)) continue;
            // Laufende Nummer: bestimmt die Reihenfolge, in der die Handys Änderungen abholen
            q("UPDATE counter SET value = value + 1 WHERE name = 'rev'");
            $rev = (int) one("SELECT value FROM counter WHERE name = 'rev'")['value'];
            q('DELETE FROM docs WHERE crew_id = ? AND coll = ? AND id = ?', [$crew, $c['coll'], $c['id']]);
            q('INSERT INTO docs (crew_id, coll, id, data, deleted, rev, by_user) VALUES (?, ?, ?, ?, ?, ?, ?)', [
                $crew, $c['coll'], $c['id'],
                $data === null ? null : json_encode($data, JSON_UNESCAPED_UNICODE),
                $data === null ? 1 : 0, $rev, $u['id'],
            ]);
            if ($c['coll'] === 'photos' && $data === null) @unlink(photoPath($crew, $c['id']));
        }
        $mysql ? $pdo->commit() : $pdo->exec('COMMIT');
    } catch (Throwable $e) {
        $mysql ? $pdo->rollBack() : $pdo->exec('ROLLBACK');
        throw $e;
    }
    out(['ok' => true]);

/* ----- Fotos ----- */

case 'photo':
    $u = requireUser();
    if ($method === 'POST') {
        $crew = requireCrew($u, $body['crew'] ?? '');
        $id = $body['id'] ?? '';
        if (!validId($id)) fail('Ungültiges Foto');
        if (!preg_match('#^data:image/jpeg;base64,(.+)$#', (string) ($body['data'] ?? ''), $m)) fail('Nur JPEG-Fotos');
        $bin = base64_decode($m[1], true);
        if ($bin === false || strlen($bin) > 4 * 1024 * 1024 || substr($bin, 0, 3) !== "\xFF\xD8\xFF") fail('Ungültiges Foto');
        $path = photoPath($crew, $id);
        if (!is_dir(dirname($path))) mkdir(dirname($path), 0750, true);
        file_put_contents($path, $bin);
        out(['ok' => true]);
    }
    $crew = requireCrew($u, $_GET['crew'] ?? '');
    $id = $_GET['id'] ?? '';
    $path = validId($id) ? photoPath($crew, $id) : '';
    if (!$path || !is_file($path)) fail('Foto nicht gefunden', 404);
    header('Content-Type: image/jpeg');
    header('Cache-Control: private, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;

/* ----- Verwaltung (nur Eltern) ----- */

case 'admin':
    requireAdmin();
    $users = array_map(fn($r) => ['id' => $r['id'], 'name' => $r['name'], 'login' => $r['login'], 'isAdmin' => (bool) (int) $r['is_admin'], 'canCash' => (bool) (int) $r['can_cash']],
        all('SELECT * FROM users ORDER BY name'));
    $crews = all('SELECT id, name FROM crews ORDER BY name');
    foreach ($crews as &$c) {
        $c['members'] = array_map(fn($m) => ['id' => $m['user_id'], 'shares' => (bool) (int) $m['shares']],
            all('SELECT user_id, shares FROM members WHERE crew_id = ?', [$c['id']]));
    }
    out(['users' => $users, 'crews' => $crews]);

case 'user-save':
    $admin = requireAdmin();
    $id = $body['id'] ?? null;
    $name = cleanName($body['name'] ?? '', 'Der Name');
    $login = mb_strtolower(cleanName($body['login'] ?? '', 'Der Anmeldename'));
    $taken = one('SELECT id FROM users WHERE login = ?', [$login]);
    if ($taken && $taken['id'] !== $id) fail('Diesen Anmeldenamen gibt es schon.');
    $isAdmin = !empty($body['isAdmin']) ? 1 : 0;
    $cash = !empty($body['canCash']) || $isAdmin ? 1 : 0;
    if ($id) {
        if (!one('SELECT id FROM users WHERE id = ?', [$id])) fail('Konto nicht gefunden', 404);
        if ($id === $admin['id'] && !$isAdmin) fail('Du kannst dir die Verwaltung nicht selbst entziehen.');
        q('UPDATE users SET name = ?, login = ?, is_admin = ?, can_cash = ? WHERE id = ?', [$name, $login, $isAdmin, $cash, $id]);
        if (!empty($body['password'])) {
            q('UPDATE users SET pass = ? WHERE id = ?', [checkPassword($body['password']), $id]);
            q('DELETE FROM tokens WHERE user_id = ?', [$id]);
        }
    } else {
        $id = newId();
        q('INSERT INTO users (id, name, login, pass, is_admin, can_cash, created) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$id, $name, $login, checkPassword($body['password'] ?? ''), $isAdmin, $cash, now()]);
    }
    out(['id' => $id]);

case 'user-delete':
    $admin = requireAdmin();
    $id = $body['id'] ?? '';
    if ($id === $admin['id']) fail('Du kannst dein eigenes Konto nicht löschen.');
    q('DELETE FROM members WHERE user_id = ?', [$id]);
    q('DELETE FROM tokens WHERE user_id = ?', [$id]);
    q('DELETE FROM users WHERE id = ?', [$id]);
    out(['ok' => true]);

case 'crew-save':
    requireAdmin();
    $id = $body['id'] ?? null;
    $name = cleanName($body['name'] ?? '', 'Der Crew-Name');
    if ($id) q('UPDATE crews SET name = ? WHERE id = ?', [$name, $id]);
    else { $id = newId(); q('INSERT INTO crews (id, name, created) VALUES (?, ?, ?)', [$id, $name, now()]); }
    // Mitglieder komplett setzen: [{id, shares}]
    if (isset($body['members']) && is_array($body['members'])) {
        q('DELETE FROM members WHERE crew_id = ?', [$id]);
        foreach ($body['members'] as $m) {
            if (validId($m['id'] ?? null) && one('SELECT id FROM users WHERE id = ?', [$m['id']])) {
                q('INSERT INTO members (crew_id, user_id, shares) VALUES (?, ?, ?)', [$id, $m['id'], !empty($m['shares']) ? 1 : 0]);
            }
        }
    }
    out(['id' => $id]);

case 'crew-delete':
    requireAdmin();
    $id = $body['id'] ?? '';
    if (!validId($id)) fail('Ungültige Crew');
    q('DELETE FROM members WHERE crew_id = ?', [$id]);
    q('DELETE FROM docs WHERE crew_id = ?', [$id]);
    q('DELETE FROM crews WHERE id = ?', [$id]);
    $dir = photoDir($id);
    if (is_dir($dir)) { array_map('unlink', glob("$dir/*.jpg") ?: []); @rmdir($dir); }
    out(['ok' => true]);

default:
    fail('Unbekannte Aktion', 404);
}

function photoDir(string $crew): string { global $CFG; return rtrim($CFG['photos'], '/') . '/' . $crew; }
function photoPath(string $crew, string $id): string { return photoDir($crew) . '/' . $id . '.jpg'; }
