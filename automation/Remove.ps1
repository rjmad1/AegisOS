<#
.SYNOPSIS
    Stops and removes SCM services, deletes user directory junctions, and de-registers environment parameters.
.PARAMETER PlatformRoot
    Target base directory for platform deinstallation.
.PARAMETER DryRun
    Simulate removal actions.
.EXAMPLE
    .\automation\Remove.ps1 -PlatformRoot "D:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Deinstallation Engine    "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# 2. Stop and delete SCM services
$services = @("AegisOSService", "OmniRouteService", "LiteLLMService", "Ollama")
Log-PlatformAction "Suspending and removing registered services..."

foreach ($s in $services) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would stop and delete service: $s"
        } else {
            Stop-Service -Name $s -Force -ErrorAction SilentlyContinue
            # Call sc.exe to delete service
            & sc.exe delete $s | Out-Null
            Log-PlatformSuccess "Removed service: $s"
        }
    }
}

# 3. Delete directory junctions
$srcJunction = Join-Path $env:USERPROFILE ".aegisos"
Log-PlatformAction "Evaluating directory junctions..."
if (Test-Path $srcJunction) {
    $item = Get-Item $srcJunction
    if ($item.Attributes -match "ReparsePoint") {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would delete directory junction: $srcJunction"
        } else {
            cmd.exe /c rmdir "$srcJunction" | Out-Null
            Log-PlatformSuccess "Junction link C:\Users\<user>\.aegisos deleted."
        }
    }
}

# 4. Remove Environment Variables
Log-PlatformAction "Cleaning environment parameters..."
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would remove machine/user env variables for AEGISOS_CONFIG_PATH and AEGISOS_STATE_DIR"
} else {
    [System.Environment]::SetEnvironmentVariable("AEGISOS_CONFIG_PATH", $null, "Machine")
    [System.Environment]::SetEnvironmentVariable("AEGISOS_STATE_DIR", $null, "Machine")
    [System.Environment]::SetEnvironmentVariable("OLLAMA_MODELS", $null, "Machine")
    
    [System.Environment]::SetEnvironmentVariable("AEGISOS_CONFIG_PATH", $null, "User")
    [System.Environment]::SetEnvironmentVariable("AEGISOS_STATE_DIR", $null, "User")
    
    Log-PlatformSuccess "Environment variables cleared."
}

Log-PlatformSuccess "Deinstallation engine finished."
Exit 0
