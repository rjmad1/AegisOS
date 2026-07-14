<#
.SYNOPSIS
    Runs a lightweight health validation sweep on local ports and registered services, auto-restarting failed items.
.PARAMETER PlatformRoot
    Target base directory for logs.
.PARAMETER IntervalSeconds
    Wait time between health check loops.
.PARAMETER RunOnce
    Execute checks once and exit instead of loop.
.EXAMPLE
    .\automation\HealthCheck.ps1 -PlatformRoot "D:\AIPlatform" -RunOnce
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [int]$IntervalSeconds = 60,
    
    [Parameter(Mandatory=$false)]
    [switch]$RunOnce
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

$PlatformRoot = Get-PlatformRoot $PlatformRoot

$logPath = Join-Path $PlatformRoot "logs\health\monitor.log"

# Ensure health logs folder exists
$healthLogDir = Split-Path $logPath -Parent
if (-not (Test-Path $healthLogDir)) {
    New-Item -ItemType Directory -Path $healthLogDir -Force | Out-Null
}

function Run-UptimeCheck {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $services = @("Ollama", "LiteLLMService", "AegisOSService", "OmniRouteService")
    $unhealthyCount = 0
    $logMsg = "[$timestamp] Sweeping services: "

    foreach ($s in $services) {
        $serviceObj = Get-Service -Name $s -ErrorAction SilentlyContinue
        if ($serviceObj) {
            $status = $serviceObj.Status
            $logMsg += "$s=$status; "
            
            # Auto-restart if stopped
            if ($status -ne "Running") {
                $unhealthyCount++
                Log-PlatformWarn "Service '$s' is in state '$status'. Attempting recovery restart..."
                Start-Service -Name $s -ErrorAction SilentlyContinue
            }
        } else {
            $logMsg += "$s=Missing; "
        }
    }

    $logMsg | Out-File -FilePath $logPath -Append -Encoding utf8
    return $unhealthyCount
}

Log-PlatformInfo "Starting platform health check service..."
Log-PlatformInfo "Uptime records written to: $logPath"

if ($RunOnce) {
    $failures = Run-UptimeCheck
    Exit $failures
}

while ($true) {
    $failures = Run-UptimeCheck
    Start-Sleep -Seconds $IntervalSeconds
}
