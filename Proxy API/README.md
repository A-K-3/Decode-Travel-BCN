# Camino Messenger - API REST

API REST completa para búsqueda de hoteles usando el protocolo Camino Messenger.

## 🎯 Estado del Proyecto

✅ **API REST Completa** - Endpoint de búsqueda con información completa de hoteles
✅ **SDK Completo Generado** - Incluye tipos de mensajes Y servicios gRPC
✅ **Scripts Funcionales** - Scripts de prueba para gRPC directo
✅ **TypeScript Configurado** - Proyecto completamente tipado
✅ **Bot Local Funcionando** - Bot configurado y conectado a Matrix

## 🌐 API REST (NUEVO)

### Inicio Rápido

```bash
# 1. Asegúrate de que el bot esté corriendo
cd camino-messenger-bot
docker-compose up -d bot

# 2. Inicia la API
npm run api:dev

# 3. Prueba la API
node api/test-api.js
```

### Endpoint Principal

```http
POST http://localhost:3000/api/availability
Content-Type: application/json

{
  "startDate": "2025-12-01",
  "endDate": "2025-12-05",
  "adults": 2,
  "children": [8, 12],
  "currency": "EUR",
  "language": "EN"
}
```

### Respuesta

La API devuelve habitaciones con **información completa del hotel**:
- ✅ Nombre del hotel (no solo código)
- ✅ Ubicación completa (dirección, coordenadas GPS)
- ✅ Estrellas del hotel (1-5)
- ✅ Servicios y amenidades
- ✅ Información de contacto (teléfono, email, web)
- ✅ Precios formateados
- ✅ Políticas de cancelación

### Documentación Completa

📚 **[API REST - Documentación Completa](./api/README.md)**
📖 **[Ejemplos de Uso](./api/EXAMPLES.md)**
📝 **[Resumen de la API](./API_COMPLETA.md)**

## 📁 Estructura del Proyecto

```
caminomessage/
├── .env                          # Configuración (bot URL, direcciones)
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración TypeScript
│
├── api/                          # ⭐ API REST (NUEVO)
│   ├── server.ts                 # Servidor Express
│   ├── README.md                 # Documentación de la API
│   ├── EXAMPLES.md               # Ejemplos de requests
│   └── test-api.js               # Script de prueba
│
├── search_availability_grpc.ts   # Script gRPC funcional
├── search_specific_hotel.ts      # Búsqueda de hotel específico
├── search_madrid.ts              # Búsqueda en Madrid
│
├── generated/                    # SDK generado localmente
│   └── cmp/
│       ├── services/             # Servicios del protocolo
│       │   ├── accommodation/    # Búsqueda de alojamiento
│       │   ├── transport/        # Vuelos, trenes, transfers
│       │   └── activity/         # Actividades
│       └── types/                # Tipos compartidos
│
├── camino-messenger-protocol/    # Repositorio de protocolos (buf)
└── camino-messenger-bot/         # Bot local (opcional)
```

## 🚀 Scripts Disponibles

### API REST
```bash
npm run api:dev      # Iniciar API en modo desarrollo (hot-reload)
npm run api:start    # Iniciar API en modo producción
npm run api:build    # Compilar API a JavaScript
```

### Scripts de Prueba gRPC
```bash
npx tsx search_availability_grpc.ts   # Búsqueda general
npx tsx search_madrid.ts              # Búsqueda en Madrid
npx tsx search_specific_hotel.ts      # Búsqueda de hotel específico
```

## 🔧 Configuración del Bot

### Opción 1: Bot Local

Si usas el bot local, sigue estos pasos:

1. Actualiza `.env`:
   ```env
   CAMINO_BOT_URL=http://localhost:9090
   ```

2. Configura el bot en `camino-messenger-bot/cmb-config/config.yaml`:
   ```yaml
   bot_key: <TU_CLAVE_PRIVADA_HEX_64_CARACTERES>

   rpc_server:
     enabled: true
     port: 9090
   ```

3. Inicia el bot:
   ```bash
   cd camino-messenger-bot
   docker-compose up
   ```

### Opción 2: Bot Remoto

Si usas un bot remoto accesible:

1. Actualiza `.env`:
   ```env
   CAMINO_BOT_URL=http://IP_DEL_BOT:9090
   ```

2. Asegúrate de tener acceso de red (VPN, whitelist IP, etc.)

## 📊 Formato de Respuesta

Cuando el bot responda correctamente:

```
✅ Respuesta recibida!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RESULTADOS DE DISPONIBILIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Search ID: a1e0479b-5ff2-4036-9f55-ea6c1ae12c7e
📍 Resultados encontrados: 5

🏨 ALOJAMIENTOS DISPONIBLES:

   1. Opción ID: 123
      Código de propiedad: HOTEL001
      Precio: 150.00 EUR

   2. Opción ID: 124
      Código de propiedad: HOTEL002
      Precio: 180.00 EUR
```

## 🛠️ Regenerar SDK

Si se actualizan los protocolos en GitHub:

```bash
cd camino-messenger-protocol
git pull
buf generate --template buf.gen.js.yaml
cd ..
cp -r camino-messenger-protocol/gen/es generated
```

## 📚 Servicios Disponibles

El SDK generado incluye todos los servicios del protocolo:

- **Accommodation**: Búsqueda de hoteles y alojamiento
- **Transport**: Vuelos, trenes, transfers
- **Activity**: Actividades y excursiones
- **Ping**: Health check del servicio
- **Book**: Servicios de reserva
- **Cancellation**: Cancelaciones
- **Info**: Información de destinos
- **Insurance**: Seguros

## 🔍 Dependencias Principales

```json
{
  "@bufbuild/connect": "^0.13.0",
  "@bufbuild/connect-node": "^0.13.0",
  "@bufbuild/protobuf": "^1.10.0",
  "dotenv": "^16.3.1",
  "typescript": "^5.9.3",
  "tsx": "^4.20.6"
}
```

## 📖 Documentación Completa

Para más detalles, consulta:

- **[SDK_GENERADO_EXITOSO.md](./SDK_GENERADO_EXITOSO.md)** - Guía completa del SDK
- **[Camino Messenger Protocol](https://docs.camino.network/camino-messenger)** - Documentación oficial
- **[Buf.build SDK](https://buf.build/chain4travel/camino-messenger-protocol)** - SDK publicado

## 🐛 Solución de Problemas

### Error: "connect ETIMEDOUT"

**Causa**: No se puede conectar al bot en la URL configurada.

**Solución**:
1. Verifica que el bot esté corriendo
2. Comprueba la URL en `.env`
3. Verifica conectividad de red (firewall, VPN)

### Error: "Package subpath not exported"

**Causa**: Versiones incompatibles de dependencias.

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🤝 Soporte

- **Discord**: [Camino Network](https://discord.gg/camino)
- **GitHub**: [camino-messenger-protocol](https://github.com/chain4travel/camino-messenger-protocol)
- **Docs**: [docs.camino.network](https://docs.camino.network)

## 📄 Licencia

Ver [LICENSE.md](./camino-messenger-bot/LICENSE.md)

---

**Última actualización**: 2025-11-27
