# Script de diagnostic complet

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

Write-Host "=== DIAGNOSTIC COMPLET ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier le fichier .env
Write-Host "1. Configuration .env:" -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    Write-Host "   Fichier .env trouve" -ForegroundColor Green
    
    if ($envContent -match 'DATABASE_URL="([^"]+)"') {
        $dbUrl = $matches[1]
        Write-Host "   DATABASE_URL: $dbUrl" -ForegroundColor White
        
        if ($dbUrl -match 'mysql://') {
            Write-Host "   Type: MySQL" -ForegroundColor Green
        } elseif ($dbUrl -match 'postgresql://') {
            Write-Host "   Type: PostgreSQL" -ForegroundColor Green
        } else {
            Write-Host "   ATTENTION: Format d'URL non reconnu!" -ForegroundColor Red
        }
        
        if ($dbUrl -match 'USER:PASSWORD') {
            Write-Host "   ERREUR: DATABASE_URL contient des placeholders!" -ForegroundColor Red
            Write-Host "   Vous devez remplacer USER et PASSWORD par vos vraies valeurs" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ERREUR: DATABASE_URL non trouve dans .env" -ForegroundColor Red
    }
    
    if ($envContent -match 'ADMIN_PASSWORD="([^"]+)"') {
        $adminPass = $matches[1]
        Write-Host "   ADMIN_PASSWORD: Configure" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR: ADMIN_PASSWORD non configure" -ForegroundColor Red
    }
} else {
    Write-Host "   ERREUR: Fichier .env non trouve!" -ForegroundColor Red
}

# 2. Verifier le schema Prisma
Write-Host "`n2. Schema Prisma:" -ForegroundColor Yellow
if (Test-Path prisma/schema.prisma) {
    $schema = Get-Content prisma/schema.prisma -Raw
    if ($schema -match 'provider\s*=\s*"([^"]+)"') {
        $provider = $matches[1]
        Write-Host "   Provider: $provider" -ForegroundColor White
    }
}

# 3. Verifier le serveur
Write-Host "`n3. Serveur API:" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   Serveur actif sur http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "   Serveur non accessible sur http://localhost:3001" -ForegroundColor Red
    Write-Host "   Demarrez-le avec: npm run dev" -ForegroundColor Yellow
}

# 4. Test de connexion
Write-Host "`n4. Test de connexion:" -ForegroundColor Yellow
$adminEmail = $null
$adminPassword = $null
if ($envContent -match 'ADMIN_EMAIL="([^"]+)"') {
    $adminEmail = $matches[1]
}
if ($envContent -match 'ADMIN_PASSWORD="([^"]+)"') {
    $adminPassword = $matches[1]
}

if ($adminEmail -and $adminPassword -and $adminPassword -ne "change_me_strong_password") {
    try {
        $body = @{email=$adminEmail;password=$adminPassword} | ConvertTo-Json
        $login = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
        Write-Host "   Connexion REUSSIE!" -ForegroundColor Green
        Write-Host "   Reponse: $($login.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "   Connexion ECHOUE" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Erreur: $responseBody" -ForegroundColor Yellow
        } else {
            Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   Test de connexion ignore (ADMIN_PASSWORD non configure ou valeur par defaut)" -ForegroundColor Yellow
    Write-Host "   Configurez ADMIN_PASSWORD dans .env pour tester la connexion" -ForegroundColor Gray
}

Write-Host "`n=== FIN DU DIAGNOSTIC ===" -ForegroundColor Cyan


