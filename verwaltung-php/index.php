<?php
declare(strict_types=1);
// Verwaltung von Studio Breve: Ersteinrichtung, Anmeldung, Besuche, Anfragen, Einstellungen.
require __DIR__ . '/app/lib.php';

ob_start(); // Cookies dürfen auch nach Ausgabebeginn noch gesetzt werden
sb_csrf();  // Schutzwert für Formulare vor jeder Ausgabe festlegen
header("Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin'); // nötig, damit Formulare eine echte Origin mitsenden
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
if (sb_https()) {
    header('Strict-Transport-Security: max-age=31536000');
}

$WEBSITE = sb_config()['website'];

function weiter(string $ziel): never
{
    header('Location: ' . $ziel, true, 303);
    exit;
}

function kopf(string $titel, string $klasse = ''): void
{
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>' . sb_e($titel) . ' — Studio Breve</title>'
        . '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/verwaltung.css?v=' . (int) @filemtime(__DIR__ . '/assets/verwaltung.css') . '">'
        . '<script src="assets/qrcode.js" defer></script><script src="assets/verwaltung.js?v=' . (int) @filemtime(__DIR__ . '/assets/verwaltung.js') . '" defer></script></head>'
        . '<body class="' . sb_e($klasse) . '">';
}

function fuss(): void
{
    echo '</body></html>';
    exit;
}

function csrf_feld(): string
{
    return '<input type="hidden" name="csrf" value="' . sb_e(sb_csrf()) . '">';
}

/** Kleine Karte für Einrichtung, Anmeldung und Passwortwechsel. */
function karte(string $titel, string $inhalt, string $unten = ''): never
{
    global $WEBSITE;
    kopf($titel, 'schmal');
    echo '<main class="karte"><a class="marke" href="' . sb_e($WEBSITE) . '/de/"><img src="assets/favicon.svg" alt="" width="28" height="28"> Studio Breve</a>'
        . '<h1>' . sb_e($titel) . '</h1>' . $inhalt . $unten . '</main>';
    fuss();
}

function meldung(?string $text, string $art = 'fehler'): string
{
    return $text ? '<p class="' . $art . '" role="' . ($art === 'fehler' ? 'alert' : 'status') . '">' . sb_e($text) . '</p>' : '';
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$aktion = (string) ($_POST['aktion'] ?? $_GET['aktion'] ?? '');
$zugang = sb_zugang();

/* ---------- Aktionen (POST) ---------- */
if ($methode === 'POST') {
    if (!sb_csrf_ok()) {
        http_response_code(400);
        karte('Bitte erneut versuchen', '<p>Das Formular war abgelaufen. Bitte die Seite neu laden und noch einmal absenden.</p><p><a class="knopf" href="./">Neu laden</a></p>');
    }

    if ($aktion === 'einrichten') {
        $code = (string) sb_config()['einrichtungscode'];
        if ($zugang !== null || $code === '' || !hash_equals($code, (string) ($_POST['code'] ?? ''))) {
            http_response_code(403);
            karte('Einrichtung nicht möglich', '<p>Der Einrichtungslink ist ungültig oder die Verwaltung ist schon eingerichtet.</p><p><a class="knopf" href="./">Zur Anmeldung</a></p>');
        }
        $fehler = sb_passwort_fehler((string) ($_POST['passwort'] ?? ''), (string) ($_POST['wiederholung'] ?? ''));
        if ($fehler) {
            $_GET['einrichten'] = $_POST['code'];
            $einrichtFehler = $fehler;
        } else {
            sb_passwort_setzen((string) $_POST['passwort']);
            sb_sitzung_starten();
            weiter('./?ok=eingerichtet');
        }
    } elseif ($aktion === 'anmelden') {
        if (!sb_grenze_offen('anmeldung', SB_MAX_VERSUCHE)) {
            http_response_code(429);
            $anmeldeFehler = 'Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen.';
        } elseif (sb_passwort_pruefen((string) ($_POST['passwort'] ?? ''))) {
            sb_grenze_loeschen('anmeldung');
            sb_sitzung_starten();
            weiter('./');
        } else {
            $rest = sb_grenze_zaehlen('anmeldung', SB_MAX_VERSUCHE, SB_SPERRFENSTER);
            http_response_code(401);
            $anmeldeFehler = $rest > 0
                ? "Passwort falsch. Noch $rest " . ($rest === 1 ? 'Versuch' : 'Versuche') . '.'
                : 'Zu viele Fehlversuche. Bitte in 15 Minuten erneut versuchen.';
        }
    } elseif ($aktion === 'abmelden') {
        sb_sitzung_beenden();
        weiter('./?ok=abgemeldet');
    } elseif (!sb_angemeldet()) {
        weiter('./');
    } elseif ($aktion === 'passwort') {
        if (!sb_passwort_pruefen((string) ($_POST['aktuell'] ?? ''))) {
            $pwFehler = 'Das aktuelle Passwort ist falsch.';
        } elseif ($f = sb_passwort_fehler((string) ($_POST['neu'] ?? ''), (string) ($_POST['wiederholung'] ?? ''))) {
            $pwFehler = $f;
        } else {
            sb_passwort_setzen((string) $_POST['neu']); // neuer Sitzungsschlüssel meldet andere Geräte ab
            sb_sitzung_starten();
            weiter('./?ok=pw');
        }
        $_GET['seite'] = 'passwort';
    } elseif ($aktion === 'einstellungen') {
        sb_einstellung_setzen('eigene_ausnehmen', ($_POST['eigene_ausnehmen'] ?? '') === 'ja' ? '1' : '0');
        sb_einstellung_setzen('bericht_aktiv', ($_POST['bericht_aktiv'] ?? '') === 'ja' ? '1' : '0');
        weiter('./?ok=einstellung#einstellungen');
    } elseif ($aktion === 'vorlagen') {
        foreach (array_keys(SB_VORLAGEN) as $sp) {
            $text = str_replace("\r\n", "\n", trim((string) ($_POST['vorlage_' . $sp] ?? '')));
            sb_einstellung_setzen('vorlage_' . $sp, $text === '' ? SB_VORLAGEN[$sp]['text'] : mb_substr($text, 0, 3000));
        }
        weiter('./?ok=vorlagen#vorlagen');
    } elseif ($aktion === 'bericht_test') {
        weiter(sb_wochenbericht_pruefen(true) ? './?ok=bericht#einstellungen' : './?ok=bericht_fehler#einstellungen');
    } elseif ($aktion === 'anfrage_speichern') {
        $id = (string) ($_POST['id'] ?? '');
        $status = isset(SB_ANFRAGE_STATUS[$_POST['status'] ?? '']) ? (string) $_POST['status'] : 'neu';
        sb_db()->prepare('UPDATE anfragen SET status = ?, notiz = ?, geaendert = ? WHERE id = ?')
            ->execute([$status, mb_substr(trim((string) ($_POST['notiz'] ?? '')), 0, 2000), date('c'), $id]);
        $f = (string) ($_POST['filter'] ?? '');
        weiter('./?ok=anfrage' . ($f !== '' ? '&anfragen=' . rawurlencode($f) : '') . '#a-' . rawurlencode($id));
    } elseif ($aktion === 'automatik') {
        $tage = array_values(array_intersect(array_map('intval', (array) ($_POST['tage'] ?? [])), [1, 2, 3, 4, 5, 6, 7]));
        $uhr = (string) ($_POST['uhrzeit'] ?? '21:40');
        sb_einstellung_setzen('auto_aktiv', ($_POST['aktiv'] ?? '') === 'ja' ? '1' : '0');
        sb_einstellung_setzen('auto_anzahl', (string) max(1, min(10, (int) ($_POST['anzahl'] ?? 3))));
        sb_einstellung_setzen('auto_tage', implode(',', $tage));
        $uhr = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $uhr) ? $uhr : '21:40';
        $vorher = sb_plan();
        if ($uhr !== $vorher['uhrzeit']) {
            // Die geplante Aufgabe übernimmt die neue Uhrzeit erst bei ihrem nächsten Start (zur bisherigen Uhrzeit).
            $wechsel = sb_naechster_lauf(['aktiv' => true, 'tage' => [1, 2, 3, 4, 5, 6, 7], 'uhrzeit' => sb_einstellung('auto_uhrzeit_laeuft', $vorher['uhrzeit'])]);
            sb_einstellung_setzen('auto_uhrzeit_laeuft', sb_einstellung('auto_uhrzeit_laeuft', $vorher['uhrzeit']));
            sb_einstellung_setzen('auto_wechsel', (string) ($wechsel ?? 0));
        }
        sb_einstellung_setzen('auto_uhrzeit', $uhr);
        sb_einstellung_setzen('auto_geaendert', date('c'));
        weiter('./?seite=automatik&ok=einstellung');
    } elseif ($aktion === 'katalog_neu') {
        sb_katalog(true);
        weiter('./?seite=produkte');
    } elseif ($aktion === 'anfrage_loeschen') {
        sb_db()->prepare('DELETE FROM anfragen WHERE id = ?')->execute([(string) ($_POST['id'] ?? '')]);
        weiter('./?ok=geloescht#anfragen');
    } else {
        weiter('./');
    }
}

/* ---------- Ersteinrichtung ---------- */
if ($zugang === null) {
    $code = (string) sb_config()['einrichtungscode'];
    $mitgebracht = (string) ($_GET['einrichten'] ?? '');
    if ($code === '' || !hash_equals($code, $mitgebracht)) {
        karte('Verwaltung noch nicht eingerichtet', '<p>Die Einrichtung ist nur über den persönlichen Einrichtungslink möglich, der beim Hochladen angezeigt wurde.</p>');
    }
    karte('Passwort festlegen',
        meldung($einrichtFehler ?? null)
        . '<p>Legen Sie das Passwort für die Verwaltung fest (mindestens ' . SB_MIN_PASSWORT . ' Zeichen). Der Einrichtungslink ist danach ungültig.</p>'
        . '<form method="post" action="./" class="stapel">' . csrf_feld()
        . '<input type="hidden" name="aktion" value="einrichten"><input type="hidden" name="code" value="' . sb_e($mitgebracht) . '">'
        . '<label>Passwort <input type="password" name="passwort" autocomplete="new-password" minlength="' . SB_MIN_PASSWORT . '" required></label>'
        . '<label>Passwort wiederholen <input type="password" name="wiederholung" autocomplete="new-password" minlength="' . SB_MIN_PASSWORT . '" required></label>'
        . '<button type="submit">Passwort speichern</button></form>');
}

/* ---------- Anmeldung ---------- */
if (!sb_angemeldet()) {
    $ok = ($_GET['ok'] ?? '') === 'abgemeldet' ? 'Sie sind abgemeldet.' : null;
    karte('Verwaltung',
        meldung($anmeldeFehler ?? null) . meldung($ok, 'ok')
        . '<form method="post" action="./" class="stapel">' . csrf_feld()
        . '<input type="hidden" name="aktion" value="anmelden">'
        . '<label>Passwort <input type="password" name="passwort" autocomplete="current-password" required autofocus></label>'
        . '<button type="submit">Anmelden</button></form>',
        '<p class="zurueck"><a href="' . sb_e($WEBSITE) . '/de/">← Zurück zur Website</a></p>');
}

/* ---------- CSV-Ausgaben ---------- */
$datumOk = static fn (string $d): string => preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : '';
$von = $datumOk((string) ($_GET['von'] ?? ''));
$bis = $datumOk((string) ($_GET['bis'] ?? ''));

function besuche_laden(string $von, string $bis): array
{
    $sql = 'SELECT * FROM besuche WHERE 1 = 1';
    $werte = [];
    if ($von !== '') { $sql .= ' AND datum >= ?'; $werte[] = $von; }
    if ($bis !== '') { $sql .= ' AND datum <= ?'; $werte[] = $bis; }
    $st = sb_db()->prepare($sql . ' ORDER BY beginn DESC');
    $st->execute($werte);
    $rows = $st->fetchAll();
    foreach ($rows as &$r) {
        $r['seiten'] = json_decode((string) $r['seiten'], true) ?: [];
    }
    return $rows;
}

function csv_senden(string $datei, array $kopfzeile, array $zeilen): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $datei . '"');
    $q = static fn ($s): string => '"' . str_replace('"', '""', (string) $s) . '"';
    echo "\u{FEFF}" . implode(',', array_map($q, $kopfzeile)) . "\n";
    foreach ($zeilen as $z) {
        echo implode(',', array_map($q, $z)) . "\n";
    }
    exit;
}

if ($aktion === 'export') {
    sb_alte_besuche_loeschen();
    $zeilen = [];
    foreach (besuche_laden($von, $bis) as $r) {
        $seiten = implode(' > ', array_map(static fn ($p) => ($p['path'] ?? '') . (isset($p['ms']) ? '(' . $p['ms'] . 'ms)' : ''), $r['seiten']));
        $zeilen[] = [$r['sid'], $r['datum'], $r['beginn'], $r['sprache'], $r['land'] ?? '', $r['region'] ?? '', $r['stadt'] ?? '', sb_ip_besuch($r), $r['geraet'], $r['system'], $r['browser'], $r['bildschirm'], $r['quelle'], $r['referrer'], $seiten];
    }
    csv_senden('studio-breve-besuche.csv', ['id', 'date', 'startedAt', 'lang', 'country', 'region', 'city', 'ip', 'device', 'os', 'browser', 'screen', 'source', 'referrer', 'pages'], $zeilen);
}
if ($aktion === 'export_anfragen') {
    $zeilen = [];
    foreach (sb_db()->query('SELECT * FROM anfragen ORDER BY erstellt DESC')->fetchAll() as $a) {
        $zeilen[] = [$a['id'], $a['erstellt'], $a['seitensprache'], $a['wunschsprache'], $a['name'], $a['email'], $a['telefon'] ?? '', $a['ort'] ?? '', $a['paket'] ?? '', $a['anliegen'], $a['nachricht'], $a['werbung'] ? 'ja' : 'nein', $a['einwilligung'], $a['quelle'], SB_ANFRAGE_STATUS[sb_anfrage_status($a)][0], $a['notiz'] ?? ''];
    }
    csv_senden('studio-breve-anfragen.csv', ['id', 'erstellt', 'seitensprache', 'wunschsprache', 'name', 'email', 'telefon', 'ort', 'paket', 'anliegen', 'nachricht', 'werbung', 'einwilligung', 'quelle', 'status', 'notiz'], $zeilen);
}

/* ---------- Passwort ändern ---------- */
if (($_GET['seite'] ?? '') === 'passwort') {
    karte('Passwort ändern',
        meldung($pwFehler ?? null)
        . '<form method="post" action="./" class="stapel">' . csrf_feld()
        . '<input type="hidden" name="aktion" value="passwort">'
        . '<label>Aktuelles Passwort <input type="password" name="aktuell" autocomplete="current-password" required></label>'
        . '<label>Neues Passwort <input type="password" name="neu" autocomplete="new-password" minlength="' . SB_MIN_PASSWORT . '" required></label>'
        . '<label>Neues Passwort wiederholen <input type="password" name="wiederholung" autocomplete="new-password" minlength="' . SB_MIN_PASSWORT . '" required></label>'
        . '<button type="submit">Passwort ändern</button></form>',
        '<p class="zurueck"><a href="./">← Zurück zur Verwaltung</a></p>');
}

/* ---------- Reiter und Kopfleiste ---------- */
function reiter(string $aktiv): string
{
    $h = '<nav class="reiter" aria-label="Bereiche">';
    foreach (['' => 'Übersicht', 'produkte' => 'Produkte', 'automatik' => 'Automatik', 'links' => 'Links &amp; QR'] as $k => $t) {
        $h .= '<a href="./' . ($k ? '?seite=' . $k : '') . '"' . ($k === $aktiv ? ' aria-current="page"' : '') . '>' . $t . '</a>';
    }
    return $h . '</nav>';
}
function leiste(string $aktiv): void
{
    global $WEBSITE;
    $knoepfe = '<a class="knopf hell" href="' . sb_e($WEBSITE) . '/de/">Website</a>'
        . '<a class="knopf hell" href="./?seite=passwort">Passwort ändern</a><form method="post" action="./">' . csrf_feld()
        . '<input type="hidden" name="aktion" value="abmelden"><button class="hell" type="submit">Abmelden</button></form>';
    echo '<header class="leiste"><h1>Verwaltung <span class="marke-text">— Studio Breve</span></h1>' . reiter($aktiv)
        . '<nav class="werkzeuge nur-breit" aria-label="Konto">' . $knoepfe . '</nav>'
        . '<details class="menue nur-schmal"><summary>Menü</summary><div class="menue-inhalt">' . $knoepfe . '</div></details></header>';
}
function preis_text(array $preise): string
{
    if (!$preise) return '—';
    return implode(' · ', array_map(static function ($x) {
        $b = (float) $x['betrag'];
        $t = $b == 0 ? 'kostenlos' : number_format($b, $b == floor($b) ? 0 : 2, ',', '.') . ' €' . ($x['intervall'] === 'month' ? '/Monat' : (str_contains((string) $x['einheit'], 'einmalig') ? '' : ' einmalig'));
        return trim(($x['bezeichnung'] ? $x['bezeichnung'] . ': ' : '') . $t . ($x['einheit'] ? ' ' . $x['einheit'] : '') . ($x['mwst'] === 'excl' ? ' zzgl. MwSt.' : ''));
    }, $preise));
}
function kennzahl(string $wert, string $titel, string $extra = '', string $klasse = ''): string
{
    return '<div class="kennzahl' . ($klasse ? ' ' . $klasse : '') . '"><b>' . $wert . '</b><span>' . sb_e($titel) . '</span>' . $extra . '</div>';
}
function tabelle(string $kopf1, string $kopf2, array $daten, bool $balken = false, ?callable $titel = null): string
{
    if (!$daten) {
        return '<p class="leise">Noch keine Daten.</p>';
    }
    $max = max($daten) ?: 1;
    $h = '<table><thead><tr><th>' . sb_e($kopf1) . '</th><th class="zahl">' . sb_e($kopf2) . '</th></tr></thead><tbody>';
    foreach ($daten as $k => $n) {
        $h .= '<tr><td class="pfad"' . ($titel ? ' title="' . sb_e($titel((string) $k)) . '"' : '') . '>' . sb_e((string) $k) . '</td><td class="zahl">' . (int) $n
            . ($balken ? '<meter min="0" max="' . (int) $max . '" value="' . (int) $n . '"></meter>' : '') . '</td></tr>';
    }
    return $h . '</tbody></table>';
}
/** Aufrufe der Paketseiten je slug: ['30' => [slug => n], 'alle' => [slug => n]] */
function paket_aufrufe(): array
{
    $grenze = date('Y-m-d', time() - 29 * 86400);
    $r = ['30' => [], 'alle' => []];
    foreach (sb_db()->query('SELECT datum, seiten FROM besuche')->fetchAll() as $b) {
        foreach (json_decode((string) $b['seiten'], true) ?: [] as $p) {
            if (($slug = sb_paket_aus_pfad((string) ($p['path'] ?? ''))) === null) continue;
            $r['alle'][$slug] = ($r['alle'][$slug] ?? 0) + 1;
            if ($b['datum'] >= $grenze) $r['30'][$slug] = ($r['30'][$slug] ?? 0) + 1;
        }
    }
    return $r;
}
function paket_anfragen(): array
{
    $r = [];
    foreach (sb_db()->query("SELECT paket, COUNT(*) AS n FROM anfragen WHERE paket IS NOT NULL AND paket <> '' GROUP BY paket")->fetchAll() as $a) {
        $s = preg_replace('/^bundle:/', '', (string) $a['paket']);
        $r[$s] = ($r[$s] ?? 0) + (int) $a['n'];
    }
    return $r;
}
const SB_STATUS = ['available' => ['fertig entwickelt', 'ok'], 'waitlist' => ['in Planung (Warteliste)', 'warn'], 'inquiry' => ['in Planung (Anfrage)', 'warn'], 'soon' => ['bald', 'warn']];
const SB_ABLAGE = 'C:\\Users\\biker\\Studio-Breve-Vorschau\\Produkte\\';
$okTexte = ['eingerichtet' => 'Die Verwaltung ist eingerichtet. Sie sind angemeldet.', 'pw' => 'Passwort geändert.', 'einstellung' => 'Einstellung gespeichert.',
    'geloescht' => 'Anfrage gelöscht.', 'anfrage' => 'Anfrage gespeichert.', 'vorlagen' => 'Antwort-Vorlagen gespeichert.',
    'bericht' => 'Der Wochenbericht der letzten Woche wurde an ' . sb_config()['benachrichtigung'] . ' geschickt.'];

/* ---------- Produkte ---------- */
if (($_GET['seite'] ?? '') === 'produkte') {
    $k = sb_katalog();
    $alle = $k['pakete'] ?? [];
    $aufrufe = paket_aufrufe();
    $anfrPaket = paket_anfragen();
    $filter = (string) ($_GET['status'] ?? '');
    $liste = array_values(array_filter($alle, static fn ($x) => in_array($filter, ['', 'interesse'], true) || ($filter === 'fertig' ? $x['status'] === 'available' : $x['status'] !== 'available')));
    if ($filter === 'interesse') {
        usort($liste, static fn ($a, $b) => [$aufrufe['30'][$b['slug']] ?? 0, $anfrPaket[$b['slug']] ?? 0, $aufrufe['alle'][$b['slug']] ?? 0] <=> [$aufrufe['30'][$a['slug']] ?? 0, $anfrPaket[$a['slug']] ?? 0, $aufrufe['alle'][$a['slug']] ?? 0]);
    } else {
        usort($liste, static fn ($a, $b) => [$b['status'] === 'available', $b['fertigAm'] ?? '', $b['nr']] <=> [$a['status'] === 'available', $a['fertigAm'] ?? '', $a['nr']]);
    }
    $fertig = count(array_filter($alle, static fn ($x) => $x['status'] === 'available'));
    $mitSetup = count(array_filter($alle, static fn ($x) => $x['status'] === 'available' && $x['setup'] !== ''));
    $proTag = [];
    foreach ($alle as $x) if (!empty($x['fertigAm'])) $proTag[$x['fertigAm']][] = $x['name'];
    krsort($proTag);
    $gefragt = $aufrufe['30'];
    foreach ($anfrPaket as $s => $n) $gefragt[$s] = ($gefragt[$s] ?? 0) + 0;
    uksort($gefragt, static fn ($a, $b) => [($aufrufe['30'][$b] ?? 0) + 10 * ($anfrPaket[$b] ?? 0)] <=> [($aufrufe['30'][$a] ?? 0) + 10 * ($anfrPaket[$a] ?? 0)]);
    $namen = sb_katalog_namen();
    kopf('Produkte', 'breit');
    leiste('produkte');
    echo '<main class="inhalt">' . ($k['fehler'] ? '<p class="fehler">' . sb_e($k['fehler']) . '</p>' : '')
        . '<section class="kennzahlen">' . kennzahl((string) count($alle), 'Pakete im Katalog') . kennzahl((string) $fertig, 'fertig entwickelt')
        . kennzahl((string) $mitSetup, 'davon mit Setup') . kennzahl((string) (count($alle) - $fertig), 'in Planung')
        . kennzahl((string) array_sum($aufrufe['30']), 'Paket-Aufrufe (30 Tage)') . kennzahl((string) array_sum($anfrPaket), 'Anfragen zu Paketen') . '</section>';
    echo '<section class="kasten"><h2>Am meisten gefragt (30 Tage)</h2>';
    if (!$gefragt) {
        echo '<p class="leise">Noch keine Aufrufe von Paketseiten. Sobald Besucher Pakete ansehen, steht hier, was am meisten interessiert – gut für Werbung und für die Wahl, was als Nächstes gebaut wird.</p>';
    } else {
        echo '<table><thead><tr><th>Paket</th><th class="zahl">Aufrufe 30 Tage</th><th class="zahl">Anfragen</th></tr></thead><tbody>';
        foreach (array_slice($gefragt, 0, 5, true) as $s => $_) echo '<tr><td>' . sb_e($namen[$s] ?? $s) . '</td><td class="zahl">' . (int) ($aufrufe['30'][$s] ?? 0) . '</td><td class="zahl">' . (int) ($anfrPaket[$s] ?? 0) . '</td></tr>';
        echo '</tbody></table>';
    }
    echo '</section>';
    if ($proTag) {
        echo '<section class="kasten"><h2>Zuletzt fertig gebaut</h2><table><thead><tr><th>Datum</th><th>Pakete</th></tr></thead><tbody>';
        foreach (array_slice($proTag, 0, 10, true) as $d => $n) echo '<tr><td>' . sb_e(date('d.m.Y', strtotime($d))) . '</td><td>' . count($n) . ' – ' . sb_e(implode(', ', $n)) . '</td></tr>';
        echo '</tbody></table></section>';
    }
    echo '<section class="kasten"><div class="zeile"><h2>Alle Pakete</h2><div class="werkzeuge">';
    foreach (['' => 'Alle', 'fertig' => 'Fertig', 'planung' => 'In Planung', 'interesse' => 'Nach Interesse'] as $f => $t) echo '<a class="knopf' . ($filter === $f ? '' : ' hell') . '" href="./?seite=produkte' . ($f ? '&amp;status=' . $f : '') . '">' . $t . '</a>';
    echo '<form method="post" action="./">' . csrf_feld() . '<input type="hidden" name="aktion" value="katalog_neu"><button class="hell" type="submit">Neu laden</button></form></div></div>'
        . '<p class="leise">Stand der Website: ' . sb_e($k['stand'] ? date('d.m.Y H:i', strtotime($k['stand'])) : '—') . '. Ablage auf deinem PC: ' . sb_e(SB_ABLAGE) . '&lt;Name&gt;</p>'
        . '<div class="scroll"><table class="produkte"><thead><tr><th>Nr.</th><th>Paket</th><th>Status</th><th>Preis</th><th>Lieferung / Setup</th><th class="zahl">Aufrufe 30 T.</th><th class="zahl">Anfragen</th><th>Ablage auf dem PC</th></tr></thead><tbody>';
    foreach ($liste as $x) {
        [$st, $klasse] = SB_STATUS[$x['status']] ?? [$x['status'], ''];
        $istFertig = $x['status'] === 'available';
        echo '<tr><td>' . (int) $x['nr'] . '</td><td><a href="' . sb_e($WEBSITE . $x['seite']) . '" target="_blank" rel="noopener"><b>' . sb_e($x['name']) . '</b></a><br><span class="leise">' . sb_e($x['kurz']) . '</span><br><span class="leise">'
            . sb_e($x['kategorie'] . ' · ' . $x['art']) . '</span></td><td><span class="chip ' . $klasse . '">' . sb_e($st) . '</span>' . (!empty($x['fertigAm']) ? '<br><span class="leise">seit ' . sb_e(date('d.m.Y', strtotime($x['fertigAm']))) . '</span>' : '') . '</td>'
            . '<td>' . sb_e(preis_text($x['preise'] ?? [])) . '</td><td>' . ($istFertig ? ($x['setup'] ? '<span class="chip ok">' . sb_e($x['setup']) . '</span>' : '<span class="chip warn">noch ohne Setup</span>') : '—') . '</td>'
            . '<td class="zahl">' . (int) ($aufrufe['30'][$x['slug']] ?? 0) . '<br><span class="leise">' . (int) ($aufrufe['alle'][$x['slug']] ?? 0) . ' gesamt</span></td><td class="zahl">' . (int) ($anfrPaket[$x['slug']] ?? 0) . '</td>'
            . '<td class="pfad">' . ($istFertig ? sb_e(SB_ABLAGE . $x['name'] . '\\') : '—') . '</td></tr>';
    }
    echo '</tbody></table></div></section></main>';
    fuss();
}

/* ---------- Automatik ---------- */
if (($_GET['seite'] ?? '') === 'automatik') {
    $plan = sb_plan();
    $naechster = sb_naechster_lauf($plan);
    $k = sb_katalog();
    $heuteNeu = count(array_filter($k['pakete'] ?? [], static fn ($x) => ($x['fertigAm'] ?? '') === date('Y-m-d')));
    $laeufe = sb_laeufe(20);
    $fehlt = sb_lauf_fehlt();
    $uhrzeiten = [];
    for ($h = 6; $h <= 23; $h++) foreach (['10', '40'] as $m) $uhrzeiten[] = sprintf('%02d:%s', $h, $m);
    if (!in_array($plan['uhrzeit'], $uhrzeiten, true)) $uhrzeiten[] = $plan['uhrzeit'];
    $letzter = $laeufe[0] ?? null;
    kopf('Automatik', 'breit');
    leiste('automatik');
    echo '<main class="inhalt">' . meldung(($_GET['ok'] ?? '') === 'einstellung' ? 'Gespeichert. Der nächste Lauf richtet sich danach.' : null, 'ok')
        . ($fehlt ? '<p class="fehler" role="alert">Vom Lauf am ' . sb_e(date('d.m. \u\m H:i', $fehlt)) . ' ist keine Meldung angekommen. Meist war der PC aus oder die Claude-App nicht geöffnet – der Lauf braucht deinen PC.</p>' : '')
        . '<section class="kennzahlen">' . kennzahl($plan['aktiv'] ? 'an' : 'Pause', 'Automatik') . kennzahl((string) $plan['anzahl'], 'Pakete pro Lauf')
        . kennzahl($naechster ? sb_e(date('d.m. H:i', $naechster)) : '—', 'nächster Lauf') . kennzahl((string) $heuteNeu, 'heute fertig gebaut')
        . kennzahl($letzter ? sb_e(date('d.m. H:i', strtotime($letzter['zeit']))) : '—', 'letzte Meldung', $letzter ? '<span class="chip ' . (SB_LAUF_STATUS[$letzter['status']][1] ?? '') . '">' . sb_e(SB_LAUF_STATUS[$letzter['status']][0] ?? $letzter['status']) . '</span>' : '')
        . '</section>'
        . '<section class="kasten"><h2>Wann und wie viele Pakete gebaut werden</h2><form method="post" action="./" class="stapel">' . csrf_feld() . '<input type="hidden" name="aktion" value="automatik">'
        . '<label class="haken"><input type="checkbox" name="aktiv" value="ja"' . ($plan['aktiv'] ? ' checked' : '') . '> Automatik ist an (ohne Haken: Pause, es wird nichts gebaut)</label>'
        . '<label>Pakete pro Lauf <select name="anzahl">';
    for ($i = 1; $i <= 10; $i++) echo '<option' . ($i === $plan['anzahl'] ? ' selected' : '') . '>' . $i . '</option>';
    echo '</select></label><fieldset class="tage"><legend>An diesen Tagen</legend>';
    foreach (SB_TAGE as $n => $t) echo '<label class="haken"><input type="checkbox" name="tage[]" value="' . $n . '"' . (in_array($n, $plan['tage'], true) ? ' checked' : '') . '> ' . $t . '</label>';
    echo '</fieldset><label>Uhrzeit (Italien) <select name="uhrzeit">';
    foreach ($uhrzeiten as $u) echo '<option' . ($u === $plan['uhrzeit'] ? ' selected' : '') . '>' . $u . '</option>';
    echo '</select></label><p><button type="submit">Speichern</button></p></form>'
        . '<p class="leise">Jeder Lauf entwirft die eingestellte Zahl neuer Pakete, entwickelt sie komplett mit Setup-Datei, legt sie auf deinem PC unter ' . sb_e(SB_ABLAGE) . ' ab und veröffentlicht sie. Dein PC muss dafür an sein. '
        . 'Mehr als 3–4 Pakete pro Lauf dauern entsprechend länger. Eine neue Uhrzeit übernimmt die Automatik bei ihrem nächsten Start; bis dahin läuft sie noch zur bisherigen Zeit.</p></section>'
        . '<section class="kasten"><h2>Lauf-Protokoll</h2>';
    if (!$laeufe) {
        echo '<p class="leise">Noch keine Meldungen. Ab dem nächsten Lauf meldet die Automatik hier, ob alles geklappt hat und welche Pakete gebaut wurden.</p>';
    } else {
        echo '<div class="scroll"><table><thead><tr><th>Zeit</th><th>Ergebnis</th><th>Pakete</th><th>Meldung</th></tr></thead><tbody>';
        foreach ($laeufe as $l) {
            [$t, $kl] = SB_LAUF_STATUS[$l['status']] ?? [$l['status'], ''];
            $pk = json_decode((string) $l['pakete'], true) ?: [];
            echo '<tr><td>' . sb_e(date('d.m.Y H:i', strtotime($l['zeit']))) . '</td><td><span class="chip ' . $kl . '">' . sb_e($t) . '</span></td><td>'
                . ($pk ? (int) $l['anzahl'] . ' – ' . sb_e(implode(', ', $pk)) : '—') . '</td><td>' . sb_e((string) $l['meldung']) . '</td></tr>';
        }
        echo '</tbody></table></div>';
    }
    echo '</section></main>';
    fuss();
}

/* ---------- Links & QR (Kampagnen-Baukasten) ---------- */
if (($_GET['seite'] ?? '') === 'links') {
    $namen = sb_katalog_namen();
    $ziele = ['/de/' => 'Startseite (DE)', '/it/' => 'Startseite (IT)', '/de/pakete/' => 'Alle Pakete (DE)', '/it/pacchetti/' => 'Alle Pakete (IT)', '/de/kontakt/' => 'Kontakt (DE)', '/it/contatti/' => 'Kontakt (IT)'];
    asort($namen);
    foreach ($namen as $s => $n) { $ziele['/it/pacchetti/' . $s . '/'] = 'Paket ' . $n . ' (IT)'; $ziele['/de/pakete/' . $s . '/'] = 'Paket ' . $n . ' (DE)'; }
    $ziel = isset($ziele[$_GET['ziel'] ?? '']) ? (string) $_GET['ziel'] : '/it/';
    $kanal = isset(SB_KANAELE[$_GET['kanal'] ?? '']) ? (string) $_GET['kanal'] : 'instagram';
    $aktionName = substr(preg_replace('/[^a-z0-9-]+/', '-', strtolower(trim((string) ($_GET['name'] ?? '')))) ?? '', 0, 40);
    $aktionName = trim($aktionName, '-');
    $link = null;
    if (isset($_GET['erstellen'])) {
        $link = $WEBSITE . $ziel . '?' . http_build_query(['utm_source' => $kanal, 'utm_medium' => SB_KANAELE[$kanal][1], 'utm_campaign' => $aktionName ?: date('Y-m') . '-' . $kanal]);
    }
    $kampagnen = [];
    foreach (sb_db()->query('SELECT utm, quelle FROM besuche WHERE utm IS NOT NULL')->fetchAll() as $b) {
        if ($kn = sb_kampagne($b)) $kampagnen[$kn] = ($kampagnen[$kn] ?? 0) + 1;
    }
    arsort($kampagnen);
    kopf('Links & QR', 'breit');
    leiste('links');
    echo '<main class="inhalt"><section class="kasten"><h2>Werbe-Link oder QR-Code erstellen</h2>'
        . '<p class="leise">Für jeden Kanal ein eigener Link: Dann siehst du in der Übersicht unter „Kampagnen“, wie viele Besucher von Instagram, vom Flyer oder vom WhatsApp-Status kamen. Für Flyer, Visitenkarten und Aushänge den QR-Code nehmen.</p>'
        . '<form method="get" action="./" class="baukasten"><input type="hidden" name="seite" value="links"><input type="hidden" name="erstellen" value="1">'
        . '<label>Wohin soll der Link führen? <select name="ziel">';
    foreach ($ziele as $p => $t) echo '<option value="' . sb_e($p) . '"' . ($p === $ziel ? ' selected' : '') . '>' . sb_e($t) . '</option>';
    echo '</select></label><label>Wo wird er verwendet? <select name="kanal">';
    foreach (SB_KANAELE as $kk => [$t, $_]) echo '<option value="' . $kk . '"' . ($kk === $kanal ? ' selected' : '') . '>' . sb_e($t) . '</option>';
    echo '</select></label><label>Name der Aktion (frei, z. B. herbst-2026) <input type="text" name="name" maxlength="40" value="' . sb_e($aktionName) . '" placeholder="' . sb_e(date('Y-m')) . '-' . sb_e($kanal) . '"></label>'
        . '<p><button type="submit">Link erstellen</button></p></form>';
    if ($link) {
        echo '<div class="ergebnis"><label>Dein Link <input type="text" id="werbelink" readonly value="' . sb_e($link) . '"></label>'
            . '<p class="werkzeuge"><button type="button" class="hell" data-kopieren="werbelink">Link kopieren</button><button type="button" class="hell" data-qr-speichern>QR-Code als Bild speichern</button></p>'
            . '<div class="qr" data-qr="' . sb_e($link) . '" role="img" aria-label="QR-Code für den Link"></div>'
            . '<p class="leise">Tipp für Druck: QR-Code mindestens 2 × 2 cm groß, schwarz auf weiß. Vorher mit dem Handy testen.</p></div>';
    }
    echo '</section><section class="kasten"><h2>Bisherige Kampagnen</h2><p class="leise">Besuche je Aktion · Kanal (letzte ' . SB_AUFBEWAHRUNG_TAGE . ' Tage).</p>' . tabelle('Aktion · Kanal', 'Besuche', $kampagnen, true) . '</section></main>';
    fuss();
}

/* ---------- Übersicht ---------- */
sb_alte_besuche_loeschen();
sb_alte_anfragen_loeschen();
try { sb_wochenbericht_pruefen(); } catch (Throwable $e) { }
$heute = sb_heute();
$tagMinus = static fn (int $n): string => sb_heute(time() - $n * 86400);
$b7 = sb_tage_summe($tagMinus(6), $heute); $b7v = sb_tage_summe($tagMinus(13), $tagMinus(7));
$b30 = sb_tage_summe($tagMinus(29), $heute); $b30v = sb_tage_summe($tagMinus(59), $tagMinus(30));
$a30 = sb_anfragen_zahl($tagMinus(29) . 'T00:00:00', '9999'); $a30v = sb_anfragen_zahl($tagMinus(59) . 'T00:00:00', $tagMinus(29) . 'T00:00:00');
$quote = $b30 > 0 ? number_format($a30 / $b30 * 100, 1, ',', '.') : '0';

$anfragenAlle = sb_db()->query('SELECT * FROM anfragen ORDER BY erstellt DESC')->fetchAll();
$zahlStatus = ['offen' => 0] + array_fill_keys(array_keys(SB_ANFRAGE_STATUS), 0);
foreach ($anfragenAlle as $a) {
    $s = sb_anfrage_status($a);
    $zahlStatus[$s]++;
    if (in_array($s, ['neu', 'beantwortet', 'angebot'], true)) $zahlStatus['offen']++;
}
$aFilter = (string) ($_GET['anfragen'] ?? 'offen');
if (!isset($zahlStatus[$aFilter]) && $aFilter !== 'alle') $aFilter = 'offen';
$anfragen = array_values(array_filter($anfragenAlle, static function ($a) use ($aFilter) {
    $s = sb_anfrage_status($a);
    return $aFilter === 'alle' || $s === $aFilter || ($aFilter === 'offen' && in_array($s, ['neu', 'beantwortet', 'angebot'], true));
}));
usort($anfragen, static fn ($x, $y) => [sb_anfrage_status($y) === 'neu', $y['erstellt']] <=> [sb_anfrage_status($x) === 'neu', $x['erstellt']]);

$besuche = besuche_laden($von, $bis);
$zaehle = static function (callable $schluessel) use ($besuche): array {
    $m = [];
    foreach ($besuche as $b) {
        $k = (string) $schluessel($b);
        if ($k === '') continue;
        $m[$k] = ($m[$k] ?? 0) + 1;
    }
    arsort($m);
    return sb_unbekannt_ans_ende($m);
};
$seitenZahl = [];
$seitenPfad = [];
foreach ($besuche as $b) {
    foreach ($b['seiten'] as $p) {
        $pfad = (string) ($p['path'] ?? '');
        $name = sb_seiten_name($pfad);
        $seitenZahl[$name] = ($seitenZahl[$name] ?? 0) + 1;
        $seitenPfad[$name] = $pfad;
    }
}
arsort($seitenZahl);
$topSeiten = array_slice($seitenZahl, 0, 12, true);
$gruppen = $zaehle(static fn ($b) => sb_quellen_gruppe($b));
$kampagnen = array_slice($zaehle(static fn ($b) => sb_kampagne($b) ?? ''), 0, 10, true);
$quellen = array_slice($zaehle(static fn ($b) => $b['quelle'] === 'direct' ? 'direkt' : $b['quelle']), 0, 12, true);
$laender = sb_unbekannt_ans_ende(array_slice($zaehle(static fn ($b) => ($b['landname'] ?? '') ?: ($b['land'] ?: 'unbekannt')), 0, 12, true));
$staedte = sb_unbekannt_ans_ende(array_slice($zaehle(static fn ($b) => ($b['stadt'] ?? '') ? $b['stadt'] . (($b['region'] ?? '') ? ' (' . $b['region'] . ')' : '') : 'unbekannt'), 0, 15, true));
$regionen = sb_unbekannt_ans_ende(array_slice($zaehle(static fn ($b) => ($b['region'] ?? '') ?: 'unbekannt'), 0, 12, true));
$merkmale = [];
foreach ($zaehle(static fn ($b) => $b['geraet']) as $k => $n) $merkmale["Gerät: $k"] = $n;
foreach ($zaehle(static fn ($b) => $b['browser']) as $k => $n) $merkmale["Browser: $k"] = $n;
foreach ($zaehle(static fn ($b) => $b['system']) as $k => $n) $merkmale["System: $k"] = $n;
$zust = sb_zustimmung();
$mitWahl = $zust['ja'] + $zust['nein'];

// Verlauf: ohne Filter die letzten 30 Tage, mit Filter der gewählte Zeitraum (höchstens 120 Tage)
$tage = [];
foreach (sb_db()->query('SELECT datum, n FROM tage')->fetchAll() as $t) $tage[$t['datum']] = (int) $t['n'];
$ersterTag = $von ?: $tagMinus(29);
$letzterTag = $bis ?: $heute;
$diagramm = [];
for ($t = strtotime($ersterTag . ' 12:00'); $t <= strtotime($letzterTag . ' 12:00') && count($diagramm) < 120; $t += 86400) {
    $d = date('Y-m-d', $t);
    $diagramm[] = [$d, $tage[$d] ?? 0];
}
$maxTag = max(1, ...array_map(static fn ($x) => $x[1], $diagramm ?: [[0, 0]]));
$summeDiagramm = array_sum(array_map(static fn ($x) => $x[1], $diagramm));

$eigeneAusnehmen = sb_einstellung('eigene_ausnehmen', '1') === '1';
$berichtAktiv = sb_einstellung('bericht_aktiv', '1') === '1';
$filterQs = http_build_query(array_filter(['von' => $von, 'bis' => $bis]));
$namen = sb_katalog_namen();

kopf('Verwaltung', 'breit');
leiste('');
?>
<main class="inhalt">
  <?= meldung($okTexte[$_GET['ok'] ?? ''] ?? null, 'ok') ?>
  <?= ($_GET['ok'] ?? '') === 'bericht_fehler' ? meldung('Der Wochenbericht konnte nicht verschickt werden (E-Mail-Versand nicht verfügbar).') : '' ?>
  <section class="kennzahlen" aria-label="Kennzahlen">
    <?= kennzahl((string) ($tage[$heute] ?? 0), 'Besuche heute') ?>
    <?= kennzahl((string) $b7, 'Besuche 7 Tage', sb_trend($b7, $b7v) . '<small>zur Vorwoche</small>') ?>
    <?= kennzahl((string) $b30, 'Besuche 30 Tage', sb_trend($b30, $b30v) . '<small>zu den 30 Tagen davor</small>') ?>
    <?= kennzahl((string) array_sum($tage), 'Besuche seit Start') ?>
    <?= kennzahl((string) $zahlStatus['neu'], 'neue Anfragen', $zahlStatus['neu'] ? '<a href="./?anfragen=neu#anfragen">ansehen</a>' : '', $zahlStatus['neu'] ? 'achtung' : '') ?>
    <?= kennzahl($quote, 'Anfragen pro 100 Besuche', '<small>30 Tage: ' . $a30 . ' Anfragen</small>' . sb_trend($a30, $a30v)) ?>
  </section>

  <section class="kasten" id="anfragen">
    <div class="zeile"><h2>Anfragen</h2><?php if ($anfragenAlle): ?><a class="knopf hell" href="./?aktion=export_anfragen">CSV exportieren</a><?php endif; ?></div>
    <?php if ($anfragenAlle): ?>
      <nav class="filter" aria-label="Anfragen filtern">
        <?php foreach (['offen' => 'Offen'] + array_map(static fn ($x) => $x[0], SB_ANFRAGE_STATUS) + ['alle' => 'Alle'] as $f => $t): ?>
          <a href="./?anfragen=<?= $f ?>#anfragen"<?= $aFilter === $f ? ' aria-current="true"' : '' ?>><?= sb_e($t) ?> <span><?= $f === 'alle' ? count($anfragenAlle) : $zahlStatus[$f] ?></span></a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>
    <?php if (!$anfragenAlle): ?>
      <p class="leise">Noch keine Anfragen über das Formular.</p>
    <?php elseif (!$anfragen): ?>
      <p class="leise">Keine Anfragen in dieser Auswahl.</p>
    <?php else: foreach ($anfragen as $a): $st = sb_anfrage_status($a); [$betreff, $text] = sb_antwort($a, $namen); ?>
      <article class="anfrage" id="a-<?= sb_e($a['id']) ?>">
        <div class="zeile">
          <h3><?= sb_e($a['name']) ?> <span class="chip <?= SB_ANFRAGE_STATUS[$st][1] ?>"><?= sb_e(SB_ANFRAGE_STATUS[$st][0]) ?></span> <span class="leise">· <?= sb_e($a['id']) ?></span></h3>
          <form method="post" action="./"><?= csrf_feld() ?><input type="hidden" name="aktion" value="anfrage_loeschen"><input type="hidden" name="id" value="<?= sb_e($a['id']) ?>"><button class="hell klein" type="submit">Löschen</button></form>
        </div>
        <p class="leise"><?= sb_e(date('d.m.Y H:i', strtotime($a['erstellt']))) ?> · Seite <?= sb_e(strtoupper($a['seitensprache'])) ?> · Antwort auf <?= sb_e(strtoupper($a['wunschsprache'])) ?><?= $a['paket'] ? ' · Paket ' . sb_e($namen[preg_replace('/^bundle:/', '', (string) $a['paket'])] ?? $a['paket']) : '' ?> · Werbung: <?= $a['werbung'] ? 'ja' : 'nein' ?><?= !empty($a['geaendert']) ? ' · zuletzt bearbeitet ' . sb_e(date('d.m.Y', strtotime($a['geaendert']))) : '' ?></p>
        <p class="kontakt"><a href="mailto:<?= sb_e($a['email']) ?>"><?= sb_e($a['email']) ?></a>
          <?php if (!empty($a['telefon'])): $nr = preg_replace('/[^0-9+]/', '', $a['telefon']); ?>
            · <a href="tel:<?= sb_e($nr) ?>">☎ <?= sb_e($a['telefon']) ?></a>
          <?php endif; ?>
          <?php if (!empty($a['ort'])): ?> · 📍 <?= sb_e($a['ort']) ?><?php endif; ?></p>
        <p class="nachricht"><?= nl2br(sb_e($a['nachricht'])) ?></p>
        <p class="werkzeuge antworten">
          <a class="knopf" href="mailto:<?= sb_e($a['email']) ?>?subject=<?= rawurlencode($betreff) ?>&amp;body=<?= rawurlencode($text) ?>">✉ Antworten per E-Mail</a>
          <?php if (!empty($a['telefon'])): ?><a class="knopf hell" href="https://wa.me/<?= sb_e(sb_whatsapp_nummer($a['telefon'])) ?>?text=<?= rawurlencode($text) ?>" target="_blank" rel="noopener">Antworten per WhatsApp</a><?php endif; ?>
        </p>
        <form method="post" action="./" class="anfrage-form"><?= csrf_feld() ?>
          <input type="hidden" name="aktion" value="anfrage_speichern"><input type="hidden" name="id" value="<?= sb_e($a['id']) ?>"><input type="hidden" name="filter" value="<?= sb_e($aFilter) ?>">
          <label>Status <select name="status"><?php foreach (SB_ANFRAGE_STATUS as $k => [$t, $_]): ?><option value="<?= $k ?>"<?= $k === $st ? ' selected' : '' ?>><?= sb_e($t) ?></option><?php endforeach; ?></select></label>
          <label class="notiz">Notiz (nur für dich) <textarea name="notiz" rows="2" maxlength="2000" placeholder="z. B. Rückruf Di 10 Uhr, Angebot 89 € geschickt"><?= sb_e($a['notiz'] ?? '') ?></textarea></label>
          <button class="klein" type="submit">Speichern</button>
        </form>
      </article>
    <?php endforeach; endif; ?>
    <p class="leise">Anfragen ohne Auftrag werden 12 Monate nach der letzten Bearbeitung automatisch gelöscht (Datenschutz). Anfragen mit Status „Kunde“ bleiben.</p>
  </section>

  <form class="zeile kasten" method="get" action="./">
    <label>Von <input type="date" name="von" value="<?= sb_e($von) ?>"></label>
    <label>Bis <input type="date" name="bis" value="<?= sb_e($bis) ?>"></label>
    <button type="submit">Filtern</button>
    <a class="knopf hell" href="./">Zurücksetzen</a>
    <a class="knopf hell" href="./?aktion=export<?= $filterQs ? '&amp;' . sb_e($filterQs) : '' ?>">Besuche als CSV</a>
  </form>

  <section class="kasten">
    <div class="zeile"><h2>Besuche je Tag</h2><span class="leise"><?= $von || $bis ? sb_e(date('d.m.Y', strtotime($ersterTag)) . ' – ' . date('d.m.Y', strtotime($letzterTag))) : 'letzte 30 Tage' ?> · Summe <?= $summeDiagramm ?> · Ø <?= number_format($summeDiagramm / max(1, count($diagramm)), 1, ',', '.') ?> pro Tag</span></div>
    <?php $abstand = 26; $breite = 34 + count($diagramm) * $abstand; $schritt = (int) ceil(count($diagramm) / 10); ?>
    <div class="scroll"><svg class="diagramm" viewBox="0 0 <?= $breite ?> 170" preserveAspectRatio="xMinYMid meet" role="img" aria-label="Besuche je Tag">
      <line x1="28" y1="140" x2="<?= $breite ?>" y2="140" stroke="#d7ddd9"/>
      <text x="0" y="24" font-size="10" fill="#3a4a45"><?= $maxTag ?></text><text x="0" y="140" font-size="10" fill="#3a4a45">0</text>
      <?php foreach ($diagramm as $i => [$d, $n]): $h = (int) round($n / $maxTag * 115); $x = 34 + $i * $abstand; $we = (int) date('N', strtotime($d)) >= 6; ?>
        <rect x="<?= $x ?>" y="<?= 140 - $h ?>" width="18" height="<?= max($h, $n > 0 ? 2 : 0) ?>" rx="3" fill="<?= $d === $heute ? '#b8913a' : '#0f3b33' ?>"><title><?= ['Mo','Di','Mi','Do','Fr','Sa','So'][(int) date('N', strtotime($d)) - 1] ?> <?= sb_e(date('d.m.Y', strtotime($d))) ?>: <?= $n ?> Besuche</title></rect>
        <?php if ($n > 0): ?><text x="<?= $x + 9 ?>" y="<?= 134 - $h ?>" font-size="10" text-anchor="middle" fill="#14241f"><?= $n ?></text><?php endif; ?>
        <?php if ($i % $schritt === 0 || $d === $heute): ?><text x="<?= $x + 9 ?>" y="158" font-size="10" text-anchor="middle" fill="<?= $we ? '#8a6a1f' : '#3a4a45' ?>"><?= sb_e(date('d.m.', strtotime($d))) ?></text><?php endif; ?>
      <?php endforeach; ?>
    </svg></div>
  </section>

  <div class="zwei">
    <section class="kasten"><h2>Häufigste Seiten</h2><?= tabelle('Seite', 'Aufrufe', $topSeiten, true, static fn ($k) => $seitenPfad[$k] ?? $k) ?></section>
    <section class="kasten"><h2>Woher die Besucher kommen</h2><?= tabelle('Herkunft', 'Besuche', $gruppen, true) ?>
      <details class="mehr"><summary>Im Detail</summary><?= tabelle('Quelle', 'Besuche', $quellen) ?></details></section>
    <section class="kasten"><h2>Kampagnen</h2><p class="leise">Besuche über deine Werbe-Links und QR-Codes. <a href="./?seite=links">Neuen Link erstellen</a></p><?= tabelle('Aktion · Kanal', 'Besuche', $kampagnen, true) ?></section>
    <section class="kasten"><h2>Städte</h2><p class="leise">Ungefährer Ort aus der gekürzten IP-Adresse. <a href="https://db-ip.com" target="_blank" rel="noopener">IP-Geolokalisierung von DB-IP</a></p><?= tabelle('Stadt (Region)', 'Besuche', $staedte, true) ?></section>
    <section class="kasten"><h2>Regionen</h2><?= tabelle('Region', 'Besuche', $regionen, true) ?></section>
    <section class="kasten"><h2>Länder</h2><?= tabelle('Land', 'Besuche', $laender) ?></section>
    <section class="kasten"><h2>Zustimmung zur vollen IP</h2>
      <?php if ($mitWahl + $zust['ohne'] === 0): ?><p class="leise">Noch keine Besuche seit dem Hinweis auf der Website.</p>
      <?php else: ?><p class="gross"><?= $mitWahl ? round($zust['ja'] / $mitWahl * 100) . ' %' : '–' ?></p>
        <p class="leise"><?= $zust['ja'] ?> zugestimmt · <?= $zust['nein'] ?> abgelehnt · <?= $zust['ohne'] ?> ohne Wahl (Hinweis noch offen oder „Do Not Track“)</p><?php endif; ?>
    </section>
    <section class="kasten"><h2>Geräte und Browser</h2><?= tabelle('Merkmal', 'Anzahl', $merkmale) ?></section>
  </div>

  <section class="kasten">
    <h2>Letzte Besuche</h2>
    <p class="leise">Ort ungefähr (bei Handys oft der Sitz des Mobilfunkanbieters). Volle IP nur bei Besuchern, die im Hinweis zugestimmt haben; sonst ohne letzten Block (….x). Nach <?= SB_IP_TAGE ?> Tagen wird die IP geleert.</p>
    <?php if (!$besuche): ?>
      <p class="leise">Noch keine aufgezeichneten Besuche.</p>
    <?php else: ?>
      <div class="scroll"><table>
        <thead><tr><th>Zeit</th><th>Ort</th><th>IP</th><th>Sprache</th><th>Gerät</th><th>Herkunft</th><th>Seiten</th></tr></thead>
        <tbody>
        <?php foreach (array_slice($besuche, 0, 40) as $b): ?>
          <tr>
            <td><?= sb_e(date('d.m.Y H:i', strtotime($b['beginn']))) ?></td>
            <td><?= sb_e(implode(', ', array_filter([$b['stadt'] ?? '', $b['region'] ?? '', ($b['landname'] ?? '') ?: ($b['land'] ?? '')]))) ?: '—' ?></td>
            <td class="ip"><?= sb_e(sb_ip_besuch($b)) ?></td>
            <td><?= sb_e($b['sprache']) ?></td>
            <td><?= sb_e($b['geraet'] . ' · ' . $b['system'] . ' · ' . $b['browser']) ?></td>
            <td><?= sb_e(sb_kampagne($b) ?? ($b['quelle'] === 'direct' ? 'direkt' : $b['quelle'])) ?></td>
            <td class="pfad"><?= sb_e(implode(' → ', array_map(static fn ($p) => sb_seiten_name((string) ($p['path'] ?? '')) . (isset($p['ms']) ? ' (' . round($p['ms'] / 1000) . ' s)' : ''), $b['seiten']))) ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table></div>
    <?php endif; ?>
  </section>

  <section class="kasten" id="einstellungen">
    <h2>Einstellungen</h2>
    <form method="post" action="./" class="stapel"><?= csrf_feld() ?>
      <input type="hidden" name="aktion" value="einstellungen">
      <label class="haken"><input type="checkbox" name="eigene_ausnehmen" value="ja"<?= $eigeneAusnehmen ? ' checked' : '' ?>> Eigene Besuche nicht mitzählen, solange ich hier angemeldet bin</label>
      <label class="haken"><input type="checkbox" name="bericht_aktiv" value="ja"<?= $berichtAktiv ? ' checked' : '' ?>> Wochenbericht jeden Montag per E-Mail an <?= sb_e(sb_config()['benachrichtigung']) ?> (nur Summen, keine Namen)</label>
      <p><button type="submit">Speichern</button></p>
    </form>
    <form method="post" action="./"><?= csrf_feld() ?><input type="hidden" name="aktion" value="bericht_test"><button class="hell klein" type="submit">Wochenbericht jetzt testweise senden</button></form>
    <p class="leise">Besuchsdetails werden nach <?= SB_AUFBEWAHRUNG_TAGE ?> Tagen automatisch gelöscht, die IP-Adresse schon nach <?= SB_IP_TAGE ?> Tagen; die Tageszahlen bleiben als reine Summen.</p>
  </section>

  <section class="kasten" id="vorlagen">
    <h2>Antwort-Vorlagen</h2>
    <p class="leise">Werden beim Klick auf „Antworten“ in der Wunschsprache des Kunden eingesetzt. Platzhalter: <code>{name}</code>, <code>{nummer}</code>, <code>{paket}</code> (wird zu „ zu „PuliziaCheck““ oder bleibt leer). Feld leeren = Standardtext.</p>
    <form method="post" action="./" class="stapel"><?= csrf_feld() ?>
      <input type="hidden" name="aktion" value="vorlagen">
      <?php foreach (['de' => 'Deutsch', 'it' => 'Italienisch', 'en' => 'Englisch'] as $sp => $t): ?>
        <label><?= $t ?> <textarea name="vorlage_<?= $sp ?>" rows="7" maxlength="3000"><?= sb_e(sb_vorlage($sp)) ?></textarea></label>
      <?php endforeach; ?>
      <p><button type="submit">Vorlagen speichern</button></p>
    </form>
  </section>
</main>
<?php fuss();
