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
