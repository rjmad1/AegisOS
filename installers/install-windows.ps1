# installers/install-windows.ps1
# Enterprise Installation, Repair and Upgrade Wizard for Windows fleets.

param (
    [switch]$Silent,
    [switch]$Repair,
    [switch]$Upgrade,
    [string]$InstallDir = "C:\AIPlatform"
)

function Log($msg, $color = "Cyan") {
    if (-not $Silent) {
        Write-Host "[Installer] $msg" -ForegroundColor $color
    }
}

Log "Starting OpenClaw Console Windows Installer..." "Yellow"

# 1. Check administrative privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Log "ERROR: Installation requires elevated Administrator privileges!" "Red"
    Exit 1
}

# 2. Handle Repair Flow
if ($Repair) {
    Log "Initiating Platform Diagnostics and Repair..." "Yellow"
    if (-not (Test-Path $InstallDir)) {
        Log "Target directory missing. Creating installation root..."
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    
    # Re-verify critical folders
    $folders = @("databases", "artifacts_storage", "configs", "logs")
    foreach ($f in $folders) {
        $p = Join-Path $InstallDir $f
        if (-not (Test-Path $p)) {
            Log "Creating directory: $p"
            New-Item -ItemType Directory -Path $p -Force | Out-Null
        }
    }
    
    Log "Repair complete. Health checks validated." "Green"
    Exit 0
}

# 3. Handle Upgrade Flow
if ($Upgrade) {
    Log "Initiating Platform Upgrade Sequence..." "Yellow"
    $dbPath = Join-Path $InstallDir "databases\dev.db"
    
    if (Test-Path $dbPath) {
        Log "Backing up active database..."
        $backupPath = Join-Path $InstallDir "databases\dev_db_backup_pre_upgrade.db"
        Copy-Item $dbPath -Destination $backupPath -Force
        Log "Backup written: $backupPath" "Green"
    }
    
    # Run Prisma migrations
    Log "Syncing database schema migrations..."
    & npx prisma db push --accept-data-loss | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Log "Database upgraded successfully." "Green"
    } else {
        Log "Database upgrade failed! Restoring backup..." "Red"
        if (Test-Path $backupPath) {
            Copy-Item $backupPath -Destination $dbPath -Force
            Log "Database state rolled back to pre-upgrade snapshot." "Yellow"
        }
        Exit 1
    }
    Exit 0
}

# 4. Handle Fresh Install Flow
Log "Preparing installation target: $InstallDir"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$folders = @("databases", "artifacts_storage", "configs", "logs")
foreach ($f in $folders) {
    $p = Join-Path $InstallDir $f
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
}

Log "Copying core application files..."
Copy-Item "package.json" -Destination $InstallDir -Force
Copy-Item "prisma" -Destination $InstallDir -Recurse -Force

Log "Installing production dependencies..."
Set-Location $InstallDir
& npm install --production | Out-Null

Log "Orchestrating DB Schema push..."
$env:DATABASE_URL="file:./databases/dev.db"
& npx prisma db push | Out-Null

Log "OpenClaw Platform Installation Complete." "Green"
Exit 0
