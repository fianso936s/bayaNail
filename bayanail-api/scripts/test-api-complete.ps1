# Script complet pour tester l'API avec démarrage automatique du serveur
# Usage: .\scripts\test-api-complete.ps1 [email] [password]

param(
    [string]$Email = "",
    [string]$Password = ""
)

$ErrorActionPreference = "Stop"

# Charger les variables d'environnement
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$ADMIN_EMAIL = $env:ADMIN_EMAIL
$ADMIN_PASSWORD = $env:ADMIN_PASSWORD
$API_URL = "http://localhost:3001"

if (-not $Email) {
    $Email = $ADMIN_EMAIL
}
if (-not $Password) {
    $Password = $ADMIN_PASSWORD
}

if (-not $Email -or -not $Password) {
    Write-Host "❌ Email et mot de passe requis" -ForegroundColor Red
    Write-Host "Usage: .\scripts\test-api-complete.ps1 [email] [password]" -ForegroundColor Yellow
    exit 1
}

Write-Host "🧪 Test complet de l'API avec débogage" -ForegroundColor Cyan
Write-Host "─" * 80
Write-Host ""

# Étape 1: Vérifier si le serveur est déjà démarré
Write-Host "📡 Étape 1: Vérification du serveur..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/me" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Serveur déjà démarré (Status: $($response.StatusCode))" -ForegroundColor Green
    $serverRunning = $true
} catch {
    Write-Host "   ⚠️  Serveur non démarré, démarrage en cours..." -ForegroundColor Yellow
    $serverRunning = $false
}

# Étape 2: Démarrer le serveur si nécessaire
if (-not $serverRunning) {
    Write-Host ""
    Write-Host "🚀 Étape 2: Démarrage du serveur..." -ForegroundColor Cyan
    Write-Host "   ⚠️  Veuillez démarrer le serveur manuellement dans un autre terminal:" -ForegroundColor Yellow
    Write-Host "      npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Ensuite, appuyez sur Entrée pour continuer..." -ForegroundColor Yellow
    Read-Host
    
    # Attendre que le serveur démarre
    Write-Host "   Attente du démarrage du serveur..." -ForegroundColor Gray
    $maxAttempts = 30
    $attempt = 0
    $serverReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $serverReady) {
        Start-Sleep -Seconds 1
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "$API_URL/api/auth/me" -Method GET -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            $serverReady = $true
            Write-Host "   ✅ Serveur démarré !" -ForegroundColor Green
        } catch {
            Write-Host "   ." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $serverReady) {
        Write-Host ""
        Write-Host "   ❌ Le serveur n'a pas démarré dans les délais" -ForegroundColor Red
        Write-Host "   Vérifiez les logs du serveur pour des erreurs" -ForegroundColor Yellow
        exit 1
    }
}

# Étape 3: Test de connexion
Write-Host ""
Write-Host "🔐 Étape 3: Test de connexion API..." -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   URL: $API_URL/api/auth/login" -ForegroundColor Gray

try {
    $body = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "   ✅ Status HTTP: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    
    # Vérifier les cookies
    $cookies = $response.Headers['Set-Cookie']
    if ($cookies) {
        Write-Host "   ✅ Cookies reçus" -ForegroundColor Green
        $hasAccessToken = $cookies -match 'accessToken'
        $hasRefreshToken = $cookies -match 'refreshToken'
        Write-Host "      - accessToken: $(if ($hasAccessToken) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasAccessToken) { 'Green' } else { 'Red' })
        Write-Host "      - refreshToken: $(if ($hasRefreshToken) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasRefreshToken) { 'Green' } else { 'Red' })
    } else {
        Write-Host "   ⚠️  Aucun cookie reçu" -ForegroundColor Yellow
    }

    # Lire la réponse
    $data = $response.Content | ConvertFrom-Json

    if ($data.user) {
        Write-Host ""
        Write-Host "✅ Connexion réussie !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Données utilisateur:" -ForegroundColor Cyan
        Write-Host "   ID: $($data.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($data.user.email)" -ForegroundColor Gray
        Write-Host "   Rôle: $($data.user.role)" -ForegroundColor Gray
        if ($data.user.profile) {
            Write-Host "   Nom: $($data.user.profile.firstName) $($data.user.profile.lastName)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "✅ L'API fonctionne correctement !" -ForegroundColor Green
        
        # Test de l'endpoint /me
        Write-Host ""
        Write-Host "👤 Étape 4: Test de l'endpoint /me..." -ForegroundColor Cyan
        Write-Host "   ⚠️  Pour tester /me, vous devez utiliser les cookies" -ForegroundColor Yellow
        Write-Host "   Exemple curl:" -ForegroundColor Gray
        if ($cookies) {
            $cookieString = ($cookies -split ',')[0] -replace ';.*', ''
            Write-Host "   curl -X GET `"$API_URL/api/auth/me`" -H `"Cookie: $cookieString`"" -ForegroundColor Gray
        }
        
    } else {
        Write-Host ""
        Write-Host "❌ Échec de la connexion" -ForegroundColor Red
        Write-Host "   Message: $($data.message)" -ForegroundColor Red
        if ($data.errors) {
            Write-Host "   Erreurs: $($data.errors | ConvertTo-Json)" -ForegroundColor Red
        }
    }

} catch {
    $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode.value__ } else { 0 }
    $errorMessage = $_.Exception.Message
    
    Write-Host ""
    Write-Host "❌ Erreur lors de la connexion" -ForegroundColor Red
    
    if ($statusCode -ne 0) {
        Write-Host "   Status: $statusCode" -ForegroundColor Red
        
        # Lire le message d'erreur si disponible
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
            Write-Host "   Message: $($errorBody.message)" -ForegroundColor Red
        } catch {
            Write-Host "   Message: $errorMessage" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "🔍 Analyse:" -ForegroundColor Yellow
        switch ($statusCode) {
            401 {
                Write-Host "   - Status 401 = Identifiants invalides" -ForegroundColor Gray
                Write-Host "   - Vérifiez l'email et le mot de passe" -ForegroundColor Gray
                Write-Host "   - Testez avec: npm run test:login -- $Email $Password" -ForegroundColor Gray
            }
            400 {
                Write-Host "   - Status 400 = Requête invalide" -ForegroundColor Gray
                Write-Host "   - Vérifiez le format JSON" -ForegroundColor Gray
            }
            500 {
                Write-Host "   - Status 500 = Erreur serveur" -ForegroundColor Gray
                Write-Host "   - Vérifiez les logs du serveur" -ForegroundColor Gray
            }
            default {
                Write-Host "   - Status $statusCode = Erreur inconnue" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   Erreur réseau: $errorMessage" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔍 Causes possibles:" -ForegroundColor Yellow
        Write-Host "   - Le serveur n'est pas démarré" -ForegroundColor Gray
        Write-Host "   - Le port 3001 n'est pas accessible" -ForegroundColor Gray
        Write-Host "   - Problème de réseau/firewall" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "─" * 80
Write-Host "✅ Test terminé" -ForegroundColor Green

