<#
.SYNOPSIS
    Installs prerequisites, dependencies, and creates standardized directory layouts for the AI Workstation platform.
.PARAMETER PlatformRoot
    Target base directory for platform installation.
.PARAMETER DryRun
    Simulate actions without modifying files or installing software.
.PARAMETER VerboseLog
    Enable verbose detail logging.
.EXAMPLE
    .\automation\Install.ps1 -PlatformRoot "D:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$VerboseLog
)

# Import shared platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Deployment Installer     "
Log-PlatformInfo "==================================================="

# 1. Enforce elevated privileges
if (-not (Test-PlatformElevation)) { Exit 1 }

$PlatformRoot = Get-PlatformRoot $PlatformRoot

# 2. Check and Install runtime dependencies via Winget
$wingetAvailable = $false
try {
    $wingetVer = & winget --version 2>&1
    $wingetAvailable = $true
    Log-PlatformSuccess "winget is available ($($wingetVer.ToString().Trim()))"
} catch {
    Log-PlatformWarn "winget package manager is not installed or available on this system."
}

$dependencies = @{
    "Git" = @{ Command = "git --version"; WinGetName = "Git.Git" }
    "Node.js" = @{ Command = "node --version"; WinGetName = "OpenJS.NodeJS" }
    "Ollama" = @{ Command = "ollama --version"; WinGetName = "Ollama.Ollama" }
    "Docker" = @{ Command = "docker --version"; WinGetName = "Docker.DockerDesktop" }
}

foreach ($depName in $dependencies.Keys) {
    $dep = $dependencies[$depName]
    $installed = $false
    try {
        $out = Invoke-Expression $dep.Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            $installed = $true
            Log-PlatformInfo "$depName is already installed ($($out.ToString().Trim()))"
        }
    } catch {}

    if (-not $installed) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would install $depName using: winget install $($dep.WinGetName) --silent"
        } else {
            if ($wingetAvailable) {
                Log-PlatformAction "Installing $depName via winget..."
                try {
                    $installProcess = Start-Process -FilePath "winget" -ArgumentList "install", $dep.WinGetName, "--silent", "--accept-package-agreements", "--accept-source-agreements" -Wait -PassThru -NoNewWindow
                    if ($installProcess.ExitCode -eq 0) {
                        Log-PlatformSuccess "Successfully installed $depName."
                    } else {
                        Log-PlatformWarn "winget exited with code $($installProcess.ExitCode) for $depName."
                    }
                } catch {
                    Log-PlatformWarn "Failed to automate installation of $depName: $_"
                }
            } else {
                Log-PlatformWarn "Please install $depName manually."
            }
        }
    }
}

# 3. Check / Install UV (Astral package installer)
$binDir = Join-Path $PlatformRoot "runtime\bin"
$uvPath = Join-Path $binDir "uv.exe"
if (Test-Path $uvPath) {
    Log-PlatformInfo "uv.exe is available at $uvPath"
} else {
    if ($DryRun) {
        Log-PlatformAction "[DRY-RUN] Would download and install uv.exe into $binDir"
    } else {
        Log-PlatformAction "Installing uv package manager..."
        try {
            if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Force -Path $binDir | Out-Null }
            $uvUrl = "https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip"
            $tempZip = Join-Path $env:TEMP "uv.zip"
            Log-PlatformInfo "Downloading uv from: $uvUrl"
            Invoke-WebRequest -Uri $uvUrl -OutFile $tempZip -UseBasicParsing
            
            Log-PlatformInfo "Extracting uv.exe..."
            Expand-Archive -Path $tempZip -DestinationPath (Join-Path $env:TEMP "uv_extract") -Force
            $extractedUv = Get-ChildItem -Path (Join-Path $env:TEMP "uv_extract") -Filter "uv.exe" -Recurse | Select-Object -First 1
            if ($extractedUv) {
                Copy-Item -Path $extractedUv.FullName -Destination $uvPath -Force
                Log-PlatformSuccess "uv.exe successfully installed to $uvPath"
            } else {
                Log-PlatformWarn "uv.exe was not found in zip archive."
            }
            Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
            Remove-Item (Join-Path $env:TEMP "uv_extract") -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Log-PlatformWarn "Failed to install uv.exe: $_"
        }
    }
}

# 4. Standardize Directory Layout Structure
Log-PlatformAction "Establishing standardized directory structure at $PlatformRoot..."
$folders = @(
    "apps", "configs", "configs\litellm", "configs\openclaw", "configs\postgresql",
    "data", "databases", "databases\pgsql", "databases\mongodb", "databases\sqlite",
    "docker", "docker\open-webui", "logs", "logs\litellm", "logs\openclaw", "logs\health",
    "models", "workspace", "projects", "scripts", "backups", "cache", "runtime", 
    "runtime\python", "runtime\node", "secrets", "knowledge", "manifests", "installers", "docs"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $PlatformRoot $folder
    if (-not (Test-Path $fullPath)) {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would create folder: $fullPath"
        } else {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
            Log-PlatformInfo "Created directory: $fullPath"
        }
    }
}

# 5. Check and configure SCM and NSSM Services
Log-PlatformAction "Registering Windows SCM Services..."
$services = @("Ollama", "LiteLLMService", "OpenClawService", "OmniRouteService")
foreach ($s in $services) {
    $existing = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($existing) {
        Log-PlatformInfo "Service '$s' is already registered on host."
    } else {
        if ($DryRun) {
            Log-PlatformAction "[DRY-RUN] Would create and wrap service: $s"
        } else {
            Log-PlatformWarn "Service '$s' is not registered. It will be initialized and configured by Configure.ps1."
        }
    }
}

Log-PlatformSuccess "Installation initialization completed successfully."
Exit 0
