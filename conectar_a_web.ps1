# VitalHub Supreme - Script de Conexión a Internet
# ==================================================

Write-Host "🌐 Iniciando conexión de VitalHub a la web..." -ForegroundColor Cyan

# 1. Asegurar que estamos identificados
Write-Host "🔑 Verificando identidad en Firebase..." -ForegroundColor Yellow
firebase login

# 2. Seleccionar el proyecto correcto
Write-Host "📌 Seleccionando proyecto: salud-preventiva-a7da3..." -ForegroundColor Yellow
firebase use salud-preventiva-a7da3

# 3. Desplegar (Subir a internet)
Write-Host "🚀 Subiendo archivos a la nube..." -ForegroundColor Green
firebase deploy --only hosting,firestore:rules,database:rules,firestore:indexes

Write-Host "`n✅ ¡VITALHUB YA ESTÁ EN VIVO!" -ForegroundColor Green
Write-Host "Puedes verla en: https://salud-preventiva-a7da3.web.app" -ForegroundColor Cyan
