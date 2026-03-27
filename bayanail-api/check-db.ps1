# Script PowerShell pour vérifier l'accès à la base de données
# Usage: .\check-db.ps1 [email] [password]

param(
    [string]$Email = "",
    [string]$Password = ""
)

Write-Host "🔍 Vérification de l'accès à la base de données Moniteur1D" -ForegroundColor Cyan
Write-Host ""

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis le répertoire bayanail-api" -ForegroundColor Red
    exit 1
}

# Charger les variables d'environnement
if (Test-Path ".env") {
    Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  Fichier .env non trouvé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Exécution du script de vérification..." -ForegroundColor Cyan
Write-Host ""

if ($Email -and $Password) {
    # Mode test de connexion
    Write-Host "🧪 Mode test de connexion avec: $Email" -ForegroundColor Yellow
    Write-Host ""
    $env:ADMIN_PASSWORD = $Password
    npm run test:login -- $Email $Password
} else {
    # Mode vérification complète
    npm run check:db
}

Write-Host ""
Write-Host "✅ Vérification terminée" -ForegroundColor Green

