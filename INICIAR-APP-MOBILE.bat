@echo off
chcp 65001 >nul
title OMAVEST - app mobile
cd /d "%~dp0mobile\LHubApp\LHubApp"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [ERRO] Node.js nao encontrado. Instale em https://nodejs.org e rode de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo  Instalando dependencias do app - so na primeira vez, pode demorar...
  call npm install --no-audit --no-fund
)

echo.
echo  ===============================================
echo    OMAVEST app mobile
echo  ===============================================
echo   IMPORTANTE: deixe o servidor rodando (INICIAR-OMAVEST.bat).
echo.
echo   [W] Ver o app no NAVEGADOR em formato de celular (mais facil p/ apresentar)
echo   [A] Rodar no Android (emulador ou celular USB - precisa do Android Studio)
echo.
choice /c WA /n /m "Escolha W ou A: "
if errorlevel 2 goto android

echo.
echo  Abrindo em http://localhost:8081  (use F12 e o modo celular, ou reduza a janela)
call npx expo start --web --port 8081
goto fim

:android
call npx expo run:android

:fim
pause
