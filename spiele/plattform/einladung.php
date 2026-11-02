<?php
// Einladung annehmen: mit dem Link aus der Verwaltung legt sich jemand selbst ein Spieler-Konto an.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$token = (string)($_GET['t'] ?? '');
$error = null;
$invite = find_invite($token);   // 144 Bit Zufall: Durchprobieren aussichtslos, daher keine Sperre
$me = current_user();

if ($invite && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = strtolower(trim((string)($_POST['username'] ?? '')));
    $name = trim((string)($_POST['name'] ?? ''));
    $pass = (string)($_POST['password'] ?? '');
    if (!check_csrf($_POST['csrf'] ?? null)) {
        $error = 'Die Seite war zu lange offen. Bitte noch einmal absenden.';
    } elseif ($name === '' || mb_strlen($name) > 24) {
        $error = 'Anzeigename: 1–24 Zeichen.';
    } elseif (!valid_username($username)) {
        $error = 'Benutzername: 2–32 Zeichen, nur Kleinbuchstaben, Ziffern, Punkt, Minus, Unterstrich.';
    } elseif (mb_strlen($pass) < MIN_PASSWORD) {
        $error = 'Das Passwort braucht mindestens ' . MIN_PASSWORD . ' Zeichen.';
    } elseif ($pass !== ($_POST['password2'] ?? '')) {
        $error = 'Die beiden Passwörter stimmen nicht überein.';
    } else {
        $result = with_lock(function () use ($token, $username, $name, $pass) {
            $inv = find_invite($token);   // frisch lesen: vielleicht gerade verbraucht oder zurückgezogen
            if (!$inv) {
                return 'Diese Einladung ist nicht mehr gültig.';
            }
            $all = users();
            if (isset($all[$username])) {
                return 'Diesen Benutzernamen gibt es schon. Bitte einen anderen wählen.';
            }
            $all[$username] = ['name' => $name, 'hash' => password_hash($pass, PASSWORD_DEFAULT), 'admin' => false, 'pwv' => 1, 'invite' => $inv['id']];
            save_users($all);
            $list = invites();
            $list[$inv['id']]['used'] = ($list[$inv['id']]['used'] ?? 0) + 1;
            $list[$inv['id']]['accounts'][] = $username;
            save_invites($list);
            return $all[$username];
        });
        if (is_array($result)) {
            login_user($username, $result);
            header('Location: index.php?willkommen=1');
            exit;
        }
        $error = $result;
        $invite = find_invite($token);
    }
}

page_start('Einladung');
?>
<section class="card narrow">
  <h1>Willkommen beim Spieleabend</h1>
  <?php if (!$invite): ?>
    <p class="flash err">Diese Einladung ist abgelaufen, schon verbraucht oder zurückgezogen. Bitte um eine neue.</p>
    <p class="note">Wer schon ein Konto hat, meldet sich <a href="index.php">hier an</a>.</p>
  <?php else: ?>
    <p class="note">Leg dir hier dein eigenes Konto an. Damit kannst du alle Spiele spielen, auch online mit den anderen.
      Die Einladung gilt bis <?= h(date_de((int)$invite['expires'])) ?>.</p>
    <?php if ($me): ?>
      <p class="flash">Auf diesem Gerät ist gerade <b><?= h($me['name']) ?></b> angemeldet. Mit dem neuen Konto wird diese Anmeldung ersetzt.</p>
    <?php endif; ?>
    <?php flash($error, 'err'); ?>
    <form method="post" class="form" autocomplete="on">
      <?= csrf_field() ?>
      <label for="name">Dein Name im Spiel</label>
      <input id="name" name="name" maxlength="24" required autofocus value="<?= h($_POST['name'] ?? '') ?>">
      <label for="username">Benutzername (für die Anmeldung)</label>
      <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required pattern="[a-zA-Z0-9_.\-]{2,32}" value="<?= h($_POST['username'] ?? '') ?>">
      <p class="note small">Kleinbuchstaben, Ziffern, Punkt, Minus oder Unterstrich, z. B. <code>micha</code>.</p>
      <label for="password">Passwort (mindestens <?= MIN_PASSWORD ?> Zeichen)</label>
      <input id="password" name="password" type="password" autocomplete="new-password" minlength="<?= MIN_PASSWORD ?>" required>
      <label for="password2">Passwort wiederholen</label>
      <input id="password2" name="password2" type="password" autocomplete="new-password" minlength="<?= MIN_PASSWORD ?>" required>
      <button class="btn primary" type="submit">Konto anlegen und loslegen</button>
    </form>
    <p class="note">Schon ein Konto? <a href="index.php">Zur Anmeldung</a></p>
  <?php endif; ?>
</section>
<script>
// Benutzernamen gleich in Kleinbuchstaben und ohne Leerzeichen vorschlagen
const n = document.getElementById('name'), u = document.getElementById('username');
if (n && u) {
  let touched = !!u.value;
  u.addEventListener('input', () => { touched = true; u.value = u.value.toLowerCase().replace(/\s+/g, ''); });
  n.addEventListener('input', () => {
    if (touched) return;
    u.value = n.value.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9_.-]/g, '').slice(0, 32);
  });
}
</script>
<?php
page_end();
