// Script simple para probar la API
import fetch from 'node-fetch';

async function testAPI() {
  console.log('🧪 Probando API de Camino Messenger\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Health Check...');
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health OK:', JSON.stringify(healthData, null, 2));
    console.log('');

    // Test 2: Búsqueda de disponibilidad
    console.log('2️⃣  Búsqueda de disponibilidad...');
    const searchRequest = {
      startDate: '2025-12-01',
      endDate: '2025-12-05',
      adults: 2,
      currency: 'EUR'
    };

    console.log('Request:', JSON.stringify(searchRequest, null, 2));
    console.log('');

    const searchResponse = await fetch('http://localhost:3000/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest)
    });

    const searchData = await searchResponse.json();

    if (searchResponse.ok) {
      console.log('✅ Respuesta recibida!');
      console.log('Search ID:', searchData.searchId);
      console.log('Total resultados:', searchData.totalResults || 0);
      console.log('');

      if (searchData.rooms && searchData.rooms.length > 0) {
        console.log('📊 PRIMERAS 3 HABITACIONES:');
        searchData.rooms.slice(0, 3).forEach((room, i) => {
          console.log(`\n${i + 1}. Hotel: ${room.hotel.name || 'N/A'}`);
          console.log(`   Habitación: ${room.roomName}`);
          console.log(`   Precio: ${room.price.total} ${room.price.currency}`);
          if (room.hotel.location?.city) {
            console.log(`   Ubicación: ${room.hotel.location.city}, ${room.hotel.location.country}`);
          }
          if (room.hotel.stars) {
            console.log(`   Estrellas: ${room.hotel.stars} ⭐`);
          }
        });
      } else {
        console.log('ℹ️  No hay habitaciones disponibles');
        if (searchData.error) {
          console.log('Error:', searchData.error);
        }
      }
    } else {
      console.log('❌ Error en la respuesta');
      console.log('Status:', searchResponse.status);
      console.log('Data:', JSON.stringify(searchData, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();

