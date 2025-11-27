/**
 * Script para obtener la dirección C-Chain desde una clave privada
 */

import { createHash } from 'crypto';
import pkg from 'elliptic';
const { ec: EC } = pkg;

const ec = new EC('secp256k1');

const privateKeyHex = process.argv[2];

if (!privateKeyHex) {
  console.log('❌ Error: No se proporcionó una clave privada');
  console.log('');
  console.log('Uso:');
  console.log('  node get_address_from_key.js <clave_hex>');
  process.exit(1);
}

console.log('🔑 Calculando dirección C-Chain...\n');

try {
  // Crear par de claves desde la clave privada
  const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');

  // Obtener la clave pública
  const publicKey = keyPair.getPublic();

  // Obtener la clave pública en formato uncompressed (04 + x + y)
  const publicKeyHex = publicKey.encode('hex');

  console.log('📤 Clave Pública:');
  console.log(`   ${publicKeyHex}\n`);

  // Para C-Chain (compatible con Ethereum), la dirección es el keccak256 de la clave pública (sin el prefijo 04)
  // y se toman los últimos 20 bytes

  const publicKeyBytes = Buffer.from(publicKeyHex, 'hex').slice(1); // Remover el prefijo 04

  // Keccak-256 (no SHA3-256)
  const Keccak = await import('keccak').then(m => m.default);
  const hash = Keccak('keccak256').update(publicKeyBytes).digest();

  // Los últimos 20 bytes son la dirección
  const address = '0x' + hash.slice(-20).toString('hex');

  console.log('📍 Dirección C-Chain:');
  console.log(`   ${address}\n`);

  console.log('✅ Cálculo exitoso!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
