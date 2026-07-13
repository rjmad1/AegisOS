# VerifyRelease.ps1
# Release verification gate confirming SemVer compliance, changelog audits, and unit testing runs.

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
Log-PlatformInfo "           Enterprise Release Quality Gate         "
Log-PlatformInfo "==================================================="

$rootDir = Split-Path $PSScriptRoot -Parent
$allPassed = $true

# 1. SemVer Format Validation
Log-PlatformInfo "Checking version compliance..."
$versionFile = Join-Path $rootDir "docs\VERSION"
if (Test-Path $versionFile) {
    $verText = (Get-Content -Path $versionFile).Trim()
    $semVerPattern = "^\d+\.\d+\.\d+$"
    
    if ($verText -match $semVerPattern) {
        Log-PlatformSuccess "Release version '$verText' complies with SemVer 2.0.0."
    } else {
        Log-PlatformWarn "Release version '$verText' violates SemVer formatting! (Expected major.minor.patch)"
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "docs/VERSION file is missing."
    $allPassed = $false
}

# 2. Changelog Alignment Check
Log-PlatformInfo "Verifying Changelog registry..."
$changelogFile = Join-Path $rootDir "docs\CHANGELOG.md"
if (Test-Path $changelogFile) {
    $content = Get-Content -Path $changelogFile -Raw
    if ($content -match $verText) {
        Log-PlatformSuccess "Changelog contains notes matching active release version '$verText'."
    } else {
        Log-PlatformWarn "Changelog is missing release notes for version '$verText'."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "docs/CHANGELOG.md file is missing."
    $allPassed = $false
}

# 3. Unit and Integration Test verification run
Log-PlatformInfo "Running vitest validation gate..."
npx vitest run
$testStatus = $LASTEXITCODE

if ($testStatus -eq 0) {
    Log-PlatformSuccess "All vitest tests compiled and passed successfully."
} else {
    Log-PlatformWarn "Release gate failed. Vitest reported failed tests."
    $allPassed = $false
}

if ($allPassed) {
    Log-PlatformSuccess "Release Verification Gate: PASS. Ready for distribution packaging."
    Exit 0
} else {
    Log-PlatformWarn "Release Verification Gate: FAILED. Fix the violations above."
    Exit 1
}
