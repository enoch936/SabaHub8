# Stops the local SabaHub payment PostgreSQL cluster.
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$data = Join-Path $root ".run\pgdata"
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D $data stop
