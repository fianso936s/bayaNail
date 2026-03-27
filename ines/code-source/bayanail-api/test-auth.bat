@echo off
cd /d "%~dp0"
echo === Test d'authentification ===
echo.
echo Assurez-vous que le serveur est demarre avec: npm run dev
echo.
echo Usage: test-auth.bat [email] [password]
echo Exemple: test-auth.bat admin@bayanail.com votre_mot_de_passe
echo.
if "%~1"=="" (
    echo ERREUR: Email requis
    echo Usage: test-auth.bat [email] [password]
    pause
    exit /b 1
)
if "%~2"=="" (
    echo ERREUR: Mot de passe requis
    echo Usage: test-auth.bat [email] [password]
    pause
    exit /b 1
)
node test-auth.js %1 %2
pause

