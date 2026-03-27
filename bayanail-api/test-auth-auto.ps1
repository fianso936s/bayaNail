# Script pour demarrer le serveur et lancer le test automatiquement

$ErrorActionPreference = "Stop"

Write-Host "=== Test d'authentification automatique ===" -ForegroundColor Cyan
Write-Host ""

# Verifier si le serveur est deja demarre
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "Serveur deja demarre" -ForegroundColor Green
    }
} catch {
    Write-Host "Serveur non demarre, demarrage en cours..." -ForegroundColor Yellow
}

if (-not $serverRunning) {
    # Demarrer le serveur en arriere-plan
    Write-Host "Demarrage du serveur..." -ForegroundColor Yellow
    $serverJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    # Attendre que le serveur soit pret (max 30 secondes)
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    while ($waited -lt $maxWait -and -not $ready) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
                Write-Host "Serveur pret!" -ForegroundColor Green
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $ready) {
        Write-Host ""
        Write-Host "Timeout: Le serveur n'a pas repondu dans les delais" -ForegroundColor Red
        Stop-Job $serverJob
        Remove-Job $serverJob
        exit 1
    }
}

Write-Host ""
Write-Host "Lancement du test..." -ForegroundColor Cyan
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

# Nettoyer le job si on l'a cree
if (-not $serverRunning -and $serverJob) {
    Write-Host ""
    Write-Host "Arret du serveur de test..." -ForegroundColor Yellow
    Stop-Job $serverJob
    Remove-Job $serverJob
}

