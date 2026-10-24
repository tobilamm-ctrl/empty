<?php
// Verwaltung: Konten anlegen, Passwort zurücksetzen, Rechte, löschen.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$user = require_admin();
$msg = isset($_GET['neu']) ? 'Dein Konto ist angelegt. Jetzt kannst du Konten für die anderen anlegen.' : null;
$err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $all = users();
    $target = strtolower(trim((string)($_POST['username'] ?? '')));
    $action = (string)($_POST['action'] ?? '');
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $err = 'Bitte das Formular noch einmal absenden.';
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
<script>
// Sicherheitsabfrage vor dem Löschen (zweimal klicken)
document.querySelectorAll('form[data-confirm]').forEach(f => f.addEventListener('submit', e => {
  const b = f.querySelector('button');
  if (b.dataset.armed) return;
  e.preventDefault(); b.dataset.armed = '1'; b.textContent = 'Wirklich löschen?';
  setTimeout(() => { delete b.dataset.armed; b.textContent = 'Löschen'; }, 4000);
}));
</script>
<?php
page_end();
