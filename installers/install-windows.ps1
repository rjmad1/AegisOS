# installers/install-windows.ps1
# Native Windows Installer wrapper. Delegates installation execution to PlatformBootstrapEngine.ps1.

param (
    [switch]$Silent,
    [switch]$Repair,
    [switch]$Upgrade,
    [string]$InstallDir = "C:\AIPlatform",
    [string]$ServicePassword
)

$scriptPath = Join-Path $PSScriptRoot "..\automation\libs\PlatformBootstrapEngine.ps1"
if (-not (Test-Path $scriptPath)) {
    # Fallback to local path or build folder
    $scriptPath = Join-Path $PSScriptRoot "PlatformBootstrapEngine.ps1"
}

Write-Host "Invoking AegisOS Platform Bootstrap Engine for Windows..." -ForegroundColor Cyan
& $scriptPath -PlatformRoot $InstallDir
Exit $LASTEXITCODE
