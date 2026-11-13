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
const API_VERSION = 37;                     // erhöhen, wenn die App neue Server-Aktionen braucht
const COOKIE = 'lammping';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

// Die Teile des Servers (Funktionen); die Aktionen stehen unten in dieser Datei
foreach (['basis', 'konto', 'push', 'crews', 'dateien'] as $teil) require __DIR__ . '/teile/' . $teil . '.php';

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
        $opts = is_array($body['opts'] ?? null) ? json_encode(array_intersect_key($body['opts'], array_flip(['photos', 'texts', 'highlights', 'map', 'delay', 'greeting', 'sounds', 'likes', 'comments'])), JSON_UNESCAPED_UNICODE) : ($old['opts'] ?? null);
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
case 'blog-comment':
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
    if ($action === 'blog-comment') {
        if ($method !== 'POST') fail('Nur POST');
        if (!$opt('comments')) fail('Kommentare sind für diesen Reiseblog ausgeschaltet.', 403);
        $id = (string) ($body['id'] ?? ''); $dev = strtolower((string) ($body['d'] ?? ''));
        if (!preg_match('/^[a-f0-9]{16,40}$/', $dev) || !in_array($id, array_column($entries, 'id'), true)) fail('Ungültiger Kommentar');
        if (!empty($body['del'])) {
            q('DELETE FROM comments WHERE id = ? AND of_crew = ? AND src = ? AND device = ?', [(string) $body['del'], $crew, 'blog', $dev]);
            out(['ok' => true, 'comments' => commentsOf($crew, [$id], ['device' => $dev])[$id] ?? []]);
        }
        $name = trim(preg_replace('/[\x00-\x1f<>]/u', '', mb_substr((string) ($body['name'] ?? ''), 0, 40)));
        if ($name === '') fail('Bitte deinen Namen angeben.');
        $text = commentText($body['text'] ?? '');
        // Gegen Unfug: höchstens 6 Kommentare je Gerät und Stunde, 300 je Reiseblog und Tag
        if ((int) one('SELECT COUNT(*) AS n FROM comments WHERE device = ? AND at > ?', [$dev, now() - 3600000])['n'] >= 6) fail('Bitte etwas später noch einmal.', 429);
        if ((int) one("SELECT COUNT(*) AS n FROM comments WHERE of_crew = ? AND src = 'blog' AND at > ?", [$crew, now() - 86400000])['n'] >= 300) fail('Bitte etwas später noch einmal.', 429);
        q('INSERT INTO comments (id, of_crew, entry_id, src, device, name, text, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [newId(), $crew, $id, 'blog', $dev, $name, $text, now()]);
        commentPush($crew, $id, $name . ' (Reiseblog)', $text);
        out(['ok' => true, 'comments' => commentsOf($crew, [$id], ['device' => $dev])[$id] ?? []]);
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
        'commentsOn' => (bool) $opt('comments'),
        'comments' => (object) ($opt('comments') ? commentsOf($crew, array_column($entries, 'id'), ['device' => strtolower((string) ($_GET['d'] ?? ''))]) : []),
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
    $ids = array_column(all("SELECT id FROM docs WHERE crew_id = ? AND coll = 'entries' AND deleted = 0", [$crew]), 'id');
    out(['likes' => (object) $res, 'crews' => (object) $cr, 'comments' => (object) commentsOf($crew, $ids, ['user' => $u['id']])]);

case 'comment':
    // Eigene Crew: öffentlich antworten oder einen Kommentar zu einem eigenen Eintrag löschen
    $u = requireUser();
    $crew = requireCrew($u, $body['crew'] ?? '');
    $id = (string) ($body['id'] ?? '');
    if (!validId($id) || !one("SELECT id FROM docs WHERE crew_id = ? AND coll = 'entries' AND id = ? AND deleted = 0", [$crew, $id])) fail('Diesen Eintrag gibt es nicht.', 404);
    if (!empty($body['del'])) q('DELETE FROM comments WHERE id = ? AND of_crew = ?', [(string) $body['del'], $crew]);
    else q('INSERT INTO comments (id, of_crew, entry_id, src, by_crew, by_user, name, text, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newId(), $crew, $id, 'own', $crew, $u['id'], crewName($crew) . ' (' . $u['name'] . ')', commentText($body['text'] ?? ''), now()]);
    out(['ok' => true, 'comments' => commentsOf($crew, [$id], ['user' => $u['id']])[$id] ?? []]);

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
        // Gerade beendet (Ende höchstens 7 Tage her): bleibt für Folgende noch als Reiter im Tagebuch
        if ($me === 'ok' && !$t) {
            $d = date('Y-m-d'); $week = date('Y-m-d', time() - 7 * 86400);
            foreach (friendTrips($c['id']) as $x) {
                $e = (string) ($x['end'] ?? ''); $s0 = (string) ($x['start'] ?? '');
                if ($s0 !== '' && $s0 <= $d && $e !== '' && $e >= $week && $e <= $d) {
                    $row['recent'] = ['id' => $x['id'], 'name' => $x['name'] ?? '', 'kind' => (string) ($x['kind'] ?? ''), 'color' => $x['color'] ?? '#0F6670', 'end' => $e];
                    break;
                }
            }
        }
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
case 'follow-comment':
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
    if ($action === 'follow-comment') {
        if ($method !== 'POST') fail('Nur POST');
        $id = $arg('id');
        if (!in_array($id, array_column($entries, 'id'), true)) fail('Diesen Eintrag gibt es nicht (mehr).', 404);
        if (!empty($body['del'])) q('DELETE FROM comments WHERE id = ? AND of_crew = ? AND by_user = ?', [(string) $body['del'], $of, $u['id']]);
        else {
            $text = commentText($body['text'] ?? '');
            $who = crewName($crew) . ' (' . $u['name'] . ')';
            q('INSERT INTO comments (id, of_crew, entry_id, src, by_crew, by_user, name, text, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [newId(), $of, $id, 'crew', $crew, $u['id'], $who, $text, now()]);
            commentPush($of, $id, $who, $text);
        }
        out(['ok' => true, 'comments' => commentsOf($of, [$id], ['user' => $u['id']])[$id] ?? []]);
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
    $cm = commentsOf($of, array_column($entries, 'id'), ['user' => $u['id']]);
    foreach ($entries as &$e) { $e['likes'] = $likes[$e['id']] ?? 0; $e['liked'] = in_array($e['id'], $mine, true); $e['comments'] = $cm[$e['id']] ?? []; }
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
        'crew' => crewName($of), 'people' => crewPeople($of), 'running' => (bool) $isRun, 'trips' => $tripList,
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
            $crews[] = ['id' => $c['id'], 'name' => $c['name'], 'count' => (int) $c['n'], 'foreign' => true, 'people' => crewPeople($c['id'])];
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
    q('DELETE FROM comments WHERE of_crew = ?', [$id]);
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
