# Sends one metrics report from a Windows machine to Meridian.
# Reads { "url": ..., "token": ... } from %LOCALAPPDATA%\Meridian\agent.json.
$ErrorActionPreference = 'Stop'

$configPath = Join-Path $env:LOCALAPPDATA 'Meridian\agent.json'
$config = Get-Content -Raw $configPath | ConvertFrom-Json

$os = Get-CimInstance Win32_OperatingSystem
$cpu = (Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
$systemDrive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$($env:SystemDrive)'"

$containers = $null
if (Get-Command docker -ErrorAction SilentlyContinue) {
  $ids = docker ps -q 2>$null
  if ($LASTEXITCODE -eq 0) { $containers = @($ids | Where-Object { $_ }).Count }
}

$payload = [ordered]@{
  hostname       = $env:COMPUTERNAME
  os             = "$($os.Caption) $($os.Version)"
  kernel         = $os.BuildNumber
  cores          = [Environment]::ProcessorCount
  cpu            = [math]::Round([double]$cpu)
  memTotalKb     = [double]$os.TotalVisibleMemorySize
  memAvailableKb = [double]$os.FreePhysicalMemory
  diskTotalKb    = [math]::Round($systemDrive.Size / 1KB)
  diskUsedKb     = [math]::Round(($systemDrive.Size - $systemDrive.FreeSpace) / 1KB)
  uptimeSec      = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalSeconds)
  containers     = $containers
} | ConvertTo-Json -Compress

Invoke-RestMethod -Method Post -Uri ($config.url.TrimEnd('/') + '/api/agent/report') `
  -Headers @{ Authorization = "Bearer $($config.token)" } `
  -ContentType 'application/json' -Body $payload -TimeoutSec 20 | Out-Null
