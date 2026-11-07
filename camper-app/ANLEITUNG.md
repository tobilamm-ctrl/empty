# LAMMping – Einrichtung

LAMMping ist eine Web-App für euren Minicamper: Karte mit Reiseroute, Tagebuch mit
Stellplätzen und Sehenswertem, Auto-Standort, Einkaufs- und Merkliste, Boxen-Inventar mit
Packliste, Kassenbuch und ein Archiv aller Reisen. Alles läuft auf eurem eigenen Webspace,
eure Daten und Fotos bleiben dort.

## Voraussetzungen

- Webspace mit **PHP 8** und der PHP-Erweiterung **pdo_sqlite** (bei Hetzner-Webhosting
  Standard). Alternativ geht eine MySQL-Datenbank.
- **HTTPS** für die Domain. Ohne HTTPS funktionieren GPS und die Offline-Funktion nicht.
  In der konsoleH: Domain → SSL-Manager → Let's-Encrypt-Zertifikat aktivieren.

## 1. Einrichtungscode festlegen

In `api/config.php` die Zeile

```php
'setup_code' => 'bitte-aendern',
```

auf einen eigenen Code ändern, z. B. `'setup_code' => 'Gardasee-2027',`. Der Code wird nur
einmal bei der Ersteinrichtung gebraucht und verhindert, dass jemand anderes sich vor euch
zum Verwalter macht.

## 2. Hochladen

1. Den **Inhalt** des Ordners per SFTP (z. B. mit FileZilla) in einen Ordner auf dem
   Webspace kopieren, z. B. `public_html/lammping`. Die versteckten Dateien `.htaccess`
   (auch die in `api/data/`) müssen mit (in FileZilla: Server → Versteckte Dateien anzeigen).
2. Der Ordner `api/data` muss für PHP **beschreibbar** sein. Dort landen die Datenbank
   (`lammping.sqlite`) und die Fotos. Bei Hetzner passt das meist von selbst; sonst in
   FileZilla Rechtsklick → Dateiberechtigungen → 755 (oder 775).
3. Prüfen, dass die Daten geschützt sind: `https://eure-domain.de/lammping/api/data/`
   muss „Forbidden“ zeigen.

## 3. Ersteinrichtung

1. `https://eure-domain.de/lammping/` öffnen.
2. Einrichtungscode, Name der Crew (z. B. „Familie“), deinen Namen, Anmeldenamen und
   Passwort eingeben → **Einrichten**. Du bist jetzt Verwalter.
3. Einstellungen (Zahnrad) → **Personen und Crews verwalten** → für jede Person
   **+ Person**. Wer Konten verwalten soll (z. B. der andere Elternteil), bekommt
   „Verwalter“. Neue Personen werden gleich in die geöffnete Crew aufgenommen.
4. In der Crew festlegen, wer **mitzahlt**: Nur diese Personen werden in der Kasse bei
   geteilten Ausgaben berücksichtigt. Kinder stehen standardmäßig auf „zahlt nicht mit“.

## 4. Als App installieren

LAMMping lässt sich wie eine normale App mit dem Schaf als Symbol auf den Startbildschirm legen.
Sie startet dann ohne Browserleiste und funktioniert auch offline.

- **Android (Chrome):** Die App bietet selbst „Installieren“ an (Hinweis im Tagebuch und in
  den Einstellungen unter „App installieren“). Alternativ Menü ⋮ → „App installieren“.
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“. Die App zeigt diesen Hinweis
  einmal im Tagebuch an.

## Kinderkonten

In der Verwaltung bei einer Person unter **„Was sieht …?“** festlegen, welche Reiter, Bereiche und Spiele
sie sieht. „Kinder-Vorschlag“ setzt eine sinnvolle Auswahl. Mit **„Einfache Ansicht“** startet das Konto auf
einer eigenen Seite mit großen Kacheln statt „Mehr“. Auch die Startseite lässt sich hier vorgeben. Jede
Person kann ihre Startseite selbst unter Einstellungen → Startseite ändern.

Die Freigaben sorgen für Übersicht, sie sind keine Sperre: Kasse, Tankbuch und Dokumente schützt zusätzlich
der Server, alles andere liegt als Kopie der Crew-Daten auf dem Handy.

Beim ersten Start zeigt LAMMping jeder Person eine kurze Einführung (wieder abrufbar in den Einstellungen).

## Crews

Eine Crew ist eine gemeinsame Datensammlung mit eigenen Reisen, Listen, Boxen und eigener
Kasse. Beispiele:

- **Familie:** alle zusammen, die Kinder sehen und schreiben mit.
- **Lenas Touren:** eine eigene Crew für ein Kind, z. B. für Ausflüge mit Freunden.

Wer in mehreren Crews ist, wechselt in den Einstellungen.

## Offline und Abgleich

Jedes Handy hat eine vollständige Kopie der Crew-Daten. Ohne Netz könnt ihr ganz normal
weiterschreiben; die Änderungen werden gesammelt und übertragen, sobald wieder Netz da ist.
Ein gelber Punkt am Zahnrad zeigt wartende Änderungen, ein roter ein Problem (Details in den
Einstellungen unter „Abgleich“). Bei geöffneter App gleicht sie etwa alle 15 Sekunden ab.

Ändern zwei Personen gleichzeitig **denselben** Eintrag, gilt die zuletzt übertragene Fassung.

## Updates einspielen

Jede Lieferung heißt `lammping-komplett-NN.zip` mit fortlaufender Nummer. Dieselbe Nummer steht unten in den
Einstellungen („Version NN“) – so seht ihr, ob das Handy schon die neueste Version hat.

**Wichtig:** Immer auch `api/index.php` mit hochladen. Ist sie veraltet, meldet die App Verwaltern
„Der Server-Teil ist veraltet“, und neue Funktionen wie Reiseblog, Sicherungen oder Kinder-Freigaben
antworten mit „Unbekannte Aktion“.

Neue Dateien hochladen, dabei **`api/config.php` und den Ordner `api/data` nicht
überschreiben**. In `sw.js` die Zeile `const VERSION = 'lammping-42'` hochzählen (z. B. auf `lammping-43`), damit die
Handys die neue Version laden.

## Sicherung

- **Automatisch:** Der Server legt einmal pro Woche selbst eine Sicherung der Datenbank in
  `api/data/sicherungen` an und hebt die letzten vier auf (Einstellungen → Automatische Sicherung, dort auch
  zum Herunterladen und „Jetzt sichern“). Gelöschte Fotos bleiben 30 Tage in `api/data/papierkorb`.
  Wiederherstellen: die Sicherungsdatei als `api/data/lammping.sqlite` einsetzen.

- **In der App:** Einstellungen → „Sicherung herunterladen“ speichert die Daten der
  geöffneten Crew samt Fotos in einer Datei.
- **Auf dem Server:** Den Ordner `api/data` per SFTP herunterladen. Darin steckt alles.

## MySQL statt SQLite (optional)

In der konsoleH eine Datenbank anlegen und in `api/config.php` die MySQL-Zeilen eintragen
(die SQLite-Zeilen dafür auskommentieren). Die Tabellen legt die App selbst an.

## Gut zu wissen

- **Handy zeigt eine alte Version:** Die Versionsnummer steht unten in den Einstellungen. Ab Version 33 fragt die App bei
  jedem Öffnen nach einer neuen Version, lädt sie selbst und meldet „LAMMping ist jetzt auf Version …“. Wichtig dafür ist
  die Datei `.htaccess` im App-Ordner: Sie beginnt mit einem Punkt und wird von manchen FTP-Programmen versteckt –
  beim Hochladen mitkopieren. Hängt ein Handy trotzdem fest: App ganz schließen (aus der Liste der offenen Apps
  wischen) und zweimal neu öffnen.
- **Fotos:** Die App verkleinert Fotos schon auf dem Handy auf Full HD (längste Seite 1920 Pixel, meist 0,4–0,8 MB).
  Das spart Datenvolumen und Platz in den Sicherungen; die Originale bleiben in der Galerie des Handys.
- **Impressum und Datenschutz:** Für eine rein private, passwortgeschützte Seite für die Familie ist kein
  Impressum nötig, und die DSGVO greift bei rein familiärer Nutzung nicht. Suchmaschinen sind über
  `robots.txt` und `noindex` ausgesperrt.
- **Route:** Die Linie auf der Karte verbindet eure Einträge mit Position in zeitlicher
  Reihenfolge. Eine lückenlose Aufzeichnung während der Fahrt kann eine Web-App nicht leisten.
  Geplant für Stufe 2: GPX-Import aus einer Tracking-App wie OsmAnd oder Komoot.
- **Ortsnamen** werden über OpenStreetMap (Nominatim) ermittelt, wenn ihr die aktuelle
  Position übernehmt. Die Karte selbst kommt ebenfalls von OpenStreetMap.
- **Anmeldung** bleibt auf jedem Handy gut ein Jahr bestehen. Nach 10 falschen Passwörtern
  ist die Anmeldung 15 Minuten gesperrt.

## Neu in Version 86: Mitglieder anderer Crews mit Namen

**Dafür die neue `api/index.php` hochladen.**

- **Verwaltung › Andere Crews** zeigt jetzt die Namen der Mitglieder statt nur der Anzahl. Crew-Leiter sind mit 👑 gekennzeichnet.
- **Im Reiter einer anderen Crew** (Tagebuch) und in deren Reiseansicht steht unter dem Reisenamen, wer zur Crew gehört, z. B. „👥 Anna 👑, Tobi 👑, Lena“.
  Im öffentlichen Reiseblog erscheinen keine Namen.

## Neu in Version 85: Karte zeigt die Reise der gewählten Crew

- Auf großen Bildschirmen steht die Karte neben dem Tagebuch. Ist oben im Tagebuch der Reiter einer anderen Crew gewählt,
  zeigt die Karte bei „Diese Reise“ jetzt deren Reise: Strecke, Stopps und Standort. Mit dem eigenen Reiter kommt eure Reise zurück.

## Neu in Version 84: Kommentare im Reiseblog und von anderen Crews

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen).

- **Ein gemeinsamer Verlauf je Eintrag.** Unter jedem Eintrag im Reiseblog und in der Reise einer Crew, der ihr folgt, steht „💬 Kommentieren“.
  Alle sehen denselben Verlauf: Blog-Leser, Crews, die folgen, und ihr selbst.
  - **Im Reiseblog** schreiben Leser ohne Konto. Ein Name ist Pflicht, z. B. „Oma Gerda (Reiseblog)“; das Gerät merkt ihn sich. Gegen Unfug gilt: höchstens 6 Kommentare je Gerät und Stunde.
  - **Andere Crews** kommentieren in der App, z. B. „Familie Franz (Anouk)“.
  - Wer kommentiert hat, kann den eigenen Kommentar wieder löschen.
- **Bei euch im Tagebuch.** Am Eintrag steht „💬 2 öffentlich“ mit gepunktetem Rand. Antippen öffnet den Eintrag.
  Dort stehen unter „Öffentliche Kommentare“ alle Kommentare aus Blog und von Crews.
  Ihr antwortet dort öffentlich (das sehen alle Leser) und könnt jeden Kommentar löschen.
  **Die Kommentare eurer Familie (💬 neben dem Herz) bleiben wie bisher privat.**
- **Mitteilung** bei neuen Kommentaren zu euren Einträgen („💬 Oma Gerda (Reiseblog) zu „Wasserfall““), höchstens eine je Eintrag und 10 Minuten.
  Sie läuft über Einstellungen › Mitteilungen › „👋 Andere Crews und Reiseblog“.
- **Abschalten** könnt ihr das je Reiseblog über dessen Einstellungen: „Leser dürfen kommentieren“.

## Neu in Version 83: Mitteilung führt direkt zum Eintrag

**Dafür die neue `api/index.php` hochladen.**

- Ein Tipp auf die Mitteilung „👋 Familie Franz: neuer Eintrag“ öffnet jetzt gleich den Reiter dieser Crew im Tagebuch.
  Die App springt zu genau diesem Eintrag und hebt ihn kurz hervor. Ist die Reise schon vorbei, öffnet sie sich als Fenster.

## Neu in Version 82: Länder im Reiseblog als Flaggen

- Im Kopf des Reiseblogs und der Reisen anderer Crews stehen die Länder jetzt nur noch als Flaggen nebeneinander, etwas größer und ohne das Wort „Länder“.

## Neu in Version 81: Eigener Reiter mit Crew-Namen, Fotos anderer Crews im Vollbild

- Der erste Reiter oben im Tagebuch heißt jetzt wie eure Crew (z. B. „🚐 Familie Lamm“) statt „Unsere Reise“.
- **Fotos anderer Crews groß ansehen.** In der Reise einer anderen Crew (Reiter im Tagebuch, Crews on the Road, Karte) öffnet ein Tipp auf ein Foto
  das Vollbild in voller Auflösung, mit Wischen zum nächsten Foto und Zoomen wie bei euren eigenen Fotos.

## Neu in Version 80: Reiter für die Reisen anderer Crews im Tagebuch, Karte im Reiseblog repariert

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen).

- **Reiter oben im Tagebuch.** Ist eine Crew unterwegs, der ihr folgt, stehen oben im Tagebuch Reiter:
  „🚐 Unsere Reise“ und je Crew „👋 Familie Franz“. Ein roter Punkt am Reiter zeigt neue Beiträge.
  Ein Tipp auf den Reiter lädt deren Reise direkt darunter, so wie sie im Reiseblog aussieht:
  Zahlen, Karte, Tage mit Highlights, Fotos, Sprachnotizen und Herzen. Mit „🚐 Unsere Reise“ geht es zurück zur eigenen Reise.
  Die schmalen Zeilen gibt es nur noch für Crews, denen ihr nicht folgt („folgen anfragen“), und für wartende Anfragen.
- **Foto zu einem Eintrag direkt im Tagebuch.** Unter jedem Eintrag öffnet **📷+** gleich die Kamera. Das Foto kommt in diesen Eintrag
  und landet wie beim Foto-Knopf auch in der Galerie des Handys. Daneben holt **🖼️+** ein oder mehrere Fotos aus der Galerie.
- **Gleiche Ansicht überall.** Auch über „Crews on the Road“ und über die Karte öffnen sich Reisen anderer Crews jetzt im Reiseblog-Aussehen.
- **Mitteilung bei neuen Beiträgen.** Schreibt eine Crew, der ihr folgt, einen neuen Eintrag in ihre laufende Reise, kommt „👋 Familie Franz: neuer Eintrag“.
  Höchstens eine Mitteilung je 20 Minuten und Crew. Geänderte und für den Reiseblog ausgeblendete Einträge melden nichts.
  Ein- und ausschalten unter Einstellungen › Mitteilungen › „👋 Andere Crews“.
- **Behoben: Karte im Reiseblog.** Statt der Karte erschien „Access blocked“ von OpenStreetMap.
  Die Blogseite hat dem Kartendienst keinerlei Herkunft mitgeschickt, und das verlangt OpenStreetMap inzwischen. Jetzt schickt sie die Adresse der Webseite mit, ohne Pfad.
  Der geheime Blog-Schlüssel hinter dem # wird dabei nie mitgeschickt.

## Neu in Version 79: Crews on the Road wie im Reiseblog

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen).

- **Alle Reisen einer Crew.** Unter **Mehr › Crews on the Road** stehen bei jeder Crew, der ihr folgt, ihre Reisen: die laufende und die 3 neuesten,
  der Rest unter „… ältere Reisen zeigen“. Jede Reise öffnet sich wie beim Live-Verfolgen, mit Karte, Einträgen und Fotos.
  Unter der Reise steht „Weitere Reisen von …“.
- **Herzen, Sprachnotizen und Highlights.**
  - Wie im Reiseblog gebt ihr Einträgen anderer Crews ein Herz, eines je Person.
  - Sprachnotizen lassen sich anhören, die Highlights des Tages stehen über dem Tag.
  - Die andere Crew sieht die Herzen im Tagebuch am Eintrag, z. B. „❤️ Familie Franz“ mit gepunktetem Rand. Das unterscheidet sie von euren eigenen Herzen und denen aus dem Reiseblog.
  - Kommentare gibt es hier bewusst nicht.
- **Für andere Crews sichtbar?** Im Reise-Formular steht der Schalter „Für andere Crews sichtbar“.
  - Er ist für alle Reisen vorbelegt, auch für vergangene. Ausgeschaltete Reisen sehen andere Crews nicht.
  - Ist eine laufende Reise ausgeschaltet, gilt die Crew für die anderen auch nicht als „unterwegs“.
- **Schmale Zeilen im Tagebuch.**
  - Zwischen Kopfzeile und eigener Reise steht je Crew, der ihr folgt und die gerade unterwegs ist, eine Zeile, z. B. „👋 Familie Franz · Norwegen, Tag 3 ›“.
  - Ein Tipp öffnet direkt deren Reise. Ein roter Punkt zeigt Neues.
  - Frisch losgefahrene Crews, denen ihr noch nicht folgt, erscheinen mit „folgen anfragen ›“ (✕ blendet sie aus).
  - Crew-Leiter sehen dort auch wartende Anfragen.
  - Der 👋-Hinweis neben der Pinnwand entfällt dafür.
- **Karte:** Ein Tipp auf die gestrichelte Linie oder den Standort einer anderen Crew öffnet deren Reise.

## Neu in Version 78: „Unterwegs mit Freunden“ heißt jetzt „Crews on the Road“

- Der Bereich unter **Mehr**, in dem ihr die Reisen anderer Crews mitverfolgt, heißt jetzt **„Crews on the Road“**. Die Funktion bleibt gleich.
- Neu ist auch die `api/index.php`: Nur der Text der Mitteilung bei Folge-Anfragen nennt den neuen Namen. Hochladen ist nicht zwingend.

## Neu in Version 77: Start-Hilfe für Startbildschirm und Mitteilungen

Oben im Tagebuch erscheint eine kleine Start-Hilfe, aber nur, solange noch etwas fehlt:

- **Läuft LAMMping noch im Browser**, steht dort „LAMMping auf den Startbildschirm legen“. Die Hilfe sagt dazu, warum das wichtig ist:
  zuverlässiger, ohne Netz, Mitteilungen (auf dem iPhone nur so), „Teilen › LAMMping“ für Fotos.
  Darunter steht die passende Anleitung für iPhone, Android-Chrome, Samsung Internet, Firefox und den PC. Wo der Browser es erlaubt, gibt es direkt einen Knopf „Installieren“.
- **Läuft LAMMping installiert, sind Mitteilungen aber noch nicht erlaubt**, steht dort „🔔 Mitteilungen einschalten?“.
  „Einschalten“ öffnet gleich das Erlaubnis-Fenster des Handys und meldet das Gerät an.
  Ganz automatisch beim Start geht das nicht: Handys zeigen das Erlaubnis-Fenster nur nach einem Tipp.
- **„Später“** fragt nach 3 Tagen wieder. **„Nein, danke“** fragt bei den Mitteilungen nie wieder. Einschalten geht weiter unter Einstellungen › Mitteilungen.
- Sind Mitteilungen auf dem Handy blockiert, erscheint keine Frage. Wie man sie wieder erlaubt, steht unter Einstellungen › Mitteilungen.
- In der Kinderansicht erscheint die Start-Hilfe nicht.

## Neu in Version 76: Bescheid, wenn andere Crews losfahren oder folgen möchten

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen).

- **👋 Hinweis in der App.** Oben neben der Pinnwand erscheint ein Hinweis:
  - „Familie Franz ist losgefahren“, wenn eine andere Crew in den letzten Tagen eine Reise begonnen hat, der ihr noch nicht folgt.
  - „Familie Franz möchte folgen“ für Crew-Leiter, wenn eine Anfrage wartet.
  - Antippen öffnet „Crews on the Road“. Dort fragt ihr mit einem Tipp an bzw. nehmt an oder lehnt ab. Danach verschwindet der Hinweis.
- **Mitteilung aufs Handy** (Einstellungen › Mitteilungen › „👋 Andere Crews“, für eingeschaltete Geräte schon an):
  - „👋 Familie Franz ist losgefahren“. Wer schon folgt, sieht den Namen der Reise. Alle anderen nur, dass die Crew unterwegs ist (wie bisher in der Übersicht).
  - „👋 Familie Franz möchte euch folgen“ an die Crew-Leiter.
  - Eine alte, nie beendete Reise gilt dabei nicht als „losgefahren“. Gemeldet wird nur eine Reise, die vor höchstens 2 Tagen begonnen hat.

## Neu in Version 75: Reisearten – nicht nur Camping (Praxistest Paket E, Teil 1)

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen). Sie bringt die Erinnerung an den Online-Check-in.

- **Art der Reise.** Im Reise-Formular wählt ihr die Art der Reise. Zur Wahl stehen 🚐 Camping, ⛺ Zelten, 🏍️ Motorrad, 🚗 Auto + Unterkunft, ✈️ Flugreise, 🚢 Kreuzfahrt,
  🚆 Bahnreise, 🚲 Radtour, 🥾 Wandertour, ⛵ Segeln / Boot und 🔀 Gemischt. Die Art lässt sich jederzeit ändern. Bisherige Reisen sind „Camping“.
- **Bereiche ausblenden (nur als Vorschlag).** Nach dem Wählen einer Art schlägt LAMMping vor, unpassende Bereiche für diese Reise auszublenden.
  Bei einer Flugreise sind das z. B. Tankbuch, Zuladung, Autarkie, Wasserwaage, Fahrzeug und die Stellplatz-Suche. Ihr bestätigt das oder lehnt ab.
  Gelöscht wird nichts. Was in der Reise schon benutzt wurde (z. B. ein Tankeintrag für den Mietwagen), bleibt sichtbar.
- **Neue Eintragsarten:** 🏨 Unterkunft und 🏔️ Berghütte (zählen als Übernachtung), ✈️ Flug, 🚆 Bahnfahrt, 🚢 Hafen / Landgang,
  🚗 Mietwagen (Übernahme/Rückgabe) und 🎢 Freizeitpark. Oben in der Auswahl stehen die Arten, die zur Reise passen. Bei einer Flugreise sind das z. B. Unterkunft, Flug, Sehenswert.
- **Abschnitte über Einträge.** Ein Eintrag „Flug“, „Bahnfahrt“ oder „Fähre“ ist selbst ein Abschnitt der Reise. Sein Ort ist das **Ziel**, „Von“ ist der **Start**.
  Den Start sucht LAMMping selbst auf der Karte. Ohne „Von“ beginnt der Abschnitt beim Eintrag davor.
- **Karte:**
  - Flüge erscheinen als Bogen mit ✈️ in Flugrichtung.
  - Fähren und Schiffe sind blau gestrichelt, Bahnfahrten lila gepunktet, Rad- und Wandertouren grün.
  - Die Linie in Reisefarbe zeigt nur noch die Straßen-Abschnitte. So zieht sich bei einer Flugreise keine Autolinie von zu Hause über das Meer.
  - Das gilt auch im Reiseblog, bei „Crews on the Road“ und im Reisebuch.
- **Der Straße folgen** rechnet nur die Straßen-Abschnitte, jeden für sich. Bei Rad- und Wandertouren nutzt es Rad- bzw. Fußwege.
- **Statistik:** Die neue Karte „Reisearten“ zeigt Reisen je Art, Kilometer je Verkehrsmittel der gewählten Reise (Flug als Luftlinie) und Übernachtungen je Art.
  Geflogene Kilometer zählen nicht mehr als „gefahren“. Im Reiseblog stehen sie extra als „geflogen“.
- **Tickets:**
  - **Neue Arten:** ✈️ Flug (Flugnummer, Terminal, Gate, Sitzplatz), 🚢 Kabine / Bordkarte (Kabine, Deck), 🏨 Unterkunft (Anreise, Check-in, Abreise). Bahn hat jetzt Zug, Wagen und Plätze.
  - **Eintrag aus dem Ticket:** Nach dem Speichern eines neuen Flug- oder Bahntickets fragt LAMMping, ob es auch ins Tagebuch soll.
    Aus „Palma – Hamburg“ werden dann Von und Ziel.
  - **Erinnerung:** Bei Flügen kommt mit eingeschalteten Mitteilungen 24 Stunden vorher eine Erinnerung an den **Online-Check-in**.
- **Sprach-Schnelleintrag** erkennt jetzt auch Flug, Zug, Hotel, Hütte, Hafen und Freizeitpark.

## Neu in Version 74: Strecke von selbst, Herzen und Sprachnotizen im Reiseblog, Speicherplatz (Praxistest Paket D)

**Dafür die neue `api/index.php` hochladen** (vorher am besten eine Sicherung machen). Die neuen Tabellen legt der Server beim ersten Aufruf selbst an.

- **Strecke von selbst.** Läuft eine Reise, merkt sich LAMMping beim Öffnen still den Standort (höchstens alle 10 Minuten,
  nur wenn ihr euch seit dem letzten Mal bewegt habt). Nach der Erlaubnis fragt die App dafür nie. Die Linie auf der Karte läuft jetzt
  nach der Uhrzeit durch die Einträge, durch die **Standorte der Fotos** und durch diese gemerkten Punkte. „Der Straße folgen“
  nutzt dieselben Punkte. Abschalten lässt sich das unter Einstellungen › **Strecke automatisch**.
- **Im Hintergrund mit einer Tracker-App.** Unter Einstellungen › Strecke automatisch erzeugt jede Person ihre eigene geheime
  Tracker-Adresse. Diese Adresse tragt ihr in einer kleinen Tracker-App ein. Für Android ist das **GPSLogger** („Log to custom URL“), fürs iPhone
  **OwnTracks** (Modus HTTP) oder **Overland**. Die Schritte stehen direkt darunter. Die Tracker-App meldet ihre Punkte auch, wenn LAMMping zu ist,
  und daraus wächst die Strecke „Aufgezeichnet (Name)“ der laufenden Reise. Ungenaue Punkte (über 100 m), Stillstand und Ausreißer fallen weg.
  Teilt ihr euren Standort unter „Crews on the Road“, sehen die anderen Crews ihn so immer aktuell. „Neue Adresse“ macht die alte ungültig.
- **Herzen im Reiseblog.** Leser des Reiseblogs geben ohne Konto ein Herz, eines je Gerät. Beim ersten Herz dürfen sie ihren Namen dazuschreiben, müssen aber nicht.
  Im Blog steht die Zahl. Im Tagebuch steht am Eintrag „❤️ 3 im Reiseblog“ mit gestricheltem Rand, so unterscheidet es sich von euren eigenen Herzen.
  Antippen zeigt, wer es war. Ausschalten könnt ihr das in den Einstellungen des Reiseblogs („Leser dürfen Herzen geben“).
- **Sprachnotizen im Reiseblog.** Sprachnotizen erscheinen im Blog als Knopf „🎙️ Anhören“ und lassen sich dort abspielen.
  Einträge mit „Im Reiseblog ausblenden“ bleiben außen vor. Abschaltbar ist das in den Einstellungen des Reiseblogs.
- **Speicherplatz je Reise.** Einstellungen › Bedienung › „Speicherplatz ansehen“ zeigt jetzt je Reise, wie viel auf dem
  **Server** liegt (Fotos, Sprachnotizen, PDFs) und wie viel davon auf diesem Gerät, z. B. „1,2 GB auf dem Server, davon 148 MB auf diesem Gerät“.
  Darüber steht, wie viel eure ganze Crew belegt. Der Super-Admin sieht zusätzlich den ganzen Webspace: alle Crews, Datenbank, Sicherungen, Papierkorb und den freien Platz.
- **Behoben:** War der Wetterdienst nicht erreichbar (z. B. ohne Netz), lud das Tagebuch ständig neu und kostete Akku.
  Jetzt fragt die App nach einem Fehlschlag erst nach 5 Minuten wieder.

## Neu in Version 73: Fotos zum richtigen Eintrag (Praxistest Paket B)

- **„Wohin mit dem Foto?“** Beim Hineinziehen am PC, beim Foto-Knopf (lange auf „+ Eintrag“ drücken) und beim Teilen
  aus der Galerie mit „Teilen › LAMMping“ fragt LAMMping, ob das Foto zu einem Eintrag gehört: Oben steht der passende
  Eintrag (kurz davor/danach, gleicher Ort, „passt“), darunter die letzten Einträge der Reise mit Uhrzeit und
  Vorschaubild, dazu „Neuer Eintrag“. Beim Ziehen und beim Foto-Knopf kommt die Frage, wenn etwas passt oder in den
  letzten 3 Stunden eingetragen wurde; beim Teilen immer.
- **📷+ am Eintrag:** Im Tagebuch neben den Herzen – ein Tipp öffnet Kamera bzw. Galerie, die Fotos kommen direkt in
  diesen Eintrag.
- **Einträge zusammenführen:** Mehrfachauswahl (lange drücken, am PC Strg-Klick) › **⧉ Zusammenführen**. Der früheste
  Eintrag bleibt mit Art, Titel und Ort; Fotos, Texte, Sprachnotizen und PDFs kommen dazu, Herzen, Kommentare und Kosten
  wandern mit.
- Der Foto-Knopf sichert das Kamera-Foto wie „Foto aufnehmen“ zusätzlich aufs Handy.

## Neu in Version 72: Erfahrungen aus dem Praxistest (Paket A + C)

**Standort und neue Einträge**
- **Genauere Ortung:** LAMMping misst bis zu 10 Sekunden weiter, bis der Standort auf etwa 20 m genau ist („Standort
  wird genauer … ± 53 m“). Alte, zwischengespeicherte Werte zählen nicht mehr.
- **Richtiger Ort:** Als Ort steht die Gemeinde bzw. Stadt („Manching“), der Ortsteil („Pichl“) ist ein Vorschlag.
- **Schneller:** Der Ortsname erscheint sofort, Plätze in der Nähe (Museum, Campingplatz …) kommen als Vorschlag nach.
  Orte merkt sich das Gerät.
- **Jeder neue Eintrag ortet von selbst** (auch die Notiz unter „Ich bin hier …“) und trägt den besten Vorschlag als
  Titel ein. Nachgetragene Einträge (mehr als 2 Stunden zurück) werden nicht geortet. Bearbeiten ändert den Ort nie
  von selbst. Mit dem ✕ neben der Position lässt sich der Ort entfernen.
- **Foto mit Ortsangabe:** Kommt bei einem neuen Eintrag ein Foto mit GPS dazu, ersetzt sein Ort den GPS-Ort
  („Ort aus dem Foto übernommen“).
- **Wetter mit Ort:** „5° Bedeckt · Manching“ in der Heute-Karte, „Hier: Manching“ auf der Wetter-Seite. Ohne
  aktuellen Standort gilt der letzte Eintrag („… (letzter Eintrag)“).

**Fotos und Eintragsarten**
- **📷 Foto aufnehmen** im Eintrag öffnet sofort die Kamera. Das Foto kommt zusätzlich in voller Auflösung aufs Handy:
  Android als Download (in der Galerie im Album „Download“), iPhone über den Knopf „In Fotos sichern“. Abschaltbar
  unter Einstellungen › Komfort.
- **7 neue Arten:** Stadtbummel / Spaziergang, Aussicht, Natur & Tiere, Markt, Fest / Veranstaltung, Begegnung, Fahrt.
  Oben stehen die 9 meistbenutzten Arten, der Rest hinter **Mehr Arten …**.

**Tagebuch**
- **Reise-Leiste:** nur noch Beenden · Fotos · Packliste · **Danach** (früher „Nach der Reise“; dort jetzt auch
  „Straße folgen“). **Aufzeichnen** gibt es als „Tour aufzeichnen“ unter „Ich bin hier …“ und beim langen Drücken
  auf „+ Eintrag“, im Eintrag einer Wanderung als „Weg aufzeichnen“.
- **🙈 nicht im Blog:** Bei eingeschaltetem Reiseblog sind ausgeblendete Einträge gekennzeichnet; antippen blendet
  sie (nach Rückfrage) wieder ein.
- **🎙️ 0:42:** Einträge mit Sprachnotiz zeigen deren Länge; antippen spielt sie direkt ab, nochmal antippen hält an.

## Neu in Version 71: Erste Crew selbst gründen

- Wer „Darf eigene Crews gründen“ hat, aber noch zu keiner Crew gehört, sieht nach der Anmeldung jetzt
  „Crew gründen“ (Name ist mit „Familie …“ vorbelegt) und landet danach als Crew-Leiter direkt in der App.
  Bisher kam nur der Hinweis, man solle einen Verwalter fragen. Wer nicht gründen darf, bekommt den Hinweis auf den
  Einladungslink.

## Neu in Version 70: Mitteilungen aufs Handy (Pinnwand, Tickets)

**Wichtig beim Hochladen:** Diesmal ist wieder **`api/index.php`** neu (drei neue Tabellen, legt der Server selbst an;
die Schlüssel für die Mitteilungen erzeugt er beim ersten Mal selbst). `api/config.php` und `api/data` bleiben.
Der Server braucht die PHP-Erweiterungen **curl** und **openssl** (auf fast allen Webspaces vorhanden).

- **Einschalten:** Einstellungen › **Mitteilungen** › „Mitteilungen auf diesem Gerät einschalten“ und die Frage des
  Browsers erlauben. Gilt je Gerät; auf jedem Handy einmal einschalten.
  - **iPhone/iPad:** nur in der installierten App (Safari › Teilen › Zum Home-Bildschirm, ab iOS 16.4).
- **📌 Pinnwand:** Hängt jemand einen Zettel an, bekommen alle anderen in der Crew eine Mitteilung – auch bei
  geschlossener App.
- **🎟️ Tickets:** Erinnerung am Morgen des Tages (ab 8 Uhr) und, wenn eine Uhrzeit eingetragen ist, 3 Stunden vor
  Abfahrt (mit Ort und Buchungsnummer). Ein Tipp auf die Mitteilung öffnet die Tickets.
- **Test-Mitteilung** und **Ausschalten** im selben Abschnitt; beide Arten einzeln abschaltbar.
- **Pünktliche Ticket-Erinnerungen (Cronjob):** Ohne Cronjob prüft der Server die Tickets nur, wenn gerade jemand
  LAMMping offen hat. Der Super-Admin findet unter Einstellungen › Mitteilungen eine Adresse; diese im Webspace als
  Cronjob alle 10 Minuten aufrufen lassen.

## Neu in Version 69: Geplante Stopps ziehen

- Unter „↕ Reihenfolge“ verschiebt ihr die Stopps jetzt durch Ziehen am Griff ⠿ (mit der Maus und mit dem Finger, ohne
  langes Drücken). Am Bildschirmrand scrollt die Liste mit. Die Pfeile ↑ ↓ sind dafür entfallen.

## Neu in Version 68: Geplante Stopps ordnen

- In der Planung gibt es bei „Stellplätze und Sehenswertes“ den Knopf **↕ Reihenfolge**:
  - **Automatisch ordnen (kürzeste Strecke):** ab eurem Standort (bzw. dem letzten Eintrag im Tagebuch, sonst dem
    ersten Stopp) in die ungefähr kürzeste Reihenfolge, nach Luftlinie.
  - **Von Hand:** am Griff ⠿ ziehen (seit Version 69).
  - Stopps mit Datum bleiben nach Datum sortiert und stehen vorn.
- Die Reihenfolge gilt auch für die Nummern auf der Karte, die gepunktete Planungslinie und die Spritkosten.

## Neu in Version 67: Geplante Stopps auf der Karte

- Die in der Planung gesammelten Stellplätze und Sehenswürdigkeiten der gewählten Reise stehen jetzt immer auf der
  Karte: gestrichelter Kreis mit der Nummer aus der Planung und daneben der Name, in Planungsreihenfolge gepunktet
  verbunden. Sie werden nie gebündelt. Mit dem Standort-Knopf seht ihr, wie nah ihr dran seid.
- Der Schalter „Gemerkte und geplante Orte zeigen“ regelt nur noch Wunschliste und Lieblingsplätze.

## Neu in Version 66: Teilstrecken und Strecke bearbeiten

- Ein kurzes aufgezeichnetes Stück oder eine GPX-Datei von nur einem Tag machte bisher die Verbindung der ganzen Reise
  gepunktet und ersetzte die Kilometer. Jetzt zählt eine Strecke erst, wenn sie zusammen mindestens 60 % der Luftlinie
  abdeckt (oder mit „Straße folgen“ berechnet ist); sonst bleibt die Linie durchgezogen und die Luftlinie zählt.
- Wurde „Strecke bearbeiten“ (Stift auf der Karte) nicht mit „Fertig“ verlassen, zeichnete die Karte diese Strecke
  danach nicht mehr. Behoben.

## Neu in Version 65: Heute-Karte kompakt, Stift am Reisenamen

- **Stift hinter dem Reisenamen** im Tagebuch: öffnet direkt die Einstellungen der Reise (Name, Datum, Farbe, Mitreisende, Dienste …).
- Die Heute-Karte im Tagebuch ist kleiner. Die obere Leiste (Wetter, Sonne) bleibt. Darunter stehen in einer Zeile
  nur noch Symbole: ☆ Highlight des Tages (gelb, wenn schon eingetragen), ? Frage des Tages (roter Punkt, solange sie
  abends offen ist), 📌 Pinnwand, Teilen (Tag teilen) und das Orts-Symbol für „Was ist in der Nähe?“.
- Weggefallen sind dort die Sternen-Chance (steht weiter auf der Wetter-Seite) und der Hinweis „Reisefoto fehlt noch“.

## Neu in Version 64: Von der Karte ins Tagebuch springen (PC)

- In der Zwei-Spalten-Ansicht am PC (Karte links, Tagebuch rechts): Ein Klick auf einen Pin, ein Bündel oder ein
  Stück der Route scrollt das Tagebuch zum passenden Eintrag und hebt ihn kurz hervor. Bei einem Bündel ist es der
  früheste Eintrag darin, bei der Linie der nächstgelegene Stopp.

## Neu in Version 63: Titel nur noch der Ort

- Einträge, die beim Einsortieren von Fotos automatisch entstehen, heißen jetzt nur noch wie der Ort (z. B.
  „Zandvoort“) bzw. wie die erkannte Sehenswürdigkeit, nicht mehr „Fotos aus …“. Bestehende Einträge mit genau diesem
  automatischen Titel werden beim Öffnen der App umbenannt; selbst vergebene Titel bleiben unverändert.

## Neu in Version 62: Mehr nach Themen, „Zuletzt benutzt“, Fotos zur passenden Reise

- **Mehr nach Themen:** Unterwegs heute · Reise planen · Camper & Technik · Geld · Familie & Spaß · Erinnerungen ·
  Sicherheit & Verwaltung. Gilt automatisch, solange jemand die Reihenfolge nicht selbst geändert hat. Wer eigene
  Trennlinien oder eine eigene Reihenfolge hat, behält sie und kann unter „Kacheln anordnen“ › **Nach Themen ordnen**
  umstellen (ausgeblendete Kacheln bleiben ausgeblendet).
- **Fotos zur passenden Reise:** Wer Fotos auf Kalender, Reisen-Übersicht, Statistik, Mehr, Rubbelkarte oder Fotoalbum
  zieht, bekommt sie bei der Reise, die zum Aufnahmedatum passt – nicht bei der gerade gewählten. Gibt es zu dem
  Datum noch keine Reise, fragt LAMMping, ob eine neue angelegt werden soll (mit Datum und Namensvorschlag aus Ort und
  Monat, z. B. „Malcesine April 2026“). Liegt ein Eintrag weit außerhalb seiner Reise, bietet „Reisezeitraum anpassen?“
  jetzt auch „Zu ‚…‘ verschieben“ bzw. „Neue Reise“ an.
- **Reisename im Kopf:** In der Ansicht eines Eintrags und im Bearbeiten-Fenster steht links neben dem Kreuz der Name
  der Reise in ihrer Farbe.
- **Zuletzt benutzt:** Ganz oben stehen die 5 zuletzt geöffneten Bereiche. Unter „Kacheln anordnen“ › „Oben auf der
  Seite“ umstellbar auf **Am häufigsten** (ältere Nutzung zählt weniger, mehrmals innerhalb einer Minute zählt einmal)
  oder **Aus**. Gilt je Person, auf allen ihren Geräten.

## Neu in Version 61: Straße folgen ausgewogen, Camper-Dienste abschaltbar, mehr Reisefarben

- **Straße folgen, drei Varianten:** **Ausgewogen (empfohlen)**: alle Einträge, Punkte bis 5 km zusammengefasst –
  Rundgänge im Ort fallen weg, echte Fahrten bleiben. **Knapp**: Übernachtung, Tanken, Fähre usw. plus erster und
  letzter Eintrag jedes Tages (vorher fehlten Tage ohne solche Einträge, z. B. die ersten 7 Tage). **Jeder Eintrag**:
  meist zu viel. Zu jeder Variante stehen Punkte und Luftlinie da; nach der Berechnung zeigt LAMMping den Unterschied
  zum eingetragenen Tachostand in Prozent.
- **Camper-Dienste je Reise abschaltbar:** Im Reise-Formular „Camper-Dienste für diese Reise“ oder auf der
  Dienste-Seite „Für diese Reise ausschalten“. Dann verschwinden sie auch aus der Heute-Karte und von der
  Kinder-Startseite.
- **Mehr Reisefarben:** 20 statt 8 (neu u. a. Himbeere, Lagune, Mandarine, Tanne, Lavendel, Nachtblau, Türkis).

## Neu in Version 60: Karte zeigt nur die gewählte Reise, Straße folgen genauer und rückgängig

- **Fehler behoben: Pins anderer Reisen und vielfache Pins.** Beim Bündeln naher Pins merkte sich die Karte die
  gebündelten Pins und legte sie bei jedem Neuzeichnen wieder auf die Karte – auch von anderen Reisen und mehrfach
  (daher z. B. dieselben Notizen viele Male am Startpunkt und Bündel mit 44, 77 …). Jetzt zeigt „Diese Reise“ nur
  noch ihre eigenen Pins, jeden einmal.
- **Straße folgen, genauer:** Standardmäßig nur noch durch Fahrt-Stopps (Übernachtung, Tanken, Ver-/Entsorgung, Fähre,
  Pause, Werkstatt), nahe Punkte (2 km) zusammengefasst. Sehenswertes, Baden, Wanderungen und Fotos erreicht man oft zu
  Fuß; mit dem Auto hin und zurück ergab das viel zu viele Kilometer. Wahlweise weiter „Alle Einträge mit Ort“.
- **Rückgängig:** Im selben Fenster „Rückgängig: wieder gerade Linien“ (entfernt nur die berechnete Strecke).
- **Laut Tacho gefahren:** Im Fenster „Straße folgen“ lassen sich die tatsächlich gefahrenen Kilometer eintragen
  („Nur Tacho speichern“). Sie gelten dann in Reise und Statistik („gefahren (Tacho)“).
- **Orte aufräumen:** In der Mehrfachauswahl im Tagebuch (lange drücken) gibt es „📍 Ort aus Fotos“ und
  „📍 Ort entfernen“.

## Neu in Version 59: Straße folgen, Nächte, Wanderwege aus Fotos, Aufzeichnen, Zuschneiden

- **Der Straße folgen (auch nachträglich):** Knopf **Straße folgen** über dem Tagebuch (bei beendeten Reisen unter
  „Nach der Reise“). LAMMping berechnet die Strecke zwischen den Stopps entlang der Straßen (OpenStreetMap) statt
  gerader Linien; die Kilometer werden genauer. Vorhandene GPX- oder gezeichnete Strecken bleiben erhalten. Korrigieren
  lässt sich die Strecke mit dem Stift auf der Karte („Strecke“). Kommen später Stopps dazu, einfach neu berechnen.
- **Nächte:** Gezählt wird jetzt die Dauer der Reise (Start bis Ende, bei laufenden Reisen bis heute), mindestens aber
  die Zahl der Stellplatz-Einträge. Ohne Enddatum endet eine alte Reise mit dem letzten Eintrag. Vorher zählten nur
  Stellplatz-Einträge.
- **Wanderungen aus Fotos:** Fotos merken sich jetzt Ort und Aufnahmezeit. Bei einer Wanderung / Radtour zeigt die
  Karte die Fotos als grüne Punkte, verbunden in zeitlicher Reihenfolge. Mit **Weg aus Fotos** im Eintrag lassen sich
  weitere Wegpunkte aus Fotos übernehmen, ohne die Fotos zu speichern. Gilt für Fotos, die ab jetzt hinzugefügt werden
  (bei älteren hilft „Weg aus Fotos“ mit den Originalfotos).
- **Aufzeichnen:** Knopf **Aufzeichnen** über dem Tagebuch, für eine Fahrt oder eine Wanderung / Radtour (feiner). Oben
  läuft eine rote Leiste mit den Kilometern; Tipp darauf: Pause, Beenden, Verwerfen. Nach einer Wanderung öffnet sich
  gleich der Eintrag mit Länge und Dauer. Einschränkung: Eine Web-App zeichnet nur auf, solange sie offen und der
  Bildschirm an ist (LAMMping hält ihn wach). Für lange Touren mit gesperrtem Handy eine Tracking-App nutzen und die
  GPX-Datei importieren.
- **Titelvorschlag mit Sehenswürdigkeit:** LAMMping fragt zusätzlich, in welchem Gebäude oder Gelände der Punkt liegt
  und was in 60 m Umkreis einen Namen hat. Museen, Sehenswürdigkeiten, Campingplätze, Restaurants kommen zuerst
  (z. B. „MUNCH“ statt nur „Oslo“).
- **Fotos zuschneiden:** Im Bearbeiten-Fenster ein Foto antippen: Rahmen ziehen, Format wählen (frei, 1:1, 4:3, 3:4,
  16:9), drehen. Der Ausschnitt wird in voller Auflösung des gespeicherten Fotos übernommen, nicht noch einmal
  verkleinert.

## Neu in Version 58: Unterwegs mit Freunden (Reisen anderer Crews mitverfolgen)

**Wichtig beim Hochladen:** Diesmal ist wieder **`api/index.php`** neu (zwei neue Tabellen, legt der Server selbst an).
`api/config.php` und `api/data` bleiben unverändert.

- **Mehr › Unterwegs mit Freunden.** Alle Crews sehen gegenseitig nur, wer gerade unterwegs ist („Familie Franz, seit
  30. Okt. unterwegs“), keine Inhalte.
- **Folgen:** Eine Crew tippt auf **Folgen anfragen**, ein Crew-Leiter der anderen Crew nimmt an oder lehnt ab. Oder ein
  Crew-Leiter lädt eine andere Crew direkt ein (**Crew einladen, euch zu folgen**). Die Freigabe lässt sich jederzeit
  beenden.
- **Was Mitreisende sehen:** Karte mit Route und Stopps, Tagebucheinträge mit Fotos und, wenn eingeschaltet, den
  zuletzt gemeldeten Standort. Für den Reiseblog ausgeblendete Einträge, Kosten, Listen und Dokumente bleiben privat.
  Ist eine Crew gerade nicht unterwegs, sehen Mitreisende ihre letzte Reise.
- **Standort melden:** Ein Crew-Leiter schaltet „Unseren Standort für Mitreisende melden“ ein. Während einer laufenden
  Reise meldet die App dann den Standort, wenn sie geöffnet ist (höchstens alle 15 Minuten, nur wenn der Standort im
  Browser schon erlaubt ist). Gezeigt wird er höchstens 2 Tage lang.
- **Auf eurer Karte:** Die Reisen der Crews, denen ihr folgt, erscheinen gestrichelt mit Namen. Abschaltbar im
  Ebenen-Fenster der Karte.
- **Hinweis bei Neuem:** Trägt eine Crew, der ihr folgt, etwas Neues ein, erscheint oben rechts 👋 mit dem Namen (am
  Handy mit der Anzahl). Ein Tipp öffnet die Reise.

## Neu in Version 57: Fotos sortieren und besser zusammenfassen

- **Reihenfolge der Fotos:** Im Eintrag lassen sich die Fotos umsortieren: mit der Maus ziehen, am Handy lange drücken
  und dann ziehen. Das erste Foto ist das Titelbild (Kalender, Tagebuch). Beim Ziehen entsteht keine Kopie mehr.
- **Foto hineinziehen:** Gibt es schon einen Eintrag kurz davor oder danach an derselben Stelle (bis 1,5 km), fragt
  LAMMping: „Dazulegen“ oder „Eigener Eintrag“.
- **Fotos einsortieren:** Die Liste zeigt jetzt gleich, welche Fotos zusammen in einen neuen Eintrag kommen
  („Neuer Eintrag 1 (10:00 Uhr)“, „Neuer Eintrag 2 …“), und lässt sich ändern. Zusammen kommen Fotos bis 2 Stunden
  Abstand und 3 km Entfernung, am selben Tag an fast derselben Stelle (300 m) auch mit größerem Abstand. Neu:
  **Alle in einen neuen Eintrag**. Fotos mit Ort passen jetzt auch zu Einträgen ohne Position vom selben Tag.

## Neu in Version 56: Titel aus dem Ort, Reisezeitraum passt sich an

- **Titelvorschlag:** Kommt die Position aus einem Foto (hineinziehen oder „Fotos hinzufügen“ bei einem neuen
  Eintrag), aus „Aktuelle Position“ oder von der Karte, stehen unter dem Titel Vorschläge zum Antippen: der Platz
  selbst, wenn er in OpenStreetMap einen Namen hat (Campingplatz, Strand, Burg, Restaurant …), und der Ort. Beim
  Hineinziehen eines Fotos wird der erste Vorschlag gleich eingetragen. Auch der Foto-Schnellknopf und „Fotos
  einsortieren“ nehmen den Namen des Platzes als Titel.
- **Nachgetragene Reisen:** Liegt ein Eintrag vor dem Start oder nach dem Ende der Reise (zum Beispiel, weil der Start
  beim Anlegen noch auf „heute“ stand), fragt LAMMping, ob der Reisezeitraum angepasst werden soll. „So lassen“ gilt
  für diese Reise dauerhaft.
- **Kalender:** Zeigt jetzt auch Tage mit Einträgen außerhalb des Reisezeitraums.

## Neu in Version 55: Crews für mehrere Familien, Einladungen, PDFs

**Wichtig beim Hochladen:** Diesmal ist auch **`api/index.php`** neu. Bitte vorher in der Verwaltung eine Sicherung
herunterladen. `api/config.php` und der Ordner `api/data` bleiben unverändert. Die Datenbank stellt sich beim ersten
Aufruf selbst um: Wer bisher Verwalter war, ist danach Super-Admin und Crew-Leiter in seinen Crews.

- **Drei Rollen:**
  - **Super-Admin** (Tobi): legt Konten an und löscht sie, setzt Passwörter zurück und vergibt das Recht „darf eigene
    Crews gründen“. Von fremden Crews sieht er in der Verwaltung nur Name und Mitgliederzahl, keine Inhalte.
  - **Crew-Leiter** (je Crew, der Gründer automatisch): lädt Leute ein, legt Konten für die eigenen Leute an (z. B.
    Kinder), vergibt Rechte in der Crew und ernennt weitere Crew-Leiter. Dokumente, Kasse und Verwaltung sehen Leiter
    nur in ihren eigenen Crews.
  - **Mitglied:** wie bisher.
- **Einladen per Link oder QR-Code:** Einstellungen › Verwaltung › bei der Crew **„Einladen“**. Es erscheinen QR-Code
  und Link zum Kopieren, Teilen oder Drucken (Karte „Komm in unsere Crew!“). Wer den Link öffnet, legt sich ein Konto
  an oder meldet sich an und ist sofort in der Crew. Der Link gilt 14 Tage und lässt sich bei der Crew zurückziehen.
- **PDFs:** An Reiseideen (**📎 PDF**), Tickets und Dokumente lassen sich PDFs anhängen, bis 10 MB. Im Teilen-Menü
  anderer Apps erscheint LAMMping jetzt auch für PDFs, mit der Wahl Reiseidee, Ticket oder (für Crew-Leiter)
  Dokumente. Hochladen braucht Internet. Einmal geöffnet, gehen PDFs auch offline; Tickets der Reise werden beim
  Öffnen der Tickets-Seite gleich mit gespeichert. Dokument-PDFs sehen nur Crew-Leiter.
- Hinweis: Manche Webspaces erlauben kleinere Uploads als 10 MB (PHP-Einstellung `post_max_size`). Dann meldet
  LAMMping beim Hochladen die Grenze.

## Neu in Version 54: Pinnwand-Zettel, Reisefoto Jahr für Jahr, Teilen in Reiseideen

- **Gelber Zettel in der Kopfzeile:** Hängt etwas an der Pinnwand, klebt rechts neben LAMMping ein gelber Zettel mit
  der Anzahl. Ein Tipp zeigt die Zettel über dem aktuellen Bildschirm, mit „Neuer Zettel“ und „Zur Pinnwand“.
- **Unser Reisefoto, jedes Jahr:** „Jahr für Jahr“ zeigt je Jahr ein Foto nebeneinander, **▶ Zeitraffer** spielt die
  Jahre groß nacheinander ab (Tipp beendet). Mit „Älteres Foto nachtragen“ kommen auch Fotos aus früheren Jahren dazu
  (das Jahr wird aus dem Foto gelesen). Die Heute-Karte erinnert mit „Reisefoto 2026 fehlt noch“.
- **In eine Reiseidee teilen:** Beim Teilen aus anderen Apps stehen alle Ideen zur Wahl (mit Suche), geteilte Bilder
  werden an der Idee gespeichert. In jeder Idee neu: **📋 Aus Zwischenablage** (kopierten Link übernehmen, z. B. am
  iPhone) und **📷 Foto**.
- **Startseite:** Eine in den Einstellungen gewählte Startseite gilt jetzt immer. „Dort weitermachen, wo ich war“
  greift nur noch, wenn als Startseite „Wie gewohnt“ eingestellt ist.
- **Packliste: nächstes Mal:** Beim Anlegen einer neuen Reise erinnert LAMMping an die Sachen auf der Liste und packt
  sie auf Wunsch mit einem Tipp als Extras auf die Packliste der neuen Reise.

## Neu in Version 53: Zugangskarte für neue Personen

Wer in der Verwaltung eine Person anlegt (oder ihr ein neues Passwort gibt), bekommt danach den Knopf
**„Zugangskarte drucken / PDF“**: eine Karte zum Ausschneiden mit Begrüßung, QR-Code zur App, Adresse, Anmeldename,
Passwort und drei Schritten zum Anmelden und Installieren. Im Druckfenster „Als PDF speichern“ wählen, um sie zu
verschicken.
- Der QR-Code öffnet LAMMping mit schon ausgefülltem Anmeldenamen. Das Passwort steht nur auf dem Papier, nicht im Code.
- Das Passwort kennt LAMMping nur direkt nach dem Speichern. Später gibt es die Karte beim Bearbeiten einer Person über
  „Zugangskarte“, dann mit einer Linie zum Eintragen des Passworts (oder mit dem gerade neu eingegebenen).

## Neu in Version 52: Neues LAMMping-Schaf

Das bisherige Schaf beruhte auf einem lizenzpflichtigen Stockbild (iStock) und ist komplett ersetzt:
- **Logo-Schaf** (Kopfzeile, Anmeldeseite, Hintergrund, Kinder-Startseite, Drucke, Reiseblog, Teilen-Bild) ist das
  neue cremefarbene Schaf aus eurer Sammlung, als Vektorgrafik nachgezeichnet und damit in jeder Größe scharf.
- **Bereichsbilder** neben den Überschriften: 31 neue Bilder aus der Sammlung (`icons/bereiche/*.webp`). Für Karte,
  Tagebuch, Listen und Planung gibt es dort noch kein eigenes Bild: Basis-Schaf plus das bisherige Symbol; „Mehr“
  zeigt das Basis-Schaf.
- **App-Symbole** (Startbildschirm, Favicon) neu mit dem neuen Schaf.
- Die alten Dateien `icons/lammping.svg` bitte auf dem Webspace löschen, sie werden nicht mehr gebraucht.

## Neu in Version 51: Scharfe Mitfahrer

Die Canva-Bilder der Mitfahrer sind jetzt in hoher Auflösung eingebaut (2,5-fach), besonders in der Auswahl und auf
scharfen Handy-Bildschirmen deutlich schärfer. Die Vorlagen liegen im Canva-Design „LAMMping Mitfahrer Arbeitsfläche“.

## Neu in Version 50: Auswahl bewegt sich an der Stelle

In der Auswahl „Wer fährt oben mit?“ bewegen sich die Figuren an ihrem Platz (Räder, Rauch, Lichter, Flügelschlag,
Watscheln, Schweben), fahren aber nicht mehr hin und her.

## Neu in Version 48: Mitfahrer in Bilderbuch-Optik

Alle Figuren oben in der Leiste (außer eurer V-Klasse) sind neu, in Canva im Bilderbuch-Stil gezeichnet und
freigestellt. Die Bewegung kommt weiter von LAMMping: Räder drehen sich hinter den Radkästen (Bobbycar, Fahrrad,
Traktor, Feuerwehr, Dampflok), Rauch steigt auf, das Blaulicht und die Ufo-Lichter blinken, das Boot schaukelt auf
Wellen, der Vogel schlägt mit den Flügeln, der Schmetterling flattert, die Tiere laufen, hüpfen, galoppieren oder
kriechen. Die Bilder liegen in `icons/mitfahrer/` (zusammen etwa 100 KB) und funktionieren auch offline.

## Neu in Version 47: Tagebuch aufgeräumt

Über dem Tagebuch ist es übersichtlicher:
- **Obere Leiste:** nur noch Starten/Beenden bzw. Weiter, Fotos, Packliste und **Nach der Reise**. Unter „Nach der
  Reise“ liegen Rückblick, Als Buch lesen, Export, Packliste auswerten und Ins Archiv legen. Ist die Reise beendet, ist
  der Knopf farbig hervorgehoben.
- **Eine Zeile darunter:** Filter (**Alles ▾**, aufklappen für Stellplätze, Erleben, Unterwegs, Notizen), Neueste oben,
  🗺️ Tageskarten ein/aus und 📅 Kalender.
- **⤒ Jetzt** steht immer links in der mitlaufenden Tagesleiste: ein Tipp führt ganz nach oben zum neuesten Eintrag
  (bei „Ab Tag 1“ ganz nach unten).
- **Packliste: nächstes Mal:** feste Liste unter Listen › Merken (angeheftet, nicht löschbar). Unterwegs gleich
  eintragen, was fehlt; darunter steht, was nie gebraucht wurde. Beim nächsten Packen erinnert LAMMping daran. Der
  Knopf „Packliste“ über dem Tagebuch öffnet sie direkt; „Packliste auswerten“ nach der Reise schreibt ebenfalls hinein.

## Neu in Version 46: Mitfahrer auch für Erwachsene schnell aussuchen

Wer oben in der Leiste mitfährt, kann jetzt jede Person leicht selbst aussuchen:
- **Tipp auf die Landschaft oben** (rechts neben dem Reisenamen) öffnet die Auswahl, für Erwachsene und Kinder.
- In den Einstellungen steht die Auswahl unter **Darstellung und Kopfzeile**, direkt unter Hell/Dunkel.
- Kinder finden sie außerdem wie bisher auf ihrer Startseite. Tippen Kinder eine Figur direkt an, hüpft sie.

Außerdem: Die Dampflok hat jetzt auch Räder unter dem Führerhaus, und der Tender steht auf derselben Schiene. In den
Einstellungen sind „App installieren“ und „App weitergeben“ zu **App installieren und weitergeben** zusammengelegt
(Installieren und QR-Code für ein anderes Handy an einer Stelle).

## Neu in Version 45: Mitfahrer mit mehr Details

Alle Figuren oben in der Leiste sind neu gezeichnet und deutlich detailreicher: Gesichter mit Augenglanz, Fell,
Muster und Schatten, echte Radfelgen mit Bolzen und Speichen. Neue kleine Bewegungen: Fahrradwimpel flattert,
Kurbel und Pedale drehen sich, Treibstange der Dampflok läuft mit, Brennerflamme des Ballons flackert, im Ballon
winkt jemand, der Außerirdische im Ufo winkt, der Lichtstrahl pulsiert, der Hund hechelt und wedelt, das Schaf trägt
ein Glöckchen, der Hase eine Karotte, der Igel einen Apfel und die Schnecke eine Blume. Die Auswahl zeigt die Figuren
größer.

## Neu in Version 44: Wer fährt oben mit?

Oben in der Leiste können jetzt neben der V-Klasse und dem Bobbycar viele weitere Figuren durch die Landschaft
fahren, fliegen oder laufen. Jede bewegt sich auf ihre Art:
- **Fahrzeuge:** V-Klasse, Bobbycar, Fahrrad (Beine treten), Traktor und Dampflok (mit Rauchwölkchen), Feuerwehr (mit
  Blaulicht), Segelboot (schaukelt auf Wellen).
- **In der Luft:** Heißluftballon, Ufo (mit blinkenden Lichtern), Papierflieger, Vogel und Schmetterling (flattern).
  Was fliegt, bleibt über der Landschaft und deckt den Reisenamen nicht zu.
- **Tiere:** LAMMping-Schaf, Hund (wedelt), Hase (hoppelt), Schnecke (ganz langsam), Dino, Igel.

Bis zu sechs Figuren gleichzeitig, jede mit eigenem Tempo. Aussuchen geht für Kinder auf ihrer Startseite unter „Oben
in der Leiste“ und für alle in den Einstellungen unter „Kopfzeile“. Die Auswahl gilt je Person auf allen ihren
Geräten. Kinder können die Figuren oben antippen, dann hüpfen sie. „Wie lange noch?“ zeigt die erste ausgesuchte
Figur. Wer nichts aussucht, sieht wie bisher die V-Klasse (Kinder das Bobbycar).

## Neu in Version 43: Urlaubswertung bei den Spielen

Im **Punkteblock** steht über den Partien jetzt eine **Wertung**: Siege und gespielte Partien je Person, darunter je
Spiel, wer wie oft gewonnen hat (bei Spielen mit „meiste Punkte gewinnen“ auch der Höchstwert, z. B. bei Kniffel).
Umschalten zwischen **Diese Reise** und **Alle Reisen**; auch die Liste der Partien folgt dieser Auswahl.
- Gezählt werden beendete Punkteblöcke und fertig gespielte Kniffel-Partien; bei Gleichstand bekommen alle Führenden
  den Sieg.
- Ältere Partien ordnet LAMMping über das Datum der passenden Reise zu.
- Nach einer Kniffel-Partie führt „Urlaubswertung ansehen“ direkt dorthin, und die **Reise-Urkunde** nennt die
  gewonnenen Spiele.

## Neu in Version 42: Spielekiste

Neun neue Spiele unter Spiele & Co (alle ohne Internet):
- **Unterwegs im Auto:** *Würdest du lieber …?* (zwei Möglichkeiten, reihum abstimmen, dann erzählen, warum) und
  *Tick-Tack-Bumm* (Thema nennen, Handy weitergeben, nach geheimer Zeit platzt die Bombe; wer verliert, wird gezählt).
- **Raten:** *Hauptstädte-Quiz* (Land → Hauptstadt oder umgekehrt, Europa oder Welt), *Umriss-Quiz* (Land an der Form
  erkennen, Tipp zeigt die Flagge) und *Wo liegt das?* (Ort auf der Europakarte antippen, bis zu 1000 Punkte je Ort).
- **Knobeln:** *Farben-Merkspiel* (wie Senso, mit Tönen), *Wer ist schneller?* (zwei Spieler an einem Handy, erster auf
  „JETZT!“ gewinnt, bis 5 Punkte), *Kniffel* (fünf Würfel, festhalten, Punktezettel für alle; das Ergebnis landet im
  Punkteblock) und *Punkteblock* (Uno, Rommé, Mölkky, Boule …: Runden eintragen, Summen, Punkteziel, Sieger; für alle
  Geräte der Familie sichtbar).
Rekorde gelten je Person (oben „Es spielt“ wählen).

## Neu in Version 41: Familie, Kinder, Teilen, Drucken, Sichern

**Familie und Kinder:**
- **Ansage bei „Wie lange noch?“:** „🔊 Ansagen“ liest Restzeit, Strecke und Ankunft vor; auf Wunsch alle 15 Minuten,
  solange die Seite offen ist (der Bildschirm bleibt dort an).
- **Wunschzettel** (Mehr und Kinder-Startseite): drei Wünsche je Person für die Reise. Geht ein Wunsch in Erfüllung:
  ☆ antippen, Datum und Foto dazu.
- **Freundebuch** (Mehr und Kinder-Startseite): Familien von unterwegs mit Kindern, Wohnort, Kontakt, Steckbrief, Foto und
  „Wo kennengelernt“ (der letzte Stellplatz ist vorgeschlagen). „Ins Adressbuch“ speichert eine Kontaktdatei (vCard).
- **Reise-Urkunde** (Wunschzettel oder Reise → Export): Urkunde zum Drucken mit Kilometern, Tagen, Stellplätzen, Ländern,
  entdeckten Tieren, Stempeln, erfüllten Wünschen, Foto und Unterschriftszeile. Querformat drucken.
- **Ausmalbild:** Im Foto-Vollbild „🖍️ Ausmalbild“ antippen. Aus dem Foto wird eine Malvorlage mit schwarzen Linien;
  Linienzahl und -stärke lassen sich einstellen. Drucken oder als Bild speichern.

**Teilen, Drucken, Sichern:**
- **Wetter-Bilanz** (Statistik, für die aktuelle Reise): Sonnen- und Regentage, Regenmenge, wärmster Tag, kälteste Nacht
  und das Wetter jedes Tages (Daten von Open-Meteo, braucht einmal Internet).
- **Listen ausdrucken:** „Drucken“ oben in Listen (aktuelle Liste), Boxen & Fächer (Packliste mit Boxen, Eingepacktes
  angekreuzt) und Checklisten. Zweispaltig mit Kästchen zum Abhaken.
- **Reise als eigene Datei** (Reise → Export → „Reise als Datei“): eine einzige Webseiten-Datei mit Karte, allen Tagen,
  Texten und Fotos. Lässt sich ohne LAMMping und ohne Internet in jedem Browser öffnen, z. B. als Sicherung.
- **QR-Codes:** neben Reiseblog-Links und dem Link für Lieblingsplätze „▦ QR-Code“; in den Einstellungen unter
  „App installieren und weitergeben“ ein QR-Code, mit dem ein anderes Handy LAMMping öffnet.

## Neu in Version 40: Fahrzeuge, Reise-Aufbau und Infos aus dem Internet

**Fahrzeuge und Reisen:**
- **Mehrere Fahrzeuge** (Mehr → Fahrzeug → „＋ Fahrzeug“): Camper, Auto, Wohnwagen … jeweils mit eigenem Steckbrief, eigenen
  Fristen und eigenem Tankbuch. Oben wählt man das Fahrzeug; im Reise-Formular steht, welches Fahrzeug mitfährt (oder auf der
  Fahrzeug-Seite „Bei … mitnehmen“). Tankstopps aus dem Tagebuch gehören zum Fahrzeug der Reise. Alles Bisherige gehört zum
  ersten Fahrzeug. Neu im Steckbrief: Art und Verbrauch (solange das Tankbuch ihn noch nicht kennt).
- **Mängelliste** (Fahrzeug-Seite): Kaputtes mit Foto, Notiz und „muss in die Werkstatt“ notieren, später abhaken. Offene
  Mängel zeigt die Fahrzeug-Kachel unter Mehr.
- **Stellplatz genauer bewerten:** Im Stellplatz-Eintrag unter „Weitere Angaben“ Lage, Sauberkeit, Ruhe, Kinderfreundlichkeit
  und Preis-Leistung mit Sternen; daraus wird die Gesamtwertung vorgeschlagen. Die Statistik zeigt „Stellplätze im Vergleich“
  mit Durchschnitt und den besten Plätzen.
- **Reise als Vorlage:** Beim Anlegen einer neuen Reise „Aus einer früheren Reise übernehmen“: offene Listenpunkte, Extra-
  Packsachen, auf Wunsch geplante Orte, Fahrzeug und Mitreisende.

**Infos aus dem Internet** (alles Geladene bleibt für unterwegs ohne Netz gespeichert):
- **Spritkosten der geplanten Strecke** (Reise → Planung): Strecke vom letzten Stopp über die geplanten Orte mal Verbrauch
  (Tankbuch des Reise-Fahrzeugs) mal Preis der letzten Tankstopps, mit Vergleich zum Budget. Werte lassen sich anpassen.
- **Reise-Check** (Planung): aus den Ländern der Reise Vignetten, Plaketten und Pflichtausstattung zum Abhaken; weitere Länder
  lassen sich hinzufügen. Angaben ohne Gewähr.
- **Kontakt zum Campingplatz:** Im Stellplatz-Eintrag und bei gemerkten Orten Telefon (direkt anrufen), Website und
  Rezeptions- bzw. Öffnungszeiten aus OpenStreetMap.
- **„Heute geöffnet?“:** Bei Ausflugszielen im Eintrag, im Orts-Fenster und an geplanten Orten (für den geplanten Tag) ein
  grüner oder roter Hinweis. Saisonzeiten werden nur angezeigt, nicht bewertet.
- **Wikipedia-Kurzinfo:** bei Sehenswertem und Museen die ersten Sätze und ein Bild aus Wikipedia.
- **Wassertemperatur** (Wetter-Seite): für Standort, letzten Stellplatz und geplante Orte am Meer, fünf Tage.
- **Regentag-Plan** (Wetter-Seite und Heute): je nach Vorhersage Ideen bei Regen (Museen, Hallen- und Erlebnisbäder,
  Indoorspielplätze, Kino …) oder bei Sonne (Strände, Badestellen, Aussichtspunkte, Zoos) im Umkreis von 25 km, dazu
  passende Orte von eurer Wunschliste. „Merken“ legt einen Ort für die laufende Reise an.

## Neu in Version 39: Karte und Bedienung

**Karte** (Ebenen-Knopf auf der Karte):
- **Kartenart:** Normal, Wanderkarte mit Höhenlinien (OpenTopoMap) oder Luftbild (Esri). Angesehene Ausschnitte bleiben
  auch ohne Netz gespeichert.
- **Pins bündeln:** Beim Herauszoomen werden nahe Pins zu einem Kreis mit Zahl. Ein Tipp zoomt hinein; liegen die Pins
  übereinander, erscheint eine Liste. Lässt sich abschalten.
- **Fotos auf der Karte:** Vorschaubilder an den Orten der Einträge (Zahl = Anzahl Fotos). Ein Tipp öffnet das Vollbild.
- **Liste unter der Karte:** Unten steht „Tag 4 · 6 Stopps“. Antippen oder hochziehen öffnet die Stopps des Tages, ‹ › wechselt
  den Tag, die Karte zeigt den Tag. Ein Tipp auf einen Stopp springt dorthin.

**Bedienung:**
- **Heute** (Kachel unter Mehr, auch als Reiter in der unteren Leiste wählbar): Heute-Karte mit Wetter, Sonne, Zielen,
  Diensten, Pinnwand und Tickets, dazu offene Abstimmungen, heutige Einträge und Abkürzungen. Ohne laufende Reise: Countdown
  bis zur nächsten Reise.
- **Bildschirm bleibt an** bei „Wie lange noch?“, Wasserwaage, Kochen, Spielen und im Einkaufsmodus.
- **Einkaufsmodus** (Listen → Einkaufen → „🛒 Einkaufsmodus“): große Häkchen, abgehakte Punkte rutschen nach unten, Bildschirm
  bleibt an. „Fertig“ beendet ihn.
- **Dort weitermachen, wo man war:** Wird die App innerhalb von 12 Stunden wieder geöffnet, geht es auf der letzten Seite
  (auch im Spiel) an derselben Stelle weiter.
- **Schmalere Kopfzeile:** Beim Herunterscrollen gleitet die obere Zeile weg, beim Hochscrollen kommt sie wieder.
- **Tastenkürzel am PC:** N neuer Eintrag, / Eingabefeld, 1–5 Reiter, H Heute, K Kalender, B Buch, ? Übersicht, Esc schließt.
- **Einstellungen:** Abschnitte sind eingeklappt; oben eine Sprungleiste. „Alle aufklappen“ merkt sich die Wahl.
- **Offline ehrlich:** Ohne Netz sind Knöpfe, die Internet brauchen (z. B. „Was ist in der Nähe?“, Ortssuche, Reiseblog),
  ausgegraut mit „braucht Internet“.
- **Speicherplatz** (Einstellungen → Komfort): wie viel LAMMping belegt, Fotos je Reise, Kartenausschnitte. Fotos einer Reise
  lassen sich vom Handy entfernen (sie bleiben auf dem Server), Kartenausschnitte löschen.
- Neuer Abschnitt **Komfort** in den Einstellungen: Bildschirm anlassen, dort weitermachen, Kopfzeile verkleinern.

## Neu in Version 38: Tagebuch ansehen

- **Werkzeugleiste im Tagebuch** (unter den Filtern):
  - „↓ Neueste oben“ / „↑ Ab Tag 1“ schaltet die Reihenfolge um (für jede Person eigen).
  - „🗺️ Tageskarten“ blendet unter jeder Tagesüberschrift eine kleine Karte mit Strecke und Stopps des Tages ein oder aus
    (gestrichelt: vom Übernachtungsplatz davor). Ein Tipp auf die Tageskarte zeigt den Tag auf der großen Karte.
  - „📅 Kalender“ und „📖 Als Buch“ (siehe unten).
- **Sprungleiste:** „Tag 1 · Tag 2 · …“ bleibt beim Scrollen oben stehen und zeigt, wo man gerade ist. Ein Tipp springt zum Tag.
- **Foto-Vollbild:** Ein Tipp auf ein Foto (im Tagebuch, im Eintrag, im Buch) öffnet es groß. Wischen zum nächsten Foto,
  im Tagebuch über alle Einträge hinweg; mit zwei Fingern oder Doppeltipp zoomen; am PC Pfeiltasten, Mausrad und Esc.
  „Zum Eintrag“ öffnet den passenden Eintrag. Den Eintrag selbst öffnet man jetzt über Titel oder Text.
- **Herzen und Kommentare:** Unter jedem Eintrag 🤍 für ein Herz und 💬 für Kommentare; der letzte Kommentar steht als
  Vorschau daneben. Im Eintrag sieht man, wer ein Herz gegeben hat, und kann kommentieren (eigene Kommentare löschen).
- **Kalender** (auch unter Mehr): alle Reisetage eines Jahres in der Farbe der Reise, mit kleinem Foto des Tages.
  Ein Tipp öffnet den Tag im Tagebuch.
- **Als Buch lesen:** Titelseite mit Foto (das Reisefoto, sonst das erste Foto), ein Tag pro Seite mit Tageskarte, großen
  Fotos und schöner Schrift, am Ende eine Schlussseite. Blättern mit ‹ ›, Wischen, Pfeiltasten oder über die Seitenauswahl.
  Das Buch öffnet beim Tag, der im Tagebuch gerade zu sehen war, und merkt sich die Seite.

## Neu in Version 37: schneller eintragen

**Wichtig:** Diese Version braucht die neue `api/index.php` auf dem Server (für Google-Maps-Kurzlinks).

- **Kürzeres Formular:** Oben stehen Art, Titel, Zeit, Ort, Text, Fotos und Bewertung. Steckbrief, Ausstattung, Kosten und
  „Nicht im Reiseblog“ liegen unter **„Weitere Angaben“** zum Aufklappen. Ist dort schon etwas eingetragen, ist der
  Bereich beim Bearbeiten offen.
- **Schnellauswahl:** „+ Eintrag“ gedrückt halten (am PC: Rechtsklick) öffnet Stellplatz, Tanken, Pause, Sehenswert,
  Einkauf, Notiz und Foto. Die Position wird gleich gesucht.
- **Foto-Schnellknopf:** Der Kamera-Knopf über „+ Eintrag“ macht ein Foto, daraus entsteht sofort ein Eintrag mit Uhrzeit,
  Position und Ortsname. Text und Titel lassen sich später ergänzen. Bei einem Foto aus der Galerie zählen Aufnahmezeit und
  Ort aus dem Foto.
- **Google-Maps-Link einfügen:** In Google Maps „Teilen“ → „Link kopieren“, dann im Eintrag ins Feld „Ort“ einfügen (auch
  bei Orten in den Feldern Name, Suche oder Link). Name und Position werden übernommen, auch bei Kurzlinks (maps.app.goo.gl).
- **Fotos hineinziehen (PC):** Fotos aus dem Explorer auf ein offenes Eintragsfenster ziehen. Auf das Tagebuch gezogen:
  ein Foto öffnet einen neuen Eintrag, mehrere werden nach Zeit und Ort in die Einträge einsortiert.
- **Entwürfe:** Angefangene Einträge werden automatisch gemerkt („Entwurf gespeichert“), auch mit Fotos. Beim nächsten
  „+ Eintrag“ fragt die App „Weiterschreiben?“, im Tagebuch steht oben ein Hinweis. Entwürfe halten 14 Tage.
- **Mehrere auf einmal:** In Listen, im Tagebuch und bei den Orten einen Punkt gedrückt halten (am PC auch Strg-Klick),
  dann weitere antippen. Unten erscheint eine Leiste: abhaken, in eine andere Liste, anheften, in eine andere Reise
  verschieben (Kosten und Tankstopps wandern mit), als besucht markieren oder löschen. „Fertig“ oder die Zurück-Taste beendet.
- **Anheften 📌:** Wichtige Tagebuch-Einträge stehen oben unter „Angeheftet“ (im Eintrag „📌 Anheften“).
  Listenpunkte, Listen und Orte lassen sich in ihrem Fenster anheften und stehen dann ganz oben.

## Neu in Version 34

- **Zurück-Taste (Android):** schließt offene Fenster, verlässt ein Spiel oder das Anordnen und geht zur vorherigen Seite.
- **Wischen:** Auf den Hauptseiten mit dem Finger nach links oder rechts wischen wechselt zum nächsten Reiter
  (nicht auf der Karte; abschaltbar unter Einstellungen → Bedienung).
- **Untere Leiste selbst zusammenstellen:** Mehr → „Kacheln anordnen“ → „Untere Leiste“. Bis zu 4 Reiter, z. B. Tickets statt
  Boxen & Fächer. Was aus der Leiste fliegt, erscheint als Kachel unter „Mehr“. Jede Person hat ihre eigene Leiste.
- **PC und Tablet:** Ab 1100 Pixel Breite steht die Karte links und das Tagebuch rechts (abschaltbar unter Bedienung).
  Ab Version 35 folgt die Karte beim Scrollen: Sie zeigt die Stopps, die rechts gerade zu sehen sind, und hebt deren
  Strecke in Korallrot hervor. Mit der Maus über einem Eintrag wird er auf der Karte markiert. Ganz oben zeigt sie
  wieder die ganze Reise (ebenfalls unter Bedienung abschaltbar). Ab Version 36: Jeder Tag beginnt mit einem ausgefüllten
  Kreis mit Tagesnummer, die Fahrt über Nacht zum nächsten Tag ist gestrichelt, und kleine Pfeile zeigen die Fahrtrichtung.
- **Pinnwand** (Mehr): kurze Nachrichten an alle („Bin duschen“, „Essen ist fertig!“), einen Tag lang sichtbar,
  auch in der Heute-Karte und auf der Kinder-Startseite.
- **Tag teilen** (Heute-Karte): Punkte des Tages auswählen (Strecke, Stellplatz, Highlights …), jeden Satz selbst
  umschreiben, eigenen Satz und ein Foto dazu, dann per WhatsApp & Co. verschicken.
- **Teilen mit LAMMping:** In Google Maps, der Galerie oder im Browser „Teilen“ → LAMMping wählen (nur bei
  installierter App). Dann entscheiden: ins Tagebuch, auf die Wunschliste (mit Position aus dem Kartenlink) oder zu
  den Reiseideen, als neue Idee oder als Notiz zu einer bestehenden.
- **Unser Reisefoto** (Mehr): bei jeder Fahrt ein Foto mit demselben Motiv; alle Fotos nebeneinander. Die Heute-Karte
  erinnert, solange das Foto der laufenden Reise fehlt.
- **Tickets** (Mehr): Fähre, Campingplatz, Eintritt, Vignette mit Datum, Uhrzeit, Buchungsnummer und Bild vom QR-Code,
  auch ohne Netz. In den 2 Tagen davor steht ein Countdown in der Heute-Karte („in 2 Std. 15 Min.“).
- **Murmel-Labyrinth** (Spiele, Knobeln): Handy neigen, Kugel zum Stern rollen. 4 Stufen (Leicht bis Profi) mit je
  6 festen Bahnen und Bestzeiten je Person. Ohne Neigungssensor mit dem Finger ziehen oder mit den Pfeiltasten.
- **Sprach-Schnelleintrag:** Mikrofon-Knopf über „+ Eintrag“ im Tagebuch. Zum Beispiel „Tankstopp, 45 Liter,
  78 Euro 50“ oder „Stellplatz Seeblick, 25 Euro, vier Sterne“ – der Eintrag öffnet sich ausgefüllt zum Prüfen.
- **Bobbycar:** In Kinderkonten (einfache Ansicht) fährt oben ein Bobbycar statt des Campers.

## Bereiche im Überblick

- **Karte:** Route der Reise, gemerkte und geplante Orte. Der Ebenen-Knopf legt fest, was zu sehen ist: alle Symbole, nur Übernachtungen oder nur die Strecke; gemerkte Orte ein/aus,
  importierte GPX-Strecken, Auto-Standort.
- **Tagebuch:** je Reise **Planung** (Stellplätze und Sehenswertes vormerken, Listen und Extras
  zum Packen für diese Reise) und **Tagebuch** (Einträge unterwegs). „Hier sind wir“ macht aus
  einem geplanten Ort einen Tagebuch-Eintrag.
- **Tagebuch unterwegs:** Während einer laufenden Reise zeigt die **Heute-Karte** Reisetag, Wetter,
  Sonnenauf- und -untergang, das geparkte Auto und das nächste Ziel. Der Tageskopf zeigt Wetter, Kilometer
  (Luftlinie) und Länder des Tages. Das erste Foto eines Eintrags erscheint groß. Neue Einträge über den
  runden Knopf „+ Eintrag“ unten rechts.
- **Was ist in der Nähe?** (Lupe auf der Karte oder in der Heute-Karte): Trinkwasser, Entsorgung, WC und
  Dusche, Supermarkt, Bäcker, Tankstelle, Waschsalon, Werkstatt, Spielplatz, Baden, Stell- und Campingplätze
  sowie Apotheke, Arzt und Krankenhaus aus OpenStreetMap im Umkreis
  von 2, 5 oder 15 km. Treffer lassen sich ansteuern oder in die Wunschliste übernehmen.
- **Reiseblog** (Kachel unter „Mehr“, nur Verwalter): je Reise ein geheimer Link zum Lesen, z. B. für die
  Großeltern. Einstellbar: Begrüßungstext, Fotos, Texte, Highlights, Karte und „erst am nächsten Tag zeigen“
  (damit niemand sieht, wo ihr gerade seid). Nie zu sehen sind Kosten, Listen, Dokumente oder Namen. Einzelne
  Einträge blendet „Nicht im Reiseblog zeigen“ aus. „Aus“ oder „Neuen Link erzeugen“ machen den alten Link ungültig.
- **Leiste über dem Tagebuch:** Starten bzw. Beenden, Fotos einsortieren, Rückblick, Export und nach der
  Reise Packliste und Archiv – als Symbole, die sich die Breite teilen. „Starten“ setzt den Reisebeginn auf heute.
- **Postkarte** (in einem Eintrag mit Foto): Foto, Gruß, Text und Mini-Karte der Strecke als Bild zum
  Teilen, z. B. per WhatsApp.
- **Planung:** Zwischen den geplanten Orten stehen Kilometer und Fahrzeit (über den freien Routendienst
  von OpenStreetMap, ohne Netz grob geschätzt). Etappen über 4 Stunden werden markiert.
- **Fotos einsortieren** (Knopf über dem Tagebuch): Fotos aus der Galerie auswählen. LAMMping liest
  Aufnahmezeit und, falls vorhanden, den Ort aus den Fotos und schlägt den passenden Eintrag vor. Fotos ohne
  passenden Eintrag werden zu neuen Einträgen zusammengefasst. Manche Handys entfernen den Ort beim
  Auswählen, dann zählt nur die Zeit.
- **Diktieren:** Das Mikrofon im Textfeld eines Eintrags schreibt Gesprochenes mit (Spracherkennung des
  Handys; nicht jeder Browser kann das).
- **Neues Land:** Beim ersten Eintrag in einem neuen Land einer Reise erscheinen Tempo, Promille, Maut,
  Pflichtausstattung und Notruf.
- **Stellplatz-Steckbrief:** Untergrund, Sonne, Lärm, Abreise bis, Hunde erlaubt und „Wiederkommen?“.
  Bei Lieblingsplätzen steht „Gern wieder“ mit in der Liste.
- **Packliste auswerten** (nach „Reise beenden“): festhalten, was gefehlt hat und was nie gebraucht wurde.
  Beim Packen der nächsten Reise erscheinen die Hinweise; „Einpacken“ setzt Fehlendes direkt als Extra auf
  die Packliste.
- **Rückblick** (Knopf über dem Tagebuch): Die Strecke zeichnet sich Tag für Tag auf der Karte nach, an den
  Orten erscheinen Titel und Fotos. Pause und Tempo 1×, 2×, 4× unten.
- **Reisebudget** (in der Reise einstellen): Die Kasse zeigt, wie viel noch übrig ist und wie viel pro
  restlichem Tag bleibt; die Heute-Karte auch.
- **Highlight des Tages:** Jeder schreibt, was am schönsten war (mit Symbol). Steht im Tagebuch unter dem
  Tag, im Reiseheft und im Reiseblog. Verwalter können es auch für die Kinder eintragen.
- **Camper-Dienste** (unter Mehr): Abwasch, Wasser holen, Müll usw. werden jeden Tag reihum unter allen
  Mitreisenden verteilt. Abhaken bringt Punkte (und Reisepass-Stempel), „Tauschen“ gibt einen Dienst ab.
  Die Liste der Dienste ändern Verwalter.
- **Feedback** (unten auf „Mehr“ und in den Einstellungen): Was stört oder fehlt, landet in der Merkliste
  „LAMMping-Feedback“. „Alles kopieren“ in den Einstellungen gibt die Sammlung als Text weiter.
- **Schnellstart (Android):** Lange auf das LAMMping-Symbol drücken: „Ich bin hier“, „Auto geparkt“,
  „Einkaufsliste“ und „Highlight des Tages“. Die Einträge lassen sich auch einzeln auf den Startbildschirm
  ziehen. Auf dem iPhone geht das nicht; dort hilft die App „Kurzbefehle“ mit „URL öffnen“, z. B.
  `https://lammping.lamm7.de/lammping/#/karte/hier`.
- **Aus Google Maps importieren** (Seite „Reisen“): Zeitachse in Google Maps exportieren (Android:
  Einstellungen → Standort → Standortdienste → Zeitachse → „Zeitachsendaten exportieren“; iPhone: Google Maps →
  Einstellungen → Persönliche Inhalte), Datei auswählen, Zeitraum wählen (von Google erkannte Reisen werden
  vorgeschlagen). LAMMping macht daraus Strecke, Stellplätze (Übernachtungen) und Orte ab 25 Minuten Aufenthalt,
  dazu Fähren, Rad- und Fußtouren. Namen kommen von OpenStreetMap (etwa eine Sekunde pro Ort). Vor dem Übernehmen
  lässt sich alles abwählen, umbenennen und die Art ändern. Danach am besten „Fotos einsortieren“.
- **Reise beenden und exportieren** (im Tagebuch): „Reise beenden“ setzt das Ende auf heute, ins Archiv
  kommt die Reise erst mit „Ins Archiv“. „Exportieren“ erzeugt eine GPX-Datei (Strecke, Stopps, geplante
  Route) oder ein Reiseheft mit Streckenkarte, Etappen und Notizen: im Druckfenster „Als PDF speichern“.
- **Listen:** beliebig viele Einkaufs- und Merklisten, auf Wunsch einer Reise zugeordnet.
  Einträge antippen, um sie zu bearbeiten oder in eine andere Liste zu verschieben.
- **Boxen & Fächer:** Inventar mit Suche „Wo ist …?“, Packliste pro Reise mit Extras.
- **Eintragsarten im Tagebuch:** Stellplatz (Campingplatz, Stellplatz, frei stehen), Sehenswertes,
  Museum, Wanderung (Strecke, Höhenmeter, Dauer, GPX-Datei – mit Höhenprofil: Anstieg, Abstieg und höchster
  Punkt; fehlen in der Datei die Höhen, holt die App sie einmal aus dem Höhenmodell von Open-Meteo), Baden (See, Meer, Freibad …),
  Café / Restaurant, Spielplatz & Kinder, Tankstelle, Ver- und Entsorgung, Einkauf, Pause,
  Fähre & Maut, Werkstatt, Wäsche, Notiz. Bei Stellplatz, Baden, Café / Restaurant, Museum,
  Fähre, Werkstatt und Wäsche landen eingetragene Kosten automatisch in der Kasse (mit
  passender Kategorie). Die Filter im Tagebuch: Stellplätze, Erleben, Unterwegs, Notizen. In jedem Eintrag
  können Kinder ein Bild malen (wird wie ein Foto gespeichert) und Sprachnotizen aufnehmen (bis zwei Minuten).
- **Mehr:** Unten auf der Seite „Kacheln anordnen“: Kacheln kurz gedrückt halten und an die neue Stelle ziehen (mit der Maus einfach ziehen), mit dem Auge ausblenden, mit „Trennlinie“ eigene Gruppen mit Namen bilden und die Größe der Kacheln wählen (groß, mittel oder klein). Dasselbe gibt es unter „Spiele & Co“ mit „Spiele anordnen“; die Spiele sind dort schon in Gruppen sortiert (Unterwegs im Auto, Raten und Erzählen, Knobeln, Sammeln und Erinnern), für jede Person einzeln. Kasse, Tankbuch (Verbrauch von Vollbetankung zu Vollbetankung), Orte
  (Wunschliste, Lieblingsplätze, Geplantes), Checklisten (Abfahrt, Ankunft), Fahrzeug
  (Steckbrief und Fristen mit Erinnerung), Statistik (mit Jahresvergleich: Kilometer, Nächte, Tage, Länder,
  Reisen und Kosten pro Jahr), Reisen und Archiv, Einstellungen, außerdem:
  - *Wetter* am aktuellen Standort bzw. letzten Stellplatz (Open-Meteo, braucht Internet).
  - *Länderinfos:* Tempolimits, Promillegrenze, Maut, Pflichtausstattung, Notruf und Tipps für die
    Länder der Reise. Ohne Gewähr – vor der Fahrt beim ADAC bzw. Auswärtigen Amt prüfen (Links in der App).
  - *Dokumente & Notfall:* Ausweise, Versicherung usw. mit Foto und Ablaufdatum (nur Verwalter
    sehen die Dokumente). Notfallkontakte und medizinische Infos sehen alle.
  - *Fotoalbum* je Reise oder als Jahresrückblick.
  - *Kochen:* Rezepte für die Campingküche, Zutaten mit einem Tipp auf die Einkaufsliste.
  - *Autarkie:* Füllstand Wasser, Gas und Strom mit Schätzung der Resttage. Ein Eintrag
    „Ver- und Entsorgung“ mit Häkchen „Wasser getankt“ füllt den Wassertank wieder auf.
  - *Reiseideen:* Vorschläge für künftige Ziele mit Ort, Reisezeit und Dauer. Alle können Notizen und
    Links dazuschreiben und mit dem Herz zeigen, wem die Idee gefällt. „Reise planen“ macht daraus eine
    neue Reise; die Notizen landen auf Wunsch als Merkliste in deren Planung.
  - *Währung umrechnen* (in Länderinfos und Kasse): Franken, Kronen, Złoty, Forint und Pfund mit dem
    Tageskurs der EZB, ohne Internet mit dem zuletzt geladenen Kurs.
  - *Reisepass* (in Spiele & Co): ein eigener Pass für jede Person. Über 50 vorgegebene Stempel (Nächte,
    Kilometer, Länder, Fähre, Meer, Gipfel, Rad, Museen, Kennzeichen, Bingo, Quiz …) kommen automatisch, und
    zwar aus den Reisen, bei denen die Person dabei war (in der Reise unter „Wer ist dabei?“). Dazu ein
    Visum-Stempel für jedes neue Land und ein Stempel für jeden Ort mit fünf Sternen. Verwalter vergeben
    außerdem eigene Stempel mit Name, Symbol, Farbe und Datum. Neue Stempel erscheinen beim nächsten Öffnen
    mit einer kleinen Stempel-Animation. Neu: Höhen-Stempel (über 1000, 2000 und 3000 m, aus den GPX-Strecken),
    „Höhenmeter-Sammler“ und Kontinent-Stempel. „Drucken oder als PDF“ macht daraus einen Pass mit Deckblatt,
    Stempelseite, Visa und Traumorten – zum Einkleben ins Fotoalbum.
  - *Zuladung:* Leergewicht und zulässiges Gesamtgewicht aus dem Fahrzeug-Steckbrief, dazu Personen, Wasser,
    Gas, Boxen und weitere Posten (Fahrräder, Dachbox …). Zeigt, wie viel noch frei ist, und warnt bei Überladung.
  - *Autarkie – Solarstrom:* Mit Leistung (Wp) und Akku (Wh) schätzt die App aus der Sonnenvorhersage den Ertrag
    der nächsten vier Tage und ob der Strom reicht.
  - *Wetter – Gezeiten und Sternenhimmel:* An der Küste Ebbe und Flut für den Stellplatz (Open-Meteo, ohne Gewähr).
    Dazu Mondphase, ab wann es richtig dunkel ist, Wolken in der Nacht und Sternschnuppen-Nächte. Beides steht
    auch kurz in der Heute-Karte.
  - *Notfall – Hilfe in der Nähe:* Krankenhaus (mit Notaufnahme), Arzt, Apotheke und Tierarzt rund um den
    Stellplatz werden automatisch gesucht (OpenStreetMap) und für alle offline gespeichert.
  - *Lieblingsplätze weitergeben* (Orte → Lieblingsplätze): Auswahl als GPX-Datei oder als geheimer Link für
    befreundete Familien (Verwalter), mit Karte, Sternen, Ausstattung und auf Wunsch euren Notizen.
  - *Wasserwaage:* Handy flach in den Camper legen (Oberkante nach vorn). Die App zeigt, welches Rad wie viele
    Zentimeter auf den Keil muss. Radstand, Spurweite und Keilstufen lassen sich einstellen.
  - *Feiertage im Reiseland:* Die Heute-Karte warnt vor Feiertagen (heute bis übermorgen) und vor Sonntagen,
    an denen Supermärkte zu sind. Die Länderinfos zeigen die Feiertage der nächsten 60 Tage. Berechnet ohne Internet.
  - *Abstimmung:* Frage stellen (Vorlagen: Wohin morgen? Was machen wir heute? Was essen wir?), jeder stimmt am
    eigenen Handy ab. Offene Abstimmungen stehen in der Heute-Karte und auf der Kinder-Startseite.
  - *Urlaubsgeld:* Geldbeutel für jedes Kind. Verwalter geben Geld, die Kinder tragen ihre Ausgaben ein, auf
    Wunsch in Landeswährung (Franken, Kronen …).
  - *Vorfreude-Countdown:* Bei einer Reise, die noch kommt, zählt die Planung die Tage herunter, mit einer kleinen
    Aufgabe pro Tag zum Abhaken.
  - *Frage des Tages:* Ab 16 Uhr steht in der Heute-Karte eine Frage für den Abend. Die Antworten erscheinen im
    Tagebuch und im Reiseheft.
  - *Rubbelkarte:* Weltkarte, auf der sich alle bereisten Länder golden färben, je Person. Umschalten auf
    „Regionen“ zeigt Bundesländer, Kantone, Provinzen usw. (Europa, USA, Kanada, Australien, Neuseeland) mit
    „x von y“. Die Grenzen stammen von Natural Earth (gemeinfrei) und liegen in `vendor/welt`.
  - *Tier-Sammelbuch und Foto-Rallye* (in Spiele & Co): Tiere abhaken (häufig 1, besonders 2, selten 3 Punkte),
    mit Wertung und Reisepass-Stempeln. Die Foto-Rallye stellt acht Aufgaben; die Fotos ergeben eine Collage.
  - *Spiele für die Fahrt:* Autofarben-Wette, Schilder-Alphabet, Wer bin ich?, Tabu (mit Bildern, für Größere
    mit verbotenen Wörtern), Flaggen-Quiz (Europa oder Welt), Reise-Memory mit euren Fotos und Sudoku
    (4 × 4 oder 9 × 9, mit Zahlen oder Tieren, drei Schwierigkeitsstufen), Montagsmaler (einer malt, alle raten),
    Tic-Tac-Toe (zu zweit oder gegen das Handy) und Geschichten-Würfel (Bilder würfeln, Geschichte erfinden,
    auf Wunsch als Notiz ins Tagebuch).
  - *Spiele & Co:* neu „Wie lange noch?“ mit Restzeit und Ankunft bis zum nächsten geplanten Ziel oder
    einem gesuchten Ort, groß für die Rückbank. Kennzeichen sammeln (deutsche Kennzeichen mit Stadt/Kreis und internationale,
    mit Rangliste je Reise), Reise-Bingo, Stadt-Land-Fluss mit Zeitlimit, Kennzeichen-Quiz,
    Länder-Sticker und euer Spieleportal Spieleabend (`https://spieleabend.lamm7.de/`), das sich mit einem Tipp direkt öffnet;
    die Adresse lässt sich unter „Spieleportal einstellen“ ändern. Kennzeichen-Daten: Senatsverwaltung
    Berlin, CC BY 3.0.
- **Karte bearbeiten** (Stift-Knopf auf der Karte):
  - *Orte:* auf die Karte tippen fügt nachträglich einen Stellplatz, Sehenswertes, eine Tankstelle,
    Ver- und Entsorgung, einen Einkauf, eine Pause oder eine Notiz ein. Datum und Uhrzeit werden so
    vorgeschlagen, dass der Ort zwischen den nächstgelegenen Stopps landet. Stopps lassen sich ziehen.
  - *Strecke:* Punkte antippen zeichnet die gefahrene Strecke, Punkte ziehen, antippen löscht,
    ○ fügt einen Zwischenpunkt ein. „Straßen folgen“ legt die Linie automatisch auf die Straßen
    (über den freien Routendienst von OpenStreetMap, braucht Internet). Auch importierte
    GPX-Strecken lassen sich so korrigieren.
  - Lange auf die Karte drücken öffnet das Einfügen auch ohne Bearbeiten-Modus.
- **Darstellung:** hell, dunkel oder wie das Handy (Einstellungen → Darstellung).

Tankbuch und Kasse sehen nur Personen mit Kassen-Freigabe.

## Ausprobieren ohne loszufahren

Einstellungen → **Testen**:

- **Testdaten anlegen** erzeugt die Beispielreise „Test: Gardasee“ (Route von Innsbruck bis
  Verona mit Stellplätzen, Sehenswertem, Tankstopps, Fotos, Kasse, Strecke), Beispiel-Listen,
  -Boxen, -Orte, eine Frist und die geplante Reise „Test: Ostsee planen“. Alles ist mit „Test“
  gekennzeichnet und für die ganze Crew sichtbar. **Testdaten entfernen** löscht genau diese
  Einträge wieder, eure eigenen bleiben unberührt.
- **Standort simulieren**: Statt GPS gilt der orange Punkt auf der Karte als euer Standort.
  Punkt dorthin ziehen, dann „Ich bin hier …“, „Auto geparkt“ oder die Entfernung zum Auto
  ausprobieren. Häkchen wieder entfernen, um das echte GPS zu nutzen.
