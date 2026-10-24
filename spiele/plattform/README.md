# Spieleabend – private Spieleplattform

Passwortgeschützte Seite für Familie und Freunde. Jede Person bekommt ein eigenes Konto.
Nach der Anmeldung erscheinen alle hinterlegten Spiele. Spiele mit Online-Modus lassen sich
an mehreren Geräten gegeneinander spielen.

Enthalten: **Farbkreuz** (Würfelspiel nach den Regeln von „Noch mal!“) – solo, gegen den Computer
oder online mit bis zu 6 Spielern, wahlweise mit Original-Blatt oder zufällig erzeugtem Blatt.

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

## Sicherung

Wichtig ist nur der Ordner `data/`: `users.json` (Konten) und `rooms/` (laufende Online-Spiele).
Online-Räume ohne Änderung werden nach 3 Tagen automatisch gelöscht.

## Ein neues Spiel hinzufügen

1. Ordner `games/<kennung>/` anlegen (Kennung: Kleinbuchstaben, Ziffern, Minus) und darin
   eine `game.html` ablegen. Sie enthält nur den Seiteninhalt (Styles, Markup, Skript) ohne
   `<html>`/`<head>`. Den Rahmen ergänzt `play.php`.
2. In `games/games.json` einen Eintrag ergänzen:
   ```json
   { "id": "kennung", "title": "Name", "description": "Ein Satz", "players": "2–4 Spieler", "color": "#58a8e2" }
   ```
3. Im Spiel steht `window.PLATFORM` bereit: `user`, `name`, `game`, `api`, `home`, `csrf`.
   Für Online-Spiele die Raum-Schnittstelle `api.php` nutzen:

   | Aufruf | Zweck |
   |---|---|
   | `GET api.php?a=rooms&game=<id>` | offene Räume des Spiels |
   | `POST api.php?a=create` `{game, state, meta}` | Raum anlegen → `{id, version}` |
   | `GET api.php?a=get&id=<id>&since=<version>` | Spielstand abholen (`changed: false`, wenn unverändert) |
   | `POST api.php?a=put` `{id, version, state, meta}` | Spielstand speichern; bei veralteter Version Antwort 409 mit aktuellem Stand |
   | `POST api.php?a=delete` `{id}` | Raum schließen (nur wer ihn eröffnet hat) |

   POST-Aufrufe brauchen den Header `X-CSRF-Token: PLATFORM.csrf`. `meta` ist
   `{title, status, players[], open}` und wird nur für die Raumliste genutzt.

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
games/         Spiele (gesperrt, nur über play.php erreichbar)
assets/        Gestaltung und Schriften
```
