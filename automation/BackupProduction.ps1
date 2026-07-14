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
    
    $services = @("AI_Console_Service", "LiteLLMService", "AegisOSService", "OmniRouteService")
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

    # 4.5 PostgreSQL Schema & Data Backup
    $dbUrl = $env:DATABASE_URL
    if ($dbUrl -and $dbUrl.StartsWith("postgresql://")) {
        Log-PlatformInfo "Detecting PostgreSQL database. Preparing pg_dump..."
        try {
            if ($dbUrl -match "postgresql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)") {
                $pgUser = $Matches[1]
                $pgPass = $Matches[2]
                $pgHost = $Matches[3]
                $pgPort = if ($Matches[4]) { $Matches[4] } else { "5432" }
                $pgDb = $Matches[5]

                $pgDumpPath = "pg_dump.exe"
                if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
                    $progFiles = $env:ProgramFiles
                    $pgDumps = Get-ChildItem -Path "$progFiles\PostgreSQL" -Filter "pg_dump.exe" -Recurse -ErrorAction SilentlyContinue
                    if ($pgDumps) { $pgDumpPath = $pgDumps[0].FullName }
                }

                $env:PGPASSWORD = $pgPass
                $dumpFile = Join-Path $dbDest "postgres_backup.sql"
                Log-PlatformInfo "Dumping database $pgDb from host $pgHost to $dumpFile..."
                & $pgDumpPath -h $pgHost -p $pgPort -U $pgUser -F p -b -v -f $dumpFile $pgDb 2>&1 | Out-Null
                Remove-Item Env:\PGPASSWORD
                Log-PlatformSuccess "PostgreSQL database dump created."
            }
        } catch {
            Log-PlatformWarn "PostgreSQL backup failed: $_"
        }
    }

    # 5. Copy Knowledge & Metadata assets
    Log-PlatformInfo "Backing up knowledge context files..."
    $knowledgeSrc = Join-Path (Get-PlatformRoot $null) "knowledge"
    if (Test-Path $knowledgeSrc) {
        $knowledgeDest = Join-Path $stagingDir "knowledge"
        New-Item -ItemType Directory -Path $knowledgeDest -Force | Out-Null
        Copy-Item -Path (Join-Path $knowledgeSrc "*") -Destination $knowledgeDest -Recurse -Force
    }

    # 5.5 Backup MinIO Volume (if Docker is running)
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Log-PlatformInfo "Detecting MinIO Docker container. Backing up volume..."
        try {
            $minioCheck = & docker ps --filter "name=aegisos-minio" --format "{{.Names}}"
            if ($minioCheck -eq "aegisos-minio") {
                $minioDest = Join-Path $stagingDir "minio_data"
                New-Item -ItemType Directory -Path $minioDest -Force | Out-Null
                Log-PlatformInfo "Copying minio volume contents to $minioDest..."
                & docker run --rm -v aegisos_minio_data:/data -v ${minioDest}:/backup alpine tar czf /backup/minio_data.tar.gz -C /data . | Out-Null
                Log-PlatformSuccess "MinIO data volume successfully backed up."
            }
        } catch {
            Log-PlatformWarn "MinIO volume backup failed: $_"
        }
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
