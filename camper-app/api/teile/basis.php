<?php
// Teil des LAMMping-Servers, wird von api/index.php eingebunden. Ausgabe, Kennungen, Datenbank (Tabellen legt db() selbst an).

declare(strict_types=1);
if (!defined('API_VERSION')) { http_response_code(403); exit; }

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
        // Öffentliche Kommentare zu Einträgen: aus dem Reiseblog (src blog, Name Pflicht), von anderen Crews (crew)
        // und Antworten der eigenen Crew aus dem Tagebuch (own). Alle sehen denselben Verlauf.
        'comments' => 'id CHAR(16) PRIMARY KEY, of_crew VARCHAR(32) NOT NULL, entry_id VARCHAR(64) NOT NULL, src VARCHAR(8) NOT NULL, by_crew VARCHAR(32), by_user VARCHAR(32), device CHAR(40), name VARCHAR(80) NOT NULL, text TEXT NOT NULL, at BIGINT NOT NULL',
        'gps_keys' => 'k CHAR(32) PRIMARY KEY, crew_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, created BIGINT NOT NULL, last BIGINT NOT NULL DEFAULT 0',
    ];
    foreach ($tables as $name => $cols) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS $name ($cols)" . ($mysql ? ' DEFAULT CHARSET=utf8mb4' : ''));
    }
    if (!$mysql) $pdo->exec('CREATE INDEX IF NOT EXISTS docs_rev ON docs (crew_id, rev)');
    if (!$mysql) $pdo->exec('CREATE INDEX IF NOT EXISTS comments_entry ON comments (of_crew, entry_id)');
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
