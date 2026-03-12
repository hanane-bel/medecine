@echo off
title MedLegal - Demarrage Application
echo ============================================
echo   Demarrage de l'application MedLegal
echo ============================================
echo.

echo [1/2] Demarrage du serveur Backend (Django)...
start "Backend Django" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 0.0.0.0:8000"

echo [2/2] Demarrage du serveur Frontend (Next.js)...
start "Frontend Next.js" cmd /k "cd /d "%~dp0med" && npm run dev"

echo.
echo ============================================
echo   Les deux serveurs sont en cours de demarrage !
echo   Backend  : http://192.168.100.2:8000
echo   Frontend : http://192.168.100.2:3000
echo ============================================
echo.
echo Ouvrez votre navigateur sur PC ou Telephone sur : http://192.168.100.2:3000
echo.
pause
