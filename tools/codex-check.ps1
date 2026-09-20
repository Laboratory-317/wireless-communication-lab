param(
    [switch]$Serve,
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$toolsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $toolsRoot

function Step($Message) {
    Write-Host "[codex] $Message"
}

function Require-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command is not available: $Name"
    }
}

Set-Location -LiteralPath $root

Require-Command "node"
Require-Command "git"

Step "Repository status"
git status --short --branch

Step "Regenerating research diagrams"
node tools/build-diagrams.js
if ($LASTEXITCODE -ne 0) { throw "Diagram generation failed." }

Step "Regenerating js/lab-content.js"
node tools/build-content.js
if ($LASTEXITCODE -ne 0) {
    throw "Content generation failed."
}

Step "Checking theme showcase structure"
powershell -ExecutionPolicy Bypass -File .\setup-theme-showcase.ps1
if ($LASTEXITCODE -ne 0) {
    throw "Theme showcase check failed."
}

Step "Checking generated content is valid JavaScript"
node -e "const fs=require('fs'); const vm=require('vm'); vm.runInNewContext(fs.readFileSync('js/lab-content.js','utf8'), { window: {} });"
if ($LASTEXITCODE -ne 0) { throw "Generated JavaScript validation failed." }

Step "Checking all theme and language renders, links, and images"
node tools/check-site.js
if ($LASTEXITCODE -ne 0) { throw "Site checks failed." }

Step "Checking required entry points"
$requiredFiles = @(
    "index.html",
    "css\style.css",
    "js\main.js",
    "js\render-theme.js",
    "js\lab-content.js",
    "content\site.md"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $root $file))) {
        throw "Missing required file: $file"
    }
}

Step "Post-check status"
git status --short

if ($Serve) {
    Require-Command "python"
    Step "Serving http://127.0.0.1:$Port/ from $root"
    python -m http.server $Port --bind 127.0.0.1
}

Step "Done"
