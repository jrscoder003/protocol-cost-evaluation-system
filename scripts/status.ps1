$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$RuntimeDir = Join-Path $Root '.runtime'
$FrontPidFile = Join-Path $RuntimeDir 'frontend.pid'
$BackPidFile = Join-Path $RuntimeDir 'backend.pid'
$FrontOutLog = Join-Path $RuntimeDir 'frontend.out.log'
$FrontErrLog = Join-Path $RuntimeDir 'frontend.err.log'
$BackOutLog = Join-Path $RuntimeDir 'backend.out.log'
$BackErrLog = Join-Path $RuntimeDir 'backend.err.log'

function Show-ServiceStatus {
  param(
    [string]$Name,
    [string]$PidFile,
    [int]$Port,
    [string]$OutLog,
    [string]$ErrLog
  )

  if (-not (Test-Path $PidFile)) {
    Write-Host "${Name}: stopped (no PID file)"
    return
  }

  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue
  if (-not $pidValue) {
    Write-Host "${Name}: stopped (empty PID file)"
    return
  }

  $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -eq ([int]$pidValue) }

  if ($proc -and $listening) {
    Write-Host "${Name}: running, PID=$pidValue, URL=http://localhost:$Port"
  } elseif ($proc) {
    Write-Host "${Name}: process exists but port $Port not listening, PID=$pidValue"
  } else {
    Write-Host "${Name}: stopped (PID=$pidValue not found)"
  }

  if (Test-Path $ErrLog) {
    Write-Host "--- $Name stderr (tail 10) ---"
    Get-Content $ErrLog -Tail 10
  }

  if (Test-Path $OutLog) {
    Write-Host "--- $Name stdout (tail 10) ---"
    Get-Content $OutLog -Tail 10
  }
}

Show-ServiceStatus -Name 'Frontend' -PidFile $FrontPidFile -Port 3004 -OutLog $FrontOutLog -ErrLog $FrontErrLog
Show-ServiceStatus -Name 'Backend' -PidFile $BackPidFile -Port 3006 -OutLog $BackOutLog -ErrLog $BackErrLog
