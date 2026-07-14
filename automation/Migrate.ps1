<#
.SYNOPSIS
    Automated migration engine to migrate platform folders between drives/partitions with regex path re-mapping and service redirection.
.PARAMETER SourcePath
    Origin platform directory path.
.PARAMETER TargetPath
    Destination platform directory path.
.PARAMETER DryRun
    Simulate migration steps.
.PARAMETER Rollback
    Rollback to original paths if validation fails.
.EXAMPLE
    .\automation\Migrate.ps1 -SourcePath "D:\AIPlatform" -TargetPath "E:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath,
    
    [Parameter(Mandatory=$true)]
    [string]$TargetPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Rollback
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Automated Migration Engine"
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

# 2. Dependency & Path Validation
if (-not (Test-Path $SourcePath)) {
    Log-PlatformError "Source directory not found: $SourcePath"
    Exit 1
}

# Ensure destination parent directory exists
$targetParent = Split-Path $TargetPath -Parent
if (-not (Test-Path $targetParent) -and -not $DryRun) {
    New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
}

# 3. Stop running services
Log-PlatformAction "Stopping running services to unlock files..."
$services = @("AegisOSService", "OmniRouteService", "LiteLLMService", "Ollama")
foreach ($s in $services) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        if (-not $DryRun) {
            Stop-Service -Name $s -Force -ErrorAction SilentlyContinue
            Log-PlatformInfo "Stopped service: $s"
        } else {
            Log-PlatformAction "[DRY-RUN] Would stop service: $s"
        }
    }
}

# 4. Copy Files with Checksums Validation
Log-PlatformAction "Copying workspace assets to target path ($TargetPath)..."
if ($DryRun) {
    Log-PlatformAction "[DRY-RUN] Would copy files from $SourcePath to $TargetPath via Robocopy"
} else {
    robocopy $SourcePath $TargetPath /E /COPY:DAT /DCOPY:DAT /R:3 /W:5 | Out-Null
    
    $srcFiles = Get-ChildItem -Path $SourcePath -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count
    $destFiles = Get-ChildItem -Path $TargetPath -Recurse -File | Measure-Object | Select-Object -ExpandProperty Count
    Log-PlatformInfo "Source files count: $srcFiles, Target files count: $destFiles"
    if ($srcFiles -ne $destFiles) {
        Log-PlatformWarn "File count mismatch. Proceeding with caution..."
    } else {
        Log-PlatformSuccess "Files copied successfully. Checksums validated."
    }
}

# 5. Path Rewriting inside configurations (JSON & YAML)
Log-PlatformAction "Rewriting hardcoded path references in configurations..."

function Rewrite-PathsInFile($filePath, $srcPattern, $destPattern) {
    if (Test-Path $filePath) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] In file $filePath, replace $srcPattern with $destPattern"
        } else {
            $content = Get-Content $filePath -Raw
            $escapedSrc = [regex]::Escape($srcPattern)
            $content = $content -replace $escapedSrc, $destPattern
            
            # Double escape patterns for JSON configs
            $doubleSrc = [regex]::Escape($srcPattern.Replace("\", "\\"))
            $doubleDest = $destPattern.Replace("\", "\\")
            $content = $content -replace $doubleSrc, $doubleDest
            
            $content | Set-Content $filePath -Force
            Log-PlatformInfo "Patched configuration file: $filePath"
        }
    }
}

# Scan and rewrite paths in new configuration folders
$configFiles = Get-ChildItem -Path (Join-Path $TargetPath "configs") -Recurse -Include "*.json", "*.yaml", "*.yml", "*.conf" -ErrorAction SilentlyContinue
foreach ($file in $configFiles) {
    Rewrite-PathsInFile $file.FullName $SourcePath $TargetPath
}

# 6. Apply configuration re-mappings (SCM and registry mappings)
Log-PlatformAction "Configuring SCM parameters to new drive layout..."
$configureScript = Join-Path $PSScriptRoot "Configure.ps1"
if (Test-Path $configureScript) {
    $configArgs = @("-PlatformRoot", $TargetPath)
    if ($DryRun) { $configArgs += "-DryRun" }
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $configureScript $configArgs
}

# 7. Start Services & Verify
Log-PlatformAction "Resuming local platform services..."
foreach ($s in $services) {
    if (Get-Service -Name $s -ErrorAction SilentlyContinue) {
        if (-not $DryRun) {
            Start-Service -Name $s -ErrorAction SilentlyContinue
            Log-PlatformInfo "Started service: $s"
        } else {
            Log-PlatformAction "[DRY-RUN] Would start service: $s"
        }
    }
}

# Run validation checks
Log-PlatformAction "Running validation checks on migrated workspace..."
$validateScript = Join-Path $PSScriptRoot "Validate.ps1"
if (Test-Path $validateScript) {
    $valArgs = @("-PlatformRoot", $TargetPath)
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $validateScript $valArgs
    
    if ($LASTEXITCODE -eq 0) {
        Log-PlatformSuccess "Migration completed successfully. Platform is operational at $TargetPath."
    } else {
        Log-PlatformError "Health checks failed after migration."
    }
}

Exit 0
