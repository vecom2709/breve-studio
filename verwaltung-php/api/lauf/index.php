<?php
// Lauf-Protokoll: Die tägliche Automatik meldet hier ihr Ergebnis (POST, nur mit Schlüssel).
// Der Schlüssel liegt nur auf Uwes PC; hier ist nur sein SHA-256-Wert hinterlegt (app/lauf-schluessel.php).
declare(strict_types=1);
require dirname(__DIR__, 2) . '/app/lib.php';
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    sb_json(['ok' => false, 'fehler' => 'nur POST'], 405);
}
if (!sb_grenze_offen('lauf', 30)) {
    sb_json(['ok' => false, 'fehler' => 'zu viele Versuche'], 429);
}
$kopf = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
$schluessel = preg_match('/^Bearer\s+([A-Za-z0-9]{32,128})$/', $kopf, $m) ? $m[1] : (string) ($_SERVER['HTTP_X_LAUF_SCHLUESSEL'] ?? '');
if (!sb_lauf_schluessel_ok($schluessel)) {
    sb_grenze_zaehlen('lauf', 30, 3600);
    sb_json(['ok' => false, 'fehler' => 'Schlüssel ungültig'], 401);
}
$d = json_decode((string) file_get_contents('php://input', false, null, 0, 16384), true);
if (!is_array($d) || !isset(SB_LAUF_STATUS[$d['status'] ?? ''])) {
    sb_json(['ok' => false, 'fehler' => 'status muss ok, teilweise, fehler, pausiert oder kein_bautag sein'], 422);
}
$pakete = array_slice(array_values(array_filter(array_map(static fn ($p) => mb_substr(trim((string) $p), 0, 60), (array) ($d['pakete'] ?? [])))), 0, 20);
sb_lauf_speichern((string) $d['status'], max(0, min(50, (int) ($d['anzahl'] ?? count($pakete)))), $pakete, mb_substr(trim((string) ($d['meldung'] ?? '')), 0, 600));
sb_json(['ok' => true]);
