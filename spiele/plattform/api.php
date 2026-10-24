<?php
// Schnittstelle für Online-Räume. Der Server speichert den Spielstand jedes Raums
// und erkennt über eine Versionsnummer, wenn zwei Geräte gleichzeitig schreiben.
// Die Spielregeln selbst laufen im Browser (alle Teilnehmer sind angemeldete Bekannte).
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

const MAX_STATE_BYTES = 400000;
const ROOM_TTL = 60 * 60 * 24 * 3;   // Räume ohne Änderung verschwinden nach 3 Tagen

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$user = current_user();
if (!$user) {
    out(['error' => 'Bitte neu anmelden.'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = (string)($_GET['a'] ?? '');
$body = [];
if ($method === 'POST') {
    if (!check_csrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null)) {
        out(['error' => 'Sitzung abgelaufen. Bitte Seite neu laden.'], 403);
    }
    $raw = file_get_contents('php://input', false, null, 0, MAX_STATE_BYTES + 10000);
    // Als Objekte lesen, damit leere {} im Spielstand nicht zu [] werden
    $body = json_decode((string)$raw, false);
    if (!is_object($body)) {
        out(['error' => 'Ungültige Anfrage.'], 400);
    }
}

function room_file(string $id): string
{
    if (!preg_match('/^[A-Z2-9]{6}$/', $id)) {
        out(['error' => 'Unbekannter Raum.'], 404);
    }
    return DATA_DIR . '/rooms/' . $id . '.json';
}

function valid_game(string $id): string
{
    if (!find_game($id)) {
        out(['error' => 'Unbekanntes Spiel.'], 400);
    }
    return $id;
}

function room_read(string $file): ?object
{
    if (!is_file($file)) {
        return null;
    }
    $r = json_decode((string)file_get_contents($file), false);
    return is_object($r) ? $r : null;
}

function clean_meta($meta): array
{
    $meta = is_object($meta) ? (array)$meta : [];
    $players = array_slice(array_map(fn($p) => mb_substr((string)$p, 0, 24), (array)($meta['players'] ?? [])), 0, 12);
    return [
        'title' => mb_substr((string)($meta['title'] ?? ''), 0, 60),
        'status' => mb_substr((string)($meta['status'] ?? ''), 0, 40),
        'players' => $players,
        'open' => !empty($meta['open']),
    ];
}

function state_ok($state): void
{
    if (!is_object($state) || strlen(json_encode($state)) > MAX_STATE_BYTES) {
        out(['error' => 'Spielstand ungültig oder zu groß.'], 400);
    }
}

ensure_data_dir();

switch ($action) {
    case 'rooms':
        $game = valid_game((string)($_GET['game'] ?? ''));
        $list = [];
        foreach (glob(DATA_DIR . '/rooms/*.json') ?: [] as $f) {
            if (filemtime($f) < time() - ROOM_TTL) {
                @unlink($f);
                continue;
            }
            $r = room_read($f);
            if (!$r || $r->game !== $game) {
                continue;
            }
            $list[] = ['id' => $r->id, 'owner' => $r->owner, 'ownerName' => $r->ownerName ?? $r->owner,
                'updated' => $r->updated, 'meta' => $r->meta];
        }
        usort($list, fn($a, $b) => $b['updated'] <=> $a['updated']);
        out(['rooms' => $list]);

    case 'get':
        $f = room_file((string)($_GET['id'] ?? ''));
        $r = room_read($f);
        if (!$r) {
            out(['error' => 'Diesen Raum gibt es nicht mehr.'], 404);
        }
        $since = (int)($_GET['since'] ?? -1);
        if ($since === $r->version) {
            out(['changed' => false, 'version' => $r->version]);
        }
        out(['changed' => true, 'version' => $r->version, 'state' => $r->state, 'owner' => $r->owner]);

    case 'create':
        if ($method !== 'POST') {
            out(['error' => 'Nur POST.'], 405);
        }
        $game = valid_game((string)($body->game ?? ''));
        state_ok($body->state ?? null);
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        do {
            $id = '';
            for ($i = 0; $i < 6; $i++) {
                $id .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $f = DATA_DIR . '/rooms/' . $id . '.json';
        } while (is_file($f));
        $room = ['id' => $id, 'game' => $game, 'owner' => $user['username'], 'ownerName' => $user['name'],
            'version' => 1, 'created' => time(), 'updated' => time(),
            'meta' => clean_meta($body->meta ?? null), 'state' => $body->state];
        json_write($f, $room);
        out(['id' => $id, 'version' => 1]);

    case 'put':
        if ($method !== 'POST') {
            out(['error' => 'Nur POST.'], 405);
        }
        $f = room_file((string)($body->id ?? ''));
        state_ok($body->state ?? null);
        $fh = @fopen($f, 'r+b');
        if (!$fh) {
            out(['error' => 'Diesen Raum gibt es nicht mehr.'], 404);
        }
        flock($fh, LOCK_EX);
        $r = json_decode((string)stream_get_contents($fh), false);
        if (!is_object($r)) {
            flock($fh, LOCK_UN);
            fclose($fh);
            out(['error' => 'Raumdatei beschädigt.'], 500);
        }
        if ((int)($body->version ?? -1) !== $r->version) {
            flock($fh, LOCK_UN);
            fclose($fh);
            out(['conflict' => true, 'version' => $r->version, 'state' => $r->state], 409);
        }
        $r->version++;
        $r->updated = time();
        $r->state = $body->state;
        $r->meta = clean_meta($body->meta ?? $r->meta);
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($r, JSON_UNESCAPED_UNICODE));
        fflush($fh);
        flock($fh, LOCK_UN);
        fclose($fh);
        out(['version' => $r->version]);

    case 'delete':
        if ($method !== 'POST') {
            out(['error' => 'Nur POST.'], 405);
        }
        $f = room_file((string)($body->id ?? ''));
        $r = room_read($f);
        if ($r && ($r->owner === $user['username'] || !empty($user['admin']))) {
            @unlink($f);
            out(['ok' => true]);
        }
        out(['error' => 'Nur wer den Raum eröffnet hat, kann ihn schließen.'], 403);

    default:
        out(['error' => 'Unbekannte Aktion.'], 400);
}
