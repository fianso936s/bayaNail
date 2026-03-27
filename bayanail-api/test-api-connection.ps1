# Script PowerShell pour tester la connexion API
# Usage: .\test-api-connection.ps1 [email] [password]

param(
    [string]$Email = "",
    [string]$Password = ""
)

$API_URL = "http://localhost:3001"
$ADMIN_EMAIL = "admin@bayanail.com"

Write-Host "🌐 Test de connexion via l'API" -ForegroundColor Cyan
Write-Host "   URL: $API_URL/api/auth/login" -ForegroundColor Gray
Write-Host ""

# Charger les variables d'environnement
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    
    if ($env:ADMIN_EMAIL) {
        $ADMIN_EMAIL = $env:ADMIN_EMAIL
    }
    if ($env:ADMIN_PASSWORD -and -not $Password) {
        $Password = $env:ADMIN_PASSWORD
    }
}

if (-not $Email) {
    $Email = $ADMIN_EMAIL
}

if (-not $Password) {
    Write-Host "❌ Mot de passe requis" -ForegroundColor Red
    Write-Host "Usage: .\test-api-connection.ps1 [email] [password]" -ForegroundColor Yellow
    Write-Host "Exemple: .\test-api-connection.ps1 admin@bayanail.com VotreMotDePasse" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Étape 1: Vérification que le serveur est accessible..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "$API_URL/api/auth/me" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Serveur accessible (Status: $($healthCheck.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Serveur non accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Assurez-vous que le serveur est démarré:" -ForegroundColor Yellow
    Write-Host "   1. Ouvrez un nouveau terminal" -ForegroundColor Gray
    Write-Host "   2. cd bayanail-api" -ForegroundColor Gray
    Write-Host "   3. npm run dev" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "🔐 Étape 2: Tentative de connexion..." -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Mot de passe: $('*' * $Password.Length)" -ForegroundColor Gray

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
    Write-Host "   Status HTTP: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    
    # Vérifier les cookies
    $cookies = $response.Headers['Set-Cookie']
    if ($cookies) {
        Write-Host "   Cookies reçus: ✅ Oui" -ForegroundColor Green
        $hasAccessToken = $cookies -match 'accessToken'
        $hasRefreshToken = $cookies -match 'refreshToken'
        Write-Host "   - accessToken: $(if ($hasAccessToken) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasAccessToken) { 'Green' } else { 'Red' })
        Write-Host "   - refreshToken: $(if ($hasRefreshToken) { '✅' } else { '❌' })" -ForegroundColor $(if ($hasRefreshToken) { 'Green' } else { 'Red' })
    } else {
        Write-Host "   Cookies reçus: ❌ Non" -ForegroundColor Red
    }

    # Lire la réponse
    $data = $response.Content | ConvertFrom-Json

    if ($data.user) {
        Write-Host ""
        Write-Host "✅ Connexion réussie !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Données utilisateur retournées:" -ForegroundColor Cyan
        Write-Host "   ID: $($data.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($data.user.email)" -ForegroundColor Gray
        Write-Host "   Rôle: $($data.user.role)" -ForegroundColor Gray
        if ($data.user.profile) {
            Write-Host "   Nom: $($data.user.profile.firstName) $($data.user.profile.lastName)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "✅ L'API fonctionne correctement !" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 Pour tester l'endpoint /me, utilisez:" -ForegroundColor Yellow
        Write-Host "   curl -X GET `"$API_URL/api/auth/me`" -H `"Cookie: $cookies`"" -ForegroundColor Gray
        
    } else {
        Write-Host ""
        Write-Host "❌ Échec de la connexion" -ForegroundColor Red
        Write-Host "   Message: $($data.message)" -ForegroundColor Red
    }

} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.Exception.Message
    
    Write-Host ""
    Write-Host "❌ Erreur lors de la connexion" -ForegroundColor Red
    Write-Host "   Status: $statusCode" -ForegroundColor Red
    Write-Host "   Message: $errorMessage" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "🔍 Analyse:" -ForegroundColor Yellow
        Write-Host "   - Status 401 = Identifiants invalides" -ForegroundColor Gray
        Write-Host "   - Vérifiez que l'email et le mot de passe sont corrects" -ForegroundColor Gray
        Write-Host "   - Testez avec: npm run test:login -- $Email $Password" -ForegroundColor Gray
    } elseif ($statusCode -eq 400) {
        Write-Host ""
        Write-Host "🔍 Analyse:" -ForegroundColor Yellow
        Write-Host "   - Status 400 = Requête invalide" -ForegroundColor Gray
        Write-Host "   - Vérifiez le format de la requête" -ForegroundColor Gray
    } elseif ($statusCode -eq 500) {
        Write-Host ""
        Write-Host "🔍 Analyse:" -ForegroundColor Yellow
        Write-Host "   - Status 500 = Erreur serveur" -ForegroundColor Gray
        Write-Host "   - Vérifiez les logs du serveur backend" -ForegroundColor Gray
    }
}

