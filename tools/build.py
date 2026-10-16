#!/usr/bin/env python3
"""Baut die Offline-Dateien in dist/:
- aufgaben-generator.html  (Lehrkraft: Arbeitsblätter, Word, OneNote)
- ueben.html               (Schüler: Aufgaben am Bildschirm üben)
"""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "src"
font = base64.b64encode((src / "assets/familjen-grotesk-latin.woff2").read_bytes()).decode()
dice = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>'
types = sorted((src / "types").glob("*.js"))


def build(template, core, app, out):
    files = [src / "core" / f for f in core if (src / "core" / f).exists()] + types + [src / "ui" / app]
    html = (src / "ui" / template).read_text(encoding="utf8")
    scripts = "\n".join(f"<script>\n// ---- {f.relative_to(root)} ----\n{f.read_text(encoding='utf8')}\n</script>" for f in files)
    html = html.replace("__FONT__", font).replace("__DICE__", dice).replace("__SCRIPTS__", scripts)
    dist = root / "dist"; dist.mkdir(exist_ok=True)
    (dist / out).write_text(html, encoding="utf8")
    print(f"dist/{out}", len(html.encode()) // 1024, "KB,", len(files), "Skripte")


build("index.html", ["rng.js", "content.js", "engine.js", "topics.js", "figures.js", "docx.js", "render-html.js", "onenote.js", "sheet-image.js"], "app.js", "aufgaben-generator.html")
build("ueben.html", ["rng.js", "content.js", "engine.js", "topics.js", "figures.js", "docx.js", "render-html.js", "check-answer.js"], "ueben.js", "ueben.html")
