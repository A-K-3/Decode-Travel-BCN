# Script para probar la validación de fechas con diferentes formatos

Write-Host "🧪 Probando validación de fechas..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Fecha con día sin cero (debería funcionar ahora)
Write-Host "Test 1: Fecha '2025-12-1' (día sin cero)" -ForegroundColor Yellow
$body1 = @{
    startDate = "2025-12-1"
    endDate = "2025-12-04"
    adults = 2
    currency = "EUR"
    cityCode = "MAD"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri http://localhost:3000/api/availability -Method POST -Headers @{"Content-Type"="application/json"} -Body $body1
    Write-Host "✅ Status: $($response1.StatusCode)" -ForegroundColor Green
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Host "   Total resultados: $($result1.totalResults)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error1 = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Detalles: $($error1 | ConvertTo-Json)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Fecha con mes sin cero (debería funcionar ahora)
Write-Host "Test 2: Fecha '2025-1-15' (mes y día sin cero)" -ForegroundColor Yellow
$body2 = @{
    startDate = "2025-1-15"
    endDate = "2025-1-20"
    adults = 2
    currency = "EUR"
    cityCode = "CITY_CODE_BCN"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri http://localhost:3000/api/availability -Method POST -Headers @{"Content-Type"="application/json"} -Body $body2
    Write-Host "✅ Status: $($response2.StatusCode)" -ForegroundColor Green
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Host "   Total resultados: $($result2.totalResults)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error2 = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Detalles: $($error2 | ConvertTo-Json)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Fecha con formato completo (siempre ha funcionado)
Write-Host "Test 3: Fecha '2025-12-01' (formato completo)" -ForegroundColor Yellow
$body3 = @{
    startDate = "2025-12-01"
    endDate = "2025-12-05"
    adults = 2
    currency = "EUR"
    cityCode = "MAD"
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest -Uri http://localhost:3000/api/availability -Method POST -Headers @{"Content-Type"="application/json"} -Body $body3
    Write-Host "✅ Status: $($response3.StatusCode)" -ForegroundColor Green
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Host "   Total resultados: $($result3.totalResults)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error3 = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Detalles: $($error3 | ConvertTo-Json)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🏁 Pruebas completadas" -ForegroundColor Cyan

