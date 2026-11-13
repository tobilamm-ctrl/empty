<?php
// Teil des LAMMping-Servers, wird von api/index.php eingebunden. Sicherungen, Papierkorb, Fotos und PDFs im Dateisystem.

declare(strict_types=1);
if (!defined('API_VERSION')) { http_response_code(403); exit; }

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
