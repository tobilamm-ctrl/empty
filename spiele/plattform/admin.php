<?php
// Verwaltung: Konten anlegen, Passwort zurücksetzen, Rechte, löschen.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$user = require_admin();
$msg = isset($_GET['neu']) ? 'Dein Konto ist angelegt. Jetzt kannst du Konten für die anderen anlegen.' : null;
$err = null;
$fresh = null;   // gerade erzeugte Einladung (hervorheben)

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $all = users();
    $target = strtolower(trim((string)($_POST['username'] ?? '')));
    $action = (string)($_POST['action'] ?? '');
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $err = 'Bitte das Formular noch einmal absenden.';
    } elseif ($action === 'invite') {
        $days = (int)($_POST['days'] ?? 7);
        $max = (int)($_POST['max'] ?? 1);
        $label = trim((string)($_POST['label'] ?? ''));
        if (!in_array($days, [1, 7, 30], true) || !in_array($max, [1, 5, 20], true)) {
            $err = 'Bitte Gültigkeit und Anzahl auswählen.';
        } elseif (mb_strlen($label) > 40) {
            $err = 'Bezeichnung: höchstens 40 Zeichen.';
        } else {
            $fresh = bin2hex(random_bytes(4));
            with_lock(function () use ($fresh, $days, $max, $label, $user) {
                $inv = invites();
                $inv[$fresh] = [
                    'token' => rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '='),
                    'label' => $label, 'by' => $user['username'], 'created' => time(),
                    'expires' => time() + $days * 86400, 'max' => $max, 'used' => 0, 'accounts' => [],
                ];
                save_invites($inv);
            });
            $msg = 'Einladung erzeugt. Link teilen oder QR-Code drucken.';
        }
    } elseif ($action === 'revoke') {
        $id = (string)($_POST['id'] ?? '');
        with_lock(function () use ($id) {
            $inv = invites();
            unset($inv[$id]);
            save_invites($inv);
        });
        $msg = 'Einladung zurückgezogen. Der Link funktioniert nicht mehr.';
    } elseif ($action === 'add') {
        $name = trim((string)($_POST['name'] ?? ''));
        $pass = (string)($_POST['password'] ?? '');
        if (!valid_username($target)) {
            $err = 'Benutzername: 2–32 Zeichen, nur Kleinbuchstaben, Ziffern, Punkt, Minus, Unterstrich.';
        } elseif (isset($all[$target])) {
            $err = 'Diesen Benutzernamen gibt es schon.';
        } elseif ($name === '' || mb_strlen($name) > 24) {
            $err = 'Anzeigename: 1–24 Zeichen.';
        } elseif (mb_strlen($pass) < MIN_PASSWORD) {
            $err = 'Das Passwort braucht mindestens ' . MIN_PASSWORD . ' Zeichen.';
        } else {
            $all[$target] = ['name' => $name, 'hash' => password_hash($pass, PASSWORD_DEFAULT), 'admin' => !empty($_POST['admin']), 'pwv' => 1];
            save_users($all);
            $msg = "Konto „{$target}“ angelegt.";
        }
    } elseif (!isset($all[$target])) {
        $err = 'Dieses Konto gibt es nicht.';
    } elseif ($action === 'reset') {
        $pass = (string)($_POST['password'] ?? '');
        if (mb_strlen($pass) < MIN_PASSWORD) {
            $err = 'Das Passwort braucht mindestens ' . MIN_PASSWORD . ' Zeichen.';
        } else {
            $all[$target]['hash'] = password_hash($pass, PASSWORD_DEFAULT);
            $all[$target]['pwv'] = ($all[$target]['pwv'] ?? 0) + 1;
            save_users($all);
            if ($target === $user['username']) {
                login_user($target, $all[$target]);
            }
            $msg = "Neues Passwort für „{$target}“ gesetzt.";
        }
    } elseif ($target === $user['username']) {
        $err = 'Dein eigenes Konto kannst du hier nicht löschen oder herabstufen.';
    } elseif ($action === 'toggle_admin') {
        $all[$target]['admin'] = empty($all[$target]['admin']);
        save_users($all);
        $msg = $all[$target]['admin'] ? "„{$target}“ darf jetzt verwalten." : "„{$target}“ darf nicht mehr verwalten.";
    } elseif ($action === 'delete') {
        unset($all[$target]);
        save_users($all);
        $msg = "Konto „{$target}“ gelöscht.";
    }
}

page_start('Verwaltung', $user);
?>
<h1>Verwaltung</h1>
<?php flash($msg); flash($err, 'err'); ?>
<div class="cols">
  <section class="card">
    <h2>Konten</h2>
    <div class="table-wrap">
      <table class="users">
        <thead><tr><th>Benutzer</th><th>Name</th><th>Rolle</th><th>Aktionen</th></tr></thead>
        <tbody>
        <?php foreach (users() as $uname => $u): ?>
          <tr>
            <td><code><?= h($uname) ?></code></td>
            <td><?= h($u['name']) ?></td>
            <td><?= !empty($u['admin']) ? 'Verwalter' : 'Spieler' ?></td>
            <td class="row-actions">
              <form method="post" class="inline">
                <?= csrf_field() ?><input type="hidden" name="action" value="reset"><input type="hidden" name="username" value="<?= h($uname) ?>">
                <input name="password" type="password" placeholder="Neues Passwort" autocomplete="new-password" aria-label="Neues Passwort für <?= h($uname) ?>" required>
                <button class="btn small" type="submit">Setzen</button>
              </form>
              <?php if ($uname !== $user['username']): ?>
                <form method="post" class="inline">
                  <?= csrf_field() ?><input type="hidden" name="action" value="toggle_admin"><input type="hidden" name="username" value="<?= h($uname) ?>">
                  <button class="btn small" type="submit"><?= !empty($u['admin']) ? 'Zum Spieler machen' : 'Zum Verwalter machen' ?></button>
                </form>
                <form method="post" class="inline" data-confirm="Konto „<?= h($uname) ?>“ wirklich löschen?">
                  <?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="username" value="<?= h($uname) ?>">
                  <button class="btn small danger" type="submit">Löschen</button>
                </form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
  <section class="card">
    <h2>Konto anlegen</h2>
    <form method="post" class="form">
      <?= csrf_field() ?><input type="hidden" name="action" value="add">
      <label for="new-username">Benutzername</label>
      <input id="new-username" name="username" autocapitalize="none" required>
      <label for="new-name">Anzeigename</label>
      <input id="new-name" name="name" maxlength="24" required>
      <label for="new-password">Start-Passwort (mindestens <?= MIN_PASSWORD ?> Zeichen)</label>
      <input id="new-password" name="password" type="text" autocomplete="off" required>
      <label class="check"><input type="checkbox" name="admin" value="1"> darf Konten verwalten</label>
      <button class="btn primary" type="submit">Konto anlegen</button>
    </form>
    <p class="note">Gib das Start-Passwort persönlich weiter. Unter „Konto“ kann es jeder selbst ändern.</p>
  </section>
</div>
<section class="card invites">
  <h2>Einladungen</h2>
  <p class="note">Mit einer Einladung legt sich jemand selbst ein Spieler-Konto an: Link schicken oder QR-Code ausdrucken und
    mit der Handy-Kamera scannen lassen. Verwalter-Rechte gibt es darüber nie.</p>
  <form method="post" class="invite-form">
    <?= csrf_field() ?><input type="hidden" name="action" value="invite">
    <label>Bezeichnung (optional)<input name="label" maxlength="40" placeholder="z. B. Für Micha, Spieleabend Freitag"></label>
    <label>Gültig<select name="days"><option value="1">1 Tag</option><option value="7" selected>7 Tage</option><option value="30">30 Tage</option></select></label>
    <label>Für<select name="max"><option value="1" selected>1 Person</option><option value="5">bis zu 5 Personen</option><option value="20">bis zu 20 Personen</option></select></label>
    <button class="btn primary" type="submit">Einladung erzeugen</button>
  </form>
  <?php $invs = invites(); uasort($invs, fn($a, $b) => $b['created'] <=> $a['created']); ?>
  <?php if (!$invs): ?>
    <p class="note">Keine offenen Einladungen.</p>
  <?php endif; ?>
  <div class="invite-list">
  <?php foreach ($invs as $id => $i): $url = invite_url($i); ?>
    <article class="invite<?= $id === $fresh ? ' fresh' : '' ?>">
      <div class="qr" data-qr="<?= h($url) ?>" role="img" aria-label="QR-Code der Einladung"></div>
      <div class="invite-body">
        <h3><?= h($i['label'] !== '' ? $i['label'] : 'Einladung') ?></h3>
        <p class="note">Noch <?= (int)($i['max'] - $i['used']) ?> von <?= (int)$i['max'] ?> <?= $i['max'] === 1 ? 'Konto' : 'Konten' ?> ·
          gültig bis <?= h(date_de((int)$i['expires'])) ?><?= $i['accounts'] ? ' · schon angelegt: ' . h(implode(', ', $i['accounts'])) : '' ?></p>
        <div class="invite-link">
          <input value="<?= h($url) ?>" readonly aria-label="Einladungslink" onfocus="this.select()">
          <button class="btn small" type="button" data-copy="<?= h($url) ?>">Kopieren</button>
        </div>
        <div class="row-actions">
          <a class="btn small primary" href="einladung-druck.php?id=<?= h($id) ?>" target="_blank" rel="noopener">Drucken</a>
          <button class="btn small" type="button" data-share="<?= h($url) ?>" hidden>Teilen …</button>
          <form method="post" class="inline" data-confirm="Einladung wirklich zurückziehen?" data-confirm-label="Zurückziehen">
            <?= csrf_field() ?><input type="hidden" name="action" value="revoke"><input type="hidden" name="id" value="<?= h($id) ?>">
            <button class="btn small danger" type="submit">Zurückziehen</button>
          </form>
        </div>
      </div>
    </article>
  <?php endforeach; ?>
  </div>
</section>
<script src="<?= h(asset_url('assets/qrcode.js')) ?>"></script>
<script>
// QR-Codes zeichnen, Link kopieren oder über das Handy teilen
document.querySelectorAll('[data-qr]').forEach(el => {
  const q = qrcode(0, 'M'); q.addData(el.dataset.qr); q.make();
  el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
});
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); }
  catch (e) { const i = b.previousElementSibling; i.focus(); i.select(); document.execCommand('copy'); }
  b.textContent = 'Kopiert ✓'; setTimeout(() => { b.textContent = 'Kopieren'; }, 2000);
}));
if (navigator.share) document.querySelectorAll('[data-share]').forEach(b => {
  b.hidden = false;
  b.addEventListener('click', () => navigator.share({ title: 'Einladung zum Spieleabend', text: 'Mit diesem Link legst du dir ein Konto für den Spieleabend an:', url: b.dataset.share }).catch(() => {}));
});
// Sicherheitsabfrage vor dem Löschen (zweimal klicken)
document.querySelectorAll('form[data-confirm]').forEach(f => f.addEventListener('submit', e => {
  const b = f.querySelector('button');
  if (b.dataset.armed) return;
  const label = f.dataset.confirmLabel || 'Löschen';
  e.preventDefault(); b.dataset.armed = '1'; b.textContent = label === 'Löschen' ? 'Wirklich löschen?' : 'Wirklich?';
  setTimeout(() => { delete b.dataset.armed; b.textContent = label; }, 4000);
}));
</script>
<?php
page_end();
