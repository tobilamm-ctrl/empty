// Jahrgangsübergreifende Themen: Aufgabentypen aller Klassen nach Inhalt ordnen.
// Ein Typ kann sein Thema mit `topic: "<id>"` selbst angeben, sonst wird es aus id/Lernbereich abgeleitet.
(function (AG) {
  const TOPICS = [
    { id: "zahlen", title: "Zahlen und Rechnen" },
    { id: "brueche", title: "Brüche und Dezimalzahlen" },
    { id: "prozent", title: "Prozent- und Zinsrechnung" },
    { id: "terme", title: "Terme und Gleichungen" },
    { id: "zuordnung", title: "Zuordnungen und Funktionen" },
    { id: "groessen", title: "Größen und Maßstab" },
    { id: "winkel", title: "Winkel und Figuren" },
    { id: "flaechen", title: "Umfang und Flächeninhalt" },
    { id: "koerper", title: "Körper: Oberfläche und Volumen" },
    { id: "daten", title: "Daten, Diagramme und Wahrscheinlichkeit" },
    { id: "potenzen", title: "Potenzen und Wurzeln" },
  ];

  // Einzelne Typen, deren Lernbereich nicht zum Inhalt passt
  const OVERRIDE = {
    "m7-bruchdivision": "brueche",
    "m7-masstab": "groessen",
    "m7-prisma-oberflaeche": "koerper",
    "m7-flaeche-para-dreieck": "flaechen",
  };

  function topicOf(type) {
    if (type.topic) return type.topic;
    if (OVERRIDE[type.id]) return OVERRIDE[type.id];
    // zuerst der Typ-Titel (eindeutiger), dann der Lernbereich
    if (/Winkel|Dreieck/i.test(type.title) && !/Prisma/i.test(type.title)) return "winkel";
    const s = type.title + " " + type.lbTitle;
    if (/Prozent|Zins|Promille/i.test(s)) return "prozent";
    if (/Potenz|Wurzel|Quadratzahl/i.test(s)) return "potenzen";
    if (/Bruch|Dezimal/i.test(s)) return "brueche";
    if (/Gleichung|Term/i.test(s)) return "terme";
    if (/Proportional|Funktion|Zuordnung|Graph/i.test(s)) return "zuordnung";
    if (/Rauminhalt|Körper|Prisma|Zylinder|Pyramide|Kegel|Kugel|Quader/i.test(s)) return "koerper";
    if (/Fläche|Umfang|Kreis/i.test(s)) return "flaechen";
    if (/Diagramm|Daten|Kennwert|Zufall|Wahrscheinlich|Statistik/i.test(s)) return "daten";
    if (/Größe|Maßstab/i.test(s)) return "groessen";
    if (/Geometri|Winkel|Dreieck|Figur/i.test(s)) return "winkel";
    return "zahlen";
  }

  // Bezeichnung „Kl. 7“, „Kl. 7 M“ für Auswahllisten
  function gradeLabel(type, zug) {
    return "Kl. " + type.klasse + (type.zug === "M" && zug !== "M" ? " M" : "");
  }

  AG.TOPICS = TOPICS;
  AG.topicOf = topicOf;
  AG.topicTitle = id => (TOPICS.find(t => t.id === id) || { title: id }).title;
  AG.gradeLabel = gradeLabel;
})(typeof AG !== "undefined" ? AG : (globalThis.AG = {}));
