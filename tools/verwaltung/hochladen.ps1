# Lädt die Verwaltung von Studio Breve per FTPS nach verwaltung.studio-breve.it.
# Aufruf: Rechtsklick → "Mit PowerShell ausführen" oder:  powershell -ExecutionPolicy Bypass -File .\hochladen.ps1
# Das FTP-Passwort tippst du selbst ein; es wird nirgends gespeichert.
param(
    [string]$Server = 'w02265ed.kasserver.com',
    [string]$Benutzer = 'f0193216',   # eigener FTP-Zugang nur für den Ordner der Verwaltung
    [string]$Ziel = ''                # der Zugang startet bereits im Ordner /verwaltung.studio-breve.it/
)
$ErrorActionPreference = 'Stop'
$quelle = Join-Path $PSScriptRoot 'verwaltung'
$protokoll = Join-Path $PSScriptRoot ("upload-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
function Log($t) { $z = (Get-Date -Format 'HH:mm:ss') + '  ' + $t; Write-Host $z; Add-Content -Path $protokoll -Value $z -Encoding UTF8 }

Write-Host ''
Write-Host '=== Studio Breve – Verwaltung hochladen ===' -ForegroundColor Cyan
Write-Host "Server: $Server   Benutzer: $Benutzer   Ziel: $Ziel"
$pw = Read-Host "FTP-Passwort für $Benutzer" -AsSecureString
$cred = New-Object System.Net.NetworkCredential($Benutzer, $pw)

# Einrichtungscode (nur beim ersten Mal; Datei bleibt hier im Ordner)
$cfg = Join-Path $quelle 'app\config.local.php'
if (-not (Test-Path $cfg)) {
    $b = New-Object byte[] 24
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    $code = -join ($b | ForEach-Object { $_.ToString('x2') })
    [IO.File]::WriteAllText($cfg, "<?php`nreturn ['einrichtungscode' => '$code'];`n", (New-Object Text.UTF8Encoding $false))
}
$code = ([regex]"'einrichtungscode' => '([a-f0-9]+)'").Match([IO.File]::ReadAllText($cfg)).Groups[1].Value

function Anfrage([string]$pfad, [string]$methode) {
    $r = [Net.FtpWebRequest]::Create("ftp://$Server$pfad")
    $r.Method = $methode; $r.Credentials = $cred; $r.EnableSsl = $true
    $r.UsePassive = $true; $r.UseBinary = $true; $r.KeepAlive = $false; $r.Timeout = 30000
    return $r
}

# 1. Anmeldung prüfen und Ziel sichern (Liste der vorhandenen Dateien ins Protokoll)
try {
    $r = Anfrage '/' ([Net.WebRequestMethods+Ftp]::ListDirectory)
    $antwort = $r.GetResponse(); $antwort.Close()
    Log 'Anmeldung am FTP-Server erfolgreich (FTPS).'
} catch [Net.WebException] {
    $status = $_.Exception.Response.StatusCode
    Write-Host "Anmeldung fehlgeschlagen ($status). Abbruch – nichts hochgeladen." -ForegroundColor Red
    Read-Host 'Enter zum Schließen'; exit 1
}
try {
    $r = Anfrage ($Ziel + '/') ([Net.WebRequestMethods+Ftp]::ListDirectoryDetails)
    $leser = New-Object IO.StreamReader($r.GetResponse().GetResponseStream())
    Log "Vorhandener Inhalt von ${Ziel}:"; Log ($leser.ReadToEnd()); $leser.Close()
} catch { Log "Zielordner $Ziel ist noch leer oder fehlt – wird angelegt." }

# 2. Ordner anlegen und Dateien hochladen (data/ wird nie angefasst)
function Ordner([string]$pfad) {
    try { (Anfrage $pfad ([Net.WebRequestMethods+Ftp]::MakeDirectory)).GetResponse().Close() } catch { }
}
if ($Ziel) { Ordner $Ziel }
$dateien = Get-ChildItem -Path $quelle -Recurse -File -Force
# alle Ordner samt übergeordneten anlegen (Eltern zuerst)
$ordner = New-Object 'System.Collections.Generic.SortedSet[string]'
foreach ($d in $dateien) {
    $p = Split-Path $d.FullName.Substring($quelle.Length) -Parent
    while ($p -and $p -ne '\') { [void]$ordner.Add($p); $p = Split-Path $p -Parent }
}
foreach ($o in $ordner) { Ordner ($Ziel + ($o -replace '\\', '/')) }
$n = 0; $fehler = 0
foreach ($d in $dateien) {
    $rel = $d.FullName.Substring($quelle.Length) -replace '\\', '/'
    if ($rel -like '/data/*') { continue }
    try {
        $r = Anfrage ($Ziel + $rel) ([Net.WebRequestMethods+Ftp]::UploadFile)
        $bytes = [IO.File]::ReadAllBytes($d.FullName)
        $r.ContentLength = $bytes.Length
        $s = $r.GetRequestStream(); $s.Write($bytes, 0, $bytes.Length); $s.Close()
        $r.GetResponse().Close()
        Log "hochgeladen: $rel ($($bytes.Length) Bytes)"; $n++
    } catch {
        Log "FEHLER bei ${rel}: $($_.Exception.Message)"; $fehler++
    }
}
Log "$n Dateien hochgeladen, $fehler Fehler."
if ($fehler -gt 0) {
    Write-Host 'Es gab Fehler beim Hochladen – bitte Claude Bescheid geben. Der Einrichtungslink wird nicht geöffnet.' -ForegroundColor Red
    Read-Host 'Enter zum Schließen'; exit 1
}

# 3. Einrichtungslink
$link = "https://verwaltung.studio-breve.it/?einrichten=$code"
Write-Host ''
Write-Host 'Fertig. Jetzt im Browser das Passwort für die Verwaltung festlegen:' -ForegroundColor Green
Write-Host $link -ForegroundColor Yellow
Write-Host '(Der Link funktioniert nur, solange noch kein Passwort gesetzt ist.)'
Start-Process $link
Read-Host 'Enter zum Schließen'
