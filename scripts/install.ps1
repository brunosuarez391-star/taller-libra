# install.ps1 - Script de instalación de Windows para Libra Flota
# Instala los requisitos previos mediante winget y configura el proyecto

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n=> $Message" -ForegroundColor Cyan
}

# Verificar si winget está disponible
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: winget no está disponible. Por favor, instale App Installer desde la Microsoft Store." -ForegroundColor Red
    exit 1
}

# Instalar PowerShell (última versión estable)
Write-Step "Instalando PowerShell..."
winget install --id Microsoft.PowerShell --source winget --accept-source-agreements --accept-package-agreements

# Instalar Node.js LTS
Write-Step "Instalando Node.js LTS..."
winget install --id OpenJS.NodeJS.LTS --source winget --accept-source-agreements --accept-package-agreements

# Instalar Git
Write-Step "Instalando Git..."
winget install --id Git.Git --source winget --accept-source-agreements --accept-package-agreements

# Actualizar PATH para que las herramientas recién instaladas estén disponibles
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Instalar dependencias de npm
Write-Step "Instalando dependencias de npm..."
npm install

Write-Host "`nInstalación completada! Ejecute 'npm run dev' para iniciar la aplicación." -ForegroundColor Green
