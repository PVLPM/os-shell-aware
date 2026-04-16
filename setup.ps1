# setup.ps1 - Plugin installation script for Windows

$PLUGIN_DIR = "$env:USERPROFILE\.config\opencode\plugins\os-shell-aware"
$PLUGIN_FILES = @("detector.js", "rules.js", "translator.js", "reminders.js", "index.js", "package.json")

# Check Node.js version
try {
    $nodeVersion = node -v 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
    $nodeVersion = $nodeVersion -replace 'v', ''
    Write-Host "  Node.js version: $nodeVersion (OK)"
} catch {
    Write-Host "Error: Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Extract major version
$majorVersion = [int]($nodeVersion -split '\.')[0]
if ($majorVersion -lt 18) {
    Write-Host "Error: Node.js 18+ is required. Found version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "Installing os-shell-aware plugin..."

# Create plugin directory
if (-not (Test-Path $PLUGIN_DIR)) {
    New-Item -ItemType Directory -Path $PLUGIN_DIR -Force | Out-Null
}

# Copy plugin files
# Use PSScriptRoot if available, otherwise fall back to current directory
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
foreach ($file in $PLUGIN_FILES) {
    $srcPath = Join-Path $scriptDir $file
    if (Test-Path $srcPath) {
        Copy-Item $srcPath -Destination $PLUGIN_DIR -Force
        Write-Host "  Copied: $file"
    } else {
        Write-Host "  Warning: $file not found, skipping" -ForegroundColor Yellow
    }
}

# Verify installation
$missing = $false
foreach ($file in $PLUGIN_FILES) {
    $destPath = Join-Path $PLUGIN_DIR $file
    if (-not (Test-Path $destPath)) {
        Write-Host "  Error: $file was not copied correctly" -ForegroundColor Red
        $missing = $true
    }
}

if (-not $missing) {
    Write-Host ""
    Write-Host "✅ Installation complete!" -ForegroundColor Green
    Write-Host "   Plugin location: $PLUGIN_DIR"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Restart OpenCode to load the plugin"
    Write-Host "  2. The plugin will automatically detect your OS and shell"
    Write-Host "  3. On Windows/PowerShell, bash commands will be translated to PowerShell"
} else {
    Write-Host ""
    Write-Host "❌ Installation incomplete - some files are missing" -ForegroundColor Red
    exit 1
}
