# Script PowerShell pour lancer l'audit de production
# Usage: .\audit-production.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== AUDIT PRODUCTION SERVEUR ===" -ForegroundColor Cyan
Write-Host "VPS (API) + Hostinger (Frontend)" -ForegroundColor Yellow
Write-Host ""

# Vérifier que Node.js est disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js." -ForegroundColor Red
    exit 1
}

# Demander les URLs de production si non définies
if (-not $env:PROD_API_URL) {
    Write-Host "🌐 Configuration des URLs de production:" -ForegroundColor Yellow
    $apiUrl = Read-Host "URL de l'API (défaut: https://api.bayanail.com)"
    if ($apiUrl) {
        $env:PROD_API_URL = $apiUrl
    } else {
        $env:PROD_API_URL = "https://api.bayanail.com"
    }
    
    $frontendUrl = Read-Host "URL du Frontend (défaut: https://bayanail.com)"
    if ($frontendUrl) {
        $env:PROD_FRONTEND_URL = $frontendUrl
    } else {
        $env:PROD_FRONTEND_URL = "https://bayanail.com"
    }
    Write-Host ""
}

Write-Host "🚀 Lancement de l'audit de production..." -ForegroundColor Cyan
Write-Host ""

try {
    npm run audit:production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Audit terminé avec succès" -ForegroundColor Green
        
        # Trouver le dernier rapport généré
        $reports = Get-ChildItem -Path . -Filter "AUDIT-PRODUCTION-*.md" | Sort-Object LastWriteTime -Descending
        if ($reports.Count -gt 0) {
            $latestReport = $reports[0]
            Write-Host ""
            Write-Host "📄 Rapport détaillé: $($latestReport.FullName)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "💡 Pour ouvrir le rapport:" -ForegroundColor Yellow
            Write-Host "   code $($latestReport.Name)" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Audit terminé avec des erreurs" -ForegroundColor Yellow
        Write-Host "   Consultez le rapport pour plus de détails." -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'exécution de l'audit:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== FIN DE L'AUDIT ===" -ForegroundColor Cyan

