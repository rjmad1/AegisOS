# GenerateDocsIndex.ps1
# Scans documentation and ADR directories, validates relative file links, checks metadata headers, and builds an index registry.

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
Log-PlatformInfo "        Documentation Indexer & Link Validator      "
Log-PlatformInfo "==================================================="

$rootDir = Split-Path $PSScriptRoot -Parent
$docsDir = Join-Path $rootDir "docs"
$adrDir = Join-Path $rootDir "adr"

$allPassed = $true
$deadLinksCount = 0
$totalLinksCount = 0

function Verify-MarkdownLinks([string]$filePath, [string]$content) {
    # Match markdown links: [text](file:///d:/...) or standard relative markdown links
    # Let's extract any local file links
    $matches = [regex]::Matches($content, '\[([^\]]+)\]\(([^)]+)\)')
    
    foreach ($m in $matches) {
        $linkText = $m.Groups[1].Value
        $linkUrl = $m.Groups[2].Value
        
        $global:totalLinksCount++
        
        # Check if it's a file scheme absolute path or a local relative path
        if ($linkUrl -like "file:///*" -or $linkUrl -match "^[a-zA-Z]:") {
            # Convert file:// URI to standard windows file path
            $cleanPath = $linkUrl -replace "file:///", "" -replace "/", "\"
            if ($cleanPath -match "^[a-zA-Z]:") {
                # Target path is absolute
                if (-not (Test-Path $cleanPath)) {
                    Log-PlatformWarn "Dead Absolute Link in '$($filePath)': '$linkText' -> '$cleanPath'"
                    $global:deadLinksCount++
                    $global:allPassed = $false
                }
            }
        } elseif ($linkUrl -match "^http" -or $linkUrl -match "^mailto") {
            # Skip remote URLs
        } else {
            # Relative path check
            # Strip anchors (e.g. #L123 or #anchor-name)
            $cleanRel = $linkUrl -replace "#.*$", ""
            if ($cleanRel) {
                $dirOfFile = Split-Path $filePath -Parent
                $targetPath = [System.IO.Path]::GetFullPath((Join-Path $dirOfFile $cleanRel))
                
                if (-not (Test-Path $targetPath)) {
                    Log-PlatformWarn "Dead Relative Link in '$($filePath)': '$linkText' -> '$cleanRel' (resolved: $targetPath)"
                    $global:deadLinksCount++
                    $global:allPassed = $false
                }
            }
        }
    }
}

# 1. Scan Docs
Log-PlatformInfo "Analyzing docs folder for links..."
if (Test-Path $docsDir) {
    $docFiles = Get-ChildItem -Path $docsDir -Filter "*.md" -Recurse
    foreach ($df in $docFiles) {
        if ($df.FullName -match "node_modules") { continue }
        $content = (Get-Content -LiteralPath $df.FullName) -join "`n"
        Verify-MarkdownLinks -filePath $df.FullName -content $content
    }
}

# 2. Scan ADRs
Log-PlatformInfo "Analyzing adr folder for links..."
if (Test-Path $adrDir) {
    $adrFiles = Get-ChildItem -Path $adrDir -Filter "*.md"
    foreach ($af in $adrFiles) {
        $content = (Get-Content -LiteralPath $af.FullName) -join "`n"
        Verify-MarkdownLinks -filePath $af.FullName -content $content
    }
}

# 3. Generate Living Index File
Log-PlatformInfo "Compiling Master Index..."
$indexFilePath = Join-Path $docsDir "MasterIndexRegistry.json"
$registry = @{
    Timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    TotalDocumentsChecked = 0
    Documents = @()
}

$allMarkdown = Get-ChildItem -Path $docsDir, $adrDir -Filter "*.md" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }
$registry.TotalDocumentsChecked = $allMarkdown.Count

foreach ($doc in $allMarkdown) {
    $content = (Get-Content -LiteralPath $doc.FullName) -join "`n"
    
    # Try to extract Document ID and Title
    $docId = "N/A"
    if ($content -match "Document ID\s*\|\s*([^|\r\n]+)") {
        $docId = $Matches[1].Trim()
    }
    
    $title = $doc.BaseName
    if ($content -match "^#\s+(.+)$") {
        $title = $Matches[1].Trim()
    }
    
    $registry.Documents += @{
        Filename = $doc.Name
        Title = $title
        DocumentId = $docId
        AbsolutePath = $doc.FullName.Replace("\", "/")
        Size = $doc.Length
    }
}

$registryJson = ConvertTo-Json $registry -Depth 4
$registryJson | Out-File $indexFilePath -Force -Encoding utf8
Log-PlatformSuccess "Master Index Registry written successfully: $indexFilePath"

Log-PlatformInfo "Link verification summary: Verified $totalLinksCount links, found $deadLinksCount dead links."

if ($allPassed) {
    Log-PlatformSuccess "Documentation link validation: PASS."
    Exit 0
} else {
    Log-PlatformWarn "Documentation link validation: FAILED (found dead links)."
    Exit 1
}
