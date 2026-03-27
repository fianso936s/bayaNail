# Script pour démarrer le frontend local
# Usage: .\start-frontend.ps1

Write-Host "🚀 Démarrage du frontend local..." -ForegroundColor Cyan

# Aller dans le dossier racine
$rootPath = Split-Path -Parent $PSScriptRoot
Set-Location $rootPath

# Vérifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Démarrer le serveur de développement
Write-Host "🌐 Démarrage du serveur Vite..." -ForegroundColor Green
npm run dev
