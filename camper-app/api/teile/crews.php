<?php
// Teil des LAMMping-Servers, wird von api/index.php eingebunden. Öffentliche Kommentare, Mitteilungen an folgende Crews, Reisen einer Crew.

declare(strict_types=1);
if (!defined('API_VERSION')) { http_response_code(403); exit; }

// Öffentliche Kommentare je Eintrag (ältester zuerst); $me = ['user' => …] oder ['device' => …] für „eigener Kommentar“
function commentsOf(string $crew, array $entryIds, array $me = []): array {
    $res = [];
    if (!$entryIds) return $res;
    foreach (all('SELECT * FROM comments WHERE of_crew = ? ORDER BY at', [$crew]) as $r) {
        if (!in_array($r['entry_id'], $entryIds, true)) continue;
        $mine = (!empty($me['user']) && $r['by_user'] === $me['user']) || (!empty($me['device']) && $r['device'] === $me['device']);
        $res[$r['entry_id']][] = ['id' => $r['id'], 'src' => $r['src'], 'name' => $r['name'], 'text' => $r['text'], 'at' => (int) $r['at'], 'mine' => $mine];
    }
    return $res;
}
function commentText($t): string {
    $t = trim(preg_replace('/[\x00-\x08\x0b-\x1f]/u', '', mb_substr((string) $t, 0, 600)));
    if ($t === '') fail('Bitte etwas schreiben.');
    return $t;
}
// Neuer Kommentar: die Crew des Eintrags bekommt eine Mitteilung (außer wer selbst geschrieben hat)
function commentPush(string $crew, string $entryId, string $who, string $text, string $skipUser = ''): void {
    if (!function_exists('curl_init') || !function_exists('openssl_pkey_derive')) return;
    // Höchstens eine Mitteilung je Eintrag und 10 Minuten
    $k = substr("cm:$crew:$entryId", 0, 160);
    $last = one('SELECT at FROM push_log WHERE k = ?', [$k]);
    if ($last && (int) $last['at'] > now() - 10 * 60000) return;
    q('DELETE FROM push_log WHERE k = ?', [$k]);
    q('INSERT INTO push_log (k, at) VALUES (?, ?)', [$k, now()]);
    $e = one("SELECT data FROM docs WHERE crew_id = ? AND coll = 'entries' AND id = ? AND deleted = 0", [$crew, $entryId]);
    $title = $e ? (string) (json_decode($e['data'], true)['title'] ?? '') : '';
    pushCrew($crew, 'friends', ['title' => '💬 ' . $who . ($title !== '' ? ' zu „' . mb_substr($title, 0, 40) . '“' : ''), 'body' => mb_substr($text, 0, 140),
        'url' => './#/tagebuch', 'tag' => 'cmt-' . $entryId], $skipUser);
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
            'url' => './#/tagebuch/' . $crew . '.' . ($e['id'] ?? ''), 'tag' => 'post-' . $crew]); } catch (Throwable $e2) { /* weiter */ }
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
// Mitglieder einer Crew nur mit Namen und Leiter-Kennzeichen (für andere Crews sichtbar)
function crewPeople(string $crew): array {
    return array_map(fn($r) => ['name' => $r['name'], 'leader' => (bool) (int) $r['leader']],
        all('SELECT u.name, m.leader FROM members m JOIN users u ON u.id = m.user_id WHERE m.crew_id = ? ORDER BY m.leader DESC, u.name', [$crew]));
}
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
