# Script d'orchestration global
# Lance backend et frontend en parallèle

$ErrorActionPreference = "Stop"

# Configuration
$ScriptsDir = $PSScriptRoot
$LogsBaseDir = Join-Path $ScriptsDir "..\..\logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$LogDir = Join-Path $LogsBaseDir $Timestamp

# Créer les dossiers de logs
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Fonction de logging
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    $LogFile = Join-Path $LogDir "orchestration.log"
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "Démarrage de l'orchestration complète (backend + frontend)"

# Variables pour stocker les processus
$BackendProcess = $null
$FrontendProcess = $null

# Fonction de nettoyage
function Stop-All {
    Write-Log "Arrêt des processus..."
    
    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Write-Log "Arrêt du backend (PID: $($BackendProcess.Id))"
        Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Write-Log "Arrêt du frontend (PID: $($FrontendProcess.Id))"
        Stop-Process -Id $FrontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    
    Write-Log "Tous les processus ont été arrêtés"
    exit 0
}

# Gérer Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action { Stop-All } | Out-Null
[Console]::TreatControlCAsInput = $false
$null = Register-ObjectEvent ([System.Console]) CancelKeyPress -Action {
    Stop-All
}

# Lancer le backend
Write-Log "Lancement du backend..."
$BackendScript = Join-Path $ScriptsDir "start-backend.ps1"
$BackendLogFile = Join-Path $LogDir "backend-startup.log"
$BackendErrorFile = Join-Path $LogDir "backend-startup-errors.log"

$BackendProcess = Start-Process -FilePath "powershell" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$BackendScript`"" `
    -NoNewWindow -PassThru `
    -RedirectStandardOutput $BackendLogFile `
    -RedirectStandardError $BackendErrorFile

Write-Log "Backend démarré avec PID: $($BackendProcess.Id)"

# Attendre un peu pour que le backend démarre
Start-Sleep -Seconds 3

# Lancer le frontend
Write-Log "Lancement du frontend..."
$FrontendScript = Join-Path $ScriptsDir "start-frontend.ps1"
$FrontendLogFile = Join-Path $LogDir "frontend-startup.log"
$FrontendErrorFile = Join-Path $LogDir "frontend-startup-errors.log"

$FrontendProcess = Start-Process -FilePath "powershell" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$FrontendScript`"" `
    -NoNewWindow -PassThru `
    -RedirectStandardOutput $FrontendLogFile `
    -RedirectStandardError $FrontendErrorFile

Write-Log "Frontend démarré avec PID: $($FrontendProcess.Id)"

# Générer un rapport de démarrage
$Report = @{
    timestamp = $Timestamp
    backend = @{
        pid = $BackendProcess.Id
        started = $true
    }
    frontend = @{
        pid = $FrontendProcess.Id
        started = $true
    }
    logs = @{
        directory = $LogDir
        backend = Join-Path $LogDir "backend"
        frontend = Join-Path $LogDir "frontend"
    }
}

$ReportFile = Join-Path $LogDir "startup-report.json"
$Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Log "Rapport de démarrage généré: $ReportFile"

Write-Log "Les deux serveurs sont en cours d'exécution"
Write-Log "Appuyez sur Ctrl+C pour arrêter tous les serveurs"

# Surveiller les processus
try {
    while ($true) {
        if ($BackendProcess.HasExited) {
            Write-Log "Le backend s'est arrêté (code: $($BackendProcess.ExitCode))" -Level "WARN"
        }
        if ($FrontendProcess.HasExited) {
            Write-Log "Le frontend s'est arrêté (code: $($FrontendProcess.ExitCode))" -Level "WARN"
        }
        if ($BackendProcess.HasExited -and $FrontendProcess.HasExited) {
            Write-Log "Tous les processus se sont arrêtés"
            break
        }
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Log "Erreur lors de la surveillance: $_" -Level "ERROR"
} finally {
    Stop-All
}

