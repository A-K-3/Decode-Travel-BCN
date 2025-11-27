# Script de Inicialización del Camino Messenger Bot
# Para Windows PowerShell

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Camino Messenger Bot - Inicialización" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$BOT_DIR = "camino-messenger-bot"
$CONFIG_FILE = "$BOT_DIR\config.yaml"
$BOT_EXECUTABLE = "$BOT_DIR\camino-messenger-bot.exe"

# Verificar si Go está instalado
Write-Host "1. Verificando Go..." -ForegroundColor Yellow
try {
    $goVersion = go version
    Write-Host "   ✓ Go instalado: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Go NO está instalado" -ForegroundColor Red
    Write-Host "   Descarga Go desde: https://go.dev/dl/" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe el directorio del bot
if (-not (Test-Path $BOT_DIR)) {
    Write-Host "   ✗ Directorio '$BOT_DIR' no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Compilando el Bot..." -ForegroundColor Yellow
Push-Location $BOT_DIR

# Descargar dependencias
Write-Host "   Descargando dependencias Go..." -ForegroundColor Gray
go mod download

# Compilar
Write-Host "   Compilando..." -ForegroundColor Gray
go build -o camino-messenger-bot.exe .\cmd\camino_messenger_bot.go

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Bot compilado exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error compilando el bot" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""

# Verificar configuración
Write-Host "3. Verificando configuración..." -ForegroundColor Yellow

if (-not (Test-Path $CONFIG_FILE)) {
    Write-Host "   ⚠ Archivo config.yaml no encontrado" -ForegroundColor Yellow
    Write-Host "   Creando config.yaml desde plantilla..." -ForegroundColor Gray

    $templateFile = "$BOT_DIR\examples\config\camino-messenger-bot-distributor-columbus.yaml"

    if (Test-Path $templateFile) {
        Copy-Item $templateFile $CONFIG_FILE
        Write-Host "   ✓ config.yaml creado desde plantilla" -ForegroundColor Green
        Write-Host ""
        Write-Host "   ⚠ IMPORTANTE: Edita $CONFIG_FILE con tus credenciales:" -ForegroundColor Yellow
        Write-Host "      - bot_key: Tu clave privada (sin 0x)" -ForegroundColor Yellow
        Write-Host "      - cm_account_address: Tu dirección de CM Account" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Para desarrollo, puedes crear una wallet en:" -ForegroundColor Cyan
        Write-Host "   https://suite.camino.network (testnet Columbus)" -ForegroundColor Cyan
        Write-Host ""

        # Abrir el archivo de configuración para editar
        $response = Read-Host "   ¿Quieres abrir config.yaml para editarlo ahora? (s/n)"
        if ($response -eq 's' -or $response -eq 'S') {
            notepad $CONFIG_FILE
        }

        Write-Host ""
        Write-Host "   Después de configurar, vuelve a ejecutar este script." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "   ✗ No se encontró plantilla de configuración" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ config.yaml encontrado" -ForegroundColor Green

    # Verificar que tenga credenciales
    $configContent = Get-Content $CONFIG_FILE -Raw

    if ($configContent -match "YOUR_PRIVATE_KEY" -or $configContent -match "YOUR_CM_ACCOUNT") {
        Write-Host ""
        Write-Host "   ⚠ ADVERTENCIA: config.yaml contiene valores de ejemplo" -ForegroundColor Yellow
        Write-Host "   Necesitas configurar:" -ForegroundColor Yellow
        Write-Host "      - bot_key: Tu clave privada (sin 0x)" -ForegroundColor Yellow
        Write-Host "      - cm_account_address: Tu dirección de CM Account" -ForegroundColor Yellow
        Write-Host ""

        $response = Read-Host "   ¿Continuar de todos modos? (s/n)"
        if ($response -ne 's' -and $response -ne 'S') {
            exit 0
        }
    }
}

Write-Host ""
Write-Host "4. Iniciando el Bot..." -ForegroundColor Yellow
Write-Host "   Puerto: 9090" -ForegroundColor Gray
Write-Host "   Configuración: config.yaml" -ForegroundColor Gray
Write-Host ""
Write-Host "   Presiona Ctrl+C para detener el bot" -ForegroundColor Cyan
Write-Host ""

# Iniciar el bot
Push-Location $BOT_DIR
& .\camino-messenger-bot.exe --config config.yaml
Pop-Location

