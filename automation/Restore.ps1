<#
.SYNOPSIS
    Orchestrates the complete recovery and restoration of platform configurations, databases, service parameters, and environment settings.
.PARAMETER BackupPath
    Path to the ZIP or folder containing the target backup set.
.PARAMETER PlatformRoot
    Target base directory for restore operations.
.PARAMETER Mode
    Restoration strategy: SafeRestore, FullRecovery, Repair, ForceRecovery.
.PARAMETER DryRun
    Simulate recovery tasks.
.EXAMPLE
    .\automation\Restore.ps1 -BackupPath "D:\AIPlatform\backups\Backup_20260708_190733" -PlatformRoot "D:\AIPlatform" -Mode "SafeRestore"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupPath,
    
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("SafeRestore", "FullRecovery", "Repair", "ForceRecovery")]
    [string]$Mode = "SafeRestore",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Restore Orchestrator     "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# 2. Check Backup Path
if (-not (Test-Path $BackupPath)) {
    Log-PlatformError "Specified Backup path not found: $BackupPath"
    Exit 1
}

# If the backup is a zip file, extract it to a temporary location first
$tempExtractDir = ""
if ($BackupPath.EndsWith(".zip", [System.StringComparison]::OrdinalIgnoreCase)) {
    $tempExtractDir = Join-Path $env:TEMP "RestoreStaging_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Log-PlatformAction "Extracting backup archive $BackupPath to staging area $tempExtractDir..."
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null
        Expand-Archive -Path $BackupPath -DestinationPath $tempExtractDir -Force
    }
    $BackupPath = $tempExtractDir
}

try {
    # 3. Phase: Prerequisites
    Log-PlatformAction "[Phase 1/9] Verifying Prerequisites..."
    $installScript = Join-Path $PSScriptRoot "Install.ps1"
    if (Test-Path $installScript) {
        $installArgs = @("-PlatformRoot", $PlatformRoot)
        if ($DryRun) { $installArgs += "-DryRun" }
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript $installArgs
    }

    # 4. Phase: Restore Configuration files
    Log-PlatformAction "[Phase 2/9] Restoring Configurations from Backup..."
    $configBackupDir = Join-Path $BackupPath "Config"
    $targetConfigDir = Join-Path $PlatformRoot "configs"

    if (Test-Path $configBackupDir) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would copy configurations from $configBackupDir to $targetConfigDir"
        } else {
            Copy-Item -Path (Join-Path $configBackupDir "*") -Destination $targetConfigDir -Recurse -Force
            Log-PlatformSuccess "Configurations copied."
        }
    }

    # 5. Phase: Environment Variables
    Log-PlatformAction "[Phase 3/9] Re-registering Environment Variables..."
    $configureScript = Join-Path $PSScriptRoot "Configure.ps1"
    if (Test-Path $configureScript) {
        $configArgs = @("-PlatformRoot", $PlatformRoot)
        if ($DryRun) { $configArgs += "-DryRun" }
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $configureScript $configArgs
    }

    # 6. Phase: Restore Secrets (DPAPI Prompt on Machine mismatch)
    Log-PlatformAction "[Phase 4/9] Validating API Secrets & Security Context..."
    $secretsBackupFile = Join-Path $BackupPath "secrets\OpenClaw_secrets.enc"
    $targetSecretsDir = Join-Path $PlatformRoot "secrets"
    $targetSecretsFile = Join-Path $targetSecretsDir "OpenClaw_secrets.enc"

    if (-not (Test-Path $targetSecretsDir) -and -not $DryRun) {
        New-Item -ItemType Directory -Path $targetSecretsDir -Force | Out-Null
    }

    $secretsRestored = $false
    if (Test-Path $secretsBackupFile) {
        $ciphertext = Get-Content $secretsBackupFile -Raw
        $decrypted = Unprotect-PlatformSecret $ciphertext
        
        # If decryption succeeds, copy file directly
        if ($null -ne $decrypted) {
            if (-not $DryRun) {
                Copy-Item $secretsBackupFile $targetSecretsFile -Force
                Log-PlatformSuccess "DPAPI credentials successfully decrypted and restored on the host."
            }
            $secretsRestored = $true
        } else {
            Log-PlatformWarn "DPAPI credentials backup was encrypted on a different machine and cannot be read."
            # Prompt developer to enter secrets on restoration
            if (-not $DryRun) {
                Log-PlatformAction "Re-entry required. Please enter your GITHUB_TOKEN (press Enter to skip):"
                $githubToken = Read-Host
                Log-PlatformAction "Please enter your TELEGRAM_BOT_TOKEN (press Enter to skip):"
                $tgToken = Read-Host
                
                if ($githubToken -or $tgToken) {
                    $secretsObj = [ordered]@{
                        "GITHUB_TOKEN" = $githubToken
                        "TELEGRAM_BOT_TOKEN" = $tgToken
                    }
                    $jsonSecrets = $secretsObj | ConvertTo-Json
                    $b64 = Protect-PlatformSecret $jsonSecrets
                    if ($null -ne $b64) {
                        $b64 | Out-File $targetSecretsFile -Force
                        Log-PlatformSuccess "Entered secrets encrypted via DPAPI and saved locally."
                        $secretsRestored = $true
                    }
                }
            } else {
                Log-PlatformAction "[DRY-RUN] Would prompt for secrets re-entry on new host."
            }
        }
    }

    # 7. Phase: Services Configuration Registry Import
    Log-PlatformAction "[Phase 5/9] Importing Registry Settings for NSSM Services..."
    $regDir = Join-Path $BackupPath "Registry"
    if (Test-Path $regDir) {
        $regFiles = Get-ChildItem -Path $regDir -Filter "*.reg"
        foreach ($reg in $regFiles) {
            if ($DryRun) {
                Log-PlatformAction "[DRY-RUN] Would import registry file: $($reg.FullName)"
            } else {
                Log-PlatformInfo "Importing registry configuration $($reg.Name)..."
                reg import $reg.FullName | Out-Null
            }
        }
    }

    # 8. Phase: Databases (Restore SQLite databases)
    Log-PlatformAction "[Phase 6/9] Restoring SQLite Database Backups..."
    $dbBackupDir = Join-Path $BackupPath "Database"
    $targetDbDir = Join-Path $PlatformRoot "databases\sqlite"

    if (Test-Path $dbBackupDir) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would copy SQLite databases from $dbBackupDir to $targetDbDir"
        } else {
            Copy-Item -Path (Join-Path $dbBackupDir "*.sqlite") -Destination $targetDbDir -Force -ErrorAction SilentlyContinue
            Log-PlatformSuccess "SQLite databases restored."
        }
    }

    # 9. Phase: Docker Volumes Restore
    Log-PlatformAction "[Phase 7/9] Restoring Docker volumes..."
    $dockerBackup = Join-Path $BackupPath "Database\open_webui_data.zip"
    $targetWebUiDir = Join-Path $PlatformRoot "docker\open-webui"
    if (Test-Path $dockerBackup) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would unpack Docker volume backup: $dockerBackup"
        } else {
            Log-PlatformInfo "Extracting Open-WebUI Docker volume state..."
            Expand-Archive -Path $dockerBackup -DestinationPath $targetWebUiDir -Force
            Log-PlatformSuccess "Docker Open-WebUI data unpacked."
        }
    }

    # 10. Phase: Re-pull Ollama Models from Manifest
    Log-PlatformAction "[Phase 8/9] Re-pulling Ollama Models from Manifest..."
    $manifestFile = Join-Path $PlatformRoot "manifests\ModelManifest.json"
    if (-not (Test-Path $manifestFile)) {
        # Check inside backup configuration
        $manifestFile = Join-Path $BackupPath "Config\ModelManifest.json"
    }

    if (Test-Path $manifestFile) {
        try {
            $modelsJson = Get-Content $manifestFile -Raw
            $models = ConvertFrom-Json $modelsJson
            Log-PlatformInfo "Discovered $($models.Count) models in ModelManifest.json."
            foreach ($model in $models) {
                if ($DryRun) {
                    Log-PlatformAction "[DRY-RUN] Would pull Ollama model: $($model.name)"
                } else {
                    Log-PlatformAction "Pulling model '$($model.name)'..."
                    & ollama pull $model.name
                }
            }
        } catch {
            Log-PlatformWarn "Failed to read or parse ModelManifest.json: $_"
        }
    }

    # 11. Run Health Checks
    Log-PlatformAction "[Phase 9/9] Running Platform Validation Suite..."
    $validateScript = Join-Path $PSScriptRoot "Validate.ps1"
    if (Test-Path $validateScript) {
        $valArgs = @("-PlatformRoot", $PlatformRoot)
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $validateScript $valArgs
    }

    Log-PlatformSuccess "Platform restoration finished successfully."

} finally {
    # Cleanup temporary staging extract area if created
    if ($tempExtractDir -and (Test-Path $tempExtractDir)) {
        Log-PlatformInfo "Cleaning up temporary restore extract area..."
        Remove-Item -Path $tempExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Exit 0
