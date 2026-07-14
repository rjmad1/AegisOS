# ManageService.ps1
# Production Service Manager for AI Workstation Components.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string]$Service = "all"
)

$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
if (-not (Test-Path $HelperModule)) {
    Write-Error "[ERROR] Platform Helper module is missing!"
    Exit 1
}
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "   AI Workstation Production Service Manager       "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$serviceCatalog = @{
    "console"    = "AI_Console_Service"
    "proxy"      = "caddy"
    "ollama"     = "Ollama"
    "litellm"    = "LiteLLMService"
    "aegisos"   = "AegisOSService"
    "omniroute"  = "OmniRouteService"
}

$servicesToProcess = @()
if ($Service -eq "all") {
    # Process all in startup dependency order or shutdown order
    if ($Action -eq "stop") {
        # Shutdown order (Reverse dependency order)
        $servicesToProcess = @("proxy", "console", "omniroute", "aegisos", "litellm", "ollama")
    } else {
        # Startup order
        $servicesToProcess = @("ollama", "litellm", "aegisos", "omniroute", "console", "proxy")
    }
} else {
    if ($serviceCatalog.ContainsKey($Service.ToLower())) {
        $servicesToProcess = @($Service.ToLower())
    } else {
        # Try matching raw service name directly
        $match = $null
        foreach ($k in $serviceCatalog.Keys) {
            if ($serviceCatalog[$k] -eq $Service) { $match = $k }
        }
        if ($match) {
            $servicesToProcess = @($match)
        } else {
            Log-PlatformError "Unknown service specified: $Service. Available: console, proxy, ollama, litellm, aegisos, omniroute, all"
            Exit 1
        }
    }
}

foreach ($sKey in $servicesToProcess) {
    $sName = $serviceCatalog[$sKey]
    $svc = Get-Service -Name $sName -ErrorAction SilentlyContinue
    if (-not $svc) {
        Log-PlatformWarn "Service '$sName' ($sKey) is not registered in Windows SCM."
        continue
    }

    if ($Action -eq "status") {
        $color = "Yellow"
        if ($svc.Status -eq "Running") { $color = "Green" }
        elseif ($svc.Status -eq "Stopped") { $color = "Red" }
        Write-Host "Service: " -NoNewline
        Write-Host "$sName ($sKey)" -ForegroundColor Cyan -NoNewline
        Write-Host " is " -NoNewline
        Write-Host "$($svc.Status)" -ForegroundColor $color
    }
    elseif ($Action -eq "start") {
        if ($svc.Status -eq "Running") {
            Log-PlatformInfo "Service '$sName' is already running."
        } else {
            Log-PlatformAction "Starting service: $sName..."
            Start-Service -Name $sName
            $svc.Refresh()
            if ($svc.Status -eq "Running") {
                Log-PlatformSuccess "Service '$sName' started successfully."
            } else {
                Log-PlatformError "Failed to start service '$sName'. Current status: $($svc.Status)"
            }
        }
    }
    elseif ($Action -eq "stop") {
        if ($svc.Status -eq "Stopped") {
            Log-PlatformInfo "Service '$sName' is already stopped."
        } else {
            Log-PlatformAction "Stopping service: $sName..."
            Stop-Service -Name $sName -Force
            $svc.Refresh()
            if ($svc.Status -eq "Stopped") {
                Log-PlatformSuccess "Service '$sName' stopped successfully."
            } else {
                Log-PlatformError "Failed to stop service '$sName'. Current status: $($svc.Status)"
            }
        }
    }
    elseif ($Action -eq "restart") {
        Log-PlatformAction "Restarting service: $sName..."
        Restart-Service -Name $sName -Force
        $svc.Refresh()
        if ($svc.Status -eq "Running") {
            Log-PlatformSuccess "Service '$sName' restarted successfully."
        } else {
            Log-PlatformError "Failed to restart service '$sName'. Current status: $($svc.Status)"
        }
    }
}

Exit 0
