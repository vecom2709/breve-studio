# Rückweg: entfernt die hochgeladenen Programmdateien der Verwaltung wieder vom Server.
# Die Daten (Ordner data/ mit Anfragen und Besuchszahlen) bleiben unangetastet.
# Nur bei Bedarf ausführen:  powershell -ExecutionPolicy Bypass -File .\rueckweg.ps1
param(
    [string]$Server = 'w02265ed.kasserver.com',
    [string]$Benutzer = 'f0193216',   # eigener FTP-Zugang nur für den Ordner der Verwaltung
    [string]$Ziel = ''                # der Zugang startet bereits im Ordner /verwaltung.studio-breve.it/
)
$ErrorActionPreference = 'Stop'
$quelle = Join-Path $PSScriptRoot 'verwaltung'
Write-Host 'Rückweg: Programmdateien der Verwaltung entfernen (Daten bleiben).' -ForegroundColor Yellow
if ((Read-Host 'Wirklich ausführen? (ja/nein)') -ne 'ja') { exit 0 }
$pw = Read-Host "FTP-Passwort für $Benutzer" -AsSecureString
$cred = New-Object System.Net.NetworkCredential($Benutzer, $pw)
foreach ($d in Get-ChildItem -Path $quelle -Recurse -File -Force) {
    $rel = $d.FullName.Substring($quelle.Length) -replace '\\', '/'
    if ($rel -like '/data/*') { continue }
    try {
        $r = [Net.FtpWebRequest]::Create("ftp://$Server$Ziel$rel")
        $r.Method = [Net.WebRequestMethods+Ftp]::DeleteFile; $r.Credentials = $cred; $r.EnableSsl = $true; $r.UsePassive = $true
        $r.GetResponse().Close(); Write-Host "entfernt: $rel"
    } catch { Write-Host "nicht vorhanden: $rel" }
}
Read-Host 'Fertig. Enter zum Schließen'
