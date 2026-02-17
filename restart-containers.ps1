# Reinicia y reconstruye los contenedores Docker de Komodo.
# Úsalo cuando cambies: variables de entorno, requirements.txt, Dockerfile o docker-compose.yml.
# Ejecutar: .\restart-containers.ps1

Set-Location $PSScriptRoot

Write-Host "Deteniendo contenedores..." -ForegroundColor Cyan
docker-compose down

Write-Host "Reconstruyendo e iniciando contenedores..." -ForegroundColor Cyan
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "Listo. API en http://localhost:8000" -ForegroundColor Green
    Write-Host "Ver logs: docker-compose logs -f web" -ForegroundColor Gray
} else {
    Write-Host "Algo fallo. Revisa el mensaje anterior." -ForegroundColor Red
    exit 1
}
