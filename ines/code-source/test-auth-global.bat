@echo off
cd /d "%~dp0\bayanail-api"
echo === Test d'authentification ===
echo.
echo Assurez-vous que le serveur est demarre avec: npm run dev
echo.
node test-auth.js admin@bayanail.com lounes92
pause

