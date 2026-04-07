# install.ps1 - Windows setup script for Libra Flota
# Installs prerequisites via winget and sets up the project

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n=> $Message" -ForegroundColor Cyan
}

# Check if winget is available
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: winget is not available. Please install App Installer from the Microsoft Store." -ForegroundColor Red
    exit 1
}

# Install PowerShell (latest stable)
Write-Step "Installing PowerShell..."
winget install --id Microsoft.PowerShell --source winget --accept-source-agreements --accept-package-agreements

# Install Node.js LTS
Write-Step "Installing Node.js LTS..."
winget install --id OpenJS.NodeJS.LTS --source winget --accept-source-agreements --accept-package-agreements

# Install Git
Write-Step "Installing Git..."
winget install --id Git.Git --source winget --accept-source-agreements --accept-package-agreements

# Refresh PATH so newly installed tools are available
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Install npm dependencies
Write-Step "Installing npm dependencies..."
npm install

Write-Host "`nSetup complete! Run 'npm run dev' to start the app." -ForegroundColor Green
