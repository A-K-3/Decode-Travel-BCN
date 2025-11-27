# Camino Travel MCP Server

MCP Server para búsqueda y reserva de alojamientos y vuelos a través de Camino Messenger, con pagos en blockchain (USDC/EURe).

## Requisitos

- Node.js v24.x o superior
- npm v10.x o superior
- Acceso a Camino Network (Columbus testnet o Mainnet)

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
CAMINO_MESSENGER_ENDPOINT=grpc://localhost:9090
CAMINO_NETWORK=columbus
CAMINO_WALLET_ADDRESS=0x...
CAMINO_PRIVATE_KEY=...
```

## Build

El proceso de build incluye la generación de archivos protobuf y la compilación de TypeScript:

```bash
npm run build
```

Esto ejecutará:
1. `npm run generate` - Genera archivos TypeScript desde protobuf
2. `tsc` - Compila TypeScript a JavaScript

## Scripts Disponibles

```bash
# Generar solo archivos protobuf
npm run generate

# Compilar todo (protobuf + TypeScript)
npm run build

# Desarrollo con hot reload
npm run dev

# Ejecutar en producción
npm start
```

## Uso con Claude Desktop

Configura el MCP server en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "camino-travel": {
      "command": "node",
      "args": ["D:/DECODE/dist/src/index.js"],
      "env": {
        "CAMINO_MESSENGER_ENDPOINT": "grpc://localhost:9090",
        "CAMINO_NETWORK": "columbus"
      }
    }
  }
}
```

## Arquitectura

Ver [CLAUDE.md](CLAUDE.md) para documentación completa sobre:
- Servicios Camino Messenger disponibles
- Tools implementados
- Flujos de reserva y catálogo
- Pagos blockchain

## Troubleshooting

Si encuentras problemas de importación de módulos o errores de build, consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### Problema común: ERR_MODULE_NOT_FOUND

Si ves este error al arrancar el servidor:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...'
```

**Solución**: Ejecuta `npm run build` (no solo `tsc`). Esto regenerará los archivos protobuf con las extensiones correctas para Node.js ESM.

## Estructura del Proyecto

```
/mnt/d/DECODE/
├── src/                    # Código fuente TypeScript
│   ├── index.ts           # Entry point del MCP server
│   ├── tools/             # Implementación de tools
│   └── services/          # Servicios de Camino Messenger
├── gen/                   # Archivos protobuf generados (TypeScript)
├── dist/                  # Archivos compilados (JavaScript)
├── buf.gen.yaml           # Configuración de generación protobuf
├── tsconfig.json          # Configuración de TypeScript
└── package.json           # Dependencias y scripts
```

## Notas Técnicas

Este proyecto usa:
- **Node.js ESM** (`"type": "module"` en package.json)
- **TypeScript** con `moduleResolution: "node"`
- **Protobuf-ES** con `import_extension=.js` para compatibilidad ESM

Todos los imports en archivos TypeScript deben incluir la extensión `.js` (TypeScript no la agrega automáticamente).

## Referencias

- [Camino Network Documentation](https://docs.camino.network)
- [Camino Messenger](https://docs.camino.network/camino-messenger/introduction)
- [Protocol Buffer Schemas](https://buf.build/chain4travel/camino-messenger-protocol)
- [Messenger Bot](https://github.com/chain4travel/camino-messenger-bot)
