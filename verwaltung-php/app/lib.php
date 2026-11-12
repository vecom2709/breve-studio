<?php
declare(strict_types=1);
/*
 * Studio Breve – Verwaltung (verwaltung.studio-breve.it)
 * Gemeinsame Funktionen: Einstellungen, Datenbank (SQLite), Anmeldung, CORS, Reichweitenmessung, Anfragen.
 * Läuft auf All-Inkl-Webspace mit PHP 8.1 oder neuer. Keine Fremddienste, keine Tracking-Cookies.
 */

const SB_ZEITZONE = 'Europe/Rome';
const SB_AUFBEWAHRUNG_TAGE = 365;      // Besuchsdetails; Tageszahlen bleiben als reine Summen
const SB_MIN_PASSWORT = 10;
const SB_MAX_VERSUCHE = 10;            // Anmeldeversuche je gekürzter Adresse …
const SB_SPERRFENSTER = 900;           // … in 15 Minuten
const SB_MAX_ANFRAGEN = 5;             // Anfragen je gekürzter Adresse …
const SB_ANFRAGEFENSTER = 3600;        // … pro Stunde
const SB_SITZUNG_DAUER = 43200;        // 12 Stunden
const SB_COOKIE = 'sb_admin';
const SB_CSRF_COOKIE = 'sb_csrf';
const SB_EINWILLIGUNG_VERSION = 'consent-2026-11-09';

date_default_timezone_set(SB_ZEITZONE);

function sb_config(): array
{
    static $c = null;
    if ($c !== null) {
        return $c;
    }
    $c = [
        'website' => 'https://www.studio-breve.it',
        'origins' => ['https://www.studio-breve.it', 'https://studio-breve.it'],
        'benachrichtigung' => 'info@studio-breve.it',
        'absender' => 'info@studio-breve.it',
        'einrichtungscode' => '',
        'datenordner' => dirname(__DIR__) . '/data',
        'mail_senden' => true,
    ];
    $lokal = __DIR__ . '/config.local.php';
    if (is_file($lokal)) {
        $extra = require $lokal;
        if (is_array($extra)) {
            $c = array_merge($c, $extra);
        }
    }
    return $c;
}

/* ---------- Datenbank ---------- */

function sb_db(): PDO
{
    static $db = null;
    if ($db instanceof PDO) {
        return $db;
    }
    $dir = sb_config()['datenordner'];
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }
    if (!is_file($dir . '/.htaccess')) {
        file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }
    $db = new PDO('sqlite:' . $dir . '/verwaltung.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $db->exec('PRAGMA busy_timeout = 5000');
    $db->exec('CREATE TABLE IF NOT EXISTS besuche (
        sid TEXT NOT NULL, datum TEXT NOT NULL, beginn TEXT NOT NULL, seiten TEXT NOT NULL,
        referrer TEXT NOT NULL DEFAULT "", quelle TEXT NOT NULL DEFAULT "direct", utm TEXT,
        sprache TEXT NOT NULL DEFAULT "", land TEXT, geraet TEXT NOT NULL DEFAULT "desktop",
        system TEXT NOT NULL DEFAULT "", browser TEXT NOT NULL DEFAULT "", bildschirm TEXT NOT NULL DEFAULT "",
        PRIMARY KEY (sid, datum))');
    $db->exec('CREATE INDEX IF NOT EXISTS besuche_datum ON besuche (datum)');
    $db->exec('CREATE TABLE IF NOT EXISTS tage (datum TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0)');
    $db->exec('CREATE TABLE IF NOT EXISTS einstellungen (schluessel TEXT PRIMARY KEY, wert TEXT NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS zugang (id INTEGER PRIMARY KEY CHECK (id = 1), hash TEXT NOT NULL,
        sitzungsschluessel TEXT NOT NULL, geaendert TEXT NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS grenzen (schluessel TEXT PRIMARY KEY, n INTEGER NOT NULL, bis INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS anfragen (id TEXT PRIMARY KEY, erstellt TEXT NOT NULL,
        seitensprache TEXT NOT NULL, wunschsprache TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
        paket TEXT, anliegen TEXT NOT NULL, nachricht TEXT NOT NULL, werbung INTEGER NOT NULL DEFAULT 0,
        einwilligung TEXT NOT NULL, quelle TEXT NOT NULL)');
    return $db;
}

function sb_einstellung(string $schluessel, string $standard): string
{
    $st = sb_db()->prepare('SELECT wert FROM einstellungen WHERE schluessel = ?');
    $st->execute([$schluessel]);
    $wert = $st->fetchColumn();
    return $wert === false ? $standard : (string) $wert;
}

function sb_einstellung_setzen(string $schluessel, string $wert): void
{
    sb_db()->prepare('INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
        ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert')->execute([$schluessel, $wert]);
}

/* ---------- Hilfen ---------- */

function sb_heute(?int $zeit = null): string
{
    return date('Y-m-d', $zeit ?? time());
}

function sb_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');
}

function sb_e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function sb_json(array $daten, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Gekürzte Adresse (IPv4 /24, IPv6 /48) – wird nie gespeichert, nur als Hash für Sperren genutzt. */
function sb_ip_kurz(): string
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $ip = preg_replace('/^::ffff:/', '', $ip) ?? '';
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $p = explode('.', $ip);
        return "{$p[0]}.{$p[1]}.{$p[2]}.0";
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $teile = explode(':', $ip);
        return implode(':', array_slice($teile, 0, 3)) . '::';
    }
    return 'unbekannt';
}

function sb_grenze_schluessel(string $art): string
{
    return $art . ':' . hash('sha256', 'studio-breve|' . sb_ip_kurz());
}

/** Zählt einen Versuch; liefert verbleibende Versuche (0 = gesperrt). */
function sb_grenze_zaehlen(string $art, int $max, int $fenster): int
{
    $db = sb_db();
    $k = sb_grenze_schluessel($art);
    $jetzt = time();
    $db->beginTransaction();
    $st = $db->prepare('SELECT n, bis FROM grenzen WHERE schluessel = ?');
    $st->execute([$k]);
    $row = $st->fetch();
    if (!$row || (int) $row['bis'] < $jetzt) {
        $db->prepare('INSERT OR REPLACE INTO grenzen (schluessel, n, bis) VALUES (?, 1, ?)')->execute([$k, $jetzt + $fenster]);
        $n = 1;
    } else {
        $n = (int) $row['n'] + 1;
        $db->prepare('UPDATE grenzen SET n = ? WHERE schluessel = ?')->execute([$n, $k]);
    }
    $db->commit();
    return max(0, $max - $n);
}

function sb_grenze_offen(string $art, int $max): bool
{
    $st = sb_db()->prepare('SELECT n, bis FROM grenzen WHERE schluessel = ?');
    $st->execute([sb_grenze_schluessel($art)]);
    $row = $st->fetch();
    return !$row || (int) $row['bis'] < time() || (int) $row['n'] < $max;
}

function sb_grenze_loeschen(string $art): void
{
    sb_db()->prepare('DELETE FROM grenzen WHERE schluessel = ?')->execute([sb_grenze_schluessel($art)]);
}

/* ---------- CORS für die Website ---------- */

/** Setzt CORS-Köpfe für erlaubte Herkunft. Liefert false, wenn eine fremde Herkunft anfragt. */
function sb_cors(): bool
{
    header('Vary: Origin');
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin === '') {
        return true;
    }
    if (!in_array($origin, sb_config()['origins'], true)) {
        return false;
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 600');
    return true;
}

function sb_api_koepfe(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Robots-Tag: noindex, nofollow');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Referrer-Policy: no-referrer');
}

/* ---------- Anmeldung ---------- */

function sb_zugang(): ?array
{
    $row = sb_db()->query('SELECT hash, sitzungsschluessel, geaendert FROM zugang WHERE id = 1')->fetch();
    return $row ?: null;
}

function sb_passwort_setzen(string $passwort): void
{
    sb_db()->prepare('INSERT OR REPLACE INTO zugang (id, hash, sitzungsschluessel, geaendert) VALUES (1, ?, ?, ?)')
        ->execute([password_hash($passwort, PASSWORD_DEFAULT), bin2hex(random_bytes(32)), date('c')]);
}

function sb_passwort_pruefen(string $passwort): bool
{
    $z = sb_zugang();
    return $z !== null && password_verify($passwort, $z['hash']);
}

function sb_passwort_fehler(string $neu, string $wiederholung): ?string
{
    if (mb_strlen($neu) < SB_MIN_PASSWORT) {
        return 'Das Passwort muss mindestens ' . SB_MIN_PASSWORT . ' Zeichen haben.';
    }
    if ($neu !== $wiederholung) {
        return 'Die Passwörter stimmen nicht überein.';
    }
    return null;
}

function sb_cookie(string $name, string $wert, int $dauer): void
{
    setcookie($name, $wert, [
        'expires' => $dauer > 0 ? time() + $dauer : time() - 3600,
        'path' => '/',
        'secure' => sb_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function sb_sitzung_starten(): void
{
    $z = sb_zugang();
    if ($z === null) {
        return;
    }
    $id = bin2hex(random_bytes(16));
    $bis = time() + SB_SITZUNG_DAUER;
    $sig = hash_hmac('sha256', "$id.$bis", $z['sitzungsschluessel']);
    sb_cookie(SB_COOKIE, "$id.$bis.$sig", SB_SITZUNG_DAUER);
}

function sb_sitzung_beenden(): void
{
    sb_cookie(SB_COOKIE, '', -1);
}

function sb_angemeldet(): bool
{
    $token = (string) ($_COOKIE[SB_COOKIE] ?? '');
    $teile = explode('.', $token);
    if (count($teile) !== 3) {
        return false;
    }
    [$id, $bis, $sig] = $teile;
    if (!ctype_digit($bis) || (int) $bis < time()) {
        return false;
    }
    $z = sb_zugang();
    if ($z === null) {
        return false;
    }
    return hash_equals(hash_hmac('sha256', "$id.$bis", $z['sitzungsschluessel']), $sig);
}

/** Doppel-Absende-Schutz: zufälliger Wert im Cookie und im Formular. */
function sb_csrf(): string
{
    static $wert = null;
    if ($wert !== null) {
        return $wert;
    }
    $vorhanden = (string) ($_COOKIE[SB_CSRF_COOKIE] ?? '');
    if (preg_match('/^[a-f0-9]{64}$/', $vorhanden)) {
        return $wert = $vorhanden;
    }
    $wert = bin2hex(random_bytes(32));
    sb_cookie(SB_CSRF_COOKIE, $wert, 86400);
    return $wert;
}

function sb_csrf_ok(): bool
{
    $cookie = (string) ($_COOKIE[SB_CSRF_COOKIE] ?? '');
    $feld = (string) ($_POST['csrf'] ?? '');
    if ($cookie === '' || !hash_equals($cookie, $feld)) {
        return false;
    }
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '') {
        $port = parse_url($origin, PHP_URL_PORT);
        $herkunft = parse_url($origin, PHP_URL_HOST) . ($port ? ':' . $port : '');
        if ($herkunft !== ($_SERVER['HTTP_HOST'] ?? '')) {
            return false;
        }
    }
    return true;
}

/* ---------- Reichweitenmessung ---------- */

function sb_ua(string $ua): array
{
    $browser = 'Unbekannt';
    if (preg_match('/Edg\//i', $ua)) $browser = 'Edge';
    elseif (preg_match('/OPR\/|Opera/i', $ua)) $browser = 'Opera';
    elseif (preg_match('/Chrome\//i', $ua) && !preg_match('/Chromium/i', $ua)) $browser = 'Chrome';
    elseif (preg_match('/Firefox\//i', $ua)) $browser = 'Firefox';
    elseif (preg_match('/Safari/i', $ua) && !preg_match('/Chrome/i', $ua)) $browser = 'Safari';
    $system = 'Unbekannt';
    if (preg_match('/Windows NT/i', $ua)) $system = 'Windows';
    elseif (preg_match('/iPhone|iPad|iPod/i', $ua)) $system = 'iOS';
    elseif (preg_match('/Mac OS X/i', $ua)) $system = 'macOS';
    elseif (preg_match('/Android/i', $ua)) $system = 'Android';
    elseif (preg_match('/Linux/i', $ua)) $system = 'Linux';
    $geraet = 'desktop';
    if (preg_match('/iPad|Tablet|PlayBook/i', $ua) || (preg_match('/Android/i', $ua) && !preg_match('/Mobile/i', $ua))) $geraet = 'tablet';
    elseif (preg_match('/Mobi|iPhone|Android/i', $ua)) $geraet = 'mobile';
    return ['browser' => $browser, 'system' => $system, 'geraet' => $geraet];
}

function sb_land_aus_sprache(string $kopf): ?string
{
    $erste = trim(explode(',', $kopf)[0] ?? '');
    return preg_match('/^[a-z]{2,3}[-_]([A-Z]{2})/i', $erste, $m) ? strtoupper($m[1]) : null;
}

function sb_quelle(string $referrer, ?array $utm): string
{
    if ($utm && (($utm['source'] ?? '') !== '' || ($utm['medium'] ?? '') !== '' || ($utm['campaign'] ?? '') !== '')) {
        return $utm['source'] ?? ($utm['medium'] ?? 'utm');
    }
    if ($referrer === '') {
        return 'direct';
    }
    $host = (string) parse_url($referrer, PHP_URL_HOST);
    $host = preg_replace('/^www\./', '', $host) ?? '';
    if ($host === '' || $host === 'localhost' || $host === '127.0.0.1' || str_ends_with($host, 'studio-breve.it')) {
        return 'direct';
    }
    return mb_substr($host, 0, 120);
}

function sb_besuche_gesamt(): int
{
    return (int) sb_db()->query('SELECT COALESCE(SUM(n), 0) FROM tage')->fetchColumn();
}

function sb_alte_besuche_loeschen(): void
{
    $grenze = sb_heute(time() - SB_AUFBEWAHRUNG_TAGE * 86400);
    sb_db()->prepare('DELETE FROM besuche WHERE datum < ?')->execute([$grenze]);
}

/** Speichert einen Seitenaufruf. Liefert true, wenn der Besuch an diesem Tag neu war. */
function sb_aufruf_speichern(array $d): bool
{
    $db = sb_db();
    $datum = sb_heute();
    $jetzt = date('c');
    $db->exec('BEGIN IMMEDIATE');
    try {
        sb_alte_besuche_loeschen();
        $st = $db->prepare('SELECT seiten FROM besuche WHERE sid = ? AND datum = ?');
        $st->execute([$d['sid'], $datum]);
        $seiten = $st->fetchColumn();
        if ($seiten !== false) {
            $liste = json_decode((string) $seiten, true) ?: [];
            $offen = false;
            foreach ($liste as $s) {
                if (($s['path'] ?? '') === $d['path'] && !isset($s['ms'])) {
                    $offen = true;
                }
            }
            if (!$offen && count($liste) < 200) {
                $liste[] = ['path' => $d['path'], 'enteredAt' => $jetzt];
                $db->prepare('UPDATE besuche SET seiten = ? WHERE sid = ? AND datum = ?')
                    ->execute([json_encode($liste, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $d['sid'], $datum]);
            }
            $db->exec('COMMIT');
            return false;
        }
        $db->prepare('INSERT INTO besuche (sid, datum, beginn, seiten, referrer, quelle, utm, sprache, land, geraet, system, browser, bildschirm)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([
            $d['sid'], $datum, $jetzt,
            json_encode([['path' => $d['path'], 'enteredAt' => $jetzt]], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            $d['referrer'], sb_quelle($d['referrer'], $d['utm']), $d['utm'] ? json_encode($d['utm'], JSON_UNESCAPED_UNICODE) : null,
            $d['sprache'], $d['land'], $d['geraet'], $d['system'], $d['browser'], $d['bildschirm'],
        ]);
        $db->prepare('INSERT INTO tage (datum, n) VALUES (?, 1) ON CONFLICT(datum) DO UPDATE SET n = n + 1')->execute([$datum]);
        $db->exec('COMMIT');
        return true;
    } catch (Throwable $e) {
        $db->exec('ROLLBACK');
        throw $e;
    }
}

function sb_verweildauer_speichern(string $sid, string $pfad, float $ms): void
{
    if (!is_finite($ms) || $ms < 0) {
        return;
    }
    $db = sb_db();
    $datum = sb_heute();
    $db->exec('BEGIN IMMEDIATE');
    $st = $db->prepare('SELECT seiten FROM besuche WHERE sid = ? AND datum = ?');
    $st->execute([$sid, $datum]);
    $seiten = $st->fetchColumn();
    if ($seiten !== false) {
        $liste = json_decode((string) $seiten, true) ?: [];
        for ($i = count($liste) - 1; $i >= 0; $i--) {
            if (($liste[$i]['path'] ?? '') === $pfad) {
                $liste[$i]['ms'] = (int) min(round($ms), 6 * 3600 * 1000);
                break;
            }
        }
        $db->prepare('UPDATE besuche SET seiten = ? WHERE sid = ? AND datum = ?')
            ->execute([json_encode($liste, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $sid, $datum]);
    }
    $db->exec('COMMIT');
}

/* ---------- Anfragen ---------- */

function sb_anfrage_speichern(array $a): array
{
    $id = 'SB-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
    $erstellt = date('c');
    sb_db()->prepare('INSERT INTO anfragen (id, erstellt, seitensprache, wunschsprache, name, email, paket, anliegen, nachricht, werbung, einwilligung, quelle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([
        $id, $erstellt, $a['seitensprache'], $a['wunschsprache'], $a['name'], $a['email'], $a['paket'],
        $a['anliegen'], $a['nachricht'], $a['werbung'] ? 1 : 0, SB_EINWILLIGUNG_VERSION, $a['quelle'],
    ]);
    return ['id' => $id, 'erstellt' => $erstellt];
}

/** Hinweis per E-Mail an Studio Breve – bewusst ohne personenbezogene Angaben. */
function sb_anfrage_melden(string $id, ?string $paket, string $wunschsprache): void
{
    $c = sb_config();
    if (!$c['mail_senden'] || !function_exists('mail')) {
        return;
    }
    $text = "Neue Anfrage über www.studio-breve.it\n\n"
        . "Vorgangsnummer: $id\n"
        . 'Paket: ' . ($paket ?: '–') . "\n"
        . "Wunschsprache: $wunschsprache\n\n"
        . "Name, E-Mail und Nachricht stehen nur in der Verwaltung:\n"
        . "https://verwaltung.studio-breve.it/\n";
    $kopf = [
        'From' => 'Studio Breve Verwaltung <' . $c['absender'] . '>',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => '8bit',
    ];
    @mail($c['benachrichtigung'], '=?UTF-8?B?' . base64_encode("Neue Anfrage $id") . '?=', $text, $kopf, '-f' . $c['absender']);
}
