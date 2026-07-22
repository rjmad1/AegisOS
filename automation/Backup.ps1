<#
.SYNOPSIS
    Compiles and bundles configurations, databases, registry exports under EMO Lifecycle Mission guidelines.
    Obeys retention policies defined in enterprise-policies.json.
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
Log-PlatformInfo "  Platform Lifecycle Backup Engine (PLMF)          "
Log-PlatformInfo "==================================================="

if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# Load Enterprise Policies
$policiesPath = Join-Path $PSScriptRoot "..\configs\enterprise-policies.json"
$retentionCount = 10
if (Test-Path $policiesPath) {
    $policies = Get-Content $policiesPath -Raw | ConvertFrom-Json
    if ($null -ne $policies.policies.backups.retentionCount) {
        $retentionCount = $policies.policies.backups.retentionCount
    }
}

Log-PlatformInfo "Backup Retention Policy count set to: $retentionCount"

$backupsDir = Join-Path $PlatformRoot "backups"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$stagingName = "Backup_$timestamp"
$stagingDir = Join-Path $backupsDir $stagingName

if (-not (Test-Path $backupsDir) -and -not $DryRun) {
    New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
}

try {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would staging backup in: $stagingDir"
        return
    }

    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

    # 1. Config backup
    Log-PlatformInfo "Backing up configurations..."
    $configDest = Join-Path $stagingDir "Config"
    New-Item -ItemType Directory -Path $configDest -Force | Out-Null
    $configSrc = Join-Path $PlatformRoot "configs"
    if (Test-Path $configSrc) {
        Copy-Item -Path (Join-Path $configSrc "*") -Destination $configDest -Recurse -Force
    }

    # 2. Database backup
    Log-PlatformInfo "Backing up databases..."
    $dbDest = Join-Path $stagingDir "Database"
    New-Item -ItemType Directory -Path $dbDest -Force | Out-Null
    $dbSrc = Join-Path $PlatformRoot "databases"
    if (Test-Path $dbSrc) {
        Copy-Item -Path (Join-Path $dbSrc "*") -Destination $dbDest -Recurse -Force -ErrorAction SilentlyContinue
    }

    # 3. Zip package
    $zipPackage = Join-Path $backupsDir "$stagingName.zip"
    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPackage -Force
    Remove-Item $stagingDir -Recurse -Force
    Log-PlatformSuccess "Lifecycle Backup generated successfully: $zipPackage"

    # 4. Retention Management
    Log-PlatformAction "Executing backup retention cleanup..."
    $zipFiles = Get-ChildItem -Path $backupsDir -Filter "*.zip" | Sort-Object CreationTime -Descending
    if ($zipFiles.Count -gt $retentionCount) {
        $filesToDelete = $zipFiles | Select-Object -Skip $retentionCount
        foreach ($f in $filesToDelete) {
            Log-PlatformInfo "Deleting expired backup archive: $($f.Name)"
            Remove-Item $f.FullName -Force
        }
    }
} catch {
    Log-PlatformError "Failed to compile backup: $_"
    Exit 1
}

Exit 0
