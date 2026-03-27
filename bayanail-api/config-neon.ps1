# Script pour configurer Neon PostgreSQL

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "=== Configuration Neon PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Verifier le format
if ($DatabaseUrl -notmatch '^postgresql://') {
    Write-Host "ERREUR: L'URL doit commencer par postgresql://" -ForegroundColor Red
    Write-Host "Format attendu: postgresql://user:password@host.neon.tech/dbname" -ForegroundColor Yellow
    exit 1
}

# Mettre a jour le fichier .env
Write-Host "Mise a jour du fichier .env..." -ForegroundColor Yellow

if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    $envContent = $envContent -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$DatabaseUrl`""
    $envContent | Out-File -FilePath .env -Encoding utf8 -NoNewline
    Write-Host "Fichier .env mis a jour!" -ForegroundColor Green
} else {
    Write-Host "Creation du fichier .env..." -ForegroundColor Yellow
    @"
NODE_ENV=development
PORT=3001
FRONTEND_URL="http://localhost:5173"
DATABASE_URL="$DatabaseUrl"
JWT_SECRET="dev_access_token_secret_change_me"
JWT_REFRESH_SECRET="dev_refresh_token_secret_change_me"
ADMIN_EMAIL="admin@bayanail.com"
ADMIN_PASSWORD="change_me_strong_password"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="System"
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "Fichier .env cree!" -ForegroundColor Green
}

Write-Host "`nRegeneration du client Prisma..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n=== Configuration terminee ===" -ForegroundColor Green
Write-Host "`nRedemarrez le serveur avec: npm run dev" -ForegroundColor Yellow


