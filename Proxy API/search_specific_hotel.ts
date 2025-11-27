/**
 * Ejemplo de búsqueda de un hotel específico usando su código
 * Este script te permite ver todas las habitaciones disponibles de un hotel en particular
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

// ESPECIFICA EL HOTEL QUE QUIERES BUSCAR
// Puedes usar el código que obtuviste de una búsqueda anterior
const HOTEL_CODE = 'HOTEL567890';  // Ejemplo: código GIATA del primer resultado
const CODE_TYPE = '656753';  // O PRODUCT_CODE_TYPE_GOAL_ID

console.log('🔧 Búsqueda de Hotel Específico');
console.log(`   Bot URL: ${BOT_URL}`);
console.log(`   Hotel Code: ${HOTEL_CODE} (${CODE_TYPE})`);
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

const searchId = randomUUID();
console.log(`📝 Buscando habitaciones disponibles...\n`);

const request = {
  header: {
    base_header: {
      version: { major: 1, minor: 0, patch: 0 },
      external_session_id: searchId,
    },
  },
  search_parameters: {
    currency: { iso_currency: 978 }, // EUR
    language: 1, // EN
    include_on_request: false,
    include_combinations: false,
  },
  // FILTRAR POR HOTEL ESPECÍFICO
  search_parameters_accommodation: {
    product_codes: [
      {
        code: HOTEL_CODE,
        type: CODE_TYPE,
        number: 0
      }
    ]
    // También puedes usar supplier_codes si tienes el código interno:
    // supplier_codes: [
    //   { code: "HOTEL123456", number: 0 }
    // ]
  },
  travel_period: {
    start_date: { year: 2025, month: 12, day: 1 },
    end_date: { year: 2025, month: 12, day: 5 },
  },
  travellers: [
    { type: 1 }, // Adult
    { type: 1 }, // Adult
  ],
  property_type: 1, // HOTEL
};

console.log('📤 Enviando búsqueda...\n');

const metadata = new Metadata();
metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

client.AccommodationSearch(request, metadata, (error: any, response: any) => {
  if (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }

  console.log('✅ Respuesta recibida!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏨 HABITACIONES DISPONIBLES - HOTEL ${HOTEL_CODE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (response.success_response?.results) {
    const results = response.success_response.results;
    console.log(`📍 Total de opciones: ${results.length}\n`);

    results.forEach((result: any, index: number) => {
      console.log(`╔═══════════════════════════════════════════╗`);
      console.log(`║  OPCIÓN ${index + 1}                                    ║`);
      console.log(`╚═══════════════════════════════════════════╝`);

      // Información del hotel
      console.log('\n📌 INFORMACIÓN DEL HOTEL:');
      console.log(`   Supplier Code: ${result.unit?.supplier_code?.code || 'N/A'}`);

      if (result.unit?.property_code) {
        console.log('   Códigos de Propiedad:');
        result.unit.property_code.forEach((pc: any) => {
          console.log(`     • ${pc.type}: ${pc.code}`);
        });
      }

      // Información de la habitación
      console.log('\n🛏️  INFORMACIÓN DE LA HABITACIÓN:');
      console.log(`   Código: ${result.unit?.supplier_room_code || 'N/A'}`);
      console.log(`   Nombre: ${result.unit?.supplier_room_name || 'N/A'}`);

      if (result.unit?.original_room_name) {
        console.log(`   Nombre Original: ${result.unit.original_room_name}`);
      }

      // Configuración de camas
      if (result.unit?.beds && result.unit.beds.length > 0) {
        console.log('\n   🛌 Configuración de Camas:');
        result.unit.beds.forEach((bed: any) => {
          const bedType = bed.type.replace('BED_TYPE_', '');
          console.log(`     • ${bed.count}x ${bedType}`);
        });
      }

      // Régimen alimenticio
      if (result.unit?.meal_plan) {
        console.log('\n🍽️  RÉGIMEN ALIMENTICIO:');
        console.log(`   ${result.unit.meal_plan.description || 'N/A'}`);
        console.log(`   Código: ${result.unit.meal_plan.code || 'N/A'}`);
      }

      // Rate plan
      if (result.unit?.rate_plan) {
        console.log('\n📋 RATE PLAN:');
        console.log(`   Código: ${result.unit.rate_plan.code || 'N/A'}`);
        console.log(`   Tipo: ${result.unit.rate_plan.type || 'N/A'}`);
        if (result.unit.rate_plan.description) {
          console.log(`   Descripción: ${result.unit.rate_plan.description}`);
        }
      }

      // Precio
      if (result.total_price?.value) {
        console.log('\n💰 PRECIO:');
        const price = result.total_price.value.value || '0';
        const decimals = result.total_price.value.decimals || 0;
        const currency = result.total_price.value.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';
        const priceFormatted = decimals > 0 ? (parseFloat(price) / Math.pow(10, decimals)).toFixed(2) : price;
        console.log(`   Total: ${priceFormatted} ${currency}`);

        // Desglose por persona si está disponible
        if (result.unit?.price_detail?.price) {
          const unitPrice = result.unit.price_detail.price.value || '0';
          const unitDecimals = result.unit.price_detail.price.decimals || 0;
          const unitPriceFormatted = unitDecimals > 0 ? (parseFloat(unitPrice) / Math.pow(10, unitDecimals)).toFixed(2) : unitPrice;
          console.log(`   Por Unidad: ${unitPriceFormatted} ${currency}`);
          console.log(`   Tipo de Cargo: ${result.unit.price_detail.charge_type || 'N/A'}`);
        }
      }

      // Disponibilidad
      console.log('\n📦 DISPONIBILIDAD:');
      console.log(`   Unidades restantes: ${result.unit?.remaining_units !== undefined ? result.unit.remaining_units : 'N/A'}`);

      if (result.bookability) {
        console.log(`   Estado: ${result.bookability.type || 'N/A'}`);
      }

      // Política de cancelación
      if (result.total_price?.cancel_policy?.complex_cancel_penalties) {
        console.log('\n📋 POLÍTICA DE CANCELACIÓN:');
        const penalties = result.total_price.cancel_policy.complex_cancel_penalties.cancel_penalties || [];
        penalties.forEach((penalty: any, idx: number) => {
          const startDate = new Date(parseInt(penalty.datetime_range.start.seconds) * 1000);
          const endDate = new Date(parseInt(penalty.datetime_range.end.seconds) * 1000);
          const penaltyPrice = penalty.value?.value || '0';
          const penaltyCurrency = penalty.value?.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || '';

          console.log(`   Periodo ${idx + 1}:`);
          console.log(`     Desde: ${startDate.toLocaleString('es-ES')}`);
          console.log(`     Hasta: ${endDate.toLocaleString('es-ES')}`);
          console.log(`     Penalización: ${penaltyPrice} ${penaltyCurrency}`);
        });
      }

      // Servicios incluidos
      if (result.unit?.services && result.unit.services.length > 0) {
        console.log('\n🎁 SERVICIOS INCLUIDOS:');
        result.unit.services.forEach((service: any) => {
          console.log(`   • ${service.code || 'N/A'}`);
          if (service.price_detail?.description) {
            console.log(`     ${service.price_detail.description}`);
          }
          if (service.availability_type) {
            console.log(`     Tipo: ${service.availability_type}`);
          }
        });
      }

      // Observaciones
      if (result.unit?.remarks) {
        console.log('\n📝 OBSERVACIONES:');
        console.log(`   ${result.unit.remarks}`);
      }

      console.log('\n' + '═'.repeat(45) + '\n');
    });

  } else if (response.error_response) {
    console.log('❌ Error en la respuesta:');
    response.error_response.header?.errors?.forEach((error: any) => {
      console.log(`   ${error.code}: ${error.message}`);
    });
  }

  process.exit(0);
});
