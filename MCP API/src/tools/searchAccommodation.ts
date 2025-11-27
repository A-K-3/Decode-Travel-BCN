import { z } from 'zod';
import { getRestClient, RestApiError, NetworkError, TimeoutError } from '../http/client.js';
import type { AvailabilityRequest, Room, ComplexCancellationPolicy } from '../http/types.js';
import { isValidDateFormat, isValidDateRange, calculateNights } from '../utils/dateUtils.js';
import { resolveCityCode, getCountryForCity } from '../http/locationCodes.js';

export const name = 'search_accommodation';
export const description = `[BÚSQUEDA TIEMPO REAL] Buscar alojamientos con DISPONIBILIDAD y precios actuales.

PALABRAS CLAVE QUE ACTIVAN ESTA HERRAMIENTA:
- "disponible", "disponibilidad", "hay disponible"
- "precio", "cuánto cuesta", "tarifas"
- Fechas explícitas: "del 15 al 20", "enero", "diciembre"
- Fechas relativas: "semana que viene", "próxima semana", "mañana", "este fin de semana"
- "para X personas/adultos/huéspedes"
- "puedo reservar", "quiero reservar"

REQUIERE: checkIn, checkOut (YYYY-MM-DD) - convertir fechas relativas a absolutas
RETORNA: searchId + opciones con precios reales

⚠️ SIEMPRE usar si el usuario menciona disponibilidad o cualquier referencia temporal`;

export const schema = z.object({
  destination: z.string().describe('Destination city name or city code (e.g., "Madrid", "MAD", "Barcelona", "BCN")'),
  checkIn: z.string().describe('Check-in date (YYYY-MM-DD)'),
  checkOut: z.string().describe('Check-out date (YYYY-MM-DD)'),
  guests: z.number().default(2).describe('Number of guests'),
  rooms: z.number().default(1).describe('Number of rooms'),
  currency: z.string().default('EUR').describe('Currency code (EUR, USD, GBP)'),
});

export type Input = z.infer<typeof schema>;

/**
 * Format room result for display to the user
 */
function formatRoomResult(room: Room, nights: number) {
  const totalPrice = parseFloat(room.price.total);
  const pricePerNight = nights > 0 ? Math.round((totalPrice / nights) * 100) / 100 : totalPrice;

  // Format hotel info
  const hotel = room.hotel ? {
    code: room.hotel.code,
    name: room.hotel.name,
    stars: room.hotel.stars || null,
    chain: room.hotel.chain || null,
    location: room.hotel.location ? {
      city: room.hotel.location.city,
      region: room.hotel.location.region || null,
      country: room.hotel.location.country,
      address: room.hotel.location.address || null,
      postalCode: room.hotel.location.postalCode || null,
      coordinates: room.hotel.location.coordinates || null,
    } : null,
    contact: room.hotel.contact ? {
      phone: room.hotel.contact.phone || null,
      email: room.hotel.contact.email || null,
      website: room.hotel.contact.website || null,
    } : null,
  } : null;

  // Format cancellation policy
  let refundable = true;
  let cancellationDeadline: string | null = null;
  let cancellationPenalties: Array<{ from: string; to: string; amount: number; currency: string }> = [];

  if (room.cancellationPolicy) {
    if ('refundable' in room.cancellationPolicy) {
      refundable = room.cancellationPolicy.refundable;
      cancellationDeadline = room.cancellationPolicy.deadline || null;
    } else if ('complex_cancel_penalties' in room.cancellationPolicy) {
      const complexPolicy = room.cancellationPolicy as ComplexCancellationPolicy;
      const penalties = complexPolicy.complex_cancel_penalties?.cancel_penalties || [];
      cancellationPenalties = penalties.map(p => ({
        from: p.datetime_range?.start ? new Date(Number(p.datetime_range.start.seconds) * 1000).toISOString() : '',
        to: p.datetime_range?.end ? new Date(Number(p.datetime_range.end.seconds) * 1000).toISOString() : '',
        amount: p.value?.value ? parseFloat(p.value.value) : 0,
        currency: p.value?.currency?.iso_currency?.replace('ISO_CURRENCY_', '') || 'EUR',
      }));
      refundable = cancellationPenalties.length > 0;
    }
  }

  return {
    resultId: room.roomCode,
    hotelCode: room.hotel?.code || room.hotelCode || null,
    hotel,
    roomCode: room.roomCode,
    roomName: room.roomName,
    originalRoomName: room.originalRoomName || null,
    totalPrice: {
      amount: totalPrice,
      currency: room.price.currency,
    },
    nights,
    pricePerNight,
    refundable,
    cancellationDeadline,
    cancellationPenalties: cancellationPenalties.length > 0 ? cancellationPenalties : undefined,
    bookability: 'immediate',
    mealPlan: room.mealPlan?.code || null,
    mealPlanDescription: room.mealPlan?.description || null,
    beds: room.beds || [],
    remainingUnits: room.remainingUnits || null,
    services: room.services || [],
  };
}

export async function handler(params: Input) {
  try {
    // 1. Validate input
    if (!isValidDateFormat(params.checkIn)) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_DATE_FORMAT',
              message: 'Check-in date must be in YYYY-MM-DD format'
            }
          }, null, 2)
        }]
      };
    }

    if (!isValidDateFormat(params.checkOut)) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_DATE_FORMAT',
              message: 'Check-out date must be in YYYY-MM-DD format'
            }
          }, null, 2)
        }]
      };
    }

    if (!isValidDateRange(params.checkIn, params.checkOut)) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_DATE_RANGE',
              message: 'Check-out date must be after check-in date'
            }
          }, null, 2)
        }]
      };
    }

    if (params.guests < 1 || params.guests > 20) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_GUESTS',
              message: 'Number of guests must be between 1 and 20'
            }
          }, null, 2)
        }]
      };
    }

    // 2. Resolve city code from destination
    const cityCode = resolveCityCode(params.destination);

    if (!cityCode) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_DESTINATION',
              message: `Unknown destination: "${params.destination}". Please use a valid city name (e.g., Madrid, Barcelona, Paris) or city code (e.g., MAD, BCN, PAR).`
            }
          }, null, 2)
        }]
      };
    }

    const countryCode = getCountryForCity(cityCode);

    // 3. Build REST API request
    const request: AvailabilityRequest = {
      startDate: params.checkIn,
      endDate: params.checkOut,
      adults: params.guests,
      currency: params.currency,
      cityCode: cityCode,
      countryCode: countryCode,
    };

    // 4. Call REST API
    const client = getRestClient();
    const response = await client.searchAvailability(request);

    // 5. Calculate nights for pricing
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // 5. Format response
    const results = response.rooms.map(room => formatRoomResult(room, nights));

    // Generate travellers based on guests count
    const travellers = Array.from({ length: params.guests }, (_, i) => ({
      id: i,
      type: 'adult',
    }));

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          searchId: response.searchId,
          expiresAt: null, // REST API doesn't provide expiration
          resultsCount: results.length,
          results,
          travellers,
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
              message: error.message,
              details: error.details
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
              message: 'The search request timed out. Try reducing the date range or try again later.'
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
