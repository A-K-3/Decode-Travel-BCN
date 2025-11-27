# Script Todo-en-Uno para Camino Messenger
# Ejecuta todos los pasos necesarios para inicializar y probar el bot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Camino Messenger - Setup Completo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# =======================
# PASO 1: Verificar Go
# =======================
Write-Host "PASO 1: Verificando Go" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

try {
    $goVersion = go version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Go instalado: $goVersion" -ForegroundColor Green
    } else {
        throw "Go no encontrado"
    }
} catch {
    Write-Host "❌ Go NO está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Necesitas instalar Go para compilar el bot." -ForegroundColor Yellow
    Write-Host "Descarga desde: https://go.dev/dl/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternativa: Si prefieres usar un binario pre-compilado," -ForegroundColor Yellow
    Write-Host "consulta el README del bot para descargarlo." -ForegroundColor Yellow
    Write-Host ""

    $response = Read-Host "¿Continuar sin compilar el bot? (s/n)"
    if ($response -ne 's' -and $response -ne 'S') {
        exit 1
    }
    $skipBotCompilation = $true
}

Write-Host ""

# =======================
# PASO 2: Compilar Bot
# =======================
if (-not $skipBotCompilation) {
    Write-Host "PASO 2: Compilando el Bot" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Gray

    $botDir = "camino-messenger-bot"

    if (-not (Test-Path $botDir)) {
        Write-Host "❌ Directorio '$botDir' no encontrado" -ForegroundColor Red
        Write-Host "   Asegúrate de estar en el directorio raíz del proyecto" -ForegroundColor Yellow
        exit 1
    }

    Push-Location $botDir

    Write-Host "📦 Descargando dependencias..." -ForegroundColor Gray
    go mod download 2>$null

    Write-Host "🔨 Compilando..." -ForegroundColor Gray
    go build -o camino-messenger-bot.exe .\cmd\camino_messenger_bot.go 2>$null

    if ($LASTEXITCODE -eq 0 -and (Test-Path "camino-messenger-bot.exe")) {
        Write-Host "✅ Bot compilado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error compilando el bot" -ForegroundColor Yellow
        Write-Host "   Puedes compilarlo manualmente más tarde" -ForegroundColor Gray
    }

    Pop-Location
    Write-Host ""
}

# =======================
# PASO 3: Configuración
# =======================
Write-Host "PASO 3: Configuración del Bot" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$configFile = "camino-messenger-bot\config.yaml"

if (-not (Test-Path $configFile)) {
    Write-Host "📝 Creando config.yaml..." -ForegroundColor Gray

    $templateFile = "camino-messenger-bot\examples\config\camino-messenger-bot-distributor-columbus.yaml"

    if (Test-Path $templateFile) {
        Copy-Item $templateFile $configFile
        Write-Host "✅ config.yaml creado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Plantilla no encontrada, creando configuración básica..." -ForegroundColor Yellow

        @"
# Configuración Básica - Camino Messenger Bot
developer_mode: true
response_timeout: 10000

booking_token_address: 0xe55E387F5474a012D1b048155E25ea78C7DBfBBC
chain_rpc_url: wss://columbus.camino.network/ext/bc/C/ws

bot_key: YOUR_PRIVATE_KEY_HERE_WITHOUT_0x
cm_account_address: 0xYOUR_CM_ACCOUNT_ADDRESS

db:
  path: ./bot-db

matrix:
  host: messenger.chain4travel.com

partner_plugin:
  enabled: false

rpc_server:
  enabled: true
  port: 9090
  unencrypted: true
"@ | Out-File -FilePath $configFile -Encoding UTF8

        Write-Host "✅ Configuración básica creada" -ForegroundColor Green
    }
} else {
    Write-Host "✅ config.yaml ya existe" -ForegroundColor Green
}

# Verificar credenciales
$configContent = Get-Content $configFile -Raw
if ($configContent -match "YOUR_PRIVATE_KEY" -or $configContent -match "YOUR_CM_ACCOUNT") {
    Write-Host ""
    Write-Host "⚠️  ATENCIÓN: Necesitas configurar credenciales" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Edita el archivo: $configFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configura:" -ForegroundColor White
    Write-Host "  • bot_key: Tu clave privada (sin 0x)" -ForegroundColor Gray
    Write-Host "  • cm_account_address: Tu dirección de CM Account" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Para desarrollo:" -ForegroundColor White
    Write-Host "  1. Crea una wallet en https://suite.camino.network" -ForegroundColor Gray
    Write-Host "  2. Cambia a Columbus Testnet" -ForegroundColor Gray
    Write-Host "  3. Exporta tu clave privada" -ForegroundColor Gray
    Write-Host "  4. Usa tu dirección como CM Account (para testing)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""

# =======================
# PASO 4: Node.js
# =======================
Write-Host "PASO 4: Dependencias Node.js" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js NO está instalado" -ForegroundColor Red
    Write-Host "   Descarga desde: https://nodejs.org/" -ForegroundColor Cyan
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias npm..." -ForegroundColor Gray
    npm install --legacy-peer-deps 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error instalando dependencias" -ForegroundColor Yellow
        Write-Host "   Ejecuta manualmente: npm install --legacy-peer-deps" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}

Write-Host ""

# =======================
# RESUMEN
# =======================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumen del Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Configurar credenciales (si no lo hiciste)" -ForegroundColor White
Write-Host "    Edita: camino-messenger-bot\config.yaml" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Iniciar el Bot" -ForegroundColor White
Write-Host "    .\start_bot.ps1" -ForegroundColor Cyan
Write-Host "    O manualmente:" -ForegroundColor Gray
Write-Host "    cd camino-messenger-bot" -ForegroundColor Gray
Write-Host "    .\camino-messenger-bot.exe --config config.yaml" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Probar la conexión (en otra terminal)" -ForegroundColor White
Write-Host "    node quick_ping_test.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣  Ejecutar tests" -ForegroundColor White
Write-Host "    npm run test:bot" -ForegroundColor Cyan
Write-Host "    node search_accommodation_test.js" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentación:" -ForegroundColor Yellow
Write-Host "   • INICIO_RAPIDO.md - Guía rápida" -ForegroundColor Gray
Write-Host "   • GUIA_INICIALIZACION.md - Guía completa paso a paso" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Setup completado!" -ForegroundColor Green
Write-Host ""

