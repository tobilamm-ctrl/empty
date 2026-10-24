<?php
// Eigenes Konto: Anzeigename und Passwort ändern.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$user = require_login();
$msg = null;
$err = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $all = users();
    $me = &$all[$user['username']];
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $err = 'Bitte das Formular noch einmal absenden.';
    } elseif (isset($_POST['set_name'])) {
        $name = trim((string)($_POST['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 24) {
            $err = 'Anzeigename: 1–24 Zeichen.';
        } else {
            $me['name'] = $name;
            save_users($all);
            $msg = 'Anzeigename gespeichert.';
        }
    } elseif (isset($_POST['set_password'])) {
        $old = (string)($_POST['old'] ?? '');
        $new = (string)($_POST['password'] ?? '');
        if (!password_verify($old, $me['hash'])) {
            $err = 'Das bisherige Passwort stimmt nicht.';
        } elseif (mb_strlen($new) < MIN_PASSWORD) {
            $err = 'Das neue Passwort braucht mindestens ' . MIN_PASSWORD . ' Zeichen.';
        } elseif ($new !== ($_POST['password2'] ?? '')) {
            $err = 'Die beiden neuen Passwörter stimmen nicht überein.';
        } else {
            $me['hash'] = password_hash($new, PASSWORD_DEFAULT);
            $me['pwv'] = ($me['pwv'] ?? 0) + 1;
            save_users($all);
            login_user($user['username'], $me);
            $msg = 'Passwort geändert. Andere Geräte sind jetzt abgemeldet.';
        }
    }
    unset($me);
    $user = current_user() ?? $user;
}

page_start('Konto', $user);
?>
<h1>Dein Konto</h1>
<?php flash($msg); flash($err, 'err'); ?>
<div class="cols">
  <section class="card">
    <h2>Anzeigename</h2>
    <form method="post" class="form">
      <?= csrf_field() ?>
      <label for="name">So heißt du im Spiel</label>
      <input id="name" name="name" maxlength="24" required value="<?= h($user['name']) ?>">
      <button class="btn" type="submit" name="set_name" value="1">Speichern</button>
    </form>
  </section>
  <section class="card">
    <h2>Passwort ändern</h2>
    <form method="post" class="form">
      <?= csrf_field() ?>
      <label for="old">Bisheriges Passwort</label>
      <input id="old" name="old" type="password" autocomplete="current-password" required>
      <label for="password">Neues Passwort</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required>
      <label for="password2">Neues Passwort wiederholen</label>
      <input id="password2" name="password2" type="password" autocomplete="new-password" required>
      <button class="btn" type="submit" name="set_password" value="1">Passwort ändern</button>
    </form>
  </section>
</div>
<?php
page_end();
