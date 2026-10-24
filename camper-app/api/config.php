<?php
// Einstellungen für den Server-Teil von LAMMping (siehe ANLEITUNG.md).

return [
    // Wird einmalig bei der Ersteinrichtung abgefragt. Unbedingt ändern!
    'setup_code' => 'bitte-aendern',

    // Speicherort: SQLite-Datei (Standard, nichts einzurichten) …
    'db' => 'sqlite:' . __DIR__ . '/data/lammping.sqlite',
    'db_user' => null,
    'db_pass' => null,

    // … oder MySQL aus der konsoleH:
    // 'db' => 'mysql:host=localhost;dbname=DATENBANKNAME;charset=utf8mb4',
    // 'db_user' => 'BENUTZER',
    // 'db_pass' => 'PASSWORT',

    // Ordner für Fotos
    'photos' => __DIR__ . '/data/photos',
];
