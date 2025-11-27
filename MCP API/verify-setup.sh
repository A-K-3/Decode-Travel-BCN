#!/bin/bash

# Script de verificación para MCP Travel Booking

set -e

echo "==================================="
echo "Verificando setup de MCP Server"
echo "==================================="
echo ""

# Verificar Node.js
echo "1. Verificando Node.js..."
NODE_VERSION=$(node --version)
echo "   Version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v(18|20|21|22|23|24) ]]; then
  echo "   WARNING: Node.js v18+ recomendado"
fi
echo ""

# Verificar NPM
echo "2. Verificando NPM..."
NPM_VERSION=$(npm --version)
echo "   Version: $NPM_VERSION"
echo ""

# Verificar dependencias
echo "3. Verificando dependencias..."
if [ ! -d "node_modules" ]; then
  echo "   ERROR: node_modules no encontrado. Ejecuta: npm install"
  exit 1
fi
echo "   OK: node_modules encontrado"
echo ""

# Verificar archivos protobuf generados
echo "4. Verificando archivos protobuf generados..."
if [ ! -d "gen" ]; then
  echo "   ERROR: gen/ no encontrado. Ejecuta: npm run generate"
  exit 1
fi

if [ ! -f "gen/buf/validate/validate_pb.ts" ]; then
  echo "   ERROR: buf/validate/validate_pb.ts no encontrado"
  echo "   Ejecuta: npm run generate"
  exit 1
fi
echo "   OK: Archivos protobuf generados"
echo ""

# Verificar compilación TypeScript
echo "5. Verificando compilación TypeScript..."
if [ ! -d "dist" ]; then
  echo "   ERROR: dist/ no encontrado. Ejecuta: npm run build"
  exit 1
fi

if [ ! -f "dist/src/index.js" ]; then
  echo "   ERROR: dist/src/index.js no encontrado"
  echo "   Ejecuta: npm run build"
  exit 1
fi
echo "   OK: TypeScript compilado"
echo ""

# Verificar extensiones .js en imports
echo "6. Verificando extensiones .js en imports..."
MISSING_EXTENSIONS=$(grep -r "from.*validate_pb\"" dist/gen/ 2>/dev/null | grep -v ".js" | wc -l || echo "0")
if [ "$MISSING_EXTENSIONS" -gt 0 ]; then
  echo "   ERROR: Encontrados imports sin extensión .js"
  echo "   Solución: Verifica buf.gen.yaml tiene 'import_extension=.js' y ejecuta npm run build"
  exit 1
fi
echo "   OK: Imports con extensión .js"
echo ""

# Verificar que el servidor puede arrancar
echo "7. Verificando que el servidor arranca..."
timeout 2 node dist/src/index.js >/dev/null 2>&1 &
SERVER_PID=$!
sleep 1
if ps -p $SERVER_PID > /dev/null 2>&1; then
  echo "   OK: Servidor arranca correctamente"
  kill $SERVER_PID 2>/dev/null || true
else
  echo "   ERROR: Problema al arrancar servidor"
  echo "   Ejecuta manualmente: node dist/src/index.js"
  exit 1
fi
echo ""

# Verificar archivo .env (opcional)
echo "8. Verificando archivo .env..."
if [ ! -f ".env" ]; then
  echo "   WARNING: .env no encontrado (opcional)"
  echo "   Crea .env con CAMINO_MESSENGER_ENDPOINT, etc."
else
  echo "   OK: .env encontrado"
fi
echo ""

echo "==================================="
echo "VERIFICACION COMPLETA"
echo "==================================="
echo ""
echo "Todo listo para usar el MCP server!"
echo ""
echo "Comandos utiles:"
echo "  npm run dev       - Modo desarrollo"
echo "  npm run build     - Compilar"
echo "  npm start         - Ejecutar en produccion"
echo ""
