<#
.SYNOPSIS
    Pulls updates, upgrades node packages, refreshes dependencies, and restarts platform services.
.PARAMETER PlatformRoot
    Target base directory for platform upgrades.
.PARAMETER DryRun
    Simulate upgrades.
.EXAMPLE
    .\automation\Upgrade.ps1 -PlatformRoot "D:\AIPlatform"
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
Log-PlatformInfo "  AI Workstation Platform Upgrade & Refresh Engine "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# 2. Check for winget dependency upgrades
Log-PlatformAction "Checking for runtime dependencies updates..."
$packages = @("Git.Git", "OpenJS.NodeJS", "Ollama.Ollama", "Docker.DockerDesktop")
foreach ($pkg in $packages) {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would execute: winget upgrade $pkg --silent"
    } else {
        try {
            Log-PlatformInfo "Upgrading package $pkg via winget..."
            Start-Process -FilePath "winget" -ArgumentList "upgrade", $pkg, "--silent", "--accept-package-agreements", "--accept-source-agreements" -Wait -NoNewWindow
        } catch {
            Log-PlatformWarn "Failed to update package $pkg: $_"
        }
    }
}

# 3. Pull latest git code if in project repository
Log-PlatformAction "Pulling latest platform source files..."
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would run: git pull origin main"
} else {
    try {
        $gitStatus = & git status 2>&1
        if ($LASTEXITCODE -eq 0) {
            & git pull origin main 2>&1
            Log-PlatformSuccess "Source files updated."
        }
    } catch {
        Log-PlatformInfo "Not running inside a git repository or git command missing."
    }
}

# 4. Stop and Restart Services to clear runtime cache
Log-PlatformAction "Restarting services to apply parameters..."
$services = @("OpenClawService", "OmniRouteService", "LiteLLMService", "Ollama")
foreach ($s in $services) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        if (-not $DryRun) {
            Log-PlatformInfo "Restarting service: $s"
            Restart-Service -Name $s -Force -ErrorAction SilentlyContinue
        } else {
            Log-PlatformAction "[DRY-RUN] Would restart service: $s"
        }
    }
}

Log-PlatformSuccess "Platform upgrade sequence complete."
Exit 0
