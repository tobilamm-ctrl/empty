# Lieferungen „Spieleabend“

Jede Lieferung hat eine fortlaufende Nummer und kommt als zwei ZIP-Dateien:

- `spieleabend-NN-komplett.zip`: die ganze Plattform. Hochladen und alles außer dem Ordner `data/` überschreiben.
- `spieleabend-NN-update.zip`: nur die Dateien, die sich seit der vorigen Lieferung geändert haben. Hochladen und
  überschreiben. Steht darin eine Datei `GELOESCHT.txt`, die dort genannten Dateien auf dem Server löschen.

Welche Lieferung auf dem Server liegt, steht unten auf der Spieleübersicht („Stand: Lieferung NN“, aus `VERSION.txt`).

| Nr. | Datum | Commit | Inhalt |
|---|---|---|---|
| 1 | 25.10.2026 | f031468 | Alle Spiele bis dahin; Zugleiste mit Neuigkeiten, Computer mit Pause, Töne (letzte Lieferung ohne Nummer) |
| 2 | 25.10.2026 | e0e00cc | Sprachausgabe (Knopf „🗣“: aus, wer dran ist, mit Zügen, mit Anweisungen); Verlaufstexte mit „du“-Formen in Mau-Mau, Backgammon, Codeknacker; Stand-Anzeige auf der Spieleübersicht |
| 3 | 25.10.2026 | b8e00a8 | Neu: Punkteblock (Qwirkle oder allgemein, ein Gerät für alle) und Farbreihen (Prinzip „Qwixx“); Spielkit: Einstellung für ein gemeinsames Gerät |
| 4 | 25.10.2026 | 573eb48 | Punkteblock mit weiteren Voreinstellungen: Mölkky, Boule, Cornhole, Wizard, Phase 10, Kniffel (ein angefangener Qwirkle-Block aus Lieferung 3 beginnt neu) |
| 5 | 25.10.2026 | 5d93857 | Punkteblock: UNO (Sieger sammelt bzw. Minuspunkte), Scrabble (Bingo +50, Restbuchstaben), Take That (Plus, Minus, Kröten); Spielname groß oben im Punkteblock; Versionskennung an Skript- und Stildateien (kein alter Stand aus dem Browser-Zwischenspeicher) |
| 6 | 26.10.2026 | cf3a14b | Neu: Zehnerleiter (Kartenspiel nach dem Prinzip „Phase 10“) |
| 7 | 26.10.2026 | dd06396 | Zehnerleiter: Ziel der aktuellen Phase immer sichtbar (auch bei den Mitspielern); Hausregel „Folge über 12 hinaus“ (11-12-1-2), anfangs eingeschaltet |
