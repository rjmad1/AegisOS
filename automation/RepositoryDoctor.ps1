# RepositoryDoctor.ps1
# Onboarding health check and environment diagnostics script.

# Import helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
if (Test-Path $HelperModule) {
    Import-Module $HelperModule -Force
} else {
    function Log-PlatformInfo($msg) { Write-Host "[INFO] $msg" }
    function Log-PlatformWarn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
    function Log-PlatformSuccess($msg) { Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
    function Log-PlatformError($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
}

Log-PlatformInfo "==================================================="
Log-PlatformInfo "         OpenClaw Workstation Console Doctor       "
Log-PlatformInfo "==================================================="

$allPassed = $true

# 1. Check Node.js Version
Log-PlatformInfo "Verifying Node.js environment..."
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Log-PlatformSuccess "Found Node.js version: $nodeVer"
    
    if ($nodeVer -match "v(\d+)") {
        $major = [int]$Matches[1]
        if ($major -lt 20) {
            Log-PlatformWarn "Node.js version is below v20 ($nodeVer). Recommended: v20 or higher."
            $allPassed = $false
        }
    }
} else {
    Log-PlatformError "Node.js is missing from system PATH!"
    $allPassed = $false
}

# 2. Check Env files
Log-PlatformInfo "Verifying environment configuration files..."
$rootDir = Split-Path $PSScriptRoot -Parent
$envLocal = Join-Path $rootDir ".env.local"
$envProd = Join-Path $rootDir ".env.production"

if (Test-Path $envLocal) {
    Log-PlatformSuccess ".env.local exists."
} else {
    Log-PlatformWarn ".env.local is missing."
    $allPassed = $false
}

if (Test-Path $envProd) {
    Log-PlatformSuccess ".env.production exists."
} else {
    Log-PlatformWarn ".env.production is missing."
    $allPassed = $false
}

# 3. Check SQLite database connection and Prisma
Log-PlatformInfo "Validating Prisma schema and database connection..."

function Load-EnvFile([string]$path) {
    if (Test-Path $path) {
        Get-Content -LiteralPath $path | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
            $parts = $_ -split '=', 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $val, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

if (Test-Path $envLocal) {
    Load-EnvFile $envLocal
} elseif (Test-Path $envProd) {
    Load-EnvFile $envProd
}

if (Get-Command npx -ErrorAction SilentlyContinue) {
    npx prisma validate 2>$null
    if ($LASTEXITCODE -eq 0) {
        Log-PlatformSuccess "Prisma schema validated successfully."
    } else {
        Log-PlatformWarn "Prisma schema validation failed. Run 'npx prisma db pull' or check configuration."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "npx CLI is missing. Cannot check Prisma schema."
    $allPassed = $false
}

# 4. Trigger Self-Healing diagnostics check
Log-PlatformInfo "Invoking health diagnostics..."
$validateScript = Join-Path $PSScriptRoot "Validate.ps1"
if (Test-Path $validateScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $validateScript
    if ($LASTEXITCODE -eq 0) {
        Log-PlatformSuccess "Self-healing diagnostics passed."
    } else {
        Log-PlatformWarn "Self-healing diagnostics reported service failures/warnings."
    }
}

if ($allPassed) {
    Log-PlatformSuccess "Doctor: Workstation environment is fully configured and ready! (PASS)"
    Exit 0
} else {
    Log-PlatformWarn "Doctor: Found workstation configuration warnings or missing dependencies. (WARN)"
    Exit 1
}
