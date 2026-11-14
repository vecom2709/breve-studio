<?php
// Öffentliche, nur lesende Abfrage der Automatik-Einstellungen für die geplante Aufgabe „Studio Breve: täglich … Pakete“.
// Enthält keine personenbezogenen Daten. Geändert wird nur in der Verwaltung (angemeldet).
declare(strict_types=1);
require dirname(__DIR__, 2) . '/app/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
$plan = sb_plan();
$naechster = sb_naechster_lauf($plan);
echo json_encode($plan + ['heute_bauen' => $plan['aktiv'] && in_array((int) (new DateTimeImmutable('now', new DateTimeZone('Europe/Rome')))->format('N'), $plan['tage'], true),
    'naechster_lauf' => $naechster ? date('c', $naechster) : null], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
