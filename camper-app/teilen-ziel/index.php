<?php
// „Teilen mit LAMMping“: Normalerweise nimmt der Service Worker (sw.js) das Geteilte an.
// Läuft er noch nicht, landet die Anfrage hier: Text und Link mitgeben, Fotos gehen dann leider verloren.
$q = http_build_query(array_filter([
    'title' => (string) ($_POST['title'] ?? ''), 'text' => (string) ($_POST['text'] ?? ''), 'url' => (string) ($_POST['url'] ?? ''),
], 'strlen'));
header('Location: ../' . ($q ? '?' . $q : '') . '#/teilen', true, 303);
