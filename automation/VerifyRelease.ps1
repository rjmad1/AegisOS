# VerifyRelease.ps1
# Release verification gate confirming SemVer compliance, changelog audits, unit tests, and calculating PRI/KMM.

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
Log-PlatformInfo "           Enterprise Release Governance Gate      "
Log-PlatformInfo "==================================================="

$rootDir = Split-Path $PSScriptRoot -Parent
$allPassed = $true

# Initialize Quality Scores
$priSemVer = 0
$priChangelog = 0
$priDocs = 0
$priTests = 0
$priQualification = 0

# 1. SemVer Format Validation
Log-PlatformInfo "Checking version compliance..."
$versionFile = Join-Path $rootDir "docs\VERSION"
$verText = "1.0.0"
if (Test-Path $versionFile) {
    $verText = (Get-Content -Path $versionFile -Raw).Trim()
    $semVerPattern = "^\d+\.\d+\.\d+$"
    
    if ($verText -match $semVerPattern) {
        Log-PlatformSuccess "Release version '$verText' complies with SemVer 2.0.0."
        $priSemVer = 10
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
if (-not (Test-Path $changelogFile)) {
    $changelogFile = Join-Path $rootDir "CHANGELOG.md"
}

if (Test-Path $changelogFile) {
    $content = Get-Content -Path $changelogFile -Raw
    if ($content -match $verText) {
        Log-PlatformSuccess "Changelog contains notes matching active release version '$verText'."
        $priChangelog = 10
    } else {
        Log-PlatformWarn "Changelog is missing release notes for version '$verText'."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "CHANGELOG.md file is missing."
    $allPassed = $false
}

# 3. Knowledge Maturity Model (KMM) Calculation
Log-PlatformInfo "Computing Knowledge Maturity Model (KMM) metrics..."
$kmmScore = 0
$adrDir = Join-Path $rootDir "adr"
$wikiGuide = Join-Path $rootDir "wiki\Install-Guide.md"
$archHandbook = Join-Path $rootDir "docs\Architecture_Handbook.md"

if (Test-Path $adrDir) {
    $adrCount = (Get-ChildItem $adrDir -Filter "*.md").Count
    if ($adrCount -gt 5) {
        $kmmScore += 30
        Log-PlatformSuccess "KMM: Verified $adrCount ADR documents in repository (+30%)"
    }
}
if (Test-Path $wikiGuide) {
    $kmmScore += 30
    Log-PlatformSuccess "KMM: Installation Guide verified in wiki (+30%)"
    $priDocs = 10
}
if (Test-Path $archHandbook) {
    $kmmScore += 40
    Log-PlatformSuccess "KMM: Architecture Handbook verified in docs (+40%)"
    $priDocs += 10
}

Log-PlatformInfo "Knowledge Maturity Model (KMM) Score: $kmmScore%"

# 4. Unit and Integration Test verification run
Log-PlatformInfo "Running Vitest validation gate..."
npx vitest run
$testStatus = $LASTEXITCODE

if ($testStatus -eq 0) {
    Log-PlatformSuccess "All vitest tests compiled and passed successfully."
    $priTests = 30
} else {
    Log-PlatformWarn "Release gate failed. Vitest reported failed tests."
    $allPassed = $false
}

# 5. Qualification Gate (Verification of Validate.ps1 execution)
Log-PlatformInfo "Running Qualification verification check..."
$validateScript = Join-Path $PSScriptRoot "Validate.ps1"
if (Test-Path $validateScript) {
    & $validateScript
    if ($LASTEXITCODE -eq 0) {
        $priQualification = 30
        Log-PlatformSuccess "Qualification Framework gate: PASS (+30%)"
    } else {
        Log-PlatformWarn "Qualification Framework gate: WARNING/FAIL"
    }
}

# Compute Platform Readiness Index (PRI)
$priTotal = $priSemVer + $priChangelog + $priDocs + $priTests + $priQualification
Log-PlatformInfo "Platform Readiness Index (PRI): $priTotal%"

# Write Release Report
$reportPath = Join-Path $rootDir "databases\release-readiness-report.json"
$report = @{
    timestamp = (Get-Date -Format "o")
    version = $verText
    allPassed = $allPassed
    metrics = @{
        platformReadinessIndex = $priTotal
        knowledgeMaturityModel = $kmmScore
    }
    details = @{
        semVerValid = ($priSemVer -gt 0)
        changelogAligned = ($priChangelog -gt 0)
        testsPassed = ($priTests -gt 0)
        qualificationPassed = ($priQualification -gt 0)
    }
} | ConvertTo-Json

if (-not (Test-Path (Join-Path $rootDir "databases"))) {
    New-Item -ItemType Directory -Path (Join-Path $rootDir "databases") -Force | Out-Null
}
$report | Out-File $reportPath -Force -Encoding utf8
Log-PlatformSuccess "Release Readiness Report written to: $reportPath"

if ($allPassed -and $priTotal -ge 80) {
    Log-PlatformSuccess "Release Governance Gate: PASS. Platform Readiness Index satisfies gate threshold."
    Exit 0
} else {
    Log-PlatformWarn "Release Governance Gate: FAILED. Check quality index scores."
    Exit 1
}
