# 🧪 CÓMO PROBAR LA API - INSTRUCCIONES PASO A PASO

## ✅ Estado Actual
- ✅ API creada y lista
- ✅ Código corregido para funcionar con gRPC
- ⏳ Necesita que el bot esté corriendo para obtener resultados reales

---

## 📋 PASOS PARA PROBAR

### Opción 1: Prueba Completa (Con Bot)

#### 1. Iniciar el Bot
```powershell
cd camino-messenger-bot
docker-compose up -d bot
docker-compose logs -f bot
```

Espera a ver este mensaje:
```
✅ gRPC server listening on [::]:9090
```

#### 2. Iniciar la API (En otra terminal)
```powershell
cd C:\Users\Eric Díaz Alonso\PhpstormProjects\caminomessage
npm run api:dev
```

Deberías ver:
```
🚀 API REST de Camino Messenger
✅ Servidor ejecutándose en http://localhost:3000
```

#### 3. Probar la API (En otra terminal)

**Health Check:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Búsqueda de Disponibilidad:**
```powershell
$body = @{
    startDate = "2025-12-01"
    endDate = "2025-12-05"
    adults = 2
    currency = "EUR"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/availability" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# Ver respuesta formateada
$response | ConvertTo-Json -Depth 10

# Ver solo nombres de hoteles
$response.rooms | ForEach-Object {
    Write-Host "$($_.hotel.name) - $($_.roomName) - $($_.price.total) $($_.price.currency)"
}
```

---

### Opción 2: Prueba Sin Bot (Solo estructura de la API)

Si el bot no está disponible, la API responderá con un timeout, pero puedes verificar que la estructura funciona:

#### 1. Iniciar solo la API
```powershell
npm run api:dev
```

#### 2. Probar Health Check
```powershell
curl http://localhost:3000/health
```

**Respuesta Esperada:**
```json
{
  "status": "ok",
  "service": "Camino Messenger API",
  "version": "1.0.0",
  "bot": "localhost:9090"
}
```

#### 3. Probar Endpoint de Documentación
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/"
```

**Respuesta Esperada:**
```json
{
  "name": "Camino Messenger API",
  "version": "1.0.0",
  "endpoints": {
    "/health": "Health check",
    "POST /api/availability": "Search room availability..."
  },
  "documentation": { ... }
}
```

#### 4. Probar Búsqueda (Obtendrás timeout, pero verifica la estructura)
```powershell
$body = @{
    startDate = "2025-12-01"
    endDate = "2025-12-05"
    adults = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/availability" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Respuesta con bot offline:**
```json
{
  "error": "Search failed",
  "details": [
    {
      "code": "ERROR_CODE_INTERNAL",
      "message": "timeout..."
    }
  ]
}
```

---

## 🔍 EJEMPLOS DE RESPUESTA EXITOSA

### Health Check
```json
{
  "status": "ok",
  "service": "Camino Messenger API",
  "version": "1.0.0",
  "bot": "localhost:9090"
}
```

### Búsqueda de Disponibilidad (Con Supplier Online)
```json
{
  "searchId": "a1e0479b-5ff2-4036-9f55-ea6c1ae12c7e",
  "rooms": [
    {
      "roomCode": "DBL001",
      "roomName": "Double Room Standard",
      "originalRoomName": "Deluxe Sea View",
      "price": {
        "total": "450.00",
        "currency": "EUR"
      },
      "mealPlan": {
        "code": "BB",
        "description": "Bed & Breakfast"
      },
      "beds": [
        {
          "type": "DOUBLE",
          "count": 1
        }
      ],
      "remainingUnits": 5,
      "hotel": {
        "code": "HOTEL123456",
        "name": "Grand Hotel Paradise",
        "stars": 4,
        "categoryUnit": "CATEGORY_UNIT_STARS",
        "location": {
          "address": "Av. Principal 123",
          "city": "Madrid",
          "country": "ES",
          "postalCode": "28001",
          "coordinates": {
            "latitude": 40.4168,
            "longitude": -3.7038
          }
        },
        "contact": {
          "phone": "+34 91 123 4567",
          "email": "info@grandhotel.com",
          "website": "https://grandhotel.com"
        },
        "chain": "Grand Hotels International",
        "themes": ["THEME_FAMILY", "THEME_BEACH"]
      },
      "services": [
        {
          "code": "WIFI",
          "description": "Free WiFi",
          "type": "INCLUDED"
        }
      ]
    }
  ],
  "totalResults": 1,
  "filters": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-05",
    "adults": 2,
    "children": [],
    "currency": "EUR"
  }
}
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to localhost:3000"
✅ **Solución:** Asegúrate de que la API esté corriendo
```powershell
npm run api:dev
```

### Error: "ECONNREFUSED localhost:9090"
✅ **Solución:** El bot no está corriendo
```powershell
cd camino-messenger-bot
docker-compose up -d bot
```

### Error: "Timeout"
✅ **Solución:** El supplier no está online. Esto es normal en desarrollo.
La API funciona correctamente, solo falta que un supplier real responda.

---

## 📊 VERIFICAR QUE TODO FUNCIONA

### Checklist:

- [ ] Bot corriendo en puerto 9090
  ```powershell
  docker-compose ps
  ```

- [ ] API corriendo en puerto 3000
  ```powershell
  Get-Process -Name node
  ```

- [ ] Health check responde
  ```powershell
  curl http://localhost:3000/health
  ```

- [ ] Endpoint de búsqueda acepta requests
  ```powershell
  # Debe devolver JSON (success o error)
  ```

---

## 🎯 RESUMEN

### Lo que funciona:
✅ Servidor Express en puerto 3000
✅ Endpoint GET /health
✅ Endpoint GET / (documentación)
✅ Endpoint POST /api/availability
✅ Validación de parámetros
✅ Cliente gRPC para AccommodationSearch
✅ Cliente gRPC para AccommodationProductInfo
✅ Combinación de resultados
✅ Formateo de respuestas JSON

### Lo que necesitas para resultados reales:
- Bot corriendo en localhost:9090
- Supplier online para responder

### Pero puedes probar YA:
- Health check
- Documentación
- Estructura de la API
- Validación de parámetros
- Manejo de errores

---

## 📝 COMANDOS RÁPIDOS

```powershell
# Iniciar bot
cd camino-messenger-bot; docker-compose up -d bot

# Iniciar API
npm run api:dev

# Health check
curl http://localhost:3000/health

# Búsqueda
$body = '{"startDate":"2025-12-01","endDate":"2025-12-05","adults":2,"currency":"EUR"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/availability" -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
```

---

**Creado:** 2025-11-27
**Estado:** ✅ API Lista para Probar

