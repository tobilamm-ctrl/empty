# Spielideen für die Plattform „Spieleabend“

Merkliste für weitere Spiele auf dem Spielkit (`plattform/assets/spielkit.js`).

**Fertig:** Farbkreuz (nach „Noch mal!“), Farbkreuz Plus (nach „Noch mal so gut!“), Würfelpoker (Prinzip „Kniffel“),
Vier in einer Reihe, Reversi, Zwölfer (Prinzip „Skyjo“), Kronland (Prinzip „Kingdomino“), Mosaik (Prinzip „Azul“), Codeknacker (Prinzip „Mastermind“), Mühle, Backgammon, Schiffe versenken, Mau-Mau, Kunterbunt (Mau-Mau im Uno-Stil), Rommé, Schafkopf.
Vorlage für neue Spiele: `plattform/games/vorlage/` („Schweinchen“).

Rechtlich gilt für alle: Spielregeln und Spielprinzipien sind frei. Namen, Grafik, Kartenbilder und
Regeltexte sind geschützt. Darum eigener Name, eigene Gestaltung und eigene Texte, kein Blatt
oder Kartenbild 1:1 kopieren.

## Reihenfolge (nach Aufwand und Nutzen)

| # | Spiel (Prinzip) | Spieler | Aufwand | Handy | Computer-Gegner | Hinweise |
|---|---|---|---|---|---|---|
| ✓ | **Reversi** | 2 | fertig | sehr gut (8×8) | drei Stärken | „Othello“ ist ein Markenname |
| ✓ | **Skyjo** → Zwölfer | 2–8 | fertig | gut (eigenes 3×4-Raster) | ja | „Skyjo“ ist ein Markenname |
| ✓ | **Mau-Mau im Uno-Stil** → Kunterbunt | 2–8 | fertig | gut | ja | eigenes Kartendesign (Raute statt Oval, Farbe plus Zeichen); „UNO“ ist ein Markenname |
| ✓ | **Kingdomino** → Kronland | 2–4 | fertig | sehr gut (5×5) | ja | eigene Landschaftsbilder mit Muster; „Kingdomino“ ist ein Markenname |
| ✓ | **Azul** → Mosaik | 2–4 | fertig | gut | ja | Fliesen mit Farbe und Zeichen; „Azul“ ist ein Markenname |
| ✓ | **Rommé** | 2–6 | fertig | gut mit sortierter Hand, Karten ohne Überlappung | ja | Hausregeln als Einstellungen (30/40 Punkte, Ablage, Joker tauschen) |
| 6 | **Patchwork** | 2 | mittel–hoch | gut, Drehen/Spiegeln braucht gute Bedienung | mittel | 33 Flicken selbst gestalten |
| 7 | **Sagrada** | 2–4 | hoch | sehr gut (4×5) | mittel | erst Grundspiel, die 12 Werkzeugkarten danach; Fenstermuster selbst gestalten |

## Weitere Ideen

| Spiel | Spieler | Passt, weil | Aufwand | Rechtlich |
|---|---|---|---|---|
| **Halma / Sternhalma** | 2–6 | Familienspiel für große Runden | mittel | frei |
| **Kalaha (Mancala)** | 2 | in einer Minute erklärt, sehr guter Computer-Gegner möglich | gering | frei |
| **Sperrsteine** (Prinzip „Malefiz“) | 2–4 | würfeln, laufen, Sperrsteine versetzen | mittel | Prinzip frei, „Malefiz“ ist ein Markenname |
| **Ludo / Pachisi** (Prinzip „Mensch ärgere dich nicht“) | 2–4 | Familienklassiker | mittel | Prinzip frei, Name geschützt |
| **Dame** | 2 | Klassiker | mittel | frei |
| **Domino** | 2–4 | Legeregeln einfach | gering | frei |
| **Stadt, Land, Fluss** | 2–6+ | online ideal, alle schreiben gleichzeitig | mittel | frei |
| **Zehntausend** | 2–6 | würfeln und zocken | gering | frei |
| **Wizard** (Stiche ansagen) | 3–6 | online ideal | mittel–hoch | beruht auf dem freien „Oh Hell“ |
| **„Ganz schön clever“** | 1–4 | Würfel nehmen und ablegen | mittel–hoch | wie Farbkreuz, Fotos von Block und Anleitung nötig |

**Eher nicht fürs Handy:** Carcassonne und Qwirkle (wachsender gemeinsamer Plan), Zug um Zug (kleine Strecken
auf großer Karte), Splendor (viele kleine Kostenangaben), Catan (Handeln und Bauen zu fummelig).

## Für jedes neue Spiel

- auf dem Spielkit bauen, Ausgangspunkt `games/vorlage/`
- an einem Gerät, online und (wenn sinnvoll) allein bzw. gegen Computer spielbar
- **Handy zuerst:** alles bei 400 px ohne Zoomen erkennbar, Tippziele mindestens 44 px, Farben immer
  zusätzlich mit Symbol oder Muster, eigenes Tableau groß, Mitspieler kompakt
- verdeckte Informationen: `privateHands: true`, nur die eigenen Geheimnisse zeigen
- testen: an einem Gerät, gegen Computer, online mit zwei Konten (beide Geräte gleicher Stand)
