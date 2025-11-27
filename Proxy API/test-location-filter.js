/**
 * Script de prueba para el filtrado de ubicación en la API
 */

const testLocationFilter = async () => {
  const url = 'http://localhost:3000/api/availability';

  const testCases = [
    {
      name: 'Barcelona (BCN)',
      data: {
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        adults: 2,
        location: {
          code: 'BCN',
          type: 'IATA'
        }
      }
    },
    {
      name: 'Sin filtro de ubicación',
      data: {
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        adults: 2
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🧪 Prueba: ${testCase.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`📤 Request:`, JSON.stringify(testCase.data, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();

      console.log(`\n📊 Resultados:`);
      console.log(`   Total hoteles: ${result.totalResults || 0}`);

      if (result.rooms && result.rooms.length > 0) {
        console.log(`\n🏨 Hoteles encontrados:`);
        result.rooms.forEach((room, index) => {
          console.log(`   ${index + 1}. ${room.hotel.name} - ${room.hotel.location.city}, ${room.hotel.location.country}`);
        });
      } else {
        console.log(`   ℹ️  No se encontraron hoteles`);
      }

      if (result.filters?.location) {
        console.log(`\n✅ Filtro aplicado: ${result.filters.location.code} (${result.filters.location.type})`);
      }

    } catch (error) {
      console.error(`\n❌ Error:`, error.message);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Pruebas completadas\n`);
};

testLocationFilter();

