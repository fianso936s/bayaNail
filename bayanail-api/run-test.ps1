# Script PowerShell pour demarrer le serveur et lancer le test

Write-Host "=== Demarrage du test d'authentification ===" -ForegroundColor Cyan
Write-Host ""

# Verifier si le serveur est deja en cours d'execution
$response = $null
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch {
    # Le serveur n'est pas demarre
}

if ($response -and $response.StatusCode -eq 200) {
    Write-Host "Serveur deja demarre sur http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "Le serveur n'est pas demarre." -ForegroundColor Yellow
    Write-Host "Demarrez le serveur dans un autre terminal avec:" -ForegroundColor Yellow
    Write-Host "  cd bayanail-api" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Appuyez sur Entree une fois le serveur demarre..." -ForegroundColor Yellow
    Read-Host
}

Write-Host ""
Write-Host "Lancement du test d'authentification..." -ForegroundColor Cyan
Write-Host ""

# Récupérer les identifiants depuis .env
$adminEmail = $null
$adminPassword = $null
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    if ($envContent -match 'ADMIN_EMAIL="([^"]+)"') {
        $adminEmail = $matches[1]
    }
    if ($envContent -match 'ADMIN_PASSWORD="([^"]+)"') {
        $adminPassword = $matches[1]
    }
}

if ($adminEmail -and $adminPassword -and $adminPassword -ne "change_me_strong_password") {
    node test-auth.js $adminEmail $adminPassword
} else {
    Write-Host "   Test ignore: ADMIN_PASSWORD non configure ou valeur par defaut" -ForegroundColor Yellow
    Write-Host "   Configurez ADMIN_PASSWORD dans .env pour tester la connexion" -ForegroundColor Gray
    Write-Host "   Ou utilisez: node test-auth.js <email> <password>" -ForegroundColor Gray
}

