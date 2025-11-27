# 🤖 Configuración del Bot Local - Estado Actual

**Fecha**: 2025-11-27 10:07 CET

---

## ✅ Lo que funciona

1. **Docker configurado** - El bot puede iniciar en Docker
2. **Config actualizado** - RPC server habilitado en puerto 9090
3. **Puerto expuesto** - localhost:9090 está listo
4. **`.env` actualizado** - Apuntando a localhost:9090

---

## ❌ Problema Actual

```
ERROR: failed to fetch Registered services: no contract code at given address
```

**Causa**: La clave privada de prueba no corresponde a la dirección del CM Account configurada.

**Dirección CM Account configurada**: `0xfe4b4cE48d11Aa5C5dbE311150Ad2D60D4F433e5`
**Clave privada usada**: Clave de prueba (no válida para producción)

---

## 🔑 Solución: Necesitas tu Clave Privada Real

### Opción 1: Usar tu Wallet de Camino Network (RECOMENDADA)

1. **Obtener tu clave privada**:
   - Ve a https://suite.camino.network
   - Conecta tu wallet
   - Sigue las instrucciones para exportar la clave privada

2. **Actualizar config**:
   ```bash
   # Edita: camino-messenger-bot/cmb-config/config.yaml
   bot_key: <TU_CLAVE_PRIVADA_SIN_0x>
   cm_account_address: <TU_DIRECCION_CM_ACCOUNT>
   ```

3. **Reiniciar bot**:
   ```bash
   cd camino-messenger-bot
   docker-compose restart bot
   ```

4. **Probar conexión**:
   ```bash
   cd ..
   npx tsx search_availability.ts
   ```

### Opción 2: Usar el Bot Remoto

Si no quieres configurar el bot local, puedes usar el bot remoto que mencionaste:

1. **Actualizar `.env`**:
   ```env
   CAMINO_BOT_URL=http://3.74.156.61:9090
   ```

2. **Verificar acceso**:
   - Confirmar que tienes acceso VPN o IP whitelisted
   - O solicitar acceso a los administradores

3. **Probar conexión**:
   ```bash
   npx tsx search_availability.ts
   ```

### Opción 3: Bot Mock para Desarrollo

Si solo quieres probar la integración sin datos reales:

Podríamos crear un bot mock que responde con datos ficticios para desarrollo local.

---

## 📝 Configuración Actual del Bot

### `camino-messenger-bot/cmb-config/config.yaml`

```yaml
# Bot configurado como DISTRIBUTOR
rpc_server:
  enabled: true      ✅ Habilitado
  port: 9090         ✅ Puerto correcto

partner_plugin:
  enabled: false     ✅ Deshabilitado (no necesario para distributor)

bot_key: <CLAVE_DE_PRUEBA>  ⚠️ Necesita ser reemplazada
cm_account_address: 0xfe4b4cE48d11Aa5C5dbE311150Ad2D60D4F433e5
```

---

## 🔍 Cómo Obtener tu Clave Privada

### Desde Camino Suite

1. Ve a https://suite.camino.network
2. Conecta tu wallet
3. En el menú, selecciona "Export Private Key"
4. Copia la clave (debe ser hexadecimal de 64 caracteres)
5. **IMPORTANTE**: Quita el prefijo `0x` si lo tiene

### Formato correcto

```
✅ Correcto:  b466d215f7bf0bcb3be3fc704c16ac5447008e24c2b17bb6c04994f2da850822
❌ Incorrecto: 0xb466d215f7bf0bcb3be3fc704c16ac5447008e24c2b17bb6c04994f2da850822
❌ Incorrecto: 21Ja5D5RziXu6B641aGNtKcQPhqpqeZD6XRMif6kcuVqE4MDgk
```

---

## 🚀 Próximos Pasos

### Si tienes la clave privada:

```bash
# 1. Editar config
nano camino-messenger-bot/cmb-config/config.yaml

# 2. Reemplazar bot_key con tu clave (sin 0x)
# 3. Verificar cm_account_address

# 4. Reiniciar bot
cd camino-messenger-bot
docker-compose restart bot

# 5. Ver logs
docker-compose logs -f bot

# 6. Probar búsqueda
cd ..
npx tsx search_availability.ts
```

### Si NO tienes la clave privada:

```bash
# Opción A: Usar bot remoto (si tienes acceso)
# Editar .env:
CAMINO_BOT_URL=http://3.74.156.61:9090

npx tsx search_availability.ts
```

---

## 📞 Soporte

- **Discord Camino Network**: https://discord.gg/camino
- **Docs**: https://docs.camino.network/guides/how-to-login-to-your-wallet#how-to-retrieve-your-private-key

---

**Estado**: ⏳ Bot configurado pero necesita clave privada válida
