# BackupProduction.ps1
# Production-grade Backup Engine for AI Workstation configurations and assets.
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

Log-PlatformInfo "==================================================="
Log-PlatformInfo "   AI Workstation Production Backup Engine         "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$backupsDir = Join-Path $TargetRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$stagingName = "ConsoleBackup_$timestamp"
$stagingDir = Join-Path $backupsDir $stagingName

if (-not (Test-Path $backupsDir)) {
    New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

try {
    Log-PlatformAction "Creating backup staging folder at $stagingDir..."
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

    # 2. Copy configurations (.env.production, Caddyfile, console_config.json)
    Log-PlatformInfo "Backing up configurations..."
    $configDest = Join-Path $stagingDir "Config"
    New-Item -ItemType Directory -Path $configDest -Force | Out-Null

    $configFolder = Join-Path $TargetRoot "config"
    if (Test-Path $configFolder) {
        Copy-Item -Path (Join-Path $configFolder "*") -Destination $configDest -Force
    }

    # 3. Export SCM/NSSM Service Registries
    Log-PlatformInfo "Exporting Windows service registry parameters..."
    $regDest = Join-Path $stagingDir "Registry"
    New-Item -ItemType Directory -Path $regDest -Force | Out-Null
    
    $services = @("AI_Console_Service", "LiteLLMService", "OpenClawService", "OmniRouteService")
    foreach ($s in $services) {
        $regPath = "HKLM\SYSTEM\CurrentControlSet\Services\$s\Parameters"
        reg export $regPath (Join-Path $regDest "$($s)_Parameters.reg") /y 2>$null | Out-Null
    }

    # 4. Copy Databases (SQLite, JSON checkpoints, etc.)
    Log-PlatformInfo "Backing up databases..."
    $dbDest = Join-Path $stagingDir "Database"
    New-Item -ItemType Directory -Path $dbDest -Force | Out-Null

    $databasesDir = Join-Path $TargetRoot "runtime\databases"
    if (Test-Path $databasesDir) {
        Copy-Item -Path (Join-Path $databasesDir "*") -Destination $dbDest -Recurse -Force
    }

    # 5. Copy Knowledge & Metadata assets
    Log-PlatformInfo "Backing up knowledge context files..."
    $knowledgeSrc = Join-Path (Get-PlatformRoot $null) "knowledge"
    if (Test-Path $knowledgeSrc) {
        $knowledgeDest = Join-Path $stagingDir "knowledge"
        New-Item -ItemType Directory -Path $knowledgeDest -Force | Out-Null
        Copy-Item -Path (Join-Path $knowledgeSrc "*") -Destination $knowledgeDest -Recurse -Force
    }

    # 6. Copy Artifacts Storage
    Log-PlatformInfo "Backing up artifacts..."
    $artifactsSrc = Join-Path $TargetRoot "artifacts"
    if (Test-Path $artifactsSrc) {
        $artifactsDest = Join-Path $stagingDir "artifacts"
        New-Item -ItemType Directory -Path $artifactsDest -Force | Out-Null
        Copy-Item -Path (Join-Path $artifactsSrc "*") -Destination $artifactsDest -Recurse -Force
    }

    # 7. Compile into secure Zip package
    Log-PlatformAction "Compiling final compressed backup archive..."
    $zipPackage = Join-Path $backupsDir "$stagingName.zip"
    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPackage -Force
    
    Log-PlatformSuccess "Backup snapshot successfully compiled: $zipPackage"

} catch {
    Log-PlatformError "Backup operation encountered an error: $_"
} finally {
    # 8. Staging Clean-up
    if (Test-Path $stagingDir) {
        Log-PlatformInfo "Cleaning up temporary staging area: $stagingDir"
        Remove-Item -Path $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Exit 0
