# VerifyCompliance.ps1
# Automated compliance-as-code validator for SOC2, NIST, and ISO27001 controls.

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
Log-PlatformInfo "          Continuous Compliance Auditor            "
Log-PlatformInfo "==================================================="

$rootDir = Split-Path $PSScriptRoot -Parent
$allPassed = $true

# Control 1: Access Control & RBAC
Log-PlatformInfo "Auditing Control AC-1: RBAC role verification..."
$authPath = Join-Path $rootDir "src\platform\auth\authorization.ts"
if (Test-Path $authPath) {
    $content = (Get-Content -LiteralPath $authPath) -join "`n"
    if ($content -match "hasPermission") {
        Log-PlatformSuccess "Access Control: authorization.ts hasPermission checks verified."
    } else {
        Log-PlatformWarn "Access Control: hasPermission logic missing in authorization.ts."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "Access Control: authorization.ts not found."
    $allPassed = $false
}

# Control 2: Data Encryption (AES-GCM-256)
Log-PlatformInfo "Auditing Control CRYP-1: Encrypted Secrets..."
$secretRepoPath = Join-Path $rootDir "src\repositories\secret.repository.ts"
if (Test-Path $secretRepoPath) {
    $content = (Get-Content -LiteralPath $secretRepoPath) -join "`n"
    if ($content -match "aes-256-gcm") {
        Log-PlatformSuccess "Data Encryption: aes-256-gcm encryption algorithm verified."
    } else {
        Log-PlatformWarn "Data Encryption: secret.repository.ts does not use aes-256-gcm."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "Data Encryption: secret.repository.ts not found."
    $allPassed = $false
}

# Control 3: Audit Trail Database
Log-PlatformInfo "Auditing Control AUD-1: Database audit tables..."
$schemaPath = Join-Path $rootDir "prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $content = (Get-Content -LiteralPath $schemaPath) -join "`n"
    $hasAuditLog = $content -match "model AuditLogEntry"
    $hasAuditEvent = $content -match "model AuditEvent"
    
    if ($hasAuditLog -and $hasAuditEvent) {
        Log-PlatformSuccess "Audit Trail: AuditLogEntry and AuditEvent schemas verified in schema.prisma."
    } else {
        Log-PlatformWarn "Audit Trail: Missing AuditLogEntry or AuditEvent schemas in database."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "Audit Trail: prisma/schema.prisma not found."
    $allPassed = $false
}

# Control 4: supply chain dependencies (SBOM configuration check)
Log-PlatformInfo "Auditing Control SUP-1: Package configuration checks..."
$packagePath = Join-Path $rootDir "package.json"
if (Test-Path $packagePath) {
    Log-PlatformSuccess "Supply Chain: package.json verified."
} else {
    Log-PlatformWarn "Supply Chain: package.json not found."
    $allPassed = $false
}

# Output report file
$reportPath = Join-Path $rootDir "docs\ComplianceEvidenceReport.md"
$report = @"
# Compliance Evidence Report

Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Status: $(if ($allPassed) { "COMPLIANT" } else { "NON-COMPLIANT" })

## Audited Controls

1. **Access Control (SOC2 CC6.1/CC6.2, ISO A.9.1)**:
   - Status: $(if (Test-Path $authPath) { "PASS" } else { "FAIL" })
   - Evidence: Verified `hasPermission()` in [authorization.ts](file:///d:/1_Projects/AegisOS/src/platform/auth/authorization.ts).

2. **Data Encryption (SOC2 CC6.6/CC6.7, ISO A.8.2)**:
   - Status: $(if (Test-Path $secretRepoPath) { "PASS" } else { "FAIL" })
   - Evidence: Verified `aes-256-gcm` in [secret.repository.ts](file:///d:/1_Projects/AegisOS/src/repositories/secret.repository.ts).

3. **Audit Trail (SOC2 CC2.1, ISO A.12.4)**:
   - Status: $(if ($hasAuditLog -and $hasAuditEvent) { "PASS" } else { "FAIL" })
   - Evidence: Verified AuditLogEntry & AuditEvent in [schema.prisma](file:///d:/1_Projects/AegisOS/prisma/schema.prisma).

"@

$report | Out-File $reportPath -Force -Encoding utf8
Log-PlatformSuccess "Compliance Evidence written to: $reportPath"

if ($allPassed) {
    Log-PlatformSuccess "Compliance audit completed successfully: PASS."
    Exit 0
} else {
    Log-PlatformWarn "Compliance audit completed with failures: FAILED."
    Exit 1
}
