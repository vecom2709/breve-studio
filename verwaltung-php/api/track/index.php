<?php
declare(strict_types=1);
// Reichweitenmessung der Website: GET liefert die öffentliche Besuchszahl, POST zählt einen Aufruf.
require dirname(__DIR__, 2) . '/app/lib.php';

sb_api_koepfe();
$erlaubt = sb_cors();
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($methode === 'OPTIONS') {
    http_response_code($erlaubt ? 204 : 403);
    exit;
}
if ($methode === 'GET') {
    sb_json(['n' => sb_besuche_gesamt()]);
}
if ($methode !== 'POST') {
    header('Allow: GET, POST, OPTIONS');
    sb_json(['ok' => false], 405);
}
if (!$erlaubt) {
    sb_json(['ok' => false], 403);
}
if (($_SERVER['HTTP_DNT'] ?? '') === '1' || ($_SERVER['HTTP_SEC_GPC'] ?? '') === '1') {
    sb_json(['ok' => true, 'ignored' => 'dnt', 'n' => sb_besuche_gesamt()]);
}
if (sb_einstellung('eigene_ausnehmen', '1') === '1' && sb_angemeldet()) {
    sb_json(['ok' => true, 'ignored' => 'admin', 'n' => sb_besuche_gesamt()]);
}

$roh = (string) file_get_contents('php://input', false, null, 0, 8192);
$body = json_decode($roh, true);
if (!is_array($body)) {
    sb_json(['ok' => false], 400);
}
$sid = (string) ($body['sid'] ?? '');
$pfad = (string) ($body['path'] ?? '/');
if (!preg_match('/^[A-Za-z0-9._:-]{8,80}$/', $sid) || !str_starts_with($pfad, '/') || strlen($pfad) > 300) {
    sb_json(['ok' => false], 400);
}
if (str_starts_with($pfad, '/verwaltung') || str_starts_with($pfad, '/api/')) {
    sb_json(['ok' => true, 'ignored' => 'pfad', 'n' => sb_besuche_gesamt()]);
}

// Einwilligung zur vollen IP (Banner auf der Website): nur 'ja' oder 'nein' zählt
$einwilligung = in_array($body['consent'] ?? '', ['ja', 'nein'], true) ? $body['consent'] : null;
$ipRoh = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
$ipVoll = ($einwilligung === 'ja' && filter_var($ipRoh, FILTER_VALIDATE_IP)) ? $ipRoh : null;
if (($body['t'] ?? '') === 'consent') {
    sb_ip_einwilligung($sid, $einwilligung, $ipVoll);
    sb_json(['ok' => true]);
}

if (($body['t'] ?? '') === 'timing') {
    sb_verweildauer_speichern($sid, $pfad, (float) ($body['ms'] ?? -1));
    sb_json(['ok' => true]);
}

$utm = null;
if (isset($body['utm']) && is_array($body['utm'])) {
    $utm = [];
    foreach ($body['utm'] as $k => $v) {
        if (is_string($k) && is_string($v) && in_array($k, ['source', 'medium', 'campaign', 'term', 'content'], true)) {
            $utm[$k] = mb_substr($v, 0, 80);
        }
    }
    $utm = $utm ?: null;
}
$ua = sb_ua((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
$neu = sb_aufruf_speichern([
    'sid' => $sid,
    'path' => $pfad,
    'referrer' => mb_substr((string) ($body['referrer'] ?? ''), 0, 500),
    'utm' => $utm,
    'sprache' => mb_substr((string) ($body['lang'] ?? ''), 0, 8),
    'land' => sb_land_aus_sprache((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '')),
    'ip' => sb_ip_kuerzen($ipRoh),   // gekürzt (letzter Block = 0) für Ort und Anzeige
    'ip_voll' => $ipVoll,            // nur mit Einwilligung
    'einwilligung' => $einwilligung,
    'geraet' => $ua['geraet'],
    'system' => $ua['system'],
    'browser' => $ua['browser'],
    'bildschirm' => mb_substr((string) ($body['screen'] ?? ''), 0, 20),
]);
sb_json(['ok' => true, 'unique' => $neu, 'n' => sb_besuche_gesamt()]);
