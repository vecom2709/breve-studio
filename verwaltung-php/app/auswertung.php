<?php
declare(strict_types=1);
/*
 * Studio Breve – Verwaltung: Anfragen-Ablauf, Auswertungen, Wochenbericht, Lauf-Protokoll.
 * Wird von lib.php eingebunden. Keine Fremddienste; der Wochenbericht enthält nur Summen, keine Personendaten.
 */

/* ---------- Anfragen: Status, Vorlagen, Löschfrist ---------- */

const SB_ANFRAGE_STATUS = [
    'neu' => ['Neu', 'warn'],
    'beantwortet' => ['Beantwortet', ''],
    'angebot' => ['Angebot geschickt', ''],
    'kunde' => ['Kunde', 'ok'],
    'abgesagt' => ['Abgesagt', 'aus'],
];
const SB_ANFRAGEN_TAGE = 365;   // ohne Auftrag: Löschung 12 Monate nach dem letzten Kontakt (wie in der Datenschutzerklärung)

function sb_anfrage_status(array $a): string
{
    $s = (string) ($a['status'] ?? '');
    return isset(SB_ANFRAGE_STATUS[$s]) ? $s : 'neu';
}

/** Löscht Anfragen ohne Auftrag 12 Monate nach der letzten Änderung. Kunden bleiben (gesetzliche Aufbewahrung). */
function sb_alte_anfragen_loeschen(): int
{
    $grenze = date('c', time() - SB_ANFRAGEN_TAGE * 86400);
    $st = sb_db()->prepare("DELETE FROM anfragen WHERE COALESCE(status, 'neu') <> 'kunde' AND COALESCE(geaendert, erstellt) < ?");
    $st->execute([$grenze]);
    return $st->rowCount();
}

const SB_VORLAGEN = [
    'de' => ['betreff' => 'Ihre Anfrage bei Studio Breve ({nummer})',
        'text' => "Guten Tag {name},\n\nvielen Dank für Ihre Anfrage{paket}.\n\n\n\nViele Grüße\nUwe Vetter\nStudio Breve · www.studio-breve.it", 'paket' => ' zu „%s“'],
    'it' => ['betreff' => 'La tua richiesta a Studio Breve ({nummer})',
        'text' => "Buongiorno {name},\n\ngrazie per la tua richiesta{paket}.\n\n\n\nCordiali saluti\nUwe Vetter\nStudio Breve · www.studio-breve.it", 'paket' => ' per «%s»'],
    'en' => ['betreff' => 'Your enquiry at Studio Breve ({nummer})',
        'text' => "Hello {name},\n\nthank you for your enquiry{paket}.\n\n\n\nBest regards\nUwe Vetter\nStudio Breve · www.studio-breve.it", 'paket' => ' about “%s”'],
];

function sb_vorlage(string $sprache): string
{
    $sprache = isset(SB_VORLAGEN[$sprache]) ? $sprache : 'de';
    return sb_einstellung('vorlage_' . $sprache, SB_VORLAGEN[$sprache]['text']);
}

/** Betreff und Text für die Antwort in der Wunschsprache des Kunden. */
function sb_antwort(array $a, array $namen): array
{
    $sp = isset(SB_VORLAGEN[$a['wunschsprache']]) ? $a['wunschsprache'] : 'de';
    $paket = (string) ($a['paket'] ?? '');
    $paketName = $paket !== '' ? ($namen[preg_replace('/^bundle:/', '', $paket)] ?? $paket) : '';
    $ersetzen = [
        '{name}' => trim((string) $a['name']),
        '{nummer}' => (string) $a['id'],
        '{paket}' => $paketName !== '' ? sprintf(SB_VORLAGEN[$sp]['paket'], $paketName) : '',
    ];
    return [strtr(SB_VORLAGEN[$sp]['betreff'], $ersetzen), strtr(sb_vorlage($sp), $ersetzen)];
}

/** WhatsApp-Nummer aus einer eingegebenen Telefonnummer (italienische Handynummern ohne Vorwahl bekommen 39). */
function sb_whatsapp_nummer(string $tel): string
{
    $nr = preg_replace('/[^0-9+]/', '', $tel) ?? '';
    if (str_starts_with($nr, '00')) return substr($nr, 2);
    if (str_starts_with($nr, '+')) return substr($nr, 1);
    return str_starts_with($nr, '3') ? '39' . $nr : $nr;
}

/* ---------- Katalog-Namen, Seitennamen, Quellen ---------- */

/** slug => Name aus dem Katalog der Website */
function sb_katalog_namen(): array
{
    static $n = null;
    if ($n === null) {
        $n = [];
        foreach (sb_katalog()['pakete'] ?? [] as $p) $n[(string) $p['slug']] = (string) $p['name'];
    }
    return $n;
}

function sb_paket_aus_pfad(string $pfad): ?string
{
    return preg_match('#^/(?:de/pakete|it/pacchetti)/([a-z0-9-]+)/#', $pfad, $m) ? $m[1] : null;
}

const SB_SEITEN = [
    '/' => 'Sprachwahl', '/de/' => 'Startseite', '/it/' => 'Startseite', '/de/pakete/' => 'Alle Pakete', '/it/pacchetti/' => 'Alle Pakete',
    '/de/produkte/' => 'Produkte', '/it/prodotti/' => 'Produkte', '/de/dienstleistungen/' => 'Dienstleistungen', '/it/servizi/' => 'Dienstleistungen',
    '/de/ueber-uns/' => 'Über uns', '/it/chi-siamo/' => 'Über uns', '/de/kontakt/' => 'Kontakt', '/it/contatti/' => 'Kontakt',
    '/de/kontakt/danke/' => 'Danke-Seite (Anfrage gesendet)', '/it/contatti/grazie/' => 'Danke-Seite (Anfrage gesendet)',
    '/de/warenkorb/' => 'Warenkorb', '/it/carrello/' => 'Warenkorb', '/de/impressum/' => 'Impressum', '/it/note-legali/' => 'Impressum',
    '/de/datenschutz/' => 'Datenschutz', '/it/privacy/' => 'Datenschutz', '/de/agb/' => 'AGB', '/it/condizioni/' => 'AGB',
];

/** Lesbarer Name für einen Pfad, z. B. „PuliziaCheck (IT)“ statt /it/pacchetti/puliziacheck/ */
function sb_seiten_name(string $pfad): string
{
    $sprache = preg_match('#^/(de|it)/#', $pfad, $m) ? ' (' . strtoupper($m[1]) . ')' : '';
    if (($slug = sb_paket_aus_pfad($pfad)) !== null) {
        return 'Paket ' . (sb_katalog_namen()[$slug] ?? $slug) . $sprache;
    }
    return isset(SB_SEITEN[$pfad]) ? SB_SEITEN[$pfad] . ($pfad === '/' ? '' : $sprache) : $pfad;
}

const SB_SUCHE = ['google', 'bing', 'duckduckgo', 'ecosia', 'yahoo', 'qwant', 'startpage', 'yandex', 'baidu', 'brave', 'search'];
const SB_SOCIAL = ['facebook', 'instagram', 'tiktok', 'linkedin', 'twitter', 'x.com', 't.co', 'whatsapp', 'pinterest', 'youtube', 'threads', 'telegram', 'reddit', 'bsky', 'lnkd'];

function sb_quellen_gruppe(array $b): string
{
    $utm = is_string($b['utm'] ?? null) ? (json_decode($b['utm'], true) ?: []) : [];
    if (($utm['campaign'] ?? '') !== '' || ($utm['medium'] ?? '') !== '') return 'Kampagnen-Links / QR-Codes';
    $q = strtolower((string) $b['quelle']);
    if ($q === 'direct') return 'Direkt (eingetippt, Lesezeichen, Apps)';
    foreach (SB_SUCHE as $s) if (str_contains($q, $s)) return 'Suchmaschinen';
    foreach (SB_SOCIAL as $s) if (str_contains($q, $s)) return 'Social Media und Messenger';
    if ($utm) return 'Kampagnen-Links / QR-Codes';
    return 'Andere Websites';
}

function sb_kampagne(array $b): ?string
{
    $utm = is_string($b['utm'] ?? null) ? (json_decode($b['utm'], true) ?: []) : [];
    if (!$utm) return null;
    return trim(($utm['campaign'] ?? '–') . ' · ' . ($utm['source'] ?? '–') . (($utm['medium'] ?? '') !== '' ? ' / ' . $utm['medium'] : ''));
}

/** Kanal => utm_medium für den Link-Baukasten */
const SB_KANAELE = [
    'instagram' => ['Instagram', 'social'], 'facebook' => ['Facebook', 'social'], 'tiktok' => ['TikTok', 'social'],
    'whatsapp' => ['WhatsApp (Status, Gruppen)', 'messenger'], 'google-business' => ['Google-Unternehmensprofil', 'local'],
    'flyer' => ['Flyer (QR-Code)', 'print'], 'visitenkarte' => ['Visitenkarte (QR-Code)', 'print'], 'plakat' => ['Plakat / Aushang (QR-Code)', 'print'],
    'newsletter' => ['E-Mail / Newsletter', 'email'], 'empfehlung' => ['Empfehlung / Partner', 'referral'],
];

/** „unbekannt“ und „—“ ans Ende einer Zählung */
function sb_unbekannt_ans_ende(array $m): array
{
    foreach (['unbekannt', '—', 'Unbekannt'] as $k) {
        if (array_key_exists($k, $m)) { $v = $m[$k]; unset($m[$k]); $m[$k] = $v; }
    }
    return $m;
}

/* ---------- Kennzahlen ---------- */

/** Summe der Tageszähler im Bereich [von, bis] */
function sb_tage_summe(string $von, string $bis): int
{
    $st = sb_db()->prepare('SELECT COALESCE(SUM(n), 0) FROM tage WHERE datum >= ? AND datum <= ?');
    $st->execute([$von, $bis]);
    return (int) $st->fetchColumn();
}

function sb_anfragen_zahl(string $vonIso, string $bisIso): int
{
    $st = sb_db()->prepare('SELECT COUNT(*) FROM anfragen WHERE erstellt >= ? AND erstellt < ?');
    $st->execute([$vonIso, $bisIso]);
    return (int) $st->fetchColumn();
}

/** ▲/▼ mit Prozent gegenüber dem Vorzeitraum */
function sb_trend(int $jetzt, int $vorher): string
{
    if ($vorher === 0) {
        return $jetzt > 0 ? '<span class="trend auf">neu</span>' : '<span class="trend">±0</span>';
    }
    $p = (int) round(($jetzt - $vorher) / $vorher * 100);
    return $p === 0 ? '<span class="trend">±0 %</span>'
        : '<span class="trend ' . ($p > 0 ? 'auf">▲ +' : 'ab">▼ ') . $p . ' %</span>';
}

/** Zustimmung zur vollen IP: ['ja' => n, 'nein' => n, 'ohne' => n] seit Einführung des Hinweises */
function sb_zustimmung(): array
{
    $r = ['ja' => 0, 'nein' => 0, 'ohne' => 0];
    foreach (sb_db()->query("SELECT COALESCE(einwilligung, 'ohne') AS e, COUNT(*) AS n FROM besuche WHERE beginn >= '2026-11-14T18:40' GROUP BY e")->fetchAll() as $z) {
        $r[$z['e']] = (int) $z['n'];
    }
    return $r;
}

/* ---------- Lauf-Protokoll der täglichen Automatik ---------- */

const SB_LAUF_STATUS = ['ok' => ['erfolgreich', 'ok'], 'teilweise' => ['teilweise', 'warn'], 'fehler' => ['fehlgeschlagen', 'fehl'],
    'pausiert' => ['pausiert', 'aus'], 'kein_bautag' => ['kein Bautag', 'aus']];

/** Prüft den Schlüssel des täglichen Laufs gegen den hinterlegten SHA-256-Wert (app/lauf-schluessel.php). */
function sb_lauf_schluessel_ok(string $schluessel): bool
{
    $datei = __DIR__ . '/lauf-schluessel.php';
    if ($schluessel === '' || !is_file($datei)) return false;
    $hash = require $datei;
    return is_string($hash) && strlen($hash) === 64 && hash_equals($hash, hash('sha256', $schluessel));
}

function sb_lauf_speichern(string $status, int $anzahl, array $pakete, string $meldung): void
{
    sb_db()->prepare('INSERT INTO laeufe (zeit, status, anzahl, pakete, meldung) VALUES (?, ?, ?, ?, ?)')->execute([
        date('c'), $status, $anzahl, json_encode(array_values($pakete), JSON_UNESCAPED_UNICODE), $meldung,
    ]);
    sb_db()->exec("DELETE FROM laeufe WHERE id NOT IN (SELECT id FROM laeufe ORDER BY id DESC LIMIT 200)");
}

function sb_laeufe(int $n = 20): array
{
    $st = sb_db()->prepare('SELECT * FROM laeufe ORDER BY id DESC LIMIT ?');
    $st->bindValue(1, $n, PDO::PARAM_INT);
    $st->execute();
    return $st->fetchAll();
}

/** Zeitpunkt des letzten geplanten Laufs, zu dem (3 Stunden danach) noch keine Meldung vorliegt – sonst null. */
function sb_lauf_fehlt(): ?int
{
    $plan = sb_plan();
    if (!$plan['aktiv'] || !$plan['tage']) return null;
    $uhr = sb_einstellung('auto_uhrzeit_laeuft', $plan['uhrzeit']);
    $jetzt = time();
    for ($i = 0; $i < 8; $i++) {
        $t = strtotime(date('Y-m-d', $jetzt - $i * 86400) . ' ' . $uhr);
        if ($t > $jetzt - 3 * 3600 || !in_array((int) date('N', $t), $plan['tage'], true)) continue;
        if ($t < strtotime('2026-11-15 00:00')) return null;   // vor Einführung des Protokolls
        $st = sb_db()->prepare('SELECT COUNT(*) FROM laeufe WHERE zeit >= ?');
        $st->execute([date('c', $t - 1800)]);
        return (int) $st->fetchColumn() > 0 ? null : $t;
    }
    return null;
}

/* ---------- Wochenbericht per E-Mail (montags, nur Summen) ---------- */

function sb_wochenbericht_text(int $montag): string
{
    $sonntag = $montag + 6 * 86400;
    $von = date('Y-m-d', $montag); $bis = date('Y-m-d', $sonntag);
    $vorVon = date('Y-m-d', $montag - 7 * 86400); $vorBis = date('Y-m-d', $montag - 86400);
    $besuche = sb_tage_summe($von, $bis); $vorher = sb_tage_summe($vorVon, $vorBis);
    $anf = sb_anfragen_zahl($von . 'T00:00:00', date('Y-m-d', $sonntag + 86400) . 'T00:00:00');
    $offen = (int) sb_db()->query("SELECT COUNT(*) FROM anfragen WHERE COALESCE(status, 'neu') = 'neu'")->fetchColumn();
    $st = sb_db()->prepare('SELECT * FROM besuche WHERE datum >= ? AND datum <= ?');
    $st->execute([$von, $bis]);
    $seiten = []; $pakete = []; $staedte = []; $gruppen = []; $kampagnen = [];
    foreach ($st->fetchAll() as $b) {
        foreach (json_decode((string) $b['seiten'], true) ?: [] as $p) {
            $pfad = (string) ($p['path'] ?? '');
            $seiten[sb_seiten_name($pfad)] = ($seiten[sb_seiten_name($pfad)] ?? 0) + 1;
            if ($slug = sb_paket_aus_pfad($pfad)) { $n = sb_katalog_namen()[$slug] ?? $slug; $pakete[$n] = ($pakete[$n] ?? 0) + 1; }
        }
        if (!empty($b['stadt'])) $staedte[$b['stadt']] = ($staedte[$b['stadt']] ?? 0) + 1;
        $g = sb_quellen_gruppe($b); $gruppen[$g] = ($gruppen[$g] ?? 0) + 1;
        if ($k = sb_kampagne($b)) $kampagnen[$k] = ($kampagnen[$k] ?? 0) + 1;
    }
    $liste = static function (array $m, int $n): string {
        arsort($m);
        if (!$m) return "  –\n";
        $t = '';
        foreach (array_slice($m, 0, $n, true) as $k => $v) $t .= '  ' . $k . ': ' . $v . "\n";
        return $t;
    };
    $gebaut = array_filter(sb_katalog()['pakete'] ?? [], static fn ($x) => ($x['fertigAm'] ?? '') >= $von && ($x['fertigAm'] ?? '') <= $bis);
    $laeufe = sb_db()->prepare('SELECT status, COUNT(*) AS n FROM laeufe WHERE zeit >= ? AND zeit < ? GROUP BY status');
    $laeufe->execute([$von . 'T00:00:00', date('Y-m-d', $sonntag + 86400) . 'T00:00:00']);
    $laufText = '';
    foreach ($laeufe->fetchAll() as $l) $laufText .= ' ' . (SB_LAUF_STATUS[$l['status']][0] ?? $l['status']) . ': ' . $l['n'] . ',';
    $z = sb_zustimmung();
    $mitWahl = $z['ja'] + $z['nein'];
    $quote = $besuche > 0 ? number_format($anf / $besuche * 100, 1, ',', '.') : '0';
    $trend = $vorher > 0 ? sprintf(' (Vorwoche %d, %+d %%)', $vorher, (int) round(($besuche - $vorher) / $vorher * 100)) : ' (Vorwoche ' . $vorher . ')';
    return "Studio Breve – Wochenbericht " . date('d.m.', $montag) . '–' . date('d.m.Y', $sonntag) . "\n\n"
        . "Besuche: $besuche$trend\n"
        . "Anfragen: $anf – $quote Anfragen pro 100 Besuche (noch unbeantwortet insgesamt: $offen)\n"
        . 'Neu fertig gebaute Pakete: ' . count($gebaut) . ($gebaut ? ' (' . implode(', ', array_column($gebaut, 'name')) . ')' : '') . "\n"
        . 'Automatik-Läufe:' . ($laufText !== '' ? rtrim($laufText, ',') : ' keine Meldung') . "\n"
        . 'Zustimmung volle IP: ' . ($mitWahl ? round($z['ja'] / $mitWahl * 100) . ' %' : '–') . "\n\n"
        . "Beliebteste Pakete:\n" . $liste($pakete, 5) . "\nBeliebteste Seiten:\n" . $liste($seiten, 5)
        . "\nWoher die Besucher kamen:\n" . $liste($gruppen, 6) . "\nKampagnen-Links / QR-Codes:\n" . $liste($kampagnen, 5)
        . "\nStädte (ungefähr):\n" . $liste($staedte, 5)
        . "\nAlle Details: https://verwaltung.studio-breve.it/\n"
        . "(Diese E-Mail enthält nur Summen. Abbestellen: Verwaltung → Einstellungen → Wochenbericht.)\n";
}

/** Verschickt montags ab 7 Uhr einmal den Bericht der Vorwoche (wird bei Besuchen und beim Öffnen der Verwaltung geprüft). */
function sb_wochenbericht_pruefen(bool $jetzt = false): bool
{
    $c = sb_config();
    $woche = date('o-W');
    $gemerkt = sb_einstellung('bericht_woche', '');
    if (!$jetzt) {
        if ($gemerkt === '') { sb_einstellung_setzen('bericht_woche', $woche); return false; }   // erster Start: ab nächster Woche
        if ($gemerkt === $woche || sb_einstellung('bericht_aktiv', '1') !== '1') return false;
        if ((int) date('N') === 1 && (int) date('G') < 7) return false;
        sb_einstellung_setzen('bericht_woche', $woche);   // zuerst merken: nie doppelt senden
    }
    if (!$c['mail_senden'] || !function_exists('mail')) return false;
    $montag = strtotime('monday this week 00:00') - 7 * 86400;   // immer die abgeschlossene Vorwoche
    $betreff = 'Wochenbericht Studio Breve ' . date('d.m.', $montag) . '–' . date('d.m.Y', $montag + 6 * 86400);
    $kopf = ['From' => 'Studio Breve Verwaltung <' . $c['absender'] . '>', 'Content-Type' => 'text/plain; charset=UTF-8', 'Content-Transfer-Encoding' => '8bit'];
    return @mail($c['benachrichtigung'], '=?UTF-8?B?' . base64_encode($betreff) . '?=', sb_wochenbericht_text($montag), $kopf, '-f' . $c['absender']);
}
