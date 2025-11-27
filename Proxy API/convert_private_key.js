/**
 * Script para convertir claves privadas de Camino Network
 * de formato CB58 (PrivateKey-...) a hexadecimal
 */

// Necesitamos instalar: npm install avalanche

import { Buffer } from 'buffer';

// Función básica de decodificación CB58 (base58check usado por Avalanche/Camino)
function cb58Decode(str) {
  // Remover el prefijo "PrivateKey-" si está presente
  const key = str.replace('PrivateKey-', '');

  // Alfabeto Base58 de Bitcoin/Avalanche
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let num = BigInt(0);
  for (let i = 0; i < key.length; i++) {
    num = num * BigInt(58) + BigInt(ALPHABET.indexOf(key[i]));
  }

  // Convertir a bytes
  const hex = num.toString(16);
  const buffer = Buffer.from(hex.length % 2 ? '0' + hex : hex, 'hex');

  // En CB58Check, los últimos 4 bytes son el checksum
  // Necesitamos quitarlos
  const payload = buffer.slice(0, buffer.length - 4);

  return payload.toString('hex');
}

// Obtener la clave del argumento de línea de comandos
const privateKeyCB58 = process.argv[2];

if (!privateKeyCB58) {
  console.log('❌ Error: No se proporcionó una clave privada');
  console.log('');
  console.log('Uso:');
  console.log('  node convert_private_key.js "PrivateKey-..."');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node convert_private_key.js "PrivateKey-Zwg8KgoAwWZMNaihz8xeptm7xWEr89sLhAZnXbPUCydfv9vqU"');
  process.exit(1);
}

console.log('🔑 Conversión de Clave Privada Camino Network');
console.log('═══════════════════════════════════════════════\n');

try {
  console.log('📥 Clave CB58 (entrada):');
  console.log(`   ${privateKeyCB58}\n`);

  const hexKey = cb58Decode(privateKeyCB58);

  console.log('📤 Clave Hexadecimal (salida):');
  console.log(`   ${hexKey}\n`);

  console.log('✅ Conversión exitosa!');
  console.log('');
  console.log('📝 Próximos pasos:');
  console.log('1. Copia la clave hexadecimal (sin 0x)');
  console.log('2. Edita: camino-messenger-bot/cmb-config/config.yaml');
  console.log('3. Reemplaza bot_key con la clave hexadecimal');
  console.log('4. Reinicia el bot: cd camino-messenger-bot && docker-compose up -d bot');
  console.log('');
  console.log('⚠️  IMPORTANTE: Nunca compartas esta clave públicamente');

} catch (error) {
  console.error('❌ Error al convertir la clave:', error.message);
  console.log('');
  console.log('💡 Tip: Verifica que la clave esté completa y sea válida');
  process.exit(1);
}
