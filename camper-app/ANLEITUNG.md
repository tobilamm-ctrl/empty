# Bordbuch – Einrichtung

Das Bordbuch ist eine Web-App für euren Minicamper: Karte mit Reiseroute, Tagebuch mit
Stellplätzen und Sehenswertem, Auto-Standort, Einkaufs- und Merkliste, Boxen-Inventar mit
Packliste, Kassenbuch und ein Archiv aller Reisen.

Ohne weitere Einrichtung läuft die App im **Testmodus**: Alles bleibt auf dem jeweiligen Gerät.
Für den gemeinsamen Zugriff braucht es einmalig Firebase (Schritt 2).

## 1. Auf den Hetzner-Webspace hochladen

1. In der konsoleH für die Domain **SSL aktivieren** (kostenloses Let's-Encrypt-Zertifikat).
   Ohne HTTPS funktionieren GPS und die Offline-Funktion nicht.
2. Den **Inhalt** des Ordners `camper-app` per SFTP (z. B. mit FileZilla) in einen Ordner auf
   dem Webspace kopieren, z. B. `public_html/bordbuch`. Die Datei `.htaccess` mitkopieren
   (in FileZilla ggf. „Versteckte Dateien anzeigen“ einschalten).
3. `https://eure-domain.de/bordbuch/` im Handy-Browser öffnen.
4. Auf den Startbildschirm legen:
   - **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
   - **Android (Chrome):** Menü ⋮ → „App installieren“

Die Dateien `ANLEITUNG.md` und `firestore.rules` müssen nicht mit hoch.

## 2. Firebase für den gemeinsamen Zugriff (ca. 10 Minuten, kostenlos)

1. Auf <https://console.firebase.google.com> mit einem Google-Konto anmelden →
   **Projekt hinzufügen**, Name z. B. `bordbuch`. Google Analytics wird nicht gebraucht.
2. **Datenbank anlegen:** Links „Erstellen“ → **Firestore Database** → „Datenbank erstellen“.
   Standort `europe-west3 (Frankfurt)`, Modus „Produktionsmodus“.
3. **Regeln eintragen:** In Firestore auf den Reiter **Regeln**, den Inhalt der Datei
   `firestore.rules` einfügen, eure beiden E-Mail-Adressen eintragen → **Veröffentlichen**.
4. **Anmeldung einschalten:** Links „Erstellen“ → **Authentication** → „Los gehts“ →
   Anmeldemethode **E-Mail/Passwort** aktivieren.
5. **Eure zwei Konten anlegen:** In Authentication auf den Reiter **Nutzer** → „Nutzer
   hinzufügen“, einmal für jede/n von euch (dieselben Adressen wie in den Regeln).
6. **Domain freigeben:** Authentication → **Einstellungen** → „Autorisierte Domains“ →
   eure Domain hinzufügen (z. B. `eure-domain.de`).
7. **Web-App registrieren:** Zahnrad oben links → **Projekteinstellungen** → unten bei
   „Meine Apps“ auf das Symbol `</>` → Name `Bordbuch` → registrieren. Firebase zeigt jetzt
   einen Block `const firebaseConfig = { apiKey: …, … }`.
8. Diese Werte in `config.js` eintragen (statt `firebase: null`):

   ```js
   window.CAMPER_CONFIG = {
     firebase: {
       apiKey: "…",
       authDomain: "bordbuch-xxxx.firebaseapp.com",
       projectId: "bordbuch-xxxx",
       storageBucket: "bordbuch-xxxx.appspot.com",
       messagingSenderId: "…",
       appId: "…"
     },
   };
   ```

9. `config.js` neu hochladen, App neu öffnen und anmelden. Fertig.

Der `apiKey` ist kein Geheimnis, er darf in der Datei stehen. Geschützt sind eure Daten durch
die Regeln aus Schritt 3: Nur eure zwei Konten können lesen und schreiben.

**Testdaten übernehmen:** Vorher im Testmodus unter Einstellungen → „Sicherung herunterladen“,
nach der Anmeldung → „Sicherung einspielen“.

**Kosten:** Firebase bleibt für zwei Personen im kostenlosen Spark-Tarif. Fotos werden
verkleinert (ca. 200–300 KB) in der Datenbank gespeichert; 1 GB reicht für einige tausend Fotos.

## 3. Updates einspielen

Nach Änderungen an der App die geänderten Dateien hochladen und in `sw.js` die Zeile
`const VERSION = 'bordbuch-1'` hochzählen (`bordbuch-2` …). Beim nächsten Öffnen mit Netz
holen sich die Handys die neue Version.

## Gut zu wissen

- **Offline:** Die App, eure Daten und bereits angesehene Kartenausschnitte sind ohne Netz
  verfügbar. Einträge ohne Netz werden gespeichert und später synchronisiert.
- **Route:** Die Linie auf der Karte verbindet eure Einträge mit Position in zeitlicher
  Reihenfolge. Eine lückenlose Aufzeichnung während der Fahrt kann eine Web-App nicht leisten
  (das Handy stoppt die Ortung im Hintergrund). Geplant für Stufe 2: GPX-Import aus einer
  Tracking-App wie OsmAnd oder Komoot.
- **Ortsnamen** werden über OpenStreetMap (Nominatim) ermittelt, wenn ihr die aktuelle
  Position übernehmt.
