import { z } from 'zod';
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';

// Transport service
import {
  TransportSearchService,
  TransportSearchRequestSchema,
  type TransportSearchSuccessResponse,
} from '../../gen/cmp/services/transport/v4/search_pb.js';
import {
  TransportSearchQuerySchema,
  QueryTripSchema,
  QueryTransitEventSchema,
  QueryTransitEventLocationSchema,
  type QueryTransitEvent,
} from '../../gen/cmp/services/transport/v4/search_query_types_pb.js';
import type { TripExtended } from '../../gen/cmp/services/transport/v4/trip_types_pb.js';

// Common types
import { RequestHeaderSchema, HeaderSchema } from '../../gen/cmp/types/v4/common_pb.js';
import { SearchParametersSchema } from '../../gen/cmp/types/v4/search_pb.js';
import { BasicTravellerSchema, TravellerType } from '../../gen/cmp/types/v4/traveller_pb.js';
import { CurrencySchema, IsoCurrency } from '../../gen/cmp/types/v4/currency_pb.js';
import { LocationCodesSchema, LocationCodeSchema, LocationCodeType } from '../../gen/cmp/types/v4/location_pb.js';
import { BookabilityType } from '../../gen/cmp/types/v4/bookability_pb.js';

// Utilities
import { transport } from '../grpc/client.js';
import { parseDate, birthdateFromAge, isValidDateFormat, isValidDateRange } from '../utils/dateUtils.js';
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  DEFAULT_MARKET,
  DEFAULT_NATIONALITY,
  getTravellerTypeLabel,
} from '../utils/typeMappers.js';

export const name = 'search_flights';
export const description = `[BOOKING] Buscar vuelos CON disponibilidad y precios en tiempo real.

USE WHEN: Usuario proporciona fecha de vuelo
DO NOT USE: Sin fechas → usar get_flight_list

REQUIERE: origin (IATA), destination (IATA), departureDate (YYYY-MM-DD)
RETORNA: searchId para validate_option`;

export const schema = z.object({
  // Locations (IATA codes)
  origin: z.string()
    .length(3)
    .transform(s => s.toUpperCase())
    .describe('Origin airport IATA code (e.g., BCN)'),
  destination: z.string()
    .length(3)
    .transform(s => s.toUpperCase())
    .describe('Destination airport IATA code (e.g., MAD)'),

  // Dates
  departureDate: z.string()
    .describe('Departure date (YYYY-MM-DD)'),
  returnDate: z.string()
    .optional()
    .describe('Return date for round trip (YYYY-MM-DD)'),

  // Travellers
  adults: z.number()
    .int()
    .min(1)
    .max(9)
    .default(1)
    .describe('Number of adult passengers (12+ years)'),
  children: z.number()
    .int()
    .min(0)
    .max(8)
    .default(0)
    .describe('Number of children (2-11 years)'),
  childrenAges: z.array(z.number().int().min(2).max(11))
    .optional()
    .describe('Ages of children (2-11). Required if children > 0'),
  infants: z.number()
    .int()
    .min(0)
    .max(4)
    .default(0)
    .describe('Number of infants (under 2 years)'),
  infantAges: z.array(z.number().int().min(0).max(1))
    .optional()
    .describe('Ages of infants (0-1). Required if infants > 0'),
});

export type Input = z.infer<typeof schema>;

/**
 * Helper to create error response
 */
function errorResponse(code: string, message: string) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: false,
        error: { code, message }
      }, null, 2)
    }]
  };
}

/**
 * Helper to create QueryTransitEvent for airport/date
 */
function createTransitEvent(airportCode: string, dateStr: string): QueryTransitEvent {
  return create(QueryTransitEventSchema, {
    date: parseDate(dateStr),
    location: create(QueryTransitEventLocationSchema, {
      location: {
        case: 'locationCodes',
        value: create(LocationCodesSchema, {
          codes: [create(LocationCodeSchema, {
            code: airportCode,
            type: LocationCodeType.LOCATION_CODE_TYPE_IATA_CODE
          })]
        })
      }
    })
  });
}

/**
 * Format a TripExtended for display
 */
function formatTrip(trip: TripExtended) {
  const segments = trip.segments.map(seg => ({
    id: seg.id,
    serviceTypeCode: seg.serviceTypeCode,
    serviceTypeDescription: seg.serviceTypeDescription,
    minPax: seg.minPax,
    maxPax: seg.maxPax,
  }));

  return {
    supplierCode: trip.supplierCode?.code || '',
    segments,
    stops: segments.length - 1,
  };
}

/**
 * Format success response for display to the user
 */
function formatSuccessResponse(response: TransportSearchSuccessResponse) {
  const searchId = response.searchId?.id?.value || '';
  const expiresAt = response.searchId?.expiration
    ? new globalThis.Date(Number(response.searchId.expiration.seconds) * 1000).toISOString()
    : '';

  const results = response.results.map((result) => {
    const travellingTrips = result.travellingTrips;
    const isRoundtrip = travellingTrips.length >= 2;

    // Format outbound (first trip)
    const outbound = travellingTrips[0] ? formatTrip(travellingTrips[0]) : null;

    // Format inbound (second trip if exists)
    const inbound = isRoundtrip && travellingTrips[1] ? formatTrip(travellingTrips[1]) : undefined;

    // Extract price
    const totalPrice = result.totalPrice?.value;
    const priceAmount = totalPrice?.value ? parseFloat(totalPrice.value) : 0;
    let currency = 'EUR';
    if (totalPrice?.currency?.currency?.case === 'isoCurrency') {
      const isoCurrencyValue = totalPrice.currency.currency.value;
      if (isoCurrencyValue === IsoCurrency.EUR) currency = 'EUR';
      else if (isoCurrencyValue === IsoCurrency.USD) currency = 'USD';
      else if (isoCurrencyValue === IsoCurrency.GBP) currency = 'GBP';
    }

    // Bookability
    const bookability = result.bookability?.type === BookabilityType.ON_REQUEST
      ? 'on_request'
      : 'immediate';

    return {
      resultId: result.resultId,
      offerId: result.offerId,
      tripType: isRoundtrip ? 'roundtrip' : 'one-way',
      outbound,
      ...(inbound && { inbound }),
      totalPrice: { amount: priceAmount, currency },
      bookability,
      travellerIds: Array.from(result.travellerIds),
    };
  });

  // Map travellers
  const travellers = response.travellers.map((t) => ({
    id: t.travellerId,
    type: getTravellerTypeLabel(t.type),
  }));

  return {
    success: true,
    searchId,
    expiresAt,
    resultsCount: results.length,
    results,
    travellers,
  };
}

export async function handler(params: Input) {
  try {
    // 1. Validations
    if (!isValidDateFormat(params.departureDate)) {
      return errorResponse('INVALID_DATE_FORMAT', 'Departure date must be in YYYY-MM-DD format');
    }

    if (params.returnDate && !isValidDateFormat(params.returnDate)) {
      return errorResponse('INVALID_DATE_FORMAT', 'Return date must be in YYYY-MM-DD format');
    }

    if (params.returnDate && !isValidDateRange(params.departureDate, params.returnDate)) {
      return errorResponse('INVALID_DATE_RANGE', 'Return date must be after departure date');
    }

    if (params.infants > params.adults) {
      return errorResponse('INVALID_PASSENGERS', 'Number of infants cannot exceed number of adults');
    }

    const totalPassengers = params.adults + params.children + params.infants;
    if (totalPassengers > 9) {
      return errorResponse('TOO_MANY_PASSENGERS', 'Maximum 9 passengers allowed per booking');
    }

    if (params.children > 0) {
      if (!params.childrenAges || params.childrenAges.length !== params.children) {
        return errorResponse('INVALID_CHILDREN_AGES',
          `childrenAges array must have exactly ${params.children} elements`);
      }
    }

    if (params.infants > 0) {
      if (!params.infantAges || params.infantAges.length !== params.infants) {
        return errorResponse('INVALID_INFANT_AGES',
          `infantAges array must have exactly ${params.infants} elements`);
      }
    }

    // 2. Build request header
    const header = create(RequestHeaderSchema, {
      baseHeader: create(HeaderSchema, {
        version: { major: 0, minor: 0, patch: 0 },
        externalSessionId: ''
      })
    });

    // 3. Build search parameters
    const searchParameters = create(SearchParametersSchema, {
      currency: create(CurrencySchema, {
        currency: {
          case: 'isoCurrency',
          value: DEFAULT_CURRENCY
        }
      }),
      language: DEFAULT_LANGUAGE,
      market: DEFAULT_MARKET,
      includeOnRequest: false,
      includeCombinations: false,
      maxResults: 50
    });

    // 4. Build travellers
    const travellers = [];
    let travellerId = 0;

    // Adults - birthdate optional
    for (let i = 0; i < params.adults; i++) {
      travellers.push(create(BasicTravellerSchema, {
        travellerId: travellerId++,
        type: TravellerType.ADULT,
        nationality: DEFAULT_NATIONALITY
      }));
    }

    // Children - birthdate REQUIRED (use provided age)
    for (let i = 0; i < params.children; i++) {
      const age = params.childrenAges?.[i] ?? 5;
      travellers.push(create(BasicTravellerSchema, {
        travellerId: travellerId++,
        type: TravellerType.CHILD,
        birthdate: birthdateFromAge(age),
        nationality: DEFAULT_NATIONALITY
      }));
    }

    // Infants - birthdate REQUIRED (use provided age)
    for (let i = 0; i < params.infants; i++) {
      const age = params.infantAges?.[i] ?? 1;
      travellers.push(create(BasicTravellerSchema, {
        travellerId: travellerId++,
        type: TravellerType.INFANT,
        birthdate: birthdateFromAge(age),
        nationality: DEFAULT_NATIONALITY
      }));
    }

    // 5. Build trips
    const trips = [
      // Outbound trip
      create(QueryTripSchema, {
        departure: createTransitEvent(params.origin, params.departureDate),
        arrival: createTransitEvent(params.destination, params.departureDate)
      })
    ];

    // Return trip (if roundtrip)
    if (params.returnDate) {
      trips.push(create(QueryTripSchema, {
        departure: createTransitEvent(params.destination, params.returnDate),
        arrival: createTransitEvent(params.origin, params.returnDate)
      }));
    }

    // 6. Build query and request
    const query = create(TransportSearchQuerySchema, {
      queryId: 1,
      travellers,
      trips
    });

    const request = create(TransportSearchRequestSchema, {
      header,
      searchParameters,
      queries: [query]
    });

    // 7. Call gRPC service
    const client = createClient(TransportSearchService, transport);
    const response = await client.transportSearch(request);

    // 8. Handle response
    if (response.response.case === 'successResponse') {
      const formattedResponse = formatSuccessResponse(response.response.value);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(formattedResponse, null, 2)
        }]
      };
    } else if (response.response.case === 'errorResponse') {
      const errorHeader = response.response.value.header;
      const firstError = errorHeader?.errors?.[0];
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: firstError?.code ?? 'UNKNOWN_ERROR',
              message: firstError?.message || 'Unknown error occurred'
            }
          }, null, 2)
        }]
      };
    } else {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_RESPONSE',
              message: 'Received invalid response from service'
            }
          }, null, 2)
        }]
      };
    }
  } catch (error) {
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
