$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$RuntimeDir = Join-Path $Root '.runtime'
$FrontPidFile = Join-Path $RuntimeDir 'frontend.pid'
$BackPidFile = Join-Path $RuntimeDir 'backend.pid'
$FrontOutLog = Join-Path $RuntimeDir 'frontend.out.log'
$FrontErrLog = Join-Path $RuntimeDir 'frontend.err.log'
$BackOutLog = Join-Path $RuntimeDir 'backend.out.log'
$BackErrLog = Join-Path $RuntimeDir 'backend.err.log'
$FrontPort = 3004
$BackPort = 3006

if (-not (Test-Path $RuntimeDir)) {
  New-Item -Path $RuntimeDir -ItemType Directory | Out-Null
}

function Stop-PortOwner {
  param([int]$Port)
  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) { return }
  $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $processIds) {
    try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch {}
  }
}

function Test-PortAlive {
  param([int]$Port)
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$listening
}

Stop-PortOwner -Port $FrontPort
Stop-PortOwner -Port $BackPort

$frontProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev -- --port 3004 --strictPort' -WorkingDirectory $Root -PassThru -WindowStyle Hidden -RedirectStandardOutput $FrontOutLog -RedirectStandardError $FrontErrLog
$backProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev:server' -WorkingDirectory $Root -PassThru -WindowStyle Hidden -RedirectStandardOutput $BackOutLog -RedirectStandardError $BackErrLog

$frontProc.Id | Set-Content -Path $FrontPidFile -Encoding utf8
$backProc.Id | Set-Content -Path $BackPidFile -Encoding utf8

$frontReady = $false
$backReady = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  if (-not $frontReady) { $frontReady = Test-PortAlive -Port $FrontPort }
  if (-not $backReady) { $backReady = Test-PortAlive -Port $BackPort }
  if ($frontReady -and $backReady) { break }
}

if (-not $frontReady -or -not $backReady) {
  Write-Host "Service start incomplete. Front=$frontReady Back=$backReady"
  Write-Host "Check logs: $FrontErrLog / $BackErrLog"
  exit 1
}

Write-Host "Services started. Front=http://localhost:$FrontPort (PID=$($frontProc.Id)); Back=http://localhost:$BackPort (PID=$($backProc.Id))"
