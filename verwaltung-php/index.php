<?php
declare(strict_types=1);
// Verwaltung von Studio Breve: Ersteinrichtung, Anmeldung, Besuche, Anfragen, Einstellungen.
require __DIR__ . '/app/lib.php';

ob_start(); // Cookies dürfen auch nach Ausgabebeginn noch gesetzt werden
sb_csrf();  // Schutzwert für Formulare vor jeder Ausgabe festlegen
header("Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
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
        . '<link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/verwaltung.css"></head>'
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
        weiter('./?ok=einstellung#einstellungen');
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
        $zeilen[] = [$r['sid'], $r['datum'], $r['beginn'], $r['sprache'], $r['land'] ?? '', $r['region'] ?? '', $r['stadt'] ?? '', $r['geraet'], $r['system'], $r['browser'], $r['bildschirm'], $r['quelle'], $r['referrer'], $seiten];
    }
    csv_senden('studio-breve-besuche.csv', ['id', 'date', 'startedAt', 'lang', 'country', 'region', 'city', 'device', 'os', 'browser', 'screen', 'source', 'referrer', 'pages'], $zeilen);
}
if ($aktion === 'export_anfragen') {
    $zeilen = [];
    foreach (sb_db()->query('SELECT * FROM anfragen ORDER BY erstellt DESC')->fetchAll() as $a) {
        $zeilen[] = [$a['id'], $a['erstellt'], $a['seitensprache'], $a['wunschsprache'], $a['name'], $a['email'], $a['telefon'] ?? '', $a['ort'] ?? '', $a['paket'] ?? '', $a['anliegen'], $a['nachricht'], $a['werbung'] ? 'ja' : 'nein', $a['einwilligung'], $a['quelle']];
    }
    csv_senden('studio-breve-anfragen.csv', ['id', 'erstellt', 'seitensprache', 'wunschsprache', 'name', 'email', 'telefon', 'ort', 'paket', 'anliegen', 'nachricht', 'werbung', 'einwilligung', 'quelle'], $zeilen);
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

/* ---------- Reiter ---------- */
function reiter(string $aktiv): string
{
    $h = '<nav class="reiter" aria-label="Bereiche">';
    foreach (['' => 'Übersicht', 'produkte' => 'Produkte', 'automatik' => 'Automatik'] as $k => $t) {
        $h .= '<a href="./' . ($k ? '?seite=' . $k : '') . '"' . ($k === $aktiv ? ' aria-current="page"' : '') . '>' . $t . '</a>';
    }
    return $h . '</nav>';
}
function leiste(string $aktiv): void
{
    global $WEBSITE;
    echo '<header class="leiste"><h1>Verwaltung — Studio Breve</h1>' . reiter($aktiv) . '<nav class="werkzeuge"><a class="knopf hell" href="' . sb_e($WEBSITE) . '/de/">Website</a>'
        . '<a class="knopf hell" href="./?seite=passwort">Passwort ändern</a><form method="post" action="./">' . csrf_feld()
        . '<input type="hidden" name="aktion" value="abmelden"><button class="hell" type="submit">Abmelden</button></form></nav></header>';
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
const SB_STATUS = ['available' => ['fertig entwickelt', 'ok'], 'waitlist' => ['in Planung (Warteliste)', 'warn'], 'inquiry' => ['in Planung (Anfrage)', 'warn'], 'soon' => ['bald', 'warn']];
const SB_ABLAGE = 'C:\\Users\\biker\\Studio-Breve-Vorschau\\Produkte\\';

if (($_GET['seite'] ?? '') === 'produkte') {
    $k = sb_katalog();
    $alle = $k['pakete'] ?? [];
    $filter = (string) ($_GET['status'] ?? '');
    $liste = array_values(array_filter($alle, static fn ($x) => $filter === '' || ($filter === 'fertig' ? $x['status'] === 'available' : $x['status'] !== 'available')));
    usort($liste, static fn ($a, $b) => [$b['status'] === 'available', $b['fertigAm'] ?? '', $b['nr']] <=> [$a['status'] === 'available', $a['fertigAm'] ?? '', $a['nr']]);
    $fertig = count(array_filter($alle, static fn ($x) => $x['status'] === 'available'));
    $mitSetup = count(array_filter($alle, static fn ($x) => $x['status'] === 'available' && $x['setup'] !== ''));
    $proTag = [];
    foreach ($alle as $x) if (!empty($x['fertigAm'])) $proTag[$x['fertigAm']][] = $x['name'];
    krsort($proTag);
    kopf('Produkte', 'breit');
    leiste('produkte');
    echo '<main class="inhalt">' . ($k['fehler'] ? '<p class="fehler">' . sb_e($k['fehler']) . '</p>' : '')
        . '<section class="kennzahlen"><div class="kennzahl"><b>' . count($alle) . '</b><span>Pakete im Katalog</span></div><div class="kennzahl"><b>' . $fertig . '</b><span>fertig entwickelt</span></div>'
        . '<div class="kennzahl"><b>' . $mitSetup . '</b><span>davon mit Setup</span></div><div class="kennzahl"><b>' . (count($alle) - $fertig) . '</b><span>in Planung</span></div></section>';
    if ($proTag) {
        echo '<section class="kasten"><h2>Zuletzt fertig gebaut</h2><table><thead><tr><th>Datum</th><th>Pakete</th></tr></thead><tbody>';
        foreach (array_slice($proTag, 0, 10, true) as $d => $namen) echo '<tr><td>' . sb_e(date('d.m.Y', strtotime($d))) . '</td><td>' . count($namen) . ' – ' . sb_e(implode(', ', $namen)) . '</td></tr>';
        echo '</tbody></table></section>';
    }
    echo '<section class="kasten"><div class="zeile"><h2>Alle Pakete</h2><div class="werkzeuge">';
    foreach (['' => 'Alle', 'fertig' => 'Fertig', 'planung' => 'In Planung'] as $f => $t) echo '<a class="knopf' . ($filter === $f ? '' : ' hell') . '" href="./?seite=produkte' . ($f ? '&amp;status=' . $f : '') . '">' . $t . '</a>';
    echo '<form method="post" action="./">' . csrf_feld() . '<input type="hidden" name="aktion" value="katalog_neu"><button class="hell" type="submit">Neu laden</button></form></div></div>'
        . '<p class="leise">Stand der Website: ' . sb_e($k['stand'] ? date('d.m.Y H:i', strtotime($k['stand'])) : '—') . '. Ablage auf deinem PC: ' . sb_e(SB_ABLAGE) . '&lt;Name&gt;</p>'
        . '<div class="scroll"><table class="produkte"><thead><tr><th>Nr.</th><th>Paket</th><th>Status</th><th>Preis</th><th>Lieferung / Setup</th><th>Ablage auf dem PC</th></tr></thead><tbody>';
    foreach ($liste as $x) {
        [$st, $klasse] = SB_STATUS[$x['status']] ?? [$x['status'], ''];
        $istFertig = $x['status'] === 'available';
        echo '<tr><td>' . (int) $x['nr'] . '</td><td><a href="' . sb_e($WEBSITE . $x['seite']) . '" target="_blank" rel="noopener"><b>' . sb_e($x['name']) . '</b></a><br><span class="leise">' . sb_e($x['kurz']) . '</span><br><span class="leise">'
            . sb_e($x['kategorie'] . ' · ' . $x['art']) . '</span></td><td><span class="chip ' . $klasse . '">' . sb_e($st) . '</span>' . (!empty($x['fertigAm']) ? '<br><span class="leise">seit ' . sb_e(date('d.m.Y', strtotime($x['fertigAm']))) . '</span>' : '') . '</td>'
            . '<td>' . sb_e(preis_text($x['preise'] ?? [])) . '</td><td>' . ($istFertig ? ($x['setup'] ? '<span class="chip ok">' . sb_e($x['setup']) . '</span>' : '<span class="chip warn">noch ohne Setup</span>') : '—') . '</td>'
            . '<td class="pfad">' . ($istFertig ? sb_e(SB_ABLAGE . $x['name'] . '\\') : '—') . '</td></tr>';
    }
    echo '</tbody></table></div></section></main>';
    fuss();
    exit;
}

if (($_GET['seite'] ?? '') === 'automatik') {
    $plan = sb_plan();
    $naechster = sb_naechster_lauf($plan);
    $k = sb_katalog();
    $heuteNeu = count(array_filter($k['pakete'] ?? [], static fn ($x) => ($x['fertigAm'] ?? '') === date('Y-m-d')));
    $uhrzeiten = [];
    for ($h = 6; $h <= 23; $h++) foreach (['10', '40'] as $m) $uhrzeiten[] = sprintf('%02d:%s', $h, $m);
    if (!in_array($plan['uhrzeit'], $uhrzeiten, true)) $uhrzeiten[] = $plan['uhrzeit'];
    kopf('Automatik', 'breit');
    leiste('automatik');
    echo '<main class="inhalt">' . meldung(($_GET['ok'] ?? '') === 'einstellung' ? 'Gespeichert. Der nächste Lauf richtet sich danach.' : null, 'ok')
        . '<section class="kennzahlen"><div class="kennzahl"><b>' . ($plan['aktiv'] ? 'an' : 'Pause') . '</b><span>Automatik</span></div><div class="kennzahl"><b>' . $plan['anzahl'] . '</b><span>Pakete pro Lauf</span></div>'
        . '<div class="kennzahl"><b>' . ($naechster ? sb_e(date('d.m. H:i', $naechster)) : '—') . '</b><span>nächster Lauf</span></div><div class="kennzahl"><b>' . $heuteNeu . '</b><span>heute fertig gebaut</span></div></section>'
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
        . 'Mehr als 3–4 Pakete pro Lauf dauern entsprechend länger. Eine neue Uhrzeit übernimmt die Automatik bei ihrem nächsten Start; bis dahin läuft sie noch zur bisherigen Zeit.</p></section></main>';
    fuss();
    exit;
}

/* ---------- Übersicht ---------- */
sb_alte_besuche_loeschen();
$tage = [];
foreach (sb_db()->query('SELECT datum, n FROM tage ORDER BY datum')->fetchAll() as $t) {
    $tage[$t['datum']] = (int) $t['n'];
}
$heute = sb_heute();
$summeAb = static function (string $ab) use ($tage): int {
    $s = 0;
    foreach ($tage as $d => $n) {
        if ($d >= $ab) $s += $n;
    }
    return $s;
};
$kennzahlen = [
    'Heute' => $tage[$heute] ?? 0,
    '7 Tage' => $summeAb(sb_heute(time() - 6 * 86400)),
    '30 Tage' => $summeAb(sb_heute(time() - 29 * 86400)),
    'Seit Start' => array_sum($tage),
];

$besuche = besuche_laden($von, $bis);
$zaehle = static function (callable $schluessel) use ($besuche): array {
    $m = [];
    foreach ($besuche as $b) {
        $k = (string) $schluessel($b);
        $k = $k === '' ? '—' : $k;
        $m[$k] = ($m[$k] ?? 0) + 1;
    }
    arsort($m);
    return $m;
};
$seitenZahl = [];
foreach ($besuche as $b) {
    foreach ($b['seiten'] as $p) {
        $pfad = (string) ($p['path'] ?? '');
        $seitenZahl[$pfad] = ($seitenZahl[$pfad] ?? 0) + 1;
    }
}
arsort($seitenZahl);
$topSeiten = array_slice($seitenZahl, 0, 12, true);
$quellen = array_slice($zaehle(static fn ($b) => $b['quelle']), 0, 12, true);
$laender = array_slice($zaehle(static fn ($b) => ($b['landname'] ?? '') ?: ($b['land'] ?: 'unbekannt')), 0, 12, true);
$staedte = array_slice($zaehle(static fn ($b) => ($b['stadt'] ?? '') ? $b['stadt'] . (($b['region'] ?? '') ? ' (' . $b['region'] . ')' : '') : 'unbekannt'), 0, 15, true);
$regionen = array_slice($zaehle(static fn ($b) => ($b['region'] ?? '') ?: 'unbekannt'), 0, 12, true);
$merkmale = [];
foreach ($zaehle(static fn ($b) => $b['geraet']) as $k => $n) $merkmale["Gerät: $k"] = $n;
foreach ($zaehle(static fn ($b) => $b['browser']) as $k => $n) $merkmale["Browser: $k"] = $n;
foreach ($zaehle(static fn ($b) => $b['system']) as $k => $n) $merkmale["System: $k"] = $n;

// Balken je Tag (höchstens 400 Tage)
$ersterTag = $von ?: (array_key_first($tage) ?? $heute);
$letzterTag = $bis ?: $heute;
$diagramm = [];
for ($t = strtotime($ersterTag . ' 12:00'); $t <= strtotime($letzterTag . ' 12:00') && count($diagramm) < 400; $t += 86400) {
    $d = date('Y-m-d', $t);
    $diagramm[] = [$d, $tage[$d] ?? 0];
}
$maxTag = max(1, ...array_map(static fn ($x) => $x[1], $diagramm ?: [[0, 0]]));

$anfragen = sb_db()->query('SELECT * FROM anfragen ORDER BY erstellt DESC')->fetchAll();
$eigeneAusnehmen = sb_einstellung('eigene_ausnehmen', '1') === '1';
$filterQs = http_build_query(array_filter(['von' => $von, 'bis' => $bis]));
$okTexte = ['eingerichtet' => 'Die Verwaltung ist eingerichtet. Sie sind angemeldet.', 'pw' => 'Passwort geändert.', 'einstellung' => 'Einstellung gespeichert.', 'geloescht' => 'Anfrage gelöscht.'];

function tabelle(string $kopf1, string $kopf2, array $daten, bool $balken = false): string
{
    if (!$daten) {
        return '<p class="leise">Noch keine Daten.</p>';
    }
    $max = max($daten) ?: 1;
    $h = '<table><thead><tr><th>' . sb_e($kopf1) . '</th><th>' . sb_e($kopf2) . '</th></tr></thead><tbody>';
    foreach ($daten as $k => $n) {
        $h .= '<tr><td class="pfad">' . sb_e((string) $k) . '</td><td>' . (int) $n
            . ($balken ? '<meter min="0" max="' . (int) $max . '" value="' . (int) $n . '"></meter>' : '') . '</td></tr>';
    }
    return $h . '</tbody></table>';
}

kopf('Verwaltung', 'breit');
?>
<?php leiste(''); ?>
<main class="inhalt">
  <?= meldung($okTexte[$_GET['ok'] ?? ''] ?? null, 'ok') ?>
  <section class="kennzahlen" aria-label="Kennzahlen">
    <?php foreach ($kennzahlen as $titel => $n): ?>
      <div class="kennzahl"><b><?= (int) $n ?></b><span><?= sb_e($titel) ?></span></div>
    <?php endforeach; ?>
    <div class="kennzahl"><b><?= count($anfragen) ?></b><span>Anfragen</span></div>
  </section>

  <section class="kasten" id="anfragen">
    <div class="zeile"><h2>Anfragen</h2><?php if ($anfragen): ?><a class="knopf hell" href="./?aktion=export_anfragen">CSV exportieren</a><?php endif; ?></div>
    <?php if (!$anfragen): ?>
      <p class="leise">Noch keine Anfragen über das Formular.</p>
    <?php else: foreach ($anfragen as $a): ?>
      <article class="anfrage">
        <div class="zeile">
          <h3><?= sb_e($a['name']) ?> <span class="leise">· <?= sb_e($a['id']) ?></span></h3>
          <form method="post" action="./"><?= csrf_feld() ?><input type="hidden" name="aktion" value="anfrage_loeschen"><input type="hidden" name="id" value="<?= sb_e($a['id']) ?>"><button class="hell klein" type="submit">Löschen</button></form>
        </div>
        <p class="leise"><?= sb_e(date('d.m.Y H:i', strtotime($a['erstellt']))) ?> · Seite <?= sb_e(strtoupper($a['seitensprache'])) ?> · Antwort auf <?= sb_e(strtoupper($a['wunschsprache'])) ?><?= $a['paket'] ? ' · Paket ' . sb_e($a['paket']) : '' ?> · Werbung: <?= $a['werbung'] ? 'ja' : 'nein' ?></p>
        <p class="kontakt"><a href="mailto:<?= sb_e($a['email']) ?>?subject=<?= rawurlencode('Ihre Anfrage ' . $a['id']) ?>"><?= sb_e($a['email']) ?></a>
          <?php if (!empty($a['telefon'])): $nr = preg_replace('/[^0-9+]/', '', $a['telefon']); $wa = ltrim(str_starts_with($nr, '00') ? substr($nr, 2) : (str_starts_with($nr, '+') ? $nr : (str_starts_with($nr, '3') ? '39' . $nr : $nr)), '+'); ?>
            · <a href="tel:<?= sb_e($nr) ?>">☎ <?= sb_e($a['telefon']) ?></a> · <a href="https://wa.me/<?= sb_e($wa) ?>" target="_blank" rel="noopener">WhatsApp</a>
          <?php endif; ?>
          <?php if (!empty($a['ort'])): ?> · 📍 <?= sb_e($a['ort']) ?><?php endif; ?></p>
        <p class="nachricht"><?= nl2br(sb_e($a['nachricht'])) ?></p>
      </article>
    <?php endforeach; endif; ?>
  </section>

  <form class="zeile kasten" method="get" action="./">
    <label>Von <input type="date" name="von" value="<?= sb_e($von) ?>"></label>
    <label>Bis <input type="date" name="bis" value="<?= sb_e($bis) ?>"></label>
    <button type="submit">Filtern</button>
    <a class="knopf hell" href="./">Zurücksetzen</a>
    <a class="knopf hell" href="./?aktion=export<?= $filterQs ? '&amp;' . sb_e($filterQs) : '' ?>">Besuche als CSV</a>
  </form>

  <section class="kasten">
    <h2>Besuche je Tag</h2>
    <?php $breite = max(count($diagramm) * 18, 200); ?>
    <svg class="diagramm" viewBox="0 0 <?= $breite ?> 140" role="img" aria-label="Besuche je Tag">
      <?php foreach ($diagramm as $i => [$d, $n]): $h = (int) round($n / $maxTag * 110); $x = 8 + $i * 18; ?>
        <rect x="<?= $x ?>" y="<?= 120 - $h ?>" width="12" height="<?= $h ?>" rx="2" fill="#0f3b33"><title><?= sb_e($d) ?>: <?= $n ?></title></rect>
        <?php if ($i % (int) ceil(max(1, count($diagramm)) / 8) === 0): ?><text x="<?= $x ?>" y="136" font-size="8" fill="#4a5b56"><?= sb_e(substr($d, 5)) ?></text><?php endif; ?>
      <?php endforeach; ?>
    </svg>
  </section>

  <div class="zwei">
    <section class="kasten"><h2>Häufigste Seiten</h2><?= tabelle('Pfad', 'Aufrufe', $topSeiten, true) ?></section>
    <section class="kasten"><h2>Quellen</h2><?= tabelle('Quelle', 'Besuche', $quellen) ?></section>
    <section class="kasten"><h2>Städte</h2><p class="leise">Ungefährer Ort aus der gekürzten IP-Adresse (die IP wird nicht gespeichert). <a href="https://db-ip.com" target="_blank" rel="noopener">IP-Geolokalisierung von DB-IP</a></p><?= tabelle('Stadt (Region)', 'Besuche', $staedte, true) ?></section>
    <section class="kasten"><h2>Regionen</h2><?= tabelle('Region', 'Besuche', $regionen, true) ?></section>
    <section class="kasten"><h2>Länder</h2><?= tabelle('Land', 'Besuche', $laender) ?></section>
    <section class="kasten"><h2>Geräte und Browser</h2><?= tabelle('Merkmal', 'Anzahl', $merkmale) ?></section>
  </div>

  <section class="kasten">
    <h2>Letzte Besuche</h2>
    <?php if (!$besuche): ?>
      <p class="leise">Noch keine aufgezeichneten Besuche.</p>
    <?php else: ?>
      <table>
        <thead><tr><th>Zeit</th><th>Ort</th><th>Sprache</th><th>Gerät</th><th>Quelle</th><th>Seiten</th></tr></thead>
        <tbody>
        <?php foreach (array_slice($besuche, 0, 40) as $b): ?>
          <tr>
            <td><?= sb_e(date('d.m.Y H:i', strtotime($b['beginn']))) ?></td>
            <td><?= sb_e(implode(', ', array_filter([$b['region'] ?? '', ($b['landname'] ?? '') ?: ($b['land'] ?? '')]))) ?: '—' ?></td>
            <td><?= sb_e($b['sprache']) ?></td>
            <td><?= sb_e($b['geraet'] . ' · ' . $b['system'] . ' · ' . $b['browser']) ?></td>
            <td><?= sb_e($b['quelle']) ?></td>
            <td class="pfad"><?= sb_e(implode(' → ', array_map(static fn ($p) => ($p['path'] ?? '') . (isset($p['ms']) ? ' (' . round($p['ms'] / 1000) . ' s)' : ''), $b['seiten']))) ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </section>

  <section class="kasten" id="einstellungen">
    <h2>Einstellungen</h2>
    <form method="post" action="./" class="stapel"><?= csrf_feld() ?>
      <input type="hidden" name="aktion" value="einstellungen">
      <label class="haken"><input type="checkbox" name="eigene_ausnehmen" value="ja"<?= $eigeneAusnehmen ? ' checked' : '' ?>> Eigene Besuche nicht mitzählen, solange ich hier angemeldet bin</label>
      <p><button type="submit">Speichern</button></p>
    </form>
    <p class="leise">Besuchsdetails werden nach <?= SB_AUFBEWAHRUNG_TAGE ?> Tagen automatisch gelöscht; die Tageszahlen bleiben als reine Summen.</p>
  </section>
</main>
<?php fuss();
