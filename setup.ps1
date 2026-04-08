# VitalHub Supreme - Setup Script
# Run this once to install everything and prepare the database.

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " VitalHub Supreme: Iniciando Configuración" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "`n[1/2] Instalando dependencias de Node.js..." -ForegroundColor Yellow
npm install

# 2. Check for .env
if (-Not (Test-Path ".env")) {
    Write-Host "`n[!] Archivo .env no encontrado. Creando uno por defecto..." -ForegroundColor Magenta
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host " ✅ Configuración Completada con Éxito" -ForegroundColor Green
Write-Host " Usa './start.ps1' para arrancar la plataforma." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
