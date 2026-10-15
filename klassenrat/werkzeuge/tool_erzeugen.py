"""Baut das digitale Tool: bettet Logo und Cliparts in die Vorlage ein.

Aufruf:  python3 klassenrat/werkzeuge/tool_erzeugen.py
Ergebnis: klassenrat/digital/klassenrat-tool.html (eine einzige Datei, offline nutzbar)
"""

import base64
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bilder  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def main():
    # Kein Schullogo im Tool: es wird öffentlich bereitgestellt. Das Logo lädt jede Schule lokal unter „Daten“.
    bilder_js = dict(bilder.ALLE)
    icon = base64.b64encode((ROOT / "digital" / "apple-touch-icon.png").read_bytes()).decode()
    fav = base64.b64encode((ROOT / "digital" / "favicon.png").read_bytes()).decode()
    vorlage = (ROOT / "werkzeuge" / "tool_vorlage.html").read_text(encoding="utf-8")
    html = vorlage.replace("/*__BILDER__*/", "const BILDER = " + json.dumps(bilder_js, ensure_ascii=False) + ";")
    html = html.replace("__APP_ICON__", icon).replace("__FAVICON__", fav)
    ziel = ROOT / "digital" / "klassenrat-tool.html"
    ziel.parent.mkdir(exist_ok=True)
    ziel.write_text(html, encoding="utf-8")
    print("geschrieben:", ziel.relative_to(ROOT.parent))


if __name__ == "__main__":
    main()
