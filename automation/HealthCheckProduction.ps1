# HealthCheckProduction.ps1
# Production Uptime Monitor and Auto-Healing script.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

param(
    [Parameter(Mandatory=$false)]
    [string]$TargetRoot = "D:\AI-Operations"
)

$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
if (-not (Test-Path $HelperModule)) {
    Write-Error "[ERROR] Platform Helper module is missing!"
    Exit 1
}
Import-Module $HelperModule -Force

$logsDir = Join-Path $TargetRoot "logs\health"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }
$logFile = Join-Path $logsDir "monitor.log"

function Log-Health([string]$msg, [string]$type="INFO") {
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMsg = "[$type] $timestamp $msg"
    Write-Host $logMsg
    $logMsg | Out-File $logFile -Append -Encoding utf8
}

Log-Health "===================================================" "START"
Log-Health "     AI Workstation Production Health Check        " "START"
Log-Health "===================================================" "START"

if (-not (Test-PlatformElevation)) {
    Log-Health "Privileges verification failed. Must run as administrator." "ERROR"
    Exit 1
}

# 1. Port checklist
$ports = @(
    @{ Name = "Ollama Inference Engine"; Port = 11434; Service = "Ollama" }
    @{ Name = "LiteLLM Router Proxy"; Port = 4000; Service = "LiteLLMService" }
    @{ Name = "AegisOS Gateway"; Port = 18789; Service = "AegisOSService" }
    @{ Name = "OmniRoute Dashboard"; Port = 20128; Service = "OmniRouteService" }
    @{ Name = "Operations Console"; Port = 3000; Service = "AI_Console_Service" }
    @{ Name = "Caddy Reverse Proxy (HTTPS)"; Port = 8443; Service = "caddy" }
)

$allHealthy = $true

foreach ($p in $ports) {
    $conn = New-Object System.Net.Sockets.TcpClient
    $name = $p.Name
    $port = $p.Port
    $svcName = $p.Service

    try {
        $conn.Connect("127.0.0.1", $port)
        Log-Health "Service '$name' is active and listening on port $port." "SUCCESS"
        $conn.Close()
    } catch {
        Log-Health "Required service '$name' is unreachable on port $port!" "WARN"
        $allHealthy = $false

        # Auto-healing loop: Attempt service restart
        Log-Health "Attempting recovery for service: $svcName..." "ACTION"
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if ($svc) {
            Stop-Service -Name $svcName -Force -ErrorAction SilentlyContinue
            Start-Service -Name $svcName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 5
            $svc.Refresh()
            if ($svc.Status -eq "Running") {
                Log-Health "Successfully recovered service: $svcName." "SUCCESS"
            } else {
                Log-Health "Auto-recovery failed for service: $svcName. Manual intervention required." "ERROR"
            }
        } else {
            Log-Health "Service '$svcName' is not registered on host SCM." "ERROR"
        }
    }
}

# 2. Check Database sizing limit
$dbDir = Join-Path $TargetRoot "runtime\databases"
if (Test-Path $dbDir) {
    $dbFiles = Get-ChildItem -Path $dbDir -File
    foreach ($df in $dbFiles) {
        $sizeMb = [math]::Round($df.Length / 1MB, 2)
        if ($sizeMb -gt 50.0) {
            Log-Health "Database file $($df.Name) is large ($sizeMb MB)." "WARN"
        }
    }
}

if ($allHealthy) {
    Log-Health "Verification finished. Status: PASS." "SUCCESS"
    Exit 0
} else {
    Log-Health "Verification finished. Status: DEGRADED." "WARN"
    Exit 1
}
