@echo off
REM Reinicia y reconstruye los contenedores Docker de Komodo.
REM En PowerShell ejecuta: .\restart-containers.bat
REM O haz doble clic en este archivo en el Explorador.

cd /d "%~dp0"

echo Deteniendo contenedores...
docker-compose down

echo Reconstruyendo e iniciando contenedores...
docker-compose up --build -d

if %ERRORLEVEL% equ 0 (
    echo.
    echo Listo. API en http://localhost:8000
    echo Ver logs: docker-compose logs -f web
) else (
    echo Algo fallo. Revisa el mensaje anterior.
    exit /b 1
)

pause
