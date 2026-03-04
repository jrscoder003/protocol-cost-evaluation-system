$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$RuntimeDir = Join-Path $Root '.runtime'
$FrontPidFile = Join-Path $RuntimeDir 'frontend.pid'
$BackPidFile = Join-Path $RuntimeDir 'backend.pid'

function Stop-ByPidFile {
  param([string]$PidFile, [string]$Name)
  if (-not (Test-Path $PidFile)) {
    Write-Host "${Name}: no PID file"
    return
  }

  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue
  if (-not $pidValue) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "${Name}: empty PID file cleaned"
    return
  }

  $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  if ($proc) {
    Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
    Write-Host "${Name} stopped. PID=$pidValue"
  } else {
    Write-Host "${Name} PID not found. PID=$pidValue"
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

Stop-ByPidFile -PidFile $FrontPidFile -Name 'Frontend'
Stop-ByPidFile -PidFile $BackPidFile -Name 'Backend'

$ports = @(3004, 3006)
foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $processIds) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Write-Host "Killed remaining process on port $port. PID=$procId"
    }
  }
}
