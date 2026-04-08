# VitalHub Supreme - Start Script
# Launches the server and opens the browser.

Write-Host "🚀 Arrancando VitalHub Supreme..." -ForegroundColor Cyan

# Start server in a new window
Start-Process powershell -ArgumentList "node server.js"

# Wait a second for it to boot
Start-Sleep -Seconds 2

# Open in browser
Start-Process "http://localhost:3000"

Write-Host "✅ Motor en línea. El navegador debería abrirse pronto." -ForegroundColor Green
