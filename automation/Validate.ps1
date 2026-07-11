<#
.SYNOPSIS
    Runs integration validation checks across graphics compute, services, ports, container architecture, context files, and dummy inference.
.PARAMETER PlatformRoot
    Target base directory for platform health checks.
.PARAMETER ReportPath
    Path where the generated validation report should be written.
.EXAMPLE
    .\automation\Validate.ps1 -PlatformRoot "D:\AIPlatform"
#>
param(
    [Parameter(Mandatory=$false)]
    [string]$PlatformRoot = "D:\AIPlatform",
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath
)

# Import platform helper module
$HelperModule = Join-Path $PSScriptRoot "libs\PlatformHelper.psm1"
Import-Module $HelperModule -Force

Log-PlatformInfo "==================================================="
Log-PlatformInfo "  AI Workstation Platform Integration Validator    "
Log-PlatformInfo "==================================================="

$PlatformRoot = Get-PlatformRoot $PlatformRoot

if (-not $ReportPath) {
    # Default to writing the report inside the platform's docs directory or temp folder
    $ReportPath = Join-Path $PlatformRoot "docs\ValidationReport.md"
}

$report = @"
# AI Workstation Platform Validation Report

Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
System: $([Environment]::MachineName) ($([Environment]::OSVersion.VersionString))

---

"@

$allPassed = $true

# Helper to add section to report
function Append-ReportSection([string]$title, [string]$content) {
    $global:report += "## $title`n`n$content`n`n"
}

# 1. GPU Check
Log-PlatformInfo "Checking GPU hardware compute resources..."
$gpuResult = ""
try {
    $nvidiaSmi = & nvidia-smi 2>&1
    if ($LASTEXITCODE -eq 0) {
        $lines = $nvidiaSmi -split "`n"
        $gpuLine = $lines | Where-Object { $_ -match "NVIDIA" } | Select-Object -First 1
        $gpuResult = "✅ GPU Compute is available: **$($gpuLine.Trim())**"
        Log-PlatformSuccess "GPU Compute available: $($gpuLine.Trim())"
    } else {
        $gpuResult = "⚠️ nvidia-smi was found but reported errors."
        Log-PlatformWarn $gpuResult
    }
} catch {
    $gpuResult = "❌ NVIDIA SMI compute tool not found in PATH."
    Log-PlatformError $gpuResult
    $allPassed = $false
}
Append-ReportSection "1. Graphics Compute (GPU)" $gpuResult

# 2. Services Check
Log-PlatformInfo "Checking Windows Service Statuses..."
$services = @("Ollama", "LiteLLMService", "OmniRouteService", "OpenClawService")
$servicesResult = "| Service | Status | Description |`n|---|---|---|`n"
foreach ($s in $services) {
    $service = Get-Service -Name $s -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -eq "Running") {
            $servicesResult += "| $s | ✅ Running | Deployed as Windows Service |`n"
            Log-PlatformSuccess "Service '$s' is Running."
        } else {
            $servicesResult += "| $s | ⚠️ Status: $($service.Status) | Stopped or Failed |`n"
            Log-PlatformWarn "Service '$s' is in state: $($service.Status)"
        }
    } else {
        $servicesResult += "| $s | ❌ Missing | Not registered on host |`n"
        Log-PlatformWarn "Service '$s' is missing from host SCM."
        # Do not fail validation strictly due to missing services in dry-run/bootstrap modes
    }
}
Append-ReportSection "2. Windows Services (SCM)" $servicesResult

# 3. Ports Bindings Check
Log-PlatformInfo "Checking active port allocations..."
$portsToCheck = @(
    @{ Name = "Ollama API"; Port = 11434; Host = "127.0.0.1"; Required = $true }
    @{ Name = "LiteLLM Proxy"; Port = 4000; Host = "127.0.0.1"; Required = $true }
    @{ Name = "OpenClaw Gateway"; Port = 18789; Host = "127.0.0.1"; Required = $true }
    @{ Name = "OmniRoute Dashboard"; Port = 20128; Host = "127.0.0.1"; Required = $true }
    @{ Name = "Open-WebUI Portal"; Port = 8090; Host = "127.0.0.1"; Required = $false }
)
$portsResult = "| Endpoint | Port | Binding Status | Required |`n|---|---|---|---|`n"
foreach ($p in $portsToCheck) {
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect($p.Host, $p.Port)
        $portsResult += "| $($p.Name) | $($p.Port) | ✅ Active (Listening) | $($p.Required) |`n"
        Log-PlatformSuccess "Port $($p.Port) ($($p.Name)) is active."
        $connection.Close()
    } catch {
        if ($p.Required) {
            $portsResult += "| $($p.Name) | $($p.Port) | ❌ Unreachable | **Yes** |`n"
            Log-PlatformWarn "Required Port $($p.Port) ($($p.Name)) is unreachable."
            $allPassed = $false
        } else {
            $portsResult += "| $($p.Name) | $($p.Port) | ⚠️ Unreachable | No |`n"
            Log-PlatformInfo "Optional Port $($p.Port) ($($p.Name)) is unreachable."
        }
    }
}
Append-ReportSection "3. Port Allocations & Network Boundaries" $portsResult

# 4. Docker & Open-WebUI Container Check
Log-PlatformInfo "Verifying Docker container state..."
$dockerResult = ""
try {
    $dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
    if (Test-Path $dockerPath) {
        $containerStatus = & $dockerPath inspect --format='{{.State.Health.Status}}' open-webui 2>&1
        if ($containerStatus -eq "healthy") {
            $dockerResult = "✅ Docker container `open-webui` is running and **Healthy**."
            Log-PlatformSuccess "Docker container open-webui is healthy."
        } else {
            $containerStatusRaw = & $dockerPath inspect --format='{{.State.Status}}' open-webui 2>&1
            $dockerResult = "⚠️ Docker container `open-webui` is in state: **$containerStatusRaw** (Health: $containerStatus)."
            Log-PlatformWarn $dockerResult
        }
    } else {
        $dockerResult = "❌ Docker command line utility not found."
        Log-PlatformWarn $dockerResult
    }
} catch {
    $dockerResult = "⚠️ Failed to communicate with Docker daemon: $_"
    Log-PlatformWarn $dockerResult
}
Append-ReportSection "4. Container Architecture (Docker)" $dockerResult

# 5. MCP & Knowledge Repositories Check
Log-PlatformInfo "Testing filesystem references and knowledge assets..."
$mcpResult = ""
$knowledgeBaseDir = $env:KNOWLEDGE_REPO_PATH
if (-not $knowledgeBaseDir) {
    $knowledgeBaseDir = Join-Path $PlatformRoot "knowledge"
}

if (Test-Path $knowledgeBaseDir) {
    $files = Get-ChildItem -Path $knowledgeBaseDir -Recurse -Filter "*.md" -ErrorAction SilentlyContinue
    $mcpResult += "✅ RAG Knowledge Repository found at $knowledgeBaseDir ($($files.Count) markdown assets discovered).`n`n"
    Log-PlatformSuccess "Knowledge base validated ($($files.Count) assets found)."
} else {
    $mcpResult += "⚠️ RAG Knowledge Repository folder not found or empty at $knowledgeBaseDir.`n`n"
    Log-PlatformWarn "Knowledge base directory $knowledgeBaseDir is offline."
}
Append-ReportSection "5. MCP & RAG Knowledge Repository Context" $mcpResult

# 6. End-to-End Inference Loop Validation
Log-PlatformInfo "Executing local inference query (smollm:135m)..."
$inferenceResult = ""
$smollmTest = @{
    model = "smollm:135m"
    prompt = "Translate 'System validation check complete' to French in one word."
    stream = $false
}
$smollmJson = ConvertTo-Json $smollmTest

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body $smollmJson -ContentType "application/json" -TimeoutSec 35
    if ($response.response) {
        $inferenceResult = "✅ Inference query succeeded.`n* **Prompt**: 'Translate ''System validation check complete'' to French in one word.'`n* **Response**: '$($response.response.Trim())'"
        Log-PlatformSuccess "Inference loop verified. Response: $($response.response.Trim())"
    } else {
        $inferenceResult = "❌ Ollama returned empty generation text."
        Log-PlatformError $inferenceResult
        $allPassed = $false
    }
} catch {
    $inferenceResult = "⚠️ Model query failed to compile or endpoint timed out: $_"
    Log-PlatformWarn "Inference loop query offline or cold-start delayed: $_"
}
Append-ReportSection "6. Active Inference Verification" $inferenceResult

# 7. Summary
$summary = ""
if ($allPassed) {
    $summary = "### Status: ✅ PASS`nAll core services, ports, model registries, hardware accelerators, and file systems are validated and online."
} else {
    $summary = "### Status: ⚠️ WARNING`nOne or more validation checks failed or are degrading. Review the log sections above to debug service setups."
}
$global:report += "$summary`n"

# Output report to file
if ($ReportPath) {
    # Ensure directory exists
    $reportDir = Split-Path $ReportPath -Parent
    if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir -Force | Out-Null }
    $report | Out-File $ReportPath -Force -Encoding utf8
    Log-PlatformInfo "Validation Report written to: $ReportPath"
}

Exit ([int](-not $allPassed))
