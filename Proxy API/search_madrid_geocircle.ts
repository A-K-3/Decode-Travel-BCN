/**
 * Ejemplo de búsqueda de hoteles usando coordenadas + radio (GeoCircle)
 * Esta es una alternativa más flexible que GeoTree cuando no conoces
 * los nombres exactos de ciudad que usa el proveedor
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

console.log('🔧 Búsqueda de Hoteles con Radio Geográfico');
console.log(`   Bot URL: ${BOT_URL}`);
console.log(`   Supplier: ${SUPPLIER_ADDRESS}`);
console.log('');

// Cargar proto files
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

const client = new accommodation.AccommodationSearchService(
  BOT_URL,
  credentials.createInsecure()
);

console.log('✅ Cliente gRPC creado\n');

// Crear request con búsqueda por coordenadas + radio
const searchId = randomUUID();
console.log(`📝 Creando búsqueda con coordenadas de Madrid`);
console.log(`   Search ID: ${searchId}`);
console.log(`   Centro: 40.4168°N, 3.7038°W`);
console.log(`   Radio: 10 km\n`);

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
      iso_currency: 978, // EUR
    },
    language: 1, // EN
    market: 0,
    include_on_request: false,
    include_combinations: false,
  },
  // Búsqueda por coordenadas + radio (GeoCircle)
  search_parameters_accommodation: {
    location_geo_circle: {
      center: {
        latitude: 40.4168,   // Madrid centro
        longitude: -3.7038
      },
      radius: {
        value: 10000,  // 10 km = 10000 metros
        unit: 3  // LENGTH_UNIT_METER
      }
    }
  },
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
    { type: 1 }, // TRAVELLER_TYPE_ADULT
    { type: 1 }, // TRAVELLER_TYPE_ADULT
  ],
  property_type: 1, // PROPERTY_TYPE_HOTEL
};

console.log('📤 Enviando búsqueda al bot...\n');

const metadata = new Metadata();
metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

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
  console.log('📊 HOTELES CERCA DE MADRID (10 km)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (response.success_response) {
    const successResponse = response.success_response;

    console.log(`🔍 Search ID: ${successResponse.search_id?.id?.value || 'N/A'}`);
    console.log(`📍 Hoteles encontrados: ${successResponse.results?.length || 0}\n`);

    if (successResponse.results && successResponse.results.length > 0) {
      console.log('🏨 HOTELES DISPONIBLES:\n');

      successResponse.results.forEach((result: any, index: number) => {
        console.log(`━━━━ HOTEL ${index + 1} ━━━━`);
        console.log(`Result ID: ${result.result_id}`);
        console.log(`Código Supplier: ${result.unit?.supplier_code?.code || 'N/A'}`);

        if (result.unit?.property_code && result.unit.property_code.length > 0) {
          console.log('Códigos de Propiedad:');
          result.unit.property_code.forEach((pc: any) => {
            console.log(`  - ${pc.type}: ${pc.code}`);
          });
        }

        if (result.unit?.supplier_room_name) {
          console.log(`Habitación: ${result.unit.supplier_room_name}`);
        }

        if (result.total_price?.value) {
          const price = result.total_price.value.value || 'N/A';
          const decimals = result.total_price.value.decimals || 0;
          const currency = result.total_price.value.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';
          const priceFormatted = decimals > 0 ? (parseFloat(price) / Math.pow(10, decimals)).toFixed(2) : price;
          console.log(`💰 Precio Total: ${priceFormatted} ${currency}`);
        }

        console.log('');
      });
    } else {
      console.log('   ℹ️  No se encontraron hoteles en un radio de 10 km de Madrid');
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
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Búsqueda completada');

  process.exit(0);
});

