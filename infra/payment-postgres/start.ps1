# Starts the local SabaHub payment PostgreSQL cluster (dev only).
# Data lives in .run/pgdata, port 55432, trust auth for localhost.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$data = Join-Path $root ".run\pgdata"
$logs = Join-Path $root ".run\logs"
$logFile = Join-Path $logs "pg.log"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$pgCtl = Join-Path $pgBin "pg_ctl.exe"
$psql = Join-Path $pgBin "psql.exe"
$createdb = Join-Path $pgBin "createdb.exe"

New-Item -ItemType Directory -Force -Path $logs | Out-Null

$envFile = Join-Path $root "backend-spring\.env"
if (Test-Path $envFile) {
    $passwordLine = Get-Content $envFile | Where-Object { $_ -match '^SABAHUB_PAYMENT_DB_PASSWORD=' } | Select-Object -First 1
    if ($passwordLine) {
        $env:PGPASSWORD = $passwordLine.Substring($passwordLine.IndexOf('=') + 1)
    }
}

if (-not (Test-Path (Join-Path $data "PG_VERSION"))) {
    & (Join-Path $pgBin "initdb.exe") -D $data -U sabahub -A trust -E UTF8 --no-locale
}

& $pgCtl -D $data status *> $null
if ($LASTEXITCODE -ne 0) {
    & $pgCtl -D $data -o "-p 55432" -l $logFile start
    Start-Sleep -Seconds 3
}

$exists = & $psql -h 127.0.0.1 -p 55432 -U sabahub -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='sabahub_payments'"
if ($exists.Trim() -ne "1") {
    & $createdb -h 127.0.0.1 -p 55432 -U sabahub sabahub_payments
}

Write-Output "Payment PostgreSQL is running on 127.0.0.1:55432 (database sabahub_payments)."
