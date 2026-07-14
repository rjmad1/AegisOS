# PlatformHelper.psm1
# Reusable helper library for AI Workstation Platform Automation.

Add-Type -AssemblyName System.Security

# 1. Standardized Logging Functions
function Log-PlatformInfo([string]$msg) {
    Write-Host "[INFO] $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
}

function Log-PlatformAction([string]$msg) {
    Write-Host "[ACTION] $msg" -ForegroundColor Cyan
}

function Log-PlatformWarn([string]$msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Log-PlatformSuccess([string]$msg) {
    Write-Host "[SUCCESS] $msg" -ForegroundColor Green
}

function Log-PlatformError([string]$msg) {
    Write-Error "[ERROR] $msg"
}

# 2. Elevation / Privilege Verification
function Test-PlatformElevation {
    if ($env:BYPASS_ELEVATION -eq "true") {
        Log-PlatformWarn "Bypassing Administrator elevation check (testing mode active)."
        return $true
    }
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Log-PlatformError "This command/script must be run from an Elevated/Administrator PowerShell session!"
        return $false
    }
    return $true
}

# 3. Dynamic Environment Resolution
function Get-PlatformRoot([string]$paramRoot) {
    if ($paramRoot) {
        return $paramRoot
    }
    if ($env:AEGISOS_STATE_DIR) {
        return $env:AEGISOS_STATE_DIR
    }
    return "D:\AIPlatform"
}

# 4. DPAPI Machine-Scoped Secrets Protection
function Protect-PlatformSecret([string]$plainText) {
    try {
        $secretBytes = [System.Text.Encoding]::UTF8.GetBytes($plainText)
        $encrypted = [System.Security.Cryptography.ProtectedData]::Protect($secretBytes, $null, [System.Security.Cryptography.DataProtectionScope]::LocalMachine)
        return [Convert]::ToBase64String($encrypted)
    } catch {
        Log-PlatformError "Failed to encrypt secret using DPAPI: $_"
        return $null
    }
}

function Unprotect-PlatformSecret([string]$cipherText) {
    try {
        $encryptedBytes = [Convert]::FromBase64String($cipherText)
        $decryptedBytes = [System.Security.Cryptography.ProtectedData]::Unprotect($encryptedBytes, $null, [System.Security.Cryptography.DataProtectionScope]::LocalMachine)
        return [System.Text.Encoding]::UTF8.GetString($decryptedBytes)
    } catch {
        Log-PlatformWarn "Secret decryption failed. Host key mismatch or corrupt data."
        return $null
    }
}

# 5. Partitions & System Storage Details
function Get-PlatformDriveDetails {
    Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 } | ForEach-Object {
        [ordered]@{
            DriveLetter = $_.DeviceID
            FreeGB = [math]::Round($_.FreeSpace / 1GB, 2)
            TotalGB = [math]::Round($_.Size / 1GB, 2)
        }
    }
}

Export-ModuleMember -Function Log-PlatformInfo, Log-PlatformAction, Log-PlatformWarn, Log-PlatformSuccess, Log-PlatformError, Test-PlatformElevation, Get-PlatformRoot, Protect-PlatformSecret, Unprotect-PlatformSecret, Get-PlatformDriveDetails
