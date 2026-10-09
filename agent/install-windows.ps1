# Usage: powershell -ExecutionPolicy Bypass -File agent\install-windows.ps1 -Url <meridian-url> -Token <token>
param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$Token
)
$ErrorActionPreference = 'Stop'

$dir = Join-Path $env:LOCALAPPDATA 'Meridian'
New-Item -ItemType Directory -Force $dir | Out-Null
Copy-Item -Force (Join-Path $PSScriptRoot 'meridian-agent.ps1') (Join-Path $dir 'meridian-agent.ps1')
@{ url = $Url; token = $Token } | ConvertTo-Json | Set-Content -Encoding ascii (Join-Path $dir 'agent.json')

$script = Join-Path $dir 'meridian-agent.ps1'
$action = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument "--headless powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes 1)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 2) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Meridian Agent' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $script
Write-Output "Meridian agent o'rnatildi: $env:COMPUTERNAME -> $Url"
