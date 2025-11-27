import { config } from 'dotenv';

config();

console.log('Variables de entorno cargadas:');
console.log('CAMINO_BOT_URL:', process.env.CAMINO_BOT_URL);
console.log('CAMINO_SUPPLIER_CM_ACCOUNT:', process.env.CAMINO_SUPPLIER_CM_ACCOUNT);
console.log('CAMINO_MESSENGER_DISTRIBUTOR_ADDRESS:', process.env.CAMINO_MESSENGER_DISTRIBUTOR_ADDRESS);
