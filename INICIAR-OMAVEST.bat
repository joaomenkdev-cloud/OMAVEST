@echo off
chcp 65001 >nul
title OMAVEST - servidor
cd /d "%~dp0pc\backend"

where dotnet >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [ERRO] O .NET SDK nao foi encontrado neste computador.
  echo         Instale o ".NET 10 SDK" em https://dotnet.microsoft.com/download e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul
if not errorlevel 1 (
  echo.
  echo  [AVISO] A porta 5000 ja esta em uso - o OMAVEST provavelmente ja esta aberto.
  echo          Abrindo o site no navegador...
  start "" http://localhost:5000
  timeout /t 4 >nul
  exit /b 0
)

echo.
echo  ===============================================
echo    OMAVEST  -  iniciando (primeira vez demora um pouco)
echo  ===============================================
echo.
echo   Neste computador:  http://localhost:5000
echo   Conta demo:        demo@omavest.com  /  123456
echo.
echo   Para abrir no CELULAR (mesmo Wi-Fi) use um destes enderecos:
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { '      http://' + $_.IPAddress + ':5000' }"
echo.
echo   (deixe esta janela aberta; feche-a para desligar o servidor)
echo.

REM abre o navegador assim que o servidor responder
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 120;$i++){ try{ Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process 'http://localhost:5000'; break }catch{ Start-Sleep 1 } }"

dotnet run --configuration Release --nologo
echo.
echo  O servidor foi encerrado.
pause
