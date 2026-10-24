<?php
// Gemeinsamer Kern: Sitzung, Benutzer, CSRF-Schutz, Datenablage, Seitenrahmen.
declare(strict_types=1);

const APP_NAME = 'Spieleabend';
const DATA_DIR = __DIR__ . '/../data';
const GAMES_DIR = __DIR__ . '/../games';
const MIN_PASSWORD = 8;
const MAX_LOGIN_FAILS = 8;          // danach Sperre
const LOGIN_LOCK_SECONDS = 900;     // 15 Minuten
// Wer die Seiten einbetten darf: die eigene Seite und alles unter lamm7.de (z. B. LAMMping)
const FRAME_ANCESTORS = "'self' https://lamm7.de https://*.lamm7.de";

error_reporting(E_ALL);
ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Robots-Tag: noindex, nofollow');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('spieleabend');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30,
    'path' => rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? '/'), '/') . '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Lax',
]);
ini_set('session.gc_maxlifetime', (string)(60 * 60 * 24 * 30));
ini_set('session.use_strict_mode', '1');
session_start();

// ---------- Datenablage ----------
function ensure_data_dir(): void
{
    foreach ([DATA_DIR, DATA_DIR . '/rooms'] as $dir) {
        if (!is_dir($dir) && !@mkdir($dir, 0770, true)) {
            throw new RuntimeException('Der Ordner "data" kann nicht angelegt werden. Bitte Schreibrechte prüfen.');
        }
    }
    $ht = DATA_DIR . '/.htaccess';
    if (!is_file($ht)) {
        @file_put_contents($ht, "Require all denied\n");
    }
}

function json_read(string $file, $default)
{
    if (!is_file($file)) {
        return $default;
    }
    $fh = fopen($file, 'rb');
    if (!$fh) {
        return $default;
    }
    flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    $data = json_decode((string)$raw, true);
    return is_array($data) ? $data : $default;
}

function json_write(string $file, $data): void
{
    ensure_data_dir();
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
}

// ---------- Benutzer ----------
function users(): array
{
    return json_read(DATA_DIR . '/users.json', []);
}

function save_users(array $users): void
{
    ksort($users);
    json_write(DATA_DIR . '/users.json', $users);
}

function valid_username(string $u): bool
{
    return (bool)preg_match('/^[a-z0-9_.-]{2,32}$/', $u);
}

function current_user(): ?array
{
    $name = $_SESSION['user'] ?? null;
    if (!is_string($name)) {
        return null;
    }
    $all = users();
    if (!isset($all[$name])) {
        return null;
    }
    // Passwortwechsel meldet alte Sitzungen ab
    if (($_SESSION['pwv'] ?? null) !== ($all[$name]['pwv'] ?? 0)) {
        return null;
    }
    return ['username' => $name] + $all[$name];
}

function require_login(): array
{
    $u = current_user();
    if (!$u) {
        header('Location: index.php');
        exit;
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if (empty($u['admin'])) {
        http_response_code(403);
        page_start('Kein Zugriff', $u);
        echo '<p class="note">Diese Seite ist nur für Verwalter.</p>';
        page_end();
        exit;
    }
    return $u;
}

function login_user(string $username, array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user'] = $username;
    $_SESSION['pwv'] = $user['pwv'] ?? 0;
}

// ---------- Schutz gegen Durchprobieren ----------
function attempts_file(): string
{
    return DATA_DIR . '/login_attempts.json';
}

function client_key(): string
{
    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '-') . '|spieleabend');
}

function login_locked(): int
{
    $a = json_read(attempts_file(), []);
    $e = $a[client_key()] ?? null;
    if (!$e || $e['fails'] < MAX_LOGIN_FAILS) {
        return 0;
    }
    $left = $e['last'] + LOGIN_LOCK_SECONDS - time();
    return max(0, $left);
}

function login_failed(): void
{
    $a = json_read(attempts_file(), []);
    $now = time();
    foreach ($a as $k => $e) {
        if ($e['last'] + LOGIN_LOCK_SECONDS < $now) {
            unset($a[$k]);
        }
    }
    $k = client_key();
    $a[$k] = ['fails' => ($a[$k]['fails'] ?? 0) + 1, 'last' => $now];
    json_write(attempts_file(), $a);
}

function login_succeeded(): void
{
    $a = json_read(attempts_file(), []);
    unset($a[client_key()]);
    json_write(attempts_file(), $a);
}

// ---------- CSRF ----------
function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . h(csrf_token()) . '">';
}

function check_csrf(?string $token): bool
{
    return is_string($token) && hash_equals(csrf_token(), $token);
}

// ---------- Spiele ----------
function games(): array
{
    $list = json_read(GAMES_DIR . '/games.json', []);
    return array_values(array_filter($list, function ($g) {
        return isset($g['id']) && preg_match('/^[a-z0-9-]+$/', $g['id'])
            && is_file(GAMES_DIR . '/' . $g['id'] . '/game.html');
    }));
}

function find_game(string $id): ?array
{
    foreach (games() as $g) {
        if ($g['id'] === $id) {
            return $g;
        }
    }
    return null;
}

// ---------- Ausgabe ----------
function h($s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function send_frame_policy(): void
{
    header('Content-Security-Policy: frame-ancestors ' . FRAME_ANCESTORS);
}

function page_start(string $title, ?array $user = null): void
{
    header('Content-Type: text/html; charset=utf-8');
    send_frame_policy();
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<meta name="robots" content="noindex, nofollow">';
    echo '<title>' . h($title) . ' · ' . APP_NAME . '</title>';
    echo '<link rel="stylesheet" href="assets/fonts.css"><link rel="stylesheet" href="assets/style.css">';
    echo '</head><body><div class="page">';
    echo '<header class="bar"><a class="logo" href="index.php">' . h(APP_NAME) . '</a>';
    if ($user) {
        echo '<nav>';
        echo '<span class="me">' . h($user['name']) . '</span>';
        echo '<a href="konto.php">Konto</a>';
        if (!empty($user['admin'])) {
            echo '<a href="admin.php">Verwaltung</a>';
        }
        echo '<form method="post" action="logout.php">' . csrf_field() . '<button type="submit" class="link">Abmelden</button></form>';
        echo '</nav>';
    }
    echo '</header><main>';
}

function page_end(): void
{
    echo '</main></div></body></html>';
}

function flash(?string $msg, string $kind = 'ok'): void
{
    if ($msg) {
        echo '<p class="flash ' . h($kind) . '">' . h($msg) . '</p>';
    }
}
