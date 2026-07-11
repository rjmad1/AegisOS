# Bootstrap.ps1
# Interactive Installation Wizard for local AI Workstation.
# MUST BE RUN IN AN ELEVATED POWERSHELL SESSION.

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "automation\libs\PlatformHelper.psm1"
if (-not (Test-Path $HelperModule)) {
    Write-Error "[ERROR] Platform Helper module is missing from automation/libs/PlatformHelper.psm1!"
    Exit 1
}
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "      AI Workstation Platform Bootstrap Wizard     "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

# 2. Greeting and Profile Selection
Write-Host ""
Write-Host "This wizard will install and configure your local AI inference and agent workstation." -ForegroundColor White
Write-Host ""

Log-PlatformAction "Select Deployment Profile:"
Write-Host "1) development (Lightweight local stubs, local models sync, drive C: default)"
Write-Host "2) personal    (Standard agent gateway settings, local models sync, drive D: default)"
Write-Host "3) enterprise  (Full LAN connectivity, advanced coding/reasoning models, drive D: default)"
Write-Host "4) offline     (Air-gapped deployment, skips automated model pulls)"
Write-Host ""
$profileInput = Read-Host "Choose profile [1-4, default: 1]"

$profileName = "development"
switch ($profileInput) {
    "2" { $profileName = "personal" }
    "3" { $profileName = "enterprise" }
    "4" { $profileName = "offline" }
}

Log-PlatformSuccess "Selected profile: $profileName"

# 3. Platform Root selection
$drives = Get-PlatformDriveDetails
$hasD = $false
foreach ($d in $drives) {
    if ($d.DriveLetter -eq "D:") { $hasD = $true }
}

$defaultRoot = "C:\AIPlatform"
if ($hasD) {
    $defaultRoot = "D:\AIPlatform"
}

Log-PlatformAction "Target Platform Root Selection:"
$platformRoot = Read-Host "Enter target installation folder [default: $defaultRoot]"
if (-not $platformRoot) {
    $platformRoot = $defaultRoot
}

Log-PlatformSuccess "Target Platform Root set to: $platformRoot"

# 4. Sensitive Credentials entry (GITHUB and TELEGRAM bot tokens)
Log-PlatformAction "Configure Secure API Tokens (DPAPI Encrypted):"
$githubToken = Read-Host "Enter your GITHUB_TOKEN (press Enter to skip)"
$tgToken = Read-Host "Enter your TELEGRAM_BOT_TOKEN (press Enter to skip)"

# 5. Begin Orchestrated Installation Steps
Log-PlatformAction "Starting platform installation sequence..."

# Invoke Install
$installScript = Join-Path $PSScriptRoot "automation\Install.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript -PlatformRoot $platformRoot
if ($LASTEXITCODE -ne 0) {
    Log-PlatformError "Platform installation failed during Install.ps1 execution."
    Exit 1
}

# Invoke Configure
$configureScript = Join-Path $PSScriptRoot "automation\Configure.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $configureScript -PlatformRoot $platformRoot
if ($LASTEXITCODE -ne 0) {
    Log-PlatformError "Platform configuration failed during Configure.ps1 execution."
    Exit 1
}

# 6. Secure credentials at rest
if ($githubToken -or $tgToken) {
    Log-PlatformAction "Encrypting and storing secrets..."
    $secretsObj = [ordered]@{
        "GITHUB_TOKEN" = $githubToken
        "TELEGRAM_BOT_TOKEN" = $tgToken
    }
    $jsonSecrets = $secretsObj | ConvertTo-Json
    $encryptedPayload = Protect-PlatformSecret $jsonSecrets
    
    if ($null -ne $encryptedPayload) {
        $secretsDir = Join-Path $platformRoot "secrets"
        if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir -Force | Out-Null }
        $encryptedPayload | Out-File (Join-Path $secretsDir "OpenClaw_secrets.enc") -Force
        Log-PlatformSuccess "Credentials secured successfully using machine-scope DPAPI."
    }
}

# 7. Run final Validation Health Checks
Log-PlatformAction "Running platform validation checks..."
$validateScript = Join-Path $PSScriptRoot "automation\Validate.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $validateScript -PlatformRoot $platformRoot
$valStatus = $LASTEXITCODE

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Bootstrap Onboarding Sequence Complete!           " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your AI Workstation is configured and ready at: $platformRoot" -ForegroundColor White
Write-Host "To start the console dashboard:" -ForegroundColor White
Write-Host "  1) Run: npm install" -ForegroundColor Cyan
Write-Host "  2) Run: npm run dev" -ForegroundColor Cyan
Write-Host ""

Exit $valStatus
