<#
.SYNOPSIS
    Version-aware upgrade script for AegisOS PEMF.
    Validates migration paths using PlatformEvolutionGraph.json, executes backups, updates services, and handles rollback.
#>
param(
    [string]$TargetVersion = "1.2.0",
    [switch]$BackupBeforeUpgrade,
    [string]$PlatformRoot = "D:\AIPlatform",
    [switch]$DryRun
)

# Import shared helper
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  Platform Evolution & Upgrade Manager (PEMF)      "
Log-PlatformInfo "==================================================="

# 1. Privileges check
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# 2. Load Evolution Graph & Validate Path
$graphPath = Join-Path $PSScriptRoot "..\configs\PlatformEvolutionGraph.json"
$currentVersion = "1.0.0"

# Read current version from package.json
$pkgJsonPath = Join-Path $PSScriptRoot "..\package.json"
if (Test-Path $pkgJsonPath) {
    $pkg = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
    $currentVersion = $pkg.version
}

Log-PlatformInfo "Current platform version: $currentVersion"
Log-PlatformInfo "Target upgrade version: $TargetVersion"

if (Test-Path $graphPath) {
    $graph = Get-Content $graphPath -Raw | ConvertFrom-Json
    $verData = $graph.versions.$currentVersion
    if ($null -ne $verData) {
        $allowed = $verData.allowedUpgradePaths
        if ($allowed -notcontains $TargetVersion -and $currentVersion -ne $TargetVersion) {
            Log-PlatformWarn "WARNING: Path from $currentVersion to $TargetVersion is not verified in Evolution Graph!"
        }
    }
}

# 3. Database Backup
$dbPath = Join-Path $PlatformRoot "databases\dev.db"
$backupPath = Join-Path $PlatformRoot "databases\dev_db_backup_pre_upgrade.db"

if (Test-Path $dbPath) {
    Log-PlatformAction "Creating database pre-upgrade snapshot..."
    if (-not $DryRun) {
        Copy-Item $dbPath -Destination $backupPath -Force
        Log-PlatformSuccess "Database snapshot written to: $backupPath"
      }
}

# 4. Execute Upgrades & Migrations
Log-PlatformAction "Syncing database schema migrations..."
if (-not $DryRun) {
    $env:DATABASE_URL="file:./databases/dev.db"
    & npx prisma migrate deploy 2>&1
    $migrationExit = $LASTEXITCODE

    if ($migrationExit -ne 0) {
        Log-PlatformWarn "Standard migration failed. Attempting schema push..."
        & npx prisma db push --skip-generate 2>&1
        $migrationExit = $LASTEXITCODE
    }

    if ($migrationExit -eq 0) {
        Log-PlatformSuccess "Database schema evolution completed successfully."
    } else {
        Log-PlatformError "CRITICAL: Schema migration failed! Initiating rollback..."
        if (Test-Path $backupPath) {
            Copy-Item $backupPath -Destination $dbPath -Force
            Log-PlatformWarn "Database state rolled back to pre-upgrade snapshot."
        }
        Exit 1
    }
}

# 5. Restart Runtimes to Refresh Caches
Log-PlatformAction "Restarting platform runtime services..."
$services = @("AegisOSService", "LiteLLMService", "Ollama")
foreach ($s in $services) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        if (-not $DryRun) {
            Log-PlatformInfo "Restarting service: $s"
            Restart-Service -Name $s -Force -ErrorAction SilentlyContinue
        }
    }
}

Log-PlatformSuccess "Platform evolution mission executed successfully."
Exit 0
