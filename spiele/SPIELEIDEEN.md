# Spielideen für die Plattform „Spieleabend“

Merkliste für weitere Spiele auf dem Spielkit (`plattform/assets/spielkit.js`).

**Fertig:** Farbkreuz (nach „Noch mal!“), Farbkreuz Plus (nach „Noch mal so gut!“), Würfelpoker (Prinzip „Kniffel“),
Vier in einer Reihe, Codeknacker (Prinzip „Mastermind“), Mühle, Backgammon, Schiffe versenken, Mau-Mau, Schafkopf.
Vorlage für neue Spiele: `plattform/games/vorlage/` („Schweinchen“).

Rechtlich gilt für alle: Spielregeln und Spielprinzipien sind frei. Namen, Grafik, Kartenbilder und
Regeltexte sind geschützt. Darum eigener Name, eigene Gestaltung und eigene Texte, kein Blatt
oder Kartenbild 1:1 kopieren.

## Brettspiele und Klassiker

| Spiel | Spieler | Passt, weil | Aufwand | Rechtlich |
|---|---|---|---|---|
| **Halma / Sternhalma** | 2–6 | Familienspiel für große Runden, Springen über Ketten, Computer-Gegner einfach | mittel | frei |
| **Reversi** | 2 | schnell erklärt, taktisch, starker Computer-Gegner leicht möglich | gering | frei, „Othello“ ist ein Markenname |
| **Kalaha (Mancala)** | 2 | uraltes Bohnenspiel, in einer Minute erklärt, sehr guter Computer-Gegner möglich | gering | frei |
| **Sperrsteine** (Prinzip „Malefiz“) | 2–4 | würfeln, laufen, Sperrsteine versetzen | mittel | Prinzip frei, „Malefiz“ ist ein Markenname |
| **Ludo / Pachisi** (Prinzip „Mensch ärgere dich nicht“) | 2–4 | Familienklassiker, Computer-Gegner einfach | mittel | Prinzip frei, Name geschützt |
| **Dame** | 2 | Klassiker | mittel | frei |
| **Domino** | 2–4 | Legeregeln einfach, Computer-Gegner einfach | gering | frei |

## Würfel-, Karten- und Partyspiele

| Spiel | Spieler | Passt, weil | Aufwand | Rechtlich |
|---|---|---|---|---|
| **Stadt, Land, Fluss** | 2–6+ | online ideal: alle schreiben gleichzeitig am eigenen Gerät, danach gemeinsame Bewertung, ohne Computer-Gegner | mittel | frei |
| **Zehntausend** | 2–6 | würfeln und zocken, schnell erklärt | gering | frei (Volksspiel) |
| **Wizard** (Stiche ansagen) | 3–6 | Runde für Runde Stiche ansagen, online ideal | mittel–hoch: Computer muss Stiche schätzen | beruht auf dem freien „Oh Hell“; Name und Kartenbilder nicht |
| **Skyjo** (Karten tauschen, möglichst wenig Punkte) | 2–8 | verdecktes Kartenraster, rundenbasiert, Computer einfach; für mehr als 6 Spieler `maxPlayers` erhöhen | mittel | neueres Verlagsspiel, Lage wie bei Farbkreuz; verwandt mit dem freien „Golf“ |
| **„Ganz schön clever“** (fünf Farbbereiche mit Kettenboni) | 1–4 | Würfel nehmen und ablegen, Solo-Variante vorhanden | mittel–hoch: viele Sonderregeln, Computer anspruchsvoll | wie Farbkreuz. Fotos von Block und Anleitung nötig |

## Für jedes neue Spiel

- auf dem Spielkit bauen, Ausgangspunkt `games/vorlage/`
- an einem Gerät, online und (wenn sinnvoll) allein bzw. gegen Computer spielbar
- verdeckte Informationen (eigene Hand, geheimer Code): `privateHands: true`, nur die eigenen Geheimnisse zeigen
- testen: an einem Gerät, gegen Computer, online mit zwei Konten (beide Geräte gleicher Stand)
