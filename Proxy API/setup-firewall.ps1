# Script para configurar el firewall de Windows
# Ejecutar como Administrador

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔥 Configuración de Firewall" -ForegroundColor Cyan
Write-Host "   Camino Messenger API - Puerto 3000" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador`n" -ForegroundColor Red
    Write-Host "Cómo ejecutar como Administrador:" -ForegroundColor Yellow
    Write-Host "1. Click derecho en PowerShell" -ForegroundColor White
    Write-Host "2. Seleccionar 'Ejecutar como administrador'" -ForegroundColor White
    Write-Host "3. Ejecutar: .\setup-firewall.ps1`n" -ForegroundColor White
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Ejecutando como Administrador`n" -ForegroundColor Green

# Verificar si la regla ya existe
Write-Host "🔍 Verificando reglas existentes..." -ForegroundColor Yellow
$existingRule = Get-NetFirewallRule -DisplayName "Camino Messenger API" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "⚠️  La regla ya existe. ¿Deseas recrearla? (S/N)" -ForegroundColor Yellow
    $response = Read-Host

    if ($response -eq 'S' -or $response -eq 's') {
        Write-Host "`n🗑️  Eliminando regla existente..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Camino Messenger API"
        Write-Host "✅ Regla eliminada`n" -ForegroundColor Green
    } else {
        Write-Host "`n✅ Manteniendo regla existente" -ForegroundColor Green
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "✅ Firewall ya configurado correctamente" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
        Read-Host "Presiona Enter para salir"
        exit 0
    }
}

# Crear la regla de firewall
Write-Host "🔧 Creando regla de firewall..." -ForegroundColor Yellow

try {
    New-NetFirewallRule `
        -DisplayName "Camino Messenger API" `
        -Description "Permite conexiones entrantes al servidor API de Camino Messenger en el puerto 3000" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Private,Domain `
        -Enabled True `
        -ErrorAction Stop

    Write-Host "✅ Regla creada exitosamente`n" -ForegroundColor Green

    # Verificar la regla
    Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow
    $rule = Get-NetFirewallRule -DisplayName "Camino Messenger API"

    Write-Host "`nDetalles de la regla:" -ForegroundColor Cyan
    Write-Host "  Nombre:     $($rule.DisplayName)" -ForegroundColor White
    Write-Host "  Dirección:  $($rule.Direction)" -ForegroundColor White
    Write-Host "  Acción:     $($rule.Action)" -ForegroundColor White
    Write-Host "  Habilitada: $($rule.Enabled)" -ForegroundColor White
    Write-Host "  Perfiles:   Private, Domain" -ForegroundColor White
    Write-Host "  Puerto:     3000 TCP" -ForegroundColor White

    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✅ Firewall configurado correctamente" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

    Write-Host "🌐 La API ahora es accesible desde:" -ForegroundColor Yellow
    Write-Host "   • localhost:3000" -ForegroundColor White
    Write-Host "   • [IP-LOCAL]:3000 (desde otros dispositivos en la red)`n" -ForegroundColor White

    Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "1. Inicia el servidor: npm run api:dev" -ForegroundColor White
    Write-Host "2. Busca tu IP local en los logs del servidor" -ForegroundColor White
    Write-Host "3. Accede desde otro dispositivo: http://[TU-IP]:3000/health`n" -ForegroundColor White

} catch {
    Write-Host "`n❌ ERROR al crear la regla:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)`n" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Read-Host "`nPresiona Enter para salir"

