# Spieleabend – private Spieleplattform

Passwortgeschützte Seite für Familie und Freunde. Jede Person bekommt ein eigenes Konto.
Nach der Anmeldung erscheinen alle hinterlegten Spiele. Spiele mit Online-Modus lassen sich
an mehreren Geräten gegeneinander spielen.

Enthalten (jeweils an einem Gerät mit Weitergeben, gegen Computer-Gegner und online spielbar):

| Spiel | Spieler | Besonderheit |
|---|---|---|
| **Farbkreuz** | 1–6 | Würfelspiel nach den Regeln von „Noch mal!“, Standard- oder Zufallsblatt, Solo mit 30 Würfen |
| **Farbkreuz Plus** | 1–6 | nach „Noch mal so gut!“: Sonderwürfel, Bomben, Herzen, Zeilenboni |
| **Würfelpoker** | 1–6 | 13 Runden, 5 Würfel, Wertungsblock, Solo mit Bestwert |
| **Vier in einer Reihe** | 2 | Computer in drei Stärken |
| **Codeknacker** | 1–2 | Farbcode knacken, allein gegen den Computer oder abwechselnd zu zweit |
| **Mühle** | 2 | Setzen, Ziehen, Springen |
| **Backgammon** | 2 | Partie bis 1, 3 oder 5 Punkte, ohne Verdopplungswürfel |
| **Schiffe versenken** | 2 | verdeckte Aufstellung |
| **Mau-Mau** | 2–6 | Sonderkarten einzeln abschaltbar, Strafpunkte über mehrere Runden |
| **Schafkopf** | 4 | Sauspiel, Wenz, Farbsolo, Abrechnung über die Sitzung; fehlende Spieler übernimmt der Computer |

Voraussetzungen: PHP 8.1 oder neuer, Apache mit `.htaccess` (bei Hetzner Webhosting gegeben).
Keine Datenbank nötig. Die Daten liegen als Dateien im Ordner `data/`.

## Hochladen auf den Hetzner-Webspace

1. **SSL einschalten.** In der konsoleH für die Domain ein (kostenloses) Let's-Encrypt-Zertifikat
   aktivieren. Ohne HTTPS gehen Passwörter unverschlüsselt durchs Netz.
2. **PHP-Version prüfen.** In der konsoleH PHP 8.1 oder neuer einstellen.
3. **Dateien hochladen.** Den *Inhalt* dieses Ordners per SFTP/FTP (z. B. mit FileZilla) nach
   `public_html/` kopieren – oder in einen Unterordner wie `public_html/spiele/`.
   Die versteckten Dateien `.htaccess` müssen mit hochgeladen werden
   (in FileZilla: Server → „Anzeigen versteckter Dateien erzwingen“).
4. **Einrichten.** Die Adresse im Browser öffnen (z. B. `https://deine-domain.de/spiele/`).
   Beim ersten Aufruf erscheint die Einrichtung: Konto für dich anlegen.
5. **Konten anlegen.** Unter „Verwaltung“ für jede Person ein Konto mit Start-Passwort anlegen
   und persönlich weitergeben. Jeder kann sein Passwort unter „Konto“ ändern.
6. **HTTPS erzwingen (empfohlen).** In der `.htaccess` die vier Zeilen unter
   „Immer verschlüsselt“ entkommentieren (das `#` am Zeilenanfang entfernen).

Erscheint bei der Einrichtung „Ordner data nicht beschreibbar“: den Ordner `data` per FTP auf
Rechte `770` (oder `775`) setzen.

## Schutz

- Spiele werden nur über `play.php` nach der Anmeldung ausgeliefert. Die Ordner `games/`, `data/`
  und `lib/` sind per `.htaccess` für direkte Aufrufe gesperrt.
- Passwörter werden nur als sicherer Hash gespeichert (`password_hash`).
- Nach 8 Fehlversuchen ist die Anmeldung von dieser Adresse 15 Minuten gesperrt.
- Schutz gegen untergeschobene Formulare (CSRF-Token), Sitzungs-Cookie nur per HTTP und bei
  HTTPS nur verschlüsselt.
- Suchmaschinen werden ausgesperrt (`robots.txt`, `noindex`).
- Schriften liegen auf dem eigenen Server. Es werden keine Daten an Google oder andere Dienste übertragen.

Zusätzlich lässt sich in der konsoleH ein Verzeichnisschutz (Benutzer + Passwort des Webservers)
vor den Ordner legen. Dann fragt der Browser vor der Login-Seite noch ein zweites Passwort ab.

## In eine andere Seite einbetten (z. B. LAMMping)

Alle Seiten senden `Content-Security-Policy: frame-ancestors 'self' https://lamm7.de https://*.lamm7.de`.
Damit dürfen nur die eigene Seite und Seiten unter `lamm7.de` die Plattform per `<iframe>` einbinden,
etwa `https://lammping.lamm7.de`. Jede andere Seite zeigt statt der Plattform eine Fehlermeldung des Browsers.

```html
<iframe src="https://spieleabend.lamm7.de/play.php?spiel=farbkreuz" style="width:100%;height:100vh;border:0"></iframe>
```

- Die Anmeldung funktioniert auch eingebettet. Das Sitzungs-Cookie (`SameSite=Lax`) wird mitgeschickt,
  weil beide Seiten zur selben Website `lamm7.de` gehören. Voraussetzung: **beide laufen über HTTPS**.
- `play.php?spiel=<id>` bleibt direkt aufrufbar. Ohne Anmeldung kommt zuerst die Anmeldeseite.
- Weitere erlaubte Seiten trägt man in `lib/bootstrap.php` bei `FRAME_ANCESTORS` ein. Eine Seite unter
  einer *anderen* Domain einzubetten, würde zusätzlich andere Cookie-Einstellungen brauchen, und viele
  Browser blockieren das inzwischen. Das klappt also nur unter `lamm7.de` zuverlässig.

## Sicherung

Wichtig ist nur der Ordner `data/`: `users.json` (Konten) und `rooms/` (laufende Online-Spiele).
Online-Räume ohne Änderung werden nach 3 Tagen automatisch gelöscht.

## Ein neues Spiel bauen

Alle Spiele nutzen das gemeinsame Gerüst **Spielkit** (`assets/spielkit.js`, `assets/spielkit.css`).
Es übernimmt:

- den Dialog „Neues Spiel“: Spielart (an diesem Gerät / allein / online), Spieler mit Namen,
  Computer-Gegner und einen Bereich für eigene Einstellungen des Spiels
- Online-Räume: eröffnen, beitreten, Wartebereich, Computer-Gegner hinzufügen, starten, neue Runde,
  Abgleich zwischen den Geräten
- den Bildschirm „Gerät weitergeben an …“, wenn mehrere Menschen an einem Gerät spielen
- Speichern des laufenden Spiels auf dem Gerät und den Rückweg zur Spieleübersicht

Das Spiel liefert nur Regeln und Darstellung. Ein vollständiges, kommentiertes Beispiel ist
`games/vorlage/game.html` (das Würfelspiel „Schweinchen“). So geht's:

1. `games/vorlage/` kopieren, z. B. nach `games/meinspiel/`.
2. In `game.html` Regeln und Darstellung ersetzen. Die Platzhalter für das Gerüst bleiben stehen:
   `data-sk-toolbar` (Knöpfe oben), `data-sk-banner` (Hinweise), `data-sk-lobby` (Wartebereich online).
3. In `games/games.json` eintragen:
   ```json
   { "id": "meinspiel", "title": "Name", "description": "Ein Satz", "players": "2–4 Spieler", "color": "#58a8e2" }
   ```

### Was das Spiel dem Spielkit übergibt

```js
const kit = Spielkit.create({
  id: "meinspiel",            // Kennung für das Speichern
  version: 1,                 // erhöhen, wenn alte Spielstände nicht mehr passen
  minPlayers: 2, maxPlayers: 6,
  bots: true,                 // gibt es Computer-Gegner?
  solo: { label: "Allein", small: "…" },   // nur wenn es eine Solo-Variante gibt
  setup: { html, init, sync, read },        // eigene Felder im Dialog (optional, Beispiel: Farbkreuz)
  newPlayer: r => ({ ...r, punkte: 0 }),    // r = { id, name, ai }
  newState: ({ mode, roster, options, rematch }) => ({ players: roster.map(newPlayer), phase: "…", log: [] }),
  onStart: s => { … },        // online: Gastgeber startet (aus dem Wartebereich oder als neue Runde)
  whoActs: () => [ … ],       // Indizes der Spieler, die gerade handeln dürfen (Reihenfolge zählt)
  onState: s => { S = s; },   // das Spielkit hat einen neuen Spielstand (laden, Server, neues Spiel)
  render,                     // Spielstand anzeigen
  roomStatus: s => "…",       // Text in der Raumliste (optional)
  handoverText: (s, i) => "…",// Text auf dem Weitergeben-Bildschirm (optional)
});
kit.start();
```

Jede Änderung am Spielstand läuft über `kit.act(() => { … })`. Lokal wird sofort gespeichert. Online
wird an den Server geschickt, und wenn ein anderes Gerät schneller war, läuft die Funktion auf dem
neuesten Stand erneut. Gibt sie `false` zurück (Zug nicht mehr erlaubt), wird nichts gespeichert.

Weitere Helfer: `kit.me()` (wer bedient gerade das Gerät, online −1 = Zuschauer), `kit.addLog(html)`,
`kit.isHost()`, `kit.online()`, `kit.solo()`, `kit.hotSeat()`, `kit.roomId()`, `kit.rematch()`,
`kit.openSetup()`, `kit.error`.

Spielstände müssen als JSON speicherbar sein (keine Funktionen, keine `Set`/`Map`).

### Raum-Schnittstelle (nutzt das Spielkit selbst)

| Aufruf | Zweck |
|---|---|
| `GET api.php?a=rooms&game=<id>` | offene Räume des Spiels |
| `POST api.php?a=create` `{game, state, meta}` | Raum anlegen → `{id, version}` |
| `GET api.php?a=get&id=<id>&since=<version>` | Spielstand abholen (`changed: false`, wenn unverändert) |
| `POST api.php?a=put` `{id, version, state, meta}` | Spielstand speichern; bei veralteter Version Antwort 409 mit aktuellem Stand |
| `POST api.php?a=delete` `{id}` | Raum schließen (nur wer ihn eröffnet hat) |

## Ordner

```
index.php      Anmeldung und Spieleübersicht
setup.php      Ersteinrichtung (danach gesperrt)
admin.php      Konten verwalten
konto.php      eigenes Passwort und Anzeigename
play.php       liefert ein Spiel nach Anmeldung aus
api.php        Online-Räume
lib/           PHP-Kern (gesperrt)
data/          Konten und Räume (gesperrt, wird beim Einrichten befüllt)
games/         Spiele (gesperrt, nur über play.php erreichbar), vorlage/ als Startpunkt
assets/        Gestaltung, Schriften und das Spielkit (spielkit.js, spielkit.css)
```
