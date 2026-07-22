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

# 6. Service Account & ACL Hardening (SEC-001)
function Initialize-AegisServiceAccount([string]$platformRoot) {
    Log-PlatformAction "Ensuring restricted aegis_runtime service account and ACL permissions..."
    try {
        $accountName = "aegis_runtime"
        $user = Get-LocalUser -Name $accountName -ErrorAction SilentlyContinue
        if (-not $user) {
            $securePass = ConvertTo-SecureString "AegisRuntimeP@ss2026!" -AsPlainText -Force
            New-LocalUser -Name $accountName -Password $securePass -FullName "AegisOS Restricted Runtime User" -Description "Unprivileged local account for host service isolation" -PasswordNeverExpires $true | Out-Null
            Log-PlatformSuccess "Created local service account: $accountName"
        } else {
            Log-PlatformInfo "Local service account $accountName already exists."
        }

        # Apply restricted ACL permissions on PlatformRoot
        if (Test-Path $platformRoot) {
            $acl = Get-Acl $platformRoot
            $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($accountName, "FullControl", "ContainerInherit, ObjectInherit", "None", "Allow")
            $acl.AddAccessRule($rule)
            Set-Acl -Path $platformRoot -AclObject $acl
            Log-PlatformSuccess "Restricted ACLs applied for $accountName on $platformRoot"
        }
        return $true
    } catch {
        Log-PlatformWarn "Could not configure local user account (non-Windows or limited permission environment): $_"
        return $false
    }
}

Export-ModuleMember -Function Log-PlatformInfo, Log-PlatformAction, Log-PlatformWarn, Log-PlatformSuccess, Log-PlatformError, Test-PlatformElevation, Get-PlatformRoot, Protect-PlatformSecret, Unprotect-PlatformSecret, Get-PlatformDriveDetails, Initialize-AegisServiceAccount
