# MCP Travel Booking - Camino Network

## Descripción

MCP Server para búsqueda y reserva de alojamientos y vuelos a través de Camino Messenger, con pagos en blockchain (USDC/EURe).

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Cliente   │────▶│   Claude    │────▶│   MCP Server     │────▶│ Camino Messenger│
│  (Chat UI)  │     │  (Agente)   │     │  (Este proyecto) │     │    (gRPC Bot)   │
└─────────────┘     └─────────────┘     └──────────────────┘     └─────────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Blockchain  │
                                        │  Payments    │
                                        └──────────────┘
```

---

## Servicios Camino Messenger Disponibles

### cmp.services.accommodation.v4

| Service | Descripción |
|---------|-------------|
| `AccommodationSearchService` | Búsqueda de alojamientos |
| `AccommodationProductListService` | Lista de productos del supplier |
| `AccommodationProductInfoService` | Detalles de un producto |

### cmp.services.transport.v4

| Service | Descripción |
|---------|-------------|
| `TransportSearchService` | Búsqueda de vuelos |
| `TransportProductListService` | Lista de productos del supplier |

### cmp.services.book.v4

| Service | Descripción |
|---------|-------------|
| `ValidationService` | Validar disponibilidad y precio |
| `MintService` | Crear reserva + booking token |

---

## Estructura de Tools

```
src/tools/
├── index.ts                  # Registro de tools
├── searchAccommodation.ts    # search_accommodation
├── searchFlights.ts          # search_flights
├── getAccommodationList.ts   # get_accommodation_list
├── getAccommodationInfo.ts   # get_accommodation_info
├── getFlightList.ts          # get_flight_list
├── validateOption.ts         # validate_option
└── createBooking.ts          # create_booking
```

### Patrón de Tool

Cada archivo exporta:
- `name` - Nombre del tool (snake_case)
- `description` - Descripción para el agente
- `schema` - Zod schema de input
- `handler` - Función async que procesa el tool

---

## Tools

### Búsqueda

| Tool | Descripción | Camino Service | Documentación |
|------|-------------|----------------|---------------|
| `search_accommodation` | Buscar alojamientos disponibles | `AccommodationSearchService` | [→ search_accommodation.md](docs/tools/AccommodationSearchService.md) |
| `search_flights` | Buscar vuelos disponibles | `TransportSearchService` | [→ search_flights.md](docs/tools/TransportSearchService.md) |

### Catálogo

| Tool | Descripción | Camino Service | Documentación |
|------|-------------|----------------|---------------|
| `get_accommodation_list` | Lista de alojamientos de un supplier | `AccommodationProductListService` | [→ get_accommodation_list.md](docs/tools/AccommodationProductListService.md) |
| `get_accommodation_info` | Detalles de un alojamiento | `AccommodationProductInfoService` | [→ get_accommodation_info.md](docs/tools/AccommodationProductInfoService.md) |
| `get_flight_list` | Lista de vuelos de un supplier | `TransportProductListService` | [→ get_flight_list.md](docs/tools/TransportProductListService.md) |

### Reservas

| Tool | Descripción | Camino Service | Documentación |
|------|-------------|----------------|---------------|
| `validate_option` | Validar disponibilidad y precio | `ValidationService` | [→ validate_option.md](docs/tools/ValidationService.md) |
| `create_booking` | Crear reserva y mint token | `MintService` | [→ create_booking.md](docs/tools/MintService.md) |


---

## Flujo de Reserva

```
search_accommodation / search_flights
         │
         ▼ search_id + option_id
   validate_option  ◄─── ValidationService
         │
         ▼ validation_id
   create_booking   ◄─── MintService
         │
         ▼ 
   tx_hash + booking_token
```

---

## Flujo de Catálogo (Cache)

```
get_accommodation_list / get_flight_list
         │
         ▼ Lista con LastModifiedTimestamp
get_accommodation_info (solo para alojamientos)
         │
         ▼
   Detalles completos del producto
```

---

## Pagos Blockchain

### Monedas Soportadas

| Moneda | Tipo | Uso |
|--------|------|-----|
| `EURe` | Stablecoin EUR (Monerium) | Pagos en euros |
| `USDC` | Stablecoin USD | Pagos en dólares |
| `CAM` | Token nativo | Network fees |

### Flujo de Pago (dentro de MintService)

1. `validate_option` → Confirma precio y disponibilidad
2. `create_booking` → Ejecuta `MintService`:
   - Supplier Bot mint del Booking Token (NFT)
   - Transferencia de fondos (EURe/USDC) al supplier
   - Booking Token transferido al comprador
3. Respuesta incluye `tx_hash` + `booking_token_id`

---

## Variables de Entorno

```bash
CAMINO_MESSENGER_ENDPOINT=grpc://localhost:9090
CAMINO_NETWORK=columbus
CAMINO_WALLET_ADDRESS=0x...
CAMINO_PRIVATE_KEY=...
```

---

## Referencias

### Camino Network
- Documentación general: https://docs.camino.network
- Camino Messenger: https://docs.camino.network/camino-messenger/introduction

### Protocol (buf.build)
- Accommodation v4: https://buf.build/chain4travel/camino-messenger-protocol/docs/main:cmp.services.accommodation.v4
- Transport v4: https://buf.build/chain4travel/camino-messenger-protocol/docs/main:cmp.services.transport.v4
- Book v4: https://buf.build/chain4travel/camino-messenger-protocol/docs/main:cmp.services.book.v4

### SDKs
- gRPC SDKs: https://buf.build/chain4travel/camino-messenger-protocol/sdks

### GitHub
- Messenger Protocol: https://github.com/chain4travel/camino-messenger-protocol
- Messenger Bot: https://github.com/chain4travel/camino-messenger-bot

---

## Prompt del Sistema

```
Eres un asistente de viajes conectado a Camino Network.

CAPACIDADES:
- Buscar alojamientos (hoteles, apartamentos)
- Buscar vuelos
- Consultar catálogo de productos de suppliers
- Validar disponibilidad en tiempo real
- Procesar reservas con pago en blockchain (USDC/EURe)

REGLAS:
- Siempre usa validate_option antes de create_booking
- Confirma el monto con el usuario antes de ejecutar la reserva
- Muestra el transaction_hash tras el pago para transparencia

FLUJO:
1. Entender necesidades (destino, fechas, huéspedes/pasajeros)
2. Buscar opciones (search_accommodation / search_flights)
3. Presentar resultados
4. Validar opción elegida (validate_option)
5. Recopilar datos de huéspedes/pasajeros
6. Crear reserva y pagar (create_booking)
7. Confirmar con booking_token y tx_hash
```