# DeployProduction.ps1
# Production Deployment Automation Script for AI Operations Console.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
if (-not (Test-Path $HelperModule)) {
    Write-Error "[ERROR] Platform Helper module is missing!"
    Exit 1
}
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "   AI Operations Console Production Deployer       "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$TargetRoot = "D:\AI-Operations"
$SourceDir = $PSScriptRoot | Split-Path

Log-PlatformAction "Establishing directory layout at $TargetRoot..."
$folders = @(
    "app", "config", "logs", "backups", "artifacts", 
    "cache", "temp", "runtime", "runtime\databases", 
    "uploads", "exports", "certificates"
)

foreach ($f in $folders) {
    $fullPath = Join-Path $TargetRoot $f
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Log-PlatformInfo "Created folder: $fullPath"
    }
}

# 2. Build Next.js console
Log-PlatformAction "Compiling Next.js application for production..."
& npm run build
if ($LASTEXITCODE -ne 0) {
    Log-PlatformError "Next.js compilation failed! Aborting deployment."
    Exit 1
}

# 3. Synchronize compiled app files to Target Directory
Log-PlatformAction "Synchronizing application code to $TargetRoot\app..."
$excludeList = @(".git", ".github", "databases", "artifacts_storage", "backups", "logs", "node_modules")
$rsyncArgs = @(
    $SourceDir,
    (Join-Path $TargetRoot "app"),
    "/mir",
    "/xd"
) + $excludeList + @("/ndl", "/nfl", "/njh", "/njs")

robocopy.exe @rsyncArgs
if ($LASTEXITCODE -gt 8) {
    Log-PlatformError "Robocopy synchronisation failed with exit code $LASTEXITCODE."
    Exit 1
}

# Copy node_modules using robocopy to avoid lockups and speed up process
Log-PlatformAction "Copying node dependencies (this may take a minute)..."
robocopy.exe (Join-Path $SourceDir "node_modules") (Join-Path $TargetRoot "app\node_modules") /mir /xd .bin /ndl /nfl /njh /njs /mt:32
if ($LASTEXITCODE -gt 8) {
    Log-PlatformWarn "Robocopy dependencies copy returned exit code $LASTEXITCODE."
}

# 4. Copy configurations
Log-PlatformAction "Establishing production configuration files..."
$envProdSrc = Join-Path $SourceDir ".env.production"
$envProdDest1 = Join-Path $TargetRoot "config\.env.production"
$envProdDest2 = Join-Path $TargetRoot "app\.env.production"

Copy-Item $envProdSrc $envProdDest1 -Force
Copy-Item $envProdSrc $envProdDest2 -Force

$caddyfileSrc = Join-Path $SourceDir "Caddyfile"
$caddyfileDest = Join-Path $TargetRoot "config\Caddyfile"
Copy-Item $caddyfileSrc $caddyfileDest -Force

Log-PlatformSuccess "Configurations compiled and localized."

# 5. Check and install Caddy Server via winget
Log-PlatformAction "Checking reverse proxy installation..."
$caddyPath = & where.exe caddy.exe 2>$null
if (-not $caddyPath) {
    Log-PlatformAction "Caddy is missing. Installing via winget..."
    Start-Process -FilePath "winget" -ArgumentList "install", "CaddyServer.Caddy", "--silent", "--accept-package-agreements", "--accept-source-agreements" -Wait -NoNewWindow
    $caddyPath = & where.exe caddy.exe 2>$null
    if (-not $caddyPath) {
        # Fallback search path in chocolatey/scoop bin dirs
        if (Test-Path "C:\ProgramData\chocolatey\bin\caddy.exe") {
            $caddyPath = "C:\ProgramData\chocolatey\bin\caddy.exe"
        }
    }
}

if ($caddyPath) {
    Log-PlatformSuccess "Caddy reverse proxy available at: $caddyPath"
} else {
    Log-PlatformWarn "Caddy was not found. Please install caddy manually."
}

# 6. Stop running console services if they exist to release file locks
Log-PlatformAction "Suspending existing services..."
$services = @("AI_Console_Service", "caddy")
foreach ($s in $services) {
    $existing = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($existing -and $existing.Status -eq "Running") {
        Stop-Service -Name $s -Force -WarningAction SilentlyContinue
        Log-PlatformInfo "Stopped service: $s"
    }
}

# 7. Register/Patch Next.js service via NSSM
Log-PlatformAction "Registering Next.js console service in SCM..."
$nodePath = & where.exe node.exe 2>$null
if ($nodePath -is [array]) { $nodePath = $nodePath[0] }
$nssmPath = "C:\ProgramData\chocolatey\bin\nssm.exe"

if (-not (Test-Path $nssmPath)) {
    # Fallback to winget or PATH
    $nssmPath = & where.exe nssm.exe 2>$null
    if ($nssmPath -is [array]) { $nssmPath = $nssmPath[0] }
}

if (Test-Path $nssmPath) {
    $svcName = "AI_Console_Service"
    $existingSvc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if (-not $existingSvc) {
        & $nssmPath install $svcName $nodePath "node_modules\next\dist\bin\next start"
        Log-PlatformSuccess "Service $svcName registered via NSSM."
    }

    # Set service properties
    & $nssmPath set $svcName AppDirectory (Join-Path $TargetRoot "app")
    & $nssmPath set $svcName AppStdout (Join-Path $TargetRoot "logs\console.log")
    & $nssmPath set $svcName AppStderr (Join-Path $TargetRoot "logs\console_error.log")
    & $nssmPath set $svcName AppRotateFiles 1
    & $nssmPath set $svcName AppRotateOnline 1
    & $nssmPath set $svcName AppRotateSeconds 86400
    & $nssmPath set $svcName AppRotateBytes 10485760 # 10MB
    & $nssmPath set $svcName Start SERVICE_AUTO_START
    Log-PlatformInfo "NSSM parameters successfully configured."
} else {
    Log-PlatformError "NSSM not found. Could not configure Next.js service."
}

# 8. Register/Configure Caddy service
if ($caddyPath) {
    Log-PlatformAction "Registering Caddy HTTPS service..."
    $caddySvc = Get-Service -Name "caddy" -ErrorAction SilentlyContinue
    if (-not $caddySvc) {
        # Register Caddy native service
        & $caddyPath service install --config $caddyfileDest
        Log-PlatformSuccess "Caddy registered as a native Windows service."
    } else {
        # Update config path in registry if needed, or re-install
        & $caddyPath service uninstall 2>$null | Out-Null
        & $caddyPath service install --config $caddyfileDest
        Log-PlatformSuccess "Caddy service configuration refreshed."
    }
}

# 9. Start Services
Log-PlatformAction "Starting production gateway services..."
Start-Service -Name "AI_Console_Service" -ErrorAction SilentlyContinue
if ($caddyPath) {
    Start-Service -Name "caddy" -ErrorAction SilentlyContinue
}

Log-PlatformSuccess "Deployment completed successfully! The Operations Console is active."
Log-PlatformInfo "LAN Access URL: https://localhost:8443"
Exit 0
