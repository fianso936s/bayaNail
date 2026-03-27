# Script de validation continue
# Lance tous les serveurs, exécute les tests, analyse les logs et applique les corrections

param(
    [int]$MaxIterations = 5,
    [switch]$SkipAutoFix
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptsDir = $PSScriptRoot
$RootDir = Join-Path $ScriptsDir "..\.."
$LogsBaseDir = Join-Path $RootDir "logs"
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
    $LogFile = Join-Path $LogDir "validation.log"
    Add-Content -Path $LogFile -Value $LogMessage
}

Write-Log "Démarrage de la validation continue"

# Étape 1: Lancer tous les serveurs
Write-Log "Étape 1: Lancement des serveurs..."
$StartAllScript = Join-Path $ScriptsDir "start-all.ps1"
$StartAllProcess = Start-Process -FilePath "powershell" `
    -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "`"$StartAllScript`"" `
    -NoNewWindow -PassThru

Write-Log "Attente du démarrage des serveurs (30 secondes)..."
Start-Sleep -Seconds 30

# Étape 2: Health checks
Write-Log "Étape 2: Vérification de la santé des serveurs..."

$BackendHealthy = $false
$FrontendHealthy = $false

try {
    $BackendResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction Stop
    if ($BackendResponse.StatusCode -eq 200) {
        $BackendHealthy = $true
        Write-Log "Backend est en ligne"
    }
} catch {
    Write-Log "Backend n'est pas accessible: $_" -Level "WARN"
}

try {
    $FrontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -ErrorAction Stop
    if ($FrontendResponse.StatusCode -eq 200) {
        $FrontendHealthy = $true
        Write-Log "Frontend est en ligne"
    }
} catch {
    Write-Log "Frontend n'est pas accessible: $_" -Level "WARN"
}

if (-not $BackendHealthy) {
    Write-Log "Le backend n'est pas accessible. Vérifiez les logs." -Level "ERROR"
}

# Étape 3: Exécuter les tests
Write-Log "Étape 3: Exécution des tests d'endpoints..."
Set-Location $RootDir

$TestScript = Join-Path $ScriptsDir "..\testing\test-all-endpoints.ts"
if (Test-Path $TestScript) {
    $TestLogFile = Join-Path $LogDir "tests-execution.log"
    npx tsx $TestScript 2>&1 | Tee-Object -FilePath $TestLogFile
    $TestExitCode = $LASTEXITCODE
    Write-Log "Tests terminés avec le code: $TestExitCode"
} else {
    Write-Log "Script de test non trouvé: $TestScript" -Level "ERROR"
    $TestExitCode = 1
}

# Étape 4: Analyser les logs
Write-Log "Étape 4: Analyse des logs..."
$AnalyzeScript = Join-Path $ScriptsDir "..\analysis\analyze-logs.ts"
if (Test-Path $AnalyzeScript) {
    $AnalyzeLogFile = Join-Path $LogDir "analysis-execution.log"
    npx tsx $AnalyzeScript --logDir $LogDir 2>&1 | Tee-Object -FilePath $AnalyzeLogFile
    $AnalyzeExitCode = $LASTEXITCODE
    Write-Log "Analyse terminée avec le code: $AnalyzeExitCode"
} else {
    Write-Log "Script d'analyse non trouvé: $AnalyzeScript" -Level "ERROR"
    $AnalyzeExitCode = 1
}

# Étape 5: Appliquer les corrections (si activé)
$Iteration = 0
$AllTestsPassed = $false

while ($Iteration -lt $MaxIterations -and -not $AllTestsPassed) {
    $Iteration++
    Write-Log "Itération $Iteration/$MaxIterations"
    
    if (-not $SkipAutoFix -and $TestExitCode -ne 0) {
        Write-Log "Application des corrections automatiques..."
        $FixScript = Join-Path $ScriptsDir "..\auto-fix\apply-fixes.ts"
        if (Test-Path $FixScript) {
            $FixLogFile = Join-Path $LogDir "fixes-iteration-$Iteration.log"
            npx tsx $FixScript --logDir $LogDir 2>&1 | Tee-Object -FilePath $FixLogFile
            
            # Relancer les tests après les corrections
            Write-Log "Relance des tests après corrections..."
            Start-Sleep -Seconds 5
            npx tsx $TestScript 2>&1 | Tee-Object -FilePath (Join-Path $LogDir "tests-after-fix-$Iteration.log")
            $TestExitCode = $LASTEXITCODE
            
            if ($TestExitCode -eq 0) {
                $AllTestsPassed = $true
                Write-Log "Tous les tests passent maintenant!"
            }
        }
    } else {
        if ($TestExitCode -eq 0) {
            $AllTestsPassed = $true
        }
        break
    }
}

# Générer le rapport final
Write-Log "Génération du rapport final..."

$Report = @{
    timestamp = $Timestamp
    backend = @{
        healthy = $BackendHealthy
    }
    frontend = @{
        healthy = $FrontendHealthy
    }
    tests = @{
        exitCode = $TestExitCode
        passed = ($TestExitCode -eq 0)
    }
    analysis = @{
        exitCode = $AnalyzeExitCode
    }
    iterations = $Iteration
    allTestsPassed = $AllTestsPassed
    logs = @{
        directory = $LogDir
    }
}

$ReportFile = Join-Path $LogDir "report.json"
$Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Log "Rapport final généré: $ReportFile"

# Arrêter les serveurs
Write-Log "Arrêt des serveurs..."
if ($StartAllProcess -and -not $StartAllProcess.HasExited) {
    Stop-Process -Id $StartAllProcess.Id -Force -ErrorAction SilentlyContinue
}

if ($AllTestsPassed) {
    Write-Log "Validation réussie! Tous les tests passent."
    exit 0
} else {
    Write-Log "Validation échouée. Consultez les logs pour plus de détails." -Level "ERROR"
    exit 1
}

