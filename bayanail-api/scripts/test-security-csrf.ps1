# Script PowerShell de test CSRF manuel
# Usage: .\test-security-csrf.ps1 [API_URL]

param(
    [string]$ApiUrl = "http://localhost:3001"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔒 TESTS CSRF - MONITEUR1D API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

$passed = 0
$failed = 0

# Test 1: Requête sans token CSRF
Write-Host "Test 1: Requête POST sans token CSRF" -ForegroundColor Blue
$body = @{
    firstName = "Test"
    lastName = "User"
    email = "test@example.com"
    phone = "0612345678"
    message = "Test message without CSRF token"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/contact" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "❌ ACCEPTÉ (HTTP $($response.StatusCode)) - VULNÉRABILITÉ CSRF!" -ForegroundColor Red
    Write-Host "   Réponse: $($response.Content)" -ForegroundColor Red
    $failed++
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    
    if ($statusCode -eq 403) {
        Write-Host "✅ BLOQUÉ (HTTP $statusCode) - Protection CSRF active" -ForegroundColor Green
        Write-Host "   Réponse: $errorContent" -ForegroundColor Gray
        $passed++
    }
    else {
        Write-Host "❌ Status inattendu: HTTP $statusCode" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Test 2: Récupérer un token CSRF
Write-Host "Test 2: Récupération du token CSRF" -ForegroundColor Blue
try {
    $csrfResponse = Invoke-WebRequest -Uri "$ApiUrl/auth/csrf-token" `
        -Method GET `
        -SessionVariable session
    
    $csrfData = $csrfResponse.Content | ConvertFrom-Json
    $csrfToken = $csrfData.csrfToken
    
    if ([string]::IsNullOrEmpty($csrfToken)) {
        $csrfToken = $csrfResponse.Headers["X-CSRF-Token"]
    }
    
    if ($csrfToken) {
        Write-Host "✅ Token CSRF récupéré: $($csrfToken.Substring(0, [Math]::Min(20, $csrfToken.Length)))..." -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "❌ Impossible de récupérer le token CSRF" -ForegroundColor Red
        $failed++
    }
}
catch {
    Write-Host "❌ Erreur lors de la récupération du token: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}
Write-Host ""

# Test 3: Requête avec token CSRF valide
if ($csrfToken) {
    Write-Host "Test 3: Requête POST avec token CSRF valide" -ForegroundColor Blue
    $body = @{
        firstName = "Test"
        lastName = "User"
        email = "test@example.com"
        phone = "0612345678"
        message = "Test message with valid CSRF token"
        csrfToken = $csrfToken
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/contact" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "X-CSRF-Token" = $csrfToken } `
            -WebSession $session `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ ACCEPTÉ (HTTP $($response.StatusCode)) - Token CSRF valide" -ForegroundColor Green
        $passed++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 403) {
            Write-Host "❌ REJETÉ (HTTP $statusCode) - Token invalide?" -ForegroundColor Red
            $failed++
        }
        else {
            Write-Host "⚠️  Status inattendu: HTTP $statusCode" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

# Test 4: Requête avec token CSRF invalide
Write-Host "Test 4: Requête POST avec token CSRF invalide" -ForegroundColor Blue
$body = @{
    firstName = "Test"
    lastName = "User"
    email = "test@example.com"
    phone = "0612345678"
    message = "Test message with invalid CSRF token"
    csrfToken = "invalid-token-12345"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/contact" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "X-CSRF-Token" = "invalid-token-12345" } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "❌ ACCEPTÉ (HTTP $($response.StatusCode)) - VULNÉRABILITÉ CSRF!" -ForegroundColor Red
    $failed++
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    
    if ($statusCode -eq 403) {
        Write-Host "✅ BLOQUÉ (HTTP $statusCode) - Token invalide rejeté" -ForegroundColor Green
        Write-Host "   Réponse: $errorContent" -ForegroundColor Gray
        $passed++
    }
    else {
        Write-Host "❌ Status inattendu: HTTP $statusCode" -ForegroundColor Red
        $failed++
    }
}
Write-Host ""

# Résumé
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Réussis: $passed" -ForegroundColor Green
Write-Host "❌ Échoués: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 Tous les tests CSRF sont passés!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Certains tests ont échoué!" -ForegroundColor Yellow
    exit 1
}

