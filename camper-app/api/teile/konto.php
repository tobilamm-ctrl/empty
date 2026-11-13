<?php
// Teil des LAMMping-Servers, wird von api/index.php eingebunden. Anmeldung, Rechte, Crew-Zugehörigkeit, Sitzung.

declare(strict_types=1);
if (!defined('API_VERSION')) { http_response_code(403); exit; }

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
