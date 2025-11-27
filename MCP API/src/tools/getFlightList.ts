import { z } from 'zod';
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import {
  TransportProductListService,
  TransportProductListRequestSchema,
} from '../../gen/cmp/services/transport/v4/list_pb.js';
import {
  type TripBasic,
  type Segment,
  type TransitEvent,
  TransportType,
} from '../../gen/cmp/services/transport/v4/trip_types_pb.js';
import { RequestHeaderSchema, HeaderSchema } from '../../gen/cmp/types/v4/common_pb.js';
import { LocationCodeType } from '../../gen/cmp/types/v4/location_pb.js';
import { transport } from '../grpc/client.js';

export const name = 'get_flight_list';
export const description = `[CATÁLOGO] Explorar rutas de transporte del proveedor. Sin precios ni disponibilidad en tiempo real.

USE WHEN: Explorar catálogo de rutas sin fechas específicas
DO NOT USE: Para reservar vuelos → usar search_flights`;

export const schema = z.object({
  modifiedAfter: z.string()
    .optional()
    .describe('ISO 8601 timestamp to filter products modified after this date (e.g., 2024-01-15T10:30:00Z)')
});

export type Input = z.infer<typeof schema>;

/**
 * Map TransportType enum to human-readable label
 */
function getTransportTypeLabel(type: TransportType): string {
  switch (type) {
    case TransportType.FLIGHT:
      return 'FLIGHT';
    case TransportType.TRAIN:
      return 'TRAIN';
    case TransportType.TRANSFER:
      return 'TRANSFER';
    case TransportType.BUS:
      return 'BUS';
    default:
      return 'UNSPECIFIED';
  }
}

/**
 * Map LocationCodeType enum to human-readable label
 */
function getLocationCodeTypeLabel(type: LocationCodeType): string {
  switch (type) {
    case LocationCodeType.LOCATION_CODE_TYPE_IATA_CODE:
      return 'IATA';
    case LocationCodeType.LOCATION_CODE_TYPE_ICAO_CODE:
      return 'ICAO';
    case LocationCodeType.LOCATION_CODE_TYPE_PROVIDER_CODE:
      return 'PROVIDER';
    case LocationCodeType.LOCATION_CODE_TYPE_3ALPHA_CODE:
      return '3ALPHA';
    case LocationCodeType.LOCATION_CODE_TYPE_NLC_CODE:
      return 'NLC';
    case LocationCodeType.LOCATION_CODE_TYPE_TIPLOC_CODE:
      return 'TIPLOC';
    case LocationCodeType.LOCATION_CODE_TYPE_STANOX_CODE:
      return 'STANOX';
    case LocationCodeType.LOCATION_CODE_TYPE_ATCO_CODE:
      return 'ATCO';
    case LocationCodeType.LOCATION_CODE_TYPE_GOOGLE_PLACE_ID:
      return 'GOOGLE_PLACE_ID';
    case LocationCodeType.LOCATION_CODE_TYPE_FOURSQUARE_FSQ_ID:
      return 'FOURSQUARE_FSQ_ID';
    case LocationCodeType.LOCATION_CODE_TYPE_OPENSTREETMAPS_REF:
      return 'OPENSTREETMAPS_REF';
    case LocationCodeType.LOCATION_CODE_TYPE_HERE_ID:
      return 'HERE_ID';
    default:
      return 'UNSPECIFIED';
  }
}

/**
 * Format TransitEvent (departure/arrival) for display
 */
function formatTransitEvent(event?: TransitEvent) {
  if (!event) return null;

  const dateTime = event.dateTime
    ? new globalThis.Date(Number(event.dateTime.seconds) * 1000).toISOString()
    : null;

  let location = null;
  if (event.location?.location.case === 'locationCode') {
    const locCode = event.location.location.value;
    location = {
      type: 'code' as const,
      code: locCode.code,
      codeType: getLocationCodeTypeLabel(locCode.type)
    };
  } else if (event.location?.location.case === 'locationCoordinates') {
    const coords = event.location.location.value;
    location = {
      type: 'coordinates' as const,
      latitude: coords.latitude,
      longitude: coords.longitude
    };
  }

  return { dateTime, location };
}

/**
 * Format Segment for display
 */
function formatSegment(segment: Segment) {
  // Handle product identifier (oneof)
  let productIdentifier = null;
  if (segment.productIdentifier.case === 'productCode') {
    const pc = segment.productIdentifier.value;
    productIdentifier = {
      type: 'productCode',
      code: pc.code,
      number: pc.number
    };
  } else if (segment.productIdentifier.case === 'supplierCode') {
    const sc = segment.productIdentifier.value;
    productIdentifier = {
      type: 'supplierCode',
      code: sc.code,
      number: sc.number
    };
  }

  // Format duration
  let duration = null;
  if (segment.duration) {
    const totalMinutes = segment.duration.minutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    duration = {
      totalMinutes,
      iso8601: `PT${hours}H${mins}M`
    };
  }

  // Format distance
  let distance = null;
  if (segment.distance) {
    distance = {
      value: segment.distance.value,
      unit: segment.distance.unit
    };
  }

  return {
    id: segment.id,
    operatorCode: segment.operatorCode,
    retailerCode: segment.retailerCode,
    subSupplierCode: segment.subSupplierCode,
    productIdentifier,
    departure: formatTransitEvent(segment.departure),
    arrival: formatTransitEvent(segment.arrival),
    duration,
    distance,
    transportType: getTransportTypeLabel(segment.transportType),
    seatMapCount: segment.seatMapIds.length
  };
}

/**
 * Format TripBasic for display
 */
function formatTrip(trip: TripBasic) {
  return {
    supplierCode: {
      code: trip.supplierCode?.code || '',
      number: trip.supplierCode?.number || 0
    },
    segmentCount: trip.segments.length,
    segments: trip.segments.map(formatSegment),
    lastModified: trip.lastModified
      ? new globalThis.Date(Number(trip.lastModified.seconds) * 1000).toISOString()
      : null
  };
}

export async function handler(params: Input) {
  try {
    // 1. Validate modifiedAfter if provided
    let modifiedAfterTimestamp = undefined;
    if (params.modifiedAfter) {
      const date = new globalThis.Date(params.modifiedAfter);
      if (isNaN(date.getTime())) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: {
                code: 'INVALID_DATE_FORMAT',
                message: 'modifiedAfter must be a valid ISO 8601 date string'
              }
            }, null, 2)
          }]
        };
      }
      modifiedAfterTimestamp = timestampFromDate(date);
    }

    // 2. Build request header
    const header = create(RequestHeaderSchema, {
      baseHeader: create(HeaderSchema, {
        version: { major: 0, minor: 0, patch: 0 },
        externalSessionId: ''
      })
    });

    // 3. Create request
    const request = create(TransportProductListRequestSchema, {
      header,
      ...(modifiedAfterTimestamp && { modifiedAfter: modifiedAfterTimestamp })
    });

    // 4. Call gRPC service
    const client = createClient(TransportProductListService, transport);
    const response = await client.transportProductList(request);

    // 5. Handle response
    if (response.response.case === 'successResponse') {
      const trips = response.response.value.trips;
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            count: trips.length,
            trips: trips.map(formatTrip)
          }, null, 2)
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
