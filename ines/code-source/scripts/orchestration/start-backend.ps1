# Script d'orchestration backend
# Lance le backend avec migrations Prisma et logging structuré

param(
    [switch]$SkipInstall,
    [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"

# Configuration
$BackendDir = Join-Path $PSScriptRoot "..\..\bayanail-api"
$LogsBaseDir = Join-Path $PSScriptRoot "..\..\logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$LogDir = Join-Path $LogsBaseDir $Timestamp
$BackendLogDir = Join-Path $LogDir "backend"

# Créer les dossiers de logs
New-Item -ItemType Directory -Force -Path $BackendLogDir | Out-Null

# Fonction de logging
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path (Join-Path $BackendLogDir "server.log") -Value $LogMessage
    if ($Level -eq "ERROR") {
        Add-Content -Path (Join-Path $BackendLogDir "errors.log") -Value $LogMessage
    }
}

Write-Log "Démarrage du script d'orchestration backend"

# Vérifier les dépendances
Write-Log "Vérification des dépendances..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Log "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/" -Level "ERROR"
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Log "npm n'est pas installé. Veuillez l'installer." -Level "ERROR"
    exit 1
}

$NodeVersion = node --version
$NpmVersion = npm --version
Write-Log "Node.js version: $NodeVersion"
Write-Log "npm version: $NpmVersion"

# Vérifier que le dossier backend existe
if (-not (Test-Path $BackendDir)) {
    Write-Log "Le dossier backend n'existe pas: $BackendDir" -Level "ERROR"
    exit 1
}

Set-Location $BackendDir

# Installer les dépendances
if (-not $SkipInstall) {
    Write-Log "Installation des dépendances npm..."
    npm install 2>&1 | ForEach-Object {
        Write-Log $_ "DEBUG"
        Add-Content -Path (Join-Path $BackendLogDir "server.log") -Value $_
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erreur lors de l'installation des dépendances" -Level "ERROR"
        exit 1
    }
    Write-Log "Dépendances installées avec succès"
} else {
    Write-Log "Installation des dépendances ignorée (--SkipInstall)"
}

# Générer le client Prisma
Write-Log "Génération du client Prisma..."
npx prisma generate 2>&1 | ForEach-Object {
    Write-Log $_ "DEBUG"
    Add-Content -Path (Join-Path $BackendLogDir "prisma.log") -Value $_
}
if ($LASTEXITCODE -ne 0) {
    Write-Log "Erreur lors de la génération du client Prisma" -Level "ERROR"
    exit 1
}
Write-Log "Client Prisma généré avec succès"

# Appliquer les migrations
if (-not $SkipMigrations) {
    Write-Log "Application des migrations Prisma..."
    
    # Essayer migrate deploy d'abord (pour production)
    npx prisma migrate deploy 2>&1 | ForEach-Object {
        Write-Log $_ "DEBUG"
        Add-Content -Path (Join-Path $BackendLogDir "prisma.log") -Value $_
    }
    
    # Si deploy échoue, essayer migrate dev (pour développement)
    if ($LASTEXITCODE -ne 0) {
        Write-Log "migrate deploy a échoué, tentative avec migrate dev..."
        npx prisma migrate dev --name auto_migration 2>&1 | ForEach-Object {
            Write-Log $_ "DEBUG"
            Add-Content -Path (Join-Path $BackendLogDir "prisma.log") -Value $_
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Erreur lors de l'application des migrations" -Level "ERROR"
            exit 1
        }
    }
    Write-Log "Migrations appliquées avec succès"
} else {
    Write-Log "Application des migrations ignorée (--SkipMigrations)"
}

# Vérifier que le fichier .env existe
$EnvFile = Join-Path $BackendDir ".env"
if (-not (Test-Path $EnvFile)) {
    Write-Log "Le fichier .env n'existe pas. Vérifiez la configuration." -Level "WARN"
}

# Lancer le serveur
Write-Log "Démarrage du serveur backend..."
Write-Log "Les logs seront enregistrés dans: $BackendLogDir"

# Capturer les sorties stdout et stderr
$LogFile = Join-Path $BackendLogDir "server.log"
$ErrorLogFile = Join-Path $BackendLogDir "errors.log"

# Lancer le serveur en arrière-plan et capturer les logs
$Process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $ErrorLogFile

Write-Log "Serveur backend démarré avec PID: $($Process.Id)"
Write-Log "Pour arrêter le serveur, utilisez: Stop-Process -Id $($Process.Id)"

# Surveiller le processus
$Process.WaitForExit()
$ExitCode = $Process.ExitCode

if ($ExitCode -ne 0) {
    Write-Log "Le serveur backend s'est arrêté avec le code d'erreur: $ExitCode" -Level "ERROR"
    exit $ExitCode
} else {
    Write-Log "Le serveur backend s'est arrêté normalement"
}

