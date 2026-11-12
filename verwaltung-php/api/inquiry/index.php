<?php
declare(strict_types=1);
// Anfrageformular der Website: speichert die Anfrage in der Verwaltung und meldet sie ohne Personendaten per E-Mail.
require dirname(__DIR__, 2) . '/app/lib.php';

sb_api_koepfe();
$erlaubt = sb_cors();
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($methode === 'OPTIONS') {
    http_response_code($erlaubt ? 204 : 403);
    exit;
}
if ($methode !== 'POST') {
    header('Allow: POST, OPTIONS');
    sb_json(['ok' => false], 405);
}

$wantsJson = str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
$s = static fn (string $k, int $max = 4000): string => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $max);
$lang = $s('lang') === 'it' ? 'it' : 'de';
$website = sb_config()['website'];
$pfade = ['de' => ['kontakt' => '/de/kontakt/', 'danke' => '/de/kontakt/danke/'], 'it' => ['kontakt' => '/it/contatti/', 'danke' => '/it/contatti/grazie/']];
$quelle = $s('source', 200);
$zurueck = (str_starts_with($quelle, '/') && !str_starts_with($quelle, '//')) ? $quelle : $pfade[$lang]['kontakt'];

$fehlerAntwort = static function (int $status, array $daten) use ($wantsJson, $website, $zurueck): never {
    if ($wantsJson) {
        sb_json(['ok' => false] + $daten, $status);
    }
    header('Location: ' . $website . $zurueck . '?fehler=1#formular', true, 303);
    exit;
};

if (!$erlaubt) {
    $fehlerAntwort(403, []);
}
if ($s('website') !== '') { // Honigtopf-Feld: vermutlich automatisiert
    $fehlerAntwort(400, []);
}
if (!sb_grenze_offen('anfrage', SB_MAX_ANFRAGEN)) {
    $fehlerAntwort(429, ['errors' => ['message' => $lang === 'it'
        ? 'Troppe richieste in poco tempo. Riprova più tardi o scrivi a info@studio-breve.it.'
        : 'Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen oder an info@studio-breve.it schreiben.']]);
}

$texte = [
    'de' => [
        'name' => 'Bitte geben Sie Ihren Namen an.',
        'email' => 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
        'message' => 'Bitte schreiben Sie eine kurze Nachricht (mindestens 10 Zeichen).',
        'consent' => 'Bitte bestätigen Sie die Einwilligung zur Verarbeitung Ihrer Anfrage.',
    ],
    'it' => [
        'name' => 'Indica il tuo nome.',
        'email' => 'Indica un indirizzo email valido.',
        'message' => 'Scrivi un breve messaggio (almeno 10 caratteri).',
        'consent' => 'Conferma il consenso al trattamento della richiesta.',
    ],
][$lang];

$name = $s('name', 120);
$email = $s('email', 200);
$nachricht = $s('message', 4000);
$einwilligung = $s('consent') === 'yes';
$werbung = $s('marketing') === 'yes';
$wunsch = in_array($s('language'), ['it', 'en'], true) ? $s('language') : 'de';
$paketRoh = $s('package', 80);
$paket = preg_match('/^(bundle:)?[a-z0-9][a-z0-9-]{0,60}$/', $paketRoh) ? $paketRoh : null;
$anliegen = preg_match('/^[a-z-]{1,20}$/', $s('intent', 20)) ? $s('intent', 20) : 'general';

$fehler = [];
if (mb_strlen($name) < 2) $fehler['name'] = $texte['name'];
if (!preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u', $email)) $fehler['email'] = $texte['email'];
if (mb_strlen($nachricht) < 10) $fehler['message'] = $texte['message'];
if (!$einwilligung) $fehler['consent'] = $texte['consent'];
if ($fehler) {
    $fehlerAntwort(422, ['errors' => $fehler]);
}

try {
    sb_grenze_zaehlen('anfrage', SB_MAX_ANFRAGEN, SB_ANFRAGEFENSTER);
    $gespeichert = sb_anfrage_speichern([
        'seitensprache' => $lang, 'wunschsprache' => $wunsch, 'name' => $name, 'email' => $email,
        'paket' => $paket, 'anliegen' => $anliegen, 'nachricht' => $nachricht, 'werbung' => $werbung, 'quelle' => $zurueck,
    ]);
} catch (Throwable $e) {
    error_log('[anfrage] Speichern fehlgeschlagen: ' . $e->getMessage());
    $fehlerAntwort(500, []);
}
sb_anfrage_melden($gespeichert['id'], $paket, $wunsch);

$weiter = $website . $pfade[$lang]['danke'] . '?ref=' . rawurlencode($gespeichert['id']);
if ($wantsJson) {
    sb_json(['ok' => true, 'id' => $gespeichert['id'], 'redirect' => $weiter, 'details' => [
        'id' => $gespeichert['id'], 'createdAt' => $gespeichert['erstellt'], 'package' => $paket, 'marketing' => $werbung,
    ]], 201);
}
header('Location: ' . $weiter, true, 303);
