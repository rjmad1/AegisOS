# RestoreProduction.ps1
# Production Recovery & Restoration Orchestrator for AI Workstation.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,

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
Log-PlatformInfo "   AI Workstation Production Restore Engine        "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

if (-not (Test-Path $BackupPath)) {
    Log-PlatformError "Specified backup archive not found: $BackupPath"
    Exit 1
}

$tempExtractDir = Join-Path $env:TEMP "RestoreProductionStaging_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

try {
    Log-PlatformAction "Unpacking backup archive to staging: $tempExtractDir..."
    New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null
    Expand-Archive -Path $BackupPath -DestinationPath $tempExtractDir -Force

    # 2. Stop running services to release file locks
    Log-PlatformAction "Suspending running services..."
    $services = @("caddy", "AI_Console_Service", "OmniRouteService", "AegisOSService", "LiteLLMService", "Ollama")
    foreach ($s in $services) {
        $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq "Running") {
            Stop-Service -Name $s -Force -WarningAction SilentlyContinue
            Log-PlatformInfo "Stopped: $s"
        }
    }

    # 3. Restore Configurations
    $configBackup = Join-Path $tempExtractDir "Config"
    $configTarget = Join-Path $TargetRoot "config"
    if (Test-Path $configBackup) {
        Log-PlatformInfo "Restoring configurations..."
        Copy-Item -Path (Join-Path $configBackup "*") -Destination $configTarget -Force
        # Sync with Next.js environment file
        if (Test-Path (Join-Path $configTarget ".env.production")) {
            Copy-Item (Join-Path $configTarget ".env.production") (Join-Path $TargetRoot "app\.env.production") -Force
        }
    }

    # 4. Restore Service parameters via Registry Import
    $regBackup = Join-Path $tempExtractDir "Registry"
    if (Test-Path $regBackup) {
        Log-PlatformInfo "Importing service parameters into Windows Registry..."
        $regFiles = Get-ChildItem -Path $regBackup -Filter "*.reg"
        foreach ($rf in $regFiles) {
            Log-PlatformInfo "Importing registry keys from: $($rf.Name)"
            reg import $rf.FullName 2>$null | Out-Null
        }
    }

    # 5. Restore Databases
    $dbBackup = Join-Path $tempExtractDir "Database"
    $dbTarget = Join-Path $TargetRoot "runtime\databases"
    if (Test-Path $dbBackup) {
        Log-PlatformInfo "Restoring SQLite and JSON databases..."
        if (-not (Test-Path $dbTarget)) { New-Item -ItemType Directory -Path $dbTarget -Force | Out-Null }
        Copy-Item -Path (Join-Path $dbBackup "*") -Destination $dbTarget -Exclude "postgres_backup.sql" -Force
        
        # 5.5 PostgreSQL Restore
        $pgBackup = Join-Path $dbBackup "postgres_backup.sql"
        if (Test-Path $pgBackup) {
            $dbUrl = $env:DATABASE_URL
            if ($dbUrl -and $dbUrl.StartsWith("postgresql://")) {
                Log-PlatformInfo "Detecting PostgreSQL destination. Preparing psql restore..."
                try {
                    if ($dbUrl -match "postgresql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)") {
                        $pgUser = $Matches[1]
                        $pgPass = $Matches[2]
                        $pgHost = $Matches[3]
                        $pgPort = if ($Matches[4]) { $Matches[4] } else { "5432" }
                        $pgDb = $Matches[5]

                        $psqlPath = "psql.exe"
                        if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
                            $progFiles = $env:ProgramFiles
                            $pgBins = Get-ChildItem -Path "$progFiles\PostgreSQL" -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue
                            if ($pgBins) { $psqlPath = $pgBins[0].FullName }
                        }

                        $env:PGPASSWORD = $pgPass
                        Log-PlatformInfo "Executing restore of $pgDb on $pgHost..."
                        & $psqlPath -h $pgHost -p $pgPort -U $pgUser -d $pgDb -f $pgBackup 2>&1 | Out-Null
                        Remove-Item Env:\PGPASSWORD
                        Log-PlatformSuccess "PostgreSQL database successfully restored."
                    }
                } catch {
                    Log-PlatformWarn "PostgreSQL restore failed: $_"
                }
            }
        }
    }

    # 6. Restore Knowledge Context files
    $knowledgeBackup = Join-Path $tempExtractDir "knowledge"
    $knowledgeTarget = Join-Path (Get-PlatformRoot $null) "knowledge"
    if (Test-Path $knowledgeBackup) {
        Log-PlatformInfo "Restoring knowledge files..."
        if (-not (Test-Path $knowledgeTarget)) { New-Item -ItemType Directory -Path $knowledgeTarget -Force | Out-Null }
        Copy-Item -Path (Join-Path $knowledgeBackup "*") -Destination $knowledgeTarget -Recurse -Force
    }

    # 7. Restore Artifacts
    $artifactsBackup = Join-Path $tempExtractDir "artifacts"
    $artifactsTarget = Join-Path $TargetRoot "artifacts"
    if (Test-Path $artifactsBackup) {
        Log-PlatformInfo "Restoring artifacts storage..."
        if (-not (Test-Path $artifactsTarget)) { New-Item -ItemType Directory -Path $artifactsTarget -Force | Out-Null }
        Copy-Item -Path (Join-Path $artifactsBackup "*") -Destination $artifactsTarget -Recurse -Force
    }

    # 7.5 Restore MinIO volume (if Docker is running and archive exists)
    $minioBackup = Join-Path $tempExtractDir "minio_data"
    $minioTar = Join-Path $minioBackup "minio_data.tar.gz"
    if ((Test-Path $minioTar) -and (Get-Command docker -ErrorAction SilentlyContinue)) {
        Log-PlatformInfo "Restoring MinIO Docker volume..."
        try {
            $minioCheck = & docker ps -a --filter "name=aegisos-minio" --format "{{.Names}}"
            if ($minioCheck -eq "aegisos-minio") {
                Log-PlatformInfo "Extracting MinIO backup into docker volume..."
                & docker run --rm -v aegisos_minio_data:/data -v ${minioBackup}:/backup alpine sh -c "rm -rf /data/* && rm -rf /data/.* 2>/dev/null; tar xzf /backup/minio_data.tar.gz -C /data" | Out-Null
                Log-PlatformSuccess "MinIO data volume successfully restored."
            }
        } catch {
            Log-PlatformWarn "MinIO volume restore failed: $_"
        }
    }

    # 8. Start Services
    Log-PlatformAction "Restarting services..."
    # Startup order
    $startOrder = @("Ollama", "LiteLLMService", "AegisOSService", "OmniRouteService", "AI_Console_Service", "caddy")
    foreach ($s in $startOrder) {
        $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
        if ($svc) {
            Start-Service -Name $s -ErrorAction SilentlyContinue
            Log-PlatformInfo "Started: $s"
        }
    }

    Log-PlatformSuccess "Restore operation finished successfully. Services are active."

} catch {
    Log-PlatformError "Restore operation crashed: $_"
} finally {
    if (Test-Path $tempExtractDir) {
        Log-PlatformInfo "Cleaning up temporary staging area..."
        Remove-Item -Path $tempExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Exit 0
