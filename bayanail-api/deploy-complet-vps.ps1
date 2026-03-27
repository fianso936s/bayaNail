# Script complet de deploiement sur le VPS
# Trouve le chemin, met a jour .env, deploie et verifie

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "DEPLOIEMENT COMPLET SUR LE VPS" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""

# Configuration
$VPS_HOST = "root@62.72.18.224"

# Etape 1: Build local
Write-Host "Etape 1: Build du projet local..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build" -ForegroundColor Red
    exit 1
}
Write-Host "Build reussi" -ForegroundColor Green
Write-Host ""

# Etape 2: Trouver le chemin sur le VPS
Write-Host "Etape 2: Recherche du chemin sur le VPS..." -ForegroundColor Yellow

# Copier le script de recherche
scp find-api-path.sh "${VPS_HOST}:/tmp/find-api-path.sh" 2>&1 | Out-Null

$apiPath = ssh $VPS_HOST "bash /tmp/find-api-path.sh" 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($apiPath)) {
    Write-Host "Chemin non trouve automatiquement" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez vous connecter manuellement et trouver le chemin:" -ForegroundColor Yellow
    Write-Host "   ssh $VPS_HOST" -ForegroundColor Gray
    Write-Host "   find / -name 'package.json' -path '*/bayanail-api/*' 2>/dev/null" -ForegroundColor Gray
    exit 1
}

$apiPath = $apiPath.Trim()
Write-Host "Chemin trouve: $apiPath" -ForegroundColor Green
Write-Host ""

# Etape 3: Mettre a jour le .env
Write-Host "Etape 3: Mise a jour du fichier .env..." -ForegroundColor Yellow

# Copier le script de mise a jour
scp update-env-vps.sh "${VPS_HOST}:/tmp/update-env-vps.sh" 2>&1 | Out-Null

# Executer le script avec le chemin en parametre
ssh $VPS_HOST "bash /tmp/update-env-vps.sh $apiPath" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ".env mis a jour" -ForegroundColor Green
} else {
    Write-Host "Erreur lors de la mise a jour du .env" -ForegroundColor Yellow
}
Write-Host ""

# Etape 4: Copier le dossier dist
Write-Host "Etape 4: Copie du dossier dist..." -ForegroundColor Yellow

if (Test-Path "dist") {
    $scpTargetDist = "${VPS_HOST}:${apiPath}/"
    scp -r dist $scpTargetDist 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Fichiers copies" -ForegroundColor Green
    } else {
        Write-Host "Erreur lors de la copie" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dossier dist non trouve" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Etape 5: Redemarrer le serveur
Write-Host "Etape 5: Redemarrage du serveur..." -ForegroundColor Yellow

$restartCmd = "cd $apiPath && pm2 restart bayanail-api"
ssh $VPS_HOST "$restartCmd" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Serveur redemarre" -ForegroundColor Green
} else {
    Write-Host "Erreur lors du redemarrage PM2, essayez systemd..." -ForegroundColor Yellow
    $systemdCmd = "cd $apiPath && systemctl restart bayanail-api"
    ssh $VPS_HOST "$systemdCmd" 2>&1 | Out-Null
}
Write-Host ""

# Etape 6: Verification
Write-Host "Etape 6: Verification..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 3

# Verifier les logs
Write-Host "Dernieres lignes des logs:" -ForegroundColor Cyan
$logsCmd = "cd $apiPath && pm2 logs bayanail-api --lines 10 --nostream"
ssh $VPS_HOST "$logsCmd" 2>&1

Write-Host ""
Write-Host "Test de l endpoint health:" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "https://api.bayanail.com/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "API accessible: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Reponse: $($healthResponse.Content)" -ForegroundColor Gray
} catch {
    Write-Host "API non accessible: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host "DEPLOIEMENT TERMINE" -ForegroundColor Green
Write-Host ""
Write-Host "Resume:" -ForegroundColor Cyan
Write-Host "   - Chemin VPS: $apiPath" -ForegroundColor Gray
Write-Host "   - .env mis a jour avec Neon PostgreSQL" -ForegroundColor Gray
Write-Host "   - Code deploye" -ForegroundColor Gray
Write-Host "   - Serveur redemarre" -ForegroundColor Gray
Write-Host ""
Write-Host "Testez avec:" -ForegroundColor Yellow
Write-Host "   npm run audit:production" -ForegroundColor Gray
