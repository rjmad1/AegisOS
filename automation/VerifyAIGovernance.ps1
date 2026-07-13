# VerifyAIGovernance.ps1
# Runs prompt validation, format adherence, and hallucination regression checks.

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
Log-PlatformInfo "            AI Governance Test Runner              "
Log-PlatformInfo "==================================================="

Log-PlatformInfo "Executing Golden Prompt and Grounding Verification Suite..."
npx vitest run evaluation.test.ts
$status = $LASTEXITCODE

if ($status -eq 0) {
    Log-PlatformSuccess "AI Governance tests passed: Golden Prompts conform and grounding checks are compliant."
    Exit 0
} else {
    Log-PlatformWarn "AI Governance verification failed. Regression detected."
    Exit 1
}
