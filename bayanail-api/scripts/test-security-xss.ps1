# Script PowerShell de test XSS manuel
# Usage: .\test-security-xss.ps1 [API_URL]

param(
    [string]$ApiUrl = "http://localhost:3001"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTS XSS - MONITEUR1D API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Payloads XSS à tester
$payloads = @(
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src='javascript:alert(\"XSS\")'></iframe>",
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<details open ontoggle=alert('XSS')>"
)

$passed = 0
$failed = 0

foreach ($payload in $payloads) {
    Write-Host "Test: firstName = $($payload.Substring(0, [Math]::Min(30, $payload.Length)))..." -ForegroundColor Yellow
    
    $body = @{
        firstName = $payload
        lastName = "Test"
        email = "test@example.com"
        phone = "0612345678"
        message = "Test message"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/contact" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "❌ ACCEPTÉ (HTTP $($response.StatusCode)) - VULNÉRABILITÉ!" -ForegroundColor Red
        Write-Host "   Réponse: $($response.Content)" -ForegroundColor Red
        $failed++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorContent = $_.ErrorDetails.Message
        
        if ($statusCode -eq 400 -or $statusCode -eq 403) {
            Write-Host "✅ BLOQUÉ (HTTP $statusCode)" -ForegroundColor Green
            Write-Host "   Réponse: $errorContent" -ForegroundColor Gray
            $passed++
        }
        else {
            Write-Host "❌ Status inattendu: HTTP $statusCode" -ForegroundColor Red
            Write-Host "   Réponse: $errorContent" -ForegroundColor Red
            $failed++
        }
    }
    Write-Host ""
}

# Résumé
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Réussis: $passed" -ForegroundColor Green
Write-Host "❌ Échoués: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 Tous les tests XSS sont passés!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Certains tests ont échoué!" -ForegroundColor Yellow
    exit 1
}

