import { z } from 'zod';
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import {
  ValidationService,
  ValidationRequestSchema,
  ValidationObjectSchema,
  type ValidationSuccessResponse,
} from '../../gen/cmp/services/book/v4/validate_pb.js';
import { SearchResultIdentifierSchema } from '../../gen/cmp/types/v4/search_pb.js';
import { RequestHeaderSchema, HeaderSchema } from '../../gen/cmp/types/v4/common_pb.js';
import { UUIDSchema } from '../../gen/cmp/types/v4/uuid_pb.js';
import { type Currency, IsoCurrency } from '../../gen/cmp/types/v4/currency_pb.js';
import { transport } from '../grpc/client.js';

export const name = 'validate_option';
export const description = `[PASO 2 RESERVA] Validar disponibilidad y precio actualizado ANTES de reservar.

USE WHEN: Usuario selecciona una opción de los resultados de búsqueda
REQUIERE: searchId + resultId (de search_accommodation o search_flights)
RETORNA: validationId para create_booking

⚠️ OBLIGATORIO antes de create_booking`;

export const schema = z.object({
  searchId: z.string().uuid().describe('Search ID (UUID) from previous search'),
  resultId: z.number().int().min(0).describe('Result ID (index) of the option to validate'),
});

export type Input = z.infer<typeof schema>;

/**
 * Extract currency code from Currency message
 */
function getCurrencyCode(currency?: Currency): string {
  if (!currency?.currency) return 'EUR';

  if (currency.currency.case === 'isoCurrency') {
    const isoCurrencyValue = currency.currency.value;
    if (isoCurrencyValue === IsoCurrency.EUR) return 'EUR';
    if (isoCurrencyValue === IsoCurrency.USD) return 'USD';
    if (isoCurrencyValue === IsoCurrency.GBP) return 'GBP';
  }

  return 'EUR';
}

/**
 * Format success response for display to the user
 */
function formatSuccessResponse(response: ValidationSuccessResponse) {
  const validationId = response.validationId?.id?.value || '';
  const expiresAt = response.validationId?.expiration
    ? new globalThis.Date(Number(response.validationId.expiration.seconds) * 1000).toISOString()
    : '';

  // Extract total price
  const priceValue = response.totalPrice?.value;
  const rawValue = priceValue?.value || '0';
  const decimals = priceValue?.decimals || 0;
  const currency = getCurrencyCode(priceValue?.currency);

  // Calculate actual amount: value / 10^decimals
  const amount = decimals > 0
    ? parseFloat(rawValue) / Math.pow(10, decimals)
    : parseFloat(rawValue);

  // Format breakdown if exists
  const breakdown = response.totalPrice?.breakdown?.map((detail) => ({
    description: detail.description || '',
    amount: detail.price?.value
      ? parseFloat(detail.price.value) / Math.pow(10, detail.price.decimals || 0)
      : 0,
    currency: getCurrencyCode(detail.price?.currency),
    binding: detail.binding,
    locallyPayable: detail.locallyPayable,
  })) || [];

  // Format cancel policy if exists
  let cancelPolicy = null;
  if (response.totalPrice?.cancelPolicy) {
    const cp = response.totalPrice.cancelPolicy;
    if (cp.policyType?.case === 'freeCancellationUpto') {
      cancelPolicy = {
        type: 'free_until',
        deadline: new globalThis.Date(Number(cp.policyType.value.seconds) * 1000).toISOString(),
      };
    } else if (cp.policyType?.case === 'complexCancelPenalties') {
      cancelPolicy = {
        type: 'complex',
        penalties: cp.policyType.value.cancelPenalties?.map((p) => ({
          description: p.description || '',
          value: p.value?.value
            ? parseFloat(p.value.value) / Math.pow(10, p.value.decimals || 0)
            : 0,
          currency: getCurrencyCode(p.value?.currency),
        })) || [],
      };
    }
  }

  // Format change policy if exists (simplified - just check if exists)
  let changePolicy = null;
  if (response.totalPrice?.changePolicy) {
    changePolicy = {
      type: 'has_change_policy',
    };
  }

  return {
    success: true,
    validationId,
    expiresAt,
    totalPrice: {
      amount,
      currency,
      decimals,
      raw: rawValue,
    },
    breakdown: breakdown.length > 0 ? breakdown : undefined,
    cancelPolicy,
    changePolicy,
    refundable: cancelPolicy !== null,
  };
}

export async function handler(params: Input) {
  try {
    // 1. Build request header
    const header = create(RequestHeaderSchema, {
      baseHeader: create(HeaderSchema, {
        version: { major: 0, minor: 0, patch: 0 },
        externalSessionId: ''
      })
    });

    // 2. Build ValidationObject with SearchResultIdentifier
    const validationObject = create(ValidationObjectSchema, {
      searchResultIdentifier: create(SearchResultIdentifierSchema, {
        searchId: create(UUIDSchema, { value: params.searchId }),
        resultId: params.resultId
      }),
      seatSelections: [],
      serviceFactSelections: []
    });

    // 3. Build ValidationRequest
    const request = create(ValidationRequestSchema, {
      header,
      validationObject
    });

    // 4. Call gRPC service
    const client = createClient(ValidationService, transport);
    const response = await client.validation(request);

    // 5. Handle response (oneof)
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
              message: firstError?.message || 'Validation failed'
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
              message: 'Received invalid response from validation service'
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
