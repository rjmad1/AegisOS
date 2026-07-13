# CheckGovernance.ps1
# Automates checks for Git branching strategy, Conventional Commits, ADR files, and documentation metadata headers.

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
Log-PlatformInfo "          Enterprise Governance Validator          "
Log-PlatformInfo "==================================================="

$allPassed = $true

# 1. Branch Naming Rules
Log-PlatformInfo "Verifying active Git branch naming rules..."
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if ($LASTEXITCODE -eq 0 -and $branch) {
    $validBranchPatterns = "^(main|feature\/[a-zA-Z0-9_-]+|bugfix\/[a-zA-Z0-9_-]+|hotfix\/[a-zA-Z0-9_-]+|release\/[a-zA-Z0-9_-]+)$"
    if ($branch -match $validBranchPatterns) {
        Log-PlatformSuccess "Active branch '$branch' conforms to naming policy rules."
    } else {
        Log-PlatformWarn "Branch name '$branch' violates branching naming guidelines (use feature/xxx, bugfix/xxx, hotfix/xxx, release/xxx, or main)."
        $allPassed = $false
    }
} else {
    Log-PlatformWarn "Not a git repository or git is missing. Skipping branch check."
}

# 2. Conventional Commit Rules
Log-PlatformInfo "Checking Conventional Commit messages in the last 5 commits..."
$commits = git log -n 5 --pretty=format:"%s" 2>$null
if ($LASTEXITCODE -eq 0 -and $commits) {
    $commitPattern = "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?!?: .+$"
    $idx = 1
    foreach ($c in $commits) {
        if ($c -match $commitPattern) {
            Log-PlatformSuccess "Commit $($idx): '$c' - Valid conventional format."
        } else {
            Log-PlatformWarn "Commit $($idx): '$c' - FAILED. Expected conventional format (e.g., 'feat(auth): add google sign-in')."
            $allPassed = $false
        }
        $idx++
    }
} else {
    Log-PlatformWarn "No commits found. Skipping Conventional Commits check."
}

# 3. Documentation Standards & Metadata Check
Log-PlatformInfo "Verifying Markdown metadata headers in 'docs' folder..."
$docsPath = Join-Path (Split-Path $PSScriptRoot -Parent) "docs"
if (Test-Path $docsPath) {
    $markdownFiles = Get-ChildItem -Path $docsPath -Filter "*.md" -Recurse
    foreach ($file in $markdownFiles) {
        # Skip directories inside node_modules if recurse catches them
        if ($file.FullName -match "node_modules") { continue }
        
        $content = (Get-Content -LiteralPath $file.FullName) -join "`n"
        # Search for Table-based Metadata structure matching the EGF-2026-001 template:
        # Document ID | Value
        # Version
        # Date
        # Classification
        # Owner
        $hasDocId = $content -match "Document ID"
        $hasVersion = $content -match "Version"
        $hasDate = $content -match "Date"
        $hasClassification = $content -match "Classification"
        $hasOwner = $content -match "Owner"

        if ($hasDocId -and $hasVersion -and $hasDate -and $hasClassification -and $hasOwner) {
            # Metadata found
        } else {
            Log-PlatformWarn "Documentation file '$($file.Name)' is missing required enterprise metadata fields."
            if ($file.FullName -match "docs\\enterprise") {
                $allPassed = $false
            }
        }
    }
    if ($allPassed) {
        Log-PlatformSuccess "All analyzed Markdown documentation files contain compliant metadata blocks."
    }
} else {
    Log-PlatformWarn "Docs path '$docsPath' not found."
}

# 4. ADR Naming & Metadata Rules
Log-PlatformInfo "Scanning ADR files for compliance..."
$adrPath = Join-Path (Split-Path $PSScriptRoot -Parent) "adr"
if (Test-Path $adrPath) {
    $adrs = Get-ChildItem -Path $adrPath -Filter "*.md"
    foreach ($adr in $adrs) {
        # Check filename format: ADR-XXX-*.md
        if ($adr.Name -match "^ADR-\d{3}-.+\.md$") {
            # Naming is correct
            $content = (Get-Content -LiteralPath $adr.FullName) -join "`n"
            $hasStatus = $content -match "Status"
            $hasDecisions = $content -match "Approved" -or $content -match "Proposed" -or $content -match "Accepted"
            
            if ($hasStatus -and $hasDecisions) {
                # Valid ADR internals
            } else {
                Log-PlatformWarn "ADR file '$($adr.Name)' misses explicit Status or Decision markers."
                $allPassed = $false
            }
        } else {
            Log-PlatformWarn "ADR filename '$($adr.Name)' violates the ADR-XXX-Description.md pattern."
            $allPassed = $false
        }
    }
} else {
    Log-PlatformWarn "ADR path '$adrPath' not found."
}

if ($allPassed) {
    Log-PlatformSuccess "Governance verification finished successfully: PASS."
    Exit 0
} else {
    Log-PlatformWarn "Governance checks finished with violations: FAILED."
    Exit 1
}
