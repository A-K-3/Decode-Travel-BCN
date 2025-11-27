import { z } from 'zod';
import { getRestClient, RestApiError, NetworkError, TimeoutError } from '../http/client.js';
import type { Hotel } from '../http/types.js';

export const name = 'get_accommodation_info';
export const description = `[CATÁLOGO] Obtener detalles completos de UN hotel específico por su código.

USE WHEN: Usuario quiere más info de un hotel ya identificado
REQUIERE: productCode (obtenido de get_accommodation_list)`;

export const schema = z.object({
  productCode: z.string().min(1).describe('The hotel/accommodation code to retrieve')
});

export type Input = z.infer<typeof schema>;

/**
 * Format Hotel for detailed display to the user
 */
function formatHotelInfo(hotel: Hotel) {
  return {
    property: {
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
    },
    // Extended info - REST API doesn't provide these
    images: [],
    videos: [],
    localizedDescriptions: [],
    rooms: [],
    attributes: []
  };
}

export async function handler(params: Input) {
  try {
    // 1. Call REST API
    const client = getRestClient();
    const hotel = await client.getHotelByCode(params.productCode);

    // 2. Format response
    const propertyInfo = formatHotelInfo(hotel);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          count: 1,
          properties: [propertyInfo]
        }, null, 2)
      }]
    };

  } catch (error) {
    // Handle specific error types
    if (error instanceof RestApiError) {
      // Handle 404 specifically
      if (error.statusCode === 404) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: `Hotel with code '${params.productCode}' was not found`
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
