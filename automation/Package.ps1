<#
.SYNOPSIS
    Bundles the clean source codebase, documentation, templates, catalogs, and stubs into a zip file, stripping credentials and history.
.PARAMETER PlatformRoot
    Target directory (default: workspace root).
.PARAMETER OutputPath
    Location to write the final zip distribution package.
.EXAMPLE
    .\automation\Package.ps1 -OutputPath "D:\AIWorkstation_Distributable.zip"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$OutputPath
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Distribution Packager    "
Log-PlatformInfo "==================================================="

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $OutputPath) {
    $OutputPath = Join-Path $repoRoot "AIWorkstation_Distributable.zip"
}

$stagingDir = Join-Path $env:TEMP "PackageStaging_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

try {
    Log-PlatformAction "Creating temporary packaging staging area at $stagingDir..."
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

    # 1. Define folder copying (excluding node_modules, .git, .next, logs, temp, cache)
    Log-PlatformInfo "Copying source workspace layers..."
    $excludePatterns = @("node_modules", "\.git", "\.next", "logs", "temp", "cache", "backups", "artifacts_storage", "\.env\.local", "tsconfig\.tsbuildinfo", "AIWorkstation_Distributable\.zip")
    
    $files = Get-ChildItem -Path $repoRoot -Recurse -File
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($repoRoot.Path.Length + 1)
        
        # Check exclusion matches
        $exclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($relativePath -match $pattern) {
                $exclude = $true
                break
            }
        }

        if (-not $exclude) {
            $destFile = Join-Path $stagingDir $relativePath
            $destDir = Split-Path $destFile -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item -Path $file.FullName -Destination $destFile -Force
        }
    }

    # 2. Check and strip credentials or secure folders
    Log-PlatformAction "Scanning staging area for sensitive leaks..."
    $secretLeaks = Get-ChildItem -Path $stagingDir -Recurse -Filter "*_secrets.*" -ErrorAction SilentlyContinue
    $secretLeaks += Get-ChildItem -Path $stagingDir -Recurse -Filter "*.enc" -ErrorAction SilentlyContinue
    $secretLeaks += Get-ChildItem -Path $stagingDir -Recurse -Filter "*.key" -ErrorAction SilentlyContinue
    $secretLeaks += Get-ChildItem -Path $stagingDir -Recurse -Filter ".env.local" -ErrorAction SilentlyContinue
    
    if ($secretLeaks.Count -gt 0) {
        Log-PlatformWarn "Discovered secure config leak in source copy. Stripping files..."
        foreach ($leak in $secretLeaks) {
            Log-PlatformWarn "Removing sensitive asset: $($leak.FullName)"
            Remove-Item $leak.FullName -Force -ErrorAction SilentlyContinue
        }
    }

    # 3. Create final zip package
    Log-PlatformAction "Compressing clean distribution ZIP package..."
    if (Test-Path $OutputPath) {
        Remove-Item $OutputPath -Force -ErrorAction SilentlyContinue
    }
    Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $OutputPath -Force
    Log-PlatformSuccess "Distribution ready archive successfully generated at: $OutputPath"

} catch {
    Log-PlatformError "Platform distribution packaging failed: $_"
} finally {
    if (Test-Path $stagingDir) {
        Log-PlatformInfo "Purging temporary staging area..."
        Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Exit 0
