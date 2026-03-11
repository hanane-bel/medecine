@echo off
title MedLegal - Demarrage Application
echo ============================================
echo   Demarrage de l'application MedLegal
echo ============================================
echo.

echo [1/2] Demarrage du serveur Backend (Django)...
start "Backend Django" cmd /k "cd /d d:\med L2\backend && python manage.py runserver 0.0.0.0:8000"

echo [2/2] Demarrage du serveur Frontend (Next.js)...
start "Frontend Next.js" cmd /k "cd /d d:\med L2\med && npm run dev"

echo.
echo ============================================
echo   Les deux serveurs sont en cours de demarrage !
echo   Backend  : http://127.0.0.1:8000
echo   Frontend : http://localhost:3000
echo ============================================
echo.
echo Ouvrez votre navigateur sur http://localhost:3000
echo.
pause
