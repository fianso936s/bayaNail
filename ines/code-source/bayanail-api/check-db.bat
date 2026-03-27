@echo off
REM Script batch pour vérifier l'accès à la base de données
REM Usage: check-db.bat [email] [password]

echo 🔍 Vérification de l'accès à la base de données Moniteur1D
echo.

REM Vérifier si on est dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: Ce script doit être exécuté depuis le répertoire bayanail-api
    exit /b 1
)

REM Charger les variables d'environnement
if exist ".env" (
    echo ✅ Fichier .env trouvé
) else (
    echo ⚠️  Fichier .env non trouvé
)

echo.
echo Exécution du script de vérification...
echo.

if "%1"=="" (
    REM Mode vérification complète
    call npm run check:db
) else (
    REM Mode test de connexion
    echo 🧪 Mode test de connexion avec: %1
    echo.
    set ADMIN_PASSWORD=%2
    call npm run test:login -- %1 %2
)

echo.
echo ✅ Vérification terminée
pause

