#!/usr/bin/env python3
"""Baut dist/aufgaben-generator.html: eine einzige Datei, die offline im Browser läuft."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "src"
html = (src / "ui/index.html").read_text(encoding="utf8")
font = base64.b64encode((src / "assets/familjen-grotesk-latin.woff2").read_bytes()).decode()
core = ["rng.js", "content.js", "engine.js", "docx.js", "render-html.js"]
files = [src / "core" / f for f in core] + sorted((src / "types").glob("*.js")) + [src / "ui/app.js"]
dice = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>'
scripts = "\n".join(f"<script>\n// ---- {f.relative_to(root)} ----\n{f.read_text(encoding='utf8')}\n</script>" for f in files)
out = html.replace("__FONT__", font).replace("__DICE__", dice).replace("__SCRIPTS__", scripts)
dist = root / "dist"; dist.mkdir(exist_ok=True)
(dist / "aufgaben-generator.html").write_text(out, encoding="utf8")
print("dist/aufgaben-generator.html", len(out.encode()) // 1024, "KB,", len(files), "Skripte")
