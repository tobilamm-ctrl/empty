<?php
// Ersteinrichtung: legt das erste Verwalter-Konto an. Danach ist die Seite gesperrt.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

if (users()) {
    header('Location: index.php');
    exit;
}

$error = null;
try {
    ensure_data_dir();
    if (!is_writable(DATA_DIR)) {
        throw new RuntimeException('Der Ordner "data" ist nicht beschreibbar.');
    }
} catch (RuntimeException $e) {
    $error = $e->getMessage();
}

if (!$error && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = strtolower(trim((string)($_POST['username'] ?? '')));
    $name = trim((string)($_POST['name'] ?? ''));
    $pass = (string)($_POST['password'] ?? '');
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $error = 'Bitte das Formular noch einmal absenden.';
    } elseif (!valid_username($username)) {
        $error = 'Benutzername: 2–32 Zeichen, nur Kleinbuchstaben, Ziffern, Punkt, Minus, Unterstrich.';
    } elseif ($name === '' || mb_strlen($name) > 24) {
        $error = 'Anzeigename: 1–24 Zeichen.';
    } elseif (mb_strlen($pass) < MIN_PASSWORD) {
        $error = 'Das Passwort braucht mindestens ' . MIN_PASSWORD . ' Zeichen.';
    } elseif ($pass !== ($_POST['password2'] ?? '')) {
        $error = 'Die beiden Passwörter stimmen nicht überein.';
    } else {
        $user = ['name' => $name, 'hash' => password_hash($pass, PASSWORD_DEFAULT), 'admin' => true, 'pwv' => 1];
        save_users([$username => $user]);
        login_user($username, $user);
        header('Location: admin.php?neu=1');
        exit;
    }
}

page_start('Einrichtung');
?>
<section class="card narrow">
  <h1>Einrichtung</h1>
  <p class="note">Lege das erste Konto an. Es darf weitere Konten verwalten. Diese Seite ist danach gesperrt.</p>
  <?php flash($error, 'err'); ?>
  <form method="post" class="form">
    <?= csrf_field() ?>
    <label for="username">Benutzername (für die Anmeldung)</label>
    <input id="username" name="username" autocapitalize="none" required value="<?= h($_POST['username'] ?? '') ?>">
    <label for="name">Anzeigename (im Spiel)</label>
    <input id="name" name="name" maxlength="24" required value="<?= h($_POST['name'] ?? '') ?>">
    <label for="password">Passwort (mindestens <?= MIN_PASSWORD ?> Zeichen)</label>
    <input id="password" name="password" type="password" autocomplete="new-password" required>
    <label for="password2">Passwort wiederholen</label>
    <input id="password2" name="password2" type="password" autocomplete="new-password" required>
    <button class="btn primary" type="submit">Konto anlegen</button>
  </form>
</section>
<?php
page_end();
