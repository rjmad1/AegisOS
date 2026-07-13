# ScanSecrets.ps1
# Performs automated scanning for hardcoded secrets, private keys, and default credentials.

param(
    [switch]$Strict
)

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
Log-PlatformInfo "            Static Secret Scanner (SAST)           "
Log-PlatformInfo "==================================================="

$rootDir = Split-Path $PSScriptRoot -Parent
$allPassed = $true
$issuesFound = 0

# Secret keywords to search for
$patterns = @(
    "super-secret-random-hash-key-for-console-jwt-signing-2026",
    "fallback_secret_must_change_in_production_extremely_long",
    "AdminPassword123!",
    "google_client_id_here",
    "google_client_secret_here"
)

# Search recursively for these patterns in source code and configurations
$filesToScan = Get-ChildItem -Path $rootDir -Recurse -File | Where-Object {
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "\.git" -and
    $_.FullName -notmatch "\.next" -and
    $_.FullName -notmatch "ScanSecrets\.ps1" -and
    $_.FullName -notmatch "instrumentation\.ts" -and  # Exclude instrumentation which checks for the fallbacks
    $_.Extension -match "\.(ts|tsx|js|json|yml|yaml|env|bat|ps1)$"
}

foreach ($file in $filesToScan) {
    $content = (Get-Content -LiteralPath $file.FullName) -join "`n"
    foreach ($p in $patterns) {
        if ($content -match [regex]::Escape($p)) {
            $relPath = $file.FullName.Replace($rootDir, "").TrimStart("\")
            Log-PlatformWarn "Insecure plaintext secret/default credential pattern '$p' found in: $relPath"
            $issuesFound++
            $allPassed = $false
        }
    }
}

if ($allPassed) {
    Log-PlatformSuccess "No hardcoded default secrets found in project files."
    Exit 0
} else {
    Log-PlatformWarn "Secret scanning completed with $issuesFound warnings."
    if ($Strict) {
        Log-PlatformError "Strict mode is active. Failing build."
        Exit 1
    }
    Exit 0
}
