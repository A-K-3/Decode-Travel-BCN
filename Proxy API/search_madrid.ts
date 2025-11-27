/**
 * Ejemplo de búsqueda de hoteles en Madrid usando coordenadas
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

console.log('🔧 Búsqueda de Hoteles en MADRID');
console.log(`   Bot URL: ${BOT_URL}`);
console.log(`   Supplier: ${SUPPLIER_ADDRESS}`);
console.log(`   Distributor: ${DISTRIBUTOR_ADDRESS}`);
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

// Crear cliente
const client = new accommodation.AccommodationSearchService(
  BOT_URL,
  credentials.createInsecure()
);

console.log('✅ Cliente gRPC creado\n');

// Crear request con búsqueda en Madrid
const searchId = randomUUID();
console.log(`📝 Creando búsqueda para Madrid`);
console.log(`   Search ID: ${searchId}`);
console.log(`   Filtro: España (COUNTRY_ES=13), ciudad "Madrid"\n`);

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
  // Filtros de ubicación para Madrid
  search_parameters_accommodation: {
    // GeoTree con país y ciudad (VALORES CORREGIDOS)
    location_geo_tree: {
      country: 13,  // COUNTRY_ES = 13 (según country.proto)
      city_or_resort: "Madrid"  // Nombre correcto del campo
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
  property_type: 1, // PROPERTY_TYPE_HOTEL (requerido en v4)
};

console.log('📤 Enviando búsqueda al bot...\n');

// Metadata con supplier
const metadata = new Metadata();
metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

// Realizar búsqueda
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
  console.log('📊 HOTELES EN MADRID');
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

        const supplierCode = result.unit?.supplier_code?.code || 'N/A';
        console.log(`Código Supplier: ${supplierCode}`);

        // Property codes (para buscar detalles después)
        if (result.unit?.property_code && result.unit.property_code.length > 0) {
          console.log('Códigos de Propiedad:');
          result.unit.property_code.forEach((pc: any) => {
            console.log(`  - ${pc.type}: ${pc.code}`);
          });
        }

        // Detalles de la habitación
        if (result.unit?.supplier_room_name) {
          console.log(`Habitación: ${result.unit.supplier_room_name}`);
        }

        if (result.unit?.original_room_name) {
          console.log(`Nombre Original: ${result.unit.original_room_name}`);
        }

        // Tipo de camas
        if (result.unit?.beds && result.unit.beds.length > 0) {
          console.log('Camas:');
          result.unit.beds.forEach((bed: any) => {
            console.log(`  - ${bed.type}: ${bed.count}`);
          });
        }

        // Régimen alimenticio
        if (result.unit?.meal_plan?.description) {
          console.log(`Régimen: ${result.unit.meal_plan.description}`);
        }

        // Precio
        if (result.total_price?.value) {
          const price = result.total_price.value.value || 'N/A';
          const decimals = result.total_price.value.decimals || 0;
          const currency = result.total_price.value.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';
          const priceFormatted = decimals > 0 ? (parseFloat(price) / Math.pow(10, decimals)).toFixed(2) : price;
          console.log(`💰 Precio Total: ${priceFormatted} ${currency}`);
        }

        // Disponibilidad
        if (result.unit?.remaining_units !== undefined) {
          console.log(`📦 Unidades disponibles: ${result.unit.remaining_units}`);
        }

        // Política de cancelación
        if (result.total_price?.cancel_policy?.complex_cancel_penalties) {
          console.log('📋 Política de Cancelación:');
          const penalties = result.total_price.cancel_policy.complex_cancel_penalties.cancel_penalties || [];
          penalties.forEach((penalty: any, idx: number) => {
            const startDate = new Date(parseInt(penalty.datetime_range.start.seconds) * 1000);
            const endDate = new Date(parseInt(penalty.datetime_range.end.seconds) * 1000);
            const penaltyPrice = penalty.value?.value || '0';
            const penaltyCurrency = penalty.value?.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';

            console.log(`  ${idx + 1}. Desde ${startDate.toLocaleDateString()} hasta ${endDate.toLocaleDateString()}`);
            console.log(`     Penalización: ${penaltyPrice} ${penaltyCurrency}`);
          });
        }

        console.log('');
      });
    } else {
      console.log('   ℹ️  No se encontraron hoteles disponibles en Madrid para estas fechas');
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
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Búsqueda completada');

  process.exit(0);
});
