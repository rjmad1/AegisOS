<#
.SYNOPSIS
    Compiles, bundles, and compresses configurations, databases, registry exports, and dynamic layouts into backups/ archives.
.PARAMETER PlatformRoot
    Target base directory for backups.
.PARAMETER DryRun
    Simulate backups actions.
.PARAMETER VerboseLog
    Enable detailed execution logs.
.EXAMPLE
    .\automation\Backup.ps1 -PlatformRoot "D:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseLog
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Archiving & Backup Engine"
Log-PlatformInfo "==================================================="

# 1. Verify administrative privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

$backupsDir = Join-Path $PlatformRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$stagingName = "Backup_$timestamp"
$stagingDir = Join-Path $backupsDir $stagingName

# Ensure target backups directory exists
if (-not (Test-Path $backupsDir) -and -not $DryRun) {
    New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

try {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would create backup staging directory: $stagingDir"
        Log-PlatformAction "[DRY-RUN] Would backup configs, registry keys, and SQLite data."
        return
    }

    Log-PlatformAction "Creating backup staging folder..."
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

    # 2. Copy configurations
    Log-PlatformInfo "Backing up configurations..."
    $configDest = Join-Path $stagingDir "Config"
    New-Item -ItemType Directory -Path $configDest -Force | Out-Null
    
    $configSrc = Join-Path $PlatformRoot "configs"
    if (Test-Path $configSrc) {
        Copy-Item -Path (Join-Path $configSrc "*") -Destination $configDest -Recurse -Force
    }

    # 3. Export SCM/NSSM Service Registries
    Log-PlatformInfo "Exporting service registry keys..."
    $regDest = Join-Path $stagingDir "Registry"
    New-Item -ItemType Directory -Path $regDest -Force | Out-Null
    
    reg export "HKLM\SYSTEM\CurrentControlSet\Services\LiteLLMService\Parameters" (Join-Path $regDest "LiteLLMService_Parameters.reg") /y | Out-Null
    reg export "HKLM\SYSTEM\CurrentControlSet\Services\OpenClawService\Parameters" (Join-Path $regDest "OpenClawService_Parameters.reg") /y | Out-Null
    reg export "HKLM\SYSTEM\CurrentControlSet\Services\OmniRouteService\Parameters" (Join-Path $regDest "OmniRouteService_Parameters.reg") /y | Out-Null

    # 4. Copy SQLite Databases
    Log-PlatformInfo "Backing up databases..."
    $dbDest = Join-Path $stagingDir "Database"
    New-Item -ItemType Directory -Path $dbDest -Force | Out-Null
    
    $sqliteSrc = Join-Path $PlatformRoot "databases\sqlite"
    if (Test-Path $sqliteSrc) {
        Copy-Item -Path (Join-Path $sqliteSrc "*.sqlite") -Destination $dbDest -Force -ErrorAction SilentlyContinue
    }

    # 5. Compress Open-WebUI Volume
    Log-PlatformInfo "Compressing container volumes..."
    $openWebUiDir = Join-Path $PlatformRoot "docker\open-webui"
    if (Test-Path $openWebUiDir) {
        $zipOut = Join-Path $dbDest "open_webui_data.zip"
        Compress-Archive -Path (Join-Path $openWebUiDir "*") -DestinationPath $zipOut -Force
    }

    # 6. Create final zip package
    Log-PlatformAction "Creating final backup archive..."
    $zipPackage = Join-Path $backupsDir "$stagingName.zip"
    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPackage -Force
    
    Log-PlatformSuccess "Platform backup successfully compiled: $zipPackage"

} catch {
    Log-PlatformError "Platform backup operation crashed: $_"
} finally {
    # 7. Guaranteed clean-up of temporary staging directories
    if (Test-Path $stagingDir) {
        Log-PlatformInfo "Cleaning up temporary staging directory: $stagingDir"
        Remove-Item -Path $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Exit 0
