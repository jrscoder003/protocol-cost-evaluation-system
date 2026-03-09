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

  $pidValue = $null
  if (Test-Path $PidFile) {
    $pidValue = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
  }

  $listeningConn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($listeningConn) {
    $ownerPid = [int]$listeningConn.OwningProcess
    if ($pidValue -and ([int]$pidValue) -ne $ownerPid) {
      Write-Host "${Name}: running, PID=$ownerPid, URL=http://localhost:$Port (pid file corrected from $pidValue)"
      $ownerPid | Set-Content -Path $PidFile -Encoding utf8
    } else {
      Write-Host "${Name}: running, PID=$ownerPid, URL=http://localhost:$Port"
      if (-not $pidValue) {
        $ownerPid | Set-Content -Path $PidFile -Encoding utf8
      }
    }
  } else {
    if ($pidValue) {
      $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "${Name}: process exists but port $Port not listening, PID=$pidValue"
      } else {
        Write-Host "${Name}: stopped (PID=$pidValue not found)"
      }
    } else {
      Write-Host "${Name}: stopped (no PID file and port not listening)"
    }
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
