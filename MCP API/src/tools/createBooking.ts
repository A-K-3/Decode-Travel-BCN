import { z } from 'zod';
import { create } from '@bufbuild/protobuf';
import { createClient } from '@connectrpc/connect';
import {
  MintService,
  MintRequestSchema,
  type MintSuccessResponse,
} from '../../gen/cmp/services/book/v4/mint_pb.js';
import { RequestHeaderSchema, HeaderSchema } from '../../gen/cmp/types/v4/common_pb.js';
import { UUIDSchema } from '../../gen/cmp/types/v4/uuid_pb.js';
import { EVMAddressSchema } from '../../gen/cmp/types/v4/evm_address_pb.js';
import { PriceSchema } from '../../gen/cmp/types/v4/price_pb.js';
import { CurrencySchema, IsoCurrency } from '../../gen/cmp/types/v4/currency_pb.js';
import {
  ExtensiveTravellerSchema,
  GenderType,
} from '../../gen/cmp/types/v4/traveller_pb.js';
import { ContactInfoSchema } from '../../gen/cmp/types/v4/contact_info_pb.js';
import { EmailSchema, EmailType } from '../../gen/cmp/types/v4/email_pb.js';
import { PhoneSchema, PhoneType } from '../../gen/cmp/types/v4/phone_pb.js';
import { DocumentSchema, DocumentType } from '../../gen/cmp/types/v4/document_pb.js';
import { DateSchema } from '../../gen/cmp/types/v4/date_pb.js';
import { transport } from '../grpc/client.js';
import { env } from '../config/env.js';

export const name = 'create_booking';
export const description = `[PASO 3 RESERVA - FINAL] Crear reserva y procesar pago en blockchain. IRREVERSIBLE.

USE WHEN: Usuario confirmó precio y proporcionó datos de viajeros
REQUIERE: validationId (de validate_option), travellers, expectedPrice

⚠️ Siempre pedir confirmación explícita del usuario antes de ejecutar`;

const travellerSchema = z.object({
  firstName: z.string().min(1).max(100).describe('First name'),
  lastName: z.string().min(1).max(100).describe('Last name'),
  gender: z.enum(['male', 'female', 'nonbinary', 'agender', 'unspecified']).default('unspecified').describe('Gender'),
  email: z.string().email().optional().describe('Email address (optional)'),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional().describe('Phone in E.164 format (optional)'),
  passportNumber: z.string().min(1).max(512).optional().describe('Passport number (optional)'),
  passportExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Passport expiry YYYY-MM-DD (optional)'),
});

export const schema = z.object({
  validationId: z.string().uuid().describe('Validation ID from validate_option'),
  travellers: z.array(travellerSchema).min(1).max(100).describe('List of travellers'),
  expectedPrice: z.number().positive().describe('Expected total price in EUR'),
  bookingReference: z.string().max(512).optional().describe('Your booking reference (optional)'),
  comment: z.string().max(512).optional().describe('Comments for the supplier (optional)'),
});

export type Input = z.infer<typeof schema>;
type TravellerInput = z.infer<typeof travellerSchema>;

/**
 * Map gender string to GenderType enum
 */
function mapGenderType(gender: string): GenderType {
  const map: Record<string, GenderType> = {
    'male': GenderType.MALE,
    'female': GenderType.FEMALE,
    'nonbinary': GenderType.NONBINARY,
    'agender': GenderType.AGENDER,
    'unspecified': GenderType.UNSPECIFIED,
  };
  return map[gender] ?? GenderType.UNSPECIFIED;
}

/**
 * Parse date string (YYYY-MM-DD) to Date message
 */
function parseDocumentDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return create(DateSchema, { year, month, day });
}

/**
 * Build ExtensiveTraveller from input
 */
function buildTraveller(t: TravellerInput, index: number) {
  // Build contact info if email or phone provided
  let contactInfo = undefined;
  if (t.email || t.phone) {
    const emails = t.email ? [create(EmailSchema, {
      address: t.email,
      type: EmailType.CONFIRMATION
    })] : [];

    const phones = t.phone ? [create(PhoneSchema, {
      number: t.phone,
      type: PhoneType.MOBILE,
      extension: '',
      description: ''
    })] : [];

    contactInfo = create(ContactInfoSchema, {
      emails,
      phones,
      addresses: [],
      links: []
    });
  }

  // Build documents if passport provided
  const documents = [];
  if (t.passportNumber) {
    const doc = create(DocumentSchema, {
      number: t.passportNumber,
      type: DocumentType.PASSPORT,
      expirationDate: t.passportExpiry ? parseDocumentDate(t.passportExpiry) : undefined
    });
    documents.push(doc);
  }

  return create(ExtensiveTravellerSchema, {
    travellerId: index,
    gender: mapGenderType(t.gender),
    firstNames: [t.firstName],
    surnames: [t.lastName],
    contactInfo,
    documents
  });
}

/**
 * Build Price message from amount (EUR with 2 decimals)
 */
function buildPrice(amount: number) {
  // Convert decimal to integer (EUR has 2 decimals)
  const value = Math.round(amount * 100).toString();
  return create(PriceSchema, {
    value,
    decimals: 2,
    currency: create(CurrencySchema, {
      currency: {
        case: 'isoCurrency',
        value: IsoCurrency.EUR
      }
    })
  });
}

/**
 * Format success response for display to the user
 */
function formatSuccessResponse(response: MintSuccessResponse) {
  const mintId = response.mintId?.value || '';
  const validationId = response.validationId?.value || '';

  // Price
  const priceValue = response.price?.value || '0';
  const decimals = response.price?.decimals || 0;
  const amount = decimals > 0 ? parseFloat(priceValue) / Math.pow(10, decimals) : parseFloat(priceValue);

  // Timestamps
  const supplierTimestamp = response.supplierBookingTimestamp
    ? new globalThis.Date(Number(response.supplierBookingTimestamp.seconds) * 1000).toISOString()
    : '';
  const buyableUntil = response.buyableUntil
    ? new globalThis.Date(Number(response.buyableUntil.seconds) * 1000).toISOString()
    : '';

  return {
    success: true,
    booking: {
      mintId,
      validationId,
      supplierReference: response.supplierBookingReference,
      supplierTimestamp,
      price: { amount, currency: 'EUR', decimals },
    },
    blockchain: {
      bookingTokenId: response.bookingTokenId.toString(),
      bookingTokenUri: response.bookingTokenUri,
      mintTransactionHash: response.mintTransactionId?.hash || '',
      buyTransactionHash: response.buyTransactionId?.hash || '',
      buyableUntil,
    },
    cancellable: response.cancellable,
  };
}

/**
 * Create error response
 */
function errorResponse(code: string, message: string) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ success: false, error: { code, message } }, null, 2)
    }]
  };
}

export async function handler(params: Input) {
  try {
    // 1. Validate wallet address is configured
    if (!env.wallet.address) {
      return errorResponse('CONFIG_ERROR', 'CAMINO_WALLET_ADDRESS not configured in environment');
    }

    // 2. Build request header
    const header = create(RequestHeaderSchema, {
      baseHeader: create(HeaderSchema, {
        version: { major: 0, minor: 0, patch: 0 },
        externalSessionId: ''
      })
    });

    // 3. Build travellers array
    const travellers = params.travellers.map((t, i) => buildTraveller(t, i));

    // 4. Build expected price
    const expectedPrice = buildPrice(params.expectedPrice);

    // 5. Build buyer address
    const buyerAddress = create(EVMAddressSchema, {
      address: env.wallet.address
    });

    // 6. Build MintRequest
    const request = create(MintRequestSchema, {
      header,
      validationId: create(UUIDSchema, { value: params.validationId }),
      bookingReference: params.bookingReference || '',
      travellers,
      comment: params.comment || '',
      publicKeys: [],
      buyerAddress,
      expectedPrice
    });

    // 7. Call MintService
    const client = createClient(MintService, transport);
    const response = await client.mint(request);

    // 8. Handle response (oneof)
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
      return errorResponse(
        firstError?.code !== undefined ? String(firstError.code) : 'UNKNOWN_ERROR',
        firstError?.message || 'Booking failed'
      );
    } else {
      return errorResponse('INVALID_RESPONSE', 'Received invalid response from mint service');
    }
  } catch (error) {
    return errorResponse(
      'EXECUTION_ERROR',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}
