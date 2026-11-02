<?php
// Druckblatt einer Einladung: großer QR-Code, Link und kurze Anleitung (A4, hell)
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

require_admin();
$id = (string)($_GET['id'] ?? '');
$inv = invites();
$i = $inv[$id] ?? null;
if (!$i) {
    header('Location: admin.php');
    exit;
}
$url = invite_url($i);
$left = (int)($i['max'] - $i['used']);
header('Content-Type: text/html; charset=utf-8');
send_frame_policy();
?><!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Einladung drucken · <?= h(APP_NAME) ?></title>
<link rel="stylesheet" href="<?= h(asset_url('assets/fonts.css')) ?>">
<style>
  :root { color-scheme: light; --ink: #1e1d24; --muted: #5d5a6b; --accent: #f4cb4d; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e9e7ef; color: var(--ink); font-family: "Nunito", "Segoe UI", system-ui, sans-serif; padding: 16px; }
  .tools { max-width: 210mm; margin: 0 auto 12px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .tools button, .tools a { border: 0; border-radius: 999px; padding: 10px 20px; font: inherit; font-weight: 800; cursor: pointer; background: #fff; color: var(--ink); text-decoration: none; }
  .tools button.primary { background: var(--accent); }
  .tools .hint { color: var(--muted); font-size: 14px; }
  .sheet { background: #fff; max-width: 210mm; min-height: 270mm; margin: 0 auto; padding: 18mm 16mm; display: grid; align-content: start; justify-items: center; gap: 8mm; text-align: center; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,.12); }
  .brand { font-family: "Lilita One", "Arial Rounded MT Bold", sans-serif; font-size: 15mm; line-height: 1; letter-spacing: .5px; margin: 0; }
  .brand span { background: var(--accent); padding: 0 3mm; border-radius: 3mm; }
  h1 { font-family: "Lilita One", "Arial Rounded MT Bold", sans-serif; font-weight: 400; font-size: 9mm; margin: 0; }
  .label { font-size: 6mm; font-weight: 800; margin: -4mm 0 0; }
  .qr { width: 95mm; height: 95mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .url { font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace; font-size: 4.2mm; word-break: break-all; background: #f3f1f7; padding: 3mm 4mm; border-radius: 2mm; max-width: 170mm; }
  ol { text-align: left; font-size: 5mm; line-height: 1.45; margin: 0; padding-left: 8mm; max-width: 160mm; }
  ol li + li { margin-top: 2mm; }
  .meta { color: var(--muted); font-size: 4mm; margin: 0; }
  @page { size: A4; margin: 0; }
  @media print {
    body { background: #fff; padding: 0; }
    .tools { display: none; }
    .sheet { box-shadow: none; border-radius: 0; max-width: none; min-height: 0; height: 297mm; }
  }
</style></head>
<body>
  <div class="tools">
    <button class="primary" type="button" onclick="window.print()">Drucken</button>
    <a href="admin.php">← Zur Verwaltung</a>
    <span class="hint">Tipp: Im Druckdialog „Kopf- und Fußzeilen“ ausschalten.</span>
  </div>
  <main class="sheet">
    <p class="brand"><span><?= h(APP_NAME) ?></span></p>
    <h1>Du bist eingeladen!</h1>
    <?php if ($i['label'] !== ''): ?><p class="label"><?= h($i['label']) ?></p><?php endif; ?>
    <div class="qr" id="qr" role="img" aria-label="QR-Code der Einladung"></div>
    <ol>
      <li>QR-Code mit der Handy-Kamera scannen oder die Adresse unten eintippen.</li>
      <li>Namen, Benutzernamen und ein eigenes Passwort wählen.</li>
      <li>Fertig: Alle Spiele stehen bereit, auch online mit den anderen.</li>
    </ol>
    <div class="url"><?= h($url) ?></div>
    <p class="meta">Gültig bis <?= h(date_de((int)$i['expires'])) ?> · für <?= $left === 1 ? '1 Person' : 'bis zu ' . $left . ' Personen' ?></p>
  </main>
  <script src="<?= h(asset_url('assets/qrcode.js')) ?>"></script>
  <script>
    const q = qrcode(0, 'M'); q.addData(<?= json_encode($url, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) ?>); q.make();
    document.getElementById('qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  </script>
</body></html>
