<?php
// Anmeldung und Spieleübersicht.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

if (!users()) {
    header('Location: setup.php');
    exit;
}

$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $locked = login_locked();
    if ($locked > 0) {
        $error = 'Zu viele Fehlversuche. Bitte in ' . ceil($locked / 60) . ' Minuten erneut versuchen.';
    } elseif (!check_csrf($_POST['csrf'] ?? null)) {
        $error = 'Die Seite war zu lange offen. Bitte noch einmal anmelden.';
    } else {
        $name = strtolower(trim((string)($_POST['username'] ?? '')));
        $pass = (string)($_POST['password'] ?? '');
        $all = users();
        if (isset($all[$name]) && password_verify($pass, $all[$name]['hash'])) {
            login_succeeded();
            if (password_needs_rehash($all[$name]['hash'], PASSWORD_DEFAULT)) {
                $all[$name]['hash'] = password_hash($pass, PASSWORD_DEFAULT);
                save_users($all);
            }
            login_user($name, $all[$name]);
            header('Location: index.php');
            exit;
        }
        login_failed();
        usleep(600000);
        $error = 'Benutzername oder Passwort stimmt nicht.';
    }
}

$user = current_user();
if (!$user) {
    page_start('Anmelden');
    ?>
    <section class="card narrow">
      <h1>Anmelden</h1>
      <p class="note">Diese Seite ist privat. Zugang nur mit eigenem Konto.</p>
      <?php flash($error, 'err'); ?>
      <form method="post" class="form">
        <?= csrf_field() ?>
        <label for="username">Benutzername</label>
        <input id="username" name="username" autocomplete="username" autocapitalize="none" required autofocus>
        <label for="password">Passwort</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>
        <button class="btn primary" type="submit" name="login" value="1">Anmelden</button>
      </form>
    </section>
    <?php
    page_end();
    exit;
}

page_start('Spiele', $user);
$games = games();
?>
<h1>Hallo <?= h($user['name']) ?>, was spielen wir?</h1>
<div class="games">
  <?php foreach ($games as $g): ?>
    <a class="game" href="play.php?spiel=<?= h($g['id']) ?>" style="--accent: <?= h($g['color'] ?? '#f4cb4d') ?>">
      <span class="game-title"><?= h($g['title']) ?></span>
      <span class="game-desc"><?= h($g['description'] ?? '') ?></span>
      <span class="game-meta"><?= h($g['players'] ?? '') ?></span>
    </a>
  <?php endforeach; ?>
  <?php if (!$games): ?>
    <p class="note">Noch keine Spiele hinterlegt. Neue Spiele kommen in den Ordner <code>games/</code>.</p>
  <?php endif; ?>
</div>
<?php $stand = @file_get_contents(__DIR__ . '/VERSION.txt'); if ($stand): ?>
  <p class="note version">Stand: <?= h(trim($stand)) ?></p>
<?php endif; ?>
<?php
page_end();
