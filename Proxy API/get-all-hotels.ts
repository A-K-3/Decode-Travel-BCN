/**
 * Script para obtener todos los hoteles con sus nombres y ubicaciones
 *
 * Uso: npx tsx get-all-hotels.ts
 *
 * Este script:
 * 1. Obtiene la lista de todos los hoteles usando AccommodationProductShortList
 * 2. Obtiene los detalles de cada hotel usando AccommodationProductInfo
 * 3. Guarda los resultados en un archivo JSON y CSV
 */

import { loadPackageDefinition, credentials, Metadata } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Configuración
const BOT_URL = '3.74.156.61:9090';
const SUPPLIER_ADDRESS = process.env.CAMINO_SUPPLIER_CM_ACCOUNT || '0x1bba6d75f329022349799d78d87fe9d79fa4c36e';

console.log('🏨 Script para obtener todos los hoteles');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📡 Bot URL: ${BOT_URL}`);
console.log(`🏢 Supplier: ${SUPPLIER_ADDRESS}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Opciones del proto loader
const protoLoaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [
    join(process.cwd(), 'camino-messenger-protocol', 'proto'),
    join(process.cwd(), 'node_modules')
  ]
};

/**
 * Carga el cliente gRPC para un servicio
 */
function loadGrpcClient(protoFile: string, serviceName: string): any {
  const protoPath = join(process.cwd(), 'camino-messenger-protocol', 'proto', 'cmp', 'services', 'accommodation', 'v4', protoFile);

  const packageDefinition = loadSync(protoPath, protoLoaderOptions);
  const protoDescriptor = loadPackageDefinition(packageDefinition);
  const service = (protoDescriptor.cmp.services.accommodation.v4 as any);

  return new service[serviceName](BOT_URL, credentials.createInsecure());
}

/**
 * Obtiene la lista corta de hoteles (códigos)
 */
async function getHotelShortList(): Promise<string[]> {
  console.log('📋 Paso 1: Obteniendo lista de códigos de hoteles...\n');

  const client = loadGrpcClient('short_list.proto', 'AccommodationProductShortListService');

  return new Promise((resolve, reject) => {
    const request = {
      header: {
        base_header: {
          version: { major: 1, minor: 0, patch: 0 },
          external_session_id: randomUUID(),
        },
      },
      // Sin modified_after para obtener todos
      modified_after: null
    };

    const metadata = new Metadata();
    metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

    client.AccommodationProductShortList(request, metadata, (error: any, response: any) => {
      if (error) {
        reject(error);
        return;
      }

      if (response.error_response) {
        reject(new Error('Error en ShortList: ' + JSON.stringify(response.error_response.header?.errors)));
        return;
      }

      const items = response.success_response?.property_short_list_items || [];
      console.log(`   ✅ Encontrados ${items.length} hoteles`);

      // Obtener TODOS los códigos (sin filtrar por estado)
      const allCodes = items
        .map((item: any) => item.supplier_code?.code)
        .filter(Boolean);

      console.log(`   ✅ Total hoteles a procesar: ${allCodes.length}\n`);

      resolve(allCodes);
    });
  });
}

/**
 * Obtiene información detallada de hoteles (en lotes)
 */
async function getHotelDetails(codes: string[]): Promise<any[]> {
  console.log('📝 Paso 2: Obteniendo detalles de los hoteles...\n');

  const client = loadGrpcClient('info.proto', 'AccommodationProductInfoService');

  const batchSize = 50; // Procesar en lotes de 50
  const batches = [];

  for (let i = 0; i < codes.length; i += batchSize) {
    batches.push(codes.slice(i, i + batchSize));
  }

  console.log(`   📦 Procesando ${batches.length} lotes de ${batchSize} hoteles cada uno...\n`);

  const allHotels: any[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   🔄 Lote ${i + 1}/${batches.length} (${batch.length} hoteles)...`);

    try {
      const hotels = await new Promise<any[]>((resolve, reject) => {
        const request = {
          header: {
            base_header: {
              version: { major: 1, minor: 0, patch: 0 },
              external_session_id: randomUUID(),
            },
          },
          languages: [1], // EN
          supplier_codes: batch.map(code => ({ code, number: 0 }))
        };

        const metadata = new Metadata();
        metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

        client.AccommodationProductInfo(request, metadata, (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }

          if (response.error_response) {
            reject(new Error('Error en ProductInfo: ' + JSON.stringify(response.error_response.header?.errors)));
            return;
          }

          const properties = response.success_response?.properties || [];
          resolve(properties);
        });
      });

      allHotels.push(...hotels);
      console.log(`      ✅ Obtenidos ${hotels.length} hoteles de este lote`);

      // Pequeña pausa entre lotes para no saturar
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error: any) {
      console.log(`      ⚠️  Error en lote ${i + 1}: ${error.message}`);
      // Continuar con el siguiente lote
    }
  }

  console.log(`\n   ✅ Total hoteles con detalles: ${allHotels.length}\n`);

  return allHotels;
}

/**
 * Formatea la información de los hoteles
 */
function formatHotels(properties: any[]): any[] {
  return properties.map(prop => {
    const property = prop.property || prop;

    const address = property.contact_info?.addresses?.[0];

    return {
      code: property.supplier_code?.code || 'N/A',
      name: property.name || 'Sin nombre',
      chain: property.chain || '',
      stars: getCategoryRating(property.category_rating),
      categoryUnit: property.category_unit || '',
      type: property.type || '',
      status: property.status || '',
      location: {
        address: address?.address_line_1 || '',
        city: address?.city || '',
        state: address?.state || '',
        country: address?.country_code || '',
        postalCode: address?.postal_code || '',
        coordinates: property.coordinates ? {
          latitude: property.coordinates.latitude || 0,
          longitude: property.coordinates.longitude || 0
        } : null
      },
      contact: {
        phone: property.contact_info?.phone_numbers?.[0] || '',
        email: property.contact_info?.emails?.[0] || '',
        website: property.contact_info?.websites?.[0] || ''
      },
      lastModified: property.last_modified || ''
    };
  });
}

/**
 * Convierte el rating de categoría a número de estrellas
 */
function getCategoryRating(rating: any): number | null {
  const ratingMap: { [key: string]: number } = {
    'CATEGORY_RATING_1_0': 1,
    'CATEGORY_RATING_2_0': 2,
    'CATEGORY_RATING_3_0': 3,
    'CATEGORY_RATING_4_0': 4,
    'CATEGORY_RATING_5_0': 5,
    'CATEGORY_RATING_3_5': 3.5,
    'CATEGORY_RATING_4_5': 4.5,
  };

  if (!rating) return null;

  // Si es string
  if (typeof rating === 'string') {
    return ratingMap[rating] || null;
  }

  // Si es número (enum)
  const enumToRating: { [key: number]: number } = {
    2: 1,   // CATEGORY_RATING_1_0
    4: 2,   // CATEGORY_RATING_2_0
    6: 3,   // CATEGORY_RATING_3_0
    8: 4,   // CATEGORY_RATING_4_0
    10: 5,  // CATEGORY_RATING_5_0
    7: 3.5, // CATEGORY_RATING_3_5
    9: 4.5, // CATEGORY_RATING_4_5
  };

  return enumToRating[rating] || null;
}

/**
 * Convierte hoteles a formato CSV
 */
function convertToCSV(hotels: any[]): string {
  const headers = [
    'Código',
    'Nombre',
    'Cadena',
    'Estrellas',
    'Ciudad',
    'País',
    'Dirección',
    'Código Postal',
    'Latitud',
    'Longitud',
    'Teléfono',
    'Email',
    'Website'
  ];

  const rows = hotels.map(hotel => [
    hotel.code,
    hotel.name,
    hotel.chain,
    hotel.stars || '',
    hotel.location.city,
    hotel.location.country,
    hotel.location.address,
    hotel.location.postalCode,
    hotel.location.coordinates?.latitude || '',
    hotel.location.coordinates?.longitude || '',
    hotel.contact.phone,
    hotel.contact.email,
    hotel.contact.website
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Main
 */
async function main() {
  try {
    const startTime = Date.now();

    // Paso 1: Obtener códigos de hoteles
    const hotelCodes = await getHotelShortList();

    if (hotelCodes.length === 0) {
      console.log('⚠️  No se encontraron hoteles activos');
      return;
    }

    // Paso 2: Obtener detalles de hoteles
    const hotelDetails = await getHotelDetails(hotelCodes);

    // Paso 3: Formatear datos
    console.log('📊 Paso 3: Formateando datos...\n');
    const formattedHotels = formatHotels(hotelDetails);

    // Paso 4: Guardar resultados
    console.log('💾 Paso 4: Guardando resultados...\n');

    // Guardar JSON
    const jsonFile = 'hotels-list.json';
    writeFileSync(jsonFile, JSON.stringify(formattedHotels, null, 2), 'utf-8');
    console.log(`   ✅ JSON guardado: ${jsonFile}`);

    // Guardar CSV
    const csvFile = 'hotels-list.csv';
    const csvContent = convertToCSV(formattedHotels);
    writeFileSync(csvFile, csvContent, 'utf-8');
    console.log(`   ✅ CSV guardado: ${csvFile}`);

    // Estadísticas
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total de hoteles: ${formattedHotels.length}`);
    console.log(`⏱️  Tiempo total: ${elapsedTime}s`);
    console.log(`📁 Archivos generados:`);
    console.log(`   - ${jsonFile}`);
    console.log(`   - ${csvFile}`);

    // Mostrar algunos hoteles de ejemplo
    console.log('\n🏨 Primeros 5 hoteles:');
    formattedHotels.slice(0, 5).forEach((hotel, i) => {
      console.log(`\n   ${i + 1}. ${hotel.name}`);
      console.log(`      Código: ${hotel.code}`);
      console.log(`      Ubicación: ${hotel.location.city}, ${hotel.location.country}`);
      if (hotel.stars) console.log(`      Estrellas: ${hotel.stars} ⭐`);
      if (hotel.location.coordinates) {
        console.log(`      Coordenadas: ${hotel.location.coordinates.latitude}, ${hotel.location.coordinates.longitude}`);
      }
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Proceso completado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Ejecutar
main();

