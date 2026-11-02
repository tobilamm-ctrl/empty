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
const API_VERSION = 25;                     // erhöhen, wenn die App neue Server-Aktionen braucht
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
    if (($_SERVER['HTTP_X_LAMMPING'] ?? '') !== '1') fail('Ungültige Anfrage', 403);
    // PDFs kommen roh (siehe 'file'), alles andere als JSON
    $body = $action === 'file' ? [] : json_decode(file_get_contents('php://input') ?: '[]', true);
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
    out(['docs' => $docs, 'rev' => $rev, 'more' => count($docs) === 2000]);

case 'push':
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    $changes = $body['changes'] ?? [];
    $lead = isLeader($u, $crew); $cash = canCash($u, $crew);
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
        $opts = is_array($body['opts'] ?? null) ? json_encode(array_intersect_key($body['opts'], array_flip(['photos', 'texts', 'highlights', 'map', 'delay', 'greeting'])), JSON_UNESCAPED_UNICODE) : ($old['opts'] ?? null);
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
    header('X-Robots-Tag: noindex, nofollow');
    $token = (string) ($_GET['t'] ?? '');
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
        ];
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
        'highlights' => $highlights, 'greeting' => (string) $opt('greeting', ''), 'showMap' => (bool) $opt('map'), 'delayed' => (bool) $opt('delay', false),
        'trip' => ['name' => $trip['name'] ?? '', 'start' => $trip['start'] ?? '', 'end' => $trip['end'] ?? '', 'color' => $trip['color'] ?? '#0F6670', 'ended' => !empty($trip['ended'])],
        'entries' => $entries, 'tracks' => $tracks, 'at' => now(),
    ]);

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
