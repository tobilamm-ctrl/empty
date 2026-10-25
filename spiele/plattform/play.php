<?php
// Liefert ein Spiel aus dem geschützten Ordner games/ aus – nur nach Anmeldung.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$user = require_login();
$game = find_game((string)($_GET['spiel'] ?? ''));
if (!$game) {
    http_response_code(404);
    page_start('Nicht gefunden', $user);
    echo '<p class="note">Dieses Spiel gibt es nicht. <a href="index.php">Zur Übersicht</a></p>';
    page_end();
    exit;
}

$platform = [
    'user' => $user['username'],
    'name' => $user['name'],
    'game' => $game['id'],
    'api' => 'api.php',
    'home' => 'index.php',
    'csrf' => csrf_token(),
];

header('Content-Type: text/html; charset=utf-8');
send_frame_policy();
header('Cache-Control: no-store');
echo '<!doctype html><html lang="de"><head><meta charset="utf-8">';
echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
echo '<meta name="robots" content="noindex, nofollow">';
echo '<link rel="stylesheet" href="' . asset_url('assets/fonts.css') . '">';
echo '<style>body{margin:0}</style>';
echo '<script>window.PLATFORM = ' . json_encode($platform, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) . ';</script>';
echo '</head><body>';
// Verweise auf assets/… mit Versionskennung versehen (sonst bleibt nach einem Update die alte spielkit.js im Browser)
$html = (string)file_get_contents(GAMES_DIR . '/' . $game['id'] . '/game.html');
echo preg_replace_callback('~(["\'])(assets/[A-Za-z0-9_./-]+\.(?:js|css))\1~', fn($m) => $m[1] . asset_url($m[2]) . $m[1], $html);
echo '</body></html>';
