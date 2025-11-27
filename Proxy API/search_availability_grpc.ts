/**
 * Script para buscar disponibilidad usando gRPC nativo
 * Compatible con el bot de Camino Messenger
 */

import { loadPackageDefinition, credentials, Metadata } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const BOT_URL = '3.74.156.61:9090';
const SUPPLIER_ADDRESS = '0x1bba6d75f329022349799d78d87fe9d79fa4c36e';
const DISTRIBUTOR_ADDRESS = '0xfe4b4cE48d11Aa5C5dbE311150Ad2D60D4F433e5';

console.log('🔧 Configuración:');
console.log(`   Bot URL: ${BOT_URL}`);
console.log(`   Supplier: ${SUPPLIER_ADDRESS}`);
console.log(`   Distributor: ${DISTRIBUTOR_ADDRESS}`);
console.log('');

// Cargar el archivo .proto
const PROTO_PATH = join(__dirname, 'camino-messenger-protocol', 'proto', 'cmp', 'services', 'accommodation', 'v4', 'search.proto');

const packageDefinition = loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [
      join(__dirname, 'camino-messenger-protocol', 'proto'),
      join(__dirname, 'node_modules')
    ]
  }
);

const protoDescriptor = loadPackageDefinition(packageDefinition);
const accommodation = (protoDescriptor.cmp.services.accommodation.v4 as any);

// Crear cliente gRPC
const client = new accommodation.AccommodationSearchService(
  BOT_URL,
  credentials.createInsecure()
);

console.log('✅ Cliente gRPC creado\n');

// Crear request
const searchId = randomUUID();
console.log(`📝 Creando request con Search ID: ${searchId}\n`);

const request = {
  header: {
    base_header: {
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      external_session_id: searchId,
    },
  },
  search_parameters: {
    currency: {
      iso_currency: 978, // EUR (ISO 4217 currency code)
    },
    language: 1, // EN = 1 (not UNSPECIFIED = 0)
    market: 0, // Optional
    include_on_request: false,
    include_combinations: false,
  },
  search_parameters_accommodation: {},
  travel_period: {
    start_date: {
      year: 2025,
      month: 12,
      day: 1,
    },
    end_date: {
      year: 2025,
      month: 12,
      day: 5,
    },
  },
  travellers: [
    { type: 1 }, // Adult
    { type: 1 }, // Adult
  ],
  property_type: 1, // HOTEL = 1 (not UNSPECIFIED = 0)
};

console.log('📤 Enviando búsqueda al bot...\n');

// Crear metadata con la dirección del supplier
const metadata = new Metadata();
metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

console.log(`🔑 Metadata configurado:`);
console.log(`   Recipient (Supplier): ${SUPPLIER_ADDRESS}`);
console.log(`   Sender (Distributor): ${DISTRIBUTOR_ADDRESS}\n`);

// Realizar búsqueda con metadata
client.AccommodationSearch(request, metadata, (error: any, response: any) => {
  if (error) {
    console.error('❌ ERROR durante la búsqueda:\n');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Detalles: ${error.details}\n`);
    process.exit(1);
  }

  console.log('✅ Respuesta recibida!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTADOS DE DISPONIBILIDAD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (response.success_response) {
    const successResponse = response.success_response;

    console.log(`🔍 Search ID: ${successResponse.search_id?.id?.value || 'N/A'}`);
    console.log(`📍 Resultados encontrados: ${successResponse.results?.length || 0}\n`);

    if (successResponse.results && successResponse.results.length > 0) {
      console.log('🏨 ALOJAMIENTOS DISPONIBLES:\n');

      successResponse.results.forEach((result: any, index: number) => {
        console.log(`   ${index + 1}. Result ID: ${result.result_id !== undefined ? result.result_id : 'N/A'}`);

        // Supplier code (código del hotel del supplier)
        const supplierCode = result.unit?.supplier_code?.code || 'N/A';
        console.log(`      Supplier Code: ${supplierCode}`);

        // Property codes (códigos GIATA, etc)
        if (result.unit?.property_code && result.unit.property_code.length > 0) {
          result.unit.property_code.forEach((pc: any) => {
            console.log(`      ${pc.type}: ${pc.code}`);
          });
        }

        // Room info
        if (result.unit?.supplier_room_name) {
          console.log(`      Habitación: ${result.unit.supplier_room_name}`);
        }

        // Meal plan
        if (result.unit?.meal_plan?.description) {
          console.log(`      Régimen: ${result.unit.meal_plan.description}`);
        }

        // Price
        if (result.total_price?.value) {
          const price = result.total_price.value.value || 'N/A';
          const decimals = result.total_price.value.decimals || 0;
          const currency = result.total_price.value.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';
          const priceFormatted = decimals > 0 ? (parseFloat(price) / Math.pow(10, decimals)).toFixed(2) : price;
          console.log(`      Precio Total: ${priceFormatted} ${currency}`);
        }

        // Remaining units
        if (result.unit?.remaining_units !== undefined) {
          console.log(`      Unidades disponibles: ${result.unit.remaining_units}`);
        }

        console.log('');
      });
    } else {
      console.log('   ℹ️  No se encontraron resultados disponibles');
    }

    if (successResponse.travellers && successResponse.travellers.length > 0) {
      console.log(`👥 Viajeros: ${successResponse.travellers.length}`);
    }

  } else if (response.error_response) {
    const errorResponse = response.error_response;

    console.log('❌ ERROR EN LA RESPUESTA:\n');

    if (errorResponse.header?.errors && errorResponse.header.errors.length > 0) {
      errorResponse.header.errors.forEach((error: any, index: number) => {
        console.log(`   Error ${index + 1}:`);
        console.log(`   Código: ${error.code || 'N/A'}`);
        console.log(`   Mensaje: ${error.message || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log(`   Código: ${errorResponse.header?.code || 'N/A'}`);
      console.log(`   Mensaje: ${errorResponse.header?.message || 'N/A'}`);
    }

    if (errorResponse.header?.supplier_messages && errorResponse.header.supplier_messages.length > 0) {
      console.log('\n   Mensajes del supplier:');
      errorResponse.header.supplier_messages.forEach((msg: string) => {
        console.log(`   - ${msg}`);
      });
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Búsqueda completada exitosamente');

  process.exit(0);
});
