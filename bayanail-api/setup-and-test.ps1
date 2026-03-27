# Script automatique pour configurer et tester l'authentification

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "=== Configuration et Test Automatique ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier/Creer le fichier .env
Write-Host "1. Verification du fichier .env..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "   ATTENTION: Fichier .env non trouve!" -ForegroundColor Red
    Write-Host "   Vous devez configurer DATABASE_URL avec votre URL Neon PostgreSQL" -ForegroundColor Yellow
    Write-Host "   Utilisez: .\config-neon.ps1 -DatabaseUrl 'postgresql://...'" -ForegroundColor Yellow
    Write-Host "   Ou creez manuellement le fichier .env avec la configuration correcte" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "   Fichier .env existe deja" -ForegroundColor Green
    
    # Verifier que DATABASE_URL est configuree
    $envContent = Get-Content .env -Raw
    if ($envContent -notmatch 'DATABASE_URL="postgresql://') {
        Write-Host "   ATTENTION: DATABASE_URL ne semble pas etre configuree pour PostgreSQL Neon" -ForegroundColor Yellow
        Write-Host "   Verifiez que votre .env contient une URL PostgreSQL Neon valide" -ForegroundColor Yellow
    } else {
        Write-Host "   DATABASE_URL configuree pour PostgreSQL" -ForegroundColor Green
    }
}

# 2. Charger les variables d'environnement
Write-Host "`n2. Chargement des variables d'environnement..." -ForegroundColor Yellow
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "   Variables chargees" -ForegroundColor Green
}

# 3. Verifier si le serveur est deja demarre
Write-Host "`n3. Verification du serveur..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "   Serveur deja demarre" -ForegroundColor Green
    }
} catch {
    Write-Host "   Serveur non demarre" -ForegroundColor Yellow
}

# 4. Demarrer le serveur si necessaire
if (-not $serverRunning) {
    Write-Host "`n4. Demarrage du serveur..." -ForegroundColor Yellow
    Write-Host "   Lancement en arriere-plan..." -ForegroundColor Gray
    
    # Demarrer le serveur dans un nouveau processus
    $serverProcess = Start-Process -FilePath "node" -ArgumentList "node_modules/tsx/dist/cli.js", "src/index.ts" -PassThru -WindowStyle Hidden -WorkingDirectory $PWD
    
    # Attendre que le serveur soit pret
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    Write-Host "   Attente du demarrage..." -ForegroundColor Gray
    while ($waited -lt $maxWait -and -not $ready) {
        Start-Sleep -Seconds 2
        $waited += 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $ready = $true
                Write-Host "   Serveur pret!" -ForegroundColor Green
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $ready) {
        Write-Host ""
        Write-Host "   ERREUR: Le serveur n'a pas demarre dans les delais" -ForegroundColor Red
        Write-Host "   Verifiez les logs et la configuration de la base de donnees" -ForegroundColor Yellow
        if ($serverProcess) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

# 5. Lancer le test
Write-Host "`n5. Lancement du test d'authentification..." -ForegroundColor Yellow
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
}

# 6. Nettoyage
if (-not $serverRunning -and $serverProcess) {
    Write-Host "`n6. Arret du serveur de test..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "`n=== Termine ===" -ForegroundColor Cyan


