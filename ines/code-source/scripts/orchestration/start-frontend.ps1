# Script d'orchestration frontend
# Lance le frontend avec build TypeScript et serveur Vite

param(
    [switch]$SkipInstall,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# Configuration
$FrontendDir = Join-Path $PSScriptRoot "..\.."
$LogsBaseDir = Join-Path $PSScriptRoot "..\..\logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$LogDir = Join-Path $LogsBaseDir $Timestamp
$FrontendLogDir = Join-Path $LogDir "frontend"

# Créer les dossiers de logs
New-Item -ItemType Directory -Force -Path $FrontendLogDir | Out-Null

# Fonction de logging
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path (Join-Path $FrontendLogDir "vite.log") -Value $LogMessage
    if ($Level -eq "ERROR") {
        Add-Content -Path (Join-Path $FrontendLogDir "errors.log") -Value $LogMessage
    }
}

Write-Log "Démarrage du script d'orchestration frontend"

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

# Vérifier que le dossier frontend existe
if (-not (Test-Path $FrontendDir)) {
    Write-Log "Le dossier frontend n'existe pas: $FrontendDir" -Level "ERROR"
    exit 1
}

Set-Location $FrontendDir

# Installer les dépendances
if (-not $SkipInstall) {
    Write-Log "Installation des dépendances npm..."
    npm install 2>&1 | ForEach-Object {
        Write-Log $_ "DEBUG"
        Add-Content -Path (Join-Path $FrontendLogDir "vite.log") -Value $_
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erreur lors de l'installation des dépendances" -Level "ERROR"
        exit 1
    }
    Write-Log "Dépendances installées avec succès"
} else {
    Write-Log "Installation des dépendances ignorée (--SkipInstall)"
}

# Build TypeScript
if (-not $SkipBuild) {
    Write-Log "Compilation TypeScript..."
    npx tsc -b 2>&1 | ForEach-Object {
        Write-Log $_ "DEBUG"
        Add-Content -Path (Join-Path $FrontendLogDir "build.log") -Value $_
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Erreurs de compilation TypeScript détectées" -Level "WARN"
        # Ne pas arrêter, Vite peut gérer certaines erreurs
    } else {
        Write-Log "Compilation TypeScript réussie"
    }
} else {
    Write-Log "Compilation TypeScript ignorée (--SkipBuild)"
}

# Vérifier que le fichier .env.local existe (optionnel)
$EnvLocalFile = Join-Path $FrontendDir ".env.local"
if (-not (Test-Path $EnvLocalFile)) {
    Write-Log "Le fichier .env.local n'existe pas. Le proxy Vite sera utilisé." -Level "INFO"
}

# Lancer le serveur Vite
Write-Log "Démarrage du serveur Vite..."
Write-Log "Les logs seront enregistrés dans: $FrontendLogDir"

# Capturer les sorties stdout et stderr
$LogFile = Join-Path $FrontendLogDir "vite.log"
$ErrorLogFile = Join-Path $FrontendLogDir "errors.log"
$BuildLogFile = Join-Path $FrontendLogDir "build.log"

# Lancer le serveur en arrière-plan et capturer les logs
$Process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput $LogFile -RedirectStandardError $ErrorLogFile

Write-Log "Serveur Vite démarré avec PID: $($Process.Id)"
Write-Log "Pour arrêter le serveur, utilisez: Stop-Process -Id $($Process.Id)"

# Surveiller le processus
$Process.WaitForExit()
$ExitCode = $Process.ExitCode

if ($ExitCode -ne 0) {
    Write-Log "Le serveur Vite s'est arrêté avec le code d'erreur: $ExitCode" -Level "ERROR"
    exit $ExitCode
} else {
    Write-Log "Le serveur Vite s'est arrêté normalement"
}

