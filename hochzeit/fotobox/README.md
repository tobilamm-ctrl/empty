# Fotobox für die Hochzeit

## 1. Was ist das?

Die Fotobox ist ein kleines Programm. Es läuft auf einem Mini-PC mit Windows und braucht kein Internet, nur das eigene WLAN. Der Mini-PC steuert alles: Kamera, Drucker, Speicher und den Ablauf. Die Geräte zeigen nur an:

- **iPad**: Bedienung für die Gäste (Foto machen, auswählen, drucken)
- **großer Bildschirm**: Bühne mit Countdown, Livebild und Diashow
- **Handy**: Service für dich oder einen Helfer (Papier, Störungen, Fotos, Einstellungen)

Diese Anleitung ist für dich geschrieben. Du musst nicht programmieren können.

Wichtig: Einige Teile sind noch nicht mit der echten Hardware getestet. Sie sind im Text mit „(noch nicht mit echter Hardware getestet)“ markiert. Das betrifft vor allem die Kamera (digiCamControl) und das Drucken (SumatraPDF).

## 2. Ausprobieren ohne Hardware

Du kannst die Fotobox am eigenen Laptop ausprobieren. Kamera und Drucker sind dann nur simuliert. Es werden keine echten Fotos gemacht und nichts gedruckt.

### Schritt für Schritt

Am einfachsten geht es mit dem fertigen Paket **Fotobox-Windows.zip**. Darin ist Node.js schon eingebaut. Du musst nichts installieren und brauchst kein Internet.

1. Entpacke `Fotobox-Windows.zip`, z. B. nach `C:\Hochzeit\`. (Rechtsklick → „Alle extrahieren“.)
2. Doppelklick auf **Fotobox-starten.bat**. Ein schwarzes Fenster öffnet sich, darin stehen die Adressen für alle Seiten. Lass das Fenster offen, solange die Fotobox laufen soll.
3. Beim ersten Start fragt Windows eventuell, ob die App „node“ ins Netzwerk darf. Wähle „Zulassen“ für private Netzwerke, sonst kann das iPad den Mini-PC nicht erreichen. Warnt Windows beim Doppelklick („Der Computer wurde durch Windows geschützt“), klicke auf „Weitere Informationen“ → „Trotzdem ausführen“.
4. Doppelklick auf **Simulator-oeffnen.bat**, oder öffne im Browser `http://localhost:8080/simulator`. Dort stehen der große Bildschirm und das iPad nebeneinander. Du bedienst das iPad mit der Maus, der große Bildschirm reagiert gleichzeitig. Darunter ist ein roter Knopf, der den Bluetooth-Knopf spielt, und ein Link zur Service-Seite.

Du kannst auch `http://localhost:8080/ipad` und `http://localhost:8080/buehne` in zwei eigenen Fenstern öffnen.

### Bluetooth-Knopf testen

- Drücke im Simulator den roten Knopf. Oder klicke in die Seite `/simulator`, `/ipad` oder `/buehne`.
- Drücke die **Eingabetaste** (Enter). Der Countdown startet.
- Die **Leertaste** wirkt genauso.

### Service-Seite ausprobieren

1. Öffne `http://localhost:8080/service`.
2. Gib die PIN ein. Standard ist **2580** (steht in `config.json`); du kannst sie auf der Service-Seite ändern.
3. Im Abschnitt „Simulator“ kannst du Störungen auslösen:
   - „Kamera stören“ und „Kamera wieder ok“
   - „Papierstau Selphy 1“ und „Papierstau Selphy 2“. Der Papierstau wirkt beim nächsten Druck.

Zum Beenden der Fotobox drückst du im Terminal **Strg + C**.

## 3. Die Seiten

| Adresse | Wer nutzt sie | Auf welchem Gerät |
|---|---|---|
| `/ipad` | Gäste: Modus wählen, Foto machen, drucken | iPad, im Vollbild (siehe Abschnitt 4) |
| `/buehne` | Gäste im Saal: Countdown, Livebild, Diashow, fertiges Foto | großer Bildschirm oder Fernseher am Mini-PC, im Vollbild |
| `/service` | Brautpaar oder Helfer: Papierstand, Störungen, Einstellungen, Import, Fotos, Protokoll | Handy im Fotobox-WLAN, oder der Mini-PC |
| `/simulator` | Ausprobieren ohne Hardware (siehe Abschnitt 2) | Laptop |

Die Startseite `http://<IP>:8080/` leitet auf `/ipad` weiter.

## 4. Einrichtung am Mini-PC für die Hochzeit

Gehe die Schritte in dieser Reihenfolge durch. Entpacke auf dem Mini-PC das Paket `Fotobox-Windows.zip` genauso wie in Abschnitt 2. Eine eigene Installation von Node.js ist nicht nötig.

### 4.1 Eigene Einstellungen in `config.local.json`

Die Datei `config.json` enthält die Grundeinstellungen. Ändere sie nicht. Lege stattdessen im selben Ordner die Datei `config.local.json` an. Ihre Werte überschreiben die Werte aus `config.json`. Die Datei ist nur für den Mini-PC gedacht.

Ein Beispiel:

```json
{
  "pin": "4711",
  "kamera": {
    "art": "digicamcontrol",
    "digicamcontrol": {
      "url": "http://localhost:5513",
      "ordner": "C:\\Fotobox\\kamera"
    }
  },
  "drucker": {
    "art": "windows",
    "namen": ["Canon SELPHY CP1500", "Canon SELPHY CP1500 (Kopie 1)"],
    "sumatra": "C:\\Program Files\\SumatraPDF\\SumatraPDF.exe"
  },
  "sicherungsOrdner": "E:\\"
}
```

Was die Werte bedeuten:

- `pin`: Die PIN für die Service-Seite. Wähle eine eigene.
- `kamera.art`: `"digicamcontrol"` nutzt die echte Kamera. Ohne diesen Eintrag läuft der Simulator.
- `kamera.digicamcontrol.ordner`: Der Ordner, in dem digiCamControl die Fotos speichert. Er muss genau so in digiCamControl eingestellt sein (siehe Abschnitt 5).
- `drucker.art`: `"windows"` druckt auf den echten Druckern. Ohne diesen Eintrag läuft der Simulator.
- `drucker.namen`: Die genauen Namen der Drucker in Windows. Jeder Eintrag ist ein Drucker (siehe Abschnitt 6).
- `drucker.sumatra`: Der Pfad zu SumatraPDF.exe.
- `sicherungsOrdner`: Ein Ordner für die Sicherungskopien, z. B. ein USB-Stick mit dem Laufwerksbuchstaben `E:\`. Leer lassen heißt: keine Sicherung.

Wichtig beim Schreiben:

- Windows braucht in Pfaden doppelte Backslashes: `C:\\Fotobox\\kamera`.
- Zwischen den Einträgen steht ein Komma, beim letzten Eintrag nicht.
- In dieser Datei dürfen keine Kommentare stehen.

So werden die Werte zusammengeführt:

- Einzelne Werte ersetzen die Werte aus `config.json`.
- Die Blöcke `kamera`, `drucker`, `zeiten` und `knopf` werden eine Ebene tief zusammengeführt. Du musst also nur die Werte angeben, die du ändern willst.
- Ein Block **in** einem solchen Block, etwa `kamera.digicamcontrol`, wird dagegen ganz ersetzt. Gib deshalb `url` und `ordner` immer beide an.
- Listen wie `drucker.namen` werden ganz ersetzt.

### 4.2 Feste IP-Adresse für den Mini-PC

Die Geräte finden den Mini-PC über seine IP-Adresse. Diese darf sich nicht ändern.

1. Öffne die Eingabeaufforderung auf dem Mini-PC und gib `ipconfig` ein. Notiere die IPv4-Adresse, z. B. `192.168.8.10`.
2. Öffne die Einstellungen deines WLAN-Routers (meist im Browser unter `192.168.8.1` oder über die App des Herstellers).
3. Suche den Bereich „DHCP-Reservierung“ oder „feste Adresse“ und trage den Mini-PC mit dieser IP-Adresse ein.
4. Starte den Mini-PC neu und prüfe, ob die IP-Adresse noch gleich ist.

Ab jetzt gilt:

- iPad: `http://192.168.8.10:8080/ipad`
- Handy: `http://192.168.8.10:8080/service`
- Bühne: `http://localhost:8080/buehne` (auf dem Mini-PC selbst)

Beim Start schreibt das Programm alle IP-Adressen ins Terminal.

### 4.3 Autostart und großer Bildschirm

Die Fotobox soll nach einem Neustart allein starten.

1. Drücke **Windows-Taste + R**, gib `shell:startup` ein und bestätige. Der Autostart-Ordner öffnet sich.
2. Ziehe **Fotobox-starten.bat** mit gedrückter **Alt-Taste** in den Autostart-Ordner. So entsteht eine Verknüpfung (die Datei selbst bleibt im Fotobox-Ordner).
3. Mach dasselbe mit **Grosser-Bildschirm-Vollbild.bat**. Sie wartet, bis die Fotobox läuft, und öffnet dann die Bühne im Vollbild mit Microsoft Edge (ist bei Windows dabei).

Hinweise:

- Bricht die Verbindung später ab (z. B. weil das Fotobox-Fenster geschlossen wurde), zeigt die Bühne oben einen roten Hinweis „Verbindung zur Fotobox unterbrochen“. Sobald die Fotobox wieder läuft, verbindet sich die Seite von allein neu.
- Im Kiosk-Modus gibt es keine Adressleiste. Zum Beenden drückst du **Alt + F4**.

### 4.4 iPad einrichten

1. Verbinde das iPad mit dem Fotobox-WLAN.
2. Öffne in Safari die Adresse `http://192.168.8.10:8080/ipad` (mit deiner IP-Adresse).
3. Tippe auf das Teilen-Symbol und dann auf **„Zum Home-Bildschirm“**. Ab jetzt öffnest du die Fotobox über das Symbol. Sie läuft dann im Vollbild.
4. Stelle die automatische Sperre auf „Nie“: Einstellungen → Anzeige & Helligkeit → Automatische Sperre.
5. Schalte den **Geführten Zugriff** ein: Einstellungen → Bedienungshilfen → Geführter Zugriff. Lege einen Code fest.
6. Öffne die Fotobox über das Symbol. Drücke dreimal die seitliche Taste (bei iPads mit Home-Taste: die Home-Taste). Tippe auf „Starten“.

Jetzt können die Gäste die Seite nicht verlassen. Zum Beenden drückst du wieder dreimal die Taste und gibst den Code ein. Das iPad am Ladekabel lassen.

### 4.5 Windows vorbereiten

- **Updates pausieren**: Einstellungen → Windows Update → Updates für einige Wochen pausieren. Die Pause muss die Hochzeit umfassen.
- **Energiesparen aus**: Einstellungen → System → Netzbetrieb und Energie. Bildschirm und Schlafen auf „Nie“ stellen. Den Ruhezustand ausschalten.
- **Automatische Anmeldung**: Drücke **Windows-Taste + R**, gib `netplwiz` ein. Entferne den Haken bei „Benutzer müssen ihren Benutzernamen und ihr Kennwort eingeben“. Gib das Kennwort einmal ein.
- **Probelauf**: Starte den Mini-PC neu. Prüfe, ob der Server und die Bühne ohne Zutun starten. Prüfe dann, ob das iPad und das Handy den Server erreichen.

## 5. Kamera einrichten (digiCamControl) (noch nicht mit echter Hardware getestet)

Die Kamera ist eine Canon EOS 200D. Die Fotobox spricht mit dem kostenlosen Programm **digiCamControl** (digicamcontrol.com). Das Programm läuft auf dem Mini-PC.

1. Installiere digiCamControl auf dem Mini-PC.
2. Schalte die Kamera ein und verbinde sie per USB mit dem Mini-PC.
3. Öffne in digiCamControl die **Einstellungen** und dann den Bereich **Webserver**. Schalte den Webserver ein. Der Port ist **5513**. Die Fotobox erwartet genau diesen Port.
4. Stelle im Hauptfenster von digiCamControl den Ordner für die Fotos (Session-Ordner) auf `C:\Fotobox\kamera`. Dieser Ordner muss zu `kamera.digicamcontrol.ordner` in `config.local.json` passen.
5. Der Ordner ist nur für die Fotobox da. Die Fotobox nimmt jeweils das neueste JPG aus diesem Ordner.
6. Schalte an der Kamera die automatische Abschaltung aus.
7. Betreibe die Kamera über ein Netzteil mit einer Akku-Attrappe (Dummy für den Akku LP-E17). So geht der Akku nicht mitten in der Feier leer.
8. Die Fotobox öffnet beim Start das Livebild-Fenster in digiCamControl. Lass es offen.
9. Ändere in `config.local.json` den Eintrag `kamera.art` auf `"digicamcontrol"`. Siehe das Beispiel in Abschnitt 4.1.
10. Teste:
    - Starte den Server neu. Öffne `/buehne`. Dort sollte das Livebild der Kamera erscheinen.
    - Starte auf dem iPad einen Durchlauf. Der Countdown läuft, und die Vorschau zeigt das Foto.
    - Prüfe, ob im Ordner `C:\Fotobox\kamera` neue Dateien liegen.

Wenn die Kamera nicht auslöst, erscheint auf dem iPad eine Störungsmeldung. Die Hilfe dazu steht in Abschnitt 10.

## 6. Drucker einrichten (SELPHY) (noch nicht mit echter Hardware getestet)

Die Fotobox hat zwei Canon SELPHY CP1500. Die beiden Drucker drucken abwechselnd.

1. Installiere den Treiber **Canon SELPHY CP1500** für Windows von der Canon-Webseite. Verbinde beide Drucker per USB. Installiere den Treiber für beide.
2. Öffne die Druckerliste: Einstellungen → Drucker & Scanner (Windows 11: Bluetooth und Geräte → Drucker & Scanner). Notiere die **genauen Namen** der beiden Drucker. Sie müssen in `drucker.namen` genau so stehen, mit Groß- und Kleinschreibung und Leerzeichen.
3. Stelle das Papierformat ein. Öffne die **Druckeinstellungen** des Druckers und wähle **10 × 15 cm** (Postkarte) mit **randlos**. Speichere das als **Standard**. Die Fotobox druckt mit den Standardeinstellungen des Druckers. Wenn dort etwas anderes steht, druckt sie falsch.
4. Installiere **SumatraPDF** von sumatrapdfreader.org. Der Standardpfad ist `C:\Program Files\SumatraPDF\SumatraPDF.exe`. Trage ihn in `drucker.sumatra` ein, wenn er bei dir anders ist.
4a. Wie das Druckbild aussieht, stellst du auf der Service-Seite unter **Druckbild** ein: „mit hellem Rand, Namen darunter“ oder „Vollbild, Namen auf dem Foto“. Beim Vollbild schneidet der Drucker an den Kanten ein paar Millimeter ab; Namen und Datum haben deshalb genug Abstand zum Rand.
5. Teste zuerst von Hand. Öffne ein JPG-Foto mit der Windows-Fotoanzeige, wähle „Drucken“, dann den SELPHY, 10 × 15 cm, randlos. Das Bild sollte das Papier ganz ausfüllen.
6. Erst dann teste mit der Fotobox: Nimm ein Foto auf und drucke es auf dem iPad.

### Papierzähler

Der SELPHY meldet der Fotobox nicht, wie viel Papier noch drin ist. Deshalb zählt die Software selbst mit:

- Jede Kassette gilt als voll mit **18 Blatt** (Einstellung `drucker.kassette`).
- Jeder Abzug zieht ein Blatt ab.
- Der Stand steht auf der Service-Seite, z. B. „18 / 18 Blatt“.

Du musst also nach jedem Kassetten-Tausch etwas tun: Öffne die Service-Seite am Handy und drücke bei dem Drucker **„Kassette getauscht“**. Erst dann stimmt die Zahl wieder. Ist der Stand auf null, kann niemand mehr drucken, bis die Kassette getauscht ist.

Ein Druck dauert etwa 45 Sekunden (Einstellung `drucker.druckDauerSek`). Dieser Wert steuert nur den Fortschrittsbalken auf dem iPad.

## 7. Bluetooth-Knopf

Der Bluetooth-Knopf wird wie eine Tastatur gekoppelt. Er schickt Tastendrücke. Die Fotobox reagiert auf diese Tasten.

- **Koppeln**: Am besten koppelst du den Knopf mit dem **Mini-PC**. Schalte den Knopf in den Kopplungsmodus und wähle ihn unter Einstellungen → Bluetooth und Geräte.
- **Welche Tasten zählen**: Die Liste steht in `knopf.tasten` in der Datei `config.json`. Standard sind Enter, Leertaste, Bild auf, Bild ab, Pfeil rechts, Pfeil unten, Lautstärke plus und minus und F13.
- **Fokus auf der Bühne**: Die Seite `/buehne` muss den Tastatur-Fokus haben. Das ist im Kiosk-Modus meist der Fall. Wenn nicht, erscheint unten rechts auf dem großen Bildschirm der Hinweis „Für den Bluetooth-Knopf einmal hier hineinklicken“. Ein Klick genügt.
- **Sperre**: Nach einem Knopfdruck nimmt die Fotobox den nächsten erst nach 1,5 Sekunden an (Einstellung `knopf.sperreMs`). So löst ein doppelter Druck nicht zwei Fotos aus.

Was der Knopf auf den einzelnen Seiten tut:

| Ansicht am iPad | Wirkung des Knopfes |
|---|---|
| Start | Startet sofort den Countdown. Einzelfoto oder Streifen und Farbe oder Schwarzweiß kommen aus den Einstellungen „Bluetooth-Knopf macht“. |
| Modus (Einzelfoto oder Streifen) | Startet den Countdown mit der Einstellung „Bluetooth-Knopf macht“. |
| Filter (Farbe oder Schwarzweiß) | Startet den Countdown mit dem Filter aus den Einstellungen. |
| alle anderen Ansichten | keine Wirkung |

Die Einstellung „Bluetooth-Knopf macht“ findest du auf der Service-Seite unter „Ablauf“.

**Knopf anlernen**: Schickt dein Knopf eine Taste, die nicht in der Liste steht, tippe auf der Service-Seite unter „Bluetooth-Knopf“ auf **Knopf anlernen** und drücke innerhalb von 20 Sekunden den Knopf. Die Fotobox merkt sich die Taste. Der Knopf muss dafür mit dem Mini-PC (großer Bildschirm) oder dem iPad gekoppelt sein.

Hinweis: Wenn der Knopf mit dem **iPad** gekoppelt ist, kommen die Lautstärke-Tasten meist nicht bei Safari an. Nimm dann die Taste Enter oder Leertaste des Knopfes. Oder koppelt den Knopf mit dem Mini-PC.

## 8. Gestaltung wie die Einladungen

Die Fotobox kann dieselben Farben und Schriften wie die Einladungen zeigen. Dazu nutzt du die Datei aus dem Sitzplantool.

### Import aus dem Sitzplantool

1. Exportiere im Sitzplantool die Datei mit Endung `sitzplan.json`: Datei → Speichern.
2. Öffne auf dem Handy die Service-Seite und gib die PIN ein.
3. Wähle im Abschnitt „Aus dem Sitzplantool übernehmen“ die Datei aus und drücke **Übernehmen**.

Übernommen werden:

- die Gästeliste mit Namen und Tisch. Eine neue Liste ersetzt die alte.
- Namen des Brautpaares und Datum
- Farbwelt, Akzentfarbe und Schriftstil
- eigene Schriften aus dem Karten-Editor

Nicht übernommen werden der Ort und das Monogramm (das Monogramm am iPad bildet die Fotobox selbst aus den Anfangsbuchstaben der Namen). Die Gästeliste mit Tischen wird gespeichert und ist für spätere Funktionen wie Tisch-Aufgaben gedacht. Im Moment zeigt die Fotobox nur, wie viele Gäste übernommen wurden.

### Ohne Import

Stelle die Gestaltung auf der Service-Seite unter „Gestaltung“ von Hand ein:

- **Farbwelt**: zehn Auswahlmöglichkeiten, z. B. „Champagner & Gold“ oder „Salbei & Eukalyptus“
- **Akzentfarbe**: leer lassen, dann gilt die Farbe der Farbwelt. Oder eine eigene Farbe wählen.
- **Schriftstil**: klassisch, romantisch (Schreibschrift für die Namen) oder modern
- **Schrift für die Namen**

Die Änderungen gelten sofort für iPad und Bühne. Neue Fotos bekommen den neuen Rahmen.

### Alle Einstellungen auf der Service-Seite

Jeder Abschnitt hat einen eigenen Knopf **Speichern**. Änderungen gelten sofort.

**Jetzt**
- **Pause**: Die Fotobox zeigt nur noch die Diashow und den Pausentext, z. B. während der Reden oder der Torte. Ein Foto, das gerade läuft, wird noch fertig. Mit „Pause beenden“ geht es weiter.
- **Zurück zum Start**: bricht ab, falls am iPad etwas hängt.

**Drucker**
- **Kassette getauscht**, **Fehler behoben**
- **Abschalten / Einschalten**: Ein abgeschalteter Drucker bekommt nichts mehr, wartende Abzüge gehen an den anderen.

**Ablauf**
- **Countdown**: 3, 5 oder 10 Sekunden
- **Zurück zum Start ohne Eingabe nach** 30 Sekunden bis 2 Minuten
- **„Nochmal“ höchstens**, **Fotostreifen anbieten**, **Schwarzweiß anbieten**
- **Bluetooth-Knopf macht**: Einzelfoto oder Streifen, Farbe oder Schwarzweiß
- **Geöffnet ab / bis**: Außerhalb dieser Zeit zeigt die Fotobox die Diashow und „Die Fotobox öffnet um …“ bzw. „hat jetzt geschlossen“. Über Mitternacht geht auch (z. B. 19:00 bis 03:00). Nur „ab“ eingetragen: offen bis 5 Uhr morgens.

**Drucken**
- **Drucken an/aus**: Aus heißt, die Fotos werden nur gespeichert und gezeigt, z. B. spät in der Nacht.
- **Abzüge pro Foto höchstens** und **Abzüge insgesamt höchstens** (0 = ohne Grenze). Ist die Grenze erreicht, druckt die Fotobox nicht mehr.
- **Druckbild**: mit hellem Rand oder Vollbild
- **Logo/Monogramm statt der Namen drucken** (Bild im Abschnitt „Logo oder Monogramm“ hochladen, am besten PNG mit durchsichtigem Hintergrund)
- **Feinkorrektur** waagerecht und senkrecht in Millimetern (−5 bis +5), falls der Drucker schief abschneidet. Sie wirkt nur auf den Druck.

**Gestaltung**: Namen, Datum, Farbwelt, Akzentfarbe, Schriftstil, Schrift für die Namen, **Livebild spiegeln**

**Texte**: Überschrift und Hinweis am iPad, Hinweis auf dem großen Bildschirm, Pausentext, Danke-Texte

**Diashow**
- **Neue Fotos erscheinen** sofort oder nach 1, 2 oder 5 Minuten
- **Jedes Foto zeigen für** 3 bis 12 Sekunden
- **Nur freigegebene Fotos zeigen**: Dann erscheint ein Foto erst, wenn ihr es unten bei „Fotos“ mit **Freigeben** bestätigt.

**Bluetooth-Knopf**: Knopf anlernen (siehe Abschnitt 7)

**Speicherplatz und Sicherung**: freier Platz für die Fotos und auf dem USB-Stick. Ein roter Punkt heißt: Sicherung nicht erreichbar.

**PIN ändern**: 4 bis 8 Ziffern. Die neue PIN gilt sofort, die alte aus `config.json` dann nicht mehr. PIN vergessen? Fotobox beenden, in `daten/einstellungen.json` die Zeile mit `"pin"` auf `"pin": ""` setzen und neu starten – dann gilt wieder die PIN aus `config.json`.

## 9. Wo liegen die Fotos?

Alles liegt im Ordner `daten` im Ordner der Fotobox. Den Ordner legt das Programm beim ersten Start an. Lösche ihn während der Feier nicht.

```
fotobox/
  daten/
    einstellungen.json     Namen, Datum, Gestaltung, Einstellungen
    fotos.json             Liste aller Fotos mit Zeit, Modus und Status
    gaeste.json            die Gästeliste aus dem Import
    drucker.json           Papierstand der Drucker
    protokoll.txt          Protokoll aller Ereignisse
    schriften/             eigene Schriften aus dem Import
    fotos/
      2027-06-14_18-30-05_einzel/
        aufnahme-1.jpg     die Aufnahme der Kamera
        druck.jpg          das fertige Bild für den Druck
      2027-06-14_18-41-12_streifen/
        aufnahme-1.jpg … aufnahme-4.jpg
        druck.jpg
```

Der Name jedes Foto-Ordners ist Datum, Uhrzeit und Modus.

### Sicherung auf dem USB-Stick

Ist `sicherungsOrdner` gesetzt, kopiert die Fotobox jedes neue Foto sofort dorthin. Die Kopie liegt in `<Sicherungsordner>\fotobox-sicherung\<Foto-Ordner>\`. Ist der Stick nicht eingesteckt, steht eine Warnung im Protokoll.

Nur neue Fotos werden kopiert. Änderungen später, etwa Ausblenden, werden nicht nachkopiert.

### Export als ZIP

Auf der Service-Seite drückst du **„Alle Fotos als ZIP“**. Die Datei heißt `fotobox-fotos.zip`. Sie enthält:

- `druckbilder/`: ein Bild je behaltenem Foto
- `aufnahmen/`: alle Einzelaufnahmen der behaltenen Fotos

Kopiere die ZIP-Datei nach der Feier auf einen zweiten Datenträger.

### Verworfene Fotos

Wer „Nochmal“ drückt, bekommt ein neues Foto. Das alte bleibt auf der Festplatte und auf dem Stick. Es wird aber nicht in die ZIP-Datei übernommen und nicht in der Diashow gezeigt.

## 10. Wenn etwas hakt

- **Roter Hinweis „Verbindung zur Fotobox unterbrochen“** oben auf dem iPad oder der Bühne. Der Server läuft nicht, oder das WLAN ist weg. Prüfe das Terminal-Fenster auf dem Mini-PC und das WLAN. Ist der Server wieder da, verbindet sich die Seite von allein.
- **Störungsseite „Die Kamera hat nicht ausgelöst“** auf dem iPad. Prüfe, ob die Kamera an und per USB verbunden ist. Prüfe, ob digiCamControl läuft und der Webserver an ist (Port 5513). Das Livebild-Fenster muss offen sein. Danach tippe auf „Zurück zum Start“. Tippt niemand etwas, geht die Anzeige nach etwa 45 Sekunden ebenfalls zurück zum Start.
- **Drucker-Störung**: Auf der Service-Seite steht bei dem Drucker „Störung“ mit einer Meldung, z. B. Papierstau. Behebe die Ursache am Drucker. Drücke dann **„Fehler behoben“**. Der Auftrag geht an den anderen Drucker, wenn der Papier hat. Wenn beide ausfallen, wartet der Auftrag, bis du den Fehler behoben hast.
- **Knopf reagiert nicht**: Klicke auf der Bühne einmal ins Fenster. Prüfe, ob der Knopf mit dem Mini-PC gekoppelt ist. Prüfe, ob die Taste des Knopfes in `knopf.tasten` steht. Warte 1,5 Sekunden zwischen zwei Drücken. Der Knopf wirkt nur auf den Ansichten Start, Modus und Filter.
- **Druck bleibt aus, Papier leer**: Auf der Service-Seite bei dem Drucker „Kassette getauscht“ drücken, nachdem du die Kassette gewechselt hast.
- **Die Ursache steht im Protokoll**: Auf der Service-Seite unter „Protokoll“ stehen die letzten 30 Einträge. Die vollständige Liste steht in der Datei `daten/protokoll.txt`. Einträge mit „fehler“ oder „warnung“ sind wichtig. Schicke diese Zeilen, wenn du Hilfe brauchst.

## 11. Für Entwickler

Die Ordner und Dateien im Überblick:

- `config.json`: Grundeinstellungen. `config.local.json` (wird von dir angelegt, nicht im Git-Archiv) überschreibt sie.
- `server/index.js`: startet alles, liefert die Seiten aus, nimmt Befehle über WebSocket und HTTP entgegen.
- `server/ablauf.js`: der Ablauf der Fotobox als Zustandsautomat (Start, Modus, Filter, Aufnahme, Vorschau, Druck, Danke).
- `server/kamera/`: `digicamcontrol.js` (echte Kamera, noch nicht getestet) und `simulator.js` (Kamera-Simulation).
- `server/drucker/`: `treiber.js` (Simulator und SumatraPDF) und `verwaltung.js` (Verteilung, Papierzähler).
- `server/speicher.js`: schreibt die Dateien in `daten/`, Sicherung und ZIP-Export.
- `server/import.js`: liest die Sitzplan-Datei.
- `server/gestaltung.js`, `server/bild.js`, `server/szene.js`, `server/zip.js`: Farben, Druckbild, Simulator-Szene, ZIP-Datei.
- `web/`: die Seiten `ipad.html`, `buehne.html`, `service.html`, `simulator.html`, `app.css` und `verbindung.js` (Verbindung und Bluetooth-Knopf).
- `tools/`: automatische Tests (`test-ablauf.js`, `test-drucker.js`, `test-import.js`, `test-server.js`, `test-zip.js`) und `alle-tests.js`.
- `schriften/`: Schriftdateien (woff2) von Cormorant Garamond, Great Vibes, Josefin Sans und Montserrat. Jede Schrift hat eine Lizenzdatei `LICENSE-*.txt` (SIL Open Font License 1.1).

Zum Entwickeln: Node.js ab Version 18, `npm install`, `npm start`. Die Pakete sind `ws` und `@napi-rs/canvas` (siehe `package.json`).

Das fertige Paket mit eingebautem Node.js baut `node tools/paket.js` (Windows, Ergebnis `paket/Fotobox-Windows.zip`) bzw. `node tools/paket.js --linux` (zum Testen). Das braucht beim Bauen Internet und unter Linux/macOS `unzip` und `tar`. Die Node.js-Version steht oben in `tools/paket.js`, die heruntergeladene Datei wird mit der Prüfsumme von nodejs.org kontrolliert.

Die Tests startest du mit `npm test`. Er ruft `tools/alle-tests.js` auf und braucht weder Kamera noch Drucker.
