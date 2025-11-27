/**
 * Script simplificado para obtener nombres y ubicaciones de hoteles
 * Usa AccommodationProductList en lugar de ShortList + Info
 */

import { loadPackageDefinition, credentials, Metadata } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const BOT_URL = '3.74.156.61:9090';
const SUPPLIER_ADDRESS = process.env.CAMINO_SUPPLIER_CM_ACCOUNT || '0x1bba6d75f329022349799d78d87fe9d79fa4c36e';

console.log('🏨 Obteniendo hoteles - Versión simplificada');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

async function getHotels() {
  try {
    // Paso 1: Obtener códigos con ShortList
    console.log('📋 Paso 1: Obteniendo códigos de hoteles...\n');

    const shortListProto = join(process.cwd(), 'camino-messenger-protocol', 'proto', 'cmp', 'services', 'accommodation', 'v4', 'short_list.proto');
    const shortListPkg = loadSync(shortListProto, protoLoaderOptions);
    const shortListDesc = loadPackageDefinition(shortListPkg);
    const shortListService = (shortListDesc.cmp.services.accommodation.v4 as any);
    const shortListClient = new shortListService.AccommodationProductShortListService(BOT_URL, credentials.createInsecure());

    const codes = await new Promise<any[]>((resolve, reject) => {
      const request = {
        header: {
          base_header: {
            version: { major: 1, minor: 0, patch: 0 },
            external_session_id: randomUUID(),
          },
        },
        modified_after: null
      };

      const metadata = new Metadata();
      metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

      shortListClient.AccommodationProductShortList(request, metadata, (error: any, response: any) => {
        if (error) {
          console.error('❌ Error gRPC:', error.message);
          reject(error);
          return;
        }

        if (response.error_response) {
          console.error('❌ Error en respuesta:', JSON.stringify(response.error_response.header?.errors, null, 2));
          reject(new Error('Error en ShortList'));
          return;
        }

        const items = response.success_response?.property_short_list_items || [];
        console.log(`   ✅ Encontrados ${items.length} hoteles`);
        console.log('\n   Detalles de los items:');
        items.forEach((item: any, i: number) => {
          console.log(`   ${i + 1}. Código: ${item.supplier_code?.code}, Estado: ${item.status}`);
        });

        const allCodes = items.map((item: any) => ({
          code: item.supplier_code?.code,
          status: item.status
        })).filter((item: any) => item.code);

        resolve(allCodes);
      });
    });

    if (codes.length === 0) {
      console.log('\n⚠️  No hay hoteles para procesar');
      return;
    }

    // Paso 2: Obtener detalles con ProductList
    console.log('\n📝 Paso 2: Obteniendo detalles de hoteles...\n');

    const listProto = join(process.cwd(), 'camino-messenger-protocol', 'proto', 'cmp', 'services', 'accommodation', 'v4', 'list.proto');
    const listPkg = loadSync(listProto, protoLoaderOptions);
    const listDesc = loadPackageDefinition(listPkg);
    const listService = (listDesc.cmp.services.accommodation.v4 as any);
    const listClient = new listService.AccommodationProductListService(BOT_URL, credentials.createInsecure());

    const hotels = await new Promise<any[]>((resolve, reject) => {
      const request = {
        header: {
          base_header: {
            version: { major: 1, minor: 0, patch: 0 },
            external_session_id: randomUUID(),
          },
        },
        supplier_codes: codes.map(c => ({ code: c.code, number: 0 }))
      };

      const metadata = new Metadata();
      metadata.add('recipient_cm_account', SUPPLIER_ADDRESS);

      console.log(`   📤 Solicitando detalles de ${codes.length} hoteles...`);

      listClient.AccommodationProductList(request, metadata, (error: any, response: any) => {
        if (error) {
          console.error('❌ Error gRPC:', error.message);
          console.error('   Detalles:', error);
          reject(error);
          return;
        }

        if (response.error_response) {
          console.error('❌ Error en respuesta:', JSON.stringify(response.error_response.header?.errors, null, 2));
          reject(new Error('Error en ProductList'));
          return;
        }

        const properties = response.success_response?.properties || [];
        console.log(`   ✅ Recibidos ${properties.length} hoteles con detalles\n`);

        resolve(properties);
      });
    });

    // Paso 3: Formatear y mostrar
    console.log('📊 HOTELES ENCONTRADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Helper para convertir rating a estrellas
    function getStars(rating: string): number | null {
      const map: { [key: string]: number } = {
        'CATEGORY_RATING_1_0': 1,
        'CATEGORY_RATING_2_0': 2,
        'CATEGORY_RATING_3_0': 3,
        'CATEGORY_RATING_3_5': 3.5,
        'CATEGORY_RATING_4_0': 4,
        'CATEGORY_RATING_4_5': 4.5,
        'CATEGORY_RATING_5_0': 5,
      };
      return map[rating] || null;
    }

    const formattedHotels = hotels.map((property: any) => {
      const address = property.contact_info?.addresses?.[0] || {};
      const geoTree = address.geo_tree || {};
      const coords = property.coordinates || {};
      const contact = property.contact_info || {};

      // Extraer email
      let email = '';
      if (contact.emails && contact.emails[0]) {
        const emailObj = contact.emails[0];
        email = typeof emailObj === 'string' ? emailObj : (emailObj.address || '');
      }

      // Extraer teléfono
      let telefono = '';
      if (contact.phones && contact.phones[0]) {
        const phoneObj = contact.phones[0];
        telefono = typeof phoneObj === 'string' ? phoneObj : (phoneObj.number || '');
      }

      // Extraer website
      let website = '';
      if (contact.links && contact.links[0]) {
        website = contact.links[0].ref || '';
      }

      // Convertir código de país (COUNTRY_ES -> ES)
      let paisCode = geoTree.country || '';
      if (paisCode.startsWith('COUNTRY_')) {
        paisCode = paisCode.replace('COUNTRY_', '');
      }

      return {
        codigo: property.supplier_code?.code || 'N/A',
        nombre: property.name || 'Sin nombre',
        cadena: property.chain || '',
        ciudad: geoTree.city_or_resort || '',
        region: geoTree.region || '',
        pais: paisCode,
        direccion: address.line_1 || '',
        direccion_2: address.line_2 || '',
        distrito: address.district || '',
        codigo_postal: address.zip_code || '',
        latitud: coords.latitude || null,
        longitud: coords.longitude || null,
        telefono: telefono,
        email: email,
        website: website,
        estrellas: getStars(property.category_rating)
      };
    });

    formattedHotels.forEach((hotel, i) => {
      console.log(`${i + 1}. ${hotel.nombre}`);
      console.log(`   Código: ${hotel.codigo}`);
      if (hotel.cadena) console.log(`   Cadena: ${hotel.cadena}`);
      if (hotel.estrellas) console.log(`   ⭐ ${hotel.estrellas} estrellas`);

      // Ubicación
      const ubicacionParts = [];
      if (hotel.ciudad) ubicacionParts.push(hotel.ciudad);
      if (hotel.region && hotel.region !== hotel.ciudad) ubicacionParts.push(hotel.region);
      if (hotel.pais) ubicacionParts.push(hotel.pais);
      if (ubicacionParts.length > 0) {
        console.log(`   📍 Ubicación: ${ubicacionParts.join(', ')}`);
      }

      if (hotel.direccion) console.log(`   📫 Dirección: ${hotel.direccion}`);
      if (hotel.distrito) console.log(`   🏘️  Distrito: ${hotel.distrito}`);
      if (hotel.codigo_postal) console.log(`   📮 C.P.: ${hotel.codigo_postal}`);

      if (hotel.latitud && hotel.longitud) {
        console.log(`   🗺️  Coordenadas: ${hotel.latitud}, ${hotel.longitud}`);
      }

      if (hotel.telefono) console.log(`   📞 Teléfono: ${hotel.telefono}`);
      if (hotel.email) console.log(`   📧 Email: ${hotel.email}`);
      if (hotel.website) console.log(`   🌐 Web: ${hotel.website}`);
      console.log('');
    });

    // Guardar archivos
    console.log('💾 Guardando archivos...\n');

    writeFileSync('hotels-simple.json', JSON.stringify(formattedHotels, null, 2), 'utf-8');
    console.log('   ✅ JSON: hotels-simple.json');

    // CSV
    const csvHeaders = 'Código,Nombre,Cadena,Estrellas,Ciudad,Región,País,Dirección,Distrito,Código Postal,Latitud,Longitud,Teléfono,Email,Website\n';
    const csvRows = formattedHotels.map(h =>
      `"${h.codigo}","${h.nombre}","${h.cadena}","${h.estrellas || ''}","${h.ciudad}","${h.region}","${h.pais}","${h.direccion}","${h.distrito}","${h.codigo_postal}","${h.latitud || ''}","${h.longitud || ''}","${h.telefono}","${h.email}","${h.website}"`
    ).join('\n');
    writeFileSync('hotels-simple.csv', csvHeaders + csvRows, 'utf-8');
    console.log('   ✅ CSV: hotels-simple.csv');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Proceso completado: ${formattedHotels.length} hoteles`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

getHotels();
