import { z } from 'zod';
import { getRestClient, RestApiError, NetworkError, TimeoutError } from '../http/client.js';
import type { Hotel } from '../http/types.js';

export const name = 'get_accommodation_list';
export const description = `[CATÁLOGO ESTÁTICO] Explorar lista de hoteles del proveedor. SIN disponibilidad, SIN precios, SIN fechas.

SOLO USAR CUANDO:
- Usuario pregunta "qué hoteles existen", "lista de hoteles"
- Explorar categorías, tipos, estrellas SIN contexto temporal
- NO menciona disponibilidad ni fechas

NUNCA USAR SI:
- Usuario dice "disponible", "disponibilidad"
- Usuario menciona fechas (explícitas O relativas como "semana que viene")
- Usuario pregunta por precios
- Usuario menciona "para X personas" (implica reserva)

RETORNA: Lista estática del catálogo (sin precios ni disponibilidad)`;

// Enum para tipos de propiedad
const PropertyTypeEnum = z.enum([
  'hotel', 'apartment', 'hostel', 'resort', 'villa', 'guesthouse', 'bnb'
]);

export const schema = z.object({
  location: z.string().optional()
    .describe('Location filter (city, region, or country). Example: "Mallorca", "Barcelona", "Spain"'),
  minStars: z.number().int().min(1).max(5).optional()
    .describe('Minimum star rating (1-5). Example: 4 for "4 stars or more"'),
  maxStars: z.number().int().min(1).max(5).optional()
    .describe('Maximum star rating (1-5). Example: 3 for "up to 3 stars"'),
  propertyType: PropertyTypeEnum.optional()
    .describe('Filter by property type: hotel, apartment, hostel, resort, villa, guesthouse, bnb'),
  refresh: z.boolean().default(false)
    .describe('Force refresh from source (default: false, uses cache)')
});

export type Input = z.infer<typeof schema>;

/**
 * Normalize text for comparison (lowercase, remove accents)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
    .trim();
}

// Mapping de tipos de propiedad del schema a tipos de Camino Messenger
const PROPERTY_TYPE_MAP: Record<string, string[]> = {
  'hotel': ['PROPERTY_TYPE_HOTEL', 'PROPERTY_TYPE_UNSPECIFIED'],
  'apartment': ['PROPERTY_TYPE_APARTMENT', 'PROPERTY_TYPE_APARTHOTEL'],
  'hostel': ['PROPERTY_TYPE_HOSTEL'],
  'resort': ['PROPERTY_TYPE_RESORT'],
  'villa': ['PROPERTY_TYPE_VILLA'],
  'guesthouse': ['PROPERTY_TYPE_GUESTHOUSE', 'PROPERTY_TYPE_BED_AND_BREAKFAST'],
  'bnb': ['PROPERTY_TYPE_BED_AND_BREAKFAST'],
};

/**
 * Format Hotel for display to the user
 */
function formatHotel(hotel: Hotel) {
  return {
    supplierCode: {
      code: hotel.codigo,
      number: 0
    },
    name: hotel.nombre,
    chain: hotel.cadena || null,
    type: hotel.tipo || 'PROPERTY_TYPE_HOTEL',
    status: hotel.status || 'PRODUCT_STATUS_ACTIVATED',
    categoryRating: hotel.estrellas || null,
    categoryUnit: hotel.categoryUnit || 'CATEGORY_UNIT_STARS',
    coordinates: hotel.coordenadas ? {
      latitude: hotel.coordenadas.latitud,
      longitude: hotel.coordenadas.longitud
    } : null,
    lastModified: hotel.lastModified || null,
    contactInfo: {
      country: hotel.ubicacion.pais,
      city: hotel.ubicacion.ciudad,
      region: hotel.ubicacion.region || null,
      zipCode: hotel.ubicacion.codigoPostal || null,
      line1: hotel.ubicacion.direccion || null,
      line2: hotel.ubicacion.direccion2 || null,
      district: hotel.ubicacion.distrito || null
    },
    contact: {
      phone: hotel.contacto.telefono || null,
      email: hotel.contacto.email || null,
      website: hotel.contacto.website || null
    },
    transportHubs: hotel.transportHubs?.map(hub => ({
      locationCode: hub.codigo,
      locationType: hub.tipo,
      distanceKm: hub.distanciaKm || null,
      timeMinutes: hub.tiempoMinutos || null
    })) || [],
    productCodes: []
  };
}

export async function handler(params: Input) {
  try {
    // 1. Call REST API
    const client = getRestClient();
    const response = await client.getHotels(params.refresh);

    // 2. Apply filters
    let hotels = response.hotels;

    // 2.1 Filter by location (normalized includes)
    if (params.location) {
      const searchTerm = normalizeText(params.location);
      hotels = hotels.filter(hotel =>
        normalizeText(hotel.ubicacion.ciudad).includes(searchTerm) ||
        normalizeText(hotel.ubicacion.region || '').includes(searchTerm) ||
        normalizeText(hotel.ubicacion.pais).includes(searchTerm)
      );
    }

    // 2.2 Filter by minimum stars
    if (params.minStars !== undefined) {
      hotels = hotels.filter(hotel => (hotel.estrellas || 0) >= params.minStars!);
    }

    // 2.3 Filter by maximum stars
    if (params.maxStars !== undefined) {
      hotels = hotels.filter(hotel => (hotel.estrellas || 0) <= params.maxStars!);
    }

    // 2.4 Filter by property type
    if (params.propertyType) {
      const allowedTypes = PROPERTY_TYPE_MAP[params.propertyType] || [];
      hotels = hotels.filter(hotel =>
        allowedTypes.includes(hotel.tipo || 'PROPERTY_TYPE_HOTEL')
      );
    }

    // 3. Format response
    const properties = hotels.map(formatHotel);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          count: properties.length,
          lastUpdated: response.lastUpdated,
          properties
        }, null, 2)
      }]
    };

  } catch (error) {
    // Handle specific error types
    if (error instanceof RestApiError) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: error.code,
              message: error.message
            }
          }, null, 2)
        }]
      };
    }

    if (error instanceof TimeoutError) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'TIMEOUT',
              message: 'The request timed out. Please try again later.'
            }
          }, null, 2)
        }]
      };
    }

    if (error instanceof NetworkError) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Failed to connect to the API. Please check network connectivity.'
            }
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          }
        }, null, 2)
      }]
    };
  }
}
