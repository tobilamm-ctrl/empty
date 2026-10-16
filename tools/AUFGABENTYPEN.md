# Aufgabentypen schreiben – Anleitung

Ein Aufgabentyp ist eine Datei `src/types/<id>.js`, die genau einen oder mehrere Typen mit
`AG.registerType({...})` anmeldet. Vorbild: `src/types/m7-bruchdivision.js` – erst lesen!

## Dateigerüst

```js
// M7 LB 1: Prozentwert berechnen.
(function (AG) {
  const { Frac, num, rich, MINUS, fmtDec, fmtInt } = AG;
  AG.registerType({ ... });
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
```

Kein `import`, kein `require`, keine Browser-APIs. Reines JavaScript (ES2020).

## Felder

| Feld | Bedeutung |
|---|---|
| `id` | eindeutig, Präfix `m7-` (M-Zug Kl. 7), z. B. `m7-prozentwert` |
| `klasse`, `zug` | `"7"`, `"M"` |
| `lb`, `lbTitle` | Lernbereich-Nummer als String und Titel laut Lehrplan |
| `title` | kurzer Name für die Auswahlliste, z. B. „Prozentwert berechnen“ |
| `instruction` | Arbeitsanweisung über den Aufgaben, String oder `{1: "...", 2: "...", 3: "..."}` je Niveau |
| `merke` | Merke-Kasten, Rich-Array (siehe unten), 1–2 Sätze + Beispiel |
| `cols` | Spalten auf dem Blatt: 1 (lange Textaufgaben), 2 oder 3 (kurze Rechnungen) |
| `levels` | Standard `[1, 2, 3]` |
| `generate(rng, level)` | liefert `{ q, a, steps }` – siehe unten |
| `verify(task, level)` | optional; gibt `true` oder eine Fehlermeldung zurück |

## generate(rng, level)

Rückgabe:
- `q`: die Aufgabe (Rich-Array)
- `a`: das Endergebnis (Rich-Array), so wie es im Lösungsblatt stehen soll
- `steps`: Array von Rich-Arrays, die Zwischenschritte (jede Zeile ein Schritt), optional aber erwünscht
- optional `table: { rows: [[Rich, Rich, ...], ...] }` für eine Tabelle unter der Aufgabe
  (z. B. Wertetabelle mit Lücken `{ blank: 3 }`) und `aTable` mit den gefüllten Werten fürs Lösungsblatt

`rng` ist ein Zufallsgenerator mit Startwert. **Nur ihn benutzen, nie `Math.random()`**, sonst lässt sich ein Blatt nicht wieder erzeugen.
- `rng.int(min, max)` ganze Zahl inklusive Grenzen
- `rng.intExcept(min, max, [ausgeschlossen])`
- `rng.signedInt(min, max)` ±(min..max)
- `rng.pick(array)`, `rng.chance(0.3)`, `rng.shuffle(array)`

Niveaus: 1 = ★ Grundaufgabe, 2 = ★★ mittel, 3 = ★★★ anspruchsvoll (Mittelschule M-Zug, Klasse 7 – realistisch bleiben!).

## Rich-Arrays (Inhaltsmodell)

Ein Rich-Array ist eine Liste von Segmenten:
- `"Text"`
- `{ f: [zähler, nenner] }` Bruch, `{ f: [1, 4], w: 2 }` = 2¼, `{ f: [3, 4], s: -1 }` = −¾
- `{ b: "fett" }`, `{ sup: "2" }`, `{ blank: 4 }` (Lücke), `{ br: true }` (Zeilenumbruch innerhalb der Aufgabe)

**Immer mit Hilfsfunktionen bauen:**
- `rich(a, b, c, ...)` fügt Teile (auch Arrays) flach zusammen
- `num(x, opts)` Zahl → Rich-Array. `x` darf eine ganze Zahl oder ein `Frac` sein.
  - `{ as: "dec" }` Dezimalzahl mit Komma (`new Frac(125, 100)` → „1,25“), `{ as: "dec", digits: 2 }` feste Stellen
  - `{ as: "improper" }` unechter Bruch statt gemischter Zahl
  - `{ paren: true }` negative Zahl in Klammern: `(−3)`
- `fmtDec(x, digits)` / `fmtInt(n)` liefern Strings (für Text mitten im Satz)
- `MINUS` ist das echte Minuszeichen „−“. **Nie den Bindestrich `-` für negative Zahlen oder Rechenzeichen benutzen.**

**Mit `Frac` rechnen, nicht mit Kommazahlen** (keine Rundungsfehler): `new Frac(3, 4).add(1).mul(new Frac(2, 5))`.
Methoden: `add sub mul div neg abs inv cmp eq isInt sign isTerminating decimals`. `Frac.of(3)` macht aus 3 einen Bruch.
Dezimalzahlen erzeugen als `new Frac(rng.int(1, 999), 100)` und mit `num(x, { as: "dec" })` ausgeben.

## Regeln für „schöne“ Aufgaben (wichtig!)

1. Ergebnisse gehen glatt auf (Divisionen ohne Rest, Prozentwerte mit höchstens 2 Nachkommastellen, Geldbeträge auf Cent).
2. Keine Trivialaufgaben (nicht ·1, nicht +0, nicht 100 %, nicht x = 0, keine identischen Zahlen, …). Bei Bedarf in einer Schleife neu würfeln.
3. Genug Abwechslung: Der Test verlangt mindestens 40 verschiedene Aufgaben je Niveau.
4. Zahlen passend zur Klasse 7: überschaubare Größen, Kopf- bzw. Schriftrechnung möglich.
5. Brüche in Ergebnissen als gekürzte gemischte Zahl (Standard von `num`).
6. Deutsche Schreibweise: Dezimalkomma, `·` für mal, `:` für geteilt, `€` nach dem Betrag mit Leerzeichen („12,50 €“), `%` mit Leerzeichen („15 %“).
7. Schritte in `steps` so, wie eine Lehrkraft sie an die Tafel schreiben würde – kurz.
8. Sätze kurz und klar, Mittelschul-Niveau, Sachkontexte aus dem Alltag der Schüler (Taschengeld, Sport, Einkauf, Schule …), abwechselnd.

## Testen

```
node tools/test-types.js m7-prozent --samples 5
```
Läuft für jedes Niveau 300 Aufgaben durch und zeigt Beispiele. Muss mit „Alle Prüfungen bestanden.“ enden.
Danach die Beispiele **selbst nachrechnen** – der Test prüft nur die Form, nicht die Mathematik.
Ein `verify` hilft: z. B. bei Gleichungen die Lösung einsetzen und prüfen.
