# Script d'audit complet
# Lance tous les scripts et génère un rapport d'audit

$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot | Split-Path -Parent
$LogsBaseDir = Join-Path $RootDir "logs"
$Timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$LogDir = Join-Path $LogsBaseDir $Timestamp

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

Write-Host "=== AUDIT COMPLET DU DEPOT MONITEUR1D-WEB ===" -ForegroundColor Cyan
Write-Host "Horodatage: $Timestamp" -ForegroundColor Gray
Write-Host "Repertoire de logs: $LogDir" -ForegroundColor Gray
Write-Host ""

# 1. Verification de la structure
Write-Host "1. Verification de la structure du depot..." -ForegroundColor Yellow
$StructureCheck = @{
    timestamp = $Timestamp
    checks = @()
}

$checks = @(
    @{ name = "Frontend src/"; path = "src"; required = $true },
    @{ name = "Backend bayanail-api/"; path = "bayanail-api"; required = $true },
    @{ name = "API modules"; path = "src/lib/api"; required = $true },
    @{ name = "Backend routes"; path = "bayanail-api/src/routes"; required = $true },
    @{ name = "Prisma schema"; path = "bayanail-api/prisma/schema.prisma"; required = $true },
    @{ name = "Package.json root"; path = "package.json"; required = $true },
    @{ name = "Package.json backend"; path = "bayanail-api/package.json"; required = $true }
)

foreach ($check in $checks) {
    $fullPath = Join-Path $RootDir $check.path
    $exists = Test-Path $fullPath
    $StructureCheck.checks += @{
        name = $check.name
        path = $check.path
        exists = $exists
        status = if ($exists) { "OK" } else { if ($check.required) { "ERROR" } else { "WARN" } }
    }
    $statusColor = if ($exists) { "Green" } else { if ($check.required) { "Red" } else { "Yellow" } }
    $symbol = if ($exists) { "[OK]" } else { "[FAIL]" }
    Write-Host "  [$($check.name)] $symbol" -ForegroundColor $statusColor
}

# 2. Analyse des dépendances
Write-Host "`n2. Analyse des dépendances API..." -ForegroundColor Yellow
Set-Location $RootDir

try {
    $DependencyReport = npx tsx scripts/utils/dependency-mapper.ts $RootDir 2>&1 | Out-String
    $DependencyReport | Out-File -FilePath (Join-Path $LogDir "dependency-report.json") -Encoding UTF8
    Write-Host "  [OK] Rapport de dependances genere" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Erreur lors de l'analyse des dependances: $_" -ForegroundColor Red
}

# 3. Verification des fichiers de configuration
Write-Host "`n3. Verification des fichiers de configuration..." -ForegroundColor Yellow
$ConfigCheck = @{
    timestamp = $Timestamp
    configs = @()
}

$configs = @(
    @{ name = ".env backend"; path = "bayanail-api/.env"; required = $false },
    @{ name = "env.example backend"; path = "bayanail-api/env.example"; required = $true },
    @{ name = ".env.local frontend"; path = ".env.local"; required = $false },
    @{ name = "vite.config.ts"; path = "vite.config.ts"; required = $true }
)

foreach ($config in $configs) {
    $fullPath = Join-Path $RootDir $config.path
    $exists = Test-Path $fullPath
    $ConfigCheck.configs += @{
        name = $config.name
        path = $config.path
        exists = $exists
        status = if ($exists) { "OK" } else { if ($config.required) { "ERROR" } else { "WARN" } }
    }
    $statusColor = if ($exists) { "Green" } else { if ($config.required) { "Red" } else { "Yellow" } }
    $symbol = if ($exists) { "[OK]" } else { "[FAIL]" }
    Write-Host "  [$($config.name)] $symbol" -ForegroundColor $statusColor
}

# 4. Verification des dependances npm
Write-Host "`n4. Verification des dependances npm..." -ForegroundColor Yellow
$DependencyCheck = @{
    timestamp = $Timestamp
    checks = @()
}

# Frontend
Set-Location $RootDir
if (Test-Path "node_modules") {
    Write-Host "  [OK] Frontend: node_modules existe" -ForegroundColor Green
    $DependencyCheck.checks += @{ location = "frontend"; status = "OK" }
} else {
    Write-Host "  [FAIL] Frontend: node_modules manquant" -ForegroundColor Red
    $DependencyCheck.checks += @{ location = "frontend"; status = "ERROR" }
}

# Backend
Set-Location (Join-Path $RootDir "bayanail-api")
if (Test-Path "node_modules") {
    Write-Host "  [OK] Backend: node_modules existe" -ForegroundColor Green
    $DependencyCheck.checks += @{ location = "backend"; status = "OK" }
} else {
    Write-Host "  [FAIL] Backend: node_modules manquant" -ForegroundColor Red
    $DependencyCheck.checks += @{ location = "backend"; status = "ERROR" }
}

Set-Location $RootDir

# 5. Test de compilation TypeScript
Write-Host "`n5. Test de compilation TypeScript..." -ForegroundColor Yellow
try {
    $BuildOutput = npx tsc --noEmit 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Compilation TypeScript reussie" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Erreurs de compilation TypeScript detectees" -ForegroundColor Red
        $BuildOutput | Out-File -FilePath (Join-Path $LogDir "typescript-errors.log") -Encoding UTF8
    }
} catch {
    Write-Host "  [FAIL] Erreur lors de la compilation: $_" -ForegroundColor Red
}

# 6. Verification Prisma
Write-Host "`n6. Verification Prisma..." -ForegroundColor Yellow
Set-Location (Join-Path $RootDir "bayanail-api")
try {
    $PrismaGenerate = npx prisma generate 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Client Prisma genere" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Erreur lors de la generation du client Prisma" -ForegroundColor Red
        $PrismaGenerate | Out-File -FilePath (Join-Path $LogDir "prisma-errors.log") -Encoding UTF8
    }
} catch {
    Write-Host "  [FAIL] Erreur Prisma: $_" -ForegroundColor Red
}
Set-Location $RootDir

# 7. Analyse des modules API
Write-Host "`n7. Analyse des modules API..." -ForegroundColor Yellow
$ApiModules = Get-ChildItem -Path (Join-Path $RootDir "src/lib/api") -Filter "*.ts" | Where-Object { $_.Name -ne "index.ts" -and $_.Name -ne "fetch.ts" -and $_.Name -ne "apiUrl.ts" }
Write-Host "  Modules trouvés: $($ApiModules.Count)" -ForegroundColor Cyan
foreach ($module in $ApiModules) {
    Write-Host "    - $($module.Name)" -ForegroundColor Gray
}

# 8. Analyse des routes backend
Write-Host "`n8. Analyse des routes backend..." -ForegroundColor Yellow
$BackendRoutes = Get-ChildItem -Path (Join-Path $RootDir "bayanail-api/src/routes") -Filter "*.routes.ts"
Write-Host "  Routes trouvées: $($BackendRoutes.Count)" -ForegroundColor Cyan
foreach ($route in $BackendRoutes) {
    Write-Host "    - $($route.Name)" -ForegroundColor Gray
}

# Generation du rapport final
Write-Host "`n=== GENERATION DU RAPPORT D'AUDIT ===" -ForegroundColor Cyan

$AuditReport = @{
    timestamp = $Timestamp
    structure = $StructureCheck
    configuration = $ConfigCheck
    dependencies = $DependencyCheck
    apiModules = @{
        count = $ApiModules.Count
        modules = $ApiModules | ForEach-Object { $_.Name }
    }
    backendRoutes = @{
        count = $BackendRoutes.Count
        routes = $BackendRoutes | ForEach-Object { $_.Name }
    }
    summary = @{
        structureOK = ($StructureCheck.checks | Where-Object { $_.status -eq "OK" }).Count
        structureErrors = ($StructureCheck.checks | Where-Object { $_.status -eq "ERROR" }).Count
        configOK = ($ConfigCheck.configs | Where-Object { $_.status -eq "OK" }).Count
        configErrors = ($ConfigCheck.configs | Where-Object { $_.status -eq "ERROR" }).Count
    }
}

$ReportFile = Join-Path $LogDir "audit-report.json"
$AuditReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "`nRapport d'audit sauvegarde: $ReportFile" -ForegroundColor Green
Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "Structure: $($AuditReport.summary.structureOK) OK, $($AuditReport.summary.structureErrors) erreurs" -ForegroundColor $(if ($AuditReport.summary.structureErrors -eq 0) { "Green" } else { "Red" })
Write-Host "Configuration: $($AuditReport.summary.configOK) OK, $($AuditReport.summary.configErrors) erreurs" -ForegroundColor $(if ($AuditReport.summary.configErrors -eq 0) { "Green" } else { "Yellow" })
Write-Host "Modules API: $($AuditReport.apiModules.count)" -ForegroundColor Cyan
Write-Host "Routes backend: $($AuditReport.backendRoutes.count)" -ForegroundColor Cyan

Write-Host "`nAudit termine. Consultez le rapport complet dans: $ReportFile" -ForegroundColor Green

