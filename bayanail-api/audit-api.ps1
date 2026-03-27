# Script PowerShell pour lancer l'audit complet de l'API
# Usage: .\audit-api.ps1

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== AUDIT COMPLET DE LA COMMUNICATION API ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Node.js est disponible
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js." -ForegroundColor Red
    exit 1
}

# Vérifier que le fichier .env existe
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
    Write-Host "   Le script fonctionnera mais certaines vérifications échoueront." -ForegroundColor Gray
    Write-Host ""
}

# Vérifier que le serveur est démarré (optionnel)
Write-Host "🔍 Vérification du serveur API..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Serveur API détecté sur http://localhost:3001" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️  Serveur API non détecté sur http://localhost:3001" -ForegroundColor Yellow
    Write-Host "   Certains tests nécessitent que le serveur soit démarré." -ForegroundColor Gray
    Write-Host "   Démarrer avec: npm run dev" -ForegroundColor Gray
    Write-Host ""
}

# Lancer le script d'audit
Write-Host "🚀 Lancement de l'audit..." -ForegroundColor Cyan
Write-Host ""

try {
    npm run audit:api
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Audit terminé avec succès" -ForegroundColor Green
        
        # Trouver le dernier rapport généré
        $reports = Get-ChildItem -Path . -Filter "AUDIT-API-*.md" | Sort-Object LastWriteTime -Descending
        if ($reports.Count -gt 0) {
            $latestReport = $reports[0]
            Write-Host ""
            Write-Host "📄 Rapport détaillé: $($latestReport.FullName)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "💡 Pour ouvrir le rapport:" -ForegroundColor Yellow
            Write-Host "   code $($latestReport.Name)" -ForegroundColor Gray
            Write-Host "   ou" -ForegroundColor Gray
            Write-Host "   notepad $($latestReport.Name)" -ForegroundColor Gray
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

