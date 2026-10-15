"""Logo, Cliparts und Symbole für den Klassenrat – eine Quelle für Bögen, Word und Tool.

Alle Bilder sind als SVG beschrieben (ohne IDs, damit sie mehrfach inline
eingebettet werden können) und werden zusätzlich nach klassenrat/bilder/ geschrieben.
"""

from pathlib import Path

# Farben aus dem Schullogo
ROT = "#B4595E"
GRUEN = "#65A690"
GELB = "#F1D766"
GRAU = "#B9BABE"
DUNKEL = "#3A3A3A"

HAUT = ["#F6D3B3", "#E8B48A", "#C68B5E", "#8E5B3A"]
HAAR = ["#5A3A22", "#2F2522", "#C9853A", "#7A4A2A", "#1E1A18"]


def _svg(viewbox, inhalt, breite=None, hoehe=None):
    groesse = f' width="{breite}" height="{hoehe}"' if breite else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"{groesse}>{inhalt}</svg>'


# ---------------------------------------------------------------------------
# Schullogo (Nachzeichnung – nur Ersatz, falls bilder/logo.png fehlt)
# ---------------------------------------------------------------------------

LOGO = _svg("-8 0 216 108", f"""
<path d="M14,104 A82,74 0 0 1 100,30 L100,38.5 A75.5,65.5 0 0 0 21,104 Z" fill="{ROT}"/>
<path d="M100,30 A82,74 0 0 1 186,104 L179,104 A75.5,65.5 0 0 0 100,38.5 Z" fill="{GRUEN}"/>
<path d="M4,99 A92,84 0 0 1 100,19" fill="none" id="lg-a"/>
<path d="M100,19 A92,84 0 0 1 196,99" fill="none" id="lg-b"/>
<text font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="{ROT}" letter-spacing=".3">
  <textPath href="#lg-a" startOffset="7%">GRUNDSCHULE</textPath></text>
<text font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="bold" fill="{GRUEN}" letter-spacing=".3">
  <textPath href="#lg-b" startOffset="3%">MITTELSCHULE</textPath></text>
<circle cx="40" cy="12" r="8" fill="{GELB}"/>
<circle cx="168" cy="12" r="8" fill="#B5B5B5"/>
<text x="100" y="62" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="9.5" fill="#7A7A7A">Johann-Peter-Wagner</text>
<text x="178" y="100" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#7A7A7A">Theres</text>
""")


# ---------------------------------------------------------------------------
# Titelbild: Kinder im Klassenrat
# ---------------------------------------------------------------------------

def _kind(x, y, haut, haar, shirt, frisur="kurz", arm=False, s=1.0):
    teile = [f'<g transform="translate({x},{y}) scale({s})">']
    if arm:
        teile.append(f'<path d="M10,22 Q20,8 21,-12" stroke="{shirt}" stroke-width="7" fill="none" stroke-linecap="round"/>'
                     f'<circle cx="21" cy="-15" r="4.6" fill="{haut}"/>')
    teile.append(f'<path d="M-17,44 Q-17,15 0,15 Q17,15 17,44 Z" fill="{shirt}"/>')
    if frisur == "lang":
        teile.append(f'<path d="M-13,12 Q-15,-14 0,-14 Q15,-14 13,12 Z" fill="{haar}"/>')
    teile.append(f'<circle cx="0" cy="0" r="11.5" fill="{haut}"/>')
    if frisur in ("kurz", "lang"):
        teile.append(f'<path d="M-11.8,-1 Q-12.5,-14 0,-14 Q12.5,-14 11.8,-1 Q7,-9 -1,-8 Q-7,-8 -11.8,-1 Z" fill="{haar}"/>')
    elif frisur == "zoepfe":
        teile.append(f'<path d="M-11.8,-1 Q-12.5,-14 0,-14 Q12.5,-14 11.8,-1 Q6,-8 0,-8 Q-6,-8 -11.8,-1 Z" fill="{haar}"/>'
                     f'<circle cx="-14" cy="2" r="4.5" fill="{haar}"/><circle cx="14" cy="2" r="4.5" fill="{haar}"/>')
    elif frisur == "locken":
        teile.append("".join(f'<circle cx="{cx}" cy="{cy}" r="4.6" fill="{haar}"/>'
                             for cx, cy in ((-9, -6), (-4, -11), (3, -11.5), (9, -6), (11, 0), (-11, 0))))
    teile.append(f'<circle cx="-4" cy="0.5" r="1.4" fill="{DUNKEL}"/><circle cx="4" cy="0.5" r="1.4" fill="{DUNKEL}"/>'
                 f'<path d="M-4,4.6 Q0,7.6 4,4.6" stroke="{DUNKEL}" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
                 f'<circle cx="-7" cy="4" r="1.8" fill="#F0907F" opacity=".45"/><circle cx="7" cy="4" r="1.8" fill="#F0907F" opacity=".45"/>')
    teile.append("</g>")
    return "".join(teile)


def _blase(x, y, farbe, zeichen, links=True):
    schwanz = (f'M{x - 6},{y + 9} L{x - 9},{y + 17} L{x + 1},{y + 10} Z' if links
               else f'M{x + 6},{y + 9} L{x + 9},{y + 17} L{x - 1},{y + 10} Z')
    return (f'<path d="{schwanz}" fill="{farbe}"/><ellipse cx="{x}" cy="{y}" rx="13" ry="10.5" fill="{farbe}"/>'
            f'<text x="{x}" y="{y + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" '
            f'font-size="14" fill="#fff">{zeichen}</text>')


KLASSENRAT = _svg("0 0 250 118", "".join([
    _blase(58, 14, ROT, "!"), _blase(126, 9, GELB, "?"), _blase(196, 14, GRUEN, "♥", links=False),
    _kind(32, 54, HAUT[0], HAAR[2], GELB, "zoepfe"),
    _kind(78, 50, HAUT[2], HAAR[1], GRUEN, "kurz", arm=True),
    _kind(125, 54, HAUT[1], HAAR[0], ROT, "lang"),
    _kind(172, 50, HAUT[3], HAAR[4], "#6C8EBF", "locken"),
    _kind(218, 54, HAUT[0], HAAR[3], GRAU, "kurz"),
    f'<rect x="6" y="94" width="238" height="16" rx="8" fill="#D9A469"/>',
    f'<rect x="6" y="104" width="238" height="6" rx="3" fill="#C08A4F"/>',
    f'<rect x="38" y="88" width="24" height="9" rx="1.5" fill="#fff" stroke="{GRAU}" stroke-width="1"/>',
    f'<path d="M150,90 l26,-2" stroke="{ROT}" stroke-width="3" stroke-linecap="round"/>',
]))


# ---------------------------------------------------------------------------
# Symbole (64 x 64, farbig)
# ---------------------------------------------------------------------------

def _icon(inhalt):
    return _svg("0 0 64 64", inhalt)


def _gesicht(ring, mund):
    return _icon(f'<circle cx="32" cy="32" r="27" fill="{GELB}" stroke="{ring}" stroke-width="5"/>'
                 f'<circle cx="23" cy="26" r="3.6" fill="{DUNKEL}"/><circle cx="41" cy="26" r="3.6" fill="{DUNKEL}"/>'
                 f'<path d="{mund}" stroke="{DUNKEL}" stroke-width="4" fill="none" stroke-linecap="round"/>')


_DAUMEN = ("M14,30 h9 v26 h-9 z M23,30 L33,9 c5,0 7.5,3.5 6.5,8.5 L38,26 h15 c3.4,0 5.8,3 5.1,6.3 "
           "l-3.6,17.5 C53.9,52.8 51.6,56 48.4,56 H23 z")

ICONS = {
    "stern": _icon(f'<path d="M32 5l8.2 17 18.6 2.7-13.5 13.1 3.2 18.6L32 47.6 15.5 56.4l3.2-18.6L5.2 24.7 23.8 22z" '
                   f'fill="{GELB}" stroke="#D9A91E" stroke-width="3" stroke-linejoin="round"/>'
                   f'<circle cx="26" cy="30" r="2.6" fill="{DUNKEL}"/><circle cx="38" cy="30" r="2.6" fill="{DUNKEL}"/>'
                   f'<path d="M26 37q6 5 12 0" stroke="{DUNKEL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>'),
    "zurueck": _icon(f'<circle cx="32" cy="32" r="28" fill="{GRUEN}"/>'
                     f'<path d="M22 26h17a9 9 0 010 18H30" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
                     f'<path d="M28 17l-9 9 9 9" stroke="#fff" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "sprechen": _icon(f'<path d="M8 12h30a5 5 0 015 5v15a5 5 0 01-5 5H22l-9 8v-8H8a5 5 0 01-5-5V17a5 5 0 015-5z" fill="{ROT}"/>'
                      f'<path d="M30 27h26a5 5 0 015 5v13a5 5 0 01-5 5h-2v8l-9-8H30a5 5 0 01-5-5V32a5 5 0 015-5z" fill="{GRUEN}"/>'
                      f'<circle cx="14" cy="24.5" r="2.4" fill="#fff"/><circle cx="22" cy="24.5" r="2.4" fill="#fff"/>'
                      f'<circle cx="30" cy="24.5" r="2.4" fill="#fff"/>'
                      f'<path d="M34 37h18M34 43h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'),
    "haken": _icon(f'<circle cx="32" cy="32" r="28" fill="{GRUEN}"/>'
                   f'<path d="M18 33l9 9 19-20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "leute": _icon(f'<circle cx="18" cy="22" r="8" fill="{HAUT[1]}"/><path d="M4 50c0-10 6-17 14-17s14 7 14 17z" fill="{ROT}"/>'
                   f'<circle cx="46" cy="22" r="8" fill="{HAUT[2]}"/><path d="M32 50c0-10 6-17 14-17s14 7 14 17z" fill="{GRUEN}"/>'
                   f'<circle cx="32" cy="28" r="9" fill="{HAUT[0]}"/><path d="M16 58c0-11 7-19 16-19s16 8 16 19z" fill="{GELB}"/>'),
    "glocke": _icon(f'<path d="M16 44V30a16 16 0 0132 0v14l5 6H11z" fill="{GELB}" stroke="#D9A91E" stroke-width="3" stroke-linejoin="round"/>'
                    f'<circle cx="32" cy="55" r="5" fill="#D9A91E"/><circle cx="32" cy="10" r="4" fill="#D9A91E"/>'
                    f'<path d="M22 30a10 10 0 016-9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>'),
    "stift": _icon(f'<path d="M12 52l3-12L42 13l9 9-27 27z" fill="{GELB}" stroke="#D9A91E" stroke-width="2.5" stroke-linejoin="round"/>'
                   f'<path d="M42 13l4-4a4 4 0 016 0l3 3a4 4 0 010 6l-4 4z" fill="#F08A9A"/>'
                   f'<path d="M12 52l3-12 9 9z" fill="#F3DDB8"/><path d="M12 52l1.4-5.6 4.2 4.2z" fill="{DUNKEL}"/>'
                   f'<path d="M38 17l9 9" stroke="#D9A91E" stroke-width="2.5"/>'),
    "uhr": _icon(f'<rect x="14" y="5" width="36" height="6" rx="3" fill="{GRAU}"/><rect x="14" y="53" width="36" height="6" rx="3" fill="{GRAU}"/>'
                 f'<path d="M18 11h28c0 13-10 15-10 21s10 8 10 21H18c0-13 10-15 10-21s-10-8-10-21z" fill="#EAF4F8" stroke="{GRAU}" stroke-width="2.5"/>'
                 f'<path d="M22 16h20c-1 6-10 9-10 12-1-3-9-6-10-12z" fill="{GELB}"/>'
                 f'<path d="M21 51c2-6 7-8 11-9 4 1 9 3 11 9z" fill="{GELB}"/><path d="M32 30v12" stroke="{GELB}" stroke-width="2"/>'),
    "regel": _icon(f'<rect x="20" y="3" width="24" height="52" rx="7" fill="{DUNKEL}"/><rect x="29" y="55" width="6" height="7" fill="{GRAU}"/>'
                   f'<circle cx="32" cy="15" r="7" fill="{ROT}"/><circle cx="32" cy="29" r="7" fill="{GELB}"/>'
                   f'<circle cx="32" cy="43" r="7" fill="{GRUEN}"/>'),
    "daumen_hoch": _icon(f'<path d="{_DAUMEN}" fill="{GRUEN}" stroke="#2C7962" stroke-width="2.5" stroke-linejoin="round"/>'),
    "daumen_runter": _icon(f'<g transform="rotate(180 32 32)"><path d="{_DAUMEN}" fill="{ROT}" stroke="#8C2230" '
                           f'stroke-width="2.5" stroke-linejoin="round"/></g>'),
    "froh": _gesicht(GRUEN, "M20 38q12 11 24 0"),
    "mittel": _gesicht(GELB, "M21 41h22"),
    "traurig": _gesicht(ROT, "M20 45q12-10 24 0"),
    "wandzeitung": _icon(f'<rect x="4" y="8" width="56" height="44" rx="4" fill="#D9A469" stroke="#B07A3F" stroke-width="3"/>'
                         f'<rect x="10" y="14" width="16" height="15" fill="{GELB}" transform="rotate(-6 18 21)"/>'
                         f'<rect x="32" y="13" width="20" height="14" fill="#fff"/>'
                         f'<rect x="12" y="33" width="18" height="13" fill="#F4B3BC"/>'
                         f'<rect x="35" y="31" width="17" height="15" fill="#BDE3D6" transform="rotate(5 43 38)"/>'
                         f'<circle cx="18" cy="16" r="2" fill="{ROT}"/><circle cx="42" cy="15" r="2" fill="{GRUEN}"/>'
                         f'<circle cx="21" cy="35" r="2" fill="{GRUEN}"/><circle cx="43" cy="33" r="2" fill="{ROT}"/>'
                         f'<path d="M24 52l-6 9M40 52l6 9" stroke="#B07A3F" stroke-width="3" stroke-linecap="round"/>'),
    "idee": _icon(f'<path d="M32 6a18 18 0 00-11 32c3 2.4 4 5 4 8h14c0-3 1-5.6 4-8A18 18 0 0032 6z" fill="{GELB}" '
                  f'stroke="#D9A91E" stroke-width="3"/><rect x="24" y="48" width="16" height="5" rx="2" fill="{GRAU}"/>'
                  f'<rect x="26" y="55" width="12" height="5" rx="2" fill="{GRAU}"/>'
                  f'<path d="M26 22a8 8 0 016-6" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>'),
    "hand": _icon(f'<path d="M22 58c-6-4-11-12-12-18l-2-8c-.6-2.6 2.9-4.2 4.6-2l6 8V12a3.5 3.5 0 017 0v16-20a3.5 3.5 0 017 0v20-17'
                  f'a3.5 3.5 0 017 0v17-12a3.5 3.5 0 017 0v24c0 8-3 13-7 18z" fill="{HAUT[1]}" stroke="#B9835A" stroke-width="2.5" '
                  f'stroke-linejoin="round"/>'),
    "beschluss": _icon(f'<path d="M12 4h28l12 12v44H12z" fill="#fff" stroke="{GRAU}" stroke-width="3" stroke-linejoin="round"/>'
                       f'<path d="M40 4v12h12" fill="#EEE" stroke="{GRAU}" stroke-width="3" stroke-linejoin="round"/>'
                       f'<path d="M19 22h16M19 30h24M19 38h12" stroke="{GRAU}" stroke-width="3" stroke-linecap="round"/>'
                       f'<circle cx="45" cy="48" r="12" fill="{GRUEN}"/>'
                       f'<path d="M39 48l4.5 4.5 8-9" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "kalender": _icon(f'<rect x="6" y="10" width="52" height="48" rx="6" fill="#fff" stroke="{GRAU}" stroke-width="3"/>'
                      f'<path d="M6 16a6 6 0 016-6h40a6 6 0 016 6v8H6z" fill="{ROT}"/>'
                      f'<rect x="17" y="4" width="5" height="12" rx="2.5" fill="{DUNKEL}"/><rect x="42" y="4" width="5" height="12" rx="2.5" fill="{DUNKEL}"/>'
                      + "".join(f'<rect x="{x}" y="{y}" width="8" height="7" rx="1.5" fill="{c}"/>'
                                for x, y, c in ((14, 30, "#E5E5E5"), (28, 30, "#E5E5E5"), (42, 30, GELB),
                                                (14, 43, "#E5E5E5"), (28, 43, GRUEN), (42, 43, "#E5E5E5")))),
    "unterschrift": _icon(f'<path d="M6 46c6-14 10-26 14-26s-2 26 4 26 8-18 12-18-1 14 4 14 6-6 9-8" stroke="{DUNKEL}" '
                          f'stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
                          f'<path d="M6 54h52" stroke="{GRAU}" stroke-width="3" stroke-linecap="round"/>'),
}

# Zugriff für die Druckvorlagen: Bilder mit Namen
ALLE = {"logo": LOGO, "klassenrat": KLASSENRAT, **ICONS}


def schreiben(ziel: Path):
    ziel.mkdir(parents=True, exist_ok=True)
    for name, svg in ALLE.items():
        (ziel / f"{name}.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    schreiben(Path(__file__).resolve().parent.parent / "bilder")
